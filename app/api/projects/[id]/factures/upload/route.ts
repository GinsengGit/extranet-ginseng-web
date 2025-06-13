import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { MongoClient, ObjectId } from "mongodb"
import { existsSync } from "fs"

const client = new MongoClient(process.env.MONGODB_URI || "")

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier n'a été fourni" },
        { status: 400 }
      )
    }

    // Vérifier que c'est bien un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Le fichier doit être au format PDF" },
        { status: 400 }
      )
    }

    // Crée le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `facture-${Date.now()}-${file.name}`
    const filePath = path.join(uploadsDir, fileName)
    
    // Écrit le fichier
    await writeFile(filePath, buffer)

    // Met à jour le projet dans MongoDB
    await client.connect()
    const db = client.db("project-management")
    const projects = db.collection("projects")

    // Prépare l'objet fichier à ajouter
    const fileObject = {
      fileId: fileName,
      fileName: file.name,
      filePath: `/uploads/${fileName}`,
      uploadedAt: new Date()
    }

    // Met à jour le projet avec le nouveau fichier
    await projects.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: {
          facturesFiles: fileObject
        }
      }
    )

    return NextResponse.json({ success: true, file: fileObject })
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 