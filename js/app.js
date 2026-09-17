/**
 * Semiconductor Sanity CSV Parser - Main Coordinator Application
 */

window.escapeHtml = function(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
window.safeEsc = window.escapeHtml;
const safeEsc = window.safeEsc;

class SemiconductorApp {
  constructor() {
    this.state = {
      activeTab: 'overview',
      theme: 'dark',
      itemFile: null,
      itemLabelMode: 'AUTO', // 'AUTO' | 'OLD_NEW' | 'NEW_PROPOSE'
      dsaFile: null,
      binFile: null,
      tsrFile: null,
      repeatabilityFile: null,
      itemAnalysis: null,
      dsaAnalysis: null,
      binAnalysis: null,
      tsrAnalysis: null,
      repeatabilityAnalysis: null,
      repeatabilityViewMode: 'per_ecid', // 'per_ecid' | 'per_test' | 'detail'
      repeatabilityFilter: {
        sortColumn: 'ecid',
        sortDirection: 'asc',
        searchQuery: '',
        selectedEcids: new Set(['ALL']),
        selectedTests: new Set(['ALL']),
        selectedTrends: new Set(['ALL']),
        selectedDists: new Set(['ALL']),
        selectedDistRepeats: new Set(['ALL']),
        preset: 'ALL'
      },
      repeatabilityAutoFit: false,
      tsrFilter: {
        cpkGroup: 'ALL',
        top10Only: false
      },
      tsrTableFilter: {
        sortColumn: 'testNum',
        sortDirection: 'asc',
        searchQuery: '',
        cpkGroup: 'ALL',
        distribution: 'ALL',
        preset: 'ALL'
      },
      tsrTableWrapMode: false,
      tsrAutoFit: false,
      tsrNameWidth: 320,
      tsrLimitWidth: 150,
      binParetoMode: 'hard', // 'hard' | 'soft' | 'firstfail'
      binParetoFilter: 'all', // 'all' | 'fail_only'
      binParetoSearch: '',
      binParetoBarSpacing: 55,
      binParetoHeight: 320,
      binNameWidth: 280,
      binAutoFit: false,
      isChartModalOpen: false,
      currentModalChartId: null,
      currentModalTitle: '',
      testIgnoreInput: 'not pux',
      testIgnoreRules: ['pux'],
      isTestIgnoreModalOpen: false
    };

    this.tsrTableColumns = [
      { key: 'testNum', label: 'Test #', numeric: true, width: '90px' },
      { key: 'testName', label: 'Test Name', numeric: false, width: '320px' },
      { key: 'loLimit', label: 'Limits', numeric: false, width: '150px' },
      { key: 'mean', label: 'Mean', numeric: true, width: '85px' },
      { key: 'median', label: 'Median (P50)', numeric: true, width: '95px' },
      { key: 'stdDev', label: 'StdDev', numeric: true, width: '85px' },
      { key: 'failCount', label: 'Fail Count', numeric: true, width: '85px' },
      { key: 'lossPct', label: 'Loss %', numeric: true, width: '80px' },
      { key: 'cpkn', label: 'CPKn', numeric: true, width: '75px' },
      { key: 'cpknGroup', label: 'CPK Group', numeric: false, width: '115px' },
      { key: 'distribution', label: 'Distribution Shape', numeric: false, width: '135px' },
      { key: 'skewness', label: 'Skewness / Kurtosis', numeric: true, width: '125px' }
    ];

    this.repEcidColumns = [
      { key: 'rank', label: 'Rank', numeric: true, width: '60px' },
      { key: 'ecid', label: 'Coordinate_ECID', numeric: false, width: '150px' },
      { key: 'coordDisplay', label: 'Die (X, Y)', numeric: false, width: '90px' },
      { key: 'testCount', label: 'Tests', numeric: true, width: '65px' },
      { key: 'meanCv', label: 'Mean CV (%)', numeric: true, width: '110px' },
      { key: 'maxCv', label: 'Max CV (%)', numeric: true, width: '110px' },
      { key: 'meanCp', label: 'Mean Cp', numeric: true, width: '85px' },
      { key: 'minCp', label: 'Min Cp', numeric: true, width: '85px' },
      { key: 'dominantDist', label: 'Dist Distribution', numeric: false, width: '180px' },
      { key: 'dominantDistRepeat', label: 'Dist_Repeat Groups', numeric: false, width: '210px' },
      { key: 'dominantTrend', label: 'Trend Patterns', numeric: false, width: '240px' },
      { key: 'riskLevel', label: 'Status', numeric: false, width: '95px' }
    ];

    this.repTestColumns = [
      { key: 'testNum', label: 'Test #', numeric: true, width: '85px' },
      { key: 'testName', label: 'Test Name', numeric: false, width: '160px' },
      { key: 'units', label: 'Units', numeric: false, width: '70px' },
      { key: 'loLimit', label: 'Limits (LSL / USL)', numeric: false, width: '130px' },
      { key: 'ecidCount', label: 'Unique ECIDs', numeric: true, width: '95px' },
      { key: 'meanCv', label: 'Mean CV (%)', numeric: true, width: '110px' },
      { key: 'maxCv', label: 'Max CV (%)', numeric: true, width: '110px' },
      { key: 'meanCp', label: 'Mean Cp', numeric: true, width: '85px' },
      { key: 'minCp', label: 'Min Cp', numeric: true, width: '85px' },
      { key: 'dominantDist', label: 'Dist Distribution', numeric: false, width: '180px' },
      { key: 'dominantDistRepeat', label: 'Dist_Repeat Groups', numeric: false, width: '210px' },
      { key: 'dominantTrend', label: 'Trend Patterns', numeric: false, width: '240px' }
    ];

    this.repDetailColumns = [
      { key: 'ecid', label: 'Coordinate_ECID', numeric: false, width: '140px' },
      { key: 'testNum', label: 'Test #', numeric: true, width: '80px' },
      { key: 'testName', label: 'Test Name', numeric: false, width: '140px' },
      { key: 'units', label: 'Units', numeric: false, width: '65px' },
      { key: 'mean', label: 'Mean', numeric: true, width: '85px' },
      { key: 'std', label: 'Std', numeric: true, width: '80px' },
      { key: 'ev6Sigma', label: 'EV (6-Sigma)', numeric: true, width: '95px' },
      { key: 'cv', label: 'CV (%)', numeric: true, width: '90px' },
      { key: 'cp', label: 'Cp', numeric: true, width: '75px' },
      { key: 'cpkn', label: 'CPKn', numeric: true, width: '75px' },
      { key: 'loLimit', label: 'Limits', numeric: false, width: '115px' },
      { key: 'dist', label: 'Dist', numeric: false, width: '95px' },
      { key: 'distRepeat', label: 'Dist_Repeat', numeric: false, width: '145px' },
      { key: 'trend', label: 'Trend', numeric: false, width: '165px' }
    ];

    this.chartsManager = new DashboardChartsManager();
  }

  init() {
    this.initTheme();
    this.bindEvents();
    this.updateHeaderMeta();
    this.loadDefaultData();
  }

  formatCurrentDateTime() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  /**
   * Update header timestamp, title metadata, snapshot timestamp, and program badges
   */
  updateHeaderMeta(timestampStr) {
    try {
      const nowFormatted = this.formatCurrentDateTime();
      const meta = this.state.repeatabilityFile?.meta || this.state.tsrFile?.meta || this.state.itemFile?.meta || this.state.dsaFile?.meta || this.state.binFile?.meta || {};
      const finalTs = timestampStr || nowFormatted;

      // 1. Top Navbar Timestamp
      const tsEl = document.getElementById('headerTimestamp');
      if (tsEl) {
        tsEl.textContent = `Updated: ${finalTs}`;
      }

      // 2. Main Title Subtext
      const brandSub = document.querySelector('.brand-title p') || document.getElementById('headerSubTitle');
      if (brandSub) {
        brandSub.textContent = `DATA ANALYSIS EXECUTIVE DASHBOARD • ATE VALIDATION PLATFORM @ Masa Tu`;
      }

      // 3. Overview Snapshot Timestamp
      const snapshotEl = document.getElementById('overviewSnapshotTimestamp');
      if (snapshotEl) {
        snapshotEl.textContent = finalTs;
      }

      // 4. Tab Header Loaded Timestamps
      ['overviewLoadedTimestamp', 'itemLoadedTimestamp', 'dsaLoadedTimestamp', 'binLoadedTimestamp', 'tsrLoadedTimestamp', 'repLoadedTimestamp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = `Updated: ${finalTs}`;
      });

      // 5. Program Migration Badge
      const oldP = (meta.oldProgram && meta.oldProgram !== 'N/A') ? meta.oldProgram : (this.state.itemFile?.meta?.oldProgram || this.state.itemAnalysis?.baselineProg || 'MAIN_PROG_REV_A');
      const newP = (meta.newProgram && meta.newProgram !== 'N/A') ? meta.newProgram : (this.state.itemFile?.meta?.newProgram || this.state.itemAnalysis?.targetProg || 'MAIN_PROG_REV_A');
      const oldS = (meta.oldStage && meta.oldStage !== 'N/A') ? meta.oldStage : (this.state.itemFile?.meta?.oldStage || 'CP1');
      const newS = (meta.newStage && meta.newStage !== 'N/A') ? meta.newStage : (this.state.itemFile?.meta?.newStage || 'CP1');

      const progBadge = document.getElementById('headerProgramBadge');
      if (progBadge) {
        progBadge.innerHTML = `<span class="text-cyan font-mono font-bold">[${oldS}] ${safeEsc(oldP)}</span><span class="text-gray-400 mx-2">➔</span><span class="text-emerald-400 font-mono font-bold">[${newS}] ${safeEsc(newP)}</span>`;
      }
    } catch (err) {
      console.warn('Error updating header meta:', err);
    }
  }

  /**
   * Theme Initialization & Toggle
   */
  initTheme() {
    const savedTheme = localStorage.getItem('semiconductor_theme') || 'dark';
    this.setTheme(savedTheme, false);
  }

  setTheme(theme, showNotification = true) {
    this.state.theme = theme;
    localStorage.setItem('semiconductor_theme', theme);

    const btnText = document.getElementById('themeToggleText');
    const btnIcon = document.getElementById('themeToggleIcon');

    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (btnText) btnText.textContent = 'Dark';
      if (btnIcon) btnIcon.textContent = '🌙';
    } else {
      document.body.classList.remove('light-theme');
      if (btnText) btnText.textContent = 'Light';
      if (btnIcon) btnIcon.textContent = '☀️';
    }

    // Re-render active tab's charts to adapt colors
    this.refreshCurrentTabCharts();

    // Re-render modal chart if open
    if (this.state.isChartModalOpen && this.state.currentModalChartId) {
      this.maximizeChart(this.state.currentModalChartId, this.state.currentModalTitle);
    }

    if (showNotification) {
      this.showToast(`🎨 Switched to ${theme.toUpperCase()} theme mode.`, 'info');
    }
  }

  toggleTheme() {
    const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme, true);
  }

  refreshCurrentTabCharts() {
    if (this.state.activeTab === 'overview') this.updateOverviewUi();
    if (this.state.activeTab === 'item') this.updateItemUi();
    if (this.state.activeTab === 'dsa') this.updateDsaUi();
    if (this.state.activeTab === 'bin') this.updateBinUi();
    if (this.state.activeTab === 'tsr') this.updateTsrUi();
    if (this.state.activeTab === 'repeatability') this.updateRepeatabilityUi();
  }

  /**
   * Load embedded baseline datasets
   */
  loadDefaultData() {
    if (window.DEFAULT_DATASETS) {
      if (window.DEFAULT_DATASETS.repeatability) {
        this.processCsvString(
          window.DEFAULT_DATASETS.repeatability.csvText,
          window.DEFAULT_DATASETS.repeatability.filename
        );
      }
      if (window.DEFAULT_DATASETS.itemcompare) {
        this.processCsvString(
          window.DEFAULT_DATASETS.itemcompare.csvText,
          window.DEFAULT_DATASETS.itemcompare.filename
        );
      }
      if (window.DEFAULT_DATASETS.dsacompare) {
        this.processCsvString(
          window.DEFAULT_DATASETS.dsacompare.csvText,
          window.DEFAULT_DATASETS.dsacompare.filename
        );
      }
      if (window.DEFAULT_DATASETS.bincompare) {
        this.processCsvString(
          window.DEFAULT_DATASETS.bincompare.csvText,
          window.DEFAULT_DATASETS.bincompare.filename
        );
      }
      if (window.DEFAULT_DATASETS.tsr) {
        this.processCsvString(
          window.DEFAULT_DATASETS.tsr.csvText,
          window.DEFAULT_DATASETS.tsr.filename
        );
      }
      this.showToast('✅ Default semiconductor test datasets (including Repeatability & TSR) loaded successfully.', 'info');
    }
  }

  formatFileSize(bytes) {
    if (bytes === undefined || bytes === null || bytes === 0 || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Process uploaded CSV text and update state
   */
  processCsvString(csvText, filename = '', fileSize = null) {
    try {
      const parsed = CsvParserEngine.parseFile(csvText, filename);
      if (!parsed) {
        this.showToast(`⚠️ Could not parse "${filename}". Unsupported format.`, 'error');
        return;
      }

      parsed.fileSize = fileSize || (csvText ? (typeof Blob !== 'undefined' ? new Blob([csvText]).size : csvText.length) : 0);

      let targetTab = 'overview';

      if (parsed.type === 'repeatability') {
        this.state.repeatabilityFile = parsed;
        this.state.repeatabilityAnalysis = SemiconductorAnalytics.analyzeRepeatability(parsed, this.state.testIgnoreRules);
        this.resetRepeatabilityFilters();
        this.updateRepeatabilityUi();
        targetTab = 'repeatability';
      } else if (parsed.type === 'tsr') {
        this.state.tsrFile = parsed;
        this.state.tsrAnalysis = SemiconductorAnalytics.analyzeTsr(parsed, this.state.testIgnoreRules);
        this.updateTsrUi();
        targetTab = 'tsr';
      } else if (parsed.type === 'itemcompare') {
        this.state.itemFile = parsed;
        this.state.itemAnalysis = SemiconductorAnalytics.analyzeItemCompare(parsed, this.state.testIgnoreRules);
        this.updateItemUi();
        targetTab = 'item';
      } else if (parsed.type === 'dsacompare') {
        this.state.dsaFile = parsed;
        this.state.dsaAnalysis = SemiconductorAnalytics.analyzeDsaCompare(parsed, this.state.testIgnoreRules);
        this.updateDsaUi();
        targetTab = 'dsa';
      } else if (parsed.type === 'bincompare') {
        this.state.binFile = parsed;
        this.state.binAnalysis = SemiconductorAnalytics.analyzeBinCompare(parsed);
        this.updateBinUi();
        targetTab = 'bin';
      } else {
        // Fallback default: if user was on repeatability tab, treat as repeatability
        if (this.state.activeTab === 'repeatability') {
          parsed.type = 'repeatability';
          this.state.repeatabilityFile = parsed;
          this.state.repeatabilityAnalysis = SemiconductorAnalytics.analyzeRepeatability(parsed, this.state.testIgnoreRules);
          this.resetRepeatabilityFilters();
          this.updateRepeatabilityUi();
          targetTab = 'repeatability';
        }
      }

      this.updateOverviewUi();
      this.updateTraceExplorerUi();
      this.updateHeaderMeta();
      this.updateGlobalIgnoreBadge();
      this.updateLoadedDatasetsStrip();

      return { type: parsed.type, targetTab, filename, recordCount: parsed.rows?.length || 0 };
    } catch (err) {
      console.error(`Exception inside processCsvString for ${filename}:`, err);
      this.showToast(`❌ Error processing "${filename}": ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Bind DOM events (file uploads, tabs, exports, keyboard shortcuts)
   */
  bindEvents() {
    // Theme Toggle
    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggleTheme());
    }

    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Global Window-Level Drag & Drop with Fullscreen Overlay
    const dragOverlay = document.getElementById('dragOverlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragOverlay) dragOverlay.classList.remove('hidden');
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (dragOverlay) dragOverlay.classList.add('hidden');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (dragOverlay) dragOverlay.classList.add('hidden');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
      }
    });

    // Dropzone banner and file input
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('csvFileInput');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', (e) => {
        // Prevent click if user clicked on a dataset pill or action button
        if (e.target.closest('.loaded-dataset-pill') || e.target.closest('button')) return;
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
        fileInput.value = '';
      });
    }

    // Export buttons
    const btnPptx = document.getElementById('btnExportPptx');
    if (btnPptx) {
      btnPptx.addEventListener('click', () => {
        SemiconductorExportManager.exportPPTX(this.state, 'auto');
      });
    }

    const btnPdf = document.getElementById('btnExportPdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        SemiconductorExportManager.exportPDF();
      });
    }

    // Reset button
    const btnReset = document.getElementById('btnResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.loadDefaultData();
      });
    }

    // Global Keyboard Shortcut: ESC to close Fullscreen Chart Modal, Test Ignore Modal, or Trace Drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (this.state.isTestIgnoreModalOpen) {
          this.closeTestIgnoreModal();
        } else if (this.state.isChartModalOpen) {
          this.closeChartModal();
        } else if (window.traceManager && document.getElementById('traceDrawer')?.classList.contains('open')) {
          window.traceManager.close();
        }
        this.closeAllMultiSelectDropdowns();
      }
    });

    // Close multi-select dropdown panels on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-multiselect')) {
        this.closeAllMultiSelectDropdowns();
      }
    });

    // Double-click on any chart canvas to maximize fullscreen
    document.addEventListener('dblclick', (e) => {
      const canvas = e.target.closest('canvas');
      if (canvas && canvas.id && canvas.id !== 'chartModalCanvas') {
        const card = canvas.closest('.card');
        const title = card ? (card.querySelector('.card-title')?.textContent?.trim() || 'Chart View') : 'Chart View';
        this.maximizeChart(canvas.id, title);
      }
    });
  }

  handleFiles(files) {
    if (!files || files.length === 0) return;

    const progressBanner = document.getElementById('uploadProgressBanner');
    const progressText = document.getElementById('uploadProgressText');
    const progressBar = document.getElementById('uploadProgressBar');

    if (progressBanner) progressBanner.classList.remove('hidden');
    if (progressText) progressText.textContent = `Analyzing ${files.length} file(s)...`;
    if (progressBar) progressBar.style.width = '20%';

    let processedResults = [];
    let completedCount = 0;

    const finishUpload = () => {
      if (completedCount >= files.length) {
        setTimeout(() => {
          if (progressBanner) progressBanner.classList.add('hidden');
          if (progressBar) progressBar.style.width = '0%';
        }, 800);

        if (processedResults.length === 1) {
          const r = processedResults[0];
          const typeLabels = {
            repeatability: 'Repeatability Analysis',
            tsr: 'TSR Test Summary',
            itemcompare: 'Item Sanity Check',
            dsacompare: 'DSA Parameter Shift',
            bincompare: 'Bin & Yield Compare'
          };
          const label = typeLabels[r.type] || r.type || 'Data';
          this.showToast(`🎉 Loaded ${label}: "${r.filename}" (${r.recordCount} records)`, 'success');
          if (r.targetTab) {
            this.switchTab(r.targetTab);
          }
        } else if (processedResults.length > 1) {
          this.showToast(`🎉 Successfully loaded and processed ${processedResults.length} CSV files.`, 'success');
        }
      }
    };

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const result = this.processCsvString(text, file.name, file.size);
          if (result) processedResults.push(result);
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          this.showToast(`❌ Error parsing ${file.name}: ${err.message}`, 'error');
        } finally {
          completedCount++;
          const pct = Math.round((completedCount / files.length) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressText) progressText.textContent = `Processed ${completedCount} of ${files.length}: ${file.name}`;
          finishUpload();
        }
      };

      reader.onerror = () => {
        completedCount++;
        this.showToast(`❌ Error reading file: ${file.name}`, 'error');
        finishUpload();
      };

      reader.readAsText(file);
    });
  }

  updateLoadedDatasetsStrip() {
    const strip = document.getElementById('loadedDatasetsStrip');
    if (!strip) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const pills = [];

    // Repeatability
    if (this.state.repeatabilityFile) {
      const fn = this.state.repeatabilityFile.filename || 'repeatability.csv';
      const sizeStr = this.formatFileSize(this.state.repeatabilityFile.fileSize);
      const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
      const count = this.state.repeatabilityAnalysis?.totalEcids ? `${this.state.repeatabilityAnalysis.totalEcids} Unique ECIDs` : `${this.state.repeatabilityFile.rows?.length || 0} rows`;
      pills.push(`
        <span class="loaded-dataset-pill ${this.state.activeTab === 'repeatability' ? 'active' : ''}" onclick="window.app.switchTab('repeatability')" title="Repeatability Data (${safeEsc(fn)}${sizeTag}) - Click to view tab">
          <span>🔁</span> <b>Repeatability:</b> <span class="text-cyan truncate max-w-[200px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})
        </span>
      `);
    }

    // TSR
    if (this.state.tsrFile) {
      const fn = this.state.tsrFile.filename || 'tsr.csv';
      const sizeStr = this.formatFileSize(this.state.tsrFile.fileSize);
      const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
      const count = `${this.state.tsrAnalysis?.totalParameters || this.state.tsrFile.rows?.length || 0} params`;
      pills.push(`
        <span class="loaded-dataset-pill ${this.state.activeTab === 'tsr' ? 'active' : ''}" onclick="window.app.switchTab('tsr')" title="TSR Data (${safeEsc(fn)}${sizeTag}) - Click to view tab">
          <span>📈</span> <b>TSR:</b> <span class="text-purple truncate max-w-[200px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})
        </span>
      `);
    }

    // Item Compare
    if (this.state.itemFile) {
      const fn = this.state.itemFile.filename || 'itemcompare.csv';
      const sizeStr = this.formatFileSize(this.state.itemFile.fileSize);
      const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
      const count = `${this.state.itemFile.rows?.length || 0} items`;
      pills.push(`
        <span class="loaded-dataset-pill ${this.state.activeTab === 'item' ? 'active' : ''}" onclick="window.app.switchTab('item')" title="Item Compare Data (${safeEsc(fn)}${sizeTag}) - Click to view tab">
          <span>🔍</span> <b>Item:</b> <span class="text-cyan truncate max-w-[200px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})
        </span>
      `);
    }

    // DSA Compare
    if (this.state.dsaFile) {
      const fn = this.state.dsaFile.filename || 'dsacompare.csv';
      const sizeStr = this.formatFileSize(this.state.dsaFile.fileSize);
      const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
      const count = `${this.state.dsaFile.rows?.length || 0} params`;
      pills.push(`
        <span class="loaded-dataset-pill ${this.state.activeTab === 'dsa' ? 'active' : ''}" onclick="window.app.switchTab('dsa')" title="DSA Shift Data (${safeEsc(fn)}${sizeTag}) - Click to view tab">
          <span>⚡</span> <b>DSA:</b> <span class="text-amber-400 truncate max-w-[200px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})
        </span>
      `);
    }

    // Bin Compare
    if (this.state.binFile) {
      const fn = this.state.binFile.filename || 'bincompare.csv';
      const sizeStr = this.formatFileSize(this.state.binFile.fileSize);
      const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
      const count = `${(this.state.binFile.sections?.transitions || []).length} transitions`;
      pills.push(`
        <span class="loaded-dataset-pill ${this.state.activeTab === 'bin' ? 'active' : ''}" onclick="window.app.switchTab('bin')" title="Bin Compare Data (${safeEsc(fn)}${sizeTag}) - Click to view tab">
          <span>🏷️</span> <b>Bin:</b> <span class="text-green truncate max-w-[200px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})
        </span>
      `);
    }

    strip.innerHTML = pills.join('');
  }

  switchTab(tabId) {
    try {
      this.state.activeTab = tabId;
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabId);
      });
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `tab-${tabId}`);
      });

      // Update header metadata on tab change
      this.updateHeaderMeta();

      // Trigger re-render of charts on tab change to handle sizing
      setTimeout(() => {
        try {
          if (tabId === 'overview') this.updateOverviewUi();
          if (tabId === 'item') this.updateItemUi();
          if (tabId === 'dsa') this.updateDsaUi();
          if (tabId === 'bin') this.updateBinUi();
          if (tabId === 'tsr') this.updateTsrUi();
          if (tabId === 'repeatability') this.updateRepeatabilityUi();
          if (tabId === 'explorer') this.updateTraceExplorerUi();
        } catch (tabErr) {
          console.error(`Error rendering active tab ${tabId}:`, tabErr);
        }
      }, 50);
    } catch (err) {
      console.error('Error switching tab:', err);
    }
  }

  /**
   * Update Overview Tab
   */
  updateOverviewUi() {
    const item = this.state.itemAnalysis;
    const dsa = this.state.dsaAnalysis;
    const bin = this.state.binAnalysis;
    const tsr = this.state.tsrAnalysis;
    const rep = this.state.repeatabilityAnalysis;

    // Overall Status Banner
    const assessBadge = document.getElementById('overviewAssessmentBadge');
    const assessText = document.getElementById('overviewAssessmentText');
    if (assessBadge && item) {
      assessBadge.textContent = item.overallAssessment;
      assessBadge.className = `status-pill pill-${item.assessmentColor}`;
      assessText.textContent = item.assessmentRationale;
    }

    // Update Overview Active Source Datasets Pills Bar
    const ovPillsContainer = document.getElementById('overviewSourceFilesPills');
    const ovTimestamp = document.getElementById('overviewLoadedTimestamp');
    if (ovTimestamp) {
      ovTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
    if (ovPillsContainer) {
      const pills = [];
      const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (this.state.repeatabilityFile) {
        const fn = this.state.repeatabilityFile.filename || 'repeatability.csv';
        const sizeStr = this.formatFileSize(this.state.repeatabilityFile.fileSize);
        const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
        const count = rep?.totalEcids ? `${rep.totalEcids} Unique ECIDs` : `${this.state.repeatabilityFile.rows?.length || 0} rows`;
        pills.push(`<span class="loaded-dataset-pill" onclick="window.app.switchTab('repeatability')" title="Repeatability Data (${safeEsc(fn)}${sizeTag}) - Click to view"><span>🔁</span> <b>Repeat:</b> <span class="text-cyan truncate max-w-[150px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})</span>`);
      }
      if (this.state.tsrFile) {
        const fn = this.state.tsrFile.filename || 'tsr.csv';
        const sizeStr = this.formatFileSize(this.state.tsrFile.fileSize);
        const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
        const count = `${tsr?.totalParameters || this.state.tsrFile.rows?.length || 0} params`;
        pills.push(`<span class="loaded-dataset-pill" onclick="window.app.switchTab('tsr')" title="TSR Data (${safeEsc(fn)}${sizeTag}) - Click to view"><span>📈</span> <b>TSR:</b> <span class="text-purple truncate max-w-[150px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})</span>`);
      }
      if (this.state.itemFile) {
        const fn = this.state.itemFile.filename || 'itemcompare.csv';
        const sizeStr = this.formatFileSize(this.state.itemFile.fileSize);
        const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
        const count = `${this.state.itemFile.rows?.length || 0} items`;
        pills.push(`<span class="loaded-dataset-pill" onclick="window.app.switchTab('item')" title="Item Compare Data (${safeEsc(fn)}${sizeTag}) - Click to view"><span>🔍</span> <b>Item:</b> <span class="text-cyan truncate max-w-[150px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})</span>`);
      }
      if (this.state.dsaFile) {
        const fn = this.state.dsaFile.filename || 'dsacompare.csv';
        const sizeStr = this.formatFileSize(this.state.dsaFile.fileSize);
        const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
        const count = `${this.state.dsaFile.rows?.length || 0} params`;
        pills.push(`<span class="loaded-dataset-pill" onclick="window.app.switchTab('dsa')" title="DSA Shift Data (${safeEsc(fn)}${sizeTag}) - Click to view"><span>⚡</span> <b>DSA:</b> <span class="text-amber-400 truncate max-w-[150px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})</span>`);
      }
      if (this.state.binFile) {
        const fn = this.state.binFile.filename || 'bincompare.csv';
        const sizeStr = this.formatFileSize(this.state.binFile.fileSize);
        const sizeTag = sizeStr ? ` • ${sizeStr}` : '';
        const count = `${(this.state.binFile.sections?.transitions || []).length} transitions`;
        pills.push(`<span class="loaded-dataset-pill" onclick="window.app.switchTab('bin')" title="Bin Compare Data (${safeEsc(fn)}${sizeTag}) - Click to view"><span>🏷️</span> <b>Bin:</b> <span class="text-green truncate max-w-[150px] inline-block align-bottom font-bold">${safeEsc(fn)}</span> (${count}${sizeTag})</span>`);
      }
      ovPillsContainer.innerHTML = pills.length > 0 ? pills.join('') : '<span class="text-xs text-gray-500 italic font-mono">No CSV files loaded yet</span>';
    }

    const ovFileSize = document.getElementById('overviewLoadedFileSize');
    if (ovFileSize) {
      let totalBytes = 0;
      ['repeatabilityFile', 'tsrFile', 'itemFile', 'dsaFile', 'binFile'].forEach(k => {
        if (this.state[k]?.fileSize) totalBytes += this.state[k].fileSize;
      });
      ovFileSize.textContent = totalBytes > 0 ? this.formatFileSize(totalBytes) : '';
    }

    // 1. Item Comparison Sanity: Total Records
    const elItemRecords = document.getElementById('ovItemTotalRecords');
    const elItemMatch = document.getElementById('ovItemMatchRate');
    const elItemTotal = document.getElementById('ovItemTotal');
    const elItemBadge = document.getElementById('ovItemCountBadge');
    if (item) {
      if (elItemRecords) elItemRecords.textContent = `${item.totalRecords}`;
      if (elItemMatch) elItemMatch.textContent = `${item.matchRate.toFixed(1)}%`;
      if (elItemTotal) elItemTotal.innerHTML = `Match Rate: <b class="text-cyan">${item.matchRate.toFixed(1)}%</b> (${item.matchCount} matched, ${item.totalChanged} changed)`;
      if (elItemBadge) elItemBadge.textContent = `Total: ${item.totalRecords} Records`;

      const cardItem = document.getElementById('ovKpiCardItem');
      if (cardItem) {
        cardItem.onclick = () => {
          window.traceManager.trace('Item Sanity Check: All Comparison Records', 'Full parameter list comparing OLD vs NEW test programs', `<b>Total Comparison Items:</b> <b>${item.totalRecords}</b> records<br>• Match: <b>${item.matchCount}</b> (${item.matchRate.toFixed(1)}%)<br>• Changed: <b>${item.totalChanged}</b>`, this.state.itemFile?.rows || [], null, item.meta?.rawName);
        };
      }
    }

    // 2. DSA Parameter Shift: Total Parameter Qty
    const elDsaParams = document.getElementById('ovDsaTotalParams');
    const elDsaImpact = document.getElementById('ovDsaImpact');
    const elDsaTotal = document.getElementById('ovDsaTotal');
    const elDsaBadge = document.getElementById('ovDsaCountBadge');
    if (dsa) {
      if (elDsaParams) elDsaParams.textContent = `${dsa.totalParameters}`;
      if (elDsaImpact) elDsaImpact.textContent = `${dsa.abcImpactCount} (${dsa.abcImpactPercent}%)`;
      if (elDsaTotal) elDsaTotal.innerHTML = `Shifted: <b class="text-amber-400">${dsa.abcImpactCount} (${dsa.abcImpactPercent}%)</b> • Cat A: ${dsa.categoryCounts.A}, B: ${dsa.categoryCounts.B}, C: ${dsa.categoryCounts.C}`;
      if (elDsaBadge) elDsaBadge.textContent = `Total: ${dsa.totalParameters} DSA Params`;

      const cardDsa = document.getElementById('ovKpiCardDsa');
      if (cardDsa) {
        cardDsa.onclick = () => {
          window.traceManager.trace('DSA Shift Analysis: Total Evaluated Parameters', 'Complete population of assessed parameters and drift categories', `<b>Total DSA Parameters:</b> <b>${dsa.totalParameters}</b> evaluated<br>• Cat A (Full Shift): <b>${dsa.categoryCounts.A}</b><br>• Cat B (Median Shift): <b>${dsa.categoryCounts.B}</b><br>• Cat C (Minor Drift): <b>${dsa.categoryCounts.C}</b>`, this.state.dsaFile?.rows || [], null, dsa.meta?.rawName);
        };
      }
    }

    // 3. TSR Process Capability: Total Parameters
    const elTsrParams = document.getElementById('ovTsrTotalParams');
    const elTsrCpk = document.getElementById('ovTsrWorstCpk');
    const elTsrCpkSub = document.getElementById('ovTsrCpkSub');
    if (tsr) {
      if (elTsrParams) elTsrParams.textContent = `${tsr.totalParameters}`;
      if (elTsrCpk) elTsrCpk.textContent = tsr.worstCpkItem ? `CPK ${tsr.worstCpkItem.cpkn.toFixed(2)}` : 'N/A';
      if (elTsrCpkSub) elTsrCpkSub.innerHTML = `Worst: <b class="text-purple">${tsr.worstCpkItem ? tsr.worstCpkItem.cpkn.toFixed(2) : 'N/A'}</b> • Risk &lt;1.67: <b>${tsr.cpkRiskCount}</b>`;

      const cardTsr = document.getElementById('ovKpiCardTsr');
      if (cardTsr) {
        cardTsr.onclick = () => {
          window.traceManager.trace('TSR Process Capability: All Tested Parameters', 'Full parameter capability, distribution shapes and failure Pareto', `<b>Total TSR Parameters:</b> <b>${tsr.totalParameters}</b> test items<br>• Capable (CPK ≥ 1.67): <b>${tsr.cpkCapableCount}</b><br>• Risk Items (CPK < 1.67): <b>${tsr.cpkRiskCount}</b>`, this.state.tsrFile?.rows || [], null, tsr.meta?.rawName);
        };
      }
    }

    // 4. Yield Delta KPI
    const elYieldDelta = document.getElementById('ovYieldDelta');
    if (elYieldDelta && bin) {
      const sign = bin.yieldDelta >= 0 ? '+' : '';
      elYieldDelta.textContent = `${sign}${bin.yieldDelta.toFixed(2)}%`;
      elYieldDelta.className = `kpi-value ${bin.yieldDelta >= 0 ? 'text-green' : 'text-red'}`;
      document.getElementById('ovYieldPass').textContent = `NEW: ${bin.newPassRate.toFixed(2)}% vs OLD: ${bin.oldPassRate.toFixed(2)}%`;

      const cardYield = document.getElementById('ovKpiCardYield');
      if (cardYield) {
        cardYield.onclick = () => {
          window.traceManager.trace('Hard Bin Yield Comparison', 'Yield comparison and pass rate delta', `<b>Hard Bin Pass Rate:</b><br>• NEW: <b>${bin.newPassRate.toFixed(2)}%</b><br>• OLD: <b>${bin.oldPassRate.toFixed(2)}%</b><br>• Delta: <b>${sign}${bin.yieldDelta.toFixed(2)}%</b>`, this.state.binFile?.sections?.newHardBin || [], null, bin.meta?.rawName);
        };
      }
    } else if (elYieldDelta && tsr) {
      elYieldDelta.textContent = `${tsr.overallYieldPct.toFixed(2)}%`;
      elYieldDelta.className = 'kpi-value text-green';
      document.getElementById('ovYieldPass').textContent = `TSR Yield (${tsr.totalFailCount} fails / ${tsr.totalTestedCount} dice)`;
    }

    // 5. Pass ➔ Fail Risk KPI
    const elPfRisk = document.getElementById('ovPfRisk');
    if (elPfRisk && bin) {
      elPfRisk.textContent = `${bin.pfCount} dice`;
      elPfRisk.className = `kpi-value ${bin.pfCount > 0 ? 'text-red' : 'text-green'}`;
      document.getElementById('ovPfDesc').textContent = bin.pfCount > 0 ? 'Yield loss (Pass ➔ Fail)' : 'Zero Pass ➔ Fail switch';

      const cardPf = document.getElementById('ovKpiCardPf');
      if (cardPf) {
        cardPf.onclick = () => {
          const transitions = this.state.binFile?.sections?.transitions || [];
          const pfRows = transitions.filter(t => (t.Transition || '').toLowerCase() === 'pf');
          window.traceManager.trace('Pass ➔ Fail Switch Risk (pf)', 'Critical die bin migrations from Pass in OLD to Fail in NEW', `<b>pf Fallout Count:</b> <b>${bin.pfCount}</b> dice switched to fail in NEW program revision.`, pfRows, null, bin.meta?.rawName);
        };
      }
    } else if (elPfRisk && tsr) {
      elPfRisk.textContent = `${tsr.totalFailCount} dice`;
      elPfRisk.className = `kpi-value ${tsr.totalFailCount > 0 ? 'text-red' : 'text-green'}`;
      document.getElementById('ovPfDesc').textContent = `Total failure loss (${tsr.overallLossPct.toFixed(2)}%)`;
    }

    // 6. Repeatability Process Quality & ECIDs KPI
    const elRepEcids = document.getElementById('ovRepTotalEcids');
    const elRepAvgCv = document.getElementById('ovRepAvgCv');
    const elRepWorstCp = document.getElementById('ovRepWorstCp');
    const elRepSub = document.getElementById('ovRepSub');
    if (rep) {
      if (elRepEcids) elRepEcids.textContent = `${rep.totalEcids} Dice`;
      if (elRepAvgCv) elRepAvgCv.textContent = `${rep.meanCv.toFixed(2)}%`;
      if (elRepWorstCp) elRepWorstCp.textContent = `${rep.minCp.toFixed(2)}`;
      if (elRepSub) elRepSub.innerHTML = `Avg CV%: <b class="text-cyan">${rep.meanCv.toFixed(2)}%</b> &bull; Worst Cp: <b class="${rep.minCp < 1.33 ? 'text-amber-400 font-bold' : 'text-green'}">${rep.minCp.toFixed(2)}</b>`;
    }

    // Render Overview CPK Table
    this.renderOverviewCpkTable();

    // Render Overview mini charts
    if (item && this.state.itemFile) {
      this.chartsManager.renderStatusDonut('chartOverviewDonut', item, this.state.itemFile.rows);
    }
    if (dsa && this.state.dsaFile) {
      const topList = (dsa.topPrefixContributors && dsa.topPrefixContributors.length > 0) ? dsa.topPrefixContributors : dsa.topContributors;
      this.chartsManager.renderTopContributors('chartOverviewTopShift', topList, this.state.dsaFile.rows, dsa.meta);
    }
  }

  /**
   * Render Executive Overview CPK Capability Groups Matrix Table
   */
  renderOverviewCpkTable() {
    const tsr = this.state.tsrAnalysis;
    const tbody = document.getElementById('overviewCpkMatrixTbody');
    const countBadge = document.getElementById('ovCpkGroupCountBadge');
    if (!tbody) return;

    if (!tsr || !tsr.allCpkGroupsTable || tsr.allCpkGroupsTable.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-6 text-gray-400">
            No TSR capability data loaded yet.
          </td>
        </tr>
      `;
      return;
    }

    if (countBadge) {
      countBadge.textContent = `${tsr.allCpkGroupsTable.length} Groups (${tsr.totalParameters} Params)`;
    }

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    tbody.innerHTML = tsr.allCpkGroupsTable.map(g => {
      let riskBadge = '<span class="status-pill pill-green text-[10px] font-bold">OPTIMAL</span>';
      if (g.key.includes('< 0.5') || g.key.includes('<0.5')) {
        riskBadge = '<span class="status-pill pill-red text-[10px] font-bold">CRITICAL</span>';
      } else if (g.key.includes('0.5') && g.key.includes('1.67')) {
        riskBadge = '<span class="status-pill pill-yellow text-[10px] font-bold">MARGINAL</span>';
      } else if (g.key.includes('1.67') && g.key.includes('4')) {
        riskBadge = '<span class="status-pill pill-cyan text-[10px] font-bold">CAPABLE</span>';
      }

      return `
        <tr class="clickable-row hover:bg-white/10 transition-colors" style="cursor: pointer;" onclick="window.app.traceTsrCpkGroup('${safeEsc(g.key)}')" title="Click to trace all ${g.count} parameter(s) in ${safeEsc(g.name)}">
          <td class="py-1.5 px-2">
            <span class="status-pill pill-${g.color} font-bold" style="font-size: 0.72rem; padding: 0.12rem 0.4rem;">${safeEsc(g.name)}</span>
          </td>
          <td class="py-1.5 px-1 text-center font-mono font-bold text-white text-xs">${g.count}</td>
          <td class="py-1.5 px-1 text-right font-mono text-xs opacity-90">${safeEsc(g.percentage)}</td>
          <td class="py-1.5 px-1 text-center">${riskBadge}</td>
          <td class="py-1.5 px-2 text-right">
            <button class="btn btn-subtle text-[10px] py-0.5 px-1.5 leading-tight text-cyan" onclick="event.stopPropagation(); window.app.traceTsrCpkGroup('${safeEsc(g.key)}')">
              🔍 Trace
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Some Item Compare CSVs compare OLD vs NEW program revisions; others compare a
   * NEW baseline against a PROPOSED revision. Column A of the CSV (e.g. "Comparison")
   * usually tags which one it is (e.g. "OLD_vs_NEW", "NEW_vs_PROPOSE"), but the user
   * can also override the label pair manually via the Comparison dropdown.
   */
  getItemLabels() {
    const mode = this.state.itemLabelMode || 'AUTO';
    if (mode === 'OLD_NEW') return { left: 'OLD', right: 'NEW' };
    if (mode === 'NEW_PROPOSE') return { left: 'NEW', right: 'PROPOSE' };
    const meta = this.state.itemFile?.meta;
    return { left: meta?.leftLabel || 'OLD', right: meta?.rightLabel || 'NEW' };
  }

  setItemLabelMode(mode) {
    this.state.itemLabelMode = mode;
    this.updateItemUi();
  }

  /**
   * Update Item Compare Tab (sanity_ITEM COMPARSION.txt)
   */
  updateItemUi() {
    const item = this.state.itemAnalysis;
    const raw = this.state.itemFile?.rows || [];
    if (!item) return;

    const labels = this.getItemLabels();
    const modeSelect = document.getElementById('itemLabelModeSelect');
    if (modeSelect) modeSelect.value = this.state.itemLabelMode || 'AUTO';

    const kpiAddedSubtext = document.getElementById('kpiAddedSubtext');
    if (kpiAddedSubtext) kpiAddedSubtext.textContent = `New in ${labels.right} program`;
    const kpiRemovedSubtext = document.getElementById('kpiRemovedSubtext');
    if (kpiRemovedSubtext) kpiRemovedSubtext.textContent = `Missing in ${labels.right} program`;

    const colHeaders = {
      itemColHeaderOldName: `${labels.left} Test Name`,
      itemColHeaderNewName: `${labels.right} Test Name`,
      itemColHeaderOldLimits: `${labels.left} Limits`,
      itemColHeaderNewLimits: `${labels.right} Limits`,
      itemColHeaderOldUnits: `${labels.left} Units`,
      itemColHeaderNewUnits: `${labels.right} Units`
    };
    Object.entries(colHeaders).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });

    // Dedicated Item Sanity Source File Info Bar
    const itemFileName = document.getElementById('itemLoadedFileName');
    const itemFileBadge = document.getElementById('itemLoadedFileBadge');
    const itemTimestamp = document.getElementById('itemLoadedTimestamp');
    const itemFileSize = document.getElementById('itemLoadedFileSize');
    if (itemFileName) itemFileName.textContent = this.state.itemFile?.filename || 'itemcompare.csv';
    if (itemFileBadge) itemFileBadge.textContent = `${item.totalRecords} records • Match: ${item.matchRate.toFixed(1)}%`;
    if (itemTimestamp) itemTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    if (itemFileSize) itemFileSize.textContent = this.formatFileSize(this.state.itemFile?.fileSize);

    // 7 KPI cards
    this.setKpi('kpiTotalRecords', item.totalRecords, () => {
      window.traceManager.trace('Total Records', 'All test items in comparison', `<b>Formula:</b> Total rows in item comparison CSV = <b>${item.totalRecords}</b>`, raw, null, item.meta.rawName);
    });

    this.setKpi('kpiMatchCount', `${item.matchCount} (${item.matchRate.toFixed(1)}%)`, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase() === 'match');
      window.traceManager.trace('Match Test Items', 'Properties match perfectly', `<b>Formula:</b> Match Count = ${item.matchCount} / Total ${item.totalRecords} = <b>${item.matchRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    this.setKpi('kpiNameChange', item.nameChangeCount, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase().includes('name'));
      window.traceManager.trace('Name Change Items', 'Test item renamed across program versions', `<b>Formula:</b> Name Change = ${item.nameChangeCount} / Total ${item.totalRecords} = <b>${item.nameChangeRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    this.setKpi('kpiAddedCount', item.addedCount, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase().includes('add'));
      window.traceManager.trace('Added Test Items', `New items added in ${labels.right} program`, `<b>Formula:</b> Added = ${item.addedCount} / Total ${item.totalRecords} = <b>${item.addedRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    this.setKpi('kpiRemovedCount', item.removedCount, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase().includes('remove'));
      window.traceManager.trace('Removed Test Items', `Items deleted or missing in ${labels.right} program`, `<b>Formula:</b> Removed = ${item.removedCount} / Total ${item.totalRecords} = <b>${item.removedRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    this.setKpi('kpiLimitChange', item.limitChangeCount, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase().includes('limit'));
      window.traceManager.trace('Limit Change Items', 'Upper or lower test limits altered', `<b>Formula:</b> Limit Change = ${item.limitChangeCount} / Total ${item.totalRecords} = <b>${item.limitChangeRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    this.setKpi('kpiOverallChangeRate', `${item.changeRate.toFixed(1)}%`, () => {
      const filtered = raw.filter(r => (r.Status || '').toLowerCase() !== 'match');
      window.traceManager.trace('Overall Changed Items', 'All non-matching items', `<b>Formula:</b> Changed Count = ${item.totalChanged} / Total ${item.totalRecords} = <b>${item.changeRate.toFixed(2)}%</b>`, filtered, null, item.meta.rawName);
    });

    // Scorecard Table
    const scoreTbody = document.getElementById('itemScorecardTbody');
    if (scoreTbody) {
      scoreTbody.innerHTML = item.scorecard.map(sc => `
        <tr class="clickable-row" onclick="window.app.traceScorecardRow('${sc.traceType}')">
          <td class="font-medium">${sc.metric}</td>
          <td class="font-mono text-cyan">${sc.count}</td>
          <td class="font-mono">${sc.percentage}</td>
          <td class="font-mono text-xs opacity-75">${sc.threshold}</td>
          <td><span class="status-pill pill-${sc.color}">${sc.risk}</span></td>
        </tr>
      `).join('');
    }

    // Name change deep dive card
    const nameCard = document.getElementById('itemNameChangeDetails');
    if (nameCard) {
      nameCard.innerHTML = `
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Total Name Changes:</span>
            <span class="font-bold text-cyan">${item.nameChangeCount} (${item.nameChangeRate.toFixed(1)}%)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Affected Domains:</span>
            <span class="font-bold">${item.affectedCategoryCount}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Largest Contributor:</span>
            <span class="font-bold text-amber-500">${item.topCategoryName} (${item.topCategoryPercent}%)</span>
          </div>
          <div class="mt-3 p-3 bg-card-subtle rounded border border-navy-700">
            <div class="text-xs text-cyan uppercase font-bold tracking-wider mb-1">Dominant Migration Pattern:</div>
            <div class="text-xs font-mono">${labels.left}: <span class="text-red font-bold">${item.dominantMigration.oldName}</span></div>
            <div class="text-xs font-mono">${labels.right}: <span class="text-green font-bold">${item.dominantMigration.newName}</span></div>
          </div>
        </div>
      `;
    }

    // Structural Impact Summary
    const impactCard = document.getElementById('itemImpactSummary');
    if (impactCard) {
      impactCard.innerHTML = `
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Added Records:</span>
            <span class="font-bold text-green">+${item.addedCount}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Removed Records:</span>
            <span class="font-bold text-red">-${item.removedCount}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">Net Structural Delta:</span>
            <span class="font-bold">${item.netChange >= 0 ? '+' : ''}${item.netChange} items</span>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-xs opacity-75 font-bold uppercase">Impact Classification:</span>
            <span class="status-pill pill-${item.impactLevel === 'LOW' ? 'green' : (item.impactLevel === 'MEDIUM' ? 'yellow' : 'red')} font-bold">
              ${item.impactLevel} IMPACT
            </span>
          </div>
        </div>
      `;
    }

    // Executive Conclusions
    const conclCard = document.getElementById('itemConclusions');
    if (conclCard) {
      conclCard.innerHTML = `
        <ul class="space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <span class="text-green font-bold">✓</span>
            <span>Match records represent <b>${item.matchRate.toFixed(1)}%</b> of total comparison data.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-cyan font-bold">✓</span>
            <span>Name changes account for <b>${item.nameChangeRate.toFixed(1)}%</b> of all test items.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 font-bold">✓</span>
            <span>Structural changes: <b>${item.addedCount}</b> added, <b>${item.removedCount}</b> removed records.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-purple font-bold">✓</span>
            <span>Limit / Unit modifications affect <b>${item.limitChangeCount + item.unitChangeCount}</b> records.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green font-bold">✓</span>
            <span>Net program structural impact: <b>${item.netChange >= 0 ? '+' : ''}${item.netChange}</b> items.</span>
          </li>
        </ul>
      `;
    }

    // Render Charts
    this.chartsManager.renderStatusDonut('chartItemDonut', item, raw);
    this.chartsManager.renderItemPareto('chartItemPareto', item.paretoItems, raw, item.totalRecords, item.meta);

    // Render Detailed Item Comparison Matrix Table
    this.renderItemComparisonTable();
  }

  /**
   * Render Detailed Item Comparison Matrix Table
   */
  renderItemComparisonTable() {
    const raw = this.state.itemFile?.rows || [];
    const tbody = document.getElementById('itemComparisonTbody');
    const countBadge = document.getElementById('itemTableCountBadge');
    if (!tbody) return;

    if (!raw || raw.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">No item comparison data loaded.</td></tr>';
      if (countBadge) countBadge.textContent = '0 items';
      return;
    }

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const searchInput = document.getElementById('itemTableSearch');
    const statusSelect = document.getElementById('itemTableStatusFilter');

    const searchQuery = (searchInput?.value || '').trim().toLowerCase();
    const statusFilter = statusSelect?.value || 'ALL';

    // Parse items into clean structure
    const items = raw.map((r, idx) => {
      const status = String(r.Status || 'UNKNOWN').trim();
      const testName = String(r.Test_Name || '').trim();
      const desc = String(r.Description || '').trim();

      let oldName = r.OLD_Test_Name || testName;
      let newName = r.NEW_Test_Name || testName;
      if (testName.includes('->')) {
        const parts = testName.split('->').map(p => p.trim());
        oldName = parts[0];
        newName = parts[1];
      }

      const oldLimits = (r.OLD_LSL !== undefined && r.OLD_LSL !== '' || r.OLD_USL !== undefined && r.OLD_USL !== '') ? `[${r.OLD_LSL ?? ''}, ${r.OLD_USL ?? ''}]` : '-';
      const newLimits = (r.NEW_LSL !== undefined && r.NEW_LSL !== '' || r.NEW_USL !== undefined && r.NEW_USL !== '') ? `[${r.NEW_LSL ?? ''}, ${r.NEW_USL ?? ''}]` : '-';
      const oldUnits = r.OLD_Units || '-';
      const newUnits = r.NEW_Units || '-';

      const lowStatus = status.toLowerCase();
      let statusKey = 'MATCH';
      let pillClass = 'pill-green';

      if (lowStatus.includes('name')) {
        statusKey = 'NAME_CHANGE';
        pillClass = 'pill-yellow';
      } else if (lowStatus.includes('add')) {
        statusKey = 'ADDED';
        pillClass = 'pill-green';
      } else if (lowStatus.includes('remove') || lowStatus.includes('del')) {
        statusKey = 'REMOVED';
        pillClass = 'pill-red';
      } else if (lowStatus.includes('limit')) {
        statusKey = 'LIMIT_CHANGE';
        pillClass = 'pill-purple';
      } else if (lowStatus.includes('number') || lowStatus.includes('num')) {
        statusKey = 'NUMBER_CHANGE';
        pillClass = 'pill-cyan';
      } else if (lowStatus.includes('unit')) {
        statusKey = 'UNIT_CHANGE';
        pillClass = 'pill-cyan';
      } else if (lowStatus === 'match') {
        statusKey = 'MATCH';
        pillClass = 'pill-green';
      } else {
        statusKey = status.toUpperCase().replace(/\s+/g, '_');
        pillClass = 'pill-yellow';
      }

      const searchBlob = `${oldName} ${newName} ${status} ${desc} ${oldUnits} ${newUnits}`.toLowerCase();

      return {
        index: idx + 1,
        status,
        statusKey,
        pillClass,
        oldName,
        newName,
        oldLimits,
        newLimits,
        oldUnits,
        newUnits,
        desc,
        searchBlob,
        raw: r
      };
    });

    // Dynamic populate status select options if needed
    if (statusSelect && statusSelect.options && statusSelect.options.length <= 6) {
      const distinctStatusKeys = Array.from(new Set(items.map(i => i.statusKey)));
      distinctStatusKeys.forEach(sk => {
        if (!Array.from(statusSelect.options).some(o => o.value === sk)) {
          const opt = document.createElement('option');
          opt.value = sk;
          opt.textContent = sk.replace(/_/g, ' ');
          statusSelect.appendChild(opt);
        }
      });
    }

    // Filter
    const filtered = items.filter(item => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'MATCH' && item.statusKey !== 'MATCH') return false;
        if (statusFilter === 'NAME_CHANGE' && item.statusKey !== 'NAME_CHANGE') return false;
        if (statusFilter === 'ADDED' && item.statusKey !== 'ADDED') return false;
        if (statusFilter === 'REMOVED' && item.statusKey !== 'REMOVED') return false;
        if (statusFilter === 'LIMIT_CHANGE' && item.statusKey !== 'LIMIT_CHANGE') return false;
        if (!['MATCH', 'NAME_CHANGE', 'ADDED', 'REMOVED', 'LIMIT_CHANGE'].includes(statusFilter) && item.statusKey !== statusFilter) return false;
      }
      if (searchQuery && !item.searchBlob.includes(searchQuery)) return false;
      return true;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} / ${items.length} items`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">No items match the current search / filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(item => `
      <tr class="clickable-row hover:bg-white/5 transition-colors cursor-pointer" onclick="window.app.traceItemRecord(${item.index - 1})" title="Click to view item audit details">
        <td class="text-center font-mono text-gray-400 text-xs">${item.index}</td>
        <td><span class="status-pill ${item.pillClass} text-[10px] font-bold">${safeEsc(item.status)}</span></td>
        <td class="font-mono text-xs text-gray-300 font-bold">${safeEsc(item.oldName)}</td>
        <td class="font-mono text-xs text-cyan font-bold">${safeEsc(item.newName)}</td>
        <td class="font-mono text-xs text-gray-400">${safeEsc(item.oldLimits)}</td>
        <td class="font-mono text-xs text-gray-300">${safeEsc(item.newLimits)}</td>
        <td class="font-mono text-xs text-gray-400">${safeEsc(item.oldUnits)}</td>
        <td class="font-mono text-xs text-gray-300">${safeEsc(item.newUnits)}</td>
      </tr>
    `).join('');
  }

  onItemSearch() {
    this.renderItemComparisonTable();
  }

  onItemFilterChange() {
    this.renderItemComparisonTable();
  }

  traceItemRecord(index) {
    const raw = this.state.itemFile?.rows || [];
    const r = raw[index];
    if (!r) return;
    const testName = r.Test_Name || `Item #${index + 1}`;
    window.traceManager.trace(
      `Item Comparison: ${testName}`,
      `Status: ${r.Status || 'N/A'}`,
      `<b>Description:</b> ${r.Description || 'No detailed change description available.'}`,
      [r],
      null,
      this.state.itemAnalysis?.meta?.rawName || 'itemcompare.csv'
    );
  }

  /**
   * Helper to bind KPI card click
   */
  setKpi(elementId, value, clickCallback) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = value;
      const card = el.closest('.kpi-card');
      if (card && clickCallback) {
        card.style.cursor = 'pointer';
        card.onclick = clickCallback;
      }
    }
  }

  traceScorecardRow(traceType) {
    const raw = this.state.itemFile?.rows || [];
    const item = this.state.itemAnalysis;
    if (!item) return;
    const labels = this.getItemLabels();

    if (traceType === 'item_match') {
      const f = raw.filter(r => (r.Status || '').toLowerCase() === 'match');
      window.traceManager.trace('Scorecard: Match Test Items', 'Items with identical configurations', `<b>Formula:</b> Match Rate = ${item.matchCount} / ${item.totalRecords} = <b>${item.matchRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    } else if (traceType === 'item_changed') {
      const f = raw.filter(r => (r.Status || '').toLowerCase() !== 'match');
      window.traceManager.trace('Scorecard: Changed Test Items', 'Items with any variation', `<b>Formula:</b> Overall Change Rate = ${item.totalChanged} / ${item.totalRecords} = <b>${item.changeRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    } else if (traceType === 'item_namechange') {
      const f = raw.filter(r => (r.Status || '').toLowerCase().includes('name'));
      window.traceManager.trace('Scorecard: Name Changes', 'Renamed parameter items', `<b>Formula:</b> Name Change Rate = ${item.nameChangeCount} / ${item.totalRecords} = <b>${item.nameChangeRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    } else if (traceType === 'item_added') {
      const f = raw.filter(r => (r.Status || '').toLowerCase().includes('add'));
      window.traceManager.trace('Scorecard: Added Items', `Newly created tests in ${labels.right} program`, `<b>Formula:</b> Added Rate = ${item.addedCount} / ${item.totalRecords} = <b>${item.addedRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    } else if (traceType === 'item_removed') {
      const f = raw.filter(r => (r.Status || '').toLowerCase().includes('remove'));
      window.traceManager.trace('Scorecard: Removed Items', 'Deprecated or removed test parameters', `<b>Formula:</b> Removed Rate = ${item.removedCount} / ${item.totalRecords} = <b>${item.removedRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    } else if (traceType === 'item_limitchange') {
      const f = raw.filter(r => (r.Status || '').toLowerCase().includes('limit'));
      window.traceManager.trace('Scorecard: Limit Changes', 'Modified test limits', `<b>Formula:</b> Limit Change Rate = ${item.limitChangeCount} / ${item.totalRecords} = <b>${item.limitChangeRate.toFixed(2)}%</b>`, f, null, item.meta.rawName);
    }
  }

  /**
   * Update DSA Tab (DSA.txt)
   */
  updateDsaUi() {
    const dsa = this.state.dsaAnalysis;
    const raw = this.state.dsaFile?.rows || [];
    if (!dsa) return;

    // Dedicated DSA Shift Source File Info Bar
    const dsaFileName = document.getElementById('dsaLoadedFileName');
    const dsaFileBadge = document.getElementById('dsaLoadedFileBadge');
    const dsaTimestamp = document.getElementById('dsaLoadedTimestamp');
    const dsaFileSize = document.getElementById('dsaLoadedFileSize');
    if (dsaFileName) dsaFileName.textContent = this.state.dsaFile?.filename || 'dsacompare.csv';
    if (dsaFileBadge) dsaFileBadge.textContent = `${dsa.totalParameters} params • Shifted: ${dsa.abcImpactCount} (${dsa.abcImpactPercent}%)`;
    if (dsaTimestamp) dsaTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    if (dsaFileSize) dsaFileSize.textContent = this.formatFileSize(this.state.dsaFile?.fileSize);

    // KPI Cards
    this.setKpi('kDsaTotalParams', dsa.totalParameters, () => {
      window.traceManager.trace('Total DSA Parameters', 'All parameters evaluated in shift analysis', `<b>Formula:</b> Total parameters = <b>${dsa.totalParameters}</b>`, raw, null, dsa.meta.rawName);
    });

    this.setKpi('kDsaTotalShifted', dsa.totalShifted, () => {
      const f = raw.filter(r => ['A', 'B', 'C'].includes((r.DSA_Group || '').trim().toUpperCase()));
      window.traceManager.trace('Total Shifted Parameters', 'Parameters in Category A, B, or C', `<b>Formula:</b> Full Shift (${dsa.totalFullShift}) + Median Shift (${dsa.totalMedianShift}) = <b>${dsa.totalShifted}</b>`, f, null, dsa.meta.rawName);
    });

    this.setKpi('kDsaFullShift', dsa.totalFullShift, () => {
      const f = dsa.allContributors.filter(c => c.isFullShift).map(c => c.rawRecord);
      window.traceManager.trace('Full Shift Parameters', 'Severe mean/variance distribution shifts', `<b>Formula:</b> Total Full Shift = <b>${dsa.totalFullShift}</b> parameters`, f, null, dsa.meta.rawName);
    });

    this.setKpi('kDsaMedianShift', dsa.totalMedianShift, () => {
      const f = dsa.allContributors.filter(c => c.isMedianShift).map(c => c.rawRecord);
      window.traceManager.trace('Median Shift Parameters', 'Distribution center-point drift', `<b>Formula:</b> Total Median Shift = <b>${dsa.totalMedianShift}</b> parameters`, f, null, dsa.meta.rawName);
    });

    this.setKpi('kDsaAbcImpact', `${dsa.abcImpactCount} (${dsa.abcImpactPercent}%)`, () => {
      const f = raw.filter(r => ['A', 'B', 'C'].includes((r.DSA_Group || '').trim().toUpperCase()));
      window.traceManager.trace('A+B+C Impact Population', 'Critical and major shift population', `<b>Formula:</b> (Cat A ${dsa.categoryCounts.A} + Cat B ${dsa.categoryCounts.B} + Cat C ${dsa.categoryCounts.C}) / Total ${dsa.totalParameters} = <b>${dsa.abcImpactPercent}%</b>`, f, null, dsa.meta.rawName);
    });

    // Update DSA Test Ignore input & badge
    const dsaInput = document.getElementById('dsaTestIgnoreInput');
    if (dsaInput && dsaInput.value !== this.state.testIgnoreInput) {
      dsaInput.value = this.state.testIgnoreInput;
    }
    const dsaBadge = document.getElementById('dsaIgnoreStatusBadge');
    const dsaCountText = document.getElementById('dsaIgnoreCountText');
    if (dsaBadge && dsaCountText) {
      if (dsa.ignoredCount > 0) {
        dsaCountText.textContent = `${dsa.ignoredCount}`;
        dsaBadge.classList.remove('hidden');
      } else {
        dsaBadge.classList.add('hidden');
      }
    }

    // Shift Matrix Table
    const matTbody = document.getElementById('dsaMatrixTbody');
    if (matTbody) {
      matTbody.innerHTML = `
        <tr>
          <td class="font-bold text-red">FULL SHIFT</td>
          <td class="font-mono text-center text-red font-bold">${dsa.fullShiftCounts.A}</td>
          <td class="font-mono text-center text-amber-500 font-bold">${dsa.fullShiftCounts.B}</td>
          <td class="font-mono text-center text-cyan font-bold">${dsa.fullShiftCounts.C}</td>
          <td class="font-mono text-center font-bold">${dsa.totalFullShift}</td>
        </tr>
        <tr>
          <td class="font-bold text-amber-500">MEDIAN SHIFT</td>
          <td class="font-mono text-center text-red font-bold">${dsa.medianShiftCounts.A}</td>
          <td class="font-mono text-center text-amber-500 font-bold">${dsa.medianShiftCounts.B}</td>
          <td class="font-mono text-center text-cyan font-bold">${dsa.medianShiftCounts.C}</td>
          <td class="font-mono text-center font-bold">${dsa.totalMedianShift}</td>
        </tr>
      `;
    }

    // Critical Findings (Right Panel)
    const findingsEl = document.getElementById('dsaCriticalFindings');
    if (findingsEl) {
      findingsEl.innerHTML = `
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">1. Highest Full Shift Cat:</span>
            <span class="font-bold text-red">${dsa.highestFullShiftCat}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">2. Highest Median Shift Cat:</span>
            <span class="font-bold text-amber-500">${dsa.highestMedianShiftCat}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">3. Top Program Domain:</span>
            <span class="font-bold text-cyan">${dsa.topDomain}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-navy-700">
            <span class="opacity-75">4. Highest Risk Test Item:</span>
            <span class="font-bold text-red font-mono">${dsa.highestRiskTestItem}</span>
          </div>
          <div class="pt-2 text-xs opacity-75">
            <b>Recommended Engineering Focus:</b> Prioritize investigation on <b>${dsa.topDomain}</b> circuit parameters and probe card contact stability.
          </div>
        </div>
      `;
    }

    // Executive Takeaways (Bottom)
    const takeEl = document.getElementById('dsaTakeaways');
    if (takeEl) {
      takeEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div class="p-3 bg-card-subtle rounded border border-navy-700">
            <div class="text-xs opacity-75 font-bold uppercase mb-1">Total A/B/C Impact</div>
            <div class="font-medium">${dsa.abcImpactCount} parameters (${dsa.abcImpactPercent}%) require active engineering monitoring.</div>
          </div>
          <div class="p-3 bg-card-subtle rounded border border-navy-700">
            <div class="text-xs opacity-75 font-bold uppercase mb-1">Full Shift Contribution</div>
            <div class="font-medium">${dsa.totalFullShift} items shifted significantly in mean or variance distribution.</div>
          </div>
          <div class="p-3 bg-card-subtle rounded border border-navy-700">
            <div class="text-xs opacity-75 font-bold uppercase mb-1">Median Shift Contribution</div>
            <div class="font-medium">${dsa.totalMedianShift} items showed center-point drift across stages.</div>
          </div>
          <div class="p-3 bg-card-subtle rounded border border-navy-700">
            <div class="text-xs opacity-75 font-bold uppercase mb-1">Engineering Actions</div>
            <div class="text-cyan font-medium">Perform guardband review on ${dsa.topDomain} before mass production.</div>
          </div>
        </div>
      `;
    }

    // Render Charts
    this.chartsManager.renderDsaPareto('chartDsaPareto', dsa, raw);
    const topDsaList = (dsa.topPrefixContributors && dsa.topPrefixContributors.length > 0) ? dsa.topPrefixContributors : dsa.topContributors;
    this.chartsManager.renderTopContributors('chartDsaTopContributors', topDsaList, raw, dsa.meta);
  }

  /**
   * Update Bin & Yield Tab with Hard Bin, Soft Bin & First Fail Pareto Comparison
   */
  updateBinUi() {
    const bin = this.state.binAnalysis;
    if (!bin) return;

    // Dedicated Bin & Yield Source File Info Bar
    const binFileName = document.getElementById('binLoadedFileName');
    const binFileBadge = document.getElementById('binLoadedFileBadge');
    const binTimestamp = document.getElementById('binLoadedTimestamp');
    const binFileSize = document.getElementById('binLoadedFileSize');
    if (binFileName) binFileName.textContent = this.state.binFile?.filename || 'bincompare.csv';
    if (binFileBadge) binFileBadge.textContent = `${(bin.transitions || []).length} transitions • Yield Delta: ${bin.yieldDelta >= 0 ? '+' : ''}${bin.yieldDelta.toFixed(2)}%`;
    if (binTimestamp) binTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    if (binFileSize) binFileSize.textContent = this.formatFileSize(this.state.binFile?.fileSize);

    // Yield KPIs
    this.setKpi('kBinOldYield', `${bin.oldPassRate.toFixed(2)}%`, () => {
      window.traceManager.trace('OLD Pass Yield', 'Baseline hard bin yield', `<b>Formula:</b> OLD Pass Rate = <b>${bin.oldPassRate.toFixed(2)}%</b>`, bin.oldHardBin, null, bin.meta.rawName);
    });

    this.setKpi('kBinNewYield', `${bin.newPassRate.toFixed(2)}%`, () => {
      window.traceManager.trace('NEW Pass Yield', 'New program hard bin yield', `<b>Formula:</b> NEW Pass Rate = <b>${bin.newPassRate.toFixed(2)}%</b>`, bin.newHardBin, null, bin.meta.rawName);
    });

    const sign = bin.yieldDelta >= 0 ? '+' : '';
    this.setKpi('kBinDeltaYield', `${sign}${bin.yieldDelta.toFixed(2)}%`, () => {
      window.traceManager.trace('Yield Delta', 'Net yield change across stages', `<b>Formula:</b> NEW Pass (${bin.newPassRate.toFixed(2)}%) - OLD Pass (${bin.oldPassRate.toFixed(2)}%) = <b>${sign}${bin.yieldDelta.toFixed(2)}%</b>`, bin.transitions, null, bin.meta.rawName);
    });

    this.setKpi('kBinPfCount', `${bin.pfCount} dice`, () => {
      const pfRow = bin.transitions.filter(t => (t.Transition || '').toLowerCase() === 'pf');
      window.traceManager.trace('Pass ➔ Fail (pf) Transitions', 'Critical yield loss transition', `<b>Formula:</b> ${bin.pfCount} dice switched from Pass in OLD to Fail in NEW`, pfRow, null, bin.meta.rawName);
    });

    // Top Loss Driver KPI (adapts to current mode or primary fallout)
    let topDriver = bin.topHardFailDriver;
    if (this.state.binParetoMode === 'soft' && bin.topSoftFailDriver) topDriver = bin.topSoftFailDriver;
    if (this.state.binParetoMode === 'firstfail' && bin.topFirstFailDriver) topDriver = bin.topFirstFailDriver;

    const topDriverName = topDriver ? (topDriver.displayName || topDriver.binName || topDriver.testName) : 'None';
    const topDriverSub = topDriver ? `NEW: ${topDriver.newCount} dice (${topDriver.newPct.toFixed(2)}%) | OLD: ${topDriver.oldCount}` : 'Zero recorded fallout';

    this.setKpi('kBinTopFailDriver', topDriverName, () => {
      if (topDriver) {
        const records = [];
        if (topDriver.oldRaw) records.push({ Stage: 'OLD Stage', ...topDriver.oldRaw });
        if (topDriver.newRaw) records.push({ Stage: 'NEW Stage', ...topDriver.newRaw });
        window.traceManager.trace(
          `Top Yield Limiter: ${topDriverName}`,
          `Rank #1 Failure fallout driver across stages`,
          `<b>Driver Fallout Details:</b><br>` +
          `• NEW Stage: <b>${topDriver.newCount} dice (${topDriver.newPct.toFixed(2)}%)</b><br>` +
          `• OLD Stage: <b>${topDriver.oldCount} dice (${topDriver.oldPct.toFixed(2)}%)</b><br>` +
          `• Delta: <b>${topDriver.deltaCount >= 0 ? '+' : ''}${topDriver.deltaCount} dice</b>`,
          records.length > 0 ? records : [topDriver],
          null,
          bin.meta.rawName
        );
      }
    });

    const topSubEl = document.getElementById('kBinTopFailDriverSub');
    if (topSubEl) topSubEl.textContent = topDriverSub;

    // Render Transitions Donut Chart
    this.chartsManager.renderTransitionsDonut('chartBinTransitions', bin);

    // Render Comparative Pareto Chart & Table
    this.refreshBinPareto();
  }

  /**
   * Refresh Bin Pareto Chart, Insights, and Table based on active mode & filter
   */
  refreshBinPareto() {
    const bin = this.state.binAnalysis;
    if (!bin) return;

    const mode = this.state.binParetoMode || 'hard';
    const isFailOnly = this.state.binParetoFilter === 'fail_only';
    const modeObj = mode === 'hard' ? bin.hardBinPareto : (mode === 'soft' ? bin.softBinPareto : bin.firstFailPareto);
    if (!modeObj) return;

    const currentDataset = isFailOnly ? modeObj.failOnly : modeObj.all;

    // Update Mode Buttons UI
    const btnHard = document.getElementById('btnBinParetoHard');
    const btnSoft = document.getElementById('btnBinParetoSoft');
    const btnFF = document.getElementById('btnBinParetoFF');

    if (btnHard && btnSoft && btnFF) {
      btnHard.className = `btn ${mode === 'hard' ? 'btn-primary' : 'btn-secondary'} text-xs py-1 px-2.5 flex items-center gap-1`;
      btnSoft.className = `btn ${mode === 'soft' ? 'btn-primary' : 'btn-secondary'} text-xs py-1 px-2.5 flex items-center gap-1`;
      btnFF.className = `btn ${mode === 'firstfail' ? 'btn-primary' : 'btn-secondary'} text-xs py-1 px-2.5 flex items-center gap-1`;
    }

    // Update Filter Button UI
    const btnFilter = document.getElementById('btnBinParetoFilter');
    const filterText = document.getElementById('binParetoFilterText');
    const filterIcon = document.getElementById('binParetoFilterIcon');
    if (btnFilter && filterText) {
      if (isFailOnly) {
        btnFilter.className = 'btn btn-primary text-xs py-1 px-2.5 flex items-center gap-1';
        filterText.textContent = 'Failures Only';
        if (filterIcon) filterIcon.textContent = '🎯';
      } else {
        btnFilter.className = 'btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1';
        filterText.textContent = 'All (Incl. Pass)';
        if (filterIcon) filterIcon.textContent = '🔍';
      }
    }

    // Update Headings & Column Labels
    const headingEl = document.getElementById('binParetoChartHeading');
    const badgeEl = document.getElementById('binParetoModeBadge');
    const tableTitleEl = document.getElementById('binParetoTableTitle');
    const thId = document.getElementById('thBinParetoId');
    const thName = document.getElementById('thBinParetoName');
    const thClass = document.getElementById('thBinParetoClass');

    const config = {
      hard: {
        title: 'Hard Bin Distribution Pareto',
        badge: isFailOnly ? 'Hard Bin (Failures Only)' : 'Hard Bin (All)',
        tableTitle: 'Hard Bin Comparative Distribution & Pareto Matrix',
        idCol: 'Hard Bin #',
        nameCol: 'Hard Bin Name',
        classCol: 'Bin State'
      },
      soft: {
        title: 'Soft Bin Distribution Pareto',
        badge: isFailOnly ? 'Soft Bin (Failures Only)' : 'Soft Bin (All)',
        tableTitle: 'Soft Bin Comparative Distribution & Pareto Matrix',
        idCol: 'Category',
        nameCol: 'Soft Bin Name',
        classCol: 'Classification'
      },
      firstfail: {
        title: 'First Fail Parameter Pareto',
        badge: isFailOnly ? 'First Fail (Defects Only)' : 'First Fail (All)',
        tableTitle: 'First Fail Parameter Comparative Distribution & Pareto Matrix',
        idCol: 'Test #',
        nameCol: 'First Fail Test Name',
        classCol: 'Result Type'
      }
    }[mode];

    if (headingEl) headingEl.textContent = config.title;
    if (badgeEl) badgeEl.textContent = config.badge;
    if (tableTitleEl) tableTitleEl.textContent = config.tableTitle;
    if (thId) thId.textContent = config.idCol;
    if (thName) thName.textContent = config.nameCol;
    if (thClass) thClass.textContent = config.classCol;

    // Render Pareto Chart with dynamic horizontal scroll spacing
    const barSpacing = this.state.binParetoBarSpacing || 55;
    const chartHeight = this.state.binParetoHeight || 320;
    this.chartsManager.renderBinComparativePareto('chartBinParetoComparison', currentDataset, mode, isFailOnly, bin.meta, barSpacing);

    // Sync X-Zoom & Y-Height slider UI
    const zoomSlider = document.getElementById('binParetoZoomSlider');
    const zoomVal = document.getElementById('binParetoZoomVal');
    if (zoomSlider) zoomSlider.value = barSpacing;
    if (zoomVal) zoomVal.textContent = `${barSpacing}px`;

    const heightSlider = document.getElementById('binParetoHeightSlider');
    const heightVal = document.getElementById('binParetoHeightVal');
    if (heightSlider) heightSlider.value = chartHeight;
    if (heightVal) heightVal.textContent = `${chartHeight}px`;

    const scrollWrapper = document.getElementById('binParetoScrollWrapper');
    const innerWrapper = document.getElementById('binParetoInnerWrapper');
    if (scrollWrapper && innerWrapper) {
      scrollWrapper.style.height = `${chartHeight}px`;
      scrollWrapper.style.minHeight = `${chartHeight}px`;
      innerWrapper.style.height = `${chartHeight}px`;
      innerWrapper.style.minHeight = `${chartHeight}px`;
    }

    // Render Key Insights
    this.renderBinParetoInsights(mode, currentDataset, bin);

    // Render Data Table
    this.renderBinParetoTable(currentDataset, mode);
  }

  /**
   * Adjust horizontal bar spacing / zoom for Bin Pareto chart (X-Axis)
   */
  onBinParetoZoom(val) {
    const spacing = parseInt(val) || 55;
    this.state.binParetoBarSpacing = spacing;
    const zoomVal = document.getElementById('binParetoZoomVal');
    if (zoomVal) zoomVal.textContent = `${spacing}px`;

    const innerWrapper = document.getElementById('binParetoInnerWrapper');
    const scrollWrapper = document.getElementById('binParetoScrollWrapper');
    const bin = this.state.binAnalysis;
    if (innerWrapper && scrollWrapper && bin) {
      const mode = this.state.binParetoMode || 'hard';
      const isFailOnly = this.state.binParetoFilter === 'fail_only';
      const modeObj = mode === 'hard' ? bin.hardBinPareto : (mode === 'soft' ? bin.softBinPareto : bin.firstFailPareto);
      const dataset = modeObj ? (isFailOnly ? modeObj.failOnly : modeObj.all) : [];
      const parentWidth = scrollWrapper.clientWidth || 600;
      const calcWidth = Math.max(parentWidth, dataset.length * spacing);
      innerWrapper.style.width = `${calcWidth}px`;
      if (this.chartsManager.charts['chartBinParetoComparison']) {
        this.chartsManager.charts['chartBinParetoComparison'].resize();
      }
    }
  }

  /**
   * Adjust vertical height / zoom for Bin Pareto chart (Y-Axis)
   */
  onBinParetoHeightZoom(val) {
    const height = parseInt(val) || 320;
    this.state.binParetoHeight = height;
    const heightVal = document.getElementById('binParetoHeightVal');
    if (heightVal) heightVal.textContent = `${height}px`;

    const scrollWrapper = document.getElementById('binParetoScrollWrapper');
    const innerWrapper = document.getElementById('binParetoInnerWrapper');
    if (scrollWrapper && innerWrapper) {
      scrollWrapper.style.height = `${height}px`;
      scrollWrapper.style.minHeight = `${height}px`;
      innerWrapper.style.height = `${height}px`;
      innerWrapper.style.minHeight = `${height}px`;
      if (this.chartsManager.charts['chartBinParetoComparison']) {
        this.chartsManager.charts['chartBinParetoComparison'].resize();
      }
    }
  }

  /**
   * Smoothly scroll Bin Pareto chart left or right
   */
  scrollBinPareto(offset) {
    const wrapper = document.getElementById('binParetoScrollWrapper');
    if (wrapper) {
      wrapper.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  /**
   * Set active Bin Pareto mode ('hard' | 'soft' | 'firstfail')
   */
  setBinParetoMode(mode) {
    this.state.binParetoMode = mode;
    this.refreshBinPareto();
  }

  /**
   * Toggle between All Bins / Failures Only
   */
  toggleBinParetoFilter() {
    this.state.binParetoFilter = this.state.binParetoFilter === 'all' ? 'fail_only' : 'all';
    this.refreshBinPareto();
  }

  /**
   * Search filter for Bin Pareto table
   */
  onBinParetoSearch() {
    const searchInput = document.getElementById('binParetoSearch');
    this.state.binParetoSearch = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const bin = this.state.binAnalysis;
    if (!bin) return;
    const mode = this.state.binParetoMode || 'hard';
    const isFailOnly = this.state.binParetoFilter === 'fail_only';
    const modeObj = mode === 'hard' ? bin.hardBinPareto : (mode === 'soft' ? bin.softBinPareto : bin.firstFailPareto);
    if (!modeObj) return;

    const currentDataset = isFailOnly ? modeObj.failOnly : modeObj.all;
    this.renderBinParetoTable(currentDataset, mode);
  }

  /**
   * Render side panel insights for active Pareto mode
   */
  renderBinParetoInsights(mode, dataset, bin) {
    const container = document.getElementById('binParetoInsights');
    if (!container) return;

    const topItem = dataset[0] || null;
    const topFail = dataset.find(d => !d.isPass) || null;

    const modeName = mode === 'hard' ? 'Hard Bin' : (mode === 'soft' ? 'Soft Bin' : 'First Fail Item');

    container.innerHTML = `
      <div class="space-y-2 text-xs">
        <div class="flex justify-between py-1 border-b border-navy-700">
          <span class="opacity-75">Analysis Mode:</span>
          <span class="font-bold text-cyan">${modeName}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-navy-700">
          <span class="opacity-75">Top Contributor:</span>
          <span class="font-bold text-amber font-mono">${topItem ? (topItem.displayName || topItem.binName || topItem.testName) : 'N/A'}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-navy-700">
          <span class="opacity-75">Top Failure Driver:</span>
          <span class="font-bold text-red font-mono">${topFail ? (topFail.displayName || topFail.binName || topFail.testName) : 'None'}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-navy-700">
          <span class="opacity-75">Fallout Delta (Rank #1 Fail):</span>
          <span class="font-bold ${topFail && topFail.deltaCount > 0 ? 'text-red' : (topFail && topFail.deltaCount < 0 ? 'text-green' : 'opacity-75')}">
            ${topFail ? (topFail.deltaCount >= 0 ? '+' : '') + topFail.deltaCount + ' dice (' + (topFail.deltaPct >= 0 ? '+' : '') + topFail.deltaPct.toFixed(2) + '%)' : '0%'}
          </span>
        </div>
        <div class="pt-1 text-[11px] opacity-75 leading-relaxed">
          💡 <b>Engineering Note:</b> Comparing ${modeName} across program versions identifies whether yield shifts are caused by hardware binning, specific test soft bins, or parameter threshold fallout.
        </div>
      </div>
    `;
  }

  /**
   * Render Comprehensive Pareto Comparison Data Table
   */
  renderBinParetoTable(dataset, mode) {
    const tbody = document.getElementById('binParetoTbody');
    const countBadge = document.getElementById('binParetoTableCountBadge');
    if (!tbody) return;

    const query = this.state.binParetoSearch || '';
    const filtered = dataset.filter(item => {
      if (!query) return true;
      const str = `${item.binNum || ''} ${item.binName || ''} ${item.testNum || ''} ${item.testName || ''} ${item.displayName || ''}`.toLowerCase();
      return str.includes(query);
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} of ${dataset.length} items`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-6 text-sm opacity-60">
            No matching bins or failure parameters found matching "${query}".
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((item, idx) => {
      const idVal = item.binNum || item.testNum || (item.isPass ? 'P' : 'F');
      const nameVal = item.binName || item.testName || item.displayName || 'N/A';
      
      const passStateBadge = item.isPass
        ? `<span class="status-pill pill-green text-xs font-bold">PASS (${item.binState || 'P'})</span>`
        : `<span class="status-pill pill-red text-xs font-bold">FAIL (${item.binState || 'F'})</span>`;

      const signCount = item.deltaCount > 0 ? '+' : '';
      const signPct = item.deltaPct > 0 ? '+' : '';

      const countClr = item.isPass
        ? (item.deltaCount >= 0 ? 'text-green' : 'text-red')
        : (item.deltaCount > 0 ? 'text-red' : (item.deltaCount < 0 ? 'text-green' : 'opacity-75'));

      let trendBadge = `<span class="status-pill pill-secondary text-xs">● Unchanged</span>`;
      if (item.isPass) {
        trendBadge = item.deltaCount >= 0
          ? `<span class="status-pill pill-green text-xs font-bold">▲ Yield +${item.deltaCount}</span>`
          : `<span class="status-pill pill-red text-xs font-bold">▼ Yield ${item.deltaCount}</span>`;
      } else {
        if (item.deltaCount > 0) {
          trendBadge = `<span class="status-pill pill-red text-xs font-bold">▲ Fallout +${item.deltaCount}</span>`;
        } else if (item.deltaCount < 0) {
          trendBadge = `<span class="status-pill pill-green text-xs font-bold">▼ Fallout ${item.deltaCount}</span>`;
        }
      }

      const binNameWidth = this.state.binNameWidth || 280;
      return `
        <tr class="cursor-pointer hover:bg-navy-800/50 transition-colors" onclick="window.app.traceBinParetoRow('${item.key}', '${mode}')">
          <td class="font-mono text-center opacity-75">#${idx + 1}</td>
          <td class="font-mono text-cyan font-bold">${idVal}</td>
          <td class="font-medium cell-test-col" style="width: ${binNameWidth}px; max-width: ${binNameWidth}px;" title="${safeEsc(nameVal)}">
            <span class="cell-test-name">${safeEsc(nameVal)}</span>
          </td>
          <td>${passStateBadge}</td>
          <td class="font-mono text-center">${item.oldCount}</td>
          <td class="font-mono text-right opacity-80">${item.oldPct.toFixed(2)}% <span class="text-xs text-amber font-mono font-normal">(${item.cumOldPct.toFixed(1)}%)</span></td>
          <td class="font-mono text-center font-bold text-cyan">${item.newCount}</td>
          <td class="font-mono text-right font-bold text-cyan">${item.newPct.toFixed(2)}% <span class="text-xs text-amber font-mono font-normal">(${item.cumNewPct.toFixed(1)}%)</span></td>
          <td class="font-mono text-center font-bold ${countClr}">${signCount}${item.deltaCount}</td>
          <td class="font-mono text-right font-bold ${countClr}">${signPct}${item.deltaPct.toFixed(2)}%</td>
          <td class="text-center">${trendBadge}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Drilldown trace handler for clicking a row in the Bin Pareto table
   */
  traceBinParetoRow(key, mode) {
    const bin = this.state.binAnalysis;
    if (!bin) return;

    const modeObj = mode === 'hard' ? bin.hardBinPareto : (mode === 'soft' ? bin.softBinPareto : bin.firstFailPareto);
    if (!modeObj) return;

    const item = modeObj.all.find(i => i.key === key);
    if (!item) return;

    const modeName = mode === 'hard' ? 'Hard Bin' : (mode === 'soft' ? 'Soft Bin' : 'First Fail Parameter');
    const records = [];
    if (item.oldRaw) records.push({ Dataset: 'OLD Stage', ...item.oldRaw });
    if (item.newRaw) records.push({ Dataset: 'NEW Stage', ...item.newRaw });
    if (records.length === 0) records.push(item);

    const sign = item.deltaCount >= 0 ? '+' : '';
    const pctSign = item.deltaPct >= 0 ? '+' : '';

    window.traceManager.trace(
      `${modeName}: ${item.displayName}`,
      `Pareto item drilldown analysis (${item.isPass ? 'PASS' : 'FAIL'})`,
      `<b>${modeName} Comparative Details:</b><br>` +
      `• <b>OLD Stage:</b> Count <b>${item.oldCount}</b> (${item.oldPct.toFixed(2)}%) — Cumulative: <b>${item.cumOldPct.toFixed(1)}%</b><br>` +
      `• <b>NEW Stage:</b> Count <b>${item.newCount}</b> (${item.newPct.toFixed(2)}%) — Cumulative: <b>${item.cumNewPct.toFixed(1)}%</b><br>` +
      `• <b>Delta:</b> <b>${sign}${item.deltaCount} dice</b> (${pctSign}${item.deltaPct.toFixed(2)}%)<br>` +
      `• <b>Type:</b> ${item.isPass ? '<span class="text-green font-bold">PASS BIN</span>' : '<span class="text-red font-bold">FAILURE FALLOUT</span>'}`,
      records,
      null,
      bin.meta.rawName
    );
  }

  /**
   * Update TSR Tab (Test Summary Report)
   */
  updateTsrUi() {
    const tsr = this.state.tsrAnalysis;
    const raw = this.state.tsrFile?.rows || [];
    if (!tsr) return;

    // Dedicated TSR Source File Info Bar
    const tsrFileName = document.getElementById('tsrLoadedFileName');
    const tsrFileBadge = document.getElementById('tsrLoadedFileBadge');
    const tsrTimestamp = document.getElementById('tsrLoadedTimestamp');
    const tsrFileSize = document.getElementById('tsrLoadedFileSize');
    if (tsrFileName) tsrFileName.textContent = this.state.tsrFile?.filename || 'tsr.csv';
    if (tsrFileBadge) tsrFileBadge.textContent = `${tsr.totalParameters} params • ${tsr.totalTestedCount.toLocaleString()} tested dice`;
    if (tsrTimestamp) tsrTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    if (tsrFileSize) tsrFileSize.textContent = this.formatFileSize(this.state.tsrFile?.fileSize);

    // 5 Actionable Semiconductor TSR KPIs (Replacing meaningless Average Cpk & Calculated Yield)
    this.setKpi('kTsrTotalTested', `${tsr.totalTestedCount.toLocaleString()} dice`, () => {
      window.traceManager.trace('TSR Total Tested Dice', 'Total tested device count from summary report', `<b>Formula:</b> Tested Dice = <b>${tsr.totalTestedCount}</b>`, raw, null, tsr.meta.rawName);
    });

    this.setKpi('kTsrTotalFail', `${tsr.totalFailCount} (${tsr.overallLossPct.toFixed(2)}%)`, () => {
      const f = raw.filter(r => (parseInt(r.Fail_Count) || 0) > 0);
      window.traceManager.trace('TSR Total Failure Loss', 'Cumulative fail count across all parameters', `<b>Formula:</b> Total Fails (${tsr.totalFailCount}) / Tested (${tsr.totalTestedCount}) = <b>${tsr.overallLossPct.toFixed(2)}% loss</b>`, f, null, tsr.meta.rawName);
    });

    const topLossText = tsr.topLossDriver ? tsr.topLossDriver.testName : 'None';
    const topLossSub = tsr.topLossDriver ? `${tsr.topLossDriver.failCount} fails (${tsr.topLossDriver.lossPct.toFixed(2)}% loss)` : 'Zero test failures';
    this.setKpi('kTsrTopLoss', topLossText, () => {
      if (tsr.topLossDriver) {
        window.traceManager.trace(`Top Failure Loss Driver: ${tsr.topLossDriver.testName}`, `Rank #1 test loss contributor`, `<b>Loss Impact:</b> ${tsr.topLossDriver.failCount} dice failed (${tsr.topLossDriver.lossPct.toFixed(2)}% parameter loss)`, [tsr.topLossDriver.rawRecord], null, tsr.meta.rawName);
      }
    });
    const topLossSubEl = document.getElementById('kTsrTopLossSub');
    if (topLossSubEl) topLossSubEl.textContent = topLossSub;

    const worstCpkVal = tsr.worstCpkItem ? `${tsr.worstCpkItem.cpkn.toFixed(2)}` : 'N/A';
    const worstCpkSub = tsr.worstCpkItem ? `${tsr.worstCpkItem.testName}` : 'No parameters';
    this.setKpi('kTsrWorstCpk', worstCpkVal, () => {
      if (tsr.worstCpkItem) {
        window.traceManager.trace(`Bottleneck / Worst CPK: ${tsr.worstCpkItem.testName}`, `Weakest process capability parameter`, `<b>Process Bottleneck:</b> Parameter <b>${tsr.worstCpkItem.testName}</b> has CPK = <b>${tsr.worstCpkItem.cpkn.toFixed(3)}</b> (Cpknl: ${tsr.worstCpkItem.rawRecord.Cpknl}, Cpknh: ${tsr.worstCpkItem.rawRecord.Cpknh})<br>Limits: [${tsr.worstCpkItem.loLimit}, ${tsr.worstCpkItem.hiLimit}] ${tsr.worstCpkItem.units}`, [tsr.worstCpkItem.rawRecord], null, tsr.meta.rawName);
      }
    });
    const worstCpkSubEl = document.getElementById('kTsrWorstCpkSub');
    if (worstCpkSubEl) worstCpkSubEl.textContent = worstCpkSub;

    this.setKpi('kTsrCpkRisk', `${tsr.cpkRiskCount} (${tsr.cpkRiskPct.toFixed(1)}%)`, () => {
      const f = raw.filter(r => {
        const cpk = parseFloat(r.Cpkn) || 0;
        return cpk < 1.67;
      });
      window.traceManager.trace('CPK < 1.67 Risk Parameters', 'Critical (<0.5) and Marginal (0.5~1.67) test items requiring engineering attention', `<b>Risk Count:</b> ${tsr.cpkRiskCount} out of ${tsr.totalParameters} parameters (<b>${tsr.cpkRiskPct.toFixed(1)}%</b>) have CPK < 1.67.`, f, null, tsr.meta.rawName);
    });

    // Populate TSR Filter Dropdowns
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cpkSelect = document.getElementById('tsrTableCpkFilter');
    if (cpkSelect && tsr.allCpkGroupsTable) {
      const cur = this.state.tsrTableFilter.cpkGroup || 'ALL';
      cpkSelect.innerHTML = `<option value="ALL">All CPK Groups (${tsr.paramItems.length})</option>` +
        tsr.allCpkGroupsTable.map(g => `<option value="${safeEsc(g.key)}" ${cur === g.key ? 'selected' : ''}>${safeEsc(g.name)} (${g.count})</option>`).join('');
    }

    const distSelect = document.getElementById('tsrTableDistFilter');
    if (distSelect && tsr.allDistShapesTable) {
      const cur = this.state.tsrTableFilter.distribution || 'ALL';
      distSelect.innerHTML = `<option value="ALL">All Distributions (${tsr.paramItems.length})</option>` +
        tsr.allDistShapesTable.map(d => `<option value="${safeEsc(d.name)}" ${cur === d.name ? 'selected' : ''}>${safeEsc(d.name)} (${d.count})</option>`).join('');
    }

    // Update TSR Test Ignore input & badge
    const tsrInput = document.getElementById('tsrTestIgnoreInput');
    if (tsrInput && tsrInput.value !== this.state.testIgnoreInput) {
      tsrInput.value = this.state.testIgnoreInput;
    }
    const tsrBadge = document.getElementById('tsrIgnoreStatusBadge');
    const tsrCountText = document.getElementById('tsrIgnoreCountText');
    if (tsrBadge && tsrCountText) {
      if (tsr.ignoredCount > 0) {
        tsrCountText.textContent = `${tsr.ignoredCount}`;
        tsrBadge.classList.remove('hidden');
      } else {
        tsrBadge.classList.add('hidden');
      }
    }

    // Render TSR Summary Data Table with current Sort & Filter
    this.renderTsrSummaryTable();

    // Update Card Subtitle Badges
    const cpkBadgeEl = document.getElementById('tsrCpkGroupCountBadge');
    if (cpkBadgeEl && tsr.allCpkGroupsTable) {
      cpkBadgeEl.textContent = `${tsr.allCpkGroupsTable.length} Groups`;
    }
    const distBadgeEl = document.getElementById('tsrDistShapeCountBadge');
    if (distBadgeEl && tsr.allDistShapesTable) {
      distBadgeEl.textContent = `${tsr.allDistShapesTable.length} Shapes`;
    }

    // Render CPK Capability Groups Matrix Table
    this.renderTsrCpkTable();

    // Render TSR Charts (Pareto filtered by active CPK group and top10 setting, Distribution Shapes bar)
    this.renderFilteredTsrPareto();
    this.chartsManager.renderTsrDistBar('chartTsrDistBar', tsr.allDistShapesTable, raw, tsr.meta);
  }

  /**
   * Render CPK Capability Groups Table
   */
  renderTsrCpkTable() {
    const tsr = this.state.tsrAnalysis;
    if (!tsr || !tsr.allCpkGroupsTable) return;

    const tbody = document.getElementById('tsrCpkMatrixTbody');
    if (!tbody) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const activeGroup = this.state.tsrFilter.cpkGroup;

    // Update CPK Badge in Header
    const badgeEl = document.getElementById('tsrCpkFilterBadge');
    const badgeTextEl = document.getElementById('tsrCpkFilterBadgeText');
    if (badgeEl && badgeTextEl) {
      if (activeGroup && activeGroup !== 'ALL') {
        badgeTextEl.textContent = activeGroup;
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    tbody.innerHTML = tsr.allCpkGroupsTable.map(g => {
      const isSelected = activeGroup === g.key;
      const rowStyle = isSelected
        ? 'background: rgba(0, 229, 255, 0.16); border-left: 3px solid var(--cyan);'
        : '';
      const filterBtnClass = isSelected
        ? 'btn btn-primary text-[10px] py-0.5 px-1.5 leading-tight'
        : 'btn btn-secondary text-[10px] py-0.5 px-1.5 leading-tight opacity-80 hover:opacity-100';
      const filterBtnLabel = isSelected ? '✓ Active' : 'Filter';

      let riskBadge = '<span class="status-pill pill-green text-[10px] font-bold">OPTIMAL</span>';
      if (g.key.includes('< 0.5') || g.key.includes('<0.5')) {
        riskBadge = '<span class="status-pill pill-red text-[10px] font-bold">CRITICAL</span>';
      } else if (g.key.includes('0.5') && g.key.includes('1.67')) {
        riskBadge = '<span class="status-pill pill-yellow text-[10px] font-bold">MARGINAL</span>';
      } else if (g.key.includes('1.67') && g.key.includes('4')) {
        riskBadge = '<span class="status-pill pill-cyan text-[10px] font-bold">CAPABLE</span>';
      }

      return `
        <tr class="clickable-row hover:bg-white/10 transition-colors" style="cursor: pointer; ${rowStyle}" onclick="window.app.toggleCpkGroupSelection('${safeEsc(g.key)}')" title="Click to filter by ${safeEsc(g.name)} • Click row to trace">
          <td class="py-2 px-2.5">
            <span class="status-pill pill-${g.color} font-bold" style="font-size: 0.73rem; padding: 0.15rem 0.45rem;">${safeEsc(g.name)}</span>
          </td>
          <td class="py-2 px-1 text-center font-mono font-bold text-white text-xs">${g.count}</td>
          <td class="py-2 px-1 text-right font-mono text-xs opacity-90">${safeEsc(g.percentage)}</td>
          <td class="py-2 px-1 text-center">${riskBadge}</td>
          <td class="py-2 px-2 text-right">
            <button class="${filterBtnClass}" onclick="event.stopPropagation(); window.app.toggleCpkGroupSelection('${safeEsc(g.key)}')">
              ${filterBtnLabel}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * TSR Summary Table: Column Sorting & Multi-Criteria Filtering
   */
  renderTsrThead() {
    const thead = document.getElementById('tsrMatrixThead');
    if (!thead) return;

    const curCol = this.state.tsrTableFilter.sortColumn;
    const curDir = this.state.tsrTableFilter.sortDirection;

    thead.innerHTML = `
      <tr>
        ${this.tsrTableColumns.map(col => {
          const isActive = col.key === curCol;
          const sortIcon = isActive ? (curDir === 'asc' ? '▲' : '▼') : '⇅';
          const activeClass = isActive ? 'sort-active' : '';
          const style = col.width ? `style="width: ${col.width}; min-width: ${col.width};"` : '';
          return `
            <th class="sortable ${activeClass}" ${style} data-col-key="${col.key}" onclick="window.app.sortTsrTable('${col.key}')" title="Click to sort by ${col.label} • Drag right border to resize width">
              <div class="th-content flex items-center justify-between">
                <span>${col.label}</span>
                <span class="sort-icon">${sortIcon}</span>
              </div>
              <div class="col-resize-handle" onmousedown="window.app.startColResize(event, this, '${col.key}', 'tsr')" onclick="event.stopPropagation()" ondblclick="window.app.autoFitCol(event, '${col.key}', 'tsr')" title="Drag to adjust width (雙擊最適寬度)"></div>
            </th>`;
        }).join('')}
      </tr>
    `;
  }

  sortTsrTable(colKey) {
    if (this.state.tsrTableFilter.sortColumn === colKey) {
      this.state.tsrTableFilter.sortDirection = this.state.tsrTableFilter.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.tsrTableFilter.sortColumn = colKey;
      // Default to desc for failCount and lossPct, asc for others
      this.state.tsrTableFilter.sortDirection = (colKey === 'failCount' || colKey === 'lossPct') ? 'desc' : 'asc';
    }
    this.renderTsrSummaryTable();
  }

  onTsrTableFilterChange() {
    const searchEl = document.getElementById('tsrTableSearch');
    const cpkEl = document.getElementById('tsrTableCpkFilter');
    const distEl = document.getElementById('tsrTableDistFilter');

    this.state.tsrTableFilter.searchQuery = (searchEl && searchEl.value) ? searchEl.value.trim().toLowerCase() : '';
    this.state.tsrTableFilter.cpkGroup = cpkEl ? cpkEl.value : 'ALL';
    this.state.tsrTableFilter.distribution = distEl ? distEl.value : 'ALL';

    this.renderTsrSummaryTable();
  }

  setTsrTablePreset(preset) {
    this.state.tsrTableFilter.preset = preset;

    // Update preset button styles
    const btnAll = document.getElementById('btnTsrPresetAll');
    const btnFail = document.getElementById('btnTsrPresetFail');
    const btnRisk = document.getElementById('btnTsrPresetRisk');

    if (btnAll) btnAll.className = preset === 'ALL' ? 'btn btn-primary text-xs py-1 px-2.5' : 'btn btn-secondary text-xs py-1 px-2.5';
    if (btnFail) btnFail.className = preset === 'FAIL_ONLY' ? 'btn btn-primary text-xs py-1 px-2.5' : 'btn btn-secondary text-xs py-1 px-2.5';
    if (btnRisk) btnRisk.className = preset === 'CPK_RISK' ? 'btn btn-primary text-xs py-1 px-2.5' : 'btn btn-secondary text-xs py-1 px-2.5';

    this.renderTsrSummaryTable();
  }

  resetTsrTableFilters() {
    this.state.tsrTableFilter.searchQuery = '';
    this.state.tsrTableFilter.cpkGroup = 'ALL';
    this.state.tsrTableFilter.distribution = 'ALL';
    this.state.tsrTableFilter.preset = 'ALL';
    this.state.tsrTableFilter.sortColumn = 'testNum';
    this.state.tsrTableFilter.sortDirection = 'asc';

    const searchEl = document.getElementById('tsrTableSearch');
    const cpkEl = document.getElementById('tsrTableCpkFilter');
    const distEl = document.getElementById('tsrTableDistFilter');
    if (searchEl) searchEl.value = '';
    if (cpkEl) cpkEl.value = 'ALL';
    if (distEl) distEl.value = 'ALL';

    this.setTsrTablePreset('ALL');
  }

  renderTsrSummaryTable() {
    const tsr = this.state.tsrAnalysis;
    if (!tsr || !tsr.paramItems) return;

    this.renderTsrThead();

    const tbody = document.getElementById('tsrSummaryTbody');
    const countEl = document.getElementById('tsrTableRecordCount');
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const { sortColumn, sortDirection, searchQuery, cpkGroup, distribution, preset } = this.state.tsrTableFilter;

    // Filter items
    let filtered = tsr.paramItems.filter(p => {
      // 1. Search Query Filter
      if (searchQuery) {
        const text = `${p.testNum} ${p.testName} ${p.loLimit} ${p.hiLimit} ${p.units} ${p.cpknGroup} ${p.distribution}`.toLowerCase();
        if (!text.includes(searchQuery)) return false;
      }

      // 2. CPK Group Filter
      if (cpkGroup && cpkGroup !== 'ALL') {
        const pGrp = (p.cpknGroup || '').trim();
        if (pGrp !== cpkGroup && pGrp.toLowerCase().replace(/\s+/g, '') !== cpkGroup.toLowerCase().replace(/\s+/g, '')) {
          return false;
        }
      }

      // 3. Distribution Shape Filter
      if (distribution && distribution !== 'ALL') {
        const pDist = (p.distribution || '').trim();
        if (pDist !== distribution && !pDist.toLowerCase().includes(distribution.toLowerCase())) {
          return false;
        }
      }

      // 4. Quick Preset Filter
      if (preset === 'FAIL_ONLY' && p.failCount <= 0) return false;
      if (preset === 'CPK_RISK' && p.cpkn >= 1.67) return false;

      return true;
    });

    // Sort items
    const colDef = this.tsrTableColumns.find(c => c.key === sortColumn) || { numeric: false };
    filtered.sort((a, b) => {
      let va = a[sortColumn];
      let vb = b[sortColumn];

      if (sortColumn === 'testNum') {
        va = parseFloat(a.testNum) || 0;
        vb = parseFloat(b.testNum) || 0;
      } else if (sortColumn === 'loLimit') {
        va = parseFloat(a.loLimit) || 0;
        vb = parseFloat(b.loLimit) || 0;
      }

      if (colDef.numeric) {
        va = parseFloat(va) || 0;
        vb = parseFloat(vb) || 0;
        return sortDirection === 'asc' ? va - vb : vb - va;
      } else {
        const sa = String(va || '').toLowerCase();
        const sb = String(vb || '').toLowerCase();
        return sortDirection === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
    });

    // Update count badge
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${tsr.paramItems.length} items`;
    }

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" class="text-center py-8 opacity-75 font-mono">No matching parameters found. Try adjusting or resetting filters.</td></tr>`;
      return;
    }

    const tableEl = document.getElementById('tsrMatrixTable');
    if (tableEl) {
      if (this.state.tsrTableWrapMode) {
        tableEl.classList.add('wrap-mode');
      } else {
        tableEl.classList.remove('wrap-mode');
      }
      if (this.state.tsrAutoFit) {
        tableEl.classList.add('autofit-mode');
      } else {
        tableEl.classList.remove('autofit-mode');
      }
    }

    const nameWidth = this.state.tsrNameWidth || 320;
    const limitWidth = this.state.tsrLimitWidth || 150;

    tbody.innerHTML = filtered.map(p => {
      const cpkPill = tsr.allCpkGroupsTable?.find(g => g.key === p.cpknGroup) || { color: p.cpkn < 1.67 ? 'yellow' : 'green' };
      const distPill = tsr.allDistShapesTable?.find(d => d.key === p.distribution) || { color: p.distribution === 'Normal' ? 'green' : 'purple' };

      return `
        <tr class="clickable-row hover:bg-white/5" onclick="window.app.traceTsrRow('${safeEsc(p.testName)}')">
          <td class="font-mono text-cyan">${safeEsc(p.testNum)}</td>
          <td class="font-medium cell-test-col" style="width: ${nameWidth}px; max-width: ${nameWidth}px;" title="${safeEsc(p.testName)}">
            <span class="cell-test-name">${safeEsc(p.testName)}</span>
          </td>
          <td class="font-mono text-xs opacity-80 cell-limit-col" style="width: ${limitWidth}px; max-width: ${limitWidth}px;" title="[${safeEsc(p.loLimit)}, ${safeEsc(p.hiLimit)}] ${safeEsc(p.units)}">
            <span class="cell-limit-name">[${safeEsc(p.loLimit)}, ${safeEsc(p.hiLimit)}] ${safeEsc(p.units)}</span>
          </td>
          <td class="font-mono text-right">${p.mean.toFixed(2)}</td>
          <td class="font-mono text-right">${p.median.toFixed(2)}</td>
          <td class="font-mono text-right">${p.stdDev.toFixed(4)}</td>
          <td class="font-mono text-center font-bold ${p.failCount > 0 ? 'text-red' : ''}">${p.failCount}</td>
          <td class="font-mono text-right font-bold ${p.lossPct > 0 ? 'text-red' : 'text-green'}">${p.lossPct.toFixed(2)}%</td>
          <td class="font-mono text-right font-bold ${p.cpkn < 1.67 ? 'text-amber-500' : 'text-green'}">${p.cpkn.toFixed(2)}</td>
          <td><span class="status-pill pill-${cpkPill.color}" title="${safeEsc(p.cpknGroup)}">${safeEsc(p.cpknGroup)}</span></td>
          <td><span class="status-pill pill-${distPill.color}" title="${safeEsc(p.distribution)}">${safeEsc(p.distribution)}</span></td>
          <td class="font-mono text-xs text-right opacity-80 whitespace-nowrap">${p.skewness.toFixed(2)} / ${p.kurtosis.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Column Width Controls & Interactive Resizing
   */
  setTsrNameWidth(width) {
    const w = parseInt(width) || 320;
    this.state.tsrNameWidth = w;
    const label = document.getElementById('tsrNameWidthVal');
    if (label) label.textContent = `${w}px`;

    const colDef = this.tsrTableColumns.find(c => c.key === 'testName');
    if (colDef) colDef.width = `${w}px`;

    const th = document.querySelector('#tsrMatrixTable th[data-col-key="testName"]');
    if (th) {
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
    }
    document.querySelectorAll('#tsrMatrixTable td.cell-test-col').forEach(td => {
      td.style.width = `${w}px`;
      td.style.maxWidth = `${w}px`;
    });
  }

  setTsrLimitWidth(width) {
    const w = parseInt(width) || 150;
    this.state.tsrLimitWidth = w;
    const label = document.getElementById('tsrLimitWidthVal');
    if (label) label.textContent = `${w}px`;

    const colDef = this.tsrTableColumns.find(c => c.key === 'loLimit');
    if (colDef) colDef.width = `${w}px`;

    const th = document.querySelector('#tsrMatrixTable th[data-col-key="loLimit"]');
    if (th) {
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
    }
    document.querySelectorAll('#tsrMatrixTable td.cell-limit-col').forEach(td => {
      td.style.width = `${w}px`;
      td.style.maxWidth = `${w}px`;
    });
  }

  toggleTsrAutoFit() {
    try {
      this.state.tsrAutoFit = !this.state.tsrAutoFit;
      const table = document.getElementById('tsrMatrixTable');
      const btn = document.getElementById('btnTsrAutoFit');
      const btnText = document.getElementById('btnTsrAutoFitText');
      if (btnText) btnText.textContent = this.state.tsrAutoFit ? 'Auto-Fit (On)' : 'Auto-Fit';
      if (btn) btn.className = this.state.tsrAutoFit ? 'btn btn-primary text-xs py-1 px-2 flex items-center gap-1' : 'btn btn-secondary text-xs py-1 px-2 flex items-center gap-1';

      if (table) {
        if (this.state.tsrAutoFit) {
          table.classList.add('autofit-mode');
        } else {
          table.classList.remove('autofit-mode');
        }
      }
    } catch (err) {
      console.error('Error toggling TSR auto-fit:', err);
    }
  }

  setBinNameWidth(width) {
    const w = parseInt(width) || 280;
    this.state.binNameWidth = w;
    const label = document.getElementById('binNameWidthVal');
    if (label) label.textContent = `${w}px`;

    const th = document.getElementById('thBinParetoName');
    if (th) {
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
    }
    document.querySelectorAll('#binParetoTbody td.cell-test-col').forEach(td => {
      td.style.width = `${w}px`;
      td.style.maxWidth = `${w}px`;
    });
  }

  toggleBinAutoFit() {
    try {
      this.state.binAutoFit = !this.state.binAutoFit;
      const table = document.querySelector('#tab-bin .data-table');
      const btn = document.getElementById('btnBinAutoFit');
      const btnText = document.getElementById('btnBinAutoFitText');
      if (btnText) btnText.textContent = this.state.binAutoFit ? 'Auto-Fit (On)' : 'Auto-Fit';
      if (btn) btn.className = this.state.binAutoFit ? 'btn btn-primary text-xs py-1 px-2 flex items-center gap-1' : 'btn btn-secondary text-xs py-1 px-2 flex items-center gap-1';

      if (table) {
        if (this.state.binAutoFit) {
          table.classList.add('autofit-mode');
        } else {
          table.classList.remove('autofit-mode');
        }
      }
    } catch (err) {
      console.error('Error toggling Bin auto-fit:', err);
    }
  }

  /**
   * Generic Column Drag Resizing Handler
   */
  startColResize(e, handleEl, colKey, tableType = 'tsr') {
    e.preventDefault();
    e.stopPropagation();

    const th = handleEl.parentElement;
    const startX = e.pageX;
    const startWidth = th.offsetWidth;
    handleEl.classList.add('resizing');
    document.body.classList.add('col-resizing');

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.pageX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
      th.style.maxWidth = `${newWidth}px`;

      if (tableType === 'tsr') {
        const colDef = this.tsrTableColumns.find(c => c.key === colKey);
        if (colDef) colDef.width = `${newWidth}px`;
        if (colKey === 'testName') {
          this.state.tsrNameWidth = newWidth;
          const s = document.getElementById('tsrNameWidthSlider');
          const v = document.getElementById('tsrNameWidthVal');
          if (s) s.value = newWidth;
          if (v) v.textContent = `${newWidth}px`;
          document.querySelectorAll('#tsrMatrixTable td.cell-test-col').forEach(td => {
            td.style.width = `${newWidth}px`;
            td.style.maxWidth = `${newWidth}px`;
          });
        } else if (colKey === 'loLimit') {
          this.state.tsrLimitWidth = newWidth;
          const s = document.getElementById('tsrLimitWidthSlider');
          const v = document.getElementById('tsrLimitWidthVal');
          if (s) s.value = newWidth;
          if (v) v.textContent = `${newWidth}px`;
          document.querySelectorAll('#tsrMatrixTable td.cell-limit-col').forEach(td => {
            td.style.width = `${newWidth}px`;
            td.style.maxWidth = `${newWidth}px`;
          });
        }
      }
    };

    const onMouseUp = () => {
      handleEl.classList.remove('resizing');
      document.body.classList.remove('col-resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  autoFitCol(e, colKey, tableType = 'tsr') {
    e.preventDefault();
    e.stopPropagation();
    if (tableType === 'tsr') {
      if (colKey === 'testName') this.setTsrNameWidth(550);
      else if (colKey === 'loLimit') this.setTsrLimitWidth(240);
    }
  }

  toggleTsrWrapMode() {
    this.state.tsrTableWrapMode = !this.state.tsrTableWrapMode;
    const btnText = document.getElementById('btnTsrWrapText');
    const btn = document.getElementById('btnTsrWrapToggle');
    const table = document.getElementById('tsrMatrixTable');
    if (btnText) btnText.textContent = this.state.tsrTableWrapMode ? 'Compact Names' : 'Wrap Names';
    if (btn) btn.className = this.state.tsrTableWrapMode ? 'btn btn-primary text-xs py-1 px-2 flex items-center gap-1' : 'btn btn-secondary text-xs py-1 px-2 flex items-center gap-1';
    if (table) {
      if (this.state.tsrTableWrapMode) {
        table.classList.add('wrap-mode');
      } else {
        table.classList.remove('wrap-mode');
      }
    }
  }

  setTsrCpkGroupFilter(groupKey) {
    if (this.state.tsrFilter.cpkGroup === groupKey) {
      this.state.tsrFilter.cpkGroup = 'ALL';
      this.state.tsrTableFilter.cpkGroup = 'ALL';
    } else {
      this.state.tsrFilter.cpkGroup = groupKey;
      this.state.tsrTableFilter.cpkGroup = groupKey;
    }

    const cpkSelect = document.getElementById('tsrTableCpkFilter');
    if (cpkSelect) cpkSelect.value = this.state.tsrTableFilter.cpkGroup;

    this.renderTsrCpkTable();
    this.renderFilteredTsrPareto();
    this.renderTsrSummaryTable();
  }

  toggleCpkGroupSelection(groupKey) {
    this.setTsrCpkGroupFilter(groupKey);
    if (this.state.tsrFilter.cpkGroup !== 'ALL') {
      this.traceTsrCpkGroup(groupKey, false);
    }
  }

  resetTsrFilter() {
    this.state.tsrFilter.cpkGroup = 'ALL';
    this.state.tsrTableFilter.cpkGroup = 'ALL';
    const cpkSelect = document.getElementById('tsrTableCpkFilter');
    if (cpkSelect) cpkSelect.value = 'ALL';

    this.renderTsrCpkTable();
    this.renderFilteredTsrPareto();
    this.renderTsrSummaryTable();
  }

  toggleTsrTop10() {
    this.state.tsrFilter.top10Only = !this.state.tsrFilter.top10Only;
    this.renderFilteredTsrPareto();
  }

  renderFilteredTsrPareto() {
    const tsr = this.state.tsrAnalysis;
    if (!tsr) return;

    let items = [...tsr.paramItems];
    const groupKey = this.state.tsrFilter.cpkGroup;

    if (groupKey && groupKey !== 'ALL') {
      const normKey = groupKey.toLowerCase().replace(/\s+/g, '');
      items = items.filter(p => {
        const g = (p.rawRecord?.Cpkn_Group || p.cpknGroup || '').trim();
        const normG = g.toLowerCase().replace(/\s+/g, '');
        if (g === groupKey || normG === normKey) return true;
        const cpkn = p.cpkn;
        if (groupKey.includes('0.5') && !groupKey.includes('1.67')) return cpkn < 0.5 || g.includes('<0.5') || g.includes('< 0.5');
        if (groupKey.includes('1.67') && groupKey.includes('0.5')) return g.includes('0.5') || (cpkn >= 0.5 && cpkn < 1.67);
        if (groupKey.includes('1.67') && groupKey.includes('4')) return g.includes('1.67') || (cpkn >= 1.67 && cpkn < 4);
        if (groupKey.includes('> 4') || groupKey.includes('>4')) return cpkn >= 4 || g.includes('>4') || g.includes('> 4');
        return false;
      });
    }

    // Sort by fail count descending
    items.sort((a, b) => b.failCount - a.failCount);

    // Compute cumulative loss % for this subset
    const subsetTotalFails = items.reduce((acc, p) => acc + p.failCount, 0);
    let runningFails = 0;
    const computedItems = items.map(p => {
      runningFails += p.failCount;
      const cumLoss = subsetTotalFails > 0 ? (runningFails / subsetTotalFails) * 100 : (tsr.totalFailCount > 0 ? (runningFails / tsr.totalFailCount) * 100 : 0);
      return {
        ...p,
        cumLossPct: cumLoss
      };
    });

    const displayItems = this.state.tsrFilter.top10Only ? computedItems.slice(0, 10) : computedItems;

    // Update Filter Badge UI
    const badgeEl = document.getElementById('tsrParetoFilterBadge');
    const badgeTextEl = document.getElementById('tsrParetoFilterText');
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (badgeEl && badgeTextEl) {
      if (groupKey && groupKey !== 'ALL') {
        const shortName = groupKey.split('(')[0].trim() || groupKey;
        badgeTextEl.textContent = `${shortName} (${computedItems.length})`;
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    // Update Top 10 Toggle Button UI
    const top10Btn = document.getElementById('btnTsrTop10');
    const top10BtnText = document.getElementById('btnTsrTop10Text');
    if (top10Btn && top10BtnText) {
      if (this.state.tsrFilter.top10Only) {
        top10Btn.className = 'btn btn-primary text-xs py-1 px-2.5 flex items-center gap-1';
        top10BtnText.textContent = 'Top 10 (On)';
      } else {
        top10Btn.className = 'btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1';
        top10BtnText.textContent = 'Top 10';
      }
    }

    // Render Pareto chart
    this.chartsManager.renderTsrPareto('chartTsrPareto', displayItems, this.state.tsrFile?.rows || [], tsr.meta);
  }

  traceTsrCpkGroup(groupKey, autoFilter = true) {
    const raw = this.state.tsrFile?.rows || [];
    const tsr = this.state.tsrAnalysis;
    if (!tsr) return;

    // Filter left Pareto chart to this group if requested
    if (autoFilter) {
      this.setTsrCpkGroupFilter(groupKey);
    }

    const normKey = groupKey.toLowerCase().replace(/\s+/g, '');
    const filtered = raw.filter(r => {
      const g = (r.Cpkn_Group || '').trim();
      const normG = g.toLowerCase().replace(/\s+/g, '');
      if (g === groupKey || normG === normKey) return true;
      const cpkn = parseFloat(r.Cpkn) || 0;
      if (groupKey.includes('0.5') && !groupKey.includes('1.67')) return cpkn < 0.5 || g.includes('<0.5') || g.includes('< 0.5');
      if (groupKey.includes('1.67') && groupKey.includes('0.5')) return g.includes('0.5') || (cpkn >= 0.5 && cpkn < 1.67);
      if (groupKey.includes('1.67') && groupKey.includes('4')) return g.includes('1.67') || (cpkn >= 1.67 && cpkn < 4);
      if (groupKey.includes('> 4') || groupKey.includes('>4')) return cpkn >= 4 || g.includes('>4') || g.includes('> 4');
      return false;
    });

    const grpInfo = tsr.allCpkGroupsTable?.find(g => g.key === groupKey || g.name === groupKey) || { name: groupKey, count: filtered.length, percentage: '' };
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    window.traceManager.trace(
      `CPK Capability Group: ${grpInfo.name} (${grpInfo.criteria || groupKey})`,
      `${grpInfo.count} parameters classified under "${grpInfo.name}" • (Left Pareto updated)`,
      `<b>Capability Criteria:</b> ${safeEsc(grpInfo.criteria || groupKey)} &bull; Count = <b>${grpInfo.count}</b> (${safeEsc(grpInfo.percentage)})<br>` +
      `<b>Assessment:</b> ${safeEsc(grpInfo.assessment || 'Process Capability Review')}<br>` +
      `<i>💡 The Parameter Failure Pareto chart on the left is now filtered to this group. Click the badge in the chart header to reset.</i>`,
      filtered,
      null,
      this.state.tsrFile?.filename
    );
  }

  traceTsrRow(testName) {
    const raw = this.state.tsrFile?.rows || [];
    const item = raw.find(r => r.Test_Name === testName);
    if (!item) return;
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    window.traceManager.trace(
      `TSR Parameter: ${testName}`,
      `Detailed parameter statistics, Cpk and distribution metrics`,
      `<b>Parameter Summary:</b><br>` +
      `• Test Number: <b>${safeEsc(item.Test_Number)}</b> | Stage: <b>${safeEsc(item.STAGE)}</b> | Units: <b>${safeEsc(item.UNITS)}</b><br>` +
      `• Mean: <b>${safeEsc(item.Mean)}</b> | Median(P50): <b>${safeEsc(item['Median(P50)'])}</b> | StdDev: <b>${safeEsc(item.StdDev)}</b><br>` +
      `• Limits: [<b>${safeEsc(item.LO_LIMIT)}</b>, <b>${safeEsc(item.HI_LIMIT)}</b>] | Min: ${safeEsc(item.Min)} | Max: ${safeEsc(item.Max)}<br>` +
      `• CPK: <b>${safeEsc(item.Cpkn)}</b> (Cpknl: ${safeEsc(item.Cpknl)}, Cpknh: ${safeEsc(item.Cpknh)}) &bull; Group: <b>${safeEsc(item.Cpkn_Group)}</b><br>` +
      `• Distribution: <b>${safeEsc(item.Distribution)}</b> (Skewness: ${safeEsc(item.Skewness)}, Kurtosis: ${safeEsc(item.Kurtosis)})<br>` +
      `• Failures: <b>${safeEsc(item.Fail_Count)} dice</b> (Loss: <b>${safeEsc(item['Loss_%'])}</b>)`,
      [item],
      null,
      this.state.tsrFile?.filename
    );
  }

  /**
   * =========================================================================
   * REPEATABILITY ANALYSIS & PER-ECID UI COORDINATOR
   * =========================================================================
   */

  updateRepeatabilityUi() {
    const rep = this.state.repeatabilityAnalysis;
    if (!rep) return;

    // 0. Update Source File Info Bar in Repeatability Tab
    const repFileName = document.getElementById('repLoadedFileName');
    const repFileBadge = document.getElementById('repLoadedFileBadge');
    const repTimestamp = document.getElementById('repLoadedTimestamp');
    const repFileSize = document.getElementById('repLoadedFileSize');
    if (repFileName) {
      repFileName.textContent = this.state.repeatabilityFile?.filename || 'repeatability.csv';
    }
    if (repFileBadge) {
      repFileBadge.textContent = `${rep.totalRecords.toLocaleString()} records • ${rep.totalEcids} ECIDs`;
    }
    if (repTimestamp) {
      repTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
    if (repFileSize) {
      repFileSize.textContent = this.formatFileSize(this.state.repeatabilityFile?.fileSize);
    }

    // Sync Test Ignore UI in Repeatability Tab
    const repInput = document.getElementById('repTestIgnoreInput');
    if (repInput && repInput.value !== this.state.testIgnoreInput) {
      repInput.value = this.state.testIgnoreInput;
    }
    const repIgnBadge = document.getElementById('repIgnoreStatusBadge');
    const repIgnCount = document.getElementById('repIgnoreCountText');
    if (repIgnBadge && repIgnCount) {
      if (rep.ignoredCount > 0) {
        repIgnCount.textContent = rep.ignoredCount;
        repIgnBadge.classList.remove('hidden');
      } else {
        repIgnBadge.classList.add('hidden');
      }
    }

    // 1. Top KPI Metrics
    const elEcids = document.getElementById('kRepTotalEcids');
    const elTests = document.getElementById('kRepTotalTests');
    const elMeasSub = document.getElementById('kRepTotalMeasurementsSub');
    const elAvgCv = document.getElementById('kRepAvgCv');
    const elMaxCvSub = document.getElementById('kRepMaxCvSub');
    const elAvgCp = document.getElementById('kRepAvgCp');
    const elWorstCpSub = document.getElementById('kRepWorstCpSub');
    const elDomTrend = document.getElementById('kRepDominantTrend');
    const elTrendRiskSub = document.getElementById('kRepTrendRiskSub');

    if (elEcids) elEcids.textContent = `${rep.totalEcids}`;
    if (elTests) elTests.textContent = `${rep.totalTests}`;
    if (elMeasSub) elMeasSub.textContent = `${rep.totalRecords.toLocaleString()} measurements`;
    if (elAvgCv) elAvgCv.textContent = `${rep.meanCv.toFixed(2)}%`;
    if (elMaxCvSub) elMaxCvSub.innerHTML = `Max: <b>${rep.maxCv.toFixed(2)}%</b> &bull; CV &ge; 10%: <b class="text-red">${rep.highCvRiskCount}</b>`;
    if (elAvgCp) elAvgCp.textContent = `${rep.meanCp.toFixed(2)}`;
    if (elWorstCpSub) elWorstCpSub.innerHTML = `Worst: <b class="text-amber-400">${rep.minCp.toFixed(2)}</b> &bull; Cp &lt; 4.0: <b class="text-red">${rep.lowCpRiskCount}</b>`;
    if (elDomTrend) elDomTrend.textContent = rep.dominantTrendOverall;

    const driftCount = (rep.trendCounts['Step Shift / Discontinuity'] || 0) + (rep.trendCounts['Thermal / Upward-Downward Drift'] || 0);
    if (elTrendRiskSub) elTrendRiskSub.innerHTML = `Shift / Drift: <b class="${driftCount > 0 ? 'text-amber-400' : 'text-gray-400'}">${driftCount} items</b>`;

    // 2. Render Charts (Active Tab Isolation)
    if (this.state.activeTab === 'repeatability') {
      this.chartsManager.renderRepeatabilityDistChart('chartRepDist', rep.distTable, this.state.repeatabilityFile?.rows || [], rep.meta);
      this.chartsManager.renderRepeatabilityDistRepeatChart('chartRepDistRepeat', rep.distRepeatTable, this.state.repeatabilityFile?.rows || [], rep.meta);
      this.chartsManager.renderRepeatabilityTrendChart('chartRepTrend', rep.trendTable, this.state.repeatabilityFile?.rows || [], rep.meta);
      this.chartsManager.renderRepeatabilityTestCvChart('chartRepTestCv', rep.perTestStats, this.state.repeatabilityFile?.rows || [], rep.meta);
    }

    // 3. Populate Filter Dropdowns
    this.populateRepeatabilityDropdowns();

    // 4. Render Table
    this.renderRepeatabilityTable();
  }

  toggleMultiSelectDropdown(type, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const panel = document.getElementById(`panelRepFilter${cap}`);
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    this.closeAllMultiSelectDropdowns();
    if (isHidden) {
      panel.classList.remove('hidden');
    }
  }

  closeAllMultiSelectDropdowns() {
    document.querySelectorAll('.multiselect-panel').forEach(p => p.classList.add('hidden'));
  }

  selectAllMultiSelect(type) {
    const rep = this.state.repeatabilityAnalysis;
    if (!rep) return;
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const setKey = `selected${cap}s`;
    if (this.state.repeatabilityFilter[setKey]) {
      this.state.repeatabilityFilter[setKey] = new Set(['ALL']);
    }
    this.updateMultiSelectButtonLabel(type);
    const container = document.getElementById(`optsRepFilter${cap}`);
    if (container) {
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
      });
    }
    this.onRepeatabilityFilterChange(false);
  }

  clearAllMultiSelect(type) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const setKey = `selected${cap}s`;
    if (this.state.repeatabilityFilter[setKey]) {
      this.state.repeatabilityFilter[setKey] = new Set(['NONE']);
    }
    this.updateMultiSelectButtonLabel(type);
    const container = document.getElementById(`optsRepFilter${cap}`);
    if (container) {
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
    }
    this.onRepeatabilityFilterChange(false);
  }

  /**
   * Full list of distinct values for a repeatability multi-select filter type,
   * used to materialize the implicit "ALL" state into an explicit set when the
   * user deselects a single option out of ALL (rather than wiping everything).
   */
  getAllFilterValues(type) {
    const rep = this.state.repeatabilityAnalysis;
    if (!rep) return [];
    switch (type) {
      case 'ecid': return Array.from(new Set(rep.perEcidStats.map(e => e.ecid)));
      case 'test': return Array.from(new Set(rep.perTestStats.map(t => t.testName)));
      case 'trend': return rep.trendTable.map(t => t.name);
      case 'dist': return rep.distTable.map(d => d.name);
      case 'distRepeat': return rep.distRepeatTable.map(dr => dr.name);
      default: return [];
    }
  }

  onMultiSelectOptionToggle(type, value, isChecked) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const setKey = `selected${cap}s`;
    let set = this.state.repeatabilityFilter[setKey];
    if (!set) {
      set = new Set(['ALL']);
      this.state.repeatabilityFilter[setKey] = set;
    }

    if (value === 'ALL') {
      set.clear();
      if (isChecked) {
        set.add('ALL');
      } else {
        set.add('NONE');
      }
    } else {
      if (set.has('ALL')) {
        if (isChecked) {
          // Already implicitly selected under ALL; nothing to change.
        } else {
          // Deselecting one option out of the implicit "everything" set: materialize
          // ALL into an explicit set of every other value instead of wiping the lot.
          const allValues = this.getAllFilterValues(type);
          set.clear();
          allValues.forEach(v => set.add(v));
          set.delete(value);
          if (set.size === 0) set.add('NONE');
        }
      } else if (set.has('NONE')) {
        set.clear();
        if (isChecked) {
          set.add(value);
        } else {
          set.add('NONE');
        }
      } else {
        if (isChecked) {
          set.add(value);
        } else {
          set.delete(value);
          if (set.size === 0) {
            set.add('NONE');
          }
        }
      }
    }

    // Synchronize checkboxes in dropdown
    const container = document.getElementById(`optsRepFilter${cap}`);
    if (container) {
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = set.has('ALL') || set.has(cb.value);
      });
    }

    this.updateMultiSelectButtonLabel(type);
    this.onRepeatabilityFilterChange(false);
  }

  filterMultiSelectOptions(type, query) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const container = document.getElementById(`optsRepFilter${cap}`);
    if (!container) return;
    const q = (query || '').toLowerCase().trim();
    const items = container.querySelectorAll('.multiselect-item');
    items.forEach(it => {
      const txt = (it.textContent || '').toLowerCase();
      if (!q || txt.includes(q)) {
        it.style.display = 'flex';
      } else {
        it.style.display = 'none';
      }
    });
  }

  updateMultiSelectButtonLabel(type) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const lbl = document.getElementById(`lblRepFilter${cap}`);
    const btn = document.querySelector(`#repFilter${cap}Container .multiselect-btn`);
    const setKey = `selected${cap}s`;
    const set = this.state.repeatabilityFilter[setKey];
    if (!lbl) return;

    let defaultTitle = `All ${cap}s`;
    if (type === 'dist') defaultTitle = 'All Dist';
    if (type === 'distRepeat') defaultTitle = 'All Dist_Repeat';

    if (!set || set.has('ALL')) {
      lbl.textContent = defaultTitle;
      if (btn) btn.classList.remove('active-filter');
    } else if (set.has('NONE') || set.size === 0) {
      lbl.textContent = `${cap}: (None)`;
      if (btn) btn.classList.add('active-filter');
    } else if (set.size === 1) {
      const first = Array.from(set)[0];
      lbl.textContent = `${first}`;
      if (btn) btn.classList.add('active-filter');
    } else {
      lbl.textContent = `${cap}: (${set.size})`;
      if (btn) btn.classList.add('active-filter');
    }
  }

  updateAllMultiSelectLabelsAndChecks() {
    const types = ['ecid', 'test', 'trend', 'dist', 'distRepeat'];
    types.forEach(t => {
      this.updateMultiSelectButtonLabel(t);
      const cap = t.charAt(0).toUpperCase() + t.slice(1);
      const container = document.getElementById(`optsRepFilter${cap}`);
      const set = this.state.repeatabilityFilter[`selected${cap}s`];
      if (container && set) {
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = set.has('ALL') || set.has(cb.value);
        });
      }
    });
  }

  populateRepeatabilityDropdowns() {
    const rep = this.state.repeatabilityAnalysis;
    if (!rep) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const maxSelectOptions = 400;

    // 1. ECID Multi-Select
    const ecidContainer = document.getElementById('optsRepFilterEcid');
    if (ecidContainer) {
      const ecids = Array.from(new Set(rep.perEcidStats.map(e => e.ecid))).sort();
      const displayEcids = ecids.slice(0, maxSelectOptions);
      const set = this.state.repeatabilityFilter.selectedEcids || new Set(['ALL']);
      let html = displayEcids.map(ecid => {
        const isChecked = set.has('ALL') || set.has(ecid);
        return `
          <label class="multiselect-item">
            <input type="checkbox" value="${safeEsc(ecid)}" ${isChecked ? 'checked' : ''} onchange="window.app.onMultiSelectOptionToggle('ecid', this.value, this.checked)">
            <span class="truncate font-mono text-xs">${safeEsc(ecid)}</span>
          </label>
        `;
      }).join('');
      if (ecids.length > maxSelectOptions) {
        html += `<div class="text-[10px] text-gray-400 p-1 italic">+${ecids.length - maxSelectOptions} more (use Search box)</div>`;
      }
      ecidContainer.innerHTML = html;
      this.updateMultiSelectButtonLabel('ecid');
    }

    // 2. Test Multi-Select
    const testContainer = document.getElementById('optsRepFilterTest');
    if (testContainer) {
      const tests = Array.from(new Set(rep.perTestStats.map(t => t.testName))).sort();
      const displayTests = tests.slice(0, maxSelectOptions);
      const set = this.state.repeatabilityFilter.selectedTests || new Set(['ALL']);
      let html = displayTests.map(tName => {
        const isChecked = set.has('ALL') || set.has(tName);
        return `
          <label class="multiselect-item">
            <input type="checkbox" value="${safeEsc(tName)}" ${isChecked ? 'checked' : ''} onchange="window.app.onMultiSelectOptionToggle('test', this.value, this.checked)">
            <span class="truncate text-xs">${safeEsc(tName)}</span>
          </label>
        `;
      }).join('');
      if (tests.length > maxSelectOptions) {
        html += `<div class="text-[10px] text-gray-400 p-1 italic">+${tests.length - maxSelectOptions} more (use Search box)</div>`;
      }
      testContainer.innerHTML = html;
      this.updateMultiSelectButtonLabel('test');
    }

    // 3. Trend Multi-Select
    const trendContainer = document.getElementById('optsRepFilterTrend');
    if (trendContainer) {
      const set = this.state.repeatabilityFilter.selectedTrends || new Set(['ALL']);
      const html = rep.trendTable.map(t => {
        const isChecked = set.has('ALL') || set.has(t.name);
        return `
          <label class="multiselect-item">
            <input type="checkbox" value="${safeEsc(t.name)}" ${isChecked ? 'checked' : ''} onchange="window.app.onMultiSelectOptionToggle('trend', this.value, this.checked)">
            <span class="truncate text-xs">${safeEsc(t.name)}</span>
            <span class="text-[10px] text-gray-400 ml-auto font-mono">(${t.count})</span>
          </label>
        `;
      }).join('');
      trendContainer.innerHTML = html;
      this.updateMultiSelectButtonLabel('trend');
    }

    // 4. Dist Multi-Select
    const distContainer = document.getElementById('optsRepFilterDist');
    if (distContainer) {
      const set = this.state.repeatabilityFilter.selectedDists || new Set(['ALL']);
      const html = rep.distTable.map(d => {
        const isChecked = set.has('ALL') || set.has(d.name);
        return `
          <label class="multiselect-item">
            <input type="checkbox" value="${safeEsc(d.name)}" ${isChecked ? 'checked' : ''} onchange="window.app.onMultiSelectOptionToggle('dist', this.value, this.checked)">
            <span class="truncate text-xs">${safeEsc(d.name)}</span>
            <span class="text-[10px] text-gray-400 ml-auto font-mono">(${d.count})</span>
          </label>
        `;
      }).join('');
      distContainer.innerHTML = html;
      this.updateMultiSelectButtonLabel('dist');
    }

    // 5. DistRepeat Multi-Select
    const drContainer = document.getElementById('optsRepFilterDistRepeat');
    if (drContainer) {
      const set = this.state.repeatabilityFilter.selectedDistRepeats || new Set(['ALL']);
      const html = rep.distRepeatTable.map(dr => {
        const isChecked = set.has('ALL') || set.has(dr.name);
        return `
          <label class="multiselect-item">
            <input type="checkbox" value="${safeEsc(dr.name)}" ${isChecked ? 'checked' : ''} onchange="window.app.onMultiSelectOptionToggle('distRepeat', this.value, this.checked)">
            <span class="truncate text-xs">${safeEsc(dr.name)}</span>
            <span class="text-[10px] text-gray-400 ml-auto font-mono">(${dr.count})</span>
          </label>
        `;
      }).join('');
      drContainer.innerHTML = html;
      this.updateMultiSelectButtonLabel('distRepeat');
    }
  }

  setRepeatabilityViewMode(mode) {
    this.state.repeatabilityViewMode = mode;

    const btnEcid = document.getElementById('btnRepViewEcid');
    const btnTest = document.getElementById('btnRepViewTest');
    const btnDetail = document.getElementById('btnRepViewDetail');

    if (btnEcid) btnEcid.className = mode === 'per_ecid' ? 'btn btn-primary text-xs py-1 px-3 flex items-center gap-1 font-bold' : 'btn btn-secondary text-xs py-1 px-3 flex items-center gap-1';
    if (btnTest) btnTest.className = mode === 'per_test' ? 'btn btn-primary text-xs py-1 px-3 flex items-center gap-1 font-bold' : 'btn btn-secondary text-xs py-1 px-3 flex items-center gap-1';
    if (btnDetail) btnDetail.className = mode === 'detail' ? 'btn btn-primary text-xs py-1 px-3 flex items-center gap-1 font-bold' : 'btn btn-secondary text-xs py-1 px-3 flex items-center gap-1';

    // Set sensible default sort column on mode change if previous column doesn't match
    if (mode === 'per_ecid' && !['ecid', 'coordDisplay', 'testCount', 'meanCv', 'maxCv', 'meanCp', 'minCp', 'dominantDist', 'dominantDistRepeat', 'dominantTrend', 'riskLevel'].includes(this.state.repeatabilityFilter.sortColumn)) {
      this.state.repeatabilityFilter.sortColumn = 'ecid';
      this.state.repeatabilityFilter.sortDirection = 'asc';
    } else if (mode === 'per_test' && !['testNum', 'testName', 'units', 'ecidCount', 'meanCv', 'maxCv', 'meanCp', 'minCp', 'dominantDist', 'dominantDistRepeat', 'dominantTrend'].includes(this.state.repeatabilityFilter.sortColumn)) {
      this.state.repeatabilityFilter.sortColumn = 'testNum';
      this.state.repeatabilityFilter.sortDirection = 'asc';
    } else if (mode === 'detail' && !['ecid', 'testNum', 'testName', 'mean', 'std', 'cv', 'cp', 'cpkn', 'dist', 'distRepeat', 'trend'].includes(this.state.repeatabilityFilter.sortColumn)) {
      this.state.repeatabilityFilter.sortColumn = 'ecid';
      this.state.repeatabilityFilter.sortDirection = 'asc';
    }

    this.renderRepeatabilityTable();
  }

  setRepeatabilityPreset(preset) {
    this.state.repeatabilityFilter.preset = preset;
    this.state.repDetailLimit = 300;
    this.state.repEcidLimit = 500;

    const btnAll = document.getElementById('btnRepPresetAll');
    const btnCv = document.getElementById('btnRepPresetHighCv');
    const btnCp = document.getElementById('btnRepPresetLowCp');
    const btnDrift = document.getElementById('btnRepPresetDrift');

    if (btnAll) btnAll.className = preset === 'ALL' ? 'btn btn-primary text-xs py-1 px-2 font-bold' : 'btn btn-secondary text-xs py-1 px-2';
    if (btnCv) btnCv.className = preset === 'HIGH_CV' ? 'btn btn-primary text-xs py-1 px-2 font-bold' : 'btn btn-secondary text-xs py-1 px-2';
    if (btnCp) btnCp.className = preset === 'LOW_CP' ? 'btn btn-primary text-xs py-1 px-2 font-bold' : 'btn btn-secondary text-xs py-1 px-2';
    if (btnDrift) btnDrift.className = preset === 'DRIFT_ONLY' ? 'btn btn-primary text-xs py-1 px-2 font-bold' : 'btn btn-secondary text-xs py-1 px-2';

    this.renderRepeatabilityTable();
  }

  onRepeatabilityFilterChange(immediate = false) {
    if (this._repFilterDebounceTimer) {
      clearTimeout(this._repFilterDebounceTimer);
      this._repFilterDebounceTimer = null;
    }

    const apply = () => {
      const searchInput = document.getElementById('repTableSearch');
      this.state.repeatabilityFilter.searchQuery = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
      this.state.repDetailLimit = 300;
      this.state.repEcidLimit = 500;

      this.renderRepeatabilityTable();
    };

    if (immediate) {
      apply();
    } else {
      this._repFilterDebounceTimer = setTimeout(apply, 80);
    }
  }

  onRepeatabilitySort(colKey) {
    if (this.state.repeatabilityFilter.sortColumn === colKey) {
      this.state.repeatabilityFilter.sortDirection = this.state.repeatabilityFilter.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.repeatabilityFilter.sortColumn = colKey;
      this.state.repeatabilityFilter.sortDirection = 'asc';
    }
    this.renderRepeatabilityTable();
  }

  toggleRepeatabilityAutoFit() {
    try {
      this.state.repeatabilityAutoFit = !this.state.repeatabilityAutoFit;
      const btn = document.getElementById('btnRepAutoFit');
      const text = document.getElementById('btnRepAutoFitText');
      const table = document.getElementById('repeatabilityMatrixTable');

      if (btn) {
        btn.className = this.state.repeatabilityAutoFit
          ? 'btn btn-primary text-xs py-1 px-2 flex items-center gap-1 font-bold'
          : 'btn btn-secondary text-xs py-1 px-2 flex items-center gap-1';
      }
      if (text) {
        text.textContent = this.state.repeatabilityAutoFit ? 'Auto-Fit (On)' : 'Auto-Fit';
      }
      if (table) {
        if (this.state.repeatabilityAutoFit) {
          table.classList.add('auto-fit-mode');
          table.classList.add('autofit-mode');
        } else {
          table.classList.remove('auto-fit-mode');
          table.classList.remove('autofit-mode');
        }

        // Fast update of header styles without heavy full DOM recreation
        const ths = table.querySelectorAll('thead th');
        const cols = this.state.repeatabilityViewMode === 'per_ecid'
          ? this.repEcidColumns
          : (this.state.repeatabilityViewMode === 'per_test' ? this.repTestColumns : this.repDetailColumns);
        ths.forEach((th, i) => {
          const col = cols[i];
          if (col) {
            th.style.width = this.state.repeatabilityAutoFit ? 'auto' : (col.width || '');
            th.style.minWidth = this.state.repeatabilityAutoFit ? 'auto' : (col.width || '');
            th.style.maxWidth = this.state.repeatabilityAutoFit ? 'none' : '';
          }
        });
      }
    } catch (err) {
      console.error('Error toggling repeatability auto-fit:', err);
    }
  }

  resetRepeatabilityFilters() {
    this.state.repeatabilityFilter.searchQuery = '';
    this.state.repeatabilityFilter.selectedEcids = new Set(['ALL']);
    this.state.repeatabilityFilter.selectedTests = new Set(['ALL']);
    this.state.repeatabilityFilter.selectedTrends = new Set(['ALL']);
    this.state.repeatabilityFilter.selectedDists = new Set(['ALL']);
    this.state.repeatabilityFilter.selectedDistRepeats = new Set(['ALL']);
    this.state.repeatabilityFilter.preset = 'ALL';
    this.state.repeatabilityFilter.sortDirection = 'asc';
    this.state.repDetailLimit = 300;
    this.state.repEcidLimit = 500;

    const searchInput = document.getElementById('repTableSearch');
    if (searchInput) searchInput.value = '';

    this.updateAllMultiSelectLabelsAndChecks();
    this.setRepeatabilityPreset('ALL');
  }

  /**
   * Format Dist count map into badges covering ALL distribution categories in the cell
   */
  formatDistCell(distCounts, dominant) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!distCounts || Object.keys(distCounts).length === 0) {
      return `<span class="text-gray-400 text-xs">${safeEsc(dominant || 'N/A')}</span>`;
    }
    const entries = Object.entries(distCounts).filter(([k, v]) => v > 0);
    if (entries.length === 0) return `<span class="text-gray-400 text-xs">${safeEsc(dominant || 'N/A')}</span>`;

    entries.sort((a, b) => b[1] - a[1]);

    const pills = entries.map(([name, count]) => {
      const low = name.toLowerCase();
      let pillClass = 'pill-cyan';
      if (low === 'normal' || low.includes('gaussian')) pillClass = 'pill-green';
      else if (low === 'double' || low.includes('bimodal')) pillClass = 'pill-yellow';
      else if (low.includes('flat') || low.includes('uniform')) pillClass = 'pill-cyan';
      else if (low.includes('heavy') || low.includes('tail') || low.includes('skew')) pillClass = 'pill-purple';
      else if (low.includes('outlier') || low.includes('fail')) pillClass = 'pill-red';

      return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${safeEsc(name)}: ${count} items">${safeEsc(name)} (${count})</span>`;
    });

    return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
  }

  /**
   * Format Dist_Repeat count map into badges covering ALL repeat categories in the cell
   */
  formatDistRepeatCell(distRepeatCounts, dominant) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!distRepeatCounts || Object.keys(distRepeatCounts).length === 0) {
      return `<span class="text-gray-400 text-xs">${safeEsc(dominant || 'N/A')}</span>`;
    }
    const entries = Object.entries(distRepeatCounts).filter(([k, v]) => v > 0);
    if (entries.length === 0) return `<span class="text-gray-400 text-xs">${safeEsc(dominant || 'N/A')}</span>`;

    entries.sort((a, b) => b[1] - a[1]);

    const pills = entries.map(([name, count]) => {
      const low = name.toLowerCase();
      let pillClass = 'pill-cyan';
      if (low.includes('stable non-normal') || low.includes('non-normal')) pillClass = 'pill-yellow';
      else if (low.includes('normal')) pillClass = 'pill-green';
      else if (low.includes('unstable') || low.includes('drift')) pillClass = 'pill-red';

      let shortName = name;
      if (name === 'Stable Non-Normal Distribution') shortName = 'Stable Non-Normal';
      else if (name === 'Normal Distribution') shortName = 'Normal';

      return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${safeEsc(name)}: ${count} items">${safeEsc(shortName)} (${count})</span>`;
    });

    return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
  }

  /**
   * Format Trend count map into badges covering ALL trend patterns in the cell
   */
  formatTrendCell(trendCounts, dominant) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!trendCounts || Object.keys(trendCounts).length === 0) {
      return `<span class="status-pill pill-green text-[10px]">${safeEsc(dominant || 'Stable')}</span>`;
    }
    const entries = Object.entries(trendCounts).filter(([k, v]) => v > 0);
    if (entries.length === 0) return `<span class="status-pill pill-green text-[10px]">${safeEsc(dominant || 'Stable')}</span>`;

    entries.sort((a, b) => {
      const getPriority = (k) => {
        if (k.includes('Shift')) return 1;
        if (k.includes('Drift')) return 2;
        if (k.includes('Cyclic')) return 3;
        return 4;
      };
      return getPriority(a[0]) - getPriority(b[0]) || (b[1] - a[1]);
    });

    const pills = entries.map(([name, count]) => {
      let pillClass = 'pill-cyan';
      let shortName = name;
      if (name.includes('Shift')) {
        pillClass = 'pill-red';
        shortName = 'Step Shift';
      } else if (name.includes('Drift')) {
        pillClass = 'pill-yellow';
        shortName = 'Thermal Drift';
      } else if (name.includes('Cyclic')) {
        pillClass = 'pill-purple';
        shortName = 'Cyclic';
      } else if (name.includes('Stable')) {
        pillClass = 'pill-green';
        shortName = 'Stable Noise';
      }

      return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${safeEsc(name)}: ${count} items">${safeEsc(shortName)} (${count})</span>`;
    });

    return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
  }

  /**
   * Single item badge formatters for View 3 (Detail Matrix)
   */
  formatSingleDistBadge(dist) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const low = (dist || '').toLowerCase();
    let pillClass = 'pill-cyan';
    if (low === 'normal' || low.includes('gaussian')) pillClass = 'pill-green';
    else if (low === 'double' || low.includes('bimodal')) pillClass = 'pill-yellow';
    else if (low.includes('flat') || low.includes('uniform')) pillClass = 'pill-cyan';
    else if (low.includes('heavy') || low.includes('tail') || low.includes('skew')) pillClass = 'pill-purple';
    else if (low.includes('outlier') || low.includes('fail')) pillClass = 'pill-red';
    return `<span class="status-pill ${pillClass} text-[10px]">${safeEsc(dist || 'Unknown')}</span>`;
  }

  formatSingleDistRepeatBadge(distRepeat) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const low = (distRepeat || '').toLowerCase();
    let pillClass = 'pill-cyan';
    if (low.includes('stable non-normal') || low.includes('non-normal')) pillClass = 'pill-yellow';
    else if (low.includes('normal')) pillClass = 'pill-green';
    else if (low.includes('unstable') || low.includes('drift')) pillClass = 'pill-red';
    return `<span class="status-pill ${pillClass} text-[10px]">${safeEsc(distRepeat || 'Unknown')}</span>`;
  }

  formatSingleTrendBadge(trend) {
    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const t = trend || 'Stable';
    let pillClass = 'pill-cyan';
    if (t.includes('Shift')) pillClass = 'pill-red';
    else if (t.includes('Drift')) pillClass = 'pill-yellow';
    else if (t.includes('Cyclic')) pillClass = 'pill-purple';
    else if (t.includes('Stable')) pillClass = 'pill-green';
    return `<span class="status-pill ${pillClass} text-[10px]">${safeEsc(t)}</span>`;
  }

  renderRepeatabilityTable() {
    const mode = this.state.repeatabilityViewMode;
    if (mode === 'per_ecid') {
      this.renderRepeatabilityEcidTable();
    } else if (mode === 'per_test') {
      this.renderRepeatabilityTestTable();
    } else {
      this.renderRepeatabilityDetailTable();
    }
  }

  /**
   * Render View 1: Per-ECID Aggregated Table
   */
  renderRepeatabilityEcidTable() {
    const rep = this.state.repeatabilityAnalysis;
    const thead = document.getElementById('repMatrixThead');
    const tbody = document.getElementById('repMatrixTbody');
    const countBadge = document.getElementById('repTableRecordCount');
    if (!rep || !tbody || !thead) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { searchQuery, selectedEcids, selectedTests, selectedTrends, selectedDists, selectedDistRepeats, preset, sortColumn, sortDirection } = this.state.repeatabilityFilter;

    // Filter per-ECID dataset
    let filtered = rep.perEcidStats.filter(e => {
      // 1. ECID Filter (Multi-select)
      if (selectedEcids && selectedEcids.size > 0 && !selectedEcids.has('ALL')) {
        if (selectedEcids.has('NONE') || !selectedEcids.has(e.ecid)) return false;
      }

      // 2. Test Filter (Multi-select)
      if (selectedTests && selectedTests.size > 0 && !selectedTests.has('ALL')) {
        if (selectedTests.has('NONE')) return false;
        if (!e.testSet) return false;
        let hasTest = false;
        if (selectedTests.size < e.testSet.size) {
          for (const t of selectedTests) {
            if (e.testSet.has(t)) { hasTest = true; break; }
          }
        } else {
          for (const t of e.testSet) {
            if (selectedTests.has(t)) { hasTest = true; break; }
          }
        }
        if (!hasTest) return false;
      }

      // 3. Trend Filter (Multi-select)
      if (selectedTrends && selectedTrends.size > 0 && !selectedTrends.has('ALL')) {
        if (selectedTrends.has('NONE')) return false;
        const matchTrend = selectedTrends.has(e.dominantTrend) || (e.trendCounts && Object.keys(e.trendCounts).some(t => selectedTrends.has(t) && e.trendCounts[t] > 0));
        if (!matchTrend) return false;
      }

      // 4. Dist Filter (Multi-select)
      if (selectedDists && selectedDists.size > 0 && !selectedDists.has('ALL')) {
        if (selectedDists.has('NONE')) return false;
        const matchDist = selectedDists.has(e.dominantDist) || (e.distCounts && Object.keys(e.distCounts).some(d => selectedDists.has(d) && e.distCounts[d] > 0));
        if (!matchDist) return false;
      }

      // 5. DistRepeat Filter (Multi-select)
      if (selectedDistRepeats && selectedDistRepeats.size > 0 && !selectedDistRepeats.has('ALL')) {
        if (selectedDistRepeats.has('NONE')) return false;
        const matchDr = selectedDistRepeats.has(e.dominantDistRepeat) || (e.distRepeatCounts && Object.keys(e.distRepeatCounts).some(dr => selectedDistRepeats.has(dr) && e.distRepeatCounts[dr] > 0));
        if (!matchDr) return false;
      }

      // 6. Quick Presets (with absolute value for CV%)
      if (preset === 'HIGH_CV' && Math.abs(e.maxCv) < 5.0 && Math.abs(e.meanCv) < 5.0) return false;
      if (preset === 'LOW_CP' && e.minCp >= 4.0 && e.meanCp >= 4.0) return false;
      if (preset === 'DRIFT_ONLY' && !e.hasDriftOrShift && !e.dominantTrend.includes('Shift') && !e.dominantTrend.includes('Drift')) return false;

      // 7. Search Query
      if (searchQuery) {
        if (e._searchBlob) {
          if (!e._searchBlob.includes(searchQuery)) return false;
        } else {
          const textBlob = `${e.ecid} ${e.coordDisplay} ${e.riskLevel}`.toLowerCase();
          if (!textBlob.includes(searchQuery)) return false;
        }
      }
      return true;
    });

    // Sort dataset
    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} Unique ECIDs (Dice)`;

    // Render Headers
    const cols = this.repEcidColumns;
    thead.innerHTML = `
      <tr>
        ${cols.map(c => {
          const isSorted = sortColumn === c.key;
          const sortIcon = isSorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';
          const alignClass = c.numeric ? 'text-right' : (c.key === 'rank' || c.key === 'testCount' || c.key === 'riskLevel' ? 'text-center' : 'text-left');
          const widthStyle = !this.state.repeatabilityAutoFit && c.width ? `style="width: ${c.width};"` : '';
          return `<th class="sortable-header ${alignClass}" ${widthStyle} onclick="window.app.onRepeatabilitySort('${c.key}')" title="Click to sort by ${c.label}">${safeEsc(c.label)}<span class="text-cyan font-bold">${sortIcon}</span></th>`;
        }).join('')}
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cols.length}" class="text-center py-8 text-gray-400">No ECID records match the current filter criteria.</td></tr>`;
      return;
    }

    const limit = this.state.repEcidLimit || 500;
    const displayList = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    let rowsHtml = displayList.map((e, idx) => {
      const cvColor = Math.abs(e.maxCv) >= 10.0 ? 'text-red font-bold' : (Math.abs(e.maxCv) >= 5.0 ? 'text-amber-400' : 'text-cyan');
      const cpColor = e.minCp < 1.67 ? 'text-red font-bold' : (e.minCp < 4.0 ? 'text-amber-400 font-bold' : 'text-green');

      return `
        <tr class="clickable-row hover:bg-white/5 transition-colors" onclick="window.app.traceRepeatabilityEcid('${safeEsc(e.ecid)}')">
          <td class="text-center font-mono text-gray-400 text-xs">${idx + 1}</td>
          <td class="font-mono font-bold text-cyan text-xs"><b>${safeEsc(e.ecid)}</b></td>
          <td class="font-mono text-gray-300 text-xs">${safeEsc(e.coordDisplay)}</td>
          <td class="text-center font-mono font-bold text-white text-xs">${e.testCount}</td>
          <td class="text-right font-mono text-xs">${e.meanCv.toFixed(2)}%</td>
          <td class="text-right font-mono text-xs ${cvColor}"><b>${e.maxCv.toFixed(2)}%</b></td>
          <td class="text-right font-mono text-xs">${e.meanCp.toFixed(2)}</td>
          <td class="text-right font-mono text-xs ${cpColor}"><b>${e.minCp.toFixed(2)}</b></td>
          <td class="text-xs">${e.distCellHtml || this.formatDistCell(e.distCounts, e.dominantDist)}</td>
          <td class="text-xs">${e.distRepeatCellHtml || this.formatDistRepeatCell(e.distRepeatCounts, e.dominantDistRepeat)}</td>
          <td class="text-xs">${e.trendCellHtml || this.formatTrendCell(e.trendCounts, e.dominantTrend)}</td>
          <td class="text-center"><span class="status-pill pill-${e.riskPill} font-bold text-[10px]">${e.riskLevel}</span></td>
        </tr>
      `;
    }).join('');

    if (hasMore) {
      rowsHtml += `
        <tr id="repEcidLoadMoreRow">
          <td colspan="${cols.length}" class="text-center py-4 bg-navy-900/60">
            <span class="text-xs text-gray-400 mr-3">Showing ${limit} of ${filtered.length} unique ECIDs</span>
            <button type="button" class="btn btn-secondary text-xs py-1 px-3 font-bold mr-2" onclick="window.app.loadMoreRepeatabilityRows('ecid')">
              ⬇ Load More (+1000)
            </button>
            <button type="button" class="btn btn-primary text-xs py-1 px-3 font-bold" onclick="window.app.showAllRepeatabilityRows('ecid')">
              Show All (${filtered.length})
            </button>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
  }

  /**
   * Render View 2: Per-Test Parameter Table
   */
  renderRepeatabilityTestTable() {
    const rep = this.state.repeatabilityAnalysis;
    const thead = document.getElementById('repMatrixThead');
    const tbody = document.getElementById('repMatrixTbody');
    const countBadge = document.getElementById('repTableRecordCount');
    if (!rep || !tbody || !thead) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { searchQuery, selectedEcids, selectedTests, selectedTrends, selectedDists, selectedDistRepeats, preset, sortColumn, sortDirection } = this.state.repeatabilityFilter;

    // Filter per-Test dataset
    let filtered = rep.perTestStats.filter(t => {
      // 1. Test Filter (Multi-select)
      if (selectedTests && selectedTests.size > 0 && !selectedTests.has('ALL')) {
        if (selectedTests.has('NONE') || (!selectedTests.has(t.testName) && !selectedTests.has(t.testNum) && !selectedTests.has(t.testKey))) return false;
      }

      // 2. ECID Filter (Multi-select)
      if (selectedEcids && selectedEcids.size > 0 && !selectedEcids.has('ALL')) {
        if (selectedEcids.has('NONE')) return false;
        if (!t.ecidSet) return false;
        let hasEcid = false;
        if (selectedEcids.size < t.ecidSet.size) {
          for (const ec of selectedEcids) {
            if (t.ecidSet.has(ec)) { hasEcid = true; break; }
          }
        } else {
          for (const ec of t.ecidSet) {
            if (selectedEcids.has(ec)) { hasEcid = true; break; }
          }
        }
        if (!hasEcid) return false;
      }

      // 3. Trend Filter (Multi-select)
      if (selectedTrends && selectedTrends.size > 0 && !selectedTrends.has('ALL')) {
        if (selectedTrends.has('NONE')) return false;
        const matchTrend = selectedTrends.has(t.dominantTrend) || (t.trendCounts && Object.keys(t.trendCounts).some(tr => selectedTrends.has(tr) && t.trendCounts[tr] > 0));
        if (!matchTrend) return false;
      }

      // 4. Dist Filter (Multi-select)
      if (selectedDists && selectedDists.size > 0 && !selectedDists.has('ALL')) {
        if (selectedDists.has('NONE')) return false;
        const matchDist = selectedDists.has(t.dominantDist) || (t.distCounts && Object.keys(t.distCounts).some(d => selectedDists.has(d) && t.distCounts[d] > 0));
        if (!matchDist) return false;
      }

      // 5. DistRepeat Filter (Multi-select)
      if (selectedDistRepeats && selectedDistRepeats.size > 0 && !selectedDistRepeats.has('ALL')) {
        if (selectedDistRepeats.has('NONE')) return false;
        const matchDr = selectedDistRepeats.has(t.dominantDistRepeat) || (t.distRepeatCounts && Object.keys(t.distRepeatCounts).some(dr => selectedDistRepeats.has(dr) && t.distRepeatCounts[dr] > 0));
        if (!matchDr) return false;
      }

      // 6. Quick Presets (with absolute value for CV%)
      if (preset === 'HIGH_CV' && Math.abs(t.maxCv) < 5.0 && Math.abs(t.meanCv) < 5.0) return false;
      if (preset === 'LOW_CP' && t.minCp >= 4.0 && t.meanCp >= 4.0) return false;
      if (preset === 'DRIFT_ONLY') {
        const hasDrift = t.dominantTrend.includes('Shift') || t.dominantTrend.includes('Drift') || (t.trendCounts && ((t.trendCounts['Step Shift / Discontinuity'] || 0) > 0 || (t.trendCounts['Thermal / Upward-Downward Drift'] || 0) > 0));
        if (!hasDrift) return false;
      }

      // 7. Search Query
      if (searchQuery) {
        if (t._searchBlob) {
          if (!t._searchBlob.includes(searchQuery)) return false;
        } else {
          const textBlob = `${t.testNum} ${t.testName} ${t.units}`.toLowerCase();
          if (!textBlob.includes(searchQuery)) return false;
        }
      }
      return true;
    });

    // Sort dataset
    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} Test Parameters`;

    // Render Headers
    const cols = this.repTestColumns;
    thead.innerHTML = `
      <tr>
        ${cols.map(c => {
          const isSorted = sortColumn === c.key;
          const sortIcon = isSorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';
          const alignClass = c.numeric ? 'text-right' : (c.key === 'testNum' || c.key === 'ecidCount' ? 'text-center' : 'text-left');
          const widthStyle = !this.state.repeatabilityAutoFit && c.width ? `style="width: ${c.width};"` : '';
          return `<th class="sortable-header ${alignClass}" ${widthStyle} onclick="window.app.onRepeatabilitySort('${c.key}')" title="Click to sort by ${c.label}">${safeEsc(c.label)}<span class="text-cyan font-bold">${sortIcon}</span></th>`;
        }).join('')}
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cols.length}" class="text-center py-8 text-gray-400">No Test parameter records match the current filter criteria.</td></tr>`;
      return;
    }

    const limit = this.state.repTestLimit || 300;
    const displayList = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    let rowsHtml = displayList.map(t => {
      const cvColor = Math.abs(t.meanCv) >= 10.0 ? 'text-red font-bold' : (Math.abs(t.meanCv) >= 5.0 ? 'text-amber-400' : 'text-cyan');
      const cpColor = t.minCp < 1.67 ? 'text-red font-bold' : (t.minCp < 4.0 ? 'text-amber-400 font-bold' : 'text-green');

      return `
        <tr class="clickable-row hover:bg-white/5 transition-colors" onclick="window.app.traceRepeatabilityTest('${safeEsc(t.testKey)}')">
          <td class="font-mono font-bold text-white text-xs">${safeEsc(t.testNum)}</td>
          <td class="font-mono font-bold text-cyan text-xs"><b>${safeEsc(t.testName)}</b></td>
          <td class="font-mono text-gray-300 text-xs">${safeEsc(t.units)}</td>
          <td class="font-mono text-gray-400 text-xs">[${safeEsc(t.loLimit)}, ${safeEsc(t.hiLimit)}]</td>
          <td class="text-right font-mono text-white text-xs font-bold">${t.ecidCount}</td>
          <td class="text-right font-mono text-xs ${cvColor}"><b>${t.meanCv.toFixed(2)}%</b></td>
          <td class="text-right font-mono text-xs">${t.maxCv.toFixed(2)}%</td>
          <td class="text-right font-mono text-xs">${t.meanCp.toFixed(2)}</td>
          <td class="text-right font-mono text-xs ${cpColor}"><b>${t.minCp.toFixed(2)}</b></td>
          <td class="text-xs">${t.distCellHtml || this.formatDistCell(t.distCounts, t.dominantDist)}</td>
          <td class="text-xs">${t.distRepeatCellHtml || this.formatDistRepeatCell(t.distRepeatCounts, t.dominantDistRepeat)}</td>
          <td class="text-xs">${t.trendCellHtml || this.formatTrendCell(t.trendCounts, t.dominantTrend)}</td>
        </tr>
      `;
    }).join('');

    if (hasMore) {
      rowsHtml += `
        <tr id="repTestLoadMoreRow">
          <td colspan="${cols.length}" class="text-center py-4 bg-navy-900/60">
            <span class="text-xs text-gray-400 mr-3">Showing ${limit} of ${filtered.length} test parameters</span>
            <button type="button" class="btn btn-secondary text-xs py-1 px-3 font-bold mr-2" onclick="window.app.loadMoreRepeatabilityRows('test')">
              ⬇ Load More (+500)
            </button>
            <button type="button" class="btn btn-primary text-xs py-1 px-3 font-bold" onclick="window.app.showAllRepeatabilityRows('test')">
              Show All (${filtered.length})
            </button>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
  }

  /**
   * Render View 3: Full Detailed Measurement Matrix
   */
  renderRepeatabilityDetailTable() {
    const rep = this.state.repeatabilityAnalysis;
    const thead = document.getElementById('repMatrixThead');
    const tbody = document.getElementById('repMatrixTbody');
    const countBadge = document.getElementById('repTableRecordCount');
    if (!rep || !tbody || !thead) return;

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { searchQuery, selectedEcids, selectedTests, selectedTrends, selectedDists, selectedDistRepeats, preset, sortColumn, sortDirection } = this.state.repeatabilityFilter;

    // Filter raw detail items
    let filtered = rep.detailItems.filter(item => {
      // 1. ECID Filter (Multi-select)
      if (selectedEcids && selectedEcids.size > 0 && !selectedEcids.has('ALL')) {
        if (selectedEcids.has('NONE') || !selectedEcids.has(item.ecid)) return false;
      }

      // 2. Test Filter (Multi-select)
      if (selectedTests && selectedTests.size > 0 && !selectedTests.has('ALL')) {
        if (selectedTests.has('NONE') || (!selectedTests.has(item.testName) && !selectedTests.has(item.testNum) && !selectedTests.has(item.testKey))) return false;
      }

      // 3. Trend Filter (Multi-select)
      if (selectedTrends && selectedTrends.size > 0 && !selectedTrends.has('ALL')) {
        if (selectedTrends.has('NONE') || !selectedTrends.has(item.trend)) return false;
      }

      // 4. Dist Filter (Multi-select)
      if (selectedDists && selectedDists.size > 0 && !selectedDists.has('ALL')) {
        if (selectedDists.has('NONE') || !selectedDists.has(item.dist)) return false;
      }

      // 5. DistRepeat Filter (Multi-select)
      if (selectedDistRepeats && selectedDistRepeats.size > 0 && !selectedDistRepeats.has('ALL')) {
        if (selectedDistRepeats.has('NONE') || !selectedDistRepeats.has(item.distRepeat)) return false;
      }

      // 6. Quick Presets (with absolute value for CV%)
      if (preset === 'HIGH_CV' && Math.abs(item.cv) < 5.0) return false;
      if (preset === 'LOW_CP' && item.cp >= 4.0) return false;
      if (preset === 'DRIFT_ONLY' && !item.trend.includes('Shift') && !item.trend.includes('Drift')) return false;

      // 7. Search Query
      if (searchQuery) {
        if (item._searchBlob) {
          if (!item._searchBlob.includes(searchQuery)) return false;
        } else {
          const textBlob = `${item.ecid} ${item.testNum} ${item.testName}`.toLowerCase();
          if (!textBlob.includes(searchQuery)) return false;
        }
      }
      return true;
    });

    // Sort detail items
    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} / ${rep.totalRecords} Measurements`;

    // Render Headers
    const cols = this.repDetailColumns;
    thead.innerHTML = `
      <tr>
        ${cols.map(c => {
          const isSorted = sortColumn === c.key;
          const sortIcon = isSorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';
          const alignClass = c.numeric ? 'text-right' : 'text-left';
          const widthStyle = !this.state.repeatabilityAutoFit && c.width ? `style="width: ${c.width};"` : '';
          return `<th class="sortable-header ${alignClass}" ${widthStyle} onclick="window.app.onRepeatabilitySort('${c.key}')" title="Click to sort by ${c.label}">${safeEsc(c.label)}<span class="text-cyan font-bold">${sortIcon}</span></th>`;
        }).join('')}
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cols.length}" class="text-center py-8 text-gray-400">No measurement records match the current filter criteria.</td></tr>`;
      return;
    }

    const limit = this.state.repDetailLimit || 300;
    const displayList = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    let rowsHtml = displayList.map(item => {
      const cvColor = Math.abs(item.cv) >= 10.0 ? 'text-red font-bold' : (Math.abs(item.cv) >= 5.0 ? 'text-amber-400' : 'text-cyan');
      const cpColor = item.cp < 1.67 ? 'text-red font-bold' : (item.cp < 4.0 ? 'text-amber-400 font-bold' : 'text-green');

      return `
        <tr class="clickable-row hover:bg-white/5 transition-colors" onclick="window.app.traceRepeatabilityItem('${safeEsc(item.ecid)}', '${safeEsc(item.testNum)}')">
          <td class="font-mono text-cyan text-xs"><b>${safeEsc(item.ecid)}</b></td>
          <td class="font-mono text-gray-300 text-xs">${safeEsc(item.testNum)}</td>
          <td class="font-mono text-white text-xs font-bold">${safeEsc(item.testName)}</td>
          <td class="font-mono text-gray-400 text-xs">${safeEsc(item.units)}</td>
          <td class="text-right font-mono text-xs">${item.mean.toFixed(2)}</td>
          <td class="text-right font-mono text-xs">${item.std.toFixed(3)}</td>
          <td class="text-right font-mono text-xs">${item.ev6Sigma.toFixed(2)}</td>
          <td class="text-right font-mono text-xs ${cvColor}"><b>${item.cv.toFixed(2)}%</b></td>
          <td class="text-right font-mono text-xs ${cpColor}"><b>${item.cp.toFixed(2)}</b></td>
          <td class="text-right font-mono text-xs">${item.cpkn.toFixed(2)}</td>
          <td class="font-mono text-gray-400 text-xs">[${safeEsc(item.loLimit)}, ${safeEsc(item.hiLimit)}]</td>
          <td class="text-xs">${this.formatSingleDistBadge(item.dist)}</td>
          <td class="text-xs">${this.formatSingleDistRepeatBadge(item.distRepeat)}</td>
          <td class="text-xs">${this.formatSingleTrendBadge(item.trend)}</td>
        </tr>
      `;
    }).join('');

    if (hasMore) {
      rowsHtml += `
        <tr id="repDetailLoadMoreRow">
          <td colspan="${cols.length}" class="text-center py-4 bg-navy-900/60">
            <span class="text-xs text-gray-400 mr-3">Showing ${limit} of ${filtered.length} measurements</span>
            <button type="button" class="btn btn-secondary text-xs py-1 px-3 font-bold mr-2" onclick="window.app.loadMoreRepeatabilityRows('detail')">
              ⬇ Load More (+1000)
            </button>
            <button type="button" class="btn btn-primary text-xs py-1 px-3 font-bold" onclick="window.app.showAllRepeatabilityRows('detail')">
              Show All (${filtered.length})
            </button>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
  }

  loadMoreRepeatabilityRows(viewType = 'detail') {
    if (viewType === 'detail') {
      this.state.repDetailLimit = (this.state.repDetailLimit || 300) + 1000;
      this.renderRepeatabilityDetailTable();
    } else if (viewType === 'test') {
      this.state.repTestLimit = (this.state.repTestLimit || 300) + 500;
      this.renderRepeatabilityTestTable();
    } else {
      this.state.repEcidLimit = (this.state.repEcidLimit || 500) + 1000;
      this.renderRepeatabilityEcidTable();
    }
  }

  showAllRepeatabilityRows(viewType = 'detail') {
    const maxSafe = 2500;
    if (viewType === 'detail') {
      this.state.repDetailLimit = maxSafe;
      this.renderRepeatabilityDetailTable();
    } else if (viewType === 'test') {
      this.state.repTestLimit = maxSafe;
      this.renderRepeatabilityTestTable();
    } else {
      this.state.repEcidLimit = maxSafe;
      this.renderRepeatabilityEcidTable();
    }
  }

  /**
   * Trace Per-ECID Record
   */
  traceRepeatabilityEcid(ecid) {
    try {
      const rep = this.state.repeatabilityAnalysis;
      if (!rep) return;
      const ecidStat = rep.perEcidStats?.find(e => e.ecid === ecid);
      if (!ecidStat) return;

      const rawRows = (ecidStat.items || []).map(i => i.raw).filter(Boolean);
      const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      window.traceManager.trace(
        `Repeatability ECID: ${ecid}`,
        `Parametric measurements across all ${ecidStat.testCount} tests for die ${ecidStat.coordDisplay}`,
        `<b>Die Coordinates:</b> <b>${safeEsc(ecidStat.coordDisplay)}</b><br>` +
        `• Tests Evaluated: <b>${ecidStat.testCount} tests</b><br>` +
        `• Avg CV (%): <b>${ecidStat.meanCv.toFixed(2)}%</b> (Max: <b>${ecidStat.maxCv.toFixed(2)}%</b>)<br>` +
        `• Process Capability Cp: <b>${ecidStat.meanCp.toFixed(2)}</b> (Min Cp: <b class="${ecidStat.minCp < 1.33 ? 'text-red' : 'text-green'}">${ecidStat.minCp.toFixed(2)}</b>)<br>` +
        `• Dominant Trend: <b>${safeEsc(ecidStat.dominantTrend)}</b> &bull; Status: <span class="status-pill pill-${ecidStat.riskPill} text-[10px]">${ecidStat.riskLevel}</span>`,
        rawRows,
        null,
        rep.meta?.rawName
      );
    } catch (err) {
      console.error('Error tracing repeatability ECID:', err);
    }
  }

  /**
   * Trace Per-Test Record
   */
  traceRepeatabilityTest(testKey) {
    try {
      const rep = this.state.repeatabilityAnalysis;
      if (!rep) return;
      const testStat = rep.perTestStats?.find(t => t.testKey === testKey);
      if (!testStat) return;

      const rawRows = (testStat.items || []).map(i => i.raw).filter(Boolean);
      const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      window.traceManager.trace(
        `Repeatability Test: ${testStat.testName} (${testStat.testNum})`,
        `Parametric repeatability statistics across all ${testStat.ecidCount} evaluated dice`,
        `<b>Test Parameter:</b> <b>${safeEsc(testStat.testName)}</b> (#${safeEsc(testStat.testNum)}) &bull; Units: <b>${safeEsc(testStat.units)}</b><br>` +
        `• Specification Limits: [<b>${safeEsc(testStat.loLimit)}</b>, <b>${safeEsc(testStat.hiLimit)}</b>]<br>` +
        `• Mean CV (%): <b>${testStat.meanCv.toFixed(2)}%</b> (Min: ${testStat.minCv.toFixed(2)}%, Max: ${testStat.maxCv.toFixed(2)}%)<br>` +
        `• Process Capability Cp: <b>${testStat.meanCp.toFixed(2)}</b> (Min: <b class="${testStat.minCp < 1.33 ? 'text-red' : 'text-green'}">${testStat.minCp.toFixed(2)}</b>)<br>` +
        `• Dominant Distribution: <b>${safeEsc(testStat.dominantDist)}</b> &bull; Dominant Trend: <b>${safeEsc(testStat.dominantTrend)}</b>`,
        rawRows,
        null,
        rep.meta?.rawName
      );
    } catch (err) {
      console.error('Error tracing repeatability test:', err);
    }
  }

  /**
   * Trace Single Measurement Item
   */
  traceRepeatabilityItem(ecid, testNum) {
    try {
      const rep = this.state.repeatabilityAnalysis;
      if (!rep) return;
      const item = rep.detailItems?.find(i => i.ecid === ecid && i.testNum === testNum);
      if (!item) return;

      const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      window.traceManager.trace(
        `Repeatability Item: ${item.testName} on ${item.ecid}`,
        `Measurement data, 6-Sigma EV, CV%, and Process Capability Cp`,
        `<b>Measurement Details:</b><br>` +
        `• Die ECID: <b>${safeEsc(item.ecid)}</b> &bull; Test: <b>${safeEsc(item.testName)}</b> (#${safeEsc(item.testNum)})<br>` +
        `• Mean: <b>${safeEsc(item.mean)} ${safeEsc(item.units)}</b> &bull; StdDev: <b>${safeEsc(item.std)}</b><br>` +
        `• EV (6-Sigma): <b>${safeEsc(item.ev6Sigma)}</b> &bull; CV (%): <b>${item.cv.toFixed(2)}%</b><br>` +
        `• Cp: <b>${item.cp.toFixed(2)}</b> &bull; CPKn: <b>${item.cpkn.toFixed(2)}</b><br>` +
        `• Limits: [<b>${safeEsc(item.loLimit)}</b>, <b>${safeEsc(item.hiLimit)}</b>] &bull; Ext_Drift: ${safeEsc(item.extDrift)}<br>` +
        `• Morphology: <b>${safeEsc(item.dist)}</b> &bull; Repeatability: <b>${safeEsc(item.distRepeat)}</b> &bull; Trend: <b>${safeEsc(item.trend)}</b>`,
        item.raw ? [item.raw] : [],
        null,
        rep.meta?.rawName
      );
    } catch (err) {
      console.error('Error tracing repeatability item:', err);
    }
  }

  /**
   * Update Raw Data & Trace Explorer Tab
   */
  updateTraceExplorerUi() {
    const explorerSelect = document.getElementById('explorerDatasetSelect');
    if (!explorerSelect) return;

    explorerSelect.onchange = () => this.renderExplorerTable();

    const container = document.getElementById('explorerTableContainer');
    if (container && !container._virtualScrollBound) {
      container._virtualScrollBound = true;
      let rafPending = false;
      container.addEventListener('scroll', () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          this.renderExplorerVirtualRows();
        });
      });
    }

    this.renderExplorerTable();
  }

  onExplorerSearchInput() {
    if (this._explorerSearchDebounceTimer) {
      clearTimeout(this._explorerSearchDebounceTimer);
    }
    this._explorerSearchDebounceTimer = setTimeout(() => {
      this.renderExplorerTable();
    }, 120);
  }

  /**
   * Virtualized row window: only the rows currently scrolled into view (plus a small
   * buffer) are ever real <tr> elements in the DOM. Top/bottom spacer rows reserve the
   * correct scroll height so the scrollbar still represents the full dataset, letting
   * users scroll through every row of even a 50k+ row CSV without the DOM ever holding
   * more than a few dozen live rows at once.
   */
  renderExplorerVirtualRows() {
    const v = this._explorerVirtual;
    const container = document.getElementById('explorerTableContainer');
    const tbody = document.getElementById('explorerTableBody');
    if (!v || !container || !tbody) return;

    const { dataRows, headers, safeEsc } = v;
    const total = dataRows.length;
    const rowHeight = v.rowHeight || 31;
    const buffer = 10;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight || 480;

    const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + buffer * 2;
    const endIdx = Math.min(total, startIdx + visibleCount);

    const topHeight = startIdx * rowHeight;
    const bottomHeight = Math.max(0, (total - endIdx) * rowHeight);
    const colspan = headers.length + 1;

    let rowsHtml = '';
    if (topHeight > 0) {
      rowsHtml += `<tr aria-hidden="true" style="height:${topHeight}px;"><td colspan="${colspan}" style="padding:0;border:none;"></td></tr>`;
    }

    for (let idx = startIdx; idx < endIdx; idx++) {
      const r = dataRows[idx];
      rowsHtml += `
        <tr>
          <td class="font-mono opacity-75">${r._rawRowIndex || (idx + 1)}</td>
          ${headers.map(h => {
            let val = r[h] !== undefined ? r[h] : '';
            return `<td title="${safeEsc(val)}"><span class="cell-truncate">${safeEsc(val)}</span></td>`;
          }).join('')}
        </tr>
      `;
    }

    if (bottomHeight > 0) {
      rowsHtml += `<tr aria-hidden="true" style="height:${bottomHeight}px;"><td colspan="${colspan}" style="padding:0;border:none;"></td></tr>`;
    }

    tbody.innerHTML = rowsHtml;

    // Self-correct the assumed row height once from a real rendered row so the
    // spacer math stays accurate across fonts/zoom levels, then re-render once.
    if (!v._corrected) {
      const sample = tbody.querySelector('tr:not([aria-hidden])');
      if (sample) {
        const measured = sample.getBoundingClientRect().height;
        v._corrected = true;
        if (measured > 0 && Math.abs(measured - rowHeight) > 1) {
          v.rowHeight = measured;
          this.renderExplorerVirtualRows();
        }
      }
    }
  }

  renderExplorerTable() {
    const selector = document.getElementById('explorerDatasetSelect');
    const type = selector ? selector.value : 'item';
    const tbody = document.getElementById('explorerTableBody');
    const thead = document.getElementById('explorerTableHead');
    const container = document.getElementById('explorerTableContainer');
    const searchInput = document.getElementById('explorerSearchInput');
    const query = (searchInput && searchInput.value) ? String(searchInput.value).toLowerCase().trim() : '';

    let dataRows = [];
    let headers = [];
    let activeFilename = '--';

    if (type === 'repeatability' && this.state.repeatabilityFile) {
      dataRows = this.state.repeatabilityFile.rows || [];
      headers = this.state.repeatabilityFile.headers || [];
      activeFilename = this.state.repeatabilityFile.filename || 'repeatability.csv';
    } else if (type === 'tsr' && this.state.tsrFile) {
      dataRows = this.state.tsrFile.rows || [];
      headers = this.state.tsrFile.headers || [];
      activeFilename = this.state.tsrFile.filename || 'tsr.csv';
    } else if (type === 'item' && this.state.itemFile) {
      dataRows = this.state.itemFile.rows || [];
      headers = this.state.itemFile.headers || [];
      activeFilename = this.state.itemFile.filename || 'itemcompare.csv';
    } else if (type === 'dsa' && this.state.dsaFile) {
      dataRows = this.state.dsaFile.rows || [];
      headers = this.state.dsaFile.headers || [];
      activeFilename = this.state.dsaFile.filename || 'dsacompare.csv';
    } else if (type === 'bin' && this.state.binFile) {
      const sec = this.state.binFile.sections || {};
      dataRows = [...(sec.newHardBin || []), ...(sec.transitions || [])];
      headers = ['NEW_Hardbin', 'NEW_BinName', 'NEW_BinState', 'Transition', 'Count', 'Percentage'];
      activeFilename = this.state.binFile.filename || 'bincompare.csv';
    }

    // Update Explorer Source File Bar
    const expFileName = document.getElementById('explorerLoadedFileName');
    const expFileBadge = document.getElementById('explorerLoadedFileBadge');
    const expTimestamp = document.getElementById('explorerLoadedTimestamp');
    if (expFileName) expFileName.textContent = activeFilename;
    if (expFileBadge) expFileBadge.textContent = `${dataRows.length} rows (${headers.length} columns)`;
    if (expTimestamp) expTimestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;

    if (query) {
      dataRows = dataRows.filter(r => {
        return Object.entries(r).some(([k, v]) => !k.startsWith('_') && String(v).toLowerCase().includes(query));
      });
    }

    const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (thead) {
      thead.innerHTML = `<tr><th style="width: 50px;">#</th>${headers.map(h => `<th>${safeEsc(h)}</th>`).join('')}</tr>`;
    }

    if (!tbody) return;

    if (dataRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${headers.length + 1}" class="text-center py-6 opacity-75">No records to display.</td></tr>`;
      this._explorerVirtual = null;
      return;
    }

    this._explorerVirtual = {
      dataRows,
      headers,
      safeEsc,
      rowHeight: this._explorerVirtual?.rowHeight || 31,
      _corrected: false
    };
    if (container) container.scrollTop = 0;
    this.renderExplorerVirtualRows();
  }

  /**
   * One-click Maximize / Fullscreen Chart Modal View (一鍵放大, ESC 還原)
   */
  maximizeChart(chartId, title = 'Chart Fullscreen View', subtitle = '') {
    try {
      const srcChart = this.chartsManager.charts[chartId];
      if (!srcChart) {
        this.showToast('⚠️ Chart data not ready or loaded yet.', 'warning');
        return;
      }

      this.state.isChartModalOpen = true;
      this.state.currentModalChartId = chartId;
      this.state.currentModalTableType = null;
      this.state.currentModalTitle = title;

      const modalTitleEl = document.getElementById('chartModalTitle');
      const modalSubEl = document.getElementById('chartModalSubtitle');
      const canvasWrap = document.getElementById('chartModalCanvasWrapper');
      const tableWrap = document.getElementById('chartModalTableWrapper');
      const downloadBtn = document.getElementById('btnModalDownloadPng');

      if (modalTitleEl) modalTitleEl.textContent = title;
      if (modalSubEl) modalSubEl.innerHTML = subtitle || `Press <kbd class="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-700 text-cyan text-[11px] font-mono">ESC</kbd> or click ✕ to restore`;
      if (canvasWrap) canvasWrap.classList.remove('hidden');
      if (tableWrap) tableWrap.classList.add('hidden');
      if (downloadBtn) downloadBtn.classList.remove('hidden');

      const modalCanvas = document.getElementById('chartModalCanvas');
      if (!modalCanvas) return;

      // Destroy previous modal chart instance if any
      if (this.chartsManager.charts['chartModalCanvas']) {
        this.chartsManager.charts['chartModalCanvas'].destroy();
        delete this.chartsManager.charts['chartModalCanvas'];
      }

      const t = this.chartsManager.getThemeConfig();
      const srcConfig = srcChart.config;

      // Deep clone data
      const modalData = {
        labels: Array.isArray(srcConfig.data.labels) ? [...srcConfig.data.labels] : srcConfig.data.labels,
        datasets: (srcConfig.data.datasets || []).map(ds => ({
          label: ds.label,
          data: Array.isArray(ds.data) ? [...ds.data] : ds.data,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor,
          borderWidth: ds.borderWidth,
          borderRadius: ds.borderRadius,
          yAxisID: ds.yAxisID,
          tension: ds.tension,
          fill: ds.fill,
          pointRadius: ds.pointRadius,
          pointHoverRadius: ds.pointHoverRadius
        }))
      };

      // Safely build modal options without JSON.stringify circular crash
      const modalOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: srcConfig.options?.indexAxis || 'x',
        plugins: {
          legend: {
            display: srcConfig.options?.plugins?.legend?.display !== false,
            position: srcConfig.options?.plugins?.legend?.position || 'top',
            labels: {
              color: t.textColor,
              font: { size: 13, weight: '700', family: 'Inter, system-ui' },
              padding: 16
            }
          },
          tooltip: {
            enabled: true,
            callbacks: srcConfig.options?.plugins?.tooltip?.callbacks ? { ...srcConfig.options.plugins.tooltip.callbacks } : undefined
          }
        }
      };

      // Scales
      if (srcConfig.options?.scales) {
        modalOptions.scales = {};
        Object.keys(srcConfig.options.scales).forEach(scaleKey => {
          const sc = srcConfig.options.scales[scaleKey];
          if (sc) {
            modalOptions.scales[scaleKey] = {
              type: sc.type,
              position: sc.position,
              display: sc.display !== false,
              grid: sc.grid ? { display: sc.grid.display !== false, color: t.gridColor } : undefined,
              ticks: {
                color: sc.ticks?.color || t.textColor,
                font: { size: 12, weight: '600' },
                callback: typeof sc.ticks?.callback === 'function' ? sc.ticks.callback : undefined
              },
              title: sc.title ? {
                display: sc.title.display,
                text: sc.title.text,
                color: sc.title.color || t.textColor,
                font: { size: 13, weight: '700' }
              } : undefined
            };
          }
        });
      }

      // Preserve custom onClick handler from original chart for drilldown trace
      if (typeof srcConfig.options?.onClick === 'function') {
        modalOptions.onClick = (evt, elements) => {
          srcConfig.options.onClick(evt, elements);
        };
      }

      const modalCtx = modalCanvas.getContext('2d');
      this.chartsManager.charts['chartModalCanvas'] = new Chart(modalCtx, {
        type: srcConfig.type,
        data: modalData,
        options: modalOptions
      });

      const modalEl = document.getElementById('chartModal');
      if (modalEl) modalEl.classList.add('open');
      document.body.classList.add('drawer-open');
    } catch (err) {
      console.error('Error expanding chart modal:', err);
      this.showToast(`⚠️ Could not expand chart: ${err.message}`, 'error');
    }
  }

  /**
   * One-click Maximize / Fullscreen Table Modal View (一鍵放大, ESC 還原)
   */
  maximizeTable(tableType, title = 'Table Fullscreen View', subtitle = '') {
    try {
      this.state.isChartModalOpen = true;
      this.state.currentModalTableType = tableType;
      this.state.currentModalChartId = null;
      this.state.currentModalTitle = title;

      const modalTitleEl = document.getElementById('chartModalTitle');
      const modalSubEl = document.getElementById('chartModalSubtitle');
      const canvasWrap = document.getElementById('chartModalCanvasWrapper');
      const tableWrap = document.getElementById('chartModalTableWrapper');
      const downloadBtn = document.getElementById('btnModalDownloadPng');

      if (modalTitleEl) modalTitleEl.textContent = title;
      if (modalSubEl) modalSubEl.innerHTML = subtitle || `Press <kbd class="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-700 text-cyan text-[11px] font-mono">ESC</kbd> or click ✕ to restore`;
      if (canvasWrap) canvasWrap.classList.add('hidden');
      if (tableWrap) tableWrap.classList.remove('hidden');
      if (downloadBtn) downloadBtn.classList.add('hidden');

      if (tableType === 'tsrCpkTable' || tableType === 'overviewCpkTable') {
        const tsr = this.state.tsrAnalysis;
        if (!tsr || !tsr.allCpkGroupsTable) {
          if (tableWrap) tableWrap.innerHTML = '<div class="p-6 text-center text-gray-400">No capability data available to display.</div>';
          return;
        }
        const activeGroup = this.state.tsrFilter.cpkGroup;

        tableWrap.innerHTML = `
          <div class="data-table-container p-3 h-full" style="max-height: 75vh; overflow-y: auto;">
            <table class="data-table w-full text-sm">
              <thead>
                <tr>
                  <th style="width: 220px;">Capability Group</th>
                  <th>Capability Criteria / Definition</th>
                  <th class="text-center" style="width: 100px;">Count</th>
                  <th class="text-right" style="width: 100px;">Share %</th>
                  <th class="text-center" style="width: 140px;">Risk Level</th>
                  <th class="text-right" style="width: 140px;">Filter & Trace</th>
                </tr>
              </thead>
              <tbody>
                ${tsr.allCpkGroupsTable.map(g => {
                  const isSelected = activeGroup === g.key;
                  const rowStyle = isSelected
                    ? 'background: rgba(0, 229, 255, 0.18); border-left: 4px solid var(--cyan);'
                    : '';
                  const filterBtnClass = isSelected ? 'btn btn-primary text-xs py-1 px-3 font-bold' : 'btn btn-secondary text-xs py-1 px-3';
                  const filterBtnLabel = isSelected ? '✓ Filter Active' : '🔍 Filter Group';

                  let riskBadge = '<span class="status-pill pill-green font-bold text-xs">OPTIMAL</span>';
                  if (g.key.includes('< 0.5') || g.key.includes('<0.5')) {
                    riskBadge = '<span class="status-pill pill-red font-bold text-xs">CRITICAL DEFECT</span>';
                  } else if (g.key.includes('0.5') && g.key.includes('1.67')) {
                    riskBadge = '<span class="status-pill pill-yellow font-bold text-xs">MARGINAL RISK</span>';
                  } else if (g.key.includes('1.67') && g.key.includes('4')) {
                    riskBadge = '<span class="status-pill pill-cyan font-bold text-xs">CAPABLE</span>';
                  }

                  return `
                    <tr class="clickable-row hover:bg-white/10 transition-colors" style="${rowStyle}" onclick="window.app.toggleCpkGroupSelection('${safeEsc(g.key)}'); window.app.maximizeTable('tsrCpkTable', '${title}');">
                      <td class="py-3 px-3">
                        <span class="status-pill pill-${g.color} font-bold text-xs" style="padding: 0.25rem 0.65rem;">${safeEsc(g.name)}</span>
                      </td>
                      <td class="py-3 px-3 text-xs text-gray-300 font-mono">${safeEsc(g.criteria || g.name)}</td>
                      <td class="py-3 px-2 text-center font-mono font-bold text-white text-base">${g.count}</td>
                      <td class="py-3 px-2 text-right font-mono font-bold text-cyan text-sm">${safeEsc(g.percentage)}</td>
                      <td class="py-3 px-2 text-center">${riskBadge}</td>
                      <td class="py-3 px-3 text-right">
                        <button class="${filterBtnClass}" onclick="event.stopPropagation(); window.app.toggleCpkGroupSelection('${safeEsc(g.key)}'); window.app.maximizeTable('tsrCpkTable', '${title}');">
                          ${filterBtnLabel}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      const modalEl = document.getElementById('chartModal');
      if (modalEl) modalEl.classList.add('open');
      document.body.classList.add('drawer-open');
    } catch (err) {
      console.error('Error maximizing table:', err);
      this.showToast('⚠️ Could not expand table view', 'error');
    }
  }

  /**
   * Close Fullscreen Chart/Table Modal (Esc 還原)
   */
  closeChartModal() {
    const modalEl = document.getElementById('chartModal');
    if (modalEl) modalEl.classList.remove('open');
    document.body.classList.remove('drawer-open');
    this.state.isChartModalOpen = false;
    this.state.currentModalChartId = null;
    this.state.currentModalTableType = null;

    const tableWrap = document.getElementById('chartModalTableWrapper');
    if (tableWrap) {
      tableWrap.innerHTML = '';
      tableWrap.classList.add('hidden');
    }
    const canvasWrap = document.getElementById('chartModalCanvasWrapper');
    if (canvasWrap) canvasWrap.classList.remove('hidden');

    if (this.chartsManager.charts['chartModalCanvas']) {
      this.chartsManager.charts['chartModalCanvas'].destroy();
      delete this.chartsManager.charts['chartModalCanvas'];
    }
  }

  /**
   * Download high-resolution PNG image of the maximized chart
   */
  downloadModalChartPng() {
    const canvas = document.getElementById('chartModalCanvas');
    if (!canvas) return;
    const chartId = this.state.currentModalChartId || 'chart';
    const link = document.createElement('a');
    link.download = `semiconductor_${chartId}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('📷 High-Resolution PNG chart image downloaded.', 'info');
  }

  /**
   * Test Ignore / Exclusion Rule Handlers (not xxx, not yyy)
   */
  setTestIgnoreInput(rawInput, reAnalyze = true) {
    try {
      const cleanInput = String(rawInput || '').trim();
      this.state.testIgnoreInput = cleanInput;
      this.state.testIgnoreRules = SemiconductorAnalytics.parseIgnoreRules(cleanInput);

      // Sync input values across all toolbars safely
      const dsaInput = document.getElementById('dsaTestIgnoreInput');
      const tsrInput = document.getElementById('tsrTestIgnoreInput');
      const repInput = document.getElementById('repTestIgnoreInput');
      const modalInput = document.getElementById('modalTestIgnoreInput');

      if (dsaInput && dsaInput.value !== cleanInput) dsaInput.value = cleanInput;
      if (tsrInput && tsrInput.value !== cleanInput) tsrInput.value = cleanInput;
      if (repInput && repInput.value !== cleanInput) repInput.value = cleanInput;
      if (modalInput && modalInput.value !== cleanInput) modalInput.value = cleanInput;

      if (reAnalyze) {
        if (this.state.dsaFile) {
          try {
            this.state.dsaAnalysis = SemiconductorAnalytics.analyzeDsaCompare(this.state.dsaFile, this.state.testIgnoreRules);
          } catch (e) {
            console.error('Error re-analyzing DSA dataset with ignore rules:', e);
          }
        }
        if (this.state.tsrFile) {
          try {
            this.state.tsrAnalysis = SemiconductorAnalytics.analyzeTsr(this.state.tsrFile, this.state.testIgnoreRules);
          } catch (e) {
            console.error('Error re-analyzing TSR dataset with ignore rules:', e);
          }
        }
        if (this.state.repeatabilityFile) {
          try {
            this.state.repeatabilityAnalysis = SemiconductorAnalytics.analyzeRepeatability(this.state.repeatabilityFile, this.state.testIgnoreRules);
            this.resetRepeatabilityFilters();
          } catch (e) {
            console.error('Error re-analyzing Repeatability dataset with ignore rules:', e);
          }
        }
        if (this.state.itemFile) {
          try {
            this.state.itemAnalysis = SemiconductorAnalytics.analyzeItemCompare(this.state.itemFile, this.state.testIgnoreRules);
          } catch (e) {
            console.error('Error re-analyzing Item dataset with ignore rules:', e);
          }
        }

        // Only update charts and table DOM for the currently active tab to prevent rendering on 0-width hidden canvases
        const activeTab = this.state.activeTab || 'overview';
        try {
          if (activeTab === 'overview') {
            this.updateOverviewUi();
          } else if (activeTab === 'repeatability') {
            this.updateRepeatabilityUi();
          } else if (activeTab === 'tsr') {
            this.updateTsrUi();
          } else if (activeTab === 'dsa') {
            this.updateDsaUi();
          } else if (activeTab === 'item') {
            this.updateItemUi();
          } else if (activeTab === 'bin') {
            this.updateBinUi();
          }
        } catch (uiErr) {
          console.error(`Error updating UI for active tab ${activeTab}:`, uiErr);
        }

        this.updateGlobalIgnoreBadge();
        if (this.state.isTestIgnoreModalOpen) {
          this.updateModalIgnoreStats();
        }

        const ignoredTotal = (this.state.dsaAnalysis?.ignoredCount || 0) + (this.state.tsrAnalysis?.ignoredCount || 0) + (this.state.repeatabilityAnalysis?.ignoredCount || 0) + (this.state.itemAnalysis?.ignoredCount || 0);
        if (this.state.testIgnoreRules.length > 0) {
          this.showToast(`🚫 Test Ignore Active: [${cleanInput}] (${ignoredTotal} item(s) excluded)`, 'info');
        } else {
          this.showToast(`↺ Test Ignore cleared. Showing all test items.`, 'info');
        }
      }
    } catch (err) {
      console.error('Failed to apply test ignore input:', err);
      this.showToast('⚠️ Error updating Test Ignore filter', 'warning');
    }
  }

  clearTestIgnore() {
    this.setTestIgnoreInput('', true);
  }

  addIgnorePreset(term) {
    const cur = this.state.testIgnoreInput ? this.state.testIgnoreInput.trim() : '';
    const newRule = `not ${term}`;
    const combined = cur ? `${cur}, ${newRule}` : newRule;
    this.setTestIgnoreInput(combined, true);
    if (this.state.isTestIgnoreModalOpen) {
      this.updateModalIgnoreStats();
    }
  }

  openTestIgnoreModal() {
    this.state.isTestIgnoreModalOpen = true;
    const modal = document.getElementById('testIgnoreModal');
    const input = document.getElementById('modalTestIgnoreInput');
    if (input) input.value = this.state.testIgnoreInput;

    this.updateModalIgnoreStats();

    if (modal) modal.classList.add('open');
    document.body.classList.add('drawer-open');
  }

  closeTestIgnoreModal() {
    this.state.isTestIgnoreModalOpen = false;
    const modal = document.getElementById('testIgnoreModal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }

  updateModalIgnoreStats() {
    const dsa = this.state.dsaAnalysis;
    const tsr = this.state.tsrAnalysis;
    const rep = this.state.repeatabilityAnalysis;

    const dsaIgnored = document.getElementById('modalDsaIgnoredCount');
    const dsaTotal = document.getElementById('modalDsaTotalCount');
    const tsrIgnored = document.getElementById('modalTsrIgnoredCount');
    const tsrTotal = document.getElementById('modalTsrTotalCount');
    const repIgnored = document.getElementById('modalRepIgnoredCount');
    const repTotal = document.getElementById('modalRepTotalCount');
    const rulesBadge = document.getElementById('modalIgnoreActiveRulesBadge');

    if (dsaIgnored) dsaIgnored.textContent = dsa ? `${dsa.ignoredCount}` : '0';
    if (dsaTotal) dsaTotal.textContent = dsa ? `${dsa.totalRawParameters}` : '0';
    if (tsrIgnored) tsrIgnored.textContent = tsr ? `${tsr.ignoredCount}` : '0';
    if (tsrTotal) tsrTotal.textContent = tsr ? `${tsr.totalRawParameters}` : '0';
    if (repIgnored) repIgnored.textContent = rep ? `${rep.ignoredCount}` : '0';
    if (repTotal) repTotal.textContent = rep ? `${rep.totalRawRecords}` : '0';

    if (rulesBadge) {
      const cnt = this.state.testIgnoreRules.length;
      rulesBadge.textContent = cnt > 0 ? `${cnt} Active Rule(s)` : 'No Rules Active';
      rulesBadge.className = cnt > 0 ? 'status-pill pill-amber text-[10px]' : 'status-pill pill-cyan text-[10px]';
    }
  }

  updateGlobalIgnoreBadge() {
    const badge = document.getElementById('testIgnoreBadge');
    if (!badge) return;
    const rules = this.state.testIgnoreRules || [];
    let totalIgnored = 0;
    if (this.state.dsaAnalysis) totalIgnored += (this.state.dsaAnalysis.ignoredCount || 0);
    if (this.state.tsrAnalysis) totalIgnored += (this.state.tsrAnalysis.ignoredCount || 0);
    if (this.state.repeatabilityAnalysis) totalIgnored += (this.state.repeatabilityAnalysis.ignoredCount || 0);

    if (rules.length > 0 && totalIgnored > 0) {
      badge.textContent = `${totalIgnored} Ignored`;
      badge.classList.remove('hidden');
    } else if (rules.length > 0) {
      badge.textContent = `Active (${rules.length})`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  traceIgnoredTests(source = 'dsa') {
    try {
      let analysis;
      if (source === 'dsa') analysis = this.state.dsaAnalysis;
      else if (source === 'tsr') analysis = this.state.tsrAnalysis;
      else if (source === 'repeatability') analysis = this.state.repeatabilityAnalysis;
      else if (source === 'item') analysis = this.state.itemAnalysis;

      if (!analysis || !analysis.ignoredRows || analysis.ignoredRows.length === 0) {
        this.showToast('ℹ️ No tests currently ignored under active rules.', 'info');
        return;
      }

      const rulesStr = (analysis.ignoreRules || []).map(r => `[${r}]`).join(', ');
      const safeEsc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const sourceLabel = source === 'repeatability' ? 'Repeatability Analysis' : source.toUpperCase();
      const countUnit = source === 'repeatability' ? 'records' : 'parameters';

      window.traceManager.trace(
        `Ignored Tests (${sourceLabel}): ${analysis.ignoredCount} ${countUnit}`,
        `Tests excluded from statistical analysis via rules: ${rulesStr}`,
        `<b>Test Ignore Filter Active:</b><br>` +
        `• Excluded Tests: <b>${analysis.ignoredCount}</b> out of ${analysis.totalRawRecords || analysis.totalRawParameters || analysis.totalRecords} total ${countUnit}<br>` +
        `• Active Ignore Rules: <code>${safeEsc(rulesStr)}</code><br>` +
        `• Purpose: Automatically excludes noise/dummy parameters (e.g. PUX, leakage setup) from repeatability statistics and capability rankings.`,
        analysis.ignoredRows,
        null,
        analysis.meta?.rawName || (source === 'repeatability' ? this.state.repeatabilityFile?.filename : '')
      );
    } catch (err) {
      console.error('Error tracing ignored tests:', err);
    }
  }

  showToast(message, type = 'info') {
    if (!document || !document.body || !document.createElement) return;
    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.classList) toast.classList.add('visible');
    }, 50);
    setTimeout(() => {
      if (toast && toast.classList) toast.classList.remove('visible');
      setTimeout(() => {
        if (toast && typeof toast.remove === 'function') {
          toast.remove();
        } else if (toast && toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3500);
  }
}

window.app = new SemiconductorApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
