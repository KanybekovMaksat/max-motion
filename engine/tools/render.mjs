// Render the finished edit, and optionally the wrapper reels around it.
// usage: npm run render -- <slug> [--wrap showcase,chat,prompt | --wrap all] [--still 2.5]
// Wrapper texts live in public/<slug>/wrap.json: shared fields at the top level,
// per-wrapper ones under "wrappers": { "showcase": {…}, "chat": {…}, "prompt": {…} }.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const slug = argv[0];
if (!slug) {
  console.error("usage: npm run render -- <slug> [--wrap showcase,chat,prompt|all] [--still <sec>]");
  process.exit(1);
}
const rem = (args) => execFileSync("npx", ["remotion", ...args], { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
const props = JSON.stringify({ slug });
fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });

if (argv.includes("--still")) {
  const sec = Number(argv[argv.indexOf("--still") + 1]);
  const comp = argv.includes("--comp") ? argv[argv.indexOf("--comp") + 1] : "ProEdit";
  const out = `out/${slug}-${comp === "ProEdit" ? "" : comp + "-"}${sec}s.png`;
  rem(["still", "src/index.ts", comp, out, `--props=${props}`, `--frame=${Math.round(sec * 30)}`]);
  console.log(`→ ${path.join(ROOT, out)}`);
  process.exit(0);
}

const out = path.join("out", `${slug}.mp4`);
rem(["render", "src/index.ts", "ProEdit", out, `--props=${props}`, "--codec=h264", "--crf=17", "--concurrency=50%"]);
console.log(`→ ${path.join(ROOT, out)}`);

// --showcase kept as a shortcut for --wrap showcase
let wraps = argv.includes("--wrap") ? argv[argv.indexOf("--wrap") + 1].split(",") : argv.includes("--showcase") ? ["showcase"] : [];
if (wraps.includes("all")) wraps = ["showcase", "chat", "prompt"];
const COMP = { showcase: "Showcase", chat: "ClaudeChat", prompt: "PromptResult" };
if (wraps.length) {
  fs.copyFileSync(path.join(ROOT, out), path.join(ROOT, "public", slug, "after.mp4"));
  const wrapFile = path.join(ROOT, "public", slug, "wrap.json");
  const extra = fs.existsSync(wrapFile) ? JSON.parse(fs.readFileSync(wrapFile, "utf8")) : {};
  for (const w of wraps) {
    if (!COMP[w]) throw new Error(`unknown wrapper "${w}" — use showcase, chat or prompt`);
    const o = `out/${slug}-${w}.mp4`;
    const { wrappers = {}, ...common } = extra;
    rem(["render", "src/index.ts", COMP[w], o, `--props=${JSON.stringify({ ...common, ...(wrappers[w] ?? {}), slug })}`, "--codec=h264", "--crf=17", "--concurrency=50%"]);
    console.log(`→ ${path.join(ROOT, o)}`);
  }
}
