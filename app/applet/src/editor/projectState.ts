export interface ProjectFunction {
  name: string;
  args: string;
  fileName: string;
}

class ProjectState {
  functions: ProjectFunction[] = [];
  files: {name: string, content: string}[] = [];

  update(files: {name: string, content: string}[]) {
    this.files = files;
    this.functions = [];
    const defRegex = /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s*\((.*?)\)/g;
    
    files.forEach(f => {
      let match;
      while ((match = defRegex.exec(f.content)) !== null) {
        this.functions.push({
          name: match[1],
          args: match[2],
          fileName: f.name
        });
      }
    });
  }
}

export const projectState = new ProjectState();
