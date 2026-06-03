const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(assets);
};

exports.create = async (req, res) => {
  const { name, acquisitionCost, usefulLifeYears } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama aset wajib diisi' });

  const cost = parseFloat(acquisitionCost) || 0;
  const life = parseInt(usefulLifeYears) || 5;
  const monthlyDepreciation = Math.round(cost / (life * 12));

  const asset = await prisma.asset.create({
    data: { name, acquisitionCost: cost, usefulLifeYears: life, monthlyDepreciation },
  });
  res.status(201).json(asset);
};

exports.update = async (req, res) => {
  const { name, acquisitionCost, usefulLifeYears } = req.body;
  const cost = parseFloat(acquisitionCost) || 0;
  const life = parseInt(usefulLifeYears) || 5;
  const monthlyDepreciation = Math.round(cost / (life * 12));

  const asset = await prisma.asset.update({
    where: { id: req.params.id },
    data: { name, acquisitionCost: cost, usefulLifeYears: life, monthlyDepreciation },
  });
  res.json(asset);
};

exports.remove = async (req, res) => {
  await prisma.asset.delete({ where: { id: req.params.id } });
  res.json({ message: 'Aset berhasil dihapus' });
};
