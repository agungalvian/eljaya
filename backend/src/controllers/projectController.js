const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'asc' },
    include: { transactions: true },
  });
  res.json(projects);
};

exports.getOne = async (req, res) => {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json(project);
};

exports.create = async (req, res) => {
  const { name, contractValue, budgetAlat, budgetGaji, budgetTransport, budgetMaterial, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama proyek wajib diisi' });

  const project = await prisma.project.create({
    data: {
      name,
      contractValue: parseFloat(contractValue) || 0,
      budgetAlat: parseFloat(budgetAlat) || 0,
      budgetGaji: parseFloat(budgetGaji) || 0,
      budgetTransport: parseFloat(budgetTransport) || 0,
      budgetMaterial: parseFloat(budgetMaterial) || 0,
      status: status || 'berjalan',
    },
  });
  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const { name, contractValue, budgetAlat, budgetGaji, budgetTransport, budgetMaterial, status } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      name,
      contractValue: parseFloat(contractValue),
      budgetAlat: parseFloat(budgetAlat),
      budgetGaji: parseFloat(budgetGaji),
      budgetTransport: parseFloat(budgetTransport),
      budgetMaterial: parseFloat(budgetMaterial),
      status,
    },
  });
  res.json(project);
};

exports.remove = async (req, res) => {
  // Reset related transactions
  await prisma.transaction.updateMany({
    where: { projectId: req.params.id },
    data: { category: 'unclassified', projectId: null },
  });
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Proyek berhasil dihapus' });
};
