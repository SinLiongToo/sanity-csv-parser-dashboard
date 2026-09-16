/**
 * Semiconductor Sanity Visualizations & Interactive Charts
 * Chart.js wrapper with dual-axis Pareto, responsive theme awareness (Dark/Light), and click-to-trace bindings.
 */

class DashboardChartsManager {
  constructor() {
    this.charts = {};
  }

  getThemeConfig() {
    const isLight = document.body.classList.contains('light-theme');
    const cfg = {
      isLight,
      textColor: isLight ? '#0f172a' : '#ffffff',
      tickColor: isLight ? '#334155' : '#ffffff',
      gridColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      borderColor: isLight ? '#ffffff' : '#0f1a34',
      cyan: isLight ? '#0284c7' : '#00e5ff',
      green: isLight ? '#16a34a' : '#10b981',
      red: isLight ? '#dc2626' : '#f43f5e',
      amber: isLight ? '#d97706' : '#fbbf24',
      purple: isLight ? '#6d28d9' : '#a855f7',
      barOld: isLight ? '#94a3b8' : '#64748b'
    };
    if (typeof Chart !== 'undefined' && Chart.defaults) {
      Chart.defaults.color = cfg.textColor;
    }
    return cfg;
  }

  destroyChart(id) {
    if (this.charts[id]) {
      this.charts[id].destroy();
      delete this.charts[id];
    }
  }

  destroyAll() {
    Object.keys(this.charts).forEach(id => this.destroyChart(id));
  }

  /**
   * Status Distribution Donut Chart
   */
  renderStatusDonut(canvasId, itemAnalysis, rawRows) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !itemAnalysis) return;

    const t = this.getThemeConfig();
    const labels = [];
    const data = [];
    const colors = [];

    const statusConfig = [
      { key: 'matchCount', label: 'Match', color: t.green },
      { key: 'nameChangeCount', label: 'Name Change', color: t.cyan },
      { key: 'addedCount', label: 'Added', color: '#00b4d8' },
      { key: 'removedCount', label: 'Removed', color: t.red },
      { key: 'limitChangeCount', label: 'Limit Change', color: t.amber },
      { key: 'unitChangeCount', label: 'Unit Change', color: '#d500f9' },
      { key: 'numberChangeCount', label: 'Number Change', color: t.purple },
      { key: 'otherChangeCount', label: 'Other Changes', color: '#90a4ae' }
    ];

    statusConfig.forEach(cfg => {
      const val = itemAnalysis[cfg.key] || 0;
      if (val > 0) {
        labels.push(cfg.label);
        data.push(val);
        colors.push(cfg.color);
      }
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: t.borderColor,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: t.textColor,
              font: { size: 11, family: 'Inter, system-ui' },
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const count = ctx.raw;
                const pct = ((count / itemAnalysis.totalRecords) * 100).toFixed(1);
                return ` ${ctx.label}: ${count} (${pct}%)`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const clickedStatus = labels[index];
              if (!clickedStatus) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => {
                const s = (r.Status || '').toLowerCase();
                return s === clickedStatus.toLowerCase() || s.includes(clickedStatus.toLowerCase());
              });

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Item Status: ${clickedStatus}`,
                  `Filtered items with status '${clickedStatus}'`,
                  `<b>Formula:</b> Count = ${data[index]} / Total ${itemAnalysis.totalRecords} = <b>${((data[index] / itemAnalysis.totalRecords) * 100).toFixed(1)}%</b>`,
                  filtered,
                  null,
                  itemAnalysis.meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Item Pareto Chart (Count bars + Cumulative % line)
   */
  renderItemPareto(canvasId, paretoItems, rawRows, totalRecords, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !paretoItems || paretoItems.length === 0) return;

    const t = this.getThemeConfig();
    const labels = paretoItems.map(p => p.status);
    const counts = paretoItems.map(p => p.count);
    const cumPercents = paretoItems.map(p => p.cumPercent);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Count',
            data: counts,
            backgroundColor: t.cyan,
            yAxisID: 'yCount',
            borderRadius: 4
          },
          {
            label: 'Cumulative %',
            data: cumPercents,
            type: 'line',
            borderColor: t.amber,
            backgroundColor: t.amber,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'yPercent'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 5,
            left: 5,
            right: 10
          }
        },
        scales: {
          x: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          },
          yCount: {
            type: 'linear',
            position: 'left',
            grace: '15%',
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' }, stepSize: 1 },
            grid: { color: t.gridColor },
            title: { display: true, text: 'Record Count', color: t.cyan, font: { size: 11, weight: '700' } }
          },
          yPercent: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 115,
            ticks: {
              color: t.amber,
              stepSize: 20,
              font: { size: 11, weight: '600' },
              callback: val => val <= 100 ? `${val}%` : ''
            },
            grid: { display: false },
            title: { display: true, text: 'Cumulative %', color: t.amber, font: { size: 11, weight: '700' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: t.textColor, font: { size: 11, weight: '700' }, padding: 15 }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const clickedStatus = labels[index];
              if (!clickedStatus) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => (r.Status || '').toLowerCase() === clickedStatus.toLowerCase());

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Pareto Item: ${clickedStatus}`,
                  `Ranked #${index + 1} status contributor`,
                  `<b>Formula:</b> Individual Count = ${counts[index]} (${((counts[index] / totalRecords) * 100).toFixed(1)}%), Cumulative % = <b>${cumPercents[index].toFixed(1)}%</b>`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * DSA Category Pareto Horizontal Bar
   */
  renderDsaPareto(canvasId, dsaAnalysis, rawRows) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !dsaAnalysis) return;

    const t = this.getThemeConfig();
    const labels = ['Cat A (Critical)', 'Cat B (Major)', 'Cat C (Shift)', 'Other / Pass'];
    const data = [
      dsaAnalysis.categoryCounts.A,
      dsaAnalysis.categoryCounts.B,
      dsaAnalysis.categoryCounts.C,
      dsaAnalysis.categoryCounts.F + dsaAnalysis.categoryCounts.Other
    ];
    const colors = [t.red, t.amber, t.cyan, t.green];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Parameter Count',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: t.tickColor },
            grid: { color: t.gridColor }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 11 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const count = ctx.raw;
                const pct = ((count / dsaAnalysis.totalParameters) * 100).toFixed(1);
                return ` Count: ${count} (${pct}%)`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const groupKey = ['A', 'B', 'C', 'F'][index];
              if (!groupKey) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => {
                const g = (r.DSA_Group || '').trim().toUpperCase();
                return groupKey === 'F' ? (g !== 'A' && g !== 'B' && g !== 'C') : g === groupKey;
              });

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `DSA Category ${groupKey}`,
                  `Parameters evaluated in DSA group ${groupKey}`,
                  `<b>Formula:</b> ${data[index]} parameters out of ${dsaAnalysis.totalParameters} total = <b>${((data[index] / dsaAnalysis.totalParameters) * 100).toFixed(1)}%</b>`,
                  filtered,
                  null,
                  dsaAnalysis.meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Top 10 Contributors Horizontal Ranked Bar (Grouped by ':' prefix or parameter)
   */
  renderTopContributors(canvasId, topContributors, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !topContributors || topContributors.length === 0) return;

    const t = this.getThemeConfig();
    const labels = topContributors.map(c => {
      if (c.abcCount !== undefined && c.totalCount > 1) {
        return `${c.testName} (${c.totalCount} tests) [Cat ${c.group}]`;
      }
      return `${c.testName} [${c.group}]`;
    });

    const data = topContributors.map(c => {
      if (c.severityScore) return c.severityScore;
      return Math.max(c.deltaMean || 0, c.deltaSigma || 0, c.sigmaRatio || 1);
    });

    const colors = topContributors.map(c => {
      if (c.group === 'A') return t.red;
      if (c.group === 'B') return t.amber;
      if (c.group === 'C') return t.cyan;
      return t.green;
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Severity / Impact Score',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: {
              color: t.tickColor,
              callback: (val) => `${val}`
            },
            grid: { color: t.gridColor },
            title: {
              display: true,
              text: 'Shift Severity Index (0 – 100 Normalized Risk)',
              color: t.tickColor,
              font: { size: 11, weight: '700' }
            }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 10 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Severity Score: ${ctx.raw.toFixed(1)} / 100`,
              afterLabel: (ctx) => {
                const item = topContributors[ctx.dataIndex];
                if (!item) return [];
                if (item.catACount !== undefined && item.totalCount > 1) {
                  return [
                    `Module: ${item.prefix} (${item.totalCount} tests)`,
                    `Category: Cat ${item.group} (${item.shiftType})`,
                    `Breakdown: Cat A=${item.catACount}, Cat B=${item.catBCount}, Cat C=${item.catCCount}`,
                    `Max ΔMean: ${(item.deltaMean || 0).toFixed(4)}`,
                    `Max Sigma Ratio: ${(item.sigmaRatio || 1).toFixed(3)}`
                  ];
                }
                return [
                  `Stage: ${item.stage}`,
                  `Category: Cat ${item.group} (${item.shiftType})`,
                  `Delta Mean (Δμ): ${(item.deltaMean || 0).toFixed(4)}`,
                  `Delta Sigma (Δσ): ${(item.deltaSigma || 0).toFixed(4)}`,
                  `Sigma Ratio: ${(item.sigmaRatio || 1).toFixed(3)}`
                ];
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const item = topContributors[index];
              if (!item) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = item.records || (item.rawRecord ? [item.rawRecord] : safeRows);

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Top Contributor (${item.prefix || item.testName})`,
                  `Rank #${index + 1} shift contributor • Category ${item.group} • ${item.shiftType} • Severity Index ${item.severityScore.toFixed(1)} / 100`,
                  `<b>Shift Assessment Metrics:</b><br>` +
                  `• Parameter / Module: <b>${item.prefix || item.testName}</b><br>` +
                  `• Category: <b>Cat ${item.group}</b> (${item.shiftType})<br>` +
                  `• Standardized Severity Score: <b>${item.severityScore.toFixed(1)} / 100</b><br>` +
                  `• Mean Shift (ΔMean): <b>${(item.deltaMean || 0).toFixed(4)}</b> | Sigma Ratio: <b>${(item.sigmaRatio || 1).toFixed(3)}</b><br>` +
                  (item.totalCount > 1 ? `• Module Total Tests: <b>${item.totalCount}</b> (Cat A: ${item.catACount}, Cat B: ${item.catBCount}, Cat C: ${item.catCCount})` : ''),
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Comparative Dual-Axis Pareto Chart for Hard Bin, Soft Bin, and First Fail Items (OLD vs NEW)
   */
  renderBinComparativePareto(canvasId, paretoItems, mode = 'hard', isFailOnly = false, meta = null, barSpacing = 55) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Dynamically adjust inner wrapper width for smooth x-axis scrolling
    const innerWrapper = document.getElementById('binParetoInnerWrapper');
    const scrollWrapper = document.getElementById('binParetoScrollWrapper');
    if (innerWrapper && scrollWrapper && paretoItems && paretoItems.length > 0) {
      const containerWidth = scrollWrapper.clientWidth || 600;
      const minRequiredWidth = Math.max(containerWidth, paretoItems.length * barSpacing);
      innerWrapper.style.width = `${minRequiredWidth}px`;
    } else if (innerWrapper) {
      innerWrapper.style.width = '100%';
    }

    const t = this.getThemeConfig();

    if (!paretoItems || paretoItems.length === 0) {
      this.charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['No Data Available'],
          datasets: [{ data: [0], backgroundColor: 'transparent' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
      return;
    }

    const labels = paretoItems.map(p => p.displayName || p.binName || p.testName || 'N/A');
    const oldCounts = paretoItems.map(p => p.oldCount || 0);
    const newCounts = paretoItems.map(p => p.newCount || 0);
    const cumOldPcts = paretoItems.map(p => p.cumOldPct || 0);
    const cumNewPcts = paretoItems.map(p => p.cumNewPct || 0);

    const modeLabels = {
      hard: 'Hard Bin',
      soft: 'Soft Bin',
      firstfail: 'First Fail Parameter'
    };
    const currentModeName = modeLabels[mode] || 'Bin';

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'OLD Stage Count',
            data: oldCounts,
            backgroundColor: t.isLight ? 'rgba(100, 116, 139, 0.65)' : 'rgba(100, 116, 139, 0.75)',
            borderColor: t.barOld,
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'yCount',
            order: 3
          },
          {
            label: 'NEW Stage Count',
            data: newCounts,
            backgroundColor: isFailOnly ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 229, 255, 0.85)',
            borderColor: isFailOnly ? t.red : t.cyan,
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'yCount',
            order: 4
          },
          {
            label: 'OLD Cumulative %',
            data: cumOldPcts,
            type: 'line',
            borderColor: t.isLight ? '#94a3b8' : '#cbd5e1',
            backgroundColor: t.isLight ? '#94a3b8' : '#cbd5e1',
            borderDash: [5, 4],
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'yPercent',
            order: 2
          },
          {
            label: 'NEW Cumulative %',
            data: cumNewPcts,
            type: 'line',
            borderColor: t.amber,
            backgroundColor: t.amber,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'yPercent',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 15,
            bottom: 5,
            left: 5,
            right: 15
          }
        },
        scales: {
          x: {
            ticks: {
              color: t.textColor,
              font: { size: 11, weight: '600' },
              maxRotation: 35,
              minRotation: 0
            },
            grid: { display: false }
          },
          yCount: {
            type: 'linear',
            position: 'left',
            grace: '10%',
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' }, stepSize: 1 },
            grid: { color: t.gridColor },
            title: { display: true, text: 'Dice Fallout Count', color: t.cyan, font: { size: 11, weight: '700' } }
          },
          yPercent: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 110,
            ticks: {
              color: t.amber,
              stepSize: 20,
              font: { size: 11, weight: '600' },
              callback: val => val <= 100 ? `${val}%` : ''
            },
            grid: { display: false },
            title: { display: true, text: 'Cumulative Loss %', color: t.amber, font: { size: 11, weight: '700' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: t.textColor,
              font: { size: 11, weight: '600' },
              padding: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0]?.dataIndex;
                const item = paretoItems[idx];
                return item ? `${currentModeName}: ${item.displayName}` : '';
              },
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0]?.dataIndex;
                const item = paretoItems[idx];
                if (!item) return [];
                const sign = item.deltaCount >= 0 ? '+' : '';
                const pctSign = item.deltaPct >= 0 ? '+' : '';
                return [
                  `----------------------------------------`,
                  `OLD Stage: ${item.oldCount} dice (${item.oldPct.toFixed(2)}%) | Cum: ${item.cumOldPct.toFixed(1)}%`,
                  `NEW Stage: ${item.newCount} dice (${item.newPct.toFixed(2)}%) | Cum: ${item.cumNewPct.toFixed(1)}%`,
                  `Delta (NEW-OLD): ${sign}${item.deltaCount} dice (${pctSign}${item.deltaPct.toFixed(2)}%)`,
                  `Type: ${item.isPass ? 'PASS BIN' : 'FAIL / LOSS ITEM'}`
                ];
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const item = paretoItems[index];
              if (!item) return;

              const records = [];
              if (item.oldRaw) records.push({ Stage: 'OLD Stage', ...item.oldRaw });
              if (item.newRaw) records.push({ Stage: 'NEW Stage', ...item.newRaw });
              if (records.length === 0) records.push(item);

              const sign = item.deltaCount >= 0 ? '+' : '';
              const pctSign = item.deltaPct >= 0 ? '+' : '';

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `${currentModeName} Pareto: ${item.displayName}`,
                  `Comparative Pareto Distribution (#Rank ${index + 1})`,
                  `<b>${currentModeName} Performance Comparison:</b><br>` +
                  `• <b>OLD Stage:</b> ${item.oldCount} dice (${item.oldPct.toFixed(2)}%) — Cumulative: <b>${item.cumOldPct.toFixed(1)}%</b><br>` +
                  `• <b>NEW Stage:</b> ${item.newCount} dice (${item.newPct.toFixed(2)}%) — Cumulative: <b>${item.cumNewPct.toFixed(1)}%</b><br>` +
                  `• <b>Delta:</b> <b>${sign}${item.deltaCount} dice</b> (${pctSign}${item.deltaPct.toFixed(2)}%)<br>` +
                  `• <b>Classification:</b> ${item.isPass ? '<span class="text-green font-bold">PASS POPULATION</span>' : '<span class="text-red font-bold">FAILURE FALLOUT</span>'}`,
                  records,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Bin Comparison Bar Chart (OLD vs NEW Hard Bins)
   */
  renderBinComparison(canvasId, binAnalysis) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !binAnalysis) return;

    const t = this.getThemeConfig();
    const oldBins = binAnalysis.oldHardBin || [];
    const newBins = binAnalysis.newHardBin || [];

    // Collect all bin names
    const allBinNames = Array.from(new Set([
      ...oldBins.map(b => b.OLD_BinName),
      ...newBins.map(b => b.NEW_BinName)
    ])).filter(Boolean);

    const oldData = allBinNames.map(name => {
      const match = oldBins.find(b => b.OLD_BinName === name);
      return match ? parseFloat((match.Percentage || '0').replace('%', '')) : 0;
    });

    const newData = allBinNames.map(name => {
      const match = newBins.find(b => b.NEW_BinName === name);
      return match ? parseFloat((match.Percentage || '0').replace('%', '')) : 0;
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allBinNames,
        datasets: [
          {
            label: 'OLD Stage (%)',
            data: oldData,
            backgroundColor: t.barOld,
            borderRadius: 4
          },
          {
            label: 'NEW Stage (%)',
            data: newData,
            backgroundColor: t.cyan,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: t.textColor },
            grid: { display: false }
          },
          y: {
            ticks: { color: t.tickColor, callback: val => `${val}%` },
            grid: { color: t.gridColor },
            title: { display: true, text: 'Bin Percentage (%)', color: t.tickColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: t.textColor }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const binName = allBinNames[index];
              if (!binName) return;
              const oldRow = oldBins.find(b => b.OLD_BinName === binName) || {};
              const newRow = newBins.find(b => b.NEW_BinName === binName) || {};

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Bin Compare: ${binName}`,
                  `Hard bin yield comparison`,
                  `<b>Comparison Breakdown:</b><br>` +
                  `• OLD Stage: Count <b>${oldRow.Count || 0}</b> (${oldRow.Percentage || '0%'})<br>` +
                  `• NEW Stage: Count <b>${newRow.Count || 0}</b> (${newRow.Percentage || '0%'})<br>` +
                  `• Delta: <b>${(newData[index] - oldData[index]).toFixed(2)}%</b>`,
                  [
                    { Dataset: 'OLD Stage', ...oldRow },
                    { Dataset: 'NEW Stage', ...newRow }
                  ],
                  ['Dataset', 'OLD_Hardbin', 'NEW_Hardbin', 'OLD_BinName', 'NEW_BinName', 'OLD_BinState', 'NEW_BinState', 'Count', 'Percentage'],
                  binAnalysis.meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Binstate Transitions Donut Chart
   */
  renderTransitionsDonut(canvasId, binAnalysis) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !binAnalysis || !binAnalysis.transitions) return;

    const t = this.getThemeConfig();
    const labels = [];
    const data = [];
    const colors = [];

    binAnalysis.transitions.forEach(trObj => {
      const tr = (trObj.Transition || '').toLowerCase();
      const cnt = parseInt(trObj.Count) || 0;
      let label = trObj.Transition;
      let clr = t.textColor;

      if (tr === 'pp') { label = 'pp (Pass ➔ Pass)'; clr = t.green; }
      else if (tr === 'ff') { label = 'ff (Fail ➔ Fail)'; clr = '#64748b'; }
      else if (tr === 'pf') { label = 'pf (Pass ➔ Fail - Critical!)'; clr = t.red; }
      else if (tr === 'fp') { label = 'fp (Fail ➔ Pass)'; clr = t.cyan; }

      labels.push(label);
      data.push(cnt);
      colors.push(clr);
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: t.borderColor,
          borderWidth: 2,
          cutout: '65%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: t.textColor, font: { size: 10 }, padding: 8 }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const tRow = binAnalysis.transitions[index];
              if (!tRow) return;
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Binstate Transition: ${tRow.Transition}`,
                  `Switch state distribution (${tRow.Percentage})`,
                  `<b>Formula:</b> Transition ${tRow.Transition} = ${tRow.Count} dice / ${binAnalysis.totalTested} total tested = <b>${tRow.Percentage}</b>`,
                  [tRow],
                  ['Transition', 'Count', 'Percentage'],
                  binAnalysis.meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * TSR Parameter Pareto Chart (Fail Count + Cumulative Loss %)
   */
  renderTsrPareto(canvasId, paretoParams, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const t = this.getThemeConfig();

    if (!paretoParams || paretoParams.length === 0) {
      this.charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['No Parameters in Selected Group'],
          datasets: [{ data: [0], backgroundColor: 'transparent' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: t.textColor, font: { size: 10 } }, grid: { display: false } },
            y: { ticks: { color: t.tickColor }, grid: { color: t.gridColor }, min: 0, max: 10 }
          },
          plugins: { legend: { display: false } }
        }
      });
      return;
    }

    // Safely cap to Top 40 worst failure parameters to prevent GPU canvas layout bottleneck
    const displayList = paretoParams.slice(0, 40);

    // Dynamically adjust inner wrapper width if items exceed normal display
    const innerWrapper = document.getElementById('tsrParetoInnerWrapper');
    const scrollWrapper = document.getElementById('tsrParetoScrollWrapper');
    if (innerWrapper && scrollWrapper && displayList.length > 0) {
      const containerWidth = scrollWrapper.clientWidth || 500;
      const minRequiredWidth = Math.min(2400, Math.max(containerWidth, displayList.length * 48));
      innerWrapper.style.width = `${minRequiredWidth}px`;
    } else if (innerWrapper) {
      innerWrapper.style.width = '100%';
    }

    const labels = displayList.map(p => p.testName);
    const failCounts = displayList.map(p => p.failCount);
    const cumLossPcts = displayList.map(p => p.cumLossPct || 0);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fail Count (Dice)',
            data: failCounts,
            backgroundColor: t.red,
            yAxisID: 'yCount',
            borderRadius: 4,
            order: 2
          },
          {
            label: 'Cumulative Loss %',
            data: cumLossPcts,
            type: 'line',
            borderColor: t.amber,
            backgroundColor: t.amber,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
            yAxisID: 'yPercent',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 5,
            left: 5,
            right: 10
          }
        },
        scales: {
          x: {
            ticks: {
              color: t.textColor,
              font: { size: 11, weight: '600' },
              maxRotation: 35,
              minRotation: 0,
              callback: function(value) {
                const label = this.getLabelForValue(value) || '';
                return label.length > 22 ? label.substring(0, 20) + '…' : label;
              }
            },
            grid: { display: false }
          },
          yCount: {
            type: 'linear',
            position: 'left',
            grace: '15%',
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' } },
            grid: { color: t.gridColor },
            title: { display: true, text: 'Fail Count (Dice)', color: t.red, font: { size: 11, weight: '700' } }
          },
          yPercent: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 115,
            ticks: {
              color: t.amber,
              stepSize: 20,
              font: { size: 11, weight: '600' },
              callback: val => val <= 100 ? `${val}%` : ''
            },
            grid: { display: false },
            title: { display: true, text: 'Cumulative Loss %', color: t.amber, font: { size: 11, weight: '700' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: t.textColor,
              font: { size: 11, weight: '700' },
              padding: 15
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const param = displayList[index] || paretoParams[index];
              if (!param) return;
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Parameter Loss Pareto: ${param.testName}`,
                  `Rank #${index + 1} test failure contributor`,
                  `<b>Trace Calculation:</b><br>` +
                  `• Fail Count: <b>${param.failCount} dice</b> (Loss: <b>${param.lossPct}%</b>)<br>` +
                  `• Cumulative Loss: <b>${(param.cumLossPct || 0).toFixed(1)}%</b><br>` +
                  `• CPK: <b>${param.cpkn}</b> (${param.cpknGroup}) | Distribution: <b>${param.distribution}</b><br>` +
                  `• Limits: [${param.loLimit}, ${param.hiLimit}] ${param.units}`,
                  [param.rawRecord],
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * TSR CPK Group Donut Chart (All distinct groups from CSV presented dynamically)
   */
  renderTsrCpkDonut(canvasId, allCpkGroupsTable, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !allCpkGroupsTable || allCpkGroupsTable.length === 0) return;

    const t = this.getThemeConfig();
    const labels = allCpkGroupsTable.map(g => g.name);
    const counts = allCpkGroupsTable.map(g => g.count);
    const colors = allCpkGroupsTable.map(g => g.hexColor || t.cyan);
    const total = counts.reduce((a, b) => a + b, 0);

    // If too many groups (> 5), hide donut legend to keep donut clear & let scrollable matrix table below handle all groups
    const showDonutLegend = allCpkGroupsTable.length <= 5;

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderColor: t.borderColor,
          borderWidth: 2,
          cutout: '58%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showDonutLegend,
            position: 'bottom',
            labels: {
              color: t.textColor,
              font: { size: 12, weight: '700' },
              padding: 10,
              generateLabels: (chart) => {
                return allCpkGroupsTable.map((cfg, i) => {
                  const shortName = cfg.name.length > 22 ? cfg.name.slice(0, 20) + '…' : cfg.name;
                  return {
                    text: `${shortName}: ${cfg.count} (${cfg.percentage})`,
                    fillStyle: cfg.hexColor,
                    strokeStyle: t.borderColor,
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                    fontColor: t.textColor
                  };
                });
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = allCpkGroupsTable[ctx.dataIndex];
                return ` ${item.name}: ${item.count} params (${item.percentage})`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            let clickedGroup = '';
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              clickedGroup = labels[elements[0].index];
            }
            if (clickedGroup) {
              // Dynamically filter left Pareto chart to this group
              if (window.app && typeof window.app.setTsrCpkGroupFilter === 'function') {
                window.app.setTsrCpkGroupFilter(clickedGroup);
              }

              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const normKey = clickedGroup.toLowerCase().replace(/\s+/g, '');
              const filtered = safeRows.filter(r => {
                const g = (r.Cpkn_Group || '').trim();
                const normG = g.toLowerCase().replace(/\s+/g, '');
                if (g === clickedGroup || normG === normKey) return true;
                const cpkn = parseFloat(r.Cpkn) || 0;
                if (clickedGroup.includes('0.5') && !clickedGroup.includes('1.67')) return cpkn < 0.5 || g.includes('<0.5') || g.includes('< 0.5');
                if (clickedGroup.includes('1.67') && clickedGroup.includes('0.5')) return g.includes('0.5') || (cpkn >= 0.5 && cpkn < 1.67);
                if (clickedGroup.includes('1.67') && clickedGroup.includes('4')) return g.includes('1.67') || (cpkn >= 1.67 && cpkn < 4);
                if (clickedGroup.includes('> 4') || clickedGroup.includes('>4')) return cpkn >= 4 || g.includes('>4') || g.includes('> 4');
                return false;
              });

              const grpInfo = allCpkGroupsTable.find(g => g.key === clickedGroup || g.name === clickedGroup) || { count: filtered.length, percentage: '' };

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `CPK Capability Group: ${clickedGroup}`,
                  `${grpInfo.count} parameters classified under "${clickedGroup}" • (Left Pareto updated)`,
                  `<b>Group Filter:</b> <b>${clickedGroup}</b> &bull; Count = <b>${grpInfo.count}</b> (${grpInfo.percentage})<br>` +
                  `<i>💡 The Parameter Failure Pareto chart on the left is now showing parameters in this group.</i>`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * TSR Distribution Shape Bar Chart (Dynamic from CSV contents with scroll container)
   */
  renderTsrDistBar(canvasId, allDistShapesTable, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !allDistShapesTable || allDistShapesTable.length === 0) return;

    // Dynamically adjust height of canvas if there are many shapes
    if (allDistShapesTable.length > 5 && ctx.parentElement) {
      const targetHeight = Math.max(300, allDistShapesTable.length * 34);
      ctx.style.height = `${targetHeight}px`;
    } else if (ctx) {
      ctx.style.height = '';
    }

    const t = this.getThemeConfig();
    const labels = allDistShapesTable.map(d => {
      const shortName = d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name;
      return `${shortName} (${d.count})`;
    });
    const data = allDistShapesTable.map(d => d.count);
    const colors = allDistShapesTable.map(d => d.hexColor || t.green);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Parameter Count',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' }, stepSize: 1 },
            grid: { color: t.gridColor }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return '';
                const item = allDistShapesTable[items[0].dataIndex];
                return item ? item.name : '';
              },
              label: (ctx) => {
                const item = allDistShapesTable[ctx.dataIndex];
                if (!item) return '';
                return ` Parameter Count: ${item.count} (${item.percentage})`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const index = elements[0].index;
              const item = allDistShapesTable[index];
              if (!item) return;
              const clickedType = item.name;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => {
                const d = (r.Distribution || '').trim();
                if (d === clickedType) return true;
                return d.toLowerCase().includes(clickedType.toLowerCase());
              });

              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Distribution Shape: ${clickedType}`,
                  `Parameters classified under "${clickedType}" distribution shape`,
                  `<b>Distribution Statistics:</b> ${item.count} parameters (<b>${item.percentage}</b>) exhibit ${clickedType} morphology (Skewness & Kurtosis).`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Repeatability Dist Categorical Histogram / Frequency Bar Chart
   */
  renderRepeatabilityDistChart(canvasId, distTable, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !distTable || distTable.length === 0) return;

    const t = this.getThemeConfig();
    const sorted = [...distTable].sort((a, b) => b.count - a.count);
    const labels = sorted.map(d => `${d.name} (${d.count})`);
    const data = sorted.map(d => d.count);
    const colors = sorted.map(d => d.hexColor || t.cyan);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequency Count',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Frequency (Count)', color: t.tickColor, font: { size: 10, weight: '600' } },
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' } },
            grid: { color: t.gridColor }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return '';
                const item = sorted[items[0].dataIndex];
                return item ? item.name : '';
              },
              label: (ctx) => {
                const item = sorted[ctx.dataIndex];
                return ` Frequency: ${item.count} measurements (${item.percentage})`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const item = sorted[elements[0].index];
              if (!item) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => (r.Dist || '').trim() === item.name);
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Repeatability Dist: ${item.name}`,
                  `${item.count} measurements classified under "${item.name}" Dist morphology`,
                  `<b>Dist Category:</b> <b>${item.name}</b> &bull; Count = <b>${item.count}</b> (${item.percentage})`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Repeatability Dist_Repeat Histogram / Frequency Bar Chart
   */
  renderRepeatabilityDistRepeatChart(canvasId, distRepeatTable, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !distRepeatTable || distRepeatTable.length === 0) return;

    const t = this.getThemeConfig();
    const sorted = [...distRepeatTable].sort((a, b) => b.count - a.count);
    const labels = sorted.map(d => `${d.name} (${d.count})`);
    const data = sorted.map(d => d.count);
    const colors = sorted.map(d => d.hexColor || t.green);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequency Count',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Frequency (Count)', color: t.tickColor, font: { size: 10, weight: '600' } },
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' } },
            grid: { color: t.gridColor }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return '';
                const item = sorted[items[0].dataIndex];
                return item ? item.name : '';
              },
              label: (ctx) => {
                const item = sorted[ctx.dataIndex];
                return ` Frequency: ${item.count} measurements (${item.percentage})`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const item = sorted[elements[0].index];
              if (!item) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => (r.Dist_Repeat || '').trim() === item.name);
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Repeatability Dist_Repeat: ${item.name}`,
                  `${item.count} measurements with "${item.name}" repeatability pattern`,
                  `<b>Dist_Repeat Classification:</b> <b>${item.name}</b> &bull; Count = <b>${item.count}</b> (${item.percentage})`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Repeatability Trend Horizontal Bar Chart
   */
  renderRepeatabilityTrendChart(canvasId, trendTable, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !trendTable || trendTable.length === 0) return;

    const t = this.getThemeConfig();
    const labels = trendTable.map(d => `${d.name} (${d.count})`);
    const data = trendTable.map(d => d.count);
    const colors = trendTable.map(d => d.hexColor || t.amber);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Measurement Count',
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: t.tickColor, font: { size: 11, weight: '600' } },
            grid: { color: t.gridColor }
          },
          y: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return '';
                const item = trendTable[items[0].dataIndex];
                return item ? item.name : '';
              },
              label: (ctx) => {
                const item = trendTable[ctx.dataIndex];
                return ` Measurements: ${item.count} (${item.percentage})`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const item = trendTable[elements[0].index];
              if (!item) return;
              const safeRows = Array.isArray(rawRows) ? rawRows : [];
              const filtered = safeRows.filter(r => (r.Trend || '').trim() === item.name);
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Repeatability Trend: ${item.name}`,
                  `${item.count} measurements exhibiting "${item.name}" behavior`,
                  `<b>Trend Pattern:</b> <b>${item.name}</b> &bull; Count = <b>${item.count}</b> (${item.percentage})`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }

  /**
   * Repeatability Test Parameter CV% and Cp Bar Chart
   */
  renderRepeatabilityTestCvChart(canvasId, perTestStats, rawRows, meta) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !perTestStats || perTestStats.length === 0) return;

    const t = this.getThemeConfig();
    const sorted = [...perTestStats].sort((a, b) => Math.abs(b.meanCv) - Math.abs(a.meanCv));
    const displayList = sorted.slice(0, 40);
    const labels = displayList.map(s => s.testName);
    const cvData = displayList.map(s => parseFloat(s.meanCv.toFixed(2)));
    const cpData = displayList.map(s => parseFloat(s.meanCp.toFixed(2)));

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg CV (%)',
            data: cvData,
            backgroundColor: t.purple,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Avg Cp',
            data: cpData,
            backgroundColor: t.cyan,
            borderRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: t.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'CV (%)', color: t.purple, font: { size: 11, weight: '700' } },
            ticks: { color: t.purple, font: { size: 11 } },
            grid: { color: t.gridColor }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Cp', color: t.cyan, font: { size: 11, weight: '700' } },
            ticks: { color: t.cyan, font: { size: 11 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: t.textColor, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                if (!items || items.length === 0) return '';
                const idx = items[0].dataIndex;
                const stat = displayList[idx];
                return stat ? `Min Cp: ${stat.minCp.toFixed(2)} | Max CV%: ${stat.maxCv.toFixed(2)}%\nDominant Trend: ${stat.dominantTrend}` : '';
              }
            }
          }
        },
        onClick: (event, elements) => {
          try {
            if (elements && elements.length > 0 && elements[0].index !== undefined) {
              const stat = displayList[elements[0].index];
              if (!stat) return;
              const filtered = (stat.items || []).map(i => i.raw).filter(Boolean);
              if (window.traceManager && typeof window.traceManager.trace === 'function') {
                window.traceManager.trace(
                  `Repeatability Test: ${stat.testName} (${stat.testNum})`,
                  `${filtered.length} ECID measurements across all dice for ${stat.testName}`,
                  `<b>Test Statistics:</b> Avg CV% = <b>${stat.meanCv.toFixed(2)}%</b> &bull; Avg Cp = <b>${stat.meanCp.toFixed(2)}</b> &bull; Min Cp = <b>${stat.minCp.toFixed(2)}</b> &bull; Units = <b>${stat.units}</b>`,
                  filtered,
                  null,
                  meta?.rawName
                );
              }
            }
          } catch (err) {
            console.error('Chart click trace error:', err);
          }
        }
      }
    });
  }
}

window.DashboardChartsManager = DashboardChartsManager;
