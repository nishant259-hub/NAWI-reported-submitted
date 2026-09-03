const mongoose = require("mongoose");


const ReportSchema = new mongoose.Schema({
    instrument_id: String,
    instrument_data: mongoose.Schema.Types.Mixed,
    form1_data: mongoose.Schema.Types.Mixed,
    form1_results: mongoose.Schema.Types.Mixed,
    form2_data: mongoose.Schema.Types.Mixed,
    form2_results: mongoose.Schema.Types.Mixed,
    form3_data: mongoose.Schema.Types.Mixed,
    form3_results: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", ReportSchema);

module.exports = Report; 
