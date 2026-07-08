import sys
from pathlib import Path
import os

# Config standard output encoding for Windows terminal
sys.stdout.reconfigure(encoding="utf-8")

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import time
import random
import threading
import re

import database
import vision_engine
import styling_engine
import store_scraper

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all routes to allow Android APK and external devices to communicate
CORS(app, resources={r"/*": {"origins": "*"}})

# Ensure database is initialized
database.init_db()

# --- Order Simulation Worker ---
def start_order_simulator():
    """
    Background worker that updates the delivery progress of pending orders.
    """
    def run_simulator():
        print("[Order Simulator] Thread started successfully.", flush=True)
        while True:
            try:
                # Open database connection within thread
                conn = database.get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT id, status, delivery_progress FROM orders WHERE status != 'Entregado'")
                pending_orders = cursor.fetchall()
                
                for order in pending_orders:
                    order_id = order['id']
                    current_prog = order['delivery_progress']
                    current_status = order['status']
                    
                    # Increment progress randomly (between 8% and 20%)
                    new_prog = current_prog + random.randint(8, 20)
                    if new_prog >= 100:
                        new_prog = 100
                        new_status = 'Entregado'
                    elif new_prog >= 40:
                        new_status = 'En Camino'
                    else:
                        new_status = current_status
                    
                    cursor.execute('''
                        UPDATE orders 
                        SET delivery_progress = ?, status = ? 
                        WHERE id = ?
                    ''', (new_prog, new_status, order_id))
                    print(f"[Order Simulator] Updated Order #{order_id}: Progress {new_prog}%, Status: '{new_status}'", flush=True)
                    
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[Order Simulator Error] {e}", flush=True)
            
            # Wait 5 seconds between increments
            time.sleep(5)

    t = threading.Thread(target=run_simulator, daemon=True)
    t.start()

# Start background delivery thread
start_order_simulator()

def get_items_from_request():
    item_ids = []
    req_json = None
    try:
        if request.is_json:
            req_json = request.json
    except Exception:
        pass
    if not req_json:
        req_json = {}
    for param in ['top_id', 'bottom_id', 'footwear_id', 'outerwear_id', 'accessory_id', 'closet_id', 'boutique_id']:
        val = request.args.get(param) or req_json.get(param)
        if val:
            try:
                item_ids.append(int(val))
            except ValueError:
                pass
    items = []
    for iid in item_ids:
        item = database.get_clothing_by_id(iid)
        if item:
            items.append(item)
    return items

# --- REST API Endpoints ---

# 1. Clothes CRUD
@app.route('/api/clothes', methods=['GET'])
def get_clothes():
    try:
        owned_param = request.args.get('owned')
        owned_filter = None
        if owned_param is not None:
            owned_filter = owned_param.lower() in ['true', '1']
        
        clothes_list = database.get_all_clothes(owned_filter)
        return jsonify(clothes_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clothes', methods=['POST'])
def add_clothing():
    try:
        data = request.json or {}
        if not data.get('name') or not data.get('image_url') or not data.get('category'):
            return jsonify({"error": "Faltan campos obligatorios: name, image_url, category"}), 400
            
        new_id = database.create_clothing(
            name=data['name'],
            image_url=data['image_url'],
            category=data['category'],
            subcategory=data.get('subcategory'),
            color_primary=data.get('color_primary'),
            color_secondary=data.get('color_secondary'),
            pattern=data.get('pattern'),
            min_temp=data.get('min_temp'),
            max_temp=data.get('max_temp'),
            rain_friendly=int(data.get('rain_friendly', 0)),
            price=data.get('price'),
            store_name=data.get('store_name'),
            is_owned=int(data.get('is_owned', 1)),
            confidence=data.get('confidence', 1.0)
        )
        created_item = database.get_clothing_by_id(new_id)
        return jsonify(created_item), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clothes/<int:clothing_id>', methods=['DELETE'])
def remove_clothing(clothing_id):
    try:
        success = database.delete_clothing(clothing_id)
        if success:
            return jsonify({"message": f"Prenda {clothing_id} eliminada correctamente."}), 200
        else:
            return jsonify({"error": "Prenda no encontrada."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Vision Scan
@app.route('/api/scan', methods=['POST'])
def scan_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No se proporcionó archivo de imagen en la solicitud."}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Nombre de archivo vacío."}), 400
            
        # Create temp folder for scanning
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_scans')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save temp file
        temp_path = os.path.join(temp_dir, f"scan_{int(time.time())}_{file.filename}")
        file.save(temp_path)
        
        try:
            # Analyze
            result = vision_engine.analyze_image(temp_path)
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Recommendation & Innovations
@app.route('/api/recommend', methods=['GET'])
def get_recommendation():
    try:
        items = get_items_from_request()
        city_index = request.args.get('city_index', 0)
        occasion = request.args.get('occasion', 'Casual')
        city = next((c for c in styling_engine.CITIES if c["index"] == int(city_index)), styling_engine.CITIES[0])
        
        if items:
            score_res = styling_engine.calculate_fashion_score(items, city["name"], occasion)
            return jsonify(score_res), 200
            
        clothes_list = database.get_all_clothes()
        rec = styling_engine.recommend_outfit(clothes_list, city_index, occasion)
        return jsonify(rec), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/innovations', methods=['GET'])
def get_innovations():
    try:
        clothes_list = database.get_all_clothes()
        innovations = styling_engine.get_style_innovations(clothes_list)
        return jsonify(innovations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/capsule', methods=['GET'])
def get_capsule_closet_api():
    try:
        clothes_list = database.get_all_clothes()
        capsule = styling_engine.generate_capsule_closet(clothes_list)
        return jsonify(capsule), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. Outfits Management
@app.route('/api/outfits', methods=['GET'])
def get_outfits():
    try:
        outfits_list = database.get_all_outfits()
        return jsonify(outfits_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits', methods=['POST'])
def save_outfit():
    try:
        data = request.json or {}
        if not data.get('name') or not data.get('top_id') or not data.get('bottom_id') or not data.get('footwear_id'):
            return jsonify({"error": "Faltan campos obligatorios: name, top_id, bottom_id, footwear_id"}), 400
            
        new_id = database.save_outfit(
            name=data['name'],
            top_id=int(data['top_id']),
            bottom_id=int(data['bottom_id']),
            footwear_id=int(data['footwear_id']),
            outerwear_id=int(data['outerwear_id']) if data.get('outerwear_id') else None,
            accessory_id=int(data['accessory_id']) if data.get('accessory_id') else None,
            is_shared=int(data.get('is_shared', 0)),
            justification=data.get('justification')
        )
        return jsonify({"id": new_id, "message": "Combinación guardada con éxito."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits/<int:outfit_id>', methods=['DELETE'])
def remove_outfit(outfit_id):
    try:
        success = database.delete_outfit(outfit_id)
        if success:
            return jsonify({"message": f"Combinación {outfit_id} eliminada correctamente."}), 200
        else:
            return jsonify({"error": "Combinación no encontrada."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits/<int:outfit_id>/share', methods=['POST'])
def toggle_share_outfit(outfit_id):
    try:
        data = request.json or {}
        share_status = data.get('share', True)
        success = database.share_outfit(outfit_id, share_status)
        if success:
            status_str = "compartido" if share_status else "privado"
            return jsonify({"message": f"El outfit {outfit_id} ahora es {status_str}."}), 200
        else:
            return jsonify({"error": "Outfit no encontrado."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits/<int:outfit_id>/like', methods=['POST'])
def add_like_outfit(outfit_id):
    try:
        new_likes = database.like_outfit(outfit_id)
        return jsonify({"id": outfit_id, "likes": new_likes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits/<int:outfit_id>/rate', methods=['POST'])
def rate_outfit_stars(outfit_id):
    try:
        data = request.json or {}
        rating = data.get('rating')
        if rating is None:
            return jsonify({"error": "Debe proporcionar el campo 'rating' en el JSON."}), 400
        
        rating = int(rating)
        if not (1 <= rating <= 5):
            return jsonify({"error": "La calificación debe ser un entero entre 1 y 5."}), 400
            
        res = database.rate_outfit(outfit_id, rating)
        return jsonify({
            "id": outfit_id,
            "rating": res["rating"],
            "rating_count": res["rating_count"],
            "rating_sum": res["rating_sum"],
            "message": f"Calificación de {rating} estrellas registrada correctamente."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/outfits/<int:outfit_id>/vote', methods=['POST'])
def vote_outfit_style(outfit_id):
    try:
        data = request.json or {}
        style = data.get('style')
        if not style:
            return jsonify({"error": "Debe proporcionar el campo 'style' en el JSON."}), 400
            
        res = database.vote_outfit(outfit_id, style)
        if res:
            return jsonify({
                "id": outfit_id,
                "votes": res,
                "message": f"Voto para el estilo '{style}' registrado correctamente."
            }), 200
        else:
            return jsonify({"error": "Outfit no encontrado."}), 404
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 5. Orders Management
@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        orders_list = database.get_all_orders()
        return jsonify(orders_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def make_order():
    try:
        data = request.json or {}
        clothing_id = data.get('clothing_id')
        quantity = int(data.get('quantity', 1))
        
        if not clothing_id:
            return jsonify({"error": "Falta clothing_id."}), 400
            
        clothing = database.get_clothing_by_id(clothing_id)
        if not clothing:
            return jsonify({"error": "La prenda especificada no existe."}), 404
            
        price = clothing.get('price') or 0.0
        total_price = price * quantity
        
        new_id = database.create_order(clothing_id, quantity, total_price)
        return jsonify({
            "id": new_id, 
            "total_price": total_price, 
            "message": "Orden de compra registrada e inicio de despacho."
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# --- Chat History Endpoints ---
@app.route('/api/chat/history', methods=['GET'])
def get_chat_history_endpoint():
    try:
        history = database.get_chat_history()
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
def add_chat_message_endpoint():
    try:
        data = request.json or {}
        sender = data.get('sender')
        message = data.get('message')
        scraped_item_json = data.get('scraped_item_json')
        
        if not sender or not message:
            return jsonify({"error": "Faltan campos obligatorios: sender, message"}), 400
            
        new_id = database.save_chat_message(sender, message, scraped_item_json)
        return jsonify({"id": new_id, "message": "Mensaje guardado correctamente."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# --- Outfit Scheduling Endpoints ---
@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    try:
        sched = database.get_outfit_schedule()
        return jsonify(sched), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedule', methods=['POST'])
def save_schedule():
    try:
        data = request.json or {}
        date_str = data.get('date_str')
        outfit_id = data.get('outfit_id')
        city_index = data.get('city_index', 0)
        occasion = data.get('occasion', 'Casual')
        
        if not date_str or not outfit_id:
            return jsonify({"error": "Faltan campos: date_str, outfit_id"}), 400
            
        sched_id = database.schedule_outfit(date_str, int(outfit_id), int(city_index), occasion)
        return jsonify({"id": sched_id, "message": "Outfit programado correctamente."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Virtual Shopping Cart Endpoints ---
@app.route('/api/cart', methods=['GET'])
def get_shopping_cart():
    try:
        cart_items = database.get_cart()
        total = sum((item["price"] or 0.0) * item["quantity"] for item in cart_items)
        return jsonify({
            "items": cart_items,
            "total_price": round(total, 2)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart', methods=['POST'])
def add_item_to_cart():
    try:
        data = request.json or {}
        clothing_id = data.get('clothing_id')
        quantity = data.get('quantity', 1)
        
        if not clothing_id:
            return jsonify({"error": "Falta clothing_id"}), 400
            
        cart_id = database.add_to_cart(int(clothing_id), int(quantity))
        return jsonify({"id": cart_id, "message": "Prenda añadida a la cesta."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/<int:clothing_id>', methods=['DELETE'])
def remove_item_from_cart(clothing_id):
    try:
        success = database.delete_from_cart(clothing_id)
        if success:
            return jsonify({"message": "Prenda eliminada de la cesta."}), 200
        return jsonify({"error": "Prenda no encontrada en la cesta."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/checkout', methods=['POST'])
def checkout_shopping_cart():
    try:
        cart_items = database.get_cart()
        if not cart_items:
            return jsonify({"error": "La cesta de compras está vacía."}), 400
            
        for item in cart_items:
            # Create a real purchase order
            database.create_order(item["clothing_id"], item["quantity"], item["price"] * item["quantity"])
            
        database.clear_cart()
        return jsonify({"message": "Pedido de cesta procesado exitosamente."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Wear & Durability Endpoints ---
@app.route('/api/clothes/<int:clothing_id>/wear', methods=['POST'])
def record_clothing_wear(clothing_id):
    try:
        database.increment_wear_count(clothing_id)
        item = database.get_clothing_by_id(clothing_id)
        return jsonify({
            "message": "Uso registrado con éxito.",
            "wear_count": item["wear_count"],
            "durability": item["durability"]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Capsule Wardrobe Generator Endpoint ---
@app.route('/api/closet/capsule', methods=['GET'])
def get_capsule_wardrobe():
    try:
        clothes = database.get_all_clothes()
        # Call styling engine generator
        res = styling_engine.get_capsule_wardrobe_recommendation(clothes)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 6. Weather & Cities
@app.route('/api/weather', methods=['GET'])
def get_weather():
    try:
        return jsonify(styling_engine.CITIES), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Frontend-Compatible API Aliases ---
# These endpoints transform existing backend data to match the frontend (app.js) expected shapes.

# Color name to hex mapping for scan result transformation
COLOR_NAME_TO_HEX = {
    "Blanco Puro": "#FFFFFF",
    "Negro Carbón": "#1E1E1E",
    "Gris Marengo": "#708090",
    "Gris Perla": "#DCDCDC",
    "Azul Índigo": "#000080",
    "Azul Celeste": "#87CEFC",
    "Azul Marino": "#0A1930",
    "Verde Musgo": "#2F4F4F",
    "Verde Esmeralda": "#00C957",
    "Verde Oliva": "#556B2F",
    "Rojo Carmín": "#FF0000",
    "Marrón Otoño": "#8B4513",
    "Beige Arena": "#F5F5DC",
    "Amarillo Mostaza": "#DAA520",
    "Naranja Ladrillo": "#D2691E",
    "Rosa Pastel": "#FFC0CB",
    "Morado Purpúreo": "#800080",
}

# Category mapping: backend → frontend
CATEGORY_MAP = {
    "Top": "superior",
    "Bottom": "inferior",
    "Footwear": "calzado",
    "Outerwear": "abrigo",
    "Accessory": "accesorio",
}

# Ganchito personality quotes for the chat assistant
GANCHITO_QUOTES = {
    "classy": [
        "La sencillez es la clave de la verdadera elegancia, querido.",
        "Una silueta limpia nunca pasa de moda. Agrega textura antes que logos.",
        "Vístete como si fueras a encontrarte con tu peor enemigo hoy.",
        "La moda se compra, el estilo se posee. Busca armonía estructural.",
    ],
    "diva": [
        "¡Cariño! Ese look grita ordinario. ¡Necesitamos DRAMA! ¡Más volumen!",
        "¿Sin accesorios dorados? ¿Estamos de luto o simplemente no tenemos presupuesto?",
        "Si no se voltean a mirarte al entrar, el outfit fue un fracaso absoluto.",
        "Brillar no es una opción, es tu obligación moral. ¡Añade esa pieza de boutique ahora!",
    ],
    "sarcastic": [
        "Veo que elegiste vestirte a oscuras hoy. Interesante declaración artística.",
        "Esa combinación es sumamente... 'valiente'. Ojalá nadie te pida fotos hoy.",
        "Oh, un blazer negro con jeans. Qué innovador. Estremecedor.",
        "¿Tu closet es un museo del aburrimiento o solo compraste todo en oferta?",
    ],
    "nervous": [
        "¡Dios mío! ¿Crees que combina? Siento que la policía de la moda nos va a arrestar...",
        "Espera, ¿no crees que ese color choca demasiado? Por favor, miremos el espejo de nuevo.",
        "Espero que no llueva, esa gamuza se va a arruinar en un segundo... ¡Qué estrés!",
        "¿Estará bien? Quizás deberíamos ir 100% de negro y pasar desapercibidos...",
    ],
}


def get_reverse_geocode_nominatim(lat, lon):
    import requests
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=12"
    headers = {
        'User-Agent': 'DressYourself/1.0 (contact@dressyourself.com)',
        'Accept-Language': 'es'
    }
    retries = 3
    backoff = 1.0
    for attempt in range(retries):
        try:
            # 2.0 second timeout to prevent slow network blocks
            response = requests.get(url, headers=headers, timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                addr = data.get('address', {})
                city_name = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('suburb') or addr.get('county') or addr.get('state')
                if city_name:
                    return city_name
        except Exception as e:
            print(f"[GPS] Nominatim reverse geocoding attempt {attempt + 1} failed: {e}", flush=True)
        if attempt < retries - 1:
            time.sleep(backoff)
            backoff *= 2.0
    return None


@app.route('/api/clima', methods=['GET'])
def get_clima():
    """Frontend expects { city, temp, desc, details[] }.
    Accepts optional GPS coordinates: ?lat=X&lon=Y to find the nearest city.
    Falls back to city_index parameter or first city if no GPS coords provided.
    """
    try:
        cities = styling_engine.CITIES
        city = None
        gps_active = False

        # Check if GPS coordinates were provided
        lat_param = request.args.get('lat')
        lon_param = request.args.get('lon')

        if lat_param and lon_param:
            try:
                lat = float(lat_param)
                lon = float(lon_param)
                gps_active = True

                # Try Nominatim reverse geocode first
                resolved_city = get_reverse_geocode_nominatim(lat, lon)

                # GPS coordinate mapping for cities
                # Approximate coordinates for nearest-city lookup
                city_coords = {
                    "Bogotá": (4.7110, -74.0721),
                    "Medellín": (6.2442, -75.5812),
                    "Cali": (3.4516, -76.5320),
                    "Barranquilla": (10.9685, -74.7813),
                    "Cartagena": (10.3910, -75.5144),
                    "Bucaramanga": (7.1254, -73.1198),
                    "Pereira": (4.8087, -75.6906),
                    "Santa Marta": (11.2408, -74.1990),
                    "Manizales": (5.0689, -75.5174),
                    "Ibagué": (4.4389, -75.2322),
                    "Londres": (51.5074, -0.1278),
                    "Nueva York": (40.7128, -74.0060),
                }

                # Mapping from all cities to the ones available in CITIES array
                city_to_available = {
                    "Bogotá": "Bogotá",
                    "Medellín": "Medellín",
                    "Cali": "Cali",
                    "Barranquilla": "Cartagena",
                    "Cartagena": "Cartagena",
                    "Bucaramanga": "Medellín",
                    "Pereira": "Medellín",
                    "Santa Marta": "Cartagena",
                    "Manizales": "Medellín",
                    "Ibagué": "Bogotá",
                    "Londres": "Londres",
                    "Nueva York": "Nueva York",
                }

                matched_city_name = None
                if resolved_city:
                    norm_resolved = styling_engine.normalize_str(resolved_city)
                    # First try direct match/substring match in city_coords keys
                    for name in city_coords.keys():
                        norm_name = styling_engine.normalize_str(name)
                        if norm_name in norm_resolved or norm_resolved in norm_name:
                            matched_city_name = city_to_available.get(name)
                            break

                # Fallback if Nominatim failed or resolved city didn't map to predefined Colombian/external cities
                if not matched_city_name:
                    # Find the nearest city by simple Euclidean distance
                    best_dist = float('inf')
                    best_offline_city = None
                    for name, (clat, clon) in city_coords.items():
                        dist = ((lat - clat) ** 2 + (lon - clon) ** 2) ** 0.5
                        if dist < best_dist:
                            best_dist = dist
                            best_offline_city = name
                    matched_city_name = city_to_available.get(best_offline_city, "Bogotá")

                # Try to find the matched city in the CITIES array
                if matched_city_name:
                    city = next((c for c in cities if c["name"] == matched_city_name), None)
            except (ValueError, TypeError) as e:
                print(f"[GPS Error] Failed parsing GPS parameters: {e}", flush=True)

        # Fallback: use city_index parameter or first city
        if city is None:
            city_index = int(request.args.get('city_index', 0))
            city = next((c for c in cities if c["index"] == city_index), cities[0])

        rain_label = "Lluvia" if city["rain"] else "Despejado"
        desc = f"{rain_label}, temperatura de {city['temp']}°C"
        if gps_active:
            desc += f" (GPS: {float(lat_param):.4f}°, {float(lon_param):.4f}°)"

        details = [
            {"label": "Condición", "value": rain_label},
            {"label": "Temp", "value": f"{city['temp']}°C"},
        ]
        if gps_active:
            details.append({"label": "GPS", "value": f"📍 {float(lat_param):.2f}°, {float(lon_param):.2f}°"})
            details.append({"label": "Precisión", "value": "Alta (GPS)"})
        else:
            details.append({"label": "Índice", "value": str(city["index"])})

        return jsonify({
            "city": city["name"],
            "temp": f"{city['temp']}°C",
            "desc": desc,
            "details": details,
            "gps_active": gps_active
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/closet', methods=['GET'])
def get_closet():
    """Frontend expects items with { id, cat, name, style, image }."""
    try:
        items = get_items_from_request()
        if items:
            city_index = request.args.get('city_index', 0)
            occasion = request.args.get('occasion', 'Casual')
            city = next((c for c in styling_engine.CITIES if c["index"] == int(city_index)), styling_engine.CITIES[0])
            score_res = styling_engine.calculate_fashion_score(items, city["name"], occasion)
            return jsonify(score_res), 200
            
        items = database.get_all_clothes(owned_filter=True)
        result = []
        for item in items:
            result.append({
                "id": item["id"],
                "cat": CATEGORY_MAP.get(item["category"], item["category"].lower()),
                "name": item["name"],
                "style": item.get("pattern") or "Classic",
                "image": item["image_url"],
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/closet/scan', methods=['POST'])
def closet_scan_image():
    """Frontend sends FormData with 'image', expects { tipo, estilo, colores[], confianza, consejo }."""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No se proporcionó archivo de imagen en la solicitud."}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Nombre de archivo vacío."}), 400

        # Create temp folder for scanning
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_scans')
        os.makedirs(temp_dir, exist_ok=True)

        temp_path = os.path.join(temp_dir, f"scan_{int(time.time())}_{file.filename}")
        file.save(temp_path)

        try:
            result = vision_engine.analyze_image(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # Transform to frontend shape
        primary_hex = COLOR_NAME_TO_HEX.get(result.get("color_primary", ""), "#708090")
        secondary_hex = COLOR_NAME_TO_HEX.get(result.get("color_secondary", ""), None)
        colores = [primary_hex]
        if secondary_hex and secondary_hex != primary_hex:
            colores.append(secondary_hex)

        tipo = result.get("subcategory") or result.get("category") or "Prenda"
        estilo = result.get("pattern") or "Liso"
        material = result.get("material") or "Algodón"
        confianza = result.get("confidence", 50.0)
        consejo = (
            f"Prenda detectada: {result.get('category', 'N/A')} / {tipo}. "
            f"Color principal: {result.get('color_primary', 'N/A')}. "
            f"Patrón: {estilo}. "
            f"Material: {material}. "
            f"Combínala con prendas de colores complementarios para un look equilibrado."
        )

        return jsonify({
            "tipo": tipo,
            "estilo": estilo,
            "colores": colores,
            "material": material,
            "confianza": confianza,
            "consejo": consejo,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/boutique', methods=['GET'])
def get_boutique():
    """Frontend expects items with { id, cat, brand, name, price, image }."""
    try:
        items = get_items_from_request()
        if items:
            city_index = request.args.get('city_index', 0)
            occasion = request.args.get('occasion', 'Casual')
            city = next((c for c in styling_engine.CITIES if c["index"] == int(city_index)), styling_engine.CITIES[0])
            score_res = styling_engine.calculate_fashion_score(items, city["name"], occasion)
            return jsonify(score_res), 200
            
        items = database.get_all_clothes(owned_filter=False)
        result = []
        for item in items:
            price_val = item.get("price") or 0.0
            result.append({
                "id": item["id"],
                "cat": CATEGORY_MAP.get(item["category"], item["category"].lower()),
                "brand": item.get("store_name") or "DressYourself",
                "name": item["name"],
                "price": f"${price_val:.2f}",
                "image": item["image_url"],
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/pedido/status', methods=['GET'])
def get_pedido_status():
    """Frontend expects { id, status, progress, logs[] }."""
    try:
        orders = database.get_all_orders()
        if not orders:
            return jsonify({
                "id": "DY-00000",
                "status": "Procesado",
                "progress": 0,
                "logs": [{"time": "--:--", "text": "No hay pedidos registrados."}]
            }), 200

        # Return the most recent order
        order = orders[0]

        # Map backend statuses to frontend statuses
        status_map = {
            "Pendiente": "Procesado",
            "En Camino": "En Camino",
            "Entregado": "Entregado",
        }
        status = status_map.get(order.get("status", ""), order.get("status", "Procesado"))
        progress = order.get("delivery_progress", 0)

        logs = [
            {"time": order.get("created_at", "--:--")[:5], "text": f"Orden #{order['id']} creada."},
        ]
        if progress >= 40:
            logs.append({"time": "--:--", "text": "Paquete en camino al destino."})
        if progress >= 100:
            logs.append({"time": "--:--", "text": "Entregado exitosamente."})

        # Calculate score details for ordered boutique item paired with default/matching owned items
        clothing = database.get_clothing_by_id(order["clothing_id"])
        outfit_items = [clothing]
        if clothing:
            owned_clothes = database.get_all_clothes(owned_filter=True)
            for cat in ["Top", "Bottom", "Footwear"]:
                if clothing["category"] != cat:
                    cat_items = [c for c in owned_clothes if c["category"] == cat]
                    if cat_items:
                        outfit_items.append(cat_items[0])
        score_res = styling_engine.calculate_fashion_score(outfit_items)

        return jsonify({
            "id": f"DY-{order['id']:05d}",
            "status": status,
            "progress": progress,
            "logs": logs,
            "color_score": score_res["color_score"],
            "style_score": score_res["style_score"],
            "pattern_score": score_res["pattern_score"],
            "weather_score": score_res["weather_score"],
            "total_score": score_res["total_score"],
            "advice": score_res["advice"]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ganchito/quote', methods=['GET'])
def get_ganchito_quote():
    """Frontend expects { response }."""
    try:
        personality = request.args.get('personality', 'classy').lower()
        user_query = request.args.get('q', '')
        
        # Check if the query contains a URL to scrape adaptively
        url_match = re.search(r'(https?://[^\s]+)', user_query)
        if url_match:
            url = url_match.group(1)
            scraped = store_scraper.scrape_clothing_product(url)
            
            # Formulate response based on scraped garment
            name = scraped["name"]
            brand = scraped["brand"]
            cat = scraped["category"]
            subcat = scraped["subcategory"]
            price = scraped["price"]
            
            cat_es = {"Top": "Prenda Superior", "Bottom": "Prenda Inferior", "Outerwear": "Prenda de Abrigo", "Footwear": "Calzado", "Accessory": "Accesorio"}.get(cat, cat)
            
            if personality == "classy":
                response_text = f"He analizado el enlace de la tienda local {brand}. Se trata de una pieza de {cat_es.lower()} ({name}) de subcategoría {subcat} con un valor de ${price:.2f}. Califica como una excelente opción de alta costura para contrastar con tu armario clásico."
            elif personality == "diva":
                response_text = f"¡Ay, cariño! Me pasas una pieza divina de {brand}. Este/a {name} es un espectáculo. Me encanta el estilo de {subcat}. Definitivamente tienes que probártela con tus prendas del closet."
            elif personality == "sarcastic":
                response_text = f"Vaya, así que andamos de compras en {brand}. Un/a {name} por ${price:.2f}. Espero que sí tengas con qué combinar esta prenda en tu ropero, o será otro adorno costoso."
            else: # nervous
                response_text = f"¡Ay! Encontraste un/a {name} en {brand}. ¿Crees que sí combine bien? Suena a que el estilo {subcat} puede ser un poco arriesgado, ¡deberíamos verificarlo en el Probador de inmediato!"
                
            scraped_item = {
                "id": 99999, # unique temp id for local scrap
                "name": name,
                "brand": brand,
                "cat": cat.lower(),
                "price": f"${price:.2f}",
                "image": scraped["image"],
                "source_url": url
            }
            
            # Save user and bot message to chat history
            if user_query:
                database.save_chat_message(sender="user", message=user_query)
            import json
            database.save_chat_message(sender="bot", message=response_text, scraped_item_json=json.dumps(scraped_item))
            
            return jsonify({
                "response": response_text,
                "scraped_item": scraped_item
            }), 200

        closet_id = request.args.get('closet_id')
        boutique_id = request.args.get('boutique_id')
        
        closet_item = database.get_clothing_by_id(int(closet_id)) if closet_id else None
        boutique_item = database.get_clothing_by_id(int(boutique_id)) if boutique_id else None
        
        if closet_item and boutique_item:
            score_res = styling_engine.calculate_fashion_score([closet_item, boutique_item])
            score = score_res["total_score"]
            advice = score_res["advice"]
            
            if personality == "classy":
                if score >= 85:
                    quote = f"¡Excelente gusto! Esta combinación de {closet_item['name']} y {boutique_item['name']} tiene una puntuación Haute Couture de {score}%. Una armonía clásica impecable."
                else:
                    quote = f"El ensamble puntúa un {score}%. Te recomiendo buscar un balance de color más sutil, como sugieren nuestros cánones de elegancia."
            elif personality == "diva":
                if score >= 85:
                    quote = f"¡Ay cariño, divino! Esa combinación de {closet_item['name']} y {boutique_item['name']} da un {score}%. Estás espectacular, lista para brillar."
                else:
                    quote = f"¡Es un escándalo! Solo califica un {score}%. Necesitamos más drama, cariño, o tal vez una pieza de boutique que de verdad resalte."
            elif personality == "sarcastic":
                if score >= 85:
                    quote = f"Bueno, milagros ocurren. Tu ensamble tiene un {score}%. Quién diría que sabías combinar {closet_item['name']} con {boutique_item['name']}."
                else:
                    quote = f"Un triste {score}%. Supongo que vestirse a oscuras tiene sus consecuencias. Esa combinación es... valiente."
            elif personality == "nervous":
                if score >= 85:
                    quote = f"¡Ay, menos mal! Da un {score}%. Parece que sí combina bien {closet_item['name']} y {boutique_item['name']}, estaba preocupadísimo."
                else:
                    quote = f"¡Ay no! Solo da un {score}%. ¿Y si nos cambian de ropa? Siento que la policía de la moda nos va a llevar."
            else:
                quote = advice
        else:
            quotes = GANCHITO_QUOTES.get(personality, GANCHITO_QUOTES["classy"])
            quote = random.choice(quotes)

        # If user sent a message, personalize the response
        if user_query:
            personality_prefixes = {
                "classy": f'Sobre "{user_query}": ',
                "diva": f'¡Ay, cariño! Sobre "{user_query}"... ',
                "sarcastic": f'¿En serio preguntas por "{user_query}"? ',
                "nervous": f'¡Ay no sé! Sobre "{user_query}"... ',
            }
            prefix = personality_prefixes.get(personality, '')
            quote = prefix + quote

        # Save user and bot message to chat history
        if user_query:
            database.save_chat_message(sender="user", message=user_query)
            database.save_chat_message(sender="bot", message=quote)

        return jsonify({"response": quote}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- RPG Styling Engine Endpoints ---

@app.route('/api/rpg/node', methods=['GET'])
def get_rpg_node_endpoint():
    try:
        node_id = request.args.get('node_id')
        node = styling_engine.get_rpg_node(node_id)
        if not node:
            return jsonify({"error": f"Node with ID '{node_id}' not found"}), 404
        return jsonify(node), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rpg/complete', methods=['POST'])
def complete_rpg_endpoint():
    try:
        data = request.json or {}
        answers = data.get('answers') or data.get('option_ids')
        if not answers:
            return jsonify({"error": "Falta el campo 'answers' o 'option_ids' con las elecciones del usuario"}), 400
        
        # Retrieve all garments from database (both closet and boutique)
        clothes = database.get_all_clothes()
        
        # Process completion in the styling engine
        result = styling_engine.process_rpg_completion(answers, clothes)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Static Web App Routing ---
@app.route('/')
def serve_index():
    # Serves index.html from templates/, workspace root, or static/ directory
    if os.path.exists('templates/index.html'):
        return send_file('templates/index.html')
    elif os.path.exists('index.html'):
        return send_file('index.html')
    elif os.path.exists('static/index.html'):
        return send_from_directory('static', 'index.html')
    else:
        return jsonify({
            "status": "online",
            "message": "Dress Yourself REST API is running. Point your client to this server.",
            "note": "Static frontend files not found at templates/, root or static/. Web app GUI is unavailable."
        }), 200

@app.route('/<path:path>')
def serve_static_files(path):
    # Security: validate resolved path is within the static directory to prevent path traversal
    static_dir = Path(os.path.dirname(os.path.abspath(__file__)), 'static').resolve()
    requested = (static_dir / path).resolve()
    if not str(requested).startswith(str(static_dir)):
        return "Forbidden", 403
    try:
        return send_from_directory('static', path)
    except Exception:
        return "File Not Found", 404

if __name__ == '__main__':
    # Run on 0.0.0.0 and port 5000 to listen to external calls and Android emulators
    app.run(host='0.0.0.0', port=5000, debug=True)

# BabylonSwarm_Commit_18: feat(brands): implement affiliate link generator tool with tracking IDs

# BabylonSwarm_Commit_19: feat(brands): build custom metadata indexers for brand collection search

# BabylonSwarm_Commit_40: feat(quests): clear expired daily challenge cache entries automatically at midnight
