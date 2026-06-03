# CV. EL JAYA PONDASI — Sistem Keuangan

> Sistem Laporan Keuangan Full-Stack untuk CV. EL JAYA PONDASI  
> Jasa Konstruksi & Rental Alat Berat, Badung, Bali

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |

## 🚀 Quick Start (Docker)

```bash
# 1. Clone dan masuk direktori
git clone <repo> && cd eljaya

# 2. Buat file .env dari template
cp .env.example .env

# 3. Jalankan semua service
docker compose up --build

# Akses:
# Frontend : http://localhost:5173
# Backend  : http://localhost:3001
# API Health: http://localhost:3001/health
```

## 💻 Lokal (Tanpa Docker)

### Prasyarat
- Node.js 20+
- PostgreSQL 16 berjalan lokal

```bash
# Backend
cd backend
cp .env.example .env   # edit DATABASE_URL sesuai PostgreSQL lokal
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# Frontend (terminal baru)
cd frontend
npm install
npm run dev
```

## 📁 Struktur Proyek

```
/eljaya
├── /backend
│   ├── /prisma          # Schema & migrations & seed
│   ├── /src
│   │   ├── /controllers # Business logic per resource
│   │   ├── /routes      # Express route handlers
│   │   ├── /middleware  # Error handler, CORS
│   │   └── /utils       # CSV parser, helpers
│   └── package.json
├── /frontend
│   ├── /src
│   │   ├── /api         # Axios client & endpoint wrappers
│   │   ├── /components  # Reusable UI components
│   │   ├── /pages       # 7 halaman utama
│   │   └── /utils       # Formatters, terbilang
│   └── package.json
├── docker-compose.yml
├── backend.Dockerfile
└── frontend.Dockerfile
```

## 🗂️ Fitur Utama

- **Dashboard** — KPI realtime, bar chart pengeluaran, pemantauan proyek
- **Rekening Koran** — Import CSV BRI drag-drop, klasifikasi mutasi per pos
- **RAB & Proyek** — Manajemen anggaran, tracker profit margin per proyek  
- **Hutang & Piutang** — Monitoring kewajiban & hak tagih perusahaan
- **Gaji & Aset** — Daftar gaji karyawan & kalkulasi depresiasi garis lurus
- **Laporan Keuangan** — P&L, Neraca, Arus Kas, CALK — semua printable
- **Kuitansi** — Generator bukti pembayaran dengan preview & cetak langsung

## 📱 Mobile-Friendly

Dirancang mobile-first untuk pekerja lapangan:
- Bottom navigation bar pada mobile
- Touch-friendly (min 44px tap target)
- Upload foto/file langsung dari kamera
