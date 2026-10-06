/**
 * API Service สำหรับติดต่อ Google Apps Script
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
   * ดึงข้อมูลทั้งหมดจาก Google Sheets ผ่าน Apps Script
   */
  async fetchAllData() {
    const url = this.getApiUrl();
    if (!this.isConfigured()) {
      return { source: "demo", data: CONFIG.DEMO_DATA };
    }

    try {
      const response = await fetch(`${url}?action=getAllData&_t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const result = await response.json();

      if (result.status === "success") {
        const hasLiveCurriculums = result.data.curriculums && result.data.curriculums.length > 0;
        
        // ถ้าชีตยังมีข้อมูลว่างเปล่า ให้ใช้ข้อมูลเริ่มต้น (Demo/Preset) มาแสดงก่อน
        return {
          source: hasLiveCurriculums ? "live" : "live_empty",
          data: {
            curriculums: hasLiveCurriculums ? result.data.curriculums : CONFIG.DEMO_DATA.curriculums,
            sarReports: (result.data.sarReports && result.data.sarReports.length > 0) ? result.data.sarReports : CONFIG.DEMO_DATA.sarReports,
            studentStats: (result.data.studentStats && result.data.studentStats.length > 0) ? result.data.studentStats : CONFIG.DEMO_DATA.studentStats,
            faculty: (result.data.faculty && result.data.faculty.length > 0) ? result.data.faculty : CONFIG.DEMO_DATA.faculty,
            tracking: (result.data.tracking && result.data.tracking.length > 0) ? result.data.tracking : CONFIG.DEMO_DATA.tracking
          }
        };
      } else {
        throw new Error(result.message || "Unknown error from Apps Script");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสด:", err);
      return {
        source: "demo",
        error: err.message,
        data: CONFIG.DEMO_DATA
      };
    }
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
        message: "บันทึกในโหมดทดลอง (Demo Mode) สำเร็จ"
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

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", err);
      throw err;
    }
  },

  /**
   * ทดสอบการเชื่อมต่อ Apps Script
   */
  async testConnection(testUrl) {
    const url = testUrl || this.getApiUrl();
    if (!url || !url.startsWith("https://script.google.com")) {
      return { success: false, message: "URL ต้องขึ้นต้นด้วย https://script.google.com" };
    }

    try {
      const res = await fetch(`${url}?action=getCurriculums&_t=${Date.now()}`);
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
