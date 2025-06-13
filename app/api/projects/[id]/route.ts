import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

// Mettre à jour un projet (ex: étapes)
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { params } = await Promise.resolve(context); // Correction Next.js: params doit être awaited
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

// Supprimer un projet
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  await collection.deleteOne({ _id: new ObjectId(params.id) })
  return NextResponse.json({ success: true })
}

// (Optionnel) Récupérer un projet par son id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const { id } = await Promise.resolve(params)
  const project = await collection.findOne({ _id: new ObjectId(id) })
  return NextResponse.json(project)
}