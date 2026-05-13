/**
 * Stateful mock AI service — runs the full campaign flow in-browser
 * with no backend required. Falls back gracefully once a real backend
 * is reachable.
 *
 * State machine per conversation:
 *   idle → awaiting_search → results_shown → awaiting_email → (done / loop)
 */

import type {
    ChatResponse,
    CampaignTarget,
    ConversationSummary,
    ConversationDetail,
    ApiMessage,
    LinkedInMessage,
} from "./chat-api"

// ── Campaign datasets ──────────────────────────────────────────────────────────

const DATASETS: Record<string, CampaignTarget[]> = {
    "IT open positions": [
        { id: "it1", name: "Ana Reyes",     email: "ana.reyes@stripe.com",    role: "Tech Recruiter",        company: "Stripe",    location: "Austin, TX",        context: "Hiring: Senior Software Engineer",  source_url: "https://stripe.com/jobs"      },
        { id: "it2", name: "James Park",    email: "james.park@openai.com",   role: "Engineering Recruiter", company: "OpenAI",    location: "San Francisco, CA", context: "Hiring: Full Stack Engineer",       source_url: "https://openai.com/careers"   },
        { id: "it3", name: "Sofia Mendez",  email: "s.mendez@vercel.com",     role: "HR Lead",               company: "Vercel",    location: "Remote",            context: "Hiring: Platform Engineer",         source_url: "https://vercel.com/careers"   },
        { id: "it4", name: "Lucas Bennett", email: "l.bennett@anthropic.com", role: "Talent Acquisition",    company: "Anthropic", location: "San Francisco, CA", context: "Hiring: Software Engineer",         source_url: "https://anthropic.com/careers"},
        { id: "it5", name: "Priya Sharma",  email: "p.sharma@linear.app",     role: "HR Business Partner",   company: "Linear",    location: "Remote",            context: "Hiring: Senior Frontend Engineer",  source_url: "https://linear.app/careers"   },
    ],
    "sales prospects": [
        { id: "s1", name: "Rachel Kim",    email: "r.kim@hubspot.com",       role: "VP of Sales",     company: "HubSpot",    location: "Boston, MA",   context: "Evaluating CRM & automation tools"       },
        { id: "s2", name: "Daniel Torres", email: "d.torres@salesforce.com", role: "Head of Revenue",  company: "Salesforce", location: "Chicago, IL",  context: "Expanding enterprise partner ecosystem"   },
        { id: "s3", name: "Emma Wilson",   email: "e.wilson@zoom.us",        role: "Sales Director",   company: "Zoom",       location: "San Jose, CA", context: "Exploring SaaS tool partnerships"         },
    ],
    "press contacts": [
        { id: "pr1", name: "Tom Bradley",  email: "tbradley@techcrunch.com", role: "Tech Editor",      company: "TechCrunch", context: "Covers AI, developer tools, and startups"    },
        { id: "pr2", name: "Sarah Lee",    email: "slee@theverge.com",       role: "Staff Journalist", company: "The Verge",  context: "Covers consumer tech and AI applications"     },
        { id: "pr3", name: "Mike Johnson", email: "mjohnson@wired.com",      role: "Senior Reporter",  company: "Wired",      context: "Covers AI agents and enterprise software"     },
    ],
}

// ── LinkedIn inbox dataset ─────────────────────────────────────────────────────

const LINKEDIN_INBOX: LinkedInMessage[] = [
    {
        id:          "li1",
        sender:      "Alice Johnson",
        role:        "Tech Recruiter @ Google",
        message:     "Hi Martin! I came across your profile and I'd love to connect. We have a Senior Engineer opening that fits you perfectly — can you send me your CV?",
        time:        "2h ago",
        needs_reply: true,
        type:        "cv_request",
    },
    {
        id:          "li2",
        sender:      "Bob Martinez",
        role:        "Senior Recruiter @ Meta",
        message:     "Hey Martin, we have an exciting opening for a Senior SWE role at Meta. Would you be open to a quick 15-min call this week to learn more?",
        time:        "1d ago",
        needs_reply: true,
        type:        "interview_invite",
    },
    {
        id:          "li3",
        sender:      "Carol Smith",
        role:        "HR Manager @ Stripe",
        message:     "Hi Martin, I noticed your Next.js and AI experience — we're hiring at Stripe and I'd love to tell you more. Interested?",
        time:        "2d ago",
        needs_reply: true,
        type:        "opportunity",
    },
    {
        id:          "li4",
        sender:      "David Lee",
        role:        "Talent Acquisition @ Anthropic",
        message:     "Martin, just following up — can you share an updated version of your CV? We'd love to move fast on this ML Engineer role.",
        time:        "3d ago",
        needs_reply: true,
        type:        "cv_request",
    },
]

// ── LinkedIn reply generator ───────────────────────────────────────────────────

function generateLinkedInReply(msg: LinkedInMessage): string {
    const first   = msg.sender.split(" ")[0]
    const company = msg.role.split("@ ")[1] ?? "your company"

    if (msg.type === "cv_request") {
        return `Hi ${first}, thanks for reaching out!\n\nI'd be happy to share my CV — you can download the latest version here: https://martinsandoval.dev/cv.pdf\n\nLooking forward to learning more about the opportunity at ${company}.\n\nBest,\nMartin Sandoval`
    }
    if (msg.type === "interview_invite") {
        return `Hi ${first}, thanks for the message!\n\nI'm definitely interested in learning more about the role at ${company}. I'm available Monday through Friday this week for a call — would any of those work for you?\n\nLooking forward to connecting.\n\nBest,\nMartin Sandoval`
    }
    if (msg.type === "opportunity") {
        return `Hi ${first}, thanks for reaching out!\n\nI'd love to hear more about the opportunity at ${company}. Feel free to share more details, or we can hop on a quick call whenever works for you.\n\nBest,\nMartin Sandoval`
    }
    return `Hi ${first}, thanks for following up!\n\nStill interested in learning more. Feel free to share more details about the role at ${company} and we can go from there.\n\nBest,\nMartin Sandoval`
}

// ── Intent helpers ─────────────────────────────────────────────────────────────

function detectSearchIntent(msg: string): { label: string; targets: CampaignTarget[] } | null {
    const m = msg.toLowerCase()
    const hasSearchVerb   = /\b(find|search|look for|get|fetch|discover|show me)\b/.test(m)
    const hasCampaignNoun = /\b(campaign|outreach)\b/.test(m)
    if (!hasSearchVerb && !hasCampaignNoun) return null

    if (/\b(it |software|engineer|developer|programmer|tech job|position|opening|role|recruit|hr|hiring)\b/.test(m))
        return { label: "IT open positions",  targets: DATASETS["IT open positions"] }
    if (/\b(sales|prospect|lead|b2b|revenue|customer|buyer)\b/.test(m))
        return { label: "sales prospects",    targets: DATASETS["sales prospects"]   }
    if (/\b(press|journalist|media|reporter|publication|editor|pr )\b/.test(m))
        return { label: "press contacts",     targets: DATASETS["press contacts"]    }

    return { label: "IT open positions", targets: DATASETS["IT open positions"] }
}

function extractLocation(msg: string): string | undefined {
    const m = msg.match(/\bin\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i)
    return m?.[1]?.trim()
}

function isReadInboxIntent(msg: string): boolean {
    return /\b(read|show|check|open|get|fetch|view)\b.*\blinkedin\b/i.test(msg)
        || /\blinkedin\b.*\b(inbox|messages?|dms?)\b/i.test(msg)
        || /\b(inbox|messages?)\b.*\blinkedin\b/i.test(msg)
}

function isLinkedInReplyIntent(msg: string): boolean {
    return /draft reply to .+ on linkedin/i.test(msg)
        || /reply to .+ on linkedin/i.test(msg)
        || /send.*linkedin message to/i.test(msg)
}

function isLinkedInAutoReplyIntent(msg: string): boolean {
    return /auto[- ]?reply to all/i.test(msg) && /\b(recruiter|linkedin|inbox)\b/i.test(msg)
}

function isBulkEmailIntent(msg: string): boolean {
    return /\b(send campaign|draft campaign|email all|send (to all|all emails|emails to all)|campaign emails to all)\b/i.test(msg)
}

function isSingleEmailIntent(msg: string): boolean {
    return /send (a |an |one |professional |formal )?email to\b/i.test(msg)
}

// ── Email template generator ───────────────────────────────────────────────────

function generateEmail(target: CampaignTarget, campaignLabel: string): { subject: string; body: string } {
    if (campaignLabel.includes("IT") || campaignLabel.includes("position")) {
        const role = target.context?.replace(/^Hiring:\s*/i, "") ?? "Software Engineer"
        return {
            subject: `Application — ${role} at ${target.company}`,
            body:
`Dear ${target.name},

I came across ${target.company}'s opening for a ${role} and wanted to reach out directly.

I'm a full-stack software engineer with production experience in React, Next.js, Python, and AI integrations. I've recently been building AI-powered workflow tools and would love the chance to bring that energy to ${target.company}.

Would you be open to a brief call this week to discuss fit?

Best regards,
Martin Sandoval
martinsandoval9419@gmail.com`,
        }
    }

    if (campaignLabel.includes("sales")) {
        return {
            subject: `Partnership opportunity — Aura × ${target.company}`,
            body:
`Hi ${target.name},

I'm reaching out because I believe there's strong alignment between what Aura is building and ${target.company}'s goals.

Aura is an AI workspace that automates document workflows, outreach campaigns, and API integrations through natural language — exactly the kind of tooling that could reduce your team's manual overhead significantly.

Would you be open to a 20-minute call to explore fit?

Best,
Martin Sandoval`,
        }
    }

    // press
    return {
        subject: `Story pitch — Aura: AI agent for business workflows`,
        body:
`Hi ${target.name},

I'm Martin Sandoval, building Aura — an AI platform that lets teams automate email campaigns, document processing, and API integrations through conversational AI.

Given your coverage of ${target.context?.replace(/^Covers\s*/i, "").toLowerCase() ?? "AI and enterprise software"}, I thought the human-in-the-loop model we use (every agent action requires explicit user approval) might make for an interesting angle.

I'd love to offer an exclusive briefing. Available this week?

Best,
Martin Sandoval`,
    }
}

// ── Conversation store ─────────────────────────────────────────────────────────

let convIdCounter = 1

interface ConvState {
    id: string
    title: string
    createdAt: string
    messages: { role: "user" | "assistant"; content: string }[]
    phase: "idle" | "awaiting_search" | "results_shown" | "awaiting_email"
          | "awaiting_inbox" | "inbox_shown" | "awaiting_linkedin_reply"
    // search
    pendingLabel?:    string
    pendingLocation?: string
    pendingTargets?:  CampaignTarget[]
    // results
    campaignLabel?:   string
    foundTargets?:    CampaignTarget[]
    // email flow
    emailTarget?:     CampaignTarget
    emailQueue?:      CampaignTarget[]
    emailsSent?:      number
    // linkedin
    linkedinMessages?:     LinkedInMessage[]
    linkedinReplyTarget?:  LinkedInMessage
    linkedinReplyQueue?:   LinkedInMessage[]
    linkedinRepliesSent?:  number
}

const store = new Map<string, ConvState>()

function getOrCreate(id?: string): ConvState {
    if (id && store.has(id)) return store.get(id)!
    const conv: ConvState = {
        id:        `mock-${convIdCounter++}`,
        title:     "New Chat",
        createdAt: new Date().toISOString(),
        messages:  [],
        phase:     "idle",
        emailsSent: 0,
    }
    store.set(conv.id, conv)
    return conv
}

function addMsg(conv: ConvState, role: "user" | "assistant", content: string) {
    conv.messages.push({ role, content })
    if (role === "user" && conv.messages.filter(m => m.role === "user").length === 1) {
        conv.title = content.length > 50 ? content.slice(0, 47) + "…" : content
    }
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Public mock functions ──────────────────────────────────────────────────────

export function mockFetchConversations(): Promise<{ conversations: ConversationSummary[] }> {
    return Promise.resolve({
        conversations: Array.from(store.values()).map(c => ({
            id:            c.id,
            title:         c.title,
            created_at:    c.createdAt,
            message_count: c.messages.length,
        })),
    })
}

export function mockFetchConversation(id: string): Promise<ConversationDetail> {
    const conv = store.get(id)
    if (!conv) return Promise.reject(new Error(`Mock conversation ${id} not found`))
    const messages: ApiMessage[] = conv.messages.map((m, i) => ({
        id:         i + 1,
        role:       m.role,
        content:    m.content,
        created_at: conv.createdAt,
    }))
    return Promise.resolve({
        id:            conv.id,
        title:         conv.title,
        created_at:    conv.createdAt,
        message_count: conv.messages.length,
        messages,
    })
}

export async function mockSendMessage(
    message: string,
    conversationId?: string,
): Promise<ChatResponse> {
    await sleep(750)
    const conv = getOrCreate(conversationId)
    addMsg(conv, "user", message)
    const msg = message.toLowerCase()

    // ── Search intent ────────────────────────────────────────────────────────
    if (conv.phase === "idle" || conv.phase === "results_shown") {
        const intent = detectSearchIntent(message)
        if (intent && conv.phase === "idle") {
            const location = extractLocation(message)
            conv.phase            = "awaiting_search"
            conv.pendingLabel     = intent.label
            conv.pendingLocation  = location
            conv.pendingTargets   = intent.targets
            return {
                conversation_id:       conv.id,
                requires_confirmation: true,
                pending_tool: {
                    name:  "search_contacts",
                    input: {
                        query:  intent.label,
                        limit:  intent.targets.length,
                        ...(location ? { location } : {}),
                    },
                },
            }
        }
    }

    // ── Bulk email intent ────────────────────────────────────────────────────
    if (conv.phase === "results_shown" && isBulkEmailIntent(msg)) {
        const queue = (conv.foundTargets ?? []).filter(t => t.email)
        if (!queue.length) {
            const answer = "No contacts with email addresses found in the current results."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }
        const [first, ...rest] = queue
        const email = generateEmail(first, conv.campaignLabel ?? "IT open positions")
        conv.phase       = "awaiting_email"
        conv.emailTarget = first
        conv.emailQueue  = rest
        conv.emailsSent  = 0
        return {
            conversation_id:       conv.id,
            requires_confirmation: true,
            pending_tool: {
                name:  "send_email",
                input: { to: first.email, subject: email.subject, body: email.body },
            },
        }
    }

    // ── Single email intent ──────────────────────────────────────────────────
    if (conv.phase === "results_shown" && isSingleEmailIntent(msg)) {
        const target =
            (conv.foundTargets ?? []).find(
                t =>
                    msg.includes(t.name.toLowerCase()) ||
                    msg.includes(t.email.toLowerCase()),
            ) ?? conv.foundTargets?.[0]

        if (target) {
            const email = generateEmail(target, conv.campaignLabel ?? "IT open positions")
            conv.phase       = "awaiting_email"
            conv.emailTarget = target
            conv.emailQueue  = []
            return {
                conversation_id:       conv.id,
                requires_confirmation: true,
                pending_tool: {
                    name:  "send_email",
                    input: { to: target.email, subject: email.subject, body: email.body },
                },
            }
        }
    }

    // ── LinkedIn: read inbox ─────────────────────────────────────────────────
    if ((conv.phase === "idle" || conv.phase === "inbox_shown") && isReadInboxIntent(msg)) {
        conv.phase = "awaiting_inbox"
        return {
            conversation_id:       conv.id,
            requires_confirmation: true,
            pending_tool: {
                name:  "read_linkedin_inbox",
                input: { filter: "unread", limit: 10 },
            },
        }
    }

    // ── LinkedIn: auto-reply to all recruiters ───────────────────────────────
    if (conv.phase === "inbox_shown" && isLinkedInAutoReplyIntent(msg)) {
        const queue = (conv.linkedinMessages ?? []).filter((m) => m.needs_reply)
        if (!queue.length) {
            const answer = "No pending recruiter messages to reply to."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }
        const [first, ...rest] = queue
        const reply = generateLinkedInReply(first)
        conv.phase               = "awaiting_linkedin_reply"
        conv.linkedinReplyTarget = first
        conv.linkedinReplyQueue  = rest
        conv.linkedinRepliesSent = 0
        return {
            conversation_id:       conv.id,
            requires_confirmation: true,
            pending_tool: {
                name:  "send_linkedin_message",
                input: { to: first.sender, message: reply },
            },
        }
    }

    // ── LinkedIn: single reply ───────────────────────────────────────────────
    if (conv.phase === "inbox_shown" && isLinkedInReplyIntent(msg)) {
        const target =
            (conv.linkedinMessages ?? []).find((m) =>
                msg.toLowerCase().includes(m.sender.split(" ")[0].toLowerCase()),
            ) ?? conv.linkedinMessages?.[0]

        if (target) {
            const reply = generateLinkedInReply(target)
            conv.phase               = "awaiting_linkedin_reply"
            conv.linkedinReplyTarget = target
            conv.linkedinReplyQueue  = []
            return {
                conversation_id:       conv.id,
                requires_confirmation: true,
                pending_tool: {
                    name:  "send_linkedin_message",
                    input: { to: target.sender, message: reply },
                },
            }
        }
    }

    // ── Chitchat fallback ────────────────────────────────────────────────────
    const answer = chitchat(message, conv)
    addMsg(conv, "assistant", answer)
    return { conversation_id: conv.id, answer }
}

export async function mockReplyToConfirmation(
    conversationId: string,
    confirmed: boolean,
): Promise<ChatResponse> {
    const conv = store.get(conversationId)
    if (!conv) throw new Error(`Mock: conversation ${conversationId} not found`)

    // ── Search confirmation ──────────────────────────────────────────────────
    if (conv.phase === "awaiting_search") {
        if (!confirmed) {
            conv.phase = "idle"
            const answer = "Search cancelled. Let me know if you'd like to try a different query."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }

        await sleep(1400) // simulate search latency
        const targets = conv.pendingTargets ?? []
        const label   = conv.pendingLabel   ?? "contacts"
        const loc     = conv.pendingLocation

        conv.phase         = "results_shown"
        conv.foundTargets  = targets
        conv.campaignLabel = label

        const answer = `Found **${targets.length} ${label}**${loc ? ` near ${loc}` : ""}. Click **Send Email** on any contact, or use **Draft campaign** to send to all of them.`
        addMsg(conv, "assistant", answer)
        return {
            conversation_id: conv.id,
            answer,
            tool_result: {
                tool: "search_contacts",
                data: { targets, campaign_type: label },
            },
        }
    }

    // ── Email confirmation ───────────────────────────────────────────────────
    if (conv.phase === "awaiting_email") {
        const target = conv.emailTarget!
        const queue  = conv.emailQueue ?? []

        if (!confirmed) {
            if (queue.length > 0) {
                // Skip → next in queue
                const [next, ...rest] = queue
                const email = generateEmail(next, conv.campaignLabel ?? "IT open positions")
                conv.emailTarget = next
                conv.emailQueue  = rest
                return {
                    conversation_id:       conv.id,
                    requires_confirmation: true,
                    pending_tool: {
                        name:  "send_email",
                        input: { to: next.email, subject: email.subject, body: email.body },
                    },
                }
            }
            conv.phase = "results_shown"
            const sent   = conv.emailsSent ?? 0
            const answer = sent > 0
                ? `Cancelled remaining emails. **${sent} email${sent > 1 ? "s" : ""}** already sent.`
                : "Email cancelled."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }

        conv.emailsSent = (conv.emailsSent ?? 0) + 1

        if (queue.length > 0) {
            // Chain next confirmation
            const [next, ...rest] = queue
            const email = generateEmail(next, conv.campaignLabel ?? "IT open positions")
            conv.emailTarget = next
            conv.emailQueue  = rest
            return {
                conversation_id:       conv.id,
                requires_confirmation: true,
                pending_tool: {
                    name:  "send_email",
                    input: { to: next.email, subject: email.subject, body: email.body },
                },
            }
        }

        // All done
        conv.phase  = "results_shown"
        const total = conv.emailsSent
        const answer = total > 1
            ? `🎉 Campaign complete! All **${total} emails** sent successfully.`
            : `✅ Email sent to **${target.name}** at ${target.company}.`
        addMsg(conv, "assistant", answer)
        return { conversation_id: conv.id, answer }
    }

    // ── LinkedIn: inbox read confirmation ────────────────────────────────────
    if (conv.phase === "awaiting_inbox") {
        if (!confirmed) {
            conv.phase = "idle"
            const answer = "Inbox read cancelled."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }

        await sleep(800)
        const messages = LINKEDIN_INBOX
        conv.phase            = "inbox_shown"
        conv.linkedinMessages = messages
        const needsReply = messages.filter((m) => m.needs_reply).length
        const answer = `Found **${messages.length} messages** in your LinkedIn inbox — **${needsReply} need a reply**. Click **Draft reply** on any message, or say *"Auto-reply to all recruiters"* to handle them all at once.`
        addMsg(conv, "assistant", answer)
        return {
            conversation_id: conv.id,
            answer,
            tool_result: {
                tool: "read_linkedin_inbox",
                data: { messages },
            },
        }
    }

    // ── LinkedIn: message send confirmation ──────────────────────────────────
    if (conv.phase === "awaiting_linkedin_reply") {
        const target = conv.linkedinReplyTarget!
        const queue  = conv.linkedinReplyQueue ?? []

        if (!confirmed) {
            if (queue.length > 0) {
                const [next, ...rest] = queue
                const reply = generateLinkedInReply(next)
                conv.linkedinReplyTarget = next
                conv.linkedinReplyQueue  = rest
                return {
                    conversation_id:       conv.id,
                    requires_confirmation: true,
                    pending_tool: {
                        name:  "send_linkedin_message",
                        input: { to: next.sender, message: reply },
                    },
                }
            }
            conv.phase = "inbox_shown"
            const sent   = conv.linkedinRepliesSent ?? 0
            const answer = sent > 0
                ? `Cancelled remaining replies. **${sent} message${sent > 1 ? "s" : ""}** already sent.`
                : "Reply cancelled."
            addMsg(conv, "assistant", answer)
            return { conversation_id: conv.id, answer }
        }

        conv.linkedinRepliesSent = (conv.linkedinRepliesSent ?? 0) + 1

        if (queue.length > 0) {
            const [next, ...rest] = queue
            const reply = generateLinkedInReply(next)
            conv.linkedinReplyTarget = next
            conv.linkedinReplyQueue  = rest
            return {
                conversation_id:       conv.id,
                requires_confirmation: true,
                pending_tool: {
                    name:  "send_linkedin_message",
                    input: { to: next.sender, message: reply },
                },
            }
        }

        conv.phase  = "inbox_shown"
        const total = conv.linkedinRepliesSent
        const answer = total > 1
            ? `🎉 Done! **${total} LinkedIn messages** sent.`
            : `✅ Reply sent to **${target.sender}**.`
        addMsg(conv, "assistant", answer)
        return { conversation_id: conv.id, answer }
    }

    const answer = "No pending action."
    return { conversation_id: conv.id, answer }
}

// ── Chitchat responses ─────────────────────────────────────────────────────────

function chitchat(message: string, conv: ConvState): string {
    const m = message.toLowerCase()

    if (/\b(hi|hello|hey)\b/.test(m)) {
        return "Hi! I can help you run outreach campaigns and manage your LinkedIn inbox. Try:\n• *\"Find IT open positions in Austin\"*\n• *\"Find sales prospects at SaaS companies\"*\n• *\"Show my LinkedIn inbox\"*\n• *\"Auto-reply to all recruiters\"*"
    }

    if (/\b(help|what can|what do)\b/.test(m)) {
        return "I can:\n1. **Search** for IT jobs, sales leads, or press contacts\n2. **Draft personalised emails** and send campaigns\n3. **Read your LinkedIn inbox** and show recruiter messages\n4. **Auto-reply to recruiters** — CV requests, interview invites, opportunities\n5. All actions require your **explicit approval** before sending\n\nTry: *\"Show my LinkedIn inbox\"* or *\"Find IT open positions in Austin\"*"
    }

    if (conv.phase === "results_shown") {
        return "You can click **Send Email** on any contact card above, or say *\"Send campaign emails to all contacts\"* to kick off the bulk flow."
    }

    if (conv.phase === "inbox_shown") {
        return "You can click **Draft reply** on any message above, or say *\"Auto-reply to all recruiters\"* to handle them all at once."
    }

    return "I'm not sure I understood that. Try asking me to find contacts or run an outreach campaign — for example: *\"Find software engineer openings and send emails to the recruiters\"*"
}
