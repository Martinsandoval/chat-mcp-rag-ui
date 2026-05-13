import { redirect } from "next/navigation"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000"

export async function GET() {
    redirect(`${AI_SERVICE_URL}/auth/google-drive`)
}
