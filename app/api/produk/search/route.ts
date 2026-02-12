import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const produk = await prisma.barang.findMany({
      where: {
        OR: [
          { nama: { contains: query, mode: 'insensitive' } },
          { kode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        variants: true,  // <-- KEMBALIKAN INI! Supaya varian ikut terkirim
      },
      take: 10,
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json(produk);
  } catch (error) {
    console.error('Error search produk:', error);
    return NextResponse.json({ error: 'Gagal mencari produk' }, { status: 500 });
  }
}