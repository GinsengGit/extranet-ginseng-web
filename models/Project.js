import mongoose from "mongoose"

const StageSchema = new mongoose.Schema({
  id: Number,
  name: String,
  status: String,
  date: String,
  feedbackRounds: Number,
  maxFeedbackRounds: Number,
  feedbackDeadline: String,
  meetingProposals: [{
    id: String,
    dateTime: Date,
    status: {
      type: String,
      enum: ["proposed", "accepted", "rejected"],
      default: "proposed"
    }
  }],
  cahierDesChargesFiles: [
    {
      fileId: mongoose.Schema.Types.ObjectId,
      fileName: String,
      uploadedAt: Date,
      contentType: String,
    }
  ],
  devisUrl: String, // Lien vers la plateforme de devis
  signatureUrl: String, // Lien de signature électronique
  paiementUrl: String, // Lien de paiement en ligne
})

const CommentSchema = new mongoose.Schema({
  id: Number,
  user: String,
  text: String,
  date: String,
})

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  clientEmail: { type: String, required: true },
  startDate: String,
  currentStage: Number,
  stages: [StageSchema],
  comments: [CommentSchema],
  isLate: Boolean,
  lateReason: String,
})

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema)