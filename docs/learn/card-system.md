# The Card System — Rarity, Types, and Why They Matter

## Why Trading Cards?

A knowledge card is just information with a frame around it. But the
frame changes everything.

When you see a card with a gold border and "★★★★ SSR" in the corner,
your brain does something it wouldn't do for a plain paragraph: it
pays attention. It wonders what makes this one special. It wants to
find more.

This is not gamification. There are no points. No leaderboard. No
streak counter. The card format simply leverages a truth about human
psychology: we are collectors by nature. We notice rarity. We
remember what surprised us.

## The Six Card Types

Each card type represents a different direction of exploration:

| Type | Color | What It Explores |
|------|-------|-----------------|
| `career` | Blue (#2D5BFF) | Jobs and career paths. "People get paid to do THIS?" |
| `discovery` | Purple (#7C3AED) | Scientific findings. "I had no idea this existed." |
| `connection` | Green (#059669) | Links between fields. "Wait, THAT is related to THIS?" |
| `innovation` | Orange (#F4A236) | Technology and inventions. "Someone actually built this." |
| `mystery` | Red (#DC2626) | Unsolved questions. "Nobody knows the answer yet?" |
| `history` | Amber (#D97706) | Origin stories. "This is how it all started." |

The colors are chosen for instant recognition. After seeing a few
cards, you know what purple means without reading the label.

## The Rarity System

Rarity is judged by the AI, not by a random number generator. The
prompt tells Claude:

```
Rarity (based on how surprising and non-obvious the card is):
- N (Normal): Common knowledge, expected connections
- R (Rare): Interesting, not immediately obvious
- SR (Super Rare): Genuinely surprising, makes you rethink the topic
- SSR (Secret Super Rare): Mind-blowing, paradigm-shifting (max 1)
```

This means rarity reflects actual depth of insight, not luck. An SSR
card for "Photosynthesis" might be: "Coral reefs perform more
photosynthesis than rainforests." That's genuinely surprising —
it earns its rarity.

### Visual Treatment by Rarity

| Rarity | Stars | Border Color | Visual Effect |
|--------|-------|-------------|---------------|
| N | ★ | Gray (#71717a) | None |
| R | ★★ | Blue (#2D5BFF) | Subtle glow |
| SR | ★★★ | Purple (#7C3AED) | Glow + drop shadow |
| SSR | ★★★★ | Gold (#D4A017) | Holographic rainbow overlay |

The SSR holographic effect is a rainbow gradient at 15% opacity that
overlays the card background. It's subtle enough to feel premium
without being distracting.

## Card Dimensions

Cards use the standard TCG aspect ratio: 63:88 (same as a real
trading card like Magic: The Gathering or Pokemon).

- Width: 180px
- Height: 252px
- Border radius: 12px

This ratio feels familiar in your hand (or on your screen) because
your brain has seen thousands of cards shaped exactly like this.

## The Secret Bloom (Golden Cards)

When a student discovers a Hidden Sprout on the landing page and
clicks it, the tree that grows uses a special golden color scheme:

- All borders: Gold (#D4A017)
- Grid background: Golden dots
- Link lines: Golden curves
- Banner: "You found a secret seed"
- Footer: "This is a secret tree. Only the curious find it."

These golden cards are the same data structure as regular cards —
the only difference is the color palette. The `secretMode` prop on
TreeCanvas switches the entire visual language to gold.

## Why Not Gamification?

Gamification (points, streaks, leaderboards) works by creating
external motivation: "I must log in today or I'll lose my streak."

This app creates internal motivation: "I wonder what happens if I
click THIS card."

The difference matters for children. External motivation produces
compliance. Internal motivation produces curiosity. We chose
curiosity.
