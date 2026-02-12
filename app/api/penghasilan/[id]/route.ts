// app/api/penghasilan/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.penghasilan.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Ringkasan berhasil dihapus' });
  } catch (error: any) {
    console.error('DELETE Penghasilan Error:', error);
    return NextResponse.json({ 
      message: 'Gagal menghapus data: ' + error.message 
    }, { status: 500 });
  }
}