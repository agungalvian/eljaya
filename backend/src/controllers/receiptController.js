const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const receipts = await prisma.receipt.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(receipts);
};

exports.create = async (req, res) => {
  const { receiptNumber, date, partyName, amount, description } = req.body;
  if (!receiptNumber || !partyName) {
    return res.status(400).json({ error: 'Nomor kuitansi dan nama pihak wajib diisi' });
  }

  const existing = await prisma.receipt.findFirst({
    where: { receiptNumber },
  });
  if (existing) {
    return res.status(400).json({ error: 'Nomor kuitansi ini sudah digunakan' });
  }

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      date: date || new Date().toISOString().split('T')[0],
      partyName,
      amount: parseFloat(amount) || 0,
      description: description || '',
    },
  });
  res.status(201).json(receipt);
};

exports.remove = async (req, res) => {
  await prisma.receipt.delete({ where: { id: req.params.id } });
  res.json({ message: 'Kuitansi dihapus' });
};
