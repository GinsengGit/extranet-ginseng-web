import { NextResponse } from "next/server"
import clientPromise from "@/lib/mangodb"

const dbName = "ma-base-de-données-SpaceX"

export async function GET() {
  const client = await clientPromise
  const db = client.db(dbName)
  const users = await db.collection("users").find({ role: "admin" }).toArray()
  return NextResponse.json(users.map(u => ({ email: u.email, firstName: u.firstName, lastName: u.lastName })))
}

export async function POST(req: Request) {
  const { email } = await req.json()
  const client = await clientPromise
  const db = client.db(dbName)
  await db.collection("users").updateOne(
    { email },
    { $set: { role: "admin" } },
    { upsert: false }
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 })
  const client = await clientPromise
  const db = client.db(dbName)
  await db.collection("users").updateOne(
    { email, role: "admin" },
    { $set: { role: "client" } }
  )
  return NextResponse.json({ success: true })
}
