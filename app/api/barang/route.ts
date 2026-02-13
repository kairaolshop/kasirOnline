import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Ambil data dengan limit dan skip
    const [barang, totalCount] = await prisma.$transaction([
      prisma.barang.findMany({
        skip: skip,
        take: limit,
        include: { variants: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.barang.count() // Untuk menghitung total halaman
    ]);

    return NextResponse.json({
      data: barang,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  const { kode, nama, stok, hargaJual, hargaBeli, variants } = body;

  try {
    const newBarang = await prisma.barang.create({
      data: {
        kode,
        nama,
        hargaJual: Number(hargaJual),
        hargaBeli: Number(hargaBeli),
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            warna: v.warna,
            stok: Number(v.stok),
          })),
        } : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json(newBarang, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal simpan barang' }, { status: 500 });
  }
}