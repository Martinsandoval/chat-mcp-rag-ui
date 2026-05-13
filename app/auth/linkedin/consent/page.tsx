import Link from "next/link"
import { MessageSquare, Users, Rss, Shield, Bell } from "lucide-react"

export default async function LinkedInConsentPage({
    searchParams,
}: {
    searchParams: Promise<{ callback_url?: string }>
}) {
    const { callback_url } = await searchParams
    const callbackPath = decodeURIComponent(callback_url ?? "/api/auth/linkedin/callback")
    const allowHref = `${callbackPath}?connected=1&name=${encodeURIComponent("Martin Sandoval")}&headline=${encodeURIComponent("Software Engineer")}`

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">

                {/* LinkedIn header */}
                <div className="px-8 pt-8 pb-4 text-center border-b border-slate-100">
                    {/* LinkedIn wordmark */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0A66C2]">
                            <span className="text-white font-black text-lg leading-none">in</span>
                        </div>
                        <span className="text-2xl font-semibold text-slate-800 tracking-tight">LinkedIn</span>
                    </div>

                    {/* App → account */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
                            A
                        </div>
                        <div className="h-px w-8 bg-slate-300" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/20">
                            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2]">
                                <span className="text-white font-black text-xs leading-none">in</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-lg font-semibold text-slate-800">
                        <span className="text-slate-500">Aura</span> wants to access your<br />
                        LinkedIn account
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">martin.sandoval@linkedin.com</p>
                </div>

                {/* Permissions */}
                <div className="px-8 py-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        This will allow Aura to
                    </p>

                    {[
                        { icon: <MessageSquare className="w-4 h-4 text-slate-500" />, label: "Read and send LinkedIn messages on your behalf" },
                        { icon: <Rss className="w-4 h-4 text-slate-500" />,          label: "Read your LinkedIn feed and posts" },
                        { icon: <Users className="w-4 h-4 text-slate-500" />,        label: "View your connections and connection requests" },
                        { icon: <Bell className="w-4 h-4 text-slate-500" />,         label: "Receive notifications for recruiter messages" },
                        { icon: <Shield className="w-4 h-4 text-slate-500" />,       label: "View your basic profile information" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{item.icon}</div>
                            <p className="text-sm text-slate-700">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Unipile note */}
                <div className="px-8 py-3 bg-blue-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Aura connects via{" "}
                        <span className="font-medium text-[#0A66C2]">Unipile</span>
                        {" "}— a secure LinkedIn integration partner. Your credentials are
                        never stored by Aura.
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="px-8 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Make sure you trust Aura. You may be sharing sensitive info.
                        See Aura&apos;s{" "}
                        <span className="text-[#0A66C2] underline cursor-pointer">Privacy Policy</span>
                        {" "}and{" "}
                        <span className="text-[#0A66C2] underline cursor-pointer">Terms of Service</span>.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-100">
                    <Link
                        href="/integrations"
                        className="rounded-full px-5 py-2 text-sm font-medium text-[#0A66C2] hover:bg-blue-50 transition"
                    >
                        Cancel
                    </Link>
                    <Link
                        href={allowHref}
                        className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-medium text-white hover:bg-[#004182] transition"
                    >
                        Allow
                    </Link>
                </div>
            </div>
        </div>
    )
}
