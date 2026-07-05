import type { Carousel } from "./types";

/** Pre-baked deck so people can feel the product before pasting a key. */
export const DEMO_CAROUSEL: Carousel = {
  topic: "Why your study sessions fail",
  slides: [
    { type: "hook", title: "You don't have a focus problem.", lines: [] },
    {
      type: "content",
      kicker: "01",
      title: "You have a re-entry problem.",
      lines: [
        "Every phone check costs ~23 minutes of refocus time.",
        "Four checks an hour means you never actually start.",
      ],
    },
    {
      type: "content",
      kicker: "02",
      title: "Willpower loses. Friction wins.",
      lines: [
        "Phone in another room beats any app blocker.",
        "Make the distraction 20 seconds away, minimum.",
      ],
    },
    {
      type: "content",
      kicker: "03",
      title: "Sessions need an exit ramp.",
      lines: [
        "End every session by writing the next first step.",
        "Tomorrow-you starts in 10 seconds, not 10 minutes.",
      ],
    },
    {
      type: "cta",
      title: "Save this for your next study block.",
      lines: ["Try one fix per week. Stack them."],
    },
  ],
};
