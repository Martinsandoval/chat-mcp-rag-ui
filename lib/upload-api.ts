export type FileStatus =
    | "queued"
    | "extracting"
    | "chunking"
    | "indexing"
    | "completed"
    | "error"

export interface UploadedFile {
    id: string
    filename: string
    mime_type: string
    size_bytes: number
    status: FileStatus
    progress: number
    chunks_indexed: number | null
    error: string | null
    uploaded_at: string
}

export interface UploadResponse {
    queued: Array<{
        id?: string
        filename: string
        status: string
        progress: number
        error?: string
    }>
}

export interface StatusResponse {
    files: UploadedFile[]
}

const BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:5000"

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
    const body = new FormData()
    files.forEach((f) => body.append("files", f))

    const res = await fetch(`${BASE}/upload`, { method: "POST", body })
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
    return res.json()
}

export async function fetchUploadStatus(): Promise<StatusResponse> {
    const res = await fetch(`${BASE}/upload/status`)
    if (!res.ok) throw new Error(`Status check failed: ${res.status} ${res.statusText}`)
    return res.json()
}

export async function deleteFile(id: string): Promise<void> {
    const res = await fetch(`${BASE}/upload/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error(`Delete failed: ${res.status} ${res.statusText}`)
}
