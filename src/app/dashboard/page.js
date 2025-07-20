"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [chartData, setChartData] = useState([]);

  // Hitung awal & akhir bulan ini
  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
    };
  };

  useEffect(() => {
    if (!user) return;

    const { start, end } = getMonthRange();

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const txs = [];
      querySnapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  // Proses data transaksi
  useEffect(() => {
    let income = 0;
    let expense = 0;
    const daily = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.date.seconds * 1000);
      const key = date.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!daily[key]) {
        daily[key] = { date: key, income: 0, expense: 0 };
      }

      if (tx.type === "income") {
        income += tx.amount;
        daily[key].income += tx.amount;
      } else {
        expense += tx.amount;
        daily[key].expense += tx.amount;
      }
    });

    setTotalIncome(income);
    setTotalExpense(expense);
    setChartData(Object.values(daily));
  }, [transactions]);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Dashboard Keuangan Bulan Ini
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Total Pemasukan</h2>
          <p className="text-xl font-bold">Rp{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Total Pengeluaran</h2>
          <p className="text-xl font-bold">Rp{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Sisa Saldo</h2>
          <p className="text-xl font-bold">
            Rp{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grafik Harian */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Grafik Transaksi Harian
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(v) => `Rp${v}`} />
            <Tooltip formatter={(value) => `Rp${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#dc2626" name="Expense" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
