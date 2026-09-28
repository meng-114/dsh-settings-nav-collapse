// Client half of @mengli114/dsh-settings-nav-collapse.
//
// Adds one toggle button to the settings panel header (settings.action slot,
// left of the close button). The button collapses the settings navigation
// column of the open panel into a narrow icon rail, so the content column
// keeps a readable width on narrow viewports (phones).
//
// Anchoring policy
// ----------------
// The panel is located from our OWN button, never from a package-internal
// attribute: `closest('[role="dialog"][aria-modal="true"]')` holds on every
// released shell (verified on 0.1.5-rc.1 and 0.1.7-rc.2), while
// `data-shortcut-modal` only exists on newer builds. The resolved panel is
// tagged with our own `data-dsh-settings-nav-panel`, and that is what every
// rule below keys on. `[data-modal-autofocus]` (primitives modal layer) and
// `[data-slot="settings.section"]` (renderer slot outlet) are official,
// stable surfaces.
//
// No hashed class name and no Harness Client package is imported.
window.__ModuleLoader__.load({
  id: '@mengli114/dsh-settings-nav-collapse',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PLUGIN_ID = '@mengli114/dsh-settings-nav-collapse';
    const PANEL_MARK = 'data-dsh-settings-nav-panel';
    const ATTR = 'data-dsh-settings-nav';
    const TOGGLE_ATTR = 'data-dsh-settings-nav-toggle';
    const STYLE_ATTR = 'data-plugin';
    const STORAGE_KEY = 'dsh.settingsNav';
    const NARROW_QUERY = '(max-width: 640px)';
    const RAIL_WIDTH = 56;
    const COMPACT_WIDTH = 88;
    // Locate the panel from our own node. The dialog selector is the primary,
    // version-independent anchor; the legacy attribute stays as a fallback for
    // a shell that stops marking the panel as a modal dialog.
    const PANEL_SELECTOR = '[role="dialog"][aria-modal="true"]';
    const PANEL_SELECTOR_FALLBACK = '[data-shortcut-modal="settings"]';
    const ROW_LIST_SELECTOR = 'nav > div:last-child';
    // The Client locale service API could not be confirmed, so the two labels
    // are bilingual constants instead of locale lookups.
    // State semantics: aria-pressed already carries the action affordance.
    const LABEL_COLLAPSED = '设置导航已折叠，点击展开 / Settings navigation collapsed, click to expand';
    const LABEL_EXPANDED = '设置导航已展开，点击折叠 / Settings navigation expanded, click to collapse';

    const CSS = `
/* @mengli114/dsh-settings-nav-collapse — every rule is scoped to our own
   markup: html[data-dsh-settings-nav] (applied state) plus the panel marker
   [data-dsh-settings-nav-panel] that the client half puts on the resolved
   settings panel. No hashed class name, no package-internal attribute. */

html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav,
html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] nav {
  box-sizing: border-box;
  flex: 0 0 auto;
  overflow: hidden;
}

/* On a phone the panel gains back the horizontal margin the narrow nav frees. */
html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel],
html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] {
  max-width: calc(100vw - 16px);
}

html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav {
  width: ${RAIL_WIDTH}px;
  min-width: ${RAIL_WIDTH}px;
  max-width: ${RAIL_WIDTH}px;
  padding: 22px 8px 0;
}

html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] nav {
  width: ${COMPACT_WIDTH}px;
  min-width: ${COMPACT_WIDTH}px;
  max-width: ${COMPACT_WIDTH}px;
  padding: 16px 6px 0;
}

/* Row spacing belongs to the list wrapper: nav's own children are the heading
   and that wrapper, so a gap on nav never reaches the rows themselves. */
html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] ${ROW_LIST_SELECTOR} {
  gap: 8px;
}

html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] ${ROW_LIST_SELECTOR} {
  gap: 4px;
}

/* The nav heading is redundant on a narrow nav; never hide an interactive row,
   and never hide the node the modal layer focuses on open (data-modal-autofocus
   is on the heading only while no section is selected — hiding it would make
   that initial focus a no-op). Deliberately avoids the relational
   pseudo-class: an unsupported selector would drop the whole rule instead of
   only the extra guard. */
html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav > :first-child:not(button):not(a):not(input):not([data-modal-autofocus]),
html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] nav > :first-child:not(button):not(a):not(input):not([data-modal-autofocus]) {
  display: none;
}

/* Rail: keep the icon of every nav row, drop every text label.
   The shipped rows are a button holding an inline svg plus a label span. */
html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav button {
  justify-content: center;
  gap: 0;
  padding-left: 0;
  padding-right: 0;
  min-width: 0;
}

html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav button > span {
  display: none;
}

html[data-dsh-settings-nav="rail"] [data-dsh-settings-nav-panel] nav button svg {
  flex: none;
  margin: 0;
}

/* Fallback when nav rows carry no inline svg icon: a blank rail would be
   useless, so keep the labels and only narrow the column. */
html[data-dsh-settings-nav="compact"] [data-dsh-settings-nav-panel] nav button {
  justify-content: center;
  gap: 4px;
  padding-left: 6px;
  padding-right: 6px;
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}

/* On a phone the panel must fit the *visible* viewport: dynamic units keep it
   clear of browser chrome, and the content column becomes the scrollable
   viewport instead of being squeezed by the screen width. */
@media (max-width: 640px) {
  html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] {
    height: min(800px, calc(100vh - 2 * max(16px, var(--dsh-frame-top-clearance, 24px))));
    height: min(800px, calc(100dvh - 2 * max(16px, var(--dsh-frame-top-clearance, 24px))));
    max-height: calc(100dvh - 16px);
  }
}

html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] > nav + div {
  min-height: 0;
}

/* The content column: addressed structurally, plus the same rule again anchored
   on the official slot outlet so it survives a future child being appended to
   the content column (the :has() form simply drops on an old engine). */
html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] > nav + div > div:last-child {
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] > nav + div > div:has(> [data-slot="settings.section"]) {
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

@media (max-width: 640px) {
  html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] > nav + div > div:last-child {
    padding: 0 16px 16px;
  }

  html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] > nav + div > div:has(> [data-slot="settings.section"]) {
    padding: 0 16px 16px;
  }

  /* Give the settings page a canvas it can lay out on; pan horizontally.
     The slot outlet anchor is display:contents (it generates no box), so the
     page root — the anchor's own child, addressed through the renderer's
     data-slot surface — is what must carry the width. */
  html[data-dsh-settings-nav] [data-dsh-settings-nav-panel] [data-slot="settings.section"] > * {
    min-width: 480px;
  }
}

/* Our own toggle control, in the panel content header. */
[data-dsh-settings-nav-toggle] {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, currentColor);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

[data-dsh-settings-nav-toggle]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
}

[data-dsh-settings-nav-toggle]:active {
  transform: scale(0.96);
}

[data-dsh-settings-nav-toggle]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}

[data-dsh-settings-nav-toggle] svg {
  display: block;
  pointer-events: none;
}
`;

    /* ---------- shared, module-level resources ---------- */

    let instances = 0;
    let previousAttr = null;
    let panelEl = null;
    let styleEl = null;

    function safeGet(el, name) {
      try {
        return el ? el.getAttribute(name) : null;
      } catch (err) {
        return null;
      }
    }

    function safeSet(el, name, value) {
      try {
        if (el) el.setAttribute(name, value);
      } catch (err) { /* ignore */ }
    }

    function safeRemove(el, name) {
      try {
        if (el) el.removeAttribute(name);
      } catch (err) { /* ignore */ }
    }

    function matchMediaQuery() {
      try {
        if (typeof window.matchMedia !== 'function') return null;
        return window.matchMedia(NARROW_QUERY);
      } catch (err) {
        return null;
      }
    }

    function subscribe(mql, listener) {
      if (!mql) return;
      try {
        if (typeof mql.addEventListener === 'function') mql.addEventListener('change', listener);
        else if (typeof mql.addListener === 'function') mql.addListener(listener);
      } catch (err) { /* ignore */ }
    }

    function unsubscribe(mql, listener) {
      if (!mql) return;
      try {
        if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', listener);
        else if (typeof mql.removeListener === 'function') mql.removeListener(listener);
      } catch (err) { /* ignore */ }
    }

    function readStored() {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        return value === 'rail' || value === 'expanded' ? value : null;
      } catch (err) {
        return null; // private mode / blocked storage: fall back to the viewport default
      }
    }

    function writeStored(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (err) { /* ignore */ }
    }

    function viewportDefault() {
      const mql = matchMediaQuery();
      return mql && mql.matches ? 'rail' : 'expanded';
    }

    function initialRequested() {
      return readStored() || viewportDefault();
    }

    // Resolve the settings panel from our own mounted node. `closest` walks up
    // from the settings.action outlet, so the nearest dialog is the panel.
    function resolvePanel(node) {
      try {
        if (!node || typeof node.closest !== 'function') return null;
        return node.closest(PANEL_SELECTOR) || node.closest(PANEL_SELECTOR_FALLBACK) || null;
      } catch (err) {
        return null;
      }
    }

    function railIsUsable(panel) {
      try {
        if (!panel) return false;
        const nav = panel.querySelector('nav');
        return !!(nav && nav.querySelector('button svg'));
      } catch (err) {
        return false;
      }
    }

    // "rail" is only usable when the nav rows actually carry an inline svg.
    function domValue(panel, requested) {
      if (requested !== 'rail') return 'expanded';
      return railIsUsable(panel) ? 'rail' : 'compact';
    }

    // Re-assert the applied state. Writing the same value is skipped: every
    // rule here is attribute-scoped over the whole document, and an unchanged
    // setAttribute still makes the engine re-evaluate those selectors.
    function applyState(panel, requested, onApplied) {
      const next = domValue(panel, requested);
      let root = null;
      try {
        root = document.documentElement;
      } catch (err) {
        root = null;
      }
      if (root && safeGet(root, ATTR) !== next) safeSet(root, ATTR, next);
      if (typeof onApplied === 'function') onApplied(next);
      return next;
    }

    function restoreAttr() {
      let root = null;
      try {
        root = document.documentElement;
      } catch (err) {
        root = null;
      }
      if (previousAttr === null || previousAttr === undefined) safeRemove(root, ATTR);
      else safeSet(root, ATTR, previousAttr);
      previousAttr = null;
    }

    function ensureStyle() {
      try {
        if (styleEl && styleEl.isConnected) return;
        const existing = document.head.querySelector('style[' + STYLE_ATTR + '="' + PLUGIN_ID + '"]');
        if (existing) {
          styleEl = existing;
          return;
        }
        const el = document.createElement('style');
        el.setAttribute(STYLE_ATTR, PLUGIN_ID);
        el.textContent = CSS;
        document.head.appendChild(el);
        styleEl = el;
      } catch (err) { /* ignore */ }
    }

    function removeStyle() {
      try {
        if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        styleEl = null;
        const existing = document.head.querySelector('style[' + STYLE_ATTR + '="' + PLUGIN_ID + '"]');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      } catch (err) { /* ignore */ }
    }

    // Tag the resolved panel with our own marker and adopt it for teardown.
    // Idempotent, so the self-healing path can re-assert it after a dispose.
    function markPanel(panel) {
      if (!panel) return;
      if (safeGet(panel, PANEL_MARK) === null) safeSet(panel, PANEL_MARK, '');
      if (panelEl !== panel) {
        if (panelEl) safeRemove(panelEl, PANEL_MARK);
        panelEl = panel;
      }
    }

    function installInstance(panel) {
      if (instances === 0) previousAttr = safeGet(document.documentElement, ATTR);
      instances += 1;
      markPanel(panel);
      ensureStyle();
    }

    function releaseInstance() {
      // The plugin-dispose path may already have torn the shared resources
      // down while this instance is still mounted; never go negative.
      if (instances <= 0) return;
      instances -= 1;
      if (instances > 0) return;
      teardownAll();
    }

    function teardownAll() {
      instances = 0;
      restoreAttr();
      if (panelEl) {
        safeRemove(panelEl, PANEL_MARK);
        panelEl = null;
      }
      removeStyle();
    }

    /* ---------- view ---------- */

    function NavIcon(props) {
      const collapsed = !!props.collapsed;
      return h('svg', {
        viewBox: '0 0 16 16',
        width: 16,
        height: 16,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      },
        h('rect', { x: 1.75, y: 2.75, width: 12.5, height: 10.5, rx: 2.5 }),
        h('line', { x1: 6, y1: 2.75, x2: 6, y2: 13.25 }),
        h('polyline', { points: collapsed ? '3.1 6.4 4.7 8 3.1 9.6' : '4.4 6.4 2.8 8 4.4 9.6' })
      );
    }

    function SettingsNavToggle() {
      const buttonRef = React.useRef(null);
      const panelRef = React.useRef(null);
      const [requested, setRequested] = React.useState(initialRequested);
      // Optimistic until the mount effect resolves the panel and re-derives it
      // (layout effects run before the first paint, so this never renders).
      const [applied, setApplied] = React.useState(() => (initialRequested() === 'rail' ? 'rail' : 'expanded'));
      const requestedRef = React.useRef(requested);
      const explicitRef = React.useRef(readStored() !== null);
      requestedRef.current = requested;

      // Re-assert every shared resource and the state. Safe to call at any
      // time: the panel marker and the style are re-created if a dispose
      // removed them while we stayed mounted, and an unchanged attribute value
      // is not written.
      const sync = React.useCallback((nextRequested) => {
        const panel = panelRef.current;
        if (!panel) return;
        markPanel(panel);
        ensureStyle();
        applyState(panel, nextRequested, (next) => {
          setApplied((prev) => (prev === next ? prev : next));
        });
      }, []);

      // Own the shared resources and the viewport listener for this mount.
      React.useLayoutEffect(() => {
        const panel = resolvePanel(buttonRef.current);
        if (!panel) return undefined;
        panelRef.current = panel;
        installInstance(panel);
        sync(requestedRef.current);

        const mql = matchMediaQuery();
        const onViewportChange = () => {
          // An explicit user choice always wins; otherwise follow the viewport.
          if (!explicitRef.current) setRequested(viewportDefault());
        };
        subscribe(mql, onViewportChange);

        // The nav rows may render after this instance (or change later), so
        // re-derive the DOM value on every panel mutation; a fallback is never
        // stuck, and the style is re-asserted on the same path.
        let observer = null;
        try {
          if (typeof MutationObserver === 'function') {
            observer = new MutationObserver(() => {
              sync(requestedRef.current);
            });
            observer.observe(panel, { childList: true, subtree: true });
          }
        } catch (err) { /* ignore */ }

        return () => {
          unsubscribe(mql, onViewportChange);
          if (observer) {
            try {
              observer.disconnect();
            } catch (err) { /* ignore */ }
            observer = null;
          }
          panelRef.current = null;
          releaseInstance();
        };
      }, [sync]);

      // Apply the state before the first paint so the panel never flashes
      // expanded and then collapses.
      React.useLayoutEffect(() => {
        sync(requested);
      }, [requested, sync]);

      const toggle = React.useCallback(() => {
        const next = requestedRef.current === 'rail' ? 'expanded' : 'rail';
        explicitRef.current = true;
        writeStored(next);
        setRequested(next);
      }, []);

      // aria reflects the state that is actually applied (rail AND the compact
      // fallback both mean "the navigation column is narrow").
      const collapsed = applied !== 'expanded';
      const label = collapsed ? LABEL_COLLAPSED : LABEL_EXPANDED;

      return h('button', {
        ref: buttonRef,
        type: 'button',
        [TOGGLE_ATTR]: '',
        'aria-pressed': collapsed ? 'true' : 'false',
        'aria-label': label,
        title: label,
        onClick: toggle,
      }, h(NavIcon, { collapsed }));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // Plugin teardown removes the attribute, the panel marker and the style
        // element even if the component never unmounts.
        if (ctx && typeof ctx.effect === 'function') {
          ctx.effect(() => teardownAll);
        }
        ctx.slots.inject('settings.action', () => ctx.slots.register({
          name: 'settings.action',
          id: 'settings-nav-collapse',
          order: 0,
        }, SettingsNavToggle));
      },
    };
  },
});
