import fs from "fs";

// read base HTML
let html = fs.readFileSync(".\battleship\battleseek.html", "utf-8");

// inline CSS
html = html.replace(
  /<link rel="stylesheet" href="(.*?)">/g,
  (_, file) => `<style>${fs.readFileSync(file, "utf-8")}</style>`
);

// inline JS
html = html.replace(
  /<script src="(.*?)"><\/script>/g,
  (_, file) => `<script>${fs.readFileSync(file, "utf-8")}</script>`
);

// save final
fs.writeFileSync("bundle.html", html);
console.log("✅ bundle.html created");