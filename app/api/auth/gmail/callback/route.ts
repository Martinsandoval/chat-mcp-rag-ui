import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Called by the ai-service after a successful Google OAuth exchange.
// Expected query params: connected=1&email=user@gmail.com
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const connected = searchParams.get("connected")
    const email     = searchParams.get("email") ?? ""
    const error     = searchParams.get("error")

    if (error || connected !== "1") {
        redirect(`/integrations?gmail_error=${error ?? "auth_failed"}`)
    }

    const store = await cookies()
    store.set("gmail_connected", "1",   { path: "/", maxAge: 60 * 60 * 24 * 30 })
    store.set("gmail_email",    email,  { path: "/", maxAge: 60 * 60 * 24 * 30 })

    redirect("/integrations")
}
