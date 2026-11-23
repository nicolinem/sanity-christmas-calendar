#!/usr/bin/env node
// Runs before `npm run dev`. The game must run on port 3000: a project made by
// `npm run setup` only accepts the Studio from http://localhost:3000 until it's
// claimed. Next would quietly move to 3001, and then the Studio can't sign in.
// So we stop here and say what's using the port instead.

import { execFileSync } from "node:child_process";
import { createServer } from "node:net";

const PORT = 3000;

function whoUses(port) {
  if (process.platform === "win32") return null;
  try {
    const pid = execFileSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")[0];
    if (!pid) return null;
    const name = execFileSync("ps", ["-p", pid, "-o", "comm="], {
      encoding: "utf8",
    }).trim();
    return { pid, name };
  } catch {
    return null;
  }
}

const server = createServer();
server.once("error", (error) => {
  if (error.code !== "EADDRINUSE") {
    console.warn(
      `Couldn't check port ${PORT} (${error.code}). Starting anyway.`,
    );
    return;
  }
  const user = whoUses(PORT);
  console.error(`
\x1b[31m✗\x1b[39m Port ${PORT} is already in use${user ? ` by ${user.name} (process ${user.pid})` : ""}.

  The game has to run on ${PORT}: your Sanity project only lets the Studio in
  from http://localhost:${PORT}.

  Is the game already running in another terminal? Then just open
  http://localhost:${PORT}. Otherwise stop what's using the port${user ? `:\n\n    kill ${user.pid}\n` : "."}
`);
  process.exit(1);
});
server.once("listening", () => server.close());
server.listen(PORT);
