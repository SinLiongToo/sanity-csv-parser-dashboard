# Semiconductor Sanity CSV Parser & Executive Dashboard

> **DATA ANALYSIS EXECUTIVE DASHBOARD • ATE VALIDATION PLATFORM @ Masa Tu**

一個專為半導體測試工程（ATE / Product Engineering / Validation）設計的深色/淺色科技感 Executive Dashboard 與 HTML/CSV 解析器。支援跨版本測試程式（Test Program Revision）與機台階段（Stage）的資料比對、參數漂移分析、Yield Bin 統計、**Test Summary Report (TSR) 參數失效 Pareto、CPK 製程能力分組與分佈形態分析**、全指標數字溯源（Traceability），以及一鍵匯出高階主管 16:9 簡報（PPTX/PDF）。

---

## 🌟 核心功能特色 (Key Features)

### 1. Power BI 風格雙主題視覺儀表板 (Dark & Light Theme)
- **深色海軍藍工程主題**（Dark Navy Blue Semiconductor Dashboard）與 **淺色工程審查主題**（Light Executive Theme）。
- 頂部導覽列提供 **☀️/🌙 一鍵切換主題開關**，圖表配色、格線與文字自動切換適應，並持久化保存偏好設定。
- **多分頁架構（Multi-Tab Navigation）**：
  1. 📊 **Executive Overview**：跨檔案綜合健康度、PASS / REVIEW 評級、關鍵 KPI 速覽。
  2. 🔍 **Item Sanity Check**：依據 `sanity_ITEM COMPARSION.txt` 規格呈現狀態圓餅圖、Pareto 分析圖、結構變更（Added/Removed）、Top 10 重新命名遷移分佈、工程計分卡（Engineering Scorecard）與自動產出結論。
  3. ⚡ **DSA Parameter Shift**：依據 `DSA.txt` 規格呈現 Category A/B/C Pareto、Full Shift vs. Median Shift 優先矩陣、Top 10 參數漂移排行、領域（Domain）風險分析與主管速覽。
  4. 🏷️ **Bin & Yield Compare**：Hard Bin / Soft Bin 良率對比圖、Binstate 狀態轉換（`pp`, `pf`, `fp`, `ff` 轉移矩陣，醒目標示 `pf` 良率損失風險）、First Fail 參數 Pareto。
  5. 📈 **TSR Test Summary**：**Parameter Failure Pareto（雙軸累計失效率）、CPK 製程能力分組圓餅圖（Critical/Marginal/Capable/Over-spec）、Distribution 分佈形態長條圖（Normal/Bimodal Double/Skewed），以及完整參數極限與統計矩陣資料表。**
  6. 🔬 **Trace Explorer**：支援全欄位即時搜尋、篩選與 CSV 子集匯出。
  7. ❓ **Help & Documentation**：內建半導體指標字典、計算公式與 CSV 規格手冊。

### 2. 即時 CSV 解析與動態更新 (Live Drag & Drop Parser)
- 頂部支援 **拖曳上傳（Drag & Drop）** 或點擊上傳多個 CSV 檔案。
- 自動辨識 CSV 類型（`itemcompare`、`dsacompare`、`bincompare`、`tsr`）與多區塊格式。
- 上傳新資料後，所有 KPI 卡片、圖表、Scorecard、投影片匯出資料即時自動重新計算並更新。
- 預載 Workspace 範例資料，直接開啟 `index.html` 即可立即體驗，無需本機後端伺服器。

### 3. 全數字溯源機制 (Interactive Number Traceability)
- **點擊即溯源**：點擊任何 KPI 卡片、圓餅圖切片、長條圖柱體或 Scorecard 列，立即從右側滑出 **Data Traceability Inspector** 抽屜。
- **計算公式與數學推導證明**：清楚展示該數字的計算邏輯（例如 `Match Rate = 1 / 7 = 14.3%`、`Delta Sigma = 302715.96`、`TSR Loss = 57 / 9850 = 0.58%`）。
- **原始資料即時篩選**：直接列出構成該數字的原始 CSV 列，支援內部搜尋與單獨匯出子集 CSV。

### 4. 精準 16:9 高階主管簡報匯出 (PowerPoint / PDF Export)
- **📊 Export PPTX**：使用 PptxGenJS 本地生成 16:9 寬螢幕投影片（13.33" x 7.5"），包含 4 張高階主管投影片（Item Check、DSA Shift、Bin & Yield、TSR Test Summary），精確校準邊界與表格行高，**徹底消除溢出或超出投影片邊界的問題**。
- **🎨 投影片主題同步**：PPT 匯出自動依據目前畫面所選的深色/淺色主題生成對應的簡報配色，所有文字與表格均為原生可編輯格式。
- **📄 Export PDF**：套用專業列印媒體樣式，輸出清晰高密度的工程審查報告。

---

## 🔍 CSV 格式判斷機制 (How System Identifies CSVs)

系統採用**「雙重智慧判斷機制」（檔名關鍵字識別 ＋ 內容特徵結構兜底）**：

### 1. 第一階段：檔名關鍵字優先識別 (Filename Heuristics)
當使用者上傳檔案時，系統會先比對檔名：
- 檔名以 `tsr` / `tsr_` 開頭或包含 `test_summary` ➔ 自動載入至 **TSR Test Summary**
- 檔名包含 `itemcompare` ➔ 自動載入至 **Item Sanity Check**
- 檔名包含 `dsacompare` ➔ 自動載入至 **DSA Parameter Shift**
- 檔名包含 `bincompare` ➔ 自動載入至 **Bin & Yield Compare**

### 2. 第二階段：內容結構與欄位特徵兜底 (Content Signature Fallback)
**即使您更換了任意自訂檔名**（例如 `test1.csv`、`data.csv`、`report.csv`），系統也不會辨識失敗，解析引擎會自動掃描檔案前 3000 字元的**表頭（Header）與區塊標記**：

| CSV 類型 | 內容特徵關鍵字（Content Signature） |
| :--- | :--- |
| **TSR Test Summary** | 包含 `PROPOSED_Cpkn` 或同時含有 `Distribution` 與 `Cpkn_Group`、`PROPOSED_LO_LIMIT` 等欄位。 |
| **Bin Compare** | 包含 `=== Run Metadata ===`、`Binstate Switch Transitions`、`OLD Bin Distribution` 或 `Hard Bin` 等多區塊結構標記。 |
| **DSA Compare** | 包含 `DSA_Group`、`Delta_Robust_Sigma`、`Delta_Mean`、`Sigma_Ratio` 或 `OLD_CPKn` 等統計欄位。 |
| **Item Compare** | 包含 `Status` 欄位，且同時含有 `Comparison`、`OLD_Test_Num` 或 `NEW_Test_Num` 等比對定義欄位。 |

---

## 📂 專案架構 (Project Structure)

```text
SANITY_CSV_PARSER/
├── semiconductor_dashboard_standalone.html           # ⭐ 100% 單一獨立 HTML 檔案（內嵌所有 CSS/JS，免安裝/免依賴目錄）
├── index.html                                        # 模組化主儀表板 HTML (Power BI 6 Tabs 介面)
├── bundle_standalone.py                              # 自動打包單一獨立 HTML 之 Python 腳本
├── css/
│   └── dashboard.css                                 # 深色/淺色半導體儀表板樣式 & 列印樣式
├── js/
│   ├── default_data.js                               # 內建預設資料（包含 TSR 等 4 組 CSV）
│   ├── parser.js                                     # 多格式 CSV 解析引擎（自動識別型態）
│   ├── analytics.js                                  # 統計與指標計算核心（TSR / DSA / Item / Bin 規則）
│   ├── traceability.js                               # 數字溯源與 Drilldown 抽屜管理器
│   ├── charts.js                                     # Chart.js 圖表封裝（Pareto, CPK Donut, Distribution Bar）
│   ├── export.js                                     # PPTX (PptxGenJS) & PDF 匯出模組（4 Slides 精準 16:9）
│   └── app.js                                        # 主控制器、主題切換與事件綁定
├── TSR_CP1_MAIN_PROG_REV_A_01_20260825_140849.csv    # 範例 TSR Test Summary CSV
├── 01_LOT123_..._bincompare_...csv                   # 範例 Bin Compare CSV
├── 01_LOT123_..._dsacompare_...csv                   # 範例 DSA Compare CSV
├── 01_LOT123_..._itemcompare_...csv                  # 範例 Item Compare CSV
├── DSA.txt                                           # DSA 分析投影片設計規範
├── sanity_ITEM COMPARSION.txt                        # Item Comparison 分析投影片規範
└── README.md                                         # 系統技術文件與說明手冊
```

---

## 📊 支援的 CSV 格式規範 (Supported CSV Schemas)

### 1. TSR Test Summary CSV (`*TSR*.csv`)
欄位範例：
`Program, Tester, Test_Number, Test_Name, STAGE, Count, ORIG_LO_LIMIT, ORIG_HI_LIMIT, PROPOSED_LO_LIMIT, PROPOSED_HI_LIMIT, LO_LIMIT, HI_LIMIT, UNITS, Loss_%, Fail_Count, PROPOSED_Loss_%, PROPOSED_Fail_Count, PROPOSED_Cpknl, PROPOSED_Cpknh, PROPOSED_Cpkn, PROPOSED_Cpkn_Group, Mean, Min, P5, Median(P50), P95, Max, StdDev, Cpknl, Cpknh, Cpkn, Skewness, Kurtosis, Distribution, Cpkn_Group`
- **主要分析維度**：
  - **Parameter Loss Pareto**：依 `Fail_Count` 與 `Loss_%` 由高到低排序，繪製雙軸 Pareto 累計失效率曲線。
  - **CPK Group 分組**：`Critical (CPK < 0.5)`、`Marginal (0.5 < CPK < 1.67)`、`Capable (1.67 < CPK < 4)`、`Over-spec (CPK > 4)`。
  - **Distribution 形態分佈**：`Normal` (高斯常態)、`Double` (雙峰/多模態)、`Skewed` (偏態)，搭配 Skewness (偏度) 與 Kurtosis (峰度) 預警。

### 2. Item Compare CSV (`*itemcompare*.csv`)
欄位範例：
`Comparison, Test_Name, Status, OLD_Stage, OLD_Program, NEW_Stage, NEW_Program, OLD_Test_Num, NEW_Test_Num, OLD_LSL, NEW_LSL, OLD_USL, NEW_USL, OLD_Units, NEW_Units, Description`

### 3. DSA Compare CSV (`*dsacompare*.csv`)
欄位範例：
`Test_Name, TEST_NUM, OLD_Stage, OLD_Program, NEW_Stage, NEW_Program, OLD_Mean, NEW_Mean, Delta_Mean, OLD_Sigma, NEW_Sigma, Delta_Sigma, Delta_Robust_Sigma, Sigma_Ratio, OLD_CPKn, NEW_CPKn, OLD_Min, NEW_Min, OLD_Max, NEW_Max, OLD_P5, NEW_P5, OLD_P95, NEW_P95, OLD_P50, NEW_P50, OLD_LSL, OLD_USL, NEW_LSL, NEW_USL, OLD_Units, NEW_Units, DSA_Group`

### 4. Bin Compare CSV (`*bincompare*.csv`)
多區塊格式：
- `=== Run Metadata ===`（機台、Stage、測試程式版本）
- `OLD Bin Distribution (Hard Bin)` & `NEW Bin Distribution (Hard Bin)`
- `Binstate Switch Transitions (pp/fp/pf/ff)`
- `OLD Soft Bin Distribution` & `NEW Soft Bin Distribution`
- `OLD First Fail Parameter Distribution` & `NEW First Fail Parameter Distribution`

---

## 🚀 快速開始使用 (Getting Started)

1. **直接開啟**：在瀏覽器中雙擊開啟 [`index.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/index.html)。
2. **切換淺色/深色主題**：點擊頂部導覽列的 **☀️ Light / 🌙 Dark** 按鈕切換視覺風格。
3. **切換 TSR Test Summary 分頁**：點擊 **📈 TSR Test Summary** 即可檢視 Parameter Pareto、Cpk 分組圓餅圖、Distribution 形態分佈與統計表。
4. **上傳新數據**：將新的 CSV 檔案直接拖拉至頂部「Drop CSV files here」橫幅，系統會自動辨識並即時更新儀表板。
5. **數字溯源**：在任何圖表柱體、切片或 KPI 卡片上點擊，即可檢視原始 CSV 列與計算推導。
6. **匯出 4 頁簡報**：點擊右上角 **📊 Export PPTX** 即可下載包含 TSR Test Summary 的 16:9 PowerPoint 簡報。

---

## 📝 變更記錄 (Change Log)

- **v1.4.0 (2026-08-25)**
  - 🔍 **TSR 統計明細表全欄位「多條件過濾 (Filter)」與「雙向排序 (Sort)」功能上線**：
    - **全 12 欄雙向點擊排序 (Bidirectional Column Sorting)**：
      - 點擊任一欄位表頭（`Test #`、`Test Name`、`Limits`、`Mean`、`Median`、`StdDev`、`Fail Count`、`Loss %`、`CPKn`、`CPK Group`、`Distribution Shape`、`Skewness / Kurtosis`）即可進行升冪（▲）/ 降冪（▼）排序。
      - 數值欄位（`Fail Count`、`Loss %`、`CPKn`、`Mean` 等）自動按數值大小精準排序；字串與組別欄位按字典字母排序；表頭即時呈現高亮發光排序箭頭。
    - **多維度即時過濾工具列 (Multi-Criteria Filter Toolbar)**：
      - **全域即時搜尋 (Instant Search)**：輸入任意字元（如測試名稱、編號、規格限制、單位等）即時過濾。
      - **CPK Group 下拉選單過濾 (CPK Group Filter)**：自適應收錄 CSV 中所有自訂能力組別（如 `0.5<CPK <1.67`、`1.67 < CPK < 4`、`CPK < 0.5` 等）。
      - **Distribution Shape 下拉選單過濾 (Distribution Filter)**：快速篩選指定分佈形態（如 `Normal`、`Double`、`Skewed` 等）。
      - **一鍵快速預設過濾 (Quick Preset Badges)**：
        - `All`（全部顯示）
        - `Fails > 0`（僅看失效測試項）
        - `CPK < 1.67`（僅看低能力風險項）
      - **即時筆數動態徽章**：即時顯示匹配筆數（例如 `Showing 5 of 6 items`）。
      - **一鍵還原 (Reset Filters)**：點擊 `↺ Reset` 快速清除所有篩選條件與搜尋文字。
    - **單一獨立檔同步更新**：同步重新打包 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.12 (2026-08-25)**
  - 📜 **實裝方案三：卡片固定高度 + 獨立流暢滾動軸（Scrollable Matrix Containers）與長文字截斷保護**：
    - **CPK Capability Groups 矩陣滾動容器**：當自訂分組數量龐大（例如 10~30 組以上）時，下方矩陣明細表自動套用 `max-height: 150px; overflow-y: auto;` 與半導體深色風格纖細滾動條（Thin Scrollbar），保持卡片高度固定不破版。
    - **徽章長文字寬度保護（Pill Ellipsis Protection）**：`.status-pill` 徽章新增 `max-width: 220px; text-overflow: ellipsis;`，游標懸停時自動展開並支援原生 Tooltip 顯示 100% 完整備註字串。
    - **Distribution Shapes 長條圖動態高度與智慧滾動**：分佈形態過多時長條圖自動依項目數動態計算畫布高度（每長條 34px），搭配滾動容器讓每一組長條清晰展開。
    - **圓餅圖圖例智慧收斂**：當分組超過 5 組時自動將圖表焦點留給圓餅圖本體，由下方完整的滾動矩陣表提供詳細數據與點擊溯源。
    - **單一獨立檔同步更新**：同步重新打包 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.11 (2026-08-25)**
  - 🎨 **修復 Chart.js 圓餅圖/環形圖圖例在 Dark Mode 下字體顏色偏暗（修正為高對比純白色 `#ffffff`）**：
    - **自訂 `generateLabels` 注入 `fontColor: '#ffffff'`**：Chart.js 在自訂 `generateLabels` 回呼函式時若未顯式回傳 `fontColor`，會強制套用內部預設灰黑文字（`#666`）。已全面補上 `fontColor: t.textColor`（深色模式下為 `#ffffff` 純白），使圖例文字清晰耀眼。
    - **全域 `Chart.defaults.color` 同步**：主題切換時同步更新 Chart.js 全域預設文字顏色，確保所有圖表、工具提示、刻度文字一致維持高對比清晰度。
    - **單一獨立檔同步更新**：同步重新打包 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.10 (2026-08-25)**
  - 📈 **修復 Pareto 累計失效率曲線頂部被圖例與邊界切到（Clipping）的問題**：
    - **曲線頂部預留緩衝空間（Headroom Buffer）**：將 Pareto 圖表之右側 Y 軸百分比刻度上限調整為 `115%`（刻度標記僅顯示至 `100%`），並在圖表頂部新增 `20px` 邊距（Layout Padding），徹底杜絕 100% 累計點與連線被圖例或畫布頂端邊緣裁切的問題。
    - **左側 Y 軸柱體預留 15% 空間**：啟用 `grace: '15%'`，使最高失效柱體頂部與圖例保持舒適間距。
  - 🎨 **全面優化深色/淺色模式（Dark/Light Mode）字體亮度與對比度**：
    - **移除 `<body>` 上的硬編碼 Tailwind 背景類別**：使主題切換時背景與卡片色彩完全由 CSS 變數驅動，徹底避免深淺主題混淆。
    - **提升 Dark Mode 圖表與文字清晰度**：圖表文字與座標軸刻度提升為高對比純白 (`#ffffff`) 與亮白灰 (`#f1f5f9`)，並加粗重要指標字重（`font-weight: 700`）。
    - **增強 CPK Group 圓餅圖圖例與矩陣表格字體可讀性**：圖例字體放大至 `11px`、字重設為 `700`，矩陣文字提高對比並維持充足行高。
    - **單一獨立檔同步更新**：同步重新打包 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.9 (2026-08-25)**
  - 🛡️ **修復 `Cpkn_Group` 含有 `<` / `>` 字元被瀏覽器誤判為 HTML 標籤而截斷的問題**：
    - **全系統 HTML 實體跳脫（HTML Entity Escaping）**：徹底解決 CSV 中包含 `<`、`>` 符號的欄位內容（例如 `0.5<CPK <1.67`、`CPK < 0.5`、`Limits: [0.0, 1.0]`）在插入 DOM `innerHTML` 時被瀏覽器解析為 HTML 標籤 `<CPK...` 導致只顯示開頭數字 `0.5` 的問題。
    - **受影響範圍全面修復**：溯源抽屜標題、計算推導證明（Trace Proof Formula）、明細表格儲存格（Trace Table Cells）、TSR 統計明細表、Trace Explorer 搜尋表均 100% 完整保留原始組別字串。
    - **單一獨立檔同步更新**：同步重新打包 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.8 (2026-08-25)**
  - 🛡️ **全面提升系統容錯與解析穩定度（修復執行卡頓與中斷問題）**：
    - **UTF-8 BOM 自動濾除**：支援 Excel / JMP / ATE 輸出之 UTF-8 with BOM (`\uFEFF`) CSV 表頭，避免表頭欄位名稱比對失效。
    - **不區分大小寫自動識別**：檔案特徵偵測機制全面升級為大小寫無差別識別（Case-Insensitive Signature Matching）。
    - **搜尋與資料探勘防禦機制**：修復 `Trace Explorer` 與 `Traceability Inspector` 搜尋輸入框未初始化時可能的 `TypeError`。
    - **全圖表與矩陣點擊安全防護**：強化 Chart.js 點擊事件、CPK Capability Group 與 Distribution Shape 的邊界檢查與群組名稱正規化比對。
    - **16:9 PPTX 匯出優化**：Slide 4 TSR 參數 Pareto 表格自動限制為 Top 12 核心失效項，徹底杜絕多參數報表匯出時投影片邊界溢出與停止問題。
    - **單一獨立檔同步更新**：重新打包生成最新 [`semiconductor_dashboard_standalone.html`](file:///c:/Users/tu-hs/OneDrive/文件/2022_0308_MASA/2022-0708/Projects_antigravity/SANITY_CSV_PARSER/semiconductor_dashboard_standalone.html)。
- **v1.3.7 (2026-08-25)**
  - 🎨 **修復深色模式（Dark Mode）CPK Group 字體高對比可讀性**：
    - 全面增強 Dark Mode 下 `.status-pill` 徽章與矩陣表格之字體亮度、發光邊框與對比度，徹底解決深色背景下字體偏暗不易辨識的問題。
  - 📋 **TSR 統計明細表（Statistics Matrix）新增獨立欄位**：
    - 完整擴充為 12 欄半導體工程明細表：`Test #`、`Test Name`、`Limits`、`Mean`、`Median (P50)`、`StdDev`、`Fail Count`、**`Loss %`（獨立失效率欄位）**、**`CPKn`（獨立製程能力指數欄位）**、**`CPK Group`（能力分組徽章）**、**`Distribution Shape`（分佈形態徽章）**、`Skewness / Kurtosis`。
- **v1.3.6 (2026-08-25)**
  - 📊 **TSR Distribution Shape 全動態解析（100% 完整收錄 `Distribution` 欄位之所有形態內容）**：
    - 不受限於特定分類，系統全自動提取 CSV `Distribution` 欄位中出現的**所有不重複分佈形態**（如 `Normal`、`Double`、`Skewed`、`Bimodal`、`Uniform`、`Weibull` 等）。
    - 水平長條圖動態呈現所有分佈類別與參數計數，點擊長條即可即時數字溯源該形態的所有測試參數。
    - PPT 匯出 Slide 4 同步動態列出所有分佈形態統計。
- **v1.3.5 (2026-08-25)**
  - 🌐 **TSR CPK Group 全動態解析（100% 完整收錄 `Cpkn_Group` 欄位之所有自訂組別內容）**：
    - 不受限於特定組別，系統會動態擷取上傳 CSV `Cpkn_Group` 欄位中出現的**所有不重複組別內容**（如 `0.5<CPK <1.67`、`1.67 < CPK < 4`、`CPK<1.33`、`Target`、`Special` 等）。
    - 圓餅圖、矩陣明細表、Pareto 篩選器與 PPT 匯出均自適應根據 CSV 原生組別動態產生圖例與資料列。
- **v1.3.4 (2026-08-25)**
  - 🔄 **點擊 CPK Capability Group 連動左側 Pareto 圖表篩選**：
    - 點選 CPK Donut 切片或下方矩陣表任一組別（如 `Marginal`、`Critical`、`Capable`），左側 **Parameter Failure Pareto** 圖表立即動態切換並重新計算該組別之失效排行與累計損失 %。
    - 圖表頂部新增篩選標籤徽章（例如 `Marginal (5) ✕`），點擊即可一鍵清除篩選、還原全組別檢視。
  - 🔝 **Pareto 圖表新增「Top 10 / All」切換按鈕**：
    - 圖表右上角新增 **🔝 Top 10** 互動按鈕，可自由在「僅顯示前 10 大失效項」與「顯示所有測試參數」之間切換。
- **v1.3.3 (2026-08-25)**
  - 📐 **優化 TSR 關鍵指標（移除不具工程意義之平均 CPK 與計算良率）**：
    - 全面替換為半導體測試實務核心指標：
      1. **Worst CPK Bottleneck（製程瓶頸最低 CPK）**：標記全批次能力最差之弱項參數（如 `0.62 Clock_MHz`）。
      2. **CPK < 1.67 Risk Count（風險參數數與佔比）**：統計需 Guardband 或改善之臨界/超標項數（如 `5 items (83.3%)`）。
      3. **Rank #1 Loss Driver（主要失效損失來源）**：明確指出失效率最高之參數與顆數（如 `VCC_mA: 57 fails / 0.58%`）。
      4. **Total Failure Loss（總參數失效顆數與損失率）**：精準呈現累計 defect count 與失效率。
- **v1.3.2 (2026-08-25)**
  - 🎯 **TSR CPK 製程能力分組全組別完整呈現 (All 4 Groups Mandatory Display)**：
    - 確保 `Critical (CPK < 0.5)`、`Marginal (0.5 ≤ CPK < 1.67)`、`Capable (1.67 ≤ CPK < 4.0)`、`Over-spec (CPK ≥ 4.0)` 4 大組別無論數量是否為 0，皆 100% 完整呈現於圓餅圖圖例、統計摘要與 PPT 簡報中。
    - TSR 分頁新增「CPK Capability Groups 全組別矩陣明細表」，支援點擊任一組別即時溯源該組別的所有參數。
- **v1.3.1 (2026-08-25)**
  - ⚡ **DSA TOP A/B/C 支援 `:` 前置 Test Name 聚合統計**：
    - 自動提取測試名稱 `:` 前的前綴（例如 `LOIF:Freq_Offset` ➔ `LOIF`、`ATB_ADC:ADC_INL` ➔ `ATB_ADC`）。
    - 依據前綴彙整統計 Cat A / Cat B / Cat C 數量、Full Shift / Median Shift 影響度並排行。
    - 點擊前綴排行圖表時，數字溯源抽屜同步列出該模組前綴下的所有測試項目明細。
- **v1.3.0 (2026-08-25)**
  - ⭐ **推出 100% 單一獨立 HTML 檔案 (`semiconductor_dashboard_standalone.html`)**：完整內嵌 CSS 與 JS 模組，免下載資料夾即可直接開啟與郵件傳送。
  - 🤖 **新增 `bundle_standalone.py`**：提供一鍵自動打包單一獨立 HTML 腳本。
  - 🏷️ **更新自訂標題署名**：`DATA ANALYSIS EXECUTIVE DASHBOARD • ATE VALIDATION PLATFORM @ Masa Tu`。
- **v1.2.0 (2026-08-25)**
  - 📈 **新增 TSR Test Summary 報告模組**：
    - 實作 Parameter Failure Pareto 雙軸圖表（Fail Count ＋ Cumulative Loss %）。
    - 實作 CPK Capability Group 製程能力分組圖表（Critical / Marginal / Capable / Over-spec）。
    - 實作 Distribution 分佈形態分類圖表（Normal / Double / Skewed）與偏度/峰度統計。
    - 新增第 4 張 PowerPoint 16:9 高階主管簡報頁（TSR Analysis Slide）。
    - 支援 TSR CSV 自動辨識、內嵌範例資料與 Traceability 數字溯源。
- **v1.1.0 (2026-08-25)**
  - 🔍 **新增「CSV 判斷機制」專章說明**：詳細載明檔名比對與內容特徵結構兜底識別流程。
  - ☀️ **新增 Light Mode / Dark Mode 雙主題開關**：完整支援淺色明亮風格，圖表格線與文字自適應切換，並儲存偏好。
  - 📏 **全面校準 PPT 16:9 邊界與尺寸**：修正投影片元件與表格的高度與行高，徹底解決匯出 PPT 超出投影片範圍的問題。
  - 🎨 **PPT 支援淺色/深色雙主題匯出**：生成與目前畫面主題一致的 PowerPoint 簡報。
- **v1.0.0 (2026-08-25)**
  - ✨ 建置 Power BI 風格 Executive Semiconductor Dashboard。
  - 🔄 實作多區塊與自動識別 CSV 解析引擎 (`parser.js`)。
  - 📐 實作 Item Sanity Check、DSA Shift Analysis、Bin & Yield 統計計算核心 (`analytics.js`)。
  - 🔬 實作全圖表與 KPI 數字溯源抽屜 (`traceability.js`)。
  - 📊 實作符合 `DSA.txt` 與 `sanity_ITEM COMPARSION.txt` 規範的 PowerPoint (.pptx) 與 PDF 匯出模組 (`export.js`)。
  - 📖 提供完整 Help 說明分頁與專案說明文件 (`README.md`)。
