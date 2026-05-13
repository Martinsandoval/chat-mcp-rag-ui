import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { GmailConnectorCard } from "./GmailConnectorCard"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000"

async function disconnectGmail() {
    "use server"
    try {
        await fetch(`${AI_SERVICE_URL}/auth/gmail`, { method: "DELETE" })
    } catch {
        // Backend unreachable — clear local state anyway
    }
    const store = await cookies()
    store.delete("gmail_connected")
    store.delete("gmail_email")
    redirect("/integrations")
}

export async function GmailConnector() {
    const store = await cookies()
    const connected = store.get("gmail_connected")?.value === "1"
    const email     = store.get("gmail_email")?.value ?? ""

    return (
        <GmailConnectorCard
            connected={connected}
            email={email}
            disconnectAction={disconnectGmail}
        />
    )
}
