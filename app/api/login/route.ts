import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await client.connect()
  const db = client.db(dbName)
  const users = db.collection("users")

  const user = await users.findOne({ email })
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || "client",
      avatarUrl: user.avatarUrl || null,
    }
  })
}