"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GrafikItem {
  tanggal: string;
  marketplace: string;
  totalJualShopee: number;
  totalLabaShopee: number;
  totalJualTikTok: number;
  totalLabaTikTok: number;
}

export default function GrafikPenjualan() {
  const [data, setData] = useState<GrafikItem[]>([]);
  const [mode, setMode] = useState<"Bulan" | "Tahun">("Bulan");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
  const [marketplaceFilter, setMarketplaceFilter] = useState("Keduanya");
  const [marketplaces, setMarketplaces] = useState<string[]>([]);

  useEffect(() => {
    fetchMarketplaces();
    fetchGrafikData();
  }, [mode, tahun, bulan, marketplaceFilter]);

  const fetchMarketplaces = async () => {
    const res = await fetch("/api/marketplace");
    const mps = await res.json();
    setMarketplaces(["Keduanya", ...mps.map((m: any) => m.namaToko)]);
  };

  const fetchGrafikData = async () => {
  const params = new URLSearchParams({
    mode: mode,
    tahun: tahun,
    marketplace: marketplaceFilter,
  });

  if (mode === "Bulan") {
    params.append("bulan", bulan.padStart(2, "0"));
  }

  try {
    const res = await fetch(`/api/grafik?${params.toString()}`);
    const chartData = await res.json();
    setData(chartData);
  } catch (err) {
    console.error("Gagal fetch data:", err);
  }
};

  const formatRupiah = (value: number) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}JT`;
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  const totalJual = useMemo(() => 
  data.reduce((sum, d: any) => sum + (d.totalJualShopee || 0) + (d.totalJualTikTok || 0), 0)
, [data]);

const totalLaba = useMemo(() => 
  data.reduce((sum, d: any) => sum + (d.totalLabaShopee || 0) + (d.totalLabaTikTok || 0), 0)
, [data]);

  return (
    <div className="min-h-screen bg-[#c9d7ff] p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">
          
          <h1 className="text-3xl font-bold text-center">Laporan Grafik Penjualan</h1>
        </div>

        {/* Filter */}
        <div className="p-6 bg-gray-50 flex flex-wrap gap-6 items-end border-b">
          <div>
            <label className="block text-sm font-medium mb-1">Mode Filter</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "Bulan" | "Tahun")}
              className="border rounded-lg px-4 py-2.5 w-40"
            >
              <option value="Bulan">Bulan</option>
              <option value="Tahun">Tahun</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pilih Bulan / Tahun</label>
            <div className="flex gap-2">
              <input
              type="number"
              min="1"
              max="12"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              disabled={mode === "Tahun"}
              className={`border rounded-lg px-4 py-2.5 w-20 ${mode === "Tahun" ? 'bg-gray-200' : ''}`}
            />
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="border rounded-lg px-4 py-2.5 w-24"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Marketplace</label>
            <select
              value={marketplaceFilter}
              onChange={(e) => setMarketplaceFilter(e.target.value)}
              className="border rounded-lg px-4 py-2.5 w-52"
            >
              {marketplaces.map((mp) => (
                <option key={mp} value={mp}>
                  {mp}
                </option>
              ))}
            </select>
          </div>
          <Link href="/penghasilan">
          <button className="bg-red-500 text-white rounded px-4 py-2.5 ">kembali</button>
          </Link>
        </div>
        

        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-6 p-6 bg-white border-b">
          <div className="bg-orange-50 p-5 rounded-xl">
            <p className="text-sm text-orange-600 font-medium">TOTAL PENJUALAN</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {formatRupiah(totalJual)}
            </p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl">
            <p className="text-sm text-green-600 font-medium">TOTAL LABA BERSIH</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatRupiah(totalLaba)}
            </p>
          </div>
        </div>

        {/* Grafik */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-center mb-4">
            Penjualan & Laba Bersih Bulan {bulan}/{tahun}
          </h2>
          <div className="h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 40, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="tanggal"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 12 }} />
                <Tooltip 
                    formatter={(value) => formatRupiah(Number(value ?? 0))} 
                    />
                <Legend />

                {/* Garis Shopee */}
                <Line
                  type="monotone"
                  dataKey="totalJualShopee"
                  stroke="#FF8C00"
                  strokeWidth={3}
                  name="Penjualan Shopee"
                  dot={{ fill: "#FF8C00", r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalLabaShopee"
                  stroke="#FF4500"
                  strokeWidth={2}
                  name="Laba Shopee"
                  dot={{ fill: "#FF4500", r: 4 }}
                  activeDot={{ r: 6 }}
                />

                {/* Garis TikTok */}
                <Line
                  type="monotone"
                  dataKey="totalJualTikTok"
                  stroke="#00BFFF"
                  strokeWidth={3}
                  name="Penjualan TikTok"
                  dot={{ fill: "#00BFFF", r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalLabaTikTok"
                  stroke="black"
                  strokeWidth={2}
                  name="Laba TikTok"
                  dot={{ fill: "black", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}