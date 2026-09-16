/**
 * Semiconductor Sanity CSV Parser - PowerPoint & PDF Export Module
 * Generates executive presentation slides formatted strictly according to DSA.txt and sanity_ITEM COMPARSION.txt specifications.
 * Strictly calibrated to 16:9 (13.33" x 7.5") slide dimensions to eliminate overflow. Supports Dark and Light themes.
 */

class SemiconductorExportManager {
  /**
   * Export to PowerPoint (.pptx)
   * @param {Object} appState
   * @param {'dark' | 'light' | 'auto'} themeMode
   */
  static exportPPTX(appState, themeMode = 'auto') {
    if (typeof PptxGenJS === 'undefined') {
      alert('PptxGenJS library is still loading or unavailable.');
      return;
    }

    const isLight = themeMode === 'light' || (themeMode === 'auto' && document.body.classList.contains('light-theme'));

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Semiconductor Sanity & Shift Analysis Executive Summary';

    // Theme Color Palettes (Strict 6-character Hex)
    const THEME = isLight ? {
      BG: 'F1F5F9',
      CARD_BG: 'FFFFFF',
      CARD_BORDER: 'CBD5E1',
      HEADER_FILL: 'E2E8F0',
      TEXT_PRIMARY: '0F172A',
      TEXT_SECONDARY: '475569',
      TEXT_MUTED: '64748B',
      CYAN: '0284C7',
      GREEN: '16A34A',
      RED: 'DC2626',
      AMBER: 'D97706',
      PURPLE: '6D28D9',
      CALLOUT_BG: 'FEE2E2',
      CALLOUT_BORDER: 'EF4444'
    } : {
      BG: '080E1E',
      CARD_BG: '111D38',
      CARD_BORDER: '20335E',
      HEADER_FILL: '19274E',
      TEXT_PRIMARY: 'F8FAFC',
      TEXT_SECONDARY: '94A3B8',
      TEXT_MUTED: '64748B',
      CYAN: '00E5FF',
      GREEN: '00E676',
      RED: 'FF1744',
      AMBER: 'FFAB00',
      PURPLE: '7C4DFF',
      CALLOUT_BG: '3D0C14',
      CALLOUT_BORDER: 'FF1744'
    };

    const item = appState.itemAnalysis;
    const dsa = appState.dsaAnalysis;
    const bin = appState.binAnalysis;

    // =========================================================================
    // SLIDE 1: ITEM COMPARISON SUMMARY (sanity_ITEM COMPARSION.txt)
    // =========================================================================
    if (item) {
      const slide1 = pptx.addSlide();
      slide1.background = { color: THEME.BG };

      // Top Title Bar
      slide1.addText('SANITY CHECK COMPARISON SUMMARY', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide1.addText('OLD vs NEW Program Item Comparison • Structural Integrity & Parameter Shift', {
        x: 0.5, y: 0.52, w: 8.5, h: 0.25,
        fontSize: 9.5, color: THEME.CYAN, fontFace: 'Arial'
      });

      // Report Metadata (Top Right)
      const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
      slide1.addText(`Report: ${ts}\nSource: ${appState.itemFile?.filename || 'itemcompare.csv'}`, {
        x: 9.0, y: 0.2, w: 3.8, h: 0.5,
        fontSize: 8, color: THEME.TEXT_SECONDARY, align: 'right', fontFace: 'Arial'
      });

      // Program Migration Info Panel
      const oldProg = item.meta.oldProgram || 'OLD_PROG';
      const newProg = item.meta.newProgram || 'NEW_PROG';
      const oldStage = item.meta.oldStage || 'CP1';
      const newStage = item.meta.newStage || 'CP1';

      slide1.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.8, w: 12.33, h: 0.38,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide1.addText(`PROGRAM TRANSITION:   [${oldStage}] ${oldProg}   ➔   [${newStage}] ${newProg}`, {
        x: 0.7, y: 0.83, w: 8.0, h: 0.32,
        fontSize: 10, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide1.addText(`ASSESSMENT: ${item.overallAssessment}`, {
        x: 8.8, y: 0.83, w: 3.8, h: 0.32,
        fontSize: 10, bold: true, color: item.assessmentColor === 'green' ? THEME.GREEN : (item.assessmentColor === 'yellow' ? THEME.AMBER : THEME.RED),
        align: 'right', fontFace: 'Arial'
      });

      // 7 Top KPI Cards (y: 1.26, h: 0.58)
      const kpis = [
        { label: 'Total Records', val: item.totalRecords, color: THEME.TEXT_PRIMARY },
        { label: 'Match Count', val: `${item.matchCount} (${item.matchRate.toFixed(1)}%)`, color: THEME.GREEN },
        { label: 'Name Change', val: item.nameChangeCount, color: THEME.CYAN },
        { label: 'Added Count', val: item.addedCount, color: THEME.CYAN },
        { label: 'Removed Count', val: item.removedCount, color: THEME.RED },
        { label: 'Limit Change', val: item.limitChangeCount, color: THEME.AMBER },
        { label: 'Change Rate', val: `${item.changeRate.toFixed(1)}%`, color: item.changeRate < 3 ? THEME.GREEN : (item.changeRate <= 10 ? THEME.AMBER : THEME.RED) }
      ];

      const cardW = 1.68;
      const gap = 0.09;
      kpis.forEach((k, idx) => {
        const xPos = 0.5 + idx * (cardW + gap);
        slide1.addShape(pptx.ShapeType.roundRect, {
          x: xPos, y: 1.26, w: cardW, h: 0.58,
          fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }, rectRadius: 0.04
        });
        slide1.addText(k.label, {
          x: xPos, y: 1.28, w: cardW, h: 0.22,
          fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
        });
        slide1.addText(String(k.val), {
          x: xPos, y: 1.48, w: cardW, h: 0.32,
          fontSize: 10.5, bold: true, color: k.color, align: 'center', fontFace: 'Arial'
        });
      });

      // Left Column: Scorecard (x: 0.5, y: 1.92, w: 4.8, h: 4.85)
      slide1.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.92, w: 4.8, h: 4.85,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide1.addText('STATUS BREAKDOWN & SCORECARD', {
        x: 0.6, y: 1.98, w: 4.5, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const scoreRows = [
        [{ text: 'Metric', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Count', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Rate', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Threshold', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Risk Rating', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }]
      ];

      item.scorecard.forEach(sc => {
        scoreRows.push([
          { text: sc.metric, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: String(sc.count), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: sc.percentage, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: sc.threshold, options: { color: THEME.TEXT_MUTED, fontSize: 7 } },
          { text: sc.risk, options: { color: sc.color === 'green' ? THEME.GREEN : (sc.color === 'yellow' ? THEME.AMBER : THEME.RED), bold: true, fontSize: 7.5 } }
        ]);
      });

      slide1.addTable(scoreRows, {
        x: 0.6, y: 2.3, w: 4.6,
        colW: [1.5, 0.5, 0.6, 0.9, 1.1],
        rowH: 0.28,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Middle Column: Name Change & Structural Impact (x: 5.45, y: 1.92, w: 3.9, h: 4.85)
      slide1.addShape(pptx.ShapeType.rect, {
        x: 5.45, y: 1.92, w: 3.9, h: 4.85,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide1.addText('NAME CHANGE & STRUCTURAL IMPACT', {
        x: 5.55, y: 1.98, w: 3.7, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      slide1.addText(
        `• Total Name Changes: ${item.nameChangeCount} (${item.nameChangeRate.toFixed(1)}%)\n` +
        `• Affected Domains: ${item.affectedCategoryCount}\n` +
        `• Largest Contributor: ${item.topCategoryName} (${item.topCategoryPercent}%)\n\n` +
        `DOMINANT MIGRATION PATTERN:\n` +
        `  OLD: ${item.dominantMigration.oldName}\n` +
        `  NEW: ${item.dominantMigration.newName}\n\n` +
        `STRUCTURAL DELTA:\n` +
        `  • Added Records: ${item.addedCount}\n` +
        `  • Removed Records: ${item.removedCount}\n` +
        `  • Net Change: ${item.netChange > 0 ? '+' + item.netChange : item.netChange} items\n` +
        `  • Impact Level: ${item.impactLevel} IMPACT`,
        {
          x: 5.55, y: 2.3, w: 3.7, h: 4.3,
          fontSize: 8.5, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      // Right Column: Executive Conclusions (x: 9.5, y: 1.92, w: 3.33, h: 4.85)
      slide1.addShape(pptx.ShapeType.rect, {
        x: 9.5, y: 1.92, w: 3.33, h: 4.85,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide1.addText('EXECUTIVE CONCLUSIONS', {
        x: 9.6, y: 1.98, w: 3.1, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      slide1.addText(
        `✓ Match Rate: ${item.matchRate.toFixed(1)}% of total comparison items.\n\n` +
        `✓ Program Revisions:\n  OLD: ${oldProg}\n  NEW: ${newProg}\n\n` +
        `✓ Assessment Summary:\n  ${item.assessmentRationale}\n\n` +
        `✓ Engineering Recommendation:\n  ${item.overallAssessment === 'PASS' ? 'Proceed with release qualification.' : 'Investigate modified parameter limits and unmapped removed test items prior to signoff.'}`,
        {
          x: 9.6, y: 2.3, w: 3.1, h: 4.3,
          fontSize: 8.5, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      // Footer (y: 6.95)
      slide1.addText('Source: Item Comparison Report • Generated From CSV Sanity Check Analysis', {
        x: 0.5, y: 6.95, w: 12.33, h: 0.25,
        fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
      });
    }

    // =========================================================================
    // SLIDE 2: DSA PARAMETER SHIFT ANALYSIS (DSA.txt)
    // =========================================================================
    if (dsa) {
      const slide2 = pptx.addSlide();
      slide2.background = { color: THEME.BG };

      const oldProg = dsa.meta.oldProgram || 'OLD_PROG';
      const newProg = dsa.meta.newProgram || 'NEW_PROG';
      const oldStage = dsa.meta.oldStage || 'CP1';
      const newStage = dsa.meta.newStage || 'CP1';

      // Header
      slide2.addText('DSA PARAMETER SHIFT ANALYSIS', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide2.addText(`Program Transition: ${oldProg} ➔ ${newProg} | Stage: ${oldStage} ➔ ${newStage}`, {
        x: 0.5, y: 0.52, w: 8.5, h: 0.25,
        fontSize: 9.5, color: THEME.CYAN, fontFace: 'Arial'
      });
      slide2.addText('Data Source: DSA Compare CSV', {
        x: 9.0, y: 0.2, w: 3.8, h: 0.3,
        fontSize: 8, color: THEME.TEXT_SECONDARY, align: 'right', fontFace: 'Arial'
      });

      // Top metrics summary
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.8, w: 12.33, h: 0.42,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText(
        `Total Parameters: ${dsa.totalParameters}    |    Total Shifted: ${dsa.totalShifted}    |    Total Full Shift: ${dsa.totalFullShift}    |    Total Median Shift: ${dsa.totalMedianShift}    |    A+B+C Impact: ${dsa.abcImpactCount} (${dsa.abcImpactPercent}%)`,
        {
          x: 0.7, y: 0.84, w: 11.9, h: 0.32,
          fontSize: 9.5, bold: true, color: THEME.TEXT_PRIMARY, align: 'center', fontFace: 'Arial'
        }
      );

      // Left Panel: DSA Category Pareto (x: 0.5, y: 1.3, w: 3.8, h: 3.4)
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.3, w: 3.8, h: 3.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText('DSA CATEGORY PARETO', {
        x: 0.6, y: 1.36, w: 3.6, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const paretoData = [
        [{ text: 'Category', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Count', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Percentage', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Severity', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }],
        [{ text: 'Cat A', options: { color: THEME.RED, bold: true, fontSize: 7.5 } }, { text: String(dsa.categoryCounts.A), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: `${dsa.catAPercent.toFixed(1)}%`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: 'Highest Severity', options: { color: THEME.RED, fontSize: 7 } }],
        [{ text: 'Cat B', options: { color: THEME.AMBER, bold: true, fontSize: 7.5 } }, { text: String(dsa.categoryCounts.B), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: `${dsa.catBPercent.toFixed(1)}%`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: 'Major Concern', options: { color: THEME.AMBER, fontSize: 7 } }],
        [{ text: 'Cat C', options: { color: THEME.CYAN, bold: true, fontSize: 7.5 } }, { text: String(dsa.categoryCounts.C), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: `${dsa.catCPercent.toFixed(1)}%`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }, { text: 'Significant Shift', options: { color: THEME.CYAN, fontSize: 7 } }]
      ];

      slide2.addTable(paretoData, {
        x: 0.6, y: 1.68, w: 3.6,
        colW: [0.8, 0.6, 0.9, 1.3],
        rowH: 0.26,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      slide2.addText(`A+B+C IMPACT BADGE: ${dsa.abcImpactCount} parameters (${dsa.abcImpactPercent}%) require active engineering monitoring.`, {
        x: 0.6, y: 3.25, w: 3.6, h: 1.3,
        fontSize: 8.5, color: THEME.AMBER, fontFace: 'Arial'
      });

      // Center Panel: Shift Priority Matrix (x: 4.45, y: 1.3, w: 4.3, h: 3.4)
      slide2.addShape(pptx.ShapeType.rect, {
        x: 4.45, y: 1.3, w: 4.3, h: 3.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText('A / B / C SHIFT PRIORITY MATRIX', {
        x: 4.55, y: 1.36, w: 4.1, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const matrixData = [
        [{ text: 'Shift Class', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Cat A', options: { bold: true, color: THEME.RED, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Cat B', options: { bold: true, color: THEME.AMBER, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Cat C', options: { bold: true, color: THEME.CYAN, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Total', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }],
        [{ text: 'FULL SHIFT', options: { bold: true, color: THEME.RED, fontSize: 7.5 } },
         { text: String(dsa.fullShiftCounts.A), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.fullShiftCounts.B), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.fullShiftCounts.C), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.totalFullShift), options: { bold: true, color: THEME.RED, fontSize: 7.5 } }],
        [{ text: 'MEDIAN SHIFT', options: { bold: true, color: THEME.AMBER, fontSize: 7.5 } },
         { text: String(dsa.medianShiftCounts.A), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.medianShiftCounts.B), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.medianShiftCounts.C), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
         { text: String(dsa.totalMedianShift), options: { bold: true, color: THEME.AMBER, fontSize: 7.5 } }]
      ];

      slide2.addTable(matrixData, {
        x: 4.55, y: 1.68, w: 4.1,
        colW: [1.3, 0.6, 0.6, 0.6, 1.0],
        rowH: 0.28,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      slide2.addText('Key Statement: Full Shift and Median Shift are the primary risk drivers affecting parametric Cpk and wafer yield.', {
        x: 4.55, y: 3.25, w: 4.1, h: 1.3,
        fontSize: 8.5, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });

      // Right Panel: Executive Risk Insights (x: 8.95, y: 1.3, w: 3.88, h: 3.4)
      slide2.addShape(pptx.ShapeType.rect, {
        x: 8.95, y: 1.3, w: 3.88, h: 3.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText('CRITICAL FINDINGS & DOMAINS', {
        x: 9.05, y: 1.36, w: 3.7, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      slide2.addText(
        `1. Highest Full Shift Category: ${dsa.highestFullShiftCat}\n` +
        `2. Highest Median Shift Category: ${dsa.highestMedianShiftCat}\n` +
        `3. Top Program Domain: ${dsa.topDomain}\n` +
        `4. Highest Risk Test Item: ${dsa.highestRiskTestItem}\n` +
        `5. Recommended Focus: Investigate ${dsa.topDomain} parameter limits and test conditions.`,
        {
          x: 9.05, y: 1.68, w: 3.7, h: 1.7,
          fontSize: 8, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      // Red Callout Box
      slide2.addShape(pptx.ShapeType.rect, {
        x: 9.05, y: 3.55, w: 3.7, h: 0.95,
        fill: { color: THEME.CALLOUT_BG }, line: { color: THEME.CALLOUT_BORDER, width: 1 }
      });
      slide2.addText('Immediate Attention Required:\nCat A/B/C Full Shift and Median Shift Parameters', {
        x: 9.15, y: 3.65, w: 3.5, h: 0.75,
        fontSize: 8.5, bold: true, color: THEME.RED, align: 'center', fontFace: 'Arial'
      });

      // Top Contributors Table Row (y: 4.8, h: 1.25)
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 4.8, w: 12.33, h: 1.25,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText('TOP A/B/C CONTRIBUTORS', {
        x: 0.6, y: 4.86, w: 12.0, h: 0.2,
        fontSize: 9, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const topContribRows = [
        [{ text: 'Rank', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Test Prefix / Name', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Stage', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Category', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Shift Type', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Delta Mean', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Delta Sigma', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Sigma Ratio', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } }]
      ];

      const topList = (dsa.topPrefixContributors && dsa.topPrefixContributors.length > 0) ? dsa.topPrefixContributors : dsa.topContributors;
      (topList.slice(0, 3)).forEach((c, idx) => {
        topContribRows.push([
          { text: `#${idx + 1}`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: c.totalCount > 1 ? `${c.testName} (${c.totalCount} tests)` : c.testName, options: { color: THEME.TEXT_PRIMARY, bold: true, fontSize: 7 } },
          { text: c.stage, options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: `Cat ${c.group}`, options: { color: c.group === 'A' ? THEME.RED : (c.group === 'B' ? THEME.AMBER : THEME.CYAN), bold: true, fontSize: 7 } },
          { text: c.shiftType, options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: (c.deltaMean || 0).toFixed(4), options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: (c.deltaSigma || 0).toFixed(4), options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: (c.sigmaRatio || 1).toFixed(3), options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } }
        ]);
      });

      slide2.addTable(topContribRows, {
        x: 0.6, y: 5.1, w: 12.1,
        colW: [0.6, 2.8, 0.9, 1.1, 1.6, 1.7, 1.7, 1.7],
        rowH: 0.22,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Bottom Executive Takeaways (y: 6.12, h: 0.78)
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 6.12, w: 12.33, h: 0.78,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide2.addText(
        `• Total A/B/C: ${dsa.abcImpactCount} parameters    • Full Shift: ${dsa.totalFullShift} items    • Median Shift: ${dsa.totalMedianShift} items    • Action: Guardband review on ${dsa.topDomain}`,
        {
          x: 0.6, y: 6.25, w: 12.1, h: 0.5,
          fontSize: 8.5, color: THEME.TEXT_PRIMARY, fontFace: 'Arial', align: 'center'
        }
      );

      // Footer
      slide2.addText('Source: DSA Parameter Shift Analysis • Executive Management Presentation', {
        x: 0.5, y: 7.0, w: 12.33, h: 0.2,
        fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
      });
    }

    // =========================================================================
    // SLIDE 3: BIN & YIELD COMPARISON
    // =========================================================================
    if (bin) {
      const slide3 = pptx.addSlide();
      slide3.background = { color: THEME.BG };

      slide3.addText('BIN & YIELD COMPARISON SUMMARY', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide3.addText('Hard Bin, Soft Bin & Binstate Switch Transitions', {
        x: 0.5, y: 0.52, w: 8.5, h: 0.25,
        fontSize: 9.5, color: THEME.CYAN, fontFace: 'Arial'
      });

      // Summary KPIs
      slide3.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.8, w: 12.33, h: 0.45,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide3.addText(
        `OLD Pass Yield: ${bin.oldPassRate.toFixed(2)}%   ➔   NEW Pass Yield: ${bin.newPassRate.toFixed(2)}%   |   Delta Yield: ${(bin.yieldDelta >= 0 ? '+' : '') + bin.yieldDelta.toFixed(2)}%   |   Pass->Fail (pf): ${bin.pfCount} dice`,
        {
          x: 0.7, y: 0.85, w: 11.9, h: 0.35,
          fontSize: 10, bold: true, color: bin.yieldDelta >= 0 ? THEME.GREEN : THEME.RED, align: 'center', fontFace: 'Arial'
        }
      );

      // Left Column: Transitions & Drivers (x: 0.5, y: 1.35, w: 4.5, h: 5.4)
      slide3.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.35, w: 4.5, h: 5.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide3.addText('BINSTATE TRANSITIONS & KEY DRIVERS', {
        x: 0.6, y: 1.42, w: 4.3, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const transRows = [
        [{ text: 'Transition', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Meaning', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Count', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }]
      ];
      bin.transitions.forEach(t => {
        const tr = t.Transition.toLowerCase();
        let desc = 'Pass to Pass';
        let clr = THEME.TEXT_PRIMARY;
        if (tr === 'pf') { desc = 'Pass to Fail (Critical!)'; clr = THEME.RED; }
        else if (tr === 'fp') { desc = 'Fail to Pass'; clr = THEME.GREEN; }
        else if (tr === 'ff') { desc = 'Fail to Fail'; clr = THEME.TEXT_MUTED; }
        transRows.push([
          { text: t.Transition, options: { bold: true, color: clr, fontSize: 8 } },
          { text: desc, options: { color: clr, fontSize: 8 } },
          { text: `${t.Count} (${t.Percentage})`, options: { color: clr, fontSize: 8 } }
        ]);
      });

      slide3.addTable(transRows, {
        x: 0.6, y: 1.75, w: 4.3,
        colW: [1.1, 2.0, 1.2],
        rowH: 0.28,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Key Drivers Summary Box
      const topH = bin.topHardFailDriver ? `${bin.topHardFailDriver.displayName} (${bin.topHardFailDriver.newCount} dice)` : 'None';
      const topS = bin.topSoftFailDriver ? `${bin.topSoftFailDriver.displayName} (${bin.topSoftFailDriver.newCount} dice)` : 'None';
      const topF = bin.topFirstFailDriver ? `${bin.topFirstFailDriver.displayName} (${bin.topFirstFailDriver.newCount} dice)` : 'None';

      slide3.addText(
        `PARETO FAILURE DRIVERS:\n\n` +
        `• Top Hard Bin Fail:\n  ${topH}\n\n` +
        `• Top Soft Bin Fail:\n  ${topS}\n\n` +
        `• Top First Fail Parameter:\n  ${topF}\n\n` +
        `• pf Fallout: ${bin.pfCount} dice switched from Pass in OLD to Fail in NEW.`,
        {
          x: 0.6, y: 3.6, w: 4.3, h: 3.0,
          fontSize: 8.5, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      // Right Column: Hard Bin & First Fail Pareto Comparison Table (x: 5.2, y: 1.35, w: 7.63, h: 5.4)
      slide3.addShape(pptx.ShapeType.rect, {
        x: 5.2, y: 1.35, w: 7.63, h: 5.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide3.addText('HARD BIN & FIRST FAIL PARETO COMPARISON (OLD vs NEW)', {
        x: 5.3, y: 1.42, w: 7.4, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const paretoRows = [
        [{ text: 'Type', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Item Identifier / Name', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'State', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'OLD Count (%)', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'NEW Count (%)', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'Delta (Δ)', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } },
         { text: 'NEW Cum %', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 7.5 } }]
      ];

      // Insert top Hard Bins
      (bin.hardBinPareto?.all || []).slice(0, 4).forEach(hb => {
        const sign = hb.deltaCount > 0 ? '+' : '';
        const clr = hb.isPass ? THEME.GREEN : (hb.deltaCount > 0 ? THEME.RED : THEME.TEXT_PRIMARY);
        paretoRows.push([
          { text: 'Hard Bin', options: { color: THEME.CYAN, fontSize: 7 } },
          { text: hb.displayName, options: { color: THEME.TEXT_PRIMARY, bold: true, fontSize: 7 } },
          { text: hb.isPass ? 'PASS' : 'FAIL', options: { color: hb.isPass ? THEME.GREEN : THEME.RED, bold: true, fontSize: 7 } },
          { text: `${hb.oldCount} (${hb.oldPct.toFixed(1)}%)`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: `${hb.newCount} (${hb.newPct.toFixed(1)}%)`, options: { color: THEME.CYAN, bold: true, fontSize: 7 } },
          { text: `${sign}${hb.deltaCount} (${(hb.deltaPct >= 0 ? '+' : '') + hb.deltaPct.toFixed(1)}%)`, options: { color: clr, bold: true, fontSize: 7 } },
          { text: `${hb.cumNewPct.toFixed(1)}%`, options: { color: THEME.AMBER, fontSize: 7 } }
        ]);
      });

      // Insert top First Fail Items
      (bin.firstFailPareto?.failOnly || []).slice(0, 4).forEach(ff => {
        const sign = ff.deltaCount > 0 ? '+' : '';
        const clr = ff.deltaCount > 0 ? THEME.RED : THEME.TEXT_PRIMARY;
        paretoRows.push([
          { text: 'First Fail', options: { color: THEME.AMBER, fontSize: 7 } },
          { text: ff.displayName, options: { color: THEME.TEXT_PRIMARY, bold: true, fontSize: 7 } },
          { text: 'FAIL', options: { color: THEME.RED, bold: true, fontSize: 7 } },
          { text: `${ff.oldCount} (${ff.oldPct.toFixed(1)}%)`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7 } },
          { text: `${ff.newCount} (${ff.newPct.toFixed(1)}%)`, options: { color: THEME.CYAN, bold: true, fontSize: 7 } },
          { text: `${sign}${ff.deltaCount} (${(ff.deltaPct >= 0 ? '+' : '') + ff.deltaPct.toFixed(1)}%)`, options: { color: clr, bold: true, fontSize: 7 } },
          { text: `${ff.cumNewPct.toFixed(1)}%`, options: { color: THEME.AMBER, fontSize: 7 } }
        ]);
      });

      slide3.addTable(paretoRows, {
        x: 5.3, y: 1.75, w: 7.4,
        colW: [0.8, 2.0, 0.6, 1.0, 1.0, 1.0, 1.0],
        rowH: 0.24,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      slide3.addText('Source: Hard Bin, Soft Bin & First Fail Pareto Analysis', {
        x: 0.5, y: 6.95, w: 12.33, h: 0.25,
        fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
      });
    }

    // =========================================================================
    // SLIDE 4: TSR TEST SUMMARY REPORT (Parameter Pareto & Cpk Capability)
    // =========================================================================
    const tsr = appState.tsrAnalysis;
    if (tsr) {
      const slide4 = pptx.addSlide();
      slide4.background = { color: THEME.BG };

      const prog = tsr.meta.newProgram || 'MAIN_PROG_REV_A';
      const stage = tsr.meta.newStage || 'CP1';

      slide4.addText('TEST SUMMARY REPORT (TSR) ANALYSIS', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide4.addText(`Program: [${stage}] ${prog} • Parameter Failure Pareto, Cpk & Distribution`, {
        x: 0.5, y: 0.52, w: 8.5, h: 0.25,
        fontSize: 9.5, color: THEME.CYAN, fontFace: 'Arial'
      });
      slide4.addText(`Data Source: ${appState.tsrFile?.filename || 'TSR.csv'}`, {
        x: 9.0, y: 0.2, w: 3.8, h: 0.3,
        fontSize: 8, color: THEME.TEXT_SECONDARY, align: 'right', fontFace: 'Arial'
      });

      // Top KPIs
      slide4.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.8, w: 12.33, h: 0.42,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      const worstCpkStr = tsr.worstCpkItem ? `${tsr.worstCpkItem.cpkn.toFixed(2)} (${tsr.worstCpkItem.testName})` : 'N/A';
      const topLossStr = tsr.topLossDriver ? `${tsr.topLossDriver.testName} (${tsr.topLossDriver.failCount} fails / ${tsr.topLossDriver.lossPct.toFixed(2)}%)` : 'None';
      slide4.addText(
        `Total Tested: ${tsr.totalTestedCount.toLocaleString()} dice   |   Total Fails: ${tsr.totalFailCount} (${tsr.overallLossPct.toFixed(2)}% loss)   |   Worst CPK: ${worstCpkStr}   |   CPK < 1.67: ${tsr.cpkRiskCount}/${tsr.totalParameters} items (${tsr.cpkRiskPct.toFixed(1)}%)   |   Top Loss Driver: ${topLossStr}`,
        {
          x: 0.6, y: 0.84, w: 12.1, h: 0.32,
          fontSize: 8.5, bold: true, color: THEME.TEXT_PRIMARY, align: 'center', fontFace: 'Arial'
        }
      );

      // Left Panel: Parameter Loss Pareto Table (x: 0.5, y: 1.3, w: 5.6, h: 5.4)
      slide4.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.3, w: 5.6, h: 5.4,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide4.addText('PARAMETER FAILURE PARETO', {
        x: 0.6, y: 1.36, w: 5.4, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const paretoRows = [
        [{ text: 'Test Name', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Fail Count', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Loss %', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Cum Loss %', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'CPK', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Dist', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }]
      ];

      const displayPareto = (tsr.paretoParams || []).slice(0, 12);
      displayPareto.forEach(p => {
        paretoRows.push([
          { text: p.testName || '', options: { color: THEME.TEXT_PRIMARY, bold: true, fontSize: 7.5 } },
          { text: String(p.failCount || 0), options: { color: (p.failCount || 0) > 0 ? THEME.RED : THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: `${(p.lossPct || 0).toFixed(2)}%`, options: { color: (p.failCount || 0) > 0 ? THEME.RED : THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: `${(p.cumLossPct || 0).toFixed(1)}%`, options: { color: THEME.AMBER, fontSize: 7.5 } },
          { text: (p.cpkn !== undefined ? p.cpkn.toFixed(2) : 'N/A'), options: { color: (p.cpkn || 0) < 1.67 ? THEME.AMBER : THEME.GREEN, fontSize: 7.5 } },
          { text: p.distribution || 'Normal', options: { color: p.distribution === 'Normal' ? THEME.GREEN : THEME.PURPLE, fontSize: 7.5 } }
        ]);
      });

      slide4.addTable(paretoRows, {
        x: 0.6, y: 1.68, w: 5.4,
        colW: [1.6, 0.7, 0.7, 0.9, 0.7, 0.8],
        rowH: 0.28,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Right Top: CPK Capability Distribution (x: 6.3, y: 1.3, w: 6.53, h: 2.6)
      slide4.addShape(pptx.ShapeType.rect, {
        x: 6.3, y: 1.3, w: 6.53, h: 2.6,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide4.addText('CPK CAPABILITY MATRIX & DISTRIBUTION', {
        x: 6.4, y: 1.36, w: 6.3, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const cpkRows = [
        [{ text: 'CPK Group', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Criteria', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Count', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Share %', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Assessment', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }]
      ];

      (tsr.allCpkGroupsTable || []).forEach(g => {
        let rowColor = THEME.TEXT_PRIMARY;
        if (g.color === 'red') rowColor = THEME.RED;
        else if (g.color === 'yellow' || g.color === 'amber') rowColor = THEME.AMBER;
        else if (g.color === 'green') rowColor = THEME.GREEN;
        else if (g.color === 'purple') rowColor = THEME.PURPLE;
        else if (g.color === 'cyan') rowColor = THEME.CYAN;

        cpkRows.push([
          { text: g.name, options: { color: rowColor, bold: true, fontSize: 7.5 } },
          { text: g.criteria, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: String(g.count), options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: g.percentage, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: g.assessment, options: { color: rowColor, fontSize: 7.5 } }
        ]);
      });

      slide4.addTable(cpkRows, {
        x: 6.4, y: 1.68, w: 6.3,
        colW: [1.3, 1.4, 0.9, 1.0, 1.7],
        rowH: 0.25,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Right Bottom: Distribution Morphology Callout (x: 6.3, y: 4.1, w: 6.53, h: 2.6)
      slide4.addShape(pptx.ShapeType.rect, {
        x: 6.3, y: 4.1, w: 6.53, h: 2.6,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide4.addText('DISTRIBUTION SHAPE & MORPHOLOGY', {
        x: 6.4, y: 4.16, w: 6.3, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const distSummaryLines = (tsr.allDistShapesTable || []).map(d => `• ${d.name}: ${d.count} parameters (${d.percentage})`).join('\n');
      slide4.addText(
        `${distSummaryLines}\n` +
        `• Lowest CPK Bottleneck: ${tsr.lowestCpkItem ? tsr.lowestCpkItem.testName + ' (CPK: ' + tsr.lowestCpkItem.cpkn.toFixed(2) + ')' : 'None'}\n` +
        `• Largest Loss Driver: ${tsr.topLossDriver ? tsr.topLossDriver.testName + ' (' + tsr.topLossDriver.failCount + ' fails, ' + tsr.topLossDriver.lossPct.toFixed(2) + '% loss)' : 'None'}\n\n` +
        `RECOMMENDED ACTION: Investigate non-normal / multi-modal distribution parameters to prevent multi-site ATE variation.`,
        {
          x: 6.4, y: 4.45, w: 6.3, h: 2.1,
          fontSize: 8, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      slide4.addText('Source: TSR Test Summary Report Analysis', {
        x: 0.5, y: 6.95, w: 12.33, h: 0.25,
        fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
      });
    }

    // =========================================================================
    // SLIDE 5: REPEATABILITY & PER-ECID STATISTICAL SUMMARY
    // =========================================================================
    const rep = appState.repeatabilityAnalysis;
    if (rep) {
      const slide5 = pptx.addSlide();
      slide5.background = { color: THEME.BG };

      // Top Title Bar
      slide5.addText('REPEATABILITY & PER-ECID PROCESS CAPABILITY SUMMARY', {
        x: 0.5, y: 0.2, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
      });
      slide5.addText('Multi-Site / Die-Level Repeatability • CV%, Cp Capability & Shift Trend Analysis', {
        x: 0.5, y: 0.52, w: 8.5, h: 0.25,
        fontSize: 9.5, color: THEME.CYAN, fontFace: 'Arial'
      });

      // Report Metadata (Top Right)
      const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
      slide5.addText(`Report: ${ts}\nSource: ${appState.repeatabilityFile?.filename || 'repeatability.csv'}`, {
        x: 9.0, y: 0.2, w: 3.8, h: 0.5,
        fontSize: 8, color: THEME.TEXT_SECONDARY, align: 'right', fontFace: 'Arial'
      });

      // 6 Top KPI Cards
      const repKpis = [
        { label: 'Total Tested ECIDs', val: `${rep.totalEcids} Dice`, color: THEME.TEXT_PRIMARY },
        { label: 'Total Parameters', val: `${rep.totalTests} Tests`, color: THEME.CYAN },
        { label: 'Total Measurements', val: `${rep.totalRecords}`, color: THEME.TEXT_PRIMARY },
        { label: 'Average CV (%)', val: `${rep.meanCv.toFixed(2)}%`, color: rep.meanCv < 5.0 ? THEME.GREEN : THEME.AMBER },
        { label: 'Average Process Cp', val: `${rep.meanCp.toFixed(2)}`, color: rep.meanCp >= 1.33 ? THEME.GREEN : THEME.AMBER },
        { label: 'Worst Process Cp', val: `${rep.minCp.toFixed(2)}`, color: rep.minCp >= 1.0 ? THEME.AMBER : THEME.RED }
      ];

      const rCardW = 1.98;
      const rGap = 0.09;
      repKpis.forEach((k, idx) => {
        const xPos = 0.5 + idx * (rCardW + rGap);
        slide5.addShape(pptx.ShapeType.rect, {
          x: xPos, y: 0.8, w: rCardW, h: 0.58,
          fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
        });
        slide5.addText(k.label.toUpperCase(), {
          x: xPos + 0.05, y: 0.83, w: rCardW - 0.1, h: 0.18,
          fontSize: 7, bold: true, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
        });
        slide5.addText(String(k.val), {
          x: xPos + 0.05, y: 1.02, w: rCardW - 0.1, h: 0.32,
          fontSize: 12, bold: true, color: k.color, align: 'center', fontFace: 'Arial'
        });
      });

      // Left Box: Per-Test Repeatability Summary
      slide5.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.48, w: 6.0, h: 5.3,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide5.addText('PARAMETER REPEATABILITY & CP SUMMARY (ALL DICE)', {
        x: 0.6, y: 1.54, w: 5.8, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const repTestTableRows = [
        [{ text: 'Test Name', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Units', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Mean CV%', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Mean Cp', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Min Cp', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } },
         { text: 'Dominant Trend', options: { bold: true, color: THEME.TEXT_PRIMARY, fill: THEME.HEADER_FILL, fontSize: 8 } }]
      ];

      rep.perTestStats.forEach(t => {
        repTestTableRows.push([
          { text: t.testName, options: { bold: true, color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: t.units, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: `${t.meanCv.toFixed(2)}%`, options: { color: t.meanCv >= 5.0 ? THEME.AMBER : THEME.TEXT_PRIMARY, bold: true, fontSize: 7.5 } },
          { text: `${t.meanCp.toFixed(2)}`, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } },
          { text: `${t.minCp.toFixed(2)}`, options: { color: t.minCp < 1.0 ? THEME.RED : (t.minCp < 1.33 ? THEME.AMBER : THEME.GREEN), bold: true, fontSize: 7.5 } },
          { text: t.dominantTrend, options: { color: THEME.TEXT_PRIMARY, fontSize: 7.5 } }
        ]);
      });

      slide5.addTable(repTestTableRows, {
        x: 0.6, y: 1.84, w: 5.8,
        colW: [1.5, 0.6, 0.8, 0.7, 0.7, 1.5],
        rowH: 0.3,
        border: { color: THEME.CARD_BORDER, pt: 0.5 },
        fill: THEME.CARD_BG
      });

      // Right Box: Distribution & Trend Pattern Breakdown
      slide5.addShape(pptx.ShapeType.rect, {
        x: 6.7, y: 1.48, w: 6.13, h: 5.3,
        fill: { color: THEME.CARD_BG }, line: { color: THEME.CARD_BORDER, width: 1 }
      });
      slide5.addText('CATEGORICAL MORPHOLOGY & TREND PATTERNS', {
        x: 6.8, y: 1.54, w: 5.9, h: 0.25,
        fontSize: 9.5, bold: true, color: THEME.CYAN, fontFace: 'Arial'
      });

      const distLines = rep.distTable.map(d => `• Dist Morphology: ${d.name} (${d.count} items, ${d.percentage})`).join('\n');
      const distRepeatLines = rep.distRepeatTable.map(dr => `• Dist_Repeat: ${dr.name} (${dr.count} items, ${dr.percentage})`).join('\n');
      const trendLines = rep.trendTable.map(tr => `• Trend: ${tr.name} (${tr.count} items, ${tr.percentage})`).join('\n');

      slide5.addText(
        `1. DIST MORPHOLOGY DISTRIBUTION:\n${distLines}\n\n` +
        `2. REPEATABILITY CLASSIFICATION (Dist_Repeat):\n${distRepeatLines}\n\n` +
        `3. DRIFT & SHIFT BEHAVIOR (Trend):\n${trendLines}\n\n` +
        `EXECUTIVE CONCLUSION: Evaluated across ${rep.totalEcids} ECID dice. Dominant pattern is ${rep.dominantTrendOverall}.`,
        {
          x: 6.8, y: 1.84, w: 5.9, h: 4.8,
          fontSize: 7.8, color: THEME.TEXT_PRIMARY, fontFace: 'Arial'
        }
      );

      slide5.addText('Source: Repeatability & Per-ECID Process Capability Analysis', {
        x: 0.5, y: 6.95, w: 12.33, h: 0.25,
        fontSize: 7.5, color: THEME.TEXT_MUTED, align: 'center', fontFace: 'Arial'
      });
    }

    // Save PPTX
    const themeName = isLight ? 'Light' : 'Dark';
    const filename = `Semiconductor_Sanity_Executive_Report_${themeName}_${Date.now()}.pptx`;
    pptx.writeFile({ fileName: filename });
  }

  /**
   * Export to PDF via browser print stylesheet
   */
  static exportPDF() {
    window.print();
  }
}

window.SemiconductorExportManager = SemiconductorExportManager;
