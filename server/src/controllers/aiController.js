/**
 * AI Controller – handles AI Sandwich workflow (outline, draft, comedian, full generate)
 */

const aiService = require("../services/aiService");
const { asyncHandler } = require("../middleware/errorHandler");
const { HTTP_STATUS } = require("../constants");

const postOutline = asyncHandler(async (req, res) => {
  const { keyword } = req.body;
  const outline = await aiService.generateOutline(keyword);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { outline } });
});

const postDraft = asyncHandler(async (req, res) => {
  const { outline } = req.body;
  const draft = await aiService.generateDraft(outline);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { draft } });
});

const postComedian = asyncHandler(async (req, res) => {
  const { content, tone } = req.body;
  const result = await aiService.addHumor(content, tone);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { content: result } });
});

const postGenerate = asyncHandler(async (req, res) => {
  const { keyword, tone, skipComedian } = req.body;
  const result = await aiService.generatePost(keyword, { tone, skipComedian });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

module.exports = {
  postOutline,
  postDraft,
  postComedian,
  postGenerate,
};
