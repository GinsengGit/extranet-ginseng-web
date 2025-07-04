import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string, stageId: string } }) {
  try {
    const { id: projectId, stageId } = params
    const { text } = await req.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Le commentaire ne peut pas être vide." }, { status: 400 })
    }
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection("projects")
    const now = new Date()
    // Ajoute le commentaire dans le tableau comments de l'étape concernée
    const result = await collection.updateOne(
      { _id: new ObjectId(projectId), "stages.id": Number(stageId) },
      {
        $push: {
          "stages.$.comments": {
            text,
            createdAt: now,
            from: "client"
          }
        }
      }
    )
    await client.close()
    if (result.modifiedCount === 1) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Projet ou étape non trouvée." }, { status: 404 })
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error)
    return NextResponse.json({ error: "Erreur lors de l'ajout du commentaire." }, { status: 500 })
  }
} 