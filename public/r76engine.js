// ================================================================
// NAWI — OIML R-76 Core Engine
// getMPE | generateTestPoints | getRepeatabilityReadings | generateTestPlan
// All weights are in GRAMS unless noted.
// ================================================================

function _normalizeClass(cls) {
    return (cls || "").replace(/class\s*/i, "").trim().toUpperCase();
}

// ── MPE CALCULATION  (OIML R-76 Table 1) ──────────────────────
/**
 * @param {number} load_g  - Applied load in grams
 * @param {number} e_g     - Verification scale interval (e) in grams
 * @param {string} cls     - e.g. "class III" | "III"
 * @returns {number} MPE in grams
 */
function getMPE(load_g, e_g, cls) {
    const c = _normalizeClass(cls);
    const m = load_g / e_g;
    let mult = 0;
    
    // Fallback defaults
    let intervals = [];
    if      (c === "I")    intervals = [50000, 200000];
    else if (c === "II")   intervals = [5000, 20000];
    else if (c === "III")  intervals = [500, 2000];
    else if (c === "IIII") intervals = [50, 200];

    let mpe_e = [0.5, 1.0, 1.5];

    // Override with dynamic rules if available
    if (typeof window !== 'undefined' && window.ACTIVE_OIML_RULES && window.ACTIVE_OIML_RULES.mpe) {
        const rules = window.ACTIVE_OIML_RULES.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey]) {
            intervals = rules[clsKey].e_intervals;
            mpe_e = rules[clsKey].mpe_e || mpe_e;
        }
    }

    if (intervals.length >= 2) {
        if (m <= intervals[0]) mult = mpe_e[0];
        else if (m <= intervals[1]) mult = mpe_e[1];
        else mult = mpe_e[2] || 1.5;
    }

    return mult * e_g;
}

// ── MPE TIER BOUNDARIES ────────────────────────────────────────
function getMPETierBoundaries(cls, e_g) {
    const c = _normalizeClass(cls);
    let intervals = [];

    if (typeof window !== 'undefined' && window.ACTIVE_OIML_RULES && window.ACTIVE_OIML_RULES.mpe) {
        const rules = window.ACTIVE_OIML_RULES.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey] && rules[clsKey].e_intervals) {
            intervals = rules[clsKey].e_intervals;
        }
    }

    if (intervals.length === 0) {
        if (c === "I")    intervals = [50000, 200000];
        else if (c === "II")   intervals = [5000, 20000];
        else if (c === "III")  intervals = [500, 2000];
        else if (c === "IIII") intervals = [50, 200];
    }

    return intervals.map(v => v * e_g);
}

// ── TEST POINT GENERATION  (OIML R-76 §3.6) ───────────────────
/**
 * @param {number} max_g - Max capacity in grams
 * @param {number} min_g - Min capacity in grams (0 = auto = 20e)
 * @param {number} e_g   - Verification interval in grams
 * @param {string} cls   - Accuracy class
 * @returns {number[]} Sorted unique test loads in grams
 */
function generateTestPoints(max_g, min_g, e_g, cls) {
    const pts = new Set();
    pts.add(0);

    const minLoad = (min_g > 0) ? min_g : (20 * e_g);
    if (minLoad <= max_g) pts.add(minLoad);

    // MPE tier boundary loads — critical characterisation points
    getMPETierBoundaries(cls, e_g).forEach(b => {
        if (b > minLoad && b < max_g) pts.add(b);
    });

    // Spread: 10%, 25%, 50%, 75% of Max
    [0.10, 0.25, 0.50, 0.75].forEach(f => {
        const r = Math.round((max_g * f) / e_g) * e_g;
        if (r > minLoad && r < max_g) pts.add(r);
    });

    pts.add(max_g);
    return Array.from(pts).filter(p => p >= 0 && p <= max_g).sort((a, b) => a - b);
}

// ── REPEATABILITY READINGS COUNT  (OIML R-76 §3.6.2) ──────────
function getRepeatabilityReadings(cls) {
    const c = _normalizeClass(cls);
    return (c === "I" || c === "II") ? 3 : 6;
}

// ── INTELLIGENT TEST PLAN GENERATOR ───────────────────────────
/**
 * Generates OIML R-76 test plan — different tests for different instruments.
 *
 * @param {object} instr
 *   max_g            {number}  Max capacity in grams
 *   min_g            {number}  Min capacity in grams
 *   e_g              {number}  Verification interval in grams
 *   cls              {string}  Accuracy class
 *   isMobile         {boolean} Mobile/portable instrument?
 *   hasTare          {boolean} Has tare device?
 *   hasMultiPosition {boolean} Multi-position platform? (false = hanging/crane scale)
 *
 * @returns {object[]} Test descriptor array
 */
function generateTestPlan(instr) {
    const {
        max_g,
        min_g,
        e_g,
        cls,
        isMobile         = false,
        hasTare          = true,
        hasMultiPosition = true   // false → eccentricity N/A
    } = instr;

    const testPoints  = generateTestPoints(max_g, min_g, e_g, cls);
    const repeatLoad  = Math.round((max_g / 2) / e_g) * e_g;
    const eccLoad     = Math.round((max_g / 3) / e_g) * e_g;
    const numReadings = getRepeatabilityReadings(cls);
    const nonZeroPts  = testPoints.filter(p => p > 0);

    return [
        {
            id: 1,
            name: "Visual Inspection",
            shortName: "Visual",
            icon: "fas fa-eye",
            status: "REQUIRED",
            note: "Markings, construction, sealing, levelling, display"
        },
        {
            id: 2,
            name: "Weighing Performance",
            shortName: "Weighing",
            icon: "fas fa-weight",
            status: "REQUIRED",
            note: `${nonZeroPts.length} loads × 2 (asc + desc) = ${nonZeroPts.length * 2} readings`,
            testPoints
        },
        {
            id: 3,
            name: "Repeatability",
            shortName: "Repeat.",
            icon: "fas fa-sync-alt",
            status: "REQUIRED",
            note: `${numReadings} readings at ${(repeatLoad/1000).toFixed(3)} kg (½ Max)`,
            load: repeatLoad,
            readings: numReadings
        },
        {
            id: 4,
            name: "Eccentricity",
            shortName: "Eccentric",
            icon: "fas fa-crosshairs",
            status: hasMultiPosition ? "REQUIRED" : "NOT_APPLICABLE",
            note: hasMultiPosition
                ? `5 positions at ${(eccLoad/1000).toFixed(3)} kg (⅓ Max)`
                : "N/A — single-point load receptor (e.g. crane/hanging scale)",
            load: eccLoad,
            positions: ["Front", "Right", "Rear", "Left", "Center"]
        },
        {
            id: 5,
            name: "Zero-Setting / Tracking",
            shortName: "Zero",
            icon: "fas fa-bullseye",
            status: "REQUIRED",
            note: `Limit: ±0.5e = ±${e_g/2} g`,
            halfE_g: e_g / 2
        },
        {
            id: 6,
            name: "Tare Accuracy",
            shortName: "Tare",
            icon: "fas fa-balance-scale",
            status: hasTare ? "IF_APPLICABLE" : "NOT_APPLICABLE",
            note: hasTare
                ? "Include if tare device will be used during service"
                : "N/A — instrument has no tare device"
        },
        {
            id: 7,
            name: "Discrimination / Sensitivity",
            shortName: "Discrim.",
            icon: "fas fa-sliders-h",
            status: "NOT_APPLICABLE",
            note: "N/A for digital-indication instruments (OIML R-76 §3.7)"
        },
        {
            id: 8,
            name: "Tilt Test",
            shortName: "Tilt",
            icon: "fas fa-arrows-alt",
            status: isMobile ? "REQUIRED" : "IF_MOBILE",
            note: isMobile
                ? `Required — mobile instrument. Limit: 1e = ${e_g} g`
                : "Include if instrument is used in mobile / portable conditions",
            limit_g: e_g
        }
    ];
}
