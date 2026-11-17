/* eslint-disable @typescript-eslint/no-explicit-any -- this file pokes at player-written config */

// A stand-in for Sanity's `Rule`, to run a field's `validation` without a
// Studio: it records every `custom()` and `required()` rule (and whether the
// chain demotes it to a warning), so a task can call them with example
// documents. Same idea as the Luke 4/5 checks in scripts/quest.ts.

export type Level = "error" | "warning" | "info";

export type Recorded = {
  fn: (value: unknown, context: any) => unknown;
  level: Level;
  message?: string; // from `.error("…")` / `.warning("…")`, used when the rule has none of its own
};

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

export function recordRules(validation: unknown): Recorded[] {
  const recorded: Recorded[] = [];
  const chain = (own: Recorded[]): any =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then" || typeof prop === "symbol") return undefined;
          const add = (fn: Recorded["fn"]) => {
            const rule: Recorded = { fn, level: "error" };
            recorded.push(rule);
            own.push(rule);
            return chain(own);
          };
          if (prop === "custom") return (fn: Recorded["fn"]) => add(fn);
          if (prop === "required")
            return () => add((v) => (isEmpty(v) ? "Required" : true));
          if (prop === "error" || prop === "warning" || prop === "info")
            return (message?: unknown) => {
              own.forEach((r) => {
                r.level = prop;
                if (typeof message === "string") r.message = message;
              });
              return chain(own);
            };
          return () => chain(own);
        },
      },
    );
  const rule = new Proxy({}, { get: (_t, prop) => chain([])[prop] });
  for (const v of Array.isArray(validation) ? validation : [validation]) {
    if (typeof v === "function") v(rule);
  }
  return recorded;
}

// What a rule returned: true is fine, a string or `{ message }` is a complaint.
export function messagesOf(result: unknown, fallback = "Invalid"): string[] {
  if (result === false) return [fallback];
  if (typeof result === "string") return [result];
  if (Array.isArray(result))
    return result.flatMap((r) => messagesOf(r, fallback));
  if (typeof result === "object" && result !== null && "message" in result)
    return [String((result as { message: unknown }).message)];
  return [];
}
