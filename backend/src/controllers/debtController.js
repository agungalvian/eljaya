const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const debts = await prisma.debt.findMany({
    orderBy: { createdAt: 'asc' },
    include: { transactions: true },
  });
  res.json(debts);
};

exports.create = async (req, res) => {
  const { vendor, description, initialAmount, type } = req.body;
  if (!vendor || !type) return res.status(400).json({ error: 'Vendor dan jenis wajib diisi' });

  const validType = type.toUpperCase();
  if (!['HUTANG', 'PIUTANG'].includes(validType)) {
    return res.status(400).json({ error: 'Jenis harus HUTANG atau PIUTANG' });
  }

  const debt = await prisma.debt.create({
    data: {
      vendor,
      description: description || '',
      initialAmount: parseFloat(initialAmount) || 0,
      manualPaid: 0,
      type: validType,
    },
  });
  res.status(201).json(debt);
};

exports.update = async (req, res) => {
  const { vendor, description, initialAmount, manualPaid } = req.body;
  const debt = await prisma.debt.update({
    where: { id: req.params.id },
    data: {
      vendor,
      description,
      initialAmount: parseFloat(initialAmount),
      manualPaid: parseFloat(manualPaid) || 0,
    },
  });
  res.json(debt);
};

exports.remove = async (req, res) => {
  await prisma.transaction.updateMany({
    where: { debtId: req.params.id },
    data: { category: 'unclassified', debtId: null },
  });
  await prisma.debt.delete({ where: { id: req.params.id } });
  res.json({ message: 'Hutang/piutang berhasil dihapus' });
};
