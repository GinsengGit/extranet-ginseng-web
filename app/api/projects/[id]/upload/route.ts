import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { writeFile } from "fs/promises"
import path from "path"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
  }

  // Enregistre le fichier dans /public/uploads
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `${Date.now()}-${file.name}`
  const filePath = path.join(process.cwd(), "public", "uploads", fileName)
  await writeFile(filePath, buffer)

  // Met à jour le projet dans MongoDB
  await client.connect()
  const db = client.db(dbName)
  const projects = db.collection("projects")
  await projects.updateOne(
    { _id: new ObjectId(params.id) },
    {
      $push: {
        files: {
          name: file.name,
          url: `/uploads/${fileName}`,
          uploadedAt: new Date().toISOString(),
        },
      },
    }
  )

  return NextResponse.json({ success: true })
}