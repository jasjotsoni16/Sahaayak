// Endpoints that are intentionally reachable without a token.
exports.PUBLIC = [
  'POST /api/users/signup',
  'POST /api/users/login',
  'POST /api/admin/login',
  'GET /api/skills',                              // skill picker on signup
  'GET /api/jobs',                                // public job board
  'GET /api/jobs/jobs-in-radius',                 // map
  'GET /api/jobs/employer/:employerId/public',
  'GET /api/geo/search',                          // place search during signup
  'GET /api/geo/reverse',
];

// Now empty: every non-public endpoint requires a token. Add a line here only as a temporary,
// tracked exception while fixing a newly added route.
// The test fails if an entry here is no longer open, so nothing gets forgotten.
exports.OPEN_FOR_NOW = [
];
