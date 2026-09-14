# Feature: Redesign Landing Page to Match designprompts.dev Modern Dark Aesthetic

**Audience:** junior frontend developer or cheaper AI model
**Estimated effort:** 10-14 hours
**Prerequisite reading:** designprompts.dev (reference), current `apps/frontend/src/app.css`, and all landing components

---

## 1. Design Direction

The target is the **modern dark** aesthetic of [designprompts.dev](https://www.designprompts.dev/). Key visual characteristics:

- **Cleaner, more minimal** than the current Linear system
- **Larger, bolder typography** with lots of breathing room
- **Ultra-refined animations** — subtle, smooth, purposeful
- **Deep black backgrounds** with selective accent light
- **Glass-morphic surfaces** with precise transparency
- **Generous whitespace** (padding, margins, gaps)
- **Premium, professional feel** — less "startup", more "established"
- **Color restraint** — one strong accent, heavy use of grays and black
- **Grid-based precision** — everything aligns perfectly
- **Hover states are understated** — opacity shifts, not movement
- **Minimal shadows** — mostly relied on layered transparency
- **Typography hierarchy** is extreme — huge headlines, tiny labels

---

## 2. Core Changes from Current System

| Aspect | Current (Linear/Modern) | Target (designprompts.dev) |
| --- | --- | --- |
| Background | Radial gradient + 4 blobs | Solid deep black, minimal blur |
| Blobs | Large, 9s float cycle | Remove completely or make minimal |
| Typography | Balanced scale | Extra-large headlines (12xl-9xl) |
| Spacing | Moderate (gap-4, gap-6) | Very generous (gap-6, gap-8+) |
| Shadows | Multi-layer shadows | Minimal/none, rely on transparency |
| Card borders | Visible at 6-10% opacity | Nearly invisible or removed |
| Hover motion | Translate 4-8px | Fade/opacity shift only, no movement |
| Accent usage | Consistent, frequent | Rare, strategic, powerful |
| Grid layout | 6-column asymmetric | Simpler, more structured |
| Rounded corners | Consistent rounded-2xl | Slightly less rounded (rounded-xl) |

---

## 3. Token Updates

### Color Palette Shift

Current has 7 color tokens. The new direction needs fewer, with more emphasis on **grays and black**:

```
--color-bg-deep: #0a0a0a (deep black, was #020203)
--color-bg-base: #0f0f0f (darker base, was #050506)
--color-bg-elevated: #1a1a1a (slightly lifted, was #0a0a0c)
--color-fg: #fafafa (nearly white, was #EDEDEF)
--color-fg-muted: #a0a0a0 (more gray, was #8A8F98)
--color-accent: #5E6AD2 (keep indigo — it's working)
--color-accent-bright: #6872D9 (keep as-is)
--color-gray-1: #1f1f1f (subtle divider)
--color-gray-2: #2a2a2a (slightly lifted surface)
```

Dark mode is still canonical. Light mode can remain but is secondary.

### Shadow Reduction

Replace the multi-layer shadows with **single, very subtle shadows** or **none at all**:

```
--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3); (subtle depth)
--shadow-card-hover: 0 2px 4px rgba(0, 0, 0, 0.4); (barely lifts)
--shadow-accent: none; (remove the glow, rely on opacity)
```

### Typography

Keep the same fonts (Inter, Plus Jakarta). Add a new scale:

```
Display (new): text-8xl or text-9xl, font-semibold, tracking-tight
H1: text-6xl (was smaller)
H2: text-4xl (was smaller)
Body: unchanged
```

### Spacing

Increase all base spacing:

```
--space-xs: 0.5rem (unchanged)
--space-sm: 1rem (unchanged)
--space-md: 1.5rem (unchanged)
--space-lg: 2.5rem (increased from 2rem)
--space-xl: 3.5rem (increased from 3rem)
--space-2xl: 5rem (increased from 4rem)
--space-3xl: 6.5rem (new, for hero spacing)
```

---

## 4. Component-by-Component Overhaul

### Backdrop.svelte

**Current:** Four layers (gradient, noise, 4 blobs, grid).
**Target:** Remove blobs and grid. Keep only deep black base + optional very faint noise.

```svelte
<!-- Much simpler -->
<div class="fixed inset-0 -z-10 bg-bg-deep" aria-hidden="true">
  <!-- Optional: very faint noise, barely visible -->
</div>
```

**Rationale:** The current blob system was distinctive but competes with content. The new direction is clean, minimal, letting content breathe.

### Hero.svelte

**Current:** 
- Parallax on scroll (opacity fade, scale, translate)
- Gradient display text
- Two CTAs

**Target:**
- **Remove parallax** (too animated for this aesthetic)
- **Keep gradient text** (it works)
- Increase hero padding: `py-32 md:py-40 lg:py-48` (was `py-32`)
- Eyebrow: small, caps, muted gray
- Headline: `text-7xl md:text-8xl lg:text-9xl` (massive)
- Subheadline: `text-lg md:text-xl` (smaller, more muted)
- CTAs: buttons stay but reduce shadow/glow; hover is opacity fade only
- DeviceMockup: position lower, more breathing room above it

**Spacing:**
- Gap between sections: increase to `gap-8`
- Padding within hero: `p-16 md:p-20 lg:p-24`

### Features.svelte

**Current:** Asymmetric bento (6-column grid, one hero card)
**Target:** Simpler, more regular grid

```
Mobile: 1 column
Tablet: 2 columns
Desktop: 3 columns (all equal height)
```

- Card height: fixed `h-64` instead of variable
- Icon background: remove the `bg-accent/[0.06]` tint; make icon text-only
- Remove spotlight effect (too much motion)
- Hover: only subtle opacity change on text, not the whole card lifting
- Spacing: increase `gap-8` or `gap-10`
- Section padding: `py-32 md:py-40 lg:py-48`

### Testimonials.svelte

**Current:** Auto-rotating carousel with spotlight
**Target:** Static or slow rotation (15s instead of 5s)

- Remove spotlight effect
- Increase card padding: `p-12`
- Quote font size: larger (`text-xl` or `text-2xl`)
- Carousel dots: less prominent, smaller
- No animation on card entry; appear together

### Pricing.svelte

**Current:** 3 cards, middle is "popular" with tilt effect
**Target:** Simpler layout

- Remove tilt effect (not in this aesthetic)
- Keep 3 cards but make them more subtle
- Popular card: still slightly emphasized but not dramatically
- Border/shadow: very minimal
- Hover: opacity fade only
- Card spacing: very generous inside

### FinalCta.svelte

**Current:** Large card with countdown timer
**Target:** Simpler hero-like section

- Remove the prominent card background; make it more inline with hero style
- Larger headline: `text-6xl md:text-7xl`
- Countdown (if present): smaller, more muted
- Button hover: no scale, just opacity/brightness shift
- Lots of padding: `py-48`

### Nav.svelte

**Current:** Fixed header, transitions on scroll
**Target:** 

- Keep fixed header
- On scroll: change to `bg-bg-base/80 backdrop-blur-sm` (even more subtle)
- Logo: remove gradient background; just text + icon
- Links: keep the same
- "Open the app" button: no shadow/glow; just solid accent on hover

### ThemeToggle.svelte

**Current:** Sun/moon icons in a rounded container
**Target:** Same, but even more minimal

- Remove border
- Background: nearly transparent
- Hover: very subtle opacity change

### Footer.svelte

**Current:** 4-column grid
**Target:** Same structure but more spacious

- Increase padding: `py-20` (was `py-12`)
- Column spacing: `gap-12` or `gap-16` (was `gap-8`)
- Reduce visual clutter

### DeviceMockup.svelte

**Current:** MacBook + iPhone with float animation
**Target:**

- Keep the mockup itself
- Remove or reduce animation (much slower float if any)
- Adjust sizing/positioning for new hero scale

---

## 5. Animation Philosophy Shift

**Current:** Animations are precise and playful (expo-out easing, 200-300ms, 4-8px movement).
**Target:** Animations are **almost imperceptible**.

- Fade/opacity transitions: 300-500ms, ease-out
- **No movement-based animations** (no translate, no scale on hover)
- Hover states: opacity shift only
- Entrance animations: fade in, no movement
- Parallax: remove entirely
- Spotlight: remove entirely
- Floating blobs: remove entirely
- Tilt effect: remove

**Why:** The designprompts.dev aesthetic is refined and understated. Motion should not distract.

---

## 6. Light Mode

Keep it, but tone it down even further. Don't make it inverted; make it a **true second theme**:

```
Light background: #ffffff or #fafafa
Light text: #1a1a1a
Light muted: #707070
Light accent: #5E6AD2 (keep)
```

Very minimal contrast in light mode. The dark mode is where the design shines.

---

## 7. Implementation Roadmap

### Phase 1: Token Layer (Step 1-2)
1. Update `app.css` color tokens (simpler palette, more grays)
2. Reduce shadow definitions
3. Update spacing scale
4. Remove animation keyframes (blob, float, pulse-glow)

### Phase 2: Backdrop & Hero (Step 3-5)
3. Simplify Backdrop.svelte (remove blobs and grid)
4. Update Hero.svelte (remove parallax, increase spacing and typography)
5. Update DeviceMockup animation (slower or static)

### Phase 3: Component Restyle (Step 6-10)
6. Update Features.svelte (simpler grid, no spotlight)
7. Update Testimonials.svelte (slower carousel, remove spotlight)
8. Update Pricing.svelte (remove tilt, simpler design)
9. Update FinalCta.svelte (hero-like styling)
10. Update Nav/ThemeToggle/Footer (more minimal)

### Phase 4: Polish (Step 11)
11. Review all hover states (opacity only, no movement)
12. Verify spacing is consistent and generous
13. Test both dark and light modes

---

## 8. Acceptance Criteria

- [ ] `bun run check` reports 0 ERRORS
- [ ] No blobs, grid, parallax, or spotlight effects remain
- [ ] Typography is larger and bolder (h1 >= 6xl)
- [ ] All section padding is `py-32` or larger
- [ ] Hover states change only opacity or color, never position or scale
- [ ] Shadows are subtle or removed
- [ ] Spacing is generous (gaps >= 6, padding >= 8)
- [ ] Dark mode is default and looks premium
- [ ] Dev server starts without errors
- [ ] Mobile responsive still works (stacks appropriately)
- [ ] All animations are 300-500ms, ease-out, fade-only
- [ ] Focus rings are still visible (prominent for accessibility)
- [ ] Dashboard at `/#/app` is untouched

---

## 9. Common Mistakes to Avoid

**Don't:**
- Use harsh shadows; keep them subtle or remove
- Animate on hover beyond opacity changes
- Over-use the accent color; let it be rare and powerful
- Keep the blob animations; they distract from content
- Use small typography; go bigger and bolder
- Make sections feel cramped; add whitespace
- Add movement parallax; it's not modern, it's dated
- Make borders visible; keep them subtle or gone
- Animate spotlight; it's distracting

**Do:**
- Let whitespace breathe
- Make the accent color count when used
- Trust the typography hierarchy
- Keep animations minimal and subtle
- Use transparency instead of shadows for depth
- Make hover states understated (opacity, not movement)
- Test on dark mode primarily (it's the canonical look)

---

## 10. Reference

Visit [designprompts.dev](https://www.designprompts.dev/) to see:
- Deep black backgrounds
- Enormous headlines
- Generous spacing
- Minimal motion
- Clean, professional aesthetic
- Subtle hover effects
- Strategic accent color use
- Premium feel despite simplicity

This is the target. The goal is to capture that **"refined, minimal, premium"** feeling rather than the current **"technical, animated, precision"** vibe.
