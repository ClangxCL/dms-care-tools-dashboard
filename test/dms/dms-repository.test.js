import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { DmsRepository } from '../../src/dms/dms-repository.js';
import { DmsRecord } from '../../src/dms/dms-record.js';

describe('DmsRepository Engine', () => {
  let repo;

  before(() => {
    repo = new DmsRepository().loadFromFile();
  });

  it('should load all 4,205 records into memory', () => {
    assert.strictEqual(repo.getAll().length, 4205);
  });

  describe('KPI Summary', () => {
    it('should compute accurate global KPI summary', () => {
      const summary = repo.getSummary();
      assert.strictEqual(summary.totalUsers, 4205);
      assert.strictEqual(summary.activeUsers, 4085);
      assert.strictEqual(summary.blockedUsers, 120);
      assert.strictEqual(summary.activePercentage, 97.1);
      assert.strictEqual(summary.blockedPercentage, 2.9);
      assert.strictEqual(summary.uniqueFacilities, 2911);
      assert.strictEqual(summary.uniqueHealthRegions, 13);
      assert.strictEqual(summary.uniqueProvinces, 77);
    });

    it('should compute accurate filtered KPI summary', () => {
      const summary = repo.getSummary({ healthRegion: 'เขต 10' });
      assert.strictEqual(summary.totalUsers, 159);
      assert.strictEqual(summary.uniqueHealthRegions, 1);
      assert.ok(summary.activeUsers > 0);
      assert.ok(summary.uniqueFacilities > 0);
    });
  });

  describe('Filtering and Search', () => {
    it('should filter by healthRegion', () => {
      const results = repo.filter({ healthRegion: 'เขต 1' });
      assert.strictEqual(results.length, 543);
      assert.ok(results.every((r) => r.healthRegion === 'เขต 1'));
    });

    it('should filter by province and hospitalLevel together', () => {
      const results = repo.filter({ province: 'เชียงใหม่', hospitalLevel: 'รพช.' });
      assert.ok(results.length > 0);
      assert.ok(results.every((r) => r.province === 'เชียงใหม่' && r.hospitalLevel === 'รพช.'));
    });

    it('should filter by position', () => {
      const results = repo.filter({ cleanedPosition: 'พยาบาลวิชาชีพ' });
      assert.ok(results.length > 0);
      assert.ok(results.every((r) => r.cleanedPosition === 'พยาบาลวิชาชีพ'));
    });

    it('should filter by status and isActive', () => {
      const blocked = repo.filter({ isActive: false });
      assert.strictEqual(blocked.length, 120);
      assert.ok(blocked.every((r) => !r.isActive));
    });

    it('should search by keyword matching hospital name, user id, or province', () => {
      const byId = repo.filter({ q: '1092701' });
      assert.ok(byId.length >= 1);
      assert.strictEqual(byId[0].userId, '1092701');

      const byHospital = repo.filter({ q: 'ยางชุมน้อย' });
      assert.ok(byHospital.length > 0);
      assert.ok(byHospital.some((r) => r.hospitalName.includes('ยางชุมน้อย')));
    });
  });

  describe('Filter Values & Chart Aggregations', () => {
    it('should return 13 naturally sorted health regions', () => {
      const filters = repo.getDistinctFilterValues();
      assert.strictEqual(filters.healthRegions.length, 13);
      assert.strictEqual(filters.healthRegions[0], 'เขต 1');
      assert.strictEqual(filters.healthRegions[1], 'เขต 2');
      assert.strictEqual(filters.healthRegions[9], 'เขต 10');
      assert.strictEqual(filters.healthRegions[12], 'เขต 13');
    });

    it('should produce chart series for regions, hospital levels, positions, and status', () => {
      const charts = repo.getChartsData();
      assert.ok(charts.regions.labels.length === 13);
      assert.ok(charts.regions.data.length === 13);
      assert.ok(charts.hospitalLevels.labels.length > 0);
      assert.ok(charts.positions.labels.length <= 10);
      assert.ok(charts.status.labels.length > 0);
    });
  });

  describe('Pagination & Sorting', () => {
    it('should paginate records correctly', () => {
      const page1 = repo.getPaginatedRecords({ page: 1, limit: 10 });
      assert.strictEqual(page1.data.length, 10);
      assert.strictEqual(page1.pagination.page, 1);
      assert.strictEqual(page1.pagination.limit, 10);
      assert.strictEqual(page1.pagination.total, 4205);
      assert.strictEqual(page1.pagination.totalPages, 421);

      const page2 = repo.getPaginatedRecords({ page: 2, limit: 10 });
      assert.strictEqual(page2.data.length, 10);
      assert.notStrictEqual(page1.data[0].userId, page2.data[0].userId);
    });

    it('should sort records ascending and descending', () => {
      const asc = repo.getPaginatedRecords({ page: 1, limit: 10, sort: 'userId', order: 'asc' });
      const desc = repo.getPaginatedRecords({ page: 1, limit: 10, sort: 'userId', order: 'desc' });
      assert.notStrictEqual(asc.data[0].userId, desc.data[0].userId);
    });
  });

  describe('CSV Export', () => {
    it('should export filtered data to CSV with UTF-8 BOM and headers', () => {
      const csv = repo.toCsv({ healthRegion: 'เขต 13' });
      assert.ok(csv.startsWith('\uFEFFวันที่บันทึก,รหัสผู้ใช้งาน,ชื่อหน่วยงาน'));
      const lines = csv.trim().split('\r\n');
      // Header + 27 records for เขต 13 = 28 lines
      assert.strictEqual(lines.length, 28);
    });
  });

  describe('Feature 1: Province Analytics for Thailand Map', () => {
    it('should calculate accurate user counts and level breakdowns for all 77 provinces', () => {
      const analytics = repo.getProvinceAnalytics();
      assert.ok(analytics.provinces);
      const provNames = Object.keys(analytics.provinces);
      assert.strictEqual(provNames.length, 77);
      assert.ok(analytics.maxUsers > 0);

      // Check specific province (e.g. เชียงใหม่)
      const cm = analytics.provinces['เชียงใหม่'];
      assert.ok(cm);
      assert.strictEqual(cm.province, 'เชียงใหม่');
      assert.strictEqual(cm.healthRegion, 'เขต 1');
      assert.strictEqual(cm.totalUsers, 304);
      assert.strictEqual(cm.activeUsers, 281);
      assert.strictEqual(cm.blockedUsers, 23);
      assert.ok(cm.facilityLevels['รพ.สต.'] > 0);
      assert.ok(cm.facilityLevels['รพช.'] > 0);
    });

    it('should filter province analytics by active filters', () => {
      const filtered = repo.getProvinceAnalytics({ healthRegion: 'เขต 10' });
      const provNames = Object.keys(filtered.provinces);
      // เขต 10 provinces in Thailand: อุบลราชธานี, ศรีสะเกษ, ยโสธร, อำนาจเจริญ, มุกดาหาร
      assert.ok(provNames.length <= 5);
      assert.ok(provNames.includes('ศรีสะเกษ'));
      assert.ok(!provNames.includes('เชียงใหม่'));
    });
  });

  describe('Feature 2: Facility Aggregation Table', () => {
    it('should group records by facility and calculate user counts correctly', () => {
      const result = repo.getFacilityAggregations({ page: 1, limit: 10, sort: 'userCount', order: 'desc' });
      assert.strictEqual(result.data.length, 10);
      assert.strictEqual(result.pagination.total, 2911);

      const top = result.data[0];
      assert.ok(top.hospitalCode);
      assert.ok(top.hospitalName);
      assert.ok(top.healthRegion);
      assert.ok(top.province);
      assert.ok(top.district);
      assert.ok(top.hospitalLevel);
      assert.ok(top.userCount >= 1);
      assert.ok(top.activeUsers >= 0);
      assert.ok(top.blockedUsers >= 0);
    });

    it('should support pagination and sorting by different columns', () => {
      const byName = repo.getFacilityAggregations({ sort: 'hospitalName', order: 'asc', limit: 5 });
      assert.strictEqual(byName.data.length, 5);

      const byCode = repo.getFacilityAggregations({ sort: 'hospitalCode', order: 'asc', limit: 5 });
      assert.strictEqual(byCode.data.length, 5);
    });

    it('should export facility aggregations to CSV with UTF-8 BOM and headers', () => {
      const csv = repo.toFacilityCsv({ healthRegion: 'เขต 13' });
      assert.ok(csv.startsWith('\uFEFFรหัสสถานพยาบาล,ชื่อสถานพยาบาล / หน่วยงาน,เขตสุขภาพ,จังหวัด,อำเภอ,ระดับสถานพยาบาล,จำนวนผู้ใช้งานทั้งหมด'));
      const lines = csv.trim().split('\r\n');
      assert.ok(lines.length > 1);
    });
  });

  describe('Feature: Cascading District & Subdistrict Filters', () => {
    it('should return districts scoped to selected province', () => {
      const res = repo.getDistinctFilterValues({ province: 'เชียงใหม่' });
      assert.ok(Array.isArray(res.districts));
      assert.ok(res.districts.length > 0);
      assert.ok(res.districts.includes('เมืองเชียงใหม่'));
      assert.ok(!res.districts.includes('เมืองขอนแก่น'));
    });

    it('should return subdistricts scoped to selected district and province', () => {
      const res = repo.getDistinctFilterValues({ province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' });
      assert.ok(Array.isArray(res.subdistricts));
      assert.ok(res.subdistricts.length > 0);
    });

    it('should filter records by district and subdistrict', () => {
      const filtered = repo.filter({ province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' });
      assert.ok(filtered.length > 0);
      assert.ok(filtered.every((r) => r.province === 'เชียงใหม่' && r.district === 'เมืองเชียงใหม่'));
    });
  });

  describe('Feature: Health Region Summary Table', () => {
    it('should aggregate records by health region with all required metrics', () => {
      const result = repo.getRegionAggregations({ sort: 'healthRegion', order: 'asc' });
      assert.strictEqual(result.pagination.total, 13);
      assert.strictEqual(result.data.length, 13);

      const reg1 = result.data[0];
      assert.strictEqual(reg1.healthRegion, 'เขต 1');
      assert.ok(reg1.totalProvinces > 0);
      assert.ok(reg1.totalFacilities > 0);
      assert.ok(reg1.totalUsers > 0);
      assert.ok(reg1.activeUsers > 0);
      assert.ok(reg1.facilityLevels);
    });

    it('should export region summary to CSV with UTF-8 BOM', () => {
      const csv = repo.toRegionCsv();
      assert.ok(csv.startsWith('\uFEFFเขตสุขภาพ,จำนวนจังหวัด,จำนวนหน่วยงาน/สถานพยาบาล,จำนวนผู้ใช้งานทั้งหมด'));
      const lines = csv.trim().split('\r\n');
      // Header + 13 regions = 14 lines
      assert.strictEqual(lines.length, 14);
    });
  });

  describe('Feature: Province Summary Table', () => {
    it('should aggregate records by province with all required metrics', () => {
      const result = repo.getProvinceAggregations({ sort: 'totalUsers', order: 'desc', limit: 10 });
      assert.strictEqual(result.pagination.total, 77);
      assert.strictEqual(result.data.length, 10);

      const top = result.data[0];
      assert.ok(top.province);
      assert.ok(top.healthRegion);
      assert.ok(top.totalDistricts > 0);
      assert.ok(top.totalFacilities > 0);
      assert.ok(top.totalUsers > 0);
      assert.ok(top.facilityLevels);
    });

    it('should export province summary to CSV with UTF-8 BOM', () => {
      const csv = repo.toProvinceCsv();
      assert.ok(csv.startsWith('\uFEFFจังหวัด,เขตสุขภาพ,จำนวนอำเภอ,จำนวนหน่วยงาน/สถานพยาบาล,จำนวนผู้ใช้งานทั้งหมด'));
      const lines = csv.trim().split('\r\n');
      // Header + 77 provinces = 78 lines
      assert.strictEqual(lines.length, 78);
    });
  });

  describe('Feature: Year and Month Filters', () => {
    it('should return available years and months from getDistinctFilterValues', () => {
      const distinct = repo.getDistinctFilterValues();
      assert.ok(Array.isArray(distinct.years));
      assert.deepStrictEqual(distinct.years, [2567, 2568, 2569]);
      assert.ok(Array.isArray(distinct.months));
      assert.strictEqual(distinct.months.length, 12);
    });

    it('should return cascading months for selected year', () => {
      const distinct2026 = repo.getDistinctFilterValues({ year: 2026 });
      assert.ok(Array.isArray(distinct2026.months));
      assert.ok(distinct2026.months.includes(1));
      assert.ok(distinct2026.months.includes(9));
      assert.ok(!distinct2026.months.includes(10)); // 2026 dataset only has up to month 9
    });

    it('should filter records by year alone', () => {
      const filtered2024 = repo.filter({ year: 2024 });
      assert.ok(filtered2024.length > 0);
      assert.ok(filtered2024.every((r) => r.yearCE === 2024 || r.yearBE === 2567));
    });

    it('should filter records by year and month together', () => {
      const filteredJan2024 = repo.filter({ year: 2024, month: 1 });
      assert.strictEqual(filteredJan2024.length, 873);
      assert.ok(filteredJan2024.every((r) => (r.yearCE === 2024 || r.yearBE === 2567) && r.month === 1));
    });
  });

  describe('Feature: User Registration Trend Chart', () => {
    it('should produce monthly time-series trend across all years', () => {
      const charts = repo.getChartsData();
      assert.ok(charts.registrationTrend);
      const trend = charts.registrationTrend;
      assert.strictEqual(trend.granularity, 'monthly');
      assert.ok(trend.labels.length > 0);
      assert.ok(trend.newUsers.length === trend.labels.length);
      assert.ok(trend.cumulativeUsers.length === trend.labels.length);
      // Final cumulative sum matches records with valid dates
      assert.strictEqual(trend.cumulativeUsers[trend.cumulativeUsers.length - 1], trend.totalWithDates);
      assert.strictEqual(trend.total, 4205);
      assert.strictEqual(trend.totalWithDates, 4204);
    });

    it('should produce 12-month series when filtered by year', () => {
      const charts = repo.getChartsData({ year: 2024 });
      const trend = charts.registrationTrend;
      assert.strictEqual(trend.granularity, 'monthly');
      assert.strictEqual(trend.labels.length, 12);
      assert.strictEqual(trend.newUsers[0], 873); // Jan 2024
      assert.strictEqual(trend.cumulativeUsers[11], trend.total);
    });

    it('should produce daily time-series when filtered by month', () => {
      const charts = repo.getChartsData({ year: 2024, month: 1 });
      const trend = charts.registrationTrend;
      assert.strictEqual(trend.granularity, 'daily');
      assert.strictEqual(trend.labels.length, 31); // Jan has 31 days
      assert.strictEqual(trend.total, 873);
      assert.strictEqual(trend.cumulativeUsers[30], 873);
    });
  });
});
