window.addEventListener('DOMContentLoaded', () => {
    const termSelect = document.getElementById('termSelect');
    const courseSelect = document.getElementById('courseSelect');
    const tableContainer = document.getElementById('tableContainer');

    // Term ve Course seçeneklerini yükle
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

    // Seçim değişince tabloyu yükle
    termSelect.addEventListener('change', loadTable);
    courseSelect.addEventListener('change', loadTable);

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
                renderTable(data);
            })
            .catch(error => {
                tableContainer.innerHTML = `<p style="color:red;">Bu dönemde bu ders kodundan ders bulunamadı.</p>`;
            });
    }

    function parseCSV(text) {
        const expectedColumns = 11; // Sabit kolon sayısı
        const lines = text.split(/\r?\n/);
    
        const rows = [];
        let buffer = [];
        let insideQuotes = false;
        let currentCell = '';
    
        // Başlık satırını al
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
                    currentCell += '<br>'; // Hücre içindeki satır atlama: boşluk yap
                } else {
                    currentCell += char;
                }
            }
    
            // Satır bittiğinde
            if (!insideQuotes) {
                buffer.push(currentCell.trim());
                currentCell = '';
    
                while (buffer.length >= expectedColumns) {
                    const completeRow = buffer.slice(0, expectedColumns);
                    rows.push(completeRow);
                    buffer = buffer.slice(expectedColumns);
                }
            } else {
                currentCell += ' '; // Satır bitince, hücre içinde devam etmek için boşluk ekle
            }
        }
    
        return {
            headers: headers,
            rows: rows
        };
    }

    function renderTable(data) {
        const { headers, rows } = data;

        if (rows.length === 0) {
            tableContainer.innerHTML = '<p>Veri bulunamadı.</p>';
            return;
        }

        let html = '<table><thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        rows.forEach(row => {
            html += '<tr>';
            headers.forEach((_, idx) => {
                html += `<td>${row[idx] || ''}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }
});