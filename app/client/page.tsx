"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,  
  FileText,
  LockIcon,
  MessageSquare,
  UnlockIcon,
  Upload,
  X,
  LogOut,
  Download
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Progress } from "@/components/ui/progress"
import { useRouter, useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { GanttChart } from "@/components/gantt-chart"

// Remplace cette variable par l'email du client connecté (ex: via session)
import { useUser } from "../../context/UserContext"

export default function TableauDeBordClient() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [projects, setProjects] = useState<any[]>([])
  const [selectedStage, setSelectedStage] = useState<any | null>(null)
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [newStageName, setNewStageName] = useState("")
  const [newStageProjectId, setNewStageProjectId] = useState<string|null>(null)
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPaymentOptions, setShowPaymentOptions] = useState<{ [key: string]: boolean }>({})
  const [showRibModal, setShowRibModal] = useState<{ [key: string]: boolean }>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [showDevisModal, setShowDevisModal] = useState<{ [key: string]: boolean }>({})
  const [showMandatModal, setShowMandatModal] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)
  const [showGanttModal, setShowGanttModal] = useState(false)
  const [recettageUrlInput, setRecettageUrlInput] = useState("");
  const [recettageCommentInput, setRecettageCommentInput] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [recettageModal, setRecettageModal] = useState<{ open: boolean, pageIdx: number | null }>({ open: false, pageIdx: null });
  const [meetingProposalInput, setMeetingProposalInput] = useState("");
  const [meetingProposalLoading, setMeetingProposalLoading] = useState(false);
  const [meetingProposalError, setMeetingProposalError] = useState<string | null>(null);
  const [ganttTasks, setGanttTasks] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;
    // Redirige vers /login si l'utilisateur n'est pas connecté
    if (user === null) {
      router.replace("/login")
      return
    }
    if (!user?.email) return
    setLoading(true)
    fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .finally(() => setLoading(false))
  }, [user, isLoading])

  useEffect(() => {
    if (user && user._id) {
      console.log("Fetching project data for user:", user._id)
      fetch(`/api/projects/client/${user._id}`)
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Erreur lors de la récupération du projet')
          }
          return res.json()
        })
        .then(data => {
          console.log("Project data received:", data)
          setProject(data)
        })
        .catch(error => {
          console.error("Error fetching project data:", error)
          setProject(null)
        })
        .finally(() => setLoading(false))
    } else {
      console.log("user or user._id is undefined", user)
    }
  }, [user])

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  useEffect(() => {
    if (project && project.stages) {
      const stage15 = project.stages.find((s: any) => s.id === 15);
      setRecettageUrlInput(stage15?.recettageUrl || "");
      setRecettageCommentInput(stage15?.recettageComment || "");
    }
  }, [project]);

  if (isLoading || user === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-500 text-lg">Chargement...</div>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !projects[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/projects/${projects[0]._id}/general`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      // Recharge le projet
      const res = await fetch(`/api/projects/${projects[0]._id}`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du fichier");
    }
  };

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération du projet");
      const data = await res.json();
      
      // Récupérer les fichiers pour chaque étape
      const stagesWithFiles = await Promise.all(
        data.stages.map(async (stage: any) => {
          // Récupérer le cahier des charges (RIB)
          if (stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0) {
            const ribRes = await fetch(`/api/projects/${id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`);
            if (ribRes.ok) {
              stage.ribUrl = await ribRes.text();
            }
          }

          // Récupérer le mandat SEPA
          if (stage.mandatSepaFile && stage.mandatSepaFile.fileId) {
            const mandatRes = await fetch(`/api/projects/${id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`);
            if (mandatRes.ok) {
              stage.mandatSepaUrl = await mandatRes.text();
            }
          }

          // Récupérer le devis
          if (stage.devisFiles && stage.devisFiles.length > 0) {
            const devisRes = await fetch(`/api/projects/${id}/devis/file?fileId=${stage.devisFiles[0].fileId}`);
            if (devisRes.ok) {
              stage.devisUrl = await devisRes.text();
            }
          }

          return stage;
        })
      );

      setProject({ ...data, stages: stagesWithFiles });
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue lors du chargement du projet");
      setLoading(false);
    }
  };

  const handleAcceptMeetingProposal = async (id: string, proposalId: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/meeting-proposals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, status: "accepted" })
      })

      if (!response.ok) throw new Error("Erreur lors de l'acceptation du rendez-vous")
      
      // Recharger les projets
      const res = await fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setProjects(data)
      setSelectedStage(data.find((p: any) => p._id === id)?.stages.find((s: any) => s.id === 1))
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'acceptation du rendez-vous")
    }
  }

  const handleRejectMeetingProposal = async (id: string, proposalId: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/meeting-proposals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, status: "rejected" })
      })

      if (!response.ok) throw new Error("Erreur lors du rejet du rendez-vous")
      
      // Recharger les projets
      const res = await fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setProjects(data)
      setSelectedStage(data.find((p: any) => p._id === id)?.stages.find((s: any) => s.id === 1))
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors du rejet du rendez-vous")
    }
  }

  const handleOpenGanttModal = async () => {
    if (!project || !project._id || typeof project._id !== 'string' || project._id.length !== 24) return;
    try {
      const res = await fetch(`/api/projects/${project._id}/development-tasks`);
      const tasks = await res.json();
      setGanttTasks(tasks);
      setShowGanttModal(true);
    } catch (err) {
      setGanttTasks([]);
      setShowGanttModal(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* MODAL AJOUT ÉTAPE */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowAddStageModal(false)}
            >
              <span className="sr-only">Fermer</span>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-brand-dark mb-4">Ajouter une étape</h3>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Nom de l'étape"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              disabled={isAddingStage}
            />
            <div className="flex gap-2">
              <Button
                className="w-full"
                onClick={async () => {
                  if (!newStageName || !newStageProjectId) return
                  setIsAddingStage(true)
                  try {
                    const res = await fetch(`/api/projects/${newStageProjectId}/stages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newStageName })
                    })
                    if (res.ok) {
                      const newStage = await res.json();
                      setProjects(projects => projects.map(p => p._id === newStageProjectId ? { ...p, stages: [...p.stages, newStage] } : p))
                      setShowAddStageModal(false)
                      setNewStageName("")
                      setNewStageProjectId(null)
                    }
                  } finally {
                    setIsAddingStage(false)
                  }
                }}
                disabled={!newStageName || isAddingStage}
              >
                Ajouter
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowAddStageModal(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* FIN MODAL AJOUT ÉTAPE */}

      {/* MODAL VUE DÉTAILS */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedStage(null)}
            >
              <span className="sr-only">Fermer</span>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-brand-dark mb-2">{selectedStage.name}</h3>
            <p className="text-gray-600 mb-2">
              Statut : <span className="font-semibold">{selectedStage.status}</span>
            </p>
            {selectedStage.date && (
              <p className="text-gray-600 mb-2">Date : {new Date(selectedStage.date).toLocaleDateString("fr-FR")}</p>
            )}
            {selectedStage.feedbackDeadline && (
              <p className="text-gray-600 mb-2">
                Date limite de feedback : {new Date(selectedStage.feedbackDeadline).toLocaleDateString("fr-FR")}
              </p>
            )}

            {/* Section paiement final */}
            {selectedStage.id === 16 && (
              <div className="mt-4 space-y-4">
                {/* RIB */}
                {selectedStage.cahierDesChargesFiles && selectedStage.cahierDesChargesFiles.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-brand-dark mb-2">RIB</h4>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-brand-blue" />
                      <a
                        href={`/api/projects/${id}/cahier-des-charges/file?fileId=${selectedStage.cahierDesChargesFiles[0].fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:underline"
                      >
                        Télécharger le RIB
                      </a>
                    </div>
                  </div>
                )}

                {/* Mandat SEPA */}
                {selectedStage.mandatSepaFile && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-brand-dark mb-2">Mandat SEPA</h4>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-brand-blue" />
                      <a
                        href={`/api/projects/${id}/mandat-sepa/file?fileId=${selectedStage.mandatSepaFile.fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:underline"
                      >
                        Télécharger le mandat SEPA
                      </a>
                    </div>
                  </div>
                )}

                {/* Lien de paiement */}
                {selectedStage.paiementUrl && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-brand-dark mb-2">Paiement en ligne</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => window.open(selectedStage.paiementUrl, "_blank")}
                        className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"
                      >
                        Accéder au paiement
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Propositions de rendez-vous */}
            {selectedStage.id === 1 && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Proposer un rendez-vous</h4>
                  <form
                    className="flex flex-col md:flex-row gap-2 items-start md:items-end"
                    onSubmit={async e => {
                      e.preventDefault();
                      if (!meetingProposalInput) return;
                      setMeetingProposalLoading(true);
                      setMeetingProposalError(null);
                      try {
                        const res = await fetch(`/api/projects/${id}/meeting-proposals`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ dateTime: meetingProposalInput })
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || 'Erreur lors de la proposition');
                        }
                        setMeetingProposalInput("");
                        // Recharge les données projet
                        await fetchProjectData();
                      } catch (err: any) {
                        setMeetingProposalError(err.message);
                      } finally {
                        setMeetingProposalLoading(false);
                      }
                    }}
                  >
                    <input
                      type="datetime-local"
                      className="border rounded px-2 py-1"
                      value={meetingProposalInput}
                      onChange={e => setMeetingProposalInput(e.target.value)}
                      required
                      disabled={meetingProposalLoading}
                    />
                    <Button type="submit" disabled={meetingProposalLoading || !meetingProposalInput}>
                      {meetingProposalLoading ? "Envoi..." : "Proposer"}
                    </Button>
                  </form>
                  {meetingProposalError && (
                    <div className="text-red-600 text-sm mt-1">{meetingProposalError}</div>
                  )}
                </div>
                {selectedStage.meetingProposals && selectedStage.meetingProposals.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Propositions de rendez-vous</h4>
                    <div className="space-y-2">
                      {selectedStage.meetingProposals.map((proposal: any) => (
                        <div
                          key={proposal.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div>
                            <span className="font-medium">
                              {format(new Date(proposal.dateTime), "PPP à HH:mm", { locale: fr })}
                            </span>
                            <span className={`ml-2 text-sm ${
                              proposal.status === "accepted"
                                ? "text-green-600"
                                : proposal.status === "rejected"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}>
                              ({proposal.status === "accepted"
                                ? "Accepté"
                                : proposal.status === "rejected"
                                ? "Refusé"
                                : "En attente"})
                            </span>
                          </div>
                          {proposal.status === "proposed" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcceptMeetingProposal(id, proposal.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectMeetingProposal(id, proposal.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <Button onClick={() => setSelectedStage(null)} className="w-full">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* FIN MODAL */}

      <header className="sticky top-0 z-50 w-full bg-brand-dark text-white">
        <div className="container flex h-16 items-center">
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-white font-medium flex items-center gap-2">
              Bonjour {user.firstName}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-brand-dark border-brand-yellow hover:bg-brand-yellow/20 p-2"
              onClick={() => {
                localStorage.removeItem("user");
                window.location.replace("/login");
              }}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5 text-brand-yellow" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-brand-yellow hover:bg-transparent">
              Aide
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-brand-yellow hover:bg-transparent">
              Paramètres
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col space-y-8">
            {projects.length === 0 ? (
              <div className="text-center text-gray-500">Aucun projet trouvé pour cet email.</div>
            ) : (
              projects.map((project) => {
                // Calcul de la progression globale
                const completedStages = project.stages.filter((stage: any) => stage.status === "terminé").length
                const totalStages = project.stages.length
                const progressPercentage = Math.round((completedStages / totalStages) * 100)
                // Étape actuelle
                const currentStage = project.stages.find((stage: any) => stage.id === project.currentStage)
                // Deadlines à venir
                const upcomingDeadlines = project.stages
                  .filter((stage: any) => stage.feedbackDeadline && new Date(stage.feedbackDeadline) > new Date())
                  .sort((a: any, b: any) => new Date(a.feedbackDeadline).getTime() - new Date(b.feedbackDeadline).getTime())

                // Trouver l'étape "Demander un rendez-vous"
                const demandeRdvStage = project.stages.find((stage: any) => stage.name.toLowerCase().includes("demander un rendez-vous"));
                // Elle doit être accessible si toutes les étapes précédentes sont terminées, peu importe les suivantes
                let allPrevStagesDone = false;
                if (demandeRdvStage) {
                  const prevStages = project.stages.filter((stage: any) => stage.id < demandeRdvStage.id);
                  allPrevStagesDone = prevStages.every((stage: any) => stage.status === "terminé");
                }

                // TROUVER LES INDEX POUR INSERTION
                const paiementInitialeIndex = project.stages.findIndex((s: any) => s.name.toLowerCase().includes("paiement initiale"));
                const uploadStageIndex = project.stages.findIndex((s: any) => s.name.toLowerCase().includes("upload de fichiers"));
                const uploadStage = project.stages[uploadStageIndex];

                // Construit la liste ordonnée : toutes les étapes, avec "upload" juste après "paiement initiale"
                let mainStages: any[] = [];
                if (paiementInitialeIndex !== -1 && uploadStageIndex !== -1) {
                  mainStages = [
                    ...project.stages.slice(0, paiementInitialeIndex + 1),
                    uploadStage,
                    ...project.stages.slice(paiementInitialeIndex + 1)
                      .filter((s: any) => s.id !== uploadStage.id && !s.name.toLowerCase().includes("demander un rendez-vous")),
                  ];
                } else {
                  mainStages = project.stages.filter((s: any) => !s.name.toLowerCase().includes("demander un rendez-vous"));
                }

                return (
                  <div key={project._id} className="mb-12">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight text-brand-dark">{project.name}</h1>
                        <p className="text-gray-500">
                          Projet pour {project.client} • Démarré le {new Date(project.startDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {/* Bouton RDV en haut à droite - accessible dès que les étapes précédentes sont validées */}
                      {demandeRdvStage && (
                        <div className="mt-4 md:mt-0">
                          <Button
                            className={`${allPrevStagesDone ? 'bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark shadow' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            onClick={() => {
                              if (allPrevStagesDone) {
                                window.open("https://calendly.com/emmanuel-gsweb/parlons-de-votre-projet-30-minutes", "_blank")
                              }
                            }}
                            disabled={!allPrevStagesDone}
                          >
                            {allPrevStagesDone ? 'Prendre rendez-vous' : 'Étapes précédentes en attente de validation'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Progression globale */}
                    <Card className="border border-gray-200 shadow-sm mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-brand-dark">Progression globale</CardTitle>
                        <CardDescription>
                          {completedStages} sur {totalStages} étapes terminées
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={progressPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-brand-yellow" />
                        <div className="mt-2 text-sm text-gray-500">{progressPercentage}% complété</div>
                      </CardContent>
                    </Card>

                    {/* Alertes pour deadlines à venir */}
                    {upcomingDeadlines.length > 0 && (
                      <Alert className="border-brand-pink bg-brand-pink/10 mt-4">
                        <AlertCircle className="h-4 w-4 text-brand-pink" />
                        <AlertTitle className="text-brand-dark">Date limite à venir</AlertTitle>
                        <AlertDescription className="text-gray-600">
                          Vous avez {upcomingDeadlines.length} échéance(s) à venir. La prochaine concerne{" "}
                          {upcomingDeadlines[0].name} le {new Date(upcomingDeadlines[0].feedbackDeadline).toLocaleDateString("fr-FR")}.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Étapes du projet avec upload juste après paiement initiale */}
                    <div className="flex flex-col lg:flex-row gap-8 mt-8">
                      {/* Grille des étapes principales */}
                      <div className="flex-1 space-y-6">
                        <h2 className="text-xl font-semibold tracking-tight text-brand-dark">Étapes du projet</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {mainStages.map((stage: any) => {
                            // Affichage spécial pour l'upload
                            if (stage && stage.name && stage.name.toLowerCase().includes("upload de fichiers")) {
                              // Elle est accessible si toutes les étapes précédentes sont terminées
                              const prevStages = project.stages.filter((s: any) => s.id < stage.id);
                              const canUpload = prevStages.every((s: any) => s.status === "terminé");

                              return (
                                <Card key={stage.id}
                                className={`border border-brand-blue shadow-md bg-blue-50 ${!canUpload ? 'opacity-70' : ''} ${stage.status === 'en cours' ? 'ring-2 ring-brand-yellow/50' : ''}`}>
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg text-brand-dark">{stage.name}</CardTitle>
                                    {!canUpload ? (
                                      <LockIcon className="h-4 w-4 text-gray-400" />
                                    ) : stage.status === "terminé" ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <UnlockIcon className="h-4 w-4 text-brand-blue" />
                                    )}
                                  </div>
                                  <CardDescription>
                                    {stage.status === "terminé" ? (
                                      <>Terminé le {new Date(stage.date).toLocaleDateString("fr-FR")}</>
                                    ) : stage.status === "en cours" ? (
                                      <>En cours depuis le {new Date(stage.date).toLocaleDateString("fr-FR")}</>
                                    ) : !canUpload ? (
                                      <>Étapes précédentes en attente de validation</>
                                    ) : (
                                      <>Débloqué</>
                                    )}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {/* Upload de fichiers */}
                                  {stage.name && stage.name.toLowerCase().includes("upload de fichiers") && canUpload && (
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                      <label htmlFor={`file-upload-${project._id}-${stage.id}`} className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded cursor-pointer hover:bg-brand-yellow hover:text-brand-dark transition-colors">
                                        <Upload className="mr-2 h-5 w-5" />
                                        Choisir un fichier
                                        <input
                                          id={`file-upload-${project._id}-${stage.id}`}
                                          type="file"
                                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                          className="hidden"
                                          onChange={e => {
                                            if (!e.target.files || e.target.files.length === 0) return;
                                            setSelectedFile(e.target.files[0]);
                                          }}
                                          disabled={isUploading}
                                        />
                                      </label>
                                      {selectedFile && (
                                        <span className="text-sm text-brand-dark truncate max-w-xs">{selectedFile.name}</span>
                                      )}
                                      <Button
                                        className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        disabled={!selectedFile || isUploading}
                                        onClick={async () => {
                                          if (!selectedFile) return;
                                          setIsUploading(true);
                                          const formData = new FormData();
                                          formData.append("file", selectedFile);
                                          formData.append("stageId", stage.id);
                                          formData.append("stageName", stage.name);
                                          const uploadRes = await fetch(`/api/projects/${project._id}/cahier-des-charges/upload`, {
                                            method: "POST",
                                            body: formData,
                                          });
                                          const uploadData = await uploadRes.json();
                                          console.log('[UPLOAD][CLIENT] Réponse backend:', uploadData);
                                          if (!uploadRes.ok) {
                                            alert('Erreur lors de l\'upload: ' + (uploadData.error || uploadRes.status));
                                            return;
                                          }
                                          // Recharge les projets pour afficher le nouveau fichier
                                          const res = await fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`);
                                          const data = await res.json();
                                          setProjects(data);
                                          setSelectedFile(null);
                                          setIsUploading(false);
                                        }}
                                      >
                                        {isUploading ? "Upload en cours..." : "Uploader"}
                                      </Button>
                                    </div>
                                  )}
                                  {/* Devis */}
                                  {stage.name && stage.name.toLowerCase().includes("devis") && stage.devisUrl && (
                                    <Button
                                      variant="outline"
                                      className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 mt-2"
                                      onClick={() => window.open(stage.devisUrl, "_blank")}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Voir le devis
                                    </Button>
                                  )}
                                  {/* Signature (étape 4) */}
                                  {stage.id === 4 && stage.signatureUrl && (
                                    <Button
                                      className="mt-2 bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                      onClick={() => window.open(stage.signatureUrl, '_blank')}
                                    >
                                      Signer
                                    </Button>
                                  )}
                                  {stage.id === 4 && !stage.signatureUrl && (
                                    <Button className="mt-2" disabled>
                                      Lien de signature non disponible
                                    </Button>
                                  )}
                                  {/* Paiement final */}
                                  {stage.name && stage.name.toLowerCase().includes("paiement final") && stage.status === "en cours" && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                        <Button
                                          variant="outline"
                                          className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-' + stage.id]: true }))}
                                        >
                                          Voir le RIB
                                        </Button>
                                      )}
                                      {stage.mandatSepaFile && (
                                        <Button
                                          variant="outline"
                                          className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat-' + stage.id]: true }))}
                                        >
                                          Voir le mandat SEPA
                                        </Button>
                                      )}
                                      {stage.paiementUrl && (
                                        <Button
                                          variant="default"
                                          className="bg-brand-blue text-white hover:bg-brand-blue/90"
                                          onClick={() => window.open(stage.paiementUrl, "_blank")}
                                        >
                                          Payer en ligne
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          }
                            // Affichage spécial pour le paiement final
                            else if (stage && stage.name && stage.name.toLowerCase().includes("paiement final")) {
                              return (
                                <Card key={stage.id} className={`border ${stage.status === "en cours" ? "border-brand-blue shadow-md bg-blue-50" : "border-gray-200"} ${stage.status === "terminé" ? "bg-green-50" : ""}`}>
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg text-brand-dark">{stage.name}</CardTitle>
                                      {stage.status === "terminé" ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-brand-blue" />
                                      )}
                                    </div>
                                    <CardDescription>
                                      {stage.status === "terminé" ? (
                                        <>Terminé le {new Date(stage.date).toLocaleDateString("fr-FR")}</>
                                      ) : (
                                        <>En attente de paiement</>
                                      )}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    {stage.status === "en cours" && (
                                      <div className="flex flex-col gap-4">
                                        {/* Boutons d'action */}
                                        <div className="flex flex-wrap gap-2">
                                          {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                            <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-' + stage.id]: true }))}
                                            >
                                              Voir le RIB
                                            </Button>
                                          )}
                                          {stage.mandatSepaFile && (
                                            <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat-' + stage.id]: true }))}
                                            >
                                              Voir le mandat SEPA
                                            </Button>
                                          )}
                                          {stage.paiementUrl && (
                                            <Button
                                              variant="default"
                                              className="bg-brand-blue text-white hover:bg-brand-blue/90"
                                              onClick={() => window.open(stage.paiementUrl, "_blank")}
                                            >
                                              Payer en ligne
                                            </Button>
                                          )}
                                        </div>

                                        {/* Message d'information */}
                                        <p className="text-sm text-gray-600">
                                          Pour effectuer le paiement final, vous pouvez soit utiliser le lien de paiement en ligne ci-dessus, soit effectuer un virement bancaire en utilisant le RIB fourni.
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            }
                            // Affichage standard pour les autres étapes
                            else {
                              return (
                                <Card
                                  key={stage.id}
                                  className={`border border-gray-200 shadow-sm transition-all duration-200 ${
                                    stage.status === "verrouillé" ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"
                                  } ${stage.status === "en cours" ? "ring-2 ring-brand-yellow/50" : ""}`}
                                  onClick={() => stage.status !== "verrouillé" && setSelectedStage(stage)}
                                >
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg text-brand-dark">{stage.name}</CardTitle>
                                      {stage.status === "verrouillé" ? (
                                        <LockIcon className="h-4 w-4 text-gray-400" />
                                      ) : stage.status === "terminé" ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <UnlockIcon className="h-4 w-4 text-brand-blue" />
                                      )}
                                    </div>
                                    <CardDescription>
                                      {stage.status === "terminé" ? (
                                        <>Terminé le {new Date(stage.date).toLocaleDateString("fr-FR")}</>
                                      ) : stage.status === "en cours" ? (
                                        <>En cours depuis le {new Date(stage.date).toLocaleDateString("fr-FR")}</>
                                      ) : (
                                        <>Verrouillé</>
                                      )}
                                    </CardDescription>
                                    {/* Bouton explicite pour l'étape 1 */}
                                    {stage.id === 1 && stage.status !== "verrouillé" && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSelectedStage(stage);
                                        }}
                                      >
                                        Détails / Proposer un rendez-vous
                                      </Button>
                                    )}
                                  </CardHeader>
                                  <CardContent>
                                    {/* Afficher le Gantt chart uniquement pour l'étape de développement */}
                                    {stage.id === 14 && stage.status === "en cours" && project && (
                                      <div className="mt-4">
                                        <Button
                                          variant="outline"
                                          className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={handleOpenGanttModal}
                                        >
                                          <FileText className="mr-2 h-4 w-4" />
                                          Voir l'avancement du projet
                                        </Button>
                                      </div>
                                    )}
                                    {stage.id === 3 && stage.devisUrl && (
                                      <Button
                                        variant="outline"
                                        className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 mt-2"
                                        onClick={() => window.open(stage.devisUrl, "_blank")}
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Voir le devis
                                      </Button>
                                    )}
                                    {stage.name && stage.name.toLowerCase().includes("cahier des charges") && (
                                      <div className="flex flex-col gap-2 mt-2">
                                        {/* Bouton Ajouter PDF */}
                                        <label htmlFor={`cahier-upload-${project._id}-${stage.id}`} className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded cursor-pointer hover:bg-brand-yellow hover:text-brand-dark transition-colors">
                                          <Upload className="mr-2 h-5 w-5" />
                                          Ajouter PDF
                                          <input
                                            id={`cahier-upload-${project._id}-${stage.id}`}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={async e => {
                                              if (!e.target.files || e.target.files.length === 0) return;
                                              const file = e.target.files[0];
                                              const formData = new FormData();
                                              formData.append("file", file);
                                              formData.append("stageId", stage.id);
                                              formData.append("stageName", stage.name);
                                              const uploadRes = await fetch(`/api/projects/${project._id}/cahier-des-charges/upload`, {
                                                method: "POST",
                                                body: formData,
                                              });
                                              const uploadData = await uploadRes.json();
                                              console.log('[UPLOAD][CLIENT] Réponse backend:', uploadData);
                                              if (!uploadRes.ok) {
                                                alert('Erreur lors de l\'upload: ' + (uploadData.error || uploadRes.status));
                                                return;
                                              }
                                              // Recharge le projet pour afficher le nouveau fichier
                                              const res = await fetch(`/api/projects/${project._id}`);
                                              const data = await res.json();
                                              setProject(data);
                                            }}
                                          />
                                        </label>
                                        {/* Bouton Voir PDF */}
                                        {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                          <Button
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                            onClick={() => window.open(`/api/projects/${project._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`, "_blank")}
                                          >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Voir le PDF
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                    {stage.id === 4 && stage.signatureUrl && (
                                      <Button
                                        className="mt-2 bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={() => window.open(stage.signatureUrl, '_blank')}
                                      >
                                        Signer
                                      </Button>
                                    )}
                                    {stage.id === 4 && !stage.signatureUrl && (
                                      <Button className="mt-2" disabled>
                                        Lien de signature non disponible
                                      </Button>
                                    )}
                                    {stage.id === 15 && (
                                      <div className="flex flex-col gap-4 mt-2">
                                        <h4 className="text-sm font-bold text-brand-dark mb-2">Recettage des pages</h4>
                                        {/* Affichage du lien mandat SEPA si présent */}
                                        {stage.mandatSepaUrl && (
                                          <Button
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                            onClick={() => window.open(stage.mandatSepaUrl, "_blank")}
                                          >
                                            Voir le site web
                                          </Button>
                                        )}
                                        {(stage.pages || []).length === 0 && (
                                          <div className="text-xs text-gray-500">Aucune page à recetter n'a encore été ajoutée par l'admin.</div>
                                        )}
                                        {(stage.pages || []).map((page: any, idx: number) => (
                                          <button
                                            key={idx}
                                            className="w-full text-left border rounded p-2 bg-gray-50 hover:bg-brand-yellow/20 flex items-center justify-between"
                                            onClick={() => setRecettageModal({ open: true, pageIdx: idx })}
                                          >
                                            <span className="font-medium text-brand-dark">{page.title}</span>
                                            <span className="text-xs text-gray-400">{(page.comments?.length || 0)} commentaire(s)</span>
                                          </button>
                                        ))}
                                        {/* Bouton Valider mes retours */}
                                        {stage.feedbackStatus === 'client' && (stage.feedbackRounds ?? 0) < 3 && (
                                          <Button
                                            className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                            onClick={async () => {
                                              // Passer feedbackStatus à 'admin' pour figer les commentaires
                                              const newStages = project.stages.map((s: any) =>
                                                s.id === 15 ? { ...s, feedbackStatus: 'admin' } : s
                                              );
                                              await fetch(`/api/projects/${project._id}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ stages: newStages }),
                                              });
                                              setProject((prev: any) => ({ ...prev, stages: newStages }));
                                            }}
                                          >
                                            Valider mes retours
                                          </Button>
                                        )}
                                        {/* Modal d'édition de commentaire */}
                                        <Dialog open={recettageModal.open} onOpenChange={open => setRecettageModal(m => ({ ...m, open }))}>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Commenter la page</DialogTitle>
                                            </DialogHeader>
                                            {recettageModal.pageIdx !== null && stage.pages && stage.pages[recettageModal.pageIdx] && (
                                              <div className="flex flex-col gap-4">
                                                <div className="font-medium text-brand-dark mb-1">{stage.pages[recettageModal.pageIdx].title}</div>
                                                <textarea
                                                  className="border rounded px-2 py-1 flex-1 min-h-[160px] text-base"
                                                  placeholder="Ajouter un commentaire détaillé..."
                                                  value={commentInputs[recettageModal.pageIdx] || ""}
                                                  onChange={e => setCommentInputs(inputs => ({ ...inputs, [recettageModal.pageIdx!]: e.target.value }))}
                                                  rows={7}
                                                  disabled={stage.feedbackStatus !== 'client' || (stage.feedbackRounds ?? 0) >= 3}
                                                />
                                                <Button
                                                  size="sm"
                                                  onClick={async () => {
                                                    const idx = recettageModal.pageIdx!;
                                                    if (!(commentInputs[idx] || "").trim()) return;
                                                    const newPages = (stage.pages || []).map((p: any, pidx: number) =>
                                                      pidx === idx
                                                        ? {
                                                            ...p,
                                                            comments: [
                                                              ...(p.comments || []),
                                                              {
                                                                user: user.firstName,
                                                                text: commentInputs[idx],
                                                                date: new Date().toISOString(),
                                                              },
                                                            ],
                                                          }
                                                        : p
                                                    );
                                                    const newStages = project.stages.map((s: any) =>
                                                      s.id === 15 ? { ...s, pages: newPages } : s
                                                    );
                                                    console.log("[DEBUG] Envoi commentaire", { newStages, projectId: project._id });
                                                    const response = await fetch(`/api/projects/${project._id}`, {
                                                      method: "PUT",
                                                      headers: { "Content-Type": "application/json" },
                                                      body: JSON.stringify({ stages: newStages }),
                                                    });
                                                    const responseText = await response.text();
                                                    console.log("[DEBUG] Réponse backend", response.status, responseText);
                                                    if (!response.ok) {
                                                      alert("Erreur lors de l'envoi du commentaire: " + responseText);
                                                      return;
                                                    }
                                                    setProject((prev: any) => ({ ...prev, stages: newStages }));
                                                    setCommentInputs(inputs => ({ ...inputs, [idx]: "" }));
                                                  }}
                                                  disabled={!(commentInputs[recettageModal.pageIdx!] || "").trim() || stage.feedbackStatus !== 'client' || (stage.feedbackRounds ?? 0) >= 3}
                                                >
                                                  Envoyer
                                                </Button>
                                                {/* Liste des commentaires */}
                                                {stage.pages[recettageModal.pageIdx].comments && stage.pages[recettageModal.pageIdx].comments.length > 0 && (
                                                  <div className="mb-1">
                                                    <div className="text-xs text-gray-500 mb-1">Vos commentaires précédents :</div>
                                                    <ul className="space-y-1">
                                                      {stage.pages[recettageModal.pageIdx].comments.map((comment: any, cidx: number) => (
                                                        <li key={cidx} className="text-xs bg-white rounded p-1 border">
                                                          {comment.text}
                                                          {comment.date && (
                                                            <span className="block text-[10px] text-gray-400 mt-1">{new Date(comment.date).toLocaleString('fr-FR')}</span>
                                                          )}
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}
                                    {stage.id === 15 && (
                                      <div className="text-xs text-gray-500 font-semibold mb-2">
                                        Cycle de retours : {(stage.feedbackRounds ?? 0) + 1} / 3
                                      </div>
                                    )}
                                    {stage.id === 8 && stage.lienUrl && project && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={e => {
                                          e.stopPropagation();
                                          window.open(stage.lienUrl, '_blank');
                                        }}
                                      >
                                        Voir le lien
                                      </Button>
                                    )}
                                    {stage.id === 9 && stage.status !== "verrouillé" && project && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={e => {
                                          e.stopPropagation();
                                          window.location.href = `/client/projects/${project._id}/stages/9/copyrighting-form`;
                                        }}
                                      >
                                        Remplir le formulaire légal (Copyrighting)
                                      </Button>
                                    )}
                                    {stage.id === 10 && stage.figmaUrl && project && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={e => {
                                          e.stopPropagation();
                                          window.open(stage.figmaUrl, '_blank');
                                        }}
                                      >
                                        Voir l'aperçu Figma
                                      </Button>
                                    )}
                                    {stage.id === 11 && stage.status === "en cours" && project && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={async e => {
                                          e.stopPropagation();
                                          // Marquer l'étape comme terminée et débloquer la suivante
                                          const updatedStages = project.stages.map((s: any) =>
                                            s.id === 11 ? { ...s, status: "terminé", date: new Date().toISOString() } :
                                            s.id === 12 ? { ...s, status: "en cours", date: new Date().toISOString() } : s
                                          );
                                          await fetch(`/api/projects/${project._id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              currentStage: 12,
                                              stages: updatedStages,
                                            }),
                                          });
                                          // Recharge le projet pour mettre à jour l'affichage
                                          await fetchProjectData();
                                        }}
                                      >
                                        Valider l'étape
                                      </Button>
                                    )}
                                    {stage.id === 13 && stage.status !== "verrouillé" && project && (
                                      <Button
                                        className="mt-2 w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={e => {
                                          e.stopPropagation();
                                          window.location.href = `/client/projects/${project._id}/stages/13/preparer-dev-form`;
                                        }}
                                      >
                                        Remplir le formulaire Préparer développement
                                      </Button>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
      <footer className="border-t py-6 bg-gray-50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2024 ProjectFlow. Tous droits réservés.
          </p>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-brand-dark hover:text-brand-blue hover:bg-transparent">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contacter le support
            </Button>
          </div>
        </div>
      </footer>

      {/* Modal pour afficher le RIB final */}
      {project && project.stages && project.stages.map((stage: any) => (
        stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && showRibModal[project._id + '-final'] && (
          <div key={stage.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[80vh] p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-final']: false }))}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-brand-dark mb-4">RIB Final</h2>
              <iframe
                src={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                className="w-full h-full border-0"
                title="RIB Final"
              />
            </div>
          </div>
        )
      ))}

      {/* Modal pour afficher le mandat SEPA final */}
      {project && project.stages && project.stages.map((stage: any) => (
        stage.mandatSepaFile && showRibModal[project._id + '-mandat-final'] && (
          <div key={stage.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[80vh] p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat-final']: false }))}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-brand-dark mb-4">Mandat SEPA Final</h2>
              <iframe
                src={`/api/projects/${project._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                className="w-full h-full border-0"
                title="Mandat SEPA Final"
              />
            </div>
          </div>
        )
      ))}

      {/* Modal pour afficher le diagramme de Gantt */}
      {showGanttModal && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[90vh] p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowGanttModal(false)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Avancement du projet</h2>
            <div className="h-[calc(100%-4rem)] overflow-auto">
              <GanttChart
                projectId={project._id}
                tasks={ganttTasks}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}