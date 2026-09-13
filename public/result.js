// ================================================================
// NAWI — Result Page Script
// Fetches report from DB and renders all test results + overall
// ================================================================

window.onload = function () {
    const reportId = new URLSearchParams(window.location.search).get('id');

    if (!reportId) {
        document.getElementById("report-content").innerHTML =
            "<h2 style='color:red; text-align:center;'>Error: No report ID in URL!</h2>";
        return;
    }

    fetch(`/api/report/${reportId}`)
        .then(r => r.json())
        .then(data => renderReport(data))
        .catch(err => {
            console.error("Fetch error:", err);
            document.getElementById("report-content").innerHTML =
                "<h2 style='text-align:center;'>Error loading report from database!</h2>";
        });
};

// ────────────────────────────────────────────────────────────────
// RENDER REPORT
// ────────────────────────────────────────────────────────────────
function renderReport(data) {
    const inst   = data.instrument_data   || {};
    const plan   = data.test_plan         || [];
    const f0     = data.form0_data        || {};
    const f0r    = data.form0_results     || {};
    const f1r    = data.form1_results     || {};
    const f2     = data.form2_data        || {};
    const f2r    = data.form2_results     || {};
    const f3r    = data.form3_results     || {};
    const fZr    = data.form_zero_results || {};
    const fTar   = data.form_tare_results || {};
    const fTilr  = data.form_tilt_results || {};

    // ── Instrument & Environment ─────────────────────────────
    const envKeys = ['temperature', 'humidity', 'voltage'];
    let iHTML = "<h4>Instrument Details</h4>", eHTML = "<h4>Environmental Conditions</h4>";
    for (let k in inst) {
        const lbl = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g,' ');
        (envKeys.includes(k) ? (eHTML += `<p><b>${lbl}:</b> ${inst[k]}</p>`)
                             : (iHTML += `<p><b>${lbl}:</b> ${inst[k]}</p>`));
    }
    document.getElementById("instrument-details").innerHTML = iHTML;
    document.getElementById("env-details").innerHTML        = eHTML;

    // ── Determine which tests were run ───────────────────────
    const ranTests = plan.filter ? plan.filter(t => t.status === "REQUIRED") : [];

    // ── Build test result sections ────────────────────────────
    let sectionsHTML = "";
    let overallComponents = [];   // { name, pass: bool }

    // Helper: section wrapper
    const section = (title, tableHTML) => `
    <div class="cert-table-wrapper full-width" style="margin-bottom:18px;">
        <h4>${title}</h4>
        <table border="1" style="width:100%; text-align:left;">${tableHTML}</table>
    </div>`;

    const passCell = (status, bold=true) => {
        const c = status === "PASS" ? "green" : status === "FAIL" ? "red" : "#888";
        return `<td style="color:${c}; font-weight:${bold?'bold':'normal'};">${status||'—'}</td>`;
    };

    // ── Test 1: Visual Inspection ────────────────────────────
    if (ranTests.some(t=>t.id===1) || Object.keys(f0).length > 0) {
        const labels = {
            marking:"Markings complete & legible", construction:"Construction satisfactory",
            display:"Display / indication functional", keyboard:"Switches & keys complete",
            sealing:"Sealing provisions intact", levelling:"Instrument stable & levelled"
        };
        let rows = "";
        for (let k in labels) {
            const checked = f0[k] !== undefined;
            rows += `<tr><td>${labels[k]}</td>
                ${passCell(checked ? "PASS" : "—")}</tr>`;
        }
        if (!rows) rows = `<tr><td colspan="2" style="color:#aaa;">No data</td></tr>`;
        sectionsHTML += section(`<i class="fas fa-eye"></i> 1. Visual Inspection`,
            `<thead><tr><th>Inspection Item</th><th>Result</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Visual Inspection", pass: true }); // visual is checklist, always pass if done
    }

    // ── Test 2: Weighing Performance ─────────────────────────
    if (Object.keys(f1r).length > 0) {
        let rows = "";
        for (let key in f1r) {
            const d   = f1r[key];
            const kg  = Number(key) >= 1000 ? (Number(key)/1000).toFixed(0)+"kg" : (Number(key)/1000).toFixed(3)+"kg";
            rows += `<tr>
                <td>${kg}</td>
                <td>${d.asc_reading} kg</td>
                <td>${d.desc_reading} kg</td>
                <td>${(d.asc_error*1000).toFixed(1)} g</td>
                <td>${(d.desc_error*1000).toFixed(1)} g</td>
                <td>±${(d.limit*1000).toFixed(1)} g</td>
                ${passCell(d.result)}
            </tr>`;
        }
        const allPass = Object.values(f1r).every(r => r.result === "PASS");
        rows += `<tr style="background:#f5f5f5;">
            <td colspan="6"><b>Weighing Performance Overall</b></td>
            ${passCell(allPass?"PASS":"FAIL")}
        </tr>`;
        sectionsHTML += section(`<i class="fas fa-weight"></i> 2. Weighing Performance Test`,
            `<thead><tr><th>Load</th><th>Ind.↑</th><th>Ind.↓</th><th>Err↑</th><th>Err↓</th><th>MPE Limit</th><th>Result</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Weighing", pass: allPass });
    }

    // ── Test 3: Repeatability ─────────────────────────────────
    if (Object.keys(f2r).length > 0) {
        let rows = `<tr><td colspan="2"><b>Test Load:</b> ${f2r.testLoad||'—'} kg</td></tr>`;
        for (let k in f2) {
            rows += `<tr><td>Reading ${k.replace('Value_','')}</td><td>${f2[k]} kg</td></tr>`;
        }
        rows += `
        <tr><td><b>Maximum</b></td><td>${f2r.max||'—'} kg</td></tr>
        <tr><td><b>Minimum</b></td><td>${f2r.min||'—'} kg</td></tr>
        <tr><td><b>Range (Max−Min)</b></td><td>${f2r.range||'—'} kg = ${((f2r.range||0)*1000).toFixed(1)} g</td></tr>
        <tr><td><b>MPE Limit</b></td><td>±${f2r.limit||'—'} kg = ±${((f2r.limit||0)*1000).toFixed(1)} g</td></tr>
        <tr style="background:#f5f5f5;"><td><b>Repeatability Result</b></td>${passCell(f2r.Repeatability)}</tr>`;
        sectionsHTML += section(`<i class="fas fa-sync-alt"></i> 3. Repeatability Test`,
            `<thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Repeatability", pass: f2r.Repeatability === "PASS" });
    }

    // ── Test 4: Eccentricity ──────────────────────────────────
    if (f3r.details) {
        const posLabels = { front:"① Front", right:"② Right", rear:"③ Rear", left:"④ Left", center:"⑤ Center" };
        let rows = "";
        for (let pos in f3r.details) {
            const d   = f3r.details[pos];
            const lbl = posLabels[pos] || pos;
            rows += `<tr>
                <td>${lbl}</td>
                <td>${d.appliedLoad} kg</td>
                <td>${d.indication} kg</td>
                <td>${(d.error*1000).toFixed(1)} g</td>
                <td>±${(d.limit*1000).toFixed(1)} g</td>
                ${passCell(d.result)}
            </tr>`;
        }
        rows += `<tr style="background:#f5f5f5;">
            <td colspan="5"><b>Eccentricity Overall</b></td>
            ${passCell(f3r.Eccentricity)}
        </tr>`;
        sectionsHTML += section(`<i class="fas fa-crosshairs"></i> 4. Eccentricity Test`,
            `<thead><tr><th>Position</th><th>Applied</th><th>Indication</th><th>Error</th><th>MPE</th><th>Result</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Eccentricity", pass: f3r.Eccentricity === "PASS" });
    }

    // ── Test 5: Zero-Setting ──────────────────────────────────
    if (fZr.ZeroSetting) {
        const rows = `
        <tr><td>Zero indication reading</td><td>${fZr.zero_indication||'—'} kg</td></tr>
        <tr><td>Error</td><td>${(fZr.error_g||0).toFixed(1)} g</td></tr>
        <tr><td>Limit (±0.5e)</td><td>±${(fZr.limit_g||0)} g</td></tr>
        <tr style="background:#f5f5f5;"><td><b>Zero-Setting Result</b></td>${passCell(fZr.ZeroSetting)}</tr>`;
        sectionsHTML += section(`<i class="fas fa-bullseye"></i> 5. Zero-Setting / Tracking Test`,
            `<thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Zero-Setting", pass: fZr.ZeroSetting === "PASS" });
    }

    // ── Test 6: Tare Accuracy ─────────────────────────────────
    if (fTar.TareAccuracy) {
        const rows = `
        <tr><td>Tare load</td><td>${fTar.tare_load||'—'} kg</td></tr>
        <tr><td>Net indication after tare</td><td>${data.form_tare_data?.net_indication||'—'} kg</td></tr>
        <tr><td>Tare error</td><td>${(fTar.tare_error_g||0).toFixed(1)} g</td></tr>
        <tr><td>MPE limit</td><td>±${(fTar.limit_g||0)} g</td></tr>
        <tr style="background:#f5f5f5;"><td><b>Tare Accuracy Result</b></td>${passCell(fTar.TareAccuracy)}</tr>`;
        sectionsHTML += section(`<i class="fas fa-balance-scale"></i> 6. Tare Accuracy Test`,
            `<thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Tare Accuracy", pass: fTar.TareAccuracy === "PASS" });
    }

    // ── Test 8: Tilt ──────────────────────────────────────────
    if (fTilr.TiltTest) {
        const rows = `
        <tr><td>Reference reading</td><td>${fTilr.tilt_ref||'—'} kg</td></tr>
        <tr><td>X-tilt reading</td><td>${data.form_tilt_data?.tilt_x||'—'} kg</td></tr>
        <tr><td>Y-tilt reading</td><td>${data.form_tilt_data?.tilt_y||'—'} kg</td></tr>
        <tr><td>Max deviation</td><td>${Math.max(fTilr.x_error_g||0, fTilr.y_error_g||0).toFixed(1)} g</td></tr>
        <tr><td>Limit (1e)</td><td>${fTilr.limit_g||'—'} g</td></tr>
        <tr style="background:#f5f5f5;"><td><b>Tilt Test Result</b></td>${passCell(fTilr.TiltTest)}</tr>`;
        sectionsHTML += section(`<i class="fas fa-arrows-alt"></i> 8. Tilt Test`,
            `<thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>${rows}</tbody>`);
        overallComponents.push({ name: "Tilt Test", pass: fTilr.TiltTest === "PASS" });
    }

    // Inject all test sections
    document.getElementById("cert-tables-body").innerHTML = sectionsHTML;

    // ── Overall Result ────────────────────────────────────────
    const overallPass = overallComponents.length > 0 &&
                        overallComponents.every(c => c.pass);
    const overallText = overallComponents.length > 0 ? (overallPass ? "PASS" : "FAIL") : "INCOMPLETE";

    // Banner
    const banner = document.getElementById("overall-result-container");
    if (banner) {
        banner.innerHTML = `
        <div class="overall-result-banner ${overallPass ? 'pass' : 'fail'}">
            <div class="overall-icon">${overallPass ? '✅' : '❌'}</div>
            <div class="overall-text">
                <h3>Overall Verification Result: ${overallText}</h3>
                <p>${overallPass
                    ? "All executed tests passed. Instrument conforms to OIML R-76 requirements."
                    : "One or more tests failed. Instrument does not conform to OIML R-76."}</p>
            </div>
        </div>`;
    }

    // Test-wise cards
    const grid = document.getElementById("test-summary-grid");
    if (grid) {
        grid.innerHTML = overallComponents.map(c => `
        <div class="test-result-card ${c.pass ? 'pass' : 'fail'}">
            <div class="card-result">${c.pass ? '✅' : '❌'} ${c.name}</div>
        </div>`).join('') + `
        <div class="test-result-card ${overallPass ? 'pass' : 'fail'}">
            <i class="fas fa-clipboard-check"></i>
            <div><strong>OVERALL</strong></div>
            <div class="card-result">${overallPass ? '✅' : '❌'} ${overallText}</div>
        </div>`;
    }
}

// ────────────────────────────────────────────────────────────────
// PDF / PRINT
// ────────────────────────────────────────────────────────────────
function downloadPDF() { window.print(); }
