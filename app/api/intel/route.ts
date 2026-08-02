// Live industry-intelligence feed — cybersecurity + AI headlines.
// Server-side fetch of Google News RSS (no CORS), parsed to JSON.
// Same source family the threat monitor uses; kept dependency-free.
// Revalidated every 15 min so it's live without hammering the source.
export const revalidate = 900;

type IntelItem = {
  title: string;
  link: string;
  source: string;
  published: string;
  kind: "ai" | "cyber";
};

const FEED_URL =
  "https://news.google.com/rss/search?q=" +
  encodeURIComponent(
    'cybersecurity OR "cyber threat" OR "data breach" OR "artificial intelligence" OR "AI security"'
  ) +
  "&hl=en-US&gl=US&ceid=US:en";

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}

const AI_RE = /\bAI\b|artificial intelligence|\bLLM\b|OpenAI|Anthropic|Gemini|ChatGPT|machine learning|generative/i;

export async function GET() {
  try {
    const res = await fetch(FEED_URL, {
      headers: { "User-Agent": "CyberShieldAI/1.0 (+https://pcdigitalsolutions.tech)" },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const xml = await res.text();

    const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const items: IntelItem[] = blocks.slice(0, 14).map((block) => {
      const rawTitle = pick(block, "title");
      // Google News titles read "Headline - Source"; split the source off the tail.
      const sourceTag = pick(block, "source");
      let title = rawTitle;
      let source = sourceTag;
      const dash = rawTitle.lastIndexOf(" - ");
      if (dash > 0) {
        title = rawTitle.slice(0, dash).trim();
        if (!source) source = rawTitle.slice(dash + 3).trim();
      }
      return {
        title,
        link: pick(block, "link"),
        source: source || "News",
        published: pick(block, "pubDate"),
        kind: AI_RE.test(rawTitle) ? "ai" : "cyber",
      };
    });

    return Response.json({ status: "ok", count: items.length, items });
  } catch (err) {
    return Response.json(
      { status: "error", count: 0, items: [], error: String(err) },
      { status: 200 }
    );
  }
}
