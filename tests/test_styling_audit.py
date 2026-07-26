import unittest
import os
import sys

# Ensure root directory is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import styling_engine
from app import app

class TestStylingEngineAudit(unittest.TestCase):

    def setUp(self):
        self.app_client = app.test_client()
        self.app_client.testing = True

        self.sample_top = {
            "id": 1,
            "name": "Camisa de Lino Blanco Elegante",
            "category": "Top",
            "subcategory": "Camisa",
            "color_primary": "Blanco",
            "pattern": "Liso",
            "formality": 7,
            "is_owned": 1
        }
        self.sample_bottom = {
            "id": 2,
            "name": "Pantalón de Vestir Azul Marino con Cinturón",
            "category": "Bottom",
            "subcategory": "Pantalón",
            "color_primary": "Azul Marino",
            "pattern": "Liso",
            "formality": 7,
            "is_owned": 1
        }
        self.sample_footwear = {
            "id": 3,
            "name": "Mocasines de Cuero Negro",
            "category": "Footwear",
            "subcategory": "Mocasines",
            "color_primary": "Negro",
            "pattern": "Liso",
            "formality": 8,
            "is_owned": 1,
            "rain_friendly": 1
        }
        self.sample_outerwear = {
            "id": 4,
            "name": "Abrigo de Lana Gruesa",
            "category": "Outerwear",
            "subcategory": "Abrigo",
            "color_primary": "Gris Marengo",
            "pattern": "Liso",
            "formality": 8,
            "is_owned": 1,
            "rain_friendly": 1
        }
        self.sample_accessory = {
            "id": 5,
            "name": "Gafas de Sol Clásicas",
            "category": "Accessory",
            "subcategory": "Gafas de Sol",
            "color_primary": "Negro",
            "pattern": "Liso",
            "formality": 6,
            "is_owned": 1
        }

    # 1. BODY MORPHOLOGY & "NO TE LO PONGAS" RULES AUDIT
    def test_body_morphology_evaluation_all_shapes(self):
        garments = [self.sample_top, self.sample_bottom, self.sample_footwear]
        shapes = ["hourglass", "triangle", "inverted_triangle", "rectangle", "oval"]
        
        for shape in shapes:
            res = styling_engine.evaluate_body_morphology(shape, garments)
            self.assertIn("score", res)
            self.assertIn("body_shape", res)
            self.assertIn("what_to_wear", res)
            self.assertIn("what_not_to_wear", res)
            self.assertGreaterEqual(res["score"], 30.0)
            self.assertLessEqual(res["score"], 100.0)

    def test_no_te_lo_pongas_warning_trigger(self):
        # Oval morphology with crop top (avoided cut)
        avoided_item = {
            "name": "Crop Top de Tela Elástica Brillante",
            "category": "Top",
            "subcategory": "Crop Top",
            "style": "Ajustado",
            "pattern": "Brillante"
        }
        res = styling_engine.evaluate_body_morphology("oval", [avoided_item])
        not_to_wear_text = " ".join(res["what_not_to_wear"])
        self.assertIn("Consejo 'No Te Lo Pongas'", not_to_wear_text)

    def test_body_morphology_null_safety(self):
        res = styling_engine.evaluate_body_morphology(None, None)
        self.assertIn("score", res)
        self.assertIn("body_shape", res)

    # 2. 12-SEASON COLORIMETRY AUDIT
    def test_evaluate_12_season_colorimetry(self):
        garments = [self.sample_top, self.sample_bottom, self.sample_footwear]
        best_season, color_score, contrast_val, contrast_level, commentary = styling_engine.evaluate_12_season_color(garments)
        
        self.assertIsNotNone(best_season)
        self.assertGreaterEqual(color_score, 30.0)
        self.assertIn(contrast_level, ["Alto", "Medio", "Bajo"])
        self.assertIn("Armonía", commentary)

    def test_french_rule_three_colors(self):
        # 3 unique colors -> bonus applied
        garments_3 = [
            {"color_primary": "Rojo Carmin"},
            {"color_primary": "Azul Marino"},
            {"color_primary": "Blanco Puro"}
        ]
        score_res = styling_engine.calculate_fashion_score(garments_3, city_name="Bogotá", occasion="Casual")
        self.assertGreaterEqual(score_res["color_score"], 70.0)

    # 3. THERMAL WEATHER ISOLATION AUDIT
    def test_thermal_weather_isolation_cold(self):
        # Cold weather Bogotá (approx 14°C) without outerwear
        items_light = [self.sample_top, self.sample_bottom]
        score_res = styling_engine.calculate_fashion_score(items_light, city_name="Bogotá", occasion="Casual", temp=5.0, rain=0)
        self.assertIn("clo_value", score_res)
        self.assertIn("effective_temp", score_res)
        self.assertIn("heat_balance", score_res)
        
        # Cold warning expected for < 8°C without L3 outerwear
        under_layered_warnings = [w for w in score_res["warnings"] if w.get("type") == "under_layered"]
        self.assertGreaterEqual(len(under_layered_warnings), 1)

    def test_thermal_weather_isolation_rain(self):
        # Rain condition with non-rain friendly footwear
        non_rain_shoe = {
            "name": "Sandalias de Tela",
            "category": "Footwear",
            "subcategory": "Sandalia",
            "rain_friendly": 0
        }
        items = [self.sample_top, self.sample_bottom, non_rain_shoe]
        score_res = styling_engine.calculate_fashion_score(items, city_name="Bogotá", occasion="Casual", temp=15.0, rain=1)
        rain_warnings = [w for w in score_res["warnings"] if w.get("type") == "rain_footwear"]
        self.assertGreaterEqual(len(rain_warnings), 1)

    # 4. MULTI-GARMENT CANVAS SCORING AUDIT
    def test_multi_garment_canvas_scoring(self):
        canvas_items = [self.sample_top, self.sample_bottom, self.sample_footwear, self.sample_outerwear, self.sample_accessory]
        score_res = styling_engine.calculate_fashion_score(canvas_items, city_name="Bogotá", occasion="Business Casual")
        
        self.assertIn("color_score", score_res)
        self.assertIn("style_score", score_res)
        self.assertIn("pattern_score", score_res)
        self.assertIn("weather_score", score_res)
        self.assertIn("total_score", score_res)
        self.assertIn("advice", score_res)

    def test_recommend_outfit(self):
        all_clothes = [self.sample_top, self.sample_bottom, self.sample_footwear, self.sample_outerwear, self.sample_accessory]
        rec = styling_engine.recommend_outfit(all_clothes, city_index=0, occasion="Business Casual", body_shape="rectangle")
        
        self.assertIn("top", rec)
        self.assertIn("bottom", rec)
        self.assertIn("footwear", rec)
        self.assertIn("outfit", rec)
        self.assertIn("morphology", rec)
        self.assertIn("total_score", rec)

    # 5. APP.PY API INTEGRATION AUDIT
    def test_api_recommend_endpoint(self):
        response = self.app_client.get('/api/recommend?city_index=0&occasion=Casual&body_shape=hourglass')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("total_score", data)
        self.assertIn("morphology", data)

if __name__ == "__main__":
    unittest.main()
