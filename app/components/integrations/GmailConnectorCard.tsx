"use client"

import { useState } from "react"
import { Mail, Settings, CheckCircle2, XCircle, Link as LinkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Props {
    connected: boolean
    email: string
    disconnectAction: () => Promise<void>
}

export function GmailConnectorCard({ connected, email, disconnectAction }: Props) {
    const [importAttachments, setImportAttachments] = useState(true)
    const [analyzeContent, setAnalyzeContent]       = useState(true)

    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted">
                        <Mail className="w-5 h-5 text-[#EA4335]" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Gmail</CardTitle>
                        {connected && (
                            <p className="text-xs text-muted-foreground">Connected as: {email}</p>
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
                                <span className="text-sm">Import Attachments</span>
                                <Switch
                                    checked={importAttachments}
                                    onCheckedChange={setImportAttachments}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Analyze Content</span>
                                <Switch
                                    checked={analyzeContent}
                                    onCheckedChange={setAnalyzeContent}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Configure Sync
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
                            Read emails, send messages, and manage drafts directly from the chat.
                        </p>
                        <div className="pt-1">
                            <Button size="sm" className="flex items-center gap-2" asChild>
                                <a href="/api/auth/gmail">
                                    <LinkIcon className="w-4 h-4" /> Connect Gmail
                                </a>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
