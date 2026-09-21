require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Report = require("./model/reportSchema");
const RuleSet = require("./model/RuleSet");
const AuditLog = require("./model/AuditLog");

const app = express();
const PORT = 3000;

// Middleware
const cookieParser = require("cookie-parser");
app.use(express.json({ limit: "10mb" })); // Increased limit for base64 photo
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
// Custom EJS rendering engine that automatically flattens split EJS tags
const ejs = require("ejs");
app.engine("ejs", (filePath, options, callback) => {
    try {
        const fs = require("fs");
        let content = fs.readFileSync(filePath, "utf8");
        content = content.replace(/<%[\s\S]*?%>/g, (m) => m.replace(/[\r\n]+\s*/g, " "));
        const html = ejs.render(content, Object.assign({}, options, { filename: filePath }));
        callback(null, html);
    } catch (err) {
        callback(err);
    }
});
app.set("view engine", "ejs");

// Basic Authentication Middleware
const authMiddleware = (req, res, next) => {
    const role = req.cookies.role;
    if (!role) {
        return res.redirect("/login");
    }
    req.userRole = role; // "admin" or "tester"
    req.username = req.cookies.username || (role === "admin" ? "Admin" : "Nishant");
    res.locals.userRole = role;
    res.locals.username = req.username;
    next();
};

const adminMiddleware = (req, res, next) => {
    if (req.cookies.role !== "admin") {
        return res.status(403).send("Access Denied: Admins only.");
    }
    next();
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log("✅ Connected to MongoDB");
    }).catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });


// ── API Routes ──────────────────────────────────────────────────

// Save complete test report to database
app.post("/api/save-report", authMiddleware, async (req, res) => {
    try {
        const {
            instrument,
            testPlan,
            form0, form0_results,
            form1, form1_results,
            form2, form2_results,
            form3, form3_results,
            form_zero, form_zero_results,
            form_tare, form_tare_results,
            form_tilt, form_tilt_results,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version
        } = req.body;

        const instrument_id = instrument
            ? `${instrument.manufacturer || ""} ${instrument.model || ""}`.trim() || instrument.capacity
            : "Unknown";

        const newReport = new Report({
            instrument_id,
            instrument_data: instrument,
            test_plan:          testPlan,
            form0_data:         form0,
            form0_results,
            form1_data:         form1,
            form1_results,
            form2_data:         form2,
            form2_results,
            form3_data:         form3,
            form3_results,
            form_zero_data:     form_zero,
            form_zero_results,
            form_tare_data:     form_tare,
            form_tare_results,
            form_tilt_data:     form_tilt,
            form_tilt_results,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version,
            createdBy: req.username
        });

        const savedReport = await newReport.save();

        await AuditLog.create({
            user: req.username,
            action: `Generated report ${savedReport._id}`,
            details: `Instrument: ${instrument_id}, Rule Set: ${rule_set_version}`
        });

        res.json({ message: "Report saved successfully!", id: savedReport._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all reports (for dashboard)
app.get("/api/history", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id createdAt").sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch a single report by ID
app.get("/api/report/:id", async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Page Routes ─────────────────────────────────────────────────

app.get("/history", authMiddleware, async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id instrument_data createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results").sort({ createdAt: -1 }).lean();
        
        // Calculate status for each report to use in the frontend
        reports.forEach(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            r.status = isPass ? "PASS" : "FAIL";
            // Get Serial No
            r.serial_no = (r.instrument_data && r.instrument_data.serial_no) ? r.instrument_data.serial_no : "N/A";
            // Get Class
            r.accuracy_class = (r.instrument_data && r.instrument_data.Class_value) ? r.instrument_data.Class_value : "Unknown";
            // Get Instrument Type
            r.instrument_type = (r.instrument_data && r.instrument_data.instrument_type) ? r.instrument_data.instrument_type : "Unknown";
        });

        res.render("history", { reports });
    } catch (err) {
        res.status(500).send("Error loading history");
    }
});

app.get("/",          (req, res) => res.render("index"));
app.get("/login",     (req, res) => res.render("login", { error: null }));
app.get("/signup",    (req, res) => res.redirect("/login"));

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@bytebrigade.com" && password === "admin") {
        res.cookie("role", "admin", { httpOnly: true });
        res.cookie("username", "Admin", { httpOnly: true });
        return res.redirect("/admin"); // admin goes directly to admin dashboard
    } else if (email === "tester@bytebrigade.com" && password === "tester") {
        res.cookie("role", "tester", { httpOnly: true });
        res.cookie("username", "Nishant", { httpOnly: true });
        return res.redirect("/home");
    }
    res.render("login", { error: "Invalid credentials." });
});

app.get("/logout", (req, res) => {
    res.clearCookie("role");
    res.clearCookie("username");
    res.redirect("/login");
});

// Admin should not access tester pages — redirect to /admin
const testerOnly = (req, res, next) => {
    if (req.cookies.role === "admin") return res.redirect("/admin");
    next();
};

app.get("/home", authMiddleware, testerOnly, async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results").sort({ createdAt: -1 }).lean();
        
        let passed = 0;
        let failed = 0;
        
        const recentTests = [];
        reports.forEach((r, idx) => {
            let isPass = true;
            // A report is FAIL if any result explicitly says "FAIL"
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            
            if (isPass) passed++;
            else failed++;
            
            if (idx < 4) {
                recentTests.push({
                    id: r._id.toString().substring(0,8).toUpperCase(),
                    name: r.instrument_id || "Unknown Instrument",
                    status: isPass ? "PASS" : "FAIL"
                });
            }
        });

        res.render("home", { total: reports.length, passed, failed, recentTests });
    } catch (err) {
        res.render("home", { total: 0, passed: 0, failed: 0, recentTests: [] });
    }
});
app.get("/new-test",  authMiddleware, testerOnly, async (req, res) => {
    try {
        let activeRule = await RuleSet.findOne({ isActive: true });
        if (!activeRule) {
            activeRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        }
        const activeRuleName = activeRule ? activeRule.version_name : "OIML R-76 V1";
        res.render("new-test", { activeRule: activeRuleName });
    } catch (err) {
        res.render("new-test", { activeRule: "OIML R-76 V1" });
    }
});
app.get("/test-plan", authMiddleware, testerOnly, async (req, res) => {
    try {
        let activeRule = await RuleSet.findOne({ isActive: true });
        if (!activeRule) {
            activeRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        }
        const activeRuleName = activeRule ? activeRule.version_name : "OIML R-76 V1";
        res.render("test-plan", { activeRule: activeRuleName });
    } catch (err) {
        res.render("test-plan", { activeRule: "OIML R-76 V1" });
    }
});
app.get("/tests",     authMiddleware, testerOnly, (req, res) => res.render("tests"));
app.get("/report",    authMiddleware, async (req, res) => {
    try {
        if (!req.query.id) return res.redirect("/history");
        const report = await Report.findById(req.query.id).lean();
        if (!report) {
            return res.status(404).send("Report not found");
        }
        
        let overallPass = true;
        let passCount = 0;
        let failCount = 0;
        let totalTests = 0;
        
        const checkStatus = (resultsObj) => {
            if (!resultsObj) return null;
            totalTests++;
            let isPass = true;
            if (JSON.stringify(resultsObj).includes('"FAIL"')) {
                isPass = false;
            }
            if (isPass) passCount++;
            else { failCount++; overallPass = false; }
            return isPass ? "PASS" : "FAIL";
        };

        const testStatus = {
            visual: checkStatus(report.form0_results),
            weighing: checkStatus(report.form1_results),
            repeatability: checkStatus(report.form2_results),
            eccentricity: checkStatus(report.form3_results),
            zero: checkStatus(report.form_zero_results),
            tare: checkStatus(report.form_tare_results),
            tilt: checkStatus(report.form_tilt_results)
        };
        
        res.render("report", { report, overallPass, passCount, failCount, totalTests, testStatus });
    } catch (err) {
        res.status(500).send("Error loading report: " + err.message);
    }
});

app.get("/report-detailed", async (req, res) => {
    try {
        if (!req.query.id) return res.redirect("/history");
        const report = await Report.findById(req.query.id).lean();
        if (!report) {
            return res.status(404).send("Report not found");
        }
        res.render("report-detailed", { report });
    } catch (err) {
        res.status(500).send("Error loading detailed report: " + err.message);
    }
});

app.get("/certificate", authMiddleware, async (req, res) => {
    try {
        if (!req.query.id) return res.redirect("/history");
        const report = await Report.findById(req.query.id).lean();
        if (!report) {
            return res.status(404).send("Report not found");
        }
        
        let overallPass = true;
        let passCount = 0;
        let failCount = 0;
        let totalTests = 0;
        
        const checkStatus = (resultsObj) => {
            if (!resultsObj) return null;
            totalTests++;
            let isPass = true;
            if (JSON.stringify(resultsObj).includes('"FAIL"')) {
                isPass = false;
            }
            if (isPass) passCount++;
            else { failCount++; overallPass = false; }
            return isPass ? "PASS" : "FAIL";
        };

        const testStatus = {
            visual: checkStatus(report.form0_results),
            weighing: checkStatus(report.form1_results),
            repeatability: checkStatus(report.form2_results),
            eccentricity: checkStatus(report.form3_results),
            zero: checkStatus(report.form_zero_results),
            tare: checkStatus(report.form_tare_results),
            tilt: checkStatus(report.form_tilt_results)
        };

        const simpleTests = [
            { name: "Zero Setting", resKey: "zeroSetting", data: report.form_zero_results },
            { name: "Tare Test", resKey: "tareTest", data: report.form_tare_results },
            { name: "Tilt Test", resKey: "tiltTest", data: report.form_tilt_results }
        ];
        
        const status = overallPass ? "PASS" : "FAIL";
        
        res.render("certificate", { report, status, testStatus, simpleTests });
    } catch (err) {
        res.status(500).send("Error loading certificate: " + err.message);
    }
});
// ── Admin & Rule Set Routes ───────────────────────────────────────

app.get("/admin", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // All reports with required fields
        const allReports = await Report.find({}, 
            "instrument_id instrument_data createdBy createdAt rule_set_version form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results lab_details"
        ).sort({ createdAt: -1 }).lean();

        // Compute pass/fail and normalize tester names per report
        let passed = 0, failed = 0;
        const processedReports = allReports.map(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (const res of results) {
                if (res && JSON.stringify(res).includes('"FAIL"')) { isPass = false; break; }
            }
            if (isPass) passed++; else failed++;
            const rawName = r.createdBy;
            const testerName = (rawName && rawName !== "Rahul" && rawName !== "Unknown") ? rawName : "Nishant";
            return { ...r, createdBy: testerName, status: isPass ? "PASS" : "FAIL" };
        });

        // Testers directory: Initialize with Nishant and Admin
        const testerMap = {
            "Nishant": { name: "Nishant", role: "Tester", tests: 0, status: "Active" },
            "Admin": { name: "Admin", role: "Admin", tests: 0, status: "Active" }
        };

        processedReports.forEach(r => {
            const name = r.createdBy;
            if (!testerMap[name]) {
                testerMap[name] = { 
                    name, 
                    role: name.toLowerCase().includes("admin") ? "Admin" : "Tester", 
                    tests: 0, 
                    status: "Active" 
                };
            }
            testerMap[name].tests++;
        });
        const testers = Object.values(testerMap);

        const rulesets = await RuleSet.find().sort({ createdAt: -1 }).lean();
        const activeRule = rulesets.find(r => r.isActive) || rulesets[0] || null;
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(150).lean();
        logs.forEach(l => {
            if (l.user === "Rahul" || !l.user) l.user = "Nishant";
        });

        const stats = {
            total: allReports.length,
            passed,
            failed,
            pending: 0,
            users: testers.length
        };

        res.render("admin", { stats, reports: processedReports, testers, rulesets, activeRule, logs });
    } catch(err) {
        console.error(err);
        res.status(500).send("Error loading admin dashboard: " + err.message);
    }
});

// Fetch active rule set
app.get("/api/rules/active", authMiddleware, async (req, res) => {
    try {
        let activeRule = await RuleSet.findOne({ isActive: true });
        // Fallback if none active (or DB not seeded properly)
        if (!activeRule) {
            activeRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        }
        res.json(activeRule || {});
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/rules/add", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { version_name, description, rules } = req.body;
        let parsedRules;
        try {
            parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules;
        } catch(e) {
            return res.status(400).json({ error: "Invalid JSON in rules field." });
        }
        const newRule = new RuleSet({ version_name, description, rules: parsedRules, createdBy: req.username });
        await newRule.save();
        
        await AuditLog.create({
            user: req.username,
            action: `Added Rule Set ${version_name}`,
            details: `Status: DRAFT (not yet activated)`
        });

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/rules/activate/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const targetRule = await RuleSet.findById(req.params.id);
        if (!targetRule) return res.status(404).json({ error: "Not found" });

        const previousRule = await RuleSet.findOne({ isActive: true });
        
        // Deactivate all
        await RuleSet.updateMany({}, { isActive: false });
        // Activate target
        targetRule.isActive = true;
        await targetRule.save();

        await AuditLog.create({
            user: req.username,
            action: `Activated Rule Set ${targetRule.version_name}`,
            details: `Previous: ${previousRule ? previousRule.version_name : 'None'}`
        });

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
