const UserSkill = require('../Model/UserSkill');
 
exports.getUserSkills = (userId) => UserSkill.find({ user_id: userId }).populate('skill_id');
exports.addUserSkill = (userId, data) => UserSkill.create({ ...data, user_id: userId });
exports.removeUserSkill = (skillId) => UserSkill.deleteOne({ _id: skillId });
exports.verifyUserSkill = (userId, skillId) =>
  UserSkill.findOneAndUpdate({ user_id: userId, skill_id: skillId }, { is_verified: true }, { new: true }); 