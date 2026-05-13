"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, Folder, HardDrive, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
    onFilesAdded: (files: File[]) => void
    uploading?: boolean
}

export function UploadDropzone({ onFilesAdded, uploading = false }: Props) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) onFilesAdded(acceptedFiles)
        },
        [onFilesAdded]
    )

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true,
        multiple: true,
        disabled: uploading,
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
        },
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative flex w-full cursor-default flex-col items-center justify-center rounded-xl border bg-white/70 p-8 text-center shadow-sm backdrop-blur transition",
                isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50",
                uploading && "opacity-60 pointer-events-none"
            )}
        >
            <input {...getInputProps()} />

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-400">
                {uploading
                    ? <Loader2 className="h-8 w-8 text-white animate-spin" />
                    : <UploadCloud className="h-8 w-8 text-white" />
                }
            </div>

            <h2 className="text-xl font-semibold">
                {uploading
                    ? "Uploading..."
                    : isDragActive
                        ? "Drop files here"
                        : "Drag & drop files here, or"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
                Supported: PDF, DOCX, XLSX, PNG, JPG
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                    type="button"
                    onClick={open}
                    disabled={uploading}
                    className="flex items-center gap-2"
                >
                    <Folder className="h-4 w-4" />
                    Upload Files
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center gap-2"
                >
                    <HardDrive className="h-4 w-4" />
                    Connect Drive
                </Button>
            </div>
        </div>
    )
}