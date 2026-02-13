"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

interface Barang {
  id: number;
  kode: string;
  nama: string;
  variants: Varian[];
  stok: number;
  hargaJual: number;
  hargaBeli: number;
}

interface Varian {
  id?: number;
  warna: string;
  stok: number;
}

interface BarangApiResponse {
  data: Barang[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Fetcher dengan error handling yang lebih baik
const fetcher = async (url: string): Promise<BarangApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data: ${res.status}`);
  }
  return res.json();
};

export default function DataBarang() {
  const { mutate } = useSWRConfig();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchNama, setSearchNama] = useState("");
  const [searchKode, setSearchKode] = useState("");

  const [form, setForm] = useState({
    kode: "",
    nama: "",
    hargaJual: "",
    hargaBeli: "",
  });

  const [inputVariants, setInputVariants] = useState<Varian[]>([{ warna: "", stok: 0 }]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ── SWR: Fetch daftar barang dengan pagination ─────────────────────────────
  const {
    data: apiResponse,
    error,
    isLoading,
    mutate: mutateBarangList,
  } = useSWR<BarangApiResponse>(
    `/api/barang?page=${currentPage}&limit=50`,
    fetcher,
    {
      revalidateOnFocus: false,     // opsional: matikan agar tidak refresh saat tab dibuka kembali
      dedupingInterval: 30000,      // 30 detik — hindari request duplikat dalam waktu singkat
      keepPreviousData: true,       // sangat berguna saat ganti halaman (UI tetap smooth)
    }
  );

  // Ambil data dari response SWR (fallback ke nilai default)
  const barangList = apiResponse?.data ?? [];
  const totalPages = apiResponse?.totalPages ?? 1;
  const jumlahProduk = apiResponse?.total ?? 0;

  // Filter client-side (bisa diganti server-side search jika data sangat besar)
  const filteredBarang = barangList.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchNama.toLowerCase()) &&
      b.kode.toLowerCase().includes(searchKode.toLowerCase())
  );

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVariantChange = (index: number, field: keyof Varian, value: string | number) => {
    setInputVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const addVariantField = () => {
    setInputVariants((prev) => [...prev, { warna: "", stok: 0 }]);
  };

  const removeVariantField = (index: number) => {
    setInputVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = useCallback(() => {
    setForm({ kode: "", nama: "", hargaJual: "", hargaBeli: "" });
    setInputVariants([{ warna: "", stok: 0 }]);
    setSelectedId(null);
  }, []);

  const handleRefresh = () => {
    setCurrentPage(1);
    resetForm();
    setSearchNama("");
    setSearchKode("");
    mutateBarangList(); // trigger re-fetch
  };

  // ── CRUD Operations dengan revalidation SWR ────────────────────────────────
  const handleSaveNew = async () => {
    if (!form.kode.trim() || !form.nama.trim()) {
      alert("Kode dan Nama Produk wajib diisi!");
      return;
    }

    const payload = {
      kode: form.kode.trim(),
      nama: form.nama.trim(),
      hargaJual: Number(form.hargaJual) || 0,
      hargaBeli: Number(form.hargaBeli) || 0,
      variants: inputVariants
        .filter((v) => v.warna.trim() !== "")
        .map((v) => ({
          warna: v.warna.trim(),
          stok: Number(v.stok) || 0,
        })),
    };

    try {
      const res = await fetch("/api/barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success("Produk Baru & Varian Berhasil Disimpan!");
      resetForm();
      mutateBarangList(); // refresh list
      // Optional: langsung ke halaman 1 agar produk baru terlihat
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Gagal simpan produk baru");
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;

    const payload = {
      kode: form.kode.trim(),
      nama: form.nama.trim(),
      hargaJual: Number(form.hargaJual) || 0,
      hargaBeli: Number(form.hargaBeli) || 0,
      variants: inputVariants
        .filter((v) => v.warna.trim() !== "")
        .map((v) => ({
          id: v.id,
          warna: v.warna.trim(),
          stok: Number(v.stok) || 0,
        })),
    };

    try {
      const res = await fetch(`/api/barang/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal update");

      toast.success("Produk & Varian berhasil DIUPDATE!");
      resetForm();
      mutateBarangList(); // refresh list
    } catch (err) {
      console.error(err);
      toast.error("Gagal update produk");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus produk ini beserta variannya?")) return;

    try {
      const res = await fetch(`/api/barang/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");

      toast.success("Produk berhasil dihapus!");
      mutateBarangList(); // refresh list
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus produk");
    }
  };

  const handleEdit = useCallback((barang: Barang) => {
    setSelectedId(barang.id);
    setForm({
      kode: barang.kode,
      nama: barang.nama,
      hargaJual: barang.hargaJual.toString(),
      hargaBeli: barang.hargaBeli.toString(),
    });
    setInputVariants(
      barang.variants?.length > 0 ? barang.variants : [{ warna: "", stok: 0 }]
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#8ba6ff] p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Terjadi Kesalahan</h2>
          <p>{error.message}</p>
          <button
            onClick={() => mutateBarangList()}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded"
          >
            Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#8ba6ff] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white">Data Barang / Produk</h1>
          <div className="flex items-center gap-6">
            <div className="text-white text-lg">
              JUMLAH PRODUK : <span className="font-bold">{jumlahProduk.toLocaleString("id-ID")}</span>
            </div>
            <Link href="/">
              <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded text-sm">
                HOME
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Kiri */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center border-b pb-2">
              Form Kode Barang
            </h2>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cari Nama</label>
                <input
                  type="text"
                  value={searchNama}
                  onChange={(e) => setSearchNama(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Cari nama produk..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cari Kode</label>
                <input
                  type="text"
                  value={searchKode}
                  onChange={(e) => setSearchKode(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Cari kode..."
                />
              </div>

              {/* sisanya form sama seperti aslinya */}
              <div>
                <label className="block text-sm font-medium mb-1">Kode Produk</label>
                <input
                  name="kode"
                  value={form.kode}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Produk</label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Varian / Warna</h3>
                {inputVariants.map((v, index) => (
                  <div key={index} className="flex item-center gap-2 mb-2 flex-nowrap">
                    <input
                      value={v.warna}
                      onChange={(e) => handleVariantChange(index, "warna", e.target.value)}
                      className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
                      placeholder="Warna (misal: Mahogani)"
                    />
                    <input
                      type="number"
                      value={v.stok}
                      onChange={(e) => handleVariantChange(index, "stok", Number(e.target.value))}
                      className="w-32 border rounded px-3 py-2 text-sm w-24"
                      placeholder="Stok"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantField(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariantField}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                >
                  Tambah Varian
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Harga Jual</label>
                  <input
                    name="hargaJual"
                    type="number"
                    value={form.hargaJual}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga Beli</label>
                  <input
                    name="hargaBeli"
                    type="number"
                    value={form.hargaBeli}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNew}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded text-sm"
                  >
                    SIMPAN BARU
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={!selectedId}
                    className={`font-medium py-3 rounded text-sm ${
                      selectedId
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    UPDATE DATA
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 rounded text-sm"
                  >
                    BERSIHKAN / REFRESH
                  </button>

                  {selectedId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-red-500 hover:bg-red-600 text-white py-3 rounded text-sm"
                    >
                      BATAL EDIT
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Tabel Kanan */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Daftar Produk</h2>

            {isLoading ? (
              <div className="text-center py-10 text-gray-500">Memuat data barang...</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[700px] border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-800 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-left">No</th>
                      <th className="p-3 text-left">Kode</th>
                      <th className="p-3 text-left">Nama</th>
                      <th className="p-3 text-left">Varian</th>
                      <th className="p-3 text-center">Stok</th>
                      <th className="p-3 text-right">Harga Jual</th>
                      <th className="p-3 text-right">Harga Beli</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBarang.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-500">
                          {searchNama || searchKode
                            ? "Tidak ditemukan produk yang sesuai pencarian"
                            : "Belum ada data produk"}
                        </td>
                      </tr>
                    ) : (
                      filteredBarang.map((barang, idx) => (
                        <tr key={barang.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{idx + 1}</td>
                          <td className="p-3">{barang.kode}</td>
                          <td className="p-3">{barang.nama}</td>
                          <td className="p-3">
                            {barang.variants?.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {barang.variants.map((v) => (
                                  <span key={v.id || v.warna} className="text-xs">
                                    {v.warna}: <strong>{v.stok}</strong>{" "}
                                    {v.stok === 0 ? "(Habis)" : ""}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {barang.variants?.length > 0
                              ? barang.variants.reduce((total, v) => total + v.stok, 0)
                              : barang.stok || 0}
                          </td>
                          <td className="p-3 text-right">
                            Rp {barang.hargaJual.toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-right">
                            Rp {barang.hargaBeli.toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-center space-x-2">
                            <button
                              onClick={() => handleEdit(barang)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(barang.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-6 py-2 bg-gray-200 rounded disabled:opacity-50 font-medium"
                disabled={currentPage === 1 || isLoading}
              >
                Prev
              </button>
              <span className="py-2 px-4 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-6 py-2 bg-gray-200 rounded disabled:opacity-50 font-medium"
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}