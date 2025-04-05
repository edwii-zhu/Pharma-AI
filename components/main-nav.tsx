"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Pill, 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  Settings, 
  Bell 
} from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-16 items-center px-4 border-b">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Pill className="h-6 w-6" />
          <span className="font-bold">APMS</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className={cn(
              "flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors",
              pathname === "/" && "text-primary"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/inventory"
            className={cn(
              "flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors",
              pathname === "/inventory" && "text-primary"
            )}
          >
            <Package className="h-4 w-4" />
            <span>Inventory</span>
          </Link>
          <Link
            href="/prescriptions"
            className={cn(
              "flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors",
              pathname === "/prescriptions" && "text-primary"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Prescriptions</span>
          </Link>
          <Link
            href="/patients"
            className={cn(
              "flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors",
              pathname === "/patients" && "text-primary"
            )}
          >
            <Users className="h-4 w-4" />
            <span>Patients</span>
          </Link>
        </nav>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <button className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
            3
          </span>
        </button>
        <button>
          <Settings className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  )
}