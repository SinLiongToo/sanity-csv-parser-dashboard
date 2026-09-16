#!/usr/bin/env python3
"""
Bundle Semiconductor Sanity Dashboard into a 100% Single Standalone HTML file.
Inlines all CSS and local JS modules so that users only need this one file.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def update_default_data_js():
    """Scan directory for TSR*.csv and other compare files, updating js/default_data.js"""
    import json
    import glob

    repeat_files = glob.glob(os.path.join(BASE_DIR, '*repeatability*.csv')) or glob.glob(os.path.join(BASE_DIR, '*repeat*.csv'))
    tsr_files = glob.glob(os.path.join(BASE_DIR, '*TSR*.csv'))
    bin_files = glob.glob(os.path.join(BASE_DIR, '*bincompare*.csv'))
    dsa_files = glob.glob(os.path.join(BASE_DIR, '*dsacompare*.csv')) or glob.glob(os.path.join(BASE_DIR, 'DSA.txt'))
    item_files = glob.glob(os.path.join(BASE_DIR, '*itemcompare*.csv')) or glob.glob(os.path.join(BASE_DIR, '*ITEM COMPARSION*.txt'))

    datasets = {}

    if repeat_files:
        p = repeat_files[0]
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            datasets['repeatability'] = {
                'filename': os.path.basename(p),
                'csvText': f.read()
            }

    if bin_files:
        p = bin_files[0]
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            datasets['bincompare'] = {
                'filename': os.path.basename(p),
                'csvText': f.read()
            }

    if dsa_files:
        p = dsa_files[0]
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            datasets['dsacompare'] = {
                'filename': os.path.basename(p),
                'csvText': f.read()
            }

    if item_files:
        p = item_files[0]
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            datasets['itemcompare'] = {
                'filename': os.path.basename(p),
                'csvText': f.read()
            }

    if tsr_files:
        p = tsr_files[0]
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            datasets['tsr'] = {
                'filename': os.path.basename(p),
                'csvText': f.read()
            }

    if datasets:
        default_data_path = os.path.join(BASE_DIR, 'js', 'default_data.js')
        js_code = f"/**\n * Semiconductor Sanity CSV Parser - Default Sample Datasets\n * Embedded raw CSVs to allow instant out-of-the-box loading even on local file:// protocol\n */\n\nwindow.DEFAULT_DATASETS = {json.dumps(datasets, indent=2)};\n"
        with open(default_data_path, 'w', encoding='utf-8') as f:
            f.write(js_code)
        print(f"[SYNC] Updated js/default_data.js with {len(datasets)} local datasets (including {os.path.basename(tsr_files[0]) if tsr_files else 'None'})")

import subprocess

def validate_js_syntax():
    """Verify JS syntax using Node.js before bundling to guarantee 0 syntax errors."""
    js_dir = os.path.join(BASE_DIR, 'js')
    js_files = ['default_data.js', 'parser.js', 'analytics.js', 'traceability.js', 'charts.js', 'export.js', 'app.js']
    paths = [os.path.join(js_dir, f) for f in js_files if os.path.exists(os.path.join(js_dir, f))]
    try:
        subprocess.run(['node', '-c'] + paths, capture_output=True, text=True, check=True)
        print(f"[VALIDATE] Verified {len(paths)} JavaScript modules: Syntax OK.")
    except subprocess.CalledProcessError as e:
        print(f"[FATAL ERROR] JavaScript syntax validation failed!\n{e.stderr or e.stdout}")
        raise SystemExit(1)
    except FileNotFoundError:
        print("[WARN] Node.js not found for pre-build syntax check. Skipping.")

def run_runtime_simulation():
    """Execute end-to-end headless simulation test to verify 0 runtime exceptions on load, tab switches, and filters."""
    sim_script = """
const mockEl = (id) => ({
  id,
  classList: { add(){}, remove(){}, contains(){ return false; } },
  textContent: '',
  innerHTML: '',
  style: {},
  querySelectorAll: () => [],
  querySelector: () => null,
  closest: () => ({ classList: { add(){}, remove(){} }, style: {}, onclick: null }),
  appendChild: () => {},
  addEventListener: () => {},
  getContext: () => ({ fillRect(){}, clearRect(){} })
});
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  body: { classList: { add(){}, remove(){}, contains(){ return false; } }, appendChild: () => {} },
  getElementById: (id) => mockEl(id),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  createElement: (tag) => mockEl(tag)
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.Chart = function(ctx, config) { this.ctx = ctx; this.config = config; this.destroy = () => {}; };
global.Chart.defaults = {};

require('./js/default_data.js');
require('./js/parser.js');
require('./js/analytics.js');
require('./js/traceability.js');
require('./js/charts.js');
require('./js/export.js');
require('./js/app.js');

window.app.init();
['overview', 'item', 'dsa', 'bin', 'tsr', 'repeatability', 'explorer'].forEach(tab => window.app.switchTab(tab));
window.app.setTestIgnoreInput('not pux, not dummy');
['ALL', 'HIGH_CV', 'LOW_CP', 'DRIFT_ONLY'].forEach(preset => window.app.setRepeatabilityPreset(preset));
window.app.updateHeaderMeta();
"""
    try:
        res = subprocess.run(['node', '-e', sim_script], cwd=BASE_DIR, capture_output=True, text=True, check=True)
        print("[SIMULATE] End-to-end runtime simulation passed: 0 exceptions.")
    except subprocess.CalledProcessError as e:
        print(f"[FATAL ERROR] Runtime simulation test failed!\n{e.stderr or e.stdout}")
        raise SystemExit(1)
    except FileNotFoundError:
        print("[WARN] Node.js not found for runtime simulation test. Skipping.")

def build_standalone():
    validate_js_syntax()
    run_runtime_simulation()
    update_default_data_js()
    index_path = os.path.join(BASE_DIR, 'index.html')
    css_path = os.path.join(BASE_DIR, 'css', 'dashboard.css')
    
    js_files = [
        'default_data.js',
        'parser.js',
        'analytics.js',
        'traceability.js',
        'charts.js',
        'export.js',
        'app.js'
    ]

    with open(index_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Read CSS
    with open(css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()

    # Replace CSS link with inline <style>
    target_css_link = '<link rel="stylesheet" href="css/dashboard.css">'
    inline_style = f"<style>\n/* --- INLINED css/dashboard.css --- */\n{css_content}\n</style>"
    html_content = html_content.replace(target_css_link, inline_style)

    # Read and concatenate JS
    inlined_js = []
    for js_name in js_files:
        js_p = os.path.join(BASE_DIR, 'js', js_name)
        with open(js_p, 'r', encoding='utf-8') as f:
            js_src = f.read()
        inlined_js.append(f"/* =========================================================================\n * INLINED js/{js_name}\n * ========================================================================= */\n{js_src}")

    all_inlined_js = "\n\n".join(inlined_js)
    inline_script_tag = f"<script>\n{all_inlined_js}\n</script>"

    # Target JS script tags block
    # Find start of <!-- JAVASCRIPT MODULES --> and end before </body>
    start_tag = '<!-- JAVASCRIPT MODULES -->'
    end_tag = '</body>'
    start_idx = html_content.find(start_tag)
    end_idx = html_content.find(end_tag, start_idx)

    if start_idx != -1 and end_idx != -1:
        html_content = (
            html_content[:start_idx] +
            f"<!-- INLINED STANDALONE JAVASCRIPT BUNDLE -->\n  {inline_script_tag}\n" +
            html_content[end_idx:]
        )

    output_path = os.path.join(BASE_DIR, 'semiconductor_dashboard_standalone.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"[SUCCESS] Generated standalone HTML: {output_path} ({len(html_content):,} bytes)")

if __name__ == '__main__':
    build_standalone()
