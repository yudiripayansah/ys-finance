"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#A3D9A5", // soft green
  "#F6A6A6", // soft red/pink
  "#A5C9F6", // soft blue
  "#FFE6A7", // soft yellow
  "#B3E5E0", // soft cyan
  "#D8B4F8", // soft purple
  "#FFD1DC", // soft pink
  "#C2C2FF"  // soft indigo
];

export default function LaporanPage() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);

  const bulan = [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  const tahun = Array.from({ length: 10 }, (_, i) =>
    String(new Date().getFullYear() - i)
  );

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      }));
      setTransactions(data);
    };

    fetchTransactions();
  }, [user]);

  const handleFilter = () => {
    if (selectedMonth === "" || selectedYear === "") return;

    const filteredData = transactions.filter(
      (tx) =>
        tx.date.getMonth() === parseInt(selectedMonth) &&
        tx.date.getFullYear() === parseInt(selectedYear)
    );

    setFiltered(filteredData);
    processChartData(filteredData);
  };

  const processChartData = (data) => {
    let daily = {};
    let incomeByCategory = {};
    let expenseByCategory = {};

    data.forEach((tx) => {
      const key = format(tx.date, "yyyy-MM-dd");

      if (!daily[key]) {
        daily[key] = { date: key, income: 0, expense: 0 };
      }

      if (tx.type === "income") {
        daily[key].income += tx.amount;
        incomeByCategory[tx.categoryName] =
          (incomeByCategory[tx.categoryName] || 0) + tx.amount;
      } else {
        daily[key].expense += tx.amount;
        expenseByCategory[tx.categoryName] =
          (expenseByCategory[tx.categoryName] || 0) + tx.amount;
      }
    });

    setChartData(Object.values(daily));

    setIncomeCategoryData(
      Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }))
    );
    setExpenseCategoryData(
      Object.entries(expenseByCategory).map(([name, value]) => ({
        name,
        value,
      }))
    );
  };

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => acc + tx.amount, 0);

  useEffect(() => {
    handleFilter(); // Auto filter on first render
  }, [transactions]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">Laporan Bulanan</h1>

      {/* Filter */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
          >
            {bulan.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
          >
            {tahun.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md col-span-2"
        >
          Tampilkan
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-800 text-white p-4 rounded shadow">
          <div className="text-sm">Pemasukan</div>
          <div className="text-xl font-bold">
            Rp {totalIncome.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="bg-red-800 text-white p-4 rounded shadow">
          <div className="text-sm">Pengeluaran</div>
          <div className="text-xl font-bold">
            Rp {totalExpense.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="bg-blue-800 text-white p-4 rounded shadow">
          <div className="text-sm">Saldo</div>
          <div className="text-xl font-bold">
            Rp {(totalIncome - totalExpense).toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Grafik Transaksi Harian
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(v) => `Rp${v.toLocaleString()}`} />
            <Tooltip formatter={(v) => `Rp${v.toLocaleString()}`} />
            <Bar dataKey="income" fill="#A3D9A5" name="Pemasukan" />
            <Bar dataKey="expense" fill="#F6A6A6" name="Pengeluaran" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Pemasukan Berdasarkan Kategori
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incomeCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {incomeCategoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `Rp${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Pengeluaran Berdasarkan Kategori
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {expenseCategoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `Rp${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 border border-gray-200 rounded">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Tanggal</th>
              <th className="text-left px-4 py-2">Kategori</th>
              <th className="text-left px-4 py-2">Catatan</th>
              <th className="text-left px-4 py-2">Tipe</th>
              <th className="text-right px-4 py-2">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">
                  Tidak ada data untuk bulan ini.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className={`border-t ${
                    tx.type === "income" ? "bg-green-800" : "bg-red-800"
                  }`}
                >
                  <td className="px-4 py-2">
                    {format(tx.date, "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-2">{tx.categoryName}</td>
                  <td className="px-4 py-2">{tx.note}</td>
                  <td className="px-4 py-2 capitalize">{tx.type}</td>
                  <td className="px-4 py-2 text-right">
                    Rp {tx.amount.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
