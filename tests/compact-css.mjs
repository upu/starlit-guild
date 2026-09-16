// Collapse formatted CSS to the whitespace-free shape the source assertions
// were written against, so Prettier's layout does not change what they test.
export function compactCss(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/ ?([{}:;,>!]) ?/g, "$1")
    .replace(/([\w-]) \(/g, "$1(")
    .replace(/\( /g, "(")
    .replace(/ \)/g, ")")
    .replace(/;}/g, "}")
    .trim();
}
