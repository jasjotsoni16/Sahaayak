const skillService = require('../services/skillService');

exports.getAllSkills = async (req, res) => {
  const skills = await skillService.getAllSkills();
  res.json(skills);
};
exports.createSkill = async (req, res) => {
  const skill = await skillService.createSkill(req.body);
  res.status(201).json(skill);
}; 