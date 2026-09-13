document.addEventListener("DOMContentLoaded", function() {
    const rawInstrument = localStorage.getItem("InstrumentData");
    const rawPlan = localStorage.getItem("confirmedTestPlan");

    if (rawInstrument && rawPlan) {
        try {
            const instrument = JSON.parse(rawInstrument);
            const plan = JSON.parse(rawPlan);
            const testsToRun = plan.filter(t => t.status === "REQUIRED");

            // Check which tests are completed
            const resultKeys = {
                1: "form0_results", 2: "form1_results", 3: "form2_results",
                4: "form3_results", 5: "form_zero_results", 6: "form_tare_results",
                8: "form_tilt_results"
            };

            let completed = 0;
            testsToRun.forEach(t => {
                if (localStorage.getItem(resultKeys[t.id])) {
                    completed++;
                }
            });

            const remaining = testsToRun.length - completed;
            if (remaining > 0) {
                // We have 1 pending instrument evaluation
                document.getElementById("pending-count").innerText = "1";
                document.getElementById("pending-banner").style.display = "flex";
                
                const name = (instrument.manufacturer + " " + instrument.model).trim() || instrument.capacity + " kg instrument";
                document.getElementById("pending-name").innerText = name;
                document.getElementById("pending-remaining").innerText = remaining + " tests remaining";
            }
        } catch(e) {
            console.error("Error reading pending tests from localStorage", e);
        }
    }
});
