interface HtmlNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
}

const PROSE_BLOCKS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "th",
  "td",
  "summary",
]);

/** Let the browser resolve prose direction, excluding code from its first-strong scan. */
export function rehypeTextDirection() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode, insideProse = false) => {
      if (node.type === "element") {
        node.properties ??= {};
        // An authored direction owns its subtree. Nested auto blocks would also
        // be skipped by the browser when it scans their parent's direction.
        if (node.properties.dir != null) return;
        if (node.tagName === "code" || node.tagName === "pre" || node.tagName === "table") {
          node.properties.dir = "ltr";
          if (node.tagName !== "table") return;
          insideProse = false;
        } else if (node.tagName === "ul" || node.tagName === "ol") {
          insideProse = false;
        } else if (!insideProse && PROSE_BLOCKS.has(node.tagName ?? "")) {
          node.properties.dir = "auto";
          insideProse = true;
        }
      }
      node.children?.forEach((child) => visit(child, insideProse));
    };
    visit(tree);
  };
}
