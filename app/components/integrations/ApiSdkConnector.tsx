"use client"

import { useState, useEffect } from "react"
import {
    Code2, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle,
    Loader2, Link as LinkIcon, Settings, Search, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

// ----------------------
// Types
// ----------------------

type Step = "auth" | "discovering" | "endpoints"
type AuthMethod = "bearer" | "api-key" | "basic"

interface ApiEndpoint {
    id: string
    method: "GET" | "POST"
    path: string
    description: string
    enabled: boolean
}

interface ConnectedConfig {
    baseUrl: string
    authMethod: AuthMethod
    endpoints: ApiEndpoint[]
}

// ----------------------
// Mock discovery data
// ----------------------

const MOCK_ENDPOINTS: ApiEndpoint[] = [
    { id: "1", method: "GET",  path: "/api/users",             description: "List all users",          enabled: true  },
    { id: "2", method: "GET",  path: "/api/users/{id}",        description: "Get user by ID",           enabled: true  },
    { id: "3", method: "GET",  path: "/api/products",          description: "List all products",        enabled: true  },
    { id: "4", method: "GET",  path: "/api/orders",            description: "List orders",              enabled: false },
    { id: "5", method: "GET",  path: "/api/reports/summary",   description: "Fetch summary report",     enabled: true  },
    { id: "6", method: "POST", path: "/api/orders",            description: "Create a new order",       enabled: false },
    { id: "7", method: "POST", path: "/api/messages/send",     description: "Send a message",           enabled: true  },
    { id: "8", method: "POST", path: "/api/webhooks/trigger",  description: "Trigger a webhook event",  enabled: false },
]

// ----------------------
// Endpoint group
// ----------------------

interface EndpointGroupProps {
    label: string
    badgeColor: string
    endpoints: ApiEndpoint[]
    onToggle: (id: string) => void
}

function EndpointGroup({ label, badgeColor, endpoints, onToggle }: EndpointGroupProps) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            {endpoints.map((ep) => (
                <div key={ep.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                    <span className={`shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                        {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{ep.path}</p>
                        <p className="text-xs text-muted-foreground">{ep.description}</p>
                    </div>
                    <Switch
                        checked={ep.enabled}
                        onCheckedChange={() => onToggle(ep.id)}
                    />
                </div>
            ))}
        </div>
    )
}

// ----------------------
// Main connector
// ----------------------

export function ApiSdkConnector() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>("auth")
    const [baseUrl, setBaseUrl] = useState("")
    const [apiKey, setApiKey] = useState("")
    const [showKey, setShowKey] = useState(false)
    const [authMethod, setAuthMethod] = useState<AuthMethod>("bearer")
    const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
    const [search, setSearch] = useState("")
    const [error, setError] = useState("")
    const [config, setConfig] = useState<ConnectedConfig | null>(null)

    const isConnected = config !== null
    const enabledCount = endpoints.filter((e) => e.enabled).length

    const hostname = (() => {
        try { return new URL(config?.baseUrl ?? baseUrl).hostname }
        catch { return config?.baseUrl ?? baseUrl }
    })()

    // Simulate endpoint discovery after authenticating
    useEffect(() => {
        if (step !== "discovering") return
        const timer = setTimeout(() => {
            setEndpoints(MOCK_ENDPOINTS.map((e) => ({ ...e })))
            setStep("endpoints")
        }, 1600)
        return () => clearTimeout(timer)
    }, [step])

    function openDialog() {
        if (config) {
            setBaseUrl(config.baseUrl)
            setAuthMethod(config.authMethod)
            setEndpoints(config.endpoints)
            setStep("endpoints")
        } else {
            setStep("auth")
            setBaseUrl("")
            setApiKey("")
            setAuthMethod("bearer")
            setEndpoints([])
            setError("")
        }
        setSearch("")
        setOpen(true)
    }

    function handleAuthenticate() {
        if (!baseUrl.trim() || !apiKey.trim()) {
            setError("Base URL and API Key are required.")
            return
        }
        setError("")
        setStep("discovering")
    }

    function toggleEndpoint(id: string) {
        setEndpoints((prev) =>
            prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
        )
    }

    function handleSave() {
        setConfig({ baseUrl, authMethod, endpoints })
        setOpen(false)
    }

    function handleDisconnect() {
        setConfig(null)
        setEndpoints([])
    }

    const filtered = endpoints.filter(
        (e) =>
            e.path.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase())
    )
    const getEndpoints  = filtered.filter((e) => e.method === "GET")
    const postEndpoints = filtered.filter((e) => e.method === "POST")

    return (
        <>
            {/* ---- Card ---- */}
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">
                                API SDK Integration
                            </CardTitle>
                            {isConnected && (
                                <p className="text-xs text-muted-foreground">{hostname}</p>
                            )}
                        </div>
                    </div>

                    <Badge
                        className={`flex items-center gap-1 ${
                            isConnected
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {isConnected ? (
                            <><CheckCircle2 className="w-3 h-3" /> Connected</>
                        ) : (
                            <><XCircle className="w-3 h-3" /> Disconnected</>
                        )}
                    </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                    {isConnected ? (
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{enabledCount}</span> of{" "}
                            {endpoints.length} endpoints active in chat
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Connect any REST API — the chat will use its GET queries and POST actions when relevant.
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={openDialog}
                        >
                            {isConnected ? (
                                <><Settings className="w-4 h-4" /> Configure</>
                            ) : (
                                <><LinkIcon className="w-4 h-4" /> Connect API</>
                            )}
                        </Button>

                        {isConnected && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={handleDisconnect}
                            >
                                Disconnect
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ---- Dialog ---- */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">

                    {/* Step 1 — Auth */}
                    {step === "auth" && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4" /> Connect API SDK
                                </DialogTitle>
                                <DialogDescription>
                                    Enter your credentials to authenticate and discover available endpoints.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-1">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Base URL</label>
                                    <Input
                                        placeholder="https://api.yourapp.com"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="relative">
                                        <Input
                                            type={showKey ? "text" : "password"}
                                            placeholder="sk-••••••••••••••••"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="pr-10"
                                            onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowKey((v) => !v)}
                                        >
                                            {showKey
                                                ? <EyeOff className="w-4 h-4" />
                                                : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Auth Method</label>
                                    <Select
                                        value={authMethod}
                                        onValueChange={(v) => setAuthMethod(v as AuthMethod)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bearer">Bearer Token</SelectItem>
                                            <SelectItem value="api-key">API-Key Header</SelectItem>
                                            <SelectItem value="basic">Basic Auth</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button onClick={handleAuthenticate} className="flex items-center gap-2">
                                    Authenticate <Zap className="w-4 h-4" />
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {/* Step 2 — Discovering */}
                    {step === "discovering" && (
                        <div className="flex flex-col items-center justify-center gap-4 py-14">
                            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                            <div className="text-center space-y-1">
                                <p className="font-medium">Discovering endpoints...</p>
                                <p className="text-sm text-muted-foreground">{baseUrl}</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Endpoints */}
                    {step === "endpoints" && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    {endpoints.length} Endpoints Discovered
                                </DialogTitle>
                                <DialogDescription>
                                    Enable the endpoints you want the chat to use.{" "}
                                    <span className="font-medium text-foreground">GET</span> queries read data;{" "}
                                    <span className="font-medium text-foreground">POST</span> actions write it.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter endpoints..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="max-h-72">
                                <div className="space-y-5 pr-1">
                                    {getEndpoints.length > 0 && (
                                        <EndpointGroup
                                            label="GET Queries"
                                            badgeColor="text-blue-600 bg-blue-50"
                                            endpoints={getEndpoints}
                                            onToggle={toggleEndpoint}
                                        />
                                    )}
                                    {postEndpoints.length > 0 && (
                                        <EndpointGroup
                                            label="POST Actions"
                                            badgeColor="text-orange-600 bg-orange-50"
                                            endpoints={postEndpoints}
                                            onToggle={toggleEndpoint}
                                        />
                                    )}
                                    {filtered.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No endpoints match your filter.
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={() => { setStep("auth"); setSearch("") }}
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button onClick={handleSave} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save & Connect
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                </DialogContent>
            </Dialog>
        </>
    )
}
