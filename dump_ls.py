import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        ports = [3000, 3001]
        for port in ports:
            url = f"http://localhost:{port}"
            print(f"\n--- DUMPING {url} ---")
            try:
                page.goto(url, timeout=5000)
                page.wait_for_load_state('networkidle')
                
                gas_url = page.evaluate("() => localStorage.getItem('gas_url')")
                mg_users = page.evaluate("() => localStorage.getItem('mg_users')")
                
                print(f"[{port}] GAS_URL: {gas_url}")
                print(f"[{port}] MG_USERS: {mg_users}")
                
            except Exception as e:
                print(f"[{port}] FAILED: {e}")
        
        browser.close()

if __name__ == '__main__':
    run()
