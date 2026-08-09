import { useEffect, useState } from "react";

type RedditPost = {
  id: string;
  title: string;
  author: string;
  updated: string;
  href: string;
  flair?: string;
};

type RedditFeedPayload = {
  subreddit?: string;
  source?: string;
  updated?: string;
  posts?: RedditPost[];
  error?: string;
};

const SUBREDDIT_URL = "https://www.reddit.com/r/aigamedev/";
const REFRESH_MS = 3 * 60 * 1000;

function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function RedditFeed() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [updated, setUpdated] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/reddit?t=${Date.now()}`, {
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as RedditFeedPayload;
        if (cancelled) return;

        if (!res.ok || data.error) {
          setError(data.error || `Could not load feed (${res.status})`);
          if (data.posts?.length) setPosts(data.posts);
        } else {
          setError("");
          setPosts(data.posts ?? []);
          setUpdated(data.updated ?? "");
        }
      } catch {
        if (!cancelled) setError("Live feed unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="reddit-feed">
      <div className="reddit-feed-bar">
        <div>
          <p className="mono eyebrow">Live · r/aigamedev</p>
          <p className="reddit-feed-meta mono">
            {loading && "Tuning into Reddit…"}
            {!loading && !error && updated && `Updated ${relativeTime(updated)} · refreshes often`}
            {!loading && error && error}
          </p>
        </div>
        <a
          className="btn btn-lime"
          href={SUBREDDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on Reddit
        </a>
      </div>

      {loading && posts.length === 0 && (
        <ul className="reddit-list" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="reddit-item reddit-skel" />
          ))}
        </ul>
      )}

      {!loading && posts.length === 0 && (
        <div className="reddit-empty">
          <p>Couldn’t pull posts into the hub — Reddit may be rate-limiting.</p>
          <a className="btn btn-ghost" href={SUBREDDIT_URL} target="_blank" rel="noopener noreferrer">
            Visit r/aigamedev →
          </a>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="reddit-list">
          {posts.map((post, i) => (
            <li key={post.id} style={{ animationDelay: `${i * 40}ms` }}>
              <a
                className="reddit-item"
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="reddit-item-top">
                  {post.flair ? <span className="tag mono tag-coral">{post.flair}</span> : null}
                  <span className="mono reddit-time">{relativeTime(post.updated)}</span>
                </div>
                <h3>{post.title}</h3>
                <p className="mono reddit-author">u/{post.author}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
