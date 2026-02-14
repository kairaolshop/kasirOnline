"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { searchProduk, ProdukSuggestion } from "@/lib/productUtils";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {toast} from "sonner"

import Link from "next/link";
import { Trash2 } from "lucide-react";

interface Marketplace {
  id: number;
  namaToko: string;
}

interface KeranjangItem {
  kodePesanan: string;
  kodeBarang: string;
  namaBarang: string;
  warna: string;
  jumlah: number;
  hargaJual: number;
  hargaBeli: number;
  subtotal: number;
  totalBeli: number;
  totalAdmin: number;
  totalZakat: number;
  labaBersih: number;
  marketplace: string;
  varianId: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // ==================== STATE ====================
  const [isMounted, setIsMounted] = useState(false);
  const [searchKodePesanan, setSearchKodePesanan] = useState("");

  // Form & Data
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [marketplace, setMarketplace] = useState("");
  const [kodePesanan, setKodePesanan] = useState("");
  const [namaProduk, setNamaProduk] = useState("");
  const [kodeProduk, setKodeProduk] = useState("");
  const [warna, setWarna] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [jumlahTerjual, setJumlahTerjual] = useState("");
  const [kodeError, setKodeError] = useState<string | null>(null);
  const [isCheckingKode, setIsCheckingKode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>("");

  // Keranjang & Tabel
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [suggestions, setSuggestions] = useState<ProdukSuggestion[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<ProdukSuggestion | null>(null);
  const [penjualanHarian, setPenjualanHarian] = useState<any[]>([]);

  // Tanggal
  const [tanggalInput, setTanggalInput] = useState<string>("");

  // ==================== USEEFFECT ===================
  
  useEffect(() => {
    setIsMounted(true);

    const savedDate = localStorage.getItem("lastTransactionDate");
    setTanggalInput(savedDate || new Date().toISOString().split("T")[0]);

    const cached = localStorage.getItem("cachedPenjualanHarian");
    if (cached) {
      try {
        setPenjualanHarian(JSON.parse(cached));
      } catch (e) {
        console.error("Gagal parse cache penjualan");
      }
    }
  }, []);

  // Simpan tanggal ke localStorage
  useEffect(() => {
    if (isMounted && tanggalInput) {
      localStorage.setItem("lastTransactionDate", tanggalInput);
    }
  }, [tanggalInput, isMounted]);

  // Simpan cache penjualan harian
  useEffect(() => {
    if (isMounted && penjualanHarian.length > 0) {
      localStorage.setItem("cachedPenjualanHarian", JSON.stringify(penjualanHarian));
    }
  }, [penjualanHarian, isMounted]);

  // Fetch marketplace
  useEffect(() => {
    fetch("/api/marketplace")
      .then((res) => res.json())
      .then(setMarketplaces)
      .catch(console.error);
  }, []);

  // Autocomplete produk
  useEffect(() => {
    if (namaProduk.length >= 2) {
      searchProduk(namaProduk).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [namaProduk]);

  
  useEffect(() => {
    if (!isMounted || !tanggalInput) return;

    const fetchPenjualan = async () => {
      try {
        const url = `/api/penjualan?search=${searchKodePesanan}&tanggal=${tanggalInput}&_=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();
        setPenjualanHarian(data || []);
      } catch (err) {
        console.error("Gagal load data harian", err);
        setPenjualanHarian([]);
      }
    }

    fetchPenjualan();
  }, [searchKodePesanan, isMounted]);

  // ==================== COMPUTED VALUES ====================
  const { terjualShopee, terjualTiktok } = useMemo(() => {
    const shopee = new Set(
      penjualanHarian
        .filter((item) => item.marketplace?.toLowerCase() === "shopee")
        .map((item) => item.kodePesanan)
    ).size;

    const tiktok = new Set(
      penjualanHarian
        .filter((item) => item.marketplace?.toLowerCase() === "tiktok")
        .map((item) => item.kodePesanan)
    ).size;

    return { terjualShopee: shopee, terjualTiktok: tiktok };
  }, [penjualanHarian]);

  // ==================== HANDLERS ====================
  const pilihProduk = useCallback((produk: ProdukSuggestion) => {
    setSelectedProduk(produk);
    setNamaProduk(produk.nama);
    setKodeProduk(produk.kode);
    setHargaJual(produk.hargaJual.toString());
    setHargaBeli(produk.hargaBeli.toString());
    setWarna(produk.variants?.[0]?.warna || "");
    setSuggestions([]);
  }, []);

  const tambahKeKeranjang = async () => {
    if (!kodePesanan || !namaProduk || !kodeProduk || !jumlahTerjual || !marketplace) {
      toast.warning("Lengkapi semua field + pilih marketplace!");
      return;
    }
    const jumlahNum = Number(jumlahTerjual);
  if (jumlahNum <= 0) {
    toast.warning("Jumlah terjual harus lebih dari 0!");
    return;
  }

  const varianTerpilih = selectedProduk?.variants?.find(v => v.warna === warna);

  if (!varianTerpilih) {
    toast.error("Varian/warna belum dipilih atau tidak ditemukan!");
    return;
  }

  if (varianTerpilih.stok < jumlahNum) {
    toast.error(
      `Stok varian "${varianTerpilih.warna}" hanya tersisa ${varianTerpilih.stok} pcs!\n` +
      `Kamu meminta ${jumlahNum} pcs. Kurangi jumlah atau pilih varian lain.`
    );
    return;
  }

    const hargaJualNum = Number(hargaJual) || 0;
    const hargaBeliNum = Number(hargaBeli) || 0;

    // Hitung laba dengan harga beli real
    const { totalAdmin, totalZakat, labaBersih } = await calculateLaba(
      hargaJualNum,
      hargaBeliNum, // Pakai harga beli dari state/DB
      jumlahNum,
      marketplace
    );

    const itemBaru: KeranjangItem = {
      kodePesanan,
      kodeBarang: kodeProduk,
      namaBarang: namaProduk,
      warna,
      jumlah: jumlahNum,
      hargaJual: hargaJualNum,
      hargaBeli: hargaBeliNum,
      subtotal: jumlahNum * hargaJualNum,
      totalBeli: jumlahNum * hargaBeliNum,
      totalAdmin,
      totalZakat,
      labaBersih,
      marketplace,
      varianId: selectedProduk?.variants.find(v => v.warna === warna)?.id || 0,
    };

    setKeranjang([...keranjang, itemBaru]);

     setNamaProduk("");
    setKodeProduk("");
    setWarna("");
    setHargaJual("");
    setHargaBeli("");
    setJumlahTerjual("");
    setSelectedProduk(null);
    setSuggestions([]);
  };

  const calculateLaba = async (
    hargaJualSatuan: number,
    hargaBeliSatuan: number = 0, // kalau ada input harga beli nanti
    jumlah: number,
    marketplaceNama: string
  ) => {
    // Ambil semua biaya admin aktif untuk marketplace ini
    const res = await fetch(`/api/adminfee?marketplace=${encodeURIComponent(marketplaceNama)}`);
    const adminFees = await res.json(); // asumsi return [{tipeNominal: '%', nominal: 8.25}, ...]

    let totalAdminPerUnit = 0;

    adminFees.forEach((fee: { tipeNominal: string; nominal: number }) => {
      if (fee.tipeNominal === "%") {
        totalAdminPerUnit += hargaJualSatuan * (fee.nominal / 100);
      } else if (fee.tipeNominal === "Rp") {
        totalAdminPerUnit += fee.nominal;
      }
    });

    const labaKotorPerUnit = hargaJualSatuan - hargaBeliSatuan - totalAdminPerUnit;
    const zakatPerUnit = labaKotorPerUnit > 0 ? labaKotorPerUnit * 0.025 : 0;
    const labaBersihPerUnit = labaKotorPerUnit - zakatPerUnit;

    return {
      totalAdmin: Math.round(totalAdminPerUnit * jumlah),
      totalZakat: Math.round(zakatPerUnit * jumlah),
      labaBersih: Math.round(labaBersihPerUnit * jumlah),
    };
  };

  

  const handleSimpan = async () => {
    if (keranjang.length === 0) {
      alert("Keranjang kosong!");
      return;
    }
    setIsLoading(true);
    setLoadingAction("Menyimpan transaksi...");

    try {
      const payload = {
        kodePesanan,
        marketplace,
        tanggalInput,
        items: keranjang.map((item) => ({
          varianId: item.varianId,
          jumlah: item.jumlah,
          hargaJual: item.hargaJual,
          hargaBeli: item.hargaBeli,
          totalAdmin: item.totalAdmin,
          totalZakat: item.totalZakat,
          labaBersih: item.labaBersih,
        })),
      };

      const res = await fetch("/api/penjualan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Gagal simpan");

      // Reset form
      setKeranjang([]);
      setMarketplace("");
      setKodePesanan("");
      const resHarian = await fetch(`/api/penjualan`);
      const data = await resHarian.json();
      setPenjualanHarian(data);

      toast.success("Data berhasil disimpan!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handleDelete = async (id: number) => {
  if (!confirm(`Hapus transaksi ini? Stok akan dikembalikan.`)) return;
    setIsLoading(true);
    setLoadingAction("Menghapus transaksi...");
  try {
    const res = await fetch(`/api/penjualan?id=${id}`, { method: 'DELETE' });
    
    if (res.ok) {
      const resHarian = await fetch('/api/penjualan');
      setPenjualanHarian(await resHarian.json());
      toast.success("Transaksi berhasil dihapus.");
    } else {
      const errorData = await res.json();
      toast.error(`Gagal hapus: ${errorData.error}`);
    }
  } catch (error) {
    alert("Terjadi kesalahan sistem.");
  }finally {
    setIsLoading(false);
    setLoadingAction("");
  }
  };

  const handleReset = async () => {
  if (!confirm('Yakin ingin reset database penjualan? Semua data akan hilang!')) return;
    setIsLoading(true);
    setLoadingAction("Mereset database...");
  try {
    const res = await fetch('/api/penjualan/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Reset gagal');
    setPenjualanHarian([]);
    setKeranjang([]);
    localStorage.removeItem("cachedPenjualanHarian");
    const resHarian = await fetch('/api/penjualan');
    const freshData = await resHarian.json();
    setPenjualanHarian(freshData);

    toast.success('Reset berhasil! Data penjualan sudah dikosongkan.');
  } catch (error) {
    console.error('Reset error:', error);
    toast.error('Gagal reset database. Coba lagi atau cek console.');
  }finally {
    setIsLoading(false);
    setLoadingAction("");
  }
  };

  const simpanBelumBayar = async () => {
  if (keranjang.length === 0) {
    toast.warning("Keranjang masih kosong!");
    return;
  }
  setIsLoading(true);
  setLoadingAction("Menyimpan ke Belum Bayar...");

  try {
    const res = await fetch("/api/belumbayar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: keranjang }), // Kirim array keranjang
    });

    if (res.ok) {
      toast.success("Berhasil simpan ke status Belum Bayar! Stok telah dikurangi.");
      // Bersihkan form dan keranjang setelah berhasil
      setKeranjang([]);
      setMarketplace("");
      setKodePesanan("");
    } else {
      const errorData = await res.json();
      alert(`Gagal simpan: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Error simpan belum bayar:", error);
    toast.error("Terjadi kesalahan sistem saat menyimpan.");
  }finally {
    setIsLoading(false);
    setLoadingAction("");
  }
  };


const rekapHarian = async () => {
  const hariIni = new Date().toLocaleDateString("id-ID");
  if (!confirm(`Rekap & pindah penjualan hari ini (${hariIni}) ke Rekap Harian? Data harian akan direset.`)) return;
  setIsLoading(true);
  setLoadingAction("Melakukan rekap harian...");
  try {
    const res = await fetch("/api/penjualan/rekap-harian", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal: new Date().toISOString().split("T")[0] }),
    });

    if (res.ok) {
      toast.success("Rekap harian berhasil!");
      localStorage.removeItem("cachedPenjualanHarian");
      
      // 3. Opsional: Update tanggal terakhir rekap jika diperlukan
      // localStorage.setItem("lastTransactionDate", new Date().toISOString().split("T")[0]);
      
    } else {
      const err = await res.json();
      toast.error("Gagal rekap: " + (err.error || err.message));
    }
  } catch (err) {
    alert("Terjadi kesalahan koneksi ke server");
    console.error(err);
  } finally {
    setIsLoading(false);
    setLoadingAction("");
  }
};

  const getColormarket = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("shopee")) return "text-orange-500 font-bold";
    if (n.includes("tiktok")) return "text-green-500 font-bold";
    return "";
  };

  const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};
// Fungsi cek ke API
const checkKodeDuplikat = async (kode: string) => {
  if (!kode.trim()) return;

  setIsCheckingKode(true);

  try {
    const res = await fetch(`/api/cek-kode-belumbayar?kode=${encodeURIComponent(kode.trim())}`);
    const data = await res.json();

    if (data.exists) {
      toast.error(
        `Kode Pesanan Duplikat`,
        {
          description: `Kode "${kode.trim()}" sudah terdaftar di Belum Bayar.`,
          action: {
            label: 'Lihat Detail',
            onClick: () => window.location.href = '/belumbayar',
          },
          duration: 8000, // lebih lama biar dibaca
        }
      );
    }
  } catch (err) {
    toast.error('Gagal memeriksa kode pesanan');
  } finally {
    setIsCheckingKode(false);
  }
};
const debouncedCheck = debounce(checkKodeDuplikat, 500);

useEffect(() => {
  debouncedCheck(kodePesanan);
}, [kodePesanan]);

useEffect(() => {
    if (!session && isMounted) {
      router.replace("/login");
    }
  }, [session, isMounted, router]);
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-4 font-sans">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-800">Kasir - Transaksi Harian</h1>
          <p className="text-lg text-red-500 font-bold">
          {new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date()).replace(/\//g, "-")}
        </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          <input
            type="date"
            value={tanggalInput}
            onChange={(e) => setTanggalInput(e.target.value)}
            className="border rounded px-3 py-2 text-sm"/>
            <Link href="/databarang">
            <button className=" cursor-pointer bg-black text-white px-3 py-1.5 rounded text-sm">
              Data Barang
            </button>
            </Link>
            <Link href="/biayaadmin"> 
            <button className="bg-yellow-400 px-3 py-1.5 rounded text-sm cursor-pointer">Setting Admin</button>
            </Link> 
            <button
            onClick={rekapHarian}
            className=" cursor-pointer bg-red-600 text-white px-3 py-1.5 rounded text-sm">Rekap harian</button>
            <Link href="/rekapharian">
            <button className="cursor-pointer bg-purple-600 text-white px-3 py-1.5 rounded text-sm">Open Transaksi</button>
            </Link>
            <button
            className="cursor-pointer bg-red-100 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-red-200"
              onClick={() => signOut ({callbackUrl: "/login"})}>logout              
            </button>
          </div>
        </div>

      {/* Filter atas */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm mb-1">Marketplace</label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Pilih Marketplace</option>
            {marketplaces.map((m) => (
              <option key={m.id} value={m.namaToko}>
                {m.namaToko}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm mb-1">Cari Kode</label>
          <input 
          value={searchKodePesanan}
          onChange={(e) => setSearchKodePesanan(e.target.value)}
          type="text" className="w-full border rounded px-3 py-2 text-sm" placeholder="Kode pesanan..." />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link href ="penghasilan">
          <button className="cursor-pointer bg-yellow-400 px-4 py-2 rounded text-sm">Penghasilan</button>
          </Link>
          <Link href="/belumbayar">
          <button className="cursor-pointer bg-green-400 px-4 py-2 rounded text-sm">Belum Bayar</button></Link>
          <button 
          onClick={handleReset}
          className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded text-sm">RESET</button>
        </div>
      </div>

      {/* Grid utama: Form kiri + Tabel tengah */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:h-[calc(80vh-300px)]">
        {/* Form kiri */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Kode Pesanan</label>
          <input
            type="text"
            placeholder="Masukkan kode pesanan"
            value={kodePesanan}
            onChange={(e) => {
              setKodePesanan(e.target.value);
            }}
            className={`w-full border rounded px-4 py-2.5 text-sm transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
              ${isCheckingKode ? "border-blue-400" : "border-gray-300"}`}
          />
          {isCheckingKode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
        <div className="flex gap-2 relative">
        <input
          type="text"
          placeholder="Nama Produk"
          value={namaProduk}
          onChange={(e) => setNamaProduk(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
          autoComplete="off"
        />

        {/* Suggestion dropdown */}
        {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
          {/* Deduplicate berdasarkan nama + kode */}
          {(() => {
            const seen = new Map<string, ProdukSuggestion>();
            const uniqueSuggestions = suggestions.filter((prod) => {
              const key = `${prod.nama}|${prod.kode}`;
              if (seen.has(key)) return false;
              seen.set(key, prod);
              return true;
            });

      return uniqueSuggestions.map((prod) => (
        <li
          key={`${prod.nama}|${prod.kode}`}  // key unik berdasarkan nama+kode
          onClick={() => pilihProduk(prod)}
          className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
        >
          <div className="font-medium">{prod.nama}</div>
          <div className="text-xs text-gray-600">
            {prod.kode} • Rp {prod.hargaJual.toLocaleString("id-ID")}
          </div>
             </li>
                ));
              })()}
            </ul>
          )}
            <button className="bg-yellow-400 px-4 py-2 rounded text-sm whitespace-nowrap flex-shrink-0">
              Cari
            </button>
          </div>

        <input
          type="text"
          placeholder="Kode Produk"
          value={kodeProduk}
          readOnly // otomatis terisi
          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
        />

        {/* Warna / Varian - Dropdown kalau ada lebih dari 1 varian */}
        <div>
            <label className="block text-sm mb-1">Warna / Varian</label>
            {selectedProduk && Array.isArray(selectedProduk.variants) && selectedProduk.variants.length > 0 ? (
              <select
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Pilih Warna / Varian</option>
                {selectedProduk.variants.map((v) => (
                  <option
                  key={v.id || v.warna}
                  value={v.warna}
                  disabled={v.stok <= 0}
                >
                  {`${selectedProduk.kode}•${v.warna}•${v.stok <= 0 ? "(Stok Habis)" : `(Stok: ${v.stok})`}`}
                </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Warna (opsional)"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </div>

        <input
          type="number"
          placeholder="Harga jual"
          value={hargaJual}
          readOnly // otomatis dari DB
          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
        />
        <input
          type="number"
          placeholder="Harga Beli"
          value={hargaBeli}
          readOnly // otomatis dari DB
          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
        />
        <input
          type="number"
          placeholder="Terjual"
          value={jumlahTerjual}
          onChange={(e) => setJumlahTerjual(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={tambahKeKeranjang}
          disabled={
            isLoading ||
            !selectedProduk ||
            !warna ||
            Number(jumlahTerjual) <= 0 ||
            !marketplace ||
            !kodePesanan.trim() ||
            (selectedProduk?.variants?.find(v => v.warna === warna)?.stok || 0) < 
              (Number(jumlahTerjual) || 1)
          }
          className={`w-full py-2.5 rounded font-medium text-sm transition-all duration-200
            ${
              (isLoading ||
              !selectedProduk ||
              !warna ||
              Number(jumlahTerjual) <= 0 ||
              !marketplace ||
              !kodePesanan.trim() ||
              (selectedProduk?.variants?.find(v => v.warna === warna)?.stok || 0) < 
                (Number(jumlahTerjual) || 1)
              )
                ? "bg-yellow-300 opacity-60 cursor-not-allowed text-gray-700"
                : "bg-yellow-400 hover:bg-yellow-500 cursor-pointer text-black"
            }`}
        >
          {isLoading ? "Memproses..." : "Add Cart"}
        </button>
          <button 
          onClick={handleSimpan}
          disabled={isLoading}
          className={`cursor-pointer bg-cyan-400 w-full py-2 rounded text-sm
              ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (loadingAction || "Menyimpan...") : "SIMPAN"}
          </button>

          <button 
              onClick={simpanBelumBayar}
              disabled={isLoading}
              className={`cursor-pointer bg-green-500 w-full py-2.5 rounded font-medium text-sm
                ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (loadingAction || "Menyimpan...") : "Simpan belum bayar"}
            </button>          
        </div>

        {/* Tabel Penjualan Harian */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-xs md:text-sm sticky-header">
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Kode Pesanan</th>
                <th className="p-2 text-left">Kode Barang</th>
                <th className="p-2 text-left">MP</th>
                <th className="p-2 text-left">Nama Barang</th>
                <th className="p-2 text-left">Warna</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Total Jual</th>
                <th className="p-2 text-right">Total Beli</th>
                <th className="p-2 text-right">Total Admin</th>
                <th className="p-2 text-right">Zakat</th>
                <th className="p-2 text-right">Laba</th>
                <th className="p-2 text-right">action</th>
              </tr>
            </thead>
            <tbody>
              {penjualanHarian.length === 0 ? (
                <tr className="text-center text-gray-500 py-4">
                  <td colSpan={13} className="p-6">
                      {searchKodePesanan.trim() 
                        ? `Tidak ditemukan transaksi dengan kode "${searchKodePesanan}"`
                        : "Belum ada data penjualan hari ini."}
                    </td>
                </tr>
              ) : (
                penjualanHarian.map((transaksi: any, idx: number) => {
                  const jumlahTotal = transaksi.items.reduce((sum: number, it: any) => sum + it.jumlah, 0);
                  const hargaJualTotal = transaksi.items.reduce((sum: number, it: any) => sum + (it.hargaJual * it.jumlah), 0);
                  const hargaBeliTotal = transaksi.items.reduce((sum: number, it: any) => sum + (it.hargaBeli * it.jumlah), 0);
                  const totalAdminTotal = transaksi.items.reduce((sum: number, it: any) => sum + it.totalAdmin, 0);
                  const zakatTotal = transaksi.items.reduce((sum: number, it: any) => sum + (it.zakat || 0), 0);
                  const labaTotal = transaksi.items.reduce((sum: number, it: any) => sum + it.laba, 0);

                  return (
                    <tr key={transaksi.id} className="border-b hover:bg-gray-50 items-start">
                      <td className="p-2 align-top">{idx + 1}</td>
                      <td className="p-2 align-top font-bold text-blue-700">{transaksi.kodePesanan}</td>
                      <td className="p-2 align-top font-mono text-[10px]">
                        {transaksi.items.map((it: any, i: number) => (
                          <div key={i} className="border-b border-gray-100 text-sm last:border-0 truncate max-w-[150px]">
                            {it.varian?.barang?.kode || "N/A"}
                          </div>
                        ))}
                      </td>
                      <td className={`p-2 ${getColormarket(transaksi.marketplace)}`}>{transaksi.marketplace}</td>
                      <td className="p-2 align-top text-xs">
                        {transaksi.items.map((it: any, i: number) => (
                          <div key={i} className="border-b border-gray-50 last:border-0 truncate max-w-[150px]">
                            {it.varian?.barang?.nama || "N/A"}
                          </div>
                        ))}
                      </td>
                      <td className="p-2 align-top text-xs text-center">
                        {transaksi.items.map((it: any, i: number) => (
                          <div key={i} className="border-b border-gray-50 last:border-0">
                            {it.varian?.warna || "-"}
                          </div>
                        ))}
                      </td>
                      <td className="p-2 text-center">{jumlahTotal}</td>
                      <td className="p-2 text-right">Rp {hargaJualTotal.toLocaleString("id-ID")}</td>
                      <td className="p-2 text-right">Rp {hargaBeliTotal.toLocaleString("id-ID")}</td>
                      <td className="p-2 text-right text-red-600">Rp {totalAdminTotal.toLocaleString("id-ID")}</td>
                      <td className="p-2 text-right">Rp {zakatTotal.toLocaleString("id-ID")}</td>
                      <td className="p-2 text-right font-bold text-green-700">Rp {labaTotal.toLocaleString("id-ID")}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDelete(transaksi.id)}
                          className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded transition-colors"
                          title="Hapus & Kembalikan Stok"
                        >
                          <Trash2 size={16}></Trash2>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Keranjang Pembeli */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-bold mb-3">Keranjang Pembeli</h3>
        {keranjang.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Keranjang masih kosong...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Kode Barang</th>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-left">Warna</th>
                  <th className="p-2 text-center">Qty</th>
                  {/*<th className="p-2 text-right">Harga Jual</th>*/}
                  {/*<th className="p-2 text-right">Harga Beli</th>*/}
                  <th className="p-2 text-right">Total Jual</th>
                  <th className="p-2 text-right">Total Beli</th>
                  <th className="p-2 text-right">Admin</th>
                  <th className="p-2 text-right">Zakat</th>
                  <th className="p-2 text-right">Laba</th>
                </tr>
              </thead>
              <tbody>
                {keranjang.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{item.kodeBarang}</td>
                    <td className="p-2">{item.namaBarang}</td>
                    <td className="p-2">{item.warna || "-"}</td>
                    <td className="p-2 text-center">{item.jumlah}</td>
                    {/*<td className="p-2 text-right">Rp {item.hargaJual.toLocaleString("id-ID")}</td>*/}
                    {/*<td className="p-2 text-right">Rp {item.hargaBeli.toLocaleString("id-ID")}</td>*/}
                    <td className="p-2 text-right">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                    <td className="p-2 text-right">Rp {item.totalBeli.toLocaleString("id-ID")}</td>
                    <td className="p-2 text-right">Rp {item.totalAdmin.toLocaleString("id-ID")}</td>
                    <td className="p-2 text-right">Rp {item.totalZakat.toLocaleString("id-ID")}</td>
                    <td className="p-2 text-right font-medium">Rp {item.labaBersih.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ringkasan bawah */}
      <div className="mt-6 bg-white rounded-lg shadow p-4 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 text-white w-8 h-8 flex items-center justify-center rounded">S</div>
          <span className="font-medium">{terjualShopee} Terjual</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black text-white w-8 h-8 flex items-center justify-center rounded">♪</div>
          <span className="font-medium">{terjualTiktok} Terjual</span>
        </div>
        <button className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
          🖨️ Print PDF
        </button>
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="text-lg font-medium text-gray-800">
              {loadingAction || "Sedang memproses..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}