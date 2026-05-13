import Link from "next/link"
import { Mail, Shield, FileText, Send } from "lucide-react"

export default async function GmailConsentPage({
    searchParams,
}: {
    searchParams: Promise<{ callback_url?: string }>
}) {
    const { callback_url } = await searchParams
    const callbackPath = decodeURIComponent(callback_url ?? "/api/auth/gmail/callback")
    const allowHref = `${callbackPath}?code=mock_auth_code_${Math.random().toString(36).slice(2)}`

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">

                {/* Google header */}
                <div className="px-8 pt-8 pb-4 text-center border-b border-slate-100">
                    {/* Google logo wordmark */}
                    <div className="flex items-center justify-center gap-0.5 mb-6">
                        <span className="text-3xl font-semibold text-[#4285F4]">G</span>
                        <span className="text-3xl font-semibold text-[#EA4335]">o</span>
                        <span className="text-3xl font-semibold text-[#FBBC05]">o</span>
                        <span className="text-3xl font-semibold text-[#4285F4]">g</span>
                        <span className="text-3xl font-semibold text-[#34A853]">l</span>
                        <span className="text-3xl font-semibold text-[#EA4335]">e</span>
                    </div>

                    {/* App → account */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
                            L
                        </div>
                        <div className="h-px w-8 bg-slate-300" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                            <Mail className="w-5 h-5 text-[#EA4335]" />
                        </div>
                    </div>

                    <h1 className="text-lg font-semibold text-slate-800">
                        <span className="text-slate-500">Lucid</span> wants to access your<br />
                        Google Account
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">jane.doe@gmail.com</p>
                </div>

                {/* Permissions */}
                <div className="px-8 py-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        This will allow Lucid to
                    </p>

                    {[
                        { icon: <Mail className="w-4 h-4 text-slate-500" />,     label: "Read, compose, and send email on your behalf" },
                        { icon: <FileText className="w-4 h-4 text-slate-500" />, label: "Access email attachments and metadata" },
                        { icon: <Send className="w-4 h-4 text-slate-500" />,     label: "Create and manage Gmail drafts" },
                        { icon: <Shield className="w-4 h-4 text-slate-500" />,   label: "View your basic profile information" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{item.icon}</div>
                            <p className="text-sm text-slate-700">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Disclaimer */}
                <div className="px-8 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Make sure you trust Lucid. You may be sharing sensitive info.
                        See Lucid&apos;s{" "}
                        <span className="text-[#1a73e8] underline cursor-pointer">Privacy Policy</span>
                        {" "}and{" "}
                        <span className="text-[#1a73e8] underline cursor-pointer">Terms of Service</span>.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-100">
                    <Link
                        href="/integrations"
                        className="rounded-full px-5 py-2 text-sm font-medium text-[#1a73e8] hover:bg-blue-50 transition"
                    >
                        Cancel
                    </Link>
                    <Link
                        href={allowHref}
                        className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1765cc] transition"
                    >
                        Allow
                    </Link>
                </div>
            </div>
        </div>
    )
}
