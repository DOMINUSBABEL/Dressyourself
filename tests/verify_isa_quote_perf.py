import os
import sys
import time
import sqlite3
import requests
import statistics
import subprocess

# Configure standard output encoding for Windows terminal
sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'wardrobe.db')
APP_PATH = os.path.join(BASE_DIR, 'app.py')
URL_BASE = "http://127.0.0.1:5000"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_latest_chat_messages(limit=10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, sender, message, scraped_item_json FROM chat_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_chat_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history")
    conn.commit()
    conn.close()

def run_performance_and_robustness_evaluation():
    print("# Empirical Performance & Robustness Evaluation Results")
    
    # 1. Clear database history first
    clear_chat_history()
    
    # 2. Performance Benchmark
    print("\n## 1. Latency Benchmark (100 sequential requests to /api/isa/quote)")
    latencies = []
    success_count = 0
    personalities = ['classy', 'diva', 'sarcastic', 'nervous']
    
    for i in range(100):
        pers = personalities[i % len(personalities)]
        q_param = f"Pregunta de prueba {i}"
        url = f"{URL_BASE}/api/isa/quote?personality={pers}&q={requests.utils.quote(q_param)}"
        
        t0 = time.time()
        try:
            res = requests.get(url, timeout=2.0)
            t_elapsed = time.time() - t0
            latencies.append(t_elapsed * 1000) # in ms
            if res.status_code == 200:
                success_count += 1
        except Exception as e:
            print(f"Request {i} failed: {e}")
            
    avg_latency = statistics.mean(latencies) if latencies else 0
    p50_latency = statistics.median(latencies) if latencies else 0
    p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else 0
    p99_latency = statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else 0
    max_latency = max(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0
    
    print("| Metric | Value |")
    print("| --- | --- |")
    print(f"| Total Requests | {len(latencies)} |")
    print(f"| Successful Requests (200 OK) | {success_count} |")
    print(f"| Min Latency | {min_latency:.2f} ms |")
    print(f"| Average Latency | {avg_latency:.2f} ms |")
    print(f"| Median (p50) Latency | {p50_latency:.2f} ms |")
    print(f"| p95 Latency | {p95_latency:.2f} ms |")
    print(f"| p99 Latency | {p99_latency:.2f} ms |")
    print(f"| Max Latency | {max_latency:.2f} ms |")
    
    # 3. Database Logging Verification
    print("\n## 2. SQLite Database Logging Verification")
    messages = get_latest_chat_messages(200)
    print(f"- Total rows found in `chat_history`: {len(messages)}")
    
    # We sent 100 requests with q, each should log 2 messages (1 user, 1 bot) = 200 messages total
    expected_rows = len(latencies) * 2
    if len(messages) == expected_rows:
        print(f"- [PASS] Database logged exactly {expected_rows} rows.")
    else:
        print(f"- [FAIL] Database contains {len(messages)} rows, but expected {expected_rows}.")
        
    # Check structure of the last logged pair
    if len(messages) >= 2:
        last_bot = messages[0]  # ordering is DESC, so bot is index 0
        last_user = messages[1] # user is index 1
        
        print(f"- Last logged User message: ID={last_user['id']}, sender='{last_user['sender']}', message='{last_user['message']}'")
        print(f"- Last logged Bot message: ID={last_bot['id']}, sender='{last_bot['sender']}', message='{last_bot['message']}'")
        
        user_correct = (last_user['sender'] == 'user' and last_user['message'] == "Pregunta de prueba 99")
        bot_correct = (last_bot['sender'] == 'bot' and last_bot['message'].startswith('¡Ay no sé! Sobre "Pregunta de prueba 99"...'))
        
        if user_correct and bot_correct:
            print("- [PASS] Messages are logged correctly and contain matching content.")
        else:
            print(f"- [FAIL] Messages or sender roles do not match expected shapes. Bot message: {last_bot['message']}")
            
    # Verify no log in database for non-q requests
    before_count = len(get_latest_chat_messages(500))
    requests.get(f"{URL_BASE}/api/isa/quote?personality=classy")
    after_count = len(get_latest_chat_messages(500))
    if before_count == after_count:
        print("- [PASS] Request without query (q) was NOT logged to database.")
    else:
        print(f"- [FAIL] Request without query was logged (Count went from {before_count} to {after_count}).")

    # 4. Robustness Edge-case checks
    print("\n## 3. Robustness & Negative Test Cases")
    
    # Non-existent IDs fallback
    url_non_existent = f"{URL_BASE}/api/isa/quote?closet_id=999999&boutique_id=999999"
    res_non_existent = requests.get(url_non_existent)
    print(f"- Non-existent closet_id / boutique_id: Status={res_non_existent.status_code}")
    if res_non_existent.status_code == 200:
        data = res_non_existent.json()
        print(f"  - [PASS] Fell back gracefully. Response: '{data.get('response')}'")
    else:
        print("  - [FAIL] Non-existent IDs caused error status.")
        
    # Missing personality default
    res_missing_pers = requests.get(f"{URL_BASE}/api/isa/quote?q=hola")
    data_missing = res_missing_pers.json()
    if res_missing_pers.status_code == 200 and data_missing.get('response', '').startswith('Sobre "hola":'):
        print(f"- [PASS] Missing personality parameter defaults to 'classy'. Response: '{data_missing.get('response')}'")
    else:
        print(f"- [FAIL] Missing personality default check failed. Response: '{data_missing}'")

    # Invalid non-numeric ID type (closet_id=abc)
    res_invalid_id = requests.get(f"{URL_BASE}/api/isa/quote?closet_id=abc&boutique_id=12")
    print(f"- Invalid non-numeric ID input: Status={res_invalid_id.status_code}")
    if res_invalid_id.status_code == 500:
        print(f"  - [INFO] Returned status 500 as expected for ValueError. Response: {res_invalid_id.json()}")
    else:
        print(f"  - [FAIL] Expected 500 for bad ID type, got {res_invalid_id.status_code}")

if __name__ == "__main__":
    # Start Flask app as subprocess
    proc = subprocess.Popen([sys.executable, APP_PATH], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True, cwd=BASE_DIR)
    
    # Wait for server to become responsive
    startup_ok = False
    for i in range(10):
        try:
            res = requests.get(URL_BASE + "/", timeout=1.0)
            startup_ok = True
            break
        except Exception:
            time.sleep(0.5)

    if not startup_ok:
        print("[Error] Could not connect to Flask server.")
        proc.terminate()
        sys.exit(1)

    try:
        run_performance_and_robustness_evaluation()
    finally:
        # Shut down Flask app cleanly
        proc.terminate()
        proc.wait()
