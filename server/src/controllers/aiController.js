/**
 * AI Controller – outline, draft, and full generate
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

const postGenerate = asyncHandler(async (req, res) => {
  const { keyword } = req.body;
  const result = await aiService.generatePost(keyword);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

module.exports = {
  postOutline,
  postDraft,
  postGenerate,
};
