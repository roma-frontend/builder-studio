# Onboarding Tours — roadmap & how-to

Premium first-run product tours for admins: a cinematic spotlight overlay with
animated "click here →" arrows, smooth framer-motion transitions, progress,
synthesized sound, per-account persistence (DB prefs) and a floating **Show
tour** replay button.

The engine is generic and text-agnostic. Adding a tour for a new tool is small,
declarative work — see **"How to add a tour"** below.

---

## Architecture

| File | Role |
|------|------|
| `lib/tour/types.ts` | `TourStep` / `TourDef` / `TourId` / `Placement` model |
| `lib/tour/tours.ts` | Localized step content (ru/en/hy) + chrome strings + `getTour(id, locale)` |
| `components/tour/onboarding-tour.tsx` | Engine: spotlight, ring, arrow, tooltip, keyboard, scroll-to-reveal |
| `components/tour/animated-arrow.tsx` | Pulsing directional "click here" arrow |
| `components/tour/tour-sound.ts` | Synthesized Web-Audio chimes (no assets, mute-able) |
| `components/tour/tour-launcher.tsx` | Auto-start once, persist `tour:<id>`, replay button |

**Persistence:** the flag `tour:<id>` is stored in the account's DB-backed prefs
(`/api/prefs`). A tour auto-opens **exactly once** (the flag is written the moment
it opens), then is available only via the **Show tour** button. Sound preference
is stored under `tourSound`.

---

## Shipped tours

| Tour id | Page | What it teaches | Status |
|---------|------|-----------------|--------|
| `dashboard-overview` | `/dashboard` | First screen: points to **"My sites"** in the nav as the place to start | ✅ Done |
| `dashboard-sites` | `/dashboard/sites` | Where everything lives: create a site, **Settings → create courses/documents/materials**, Edit → builder, Publish | ✅ Done |
| `site-content` | `/dashboard/sites/[id]` | Create a course, add lessons, upload documents | ✅ Done |
| `studio-builder` | `/studio/builder` | Pages tab → Blocks tab → find & place the "Courses" block → publish | ✅ Done |

The intended admin journey chains naturally across pages:
**dashboard-overview → (click "My sites") → dashboard-sites → site-content → studio-builder**.

---

## Roadmap — tours to add next

Ordered by impact for a paying admin. Each is just a new step array + anchors.

- [ ] **`themes`** (`/themes`, `/themes/[id]`) — browse themes, preview, apply a
  theme to a site; explain palette/typography/motion tokens.
- [ ] **`members`** (`/dashboard/sites/[id]` → members section) — approve/reject
  join requests, approval policy toggle, member statuses, notifications.
- [ ] **`site-settings`** (`/dashboard/sites/[id]` settings) — identity
  (name/slug), custom domains + DNS, form submissions.
- [ ] **`tickets`** — respond to member support tickets, open/closed states.
- [ ] **`announcements`** — publish/pin announcements to members.
- [ ] **`studio-generate`** (`/studio`) — AI page/media generation flow.
- [ ] **`billing`** — *(after the payment system lands)* plans, subscriptions,
  selling member access, invoices.
- [ ] **`super-admin`** (`/dashboard/super`, `/dashboard/control`) — platform-wide
  controls (superadmin only; gate the launcher by role).

### Cross-cutting polish (later)
- [ ] A "Tours" section in Account settings to reset/replay any tour.
- [ ] Optional ambient soundscape (currently step chimes only).
- [ ] Analytics: record tour completion/skip rates.
- [ ] Gate role-specific tours (e.g. `super-admin`) behind the viewer's role.

---

## How to add a tour (≈ 3 steps)

**1. Anchor the real UI** — add `data-tour="…"` to the elements to spotlight:

```tsx
<button data-tour="my-thing"> … </button>
```

**2. Define localized steps** in `lib/tour/tours.ts` and wire them into
`getTour`, then add the id to `TourId` in `lib/tour/types.ts`:

```ts
function myToolSteps(locale: Locale): TourStep[] {
  const ru: TourStep[] = [
    { title: '👋 Привет', body: '…', placement: 'center', highlight: false },
    { target: '[data-tour="my-thing"]', title: '…', body: '…',
      placement: 'bottom', pointer: true /* shows the "click here" arrow */,
      onEnter: () => (document.querySelector('[data-tour="tab-x"]') as HTMLElement)?.click() /* optional: reveal a tab */ },
  ];
  const en: TourStep[] = [ /* … */ ];
  const hy: TourStep[] = [ /* … */ ];
  return locale === 'ru' ? ru : locale === 'hy' ? hy : en;
}
```

**3. Mount the launcher** once on the page (client component):

```tsx
import { TourLauncher } from '@/components/tour/tour-launcher';
// …
<TourLauncher tour="my-tool" />
```

That's it — first visit auto-plays it once, and the **Show tour** button replays
it any time.

### Step options (`TourStep`)
- `target?` — CSS selector to spotlight (omit → centered welcome/finish card).
- `title`, `body` — localized copy.
- `placement?` — `top | bottom | left | right | center` (auto-flips to stay on-screen).
- `highlight?` — `false` to dim without a ring (welcome/finish steps).
- `pointer?` — show the pulsing **"click here"** arrow (use on actionable steps).
- `onEnter?` — side-effect when the step opens (e.g. click a tab so the next
  target becomes visible). The engine waits for the target to appear and scrolls
  it into view.
