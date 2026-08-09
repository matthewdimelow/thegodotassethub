/**
 * Parse Reddit Atom/RSS into a small JSON feed for the community page.
 * @param {string} xml
 * @param {{ limit?: number }} [opts]
 */
export function parseRedditAtom(xml, opts = {}) {
  const limit = opts.limit ?? 20;
  const get = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return m ? decodeXml(m[1].trim()) : "";
  };

  const entries = [];
  const re = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = re.exec(xml)) && entries.length < limit) {
    const block = match[1];
    const linkMatch =
      block.match(/<link[^>]+href="([^"]+)"[^>]*rel="alternate"/i) ||
      block.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/i) ||
      block.match(/<link[^>]+href="([^"]+)"/i);
    const authorBlock = block.match(/<author>([\s\S]*?)<\/author>/i)?.[1] ?? "";
    const author = get(authorBlock, "name").replace(/^\/u\//, "") || "unknown";
    const title = get(block, "title");
    const updated = get(block, "updated") || get(block, "published");
    const id = get(block, "id");
    const href = linkMatch?.[1] ? decodeXml(linkMatch[1]) : "";
    if (!title || !href) continue;

    const category =
      block.match(/<category[^>]+label="([^"]+)"/i)?.[1] ||
      block.match(/<category[^>]+term="([^"]+)"/i)?.[1] ||
      "";

    entries.push({
      id: id || href,
      title,
      author,
      updated,
      href,
      flair: category && category !== "aigamedev" ? decodeXml(category) : "",
    });
  }

  const feedUpdated = get(xml.slice(0, 2000), "updated");
  return {
    subreddit: "aigamedev",
    source: "https://www.reddit.com/r/aigamedev/",
    updated: feedUpdated || new Date().toISOString(),
    posts: entries,
  };
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
