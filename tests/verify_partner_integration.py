import os
import sys
import time
import sqlite3
import requests
import subprocess
import json

# Ensure sys.stdout handles UTF-8 correctly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'wardrobe.db')
APP_PATH = os.path.join(BASE_DIR, 'app.py')
URL_BASE = "http://127.0.0.1:5000"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_partner_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, category, subcategory, price, store_name 
        FROM clothes 
        WHERE store_name IN ('Arturo Calle', 'Gef', 'Punto Blanco', 'Tennis', 'Studio F', 'Ela', 'Zara', 'Matelsa', 'Koaj', 'Bosi')
        AND is_owned = 0
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_owned_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, category, subcategory FROM clothes WHERE is_owned = 1")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def run_verification():
    print("# Empirical Verification Report - Partner Links & Items")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")

    partner_items = get_partner_items()
    owned_items = get_owned_items()

    print(f"Found {len(partner_items)} partner items in database (is_owned = 0).")
    print(f"Found {len(owned_items)} owned items in database (is_owned = 1).\n")

    # Map owned items by category for combination test
    owned_by_cat = {}
    for item in owned_items:
        owned_by_cat[item['category']] = item['id']

    # Partner links from inventory
    inventory_path = os.path.join(BASE_DIR, 'medellin_retail_inventory.json')
    with open(inventory_path, 'r', encoding='utf-8') as f:
        inventory = json.load(f)

    # 1. Test /api/isa/quote scraper triggers
    print("## 1. Scraper & Chat Persona Verification (/api/isa/quote)")
    print("| Brand | Partner Link | Status | Scraped Brand | Scraped Price | Latency (ms) | Persona Sample |")
    print("| --- | --- | --- | --- | --- | --- | --- |")

    quote_latencies = []
    scraper_success = True

    for brand, items in inventory.items():
        if not items:
            continue
        item = items[0]
        link = item['link']
        
        # Call quote API with link in query
        url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Recomiendame la prenda de {link}"
        
        t0 = time.time()
        try:
            res = requests.get(url, timeout=15.0)
            latency = (time.time() - t0) * 1000
            quote_latencies.append(latency)
            
            if res.status_code == 200:
                data = res.json()
                scraped = data.get("scraped_item", {})
                scraped_brand = scraped.get("brand") or ""
                scraped_price = scraped.get("price")
                response_text = data.get("response", "")
                
                # Check correctness
                brand_match = (scraped_brand.lower().replace(" ", "") == brand.lower().replace(" ", ""))
                status_str = "✅ PASS" if brand_match else f"⚠️ BRAND MISMATCH ({scraped_brand} vs {brand})"
                if not brand_match:
                    scraper_success = False
                
                sample_text = response_text[:60].replace('\n', ' ') + "..."
                print(f"| {brand} | {link} | {status_str} | {scraped_brand} | {scraped_price} | {latency:.1f}ms | {sample_text} |")
            else:
                print(f"| {brand} | {link} | ❌ ERROR (HTTP {res.status_code}) | - | - | {latency:.1f}ms | - |")
                scraper_success = False
        except Exception as e:
            latency = (time.time() - t0) * 1000
            print(f"| {brand} | {link} | ❌ TIMEOUT/FAIL ({str(e)[:20]}) | - | - | {latency:.1f}ms | - |")
            scraper_success = False

    # 2. Test /api/recommend with partner items
    print("\n## 2. Recommendation Engine Scoring Verification (/api/recommend)")
    print("Testing combinations of owned clothes mixed with new partner boutique items:")
    print("| Brand | Item Name | Category | Query Params | Status | Fashion Score | Latency (ms) |")
    print("| --- | --- | --- | --- | --- | --- | --- |")

    recommend_latencies = []
    recommend_success = True

    for p_item in partner_items:
        brand = p_item['store_name']
        item_name = p_item['name']
        cat = p_item['category']
        item_id = p_item['id']

        # Formulate query params: mix with owned items
        params = []
        if cat == 'Top':
            params.append(f"top_id={item_id}")
            if 'Bottom' in owned_by_cat:
                params.append(f"bottom_id={owned_by_cat['Bottom']}")
            if 'Footwear' in owned_by_cat:
                params.append(f"footwear_id={owned_by_cat['Footwear']}")
        elif cat == 'Bottom':
            if 'Top' in owned_by_cat:
                params.append(f"top_id={owned_by_cat['Top']}")
            params.append(f"bottom_id={item_id}")
            if 'Footwear' in owned_by_cat:
                params.append(f"footwear_id={owned_by_cat['Footwear']}")
        elif cat == 'Footwear':
            if 'Top' in owned_by_cat:
                params.append(f"top_id={owned_by_cat['Top']}")
            if 'Bottom' in owned_by_cat:
                params.append(f"bottom_id={owned_by_cat['Bottom']}")
            params.append(f"footwear_id={item_id}")
        else:
            # Just send the boutique item alone
            params.append(f"boutique_id={item_id}")
            if 'Top' in owned_by_cat:
                params.append(f"top_id={owned_by_cat['Top']}")
            if 'Bottom' in owned_by_cat:
                params.append(f"bottom_id={owned_by_cat['Bottom']}")
            if 'Footwear' in owned_by_cat:
                params.append(f"footwear_id={owned_by_cat['Footwear']}")

        query_str = "&".join(params)
        url = f"{URL_BASE}/api/recommend?{query_str}&city_index=1&occasion=Casual"
        
        t0 = time.time()
        try:
            res = requests.get(url, timeout=15.0)
            latency = (time.time() - t0) * 1000
            recommend_latencies.append(latency)
            
            if res.status_code == 200:
                data = res.json()
                total_score = data.get("total_score")
                status_str = "✅ PASS" if total_score is not None else "⚠️ NO SCORE"
                if total_score is None:
                    recommend_success = False
                print(f"| {brand} | {item_name} | {cat} | `{query_str}` | {status_str} | {total_score}% | {latency:.1f}ms |")
            else:
                print(f"| {brand} | {item_name} | {cat} | `{query_str}` | ❌ ERROR (HTTP {res.status_code}) | - | {latency:.1f}ms |")
                recommend_success = False
        except Exception as e:
            latency = (time.time() - t0) * 1000
            print(f"| {brand} | {item_name} | {cat} | `{query_str}` | ❌ TIMEOUT/FAIL ({str(e)[:20]}) | - | {latency:.1f}ms |")
            recommend_success = False

    # 3. Verify Empty Closet Fallback
    print("\n## 3. Empty Closet Fallback Verification")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Backup owned statuses
    cursor.execute("SELECT id, is_owned FROM clothes")
    backup = cursor.fetchall()
    
    fallback_ok = False
    try:
        # Simulate empty closet by setting all is_owned to 0
        cursor.execute("UPDATE clothes SET is_owned = 0")
        conn.commit()
        
        # Query recommendation
        url = f"{URL_BASE}/api/recommend?city_index=1&occasion=Casual"
        t0 = time.time()
        res = requests.get(url, timeout=15.0)
        latency = (time.time() - t0) * 1000
        
        if res.status_code == 200:
            data = res.json()
            justification = data.get("justification", "").lower()
            # The justification should mention boutique or suggest acquiring items
            is_fallback = "boutique" in justification or "armario digital est\u00e1 vac\u00edo" in data.get("advice", "").lower()
            if is_fallback:
                print(f"- [PASS] Empty closet fallback works correctly. Latency: {latency:.1f}ms.")
                print(f"  - Advice: \"{data.get('advice')[:120]}...\"")
                fallback_ok = True
            else:
                print(f"- [FAIL] Did not fallback to boutique items correctly. Justification: {justification}")
        else:
            print(f"- [FAIL] Query failed with status {res.status_code}.")
    except Exception as e:
        print(f"- [FAIL] Exception during fallback test: {e}")
    finally:
        # Restore backup
        for row in backup:
            cursor.execute("UPDATE clothes SET is_owned = ? WHERE id = ?", (row[1], row[0]))
        conn.commit()
        conn.close()

    # Latency Summary Table
    print("\n## 4. Performance Summary")
    import statistics
    
    all_latencies = quote_latencies + recommend_latencies
    print("| Endpoint | Min Latency | Max Latency | Average Latency | p95 Latency |")
    print("| --- | --- | --- | --- | --- |")
    if quote_latencies:
        print(f"| /api/isa/quote | {min(quote_latencies):.1f}ms | {max(quote_latencies):.1f}ms | {statistics.mean(quote_latencies):.1f}ms | {statistics.quantiles(quote_latencies, n=20)[18] if len(quote_latencies)>=20 else max(quote_latencies):.1f}ms |")
    if recommend_latencies:
        print(f"| /api/recommend | {min(recommend_latencies):.1f}ms | {max(recommend_latencies):.1f}ms | {statistics.mean(recommend_latencies):.1f}ms | {statistics.quantiles(recommend_latencies, n=20)[18] if len(recommend_latencies)>=20 else max(recommend_latencies):.1f}ms |")
    if all_latencies:
        print(f"| Overall | {min(all_latencies):.1f}ms | {max(all_latencies):.1f}ms | {statistics.mean(all_latencies):.1f}ms | {statistics.quantiles(all_latencies, n=20)[18] if len(all_latencies)>=20 else max(all_latencies):.1f}ms |")

    # Final verdict
    print("\n## 5. Verdict")
    if scraper_success and recommend_success and fallback_ok:
        print("### STATUS: SUCCESS")
        print("All integration verification tests passed successfully without errors or timeouts.")
    else:
        print("### STATUS: FAILED")
        print(f"Some tests failed. Scraper OK: {scraper_success}, Recommend OK: {recommend_success}, Fallback OK: {fallback_ok}")

if __name__ == "__main__":
    # Start Flask app as subprocess if not already running
    # Let's check if port 5000 is open
    port_in_use = False
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 5000))
        s.close()
        port_in_use = True
        print("Flask server already running on port 5000.")
    except Exception:
        pass

    proc = None
    if not port_in_use:
        print("Starting Flask app in background...")
        proc = subprocess.Popen([sys.executable, APP_PATH], stdout=subprocess.DEVNULL, text=True, cwd=BASE_DIR)
        
        # Wait for server to become responsive
        startup_ok = False
        for i in range(10):
            try:
                res = requests.get(URL_BASE + "/", timeout=1.0)
                startup_ok = True
                print("Server responded successfully.")
                break
            except Exception:
                print("Waiting for server to spin up...")
                time.sleep(0.5)

        if not startup_ok:
            print("[Error] Could not connect to Flask server on port 5000.")
            proc.terminate()
            sys.exit(1)

    try:
        run_verification()
    finally:
        if proc:
            # Shut down Flask app cleanly
            print("Terminating Flask app...")
            proc.terminate()
            try:
                proc.wait(timeout=2.0)
                print("Flask app terminated.")
            except subprocess.TimeoutExpired:
                proc.kill()
                print("Flask app force killed.")
