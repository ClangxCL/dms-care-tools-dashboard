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
    rawYear = null,
    rawMonth = null,
    rawYearMonth = null,
  } = {}) {
    this.recordedAt = recordedAt && String(recordedAt).trim() !== '-' ? String(recordedAt).trim() : '';
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
    this.blockReason = blockReason && String(blockReason).trim() !== '-' && String(blockReason).trim()
      ? String(blockReason).trim()
      : null;
    
    // Derived flag for fast status checks
    this.isActive = this.status.toLowerCase().includes('active') || this.status.includes('ปกติ');

    // Temporal dimensions
    this.year = null;      // Standard year used for filtering (2567 or 2024)
    this.yearBE = null;    // Buddhist Era year (e.g. 2567)
    this.yearCE = null;    // Common Era year (e.g. 2024)
    this.month = null;     // Month integer 1-12
    this.day = null;
    this.yearMonth = null; // YYYY-MM
    this.dateKey = null;

    // 1. Direct fields from Excel (ปี_พศ, เดือน, ปี_เดือน_พศ) if available
    if (rawYear !== null && rawYear !== undefined && String(rawYear).trim() !== '-') {
      const parsedYear = parseInt(String(rawYear).trim(), 10);
      if (!isNaN(parsedYear)) {
        if (parsedYear > 2400) {
          this.yearBE = parsedYear;
          this.yearCE = parsedYear - 543;
          this.year = parsedYear;
        } else {
          this.yearCE = parsedYear;
          this.yearBE = parsedYear + 543;
          this.year = parsedYear;
        }
      }
    }

    if (rawMonth !== null && rawMonth !== undefined && String(rawMonth).trim() !== '-') {
      const parsedMonth = parseInt(String(rawMonth).trim(), 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        this.month = parsedMonth;
      }
    }

    if (rawYearMonth && String(rawYearMonth).trim() !== '-') {
      this.yearMonth = String(rawYearMonth).trim();
    }

    // 2. Parse recordedAt if temporal fields are not fully resolved
    if (this.recordedAt) {
      let match = this.recordedAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        this.day = parseInt(match[1], 10);
        const parsedM = parseInt(match[2], 10);
        const parsedY = parseInt(match[3], 10);
        if (!this.month) this.month = parsedM;
        if (!this.year) {
          if (parsedY > 2400) {
            this.yearBE = parsedY;
            this.yearCE = parsedY - 543;
            this.year = parsedY;
          } else {
            this.yearCE = parsedY;
            this.yearBE = parsedY + 543;
            this.year = parsedY;
          }
        }
      } else {
        match = this.recordedAt.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (match) {
          const parsedY = parseInt(match[1], 10);
          const parsedM = parseInt(match[2], 10);
          this.day = parseInt(match[3], 10);
          if (!this.month) this.month = parsedM;
          if (!this.year) {
            if (parsedY > 2400) {
              this.yearBE = parsedY;
              this.yearCE = parsedY - 543;
              this.year = parsedY;
            } else {
              this.yearCE = parsedY;
              this.yearBE = parsedY + 543;
              this.year = parsedY;
            }
          }
        }
      }
    }

    if (this.yearBE && this.month && !this.yearMonth) {
      const mm = String(this.month).padStart(2, '0');
      this.yearMonth = `${this.yearBE}-${mm}`;
    }

    if (this.year && this.month) {
      const mm = String(this.month).padStart(2, '0');
      const dd = this.day ? String(this.day).padStart(2, '0') : '01';
      this.dateKey = `${this.year}-${mm}-${dd}`;
    }
  }

  toJSON() {
    return {
      recordedAt: this.recordedAt,
      year: this.year,
      yearBE: this.yearBE,
      yearCE: this.yearCE,
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

  // Handle Thai headers from User_DMS_Cleaned_Ready.xlsx and DMS_Care_Tools_Cleaned_Ready.xlsx
  const recordedAt = raw['วันที่ลงทะเบียน'] ?? raw['วันที่บันทึก'] ?? raw.recordedAt ?? '';
  const userId = raw['รหัสผู้ใช้งาน'] ?? raw.userId ?? '';
  const hospitalName = raw['หน่วยงาน'] ?? raw['ชื่อหน่วยงาน'] ?? raw.hospitalName ?? '';
  const hospitalCode = raw['รหัสสถานพยาบาล'] ?? raw.hospitalCode ?? '';
  const cleanedPosition = raw['ตำแหน่ง'] ?? raw['ตำแหน่ง (ปรับปรุงแล้ว)'] ?? raw.cleanedPosition ?? '';
  const originalPosition = raw['ตำแหน่งเดิม'] ?? raw.originalPosition ?? '';
  const healthRegion = raw['เขตบริการสุขภาพ'] ?? raw['เขตสุขภาพ'] ?? raw.healthRegion ?? '';
  const province = raw['จังหวัด'] ?? raw.province ?? '';
  const district = raw['อำเภอ'] ?? raw.district ?? '';
  const subdistrict = raw['ตำบล'] ?? raw.subdistrict ?? '';
  const hospitalLevel = raw['ระดับสถานพยาบาล'] ?? raw.hospitalLevel ?? '';
  const affiliation = raw['สังกัด'] ?? raw.affiliation ?? '';
  const status = raw['สถานะการใช้งาน'] ?? raw.status ?? '';
  const blockReason = raw['วันที่ส่งบล็อก'] ?? raw['หมายเหตุการบล็อก'] ?? raw.blockReason ?? null;
  const rawYear = raw['ปี_พศ'] ?? raw.yearBE ?? raw.year ?? null;
  const rawMonth = raw['เดือน'] ?? raw.month ?? null;
  const rawYearMonth = raw['ปี_เดือน_พศ'] ?? raw.yearMonth ?? null;

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
    rawYear,
    rawMonth,
    rawYearMonth,
  });
}
