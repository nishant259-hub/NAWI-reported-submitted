// This function initializes the instrument data when the user proceeds from the first page
function proceed() {
    const form = document.querySelector("form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()); // Convert form data to a JS object

    // Check if essential fields are provided
    if (!data.capacity || !data.e_value) {
        alert("Please fill all the fields");
        return;
    }

    // Store the raw form data in localStorage
    localStorage.setItem("InstrumentData", JSON.stringify(data));

    // Extract specific fields for easy access later
    let capacityValue = document.getElementById("maxCapacity").value;
    let eVlaue = document.getElementById("eValue").value;
    let clasValue = document.getElementById("ClassValue").value;

    if (capacityValue === "" || eVlaue === "") {
        alert("Please fill all the fields");
        return;
    }

    // Convert extracted fields to numbers for calculations
    let mycapacityValue = Number(capacityValue);
    let myeVlaue = Number(eVlaue);

    // Save formatted values to localStorage
    localStorage.setItem("Capacity", mycapacityValue);
    localStorage.setItem("eValue", myeVlaue);
    localStorage.setItem("ClassValue", clasValue);

    // Navigate to the test page
    window.location.href = '/tests';
}
// Load saved instrument data from localStorage
const dataStr = localStorage.getItem("InstrumentData");
if (dataStr) {
    const data = JSON.parse(dataStr);
}

// Retrieve instrument class, max capacity, and verification scale interval (e)
let ClassValue = localStorage.getItem("ClassValue");
let maxweight = Number(localStorage.getItem("Capacity"));
let mineValue = Number(localStorage.getItem("eValue"));

// Calculate the specific test points based on capacity and e value
let point_one = Math.ceil((20 * mineValue) / 1000);   // Test Point 1 (e.g., Min load or 20e)
let point_two = Math.ceil((500 * mineValue) / 1000);  // Test Point 2 (e.g., 500e change point)
let point_three = Math.ceil(maxweight / 2);           // Test Point 3 (Half capacity)
let point_four = Math.ceil((2000 * mineValue) / 1000);// Test Point 4 (e.g., 2000e change point)
let point_five = Math.ceil(maxweight);                // Test Point 5 (Max capacity)
let point_six = Math.ceil(maxweight / 3);             // Test Point for Eccentricity (1/3 of Max capacity)

// Calculate Limits (MPE) for real-time UI validation
let limit_one = getMPE(point_one * 1000, mineValue, ClassValue) / 1000;
let limit_two = getMPE(point_two * 1000, mineValue, ClassValue) / 1000;
let limit_three = getMPE(point_three * 1000, mineValue, ClassValue) / 1000;
let limit_four = getMPE(point_four * 1000, mineValue, ClassValue) / 1000;
let limit_five = getMPE(point_five * 1000, mineValue, ClassValue) / 1000;

window.validateInputLive = function (input, load, limit) {
    if (!input.value) {
        input.style.border = '';
        input.style.boxShadow = '';
        return;
    }
    let val = Number(input.value) * 1000;
    let loadGrams = Number(load) * 1000;
    let limitGrams = Number(limit) * 1000;
    let err = Math.abs(val - loadGrams);

    // Smooth transition for impressive UI
    input.style.transition = 'all 0.3s ease';

    if (err <= limitGrams) {
        input.style.border = '2px solid #28a745';
        input.style.boxShadow = '0 0 8px rgba(40, 167, 69, 0.3)';
    } else {
        input.style.border = '2px solid #dc3545';
        input.style.boxShadow = '0 0 8px rgba(220, 53, 69, 0.3)';
    }
};

window.autoFillForm1 = function () {
    const form = document.querySelector("#renderForm form");
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        // Extract the load value from the input's placeholder or oninput logic
        const load = input.getAttribute('oninput').match(/validateInputLive\(this, ([0-9.]+)/)[1];
        input.value = load;
        input.dispatchEvent(new Event('input')); // Trigger live validation
    });
};

window.autoFillForm2 = function () {
    const form = document.querySelector("#renderForm2 form");
    let appliedLoadInput = form.querySelector('input[name="applied_load_repeatability"]');
    let load = appliedLoadInput.value || point_three;

    const inputs = form.querySelectorAll('input[type="number"]:not([name="applied_load_repeatability"])');
    inputs.forEach(input => {
        input.value = load;
        input.dispatchEvent(new Event('input'));
    });
};

window.validateRepeatabilityLive = function (input) {
    if (!input.value) {
        input.style.border = '';
        input.style.boxShadow = '';
        return;
    }
    let appliedLoadInput = document.querySelector('input[name="applied_load_repeatability"]');
    let load = Number(appliedLoadInput.value) || point_three;

    let limit = getMPE(load * 1000, mineValue, ClassValue) / 1000;

    let val = Number(input.value) * 1000;
    let loadGrams = load * 1000;
    let limitGrams = limit * 1000;
    let err = Math.abs(val - loadGrams);

    input.style.transition = 'all 0.3s ease';
    if (err <= limitGrams) {
        input.style.border = '2px solid #28a745';
        input.style.boxShadow = '0 0 8px rgba(40, 167, 69, 0.3)';
    } else {
        input.style.border = '2px solid #dc3545';
        input.style.boxShadow = '0 0 8px rgba(220, 53, 69, 0.3)';
    }
};

window.validateEccentricityLive = function (input) {
    if (!input.value) {
        input.style.border = '';
        input.style.boxShadow = '';
        return;
    }
    let appliedLoadInput = document.querySelector('input[name="applied_load"]');
    let load = Number(appliedLoadInput.value) || point_six;

    let limit = getMPE(load * 1000, mineValue, ClassValue) / 1000;

    let val = Number(input.value) * 1000;
    let loadGrams = load * 1000;
    let limitGrams = limit * 1000;
    let err = Math.abs(val - loadGrams);

    input.style.transition = 'all 0.3s ease';
    if (err <= limitGrams) {
        input.style.border = '2px solid #28a745';
        input.style.boxShadow = '0 0 8px rgba(40, 167, 69, 0.3)';
    } else {
        input.style.border = '2px solid #dc3545';
        input.style.boxShadow = '0 0 8px rgba(220, 53, 69, 0.3)';
    }
};

window.autoFillForm3 = function () {
    const form = document.querySelector("#renderForm3 form");
    let appliedLoadInput = form.querySelector('input[name="applied_load"]');
    let load = appliedLoadInput.value || point_six;

    const inputs = form.querySelectorAll('input[type="number"]:not([name="applied_load"])');
    inputs.forEach(input => {
        input.value = load;
        input.dispatchEvent(new Event('input'));
    });
};
const renderForm = document.getElementById("renderForm");
if (renderForm) {
    renderForm.innerHTML += `<form action="" method="GET">
     <div class="form-card">
         <div style="display: flex; justify-content: space-between; align-items: center;">
             <h4><i class="fas fa-weight"></i> Weighing Performance Test</h4>
             <button type="button" class="btn btn-secondary" onclick="autoFillForm1()" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-magic"></i> Auto-Fill Ideal</button>
         </div>
         
         <div class="form-group">
             <label>${point_one} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_one} kg</span></label>
             <input type="number" step="any" name="asc_${point_one}" oninput="validateInputLive(this, ${point_one}, ${limit_one})" placeholder="Check for ${point_one} kg" required>
         </div>
         <div class="form-group">
             <label>${point_two} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_two} kg</span></label>
             <input type="number" step="any" name="asc_${point_two}" oninput="validateInputLive(this, ${point_two}, ${limit_two})" placeholder="Check for ${point_two} kg" required>
         </div>
         <div class="form-group">
             <label>${point_three} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_three} kg</span></label>
             <input type="number" step="any" name="asc_${point_three}" oninput="validateInputLive(this, ${point_three}, ${limit_three})" placeholder="Check for ${point_three} kg" required>
         </div>
         <div class="form-group">
             <label>${point_four} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_four} kg</span></label>
             <input type="number" step="any" name="asc_${point_four}" oninput="validateInputLive(this, ${point_four}, ${limit_four})" placeholder="Check for ${point_four} kg" required>
         </div>
         <div class="form-group">
             <label>${point_five} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_five} kg</span></label>
             <input type="number" step="any" name="asc_${point_five}" oninput="validateInputLive(this, ${point_five}, ${limit_five})" placeholder="Check for ${point_five} kg" required>
         </div>

         <h4 style="margin-top:30px;"><i class="fas fa-sort-amount-down"></i> Descending Load Sequence</h4>
         
         <div class="form-group">
             <label>${point_five} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_five} kg</span></label>
             <input type="number" step="any" name="desc_${point_five}" oninput="validateInputLive(this, ${point_five}, ${limit_five})" placeholder="Check for ${point_five} kg" required>
         </div>
         <div class="form-group">
             <label>${point_four} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_four} kg</span></label>
             <input type="number" step="any" name="desc_${point_four}" oninput="validateInputLive(this, ${point_four}, ${limit_four})" placeholder="Check for ${point_four} kg" required>
         </div>
         <div class="form-group">
             <label>${point_three} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_three} kg</span></label>
             <input type="number" step="any" name="desc_${point_three}" oninput="validateInputLive(this, ${point_three}, ${limit_three})" placeholder="Check for ${point_three} kg" required>
         </div>
         <div class="form-group">
             <label>${point_two} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_two} kg</span></label>
             <input type="number" step="any" name="desc_${point_two}" oninput="validateInputLive(this, ${point_two}, ${limit_two})" placeholder="Check for ${point_two} kg" required>
         </div>
         <div class="form-group">
             <label>${point_one} Kilogram <span style="font-size: 0.85em; color: #888; float:right;">Tol: ±${limit_one} kg</span></label>
             <input type="number" step="any" name="desc_${point_one}" oninput="validateInputLive(this, ${point_one}, ${limit_one})" placeholder="Check for ${point_one} kg" required>
         </div>
     </div>
     <button type="button" class="btn" onclick="proceedNextTest()">Proceed to Next Test <i class="fas fa-arrow-right"></i></button>
</form>`
}

const renderForm2 = document.getElementById("renderForm2");
if (renderForm2) {
    let formHTML = `<form action="" method="GET">
     <div class="form-card">
         <div style="display: flex; justify-content: space-between; align-items: center;">
             <h4><i class="fas fa-sync-alt"></i> Repeatability Test: Constant Load</h4>
             <button type="button" class="btn btn-secondary" onclick="autoFillForm2()" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-magic"></i> Auto-Fill Ideal</button>
         </div>
         <p>The recommended load is 1/2 of Max Capacity (<strong>${point_three} kg</strong>).</p>
         <div class="form-group">
             <label>Applied Test Load (kg):</label>
             <input type="number" step="any" name="applied_load_repeatability" value="${point_three}" oninput="document.querySelectorAll('#renderForm2 input[type=number]:not([name=applied_load_repeatability])').forEach(i => {if(i.value) validateRepeatabilityLive(i);})" required>
         </div>
         <p>Place the test weight and check readings:</p>
         <div class="form-group">
             <label>Reading 1:</label>
             <input type="number" step="any" name="Value_1" oninput="validateRepeatabilityLive(this)" required>
         </div>`;

    if (ClassValue === "class III" || ClassValue === "class IIII") {
        formHTML += `
            <div class="form-group"><label>Reading 2:</label><input type="number" step="any" name="Value_2" oninput="validateRepeatabilityLive(this)" required></div>
            <div class="form-group"><label>Reading 3:</label><input type="number" step="any" name="Value_3" oninput="validateRepeatabilityLive(this)" required></div>
            <div class="form-group"><label>Reading 4:</label><input type="number" step="any" name="Value_4" oninput="validateRepeatabilityLive(this)" required></div>
            <div class="form-group"><label>Reading 5:</label><input type="number" step="any" name="Value_5" oninput="validateRepeatabilityLive(this)" required></div>
            <div class="form-group"><label>Reading 6:</label><input type="number" step="any" name="Value_6" oninput="validateRepeatabilityLive(this)" required></div>`;
    } else {
        formHTML += `
            <div class="form-group"><label>Reading 2:</label><input type="number" step="any" name="Value_2" oninput="validateRepeatabilityLive(this)" required></div>
            <div class="form-group"><label>Reading 3:</label><input type="number" step="any" name="Value_3" oninput="validateRepeatabilityLive(this)" required></div>`;
    }
    formHTML += `</div><button type="button" class="btn" onclick="NextTest2()">Proceed to Next Test <i class="fas fa-arrow-right"></i></button></form>`;
    renderForm2.innerHTML += formHTML;
}

const renderForm3 = document.getElementById("renderForm3");
if (renderForm3) {
    renderForm3.innerHTML += `
    <form action="" method="GET">
    <div class="form-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4><i class="fas fa-crosshairs"></i> Eccentricity Test</h4>
            <button type="button" class="btn btn-secondary" onclick="autoFillForm3()" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-magic"></i> Auto-Fill Ideal</button>
        </div>
        <p>The recommended load is 1/3 of Max Capacity (<strong>${point_six} kg</strong>).</p>
        <div class="form-group">
            <label>Applied Test Load (kg):</label>
            <input type="number" step="any" name="applied_load" value="${point_six}" oninput="document.querySelectorAll('#renderForm3 input[type=number]:not([name=applied_load])').forEach(i => {if(i.value) validateEccentricityLive(i);})" required>
        </div>
        <p>Apply this load to the following positions and record the readings:</p>
        
        <div class="form-group">
            <label>Center Position:</label>
            <input type="number" step="any" name="center" oninput="validateEccentricityLive(this)" required>
        </div>
        <div class="form-group">
            <label>Left-Front Position:</label>
            <input type="number" step="any" name="left-front" oninput="validateEccentricityLive(this)" required>
        </div>
        <div class="form-group">
            <label>Right-Front Position:</label>
            <input type="number" step="any" name="right-front" oninput="validateEccentricityLive(this)" required>
        </div>
        <div class="form-group">
            <label>Left-Back Position:</label>
            <input type="number" step="any" name="left-back" oninput="validateEccentricityLive(this)" required>
        </div>
        <div class="form-group">
            <label>Right-Back Position:</label>
            <input type="number" step="any" name="right-back" oninput="validateEccentricityLive(this)" required>
        </div>
    </div>
    <button type="button" class="btn btn-success" onclick="checkResults()"><i class="fas fa-check-circle"></i> Generate Report</button>
    </form>
    `
}
if (document.getElementById("renderForm2")) {
    document.getElementById("renderForm2").style.display = "none"
}
if (document.getElementById("renderForm3")) {
    document.getElementById("renderForm3").style.display = "none"
}
// Handle the logic when user completes Form 1 (Weighing Performance)
function proceedNextTest() {
    const form = document.querySelector("#renderForm form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    localStorage.setItem("form1", JSON.stringify(data)); // Save form 1 input

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let results = {};

    // Evaluate each weight tested against its Maximum Permissible Error (MPE)
    // We now group ascending and descending readings for each test load
    let testLoads = [point_one, point_two, point_three, point_four, point_five];

    for (let load of testLoads) {
        let testWeightInGrams = Number(load) * 1000;
        let allowedMPE = getMPE(testWeightInGrams, myeValue, myClass); // Determine MPE

        let asc_val = data[`asc_${load}`];
        let desc_val = data[`desc_${load}`];

        // If values are not found (shouldn't happen with required fields), we skip
        if (!asc_val || !desc_val) continue;

        let asc_indication = Number(asc_val) * 1000;
        let desc_indication = Number(desc_val) * 1000;

        let asc_error = Math.abs(asc_indication - testWeightInGrams);
        let desc_error = Math.abs(desc_indication - testWeightInGrams);

        // Pass if both errors are within the allowed MPE limit
        let asc_status = asc_error <= allowedMPE ? "PASS" : "FAIL";
        let desc_status = desc_error <= allowedMPE ? "PASS" : "FAIL";
        let final_status = (asc_status === "PASS" && desc_status === "PASS") ? "PASS" : "FAIL";

        results[load] = {
            asc_reading: asc_val,
            desc_reading: desc_val,
            asc_error: asc_error / 1000,
            desc_error: desc_error / 1000,
            limit: allowedMPE / 1000,
            result: final_status
        };
    }
    localStorage.setItem("form1_results", JSON.stringify(results)); // Save form 1 evaluation results
    console.log("Form 1 Results:", results);

    if (document.getElementById("renderForm")) {
        document.getElementById("renderForm").style.display = "none";
    }
    if (document.getElementById("renderForm2")) {
        document.getElementById("renderForm2").style.display = "block";
    }
    if (document.getElementById("renderForm3")) {
        document.getElementById("renderForm3").style.display = "none";
    }
}

// Handle the logic when user completes Form 2 (Repeatability)
function NextTest2() {
    const form = document.querySelector("#renderForm2 form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());

    // Extract the applied load from the form data and remove it from the data object
    let appliedLoadValue = Number(data.applied_load_repeatability);
    delete data.applied_load_repeatability;

    localStorage.setItem("form2", JSON.stringify(data)); // Save form 2 input

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let result = {}

    let allValue = Object.values(data);
    let allValueGram = [];

    // Convert all readings to grams for calculation
    for (let val of allValue) {
        allValueGram.push(Number(val) * 1000);
    }

    // Find the highest and lowest reading to determine the range (error)
    let maxReading = Math.max(...allValueGram);
    let minReading = Math.min(...allValueGram);

    // According to R-76, repeatability error is the difference between max and min reading
    let errorInGram = maxReading - minReading;
    // The limit is the absolute MPE for the given test load
    let allowedMPE = getMPE(appliedLoadValue * 1000, myeValue, myClass);

    result["max"] = maxReading / 1000;
    result["min"] = minReading / 1000;
    result["range"] = errorInGram / 1000;
    result["limit"] = allowedMPE / 1000;
    result["testLoad"] = appliedLoadValue;

    if (errorInGram <= allowedMPE) {
        result["Repeatability"] = "PASS";
    } else {
        result["Repeatability"] = "FAIL";
    }
    localStorage.setItem("form2_results", JSON.stringify(result));
    console.log("Form 2 Results:", result);


    if (document.getElementById("renderForm")) {
        document.getElementById("renderForm").style.display = "none";
    }
    if (document.getElementById("renderForm2")) {
        document.getElementById("renderForm2").style.display = "none";
    }
    if (document.getElementById("renderForm3")) {
        document.getElementById("renderForm3").style.display = "block";
    }
}

// Handle the logic when user completes Form 3 (Eccentricity) and generates the report
function checkResults() {
    const form = document.querySelector("#renderForm3 form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    localStorage.setItem("form3", JSON.stringify(data)); // Save form 3 input

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let result = {}

    // Extract the applied load from the form data and remove it from the data object
    let appliedLoadValue = Number(data.applied_load);
    delete data.applied_load;

    // Find the allowed MPE for the eccentricity test load
    let allowedMPE = getMPE(appliedLoadValue * 1000, myeValue, myClass);

    let allPassed = true;
    let detailedResults = {};

    // Evaluate the error for each individual position in the eccentricity test
    for (let position in data) {
        let indication = Number(data[position]) * 1000;
        let appliedLoad = appliedLoadValue * 1000;

        // Error is the absolute difference between the indicated value and the true applied load
        let error = Math.abs(indication - appliedLoad);
        let status = error <= allowedMPE ? "PASS" : "FAIL";
        if (status === "FAIL") allPassed = false; // Mark overall test as failed if any position fails

        // Save detailed results for transparency in the report
        detailedResults[position] = {
            appliedLoad: appliedLoadValue,
            indication: indication / 1000,
            error: error / 1000,
            limit: allowedMPE / 1000,
            result: status
        };
    }

    result["details"] = detailedResults;
    if (allPassed) {
        result["Eccentricity"] = "PASS";
    } else {
        result["Eccentricity"] = "FAIL";
    }
    localStorage.setItem("form3_results", JSON.stringify(result));
    console.log("Form 3 Results:", result);

    // --- SEND DATA TO BACKEND ---
    let finalData = {
        instrument: JSON.parse(localStorage.getItem("InstrumentData")),
        form1: JSON.parse(localStorage.getItem("form1")),
        form1_results: JSON.parse(localStorage.getItem("form1_results")),
        form2: JSON.parse(localStorage.getItem("form2")),
        form2_results: JSON.parse(localStorage.getItem("form2_results")),
        form3: data,
        form3_results: result
    };

    fetch("/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData)
    })
        .then(response => response.json())
        .then(resData => {
            alert("Report saved to Database successfully!");
            window.location.href = "/report?id=" + resData.id;
        })
        .catch(err => {
            console.error("Backend error:", err);
            alert("Could not connect to database. Make sure server.js is running!");
            window.location.href = "/report";
        });


}

// This function calculates the Maximum Permissible Error (MPE) 
// based on the applied load, verification scale interval (e), and instrument class
function getMPE(load_in_grams, eValue_in_grams, machineClass) {
    let m = load_in_grams / eValue_in_grams; // Calculate the number of verification scale intervals
    let mpe_multiplier = 0;

    // Define MPE multipliers for different OIML accuracy classes
    if (machineClass === "class I" || machineClass === "I") {
        if (m >= 0 && m <= 50000) mpe_multiplier = 0.5;
        else if (m > 50000 && m <= 200000) mpe_multiplier = 1.0;
        else if (m > 200000) mpe_multiplier = 1.5;

    } else if (machineClass === "class II" || machineClass === "II") {
        if (m >= 0 && m <= 5000) mpe_multiplier = 0.5;
        else if (m > 5000 && m <= 20000) mpe_multiplier = 1.0;
        else if (m > 20000) mpe_multiplier = 1.5;

    } else if (machineClass === "class III" || machineClass === "III") {
        if (m >= 0 && m <= 500) mpe_multiplier = 0.5;
        else if (m > 500 && m <= 2000) mpe_multiplier = 1.0;
        else if (m > 2000) mpe_multiplier = 1.5;

    } else if (machineClass === "class IIII" || machineClass === "IIII") {
        if (m >= 0 && m <= 50) mpe_multiplier = 0.5;
        else if (m > 50 && m <= 200) mpe_multiplier = 1.0;
        else if (m > 200) mpe_multiplier = 1.5;
    }

    return mpe_multiplier * eValue_in_grams; // Convert multiplier back to weight units (grams)
}
