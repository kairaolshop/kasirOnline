import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("⚠️ Sedang membersihkan database secara total...");
  
  try {
    // 1. Hapus detail transaksi dulu karena mereka 'nempel' ke Varian
    const delPenjualan = await prisma.penjualan.deleteMany({});
    console.log(`🗑️  Data Penjualan dihapus: ${delPenjualan.count}`);

    // 2. Hapus data BelumBayar jika ada
    const delBelumBayar = await prisma.belumBayar.deleteMany({});
    console.log(`🗑️  Data BelumBayar dihapus: ${delBelumBayar.count}`);

    // 3. Sekarang baru aman hapus Barang (Varian akan ikut terhapus otomatis karena Cascade)
    const delBarang = await prisma.barang.deleteMany({});
    console.log(`✅ Data Barang berhasil dihapus: ${delBarang.count}`);

  } catch (error) {
    console.error("❌ Gagal reset database:", error);
  }
}

main().finally(() => prisma.$disconnect());