## Context

The repository contains `DMS_Care_Tools_Cleaned_Ready.xlsx`, an Excel workbook with a single sheet `Dashboard_Ready` containing ~4,203 rows and 14 columns of healthcare administrative and operational user records in Thailand.
The schema consists of:
- `วันที่บันทึก` (Record timestamp)
- `รหัสผู้ใช้งาน` (User ID)
- `ชื่อหน่วยงาน` (Healthcare facility / Hospital name)
- `รหัสสถานพยาบาล` (Hospital 5-digit code)
- `ตำแหน่ง (ปรับปรุงแล้ว)` (Standardized position / role)
- `ตำแหน่งเดิม` (Original uncleaned role)
- `เขตสุขภาพ` (Health Region: เขต 1 - เขต 13)
- `จังหวัด` (Province)
- `อำเภอ` (District)
- `ตำบล` (Subdistrict)
- `ระดับสถานพยาบาล` (Hospital Level: รพศ., รพท., รพช., รพ.สต., etc.)
- `สังกัด` (Affiliation / Ministry: สป, etc.)
- `สถานะการใช้งาน` (User status: ปกติ / Active, etc.)
- `หมายเหตุการบล็อก` (Block reason / note)

This design outlines an interactive, high-performance web dashboard architecture leveraging Node.js on the backend and modern vanilla JavaScript with Chart.js on the frontend.

## Goals / Non-Goals

**Goals:**
- Provide near-instantaneous (<50ms) filtering, searching, and chart aggregation for the entire dataset (~4,203 rows).
- Implement a responsive, clean, modern executive dashboard displaying:
  - 5 Key KPI summary metric cards (Total Records, Active Users, Blocked Users, Unique Facilities, Health Regions).
  - 4 Interactive Chart.js charts (Region distribution, Top Positions, Hospital Levels, Account Status).
  - Multi-select and dropdown filters (Region, Province, Hospital Level, Position, Status) with full Thai text support.
  - Searchable, sortable, paginated data table (25 / 50 / 100 rows per page).
  - One-click CSV export with UTF-8 BOM encoding for direct opening in Microsoft Excel without character corruption.
- Provide a clean, modular Node.js backend architecture with decoupled ingestion, query engine, and HTTP route handlers.

**Non-Goals:**
- Mutating or writing back edits to the original Excel spreadsheet file (read-only analytical dashboard).
- Requiring an external database daemon (PostgreSQL, MySQL, MongoDB) — in-memory indexing is optimal for 4.2k records, lightweight, and zero-configuration.
- User management or login authentication for the dashboard in this phase (accessible directly on the local/configured port).

## Decisions

### 1. In-Memory Ingestion and Query Repository
- **Decision**: Parse `DMS_Care_Tools_Cleaned_Ready.xlsx` on server boot into an immutable array of typed JavaScript objects, indexed in an in-memory `DmsRepository`.
- **Rationale**: 4,200 records occupy less than 2 MB of memory in Node.js. In-memory array filtering (`filter`, `reduce`, `slice`) executes in single-digit milliseconds, providing instant responsiveness without database overhead or external connection latency.
- **Alternatives Considered**: SQLite database (extra native dependency/compilation required on Windows), JSON file on disk (requires manual pre-conversion step; directly parsing the `.xlsx` ensures the dashboard always reflects the latest spreadsheet).

### 2. Built-in HTTP Server with Static File Serving
- **Decision**: Implement the backend service using standard Node.js HTTP/Express framework, serving JSON REST APIs under `/api/dms/*` and static assets (HTML/CSS/JS) under `/public` or directly at `/`.
- **Rationale**: Minimal footprint, fast boot time, seamless integration with existing `package.json` ESM modules.
- **Alternatives Considered**: External Python/Streamlit process (Python was not installed on user's machine; Node.js is already configured and verified).

### 3. Frontend Architecture: Responsive Single Page with Chart.js
- **Decision**: Deliver a clean, zero-build single-page application using modern HTML5, responsive CSS (or Tailwind via CDN), and Chart.js (via CDN).
- **Rationale**: Eliminates complex frontend build tooling (Vite/Webpack), allows instant live reloading and straightforward editing, while delivering smooth animations and responsive interactivity.
- **Alternatives Considered**: React/Vue SPA build (adds heavy node_modules build toolchain unnecessary for this scope).

### 4. Thai Character Encoding and Excel CSV Export
- **Decision**: Prepend the UTF-8 Byte Order Mark (`\uFEFF`) to exported CSV streams.
- **Rationale**: Microsoft Excel on Windows defaults to local ANSI/Windows-874 encoding unless the UTF-8 BOM is present. Prepending `\uFEFF` ensures Thai characters render properly when users open the exported file in Excel.
- **Alternatives Considered**: Generating raw `.xlsx` files client-side (heavier client bundle; CSV with UTF-8 BOM is lightweight, universally compatible, and instant).

## Risks / Trade-offs

- **[Risk: Spreadsheet File Access or Path Changes]**
  → *Mitigation*: Configure the dataset file path via environment variable or default fallback to `./DMS_Care_Tools_Cleaned_Ready.xlsx`. Check file existence with clear startup diagnostic messages.
- **[Risk: Thai Text Collation and Filter Matching]**
  → *Mitigation*: Normalize text using `.trim().toLowerCase()` and Unicode normalization (`normalize('NFC')`) to guarantee exact matching across user search queries and filter options.
- **[Risk: Browser Performance on Massive Dom Rendering]**
  → *Mitigation*: Restrict data table display to server-side paginated chunks (default 25 records per page) so the DOM never contains thousands of nodes simultaneously.
