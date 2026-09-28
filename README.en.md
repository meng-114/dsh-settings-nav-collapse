# dsh-settings-nav-collapse

> **[简体中文](./README.md)** | English

A **client-only plugin** for the DeepSeek Harness (DSH) web UI: it adds one button to the settings panel header (left of the close button) that collapses the settings navigation column — a fixed 188px rail — into a **56px icon rail**, so the content column stays readable on phones and other narrow viewports.

## The problem it solves

The shipped settings panel is a fixed layout with **no responsive breakpoint at all**:

```
panel   { width:800px; max-width:calc(100vw - 48px) }
nav     { width:188px; padding:22px 12px 0; flex:none }
content { flex:1; min-width:0 }
options { padding:0 24px 24px }
```

On a 360px-wide phone: `panel = min(800, 360−48) = 312px`, the nav eats 188px, and the content column is left with **124px** — about **76px** after padding. Settings rows become unreadable. Collapsed to a 56px rail, the same viewport gives the content column **208–256px** back.

## Features

- One header button: **rail (56px icon rail) ↔ expanded**. The glyph flips with the state, and `aria-pressed` reports the state that is **actually applied** (not the requested one).
- Collapsed by default on narrow viewports (`≤640px`), expanded on wide ones; once the user clicks, the choice is remembered (`localStorage["dsh.settingsNav"]`, per browser).
- If the nav rows carry no inline svg icon, the plugin degrades to **compact (88px, labels kept)** instead of leaving a blank, unusable rail.
- On narrow viewports the content column becomes the scrollable viewport (`overflow:auto` + `overscroll-behavior:contain` + touch momentum), and `dvh` keeps the panel clear of browser chrome.
- On very narrow viewports the settings page gets a **480px canvas** it can pan horizontally, instead of being squeezed into a one-character-wide column.
- Every rule is scoped to **markup the plugin applies itself** (`html[data-dsh-settings-nav]` and the panel marker `data-dsh-settings-nav-panel`). No hashed class name, no imported Harness client package, no `!important`.

## Install

**Option 1 — npm (recommended)**

```bash
dsh plugin add @mengli114/dsh-settings-nav-collapse
```

Or through the protected flow (plugin manager UI / `dshpm`).

**Option 2 — straight from GitHub**

```bash
dsh plugin add github:meng-114/dsh-settings-nav-collapse
```

**Option 3 — local development**

```bash
dsh plugin --profile web add link:/path/to/dsh-settings-nav-collapse
```

`cordis.patch.yml` is merged into the profile roster. **Restart the web host once**, then open the settings panel and use the new button in its header.

Uninstall: `dsh plugin remove @mengli114/dsh-settings-nav-collapse`.

## Compatibility

| | |
|---|---|
| DSH | `>=0.1.5-rc.1` (panel anchors checked line-by-line on 0.1.5-rc.1 and 0.1.7-rc.2; **no browser rendering test has been run yet** — see Verification below) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Browser | needs `MutationObserver`, `matchMedia`, CSS `min()/max()` and `dvh` (engines without `dvh` fall back to `vh`) |

Panel discovery deliberately avoids package-internal attributes: the plugin walks up from its own button with `closest('[role="dialog"][aria-modal="true"]')`, tags that panel with its own `data-dsh-settings-nav-panel`, and scopes every rule on that marker. `[data-shortcut-modal="settings"]` (only present on newer builds) is kept as a fallback selector.

## Known trade-offs

- **The 480px canvas also applies in the expanded state.** On a narrow screen an explicitly expanded panel leaves ~92px of content, which still lays out at 480px and needs panning. That is intentional — a 92px column is unusable — but if you prefer wrapping at the real width, drop the `[data-slot="settings.section"] > *` rule from the `@media` block.
- **Panning has no visual affordance.** On very narrow viewports part of the content sits off-screen until the user drags.
- **The nav heading is hidden** in rail/compact mode to save vertical space — *except* when it currently carries `data-modal-autofocus` (the "no settings sections at all" edge case), because hiding it would turn the modal layer's initial focus into a no-op.
- The preference lives in `localStorage`, so each browser remembers its own.

## Verification

The static/contract evidence is tracked in [`docs/verification.md`](./docs/verification.md): a line-by-line comparison against the real DOM of the shipped shell on two DSH versions (0.1.5-rc.1 and 0.1.7-rc.2), existence checks for every CSS custom property used, and the field-level checks for `dsh.client.*`. It also lists what still requires a **manual check in a real browser**.

The repository ships dependency-free invariant tests (no browser, no deps):

```bash
npm run check   # node --check index.js && node --check client.js
npm test        # name/patch/module-id agreement, anchoring policy, manifest fields, published file list…
```

## Development

```bash
git clone git@github.com:meng-114/dsh-settings-nav-collapse.git
cd dsh-settings-nav-collapse
npm run check && npm test
# link it into a local profile; a page refresh is enough (client modules hot-load)
dsh plugin --profile web add link:$PWD
```

## License

MIT © 2026 mengli114
