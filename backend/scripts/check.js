/**
 * Syntax-checks every source file in the monorepo.
 *   npm run check
 */
import { execFileSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL("..", import.meta.url));

function* jsFiles(dir) {
    for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) yield* jsFiles(full);
        else if (entry.endsWith(".js")) yield full;
    }
}

let checked = 0;
let failed = 0;

for (const dir of ["packages", "services", "scripts"]) {
    for (const file of jsFiles(join(root, dir))) {
        try {
            execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
            checked++;
        } catch (err) {
            failed++;
            console.error(`FAIL ${relative(root, file)}`);
            console.error(err.stderr?.toString() || err.message);
        }
    }
}

console.log(`${checked} file(s) OK${failed ? `, ${failed} failed` : ""}`);
process.exit(failed ? 1 : 0);
