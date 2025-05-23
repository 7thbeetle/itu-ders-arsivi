import os
import time
import csv
from collections import defaultdict
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# === Ayarlar ===
donem_adi = "2024 - 2025 Bahar Dönemi"  # Buraya dönemi yaz
site_url = "https://obs.itu.edu.tr/public/DersProgram"
output_dir = "OBS_DERS_PULL"
os.makedirs(output_dir, exist_ok=True)

# Havuz derslerini eklemiyor
excluded_codes = [
    "KIM 101", "KIM 101E", "KIM 102", "KIM 102E",
    "FIZ 101", "FIZ 101E", "FIZ 102", "FIZ 102E",
    "KIM 101L", "KIM 101EL", "KIM 102L", "KIM 102EL",
    "FIZ 101L", "FIZ 101EL", "FIZ 102L", "FIZ 102EL",
    "MAT 103", "MAT 103E", "MAT 104", "MAT 104E"
]

# === Selenium ayarları ===
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--window-size=1920,1080")
driver = webdriver.Chrome(service=Service(), options=chrome_options)
wait = WebDriverWait(driver, 10)

# === Text Temizleme Fonksiyonu ===
def clean_text(text):
    return text.strip().replace("\n", " / ")

# === Veri depolama ===
dersler_data = defaultdict(list)
print("veri toplama başlıyor...")
try:
    driver.get(site_url)
    time.sleep(2)

    # Lisans seçimi sadece 1 kere yapılır
    lisans_select = wait.until(EC.presence_of_element_located((By.ID, "programSeviyeTipiId")))
    driver.execute_script("arguments[0].value = 'LS';", lisans_select)
    driver.execute_script("arguments[0].dispatchEvent(new Event('change'))", lisans_select)
    time.sleep(1)

    # Tüm ders kodlarını çekiyor
    ders_select_element = wait.until(EC.presence_of_element_located((By.ID, "dersBransKoduId")))
    ders_select = Select(ders_select_element)
    ders_kodlari = [option.text.strip() for option in ders_select.options if option.get_attribute('value')]

    print(f"🔵 {len(ders_kodlari)} ders kodu bulundu. Çekilmeye başlanıyor...")

    for ders_kodu in ders_kodlari:
        try:
            # Her seçim öncesi yeniden çekiyoruz
            ders_select_element = wait.until(EC.presence_of_element_located((By.ID, "dersBransKoduId")))
            ders_select = Select(ders_select_element)

            # Ders kodunu seç
            ders_select.select_by_visible_text(ders_kodu)
            time.sleep(0.2)

            # Göster butonuna bas
            goster_buton = driver.find_element(By.CSS_SELECTOR, "button.btn-primary")
            goster_buton.click()

            # Tabloyu bekle
            time.sleep(0.5)
            try:
                table = wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
            except:
                print(f"⚠️ Tablo bulunamadı: {ders_kodu}")
                continue

            rows = table.find_elements(By.TAG_NAME, "tr")

            for row in rows[1:]:  # İlk satır başlık
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 14:
                    ders_entry = {
                        "Kod": clean_text(cells[1].text),
                        "Ders": clean_text(cells[2].text),
                        "Eğitmen": clean_text(cells[4].text),
                        "Gün": clean_text(cells[6].text),
                        "Saat": clean_text(cells[7].text),
                        "Bina": f"{clean_text(cells[5].text)} / {clean_text(cells[8].text)}",
                        "Kayıtlı": clean_text(cells[10].text),
                        "Kontenjan": clean_text(cells[9].text),
                        "Bölüm Sınırlaması": clean_text(cells[12].text),
                        "CRN": clean_text(cells[0].text),
                        "Dönem": donem_adi
                    }

                    ders_full_kod = ders_entry["Kod"]

                    if ders_full_kod in excluded_codes:
                        continue  # Excluded ise atla

                    ana_kod = ders_full_kod.split()[0]  # İlk kelime (FIZ gibi)
                    dersler_data[ana_kod].append(ders_entry)

            print(f"✅ Çekildi: {ders_kodu}")

        except Exception as e:
            print(f"🚨 Hata çekilirken: {ders_kodu} ({e})")
            continue

finally:
    driver.quit()

# === Verileri CSV'lere yazıyor ===
for ana_kod, entries in dersler_data.items():
    csv_path = os.path.join(output_dir, f"{ana_kod}.csv")
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["Kod", "Ders", "Eğitmen", "Gün", "Saat", "Bina", "Kayıtlı", "Kontenjan", "Bölüm Sınırlaması", "CRN", "Dönem"])
        writer.writeheader()
        writer.writerows(entries)

print(f"🎯 İşlem tamamlandı! CSV dosyaları '{output_dir}' klasörüne kaydedildi.")