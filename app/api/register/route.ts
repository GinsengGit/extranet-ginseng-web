import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password, avatarUrl } = await req.json()

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await client.connect()
  const db = client.db(dbName)
  const users = db.collection("users")

  const existing = await users.findOne({ email })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await users.insertOne({ firstName, lastName, email, password: hashedPassword, avatarUrl, role: "client" })

  return NextResponse.json({ success: true })
}