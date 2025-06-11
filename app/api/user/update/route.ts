import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const USERS_FILE = path.resolve(process.cwd(), "users.json")

type User = {
  firstName: string
  lastName: string
  email: string
  password: string
  avatarUrl?: string
}

export async function PATCH(req: NextRequest) {
  const { email, avatarUrl } = await req.json()
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  let users: User[] = []
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"))
  }

  const idx = users.findIndex(u => u.email === email)
  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  users[idx].avatarUrl = avatarUrl
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

  const { password, ...safeUser } = users[idx]
  return NextResponse.json({ success: true, user: safeUser })
}