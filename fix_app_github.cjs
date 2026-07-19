const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace Github icon import with Cloud
code = code.replace(/import \{ Play(.*?)Github \} from "lucide-react";/, 'import { Play$1Cloud } from "lucide-react";');
code = code.replace(/<Github size=\{16\} \/>/g, '<Cloud size={16} />');

// add GitHubSyncModal rendering
if (!code.includes('<GitHubSyncModal')) {
  code = code.replace(
    '<TemplateGallery',
    `<TemplateGallery \n      />\n      <GitHubSyncModal\n        isOpen={isGitHubModalOpen}\n        onClose={() => setIsGitHubModalOpen(false)}\n        files={files}\n        onFilesChange={setFiles}\n      />\n      <TemplateGallery`
  );
  
  // Actually wait, I'll just put it right before </main> or something
}

fs.writeFileSync('src/App.tsx', code);
