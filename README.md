# Furrow — concept site

A portfolio concept for **Furrow**, a fictional growth firm for Shopify DTC brands. Static HTML, CSS and JS with no build step and relative paths, so it can be published at the root of a GitHub Pages subdomain (planned: `furrow.wolfbc.art`, which the absolute `og:image` and `og:url` tags point to).

Concept project by Wolfgang Betancourth — [wolfbc.art](https://wolfbc.art). Furrow, its clients, people, quotes and figures are invented; every figure carries an asterisk and an "Illustrative" note.

## Pages

| Path | What it is |
|---|---|
| `index.html` | Home: hero, problem statement, before/after, services, process, team, testimonials and figures, featured case, pricing, FAQ, insights, contact form, closing and footer |
| `cases/fernhill/index.html` | Case study |
| `insights/index.html` | Insights index with topic filters and search |
| `insights/margin-before-volume/index.html` | Article with sticky contents and share buttons |
| `contact/index.html` | Contact details, the booking form and the FAQ |
| `404.html` | Not-found page (uses root links `/…` because GitHub Pages serves it at any missing path) |

Removed on 2026-11-25: `cases/sitemark/` and `insights/your-crm-is-not-the-problem/`. They were copies of the case and the article at the reference site's addresses, and those URLs reused the reference's client name and article title. Nothing links to them any more.

Files: `css/site.css` (one stylesheet, tokens in `:root`), `js/site.js` (all behaviour), `assets/` (images, `icons.svg` sprite, `favicon.svg`, `og.jpg`).

## Fonts

- **Bricolage Grotesque** (Google Fonts, opsz 12–96, wdth 75–100, wght 500–700): headings, wordmark, client wordmarks. Display sizes use the automatic optical size.
- **Instrument Sans** (Google Fonts, 400–600): body, UI and forms.

Loaded from Google Fonts with `display=swap`.

## Libraries

- **GSAP 3.13.0** and **ScrollTrigger 3.13.0** from jsDelivr (pinned): hero load, hero scale and frost on scroll, the word-by-word problem statement, the before/after sequence, the chart fade and the closing furrow.
- The pinned story runs only when there is room for it. With `prefers-reduced-motion`, with JavaScript off, when the library can't load (the script adds `html.rm`) or in windows 560 px tall or less (200% zoom, landscape phones), the page switches to a static layout: hero, statement on a dark panel and the before/after cards side by side, with nothing pinned on top of anything else.

Everything else (menu, copy email, dialogs, accordions, plan picker, FAQ tabs, counters, forms, filters, ticker pause, legal notice) is plain JS.

## What reproduces the reference (Kora, a Framer template)

Layout and behaviour only, rebuilt from screenshots and measurements:

- Section order and proportions of the home page, 1320 px content inside 60/40/20 px margins, section rhythm 120/90/60 px, panels inset 20 px (10 px on phones) with 40 px padding.
- Cream trays nesting cards with a 10 px gutter and radii 40 / 30 / 20 / 15.
- Type scale and negative tracking (120 / 80 / 60 / 45 / 30 / 25 / 20 / 17 / 15 / 13 px with tablet and phone steps).
- The pinned opening: sticky hero that grows to 1.4× and frosts over, problem statement written word by word on scroll, before/after cards that spring apart.
- Sticky stack of service cards with a quote card, the hover accordion of phases, the testimonial accordion, counting figures, the plan picker that recolours the price panel, tabbed FAQ, copy-to-clipboard, team profile dialog, insight cards with blur-zoom hover.
- The shared hover grammar: pill buttons whose label rolls ±30° while a circle fills from the dot, rolling text links, the footer nav pill that grows from the bullet.

## What is original

- Name, logo (three furrow lines in an oval + "furrow" wordmark, own SVG), colours (cream `#fbfaf6` / `#f3f1e7` / `#fffdf8`, ink `#1f1f1c`, cobalt `#1f4fff`, light blue `#6f8dff` for accents on ink), fonts, all copy (from COPY.md), images and code.
- **Signature effects we changed on purpose:**
  - Closing: instead of a growing circle, a cobalt **furrow** opens from the middle with two wavy edges that echo the logo lines, until it covers the screen and shows "Good ground first. Then growth.", while the contact block sinks and the footer card rises.
  - Before/after headline: the two lines part sideways like soil (slide, skew and blur) instead of the 3D rotation.
  - No 01–05 numbering on services (they are not a sequence); no star or dot ratings.
- Client wordmarks: each fictional brand (Fernhill, Tallowmere, Kettlewick, Oddpine, Marrowby, Northbarrow, Pellam Tea, Sundry Fields) has its own cut of Bricolage or Instrument Sans (width, case, tracking), so none of them looks like Furrow.

## Accessibility

- Skip link, nav first in the DOM, one h1 per page, real buttons with `aria-expanded`, tab/tabpanel roles, radio group for plans, native dialogs with focus return, visible focus rings.
- Light text on cobalt is 92% cream (5.06:1); white on cobalt is 5.8:1. Glass chips and text over photos sit on darker veils.
- Tap targets are at least 44 px (buttons, tabs, form options, consent, legal buttons, credit link, profile emails, contents links).
- A keyboard-focused service button raises its card above the next one in the sticky stack; on windows 640 px tall or less the stack is not pinned.
- The logo ticker has a pause button. Collapsed FAQ answers are hidden from the reading order.
- The giant footer wordmark ignores the pointer, so the credit link above it can be clicked.
- No horizontal scroll at 320 px. Content stays visible with reduced motion, without JS and at 200% zoom.

## Forms

Local only: validation on leaving a field and on submit, error summary, loading, success and error states (the error state shows when the browser is offline). Required fields carry `aria-required` and a line above the form says which field is optional. The newsletter needs its consent box. Nothing is sent.

## Footer

No social links (Furrow has no profiles). "Privacy policy" and "Terms" are buttons that highlight and focus the fictional-brand notice under the credit line. Copying an email address says "Copied" only when the copy worked; otherwise it says it failed and reads the address out.

## Images

Only the provided photos, in `assets/`: hero, how-we-work, case-fernhill, contact-sprouts, insights i-01…i-03, team t-01…t-04. Derived files: `hero-800.webp` and `hero-1400.webp` (responsive hero), `team/t-0N-160.webp` (160 px face crops for avatars; the dialogs keep the full portraits), `og.jpg` (1200×630 crop of the hero).

No photo is used to stand in for another: where the build used to repeat photos, it now draws the content instead (see below). Alt texts as in COPY.md §8.

## Replaced with CSS / SVG

- All icons: own SVG sprite (`assets/icons.svg`), Lucide-style strokes.
- Service cards: a sheet of what each service delivers, in HTML/SVG on an ink panel (test roadmap ranked by profit per visit, payback dashboard, monthly creative plan, flow rebuilds), with the client quote on top.
- Case study: a before/after bar figure of contribution margin instead of two more crops of the product photo.
- Insight cards without a photo of their own: typographic cards ("20", "Payback", "Welcome", "11 p.m.") on ink or cobalt.
- Social proof next to "40+ Shopify brands": client initials, not the team's faces.
- "More cases" cards (Tallowmere, Kettlewick): ink panels with the client wordmark over the furrow line pattern from the logo.
- Avatars for quoted clients: initials in a circle (no portraits were supplied for them).
- The "Inside a Furrow sprint" video: a poster button that opens a "Video coming soon" dialog, as the brief asks.
