---
name: semiconductor-dashboard-perf
description: >-
  Provides performance optimization, anti-crash runbooks, Chart.js canvas safety rules,
  active-tab isolation, multi-select filter semantics, and automated simulation gates for
  the Semiconductor Sanity CSV Executive Dashboard. Use whenever developing, refactoring,
  or debugging large dataset parsing, table rendering, filter logic, chart maximizing, or
  standalone bundle generation.
---

# Semiconductor Dashboard Performance & Anti-Crash Skill

This skill contains runbooks, architectural patterns, and verification gates for developing and maintaining the Semiconductor Executive Dashboard.

---

## Critical Runbooks & Rules

### 1. Handling Large Datasets (50,000+ Rows) & Canvas Safety
1. **Pre-Resolve Keys Once**:
   ```javascript
   // Resolve once before iterating rows
   const kEcid = resolveKey('Coordinate_ECID', 'ECID', 'Die_ID');
   const kMean = resolveKey('Mean', 'MEAN', 'Avg');
   const kCv   = resolveKey('CV (%)', 'CV%', 'CV');

   rows.forEach(r => {
     const ecid = kEcid ? r[kEcid] : '';
     const mean = parseFloat(kMean ? r[kMean] : 0) || 0;
   });
   ```
2. **Limit DOM Table Rows — with no exceptions**:
   - Initial render: 300 to 500 rows.
   - Load More: increment by 500 to 1,000 rows.
   - Max Safe Limit (if using a hard cap): 2,000–2,500 rows.
   - **Audit every table explicitly, including "secondary" ones.** `renderExplorerTable()` (the Raw Data / Trace Explorer tab — default dataset: Repeatability CSV) was found completely unbounded, rendering 50k+ rows into the DOM on every load and on every keystroke of its live-search box. Measured cost: 8.75s of an 12.7s post-upload freeze on a 54k-row file. Do not assume a cap exists just because sibling tables have one.
   - **When users genuinely need to reach every row** (not just a capped preview), implement **virtual/windowed rendering** instead of raising the cap: render only the rows scrolled into the viewport (+ a small buffer, e.g. 10 rows) as real `<tr>` elements, and reserve correct scroll height with top/bottom spacer `<tr>` elements sized `offscreenRowCount * rowHeight`. Recompute the visible window on the container's `scroll` event (throttled via `requestAnimationFrame`), and self-correct the assumed `rowHeight` from a real rendered row's `getBoundingClientRect().height` once per dataset load. This keeps live DOM row count constant (tens of rows) regardless of total dataset size.
   - **Debounce every live-search input** (100–150ms) bound via `oninput`/`onkeyup`. A synchronous re-render per keystroke compounds badly once combined with an unbounded or even a moderately large table.
3. **Bar & Pareto Chart Series Capping**:
   - Strictly slice long lists to **Top 40** worst parameters (`items.slice(0, 40)`).
   - Enforce an upper bound on scrollable canvas wrapper widths (maximum `2,400px`) to prevent GPU bitmap memory freezing.

---

### 2. Active-Tab Canvas Rendering Isolation
- When updating filters, presets, or test ignore rules, **only redraw charts for the currently active tab**.
- Inactive tabs with CSS `display: none` (0px × 0px) must not execute Chart.js drawing routines until the user switches to that tab.

---

### 3. Fullscreen Chart & Table Maximization Without Circular JSON Errors
1. Never use `JSON.stringify(chart.config.options)`.
2. Construct explicit modal options:
   ```javascript
   const modalOptions = {
     responsive: true,
     maintainAspectRatio: false,
     indexAxis: srcConfig.options?.indexAxis || 'x',
     plugins: {
       legend: { ... },
       tooltip: { enabled: true, callbacks: srcConfig.options?.plugins?.tooltip?.callbacks }
     },
     scales: clonedScales
   };
   ```
3. Wrap all modal and drilldown actions in `try...catch` blocks.

---

### 4. Traceability Inspector State Management
- Always reset `traceRowLimit = 300` at the start of `TraceabilityManager.trace(...)`.
- Cap `loadAllTraceRows()` at a safe threshold (2,000 rows max).

---

### 5. Centralized Timestamps & DOM ID Uniqueness
- Maintain unique DOM IDs across `index.html` (e.g. distinct IDs for `#headerTimestamp`, `#overviewSnapshotTimestamp`, `#headerSubTitle`).
- Centralize all timestamp and version metadata updates inside `SemiconductorApp.updateHeaderMeta(timestampStr)`.
- **Don't write the same piece of information to two visible locations unless each serves a distinct purpose.** `updateHeaderMeta` previously wrote the same "Updated: <timestamp>" text into both the `#headerTimestamp` badge *and* appended it to the `#headerSubTitle` text, so the header visibly showed the same date twice. Centralizing the *update mechanism* doesn't by itself prevent duplicate *content* — review what each centralized call site actually renders.
- Never define duplicate method names in JavaScript classes.

---

### 6. Multi-Select "ALL" Sentinel Filters
- Filters that default to "everything selected" (ECID / Test / Trend / Dist / Dist_Repeat multi-selects) represent that state implicitly with a single `'ALL'` sentinel in the `Set`, not by enumerating every value.
- **Deselecting one option while implicitly-all-selected is not the same operation as deselecting while a single option is selected** — treating them identically (`set.clear(); set.add('NONE')`) wipes every other option the instant the user unchecks their first item.
- Correct pattern:
  ```javascript
  if (set.has('ALL')) {
    if (isChecked) {
      // already implicitly selected; no-op
    } else {
      // materialize ALL into the true, uncapped list of values (from the
      // underlying analysis data, not the display-capped checkboxes),
      // then remove only the one the user unchecked.
      const allValues = getAllFilterValues(type);
      set.clear();
      allValues.forEach(v => set.add(v));
      set.delete(value);
      if (set.size === 0) set.add('NONE');
    }
  }
  ```

---

### 7. Inline Event Handler String Injection
- Never re-embed an already HTML-escaped value a second time inside an inline `onclick`/`onchange` JS string, e.g. `onchange="foo('${safeEsc(value)}')"`. Browsers HTML-decode attribute values *before* the JS parser sees them, so an escaped apostrophe (`&#039;`) decodes back into a literal `'` and breaks out of the string — silently breaking any filter checkbox whose label contains an apostrophe.
- Read the value back off the element inside the handler instead of re-interpolating it: `onchange="window.app.onMultiSelectOptionToggle('ecid', this.value, this.checked)"`. This sidesteps the escaping mismatch entirely, regardless of what characters the underlying CSV data contains.

---

### 8. Two-Tier Verification Gate (Automated Syntax & Runtime Simulation)
- The build script `python bundle_standalone.py` enforces a **two-tier gate**:
  1. **AST Syntax Validation**: `node -c js/*.js` verifies clean syntax.
  2. **End-to-End Headless Runtime Simulation**: Tests app initialization, all 8 tab switches (including `help`), test ignore filtering, presets, and metadata synchronization with 0 exceptions.
- **Know this gate's blind spot**: the headless simulation mocks `document.getElementById` with a generic stub and runs against small bundled sample CSVs, so it only catches *wiring* errors (undefined functions, thrown exceptions) — not DOM-volume or performance bugs. An unbounded `innerHTML` render passes this gate with "0 runtime exceptions" while still freezing a real browser on a large CSV. When touching a rendering path, additionally load-test it against a large synthetic CSV (thousands of ECIDs) in a real browser (e.g. via Playwright) before trusting this gate alone.
- Never conclude code modifications without executing `python bundle_standalone.py` and confirming exit code 0.
