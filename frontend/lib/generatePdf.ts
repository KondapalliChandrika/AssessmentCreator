import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuestionPaper } from './types';

/**
 * Replicate the backend PDF generation logic on the frontend to avoid
 * Puppeteer deployment issues. Use jsPDF + html2canvas for browser-side rendering.
 */
export async function generatePdf(paper: QuestionPaper) {
  // Set html2canvas on window for jsPDF to find it
  if (typeof window !== 'undefined') {
    (window as unknown as { html2canvas: typeof html2canvas }).html2canvas = html2canvas;
  }

  // Create a temporary container for the HTML content
  const container = document.createElement('div');
  // Hide it from user but keep it "visible" to the browser renderer
  container.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 190mm; /* Sightly less than 210mm to avoid clipping */
        z-index: -9999;
        background: white;
        opacity: 0.01;
        pointer-events: none;
        font-family: 'Times New Roman', serif;
        color: #111;
        padding: 5mm;
        box-sizing: border-box;
    `;

  // Helper for labels
  const getSectionLabel = (label: string) => `Section ${label}`;

  // Question sections
  const questionsHTML = paper.sections
    .map(
      (section) => `
        <div style="margin-bottom: 24px; width: 100%;">
          <h3 style="font-size: 16px; border-bottom: 1px solid #aaa; padding-bottom: 4px; margin-bottom: 8px;">
            ${getSectionLabel(section.label)}: ${section.title}
          </h3>
          <p style="font-style: italic; font-size: 13px; color: #444; margin-bottom: 12px;">${section.instruction}</p>
          <div style="padding-left: 5px;">
            ${section.questions
          .map(
            (q) => `
              <div style="margin-bottom: 15px; font-size: 14px; position: relative; width: 100%;">
                <div style="font-weight: 500; display: inline-block; vertical-align: top; width: 25px;">${q.number}.</div>
                <div style="display: inline-block; vertical-align: top; width: calc(100% - 30px);">
                    <span style="font-weight: 500;">${q.text}</span>
                    <span style="font-size: 11px; color: #555; margin-left: 6px;">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span>
                   
                    ${q.options && q.options.length > 0
                ? `<div style="margin-top: 6px; padding-left: 10px;">
                            ${q.options.map((opt) => `<div style="margin: 3px 0; font-size: 13px;">• ${opt}</div>`).join('')}
                          </div>`
                : ''
              }
                </div>
              </div>
            `
          )
          .join('')}
          </div>
        </div>
      `
    )
    .join('');

  // Answer Key
  let answerNumber = 1;
  const answerKeyHTML = paper.sections
    .map((section) =>
      section.questions
        .map((q) => {
          const num = answerNumber++;
          const answerText = q.answer?.trim() || 'Refer to solution guide.';
          return `<div style="font-size: 13px; margin-bottom: 8px;"><strong>${num}.</strong> <em style="color: #333;">${answerText}</em></div>`;
        })
        .join('')
    )
    .join('');

  container.innerHTML = `
    <div style="background: white; padding: 15mm; min-height: 297mm; width: 100%; box-sizing: border-box;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">${paper.metadata.school}</h1>
          <h2 style="margin: 6px 0; font-size: 15px;">Subject: ${paper.metadata.subject}</h2>
          <h2 style="margin: 4px 0; font-size: 15px;">Class: ${paper.metadata.grade}</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
          <span><strong>Time Allowed:</strong> ${paper.metadata.timeAllowed}</span>
          <span><strong>Maximum Marks:</strong> ${paper.metadata.totalMarks}</span>
        </div>

        <div style="margin-bottom: 24px; font-size: 13px; line-height: 2;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 8px;">Name: </div>
          <div style="border-bottom: 1px solid #000; margin-bottom: 8px;">Roll Number: </div>
          <div style="border-bottom: 1px solid #000;">Class/Section: </div>
        </div>

        <div style="border: 1px solid #ccc; padding: 10px 15px; font-size: 12px; margin-bottom: 24px; background-color: #f9f9f9;">
          <strong>Instructions:</strong> All questions are compulsory unless stated otherwise.
        </div>

        ${questionsHTML}

        <div style="border-top: 1px solid #333; margin-top: 30px; padding-top: 10px; font-size: 13px; font-weight: bold; text-align: center;">
          End of Question Paper
        </div>

        <div style="page-break-before: always; border-top: 2px solid #000; margin-top: 40px; padding-top: 20px;">
          <h2 style="font-size: 17px; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 16px;">Answer Key</h2>
          <div style="padding-left: 0;">
            ${answerKeyHTML}
          </div>
        </div>
    </div>
  `;

  document.body.appendChild(container);

  // Wait for the browser to ensure the container is rendered
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const filename = `${paper.metadata.subject.replace(/\s+/g, '_')}_${paper.metadata.grade.replace(/\s+/g, '_')}_Paper.pdf`;

    await doc.html(container, {
      callback: function (d) {
        d.save(filename);
      },
      x: 0,
      y: 0,
      margin: [10, 10, 10, 10],
      autoPaging: 'text',
      width: 190, // Match container width in mm
      windowWidth: 800 // High enough to render properly
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
