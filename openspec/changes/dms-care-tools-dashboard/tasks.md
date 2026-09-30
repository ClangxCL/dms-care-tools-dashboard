## 1. Data Ingestion & Repository Layer

- [x] 1.1 Implement Excel parser utility to read `DMS_Care_Tools_Cleaned_Ready.xlsx` and extract rows from the `Dashboard_Ready` worksheet.
- [x] 1.2 Create `DmsRecord` model and normalization function mapping raw Thai columns (`วันที่บันทึก`, `รหัสผู้ใช้งาน`, `ชื่อหน่วยงาน`, etc.) into structured JavaScript objects.
- [x] 1.3 Implement `DmsRepository` with in-memory storage, indexing, and multi-dimensional filtering engine (supporting region, province, district, hospital level, position, status, and keyword search).
- [x] 1.4 Implement aggregation methods in `DmsRepository` for calculating KPI summaries and chart distribution series.

## 2. Backend REST API Endpoints

- [x] 2.1 Create HTTP server / router setup serving API endpoints under `/api/dms/*` and static frontend files.
- [x] 2.2 Implement `GET /api/dms/summary` endpoint returning overall and filtered KPI statistics (total users, active/blocked counts, facility count, region count).
- [x] 2.3 Implement `GET /api/dms/filters` endpoint returning available distinct filter values for dropdowns.
- [x] 2.4 Implement `GET /api/dms/charts` endpoint returning grouped distribution datasets for Chart.js.
- [x] 2.5 Implement `GET /api/dms/records` endpoint with pagination (`page`, `limit`), sorting, and filter query parameters.
- [x] 2.6 Implement `GET /api/dms/export` endpoint generating UTF-8 BOM encoded CSV downloads of filtered datasets.

## 3. Web Dashboard Frontend & Layout

- [x] 3.1 Create responsive dashboard HTML layout (`index.html`) featuring a navigation header, KPI stats bar, filter control panel, charts grid, and data table section.
- [x] 3.2 Implement filter controls (dropdown selects for Health Region, Hospital Level, Position, Status, and a free-text search input with debounce) along with Reset Filters action.
- [x] 3.3 Style the dashboard with clean, modern CSS ensuring responsiveness across desktop and mobile screens.

## 4. Visual Analytics & KPI Cards

- [x] 4.1 Integrate Chart.js and implement reactive chart renderers:
  - Bar chart: User counts across Health Regions (`เขตสุขภาพ 1 - 13`).
  - Doughnut chart: Hospital Level distribution (`รพศ.`, `รพท.`, `รพช.`, `รพ.สต.`, etc.).
  - Horizontal bar chart: Top 10 standardized positions (`ตำแหน่ง (ปรับปรุงแล้ว)`).
  - Pie / Doughnut chart: Active vs. Blocked account status ratio.
- [x] 4.2 Implement KPI summary card updates displaying total users, active accounts %, blocked accounts %, total facilities, and health regions covered with dynamic counter transitions.

## 5. Paginated Data Table & CSV Export

- [x] 5.1 Implement interactive data table with column headers, formatted Thai timestamps, badges for account status, and empty-state handling.
- [x] 5.2 Add pagination controls (Previous, Next, Page Numbers, Rows Per Page selector) wired to the `/api/dms/records` endpoint.
- [x] 5.3 Implement Export to CSV button triggering filtered download with UTF-8 BOM encoding for Excel compatibility.

## 6. Verification & Testing

- [x] 6.1 Create unit tests for Excel parsing and data normalization verifying all ~4,203 rows load accurately.
- [x] 6.2 Create unit tests for `DmsRepository` filtering, search queries, pagination, and aggregation calculations.
- [x] 6.3 Create API route integration tests validating endpoint responses, filter parameters, and CSV export headers.
- [x] 6.4 Perform end-to-end smoke test launching the server, loading the dashboard in a browser, testing filters, and validating chart updates.

## 7. Interactive Thailand Map Visualization

- [x] 7.1 Acquire and serve local GeoJSON boundary data covering all 77 provinces (`public/thailand-provinces.geojson`).
- [x] 7.2 Implement `getProvinceAnalytics()` repository method computing per-province user counts and facility level breakdown.
- [x] 7.3 Implement `GET /api/dms/provinces` endpoint returning province analytics with filter parameters support.
- [x] 7.4 Integrate Leaflet map with custom choropleth color scale (0 to 201+ users) and responsive hover tooltips.
- [x] 7.5 Create Province Detail breakdown panel displaying total users, active/blocked counts, facility level distribution bars, and filter-by-province action.

## 8. Facility Aggregation Table (ตารางสรุปรายหน่วยงาน)

- [x] 8.1 Implement `getFacilityAggregations()` repository method grouping records by facility code & name with pagination, sorting, and search.
- [x] 8.2 Implement `GET /api/dms/facilities` and `GET /api/dms/facilities/export` endpoints.
- [x] 8.3 Add Tab Switcher in frontend UI toggling between Individual Users and Facility Aggregation views.
- [x] 8.4 Implement facility table view with required columns (Facility Code, Facility Name, Health Region, Province, District, Facility Level, User Count).
- [x] 8.5 Support sorting, pagination, and dedicated CSV export with UTF-8 BOM encoding for the facility summary table.
- [x] 8.6 Add unit and integration tests covering province analytics and facility table aggregations (74/74 tests passing).

## 9. Cascading District & Subdistrict Filters

- [x] 9.1 Add District (`อำเภอ`) and Subdistrict (`ตำบล`) dropdown filters to the filter control panel.
- [x] 9.2 Implement backend cascading query support in `getDistinctFilterValues({ province, district, healthRegion })` and `/api/dms/filters`.
- [x] 9.3 Implement frontend cascading logic dynamically updating and enabling/disabling District and Subdistrict dropdowns upon selection.
- [x] 9.4 Ensure KPIs, charts, map choropleth, and all table views reactively re-render when District and Subdistrict filters change.

## 10. Health Region & Province Summary Tables

- [x] 10.1 Implement `getRegionAggregations()` in repository returning province count, facility count, user count, active/blocked counts, and facility level breakdowns for all 13 health regions.
- [x] 10.2 Implement `GET /api/dms/regions` and `GET /api/dms/regions/export` with UTF-8 BOM CSV support.
- [x] 10.3 Implement `getProvinceAggregations()` in repository returning health region, district count, facility count, user count, active/blocked counts, and facility level breakdowns for 77 provinces.
- [x] 10.4 Implement `GET /api/dms/province-summary` and `GET /api/dms/province-summary/export` with UTF-8 BOM CSV support.
- [x] 10.5 Implement 4-tab UI switcher (`users`, `regions`, `provinces`, `facilities`) with independent sorting, pagination, counter pills, and dynamic export routing.
- [x] 10.6 Add unit and integration test coverage for all new aggregation, cascading, and export features (86/86 tests passing).

## 11. Year & Month Filters (ตัวกรอง ปี และ เดือน)

- [x] 11.1 Parse registration timestamp (`วันที่บันทึก`) in `DmsRecord` extracting year, month, day, yearMonth, and dateKey.
- [x] 11.2 Support `year`, `month`, and `yearMonth` filtering in `DmsRepository.filter()`.
- [x] 11.3 Implement cascading distinct values in `getDistinctFilterValues({ year })` dynamically returning available years (2024 - 2026) and scoped months.
- [x] 11.4 Expose year/month filtering in REST API (`extractFilterParams`).
- [x] 11.5 Add Year (`ปี`) and Month (`เดือน`) dropdowns to frontend filter grid with Thai labels (พ.ศ. / ค.ศ. and Thai month names).
- [x] 11.6 Wire cascading event handlers in `app.js` reactively refreshing KPIs, charts, maps, and tables upon Year/Month selection.

## 12. User Registration Trend Chart (กราฟแนวโน้มการสมัครใช้งาน)

- [x] 12.1 Implement `getRegistrationTrendData` in `DmsRepository` with adaptive temporal granularity (Monthly for full range or year; Daily for specific month).
- [x] 12.2 Return `registrationTrend` series in `GET /api/dms/charts` with timeline labels, full Thai labels, new registrations, and cumulative totals.
- [x] 12.3 Add prominent full-width chart card in frontend analytics section matching dark glassmorphic design theme.
- [x] 12.4 Render Chart.js line/area chart with smooth tension curves, gradient fill, and dual Y-axes (New Registrations vs. Cumulative).
- [x] 12.5 Add interactive view mode toggle segmented buttons (`ทั้งคู่ (Dual)`, `เฉพาะรายงวด (New)`, `เฉพาะยอดสะสม (Total)`).
- [x] 12.6 Add rich tooltips displaying exact date/month, Thai format, new users count, and cumulative growth.
- [x] 12.7 Implement unit and integration tests covering temporal parsing, cascading filters, and trend aggregations (96/96 tests passing).

