import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId, GridFSBucket } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = await Promise.resolve(params)
    const url = new URL(req.url)
    const fileId = url.searchParams.get("fileId")
    if (!fileId) return NextResponse.json({ error: "fileId manquant" }, { status: 400 })

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const bucket = new GridFSBucket(db, { bucketName: "mandatsepa" })

    try {
      const _id = new ObjectId(fileId)
      const files = await db.collection("mandatsepa.files").findOne({ _id })
      if (!files) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 })

      const stream = bucket.openDownloadStream(_id)
      const chunks: Buffer[] = []
      await new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(chunk))
        stream.on("end", resolve)
        stream.on("error", reject)
      })
      const buffer = Buffer.concat(chunks)
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": files.contentType || "application/pdf",
          "Content-Disposition": `inline; filename="${files.filename}"`,
        },
      })
    } catch (e) {
      return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du mandat SEPA:", error)
    return NextResponse.json({ error: "Erreur lors du téléchargement du mandat SEPA" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = await Promise.resolve(params)
    const url = new URL(req.url)
    const fileId = url.searchParams.get("fileId")
    if (!fileId) return NextResponse.json({ error: "fileId manquant" }, { status: 400 })

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const bucket = new GridFSBucket(db, { bucketName: "mandatsepa" })

    try {
      const _id = new ObjectId(fileId)
      
      // Supprimer le fichier de GridFS
      await bucket.delete(_id)

      // Mettre à jour le projet pour retirer la référence au fichier
      await db.collection("projects").updateOne(
        { _id: new ObjectId(projectId), "stages.id": 5 },
        { $set: { "stages.$.mandatSepaFile": null } }
      )

      return NextResponse.json({ success: true })
    } catch (e) {
      console.error("Erreur lors de la suppression:", e)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du mandat SEPA:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression du mandat SEPA" }, { status: 500 })
  }
} 