
import { prisma } from '@/lib/prisma';
import { error } from 'console';
import { statSync } from 'fs';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const {id}= await params;
    const idNumber =Number(id);
    const fee = await prisma.jenisAdminFee.findUnique({
      where: { id: idNumber },
      include: { marketplace: { select: { namaToko: true } } },
    });

    if (!fee) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error fetching admin fee:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id}= await params;
    const idNumber= Number(id)

    const body = await request.json();
    const { marketplaceId, jenisBiaya, tipeNominal, nominal } = body;

    if (!marketplaceId || !jenisBiaya || !tipeNominal || nominal == null) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (!['%', 'Rp'].includes(tipeNominal)) {
      return NextResponse.json({ error: 'tipeNominal harus "%" atau "Rp"' }, { status: 400 });
    }

    const updated = await prisma.jenisAdminFee.update({
      where: { id: idNumber},
      data: {
        marketplaceId: Number(marketplaceId),
        jenisBiaya,
        tipeNominal,
        nominal: Number(nominal),
        status: true, // update biasanya set ke aktif
      },
      include: { marketplace: { select: { namaToko: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating admin fee:', error);
    return NextResponse.json({ error: 'Gagal update data' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id}=await params;
    const idNumber = Number(id)

    await prisma.jenisAdminFee.delete({
      where: { id: idNumber },
    });

    return NextResponse.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting admin fee:', error);
    return NextResponse.json({ error: 'Gagal hapus data' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params; 
    const idNumber = Number(id);

    if (isNaN(idNumber)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (typeof status !== 'boolean') {
      return NextResponse.json({ error: 'Status harus boolean' }, { status: 400 });
    }

    const updated = await prisma.jenisAdminFee.update({
      where: { 
        id: idNumber
      },
      data: { status },
      include: { marketplace: { select: { namaToko: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating status admin fee:', error);
    return NextResponse.json({ error: 'Gagal update status' }, { status: 500 });
  }
}