with open("index.html", "r") as f:
    html = f.read()

script = """    <script>
      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('ResizeObserver loop')) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      });
    </script>
"""

if "<script>" not in html:
    html = html.replace("</title>", "</title>\n" + script)
    with open("index.html", "w") as f:
        f.write(html)
    print("Patched index.html")
else:
    print("Already patched")
