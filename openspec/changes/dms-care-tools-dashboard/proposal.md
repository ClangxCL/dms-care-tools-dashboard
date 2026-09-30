## Why

The DMS (Data Management System) Care Tools dataset (`DMS_Care_Tools_Cleaned_Ready.xlsx`) contains operational records (~4,203 rows) across healthcare staff, facilities, and regional health jurisdictions throughout Thailand. Currently, this dataset is stored in an Excel spreadsheet, making it difficult for administrators, regional coordinators, and supervisors to:
1. Quickly assess critical key performance indicators (KPIs) such as total registered users, active vs. blocked account proportions, hospital counts, and health region coverage.
2. Filter, explore, and cross-reference data dynamically by health region (`เขตสุขภาพ`), province (`จังหวัด`), hospital level (`ระดับสถานพยาบาล`), standardized position (`ตำแหน่ง (ปรับปรุงแล้ว)`), and account status (`สถานะการใช้งาน`).
3. Visualize workforce and facility distributions through clear graphical charts (e.g., regional breakdown, role concentrations, hospital tiers).
4. Inspect and search individual user records with fast pagination.
5. Export targeted subsets of data directly for field follow-up and management reporting.

Developing a dedicated, interactive web dashboard backed by a Node.js server transforms this static spreadsheet into an accessible, responsive, and decision-support analytical tool.

## What Changes

- **Data Ingestion & In-Memory Store**: Add a service to ingest and parse `DMS_Care_Tools_Cleaned_Ready.xlsx`, normalize Thai column fields, and maintain a fast in-memory query index.
- **Analytical & Query REST APIs**: Provide backend API endpoints:
  - `/api/dms/summary`: Returns summary KPI metrics (total users, active accounts, blocked accounts, unique facilities, health regions).
  - `/api/dms/filters`: Returns available unique values for filter dimensions (regions, provinces, positions, hospital levels, statuses).
  - `/api/dms/charts`: Returns aggregated distribution data for Chart.js visualizations.
  - `/api/dms/records`: Returns paginated, filtered, and searchable records.
  - `/api/dms/export`: Provides filtered data export (CSV format) with proper UTF-8 BOM encoding for Thai language support in Excel.
- **Interactive Web Dashboard Frontend**:
  - Deliver a modern, responsive single-page dashboard interface served directly by the Node.js server.
  - Display top-level KPI summary cards with key statistics and visual indicators.
  - Provide multi-select / dropdown interactive filter bars with clear/reset actions.
  - Render interactive charts powered by Chart.js (Health Region distribution, Hospital level breakdown, Position distribution, and Active/Blocked ratio).
  - Include an interactive, searchable, and sortable data table with pagination controls.
  - Offer a one-click CSV export action for currently filtered data.

## Capabilities

### New Capabilities
- `dms-dashboard`: Comprehensive analytical pipeline and web interface for DMS Care Tools data, encompassing Excel data ingestion, in-memory filtering and aggregation APIs, responsive dashboard UI with Chart.js visualizations, searchable record explorer, and CSV export.

### Modified Capabilities
<!-- None: New capability added alongside existing project services -->

## Impact

- **APIs & Routes**: Introduces new API routes under `/api/dms/*` and static asset serving for dashboard UI at `/dashboard` (and `/`).
- **Dependencies**: Introduces spreadsheet parsing capability (e.g. `xlsx` library or zero-dependency XML/zip parser) and Chart.js frontend library (via CDN or bundled script).
- **Architecture**: In-memory query engine ensures sub-50ms query and filter latency for the 4.2k record dataset without requiring an external database setup.
- **Compatibility**: Supports full UTF-8 encoding ensuring flawless rendering and export of Thai script across all browsers and Excel versions.
