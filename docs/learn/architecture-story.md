# Architecture Story — Why We Built It This Way

## The Big Picture

```
You (Browser)
    │
    │ Click "Grow the Knowledge Tree"
    │
    ▼
Next.js Server (proxy.ts → API route)
    │
    │ Sends your passage to Claude AI
    │
    ▼
Claude AI (Anthropic API)
    │
    │ Generates knowledge cards (streaming)
    │
    ▼
Your Browser (TreeCanvas.tsx)
    │
    │ Cards appear one by one, growing upward
    │
    ▼
You click a card → repeat forever
```

Every technology choice in this project was made for a specific reason.
Here's the story behind each one.

## Next.js 16 — The Framework

**What it is**: A React framework that runs code on both the server and
the browser.

**Why we chose it**: The demo page needs to work instantly — no loading
spinner, no "please wait." Next.js 16's Partial Prerendering (PPR) lets
us send the page shell immediately (static HTML) while streaming the
dynamic parts (AI responses) in parallel.

**The alternative we rejected**: A plain React app (Vite) would require
the browser to download all JavaScript before showing anything. That's
a few seconds of blank screen. For a demo where the first impression
IS the product, those seconds are fatal.

**Key file**: `src/proxy.ts` — This is where every request enters the
app. It handles password protection, locale routing, and authentication.
In Next.js 16, this replaced the old `middleware.ts` convention.

## TypeScript — The Language

**What it is**: JavaScript with type annotations. Instead of `function
add(a, b)`, you write `function add(a: number, b: number): number`.

**Why we chose it**: This project has many data shapes — TreeNode,
BranchData, CardRarity, AgeBracket. Without types, you'd constantly
wonder "does this object have a `rarity` field?" TypeScript catches
these mistakes before the code runs.

**Where to look**: `src/types/tree.ts` and `src/types/database.ts`
define every data shape in the entire application.

## Vercel AI SDK — The AI Connection

**What it is**: A library that connects to AI models (Claude, GPT, etc.)
and handles streaming responses.

**Why we chose it**: Claude's API returns text one token at a time
(streaming). Without a library, you'd need to handle chunked HTTP
responses, parse partial JSON, manage abort signals, and retry on
failure. The AI SDK does all of this in one function call: `streamObject()`.

**The critical function**: `streamObject()` sends a prompt to Claude and
returns a stream of partial objects. As Claude generates each knowledge
card, we receive it immediately — not after the entire response is
complete. This is why cards appear one by one.

**Key files**:
- `src/app/api/demo/explore/route.ts` — Initial tree generation
- `src/app/api/demo/expand/route.ts` — Expanding a card deeper

## NDJSON — The Streaming Format

**What it is**: Newline-Delimited JSON. Each line is a complete JSON
object. Example:

```
{"branchType":"career","label":"Solar Panel Engineer","rarity":"R"}
{"branchType":"mystery","label":"The Oxygen Paradox","rarity":"SR"}
```

**Why we chose it**: We tried three approaches:
1. **Regex parsing** of streamed text — broke when field order changed
2. **Full JSON parsing** of accumulated text — broke on partial objects
3. **NDJSON** — each line is independently parseable. Cannot break.

The server uses `partialObjectStream` from the AI SDK, which fires
whenever a new complete card is available. We serialize each card as
one JSON line. The browser reads line by line with `ReadableStream`.

**Key insight**: The simplest solution is usually the most reliable.
NDJSON has been used in logging systems for decades because it's
impossible to corrupt — each line stands alone.

## d3-hierarchy — The Tree Layout

**What it is**: A library that computes x/y positions for nodes in a
tree structure. It doesn't draw anything — it just does math.

**Why we chose it**: Laying out a tree so nodes don't overlap is a
surprisingly hard math problem (the Reingold-Tilford algorithm). d3
solves this in one function call. We then use SVG to draw the result.

**The bottom-to-top trick**: d3 layouts grow top-to-bottom by default.
We invert the Y axis (`maxTotalY - y`) so the tree grows upward —
like a real tree growing toward the sky.

**Key file**: `src/components/TreeCanvas.tsx`, inside the `useMemo`
that computes the layout.

## Framer Motion — The Animations

**What it is**: A React animation library that makes elements smoothly
appear, move, and disappear.

**Why we chose it**: When a new card streams in, it needs to:
1. Fade in (opacity 0 → 1)
2. Scale up (0.6 → 1.0)
3. Move to its computed position
4. All with a spring physics feel (not linear)

Framer Motion's `<motion.g>` component does all of this with props.
The `AnimatePresence` wrapper handles exit animations when the tree
restructures.

**Respecting users**: We check `prefers-reduced-motion` and disable
all animations for users who have that accessibility setting enabled.

## SVG + foreignObject — The Card Rendering

**What it is**: SVG is a drawing format (shapes, lines, text) that
lives inside HTML. `foreignObject` lets you put regular HTML inside SVG.

**Why this combination**: The tree lines (curves between cards) must be
SVG — you can't draw bezier curves with HTML divs. But card content
(text wrapping, CSS styling) is much easier with HTML. `foreignObject`
bridges the two worlds.

**The click problem we solved**: `foreignObject` elements can intercept
mouse clicks before they reach the parent SVG `<g>` element. Solution:
set `pointerEvents: "none"` on every `foreignObject`, then place a
transparent `<rect>` on top of each card to catch clicks. This ensures
100% click reliability.

## Supabase — The Database (Full Platform)

**What it is**: An open-source Firebase alternative. PostgreSQL database
+ authentication + Row Level Security.

**Why we chose it**: The full platform needs three user roles (student,
teacher, parent) with different data access rules. Supabase's Row Level
Security (RLS) enforces these rules at the database level — even if
the application code has a bug, a student can never see another
student's data.

**For the demo**: Supabase is not required. The demo uses only the
Claude API. This was a deliberate architecture decision: the demo
must work with zero infrastructure.

## What We Didn't Use (And Why)

| Technology | Why Not |
|-----------|---------|
| Gamification (points, streaks) | Manipulates behavior. Exploration is the reward. |
| User tracking / analytics | Privacy-first. We don't know who you are. |
| Loading spinners | Replaced with breathing animations + streaming. |
| Login for demo | Friction kills curiosity. One click to AHA. |
| Multiple AI providers | Complexity. Claude Sonnet 4 does everything we need. |
