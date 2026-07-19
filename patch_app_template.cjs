const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { v4 as uuidv4 } from 'uuid';")) {
  code = code.replace("import { saveAs } from 'file-saver';", "import { saveAs } from 'file-saver';\nimport { v4 as uuidv4 } from 'uuid';");
}

const oldSelect = `  const handleSelectTemplate = (text: string) => {
    setContent(text);
  };`;

const newSelect = `  const handleSelectTemplate = (text: string) => {
    let newNum = files.length + 1;
    let name = \`template\${newNum}.il\`;
    while (files.some(f => f.name === name)) {
      newNum++;
      name = \`template\${newNum}.il\`;
    }
    const newFile = { id: uuidv4(), name, content: text };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/App.tsx', code);
