import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const connected = searchParams.get("connected")
    const email = searchParams.get("email") ?? ""
    const error = searchParams.get("error")

    if (error || connected !== "1") {
        redirect(`/integrations?drive_error=${error ?? "auth_failed"}`)
    }

    const store = await cookies()
    store.set("drive_connected", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 })
    store.set("drive_email", email, { path: "/", maxAge: 60 * 60 * 24 * 30 })

    redirect("/integrations")
}
