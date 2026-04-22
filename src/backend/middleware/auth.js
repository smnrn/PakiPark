const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

/**
 * Protect routes — verify JWT and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.deletedAt) {
      return res.status(401).json({ success: false, message: 'This account has been deleted' });
    }

    // Attach instance to request; expose both .id and ._id for compatibility
    req.user = user;
    req.user._id = user.id;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
