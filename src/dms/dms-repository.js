import { parseDmsExcel } from './dms-parser.js';

/**
 * Natural sort helper for Thai health regions (e.g. เขต 1, เขต 2, ... เขต 10, เขต 13).
 */
function compareRegions(a, b) {
  const numA = parseInt((a || '').replace(/\D+/g, ''), 10);
  const numB = parseInt((b || '').replace(/\D+/g, ''), 10);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  return String(a).localeCompare(String(b), 'th');
}

/**
 * In-memory repository and analytics engine for DMS records.
 */
export class DmsRepository {
  /**
   * @param {Array<import('./dms-record.js').DmsRecord>} [records=[]]
   */
  constructor(records = []) {
    /** @type {Array<import('./dms-record.js').DmsRecord>} */
    this.records = records;
  }

  /**
   * Initializes repository by reading from Excel file.
   * @param {string} [filePath]
   * @returns {DmsRepository}
   */
  loadFromFile(filePath) {
    this.records = parseDmsExcel(filePath);
    return this;
  }

  /**
   * Returns all loaded records.
   * @returns {Array<import('./dms-record.js').DmsRecord>}
   */
  getAll() {
    return this.records;
  }

  /**
   * Filters records according to specified filter dimensions and search query.
   * @param {Object} [filters={}]
   * @returns {Array<import('./dms-record.js').DmsRecord>}
   */
  filter(filters = {}) {
    if (!filters || Object.keys(filters).length === 0) {
      return this.records;
    }

    const {
      healthRegion,
      province,
      district,
      subdistrict,
      hospitalLevel,
      cleanedPosition,
      position,
      status,
      isActive,
      year,
      month,
      yearMonth,
      q,
      query,
    } = filters;

    const searchTerm = (q || query || '').trim().toLowerCase();
    const targetPosition = (cleanedPosition || position || '').trim();
    const targetYear = (year !== undefined && year !== null && String(year).trim() !== '')
      ? parseInt(year, 10)
      : null;
    const targetMonth = (month !== undefined && month !== null && String(month).trim() !== '')
      ? parseInt(month, 10)
      : null;
    const targetYearMonth = (yearMonth || '').trim();

    return this.records.filter((rec) => {
      if (healthRegion && rec.healthRegion !== healthRegion.trim()) {
        return false;
      }
      if (province && rec.province !== province.trim()) {
        return false;
      }
      if (district && rec.district !== district.trim()) {
        return false;
      }
      if (subdistrict && rec.subdistrict !== subdistrict.trim()) {
        return false;
      }
      if (hospitalLevel && rec.hospitalLevel !== hospitalLevel.trim()) {
        return false;
      }
      if (targetPosition && rec.cleanedPosition !== targetPosition) {
        return false;
      }
      if (status && rec.status !== status.trim()) {
        return false;
      }
      if (typeof isActive === 'boolean' && rec.isActive !== isActive) {
        return false;
      }
      if (targetYear !== null && !isNaN(targetYear) && rec.year !== targetYear) {
        return false;
      }
      if (targetMonth !== null && !isNaN(targetMonth) && rec.month !== targetMonth) {
        return false;
      }
      if (targetYearMonth && rec.yearMonth !== targetYearMonth) {
        return false;
      }

      if (searchTerm) {
        const matchesQuery =
          rec.userId.toLowerCase().includes(searchTerm) ||
          rec.hospitalName.toLowerCase().includes(searchTerm) ||
          rec.hospitalCode.toLowerCase().includes(searchTerm) ||
          rec.cleanedPosition.toLowerCase().includes(searchTerm) ||
          rec.originalPosition.toLowerCase().includes(searchTerm) ||
          rec.province.toLowerCase().includes(searchTerm) ||
          rec.district.toLowerCase().includes(searchTerm) ||
          rec.subdistrict.toLowerCase().includes(searchTerm) ||
          rec.healthRegion.toLowerCase().includes(searchTerm);

        if (!matchesQuery) return false;
      }

      return true;
    });
  }

  /**
   * Returns distinct filter options sorted appropriately.
   * Supports cascading by context (e.g. province, district, year).
   * @param {Object} [context={}]
   * @returns {Object}
   */
  getDistinctFilterValues(context = {}) {
    const healthRegionsSet = new Set();
    const provincesSet = new Set();
    const districtsSet = new Set();
    const subdistrictsSet = new Set();
    const hospitalLevelsSet = new Set();
    const positionsSet = new Set();
    const statusesSet = new Set();
    const yearsSet = new Set();
    const monthsSet = new Set();

    const targetRegion = (context.healthRegion || '').trim();
    const targetProvince = (context.province || '').trim();
    const targetDistrict = (context.district || '').trim();
    const targetYear = (context.year !== undefined && context.year !== null && String(context.year).trim() !== '')
      ? parseInt(context.year, 10)
      : null;

    for (const rec of this.records) {
      if (rec.healthRegion) healthRegionsSet.add(rec.healthRegion);
      
      // Provinces can be scoped to healthRegion if specified
      if (targetRegion) {
        if (rec.healthRegion === targetRegion && rec.province) provincesSet.add(rec.province);
      } else {
        if (rec.province) provincesSet.add(rec.province);
      }

      // Districts scoped to province
      if (targetProvince) {
        if (rec.province === targetProvince && rec.district) districtsSet.add(rec.district);
      } else {
        if (rec.district) districtsSet.add(rec.district);
      }

      // Subdistricts scoped to district (and province)
      if (targetDistrict) {
        const matchesProv = !targetProvince || rec.province === targetProvince;
        if (matchesProv && rec.district === targetDistrict && rec.subdistrict) {
          subdistrictsSet.add(rec.subdistrict);
        }
      } else {
        if (rec.subdistrict) subdistrictsSet.add(rec.subdistrict);
      }

      if (rec.hospitalLevel) hospitalLevelsSet.add(rec.hospitalLevel);
      if (rec.cleanedPosition) positionsSet.add(rec.cleanedPosition);
      if (rec.status) statusesSet.add(rec.status);

      // Temporal years & months
      if (rec.year) yearsSet.add(rec.year);
      if (targetYear !== null && !isNaN(targetYear)) {
        if (rec.year === targetYear && rec.month) monthsSet.add(rec.month);
      } else {
        if (rec.month) monthsSet.add(rec.month);
      }
    }

    const healthRegions = Array.from(healthRegionsSet).sort(compareRegions);
    const provinces = Array.from(provincesSet).sort((a, b) => a.localeCompare(b, 'th'));
    const districts = Array.from(districtsSet).sort((a, b) => a.localeCompare(b, 'th'));
    const subdistricts = Array.from(subdistrictsSet).sort((a, b) => a.localeCompare(b, 'th'));
    const hospitalLevels = Array.from(hospitalLevelsSet).sort((a, b) => a.localeCompare(b, 'th'));
    const positions = Array.from(positionsSet).sort((a, b) => a.localeCompare(b, 'th'));
    const statuses = Array.from(statusesSet).sort((a, b) => a.localeCompare(b, 'th'));
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    const months = Array.from(monthsSet).sort((a, b) => a - b);

    return {
      healthRegions,
      provinces,
      districts,
      subdistricts,
      hospitalLevels,
      positions,
      statuses,
      years,
      months,
    };
  }

  /**
   * Computes KPI summary based on filters or global records.
   * @param {Object} [filters={}]
   * @returns {Object}
   */
  getSummary(filters = {}) {
    const filtered = this.filter(filters);
    const totalUsers = filtered.length;

    let activeUsers = 0;
    let blockedUsers = 0;
    const facilitiesSet = new Set();
    const healthRegionsSet = new Set();
    const provincesSet = new Set();

    for (const rec of filtered) {
      if (rec.isActive) {
        activeUsers++;
      } else {
        blockedUsers++;
      }
      const facilityKey = rec.hospitalCode || rec.hospitalName;
      if (facilityKey) facilitiesSet.add(facilityKey);
      if (rec.healthRegion) healthRegionsSet.add(rec.healthRegion);
      if (rec.province) provincesSet.add(rec.province);
    }

    const activePercentage = totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;
    const blockedPercentage = totalUsers > 0 ? Number(((blockedUsers / totalUsers) * 100).toFixed(1)) : 0;

    return {
      totalUsers,
      activeUsers,
      activePercentage,
      blockedUsers,
      blockedPercentage,
      uniqueFacilities: facilitiesSet.size,
      uniqueHealthRegions: healthRegionsSet.size,
      uniqueProvinces: provincesSet.size,
    };
  }

  /**
   * Computes aggregated series data for Chart.js.
   * @param {Object} [filters={}]
   * @returns {Object}
   */
  getChartsData(filters = {}) {
    const filtered = this.filter(filters);

    const regionCounts = {};
    const levelCounts = {};
    const positionCounts = {};
    const statusCounts = {};

    for (const rec of filtered) {
      // Region counts
      const reg = rec.healthRegion || 'ไม่ระบุ';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;

      // Level counts
      const lvl = rec.hospitalLevel || 'ไม่ระบุ';
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;

      // Position counts
      const pos = rec.cleanedPosition || 'ไม่ระบุ';
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;

      // Status counts
      const st = rec.status || 'ไม่ระบุ';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }

    // Sort regions naturally
    const sortedRegions = Object.keys(regionCounts).sort(compareRegions);
    const regionsChart = {
      labels: sortedRegions,
      data: sortedRegions.map((k) => regionCounts[k]),
    };

    // Hospital levels sorted descending by count
    const sortedLevels = Object.entries(levelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const hospitalLevelsChart = {
      labels: sortedLevels.map(([k]) => k),
      data: sortedLevels.map(([, v]) => v),
    };

    // Positions sorted descending by count (top 10)
    const sortedPositions = Object.entries(positionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const positionsChart = {
      labels: sortedPositions.map(([k]) => k),
      data: sortedPositions.map(([, v]) => v),
    };

    // Statuses sorted descending
    const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
    const statusChart = {
      labels: sortedStatuses.map(([k]) => k),
      data: sortedStatuses.map(([, v]) => v),
    };

    const registrationTrend = this.getRegistrationTrendData(filtered, filters);

    return {
      regions: regionsChart,
      hospitalLevels: hospitalLevelsChart,
      positions: positionsChart,
      status: statusChart,
      registrationTrend,
    };
  }

  /**
   * Computes time-series trend data for user registrations (daily or monthly).
   * @param {Array<import('./dms-record.js').DmsRecord>} filtered
   * @param {Object} [filters={}]
   * @returns {Object}
   */
  getRegistrationTrendData(filtered, filters = {}) {
    const THAI_MONTHS_SHORT = [
      '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const THAI_MONTHS_FULL = [
      '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const targetYear = (filters.year !== undefined && filters.year !== null && String(filters.year).trim() !== '')
      ? parseInt(filters.year, 10)
      : null;
    const targetMonth = (filters.month !== undefined && filters.month !== null && String(filters.month).trim() !== '')
      ? parseInt(filters.month, 10)
      : null;

    // Case 1: Specific Month is filtered -> Daily granularity
    if (targetMonth !== null && !isNaN(targetMonth)) {
      const year = targetYear || (filtered[0] ? filtered[0].year : 2024) || 2024;
      const month = targetMonth;
      const daysInMonth = new Date(year, month, 0).getDate();

      const dailyCounts = {};
      for (const rec of filtered) {
        if (rec.day) {
          dailyCounts[rec.day] = (dailyCounts[rec.day] || 0) + 1;
        }
      }

      const labels = [];
      const fullLabels = [];
      const newUsers = [];
      const cumulativeUsers = [];
      let runningTotal = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const count = dailyCounts[d] || 0;
        runningTotal += count;
        labels.push(`${d} ${THAI_MONTHS_SHORT[month]}`);
        fullLabels.push(`${d} ${THAI_MONTHS_FULL[month]} ${year + 543} (ค.ศ. ${year})`);
        newUsers.push(count);
        cumulativeUsers.push(runningTotal);
      }

      return {
        granularity: 'daily',
        periodTitle: `แนวโน้มรายวัน - ${THAI_MONTHS_FULL[month]} ${year + 543} (ค.ศ. ${year})`,
        labels,
        fullLabels,
        newUsers,
        cumulativeUsers,
        total: filtered.length,
        totalWithDates: runningTotal,
      };
    }

    // Case 2: Specific Year is filtered (without specific month) -> 12 Months of that year
    if (targetYear !== null && !isNaN(targetYear)) {
      const year = targetYear;
      const monthlyCounts = {};
      for (const rec of filtered) {
        if (rec.month) {
          monthlyCounts[rec.month] = (monthlyCounts[rec.month] || 0) + 1;
        }
      }

      const labels = [];
      const fullLabels = [];
      const newUsers = [];
      const cumulativeUsers = [];
      let runningTotal = 0;

      for (let m = 1; m <= 12; m++) {
        const count = monthlyCounts[m] || 0;
        runningTotal += count;
        labels.push(THAI_MONTHS_SHORT[m]);
        fullLabels.push(`${THAI_MONTHS_FULL[m]} ${year + 543} (ค.ศ. ${year})`);
        newUsers.push(count);
        cumulativeUsers.push(runningTotal);
      }

      return {
        granularity: 'monthly',
        periodTitle: `แนวโน้มรายเดือน - ปี ${year + 543} (ค.ศ. ${year})`,
        labels,
        fullLabels,
        newUsers,
        cumulativeUsers,
        total: filtered.length,
        totalWithDates: runningTotal,
      };
    }

    // Case 3: All time or filtered by other dimensions -> Monthly across min to max dataset yearMonths
    let minYM = '9999-99';
    let maxYM = '0000-00';
    for (const rec of this.records) {
      if (rec.yearMonth) {
        if (rec.yearMonth < minYM) minYM = rec.yearMonth;
        if (rec.yearMonth > maxYM) maxYM = rec.yearMonth;
      }
    }
    if (minYM > maxYM) {
      minYM = '2024-01';
      maxYM = '2026-09';
    }

    const monthlyCounts = {};
    for (const rec of filtered) {
      if (rec.yearMonth) {
        monthlyCounts[rec.yearMonth] = (monthlyCounts[rec.yearMonth] || 0) + 1;
      }
    }

    const labels = [];
    const fullLabels = [];
    const newUsers = [];
    const cumulativeUsers = [];
    let runningTotal = 0;

    const [startYear, startMonth] = minYM.split('-').map(Number);
    const [endYear, endMonth] = maxYM.split('-').map(Number);

    for (let y = startYear; y <= endYear; y++) {
      const sM = (y === startYear) ? startMonth : 1;
      const eM = (y === endYear) ? endMonth : 12;
      for (let m = sM; m <= eM; m++) {
        const ymKey = `${y}-${String(m).padStart(2, '0')}`;
        const count = monthlyCounts[ymKey] || 0;
        runningTotal += count;
        labels.push(`${THAI_MONTHS_SHORT[m]} ${y + 543 - 2500}`);
        fullLabels.push(`${THAI_MONTHS_FULL[m]} ${y + 543} (ค.ศ. ${y})`);
        newUsers.push(count);
        cumulativeUsers.push(runningTotal);
      }
    }

    return {
      granularity: 'monthly',
      periodTitle: 'แนวโน้มการสมัครใช้งานภาพรวมรายเดือน (2567 - 2569)',
      labels,
      fullLabels,
      newUsers,
      cumulativeUsers,
      total: filtered.length,
      totalWithDates: runningTotal,
    };
  }

  /**
   * Retrieves paginated records with sorting.
   * @param {Object} options
   * @param {Object} [options.filters={}]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=25]
   * @param {string} [options.sort='recordedAt']
   * @param {string} [options.order='desc']
   * @returns {Object}
   */
  getPaginatedRecords({
    filters = {},
    page = 1,
    limit = 25,
    sort = 'recordedAt',
    order = 'desc',
  } = {}) {
    const filtered = this.filter(filters);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 25));
    const isAsc = String(order).toLowerCase() === 'asc';

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const valA = a[sort] ?? '';
      const valB = b[sort] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th');
    });

    const total = sorted.length;
    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const data = sorted.slice(offset, offset + parsedLimit).map((r) => r.toJSON());

    return {
      data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Exports filtered records to CSV string with UTF-8 BOM.
   * @param {Object} [filters={}]
   * @returns {string}
   */
  toCsv(filters = {}) {
    const filtered = this.filter(filters);
    const headers = [
      'วันที่บันทึก',
      'รหัสผู้ใช้งาน',
      'ชื่อหน่วยงาน',
      'รหัสสถานพยาบาล',
      'ตำแหน่ง (ปรับปรุงแล้ว)',
      'ตำแหน่งเดิม',
      'เขตสุขภาพ',
      'จังหวัด',
      'อำเภอ',
      'ตำบล',
      'ระดับสถานพยาบาล',
      'สังกัด',
      'สถานะการใช้งาน',
      'หมายเหตุการบล็อก',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = [headers.join(',')];

    for (const r of filtered) {
      const row = [
        escapeCsv(r.recordedAt),
        escapeCsv(r.userId),
        escapeCsv(r.hospitalName),
        escapeCsv(r.hospitalCode),
        escapeCsv(r.cleanedPosition),
        escapeCsv(r.originalPosition),
        escapeCsv(r.healthRegion),
        escapeCsv(r.province),
        escapeCsv(r.district),
        escapeCsv(r.subdistrict),
        escapeCsv(r.hospitalLevel),
        escapeCsv(r.affiliation),
        escapeCsv(r.status),
        escapeCsv(r.blockReason),
      ];
      rows.push(row.join(','));
    }

    // Prepend UTF-8 BOM (\uFEFF)
    return '\uFEFF' + rows.join('\r\n');
  }

  /**
   * Computes per-province user counts and facility level breakdown.
   * @param {Object} [filters={}]
   * @returns {Object}
   */
  getProvinceAnalytics(filters = {}) {
    const filtered = this.filter(filters);
    const provinces = {};
    let maxUsers = 0;

    for (const rec of filtered) {
      const prov = rec.province || 'ไม่ระบุ';
      if (!provinces[prov]) {
        provinces[prov] = {
          province: prov,
          healthRegion: rec.healthRegion || '',
          totalUsers: 0,
          activeUsers: 0,
          blockedUsers: 0,
          facilityLevels: {},
        };
      }

      const pObj = provinces[prov];
      pObj.totalUsers++;
      if (rec.isActive) {
        pObj.activeUsers++;
      } else {
        pObj.blockedUsers++;
      }

      const lvl = rec.hospitalLevel || 'ไม่ระบุ';
      pObj.facilityLevels[lvl] = (pObj.facilityLevels[lvl] || 0) + 1;

      if (pObj.totalUsers > maxUsers) {
        maxUsers = pObj.totalUsers;
      }
    }

    return {
      provinces,
      maxUsers,
    };
  }

  /**
   * Returns aggregated facility summaries grouped by hospitalCode and hospitalName.
   * @param {Object} options
   * @param {Object} [options.filters={}]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=25]
   * @param {string} [options.sort='userCount']
   * @param {string} [options.order='desc']
   * @returns {Object}
   */
  getFacilityAggregations({
    filters = {},
    page = 1,
    limit = 25,
    sort = 'userCount',
    order = 'desc',
  } = {}) {
    const filtered = this.filter(filters);
    const facilityMap = new Map();

    for (const rec of filtered) {
      const key = rec.hospitalCode || rec.hospitalName;
      if (!key) continue;

      if (!facilityMap.has(key)) {
        facilityMap.set(key, {
          hospitalCode: rec.hospitalCode || '-',
          hospitalName: rec.hospitalName || '-',
          healthRegion: rec.healthRegion || '-',
          province: rec.province || '-',
          district: rec.district || '-',
          hospitalLevel: rec.hospitalLevel || '-',
          userCount: 0,
          activeUsers: 0,
          blockedUsers: 0,
        });
      }

      const fac = facilityMap.get(key);
      fac.userCount++;
      if (rec.isActive) {
        fac.activeUsers++;
      } else {
        fac.blockedUsers++;
      }
    }

    let list = Array.from(facilityMap.values());

    const isAsc = String(order).toLowerCase() === 'asc';
    list.sort((a, b) => {
      const valA = a[sort] ?? '';
      const valB = b[sort] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th');
    });

    const total = list.length;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 25));
    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const data = list.slice(offset, offset + parsedLimit);

    return {
      data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Exports aggregated facility table to CSV with UTF-8 BOM.
   * @param {Object} [filters={}]
   * @returns {string}
   */
  toFacilityCsv(filters = {}) {
    const res = this.getFacilityAggregations({ filters, limit: 100000, sort: 'userCount', order: 'desc' });
    const headers = [
      'รหัสสถานพยาบาล',
      'ชื่อสถานพยาบาล / หน่วยงาน',
      'เขตสุขภาพ',
      'จังหวัด',
      'อำเภอ',
      'ระดับสถานพยาบาล',
      'จำนวนผู้ใช้งานทั้งหมด',
      'สถานะปกติ (Active)',
      'บล็อก/เกษียณ',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = [headers.join(',')];
    for (const f of res.data) {
      rows.push([
        escapeCsv(f.hospitalCode),
        escapeCsv(f.hospitalName),
        escapeCsv(f.healthRegion),
        escapeCsv(f.province),
        escapeCsv(f.district),
        escapeCsv(f.hospitalLevel),
        escapeCsv(f.userCount),
        escapeCsv(f.activeUsers),
        escapeCsv(f.blockedUsers),
      ].join(','));
    }

    return '\uFEFF' + rows.join('\r\n');
  }

  /**
   * Aggregates records at the Health Region level.
   * @param {Object} options
   * @param {Object} [options.filters={}]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=25]
   * @param {string} [options.sort='healthRegion']
   * @param {string} [options.order='asc']
   * @returns {Object}
   */
  getRegionAggregations({
    filters = {},
    page = 1,
    limit = 25,
    sort = 'healthRegion',
    order = 'asc',
  } = {}) {
    const filtered = this.filter(filters);
    const regionMap = new Map();

    for (const rec of filtered) {
      const reg = rec.healthRegion || 'ไม่ระบุ';
      if (!regionMap.has(reg)) {
        regionMap.set(reg, {
          healthRegion: reg,
          provincesSet: new Set(),
          facilitiesSet: new Set(),
          totalUsers: 0,
          activeUsers: 0,
          blockedUsers: 0,
          facilityLevels: {},
        });
      }

      const item = regionMap.get(reg);
      if (rec.province) item.provincesSet.add(rec.province);
      const facKey = rec.hospitalCode || rec.hospitalName;
      if (facKey) item.facilitiesSet.add(facKey);

      item.totalUsers++;
      if (rec.isActive) {
        item.activeUsers++;
      } else {
        item.blockedUsers++;
      }

      const lvl = rec.hospitalLevel || 'ไม่ระบุ';
      item.facilityLevels[lvl] = (item.facilityLevels[lvl] || 0) + 1;
    }

    const list = Array.from(regionMap.values()).map((r) => {
      const totalUsers = r.totalUsers;
      const activePercentage = totalUsers > 0 ? Number(((r.activeUsers / totalUsers) * 100).toFixed(1)) : 0;
      const blockedPercentage = totalUsers > 0 ? Number(((r.blockedUsers / totalUsers) * 100).toFixed(1)) : 0;

      return {
        healthRegion: r.healthRegion,
        totalProvinces: r.provincesSet.size,
        totalFacilities: r.facilitiesSet.size,
        totalUsers: r.totalUsers,
        activeUsers: r.activeUsers,
        activePercentage,
        blockedUsers: r.blockedUsers,
        blockedPercentage,
        facilityLevels: r.facilityLevels,
      };
    });

    const isAsc = String(order).toLowerCase() === 'asc';
    list.sort((a, b) => {
      if (sort === 'healthRegion') {
        const comp = compareRegions(a.healthRegion, b.healthRegion);
        return isAsc ? comp : -comp;
      }

      const valA = a[sort] ?? '';
      const valB = b[sort] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th');
    });

    const total = list.length;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 25));
    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const data = list.slice(offset, offset + parsedLimit);

    return {
      data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Exports Region summary table to CSV with UTF-8 BOM.
   * @param {Object} [filters={}]
   * @returns {string}
   */
  toRegionCsv(filters = {}) {
    const res = this.getRegionAggregations({ filters, limit: 1000, sort: 'healthRegion', order: 'asc' });
    const headers = [
      'เขตสุขภาพ',
      'จำนวนจังหวัด',
      'จำนวนหน่วยงาน/สถานพยาบาล',
      'จำนวนผู้ใช้งานทั้งหมด',
      'สถานะปกติ (Active)',
      'บล็อก/เกษียณ',
      'สัดส่วนระดับสถานพยาบาล',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = [headers.join(',')];
    for (const r of res.data) {
      const levelsStr = Object.entries(r.facilityLevels)
        .sort((a, b) => b[1] - a[1])
        .map(([lvl, cnt]) => `${lvl}: ${cnt}`)
        .join(' | ');

      rows.push([
        escapeCsv(r.healthRegion),
        escapeCsv(r.totalProvinces),
        escapeCsv(r.totalFacilities),
        escapeCsv(r.totalUsers),
        escapeCsv(`${r.activeUsers} (${r.activePercentage}%)`),
        escapeCsv(`${r.blockedUsers} (${r.blockedPercentage}%)`),
        escapeCsv(levelsStr),
      ].join(','));
    }

    return '\uFEFF' + rows.join('\r\n');
  }

  /**
   * Aggregates records at the Province level.
   * @param {Object} options
   * @param {Object} [options.filters={}]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=25]
   * @param {string} [options.sort='totalUsers']
   * @param {string} [options.order='desc']
   * @returns {Object}
   */
  getProvinceAggregations({
    filters = {},
    page = 1,
    limit = 25,
    sort = 'totalUsers',
    order = 'desc',
  } = {}) {
    const filtered = this.filter(filters);
    const provMap = new Map();

    for (const rec of filtered) {
      const prov = rec.province || 'ไม่ระบุ';
      if (!provMap.has(prov)) {
        provMap.set(prov, {
          province: prov,
          healthRegion: rec.healthRegion || '-',
          districtsSet: new Set(),
          facilitiesSet: new Set(),
          totalUsers: 0,
          activeUsers: 0,
          blockedUsers: 0,
          facilityLevels: {},
        });
      }

      const item = provMap.get(prov);
      if (rec.district) item.districtsSet.add(rec.district);
      const facKey = rec.hospitalCode || rec.hospitalName;
      if (facKey) item.facilitiesSet.add(facKey);

      item.totalUsers++;
      if (rec.isActive) {
        item.activeUsers++;
      } else {
        item.blockedUsers++;
      }

      const lvl = rec.hospitalLevel || 'ไม่ระบุ';
      item.facilityLevels[lvl] = (item.facilityLevels[lvl] || 0) + 1;
    }

    const list = Array.from(provMap.values()).map((p) => {
      const totalUsers = p.totalUsers;
      const activePercentage = totalUsers > 0 ? Number(((p.activeUsers / totalUsers) * 100).toFixed(1)) : 0;
      const blockedPercentage = totalUsers > 0 ? Number(((p.blockedUsers / totalUsers) * 100).toFixed(1)) : 0;

      return {
        province: p.province,
        healthRegion: p.healthRegion,
        totalDistricts: p.districtsSet.size,
        totalFacilities: p.facilitiesSet.size,
        totalUsers: p.totalUsers,
        activeUsers: p.activeUsers,
        activePercentage,
        blockedUsers: p.blockedUsers,
        blockedPercentage,
        facilityLevels: p.facilityLevels,
      };
    });

    const isAsc = String(order).toLowerCase() === 'asc';
    list.sort((a, b) => {
      if (sort === 'healthRegion') {
        const comp = compareRegions(a.healthRegion, b.healthRegion);
        return isAsc ? comp : -comp;
      }

      const valA = a[sort] ?? '';
      const valB = b[sort] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th');
    });

    const total = list.length;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 25));
    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const data = list.slice(offset, offset + parsedLimit);

    return {
      data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Exports Province summary table to CSV with UTF-8 BOM.
   * @param {Object} [filters={}]
   * @returns {string}
   */
  toProvinceCsv(filters = {}) {
    const res = this.getProvinceAggregations({ filters, limit: 1000, sort: 'totalUsers', order: 'desc' });
    const headers = [
      'จังหวัด',
      'เขตสุขภาพ',
      'จำนวนอำเภอ',
      'จำนวนหน่วยงาน/สถานพยาบาล',
      'จำนวนผู้ใช้งานทั้งหมด',
      'สถานะปกติ (Active)',
      'บล็อก/เกษียณ',
      'สัดส่วนระดับสถานพยาบาล',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = [headers.join(',')];
    for (const p of res.data) {
      const levelsStr = Object.entries(p.facilityLevels)
        .sort((a, b) => b[1] - a[1])
        .map(([lvl, cnt]) => `${lvl}: ${cnt}`)
        .join(' | ');

      rows.push([
        escapeCsv(p.province),
        escapeCsv(p.healthRegion),
        escapeCsv(p.totalDistricts),
        escapeCsv(p.totalFacilities),
        escapeCsv(p.totalUsers),
        escapeCsv(`${p.activeUsers} (${p.activePercentage}%)`),
        escapeCsv(`${p.blockedUsers} (${p.blockedPercentage}%)`),
        escapeCsv(levelsStr),
      ].join(','));
    }

    return '\uFEFF' + rows.join('\r\n');
  }
}
