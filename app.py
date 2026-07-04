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

import database
import vision_engine
import styling_engine

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
        city_index = request.args.get('city_index', 0)
        occasion = request.args.get('occasion', 'Casual')
        
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


@app.route('/api/clima', methods=['GET'])
def get_clima():
    """Frontend expects { city, temp, desc, details[] }."""
    try:
        city_index = int(request.args.get('city_index', 0))
        cities = styling_engine.CITIES
        city = next((c for c in cities if c["index"] == city_index), cities[0])

        rain_label = "Lluvia" if city["rain"] else "Despejado"
        return jsonify({
            "city": city["name"],
            "temp": f"{city['temp']}°C",
            "desc": f"{rain_label}, temperatura de {city['temp']}°C",
            "details": [
                {"label": "Condición", "value": rain_label},
                {"label": "Temp", "value": f"{city['temp']}°C"},
                {"label": "Índice", "value": str(city["index"])},
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/closet', methods=['GET'])
def get_closet():
    """Frontend expects items with { id, cat, name, style, image }."""
    try:
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
        confianza = result.get("confidence", 50.0)
        consejo = (
            f"Prenda detectada: {result.get('category', 'N/A')} / {tipo}. "
            f"Color principal: {result.get('color_primary', 'N/A')}. "
            f"Patrón: {estilo}. "
            f"Combínala con prendas de colores complementarios para un look equilibrado."
        )

        return jsonify({
            "tipo": tipo,
            "estilo": estilo,
            "colores": colores,
            "confianza": confianza,
            "consejo": consejo,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/boutique', methods=['GET'])
def get_boutique():
    """Frontend expects items with { id, cat, brand, name, price, image }."""
    try:
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

        return jsonify({
            "id": f"DY-{order['id']:05d}",
            "status": status,
            "progress": progress,
            "logs": logs,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ganchito/quote', methods=['GET'])
def get_ganchito_quote():
    """Frontend expects { response }."""
    try:
        personality = request.args.get('personality', 'classy').lower()
        user_query = request.args.get('q', '')

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

        return jsonify({"response": quote}), 200
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
