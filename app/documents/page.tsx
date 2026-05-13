"use client"

import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import UploadQueue, { type QueueFile } from "@/app/components/common/UploadQueue"
import { UploadDropzone } from "@/app/components/common/UploadDropzone"
import { uploadFiles, fetchUploadStatus, deleteFile, type UploadedFile } from "@/lib/upload-api"

function toFileType(file: UploadedFile): QueueFile["type"] {
    const name = file.filename.toLowerCase()
    const mime = file.mime_type ?? ""
    if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf"
    if (name.endsWith(".xlsx")) return "xlsx"
    if (name.endsWith(".docx")) return "docx"
    if (mime.startsWith("image/")) return "image"
    return "other"
}

function toQueueFile(file: UploadedFile): QueueFile {
    return {
        id:       file.id,
        name:     file.filename,
        type:     toFileType(file),
        progress: file.progress,
        status:   file.status,
        error:    file.error,
    }
}

const QUERY_KEY = ["upload-status"] as const

export default function Documents() {
    const queryClient = useQueryClient()

    const { data } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchUploadStatus,
        refetchInterval: (query) => {
            const files = query.state.data?.files ?? []
            const anyPending = files.some(
                (f) => f.status !== "completed" && f.status !== "error"
            )
            return anyPending ? 1500 : false
        },
    })

    const { mutate: upload, isPending } = useMutation({
        mutationFn: uploadFiles,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    })

    const { mutate: remove } = useMutation({
        mutationFn: deleteFile,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    })

    const handleFilesAdded = useCallback(
        (files: File[]) => upload(files),
        [upload]
    )

    const queueFiles: QueueFile[] = (data?.files ?? []).map(toQueueFile)

    return (
        <div className="flex flex-col gap-16 p-8">
            <UploadDropzone onFilesAdded={handleFilesAdded} uploading={isPending} />
            <UploadQueue files={queueFiles} onRemove={remove} />
        </div>
    )
}
