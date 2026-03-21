"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperSchema = void 0;
exports.generateQuestionPaper = generateQuestionPaper;
exports.extractMetadataFromImage = extractMetadataFromImage;
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
// Zod schema to validate AI JSON response
const QuestionSchema = zod_1.z.object({
    number: zod_1.z.number(),
    text: zod_1.z.string(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    marks: zod_1.z.number(),
    type: zod_1.z.string(),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    answer: zod_1.z.string().optional(), // model answer / correct option
});
const SectionSchema = zod_1.z.object({
    label: zod_1.z.string(),
    title: zod_1.z.string(),
    instruction: zod_1.z.string(),
    questions: zod_1.z.array(QuestionSchema),
});
exports.PaperSchema = zod_1.z.object({
    suggestedTitle: zod_1.z.string().optional(),
    sections: zod_1.z.array(SectionSchema),
    timeAllowed: zod_1.z.string().optional(),
});
function buildPrompt(assignment) {
    const sectionLabels = ['A', 'B', 'C', 'D', 'E'];
    const questionTypes = assignment.questionConfig.map((q, i) => ({
        ...q,
        label: sectionLabels[i] || String.fromCharCode(65 + i),
    }));
    return `You are an expert educator creating a structured exam/question paper for students.

Subject: ${assignment.subject}
Grade/Class: ${assignment.grade}
Assignment Title: ${assignment.title}
Additional Instructions: ${assignment.additionalInstructions || 'None'}

Create a question paper with exactly these sections:
${questionTypes
        .map((q) => `- Section ${q.label}: ${q.count} ${(q.type || 'Question')} (${q.marksPerQuestion} marks each)`)
        .join('\n')}

Rules:
1. For Multiple Choice Questions, include an "options" array with 4 choices (A, B, C, D format like "A) option text")
2. For MCQ, the "answer" field should be the correct option letter + text, e.g. "A) Water"
3. For all other question types, the "answer" field should be a concise model answer (1-3 sentences)
4. Questions must be relevant to the subject and grade level
5. Number questions sequentially within each section starting at 1
6. Each section must have exactly the count specified
7. difficulty: assign "easy", "medium", or "hard" — mix them naturally
8. The "suggestedTitle" field must be in the form "Quiz on [specific topic]" e.g. "Quiz on Electromagnetism"

RESPOND ONLY with a single valid JSON object matching this schema exactly (no markdown, no explanation):
{
  "suggestedTitle": "Quiz on [Topic]",
  "timeAllowed": "45 minutes",
  "sections": [
    {
      "label": "A",
      "title": "Section Title (e.g. Short Answer Questions)",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "number": 1,
          "text": "Question text here",
          "difficulty": "easy",
          "marks": 2,
          "type": "short",
          "options": [],
          "answer": "A concise model answer here"
        }
      ]
    }
  ]
}`;
}
async function generateQuestionPaper(assignment) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY not set');
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildPrompt(assignment);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Strip markdown code fences if present
    const cleaned = text
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch {
        throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
    }
    // Validate with Zod
    const validated = exports.PaperSchema.parse(parsed);
    return validated;
}
/** Extract subject, grade, and title from an uploaded image using Gemini Vision */
async function extractMetadataFromImage(imageBuffer, mimeType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return { subject: 'General', grade: 'General', title: 'Assignment' };
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageBuffer.toString('base64'),
                },
            },
            `Look at this image and extract the academic subject, class/grade, and a short quiz-style title.
Respond ONLY with a JSON object like this (no markdown, no explanation):
{"subject":"Physics","grade":"Class 10","title":"Quiz on Electricity"}
The title must start with "Quiz on" followed by the specific topic visible in the image.
If you cannot determine clearly, use "General" for subject/grade and "Quiz on General Topic" for title.`,
        ]);
        const raw = result.response
            .text()
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();
        const obj = JSON.parse(raw);
        return {
            subject: obj.subject?.trim() || 'General',
            grade: obj.grade?.trim() || 'General',
            title: obj.title?.trim() || 'Assignment',
        };
    }
    catch {
        return { subject: 'General', grade: 'General', title: 'Assignment' };
    }
}
