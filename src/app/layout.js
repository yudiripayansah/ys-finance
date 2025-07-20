import './globals.css'
import LayoutClient from './layoutClient'

export const metadata = {
  title: 'YS Finance',
  description: 'Simple way to track your finance diary',
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
