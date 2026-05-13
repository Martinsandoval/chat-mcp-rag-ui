"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
    page: number
    totalPages: number
    onChange: (page: number) => void
    className?: string
}

function pageNumbers(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: (number | "…")[] = [1]

    const left = Math.max(2, current - 1)
    const right = Math.min(total - 1, current + 1)

    if (left > 2) pages.push("…")
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < total - 1) pages.push("…")

    pages.push(total)
    return pages
}

export function Pagination({ page, totalPages, onChange, className }: Props) {
    if (totalPages <= 1) return null

    const pages = pageNumbers(page, totalPages)

    return (
        <div className={cn("flex items-center justify-center gap-1", className)}>
            <button
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {pages.map((p, i) =>
                p === "…" ? (
                    <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors",
                            p === page
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:bg-accent disabled:pointer-events-none"
                        )}
                        aria-current={p === page ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}
