// app/api/grafik/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("mode") || "Bulan";
  const tahun = searchParams.get("tahun")!;
  const bulan = searchParams.get("bulan");
  const marketplaceFilter = searchParams.get("marketplace") || "Keduanya";

  try {
    let where: any = {
      tanggal: { startsWith: tahun },
    };

    const rawData = await prisma.penghasilan.findMany({
      where,
      orderBy: { tanggal: "asc" },
    });

    const iterations =
      mode === "Bulan"
        ? new Date(Number(tahun), Number(bulan || 1), 0).getDate()
        : 12;

    const chartData = [];

    const normalize = (mp: string) => mp?.toLowerCase().trim().replace(/\s+/g, ' ') || "";

    for (let i = 1; i <= iterations; i++) {
      let label = "";
      let filteredRecords = [];

      if (mode === "Bulan") {
        label = i.toString();
        const targetDate = `${tahun}-${bulan?.padStart(2, "0")}-${i
          .toString()
          .padStart(2, "0")}`;
        filteredRecords = rawData.filter((d) => d.tanggal === targetDate);

      } else {
        label = `Bulan ${i}`;
        const targetMonthPrefix = `${tahun}-${i.toString().padStart(2, "0")}-`;
        filteredRecords = rawData.filter((d) =>
          d.tanggal.startsWith(targetMonthPrefix)
        );
      }

     const isKeduanya = marketplaceFilter === "Keduanya";
      const selectedMp = normalize(marketplaceFilter);

        const shopeeItems = filteredRecords.filter(d => {
        const name = normalize(d.marketplace);
        const isShopee = name.includes('shopee');
        return isKeduanya ? isShopee : (isShopee && name === selectedMp);
      });

      const tiktokItems = filteredRecords.filter(d => {
        const name = normalize(d.marketplace);
        const isTiktok = name.includes('tiktok');
        return isKeduanya ? isTiktok : (isTiktok && name === selectedMp);
      });

      chartData.push({
        tanggal: label,
        totalJualShopee: shopeeItems.reduce((sum, d) => sum + d.totalJual, 0),
        totalLabaShopee: shopeeItems.reduce((sum, d) => sum + d.totalLabaBersih, 0),
        totalJualTikTok: tiktokItems.reduce((sum, d) => sum + d.totalJual, 0),
        totalLabaTikTok: tiktokItems.reduce((sum, d) => sum + d.totalLabaBersih, 0),
      });
    }

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Grafik Error:", error);
    return NextResponse.json(
      { error: "Gagal ambil data grafik" },
      { status: 500 }
    );
  }
}
