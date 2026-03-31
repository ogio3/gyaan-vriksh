# The Streaming Pipeline — From Passage to Tree

This document traces the exact path your textbook passage takes from
the moment you click "Grow the Knowledge Tree" to the moment cards
appear on screen.

## Step 1: The Click (Browser)

**File**: `src/app/[locale]/(public)/demo/page.tsx`

When you click the button, `triggerExplore()` fires. It:
1. Creates an `AbortController` (so you can cancel mid-generation)
2. Sets up a root TreeNode (just the passage text, no children yet)
3. Sends a POST request to `/api/demo/explore`

```
fetch('/api/demo/explore', {
  method: 'POST',
  body: JSON.stringify({ passage: "Photosynthesis is..." }),
  signal: controller.signal,  // ← allows cancellation
})
```

## Step 2: Safety Check (Server)

**File**: `src/app/api/demo/explore/route.ts`

Before touching the AI, the server runs two safety checks:

1. **Rate limiting** — 5 requests per hour per IP address. This prevents
   abuse of the demo (each request costs real money for the AI API call).

2. **Input filtering** (`src/lib/safety/input-filter.ts`) — Scans the
   passage for Personally Identifiable Information (PII) like email
   addresses, phone numbers, or student IDs. If found, the PII is
   replaced with `[REDACTED]` before the text reaches Claude.

Why PII detection matters: Students might paste passages that contain
their name, school, or teacher's contact info. COPPA (US child privacy
law) requires we never send children's personal data to third parties.

## Step 3: System Prompt Construction (Server)

**File**: `src/lib/safety/system-prompts.ts`

The AI doesn't just see your passage. It sees a carefully constructed
system prompt that includes:

- **What to generate**: Card types (career, discovery, connection,
  innovation, mystery, history)
- **How to judge rarity**: N = common, R = interesting, SR = surprising,
  SSR = mind-blowing (max 1 per response)
- **What to exclude**: Gambling, alcohol, culturally sensitive content
- **Language complexity**: Adjusted by age bracket
- **Output format**: Structured JSON with specific fields

The system prompt is 2000+ characters. The student's passage is maybe
200 characters. The AI sees 10x more instructions than input. This is
how we control quality.

## Step 4: Streaming Generation (AI)

**File**: `src/app/api/demo/explore/route.ts`

```typescript
const result = streamObject({
  model: anthropic('claude-sonnet-4-6-20260217'),
  schema: branchSchema,  // ← Zod schema validates output structure
  system: systemPrompt,
  prompt: `Analyze this passage...\n\n${sanitizedText}`,
});
```

`streamObject()` is the most important function in the entire app.
It does three things simultaneously:

1. **Sends the request** to Claude's API
2. **Validates the response** against a Zod schema (type-safe)
3. **Streams partial results** — as Claude generates each card field
   by field, the `partialObjectStream` emits updates

The Zod schema (`branchSchema`) defines exactly what a valid card
looks like. If Claude outputs something unexpected, it's caught here.

## Step 5: NDJSON Emission (Server → Browser)

Instead of waiting for all cards and sending them at once, we stream
each completed card as a single JSON line:

```typescript
for await (const partial of result.partialObjectStream) {
  if (newCardCompleted) {
    controller.enqueue(
      encoder.encode(JSON.stringify(card) + '\n')
    );
  }
}
```

The browser receives:
```
{"branchType":"career","label":"Solar Panel Engineer","rarity":"R"}
{"branchType":"mystery","label":"The Oxygen Paradox","rarity":"SSR"}
```

Each line arrives as soon as Claude finishes generating that card.
The user sees cards appear one by one in real-time.

## Step 6: Client-Side Parsing (Browser)

**File**: `src/app/[locale]/(public)/demo/page.tsx`

The `streamBranches()` function reads the response stream line by line:

```typescript
const lines = buffer.split('\n');
for (const line of lines) {
  const card = JSON.parse(line);
  onBranch(card);  // ← triggers React state update
}
```

Each time `onBranch` is called, we add the new card to the tree and
React re-renders. Framer Motion animates the card's entrance.

## Step 7: Tree Layout Recomputation (Browser)

**File**: `src/components/TreeCanvas.tsx`

Every time the tree data changes, d3-hierarchy recomputes all positions:

```
Root (bottom)
  └── Card 1 (above)
  └── Card 2 (above)
  └── Card 3 (above, appears last)
```

The `useMemo` hook ensures this computation only runs when the tree
data actually changes, not on every render.

## Step 8: The Expand Loop

When you click a card, the same pipeline runs again — but with the
expand API instead of explore:

```
Click card "Solar Panel Engineer"
  → POST /api/demo/expand { label: "Solar Panel Engineer", depth: 1 }
  → Claude generates 3-4 sub-cards
  → NDJSON stream
  → New cards appear above the clicked card
  → Click again → depth 2 → infinite
```

This is the Rabbit Hole. There is no maximum depth. Every card can
spawn more cards. The tree grows as long as your curiosity does.

## The Full Pipeline (Summary)

```
Click → Rate Limit → PII Filter → System Prompt → Claude API
  → partialObjectStream → NDJSON → ReadableStream → line parse
  → TreeNode state update → d3 layout → SVG render → Animation
  → User sees a new card appear
```

Total latency: 2-4 seconds for the first card. Subsequent cards
appear every 1-2 seconds as Claude generates them.
