import cv2
import numpy as np
from PIL import Image
import os
import unicodedata

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
    Normalizes string by converting to lowercase and stripping accents/diacritics.
    """
    if not text:
        return ""
    text = text.lower()
    text = "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    return text

# Semantic mapping of filename keywords to categories and subcategories
KEYWORD_MAPPING = {
    "camisa": ("Top", "Camisa"),
    "blusa": ("Top", "Blusa"),
    "saco": ("Outerwear", "Chaqueta"),
    "blazer": ("Outerwear", "Chaqueta"),
    "pantalon": ("Bottom", "Pantalón de Vestir"),
    "jeans": ("Bottom", "Jeans"),
    "falda": ("Bottom", "Falda"),
    "vestido": ("Top", "Vestido"),
    "abrigo": ("Outerwear", "Abrigo"),
    "trench": ("Outerwear", "Abrigo"),
    "zapatos": ("Footwear", "Mocasines"),
    "tenis": ("Footwear", "Tenis"),
    "mocasines": ("Footwear", "Mocasines"),
    "botas": ("Footwear", "Botas"),
    "bolso": ("Accessory", "Bolso"),
    "gafas": ("Accessory", "Gafas de Sol"),
    "collar": ("Accessory", "Collar"),
    "correa": ("Accessory", "Correa")
}

def analyze_image(image_path_or_bytes):
    """
    Analyzes an image using OpenCV and PIL to extract:
    - Dominant and secondary colors (in Spanish) mapped via CIELAB Delta-E 1976
    - Category (Top, Bottom, Footwear, Outerwear, Accessory) and subcategory,
      prioritizing semantic filename clues and falling back to advanced geometric heuristics.
    - Pattern (Liso, Rayas, Cuadros, Estampado)
    - Realistic confidence score (0.0 to 1.0)
    """
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
        
        # 1. COLOR ANALYSIS
        # Resize to smaller image to speed up color clustering
        img_resized = cv2.resize(img_cv, (100, 100))
        pixels = img_resized.reshape(-1, 3).astype(np.float32)
        
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
        
        # Check filename/path for semantic fallback first
        if isinstance(image_path_or_bytes, str):
            filename = os.path.basename(image_path_or_bytes)
            norm_filename = normalize_text(filename)
            norm_path = normalize_text(image_path_or_bytes)
            
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
        corners = [thresh[0,0], thresh[0,-1], thresh[-1,0], thresh[-1,-1]]
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
        
        if semantic_match:
            # Semantic filename keywords ensure high confidence and bypass geometric heuristic classification
            confidence = 0.99
        else:
            # Advanced Geometric Heuristics Fallback
            has_split = False
            if contours:
                mask_crop = thresh[y:y+h, x:x+w]
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
            
            # Classification logic based on aspect ratio, coverage, vertical position and contour split
            if vertical_center > 0.65 and coverage < 0.4:
                category = "Footwear"
                if aspect_ratio > 1.3:
                    subcategory = "Tenis" if color_primary in ["Blanco Puro", "Azul Celeste"] else "Mocasines"
                elif aspect_ratio < 0.8:
                    subcategory = "Botas"
                else:
                    subcategory = "Mocasines"
                confidence_base = 0.80
                
            elif aspect_ratio >= 1.25 and coverage < 0.15 and vertical_start < 0.4:
                category = "Accessory"
                subcategory = "Gafas de Sol"
                confidence_base = 0.88
                
            elif 0.7 <= aspect_ratio <= 1.4 and coverage < 0.25 and 0.2 <= vertical_center <= 0.8:
                category = "Accessory"
                subcategory = "Bolso"
                confidence_base = 0.75
                
            elif aspect_ratio < 0.4 and coverage < 0.15 and vertical_start < 0.3:
                category = "Accessory"
                subcategory = "Bufanda"
                confidence_base = 0.72
                
            elif aspect_ratio < 0.7 and vertical_start < 0.25 and h / h_orig > 0.65 and not has_split:
                category = "Outerwear"
                subcategory = "Abrigo"
                confidence_base = 0.82
                
            elif vertical_start > 0.35 and (has_split or aspect_ratio < 0.9):
                category = "Bottom"
                if has_split:
                    subcategory = "Jeans" if color_primary in ["Azul Índigo", "Azul Celeste", "Azul Marino"] else "Pantalón de Vestir"
                else:
                    subcategory = "Falda"
                confidence_base = 0.85
                
            else:
                if vertical_start < 0.3:
                    edges = cv2.Canny(gray, 50, 150)
                    edge_density = np.mean(edges)
                    if edge_density > 18:
                        category = "Outerwear"
                        if coverage > 0.45 and aspect_ratio > 0.8:
                            subcategory = "Chaqueta Puffer"
                        else:
                            subcategory = "Chaqueta"
                        confidence_base = 0.78
                    else:
                        category = "Top"
                        if color_primary in ["Rosa Pastel", "Verde Esmeralda", "Beige Arena"] and aspect_ratio < 0.9:
                            subcategory = "Blusa"
                        elif color_primary in ["Blanco Puro", "Azul Celeste"] and aspect_ratio > 0.8:
                            subcategory = "Camisa"
                        else:
                            subcategory = "Camiseta"
                        confidence_base = 0.75
                else:
                    category = "Bottom"
                    subcategory = "Falda" if aspect_ratio > 0.9 else "Pantalón de Vestir"
                    confidence_base = 0.60
            
            # Compute confidence score based on features
            contour_score = 0.15 if contours else 0.05
            aspect_score = 0.10 if (aspect_ratio < 0.6 or aspect_ratio > 1.3) else 0.05
            confidence = min(0.98, confidence_base + contour_score + aspect_score)
            
        # 3. PATTERN DETECTION USING GRADIENTS / EDGES
        crop_gray = gray[y:y+h, x:x+w]
        if crop_gray.size > 100:
            crop_resized = cv2.resize(crop_gray, (80, 80))
            
            sobel_x = cv2.Sobel(crop_resized, cv2.CV_64F, 1, 0, ksize=3)
            sobel_y = cv2.Sobel(crop_resized, cv2.CV_64F, 0, 1, ksize=3)
            
            abs_x = np.abs(sobel_x)
            abs_y = np.abs(sobel_y)
            
            mean_x = np.mean(abs_x)
            mean_y = np.mean(abs_y)
            
            total_gradient = mean_x + mean_y
            
            if total_gradient < 12.0:
                pattern = "Liso"
            else:
                ratio = mean_x / (mean_y + 1e-6)
                if ratio > 1.8 or ratio < 0.55:
                    pattern = "Rayas"
                else:
                    std_x = np.std(abs_x)
                    std_y = np.std(abs_y)
                    if std_x > 25 and std_y > 25:
                        pattern = "Cuadros"
                    else:
                        pattern = "Estampado"
        else:
            pattern = "Liso"
            
        return {
            "color_primary": color_primary,
            "color_secondary": color_secondary,
            "category": category,
            "subcategory": subcategory,
            "pattern": pattern,
            "confidence": round(confidence * 100, 2)
        }
        
    except Exception as e:
        return {
            "color_primary": "Gris Marengo",
            "color_secondary": "Blanco Puro",
            "category": "Top",
            "subcategory": "Camiseta",
            "pattern": "Liso",
            "confidence": 50.0,
            "error": str(e)
        }
