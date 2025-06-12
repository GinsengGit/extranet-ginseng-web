import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId, GridFSBucket } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = "ma-base-de-données-SpaceX"

export async function GET(request: NextRequest) {
  if (!uri) {
    return NextResponse.json({ error: "MongoDB URI is not defined" }, { status: 500 })
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const bucket = new GridFSBucket(db, { bucketName: "mandatsepa" })

    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      console.error("[MANDAT SEPA] fileId manquant dans la requête")
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    try {
      const fileObjectId = new ObjectId(fileId)
      const file = await bucket.find({ _id: fileObjectId }).next()
      if (!file) {
        console.error(`[MANDAT SEPA] Fichier non trouvé dans GridFS pour fileId: ${fileId}`)
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
      const downloadStream = bucket.openDownloadStream(fileObjectId)
      const chunks: Buffer[] = []
      for await (const chunk of downloadStream) {
        chunks.push(chunk)
      }
      const fileData = Buffer.concat(chunks)
      return new NextResponse(fileData, {
        headers: {
          "Content-Type": file.contentType || "application/pdf",
          "Content-Disposition": `inline; filename=\"${file.filename}\"`,
        },
      })
    } catch (error) {
      console.error("[MANDAT SEPA] Erreur lors du téléchargement:", error, "fileId:", fileId)
      return NextResponse.json({ error: "Error downloading file" }, { status: 500 })
    }
  } catch (error) {
    console.error("[MANDAT SEPA] Erreur de connexion à MongoDB:", error)
    return NextResponse.json({ error: "Error connecting to database" }, { status: 500 })
  } finally {
    await client.close()
  }
} 