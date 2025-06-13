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
    const bucket = new GridFSBucket(db, { bucketName: "generalfiles" })

    try {
      const _id = new ObjectId(fileId)
      const files = await db.collection("generalfiles.files").findOne({ _id })
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
          "Content-Type": files.contentType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${files.filename}"`,
        },
      })
    } catch (e) {
      return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error)
    return NextResponse.json({ error: "Erreur lors du téléchargement du fichier" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const fileId = url.searchParams.get("fileId")
  if (!fileId) return NextResponse.json({ error: "fileId manquant" }, { status: 400 })

  try {
    await client.connect()
    const db = client.db("project-management")
    const bucket = new GridFSBucket(db, { bucketName: "generalfiles" })
    const collection = db.collection("projects")

    // Supprime le fichier de GridFS
    await bucket.delete(new ObjectId(fileId))

    // Supprime la référence du fichier dans le projet
    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $pull: {
          generalFiles: { fileId: new ObjectId(fileId) }
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Erreur lors de la suppression:", e)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  } finally {
    await client.close()
  }
} 