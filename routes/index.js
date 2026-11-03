// Single source of truth for which router lives at which URL prefix.
// investorRoutes.js exists but is not mounted yet (the investor screens call /api/investors).
const MOUNTS = [
  ['/api/users', require('./userRoutes')],
  ['/api/skills', require('./skillRoutes')],
  ['/api/user-skills', require('./userSkillRoutes')],
  ['/api/user-documents', require('./userDocumentRoutes')],
  ['/api/user-tests', require('./userTestRoutes')],
  ['/api/fd', require('./fdRoutes')],
  ['/api/employer', require('./employerRoutes')],
  ['/api/jobs', require('./jobRoutes')],
  ['/api/user-jobs', require('./userJobRoutes')],
  ['/api/voice', require('./voiceRoutes')],
  ['/api/applications', require('./userApplicationRoutes')],
  ['/api/user-experiences', require('./userExperienceRoutes')],
  ['/api/tools', require('./toolRoutes')],
  ['/api/tool-loans', require('./toolLoanRoutes')],
  ['/api/ratings', require('./ratingRoutes')],
  ['/api/reports', require('./reportRoutes')],
  ['/api/admin', require('./adminAuthRoutes')],
  ['/api/offers', require('./offerRoutes')],
  ['/api/agreements', require('./agreementRoutes')],
  ['/api/credit-scores', require('./creditScoreRoutes')],
  ['/api/loan-suggestions', require('./loanSuggestionRoutes')],
  ['/api/loans', require('./loanRoutes')],
  ['/api/assessments', require('./assessmentRoutes')],
  ['/api/notifications', require('./notificationRoutes')],
  ['/api/ai-assessments', require('./aiAssessmentRoutes')],
  ['/api/retell', require('./retellRoutes')],
  ['/api/job-recommendations', require('./jobRecommendationRoutes')],
  ['/api/salary', require('./salaryRoutes')],
  ['/api/geo', require('./geoRoutes')],
];

function mountRoutes(app) {
  for (const [prefix, router] of MOUNTS) app.use(prefix, router);
}

function listRoutes() {
  const out = [];
  for (const [prefix, router] of MOUNTS) {
    for (const layer of router.stack) {
      if (!layer.route) continue;
      const sub = layer.route.path === '/' ? '' : layer.route.path;
      for (const method of Object.keys(layer.route.methods)) {
        out.push({ method: method.toUpperCase(), path: prefix + sub });
      }
    }
  }
  return out;
}

module.exports = { MOUNTS, mountRoutes, listRoutes };
