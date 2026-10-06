/**
 * ระบบสารสนเทศประกันคุณภาพหลักสูตร AUN-QA คณะศึกษาศาสตร์
 * Backend API & Web Application Handler
 * เชื่อมต่อกับ Google Spreadsheet ID: 1V1RVt-2YWWApHWQeYmDqT1ttmZSIldLGgR84k7cW7Q4
 */

var SPREADSHEET_ID = "1V1RVt-2YWWApHWQeYmDqT1ttmZSIldLGgR84k7cW7Q4";

var SHEET_GIDS = {
  CURRICULUM: "0",          // แผ่นงาน: รายชื่อหลักสูตร
  SAR: "843378158",         // แผ่นงาน: รายงาน SAR AUN-QA และเกณฑ์ 8 ข้อ
  STUDENTS: "1565794875",    // แผ่นงาน: สถิตินักศึกษาตามรุ่น
  FACULTY: "408425478"      // แผ่นงาน: อาจารย์และผลงานวิชาการ
};

var SHEET_NAMES = {
  CURRICULUM: "รายชื่อหลักสูตร",
  SAR: "รายงาน SAR AUN-QA และเกณฑ์ 8 ข้อ",
  STUDENTS: "สถิตินักศึกษาตามรุ่น",
  FACULTY: "อาจารย์และผลงานวิชาการ",
  TRACKING: "สถานะการติดตาม"
};

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function getTargetSheet(key) {
  var ss = getSpreadsheet();
  var sheets = ss.getSheets();

  var targetGid = SHEET_GIDS[key];
  if (targetGid !== undefined) {
    for (var i = 0; i < sheets.length; i++) {
      if (String(sheets[i].getSheetId()) === String(targetGid)) {
        return sheets[i];
      }
    }
  }

  var targetName = SHEET_NAMES[key] || key;
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;

  for (var j = 0; j < sheets.length; j++) {
    var sName = sheets[j].getName();
    if (key === "CURRICULUM" && (sName.indexOf("หลักสูตร") !== -1 || j === 0)) return sheets[j];
    if (key === "SAR" && (sName.indexOf("SAR") !== -1 || sName.indexOf("8") !== -1)) return sheets[j];
    if (key === "STUDENTS" && (sName.indexOf("นักศึกษา") !== -1 || sName.indexOf("รุ่น") !== -1)) return sheets[j];
    if (key === "FACULTY" && (sName.indexOf("อาจารย์") !== -1 || sName.indexOf("วิชาการ") !== -1)) return sheets[j];
    if (key === "TRACKING" && sName.indexOf("ติดตาม") !== -1) return sheets[j];
  }

  if (key === "TRACKING") {
    var newSheet = ss.insertSheet("สถานะการติดตาม");
    newSheet.appendRow(["ชื่อหลักสูตร", "สถานะ", "ความครบถ้วน(%)", "ผู้บันทึกล่าสุด", "วันเวลาที่อัปเดต", "หมายเหตุ"]);
    return newSheet;
  }

  return sheets[0];
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET Request Handler:
 * 1. ถ้าเรียกแบบ API (มี action หรือ api=true) -> ส่งคืน JSON
 * 2. ถ้าเปิดผ่าน Browser ปกติ -> เรนเดอร์หน้าเว็บแอปพลิเคชัน (HTML UI) สวยงามทันที!
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};

    // ตรวจสอบและเตรียมข้อมูลตั้งต้นหากชีตยังว่าง
    populateInitialDataIfEmpty(false);

    // กรณีเป็น API Request
    if (params.action || params.api === "true") {
      return handleApiGet(e);
    }

    // กรณีเปิดหน้าเว็บในเบราว์เซอร์: เรนเดอร์หน้าเว็บ HTML
    var template;
    try {
      template = HtmlService.createTemplateFromFile('Index');
      template.appData = apiGetAllData();
      return template.evaluate()
        .setTitle('ระบบประกันคุณภาพหลักสูตร AUN-QA | คณะศึกษาศาสตร์')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    } catch (tmplErr) {
      // หากยังไม่ได้สร้างไฟล์ Index ใน Apps Script ให้ส่ง JSON พร้อมแจ้งเตือน
      var all = apiGetAllData();
      return jsonResponse({
        status: "success",
        message: "กรุณาสร้างไฟล์ Index ใน Apps Script เพื่อเปิดหน้าเว็บแบบสมบูรณ์ หรือนำ URL นี้ไปใส่ในไฟล์ index.html",
        data: all
      });
    }

  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

function handleApiGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "getAllData";

  if (action === "initSampleData" || params.init === "true") {
    var initResult = populateInitialDataIfEmpty(true);
    return jsonResponse({
      status: "success",
      message: "เติมข้อมูลเริ่มต้นลงใน Google Sheet เรียบร้อยแล้ว",
      result: initResult
    });
  }

  if (action === "getAllData") {
    return jsonResponse({
      status: "success",
      timestamp: new Date().toISOString(),
      data: apiGetAllData()
    });
  }

  if (action === "getCurriculums") return jsonResponse({ status: "success", data: getCurriculumsData() });
  if (action === "getSAR") return jsonResponse({ status: "success", data: getSARData(params.curriculum, params.year) });
  if (action === "getStudents") return jsonResponse({ status: "success", data: getStudentsData(params.curriculum) });
  if (action === "getFaculty") return jsonResponse({ status: "success", data: getFacultyData(params.curriculum) });
  if (action === "getTracking") return jsonResponse({ status: "success", data: getTrackingData() });

  return jsonResponse({ status: "error", message: "Unknown action: " + action });
}

/**
 * Server Functions for google.script.run
 */
function apiGetAllData() {
  var curriculums = getCurriculumsData();
  var sarReports = getSARData();
  var studentStats = getStudentsData();
  var faculty = getFacultyData();
  var tracking = getTrackingData(curriculums, sarReports);

  return {
    curriculums: curriculums,
    sarReports: sarReports,
    studentStats: studentStats,
    faculty: faculty,
    tracking: tracking
  };
}

function apiSubmitDepartmentData(d) {
  if (d.curriculum) saveCurriculumRecord(d.curriculum);
  if (d.sar) saveSARRecord(d.sar);
  if (d.students) saveStudentStatsRecord(d.students);
  if (d.faculty && Array.isArray(d.faculty)) {
    d.faculty.forEach(function(f) { saveFacultyRecord(f); });
  }

  var curName = (d.curriculum && d.curriculum.nameTh) || (d.sar && d.sar.curriculumNameTh) || "";
  var status = d.status || "ส่งรายงานแล้ว";
  var percent = d.completionPercent || 100;
  var author = d.submittedBy || "";
  updateTrackingRecord(curName, status, percent, author);

  return { status: "success", message: "บันทึกข้อมูลและส่งรายงานเรียบร้อยแล้ว!" };
}

/**
 * POST Request Handler
 */
function doPost(e) {
  try {
    var postData;
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (pErr) {
        postData = e.parameter;
      }
    } else {
      postData = e.parameter || {};
    }

    var action = postData.action || "";

    if (action === "submitDepartmentData") {
      var res = apiSubmitDepartmentData(postData.data || {});
      return jsonResponse(res);
    }

    if (action === "initSampleData") {
      var initRes = populateInitialDataIfEmpty(true);
      return jsonResponse({ status: "success", message: "เติมข้อมูลเริ่มต้นสำเร็จ", result: initRes });
    }

    if (action === "saveSAR") {
      var sarResult = saveSARRecord(postData.data);
      updateTrackingRecord(postData.data.curriculumNameTh, postData.data.status || "กำลังกรอกข้อมูล", postData.data.completionPercent || 100, postData.data.submittedBy || "");
      return jsonResponse({ status: "success", message: "บันทึกรายงาน SAR เรียบร้อย", data: sarResult });
    }

    if (action === "saveCurriculum") {
      var curResult = saveCurriculumRecord(postData.data);
      return jsonResponse({ status: "success", message: "บันทึกข้อมูลหลักสูตรเรียบร้อย", data: curResult });
    }

    return jsonResponse({ status: "error", message: "Invalid action: " + action });

  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

// ==========================================
// Handlers อ่านข้อมูล (Read)
// ==========================================

function getCurriculumsData() {
  var sheet = getTargetSheet("CURRICULUM");
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var startIndex = 1;
  if (values.length > 2 && (!values[1][0] || values[1][0].toString().trim() === "")) {
    startIndex = 2;
  }

  var list = [];
  for (var i = startIndex; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;
    list.push({
      rowIndex: i + 1,
      nameTh: row[0] ? row[0].toString().trim() : "",
      nameEn: row[1] ? row[1].toString().trim() : "",
      degreeLevel: row[2] ? row[2].toString().trim() : "ปริญญาตรี",
      revisionYear: row[3] ? row[3].toString().trim() : "",
      totalCredits: row[4] ? row[4].toString().trim() : "",
      chairEmail: row[5] ? row[5].toString().trim() : "",
      executiveSummary: row[6] ? row[6].toString().trim() : "",
      philosophy: row[7] ? row[7].toString().trim() : "",
      objectives: row[8] ? row[8].toString().trim() : "",
      ploContent: row[9] ? row[9].toString().trim() : "",
      ploEvidence: row[10] ? row[10].toString().trim() : "",
      ploScore: row[11] ? row[11].toString().trim() : ""
    });
  }
  return list;
}

function getSARData(curriculumFilter, yearFilter) {
  var sheet = getTargetSheet("SAR");
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    var curName = row[0].toString().trim();
    var curYear = row[1] ? row[1].toString().trim() : "";

    if (curriculumFilter && curName !== curriculumFilter.toString().trim()) continue;
    if (yearFilter && curYear !== yearFilter.toString().trim()) continue;

    var scores = [
      parseFloat(row[7]) || 0,
      parseFloat(row[10]) || 0,
      parseFloat(row[13]) || 0,
      parseFloat(row[16]) || 0,
      parseFloat(row[19]) || 0,
      parseFloat(row[22]) || 0,
      parseFloat(row[25]) || 0,
      parseFloat(row[28]) || 0
    ];

    var totalScore = 0;
    var count = 0;
    scores.forEach(function(s) {
      if (s > 0) { totalScore += s; count++; }
    });
    var computedAvg = count > 0 ? (totalScore / count).toFixed(2) : (row[29] || 0);

    list.push({
      rowIndex: i + 1,
      curriculumNameTh: curName,
      academicYear: curYear,
      executiveSummary: row[2] ? row[2].toString().trim() : "",
      philosophy: row[3] ? row[3].toString().trim() : "",
      objectives: row[4] ? row[4].toString().trim() : "",
      criteria: [
        { id: 1, name: "ผลการเรียนรู้ที่คาดหวัง (Expected Learning Outcomes - PLOs)", content: row[5] || "", evidence: row[6] || "", score: parseFloat(row[7]) || 0 },
        { id: 2, name: "โครงสร้างและเนื้อหาหลักสูตร (Programme Structure & Content)", content: row[8] || "", evidence: row[9] || "", score: parseFloat(row[10]) || 0 },
        { id: 3, name: "การจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ (Teaching & Learning Approach)", content: row[11] || "", evidence: row[12] || "", score: parseFloat(row[13]) || 0 },
        { id: 4, name: "การประเมินผู้เรียน (Student Assessment)", content: row[14] || "", evidence: row[15] || "", score: parseFloat(row[16]) || 0 },
        { id: 5, name: "คุณภาพอาจารย์ (Academic Staff)", content: row[17] || "", evidence: row[18] || "", score: parseFloat(row[19]) || 0 },
        { id: 6, name: "การบริการและการสนับสนุนนักศึกษา (Student Support Services)", content: row[20] || "", evidence: row[21] || "", score: parseFloat(row[22]) || 0 },
        { id: 7, name: "สิ่งอำนวยความสะดวกและโครงสร้างพื้นฐาน (Facilities & Infrastructure)", content: row[23] || "", evidence: row[24] || "", score: parseFloat(row[25]) || 0 },
        { id: 8, name: "ผลลัพธ์การดำเนินงาน (Output & Outcomes)", content: row[26] || "", evidence: row[27] || "", score: parseFloat(row[28]) || 0 }
      ],
      overallScore: parseFloat(row[29]) || parseFloat(computedAvg) || 0,
      strengths: row[30] ? row[30].toString().trim() : "",
      improvements: row[31] ? row[31].toString().trim() : ""
    });
  }
  return list;
}

function getStudentsData(curriculumFilter) {
  var sheet = getTargetSheet("STUDENTS");
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    if (curriculumFilter && row[0].toString().trim() !== curriculumFilter.toString().trim()) continue;

    var y1 = parseInt(row[2]) || 0;
    var y2 = parseInt(row[3]) || 0;
    var y3 = parseInt(row[4]) || 0;
    var y4 = parseInt(row[5]) || 0;
    var yMore = parseInt(row[6]) || 0;
    var total = parseInt(row[7]) || (y1 + y2 + y3 + y4 + yMore);

    list.push({
      rowIndex: i + 1,
      curriculumNameTh: row[0].toString().trim(),
      entryYear: row[1] ? row[1].toString().trim() : "",
      year1: y1,
      year2: y2,
      year3: y3,
      year4: y4,
      yearMore: yMore,
      total: total
    });
  }
  return list;
}

function getFacultyData(curriculumFilter) {
  var sheet = getTargetSheet("FACULTY");
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;
    if (curriculumFilter && row[0].toString().trim() !== curriculumFilter.toString().trim()) continue;

    list.push({
      rowIndex: i + 1,
      curriculumNameTh: row[0] ? row[0].toString().trim() : "",
      fullName: row[1] ? row[1].toString().trim() : "",
      degree: row[2] ? row[2].toString().trim() : "",
      field: row[3] ? row[3].toString().trim() : "",
      publications: row[4] ? row[4].toString().trim() : "",
      referenceUrl: row[5] ? row[5].toString().trim() : ""
    });
  }
  return list;
}

function getTrackingData(curriculums, sarReports) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TRACKING);
  var storedMap = {};

  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        storedMap[rows[i][0].toString().trim()] = {
          status: rows[i][1] || "ยังไม่เริ่ม",
          percent: parseInt(rows[i][2]) || 0,
          submittedBy: rows[i][3] || "-",
          updatedAt: rows[i][4] ? formatDate(rows[i][4]) : "-",
          notes: rows[i][5] || ""
        };
      }
    }
  }

  var curs = curriculums || getCurriculumsData();
  var sars = sarReports || getSARData();

  var trackingList = [];
  for (var i = 0; i < curs.length; i++) {
    var c = curs[i];
    var cName = c.nameTh.trim();
    var sar = null;
    for (var s = 0; s < sars.length; s++) {
      if (sars[s].curriculumNameTh.trim() === cName) {
        sar = sars[s];
        break;
      }
    }

    var criteriaWithEvidence = 0;
    var criteriaWithScore = 0;
    if (sar && sar.criteria) {
      sar.criteria.forEach(function(item) {
        if (item.score > 0) criteriaWithScore++;
        if (item.evidence && item.evidence.toString().trim().length > 0) criteriaWithEvidence++;
      });
    }

    var calcPercent = 0;
    if (sar) {
      calcPercent = Math.round(((criteriaWithScore / 8) * 50) + ((criteriaWithEvidence / 8) * 50));
    }

    var meta = storedMap[cName] || {};
    var currentStatus = meta.status || (calcPercent >= 90 ? "ส่งรายงานแล้ว" : (calcPercent > 0 ? "กำลังกรอกข้อมูล" : "ยังไม่เริ่ม"));
    var currentPercent = meta.percent || calcPercent;

    trackingList.push({
      curriculumName: cName,
      degreeLevel: c.degreeLevel || "ป.ตรี",
      chairEmail: c.chairEmail || "-",
      status: currentStatus,
      completionPercent: currentPercent,
      evidenceCount: criteriaWithEvidence + "/8",
      criteriaFilledCount: criteriaWithScore + "/8",
      overallScore: sar ? sar.overallScore : 0,
      submittedBy: meta.submittedBy || (c.chairEmail || "-"),
      updatedAt: meta.updatedAt || "-",
      notes: meta.notes || ""
    });
  }

  return trackingList;
}

function updateTrackingRecord(curName, status, percent, submittedBy, notes) {
  if (!curName) return;
  var sheet = getTargetSheet("TRACKING");
  var values = sheet.getDataRange().getValues();
  var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

  var rowData = [
    curName,
    status || "กำลังกรอกข้อมูล",
    percent || 50,
    submittedBy || "-",
    nowStr,
    notes || ""
  ];

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === curName.toString().trim()) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }

  sheet.appendRow(rowData);
}

function formatDate(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Bangkok", "yyyy-MM-dd HH:mm");
  }
  return String(val);
}

function saveCurriculumRecord(item) {
  if (!item || !item.nameTh) return;
  var sheet = getTargetSheet("CURRICULUM");
  var values = sheet.getDataRange().getValues();

  var newRow = [
    item.nameTh || "",
    item.nameEn || "",
    item.degreeLevel || "ปริญญาตรี",
    item.revisionYear || "",
    item.totalCredits || "",
    item.chairEmail || "",
    item.executiveSummary || "",
    item.philosophy || "",
    item.objectives || "",
    item.ploContent || "",
    item.ploEvidence || "",
    item.ploScore || ""
  ];

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === item.nameTh.toString().trim()) {
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { action: "updated", rowIndex: i + 1 };
    }
  }

  sheet.appendRow(newRow);
  return { action: "inserted", rowIndex: sheet.getLastRow() };
}

function saveSARRecord(item) {
  if (!item || !item.curriculumNameTh) return;
  var sheet = getTargetSheet("SAR");
  var values = sheet.getDataRange().getValues();

  var c = item.criteria || [];
  function getC(id) {
    for (var i = 0; i < c.length; i++) {
      if (c[i].id == id) return c[i];
    }
    return { content: "", evidence: "", score: 0 };
  }

  var c1 = getC(1), c2 = getC(2), c3 = getC(3), c4 = getC(4);
  var c5 = getC(5), c6 = getC(6), c7 = getC(7), c8 = getC(8);

  var scores = [c1.score, c2.score, c3.score, c4.score, c5.score, c6.score, c7.score, c8.score].map(function(s){ return parseFloat(s) || 0; });
  var sum = scores.reduce(function(a,b){ return a+b; }, 0);
  var validCount = scores.filter(function(s){ return s > 0; }).length;
  var avg = validCount > 0 ? (sum / validCount).toFixed(2) : 0;

  var newRow = [
    item.curriculumNameTh || "",
    item.academicYear || "",
    item.executiveSummary || "",
    item.philosophy || "",
    item.objectives || "",
    c1.content || "", c1.evidence || "", c1.score || 0,
    c2.content || "", c2.evidence || "", c2.score || 0,
    c3.content || "", c3.evidence || "", c3.score || 0,
    c4.content || "", c4.evidence || "", c4.score || 0,
    c5.content || "", c5.evidence || "", c5.score || 0,
    c6.content || "", c6.evidence || "", c6.score || 0,
    c7.content || "", c7.evidence || "", c7.score || 0,
    c8.content || "", c8.evidence || "", c8.score || 0,
    item.overallScore || avg,
    item.strengths || "",
    item.improvements || ""
  ];

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === item.curriculumNameTh.toString().trim() &&
        values[i][1] && values[i][1].toString().trim() === item.academicYear.toString().trim()) {
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { action: "updated", rowIndex: i + 1 };
    }
  }

  sheet.appendRow(newRow);
  return { action: "inserted", rowIndex: sheet.getLastRow() };
}

function saveStudentStatsRecord(item) {
  if (!item || !item.curriculumNameTh) return;
  var sheet = getTargetSheet("STUDENTS");
  var values = sheet.getDataRange().getValues();

  var y1 = parseInt(item.year1) || 0;
  var y2 = parseInt(item.year2) || 0;
  var y3 = parseInt(item.year3) || 0;
  var y4 = parseInt(item.year4) || 0;
  var yMore = parseInt(item.yearMore) || 0;
  var total = y1 + y2 + y3 + y4 + yMore;

  var newRow = [
    item.curriculumNameTh || "",
    item.entryYear || "",
    y1, y2, y3, y4, yMore, total
  ];

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === item.curriculumNameTh.toString().trim() &&
        values[i][1] && values[i][1].toString().trim() === item.entryYear.toString().trim()) {
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { action: "updated", rowIndex: i + 1 };
    }
  }

  sheet.appendRow(newRow);
  return { action: "inserted", rowIndex: sheet.getLastRow() };
}

function saveFacultyRecord(item) {
  if (!item || !item.curriculumNameTh) return;
  var sheet = getTargetSheet("FACULTY");

  var newRow = [
    item.curriculumNameTh || "",
    item.fullName || "",
    item.degree || "",
    item.field || "",
    item.publications || "",
    item.referenceUrl || ""
  ];

  sheet.appendRow(newRow);
  return { action: "inserted", rowIndex: sheet.getLastRow() };
}

function populateInitialDataIfEmpty(force) {
  var curSheet = getTargetSheet("CURRICULUM");
  var curValues = curSheet.getDataRange().getValues();

  var hasData = false;
  if (curValues.length > 2) {
    for (var r = 1; r < curValues.length; r++) {
      if (curValues[r][0] && curValues[r][0].toString().trim().length > 3) {
        hasData = true;
        break;
      }
    }
  }

  if (hasData && !force) {
    return { status: "already_populated" };
  }

  var sampleCurs = [
    [
      "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
      "Bachelor of Education Program in Teaching Thai Language",
      "ปริญญาตรี",
      "2566",
      "138",
      "thai_edu@university.ac.th",
      "หลักสูตรเน้นการผลิตครูภาษาไทยที่มีสมรรถนะการสอนในศตวรรษที่ 21 มีทักษะการใช้เทคโนโลยีดิจิทัล และมีจิตวิญญาณความเป็นครู",
      "สร้างครูภาษาไทยมืออาชีพ เปี่ยมคุณธรรม บูรณาการนวัตกรรมการศึกษาเพื่อพัฒนาผู้เรียน",
      "1. เพื่อผลิตบัณฑิตครูภาษาไทยที่มีความรู้ความสามารถในศาสตร์และศิลป์การสอน 2. เพื่อส่งเสริมนวัตกรรมการจัดการเรียนรู้ภาษาไทย",
      "PLO1: สื่อสารภาษาไทยได้อย่างถูกต้องตามมาตรฐาน PLO2: ออกแบบแผนการจัดการเรียนรู้เชิงรุก PLO3: ปฏิบัติตนตามจรรยาบรรณวิชาชีพครู",
      "https://drive.google.com/drive/folders/sample-thai-plo",
      "4.8"
    ],
    [
      "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์",
      "Bachelor of Education Program in Mathematics",
      "ปริญญาตรี",
      "2565",
      "135",
      "math_edu@university.ac.th",
      "เน้นการพัฒนาทักษะการแก้ปัญหาทางคณิตศาสตร์และการประยุกต์สะเต็มศึกษา (STEM) ในชั้นเรียน",
      "คิดอย่างเป็นระบบ จัดการเรียนรู้คณิตศาสตร์อย่างสร้างสรรค์เพื่อศตวรรษที่ 21",
      "ผลิตครูคณิตศาสตร์ที่มีความเชี่ยวชาญด้านเนื้อหาและการจัดกระบวนการคิดเชิงวิเคราะห์",
      "PLO1: อธิบายมโนทัศน์คณิตศาสตร์ขั้นสูง PLO2: บูรณาการ STEM ในการสอนคณิตศาสตร์",
      "https://drive.google.com/drive/folders/sample-math-plo",
      "4.6"
    ],
    [
      "หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา",
      "Master of Education Program in Educational Administration",
      "ปริญญาโท",
      "2567",
      "36",
      "admin_edu@university.ac.th",
      "ผลิตผู้บริหารสถานศึกษาและผู้นำการเปลี่ยนแปลงที่มีวิสัยทัศน์ดิจิทัลและการบริหารจัดการสถานศึกษาตามเกณฑ์คุณภาพสากล",
      "ผู้นำการเปลี่ยนแปลงทางการศึกษา บริหารด้วยธรรมาภิบาล สู่ความเป็นเลิศทางวิชาการ",
      "พัฒนาภาวะผู้นำทางวิชาการและทักษะการบริหารจัดการองค์กรการศึกษายุคใหม่",
      "PLO1: วิเคราะห์นโยบายและวางแผนกลยุทธ์สถานศึกษา PLO2: วิจัยเชิงปฏิบัติการเพื่อแก้ปัญหาการศึกษา",
      "https://drive.google.com/drive/folders/sample-med-plo",
      "5.1"
    ],
    [
      "หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ",
      "Bachelor of Education Program in English",
      "ปริญญาตรี",
      "2566",
      "136",
      "english_edu@university.ac.th",
      "เน้นสมรรถนะการสื่อสารระดับสากล CEFR C1 และการออกแบบการสอนภาษาอังกฤษผ่านเทคโนโลยี",
      "สร้างครูภาษาอังกฤษสากล นำนวัตกรรมสู่ห้องเรียนอย่างสร้างสรรค์",
      "เพื่อผลิตบัณฑิตครูภาษาอังกฤษที่มีทักษะภาษาระดับสูงและการสอนภาษาเชิงบูรณาการ",
      "PLO1: สื่อสารภาษาอังกฤษระดับ CEFR C1 PLO2: ใช้เทคโนโลยีการสอนภาษาอังกฤษ",
      "https://drive.google.com/drive/folders/sample-eng-plo",
      "4.5"
    ],
    [
      "หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน",
      "Doctor of Education Program in Curriculum and Instruction",
      "ปริญญาเอก",
      "2566",
      "48",
      "phd_ci@university.ac.th",
      "สร้างนักวิจัยและผู้เชี่ยวชาญด้านหลักสูตรและการจัดการเรียนรู้เพื่อยกระดับคุณภาพการศึกษา",
      "ผู้เชี่ยวชาญด้านหลักสูตร วิจัยเชิงลึก สร้างนวัตกรรมการศึกษาเพื่อการพัฒนาที่ยั่งยืน",
      "ผลิตดุษฎีบัณฑิตที่มีความสามารถในการวิจัยและพัฒนานโยบายหลักสูตรระดับชาติและนานาชาติ",
      "PLO1: สร้างองค์ความรู้ใหม่ด้านหลักสูตร PLO2: เผยแพร่ผลงานวิจัยระดับสากล",
      "",
      "0"
    ]
  ];

  sampleCurs.forEach(function(curRow) { curSheet.appendRow(curRow); });

  var sarSheet = getTargetSheet("SAR");
  var sampleSAR = [
    "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
    "2566",
    "ภาพรวมการดำเนินงานตามเกณฑ์ AUN-QA บรรลุตามเป้าหมาย โดยเฉพาะด้านผลลัพธ์การเรียนรู้และการดูแลนักศึกษา",
    "สร้างครูภาษาไทยมืออาชีพ เปี่ยมคุณธรรม บูรณาการนวัตกรรมการศึกษาเพื่อพัฒนาผู้เรียน",
    "ผลิตบัณฑิตครูภาษาไทยที่มีสมรรถนะสูงตอบสนองความต้องการของสถานศึกษา",
    "มีการกำหนด PLOs 6 ข้อ ครอบคลุมความรู้ ทักษะ เจตคติ สอดคล้องกับมาตรฐานคุรุสภา", "https://drive.google.com/drive/folders/c1-evidence", 4.8,
    "รายวิชามีการจัดเรียงตามลำดับความยากง่าย มีการบูรณาการการฝึกประสบการณ์วิชาชีพครู", "https://drive.google.com/drive/folders/c2-evidence", 4.5,
    "อาจารย์ใช้การจัดการเรียนรู้แบบ Active Learning, Problem-Based Learning และ Microteaching", "https://drive.google.com/drive/folders/c3-evidence", 4.6,
    "ใช้การประเมินตามสภาพจริงด้วย Rubrics Score และการสะท้อนคิด (Reflective Thinking)", "https://drive.google.com/drive/folders/c4-evidence", 4.4,
    "อาจารย์ประจำหลักสูตรมีวุฒิปริญญาเอกร้อยละ 60 และมีตำแหน่งทางวิชาการร้อยละ 70", "https://drive.google.com/drive/folders/c5-evidence", 4.7,
    "มีระบบอาจารย์ที่ปรึกษา คลินิกภาษาไทย และการติวสอบใบประกอบวิชาชีพครู", "https://drive.google.com/drive/folders/c6-evidence", 4.9,
    "มีห้องปฏิบัติการสอนจำลอง (Smart Classroom) และห้องสมุดเฉพาะสาขาวิชา", "https://drive.google.com/drive/folders/c7-evidence", 4.3,
    "บัณฑิตสอบผ่านใบประกอบวิชาชีพครูในรอบแรก ร้อยละ 94 และมีงานทำภายใน 1 ปี ร้อยละ 92", "https://drive.google.com/drive/folders/c8-evidence", 4.8,
    4.63,
    "1. คณาจารย์มีความเชี่ยวชาญและทุ่มเท\n2. บัณฑิตสอบบรรจุครูผู้ช่วยและได้รับใบประกอบวิชาชีพในอัตราสูงมาก",
    "1. ควรเพิ่มการตีพิมพ์ผลงานวิจัยของอาจารย์ในฐานข้อมูลระดับนานาชาติ\n2. ปรับปรุงระบบห้องปฏิบัติการมัลติมีเดีย"
  ];
  sarSheet.appendRow(sampleSAR);

  var stdSheet = getTargetSheet("STUDENTS");
  var sampleStds = [
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย", "2566", 32, 30, 28, 29, 2, 121],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์", "2566", 30, 28, 27, 25, 1, 111],
    ["หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา", "2566", 18, 16, 4, 0, 0, 38],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ", "2566", 35, 32, 30, 28, 3, 128],
    ["หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน", "2566", 5, 4, 6, 2, 1, 18]
  ];
  sampleStds.forEach(function(sRow) { stdSheet.appendRow(sRow); });

  var facSheet = getTargetSheet("FACULTY");
  var sampleFacs = [
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย", "ผศ.ดร.สมชาย ใจดี", "กศ.ด. (การสอนภาษาไทย)", "การสอนภาษาไทยและนวัตกรรมการเรียนรู้", "การพัฒนารูปแบบการจัดการเรียนรู้วรรณคดีไทยด้วยเทคโนโลยีดิจิทัล (TCI 1)", "https://tci-thailand.org/sample-1"],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย", "รศ.ดร.พรพิมล สุขเกษม", "ปร.ด. (ภาษาศาสตร์ประยุกต์)", "ภาษาศาสตร์ประยุกต์เพื่อการสอน", "การวิเคราะห์ข้อผิดพลาดทางไวยากรณ์ในการเขียนของนักเรียน (2565)", "https://tci-thailand.org/sample-2"],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์", "ผศ.ดร.กิตติพงษ์ วิริยะกิจ", "วท.ด. (คณิตศาสตร์ศึกษา)", "คณิตศาสตร์ศึกษาและสะเต็มศึกษา", "Effects of STEM-based learning on Mathematical Problem Solving (Scopus Q2)", "https://scopus.com/sample-3"]
  ];
  sampleFacs.forEach(function(fRow) { facSheet.appendRow(fRow); });

  var trackSheet = getTargetSheet("TRACKING");
  var sampleTracks = [
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย", "ส่งรายงานแล้ว", 100, "ผศ.ดร.สมชาย ใจดี", "2026-10-04 14:30", "ส่งรายงานและแนบหลักฐานครบถ้วน"],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์", "ส่งรายงานแล้ว", 100, "ผศ.ดร.กิตติพงษ์ วิริยะกิจ", "2026-10-03 16:15", "ส่งรายงานและแนบหลักฐานครบถ้วน"],
    ["หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา", "กำลังกรอกข้อมูล", 65, "รศ.ดร.นพพร ปัญญาเลิศ", "2026-10-05 09:20", "อยู่ระหว่างรวบรวมหลักฐานเกณฑ์ที่ 5 และ 7"],
    ["หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ", "กำลังกรอกข้อมูล", 40, "อ.ดร.สุภาพร สุขสม", "2026-10-02 11:00", "บันทึกข้อมูลหลักสูตรและเกณฑ์ 1-3 แล้ว"],
    ["หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน", "ยังไม่เริ่ม", 10, "-", "-", "รอนัดประชุมคณะกรรมการเพื่อประเมินตนเอง"]
  ];
  sampleTracks.forEach(function(tRow) { trackSheet.appendRow(tRow); });

  return { status: "success", populatedCount: sampleCurs.length };
}
