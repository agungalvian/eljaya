const { PrismaClient } = require('@prisma/client');
const { parseCSV } = require('../utils/csvParser');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  const { type, month, year } = req.query; // 'debit' | 'kredit' | 'unclassified'
  let where = {};
  if (type === 'debit') where.debit = { gt: 0 };
  if (type === 'kredit') where.kredit = { gt: 0 };
  if (type === 'unclassified') where.category = 'unclassified';

  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    where.date = { startsWith: prefix };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { sequence: 'asc' },
    include: { project: true, debt: true },
  });
  res.json(transactions);
};

exports.create = async (req, res) => {
  const { date, description, debit, kredit, balance, category } = req.body;
  const tx = await prisma.transaction.create({
    data: {
      date,
      description,
      debit: parseFloat(debit) || 0,
      kredit: parseFloat(kredit) || 0,
      balance: parseFloat(balance) || 0,
      category: category || 'unclassified',
    },
  });
  res.status(201).json(tx);
};

exports.update = async (req, res) => {
  const { category, projectId, debtId } = req.body;

  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const txParts = tx.date.split('-');
    const txYear = parseInt(txParts[0], 10);
    const txMonth = parseInt(txParts[1], 10);

    const lock = await prisma.periodLock.findUnique({
      where: { year_month: { year: txYear, month: txMonth } }
    });

    if (lock && lock.isLocked) {
      return res.status(403).json({ error: 'Periode transaksi ini telah dikunci. Silakan klik Edit terlebih dahulu.' });
    }

    // Build update payload
    const data = { category, projectId: null, debtId: null };

    if (category === 'project_revenue' && projectId) {
      data.projectId = projectId;
    } else if (category === 'debt_payment' || category === 'receivable_collection') {
      if (debtId) data.debtId = debtId;
    }

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    console.error('Error update transaction:', err.message);
    res.status(500).json({ error: 'Gagal merubah alokasi transaksi' });
  }
};

exports.remove = async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const txParts = tx.date.split('-');
    const txYear = parseInt(txParts[0], 10);
    const txMonth = parseInt(txParts[1], 10);

    const lock = await prisma.periodLock.findUnique({
      where: { year_month: { year: txYear, month: txMonth } }
    });
    if (lock && lock.isLocked) {
      return res.status(403).json({ error: 'Periode transaksi ini telah dikunci. Silakan klik Edit terlebih dahulu.' });
    }

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transaksi dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;

    if (month && year) {
      const lock = await prisma.periodLock.findUnique({
        where: { year_month: { year, month } }
      });
      if (lock && lock.isLocked) {
        return res.status(403).json({ error: 'Periode ini telah dikunci. Silakan klik Edit terlebih dahulu.' });
      }

      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      await prisma.transaction.deleteMany({
        where: { date: { startsWith: prefix } }
      });
      return res.json({ message: `Semua transaksi periode ${month}/${year} berhasil dibersihkan` });
    }

    const lockedLocks = await prisma.periodLock.findMany({ where: { isLocked: true } });
    if (lockedLocks.length > 0) {
      return res.status(403).json({ error: 'Tidak dapat membersihkan data karena terdapat periode yang dikunci' });
    }

    await prisma.transaction.deleteMany();
    res.json({ message: 'Semua transaksi dihapus' });
  } catch (err) {
    console.error('Error clearAll:', err.message);
    res.status(500).json({ error: 'Gagal membersihkan transaksi' });
  }
};

exports.importCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File CSV wajib diunggah' });

  const month = req.query.month ? parseInt(req.query.month, 10) : null;
  const year = req.query.year ? parseInt(req.query.year, 10) : null;

  if (!month || !year) {
    return res.status(400).json({ error: 'Periode bulan dan tahun wajib dipilih sebelum mengunggah' });
  }

  try {
    // Check lock status
    const lock = await prisma.periodLock.findUnique({
      where: {
        year_month: { year, month }
      }
    });
    if (lock && lock.isLocked) {
      return res.status(403).json({ error: 'Periode ini telah dikunci. Silakan klik Edit terlebih dahulu.' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const parsed = parseCSV(csvText);

    if (parsed.error) return res.status(400).json({ error: parsed.error });

    // Helper to parse day, month, and year from date string
    const parseDateStr = (dateStr) => {
      if (!dateStr) return null;
      const clean = dateStr.trim().split(' ')[0];
      let day, monthVal, yearVal;

      if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length >= 3) {
          day = parseInt(parts[0], 10);
          monthVal = parseInt(parts[1], 10);
          yearVal = parseInt(parts[2], 10);
        } else if (parts.length === 2) {
          day = parseInt(parts[0], 10);
          monthVal = parseInt(parts[1], 10);
          yearVal = year;
        }
      } else if (clean.includes('-')) {
        const parts = clean.split('-');
        if (parts.length >= 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            yearVal = parseInt(parts[0], 10);
            monthVal = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
          } else {
            // DD-MM-YYYY
            day = parseInt(parts[0], 10);
            monthVal = parseInt(parts[1], 10);
            yearVal = parseInt(parts[2], 10);
          }
        } else if (parts.length === 2) {
          day = parseInt(parts[0], 10);
          monthVal = parseInt(parts[1], 10);
          yearVal = year;
        }
      } else {
        day = parseInt(clean, 10);
        monthVal = month;
        yearVal = year;
      }

      if (isNaN(day) || isNaN(monthVal) || isNaN(yearVal)) return null;
      if (yearVal < 100) yearVal += 2000;

      return { day, month: monthVal, year: yearVal };
    };

    // Validate CSV dates against selected period
    for (const tx of parsed.transactions) {
      const dateObj = parseDateStr(tx.date);
      if (!dateObj || dateObj.month !== month || dateObj.year !== year) {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const selectedMonthName = monthNames[month - 1];
        return res.status(400).json({
          error: `Tanggal transaksi di CSV (${tx.date}) tidak sesuai dengan periode terpilih (${selectedMonthName} ${year})!`
        });
      }
    }

    // Format dates to YYYY-MM-DD
    const updatedTransactions = parsed.transactions.map((tx, index) => {
      const dateObj = parseDateStr(tx.date);
      const dateStr = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
      return {
        ...tx,
        date: dateStr,
        sequence: index,
      };
    });

    // Clear existing transactions for this period only
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    await prisma.transaction.deleteMany({
      where: {
        date: {
          startsWith: prefix
        }
      }
    });

    const created = await prisma.transaction.createMany({
      data: updatedTransactions,
      skipDuplicates: true,
    });

    res.json({
      message: `Berhasil mengimpor ${created.count} transaksi untuk periode ${month}/${year}`,
      count: created.count,
    });
  } catch (err) {
    console.error('Error importCSV:', err.message);
    res.status(500).json({ error: 'Gagal mengimpor rekening koran' });
  }
};

