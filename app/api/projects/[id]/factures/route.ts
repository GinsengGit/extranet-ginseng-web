import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { unlink } from "fs/promises"
import path from "path"

const client = new MongoClient(process.env.MONGODB_URI || "")

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await client.connect()
    const db = client.db("project-management")
    const projects = db.collection("projects")

    const project = await projects.findOne(
      { _id: new ObjectId(params.id) },
      { projection: { facturesFiles: 1 } }
    )

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({ files: project.facturesFiles || [] })
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json(
        { error: "ID du fichier non fourni" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db("project-management")
    const projects = db.collection("projects")

    // Récupère le projet pour obtenir le chemin du fichier
    const project = await projects.findOne(
      { _id: new ObjectId(params.id) },
      { projection: { facturesFiles: 1 } }
    )

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    // Trouve le fichier à supprimer
    const fileToDelete = project.facturesFiles?.find(
      (file: any) => file.fileId === fileId
    )

    if (!fileToDelete) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      )
    }

    // Supprime le fichier du système de fichiers
    const filePath = path.join(process.cwd(), "public", fileToDelete.filePath)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error)
    }

    // Met à jour le projet dans MongoDB
    await projects.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $pull: {
          facturesFiles: { fileId }
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 