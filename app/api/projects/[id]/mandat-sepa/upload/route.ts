import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId, GridFSBucket } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = await Promise.resolve(params)
    const formData = await req.formData()
    const file = formData.get("file") as File
    const stageId = formData.get("stageId") as string
    if (!file) return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 })
    if (!stageId) return NextResponse.json({ error: "StageId manquant" }, { status: 400 })

    // Vérifier que c'est bien un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le fichier doit être au format PDF" }, { status: 400 })
    }

    const fileName = file.name || `mandat-sepa-${projectId}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection("projects")
    const bucket = new GridFSBucket(db, { bucketName: "mandatsepa" })

    // Upload dans GridFS
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: file.type || "application/pdf",
      metadata: { projectId }
    })
    uploadStream.end(buffer)
    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve)
      uploadStream.on("error", reject)
    })
    const fileId = uploadStream.id
    const now = new Date()

    // Mettre à jour le projet avec la référence au fichier
    await collection.updateOne(
      { _id: new ObjectId(projectId), "stages.id": parseInt(stageId) },
      {
        $set: {
          "stages.$.mandatSepaFile": {
            fileId,
            fileName,
            uploadedAt: now,
            contentType: file.type || "application/pdf"
          }
        }
      }
    )

    return NextResponse.json({ fileId, fileName })
  } catch (error) {
    console.error("Erreur lors de l'upload du mandat SEPA:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload du mandat SEPA" }, { status: 500 })
  }
} 