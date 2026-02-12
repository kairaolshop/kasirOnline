// app/api/penghasilan/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse,NextRequest } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bulan = searchParams.get('bulan');
  const tahun = searchParams.get('tahun');
  const marketplace = searchParams.get('marketplace');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 30;
  const skip = (page - 1) * limit;

  let whereClause: any = {};

  if (bulan && tahun) {
    const prefix = `${tahun}-${bulan.padStart(2, '0')}`;
    whereClause.tanggal = { startsWith: prefix };
  }

  if (marketplace && marketplace !== "Semua Marketplace") {
    whereClause.marketplace = marketplace;
  }

  try {
    const data = await prisma.penghasilan.findMany({
      where: whereClause,
      orderBy: { tanggal: 'desc' },
      take: limit,
      skip: skip,
    });
    const totalData = await prisma.penghasilan.count({ where: whereClause });

    return NextResponse.json({
      data,
      metadata: {
        currentPage: page,
        hasNextPage: skip + data.length < totalData,
        totalData
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedTanggal = body.tanggal;

    if (!requestedTanggal) {
      return NextResponse.json({ message: "Tanggal harus diisi" }, { status: 400 });
    }
    const startOfDay = new Date(`${requestedTanggal}T00:00:00`);
    const endOfDay = new Date(`${requestedTanggal}T23:59:59`);

    const tglStr = requestedTanggal;
    const transaksiData = await prisma.transaksi.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { items: true },
    });

    console.log(`DEBUG: Mencari antara ${startOfDay.toISOString()} s/d ${endOfDay.toISOString()}`);
    console.log(`DEBUG: Ditemukan ${transaksiData.length} transaksi`);

    if (transaksiData.length === 0) {
      return NextResponse.json(
        { message: `Tidak ada transaksi pada tanggal ${tglStr}` },
        { status: 404 } // Beri status error agar frontend tahu
      );
    }
    const rekapMap: Record<string, any> = {};

    transaksiData.forEach((trx) => {
      const mp = trx.marketplace;
      if (!rekapMap[mp]) {
        rekapMap[mp] = { unit: 0, jual: 0, beli: 0, admin: 0, zakat: 0, laba: 0 };
      }

      trx.items.forEach((item) => {
        rekapMap[mp].unit += item.jumlah;
        rekapMap[mp].jual += item.hargaJual; 
        rekapMap[mp].beli += item.hargaBeli;
        rekapMap[mp].admin += item.totalAdmin;
        rekapMap[mp].zakat += item.zakat;
        rekapMap[mp].laba += item.laba;
      });
    });
    const entries = Object.entries(rekapMap);
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][startOfDay.getDay()];

    const results = await Promise.all(
      Object.entries(rekapMap).map(([mp, data]) => 
        prisma.penghasilan.upsert({
          where: {
            tanggal_marketplace: { 
                tanggal: tglStr, 
                marketplace: mp 
            }
          },
          update: {
            totalUnit: data.unit,
            totalJual: data.jual,
            totalBeli: data.beli,
            totalAdmin: data.admin,
            totalZakat: data.zakat,
            totalLabaBersih: data.laba,
            hari: hari // Update hari jika barangkali salah
          },
          create: {
            tanggal: tglStr,
            hari: hari,
            marketplace: mp,
            totalUnit: data.unit,
            totalJual: data.jual,
            totalBeli: data.beli,
            totalAdmin: data.admin,
            totalZakat: data.zakat,
            totalLabaBersih: data.laba
          }
        })
      )
    );

    return NextResponse.json({ 
        message: "Rekap berhasil diperbarui", 
        tanggal: tglStr,
        count: results.length 
    });

  } catch (error: any) {
    console.error("Error Rekap:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}