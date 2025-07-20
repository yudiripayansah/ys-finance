"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  startAfter,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const PAGE_SIZE = 10;

export default function KategoriPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [pageStack, setPageStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("income");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] = useState("income");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = async (direction = "initial") => {
    if (!user) return;

    let q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
      orderBy("name"),
      limit(PAGE_SIZE)
    );

    if (searchTerm.trim()) {
      q = query(
        collection(db, "categories"),
        where("userId", "==", user.uid),
        orderBy("name"),
        // Filter will be client-side for search term
        limit(100)
      );
    }

    if (direction === "next" && lastDoc) {
      q = query(q, startAfter(lastDoc));
    } else if (direction === "prev" && pageStack.length > 1) {
      const prev = pageStack[pageStack.length - 2];
      q = query(q, startAfter(prev));
    }

    const snapshot = await getDocs(q);
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    // Filter by search on client
    const filtered = searchTerm
      ? data.filter((cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : data;

    setCategories(filtered);
    setHasNext(filtered.length === PAGE_SIZE);
    setHasPrev(pageStack.length > 1);
    if (filtered.length > 0) {
      setFirstDoc(filtered[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      if (direction === "next") {
        setPageStack([...pageStack, snapshot.docs[0]]);
      } else if (direction === "prev") {
        setPageStack(pageStack.slice(0, -1));
      } else if (direction === "initial") {
        setPageStack([snapshot.docs[0]]);
      }
    }
  };

  useEffect(() => {
    fetchCategories("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchTerm]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return setError("Nama tidak boleh kosong.");
    if (!user) return setError("Belum login.");

    setIsLoading(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: newCategoryName.trim(),
        type: newCategoryType,
        userId: user.uid,
      });
      setNewCategoryName("");
      setNewCategoryType("income");
      fetchCategories("initial");
    } catch (err) {
      console.error("Gagal tambah kategori", err);
      setError("Gagal menambah kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      fetchCategories("initial");
    } catch (err) {
      console.error("Gagal hapus", err);
      setError("Gagal menghapus kategori.");
    }
  };

  const handleEdit = (cat) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryType(cat.type);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryType("income");
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim()) return setError("Nama tidak boleh kosong.");
    try {
      await updateDoc(doc(db, "categories", editingCategoryId), {
        name: editCategoryName.trim(),
        type: editCategoryType,
      });
      handleCancelEdit();
      fetchCategories("initial");
    } catch (err) {
      console.error("Gagal update", err);
      setError("Gagal mengupdate kategori.");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Kelola Kategori
      </h1>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input
            type="text"
            placeholder="Nama kategori"
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isLoading}
          />
          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
            className="p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
          >
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Tambah"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari kategori..."
          className="w-full p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex justify-between items-center p-[20px] bg-gray-100 dark:bg-gray-700 rounded">
            {editingCategoryId === category.id ? (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <input
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={editCategoryType}
                  onChange={(e) => setEditCategoryType(e.target.value)}
                  className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
                <button onClick={handleUpdateCategory} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Simpan</button>
                <button onClick={handleCancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">Batal</button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mb-[5px]">{category.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-[5px] ${
                    category.type === "income"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(category)} className="text-white py-[5px] px-[10px] rounded-[5px] bg-blue-600 hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="text-white py-[5px] px-[10px] rounded-[5px] bg-red-800 hover:bg-red-900 text-sm">Hapus</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          disabled={!hasPrev}
          onClick={() => fetchCategories("prev")}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <button
          disabled={!hasNext}
          onClick={() => fetchCategories("next")}
          className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
