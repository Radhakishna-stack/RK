import json
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3001")
        page.wait_for_load_state("networkidle")
        
        # Get data
        users = page.evaluate("() => localStorage.getItem('mg_users')")
        gas_url = page.evaluate("() => localStorage.getItem('gas_url')")
        
        with open("diag_results.json", "w") as f:
            json.dump({"mg_users": users, "gas_url": gas_url}, f)
            
        browser.close()

if __name__ == "__main__":
    run()
