import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Link as LinkIcon,
    Settings,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { ReactNode } from "react";
import { ApiSdkConnector } from "@/app/components/integrations/ApiSdkConnector";
import { GmailConnector } from "@/app/components/integrations/GmailConnector";
import { GoogleDriveConnector } from "@/app/components/integrations/GoogleDriveConnector";
import { LinkedInConnector } from "@/app/components/integrations/LinkedInConnector";

// ----------------------
// Types
// ----------------------

type IntegrationStatus = "connected" | "disconnected" | "offline";

interface IntegrationToggle {
    label: string;
    enabled: boolean;
}

interface IntegrationCardProps {
    title: string;
    description?: string;
    icon: ReactNode;
    status?: IntegrationStatus;
    meta?: string; // e.g. "Connected as..."
    toggles?: IntegrationToggle[];
    primaryAction?: {
        label: string;
        icon?: ReactNode;
        onClick?: () => void;
    };
    secondaryAction?: {
        label: string;
        icon?: ReactNode;
        onClick?: () => void;
    };
}

// ----------------------
// Reusable Card
// ----------------------

function StatusBadge({ status }: { status?: IntegrationStatus }) {
    if (!status) return null;

    const map = {
        connected: {
            label: "Connected",
            icon: <CheckCircle2 className="w-3 h-3" />,
            className: "bg-green-100 text-green-700",
        },
        disconnected: {
            label: "Disconnected",
            icon: <XCircle className="w-3 h-3" />,
            className: "bg-gray-100 text-gray-600",
        },
        offline: {
            label: "Offline",
            icon: <XCircle className="w-3 h-3" />,
            className: "bg-yellow-100 text-yellow-700",
        },
    } as const;

    const s = map[status];

    return (
        <Badge className={`flex items-center gap-1 ${s.className}`}>
            {s.icon}
            {s.label}
        </Badge>
    );
}

function IntegrationCard({
                             title,
                             description,
                             icon,
                             status,
                             meta,
                             toggles,
                             primaryAction,
                             secondaryAction,
                         }: IntegrationCardProps) {
    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted">{icon}</div>
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {title}
                        </CardTitle>
                        {meta && (
                            <p className="text-xs text-muted-foreground">{meta}</p>
                        )}
                    </div>
                </div>

                <StatusBadge status={status} />
            </CardHeader>

            <CardContent className="space-y-3">
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}

                {toggles && (
                    <div className="space-y-2">
                        {toggles.map((t, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm">{t.label}</span>
                                <Switch checked={t.enabled} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                    {primaryAction && (
                        <Button size="sm" className="flex items-center gap-2">
                            {primaryAction.icon}
                            {primaryAction.label}
                        </Button>
                    )}

                    {secondaryAction && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            {secondaryAction.icon}
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ----------------------
// Page
// ----------------------

export default function IntegrationsPage() {
    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <h1 className="text-2xl font-semibold">Integrations Hub</h1>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search all integration services..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Sections */}
            <Section title="Communication & Scheduling">
                <GmailConnector />
                <LinkedInConnector />

                <IntegrationCard
                    title="Google Calendar"
                    icon={<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ2vAS2SCtpbcgYzwDxrtjDXSqjpRYfhoUjw&s" className="w-5 h-5" />}
                    description="Sync events with AI"
                    status="disconnected"
                    primaryAction={{
                        label: "Connect Calendar",
                        icon: <LinkIcon className="w-4 h-4" />,
                    }}
                />
            </Section>

            <Section title="Document & Data Storage">
                <GoogleDriveConnector />

                <IntegrationCard
                    title="Dropbox"
                    icon={<img src="https://static.vecteezy.com/system/resources/previews/016/716/456/non_2x/dropbox-icon-free-png.png" className="w-5 h-5" />}
                    status="connected"
                    toggles={[
                        { label: "Sync attachments", enabled: true },
                        { label: "Sync & store opticates", enabled: false },
                    ]}
                />
            </Section>

            <Section title="Finance & Productivity">
                <IntegrationCard
                    title="QuickBooks Online"
                    icon={<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQLKH3j_aKYxFu-eZn1NRaR7T3yIx4z2EieA&s" className="w-5 h-5" />}
                    description="Automate invoice data"
                    primaryAction={{
                        label: "Connect QBO",
                        icon: <LinkIcon className="w-4 h-4" />,
                    }}
                />

                <IntegrationCard
                    title="Trello"
                    icon={<img src="https://images.icon-icons.com/836/PNG/512/Trello_icon-icons.com_66775.png" className="w-5 h-5" />}
                    description="Sync project updates"
                    primaryAction={{
                        label: "Connect Trello",
                        icon: <LinkIcon className="w-4 h-4" />,
                    }}
                />

                <IntegrationCard
                    title="Slack"
                    icon={<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/3840px-Slack_icon_2019.svg.png" className="w-5 h-5" />}
                    description="Real-time notifications"
                    status="connected"
                    secondaryAction={{
                        label: "Configuration",
                        icon: <Settings className="w-4 h-4" />,
                    }}
                />
            </Section>

            <Section title="Custom & REST APIs">
                <ApiSdkConnector />
            </Section>

            <Section title="Advanced MCP Tools (Developer Hub)">
                <IntegrationCard
                    title="Model Context MCP"
                    icon={<img src="https://cdn.worldvectorlogo.com/logos/openai-2.svg" className="w-5 h-5" />}
                    description="Create & manage Model Context Protocols"
                    status="connected"
                    primaryAction={{
                        label: "Open MCP Developer Hub",
                        icon: <LinkIcon className="w-4 h-4" />,
                    }}
                />
            </Section>
        </div>
    );
}

// ----------------------
// Section Wrapper
// ----------------------

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {children}
            </div>
        </div>
    );
}
