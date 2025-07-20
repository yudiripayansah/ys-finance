import './globals.css'
import LayoutClient from './layoutClient'

export const metadata = {
  title: 'Aplikasi Keuangan',
  description: 'Pencatatan keuangan sederhana dengan Firebase',
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
