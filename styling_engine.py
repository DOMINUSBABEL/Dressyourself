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
    },
    "Oficina": {
        "preferred": ["Blusa", "Camisa", "Pantalón de Vestir", "Mocasines", "Botas", "Abrigo", "Bolso"],
        "avoid": ["Camiseta", "Tenis", "Chaqueta Denim", "Chaqueta Puffer"]
    },
    "Gimnasio": {
        "preferred": ["Camiseta", "Tenis", "Chaqueta Puffer", "Gafas de Sol"],
        "avoid": ["Mocasines", "Pantalón de Vestir", "Abrigo", "Falda", "Blusa", "Camisa"]
    },
    "Gala": {
        "preferred": ["Blusa", "Camisa", "Pantalón de Vestir", "Mocasines", "Botas", "Abrigo", "Bolso"],
        "avoid": ["Camiseta", "Tenis", "Chaqueta Denim", "Chaqueta Puffer"]
    },
    "Urbano": {
        "preferred": ["Camiseta", "Jeans", "Tenis", "Chaqueta", "Chaqueta Denim", "Gafas de Sol", "Bolso"],
        "avoid": ["Mocasines", "Pantalón de Vestir", "Abrigo"]
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
    # Find the city
    city = next((c for c in CITIES if c["index"] == int(city_index)), CITIES[0])
    temp = city["temp"]
    rain = city["rain"]
    
    # Filter clothes that are owned by the user (or all if we want to show suggestions)
    # The frontend usually works with user-owned wardrobe, but let's filter is_owned=1
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    if not owned_clothes:
        # Fallback to all if user doesn't have owned clothes
        owned_clothes = clothes
        
    # Helper to check temperature suitability (with some tolerance if no matches)
    def fits_temp(item, t, tolerance=0.0):
        min_t = item.get("min_temp") or -99.0
        max_t = item.get("max_temp") or 99.0
        return (min_t - tolerance) <= t <= (max_t + tolerance)

    # Filter clothes by temperature first (tolerance starts at 0)
    for tol in [0.0, 5.0, 10.0, 20.0]:
        temp_filtered = [c for c in owned_clothes if fits_temp(c, temp, tol)]
        if len([c for c in temp_filtered if c["category"] == "Top"]) > 0 and \
           len([c for c in temp_filtered if c["category"] == "Bottom"]) > 0 and \
           len([c for c in temp_filtered if c["category"] == "Footwear"]) > 0:
            owned_clothes = temp_filtered
            break
            
    # Divide into categories
    tops = [c for c in owned_clothes if c["category"] == "Top"]
    bottoms = [c for c in owned_clothes if c["category"] == "Bottom"]
    footwear = [c for c in owned_clothes if c["category"] == "Footwear"]
    outerwear = [c for c in owned_clothes if c["category"] == "Outerwear"]
    accessories = [c for c in owned_clothes if c["category"] == "Accessory"]
    
    # Score items based on occasion and rain
    def score_item(item):
        score = 100
        # Occasion preference
        subcat = item.get("subcategory") or ""
        name = item.get("name") or ""
        occ_rules = OCCASIONS_MAP.get(occasion, {"preferred": [], "avoid": []})
        
        # Match preference by subcategory or name
        is_pref = any(p.lower() in subcat.lower() or p.lower() in name.lower() for p in occ_rules["preferred"])
        is_avoid = any(a.lower() in subcat.lower() or a.lower() in name.lower() for a in occ_rules["avoid"])
        
        if is_pref:
            score += 30
        if is_avoid:
            score -= 40
            
        # Rain friendliness
        is_rf = item.get("rain_friendly") == 1
        if rain == 1:
            if is_rf:
                score += 50
            else:
                score -= 30
        else:
            # If not raining, neutral, but slightly prefer standard items
            pass
            
        return score
        
    # Select best candidates
    def select_best(items):
        if not items:
            return None
        # Sort by score descending and pick the best (or random from top scoring)
        scored = [(score_item(it), it) for it in items]
        scored.sort(key=lambda x: x[0], reverse=True)
        # Select randomly from top 2 to add variety
        candidates = [x[1] for x in scored[:2]]
        return random.choice(candidates)
        
    selected_top = select_best(tops)
    selected_bottom = select_best(bottoms)
    selected_footwear = select_best(footwear)
    
    # Outerwear requirement (Cold threshold: <= 15°C)
    selected_outerwear = None
    if temp <= 15.0 or (temp <= 18.0 and rain == 1):
        selected_outerwear = select_best(outerwear)
        
    # Accessories are optional
    selected_accessory = None
    if accessories and random.random() > 0.3:
        selected_accessory = select_best(accessories)
        
    # Generate Editorial Justification
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
        "justification": justification
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

def generate_travel_capsule(clothes, days, destination_type, climate):
    # Filter only owned clothes first, fallback to all if empty
    owned_clothes = [c for c in clothes if c.get("is_owned") == 1]
    if not owned_clothes:
        owned_clothes = clothes

    # Convert inputs to standard format
    days = int(days)
    destination_type = destination_type.strip()
    climate = climate.strip().lower() # 'frío', 'cálido', 'templado'
    
    # 1. Filter clothes by climate/temperature suitability
    # We will score clothes based on suitability for the given climate and destination
    def score_climate_and_dest(item):
        score = 100
        category = item.get("category")
        subcategory = item.get("subcategory") or ""
        name = item.get("name") or ""
        min_temp = item.get("min_temp") or -99.0
        max_temp = item.get("max_temp") or 99.0
        rain_friendly = item.get("rain_friendly", 0) == 1
        
        # Climate suitability
        if climate == 'frío':
            # Prefer warmer items, allow outerwear, boots
            if max_temp <= 18.0:
                score += 30
            if min_temp > 18.0: # Too warm
                score -= 50
            if category == 'Outerwear':
                score += 40
            if subcategory in ['Botas', 'Abrigo', 'Bufanda', 'Chaqueta Puffer']:
                score += 20
        elif climate == 'cálido':
            # Prefer cool items, avoid heavy coats and boots
            if min_temp >= 15.0:
                score += 30
            if max_temp < 15.0: # Too cold
                score -= 50
            if subcategory in ['Botas', 'Abrigo', 'Bufanda', 'Chaqueta Puffer']:
                score -= 60
            if subcategory in ['Camiseta', 'Falda', 'Tenis', 'Mocasines', 'Gafas de Sol']:
                score += 20
        else: # 'templado'
            # Balanced temperature range
            if min_temp <= 22.0 and max_temp >= 12.0:
                score += 30
            if subcategory in ['Bufanda', 'Chaqueta Puffer']:
                score -= 10 # slightly avoid extremely heavy items
                
        # Destination suitability
        dest_lower = destination_type.lower()
        if 'playa' in dest_lower or 'mar' in dest_lower:
            if subcategory in ['Gafas de Sol', 'Camiseta', 'Falda', 'Tenis']:
                score += 30
            if subcategory in ['Botas', 'Abrigo', 'Pantalón de Vestir']:
                score -= 60
        elif 'montaña' in dest_lower or 'bosque' in dest_lower or 'senderismo' in dest_lower:
            if rain_friendly:
                score += 20
            if subcategory in ['Botas', 'Tenis', 'Chaqueta Puffer', 'Chaqueta']:
                score += 30
            if subcategory in ['Mocasines', 'Falda', 'Gafas de Sol Retro']:
                score -= 40
        elif 'oficina' in dest_lower or 'negocios' in dest_lower or 'trabajo' in dest_lower:
            if subcategory in ['Pantalón de Vestir', 'Blusa', 'Camisa', 'Mocasines', 'Abrigo']:
                score += 30
            if subcategory in ['Camiseta', 'Chaqueta Denim', 'Tenis']:
                score -= 30
        elif 'ciudad' in dest_lower or 'urbano' in dest_lower:
            if subcategory in ['Jeans', 'Tenis', 'Camiseta', 'Chaqueta Denim', 'Bolso']:
                score += 20

        return score

    # Group by category and sort by score
    scored_clothes = [(score_climate_and_dest(c), c) for c in owned_clothes]
    
    categories = {
        "Top": [],
        "Bottom": [],
        "Footwear": [],
        "Outerwear": [],
        "Accessory": []
    }
    
    for score, item in scored_clothes:
        cat = item.get("category")
        if cat in categories:
            categories[cat].append((score, item))
            
    # Sort items inside categories by score descending
    for cat in categories:
        categories[cat].sort(key=lambda x: x[0], reverse=True)
        # Unwrap score
        categories[cat] = [item for score, item in categories[cat]]

    # Define baseline target counts:
    if days <= 3:
        target_tops = 2
        target_bottoms = 2
        target_footwear = 1
        target_outerwear = 1 if climate in ['frío', 'templado'] else 0
        target_accessories = 1
    elif days <= 6:
        target_tops = 3
        target_bottoms = 2
        target_footwear = 1
        target_outerwear = 1 if climate in ['frío', 'templado'] else 0
        target_accessories = 1
    else:
        target_tops = 4
        target_bottoms = 3
        target_footwear = 2
        target_outerwear = 1 if climate in ['frío', 'templado'] else 0
        target_accessories = 2

    # Adjust counts based on availability
    def limit_count(cat, target):
        return min(target, len(categories[cat]))
        
    num_tops = limit_count("Top", target_tops)
    num_bottoms = limit_count("Bottom", target_bottoms)
    num_footwear = limit_count("Footwear", target_footwear)
    num_outerwear = limit_count("Outerwear", target_outerwear)
    num_accessories = limit_count("Accessory", target_accessories)

    # Let's ensure we have at least one top, bottom, and footwear!
    if num_tops < 1 and categories["Top"]: num_tops = 1
    if num_bottoms < 1 and categories["Bottom"]: num_bottoms = 1
    if num_footwear < 1 and categories["Footwear"]: num_footwear = 1

    # Check combinations count
    def get_combinations(t, b, f, o, a):
        return t * b * f * (o + 1) * (a + 1)

    # If combinations < 15, we dynamically add items to reach at least 15
    iterations = 0
    while get_combinations(num_tops, num_bottoms, num_footwear, num_outerwear, num_accessories) < 15 and iterations < 10:
        iterations += 1
        if num_tops < len(categories["Top"]):
            num_tops += 1
        elif num_bottoms < len(categories["Bottom"]):
            num_bottoms += 1
        elif num_accessories < len(categories["Accessory"]):
            num_accessories += 1
        elif num_outerwear < len(categories["Outerwear"]):
            num_outerwear += 1
        elif num_footwear < len(categories["Footwear"]):
            num_footwear += 1
        else:
            break

    # Gather selected items
    selected_tops = categories["Top"][:num_tops]
    selected_bottoms = categories["Bottom"][:num_bottoms]
    selected_footwear = categories["Footwear"][:num_footwear]
    selected_outerwear = categories["Outerwear"][:num_outerwear]
    selected_accessories = categories["Accessory"][:num_accessories]

    all_selected = selected_tops + selected_bottoms + selected_footwear + selected_outerwear + selected_accessories
    
    # Calculate combinations formula and count
    final_comb_count = get_combinations(num_tops, num_bottoms, num_footwear, num_outerwear, num_accessories)
    formula = f"{num_tops} Tops * {num_bottoms} Bottoms * {num_footwear} Footwear"
    if num_outerwear > 0:
        formula += f" * ({num_outerwear} Outerwear + 1 opción sin abrigo)"
    if num_accessories > 0:
        formula += f" * ({num_accessories} Accessories + 1 opción sin accesorios)"
    formula += f" = {final_comb_count} combinaciones"

    # Generate professional editorial justification
    justification = (
        f"Maleta cápsula de viaje optimizada para una estancia de {days} días en un destino de tipo '{destination_type}' "
        f"con clima {climate.capitalize()}. "
        f"Con una selección minimalista de {len(all_selected)} prendas, este armario cápsula garantiza matemáticamente "
        f"al menos {final_comb_count} combinaciones distintas ({formula}), cubriendo con holgura toda tu estancia. "
        f"Hemos priorizado "
    )
    
    highlights = []
    if selected_tops:
        highlights.append(f"los tops ({', '.join([t['name'] for t in selected_tops[:2]])})")
    if selected_bottoms:
        highlights.append(f"las partes inferiores ({', '.join([b['name'] for b in selected_bottoms[:2]])})")
    if selected_outerwear:
        highlights.append(f"el abrigo adaptable ({selected_outerwear[0]['name']})")
        
    justification += ", ".join(highlights) + " para responder perfectamente a las necesidades térmicas y la etiqueta del lugar."

    return {
        "days": days,
        "destination_type": destination_type,
        "climate": climate,
        "recommended_clothes": all_selected,
        "combinations_count": final_comb_count,
        "combinations_formula": formula,
        "justification": justification
    }
