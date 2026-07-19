export interface ProjectFunction {
  name: string;
  args: string;
  fileName: string;
  fileId: string;
  line: number;
}

class ProjectState {
  functions: ProjectFunction[] = [];
  files: {id: string, name: string, content: string}[] = [];

  update(files: {id: string, name: string, content: string}[]) {
    this.files = files;
    this.functions = [];
    const defRegex = /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s*\((.*?)\)/g;
    
    files.forEach(f => {
      let match;
      while ((match = defRegex.exec(f.content)) !== null) {
        const line = (f.content.substring(0, match.index).match(/\n/g) || []).length + 1;
        this.functions.push({
          name: match[1],
          args: match[2],
          fileName: f.name,
          fileId: f.id,
          line
        });
      }
    });
  }
}

export const projectState = new ProjectState();
