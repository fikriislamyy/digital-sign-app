# Feature: Apply the Linear / Modern Design System to the Landing Page

**Audience:** junior frontend developer (or an AI coding assistant) working on `apps/frontend`.
**Estimated effort:** 8-12 hours.
**Prerequisite reading:** `apps/frontend/src/app.css`, `apps/frontend/src/landing/`, `apps/frontend/src/lib/`, and the design system brief this ticket implements.

---

## 1. Scope

The landing page shipped in the previous ticket with an emerald/teal/cyan palette. This ticket replaces that visual language with the Linear / Modern design system: near-black canvas, layered ambient lighting, indigo accent, multi-layer shadows, precision micro-interactions.

**In scope**

- A centralised design-token layer in `app.css` that every component reads from.
- All ten components under `src/landing/`.
- One new library helper, a mouse-tracking spotlight action. Hero parallax is inline in the component.
- Three existing defects, listed in section 4.

**Out of scope**

`src/Dashboard.svelte` keeps its current look. It is 769 lines with its own scoped `<style>` block written before Tailwind existed in this project, and converting it is a bigger job than this ticket. Once the token layer here is in place, a follow-up ticket can port it cheaply because the tokens will already exist. Do not touch that file.

---

## 2. Three conflicts to settle before you write code

### 2.1 The accent colour reverses a previous instruction

The brief for the landing page said, in capitals, **"DO NOT use purple gradients like every other SaaS."** Indigo `#6366f1` was stripped out of the entire app for that reason.

This design system is built on `#5E6AD2`. That is indigo. It is four percent away in hue from the colour that was removed.

**Proceed with `#5E6AD2`.** The design system is specific, deliberate, and names Linear, Vercel and Raycast as references, so this is a considered choice rather than a drift back to the default. But it is a reversal, and whoever reviews the pull request should know it was made knowingly rather than by accident. Say so in the pull request description.

If the reviewer disagrees, the fix is cheap: the accent lives in exactly three lines of `app.css` after step 2, so swapping the hue is a one-file change.

### 2.2 The design system is written for React. This app is Svelte 5.

The brief uses React and Framer Motion vocabulary throughout: a `jsx` code fence, easing as the array `[0.16, 1, 0.3, 1]`, `viewport={{ once: true }}`, and `Menu` / `X` icon names from `lucide-react`. None of that runs here.

Translate as follows. Install nothing.

| Brief says | Build it as |
| --- | --- |
| Framer Motion easing `[0.16, 1, 0.3, 1]` | CSS `cubic-bezier(0.16, 1, 0.3, 1)`, already a token |
| `whileInView` with `once: true` | the existing `inview` action in `src/lib/inview.ts` |
| staggered children `0.08s` | `delay: i * 80` passed to `inview` |
| mouse-tracking spotlight (JSX sketch) | a Svelte action writing CSS custom properties, step 4 |
| scroll parallax on hero | `<svelte:window bind:scrollY>` plus a derived transform, step 5 |
| `Menu` / `X` icons | the inline SVG paths already in `Nav.svelte` |

The two easing values are identical. `[0.16, 1, 0.3, 1]` is just Framer's array spelling of the cubic-bezier already sitting in `app.css`.

### 2.3 The design system is dark-only, but a light mode shipped

Every token in the brief is a dark-mode value. There is no light palette, and the stated goal is "looking through frosted glass into a high-end application running at night." Linear's own site is dark-only.

The landing page currently has a working theme toggle with persistence.

**Keep the toggle and design the light mode properly.** Deleting a feature that shipped last week is the product owner's call, not this ticket's. But a naive colour inversion would produce exactly the generic result the brief warns against, so section 3 gives light values as deliberate pairs, and step 3 turns the ambient effects down in light mode because pools of light do not read against white.

Dark is the canonical mode. Light is a competent second expression, not an equal one.

---

## 3. The token layer

The single most important architectural decision in this ticket: **put every token in Tailwind v4's `@theme` block so it becomes a utility class.** Do not scatter arbitrary values like `bg-[#5E6AD2]` and `shadow-[0_0_0_1px_...]` through ten components. That is the duplication this system is meant to remove.

Tailwind v4 turns a `@theme` entry into utilities based on its namespace prefix. This was verified against the installed version, 4.3.3:

| You declare | You get |
| --- | --- |
| `--color-accent` | `bg-accent`, `text-accent`, `border-accent`, and `bg-accent/30` |
| `--shadow-card` | `shadow-card` |
| `--ease-expo` | `ease-expo` |
| `--animate-float` | `animate-float`, with `@keyframes` declared inside `@theme` |

### Colour tokens

| Token | Dark | Light |
| --- | --- | --- |
| `--color-bg-deep` | `#020203` | `#F4F5F8` |
| `--color-bg-base` | `#050506` | `#FCFCFD` |
| `--color-bg-elevated` | `#0a0a0c` | `#FFFFFF` |
| `--color-fg` | `#EDEDEF` | `#08090A` |
| `--color-fg-muted` | `#8A8F98` | `#60646C` |
| `--color-accent` | `#5E6AD2` | `#5E6AD2` |
| `--color-accent-bright` | `#6872D9` | `#4E58BE` |

The accent holds its hue across both modes; only its hover state darkens, because a brighter indigo on white loses contrast rather than gaining emphasis.

Borders and surfaces are white-alpha in dark and black-alpha in light. They are handled in step 3 with a `.dark` override rather than duplicated tokens.

### Everything else

- Radii: containers and cards `rounded-2xl`, buttons and inputs `rounded-lg`, icon tiles `rounded-xl`, pills `rounded-full`. These are stock Tailwind, so no tokens needed.
- Shadows: three tokens, `--shadow-card`, `--shadow-card-hover`, `--shadow-accent`. Each is the multi-layer stack from the brief.
- Motion: one easing token, `--ease-expo`. Durations stay inline because they vary per interaction.

**Keep the layout idiom already in the codebase:** `mx-auto max-w-7xl px-4 sm:px-6`. The brief says `container`, but Tailwind v4 dropped the configurable container plugin, so the existing pattern is both correct and already consistent across every section.

---

## 4. Three defects to fix on the way through

The design system brief asks you to leave the codebase cleaner than you found it. These were found while surveying the code and all three are small.

### 4.1 `bun run check` fails with 12 errors

Every component reports `No Svelte configuration found in vite config`. The landing page ticket's checklist claimed this passed; it does not, and the failure was reported at the time as a false positive. It is not. `svelte-check` cannot find the Svelte configuration because the project has no `svelte.config.js`.

It is not caused by Tailwind. The failure reproduces with the Tailwind plugin removed.

Verified fix, two lines, takes the run from 12 errors to 0. Step 1.

### 4.2 The pricing tilt moves all three cards at once

`Pricing.svelte` holds one `tilt` state for the whole section, but applies `style="transform: ... rotateX({tilt.x}deg) ..."` inside the `{#each}`, so it lands on every card. Hovering the middle card tilts all three in unison. The `idx !== 1` guard only stops the other cards from writing the value; it does not stop them reading it. `onmouseleave` is bound on every card too, so leaving card one resets the tilt while you are still over card two.

Fixed in step 7 by extracting a component so each card owns its own state.

### 4.3 Seven placeholder links fail accessibility linting

`Footer.svelte` has seven `href="#"` anchors, each raising `'#' is not a valid href attribute`. Fixed in step 9.

---

## 5. Files to create and change

**Create**

| # | Path | Purpose |
| --- | --- | --- |
| 1 | `svelte.config.js` | fixes the type check |
| 2 | `src/lib/spotlight.ts` | mouse-tracking radial glow action |
| 3 | `src/landing/Backdrop.svelte` | the four-layer ambient background |
| 4 | `src/landing/TiltCard.svelte` | one pricing card, owning its own tilt |

**Change**

| # | Path | Change |
| --- | --- | --- |
| 5 | `src/app.css` | the whole token layer |
| 6 | `src/landing/Hero.svelte` | parallax, gradient display type, new backdrop |
| 7 | `src/landing/Nav.svelte` | translucent chrome, accent CTA |
| 8 | `src/landing/Features.svelte` | asymmetric bento grid, spotlight cards |
| 9 | `src/landing/Pricing.svelte` | uses `TiltCard` |
| 10 | `src/landing/Testimonials.svelte` | restyle, spotlight |
| 11 | `src/landing/FinalCta.svelte` | restyle, accent glow |
| 12 | `src/landing/Footer.svelte` | restyle, fix the seven links |
| 13 | `src/landing/ThemeToggle.svelte` | restyle to the new tokens |
| 14 | `src/landing/DeviceMockup.svelte` | recolour to indigo |
| 15 | `index.html` | favicon back to indigo |

Checkpoints: the page should still render after step 2, the hero should look right after step 5, and the page is complete after step 10.

---

## 6. Step-by-step implementation

### Step 1 — Fix the type check first

Create `apps/frontend/svelte.config.js`:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
```

Then confirm:

```bash
cd apps/frontend && bun run check
```

You should see `0 ERRORS`. Do this before anything else so that for the rest of the ticket the type checker is a tool you can trust rather than noise you have learned to ignore.

### Step 2 — Write the token layer

Replace the `@theme` block in `src/app.css` and extend the base layer. Keep the `@import`, the `@custom-variant`, and the reduced-motion block exactly as they are.

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-heading: 'Inter', 'Outfit', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Inter', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;

  /* Light is the default; the .dark block below overrides. */
  --color-bg-deep: #f4f5f8;
  --color-bg-base: #fcfcfd;
  --color-bg-elevated: #ffffff;
  --color-fg: #08090a;
  --color-fg-muted: #60646c;
  --color-accent: #5e6ad2;
  --color-accent-bright: #4e58be;

  /* Multi-layer shadows. Never a single shadow. */
  --shadow-card:
    0 0 0 1px rgb(255 255 255 / 0.06),
    0 2px 20px rgb(0 0 0 / 0.4),
    0 0 40px rgb(0 0 0 / 0.2);
  --shadow-card-hover:
    0 0 0 1px rgb(255 255 255 / 0.1),
    0 8px 40px rgb(0 0 0 / 0.5),
    0 0 80px rgb(94 106 210 / 0.1);
  --shadow-accent:
    0 0 0 1px rgb(94 106 210 / 0.5),
    0 4px 12px rgb(94 106 210 / 0.3),
    inset 0 1px 0 0 rgb(255 255 255 / 0.2);

  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);

  --animate-float: float 9s ease-in-out infinite;
  --animate-pulse-glow: pulse-glow 8s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-20px) rotate(1deg); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
}

/* Dark is the canonical mode. */
:root.dark {
  --color-bg-deep: #020203;
  --color-bg-base: #050506;
  --color-bg-elevated: #0a0a0c;
  --color-fg: #ededef;
  --color-fg-muted: #8a8f98;
  --color-accent-bright: #6872d9;
}

@layer base {
  html { scroll-behavior: smooth; }

  body {
    @apply bg-bg-base font-[family-name:var(--font-body)] text-fg-muted antialiased;
  }

  h1, h2, h3, h4 {
    @apply font-[family-name:var(--font-heading)] font-semibold tracking-tight text-fg;
  }

  /* Focus rings are prominent by design. This is a desktop-app feel. */
  :focus-visible {
    @apply ring-2 ring-accent/50 ring-offset-2 ring-offset-bg-base outline-none;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  /* Scroll reveal, unchanged from the landing ticket. */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition:
      opacity 600ms var(--ease-expo),
      transform 600ms var(--ease-expo);
  }
  .reveal.is-visible { opacity: 1; transform: none; }

  /* Card surface. One class so ten components stop repeating it. */
  .surface {
    @apply rounded-2xl border border-black/[0.06] bg-black/[0.02];
    @apply dark:border-white/[0.06] dark:bg-gradient-to-b dark:from-white/[0.08] dark:to-white/[0.02];
    box-shadow: var(--shadow-card);
    transition:
      border-color 250ms var(--ease-expo),
      box-shadow 250ms var(--ease-expo),
      transform 250ms var(--ease-expo);
  }
  .surface:hover {
    @apply border-black/[0.1] dark:border-white/[0.1];
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-4px);
  }

  /* Mouse-tracking spotlight. The `spotlight` action sets --mx and --my. */
  .spotlight { position: relative; }
  .spotlight::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity 250ms var(--ease-expo);
    background: radial-gradient(
      300px circle at var(--mx, 50%) var(--my, 50%),
      rgb(94 106 210 / 0.15),
      transparent 70%
    );
  }
  .spotlight:hover::before { opacity: 1; }

  /* Display type gets a vertical gradient fill for dimensionality. */
  .text-gradient {
    @apply bg-clip-text text-transparent;
    @apply bg-gradient-to-b from-black via-black/90 to-black/60;
    @apply dark:from-white dark:via-white/95 dark:to-white/70;
  }

  /* 64px technical grid. */
  .grid-overlay {
    background-image:
      linear-gradient(to right, currentColor 1px, transparent 1px),
      linear-gradient(to bottom, currentColor 1px, transparent 1px);
    background-size: 64px 64px;
  }

  /* Noise, as an inline SVG so it costs no request. */
  .noise::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
}
```

Two things worth understanding rather than copying.

**Why `:root.dark` overrides the variables instead of duplicating tokens.** Tailwind generates `bg-bg-base` once, pointing at `var(--color-bg-base)`. Redefining that variable under `.dark` flips every usage at once. The alternative, writing `bg-white dark:bg-bg-base` on every element, is the duplication this layer exists to prevent.

**Why `.surface` is a class and not a component.** Ten components need the same glass treatment but wrap different content. A utility class composes; a wrapper component would force every caller through a slot for no benefit.

### Step 3 — Build the ambient backdrop

Create `src/landing/Backdrop.svelte`. This is the four-layer background system, in one place, used by the page rather than copied into each section.

```svelte
<!--
  Layer 1 base gradient, 2 noise, 3 floating blobs, 4 grid.
  Fixed and behind everything. Decorative, so hidden from assistive tech.
  Blobs are far weaker in light mode: pools of light do not read on white.
-->
<div class="noise pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
  <!-- 1. Base radial gradient -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ffffff_0%,#fcfcfd_50%,#f4f5f8_100%)] dark:bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]"></div>

  <!-- 3. Animated gradient blobs -->
  <div class="absolute -top-[300px] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 animate-float rounded-full bg-accent/[0.06] blur-[150px] dark:bg-accent/25"></div>
  <div class="absolute top-1/4 -left-[200px] h-[800px] w-[600px] animate-float rounded-full bg-fuchsia-500/[0.04] blur-[120px] [animation-delay:-3s] dark:bg-fuchsia-500/15"></div>
  <div class="absolute top-1/2 -right-[150px] h-[700px] w-[500px] animate-float rounded-full bg-indigo-500/[0.04] blur-[100px] [animation-delay:-6s] dark:bg-indigo-500/12"></div>
  <div class="absolute bottom-0 left-1/3 h-[600px] w-[800px] animate-pulse-glow rounded-full bg-accent/[0.03] blur-[130px] dark:bg-accent/10"></div>

  <!-- 4. Technical grid -->
  <div class="grid-overlay absolute inset-0 text-black opacity-[0.03] dark:text-white dark:opacity-[0.02]"></div>
</div>
```

Add it once, at the top of `Landing.svelte`, above `<Nav />`. Then delete the per-section blob markup from `Hero.svelte`, because it is now redundant and two overlapping blob systems will read as muddy rather than atmospheric.

### Step 4 — Write the spotlight action

Create `src/lib/spotlight.ts`:

```ts
/**
 * Svelte action. Writes the cursor position into CSS custom properties so a
 * radial gradient can follow it. Pair with the `.spotlight` class in app.css.
 *
 * Usage:  <article class="surface spotlight" use:spotlight>
 *
 * Position is written on an animation frame rather than on every mousemove
 * event, so a fast cursor cannot outrun the browser's paint budget.
 */
export function spotlight(node: HTMLElement) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let frame = 0;

  function onMove(event: MouseEvent) {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      node.style.setProperty('--my', `${event.clientY - rect.top}px`);
      frame = 0;
    });
  }

  node.addEventListener('mousemove', onMove);

  return {
    destroy() {
      node.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    },
  };
}
```

**Why CSS custom properties rather than Svelte state.** A `$state` update re-runs the component's render for every mouse move. Writing two custom properties lets the browser repaint one gradient and touch nothing else. On a page with a dozen spotlit cards this is the difference between smooth and not.

### Step 5 — Rebuild the hero

Open `Hero.svelte`. Delete the blob block, which now lives in `Backdrop.svelte`. Add scroll parallax and the gradient display type.

```svelte
<script lang="ts">
  import DeviceMockup from './DeviceMockup.svelte';
  import { inview } from '../lib/inview';

  let scrollY = $state(0);
  let reduced = $state(false);

  $effect(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Fade out over the first half-screen, shrink slightly, drift down.
  // Clamped so the values stay sane past the fold.
  let progress = $derived(reduced ? 0 : Math.min(scrollY / (window.innerHeight * 0.5), 1));
  let heroOpacity = $derived(1 - progress);
  let heroScale = $derived(1 - progress * 0.05);
  let heroShift = $derived(progress * 100);
</script>

<svelte:window bind:scrollY />

<section id="hero" class="relative flex min-h-screen items-center pt-32 pb-20">
  <div
    class="mx-auto w-full max-w-7xl px-4 sm:px-6"
    style="opacity: {heroOpacity}; transform: translateY({heroShift}px) scale({heroScale});"
  >
    <div class="mx-auto max-w-3xl text-center">
      <p class="reveal inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-xs tracking-widest text-accent uppercase" use:inview>
        <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
        Next-Gen Digital Signatures
      </p>

      <h1 class="reveal text-gradient mt-8 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl lg:text-8xl" use:inview={{ delay: 80 }}>
        High-Assurance Digital Signature Platform
      </h1>

      <p class="reveal mx-auto mt-8 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg lg:text-xl" use:inview={{ delay: 160 }}>
        Engineered with Bun, ElysiaJS, Svelte 5, and Drizzle ORM + PostgreSQL
        for extreme speed and transactional integrity.
      </p>

      <div class="reveal mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row" use:inview={{ delay: 240 }}>
        <a
          href="#/app"
          class="shadow-accent inline-flex w-full items-center justify-center rounded-lg bg-accent px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 ease-expo hover:bg-accent-bright active:scale-[0.98] sm:w-auto"
        >
          Start signing free
        </a>

        <a
          href="#features"
          class="inline-flex w-full items-center justify-center rounded-lg bg-black/[0.04] px-7 py-3.5 text-sm font-medium text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)] transition-all duration-200 ease-expo hover:bg-black/[0.07] active:scale-[0.98] sm:w-auto dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
        >
          See how it works
        </a>
      </div>
    </div>

    <div class="reveal mt-24" use:inview={{ delay: 320 }}>
      <DeviceMockup />
    </div>
  </div>
</section>
```

**Note the headline is one sentence again.** The previous version split it across a gradient span in the middle, which produced three differently-coloured chunks. The design system wants a single vertical gradient across the whole display line, so `.text-gradient` goes on the `h1` itself.

**Note the buttons are `rounded-lg`, not `rounded-2xl`.** The radius table is specific: containers and cards get 16px, buttons get 8px. Uniform radius everywhere is one of the listed anti-patterns.

### Step 6 — Rebuild the features as an asymmetric bento grid

`Features.svelte` currently renders four equal cards in a four-column row. The design system explicitly forbids that: "Feature grids should NOT be uniform."

Keep the four feature objects and their copy exactly as they are. That text came from the dashboard and two previous tickets have preserved it. Change only the grid and the card chrome.

Replace the `<ul>` with a six-column grid and give each item its own span:

```svelte
<ul class="mt-20 grid grid-cols-1 gap-4 md:grid-cols-6 lg:auto-rows-[180px]">
  {#each features as feature, i}
    <li class="reveal {spans[i]}" use:inview={{ delay: i * 80 }}>
      <article class="surface spotlight group flex h-full flex-col p-6 lg:p-8" use:spotlight>
        <div class="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-black/10 bg-black/[0.03] text-accent transition-transform duration-200 ease-expo group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.03]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d={feature.icon} />
          </svg>
        </div>
        <span class="font-mono text-xs tracking-widest text-fg-muted">{feature.number}</span>
        <h3 class="mt-2 text-xl font-semibold text-fg">{feature.title}</h3>
        <p class="mt-3 text-sm leading-relaxed text-fg-muted">{feature.text}</p>
      </article>
    </li>
  {/each}
</ul>
```

with this in the script, next to the `features` array:

```ts
// Asymmetric bento. Card 0 is the hero tile, twice as tall and twice as wide.
// Single column on mobile; the spans only apply from md upward.
const spans = [
  'md:col-span-4 md:row-span-2',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-6',
];
```

Import `spotlight` alongside `inview` at the top.

### Step 7 — Fix and restyle the pricing cards

Create `src/landing/TiltCard.svelte`. Extracting a component is what fixes defect 4.2: each instance gets its own `tilt`, so state cannot leak sideways.

```svelte
<script lang="ts">
  interface Props {
    popular?: boolean;
    children: import('svelte').Snippet;
  }

  let { popular = false, children }: Props = $props();

  // Own state per card. This is the fix: the previous version shared one
  // `tilt` across the whole section, so hovering one card tilted all three.
  let tilt = $state({ x: 0, y: 0 });
  let enabled = $state(true);

  $effect(() => {
    enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  function onMove(event: MouseEvent) {
    if (!enabled) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tilt = {
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -6,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 6,
    };
  }
</script>

<article
  onmousemove={onMove}
  onmouseleave={() => (tilt = { x: 0, y: 0 })}
  style="transform: perspective(1000px) rotateX({tilt.x}deg) rotateY({tilt.y}deg);"
  class="surface flex h-full flex-col p-8 transition-transform duration-200 ease-expo {popular
    ? 'border-accent/30 dark:border-accent/30'
    : ''}"
>
  {@render children()}
</article>
```

Then in `Pricing.svelte`, delete the `tilt` state, `onMove` and `onLeave`, import `TiltCard`, and wrap each plan's contents in `<TiltCard popular={plan.popular}>`. The tilt maximum drops from 8 degrees to 6, because the brief caps movement at "subtle".

Give the popular card its glow with `shadow-accent` on the card and keep the badge, but drop the `ring-2`. A prominent ring contradicts "borders should be nearly invisible"; the accent-tinted border plus the glow is how this system signals emphasis.

### Step 8 — Restyle the remaining sections

These are mechanical. For each of `Testimonials.svelte`, `FinalCta.svelte`, `Nav.svelte`, `ThemeToggle.svelte` and `DeviceMockup.svelte`:

- Replace every `emerald`, `teal` and `cyan` class with `accent`, or with `fg` / `fg-muted` where the colour was carrying text rather than accent meaning.
- Replace hand-written card classes with `surface`, and add `spotlight` plus `use:spotlight` where the surface is large enough to justify it. Testimonial and CTA panels yes; the theme toggle no.
- Change section padding to `py-16 md:py-24 lg:py-32`.
- Add `border-t border-black/[0.06] dark:border-white/[0.06]` to each section for the divider rhythm the brief describes.
- Section eyebrow labels become `font-mono text-xs tracking-widest uppercase text-fg-muted`.

In `Nav.svelte` the scrolled state becomes `bg-bg-base/80 backdrop-blur-xl` with a hairline bottom border, and the "Open the app" button takes `bg-accent shadow-accent` so the primary action reads as primary.

### Step 9 — Fix the footer links

Replace the seven `href="#"` anchors. Three of them have real destinations already in the page and should use them: Features, Pricing, and the app link. The other four are genuine placeholders for pages that do not exist.

For the placeholders, render a `<span>` rather than an anchor:

```svelte
<li><span class="text-sm text-fg-muted/60">About</span></li>
```

A link that goes nowhere is worse than plain text: it is announced as a link, it takes keyboard focus, and it does nothing when activated. Turn each one back into an `<a>` when its page exists.

### Step 10 — Put the favicon back to indigo

In `index.html`, change `fill='%2310b981'` to `fill='%235E6AD2'`.

The landing ticket moved it to emerald to match that palette. It moves back with the accent. This is the one line most likely to be forgotten, because nothing on the page looks wrong when it is stale.

---

## 7. How to test manually

```bash
cd apps/frontend && bun run check   # must report 0 ERRORS
bun run dev:frontend                # from the repository root
```

| Check | Expected |
| --- | --- |
| Background | Never flat. Gradient, grain, blobs and grid all visible. |
| Blobs | Drift slowly and continuously, roughly nine seconds per cycle. |
| Hero parallax | Content fades, shrinks slightly and drifts down as you scroll. |
| Spotlight | A soft indigo pool follows the cursor across feature and testimonial cards. |
| Pricing tilt | **Only the hovered card tilts.** This is the regression fix; check all three. |
| Card hover | Lifts about 4px, border brightens, shadow deepens. Never more than 8px. |
| Buttons | `rounded-lg`, not `rounded-2xl`. Primary has an accent glow. Active state scales to 0.98. |
| Focus | Tab through. Every stop shows a clear indigo ring offset from the background. |
| Theme toggle | Both modes are coherent. Light keeps the indigo accent and much weaker blobs. |
| Reduced motion | Enable it in your OS. No blobs, no parallax, no tilt, no spotlight. Everything still readable. |
| Dashboard | `/#/app` still renders exactly as before. This ticket does not touch it. |
| Mobile at 375px | Single column. Bento spans collapse. No horizontal scrollbar. |
| Favicon | Indigo in the browser tab. |

---

## 8. Acceptance checklist

- [ ] `bun run check` reports 0 errors, and `svelte.config.js` exists.
- [ ] Hovering one pricing card tilts only that card.
- [ ] No `href="#"` remains in `Footer.svelte`.
- [ ] Every colour, shadow and easing value comes from `@theme`. No `#5E6AD2` literal outside `app.css`.
- [ ] No emerald, teal or cyan class remains under `src/landing/`.
- [ ] The backdrop has all four layers and is declared once, not per section.
- [ ] Blobs are 500px or larger with 100px or more of blur.
- [ ] Every elevated surface carries a multi-layer shadow, never a single one.
- [ ] Display type uses the vertical gradient fill.
- [ ] The feature grid is asymmetric, with one tile spanning four columns and two rows.
- [ ] Hover translation is 8px or less everywhere; active states scale to 0.98.
- [ ] All transitions are 200-300ms and use `ease-expo`.
- [ ] No pure black and no pure white as a background or text colour.
- [ ] Focus rings are visible on every interactive element in both themes.
- [ ] `prefers-reduced-motion` disables blobs, parallax, spotlight and tilt.
- [ ] The four feature descriptions and the `h1` wording are unchanged.
- [ ] `<title>` and `<meta name="description">` are unchanged.
- [ ] `src/Dashboard.svelte` is untouched and still works at `/#/app`.
- [ ] The pull request description notes the deliberate return to an indigo accent.

---

## 9. Common mistakes to avoid

**Writing `bg-[#5E6AD2]` in a component.** The token exists so that `bg-accent` works. Arbitrary hex values scattered through ten files are exactly what this ticket removes.

**Installing Framer Motion.** It is React. The easing array in the brief is the cubic-bezier already in `app.css`.

**Leaving the blobs in `Hero.svelte`.** Two overlapping blob systems read as muddy, not atmospheric. `Backdrop.svelte` owns them now.

**Using one radius everywhere.** Cards 16px, buttons 8px, icon tiles 12px, pills full. The variation is deliberate.

**Making borders visible.** Six to ten percent opacity. If you can clearly see the border, it is too strong.

**Large hover movements.** Under 8px. This system is precise, not playful.

**Bouncy easing.** Expo-out only. No spring, no overshoot.

**Using `$state` for the spotlight position.** It re-renders the component on every mouse move. Write CSS custom properties instead.

**Forgetting `aria-hidden` on the backdrop.** It is four nested decorative divs and a screen reader has no use for any of it.

**Skipping the reduced-motion guards.** Four separate effects here move without being asked: blobs, parallax, spotlight and tilt. Each needs its own escape, and the global CSS block only covers the first.

**Shipping the placeholder testimonials.** Still placeholder, still must be replaced with real permissioned quotes before this page goes live. Restyling them does not make them true.
