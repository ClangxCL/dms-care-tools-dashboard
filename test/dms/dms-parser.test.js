import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDmsExcel } from '../../src/dms/dms-parser.js';
import { DmsRecord, normalizeRawRow } from '../../src/dms/dms-record.js';

describe('DMS Excel Parser & Normalizer', () => {
  it('should parse DMS_Care_Tools_Cleaned_Ready.xlsx and return all 4,203 rows', () => {
    const records = parseDmsExcel();
    assert.ok(Array.isArray(records));
    assert.strictEqual(records.length, 4203);

    const first = records[0];
    assert.ok(first instanceof DmsRecord);
    assert.strictEqual(first.userId, '1092701');
    assert.strictEqual(first.hospitalName, 'โรงพยาบาลยางชุมน้อย');
    assert.strictEqual(first.hospitalCode, '10927');
    assert.strictEqual(first.cleanedPosition, 'พยาบาลวิชาชีพ');
    assert.strictEqual(first.healthRegion, 'เขต 10');
    assert.strictEqual(first.province, 'ศรีสะเกษ');
    assert.strictEqual(first.hospitalLevel, 'รพช.');
    assert.strictEqual(first.status, 'ปกติ / Active');
    assert.strictEqual(first.isActive, true);
  });

  it('should trim whitespace around regions, provinces, and positions', () => {
    const raw = {
      'วันที่บันทึก': ' 10/1/2024 ',
      'รหัสผู้ใช้งาน': ' 9999 ',
      'ชื่อหน่วยงาน': ' โรงพยาบาลทดสอบ ',
      'รหัสสถานพยาบาล': ' 12345 ',
      'ตำแหน่ง (ปรับปรุงแล้ว)': ' เภสัชกร ',
      'ตำแหน่งเดิม': ' เภสัชกรปฏิบัติการ ',
      'เขตสุขภาพ': ' เขต 4 ',
      'จังหวัด': ' สระบุรี ',
      'อำเภอ': ' เมือง ',
      'ตำบล': ' ปากเพรียว ',
      'ระดับสถานพยาบาล': ' รพท. ',
      'สังกัด': ' สป ',
      'สถานะการใช้งาน': ' ปกติ / Active ',
      'หมายเหตุการบล็อก': '   ',
    };

    const record = normalizeRawRow(raw);
    assert.strictEqual(record.healthRegion, 'เขต 4');
    assert.strictEqual(record.province, 'สระบุรี');
    assert.strictEqual(record.cleanedPosition, 'เภสัชกร');
    assert.strictEqual(record.status, 'ปกติ / Active');
    assert.strictEqual(record.isActive, true);
    assert.strictEqual(record.blockReason, null);
    assert.strictEqual(record.year, 2024);
    assert.strictEqual(record.month, 1);
    assert.strictEqual(record.day, 10);
    assert.strictEqual(record.yearMonth, '2024-01');
    assert.strictEqual(record.dateKey, '2024-01-10');
  });

  it('should recognize blocked and retired accounts as inactive', () => {
    const blockedRaw = {
      'สถานะการใช้งาน': 'บล็อก/ไม่ได้รับผิดชอบงานแล้ว',
      'หมายเหตุการบล็อก': 'ย้ายหน่วยงาน',
    };
    const blockedRecord = normalizeRawRow(blockedRaw);
    assert.strictEqual(blockedRecord.isActive, false);
    assert.strictEqual(blockedRecord.blockReason, 'ย้ายหน่วยงาน');

    const retiredRaw = {
      'สถานะการใช้งาน': 'เกษียณ(บล็อก)',
    };
    const retiredRecord = normalizeRawRow(retiredRaw);
    assert.strictEqual(retiredRecord.isActive, false);
  });

  it('should throw an error if the excel file does not exist', () => {
    assert.throws(
      () => parseDmsExcel('non_existent_file.xlsx'),
      /DMS Excel file not found/
    );
  });
});
