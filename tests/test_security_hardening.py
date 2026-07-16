import os
import sys
import unittest
import requests
import subprocess
import time
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_BASE = "http://127.0.0.1:5000"

class TestSecurityHardening(unittest.TestCase):
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
        for _ in range(15):
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

    def test_ssrf_mitigation_loopback(self):
        """Verify that loopback / localhost queries are blocked with a 400 Bad Request."""
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Check http://localhost:5000/"
        res = requests.get(url)
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.json())
        self.assertIn("no es segura", res.json()["error"])

    def test_ssrf_mitigation_private_ip(self):
        """Verify that private IP ranges are blocked with a 400 Bad Request."""
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Check http://192.168.1.1/"
        res = requests.get(url)
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.json())
        self.assertIn("no es segura", res.json()["error"])

    def test_ssrf_mitigation_link_local(self):
        """Verify that link-local IPs are blocked with a 400 Bad Request."""
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Check http://169.254.169.254/"
        res = requests.get(url)
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.json())
        self.assertIn("no es segura", res.json()["error"])

    def test_ssrf_mitigation_public_ip_allowed(self):
        """Verify that a public URL is allowed to proceed (returns 200 on fallback/offline logic)."""
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Check https://www.zara.com/co/es/chaqueta-blazer-crepe-p02753023.html"
        res = requests.get(url)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("response", data)
        self.assertIn("scraped_item", data)

    def test_path_traversal_scan_endpoint(self):
        """Verify that uploading a file to /api/scan with directory traversal characters is sanitized."""
        from PIL import Image
        img = Image.new('RGB', (10, 10), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        # Upload using traversal name
        files = {'image': ('../../traversal_test.png', img_bytes, 'image/png')}
        res = requests.post(f"{URL_BASE}/api/scan", files=files)
        # Should succeed because the name is sanitized and scanned safely
        self.assertEqual(res.status_code, 200)
        
        # Verify no file traversal_test.png exists in parent directory
        parent_traversal_file = os.path.join(BASE_DIR, 'traversal_test.png')
        self.assertFalse(os.path.exists(parent_traversal_file))

    def test_path_traversal_closet_scan_endpoint(self):
        """Verify that uploading a file to /api/closet/scan with directory traversal characters is sanitized."""
        from PIL import Image
        img = Image.new('RGB', (10, 10), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        files = {'image': ('../../traversal_test_closet.png', img_bytes, 'image/png')}
        res = requests.post(f"{URL_BASE}/api/closet/scan", files=files)
        self.assertEqual(res.status_code, 200)
        
        parent_traversal_file = os.path.join(BASE_DIR, 'traversal_test_closet.png')
        self.assertFalse(os.path.exists(parent_traversal_file))

if __name__ == '__main__':
    unittest.main()
