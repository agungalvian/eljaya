const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ejp_super_secret_key_123';

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  // Sign JWT
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      roleName: user.roleName,
      permissions: user.permissions,
    },
  });
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Fetch complete user data including password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const updateData = {};

    if (username && username !== user.username) {
      // Check uniqueness
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan oleh user lain' });
      }
      updateData.username = username;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Password saat ini wajib diisi untuk mengubah password' });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Password saat ini salah' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        roleName: true,
        permissions: true,
      },
    });

    res.json({
      message: 'Profil berhasil diperbarui',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat memperbarui profil' });
  }
};
