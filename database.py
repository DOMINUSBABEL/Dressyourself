import os
import sqlite3

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wardrobe.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except sqlite3.OperationalError:
        pass
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create clothes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clothes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT NOT NULL,
            category TEXT NOT NULL,         -- Top, Bottom, Footwear, Outerwear, Accessory
            subcategory TEXT,              -- e.g., T-Shirt, Blouse, Jeans, Boots, Sunglasses
            color_primary TEXT,            -- name in Spanish, e.g. 'Azul Índigo'
            color_secondary TEXT,          -- name in Spanish, e.g. 'Blanco Puro'
            pattern TEXT,                  -- Liso, Rayas, Cuadros, Estampado
            min_temp REAL,
            max_temp REAL,
            rain_friendly INTEGER,         -- 0 or 1
            price REAL,                    -- for store items
            store_name TEXT,               -- for store items
            is_owned INTEGER DEFAULT 1,    -- 1 if owned, 0 if store item
            confidence REAL DEFAULT 1.0
        )
    ''')

    # Create outfits table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS outfits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            top_id INTEGER,
            bottom_id INTEGER,
            footwear_id INTEGER,
            outerwear_id INTEGER,
            accessory_id INTEGER,
            is_shared INTEGER DEFAULT 0,    -- 1 if shared, 0 if private
            likes INTEGER DEFAULT 0,
            aesthetic_count INTEGER DEFAULT 0,
            streetwear_count INTEGER DEFAULT 0,
            minimalist_count INTEGER DEFAULT 0,
            classic_count INTEGER DEFAULT 0,
            oversize_count INTEGER DEFAULT 0,
            justification TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(top_id) REFERENCES clothes(id),
            FOREIGN KEY(bottom_id) REFERENCES clothes(id),
            FOREIGN KEY(footwear_id) REFERENCES clothes(id),
            FOREIGN KEY(outerwear_id) REFERENCES clothes(id),
            FOREIGN KEY(accessory_id) REFERENCES clothes(id)
        )
    ''')

    # Dynamically alter table to add columns if database already exists
    for col in ['aesthetic_count', 'streetwear_count', 'minimalist_count', 'classic_count', 'oversize_count']:
        try:
            cursor.execute(f"ALTER TABLE outfits ADD COLUMN {col} INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass


    # Create orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clothing_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Pendiente', -- Pendiente, En Camino, Entregado
            quantity INTEGER DEFAULT 1,
            total_price REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            delivery_progress INTEGER DEFAULT 0, -- 0 to 100
            FOREIGN KEY(clothing_id) REFERENCES clothes(id)
        )
    ''')

    # Check if table is empty to prepopulate
    cursor.execute('SELECT COUNT(*) FROM clothes')
    if cursor.fetchone()[0] == 0:
        initial_clothes = [
            # Owned clothes (is_owned = 1)
            ("Camiseta Básica de Algodón", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600", "Top", "Camiseta", "Blanco Puro", "Gris Marengo", "Liso", 15.0, 30.0, 0, None, None, 1, 1.0),
            ("Blusa de Seda Nocturna", "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600", "Top", "Blusa", "Negro Carbón", None, "Liso", 18.0, 28.0, 1, None, None, 1, 1.0),
            ("Jeans Denim Ajustados", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600", "Bottom", "Jeans", "Azul Índigo", "Azul Celeste", "Liso", 10.0, 25.0, 1, None, None, 1, 1.0),
            ("Pantalón de Vestir Sastre", "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", "Bottom", "Pantalón de Vestir", "Gris Marengo", None, "Liso", 12.0, 24.0, 1, None, None, 1, 1.0),
            ("Tenis Urbanos Blancos", "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600", "Footwear", "Tenis", "Blanco Puro", None, "Liso", 10.0, 30.0, 0, None, None, 1, 1.0),
            ("Botas de Cuero Impermeables", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600", "Footwear", "Botas", "Marrón Otoño", "Negro Carbón", "Liso", -5.0, 15.0, 1, None, None, 1, 1.0),
            ("Abrigo Trench de Lana", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600", "Outerwear", "Abrigo", "Beige Arena", None, "Liso", -5.0, 15.0, 1, None, None, 1, 1.0),
            ("Chaqueta Denim Vintage", "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=600", "Outerwear", "Chaqueta", "Azul Índigo", None, "Liso", 12.0, 20.0, 1, None, None, 1, 1.0),
            ("Gafas de Sol Retro", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600", "Accessory", "Gafas de Sol", "Negro Carbón", "Amarillo Mostaza", "Liso", 15.0, 35.0, 1, None, None, 1, 1.0),
            ("Bolso Tote de Cuero", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", "Accessory", "Bolso", "Marrón Otoño", None, "Liso", 0.0, 35.0, 1, None, None, 1, 1.0),

            # Store clothes (is_owned = 0)
            ("Camisa a Rayas Marina", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600", "Top", "Camisa", "Azul Índigo", "Blanco Puro", "Rayas", 12.0, 25.0, 1, 45.0, "Zara", 0, 1.0),
            ("Falda Plisada de Invierno", "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600", "Bottom", "Falda", "Marrón Otoño", "Negro Carbón", "Cuadros", 5.0, 18.0, 0, 59.90, "Mango", 0, 1.0),
            ("Mocasines Elegantes", "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600", "Footwear", "Mocasines", "Negro Carbón", "Marrón Otoño", "Liso", 10.0, 25.0, 1, 89.00, "Massimo Dutti", 0, 1.0),
            ("Chaqueta Puffer de Montaña", "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600", "Outerwear", "Chaqueta Puffer", "Rojo Carmín", "Negro Carbón", "Liso", -10.0, 10.0, 1, 120.00, "Patagonia", 0, 1.0),
            ("Bufanda de Lana Tejida", "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600", "Accessory", "Bufanda", "Gris Marengo", "Beige Arena", "Cuadros", -10.0, 12.0, 1, 25.00, "H&M", 0, 1.0)
        ]
        cursor.executemany('''
            INSERT INTO clothes (
                name, image_url, category, subcategory, color_primary, color_secondary, 
                pattern, min_temp, max_temp, rain_friendly, price, store_name, is_owned, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_clothes)
        conn.commit()

        # Add a couple of initial outfits (e.g. one shared, one private)
        cursor.execute("SELECT id FROM clothes WHERE name='Camiseta Básica de Algodón'")
        top_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM clothes WHERE name='Jeans Denim Ajustados'")
        bottom_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM clothes WHERE name='Tenis Urbanos Blancos'")
        footwear_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM clothes WHERE name='Chaqueta Denim Vintage'")
        outerwear_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM clothes WHERE name='Gafas de Sol Retro'")
        accessory_id = cursor.fetchone()[0]

        cursor.execute('''
            INSERT INTO outfits (
                name, top_id, bottom_id, footwear_id, outerwear_id, accessory_id, 
                is_shared, likes, aesthetic_count, streetwear_count, minimalist_count, 
                classic_count, oversize_count, justification
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Look Casual de Fin de Semana", 
            top_id, bottom_id, footwear_id, outerwear_id, accessory_id, 
            1, 29, 5, 8, 4, 9, 3,
            "Una sinergia infalible de mezclilla sobre mezclilla con acentos urbanos blancos y gafas retro. El epítome del estilo despreocupado pero curado para la primavera."
        ))
        conn.commit()

    conn.close()

def get_all_clothes(owned_filter=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if owned_filter is not None:
        val = 1 if owned_filter else 0
        cursor.execute('SELECT * FROM clothes WHERE is_owned = ?', (val,))
    else:
        cursor.execute('SELECT * FROM clothes')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_clothing_by_id(clothing_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM clothes WHERE id = ?', (clothing_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_clothing(name, image_url, category, subcategory=None, color_primary=None, color_secondary=None, pattern=None, min_temp=None, max_temp=None, rain_friendly=0, price=None, store_name=None, is_owned=1, confidence=1.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO clothes (
            name, image_url, category, subcategory, color_primary, color_secondary, 
            pattern, min_temp, max_temp, rain_friendly, price, store_name, is_owned, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, image_url, category, subcategory, color_primary, color_secondary, pattern, min_temp, max_temp, rain_friendly, price, store_name, is_owned, confidence))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def delete_clothing(clothing_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM clothes WHERE id = ?', (clothing_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def get_all_outfits():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT o.*, 
               t.name as top_name, t.image_url as top_image, t.color_primary as top_color,
               b.name as bottom_name, b.image_url as bottom_image, b.color_primary as bottom_color,
               f.name as footwear_name, f.image_url as footwear_image, f.color_primary as footwear_color,
               out.name as outerwear_name, out.image_url as outerwear_image, out.color_primary as outerwear_color,
               acc.name as accessory_name, acc.image_url as accessory_image, acc.color_primary as accessory_color
        FROM outfits o
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        LEFT JOIN clothes f ON o.footwear_id = f.id
        LEFT JOIN clothes out ON o.outerwear_id = out.id
        LEFT JOIN clothes acc ON o.accessory_id = acc.id
        ORDER BY o.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_outfit(name, top_id, bottom_id, footwear_id, outerwear_id=None, accessory_id=None, is_shared=0, justification=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO outfits (name, top_id, bottom_id, footwear_id, outerwear_id, accessory_id, is_shared, justification)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, top_id, bottom_id, footwear_id, outerwear_id, accessory_id, is_shared, justification))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def delete_outfit(outfit_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM outfits WHERE id = ?', (outfit_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def share_outfit(outfit_id, share_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE outfits SET is_shared = ? WHERE id = ?', (1 if share_status else 0, outfit_id))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def like_outfit(outfit_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE outfits SET likes = likes + 1 WHERE id = ?', (outfit_id,))
    conn.commit()
    # Get updated likes
    cursor.execute('SELECT likes FROM outfits WHERE id = ?', (outfit_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 0

def vote_outfit(outfit_id, style_tag):
    valid_styles = {
        "aesthetic": "aesthetic_count",
        "streetwear": "streetwear_count",
        "minimalist": "minimalist_count",
        "classic": "classic_count",
        "oversize": "oversize_count"
    }
    tag = style_tag.lower().strip()
    if tag not in valid_styles:
        raise ValueError(f"Invalid style tag: {style_tag}")
        
    col_name = valid_styles[tag]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f'''
        UPDATE outfits 
        SET {col_name} = {col_name} + 1, likes = likes + 1 
        WHERE id = ?
    ''', (outfit_id,))
    conn.commit()
    
    cursor.execute('''
        SELECT aesthetic_count, streetwear_count, minimalist_count, classic_count, oversize_count, likes 
        FROM outfits 
        WHERE id = ?
    ''', (outfit_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def get_all_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT o.*, c.name as clothing_name, c.image_url as clothing_image, c.store_name as store_name
        FROM orders o
        JOIN clothes c ON o.clothing_id = c.id
        ORDER BY o.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_order(clothing_id, quantity=1, total_price=0.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO orders (clothing_id, quantity, total_price, status, delivery_progress)
        VALUES (?, ?, ?, 'Pendiente', 0)
    ''', (clothing_id, quantity, total_price))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def update_order_progress(order_id, progress, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE orders SET delivery_progress = ?, status = ? WHERE id = ?
    ''', (progress, status, order_id))
    conn.commit()
    conn.close()
