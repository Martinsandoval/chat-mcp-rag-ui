"use client"

import { useState } from "react"
import { Settings, CheckCircle2, XCircle, Link as LinkIcon, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

interface Props {
    connected: boolean
    name: string
    headline: string
    disconnectAction: () => Promise<void>
}

export function LinkedInConnectorCard({ connected, name, headline, disconnectAction }: Props) {
    const [autoReply,    setAutoReply]    = useState(true)
    const [monitorInbox, setMonitorInbox] = useState(true)
    const [trackConns,   setTrackConns]   = useState(false)

    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0A66C2]/10">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0A66C2]" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">LinkedIn</CardTitle>
                        {connected && name && (
                            <p className="text-xs text-muted-foreground">
                                {name}{headline ? ` · ${headline}` : ""}
                            </p>
                        )}
                    </div>
                </div>

                <Badge
                    className={`flex items-center gap-1 ${
                        connected
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    {connected ? (
                        <><CheckCircle2 className="w-3 h-3" /> Connected</>
                    ) : (
                        <><XCircle className="w-3 h-3" /> Disconnected</>
                    )}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-3">
                {connected ? (
                    <>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm">Auto-reply to recruiters</span>
                                    <p className="text-xs text-muted-foreground">CV requests, interview invites</p>
                                </div>
                                <Switch checked={autoReply} onCheckedChange={setAutoReply} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Monitor inbox</span>
                                <Switch checked={monitorInbox} onCheckedChange={setMonitorInbox} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Track connection requests</span>
                                <Switch checked={trackConns} onCheckedChange={setTrackConns} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button size="sm" className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182]" asChild>
                                <Link href="/chats">
                                    <MessageSquare className="w-4 h-4" /> Open Inbox in Chat
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Configure
                            </Button>
                            <form action={disconnectAction}>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                >
                                    Disconnect
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Read your inbox, auto-reply to recruiters, send messages, and track
                            connection requests — all from the chat. Powered by Unipile.
                        </p>
                        <div className="pt-1">
                            <Button
                                size="sm"
                                className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182]"
                                asChild
                            >
                                <a href="/api/auth/linkedin">
                                    <LinkIcon className="w-4 h-4" /> Connect LinkedIn
                                </a>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
