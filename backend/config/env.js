exports.checkEnv = () => {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) {
    const msg = 'JWT_SECRET must be at least 32 characters';
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(`⚠️  ${msg}`);
  }
};
