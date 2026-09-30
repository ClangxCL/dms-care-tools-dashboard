## Purpose

Provides analytical reporting, data filtering, visualization, and record exploration for the DMS Care Tools cleaned dataset (`DMS_Care_Tools_Cleaned_Ready.xlsx`).

## ADDED Requirements

### Requirement: Dataset Ingestion and Normalization
The system SHALL ingest records from `DMS_Care_Tools_Cleaned_Ready.xlsx` upon service initialization, normalize column headers into standardized schema properties, parse timestamps and identifiers, and maintain the parsed collection in a fast queryable in-memory repository.

#### Scenario: Successful dataset loading on startup
- **WHEN** the server initializes and reads `DMS_Care_Tools_Cleaned_Ready.xlsx`
- **THEN** the system parses all valid data rows, maps Thai column headers to internal record properties (`recordedAt`, `userId`, `hospitalName`, `hospitalCode`, `cleanedPosition`, `originalPosition`, `healthRegion`, `province`, `district`, `subdistrict`, `hospitalLevel`, `affiliation`, `status`, `blockReason`), and logs the total ingested record count (~4,203 records)

#### Scenario: Resilient handling of empty or missing cells
- **WHEN** individual record cells contain empty values or undefined fields (such as empty block reason)
- **THEN** the system normalizes these fields to `null` or empty strings without throwing errors or dropping valid records

---

### Requirement: KPI Metrics and Aggregation Engine
The system SHALL calculate and expose aggregated key performance indicators (KPIs) representing both the global dataset and any actively applied filter criteria.

#### Scenario: Requesting global dashboard summary
- **WHEN** a client requests `/api/dms/summary` without filter parameters
- **THEN** the system returns:
  - Total registered users
  - Active users count and percentage
  - Blocked / inactive users count and percentage
  - Total unique healthcare facilities (`hospitalCode` / `hospitalName`)
  - Total unique health regions represented

#### Scenario: Requesting filtered KPI summary
- **WHEN** a client requests `/api/dms/summary` with active filter parameters (e.g., `healthRegion=เขต 10`)
- **THEN** the system recalculates and returns all KPI metrics scoped exclusively to the matching filtered subset

---

### Requirement: Multi-Dimensional Filtering and Search
The system SHALL support multi-dimensional filtering across health region, province, district, hospital level, position, and status, alongside case-insensitive free-text keyword search.

#### Scenario: Filtering by multiple discrete dimensions
- **WHEN** a client applies multiple filters (e.g., `healthRegion=เขต 10`, `hospitalLevel=รพช.`, `status=ปกติ / Active`)
- **THEN** the system returns only records satisfying all specified criteria (AND logic across dimensions)

#### Scenario: Free-text search across records
- **WHEN** a client provides a search query string (e.g. searching by hospital name, user ID, or role)
- **THEN** the system matches against `userId`, `hospitalName`, `hospitalCode`, `cleanedPosition`, `province`, and `district` using case-insensitive substring matching

#### Scenario: Dynamic filter option lists
- **WHEN** a client requests `/api/dms/filters`
- **THEN** the system returns sorted lists of available distinct values for health regions, provinces, hospital levels, positions, and statuses to populate frontend filter dropdowns

---

### Requirement: Visual Analytics and Distribution Charts
The system SHALL generate aggregated distribution data suitable for rendering interactive charts via Chart.js.

#### Scenario: Chart dataset aggregation
- **WHEN** a client requests `/api/dms/charts` (with optional active filters)
- **THEN** the system returns pre-aggregated series data for:
  - Health region user distribution (bar chart dataset)
  - Top 10 cleaned positions distribution (horizontal bar chart dataset)
  - Hospital level distribution (doughnut / pie chart dataset)
  - Account status breakdown (pie chart dataset)

---

### Requirement: Paginated Record Exploration
The system SHALL expose an endpoint to retrieve tabular records with pagination controls, configurable page size, and multi-field sorting.

#### Scenario: Default paginated records retrieval
- **WHEN** a client requests `/api/dms/records?page=1&limit=25`
- **THEN** the system returns the first 25 matching records, total matched record count, total pages count, and current page number

#### Scenario: Sorted records retrieval
- **WHEN** a client requests `/api/dms/records?sort=recordedAt&order=desc`
- **THEN** the system returns records ordered according to the specified field and direction

---

### Requirement: Filtered Data Export
The system SHALL allow users to export the currently filtered dataset to a downloadable CSV file formatted with UTF-8 BOM encoding for seamless viewing in spreadsheet software (e.g., Microsoft Excel).

#### Scenario: Exporting filtered results to CSV
- **WHEN** a user initiates an export request (with active filters)
- **THEN** the system generates a CSV response with `Content-Type: text/csv; charset=utf-8`, includes the UTF-8 Byte Order Mark (`\uFEFF`), and outputs all matching records with original Thai headers

#### Scenario: Exporting when zero records match
- **WHEN** an export request is triggered with filter criteria yielding no records
- **THEN** the system returns a valid CSV containing only the header row without failing

---

### Requirement: Interactive Thailand Province Map
The system SHALL render an interactive choropleth map of Thailand displaying user density across all 77 provinces with hover tooltips and a detailed breakdown side panel for the selected province.

#### Scenario: Rendering choropleth user density
- **WHEN** the dashboard loads or active filters change
- **THEN** the system colors each province according to its user volume and displays province details and user count on hover

#### Scenario: Selecting province for facility level breakdown
- **WHEN** a user clicks on a province polygon
- **THEN** the system displays the province breakdown panel containing total users, active/blocked counts, breakdown by facility level (`ระดับ รพ.`), and provides an option to filter the entire dashboard by that province

---

### Requirement: Facility Aggregation Table
The system SHALL provide an aggregated summary table grouped by facility code and name displaying the health region, province, district, facility level, and total user count with search, sorting, pagination, and CSV export.

#### Scenario: Browsing facility aggregations
- **WHEN** a user switches to the "ตารางสรุปรายหน่วยงาน" tab
- **THEN** the system displays unique facilities with total user counts, active/blocked statistics, and allows sorting by user count, facility code, name, and level

#### Scenario: Exporting facility aggregations to CSV
- **WHEN** a user clicks "ส่งออก CSV รายหน่วยงาน"
- **THEN** the system exports the facility table to a CSV file with UTF-8 BOM encoding

---

### Requirement: Cascading District and Subdistrict Filters
The system SHALL support cascading dynamic filters for District (`อำเภอ`) and Subdistrict (`ตำบล`), enabling users to drill down hierarchically from Province to District to Subdistrict while automatically recalculating all dashboard metrics.

#### Scenario: Cascading district options based on province
- **WHEN** a user selects a Province
- **THEN** the District dropdown dynamically updates to display only districts belonging to that selected province, and the Subdistrict dropdown resets

#### Scenario: Cascading subdistrict options based on district
- **WHEN** a user selects a District
- **THEN** the Subdistrict dropdown dynamically updates to display only subdistricts within that selected district

#### Scenario: Clearing parent filters
- **WHEN** a user clears or resets the Province dropdown
- **THEN** both the District and Subdistrict dropdowns are reset and disabled until a new province is chosen

---

### Requirement: Health Region Summary Table
The system SHALL provide an aggregated summary table grouped by Health Region (`เขตสุขภาพ 1 - 13`) displaying total provinces, total facilities, total users, active/blocked counts, and facility level breakdowns.

#### Scenario: Browsing health region summary
- **WHEN** a user switches to the "ตารางสรุปรายเขตสุขภาพ" tab
- **THEN** the system renders a table showing all 13 health regions with province count, facility count, user count, status breakdown bar, and facility level distribution badges

#### Scenario: Exporting health region summary to CSV
- **WHEN** a user requests `/api/dms/regions/export` or clicks export while viewing the region summary tab
- **THEN** the system returns a downloadable CSV file containing region summary metrics with UTF-8 BOM encoding

---

### Requirement: Province Summary Table
The system SHALL provide an aggregated summary table grouped by Province (`จังหวัด`) across all 77 provinces displaying the health region, total districts, total facilities, total users, active/blocked counts, and facility level breakdowns.

#### Scenario: Browsing province summary
- **WHEN** a user switches to the "ตารางสรุปรายจังหวัด" tab
- **THEN** the system renders a paginated table showing 77 provinces with district count, facility count, total users, status breakdown, and facility level badges with column sorting

#### Scenario: Exporting province summary to CSV
- **WHEN** a user requests `/api/dms/province-summary/export` or clicks export while viewing the province summary tab
- **THEN** the system returns a downloadable CSV file containing province summary metrics with UTF-8 BOM encoding

---

### Requirement: Year and Month Cascading Filters
The system SHALL extract and normalize temporal registration dimensions (`year`, `month`, `day`, `yearMonth`, `dateKey`) from `วันที่บันทึก`, and provide dynamic cascading dropdown filters for Year and Month across all dashboard endpoints.

#### Scenario: Cascading months based on selected year
- **WHEN** a user selects a Year in the filter bar
- **THEN** the Month dropdown dynamically updates to display the specific months containing registrations for that year, and all analytics reactively recompute

#### Scenario: Filtering by Year alone
- **WHEN** a user selects a Year without selecting a specific Month
- **THEN** the system scopes all KPIs, charts, maps, and tables to records registered within that entire calendar year

#### Scenario: Clearing temporal filters
- **WHEN** a user resets filters
- **THEN** the Year and Month dropdowns reset to show all available years and full month options

---

### Requirement: User Registration Trend Visualization
The system SHALL generate time-series user registration metrics and render a prominent interactive trend chart supporting adaptive granularity (Monthly vs. Daily) and dual-metric visualization (New Registrations vs. Cumulative Growth).

#### Scenario: Viewing long-term monthly registration trend
- **WHEN** the dashboard loads without month filtering
- **THEN** the system renders a continuous monthly timeline displaying new user registrations alongside cumulative total growth

#### Scenario: Viewing daily registration trend for a filtered month
- **WHEN** a user selects a specific month (e.g., Year 2024, Month 1)
- **THEN** the trend chart automatically switches to daily granularity showing registrations and cumulative progress across each day of that month

#### Scenario: Toggling trend display modes
- **WHEN** a user clicks mode toggle buttons (`Dual`, `New`, `Total`)
- **THEN** the chart dynamically switches between showing dual axes, new users only, or cumulative totals only


