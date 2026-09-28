# Verification record

This plugin is a browser-side artifact: its interesting behaviour (rail vs compact vs expanded, focus, layout arithmetic) can only be *judged* by rendering it in a browser. This document records what was verified **without** a browser — against the real source and the real DOM of the shipped shell — and what still needs a human with a phone.

## 1. Environment

| # | Where | DSH | settings-general | Notes |
|---|---|---|---|---|
| A | Android / Termux proot Ubuntu (aarch64), node v24.21.0 | **0.1.7-rc.2** | 0.1.7-rc.2 | the working install this plugin was developed on |
| B | Windows 11 (this repo's dev machine), node v24.11.1 | **0.1.5-rc.1** | 0.1.5-rc.2 | older, used to test the anchoring policy |
| C | DSH source checkout (reference) | 0.1.0-rc.5 | — | used for API/field-level checks |

## 2. Contract checks

### 2.1 The panel and its parts (real JSX, both versions)

Shell A, `dsh-client-ui-settings-general/lib/client.js` (inside `SettingsPanel`, body-portaled):

```js
createPortal(jsxs("div", { className: overlay, role: "presentation", children: [
  jsx("div", { className: mask, "aria-hidden": "true", onClick: onClose }),
  jsxs("div", { ref: panel, tabIndex: -1,
    "data-shortcut-modal": "settings",        // ← line 286, NEWER builds only
    className: panel, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId,
    children: [
      jsxs("nav", { className: nav, children: [
        jsx("div", { className: navTitle, id: titleId, tabIndex: -1,
                     "data-modal-autofocus": active === undefined ? "" : undefined, … }),
        jsx("div", { className: navList, children: rows.map(row =>
          jsxs("button", { className: clsx(navCell, active), "aria-current": …,
                           "data-modal-autofocus": row.id === active ? "" : undefined, children: [
            navIcon(row.id),                      // inline <svg>
            jsx("span", { className: navLabel, children: row.label }),
          ] }, row.id)) }),
      ] }),
      jsxs("div", { className: content, children: [
        jsxs("div", { className: header, children: [
          jsx("div", { className: actions, children: renderSlot("settings.action", {}) }),
          jsx("button", { className: close, … }),                       // Close AFTER actions
        ] }),
        jsx("div", { className: options,
                     children: active !== undefined && renderSlot("settings.section", …) }),
      ] }),
    ] }),
] }), document.body);
```

Version B has the identical tree **minus** `data-shortcut-modal` and `data-modal-autofocus` (it has no `data-*` attribute in that file at all).

| # | Claim | Evidence | Verdict |
|---|---|---|---|
| 1 | `role="dialog"` + `aria-modal="true"` identify the settings panel on **both** versions | A: `:291-294`; B: `client.js:122-126` | ✅ primary anchor |
| 2 | `data-shortcut-modal="settings"` exists only on newer builds | grep: **1 hit** in A's settings-general; **0 hits** in B's whole `@deepseek-ai` tree and in C | ⚠️ fallback only |
| 3 | The panel is body-portaled | `createPortal(…, document.body)` | ✅ |
| 4 | `settings.action` renders in `.header > .actions`, before Close | `:315-322` | ✅ |
| 5 | `nav`'s direct children are the heading and the row list (rows are **grandchildren**) | `:291-313` | ✅ (drives the `gap` fix) |
| 6 | Rows are `button > (inline svg + span.label)` | `:301-313`; icons resolve to `Icon*OutlineArtwork` → `jsxs("svg", …)` | ✅ rail path is reachable |
| 7 | The `.options` node is `.content`'s last child today | `:317` header, `:331` options | ✅ but structurally fragile |
| 8 | The slot outlet is a `display:contents` wrapper; the section root is its child | renderer: `ANCHOR_STYLE = { display: "contents" }`, `<div data-slot={slotKey} style={ANCHOR_STYLE}>` | ✅ confirms the 480px rule must target `[data-slot="settings.section"] > *` |
| 9 | Initial focus comes from `[data-modal-autofocus]`, with no visibility check | primitives `index.js:3686`: `element.querySelector("[data-modal-autofocus]") ?? element.querySelector(focusable) ?? element` | ✅ (drives the `:not([data-modal-autofocus])` guard) |

### 2.2 Manifest / API fields

| # | Claim | Evidence | Verdict |
|---|---|---|---|
| 10 | `dsh.client.immediately` is a legal boolean | `dsh-client-modules/src/index.ts:121` | ✅ |
| 11 | `dsh.client.inject` is the documented module-load-order declaration | `src/index.ts` (`optionalStringArray`), same shape as the reference bundle | ✅ |
| 12 | `settings.action` is declared `{ kind: 'list', scope: 'root' }` by the settings shell | `ui-settings-general/src/client/index.ts:147` | ✅ |
| 13 | `ctx.slots.inject(key, () => ctx.slots.register({ name, id, order }, Component))` matches the official example | `cordis-client-runner/src/client/slot-catalog.ts:1119` | ✅ |
| 14 | `window.__ModuleLoader__.load({ id, factory })` is the required registration form | `dsh-client-modules/lib/client.js` (every shipped client plugin) | ✅ |
| 15 | Every CSS custom property used exists | grep in A's tree: `--dsh-frame-top-clearance`, `--dsw-radius-sm`, `--dsw-alias-label-primary`, `--dsw-alias-interactive-bg-hover` all present (primitives et al.) | ✅ |

## 3. Changes in 1.0.0 (and why)

The first working draft keyed **everything** on `data-shortcut-modal="settings"`. On version B that attribute does not exist, so the button would render and then do nothing, silently. 1.0.0 removes that coupling and fixes the four defects found while reviewing the draft:

| # | Change | Why |
|---|---|---|
| 1 | Anchor on our own marker: resolve the panel from our button via `closest('[role="dialog"][aria-modal="true"]')`, tag it `data-dsh-settings-nav-panel`, scope the CSS on it | works on every released shell (check #1), instead of only on builds that happen to carry a package-internal attribute |
| 2 | Write the applied value only when it changed | every rule is attribute-scoped over the whole document; an unchanged `setAttribute` still makes the engine re-evaluate them (the mutation observer fires on every settings-panel mutation on a phone) |
| 3 | Re-assert the style on the same path as the state | a plugin dispose (HMR / reinstall) removes the `<style>` while the component stays mounted; the observer used to restore the attribute only, leaving "button says collapsed, panel is not" |
| 4 | `gap` moved from `nav` to the row list | rows live one level deeper (check #5), so a `gap` on `nav` never reaches them |
| 5 | `aria-pressed` derived from the applied value; compact counts as collapsed | it used to report the *requested* value, so the compact fallback announced "collapsed" while labels were visible — or vice versa |
| 6 | The heading is not hidden while it carries `data-modal-autofocus` | hiding it turns the modal layer's initial focus into a no-op (check #9) |
| 7 | `.options` also addressed via `:has(> [data-slot="settings.section"])` | survives a future child appended to the content column; the `:has()` rule simply drops on an old engine, the structural rule stays |
| 8 | `max-width: calc(100vw - 16px)` now applies to compact as well as rail | both are "narrow nav" states |

## 4. Arithmetic (rail, content box = `min(800, 100vw−16) − 56 − 32`)

| Viewport | panel | nav | content | content box | canvas | horizontal pan |
|---|---|---|---|---|---|---|
| 360px | 344 | 56 | 288 | **256** | 480 | 224 |
| 414px | 398 | 56 | 342 | **310** | 480 | 170 |
| 600px | 584 | 56 | 528 | **496** | 496 (≥480, rule inert) | 0 |
| ≥641px | `@media` not matched | 188 | — | — | not set | 0 |

The `min-width` only bites below ~584px; between 584px and 640px the media query matches but the content is already wide enough.

## 5. Still requires a human with a browser

Neither the development install nor this repository has browser automation, so the following are **not** verified here:

1. 360px / 414px: does the content area actually pan left–right, is it comfortable, does a scrollbar cover anything?
2. Does the panel stop being clipped by browser chrome when the address bar shows/hides (`dvh`), i.e. does the height change?
3. rail ↔ expanded round-trip; does the choice survive a refresh (`localStorage["dsh.settingsNav"]`); is the first frame flash-free (no expanded→collapsed jump)?
4. The expanded state on 360px: is the 480px canvas + panning acceptable, or should it wrap instead?
5. 600px and desktop (≥641px): confirm no horizontal scrolling appears and the panel is still 800px.
6. Screen-reader reading of the toggle (`aria-pressed` + bilingual label), in both rail and compact fallback.

## 6. Repository-level checks (automated)

`npm run check` parses both entry points; `npm test` pins the invariants that actually regressed during development:

- package name agreement across `package.json`, `cordis.patch.yml` and the `__ModuleLoader__` id;
- the patch layer inserts rather than disables;
- no `@deepseek-ai/*` import in the shipped code (only the documented `dsh.client.inject` mention in `package.json`);
- no package-internal attribute and no hashed class name in the CSS;
- the dialog anchor stays primary and the legacy attribute stays a fallback;
- the applied value is not rewritten unchanged, and `sync()` re-creates the style;
- the row gap targets the row list;
- the autofocus node is never hidden;
- no `!important`;
- every path in `files`/`exports` exists.
