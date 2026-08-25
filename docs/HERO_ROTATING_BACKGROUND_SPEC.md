# Hero rotating background — implementation spec (portable)

Use this document when you want **the same behavior in another project** or when you tell an assistant: *“Follow `docs/HERO_ROTATING_BACKGROUND_SPEC.md`.”* It describes the **healthcare-ui-3** home hero: **automatic image rotation**, **smooth crossfade (opacity)**, **Ken Burns–style zoom in / zoom out**, **overlay gradients that gently breathe**, and **accessible reduced-motion** behavior—without requiring React or a build step.

---

## 1. What you get (behavior summary)

| Effect | How it’s implemented |
|--------|----------------------|
| **Multiple images, auto-advance** | JS cycles a logical slide index; each slide can have several URL fallbacks (local → remote). |
| **Smooth fade between slides** | Two full-screen **divs** use `background-image` + CSS **`transition: opacity`** when toggling “active”. |
| **Slow zoom in / zoom out** | CSS **`@keyframes`** animate `transform: scale()` + slight `translate3d` on the **active** layer only (`14s` per cycle in this repo). |
| **No “blink” on slide change** | The next image is applied to the **inactive** layer, then **opacity** swaps **after** the Ken Burns cycle completes (`animationend`), not mid-animation. |
| **Overlays** | `.hero::before` / `.hero::after` add readable gradients; optional **opacity pulse** animations on those overlays. |
| **Reduced motion** | If `prefers-reduced-motion: reduce`, Ken Burns is **disabled**; slides advance on a **simple timer** (`setInterval`). |

**Not in this spec:** contact page hero (`<img>` + veil)—that is a different pattern. This doc is only the **two-layer background** hero.

---

## 2. Required HTML structure

Minimal shape (classes can be renamed if you update CSS/JS consistently):

```html
<header class="hero" data-hero id="home">
  <!-- Background stack: must live inside .hero, position absolute fills hero -->
  <div class="hero__media" aria-hidden="true">
    <div class="hero__bg-layer" data-hero-bg-layer></div>
    <div class="hero__bg-layer" data-hero-bg-layer></div>
  </div>

  <!-- Optional: parallax decorative layer (JS moves it on scroll) -->
  <div class="hero__parallax" data-parallax-layer aria-hidden="true"></div>

  <!-- Foreground: z-index above overlays -->
  <div class="hero__inner">
    <!-- headline, CTAs, form, etc. -->
  </div>
</header>
```

**Hard requirements for the rotation script:**

1. Outer container: `[data-hero]` (e.g. `<header class="hero" data-hero>`).
2. **Exactly two** children with `[data-hero-bg-layer]` (order = first layer “A”, second “B”).
3. Layers are **empty divs**; images are set via JS: `element.style.backgroundImage = 'url("...")'`.

---

## 3. CSS — background layers (opacity + Ken Burns)

### 3.1 Container and media wrapper

- `.hero` is `position: relative; overflow: hidden;` and defines height (this project uses full viewport + padding).
- `.hero__media` is `position: absolute; inset: 0; z-index: 0` so it sits behind content.

### 3.2 Each layer

```css
.hero__bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transform-origin: center center;
  transition: opacity 1.75s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero__bg-layer--active {
  opacity: 1;
}
```

- **Inactive** layers stay at `opacity: 0` (may still hold the “next” image in memory).
- **Active** layer goes to `opacity: 1` — the **transition** produces the **crossfade** when swapping which layer is active.

### 3.3 Ken Burns keyframes (full cycle per slide)

```css
@keyframes hero-bg-kenburns-cycle {
  0% {
    transform: scale(1) translate3d(0, 0, 0);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  50% {
    transform: scale(1.055) translate3d(0, -0.28%, 0);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  100% {
    transform: scale(1) translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .hero__bg-layer--active {
    animation: hero-bg-kenburns-cycle 14s forwards;
  }
}
```

- **`forwards`** keeps the element at `100%` keyframe state until the class/animation changes.
- **Only** `.hero__bg-layer--active` runs the animation so the hidden layer does not waste GPU.

### 3.4 Retriggering animation on the same element

When the **same** div becomes active again for a **new** slide, the browser may **not** restart `@keyframes` unless the animation is reset. The JS pattern used is:

1. Remove `--active` from both layers.
2. **Force reflow:** read `element.offsetWidth` (or equivalent).
3. Add `--active` to the layer that should show the new image.

This is documented in the JS section below.

---

## 4. CSS — overlays (optional but matches this repo)

Stacking (low → high): `hero__media` (0) → `hero::after` (1) → `hero::before` (2) → `hero__parallax` (3) → `hero__inner` (4).

- **`hero::after`**: diagonal slate + teal wash; can animate with `hero-overlay-breathe`.
- **`hero::before`**: radial vignettes + subtle green depth; alternate animation direction for variety.

These are **purely decorative** (`pointer-events: none`). They are independent of slide changes; they add “living” opacity on top of the photos.

---

## 5. JavaScript — state machine (two layers)

### 5.1 Data structures

- **`photoCandidates`**: array of slides; each slide is an **ordered list of URLs** (try first URL, then fallbacks).
- **`index`**: current slide index `0 … N-1`.
- **`active`**: which DOM layer is “on top” for animation (`0` = first `[data-hero-bg-layer]`, `1` = second).
- **`heroUrlCache`**: memoize first working URL per slide after probing.

### 5.2 Image probing (optional but recommended)

For each slide, sequentially **`new Image()`**, `onload` / `onerror`, optionally `img.decode()`, first success wins. Cache the result so you do not re-probe every rotation.

Warm cache: optionally preload all candidate URLs once with `new Image().src = url`.

### 5.3 Advancing to the next slide (`goNext`)

Pseudocode:

```text
nextIndex = (index + 1) % slideCount
curLayer = layer[active]
nextLayer = layer[1 - active]
nextLayer.style.backgroundImage = url(nextIndex)

curLayer.classList.remove('hero__bg-layer--active')
nextLayer.classList.remove('hero__bg-layer--active')
void nextLayer.offsetWidth   // force reflow — restart keyframes
nextLayer.classList.add('hero__bg-layer--active')

active = 1 - active
index = nextIndex
```

`goNext` should be **`async`** if URLs are resolved with probing.

### 5.4 When to call `goNext` (full motion)

1. Listen for **`animationend`** on **both** layers.
2. In the handler, **filter**:
   - `e.animationName === 'hero-bg-kenburns-cycle'` (match your `@keyframes` name).
   - `e.target === e.currentTarget` (ignore bubbling from descendants).
   - Layer still has `.hero__bg-layer--active`.
3. **Debounce** rapid double events (both layers can fire close together): e.g. ignore if `performance.now() - lastAdvance < 120ms`.
4. Use a **`cycleBusy`** flag so you do not start another `goNext` while the previous promise is still running.
5. Call `goNext()`; in `finally`, clear `cycleBusy`.

**Why `animationend`?** One full Ken Burns cycle completes; **then** you swap the image and opacity. If you swap mid-cycle, the transform snaps and the hero “blinks”.

### 5.5 Reduced motion branch

```text
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  firstLayer.classList.add('hero__bg-layer--active')
  setInterval(() => goNext(), 8000)  // no Ken Burns CSS on active
  return
}
```

Ensure your CSS does **not** attach the Ken Burns animation when reduced motion is on (this repo uses `@media (prefers-reduced-motion: no-preference)` around the animation rule).

### 5.6 Initialization

1. Query `[data-hero]` and **both** `[data-hero-bg-layer]`.
2. Set initial `backgroundImage` on layer A (slide 0) and layer B (slide 1) — strings or after `resolveHeroUrl`.
3. Add `animationend` listeners.
4. Add `.hero__bg-layer--active` to the layer that should show first (usually A).

---

## 6. Parallax layer (optional, separate concern)

- A sibling div with `data-parallax-layer` (see `parallax.js` in this repo).
- On `scroll`, `requestAnimationFrame` throttles updates: `transform: translate3d(0, scrollY * factor, 0)`.
- Does **not** drive slide changes; only adds depth.

---

## 7. Porting checklist (copy to another codebase)

- [ ] Paste/adapt **HTML**: `data-hero` + two `data-hero-bg-layer` divs inside an absolute wrapper.
- [ ] Paste/adapt **CSS**: `.hero__media`, `.hero__bg-layer`, `.hero__bg-layer--active`, `@keyframes` + duration, `transition` on opacity.
- [ ] Paste/adapt **JS**: probe/cache, `goNext`, reflow, `animationend` + debounce + `cycleBusy`, reduced-motion branch.
- [ ] Align **`animationName`** in JS with the **`@keyframes` name** in CSS.
- [ ] Set **`photoCandidates`** (or equivalent) to your image URLs.
- [ ] Test **refresh** on first slide and **long idle** (no memory leaks from intervals if you add any).
- [ ] Test **`prefers-reduced-motion`** in OS/browser settings.

---

## 8. Tuning knobs (this repo’s defaults)

| Knob | Location | Default (approx.) |
|------|----------|-------------------|
| Crossfade duration | `.hero__bg-layer` `transition` | `1.75s` |
| Ken Burns duration | `.hero__bg-layer--active` `animation` | `14s` |
| Peak zoom | keyframes `50%` | `scale(1.055)` |
| Reduced-motion interval | JS `setInterval` | `8000ms` |
| `animationend` debounce | JS constant | `120ms` |

---

## 9. Reference implementation in this repository

| Piece | File |
|-------|------|
| Markup | `index.html` — `<header class="hero" data-hero>` and `.hero__bg-layer` |
| Styles | `styles.css` — sections commented `/* --- Hero --- */` through `.hero__bg-layer--active` and keyframes |
| Logic | `js/main.js` — function `initHeroRotation()` |
| Parallax | `js/parallax.js` — `initParallax` |

---

## 10. One-line prompt you can give an AI assistant

> Implement a full-viewport hero with **two** `div` background layers (`data-hero` / `data-hero-bg-layer`), **CSS opacity crossfade** + **Ken Burns keyframes** on the active layer only, **advance slide on `animationend`** with reflow + debounce, **URL fallback probing**, and **`prefers-reduced-motion`** using a timed `setInterval` instead of Ken Burns. Follow the structure and algorithm in `docs/HERO_ROTATING_BACKGROUND_SPEC.md`.

---

*Spec version: matches healthcare-ui-3 hero as of project snapshot. Rename classes/keyframes when merging into other design systems, but keep the two-layer + `animationend` contract.*
