const userTestService = require('../services/userTestService');

exports.assignTest = async (req, res) => {
  const test = await userTestService.assignTest(req.body);
  res.status(201).json(test);
};
exports.completeTest = async (req, res) => {
  const test = await userTestService.completeTest(req.params.testId, {
    score: req.body.score,
    video_call_id: req.body.video_call_id,
    verified_by: req.user._id
  });
  res.json(test);
}; 