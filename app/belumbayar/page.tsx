"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BelumBayarItem {
  id: number;
  kodePesanan: string;
  kodeBarang: string;
  marketplace: string;
  namaBarang: string;
  warna: string;
  jumlah: number;
  hargaJual: number;
  hargaBeli: number;
  totalAdmin: number;
  zakat: number;
  laba: number;
}

export default function BelumBayarPage() {
  const [items, setItems] = useState<BelumBayarItem[]>([]);
  const [searchKodePesanan, setSearchKodePesanan] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingType, setLoadingType] = useState<"simpan"| "hapus" | null>(null)
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/belumbayar");
    const data = await res.json();
    setItems(data);
  };

  const simpanSudahBayar = async () => {
    if (!selectedId) {
      toast.warning("Pilih baris pesanan terlebih dahulu!");
      return;
    }
    
    const selectedItem = items.find((item) => item.id === selectedId);
    if (!selectedItem) return;
    

    if (confirm("Pindah pesanan ini ke Penjualan (sudah bayar)?")) {
    setLoadingType("simpan"); // Mulai loading
    try {
      const res = await fetch("/api/belumbayar/pindah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kodePesanan: selectedItem.kodePesanan }),
      });

      if (res.ok) {
        toast.success("Berhasil dipindah!");
        setSelectedId(null);
        fetchItems();
      } else {
        toast.error("Gagal pindah!");
      }
    } finally {
      setLoadingType(null);
    }
  }
};

  const hapusBelumBayar = async () => {
  // 1. Perbaikan urutan: Tampilkan toast dulu, baru return
  if (!selectedId) {
    toast.warning("Pilih baris pesanan terlebih dahulu!");
    return;
  }

  const selectedItem = items.find((item) => item.id === selectedId);
  if (!selectedItem) return;

  if (confirm(`Hapus seluruh pesanan ${selectedItem.kodePesanan} dan kembalikan stok?`)) {
    setLoadingType("hapus");
    
    try {
      const res = await fetch(`/api/belumbayar/${selectedId}?kodePesanan=${selectedItem.kodePesanan}`, { 
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Berhasil dihapus satu paket dan stok dikembalikan!");
        setSelectedId(null);
        fetchItems();
      } else {
        const err = await res.json();
        toast.error("Gagal hapus: " + (err.error || "Terjadi kesalahan"));
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setLoadingType(null);
    }
  }
};

  const filteredItems = items.filter((item) => item.kodePesanan.includes(searchKodePesanan));

  const handleRowClick = (id: number) => {
    setSelectedId(id);
  };
  const groupedData = filteredItems.reduce((acc: any[], current: any) => {
  const existing = acc.find(item => item.kodePesanan === current.kodePesanan);
  const kodeBarangSekarang = current.varian?.barang?.kode || "N/A";
  const namaBarang = current.varian?.barang?.nama || "N/A";
  const warnaBarang = current.varian?.warna || "-";
  

  if (existing) {
    // Tambahkan kode barang ke daftar jika belum ada (opsional, agar tidak duplikat)
    if (!existing.daftarKode.includes(kodeBarangSekarang, namaBarang, warnaBarang)) {
        
    }
    existing.daftarKode.push(kodeBarangSekarang);
    existing.daftarNama.push(namaBarang);
    existing.daftarWarna.push(warnaBarang);
    existing.jumlahTotal += (current.jumlah || 0);
    existing.hargaJualTotal += (current.hargaJual * current.jumlah || 0);
    existing.hargaBeliTotal += (current.hargaBeli * current.jumlah || 0);
    existing.totalAdminTotal += (current.totalAdmin || 0);
    existing.zakatTotal += (current.zakat || 0);
    existing.labaTotal += (current.laba || 0);
  } else {
    acc.push({
      ...current,
      // Inisialisasi daftar kode barang
      daftarKode: [kodeBarangSekarang],
      daftarNama: [namaBarang],
      daftarWarna:[warnaBarang],
      jumlahTotal: current.jumlah || 0,
      hargaJualTotal: (current.hargaJual * current.jumlah) || 0,
      hargaBeliTotal: (current.hargaBeli * current.jumlah) || 0,
      totalAdminTotal: current.totalAdmin || 0,
      zakatTotal: current.zakat || 0,
      labaTotal: current.laba || 0
    });
  }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-500">TABLE BELUM BAYAR</h1>

        {/* Tabel */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Kode Pesanan</th>
                <th className="p-2 border">Kode Barang</th>
                <th className="p-2 border">Marketplace</th>
                <th className="p-2 border">Nama Barang</th>
                <th className="p-2 border">Warna</th>
                <th className="p-2 border">Jumlah</th>
                <th className="p-2 border">Harga Jual</th>
                <th className="p-2 border">Harga Beli</th>
                <th className="p-2 border">Total Admin</th>
                <th className="p-2 border">Zakat</th>
                <th className="p-2 border">Laba</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  className={`cursor-pointer ${selectedId === item.id ? "bg-blue-100" : "hover:bg-gray-100"}`}
                >
                  <td className="p-2 align-top font-bold text-blue-700">{item.kodePesanan}</td>
                  <td className="p-2 align-top font-mono text-[10px]">
                    {item.daftarKode.map((kd: string, i: number) => (
                      <div key={i} className="border-b border-gray-50 last:border-0">{kd}</div>
                    ))}
                  </td>
                  <td className="p-2 align-top">{item.marketplace}</td>
                  
                  <td className="p-2 align-top text-xs">
                    {item.daftarNama.map((nm: string, i: number) => (
                      <div key={i} className="border-b border-gray-50 last:border-0 truncate max-w-[150px]">{nm}</div>
                    ))}
                  </td>
                  {/* Kolom Warna */}
                  <td className="p-2 align-top text-xs text-center">
                    {item.daftarWarna.map((wr: string, i: number) => (
                      <div key={i} className="border-b border-gray-50 last:border-0">{wr}</div>
                    ))}
                  </td>
                  <td className="p-2 text-center">{item.jumlahTotal}</td>
                  <td className="p-2 text-right">Rp {item.hargaJualTotal.toLocaleString("id-ID")}</td>
                  <td className="p-2 text-right">Rp {item.hargaBeliTotal.toLocaleString("id-ID")}</td>
                  <td className="p-2 text-right text-red-600">Rp {item.totalAdminTotal.toLocaleString("id-ID")}</td>
                  <td className="p-2 text-right">Rp {item.zakatTotal.toLocaleString("id-ID")}</td>
                  <td className="p-2 text-right font-bold text-green-700">Rp {item.labaTotal.toLocaleString("id-ID")}</td>                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tombol & Cari */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/">
             <button className="bg-red-500 px-6 py-2 text-white rounded font-medium">
                HOME
             </button>
            </Link>
          <button onClick={simpanSudahBayar} 
          disabled={loadingType !== null}
          className="bg-yellow-300 px-6 py-2 rounded font-medium">
            {loadingType === "simpan" ? "Memproses" : "Simpan sudah bayar"}
          </button>
          <button 
            onClick={hapusBelumBayar} 
            disabled={loadingType !== null}
            className="bg-yellow-300 px-6 py-2 rounded font-medium disabled:bg-gray-300"
          >
            {loadingType === "hapus" ? "Memproses..." : "Hapus Belum Bayar"}
          </button>
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Cari Kode Pesanan"
              value={searchKodePesanan}
              onChange={(e) => setSearchKodePesanan(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )};
