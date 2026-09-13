require("dotenv").config();
const mongoose = require("mongoose");
const RuleSet = require("./model/RuleSet");

const defaultRules = {
    mpe: {
        class_I:   { e_intervals: [50000, 200000], mpe_e: [1, 2, 3] },
        class_II:  { e_intervals: [5000, 20000],   mpe_e: [1, 2, 3] },
        class_III: { e_intervals: [500, 2000],     mpe_e: [1, 2, 3] },
        class_IIII:{ e_intervals: [50, 200],       mpe_e: [1, 2, 3] }
    },
    tare: {
        mpe_multiplier: 1.0 // e.g. tare mpe is same as weighing mpe
    },
    eccentricity: {
        load_fraction: 0.33 // approximately 1/3 of max capacity
    },
    repeatability: {
        max_diff_e: 1.0 // usually max difference should not exceed absolute value of MPE
    },
    tilt: {
        limit_e: 1.0 // limit is 1e or 2e depending on class, simplify for V1
    },
    zero_setting: {
        limit_e: 0.25
    }
};

async function seed() {
    await mongoose.connect(process.env.MONGO_DB);
    
    // Check if V1 exists
    const existing = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
    if (!existing) {
        const v1 = new RuleSet({
            version_name: "OIML R-76 V1",
            isActive: true,
            description: "Default OIML R-76-1:2006 (E) tolerances and limits.",
            rules: defaultRules,
            createdBy: "System"
        });
        await v1.save();
        console.log("Seeded OIML R-76 V1 ruleset.");
    } else {
        console.log("OIML R-76 V1 ruleset already exists.");
    }

    mongoose.connection.close();
}

seed();
