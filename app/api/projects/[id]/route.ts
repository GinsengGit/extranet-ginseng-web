import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)
const dbName = "ma-base-de-données-SpaceX"

// Mettre à jour un projet (ex: étapes)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const id = context.params.id
    const updates = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID du projet manquant" }, { status: 400 })
    }

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un projet
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const id = context.params.id

    if (!id) {
      return NextResponse.json({ error: "ID du projet manquant" }, { status: 400 })
    }

    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// (Optionnel) Récupérer un projet par son id
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const id = context.params.id

    if (!id) {
      return NextResponse.json({ error: "ID du projet manquant" }, { status: 400 })
    }

    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) })
    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}