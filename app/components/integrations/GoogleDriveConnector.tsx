import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { GoogleDriveConnectorCard } from "./GoogleDriveConnectorCard"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000"

async function disconnectDrive() {
    "use server"
    try {
        await fetch(`${AI_SERVICE_URL}/auth/google-drive`, { method: "DELETE" })
    } catch {
        // Backend unreachable — clear local state anyway
    }
    const store = await cookies()
    store.delete("drive_connected")
    store.delete("drive_email")
    redirect("/integrations")
}

export async function GoogleDriveConnector() {
    const store = await cookies()
    const connected = store.get("drive_connected")?.value === "1"
    const email = store.get("drive_email")?.value ?? ""

    return (
        <GoogleDriveConnectorCard
            connected={connected}
            email={email}
            disconnectAction={disconnectDrive}
        />
    )
}
