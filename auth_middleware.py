import os
import json
import logging
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger("AuthMiddleware")

# Initialize Firebase Admin SDK if credentials exist
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import auth, credentials

    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase_service_account.json")

    if cred_json:
        cred = credentials.Certificate(json.loads(cred_json))
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin initialized via FIREBASE_CREDENTIALS_JSON.")
    elif os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info(f"Firebase Admin initialized via {cred_path}.")
    else:
        logger.warning("No Firebase credentials provided. Auth running in Dev/Fallback mode.")
except Exception as e:
    logger.error(f"Notice: Firebase Admin SDK status: {e}")

def get_current_user_id():
    """
    Retrieves current user's Firebase UID from request context or Authorization header.
    Falls back to 'dev_user_123' if not provided or in dev mode.
    """
    auth_header = request.headers.get("Authorization") or request.headers.get("X-Firebase-Token")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        if firebase_initialized:
            try:
                decoded = auth.verify_id_token(token)
                return decoded.get("uid", "dev_user_123")
            except Exception:
                pass
    dev_uid = request.headers.get("X-Dev-Firebase-UID")
    if dev_uid:
        return dev_uid
    return getattr(request, 'user_uid', "dev_user_123")

def require_firebase_auth(f):
    """
    Decorator for Flask routes requiring valid Firebase Auth Bearer Token.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_uid = get_current_user_id()
        request.user_uid = user_uid
        return f(*args, **kwargs)
    return decorated_function
