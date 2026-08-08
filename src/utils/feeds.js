// Fuentes RSS de noticias cripto.
//
// La lista se comparte entre la app y vite.config.js: en desarrollo Vite monta
// un proxy en /rss/<id> que golpea la URL real desde el servidor, así que no
// hay CORS ni dependemos de proxies públicos. En producción caemos a la cadena
// de proxies CORS de cryptoNews.js.
//
// Feeds retirados por estar muertos (comprobado 8 ago 2026): es.cointelegraph
// devuelve 410 Gone, dlnews no publica desde mayo y criptotendencia responde
// 403 a cualquier proxy.
export const RSS_FEEDS = [
  // Español
  { id: "investing-es",     url: "https://es.investing.com/rss/news_301.rss", source: "Investing ES", lang: "es", priority: 1 },
  { id: "beincrypto-es",    url: "https://es.beincrypto.com/feed/", source: "BeInCrypto", lang: "es", priority: 1 },
  // Responde 403 a las IP de datacenter, así que en GitHub Actions no entra;
  // se mantiene porque sí funciona desde el proxy del dev server.
  { id: "criptonoticias",   url: "https://www.criptonoticias.com/feed/", source: "CriptoNoticias", lang: "es", priority: 2 },
  { id: "diariobitcoin",    url: "https://diariobitcoin.com/feed/", source: "Diario Bitcoin", lang: "es", priority: 2 },
  { id: "observatorio",     url: "https://observatorioblockchain.com/feed/", source: "Observatorio Blockchain", lang: "es", priority: 2 },
  // Inglés — los grandes movimientos rompen aquí primero
  { id: "cointelegraph",    url: "https://cointelegraph.com/rss", source: "CoinTelegraph", lang: "en", priority: 1 },
  { id: "coindesk",         url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml", source: "CoinDesk", lang: "en", priority: 1 },
  { id: "theblock",         url: "https://www.theblock.co/rss.xml", source: "The Block", lang: "en", priority: 1 },
  { id: "decrypt",          url: "https://decrypt.co/feed", source: "Decrypt", lang: "en", priority: 2 },
  { id: "bitcoinmagazine",  url: "https://bitcoinmagazine.com/.rss/full/", source: "Bitcoin Magazine", lang: "en", priority: 2 },
  { id: "cryptoslate",      url: "https://cryptoslate.com/feed/", source: "CryptoSlate", lang: "en", priority: 2 },
];
