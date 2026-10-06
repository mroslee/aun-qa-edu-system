/**
 * การตั้งค่าระบบประกันคุณภาพหลักสูตร AUN-QA คณะศึกษาศาสตร์
 */
const CONFIG = {
  // นำ Web App URL ที่ได้จากการ Deploy Google Apps Script มาใส่ที่นี่
  APPS_SCRIPT_URL: "",

  // Google Spreadsheet URL อ้างอิง
  SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/1V1RVt-2YWWApHWQeYmDqT1ttmZSIldLGgR84k7cW7Q4/edit?usp=sharing",

  // เกณฑ์ AUN-QA 8 ด้าน (ตามเกณฑ์ AUN-QA v4)
  AUN_QA_CRITERIA: [
    { id: 1, no: "เกณฑ์ที่ 1", title: "ผลการเรียนรู้ที่คาดหวัง (Expected Learning Outcomes - PLOs)", desc: "ความชัดเจนและการสอดคล้องของผลลัพธ์การเรียนรู้กับวิสัยทัศน์ พันธกิจ และความต้องการของผู้มีส่วนได้ส่วนเสีย" },
    { id: 2, no: "เกณฑ์ที่ 2", title: "โครงสร้างและเนื้อหาหลักสูตร (Programme Structure and Content)", desc: "ความทันสมัย ความยืดหยุ่น และการออกแบบโครงสร้างหลักสูตรที่ส่งเสริมการบรรลุ PLOs" },
    { id: 3, no: "เกณฑ์ที่ 3", title: "การจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ (Teaching and Learning Approach)", desc: "การออกแบบกระบวนการจัดการเรียนรู้เพื่อส่งเสริมการเรียนรู้ตลอดชีวิตและการเรียนรู้เชิงรุก (Active Learning)" },
    { id: 4, no: "เกณฑ์ที่ 4", title: "การประเมินผู้เรียน (Student Assessment)", desc: "ความเที่ยงตรง ความโปร่งใส เกณฑ์การวัดประเมินผลที่สะท้อนการบรรลุ PLOs" },
    { id: 5, no: "เกณฑ์ที่ 5", title: "คุณภาพอาจารย์ (Academic Staff)", desc: "คุณวุฒิ สัดส่วนอาจารย์ ผลงานทางวิชาการ และการพัฒนาศักยภาพอาจารย์อย่างต่อเนื่อง" },
    { id: 6, no: "เกณฑ์ที่ 6", title: "การบริการและการสนับสนุนนักศึกษา (Student Support Services)", desc: "ระบบการรับเข้า การให้คำปรึกษา กิจกรรมเสริมหลักสูตร และบริการสุขภาวะ" },
    { id: 7, no: "เกณฑ์ที่ 7", title: "สิ่งอำนวยความสะดวกและโครงสร้างพื้นฐาน (Facilities and Infrastructure)", desc: "ห้องเรียน ห้องปฏิบัติการฝึกสอน แหล่งสืบค้นดิจิทัล และระบบเทคโนโลยีสารสนเทศ" },
    { id: 8, no: "เกณฑ์ที่ 8", title: "ผลลัพธ์การดำเนินงาน (Output and Outcomes)", desc: "อัตราการสำเร็จการศึกษา การได้งานทำ ความพึงพอใจของผู้ใช้บัณฑิต และงานวิจัย/นวัตกรรม" }
  ],

  // ระดับการประเมิน AUN-QA 7 ระดับ
  RATING_SCALE: [
    { score: 1, label: "1 - ไม่ปรากฏการดำเนินการอย่างเพียงพอ (Absolutely Inadequate)", color: "#ef4444" },
    { score: 2, label: "2 - ไม่เพียงพอ จำเป็นต้องปรับปรุงอย่างเร่งด่วน (Inadequate and needs major improvement)", color: "#f97316" },
    { score: 3, label: "3 - ไม่เพียงพอ แต่มีการปรับปรุงบ้าง (Inadequate but has minor improvement)", color: "#f59e0b" },
    { score: 4, label: "4 - เป็นไปตามเกณฑ์มาตรฐาน (Adequate as expected)", color: "#10b981" },
    { score: 5, label: "5 - ดีกว่ามาตรฐาน (Better than adequate)", color: "#06b6d4" },
    { score: 6, label: "6 - ตัวอย่างของการปฏิบัติที่ดี (Example of best practices)", color: "#3b82f6" },
    { score: 7, label: "7 - ยอดเยี่ยมระดับสากล (Excellent/World-class)", color: "#8b5cf6" }
  ],

  // ข้อมูลจำลองเริ่มต้น (Demo Data)
  DEMO_DATA: {
    curriculums: [
      {
        rowIndex: 2,
        nameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
        nameEn: "Bachelor of Education Program in Teaching Thai Language",
        degreeLevel: "ปริญญาตรี",
        revisionYear: "2566",
        totalCredits: "138",
        chairEmail: "thai_edu@university.ac.th",
        executiveSummary: "หลักสูตรเน้นการผลิตครูภาษาไทยที่มีสมรรถนะการสอนในศตวรรษที่ 21 มีทักษะการใช้เทคโนโลยีดิจิทัล และมีจิตวิญญาณความเป็นครู",
        philosophy: "สร้างครูภาษาไทยมืออาชีพ เปี่ยมคุณธรรม บูรณาการนวัตกรรมการศึกษาเพื่อพัฒนาผู้เรียน",
        objectives: "1. เพื่อผลิตบัณฑิตครูภาษาไทยที่มีความรู้ความสามารถในศาสตร์และศิลป์การสอน 2. เพื่อส่งเสริมนวัตกรรมการจัดการเรียนรู้ภาษาไทย",
        ploContent: "PLO1: สื่อสารภาษาไทยได้อย่างถูกต้องตามมาตรฐาน PLO2: ออกแบบแผนการจัดการเรียนรู้เชิงรุก PLO3: ปฏิบัติตนตามจรรยาบรรณวิชาชีพครู",
        ploEvidence: "https://drive.google.com/drive/folders/sample-thai-plo",
        ploScore: "4.8"
      },
      {
        rowIndex: 3,
        nameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์",
        nameEn: "Bachelor of Education Program in Mathematics",
        degreeLevel: "ปริญญาตรี",
        revisionYear: "2565",
        totalCredits: "135",
        chairEmail: "math_edu@university.ac.th",
        executiveSummary: "เน้นการพัฒนาทักษะการแก้ปัญหาทางคณิตศาสตร์และการประยุกต์สะเต็มศึกษา (STEM) ในชั้นเรียน",
        philosophy: "คิดอย่างเป็นระบบ จัดการเรียนรู้คณิตศาสตร์อย่างสร้างสรรค์เพื่อศตวรรษที่ 21",
        objectives: "ผลิตครูคณิตศาสตร์ที่มีความเชี่ยวชาญด้านเนื้อหาและการจัดกระบวนการคิดเชิงวิเคราะห์",
        ploContent: "PLO1: อธิบายมโนทัศน์คณิตศาสตร์ขั้นสูง PLO2: บูรณาการ STEM ในการสอนคณิตศาสตร์",
        ploEvidence: "https://drive.google.com/drive/folders/sample-math-plo",
        ploScore: "4.6"
      },
      {
        rowIndex: 4,
        nameTh: "หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา",
        nameEn: "Master of Education Program in Educational Administration",
        degreeLevel: "ปริญญาโท",
        revisionYear: "2567",
        totalCredits: "36",
        chairEmail: "admin_edu@university.ac.th",
        executiveSummary: "ผลิตผู้บริหารสถานศึกษาและผู้นำการเปลี่ยนแปลงที่มีวิสัยทัศน์ดิจิทัลและการบริหารจัดการสถานศึกษาตามเกณฑ์คุณภาพสากล",
        philosophy: "ผู้นำการเปลี่ยนแปลงทางการศึกษา บริหารด้วยธรรมาภิบาล สู่ความเป็นเลิศทางวิชาการ",
        objectives: "พัฒนาภาวะผู้นำทางวิชาการและทักษะการบริหารจัดการองค์กรการศึกษายุคใหม่",
        ploContent: "PLO1: วิเคราะห์นโยบายและวางแผนกลยุทธ์สถานศึกษา PLO2: วิจัยเชิงปฏิบัติการเพื่อแก้ปัญหาการศึกษา",
        ploEvidence: "https://drive.google.com/drive/folders/sample-med-plo",
        ploScore: "5.1"
      },
      {
        rowIndex: 5,
        nameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ",
        nameEn: "Bachelor of Education Program in English",
        degreeLevel: "ปริญญาตรี",
        revisionYear: "2566",
        totalCredits: "136",
        chairEmail: "english_edu@university.ac.th",
        executiveSummary: "เน้นสมรรถนะการสื่อสารระดับสากล CEFR C1 และการออกแบบการสอนภาษาอังกฤษผ่านเทคโนโลยี",
        philosophy: "สร้างครูภาษาอังกฤษสากล นำนวัตกรรมสู่ห้องเรียนอย่างสร้างสรรค์",
        objectives: "เพื่อผลิตบัณฑิตครูภาษาอังกฤษที่มีทักษะภาษาระดับสูงและการสอนภาษาเชิงบูรณาการ",
        ploContent: "PLO1: สื่อสารภาษาอังกฤษระดับ CEFR C1 PLO2: ใช้เทคโนโลยีการสอนภาษาอังกฤษ",
        ploEvidence: "https://drive.google.com/drive/folders/sample-eng-plo",
        ploScore: "4.5"
      },
      {
        rowIndex: 6,
        nameTh: "หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน",
        nameEn: "Doctor of Education Program in Curriculum and Instruction",
        degreeLevel: "ปริญญาเอก",
        revisionYear: "2566",
        totalCredits: "48",
        chairEmail: "phd_ci@university.ac.th",
        executiveSummary: "สร้างนักวิจัยและผู้เชี่ยวชาญด้านหลักสูตรและการจัดการเรียนรู้เพื่อยกระดับคุณภาพการศึกษา",
        philosophy: "ผู้เชี่ยวชาญด้านหลักสูตร วิจัยเชิงลึก สร้างนวัตกรรมการศึกษาเพื่อการพัฒนาที่ยั่งยืน",
        objectives: "ผลิตดุษฎีบัณฑิตที่มีความสามารถในการวิจัยและพัฒนานโยบายหลักสูตรระดับชาติและนานาชาติ",
        ploContent: "PLO1: สร้างองค์ความรู้ใหม่ด้านหลักสูตร PLO2: เผยแพร่ผลงานวิจัยระดับสากล",
        ploEvidence: "",
        ploScore: "0"
      }
    ],
    sarReports: [
      {
        curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
        academicYear: "2566",
        executiveSummary: "ภาพรวมการดำเนินงานตามเกณฑ์ AUN-QA บรรลุตามเป้าหมาย โดยเฉพาะด้านผลลัพธ์การเรียนรู้และการดูแลนักศึกษา",
        philosophy: "สร้างครูภาษาไทยมืออาชีพ เปี่ยมคุณธรรม บูรณาการนวัตกรรมการศึกษาเพื่อพัฒนาผู้เรียน",
        objectives: "ผลิตบัณฑิตครูภาษาไทยที่มีสมรรถนะสูงตอบสนองความต้องการของสถานศึกษา",
        criteria: [
          { id: 1, name: "ผลการเรียนรู้ที่คาดหวัง (PLOs)", content: "มีการกำหนด PLOs 6 ข้อ ครอบคลุมความรู้ ทักษะ เจตคติ สอดคล้องกับมาตรฐานคุรุสภา", evidence: "https://drive.google.com/drive/folders/c1-evidence", score: 4.8 },
          { id: 2, name: "โครงสร้างและเนื้อหาหลักสูตร", content: "รายวิชามีการจัดเรียงตามลำดับความยากง่าย มีการบูรณาการการฝึกประสบการณ์วิชาชีพครู", evidence: "https://drive.google.com/drive/folders/c2-evidence", score: 4.5 },
          { id: 3, name: "การจัดการเรียนการสอนเน้นผู้เรียน", content: "อาจารย์ใช้การจัดการเรียนรู้แบบ Active Learning, Problem-Based Learning และ Microteaching", evidence: "https://drive.google.com/drive/folders/c3-evidence", score: 4.6 },
          { id: 4, name: "การประเมินผู้เรียน", content: "ใช้การประเมินตามสภาพจริงด้วย Rubrics Score และการสะท้อนคิด (Reflective Thinking)", evidence: "https://drive.google.com/drive/folders/c4-evidence", score: 4.4 },
          { id: 5, name: "คุณภาพอาจารย์", content: "อาจารย์ประจำหลักสูตรมีวุฒิปริญญาเอกร้อยละ 60 และมีตำแหน่งทางวิชาการร้อยละ 70", evidence: "https://drive.google.com/drive/folders/c5-evidence", score: 4.7 },
          { id: 6, name: "การบริการและสนับสนุนนักศึกษา", content: "มีระบบอาจารย์ที่ปรึกษา คลินิกภาษาไทย และการติวสอบใบประกอบวิชาชีพครู", evidence: "https://drive.google.com/drive/folders/c6-evidence", score: 4.9 },
          { id: 7, name: "สิ่งอำนวยความสะดวก", content: "มีห้องปฏิบัติการสอนจำลอง (Smart Classroom) และห้องสมุดเฉพาะสาขาวิชา", evidence: "https://drive.google.com/drive/folders/c7-evidence", score: 4.3 },
          { id: 8, name: "ผลลัพธ์การดำเนินงาน", content: "บัณฑิตสอบผ่านใบประกอบวิชาชีพครูในรอบแรก ร้อยละ 94 และมีงานทำภายใน 1 ปี ร้อยละ 92", evidence: "https://drive.google.com/drive/folders/c8-evidence", score: 4.8 }
        ],
        overallScore: 4.63,
        strengths: "1. คณาจารย์มีความเชี่ยวชาญและทุ่มเท\n2. บัณฑิตสอบบรรจุครูผู้ช่วยและได้รับใบประกอบวิชาชีพในอัตราสูงมาก\n3. มีเครือข่ายโรงเรียนร่วมพัฒนาวิชาชีพครูที่เข้มแข็ง",
        improvements: "1. ควรเพิ่มการตีพิมพ์ผลงานวิจัยของอาจารย์ในฐานข้อมูลระดับนานาชาติ (Scopus/TCI1)\n2. ปรับปรุงระบบห้องปฏิบัติการมัลติมีเดียสำหรับการสอนออนไลน์"
      },
      {
        curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์",
        academicYear: "2566",
        executiveSummary: "หลักสูตรจัดการเรียนการสอนแบบ STEM บรรลุตามมาตรฐานของคุรุสภาและกระทรวง อว.",
        philosophy: "คิดอย่างเป็นระบบ จัดการเรียนรู้คณิตศาสตร์อย่างสร้างสรรค์เพื่อศตวรรษที่ 21",
        objectives: "ผลิตครูคณิตศาสตร์ที่มีความเชี่ยวชาญด้านเนื้อหาและการจัดกระบวนการคิดเชิงวิเคราะห์",
        criteria: [
          { id: 1, name: "ผลการเรียนรู้ที่คาดหวัง (PLOs)", content: "กำหนด PLOs สอดคล้องกับมาตรฐานสะเต็มศึกษา", evidence: "https://drive.google.com/drive/folders/math-c1", score: 4.6 },
          { id: 2, name: "โครงสร้างและเนื้อหาหลักสูตร", content: "โครงสร้างหลักสูตรทันสมัย มีวิชาเทคโนโลยีคณิตศาสตร์", evidence: "https://drive.google.com/drive/folders/math-c2", score: 4.5 },
          { id: 3, name: "การจัดการเรียนการสอนเน้นผู้เรียน", content: "เน้นการทดลองและแก้ปัญหาโจทย์ประยุกต์จริง", evidence: "https://drive.google.com/drive/folders/math-c3", score: 4.5 },
          { id: 4, name: "การประเมินผู้เรียน", content: "ประเมินสมรรถนะการจัดกิจกรรมการเรียนรู้คณิตศาสตร์", evidence: "https://drive.google.com/drive/folders/math-c4", score: 4.4 },
          { id: 5, name: "คุณภาพอาจารย์", content: "อาจารย์ทุกคนมีงานวิจัยและตีพิมพ์สม่ำเสมอ", evidence: "https://drive.google.com/drive/folders/math-c5", score: 4.8 },
          { id: 6, name: "การบริการและสนับสนุนนักศึกษา", content: "มีระบบติวสอบและให้ทุนการศึกษาแก่นักศึกษาเรียนดี", evidence: "https://drive.google.com/drive/folders/math-c6", score: 4.4 },
          { id: 7, name: "สิ่งอำนวยความสะดวก", content: "ห้องปฏิบัติการคอมพิวเตอร์และซอฟต์แวร์ Geometer's Sketchpad/GeoGebra", evidence: "https://drive.google.com/drive/folders/math-c7", score: 4.6 },
          { id: 8, name: "ผลลัพธ์การดำเนินงาน", content: "อัตราการได้งานทำของบัณฑิตร้อยละ 90", evidence: "https://drive.google.com/drive/folders/math-c8", score: 4.5 }
        ],
        overallScore: 4.54,
        strengths: "นักศึกษามีทักษะการคำนวณและการใช้เทคโนโลยีคณิตศาสตร์ยอดเยี่ยม",
        improvements: "เพิ่มความร่วมมือกับโรงเรียนเครือข่ายในการจัดค่ายคณิตศาสตร์สัญจร"
      }
    ],
    studentStats: [
      { curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย", entryYear: "2566", year1: 32, year2: 30, year3: 28, year4: 29, yearMore: 2, total: 121 },
      { curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์", entryYear: "2566", year1: 30, year2: 28, year3: 27, year4: 25, yearMore: 1, total: 111 },
      { curriculumNameTh: "หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา", entryYear: "2566", year1: 18, year2: 16, year3: 4, year4: 0, yearMore: 0, total: 38 },
      { curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ", entryYear: "2566", year1: 35, year2: 32, year3: 30, year4: 28, yearMore: 3, total: 128 },
      { curriculumNameTh: "หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน", entryYear: "2566", year1: 5, year2: 4, year3: 6, year4: 2, yearMore: 1, total: 18 }
    ],
    faculty: [
      {
        curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
        fullName: "ผศ.ดร.สมชาย ใจดี",
        degree: "กศ.ด. (การสอนภาษาไทย)",
        field: "การสอนภาษาไทยและนวัตกรรมการเรียนรู้",
        publications: "การพัฒนารูปแบบการจัดการเรียนรู้วรรณคดีไทยด้วยเทคโนโลยีดิจิทัล (TCI กลุ่ม 1, 2566)",
        referenceUrl: "https://tci-thailand.org/sample-article-1"
      },
      {
        curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
        fullName: "รศ.ดร.พรพิมล สุขเกษม",
        degree: "ปร.ด. (ภาษาศาสตร์ประยุกต์)",
        field: "ภาษาศาสตร์ประยุกต์เพื่อการสอน",
        publications: "การวิเคราะห์ข้อผิดพลาดทางไวยากรณ์ในการเขียนของนักเรียนชั้นมัธยมศึกษา (2565)",
        referenceUrl: "https://tci-thailand.org/sample-article-2"
      },
      {
        curriculumNameTh: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์",
        fullName: "ผศ.ดร.กิตติพงษ์ วิริยะกิจ",
        degree: "วท.ด. (คณิตศาสตร์ศึกษา)",
        field: "คณิตศาสตร์ศึกษาและสะเต็มศึกษา",
        publications: "Effects of STEM-based learning on Mathematical Problem Solving (Scopus Q2, 2024)",
        referenceUrl: "https://scopus.com/sample-article-3"
      }
    ],
    // ข้อมูลจำลองสำหรับการติดตามสถานะของแต่ละสาขา
    tracking: [
      {
        curriculumName: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาการสอนภาษาไทย",
        degreeLevel: "ปริญญาตรี",
        chairEmail: "thai_edu@university.ac.th",
        status: "ส่งรายงานแล้ว",
        completionPercent: 100,
        evidenceCount: "8/8",
        criteriaFilledCount: "8/8",
        overallScore: 4.63,
        submittedBy: "ผศ.ดร.สมชาย ใจดี (ประธานหลักสูตร)",
        updatedAt: "2026-10-04 14:30",
        notes: "เอกสารครบถ้วนสมบูรณ์ พร้อมรับการตรวจประเมิน"
      },
      {
        curriculumName: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์",
        degreeLevel: "ปริญญาตรี",
        chairEmail: "math_edu@university.ac.th",
        status: "ส่งรายงานแล้ว",
        completionPercent: 100,
        evidenceCount: "8/8",
        criteriaFilledCount: "8/8",
        overallScore: 4.54,
        submittedBy: "ผศ.ดร.กิตติพงษ์ วิริยะกิจ",
        updatedAt: "2026-10-03 16:15",
        notes: "ส่งรายงานและแนบลิงก์หลักฐานครบถ้วน"
      },
      {
        curriculumName: "หลักสูตรการศึกษามหาบัณฑิต สาขาวิชาการบริหารการศึกษา",
        degreeLevel: "ปริญญาโท",
        chairEmail: "admin_edu@university.ac.th",
        status: "กำลังกรอกข้อมูล",
        completionPercent: 65,
        evidenceCount: "4/8",
        criteriaFilledCount: "6/8",
        overallScore: 5.10,
        submittedBy: "รศ.ดร.นพพร ปัญญาเลิศ",
        updatedAt: "2026-10-05 09:20",
        notes: "อยู่ระหว่างรวบรวมหลักฐานเกณฑ์ที่ 5 และ 7"
      },
      {
        curriculumName: "หลักสูตรการศึกษาบัณฑิต สาขาวิชาภาษาอังกฤษ",
        degreeLevel: "ปริญญาตรี",
        chairEmail: "english_edu@university.ac.th",
        status: "กำลังกรอกข้อมูล",
        completionPercent: 40,
        evidenceCount: "2/8",
        criteriaFilledCount: "4/8",
        overallScore: 4.50,
        submittedBy: "อ.ดร.สุภาพร สุขสม",
        updatedAt: "2026-10-02 11:00",
        notes: "บันทึกข้อมูลหลักสูตรและเกณฑ์ 1-3 แล้ว"
      },
      {
        curriculumName: "หลักสูตรการศึกษาดุษฎีบัณฑิต สาขาวิชาหลักสูตรและการเรียนการสอน",
        degreeLevel: "ปริญญาเอก",
        chairEmail: "phd_ci@university.ac.th",
        status: "ยังไม่เริ่ม",
        completionPercent: 10,
        evidenceCount: "0/8",
        criteriaFilledCount: "0/8",
        overallScore: 0,
        submittedBy: "-",
        updatedAt: "-",
        notes: "รอนัดประชุมคณะกรรมการเพื่อประเมินตนเอง"
      }
    ]
  }
};
