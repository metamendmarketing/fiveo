/**
 * FiveO Product Finder - Fitment Scraper (Console Edition) v3
 * ------------------------------------------------------------
 * The endpoint returns JSON arrays, not HTML.
 * Each item: {"value":"4","label":"CL","path":"1/2/3/4","selected":false}
 *
 * Discovery from DOM: 4 dropdowns at levels 2–5:
 *   finder-2-2 (level 2) = Make
 *   finder-2-3 (level 3) = Model
 *   finder-2-4 (level 4) = Year
 *   finder-2-5 (level 5) = Engine
 *
 * To get the first dropdown (Makes), we need the *parent* path.
 * We must discover it by probing level < 2.
 *
 * HOW TO RUN:
 * 1. Open https://www.fiveomotorsport.com/ in Chrome (past Cloudflare).
 * 2. Press F12 -> Console.
 * 3. Paste this whole script and press Enter.
 * 4. Wait — a JSON file will auto-download when done.
 */

(async () => {
    const BANNER = "color: #ff9900; font-weight: bold; font-size: 1.2em;";
    const INFO   = "color: #00ccff;";
    const OK     = "color: #00ff00;";
    const WARN   = "color: #ffcc00;";
    const ERR    = "color: #ff3333;";
    const DIM    = "color: #888;";

    console.log("%c╔══════════════════════════════════════════╗", BANNER);
    console.log("%c║  FiveO Fitment Scraper v3 — Starting...  ║", BANNER);
    console.log("%c╚══════════════════════════════════════════╝", BANNER);

    const BASE_URL = window.location.origin;
    const ENDPOINT = "/pfcategory/index/options/";
    const DELAY    = 400;   // ms between requests
    const MAX_DEPTH = 6;    // safety limit

    let totalRequests = 0;
    let totalOptions  = 0;
    let errorCount    = 0;

    // ── Helpers ──────────────────────────────────────────────

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseResponse(text) {
        // The endpoint returns JSON: [{"value":"4","label":"CL","path":"1/2/3/4","selected":false}, ...]
        if (!text || text.trim().length === 0) return [];
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                return data
                    .filter(item => item && item.label && item.value !== undefined)
                    .map(item => ({
                        value: String(item.value),
                        label: String(item.label).trim(),
                        path:  item.path || null
                    }));
            }
            // If it's an object wrapping an array, try common keys
            for (const key of ['items', 'options', 'data', 'results']) {
                if (Array.isArray(data[key])) {
                    return data[key].filter(item => item && item.label).map(item => ({
                        value: String(item.value),
                        label: String(item.label).trim(),
                        path:  item.path || null
                    }));
                }
            }
            return [];
        } catch (e) {
            // Maybe it's HTML after all? Try fallback
            if (text.includes('<option')) {
                const div = document.createElement('div');
                div.innerHTML = text;
                return Array.from(div.querySelectorAll('option'))
                    .map(opt => ({
                        value: (opt.getAttribute('value') || '').trim(),
                        label: opt.textContent.trim(),
                        path: null
                    }))
                    .filter(o => o.label && o.value && !o.label.toLowerCase().includes('choose'));
            }
            return [];
        }
    }

    async function fetchLevel(path, level) {
        const url = `${BASE_URL}${ENDPOINT}?level=${level}&path=${encodeURIComponent(path)}&use_saved_values=false&_=${Date.now()}`;
        try {
            const res = await fetch(url, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json, text/javascript, */*; q=0.01"
                },
                credentials: "include"
            });
            totalRequests++;
            const text = await res.text();
            const options = parseResponse(text);
            return { status: res.status, rawLength: text.length, options, raw: text };
        } catch (e) {
            errorCount++;
            return { status: -1, rawLength: 0, options: [], error: e.message, raw: '' };
        }
    }

    // ── PHASE 1: Discover the root (Makes) ──────────────────

    console.log("%c── Phase 1: Finding the Makes dropdown ──", INFO);

    // From the diagnostic: path="1/2/3" level=3 returned Acura models.
    // That means "1/2/3" is a single Make (Acura) and level=3 lists its Models.
    // So the Makes list should be at the PARENT: path="1/2" at level=2.

    const probes = [
        { path: "1/2", level: 2, desc: "Makes (parent of known Model path)" },
        { path: "1",   level: 1, desc: "Top category" },
        { path: "1/2", level: 1, desc: "Alt top category" },
    ];

    let makesResult = null;
    let ROOT_PATH = null;
    let ROOT_LEVEL = null;

    for (const p of probes) {
        await sleep(300);
        const result = await fetchLevel(p.path, p.level);
        const tag = result.options.length > 0 ? '✅' : '❌';
        console.log(
            `%c  ${tag} ${p.desc}: path="${p.path}" level=${p.level} → ${result.options.length} options` +
            (result.options.length > 0 ? ` [${result.options.slice(0,3).map(o=>o.label).join(', ')}...]` : '') +
            (result.error ? ` ERROR: ${result.error}` : ''),
            result.options.length > 0 ? OK : DIM
        );
        if (!makesResult && result.options.length > 0) {
            makesResult = result;
            ROOT_PATH = p.path;
            ROOT_LEVEL = p.level;
        }
    }

    if (!makesResult) {
        console.log("%c  ⚠ Standard probes failed. Trying wider brute force...", WARN);
        // Extended search
        for (let lvl = 0; lvl <= 5; lvl++) {
            for (const path of ["1", "2", "3", "1/2", "1/3", "2/3", "1/2/3", "1/2/3/4"]) {
                await sleep(200);
                const r = await fetchLevel(path, lvl);
                if (r.options.length > 0) {
                    console.log(`%c  ✅ FOUND: path="${path}" level=${lvl} → ${r.options.length} items [${r.options[0].label}...]`, OK);
                    makesResult = r;
                    ROOT_PATH = path;
                    ROOT_LEVEL = lvl;
                    break;
                }
            }
            if (makesResult) break;
        }
    }

    if (!makesResult) {
        console.log("%c  ❌ FAILED: Could not find any working path/level combo.", ERR);
        console.log("%c  Try running the diagnostic fetch manually:", WARN);
        console.log(`fetch("${BASE_URL}${ENDPOINT}?level=2&path=1%2F2&use_saved_values=false",{headers:{"X-Requested-With":"XMLHttpRequest"},credentials:"include"}).then(r=>r.text()).then(console.log)`);
        return;
    }

    console.log(`%c  ✓ Root found: path="${ROOT_PATH}" level=${ROOT_LEVEL} (${makesResult.options.length} items)`, OK);

    // ── PHASE 2: Full recursive crawl ───────────────────────

    console.log("%c── Phase 2: Full recursive crawl ──", INFO);

    // Depth labels based on what we know:
    // If root level=2 → depth 0=Make, 1=Model, 2=Year, 3=Engine
    // If root level=1 → depth 0=Category, 1=Make, 2=Model, etc.
    const depthLabels = ROOT_LEVEL === 2
        ? ['Make', 'Model', 'Year', 'Engine', 'Sub-Engine', 'Detail']
        : ROOT_LEVEL === 1
            ? ['Category', 'Make', 'Model', 'Year', 'Engine', 'Detail']
            : ['Level-0', 'Level-1', 'Level-2', 'Level-3', 'Level-4', 'Level-5'];

    async function crawl(path, level, depth, parentLabel) {
        const result = await fetchLevel(path, level);

        const node = {
            path,
            level,
            depth,
            option_count: result.options.length,
            children: []
        };

        if (result.error) {
            node.error = result.error;
            return node;
        }

        if (result.status !== 200) {
            node.error = `HTTP ${result.status}`;
            return node;
        }

        if (depth >= MAX_DEPTH || result.options.length === 0) {
            return node;  // Leaf node
        }

        totalOptions += result.options.length;
        const label = depthLabels[depth] || `Depth-${depth}`;
        console.log(
            `%c${'  '.repeat(depth)}📂 ${label}: ${result.options.length} options` +
            (parentLabel ? ` under "${parentLabel}"` : ' (root)'),
            OK
        );

        for (let i = 0; i < result.options.length; i++) {
            const opt = result.options[i];
            await sleep(DELAY);

            // Progress logging (every 10 items at depth 0–1, every 25 deeper)
            const logInterval = depth <= 1 ? 10 : 25;
            if (i > 0 && i % logInterval === 0) {
                console.log(
                    `%c${'  '.repeat(depth+1)}⏳ ${i}/${result.options.length} ` +
                    `(requests: ${totalRequests}, errors: ${errorCount})`,
                    DIM
                );
            }

            // Use the path from the JSON response if available, otherwise construct it
            const nextPath = opt.path || `${path}/${opt.value}`;
            const subtree = await crawl(nextPath, level + 1, depth + 1, opt.label);

            node.children.push({
                label: opt.label,
                value: opt.value,
                subtree
            });
        }

        return node;
    }

    const startTime = Date.now();

    const results = {
        meta: {
            source: window.location.href,
            extracted_at: new Date().toISOString(),
            root_path: ROOT_PATH,
            root_level: ROOT_LEVEL,
            depth_labels: depthLabels.slice(0, 4),
            version: 3
        },
        tree: null
    };

    results.tree = await crawl(ROOT_PATH, ROOT_LEVEL, 0, null);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // ── Output ──────────────────────────────────────────────

    console.log("%c╔══════════════════════════════════════════╗", BANNER);
    console.log("%c║       Extraction Complete!               ║", BANNER);
    console.log("%c╚══════════════════════════════════════════╝", BANNER);
    console.log(`%c  Time elapsed:  ${elapsed}s`, INFO);
    console.log(`%c  Total requests: ${totalRequests}`, INFO);
    console.log(`%c  Total options:  ${totalOptions}`, INFO);
    console.log(`%c  Errors:         ${errorCount}`, errorCount > 0 ? WARN : INFO);
    console.log(`%c  Top-level (Makes): ${results.tree.children.length}`, INFO);

    const finalData = JSON.stringify(results, null, 2);
    const sizeKB = (new Blob([finalData]).size / 1024).toFixed(1);
    console.log(`%c  JSON size: ${sizeKB} KB`, INFO);

    // Auto-download
    try {
        const blob = new Blob([finalData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fiveo_fitment_extract.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("%c📥 JSON file downloaded!", OK);
    } catch (e) {
        console.log("%c⚠ Auto-download failed — copy JSON from console below", WARN);
    }

    // Summary table of top-level Makes
    if (results.tree.children.length > 0) {
        console.log("%cMakes summary:", INFO);
        console.table(
            results.tree.children.map(c => ({
                Make: c.label,
                Models: c.subtree?.option_count || 0,
                'Has Children': (c.subtree?.children?.length || 0) > 0 ? '✅' : '❌'
            }))
        );
    }

    // Log full JSON
    console.log(finalData);
})();
