import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { kodePesanan } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil semua item dari BelumBayar berdasarkan kodePesanan
      const items = await tx.belumBayar.findMany({
        where: { kodePesanan },
      });

      if (items.length === 0) throw new Error('Pesanan tidak ditemukan');

      // 2. Buat satu Header Transaksi (Lunas)
      const header = await tx.transaksi.create({
        data: {
          kodePesanan: items[0].kodePesanan,
          marketplace: items[0].marketplace,
          tanggal: new Date(), // Tanggal lunas sekarang
        },
      });

      // 3. Pindahkan item ke tabel Penjualan (Detail)
      // Gunakan loop atau createMany untuk memasukkan detail
      for (const item of items) {
        await tx.penjualan.create({
          data: {
            transaksiId: header.id, // Hubungkan ke header yang baru dibuat
            varianId: item.varianId,
            jumlah: item.jumlah,
            hargaJual: item.hargaJual,
            hargaBeli: item.hargaBeli,
            totalAdmin: item.totalAdmin,
            zakat: item.zakat,
            laba: item.laba,
            tanggal: new Date(),
          },
        });
      }

      // 4. Hapus dari tabel BelumBayar
      await tx.belumBayar.deleteMany({
        where: { kodePesanan },
      });

      return header;
    });

    return NextResponse.json({ message: 'Berhasil pindah ke penjualan lunas', data: result });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Gagal pindah' }, { status: 500 });
  }
}