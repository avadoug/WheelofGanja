import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const serverDir = path.join(root, "dist", "server");
await mkdir(serverDir, { recursive: true });
await copyFile(path.join(root, "sites-worker", "index.js"), path.join(serverDir, "index.js"));
console.log("Sites static-asset worker packaged.");
