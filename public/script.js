function proceed() {
    const form = document.querySelector("form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!data.capacity || !data.e_value) {
        alert("Please fill all the fields");
        return;
    }
    localStorage.setItem("InstrumentData", JSON.stringify(data));
    let capacityValue = document.getElementById("maxCapacity").value;
    let eVlaue = document.getElementById("eValue").value;
    let clasValue = document.getElementById("ClassValue").value;
    if (capacityValue === "" || eVlaue === "") {
        alert("Please fill all the fields");
        return;
    }
    let mycapacityValue = Number(capacityValue);
    let myeVlaue = Number(eVlaue);

    localStorage.setItem("Capacity", mycapacityValue);
    localStorage.setItem("eValue", myeVlaue);
    localStorage.setItem("ClassValue", clasValue);
    window.location.href = '/tests';
}
const dataStr = localStorage.getItem("InstrumentData");
if (dataStr) {
    const data = JSON.parse(dataStr);
}

let ClassValue = localStorage.getItem("ClassValue");
let maxweight = Number(localStorage.getItem("Capacity"));
let mineValue = Number(localStorage.getItem("eValue"));



let point_one = Math.ceil((20 * mineValue) / 1000);
let point_two = Math.ceil((500 * mineValue) / 1000);
let point_three = Math.ceil(maxweight / 2);
let point_four = Math.ceil((2000 * mineValue) / 1000);
let point_five = Math.ceil(maxweight);
let point_six = Math.ceil(maxweight / 3);
const renderForm = document.getElementById("renderForm");
if (renderForm) {
    renderForm.innerHTML += `<form action="" method="GET">
     <div class="form-card">
         <h4><i class="fas fa-weight"></i> Weighing Performance Test</h4>
         
         <div class="form-group">
             <label>${point_one} Kilogram</label>
             <input type="number" step="any" name="${point_one}" placeholder="Check for ${point_one} kg" required>
         </div>
         <div class="form-group">
             <label>${point_two} Kilogram</label>
             <input type="number" step="any" name="${point_two}" placeholder="Check for ${point_two} kg" required>
         </div>
         <div class="form-group">
             <label>${point_three} Kilogram</label>
             <input type="number" step="any" name="${point_three}" placeholder="Check for ${point_three} kg" required>
         </div>
         <div class="form-group">
             <label>${point_four} Kilogram</label>
             <input type="number" step="any" name="${point_four}" placeholder="Check for ${point_four} kg" required>
         </div>
         <div class="form-group">
             <label>${point_five} Kilogram</label>
             <input type="number" step="any" name="${point_five}" placeholder="Check for ${point_five} kg" required>
         </div>

         <h4 style="margin-top:30px;"><i class="fas fa-sort-amount-down"></i> Descending Load Sequence</h4>
         
         <div class="form-group">
             <label>${point_five} Kilogram</label>
             <input type="number" step="any" name="${point_five}" placeholder="Check for ${point_five} kg" required>
         </div>
         <div class="form-group">
             <label>${point_four} Kilogram</label>
             <input type="number" step="any" name="${point_four}" placeholder="Check for ${point_four} kg" required>
         </div>
         <div class="form-group">
             <label>${point_three} Kilogram</label>
             <input type="number" step="any" name="${point_three}" placeholder="Check for ${point_three} kg" required>
         </div>
         <div class="form-group">
             <label>${point_two} Kilogram</label>
             <input type="number" step="any" name="${point_two}" placeholder="Check for ${point_two} kg" required>
         </div>
         <div class="form-group">
             <label>${point_one} Kilogram</label>
             <input type="number" step="any" name="${point_one}" placeholder="Check for ${point_one} kg" required>
         </div>
     </div>
     <button type="button" class="btn" onclick="proceedNextTest()">Proceed to Next Test <i class="fas fa-arrow-right"></i></button>
</form>`
}

const renderForm2 = document.getElementById("renderForm2");
if (renderForm2) {
    let formHTML = `<form action="" method="GET">
     <div class="form-card">
         <h4><i class="fas fa-sync-alt"></i> Repeatability Test: Constant Load</h4>
         <div class="form-group">
             <label>Place ${point_three} kg weight and check reading</label>
             <input type="number" step="any" name="Value_1" required>
         </div>`;

    if (ClassValue === "class III" || ClassValue === "class IIII") {
        formHTML += `
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_2" required></div>
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_3" required></div>
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_4" required></div>
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_5" required></div>
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_6" required></div>`;
    } else {
        formHTML += `
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_2" required></div>
            <div class="form-group"><label>Place ${point_three} kg weight</label><input type="number" step="any" name="Value_3" required></div>`;
    }
    formHTML += `</div><button type="button" class="btn" onclick="NextTest2()">Proceed to Next Test <i class="fas fa-arrow-right"></i></button></form>`;
    renderForm2.innerHTML += formHTML;
}

const renderForm3 = document.getElementById("renderForm3");
if (renderForm3) {
    renderForm3.innerHTML += `
    <form action="" method="GET">
    <div class="form-card">
        <h4><i class="fas fa-crosshairs"></i> Eccentricity Test</h4>
        <p>Apply a load of <strong>${point_six} kg</strong> to the following positions and record the readings:</p>
        
        <div class="form-group">
            <label>Center Position:</label>
            <input type="number" step="any" name="center" required>
        </div>
        <div class="form-group">
            <label>Left-Front Position:</label>
            <input type="number" step="any" name="left-front" required>
        </div>
        <div class="form-group">
            <label>Right-Front Position:</label>
            <input type="number" step="any" name="right-front" required>
        </div>
        <div class="form-group">
            <label>Left-Back Position:</label>
            <input type="number" step="any" name="left-back" required>
        </div>
        <div class="form-group">
            <label>Right-Back Position:</label>
            <input type="number" step="any" name="right-back" required>
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
function proceedNextTest() {
    const form = document.querySelector("#renderForm form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    localStorage.setItem("form1", JSON.stringify(data));

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let results = {};

    for (const [weight_tested, entered_value] of Object.entries(data)) {
        let testWeightInGrams = Number(weight_tested) * 1000;
        let displayValueInGrams = Number(entered_value) * 1000;
        let errorInGrams = Math.abs(displayValueInGrams - testWeightInGrams);
        let allowedMPE = getMPE(testWeightInGrams, myeValue, myClass);
        if (errorInGrams <= allowedMPE) {
            results[weight_tested] = "PASS";
        } else {
            results[weight_tested] = "FAIL";
        }
    }
    localStorage.setItem("form1_results", JSON.stringify(results));
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

function NextTest2() {
    const form = document.querySelector("#renderForm2 form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem("form2", JSON.stringify(data));

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let result = {}

    let allValue = Object.values(data);
    let allValueGram = [];
    for (let val of allValue) {
        allValueGram.push(Number(val) * 1000);
    }
    let maxReading = Math.max(...allValueGram);
    let minReading = Math.min(...allValueGram);

    let errorInGram = maxReading - minReading;
    let allowedMPE = getMPE(point_three * 1000, myeValue, myClass);
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

function checkResults() {
    const form = document.querySelector("#renderForm3 form");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    localStorage.setItem("form3", JSON.stringify(data));

    let myClass = localStorage.getItem("ClassValue");
    let myeValue = Number(localStorage.getItem("eValue"));
    let result = {}

    let allValue = Object.values(data);
    let allValueArray = [];

    for (let val of allValue) {
        allValueArray.push(Number(val) * 1000);
    }
    let maxReading = Math.max(...allValueArray);
    let minReading = Math.min(...allValueArray);
    let errorInGram = maxReading - minReading;
    let allowedMPE = getMPE(point_six * 1000, myeValue, myClass);
    if (errorInGram <= allowedMPE) {
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

function getMPE(load_in_grams, eValue_in_grams, machineClass) {
    let m = load_in_grams / eValue_in_grams;
    let mpe_multiplier = 0;

    if (machineClass === "class I" || machineClass === "I") {
        if (m >= 0 && m <= 50000) mpe_multiplier = 0.5;
        else if (m > 50000 && m <= 200000) mpe_multiplier = 1.0;
        else if (m > 200000) mpe_multiplier = 1.5;

    } else if (machineClass === "class II" || machineClass === "II") {
        if (m >= 0 && m <= 5000) mpe_multiplier = 0.5;
        else if (m > 5000 && m <= 20000) mpe_multiplier = 1.0;
        else if (m > 20000 && m <= 100000) mpe_multiplier = 1.5;

    } else if (machineClass === "class III" || machineClass === "III") {
        if (m >= 0 && m <= 500) mpe_multiplier = 0.5;
        else if (m > 500 && m <= 2000) mpe_multiplier = 1.0;
        else if (m > 2000 && m <= 10000) mpe_multiplier = 1.5;

    } else if (machineClass === "class IIII" || machineClass === "IIII") {
        if (m >= 0 && m <= 50) mpe_multiplier = 0.5;
        else if (m > 50 && m <= 200) mpe_multiplier = 1.0;
        else if (m > 200 && m <= 1000) mpe_multiplier = 1.5;
    }

    return mpe_multiplier * eValue_in_grams;
}
