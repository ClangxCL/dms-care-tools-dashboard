import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDmsServer } from '../../src/dms/dms-server.js';
import { DmsRepository } from '../../src/dms/dms-repository.js';

describe('DMS Server & REST API Routes', () => {
  let server;
  let baseUrl;

  before(async () => {
    const repo = new DmsRepository().loadFromFile();
    server = createDmsServer({ repo });
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET / should serve the dashboard index.html', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/html'));
    const text = await res.text();
    assert.ok(text.includes('DMS Care Tools Dashboard'));
  });

  it('GET /style.css should serve the stylesheet', async () => {
    const res = await fetch(`${baseUrl}/style.css`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/css'));
  });

  it('GET /app.js should serve the client script', async () => {
    const res = await fetch(`${baseUrl}/app.js`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('javascript'));
  });

  it('GET /api/dms/summary should return global KPI metrics', async () => {
    const res = await fetch(`${baseUrl}/api/dms/summary`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.totalUsers, 4203);
    assert.strictEqual(data.activeUsers, 4096);
    assert.strictEqual(data.blockedUsers, 107);
    assert.strictEqual(data.uniqueHealthRegions, 13);
  });

  it('GET /api/dms/summary with filters should return scoped metrics', async () => {
    const res = await fetch(`${baseUrl}/api/dms/summary?healthRegion=%E0%B9%80%E0%B8%82%E0%B8%95%2010`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.totalUsers, 159);
    assert.strictEqual(data.uniqueHealthRegions, 1);
  });

  it('GET /api/dms/filters should return distinct options', async () => {
    const res = await fetch(`${baseUrl}/api/dms/filters`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.healthRegions));
    assert.ok(Array.isArray(data.provinces));
    assert.ok(Array.isArray(data.hospitalLevels));
    assert.ok(Array.isArray(data.positions));
    assert.ok(Array.isArray(data.statuses));
  });

  it('GET /api/dms/charts should return aggregated series', async () => {
    const res = await fetch(`${baseUrl}/api/dms/charts`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.regions && data.regions.labels);
    assert.ok(data.hospitalLevels && data.hospitalLevels.labels);
    assert.ok(data.positions && data.positions.labels);
    assert.ok(data.status && data.status.labels);
  });

  it('GET /api/dms/records should return paginated records', async () => {
    const res = await fetch(`${baseUrl}/api/dms/records?page=1&limit=15`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.length, 15);
    assert.strictEqual(data.pagination.page, 1);
    assert.strictEqual(data.pagination.limit, 15);
    assert.strictEqual(data.pagination.total, 4203);
  });

  it('GET /api/dms/export should return CSV attachment with UTF-8 BOM', async () => {
    const res = await fetch(`${baseUrl}/api/dms/export?healthRegion=%E0%B9%80%E0%B8%82%E0%B8%95%2013`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('attachment; filename='));

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    // Check UTF-8 BOM bytes EF BB BF
    assert.strictEqual(buf[0], 0xef);
    assert.strictEqual(buf[1], 0xbb);
    assert.strictEqual(buf[2], 0xbf);

    const csvText = buf.toString('utf8');
    assert.ok(csvText.includes('วันที่บันทึก,รหัสผู้ใช้งาน,ชื่อหน่วยงาน'));
  });

  it('GET /api/dms/provinces should return 77 provinces analytics', async () => {
    const res = await fetch(`${baseUrl}/api/dms/provinces`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.provinces);
    assert.strictEqual(Object.keys(data.provinces).length, 77);
    assert.ok(data.maxUsers > 0);
  });

  it('GET /api/dms/facilities should return paginated facility summaries', async () => {
    const res = await fetch(`${baseUrl}/api/dms/facilities?page=1&limit=10`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.length, 10);
    assert.strictEqual(data.pagination.total, 2911);
    assert.ok(data.data[0].hospitalCode);
    assert.ok(data.data[0].userCount >= 1);
  });

  it('GET /api/dms/facilities/export should return facility CSV attachment with UTF-8 BOM', async () => {
    const res = await fetch(`${baseUrl}/api/dms/facilities/export?healthRegion=%E0%B9%80%E0%B8%82%E0%B8%95%2013`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('attachment; filename="dms_facilities_'));

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    assert.strictEqual(buf[0], 0xef);
    assert.strictEqual(buf[1], 0xbb);
    assert.strictEqual(buf[2], 0xbf);

    const csvText = buf.toString('utf8');
    assert.ok(csvText.includes('รหัสสถานพยาบาล,ชื่อสถานพยาบาล / หน่วยงาน,เขตสุขภาพ'));
  });

  it('GET /thailand-provinces.geojson should serve geojson with correct mime type', async () => {
    const res = await fetch(`${baseUrl}/thailand-provinces.geojson`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/geo+json'));
    const data = await res.json();
    assert.strictEqual(data.features.length, 77);
  });

  it('GET /api/dms/filters with province should return cascading districts', async () => {
    const res = await fetch(`${baseUrl}/api/dms/filters?province=${encodeURIComponent('เชียงใหม่')}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.districts));
    assert.ok(data.districts.includes('เมืองเชียงใหม่'));
  });

  it('GET /api/dms/regions should return all 13 health regions summary', async () => {
    const res = await fetch(`${baseUrl}/api/dms/regions`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.pagination.total, 13);
    assert.strictEqual(data.data[0].healthRegion, 'เขต 1');
    assert.ok(data.data[0].totalProvinces > 0);
    assert.ok(data.data[0].totalFacilities > 0);
  });

  it('GET /api/dms/regions/export should return CSV attachment with UTF-8 BOM', async () => {
    const res = await fetch(`${baseUrl}/api/dms/regions/export`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('attachment; filename="dms_regions_'));

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    assert.strictEqual(buf[0], 0xef);
    assert.strictEqual(buf[1], 0xbb);
    assert.strictEqual(buf[2], 0xbf);

    const csvText = buf.toString('utf8');
    assert.ok(csvText.includes('เขตสุขภาพ,จำนวนจังหวัด,จำนวนหน่วยงาน/สถานพยาบาล'));
  });

  it('GET /api/dms/province-summary should return 77 provinces summary', async () => {
    const res = await fetch(`${baseUrl}/api/dms/province-summary?limit=10`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.pagination.total, 77);
    assert.strictEqual(data.data.length, 10);
    assert.ok(data.data[0].province);
    assert.ok(data.data[0].totalDistricts > 0);
  });

  it('GET /api/dms/province-summary/export should return CSV attachment with UTF-8 BOM', async () => {
    const res = await fetch(`${baseUrl}/api/dms/province-summary/export`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('attachment; filename="dms_provinces_'));

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    assert.strictEqual(buf[0], 0xef);
    assert.strictEqual(buf[1], 0xbb);
    assert.strictEqual(buf[2], 0xbf);

    const csvText = buf.toString('utf8');
    assert.ok(csvText.includes('จังหวัด,เขตสุขภาพ,จำนวนอำเภอ'));
  });

  it('GET /api/dms/filters with year should return cascading months', async () => {
    const res = await fetch(`${baseUrl}/api/dms/filters?year=2026`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.years));
    assert.ok(data.years.includes(2026));
    assert.ok(Array.isArray(data.months));
    assert.ok(data.months.includes(1));
    assert.ok(data.months.includes(9));
    assert.ok(!data.months.includes(10));
  });

  it('GET /api/dms/charts should return registrationTrend series', async () => {
    const res = await fetch(`${baseUrl}/api/dms/charts`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.registrationTrend);
    assert.strictEqual(data.registrationTrend.granularity, 'monthly');
    assert.ok(data.registrationTrend.labels.length > 0);
    assert.ok(data.registrationTrend.newUsers.length > 0);
    assert.ok(data.registrationTrend.cumulativeUsers.length > 0);
  });

  it('GET /api/dms/charts with year and month should return daily registrationTrend', async () => {
    const res = await fetch(`${baseUrl}/api/dms/charts?year=2024&month=1`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.registrationTrend);
    assert.strictEqual(data.registrationTrend.granularity, 'daily');
    assert.strictEqual(data.registrationTrend.labels.length, 31);
    assert.strictEqual(data.registrationTrend.total, 873);
  });

  it('GET /api/dms/unknown should return 404', async () => {
    const res = await fetch(`${baseUrl}/api/dms/unknown`);
    assert.strictEqual(res.status, 404);
  });
});
