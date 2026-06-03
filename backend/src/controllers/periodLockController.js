const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStatus = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      return res.status(400).json({ error: 'Parameter month dan year wajib disertakan' });
    }

    const lock = await prisma.periodLock.findUnique({
      where: {
        year_month: { year, month }
      }
    });

    res.json({ isLocked: lock ? lock.isLocked : false });
  } catch (err) {
    console.error('Error getStatus:', err.message);
    res.status(500).json({ error: 'Gagal mengambil status kunci periode' });
  }
};

exports.setLock = async (req, res) => {
  try {
    const { month, year, lock } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'Bulan dan tahun wajib disertakan' });
    }

    if (lock) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const unclassified = await prisma.transaction.findFirst({
        where: {
          date: { startsWith: prefix },
          category: 'unclassified'
        }
      });
      if (unclassified) {
        return res.status(400).json({ error: 'Tidak dapat mengunci periode: Masih terdapat transaksi yang belum dialokasikan.' });
      }
    }

    const periodLock = await prisma.periodLock.upsert({
      where: {
        year_month: { year, month }
      },
      update: {
        isLocked: !!lock
      },
      create: {
        year,
        month,
        isLocked: !!lock
      }
    });

    res.json(periodLock);
  } catch (err) {
    console.error('Error setLock:', err.message);
    res.status(500).json({ error: 'Gagal merubah status kunci periode' });
  }
};
