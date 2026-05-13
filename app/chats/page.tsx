"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search, FileText, Paperclip, Zap, Send, Mail,
    ChevronDown, ChevronRight, MessageCircle, Plus, Loader2,
    ShieldAlert, Check, X, MapPin, User,
    ExternalLink, SendHorizonal, Users, MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import {
    fetchConversations,
    fetchConversation,
    sendMessage,
    replyToConfirmation,
    type ApiMessage,
    type ConversationSummary,
    type PendingTool,
    type CampaignTarget,
    type LinkedInMessage,
} from "@/lib/chat-api"

// ── Types ──────────────────────────────────────────────────────────────────────

type MessageType = "user" | "assistant" | "thinking" | "email" | "invoice" | "campaign_results" | "linkedin_inbox"

interface UIMessage {
    id: string
    type: MessageType
    content?: string
    targets?: CampaignTarget[]
    campaignType?: string
    linkedInMessages?: LinkedInMessage[]
}

function toUIMessage(m: ApiMessage): UIMessage {
    return { id: String(m.id), type: m.role, content: m.content }
}

// ── Tool registry ──────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
    send_email:                  "Send Email",
    print_doc:                   "Print Document",
    search_contacts:             "Search Contacts",
    read_linkedin_inbox:         "Read LinkedIn Inbox",
    send_linkedin_message:       "Send LinkedIn Message",
    send_linkedin_bulk_message:  "Send LinkedIn Bulk Message",
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
    send_email:                  "The assistant wants to send an email on your behalf.",
    print_doc:                   "The assistant wants to print a document.",
    search_contacts:             "The assistant will search for contacts matching your campaign.",
    read_linkedin_inbox:         "The assistant will read your LinkedIn inbox for recruiter messages.",
    send_linkedin_message:       "The assistant wants to send a LinkedIn message on your behalf.",
    send_linkedin_bulk_message:  "The assistant wants to send the same message to multiple LinkedIn contacts.",
}

function ToolInputPreview({ name, input }: { name: string; input: Record<string, unknown> }) {
    if (name === "send_email") {
        return (
            <div className="text-sm space-y-1">
                <p><span className="font-medium">To:</span> {String(input.to ?? "")}</p>
                <p><span className="font-medium">Subject:</span> {String(input.subject ?? "")}</p>
                <p className="text-muted-foreground line-clamp-3">{String(input.body ?? "")}</p>
            </div>
        )
    }
    if (name === "print_doc") {
        return (
            <div className="text-sm space-y-1">
                {!!input.printer_name && <p><span className="font-medium">Printer:</span> {String(input.printer_name)}</p>}
                {!!input.copies      && <p><span className="font-medium">Copies:</span>  {String(input.copies)}</p>}
                <p className="text-muted-foreground line-clamp-3">{String(input.content ?? "")}</p>
            </div>
        )
    }
    if (name === "search_contacts") {
        return (
            <div className="text-sm space-y-1">
                {!!input.query    && <p><span className="font-medium">Campaign:</span>   {String(input.query)}</p>}
                {!!input.location && <p><span className="font-medium">Location:</span>   {String(input.location)}</p>}
                {!!input.limit    && <p><span className="font-medium">Max results:</span> {String(input.limit)}</p>}
            </div>
        )
    }
    if (name === "read_linkedin_inbox") {
        return (
            <div className="text-sm space-y-1">
                {!!input.filter && <p><span className="font-medium">Filter:</span> {String(input.filter)}</p>}
                {!!input.limit  && <p><span className="font-medium">Limit:</span>  {String(input.limit)}</p>}
            </div>
        )
    }
    if (name === "send_linkedin_message") {
        return (
            <div className="text-sm space-y-1">
                <p><span className="font-medium">To:</span> {String(input.to ?? "")}</p>
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">{String(input.message ?? "")}</p>
            </div>
        )
    }
    if (name === "send_linkedin_bulk_message") {
        const recipients = Array.isArray(input.recipients) ? input.recipients as { name: string; chat_id: string }[] : []
        return (
            <div className="text-sm space-y-2">
                <p>
                    <span className="font-medium">Recipients</span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {recipients.length}
                    </span>
                </p>
                <ul className="max-h-36 overflow-y-auto space-y-0.5 rounded border bg-muted/40 p-2">
                    {recipients.map((r, i) => (
                        <li key={i} className="truncate text-xs text-muted-foreground">• {r.name}</li>
                    ))}
                </ul>
                <div>
                    <p className="font-medium mb-0.5">Message</p>
                    <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4 text-xs">{String(input.message ?? "")}</p>
                </div>
            </div>
        )
    }
    return (
        <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-auto max-h-32">
            {JSON.stringify(input, null, 2)}
        </pre>
    )
}

// ── Company avatar ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-orange-100 text-orange-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
]

function CompanyAvatar({ name }: { name: string }) {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length
    return (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_COLORS[idx]}`}>
            {name[0]?.toUpperCase()}
        </div>
    )
}

// ── Campaign Results Bubble ────────────────────────────────────────────────────

function CampaignResultsBubble({
    targets,
    campaignType,
    onSendEmail,
    onDraftCampaign,
}: {
    targets: CampaignTarget[]
    campaignType: string
    onSendEmail: (target: CampaignTarget) => void
    onDraftCampaign: (count: number) => void
}) {
    const withEmail = targets.filter((t) => t.email)

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Users className="w-4 h-4" />
                        {targets.length} {campaignType} found
                    </div>
                    {withEmail.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5 text-xs h-7"
                            onClick={() => onDraftCampaign(withEmail.length)}
                        >
                            <SendHorizonal className="w-3 h-3" />
                            Draft campaign ({withEmail.length})
                        </Button>
                    )}
                </div>

                {/* Contact list */}
                <ScrollArea className="max-h-[520px]">
                    <div className="divide-y">
                        {targets.map((target) => (
                            <div key={target.id} className="px-4 py-4 space-y-2">
                                {/* Name + company row */}
                                <div className="flex items-start gap-3">
                                    <CompanyAvatar name={target.company} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold leading-tight">{target.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {target.role}
                                            {target.company ? ` · ${target.company}` : ""}
                                        </p>
                                    </div>
                                    {target.source_url && (
                                        <a
                                            href={target.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 text-muted-foreground hover:text-foreground"
                                            title="View source"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {target.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {target.location}
                                        </span>
                                    )}
                                </div>

                                {/* Context */}
                                {target.context && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {target.context}
                                    </p>
                                )}

                                {/* Email + action */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <User className="w-3 h-3 shrink-0" />
                                        <span className="font-mono">{target.email}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs flex items-center gap-1.5 shrink-0 ml-2"
                                        onClick={() => onSendEmail(target)}
                                    >
                                        <Mail className="w-3 h-3" /> Send Email
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

// ── LinkedIn Inbox Bubble ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<LinkedInMessage["type"], string> = {
    cv_request:       "CV Request",
    interview_invite: "Interview",
    opportunity:      "Opportunity",
    follow_up:        "Follow-up",
    other:            "Message",
}

function LinkedInInboxBubble({
    messages,
    onDraftReply,
    onAutoReplyAll,
}: {
    messages: LinkedInMessage[]
    onDraftReply: (msg: LinkedInMessage) => void
    onAutoReplyAll: (count: number) => void
}) {
    const needsReply = messages.filter((m) => m.needs_reply)

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-[#0A66C2]/5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A66C2] shrink-0" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn Inbox · {messages.length} messages
                        {needsReply.length > 0 && (
                            <Badge className="bg-[#0A66C2]/10 text-[#0A66C2] text-xs ml-1 border-0">
                                {needsReply.length} need reply
                            </Badge>
                        )}
                    </div>
                    {needsReply.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5 text-xs h-7"
                            onClick={() => onAutoReplyAll(needsReply.length)}
                        >
                            <SendHorizonal className="w-3 h-3" />
                            Auto-reply all ({needsReply.length})
                        </Button>
                    )}
                </div>

                {/* Message list */}
                <ScrollArea className="max-h-[520px]">
                    <div className="divide-y">
                        {messages.map((msg) => (
                            <div key={msg.id} className="px-4 py-4 space-y-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10 text-sm font-bold text-[#0A66C2]">
                                        {msg.sender[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold">{msg.sender}</p>
                                            <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{msg.role}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-12">
                                    {msg.message}
                                </p>

                                {msg.needs_reply && (
                                    <div className="flex items-center gap-2 pl-12">
                                        <Badge variant="outline" className="text-xs">
                                            {TYPE_LABELS[msg.type]}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs flex items-center gap-1"
                                            onClick={() => onDraftReply(msg)}
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            Draft reply
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

// ── Standard message renderers ─────────────────────────────────────────────────

function ThinkingBubble() {
    return (
        <Card className="rounded-2xl max-w-xs">
            <CardContent className="p-4 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking…</span>
            </CardContent>
        </Card>
    )
}

function ConfirmationBubble({
    pendingTool,
    onConfirm,
    onCancel,
    isLoading,
}: {
    pendingTool: PendingTool
    onConfirm: () => void
    onCancel: () => void
    isLoading: boolean
}) {
    return (
        <Card className="rounded-2xl border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">
                        {TOOL_LABELS[pendingTool.name] ?? pendingTool.name} — Confirmation Required
                    </span>
                </div>

                <p className="text-sm text-muted-foreground">
                    {TOOL_DESCRIPTIONS[pendingTool.name] ?? "The assistant wants to run a tool."}
                </p>

                <ToolInputPreview name={pendingTool.name} input={pendingTool.input} />

                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Confirm
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                        <X className="w-3 h-3" /> Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function MessageBubble({
    message,
    onSendEmail,
    onDraftCampaign,
    onDraftLinkedInReply,
    onAutoReplyAll,
}: {
    message: UIMessage
    onSendEmail: (target: CampaignTarget) => void
    onDraftCampaign: (count: number) => void
    onDraftLinkedInReply: (msg: LinkedInMessage) => void
    onAutoReplyAll: (count: number) => void
}) {
    if (message.type === "thinking") return <ThinkingBubble />

    if (message.type === "campaign_results") {
        return (
            <CampaignResultsBubble
                targets={message.targets ?? []}
                campaignType={message.campaignType ?? "contacts"}
                onSendEmail={onSendEmail}
                onDraftCampaign={onDraftCampaign}
            />
        )
    }

    if (message.type === "linkedin_inbox") {
        return (
            <LinkedInInboxBubble
                messages={message.linkedInMessages ?? []}
                onDraftReply={onDraftLinkedInReply}
                onAutoReplyAll={onAutoReplyAll}
            />
        )
    }

    if (message.type === "user") {
        return (
            <div className="flex justify-end">
                <div className="bg-muted px-4 py-2 rounded-xl text-sm max-w-md">
                    {message.content}
                </div>
            </div>
        )
    }

    if (message.type === "assistant") {
        return (
            <Card className="rounded-2xl">
                <CardContent className="p-4 text-sm whitespace-pre-wrap">{message.content}</CardContent>
            </Card>
        )
    }

    if (message.type === "invoice") {
        return (
            <Card className="rounded-xl p-4 space-y-3">
                <Badge variant="secondary">🔎 Found: April 3rd Bills</Badge>
                <div className="grid md:grid-cols-2 gap-4">
                    {["Supplier A", "Supplier B"].map((s, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Invoice - {s}
                                </div>
                            </div>
                            <p className="text-sm">Amount: {i === 0 ? "$1,200" : "$980"}</p>
                        </div>
                    ))}
                </div>
            </Card>
        )
    }

    if (message.type === "email") {
        return (
            <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40 font-medium text-sm">
                        <Mail className="w-4 h-4" />
                        Gmail Draft
                        <span className="text-muted-foreground">(aura@gmail.com)</span>
                    </div>
                    <div className="px-4 py-3 text-sm space-y-1 border-b">
                        <p><span className="font-medium">To:</span> msandoval@example.com</p>
                        <p><span className="font-medium">Subject:</span> Rent Contract PDF - Attached</p>
                    </div>
                    <div className="px-4 py-3 text-sm leading-relaxed border-b">
                        <p>Hi msandoval, please find the signed rent contract attached. Let me know if you have questions.</p>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3">
                        <Button size="sm" variant="outline">✏️ Edit Draft</Button>
                        <Button size="sm">🚀 Send Email Now</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return null
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ChatPage() {
    const queryClient  = useQueryClient()
    const inputRef     = useRef<HTMLInputElement>(null)
    const bottomRef    = useRef<HTMLDivElement>(null)

    const [activeId,     setActiveId]     = useState<string | null>(null)
    const [expanded,     setExpanded]     = useState(true)
    const [input,        setInput]        = useState("")
    const [pendingMsg,   setPendingMsg]   = useState<string | null>(null)
    const [pendingTool,  setPendingTool]  = useState<PendingTool | null>(null)
    const [targetsMap,   setTargetsMap]   = useState<Record<string, { targets: CampaignTarget[]; campaign_type: string }>>({})
    const [linkedInMap,  setLinkedInMap]  = useState<Record<string, LinkedInMessage[]>>({})

    // ── Queries ──────────────────────────────────────────────────────────────

    const { data: convsData, isLoading: loadingConvs } = useQuery({
        queryKey: ["conversations"],
        queryFn: fetchConversations,
    })
    const conversations: ConversationSummary[] = convsData?.conversations ?? []

    const { data: activeConvData } = useQuery({
        queryKey: ["conversation", activeId],
        queryFn: () => fetchConversation(activeId!),
        enabled: !!activeId,
    })

    useEffect(() => {
        if (conversations.length > 0 && activeId === null && pendingMsg === null) {
            setActiveId(conversations[0].id)
        }
    }, [conversations]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Response handler ──────────────────────────────────────────────────────

    function handleChatResponse(data: Awaited<ReturnType<typeof sendMessage>>) {
        setPendingMsg(null)
        setActiveId(data.conversation_id)

        if (data.requires_confirmation && data.pending_tool) {
            setPendingTool(data.pending_tool)
            return
        }

        setPendingTool(null)

        if (data.tool_result?.tool === "search_contacts") {
            const { targets, campaign_type } = data.tool_result.data as { targets: CampaignTarget[]; campaign_type: string }
            setTargetsMap((prev) => ({ ...prev, [data.conversation_id]: { targets, campaign_type } }))
        }
        if (data.tool_result?.tool === "read_linkedin_inbox") {
            const { messages } = data.tool_result.data as { messages: LinkedInMessage[] }
            setLinkedInMap((prev) => ({ ...prev, [data.conversation_id]: messages }))
        }

        queryClient.invalidateQueries({ queryKey: ["conversations"] })
        queryClient.invalidateQueries({ queryKey: ["conversation", data.conversation_id] })
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    const { mutate: send, isPending: isSending } = useMutation({
        mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
            sendMessage(message, conversationId),
        onSuccess: handleChatResponse,
        onError: (err: Error) => {
            setPendingMsg(null)
            toast.error("Failed to send message", { description: err.message, duration: 10_000 })
        },
    })

    const { mutate: confirm, isPending: isConfirming } = useMutation({
        mutationFn: (confirmed: boolean) => replyToConfirmation(activeId!, confirmed),
        onSuccess: (data) => {
            setPendingTool(null)
            setActiveId(data.conversation_id)
            if (data.requires_confirmation && data.pending_tool) {
                setPendingTool(data.pending_tool)
            } else {
                if (data.tool_result?.tool === "search_contacts") {
                    const { targets, campaign_type } = data.tool_result.data as { targets: CampaignTarget[]; campaign_type: string }
                    setTargetsMap((prev) => ({ ...prev, [data.conversation_id]: { targets, campaign_type } }))
                }
                if (data.tool_result?.tool === "read_linkedin_inbox") {
                    const { messages } = data.tool_result.data as { messages: LinkedInMessage[] }
                    setLinkedInMap((prev) => ({ ...prev, [data.conversation_id]: messages }))
                }
                queryClient.invalidateQueries({ queryKey: ["conversations"] })
                queryClient.invalidateQueries({ queryKey: ["conversation", data.conversation_id] })
            }
        },
        onError: (err: Error) => {
            setPendingTool(null)
            toast.error("Action failed", { description: err.message, duration: 10_000 })
        },
    })

    // ── Scroll to bottom ──────────────────────────────────────────────────────

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [activeConvData?.messages.length, pendingMsg, pendingTool, activeId && targetsMap[activeId]])

    // ── Derived display messages ──────────────────────────────────────────────

    const baseMessages: UIMessage[] = activeConvData?.messages.map(toUIMessage) ?? []

    const activeTargets = activeId ? (targetsMap[activeId] ?? null) : null
    const campaignResultMessage: UIMessage | null = activeTargets && activeTargets.targets.length > 0
        ? {
            id:           "campaign-results",
            type:         "campaign_results",
            targets:      activeTargets.targets,
            campaignType: activeTargets.campaign_type,
          }
        : null

    const activeLinkedIn = activeId ? (linkedInMap[activeId] ?? null) : null
    const linkedInMessage: UIMessage | null = activeLinkedIn && activeLinkedIn.length > 0
        ? { id: "linkedin-inbox", type: "linkedin_inbox", linkedInMessages: activeLinkedIn }
        : null

    const displayMessages: UIMessage[] = [
        ...baseMessages,
        ...(campaignResultMessage ? [campaignResultMessage] : []),
        ...(linkedInMessage ? [linkedInMessage] : []),
        ...(isSending && pendingMsg
            ? [
                { id: "opt-user",     type: "user"     as const, content: pendingMsg },
                { id: "opt-thinking", type: "thinking" as const },
              ]
            : []),
    ]

    const activeTitle =
        activeConvData?.title ??
        conversations.find((c) => c.id === activeId)?.title ??
        (activeId ? "Loading…" : "New Chat")

    const isBlocked = isSending || isConfirming || !!pendingTool

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleNewChat() {
        setActiveId(null)
        setInput("")
        setPendingMsg(null)
        setPendingTool(null)
    }

    function handleSend() {
        const text = input.trim()
        if (!text || isBlocked) return
        setPendingMsg(text)
        setInput("")
        send({ message: text, conversationId: activeId ?? undefined })
    }

    const handleSendEmail = useCallback((target: CampaignTarget) => {
        const prefill = `Send a professional email to ${target.name} at ${target.company} (${target.email}).`
        setInput(prefill)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    const handleDraftCampaign = useCallback((count: number) => {
        setInput(`Send campaign emails to all ${count} contacts found.`)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    const handleDraftLinkedInReply = useCallback((msg: LinkedInMessage) => {
        setInput(`Draft reply to ${msg.sender} on LinkedIn.`)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    const handleAutoReplyAll = useCallback((count: number) => {
        setInput(`Auto-reply to all ${count} recruiters in my LinkedIn inbox.`)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-64 border-r p-4 flex flex-col gap-3">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-2 font-medium">
                        <MessageCircle className="w-4 h-4" /> Chats
                    </div>
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>

                <Button size="sm" className="w-full flex items-center gap-2" onClick={handleNewChat}>
                    <Plus className="w-4 h-4" /> New Chat
                </Button>

                {expanded && (
                    <div className="space-y-1 overflow-y-auto">
                        {loadingConvs && (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                            </div>
                        )}
                        {conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveId(c.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                                    activeId === c.id
                                        ? "bg-muted font-medium"
                                        : "hover:bg-muted"
                                }`}
                            >
                                {c.title}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 p-6 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h1 className="text-xl font-semibold truncate">{activeTitle}</h1>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-9" />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto space-y-4 pr-1">
                    {displayMessages.length === 0 && !pendingTool ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                            <MessageCircle className="w-10 h-10 opacity-20" />
                            <div className="text-center space-y-1">
                                <p className="text-sm">Start a conversation below</p>
                                <p className="text-xs opacity-60">
                                    Try: "Show my LinkedIn inbox" · "Find IT open positions" · "Find press contacts"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {displayMessages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onSendEmail={handleSendEmail}
                                    onDraftCampaign={handleDraftCampaign}
                                    onDraftLinkedInReply={handleDraftLinkedInReply}
                                    onAutoReplyAll={handleAutoReplyAll}
                                />
                            ))}
                            {pendingTool && (
                                <ConfirmationBubble
                                    pendingTool={pendingTool}
                                    onConfirm={() => confirm(true)}
                                    onCancel={() => confirm(false)}
                                    isLoading={isConfirming}
                                />
                            )}
                        </>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t pt-3 flex items-center gap-2 mt-4 shrink-0">
                    <Button variant="ghost" size="icon" disabled={isBlocked}>
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isBlocked}>
                        <Zap className="w-4 h-4" />
                    </Button>
                    <Input
                        ref={inputRef}
                        placeholder={pendingTool ? "Confirm or cancel the action above first…" : "Ask anything…"}
                        className="flex-1"
                        value={input}
                        disabled={isBlocked}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        className="flex items-center gap-2"
                        onClick={handleSend}
                        disabled={!input.trim() || isBlocked}
                    >
                        {isSending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />}
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}
