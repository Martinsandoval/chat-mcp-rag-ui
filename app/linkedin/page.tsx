"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, MessageSquare, RefreshCw, AlertCircle, Settings, FileText, Upload, X, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { fetchLinkedInConversations, type LinkedInConversation } from "@/lib/chat-api"
import { Pagination } from "@/app/components/common/Pagination"

const PAGE_SIZE = 8

const AI_SERVICE = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:5000"
const CV_STORAGE_KEY = "linkedin_cv_file_id"

// ── CV Settings panel ──────────────────────────────────────────────────────────

interface CvFile { id: string; name: string; size: string }

function CvSettings() {
    const [open, setOpen] = useState(false)
    const [cv, setCv] = useState<CvFile | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // On mount: restore CV from localStorage, verify it still exists on the server
    useEffect(() => {
        const savedId = localStorage.getItem(CV_STORAGE_KEY)
        if (!savedId) return
        fetch(`${AI_SERVICE}/upload/status`)
            .then((r) => r.json())
            .then((data) => {
                const file = (data.files as Array<{ id: string; filename: string; size_bytes: number; status: string }>)
                    ?.find((f) => f.id === savedId && f.status === "completed")
                if (file) {
                    setCv({ id: file.id, name: file.filename, size: `${(file.size_bytes / 1024).toFixed(0)} KB` })
                } else {
                    localStorage.removeItem(CV_STORAGE_KEY)
                }
            })
            .catch(() => {})
    }, [])

    async function handleFile(file: File) {
        setError(null)
        setUploading(true)
        try {
            const form = new FormData()
            form.append("files", file)
            const res = await fetch(`${AI_SERVICE}/upload`, { method: "POST", body: form })
            if (!res.ok) throw new Error(`Upload failed (${res.status})`)
            const data = await res.json()
            const uploadedId: string = data.queued?.[0]?.id ?? ""
            const newCv: CvFile = {
                id: uploadedId,
                name: file.name,
                size: `${(file.size / 1024).toFixed(0)} KB`,
            }
            setCv(newCv)
            if (uploadedId) localStorage.setItem(CV_STORAGE_KEY, uploadedId)
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setUploading(false)
        }
    }

    function removeCv() {
        setCv(null)
        localStorage.removeItem(CV_STORAGE_KEY)
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = ""
    }

    return (
        <div className="shrink-0 border-b">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                </span>
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {open && (
                <div className="px-6 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">CV / Resume</p>
                            <p className="text-xs text-muted-foreground">
                                Uploaded here so the AI can reference it when drafting LinkedIn messages.
                            </p>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={onInputChange}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5"
                            disabled={uploading}
                            onClick={() => inputRef.current?.click()}
                        >
                            {uploading
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Upload className="h-3.5 w-3.5" />}
                            {uploading ? "Uploading…" : cv ? "Replace" : "Upload CV"}
                        </Button>
                    </div>

                    {cv && (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs font-medium">{cv.name}</span>
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{cv.size}</span>
                            <button
                                onClick={removeCv}
                                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Status badge colours ───────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<string, string> = {
    red:       "bg-red-100 text-red-700 border-red-200",
    orange:    "bg-orange-100 text-orange-700 border-orange-200",
    yellow:    "bg-yellow-100 text-yellow-800 border-yellow-200",
    green:     "bg-green-100 text-green-700 border-green-200",
    blue:      "bg-blue-100 text-blue-700 border-blue-200",
    purple:    "bg-purple-100 text-purple-700 border-purple-200",
    secondary: "bg-muted text-muted-foreground border-border",
}

function StatusBadge({ status }: { status: LinkedInConversation["status"] }) {
    const cls = VARIANT_CLASSES[status.variant] ?? VARIANT_CLASSES.secondary
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {status.label}
        </span>
    )
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

type Filter = "all" | "needs_reply" | "cv" | "interview" | "job_opportunity"

const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",             label: "All" },
    { key: "needs_reply",     label: "Needs reply" },
    { key: "cv",              label: "CV" },
    { key: "interview",       label: "Interview" },
    { key: "job_opportunity", label: "Job Opportunity" },
]

function matchesFilter(conv: LinkedInConversation, filter: Filter): boolean {
    if (filter === "all") return true
    const label = conv.status.label.toLowerCase()
    if (filter === "needs_reply")     return conv.status.variant === "orange" || conv.status.variant === "red"
    if (filter === "cv")              return label.includes("cv")
    if (filter === "interview")       return label.includes("interview")
    if (filter === "job_opportunity") return label.includes("opportunity") || label.includes("job")
    return true
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, src }: { name: string; src?: string }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="h-11 w-11 rounded-full object-cover shrink-0"
                onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
            />
        )
    }

    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-white text-sm font-semibold select-none">
            {initials || "?"}
        </div>
    )
}

// ── Time helper ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    if (!iso) return ""
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
}

// ── Conversation card ──────────────────────────────────────────────────────────

function ConversationCard({ conv }: { conv: LinkedInConversation }) {
    const replyPrompt = encodeURIComponent(`Reply to ${conv.name} on LinkedIn`)

    return (
        <div className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
            <Avatar name={conv.name} src={conv.avatar} />

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{conv.name}</p>
                        {conv.headline && (
                            <p className="truncate text-xs text-muted-foreground">{conv.headline}</p>
                        )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(conv.last_activity)}
                    </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {conv.last_message || "No preview available"}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge status={conv.status} />
                    <Link href={`/chats?q=${replyPrompt}`}>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageSquare className="h-3 w-3" />
                            Reply in Chat
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LinkedInPage() {
    const [filter, setFilter] = useState<Filter>("all")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["linkedin-conversations"],
        queryFn: fetchLinkedInConversations,
        refetchInterval: 60_000,
    })

    const filtered = (data?.conversations ?? []).filter((c) => {
        if (!matchesFilter(c, filter)) return false
        if (search.trim()) {
            const q = search.toLowerCase()
            return (
                c.name.toLowerCase().includes(q) ||
                c.headline.toLowerCase().includes(q) ||
                c.last_message.toLowerCase().includes(q)
            )
        }
        return true
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    const conversations = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

    // Reset to page 1 when filter or search changes
    useEffect(() => { setPage(1) }, [filter, search])

    const needsReplyCount = (data?.conversations ?? []).filter(
        (c) => c.status.variant === "orange" || c.status.variant === "red"
    ).length

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0A66C2]">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold leading-tight">LinkedIn Conversations</h1>
                            {needsReplyCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {needsReplyCount} conversation{needsReplyCount !== 1 ? "s" : ""} need{needsReplyCount === 1 ? "s" : ""} your reply
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Filters */}
                <div className="mt-3 flex gap-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                filter === f.key
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <CvSettings />

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                    {isLoading && (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}

                    {isError && (
                        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <div>
                                <p className="font-medium text-sm">Could not load conversations</p>
                                <p className="text-xs mt-1">
                                    {(error as Error)?.message ?? "Unknown error"}
                                </p>
                            </div>
                            <Link href="/integrations">
                                <Button variant="outline" size="sm">Check LinkedIn connection</Button>
                            </Link>
                        </div>
                    )}

                    {!isLoading && !isError && conversations.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                            <MessageSquare className="h-8 w-8" />
                            <p className="text-sm">
                                {search || filter !== "all"
                                    ? "No conversations match your filter"
                                    : "No LinkedIn conversations found"}
                            </p>
                        </div>
                    )}

                    {conversations.map((conv) => (
                        <ConversationCard key={conv.id} conv={conv} />
                    ))}

                    {filtered.length > PAGE_SIZE && (
                        <div className="pt-2 pb-1 space-y-3">
                            <Pagination
                                page={safePage}
                                totalPages={totalPages}
                                onChange={setPage}
                            />
                            <p className="text-center text-xs text-muted-foreground">
                                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
