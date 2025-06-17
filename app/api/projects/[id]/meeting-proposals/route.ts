import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"

interface MeetingProposal {
  id: string
  dateTime: Date
  status: "proposed" | "accepted" | "rejected"
}

interface Stage {
  id: number
  name: string
  status: string
  date: string | null
  meetingProposals: MeetingProposal[]
}

interface Project {
  _id: ObjectId
  stages: Stage[]
}

// Récupérer les propositions de rendez-vous
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const project = await db.collection("projects").findOne({ _id: new ObjectId(params.id) }) as Project | null
    
    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    const stage = project.stages.find((s) => s.id === 1)
    if (!stage) {
      return NextResponse.json({ error: "Étape non trouvée" }, { status: 404 })
    }

    return NextResponse.json(stage.meetingProposals || [])
  } catch (error) {
    console.error("Erreur lors de la récupération des propositions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Ajouter une proposition de rendez-vous
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { dateTime } = await request.json()
    const { db } = await connectToDatabase()
    const projectId = context.params.id

    if (!projectId) {
      return NextResponse.json({ error: "ID du projet manquant" }, { status: 400 })
    }

    // Créer la proposition
    const proposal: MeetingProposal = {
      id: uuidv4(),
      dateTime: new Date(dateTime),
      status: "proposed"
    }

    // Mettre à jour le projet en une seule opération
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: {
          "stages.$[stage].meetingProposals": proposal
        }
      },
      {
        arrayFilters: [{ "stage.id": 1 }]
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour le statut d'une proposition (accepter/rejeter)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { proposalId, status } = await request.json()
    const { db } = await connectToDatabase()

    const update: any = {
      $set: { "stages.$[stage].meetingProposals.$[proposal].status": status }
    }

    // Si le rendez-vous est accepté, on met à jour la date de l'étape
    if (status === "accepted") {
      const project = await db.collection("projects").findOne({ _id: new ObjectId(params.id) }) as Project | null
      if (!project) {
        return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
      }
      
      const stage = project.stages.find((s) => s.id === 1)
      if (!stage) {
        return NextResponse.json({ error: "Étape non trouvée" }, { status: 404 })
      }
      
      const proposal = stage.meetingProposals.find((p) => p.id === proposalId)
      if (!proposal) {
        return NextResponse.json({ error: "Proposition non trouvée" }, { status: 404 })
      }
      
      update.$set["stages.$[stage].date"] = proposal.dateTime
      update.$set["stages.$[stage].status"] = "en cours"
    }

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(params.id) },
      update,
      {
        arrayFilters: [
          { "stage.id": 1 },
          { "proposal.id": proposalId }
        ]
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet ou proposition non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la proposition:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer une proposition de rendez-vous
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get("proposalId")
    const projectId = context.params.id

    if (!proposalId) {
      return NextResponse.json({ error: "ID de proposition requis" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "ID du projet manquant" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $pull: {
          "stages.$[stage].meetingProposals": { id: proposalId }
        }
      },
      {
        arrayFilters: [{ "stage.id": 1 }]
      }
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