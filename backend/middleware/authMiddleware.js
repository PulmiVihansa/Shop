// Placeholder auth middleware for protected routes.
const authMiddleware = (req, res, next) => {
  // TODO: Validate JWT or session before allowing access.
  next();
};

module.exports = authMiddleware;
