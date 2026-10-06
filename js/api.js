/**
 * API Service สำหรับติดต่อ Google Apps Script และ Google Sheets Live Data
 */
const ApiService = {
  getApiUrl() {
    const storedUrl = localStorage.getItem("AUN_QA_APPS_SCRIPT_URL");
    return (storedUrl && storedUrl.trim().length > 0) ? storedUrl.trim() : CONFIG.APPS_SCRIPT_URL;
  },

  setApiUrl(url) {
    if (url) {
      localStorage.setItem("AUN_QA_APPS_SCRIPT_URL", url.trim());
    } else {
      localStorage.removeItem("AUN_QA_APPS_SCRIPT_URL");
    }
  },

  isConfigured() {
    const url = this.getApiUrl();
    return Boolean(url && url.startsWith("https://script.google.com"));
  },

  /**
   * ดึงข้อมูลทั้งหมด:
   * 1. ลองดึงจาก Apps Script Web App URL ก่อนถ้ามีการตั้งค่า
   * 2. หากยังไม่ได้ตั้งค่า หรือ Apps Script มีปัญหา -> ดึงข้อมูลสดจาก Google Sheets CSV โดยตรง!
   */
  async fetchAllData() {
    // 1. ลองดึงผ่าน Apps Script ก่อนถ้าตั้งค่าไว้
    if (this.isConfigured()) {
      try {
        const url = this.getApiUrl();
        const response = await fetch(`${url}?action=getAllData&_t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && result.data && result.data.curriculums && result.data.curriculums.length > 0) {
            return { source: "live_script", data: result.data };
          }
        }
      } catch (scriptErr) {
        console.warn("Apps Script fetch error, falling back to Google Sheets direct CSV:", scriptErr);
      }
    }

    // 2. ดึงสดจาก Google Sheets CSV endpoints (แม่นยำ 100% ตรงกับสเปรดชีตเสมอ)
    try {
      const liveData = await this.fetchLiveFromGoogleSheets();
      if (liveData && liveData.curriculums && liveData.curriculums.length > 0) {
        return { source: "live_sheet", data: liveData };
      }
    } catch (sheetErr) {
      console.warn("Google Sheets direct CSV fetch error, falling back to preset data:", sheetErr);
    }

    // 3. Fallback สุดท้ายถ้าไม่มีเน็ต
    return { source: "preset", data: CONFIG.DEMO_DATA };
  },

  /**
   * อ่านข้อมูลสดจาก Google Spreadsheet ด้วย CSV Export โดยตรง
   * GID 0: รายชื่อหลักสูตร
   * GID 843378158: รายงาน SAR AUN-QA และเกณฑ์ 8 ข้อ
   * GID 1565794875: สถิตินักศึกษาตามรุ่น
   * GID 408425478: อาจารย์และผลงานวิชาการ
   */
  async fetchLiveFromGoogleSheets() {
    const base = "https://docs.google.com/spreadsheets/d/1V1RVt-2YWWApHWQeYmDqT1ttmZSIldLGgR84k7cW7Q4/export?format=csv&gid=";
    
    const [csvCur, csvSar, csvStd, csvFac] = await Promise.all([
      fetch(`${base}0&_t=${Date.now()}`).then(r => r.text()),
      fetch(`${base}843378158&_t=${Date.now()}`).then(r => r.text()),
      fetch(`${base}1565794875&_t=${Date.now()}`).then(r => r.text()),
      fetch(`${base}408425478&_t=${Date.now()}`).then(r => r.text())
    ]);

    const curriculums = this.parseCurriculumCSV(csvCur);
    const sarReports = this.parseSarCSV(csvSar);
    const studentStats = this.parseStudentCSV(csvStd);
    const faculty = this.parseFacultyCSV(csvFac);

    // สร้างตาราง tracking ให้ตรงกับหลักสูตรในฐานข้อมูล
    const tracking = curriculums.map(c => {
      const sar = sarReports.find(s => s.curriculumNameTh === c.nameTh);
      let criteriaCount = 0;
      let evidenceCount = 0;
      if (sar && sar.criteria) {
        sar.criteria.forEach(item => {
          if (item.score > 0) criteriaCount++;
          if (item.evidence && item.evidence.trim().length > 0) evidenceCount++;
        });
      }

      const percent = sar ? Math.round(((criteriaCount / 8) * 50) + ((evidenceCount / 8) * 50)) : 0;
      const status = percent >= 90 ? "ส่งรายงานแล้ว" : (percent > 0 ? "กำลังกรอกข้อมูล" : "ยังไม่เริ่ม");

      return {
        curriculumName: c.nameTh,
        degreeLevel: c.degreeLevel || "ป.ตรี",
        chairEmail: c.chairEmail || "-",
        status: status,
        completionPercent: percent,
        evidenceCount: `${evidenceCount}/8`,
        criteriaFilledCount: `${criteriaCount}/8`,
        overallScore: sar ? sar.overallScore : 0,
        submittedBy: c.chairEmail || "-",
        updatedAt: sar ? "2026-10-06" : "-",
        notes: percent >= 90 ? "ส่งรายงานและแนบหลักฐานครบถ้วน" : (percent > 0 ? "อยู่ระหว่างรวบรวมหลักฐาน" : "ยังไม่ได้ส่งรายงาน")
      };
    });

    return {
      curriculums,
      sarReports,
      studentStats,
      faculty,
      tracking
    };
  },

  // Parse CSV format into arrays
  parseCSV(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    let i = 0;

    for (let c of text) {
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if (c === '\n' && !inQuotes) {
        lines.push(row.map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
        row = [''];
      } else if (c !== '\r') {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row.map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
    }
    return lines;
  },

  parseCurriculumCSV(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length <= 2) return [];

    const list = [];
    // ข้าม 2 แถวแรกที่เป็น header
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0].length < 3) continue;
      list.push({
        rowIndex: i + 1,
        nameTh: r[0] || "",
        nameEn: r[1] || "",
        degreeLevel: r[2] || "ปริญญาตรี",
        revisionYear: r[3] || "2566",
        totalCredits: r[4] || "",
        chairEmail: r[5] || "",
        executiveSummary: r[6] || "",
        philosophy: r[7] || "",
        objectives: r[8] || "",
        ploContent: r[9] || "",
        ploEvidence: r[10] || "",
        ploScore: r[11] || ""
      });
    }
    return list;
  },

  parseSarCSV(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0].length < 3) continue;

      const criteria = [
        { id: 1, name: "ผลการเรียนรู้ที่คาดหวัง (Expected Learning Outcomes - PLOs)", content: r[5] || "", evidence: r[6] || "", score: parseFloat(r[7]) || 0 },
        { id: 2, name: "โครงสร้างและเนื้อหาหลักสูตร (Programme Structure & Content)", content: r[8] || "", evidence: r[9] || "", score: parseFloat(r[10]) || 0 },
        { id: 3, name: "การจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ (Teaching & Learning Approach)", content: r[11] || "", evidence: r[12] || "", score: parseFloat(r[13]) || 0 },
        { id: 4, name: "การประเมินผู้เรียน (Student Assessment)", content: r[14] || "", evidence: r[15] || "", score: parseFloat(r[16]) || 0 },
        { id: 5, name: "คุณภาพอาจารย์ (Academic Staff)", content: r[17] || "", evidence: r[18] || "", score: parseFloat(r[19]) || 0 },
        { id: 6, name: "การบริการและการสนับสนุนนักศึกษา (Student Support Services)", content: r[20] || "", evidence: r[21] || "", score: parseFloat(r[22]) || 0 },
        { id: 7, name: "สิ่งอำนวยความสะดวกและโครงสร้างพื้นฐาน (Facilities & Infrastructure)", content: r[23] || "", evidence: r[24] || "", score: parseFloat(r[25]) || 0 },
        { id: 8, name: "ผลลัพธ์การดำเนินงาน (Output & Outcomes)", content: r[26] || "", evidence: r[27] || "", score: parseFloat(r[28]) || 0 }
      ];

      list.push({
        rowIndex: i + 1,
        curriculumNameTh: r[0],
        academicYear: r[1] || "2566",
        executiveSummary: r[2] || "",
        philosophy: r[3] || "",
        objectives: r[4] || "",
        criteria: criteria,
        overallScore: parseFloat(r[29]) || 0,
        strengths: r[30] || "",
        improvements: r[31] || ""
      });
    }
    return list;
  },

  parseStudentCSV(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0].length < 3) continue;

      const y1 = parseInt(r[2]) || 0;
      const y2 = parseInt(r[3]) || 0;
      const y3 = parseInt(r[4]) || 0;
      const y4 = parseInt(r[5]) || 0;
      const yMore = parseInt(r[6]) || 0;
      const total = parseInt(r[7]) || (y1 + y2 + y3 + y4 + yMore);

      list.push({
        rowIndex: i + 1,
        curriculumNameTh: r[0],
        entryYear: r[1] || "2566",
        year1: y1,
        year2: y2,
        year3: y3,
        year4: y4,
        yearMore: yMore,
        total: total
      });
    }
    return list;
  },

  parseFacultyCSV(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || !r[1] || r[0].length < 3) continue;

      list.push({
        rowIndex: i + 1,
        curriculumNameTh: r[0],
        fullName: r[1],
        degree: r[2] || "",
        field: r[3] || "",
        publications: r[4] || "",
        referenceUrl: r[5] || ""
      });
    }
    return list;
  },

  /**
   * สั่งให้ Apps Script เติมข้อมูลเริ่มต้นลง Google Spreadsheet
   */
  async initSampleData() {
    const url = this.getApiUrl();
    if (!this.isConfigured()) throw new Error("กรุณาระบุ Web App URL ก่อน");

    const res = await fetch(`${url}?action=initSampleData&_t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  },

  /**
   * บันทึกข้อมูลไปยัง Google Apps Script
   */
  async postData(action, payload) {
    const url = this.getApiUrl();
    if (!this.isConfigured()) {
      return {
        status: "demo_success",
        message: "บันทึกในโหมดทดลอง (Demo Mode) สำเร็จ กรุณาระบุ Apps Script Web App URL เพื่อส่งข้อมูลลง Google Sheets จริง"
      };
    }

    try {
      const body = JSON.stringify({
        action: action,
        data: payload
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: body
      });

      return await response.json();
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", err);
      throw err;
    }
  },

  async testConnection(testUrl) {
    const url = testUrl || this.getApiUrl();
    if (!url || !url.startsWith("https://script.google.com")) {
      return { success: false, message: "URL ต้องขึ้นต้นด้วย https://script.google.com" };
    }

    try {
      const res = await fetch(`${url}?action=getAllData&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      if (data.status === "success") {
        return { success: true, message: "เชื่อมต่อกับ Google Apps Script สำเร็จแล้ว!" };
      }
      return { success: false, message: data.message || "ได้รับคำตอบแต่สถานะไม่สำเร็จ" };
    } catch (err) {
      return { success: false, message: "ไม่สามารถเชื่อมต่อได้: " + err.message };
    }
  }
};
