import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { tasks } = await request.json();

    console.log("Received request to update development tasks:", {
      projectId,
      tasks
    });

    const { db } = await connectToDatabase();
    console.log("Connected to database");

    // Vérifier si le projet existe
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      console.log("Project not found:", projectId);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Mettre à jour les tâches de développement
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { developmentTasks: tasks } }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Récupérer le projet mis à jour
    const updatedProject = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating development tasks:", error);
    return NextResponse.json(
      { error: "Failed to update development tasks" },
      { status: 500 }
    );
  }
} 