import os
import uuid
import logging
from pathlib import Path

logger = logging.getLogger("StorageService")

storage_initialized = False
try:
    from firebase_admin import storage
    storage_initialized = True
except Exception as e:
    logger.info(f"Firebase Storage SDK fallback active: {e}")

UPLOAD_DIR = Path(__file__).parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def upload_image(file_bytes_or_path, filename="garment.jpg", firebase_uid="dev_user_123", content_type="image/jpeg"):
    """
    Uploads image to Firebase Storage if bucket configured, else saves locally under static/uploads/.
    Returns public/relative URL.
    """
    unique_filename = f"{firebase_uid}_{uuid.uuid4().hex[:8]}_{filename}"
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")

    if storage_initialized and bucket_name:
        try:
            bucket = storage.bucket(name=bucket_name)
            blob = bucket.blob(f"wardrobe/{firebase_uid}/{unique_filename}")
            if isinstance(file_bytes_or_path, (str, Path)):
                blob.upload_from_filename(str(file_bytes_or_path), content_type=content_type)
            else:
                blob.upload_from_string(file_bytes_or_path, content_type=content_type)
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error(f"Cloud storage upload error: {e}. Fallback to local static.")

    local_path = UPLOAD_DIR / unique_filename
    if isinstance(file_bytes_or_path, (str, Path)):
        with open(file_bytes_or_path, "rb") as f_in, open(local_path, "wb") as f_out:
            f_out.write(f_in.read())
    else:
        with open(local_path, "wb") as f:
            f.write(file_bytes_or_path)

    relative_url = f"/static/uploads/{unique_filename}"
    return relative_url

def save_image_local(image_bytes, filename="processed.png"):
    return upload_image(image_bytes, filename=filename, content_type="image/png")
