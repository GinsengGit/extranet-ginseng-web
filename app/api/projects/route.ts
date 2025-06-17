import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { db } = await connectToDatabase()
    const collection = db.collection("projects")
    const result = await collection.insertOne(data)
    return NextResponse.json({ insertedId: result.insertedId })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("projects")
    const clientEmail = request.nextUrl.searchParams.get("clientEmail")
    let query = {}
    if (clientEmail) {
      query = { clientEmail }
    }
    const projects = await collection.find(query).toArray()
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}