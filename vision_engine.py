import cv2
import numpy as np
from PIL import Image
import os
import unicodedata
import base64
import requests
import json

# Color mapping to Spanish names (RGB values)
COLOR_MAP = {
    "Blanco Puro": (255, 255, 255),
    "Negro Carbón": (30, 30, 30),
    "Gris Marengo": (112, 128, 144),
    "Gris Perla": (220, 220, 220),
    "Azul Índigo": (0, 0, 128),
    "Azul Celeste": (135, 206, 250),
    "Azul Marino": (10, 25, 47),
    "Verde Musgo": (47, 79, 79),
    "Verde Esmeralda": (0, 201, 87),
    "Verde Oliva": (85, 107, 47),
    "Rojo Carmín": (255, 0, 0),
    "Marrón Otoño": (139, 69, 19),
    "Beige Arena": (245, 245, 220),
    "Amarillo Mostaza": (218, 165, 32),
    "Naranja Ladrillo": (210, 105, 30),
    "Rosa Pastel": (255, 192, 203),
    "Morado Purpúreo": (128, 0, 128),
}

# Cache for CIELAB coordinates to optimize performance
COLOR_MAP_LAB = {}

def rgb_to_lab(rgb):
    """
    Converts RGB color to CIELAB space using OpenCV.
    Input rgb is a tuple/list (R, G, B) with values in [0, 255].
    """
    r = max(0, min(255, float(rgb[0])))
    g = max(0, min(255, float(rgb[1])))
    b = max(0, min(255, float(rgb[2])))
    
    # cv2.cvtColor expects floats normalized to [0, 1] for RGB->Lab
    rgb_arr = np.array([[[r/255.0, g/255.0, b/255.0]]], dtype=np.float32)
    lab_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2Lab)
    return lab_arr[0, 0]

def get_color_name(rgb):
    """
    Finds the closest color in COLOR_MAP using CIELAB Delta-E 1976 distance.
    This provides a perceptually uniform mapping instead of standard RGB distance.
    """
    # Convert input RGB to LAB
    lab_in = rgb_to_lab(rgb)
    
    closest_name = "Desconocido"
    min_dist = float('inf')
    
    for name, mapped_rgb in COLOR_MAP.items():
        if name not in COLOR_MAP_LAB:
            COLOR_MAP_LAB[name] = rgb_to_lab(mapped_rgb)
        
        lab_mapped = COLOR_MAP_LAB[name]
        # Delta-E 1976 is the Euclidean distance in LAB space
        dist = np.linalg.norm(lab_in - lab_mapped)
        
        if dist < min_dist:
            min_dist = dist
            closest_name = name
            
    return closest_name

def normalize_text(text):
    """
    Normalizes string by converting to lowercase, stripping accents/diacritics,
    and replacing underscores/dashes with spaces.
    """
    if not text:
        return ""
    text = text.lower()
    text = text.replace('_', ' ').replace('-', ' ')
    text = "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    return text

# Semantic mapping of filename keywords to categories and subcategories
KEYWORD_MAPPING = {
    # Compound / Priority keywords first to avoid sub-string partial matching issues
    "chaqueta de mezclilla": ("Outerwear", "Chaqueta"),
    "chaqueta de cuero": ("Outerwear", "Chaqueta"),
    "chaqueta puffer": ("Outerwear", "Chaqueta Puffer"),
    "chaquetapuffer": ("Outerwear", "Chaqueta Puffer"),
    "chaqueta denim": ("Outerwear", "Chaqueta"),
    "zapatos de vestir": ("Footwear", "Zapatos de Vestir"),
    "zapato de vestir": ("Footwear", "Zapatos de Vestir"),
    "top corto": ("Top", "Top Corto"),
    "crop top": ("Top", "Top Corto"),
    "croptop": ("Top", "Top Corto"),
    "gafas de sol": ("Accessory", "Gafas de Sol"),
    
    # Footwear subcategories
    "tenis": ("Footwear", "Tenis"),
    "sneaker": ("Footwear", "Tenis"),
    "mocasines": ("Footwear", "Mocasines"),
    "mocasin": ("Footwear", "Mocasines"),
    "loafer": ("Footwear", "Mocasines"),
    "botas": ("Footwear", "Botas"),
    "bota": ("Footwear", "Botas"),
    "boot": ("Footwear", "Botas"),
    "sandalias": ("Footwear", "Sandalias"),
    "sandalia": ("Footwear", "Sandalias"),
    "slide": ("Footwear", "Sandalias"),
    "chancla": ("Footwear", "Sandalias"),
    "zapatos": ("Footwear", "Zapatos de Vestir"),
    "zapato": ("Footwear", "Zapatos de Vestir"),
    
    # Bottom subcategories
    "jeans": ("Bottom", "Jeans"),
    "jean": ("Bottom", "Jeans"),
    "denim": ("Bottom", "Jeans"),
    "mezclilla": ("Bottom", "Jeans"),
    "pantalon de vestir": ("Bottom", "Pantalón de Vestir"),
    "pantalon sastre": ("Bottom", "Pantalón de Vestir"),
    "pantalon": ("Bottom", "Pantalón de Vestir"),
    "pantalones": ("Bottom", "Pantalón de Vestir"),
    "sastre": ("Bottom", "Pantalón de Vestir"),
    "falda": ("Bottom", "Falda"),
    "faldas": ("Bottom", "Falda"),
    "skirt": ("Bottom", "Falda"),
    "shorts": ("Bottom", "Shorts"),
    "short": ("Bottom", "Shorts"),
    "bermuda": ("Bottom", "Shorts"),
    "medias": ("Bottom", "Medias"),
    "media": ("Bottom", "Medias"),
    "socks": ("Bottom", "Medias"),
    "sock": ("Bottom", "Medias"),
    "calcetines": ("Bottom", "Medias"),
    "calcetin": ("Bottom", "Medias"),
    
    # Top subcategories
    "camiseta": ("Top", "Camiseta"),
    "t-shirt": ("Top", "Camiseta"),
    "playera": ("Top", "Camiseta"),
    "polera": ("Top", "Camiseta"),
    "camisa": ("Top", "Camisa"),
    "shirt": ("Top", "Camisa"),
    "blusa": ("Top", "Blusa"),
    "blouse": ("Top", "Blusa"),
    "crop": ("Top", "Top Corto"),
    "sueter": ("Top", "Suéter"),
    "sweater": ("Top", "Suéter"),
    "jersey": ("Top", "Suéter"),
    "cardigan": ("Top", "Suéter"),
    "buzo": ("Top", "Suéter"),
    "hoodie": ("Top", "Suéter"),
    "saco": ("Top", "Saco"),
    "pullover": ("Top", "Saco"),
    "vestido": ("Top", "Vestido"),
    "dress": ("Top", "Vestido"),
    "gown": ("Top", "Vestido"),
    
    # Outerwear subcategories
    "blazer": ("Outerwear", "Blazer"),
    "abrigo": ("Outerwear", "Abrigo"),
    "coat": ("Outerwear", "Abrigo"),
    "trench": ("Outerwear", "Trench"),
    "gabardina": ("Outerwear", "Trench"),
    "chaqueta": ("Outerwear", "Chaqueta"),
    "jacket": ("Outerwear", "Chaqueta"),
    "casaca": ("Outerwear", "Chaqueta"),
    "puffer": ("Outerwear", "Chaqueta Puffer"),
    "plumon": ("Outerwear", "Chaqueta Puffer"),
    
    # Accessory subcategories
    "bolso": ("Accessory", "Bolso"),
    "bag": ("Accessory", "Bolso"),
    "cartera": ("Accessory", "Bolso"),
    "backpack": ("Accessory", "Bolso"),
    "correa": ("Accessory", "Correa"),
    "cinturon": ("Accessory", "Correa"),
    "belt": ("Accessory", "Correa"),
    "bufanda": ("Accessory", "Bufanda"),
    "scarf": ("Accessory", "Bufanda"),
    "gorra": ("Accessory", "Gorra"),
    "gorro": ("Accessory", "Gorra"),
    "hat": ("Accessory", "Gorra"),
    "cap": ("Accessory", "Gorra"),
    "gafas": ("Accessory", "Gafas de Sol"),
    "lentes": ("Accessory", "Gafas de Sol"),
    "sunglasses": ("Accessory", "Gafas de Sol"),
}

# Mapeo semántico de palabras clave para patrones complejos
PATTERN_KEYWORD_MAPPING = {
    "pata de gallo": "Pata de gallo",
    "houndstooth": "Pata de gallo",
    "animal print": "Animal Print",
    "leopardo": "Animal Print",
    "zebra": "Animal Print",
    "tigre": "Animal Print",
    "floral": "Floral",
    "flores": "Floral",
    "floreado": "Floral",
    "lunares": "Lunares",
    "puntos": "Lunares",
    "polka": "Lunares",
    "rayas": "Rayas",
    "rayado": "Rayas",
    "stripes": "Rayas",
    "cuadros": "Cuadros",
    "cuadriculado": "Cuadros",
    "plaid": "Cuadros",
    "liso": "Liso",
    "solido": "Liso"
}

# Mapeo semántico de palabras clave para materiales de tela
MATERIAL_KEYWORD_MAPPING = {
    "mezclilla": "Mezclilla",
    "jeans": "Mezclilla",
    "denim": "Mezclilla",
    "seda": "Seda",
    "silk": "Seda",
    "cuero": "Cuero",
    "leather": "Cuero",
    "lana": "Lana",
    "wool": "Lana",
    "algodon": "Algodón",
    "cotton": "Algodón"
}



def remove_background(image_path_or_bytes):
    """
    Removes background using OpenCV grabCut to isolate the garment as a transparent PNG.
    Uses a hybrid border-color and bounding box mask initialization for near-perfect segmentation.
    """
    try:
        if isinstance(image_path_or_bytes, str):
            img = cv2.imread(image_path_or_bytes)
        else:
            nparr = np.frombuffer(image_path_or_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        h, w, _ = img.shape
        mask = np.zeros((h, w), np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)

        # 1. Estimate background color from outer borders
        border_pixels = []
        border_pixels.extend(img[0, :, :])
        border_pixels.extend(img[-1, :, :])
        border_pixels.extend(img[:, 0, :])
        border_pixels.extend(img[:, -1, :])
        border_pixels = np.array(border_pixels)
        bg_color = np.median(border_pixels, axis=0)

        # Identify pixels matching border background color
        diff = np.abs(img.astype(np.int32) - bg_color)
        is_bg = np.all(diff < 22, axis=2)

        # 2. Initialize mask: GC_BGD (sure bg) for border-matching colors, GC_PR_FGD inside the inner rect
        mask[is_bg] = cv2.GC_BGD
        
        # Rect: 5% inset
        rx, ry, rw, rh = int(w * 0.05), int(h * 0.05), int(w * 0.9), int(h * 0.9)
        rect_mask = np.zeros((h, w), dtype=bool)
        rect_mask[ry:ry+rh, rx:rx+rw] = True
        
        # Mark non-bg pixels inside the rect as probable foreground
        mask[rect_mask & ~is_bg] = cv2.GC_PR_FGD
        # Mark bg pixels inside the rect as probable background
        mask[rect_mask & is_bg] = cv2.GC_PR_BGD
        # Mark outside rect as sure background
        mask[~rect_mask] = cv2.GC_BGD

        # 3. Run grabCut with mask
        cv2.grabCut(img, mask, None, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_MASK)
        
        mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
        mask2 = cv2.GaussianBlur(mask2 * 255, (3, 3), 0)
        _, mask_alpha = cv2.threshold(mask2, 100, 255, cv2.THRESH_BINARY)

        # 4. Solid backdrop Euclidean distance override (for synthetic/studio flat backdrops)
        dist = np.sqrt(np.sum((img.astype(np.float32) - bg_color) ** 2, axis=2))
        is_flat_bg = dist < 35
        mask_alpha[is_flat_bg] = 0
        
        b, g, r = cv2.split(img)
        rgba = cv2.merge([b, g, r, mask_alpha])
        
        # Crop transparent padding
        pts = np.argwhere(mask_alpha > 0)
        if len(pts) > 0:
            y_min, x_min = pts.min(axis=0)
            y_max, x_max = pts.max(axis=0)
            cropped = rgba[y_min:y_max+1, x_min:x_max+1]
        else:
            cropped = rgba

        # Resize to fit in 1024x1024 box (keeping aspect ratio)
        ch, cw, _ = cropped.shape
        fit_size = 900
        scale = min(float(fit_size) / cw, float(fit_size) / ch)
        nw, nh = int(cw * scale), int(ch * scale)
        resized = cv2.resize(cropped, (nw, nh), interpolation=cv2.INTER_AREA)
        
        # Place in a transparent 1024x1024 square
        canvas = np.zeros((1024, 1024, 4), dtype=np.uint8)
        dx = (1024 - nw) // 2
        dy = (1024 - nh) // 2
        canvas[dy:dy+nh, dx:dx+nw] = resized
        
        _, encoded = cv2.imencode('.png', canvas)
        return encoded.tobytes()
    except Exception as e:
        print(f"Error in background removal: {e}")
        return None

def analyze_image_with_gemini(image_path_or_bytes, api_key):
    """
    Performs AI vision analysis to tag and classify garments using Google Gemini API.
    """
    if isinstance(image_path_or_bytes, str):
        with open(image_path_or_bytes, "rb") as image_file:
            img_data = image_file.read()
    else:
        img_data = image_path_or_bytes

    base64_image = base64.b64encode(img_data).decode('utf-8')

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }

    prompt = (
        "Analyze this clothing image. Classify the item and return a JSON object with: "
        "category (choose exactly one from: Superior, Inferior, Base, Complementos), "
        "subcategory (e.g. Camiseta, Jeans, Blazer, Botas, Vestido, etc.), "
        "pattern (e.g. Liso, Rayas, Cuadros, Estampado, etc.), "
        "material (e.g. Algodón, Denim, Lana, Seda, Cuero, Lino, etc.), "
        "color_primary (approximate color name in Spanish like Blanco Puro, Negro Carbón, Azul Índigo, etc.), "
        "color_secondary (optional secondary color name in Spanish, or null), "
        "name (a clean name for the garment, e.g. 'Chaqueta de Denim Azul'), "
        "confidence (number from 0.0 to 1.0)."
    )

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": base64_image
                    }
                }
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        res_data = response.json()
        try:
            content_text = res_data['candidates'][0]['content']['parts'][0]['text']
            return json.loads(content_text)
        except Exception as e:
            raise Exception(f"Failed to parse Gemini output: {e}")
    else:
        raise Exception(f"Gemini API error: {response.text}")

def analyze_image(image_path_or_bytes):
    """
    Analyzes an image using OpenCV and PIL to extract:
    - Dominant and secondary colors (in Spanish) mapped via CIELAB Delta-E 1976
    - Category (Top, Bottom, Footwear, Outerwear, Accessory) and subcategory,
      prioritizing semantic filename clues and falling back to advanced geometric heuristics.
    - Pattern (Liso, Rayas, Cuadros, Estampado)
    - Realistic confidence score (0.0 to 1.0)
    """
    # 1. ALWAYS REMOVE BACKGROUND LOCALLY TO CREATE TRANSPARENT CUTOUT
    cutout_bytes = remove_background(image_path_or_bytes)
    cutout_b64 = None
    if cutout_bytes:
        cutout_b64 = f"data:image/png;base64,{base64.b64encode(cutout_bytes).decode('utf-8')}"

    # 2. GOOGLE GEMINI INTEGRATION (OPENAI SERVICES DISABLED)
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key:
        try:
            gemini_res = analyze_image_with_gemini(image_path_or_bytes, api_key)
            return {
                "color_primary": gemini_res.get("color_primary", "Negro Carbón"),
                "color_secondary": gemini_res.get("color_secondary") or "N/A",
                "category": gemini_res.get("category", "Superior"),
                "subcategory": gemini_res.get("subcategory", "Camiseta"),
                "pattern": gemini_res.get("pattern", "Liso"),
                "material": gemini_res.get("material", "Algodón"),
                "confidence": round(gemini_res.get("confidence", 0.95) * 100, 2),
                "cutout_base64": cutout_b64
            }
        except Exception as e:
            print(f"Gemini analysis failed, falling back to local: {e}")

    try:
        # Load image
        if isinstance(image_path_or_bytes, str):
            if not os.path.exists(image_path_or_bytes):
                raise FileNotFoundError(f"File not found: {image_path_or_bytes}")
            pil_img = Image.open(image_path_or_bytes).convert('RGB')
        else:
            # Assume bytes
            import io
            pil_img = Image.open(io.BytesIO(image_path_or_bytes)).convert('RGB')
            
        img_np = np.array(pil_img)
        # Convert RGB to BGR for OpenCV
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        h_orig, w_orig, _ = img_cv.shape
        
        # 1. COLOR ANALYSIS (EXCLUDING BACKGROUND AND SKIN TONES)
        # Define skin tone HSV limits
        lower_skin1 = np.array([0, 15, 40], dtype=np.uint8)
        upper_skin1 = np.array([25, 170, 255], dtype=np.uint8)
        lower_skin2 = np.array([165, 15, 40], dtype=np.uint8)
        upper_skin2 = np.array([180, 170, 255], dtype=np.uint8)

        use_cutout_for_colors = False
        if cutout_bytes:
            nparr = np.frombuffer(cutout_bytes, np.uint8)
            cutout_rgba = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
            if cutout_rgba is not None and cutout_rgba.shape[2] == 4:
                cutout_bgr = cutout_rgba[:, :, :3]
                cutout_alpha = cutout_rgba[:, :, 3]
                
                # Resize cutout to speed up color clustering
                cutout_bgr_resized = cv2.resize(cutout_bgr, (100, 100))
                cutout_alpha_resized = cv2.resize(cutout_alpha, (100, 100))
                
                cutout_hsv = cv2.cvtColor(cutout_bgr_resized, cv2.COLOR_BGR2HSV)
                skin_mask1 = cv2.inRange(cutout_hsv, lower_skin1, upper_skin1)
                skin_mask2 = cv2.inRange(cutout_hsv, lower_skin2, upper_skin2)
                skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)
                
                combined_mask = cv2.bitwise_and(cutout_alpha_resized, cv2.bitwise_not(skin_mask))
                pixels = cutout_bgr_resized[combined_mask > 10].reshape(-1, 3).astype(np.float32)
                use_cutout_for_colors = True

        if not use_cutout_for_colors:
            img_resized = cv2.resize(img_cv, (100, 100))
            img_hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            skin_mask1 = cv2.inRange(img_hsv, lower_skin1, upper_skin1)
            skin_mask2 = cv2.inRange(img_hsv, lower_skin2, upper_skin2)
            skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)
            
            combined_mask = cv2.bitwise_not(skin_mask)
            pixels = img_resized[combined_mask > 0].reshape(-1, 3).astype(np.float32)

        if pixels.size == 0:
            pixels = cv2.resize(img_cv, (100, 100)).reshape(-1, 3).astype(np.float32)

        # Apply K-Means to find 4 dominant colors
        k = 4
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, flags)
        
        # Count the frequency of each cluster label
        counts = np.bincount(labels.flatten())
        
        # Sort centers by frequency
        sorted_indices = np.argsort(counts)[::-1]
        sorted_centers = centers[sorted_indices]
        sorted_counts = counts[sorted_indices]
        total_pixels = len(pixels)
        
        # Identify dominant and secondary colors
        valid_colors = []
        for i, center in enumerate(sorted_centers):
            b, g, r = center
            rgb = (int(r), int(g), int(b))
            percentage = sorted_counts[i] / total_pixels
            valid_colors.append((rgb, percentage))
            
        # Select primary and secondary color
        dominant_rgb = valid_colors[0][0]
        secondary_rgb = valid_colors[1][0] if len(valid_colors) > 1 else dominant_rgb
        
        color_primary = get_color_name(dominant_rgb)
        color_secondary = get_color_name(secondary_rgb)
        
        if color_primary == color_secondary and len(valid_colors) > 2:
            color_secondary = get_color_name(valid_colors[2][0])
            
        if color_primary == color_secondary:
            color_secondary = "N/A"
            
        # 2. CATEGORY & SUBCATEGORY DETERMINATION
        semantic_match = False
        category = "Top"
        subcategory = "Camiseta"
        confidence_base = 0.65
        norm_filename = ""
        norm_path = ""
        is_denim_semantic = False
        is_wool_semantic = False
        
        # Check filename/path for semantic fallback first
        if isinstance(image_path_or_bytes, str):
            filename = os.path.basename(image_path_or_bytes)
            norm_filename = normalize_text(filename)
            norm_path = normalize_text(image_path_or_bytes)
            
            is_denim_semantic = any(k in norm_path for k in ["denim", "mezclilla", "jeans"])
            is_wool_semantic = any(k in norm_path for k in ["lana", "wool", "sueter", "sweater", "cardigan"])
            
            # Check filename first, then path
            for kw, (cat, subcat) in KEYWORD_MAPPING.items():
                if kw in norm_filename:
                    category = cat
                    subcategory = subcat
                    semantic_match = True
                    break
            
            if not semantic_match:
                for kw, (cat, subcat) in KEYWORD_MAPPING.items():
                    if kw in norm_path:
                        category = cat
                        subcategory = subcat
                        semantic_match = True
                        break
                        
        # Setup OpenCV variables needed for texture/pattern and geometric fallbacks
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Use Otsu's thresholding to isolate foreground
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Correctly invert threshold (clothing should be white on black background)
        corners = [int(thresh[0,0]), int(thresh[0,-1]), int(thresh[-1,0]), int(thresh[-1,-1])]
        if sum(corners) > 510: # More than half are white
            thresh = cv2.bitwise_not(thresh)
            
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            c = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(c)
        else:
            x, y, w, h = 0, 0, w_orig, h_orig
            
        aspect_ratio = float(w) / h
        box_area = w * h
        img_area = w_orig * h_orig
        coverage = float(box_area) / img_area
        vertical_start = float(y) / h_orig
        vertical_center = float(y + h/2) / h_orig
        
        # Calculate global edge density and height profile
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.mean(edges)
        
        # Calculate local edge density in cropped bounding box
        crop_gray = gray[y:y+h, x:x+w]
        crop_edges = cv2.Canny(crop_gray, 50, 150) if crop_gray.size > 0 else np.array([])
        crop_edge_density = np.mean(crop_edges) if crop_edges.size > 0 else 0.0
        
        height_ratio = float(h) / h_orig
        
        # Calculate height profile using density of vertical thirds
        mask_crop = thresh[y:y+h, x:x+w]
        h_third = max(1, h // 3)
        top_third = mask_crop[0:h_third, :]
        mid_third = mask_crop[h_third:2*h_third, :]
        bot_third = mask_crop[2*h_third:, :]
        
        top_density = np.mean(top_third) / 255.0 if top_third.size > 0 else 0.0
        mid_density = np.mean(mid_third) / 255.0 if mid_third.size > 0 else 0.0
        bot_density = np.mean(bot_third) / 255.0 if bot_third.size > 0 else 0.0
        
        if semantic_match:
            # Semantic filename keywords ensure high confidence and bypass geometric heuristic classification
            confidence = 0.99
        else:
            # Advanced Geometric Heuristics Fallback
            has_split = False
            if contours:
                # Split analysis for pants
                bottom_half_y = int(y + h * 0.5)
                bottom_half_img = thresh[bottom_half_y:y+h, x:x+w]
                if bottom_half_img.size > 20:
                    profile = np.mean(bottom_half_img, axis=0)
                    if len(profile) > 20:
                        mid = len(profile) // 2
                        left_mean = np.mean(profile[:mid])
                        right_mean = np.mean(profile[mid:])
                        center_val = np.mean(profile[mid-2:mid+2])
                        if center_val < 0.55 * max(left_mean, right_mean):
                            has_split = True
            
            # 1. Correa (belts - extremely wide, minimal height)
            if aspect_ratio > 1.8 and height_ratio < 0.18:
                category = "Accessory"
                subcategory = "Correa"
                confidence_base = 0.88
                
            # 2. Vestidos (dresses - extremely tall, covering both top and bottom heights, no split)
            elif height_ratio > 0.68 and vertical_start < 0.3 and ((y + h) / h_orig > 0.78) and not has_split:
                category = "Top"
                subcategory = "Vestido"
                confidence_base = 0.88
                
            # 3. Medias (socks - tall, narrow, bottom placement)
            elif aspect_ratio < 0.5 and vertical_center > 0.55 and vertical_start > 0.35 and height_ratio < 0.65:
                category = "Bottom"
                subcategory = "Medias"
                confidence_base = 0.85
                
            # 4. Footwear -> Tenis, Mocasines, Botas, Zapatos de Vestir, Sandalias
            elif vertical_center > 0.65 and vertical_start > 0.45 and height_ratio < 0.35:
                category = "Footwear"
                if aspect_ratio < 0.85:
                    subcategory = "Botas"
                elif aspect_ratio > 1.3:
                    if coverage < 0.15:
                        subcategory = "Sandalias"
                    else:
                        subcategory = "Tenis"
                else:
                    if color_primary in ["Blanco Puro", "Azul Celeste"]:
                        subcategory = "Tenis"
                    elif color_primary in ["Negro Carbón", "Marrón Otoño"] and crop_edge_density < 15.0:
                        subcategory = "Zapatos de Vestir"
                    else:
                        subcategory = "Mocasines"
                confidence_base = 0.80
                
            # 5. Accessory (except Correa) -> Bolso, Bufanda, Gorra, Gafas de Sol
            elif coverage < 0.25 and height_ratio < 0.35 and not has_split:
                category = "Accessory"
                if aspect_ratio >= 1.25 and vertical_start < 0.45:
                    subcategory = "Gafas de Sol"
                elif aspect_ratio < 0.4 and vertical_start < 0.3:
                    subcategory = "Bufanda"
                elif vertical_start < 0.25 and 0.7 <= aspect_ratio <= 1.4:
                    subcategory = "Gorra"
                else:
                    subcategory = "Bolso"
                confidence_base = 0.75
                
            # 6. Bottom -> Jeans, Pantalón de Vestir, Falda, Shorts
            elif vertical_start > 0.35 or has_split:
                category = "Bottom"
                if has_split:
                    if height_ratio < 0.38:
                        subcategory = "Shorts"
                    else:
                        if color_primary in ["Azul Índigo", "Azul Celeste", "Azul Marino"] or is_denim_semantic:
                            subcategory = "Jeans"
                        else:
                            subcategory = "Pantalón de Vestir"
                else:
                    subcategory = "Falda"
                confidence_base = 0.82
                
            # 7. Top/Outerwear fallback -> Top: Camiseta, Camisa, Blusa, Top Corto, Suéter, Saco; Outerwear: Blazer, Abrigo, Trench, Chaqueta, Chaqueta Puffer
            else:
                is_outerwear = (edge_density > 18 or crop_edge_density > 16 or is_wool_semantic or height_ratio > 0.58)
                if is_outerwear:
                    category = "Outerwear"
                    if height_ratio > 0.58:
                        if color_primary == "Beige Arena" or "trench" in norm_filename or "trench" in norm_path:
                            subcategory = "Trench"
                        else:
                            subcategory = "Abrigo"
                    elif coverage > 0.45 and aspect_ratio > 0.8:
                        subcategory = "Chaqueta Puffer"
                    elif 0.7 <= aspect_ratio <= 1.1 and color_primary in ["Negro Carbón", "Gris Marengo", "Azul Marino"]:
                        subcategory = "Blazer"
                    else:
                        subcategory = "Chaqueta"
                    confidence_base = 0.78
                else:
                    category = "Top"
                    if height_ratio < 0.3:
                        subcategory = "Top Corto"
                    elif is_wool_semantic or (color_primary in ["Marrón Otoño", "Gris Marengo"] and aspect_ratio < 0.85):
                        subcategory = "Suéter"
                    elif color_primary in ["Negro Carbón", "Azul Marino"] and aspect_ratio < 0.9:
                        subcategory = "Saco"
                    elif color_primary in ["Rosa Pastel", "Verde Esmeralda", "Beige Arena"] and aspect_ratio < 0.9:
                        subcategory = "Blusa"
                    elif color_primary in ["Blanco Puro", "Azul Celeste"] and aspect_ratio > 0.8:
                        subcategory = "Camisa"
                    else:
                        subcategory = "Camiseta"
                    confidence_base = 0.75
            
            # Compute confidence score based on features
            contour_score = 0.15 if contours else 0.05
            aspect_score = 0.10 if (aspect_ratio < 0.6 or aspect_ratio > 1.3) else 0.05
            confidence = min(0.98, confidence_base + contour_score + aspect_score)
            
        # 3. TEXTURE & COMPLEX PATTERN RECOGNITION
        norm_filename = ""
        norm_path = ""
        if isinstance(image_path_or_bytes, str):
            filename = os.path.basename(image_path_or_bytes)
            norm_filename = normalize_text(filename)
            norm_path = normalize_text(image_path_or_bytes)

        # Check semantic fallback for patterns
        pattern = "Liso"
        pattern_semantic_match = False
        for kw, pat in PATTERN_KEYWORD_MAPPING.items():
            if kw in norm_filename or kw in norm_path:
                pattern = pat
                pattern_semantic_match = True
                break

        # Check semantic fallback for materials
        material = "Algodón"
        material_semantic_match = False
        for kw, mat in MATERIAL_KEYWORD_MAPPING.items():
            if kw in norm_filename or kw in norm_path:
                material = mat
                material_semantic_match = True
                break

        crop_gray = gray[y:y+h, x:x+w]
        crop_bgr = img_cv[y:y+h, x:x+w]

        # Geometric & spatial gradient fallback for patterns
        if not pattern_semantic_match:
            if crop_gray.size > 100:
                crop_resized = cv2.resize(crop_gray, (120, 120))
                crop_bgr_resized = cv2.resize(crop_bgr, (120, 120))
                
                # Gradients using Sobel
                sobel_x = cv2.Sobel(crop_resized, cv2.CV_64F, 1, 0, ksize=3)
                sobel_y = cv2.Sobel(crop_resized, cv2.CV_64F, 0, 1, ksize=3)
                mag, angle = cv2.cartToPolar(sobel_x, sobel_y, angleInDegrees=True)
                
                # Strong gradient ratio
                mag_threshold = 15.0
                strong_mask = mag > mag_threshold
                strong_ratio = np.sum(strong_mask) / mag.size
                
                if strong_ratio < 0.05:
                    pattern = "Liso"
                else:
                    angles_strong = angle[strong_mask] % 180
                    hist, _ = np.histogram(angles_strong, bins=18, range=(0, 180))
                    hist = hist / (np.sum(hist) + 1e-6)
                    
                    sorted_bins = np.argsort(hist)[::-1]
                    peak1_idx = sorted_bins[0]
                    peak2_idx = sorted_bins[1]
                    
                    # Hough circles for Polka Dots (Lunares)
                    blurred_crop = cv2.GaussianBlur(crop_gray, (5, 5), 0)
                    circles = cv2.HoughCircles(
                        blurred_crop, 
                        cv2.HOUGH_GRADIENT, 
                        dp=1, 
                        minDist=max(12, int(min(w, h)/10)), 
                        param1=50, 
                        param2=25, 
                        minRadius=4, 
                        maxRadius=int(min(w, h)/4)
                    )
                    
                    # Colorfulness metric for Floral in HSV space
                    hsv_crop = cv2.cvtColor(crop_bgr_resized, cv2.COLOR_BGR2HSV)
                    h_channel = hsv_crop[:,:,0]
                    s_channel = hsv_crop[:,:,1]
                    colored_pixels = s_channel > 35
                    hue_std = np.std(h_channel[colored_pixels]) if np.sum(colored_pixels) > 100 else 0.0
                    
                    # Contour analysis for circularity
                    _, crop_thresh = cv2.threshold(cv2.GaussianBlur(crop_gray, (3, 3), 0), 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
                    crop_contours, _ = cv2.findContours(crop_thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                    
                    round_contours = 0
                    total_contours = 0
                    for c in crop_contours:
                        area = cv2.contourArea(c)
                        if 15 < area < (crop_gray.size * 0.1):
                            peri = cv2.arcLength(c, True)
                            if peri > 0:
                                circularity = 4 * np.pi * area / (peri * peri)
                                total_contours += 1
                                if circularity > 0.72:
                                    round_contours += 1
                                    
                    # Differentiate complex patterns
                    if circles is not None and len(circles[0]) >= 3:
                        pattern = "Lunares"
                    elif total_contours >= 4 and (round_contours / total_contours) > 0.6:
                        pattern = "Lunares"
                    elif hist[peak1_idx] > 0.28:
                        pattern = "Rayas"
                    elif hist[peak1_idx] + hist[peak2_idx] > 0.40 and abs((peak1_idx - peak2_idx) % 18 - 9) <= 1:
                        pattern = "Cuadros"
                    elif (hist[4] + hist[5] + hist[13] + hist[14]) > 0.35 and strong_ratio > 0.15:
                        pattern = "Pata de gallo"
                    elif hue_std > 22.0:
                        pattern = "Floral"
                    elif strong_ratio > 0.12:
                        is_neutral_warm = False
                        for col_name in [color_primary, color_secondary]:
                            if col_name in ["Negro Carbón", "Marrón Otoño", "Beige Arena", "Amarillo Mostaza", "Naranja Ladrillo"]:
                                is_neutral_warm = True
                        if is_neutral_warm:
                            pattern = "Animal Print"
                        else:
                            pattern = "Floral"
                    else:
                        pattern = "Liso"
            else:
                pattern = "Liso"

        # Texture and Material analysis fallback
        if not material_semantic_match:
            if crop_gray.size > 100:
                hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
                h_vals, s_vals, v_vals = hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]
                
                v_mean = np.mean(v_vals)
                v_std = np.std(v_vals)
                v_max = np.max(v_vals)
                
                s_mean = np.mean(s_vals)
                
                # Local edge frequency via Laplacian variance
                laplacian = cv2.Laplacian(crop_gray, cv2.CV_64F)
                lap_abs_mean = np.mean(np.abs(laplacian))
                
                # Specularity ratio (highly shiny pixels)
                shiny_pixels = np.sum(v_vals > 230) / v_vals.size
                
                # Blue denim ratio
                blue_mask = (h_vals >= 90) & (h_vals <= 130) & (s_vals > 40) & (v_vals > 30)
                blue_denim_ratio = np.sum(blue_mask) / hsv.size
                
                # Decision tree logic
                if category == "Bottom" and subcategory == "Jeans":
                    material = "Mezclilla"
                elif blue_denim_ratio > 0.15 and lap_abs_mean > 6.0:
                    material = "Mezclilla"
                elif category == "Footwear" and subcategory == "Botas" and s_mean < 80 and lap_abs_mean < 5.0:
                    material = "Cuero"
                elif category == "Accessory" and subcategory == "Bolso" and s_mean < 90 and lap_abs_mean < 4.0:
                    material = "Cuero"
                elif (category == "Outerwear" or subcategory == "Abrigo") and lap_abs_mean > 12.0:
                    material = "Lana"
                elif lap_abs_mean > 14.0 and shiny_pixels < 0.01:
                    material = "Lana"
                elif shiny_pixels > 0.05 and lap_abs_mean < 4.5:
                    if s_mean > 60 or v_mean > 140:
                        material = "Seda"
                    else:
                        material = "Cuero"
                elif shiny_pixels > 0.02 and lap_abs_mean < 3.5:
                    if s_mean > 50 or v_mean > 150:
                        material = "Seda"
                    else:
                        material = "Cuero"
                elif lap_abs_mean < 3.0 and (color_primary in ["Blanco Puro", "Rosa Pastel", "Verde Esmeralda"] or s_mean > 70):
                    material = "Seda"
                elif lap_abs_mean < 3.5 and color_primary in ["Negro Carbón", "Marrón Otoño"]:
                    material = "Cuero"
                elif lap_abs_mean > 8.0:
                    if blue_denim_ratio > 0.08:
                        material = "Mezclilla"
                    else:
                        material = "Algodón"
                else:
                    material = "Algodón"
            else:
                material = "Algodón"

        # Boost confidence to 99% if descriptive clues were in the filename
        if semantic_match or pattern_semantic_match or material_semantic_match:
            confidence = max(confidence, 0.99)
            
        # Strictly map category and subcategory to the new 4 body sectors
        subcat_lower = subcategory.lower()
        cat_mapped = "Superior"
        
        if subcat_lower in ["vestido", "enterizo", "body"]:
            cat_mapped = "Base"
        elif subcat_lower in ["tenis", "botas", "mocasines", "zapatos de vestir", "sandalias", "bolso", "bufanda", "gorra", "gafas de sol", "correa", "medias"]:
            cat_mapped = "Complementos"
        elif subcat_lower in ["jeans", "pantalon de vestir", "falda", "shorts", "pantalon"]:
            cat_mapped = "Inferior"
        elif category in ["Top", "Outerwear"] or subcat_lower in ["camiseta", "blusa", "camisa", "abrigo", "chaqueta", "blazer", "sueter", "saco"]:
            cat_mapped = "Superior"
        else:
            # fallback mapping based on general category
            cat_map = {
                "Top": "Superior", "Outerwear": "Superior",
                "Bottom": "Inferior",
                "Footwear": "Complementos", "Accessory": "Complementos"
            }
            cat_mapped = cat_map.get(category, "Superior")

        return {
            "color_primary": color_primary,
            "color_secondary": color_secondary,
            "category": cat_mapped,
            "subcategory": subcategory,
            "pattern": pattern,
            "material": material,
            "confidence": round(confidence * 100, 2),
            "cutout_base64": cutout_b64
        }
        
    except Exception as e:
        return {
            "color_primary": "Gris Marengo",
            "color_secondary": "Blanco Puro",
            "category": "Top",
            "subcategory": "Camiseta",
            "pattern": "Liso",
            "material": "Algodón",
            "confidence": 50.0,
            "error": str(e)
        }

# BabylonSwarm_Commit_15: feat(brands): add structured tags for premium fabrics (Silk, Wool, Tweed, Leather)

# BabylonSwarm_Commit_57: fix(vision): patch potential edge cases in contour-split calculations
