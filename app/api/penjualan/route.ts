import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  const { searchParams} = new URL(request.url);
  const search = searchParams.get(`search`);
  let whereClause: any ={};

  if (search){
    whereClause.kodePesanan = {
      contains: search,
    }
  }
  try {
    const data = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            varian: {
              include: {
                barang: true,
              },
            },
          },
        },
      },
      orderBy: {
        id:'desc',
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transaksi:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// POST: Simpan satu pesanan (Header & Detail saja)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, kodePesanan, marketplace, tanggalInput } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    // Gunakan tanggal input manual atau hari ini
    const tglTransaksi = tanggalInput ? new Date(tanggalInput) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Header Transaksi
      const header = await tx.transaksi.create({
        data: {
          kodePesanan,
          marketplace,
          tanggal: tglTransaksi,
        },
      });

      // 2. Loop Simpan Detail Penjualan & Potong Stok
      for (const item of items) {
        // Cek stok sebelum potong
        const varian = await tx.varian.findUnique({ where: { id: item.varianId } });
        if (!varian || varian.stok < item.jumlah) {
          throw new Error(`Stok untuk varian ${item.varianId} tidak mencukupi`);
        }

        await tx.penjualan.create({
          data: {
            transaksiId: header.id, // Hubungkan ke ID header
            varianId: item.varianId,
            jumlah: item.jumlah,
            hargaJual: item.hargaJual,
            hargaBeli: item.hargaBeli,
            totalAdmin: item.totalAdmin,
            zakat: item.totalZakat || 0,
            laba: item.labaBersih,
            tanggal: tglTransaksi,
          },
        });

        // 3. Potong Stok Varian
        await tx.varian.update({
          where: { id: item.varianId },
          data: { stok: { decrement: item.jumlah } },
        });
      }

      return header;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus satu transaksi utuh menggunakan ID
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ambil detail untuk kembalikan stok
      const items = await tx.penjualan.findMany({
        where: { transaksiId: Number(id) }
      });

      if (items.length === 0) throw new Error('Data tidak ditemukan');

      // 2. Kembalikan stok satu per satu
      for (const item of items) {
        await tx.varian.update({
          where: { id: item.varianId },
          data: { stok: { increment: item.jumlah } },
        });
      }

      // 3. Hapus Transaksi (Detail otomatis terhapus karena Cascade)
      await tx.transaksi.delete({
        where: { id: Number(id) },
      });
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus dan stok kembali' });
  } catch (error: any) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}