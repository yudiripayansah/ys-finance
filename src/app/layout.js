import './globals.css'
import LayoutClient from './layoutClient'

export const metadata = {
  title: 'YS Finance',
  description: 'Aplikasi Keuangan Pribadi by YS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YS Finance',
  },
  themeColor: '#2563eb',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}
