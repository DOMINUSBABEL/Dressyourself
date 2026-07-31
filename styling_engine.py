import random

# Color groups for harmony calculation
COLOR_FAMILIES = {
    "BLUE": ["Azul Índigo", "Azul Celeste", "Azul Marino"],
    "GREEN": ["Verde Musgo", "Verde Esmeralda", "Verde Oliva"],
    "RED_PINK": ["Rojo Carmín", "Rosa Pastel"],
    "YELLOW_BROWN": ["Amarillo Mostaza", "Naranja Ladrillo", "Marrón Otoño", "Beige Arena"],
    "NEUTRAL": ["Blanco Puro", "Negro Carbón", "Gris Marengo", "Gris Perla"]
}

# Map color to family
def get_color_family(color_name):
    if not color_name:
        return "NEUTRAL"
    norm = normalize_str(color_name)
    for family, colors in COLOR_FAMILIES.items():
        for c in colors:
            norm_c = normalize_str(c)
            if norm_c in norm or norm in norm_c:
                return family
    # Fallback keyword matching
    if any(k in norm for k in ["azul", "blue"]):
        return "BLUE"
    if any(k in norm for k in ["verde", "green"]):
        return "GREEN"
    if any(k in norm for k in ["rojo", "rosa", "red", "pink", "morado", "purpura", "magenta"]):
        return "RED_PINK"
    if any(k in norm for k in ["amarillo", "naranja", "marron", "beige", "brown", "yellow", "orange", "cafe"]):
        return "YELLOW_BROWN"
    return "NEUTRAL"

# Complementary pairs
COMPLEMENTARY_PAIRS = [
    ("BLUE", "YELLOW_BROWN"),
    ("YELLOW_BROWN", "BLUE"),
    ("RED_PINK", "GREEN"),
    ("GREEN", "RED_PINK"),
    ("NEUTRAL", "RED_PINK"), # High contrast
]

# Analogous relationships
ANALOGOUS_RELATIONS = {
    "BLUE": ["GREEN", "NEUTRAL"],
    "GREEN": ["BLUE", "YELLOW_BROWN"],
    "YELLOW_BROWN": ["GREEN", "RED_PINK"],
    "RED_PINK": ["YELLOW_BROWN", "NEUTRAL"],
    "NEUTRAL": ["BLUE", "GREEN", "YELLOW_BROWN", "RED_PINK"]
}

# 12-Season Color Theory Definitions
SEASONS_INFO = {
    "Spring Light": {
        "name_es": "Primavera Clara",
        "ideal_colors": ["Blanco Puro", "Azul Celeste", "Rosa Pastel", "Beige Arena", "Amarillo Mostaza"],
        "contrast": "bajo",
        "description": "tonos pastel, cálidos e iluminados que transmiten frescura y juventud."
    },
    "Spring Warm": {
        "name_es": "Primavera Cálida",
        "ideal_colors": ["Amarillo Mostaza", "Naranja Ladrillo", "Beige Arena", "Verde Esmeralda", "Azul Celeste"],
        "contrast": "medio",
        "description": "colores cálidos y vibrantes inspirados en la naturaleza soleada."
    },
    "Spring Clear": {
        "name_es": "Primavera Brillante",
        "ideal_colors": ["Blanco Puro", "Azul Celeste", "Rojo Carmín", "Verde Esmeralda", "Negro Carbón", "Morado Purpúreo"],
        "contrast": "alto",
        "description": "tonos altamente saturados y de alto impacto que irradian energía clara."
    },
    "Summer Light": {
        "name_es": "Verano Claro",
        "ideal_colors": ["Blanco Puro", "Azul Celeste", "Rosa Pastel", "Gris Perla", "Azul Marino"],
        "contrast": "bajo",
        "description": "colores suaves, fríos y delicados que evocan frescura y serenidad."
    },
    "Summer Cool": {
        "name_es": "Verano Frío",
        "ideal_colors": ["Azul Celeste", "Gris Perla", "Gris Marengo", "Azul Marino", "Rosa Pastel"],
        "contrast": "medio",
        "description": "matices fríos y apagados ideales para proyectar elegancia clásica y calma."
    },
    "Summer Soft": {
        "name_es": "Verano Suave",
        "ideal_colors": ["Gris Perla", "Gris Marengo", "Azul Celeste", "Verde Musgo", "Rosa Pastel"],
        "contrast": "bajo",
        "description": "tonos empolvados, aterciopelados y fríos con una sutil elegancia apagada."
    },
    "Autumn Soft": {
        "name_es": "Otoño Suave",
        "ideal_colors": ["Beige Arena", "Verde Oliva", "Marrón Otoño", "Verde Musgo", "Amarillo Mostaza"],
        "contrast": "bajo",
        "description": "tonos cálidos y apagados inspirados en los paisajes terrestres y arenas."
    },
    "Autumn Warm": {
        "name_es": "Otoño Cálido",
        "ideal_colors": ["Marrón Otoño", "Naranja Ladrillo", "Verde Oliva", "Amarillo Mostaza", "Beige Arena"],
        "contrast": "medio",
        "description": "gamas ricas, profundas y cálidas que capturan la esencia del bosque otoñal."
    },
    "Autumn Deep": {
        "name_es": "Otoño Oscuro",
        "ideal_colors": ["Marrón Otoño", "Verde Oliva", "Azul Marino", "Negro Carbón", "Naranja Ladrillo"],
        "contrast": "alto",
        "description": "colores oscuros y cálidos de gran riqueza que proyectan misterio y fuerza."
    },
    "Winter Deep": {
        "name_es": "Invierno Oscuro",
        "ideal_colors": ["Negro Carbón", "Azul Marino", "Gris Marengo", "Rojo Carmín", "Morado Purpúreo"],
        "contrast": "alto",
        "description": "tonos muy oscuros e intensamente fríos que exudan elegancia aristocrática."
    },
    "Winter Cool": {
        "name_es": "Invierno Frío",
        "ideal_colors": ["Negro Carbón", "Gris Marengo", "Gris Perla", "Azul Marino", "Azul Índigo", "Rojo Carmín"],
        "contrast": "alto",
        "description": "colores puros, helados e intensos que marcan una silueta nítida."
    },
    "Winter Clear": {
        "name_es": "Invierno Brillante",
        "ideal_colors": ["Negro Carbón", "Blanco Puro", "Rojo Carmín", "Azul Índigo", "Verde Esmeralda", "Morado Purpúreo"],
        "contrast": "alto",
        "description": "tonos joya de gran saturación y contraste extremo que brillan con luz propia."
    }
}

# Occasion Formal Rules
OCCASIONS_RULES = {
    "Quiet Luxury": {
        "min_formality": 6.5,
        "max_formality": 8.5,
        "preferred_types": ["blazer", "sastre", "pantalon de vestir", "camisa", "blusa", "mocasines", "trench", "abrigo de lana", "sueter"],
        "avoid_types": ["camiseta", "sudadera", "sweatpants", "puffer", "tenis de correr", "jeans rotos"],
        "color_palettes": ["Beige Arena", "Gris Marengo", "Gris Perla", "Blanco Puro", "Negro Carbón", "Azul Marino", "Marrón Otoño"],
        "pattern_pref": ["liso"],
        "name_es": "Lujo Silencioso"
    },
    "Business Casual": {
        "min_formality": 5.5,
        "max_formality": 7.5,
        "preferred_types": ["blazer", "camisa", "blusa", "chino", "pantalon de vestir", "mocasines", "zapatos", "sueter", "cardigan"],
        "avoid_types": ["camiseta basica", "hoodie", "buzo", "sudadera", "sweatpants", "tenis de correr", "slides", "sandalias"],
        "color_palettes": None,
        "pattern_pref": ["liso", "rayas", "cuadros"],
        "name_es": "Business Casual"
    },
    "Sporty": {
        "min_formality": 1.5,
        "max_formality": 4.0,
        "preferred_types": ["camiseta", "tenis", "sudadera", "sweatpants", "hoodie", "buzo", "puffer", "cortavientos", "windbreaker", "gorra", "gafas de sol"],
        "avoid_types": ["mocasines", "pantalon de vestir", "abrigo de lana", "falda", "blusa", "sastre", "blazer", "tacones", "heels"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Deportivo Chic"
    },
    "Cocktail": {
        "min_formality": 7.0,
        "max_formality": 9.0,
        "preferred_types": ["blusa", "falda", "vestido", "mocasines", "botas", "heels", "tacones", "blazer", "sastre", "bolso", "seda", "satin"],
        "avoid_types": ["camiseta", "tenis", "puffer", "sudadera", "sweatpants", "hoodie", "buzo"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Coctel"
    },
    "Gala": {
        "min_formality": 9.0,
        "max_formality": 10.0,
        "preferred_types": ["tuxedo", "esmoquin", "vestido de noche", "satin", "seda", "heels", "tacones", "corbatin", "charol", "blazer sastre"],
        "avoid_types": ["jeans", "denim", "vaquero", "camiseta", "tenis", "hoodie", "buzo", "puffer", "sudadera", "sweatpants", "canvas", "lona"],
        "color_palettes": None,
        "pattern_pref": ["liso"],
        "name_es": "Gala"
    },
    "Casual": {
        "min_formality": 3.0,
        "max_formality": 6.0,
        "preferred_types": ["camiseta", "jeans", "tenis", "chaqueta", "chaqueta denim", "gafas de sol", "bolso", "sueter", "cardigan"],
        "avoid_types": ["mocasines", "pantalon de vestir", "abrigo", "tuxedo", "esmoquin"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Casual"
    },
    "Formal": {
        "min_formality": 7.5,
        "max_formality": 9.5,
        "preferred_types": ["blusa", "camisa", "pantalon de vestir", "mocasines", "botas", "abrigo", "bolso", "blazer", "sastre"],
        "avoid_types": ["camiseta", "tenis", "chaqueta denim", "hoodie", "buzo", "sudadera", "sweatpants"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Formal"
    },
    "Deportivo": {
        "min_formality": 1.5,
        "max_formality": 4.0,
        "preferred_types": ["camiseta", "tenis", "sudadera", "sweatpants", "hoodie", "buzo", "puffer", "cortavientos", "windbreaker", "gorra", "gafas de sol"],
        "avoid_types": ["mocasines", "pantalon de vestir", "abrigo de lana", "falda", "blusa", "sastre", "blazer", "tacones", "heels"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Deportivo"
    },
    "Fiesta": {
        "min_formality": 6.5,
        "max_formality": 8.5,
        "preferred_types": ["blusa", "falda", "vestido", "mocasines", "botas", "heels", "tacones", "blazer", "sastre", "bolso", "seda", "satin"],
        "avoid_types": ["camiseta", "tenis", "puffer", "sudadera", "sweatpants", "hoodie", "buzo"],
        "color_palettes": None,
        "pattern_pref": None,
        "name_es": "Fiesta"
    }
}

# Legacy Occasions subcategory mapping
OCCASIONS_MAP = {
    "Casual": {
        "preferred": ["Camiseta", "Jeans", "Tenis", "Chaqueta", "Chaqueta Denim", "Gafas de Sol", "Bolso"],
        "avoid": ["Mocasines", "Pantalón de Vestir", "Abrigo"]
    },
    "Formal": {
        "preferred": ["Blusa", "Camisa", "Pantalón de Vestir", "Mocasines", "Botas", "Abrigo", "Bolso"],
        "avoid": ["Camiseta", "Tenis", "Chaqueta Denim"]
    },
    "Deportivo": {
        "preferred": ["Camiseta", "Tenis", "Chaqueta Puffer", "Gafas de Sol"],
        "avoid": ["Mocasines", "Pantalón de Vestir", "Abrigo", "Falda", "Blusa"]
    },
    "Fiesta": {
        "preferred": ["Blusa", "Falda", "Jeans", "Mocasines", "Botas", "Chaqueta", "Bolso", "Gafas de Sol"],
        "avoid": ["Camiseta", "Chaqueta Puffer"]
    }
}

# Cities weather list
CITIES = [
    {"index": 0, "name": "Bogotá", "temp": 12.0, "rain": 1, "wind_speed": 3.2},
    {"index": 1, "name": "Medellín", "temp": 22.0, "rain": 0, "wind_speed": 1.8},
    {"index": 2, "name": "Cartagena", "temp": 30.0, "rain": 0, "wind_speed": 5.5},
    {"index": 3, "name": "Cali", "temp": 26.0, "rain": 1, "wind_speed": 2.1},
    {"index": 4, "name": "Londres", "temp": 8.0, "rain": 1, "wind_speed": 6.2},
    {"index": 5, "name": "Nueva York", "temp": 5.0, "rain": 0, "wind_speed": 7.5}
]

def normalize_str(s):
    if not s:
        return ""
    import unicodedata
    s = s.strip().lower()
    s = "".join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s

def parse_color(color_name):
    n_name = normalize_str(color_name)
    map_data = {
        "blanco puro": (0, 0, 100, True),
        "negro carbon": (0, 0, 10, True),
        "gris marengo": (210, 8, 45, True),
        "gris perla": (0, 0, 86, True),
        "azul indigo": (240, 100, 27, False),
        "azul celeste": (197, 98, 76, False),
        "azul marino": (215, 65, 11, True),
        "verde musgo": (180, 25, 25, False),
        "verde esmeralda": (146, 100, 39, False),
        "verde oliva": (80, 60, 35, True),
        "rojo carmin": (350, 100, 50, False),
        "marron otono": (25, 75, 31, True),
        "beige arena": (60, 56, 91, True),
        "amarillo mostaza": (45, 86, 49, False),
        "naranja ladrillo": (18, 76, 47, False),
        "rosa pastel": (350, 100, 90, False),
        "morado purpureo": (300, 100, 50, False),
        "cream": (60, 10, 95, True),
        "ivory": (60, 10, 95, True),
    }
    if n_name in map_data:
        return map_data[n_name]
    for key, val in map_data.items():
        if key in n_name or n_name in key:
            return val
    if any(k in n_name for k in ["gris", "blanco", "negro", "beige", "marron", "cafe", "crema"]):
        return (0, 5, 50, True)
    if "azul" in n_name:
        return (240, 80, 50, False)
    if "verde" in n_name:
        return (120, 80, 50, False)
    if "rojo" in n_name:
        return (0, 80, 50, False)
    if "rosa" in n_name:
        return (350, 80, 75, False)
    if "amarillo" in n_name:
        return (60, 80, 50, False)
    if "naranja" in n_name:
        return (30, 80, 50, False)
    if "morado" in n_name or "violeta" in n_name:
        return (300, 80, 50, False)
    return (0, 0, 50, True)

def map_hue_to_center(hue):
    hue = hue % 360
    if hue >= 345 or hue < 15:
        return 0
    elif 15 <= hue < 45:
        return 30
    elif 45 <= hue < 75:
        return 60
    elif 75 <= hue < 105:
        return 90
    elif 105 <= hue < 135:
        return 120
    elif 135 <= hue < 165:
        return 150
    elif 165 <= hue < 195:
        return 180
    elif 195 <= hue < 225:
        return 210
    elif 225 <= hue < 255:
        return 240
    elif 255 <= hue < 285:
        return 270
    elif 285 <= hue < 315:
        return 300
    elif 315 <= hue < 345:
        return 330
    return 0

def get_formality(item):
    name = normalize_str(item.get("name", ""))
    subcat = normalize_str(item.get("subcategory", ""))
    category = normalize_str(item.get("category", ""))
    if any(k in name or k in subcat for k in ["tuxedo", "esmoquin", "gala", "gown", "vestido de noche", "charol", "bowtie", "corbatin de seda"]):
        return 10.0
    if any(k in name or k in subcat for k in ["blazer", "sastre", "vestir", "chelsea", "trench", "abrigo de lana", "seda", "heels", "tacones"]):
        return 8.0
    if any(k in name or k in subcat for k in ["chino", "loafer", "mocasines", "polo", "sueter", "cardigan", "fine-knit", "tenis urbanos", "cuero limpia"]):
        return 6.0
    if any(k in name or k in subcat for k in ["jeans", "denim", "vaquero", "hoodie", "buzo", "camiseta basica", "graphic", "canvas", "lona", "bufanda", "bolso"]):
        return 4.0
    if any(k in name or k in subcat for k in ["sudadera", "sweatpants", "running", "correr", "athletic", "deport", "slides", "sandalias", "puffer", "cortavientos", "windbreaker"]):
        return 2.0
    if category == "accessory":
        return 6.0
    if category == "footwear":
        return 6.0
    if category == "outerwear":
        return 6.0
    if category == "top":
        return 4.0
    if category == "bottom":
        return 4.0
    return 5.0

def get_pattern_index(item):
    pat = normalize_str(item.get("pattern", "liso"))
    if any(k in pat for k in ["liso", "solid", "none"]):
        return 0
    if any(k in pat for k in ["raya", "stripe", "lineas"]):
        return 1
    if any(k in pat for k in ["cuadro", "check", "plaid", "tartan", "houndstooth"]):
        return 2
    if any(k in pat for k in ["floral", "botanical", "flores"]):
        return 3
    if any(k in pat for k in ["polka", "punto", "lunar"]):
        return 4
    if any(k in pat for k in ["graphic", "print", "dibujo", "estampado"]):
        return 5
    if any(k in pat for k in ["animal", "leopardo", "cebra", "tigre"]):
        return 6
    return 0

PATTERN_MATRIX = [
    [100,  95,    95,    90,     90,    90,      85],
    [95,   60,    30,    50,     50,    45,      30],
    [95,   30,    40,    30,     35,    30,      25],
    [90,   50,    30,    50,     45,    40,      30],
    [90,   50,    35,    45,     50,    40,      30],
    [90,   45,    30,    40,     40,    30,      25],
    [85,   30,    25,    30,     30,    25,      40]
]

def get_thermal_index_and_layer(item):
    name = normalize_str(item.get("name", ""))
    subcat = normalize_str(item.get("subcategory", ""))
    category = normalize_str(item.get("category", ""))
    if any(k in name or k in subcat for k in ["sandalia", "slide", "chancla"]):
        return 0.2, "Footwear"
    if "lino" in name or "lino" in subcat:
        return 0.5, "L1"
    if any(k in name or k in subcat for k in ["trench", "gabardina", "cortaviento", "windbreaker"]):
        return 3.0, "L3"
    if any(k in name or k in subcat for k in ["parka", "puffer", "abrigo de lana", "plumon", "abrigo trench de lana"]):
        return 5.0, "L3"
    if any(k in name or k in subcat for k in ["lana", "cashmere", "sueter", "cardigan", "jersey"]):
        return 3.5, "L2"
    if any(k in name or k in subcat for k in ["hoodie", "buzo", "chaleco", "chaqueta ligera", "chaqueta denim"]):
        return 2.5, "L2"
    if "bota" in name or "bota" in subcat:
        return 1.8, "Footwear"
    if any(k in name or k in subcat for k in ["tenis", "mocasines", "sneaker", "zapato"]):
        return 1.0, "Footwear"
    if "jean" in name or "vaquero" in name:
        return 1.8, "L1"
    if any(k in name or k in subcat for k in ["camiseta", "pantalon", "chino", "blusa", "camisa", "falda"]):
        return 1.2, "L1"
    if category == "top":
        return 1.2, "L1"
    if category == "bottom":
        return 1.2, "L1"
    if category == "footwear":
        return 1.0, "Footwear"
    if category == "outerwear":
        return 3.0, "L3"
    if category == "accessory":
        return 0.5, "L4"
    return 1.0, "L1"

def get_city_weather_conditions(city_name, temp, rain):
    uv = 1
    humidity = 50
    if temp >= 25 and not rain:
        uv = 7
    elif temp >= 20 and not rain:
        uv = 5
    if city_name in ["Cartagena", "Cali", "Barranquilla"]:
        humidity = 75 if temp >= 25 else 60
    elif rain:
        humidity = 80
    return uv, humidity

def angular_distance(theta1, theta2):
    return min(abs(theta1 - theta2), 360 - abs(theta1 - theta2))

def is_analog_monochrome_check(items):
    colors = [it.get("color_primary") for it in items if it and it.get("color_primary")]
    if not colors:
        return True
    parsed = [parse_color(c) for c in colors]
    chromatic = [c for c in parsed if not c[3]]
    if not chromatic:
        return True
    hues = [map_hue_to_center(c[0]) for c in chromatic]
    for i in range(len(hues)):
        for j in range(i + 1, len(hues)):
            if angular_distance(hues[i], hues[j]) > 60:
                return False
    return True

def evaluate_visual_proportions(upper, bottom):
    if not upper or not bottom:
        return 0.0, "Proporción Neutra", "Se necesitan prendas superior e inferior para evaluar la proporción áurea."
    
    upper_name = normalize_str(upper.get("name", ""))
    upper_subcat = normalize_str(upper.get("subcategory", ""))
    
    bottom_name = normalize_str(bottom.get("name", ""))
    bottom_subcat = normalize_str(bottom.get("subcategory", ""))
    
    def get_fit(name, subcat):
        n_s = name + " " + subcat
        if any(k in n_s for k in ["ajustad", "slim", "body", "fitted", "entallado", "seda", "skinny", "ceñido"]):
            return "entallado"
        if any(k in n_s for k in ["oversize", "holgado", "puffer", "buzo", "hoodie", "sueter", "cardigan", "plisada", "palazzo", "wide leg", "amplio"]):
            return "amplio"
        if any(k in n_s for k in ["blazer", "sastre", "vestir", "pantalon de vestir", "abrigo", "trench", "estructurado"]):
            return "estructurado"
        return "regular"

    upper_fit = get_fit(upper_name, upper_subcat)
    bottom_fit = get_fit(bottom_name, bottom_subcat)
    
    if any(k in upper_name or k in upper_subcat for k in ["cropped", "corto", "crop", "tucked", "body", "seda", "blusa", "fajado", "tuck"]):
        upper_height = 1.0
    elif any(k in upper_name or k in upper_subcat for k in ["sueter", "cardigan", "hoodie", "buzo", "oversize", "abrigo", "trench", "parka"]):
        upper_height = 1.8
    else:
        upper_height = 1.2
        
    if any(k in bottom_name or k in bottom_subcat for k in ["short", "falda corta", "minifalda", "bermuda"]):
        bottom_height = 1.0
    elif any(k in bottom_name or k in bottom_subcat for k in ["sastre", "vestir", "plisada", "maxi", "alto", "tiro alto"]):
        bottom_height = 2.0
    else:
        bottom_height = 1.5
        
    ratio = upper_height / (upper_height + bottom_height)
    
    proportion_bonus = 0.0
    ratio_type = "Proporción Estándar"
    details = ""
    
    if 0.30 <= ratio <= 0.42:
        proportion_bonus += 10.0
        ratio_type = "Silueta de la Regla de los Tercios (1/3 superior)"
        details = "Presenta la Proporción de los Tercios ideal (1/3 superior y 2/3 inferior), alargando las piernas visualmente."
    elif 0.58 <= ratio <= 0.70:
        proportion_bonus += 10.0
        ratio_type = "Silueta de la Regla de los Tercios (2/3 superior)"
        details = "Presenta la Proporción de los Tercios inversa (2/3 superior y 1/3 inferior), una propuesta editorial de alto impacto."
    else:
        ratio_type = "Proporción 1:1 Simétrica"
        details = "Muestra una proporción simétrica de 1:1 que divide la silueta a la mitad."
        
    fit_bonus = 0.0
    if (upper_fit == "entallado" and bottom_fit == "amplio") or (upper_fit == "amplio" and bottom_fit == "entallado"):
        fit_bonus += 5.0
        details += " Equilibrio de volúmenes perfecto (entallado + amplio)."
    elif upper_fit == "estructurado" and bottom_fit == "estructurado":
        fit_bonus += 5.0
        details += " Coherencia de sastrería estructurada y porte impecable."
    elif upper_fit == "amplio" and bottom_fit == "amplio":
        fit_bonus -= 5.0
        details += " Silueta con exceso de volumen holgado en ambas partes (saturación de silueta)."
    elif upper_fit == "entallado" and bottom_fit == "entallado":
        fit_bonus -= 3.0
        details += " Silueta totalmente ceñida, restando profundidad visual al conjunto."
        
    return proportion_bonus + fit_bonus, ratio_type, details

def evaluate_textures_and_layering(items):
    top_item = next((it for it in items if it.get("category") == "Top"), None)
    outer_item = next((it for it in items if it.get("category") == "Outerwear"), None)
    
    def get_weight(item):
        if not item: return 0
        name = normalize_str(item.get("name", ""))
        subcat = normalize_str(item.get("subcategory", ""))
        category = normalize_str(item.get("category", ""))
        
        if any(k in name or k in subcat for k in ["lino", "silk", "seda", "camiseta", "t-shirt", "crop", "sandalia", "slide"]):
            return 1
        if any(k in name or k in subcat for k in ["camisa", "shirt", "blusa"]):
            return 2
        if any(k in name or k in subcat for k in ["sueter", "cardigan", "jersey", "buzo", "hoodie", "denim", "chaqueta denim"]):
            return 3
        if any(k in name or k in subcat for k in ["blazer", "chaqueta ligera"]):
            return 4
        if any(k in name or k in subcat for k in ["abrigo", "puffer", "wool", "lana", "trench", "gabardina", "plumon", "parka"]):
            return 5
        
        if category == "top": return 2
        if category == "outerwear": return 4
        return 2

    top_weight = get_weight(top_item)
    outer_weight = get_weight(outer_item)
    
    layering_score = 100.0
    layering_comment = "Estructura de capas minimalista."
    
    if top_item and outer_item:
        if outer_weight < top_weight:
            layering_score = 60.0
            layering_comment = "Incoherencia en Cohesión de Capas: la capa exterior es más ligera que la prenda interior."
        elif outer_weight == top_weight:
            layering_score = 85.0
            layering_comment = "Capa exterior e interior con el mismo peso visual."
        else:
            layering_score = 100.0
            layering_comment = "Cohesión de Capas y Texturas ideal: degradación armónica de pesos visuales."
            
    has_lino = any("lino" in normalize_str(it.get("name", "")) or "lino" in normalize_str(it.get("subcategory", "")) for it in items)
    has_invierno = any(any(k in normalize_str(it.get("name", "")) or k in normalize_str(it.get("subcategory", "")) for k in ["wool", "lana", "puffer", "plumon", "abrigo"]) for it in items)
    
    if has_lino and has_invierno:
        layering_score = max(30.0, layering_score - 30.0)
        layering_comment += " Conflicto Estacional de Texturas: se ha mezclado lino veraniego con abrigo de invierno."
        
    return layering_score, layering_comment

# Helper for 12-season color theory evaluation
def evaluate_12_season_color(items):
    # Parse colors of items
    colors = [it.get("color_primary") for it in items if it and it.get("color_primary")]
    if not colors:
        return "Winter Cool", 100.0, 0, "Bajo", "Armonía minimalista neutra."

    parsed_colors = [parse_color(c) for c in colors]
    # Hue, Saturation, Lightness, IsNeutral
    lightnesses = [c[2] for c in parsed_colors]
    contrast_val = max(lightnesses) - min(lightnesses) if lightnesses else 0
    
    if contrast_val >= 45:
        contrast_level = "Alto"
    elif contrast_val >= 25:
        contrast_level = "Medio"
    else:
        contrast_level = "Bajo"

    best_season = None
    best_score = -1.0
    
    for season_id, info in SEASONS_INFO.items():
        match_count = 0.0
        for c in colors:
            norm_c = normalize_str(c)
            matched = False
            for ideal in info["ideal_colors"]:
                norm_ideal = normalize_str(ideal)
                if norm_ideal in norm_c or norm_c in norm_ideal:
                    match_count += 1.0
                    matched = True
                    break
            if not matched:
                # Neutrals are accepted in any season with a partial score
                if any(k in norm_c for k in ["gris", "blanco", "negro", "crema", "ivory", "beige"]):
                    match_count += 0.5
        
        palette_ratio = match_count / len(colors)
        
        # Contrast penalty
        pref_contrast = info["contrast"]
        contrast_penalty = 0.0
        if pref_contrast == "alto":
            if contrast_val < 45:
                contrast_penalty = (45 - contrast_val)
        elif pref_contrast == "bajo":
            if contrast_val > 30:
                contrast_penalty = (contrast_val - 30)
        elif pref_contrast == "medio":
            if contrast_val < 20:
                contrast_penalty = (20 - contrast_val)
            elif contrast_val > 55:
                contrast_penalty = (contrast_val - 55)
                
        score = (palette_ratio * 70.0) + max(0.0, 30.0 - contrast_penalty * 0.5)
        if score > best_score:
            best_score = score
            best_season = season_id
            
    info = SEASONS_INFO[best_season]
    season_name = f"{info['name_es']} ({best_season})"
    commentary = f"Armonía {season_name}: el ensamble se adapta al perfil estacional con {info['description']} El contraste de color es {contrast_level.lower()} (ΔL={int(contrast_val)})."
    
    # Normalize best_score to a 0-100 scale for color score baseline
    color_base_score = max(30.0, min(100.0, best_score))
    return best_season, color_base_score, contrast_val, contrast_level, commentary

# Helper for CLO thermal isolation values
def get_item_clo(item):
    name = normalize_str(item.get("name", ""))
    subcat = normalize_str(item.get("subcategory", ""))
    category = normalize_str(item.get("category", ""))
    
    # Outerwear
    if category == "outerwear" or any(k in subcat for k in ["abrigo", "jacket", "outerwear"]):
        if any(k in name or k in subcat for k in ["puffer", "plumon", "lana", "wool", "parka"]):
            return 0.55
        if any(k in name or k in subcat for k in ["trench", "gabardina", "cuero", "leather"]):
            return 0.35
        return 0.25
        
    # Top
    if category == "top" or any(k in subcat for k in ["top", "camiseta", "camisa", "blusa", "sueter", "cardigan", "jersey"]):
        if any(k in name or k in subcat for k in ["sueter", "cardigan", "jersey", "cashmere", "lana", "wool", "buzo", "hoodie"]):
            return 0.30
        if any(k in name or k in subcat for k in ["camisa", "shirt", "blusa"]):
            return 0.20
        return 0.09 # T-shirt / tank top / etc.
        
    # Bottom
    if category == "bottom" or any(k in subcat for k in ["bottom", "jeans", "pantalon", "falda", "short"]):
        if any(k in name or k in subcat for k in ["short", "bermuda", "falda corta", "minifalda"]):
            return 0.12
        return 0.25 # Jeans, trousers
        
    # Footwear
    if category == "footwear" or any(k in subcat for k in ["footwear", "zapatos", "tenis", "botas", "mocasines"]):
        if "bota" in name or "bota" in subcat:
            return 0.10
        if any(k in name or k in subcat for k in ["sandalia", "slide", "chancla"]):
            return 0.02
        return 0.05 # sneakers, loafers, flats
        
    # Accessories
    if category == "accessory" or any(k in subcat for k in ["accessory", "bufanda", "gorra"]):
        if "bufanda" in name or "bufanda" in subcat:
            return 0.10
        return 0.01
        
    return 0.10 # default

def calculate_fashion_score(items, city_name="Bogotá", occasion="Casual", temp=None, rain=None, user_profile=None):
    items = [item for item in items if item is not None]
    n = len(items)
    if n == 0:
        return {
            "color_score": 100.0,
            "style_score": 100.0,
            "pattern_score": 100.0,
            "weather_score": 100.0,
            "total_score": 100.0,
            "advice": "¡Bonjour! No hay prendas seleccionadas para evaluar."
        }

    if temp is None or rain is None:
        city = next((c for c in CITIES if normalize_str(c["name"]) == normalize_str(city_name)), CITIES[0])
        temp = city["temp"] if temp is None else temp
        rain = city["rain"] if rain is None else rain

    # 1. 12-Season Color Theory and Contrast Matching
    best_season, color_base_score, contrast_val, contrast_level, color_season_commentary = evaluate_12_season_color(items)

    # French Rule of Three Colors
    unique_colors = set(normalize_str(item.get("color_primary")) for item in items if item.get("color_primary"))
    num_unique_colors = len(unique_colors)
    color_bonus = 0.0
    color_penalty = 0.0
    color_rule_comment = ""
    
    if num_unique_colors in [2, 3]:
        color_bonus = 15.0
        color_rule_comment = "Regla de los Tres Colores: paleta equilibrada de 2 o 3 colores que optimiza el impacto visual."
        color_score = min(100.0, color_base_score + color_bonus)
    elif num_unique_colors >= 4:
        is_analog_mono = is_analog_monochrome_check(items)
        if not is_analog_mono:
            color_penalty = 20.0
            color_rule_comment = "Límite Tríada de los Tres Colores superado: conflicto cromático de 4 o más tonos clashing."
            color_score = max(30.0, color_base_score - color_penalty)
        else:
            color_rule_comment = "Monocromía Chic: a pesar de tener 4 o más colores, el ensamble se mantiene bajo una paleta análoga o de acento."
            color_score = color_base_score
    else:
        # 1 color
        color_rule_comment = "Monocromía Chic: look sobrio de un solo color."
        color_score = color_base_score

    # 2. Occasion Formal Rules (Quiet Luxury, Business Casual, Sporty, Cocktail, Gala)
    occ_normalized = occasion
    if occ_normalized not in OCCASIONS_RULES:
        # Try finding standard matching
        matched_occ = None
        for k in OCCASIONS_RULES.keys():
            if normalize_str(k) == normalize_str(occ_normalized):
                matched_occ = k
                break
        occ_normalized = matched_occ if matched_occ else "Casual"

    rule = OCCASIONS_RULES[occ_normalized]
    formalities = [get_formality(item) for item in items]
    mean_formality = sum(formalities) / len(formalities) if formalities else 5.0
    
    if len(formalities) > 1:
        variance = sum((f - mean_formality) ** 2 for f in formalities) / len(formalities)
        std_deviation = variance ** 0.5
    else:
        std_deviation = 0.0
        
    score_coherence = 100.0 * (2.718281828459045 ** (-0.18 * (std_deviation ** 1.5)))
    
    # Adherence to targeted range
    min_f = rule["min_formality"]
    max_f = rule["max_formality"]
    if min_f <= mean_formality <= max_f:
        d_O = 0.0
    elif mean_formality < min_f:
        d_O = min_f - mean_formality
    else:
        d_O = mean_formality - max_f
        
    score_adherence = max(0.0, 100.0 - 25.0 * (d_O ** 2))
    style_score = 0.40 * score_coherence + 0.60 * score_adherence

    # Preferred and Avoid items adjustments
    pref_bonus = 0.0
    avoid_penalty = 0.0
    for item in items:
        name_sub = normalize_str(item.get("name", "")) + " " + normalize_str(item.get("subcategory", ""))
        # Preferred
        if any(p in name_sub for p in rule["preferred_types"]):
            pref_bonus += 5.0
        # Avoid
        if any(a in name_sub for a in rule["avoid_types"]):
            avoid_penalty += 10.0
            
    style_score = style_score + min(15.0, pref_bonus) - min(30.0, avoid_penalty)

    # Special rules for Quiet Luxury & Gala
    if rule.get("color_palettes"):
        # Check colors
        non_luxury_count = 0
        for item in items:
            color_p = item.get("color_primary")
            if color_p and color_p not in rule["color_palettes"]:
                non_luxury_count += 1
        style_score -= min(15.0, non_luxury_count * 5.0)

    if rule.get("pattern_pref"):
        non_preferred_pattern = 0
        for item in items:
            pat = normalize_str(item.get("pattern", "liso"))
            if pat not in rule["pattern_pref"]:
                non_preferred_pattern += 1
        style_score -= min(15.0, non_preferred_pattern * 5.0)

    style_score = max(0.0, min(100.0, style_score))

    # Rule of Thirds & Visual Proportions
    top_item = next((it for it in items if it.get("category") == "Top"), None)
    bottom_item = next((it for it in items if it.get("category") == "Bottom"), None)
    upper_item = top_item if top_item else next((it for it in items if it.get("category") == "Outerwear"), None)
    
    prop_bonus, ratio_type, prop_details = evaluate_visual_proportions(upper_item, bottom_item)
    style_score = max(0.0, min(100.0, style_score + prop_bonus))

    clashing_items = []
    if std_deviation > 2.0:
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                if abs(formalities[i] - formalities[j]) >= 4.0:
                    clashing_items.append({
                        "item_a": items[i]["name"],
                        "formality_a": formalities[i],
                        "item_b": items[j]["name"],
                        "formality_b": formalities[j]
                    })

    # 3. Pattern & Texture Score calculation
    pattern_indices = [get_pattern_index(item) for item in items]
    num_patterned = sum(1 for p in pattern_indices if p != 0)
    if len(items) < 2:
        pattern_base = 100.0
    else:
        total_p_score = 0.0
        pairs_count = 0
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                p_i = pattern_indices[i]
                p_j = pattern_indices[j]
                total_p_score += PATTERN_MATRIX[p_i][p_j]
                pairs_count += 1
        pattern_base = total_p_score / pairs_count
    if num_patterned <= 2:
        pattern_score = pattern_base
    else:
        pattern_score = max(10.0, pattern_base - 15.0 * (num_patterned - 2))
        
    layering_score, layering_comment = evaluate_textures_and_layering(items)
    
    has_lino = any("lino" in normalize_str(it.get("name", "")) or "lino" in normalize_str(it.get("subcategory", "")) for it in items)
    if any(it.get("category") == "Outerwear" for it in items) or has_lino:
        pattern_score = 0.60 * pattern_score + 0.40 * layering_score
    else:
        pattern_score = 0.90 * pattern_score + 0.10 * layering_score
    pattern_score = max(0.0, min(100.0, pattern_score))

    # 4. CLO Thermal Isolation Index & Heat Balance
    # Determine wind speed
    wind_speed = 2.5
    for city in CITIES:
        if normalize_str(city["name"]) == normalize_str(city_name):
            wind_speed = city.get("wind_speed", 2.5)
            break

    # Calculate effective temperature with wind chill index
    v_kmh = wind_speed * 3.6
    if temp <= 10.0 and v_kmh > 4.8:
        T_eff = 13.12 + 0.6215 * temp - 11.37 * (v_kmh ** 0.16) + 0.3965 * temp * (v_kmh ** 0.16)
    else:
        T_eff = temp - 0.25 * max(0.0, wind_speed - 2.0)

    # Calculate sum CLO values
    item_clos = [get_item_clo(it) for it in items]
    CLO_total = 0.15 + sum(item_clos)
    CLO_required = max(0.1, (30.0 - T_eff) / 12.0)
    
    heat_balance = CLO_total - CLO_required
    
    # Comfort scoring
    weather_score = max(0.0, 100.0 - 250.0 * (heat_balance ** 2))
    
    warnings = []
    # Layering requirements warnings
    layer_types = []
    for item in items:
        _, lay = get_thermal_index_and_layer(item)
        layer_types.append(lay)

    if T_eff < 8.0 and "L3" not in layer_types:
        weather_score = max(0.0, weather_score - 30.0)
        warnings.append({"type": "under_layered", "message": f"Falta abrigo grueso (L3) para temperatura efectiva de {T_eff:.1f}°C."})
    elif T_eff >= 26.0 and ("L2" in layer_types or "L3" in layer_types):
        weather_score = max(0.0, weather_score - 30.0)
        warnings.append({"type": "over_layered", "message": f"Exceso de capas (L2/L3) para temperatura efectiva de {T_eff:.1f}°C."})

    # Rain protection
    if rain == 1:
        l3_items = [it for it, lay in zip(items, layer_types) if lay == "L3"]
        if not l3_items or any(it.get("rain_friendly") != 1 for it in l3_items):
            weather_score = max(0.0, weather_score - 20.0)
            warnings.append({"type": "rain_outerwear", "message": "Falta abrigo impermeable para lluvia."})
        footwear_items = [it for it, lay in zip(items, layer_types) if lay == "Footwear"]
        if footwear_items and any(it.get("rain_friendly") != 1 for it in footwear_items):
            weather_score = max(0.0, weather_score - 25.0)
            warnings.append({"type": "rain_footwear", "message": "Calzado no apto para la lluvia detectado."})

    # UV accessory checks
    uv, humidity = get_city_weather_conditions(city_name, temp, rain)
    if uv >= 6:
        acc_items = [it for it, lay in zip(items, layer_types) if lay == "L4"]
        has_sun_acc = False
        for acc in acc_items:
            acc_name = normalize_str(acc.get("name", ""))
            if any(k in acc_name for k in ["gafas", "lentes", "sombrero", "gorra", "sunglasses", "hat"]):
                has_sun_acc = True
                break
        if not has_sun_acc:
            weather_score = max(0.0, weather_score - 10.0)
            warnings.append({"type": "uv_accessory", "message": "Faltan accesorios de protección solar (L4)."})
            if CLO_total < 0.35:
                weather_score = max(0.0, weather_score - 5.0)
                warnings.append({"type": "uv_skin_exposure", "message": "Piel muy expuesta con alto índice UV."})

    # Humidity breathability
    if temp >= 25.0 and humidity >= 70:
        l1_items = [it for it, lay in zip(items, layer_types) if lay == "L1"]
        non_breathable = False
        breathable = False
        for l1 in l1_items:
            l1_name = normalize_str(l1.get("name", ""))
            if any(k in l1_name for k in ["poliester", "nylon", "sintetico"]):
                non_breathable = True
            if any(k in l1_name for k in ["lino", "seda", "linen", "silk"]):
                breathable = True
        if non_breathable:
            weather_score = max(0.0, weather_score - 15.0)
            warnings.append({"type": "humidity_breathability_penalty", "message": "Tejido sintético poco transpirable en clima húmedo."})
        if breathable:
            weather_score = min(100.0, weather_score + 5.0)

    weather_score = max(0.0, min(100.0, weather_score))

    # --- User Profile Adjustments ---
    sustainability_penalty = 0.0
    history_bonus = 0.0
    
    if user_profile:
        # 1. Body shape / Silueta corporal
        body_shape = user_profile.get("body_shape")
        if body_shape:
            morph = evaluate_body_morphology(body_shape, items)
            style_score = style_score * 0.7 + morph["score"] * 0.3
            if morph.get("feedback"):
                editorial_comments = getattr(calculate_fashion_score, '_editorial_cache', [])
                editorial_comments.extend(morph["feedback"])
                calculate_fashion_score._editorial_cache = editorial_comments

        # 2. Skin tone / Fototipo de piel
        skin_tone = user_profile.get("skin_tone")
        if skin_tone:
            # Matriz cruzada fototipo con colores
            skin_match_score = 0
            for item in items:
                col = normalize_str(item.get("color_primary", ""))
                if skin_tone == "claro":
                    if any(k in col for k in ["azul", "verde", "rojo", "negro", "marino", "esmeralda"]): skin_match_score += 5
                    elif any(k in col for k in ["amarillo", "beige", "blanco", "crema"]): skin_match_score -= 5
                elif skin_tone == "medio":
                    if any(k in col for k in ["beige", "mostaza", "verde oliva", "marron", "blanco"]): skin_match_score += 5
                elif skin_tone == "oscuro":
                    if any(k in col for k in ["blanco", "amarillo", "rojo", "rosa", "verde", "mostaza"]): skin_match_score += 5
                    elif any(k in col for k in ["negro", "marron", "marino"]): skin_match_score -= 5
            color_score = max(0.0, min(100.0, color_score + skin_match_score))

        # 3. Sostenibilidad: Penalización por no rotar prendas en N días
        today = __import__("datetime").date.today()
        for item in items:
            last_worn = item.get("last_worn")
            if last_worn:
                try:
                    if isinstance(last_worn, str):
                        last_worn_date = __import__("datetime").datetime.strptime(last_worn, "%Y-%m-%d").date()
                    else:
                        last_worn_date = last_worn
                    days_since = (today - last_worn_date).days
                    if days_since < 7:  # Si se usó hace menos de 7 días, penalizar
                        sustainability_penalty += (7 - days_since) * 2.0
                except Exception:
                    pass

        # 4. Historial de calificaciones del usuario
        rating_history = user_profile.get("rating_history", {})
        for item in items:
            item_id = str(item.get("id", ""))
            if item_id in rating_history:
                rating = rating_history[item_id]
                if rating >= 4:
                    history_bonus += 2.0
                elif rating <= 2:
                    history_bonus -= 3.0

    # Calculate final weights
    total_score = 0.35 * color_score + 0.30 * style_score + 0.15 * pattern_score + 0.20 * weather_score
    total_score = max(0.0, min(100.0, total_score - sustainability_penalty + history_bonus))
    scores_dict = {"Color": color_score, "Estilo": style_score, "Patrón": pattern_score, "Clima": weather_score}
    highest_sub = max(scores_dict, key=scores_dict.get)
    highest_val = scores_dict[highest_sub]

    # --- Critique List for advice ---
    critique_list = []
    if color_score < 80.0:
        critique_list.append(f"la armonía de color necesita ajuste")
    if style_score < 80.0:
        if std_deviation > 2.0:
            critique_list.append("hay un choque de formalidades en las prendas elegidas")
        else:
            critique_list.append("el nivel de formalidad no se alinea con la ocasión seleccionada")
    if pattern_score < 80.0:
        critique_list.append("la mezcla de patrones o texturas resulta incoherente")
    if weather_score < 80.0:
        if heat_balance < -0.15:
            critique_list.append("el aislamiento térmico es insuficiente para el viento y temperatura")
        elif heat_balance > 0.15:
            critique_list.append("el ensamble provoca un exceso de calor corporal")
        else:
            critique_list.append("las prendas no se adaptan perfectamente a las condiciones climáticas actuales")

    # --- Advanced Editorial Commentary in Spanish ---
    editorial_comments = getattr(calculate_fashion_score, '_editorial_cache', [])
    calculate_fashion_score._editorial_cache = []  # reset
    
    # 12-Season commentary
    editorial_comments.append(color_season_commentary)
    
    # French rule of three colors commentary
    editorial_comments.append(f"{color_rule_comment}")

    # Proportions commentary
    if "Tercios" in ratio_type:
        editorial_comments.append(f"Estructura la figura bajo la {ratio_type}, creando una silueta sumamente estilizada.")
    else:
        editorial_comments.append(f"Mantiene una {ratio_type} clásica.")

    # Layering/CLO commentary
    if abs(heat_balance) <= 0.15:
        editorial_comments.append(f"Consigue un Balance Térmico óptimo (Índice CLO total de {CLO_total:.2f} vs {CLO_required:.2f} requerido).")
    else:
        editorial_comments.append(f"Presenta desbalance en el Índice de Aislamiento Térmico CLO (CLO total: {CLO_total:.2f}, requerido: {CLO_required:.2f}).")

    if wind_speed >= 5.0:
        editorial_comments.append(f"Se considera el Efecto de Enfriamiento por Viento ({wind_speed} m/s) que reduce la temperatura efectiva a {T_eff:.1f}°C.")

    # Shape fit comment
    if "entallado + amplio" in prop_details:
        editorial_comments.append("El balance de volúmenes entallado + amplio aporta una dimensión moderna y sofisticada.")
    elif "sastrería estructurada" in prop_details:
        editorial_comments.append("La uniformidad sastrera estructurada entrega una presencia impecable.")

    greeting = "Bonjour, chérie!"
    if total_score >= 90.0:
        greeting = "¡Bonjour! Mon dieu, este ensamble es una obra de arte absoluta."
        critique = "La propuesta arquitectónica es impecable."
        suggestion = "No le cambies absolutamente nada, es sencillamente sublime."
    elif total_score >= 75.0:
        greeting = "¡Bonjour! Un look bastante interesante y chic."
        critique = "Aunque tiene un gran porte, " + (" y ".join(critique_list) if critique_list else "puntos mínimos podrían pulirse") + "."
        suggestion = "Te sugiero ajustar un poco las proporciones o los accesorios para llegar a la perfección."
    else:
        greeting = "Bonjour... Tenemos trabajo por hacer, darling."
        critique = "El ensamble tiene discordancias importantes: " + (" y ".join(critique_list) if critique_list else "falta cohesión en las capas o estilos") + "."
        lowest_sub = min(scores_dict, key=scores_dict.get)
        if lowest_sub == "Color":
            suggestion = "Te recomiendo cambiar uno de los colores por un tono neutro o un complementario directo."
        elif lowest_sub == "Estilo":
            suggestion = "Sugiero cambiar el calzado deportivo por unos mocasines o botas para unificar la formalidad."
        elif lowest_sub == "Clima":
            suggestion = "Agrega una chaqueta o abrigo adecuado para regular tu confort térmico."
        else:
            suggestion = "Prueba con prendas lisas para mitigar el conflicto de estampados o incoherencia de texturas."

    editorial_str = " ".join(editorial_comments)
    advice = f"{greeting} {editorial_str} Califica un {total_score:.1f}% en la escala DressYourself (Ocasión: {rule['name_es']}). Tu punto más fuerte es {highest_sub.lower()} ({highest_val:.1f}%). {critique} {suggestion}"
    
    return {
        "color_score": round(color_score, 1),
        "style_score": round(style_score, 1),
        "pattern_score": round(pattern_score, 1),
        "weather_score": round(weather_score, 1),
        "total_score": round(total_score, 1),
        "color_type": best_season,
        "mean_formality": round(mean_formality, 2),
        "std_deviation": round(std_deviation, 2),
        "clashing_items": clashing_items,
        "warnings": warnings,
        "advice": advice,
        "clo_value": round(CLO_total, 2),
        "effective_temp": round(T_eff, 1),
        "heat_balance": round(heat_balance, 2),
        "color_season": best_season,
        "color_contrast": contrast_level
    }

def recommend_outfit(clothes, city_index, occasion, body_shape="hourglass"):
    """
    Coordinates a complete outfit: Top, Bottom, Footwear.
    Adds Outerwear if effective temperature (wind chill) <= 16°C or if it is raining.
    Adds Accessory if available.
    Filters by:
      - Occasion styling preferences (formality limits & preferred types)
      - Thermal isolation (CLO index vs weather requirements)
      - Rain friendliness (if city_rain == 1, prioritize rain_friendly items)
      - Body morphology alignment
    """
    city = next((c for c in CITIES if c["index"] == int(city_index)), CITIES[0])
    temp = city["temp"]
    rain = city["rain"]
    wind_speed = city.get("wind_speed", 2.5)

    # Compute effective temperature
    v_kmh = wind_speed * 3.6
    if temp <= 10.0 and v_kmh > 4.8:
        T_eff = 13.12 + 0.6215 * temp - 11.37 * (v_kmh ** 0.16) + 0.3965 * temp * (v_kmh ** 0.16)
    else:
        T_eff = temp - 0.25 * max(0.0, wind_speed - 2.0)

    # Target formality from occasion rules
    occ_normalized = occasion
    if occ_normalized not in OCCASIONS_RULES:
        # Try matching normalized keys
        matched_occ = None
        for k in OCCASIONS_RULES.keys():
            if normalize_str(k) == normalize_str(occ_normalized):
                matched_occ = k
                break
        occ_normalized = matched_occ if matched_occ else "Casual"
    
    rule = OCCASIONS_RULES[occ_normalized]
    min_f = rule["min_formality"]
    max_f = rule["max_formality"]

    # 1. Filter clothes by owned vs boutique
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    
    owned_tops = [c for c in owned_clothes if c.get("category") == "Top"]
    owned_bottoms = [c for c in owned_clothes if c.get("category") == "Bottom"]
    owned_footwear = [c for c in owned_clothes if c.get("category") == "Footwear"]
    
    use_boutique_fallback = False
    if not (owned_tops and owned_bottoms and owned_footwear):
        use_boutique_fallback = True
        recommended_set = [c for c in clothes if c.get("is_owned") == 0]
        if not recommended_set:
            recommended_set = clothes
    else:
        recommended_set = owned_clothes

    # Helper to score candidate items for the outfit
    def score_item(item):
        score = 100.0
        subcat = item.get("subcategory") or ""
        name = item.get("name") or ""
        name_sub = normalize_str(name) + " " + normalize_str(subcat)

        # Formality matching
        f_val = get_formality(item)
        if min_f <= f_val <= max_f:
            score += 40.0
        else:
            deviation = min(abs(f_val - min_f), abs(f_val - max_f))
            score -= 25.0 * (deviation ** 2)

        # Occasion rules
        if any(p in name_sub for p in rule["preferred_types"]):
            score += 30.0
        if any(a in name_sub for a in rule["avoid_types"]):
            score -= 40.0

        # Quiet Luxury specific checks
        if rule.get("color_palettes"):
            color_p = item.get("color_primary")
            if color_p and color_p in rule["color_palettes"]:
                score += 20.0
            else:
                score -= 20.0

        if rule.get("pattern_pref"):
            pat = normalize_str(item.get("pattern", "liso"))
            if pat in rule["pattern_pref"]:
                score += 15.0
            else:
                score -= 25.0

        # Rain support
        if rain == 1:
            if item.get("rain_friendly") == 1:
                score += 50.0
            else:
                score -= 35.0

        # Thermal comfort (CLO) heuristic
        item_clo = get_item_clo(item)
        # If weather is cold, prefer higher insulation. If hot, prefer lower.
        if T_eff < 12.0:
            if item_clo >= 0.25:
                score += 25.0
            elif item_clo <= 0.05:
                score -= 20.0
        elif T_eff > 24.0:
            if item_clo <= 0.12:
                score += 25.0
            elif item_clo >= 0.35:
                score -= 30.0

        return score

    def select_best(items):
        if not items:
            return None
        scored = [(score_item(it), it) for it in items]
        scored.sort(key=lambda x: x[0], reverse=True)
        # Select randomly from top 2 candidates for diversity
        candidates = [x[1] for x in scored[:2]]
        return random.choice(candidates)

    tops = [c for c in recommended_set if c.get("category") == "Top"]
    bottoms = [c for c in recommended_set if c.get("category") == "Bottom"]
    footwear = [c for c in recommended_set if c.get("category") == "Footwear"]
    outerwear = [c for c in recommended_set if c.get("category") == "Outerwear"]
    accessories = [c for c in recommended_set if c.get("category") == "Accessory"]

    # In case categories are empty, fallback to all clothes
    if not tops: tops = [c for c in clothes if c.get("category") == "Top"]
    if not bottoms: bottoms = [c for c in clothes if c.get("category") == "Bottom"]
    if not footwear: footwear = [c for c in clothes if c.get("category") == "Footwear"]
    if not outerwear: outerwear = [c for c in clothes if c.get("category") == "Outerwear"]
    if not accessories: accessories = [c for c in clothes if c.get("category") == "Accessory"]

    # Clever defaults if database is completely empty
    DUMMY_DEFAULTS = {
        "Top": {"id": -1, "name": "Camiseta Básica de Boutique", "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600", "category": "Top", "subcategory": "Camiseta", "color_primary": "Blanco Puro", "pattern": "Liso", "price": 29.99, "store_name": "Boutique", "is_owned": 0},
        "Bottom": {"id": -2, "name": "Jeans Clásicos de Boutique", "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600", "category": "Bottom", "subcategory": "Jeans", "color_primary": "Azul Índigo", "pattern": "Liso", "price": 49.99, "store_name": "Boutique", "is_owned": 0},
        "Footwear": {"id": -3, "name": "Tenis Urbanos de Boutique", "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600", "category": "Footwear", "subcategory": "Tenis", "color_primary": "Blanco Puro", "pattern": "Liso", "price": 79.99, "store_name": "Boutique", "is_owned": 0},
        "Outerwear": {"id": -4, "name": "Chaqueta Ligera de Boutique", "image_url": "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=600", "category": "Outerwear", "subcategory": "Chaqueta", "color_primary": "Azul Índigo", "pattern": "Liso", "price": 89.99, "store_name": "Boutique", "is_owned": 0},
        "Accessory": {"id": -5, "name": "Gafas de Sol de Boutique", "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600", "category": "Accessory", "subcategory": "Gafas de Sol", "color_primary": "Negro Carbón", "pattern": "Liso", "price": 19.99, "store_name": "Boutique", "is_owned": 0}
    }

    selected_top = select_best(tops) or DUMMY_DEFAULTS["Top"]
    selected_bottom = select_best(bottoms) or DUMMY_DEFAULTS["Bottom"]
    selected_footwear = select_best(footwear) or DUMMY_DEFAULTS["Footwear"]
    
    selected_outerwear = None
    if T_eff <= 16.0 or rain == 1:
        selected_outerwear = select_best(outerwear)
        if not selected_outerwear and not outerwear:
            selected_outerwear = DUMMY_DEFAULTS["Outerwear"]
            
    selected_accessory = None
    if accessories and random.random() > 0.3:
        selected_accessory = select_best(accessories)

    justification = ""
    city_str = f"en {city['name']} (a {int(temp)}°C{' y con lluvia' if rain else ''})"
    
    if selected_outerwear:
        justification = (
            f"Para el clima frío {city_str}, hemos estructurado una propuesta elegante en capas. "
            f"Combinamos {selected_top['name']} con {selected_bottom['name']}, coronado con el abrigo "
            f"esencial {selected_outerwear['name']}. En los pies, {selected_footwear['name']} ofrece "
            f"comodidad y protección, "
        )
    else:
        justification = (
            f"Diseñado para la temperatura templada {city_str}, este outfit equilibra frescura y porte. "
            f"La combinación de {selected_top['name']} y {selected_bottom['name']} crea una silueta limpia "
            f"y moderna, perfectamente complementada por {selected_footwear['name']}. "
        )
        
    if selected_accessory:
        justification += f" e integramos {selected_accessory['name']} como el toque de sofisticación final."
    else:
        justification += " logrando una estética minimalista y depurada."

    if use_boutique_fallback:
        justification = (
            "¡Tu closet digital no tiene suficientes prendas! Escanea tu ropa para personalizar "
            "los outfits. Mientras tanto, te recomendamos esta combinación de nuestra boutique curada: "
        ) + justification

    # Calculate fashion score for the outfit
    rec_items = [it for it in [selected_top, selected_bottom, selected_footwear, selected_outerwear, selected_accessory] if it]
    score_details = calculate_fashion_score(rec_items, city["name"], occasion, temp, rain)
    morphology_details = evaluate_body_morphology(body_shape, rec_items)
    
    advice = score_details["advice"]
    if use_boutique_fallback:
        advice = (
            "¡Tu armario digital está vacío o incompleto! Te animamos a usar el botón 'Escanear Prenda' "
            "con tu cámara para ir registrando tu closet. Para inspirarte, te sugerimos adquirir estas "
            "prendas recomendadas directamente desde la boutique: "
        ) + advice

    return {
        "city": city["name"],
        "temp": temp,
        "rain": rain == 1,
        "occasion": occasion,
        "top": selected_top,
        "bottom": selected_bottom,
        "footwear": selected_footwear,
        "outerwear": selected_outerwear,
        "accessory": selected_accessory,
        "outfit": rec_items,
        "morphology": morphology_details,
        "justification": justification,
        
        "color_score": score_details["color_score"],
        "style_score": score_details["style_score"],
        "pattern_score": score_details["pattern_score"],
        "weather_score": score_details["weather_score"],
        "total_score": score_details["total_score"],
        "advice": advice
    }

def get_style_innovations(clothes):
    """
    Finds creative and stylish combinations in user's owned wardrobe using 4 distinct harmonies:
    - Armonía Monocromática
    - Contraste Complementario
    - Armonía Análoga
    - Style Clash (Subversión de estilos)
    """
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    if len(owned_clothes) < 3:
        # Fallback to all if wardrobe is too small
        owned_clothes = clothes
        
    tops = [c for c in owned_clothes if c["category"] == "Top"]
    bottoms = [c for c in owned_clothes if c["category"] == "Bottom"]
    footwear = [c for c in owned_clothes if c["category"] == "Footwear"]
    outerwear = [c for c in owned_clothes if c["category"] == "Outerwear"]
    accessories = [c for c in owned_clothes if c["category"] == "Accessory"]
    
    if not (tops and bottoms and footwear):
        return [] # Cannot make outfits
        
    innovations = []
    
    # 1. MONOCHROMATIC HARMONY
    mono_combinations = []
    for t in tops:
        t_fam = get_color_family(t.get("color_primary"))
        for b in bottoms:
            b_fam = get_color_family(b.get("color_primary"))
            if t_fam == b_fam:
                for f in footwear:
                    f_fam = get_color_family(f.get("color_primary"))
                    # At least top and bottom, or top and shoes must share family
                    if f_fam == t_fam or f.get("color_primary") in ["Blanco Puro", "Negro Carbón"]:
                        mono_combinations.append((t, b, f))
                        
    if mono_combinations:
        # Pick one
        t, b, f = random.choice(mono_combinations)
        out = random.choice(outerwear) if outerwear else None
        acc = random.choice(accessories) if accessories else None
        
        family_name = get_color_family(t.get("color_primary"))
        family_es = {
            "BLUE": "tonalidades azules",
            "GREEN": "gamas de verde orgánico",
            "RED_PINK": "matices cálidos rojizos",
            "YELLOW_BROWN": "colores tierra y arena",
            "NEUTRAL": "bloques neutros minimalistas"
        }.get(family_name, "colores uniformes")
        
        justification = (
            f"Una declaración de sofisticación minimalista. La transición fluida basada en {family_es} "
            f"entre {t['name']} y {b['name']} evoca una elegancia arquitectónica sin esfuerzo. "
            f"El calzado {f['name']} mantiene la pureza del bloque visual, logrando un look limpio de alto impacto."
        )
        
        innovations.append({
            "name": f"Quiet Luxury: Monocromía en {t.get('color_primary')}",
            "type": "Quiet Luxury",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })

    # 2. COMPLEMENTARY CONTRAST
    comp_combinations = []
    for t in tops:
        t_fam = get_color_family(t.get("color_primary"))
        for b in bottoms:
            b_fam = get_color_family(b.get("color_primary"))
            if (t_fam, b_fam) in COMPLEMENTARY_PAIRS:
                for f in footwear:
                    comp_combinations.append((t, b, f))
                    
    if comp_combinations:
        t, b, f = random.choice(comp_combinations)
        out = random.choice(outerwear) if outerwear else None
        acc = random.choice(accessories) if accessories else None
        
        justification = (
            f"Inspirado en el New Look de Dior. Al yuxtaponer la calidez o neutralidad de {t['name']} ({t.get('color_primary')}) "
            f"con la profundidad contrastante de {b['name']} ({b.get('color_primary')}), se genera una tensión cromática vibrante "
            f"que rinde tributo a la moda interior clásica. Un outfit estructurado para proyectar audacia y clase."
        )
        
        innovations.append({
            "name": "Dior Vintage Contrast",
            "type": "Dior Vintage",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })

    # 3. ANALOGOUS HARMONY
    analog_combinations = []
    for t in tops:
        t_fam = get_color_family(t.get("color_primary"))
        for b in bottoms:
            b_fam = get_color_family(b.get("color_primary"))
            if b_fam in ANALOGOUS_RELATIONS.get(t_fam, []):
                for f in footwear:
                    analog_combinations.append((t, b, f))
                    
    if analog_combinations:
        t, b, f = random.choice(analog_combinations)
        out = random.choice(outerwear) if outerwear else None
        acc = random.choice(accessories) if accessories else None
        
        justification = (
            f"Armonía cromática minimalista. La transición suave entre {t['name']} ({t.get('color_primary')}) "
            f"y {b['name']} ({b.get('color_primary')}) fluye de manera natural al ser colores contiguos en el círculo cromático. "
            f"Este ensamble genera una vibra sumamente acogedora y pulida, ideal para quienes buscan elegancia sin estridencias."
        )
        
        innovations.append({
            "name": "Minimalismo de Transición",
            "type": "Minimalista",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })

    # 4. STYLE CLASH (Subversión / Cruce de Estilos)
    # Look for Sporty shoe + Formal bottom/outerwear OR Casual top + Formal Bottom/Outerwear
    sporty_shoes = [f for f in footwear if "tenis" in f.get("name", "").lower() or "deport" in f.get("name", "").lower() or f.get("subcategory") == "Tenis"]
    formal_bottoms = [b for b in bottoms if "vestir" in b.get("name", "").lower() or "sastre" in b.get("name", "").lower() or b.get("subcategory") == "Pantalón de Vestir"]
    formal_outer = [o for o in outerwear if "trench" in o.get("name", "").lower() or "abrigo" in o.get("name", "").lower() or o.get("subcategory") == "Abrigo"]
    
    if sporty_shoes and (formal_bottoms or formal_outer):
        f = random.choice(sporty_shoes)
        b = random.choice(formal_bottoms) if formal_bottoms else random.choice(bottoms)
        t = random.choice(tops)
        out = random.choice(formal_outer) if formal_outer else (random.choice(outerwear) if outerwear else None)
        acc = random.choice(accessories) if accessories else None
        
        clash_detail = f"la formalidad de {b['name']}" if formal_bottoms else f"la sobriedad de {out['name']}"
        
        justification = (
            f"El balance perfecto de la modernidad casual. Al fusionar la comodidad urbana de "
            f"{f['name']} con {clash_detail}, se dinamiza la silueta sastre clásica. "
            f"Un manifiesto casual y elegante para el día a día sin perder sofisticación."
        )
        
        innovations.append({
            "name": "Casual Elegante Moderno",
            "type": "Casual Elegante",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })
        
    # If any category is empty or we couldn't produce enough innovations, generate at least 2 default beautiful ensembles
    while len(innovations) < 2:
        t = random.choice(tops)
        b = random.choice(bottoms)
        f = random.choice(footwear)
        out = random.choice(outerwear) if outerwear else None
        acc = random.choice(accessories) if accessories else None
        
        justification = (
            f"Una propuesta ecléctica de sastrería clásica contemporánea. Uniendo {t['name']} y {b['name']} con el calzado "
            f"{f['name']}. Una combinación atemporal, curada meticulosamente por nuestro motor de estilismo."
        )
        
        innovations.append({
            "name": "Sartorial Clásico Atelier",
            "type": "Sartorial Clásico",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })

    return innovations

def generate_capsule_closet(clothes):
    """
    Algorithm that returns the best combinations of 10 essential items to maximize outfits count.
    It selects exactly 10 items from the wardrobe to form a capsule wardrobe, 
    then returns all valid combinations (outfits) made from them, sorted by their style/fashion score.
    """
    # Filter owned clothes first, fallback to all if owned is empty or too small
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    if len(owned_clothes) < 5:
        owned_clothes = clothes

    if not owned_clothes:
        return {"capsule_items": [], "outfits": [], "total_combinations": 0}

    # Group clothes by category
    categories = ["Top", "Bottom", "Footwear", "Outerwear", "Accessory"]
    by_cat = {cat: [c for c in owned_clothes if c.get("category") == cat] for cat in categories}

    # Determine allocation of 10 items to maximize outfits count
    # Keep total to min(10, total_available)
    total_available = len(owned_clothes)
    capsule_limit = min(10, total_available)

    # Let's adjust allocation dynamically
    current_alloc = {cat: 0 for cat in categories}
    
    # First, allocate at least 1 to Top, Bottom, Footwear if available
    for cat in ["Top", "Bottom", "Footwear"]:
        if by_cat[cat]:
            current_alloc[cat] = 1
            
    # Distribute the remaining slots to maximize product T * B * F * (O + 1) * (A + 1)
    preference_order = ["Top", "Bottom", "Footwear", "Outerwear", "Accessory"]
    while sum(current_alloc.values()) < capsule_limit:
        added = False
        for cat in preference_order:
            if len(by_cat[cat]) > current_alloc[cat]:
                # We can allocate one more to this category
                # To maximize combinations count, we prefer having balanced Tops and Bottoms
                if cat == "Top" and current_alloc["Top"] < 4:
                    current_alloc["Top"] += 1
                    added = True
                    break
                elif cat == "Bottom" and current_alloc["Bottom"] < 3:
                    current_alloc["Bottom"] += 1
                    added = True
                    break
                elif cat == "Footwear" and current_alloc["Footwear"] < 2:
                    current_alloc["Footwear"] += 1
                    added = True
                    break
                elif cat == "Outerwear" and current_alloc["Outerwear"] < 1:
                    current_alloc["Outerwear"] += 1
                    added = True
                    break
                elif cat == "Accessory" and current_alloc["Accessory"] < 1:
                    current_alloc["Accessory"] += 1
                    added = True
                    break
        if not added:
            # Just add to whatever has remaining items
            for cat in preference_order:
                if len(by_cat[cat]) > current_alloc[cat]:
                    current_alloc[cat] += 1
                    added = True
                    break
            if not added:
                break # No more items available

    # Now, choose the "best" items for each category according to versatility
    def get_versatility(item):
        cat = item.get("category")
        other_cats = [c for c in ["Top", "Bottom", "Footwear"] if c != cat]
        scores = []
        for o_cat in other_cats:
            candidates = by_cat[o_cat][:3]
            for cand in candidates:
                test_outfit = [item, cand]
                try:
                    res = calculate_fashion_score(test_outfit)
                    scores.append(res["total_score"])
                except Exception:
                    pass
        return sum(scores) / len(scores) if scores else 50.0

    scored_items_by_cat = {}
    for cat in categories:
        scored = []
        for item in by_cat[cat]:
            v_score = get_versatility(item)
            scored.append((v_score, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        scored_items_by_cat[cat] = [x[1] for x in scored]

    # Select the allocated number of items from each category
    capsule_items = []
    for cat in categories:
        count = current_alloc[cat]
        capsule_items.extend(scored_items_by_cat[cat][:count])

    # Generate all valid combinations of basic outfits (Top + Bottom + Footwear) from capsule_items
    capsule_tops = [c for c in capsule_items if c.get("category") == "Top"]
    capsule_bottoms = [c for c in capsule_items if c.get("category") == "Bottom"]
    capsule_footwear = [c for c in capsule_items if c.get("category") == "Footwear"]
    capsule_outerwear = [c for c in capsule_items if c.get("category") == "Outerwear"]
    capsule_accessories = [c for c in capsule_items if c.get("category") == "Accessory"]

    valid_outfits = []
    for t in capsule_tops:
        for b in capsule_bottoms:
            for f in capsule_footwear:
                outfit = [t, b, f]
                valid_outfits.append(outfit)
                
                for o in capsule_outerwear:
                    valid_outfits.append(outfit + [o])
                    
                for a in capsule_accessories:
                    valid_outfits.append(outfit + [a])
                    
                for o in capsule_outerwear:
                    for a in capsule_accessories:
                        valid_outfits.append(outfit + [o, a])

    # Score each combination
    scored_outfits = []
    for idx, out in enumerate(valid_outfits):
        score_res = calculate_fashion_score(out)
        scored_outfits.append({
            "id": f"capsule-{idx}",
            "top": next((x for x in out if x.get("category") == "Top"), None),
            "bottom": next((x for x in out if x.get("category") == "Bottom"), None),
            "footwear": next((x for x in out if x.get("category") == "Footwear"), None),
            "outerwear": next((x for x in out if x.get("category") == "Outerwear"), None),
            "accessory": next((x for x in out if x.get("category") == "Accessory"), None),
            "total_score": score_res["total_score"],
            "color_score": score_res["color_score"],
            "style_score": score_res["style_score"],
            "pattern_score": score_res["pattern_score"],
            "weather_score": score_res["weather_score"],
            "advice": score_res["advice"]
        })

    # Sort outfits by score descending
    scored_outfits.sort(key=lambda x: x["total_score"], reverse=True)

    return {
        "capsule_items": capsule_items,
        "outfits": scored_outfits,
        "total_combinations": len(scored_outfits)
    }

def get_capsule_wardrobe_recommendation(clothes):
    return generate_capsule_closet(clothes)


# ==========================================
# INTERACTIVE STYLING RPG ENGINE
# ==========================================

# 3-step decision tree data structure: Ocasión -> Colorimetría -> Silueta
RPG_NODES = {
    "occasion_step": {
        "node_id": "occasion_step",
        "step": "Ocasión",
        "question": "¿Para qué ocasión estás preparando tu atuendo el día de hoy?",
        "options": [
            {
                "id": "opt_quiet_luxury",
                "text": "Lujo Silencioso (Elegante, minimalista y sofisticado)",
                "next_node_id": "color_step",
                "weight_adjustments": {
                    "occasion": "Quiet Luxury"
                }
            },
            {
                "id": "opt_casual",
                "text": "Casual (Relajado, cómodo y cotidiano)",
                "next_node_id": "color_step",
                "weight_adjustments": {
                    "occasion": "Casual"
                }
            },
            {
                "id": "opt_business_casual",
                "text": "Business Casual (Profesional pero moderno)",
                "next_node_id": "color_step",
                "weight_adjustments": {
                    "occasion": "Business Casual"
                }
            },
            {
                "id": "opt_sporty",
                "text": "Deportivo Chic (Activo, dinámico y urbano)",
                "next_node_id": "color_step",
                "weight_adjustments": {
                    "occasion": "Sporty"
                }
            },
            {
                "id": "opt_cocktail",
                "text": "Coctel / Fiesta (Glamoroso, nocturno y festivo)",
                "next_node_id": "color_step",
                "weight_adjustments": {
                    "occasion": "Cocktail"
                }
            }
        ]
    },
    "color_step": {
        "node_id": "color_step",
        "step": "Colorimetría",
        "question": "¿Cuál es tu paleta de color estacional predominante?",
        "options": [
            {
                "id": "opt_spring",
                "text": "Primavera (Tonos cálidos, vivos y luminosos)",
                "next_node_id": "silhouette_step",
                "weight_adjustments": {
                    "season": "Spring Warm"
                }
            },
            {
                "id": "opt_summer",
                "text": "Verano (Tonos fríos, suaves y empolvados)",
                "next_node_id": "silhouette_step",
                "weight_adjustments": {
                    "season": "Summer Cool"
                }
            },
            {
                "id": "opt_autumn",
                "text": "Otoño (Tonos cálidos, profundos y terrosos)",
                "next_node_id": "silhouette_step",
                "weight_adjustments": {
                    "season": "Autumn Warm"
                }
            },
            {
                "id": "opt_winter",
                "text": "Invierno (Tonos fríos, brillantes y contrastantes)",
                "next_node_id": "silhouette_step",
                "weight_adjustments": {
                    "season": "Winter Cool"
                }
            }
        ]
    },
    "silhouette_step": {
        "node_id": "silhouette_step",
        "step": "Silueta",
        "question": "¿Qué silueta corporal describe mejor tu estructura física?",
        "options": [
            {
                "id": "opt_hourglass",
                "text": "Reloj de Arena (Hombros y caderas alineados con cintura definida)",
                "next_node_id": "complete",
                "weight_adjustments": {
                    "silhouette": "Hourglass"
                }
            },
            {
                "id": "opt_triangle",
                "text": "Triángulo (Hombros más angostos que las caderas)",
                "next_node_id": "complete",
                "weight_adjustments": {
                    "silhouette": "Triangle"
                }
            },
            {
                "id": "opt_inverted_triangle",
                "text": "Triángulo Invertido (Hombros más anchos que las caderas)",
                "next_node_id": "complete",
                "weight_adjustments": {
                    "silhouette": "Inverted Triangle"
                }
            },
            {
                "id": "opt_rectangle",
                "text": "Rectángulo (Hombros, cintura y caderas de ancho similar)",
                "next_node_id": "complete",
                "weight_adjustments": {
                    "silhouette": "Rectangle"
                }
            },
            {
                "id": "opt_oval",
                "text": "Óvalo / Manzana (Silueta redondeada con volumen en la zona media)",
                "next_node_id": "complete",
                "weight_adjustments": {
                    "silhouette": "Oval"
                }
            }
        ]
    }
}

def get_rpg_node(node_id=None):
    """
    Returns the node schema for the decision tree. If node_id is None, returns the root node.
    """
    if not node_id:
        node_id = "occasion_step"
    return RPG_NODES.get(node_id)

def calculate_garment_match_score(garment, occasion_rule, season_info):
    """
    Calculates a compatibility score for a garment given the occasion rules and season colors.
    """
    score = 100.0
    
    # 1. Formality Check
    formality = get_formality(garment)
    min_f = occasion_rule.get("min_formality", 3.0)
    max_f = occasion_rule.get("max_formality", 7.0)
    if formality < min_f:
        score -= (min_f - formality) * 15.0
    elif formality > max_f:
        score -= (formality - max_f) * 15.0
        
    # 2. Category / Subcategory preference
    name_sub = normalize_str(garment.get("name", "")) + " " + normalize_str(garment.get("subcategory", ""))
    preferred_types = occasion_rule.get("preferred_types", [])
    avoid_types = occasion_rule.get("avoid_types", [])
    
    if any(p in name_sub for p in preferred_types):
        score += 20.0
    if any(a in name_sub for a in avoid_types):
        score -= 40.0
        
    # 3. Color Season Match
    color_primary = garment.get("color_primary")
    ideal_colors = season_info.get("ideal_colors", [])
    if color_primary:
        norm_color = normalize_str(color_primary)
        color_matched = False
        for ideal in ideal_colors:
            norm_ideal = normalize_str(ideal)
            if norm_ideal in norm_color or norm_color in norm_ideal:
                color_matched = True
                break
        if color_matched:
            score += 15.0
        else:
            if any(k in norm_color for k in ["gris", "blanco", "negro", "crema", "ivory", "beige"]):
                score += 5.0
            else:
                score -= 15.0
                
    # 4. Pattern preference
    pattern_pref = occasion_rule.get("pattern_pref")
    if pattern_pref:
        pat = normalize_str(garment.get("pattern", "liso"))
        if pat in pattern_pref:
            score += 10.0
        else:
            score -= 10.0
            
    return score

def generate_fashion_title(occasion, season, silhouette):
    """
    Generates a personalized styling title based on occasion, color season and silhouette.
    """
    occasion_map = {
        "Quiet Luxury": "del Quiet Luxury",
        "Business Casual": "del Office Chic",
        "Sporty": "del Athleisure Urbano",
        "Cocktail": "de la Noche Festiva",
        "Gala": "de la Moda Interior",
        "Casual": "del Estilo Casual",
        "Formal": "de la Elegancia Formal",
        "Deportivo": "del Confort Activo",
        "Fiesta": "de la Noche Dorada"
    }
    
    nouns = ["El Alquimista", "El Pionero", "El Visionario", "El Arquitecto", "El Embajador", "El Susurro", "El Esteta", "El Poeta", "El Maestro"]
    
    silhouette_map = {
        "Hourglass": ["El Escultor", "El Alquimista", "El Esteta"],
        "Triangle": ["El Arquitecto", "El Diseñador", "El Maestro"],
        "Inverted Triangle": ["El Vanguardista", "El Estratega", "El Pionero"],
        "Rectangle": ["El Editor", "El Creador", "El Modelador"],
        "Oval": ["El Compositor", "El Armonizador", "El Curador"]
    }
    
    selected_nouns = silhouette_map.get(silhouette, nouns)
    noun = random.choice(selected_nouns)
    suffix = occasion_map.get(occasion, "del Estilo Contemporáneo")
    
    season_adjectives = {
        "Spring Warm": "Cálido",
        "Spring Light": "Luminoso",
        "Spring Clear": "Brillante",
        "Summer Cool": "Sereno",
        "Summer Light": "Fresco",
        "Summer Soft": "Suave",
        "Autumn Warm": "Terrenal",
        "Autumn Soft": "Místico",
        "Autumn Deep": "Profundo",
        "Winter Cool": "Helado",
        "Winter Deep": "Intenso",
        "Winter Clear": "Centelleante"
    }
    
    adj = "Chic"
    for key, val in season_adjectives.items():
        if normalize_str(key) in normalize_str(season) or normalize_str(season) in normalize_str(key):
            adj = val
            break
            
    return f"{noun} {adj} {suffix}"

def process_rpg_completion(answers, clothes):
    """
    Parses user answers, finds matching items in closet and boutique,
    constructs the best outfit, and calculates the overall score and title.
    """
    occasion = "Casual"
    season = "Winter Cool"
    silhouette = "Hourglass"
    
    # Parse answers (either list of option objects or option IDs)
    if isinstance(answers, list):
        for ans in answers:
            if isinstance(ans, dict):
                node_id = ans.get("node_id")
                option_id = ans.get("option_id")
                if node_id and option_id:
                    node = RPG_NODES.get(node_id)
                    if node:
                        for opt in node.get("options", []):
                            if opt.get("id") == option_id:
                                w = opt.get("weight_adjustments", {})
                                if "occasion" in w: occasion = w["occasion"]
                                if "season" in w: season = w["season"]
                                if "silhouette" in w: silhouette = w["silhouette"]
            elif isinstance(ans, str):
                for node_id, node in RPG_NODES.items():
                    for opt in node.get("options", []):
                        if opt.get("id") == ans:
                            w = opt.get("weight_adjustments", {})
                            if "occasion" in w: occasion = w["occasion"]
                            if "season" in w: season = w["season"]
                            if "silhouette" in w: silhouette = w["silhouette"]

    occasion_rule = OCCASIONS_RULES.get(occasion, OCCASIONS_RULES["Casual"])
    season_info = SEASONS_INFO.get(season, SEASONS_INFO["Winter Cool"])
    
    # Score all garments
    scored_clothes = []
    for g in clothes:
        score = calculate_garment_match_score(g, occasion_rule, season_info)
        scored_clothes.append({
            "garment": g,
            "score": score
        })
        
    scored_clothes.sort(key=lambda x: x["score"], reverse=True)
    
    # Separate into closet and boutique
    closet_items = [sc for sc in scored_clothes if sc["garment"].get("is_owned") == 1]
    boutique_items = [sc for sc in scored_clothes if sc["garment"].get("is_owned") == 0]
    
    # Curate best outfit (top, bottom, footwear, outerwear, accessory)
    outfit = {}
    categories = ["Top", "Bottom", "Footwear", "Outerwear", "Accessory"]
    for cat in categories:
        cat_items = [sc for sc in scored_clothes if sc["garment"]["category"].lower() == cat.lower()]
        if cat_items:
            outfit[cat.lower()] = cat_items[0]["garment"]
        else:
            outfit[cat.lower()] = None
            
    outfit_items = [outfit[cat.lower()] for cat in categories if outfit[cat.lower()] is not None]
    
    # Calculate score using the standard styling engine formula
    fashion_score_res = calculate_fashion_score(outfit_items, occasion=occasion)
    
    title = generate_fashion_title(occasion, season, silhouette)
    
    return {
        "title": title,
        "justification": fashion_score_res.get("advice", ""),
        "scores": {
            "total_score": fashion_score_res.get("total_score", 100.0),
            "color_score": fashion_score_res.get("color_score", 100.0),
            "style_score": fashion_score_res.get("style_score", 100.0),
            "pattern_score": fashion_score_res.get("pattern_score", 100.0),
            "weather_score": fashion_score_res.get("weather_score", 100.0)
        },
        "outfit": {
            "top": outfit["top"],
            "bottom": outfit["bottom"],
            "footwear": outfit["footwear"],
            "outerwear": outfit["outerwear"],
            "accessory": outfit["accessory"]
        },
        "closet": [sc["garment"] for sc in closet_items[:10]],
        "boutique": [sc["garment"] for sc in boutique_items[:10]]
    }



# BabylonSwarm_Commit_1: feat(rpg): initialize decision nodes and routing structures for styling simulator

# BabylonSwarm_Commit_3: feat(rpg): implement personality weights matching user seasonal color palettes

# BabylonSwarm_Commit_4: feat(rpg): calculate alignment score for tailored bodies (hourglass, triangle, rectangle)

# BabylonSwarm_Commit_13: feat(brands): precailor capsule wardrobes specifically matching Zara summer collection

# BabylonSwarm_Commit_14: feat(brands): precailor luxury gala outfits matching Christian Dior winter line

# BabylonSwarm_Commit_33: feat(quests): award bonus points to styling index for matching quest themes

# BabylonSwarm_Commit_34: feat(quests): implement 'Parisian Chic Tuesday' daily styling theme rules

# BabylonSwarm_Commit_35: feat(quests): implement 'Cyberpunk Friday' street-culture styling theme rules

# BabylonSwarm_Commit_51: test(qa): add backend unit tests for styling_engine color match logic

# BabylonSwarm_Commit_52: test(qa): add unit tests for biophysical CLO thermal calculation accuracy

# BabylonSwarm_Commit_58: fix(styling): handle zero items gracefully inside capsule wardrobe builders


# ==============================================================================
# BODY MORPHOLOGY & "NO TE LO PONGAS" (WHAT NOT TO WEAR) ENGINE
# Concept: Personalized styling advice based on body shape & digital wardrobe
# ==============================================================================

BODY_MORPHOLOGIES = {
    "hourglass": {
        "name_es": "Reloj de Arena",
        "description": "Busto y caderas proporcionados con una cintura claramente definida.",
        "best_cuts": ["cuello v", "corte imperio", "pantalón tiro alto", "vestido ajustado", "blazer entallado", "fajado"],
        "avoid_cuts": ["oversized sin forma", "cuello alto cerrado sin cintura", "túnicas rectas cuadradas"],
        "what_to_wear": [
            "Resalta la cintura con cortes entallados, cinturones o prendas de tiro alto.",
            "Utiliza escotes en V, corazón o cruzados para estilizar el torso.",
            "Prefiere faldas lápiz, corte A estructurado y pantalones de bota recta o flare."
        ],
        "what_not_to_wear": [
            "Evita prendas extremadamente holgadas de arriba a abajo que oculten tu cintura natural.",
            "No te lo pongas: capas sobrepuestas voluminosas sin definición en el talle."
        ]
    },
    "triangle": {
        "name_es": "Triángulo (Pera)",
        "description": "Caderas más anchas que los hombros y parte superior más ligera.",
        "best_cuts": ["mangas abullonadas", "hombreras", "cuello barco", "pantalón recto", "corte a", "colores claros arriba"],
        "avoid_cuts": ["pantalones estampados voluminosos", "faldas con alforzas en cadera", "camisetas ajustadas oscuras arriba"],
        "what_to_wear": [
            "Atrae la atención visual al torso superior con colores claros, estampados y detalles en hombros.",
            "Usa escotes barco, estructurados o con solapas amplias para equilibrar hombros con caderas.",
            "Prefiere pantalones y faldas fluidas en tonos oscuros o neutros y corte recto o A."
        ],
        "what_not_to_wear": [
            "No te lo pongas: pantalones de tiro muy bajo o faldas con volantes gruesos en la cadera.",
            "Evita estampados grandes en la prenda inferior si buscas esterilizar la figura."
        ]
    },
    "inverted_triangle": {
        "name_es": "Triángulo Invertido",
        "description": "Hombros o espalda más anchos que la cadera.",
        "best_cuts": ["pantalón palazzo", "falda plisada", "cuello v profundo", "peplum", "estampados en parte inferior"],
        "avoid_cuts": ["hombreras", "mangas globo", "cuello barco amplio", "chaquetas con solapas anchas"],
        "what_to_wear": [
            "Añade volumen en la prenda inferior con faldas plisadas, estampados o pantalones palazzo y cargo.",
            "Usa escotes verticales (V profundo) y líneas fluidas en el torso superior.",
            "Busca abrigos o blazers sin hombreras marcadas y de líneas limpias."
        ],
        "what_not_to_wear": [
            "No te lo pongas: prendas superiores con hombreras gigantes o cuellos desbocados horizontales.",
            "Evita blusas sin mangas con escote halter muy cerrado que ensanchen la espalda."
        ]
    },
    "rectangle": {
        "name_es": "Rectángulo",
        "description": "Hombros, cintura y caderas alineados en proporción similar.",
        "best_cuts": ["cinturones", "peplum", "faldas con vuelo", "cortes asimétricos", "capas estructuradas"],
        "avoid_cuts": ["vestidos rectos rígidos", "prendas cuadradas monótonas sin accesorio en cintura"],
        "what_to_wear": [
            "Crea la ilusión de curva usando cinturones, detalles peplum o cruzados.",
            "Juega con contrastes de color entre la parte superior e inferior.",
            "Utiliza faldas con volumen y pantalones con pliegues o detalles."
        ],
        "what_not_to_wear": [
            "No te lo pongas: looks totalmente rectos de pies a cabeza sin marcación visual de cintura.",
            "Evita prendas monolíticas rígidas que acentúen la falta de curvas."
        ]
    },
    "oval": {
        "name_es": "Óvalo (Manzana)",
        "description": "Zona abdominal más prominente con piernas y brazos estilizados.",
        "best_cuts": ["corte imperio", "cuello v", "vestidos envolventes", "telas fluidas caída vertical", "monocromía"],
        "avoid_cuts": ["cinturones anchos ajustados al abdomen", "telas rígidas brillantes", "crop tops"],
        "what_to_wear": [
            "Destaca tus extremidades (piernas y brazos) con faldas a la rodilla o escotes en V.",
            "Opta por prendas de caída fluida, líneas verticales y conjuntos monocromáticos.",
            "Prefiere blazers abiertos y cardigans de corte largo que generen columnas verticales."
        ],
        "what_not_to_wear": [
            "No te lo pongas: telas elásticas brillantes que marquen excesivamente el abdomen.",
            "Evita cinturones ajustados en la parte más ancha del torso."
        ]
    }
}

def evaluate_body_morphology(body_shape, garments):
    """
    Evaluates an ensemble of garments against a specific body shape morphology.
    Returns score (0-100), advice, what_to_wear and what_not_to_wear rules.
    """
    key = (body_shape or "").lower().strip()
    if key not in BODY_MORPHOLOGIES:
        # Default mapping
        if "reloj" in key or "hourglass" in key:
            key = "hourglass"
        elif "pera" in key or "triangulo" in key or "triangle" in key:
            key = "triangle"
        elif "invertid" in key:
            key = "inverted_triangle"
        elif "rectang" in key or "rectangle" in key:
            key = "rectangle"
        elif "oval" in key or "manzana" in key or "apple" in key:
            key = "oval"
        else:
            key = "hourglass"
            
    info = BODY_MORPHOLOGIES[key]
    score = 82.0
    feedback_rules = []
    avoid_warnings = []
    
    garments_list = [g for g in (garments or []) if isinstance(g, dict)]
    
    # Analyze garment attributes
    text_corpus = " ".join([f"{g.get('name', '')} {g.get('subcategory', '')} {g.get('style', '')} {g.get('pattern', '')}" for g in garments_list]).lower()
    
    # Check best cuts & avoid cuts
    best_matches = []
    for cut in info["best_cuts"]:
        cut_stem = cut.rstrip('s').lower()
        if cut_stem in text_corpus or cut.lower() in text_corpus or any(w.rstrip('s') in text_corpus for w in cut.lower().split() if len(w) > 3):
            best_matches.append(cut)
            
    avoid_matches = []
    for cut in info["avoid_cuts"]:
        cut_stem = cut.rstrip('s').lower()
        if cut_stem in text_corpus or cut.lower() in text_corpus or any(w.rstrip('s') in text_corpus for w in cut.lower().split() if len(w) > 3):
            avoid_matches.append(cut)
    
    if best_matches:
        score += len(best_matches) * 5.0
        feedback_rules.append(f"Las prendas elegidas con corte {', '.join(best_matches)} favorecen tu silueta {info['name_es']}.")
    
    if avoid_matches:
        score -= len(avoid_matches) * 8.0
        avoid_warnings.append(f"Consejo 'No Te Lo Pongas': Evita elementos como {', '.join(avoid_matches)} para no desequilibrar la silueta {info['name_es']}.")
        
    score = max(30.0, min(100.0, score))
    
    return {
        "body_shape": info["name_es"],
        "score": score,
        "description": info["description"],
        "what_to_wear": info["what_to_wear"],
        "what_not_to_wear": info["what_not_to_wear"] + avoid_warnings,
        "feedback": feedback_rules or [f"El conjunto presenta proporciones armónicas para el tipo de cuerpo {info['name_es']}."]
    }
