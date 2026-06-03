const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parse } = require('csv-parse/sync');

exports.list = async (req, res) => {
  const { month, year } = req.query;
  const filter = {};
  if (month && year) {
    filter.month = parseInt(month, 10);
    filter.year = parseInt(year, 10);
  }
  const employees = await prisma.employee.findMany({
    where: filter,
    orderBy: { name: 'asc' },
  });
  res.json(employees);
};

exports.create = async (req, res) => {
  const { name, position, salary, status, month, year } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama karyawan wajib diisi' });
  if (!month || !year) return res.status(400).json({ error: 'Periode bulan dan tahun wajib diisi' });

  const emp = await prisma.employee.create({
    data: {
      name,
      position: position || '',
      salary: parseFloat(salary) || 0,
      status: status === 'BELUM_LUNAS' ? 'BELUM_LUNAS' : 'LUNAS',
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    },
  });
  res.status(201).json(emp);
};

exports.update = async (req, res) => {
  const { name, position, salary, status, month, year } = req.body;
  const emp = await prisma.employee.update({
    where: { id: req.params.id },
    data: {
      name,
      position: position || '',
      salary: parseFloat(salary),
      status: status === 'BELUM_LUNAS' ? 'BELUM_LUNAS' : 'LUNAS',
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
    },
  });
  res.json(emp);
};

exports.remove = async (req, res) => {
  await prisma.employee.delete({ where: { id: req.params.id } });
  res.json({ message: 'Data karyawan berhasil dihapus' });
};

exports.importCSV = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Bulan dan tahun periode wajib diisi' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'File CSV tidak ditemukan' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const employeesData = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const nameKey = Object.keys(record).find(k => ['nama', 'name', 'nama karyawan'].includes(k.toLowerCase()));
      const positionKey = Object.keys(record).find(k => ['jabatan', 'position', 'posisi'].includes(k.toLowerCase()));
      const salaryKey = Object.keys(record).find(k => ['gaji', 'salary', 'gaji pokok'].includes(k.toLowerCase()));
      const statusKey = Object.keys(record).find(k => ['status', 'pembayaran', 'status pembayaran'].includes(k.toLowerCase()));

      const name = nameKey ? record[nameKey] : '';
      if (!name) {
        return res.status(400).json({ error: `Baris ${i + 1}: Nama karyawan wajib diisi` });
      }

      const position = positionKey ? record[positionKey] : '';
      const rawSalary = salaryKey ? record[salaryKey] : '0';
      const salary = parseFloat(rawSalary.replace(/[^0-9.]/g, '')) || 0;
      
      const rawStatus = statusKey ? record[statusKey].toLowerCase() : 'lunas';
      const status = (rawStatus.includes('belum') || rawStatus.includes('unpaid') || rawStatus === 'belum_lunas')
        ? 'BELUM_LUNAS'
        : 'LUNAS';

      employeesData.push({
        name,
        position,
        salary,
        status,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
      });
    }

    // Insert employees inside transaction
    const created = await prisma.$transaction(
      employeesData.map(emp => prisma.employee.create({ data: emp }))
    );

    res.json({ message: 'Data karyawan berhasil diimpor', count: created.length });
  } catch (error) {
    console.error('Import Employee CSV Error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat memproses CSV' });
  }
};
