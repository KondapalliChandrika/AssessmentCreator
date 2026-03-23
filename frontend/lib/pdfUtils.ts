import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QuestionPaper } from './types';

// ── Mirror of backend pdfService.ts renderPaperHTML ──────────────────────────

function getSectionLabel(label: string): string {
  return `Section ${label}`;
}

function renderPaperHTML(paper: QuestionPaper): string {
  // ── Question sections ──────────────────────────────────────────────────────
  // Use an explicit counter — html2canvas does NOT render CSS list-style counters
  let questionCounter = 0;
  const questionsHTML = paper.sections
    .map(
      (section) => `
    <div class="section">
      <h3>${getSectionLabel(section.label)}: ${section.title}</h3>
      <p class="instruction">${section.instruction}</p>
      <div class="question-list">
        ${section.questions
          .map(
            (q) => {
              questionCounter++;
              return `
          <div class="question-item">
            <div class="question-row">
              <span class="q-num">${questionCounter}.</span>
              <span class="question-text">${q.text}</span>
              <span class="marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span>
              <span class="difficulty difficulty-${q.difficulty}">${q.difficulty}</span>
            </div>
            ${q.options && q.options.length > 0
                  ? `<ul class="options">${q.options.map((opt) => `<li>${opt}</li>`).join('')}</ul>`
                  : ''
                }
          </div>
        `;
            }
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('');

  // ── Answer Key section ──────────────────────────────────────────────────────
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
    /* Question list — explicit numbering so html2canvas picks it up */
    .question-list { padding-left: 0; }
    .question-item { margin-bottom: 12px; font-size: 13px; }
    .question-row { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
    .q-num { font-weight: bold; min-width: 22px; flex-shrink: 0; }
    .options { margin-top: 4px; padding-left: 32px; list-style-type: none; }
    .options li { margin: 2px 0; font-size: 12px; }
    .marks { font-size: 11px; color: #555; margin-left: 4px; white-space: nowrap; }
    .difficulty { display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase;
      padding: 1px 7px; border-radius: 999px; margin-left: 6px; letter-spacing: 0.5px; white-space: nowrap; }
    .difficulty-easy   { background: #d1fae5; color: #065f46; }
    .difficulty-medium { background: #fef3c7; color: #92400e; }
    .difficulty-hard   { background: #fee2e2; color: #991b1b; }
    .end-line { border-top: 1px solid #333; margin-top: 24px; padding-top: 8px; font-size: 13px; font-weight: bold; }

    /* Answer Key styles */
    .answer-key { margin-top: 32px; }
    .answer-key h2 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
    .answer-key ol { padding-left: 20px; list-style-type: decimal; }
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

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Renders the question paper as a PDF and triggers a browser download.
 * Mirrors the backend Puppeteer-based PDF exactly in appearance.
 */
export async function downloadPDF(paper: QuestionPaper): Promise<void> {
  const html = renderPaperHTML(paper);

  // ── Off-screen container ─────────────────────────────────────────────────
  // Wrap in a zero-size clipping div so html2canvas never scrolls the viewport
  // (position:fixed at -9999px causes the page to jump/minimize on some browsers)
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:-9999';

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;top:0;left:0;width:794px;background:#ffffff';
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    // Find where the Answer Key starts BEFORE snapshotting (DOM is live here)
    const answerKeyEl = container.querySelector('.answer-key') as HTMLElement | null;
    // offsetTop is in unscaled px relative to the container
    const answerKeyOffsetPx = answerKeyEl ? answerKeyEl.offsetTop : null;

    // Snapshot the rendered HTML at 2× scale for crispness
    // scrollX/Y=0 prevents html2canvas from shifting the viewport
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight();  // 297 mm

    const marginTop = 20;
    const marginBottom = 20;
    const marginLeft = 15;
    const marginRight = 15;

    const contentWidth = pageWidth - marginLeft - marginRight;   // 180 mm
    const contentHeight = pageHeight - marginTop - marginBottom;  // 257 mm

    // canvas is at scale=2, so canvas px = DOM px * 2
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // Convert the full image height to mm (proportional to content width)
    const imgHeightMm = (imgHeightPx / imgWidthPx) * contentWidth;

    // Convert the answer-key DOM offset to mm in the same coordinate space
    // (DOM px → canvas px via *2, then canvas px → mm via the same ratio)
    const answerKeyMm = answerKeyOffsetPx !== null
      ? ((answerKeyOffsetPx * 2) / imgWidthPx) * contentWidth
      : null;

    // Helper: draw a slice of the full canvas onto the current PDF page
    // Helper: draw a slice of the full canvas onto the current PDF page
    const addSlice = (startMm: number, endMm: number) => {
      const sliceHeightMm = endMm - startMm;
      if (sliceHeightMm <= 0) return;

      const srcYPx = (startMm / imgHeightMm) * imgHeightPx;
      const sliceHeightPx = (sliceHeightMm / imgHeightMm) * imgHeightPx;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgWidthPx;
      sliceCanvas.height = Math.ceil(sliceHeightPx);
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, -srcYPx);

      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        marginLeft, marginTop,
        contentWidth, sliceHeightMm,
      );
    }

    // ── Pagination with forced page-break at Answer Key ──────────────────
    let yOffset = 0;   // mm already placed on PDF pages
    let firstPage = true;

    while (yOffset < imgHeightMm) {
      if (!firstPage) pdf.addPage();

      // Determine the natural end of this page
      let pageEnd = Math.min(yOffset + contentHeight, imgHeightMm);

      // If the Answer Key boundary falls inside this page (but not at its very start),
      // cut the page short so the Answer Key always begins on a fresh page.
      if (
        answerKeyMm !== null &&
        answerKeyMm > yOffset &&   // hasn't started yet
        answerKeyMm < pageEnd      // falls within this page
      ) {
        pageEnd = answerKeyMm;     // stop just before it
      }

      addSlice(yOffset, pageEnd);
      yOffset = pageEnd;
      firstPage = false;

      // If we just cut short to land at the answer-key boundary, the next
      // iteration will naturally add a new page and start from answerKeyMm.
    }

    const fileName = `${paper.metadata.title || paper.metadata.subject}_${paper.metadata.grade}.pdf`
      .replace(/\s+/g, '_');
    pdf.save(fileName);
  } finally {
    document.body.removeChild(wrapper);
  }
}
