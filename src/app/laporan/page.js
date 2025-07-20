'use client'

import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function LaporanPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [filtered, setFiltered] = useState([])
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()))
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))

  const bulan = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' }
  ]

  const tahun = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      )

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }))
      setTransactions(data)
      setFiltered(data)
    }

    fetchTransactions()
  }, [user])

  const handleFilter = () => {
    if (selectedMonth === '' || selectedYear === '') return

    const filteredData = transactions.filter((tx) => {
      return (
        tx.date.getFullYear() === parseInt(selectedYear) &&
        tx.date.getMonth() === parseInt(selectedMonth)
      )
    })

    setFiltered(filteredData)
  }

  const totalIncome = filtered
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0)

  const totalExpense = filtered
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0)

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">Laporan Bulanan</h1>

      {/* Filter Bulan & Tahun */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md px-3 py-2"
          >
            <option value="">Pilih Bulan</option>
            {bulan.map((b, index) => (
              <option key={index} value={b.value}>
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
            className="w-full rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md px-3 py-2"
          >
            <option value="">Pilih Tahun</option>
            {tahun.map((t, index) => (
              <option key={index} value={t}>
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
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-red-800 text-white p-4 rounded shadow">
          <div className="text-sm">Pengeluaran</div>
          <div className="text-xl font-bold">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-blue-800 text-white p-4 rounded shadow">
          <div className="text-sm">Saldo</div>
          <div className="text-xl font-bold">
            Rp {(totalIncome - totalExpense).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Tabel Transaksi */}
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
                <tr key={tx.id} className={`border-t ${
                    tx.type === "income"
                      ? "bg-green-800"
                      : "bg-red-800"
                  }`}>
                  <td className="px-4 py-2">{format(tx.date, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2">{tx.categoryName}</td>
                  <td className="px-4 py-2">{tx.note}</td>
                  <td className="px-4 py-2 capitalize">{tx.type}</td>
                  <td className="px-4 py-2 text-right">
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
