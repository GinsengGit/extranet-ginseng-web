import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const dbName = "ma-base-de-données-SpaceX"

function createMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("Missing MONGODB_URI environment variable")
  return new MongoClient(uri)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, text } = await request.json()
  const client = createMongoClient()
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const comment = {
    id: Date.now(),
    user,
    text,
    date: new Date().toISOString().split("T")[0],
  }
  await collection.updateOne(
    { _id: new ObjectId(params.id) },
    { $push: { comments: comment } }
  )
  await client.close()
  return NextResponse.json({ success: true })
}



export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const client = createMongoClient()
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  await collection.updateOne(
    { _id: new ObjectId(params.id) },
    { $set: body }
  )
  await client.close()
  return NextResponse.json({ success: true })
}