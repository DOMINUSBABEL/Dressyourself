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
    for family, colors in COLOR_FAMILIES.items():
        if color_name in colors:
            return family
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

# Occasions subcategory mapping
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
    {"index": 0, "name": "Bogotá", "temp": 12.0, "rain": 1},
    {"index": 1, "name": "Medellín", "temp": 22.0, "rain": 0},
    {"index": 2, "name": "Cartagena", "temp": 30.0, "rain": 0},
    {"index": 3, "name": "Cali", "temp": 26.0, "rain": 1},
    {"index": 4, "name": "Londres", "temp": 8.0, "rain": 1},
    {"index": 5, "name": "Nueva York", "temp": 5.0, "rain": 0}
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

def calculate_fashion_score(items, city_name="Bogotá", occasion="Casual", temp=None, rain=None):
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
    colors_parsed = []
    for item in items:
        color_p = item.get("color_primary")
        if color_p:
            colors_parsed.append(parse_color(color_p))
    chromatic_colors = [c for c in colors_parsed if not c[3]]
    neutral_colors = [c for c in colors_parsed if c[3]]
    num_chromatic = len(chromatic_colors)
    num_neutrals = len(neutral_colors)
    color_type = "Desconocida"
    if num_chromatic == 0:
        color_type = "Canvas / Neutro Monocromático"
        if num_neutrals > 0:
            lightnesses = [c[2] for c in neutral_colors]
            delta_L = max(lightnesses) - min(lightnesses)
        else:
            delta_L = 0
        if delta_L >= 35:
            color_score = 100.0
        else:
            color_score = 90.0 + (delta_L / 35.0) * 10.0
    elif num_chromatic == 1:
        color_type = "Acento en Neutro"
        color_score = 100.0
    elif num_chromatic == 2:
        h1, _, l1, _ = chromatic_colors[0]
        h2, _, l2, _ = chromatic_colors[1]
        theta1 = map_hue_to_center(h1)
        theta2 = map_hue_to_center(h2)
        d12 = angular_distance(theta1, theta2)
        if d12 == 0:
            color_type = "Par Monocromático"
            if abs(l1 - l2) >= 25:
                color_score = 100.0
            else:
                color_score = 92.0
        elif d12 == 30:
            color_type = "Par Análogo"
            color_score = 100.0
        elif d12 == 180:
            color_type = "Par Complementario"
            color_score = 100.0
        elif d12 == 120:
            color_type = "Componente Tríada / Split"
            color_score = 85.0
        elif d12 in [60, 90]:
            color_type = "Semi-Choque Cromático"
            color_score = 70.0
        else:
            color_type = "Choque Cromático"
            color_score = 50.0
    elif num_chromatic == 3:
        h1, _, l1, _ = chromatic_colors[0]
        h2, _, l2, _ = chromatic_colors[1]
        h3, _, l3, _ = chromatic_colors[2]
        theta1 = map_hue_to_center(h1)
        theta2 = map_hue_to_center(h2)
        theta3 = map_hue_to_center(h3)
        d12 = angular_distance(theta1, theta2)
        d23 = angular_distance(theta2, theta3)
        d31 = angular_distance(theta3, theta1)
        max_dist = max(d12, d23, d31)
        is_split_comp = False
        for x, y, z in [(theta1, theta2, theta3), (theta2, theta3, theta1), (theta3, theta1, theta2)]:
            d_xy = angular_distance(x, y)
            if d_xy in [30, 60]:
                if abs(x - y) < 180:
                    mid = (x + y) / 2.0
                else:
                    mid = (x + y + 360) / 2.0 % 360
                if angular_distance(z, mid) >= 150:
                    is_split_comp = True
                    break
        is_triadic = d12 == 120 and d23 == 120 and d31 == 120
        if max_dist <= 90:
            color_type = "Tríada Análoga"
            color_score = 100.0
        elif is_split_comp:
            color_type = "Tríada Complementaria Dividida"
            color_score = 100.0
        elif is_triadic:
            color_type = "Armonía Tríada"
            color_score = 95.0
        else:
            color_type = "Tríada Discordante"
            def pair_score(ta, tb):
                d_ab = angular_distance(ta, tb)
                if d_ab == 0: return 92
                elif d_ab == 30: return 100
                elif d_ab == 180: return 100
                elif d_ab == 120: return 85
                elif d_ab in [60, 90]: return 70
                return 50
            avg_pair = (pair_score(theta1, theta2) + pair_score(theta2, theta3) + pair_score(theta3, theta1)) / 3.0
            color_score = max(40.0, avg_pair - 15.0)
    else:
        color_type = "Sobrecarga de Colores (Arcoíris)"
        color_score = max(30.0, 75.0 - 15.0 * (num_chromatic - 3))
    formalities = [get_formality(item) for item in items]
    mean_formality = sum(formalities) / len(formalities)
    if len(formalities) > 1:
        variance = sum((f - mean_formality) ** 2 for f in formalities) / len(formalities)
        std_deviation = variance ** 0.5
    else:
        std_deviation = 0.0
    score_coherence = 100.0 * (2.718281828459045 ** (-0.18 * (std_deviation ** 1.5)))
    occ_lower = {"deportivo": 1.0, "sporty": 1.0, "casual": 3.0, "fiesta": 5.0, "party": 5.0, "formal": 8.0}
    occ_upper = {"deportivo": 3.0, "sporty": 3.0, "casual": 6.0, "fiesta": 8.0, "party": 8.0, "formal": 10.0}
    occ_normalized = normalize_str(occasion)
    f_target_min = occ_lower.get(occ_normalized, 3.0)
    f_target_max = occ_upper.get(occ_normalized, 6.0)
    if f_target_min <= mean_formality <= f_target_max:
        d_O = 0.0
    elif mean_formality < f_target_min:
        d_O = f_target_min - mean_formality
    else:
        d_O = mean_formality - f_target_max
    score_adherence = max(0.0, 100.0 - 25.0 * (d_O ** 2))
    style_score = 0.40 * score_coherence + 0.60 * score_adherence
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
    thermal_res = []
    layer_types = []
    for item in items:
        h_val, lay = get_thermal_index_and_layer(item)
        thermal_res.append(h_val)
        layer_types.append(lay)
    R_outfit = sum(thermal_res)
    if temp < 0:
        R_min, R_max = 7.5, 11.0
    elif 0 <= temp < 8:
        R_min, R_max = 6.0, 8.5
    elif 8 <= temp < 15:
        R_min, R_max = 4.0, 6.5
    elif 15 <= temp < 22:
        R_min, R_max = 2.2, 4.2
    elif 22 <= temp < 28:
        R_min, R_max = 1.2, 2.2
    else:
        R_min, R_max = 0.5, 1.3
    if R_min <= R_outfit <= R_max:
        d_T = 0.0
    elif R_outfit < R_min:
        d_T = R_min - R_outfit
    else:
        d_T = R_outfit - R_max
    temp_comfort_score = max(0.0, 100.0 - 25.0 * (d_T ** 2))
    P_layering = 0
    warnings = []
    if temp < 8:
        if "L3" not in layer_types:
            P_layering = 30
            warnings.append({"type": "under_layered", "message": "Falta abrigo grueso (L3) para clima helado."})
    elif temp >= 28:
        if "L2" in layer_types or "L3" in layer_types:
            P_layering = 30
            warnings.append({"type": "over_layered", "message": "Exceso de capas (L2/L3) para clima caluroso."})
    P_rain_outer = 0
    P_rain_foot = 0
    if rain == 1:
        l3_items = [it for it, lay in zip(items, layer_types) if lay == "L3"]
        if not l3_items or any(it.get("rain_friendly") != 1 for it in l3_items):
            P_rain_outer = 20
            warnings.append({"type": "rain_outerwear", "message": "Falta abrigo impermeable para lluvia."})
        footwear_items = [it for it, lay in zip(items, layer_types) if lay == "Footwear"]
        if footwear_items and any(it.get("rain_friendly") != 1 for it in footwear_items):
            P_rain_foot = 25
            warnings.append({"type": "rain_footwear", "message": "Calzado no apto para la lluvia detectado."})
    uv, humidity = get_city_weather_conditions(city_name, temp, rain)
    P_uv_acc = 0
    P_uv_skin = 0
    if uv >= 6:
        acc_items = [it for it, lay in zip(items, layer_types) if lay == "L4"]
        has_sun_acc = False
        for acc in acc_items:
            acc_name = normalize_str(acc.get("name", ""))
            if any(k in acc_name for k in ["gafas", "lentes", "sombrero", "gorra", "sunglasses", "hat"]):
                has_sun_acc = True
                break
        if not has_sun_acc:
            P_uv_acc = 10
            warnings.append({"type": "uv_accessory", "message": "Faltan accesorios de protección solar (L4)."})
            if R_outfit < 1.5:
                P_uv_skin = 5
                warnings.append({"type": "uv_skin_exposure", "message": "Piel muy expuesta con alto índice UV."})
    P_humidity = 0
    B_breathable = 0
    if temp >= 25 and humidity >= 70:
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
            P_humidity = 15
            warnings.append({"type": "humidity_breathability_penalty", "message": "Tejido sintético poco transpirable en clima húmedo."})
        if breathable:
            B_breathable = 5
    weather_score = max(0.0, temp_comfort_score - P_layering - P_rain_outer - P_rain_foot - P_uv_acc - P_uv_skin - P_humidity + B_breathable)
    total_score = 0.35 * color_score + 0.30 * style_score + 0.15 * pattern_score + 0.20 * weather_score
    scores_dict = {"Color": color_score, "Estilo": style_score, "Patrón": pattern_score, "Clima": weather_score}
    highest_sub = max(scores_dict, key=scores_dict.get)
    highest_val = scores_dict[highest_sub]
    critique_list = []
    if color_score < 80.0:
        critique_list.append(f"la armonía de color ({color_type.lower()}) necesita un ajuste cromático")
    if style_score < 80.0:
        if std_deviation > 2.0:
            critique_list.append("hay un choque de formalidades en las prendas elegidas")
        else:
            critique_list.append("el nivel de formalidad no se alinea con la ocasión seleccionada")
    if pattern_score < 80.0:
        critique_list.append("la mezcla de patrones resulta sobrecargada")
    if weather_score < 80.0:
        if temp < 8:
            critique_list.append("el ensamble es demasiado frío para la temperatura exterior")
        elif temp >= 28:
            critique_list.append("el look tiene demasiadas capas para el calor")
        else:
            critique_list.append("las prendas no se adaptan perfectamente a las condiciones climáticas actuales")
    greeting = "Bonjour, chérie!"
    if total_score >= 90.0:
        greeting = "¡Bonjour! Mon dieu, este ensamble es una obra de arte absoluta,"
        critique = "La silueta es impecable y está lista para desfilar."
        suggestion = "No le cambies absolutamente nada, es sencillamente sublime."
    elif total_score >= 75.0:
        greeting = "¡Bonjour! Un look bastante interesante y chic,"
        critique = "Aunque tiene un gran porte, " + (" y ".join(critique_list) if critique_list else "puntos mínimos podrían pulirse") + "."
        suggestion = "Te sugiero ajustar un poco las proporciones o los accesorios para llegar a la perfección."
    else:
        greeting = "Bonjour... Tenemos trabajo por hacer, darling,"
        critique = "El ensamble tiene discordancias importantes: " + (" y ".join(critique_list) if critique_list else "falta cohesión en las capas o estilos") + "."
        lowest_sub = min(scores_dict, key=scores_dict.get)
        if lowest_sub == "Color":
            suggestion = "Te recomiendo cambiar uno de los colores por un tono neutro o un complementario directo."
        elif lowest_sub == "Estilo":
            suggestion = "Sugiero cambiar el calzado deportivo por unos mocasines o botas para unificar la formalidad."
        elif lowest_sub == "Clima":
            suggestion = "Agrega una chaqueta o abrigo adecuado para regular tu confort térmico."
        else:
            suggestion = "Prueba con prendas lisas para mitigar el conflicto de estampados."
    advice = f"{greeting} califica un {total_score:.1f}% en la escala Haute Couture. Tu punto más fuerte es {highest_sub.lower()} ({highest_val:.1f}%). {critique} {suggestion}"
    return {
        "color_score": round(color_score, 1),
        "style_score": round(style_score, 1),
        "pattern_score": round(pattern_score, 1),
        "weather_score": round(weather_score, 1),
        "total_score": round(total_score, 1),
        "color_type": color_type,
        "mean_formality": round(mean_formality, 2),
        "std_deviation": round(std_deviation, 2),
        "clashing_items": clashing_items,
        "warnings": warnings,
        "advice": advice
    }

def recommend_outfit(clothes, city_index, occasion):
    """
    Coordinates a complete outfit: Top, Bottom, Footwear.
    Adds Outerwear if temperature <= 15°C.
    Adds Accessory if available.
    Filters by:
      - Temperature range (min_temp <= city_temp <= max_temp)
      - Rain friendliness (if city_rain == 1, prioritize rain_friendly items)
      - Occasion styling preferences
    """
    city = next((c for c in CITIES if c["index"] == int(city_index)), CITIES[0])
    temp = city["temp"]
    rain = city["rain"]
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    if not owned_clothes:
        owned_clothes = clothes
    def fits_temp(item, t, tolerance=0.0):
        min_t = item.get("min_temp") or -99.0
        max_t = item.get("max_temp") or 99.0
        return (min_t - tolerance) <= t <= (max_t + tolerance)
    for tol in [0.0, 5.0, 10.0, 20.0]:
        temp_filtered = [c for c in owned_clothes if fits_temp(c, temp, tol)]
        if len([c for c in temp_filtered if c["category"] == "Top"]) > 0 and \
           len([c for c in temp_filtered if c["category"] == "Bottom"]) > 0 and \
           len([c for c in temp_filtered if c["category"] == "Footwear"]) > 0:
            owned_clothes = temp_filtered
            break
    tops = [c for c in owned_clothes if c["category"] == "Top"]
    bottoms = [c for c in owned_clothes if c["category"] == "Bottom"]
    footwear = [c for c in owned_clothes if c["category"] == "Footwear"]
    outerwear = [c for c in owned_clothes if c["category"] == "Outerwear"]
    accessories = [c for c in owned_clothes if c["category"] == "Accessory"]
    def score_item(item):
        score = 100
        subcat = item.get("subcategory") or ""
        name = item.get("name") or ""
        occ_rules = OCCASIONS_MAP.get(occasion, {"preferred": [], "avoid": []})
        is_pref = any(p.lower() in subcat.lower() or p.lower() in name.lower() for p in occ_rules["preferred"])
        is_avoid = any(a.lower() in subcat.lower() or a.lower() in name.lower() for a in occ_rules["avoid"])
        if is_pref:
            score += 30
        if is_avoid:
            score -= 40
        is_rf = item.get("rain_friendly") == 1
        if rain == 1:
            if is_rf:
                score += 50
            else:
                score -= 30
        return score
    def select_best(items):
        if not items:
            return None
        scored = [(score_item(it), it) for it in items]
        scored.sort(key=lambda x: x[0], reverse=True)
        candidates = [x[1] for x in scored[:2]]
        return random.choice(candidates)
    selected_top = select_best(tops)
    selected_bottom = select_best(bottoms)
    selected_footwear = select_best(footwear)
    selected_outerwear = None
    if temp <= 15.0 or (temp <= 18.0 and rain == 1):
        selected_outerwear = select_best(outerwear)
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
    
    # Calculate fashion score for the outfit
    rec_items = [selected_top, selected_bottom, selected_footwear, selected_outerwear, selected_accessory]
    score_details = calculate_fashion_score(rec_items, city["name"], occasion, temp, rain)
    
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
        "justification": justification,
        
        "color_score": score_details["color_score"],
        "style_score": score_details["style_score"],
        "pattern_score": score_details["pattern_score"],
        "weather_score": score_details["weather_score"],
        "total_score": score_details["total_score"],
        "advice": score_details["advice"]
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
            "name": f"Monocromía en {t.get('color_primary')}",
            "type": "Monocromática",
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
            f"La audacia del contraste absoluto. Al yuxtaponer la calidez o neutralidad de {t['name']} ({t.get('color_primary')}) "
            f"con la profundidad contrastante de {b['name']} ({b.get('color_primary')}), se genera una tensión cromática vibrante "
            f"que rompe la monotonía urbana. Un outfit estructurado para proyectar seguridad y visión de estilo."
        )
        
        innovations.append({
            "name": "Contraste Complementario Vanguardista",
            "type": "Complementaria",
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
            f"Armonía cromática orgánica. La transición suave entre {t['name']} ({t.get('color_primary')}) "
            f"y {b['name']} ({b.get('color_primary')}) fluye de manera natural al ser colores contiguos en el círculo cromático. "
            f"Este ensamble genera una vibra sumamente acogedora y pulida, ideal para quienes buscan elegancia sin estridencias."
        )
        
        innovations.append({
            "name": "Sinfonía Análoga de Transición",
            "type": "Análoga",
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
            f"La subversión definitiva de los códigos tradicionales de vestimenta. Al fusionar la comodidad urbana de "
            f"{f['name']} con {clash_detail}, se dinamiza la silueta sastre clásica. "
            f"Un manifiesto streetwear cosmopolita que prueba que las mejores reglas de estilo son las que se rompen con gracia."
        )
        
        innovations.append({
            "name": "Style Clash: Sastrería & Streetwear",
            "type": "Style Clash",
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
            f"Una propuesta ecléctica de alta costura contemporánea. Uniendo {t['name']} y {b['name']} con el calzado "
            f"{f['name']}. Una combinación atemporal, curada meticulosamente por nuestro motor de estilismo."
        )
        
        innovations.append({
            "name": "Ensamble Editorial Exclusivo",
            "type": "Edición Limitada",
            "top": t,
            "bottom": b,
            "footwear": f,
            "outerwear": out,
            "accessory": acc,
            "justification": justification
        })

    return innovations
