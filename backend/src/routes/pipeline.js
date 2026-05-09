const express = require('express');
const { runPipeline } = require('../services/pipeline');
const { asyncHandler } = require('./utils');

const router = express.Router();

router.post('/preview', asyncHandler(async (req, res) => {
  const result = await runPipeline({
    reelUrl: req.body.reelUrl,
    linkUrl: req.body.linkUrl,
    notes: req.body.notes,
    save: false,
    userId: req.user.id,
  });

  res.json({ preview: result.preview });
}));

module.exports = router;
