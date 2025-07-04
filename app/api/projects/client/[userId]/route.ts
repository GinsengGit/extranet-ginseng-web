import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    
    // Récupérer le projet du client
    const { userId } = await params
    // Essayer de trouver par clientId
    let project = await db.collection("projects").findOne({
      clientId: userId
    })
    // Si rien trouvé, essayer par clientEmail
    if (!project) {
      project = await db.collection("projects").findOne({
        clientEmail: userId
      })
    }

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: "Projet non trouvé" }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(project),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error("Error fetching project:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur lors de la récupération du projet" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 