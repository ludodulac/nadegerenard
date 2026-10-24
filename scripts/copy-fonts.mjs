import {copyFile,mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const repo=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const from=resolve(repo,"node_modules","@fontsource","oswald");
const to=resolve(repo,"public","fonts");
await mkdir(to,{recursive:true});
await copyFile(resolve(from,"files","oswald-latin-600-normal.woff2"),resolve(to,"oswald-latin-600-normal.woff2"));
await copyFile(resolve(from,"LICENSE"),resolve(to,"OFL.txt"));
console.log("Police Oswald SemiBold (locale) prête.");
