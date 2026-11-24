/* eslint-disable @typescript-eslint/no-require-imports */
// Loads the code window's tasks in Node, the way the bundler would: "@/" is
// src/, "?raw" gives a file's text, and TypeScript and JSX are stripped. Used
// by the tests that run every task's solution.
const Module = require("node:module");
const { readFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { transform } = require("sucrase");

const SRC = join(__dirname, "../../../..");
const resolve = Module._resolveFilename;
const load = Module._load;

function aliased(request, parent) {
  if (request.startsWith("@/")) return join(SRC, request.slice(2));
  return request.startsWith(".") && parent
    ? join(dirname(parent.filename), request)
    : request;
}

function withExtension(path) {
  for (const ext of ["", ".ts", ".tsx", ".js", "/index.ts"])
    if (existsSync(path + ext) && !path.endsWith("/")) {
      const full = path + ext;
      if (ext || /\.\w+$/.test(path)) return full;
    }
  return path;
}

Module._load = function (request, parent, isMain) {
  if (request.endsWith("?raw")) {
    const file = withExtension(aliased(request.slice(0, -4), parent));
    return { __esModule: true, default: readFileSync(file, "utf8") };
  }
  if (/\.css$/.test(request)) return {};
  return load.call(this, request, parent, isMain);
};
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("@/"))
    return resolve.call(this, aliased(request, parent), parent, ...rest);
  return resolve.call(this, request, parent, ...rest);
};
for (const ext of [".ts", ".tsx"])
  Module._extensions[ext] = (module, filename) => {
    const { code } = transform(readFileSync(filename, "utf8"), {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
      filePath: filename,
    });
    module._compile(code, filename);
  };

module.exports = () => require("./index.ts");
