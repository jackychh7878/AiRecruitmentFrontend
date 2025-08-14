import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Navigation } from "@/components/layout/navigation"
import { Toaster } from "@/components/ui/toaster"
import { ConfigProvider } from "@/components/config-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Catomind - AI-Powered Talent Management",
  description: "Headhunting management system with AI-powered candidate matching and semantic search",
  generator: "v0.dev",
  icons: {
    icon: "/images/catomind-icon.png",
    shortcut: "/images/catomind-icon.png",
    apple: "/images/catomind-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>
        <ConfigProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Toaster />
        </ConfigProvider>
      </body>
    </html>
  )
}
