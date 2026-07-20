import { extractDefinedFunctions } from "./utils";

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
    
    files.forEach(f => {
      const extracted = extractDefinedFunctions(f.content);
      extracted.forEach(fn => {
        this.functions.push({
          name: fn.name,
          args: fn.args,
          fileName: f.name,
          fileId: f.id,
          line: fn.line
        });
      });
    });
  }
}

export const projectState = new ProjectState();
