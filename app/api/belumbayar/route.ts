import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.belumBayar.findMany({
      include: {
        varian: {
          include: {
            barang: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET BelumBayar Error:', error);
    return NextResponse.json({ error: 'Gagal ambil data belum bayar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body; // Mengambil array items dari keranjang

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const savedItems = [];

      for (const item of items) {
        // Simpan setiap item keranjang ke model BelumBayar sesuai skema Anda
        const newItem = await tx.belumBayar.create({
          data: {
            varianId: item.varianId,
            kodePesanan: item.kodePesanan,
            marketplace: item.marketplace,
            jumlah: item.jumlah,
            hargaJual: item.hargaJual,
            hargaBeli: item.hargaBeli,
            totalAdmin: item.totalAdmin, // Data matang dari calculateLaba
            zakat: item.totalZakat,      // Data matang dari calculateLaba
            laba: item.labaBersih,       // Data matang dari calculateLaba
          },
        });

        // Kurangi stok varian karena barang sudah "dipesan" (booking stok)
        await tx.varian.update({
          where: { id: item.varianId },
          data: { stok: { decrement: item.jumlah } },
        });

        savedItems.push(newItem);
      }
      return savedItems;
    });

    return NextResponse.json({ 
      message: 'Berhasil simpan ke belum bayar', 
      count: result.length 
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST BelumBayar Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal simpan' }, { status: 500 });
  }
}