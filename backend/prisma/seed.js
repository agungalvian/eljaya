const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding database CV. EL JAYA PONDASI...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.project.deleteMany();

  // --- Users ---
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      email: 'admin@eljaya.com',
      roleName: 'Administrator',
      permissions: {
        dashboard: 'write',
        bankStatement: 'write',
        projects: 'write',
        debts: 'write',
        payrollAssets: 'write',
        reports: 'write',
        receipts: 'write',
        users: 'write'
      }
    }
  });


  // --- Projects ---
  const proj1 = await prisma.project.create({
    data: {
      id: 'p1',
      name: 'Fondasi Borepile Puskesmas Mengwi',
      contractValue: 180000000,
      budgetAlat: 30000000,
      budgetGaji: 40000000,
      budgetTransport: 15000000,
      budgetMaterial: 45000000,
      status: 'berjalan',
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      id: 'p2',
      name: 'Stros Pile Rumah Tinggal Gg. Jepun',
      contractValue: 45000000,
      budgetAlat: 8000000,
      budgetGaji: 12000000,
      budgetTransport: 5000000,
      budgetMaterial: 10000000,
      status: 'berjalan',
    },
  });

  // --- Debts ---
  const debt1 = await prisma.debt.create({
    data: {
      id: 'd1',
      vendor: 'Pertamina Agen Mengwi',
      description: 'Solar Industri Excavator & Strausspile',
      initialAmount: 8500000,
      manualPaid: 0,
      type: 'HUTANG',
    },
  });

  const debt2 = await prisma.debt.create({
    data: {
      id: 'd2',
      vendor: 'Pak Kadek (Logistik)',
      description: 'Upah Borongan Pondasi Tambahan',
      initialAmount: 12000000,
      manualPaid: 0,
      type: 'HUTANG',
    },
  });

  const debt3 = await prisma.debt.create({
    data: {
      id: 'd3',
      vendor: 'Waskita Beton',
      description: 'Tagihan Supply Readymix Proyek',
      initialAmount: 35000000,
      manualPaid: 0,
      type: 'PIUTANG',
    },
  });

  // --- Transactions (sample BRI bank statement) ---
  await prisma.transaction.createMany({
    data: [
      {
        id: 't1', date: '2026-05-07',
        description: 'BFST057201002304560AANG DRU SEI:CENAIDJA 20260507 TERMIN 1 PUSKESMAS',
        debit: 0, kredit: 25000000, balance: 25056886,
        category: 'project_revenue', projectId: proj1.id,
        sequence: 1,
      },
      {
        id: 't2', date: '2026-05-10',
        description: 'TRANSFER BI-FAST KE PERTAMINA AGEN SOLAR INDUSTRI',
        debit: 4500000, kredit: 0, balance: 20556886,
        category: 'debt_payment', debtId: debt1.id,
        sequence: 2,
      },
      {
        id: 't3', date: '2026-05-15',
        description: 'BFST057201002304560JEJAK TRIKAR TERMIN RENTAL KOBELCO',
        debit: 0, kredit: 12921600, balance: 33478486,
        category: 'rental_revenue',
        sequence: 3,
      },
      {
        id: 't4', date: '2026-05-18',
        description: 'TRANSFER MANDIRI UP KADEK ONGKOS TRANSPORT BALI LOGISTIK',
        debit: 3500000, kredit: 0, balance: 29978486,
        category: 'transportation_expense',
        sequence: 4,
      },
      {
        id: 't5', date: '2026-05-20',
        description: 'TARIK TUNAI GAJI OPERATOR I MADE ARTA',
        debit: 6500000, kredit: 0, balance: 23478486,
        category: 'wage_expense',
        sequence: 5,
      },
      {
        id: 't6', date: '2026-05-25',
        description: 'PEMBAYARAN SUPPLY BETON READYMIX WASKITA',
        debit: 10000000, kredit: 0, balance: 13478486,
        category: 'receivable_collection', debtId: debt3.id,
        sequence: 6,
      },
      {
        id: 't7', date: '2026-05-31',
        description: 'BIAYA ADM BANK BRI DAN PAJAK TRANSAKSI',
        debit: 15500, kredit: 0, balance: 13462986,
        category: 'bank_expense',
        sequence: 7,
      },
    ],
  });

  // Update debt1 paid amount based on transaction
  await prisma.debt.update({ where: { id: 'd1' }, data: { manualPaid: 4500000 } });

  // --- Employees ---
  await prisma.employee.createMany({
    data: [
      { name: 'I Made Arta', position: 'Operator Excavator', salary: 6500000, status: 'LUNAS', month: 5, year: 2026 },
      { name: 'Wayan Sudi', position: 'Helper Strausspile', salary: 4800000, status: 'LUNAS', month: 5, year: 2026 },
      { name: 'Siti Rahma', position: 'Admin & Finance', salary: 4500000, status: 'LUNAS', month: 5, year: 2026 },
    ],
  });

  // --- Assets ---
  await prisma.asset.createMany({
    data: [
      { name: 'Alat Strausspile Mesin 1', acquisitionCost: 120000000, usefulLifeYears: 5, monthlyDepreciation: 2000000 },
      { name: 'Excavator Kobelco SK75', acquisitionCost: 450000000, usefulLifeYears: 8, monthlyDepreciation: 4687500 },
    ],
  });

  console.log('✅ Seeding selesai!');
  console.log(`   Projects: 2 | Transactions: 7 | Debts: 3 | Employees: 3 | Assets: 2`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
