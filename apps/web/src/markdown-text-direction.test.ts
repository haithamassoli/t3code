import { describe, expect, it } from "vite-plus/test";
import { rehypeTextDirection } from "./markdown-text-direction";

function element(tagName: string, children: ReturnType<typeof text>[] = [], dir?: string) {
  return { type: "element", tagName, children, properties: dir ? { dir } : {} };
}
function text(value: string) {
  return { type: "text", value };
}

describe("Markdown text direction", () => {
  it("lets independent prose blocks resolve direction without modifying their text", () => {
    const blocks = [element("p", [text("مرحبا API 123!")]), element("p", [text("English שלום")])];
    const original = blocks.map((block) => block.children);
    rehypeTextDirection()({ type: "root", children: blocks });
    expect(blocks.map((block) => block.properties)).toEqual([{ dir: "auto" }, { dir: "auto" }]);
    expect(blocks.map((block) => block.children)).toEqual(original);
  });

  it("does not hide a loose list or alert's paragraphs from its parent's auto scan", () => {
    const paragraph = element("p", [text("שלום עולם")]);
    const item = { ...element("li"), children: [paragraph] };
    const quoteParagraph = element("p", [text("مرحبا")]);
    const quote = { ...element("blockquote"), children: [quoteParagraph] };
    rehypeTextDirection()({
      type: "root",
      children: [{ ...element("ul"), children: [item] }, quote],
    });
    expect(item.properties).toEqual({ dir: "auto" });
    expect(quote.properties).toEqual({ dir: "auto" });
    expect(paragraph.properties).toEqual({});
    expect(quoteParagraph.properties).toEqual({});
  });

  it("excludes code and table order while allowing each table cell to resolve direction", () => {
    const code = element("code", [text("npm run build")]);
    const cell = element("td", [text("العربية")]);
    const table = { ...element("table"), children: [{ ...element("tr"), children: [cell] }] };
    const prose = { ...element("p"), children: [code, text(" مرحبا")] };
    rehypeTextDirection()({ type: "root", children: [prose, table] });
    expect(code.properties).toEqual({ dir: "ltr" });
    expect(table.properties).toEqual({ dir: "ltr" });
    expect(cell.properties).toEqual({ dir: "auto" });
    expect(prose.children).toEqual([code, text(" مرحبا")]);
  });

  it("preserves an explicit HTML direction and its inherited subtree", () => {
    const paragraph = element("p", [text("مرحبا")]);
    const authored = { ...element("div", [], "ltr"), children: [paragraph] };
    rehypeTextDirection()({ type: "root", children: [authored] });
    expect(authored.properties).toEqual({ dir: "ltr" });
    expect(paragraph.properties).toEqual({});
  });

  it("lets nested mixed list items resolve independently of the parent item", () => {
    const hebrew = element("li", [text("שלום ילד")]);
    const english = element("li", [text("English child")]);
    const nested = { ...element("ul"), children: [hebrew, english] };
    const parent = { ...element("li"), children: [text("English parent"), nested] };
    rehypeTextDirection()({ type: "root", children: [{ ...element("ul"), children: [parent] }] });
    expect(parent.properties).toEqual({ dir: "auto" });
    expect(hebrew.properties).toEqual({ dir: "auto" });
    expect(english.properties).toEqual({ dir: "auto" });
  });
});
