"use client"

import { CheckCircle2, XCircle, Link as LinkIcon, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
    connected: boolean
    email: string
    disconnectAction: () => Promise<void>
}

export function GoogleDriveConnectorCard({ connected, email, disconnectAction }: Props) {
    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted">
                        <HardDrive className="w-5 h-5 text-[#4285F4]" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Google Drive</CardTitle>
                        {connected && (
                            <p className="text-xs text-muted-foreground">Connected as: {email}</p>
                        )}
                    </div>
                </div>

                <Badge
                    className={`flex items-center gap-1 ${
                        connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
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
                        <p className="text-sm text-muted-foreground">
                            The AI can search and read files from your Google Drive.
                        </p>
                        <div className="pt-1">
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
                            Let the AI search and read files from your Google Drive.
                        </p>
                        <div className="pt-1">
                            <Button size="sm" className="flex items-center gap-2" asChild>
                                <a href="/api/auth/google-drive">
                                    <LinkIcon className="w-4 h-4" /> Connect Drive
                                </a>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
