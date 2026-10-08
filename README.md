# DMS Care Tools Interactive Analytics Dashboard

แดชบอร์ดวิเคราะห์ข้อมูลบุคลากรทางการแพทย์และสถานพยาบาล กรมการแพทย์ (DMS Care Tools) แบบ Interactive ครบวงจร พร้อมรองรับการเผยแพร่ผ่าน **GitHub Pages** (Static Web) และ Node.js Server

---

## 🌟 ฟีเจอร์เด่นของระบบ

1. **ระบบตัวกรองอัจฉริยะ 9 มิติ (Cascading Dual-Direction Filters)**:
   - ปี พ.ศ. (2567-2569) & เดือนที่ลงทะเบียน
   - เขตสุขภาพ (เขต 1 - 13)
   - จังหวัด (77 จังหวัด)
   - **อำเภอ** & **ตำบล** (เชื่อมโยงแบบ Cascading สองทิศทางอัตโนมัติ)
   - สังกัด (สป., อปท., DMS, อบจ. ฯลฯ)
   - ระดับสถานพยาบาล (รพช., รพ.สต., รพท., รพศ.)
   - หน่วยบริการ (ค้นหาด่วนแบบ Datalist)
   - ตำแหน่งงาน (จัดกลุ่ม 21 สายงาน)
   - สถานะการใช้งาน (Active vs บล็อก/เกษียณ)

2. **กราฟวิเคราะห์ข้อมูล 6 รูปแบบ (Chart.js)**:
   - กราฟแนวโน้มการสมัคร (Registration Trend: Dual/New/Total)
   - กราฟแท่งผู้ใช้งานแยกตามเขตสุขภาพ 13 เขต
   - กราฟสัดส่วนสถานะบัญชี (Active vs Inactive)
   - กราฟแท่ง 10 อันดับตำแหน่งงานสูงสุด
   - กราฟโดนัทระดับสถานพยาบาล
   - กราฟโดนัทสัดส่วนตามสังกัด

3. **วิดีโอแนะนำแดชบอร์ด (Video Overview Showcase)**:
   - วิดีโอแอนิเมชัน HD 720p วางเคียงข้างกราฟสัดส่วนตามสังกัด พร้อมปุ่มลัดข้ามตามช่วงเวลา (Chapter Shortcuts)

4. **แผนที่ประเทศไทยแบบโต้ตอบ (Leaflet GIS Heatmap)**:
   - แผนที่ 77 จังหวัด แสดงความหนาแน่นของผู้ใช้งาน พร้อมแผงรายละเอียดรายจังหวัดและปุ่มกรองข้อมูลคลิกเดียว

5. **ตารางข้อมูล 5 แท็บ & ระบบส่งออก CSV**:
   - แท็บ 1: ผู้ใช้งานรายบุคคล (4,205 รายการ)
   - แท็บ 2: ตารางสรุป 13 เขตสุขภาพ
   - แท็บ 3: ตารางสรุป 77 จังหวัด
   - แท็บ 4: ตารางสรุป 2,911 หน่วยบริการ
   - แท็บ 5: ตารางสรุปกลุ่มตำแหน่งงาน
   - ส่งออกข้อมูลเป็นไฟล์ `.csv` พร้อม UTF-8 BOM รองรับภาษาไทยบน Microsoft Excel 100%

---

## 📁 โครงสร้างโปรเจกต์สำหรับ GitHub Pages

```text
├── docs/                             # โฟลเดอร์สำหรับ Deploy ขึ้น GitHub Pages โดยตรง
│   ├── index.html                    # หน้าเว็บหลัก
│   ├── style.css                     # สไตล์ชีท
│   ├── app.js                        # สคริปต์ควบคุม UI และตัวกรอง
│   ├── dms-client-engine.js          # In-Browser Analytics Engine สำหรับโหมด Static
│   ├── dms-data.json                 # ฐานข้อมูล 4,205 รายการในรูปแบบ JSON
│   ├── thailand-provinces.geojson    # ข้อมูลพิกัดภูมิศาสตร์ 77 จังหวัดสำหรับแผนที่
│   ├── dms-dashboard-overview.mp4    # ไฟล์วิดีโอแนะนำแดชบอร์ด (HD 16s)
│   └── .nojekyll                     # ป้องกัน Jekyll ขัดขวางการโหลด GeoJSON/MP4
│
├── public/                           # โค้ดต้นฉบับฝั่ง Client
├── src/dms/                          # โค้ด Node.js Backend & Data Engine
├── test/dms/                         # ชุดทดสอบอัตโนมัติ (62 tests pass)
├── scripts/
│   ├── build-pages.js                # สคริปต์ Build แปลงข้อมูลและคัดลอกลง docs/
│   └── deploy-gh-pages.js            # สคริปต์เตรียม Deploy
├── .github/workflows/
│   └── deploy-pages.yml              # GitHub Actions Workflow สำหรับ Deploy อัตโนมัติ
└── package.json
```

---

## 🚀 ขั้นตอนการเปิดใช้งานบน GitHub Pages

เลือกวิธีที่สะดวกได้ 3 วิธี:

### วิธีที่ 1: Deploy ผ่านโฟลเดอร์ `/docs` บน Branch `main` (แนะนำที่สุด)
1. Commit และ Push โค้ดทั้งหมดขึ้น GitHub:
   ```bash
   git add docs/ .github/ package.json public/ scripts/ src/ test/
   git commit -m "feat: prepare GitHub Pages deployment"
   git push origin main
   ```
2. เปิดเบราว์เซอร์ไปที่ GitHub Repository ของคุณ ➔ ไปที่ **Settings**
3. เมนูด้านซ้ายเลือก **Pages**
4. ในหัวข้อ **Build and deployment**:
   - **Source**: เลือก `Deploy from a branch`
   - **Branch**: เลือก `main`
   - **Folder**: เลือก `/docs`
5. กดปุ่ม **Save** ➔ รอประมาณ 1-2 นาที แดชบอร์ดจะพร้อมใช้งานที่ `https://<username>.github.io/<repo>/`

---

### วิธีที่ 2: Deploy อัตโนมัติผ่าน GitHub Actions
1. ในหน้า **Settings** ➔ **Pages**
2. ในหัวข้อ **Source**: เลือก `GitHub Actions`
3. ทุกครั้งที่มีการ `git push origin main` เวิร์กโฟลว์ `.github/workflows/deploy-pages.yml` จะทำการ Build และ Deploy ให้อัตโนมัติ

---

### วิธีที่ 3: Deploy ไปยังกิ่ง (Branch) `gh-pages`
หากต้องการใช้ Branch `gh-pages` แยกต่างหาก:
```bash
git subtree push --prefix docs origin gh-pages
```
จากนั้นใน **Settings** ➔ **Pages**: เลือก Branch `gh-pages` และ Folder `/ (root)`
