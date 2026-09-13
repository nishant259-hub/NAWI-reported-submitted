// ================================================================
// NAWI — Frontend Script (Test Plan–Driven Execution)
// Depends on: r76engine.js (loaded before this file)
// ================================================================

// ────────────────────────────────────────────────────────────────
// SECTION 1 — new-test PAGE: Save Instrument Data
// ────────────────────────────────────────────────────────────────

async function proceed() {
    const form = document.getElementById("initial-form");
    if (!form || !form.reportValidity()) return;

    const fd   = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    const maxKg = Number(data.capacity);
    const eG    = Number(data.e_value);
    if (!maxKg || !eG) {
        alert("Please fill in Max Capacity and Verification Interval (e).");
        return;
    }

    const minG = Number(data.min_capacity_g) > 0 ? Number(data.min_capacity_g) : (20 * eG);

    // Read photo as base64 if provided
    let photoBase64 = "";
    const photoInput = document.getElementById("instrument_photo");
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        photoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    // Capture Lab Details
    const labDetails = {
        name: data.lab_name,
        location: data.lab_location,
        temperature: data.temperature,
        humidity: data.humidity,
        voltage: data.voltage
    };

    localStorage.setItem("InstrumentData",    JSON.stringify(data));
    localStorage.setItem("LabDetails",        JSON.stringify(labDetails));
    localStorage.setItem("InstrumentPhoto",   photoBase64);
    localStorage.setItem("RuleSetVersion",    data.rule_set_version || "OIML R-76 V1");
    localStorage.setItem("RuleSetRules",      JSON.stringify(window.ACTIVE_OIML_RULES || {}));
    
    localStorage.setItem("Capacity",          maxKg);
    localStorage.setItem("eValue",            eG);
    localStorage.setItem("ClassValue",        data.Class_value);
    localStorage.setItem("minCapacity",       minG);
    
    let isMobile = false;
    let hasMultiPosition = true;
    
    if (data.instrument_type === "crane") {
        hasMultiPosition = false;
    } else if (data.instrument_type === "mobile") {
        isMobile = true;
    }

    localStorage.setItem("isMobile",          isMobile ? "true" : "false");
    localStorage.setItem("hasTare",           "true");
    localStorage.setItem("hasMultiPosition",  hasMultiPosition ? "true" : "false");
    localStorage.setItem("instrumentType",    data.instrument_type);

    // Clear any previous test session data
    ["confirmedTestPlan","testPlan","testPoints_g",
     "form0","form0_results","form1","form1_results",
     "form2","form2_results","form3","form3_results",
     "form_zero","form_zero_results","form_tare","form_tare_results",
     "form_tilt","form_tilt_results"
    ].forEach(k => localStorage.removeItem(k));

    window.location.href = '/test-plan';
}

// ────────────────────────────────────────────────────────────────
// SECTION 2 — READ GLOBALS (used on tests page)
// ────────────────────────────────────────────────────────────────

const _maxKg = Number(localStorage.getItem("Capacity"));
const _eG    = Number(localStorage.getItem("eValue"));
const _cls   = localStorage.getItem("ClassValue") || "class III";
const _minG  = Number(localStorage.getItem("minCapacity")) || (20 * _eG);

// ────────────────────────────────────────────────────────────────
// SECTION 3 — TESTS PAGE BOOTSTRAP
// ────────────────────────────────────────────────────────────────

const _container = document.getElementById("test-container");
const _progWrap  = document.getElementById("progress-wrapper");

if (_container) {
    // Read confirmed plan (from test-plan page) or fall back to testPlan
    const _rawPlan = localStorage.getItem("confirmedTestPlan")
                  || localStorage.getItem("testPlan")
                  || "[]";
    const _fullPlan  = JSON.parse(_rawPlan);
    const _testsToRun = _fullPlan.filter(t => t.status === "REQUIRED");

    let _currentIdx = 0;
    let _completedCount = 0;
    let _passedCount = 0;
    let _failedCount = 0;

    const _resultKeys = {
        1: "form0_results", 2: "form1_results", 3: "form2_results",
        4: "form3_results", 5: "form_zero_results", 6: "form_tare_results",
        8: "form_tilt_results"
    };

    if (_testsToRun.length === 0) {
        _container.innerHTML = `
        <div class="form-card" style="text-align:center; padding:40px;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#f39c12; margin-bottom:14px;"></i>
            <h3>No test plan found</h3>
            <p>Please go back and generate a test plan first.</p>
            <a href="/test-plan" class="btn" style="margin-top:14px;">Go to Test Plan</a>
        </div>`;
    } else {
        _renderTestDashboard();
    }

    function _recalculateProgress() {
        _completedCount = 0;
        _passedCount = 0;
        _failedCount = 0;

        _testsToRun.forEach((t, i) => {
            const key = _resultKeys[t.id];
            const resString = localStorage.getItem(key);
            if (resString) {
                t.isCompleted = true;
                _completedCount++;
                if (resString.includes('"FAIL"')) {
                    _failedCount++;
                } else {
                    _passedCount++;
                }
            } else {
                t.isCompleted = false;
            }
        });
        
        _currentIdx = _completedCount;
        if (_currentIdx >= _testsToRun.length) _currentIdx = _testsToRun.length - 1;
    }

    function _renderTestDashboard() {
        _recalculateProgress(); // Always recalculate from localStorage before rendering

        if (_progWrap) _progWrap.style.display = "none";
        
        const pct = Math.round((_completedCount / _testsToRun.length) * 100) || 0;
        const filledBlocks = Math.floor(pct / 5);
        const emptyBlocks = 20 - filledBlocks;
        const bar = '█'.repeat(Math.max(0, filledBlocks)) + '░'.repeat(Math.max(0, emptyBlocks));

        let listHTML = '';
        _testsToRun.forEach((t, i) => {
            let icon = '○';
            let color = '#888';
            if (t.isCompleted) {
                icon = '✓'; color = '#28c76f';
            } else if (i === _currentIdx) {
                icon = '●'; color = '#4da6ff';
            }
            listHTML += `<div style="color:${color}; font-size:16px; margin-bottom:10px; display:flex; align-items:center;">
                <span style="display:inline-block; width:28px; font-weight:bold;">${icon}</span>
                <span>${t.name}</span>
            </div>`;
        });

        _container.innerHTML = `
            <div class="form-card" style="padding: 32px; font-family: 'IBM Plex Sans', sans-serif;">
                <h3 style="margin-top:0; color:var(--color-ink); font-family:var(--font-display); font-size: 22px;">Test Execution Dashboard</h3>
                
                <div style="margin-top: 24px; margin-bottom: 24px; color:#555; font-family: monospace;">
                    <div style="margin-bottom: 6px; font-size: 14px;">Progress</div>
                    <div style="font-size:18px;">
                        <span style="color:#0E7C86;">${bar}</span> ${pct}%
                    </div>
                </div>
                
                <hr style="border:none; border-top:1px dashed #ccc; margin: 24px 0;">
                
                <div style="margin-bottom: 24px; font-family: monospace;">
                    ${listHTML}
                </div>

                <hr style="border:none; border-top:1px dashed #ccc; margin: 24px 0;">

                <div style="display:flex; justify-content: space-between; margin-bottom: 32px; color:#555;">
                    <div>Tests completed:<br><strong style="font-size:22px; color:var(--color-ink);">${_completedCount} / ${_testsToRun.length}</strong></div>
                    <div>Passed:<br><strong style="font-size:22px; color:#28c76f;">${_passedCount}</strong></div>
                    <div>Failed:<br><strong style="font-size:22px; color:#e74c3c;">${_failedCount}</strong></div>
                </div>

                <button class="btn" style="width:100%; padding: 14px; font-size:16px; background:#0E7C86;" onclick="_showTest(${_currentIdx})">
                    ${_completedCount === _testsToRun.length ? 'Review Latest Test' : 'Continue Testing'}
                </button>
            </div>
        `;
    }

    // ── Progress Bar ──────────────────────────────────────────
    function _updateProgress(idx) {
        if (!_progWrap) return;
        _progWrap.style.display = "block";

        const dots = _testsToRun.map((t, i) => `
            <div class="step-dot ${i < idx ? 'done' : i === idx ? 'active' : 'pending'}"
                 title="${t.name}"></div>`).join('');
        const names = _testsToRun.map((t, i) => `
            <div class="step-name ${i < idx ? 'done' : i === idx ? 'active' : 'pending'}">
                ${t.shortName || t.name.split(' ')[0]}
            </div>`).join('');

        _progWrap.innerHTML = `
        <div class="progress-header">
            <h3><i class="${_testsToRun[idx]?.icon || 'fas fa-tasks'}"></i>
                Test ${idx+1}: ${_testsToRun[idx]?.name || '—'}
            </h3>
            <span class="progress-label">Step ${idx+1} of ${_testsToRun.length}</span>
        </div>
        <div class="progress-steps">${dots}</div>
        <div class="step-names">${names}</div>`;
    }

    // ── Advance to next test ──────────────────────────────────
    function _advance() {
        _completedCount++; // Optimistically update count
        _testsToRun[_currentIdx].isCompleted = true; // Mark as done

        _currentIdx++;
        if (_currentIdx >= _testsToRun.length) {
            _submitReport();
        } else {
            // Re-render dashboard before next test, or jump straight to it.
            // Going back to dashboard provides a nice intermediate step
            _renderTestDashboard();
        }
    }

    // ── Next button HTML helper ───────────────────────────────
    function _nextBtn(fnName, isLast) {
        const nextHtml = isLast
            ? `<button type="button" class="btn btn-success" onclick="${fnName}()">
                   <i class="fas fa-check-circle"></i> Generate Report
               </button>`
            : `<button type="button" class="btn" onclick="${fnName}()">
                   Save & Proceed <i class="fas fa-arrow-right"></i>
               </button>`;
               
        return `<div style="display:flex; justify-content:space-between; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
                    <button type="button" class="btn btn-secondary" onclick="window.location.href='/home'">
                        <i class="fas fa-save"></i> Save & Exit
                    </button>
                    ${nextHtml}
                </div>`;
    }

    // ── Route to correct render function ─────────────────────
    function _showTest(idx) {
        _updateProgress(idx);
        _container.innerHTML = '';
        const test   = _testsToRun[idx];
        const isLast = (idx === _testsToRun.length - 1);
        switch (test.id) {
            case 1: _renderVisual(test, isLast);    break;
            case 2: _renderWeighing(test, isLast);  break;
            case 3: _renderRepeat(test, isLast);    break;
            case 4: _renderEccentricity(test, isLast); break;
            case 5: _renderZero(test, isLast);      break;
            case 6: _renderTare(test, isLast);      break;
            case 8: _renderTilt(test, isLast);      break;
            default: _advance();
        }
    }

    // ──────────────────────────────────────────────────────────
    // TEST 1 — VISUAL INSPECTION
    // ──────────────────────────────────────────────────────────
    function _renderVisual(test, isLast) {
        const items = [
            { n: "marking",      l: "Instrument markings complete & legible — Manufacturer, Model, Serial No., Class, Max, Min, e" },
            { n: "construction", l: "Construction and installation is satisfactory" },
            { n: "display",      l: "Display / indication is clear, legible, and functioning" },
            { n: "keyboard",     l: "All switches, keys, and controls are complete and operational" },
            { n: "sealing",      l: "Sealing provisions intact — no sign of unauthorized modification" },
            { n: "levelling",    l: "Instrument is stable, levelled, and correctly positioned" }
        ];
        const listHTML = items.map(item => `
            <div class="checklist-item">
                <label>
                    <input type="checkbox" name="${item.n}" required>
                    <span>${item.l}</span>
                </label>
            </div>`).join('');

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4><i class="${test.icon}"></i> ${test.name}</h4>
                    <span class="badge b-req">✅ REQUIRED</span>
                </div>
                <p style="color:#555; margin-bottom:14px;">
                    Verify all items below. All checkboxes must be confirmed before proceeding.
                </p>
                ${listHTML}
            </div>
            ${_nextBtn('proceedVisual', isLast)}
        </form>`;
    }

    window.proceedVisual = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());
        localStorage.setItem("form0",         JSON.stringify(data));
        localStorage.setItem("form0_results", JSON.stringify({ items: data, result: "PASS" }));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 2 — WEIGHING PERFORMANCE
    // ──────────────────────────────────────────────────────────
    function _renderWeighing(test, isLast) {
        const pts      = (test.testPoints || []).filter(p => p > 0);
        const e_g      = _eG;
        const cls      = _cls;

        let ascHTML = `<h4 style="margin-top:8px;"><i class="fas fa-sort-amount-up"></i> Ascending (0 → Max)</h4>`;
        let descHTML = `<h4 style="margin-top:24px;"><i class="fas fa-sort-amount-down"></i> Descending (Max → 0)</h4>`;

        pts.forEach(pt_g => {
            const pt_kg  = pt_g / 1000;
            const lim_kg = getMPE(pt_g, e_g, cls) / 1000;
            const disp   = Number.isInteger(pt_kg) ? pt_kg : pt_kg.toFixed(pt_kg < 1 ? 3 : 2);
            const fg = `
            <div class="form-group">
                <label>${disp} kg
                    <span style="font-size:0.82em;color:#888;float:right;">Tol: ±${lim_kg.toFixed(4)} kg</span>
                </label>
                <input type="number" step="any" name="asc_${pt_g}"
                    oninput="validateInputLive(this,${pt_kg},${lim_kg})"
                    placeholder="Reading at ${disp} kg" required>
            </div>`;
            ascHTML += fg;
        });

        [...pts].reverse().forEach(pt_g => {
            const pt_kg  = pt_g / 1000;
            const lim_kg = getMPE(pt_g, e_g, cls) / 1000;
            const disp   = Number.isInteger(pt_kg) ? pt_kg : pt_kg.toFixed(pt_kg < 1 ? 3 : 2);
            descHTML += `
            <div class="form-group">
                <label>${disp} kg
                    <span style="font-size:0.82em;color:#888;float:right;">Tol: ±${lim_kg.toFixed(4)} kg</span>
                </label>
                <input type="number" step="any" name="desc_${pt_g}"
                    oninput="validateInputLive(this,${pt_kg},${lim_kg})"
                    placeholder="Reading at ${disp} kg" required>
            </div>`;
        });

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4><i class="${test.icon}"></i> ${test.name}</h4>
                    <button type="button" class="btn btn-secondary"
                        onclick="autoFillWeighing()" style="padding:5px 10px; font-size:12px;">
                        <i class="fas fa-magic"></i> Auto-Fill Ideal
                    </button>
                </div>
                <p style="color:#888; font-size:0.84rem; margin:6px 0 14px;">
                    ${pts.length} test loads — apply each ascending then descending.
                </p>
                ${ascHTML}
                ${descHTML}
            </div>
            ${_nextBtn('proceedWeighing', isLast)}
        </form>`;
    }

    window.autoFillWeighing = function () {
        document.querySelectorAll('#test-form input[type="number"]').forEach(inp => {
            const m = inp.getAttribute('oninput').match(/validateInputLive\(this,([\d.]+)/);
            if (m) { inp.value = m[1]; inp.dispatchEvent(new Event('input')); }
        });
    };

    window.proceedWeighing = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());
        localStorage.setItem("form1", JSON.stringify(data));

        // Get test points from confirmed plan
        const test = _testsToRun[_currentIdx];
        const pts  = (test.testPoints || []).filter(p => p > 0);
        const results = {};

        pts.forEach(pt_g => {
            const asc_raw  = data[`asc_${pt_g}`];
            const desc_raw = data[`desc_${pt_g}`];
            if (!asc_raw || !desc_raw) return;

            const asc_g  = Number(asc_raw)  * 1000;
            const desc_g = Number(desc_raw) * 1000;
            const mpe    = getMPE(pt_g, _eG, _cls);

            const ae = Math.abs(asc_g  - pt_g);
            const de = Math.abs(desc_g - pt_g);

            results[pt_g] = {
                load_g:       pt_g,
                asc_reading:  Number(asc_raw),
                desc_reading: Number(desc_raw),
                asc_error:    ae / 1000,
                desc_error:   de / 1000,
                limit:        mpe / 1000,
                asc_status:   ae <= mpe ? "PASS" : "FAIL",
                desc_status:  de <= mpe ? "PASS" : "FAIL",
                result:       (ae <= mpe && de <= mpe) ? "PASS" : "FAIL"
            };
        });

        localStorage.setItem("form1_results", JSON.stringify(results));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 3 — REPEATABILITY
    // ──────────────────────────────────────────────────────────
    function _renderRepeat(test, isLast) {
        const n        = test.readings || 6;
        const load_kg  = (test.load || 0) / 1000;
        const lim_kg   = getMPE(test.load || 0, _eG, _cls) / 1000;

        let readHTML = '';
        for (let i = 1; i <= n; i++) {
            readHTML += `
            <div class="form-group">
                <label>Reading ${i}:</label>
                <input type="number" step="any" name="Value_${i}"
                    oninput="validateRepeatLive(this)" required>
            </div>`;
        }

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4><i class="${test.icon}"></i> ${test.name}</h4>
                    <button type="button" class="btn btn-secondary"
                        onclick="autoFillRepeat()" style="padding:5px 10px; font-size:12px;">
                        <i class="fas fa-magic"></i> Auto-Fill Ideal
                    </button>
                </div>
                <p style="color:#555; margin:6px 0 14px;">
                    Apply load, record reading, remove, re-apply. Required readings: <strong>${n}</strong><br>
                    Test load (½ Max): <strong>${load_kg.toFixed(3)} kg</strong> &nbsp;|&nbsp;
                    MPE limit: <strong>±${(lim_kg * 1000).toFixed(1)} g</strong>
                </p>
                <div class="form-group">
                    <label>Applied Test Load (kg):</label>
                    <input type="number" step="any" name="applied_load_repeatability"
                        id="rep-load" value="${load_kg}"
                        oninput="document.querySelectorAll('#test-form input[type=number]:not(#rep-load)').forEach(i=>{if(i.value)validateRepeatLive(i);})">
                </div>
                ${readHTML}
            </div>
            ${_nextBtn('proceedRepeat', isLast)}
        </form>`;
    }

    window.validateRepeatLive = function (input) {
        if (!input.value) { input.style.border = ''; return; }
        const load_kg  = Number(document.getElementById("rep-load")?.value) || ((test && test.load) || 0) / 1000;
        const lim_kg   = getMPE(load_kg * 1000, _eG, _cls) / 1000;
        const err      = Math.abs(Number(input.value) - load_kg);
        input.style.transition = 'all 0.3s';
        input.style.border     = err <= lim_kg ? '2px solid #28a745' : '2px solid #dc3545';
        input.style.boxShadow  = err <= lim_kg ? '0 0 8px rgba(40,167,69,.3)' : '0 0 8px rgba(220,53,69,.3)';
    };

    window.autoFillRepeat = function () {
        const load = document.getElementById("rep-load")?.value || 0;
        document.querySelectorAll('#test-form input[type="number"]:not(#rep-load)').forEach(i => {
            i.value = load; i.dispatchEvent(new Event('input'));
        });
    };

    window.proceedRepeat = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());

        const load_kg = Number(data.applied_load_repeatability);
        delete data.applied_load_repeatability;
        localStorage.setItem("form2", JSON.stringify(data));

        const readings_g = Object.values(data).map(v => Number(v) * 1000);
        const maxR   = Math.max(...readings_g);
        const minR   = Math.min(...readings_g);
        const range  = maxR - minR;
        const mpe    = getMPE(load_kg * 1000, _eG, _cls);

        const result = {
            testLoad: load_kg,
            max: maxR / 1000, min: minR / 1000,
            range: range / 1000, limit: mpe / 1000,
            Repeatability: range <= mpe ? "PASS" : "FAIL"
        };
        localStorage.setItem("form2_results", JSON.stringify(result));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 4 — ECCENTRICITY
    // ──────────────────────────────────────────────────────────
    function _renderEccentricity(test, isLast) {
        const load_kg = (test.load || 0) / 1000;
        const lim_kg  = getMPE(test.load || 0, _eG, _cls) / 1000;

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4><i class="${test.icon}"></i> ${test.name}</h4>
                    <button type="button" class="btn btn-secondary"
                        onclick="autoFillEcc()" style="padding:5px 10px; font-size:12px;">
                        <i class="fas fa-magic"></i> Auto-Fill Ideal
                    </button>
                </div>
                <p style="color:#555; margin:6px 0 14px;">
                    Place the load at each marked position and record the indication.<br>
                    Test load (⅓ Max): <strong>${load_kg.toFixed(3)} kg</strong> &nbsp;|&nbsp;
                    MPE limit: <strong>±${(lim_kg * 1000).toFixed(1)} g</strong>
                </p>

                <!-- Diagram -->
                <div style="text-align:center; margin: 14px 0;">
                    <table style="border-collapse:separate; border-spacing:5px; margin:auto; font-size:0.78rem; color:#1a3a6b;">
                        <tr>
                            <td></td>
                            <td style="background:#ddeeff;border:2px solid #4a90d9;border-radius:6px;padding:8px 14px;font-weight:700;text-align:center;">① Front</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td style="background:#eef5ff;border:2px solid #c5d8f0;border-radius:6px;padding:8px 14px;font-weight:600;">④ Left</td>
                            <td style="background:#b8d8f8;border:2px solid #4a90d9;border-radius:6px;padding:8px 14px;font-weight:700;text-align:center;">⑤ Center</td>
                            <td style="background:#eef5ff;border:2px solid #c5d8f0;border-radius:6px;padding:8px 14px;font-weight:600;">② Right</td>
                        </tr>
                        <tr>
                            <td></td>
                            <td style="background:#ddeeff;border:2px solid #4a90d9;border-radius:6px;padding:8px 14px;font-weight:700;text-align:center;">③ Rear</td>
                            <td></td>
                        </tr>
                    </table>
                </div>

                <div class="form-group">
                    <label>Applied Test Load (kg):</label>
                    <input type="number" step="any" name="applied_load" id="ecc-load" value="${load_kg}"
                        oninput="document.querySelectorAll('#test-form input[type=number]:not(#ecc-load)').forEach(i=>{if(i.value)validateEccLive(i);})" required>
                </div>
                ${["front","right","rear","left","center"].map((pos, i) => `
                <div class="form-group">
                    <label>${["①","②","③","④","⑤"][i]} ${pos.charAt(0).toUpperCase()+pos.slice(1)} Position:</label>
                    <input type="number" step="any" name="${pos}" oninput="validateEccLive(this)" required>
                </div>`).join('')}
            </div>
            ${_nextBtn('proceedEcc', isLast)}
        </form>`;
    }

    window.validateEccLive = function (input) {
        if (!input.value) { input.style.border=''; return; }
        const load_kg = Number(document.getElementById("ecc-load")?.value) || 0;
        const lim_kg  = getMPE(load_kg * 1000, _eG, _cls) / 1000;
        const err     = Math.abs(Number(input.value) - load_kg);
        input.style.transition = 'all 0.3s';
        input.style.border    = err <= lim_kg ? '2px solid #28a745' : '2px solid #dc3545';
        input.style.boxShadow = err <= lim_kg ? '0 0 8px rgba(40,167,69,.3)' : '0 0 8px rgba(220,53,69,.3)';
    };

    window.autoFillEcc = function () {
        const load = document.getElementById("ecc-load")?.value || 0;
        document.querySelectorAll('#test-form input[type="number"]:not(#ecc-load)').forEach(i => {
            i.value = load; i.dispatchEvent(new Event('input'));
        });
    };

    window.proceedEcc = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());

        const load_kg = Number(data.applied_load);
        delete data.applied_load;
        localStorage.setItem("form3", JSON.stringify(data));

        const mpe_g   = getMPE(load_kg * 1000, _eG, _cls);
        let allPassed = true;
        const details = {};

        for (let pos in data) {
            const ind_g  = Number(data[pos]) * 1000;
            const err_g  = Math.abs(ind_g - load_kg * 1000);
            const status = err_g <= mpe_g ? "PASS" : "FAIL";
            if (status === "FAIL") allPassed = false;
            details[pos] = { appliedLoad: load_kg, indication: ind_g/1000, error: err_g/1000, limit: mpe_g/1000, result: status };
        }

        localStorage.setItem("form3_results", JSON.stringify({ details, Eccentricity: allPassed ? "PASS" : "FAIL" }));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 5 — ZERO-SETTING / TRACKING
    // ──────────────────────────────────────────────────────────
    function _renderZero(test, isLast) {
        const halfE_kg = _eG / 2000;  // 0.5e in kg

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <h4><i class="${test.icon}"></i> ${test.name}</h4>
                <p style="color:#555; margin:6px 0 14px;">
                    Verify zero indication at no load. Limit: ±0.5e = <strong>±${_eG/2} g (±${halfE_kg.toFixed(4)} kg)</strong>
                </p>
                <div class="form-group">
                    <label>Zero indication reading (kg, at no load):</label>
                    <input type="number" step="any" name="zero_indication" id="zero-ind"
                        placeholder="Should be near 0.000"
                        oninput="validateInputLive(this, 0, ${halfE_kg})" required>
                </div>
                <div class="checklist-item" style="margin-top:12px;">
                    <label>
                        <input type="checkbox" name="zero_stable" required>
                        <span>Zero indication is stable (not continuously fluctuating)</span>
                    </label>
                </div>
                <div class="checklist-item">
                    <label>
                        <input type="checkbox" name="zero_restored" required>
                        <span>After placing and removing a test load, zero is correctly restored</span>
                    </label>
                </div>
            </div>
            ${_nextBtn('proceedZero', isLast)}
        </form>`;
    }

    window.proceedZero = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data     = Object.fromEntries(new FormData(form).entries());
        const ind_g    = Number(data.zero_indication) * 1000;
        const err_g    = Math.abs(ind_g);
        const halfE    = _eG / 2;
        const result = {
            zero_indication: data.zero_indication,
            error_g: err_g, limit_g: halfE,
            ZeroSetting: err_g <= halfE ? "PASS" : "FAIL"
        };
        localStorage.setItem("form_zero",         JSON.stringify(data));
        localStorage.setItem("form_zero_results", JSON.stringify(result));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 6 — TARE ACCURACY
    // ──────────────────────────────────────────────────────────
    function _renderTare(test, isLast) {
        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <h4><i class="${test.icon}"></i> ${test.name}</h4>
                <p style="color:#555; margin:6px 0 14px;">
                    Verify that the tare device correctly nullifies the container weight.
                    Net indication should be 0 within MPE after tare is applied.
                </p>
                <div class="form-group">
                    <label>Tare / Container weight (kg):</label>
                    <input type="number" step="any" name="tare_load" id="tare-load"
                        placeholder="e.g. 2.5" required>
                </div>
                <div class="form-group">
                    <label>Net indication after tare is applied (should be ≈ 0 kg):</label>
                    <input type="number" step="any" name="net_indication"
                        placeholder="e.g. 0.000" required>
                </div>
                <div class="form-group">
                    <label>Test load added in container (kg):</label>
                    <input type="number" step="any" name="test_load_added" id="tare-added" required>
                </div>
                <div class="form-group">
                    <label>Gross indication (tare + test load):</label>
                    <input type="number" step="any" name="gross_indication" required>
                </div>
            </div>
            ${_nextBtn('proceedTare', isLast)}
        </form>`;
    }

    window.proceedTare = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());

        const tare_g   = Number(data.tare_load) * 1000;
        const net_g    = Number(data.net_indication) * 1000;
        const mpe_g    = getMPE(tare_g, _eG, _cls);

        const result = {
            tare_load: data.tare_load,
            net_indication: data.net_indication,
            tare_error_g: Math.abs(net_g),
            limit_g: mpe_g,
            TareAccuracy: Math.abs(net_g) <= mpe_g ? "PASS" : "FAIL"
        };
        localStorage.setItem("form_tare",         JSON.stringify(data));
        localStorage.setItem("form_tare_results", JSON.stringify(result));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // TEST 8 — TILT TEST
    // ──────────────────────────────────────────────────────────
    function _renderTilt(test, isLast) {
        const limitG  = test.limit_g || _eG;
        const limitKg = limitG / 1000;

        _container.innerHTML = `
        <form id="test-form">
            <div class="form-card">
                <h4><i class="${test.icon}"></i> ${test.name}</h4>
                <p style="color:#555; margin:6px 0 14px;">
                    Tilt the instrument ≤5° in X and Y directions. Maximum permissible deviation
                    from reference reading: <strong>1e = ${limitG} g (${limitKg.toFixed(4)} kg)</strong>
                </p>
                <div class="form-group">
                    <label>Reference reading — level position (kg):</label>
                    <input type="number" step="any" name="tilt_ref" id="tilt-ref"
                        placeholder="e.g. 10.000" required>
                </div>
                <div class="form-group">
                    <label>Reading after tilt in X-direction (kg):</label>
                    <input type="number" step="any" name="tilt_x" required>
                </div>
                <div class="form-group">
                    <label>Reading after tilt in Y-direction (kg):</label>
                    <input type="number" step="any" name="tilt_y" required>
                </div>
            </div>
            ${_nextBtn('proceedTilt', isLast)}
        </form>`;
    }

    window.proceedTilt = function () {
        const form = document.getElementById("test-form");
        if (!form || !form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());

        const ref_g  = Number(data.tilt_ref) * 1000;
        const x_g    = Number(data.tilt_x)   * 1000;
        const y_g    = Number(data.tilt_y)   * 1000;
        const xe     = Math.abs(x_g - ref_g);
        const ye     = Math.abs(y_g - ref_g);
        const maxErr = Math.max(xe, ye);
        const lim    = _eG;

        const result = {
            tilt_ref: data.tilt_ref, tilt_x: data.tilt_x, tilt_y: data.tilt_y,
            x_error_g: xe, y_error_g: ye, limit_g: lim,
            TiltTest: maxErr <= lim ? "PASS" : "FAIL"
        };
        localStorage.setItem("form_tilt",         JSON.stringify(data));
        localStorage.setItem("form_tilt_results", JSON.stringify(result));
        _advance();
    };

    // ──────────────────────────────────────────────────────────
    // REPORT SUBMISSION
    // ──────────────────────────────────────────────────────────
    function _submitReport() {
        _progWrap.style.display = "none";
        _container.innerHTML = `
        <div class="form-card" style="text-align:center; padding:40px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:#4da6ff; margin-bottom:16px;"></i>
            <h3>Saving report to database...</h3>
        </div>`;

        const get = key => JSON.parse(localStorage.getItem(key) || "{}");

        const finalData = {
            instrument:        get("InstrumentData"),
            testPlan:          JSON.parse(localStorage.getItem("confirmedTestPlan") || "null"),
            form0:             get("form0"),
            form0_results:     get("form0_results"),
            form1:             get("form1"),
            form1_results:     get("form1_results"),
            form2:             get("form2"),
            form2_results:     get("form2_results"),
            form3:             get("form3"),
            form3_results:     get("form3_results"),
            form_zero:         get("form_zero"),
            form_zero_results: get("form_zero_results"),
            form_tare:         get("form_tare"),
            form_tare_results: get("form_tare_results"),
            form_tilt:         get("form_tilt"),
            form_tilt_results: get("form_tilt_results"),
            lab_details:       get("LabDetails"),
            instrument_photo:  localStorage.getItem("InstrumentPhoto") || "",
            rule_set_version:  localStorage.getItem("RuleSetVersion") || "Unknown"
        };

        fetch("/api/save-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalData)
        })
        .then(r => r.json())
        .then(res => { window.location.href = "/report?id=" + res.id; })
        .catch(err => {
            console.error("Save error:", err);
            _container.innerHTML = `<div class="form-card" style="text-align:center;">
                <h3 style="color:red;">❌ Could not save report</h3>
                <p>Make sure the server is running.</p>
                <a href="/report" class="btn" style="margin-top:12px;">View Report Anyway</a>
            </div>`;
        });
    }

} // end if (_container)

// ────────────────────────────────────────────────────────────────
// SECTION 4 — LIVE VALIDATION HELPER
// ────────────────────────────────────────────────────────────────

window.validateInputLive = function (input, load_kg, limit_kg) {
    if (!input.value) { input.style.border = ''; input.style.boxShadow = ''; return; }
    const err = Math.abs(Number(input.value) - load_kg);
    input.style.transition = 'all 0.3s ease';
    if (err <= limit_kg) {
        input.style.border    = '2px solid #28a745';
        input.style.boxShadow = '0 0 8px rgba(40,167,69,0.3)';
    } else {
        input.style.border    = '2px solid #dc3545';
        input.style.boxShadow = '0 0 8px rgba(220,53,69,0.3)';
    }
};
