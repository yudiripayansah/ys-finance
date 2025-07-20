"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export default function TransaksiPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  const formatNumber = (value) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const resetForm = () => {
    setAmount("");
    setType("income");
    setCategoryId("");
    setNote("");
    setDate("");
    setEditingId(null);
    setError("");
  };

  // Ambil kategori
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "categories"),
        where("userId", "==", user.uid),
        orderBy("name", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cats = [];
        snapshot.forEach((doc) => {
          cats.push({ id: doc.id, ...doc.data() });
        });
        setCategories(cats);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Ambil transaksi
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const txs = [];
        snapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(txs);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      setError("Jumlah, kategori, dan tanggal wajib diisi.");
      return;
    }

    setIsLoading(true);

    const category = categories.find((c) => c.id === categoryId);
    const data = {
      amount: parseFloat(amount.replace(/\./g, "")),
      type,
      categoryId,
      categoryName: category?.name || "",
      note,
      date: Timestamp.fromDate(new Date(date)),
      createdAt: Timestamp.now(),
      userId: user.uid,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "transactions", editingId), data);
      } else {
        await addDoc(collection(db, "transactions"), data);
      }
      resetForm();
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
      setError("Gagal menyimpan transaksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
      } catch (err) {
        console.error("Gagal menghapus:", err);
        setError("Gagal menghapus transaksi.");
      }
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx.id);
    setAmount(tx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
    setType(tx.type);
    setCategoryId(tx.categoryId);
    setNote(tx.note);
    setDate(new Date(tx.date.seconds * 1000).toISOString().slice(0, 10));
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchNote = tx.note?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = tx.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchDate =
      (!fromDate || new Date(tx.date.seconds * 1000) >= new Date(fromDate)) &&
      (!toDate || new Date(tx.date.seconds * 1000) <= new Date(toDate));
    return (matchNote || matchCategory) && matchDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const displayedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">Transaksi</h1>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(formatNumber(e.target.value))}
            placeholder="Jumlah"
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md col-span-2 md:col-span-1"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md col-span-2 md:col-span-1"
          >
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md col-span-2 md:col-span-1"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md col-span-2 md:col-span-1"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md col-span-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 col-span-2"
            disabled={isLoading}
          >
            {editingId ? "Update" : "Tambah"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Cari catatan atau kategori..."
          className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md w-full"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
        />
      </div>

      {/* Daftar Transaksi */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Riwayat Transaksi</h2>
        <div className="space-y-4">
          {displayedTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-end bg-gray-50 dark:bg-gray-700 p-4 rounded-md"
            >
              <div>
                <p className="font-semibold">{tx.note}</p>
                <p className="text-sm text-gray-500">{tx.categoryName}</p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.date.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"} Rp
                  {tx.amount.toLocaleString("id-ID")}
                </p>
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={() => handleEdit(tx)}
                    className="text-sm text-white py-[5px] px-[10px] rounded-[5px] bg-blue-600 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-sm text-white py-[5px] px-[10px] rounded-[5px] bg-red-800 hover:bg-red-900"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <p className="text-gray-500">Belum ada transaksi.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
