from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Navigating to http://localhost:3001...")
        page.goto('http://localhost:3001')
        
        # Wait for the app to load and the loading spinner to disappear
        page.wait_for_load_state('networkidle')
        
        print("Checking if login page is loaded...")
        page.wait_for_selector('input#username')
        page.wait_for_selector('input#password')
        
        print("Filling in credentials...")
        page.fill('input#username', 'admin')
        page.fill('input#password', 'admin123')
        
        print("Clicking login...")
        page.click('button[type="submit"]')
        
        # Wait for navigation / network idle which means dashboard is loaded
        page.wait_for_load_state('networkidle')
        
        print("Checking if dashboard is loaded...")
        page.wait_for_selector('text="MOTO GEAR"')
        
        # Take a screenshot.
        page.screenshot(path='dashboard_success.png', full_page=True)
        print("Screenshot saved to dashboard_success.png")
        
        # We can also check url
        print(f"Current URL after login: {page.url}")
        
        browser.close()

if __name__ == '__main__':
    run()
