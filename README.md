# SlideStack 🗂️

Turn any topic into a save-worthy Instagram carousel. Claude writes the deck, your browser draws it on canvas, and you download ready-to-post 1080×1350 PNGs.

**Why carousels?** In 2026 Instagram distributes carousels to non-followers at Reels-level rates, and they get saved ~9× more than Reels. Educational carousels are the highest-leverage format for creators — SlideStack makes them in one click.

## How it works

1. Enter a topic (plus optional notes, audience, tone).
2. Claude Fable 5 writes the deck as structured JSON — hook slide → one-point-per-slide content → CTA.
3. A canvas renderer paints each slide in one of three hand-built themes (Paper Punch, Midnight Volt, Sorbet Riot).
4. Download individual PNGs or the whole deck as a ZIP.

## Privacy / BYOK

100% client-side. No backend, no analytics, no storage. Your Anthropic API key goes straight from your browser to `api.anthropic.com` and nowhere else ("remember on this device" keeps it in localStorage only, and is off by default). A strict CSP blocks all other network destinations.

## Stack

- React 18 + Vite + TypeScript
- Claude Messages API (structured outputs, server-side Opus 4.8 fallback)
- HTML Canvas rendering, JSZip export
- Fonts: Archivo Black + Space Grotesk (self-hosted)

## Run locally

```bash
npm install
npm run dev
```

Built by [Myan Patel](https://github.com/myanptl).
