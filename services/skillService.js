const Skill = require('../Model/Skill');
 
exports.getAllSkills = () => Skill.find();
exports.createSkill = (data) => Skill.create(data); 