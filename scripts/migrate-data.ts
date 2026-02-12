import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const prisma = new PrismaClient();
const DB_PATH = '/mnt/Databersama/macOS/kasir-windows/program kasir/penjualan.db';

async function main() {
  console.log(`🚀 Memulai migrasi transaksi dari: ${DB_PATH}`);
  const db = new sqlite3.Database(DB_PATH);
  const dbAll = promisify(db.all).bind(db);

  try {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'") as any[];
    const tableName = tables[0].name;
    const rows = await dbAll(`SELECT * FROM "${tableName}"`) as any[];
    
    console.log(`📦 Memproses ${rows.length} baris penjualan...`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // 1. Cari varianId di DB Neon berdasarkan kode_barang dan warna dari SQLite
      const varian = await prisma.varian.findFirst({
        where: {
          warna: row.warna || "Default",
          barang: { kode: row.kode_barang.toString() }
        }
      });

      if (!varian) {
        console.error(`[${i+1}] ❌ Varian tidak ditemukan untuk Kode: ${row.kode_barang}, Warna: ${row.warna}`);
        continue;
      }

      // 2. Buat atau cari Header Transaksi (berdasarkan kode_pesanan)
      const transaksi = await prisma.transaksi.upsert({
        where: { kodePesanan: row.kode_pesanan.toString() },
        update: {}, // Jika sudah ada, jangan update apa-apa
        create: {
          kodePesanan: row.kode_pesanan.toString(),
          marketplace: row.marketplace || "Offline",
          tanggal: new Date(), // Atur tanggal jika ada kolomnya di SQLite
        },
      });

      // 3. Masukkan Detail Penjualan
      await prisma.penjualan.create({
        data: {
          transaksiId: transaksi.id,
          varianId: varian.id,
          jumlah: parseInt(row.jumlah) || 0,
          hargaJual: parseFloat(row.harga_jual) || 0,
          hargaBeli: parseFloat(row.harga_beli) || 0,
          totalAdmin: parseFloat(row.total_admin) || 0,
          zakat: parseFloat(row.zakat) || 0,
          laba: parseFloat(row.laba) || 0,
        }
      });

      console.log(`[${i+1}/${rows.length}] ✅ Pesanan ${row.kode_pesanan} - ${row.nama_barang} terupload.`);
    }

    console.log("\n✨ Migrasi Penjualan Beres!");
  } catch (error) {
    console.error("❌ Error Migrasi:", error);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

main();