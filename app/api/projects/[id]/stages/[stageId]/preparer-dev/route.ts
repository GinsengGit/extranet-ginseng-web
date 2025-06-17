import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = "ma-base-de-données-SpaceX"

export async function POST(req: NextRequest, { params }: { params: { id: string, stageId: string } }) {
  try {
    const { id: projectId, stageId } = params
    const answers = await req.json()
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection("projects")
    const now = new Date()
    // Enregistre les réponses dans le champ preparerDevAnswers de l'étape
    const result = await collection.updateOne(
      { _id: new ObjectId(projectId), "stages.id": Number(stageId) },
      {
        $set: {
          "stages.$.preparerDevAnswers": { ...answers, submittedAt: now }
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
    console.error("Erreur lors de l'enregistrement du formulaire Préparer Dev:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du formulaire." }, { status: 500 })
  }
} 