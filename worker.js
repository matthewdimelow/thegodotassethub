import { parseRedditAtom } from "./scripts/reddit-atom.mjs";

const UA =
  "AIGameDevHub/1.0 (community feed; +https://github.com/matthewdimelow/thegodotassethub)";
const REDDIT_RSS = "https://www.reddit.com/r/aigamedev/.rss";
const CACHE_KEY = "https://aigamedevhub.internal/api/reddit-cache";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/reddit" || url.pathname === "/api/reddit/") {
      return serveRedditFeed(ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function serveRedditFeed(ctx) {
  const cache = caches.default;
  const cacheReq = new Request(CACHE_KEY);

  try {
    const upstream = await fetch(REDDIT_RSS, {
      headers: {
        "User-Agent": UA,
        Accept: "application/atom+xml, application/xml, text/xml, */*",
      },
    });

    if (upstream.ok) {
      const xml = await upstream.text();
      const feed = parseRedditAtom(xml, { limit: 20 });
      const response = json(feed, 200, "public, max-age=180, stale-while-revalidate=600");
      ctx.waitUntil(cache.put(cacheReq, response.clone()));
      return response;
    }

    const stale = await cache.match(cacheReq);
    if (stale) {
      const headers = new Headers(stale.headers);
      headers.set("X-Feed-Status", "stale");
      headers.set("Cache-Control", "public, max-age=60");
      return new Response(stale.body, { status: 200, headers });
    }

    return json(
      { error: `Reddit responded ${upstream.status}`, posts: [] },
      upstream.status === 429 ? 429 : 502,
      "public, max-age=60",
    );
  } catch (err) {
    const stale = await cache.match(cacheReq);
    if (stale) {
      const headers = new Headers(stale.headers);
      headers.set("X-Feed-Status", "stale");
      return new Response(stale.body, { status: 200, headers });
    }

    return json(
      { error: err instanceof Error ? err.message : "Feed unavailable", posts: [] },
      502,
      "public, max-age=30",
    );
  }
}

function json(body, status, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
