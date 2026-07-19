with open("index.html", "r") as f:
    html = f.read()

if "unhandledrejection" not in html:
    html = html.replace("e.preventDefault();", "e.preventDefault();\n        }\n      });\n      window.addEventListener('unhandledrejection', function(e) {\n        if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver loop')) {\n          e.stopImmediatePropagation();\n          e.preventDefault();")
    with open("index.html", "w") as f:
        f.write(html)
    print("Patched index.html with unhandledrejection")
else:
    print("Already patched")
