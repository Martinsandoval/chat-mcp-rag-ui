"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, FileText, FileSpreadsheet, File, Image, CheckCircle2, AlertCircle, X } from "lucide-react"
import type { FileStatus } from "@/lib/upload-api"

export interface QueueFile {
    id: string
    name: string
    type: "pdf" | "xlsx" | "docx" | "image" | "other"
    progress: number
    status?: FileStatus
    error?: string | null
}

function FileIcon({ type }: { type: QueueFile["type"] }) {
    if (type === "pdf") return <FileText className="text-red-500" size={20} />
    if (type === "xlsx") return <FileSpreadsheet className="text-green-600" size={20} />
    if (type === "docx") return <File className="text-blue-500" size={20} />
    if (type === "image") return <Image className="text-purple-500" size={20} />
    return <File className="text-slate-500" size={20} />
}

const STATUS_LABELS: Record<FileStatus, string> = {
    queued:     "Queued",
    extracting: "Extracting...",
    chunking:   "Chunking...",
    indexing:   "Indexing...",
    completed:  "Ready",
    error:      "Error",
}

function statusLabel(file: QueueFile): string {
    if (file.status) return STATUS_LABELS[file.status]
    if (file.progress >= 100) return "Ready"
    if (file.progress > 0)    return "Processing..."
    return "Queued"
}

function isDone(file: QueueFile) {
    return file.status === "completed" || file.progress >= 100
}

interface Props {
    files: QueueFile[]
    onRemove?: (id: string) => void
}

export default function UploadQueue({ files, onRemove }: Props) {
    if (files.length === 0) return null

    const pending = files.filter((f) => !isDone(f) && f.status !== "error")

    return (
        <Card className="w-full rounded-2xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Upload Queue</CardTitle>
                {pending.length > 0 && <Loader2 className="animate-spin" />}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    {pending.length > 0
                        ? `Processing (${pending.length} of ${files.length} files remaining)`
                        : `All ${files.length} files ready`}
                </div>

                {files.map((file) => (
                    <div
                        key={file.id}
                        className="flex items-center gap-4 rounded-xl border p-3"
                    >
                        <FileIcon type={file.type} />

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {Math.round(file.progress)}%
                                </span>
                            </div>
                            <Progress
                                value={file.progress}
                                className="h-2 mt-1"
                            />
                            {file.error && (
                                <p className="text-xs text-destructive mt-1">{file.error}</p>
                            )}
                        </div>

                        <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            {isDone(file) && (
                                <CheckCircle2 size={16} className="text-green-500" />
                            )}
                            {file.status === "error" && (
                                <AlertCircle size={16} className="text-destructive" />
                            )}
                            {statusLabel(file)}
                        </div>

                        {onRemove && (
                            <button
                                onClick={() => onRemove(file.id)}
                                className="ml-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
