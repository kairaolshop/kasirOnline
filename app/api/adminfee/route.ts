
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { marketplaceId, jenisBiaya, tipeNominal, nominal } = body;

    if (!marketplaceId || !jenisBiaya || !tipeNominal || nominal == null) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (!['%', 'Rp'].includes(tipeNominal)) {
      return NextResponse.json({ error: 'tipeNominal harus "%" atau "Rp"' }, { status: 400 });
    }

    const newFee = await prisma.jenisAdminFee.create({
      data: {
        marketplaceId: Number(marketplaceId),
        jenisBiaya,
        tipeNominal,
        nominal: Number(nominal),
        status: true,
      },
      include: {
        marketplace: { select: { namaToko: true } },
      },
    });

    return NextResponse.json(newFee, { status: 201 });
  } catch (error) {
    console.error('Error creating admin fee:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketplaceNama = searchParams.get("marketplace");

  try {
    const whereClause = marketplaceNama
      ? {
          marketplace: {
            namaToko: marketplaceNama,
          },
        }
      : {};

    const adminFees = await prisma.jenisAdminFee.findMany({
      where: whereClause,
      orderBy:{id: "asc"},
      include: {
        marketplace: { select: { namaToko: true } },
      },
    });

    return NextResponse.json(adminFees);
  } catch (error) {
    console.error("Error fetching admin fees:", error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}