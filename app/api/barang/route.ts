import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const barang = await prisma.barang.findMany({
      include: {
        variants: true, // WAJIB ADA agar barang.variants tidak undefined
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(barang);
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