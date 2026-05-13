"use client"

import Link from "next/link"
import { Bell, ChevronDown, Search, Mail, HardDrive } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { fetchAuthStatus } from "@/lib/chat-api"

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

const INTEGRATION_META: Record<string, {
    label: string
    icon: React.ElementType
    color: string
}> = {
    gmail: {
        label: "Gmail",
        icon: Mail,
        color: "text-red-500",
    },
    google_drive: {
        label: "Google Drive",
        icon: HardDrive,
        color: "text-blue-500",
    },
    linkedin: {
        label: "LinkedIn",
        icon: LinkedInIcon,
        color: "text-[#0A66C2]",
    },
}

function IntegrationPill() {
    const { data } = useQuery({
        queryKey: ["auth-status"],
        queryFn: fetchAuthStatus,
        refetchInterval: 60_000,
        staleTime: 30_000,
    })

    const integrations = data?.integrations ?? {}
    const connected = Object.entries(integrations).filter(([, v]) => v.connected)

    if (connected.length === 0) {
        return (
            <Link href="/integrations">
                <div className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <span>No integrations</span>
                </div>
            </Link>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                    <span className="font-medium text-muted-foreground">Connected</span>
                    <div className="flex items-center gap-1.5">
                        {connected.map(([key, status]) => {
                            const meta = INTEGRATION_META[key]
                            if (!meta) return null
                            const Icon = meta.icon
                            return (
                                <span
                                    key={key}
                                    className="relative flex items-center"
                                    title={`${meta.label}${status.email ? ` — ${status.email}` : ""}`}
                                >
                                    <Icon className={`h-4 w-4 ${meta.color}`} />
                                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                                </span>
                            )
                        })}
                    </div>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                        {connected.length}
                    </Badge>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                {connected.map(([key, status]) => {
                    const meta = INTEGRATION_META[key]
                    if (!meta) return null
                    const Icon = meta.icon
                    return (
                        <DropdownMenuItem key={key} asChild>
                            <Link href="/integrations" className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">{meta.label}</p>
                                    {status.email && (
                                        <p className="truncate text-xs text-muted-foreground">{status.email}</p>
                                    )}
                                </div>
                                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" />
                            </Link>
                        </DropdownMenuItem>
                    )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/integrations" className="text-muted-foreground">
                        Manage integrations
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header() {
    return (
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
            {/* Search */}
            <div className="flex flex-1 items-center max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search documents, actions, or chats..." className="pl-9" />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 ml-4">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1">
                        <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs">3</Badge>
                    </span>
                </Button>

                <IntegrationPill />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src="/avatar.png" />
                                <AvatarFallback>MS</AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline text-sm font-medium">Martin Sandoval</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
