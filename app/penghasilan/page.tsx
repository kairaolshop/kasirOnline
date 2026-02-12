"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import useSWR from "swr";

interface PenghasilanItem {
  id: number;
  tanggal: string;
  hari: string;
  marketplace: string;
  totalUnit: number;
  totalJual: number;
  totalBeli: number;
  totalAdmin: number;
  totalZakat: number;
  totalLabaBersih: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PenghasilanPage() {
  const [marketplaceFilter, setMarketplaceFilter] = useState("Semua Marketplace");
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [rekapTanggal, setRekapTanggal] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  if (bulan) queryParams.append("bulan", bulan);
  if (tahun) queryParams.append("tahun", tahun);
  if (marketplaceFilter && marketplaceFilter !== "Semua Marketplace") {
    queryParams.append("marketplace", marketplaceFilter);
  }

  const { data: response, isLoading, mutate } = useSWR<{ data: PenghasilanItem[], metadata: any }>(
  `/api/penghasilan?${queryParams.toString()}`,
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  }
);
const displayData = response?.data || [];
const metadata = response?.metadata;

  useEffect(() => {
    const fetchMarketplaces = async () => {
      const res = await fetch("/api/marketplace");
      const mps = await res.json();
      setMarketplaces(["Semua Marketplace", ...mps.map((m: any) => m.namaToko)]);
    };
    fetchMarketplaces();

    // Ambil tanggal terakhir dari kasir
    const saved = localStorage.getItem('lastTransactionDate');
    if (saved) {
      setRekapTanggal(saved);
    } else {
      const kemarin = new Date();
      kemarin.setDate(kemarin.getDate() - 1);
      setRekapTanggal(kemarin.toISOString().split("T")[0]);
    }
  }, []);

  // --- ACTIONS ---
  const resetFilter = () => {
    setBulan("");
    setTahun("");
    setMarketplaceFilter("Semua Marketplace");
    // SWR akan otomatis mendeteksi perubahan state dan fetch ulang
  };

  const simpanDataPenjualan = async () => {
    if (!rekapTanggal) return alert("Belum ada tanggal dipilih");

    const confirmAction = confirm(`Ringkas semua transaksi tanggal ${rekapTanggal}?`);
    if (!confirmAction) return;

    try {
      const res = await fetch("/api/penghasilan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: rekapTanggal })
      });

      if (res.ok) {
        alert("Berhasil diringkas!");
        mutate(); // Segarkan tabel secara instan
      } else {
        const result = await res.json();
        alert(result.message || "Gagal meringkas data");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const hapusTerpilih = async () => {
    if (!selectedId) return alert("Pilih baris data terlebih dahulu!");
    if (!confirm("Hapus baris ini?")) return;

    try {
      const res = await fetch(`/api/penghasilan/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Data berhasil dihapus");
        setSelectedId(null);
        mutate(); // Segarkan tabel
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const getColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("shopee")) return "text-orange-500 font-bold";
    if (n.includes("tiktok")) return "text-slate-800 font-bold"; 
    if (n.includes("tokopedia")) return "text-green-600 font-bold";
    return "";
  };

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-6 flex flex-col" >
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          TABEL RINGKASAN PENGHASILAN
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Tanggal Penjualan terdeteksi:</label>
          <div className="inline-block border rounded px-4 py-2 bg-yellow-50 text-yellow-700 font-bold border-yellow-200">
            {rekapTanggal || "---"}
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-wrap gap-3 mb-6 items-end border-b pb-6">
          <div className="flex flex-col">
            <label className="text-xs font-bold mb-1">MARKETPLACE</label>
            <select
              value={marketplaceFilter}
              onChange={(e) => setMarketplaceFilter(e.target.value)}
              className="border rounded px-3 py-2 bg-white"
            >
              {marketplaces.map((mp) => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold mb-1">BULAN</label>
            <input
              type="number"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="border rounded px-3 py-2 w-20"
              placeholder="1-12"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold mb-1">TAHUN</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="border rounded px-3 py-2 w-24"
              placeholder="2026"
            />
          </div>

          <Link href= "/grafik">
          <button className="cursor-pointer bg-cyan-500 text-white px-6 py-2 rounded font-medium hover:bg-cyan-600">Tampilkan grafik</button>
          </Link>

          <button 
            onClick={resetFilter}
            className="cursor-pointer bg-gray-200 px-4 py-2 rounded font-medium hover:bg-gray-300 transition"
          >
            Reset
          </button>

          <button 
            onClick={mutate as any}
            className="cursor-pointer bg-cyan-500 text-white px-6 py-2 rounded font-medium hover:bg-cyan-600"
          >
            {isLoading ? "Loading..." : "Refresh Data"}
          </button>

          <button 
            onClick={simpanDataPenjualan}
            className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700"
          >
            Rekap Data ({rekapTanggal})
          </button>

          <button 
            onClick={hapusTerpilih}
            disabled={!selectedId}
            className={` px-6 py-2 rounded font-medium text-white ${selectedId ? "bg-red-500" : "bg-red-100 cursor-not-allowed"}`}
          >
            Hapus Baris
          </button>

          <Link href="/">
            <button className="cursor-pointer bg-black py-2 px-4 rounded text-white font-medium">HOME</button>
          </Link>
        </div>

        {/* Tabel Section */}
        <div className="overflow-x-auto">
  <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg shadow-inner">
    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
      <thead className="bg-gray-800 text-white sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="p-3 font-semibold text-left whitespace-nowrap">#</th>
          <th className="p-3 font-semibold text-left whitespace-nowrap">Tanggal</th>
          <th className="p-3 font-semibold text-left whitespace-nowrap">Hari</th>
          <th className="p-3 font-semibold text-left whitespace-nowrap">Marketplace</th>
          <th className="p-3 font-semibold text-center whitespace-nowrap">Unit</th>
          <th className="p-3 font-semibold text-right whitespace-nowrap">Penjualan</th>
          <th className="p-3 font-semibold text-right whitespace-nowrap">Modal</th>
          <th className="p-3 font-semibold text-right whitespace-nowrap">Admin</th>
          <th className="p-3 font-semibold text-right whitespace-nowrap">Zakat</th>
          <th className="p-3 font-semibold text-right whitespace-nowrap">Laba Bersih</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {isLoading ? (
          <tr>
            <td colSpan={10} className="p-10 text-center animate-pulse text-gray-500">
              Sedang mengambil data...
            </td>
          </tr>
        ) : displayData.length === 0 ? (
          <tr>
            <td colSpan={10} className="p-10 text-center text-gray-500 italic">
              Data tidak ditemukan. Silahkan pilih filter lain atau lakukan rekap data.
            </td>
          </tr>
        ) : (
          displayData.map((item, idx) => (
            <tr
              key={item.id}
              onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
              className={`transition-colors cursor-pointer hover:bg-gray-50 ${
                selectedId === item.id ? "bg-blue-50" : ""
              }`}
            >
              <td className="p-3 text-gray-500">{idx + 1}</td>
              <td className="p-3 whitespace-nowrap font-mono">{item.tanggal}</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {item.hari}
                </span>
              </td>
              <td className={`p-3 ${getColor(item.marketplace)}`}>{item.marketplace}</td>
              <td className="p-3 text-center font-semibold">{item.totalUnit}</td>
              <td className="p-3 text-right">Rp {item.totalJual.toLocaleString("id-ID")}</td>
              <td className="p-3 text-right text-red-500 text-xs">Rp {item.totalBeli.toLocaleString("id-ID")}</td>
              <td className="p-3 text-right text-gray-500">Rp {item.totalAdmin.toLocaleString("id-ID")}</td>
              <td className="p-3 text-right text-purple-600">Rp {item.totalZakat.toLocaleString("id-ID")}</td>
              <td className="p-3 text-right font-bold text-green-700">
                Rp {item.totalLabaBersih.toLocaleString("id-ID")}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>
        <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">
            Menampilkan {displayData.length} dari {metadata?.totalData || 0} data
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className={`px-4 py-2 rounded ${page === 1 ? "bg-gray-200 text-gray-400" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              Sebelumnya
            </button>
            <div className="flex items-center px-4 font-bold text-blue-600">
              Halaman {page}
            </div>
            <button
              disabled={!metadata?.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className={`px-4 py-2 rounded ${!metadata?.hasNextPage ? "bg-gray-200 text-gray-400" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}