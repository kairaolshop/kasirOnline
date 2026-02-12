import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const marketplace = await prisma.marketplace.findMany({
            where: {status: true},
            orderBy: {namaToko: 'asc'},
            select: {
                id:true, namaToko:true, status:true
            },
        });
        
        return NextResponse.json(marketplace);
    } catch (error) {
        console.error('Error fetching markertplace:',error)
        return NextResponse.json({error: 'Gagal mengambil data marketplace'},{status:500});
    }
}