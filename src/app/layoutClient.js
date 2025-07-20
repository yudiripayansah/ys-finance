'use client'

import { usePathname } from 'next/navigation'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'

export default function LayoutClient({ children }) {
  const pathname = usePathname()
  const showNavbar = pathname !== '/login' && pathname !== '/register'

  return (
    <AuthProvider>
      {showNavbar && <Navbar />}
      <main className={showNavbar ? 'py-4' : ''}>{children}</main>
    </AuthProvider>
  )
}
