const userSkillService = require('../services/userSkillService');
const UserSkill = require('../Model/UserSkill');

// Helper: Calculate skill score
function calculateSkillScore(skill) {
  let score = 0;
  if (skill.pcc_status === 'verified') score += 30;
  if (skill.assessment_status === 'passed') score += 30;
  if (skill.certificates && skill.certificates.length > 0) score += 20;
  if (skill.experience_years) score += Math.min(skill.experience_years * 5, 10);
  if (skill.feedback_score) score += Math.min(skill.feedback_score, 10);
  return Math.min(score, 100);
}

// Helper: Calculate progress
function calculateProgress(skill) {
  let progress = 0;
  if (skill.pcc_status === 'verified') progress++;
  if (skill.assessment_status === 'passed' || skill.assessment_status === 'not_required') progress++;
  if (skill.certificates && skill.certificates.length > 0) progress++;
  return progress;
}

exports.getUserSkills = async (req, res) => {
  const skills = await userSkillService.getUserSkills(req.params.userId);
  res.json(skills);
};

exports.addUserSkill = async (req, res) => {
  const skill = await userSkillService.addUserSkill(req.params.userId, req.body);
  res.status(201).json(skill);
};

exports.removeUserSkill = async (req, res) => {
  await userSkillService.removeUserSkill(req.params.skillId);
  res.json({ success: true });
};

exports.verifyUserSkill = async (req, res) => {
  const skill = await userSkillService.verifyUserSkill(req.params.userId, req.params.skillId);
  res.json(skill);
};

// UPLOAD certificate (simulate file upload)
exports.uploadCertificate = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    skill.certificates.push({
      url: req.body.url,
      type: req.body.type || 'certificate',
      source: 'upload'
    });
    skill.skill_score = calculateSkillScore(skill);
    skill.progress = calculateProgress(skill);
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Simulate DigiLocker PCC fetch
exports.fetchPCCFromDigiLocker = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    skill.pcc_status = 'verified';
    skill.certificates.push({
      url: 'https://digilocker.gov.in/fake-pcc.pdf',
      type: 'pcc',
      source: 'digilocker'
    });
    skill.skill_score = calculateSkillScore(skill);
    skill.progress = calculateProgress(skill);
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Simulate DigiLocker certificate fetch
exports.fetchCertificateFromDigiLocker = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    skill.certificates.push({
      url: 'https://digilocker.gov.in/fake-certificate.pdf',
      type: 'certificate',
      source: 'digilocker'
    });
    skill.skill_score = calculateSkillScore(skill);
    skill.progress = calculateProgress(skill);
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trigger assessment (simulate)
exports.triggerAssessment = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    skill.assessment_status = 'pending';
    await skill.save();
    res.json({ message: 'Assessment started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Set assessment result
exports.setAssessmentResult = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { result } = req.body; // 'passed' or 'failed'
    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    skill.assessment_status = result;
    skill.skill_score = calculateSkillScore(skill);
    skill.progress = calculateProgress(skill);
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 