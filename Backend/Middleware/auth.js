
// Simple authentication middleware (placeholder)
const auth = (req, res, next) => {
  // For now, just pass through - implement proper auth later
  next();
};

const admin = (req, res, next) => {
  // For now, just pass through - implement proper admin check later
  next();
};

module.exports = { auth, admin };
