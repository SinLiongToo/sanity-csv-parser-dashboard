/**
 * Semiconductor Data Traceability & Drilldown Engine
 * Maps dashboard numbers, KPI cards, and charts directly to the source raw CSV records and mathematical formulas.
 */

class TraceabilityManager {
  constructor() {
    this.currentTraceData = null;
    this.initModal();
  }

  initModal() {
    // Check if drawer exists in DOM or create it
    if (!document.getElementById('traceDrawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'traceDrawer';
      drawer.className = 'trace-drawer';
      drawer.innerHTML = `
        <div class="trace-backdrop" onclick="window.traceManager.close()"></div>
        <div class="trace-panel">
          <div class="trace-header">
            <div class="trace-title-group">
              <div class="trace-badge">DATA TRACEABILITY INSPECTOR</div>
              <h3 id="traceTitle" class="trace-title">Metric Drilldown</h3>
              <p id="traceSubtitle" class="trace-subtitle">Source data verification</p>
            </div>
            <button class="trace-close-btn" onclick="window.traceManager.close()">✕</button>
          </div>

          <div class="trace-body">
            <!-- Formula & Calculation Rationale Box -->
            <div class="trace-formula-card">
              <div class="formula-header">
                <span class="formula-icon">📐</span>
                <span class="formula-label">CALCULATION & TRACEABILITY PROOF</span>
              </div>
              <div id="traceFormulaText" class="formula-content"></div>
            </div>

            <!-- Context Filter summary -->
            <div class="trace-filter-bar">
              <div class="filter-count">
                Matched Records: <span id="traceRowCount" class="text-cyan font-bold">0</span>
              </div>
              <div class="trace-actions">
                <input type="text" id="traceSearchInput" placeholder="Filter rows..." class="trace-search" oninput="window.traceManager.filterTable(this.value)">
                <button class="btn-subtle" onclick="window.traceManager.exportSubsetCsv()">⬇ Export CSV</button>
              </div>
            </div>

            <!-- Interactive Raw Data Table -->
            <div class="trace-table-container">
              <table id="traceDataTable" class="trace-data-table">
                <thead id="traceTableHead"></thead>
                <tbody id="traceTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }
  }

  /**
   * Open trace inspector with metric metadata and raw filtered items
   */
  trace(title, subtitle, formulaExplanation, rawRows, headers, sourceFilename = '') {
    this.traceRowLimit = 300;
    this.currentTraceData = {
      title,
      subtitle,
      formulaExplanation,
      rawRows: rawRows || [],
      headers: headers || (rawRows && rawRows.length > 0 ? Object.keys(rawRows[0]).filter(k => !k.startsWith('_')) : []),
      sourceFilename
    };

    const elTitle = document.getElementById('traceTitle');
    const elSubtitle = document.getElementById('traceSubtitle');
    const elFormula = document.getElementById('traceFormulaText');
    const elRowCount = document.getElementById('traceRowCount');
    const elSearchInput = document.getElementById('traceSearchInput');

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (elTitle) elTitle.textContent = title;
    if (elSubtitle) elSubtitle.innerHTML = `${safeEsc(subtitle)} &bull; <span class="text-gray-400">Source: ${safeEsc(sourceFilename || 'Active CSV')}</span>`;
    if (elFormula) elFormula.innerHTML = formulaExplanation;
    if (elRowCount) elRowCount.textContent = this.currentTraceData.rawRows.length;
    if (elSearchInput) elSearchInput.value = '';

    this.renderTable(this.currentTraceData.rawRows);

    const drawer = document.getElementById('traceDrawer');
    if (drawer) drawer.classList.add('open');
    if (document.body) document.body.classList.add('drawer-open');
  }

  renderTable(rows) {
    const thead = document.getElementById('traceTableHead');
    const tbody = document.getElementById('traceTableBody');
    const headers = this.currentTraceData.headers;
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (thead) {
      thead.innerHTML = `
        <tr>
          <th style="width: 50px;">#</th>
          ${headers.map(h => `<th>${safeEsc(h)}</th>`).join('')}
        </tr>
      `;
    }

    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${headers.length + 1}" class="text-center py-6 text-gray-400">No matching data records found</td></tr>`;
      return;
    }

    const limit = this.traceRowLimit || 300;
    const displayList = rows.slice(0, limit);
    const hasMore = rows.length > limit;

    let rowsHtml = displayList.map((r, idx) => {
      return `
        <tr>
          <td class="text-gray-500 font-mono">${r._rawRowIndex || (idx + 1)}</td>
          ${headers.map(h => {
            let val = r[h] !== undefined ? r[h] : '';
            let cellClass = '';
            if (h === 'Status') {
              cellClass = `status-badge-inline status-${String(val).toLowerCase().replace(/\s+/g, '-')}`;
            } else if (h === 'DSA_Group') {
              cellClass = `group-badge-inline group-${String(val).toLowerCase()}`;
            }
            return `<td class="${cellClass}" title="${safeEsc(val)}"><span class="cell-truncate">${safeEsc(val)}</span></td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    if (hasMore) {
      rowsHtml += `
        <tr>
          <td colspan="${headers.length + 1}" class="text-center py-3 bg-navy-900/60">
            <span class="text-xs text-gray-400 mr-3">Showing first ${limit} of ${rows.length} records</span>
            <button class="btn btn-secondary text-xs py-1 px-3 font-bold" onclick="window.traceManager.loadAllTraceRows()">
              ⬇ Show All (${rows.length})
            </button>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
  }

  loadAllTraceRows() {
    this.traceRowLimit = 2000;
    if (this.currentTraceData && this.currentTraceData.rawRows) {
      this.renderTable(this.currentTraceData.rawRows);
    }
  }

  filterTable(query) {
    if (!this.currentTraceData || !this.currentTraceData.rawRows) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      this.renderTable(this.currentTraceData.rawRows);
      document.getElementById('traceRowCount').textContent = this.currentTraceData.rawRows.length;
      return;
    }

    const filtered = this.currentTraceData.rawRows.filter(r => {
      return Object.entries(r).some(([k, v]) => {
        if (k.startsWith('_')) return false;
        return String(v).toLowerCase().includes(q);
      });
    });

    document.getElementById('traceRowCount').textContent = filtered.length;
    this.renderTable(filtered);
  }

  exportSubsetCsv() {
    if (!this.currentTraceData || !this.currentTraceData.rawRows || this.currentTraceData.rawRows.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = this.currentTraceData.headers;
    const rows = this.currentTraceData.rawRows;

    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      const line = headers.map(h => {
        let val = r[h] !== undefined ? String(r[h]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trace_subset_${Date.now()}.csv`;
    link.click();
  }

  close() {
    const drawer = document.getElementById('traceDrawer');
    if (drawer) drawer.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }
}

window.traceManager = new TraceabilityManager();
