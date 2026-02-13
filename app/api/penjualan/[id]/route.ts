import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params:Promise< { id: string }> }
) {
  const id = await params;
  const idNumber = Number(id);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ambil detail produk untuk kembalikan stok
      const items = await tx.penjualan.findMany({
        where: { transaksiId: idNumber }
      });

      // 2. Kembalikan stok
      for (const item of items) {
        await tx.varian.update({
          where: { id: item.varianId },
          data: { stok: { increment: item.jumlah } },
        });
      }

      // 3. Hapus Header (Detail akan ikut terhapus otomatis jika Cascade Delete aktif)
      await tx.transaksi.delete({
        where: { id: idNumber },
      });
    });

    return NextResponse.json({ message: 'Berhasil hapus transaksi dan stok kembali' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}