const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      roleName: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
};

exports.create = async (req, res) => {
  const { username, password, roleName, permissions } = req.body;

  if (!username || !password || !roleName || !permissions) {
    return res.status(400).json({ error: 'Username, password, roleName, dan permissions wajib diisi' });
  }

  // Check if username exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ error: 'Username sudah digunakan' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      roleName,
      permissions,
    },
    select: {
      id: true,
      username: true,
      roleName: true,
      permissions: true,
      createdAt: true,
    },
  });

  res.status(201).json(user);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { username, password, roleName, permissions } = req.body;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  // If username is changed, verify it doesn't conflict
  if (username && username !== existing.username) {
    const conflict = await prisma.user.findUnique({ where: { username } });
    if (conflict) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh user lain' });
    }
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (roleName) updateData.roleName = roleName;
  if (permissions) updateData.permissions = permissions;

  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      roleName: true,
      permissions: true,
      updatedAt: true,
    },
  });

  res.json(user);
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User berhasil dihapus' });
};
