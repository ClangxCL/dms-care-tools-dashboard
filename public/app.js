/**
 * DMS Care Tools Interactive Analytics Dashboard Frontend
 * Enhanced with Cascading District/Subdistrict Filters, Region Summary Table, and Province Summary Table
 */

// Application State
const state = {
  activeTab: 'users', // 'users' | 'regions' | 'provinces' | 'facilities' | 'positions'
  filters: {
    healthRegion: '',
    province: '',
    district: '',
    subdistrict: '',
    affiliation: '',
    facility: '',
    hospitalLevel: '',
    cleanedPosition: '',
    status: '',
    year: '',
    month: '',
    q: '',
  },
  trendMode: 'both', // 'both' | 'new' | 'cumulative'
  trendData: null,
  pagination: {
    users: {
      page: 1,
      limit: 25,
      sort: 'recordedAt',
      order: 'desc',
      total: 0,
      totalPages: 1,
    },
    regions: {
      page: 1,
      limit: 25,
      sort: 'healthRegion',
      order: 'asc',
      total: 0,
      totalPages: 1,
    },
    provinces: {
      page: 1,
      limit: 25,
      sort: 'totalUsers',
      order: 'desc',
      total: 0,
      totalPages: 1,
    },
    facilities: {
      page: 1,
      limit: 25,
      sort: 'userCount',
      order: 'desc',
      total: 0,
      totalPages: 1,
    },
    positions: {
      page: 1,
      limit: 25,
      sort: 'totalUsers',
      order: 'desc',
      total: 0,
      totalPages: 1,
    },
  },
  charts: {
    trend: null,
    regions: null,
    levels: null,
    positions: null,
    affiliations: null,
    status: null,
  },
  map: {
    leafletInstance: null,
    geoJsonLayer: null,
    geoData: null,
    provinceAnalytics: null,
    selectedProvince: null,
  },
  searchDebounceTimer: null,
  facilityDebounceTimer: null,
};

// DOM Elements
const elements = {
  // KPIs
  kpiTotalUsers: document.getElementById('kpiTotalUsers'),
  kpiTotalUsersSub: document.getElementById('kpiTotalUsersSub'),
  kpiActiveUsers: document.getElementById('kpiActiveUsers'),
  kpiActivePct: document.getElementById('kpiActivePct'),
  kpiBlockedUsers: document.getElementById('kpiBlockedUsers'),
  kpiBlockedPct: document.getElementById('kpiBlockedPct'),
  kpiFacilities: document.getElementById('kpiFacilities'),
  kpiFacilitiesSub: document.getElementById('kpiFacilitiesSub'),
  kpiRegions: document.getElementById('kpiRegions'),
  kpiProvincesSub: document.getElementById('kpiProvincesSub'),

  // Filters
  searchQuery: document.getElementById('searchQuery'),
  yearFilter: document.getElementById('yearFilter'),
  monthFilter: document.getElementById('monthFilter'),
  regionFilter: document.getElementById('regionFilter'),
  provinceFilter: document.getElementById('provinceFilter'),
  districtFilter: document.getElementById('districtFilter'),
  subdistrictFilter: document.getElementById('subdistrictFilter'),
  affiliationFilter: document.getElementById('affiliationFilter'),
  levelFilter: document.getElementById('levelFilter'),
  facilityFilter: document.getElementById('facilityFilter'),
  facilityDatalist: document.getElementById('facilityDatalist'),
  positionFilter: document.getElementById('positionFilter'),
  statusFilter: document.getElementById('statusFilter'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  exportBtn: document.getElementById('exportBtn'),
  exportBtnText: document.getElementById('exportBtnText'),

  // Trend Chart Elements
  trendChart: document.getElementById('trendChart'),
  trendChartTitle: document.getElementById('trendChartTitle'),
  trendChartSubtitle: document.getElementById('trendChartSubtitle'),
  trendModeBoth: document.getElementById('trendModeBoth'),
  trendModeNew: document.getElementById('trendModeNew'),
  trendModeCumulative: document.getElementById('trendModeCumulative'),

  // Chart Canvas Elements
  affiliationsChart: document.getElementById('affiliationsChart'),

  // Map elements
  thailandMap: document.getElementById('thailandMap'),
  panelPlaceholder: document.getElementById('panelPlaceholder'),
  panelActiveContent: document.getElementById('panelActiveContent'),
  panelRegionBadge: document.getElementById('panelRegionBadge'),
  panelProvinceName: document.getElementById('panelProvinceName'),
  panelProvinceEn: document.getElementById('panelProvinceEn'),
  panelTotalUsers: document.getElementById('panelTotalUsers'),
  panelActiveUsers: document.getElementById('panelActiveUsers'),
  panelBlockedUsers: document.getElementById('panelBlockedUsers'),
  panelLevelList: document.getElementById('panelLevelList'),
  panelFilterActionBtn: document.getElementById('panelFilterActionBtn'),
  panelClearBtn: document.getElementById('panelClearBtn'),

  // Tabs & Tables
  tabUsersBtn: document.getElementById('tabUsersBtn'),
  tabRegionsBtn: document.getElementById('tabRegionsBtn'),
  tabProvincesBtn: document.getElementById('tabProvincesBtn'),
  tabFacilitiesBtn: document.getElementById('tabFacilitiesBtn'),
  tabPositionsBtn: document.getElementById('tabPositionsBtn'),
  regionCountPill: document.getElementById('regionCountPill'),
  provinceCountPill: document.getElementById('provinceCountPill'),
  facilityCountPill: document.getElementById('facilityCountPill'),
  positionCountPill: document.getElementById('positionCountPill'),

  usersTableWrapper: document.getElementById('usersTableWrapper'),
  regionsTableWrapper: document.getElementById('regionsTableWrapper'),
  provincesTableWrapper: document.getElementById('provincesTableWrapper'),
  facilitiesTableWrapper: document.getElementById('facilitiesTableWrapper'),
  positionsTableWrapper: document.getElementById('positionsTableWrapper'),

  tableRecordCount: document.getElementById('tableRecordCount'),
  recordsTableBody: document.getElementById('recordsTableBody'),
  regionsTableBody: document.getElementById('regionsTableBody'),
  provincesTableBody: document.getElementById('provincesTableBody'),
  facilitiesTableBody: document.getElementById('facilitiesTableBody'),
  positionsTableBody: document.getElementById('positionsTableBody'),

  limitSelect: document.getElementById('limitSelect'),
  paginationInfo: document.getElementById('paginationInfo'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageNumbers: document.getElementById('pageNumbers'),

  usersTableHeaders: document.querySelectorAll('#usersTable thead th'),
  regionsTableHeaders: document.querySelectorAll('#regionsTable thead th'),
  provincesTableHeaders: document.querySelectorAll('#provincesTable thead th'),
  facilitiesTableHeaders: document.querySelectorAll('#facilitiesTable thead th'),
  positionsTableHeaders: document.querySelectorAll('#positionsTable thead th'),
};

// Utilities
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('th-TH').format(num);
}

function buildQueryString(extra = {}) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(state.filters)) {
    if (val) params.set(key, val);
  }
  for (const [key, val] of Object.entries(extra)) {
    if (val !== undefined && val !== null) params.set(key, val);
  }
  return params.toString();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAssetUrl(filename) {
  if (typeof window === 'undefined' || !window.location) return filename;
  if (window.location.protocol === 'file:') return filename;
  let path = window.location.pathname || '';
  if (!path.endsWith('/') && !path.includes('.')) {
    path = path + '/';
  }
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  return `${window.location.origin}${dir}${filename}`;
}

/* ==================================================== */
/* UNIFIED DUAL-MODE DATA LAYER (NODE SERVER / GH-PAGES)*/
/* ==================================================== */
const dmsApi = {
  isStaticMode: false,
  clientRepo: null,

  async init() {
    const isGithub = window.location.hostname.endsWith('github.io');
    const isFile = window.location.protocol === 'file:';
    if (isGithub || isFile) {
      await this.initStaticMode();
      return;
    }

    try {
      const probe = await fetch('/api/dms/summary', { method: 'GET' });
      if (!probe.ok) {
        await this.initStaticMode();
      }
    } catch (e) {
      await this.initStaticMode();
    }
  },

  async initStaticMode() {
    this.isStaticMode = true;
    console.log('[DMS Dashboard] Initializing Client-Side In-Memory Engine (GitHub Pages mode)...');
    try {
      const url = getAssetUrl('dms-data.json');
      console.log(`[DMS Dashboard] Fetching dataset from: ${url}`);
      let res = await fetch(url);
      if (!res.ok) {
        console.warn(`[DMS Dashboard] Primary fetch failed (${res.status}), trying relative fetch...`);
        res = await fetch('dms-data.json');
      }
      if (!res.ok) throw new Error(`Could not load dms-data.json (HTTP ${res.status})`);
      const records = await res.json();
      const RepoClass = window.DmsClientRepository || globalThis.DmsClientRepository;
      if (RepoClass) {
        this.clientRepo = new RepoClass(records);
        console.log(`[DMS Dashboard] Client Engine loaded ${records.length} records in memory!`);
      } else {
        throw new Error('DmsClientRepository is not defined on window/globalThis');
      }
    } catch (err) {
      console.error('[DMS Dashboard] Failed to load static dataset:', err);
    }
  },

  async getFilters(context = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getDistinctFilterValues(context);
    }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(context)) {
      if (v) params.set(k, v);
    }
    const q = params.toString();
    const res = await fetch(`/api/dms/filters${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getSummary(filters = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getSummary(filters);
    }
    const q = buildQueryString(filters);
    const res = await fetch(`/api/dms/summary${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getCharts(filters = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getChartsData(filters);
    }
    const q = buildQueryString(filters);
    const res = await fetch(`/api/dms/charts${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getProvinces(filters = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getProvinceAnalytics(filters);
    }
    const q = buildQueryString(filters);
    const res = await fetch(`/api/dms/provinces${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getRecords(options = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getPaginatedRecords(options);
    }
    const q = buildQueryString({
      page: options.page,
      limit: options.limit,
      sort: options.sort,
      order: options.order,
      ...options.filters,
    });
    const res = await fetch(`/api/dms/records${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getRegions(options = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getRegionAggregations(options);
    }
    const q = buildQueryString({
      page: options.page,
      limit: options.limit,
      sort: options.sort,
      order: options.order,
      ...options.filters,
    });
    const res = await fetch(`/api/dms/regions${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getProvinceSummary(options = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getProvinceAggregations(options);
    }
    const q = buildQueryString({
      page: options.page,
      limit: options.limit,
      sort: options.sort,
      order: options.order,
      ...options.filters,
    });
    const res = await fetch(`/api/dms/province-summary${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getFacilities(options = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getFacilityAggregations(options);
    }
    const q = buildQueryString({
      page: options.page,
      limit: options.limit,
      sort: options.sort,
      order: options.order,
      ...options.filters,
    });
    const res = await fetch(`/api/dms/facilities${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  async getPositions(options = {}) {
    if (this.isStaticMode && this.clientRepo) {
      return this.clientRepo.getPositionAggregations(options);
    }
    const q = buildQueryString({
      page: options.page,
      limit: options.limit,
      sort: options.sort,
      order: options.order,
      ...options.filters,
    });
    const res = await fetch(`/api/dms/positions${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },

  exportCsv(type, filters = {}) {
    if (this.isStaticMode && this.clientRepo) {
      const now = new Date().toISOString().slice(0, 10);
      let csvContent = '';
      let filename = `dms_export_${now}.csv`;
      if (type === 'users') {
        csvContent = this.clientRepo.toCsv(filters);
        filename = `dms_records_${now}.csv`;
      } else if (type === 'regions') {
        csvContent = this.clientRepo.toRegionCsv(filters);
        filename = `dms_regions_${now}.csv`;
      } else if (type === 'provinces') {
        csvContent = this.clientRepo.toProvinceCsv(filters);
        filename = `dms_provinces_${now}.csv`;
      } else if (type === 'facilities') {
        csvContent = this.clientRepo.toFacilityCsv(filters);
        filename = `dms_facilities_${now}.csv`;
      } else if (type === 'positions') {
        csvContent = this.clientRepo.toPositionCsv(filters);
        filename = `dms_positions_${now}.csv`;
      }
      this.triggerDownload(csvContent, filename);
      return;
    }

    const q = buildQueryString(filters);
    let endpoint = '/api/dms/export';
    if (type === 'regions') endpoint = '/api/dms/regions/export';
    else if (type === 'provinces') endpoint = '/api/dms/province-summary/export';
    else if (type === 'facilities') endpoint = '/api/dms/facilities/export';
    else if (type === 'positions') endpoint = '/api/dms/positions/export';
    window.location.href = `${endpoint}${q ? '?' + q : ''}`;
  },

  triggerDownload(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

/* ==================================================== */
/* 1. FILTER OPTIONS & CASCADING LOGIC                  */
/* ==================================================== */

const THAI_MONTHS_SELECT = [
  '',
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

async function loadFilterOptions() {
  try {
    const data = await dmsApi.getFilters();

    populateYearSelect(data.years);
    populateMonthSelect(data.months);
    populateSelect(elements.regionFilter, data.healthRegions, 'ทั้งหมด (ทุกเขตสุขภาพ)');
    populateSelect(elements.provinceFilter, data.provinces, 'ทั้งหมด (ทุกจังหวัด)');
    populateSelect(elements.districtFilter, data.districts, 'ทั้งหมด (ทุกอำเภอ)');
    populateSelect(elements.subdistrictFilter, data.subdistricts, 'ทั้งหมด (ทุกตำบล)');
    populateSelect(elements.affiliationFilter, data.affiliations, 'ทั้งหมด (ทุกสังกัด)');
    populateSelect(elements.levelFilter, data.hospitalLevels, 'ทั้งหมด (ทุกระดับ)');
    populateSelect(elements.positionFilter, data.positions, 'ทั้งหมด (ทุกตำแหน่ง)');
    populateSelect(elements.statusFilter, data.statuses, 'ทั้งหมด (ทุกสถานะ)');
    populateFacilityDatalist(data.facilities);

    elements.districtFilter.disabled = false;
    elements.subdistrictFilter.disabled = false;
  } catch (err) {
    console.error('Error loading filter options:', err);
  }
}

function populateFacilityDatalist(facilities) {
  if (!elements.facilityDatalist) return;
  elements.facilityDatalist.innerHTML = '';
  if (Array.isArray(facilities)) {
    facilities.slice(0, 1000).forEach((fac) => {
      const opt = document.createElement('option');
      opt.value = fac.displayName || fac.name;
      elements.facilityDatalist.appendChild(opt);
    });
  }
}

async function updateFacilityDatalist() {
  try {
    const data = await dmsApi.getFilters({
      healthRegion: state.filters.healthRegion,
      province: state.filters.province,
      district: state.filters.district,
      affiliation: state.filters.affiliation,
    });
    if (data && data.facilities) {
      populateFacilityDatalist(data.facilities);
    }
  } catch (err) {
    console.error('Error updating facility datalist:', err);
  }
}

async function loadProvincesForRegion(healthRegion) {
  if (!elements.provinceFilter) return;
  try {
    const data = await dmsApi.getFilters({ healthRegion });
    if (data && data.provinces) {
      populateSelect(elements.provinceFilter, data.provinces, 'ทั้งหมด (ทุกจังหวัด)');
    }
  } catch (err) {
    console.error('Error loading provinces for region:', err);
  }
}

function populateYearSelect(years) {
  if (!elements.yearFilter) return;
  const currentVal = elements.yearFilter.value;
  elements.yearFilter.innerHTML = '<option value="">ทุกปี (ทั้งหมด)</option>';
  if (Array.isArray(years)) {
    years.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y > 2400 ? `พ.ศ. ${y}` : `พ.ศ. ${y + 543} (ค.ศ. ${y})`;
      elements.yearFilter.appendChild(opt);
    });
  }
  const unspecOpt = document.createElement('option');
  unspecOpt.value = 'unspecified';
  unspecOpt.textContent = 'ไม่ระบุปี (Missing)';
  elements.yearFilter.appendChild(unspecOpt);

  if (currentVal && ((years && years.map(String).includes(String(currentVal))) || currentVal === 'unspecified')) {
    elements.yearFilter.value = currentVal;
  }
}

function populateMonthSelect(months) {
  if (!elements.monthFilter) return;
  const currentVal = elements.monthFilter.value;
  elements.monthFilter.innerHTML = '<option value="">ทุกเดือน (ทั้งหมด)</option>';
  if (Array.isArray(months)) {
    months.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      const pad = String(m).padStart(2, '0');
      const name = THAI_MONTHS_SELECT[m] || '';
      opt.textContent = `${pad} - ${name}`;
      elements.monthFilter.appendChild(opt);
    });
  }
  if (currentVal && months && months.map(String).includes(String(currentVal))) {
    elements.monthFilter.value = currentVal;
  }
}

async function loadMonthsForYear(year) {
  if (!elements.monthFilter) return;
  try {
    const data = await dmsApi.getFilters({ year });
    populateMonthSelect((data && data.months) || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  } catch (err) {
    console.error('Error loading months for year:', err);
    populateMonthSelect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  }
}

function populateSelect(selectEl, items, defaultLabel) {
  if (!selectEl) return;
  const currentVal = selectEl.value;
  selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
  if (Array.isArray(items)) {
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      selectEl.appendChild(opt);
    });
  }
  if (currentVal && items && items.includes(currentVal)) {
    selectEl.value = currentVal;
  }
}

/**
 * Synchronizes Region, Province, District, and Subdistrict dropdowns
 * based on current state.filters. Always keeps District and Subdistrict accessible!
 */
async function syncGeoFilters(trigger) {
  try {
    const data = await dmsApi.getFilters({
      healthRegion: state.filters.healthRegion,
      province: state.filters.province,
      district: state.filters.district,
      subdistrict: state.filters.subdistrict,
    });

    if (trigger === 'region') {
      populateSelect(elements.provinceFilter, data.provinces, 'ทั้งหมด (ทุกจังหวัด)');
      populateSelect(elements.districtFilter, data.districts, 'ทั้งหมด (ทุกอำเภอ)');
      populateSelect(elements.subdistrictFilter, data.subdistricts, 'ทั้งหมด (ทุกตำบล)');
    } else if (trigger === 'province') {
      populateSelect(elements.districtFilter, data.districts, 'ทั้งหมด (ทุกอำเภอ)');
      populateSelect(elements.subdistrictFilter, data.subdistricts, 'ทั้งหมด (ทุกตำบล)');

      if (!state.filters.healthRegion && data.healthRegions && data.healthRegions.length === 1) {
        state.filters.healthRegion = data.healthRegions[0];
        elements.regionFilter.value = data.healthRegions[0];
      }
    } else if (trigger === 'district') {
      populateSelect(elements.subdistrictFilter, data.subdistricts, 'ทั้งหมด (ทุกตำบล)');

      if (!state.filters.province && data.provinces && data.provinces.length === 1) {
        state.filters.province = data.provinces[0];
        elements.provinceFilter.value = data.provinces[0];
        selectProvince(data.provinces[0]);
      }
      if (!state.filters.healthRegion && data.healthRegions && data.healthRegions.length === 1) {
        state.filters.healthRegion = data.healthRegions[0];
        elements.regionFilter.value = data.healthRegions[0];
      }
    } else if (trigger === 'subdistrict') {
      if (!state.filters.district && data.districts && data.districts.length === 1) {
        state.filters.district = data.districts[0];
        elements.districtFilter.value = data.districts[0];
      }
      if (!state.filters.province && data.provinces && data.provinces.length === 1) {
        state.filters.province = data.provinces[0];
        elements.provinceFilter.value = data.provinces[0];
        selectProvince(data.provinces[0]);
      }
      if (!state.filters.healthRegion && data.healthRegions && data.healthRegions.length === 1) {
        state.filters.healthRegion = data.healthRegions[0];
        elements.regionFilter.value = data.healthRegions[0];
      }
    } else {
      populateSelect(elements.regionFilter, data.healthRegions, 'ทั้งหมด (ทุกเขตสุขภาพ)');
      populateSelect(elements.provinceFilter, data.provinces, 'ทั้งหมด (ทุกจังหวัด)');
      populateSelect(elements.districtFilter, data.districts, 'ทั้งหมด (ทุกอำเภอ)');
      populateSelect(elements.subdistrictFilter, data.subdistricts, 'ทั้งหมด (ทุกตำบล)');
    }

    elements.districtFilter.disabled = false;
    elements.subdistrictFilter.disabled = false;
  } catch (err) {
    console.error('Error syncing geo filters:', err);
    elements.districtFilter.disabled = false;
    elements.subdistrictFilter.disabled = false;
  }
}

// Backward-compatible cascading aliases
async function loadDistrictsForProvince(province) {
  state.filters.province = province || '';
  await syncGeoFilters('province');
}

async function loadSubdistrictsForDistrict(province, district) {
  state.filters.province = province || '';
  state.filters.district = district || '';
  await syncGeoFilters('district');
}

/* ==================================================== */
/* 2. KPI SUMMARY                                       */
/* ==================================================== */

async function loadKpiSummary() {
  try {
    const summary = await dmsApi.getSummary(state.filters);

    elements.kpiTotalUsers.textContent = formatNumber(summary.totalUsers);
    elements.kpiActiveUsers.textContent = formatNumber(summary.activeUsers);
    elements.kpiActivePct.textContent = `${summary.activePercentage}% ของผู้ใช้งานทั้งหมด`;

    elements.kpiBlockedUsers.textContent = formatNumber(summary.blockedUsers);
    elements.kpiBlockedPct.textContent = `${summary.blockedPercentage}% บล็อก/เกษียณ`;

    elements.kpiFacilities.textContent = formatNumber(summary.uniqueFacilities);
    elements.kpiFacilitiesSub.textContent = `จาก ${summary.uniqueProvinces} จังหวัด`;
    elements.facilityCountPill.textContent = formatNumber(summary.uniqueFacilities);

    elements.kpiRegions.textContent = `${summary.uniqueHealthRegions} เขต`;
    elements.kpiProvincesSub.textContent = `ครอบคลุม ${summary.uniqueProvinces} จังหวัด`;
    elements.regionCountPill.textContent = `${summary.uniqueHealthRegions} เขต`;
    elements.provinceCountPill.textContent = `${summary.uniqueProvinces} จว.`;
  } catch (err) {
    console.error('Error loading summary:', err);
  }
}

/* ==================================================== */
/* 3. INTERACTIVE THAILAND MAP                          */
/* ==================================================== */

function getProvinceColor(count) {
  if (!count || count <= 0) return '#1e293b';
  if (count <= 25) return '#1e3a8a';
  if (count <= 50) return '#2563eb';
  if (count <= 100) return '#0284c7';
  if (count <= 150) return '#06b6d4';
  if (count <= 200) return '#10b981';
  return '#f59e0b';
}

async function initThailandMap() {
  if (state.map.leafletInstance) return;

  try {
    if (typeof L === 'undefined') {
      console.warn('[DMS Dashboard] Leaflet is not available, skipping map initialization.');
      return;
    }

    const map = L.map('thailandMap', {
      center: [13.736717, 100.523186],
      zoom: 6,
      minZoom: 5,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    state.map.leafletInstance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      opacity: 0.35,
      subdomains: 'abcd',
    }).addTo(map);

    let res = await fetch(getAssetUrl('thailand-provinces.geojson'));
    if (!res.ok) {
      res = await fetch('thailand-provinces.geojson');
    }
    if (!res.ok) throw new Error('Failed to load GeoJSON');
    const geoData = await res.json();
    state.map.geoData = geoData;

    await updateMapAnalytics();
  } catch (err) {
    console.error('Error initializing Thailand map:', err);
  }
}

async function updateMapAnalytics() {
  if (!state.map.leafletInstance || !state.map.geoData) return;

  try {
    const data = await dmsApi.getProvinces(state.filters);
    state.map.provinceAnalytics = (data && data.provinces) || {};

    if (state.map.geoJsonLayer) {
      state.map.leafletInstance.removeLayer(state.map.geoJsonLayer);
    }

    state.map.geoJsonLayer = L.geoJSON(state.map.geoData, {
      style: (feature) => {
        const provName = feature.properties.pro_th.trim();
        const pData = state.map.provinceAnalytics[provName];
        const count = pData ? pData.totalUsers : 0;
        const isSelected = state.map.selectedProvince === provName;

        return {
          fillColor: getProvinceColor(count),
          weight: isSelected ? 3 : 1.2,
          opacity: 1,
          color: isSelected ? '#ffffff' : '#334155',
          fillOpacity: isSelected ? 0.95 : 0.75,
        };
      },
      onEachFeature: (feature, layer) => {
        const provName = feature.properties.pro_th.trim();
        const provEn = feature.properties.pro_en || '';
        const pData = state.map.provinceAnalytics[provName];
        const count = pData ? pData.totalUsers : 0;
        const region = pData && pData.healthRegion ? pData.healthRegion : '';

        const tooltipHtml = `
          <strong>${provName}</strong> (${provEn})<br/>
          <span style="color: #60a5fa; font-weight: 600;">${formatNumber(count)} คน</span>
          ${region ? `<br/><span style="color: #94a3b8; font-size: 0.75rem;">${region}</span>` : ''}
        `;
        layer.bindTooltip(tooltipHtml, {
          sticky: true,
          className: 'dms-map-tooltip',
        });

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#60a5fa',
              fillOpacity: 0.9,
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            state.map.geoJsonLayer.resetStyle(e.target);
            if (state.map.selectedProvince === provName) {
              e.target.setStyle({
                weight: 3,
                color: '#ffffff',
                fillOpacity: 0.95,
              });
            }
          },
          click: async () => {
            selectProvince(provName, provEn);
            state.filters.province = provName;
            elements.provinceFilter.value = provName;
            state.filters.district = '';
            state.filters.subdistrict = '';
            elements.districtFilter.value = '';
            elements.subdistrictFilter.value = '';
            Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
            await syncGeoFilters('province');
            await updateFacilityDatalist();
            refreshAll();
          },
        });
      },
    }).addTo(state.map.leafletInstance);

    if (state.map.selectedProvince) {
      renderProvinceDetail(state.map.selectedProvince);
    }
  } catch (err) {
    console.error('Error updating map analytics:', err);
  }
}

function selectProvince(provName, provEn) {
  state.map.selectedProvince = provName;

  if (state.map.geoJsonLayer) {
    state.map.geoJsonLayer.eachLayer((layer) => {
      const name = layer.feature.properties.pro_th.trim();
      if (name === provName) {
        layer.setStyle({
          weight: 3,
          color: '#ffffff',
          fillOpacity: 0.95,
        });
        layer.bringToFront();
      } else {
        state.map.geoJsonLayer.resetStyle(layer);
      }
    });
  }

  renderProvinceDetail(provName, provEn);
}

function renderProvinceDetail(provName, provEn) {
  const pData = state.map.provinceAnalytics ? state.map.provinceAnalytics[provName] : null;

  elements.panelPlaceholder.classList.add('hidden');
  elements.panelActiveContent.classList.remove('hidden');

  elements.panelProvinceName.textContent = provName;
  elements.panelProvinceEn.textContent = provEn || (pData ? pData.province : '');
  elements.panelRegionBadge.textContent = pData && pData.healthRegion ? pData.healthRegion : 'ไม่ระบุเขต';

  const totalUsers = pData ? pData.totalUsers : 0;
  const activeUsers = pData ? pData.activeUsers : 0;
  const blockedUsers = pData ? pData.blockedUsers : 0;

  elements.panelTotalUsers.textContent = `${formatNumber(totalUsers)} คน`;
  elements.panelActiveUsers.textContent = `${formatNumber(activeUsers)} Active`;
  elements.panelBlockedUsers.textContent = `${formatNumber(blockedUsers)} บล็อก/เกษียณ`;

  const levels = pData && pData.facilityLevels ? pData.facilityLevels : {};
  const sortedLevels = Object.entries(levels).sort((a, b) => b[1] - a[1]);

  if (sortedLevels.length === 0) {
    elements.panelLevelList.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; text-align: center; padding: 16px;">
        ไม่มีข้อมูลสถานพยาบาลในเงื่อนไขตัวกรองปัจจุบัน
      </div>
    `;
  } else {
    elements.panelLevelList.innerHTML = sortedLevels
      .map(([level, count]) => {
        const pct = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0;
        return `
          <div class="level-item">
            <div class="level-item-header">
              <span class="level-item-name">${escapeHtml(level)}</span>
              <span class="level-item-count">${formatNumber(count)} คน (${pct}%)</span>
            </div>
            <div class="level-bar-bg">
              <div class="level-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}

function clearProvinceSelection() {
  state.map.selectedProvince = null;
  elements.panelPlaceholder.classList.remove('hidden');
  elements.panelActiveContent.classList.add('hidden');
  if (state.map.geoJsonLayer) {
    state.map.geoJsonLayer.eachLayer((layer) => {
      state.map.geoJsonLayer.resetStyle(layer);
    });
  }
}

/* ==================================================== */
/* 4. CHARTS RENDERING                                  */
/* ==================================================== */

async function loadCharts() {
  try {
    const chartsData = await dmsApi.getCharts(state.filters);
    if (!chartsData) return;

    state.trendData = chartsData.registrationTrend;

    if (typeof Chart === 'undefined') {
      console.warn('[DMS Dashboard] Chart.js is not loaded yet, charts cannot be rendered.');
      return;
    }

    renderTrendChart(chartsData.registrationTrend);
    renderRegionsChart(chartsData.regions);
    renderStatusChart(chartsData.status);
    renderPositionsChart(chartsData.positions);
    renderLevelsChart(chartsData.hospitalLevels);
    if (chartsData.affiliations) {
      renderAffiliationsChart(chartsData.affiliations);
    }
  } catch (err) {
    console.error('Error loading charts:', err);
  }
}

function renderTrendChart(trendData) {
  if (!trendData || !elements.trendChart) return;
  const ctx = elements.trendChart.getContext('2d');
  if (state.charts.trend) state.charts.trend.destroy();

  if (elements.trendChartSubtitle && trendData.periodTitle) {
    elements.trendChartSubtitle.textContent = trendData.periodTitle;
  }

  // Gradient for New Users area fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
  gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  const showNew = state.trendMode === 'both' || state.trendMode === 'new';
  const showCumulative = state.trendMode === 'both' || state.trendMode === 'cumulative';

  let scales;
  if (state.trendMode === 'both') {
    scales = {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 11 } },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#60a5fa', font: { family: 'Sarabun' } },
        title: {
          display: true,
          text: 'ผู้สมัครใหม่ (คน)',
          color: '#60a5fa',
          font: { family: 'Sarabun', size: 12, weight: 600 },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: '#34d399', font: { family: 'Sarabun' } },
        title: {
          display: true,
          text: 'ยอดสะสม (คน)',
          color: '#34d399',
          font: { family: 'Sarabun', size: 12, weight: 600 },
        },
      },
    };
  } else if (state.trendMode === 'new') {
    scales = {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#60a5fa', font: { family: 'Sarabun' } },
        title: {
          display: true,
          text: 'ผู้สมัครใหม่ (คน)',
          color: '#60a5fa',
          font: { family: 'Sarabun', size: 12, weight: 600 },
        },
      },
    };
  } else {
    scales = {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#34d399', font: { family: 'Sarabun' } },
        title: {
          display: true,
          text: 'ยอดสะสม (คน)',
          color: '#34d399',
          font: { family: 'Sarabun', size: 12, weight: 600 },
        },
      },
    };
  }

  const datasets = [];
  if (showNew) {
    datasets.push({
      label: 'ผู้สมัครใช้งานใหม่',
      data: trendData.newUsers,
      borderColor: '#3b82f6',
      backgroundColor: gradient,
      fill: true,
      tension: 0.35,
      borderWidth: 2.5,
      pointRadius: trendData.labels.length > 35 ? 1 : 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#60a5fa',
      pointBorderColor: '#0f172a',
      pointBorderWidth: 1.5,
      yAxisID: 'y',
    });
  }

  if (showCumulative) {
    datasets.push({
      label: 'ยอดสะสม (Cumulative)',
      data: trendData.cumulativeUsers,
      borderColor: '#10b981',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointRadius: trendData.labels.length > 35 ? 1 : 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#34d399',
      pointBorderColor: '#0f172a',
      pointBorderWidth: 1.5,
      yAxisID: state.trendMode === 'both' ? 'y1' : 'y',
    });
  }

  state.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#cbd5e1',
            font: { family: 'Sarabun', size: 12 },
            boxWidth: 14,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Sarabun', size: 13, weight: 'bold' },
          bodyFont: { family: 'Sarabun', size: 12 },
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              return (trendData.fullLabels && trendData.fullLabels[idx]) || items[0].label;
            },
            label: (context) => {
              const val = context.parsed.y !== null ? context.parsed.y : context.raw;
              const isCumulative = context.dataset.label.includes('สะสม');
              const prefix = isCumulative ? '📈 ยอดสะสม: ' : '✨ สมัครใหม่: ';
              return `${prefix}${formatNumber(val)} คน`;
            },
          },
        },
      },
      scales: scales,
    },
  });
}

function renderRegionsChart(data) {
  const ctx = document.getElementById('regionsChart').getContext('2d');
  if (state.charts.regions) state.charts.regions.destroy();

  state.charts.regions = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'จำนวนผู้ใช้งาน (คน)',
          data: data.data,
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(59, 130, 246, 0.95)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Sarabun' },
          bodyFont: { family: 'Sarabun' },
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Sarabun' } },
        },
      },
    },
  });
}

function renderStatusChart(data) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  if (state.charts.status) state.charts.status.destroy();

  const colors = [
    'rgba(16, 185, 129, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(139, 92, 246, 0.85)',
  ];

  state.charts.status = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 2,
          borderColor: '#111e38',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { family: 'Sarabun', size: 12 },
            padding: 14,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Sarabun' },
          bodyFont: { family: 'Sarabun' },
        },
      },
      cutout: '68%',
    },
  });
}

function renderPositionsChart(data) {
  const ctx = document.getElementById('positionsChart').getContext('2d');
  if (state.charts.positions) state.charts.positions.destroy();

  state.charts.positions = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'จำนวนบุคลากร (คน)',
          data: data.data,
          backgroundColor: 'rgba(139, 92, 246, 0.75)',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(139, 92, 246, 0.95)',
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Sarabun' },
          bodyFont: { family: 'Sarabun' },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Sarabun' } },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e2e8f0', font: { family: 'Sarabun', size: 11 } },
        },
      },
    },
  });
}

function renderLevelsChart(data) {
  const ctx = document.getElementById('levelsChart').getContext('2d');
  if (state.charts.levels) state.charts.levels.destroy();

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#6366f1',
    '#64748b', '#d946ef'
  ];

  state.charts.levels = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 2,
          borderColor: '#111e38',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { family: 'Sarabun', size: 11 },
            boxWidth: 12,
            padding: 10,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Sarabun' },
          bodyFont: { family: 'Sarabun' },
        },
      },
    },
  });
}

function renderAffiliationsChart(data) {
  if (!data || !elements.affiliationsChart) return;
  const ctx = elements.affiliationsChart.getContext('2d');
  if (state.charts.affiliations) state.charts.affiliations.destroy();

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#6366f1',
    '#64748b', '#d946ef'
  ];

  state.charts.affiliations = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 2,
          borderColor: '#111e38',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { family: 'Sarabun', size: 11 },
            boxWidth: 12,
            padding: 10,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Sarabun' },
          bodyFont: { family: 'Sarabun' },
        },
      },
      cutout: '65%',
    },
  });
}

/* ==================================================== */
/* 5. TABLES (USERS, REGIONS, PROVINCES, FACILITIES, POSITIONS) */
/* ==================================================== */

function loadActiveTableData() {
  switch (state.activeTab) {
    case 'users':
      loadUsersTable();
      break;
    case 'regions':
      loadRegionsTable();
      break;
    case 'provinces':
      loadProvincesTable();
      break;
    case 'facilities':
      loadFacilitiesTable();
      break;
    case 'positions':
      loadPositionsTable();
      break;
  }
}

/**
 * Tab 1: Individual Users Table
 */
async function loadUsersTable() {
  try {
    elements.recordsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="table-loading">กำลังโหลดข้อมูลผู้ใช้งาน...</td>
      </tr>
    `;

    const p = state.pagination.users;
    const result = await dmsApi.getRecords({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      filters: state.filters,
    });

    const { data, pagination } = result;
    p.total = pagination.total;
    p.totalPages = pagination.totalPages;

    elements.tableRecordCount.textContent = `พบ ${formatNumber(pagination.total)} รายการ`;

    if (!data || data.length === 0) {
      elements.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="table-empty">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td>
        </tr>
      `;
      renderPagination(0, 0, 0, 'users');
      return;
    }

    const rowsHtml = data
      .map((row) => {
        const statusBadgeClass = row.isActive ? 'badge-active' : 'badge-blocked';
        const blockTooltip = row.blockReason ? ` title="${escapeHtml(row.blockReason)}"` : '';

        return `
          <tr>
            <td style="white-space:nowrap; font-size: 0.8rem; color:#94a3b8;">${escapeHtml(row.recordedAt)}</td>
            <td><strong>${escapeHtml(row.userId)}</strong></td>
            <td>${escapeHtml(row.hospitalName)}</td>
            <td><code>${escapeHtml(row.hospitalCode)}</code></td>
            <td>${escapeHtml(row.cleanedPosition || '-')}</td>
            <td><span class="badge badge-region">${escapeHtml(row.healthRegion || '-')}</span></td>
            <td>${escapeHtml(row.province || '-')}</td>
            <td>${escapeHtml(row.district || '-')}</td>
            <td><span class="badge badge-level">${escapeHtml(row.hospitalLevel || '-')}</span></td>
            <td>
              <span class="badge ${statusBadgeClass}"${blockTooltip}>
                ${escapeHtml(row.status)}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.recordsTableBody.innerHTML = rowsHtml;
    renderPagination(pagination.page, pagination.limit, pagination.total, 'users');
  } catch (err) {
    console.error('Error loading users table:', err);
    elements.recordsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="table-empty" style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td>
      </tr>
    `;
  }
}

/**
 * Tab 2: Health Region Summary Table
 */
async function loadRegionsTable() {
  try {
    elements.regionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-loading">กำลังโหลดข้อมูลรายเขตสุขภาพ...</td>
      </tr>
    `;

    const p = state.pagination.regions;
    const result = await dmsApi.getRegions({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      filters: state.filters,
    });

    const { data, pagination } = result;
    p.total = pagination.total;
    p.totalPages = pagination.totalPages;

    elements.tableRecordCount.textContent = `พบ ${formatNumber(pagination.total)} เขตสุขภาพ`;

    if (!data || data.length === 0) {
      elements.regionsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">ไม่พบเขตสุขภาพที่ตรงกับเงื่อนไขการค้นหา</td>
        </tr>
      `;
      renderPagination(0, 0, 0, 'regions');
      return;
    }

    const rowsHtml = data
      .map((r) => {
        const topLevels = Object.entries(r.facilityLevels || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([lvl, cnt]) => `
            <span class="mini-level-chip">${escapeHtml(lvl)} <strong>${formatNumber(cnt)}</strong></span>
          `)
          .join('');

        return `
          <tr>
            <td><span class="badge badge-region" style="font-size: 0.85rem;">${escapeHtml(r.healthRegion)}</span></td>
            <td><strong>${formatNumber(r.totalProvinces)}</strong> จังหวัด</td>
            <td><strong>${formatNumber(r.totalFacilities)}</strong> แห่ง</td>
            <td><span class="badge badge-count">${formatNumber(r.totalUsers)} คน</span></td>
            <td><div class="level-badges-wrap">${topLevels}</div></td>
            <td>
              <div class="status-cell-wrap">
                <div class="status-ratio-text">
                  <span class="text-green">${r.activePercentage}%</span>
                  <span class="text-red">${r.blockedPercentage}%</span>
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-active" style="width: ${r.activePercentage}%;"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.regionsTableBody.innerHTML = rowsHtml;
    renderPagination(pagination.page, pagination.limit, pagination.total, 'regions');
  } catch (err) {
    console.error('Error loading regions table:', err);
    elements.regionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty" style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูลเขตสุขภาพ</td>
      </tr>
    `;
  }
}

/**
 * Tab 3: Province Summary Table
 */
async function loadProvincesTable() {
  try {
    elements.provincesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-loading">กำลังโหลดข้อมูลรายจังหวัด...</td>
      </tr>
    `;

    const p = state.pagination.provinces;
    const result = await dmsApi.getProvinceSummary({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      filters: state.filters,
    });

    const { data, pagination } = result;
    p.total = pagination.total;
    p.totalPages = pagination.totalPages;

    elements.tableRecordCount.textContent = `พบ ${formatNumber(pagination.total)} จังหวัด`;

    if (!data || data.length === 0) {
      elements.provincesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">ไม่พบจังหวัดที่ตรงกับเงื่อนไขการค้นหา</td>
        </tr>
      `;
      renderPagination(0, 0, 0, 'provinces');
      return;
    }

    const rowsHtml = data
      .map((prov) => {
        const topLevels = Object.entries(prov.facilityLevels || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([lvl, cnt]) => `
            <span class="mini-level-chip">${escapeHtml(lvl)} <strong>${formatNumber(cnt)}</strong></span>
          `)
          .join('');

        return `
          <tr>
            <td><strong>${escapeHtml(prov.province)}</strong></td>
            <td><span class="badge badge-region">${escapeHtml(prov.healthRegion)}</span></td>
            <td>${formatNumber(prov.totalDistricts)} อำเภอ</td>
            <td>${formatNumber(prov.totalFacilities)} แห่ง</td>
            <td><span class="badge badge-count">${formatNumber(prov.totalUsers)} คน</span></td>
            <td><div class="level-badges-wrap">${topLevels}</div></td>
            <td>
              <div class="status-cell-wrap">
                <div class="status-ratio-text">
                  <span class="text-green">${prov.activePercentage}%</span>
                  <span class="text-red">${prov.blockedPercentage}%</span>
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-active" style="width: ${prov.activePercentage}%;"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.provincesTableBody.innerHTML = rowsHtml;
    renderPagination(pagination.page, pagination.limit, pagination.total, 'provinces');
  } catch (err) {
    console.error('Error loading provinces table:', err);
    elements.provincesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty" style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูลจังหวัด</td>
      </tr>
    `;
  }
}

/**
 * Tab 4: Facility Aggregation Table
 */
async function loadFacilitiesTable() {
  try {
    elements.facilitiesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-loading">กำลังโหลดข้อมูลสถานพยาบาล...</td>
      </tr>
    `;

    const p = state.pagination.facilities;
    const result = await dmsApi.getFacilities({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      filters: state.filters,
    });

    const { data, pagination } = result;
    p.total = pagination.total;
    p.totalPages = pagination.totalPages;

    elements.tableRecordCount.textContent = `พบ ${formatNumber(pagination.total)} หน่วยงาน`;

    if (!data || data.length === 0) {
      elements.facilitiesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">ไม่พบสถานพยาบาลที่ตรงกับเงื่อนไขการค้นหา</td>
        </tr>
      `;
      renderPagination(0, 0, 0, 'facilities');
      return;
    }

    const rowsHtml = data
      .map((fac) => {
        const userCountTooltip = `Active: ${fac.activeUsers} คน | บล็อก/เกษียณ: ${fac.blockedUsers} คน`;
        return `
          <tr>
            <td><code>${escapeHtml(fac.hospitalCode)}</code></td>
            <td><strong>${escapeHtml(fac.hospitalName)}</strong></td>
            <td><span class="badge badge-region">${escapeHtml(fac.healthRegion || '-')}</span></td>
            <td>${escapeHtml(fac.province || '-')}</td>
            <td>${escapeHtml(fac.district || '-')}</td>
            <td><span class="badge badge-level">${escapeHtml(fac.hospitalLevel || '-')}</span></td>
            <td>
              <span class="badge badge-count" title="${escapeHtml(userCountTooltip)}">
                ${formatNumber(fac.userCount)} คน
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.facilitiesTableBody.innerHTML = rowsHtml;
    renderPagination(pagination.page, pagination.limit, pagination.total, 'facilities');
  } catch (err) {
    console.error('Error loading facilities table:', err);
    elements.facilitiesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty" style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td>
      </tr>
    `;
  }
}

/**
 * Tab 5: Position Aggregation Table
 */
async function loadPositionsTable() {
  try {
    elements.positionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-loading">กำลังโหลดข้อมูลสรุปตามตำแหน่ง...</td>
      </tr>
    `;

    const p = state.pagination.positions;
    const result = await dmsApi.getPositions({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      filters: state.filters,
    });

    const { data, pagination } = result;
    p.total = pagination.total;
    p.totalPages = pagination.totalPages;

    elements.tableRecordCount.textContent = `พบ ${formatNumber(pagination.total)} ตำแหน่ง`;

    if (!data || data.length === 0) {
      elements.positionsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">ไม่พบตำแหน่งที่ตรงกับเงื่อนไขการค้นหา</td>
        </tr>
      `;
      renderPagination(0, 0, 0, 'positions');
      return;
    }

    const rowsHtml = data
      .map((pos) => {
        return `
          <tr>
            <td><span class="badge badge-level">${escapeHtml(pos.group || '-')}</span></td>
            <td><strong>${escapeHtml(pos.cleanedPosition)}</strong></td>
            <td><span class="badge badge-count">${formatNumber(pos.totalUsers)} คน</span></td>
            <td><span class="text-green font-semibold">${formatNumber(pos.activeUsers)}</span> <small class="text-muted">(${pos.activePercentage}%)</small></td>
            <td><span class="text-red font-semibold">${formatNumber(pos.blockedUsers)}</span> <small class="text-muted">(${pos.blockedPercentage}%)</small></td>
            <td>
              <div class="status-cell-wrap">
                <div class="status-ratio-text">
                  <span class="text-blue font-semibold">${pos.percentage}%</span>
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-active" style="width: ${Math.min(100, pos.percentage * 2)}%; background: #38bdf8;"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.positionsTableBody.innerHTML = rowsHtml;
    renderPagination(pagination.page, pagination.limit, pagination.total, 'positions');
  } catch (err) {
    console.error('Error loading positions table:', err);
    elements.positionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty" style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่ง</td>
      </tr>
    `;
  }
}

/**
 * Shared Pagination Renderer
 */
function renderPagination(page, limit, total, tabType) {
  const p = state.pagination[tabType];

  if (total === 0) {
    elements.paginationInfo.textContent = 'แสดง 0 ถึง 0 จาก 0 รายการ';
    elements.prevPageBtn.disabled = true;
    elements.nextPageBtn.disabled = true;
    elements.pageNumbers.innerHTML = '';
    return;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  elements.paginationInfo.textContent = `แสดง ${formatNumber(start)} ถึง ${formatNumber(end)} จาก ${formatNumber(total)} รายการ`;

  elements.prevPageBtn.disabled = page <= 1;
  elements.nextPageBtn.disabled = page >= p.totalPages;

  const totalPages = p.totalPages;
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  let html = '';
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  elements.pageNumbers.innerHTML = html;
}

/**
 * Master reload function
 */
function refreshAll() {
  loadKpiSummary();
  updateMapAnalytics();
  loadCharts();
  loadActiveTableData();
}

/**
 * Switch Active Tab
 */
function switchTab(tabKey) {
  state.activeTab = tabKey;

  // Toggle button active classes
  const tabBtns = [
    { key: 'users', btn: elements.tabUsersBtn, wrapper: elements.usersTableWrapper, label: 'ส่งออก CSV ผู้ใช้งาน' },
    { key: 'regions', btn: elements.tabRegionsBtn, wrapper: elements.regionsTableWrapper, label: 'ส่งออก CSV เขตสุขภาพ' },
    { key: 'provinces', btn: elements.tabProvincesBtn, wrapper: elements.provincesTableWrapper, label: 'ส่งออก CSV รายจังหวัด' },
    { key: 'facilities', btn: elements.tabFacilitiesBtn, wrapper: elements.facilitiesTableWrapper, label: 'ส่งออก CSV รายหน่วยงาน' },
    { key: 'positions', btn: elements.tabPositionsBtn, wrapper: elements.positionsTableWrapper, label: 'ส่งออก CSV รายตำแหน่ง' },
  ];

  tabBtns.forEach(({ key, btn, wrapper, label }) => {
    if (key === tabKey) {
      btn.classList.add('active');
      wrapper.classList.remove('hidden');
      elements.exportBtnText.textContent = label;
      elements.limitSelect.value = state.pagination[key].limit;
    } else {
      btn.classList.remove('active');
      wrapper.classList.add('hidden');
    }
  });

  loadActiveTableData();
}

/**
 * Event Handlers
 */
function setupEventListeners() {
  // Tab Switcher Buttons
  elements.tabUsersBtn.addEventListener('click', () => switchTab('users'));
  elements.tabRegionsBtn.addEventListener('click', () => switchTab('regions'));
  elements.tabProvincesBtn.addEventListener('click', () => switchTab('provinces'));
  elements.tabFacilitiesBtn.addEventListener('click', () => switchTab('facilities'));
  elements.tabPositionsBtn.addEventListener('click', () => switchTab('positions'));

  // Search with debounce
  elements.searchQuery.addEventListener('input', (e) => {
    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(() => {
      state.filters.q = e.target.value.trim();
      Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
      refreshAll();
    }, 300);
  });

  // Year Filter (Cascading)
  elements.yearFilter.addEventListener('change', async (e) => {
    const y = e.target.value;
    state.filters.year = y;
    state.filters.month = '';
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    await loadMonthsForYear(y);
    refreshAll();
  });

  // Month Filter
  elements.monthFilter.addEventListener('change', (e) => {
    state.filters.month = e.target.value;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    refreshAll();
  });

  // Trend Chart Toggle Buttons
  const trendBtns = [elements.trendModeBoth, elements.trendModeNew, elements.trendModeCumulative];
  trendBtns.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      trendBtns.forEach((b) => b && b.classList.remove('active'));
      btn.classList.add('active');
      state.trendMode = btn.dataset.mode;
      if (state.trendData) {
        renderTrendChart(state.trendData);
      }
    });
  });

  // Health Region Filter
  elements.regionFilter.addEventListener('change', async (e) => {
    state.filters.healthRegion = e.target.value;
    state.filters.province = '';
    state.filters.district = '';
    state.filters.subdistrict = '';
    elements.provinceFilter.value = '';
    elements.districtFilter.value = '';
    elements.subdistrictFilter.value = '';
    clearProvinceSelection();

    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    await syncGeoFilters('region');
    await updateFacilityDatalist();
    refreshAll();
  });

  // Province Filter (Cascading)
  elements.provinceFilter.addEventListener('change', async (e) => {
    const prov = e.target.value;
    state.filters.province = prov;
    state.filters.district = '';
    state.filters.subdistrict = '';
    elements.districtFilter.value = '';
    elements.subdistrictFilter.value = '';
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));

    await syncGeoFilters('province');
    await updateFacilityDatalist();

    if (prov) {
      selectProvince(prov);
    } else {
      clearProvinceSelection();
    }
    refreshAll();
  });

  // District Filter (Cascading)
  elements.districtFilter.addEventListener('change', async (e) => {
    const dist = e.target.value;
    state.filters.district = dist;
    state.filters.subdistrict = '';
    elements.subdistrictFilter.value = '';
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));

    await syncGeoFilters('district');
    await updateFacilityDatalist();
    refreshAll();
  });

  // Subdistrict Filter
  elements.subdistrictFilter.addEventListener('change', async (e) => {
    const sub = e.target.value;
    state.filters.subdistrict = sub;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));

    if (sub) {
      await syncGeoFilters('subdistrict');
    }
    await updateFacilityDatalist();
    refreshAll();
  });

  // Affiliation Filter
  elements.affiliationFilter.addEventListener('change', async (e) => {
    state.filters.affiliation = e.target.value;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    await updateFacilityDatalist();
    refreshAll();
  });

  // Facility Filter with datalist input
  elements.facilityFilter.addEventListener('input', (e) => {
    clearTimeout(state.facilityDebounceTimer);
    state.facilityDebounceTimer = setTimeout(() => {
      state.filters.facility = e.target.value.trim();
      Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
      refreshAll();
    }, 300);
  });

  // Hospital Level Filter
  elements.levelFilter.addEventListener('change', (e) => {
    state.filters.hospitalLevel = e.target.value;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    refreshAll();
  });

  // Position Filter
  elements.positionFilter.addEventListener('change', (e) => {
    state.filters.cleanedPosition = e.target.value;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    refreshAll();
  });

  // Status Filter
  elements.statusFilter.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    refreshAll();
  });

  // Reset Filters
  elements.resetFiltersBtn.addEventListener('click', async () => {
    state.filters = {
      healthRegion: '',
      province: '',
      district: '',
      subdistrict: '',
      affiliation: '',
      facility: '',
      hospitalLevel: '',
      cleanedPosition: '',
      status: '',
      year: '',
      month: '',
      q: '',
    };
    elements.searchQuery.value = '';
    elements.yearFilter.value = '';
    elements.monthFilter.value = '';
    elements.regionFilter.value = '';
    elements.provinceFilter.value = '';
    elements.districtFilter.value = '';
    elements.subdistrictFilter.value = '';
    elements.affiliationFilter.value = '';
    elements.facilityFilter.value = '';
    elements.levelFilter.value = '';
    elements.positionFilter.value = '';
    elements.statusFilter.value = '';

    await loadFilterOptions();
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    clearProvinceSelection();
    refreshAll();
  });

  // Refresh Button
  elements.refreshBtn.addEventListener('click', () => {
    refreshAll();
  });

  // Export CSV Button (Dual mode: browser Blob download on GitHub Pages / server download)
  elements.exportBtn.addEventListener('click', () => {
    dmsApi.exportCsv(state.activeTab, state.filters);
  });

  // Map Panel Action: Filter dashboard by selected province
  elements.panelFilterActionBtn.addEventListener('click', async () => {
    if (!state.map.selectedProvince) return;
    const prov = state.map.selectedProvince;
    state.filters.province = prov;
    elements.provinceFilter.value = prov;
    state.filters.district = '';
    state.filters.subdistrict = '';
    elements.districtFilter.value = '';
    elements.subdistrictFilter.value = '';
    await syncGeoFilters('province');
    await updateFacilityDatalist();
    Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
    refreshAll();
  });

  // Map Panel Close Button
  elements.panelClearBtn.addEventListener('click', async () => {
    clearProvinceSelection();
    if (state.filters.province) {
      state.filters.province = '';
      elements.provinceFilter.value = '';
      state.filters.district = '';
      state.filters.subdistrict = '';
      elements.districtFilter.value = '';
      elements.subdistrictFilter.value = '';
      Object.keys(state.pagination).forEach((k) => (state.pagination[k].page = 1));
      await syncGeoFilters('province');
      await updateFacilityDatalist();
      refreshAll();
    }
  });

  // Rows Per Page selector
  elements.limitSelect.addEventListener('change', (e) => {
    const lim = parseInt(e.target.value, 10);
    state.pagination[state.activeTab].limit = lim;
    state.pagination[state.activeTab].page = 1;
    loadActiveTableData();
  });

  // Pagination Prev / Next
  elements.prevPageBtn.addEventListener('click', () => {
    const p = state.pagination[state.activeTab];
    if (p.page > 1) {
      p.page--;
      loadActiveTableData();
    }
  });

  elements.nextPageBtn.addEventListener('click', () => {
    const p = state.pagination[state.activeTab];
    if (p.page < p.totalPages) {
      p.page++;
      loadActiveTableData();
    }
  });

  // Page Numbers click
  elements.pageNumbers.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (btn) {
      const page = parseInt(btn.dataset.page, 10);
      const p = state.pagination[state.activeTab];
      if (page && page !== p.page) {
        p.page = page;
        loadActiveTableData();
      }
    }
  });

  // Table Sorting Wiring for All 5 Tables
  wireSorting(elements.usersTableHeaders, 'users', loadUsersTable);
  wireSorting(elements.regionsTableHeaders, 'regions', loadRegionsTable);
  wireSorting(elements.provincesTableHeaders, 'provinces', loadProvincesTable);
  wireSorting(elements.facilitiesTableHeaders, 'facilities', loadFacilitiesTable);
  wireSorting(elements.positionsTableHeaders, 'positions', loadPositionsTable);
}

function wireSorting(headers, tabKey, reloadFn) {
  headers.forEach((th) => {
    th.addEventListener('click', () => {
      const sortField = th.dataset.sort;
      if (!sortField) return;
      const p = state.pagination[tabKey];

      if (p.sort === sortField) {
        p.order = p.order === 'asc' ? 'desc' : 'asc';
      } else {
        p.sort = sortField;
        p.order = 'asc';
      }

      updateSortIcons(headers, p.sort, p.order);
      reloadFn();
    });
  });
}

function updateSortIcons(headers, currentSort, currentOrder) {
  headers.forEach((h) => {
    const icon = h.querySelector('.sort-icon');
    if (icon) {
      if (h.dataset.sort === currentSort) {
        icon.textContent = currentOrder === 'asc' ? '▲' : '▼';
        icon.style.opacity = '1';
      } else {
        icon.textContent = '↕';
        icon.style.opacity = '0.5';
      }
    }
  });
}

function initVideoPlayer() {
  const video = document.getElementById('dashboardVideo');
  const chapterBtns = document.querySelectorAll('.video-chapter-btn');
  if (!video) return;

  if (chapterBtns && chapterBtns.length > 0) {
    chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const timeSec = parseFloat(btn.getAttribute('data-time') || '0');
        video.currentTime = timeSec;
        video.play().catch(() => {});
        chapterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    video.addEventListener('timeupdate', () => {
      const cur = video.currentTime;
      let activeIdx = 0;
      if (cur >= 12) activeIdx = 3;
      else if (cur >= 8) activeIdx = 2;
      else if (cur >= 4) activeIdx = 1;
      else activeIdx = 0;

      chapterBtns.forEach((btn, idx) => {
        if (idx === activeIdx) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }
}

// Resilient Application Bootstrapping
async function startDashboard() {
  try {
    console.log('[DMS Dashboard] Initializing application...');
    setupEventListeners();
    initVideoPlayer();
    await dmsApi.init();
    await loadFilterOptions();
    await initThailandMap();
    refreshAll();
    console.log('[DMS Dashboard] Initialization complete!');
  } catch (err) {
    console.error('[DMS Dashboard] Initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDashboard);
} else {
  startDashboard();
}

