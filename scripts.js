let allCourseCodes = [];
let baseFolder = "csv_klasorleri_donem_bazli";

document.addEventListener("DOMContentLoaded", async function() {
    await loadCourseCodes();
    await loadTerms();
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

async function loadTerms() {
    const response = await fetch("terms.json");
    let terms = await response.json();

    terms.sort((a, b) => {
        // Yılları ayır
        const [yearA, termA] = a.split(" - ");
        const [yearB, termB] = b.split(" - ");

        const yearANum = parseInt(yearA.split(" ")[0]);
        const yearBNum = parseInt(yearB.split(" ")[0]);

        if (yearANum !== yearBNum) {
            return yearBNum - yearANum; // Büyük yıldan küçüğe
        } else {
            // Yıl aynı, dönem bazlı
            const order = { "Yaz Dönemi": 1, "Bahar Dönemi": 2, "Güz Dönemi": 3 };
            return order[termA] - order[termB];
        }
    });

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