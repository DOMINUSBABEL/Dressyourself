import os
import json
import unittest
import requests
import subprocess
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, 'medellin_retail_inventory.json')
URL_BASE = "http://127.0.0.1:5000"

class TestRetailIntegration(unittest.TestCase):
    """
    Test suite to validate the schema of medellin_retail_inventory.json 
    and verify integration with the Flask API endpoints.
    """
    
    @classmethod
    def setUpClass(cls):
        # Start Flask app as subprocess
        cls.proc = subprocess.Popen(
            [sys.executable, os.path.join(BASE_DIR, 'app.py')],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            text=True,
            cwd=BASE_DIR
        )
        # Wait for server to become responsive
        startup_ok = False
        for _ in range(10):
            try:
                res = requests.get(URL_BASE + "/", timeout=1.0)
                if res.status_code == 200:
                    startup_ok = True
                    break
            except Exception:
                time.sleep(0.5)
        if not startup_ok:
            cls.proc.terminate()
            raise RuntimeError("Could not connect to Flask server on port 5000.")

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=2.0)
        except subprocess.TimeoutExpired:
            cls.proc.kill()

    def test_dataset_schema(self):
        """1. Assert that the local JSON file exists, is valid JSON, and matches expected schemas."""
        self.assertTrue(os.path.exists(DATASET_PATH), f"Dataset missing: {DATASET_PATH}")
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.assertIsInstance(data, dict, "Root of dataset must be a dictionary mapping brands to items")
        for brand, items in data.items():
            self.assertIsInstance(items, list, f"Brand {brand} must map to a list of items")
            for idx, item in enumerate(items):
                prefix = f"Brand {brand} item #{idx}"
                for key in ["id", "name", "brand", "link", "price", "image", "retailer"]:
                    self.assertIn(key, item, f"{prefix} missing key: '{key}'")
                
                self.assertIsInstance(item["price"], (int, float), f"{prefix} price must be numeric")
                self.assertGreater(item["price"], 0, f"{prefix} price must be positive")
                self.assertTrue(item["link"].startswith("http"), f"{prefix} link must be valid URL")
                self.assertTrue(item["image"].startswith("http"), f"{prefix} image must be valid URL")

    def test_recommendation_fallback_to_retail_items(self):
        """2. Check if recommendation engine falls back gracefully to boutique items if database is clean."""
        # Connect to DB and temporarily set all is_owned = 0 to simulate empty closet
        import sqlite3
        db_path = os.path.join(BASE_DIR, 'wardrobe.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Backup original is_owned values
        cursor.execute("SELECT id, is_owned FROM clothes")
        backup = cursor.fetchall()
        
        try:
            # Set all is_owned = 0
            cursor.execute("UPDATE clothes SET is_owned = 0")
            conn.commit()
            
            # Request recommendation
            url = f"{URL_BASE}/api/recommend?city_index=1&occasion=Casual"
            res = requests.get(url)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            
            # Verify that recommended outfit includes keys
            self.assertIn("top", data)
            self.assertIn("bottom", data)
            self.assertIn("footwear", data)
            self.assertIn("justification", data)
            
            # If fallback occurs, justification mentions boutique or a specific brand
            justification = data.get("justification", "").lower()
            self.assertTrue(
                "boutique" in justification or "zara" in justification or "dior" in justification or "chanel" in justification,
                f"Justification did not mention boutique/scraped items fallback: {justification}"
            )
        finally:
            # Restore original is_owned values
            for row in backup:
                cursor.execute("UPDATE clothes SET is_owned = ? WHERE id = ?", (row[1], row[0]))
            conn.commit()
            conn.close()


    def test_isa_url_scraper_mapping(self):
        """3. Assert that hitting /api/isa/quote with a partner retailer domain triggers adaptive scraper."""
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        # Select first available link in dataset
        test_url = None
        for brand, items in dataset.items():
            if items and items[0].get("link"):
                test_url = items[0]["link"]
                break
        
        if not test_url:
            self.skipTest("No links found in medellin_retail_inventory.json to test scraping.")
            
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Recomiendame {test_url}"
        res = requests.get(url)
        self.assertEqual(res.status_code, 200)
        
        data = res.json()
        self.assertIn("response", data)
        self.assertIn("scraped_item", data)
        
        scraped = data["scraped_item"]
        self.assertIn("brand", scraped)
        self.assertIn("price", scraped)
        self.assertIn("source_url", scraped)
        self.assertEqual(scraped["source_url"], test_url)

if __name__ == "__main__":
    unittest.main()
