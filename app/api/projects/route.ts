import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI! 
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX" 

export async function POST(request: NextRequest) {
  const data = await request.json()
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const result = await collection.insertOne(data)
  return NextResponse.json({ insertedId: result.insertedId })
}

export async function GET(request: NextRequest) {
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const clientEmail = request.nextUrl.searchParams.get("clientEmail")
  let query = {}
  if (clientEmail) {
    query = { clientEmail }
  }
  const projects = await collection.find(query).toArray()
  return NextResponse.json(projects)
}