"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";

interface Marketplace {
  id: number;
  namaToko: string;
  status: boolean;
}

interface AdminFee {
  id: number;
  marketplace: { namaToko: string };
  marketplaceId: number;
  jenisBiaya: string;
  tipeNominal: string;
  nominal: number;
  status: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingAdmin() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const {data: adminFeesData, mutate} = useSWR<AdminFee[]>("api/adminfee", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const adminFees = adminFeesData || [];
  
  const [form, setForm] = useState({
    marketplaceId: "",
    jenisBiaya: "",
    tipeNominal: "%",
    nominal: "",
  });

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async () => {
    try {
      const res = await fetch("/api/marketplace");
      const data = await res.json();
      setMarketplaces(data);
    } catch (err) {
      console.error("Gagal ambil marketplace:", err);
    }
  };

  const fetchAdminFees = async () => {
    try {
      const res = await fetch("/api/adminfee");
      const data = await res.json();
      mutate();
    } catch (err) {
      console.error("Gagal ambil admin fee:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const simpanAdmin = async () => {
    if (!form.marketplaceId || !form.jenisBiaya || !form.nominal) {
      alert("Semua kolom wajib diisi!");
      return;
    }

    try {
      const payload = {
        marketplaceId: Number(form.marketplaceId),
        jenisBiaya: form.jenisBiaya,
        tipeNominal: form.tipeNominal,
        nominal: Number(form.nominal),
      };

      const res = await fetch("/api/adminfee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Jenis Biaya Admin berhasil ditambahkan.");
        mutate();
        clearForm();
      } else {
        toast.error("Gagal menyimpan!");
      }
    } catch (err) {
      alert("Terjadi kesalahan!");
    }
  };

  const updateAdmin = async () => {
    if (!selectedId) {
      alert("Pilih data terlebih dahulu!");
      return;
    }

    try {
      const payload = {
        marketplaceId: Number(form.marketplaceId),
        jenisBiaya: form.jenisBiaya,
        tipeNominal: form.tipeNominal,
        nominal: Number(form.nominal),
      };

      const res = await fetch(`/api/adminfee/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Data berhasil diupdate.");
        mutate();
        clearForm();
      } else {
        toast.error("Gagal update!");
      }
    } catch (err) {
      alert("Terjadi kesalahan!");
    }
  };

  const hapusAdmin = async () => {
    if (!selectedId) {
      toast.warning("Pilih data terlebih dahulu!");
      return;
    }

    if (confirm("Yakin ingin menghapus?")) {
      try {
        const res = await fetch(`/api/adminfee/${selectedId}`, { method: "DELETE" });

        if (res.ok) {
          toast.success("Data berhasil dihapus.");
          mutate();
          clearForm();
        } else {
          toast.error("Gagal hapus!");
        }
      } catch (err) {
        alert("Terjadi kesalahan!");
      }
    }
  };

  const aktifkanAdmin = async () => {
    if (!selectedId) {
      toast.warning("Pilih data terlebih dahulu!");
      return;
    }

    try {
      const res = await fetch(`/api/adminfee/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: true }),
      });

      if (res.ok) {
        toast.success("Data berhasil diaktifkan.");
        mutate();
        clearForm();
      } else {
        toast.error("Gagal mengaktifkan!");
      }
    } catch (err) {
      alert("Terjadi kesalahan!");
    }
  };

  const nonaktifkanAdmin = async () => {
    if (!selectedId) {
      toast.warning("Pilih data terlebih dahulu!");
      return;
    }

    try {
      const res = await fetch(`/api/adminfee/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: false }),
      });

      if (res.ok) {
        toast.success("Data berhasil dinonaktifkan.");
        mutate();
        clearForm();
      } else {
        toast.error("Gagal menonaktifkan!");
      }
    } catch (err) {
      alert("Terjadi kesalahan!");
    }
  };

  const fillForm = (fee: AdminFee) => {
    setSelectedId(fee.id);
    setForm({
      marketplaceId: fee.marketplaceId.toString(),
      jenisBiaya: fee.jenisBiaya,
      tipeNominal: fee.tipeNominal,
      nominal: fee.nominal.toString(),
    });
  };

  const clearForm = () => {
    setForm({ marketplaceId: "", jenisBiaya: "", tipeNominal: "%", nominal: "" });
    setSelectedId(null);
  };

  const formatNominal = (tipe: string, nominal: number) => {
    if (tipe === '%') {
      return `${nominal} %`;
    } else {
      return `Rp ${nominal.toLocaleString("id-ID")}`;
    }
  };

  const getColorMarket = (nama: string) => {
  const n = nama.toLowerCase();
  if(n.includes("shopee")) return " text-orange-500 font-bold"; 
  if(n.includes("tiktok")) return " text-green-500 font-bold";
  return "";
};

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <button className="bg-black hover:bg-black-500 text-white font-bold px-4 py-2 rounded text-sm">
            <Link href="/">HOME</Link>
          </button>
        <h1 className="text-2xl font-bold text-center">Setting Admin</h1>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">No</th>
                <th className="p-2 border">Marketplace</th>
                <th className="p-2 border">Jenis Biaya Admin</th>
                <th className="p-2 border">Nominal</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminFees.map((fee, index) => (
                <tr key={fee.id} className="border bg-black text-white hover:bg-gray-100 hover:text-black cursor-pointer" onClick={() => fillForm(fee)}>
                  <td className="p-2">{index + 1}</td>
                  <td className={`p-2${getColorMarket(fee.marketplace.namaToko)}`}>
                    {fee.marketplace.namaToko}
                  </td>
                  <td className="p-2">{fee.jenisBiaya}</td>
                  <td className="p-2">{formatNominal(fee.tipeNominal, fee.nominal)}</td>
                  <td className={`p-2 font-bold ${fee.status ? "text-green-600" : "text-red-500"}`}>
                    {fee.status ? "Aktif" : "Nonaktif"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Pilih Marketplace</label>
            <select
              name="marketplaceId"
              value={form.marketplaceId}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Pilih Marketplace</option>
              {marketplaces.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.namaToko}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Nilai</label>
            <select
              name="tipeNominal"
              value={form.tipeNominal}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="%">%</option>
              <option value="Rp">Rp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tambah Nama Ad</label>
            <input
              name="jenisBiaya"
              value={form.jenisBiaya}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="Jenis biaya admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Nominal Admin</label>
            <input
              name="nominal"
              value={form.nominal}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="Nominal"
            />
          </div>
        </div>

        {/* Tombol */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={simpanAdmin} className="bg-yellow-300 px-6 py-2 rounded font-medium">
            Simpan
          </button>
          <button onClick={hapusAdmin} className="bg-yellow-300 px-6 py-2 rounded font-medium">
            Delete
          </button>
          <button onClick={updateAdmin} className="bg-yellow-300 px-6 py-2 rounded font-medium">
            Update
          </button>
          <button onClick={aktifkanAdmin} className="bg-green-500 text-white px-6 py-2 rounded font-medium">
            Aktifkan
          </button>
          <button onClick={nonaktifkanAdmin} className="bg-red-500 text-white px-6 py-2 rounded font-medium">
            NonAktifka
          </button>
          
        </div>
      </div>
    </div>
  );
}