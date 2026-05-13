const BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:5000"

export interface ApiMessage {
    id: number
    role: "user" | "assistant"
    content: string
    created_at: string
}

export interface ConversationSummary {
    id: string
    title: string
    created_at: string
    message_count: number
}

export interface ConversationDetail extends ConversationSummary {
    messages: ApiMessage[]
}

export interface PendingTool {
    name: string
    input: Record<string, unknown>
}

export interface CampaignTarget {
    id: string
    name: string
    email: string
    role: string
    company: string
    location?: string
    context?: string
    source_url?: string
}

export interface LinkedInMessage {
    id: string
    sender: string
    role: string
    message: string
    time: string
    needs_reply: boolean
    type: "cv_request" | "interview_invite" | "opportunity" | "follow_up" | "other"
}

export interface ToolResult {
    tool: string
    data: unknown
}

export interface ChatResponse {
    answer?: string
    conversation_id: string
    requires_confirmation?: boolean
    pending_tool?: PendingTool
    tool_result?: ToolResult
}

export async function fetchConversations(): Promise<{ conversations: ConversationSummary[] }> {
    const res = await fetch(`${BASE}/conversations`)
    if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`)
    return res.json()
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${BASE}/conversations/${id}`)
    if (!res.ok) throw new Error(`Failed to fetch conversation: ${res.status}`)
    return res.json()
}

export async function sendMessage(
    message: string,
    conversationId?: string,
): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message,
            ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(parseApiError(body) ?? `Chat request failed (${res.status})`)
    }

    return res.json()
}

export async function replyToConfirmation(
    conversationId: string,
    confirmed: boolean,
): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, confirm: confirmed }),
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(parseApiError(body) ?? `Confirmation request failed (${res.status})`)
    }

    return res.json()
}

export interface LinkedInConversation {
    id: string
    name: string
    headline: string
    avatar: string
    last_message: string
    last_activity: string
    message_count: number
    status: {
        label: string
        variant: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "secondary"
    }
}

export interface IntegrationStatus {
    connected: boolean
    email?: string | null
    expires_at?: string | null
    scopes?: string[]
}

export async function fetchAuthStatus(): Promise<{ integrations: Record<string, IntegrationStatus> }> {
    const res = await fetch(`${BASE}/auth/status`)
    if (!res.ok) throw new Error(`Failed to fetch auth status: ${res.status}`)
    return res.json()
}

export async function fetchLinkedInConversations(): Promise<{ conversations: LinkedInConversation[] }> {
    const res = await fetch(`${BASE}/linkedin/conversations`)
    if (!res.ok) throw new Error(`Failed to fetch LinkedIn conversations: ${res.status}`)
    return res.json()
}

function parseApiError(body: unknown): string | null {
    if (!body || typeof body !== "object") return null
    const raw = (body as Record<string, unknown>).error
    if (typeof raw !== "string") return null

    const match = raw.match(/'message':\s*'([^']+)'/)
    if (match) return match[1]

    return raw.length > 200 ? raw.slice(0, 200) + "…" : raw
}
