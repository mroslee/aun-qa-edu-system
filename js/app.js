/**
 * ระบบประกันคุณภาพหลักสูตร AUN-QA คณะศึกษาศาสตร์
 * Client Application Logic (เวอร์ชันรองรับการกรอกข้อมูลรายสาขาวิชา & ติดตามผลโดยฝ่ายประกันคุณภาพ)
 */

let appState = {
  activeRole: "qa", // "qa" หรือ "dept"
  activeTab: "tracking",
  selectedCurriculum: "",
  allData: {
    curriculums: [],
    sarReports: [],
    studentStats: [],
    faculty: [],
    tracking: []
  },
  radarChart: null,
  barChart: null,
  studentChart: null
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initRoles();
  initTabs();
  initSettingsModal();
  initDepartmentFormInputs();
  initAppsScriptTab();
  renderGuidelines();
  loadData();

  // Refresh Button
  document.getElementById("btnRefreshData")?.addEventListener("click", () => {
    const icon = document.getElementById("refreshIcon");
    if (icon) icon.classList.add("fa-spin");
    loadData().finally(() => {
      if (icon) icon.classList.remove("fa-spin");
    });
  });

  // Print SAR Report Button
  document.getElementById("btnPrintReport")?.addEventListener("click", () => {
    switchTab("sar");
    setTimeout(() => {
      window.print();
    }, 300);
  });

  // Curriculum Selector change
  document.getElementById("curriculumSelector")?.addEventListener("change", (e) => {
    appState.selectedCurriculum = e.target.value;
    updateSelectedCurriculumViews();
    preloadDepartmentFormData(e.target.value);
  });

  // Student Count Auto Calculation in Department Form
  document.querySelectorAll(".std-count-input").forEach(inp => {
    inp.addEventListener("input", calculateDepartmentStudentTotal);
  });

  // Export Tracking Table as CSV
  document.getElementById("btnExportTracking")?.addEventListener("click", exportTrackingCSV);

  // Department Form Save Draft Button
  document.getElementById("btnSaveDraft")?.addEventListener("click", () => {
    submitDepartmentForm("ฉบับร่าง");
  });

  // Department Form Final Submit
  document.getElementById("departmentFullForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitDepartmentForm("ส่งรายงานแล้ว");
  });

  // Quick Go To Entry Banner Button
  document.getElementById("btnQuickGoToEntry")?.addEventListener("click", () => {
    switchTab("department-entry");
  });
});

/**
 * 1. Role Management (ฝ่ายประกันคุณภาพ vs สาขาวิชา)
 */
function initRoles() {
  const btnQA = document.getElementById("btnRoleQA");
  const btnDept = document.getElementById("btnRoleDept");
  const banner = document.getElementById("roleNoticeBanner");

  btnQA?.addEventListener("click", () => {
    appState.activeRole = "qa";
    btnQA.className = "role-btn active px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 bg-blue-600 text-white shadow";
    btnDept.className = "role-btn px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 text-blue-200 hover:text-white";
    banner?.classList.add("hidden");
    switchTab("tracking");
  });

  btnDept?.addEventListener("click", () => {
    appState.activeRole = "dept";
    btnDept.className = "role-btn active px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 bg-emerald-600 text-white shadow";
    btnQA.className = "role-btn px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 text-blue-200 hover:text-white";
    banner?.classList.remove("hidden");
    switchTab("department-entry");
    preloadDepartmentFormData(appState.selectedCurriculum);
  });
}

/**
 * 2. Tab Navigation
 */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  appState.activeTab = tabId;

  // Toggle active class on buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.className = "tab-btn active px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 text-white bg-blue-700/60 shadow-sm";
    } else {
      btn.className = "tab-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-white/5";
    }
  });

  // Toggle tab contents
  document.querySelectorAll(".tab-content").forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.remove("hidden");
    } else {
      content.classList.add("hidden");
    }
  });

  // Re-render chart if switching to dashboard or faculty
  if (tabId === "dashboard") {
    setTimeout(renderCharts, 100);
  } else if (tabId === "faculty") {
    setTimeout(renderStudentChart, 100);
  } else if (tabId === "tracking") {
    renderTrackingTable();
  } else if (tabId === "department-entry") {
    preloadDepartmentFormData(appState.selectedCurriculum);
  }
}

/**
 * 3. Load Data from API or Demo fallback
 */
async function loadData() {
  updateConnectionBadge();
  showToast("กำลังโหลดข้อมูลประกันคุณภาพ...", "info");

  try {
    const res = await ApiService.fetchAllData();
    appState.allData = res.data;

    // หากไม่มี tracking จากชีต ให้คำนวณจาก curriculums & SAR
    if (!appState.allData.tracking || appState.allData.tracking.length === 0) {
      appState.allData.tracking = CONFIG.DEMO_DATA.tracking;
    }

    updateConnectionBadge(res.source === "live");

    populateCurriculumDropdown();
    renderTrackingKPIs();
    renderTrackingTable();
    updateSelectedCurriculumViews();
    renderCurriculumTable();
    renderFacultyTable();
    renderStudentStatsTable();

    showToast(
      res.source === "live" ? "เชื่อมต่อข้อมูล Google Sheet สำเร็จ" : "โหลดข้อมูลตัวอย่าง (Demo Mode)",
      "success"
    );
  } catch (err) {
    console.error("Data load error:", err);
    showToast("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + err.message, "error");
  }
}

function updateConnectionBadge(isLive) {
  const badge = document.getElementById("connectionStatusBadge");
  const text = document.getElementById("connectionStatusText");
  const configured = ApiService.isConfigured();

  if (isLive || configured) {
    badge.className = "hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    text.textContent = "เชื่อมต่อระบบชีตสด (Live Sheet)";
  } else {
    badge.className = "hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30";
    text.textContent = "โหมดตัวอย่าง (Demo)";
  }
}

function populateCurriculumDropdown() {
  const selector = document.getElementById("curriculumSelector");
  if (!selector) return;

  const curList = appState.allData.curriculums || [];
  if (curList.length === 0) {
    selector.innerHTML = '<option value="">ไม่มีข้อมูลหลักสูตร</option>';
    return;
  }

  selector.innerHTML = curList.map((c, idx) => `
    <option value="${c.nameTh}" ${idx === 0 ? "selected" : ""}>
      ${c.nameTh} (${c.degreeLevel || "ป.ตรี"})
    </option>
  `).join("");

  if (!appState.selectedCurriculum && curList.length > 0) {
    appState.selectedCurriculum = curList[0].nameTh;
  }
}

/**
 * 4. QA Tracking Page (ตารางติดตามความก้าวหน้ารายสาขาวิชา)
 */
function renderTrackingKPIs() {
  const tracking = appState.allData.tracking || [];
  const total = tracking.length;
  const submitted = tracking.filter(t => t.status === "ส่งรายงานแล้ว" || t.status === "อนุมัติแล้ว").length;
  const inProgress = tracking.filter(t => t.status === "กำลังกรอกข้อมูล" || t.status === "ฉบับร่าง").length;
  const notStarted = tracking.filter(t => t.status === "ยังไม่เริ่ม" || t.completionPercent <= 10).length;

  document.getElementById("kpiTotalCurs").textContent = total;
  document.getElementById("kpiSubmittedCurs").textContent = submitted;
  document.getElementById("kpiInProgressCurs").textContent = inProgress;
  document.getElementById("kpiNotStartedCurs").textContent = notStarted;

  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
  document.getElementById("kpiSubmittedPercent").textContent = `คิดเป็น ${percent}% ของคณะศึกษาศาสตร์`;
}

function renderTrackingTable() {
  const tbody = document.getElementById("trackingTableBody");
  if (!tbody) return;

  const tracking = appState.allData.tracking || [];
  if (tracking.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-xs text-slate-400">ยังไม่มีข้อมูลการติดตาม</td></tr>`;
    return;
  }

  renderTrackingKPIs();

  tbody.innerHTML = tracking.map(item => {
    const percent = parseInt(item.completionPercent) || 0;
    
    // Status styling
    let statusBadge = "";
    if (item.status === "ส่งรายงานแล้ว" || item.status === "อนุมัติแล้ว") {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-circle-check"></i> ${item.status}</span>`;
    } else if (item.status === "กำลังกรอกข้อมูล" || item.status === "ฉบับร่าง") {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-clock-rotate-left"></i> ${item.status}</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-circle-xmark"></i> ยังไม่เริ่ม</span>`;
    }

    // Progress bar color
    const barColor = percent >= 80 ? "bg-emerald-500" : percent >= 40 ? "bg-amber-500" : "bg-rose-500";

    return `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="px-4 py-3.5">
          <div class="font-bold text-slate-900 text-xs">${item.curriculumName}</div>
          <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span><i class="fa-solid fa-user-pen mr-1"></i> ผู้รับผิดชอบ: ${item.submittedBy || "-"}</span>
          </div>
        </td>
        <td class="px-3 py-3.5 text-center text-xs">
          <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">${item.degreeLevel || "ป.ตรี"}</span>
        </td>
        <td class="px-4 py-3.5 min-w-[150px]">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
            <span>${percent}%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="${barColor} h-2 rounded-full" style="width: ${percent}%"></div>
          </div>
        </td>
        <td class="px-3 py-3.5 text-center text-xs font-bold text-slate-700">
          ${item.criteriaFilledCount || "0/8"}
        </td>
        <td class="px-3 py-3.5 text-center text-xs font-bold text-slate-700">
          ${item.evidenceCount || "0/8"}
        </td>
        <td class="px-4 py-3.5">
          ${statusBadge}
        </td>
        <td class="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
          ${item.updatedAt || "-"}
        </td>
        <td class="px-4 py-3.5 text-center whitespace-nowrap">
          <div class="flex items-center justify-center space-x-1.5">
            <!-- Review SAR button -->
            <button onclick="reviewCurriculumSAR('${item.curriculumName}')" 
                    class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition" title="เปิดดูรายงาน SAR">
              <i class="fa-solid fa-file-shield mr-1"></i> ตรวจดู
            </button>
            <!-- Edit/Enter Data for this curriculum -->
            <button onclick="editCurriculumData('${item.curriculumName}')" 
                    class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition" title="เข้ากรอกข้อมูลแทนสาขา">
              <i class="fa-solid fa-pen mr-1"></i> กรอกข้อมูล
            </button>
            <!-- Email Reminder -->
            ${item.chairEmail && item.chairEmail !== "-" ? `
              <a href="mailto:${item.chairEmail}?subject=แจ้งเตือนการส่งรายงานประกันคุณภาพหลักสูตร AUN-QA คณะศึกษาศาสตร์&body=เรียน ประธานหลักสูตร ${item.curriculumName}%0D%0A%0D%0Aฝ่ายประกันคุณภาพการศึกษา คณะศึกษาศาสตร์ ขอติดตามความคืบหน้าการจัดทำรายงานการประเมินตนเองตามเกณฑ์ AUN-QA โดยขณะนี้มีความคืบหน้า ${percent}%%0D%0Aขอความอนุเคราะห์บันทึกข้อมูลและแนบหลักฐานให้ครบถ้วนในระบบเว็บแอปพลิเคชัน%0D%0A%0D%0Aขอแสดงความนับถือ%0D%0Aฝ่ายประกันคุณภาพ คณะศึกษาศาสตร์" 
                 class="p-1.5 text-slate-400 hover:text-blue-600 transition" title="ส่งอีเมลติดตามสาขา">
                <i class="fa-regular fa-envelope"></i>
              </a>
            ` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Global action handlers for QA buttons
window.reviewCurriculumSAR = function(curName) {
  appState.selectedCurriculum = curName;
  const selector = document.getElementById("curriculumSelector");
  if (selector) selector.value = curName;
  updateSelectedCurriculumViews();
  switchTab("sar");
};

window.editCurriculumData = function(curName) {
  appState.selectedCurriculum = curName;
  const selector = document.getElementById("curriculumSelector");
  if (selector) selector.value = curName;
  switchTab("department-entry");
  preloadDepartmentFormData(curName);
};

function exportTrackingCSV() {
  const tracking = appState.allData.tracking || [];
  if (tracking.length === 0) {
    showToast("ไม่มีข้อมูลสำหรับส่งออก", "error");
    return;
  }

  let csvContent = "\uFEFFหลักสูตร,ระดับ,ความครบถ้วน(%),เกณฑ์ที่ประเมิน,ไฟล์หลักฐาน,สถานะ,ผู้ส่ง/ประธานหลักสูตร,อีเมล,อัปเดตล่าสุด,หมายเหตุ\n";
  tracking.forEach(t => {
    csvContent += `"${t.curriculumName}","${t.degreeLevel}","${t.completionPercent}%","${t.criteriaFilledCount}","${t.evidenceCount}","${t.status}","${t.submittedBy}","${t.chairEmail}","${t.updatedAt}","${t.notes || ""}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `AUN-QA_Tracking_FacultyOfEducation_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("ส่งออกไฟล์ติดตามผลเป็น CSV เรียบร้อยแล้ว", "success");
}

/**
 * 5. Department Entry Form Management (หน้ากรอกข้อมูลรายสาขา)
 */
function initDepartmentFormInputs() {
  const container = document.getElementById("deptCriteriaInputsList");
  if (!container) return;

  container.innerHTML = CONFIG.AUN_QA_CRITERIA.map(c => `
    <div class="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 hover:border-blue-300 transition">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="text-xs font-bold text-slate-800 flex items-center gap-2">
          <span class="bg-blue-900 text-amber-400 px-2 py-0.5 rounded text-[11px] font-bold">${c.no}</span>
          <span>${c.title}</span>
        </label>
        <div class="flex items-center space-x-2">
          <span class="text-xs font-semibold text-slate-600">คะแนนประเมิน (1-7):</span>
          <select id="dept_score_${c.id}" class="dept-score-select bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-1.5 font-bold focus:ring-blue-500">
            ${[1, 2, 3, 4, 5, 6, 7].map(num => `
              <option value="${num}" ${num === 4 ? "selected" : ""}>ระดับ ${num}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <p class="text-[11px] text-slate-500">${c.desc}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">ผลการดำเนินงานและแนวปฏิบัติ *</label>
          <textarea id="dept_content_${c.id}" rows="3" placeholder="ระบุการดำเนินงานของสาขาวิชาในเกณฑ์ข้อนี้..."
                    class="dept-text-input w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">ลิงก์โฟลเดอร์หลักฐาน (Google Drive / เอกสารแนบ) *</label>
          <input type="url" id="dept_evidence_${c.id}" placeholder="https://drive.google.com/drive/folders/..."
                 class="dept-evidence-input w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono">
          <span class="text-[10px] text-slate-400 mt-1 block">วางลิงก์ Google Drive ของเอกสารหลักฐานเกณฑ์ข้อนี้</span>
        </div>
      </div>
    </div>
  `).join("");

  // Listeners to update realtime score and completion
  document.querySelectorAll(".dept-score-select").forEach(sel => {
    sel.addEventListener("change", () => {
      calculateDepartmentRealtimeScore();
      calculateDepartmentCompletion();
    });
  });

  document.querySelectorAll(".dept-text-input, .dept-evidence-input").forEach(inp => {
    inp.addEventListener("input", calculateDepartmentCompletion);
  });
}

function calculateDepartmentRealtimeScore() {
  const selects = document.querySelectorAll(".dept-score-select");
  let sum = 0;
  selects.forEach(sel => sum += parseFloat(sel.value) || 0);
  const avg = (sum / selects.length).toFixed(2);
  const el = document.getElementById("deptRealtimeScore");
  if (el) el.textContent = avg;
  return parseFloat(avg);
}

function calculateDepartmentStudentTotal() {
  const y1 = parseInt(document.getElementById("deptStdY1")?.value) || 0;
  const y2 = parseInt(document.getElementById("deptStdY2")?.value) || 0;
  const y3 = parseInt(document.getElementById("deptStdY3")?.value) || 0;
  const y4 = parseInt(document.getElementById("deptStdY4")?.value) || 0;
  const yMore = parseInt(document.getElementById("deptStdYMore")?.value) || 0;
  const total = y1 + y2 + y3 + y4 + yMore;

  const totalEl = document.getElementById("deptStdTotal");
  if (totalEl) totalEl.value = total;
}

function calculateDepartmentCompletion() {
  let scorePoints = 0;
  let evidencePoints = 0;
  let contentPoints = 0;

  for (let i = 1; i <= 8; i++) {
    const content = document.getElementById(`dept_content_${i}`)?.value.trim() || "";
    const evidence = document.getElementById(`dept_evidence_${i}`)?.value.trim() || "";
    if (content.length > 5) contentPoints++;
    if (evidence.length > 5) evidencePoints++;
    scorePoints++;
  }

  // Profile fields check
  const hasExec = (document.getElementById("deptExecSummary")?.value.trim().length || 0) > 5 ? 1 : 0;
  const hasPhil = (document.getElementById("deptPhilosophy")?.value.trim().length || 0) > 5 ? 1 : 0;
  const hasObj = (document.getElementById("deptObjectives")?.value.trim().length || 0) > 5 ? 1 : 0;
  const hasStrengths = (document.getElementById("deptStrengths")?.value.trim().length || 0) > 5 ? 1 : 0;

  const totalPossible = 8 (content) + 8 (evidence) + 4 (profile);
  const totalAchieved = contentPoints + evidencePoints + hasExec + hasPhil + hasObj + hasStrengths;
  const percent = Math.min(100, Math.round((totalAchieved / totalPossible) * 100));

  const bar = document.getElementById("deptProgressBar");
  const badge = document.getElementById("deptCompletionBadge");
  if (bar) bar.style.width = `${percent}%`;
  if (badge) badge.textContent = `${percent}%`;

  return percent;
}

/**
 * Preload Department Data when a curriculum is selected
 */
function preloadDepartmentFormData(curName) {
  if (!curName) curName = appState.selectedCurriculum;
  const cur = appState.allData.curriculums.find(c => c.nameTh === curName) || appState.allData.curriculums[0];
  const sar = appState.allData.sarReports.find(s => s.curriculumNameTh === curName);
  const std = (appState.allData.studentStats || []).find(s => s.curriculumNameTh === curName);
  const track = (appState.allData.tracking || []).find(t => t.curriculumName === curName);

  if (!cur) return;

  // Title
  document.getElementById("deptPortalTitle").textContent = `พื้นที่กรอกข้อมูล: ${cur.nameTh}`;

  // Basic Info
  document.getElementById("deptCurriculumName").value = cur.nameTh || "";
  document.getElementById("deptDegreeLevel").value = cur.degreeLevel || "ปริญญาตรี";
  document.getElementById("deptAcademicYear").value = (sar && sar.academicYear) || "2566";
  document.getElementById("deptSubmittedBy").value = (track && track.submittedBy !== "-") ? track.submittedBy : "";
  document.getElementById("deptChairEmail").value = cur.chairEmail || "";
  document.getElementById("deptExecSummary").value = (sar && sar.executiveSummary) || cur.executiveSummary || "";
  document.getElementById("deptPhilosophy").value = (sar && sar.philosophy) || cur.philosophy || "";
  document.getElementById("deptObjectives").value = (sar && sar.objectives) || cur.objectives || "";

  // 8 Criteria
  if (sar && sar.criteria) {
    sar.criteria.forEach(c => {
      const scoreSel = document.getElementById(`dept_score_${c.id}`);
      const contentInp = document.getElementById(`dept_content_${c.id}`);
      const evidenceInp = document.getElementById(`dept_evidence_${c.id}`);

      if (scoreSel) scoreSel.value = Math.round(c.score) || 4;
      if (contentInp) contentInp.value = c.content || "";
      if (evidenceInp) evidenceInp.value = c.evidence || "";
    });
  }

  // Strengths & Improvements
  document.getElementById("deptStrengths").value = (sar && sar.strengths) || "";
  document.getElementById("deptImprovements").value = (sar && sar.improvements) || "";

  // Student stats
  if (std) {
    document.getElementById("deptStdY1").value = std.year1 || 0;
    document.getElementById("deptStdY2").value = std.year2 || 0;
    document.getElementById("deptStdY3").value = std.year3 || 0;
    document.getElementById("deptStdY4").value = std.year4 || 0;
    document.getElementById("deptStdYMore").value = std.yearMore || 0;
    calculateDepartmentStudentTotal();
  }

  // Status text & saved timestamp
  if (track) {
    document.getElementById("deptStatusText").textContent = track.status;
    document.getElementById("deptLastSaved").textContent = track.updatedAt ? `บันทึกเมื่อ: ${track.updatedAt}` : "ยังไม่เคยบันทึก";
  }

  calculateDepartmentRealtimeScore();
  calculateDepartmentCompletion();
}

/**
 * Submit Department Data (Draft or Final)
 */
async function submitDepartmentForm(submissionStatus) {
  const submitBtn = document.getElementById("btnSubmitToQA");
  const draftBtn = document.getElementById("btnSaveDraft");
  
  const isFinal = submissionStatus === "ส่งรายงานแล้ว";
  const activeBtn = isFinal ? submitBtn : draftBtn;
  
  if (activeBtn) {
    activeBtn.disabled = true;
    activeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังบันทึกข้อมูล...`;
  }

  const curName = document.getElementById("deptCurriculumName").value.trim();
  const degreeLevel = document.getElementById("deptDegreeLevel").value;
  const academicYear = document.getElementById("deptAcademicYear").value.trim();
  const submittedBy = document.getElementById("deptSubmittedBy").value.trim();
  const chairEmail = document.getElementById("deptChairEmail").value.trim();
  const execSummary = document.getElementById("deptExecSummary").value.trim();
  const philosophy = document.getElementById("deptPhilosophy").value.trim();
  const objectives = document.getElementById("deptObjectives").value.trim();
  const strengths = document.getElementById("deptStrengths").value.trim();
  const improvements = document.getElementById("deptImprovements").value.trim();

  // Criteria
  const criteria = [];
  let scoreSum = 0;
  for (let i = 1; i <= 8; i++) {
    const scoreVal = parseFloat(document.getElementById(`dept_score_${i}`).value) || 0;
    const contentVal = document.getElementById(`dept_content_${i}`).value.trim();
    const evidenceVal = document.getElementById(`dept_evidence_${i}`).value.trim();
    scoreSum += scoreVal;

    criteria.push({
      id: i,
      name: CONFIG.AUN_QA_CRITERIA[i - 1].title,
      score: scoreVal,
      content: contentVal,
      evidence: evidenceVal
    });
  }
  const avgScore = (scoreSum / 8).toFixed(2);
  const completionPercent = calculateDepartmentCompletion();

  // Student stats
  const y1 = parseInt(document.getElementById("deptStdY1").value) || 0;
  const y2 = parseInt(document.getElementById("deptStdY2").value) || 0;
  const y3 = parseInt(document.getElementById("deptStdY3").value) || 0;
  const y4 = parseInt(document.getElementById("deptStdY4").value) || 0;
  const yMore = parseInt(document.getElementById("deptStdYMore").value) || 0;

  const payload = {
    status: submissionStatus,
    submittedBy: submittedBy,
    completionPercent: completionPercent,
    curriculum: {
      nameTh: curName,
      degreeLevel: degreeLevel,
      revisionYear: academicYear,
      chairEmail: chairEmail,
      executiveSummary: execSummary,
      philosophy: philosophy,
      objectives: objectives
    },
    sar: {
      curriculumNameTh: curName,
      academicYear: academicYear,
      executiveSummary: execSummary,
      philosophy: philosophy,
      objectives: objectives,
      criteria: criteria,
      overallScore: avgScore,
      strengths: strengths,
      improvements: improvements
    },
    students: {
      curriculumNameTh: curName,
      entryYear: academicYear,
      year1: y1,
      year2: y2,
      year3: y3,
      year4: y4,
      yearMore: yMore
    }
  };

  try {
    const res = await ApiService.postData("submitDepartmentData", payload);
    
    // Update local state
    const existingSarIndex = appState.allData.sarReports.findIndex(s => s.curriculumNameTh === curName);
    if (existingSarIndex !== -1) {
      appState.allData.sarReports[existingSarIndex] = payload.sar;
    } else {
      appState.allData.sarReports.unshift(payload.sar);
    }

    const existingTrackIndex = appState.allData.tracking.findIndex(t => t.curriculumName === curName);
    const updatedTrack = {
      curriculumName: curName,
      degreeLevel: degreeLevel,
      chairEmail: chairEmail,
      status: submissionStatus,
      completionPercent: completionPercent,
      evidenceCount: criteria.filter(c => c.evidence.length > 5).length + "/8",
      criteriaFilledCount: "8/8",
      overallScore: avgScore,
      submittedBy: submittedBy,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: isFinal ? "ส่งตรวจให้ฝ่ายประกันคุณภาพเรียบร้อย" : "บันทึกฉบับร่าง"
    };

    if (existingTrackIndex !== -1) {
      appState.allData.tracking[existingTrackIndex] = updatedTrack;
    } else {
      appState.allData.tracking.push(updatedTrack);
    }

    document.getElementById("deptStatusText").textContent = submissionStatus;
    document.getElementById("deptLastSaved").textContent = `บันทึกเมื่อ: ${updatedTrack.updatedAt}`;

    showToast(isFinal ? "ส่งรายงานให้ฝ่ายประกันคุณภาพเรียบร้อยแล้ว!" : "บันทึกฉบับร่างสำเร็จ", "success");

    // Refresh views
    updateSelectedCurriculumViews();
    renderTrackingTable();

    if (isFinal) {
      setTimeout(() => switchTab("tracking"), 1500);
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>ยืนยันส่งรายงานให้ฝ่ายประกันคุณภาพ</span>`;
    }
    if (draftBtn) {
      draftBtn.disabled = false;
      draftBtn.innerHTML = `<i class="fa-regular fa-floppy-disk"></i> <span>บันทึกฉบับร่าง (Save Draft)</span>`;
    }
  }
}

/**
 * 6. Views Updates (Dashboard, Charts, SAR, Guidelines)
 */
function updateSelectedCurriculumViews() {
  const selectedName = appState.selectedCurriculum;
  const currentCur = appState.allData.curriculums.find(c => c.nameTh === selectedName) || appState.allData.curriculums[0];
  const currentSAR = appState.allData.sarReports.find(s => s.curriculumNameTh === selectedName) || appState.allData.sarReports[0];

  renderDashboardStats(currentSAR);
  renderCharts(currentSAR);
  renderSARReportView(currentCur, currentSAR);
  renderStudentChart(selectedName);
}

function renderDashboardStats(sar) {
  if (!sar) return;

  const overallScore = parseFloat(sar.overallScore) || 0;
  document.getElementById("statOverallScore").textContent = overallScore.toFixed(2);

  const scale = CONFIG.RATING_SCALE.find(s => Math.round(overallScore) === s.score) || CONFIG.RATING_SCALE[3];
  const scoreLabelEl = document.getElementById("statScoreLabel");
  if (scoreLabelEl) {
    scoreLabelEl.innerHTML = `ระดับ: <span class="font-bold text-amber-300">${scale.label.split("-")[1] || "เป็นไปตามเกณฑ์"}</span>`;
  }

  const passingCount = (sar.criteria || []).filter(c => (parseFloat(c.score) || 0) >= 4.0).length;
  document.getElementById("statPassingCriteria").textContent = passingCount;

  const stds = (appState.allData.studentStats || []).filter(s => s.curriculumNameTh === appState.selectedCurriculum);
  const totalStd = stds.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
  document.getElementById("statTotalStudents").textContent = totalStd > 0 ? totalStd.toLocaleString() : "120+";

  const facultyCount = (appState.allData.faculty || []).filter(f => f.curriculumNameTh === appState.selectedCurriculum).length;
  document.getElementById("statFacultyCount").textContent = facultyCount > 0 ? facultyCount : "8";

  document.getElementById("dashboardStrengths").textContent = sar.strengths || "มีผลลัพธ์การเรียนรู้และการบริหารจัดการเป็นไปตามเกณฑ์มาตรฐาน";
  document.getElementById("dashboardImprovements").textContent = sar.improvements || "ควรส่งเสริมการเผยแพร่ผลงานวิจัยระดับนานาชาติและพัฒนาทักษะดิจิทัลต่อเนื่อง";

  const cardsContainer = document.getElementById("criteriaCardsGrid");
  if (!cardsContainer) return;

  cardsContainer.innerHTML = (sar.criteria || []).map(c => {
    const score = parseFloat(c.score) || 0;
    const isPassing = score >= 4.0;
    const statusColor = isPassing ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200";

    return `
      <div class="p-4 rounded-xl border border-slate-200/80 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">เกณฑ์ที่ ${c.id}</span>
            <span class="text-xs font-extrabold px-2 py-0.5 rounded border ${statusColor}">
              ${score.toFixed(1)} / 7
            </span>
          </div>
          <h4 class="text-xs font-bold text-slate-800 line-clamp-2 mt-1" title="${c.name}">${c.name}</h4>
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-2">${c.content || "มีการดำเนินการตามข้อกำหนดของหลักสูตรอย่างต่อเนื่อง"}</p>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
          <span class="text-slate-400">หลักฐาน:</span>
          ${c.evidence ? `<a href="${c.evidence}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1 font-medium"><i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i> เอกสารแนบ</a>` : `<span class="text-slate-400">-</span>`}
        </div>
      </div>
    `;
  }).join("");
}

function renderCharts(sar) {
  if (!sar) {
    sar = appState.allData.sarReports.find(s => s.curriculumNameTh === appState.selectedCurriculum) || appState.allData.sarReports[0];
  }
  if (!sar || !sar.criteria) return;

  const labels = sar.criteria.map(c => `เกณฑ์ ${c.id}`);
  const scores = sar.criteria.map(c => parseFloat(c.score) || 0);
  const benchmarkScores = [4, 4, 4, 4, 4, 4, 4, 4];

  const radarCtx = document.getElementById("aunQaRadarChart");
  if (radarCtx) {
    if (appState.radarChart) appState.radarChart.destroy();
    appState.radarChart = new Chart(radarCtx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "คะแนนประเมินหลักสูตร",
            data: scores,
            backgroundColor: "rgba(30, 58, 138, 0.25)",
            borderColor: "rgba(30, 58, 138, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(217, 119, 6, 1)",
            pointBorderColor: "#fff"
          },
          {
            label: "เกณฑ์เป้าหมายขั้นต่ำ (ระดับ 4)",
            data: benchmarkScores,
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            borderColor: "rgba(16, 185, 129, 0.7)",
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: "#e2e8f0" },
            grid: { color: "#e2e8f0" },
            suggestedMin: 0,
            suggestedMax: 7,
            ticks: { stepSize: 1, backdropColor: "transparent" },
            pointLabels: { font: { family: "Prompt", size: 11, weight: "bold" }, color: "#334155" }
          }
        },
        plugins: {
          legend: { position: "bottom", labels: { font: { family: "Prompt", size: 11 } } }
        }
      }
    });
  }

  const barCtx = document.getElementById("aunQaBarChart");
  if (barCtx) {
    if (appState.barChart) appState.barChart.destroy();
    const barColors = scores.map(s => s >= 5 ? "#0284c7" : s >= 4 ? "#10b981" : s >= 3 ? "#f59e0b" : "#ef4444");

    appState.barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "คะแนนรายเกณฑ์ (1-7)",
          data: scores,
          backgroundColor: barColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 7, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function renderStudentChart(curriculumFilter) {
  const chartCanvas = document.getElementById("studentDistributionChart");
  if (!chartCanvas) return;

  const stats = appState.allData.studentStats || [];
  const current = stats.find(s => s.curriculumNameTh === curriculumFilter) || stats[0] || {
    year1: 30, year2: 28, year3: 27, year4: 25, yearMore: 2
  };

  if (appState.studentChart) appState.studentChart.destroy();
  appState.studentChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: ["ปี 1", "ปี 2", "ปี 3", "ปี 4", "> 4 ปี"],
      datasets: [{
        label: "จำนวนนักศึกษา (คน)",
        data: [current.year1, current.year2, current.year3, current.year4, current.yearMore],
        backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: `สถิตินักศึกษา: ${current.curriculumNameTh || "คณะศึกษาศาสตร์"}`, font: { family: "Prompt", size: 12 } }
      }
    }
  });
}

function renderSARReportView(cur, sar) {
  if (!sar) return;

  document.getElementById("sarDocTitle").textContent = `รายงานการประเมินตนเองตามเกณฑ์ AUN-QA`;
  document.getElementById("sarDocSubtitle").textContent = sar.curriculumNameTh || (cur ? cur.nameTh : "คณะศึกษาศาสตร์");
  document.getElementById("sarDocYear").textContent = sar.academicYear || "2566";
  document.getElementById("sarDocAvgScore").textContent = (parseFloat(sar.overallScore) || 0).toFixed(2) + " / 7.00";

  document.getElementById("sarExecutiveSummary").textContent = sar.executiveSummary || (cur ? cur.executiveSummary : "-");
  document.getElementById("sarPhilosophy").textContent = sar.philosophy || (cur ? cur.philosophy : "-");
  document.getElementById("sarObjectives").textContent = sar.objectives || (cur ? cur.objectives : "-");

  const listContainer = document.getElementById("sarDetailedCriteriaList");
  if (!listContainer) return;

  listContainer.innerHTML = (sar.criteria || []).map(c => {
    const score = parseFloat(c.score) || 0;
    const ratingObj = CONFIG.RATING_SCALE.find(r => r.score === Math.round(score)) || CONFIG.RATING_SCALE[3];

    return `
      <div class="border border-slate-200 rounded-xl p-5 bg-white hover:border-blue-300 transition">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center space-x-3">
            <span class="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 font-bold flex items-center justify-center text-sm">${c.id}</span>
            <h4 class="text-sm font-bold text-slate-800">${c.name}</h4>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold text-white" style="background-color: ${ratingObj.color}">
              คะแนน: ${score.toFixed(1)} / 7
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-700 space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <div>
            <strong class="text-slate-900">คำอธิบายการดำเนินงาน:</strong>
            <p class="mt-1 text-slate-600 leading-relaxed whitespace-pre-line">${c.content || "ยังไม่ได้ระบุรายละเอียดเนื้อหาการดำเนินงาน"}</p>
          </div>
          <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span class="text-slate-500 font-medium">เอกสารและหลักฐานอ้างอิง:</span>
            ${c.evidence ? `
              <a href="${c.evidence}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <i class="fa-solid fa-folder-open"></i> เปิดโฟลเดอร์หลักฐาน
              </a>
            ` : `<span class="text-slate-400">ยังไม่มีลิงก์หลักฐาน</span>`}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCurriculumTable() {
  const tbody = document.getElementById("curriculumTableBody");
  if (!tbody) return;
  const list = appState.allData.curriculums || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-xs text-slate-400">ไม่มีข้อมูลหลักสูตร</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr class="hover:bg-slate-50 transition">
      <td class="px-4 py-3">
        <div class="font-bold text-slate-800 text-xs">${c.nameTh}</div>
        <div class="text-[11px] text-slate-400 font-mono">${c.nameEn || "-"}</div>
      </td>
      <td class="px-4 py-3 text-xs"><span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">${c.degreeLevel || "ป.ตรี"}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600">${c.revisionYear || "-"}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${c.totalCredits || "-"} นก.</td>
      <td class="px-4 py-3 text-xs text-slate-600 font-mono">${c.chairEmail || "-"}</td>
      <td class="px-4 py-3 text-xs"><span class="font-bold text-emerald-600">${c.ploScore || "-"}</span></td>
      <td class="px-4 py-3 text-center text-xs">
        ${c.ploEvidence ? `<a href="${c.ploEvidence}" target="_blank" class="text-blue-600 hover:underline"><i class="fa-solid fa-file-pdf"></i></a>` : "-"}
      </td>
    </tr>
  `).join("");
}

function renderStudentStatsTable() {
  const tbody = document.getElementById("studentsTableBody");
  if (!tbody) return;
  const list = appState.allData.studentStats || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-xs text-slate-400">ไม่มีข้อมูลสถิตินักศึกษา</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr class="hover:bg-slate-50 text-xs">
      <td class="px-3 py-2.5 font-medium text-slate-800">${s.curriculumNameTh}</td>
      <td class="px-2 py-2.5 text-center text-slate-500">${s.entryYear || "-"}</td>
      <td class="px-2 py-2.5 text-center">${s.year1 || 0}</td>
      <td class="px-2 py-2.5 text-center">${s.year2 || 0}</td>
      <td class="px-2 py-2.5 text-center">${s.year3 || 0}</td>
      <td class="px-2 py-2.5 text-center">${s.year4 || 0}</td>
      <td class="px-2 py-2.5 text-center text-slate-400">${s.yearMore || 0}</td>
      <td class="px-3 py-2.5 text-center font-bold text-blue-700">${s.total || 0}</td>
    </tr>
  `).join("");
}

function renderFacultyTable() {
  const tbody = document.getElementById("facultyTableBody");
  if (!tbody) return;
  const list = appState.allData.faculty || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-xs text-slate-400">ไม่มีข้อมูลอาจารย์</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(f => `
    <tr class="hover:bg-slate-50 text-xs">
      <td class="px-4 py-3 font-bold text-slate-800">${f.fullName}</td>
      <td class="px-4 py-3 text-slate-600">${f.curriculumNameTh}</td>
      <td class="px-4 py-3 text-slate-600"><span class="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">${f.degree}</span></td>
      <td class="px-4 py-3 text-slate-600">${f.field}</td>
      <td class="px-4 py-3 text-slate-700 max-w-xs truncate" title="${f.publications}">${f.publications}</td>
      <td class="px-4 py-3 text-center">
        ${f.referenceUrl ? `<a href="${f.referenceUrl}" target="_blank" class="text-blue-600 hover:underline"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : "-"}
      </td>
    </tr>
  `).join("");
}

function renderGuidelines() {
  const ratingGrid = document.getElementById("guideRatingScales");
  if (ratingGrid) {
    ratingGrid.innerHTML = CONFIG.RATING_SCALE.map(r => `
      <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-6 h-6 rounded-full text-white font-bold flex items-center justify-center text-xs" style="background-color: ${r.color}">${r.score}</span>
          <span class="text-xs font-bold text-slate-800">${r.label.split("-")[1] || ""}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">${r.label}</p>
      </div>
    `).join("");
  }

  const critList = document.getElementById("guideCriteriaList");
  if (critList) {
    critList.innerHTML = CONFIG.AUN_QA_CRITERIA.map(c => `
      <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition">
        <div class="flex items-center space-x-3">
          <span class="px-2.5 py-1 rounded bg-blue-900 text-amber-400 text-xs font-bold">${c.no}</span>
          <h4 class="text-sm font-bold text-slate-800">${c.title}</h4>
        </div>
        <p class="text-xs text-slate-600 mt-2 leading-relaxed">${c.desc}</p>
      </div>
    `).join("");
  }
}

/**
 * 7. Settings Modal Logic
 */
function initSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const openBtn = document.getElementById("btnOpenSettings");
  const closeBtn = document.getElementById("btnCloseSettings");
  const saveBtn = document.getElementById("btnSaveSettings");
  const testBtn = document.getElementById("btnTestConnection");
  const inputUrl = document.getElementById("inputAppsScriptUrl");
  const resultBox = document.getElementById("connectionTestResult");

  openBtn?.addEventListener("click", () => {
    inputUrl.value = ApiService.getApiUrl() || "";
    resultBox.classList.add("hidden");
    modal.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  saveBtn?.addEventListener("click", () => {
    const url = inputUrl.value.trim();
    ApiService.setApiUrl(url);
    showToast("บันทึกการตั้งค่า Web App URL สำเร็จ", "success");
    modal.classList.add("hidden");
    loadData();
  });

  testBtn?.addEventListener("click", async () => {
    const testUrl = inputUrl.value.trim();
    testBtn.disabled = true;
    testBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังทดสอบ...`;
    resultBox.classList.remove("hidden");
    resultBox.className = "p-3 rounded-lg text-xs bg-slate-100 text-slate-700";
    resultBox.textContent = "กำลังเชื่อมต่อกับ Google Apps Script...";

    const res = await ApiService.testConnection(testUrl);
    testBtn.disabled = false;
    testBtn.innerHTML = `<i class="fa-solid fa-network-wired mr-1"></i> ทดสอบการเชื่อมต่อ`;

    if (res.success) {
      resultBox.className = "p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200";
      resultBox.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> ${res.message}`;
    } else {
      resultBox.className = "p-3 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200";
      resultBox.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-1"></i> ${res.message}`;
    }
  });

  const initBtn = document.getElementById("btnInitSampleData");
  initBtn?.addEventListener("click", async () => {
    if (!ApiService.isConfigured()) {
      showToast("กรุณาระบุ Web App URL ก่อนกดปุ่มนี้", "error");
      return;
    }
    initBtn.disabled = true;
    initBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังเติมข้อมูลลง Google Sheet...`;
    try {
      const res = await ApiService.initSampleData();
      showToast("เติมข้อมูลหลักสูตรตัวอย่างลง Google Sheet สำเร็จ!", "success");
      modal.classList.add("hidden");
      loadData();
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      initBtn.disabled = false;
      initBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-amber-600 mr-1"></i> <span>เติมข้อมูลหลักสูตรตัวอย่างลง Google Sheet (Initialize Data)</span>`;
    }
  });
}

/**
 * 8. Apps Script Code & Live Console Tab
 */
function initAppsScriptTab() {
  const urlInput = document.getElementById("tabConsoleUrlInput");
  const testGetBtn = document.getElementById("btnConsoleTestGet");
  const initDataBtn = document.getElementById("btnConsoleInitData");
  const outputPre = document.getElementById("tabConsoleJsonOutput");
  const clearBtn = document.getElementById("btnClearConsoleResult");
  const copyBtn = document.getElementById("btnCopyCodeGs");
  const copyBtnText = document.getElementById("btnCopyCodeGsText");
  const codeGsElement = document.getElementById("codeGsPreElement");

  // Load current URL
  if (urlInput) {
    urlInput.value = ApiService.getApiUrl() || "";
  }

  // Load Code.gs file content for viewing
  fetch("google-apps-script/Code.gs")
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(code => {
      if (codeGsElement) codeGsElement.textContent = code;
    })
    .catch(() => {
      if (codeGsElement) codeGsElement.textContent = "// ไม่สามารถโหลดไฟล์ Code.gs ได้โดยตรง สามารถเปิดดูในโฟลเดอร์ google-apps-script/Code.gs";
    });

  // Copy Code.gs Button
  copyBtn?.addEventListener("click", () => {
    const code = codeGsElement?.textContent || "";
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      if (copyBtnText) copyBtnText.textContent = "คัดลอกโค้ดสำเร็จแล้ว! ✓";
      copyBtn.classList.replace("bg-blue-700", "bg-emerald-600");
      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = "คัดลอกโค้ดทั้งหมด (Copy Code)";
        copyBtn.classList.replace("bg-emerald-600", "bg-blue-700");
      }, 2500);
      showToast("คัดลอกโค้ด Code.gs เรียบร้อยแล้ว", "success");
    }).catch(err => {
      showToast("ไม่สามารถคัดลอกได้: " + err.message, "error");
    });
  });

  // Clear Output
  clearBtn?.addEventListener("click", () => {
    if (outputPre) outputPre.textContent = "/* ล้างการแสดงผลแล้ว */";
  });

  // Test GET getAllData
  testGetBtn?.addEventListener("click", async () => {
    const url = urlInput?.value.trim();
    if (!url) {
      showToast("กรุณาระบุ Google Apps Script Web App URL ก่อน", "error");
      return;
    }
    ApiService.setApiUrl(url);
    testGetBtn.disabled = true;
    testGetBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังดึงข้อมูล...`;
    outputPre.textContent = "// กำลังส่งคำขอ GET ไปยัง Google Apps Script...";

    try {
      const res = await fetch(`${url}?action=getAllData&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      outputPre.textContent = JSON.stringify(json, null, 2);
      showToast("ดึงข้อมูลจาก Google Apps Script สำเร็จ!", "success");
      loadData();
    } catch (err) {
      outputPre.textContent = `// เกิดข้อผิดพลาด:\n${err.message}`;
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      testGetBtn.disabled = false;
      testGetBtn.innerHTML = `<i class="fa-solid fa-play mr-1"></i> ดึงข้อมูล (GET getAllData)`;
    }
  });

  // Init Sample Data
  initDataBtn?.addEventListener("click", async () => {
    const url = urlInput?.value.trim();
    if (!url) {
      showToast("กรุณาระบุ Google Apps Script Web App URL ก่อน", "error");
      return;
    }
    ApiService.setApiUrl(url);
    initDataBtn.disabled = true;
    initDataBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังเติมข้อมูล...`;
    outputPre.textContent = "// กำลังส่งคำขอ initSampleData ไปยัง Google Apps Script เพื่อเขียนแถวข้อมูลเริ่มต้น...";

    try {
      const res = await fetch(`${url}?action=initSampleData&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      outputPre.textContent = JSON.stringify(json, null, 2);
      showToast("เติมข้อมูลเริ่มต้นลง Google Sheet เรียบร้อยแล้ว!", "success");
      loadData();
    } catch (err) {
      outputPre.textContent = `// เกิดข้อผิดพลาด:\n${err.message}`;
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      initDataBtn.disabled = false;
      initDataBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-1"></i> เติมข้อมูลเริ่มต้น (Init Data)`;
    }
  });
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-600 text-white" :
             type === "error" ? "bg-rose-600 text-white" : "bg-slate-800 text-white";

  const icon = type === "success" ? "fa-circle-check" :
               type === "error" ? "fa-circle-exclamation" : "fa-circle-info";

  toast.className = `${bg} px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center space-x-2 transition-all transform duration-300 opacity-0 translate-y-2 pointer-events-auto`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove("opacity-0", "translate-y-2"), 10);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
