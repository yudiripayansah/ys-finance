"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Ambil nama dari Firestore
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
        }
      });
    }
  }, [user]);

  // Update nama di Firestore
  const updateName = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama tidak boleh kosong." });
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name });
      setMessage({ type: "success", text: "Nama berhasil diperbarui." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal memperbarui nama." });
    } finally {
      setIsLoading(false);
    }
  };

  // Update password di Firebase Auth
  const updateUserPassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Isi password lama dan baru." });
      return;
    }

    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setMessage({ type: "success", text: "Password berhasil diperbarui." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Password lama salah atau terlalu lemah." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">Pengaturan Akun</h1>

      {/* Ubah Nama */}
      <div className="mb-8">
        <label className="block font-medium mb-1">Nama</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border dark:bg-gray-800 dark:text-white rounded-md mb-2"
        />
        <button
          onClick={updateName}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Simpan Nama
        </button>
      </div>

      {/* Ubah Password */}
      <div className="mb-8">
        <label className="block font-medium mb-1">Password Saat Ini</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 border dark:bg-gray-800 dark:text-white rounded-md mb-2"
        />
        <label className="block font-medium mb-1">Password Baru</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border dark:bg-gray-800 dark:text-white rounded-md mb-2"
        />
        <button
          onClick={updateUserPassword}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Ganti Password
        </button>
      </div>

      {/* Notifikasi */}
      {message.text && (
        <div
          className={`mt-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
