import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DmsRepository } from './dms-repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
};

/**
 * Extracts filter parameters from URLSearchParams.
 * @param {URLSearchParams} searchParams
 * @returns {Object}
 */
export function extractFilterParams(searchParams) {
  const filters = {};
  const allowedKeys = [
    'healthRegion',
    'province',
    'district',
    'subdistrict',
    'hospitalLevel',
    'cleanedPosition',
    'position',
    'affiliation',
    'facility',
    'hospitalName',
    'hospitalCode',
    'status',
    'year',
    'yearBE',
    'yearCE',
    'month',
    'yearMonth',
    'q',
    'query',
  ];

  for (const key of allowedKeys) {
    const val = searchParams.get(key);
    if (val && val.trim() !== '') {
      filters[key] = val.trim();
    }
  }

  const isActiveParam = searchParams.get('isActive');
  if (isActiveParam !== null && isActiveParam !== '') {
    if (isActiveParam === 'true' || isActiveParam === '1') {
      filters.isActive = true;
    } else if (isActiveParam === 'false' || isActiveParam === '0') {
      filters.isActive = false;
    }
  }

  return filters;
}

/**
 * Creates the DMS HTTP server.
 * @param {Object} [options={}]
 * @param {DmsRepository} [options.repo]
 * @param {string} [options.filePath]
 * @param {string} [options.publicDir]
 * @returns {http.Server}
 */
export function createDmsServer(options = {}) {
  const repo = options.repo || new DmsRepository().loadFromFile(options.filePath);
  const publicDir = options.publicDir || path.resolve(__dirname, '../../public');

  const server = http.createServer((req, res) => {
    // Set default CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url, `http://${host}`);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    // API Routes
    if (pathname.startsWith('/api/dms/')) {
      const filters = extractFilterParams(searchParams);

      if (pathname === '/api/dms/summary') {
        const summary = repo.getSummary(filters);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(summary));
        return;
      }

      if (pathname === '/api/dms/filters') {
        const distinctValues = repo.getDistinctFilterValues(filters);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(distinctValues));
        return;
      }

      if (pathname === '/api/dms/charts') {
        const chartsData = repo.getChartsData(filters);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(chartsData));
        return;
      }

      if (pathname === '/api/dms/records') {
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 25;
        const sort = searchParams.get('sort') || 'recordedAt';
        const order = searchParams.get('order') || 'desc';

        const result = repo.getPaginatedRecords({
          filters,
          page,
          limit,
          sort,
          order,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/dms/export') {
        const csvContent = repo.toCsv(filters);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dms_care_tools_${timestamp}.csv"`,
        });
        res.end(csvContent);
        return;
      }

      if (pathname === '/api/dms/provinces') {
        const provinceAnalytics = repo.getProvinceAnalytics(filters);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(provinceAnalytics));
        return;
      }

      if (pathname === '/api/dms/facilities') {
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 25;
        const sort = searchParams.get('sort') || 'userCount';
        const order = searchParams.get('order') || 'desc';

        const result = repo.getFacilityAggregations({
          filters,
          page,
          limit,
          sort,
          order,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/dms/facilities/export') {
        const csvContent = repo.toFacilityCsv(filters);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dms_facilities_${timestamp}.csv"`,
        });
        res.end(csvContent);
        return;
      }

      if (pathname === '/api/dms/regions') {
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 25;
        const sort = searchParams.get('sort') || 'healthRegion';
        const order = searchParams.get('order') || 'asc';

        const result = repo.getRegionAggregations({
          filters,
          page,
          limit,
          sort,
          order,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/dms/regions/export') {
        const csvContent = repo.toRegionCsv(filters);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dms_regions_${timestamp}.csv"`,
        });
        res.end(csvContent);
        return;
      }

      if (pathname === '/api/dms/province-summary') {
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 25;
        const sort = searchParams.get('sort') || 'totalUsers';
        const order = searchParams.get('order') || 'desc';

        const result = repo.getProvinceAggregations({
          filters,
          page,
          limit,
          sort,
          order,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/dms/province-summary/export') {
        const csvContent = repo.toProvinceCsv(filters);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dms_provinces_${timestamp}.csv"`,
        });
        res.end(csvContent);
        return;
      }

      if (pathname === '/api/dms/positions') {
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 25;
        const sort = searchParams.get('sort') || 'totalUsers';
        const order = searchParams.get('order') || 'desc';

        const result = repo.getPositionAggregations({
          filters,
          page,
          limit,
          sort,
          order,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/dms/positions/export') {
        const csvContent = repo.toPositionCsv(filters);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dms_positions_${timestamp}.csv"`,
        });
        res.end(csvContent);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'DMS API endpoint not found' }));
      return;
    }

    // Static Asset Serving
    let safePath = pathname === '/' || pathname === '/dashboard' ? '/index.html' : pathname;
    const resolvedFilePath = path.join(publicDir, safePath);

    // Prevent directory traversal
    if (!resolvedFilePath.startsWith(publicDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    fs.stat(resolvedFilePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for dashboard navigation
        const fallbackPath = path.join(publicDir, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, data) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
        return;
      }

      const ext = path.extname(resolvedFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Support HTTP Range requests for video and audio streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunkSize = (end - start) + 1;
        const stream = fs.createReadStream(resolvedFilePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });
        stream.pipe(res);
        return;
      }

      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Length': stats.size,
        });
        res.end();
        return;
      }

      fs.readFile(resolvedFilePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Length': stats.size,
        });
        res.end(data);
      });
    });
  });

  return server;
}

// Start server if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3000;
  const server = createDmsServer();
  server.listen(PORT, () => {
    console.log(`DMS Care Tools Interactive Dashboard running on http://localhost:${PORT}`);
  });
}
