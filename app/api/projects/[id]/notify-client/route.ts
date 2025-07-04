import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const { subject, message } = await req.json()
    const { db } = await connectToDatabase()
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) })
    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }
    const clientEmail = project.clientEmail
    if (!clientEmail) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 })
    }
    // Configure ton transporteur SMTP ici
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: clientEmail,
      subject,
      text: message,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur envoi email:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 })
  }
} 