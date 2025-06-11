import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"
const uploadDir = join(process.cwd(), "public", "uploads")

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id
  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 })

  await mkdir(uploadDir, { recursive: true })
  const fileName = `cahier-des-charges-${projectId}-${Date.now()}.pdf`
  const filePath = join(uploadDir, fileName)
  const arrayBuffer = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(arrayBuffer))

  // Enregistrer l'URL dans MongoDB
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const url = `/uploads/${fileName}`
  // Met à jour l'étape id:2
  await collection.updateOne(
    { _id: new ObjectId(projectId), "stages.id": 2 },
    { $set: { "stages.$.cahierDesChargesUrl": url } }
  )
  return NextResponse.json({ url })
}
