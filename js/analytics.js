/**
 * Semiconductor Analytics Engine
 * Calculates metrics according to specifications in DSA.txt, sanity_ITEM COMPARSION.txt, and Yield comparison.
 */

class SemiconductorAnalytics {
  /**
   * Parse user-provided ignore string (e.g. "not pux, not dummy, !setup, leakage*")
   * into clean, normalized token patterns.
   */
  static parseIgnoreRules(input) {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.flatMap(i => SemiconductorAnalytics.parseIgnoreRules(i));
    }
    const rawTokens = String(input)
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const cleanRules = [];
    for (const token of rawTokens) {
      let t = token.toLowerCase();
      // Strip "not " or "!" prefixes
      if (t.startsWith('not ')) {
        t = t.slice(4).trim();
      } else if (t.startsWith('!')) {
        t = t.slice(1).trim();
      }
      if (t) cleanRules.push(t);
    }
    return cleanRules;
  }

  /**
   * Check if a test should be excluded based on ignore rules
   */
  static isTestIgnored(testName = '', testNum = '', ignoreRules = []) {
    if (!ignoreRules || ignoreRules.length === 0) return false;
    const nameStr = String(testName || '').toLowerCase().trim();
    const numStr = String(testNum || '').toLowerCase().trim();

    for (const rule of ignoreRules) {
      const pattern = String(rule || '').toLowerCase().trim();
      if (!pattern) continue;

      // Both ends wildcard e.g. "*pux*"
      if (pattern.startsWith('*') && pattern.endsWith('*') && pattern.length > 2) {
        const mid = pattern.slice(1, -1).trim();
        if (mid && (nameStr.includes(mid) || numStr.includes(mid))) return true;
      }
      // Prefix wildcard match e.g. "pux*" or "pux:*"
      else if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1).trim();
        if (prefix && (nameStr.startsWith(prefix) || numStr.startsWith(prefix))) return true;
      }
      // Suffix wildcard match e.g. "*pux"
      else if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1).trim();
        if (suffix && (nameStr.endsWith(suffix) || numStr.endsWith(suffix))) return true;
      }
      // General substring match (e.g. "pux", "dummy", "setup")
      else if (nameStr.includes(pattern) || numStr.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Analyze Item Compare data
   */
  static analyzeItemCompare(parsedData, ignoreRules = []) {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      return null;
    }

    const rules = SemiconductorAnalytics.parseIgnoreRules(ignoreRules);
    const rawAllRows = parsedData.rows;
    const ignoredRows = [];
    const rows = [];

    rawAllRows.forEach(r => {
      if (SemiconductorAnalytics.isTestIgnored(r.Test_Name, r.OLD_Test_Num || r.NEW_Test_Num, rules)) {
        ignoredRows.push(r);
      } else {
        rows.push(r);
      }
    });

    const totalRawRecords = rawAllRows.length;
    const totalRecords = rows.length;
    const ignoredCount = ignoredRows.length;

    if (totalRecords === 0) {
      return {
        totalRawRecords,
        totalRecords: 0,
        ignoredCount,
        ignoredRows,
        ignoreRules: rules,
        matchCount: 0,
        matchRate: 0,
        nameChangeCount: 0,
        addedCount: 0,
        removedCount: 0,
        limitChangeCount: 0,
        unitChangeCount: 0,
        numberChangeCount: 0,
        otherChangeCount: 0,
        totalChanged: 0,
        changeRate: 0,
        nameChangeRate: 0,
        addedRate: 0,
        removedRate: 0,
        limitChangeRate: 0,
        otherChangeRate: 0,
        netChange: 0,
        impactLevel: 'LOW',
        scorecard: [],
        overallAssessment: 'NO ITEMS MATCH',
        assessmentColor: 'yellow',
        assessmentRationale: `All ${ignoredCount} test items were ignored under active rules: [${rules.join(', ')}]`,
        dominantMigration: 'None',
        topCategoryName: 'None',
        topCategoryPercent: '0.0',
        affectedCategoryCount: 0,
        nameCategoryCounts: {},
        nameChangeRecords: [],
        paretoItems: [],
        meta: parsedData.meta
      };
    }

    // Status counts
    let matchCount = 0;
    let nameChangeCount = 0;
    let addedCount = 0;
    let removedCount = 0;
    let limitChangeCount = 0;
    let unitChangeCount = 0;
    let numberChangeCount = 0;
    let otherChangeCount = 0;

    const statusMap = {};
    const nameChangeRecords = [];
    const changeRecords = [];

    rows.forEach(r => {
      const statusRaw = (r.Status || 'Other').trim();
      const status = statusRaw.toLowerCase();
      statusMap[statusRaw] = (statusMap[statusRaw] || 0) + 1;

      if (status === 'match') {
        matchCount++;
      } else {
        changeRecords.push(r);
        if (status === 'name change' || status.includes('name')) {
          nameChangeCount++;
          nameChangeRecords.push(r);
        } else if (status === 'added' || status.includes('add')) {
          addedCount++;
        } else if (status === 'removed' || status.includes('remove')) {
          removedCount++;
        } else if (status === 'limit change' || status.includes('limit')) {
          limitChangeCount++;
        } else if (status === 'unit change' || status.includes('unit')) {
          unitChangeCount++;
          otherChangeCount++;
        } else if (status === 'number change' || status.includes('number')) {
          numberChangeCount++;
          otherChangeCount++;
        } else {
          otherChangeCount++;
        }
      }
    });

    const totalChanged = totalRecords - matchCount;
    const matchRate = totalRecords > 0 ? (matchCount / totalRecords) * 100 : 0;
    const changeRate = totalRecords > 0 ? (totalChanged / totalRecords) * 100 : 0;
    const nameChangeRate = totalRecords > 0 ? (nameChangeCount / totalRecords) * 100 : 0;
    const addedRate = totalRecords > 0 ? (addedCount / totalRecords) * 100 : 0;
    const removedRate = totalRecords > 0 ? (removedCount / totalRecords) * 100 : 0;
    const limitChangeRate = totalRecords > 0 ? (limitChangeCount / totalRecords) * 100 : 0;
    const otherChangeRate = totalRecords > 0 ? (otherChangeCount / totalRecords) * 100 : 0;
    const netChange = addedCount - removedCount;

    // Determine Impact Level
    let impactLevel = 'LOW';
    if (removedCount > addedCount || changeRate > 10 || Math.abs(netChange) >= 5) {
      impactLevel = 'HIGH';
    } else if (changeRate >= 3 && changeRate <= 10) {
      impactLevel = 'MEDIUM';
    } else {
      impactLevel = 'LOW';
    }

    // Name Change Deep Dive
    let dominantMigration = { oldName: 'N/A', newName: 'N/A', count: 0 };
    const nameCategoryCounts = {};

    nameChangeRecords.forEach(r => {
      const desc = r.Description || '';
      const testName = r.Test_Name || '';
      let oldN = testName;
      let newN = testName;

      if (testName.includes('->')) {
        const parts = testName.split('->').map(p => p.trim());
        oldN = parts[0];
        newN = parts[1];
      } else if (desc.includes('->')) {
        const match = desc.match(/'([^']+)'\s*->\s*'([^']+)'/) || desc.match(/([^\s]+)\s*->\s*([^\s]+)/);
        if (match) {
          oldN = match[1];
          newN = match[2];
        }
      }

      const domain = oldN.split('_')[0] || 'GENERAL';
      nameCategoryCounts[domain] = (nameCategoryCounts[domain] || 0) + 1;

      dominantMigration = {
        oldName: oldN,
        newName: newN,
        count: (dominantMigration.count || 0) + 1
      };
    });

    let topCategoryName = 'None';
    let topCategoryCount = 0;
    Object.entries(nameCategoryCounts).forEach(([cat, cnt]) => {
      if (cnt > topCategoryCount) {
        topCategoryName = cat;
        topCategoryCount = cnt;
      }
    });

    const topCategoryPercent = nameChangeCount > 0 ? ((topCategoryCount / nameChangeCount) * 100).toFixed(1) : '0.0';
    const affectedCategoryCount = Object.keys(nameCategoryCounts).length;

    // Scorecard & Assessment
    const scorecard = [
      {
        metric: 'Match Rate',
        count: matchCount,
        percentage: matchRate.toFixed(1) + '%',
        threshold: '> 99.5%',
        risk: matchRate >= 99.5 ? 'LOW RISK' : (matchRate >= 95 ? 'REVIEW' : 'HIGH RISK'),
        color: matchRate >= 99.5 ? 'green' : (matchRate >= 95 ? 'yellow' : 'red'),
        traceType: 'item_match'
      },
      {
        metric: 'Overall Change Rate',
        count: totalChanged,
        percentage: changeRate.toFixed(1) + '%',
        threshold: '< 3.0%',
        risk: changeRate < 3.0 ? 'LOW RISK' : (changeRate <= 10 ? 'REVIEW' : 'HIGH RISK'),
        color: changeRate < 3.0 ? 'green' : (changeRate <= 10 ? 'yellow' : 'red'),
        traceType: 'item_changed'
      },
      {
        metric: 'Name Change Rate',
        count: nameChangeCount,
        percentage: nameChangeRate.toFixed(1) + '%',
        threshold: '< 2.0%',
        risk: nameChangeCount === 0 ? 'LOW RISK' : (nameChangeRate < 5 ? 'REVIEW' : 'HIGH RISK'),
        color: nameChangeCount === 0 ? 'green' : (nameChangeRate < 5 ? 'yellow' : 'red'),
        traceType: 'item_namechange'
      },
      {
        metric: 'Added Rate',
        count: addedCount,
        percentage: addedRate.toFixed(1) + '%',
        threshold: '0 items',
        risk: addedCount === 0 ? 'LOW RISK' : 'REVIEW',
        color: addedCount === 0 ? 'green' : 'yellow',
        traceType: 'item_added'
      },
      {
        metric: 'Removed Rate',
        count: removedCount,
        percentage: removedRate.toFixed(1) + '%',
        threshold: '0 items',
        risk: removedCount === 0 ? 'LOW RISK' : 'HIGH RISK',
        color: removedCount === 0 ? 'green' : 'red',
        traceType: 'item_removed'
      },
      {
        metric: 'Limit Change Rate',
        count: limitChangeCount,
        percentage: limitChangeRate.toFixed(1) + '%',
        threshold: '0 items',
        risk: limitChangeCount === 0 ? 'LOW RISK' : 'HIGH RISK',
        color: limitChangeCount === 0 ? 'green' : 'red',
        traceType: 'item_limitchange'
      }
    ];

    // Overall Assessment
    let overallAssessment = 'PASS';
    let assessmentColor = 'green';
    let assessmentRationale = '';

    if (matchRate >= 99.5 && addedCount === 0 && removedCount === 0 && limitChangeCount === 0 && changeRate < 0.5) {
      overallAssessment = 'PASS';
      assessmentColor = 'green';
      assessmentRationale = 'Program structure and test definitions have identical matching rates (>99.5%) with zero critical deletions or limit shifts.';
    } else if (matchRate >= 95.0 && changeRate < 5.0) {
      overallAssessment = 'MINOR CHANGES';
      assessmentColor = 'cyan';
      assessmentRationale = 'Minor changes detected. Parameter items align with >95% match rate and minimal impact on limits.';
    } else if (matchRate >= 80.0 && matchRate < 95.0) {
      overallAssessment = 'REVIEW REQUIRED';
      assessmentColor = 'yellow';
      assessmentRationale = 'Engineering review required due to moderate structural additions/modifications or limit variations.';
    } else {
      overallAssessment = 'MAJOR DIFFERENCES';
      assessmentColor = 'red';
      assessmentRationale = 'Critical program differences found: low match rate (<80%), large added/removed counts, or critical limit/unit shifts.';
    }

    // Pareto Breakdown array
    const paretoItems = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percent: ((count / totalRecords) * 100)
    })).sort((a, b) => b.count - a.count);

    let runningSum = 0;
    paretoItems.forEach(item => {
      runningSum += item.count;
      item.cumPercent = ((runningSum / totalRecords) * 100);
    });

    return {
      totalRecords,
      matchCount,
      nameChangeCount,
      addedCount,
      removedCount,
      limitChangeCount,
      unitChangeCount,
      numberChangeCount,
      otherChangeCount,
      totalChanged,
      matchRate,
      changeRate,
      nameChangeRate,
      addedRate,
      removedRate,
      limitChangeRate,
      otherChangeRate,
      netChange,
      impactLevel,
      scorecard,
      overallAssessment,
      assessmentColor,
      assessmentRationale,
      dominantMigration,
      topCategoryName,
      topCategoryPercent,
      affectedCategoryCount,
      nameCategoryCounts,
      nameChangeRecords,
      paretoItems,
      meta: parsedData.meta
    };
  }

  /**
   * Analyze DSA Compare data according to DSA.txt
   */
  static analyzeDsaCompare(parsedData, ignoreRules = []) {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      return null;
    }

    const rules = SemiconductorAnalytics.parseIgnoreRules(ignoreRules);
    const rawAllRows = parsedData.rows;
    const ignoredRows = [];
    const rows = [];

    rawAllRows.forEach(r => {
      if (SemiconductorAnalytics.isTestIgnored(r.Test_Name, r.TEST_NUM, rules)) {
        ignoredRows.push(r);
      } else {
        rows.push(r);
      }
    });

    const totalRawParameters = rawAllRows.length;
    const totalParameters = rows.length;
    const ignoredCount = ignoredRows.length;

    if (totalParameters === 0) {
      return {
        totalRawParameters,
        totalParameters: 0,
        ignoredCount,
        ignoredRows,
        ignoreRules: rules,
        totalShifted: 0,
        totalFullShift: 0,
        totalMedianShift: 0,
        categoryCounts: { A: 0, B: 0, C: 0, F: 0, Other: 0 },
        fullShiftCounts: { A: 0, B: 0, C: 0, Total: 0 },
        medianShiftCounts: { A: 0, B: 0, C: 0, Total: 0 },
        abcImpactCount: 0,
        abcImpactPercent: '0.0',
        catAPercent: 0,
        catBPercent: 0,
        catCPercent: 0,
        topContributors: [],
        prefixContributors: [],
        topPrefixContributors: [],
        allContributors: [],
        topDomain: 'None',
        highestRiskTestItem: 'None',
        highestFullShiftCat: 'None',
        highestMedianShiftCat: 'None',
        meta: parsedData.meta
      };
    }

    // Group counts
    const categoryCounts = { A: 0, B: 0, C: 0, F: 0, Other: 0 };
    const fullShiftCounts = { A: 0, B: 0, C: 0, Total: 0 };
    const medianShiftCounts = { A: 0, B: 0, C: 0, Total: 0 };

    const domainRiskMap = {};
    const contributors = [];

    rows.forEach(r => {
      const group = (r.DSA_Group || 'Other').trim().toUpperCase();
      if (categoryCounts[group] !== undefined) {
        categoryCounts[group]++;
      } else {
        categoryCounts.Other++;
      }

      // Numerical calculations
      const deltaMean = Math.abs(parseFloat(r.Delta_Mean) || 0);
      const deltaSigma = Math.abs(parseFloat(r.Delta_Sigma) || 0);
      const deltaRobustSigma = Math.abs(parseFloat(r.Delta_Robust_Sigma) || 0);
      const sigmaRatio = parseFloat(r.Sigma_Ratio) || 1.0;
      const oldCpk = parseFloat(r.OLD_CPKn) || 0;
      const newCpk = parseFloat(r.NEW_CPKn) || 0;
      const deltaCpk = oldCpk - newCpk; // positive means Cpk degraded

      // Domain / Test Prefix extraction (Using ':' as primary delimiter per engineering spec, fallback to '_' or full testName)
      const testName = r.Test_Name || '';
      let domain = 'GENERAL';
      if (testName.includes(':')) {
        domain = testName.split(':')[0].trim();
      } else if (testName.includes('_')) {
        domain = testName.split('_')[0].trim();
      } else if (testName.trim()) {
        domain = testName.trim();
      }

      domainRiskMap[domain] = (domainRiskMap[domain] || 0) + (group === 'A' ? 3 : (group === 'B' ? 2 : (group === 'C' ? 1 : 0)));

      // Shift behavior classification
      let shiftType = 'Normal';
      let isFullShift = false;
      let isMedianShift = false;

      // Criteria: Group A/B/C or substantial Delta_Mean / Delta_Sigma
      if (group === 'A' || group === 'B' || group === 'C') {
        if (deltaMean > 1.0 || deltaSigma > 5.0 || sigmaRatio > 2.0 || sigmaRatio < 0.5) {
          isFullShift = true;
          shiftType = 'Full Shift';
        } else if (deltaMean > 0.05 || deltaRobustSigma > 0.01) {
          isMedianShift = true;
          shiftType = 'Median Shift';
        } else {
          isMedianShift = true;
          shiftType = 'Median Shift';
        }
      }

      if (isFullShift) {
        fullShiftCounts.Total++;
        if (fullShiftCounts[group] !== undefined) fullShiftCounts[group]++;
      }
      if (isMedianShift) {
        medianShiftCounts.Total++;
        if (medianShiftCounts[group] !== undefined) medianShiftCounts[group]++;
      }

      // Standardized shift metrics (scale invariant)
      const oldSigma = Math.abs(parseFloat(r.OLD_Sigma) || 0);
      const newSigma = Math.abs(parseFloat(r.NEW_Sigma) || 0);
      const refSigma = Math.max(oldSigma, newSigma, 1e-6);

      // Z-Shift: Mean shift relative to standard deviation
      const deltaMeanZ = deltaMean / refSigma;

      // Variance Shift: Relative variation in standard deviation
      const sigmaRatioDev = Math.abs(sigmaRatio - 1.0);

      // Cpk Drop
      const deltaCpkPenalty = Math.max(0, deltaCpk);

      // Normalized Shift Severity Score (0 - 100)
      let severityScore = 0;
      if (group === 'A') {
        // Cat A: Major / Full shift (High baseline: 70 - 100)
        severityScore = 70 + Math.min(30, (deltaMeanZ * 10) + (sigmaRatioDev * 8) + (deltaCpkPenalty * 5) + (isFullShift ? 10 : 5));
      } else if (group === 'B') {
        // Cat B: Median / Center-point drift (Medium baseline: 40 - 70)
        severityScore = 40 + Math.min(30, (deltaMeanZ * 12) + (sigmaRatioDev * 8) + (deltaCpkPenalty * 4) + (isMedianShift ? 8 : 4));
      } else if (group === 'C') {
        // Cat C: Minor drift (Low baseline: 15 - 40)
        severityScore = 15 + Math.min(25, (deltaMeanZ * 8) + (sigmaRatioDev * 5) + (deltaCpkPenalty * 2));
      } else {
        // Cat F / Normal (0 - 15)
        severityScore = Math.min(15, (deltaMeanZ * 5) + (sigmaRatioDev * 3));
      }

      severityScore = Math.min(100, Math.max(0, Math.round(severityScore * 10) / 10));

      contributors.push({
        testName,
        testPrefix: domain,
        testNum: r.TEST_NUM || 'N/A',
        stage: r.OLD_Stage || r.NEW_Stage || 'CP1',
        group,
        shiftType,
        isFullShift,
        isMedianShift,
        deltaMean,
        deltaSigma,
        deltaRobustSigma,
        deltaMeanZ,
        sigmaRatio,
        oldCpk,
        newCpk,
        deltaCpk,
        severityScore,
        rawRecord: r
      });
    });

    // Grouping by ':' prefix for TOP A:B:C statistics
    const prefixGroupMap = {};
    contributors.forEach(c => {
      const p = c.testPrefix;
      if (!prefixGroupMap[p]) {
        prefixGroupMap[p] = {
          prefix: p,
          testName: p,
          stage: c.stage,
          totalCount: 0,
          catACount: 0,
          catBCount: 0,
          catCCount: 0,
          catFCount: 0,
          otherCount: 0,
          fullShiftCount: 0,
          medianShiftCount: 0,
          maxDeltaMean: 0,
          maxDeltaSigma: 0,
          maxSigmaRatio: 1.0,
          records: [],
          items: []
        };
      }
      const g = prefixGroupMap[p];
      g.totalCount++;
      g.records.push(c.rawRecord);
      g.items.push(c);
      if (c.group === 'A') g.catACount++;
      else if (c.group === 'B') g.catBCount++;
      else if (c.group === 'C') g.catCCount++;
      else if (c.group === 'F') g.catFCount++;
      else g.otherCount++;

      if (c.isFullShift) g.fullShiftCount++;
      if (c.isMedianShift) g.medianShiftCount++;

      if (c.deltaMean > g.maxDeltaMean) g.maxDeltaMean = c.deltaMean;
      if (c.deltaSigma > g.maxDeltaSigma) g.maxDeltaSigma = c.deltaSigma;
      if (c.sigmaRatio > g.maxSigmaRatio) g.maxSigmaRatio = c.sigmaRatio;
    });

    const prefixContributors = Object.values(prefixGroupMap).map(pg => {
      const abcCount = pg.catACount + pg.catBCount + pg.catCCount;

      let dominantGroup = 'F';
      if (pg.catACount > 0) dominantGroup = 'A';
      else if (pg.catBCount > 0) dominantGroup = 'B';
      else if (pg.catCCount > 0) dominantGroup = 'C';

      let dominantShift = 'Normal';
      if (pg.fullShiftCount > 0) dominantShift = 'Full Shift';
      else if (pg.medianShiftCount > 0) dominantShift = 'Median Shift';

      // Normalized module-level severity score (0 - 100)
      const maxItemScore = pg.items.reduce((max, i) => Math.max(max, i.severityScore || 0), 0);
      const avgItemScore = pg.items.length > 0 ? (pg.items.reduce((sum, i) => sum + i.severityScore, 0) / pg.items.length) : 0;
      
      const baseModuleScore = (maxItemScore * 0.7) + (avgItemScore * 0.3);
      const populationBonus = Math.min(10, (pg.catACount * 3) + (pg.catBCount * 1.5) + (pg.catCCount * 0.5));
      const severityScore = Math.min(100, Math.max(0, Math.round((baseModuleScore + populationBonus) * 10) / 10));

      return {
        prefix: pg.prefix,
        testName: pg.prefix,
        stage: pg.stage,
        totalCount: pg.totalCount,
        abcCount,
        catACount: pg.catACount,
        catBCount: pg.catBCount,
        catCCount: pg.catCCount,
        group: dominantGroup,
        shiftType: dominantShift,
        fullShiftCount: pg.fullShiftCount,
        medianShiftCount: pg.medianShiftCount,
        deltaMean: pg.maxDeltaMean,
        deltaSigma: pg.maxDeltaSigma,
        sigmaRatio: pg.maxSigmaRatio,
        severityScore,
        records: pg.records,
        items: pg.items
      };
    });

    prefixContributors.sort((a, b) => b.severityScore - a.severityScore);
    const topPrefixContributors = prefixContributors.slice(0, 10);

    // Sort individual contributors descending by severity score
    contributors.sort((a, b) => b.severityScore - a.severityScore);
    const topContributors = contributors.slice(0, 10);

    const totalShifted = fullShiftCounts.Total + medianShiftCounts.Total;
    const abcImpactCount = categoryCounts.A + categoryCounts.B + categoryCounts.C;
    const abcImpactPercent = totalParameters > 0 ? ((abcImpactCount / totalParameters) * 100).toFixed(1) : '0.0';

    // Pareto for A, B, C
    const catAPercent = totalParameters > 0 ? (categoryCounts.A / totalParameters) * 100 : 0;
    const catBPercent = totalParameters > 0 ? (categoryCounts.B / totalParameters) * 100 : 0;
    const catCPercent = totalParameters > 0 ? (categoryCounts.C / totalParameters) * 100 : 0;

    // Top domain
    let topDomain = 'GENERAL';
    if (topPrefixContributors.length > 0) {
      topDomain = topPrefixContributors[0].prefix;
    } else {
      let maxDomainScore = -1;
      Object.entries(domainRiskMap).forEach(([dom, score]) => {
        if (score > maxDomainScore) {
          maxDomainScore = score;
          topDomain = dom;
        }
      });
    }

    // Highest Risk Test Item
    const highestRiskTestItem = topContributors.length > 0 ? topContributors[0].testName : 'None';

    // Highest Full Shift Category
    let highestFullShiftCat = 'None';
    if (fullShiftCounts.A > 0) highestFullShiftCat = 'Cat A';
    else if (fullShiftCounts.B > 0) highestFullShiftCat = 'Cat B';
    else if (fullShiftCounts.C > 0) highestFullShiftCat = 'Cat C';

    // Highest Median Shift Category
    let highestMedianShiftCat = 'None';
    if (medianShiftCounts.A > 0) highestMedianShiftCat = 'Cat A';
    else if (medianShiftCounts.B > 0) highestMedianShiftCat = 'Cat B';
    else if (medianShiftCounts.C > 0) highestMedianShiftCat = 'Cat C';

    return {
      totalRawParameters,
      totalParameters,
      ignoredCount,
      ignoredRows,
      ignoreRules: rules,
      totalShifted,
      totalFullShift: fullShiftCounts.Total,
      totalMedianShift: medianShiftCounts.Total,
      categoryCounts,
      fullShiftCounts,
      medianShiftCounts,
      abcImpactCount,
      abcImpactPercent,
      catAPercent,
      catBPercent,
      catCPercent,
      topContributors,
      prefixContributors,
      topPrefixContributors,
      allContributors: contributors,
      topDomain,
      highestRiskTestItem,
      highestFullShiftCat,
      highestMedianShiftCat,
      meta: parsedData.meta
    };
  }

  /**
   * Analyze Bin & Yield Compare data with comprehensive Pareto comparisons
   */
  static analyzeBinCompare(parsedData) {
    if (!parsedData || !parsedData.sections) {
      return null;
    }

    const sec = parsedData.sections;
    const oldHard = sec.oldHardBin || [];
    const newHard = sec.newHardBin || [];
    const transitions = sec.transitions || [];
    const oldSoft = sec.oldSoftBin || [];
    const newSoft = sec.newSoftBin || [];
    const oldFF = sec.oldFirstFail || [];
    const newFF = sec.newFirstFail || [];

    // Find pass counts
    const oldPassRow = oldHard.find(r => (r.OLD_BinState || '').toUpperCase() === 'P' || (r.OLD_BinName || '').toUpperCase().includes('PASS'));
    const newPassRow = newHard.find(r => (r.NEW_BinState || '').toUpperCase() === 'P' || (r.NEW_BinName || '').toUpperCase().includes('PASS'));

    const oldPassRate = oldPassRow ? parseFloat((oldPassRow.Percentage || '0').replace('%', '')) : 0;
    const newPassRate = newPassRow ? parseFloat((newPassRow.Percentage || '0').replace('%', '')) : 0;
    const yieldDelta = newPassRate - oldPassRate;

    // Transition counts
    let ppCount = 0;
    let pfCount = 0; // Critical: Pass to Fail
    let fpCount = 0; // Fail to Pass
    let ffCount = 0;

    transitions.forEach(t => {
      const trans = (t.Transition || '').toLowerCase();
      const cnt = parseInt(t.Count) || 0;
      if (trans === 'pp') ppCount = cnt;
      else if (trans === 'pf') pfCount = cnt;
      else if (trans === 'fp') fpCount = cnt;
      else if (trans === 'ff') ffCount = cnt;
    });

    const totalTested = ppCount + pfCount + fpCount + ffCount;

    // Helper: Compute Pareto Structure with Cumulative Percentages
    function buildParetoDataset(items, totalOld, totalNew, failOldTotal, failNewTotal) {
      // Sort: Pass first or largest newCount, then oldCount
      const allSorted = [...items].sort((a, b) => {
        if (a.isPass && !b.isPass) return -1;
        if (!a.isPass && b.isPass) return 1;
        return (b.newCount - a.newCount) || (b.oldCount - a.oldCount);
      });

      let cumOldAll = 0;
      let cumNewAll = 0;
      allSorted.forEach(it => {
        cumOldAll += it.oldCount;
        cumNewAll += it.newCount;
        it.cumOldPct = totalOld > 0 ? Math.min(100, (cumOldAll / totalOld) * 100) : 0;
        it.cumNewPct = totalNew > 0 ? Math.min(100, (cumNewAll / totalNew) * 100) : 0;
      });

      // Failures Only dataset
      const failItems = items.filter(it => !it.isPass).map(it => ({ ...it }));
      failItems.sort((a, b) => (b.newCount - a.newCount) || (b.oldCount - a.oldCount));

      let cumOldFail = 0;
      let cumNewFail = 0;
      failItems.forEach(it => {
        cumOldFail += it.oldCount;
        cumNewFail += it.newCount;
        it.cumOldPct = failOldTotal > 0 ? Math.min(100, (cumOldFail / failOldTotal) * 100) : 0;
        it.cumNewPct = failNewTotal > 0 ? Math.min(100, (cumNewFail / failNewTotal) * 100) : 0;
      });

      return {
        all: allSorted,
        failOnly: failItems
      };
    }

    // 1. HARD BIN PARETO COMPARISON
    const hardBinMap = new Map();
    let totalOldHardCount = 0;
    let totalNewHardCount = 0;
    let failOldHardCount = 0;
    let failNewHardCount = 0;

    oldHard.forEach(r => {
      const binNum = (r.OLD_Hardbin || '').trim();
      const binName = (r.OLD_BinName || '').trim();
      const binState = (r.OLD_BinState || '').trim().toUpperCase();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const key = `${binNum}_${binName}`;

      totalOldHardCount += count;
      const isPass = binState === 'P' || binName.toUpperCase().includes('PASS');
      if (!isPass) failOldHardCount += count;

      hardBinMap.set(key, {
        key,
        binNum: binNum || 'N/A',
        binName: binName || 'N/A',
        binState: binState || (isPass ? 'P' : 'F'),
        isPass,
        displayName: binNum ? `Bin ${binNum}: ${binName}` : binName,
        oldCount: count,
        oldPct: pct,
        newCount: 0,
        newPct: 0,
        oldRaw: r,
        newRaw: null
      });
    });

    newHard.forEach(r => {
      const binNum = (r.NEW_Hardbin || '').trim();
      const binName = (r.NEW_BinName || '').trim();
      const binState = (r.NEW_BinState || '').trim().toUpperCase();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const key = `${binNum}_${binName}`;

      totalNewHardCount += count;
      const isPass = binState === 'P' || binName.toUpperCase().includes('PASS');
      if (!isPass) failNewHardCount += count;

      if (hardBinMap.has(key)) {
        const item = hardBinMap.get(key);
        item.newCount = count;
        item.newPct = pct;
        item.newRaw = r;
        if (binState) item.binState = binState;
      } else {
        hardBinMap.set(key, {
          key,
          binNum: binNum || 'N/A',
          binName: binName || 'N/A',
          binState: binState || (isPass ? 'P' : 'F'),
          isPass,
          displayName: binNum ? `Bin ${binNum}: ${binName}` : binName,
          oldCount: 0,
          oldPct: 0,
          newCount: count,
          newPct: pct,
          oldRaw: null,
          newRaw: r
        });
      }
    });

    const hardBinItems = Array.from(hardBinMap.values()).map(it => ({
      ...it,
      deltaCount: it.newCount - it.oldCount,
      deltaPct: it.newPct - it.oldPct
    }));
    const hardBinPareto = buildParetoDataset(hardBinItems, totalOldHardCount, totalNewHardCount, failOldHardCount, failNewHardCount);

    // 2. SOFT BIN PARETO COMPARISON
    const softBinMap = new Map();
    let totalOldSoftCount = 0;
    let totalNewSoftCount = 0;
    let failOldSoftCount = 0;
    let failNewSoftCount = 0;

    oldSoft.forEach(r => {
      const name = (r.Soft_Bin_Name || '').trim();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const isPass = name.toUpperCase().includes('PASS') || name.toUpperCase().includes('GOOD');

      totalOldSoftCount += count;
      if (!isPass) failOldSoftCount += count;

      softBinMap.set(name, {
        key: name,
        binName: name,
        displayName: name,
        isPass,
        oldCount: count,
        oldPct: pct,
        newCount: 0,
        newPct: 0,
        oldRaw: r,
        newRaw: null
      });
    });

    newSoft.forEach(r => {
      const name = (r.Soft_Bin_Name || '').trim();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const isPass = name.toUpperCase().includes('PASS') || name.toUpperCase().includes('GOOD');

      totalNewSoftCount += count;
      if (!isPass) failNewSoftCount += count;

      if (softBinMap.has(name)) {
        const item = softBinMap.get(name);
        item.newCount = count;
        item.newPct = pct;
        item.newRaw = r;
      } else {
        softBinMap.set(name, {
          key: name,
          binName: name,
          displayName: name,
          isPass,
          oldCount: 0,
          oldPct: 0,
          newCount: count,
          newPct: pct,
          oldRaw: null,
          newRaw: r
        });
      }
    });

    const softBinItems = Array.from(softBinMap.values()).map(it => ({
      ...it,
      deltaCount: it.newCount - it.oldCount,
      deltaPct: it.newPct - it.oldPct
    }));
    const softBinPareto = buildParetoDataset(softBinItems, totalOldSoftCount, totalNewSoftCount, failOldSoftCount, failNewSoftCount);

    // 3. FIRST FAIL ITEM PARETO COMPARISON
    const ffMap = new Map();
    let totalOldFfCount = 0;
    let totalNewFfCount = 0;
    let failOldFfCount = 0;
    let failNewFfCount = 0;

    oldFF.forEach(r => {
      const testNum = (r.First_Fail_Test_Num || '').trim();
      const testName = (r.First_Fail_Test_Name || '').trim();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const isPass = testNum === 'N/A' || testName === 'N/A' || testName.toUpperCase().includes('PASS');
      const key = `${testNum}_${testName}`;

      totalOldFfCount += count;
      if (!isPass) failOldFfCount += count;

      ffMap.set(key, {
        key,
        testNum,
        testName,
        isPass,
        displayName: isPass ? 'Pass (No Fail)' : `${testNum}: ${testName}`,
        oldCount: count,
        oldPct: pct,
        newCount: 0,
        newPct: 0,
        oldRaw: r,
        newRaw: null
      });
    });

    newFF.forEach(r => {
      const testNum = (r.First_Fail_Test_Num || '').trim();
      const testName = (r.First_Fail_Test_Name || '').trim();
      const count = parseInt(r.Count) || 0;
      const pct = parseFloat((r.Percentage || '0').replace('%', '')) || 0;
      const isPass = testNum === 'N/A' || testName === 'N/A' || testName.toUpperCase().includes('PASS');
      const key = `${testNum}_${testName}`;

      totalNewFfCount += count;
      if (!isPass) failNewFfCount += count;

      if (ffMap.has(key)) {
        const item = ffMap.get(key);
        item.newCount = count;
        item.newPct = pct;
        item.newRaw = r;
      } else {
        ffMap.set(key, {
          key,
          testNum,
          testName,
          isPass,
          displayName: isPass ? 'Pass (No Fail)' : `${testNum}: ${testName}`,
          oldCount: 0,
          oldPct: 0,
          newCount: count,
          newPct: pct,
          oldRaw: null,
          newRaw: r
        });
      }
    });

    const ffItems = Array.from(ffMap.values()).map(it => ({
      ...it,
      deltaCount: it.newCount - it.oldCount,
      deltaPct: it.newPct - it.oldPct
    }));
    const firstFailPareto = buildParetoDataset(ffItems, totalOldFfCount, totalNewFfCount, failOldFfCount, failNewFfCount);

    // Top failure drivers
    const topHardFailDriver = hardBinPareto.failOnly[0] || null;
    const topSoftFailDriver = softBinPareto.failOnly[0] || null;
    const topFirstFailDriver = firstFailPareto.failOnly[0] || null;

    return {
      runMetadata: sec.runMetadata,
      oldHardBin: oldHard,
      newHardBin: newHard,
      transitions,
      oldSoftBin: oldSoft,
      newSoftBin: newSoft,
      oldFirstFail: oldFF,
      newFirstFail: newFF,
      oldPassRate,
      newPassRate,
      yieldDelta,
      ppCount,
      pfCount,
      fpCount,
      ffCount,
      totalTested,
      totalOldHardCount,
      totalNewHardCount,
      failOldHardCount,
      failNewHardCount,
      hardBinPareto,
      softBinPareto,
      firstFailPareto,
      topHardFailDriver,
      topSoftFailDriver,
      topFirstFailDriver,
      meta: parsedData.meta
    };
  }

  /**
   * Analyze TSR (Test Summary Report) data
   */
  static analyzeTsr(parsedData, ignoreRules = []) {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      return null;
    }

    const rules = SemiconductorAnalytics.parseIgnoreRules(ignoreRules);
    const rawAllRows = parsedData.rows;
    const ignoredRows = [];
    const rows = [];

    rawAllRows.forEach(r => {
      if (SemiconductorAnalytics.isTestIgnored(r.Test_Name, r.Test_Number, rules)) {
        ignoredRows.push(r);
      } else {
        rows.push(r);
      }
    });

    const totalRawParameters = rawAllRows.length;
    const totalParameters = rows.length;
    const ignoredCount = ignoredRows.length;
    const totalTestedCount = rawAllRows[0] ? (parseInt(rawAllRows[0].Count) || 0) : 0;

    if (totalParameters === 0) {
      return {
        totalRawParameters,
        totalParameters: 0,
        ignoredCount,
        ignoredRows,
        ignoreRules: rules,
        totalTestedCount,
        totalFailCount: 0,
        overallLossPct: 0,
        overallYieldPct: 100,
        paretoParams: [],
        paramItems: [],
        worstCpkItem: null,
        highestCpkItem: null,
        cpkRiskCount: 0,
        cpkRiskPct: 0,
        cpkCapableCount: 0,
        cpkCapablePct: 0,
        topLossDriver: null,
        allCpkGroupsTable: [],
        allDistShapesTable: [],
        meta: parsedData.meta
      };
    }
    
    let totalFailCount = 0;
    const cpkGroupCounts = {};
    const distCounts = {};
    const paramItems = [];
    const seenGroups = new Set();
    const seenDistributions = new Set();

    rows.forEach(r => {
      const testName = r.Test_Name || 'N/A';
      const testNum = r.Test_Number || 'N/A';
      const failCount = parseInt(r.Fail_Count) || 0;
      const lossPct = parseFloat((r['Loss_%'] || '0').replace('%', '')) || 0;
      totalFailCount += failCount;

      const cpkn = parseFloat(r.Cpkn) || 0;
      let cpknGroupRaw = (r.Cpkn_Group || '').trim();
      const distRaw = (r.Distribution || 'Normal').trim();

      // If missing in CSV, auto-calculate standard capability range
      if (!cpknGroupRaw) {
        if (cpkn < 0.5) cpknGroupRaw = 'CPK < 0.5';
        else if (cpkn < 1.67) cpknGroupRaw = '0.5 ≤ CPK < 1.67';
        else if (cpkn < 4.0) cpknGroupRaw = '1.67 ≤ CPK < 4.0';
        else cpknGroupRaw = 'CPK ≥ 4.0';
      }

      seenGroups.add(cpknGroupRaw);
      cpkGroupCounts[cpknGroupRaw] = (cpkGroupCounts[cpknGroupRaw] || 0) + 1;

      // Dynamically preserve exact distribution shape from CSV
      const distCategory = distRaw || 'Normal';
      seenDistributions.add(distCategory);
      distCounts[distCategory] = (distCounts[distCategory] || 0) + 1;

      paramItems.push({
        testName,
        testNum,
        stage: r.STAGE || 'CP1',
        units: r.UNITS || '',
        loLimit: r.LO_LIMIT || 'N/A',
        hiLimit: r.HI_LIMIT || 'N/A',
        mean: parseFloat(r.Mean) || 0,
        median: parseFloat(r['Median(P50)']) || 0,
        stdDev: parseFloat(r.StdDev) || 0,
        min: parseFloat(r.Min) || 0,
        max: parseFloat(r.Max) || 0,
        p5: parseFloat(r.P5) || 0,
        p95: parseFloat(r.P95) || 0,
        failCount,
        lossPct,
        cpkn,
        cpknGroup: cpknGroupRaw,
        distribution: distCategory,
        skewness: parseFloat(r.Skewness) || 0,
        kurtosis: parseFloat(r.Kurtosis) || 0,
        rawRecord: r
      });
    });

    const overallLossPct = totalTestedCount > 0 ? (totalFailCount / totalTestedCount) * 100 : 0;
    const overallYieldPct = 100 - overallLossPct;

    // Pareto: sort by failCount / lossPct descending
    const paretoParams = [...paramItems].sort((a, b) => b.failCount - a.failCount);
    let cumFailSum = 0;
    paretoParams.forEach(p => {
      cumFailSum += p.failCount;
      p.cumLossPct = totalFailCount > 0 ? (cumFailSum / totalFailCount) * 100 : 0;
    });

    // Lowest (Worst) and Highest Cpk items - Lowest CPK is the true semiconductor quality bottleneck
    const sortedByCpk = [...paramItems].sort((a, b) => a.cpkn - b.cpkn);
    const worstCpkItem = sortedByCpk[0] || null;
    const highestCpkItem = sortedByCpk[sortedByCpk.length - 1] || null;

    // CPK Risk Metrics (Count of items with CPK < 1.67 or in low capability groups)
    const cpkRiskCount = paramItems.filter(p => p.cpkn < 1.67 || p.cpknGroup.includes('< 0.5') || p.cpknGroup.includes('<0.5') || p.cpknGroup.includes('0.5<') || p.cpknGroup.includes('0.5 <')).length;
    const cpkRiskPct = totalParameters > 0 ? (cpkRiskCount / totalParameters) * 100 : 0;
    const cpkCapableCount = totalParameters - cpkRiskCount;
    const cpkCapablePct = totalParameters > 0 ? (cpkCapableCount / totalParameters) * 100 : 0;

    // Top Loss Driver
    const topLossDriver = paretoParams.length > 0 && paretoParams[0].failCount > 0 ? paretoParams[0] : null;

    // Palette for dynamic group coloring
    const COLOR_PALETTES = [
      { hex: '#EF4444', pill: 'red' },      // Red
      { hex: '#F59E0B', pill: 'yellow' },   // Amber
      { hex: '#10B981', pill: 'green' },    // Green
      { hex: '#8B5CF6', pill: 'purple' },   // Purple
      { hex: '#06B6D4', pill: 'cyan' },     // Cyan
      { hex: '#3B82F6', pill: 'blue' },     // Blue
      { hex: '#EC4899', pill: 'pink' },     // Pink
      { hex: '#F97316', pill: 'amber' }     // Orange
    ];

    function getGroupColor(grpName, index) {
      const low = (grpName || '').toLowerCase();
      if (low.includes('< 0.5') || low.includes('<0.5') || low.includes('critical') || low.includes('fail') || low.includes('< 1.0')) {
        return COLOR_PALETTES[0]; // Red
      }
      if ((low.includes('0.5') && low.includes('1.67')) || low.includes('marginal') || low.includes('warn') || low.includes('< 1.33')) {
        return COLOR_PALETTES[1]; // Yellow
      }
      if ((low.includes('1.67') && low.includes('4')) || low.includes('capable') || low.includes('pass')) {
        return COLOR_PALETTES[2]; // Green
      }
      if (low.includes('> 4') || low.includes('>4') || low.includes('over') || low.includes('>= 4')) {
        return COLOR_PALETTES[3]; // Purple
      }
      return COLOR_PALETTES[index % COLOR_PALETTES.length];
    }

    // Build all dynamic CPK Groups into full breakdown table
    const distinctGroupsList = Array.from(seenGroups);
    const allCpkGroupsTable = distinctGroupsList.map((grpKey, idx) => {
      const cnt = cpkGroupCounts[grpKey] || 0;
      const pct = totalParameters > 0 ? ((cnt / totalParameters) * 100).toFixed(1) + '%' : '0.0%';
      const colorObj = getGroupColor(grpKey, idx);

      return {
        key: grpKey,
        name: grpKey,
        criteria: grpKey,
        count: cnt,
        percentage: pct,
        color: colorObj.pill,
        hexColor: colorObj.hex,
        assessment: cnt > 0 ? `${cnt} parameter(s)` : '0 parameters'
      };
    });

    // Build all dynamic Distribution Shapes into full breakdown table
    const distinctDistList = Array.from(seenDistributions);
    const allDistShapesTable = distinctDistList.map((distKey, idx) => {
      const cnt = distCounts[distKey] || 0;
      const pct = totalParameters > 0 ? ((cnt / totalParameters) * 100).toFixed(1) + '%' : '0.0%';
      let hex = COLOR_PALETTES[(idx + 2) % COLOR_PALETTES.length].hex;
      let pill = COLOR_PALETTES[(idx + 2) % COLOR_PALETTES.length].pill;
      const low = distKey.toLowerCase();
      if (low === 'normal' || low.includes('gaussian')) { hex = '#10B981'; pill = 'green'; }
      else if (low === 'double' || low.includes('bimodal') || low.includes('multi')) { hex = '#F59E0B'; pill = 'yellow'; }
      else if (low === 'skewed' || low.includes('skew')) { hex = '#8B5CF6'; pill = 'purple'; }
      else if (low.includes('uniform') || low.includes('flat')) { hex = '#06B6D4'; pill = 'cyan'; }
      else if (low.includes('outlier') || low.includes('tail') || low.includes('anomaly')) { hex = '#EF4444'; pill = 'red'; }

      return {
        key: distKey,
        name: distKey,
        count: cnt,
        percentage: pct,
        hexColor: hex,
        color: pill
      };
    });

    return {
      totalRawParameters,
      totalParameters,
      ignoredCount,
      ignoredRows,
      ignoreRules: rules,
      totalTestedCount,
      totalFailCount,
      overallLossPct,
      overallYieldPct,
      topLossDriver,
      worstCpkItem,
      highestCpkItem,
      cpkRiskCount,
      cpkRiskPct,
      cpkCapableCount,
      cpkCapablePct,
      cpkGroupCounts,
      allCpkGroupsTable,
      distCounts,
      allDistShapesTable,
      paramItems,
      paretoParams,
      lowestCpkItem: worstCpkItem,
      meta: parsedData.meta
    };
  }

  /**
   * Analyze Repeatability data (per-ECID statistics, CV%, Cp, Dist, Dist_Repeat, Trend)
   */
  static analyzeRepeatability(parsedData, ignoreRules = []) {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      return null;
    }

    const rules = SemiconductorAnalytics.parseIgnoreRules(ignoreRules);
    const rawAllRows = parsedData.rows;
    const firstRow = rawAllRows[0] || {};
    const rowKeys = Object.keys(firstRow);
    const normalizedKeys = rowKeys.map(k => ({
      original: k,
      clean: k.toLowerCase().replace(/[^a-z0-9]/g, '')
    }));

    const resolveKey = (...candidates) => {
      for (const c of candidates) {
        if (firstRow[c] !== undefined) return c;
      }
      for (const c of candidates) {
        const cleanC = c.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = normalizedKeys.find(k => k.clean === cleanC);
        if (match) return match.original;
      }
      return null;
    };

    const kTestNum = resolveKey('TEST_NUM', 'Test_Num', 'Test_Number', 'TEST_NO', 'TestNum', 'Test#', 'Test_ID', 'TestID', 'Test');
    const kTestName = resolveKey('Test_Name', 'TEST_NAME', 'TestName', 'Test Name', 'Parameter', 'Param_Name', 'TestDescription');

    const ignoredRows = [];
    const rows = [];

    rawAllRows.forEach(r => {
      const tName = kTestName && r[kTestName] !== undefined ? r[kTestName] : (r.Test_Name || r.TEST_NAME || r.Parameter || '');
      const tNum = kTestNum && r[kTestNum] !== undefined ? r[kTestNum] : (r.TEST_NUM || r.Test_Num || r.Test_Number || '');
      if (SemiconductorAnalytics.isTestIgnored(tName, tNum, rules)) {
        ignoredRows.push(r);
      } else {
        rows.push(r);
      }
    });

    const totalRawRecords = rawAllRows.length;
    const totalRecords = rows.length;
    const ignoredCount = ignoredRows.length;

    if (totalRecords === 0) {
      return {
        totalRawRecords,
        totalRecords: 0,
        ignoredCount,
        ignoredRows,
        ignoreRules: rules,
        lotId: parsedData.lotId || parsedData.meta?.lotId || 'N/A',
        totalEcids: 0,
        totalTests: 0,
        meanCv: 0,
        medianCv: 0,
        minCv: 0,
        maxCv: 0,
        stdCv: 0,
        highCvRiskCount: 0,
        moderateCvCount: 0,
        lowCvCount: 0,
        meanCp: 0,
        medianCp: 0,
        minCp: 0,
        maxCp: 0,
        stdCp: 0,
        lowCpRiskCount: 0,
        criticalCpCount: 0,
        capableCpCount: 0,
        distCounts: {},
        distRepeatCounts: {},
        trendCounts: {},
        distTable: [],
        distRepeatTable: [],
        trendTable: [],
        perEcidStats: [],
        perTestStats: [],
        detailItems: [],
        dominantDistOverall: 'None',
        dominantDistRepeatOverall: 'None',
        dominantTrendOverall: 'None',
        meta: parsedData.meta
      };
    }

    // Helper math functions
    function calcMedian(arr) {
      if (!arr || arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function calcMean(arr) {
      if (!arr || arr.length === 0) return 0;
      return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    }

    function calcMin(arr) {
      if (!arr || arr.length === 0) return 0;
      let min = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] < min) min = arr[i];
      }
      return min;
    }

    function calcMax(arr) {
      if (!arr || arr.length === 0) return 0;
      let max = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
      }
      return max;
    }

    function calcStd(arr, mean) {
      if (!arr || arr.length <= 1) return 0;
      const m = mean !== undefined ? mean : calcMean(arr);
      const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1);
      return Math.sqrt(variance);
    }

    // Global collection maps
    const allCvList = [];
    const allCpList = [];
    const allCpknList = [];
    const distCounts = {};
    const distRepeatCounts = {};
    const trendCounts = {};
    const ecidMap = new Map();
    const testMap = new Map();
    const detailItems = [];
    const headers = parsedData.headers || [];
    const colAHeader = headers.length > 0 ? headers[0] : '';

    const kEcid = resolveKey('Coordinate_ECID', 'Coordinate ECID', 'Coordinate_Ecid', 'ECID', 'Ecid', 'DIE_ECID', 'Die', 'Die_ID', 'DieID', 'Coordinate', 'Coords', 'Site');
    const kUnits = resolveKey('UNITS', 'Units', 'Unit', 'UNIT', 'Measure_Unit');
    const kLoLimit = resolveKey('LO_LIMIT', 'Lo_Limit', 'Low_Limit', 'LSL', 'LowLimit', 'Lower_Limit', 'Min_Limit');
    const kHiLimit = resolveKey('HI_LIMIT', 'Hi_Limit', 'High_Limit', 'USL', 'HighLimit', 'Upper_Limit', 'Max_Limit');
    const kMean = resolveKey('Mean', 'MEAN', 'Avg', 'Average', 'Mean_Val');
    const kStd = resolveKey('Std', 'STD', 'StdDev', 'Std_Dev', 'Sigma', 'Std_Deviation');
    const kEv6Sigma = resolveKey('EV (6-Sigma) [Units]', 'EV (6-Sigma)', 'EV_6Sigma', 'EV6Sigma', 'EV', 'Equipment_Variation');
    const kCv = resolveKey('CV (%)', 'CV%', 'CV', 'CV_PCT', 'CV_Percent', 'Coefficient_Of_Variation');
    const kCp = resolveKey('Cp', 'CP', 'Process_Capability_Cp', 'Capability_Cp', 'CP_Index');
    const kCpkn = resolveKey('CPKn', 'CPKN', 'Cpk', 'CPK', 'Proposed_CPKn', 'Cpk_Index');
    const kP5 = resolveKey('P5', 'p5', 'Percentile_5', 'P05');
    const kP95 = resolveKey('P95', 'p95', 'Percentile_95', 'P95_Val');
    const kKurtosis = resolveKey('Kurtosis (excess)', 'Kurtosis', 'Kurtosis_Excess', 'Excess_Kurtosis');
    const kMax = resolveKey('Max', 'MAX', 'Maximum', 'Max_Val');
    const kMin = resolveKey('Min', 'MIN', 'Minimum', 'Min_Val');
    const kExtDrift = resolveKey('Ext_Drift', 'EXT_DRIFT', 'Ext Drift', 'Drift', 'Drift_Rate');
    const kDist = resolveKey('Dist', 'DIST', 'Distribution', 'Dist_Shape', 'Distribution_Shape');
    const kDistRepeat = resolveKey('Dist_Repeat', 'DIST_REPEAT', 'Dist Repeat', 'Repeat_Dist', 'Repeat_Distribution');
    const kTrend = resolveKey('Trend', 'TREND', 'Trend_Pattern', 'Temporal_Trend', 'Pattern');

    rows.forEach(r => {
      const colAVal = (colAHeader && r[colAHeader] !== undefined && r[colAHeader] !== null && r[colAHeader] !== '') ? String(r[colAHeader]).trim() : '';
      const ecid = (colAVal || (kEcid && r[kEcid] !== undefined ? String(r[kEcid]) : '') || 'Unknown').trim();
      const testNum = String(kTestNum && r[kTestNum] !== undefined ? r[kTestNum] : '').trim();
      const testName = String(kTestName && r[kTestName] !== undefined ? r[kTestName] : testNum || 'Test').trim();
      const units = String(kUnits && r[kUnits] !== undefined ? r[kUnits] : '').trim();
      const loLimit = kLoLimit && r[kLoLimit] !== undefined ? r[kLoLimit] : 'N/A';
      const hiLimit = kHiLimit && r[kHiLimit] !== undefined ? r[kHiLimit] : 'N/A';
      
      const mean = parseFloat(kMean && r[kMean] !== undefined ? r[kMean] : 0) || 0;
      const std = parseFloat(kStd && r[kStd] !== undefined ? r[kStd] : 0) || 0;
      const ev6Sigma = parseFloat(kEv6Sigma && r[kEv6Sigma] !== undefined ? r[kEv6Sigma] : 0) || 0;
      const cv = parseFloat(kCv && r[kCv] !== undefined ? r[kCv] : 0) || 0;
      const cp = parseFloat(kCp && r[kCp] !== undefined ? r[kCp] : 0) || 0;
      const cpkn = parseFloat(kCpkn && r[kCpkn] !== undefined ? r[kCpkn] : 0) || 0;
      const p5 = parseFloat(kP5 && r[kP5] !== undefined ? r[kP5] : 0) || 0;
      const p95 = parseFloat(kP95 && r[kP95] !== undefined ? r[kP95] : 0) || 0;
      const kurtosis = parseFloat(kKurtosis && r[kKurtosis] !== undefined ? r[kKurtosis] : 0) || 0;
      const maxVal = parseFloat(kMax && r[kMax] !== undefined ? r[kMax] : 0) || 0;
      const minVal = parseFloat(kMin && r[kMin] !== undefined ? r[kMin] : 0) || 0;
      const extDrift = parseFloat(kExtDrift && r[kExtDrift] !== undefined ? r[kExtDrift] : 0) || 0;
      const dist = String(kDist && r[kDist] !== undefined ? r[kDist] : 'Unknown').trim();
      const distRepeat = String(kDistRepeat && r[kDistRepeat] !== undefined ? r[kDistRepeat] : 'Unknown').trim();
      const trend = String(kTrend && r[kTrend] !== undefined ? r[kTrend] : 'Unknown').trim();

      allCvList.push(cv);
      allCpList.push(cp);
      allCpknList.push(cpkn);

      distCounts[dist] = (distCounts[dist] || 0) + 1;
      distRepeatCounts[distRepeat] = (distRepeatCounts[distRepeat] || 0) + 1;
      trendCounts[trend] = (trendCounts[trend] || 0) + 1;

      const testKey = `${testNum}_${testName}`;
      const item = {
        ecid,
        testNum,
        testName,
        testKey,
        units,
        loLimit,
        hiLimit,
        mean,
        std,
        ev6Sigma,
        cv,
        cp,
        cpkn,
        p5,
        p95,
        kurtosis,
        max: maxVal,
        min: minVal,
        extDrift,
        dist,
        distRepeat,
        trend,
        _searchBlob: `${ecid} ${testNum} ${testName} ${units} ${dist} ${distRepeat} ${trend}`.toLowerCase(),
        raw: r
      };
      detailItems.push(item);

      // Group per ECID
      if (!ecidMap.has(ecid)) {
        let coordX = null;
        let coordY = null;
        const matchCoord = ecid.match(/_x(-?\d+)_y(-?\d+)/i);
        if (matchCoord) {
          coordX = parseInt(matchCoord[1], 10);
          coordY = parseInt(matchCoord[2], 10);
        }
        ecidMap.set(ecid, {
          ecid,
          coordX,
          coordY,
          coordDisplay: (coordX !== null && coordY !== null) ? `(${coordX}, ${coordY})` : ecid,
          items: [],
          testSet: new Set(),
          cvList: [],
          cpList: [],
          cpknList: [],
          distCounts: {},
          distRepeatCounts: {},
          trendCounts: {}
        });
      }
      const eGroup = ecidMap.get(ecid);
      eGroup.items.push(item);
      if (testName) eGroup.testSet.add(testName);
      if (testNum) eGroup.testSet.add(testNum);
      if (testKey) eGroup.testSet.add(testKey);
      eGroup.cvList.push(cv);
      eGroup.cpList.push(cp);
      eGroup.cpknList.push(cpkn);
      eGroup.distCounts[dist] = (eGroup.distCounts[dist] || 0) + 1;
      eGroup.distRepeatCounts[distRepeat] = (eGroup.distRepeatCounts[distRepeat] || 0) + 1;
      eGroup.trendCounts[trend] = (eGroup.trendCounts[trend] || 0) + 1;

      // Group per Test
      if (!testMap.has(testKey)) {
        testMap.set(testKey, {
          testKey,
          testNum,
          testName,
          units,
          loLimit,
          hiLimit,
          items: [],
          ecidSet: new Set(),
          cvList: [],
          cpList: [],
          cpknList: [],
          meanList: [],
          stdList: [],
          distCounts: {},
          distRepeatCounts: {},
          trendCounts: {}
        });
      }
      const tGroup = testMap.get(testKey);
      tGroup.items.push(item);
      if (ecid) tGroup.ecidSet.add(ecid);
      tGroup.cvList.push(cv);
      tGroup.cpList.push(cp);
      tGroup.cpknList.push(cpkn);
      tGroup.meanList.push(mean);
      tGroup.stdList.push(std);
      tGroup.distCounts[dist] = (tGroup.distCounts[dist] || 0) + 1;
      tGroup.distRepeatCounts[distRepeat] = (tGroup.distRepeatCounts[distRepeat] || 0) + 1;
      tGroup.trendCounts[trend] = (tGroup.trendCounts[trend] || 0) + 1;
    });

    // Compute Overall CV Statistics
    const meanCv = calcMean(allCvList);
    const medianCv = calcMedian(allCvList);
    const minCv = calcMin(allCvList);
    const maxCv = calcMax(allCvList);
    const stdCv = calcStd(allCvList, meanCv);
    const highCvRiskCount = allCvList.filter(v => Math.abs(v) >= 10.0).length;
    const moderateCvCount = allCvList.filter(v => Math.abs(v) >= 5.0 && Math.abs(v) < 10.0).length;
    const lowCvCount = allCvList.filter(v => Math.abs(v) < 5.0).length;

    // Compute Overall Cp Statistics
    const meanCp = calcMean(allCpList);
    const medianCp = calcMedian(allCpList);
    const minCp = calcMin(allCpList);
    const maxCp = calcMax(allCpList);
    const stdCp = calcStd(allCpList, meanCp);
    const lowCpRiskCount = allCpList.filter(v => v < 4.0).length;
    const criticalCpCount = allCpList.filter(v => v < 1.67).length;
    const capableCpCount = allCpList.filter(v => v >= 4.0).length;

    // Helper for dominant category
    function getDominantCategory(mapObj) {
      let dominant = 'N/A';
      let maxCnt = -1;
      Object.entries(mapObj).forEach(([cat, cnt]) => {
        if (cnt > maxCnt) {
          maxCnt = cnt;
          dominant = cat;
        }
      });
      return { dominant, maxCnt };
    }

    function formatDistCellHtml(dCounts, dominant) {
      if (!dCounts || Object.keys(dCounts).length === 0) return `<span class="text-gray-400 text-xs">${dominant || 'N/A'}</span>`;
      const entries = Object.entries(dCounts).filter(([k, v]) => v > 0);
      if (entries.length === 0) return `<span class="text-gray-400 text-xs">${dominant || 'N/A'}</span>`;
      entries.sort((a, b) => b[1] - a[1]);
      const pills = entries.map(([name, count]) => {
        const low = name.toLowerCase();
        let pillClass = 'pill-cyan';
        if (low === 'normal' || low.includes('gaussian')) pillClass = 'pill-green';
        else if (low === 'double' || low.includes('bimodal')) pillClass = 'pill-yellow';
        else if (low.includes('flat') || low.includes('uniform')) pillClass = 'pill-cyan';
        else if (low.includes('heavy') || low.includes('tail') || low.includes('skew')) pillClass = 'pill-purple';
        else if (low.includes('outlier') || low.includes('fail')) pillClass = 'pill-red';
        return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${name}: ${count} items">${name} (${count})</span>`;
      });
      return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
    }

    function formatDistRepeatCellHtml(drCounts, dominant) {
      if (!drCounts || Object.keys(drCounts).length === 0) return `<span class="text-gray-400 text-xs">${dominant || 'N/A'}</span>`;
      const entries = Object.entries(drCounts).filter(([k, v]) => v > 0);
      if (entries.length === 0) return `<span class="text-gray-400 text-xs">${dominant || 'N/A'}</span>`;
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
        return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${name}: ${count} items">${shortName} (${count})</span>`;
      });
      return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
    }

    function formatTrendCellHtml(tCounts, dominant) {
      if (!tCounts || Object.keys(tCounts).length === 0) return `<span class="status-pill pill-green text-[10px]">${dominant || 'Stable'}</span>`;
      const entries = Object.entries(tCounts).filter(([k, v]) => v > 0);
      if (entries.length === 0) return `<span class="status-pill pill-green text-[10px]">${dominant || 'Stable'}</span>`;
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
        if (name.includes('Shift')) { pillClass = 'pill-red'; shortName = 'Step Shift'; }
        else if (name.includes('Drift')) { pillClass = 'pill-yellow'; shortName = 'Thermal Drift'; }
        else if (name.includes('Cyclic')) { pillClass = 'pill-purple'; shortName = 'Cyclic'; }
        else if (name.includes('Stable')) { pillClass = 'pill-green'; shortName = 'Stable Noise'; }
        return `<span class="status-pill ${pillClass} text-[10px] whitespace-nowrap" title="${name}: ${count} items">${shortName} (${count})</span>`;
      });
      return `<div class="flex flex-wrap gap-1 items-center">${pills.join('')}</div>`;
    }

    // Build Per-ECID Summary Array
    const perEcidStats = Array.from(ecidMap.values()).map(e => {
      const eMeanCv = calcMean(e.cvList);
      const eMaxCv = calcMax(e.cvList);
      const eMinCv = calcMin(e.cvList);
      const eMeanCp = calcMean(e.cpList);
      const eMinCp = calcMin(e.cpList);
      const eMaxCp = calcMax(e.cpList);
      const eMeanCpkn = calcMean(e.cpknList);
      const eMinCpkn = calcMin(e.cpknList);

      const dominantDist = getDominantCategory(e.distCounts).dominant;
      const dominantDistRepeat = getDominantCategory(e.distRepeatCounts).dominant;
      const dominantTrend = getDominantCategory(e.trendCounts).dominant;

      const hasThermalDrift = (e.trendCounts['Thermal / Upward-Downward Drift'] || 0) > 0;
      const hasStepShift = (e.trendCounts['Step Shift / Discontinuity'] || 0) > 0;
      const hasCyclic = (e.trendCounts['Cyclic / Oscillatory'] || 0) > 0;
      const hasDriftOrShift = hasThermalDrift || hasStepShift;

      // Risk grading: High Risk (Cp < 1.67 or |CV%| >= 15%), Marginal (Cp < 4.0 or |CV%| >= 8%), Normal (otherwise)
      let riskLevel = 'PASS';
      let riskPill = 'green';
      if (eMinCp < 1.67 || Math.abs(eMaxCv) >= 15.0 || (hasStepShift && eMinCp < 4.0)) {
        riskLevel = 'HIGH RISK';
        riskPill = 'red';
      } else if (eMinCp < 4.0 || Math.abs(eMaxCv) >= 8.0 || hasDriftOrShift) {
        riskLevel = 'MARGINAL';
        riskPill = 'yellow';
      }

      const distKeys = Object.keys(e.distCounts).join(' ');
      const distRepeatKeys = Object.keys(e.distRepeatCounts).join(' ');
      const trendKeys = Object.keys(e.trendCounts).join(' ');
      const _searchBlob = `${e.ecid} ${e.coordDisplay} ${distKeys} ${distRepeatKeys} ${trendKeys} ${riskLevel}`.toLowerCase();

      return {
        ecid: e.ecid,
        coordX: e.coordX,
        coordY: e.coordY,
        coordDisplay: e.coordDisplay,
        testCount: e.items.length,
        meanCv: eMeanCv,
        maxCv: eMaxCv,
        minCv: eMinCv,
        meanCp: eMeanCp,
        minCp: eMinCp,
        maxCp: eMaxCp,
        meanCpkn: eMeanCpkn,
        minCpkn: eMinCpkn,
        distCounts: e.distCounts,
        dominantDist,
        distCellHtml: formatDistCellHtml(e.distCounts, dominantDist),
        distRepeatCounts: e.distRepeatCounts,
        dominantDistRepeat,
        distRepeatCellHtml: formatDistRepeatCellHtml(e.distRepeatCounts, dominantDistRepeat),
        trendCounts: e.trendCounts,
        dominantTrend,
        trendCellHtml: formatTrendCellHtml(e.trendCounts, dominantTrend),
        hasThermalDrift,
        hasStepShift,
        hasCyclic,
        hasDriftOrShift,
        riskLevel,
        riskPill,
        _searchBlob,
        testSet: e.testSet,
        items: e.items
      };
    });

    // Build Per-Test Summary Array
    const perTestStats = Array.from(testMap.values()).map(t => {
      const tMeanCv = calcMean(t.cvList);
      const tMinCv = calcMin(t.cvList);
      const tMaxCv = calcMax(t.cvList);
      const tMedianCv = calcMedian(t.cvList);
      const tStdCv = calcStd(t.cvList, tMeanCv);

      const tMeanCp = calcMean(t.cpList);
      const tMinCp = calcMin(t.cpList);
      const tMaxCp = calcMax(t.cpList);
      const tMedianCp = calcMedian(t.cpList);
      const tStdCp = calcStd(t.cpList, tMeanCp);

      const tMeanCpkn = calcMean(t.cpknList);
      const tMinCpkn = calcMin(t.cpknList);

      const tMeanVal = calcMean(t.meanList);
      const tMeanStd = calcMean(t.stdList);

      const dominantDist = getDominantCategory(t.distCounts).dominant;
      const dominantDistRepeat = getDominantCategory(t.distRepeatCounts).dominant;
      const dominantTrend = getDominantCategory(t.trendCounts).dominant;

      const distKeys = Object.keys(t.distCounts).join(' ');
      const distRepeatKeys = Object.keys(t.distRepeatCounts).join(' ');
      const trendKeys = Object.keys(t.trendCounts).join(' ');
      const _searchBlob = `${t.testNum} ${t.testName} ${t.units} ${t.loLimit} ${t.hiLimit} ${distKeys} ${distRepeatKeys} ${trendKeys}`.toLowerCase();

      return {
        testKey: t.testKey,
        testNum: t.testNum,
        testName: t.testName,
        units: t.units,
        loLimit: t.loLimit,
        hiLimit: t.hiLimit,
        ecidSet: t.ecidSet,
        ecidCount: t.ecidSet.size,
        measurementCount: t.items.length,
        meanCv: tMeanCv,
        minCv: tMinCv,
        maxCv: tMaxCv,
        medianCv: tMedianCv,
        stdCv: tStdCv,
        meanCp: tMeanCp,
        minCp: tMinCp,
        maxCp: tMaxCp,
        medianCp: tMedianCp,
        stdCp: tStdCp,
        meanCpkn: tMeanCpkn,
        minCpkn: tMinCpkn,
        meanVal: tMeanVal,
        meanStd: tMeanStd,
        distCounts: t.distCounts,
        dominantDist,
        distCellHtml: formatDistCellHtml(t.distCounts, dominantDist),
        distRepeatCounts: t.distRepeatCounts,
        dominantDistRepeat,
        distRepeatCellHtml: formatDistRepeatCellHtml(t.distRepeatCounts, dominantDistRepeat),
        trendCounts: t.trendCounts,
        dominantTrend,
        trendCellHtml: formatTrendCellHtml(t.trendCounts, dominantTrend),
        _searchBlob,
        items: t.items
      };
    });

    // Palette mappings for Dist, Dist_Repeat, and Trend
    const distTable = Object.entries(distCounts).map(([k, count]) => {
      const pct = totalRecords > 0 ? ((count / totalRecords) * 100).toFixed(1) + '%' : '0.0%';
      let hex = '#06B6D4';
      let pill = 'cyan';
      const low = k.toLowerCase();
      if (low === 'normal' || low.includes('gaussian')) { hex = '#10B981'; pill = 'green'; }
      else if (low === 'double' || low.includes('bimodal')) { hex = '#F59E0B'; pill = 'yellow'; }
      else if (low.includes('flat') || low.includes('uniform')) { hex = '#06B6D4'; pill = 'cyan'; }
      else if (low.includes('heavy') || low.includes('tail') || low.includes('skew')) { hex = '#8B5CF6'; pill = 'purple'; }
      else if (low.includes('outlier') || low.includes('fail')) { hex = '#EF4444'; pill = 'red'; }
      return { key: k, name: k, count, percentage: pct, pctNum: (count / totalRecords) * 100, hexColor: hex, color: pill };
    }).sort((a, b) => b.count - a.count);

    const distRepeatTable = Object.entries(distRepeatCounts).map(([k, count]) => {
      const pct = totalRecords > 0 ? ((count / totalRecords) * 100).toFixed(1) + '%' : '0.0%';
      let hex = '#10B981';
      let pill = 'green';
      const low = k.toLowerCase();
      if (low.includes('stable non-normal') || low.includes('non-normal')) { hex = '#F59E0B'; pill = 'yellow'; }
      else if (low.includes('normal')) { hex = '#10B981'; pill = 'green'; }
      else if (low.includes('unstable') || low.includes('drift')) { hex = '#EF4444'; pill = 'red'; }
      else { hex = '#06B6D4'; pill = 'cyan'; }
      return { key: k, name: k, count, percentage: pct, pctNum: (count / totalRecords) * 100, hexColor: hex, color: pill };
    }).sort((a, b) => b.count - a.count);

    const trendTable = Object.entries(trendCounts).map(([k, count]) => {
      const pct = totalRecords > 0 ? ((count / totalRecords) * 100).toFixed(1) + '%' : '0.0%';
      let hex = '#10B981';
      let pill = 'green';
      const low = k.toLowerCase();
      if (low.includes('stable') || low.includes('random')) { hex = '#10B981'; pill = 'green'; }
      else if (low.includes('thermal') || low.includes('drift')) { hex = '#F59E0B'; pill = 'yellow'; }
      else if (low.includes('step') || low.includes('shift') || low.includes('discontinuity')) { hex = '#EF4444'; pill = 'red'; }
      else if (low.includes('cyclic') || low.includes('oscillat')) { hex = '#8B5CF6'; pill = 'purple'; }
      else { hex = '#06B6D4'; pill = 'cyan'; }
      return { key: k, name: k, count, percentage: pct, pctNum: (count / totalRecords) * 100, hexColor: hex, color: pill };
    }).sort((a, b) => b.count - a.count);

    // Identify dominant trends and worst bottlenecks
    const dominantTrendOverall = trendTable.length > 0 ? trendTable[0].name : 'N/A';
    const worstCpItem = [...detailItems].sort((a, b) => a.cp - b.cp)[0] || null;
    const highestCvItem = [...detailItems].sort((a, b) => b.cv - a.cv)[0] || null;
    const worstPerEcid = [...perEcidStats].sort((a, b) => a.minCp - b.minCp)[0] || null;

    return {
      totalRawRecords,
      totalRecords,
      ignoredCount,
      ignoredRows,
      ignoreRules: rules,
      totalEcids: ecidMap.size,
      totalTests: testMap.size,
      allCvList,
      allCpList,
      allCpknList,
      meanCv,
      medianCv,
      minCv,
      maxCv,
      stdCv,
      highCvRiskCount,
      moderateCvCount,
      lowCvCount,
      meanCp,
      medianCp,
      minCp,
      maxCp,
      stdCp,
      lowCpRiskCount,
      criticalCpCount,
      capableCpCount,
      distCounts,
      distTable,
      distRepeatCounts,
      distRepeatTable,
      trendCounts,
      trendTable,
      dominantTrendOverall,
      worstCpItem,
      highestCvItem,
      worstPerEcid,
      perEcidStats,
      perTestStats,
      detailItems,
      meta: parsedData.meta
    };
  }
}

window.SemiconductorAnalytics = SemiconductorAnalytics;
