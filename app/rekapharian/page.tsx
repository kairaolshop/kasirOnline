"use client";
import React, { useState, useMemo, useEffect, Fragment } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TransaksiPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [filter, setFilter] = useState({ bulan: "02", tahun: "2026" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [statusBaru, setStatusBaru] = useState("");

  // Buat URL dengan semua parameter
  const apiUrl = `/api/transaksi?bulan=${filter.bulan}&tahun=${filter.tahun}&page=${page}&limit=${limit}`;

  const { data: response, mutate, isValidating } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000
  });

  const data = response?.data || [];
  const pagination = response?.pagination || {};

  const daftarBulan = [
    { val: "01", nama: "Januari" }, { val: "02", nama: "Februari" },
    { val: "03", nama: "Maret" },   { val: "04", nama: "April" },
    { val: "05", nama: "Mei" },     { val: "06", nama: "Juni" },
    { val: "07", nama: "Juli" },    { val: "08", nama: "Agustus" },
    { val: "09", nama: "September" }, { val: "10", nama: "Oktober" },
    { val: "11", nama: "November" },  { val: "12", nama: "Desember" },
  ];

  const tahunSekarang = new Date().getFullYear();
  const daftarTahun = Array.from({ length: 5 }, (_, i) => tahunSekarang - i + 1); // ± beberapa tahun

  useEffect(() => { setIsMounted(true); }, []);

  const groupedData = useMemo(() => {
    if (!data?.length) return {};

    const filtered = data.filter((item: any) =>
      item.kodePesanan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: { [key: string]: any[] } = {};
    filtered.forEach((item: any) => {
      if (!groups[item.kodePesanan]) groups[item.kodePesanan] = [];
      groups[item.kodePesanan].push(item);
    });
    return groups;
  }, [data, searchTerm]);

  const handleUpdateStatus = async () => {
    if (!selectedItem || !statusBaru) return alert("Pilih pesanan dan status!");
    
    const res = await fetch("/api/transaksi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kodePesanan: selectedItem.kodePesanan, statusBaru })
    });

    if (res.ok) {
      toast.success("Status berhasil diperbarui");
      setSelectedItem(null);
      setStatusBaru("");
      mutate();
    } else {
      toast.error("Gagal memperbarui status");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-4 text-[11px] font-sans">
      {/* PANEL KONTROL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-yellow-100 p-4 rounded border border-yellow-300 shadow-sm">
           <h2 className="font-bold mb-2 uppercase text-blue-800">Koreksi Status</h2>
           <div className="flex flex-col gap-2">
              <div className="bg-white p-2 border font-bold text-blue-600">
                {selectedItem ? selectedItem.kodePesanan : "Pilih kode di tabel..."}
              </div>
              <select 
                className="p-2 border bg-white" 
                value={statusBaru} 
                onChange={e => setStatusBaru(e.target.value)}
                disabled={!selectedItem}
              >
                <option value="">-- Pilih Status --</option>
                <option value="terkirim">Terkirim</option>
                <option value="batal">Batal</option>
                <option value="retur">Retur</option>
              </select>
              <button 
                onClick={handleUpdateStatus}
                className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 font-bold"
                disabled={!selectedItem || !statusBaru}
              >
                UPDATE STATUS
              </button>
           </div>
        </div>

        <div className="bg-yellow-100 p-4 rounded border border-yellow-300 shadow-sm">
          <h2 className="font-bold mb-2 uppercase text-blue-800">Cari Data</h2>
          <input 
            placeholder="Cari Kode Pesanan..." 
            className="w-full p-2 border mb-2"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <select 
                className="flex-1 p-2 border" 
                value={filter.bulan} 
                onChange={e => setFilter({...filter, bulan: e.target.value})}
              >
                {daftarBulan.map(b => (
                  <option key={b.val} value={b.val}>{b.nama}</option>
                ))}
              </select>

              <select 
                className="flex-1 p-2 border" 
                value={filter.tahun} 
                onChange={e => setFilter({...filter, tahun: e.target.value})}
              >
                {daftarTahun.map(t => (
                  <option key={t} value={t.toString()}>{t}</option>
                ))}
              </select>
            <Link href="/">
            <button className="bg-black text-white py-2 px-4 rounded">Home</button>
            </Link>
          </div>
        </div>
      </div>

      {/* TABEL DENGAN GROUPING */}
      <div className="bg-black text-white rounded shadow-2xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-[#1a1a1a] sticky top-0 z-20 text-gray-300 uppercase font-bold border-b border-gray-700">
              <tr>
                <th className="p-2 border-r border-gray-700 w-10 text-center">No</th>
                <th className="p-2 border-r border-gray-700">Tanggal</th>
                <th className="p-2 border-r border-gray-700">Kode Pesanan</th>
                <th className="p-2 border-r border-gray-700">Marketplace</th>
                <th className="p-2 border-r border-gray-700">Nama Barang</th>
                <th className="p-2 border-r border-gray-700 text-center">Qty</th>
                <th className="p-2 border-r border-gray-700 text-right">Laba Bersih</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedData).length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-400">
                    {isValidating ? "Memuat data..." : "Tidak ada data"}
                  </td>
                </tr>
              ) : (
                Object.keys(groupedData).map((kode, idx) => {
                  const items = groupedData[kode];
                  const rowCount = items.length;

                  return (
                    <Fragment key={kode}>
                      {items.map((item, i) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`border-b border-gray-800 transition-colors cursor-pointer ${
                            selectedItem?.kodePesanan === kode ? "bg-blue-900/40" : "hover:bg-gray-900"
                          }`}
                        >
                          {i === 0 && (
                            <>
                              <td rowSpan={rowCount} className="p-2 border-r border-gray-700 text-center bg-gray-900/50 align-middle">
                                {(page - 1) * limit + idx + 1}
                              </td>
                              <td rowSpan={rowCount} className="p-2 border-r border-gray-700 text-gray-400 align-middle text-center">
                                {item.tanggal}
                              </td>
                              <td rowSpan={rowCount} className="p-2 border-r border-gray-700 font-bold text-blue-400 align-middle text-center">
                                {kode}
                              </td>
                              <td rowSpan={rowCount} className={`p-2 border-r border-gray-700 font-bold align-middle text-center ${
                                item.marketplace?.includes('Shopee') ? 'text-orange-500' : 'text-green-500'
                              }`}>
                                {item.marketplace}
                              </td>
                            </>
                          )}

                          <td className="p-2 border-r border-gray-800 italic text-gray-300">
                            {item.namaBarang}
                          </td>
                          <td className="p-2 border-r border-gray-800 text-center">
                            {item.jumlah}
                          </td>
                          <td className="p-2 border-r border-gray-800 text-right font-mono text-green-400">
                            {Number(item.labaBersih || 0).toLocaleString('id-ID')}
                          </td>

                          {i === 0 && (
                            <td rowSpan={rowCount} className="p-2 text-center align-middle">
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                                item.status === 'dikirim' || item.status === 'terkirim' 
                                  ? 'bg-green-600' 
                                  : item.status === 'batal' || item.status === 'retur'
                                    ? 'bg-red-600'
                                    : 'bg-gray-600'
                              }`}>
                                {item.status || '-'}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-900 p-3 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Halaman {page} {pagination.total ? `dari ${Math.ceil(pagination.total / limit)}` : ''}
            {pagination.total ? ` (${pagination.total} entri)` : ''}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isValidating}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext || isValidating}
              className="bg-blue-700 hover:bg-blue-600 px-4 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}