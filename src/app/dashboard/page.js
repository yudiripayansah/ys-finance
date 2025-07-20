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
  doc,
  getDoc,
} from "firebase/firestore";
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

const COLORS = ["#16a34a", "#dc2626", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9"];
export default function DashboardPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);

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

    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
      }
    });

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

  useEffect(() => {
    let income = 0;
    let expense = 0;
    const daily = {};
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.date.seconds * 1000);
      const key = date.toISOString().slice(0, 10);

      if (!daily[key]) {
        daily[key] = { date: key, income: 0, expense: 0 };
      }

      if (tx.type === "income") {
        income += tx.amount;
        daily[key].income += tx.amount;
        incomeByCategory[tx.categoryName] = (incomeByCategory[tx.categoryName] || 0) + tx.amount;
      } else {
        expense += tx.amount;
        daily[key].expense += tx.amount;
        expenseByCategory[tx.categoryName] = (expenseByCategory[tx.categoryName] || 0) + tx.amount;
      }
    });

    setTotalIncome(income);
    setTotalExpense(expense);
    setChartData(Object.values(daily));

    // Format pie chart data
    setIncomeCategoryData(
      Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }))
    );
    setExpenseCategoryData(
      Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
    );
  }, [transactions]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Hallo, {name} <br />
        Dashboard Keuangan Bulan Ini
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Total Pemasukan</h2>
          <p className="text-xl font-bold">Rp{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Total Pengeluaran</h2>
          <p className="text-xl font-bold">Rp{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
          <h2 className="text-sm font-medium">Sisa Saldo</h2>
          <p className="text-xl font-bold">
            Rp{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grafik Bar Harian */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Grafik Transaksi Harian
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(v) => `Rp${v.toLocaleString()}`} />
            <Tooltip formatter={(value) => `Rp${value.toLocaleString()}`} />
            <Bar dataKey="income" fill="#16a34a" name="Income" />
            <Bar dataKey="expense" fill="#dc2626" name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grafik Pie Pemasukan */}
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
              <Tooltip formatter={(value) => `Rp${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Pie Pengeluaran */}
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
              <Tooltip formatter={(value) => `Rp${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
