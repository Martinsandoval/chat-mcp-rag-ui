import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const connected = searchParams.get("connected")
    const name      = searchParams.get("name") ?? ""
    const headline  = searchParams.get("headline") ?? ""
    const error     = searchParams.get("error")

    if (error || connected !== "1") {
        const msg = encodeURIComponent(error ?? "LinkedIn connection failed")
        redirect(`/integrations?linkedin_error=${msg}`)
    }

    const store = await cookies()
    store.set("linkedin_connected", "1",     { path: "/", maxAge: 60 * 60 * 24 * 30 })
    store.set("linkedin_name",      name,    { path: "/", maxAge: 60 * 60 * 24 * 30 })
    store.set("linkedin_headline",  headline, { path: "/", maxAge: 60 * 60 * 24 * 30 })

    redirect("/integrations")
}
