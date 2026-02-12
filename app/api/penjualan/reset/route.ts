import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await prisma.penjualan.deleteMany({});
    await prisma.transaksi.deleteMany({});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Gagal reset" }, { status: 500 });
  }
}