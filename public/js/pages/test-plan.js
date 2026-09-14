// Data Extraction
const maxKg  = Number(localStorage.getItem("Capacity"));
const eG     = Number(localStorage.getItem("eValue"));
const cls    = localStorage.getItem("ClassValue") || "class III";
const minG   = Number(localStorage.getItem("minCapacity")) || (20 * eG);
const mobile = localStorage.getItem("isMobile") === "true";
const hasTare          = localStorage.getItem("hasTare")          !== "false";
const hasMultiPosition = localStorage.getItem("hasMultiPosition") !== "false";
const instrData = JSON.parse(localStorage.getItem("InstrumentData") || "{}");

if (!maxKg || !eG) {
    window.location.href = "/new-test";
}

// Generate Plan
const instr = {
    max_g: maxKg * 1000, min_g: minG, e_g: eG, cls,
    isMobile: mobile, hasTare, hasMultiPosition
};
const plan = generateTestPlan(instr);
const testPoints = generateTestPoints(instr.max_g, instr.min_g, instr.e_g, instr.cls);

// Populate Header Info
const ruleSetVer = localStorage.getItem("RuleSetVersion") || "OIML R-76 V1";
const ruleSetEl = document.getElementById("display-rule-set");
if (ruleSetEl) ruleSetEl.textContent = ruleSetVer;

const clsDisplay = cls.replace("class ", "Class ");
let nameStr = (instrData.manufacturer || "Unknown") + (instrData.model ? " " + instrData.model : " Scale");
document.getElementById("display-instrument").innerHTML = 
    `<span>${nameStr}</span> &bull; <span>${clsDisplay}</span> &bull; <span>Max ${maxKg} kg</span> &bull; <span>e = ${eG} g</span>`;

let requiredCount = 0;
let optCount = 0;

// State for checkboxes
const userToggles = {};

function renderList() {
    requiredCount = 0;
    optCount = 0;
    let html = "";

    plan.forEach(t => {
        let badgeClass = "b-na", badgeText = "N/A", isChecked = false, isDisabled = true;
        
        if (t.status === "REQUIRED") {
            badgeClass = "b-req"; badgeText = "REQUIRED";
            isChecked = true; isDisabled = true;
            requiredCount++;
        } else if (t.status === "IF_APPLICABLE" || t.status === "IF_MOBILE") {
            badgeClass = "b-opt"; badgeText = "OPTIONAL";
            isDisabled = false;
            if (userToggles[t.id] === undefined) userToggles[t.id] = false; // Default OFF
            isChecked = userToggles[t.id];
            if (isChecked) optCount++;
        }

        const isNA = t.status === "NOT_APPLICABLE";
        
        html += `
        <div class="test-row ${isNA ? 'na' : ''}">
            <div class="col-check">
                <input type="checkbox" id="cb-${t.id}" 
                    ${isChecked ? 'checked' : ''} 
                    ${isDisabled ? 'disabled' : ''}
                    onchange="toggleTest(${t.id})">
            </div>
            <div class="col-name">
                <h4>0${t.id} &nbsp; ${t.name}</h4>
                <p>${t.note}</p>
            </div>
            <div class="col-badge">
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="col-action">
                <button class="btn-view" onclick="openModal(${t.id})">View ▾</button>
            </div>
        </div>`;
    });
    
    document.getElementById("test-list-body").innerHTML = html;
    updateMetrics();
}

function toggleTest(id) {
    userToggles[id] = document.getElementById(`cb-${id}`).checked;
    renderList(); // Re-render to update counts safely
}

function updateMetrics() {
    document.getElementById("metric-req").textContent = `${requiredCount} Required`;
    document.getElementById("metric-opt").textContent = `${optCount} Optional`;
    document.getElementById("metric-pts").textContent = `${testPoints.filter(p=>p>0).length} Load Points`;
    
    const total = requiredCount + optCount;
    document.getElementById("execute-count").innerHTML = `<strong>${total} tests</strong> will be executed`;
}

// Modal Logic
function openModal(testId) {
    const t = plan.find(x => x.id === testId);
    if(!t) return;
    
    document.getElementById("modal-title").textContent = t.name;
    
    let mpeHtml = "", loadHtml = "", procHtml = "", refHtml = "", objective = "";
    const mpeBase = getMPE(testPoints[testPoints.length-1] || 0, eG, cls); // max MPE
    
    if (t.id === 1) { // Visual
        objective = "To verify that the instrument conforms to all metrological and technical requirements visually before conducting physical tests.";
        mpeHtml = "N/A";
        loadHtml = "N/A";
        procHtml = "<ul class='proc-list'><li>Check manufacturer markings and seals</li><li>Ensure instrument is stable and level</li><li>Verify zero-tracking is operational</li></ul>";
        refHtml = "OIML R-76 §4.2";
    } else if (t.id === 2) { // Weighing
        objective = "To evaluate the instrument's accuracy over its entire weighing range by checking indications against known test loads.";
        mpeHtml = `Tier 1: ±0.5e <br> Tier 2: ±1.0e <br> Tier 3: ±1.5e`;
        loadHtml = testPoints.map(p => (p/1000) + 'kg').join(' → ');
        procHtml = "<ul class='proc-list'><li>Apply specified load ascendingly</li><li>Record indications</li><li>Remove loads descendingly</li><li>Compare error against MPE</li></ul>";
        refHtml = "OIML R-76 §3.6";
    } else if (t.id === 3) { // Repeatability
        objective = "To ensure the instrument provides consistent results when the same load is applied multiple times under identical conditions.";
        const rMpe = getMPE(t.load, eG, cls);
        mpeHtml = `±${rMpe} g`;
        loadHtml = `${(t.load/1000).toFixed(3)} kg`;
        procHtml = `<ul class='proc-list'><li>Apply load ${t.readings} times</li><li>Do not re-zero between applications</li><li>Check if (Max - Min) ≤ MPE</li></ul>`;
        refHtml = "OIML R-76 §3.6.2";
    } else if (t.id === 4) { // Eccentricity
        objective = "To verify that the instrument indicates the correct weight regardless of where the load is placed on the load receptor.";
        const eMpe = getMPE(t.load || 0, eG, cls);
        mpeHtml = `±${eMpe} g`;
        loadHtml = `${((t.load||0)/1000).toFixed(3)} kg`;
        procHtml = "<ul class='proc-list'><li>Apply load at Center, Front, Left, Right, Rear</li><li>Compare indication error vs MPE</li></ul>";
        refHtml = "OIML R-76 §3.6.3";
    } else if (t.id === 5) { // Zero
        objective = "To check the accuracy and stability of the instrument's zero-setting mechanism.";
        mpeHtml = `±0.5e (±${eG/2} g)`;
        loadHtml = "0 kg";
        procHtml = "<ul class='proc-list'><li>Verify zero indication at no load</li><li>Ensure zero is stable</li></ul>";
        refHtml = "OIML R-76 §3.4";
    } else if (t.id === 6) { // Tare
        objective = "To verify the accuracy of the tare device and ensure the net weight calculation is correct.";
        mpeHtml = "±MPE";
        loadHtml = "Variable";
        procHtml = "<ul class='proc-list'><li>Place tare load and activate tare</li><li>Ensure net indication is 0</li></ul>";
        refHtml = "OIML R-76 §3.5";
    } else if (t.id === 8) { // Tilt
        objective = "To evaluate the instrument's resistance to tilt, ensuring it remains accurate even when slightly out of level.";
        mpeHtml = `±1e (±${eG} g)`;
        loadHtml = "N/A";
        procHtml = "<ul class='proc-list'><li>Tilt instrument ≤5° in X/Y axes</li><li>Verify deviation from level reading</li></ul>";
        refHtml = "OIML R-76 §4.5";
    } else {
        objective = "No objective specified."; mpeHtml = "N/A"; loadHtml = "N/A"; procHtml = "See documentation."; refHtml = "N/A";
    }

    document.getElementById("modal-body-content").innerHTML = `
        <div class="modal-desc">
            <strong>Objective:</strong> ${objective}
        </div>
        <div class="modal-grid">
            <div>
                <div class="detail-section">
                    <h5><i class="fas fa-balance-scale"></i> MPE Limit</h5>
                    <div class="detail-box">${mpeHtml}</div>
                </div>
                <div class="detail-section">
                    <h5><i class="fas fa-weight-hanging"></i> Load Points</h5>
                    <div class="detail-box">${loadHtml}</div>
                </div>
            </div>
            <div>
                <div class="detail-section">
                    <h5><i class="fas fa-list-ol"></i> Procedure</h5>
                    ${procHtml}
                </div>
            </div>
        </div>
        <div style="padding: 0 24px 24px 24px;">
            <p style="font-size:12px; color:#999; margin:0; border-top: 1px solid var(--color-line-soft); padding-top: 16px;">
                <em>R-76 Reference: ${refHtml}</em>
            </p>
        </div>
    `;
    
    document.getElementById("detailModal").style.display = 'flex';
}

function closeModal() {
    document.getElementById("detailModal").style.display = 'none';
}

// Execution
function confirmAndStart() {
    const confirmedPlan = plan.map(t => {
        if (t.status === "IF_APPLICABLE" || t.status === "IF_MOBILE") {
            return Object.assign({}, t, {
                status: userToggles[t.id] ? "REQUIRED" : "NOT_APPLICABLE"
            });
        }
        return t;
    });

    localStorage.setItem("testPlan", JSON.stringify(plan)); // Full plan
    localStorage.setItem("confirmedTestPlan", JSON.stringify(confirmedPlan));
    localStorage.setItem("testPoints_g", JSON.stringify(testPoints));

    window.location.href = '/tests';
}

// Initialize
renderList();
