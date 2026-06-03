const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Shared aggregation logic with optional period (month & year) filtering
async function computeFinancials(month, year) {
  let prefix = '';
  if (year && month) {
    prefix = `${year}-${String(month).padStart(2, '0')}`;
  }

  const [transactions, debts, assets] = await Promise.all([
    prisma.transaction.findMany({
      where: prefix ? { date: { startsWith: prefix } } : {},
      include: { project: true, debt: true },
    }),
    prisma.debt.findMany({ include: { transactions: true } }),
    prisma.asset.findMany(),
  ]);

  let pemasukanProyek = 0, pemasukanRental = 0;
  let bebanTransport = 0, bebanGaji = 0, bebanMaterial = 0, bebanBank = 0;
  let hutangDibayar = 0, piutangDiterima = 0;
  let endingBalance = 0;

  transactions.forEach(tx => {
    if (tx.kredit > 0) {
      if (tx.category === 'project_revenue') pemasukanProyek += tx.kredit;
      else if (tx.category === 'rental_revenue') pemasukanRental += tx.kredit;
      else if (tx.category === 'receivable_collection') piutangDiterima += tx.kredit;
    }
    if (tx.debit > 0) {
      if (tx.category === 'transportation_expense') bebanTransport += tx.debit;
      else if (tx.category === 'wage_expense') bebanGaji += tx.debit;
      else if (tx.category === 'material_expense') bebanMaterial += tx.debit;
      else if (tx.category === 'bank_expense') bebanBank += tx.debit;
      else if (tx.category === 'debt_payment') hutangDibayar += tx.debit;
    }
  });

  if (transactions.length > 0) {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    endingBalance = sorted[sorted.length - 1].balance;
  } else if (prefix) {
    // Get last transaction balance before the selected month
    const lastTxBefore = await prisma.transaction.findFirst({
      where: { date: { lt: prefix } },
      orderBy: { date: 'desc' },
    });
    if (lastTxBefore) {
      endingBalance = lastTxBefore.balance;
    }
  }

  // Compute debt summaries up to the end of the selected month
  const debtsSummary = debts.map(d => {
    const txPaid = d.transactions.reduce((sum, tx) => {
      // Only count payments made on or before the selected period
      if (prefix && tx.date.slice(0, 7).localeCompare(prefix) > 0) return sum;
      if (d.type === 'HUTANG' && tx.debit > 0) return sum + tx.debit;
      if (d.type === 'PIUTANG' && tx.kredit > 0) return sum + tx.kredit;
      return sum;
    }, 0);
    const totalPaid = txPaid + d.manualPaid;
    return { ...d, totalPaid, remaining: Math.max(0, d.initialAmount - totalPaid) };
  });

  const outstandingHutang = debtsSummary
    .filter(d => d.type === 'HUTANG')
    .reduce((sum, d) => sum + d.remaining, 0);

  const outstandingPiutang = debtsSummary
    .filter(d => d.type === 'PIUTANG')
    .reduce((sum, d) => sum + d.remaining, 0);

  const depresiasiBulan = assets.reduce((sum, a) => sum + a.monthlyDepreciation, 0);
  const totalAsetCost = assets.reduce((sum, a) => sum + a.acquisitionCost, 0);

  return {
    pemasukanProyek, pemasukanRental,
    bebanTransport, bebanGaji, bebanMaterial, bebanBank,
    hutangDibayar, piutangDiterima,
    endingBalance, outstandingHutang, outstandingPiutang,
    depresiasiBulan, totalAsetCost,
    totalPemasukan: pemasukanProyek + pemasukanRental,
    totalBebanOps: bebanTransport + bebanGaji + bebanMaterial,
    txCount: transactions.length,
  };
}

exports.summary = async (req, res) => {
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await computeFinancials(month, year);
  
  const employeeFilter = {};
  if (month && year) {
    employeeFilter.month = month;
    employeeFilter.year = year;
  }

  const [projects, employees, assets] = await Promise.all([
    prisma.project.count({
      where: { status: 'berjalan' }
    }),
    prisma.employee.count({
      where: employeeFilter,
    }),
    prisma.asset.findMany(),
  ]);

  res.json({
    ...data,
    projectCount: projects,
    employeeCount: employees,
    assetCount: assets.length,
  });
};

exports.profitLoss = async (req, res) => {
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await computeFinancials(month, year);

  const labaKotor = data.totalPemasukan - data.totalBebanOps;
  const totalBebanUmum = data.bebanBank + data.depresiasiBulan;
  const labaBersih = labaKotor - totalBebanUmum;

  res.json({
    pendapatan: {
      proyek: data.pemasukanProyek,
      rental: data.pemasukanRental,
      total: data.totalPemasukan,
    },
    bebanLangsung: {
      transport: data.bebanTransport,
      gaji: data.bebanGaji,
      material: data.bebanMaterial,
      total: data.totalBebanOps,
    },
    labaKotor,
    bebanUmum: {
      bank: data.bebanBank,
      depresiasi: data.depresiasiBulan,
      total: totalBebanUmum,
    },
    labaBersih,
  });
};

exports.balanceSheet = async (req, res) => {
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await computeFinancials(month, year);

  let outstandingGaji = 0;
  if (month && year) {
    const unpaidEmployees = await prisma.employee.findMany({
      where: {
        month,
        year,
        status: 'BELUM_LUNAS'
      }
    });
    outstandingGaji = unpaidEmployees.reduce((sum, e) => sum + e.salary, 0);
  }

  const MODAL_AWAL = 100000000;
  const labaKotor = data.totalPemasukan - data.totalBebanOps;
  const labaBersih = labaKotor - (data.bebanBank + data.depresiasiBulan);
  const nilaiAsetTetap = data.totalAsetCost - data.depresiasiBulan;
  const totalAset = (data.endingBalance + data.outstandingPiutang) + nilaiAsetTetap;

  res.json({
    aset: {
      kas: data.endingBalance,
      piutang: data.outstandingPiutang,
      totalLancar: data.endingBalance + data.outstandingPiutang,
      asetTetap: data.totalAsetCost,
      akumPenyusutan: data.depresiasiBulan,
      nilaiAsetTetap,
      totalAset,
    },
    pasiva: {
      hutangUsaha: data.outstandingHutang,
      hutangGaji: outstandingGaji,
      totalKewajiban: data.outstandingHutang + outstandingGaji,
      modalAwal: MODAL_AWAL,
      labaDitahan: labaBersih,
      totalEkuitas: MODAL_AWAL + labaBersih,
      totalPasiva: data.outstandingHutang + outstandingGaji + MODAL_AWAL + labaBersih,
    },
  });
};

exports.cashflow = async (req, res) => {
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await computeFinancials(month, year);

  const arusOperasional = data.totalPemasukan - data.totalBebanOps - data.bebanBank;
  const arusPendanaan = data.piutangDiterima - data.hutangDibayar;

  res.json({
    operasional: {
      terimaKlien: data.totalPemasukan,
      bayarGaji: data.bebanGaji,
      bayarTransport: data.bebanTransport,
      bayarMaterial: data.bebanMaterial,
      bayarBank: data.bebanBank,
      total: arusOperasional,
    },
    investasi: { total: 0 },
    pendanaan: {
      bayarHutang: data.hutangDibayar,
      terimaPiutang: data.piutangDiterima,
      total: arusPendanaan,
    },
    kasAkhir: data.endingBalance,
    netChange: arusOperasional + arusPendanaan,
  });
};

