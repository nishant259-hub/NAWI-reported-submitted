require("dotenv").config();
const mongoose = require("mongoose");
const Report = require("./model/reportSchema");

// Dummy instrument data
const instruments = [
    { manufacturer: "Mettler Toledo", model: "ICS429", type: "Non-Automatic", capacity: "15", class: "III", e: "5", max: "15", min: "0.1" },
    { manufacturer: "Ohaus", model: "Defender 5000", type: "Platform", capacity: "150", class: "III", e: "50", max: "150", min: "1" },
    { manufacturer: "A&D", model: "GF-3000", type: "Precision", capacity: "3.2", class: "II", e: "0.1", max: "3.2", min: "0.005" },
    { manufacturer: "Sartorius", model: "Practum", type: "Analytical", capacity: "0.22", class: "I", e: "0.001", max: "0.22", min: "0.0001" },
    { manufacturer: "Avery Berkel", model: "XS", type: "Retail", capacity: "15", class: "III", e: "5", max: "15", min: "0.04" }
];

// Helper to generate a random hex string for test ID simulation
const genId = () => Math.random().toString(16).substring(2, 10).toUpperCase();

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_DB);
        console.log("Connected to MongoDB");

        const reports = [];

        for (let i = 0; i < 10; i++) {
            const inst = instruments[i % instruments.length];
            // Mix of passes and fails based on i (even pass, odd fail)
            const isPass = i % 2 === 0;

            const dummyResults = { overall: isPass ? 'PASS' : 'FAIL', details: 'Dummy test execution' };
            const form0_results = { status: isPass ? 'PASS' : 'FAIL', passed: isPass };
            const form1_results = { overall_status: isPass ? 'PASS' : 'FAIL' };
            const form2_results = { status: isPass ? 'PASS' : 'FAIL' };
            const form3_results = { status: isPass ? 'PASS' : 'FAIL' };
            
            // Randomize date within the last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            const report = new Report({
                instrument_id: `${inst.manufacturer} ${inst.model} (${genId()})`,
                instrument_data: inst,
                test_plan: { tests: ['form0', 'form1', 'form2', 'form3'] },
                form0_results,
                form1_results,
                form2_results,
                form3_results,
                createdAt: date
            });

            reports.push(report);
        }

        await Report.insertMany(reports);
        console.log(`Successfully seeded ${reports.length} reports.`);

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedData();
