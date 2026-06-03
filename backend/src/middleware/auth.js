const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'ejp_super_secret_key_123';

/**
 * Middleware to authenticate user using JWT token in Authorization header
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        roleName: true,
        permissions: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Akses ditolak: User tidak aktif' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(401).json({ error: 'Akses ditolak: Token tidak valid atau kedaluwarsa' });
  }
};

/**
 * Middleware to authorize access to specific menus based on user permissions
 * @param {string} menuName - The menu key (e.g. 'dashboard', 'projects', etc.)
 */
const authorize = (menuName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak: Harap login terlebih dahulu' });
    }

    const permissions = req.user.permissions;
    const permission = permissions?.[menuName];

    if (!permission || permission === 'none') {
      return res.status(403).json({ error: `Akses ditolak: Anda tidak memiliki izin untuk menu ${menuName}` });
    }

    // GET requests require 'read' or 'write'
    // POST, PUT, DELETE requests require 'write'
    const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
    if (isWrite && permission !== 'write') {
      return res.status(403).json({ error: `Akses ditolak: Hak akses baca-saja (read-only) untuk menu ${menuName}` });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
