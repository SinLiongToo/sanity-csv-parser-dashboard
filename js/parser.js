function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

class CsvParserEngine {
  /**
   * Detect delimiter (, or ; or \t) from the header/first line of CSV text
   */
  static detectDelimiter(sampleText) {
    if (!sampleText) return ',';
    const firstLine = sampleText.split(/\r\n|\r|\n/)[0] || '';
    let commaCount = 0;
    let semiCount = 0;
    let tabCount = 0;
    let inQ = false;
    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (ch === '"') inQ = !inQ;
      else if (!inQ) {
        if (ch === ',') commaCount++;
        else if (ch === ';') semiCount++;
        else if (ch === '\t') tabCount++;
      }
    }
    if (tabCount > commaCount && tabCount > semiCount) return '\t';
    if (semiCount > commaCount && semiCount > tabCount) return ';';
    return ',';
  }

  /**
   * Parse arbitrary CSV text with quoted values, commas/tabs/semicolons, and multiline support
   */
  static parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    const delimiter = this.detectDelimiter(text.slice(0, 4000));
    const delimCode = delimiter.charCodeAt(0);
    const lines = [];
    let row = [];
    let inQuotes = false;
    let start = 0;
    let hasQuotes = false;
    const len = text.length;

    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);

      if (code === 34) { // '"'
        hasQuotes = true;
        if (inQuotes && i + 1 < len && text.charCodeAt(i + 1) === 34) {
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (code === delimCode && !inQuotes) {
        let cell = text.slice(start, i);
        if (hasQuotes) {
          cell = cell.replace(/^"|"$/g, '').replace(/""/g, '"');
        }
        row.push(cell.trim());
        start = i + 1;
        hasQuotes = false;
      } else if ((code === 10 || code === 13) && !inQuotes) {
        let cell = text.slice(start, i);
        if (hasQuotes) {
          cell = cell.replace(/^"|"$/g, '').replace(/""/g, '"');
        }
        row.push(cell.trim());
        if (code === 13 && i + 1 < len && text.charCodeAt(i + 1) === 10) {
          i++; // Skip \r\n
        }
        start = i + 1;
        hasQuotes = false;

        if (row.length > 0 && row.some(c => c.length > 0)) {
          lines.push(row);
        }
        row = [];
      }
    }

    if (start < len) {
      let cell = text.slice(start);
      if (hasQuotes) {
        cell = cell.replace(/^"|"$/g, '').replace(/""/g, '"');
      }
      row.push(cell.trim());
    }
    if (row.length > 0 && row.some(c => c.length > 0)) {
      lines.push(row);
    }

    return lines;
  }

  /**
   * Automatically detect the type of CSV file
   * @param {string} text
   * @param {string} filename
   * @returns {'itemcompare' | 'dsacompare' | 'bincompare' | 'tsr' | 'repeatability' | 'unknown'}
   */
  static detectType(text, filename = '') {
    if (text && text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    const fnLower = (filename || '').toLowerCase();
    if (fnLower.includes('repeatability') || fnLower.includes('repeat_') || fnLower.includes('repeat') || fnLower.includes('retest') || fnLower.includes('rep_') || fnLower.includes('_rep') || fnLower.includes('grr') || fnLower.includes('gauge') || fnLower.includes('gage')) {
      return 'repeatability';
    }
    if (fnLower.startsWith('tsr') || fnLower.includes('tsr_') || fnLower.includes('test_summary') || fnLower.includes('testsummary')) {
      return 'tsr';
    }
    if (fnLower.includes('itemcompare')) return 'itemcompare';
    if (fnLower.includes('dsacompare')) return 'dsacompare';
    if (fnLower.includes('bincompare')) return 'bincompare';

    const sample = (text || '').slice(0, 4000).toLowerCase();
    if (
      sample.includes('coordinate_ecid') ||
      sample.includes('coordinate ecid') ||
      sample.includes('dist_repeat') ||
      sample.includes('dist repeat') ||
      sample.includes('ext_drift') ||
      sample.includes('ext drift') ||
      sample.includes('ev (6-sigma)') ||
      sample.includes('ev_6sigma') ||
      (sample.includes('ecid') && (sample.includes('mean') || sample.includes('std') || sample.includes('cv') || sample.includes('cp'))) ||
      (sample.includes('trend') && (sample.includes('cv') || sample.includes('cp') || sample.includes('dist'))) ||
      (sample.includes('kurtosis') && (sample.includes('test_name') || sample.includes('testname') || sample.includes('ecid')))
    ) {
      return 'repeatability';
    }
    if (sample.includes('proposed_cpkn') || (sample.includes('distribution') && sample.includes('cpkn_group')) || sample.includes('proposed_lo_limit') || sample.includes('cpknl') || sample.includes('cpknh')) {
      return 'tsr';
    }
    if (sample.includes('binstate switch transitions') || sample.includes('old bin distribution') || sample.includes('run metadata')) {
      return 'bincompare';
    }
    if (sample.includes('dsa_group') || sample.includes('delta_robust_sigma') || sample.includes('old_cpkn') || sample.includes('delta_sigma')) {
      return 'dsacompare';
    }
    if (sample.includes('status') && (sample.includes('old_test_num') || sample.includes('new_test_num') || sample.includes('comparison'))) {
      return 'itemcompare';
    }

    // Heuristic fallback for any file with ECID or Coordinate header
    if (sample.includes('ecid') || sample.includes('coordinate')) {
      return 'repeatability';
    }

    // Fallback if dropped directly while inside a specific tab
    if (typeof window !== 'undefined' && window.app && window.app.state && window.app.state.activeTab) {
      const active = window.app.state.activeTab;
      if (['repeatability', 'tsr', 'itemcompare', 'dsacompare', 'bincompare'].includes(active)) {
        return active;
      }
      if (active === 'item') return 'itemcompare';
      if (active === 'dsa') return 'dsacompare';
      if (active === 'bin') return 'bincompare';
    }

    return 'unknown';
  }

  /**
   * Extract program metadata from filename
   */
  static extractFilenameMetadata(filename) {
    const meta = {
      rawName: filename,
      oldProgram: 'N/A',
      newProgram: 'N/A',
      oldStage: 'N/A',
      newStage: 'N/A',
      timestamp: 'N/A'
    };

    if (!filename) return meta;

    // Try extracting date/time pattern (YYYYMMDD_HHMMSS)
    const timeMatch = filename.match(/(\d{8})_(\d{6})/);
    if (timeMatch) {
      const d = timeMatch[1];
      const t = timeMatch[2];
      meta.timestamp = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)} ${t.substring(0, 2)}:${t.substring(2, 4)}:${t.substring(4, 6)}`;
    }

    // Try extracting TSR tokens (e.g. TSR_CP1_MAIN_PROG_REV_A_01_20260825_140849.csv)
    if (filename.startsWith('TSR_') || filename.includes('_TSR_')) {
      const parts = filename.replace(/\.csv$/i, '').split('_');
      if (parts.length >= 3) {
        meta.newStage = parts[1];
        meta.newProgram = parts.slice(2, -2).join('_') || parts[2];
      }
    }

    // Try extracting Repeatability tokens (e.g. 01_LOT123_CP1_MAIN_PROG_REV_A_repeatability_new_20260826_163203.csv)
    if (filename.toLowerCase().includes('repeatability')) {
      const repIdx = filename.toLowerCase().indexOf('repeatability');
      const prefix = filename.substring(0, repIdx).replace(/_+$/, '');
      const parts = prefix.split('_');
      if (parts.length >= 3) {
        // e.g. ["01", "LOT123", "CP1", "MAIN", "PROG", "REV", "A"]
        const stageIdx = parts.findIndex(p => /^CP\d+$/i.test(p) || /^FT\d*$/i.test(p));
        if (stageIdx > -1) {
          meta.newStage = parts[stageIdx];
          meta.newProgram = parts.slice(stageIdx + 1).join('_') || parts.slice(stageIdx).join('_');
        } else {
          meta.newProgram = prefix;
        }
      } else {
        meta.newProgram = prefix || filename;
      }
    }

    // Try extracting comparison tokens: OLD_vs_NEW
    const vsIndex = filename.indexOf('_vs_');
    if (vsIndex > -1) {
      const leftPart = filename.substring(0, vsIndex);
      const rightPart = filename.substring(vsIndex + 4);
      meta.oldProgram = leftPart.replace(/^.*[\\\/]/, '');
      
      const nextUnderscore = rightPart.search(/_(itemcompare|dsacompare|bincompare|tsr)/i);
      if (nextUnderscore > -1) {
        meta.newProgram = rightPart.substring(0, nextUnderscore);
      } else {
        meta.newProgram = rightPart.replace(/\.csv$/i, '');
      }
    }

    return meta;
  }

  /**
   * Parse Item Compare CSV (flat tabular)
   */
  static parseItemCompare(csvText, filename = '') {
    const rawRows = this.parseCSV(csvText);
    if (rawRows.length < 2) {
      return { error: 'Empty or invalid Item Compare CSV', rows: [], meta: {} };
    }

    const headers = rawRows[0].map(h => h.trim());
    const rows = [];

    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (r.length === 0 || (r.length === 1 && !r[0])) continue;
      const obj = { _rawRowIndex: i + 1 };
      headers.forEach((h, idx) => {
        obj[h] = r[idx] !== undefined ? r[idx] : '';
      });
      rows.push(obj);
    }

    const meta = this.extractFilenameMetadata(filename);
    if (rows.length > 0) {
      if (rows[0].OLD_Program) meta.oldProgram = rows[0].OLD_Program;
      if (rows[0].NEW_Program) meta.newProgram = rows[0].NEW_Program;
      if (rows[0].OLD_Stage) meta.oldStage = rows[0].OLD_Stage;
      if (rows[0].NEW_Stage) meta.newStage = rows[0].NEW_Stage;
    }

    return {
      type: 'itemcompare',
      filename,
      headers,
      rows,
      meta,
      rawText: csvText
    };
  }

  /**
   * Parse DSA Compare CSV (flat tabular)
   */
  static parseDsaCompare(csvText, filename = '') {
    const rawRows = this.parseCSV(csvText);
    if (rawRows.length < 2) {
      return { error: 'Empty or invalid DSA Compare CSV', rows: [], meta: {} };
    }

    const headers = rawRows[0].map(h => h.trim());
    const rows = [];

    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (r.length === 0 || (r.length === 1 && !r[0])) continue;
      const obj = { _rawRowIndex: i + 1 };
      headers.forEach((h, idx) => {
        const val = r[idx] !== undefined ? r[idx] : '';
        const numVal = parseFloat(val);
        obj[h] = val;
        if (!isNaN(numVal) && isFinite(val) && val.trim() !== '') {
          obj[`_num_${h}`] = numVal;
        }
      });
      rows.push(obj);
    }

    const meta = this.extractFilenameMetadata(filename);
    if (rows.length > 0) {
      if (rows[0].OLD_Program) meta.oldProgram = rows[0].OLD_Program;
      if (rows[0].NEW_Program) meta.newProgram = rows[0].NEW_Program;
      if (rows[0].OLD_Stage) meta.oldStage = rows[0].OLD_Stage;
      if (rows[0].NEW_Stage) meta.newStage = rows[0].NEW_Stage;
    }

    return {
      type: 'dsacompare',
      filename,
      headers,
      rows,
      meta,
      rawText: csvText
    };
  }

  /**
   * Parse Multi-Section Bin Compare CSV
   */
  static parseBinCompare(csvText, filename = '') {
    const lines = csvText.split(/\r?\n/).map(l => l.trim());
    const sections = {
      runMetadata: {},
      oldHardBin: [],
      newHardBin: [],
      transitions: [],
      oldSoftBin: [],
      newSoftBin: [],
      oldFirstFail: [],
      newFirstFail: []
    };

    let currentSection = null;
    let sectionHeaders = [];

    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] || '').trim();
      if (!line) {
        continue;
      }

      if (line.includes('=== Run Metadata ===')) {
        currentSection = 'runMetadata';
        continue;
      } else if (line.includes('OLD Bin Distribution (Hard Bin)')) {
        currentSection = 'oldHardBin';
        sectionHeaders = [];
        continue;
      } else if (line.includes('NEW Bin Distribution (Hard Bin)')) {
        currentSection = 'newHardBin';
        sectionHeaders = [];
        continue;
      } else if (line.includes('Binstate Switch Transitions')) {
        currentSection = 'transitions';
        sectionHeaders = [];
        continue;
      } else if (line.includes('OLD Soft Bin Distribution')) {
        currentSection = 'oldSoftBin';
        sectionHeaders = [];
        continue;
      } else if (line.includes('NEW Soft Bin Distribution')) {
        currentSection = 'newSoftBin';
        sectionHeaders = [];
        continue;
      } else if (line.includes('OLD First Fail Parameter Distribution')) {
        currentSection = 'oldFirstFail';
        sectionHeaders = [];
        continue;
      } else if (line.includes('NEW First Fail Parameter Distribution')) {
        currentSection = 'newFirstFail';
        sectionHeaders = [];
        continue;
      }

      const parsedRow = CsvParserEngine.parseCSV(line)[0] || [];
      if (parsedRow.length === 0) continue;

      if (currentSection === 'runMetadata') {
        for (let k = 0; k < parsedRow.length; k += 2) {
          const key = parsedRow[k];
          const val = parsedRow[k + 1] || '';
          if (key) sections.runMetadata[key] = val;
        }
      } else if (currentSection) {
        if (sectionHeaders.length === 0) {
          sectionHeaders = parsedRow;
        } else {
          const obj = { _lineIndex: i + 1 };
          sectionHeaders.forEach((h, idx) => {
            obj[h] = parsedRow[idx] !== undefined ? parsedRow[idx] : '';
          });
          sections[currentSection].push(obj);
        }
      }
    }

    const meta = this.extractFilenameMetadata(filename);
    if (sections.runMetadata['OLD Stage']) meta.oldStage = sections.runMetadata['OLD Stage'];
    if (sections.runMetadata['NEW Stage']) meta.newStage = sections.runMetadata['NEW Stage'];

    return {
      type: 'bincompare',
      filename,
      sections,
      meta,
      rawText: csvText
    };
  }

  /**
   * Parse TSR (Test Summary Report) CSV
   */
  static parseTsr(csvText, filename = '') {
    const rawRows = this.parseCSV(csvText);
    if (rawRows.length < 2) {
      return { error: 'Empty or invalid TSR CSV', rows: [], meta: {} };
    }

    const headers = rawRows[0].map(h => h.trim());
    const rows = [];

    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (r.length === 0 || (r.length === 1 && !r[0])) continue;
      const obj = { _rawRowIndex: i + 1 };
      headers.forEach((h, idx) => {
        obj[h] = r[idx] !== undefined ? r[idx] : '';
      });
      rows.push(obj);
    }

    const meta = this.extractFilenameMetadata(filename);
    if (rows.length > 0) {
      if (rows[0].Program) meta.newProgram = rows[0].Program;
      if (rows[0].STAGE) meta.newStage = rows[0].STAGE;
    }

    return {
      type: 'tsr',
      filename,
      headers,
      rows,
      meta,
      rawText: csvText
    };
  }

  /**
   * Parse Repeatability CSV (Coordinate_ECID, TEST_NUM, Test_Name, Mean, Std, EV (6-Sigma) [Units], CV (%), Cp, CPKn, P5, P95, Kurtosis (excess), Max, Min, Ext_Drift, LO_LIMIT, HI_LIMIT, UNITS, Dist, Dist_Repeat, Trend)
   */
  static parseRepeatability(csvText, filename = '') {
    const rawRows = this.parseCSV(csvText);
    if (rawRows.length < 2) {
      return { error: 'Empty or invalid Repeatability CSV', rows: [], meta: {} };
    }

    const headers = rawRows[0].map(h => h.trim());
    const rows = [];

    const headerCount = headers.length;
    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (r.length === 0 || (r.length === 1 && !r[0])) continue;
      const obj = { _rawRowIndex: i + 1 };
      for (let j = 0; j < headerCount; j++) {
        obj[headers[j]] = r[j] !== undefined ? r[j] : '';
      }
      rows.push(obj);
    }

    const meta = this.extractFilenameMetadata(filename);

    return {
      type: 'repeatability',
      filename,
      headers,
      rows,
      meta,
      rawText: csvText
    };
  }

  /**
   * Universal loader that handles any CSV string and routes to correct parser
   */
  static parseFile(csvText, filename = '') {
    const type = this.detectType(csvText, filename);
    if (type === 'repeatability') {
      return this.parseRepeatability(csvText, filename);
    } else if (type === 'tsr') {
      return this.parseTsr(csvText, filename);
    } else if (type === 'itemcompare') {
      return this.parseItemCompare(csvText, filename);
    } else if (type === 'dsacompare') {
      return this.parseDsaCompare(csvText, filename);
    } else if (type === 'bincompare') {
      return this.parseBinCompare(csvText, filename);
    } else {
      return this.parseItemCompare(csvText, filename);
    }
  }
}

window.CsvParserEngine = CsvParserEngine;
