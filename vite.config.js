import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { RSS_FEEDS } from './src/utils/feeds.js'

// En desarrollo servimos cada feed RSS desde el propio dev server (/rss/<id>).
// El fetch real lo hace Node, así que no hay CORS ni dependemos de proxies
// públicos — que están caídos o rate-limitados casi siempre.
const rssProxy = {}
for (const feed of RSS_FEEDS) {
  const target = new URL(feed.url)
  rssProxy[`/rss/${feed.id}`] = {
    target: target.origin,
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    headers: {
      // Varios feeds devuelven 403 a clientes sin User-Agent de navegador.
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    rewrite: () => target.pathname + target.search,
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: { proxy: rssProxy },
})
