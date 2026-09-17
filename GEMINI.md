# Semiconductor Dashboard Development Guidelines & Anti-Crash Rules

This document outlines mandatory coding and architectural standards for the **Semiconductor Sanity Check & Shift Analyzer Dashboard** codebase. Follow these rules to prevent browser freezing, performance degradation, and runtime crashes.

---

## 1. High-Performance CSV Parsing & Big Data Handling (50k+ Rows)
- **Pre-Resolve Keys**: Never run `Object.keys()` or regex searches (`findVal`) inside per-row loops. Pre-resolve column header keys *once* prior to iterating rows to guarantee $O(1)$ property access.
- **DOM Node Limiting & Chunking**:
  - Never synchronously render thousands of `<tr>` / `<td>` elements into the DOM.
  - Set default table view limits (e.g., 300–500 rows) and provide safe batch expansion ("Load More +1000", max safe limit 2,500).
  - Multi-select dropdown menus with dynamic items must slice display items (e.g. max 100–400) and rely on the live search input for larger sets.
  - **This applies to EVERY row-rendering table, with no exceptions** — a 2026-09 audit found `renderExplorerTable()` (the Raw Data / Trace Explorer tab, whose default dataset is the Repeatability CSV) had been left completely unbounded, rendering the entire dataset (50k+ rows) into the DOM on every load and on every keystroke in its live-search box. That single gap caused an 8.75s main-thread freeze on a 54k-row file and was the actual cause of "filtering the Repeatability data crashes the browser" reports. When auditing or adding a new table, check it explicitly — do not assume the cap exists just because other tables have it.
  - When a UI genuinely needs to expose **every** row (not just a capped preview), prefer **virtual/windowed rendering** over raising the cap: keep only the rows currently scrolled into view (+ a small buffer) as real `<tr>` elements, and reserve the correct scroll height with top/bottom spacer rows sized `offscreenRowCount * rowHeight`. This lets users reach the full dataset by scrolling while the live DOM node count stays constant regardless of total row count.
  - **Debounce live-search inputs.** Any `oninput`/`onkeyup` handler that re-filters and re-renders a table must be debounced (100–150ms), never fired synchronously per keystroke — otherwise fast typing queues up multiple full re-renders faster than they can complete.
- **Chart Series Capping & Canvas Dimension Limits**:
  - Bar / Pareto charts (such as Repeatability Test CV% or TSR Failure Pareto) **must strictly slice to Top 40–50 worst items**. Never pass hundreds or thousands of elements directly into a Chart.js dataset or let horizontal scroll wrappers scale width linearly without an upper bound (max 2,400px), which causes browser GPU thread memory exhaustion and freezing.

---

## 2. Active-Tab Canvas Rendering Isolation & Error Boundaries
- **Active-Tab Only Drawing**:
  - When applying global filters, test ignore rules, or dataset loading, **never re-render Chart.js canvases across inactive tabs** that have `display: none` (0px $\times$ 0px dimensions). Chart.js calculations on zero-dimension DOM elements throw layout calculation exceptions.
  - Check `if (this.state.activeTab === targetTab)` before invoking Chart.js canvas draw routines. Inactive tabs will cleanly refresh when switched into.
- **No `JSON.stringify` on Chart.js Options**:
  - `chart.config.options` contains callback functions, scale instances, and circular references. Calling `JSON.parse(JSON.stringify(options))` throws `TypeError: Converting circular structure to JSON` and crashes the application.
  - Explicitly map only required properties (`responsive`, `maintainAspectRatio`, `plugins.legend`, `scales`, `tooltip.callbacks`, `onClick`) when cloning configurations for fullscreen modals (`maximizeChart`).
- **Try-Catch Protection**:
  - Always wrap interactive chart handlers (`maximizeChart`, `maximizeTable`, `onClick`, `trace`, `switchTab`) in `try...catch` blocks to prevent unhandled exceptions from breaking UI interactivity.

---

## 3. Traceability Engine & Modal State Management
- **State Reset on Open**:
  - Always reset `traceRowLimit = 300` at the start of `TraceabilityManager.trace()`. Never let `Infinity` from a previous "Show All" action persist across subsequent drill-downs.
  - Set a safe maximum cap (e.g., 2,000 rows) on "Show All" in trace inspectors.

---

## 4. Metadata, Timestamp Synchronization & DOM Uniqueness
- **Centralized Timestamp & Metadata Updating**:
  - Keep `updateHeaderMeta(timestampStr)` centralized in `app.js` to synchronously update the top navigation badge (`#headerTimestamp`), the platform subtitle (`#headerSubTitle`), the overview report snapshot (`#overviewSnapshotTimestamp`), and tab-level loaded timestamp badges.
- **No Duplicate DOM IDs or Class Methods**:
  - Ensure all element IDs across `index.html` are globally unique (e.g. avoid repeating `#headerTimestamp`).
  - Never declare duplicate method names inside the `SemiconductorApp` class, which causes silent method overwrite bugs.

---

## 5. Parametric Calculations & CV% Rules
- **Absolute Value for CV%**:
  - All CV% metrics, thresholds, and risk gradings must evaluate absolute value: `Math.abs(CV%) >= threshold` (e.g. `|CV%| >= 5.0%`, `|CV%| >= 10.0%`).
- **Capability Grading (Cp & CPKn)**:
  - High Risk: `Cp < 1.67` or `|CV%| >= 15.0%`.
  - Marginal Risk: `Cp < 4.0` or `|CV%| >= 8.0%` or active drift/shift.

---

## 6. Multi-Select "ALL" Sentinel Filters
- Filters that default to "everything selected" (ECID / Test / Trend / Dist / Dist_Repeat multi-selects) represent that state implicitly with a single `'ALL'` sentinel in the `Set`, not by enumerating every value.
- **Never treat "deselect one option while in the implicit ALL state" the same as "deselect while a single option is selected."** Clearing the whole set and adding `'NONE'` in that branch wipes every other option the moment the user unchecks their first item — this shipped as a real bug (`onMultiSelectOptionToggle`) where removing one filter option silently removed all of them.
- Correct handling: when `set.has('ALL')` and the user unchecks a specific value, first **materialize** `'ALL'` into an explicit set of every real value for that filter type (read the true, uncapped list from the underlying analysis data — not from the on-screen checkboxes, which may be display-capped), then delete only the unchecked value. Only collapse to `'NONE'` once the explicit set becomes empty.

---

## 7. Inline Event Handler String Injection
- Never re-embed an already HTML-escaped value a second time inside an inline `onclick`/`onchange` JS string, e.g. `onchange="foo('${safeEsc(value)}')"`. The browser HTML-decodes attribute values *before* handing them to the JS parser, so an escaped apostrophe (`&#039;`) decodes back into a literal `'` and breaks out of the string — this silently broke any ECID/Test/Trend/Dist filter checkbox whose label contained an apostrophe.
- Prefer reading the value back off the element itself inside the handler (`this.value`, or a `data-*` attribute) instead of re-interpolating it: `onchange="window.app.onMultiSelectOptionToggle('ecid', this.value, this.checked)"`. This sidesteps the escaping mismatch entirely regardless of what characters the underlying CSV data contains.

---

## 8. Mandatory Automated Verification & Simulation Gate
- **Two-Tier Pre-Build Verification**:
  1. **AST Syntax Parsing**: `node -c js/*.js` checks all individual JS files for syntax errors.
  2. **Headless Runtime Simulation**: `bundle_standalone.py` executes an end-to-end Node.js runtime simulation verifying that `init()`, all 8 tab switches (including `help`), test ignore filtering, presets, and metadata updates execute with 0 runtime exceptions.
  - **This simulation only catches wiring errors (undefined functions, thrown exceptions), not performance/DOM-volume bugs** — it runs against the small bundled sample CSVs and mocks `getElementById` to return a generic stub, so an unbounded `innerHTML` render (like the Explorer table bug above) reports 0 exceptions and still passes. When fixing or auditing a rendering path, additionally test it against a large synthetic CSV (thousands of ECIDs) in a real browser (e.g. via Playwright) before trusting this gate alone.
- **Always Rebuild Standalone Bundle**:
  - Run `python bundle_standalone.py` to regenerate `semiconductor_dashboard_standalone.html` and guarantee that all verification gates pass before concluding any task.
