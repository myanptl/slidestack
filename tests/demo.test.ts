import { describe, test, expect } from 'vitest'
import { DEMO_CAROUSEL } from '../src/lib/demo'
import { SLIDE_W, SLIDE_H } from '../src/lib/render'
import { THEME } from '../src/lib/themes'

/**
 * The demo deck is what everyone sees before they paste a key, so it is
 * effectively the landing page. A malformed slide here breaks the first
 * impression, and nothing else validates its shape.
 */
describe('DEMO_CAROUSEL', () => {
  test('has a topic and slides', () => {
    expect(DEMO_CAROUSEL.topic).toBeTruthy()
    expect(DEMO_CAROUSEL.slides.length).toBeGreaterThan(1)
  })

  test('opens on a hook slide', () => {
    expect(DEMO_CAROUSEL.slides[0].type).toBe('hook')
  })

  test('every slide has a title and a well-formed lines array', () => {
    for (const [i, slide] of DEMO_CAROUSEL.slides.entries()) {
      expect(slide.title, `slide ${i} has no title`).toBeTruthy()
      expect(Array.isArray(slide.lines), `slide ${i} lines is not an array`).toBe(true)
      for (const line of slide.lines) {
        expect(typeof line).toBe('string')
        expect(line.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('content slides carry a kicker so the deck numbers correctly', () => {
    for (const slide of DEMO_CAROUSEL.slides.filter((s) => s.type === 'content')) {
      expect(slide.kicker).toBeTruthy()
    }
  })
})

describe('render constants', () => {
  test('slides are the 4:5 portrait Instagram expects', () => {
    expect(SLIDE_W).toBe(1080)
    expect(SLIDE_H).toBe(1350)
    expect(SLIDE_H / SLIDE_W).toBeCloseTo(1.25, 5)
  })
})

describe('THEME', () => {
  test('every colour is a full hex value', () => {
    for (const key of ['bg', 'ink', 'accent', 'soft'] as const) {
      expect(THEME[key], `${key} is not a hex colour`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
