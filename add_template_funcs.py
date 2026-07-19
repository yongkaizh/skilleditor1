import re
with open("src/components/TemplateGallery.tsx", "r") as f:
    text = f.read()

funcs = re.findall(r'\b([a-zA-Z_]\w*)\s*\(', text)

with open("src/data/manual.txt", "r") as f:
    existing = f.read()

count = 0
with open("src/data/manual.txt", "a") as f:
    for func in set(funcs):
        if func in ['let', 'if', 'foreach', 'list', 'makeList', 'printf', 'fprintf', 'buildString', 'nth', 'close', 'outfile', 'procedure', 'setof', 'xCoord', 'yCoord', 'lowerLeft', 'upperRight']:
            continue
        if f"@function {func}\n" in existing:
            continue
        
        f.write(f"\n@function {func}\n")
        f.write(f"@usage {func}(...)\n")
        f.write(f"@description Auto-detected function: {func}\n")
        count += 1
print(f"Added {count} functions to manual.txt")
