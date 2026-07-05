export type SlideType = "hook" | "content" | "cta";

export interface Slide {
  type: SlideType;
  /** Big headline. Hook: the scroll-stopper. Content: the point. CTA: the closer. */
  title: string;
  /** 0-3 short supporting lines. Empty for hook slides that stand alone. */
  lines: string[];
  /** Tiny label above the title, e.g. "MYTH #2" or "STEP 3". Optional. */
  kicker?: string;
}

export interface Carousel {
  topic: string;
  slides: Slide[];
}

export interface ThemeSpec {
  id: string;
  name: string;
  bg: string;
  ink: string;
  accent: string;
  /** secondary surface used for kicker chips / dividers */
  soft: string;
}

export type ModelId = "claude-fable-5" | "claude-opus-4-8" | "claude-sonnet-5";
