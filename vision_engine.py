import cv2
import numpy as np
from PIL import Image
import os

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

def get_color_name(rgb):
    """
    Finds the closest color in COLOR_MAP using Euclidean distance in RGB space.
    """
    r, g, b = rgb
    closest_name = "Desconocido"
    min_dist = float('inf')
    
    for name, mapped_rgb in COLOR_MAP.items():
        dist = np.sqrt((r - mapped_rgb[0])**2 + (g - mapped_rgb[1])**2 + (b - mapped_rgb[2])**2)
        if dist < min_dist:
            min_dist = dist
            closest_name = name
            
    return closest_name

def analyze_image(image_path_or_bytes):
    """
    Analyzes an image using OpenCV and PIL to extract:
    - Dominant and secondary colors (in Spanish)
    - Category (Top, Bottom, Footwear, Outerwear, Accessory) and subcategory
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
        # Let's filter out extreme background-like colors (very white or very dark if they occupy too much)
        # unless they are indeed the main clothing color.
        valid_colors = []
        for i, center in enumerate(sorted_centers):
            b, g, r = center
            rgb = (int(r), int(g), int(b))
            percentage = sorted_counts[i] / total_pixels
            
            # Simple heuristic: if a color is extremely white or black and occupies more than 60% of the image,
            # it might be the background, but we keep it anyway and we rank it.
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
            
        # 2. CATEGORY & SUBCATEGORY GEOMETRIC HEURISTICS
        # Convert to grayscale and apply threshold / edge detection
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Use Otsu's thresholding to isolate foreground
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Check if we inverted correctly (clothing should be white on black background)
        # If the corners are white, invert the threshold
        corners = [thresh[0,0], thresh[0,-1], thresh[-1,0], thresh[-1,-1]]
        if sum(corners) > 510: # More than half are white
            thresh = cv2.bitwise_not(thresh)
            
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour
            c = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(c)
        else:
            x, y, w, h = 0, 0, w_orig, h_orig
            
        # Bounding box metrics
        aspect_ratio = float(w) / h
        box_area = w * h
        img_area = w_orig * h_orig
        coverage = float(box_area) / img_area
        
        # Make predictions based on aspect ratio and spatial context
        category = "Top"
        subcategory = "Camiseta"
        confidence_base = 0.65
        
        if aspect_ratio >= 1.25:
            # Wide box
            if coverage < 0.20:
                category = "Accessory"
                subcategory = "Gafas de Sol"
                confidence_base = 0.85
            else:
                # Could be shoes or a wide accessory (bag)
                # Footwear is usually placed lower in the frame
                if y + h/2 > h_orig * 0.5:
                    category = "Footwear"
                    subcategory = "Tenis"
                    confidence_base = 0.80
                else:
                    category = "Accessory"
                    subcategory = "Bolso"
                    confidence_base = 0.70
        elif aspect_ratio < 0.65:
            # Tall box
            # Distinguish between Pants (Bottom) and Trench Coat (Outerwear)
            # Let's inspect the bottom half of the bounding box. Pants have a split.
            bottom_half_y = int(y + h * 0.5)
            bottom_half_img = thresh[bottom_half_y:y+h, x:x+w]
            
            # Check the horizontal profile in the lower part of the bottom half
            profile = np.mean(bottom_half_img, axis=0)
            # Pants usually have two peaks (legs) separated by a valley (background)
            # Let's check for a significant dip in the center
            if len(profile) > 20:
                mid = len(profile) // 2
                left_mean = np.mean(profile[:mid])
                right_mean = np.mean(profile[mid:])
                center_val = np.mean(profile[mid-2:mid+2])
                
                # If center is significantly lower than left and right, it's likely pants (two legs)
                if center_val < 0.6 * max(left_mean, right_mean):
                    category = "Bottom"
                    subcategory = "Jeans"
                    confidence_base = 0.82
                else:
                    # Could be skirt or long coat
                    if y < h_orig * 0.2:
                        category = "Outerwear"
                        subcategory = "Abrigo"
                        confidence_base = 0.75
                    else:
                        category = "Bottom"
                        subcategory = "Falda"
                        confidence_base = 0.70
            else:
                category = "Bottom"
                subcategory = "Pantalón de Vestir"
                confidence_base = 0.72
        else:
            # Medium aspect ratio (0.65 to 1.25)
            # Top, Jacket, or Handbag
            # Outerwear usually starts high and is wide, often has high gradient due to collars / zippers
            # Let's estimate using vertical position and coverage
            if y > h_orig * 0.3:
                category = "Bottom"
                subcategory = "Falda"
                confidence_base = 0.68
            else:
                # Analyze edges to separate Outerwear from Top
                edges = cv2.Canny(gray, 50, 150)
                edge_density = np.mean(edges)
                if edge_density > 20: # High detail, zipper, details
                    category = "Outerwear"
                    subcategory = "Chaqueta"
                    confidence_base = 0.75
                else:
                    category = "Top"
                    subcategory = "Blusa" if color_primary in ["Rosa Pastel", "Negro Carbón"] else "Camiseta"
                    confidence_base = 0.78
                    
        # 3. PATTERN DETECTION USING GRADIENTS / EDGES
        # Crop the garment bounding box to analyze texture
        crop_gray = gray[y:y+h, x:x+w]
        if crop_gray.size > 100:
            # Resize cropped image for uniform analysis
            crop_resized = cv2.resize(crop_gray, (80, 80))
            
            # Compute Sobel gradients
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
                # Ratio between horizontal and vertical gradients
                # Stripes are highly directional
                ratio = mean_x / (mean_y + 1e-6)
                if ratio > 1.8 or ratio < 0.55:
                    pattern = "Rayas"
                else:
                    # Check for checkered patterns vs random print
                    # Gradients are balanced but we look at local standard deviations
                    std_x = np.std(abs_x)
                    std_y = np.std(abs_y)
                    # High regular variation indicates grid
                    if std_x > 25 and std_y > 25:
                        pattern = "Cuadros"
                    else:
                        pattern = "Estampado"
        else:
            pattern = "Liso"
            
        # 4. CONFIDENCE SCORE ESTIMATION
        # Combine heuristics: contour validity, aspect ratio fit, color purity
        contour_score = 0.15 if contours else 0.05
        # If aspect ratio fits well in standard category domains
        aspect_score = 0.10 if (aspect_ratio < 0.6 or aspect_ratio > 1.3) else 0.05
        confidence = min(0.98, confidence_base + contour_score + aspect_score)
        
        return {
            "color_primary": color_primary,
            "color_secondary": color_secondary,
            "category": category,
            "subcategory": subcategory,
            "pattern": pattern,
            "confidence": round(confidence * 100, 2)
        }
        
    except Exception as e:
        # Fallback to realistic values in case of failure
        return {
            "color_primary": "Gris Marengo",
            "color_secondary": "Blanco Puro",
            "category": "Top",
            "subcategory": "Camiseta",
            "pattern": "Liso",
            "confidence": 50.0,
            "error": str(e)
        }
