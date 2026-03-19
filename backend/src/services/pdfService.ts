import puppeteer from 'puppeteer';
import { IQuestionPaper } from '../models/QuestionPaper';

function getSectionLabel(label: string): string {
  return `Section ${label}`;
}

function renderPaperHTML(paper: IQuestionPaper): string {
  // ── Question sections ─────────────────────────────────────────
  const questionsHTML = paper.sections
    .map(
      (section) => `
    <div class="section">
      <h3>${getSectionLabel(section.label)}: ${section.title}</h3>
      <p class="instruction">${section.instruction}</p>
      <ol>
        ${section.questions
          .map(
            (q) => `
          <li>
            <span class="question-text">${q.text}</span>
            <span class="marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span>
            ${q.options && q.options.length > 0
                ? `<ul class="options">${q.options.map((opt) => `<li>${opt}</li>`).join('')}</ul>`
                : ''
              }
          </li>
        `
          )
          .join('')}
      </ol>
    </div>
  `
    )
    .join('');

  // ── Answer Key section ────────────────────────────────────────
  // Collect only questions that have a meaningful "answer" field or generate numbered answers
  // The AI stores question text — we build a numbered list from each section
  let answerNumber = 1;
  const answerKeyHTML = paper.sections
    .map((section) =>
      section.questions
        .map((q) => {
          const num = answerNumber++;
          const answerText = q.answer?.trim() || 'Refer to solution guide.';
          return `<li><strong>${num}.</strong> <em>${answerText}</em></li>`;
        })
        .join('')
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; margin: 40px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 20px; }
    .header h2 { margin: 4px 0; font-size: 16px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; }
    .student-info { margin-bottom: 20px; font-size: 13px; }
    .student-info p { margin: 4px 0; }
    .instruction-box { border: 1px solid #ccc; padding: 8px 14px; font-size: 12px; margin-bottom: 20px; }
    .section { margin-bottom: 28px; }
    .section h3 { font-size: 15px; border-bottom: 1px solid #aaa; padding-bottom: 4px; }
    .instruction { font-style: italic; font-size: 12px; color: #444; margin-bottom: 8px; }
    ol { padding-left: 20px; }
    ol li { margin-bottom: 10px; font-size: 13px; }
    .options { margin-top: 4px; padding-left: 20px; list-style-type: none; }
    .options li { margin: 2px 0; font-size: 12px; }
    .marks { font-size: 11px; color: #555; margin-left: 4px; }
    .end-line { border-top: 1px solid #333; margin-top: 24px; padding-top: 8px; font-size: 13px; font-weight: bold; }

    /* Answer Key styles */
    .answer-key { page-break-before: always; margin-top: 32px; }
    .answer-key h2 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
    .answer-key ol { padding-left: 20px; }
    .answer-key ol li { font-size: 12px; margin-bottom: 8px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${paper.metadata.school}</h1>
    <h2>Subject: ${paper.metadata.subject}</h2>
    <h2>Class: ${paper.metadata.grade}</h2>
  </div>
  <div class="meta">
    <span>Time Allowed: ${paper.metadata.timeAllowed}</span>
    <span>Maximum Marks: ${paper.metadata.totalMarks}</span>
  </div>
  <div class="student-info">
    <p>Name: ____________________________</p>
    <p>Roll Number: ______________________</p>
    <p>Class: 5th &nbsp; Section: ________________</p>
  </div>
  <div class="instruction-box">
    All questions are compulsory unless stated otherwise.
  </div>
  ${questionsHTML}
  <div class="end-line">End of Question Paper</div>

  <!-- ─── Answer Key ─── -->
  <div class="answer-key">
    <h2>Answer Key</h2>
    <ol>
      ${answerKeyHTML}
    </ol>
  </div>
</body>
</html>`;
}

export async function generatePDF(paper: IQuestionPaper): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    // On Render: uses system Chromium via PUPPETEER_EXECUTABLE_PATH env var
    // Locally: falls back to Puppeteer's bundled Chromium
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });
  const page = await browser.newPage();
  await page.setContent(renderPaperHTML(paper), { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  await browser.close();
  return Buffer.from(pdfBuffer);
}
