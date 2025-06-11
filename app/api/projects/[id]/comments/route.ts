import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, text } = await request.json()
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
  return NextResponse.json({ success: true })
}



export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  await collection.updateOne(
    { _id: new ObjectId(params.id) },
    { $set: body }
  )
  return NextResponse.json({ success: true })
}