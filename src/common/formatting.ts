  import path from 'path'
  import * as os from 'os';
  
  export default class Formatting {
  
  public static normalizePath(pathString: string): string {
    if (!pathString) return pathString;
    //expand ~ to whole path
    const expanded = pathString.startsWith('~') ? path.join(os.homedir(), pathString.slice(1)) : pathString;
    //expand relative path
    const resolved = path.resolve(expanded);
    //replace separators with '/'
    return resolved.split(path.sep).join(path.posix.sep);
  }
}