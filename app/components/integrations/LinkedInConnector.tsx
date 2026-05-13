import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LinkedInConnectorCard } from "./LinkedInConnectorCard"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000"

async function disconnectLinkedIn() {
    "use server"
    try {
        await fetch(`${AI_SERVICE_URL}/auth/linkedin`, { method: "DELETE" })
    } catch {
        // Backend unreachable — clear local state anyway
    }
    const store = await cookies()
    store.delete("linkedin_connected")
    store.delete("linkedin_name")
    store.delete("linkedin_headline")
    redirect("/integrations")
}

export async function LinkedInConnector() {
    const store     = await cookies()
    const connected = store.get("linkedin_connected")?.value === "1"
    const name      = store.get("linkedin_name")?.value ?? ""
    const headline  = store.get("linkedin_headline")?.value ?? ""

    return (
        <LinkedInConnectorCard
            connected={connected}
            name={name}
            headline={headline}
            disconnectAction={disconnectLinkedIn}
        />
    )
}
