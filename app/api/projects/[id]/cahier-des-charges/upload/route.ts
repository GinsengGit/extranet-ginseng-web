import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId, GridFSBucket } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('[UPLOAD] Début upload cahier des charges');
  const { id: projectId } = await params
  const formData = await req.formData()
  const file = formData.get("file") as File
  console.log('[UPLOAD] Fichier reçu:', file?.name, file?.type, file?.size);
  if (!file) return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 })

  const fileName = file.name || `cahier-des-charges-${projectId}-${Date.now()}.pdf`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const client = new MongoClient(uri)
  await client.connect()
  console.log('[UPLOAD] Connexion MongoDB OK');
  const db = client.db(dbName)
  const collection = db.collection("projects")
  const bucket = new GridFSBucket(db, { bucketName: "cahierdescharges" })

  // Upload dans GridFS
  console.log('[UPLOAD] Début upload GridFS:', fileName);
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
  console.log('[UPLOAD] Upload GridFS OK, fileId:', fileId);

  // Ajout dans le tableau de fichiers de l'étape cible (par défaut 2)
  const stageId = Number(formData.get("stageId")) || 2;
  console.log('[UPLOAD] Ajout du fichier au projet, stageId:', stageId);
  await collection.updateOne(
    { _id: new ObjectId(projectId), "stages.id": stageId },
    {
      $push: {
        ["stages.$.cahierDesChargesFiles"]: {
          fileId,
          fileName,
          uploadedAt: now,
          contentType: file.type || "application/pdf"
        }
      } as any
    }
  )
  console.log('[UPLOAD] Update projet OK');
  return NextResponse.json({ fileId, fileName })
}
