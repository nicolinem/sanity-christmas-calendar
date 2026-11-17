// A stand-in for what `context.getClient({ apiVersion })` gives in the Studio.
// There is no dataset in the code window, so the client answers from a task's
// example documents, and only the queries the task has prepared: each one is
// matched by its exact text. Anything else is a clear error, not a guess.

export type Answer = {
  query: string; // matched by string equality with the imported constant
  answer: (params: Record<string, unknown>) => unknown;
};

const MISSING_API_VERSION =
  '`getClient` må få en `apiVersion`, for eksempel `getClient({ apiVersion: "2024-01-01" })`.';

const ONLY_PREPARED = (queries: string[]) =>
  `Kodevinduet har ikke et ekte *dataset*, så det kan bare svare på den ferdige spørringen fra \`guild.ts\` (${queries.join(", ")}). Bruk den ferdige i stedet for å skrive din egen.`;

// The `$params` a query refers to; Sanity refuses a query that uses one it wasn't given.
const paramsIn = (query: string) => [
  ...new Set([...query.matchAll(/\$(\w+)/g)].map((m) => m[1])),
];

export type FakeClient = {
  fetch: (query: string, params?: Record<string, unknown>) => Promise<unknown>;
};

// Returns a `getClient` like the Studio's: it insists on an `apiVersion`.
export function createFakeGetClient(answers: Answer[], prepared: string[]) {
  const client: FakeClient = {
    async fetch(query, params = {}) {
      const found = answers.find((a) => a.query === query);
      if (!found) throw new Error(ONLY_PREPARED(prepared));
      const missing = paramsIn(query).filter((p) => !(p in params));
      if (missing.length)
        throw new Error(
          `Spørringen bruker ${missing.map((p) => `$${p}`).join(", ")}, men du ga den ikke med i parametrene.`,
        );
      return found.answer(params);
    },
  };
  // Calling anything but `fetch` is a mistake worth explaining too.
  const guarded = new Proxy(client, {
    get(target, prop) {
      if (prop in target || typeof prop === "symbol" || prop === "then")
        return Reflect.get(target, prop);
      return () => {
        throw new Error(
          `Klienten i kodevinduet kan bare \`fetch\`, ikke \`${String(prop)}\`.`,
        );
      };
    },
  });
  return (options?: { apiVersion?: string }): FakeClient => {
    if (!options?.apiVersion) throw new Error(MISSING_API_VERSION);
    return guarded;
  };
}
