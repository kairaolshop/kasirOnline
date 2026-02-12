import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const kodePesanan = searchParams.get('kodePesanan');

    if (!kodePesanan) {
      return NextResponse.json({ error: 'Kode Pesanan diperlukan' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Ambil semua item untuk kembalikan stok
      const items = await tx.belumBayar.findMany({
        where: { kodePesanan: kodePesanan },
      });

      if (items.length === 0) throw new Error('Data tidak ditemukan');

      // 2. Loop kembalikan stok ke tabel Varian
      for (const item of items) {
        await tx.varian.update({
          where: { id: item.varianId },
          data: { stok: { increment: item.jumlah } },
        });
      }

      // 3. Hapus semua baris BelumBayar dengan kodePesanan ini
      await tx.belumBayar.deleteMany({
        where: { kodePesanan: kodePesanan },
      });
    });

    return NextResponse.json({ message: 'Pesanan dibatalkan dan stok dikembalikan' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Gagal hapus' }, { status: 500 });
  }
}