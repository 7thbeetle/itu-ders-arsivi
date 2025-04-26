const rootPath = "csv_klasorleri_donem_bazli";

document.addEventListener("DOMContentLoaded", function () {
    const termSelect = document.getElementById("termSelect");
    const courseSelect = document.getElementById("courseSelect");

    // Dönemleri manuel listeleyelim
    const terms = [
        "2024 - 2025 Bahar Dönemi",
        "2023 - 2024 Bahar Dönemi",
        "2023 - 2024 Güz Dönemi",
        "2022 - 2023 Bahar Dönemi",
        "2022 - 2023 Güz Dönemi",
        "2021 - 2022 Bahar Dönemi",
        "2021 - 2022 Güz Dönemi",
        "2020 - 2021 Bahar Dönemi",
        "2020 - 2021 Güz Dönemi"
    ];

    terms.forEach(term => {
        const option = document.createElement("option");
        option.value = term;
        option.textContent = term;
        termSelect.appendChild(option);
    });

    termSelect.addEventListener("change", () => {
        loadCourses(termSelect.value);
    });

    courseSelect.addEventListener("change", () => {
        loadCSV(termSelect.value, courseSelect.value);
    });
});

function loadCourses(term) {
    const courseSelect = document.getElementById("courseSelect");
    courseSelect.innerHTML = "";

    fetch(`${rootPath}/${term}`)
        .then(response => response.text())
        .then(text => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const links = doc.querySelectorAll("a");

            const courses = [];
            links.forEach(link => {
                const href = link.getAttribute("href");
                if (href.endsWith(".csv")) {
                    courses.push(href.replace(".csv", ""));
                }
            });

            courses.sort();
            courses.forEach(course => {
                const option = document.createElement("option");
                option.value = course;
                option.textContent = course;
                courseSelect.appendChild(option);
            });
        });
}

function loadCSV(term, course) {
    const csvURL = `${rootPath}/${term}/${course}.csv`;
    Papa.parse(csvURL, {
        download: true,
        header: true,
        complete: function (results) {
            const container = document.getElementById("tableContainer");
            container.innerHTML = "";

            if (results.data.length > 0) {
                const table = document.createElement("table");
                table.className = "table table-striped";
                const thead = table.createTHead();
                const tbody = table.createTBody();

                // Başlık satırı
                const headers = Object.keys(results.data[0]);
                const headRow = thead.insertRow();
                headers.forEach(header => {
                    const th = document.createElement("th");
                    th.textContent = header;
                    headRow.appendChild(th);
                });

                // Veri satırları
                results.data.forEach(row => {
                    const bodyRow = tbody.insertRow();
                    headers.forEach(header => {
                        const td = bodyRow.insertCell();
                        td.textContent = row[header];
                    });
                });

                container.appendChild(table);
            }
        }
    });
}