import asyncio
import json
import time
from playwright.async_api import async_playwright

async def run_browser_audit():
    print("=== STARTING PLAYWRIGHT BROWSER AUDIT ===")
    
    console_logs = []
    network_errors = []
    api_failures = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        # Listen to console
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text,
            "location": msg.location
        }))
        
        # Listen to failed network requests
        page.on("requestfailed", lambda req: network_errors.append({
            "url": req.url,
            "method": req.method,
            "failure": req.failure
        }))
        
        # Listen to bad responses
        page.on("response", lambda res: api_failures.append({
            "url": res.url,
            "status": res.status,
            "status_text": res.status_text
        }) if res.status >= 400 else None)
        
        print("1. Navigating to http://127.0.0.1:5173/...")
        await page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # Check login or world landing
        print("Page title:", await page.title())
        
        # If login page, log in
        login_btn = await page.query_selector("button:has-text('Enter Civilisation'), button:has-text('Sign In'), button:has-text('Login')")
        if login_btn:
            print("Login button found. Attempting admin login...")
            user_input = await page.query_selector("input[type='text'], input[placeholder*='sername'], input[placeholder*='User']")
            pass_input = await page.query_selector("input[type='password']")
            if user_input and pass_input:
                await user_input.fill("admin")
                await pass_input.fill("AdminPassword123!")
                await login_btn.click()
                await asyncio.sleep(2)
                
        # Now let's test clicking through navigation tabs
        nav_items = [
            "Causal Insights",
            "Council Chamber",
            "Policy Laboratory",
            "Technology",
            "Economy",
            "Population",
            "Infrastructure",
            "Missions",
            "Admin Console"
        ]
        
        feature_test_results = []
        
        for nav in nav_items:
            print(f"Testing nav item: {nav}...")
            el = await page.query_selector(f"button:has-text('{nav}'), a:has-text('{nav}'), span:has-text('{nav}')")
            if el:
                try:
                    await el.click()
                    await asyncio.sleep(1.5)
                    feature_test_results.append({
                        "feature": f"Nav: {nav}",
                        "status": "mounted",
                        "url": page.url
                    })
                except Exception as e:
                    feature_test_results.append({
                        "feature": f"Nav: {nav}",
                        "status": "error",
                        "error": str(e)
                    })
            else:
                feature_test_results.append({
                    "feature": f"Nav: {nav}",
                    "status": "element_not_found"
                })
                
        # Try to open modals: Budget, Info Views, etc.
        budget_btn = await page.query_selector("button:has-text('Budget'), button[title*='Budget']")
        if budget_btn:
            print("Testing Budget Modal...")
            await budget_btn.click()
            await asyncio.sleep(1)
            # Try issuing bond
            bond_btn = await page.query_selector("button:has-text('Issue Municipal Bond'), button:has-text('Issue Bond')")
            if bond_btn:
                await bond_btn.click()
                await asyncio.sleep(0.5)
            # Close modal
            close_btn = await page.query_selector("button[title*='Close'], button:has-text('Close')")
            if close_btn:
                await close_btn.click()
                
        await browser.close()
        
    audit_report = {
        "console_errors": [c for c in console_logs if c["type"] in ("error", "warning")],
        "all_console_logs": console_logs,
        "network_errors": network_errors,
        "api_failures": api_failures,
        "feature_test_results": feature_test_results
    }
    
    with open("/tmp/browser_audit_results.json", "w") as f:
        json.dump(audit_report, f, indent=2)
        
    print("\n--- BROWSER AUDIT SUMMARY ---")
    print(f"Total console messages: {len(console_logs)} (Errors/Warnings: {len(audit_report['console_errors'])})")
    print(f"Total failed network requests: {len(network_errors)}")
    print(f"Total HTTP >= 400 responses: {len(api_failures)}")
    if api_failures:
        print("Sample API failures:")
        for af in api_failures[:5]:
            print(f"  {af['status']} {af['status_text']} - {af['url']}")
    if audit_report['console_errors']:
        print("Sample Console errors/warnings:")
        for ce in audit_report['console_errors'][:5]:
            print(f"  [{ce['type']}] {ce['text']}")

if __name__ == "__main__":
    asyncio.run(run_browser_audit())
