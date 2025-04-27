window.addEventListener('DOMContentLoaded', () => {
    const termSelect = document.getElementById('termSelect');
    const courseSelect = document.getElementById('courseSelect');
    const tableContainer = document.getElementById('tableContainer');
    const filterButton = document.getElementById('filterButton');
    const filterMenu = document.getElementById('filterMenu');
    const checkboxContainer = document.getElementById('checkboxContainer');

    let currentData = null;
    let activeColumns = [];
    let selectedColumns = []; // Filtrelenen sütunlar

    // Load saved filter settings
    const stored = localStorage.getItem('itu_selectedColumns');
    if (stored) {
        selectedColumns = JSON.parse(stored);
    }

    // Dönemleri yükle
    fetch('data/terms.json')
        .then(response => response.json())
        .then(terms => {
            terms.forEach(term => {
                const option = document.createElement('option');
                option.value = term;
                option.textContent = term;
                termSelect.appendChild(option);
            });
        });

    // Ders kodlarını yükle
    fetch('data/course_codes.json')
        .then(response => response.json())
        .then(courses => {
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                courseSelect.appendChild(option);
            });
        });

    termSelect.addEventListener('change', loadTable);
    courseSelect.addEventListener('change', loadTable);

    filterButton.addEventListener('click', () => {
        filterMenu.classList.toggle('hidden');
    });

    function loadTable() {
        const term = termSelect.value;
        const course = courseSelect.value;

        if (!term || !course) {
            tableContainer.innerHTML = '<p style="color: gray;">Dönem ve ders kodu seçiniz.</p>';
            return;
        }

        const csvPath = `data/csv_klasorleri_donem_bazli/${term}/${course}.csv`;

        fetch(csvPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Dosya bulunamadı');
                }
                return response.text();
            })
            .then(text => {
                const data = parseCSV(text.trim());
                currentData = data;

                if (selectedColumns.length === 0) {
                    selectedColumns = [...data.headers];
                    // Save filter settings
                    localStorage.setItem('itu_selectedColumns', JSON.stringify(selectedColumns));
                } else {
                    // keep only columns existing in new headers
                    selectedColumns = selectedColumns.filter(col => data.headers.includes(col));
                    if (selectedColumns.length === 0) {
                        selectedColumns = [...data.headers];
                    }
                    // Save filter settings
                    localStorage.setItem('itu_selectedColumns', JSON.stringify(selectedColumns));
                }

                createFilterCheckboxes(data.headers);
                renderTable(data);
            })
            .catch(error => {
                tableContainer.innerHTML = `<p style="color:red;">Bu dönemde bu ders kodundan ders bulunamadı.</p>`;
            });
    }

    function parseCSV(text) {
        const expectedColumns = 11;
        const lines = text.split(/\r?\n/);

        const rows = [];
        let buffer = [];
        let insideQuotes = false;
        let currentCell = '';

        if (lines.length === 0) {
            return { headers: [], rows: [] };
        }

        const headersLine = lines[0];
        const headers = headersLine.split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            let charArray = line.split('');
            for (let j = 0; j < charArray.length; j++) {
                const char = charArray[j];

                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    buffer.push(currentCell.trim());
                    currentCell = '';
                } else if ((char === '\n' || char === '\r') && insideQuotes) {
                    currentCell += ' '; // Hücre içi \n ise boşluk ekle
                } else {
                    currentCell += char;
                }
            }

            if (!insideQuotes) {
                buffer.push(currentCell.trim());
                currentCell = '';

                while (buffer.length >= expectedColumns) {
                    const completeRow = buffer.slice(0, expectedColumns);
                    rows.push(completeRow);
                    buffer = buffer.slice(expectedColumns);
                }
            } else {
                currentCell += ' ';
            }
        }

        return {
            headers: headers,
            rows: rows
        };
    }

    function createFilterCheckboxes(headers) {
        checkboxContainer.innerHTML = '';

        headers.forEach(header => {
            const label = document.createElement('label');
            label.textContent = header;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = header;
            checkbox.checked = selectedColumns.includes(header);

            label.appendChild(checkbox);
            checkboxContainer.appendChild(label);

            if (!checkbox.checked) {
                label.classList.add('inactive');
            }

            checkbox.addEventListener('change', () => {
                label.classList.toggle('inactive', !checkbox.checked);

                const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
                const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

                if (selected.length === 0) {
                    checkbox.checked = true;
                    label.classList.remove('inactive');
                    alert('En az bir sütun aktif kalmalı!');
                    return;
                }

                selectedColumns = selected;
                // Save filter settings
                localStorage.setItem('itu_selectedColumns', JSON.stringify(selectedColumns));
                renderTable(currentData);
            });
        });

        // Büyük TAMAM butonu (filtre menüsünü kapatır)
        const tamamButton = document.createElement('button');
        tamamButton.textContent = 'Tamam';
        tamamButton.classList.add('filter-close-button');

        tamamButton.addEventListener('click', () => {
            filterMenu.classList.add('hidden');
        });

        checkboxContainer.appendChild(tamamButton);
    }

    function renderTable(data) {
        const { headers, rows } = data;

        if (rows.length === 0) {
            tableContainer.innerHTML = '<p>Veri bulunamadı.</p>';
            return;
        }

        let html = '<table><thead><tr>';
        headers.forEach(header => {
            if (selectedColumns.includes(header)) {
                html += `<th>${header}</th>`;
            }
        });
        html += '</tr></thead><tbody>';

        rows.forEach(row => {
            html += '<tr>';
            headers.forEach((header, idx) => {
                if (selectedColumns.includes(header)) {
                    html += `<td>${row[idx] || ''}</td>`;
                }
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }
});