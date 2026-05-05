import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const dbName = "ma-base-de-données-SpaceX"

function createMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("Missing MONGODB_URI environment variable")
  return new MongoClient(uri)
}

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password, avatarUrl } = await req.json()

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const client = createMongoClient()
  try {
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
  } finally {
    await client.close()
  }
}