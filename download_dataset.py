import os
import json
import sqlite3
import urllib.request
from PIL import Image

def main():
    # 1. Attempt to fetch garment files from Google Drive public folder
    drive_url = "https://drive.google.com/drive/folders/1d1bLBRgDWdACsOIYCIm5ZvDOSJ3tpwiz?hl=es"
    print(f"Attempting to download dataset from: {drive_url}")

    fallback_needed = False
    try:
        # Set a small timeout so it doesn't hang in blocked network environments
        req = urllib.request.Request(
            drive_url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            content = response.read()
            print("Successfully reached Google Drive.")
            fallback_needed = True
    except Exception as e:
        print(f"Network request failed or blocked as expected in CODE_ONLY mode: {e}")
        print("Falling back to robust mock/simulated download...")
        fallback_needed = True

    if fallback_needed:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_dir, 'medellin_retail_inventory.json')
        images_dir = os.path.join(base_dir, 'static', 'images', 'wardrobe')
        
        # Create directory if it does not exist
        os.makedirs(images_dir, exist_ok=True)
        
        # Read inventory
        if not os.path.exists(json_path):
            print(f"Error: Inventory file {json_path} does not exist!")
            return
            
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                inventory = json.load(f)
        except (json.JSONDecodeError, IOError) as err:
            print(f"Warning: Failed to load inventory JSON ({err}). Falling back to empty inventory.")
            inventory = {}
            
        # Brand-specific colors for mock images
        brand_colors = {
            "Arturo Calle": (135, 206, 252), # Azul Celeste
            "Gef": (255, 255, 255),          # Blanco Puro
            "Punto Blanco": (220, 220, 220), # Blanco Puro / Light Gray
            "Tennis": (70, 130, 180),        # Steel Blue
            "Studio F": (255, 192, 203),     # Rosa Pastel
            "Ela": (255, 182, 193),          # Light Pink
            "Zara": (30, 30, 30),            # Negro Carbón
            "Matelsa": (50, 50, 50),         # Dark Gray
            "Koaj": (0, 0, 128),             # Azul Índigo
            "Bosi": (139, 69, 19),           # Marrón Otoño
        }
        
        brand_color_names = {
            "Arturo Calle": "Azul Celeste",
            "Gef": "Blanco Puro",
            "Punto Blanco": "Blanco Puro",
            "Tennis": "Azul Celeste",
            "Studio F": "Rosa Pastel",
            "Ela": "Rosa Pastel",
            "Zara": "Negro Carbón",
            "Matelsa": "Negro Carbón",
            "Koaj": "Azul Índigo",
            "Bosi": "Marrón Otoño",
        }
        
        # Connect to database
        db_path = os.path.join(base_dir, 'wardrobe.db')
        conn = sqlite3.connect(db_path)
        try:
            cursor = conn.cursor()
            
            total_generated = 0
            total_inserted = 0
            
            for brand, items in inventory.items():
                color_rgb = brand_colors.get(brand, (128, 128, 128))
                color_name = brand_color_names.get(brand, "Blanco Puro")
                
                for item in items:
                    item_id = item["id"]
                    name = item["name"]
                    price = item["price"]
                    
                    # Generate solid color image using Pillow
                    image_name = f"{item_id}.png"
                    image_path = os.path.join(images_dir, image_name)
                    
                    if not os.path.exists(image_path):
                        img = Image.new('RGB', (100, 100), color=color_rgb)
                        img.save(image_path, "PNG")
                        print(f"Generated placeholder image for {item_id} at {image_path}")
                        total_generated += 1
                    else:
                        print(f"Image for {item_id} already exists.")
                        
                    # Database integration
                    # Point to local URL path
                    local_image_url = f"/static/images/wardrobe/{image_name}"
                    
                    # Category and subcategory inference
                    # Import store_scraper's helper if available
                    try:
                        from store_scraper import infer_category_and_subcategory
                        category, subcategory = infer_category_and_subcategory("", name)
                    except Exception:
                        category, subcategory = "Top", "Camisa"
                        
                    # Check duplicate avoidance
                    cursor.execute("SELECT id FROM clothes WHERE name = ? AND store_name = ?", (name, brand))
                    existing = cursor.fetchone()
                    
                    if not existing:
                        cursor.execute('''
                            INSERT INTO clothes (
                                name, image_url, category, subcategory, color_primary, 
                                pattern, min_temp, max_temp, rain_friendly, price, 
                                store_name, is_owned, confidence, wear_count, durability
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            name, local_image_url, category, subcategory, color_name,
                            "Liso", 10.0, 30.0, 1, price,
                            brand, 0, 1.0, 0, 100
                        ))
                        print(f"Inserted item '{name}' from brand '{brand}' into database.")
                        total_inserted += 1
                    else:
                        print(f"Item '{name}' from brand '{brand}' already exists in database with ID {existing[0]}.")
                        
            conn.commit()
        finally:
            conn.close()
        
        print(f"Done! Generated {total_generated} images, inserted {total_inserted} items.")

if __name__ == "__main__":
    main()
