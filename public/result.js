window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        document.getElementById("report-content").innerHTML = "<h2>Error: No report ID provided in URL!</h2>";
        return;
    }

    fetch(`/api/report/${reportId}`)
        .then(response => response.json())
        .then(data => {
            let instrument = data.instrument_data;
            let form1_data = data.form1_data;
            let form1_results = data.form1_results;
            let form2_data = data.form2_data;
            let form2_results = data.form2_results;
            let form3_data = data.form3_data;
            let form3_results = data.form3_results;

            let envFields = ['temperature', 'humidity', 'voltage'];
            let instHTML = "<h4>Instrument Details</h4>";
            let envHTML = "<h4>Environmental Conditions</h4>";

            for (let key in instrument) {
                // Capitalize the first letter for professional display
                let formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

                if (envFields.includes(key)) {
                    envHTML += `<p><b>${formattedKey}:</b> ${instrument[key]}</p>`;
                } else {
                    instHTML += `<p><b>${formattedKey}:</b> ${instrument[key]}</p>`;
                }
            }
            document.getElementById("instrument-details").innerHTML = instHTML;
            document.getElementById("env-details").innerHTML = envHTML;

            let test1HTML = "";
            if (form1_results && Object.keys(form1_results).length > 0 && typeof Object.values(form1_results)[0] === 'object') {
                for (let weight in form1_results) {
                    let details = form1_results[weight];
                    let statusColor = details.result === "PASS" ? "green" : "red";
                    test1HTML += `
                        <tr>
                            <td>${weight} kg</td>
                            <td>${details.asc_reading} kg</td>
                            <td>${details.desc_reading} kg</td>
                            <td>${details.asc_error} kg</td>
                            <td>${details.desc_error} kg</td>
                            <td>${details.limit} kg</td>
                            <td style="color: ${statusColor}; font-weight: bold;">${details.result}</td>
                        </tr>
                    `;
                }
            } else {
                // Fallback for old data format
                for (let weight in form1_data) {
                    let reading = form1_data[weight];
                    let status = form1_results[weight];
                    let statusColor = status === "PASS" ? "green" : "red";
                    test1HTML += `
                        <tr>
                            <td>${weight} kg</td>
                            <td colspan="5">${reading} kg</td>
                            <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
                        </tr>
                    `;
                }
            }
            document.getElementById("test1-table-body").innerHTML = test1HTML;


            let testHTML2 = "";
            let testLoad2 = form2_results && form2_results.testLoad ? form2_results.testLoad : "N/A";
            testHTML2 += `<tr><td colspan="2"><b>Test Load:</b> ${testLoad2} kg</td></tr>`;
            for (let key in form2_data) {
                let reading = form2_data[key];
                testHTML2 += `
                <tr>
                    <td>Reading ${key.split('_')[1] || key}</td>
                    <td>${reading} kg</td>
                </tr>
                `;
            }
            if (form2_results && form2_results.max !== undefined) {
                testHTML2 += `
                <tr><td><b>Maximum</b></td><td>${form2_results.max} kg</td></tr>
                <tr><td><b>Minimum</b></td><td>${form2_results.min} kg</td></tr>
                <tr><td><b>Range</b></td><td>${form2_results.range} kg</td></tr>
                <tr><td><b>Applicable Limit</b></td><td>${form2_results.limit} kg</td></tr>
                `;
            }

            let finalStatus2 = form2_results ? form2_results["Repeatability"] : "Unknown";
            let statusColor2 = finalStatus2 === "PASS" ? "green" : "red";
            testHTML2 += `
                <tr style="background-color: #f0f0f0;">
                    <td><b>Final Repeatability Result</b></td>
                    <td style="color: ${statusColor2}; font-weight: bold;">${finalStatus2}</td>
                </tr>
            `;
            document.getElementById("test2-table-body").innerHTML = testHTML2;

            let testHTML3 = "";
            if (form3_results && form3_results.details) {
                for (let position in form3_data) {
                    let details = form3_results.details[position];
                    let formattedPosition = position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let statusColor = details.result === "PASS" ? "green" : "red";
                    testHTML3 += `
                    <tr>
                        <td>${formattedPosition}</td>
                        <td>${details.appliedLoad} kg</td>
                        <td>${details.indication} kg</td>
                        <td>${details.error} kg</td>
                        <td>${details.limit} kg</td>
                        <td style="color: ${statusColor}; font-weight: bold;">${details.result}</td>
                    </tr>
                    `;
                }
            } else {
                for (let position in form3_data) {
                    let reading = form3_data[position];
                    testHTML3 += `
                    <tr>
                        <td>${position}</td>
                        <td colspan="5">${reading} kg</td>
                    </tr>
                    `;
                }
            }

            let finalStatus3 = form3_results ? form3_results["Eccentricity"] : "Unknown";
            let statusColor3 = finalStatus3 === "PASS" ? "green" : "red";
            testHTML3 += `
            <tr style="background-color: #f0f0f0;">
                <td colspan="5"><b>Final Eccentricity Result</b></td>
                <td style="color: ${statusColor3}; font-weight: bold;">${finalStatus3}</td>
            </tr>
            `;

            document.getElementById("test3-table-body").innerHTML = testHTML3;

            // ==========================================
            // AUTO AI AUDITOR NOTE
            // ==========================================
            fetch(`/api/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportData: data }) 
            })
            .then(res => res.json())
            .then(aiResult => {
                document.getElementById('ai-loading').style.display = 'none';
                if(aiResult.verdict) {
                    document.getElementById('ai-content').style.display = 'block';
                    document.getElementById('ai-verdict').innerText = aiResult.verdict;
                    document.getElementById('ai-prediction').innerText = aiResult.prediction;
                    document.getElementById('ai-action').innerText = aiResult.action;
                } else {
                    document.getElementById('ai-loading').style.display = 'flex';
                    document.getElementById('ai-loading').innerHTML = `<i class="fas fa-exclamation-triangle" style="color:red"></i> AI Analysis Error: ${aiResult.error || 'Failed'}`;
                }
            })
            .catch(err => {
                document.getElementById('ai-loading').innerHTML = `<i class="fas fa-exclamation-triangle" style="color:red"></i> AI Network Error`;
            });

        })
        .catch(err => {
            console.error("Error fetching report:", err);
            document.getElementById("report-content").innerHTML = "<h2>Error loading report from database!</h2>";
        });
};

function downloadPDF() {
    window.print();
}
