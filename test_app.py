import time
from playwright.sync_api import sync_playwright

def test_port(p, port):
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    
    # Capture console logs
    page.on("console", lambda msg: print(f"[{port}] CONSOLE {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"[{port}] PAGE ERROR: {err.message}"))

    url = f"http://localhost:{port}"
    print(f"\n--- Testing {url} ---")
    try:
        page.goto(url, timeout=10000)
        page.wait_for_load_state('networkidle')
        
        # Log settings
        gas_url = page.evaluate("() => localStorage.getItem('gas_url')")
        print(f"[{port}] GAS URL: {gas_url}")
        
        # Log localStorage
        storage = page.evaluate("() => localStorage.getItem('mg_users')")
        print(f"[{port}] FULL USERS: {storage}")
        
        # Check vishnu specifically
        import json
        try:
            users_list = json.loads(storage)
            vishnu = next((u for u in users_list if u['username'].lower() == 'vishnu'), None)
            if vishnu:
                print(f"[{port}] FOUND VISHNU: ID={vishnu.get('id')}, PWD={vishnu.get('password')[:20]}...")
            else:
                print(f"[{port}] VISHNU NOT IN LIST")
        except:
            print(f"[{port}] ERROR PARSING USERS")
        
        # Check if login page is there
        if page.locator('input#username').is_visible():
            print(f"[{port}] Login page visible. Testing vishnu / vishnu1...")
            page.fill('input#username', 'vishnu')
            page.fill('input#password', 'vishnu1')
            page.click('button[type="submit"]')
            
            # Wait a bit for login to process
            time.sleep(3)
            
            print(f"[{port}] URL after login attempt: {page.url}")
            if "login" not in page.url.lower():
                 print(f"[{port}] SUCCESS: Logged in as vishnu!")
            else:
                 print(f"[{port}] FAILURE: Still on login page.")
                 error_text = page.locator('[role="alert"]').text_content() if page.locator('[role="alert"]').is_visible() else "No error msg"
                 print(f"[{port}] Error displayed: {error_text}")
        else:
            print(f"[{port}] Login page NOT found (different app or already logged in?).")
            
        page.screenshot(path=f'debug_port_{port}.png', full_page=True)
    except Exception as e:
        print(f"[{port}] CRASH: {e}")
    finally:
        browser.close()

def run():
    with sync_playwright() as p:
        test_port(p, 3000)
        test_port(p, 3001)

if __name__ == '__main__':
    run()
