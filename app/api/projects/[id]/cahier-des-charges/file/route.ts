import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId, GridFSBucket } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "ma-base-de-données-SpaceX";

// Téléchargement d'un fichier GridFS via son fileId
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const fileId = url.searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId manquant" }, { status: 400 });

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const bucket = new GridFSBucket(db, { bucketName: "cahierdescharges" });

  try {
    const _id = new ObjectId(fileId);
    const files = await db.collection("cahierdescharges.files").findOne({ _id });
    if (!files) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    const stream = bucket.openDownloadStream(_id);
    const chunks: Buffer[] = [];
    await new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": files.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${files.filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 });
  } finally {
    await client.close();
  }
}

// Suppression d'un fichier GridFS et retrait du projet
export async function DELETE(req: NextRequest, context: any) {
  const url = new URL(req.url);
  const fileId = url.searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId manquant" }, { status: 400 });

  const { id: projectId } = await context.params;

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("projects");
  const bucket = new GridFSBucket(db, { bucketName: "cahierdescharges" });

  try {
    const _id = new ObjectId(fileId);
    let gridfsError = null;

    try {
      await bucket.delete(_id);
    } catch (err: any) {
      if (err?.message?.includes("FileNotFound")) {
        gridfsError = "notfound";
      } else {
        throw err;
      }
    }

    const project = await collection.findOne({ _id: new ObjectId(projectId) });
    if (project && Array.isArray(project.stages)) {
      const newStages = project.stages.map((stage: any) => ({
        ...stage,
        cahierDesChargesFiles: Array.isArray(stage.cahierDesChargesFiles)
          ? stage.cahierDesChargesFiles.filter((f: any) => String(f.fileId) !== String(_id))
          : [],
      }));

      await collection.updateOne(
        { _id: new ObjectId(projectId) },
        { $set: { stages: newStages } }
      );
    }

    return NextResponse.json({ success: true, gridfs: gridfsError });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Erreur lors de la suppression : " + errorMsg }, { status: 500 });
  } finally {
    await client.close();
  }
}
