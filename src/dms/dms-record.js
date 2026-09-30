/**
 * Normalized DMS Care Tools Record model.
 */
export class DmsRecord {
  constructor({
    recordedAt = '',
    userId = '',
    hospitalName = '',
    hospitalCode = '',
    cleanedPosition = '',
    originalPosition = '',
    healthRegion = '',
    province = '',
    district = '',
    subdistrict = '',
    hospitalLevel = '',
    affiliation = '',
    status = '',
    blockReason = null,
  } = {}) {
    this.recordedAt = recordedAt ? String(recordedAt).trim() : '';
    this.userId = userId ? String(userId).trim() : '';
    this.hospitalName = hospitalName ? String(hospitalName).trim() : '';
    this.hospitalCode = hospitalCode ? String(hospitalCode).trim() : '';
    this.cleanedPosition = cleanedPosition ? String(cleanedPosition).trim() : '';
    this.originalPosition = originalPosition ? String(originalPosition).trim() : '';
    this.healthRegion = healthRegion ? String(healthRegion).trim() : '';
    this.province = province ? String(province).trim() : '';
    this.district = district ? String(district).trim() : '';
    this.subdistrict = subdistrict ? String(subdistrict).trim() : '';
    this.hospitalLevel = hospitalLevel ? String(hospitalLevel).trim() : '';
    this.affiliation = affiliation ? String(affiliation).trim() : '';
    this.status = status ? String(status).trim() : '';
    this.blockReason = blockReason && String(blockReason).trim() ? String(blockReason).trim() : null;
    
    // Derived flag for fast status checks
    this.isActive = this.status.toLowerCase().includes('active') || this.status.includes('ปกติ');

    // Parsed temporal dimensions from recordedAt (e.g. "10/1/2024, 9:52:44")
    this.year = null;
    this.month = null;
    this.day = null;
    this.yearMonth = null;
    this.dateKey = null;

    if (this.recordedAt) {
      let match = this.recordedAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        this.day = parseInt(match[1], 10);
        this.month = parseInt(match[2], 10);
        this.year = parseInt(match[3], 10);
      } else {
        match = this.recordedAt.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (match) {
          this.year = parseInt(match[1], 10);
          this.month = parseInt(match[2], 10);
          this.day = parseInt(match[3], 10);
        }
      }

      if (this.year && this.month) {
        const mm = String(this.month).padStart(2, '0');
        const dd = this.day ? String(this.day).padStart(2, '0') : '01';
        this.yearMonth = `${this.year}-${mm}`;
        this.dateKey = `${this.year}-${mm}-${dd}`;
      }
    }
  }

  toJSON() {
    return {
      recordedAt: this.recordedAt,
      year: this.year,
      month: this.month,
      day: this.day,
      yearMonth: this.yearMonth,
      dateKey: this.dateKey,
      userId: this.userId,
      hospitalName: this.hospitalName,
      hospitalCode: this.hospitalCode,
      cleanedPosition: this.cleanedPosition,
      originalPosition: this.originalPosition,
      healthRegion: this.healthRegion,
      province: this.province,
      district: this.district,
      subdistrict: this.subdistrict,
      hospitalLevel: this.hospitalLevel,
      affiliation: this.affiliation,
      status: this.status,
      blockReason: this.blockReason,
      isActive: this.isActive,
    };
  }
}

/**
 * Normalizes raw row object from Excel sheet into a typed DmsRecord.
 * @param {Object} raw - Raw key-value row from Excel
 * @returns {DmsRecord}
 */
export function normalizeRawRow(raw) {
  if (!raw || typeof raw !== 'object') {
    return new DmsRecord();
  }

  // Handle Thai headers from DMS_Care_Tools_Cleaned_Ready.xlsx
  const recordedAt = raw['วันที่บันทึก'] ?? raw.recordedAt ?? '';
  const userId = raw['รหัสผู้ใช้งาน'] ?? raw.userId ?? '';
  const hospitalName = raw['ชื่อหน่วยงาน'] ?? raw.hospitalName ?? '';
  const hospitalCode = raw['รหัสสถานพยาบาล'] ?? raw.hospitalCode ?? '';
  const cleanedPosition = raw['ตำแหน่ง (ปรับปรุงแล้ว)'] ?? raw.cleanedPosition ?? '';
  const originalPosition = raw['ตำแหน่งเดิม'] ?? raw.originalPosition ?? '';
  const healthRegion = raw['เขตสุขภาพ'] ?? raw.healthRegion ?? '';
  const province = raw['จังหวัด'] ?? raw.province ?? '';
  const district = raw['อำเภอ'] ?? raw.district ?? '';
  const subdistrict = raw['ตำบล'] ?? raw.subdistrict ?? '';
  const hospitalLevel = raw['ระดับสถานพยาบาล'] ?? raw.hospitalLevel ?? '';
  const affiliation = raw['สังกัด'] ?? raw.affiliation ?? '';
  const status = raw['สถานะการใช้งาน'] ?? raw.status ?? '';
  const blockReason = raw['หมายเหตุการบล็อก'] ?? raw.blockReason ?? null;

  return new DmsRecord({
    recordedAt,
    userId,
    hospitalName,
    hospitalCode,
    cleanedPosition,
    originalPosition,
    healthRegion,
    province,
    district,
    subdistrict,
    hospitalLevel,
    affiliation,
    status,
    blockReason,
  });
}
