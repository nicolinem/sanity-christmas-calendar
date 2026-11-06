// Files imported with `?raw` come in as their text (see next.config.ts).
declare module "*?raw" {
  const source: string;
  export default source;
}
