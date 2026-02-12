import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma'; // sesuaikan path prisma kamu

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const bulan     = searchParams.get('bulan');
  const tahun     = searchParams.get('tahun');
  const page      = parseInt(searchParams.get('page') || '1', 10);
  const limit     = parseInt(searchParams.get('limit') || '50', 10);
  
  const skip  = (page - 1) * limit;
  
  const where: any = {};
  if (bulan && tahun) {
    where.tanggal = { startsWith: `${tahun}-${bulan.padStart(2, '0')}` };
  }

  // Hitung total untuk tahu ada berapa halaman
  const total = await prisma.rekapHarian.count({ where });
  
  const data = await prisma.rekapHarian.findMany({
    where,
    orderBy: [
      { tanggal: 'desc' },
      { kodePesanan: 'desc' }
    ],
    skip,
    take: limit,
  });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }
  });
}

// PATCH tetap sama (update status berdasarkan kodePesanan)
export async function PATCH(request: Request) {
  const { kodePesanan, statusBaru } = await request.json();
  try {
    await prisma.rekapHarian.updateMany({
      where: { kodePesanan },
      data: { status: statusBaru }
    });
    return NextResponse.json({ message: "Status diperbarui" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}