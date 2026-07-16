import os
import sys
import time
import subprocess
import sqlite3
import requests
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

def clear_chat_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history")
    conn.commit()
    conn.close()
    print("[Test Prep] Cleared chat_history table.")

def get_latest_chat_messages(limit=10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, sender, message, scraped_item_json FROM chat_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def run_tests():
    print("=" * 60)
    print("STARTING EMPIRICAL VERIFICATION OF /api/isa/quote ENDPOINT")
    print("=" * 60)

    # 1. Clear history before testing to have a clean state
    clear_chat_history()

    # 2. Get some valid closet and boutique IDs from db
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM clothes WHERE is_owned = 1 LIMIT 2")
    closet_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT id FROM clothes WHERE is_owned = 0 LIMIT 2")
    boutique_ids = [row[0] for row in cursor.fetchall()]
    conn.close()

    print(f"[Database State] Found closet_ids: {closet_ids}, boutique_ids: {boutique_ids}")
    
    if not closet_ids or not boutique_ids:
        print("[Error] Database is missing clothing items for testing.")
        return False

    c_id = closet_ids[0]
    b_id = boutique_ids[0]

    tests_failed = 0
    tests_run = 0

    def assert_test(name, condition, details=""):
        nonlocal tests_run, tests_failed
        tests_run += 1
        if condition:
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")
            tests_failed += 1

    # --- HAPPY PATHS ---
    print("\n--- Running Happy Path Tests ---")

    # Happy Path 1: Check all personalities without q or IDs (returns random personality quote)
    for personality in ['classy', 'diva', 'sarcastic', 'nervous']:
        print(f"\nRequesting personality: {personality}")
        url = f"{URL_BASE}/api/isa/quote?personality={personality}"
        t0 = time.time()
        res = requests.get(url)
        t_elapsed = time.time() - t0
        
        assert_test(f"Status 200 for {personality}", res.status_code == 200, f"Status: {res.status_code}")
        
        try:
            data = res.json()
            assert_test(f"JSON has 'response' key for {personality}", 'response' in data)
            assert_test(f"Quote string is not empty for {personality}", isinstance(data.get('response'), str) and len(data.get('response')) > 0)
            print(f"  Response: {data.get('response')} (Time: {t_elapsed:.3f}s)")
        except Exception as e:
            assert_test(f"JSON parsing for {personality}", False, str(e))

    # Happy Path 2: Personality + Query (q)
    print("\nRequesting personality: sarcastic with query q='¿Qué opinas de mi ropa?'")
    url = f"{URL_BASE}/api/isa/quote?personality=sarcastic&q=%C2%BFQu%C3%A9%20opinas%20de%20mi%20ropa%3F"
    res = requests.get(url)
    assert_test("Status 200 for personality + q", res.status_code == 200)
    data = res.json()
    quote = data.get('response', '')
    assert_test("Quote is customized with query prefix", quote.startswith('¿En serio preguntas por "¿Qué opinas de mi ropa?"?'))
    print(f"  Response: {quote}")

    # Verify SQLite database log for the message
    messages = get_latest_chat_messages(2)
    assert_test("Two messages logged to chat_history for query request", len(messages) == 2)
    # Note: query inserts user message first, then bot message. So in DESC order, bot message is first, user is second.
    if len(messages) >= 2:
        assert_test("User message logged correctly", messages[1]['sender'] == 'user' and messages[1]['message'] == '¿Qué opinas de mi ropa?')
        assert_test("Bot response logged correctly", messages[0]['sender'] == 'bot' and messages[0]['message'] == quote)

    # Happy Path 3: Personality + closet_id + boutique_id (fitting combination)
    print(f"\nRequesting personality: diva with closet_id={c_id} and boutique_id={b_id}")
    url = f"{URL_BASE}/api/isa/quote?personality=diva&closet_id={c_id}&boutique_id={b_id}"
    res = requests.get(url)
    assert_test("Status 200 for personality + closet_id + boutique_id", res.status_code == 200)
    data = res.json()
    quote = data.get('response', '')
    assert_test("Quote references boutique/closet details", "combinación" in quote.lower() or "espectacular" in quote.lower() or "escándalo" in quote.lower())
    print(f"  Response: {quote}")
    
    # Verify no log in database for non-q requests
    messages_after = get_latest_chat_messages(2)
    assert_test("No new message logged to database for non-q combination request", len(messages_after) == 2)

    # Happy Path 4: Adaptive URL Scraper Match inside q
    print("\nRequesting with URL in q to trigger scraper match")
    url = f"{URL_BASE}/api/isa/quote?personality=classy&q=Mira%20esta%20prenda%20https://www.zara.com/co/es/chaqueta-blazer-crepe-p02753023.html"
    res = requests.get(url)
    assert_test("Status 200 for URL query", res.status_code == 200)
    data = res.json()
    assert_test("URL response includes scraped_item details", 'scraped_item' in data)
    assert_test("URL response contains customized quote response", isinstance(data.get('response'), str))
    print(f"  Response: {data.get('response')}")
    print(f"  Scraped item: {json.dumps(data.get('scraped_item'), indent=2)}")

    messages = get_latest_chat_messages(2)
    assert_test("Bot message in database has scraped_item_json populated", messages[0]['scraped_item_json'] is not None)

    # --- ROBUSTNESS / NEGATIVE TESTING ---
    print("\n--- Running Robustness & Negative Tests ---")

    # Robustness 1: Invalid personality fallback
    print("\nRequesting invalid personality: ultra_diva")
    url = f"{URL_BASE}/api/isa/quote?personality=ultra_diva"
    res = requests.get(url)
    assert_test("Status 200 for invalid personality", res.status_code == 200)
    data = res.json()
    quote = data.get('response', '')
    # Should fallback to classy quotes
    assert_test("Falls back to a classy quote", quote in [
        "La sencillez es la clave de la verdadera elegancia, querido.",
        "Una silueta limpia nunca pasa de moda. Agrega textura antes que logos.",
        "Vístete como si fueras a encontrarte con tu peor enemigo hoy.",
        "La moda se compra, el estilo se posee. Busca armonía estructural."
    ])
    print(f"  Fallback response: {quote}")

    # Robustness 2: SQL Injection attempts in q
    print("\nExecuting SQL Injection test in q")
    sql_injection_payload = "test'; DROP TABLE chat_history;--"
    url = f"{URL_BASE}/api/isa/quote?personality=classy&q={requests.utils.quote(sql_injection_payload)}"
    res = requests.get(url)
    assert_test("SQL Injection request status 200", res.status_code == 200)
    
    # Check if table still exists and data was inserted literally
    try:
        messages = get_latest_chat_messages(2)
        assert_test("User message logged exactly as sent (SQL Injection sanitized)", messages[1]['message'] == sql_injection_payload)
        # Ensure chat_history still works (table wasn't dropped)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM chat_history")
        count = cursor.fetchone()[0]
        conn.close()
        assert_test("Database table 'chat_history' was NOT dropped", count > 0)
        print(f"  Current message count in database: {count}")
    except Exception as e:
        assert_test("SQL Injection check passed", False, f"Failed database verification: {e}")

    # Robustness 3: Very long query string
    print("\nExecuting very long string test in q (10,000 characters)")
    long_string = "A" * 10000
    url = f"{URL_BASE}/api/isa/quote?personality=classy&q={long_string}"
    t0 = time.time()
    res = requests.get(url)
    t_elapsed = time.time() - t0
    assert_test("Long string status 200", res.status_code == 200)
    assert_test("Long string processed within 1.0s", t_elapsed < 1.0, f"Took {t_elapsed:.3f}s")
    
    # Check if logged in database
    messages = get_latest_chat_messages(2)
    assert_test("Long string logged correctly in database", messages[1]['message'] == long_string)

    # Robustness 4: Missing personality parameter (should default to classy)
    print("\nExecuting request with missing personality parameter")
    url = f"{URL_BASE}/api/isa/quote?q=test_missing"
    res = requests.get(url)
    assert_test("Missing personality status 200", res.status_code == 200)
    data = res.json()
    quote = data.get('response', '')
    assert_test("Missing personality prefix is classy", quote.startswith('Sobre "test_missing":'))
    print(f"  Response: {quote}")

    # Robustness 5: Invalid ID types (should not crash server and return 500 cleanly)
    print("\nExecuting request with invalid non-numeric ID (closet_id=abc)")
    url = f"{URL_BASE}/api/isa/quote?closet_id=abc&boutique_id=12"
    res = requests.get(url)
    assert_test("Status 500 for invalid ID type", res.status_code == 500)
    assert_test("Returns clean JSON error error", 'error' in res.json())
    print(f"  Response JSON: {res.json()}")

    # Robustness 6: Non-existent IDs
    print("\nExecuting request with non-existent closet_id=999999")
    url = f"{URL_BASE}/api/isa/quote?closet_id=999999&boutique_id=12"
    res = requests.get(url)
    assert_test("Status 200 for non-existent closet_id", res.status_code == 200)
    data = res.json()
    # If closet_item is None, it should fall back to random quote for the personality
    quote = data.get('response', '')
    assert_test("Falls back to random classy quote", quote in [
        "La sencillez es la clave de la verdadera elegancia, querido.",
        "Una silueta limpia nunca pasa de moda. Agrega textura antes que logos.",
        "Vístete como si fueras a encontrarte con tu peor enemigo hoy.",
        "La moda se compra, el estilo se posee. Busca armonía estructural."
    ])
    print(f"  Response: {quote}")

    print("\n" + "=" * 60)
    print(f"TEST RUN COMPLETED. Total: {tests_run}, Failed: {tests_failed}")
    print("=" * 60)
    
    return tests_failed == 0

if __name__ == "__main__":
    # Start Flask app as subprocess
    print("Starting Flask app in background...")
    proc = subprocess.Popen([sys.executable, APP_PATH], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True, cwd=BASE_DIR)
    
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
        success = run_tests()
    finally:
        # Shut down Flask app cleanly
        print("Terminating Flask app...")
        proc.terminate()
        try:
            proc.wait(timeout=2.0)
            print("Flask app terminated.")
        except subprocess.TimeoutExpired:
            proc.kill()
            print("Flask app force killed.")
            
    if not success:
        sys.exit(1)
