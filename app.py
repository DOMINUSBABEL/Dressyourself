import sys
import os
import urllib.request
import json

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

# --- Order & Price Simulation Worker ---
def start_order_simulator():
    """
    Background worker that updates delivery progress of pending orders
    and periodically simulates price drops on boutique items.
    """
    def run_simulator():
        print("[Simulator] Thread started successfully.", flush=True)
        tick = 0
        while True:
            try:
                # Open database connection within thread
                conn = database.get_db_connection()
                cursor = conn.cursor()
                
                # 1. Order delivery simulation (every 5 seconds)
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

                # 2. Price drop simulation (every 30 seconds / 6 ticks)
                if tick % 6 == 0:
                    cursor.execute("SELECT id, name, price, original_price FROM clothes WHERE is_owned = 0")
                    boutique_items = [dict(row) for row in cursor.fetchall()]
                    if boutique_items and random.random() < 0.5:
                        item = random.choice(boutique_items)
                        discount_pct = random.randint(15, 30)
                        orig_price = item['original_price'] if item['original_price'] is not None else item['price']
                        new_price = round(orig_price * (1 - discount_pct / 100.0), 2)
                        
                        # Update price and insert into history
                        cursor.execute("UPDATE clothes SET price = ?, original_price = ? WHERE id = ?", (new_price, orig_price, item['id']))
                        cursor.execute("INSERT INTO price_history (clothing_id, price) VALUES (?, ?)", (item['id'], new_price))
                        conn.commit()
                        print(f"[Price Simulator] Item '{item['name']}' rebajado {discount_pct}% a ${new_price} (precio original: ${orig_price})", flush=True)
                
                conn.close()
            except Exception as e:
                print(f"[Simulator Error] {e}", flush=True)
            
            tick += 1
            time.sleep(5)

    t = threading.Thread(target=run_simulator, daemon=True)
    t.start()

# Start background simulation thread
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



# 6b. Live Weather API integration
CITY_COORDINATES = {
    0: {"name": "Bogotá", "lat": 4.7110, "lon": -74.0721},
    1: {"name": "Medellín", "lat": 6.2442, "lon": -75.5812},
    2: {"name": "Cartagena", "lat": 10.3910, "lon": -75.4794},
    3: {"name": "Cali", "lat": 3.4516, "lon": -76.5320},
    4: {"name": "Londres", "lat": 51.5074, "lon": -0.1278},
    5: {"name": "Nueva York", "lat": 40.7128, "lon": -74.0060}
}

@app.route('/api/weather/live', methods=['GET'])
def get_live_weather():
    try:
        city_index_val = request.args.get('city_index', '0')
        try:
            city_index = int(city_index_val)
        except ValueError:
            city_index = 0
            
        city_data = CITY_COORDINATES.get(city_index, CITY_COORDINATES[0])
        lat = city_data["lat"]
        lon = city_data["lon"]
        name = city_data["name"]
        
        # Real HTTP call to Open-Meteo
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'DressYourselfApp/1.0'})
            with urllib.request.urlopen(req, timeout=5.0) as response:
                data = json.loads(response.read().decode('utf-8'))
                current = data.get("current", {})
                temp = current.get("temperature_2m", 15.0)
                humidity = current.get("relative_humidity_2m", 70)
                weather_code = current.get("weather_code", 0)
        except Exception as e:
            # Fallback to static defaults if network request fails
            print(f"[Weather API Error] Fallback to static defaults: {e}", flush=True)
            static_city = next((c for c in styling_engine.CITIES if c["index"] == city_index), styling_engine.CITIES[0])
            temp = static_city["temp"]
            weather_code = 0 if static_city["rain"] == 0 else 61
            humidity = 80 if static_city["rain"] == 1 else 50

        # Determine if it is raining
        rain_codes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]
        is_raining = weather_code in rain_codes
        
        return jsonify({
            "city_name": name,
            "latitude": lat,
            "longitude": lon,
            "temperature": temp,
            "weather_code": weather_code,
            "humidity": humidity,
            "is_raining": is_raining
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 7. User Profile Management
@app.route('/api/profile', methods=['GET'])
def get_user_profile():
    try:
        prof = database.get_profile()
        if not prof:
            prof = database.save_profile("Usuario Invitado", "Comodo", "Bogotá", 0, "Novicio", "[]")
        
        # Deserialize insignias
        if prof and isinstance(prof.get('insignias'), str):
            try:
                prof['insignias'] = json.loads(prof['insignias'])
            except Exception:
                prof['insignias'] = []
        return jsonify(prof), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/profile', methods=['POST'])
def save_user_profile():
    try:
        data = request.json or {}
        if not data.get('nombre'):
            return jsonify({"error": "El campo 'nombre' es obligatorio."}), 400
        
        estilo = data.get('estilo_preferido', 'Comodo')
        if estilo not in ['Comodo', 'Elegante', 'Romantico']:
            estilo = 'Comodo'
            
        # Serialize insignias list
        insignias_val = data.get('insignias', [])
        if isinstance(insignias_val, list):
            insignias_str = json.dumps(insignias_val)
        else:
            insignias_str = "[]"
            
        updated_prof = database.save_profile(
            nombre=data['nombre'],
            estilo_preferido=estilo,
            ciudad_default=data.get('ciudad_default', 'Bogotá'),
            puntos=data.get('puntos', 0),
            nivel=data.get('nivel', 'Novicio'),
            insignias=insignias_str
        )
        
        # Deserialize for response
        if updated_prof and isinstance(updated_prof.get('insignias'), str):
            try:
                updated_prof['insignias'] = json.loads(updated_prof['insignias'])
            except Exception:
                updated_prof['insignias'] = []
                
        return jsonify(updated_prof), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 8. Canvas Looks (Lienzo Libre) Management
@app.route('/api/canvas-looks', methods=['GET'])
def get_canvas_looks():
    try:
        looks = database.get_all_canvas_looks()
        for look in looks:
            if isinstance(look.get('prendas_json'), str):
                try:
                    look['prendas'] = json.loads(look['prendas_json'])
                except Exception:
                    look['prendas'] = []
        return jsonify(looks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas-looks', methods=['POST'])
def save_canvas_look():
    try:
        data = request.json or {}
        if not data.get('nombre'):
            return jsonify({"error": "El campo 'nombre' es obligatorio."}), 400
            
        prendas = data.get('prendas')
        if prendas is None:
            return jsonify({"error": "Debe proporcionar el campo 'prendas' como una lista."}), 400
            
        prendas_json = json.dumps(prendas)
        new_id = database.create_canvas_look(data['nombre'], prendas_json)
        
        return jsonify({"id": new_id, "message": "Collage de Lienzo Libre guardado con éxito."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 9. Travel Capsule Wardrobe Generator
@app.route('/api/travel-capsule', methods=['POST'])
def get_travel_capsule():
    try:
        data = request.json or {}
        days = data.get('days')
        dest_type = data.get('destination_type')
        climate = data.get('climate')
        
        if not days or not dest_type or not climate:
            return jsonify({"error": "Faltan campos obligatorios: days, destination_type, climate"}), 400
            
        clothes_list = database.get_all_clothes()
        capsule = styling_engine.generate_travel_capsule(clothes_list, days, dest_type, climate)
        return jsonify(capsule), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 10. Price Tracker Auditor
@app.route('/api/price-tracker', methods=['GET'])
def get_price_tracker():
    try:
        tracker_data = database.get_price_tracker_data()
        for item in tracker_data:
            orig = item.get('original_price') or item.get('price')
            curr = item.get('price')
            if orig and curr and curr < orig:
                discount_pct = round((orig - curr) / orig * 100)
                item['discount_percentage'] = discount_pct
                item['on_sale'] = True
            else:
                item['discount_percentage'] = 0
                item['on_sale'] = False
        return jsonify(tracker_data), 200
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
    if os.path.exists(path):
        return send_file(path)
    elif os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    else:
        return "File Not Found", 404

if __name__ == '__main__':
    # Run on 0.0.0.0 and port 5000 to listen to external calls and Android emulators
    app.run(host='0.0.0.0', port=5000, debug=True)
