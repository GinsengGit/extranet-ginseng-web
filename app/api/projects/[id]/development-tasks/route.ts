import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    console.log("PUT /development-tasks called with projectId:", projectId);
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(projectId)) {
      console.log("Invalid project ID format:", projectId);
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);
    const { tasks } = body;
    console.log("Extracted tasks:", tasks);
    
    const { db } = await connectToDatabase();
    console.log("Connected to database");

    // Vérifier si la collection existe
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

    // Créer la collection projects si elle n'existe pas
    if (!collections.some(c => c.name === 'projects')) {
      console.log("Creating projects collection");
      await db.createCollection('projects');
    }

    // Vérifier si le projet existe
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId)
    });
    console.log("Project found:", project ? "yes" : "no");
    if (project) {
      console.log("Project details:", {
        id: project._id,
        name: project.name,
        currentStage: project.currentStage
      });
    }

    if (!project) {
      console.log("Project not found, returning 404");
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Mettre à jour les tâches de développement
    console.log("Updating project with tasks:", tasks);
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { developmentTasks: tasks } }
    );
    console.log("Update result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });

    if (result.matchedCount === 0) {
      console.log("No project matched for update, returning 500");
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }

    // Récupérer le projet mis à jour
    console.log("Fetching updated project");
    const updatedProject = await db.collection("projects").findOne({
      _id: new ObjectId(projectId)
    });
    console.log("Updated project fetched successfully:", {
      id: updatedProject?._id,
      developmentTasks: updatedProject?.developmentTasks
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error in PUT /development-tasks:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 