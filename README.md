# Tesla 369 — Oráculo Lunar Cripto

Tablero en tiempo real para BTC, ETH y SOL que cruza el ciclo lunar con
indicadores técnicos y el sentimiento del mercado. Se publica en
[tesla369.app](https://tesla369.app). Todo el sitio está en español y todas las
horas se muestran en hora de Lima (UTC−5, sin horario de verano).

## Desarrollo

```bash
npm ci
npm run dev              # servidor local con recarga
npm run lint             # ESLint
npm run build            # compila a dist/
npm run verificar-lunas  # compara el motor lunar con el Observatorio Naval de EE. UU.
npm run news             # regenera public/news.json desde los RSS
```

Stack: React 19, Vite 8, Tailwind 4, Recharts y hls.js. Sin TypeScript.

## Publicación

Un push a `master` dispara `.github/workflows/deploy.yml`, que genera las
noticias (`scripts/fetch-news.mjs`), compila, copia `dist/index.html` a
`dist/404.html` (para que `/biblioteca/` funcione al entrar directo) y publica en
GitHub Pages. El mismo flujo corre todos los días a las 09:00 UTC (04:00 en
Lima) para refrescar las noticias. Trabaja en una rama y fusiona a `master` solo
cuando quieras publicar.

## De dónde sale cada dato

| Dato | Fuente | Detalle |
| --- | --- | --- |
| Precio en vivo | Binance (WebSocket `@ticker`) | Se agrupa y se pinta una vez por segundo |
| Velas del gráfico | Binance REST (`/api/v3/klines`, `timeZone=-5`) | 1D: 15 min · 7D: 2 h · 30D: 6 h · 90D: 1 día |
| Volumen de cada moneda | Binance | Volumen de 24 h del par contra USDT |
| Capitalización de cada moneda | CoinGecko (`simple/price`) | Caché de 5 min; si falla, precio × oferta aproximada, marcado «aprox.» |
| Mercado global y dominancia | CoinGecko (`/global`) o CoinMarketCap con la clave del visitante | Cada 2 min |
| Miedo y Codicia | Alternative.me (o CoinMarketCap con clave) | Diario |
| Noticias | RSS, regenerado en cada despliegue | `public/news.json` |

## Motor lunar (`src/utils/lunar.js`)

Un solo motor para todo el sitio. Las lunas nuevas, llenas y los cuartos se
calculan con el algoritmo de Jean Meeus (*Astronomical Algorithms*, cap. 49, con
sus correcciones periódicas y ΔT), y la iluminación con el cap. 48. Funciona para
cualquier año. `npm run verificar-lunas` compara 2026 y 2027 con las 99 fases
publicadas por el Observatorio Naval de EE. UU.; la tolerancia es de 10 minutos
y la desviación actual es menor a 1 minuto.

Los nombres tradicionales de las lunas llenas son los del hemisferio norte; la
segunda luna llena de un mes es la Luna Azul, la más cercana al equinoccio de
septiembre es la Luna de la Cosecha y la siguiente, la del Cazador.

## Señal Tesla 369 (`src/utils/senal.js`)

Usa siempre velas de 1 h de Binance, sin importar el rango del gráfico. Suma
puntos por cuatro factores:

| Factor | Puntos |
| --- | --- |
| Tramo lunar | Nueva (±1.8 días) o creciente (días 1.8–9.2): +1 · llena (días 9.2–16.6): −1 · menguante (días 16.6–27.7): −0.5 |
| RSI 14 | < 30: +2 · < 45: +0.5 · > 55: −0.5 · > 70: −2 |
| Histograma MACD 12-26-9 | Positivo: +1 · negativo: −1 |
| Variación de 24 h | Solo si pasa de ±5 %: subida −0.5 · caída +0.5 |

Estados: 2 o más, Acumular · desde 0.5, Esperar · desde −1, Precaución · menos de
−1, Tomar ganancias. La volatilidad (ATR 14 en %) se muestra con su umbral
(percentil 80 de los últimos 90 días) pero no suma puntos.

El panel incluye el seguimiento de los últimos 90 días: un caso por día a
medianoche de Lima, y qué hizo el precio 24 h y 7 días después frente al azar
(el porcentaje de esos mismos días en que el precio se movió en esa dirección),
con prueba binomial. Con menos de 15 casos se marca «muestra chica». Los plazos
de 7 días se solapan, así que su prueba usa la muestra efectiva (casos ÷ 7).

## Estadística lunar (`src/utils/estadisticaLunar.js`)

En la pestaña «Tabla lunar» se calcula, con las velas diarias de BTC desde 2017,
el rendimiento medio y el porcentaje de días alcistas de cada tramo lunar frente
a todos los días, con una prueba t de Welch. Es correlación histórica, no
predicción.

## Caché en el navegador

Las velas de 1 h (100 días) y las diarias de BTC (desde 2017) se guardan en
`localStorage` y solo se pide lo que falta, para no repetir descargas ni rozar
los límites de Binance.

## Medios

Los videos decorativos (fondo y orbes de la cabecera) no se cargan en celular,
con `prefers-reduced-motion` ni con ahorro de datos. «Visión cósmica» se carga al
acercarse y se pausa fuera de vista. La música ambiental no descarga el archivo
hasta que se pulsa Reproducir, y nunca suena sola.
