import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId, GridFSBucket } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = await Promise.resolve(params)
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 })

    const fileName = file.name || `file-${projectId}-${Date.now()}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection("projects")
    const bucket = new GridFSBucket(db, { bucketName: "generalfiles" })

    // Upload dans GridFS
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: file.type || "application/octet-stream",
      metadata: { projectId }
    })
    uploadStream.end(buffer)
    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve)
      uploadStream.on("error", reject)
    })
    const fileId = uploadStream.id
    const now = new Date()

    // Ajout dans le tableau de fichiers généraux du projet
    await collection.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: {
          generalFiles: {
            fileId,
            fileName,
            uploadedAt: now,
            contentType: file.type || "application/octet-stream"
          }
        }
      }
    )

    return NextResponse.json({ fileId, fileName })
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 })
  }
}