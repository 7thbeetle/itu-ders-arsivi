let allCourseCodes = [];
let baseFolder = "csv_klasorleri_donem_bazli";

document.addEventListener("DOMContentLoaded", async function() {
    await loadCourseCodes();
    loadTerms();
    document.getElementById("loadButton").addEventListener("click", loadTable);
});

async function loadCourseCodes() {
    const response = await fetch("course_codes.json");
    allCourseCodes = await response.json();

    const courseSelect = document.getElementById("courseCodeSelect");
    allCourseCodes.sort().forEach(code => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = code;
        courseSelect.appendChild(option);
    });
}

function loadTerms() {
    const terms = [
        "2024 - 2025 Bahar Dönemi", "2023 - 2024 Güz Dönemi", "2023 - 2024 Yaz Dönemi", "2023 - 2024 Bahar Dönemi",
        "2022 - 2023 Güz Dönemi", "2022 - 2023 Yaz Dönemi", "2022 - 2023 Bahar Dönemi",
        "2021 - 2022 Güz Dönemi", "2021 - 2022 Yaz Dönemi", "2021 - 2022 Bahar Dönemi",
        "2020 - 2021 Güz Dönemi", "2020 - 2021 Yaz Dönemi", "2020 - 2021 Bahar Dönemi",
        "2019 - 2020 Güz Dönemi", "2019 - 2020 Yaz Dönemi", "2019 - 2020 Bahar Dönemi",
        "2018 - 2019 Güz Dönemi", "2018 - 2019 Yaz Dönemi", "2018 - 2019 Bahar Dönemi",
        "2017 - 2018 Güz Dönemi", "2017 - 2018 Yaz Dönemi", "2017 - 2018 Bahar Dönemi",
        "2016 - 2017 Yaz Dönemi"
    ];

    const termSelect = document.getElementById("termSelect");
    terms.forEach(term => {
        const option = document.createElement("option");
        option.value = term;
        option.textContent = term;
        termSelect.appendChild(option);
    });
}

async function loadTable() {
    const term = document.getElementById("termSelect").value;
    const code = document.getElementById("courseCodeSelect").value;
    const message = document.getElementById("message");
    const tableContainer = document.getElementById("tableContainer");

    message.textContent = "";
    tableContainer.innerHTML = "";

    if (!term || !code) {
        message.textContent = "Lütfen dönem ve ders kodu seçiniz.";
        return;
    }

    const csvPath = `${baseFolder}/${term}/${code}.csv`;
    try {
        const response = await fetch(csvPath);
        if (!response.ok) throw new Error("Dosya bulunamadı.");

        const text = await response.text();
        const rows = text.trim().split("\n").map(row => row.split(","));

        if (rows.length > 0) {
            const table = document.createElement("table");
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            rows[0].forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            for (let i = 1; i < rows.length; i++) {
                const tr = document.createElement("tr");
                rows[i].forEach(cell => {
                    const td = document.createElement("td");
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);

            tableContainer.appendChild(table);
        } else {
            message.textContent = "Tablo verisi bulunamadı.";
        }

    } catch (error) {
        message.textContent = "❌ Bu dönemde bu ders kodundan ders bulunamadı.";
    }
}