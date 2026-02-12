"use client";

import Link from "next/link";
import { useState, useEffect } from "react";


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

export default function DataBarang() {
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    hargaJual: "",
    hargaBeli: "",
  });
  const [inputVariants, setInputVariants] = useState<Varian[]>([{ warna: "", stok: 0 }]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchNama, setSearchNama] = useState("");
  const [searchKode, setSearchKode] = useState("");
  const [jumlahProduk, setJumlahProduk] = useState(0);

  // Fetch semua barang saat halaman load
  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang");
      const data = await res.json();
      setBarangList(data);
      setJumlahProduk(data.length);
    } catch (err) {
      console.error("Gagal ambil data barang:", err);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleVariantChange = (index: number, field: keyof Varian, value: string | number) => {
    const newVariants = [...inputVariants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setInputVariants(newVariants);
  };
  const addVariantField = () => setInputVariants([...inputVariants, { warna: "", stok: 0 }]);
  const removeVariantField = (index: number) => setInputVariants(inputVariants.filter((_, i) => i !== index));

  const handleUpdate = async () => {
    if (!selectedId) return;

    const payload = {
      kode: form.kode,
      nama: form.nama,
      hargaJual: Number(form.hargaJual),
      hargaBeli: Number(form.hargaBeli),
      variants: inputVariants.filter(v => v.warna !== "").map(v => ({
        id: v.id, // Sertakan id kalau ada (untuk update varian existing)
        warna: v.warna,
        stok: Number(v.stok),
      })),
    };

    try {
      await fetch(`/api/barang/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Produk & Varian berhasil DIUPDATE!");
      handleRefresh();
    } catch (err) {
      alert("Gagal update produk");
    }
  };

  // FUNGSI KHUSUS SIMPAN BARU (Selalu membuat ID baru di database)
  const handleSaveNew = async () => {
    if (!form.kode || !form.nama) {
      alert("Kode dan Nama Produk wajib diisi!");
      return;
    }

    const payload = {
      kode: form.kode,
      nama: form.nama,
      hargaJual: Number(form.hargaJual),
      hargaBeli: Number(form.hargaBeli),
      variants: inputVariants.filter(v => v.warna !== "").map(v => ({
        warna: v.warna,
        stok: Number(v.stok),
      })),
    };

    try {
      await fetch("/api/barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Produk Baru & Varian Berhasil Disimpan!");
      handleRefresh();
    } catch (err) {
      alert("Gagal simpan produk baru");
    }
  };

  const handleEdit = (barang: Barang) => {
    setSelectedId(barang.id);
    setForm({
      kode: barang.kode,
      nama: barang.nama,
      hargaJual: barang.hargaJual.toString(),
      hargaBeli: barang.hargaBeli.toString(),
    });
    // Load varian dari database ke state input
    setInputVariants(barang.variants.length > 0 ? barang.variants : [{ warna: "", stok: 0 }]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try {
      await fetch(`/api/barang/${id}`, { method: "DELETE" });
      alert("Produk dihapus!");
      fetchBarang();
    } catch (err) {
      alert("Gagal hapus produk");
    }
  };

  const handleRefresh = () => {
    fetchBarang();
    setForm({ kode: "", nama: "", hargaJual: "", hargaBeli: "" });
    setInputVariants([{ warna: "", stok: 0 }]);
    setSelectedId(null);
  };

  // Filter pencarian (client-side)
  const filteredBarang = barangList.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchNama.toLowerCase()) &&
      b.kode.toLowerCase().includes(searchKode.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#8ba6ff] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Data Barang / Produk</h1>
          <div>
            <Link href="/">
          <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-2 rounded text-sm">HOME</button>
          </Link>
          </div>
          <div className="text-white text-lg">
            JUMLAH PRODUK : <span className="font-bold">{jumlahProduk}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Kiri */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center border-b pb-2">
              Form Kode Barang
            </h2>

            <form onSubmit={(e) => { e.preventDefault(); selectedId ? handleUpdate() : handleSaveNew(); }} className="space-y-4">
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
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      name="warna"
                      value={v.warna}
                      onChange={(e) => handleVariantChange(index, 'warna', e.target.value)}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      placeholder="Warna (misal: Mahogani)"
                    />
                    <input
                      name="stok"
                      type="number"
                      value={v.stok}
                      onChange={(e) => handleVariantChange(index, 'stok', Number(e.target.value))}
                      className="w-32 border rounded px-3 py-2 text-sm"
                      placeholder="Stok"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantField(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      -
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

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 rounded"
                >
                  {selectedId ? "UPDATE" : "SIMPAN"}
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 rounded"
                >
                  REFRESH
                </button>
              </div>

              {selectedId && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      kode: "",
                      nama: "",
                      hargaJual: "",
                      hargaBeli: "",
                    });
                    setInputVariants([{ warna: "", stok: 0 }]);
                    setSelectedId(null);
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded mt-2"
                >
                  Batal Edit
                </button>
              )}
            </form>
          </div>

          {/* Tabel Kanan */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Daftar Produk</h2>

            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-white">
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
                      Belum ada data produk
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
                                {v.warna}: <strong>{v.stok}</strong> {v.stok === 0 ? "(Habis)" : ""}
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
        </div>
      </div>
    </div>
  );
}