import unittest
import os
import sys
import io
import json
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
import styling_engine
import vision_engine

class TestApiEndpointsAudit(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        # Generate a dummy test image
        img = Image.new('RGB', (120, 120), color='blue')
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format='PNG')
        self.test_img_bytes = img_bytes_io.getvalue()

    # 1. AUDIT /api/clothes ENDPOINTS
    def test_clothes_get_and_post_and_delete(self):
        # GET /api/clothes
        res = self.client.get('/api/clothes')
        self.assertEqual(res.status_code, 200)
        items = res.get_json()
        self.assertIsInstance(items, list)

        # POST /api/clothes
        new_item = {
            "name": "Chaqueta de Tweed Test",
            "image_url": "https://example.com/test.jpg",
            "category": "Outerwear",
            "subcategory": "Chaqueta",
            "color_primary": "Gris Marengo",
            "pattern": "Liso",
            "price": 129.99,
            "store_name": "Atelier",
            "is_owned": 1
        }
        res_post = self.client.post('/api/clothes', json=new_item)
        self.assertEqual(res_post.status_code, 201)
        created = res_post.get_json()
        self.assertIn("id", created)
        created_id = created["id"]

        # DELETE /api/clothes/<id>
        res_del = self.client.delete(f'/api/clothes/{created_id}')
        self.assertEqual(res_del.status_code, 200)

    def test_clothes_post_validation(self):
        # Invalid POST missing required name/image_url/category
        res = self.client.post('/api/clothes', json={"name": "Incompleto"})
        self.assertEqual(res.status_code, 400)

    # 2. AUDIT /api/scan ENDPOINTS
    def test_scan_image_endpoint(self):
        data = {
            'image': (io.BytesIO(self.test_img_bytes), 'scan_test.png')
        }
        res = self.client.post('/api/scan', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertIn("category", json_data)
        self.assertIn("color_primary", json_data)
        self.assertIn("cutout_base64", json_data)

    def test_scan_image_no_file(self):
        res = self.client.post('/api/scan')
        self.assertEqual(res.status_code, 400)

    # 3. AUDIT /api/outfits ENDPOINTS
    def test_outfits_crud(self):
        # GET /api/outfits
        res = self.client.get('/api/outfits')
        self.assertEqual(res.status_code, 200)
        outfits = res.get_json()
        self.assertIsInstance(outfits, list)

        # POST /api/outfits
        new_outfit = {
            "name": "Look Test",
            "top_id": 1,
            "bottom_id": 2,
            "footwear_id": 3,
            "justification": "Outfit de prueba para la auditoría."
        }
        res_post = self.client.post('/api/outfits', json=new_outfit)
        self.assertEqual(res_post.status_code, 201)
        created = res_post.get_json()
        self.assertIn("id", created)
        created_id = created["id"]

        # DELETE /api/outfits/<id>
        res_del = self.client.delete(f'/api/outfits/{created_id}')
        self.assertEqual(res_del.status_code, 200)

    # 4. AUDIT /api/weather & /api/clima ENDPOINTS
    def test_weather_and_clima_endpoints(self):
        # GET /api/weather
        res = self.client.get('/api/weather')
        self.assertEqual(res.status_code, 200)
        cities = res.get_json()
        self.assertIsInstance(cities, list)
        self.assertGreaterEqual(len(cities), 1)

        # GET /api/clima
        res_clima = self.client.get('/api/clima?city_index=0')
        self.assertEqual(res_clima.status_code, 200)
        clima_data = res_clima.get_json()
        self.assertIn("city", clima_data)
        self.assertIn("temp", clima_data)

    # 5. AUDIT /api/remove-bg ENDPOINT
    def test_remove_bg_multipart_endpoint(self):
        data = {
            'image': (io.BytesIO(self.test_img_bytes), 'bg_test.png')
        }
        res = self.client.post('/api/remove-bg', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertEqual(json_data.get("status"), "success")
        self.assertIn("engine", json_data)
        self.assertIn("cutout_base64", json_data)
        self.assertTrue(json_data["cutout_base64"].startswith("data:image/png;base64,"))

    def test_remove_bg_no_image_returns_400(self):
        res = self.client.post('/api/remove-bg')
        self.assertEqual(res.status_code, 400)

    # 6. AUDIT STYLING ENGINE HARMONIES
    def test_styling_innovations_harmonies(self):
        sample_clothes = [
            {"id": 1, "name": "Camiseta Azul Índigo", "category": "Top", "subcategory": "Camiseta", "color_primary": "Azul Índigo", "is_owned": 1},
            {"id": 2, "name": "Jeans Azul Marino", "category": "Bottom", "subcategory": "Jeans", "color_primary": "Azul Marino", "is_owned": 1},
            {"id": 3, "name": "Pantalón Amarillo Mostaza", "category": "Bottom", "subcategory": "Pantalón", "color_primary": "Amarillo Mostaza", "is_owned": 1},
            {"id": 4, "name": "Tenis Deportivos", "category": "Footwear", "subcategory": "Tenis", "color_primary": "Blanco Puro", "is_owned": 1},
            {"id": 5, "name": "Mocasines de Cuero", "category": "Footwear", "subcategory": "Mocasines", "color_primary": "Negro Carbón", "is_owned": 1},
            {"id": 6, "name": "Blazer Sastre SOTA", "category": "Outerwear", "subcategory": "Blazer", "color_primary": "Gris Marengo", "is_owned": 1},
        ]
        innovations = styling_engine.get_style_innovations(sample_clothes)
        self.assertIsInstance(innovations, list)
        self.assertGreaterEqual(len(innovations), 1)
        for inv in innovations:
            self.assertIn("name", inv)
            self.assertIn("justification", inv)

if __name__ == "__main__":
    unittest.main()
