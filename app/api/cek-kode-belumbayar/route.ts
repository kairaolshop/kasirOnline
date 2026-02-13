import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kode = searchParams.get("kode");

  if (!kode) return NextResponse.json({ exists: false });

  const existing = await prisma.belumBayar.findFirst({
    where: { kodePesanan: kode.trim() },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!existing });
}