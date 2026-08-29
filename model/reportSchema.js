const mongoose = require("mongoose");

// यह Schema तय करता है कि डेटाबेस में डेटा किस फॉर्मेट में सेव होगा
const ReportSchema = new mongoose.Schema({
    instrument_id: String,
    instrument_data: mongoose.Schema.Types.Mixed, // Mixed का मतलब है कि इसमें कोई भी JSON डेटा आ सकता है
    form1_data: mongoose.Schema.Types.Mixed,
    form1_results: mongoose.Schema.Types.Mixed,
    form2_data: mongoose.Schema.Types.Mixed,
    form2_results: mongoose.Schema.Types.Mixed,
    form3_data: mongoose.Schema.Types.Mixed,
    form3_results: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now } // सेव होने का समय
});

const Report = mongoose.model("Report", ReportSchema);

module.exports = Report; // इसे export किया ताकि server.js में इस्तेमाल कर सकें
