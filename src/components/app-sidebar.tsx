"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Settings,
    Users,
    History,
    ShieldAlert,
    Shield,
    LogOut,
    Menu
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Coverage Map",
        href: "/dashboard/coverage",
        icon: Users,
    },
    {
        title: "Activity Log",
        href: "/dashboard/activity",
        icon: History,
    },
    {
        title: "Response Rules",
        href: "/dashboard/rules",
        icon: ShieldAlert,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Admin Console",
        href: "/admin",
        icon: Shield,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary">C</span>
                    </div>
                    Coverage Ninja
                </div>
            </div>

            <div className="flex-1 px-4 py-2">
                <nav className="flex flex-col gap-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4">
                <Separator className="my-4" />
                <div className="flex items-center gap-3 px-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                        <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Akshay Datar</span>
                        <span className="text-xs text-muted-foreground">akd@example.com</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
