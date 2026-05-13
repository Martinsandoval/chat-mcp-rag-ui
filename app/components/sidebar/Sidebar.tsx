"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, FileText, MessageSquare, Plug } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

type NavItem = {
    label: string
    href: string
    icon: React.ElementType
    badge?: number
}

type NavSection = {
    label: string
    items: NavItem[]
}

const mainItems: NavItem[] = [
    { label: "Chats", href: "/chats", icon: MessageSquare },
    { label: "Documents", href: "/documents", icon: FileText, badge: 3 },
    { label: "Integrations", href: "/integrations", icon: Plug },
]

const sections: NavSection[] = []

function NavLink({
    item,
    collapsed,
    pathname,
}: {
    item: NavItem
    collapsed: boolean
    pathname: string
}) {
    const isActive = pathname.startsWith(item.href)
    return (
        <Link
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                collapsed ? "justify-center" : "justify-between",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && item.badge && (
                <Badge variant={isActive ? "secondary" : "outline"} className="ml-auto">
                    {item.badge}
                </Badge>
            )}
        </Link>
    )
}

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                "relative flex min-h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="relative shrink-0 border-b bg-[#1A3842]">
                {collapsed ? (
                    <div className="flex h-[72px] items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Aura"
                            className="h-10 w-10 object-cover object-left"
                        />
                    </div>
                ) : (
                    <img
                        src="/logo.png"
                        alt="Aura"
                        className="h-[72px] w-full object-contain object-center"
                    />
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronLeft className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
                {/* Main nav */}
                <nav className="space-y-1">
                    {mainItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            collapsed={collapsed}
                            pathname={pathname}
                        />
                    ))}
                </nav>

                {/* Sectioned nav */}
                {sections.map((section) => (
                    <div key={section.label} className="mt-4">
                        {!collapsed && (
                            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                {section.label}
                            </p>
                        )}
                        {collapsed && <div className="my-2 border-t" />}
                        <nav className="space-y-1">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.href}
                                    item={item}
                                    collapsed={collapsed}
                                    pathname={pathname}
                                />
                            ))}
                        </nav>
                    </div>
                ))}
            </ScrollArea>
        </aside>
    )
}
