/**
 * AI Service – Google Vertex AI (Gemini) for the AI Sandwich workflow
 * Steps: SEO Analyst (outline, optional Google Search grounding) → Drafter (draft) → Comedian (add humor via systemInstruction)
 * Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials (e.g. gcloud auth application-default login).
 */

const { VertexAI } = require("@google-cloud/vertexai");
const { config } = require("../config");
const { AI_PROMPTS, AI_CONFIG } = require("../constants");
const { ERROR_MESSAGES } = require("../constants/messages");
const { AppError } = require("../middleware/errorHandler");

function getVertexAI() {
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;
  const location = config.googleCloudLocation || process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  if (!project || project.trim() === "") {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_PROJECT_MISSING, 503);
  }
  const opts = { project, location };
  if (config.googleApplicationCredentials) {
    opts.googleAuthOptions = { keyFilename: config.googleApplicationCredentials };
  }
  return new VertexAI(opts);
}

function getBaseModel() {
  const vertexAI = getVertexAI();
  const modelName = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || AI_CONFIG.DEFAULT_MODEL;
  return vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: AI_CONFIG.MAX_COMEDIAN_TOKENS },
  });
}

function extractText(result) {
  const response = result.response;
  if (!response?.candidates?.length) {
    throw new Error("Empty or blocked response from Vertex AI");
  }
  const parts = response.candidates[0].content?.parts;
  if (!parts?.length || !parts[0].text) {
    throw new Error("Empty response from Vertex AI");
  }
  return parts[0].text.trim();
}

/** Normalize Vertex AI 403 (API not enabled or billing disabled) into a clear message for the client. */
function normalizeVertexError(err, fallbackMessage) {
  if (err instanceof AppError) throw err;
  const msg = err.message || "";
  const is403 = msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Forbidden");
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;

  if (is403 && (msg.includes("BILLING_DISABLED") || msg.includes("billing to be enabled"))) {
    const billingUrl = project
      ? `https://console.cloud.google.com/billing/enable?project=${project}`
      : ERROR_MESSAGES.VERTEX_AI_BILLING_ENABLE_URL;
    throw new AppError(`${ERROR_MESSAGES.VERTEX_AI_BILLING_DISABLED} Enable billing here: ${billingUrl}`, 403);
  }

  const isApiDisabled = msg.includes("Vertex AI API") && (msg.includes("not been used") || msg.includes("disabled"));
  if (is403 && isApiDisabled) {
    const enableUrl = project
      ? `https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview?project=${project}`
      : ERROR_MESSAGES.VERTEX_AI_API_ENABLE_URL;
    throw new AppError(`${ERROR_MESSAGES.VERTEX_AI_API_DISABLED} Enable it here: ${enableUrl}`, 403);
  }

  throw new AppError(err.message || fallbackMessage, err.status || 502, err.details);
}

/**
 * Step 1: SEO Analyst – generate outline from keyword (optional: Google Search grounding for SEO)
 */
async function generateOutline(keyword) {
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    throw new AppError("Keyword or topic is required", 400);
  }
  try {
    const vertexAI = getVertexAI();
    const modelName = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || AI_CONFIG.DEFAULT_MODEL;
    const useGoogleSearch = config.aiUseGoogleSearchRetrieval !== false;
    const userMessage = AI_PROMPTS.SEO_ANALYST_USER(keyword.trim());

    if (useGoogleSearch) {
      const generativeModel = vertexAI.preview.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: AI_CONFIG.MAX_OUTLINE_TOKENS },
        tools: [{ google_search: {} }],
      });
      const result = await generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: AI_PROMPTS.SEO_ANALYST_SYSTEM,
      });
      return extractText(result);
    }

    const generativeModel = vertexAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_OUTLINE_TOKENS },
    });
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: AI_PROMPTS.SEO_ANALYST_SYSTEM,
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_OUTLINE_FAILED);
  }
}

/**
 * Step 2: Drafter – write full content from an outline
 */
async function generateDraft(outline) {
  if (!outline || typeof outline !== "string" || !outline.trim()) {
    throw new AppError("Outline is required", 400);
  }
  try {
    const model = getBaseModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: AI_PROMPTS.DRAFTER_USER(outline.trim()) }],
        },
      ],
      systemInstruction: AI_PROMPTS.DRAFTER_SYSTEM,
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS },
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_DRAFT_FAILED);
  }
}

/**
 * Step 3: Comedian – add personality and humor (systemInstruction for humor style)
 */
async function addHumor(content, tone = "medium") {
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new AppError("Content is required", 400);
  }
  const validTones = ["low", "medium", "high"];
  const toneValue = validTones.includes(String(tone).toLowerCase()) ? String(tone).toLowerCase() : "medium";
  try {
    const model = getBaseModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: AI_PROMPTS.COMEDIAN_USER(content.trim(), toneValue) }],
        },
      ],
      systemInstruction: AI_PROMPTS.COMEDIAN_SYSTEM,
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_COMEDIAN_TOKENS },
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_COMEDIAN_FAILED);
  }
}

/**
 * Full AI Sandwich: outline → draft → comedian (optional tone)
 */
async function generatePost(keyword, options = {}) {
  const { tone = "medium", skipComedian = false } = options;
  const outline = await generateOutline(keyword);
  const draft = await generateDraft(outline);
  const finalContent = skipComedian ? draft : await addHumor(draft, tone);
  return {
    outline,
    draft,
    content: finalContent,
  };
}

module.exports = {
  generateOutline,
  generateDraft,
  addHumor,
  generatePost,
};
