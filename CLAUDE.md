# Only For Climbing · V4

A functional iOS-style mockup of **Only For Climbing**, a social app for climbers. V4 is a single-page PWA: 28 screens with live state, a real Leaflet map, a Kilter board companion, and three share-card formats — all running from one `index.html` with no build step.

Live: https://averyscove.github.io/only-for-climbing-v4/

## Stack

- **One static page** — `index.html` is the entire app shell. Open it directly or serve it from any static host.
- **React 18 via UMD + `@babel/standalone`** — JSX is transformed in the browser. No bundler, no `npm install`. Edit a `.jsx` file, refresh, done.
- **Leaflet 1.9.4** for the Discover Map screen (real interactive map, OSM tiles).
- **PWA** — `manifest.webmanifest` + apple-touch-icon + `display: standalone`. Add to Home Screen on iOS gives a fullscreen, branded launch.
- **State** lives in `localStorage` via the `OFC` namespace exposed by `src/hifi/shared.jsx` (`OFC.clearAllAndReseed()` resets to seed data — wired to the **RESET DATA** button in the desktop stage chrome).

## File layout

```
index.html              App shell, PWA metadata, CSS, screen catalog, root <App>
manifest.webmanifest    PWA manifest
icon-{180,192,512,512-maskable}.png

src/
  ios-frame.jsx         iOS 26 "Liquid Glass" device chrome:
                          IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill,
                          IOSList, IOSListRow, IOSKeyboard
  hifi/
    shared.jsx          OFC state, HF design tokens (colors, fonts), HFIcon set,
                          HFToast, HFBottomSheet, common primitives
    feed.jsx            Feed, story viewer, composer (Log a Send)
    profile.jsx         Me hub, my profile, friend profile, edit profile
    events.jsx          Discover, event detail, plan, map, gym detail, search,
                          notifications
    chat.jsx            Group chat list + thread (real send)
    store.jsx           Projects, training, gear, achievements, leaderboard,
                          weekly recap, settings
    share.jsx           Three hero share-card layouts (Stamped / Editorial /
                          Newspaper)
    extras.jsx          Onboarding + remaining one-offs
    kilter.jsx          v4: Kilter board companion / climb library
    v3.jsx              v3 screens carried forward
```

## Screens

28 screens registered in the `SCREENS` catalog at the top of `index.html`. Each entry has an `id`, display number, label, sub-label, dark-mode flag, group, and `render(params)` function. Groups, in picker order:

- **CORE** — Onboarding · Feed · Story · Composer · Me Hub · My Profile
- **SOCIAL** — Search · Discover · Event Detail · Plan · Map · Gym Detail · Group Chats · Thread · Notifications · Friend Profile
- **ME** — Projects · Training · Gear · Achievements · Leaderboard · Weekly Recap · Settings · Edit Profile
- **BOARD** — Kilter (v4)
- **SHARE** — Stamped · Editorial · Newspaper

## Navigation

Two layers, both wired through `window.UC`:

| Action | Desktop | Mobile / standalone |
|---|---|---|
| Switch screen | `←` / `→` keys, or `P` for picker | Picker drawer (top-right of stage; hidden in standalone) |
| In-app routing | `window.UC.navigate(id, params?)` | Same |
| Open profile / gym / event / thread | `window.UC.openProfile(userId)` etc. | Same |
| Toast / comment sheet | `window.UC.toast(msg)`, `window.UC.openComments(postId)` | Same |
| Deep link | URL hash (`#feed`, `#kilter`, …) — back/forward sync | Same |

On mobile (`max-width: 600px`) and in standalone PWA mode, the desktop stage chrome and the device frame's fake iOS status bar / dynamic island / home indicator are hidden so the real phone OS shows through. Each screen's content is shifted up to honor `env(safe-area-inset-top)`.

## Conventions

- **Design tokens** — `HF.paper`, `HF.ink`, `HF.ink3`, `HF.accent` (orange `#e85d2a`), `HF.mono` (JetBrains Mono), Archivo Black for display, Inter for body. Don't hardcode colors; reuse `HF.*`.
- **Phone canvas** is `390 × 844` (`PHONE_W` / `PHONE_H` in `index.html`). Share-card artboard is `360 × 720` wrapped by `ShareCardArtboard`.
- **Cache-bust** — script tags use `?v=4`. Bump when shipping a JSX change so reloads pick it up.
- **No new files unless needed** — every screen lives in one of the existing `src/hifi/*.jsx` files grouped by domain.

## Run locally

Any static server works. Two quick options:

```sh
python3 -m http.server 8000        # then open http://localhost:8000
npx serve .                        # or any static host
```

Just opening `index.html` via `file://` will mostly work but breaks `manifest.webmanifest` and some fetches — use a server.

## Deploy

GitHub Pages is wired to `main` / root. Pushing to `main` rebuilds Pages automatically; the Pages URL is the live link above.
