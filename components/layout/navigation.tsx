"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, Search, MessageSquare, FileText, Home, Menu, X } from "lucide-react"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Search", href: "/search", icon: Search },
  { name: "AI Assistant", href: "/chatbot", icon: MessageSquare },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/catomind-logo.png"
                  alt="CatoMind - Commit Alpha To Omega"
                  width={180}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      pathname === item.href
                        ? "border-[#068ee1] text-black"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black",
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="text-sm text-gray-500">Welcome back, Admin</div>
          </div>

          <div className="sm:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                    pathname === item.href
                      ? "bg-[#068ee1]/10 border-[#068ee1] text-black"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-black",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
