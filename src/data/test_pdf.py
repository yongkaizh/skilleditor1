import fitz
doc = fitz.open("skill_manual.pdf")
with open("sample.txt", "w") as f:
    for i in range(5, 15):
        f.write(doc[i].get_text())
