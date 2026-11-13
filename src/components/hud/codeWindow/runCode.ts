import * as React from "react";
import { transform } from "sucrase";

// Runs what the player wrote in the code window, in their own browser. Nothing
// is saved to a file and nothing runs in the Studio: the result only feeds the
// task's examples. TypeScript and JSX are stripped by sucrase, and `import`
// can only reach the modules the task hands over.

export type Modules = Record<string, Record<string, unknown>>;

// A task can explain an import it doesn't offer, e.g. a path that moved.
export type ImportHelp = (name: string) => string | undefined;

export type Loaded =
  | { ok: true; exports: Record<string, unknown> }
  | { ok: false; line?: number; message: string };

type SucraseError = Error & { loc?: { line: number; column: number } };

// Turns the browser's error into something a player can act on.
function explain(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const missing =
    err instanceof ReferenceError && message.match(/^(\w+) is not defined/);
  if (missing)
    return `\`${missing[1]}\` finnes ikke her. Mangler en \`import\`?`;
  return `Koden krasjet: ${message}`;
}

export function runModule(
  source: string,
  modules: Modules,
  help?: ImportHelp,
): Loaded {
  let code: string;
  try {
    code = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "classic",
      production: true,
    }).code;
  } catch (err) {
    const loc = (err as SucraseError).loc;
    return {
      ok: false,
      line: loc?.line,
      message: loc
        ? `Skrivefeil på linje ${loc.line}.`
        : "Koden har en skrivefeil.",
    };
  }

  const mod = { exports: {} as Record<string, unknown> };
  const require = (name: string) => {
    const found = modules[name];
    if (!found)
      throw new ImportError(
        help?.(name) ?? `Kodevinduet kjenner ikke \`${name}\`.`,
      );
    return { __esModule: true, ...found };
  };
  try {
    // The point of the window: run the player's own code.
    new Function("require", "module", "exports", "React", code)(
      require,
      mod,
      mod.exports,
      React,
    );
  } catch (err) {
    return {
      ok: false,
      line: err instanceof ImportError ? undefined : crashLine(err),
      message: err instanceof ImportError ? err.message : explain(err),
    };
  }
  return { ok: true, exports: mod.exports };
}

class ImportError extends Error {}

// Where in the player's file a crash happened, when the browser says. Sucrase
// keeps line numbers, and \`new Function\` adds two lines of its own on top.
function crashLine(err: unknown): number | undefined {
  const stack = err instanceof Error ? (err.stack ?? "") : "";
  const match = stack.match(/<anonymous>:(\d+):\d+/);
  if (!match) return undefined;
  const line = Number(match[1]) - 2;
  return line > 0 ? line : undefined;
}
