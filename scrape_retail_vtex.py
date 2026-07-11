import sys
import json
import urllib.request
import urllib.parse
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

# Retailers config
# Many Colombian retailers use VTEX. We can target their public search APIs.
VTEX_RETAILERS = {
    "Arturo Calle": "https://www.arturocalle.com/api/catalog_system/pub/products/search",
    "Gef": "https://www.gef.co/api/catalog_system/pub/products/search",
    "Punto Blanco": "https://www.puntoblanco.co/api/catalog_system/pub/products/search",
    "Tennis": "https://www.tennis.co/api/catalog_system/pub/products/search",
    "Studio F": "https://www.studiof.com.co/api/catalog_system/pub/products/search",
    "Ela": "https://www.ela.com.co/api/catalog_system/pub/products/search"
}

# Non-VTEX retailers require custom parsing or mockup representation for offline/agent simulations
NON_VTEX_RETAILERS = [
    "Zara", "Matelsa", "Koaj", "Bosi"
]

def query_vtex(retailer, url, query_term):
    query_url = f"{url}?ft={urllib.parse.quote(query_term)}&_from=0&_to=5"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
    
    req = urllib.request.Request(query_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                products = []
                for item in data:
                    # Parse essential product attributes
                    products.append({
                        "id": item.get("productId"),
                        "name": item.get("productName"),
                        "brand": item.get("brand", retailer),
                        "link": item.get("link"),
                        "price": item.get("items", [{}])[0].get("sellers", [{}])[0].get("commertialOffer", {}).get("Price"),
                        "image": item.get("items", [{}])[0].get("images", [{}])[0].get("imageUrl"),
                        "retailer": retailer
                    })
                return products
    except Exception as e:
        # Silently fail or log for simulation fallback
        return []
    return []

def main():
    query_term = "camisa"
    if len(sys.argv) > 1:
        query_term = sys.argv[1]
        
    print(f"[*] Starting agent search for '{query_term}' in Medellín top retailers...")
    
    results = {}
    
    # 1. Scrape VTEX retailers
    for name, url in VTEX_RETAILERS.items():
        print(f"[-] Querying {name} API...")
        products = query_vtex(name, url, query_term)
        if products:
            results[name] = products
            print(f"    [+] Found {len(products)} products in {name}")
        else:
            # Fallback mockup to ensure inventory simulation works for agent training
            results[name] = [
                {
                    "id": f"mock-{name.lower()}-1",
                    "name": f"{query_term.capitalize()} Premium {name}",
                    "brand": name,
                    "link": f"https://www.{name.lower().replace(' ', '')}.com.co",
                    "price": 89900,
                    "image": "https://assets.dressly.world/uploads/2cbcde2f80a6d8309928b5ccc40822df.webp",
                    "retailer": name
                }
            ]
            print(f"    [!] Fallback to local simulation for {name}")
            
    # 2. Mockup/simulation for Non-VTEX retailers
    for name in NON_VTEX_RETAILERS:
        results[name] = [
            {
                "id": f"mock-{name.lower()}-1",
                "name": f"{query_term.capitalize()} Vanguardist {name}",
                "brand": name,
                "link": f"https://www.{name.lower()}.com",
                "price": 129000 if name == "Zara" else 69900,
                "image": "https://assets.dressly.world/uploads/7e926a1b40ee206734b9ccf0cbe9b980.webp",
                "retailer": name
            }
        ]
        print(f"[-] Simulated inventory search for non-VTEX retailer: {name}")

    # Output results to json file
    output_path = r"C:\Users\jegom\DressYourself-Web\medellin_retail_inventory.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"[*] Search complete. Compiled database saved to {output_path}!")

if __name__ == "__main__":
    main()
