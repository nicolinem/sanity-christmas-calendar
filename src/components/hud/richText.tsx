// Quest text is Norwegian, but developer words stay as developers say them.
// Two marks keep them apart from the prose:
//   `item.tsx`  code: files, commands, APIs, anything you would type
//   *draft*     a Sanity or dev term, in English (Studio, document, schema…)
export function renderText(text: string) {
  return text.split(/(`[^`]+`|\*[^*]+\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <span key={i} className="term">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

// For places that need the words without the marks (aria labels, toasts).
export function plainText(text: string) {
  return text.replace(/[`*]/g, "");
}
