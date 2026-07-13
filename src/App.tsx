import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { generateCarousel } from "./lib/claude";
import { DEMO_CAROUSEL } from "./lib/demo";
import { renderCarousel } from "./lib/render";
import { THEME } from "./lib/themes";
import type { Carousel, ModelId } from "./lib/types";

const KEY_STORAGE = "slidestack.apiKey";

const MODELS: { id: ModelId; label: string; blurb: string }[] = [
  { id: "claude-fable-5", label: "Fable 5", blurb: "sharpest copy" },
  { id: "claude-opus-4-8", label: "Opus 4.8", blurb: "great + cheaper" },
  { id: "claude-sonnet-5", label: "Sonnet 5", blurb: "fast + cheapest" },
];

const TONES = ["Direct & punchy", "Friendly & casual", "Contrarian", "Educational"];
const AUDIENCES = ["Students", "Creators", "Founders & builders", "General"];

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? "");
  const [rememberKey, setRememberKey] = useState(() => !!localStorage.getItem(KEY_STORAGE));
  const [model, setModel] = useState<ModelId>("claude-fable-5");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [slideCount, setSlideCount] = useState(6);
  const [handle, setHandle] = useState("");

  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rememberKey && apiKey) localStorage.setItem(KEY_STORAGE, apiKey);
    if (!rememberKey) localStorage.removeItem(KEY_STORAGE);
  }, [rememberKey, apiKey]);

  const rerender = useCallback(
    async (deck: Carousel) => {
      const urls = await renderCarousel(deck, THEME, handle.trim());
      setImages(urls);
    },
    [handle],
  );

  // re-paint when handle changes on an existing deck
  useEffect(() => {
    if (carousel) void rerender(carousel);
  }, [carousel, rerender]);

  async function onGenerate() {
    setError("");
    if (!topic.trim()) return setError("Give me a topic first.");
    if (!apiKey.trim()) return setError("Paste your Anthropic API key (or run the demo below).");
    setBusy(true);
    try {
      const deck = await generateCarousel({
        apiKey: apiKey.trim(),
        model,
        topic: topic.trim(),
        notes,
        audience,
        tone,
        slideCount,
      });
      setCarousel(deck);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function onDemo() {
    setError("");
    setCarousel(DEMO_CAROUSEL);
  }

  function slug() {
    return (carousel?.topic ?? "carousel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
  }

  function downloadOne(url: string, i: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug()}-${String(i + 1).padStart(2, "0")}.png`;
    a.click();
  }

  async function downloadZip() {
    const zip = new JSZip();
    images.forEach((url, i) => {
      zip.file(`${slug()}-${String(i + 1).padStart(2, "0")}.png`, url.split(",")[1], { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug()}-carousel.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero-badge">carousels beat reels in 2026 · saved 9× more</div>
        <h1>
          Slide<span className="accent">Stack</span>
        </h1>
        <p className="tagline">
          Topic in → save-worthy Instagram carousel out. Written by Claude, drawn in your
          browser, exported as ready-to-post PNGs. Your API key never leaves this tab.
        </p>
      </header>

      <main className="grid">
        <section className="panel controls">
          <label className="field">
            <span>Topic</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 study myths that waste your time"
              maxLength={140}
            />
          </label>

          <label className="field">
            <span>Notes / raw material (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste facts, bullet points, or a rough draft — Claude will shape it."
              rows={4}
            />
          </label>

          <div className="row">
            <label className="field">
              <span>Audience</span>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tone</span>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="row">
            <label className="field">
              <span>Slides: {slideCount}</span>
              <input
                type="range"
                min={4}
                max={8}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>Your handle (optional)</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@you"
                maxLength={32}
              />
            </label>
          </div>

          <div className="field">
            <span>Model</span>
            <div className="models">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`model-chip ${m.id === model ? "active" : ""}`}
                  onClick={() => setModel(m.id)}
                >
                  <b>{m.label}</b>
                  <small>{m.blurb}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Anthropic API key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(e) => setRememberKey(e.target.checked)}
              />
              remember on this device (localStorage only)
            </label>
          </label>

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button className="primary" onClick={onGenerate} disabled={busy}>
              {busy ? "Writing your deck…" : "Generate carousel"}
            </button>
            <button className="ghost" onClick={onDemo} disabled={busy}>
              Try the demo (no key)
            </button>
          </div>

          <p className="fineprint">
            100% client-side — calls go straight from your browser to api.anthropic.com and
            nowhere else. Get a key at console.anthropic.com.
          </p>
        </section>

        <section className="panel preview">
          {images.length === 0 ? (
            <div className="empty">
              <div className="empty-stack">
                <div /> <div /> <div />
              </div>
              <p>Your slides land here.</p>
              <p className="empty-sub">Hook → points → CTA, sized 1080×1350 for Instagram.</p>
            </div>
          ) : (
            <>
              <div className="preview-bar">
                <h2>{carousel?.topic}</h2>
                <button className="primary" onClick={downloadZip}>
                  Download all (.zip)
                </button>
              </div>
              <div className="slides">
                {images.map((url, i) => (
                  <figure key={i}>
                    <img src={url} alt={`Slide ${i + 1}`} />
                    <button className="ghost" onClick={() => downloadOne(url, i)}>
                      PNG ↓
                    </button>
                  </figure>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <footer>
        Built by Myan Patel · powered by Claude Fable 5 ·{" "}
        <a href="https://github.com/myanptl" target="_blank" rel="noreferrer">
          github.com/myanptl
        </a>
      </footer>
    </div>
  );
}
