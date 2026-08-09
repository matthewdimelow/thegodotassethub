// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { parseRedditAtom } from './scripts/reddit-atom.mjs';

const UA =
  'AIGameDevHub/1.0 (community feed; +https://github.com/matthewdimelow/thegodotassethub)';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  redirects: {
    '/ai': '/coding',
    '/ai/[id]': '/coding/[id]',
    '/assets': '/tools',
    '/assets/dimeplayer': '/tools/dimeplayer',
    '/modeling/dimeplayer': '/tools/dimeplayer',
  },
  vite: {
    plugins: [
      {
        name: 'aigamedevhub-reddit-api',
        configureServer(server) {
          server.middlewares.use('/api/reddit', async (_req, res) => {
            try {
              const upstream = await fetch('https://www.reddit.com/r/aigamedev/.rss', {
                headers: {
                  'User-Agent': UA,
                  Accept: 'application/atom+xml, application/xml, text/xml, */*',
                },
              });
              if (!upstream.ok) {
                res.statusCode = upstream.status === 429 ? 429 : 502;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(
                  JSON.stringify({
                    error: `Reddit responded ${upstream.status}`,
                    posts: [],
                  }),
                );
                return;
              }
              const xml = await upstream.text();
              const feed = parseRedditAtom(xml, { limit: 20 });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify(feed));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : 'Feed unavailable',
                  posts: [],
                }),
              );
            }
          });
        },
      },
    ],
  },
});
