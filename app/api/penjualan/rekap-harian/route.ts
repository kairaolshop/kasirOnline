import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Ambil data Transaksi & Item yang belum di-rekap
    // Di sini kita sesuaikan include: varian -> barang
    const transaksiData = await prisma.transaksi.findMany({
      where: { isRekap: false },
      include: {
        items: {
          include: { 
            varian: { 
              include: { 
                barang: true 
              } 
            } 
          }
        }
      }
    });

    if (transaksiData.length === 0) {
      return NextResponse.json({ message: "Tidak ada data untuk direkap" }, { status: 400 });
    }

    const rekapDataList: any[] = [];
    const transaksiIds: number[] = [];

    for (const t of transaksiData) {
      transaksiIds.push(t.id);
      for (const item of t.items) {
        rekapDataList.push({
          tanggal: t.tanggal.toISOString().split('T')[0],
          kodePesanan: t.kodePesanan,
          kodeBarang: item.varian.barang.id.toString(), 
          marketplace: t.marketplace,
          namaBarang: `${item.varian.barang.nama} - ${item.varian.warna}`,
          jumlah: item.jumlah,
          hargaJual: item.hargaJual,
          hargaBeli: item.hargaBeli,
          totalAdmin: item.totalAdmin,
          zakat: item.zakat,
          labaBersih: item.laba,
          status: "dikirim" 
        });
      }
    }

    // 3. Jalankan Transaksi secara Batch (Sekaligus)
    await prisma.$transaction(async (tx) => {
      // Simpan semua item sekaligus
      await tx.rekapHarian.createMany({
        data: rekapDataList,
        skipDuplicates: true // Mencegah error jika ada kode pesanan yang duplikat
      });

      // Tandai semua transaksi asal sebagai sudah di-rekap sekaligus
      await tx.transaksi.updateMany({
        where: { id: { in: transaksiIds } },
        data: { isRekap: true }
      });
    }, {
      timeout: 20000 // Menambah waktu tunggu menjadi 20 detik agar lebih aman
    });

    return NextResponse.json({ message: "Berhasil rekap harian" });
  } catch (error) {
    console.error("Error Rekap:", error);
    return NextResponse.json({ error: "Gagal proses rekap" }, { status: 500 });
  }
}