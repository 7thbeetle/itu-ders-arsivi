from flask import Flask, render_template, request
import pandas as pd
import os
import re

app = Flask(__name__)
csv_root = "csv_klasorleri_donem_bazli"

def term_sort_key(term):
    # Örnek dönem: '2024 - 2025 Bahar Dönemi'
    match = re.search(r'(\d{4})', term)
    if not match:
        return (0, 0)
    
    year = int(match.group(1))
    
    # Dönem tipi skorları
    if 'Yaz' in term:
        season_score = 3
    elif 'Bahar' in term:
        season_score = 2
    elif 'Güz' in term:
        season_score = 1
    else:
        season_score = 0
    
    return (-year, -season_score)  # Büyükten küçüğe sıralamak için ters işaret

@app.route("/", methods=["GET", "POST"])
def index():
    selected_term = None
    selected_course = None
    table_html = None

    # Dönemleri oku
    terms = [folder for folder in os.listdir(csv_root) if os.path.isdir(os.path.join(csv_root, folder))]
    terms.sort(key=term_sort_key)

    courses = []

    if request.method == "POST":
        selected_term = request.form.get("term")
        selected_course = request.form.get("course")

        if selected_term:
            term_path = os.path.join(csv_root, selected_term)
            courses = [file.replace(".csv", "") for file in os.listdir(term_path) if file.endswith(".csv")]
            courses.sort()  # Ders kodlarını alfabetik sırala

        if selected_term and selected_course:
            csv_path = os.path.join(csv_root, selected_term, selected_course + ".csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                table_html = df.to_html(classes="table table-striped", index=False)

    return render_template("index.html", terms=terms, courses=courses, selected_term=selected_term, selected_course=selected_course, table_html=table_html)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host="0.0.0.0", port=port)