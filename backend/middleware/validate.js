exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.join('.') || 'body';
    return res.status(400).json({ error: `${where}: ${issue.message}` });
  }
  req.body = result.data;
  next();
};

// Validates req.query. Express 5 makes req.query read-only, so the parsed result goes to req.validQuery.
exports.validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    return res.status(400).json({ error: `${issue.path.join('.') || 'query'}: ${issue.message}` });
  }
  req.validQuery = result.data;
  next();
};
