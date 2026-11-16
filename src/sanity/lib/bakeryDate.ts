// Date fields store YYYY-MM-DD, not a datetime. Resolve when a document is created.
export const bakeryToday = () => new Date().toISOString().slice(0, 10);