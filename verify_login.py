import json
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3001")
        page.wait_for_load_state("networkidle")
        
        print("Attempting login via UI...")
        page.fill('input#username', 'vishnu')
        page.fill('input#password', 'vishnu1')
        page.click('button[type="submit"]')
        
        page.wait_for_timeout(3000)
        
        current_url = page.url
        error_msg = ""
        if page.locator('[role="alert"]').is_visible():
            error_msg = page.locator('[role="alert"]').text_content()
            
        # Also check localStorage contents specifically for vishnu and admin
        users_raw = page.evaluate("() => localStorage.getItem('mg_users')")
        users = json.loads(users_raw) if users_raw else []
        
        results = {
            "url_after_login": current_url,
            "error_msg": error_msg,
            "success": "login" not in current_url.lower(),
            "users_count": len(users),
            "vishnu_record": next((u for u in users if u['username'].lower() == 'vishnu'), None)
        }
        
        with open("login_verification.json", "w") as f:
            json.dump(results, f, indent=2)
            
        browser.close()

if __name__ == "__main__":
    run()
