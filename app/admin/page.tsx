"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Send,
  User,
  X,
  Trash2,
  LogOut,
  Upload
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useUser } from "../../context/UserContext"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { GanttChart } from "@/components/gantt-chart"

// Étapes par défaut pour un nouveau projet
const defaultStages = [
  { id: 1, name: "Premier Rendez-vous", status: "en cours", date: null },
  { id: 2, name: "Cahier des charges", status: "verrouillé", date: null, cahierDesChargesUrl: null },
  { id: 3, name: "Devis envoyé", status: "verrouillé", date: null },
  { id: 4, name: "Signature", status: "verrouillé", date: null },
  { id: 5, name: "Paiement initial", status: "verrouillé", date: null },
  { id: 6, name: "Demander un rendez-vous", status: "verrouillé", date: null },
  { id: 7, name: "Upload de fichiers", status: "verrouillé", date: null },
  {
    id: 8,
    name: "Logo/Branding",
    status: "verrouillé",
    date: null,
    feedbackRounds: 0,
    maxFeedbackRounds: 3,
    feedbackDeadline: null,
  },
  { id: 9, name: "Copyrighting", status: "verrouillé", date: null },
  { id: 10, name: "Aperçu Figma", status: "verrouillé", date: null },
  { id: 11, name: "Validation finale", status: "verrouillé", date: null },
  { id: 12, name: "Paiement", status: "verrouillé", date: null },
  { id: 13, name: "Préparer développement", status: "verrouillé", date: null },
  { id: 14, name: "Développement", status: "verrouillé", date: null },
  { id: 15, name: "Recettage", status: "verrouillé", date: null },
  { id: 16, name: "Paiement final", status: "verrouillé", date: null },
  { id: 17, name: "Mise en ligne", status: "verrouillé", date: null },
]

export default function TableauDeBordAdmin() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [newComment, setNewComment] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    clientEmail: "",
  })
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [openedStageId, setOpenedStageId] = useState<number | null>(null)
  const [showRibModal, setShowRibModal] = useState<any>({})
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")

  // Charger les projets depuis MongoDB Atlas
  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
  }, [])

  // Regroupement des projets par étape
  const projectsByStage: { [key: string]: any[] } = {}
  projects.forEach((project) => {
    const currentStageObj = project.stages?.find((stage: any) => stage.id === project.currentStage)
    const stageName = currentStageObj ? currentStageObj.name : "Inconnu"
    if (!projectsByStage[stageName]) {
      projectsByStage[stageName] = []
    }
    projectsByStage[stageName].push(project)
  })

  const handleSelectProject = (project: any) => {
    setSelectedProject(project)
    setUploadedFile(null)
  }

  // Marquer une étape comme terminée (persistant)
  const handleCompleteStage = async () => {
    if (!selectedProject) return
    const nextStageId = selectedProject.currentStage + 1
    const updatedStages = selectedProject.stages.map((stage: any) => {
      if (stage.id === selectedProject.currentStage) {
        return { ...stage, status: "terminé", date: new Date().toISOString().split("T")[0] }
      }
      if (stage.id === nextStageId) {
        return { ...stage, status: "en cours", date: new Date().toISOString().split("T")[0] }
      }
      return stage
    })
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStage: nextStageId,
        stages: updatedStages,
      }),
    })
    // Recharge les projets
    const res = await fetch("/api/projects")
    const data = await res.json()
    setProjects(data)
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id))
  }

  // Upload de fichier (persistant)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedProject) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}/general`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      // Recharge les projets
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
      setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du fichier");
    }
  };

  // Supprimer un projet
  const handleDeleteProject = async () => {
    if (!selectedProject) return
    if (window.confirm("Supprimer ce projet ?")) {
      await fetch(`/api/projects/${selectedProject._id}`, { method: "DELETE" })
      // Recharge la liste
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data)
      setSelectedProject(null)
      setUploadedFile(null)
    }
  }

  const handleSendEmail = () => {
    if (selectedProject) {
      window.open(`mailto:${selectedProject.clientEmail}`, "_blank")
    }
  }

  const handleOpenModal = () => setShowModal(true)
  const handleCloseModal = () => {
    setShowModal(false)
    setNewProject({ name: "", client: "", clientEmail: "" })
  }

  const handleChangeNewProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value })
  }

  // Création d'un projet (persistant via API)
  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.client.trim() || !newProject.clientEmail.trim()) return
    const today = new Date().toISOString().split("T")[0]
    const stages = defaultStages.map((stage) =>
      stage.id === 1
        ? { ...stage, status: "en cours", date: today }
        : { ...stage, status: "verrouillé", date: null }
    )
    const newProj = {
      name: newProject.name,
      client: newProject.client,
      clientEmail: newProject.clientEmail,
      startDate: today,
      currentStage: 1,
      stages,
      comments: [],
      files: [],
      isLate: false,
    }
    // Envoi à l'API
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProj),
    })
    // Recharge la liste
    const res = await fetch("/api/projects")
    const data = await res.json()
    setProjects(data)
    setShowModal(false)
    setNewProject({ name: "", client: "", clientEmail: "" })
    setSelectedProject(null)
    setUploadedFile(null)
  }

  // Fonction pour gérer le changement de l'URL du devis
  const handleDevisUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
            ...p,
            stages: p.stages.map((s: any) =>
              s.id === stageId ? { ...s, devisUrl: newUrl } : s
            ),
          }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, devisUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // Fonction pour gérer le changement de l'URL de signature
  const handleSignatureUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
            ...p,
            stages: p.stages.map((s: any) =>
              s.id === stageId ? { ...s, signatureUrl: newUrl } : s
            ),
          }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, signatureUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // Ajouter la fonction de sauvegarde du lien logo/branding
  const handleLogoBrandingUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
            ...p,
            stages: p.stages.map((s: any) =>
              s.id === stageId ? { ...s, logoBrandingUrl: newUrl } : s
            ),
          }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, logoBrandingUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // 1. Ajouter la fonction handleFigmaUrlChange
  const handleFigmaUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
            ...p,
            stages: p.stages.map((s: any) =>
              s.id === stageId ? { ...s, figmaUrl: newUrl } : s
            ),
          }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, figmaUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // Fonction pour gérer le changement de l'URL de paiement
  const handlePaiementUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
          ...p,
          stages: p.stages.map((s: any) =>
            s.id === stageId ? { ...s, paiementUrl: newUrl } : s
          ),
        }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, paiementUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // Toast de succès pour l'enregistrement du lien devis
  function DevisUrlToast() {
    const [show, setShow] = useState(false);
    useEffect(() => {
      function handler() {
        setShow(true);
        setTimeout(() => setShow(false), 2000);
      }
      window.addEventListener('devis-url-saved', handler);
      return () => window.removeEventListener('devis-url-saved', handler);
    }, []);
    if (!show) return null;
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
        Lien enregistré !
      </div>
    );
  }

  // Aller à l'étape précédente (admin)
  const handleGoToPreviousStage = async () => {
    if (!selectedProject) return;
    const prevStageId = selectedProject.currentStage - 1;
    if (prevStageId < 1) return;
    const updatedStages = selectedProject.stages.map((stage: any) => {
      if (stage.id === selectedProject.currentStage) {
        return { ...stage, status: "verrouillé" };
      }
      if (stage.id === prevStageId) {
        return { ...stage, status: "en cours" };
      }
      return stage;
    });
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStage: prevStageId,
        stages: updatedStages,
      }),
    });
    // Recharge les projets
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  // Ajouter la fonction handleFormUrlChange
  const handleFormUrlChange = async (newUrl: string, stageId: number) => {
    if (!selectedProject) return;
    setProjects((prev: any[]) => prev.map((p) =>
      p._id === selectedProject._id
        ? {
            ...p,
            stages: p.stages.map((s: any) =>
              s.id === stageId ? { ...s, formUrl: newUrl } : s
            ),
          }
        : p
    ));
    await fetch(`/api/projects/${selectedProject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stages: selectedProject.stages.map((s: any) =>
          s.id === stageId ? { ...s, formUrl: newUrl } : s
        ),
      }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
  };

  const handleOpenStage = async (stageId: number) => {
    setOpenedStageId(stageId);
    // Recharge les projets pour avoir les dernières réponses du formulaire
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    if (selectedProject) {
      setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
    }
  };

  const handleAddMeetingProposal = async (projectId: string) => {
    if (!selectedDate || !selectedTime) {
      alert("Veuillez sélectionner une date et une heure")
      return
    }

    const dateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":")
    dateTime.setHours(parseInt(hours), parseInt(minutes))

    console.log("Tentative d'ajout de rendez-vous:", {
      projectId,
      dateTime: dateTime.toISOString(),
      selectedDate,
      selectedTime
    })

    try {
      const response = await fetch(`/api/projects/${projectId}/meeting-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateTime: dateTime.toISOString() })
      })

      console.log("Réponse du serveur:", response.status)
      const data = await response.json()
      console.log("Données reçues:", data)
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout de la proposition")
      }
      
      // Recharger les projets
      const res = await fetch("/api/projects")
      const projectsData = await res.json()
      setProjects(projectsData)
      setSelectedProject(projectsData.find((p: any) => p._id === projectId))
      
      // Réinitialiser les champs
      setSelectedDate(undefined)
      setSelectedTime("")

      // Afficher un message de succès
      alert("Rendez-vous ajouté avec succès")
    } catch (error) {
      console.error("Erreur détaillée:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de l'ajout de la proposition")
    }
  }

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-gray-500 text-lg">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* --- MODAL Ajouter Projet --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Ajouter un nouveau projet</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-brand-dark">Nom du projet</label>
                <Input
                  name="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="ex : Site marketing"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-brand-dark">Nom du client</label>
                <Input
                  name="client"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  placeholder="ex : Ma Société"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-brand-dark">Email du client</label>
                <Input
                  name="clientEmail"
                  type="email"
                  value={newProject.clientEmail}
                  onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                  placeholder="ex : client@email.com"
                />
              </div>
              <Button
                className="w-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 mt-2"
                onClick={async () => {
                  const project = {
                    ...newProject,
                    stages: defaultStages,
                    currentStage: 1,
                    createdAt: new Date().toISOString(),
                  }
                  await fetch("/api/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(project),
                  })
                  const res = await fetch("/api/projects")
                  const data = await res.json()
                  setProjects(data)
                  setShowModal(false)
                  setNewProject({ name: "", client: "", clientEmail: "" })
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Créer le projet
              </Button>
            </div>
          </div>
        </div>
      )}

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
            {/* Bouton gérer les admins */}
            <Button
              variant="outline"
              size="sm"
              className="text-brand-yellow border-brand-yellow hover:bg-brand-yellow/20 p-2"
              onClick={() => router.push("/admin/manage-admins")}
              title="Gérer les admins"
            >
              <User className="w-5 h-5 mr-2" /> Gérer les admins
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-brand-dark">Tableau de bord Admin</h1>
                <p className="text-gray-500">Gérez tous les projets clients et suivez leur avancement</p>
              </div>
              <Button
                className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"
                onClick={() => setShowModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            </div>

            {/* Alertes pour projets en retard */}
            {projects.some((p) => p.isLate) && (
              <Alert className="border-brand-pink bg-brand-pink/10">
                <AlertCircle className="h-4 w-4 text-brand-pink" />
                <AlertTitle className="text-brand-dark">Attention requise</AlertTitle>
                <AlertDescription className="text-gray-600">
                  {projects.filter((p) => p.isLate).length} projet(s) nécessitent une attention immédiate à cause d'échéances proches.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Kanban */}
              <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-brand-dark">Kanban des projets</CardTitle>
                      <Button
                        size="sm"
                        className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"
                        onClick={() => setShowModal(true)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Ajouter un projet
                      </Button>
                    </div>
                    <CardDescription>Voir tous les projets selon leur étape actuelle</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {Object.keys(projectsByStage).map((stageName) => (
                        <div key={stageName} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-brand-dark">{stageName}</h3>
                            <Badge variant="outline" className="bg-gray-50 text-brand-dark border-gray-200">
                              {projectsByStage[stageName].length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {projectsByStage[stageName].map((project) => (
                              <div
                                key={project._id}
                                className={`cursor-pointer rounded-md border p-3 transition-all duration-200 hover:shadow-md ${
                                  selectedProject?._id === project._id
                                    ? "border-brand-blue bg-brand-blue/5"
                                    : "border-gray-200"
                                } ${project.isLate ? "border-brand-pink bg-brand-pink/5" : ""}`}
                                onClick={() => handleSelectProject(project)}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-brand-dark">{project.name}</h4>
                                  {project.isLate && (
                                    <Badge className="ml-2 bg-brand-pink text-brand-dark">
                                      <Clock className="mr-1 h-3 w-3" />
                                      En retard
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{project.client}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Encadré fichiers uploadés (projet sélectionné uniquement) */}
                {selectedProject && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-brand-dark mb-2 text-lg">Fichiers uploadés pour ce projet</h3>
                    <div className="rounded-md bg-yellow-50 border-2 border-brand-yellow p-4">
                      {(() => {
                        // Récupère tous les fichiers de toutes les étapes du projet sélectionné
                        const allFiles = (selectedProject.stages || []).flatMap((stage: any) => {
                          const files = [];
                          // Ajoute les fichiers du cahier des charges
                          if (stage.cahierDesChargesFiles) {
                            files.push(...stage.cahierDesChargesFiles
                              .filter((file: any) => file && file.fileId)
                              .map((file: any) => ({
                                ...file,
                                stageName: stage.name,
                                stageId: stage.id,
                                type: 'cahier-des-charges'
                              }))
                            );
                          }
                          // Ajoute le mandat SEPA s'il existe
                          if (stage.mandatSepaFile) {
                            files.push({
                              ...stage.mandatSepaFile,
                              stageName: stage.name,
                              stageId: stage.id,
                              type: 'mandat-sepa'
                            });
                          }
                          return files;
                        });

                        // Ajoute les fichiers généraux uploadés via le bouton "Ajouter des documents"
                        if (selectedProject.generalFiles) {
                          allFiles.push(...selectedProject.generalFiles.map((file: any) => ({
                            ...file,
                            stageName: "Fichiers généraux",
                            type: 'general'
                          })));
                        }

                        if (allFiles.length === 0) {
                          return <div className="text-sm text-gray-400">Aucun fichier uploadé pour ce projet.</div>
                        }
                        return (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {allFiles.map((file: any) => {
                              const ext = file.fileName?.split(".").pop()?.toUpperCase() || "?"
                              return (
                                <div key={file.fileId} className="flex items-center gap-3 border rounded px-2 py-1 bg-white">
                                  <span className="text-brand-blue font-medium">{file.fileName}</span>
                                  <span className="text-xs text-gray-500 border px-2 py-0.5 rounded bg-gray-100">{ext}</span>
                                  <span className="text-xs text-gray-400 ml-2">Étape : {file.stageName}</span>
                                  <a
                                    href={`/api/projects/${selectedProject._id}/${file.type === 'mandat-sepa' ? 'mandat-sepa' : file.type === 'general' ? 'general' : 'cahier-des-charges/file'}?fileId=${file.fileId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto"
                                  >
                                    <Button size="sm" variant="outline" className="border-brand-blue text-brand-blue hover:bg-brand-blue/10">Télécharger</Button>
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50"
                                    title="Supprimer le fichier"
                                    onClick={async () => {
                                      if (!window.confirm('Supprimer ce fichier ?')) return;
                                      try {
                                        if (file.type === 'mandat-sepa') {
                                          await fetch(`/api/projects/${selectedProject._id}/mandat-sepa?fileId=${file.fileId}`, {
                                            method: 'DELETE',
                                          });
                                        } else if (file.type === 'general') {
                                          await fetch(`/api/projects/${selectedProject._id}/general?fileId=${file.fileId}`, {
                                            method: 'DELETE',
                                          });
                                        } else {
                                          await fetch(`/api/projects/${selectedProject._id}/cahier-des-charges/file?fileId=${file.fileId}`, {
                                            method: 'DELETE',
                                          });
                                        }
                                        // Recharge les projets pour mettre à jour la liste
                                        const res = await fetch('/api/projects');
                                        const data = await res.json();
                                        setProjects(data);
                                        setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
                                      } catch (error) {
                                        console.error('Erreur lors de la suppression:', error);
                                        alert('Une erreur est survenue lors de la suppression du fichier');
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Détails projet */}
              <div>
                {selectedProject ? (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-brand-dark">{selectedProject.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-brand-dark">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-gray-200">
                            <DropdownMenuLabel className="text-brand-dark">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-100" />
                            <DropdownMenuItem className="text-gray-700 focus:text-brand-dark focus:bg-gray-50">
                              <Edit className="mr-2 h-4 w-4 text-brand-blue" />
                              Modifier le projet
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-700 focus:text-brand-dark focus:bg-gray-50">
                              <Send className="mr-2 h-4 w-4 text-brand-blue" />
                              Envoyer un email au client
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-gray-700 focus:text-brand-dark focus:bg-gray-50"
                              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-gantt']: true }))}
                            >
                              <FileText className="mr-2 h-4 w-4 text-brand-blue" />
                              Voir le Gantt chart
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-white focus:bg-red-600"
                              onClick={handleDeleteProject}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer le projet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>
                        Client : {selectedProject.client} • Démarré le :{" "}
                        {selectedProject.startDate
                          ? new Date(selectedProject.startDate).toLocaleDateString("fr-FR")
                          : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                          <TabsTrigger
                            value="details"
                            className="data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-sm"
                          >
                            Détails
                          </TabsTrigger>
                          <TabsTrigger
                            value="stages"
                            className="data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-sm"
                          >
                            Étapes
                          </TabsTrigger>
                          <TabsTrigger
                            value="comments"
                            className="data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-sm"
                          >
                            Commentaires
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-brand-dark">Informations client</h4>
                            <div className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-brand-blue" />
                                <span className="text-sm text-gray-700">{selectedProject.client}</span>
                              </div>
                              <div className="mt-1 flex items-center space-x-2">
                                <MessageSquare className="h-4 w-4 text-brand-blue" />
                                <span className="text-sm text-gray-700">{selectedProject.clientEmail}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-brand-dark">Étape actuelle</h4>
                            <div className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  {selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)?.name}
                                </span>
                                <Badge
                                  className={
                                    selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)
                                      ?.status === "terminé"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)
                                            ?.status === "en cours"
                                        ? "bg-brand-yellow/20 text-brand-dark hover:bg-brand-yellow/30"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                  }
                                >
                                  {selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)?.status}
                                </Badge>
                              </div>
                              {selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)?.date && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Depuis le{" "}
                                  {new Date(
                                    selectedProject.stages?.find((s: any) => s.id === selectedProject.currentStage)?.date,
                                  ).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-brand-dark">Actions</h4>
                            <div className="flex flex-col space-y-2">
                              <Button
                                onClick={handleCompleteStage}
                                className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer l'étape comme terminée
                              </Button>
                              <Button
                                variant="outline"
                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 relative overflow-hidden"
                                asChild
                              >
                                <label className="cursor-pointer w-full">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ajouter des documents
                                  <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    style={{ width: "100%", height: "100%" }}
                                  />
                                </label>
                              </Button>
                              {uploadedFile && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Fichier sélectionné : {uploadedFile.name}
                                </div>
                              )}
                              <Button
                                variant="outline"
                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                onClick={handleSendEmail}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Envoyer un email au client
                              </Button>
                              {/* Bouton Revenir à l'étape précédente, visible seulement pour l'admin et si ce n'est pas la première étape */}
                              {user.role === "admin" && selectedProject.currentStage > 1 && (
                                <Button
                                  onClick={handleGoToPreviousStage}
                                  className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                  disabled={!selectedProject || selectedProject.currentStage <= 1}
                                >
                                  Revenir à l'étape précédente
                                </Button>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="stages" className="space-y-4 pt-4">
                          <div className="space-y-4">
                            {selectedProject.stages?.map((stage: any) => (
                              <div key={stage.id} className="flex items-center space-x-4">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    stage.status === "terminé"
                                      ? "bg-green-100 text-green-600"
                                      : stage.status === "en cours"
                                        ? "bg-brand-yellow/20 text-brand-dark"
                                        : "bg-gray-100 text-gray-400"
                                  } cursor-pointer`}
                                  onClick={() => handleOpenStage(stage.id)}
                                  title="Afficher/Masquer les détails de l'étape"
                                >
                                  {stage.id}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-brand-dark cursor-pointer" onClick={() => handleOpenStage(stage.id)}>{stage.name}</h4>
                                    <Badge
                                      variant={
                                        stage.status === "terminé"
                                          ? "default"
                                          : stage.status === "en cours"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className={
                                        stage.status === "terminé"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : stage.status === "en cours"
                                            ? "bg-brand-yellow/20 text-brand-dark hover:bg-brand-yellow/30"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                      }
                                    >
                                      {stage.status}
                                    </Badge>
                                  </div>
                                  {stage.date && (
                                    <p className="text-xs text-gray-500">
                                      {stage.status === "terminé" ? "Terminé le " : "Démarré le "}
                                      {new Date(stage.date).toLocaleDateString("fr-FR")}
                                    </p>
                                  )}
                                  {stage.feedbackRounds !== undefined && (
                                    <p className="text-xs text-gray-500">
                                      Tours de feedback : {stage.feedbackRounds}/{stage.maxFeedbackRounds}
                                    </p>
                                  )}
                                  {/* Affichage du champ devisUrl SEULEMENT si l'étape est ouverte */}
                                  {stage.id === 3 && openedStageId === 3 && (
                                    <div className="mt-2">
                                      <label className="block text-xs font-medium text-brand-dark mb-1">Lien vers la plateforme de devis</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="url"
                                          className="flex-1 border rounded px-2 py-1 text-sm truncate"
                                          placeholder="https://..."
                                          value={stage.devisUrl || ''}
                                          onChange={e => handleDevisUrlChange(e.target.value, 3)}
                                          style={{ minWidth: 0 }}
                                        />
                                        <Button
                                          variant="outline"
                                          className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={async () => {
                                            await handleDevisUrlChange(stage.devisUrl || '', 3);
                                            if (typeof window !== 'undefined') {
                                              window.dispatchEvent(new CustomEvent('devis-url-saved'));
                                            }
                                          }}
                                        >
                                          Enregistrer
                                        </Button>
                                      </div>
                                      {stage.devisUrl && (
                                        <div className="mt-1 text-xs text-brand-blue break-all max-w-full">
                                          Lien actuel : <a href={stage.devisUrl} target="_blank" rel="noopener noreferrer" className="underline break-all max-w-full inline-block">{stage.devisUrl}</a>
                                        </div>
                                      )}
                                      <DevisUrlToast />
                                    </div>
                                  )}
                                  {/* Affichage du champ signatureUrl SEULEMENT si l'étape Signature est ouverte */}
                                  {stage.id === 4 && openedStageId === 4 && (
                                    <div className="mt-2">
                                      <label className="block text-xs font-medium text-brand-dark mb-1">Lien de signature électronique</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="url"
                                          className="flex-1 border rounded px-2 py-1 text-sm truncate"
                                          placeholder="https://..."
                                          value={stage.signatureUrl || ''}
                                          onChange={e => handleSignatureUrlChange(e.target.value, 4)}
                                          style={{ minWidth: 0 }}
                                        />
                                        <Button
                                          variant="outline"
                                          className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={async () => {
                                            await handleSignatureUrlChange(stage.signatureUrl || '', 4);
                                            if (typeof window !== 'undefined') {
                                              window.dispatchEvent(new CustomEvent('devis-url-saved'));
                                            }
                                          }}
                                        >
                                          Enregistrer
                                        </Button>
                                      </div>
                                      {stage.signatureUrl && (
                                        <div className="mt-1 text-xs text-brand-blue break-all max-w-full">
                                          Lien actuel : <a href={stage.signatureUrl} target="_blank" rel="noopener noreferrer" className="underline break-all max-w-full inline-block">{stage.signatureUrl}</a>
                                        </div>
                                      )}
                                      <DevisUrlToast />
                                    </div>
                                  )}
                                  {/* Affichage du champ logoBrandingUrl SEULEMENT si l'étape Logo/Branding est ouverte */}
                                  {stage.name.toLowerCase().includes("logo") && openedStageId === stage.id && (
                                    <>
                                      <div className="mt-2">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">Lien logo/branding</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="url"
                                            className="flex-1 border rounded px-2 py-1 text-sm truncate"
                                            placeholder="https://..."
                                            value={stage.logoBrandingUrl || ''}
                                            onChange={e => handleLogoBrandingUrlChange(e.target.value, stage.id)}
                                            style={{ minWidth: 0 }}
                                          />
                                          <Button
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                            onClick={async () => {
                                              await handleLogoBrandingUrlChange(stage.logoBrandingUrl || '', stage.id);
                                              if (typeof window !== 'undefined') {
                                                window.dispatchEvent(new CustomEvent('devis-url-saved'));
                                              }
                                            }}
                                          >
                                            Enregistrer
                                          </Button>
                                        </div>
                                        {stage.logoBrandingUrl && (
                                          <div className="mt-1 text-xs text-brand-blue break-all max-w-full">
                                            Lien actuel : <a href={stage.logoBrandingUrl} target="_blank" rel="noopener noreferrer" className="underline break-all max-w-full inline-block">{stage.logoBrandingUrl}</a>
                                          </div>
                                        )}
                                        <DevisUrlToast />
                                      </div>
                                      {/* Encadré spécial commentaires client pour logo/branding */}
                                      {stage.comments && stage.comments.length > 0 && (
                                        <div className="mt-4 p-3 border-2 border-brand-yellow bg-yellow-50 rounded">
                                          <div className="font-semibold text-brand-dark mb-2">Commentaires client sur le logo/branding :</div>
                                          <ul className="space-y-2">
                                            {stage.comments.map((comment: any, idx: number) => (
                                              <li key={idx} className="text-sm text-gray-700 bg-white rounded p-2 border">
                                                {comment.text}
                                                {comment.createdAt && (
                                                  <span className="block text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {/* Etape Copyrighting */}
                                  {stage.name.toLowerCase().includes("copyrighting") && stage.copyrightingAnswers && openedStageId === stage.id && (
                                    <div className="mt-2">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm text-gray-600">
                                          Réponses du formulaire :
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenStage(null)}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {Object.entries(stage.copyrightingAnswers).map(([key, value]) => {
                                          if (key === 'submittedAt') return null;
                                          return (
                                            <div key={key} className="text-sm">
                                              <span className="font-medium">{key} : </span>
                                              <span>{typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {/* Gantt chart pour l'étape de développement */}
                                  {stage.id === 14 && openedStageId === 14 && (
                                    <div className="mt-4">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-medium text-brand-dark">
                                          Planning de développement
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenStage(null)}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="border rounded-lg p-4 bg-white">
                                        <Button
                                          variant="outline"
                                          className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-gantt']: true }))}
                                        >
                                          <FileText className="mr-2 h-4 w-4" />
                                          Accéder au planning de développement
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {/* 2. Ajouter le bloc d'édition pour l'étape 10 (Aperçu Figma) */}
                                  {stage.id === 10 && openedStageId === 10 && (
                                    <div className="mt-2">
                                      <label className="block text-xs font-medium text-brand-dark mb-1">Lien Aperçu Figma</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="url"
                                          className="flex-1 border rounded px-2 py-1 text-sm truncate"
                                          placeholder="https://figma.com/file/..."
                                          value={stage.figmaUrl || ''}
                                          onChange={e => handleFigmaUrlChange(e.target.value, 10)}
                                          style={{ minWidth: 0 }}
                                        />
                                        <Button
                                          variant="outline"
                                          className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          onClick={async () => {
                                            await handleFigmaUrlChange(stage.figmaUrl || '', 10);
                                            if (typeof window !== 'undefined') {
                                              window.dispatchEvent(new CustomEvent('devis-url-saved'));
                                            }
                                          }}
                                        >
                                          Enregistrer
                                        </Button>
                                      </div>
                                      {stage.figmaUrl && (
                                        <div className="mt-1 text-xs text-brand-blue break-all max-w-full">
                                          Lien actuel : <a href={stage.figmaUrl} target="_blank" rel="noopener noreferrer" className="underline break-all max-w-full inline-block">{stage.figmaUrl}</a>
                                        </div>
                                      )}
                                      <DevisUrlToast />
                                    </div>
                                  )}
                                  {/* Paiement initial */}
                                  {stage.name.toLowerCase().includes("paiement initial") && (
                                    <div className="mt-4">
                                      <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">
                                          Lien de paiement
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={stage.paiementUrl || ""}
                                            onChange={(e) => handlePaiementUrlChange(e.target.value, stage.id)}
                                            placeholder="Entrez l'URL de paiement"
                                            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                          />
                                          {stage.paiementUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => window.open(stage.paiementUrl, "_blank")}
                                            >
                                              Voir le lien
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Affichage du champ paiementUrl SEULEMENT si l'étape Paiement initial est ouverte */}
                                  {stage.id === 5 && openedStageId === 5 && (
                                    <div className="mt-2 space-y-4">
                                      {/* Upload RIB */}
                                      <div>
                                        <label className="block text-xs font-medium text-brand-dark mb-1">Fichier RIB (PDF à fournir au client)</label>
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="file"
                                            accept="application/pdf"
                                            id={`rib-upload-${selectedProject._id}`}
                                            style={{ display: "none" }}
                                            onChange={async (e) => {
                                              if (!e.target.files || e.target.files.length === 0) return;
                                              const file = e.target.files[0];
                                              const formData = new FormData();
                                              formData.append("file", file);
                                              formData.append("stageId", "5"); // Ajout pour cibler l'étape 5
                                              await fetch(`/api/projects/${selectedProject._id}/cahier-des-charges/upload`, {
                                                method: "POST",
                                                body: formData,
                                              });
                                              // Recharge les projets
                                              const res = await fetch("/api/projects");
                                              const data = await res.json();
                                              setProjects(data);
                                              setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
                                            }}
                                          />
                                          <Button
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                            onClick={() => document.getElementById(`rib-upload-${selectedProject._id}`)?.click()}
                                          >
                                            Upload RIB
                                          </Button>
                                          {/* Affichage du fichier RIB s'il existe */}
                                          {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                            <a
                                              href={`/api/projects/${selectedProject._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="ml-2 text-xs underline text-brand-blue"
                                            >
                                              Voir le RIB
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                      {/* Champ URL Mandat SEPA */}
                                      <div className="mt-4">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">Mandat SEPA</label>
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="file"
                                            accept="application/pdf"
                                            id={`mandat-sepa-upload-${selectedProject._id}`}
                                            style={{ display: "none" }}
                                            onChange={async (e) => {
                                              if (!e.target.files || e.target.files.length === 0) return;
                                              const file = e.target.files[0];
                                              const formData = new FormData();
                                              formData.append("file", file);
                                              formData.append("stageId", "5"); // Ajout pour cibler l'étape 5
                                              await fetch(`/api/projects/${selectedProject._id}/mandat-sepa/upload`, {
                                                method: "POST",
                                                body: formData,
                                              });
                                              // Recharge les projets
                                              const res = await fetch("/api/projects");
                                              const data = await res.json();
                                              setProjects(data);
                                              setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
                                            }}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => document.getElementById(`mandat-sepa-upload-${selectedProject._id}`)?.click()}
                                            >
                                              Upload Mandat SEPA
                                            </Button>
                                            {stage.mandatSepaFile && (
                                              <Button
                                                variant="outline"
                                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                                type="button"
                                                onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-mandat']: true }))}
                                              >
                                                Voir le mandat
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {/* Champ URL de paiement */}
                                      <div className="mt-4">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">
                                          Lien de paiement
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={stage.paiementUrl || ""}
                                            onChange={(e) => handlePaiementUrlChange(e.target.value, stage.id)}
                                            placeholder="Entrez l'URL de paiement"
                                            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                          />
                                          {stage.paiementUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => window.open(stage.paiementUrl, "_blank")}
                                            >
                                              Voir le lien
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Paiement final */}
                                  {stage.id === 16 && (
                                    <div className="mt-4">
                                      <div className="flex flex-col gap-2">
                                        {/* Upload RIB */}
                                        <div>
                                          <label className="block text-xs font-medium text-brand-dark mb-1">Fichier RIB (PDF à fournir au client)</label>
                                          <div className="flex gap-2 items-center">
                                            <input
                                              type="file"
                                              accept="application/pdf"
                                              id={`rib-upload-final-${selectedProject._id}`}
                                              style={{ display: "none" }}
                                              onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return;
                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append("file", file);
                                                formData.append("stageId", stage.id.toString());
                                                await fetch(`/api/projects/${selectedProject._id}/cahier-des-charges/upload`, {
                                                  method: "POST",
                                                  body: formData,
                                                });
                                                // Recharge les projets
                                                const res = await fetch("/api/projects");
                                                const data = await res.json();
                                                setProjects(data);
                                                setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
                                              }}
                                            />
                                            <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => document.getElementById(`rib-upload-final-${selectedProject._id}`)?.click()}
                                            >
                                              Upload RIB
                                            </Button>
                                            {/* Affichage du fichier RIB s'il existe */}
                                            {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                              <a
                                                href={`/api/projects/${selectedProject._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 text-xs underline text-brand-blue"
                                              >
                                                Voir le RIB
                                              </a>
                                            )}
                                          </div>
                                        </div>

                                        {/* Champ URL Mandat SEPA */}
                                        <div className="mt-4">
                                          <label className="block text-xs font-medium text-brand-dark mb-1">Mandat SEPA</label>
                                          <div className="flex gap-2 items-center">
                                            <input
                                              type="file"
                                              accept="application/pdf"
                                              id={`mandat-sepa-upload-final-${selectedProject._id}`}
                                              style={{ display: "none" }}
                                              onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return;
                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append("file", file);
                                                formData.append("stageId", stage.id.toString());
                                                await fetch(`/api/projects/${selectedProject._id}/mandat-sepa/upload`, {
                                                  method: "POST",
                                                  body: formData,
                                                });
                                                // Recharge les projets
                                                const res = await fetch("/api/projects");
                                                const data = await res.json();
                                                setProjects(data);
                                                setSelectedProject(data.find((p: any) => p._id === selectedProject._id));
                                              }}
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                                onClick={() => document.getElementById(`mandat-sepa-upload-final-${selectedProject._id}`)?.click()}
                                              >
                                                Upload Mandat SEPA
                                              </Button>
                                              {stage.mandatSepaFile && (
                                                <Button
                                                  variant="outline"
                                                  className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                                  type="button"
                                                  onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-mandat-final']: true }))}
                                                >
                                                  Voir le mandat
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Champ URL de paiement */}
                                        <div className="mt-4">
                                          <label className="block text-xs font-medium text-brand-dark mb-1">
                                            Lien de paiement final
                                          </label>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={stage.paiementUrl || ""}
                                              onChange={(e) => handlePaiementUrlChange(e.target.value, stage.id)}
                                              placeholder="Entrez l'URL de paiement final"
                                              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                            />
                                            {stage.paiementUrl && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(stage.paiementUrl, "_blank")}
                                              >
                                                Voir le lien
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Paiement après validation finale */}
                                  {stage.name.toLowerCase() === "paiement" && (
                                    <div className="mt-4">
                                      <div className="flex flex-col gap-2">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">
                                          Lien de paiement
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={stage.paiementUrl || ""}
                                            onChange={(e) => handlePaiementUrlChange(e.target.value, stage.id)}
                                            placeholder="Entrez l'URL de paiement"
                                            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                          />
                                          {stage.paiementUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => window.open(stage.paiementUrl, "_blank")}
                                            >
                                              Voir le lien
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Préparer développement */}
                                  {stage.name.toLowerCase().includes("préparer développement") && stage.preparerDevAnswers && openedStageId === stage.id && (
                                    <div className="mt-2">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm text-gray-600">
                                          Réponses du formulaire Préparer développement :
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenStage(null)}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {Object.entries(stage.preparerDevAnswers).map(([key, value]) => {
                                          if (key === 'submittedAt') return null;
                                          return (
                                            <div key={key} className="text-sm">
                                              <span className="font-medium">{key} : </span>
                                              <span>{typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {/* Proposer un rendez-vous */}
                                  {stage.id === 1 && (
                                    <div className="mt-4 space-y-4">
                                      <div className="flex flex-col gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Proposer un rendez-vous
                                          </label>
                                          <div className="flex gap-4">
                                            <div className="flex-1">
                                              <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                locale={fr}
                                                className="rounded-md border"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <select
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                              >
                                                <option value="">Sélectionner une heure</option>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                  <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                                                    {`${i.toString().padStart(2, "0")}:00`}
                                                  </option>
                                                ))}
                                              </select>
                                              <Button
                                                onClick={() => handleAddMeetingProposal(selectedProject._id)}
                                                className="mt-2 w-full"
                                                disabled={!selectedDate || !selectedTime}
                                              >
                                                Proposer ce rendez-vous
                                              </Button>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Liste des propositions */}
                                        {stage.meetingProposals && stage.meetingProposals.length > 0 && (
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                              Propositions de rendez-vous
                                            </h4>
                                            <div className="space-y-2">
                                              {stage.meetingProposals.map((proposal: any) => (
                                                <div
                                                  key={proposal.id}
                                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
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
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                      if (confirm("Voulez-vous supprimer cette proposition ?")) {
                                                        if (!proposal.id) {
                                                          alert("ID de proposition manquant ! Impossible de supprimer.");
                                                          console.log("Proposition sans id:", proposal);
                                                          return;
                                                        }
                                                        console.log("Suppression proposition id:", proposal.id);
                                                        try {
                                                          const response = await fetch(
                                                            `/api/projects/${selectedProject._id}/meeting-proposals?proposalId=${proposal.id}`,
                                                            { method: "DELETE" }
                                                          )
                                                          if (!response.ok) {
                                                            const err = await response.json();
                                                            throw new Error(err.error || "Erreur lors de la suppression");
                                                          }
                                                          // Recharger les projets
                                                          const res = await fetch("/api/projects")
                                                          const data = await res.json()
                                                          setProjects(data)
                                                          setSelectedProject(data.find((p: any) => p._id === selectedProject._id))
                                                        } catch (error) {
                                                          console.error("Erreur:", error)
                                                          alert("Erreur lors de la suppression: " + (error.message || error))
                                                        }
                                                      }
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="comments" className="space-y-4 pt-4">
                          <div className="space-y-4">
                            {(selectedProject.comments || []).map((comment: any) => (
                              <div key={comment.id} className="rounded-md bg-gray-50 p-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-brand-dark">{comment.user}</h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.date).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))}

                            <div className="flex items-center space-x-2">
                              <Textarea
                                placeholder="Ajouter un commentaire..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[80px] border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                              />
                            </div>
                            <Button
                              onClick={async () => {
                                if (!newComment.trim()) return
                                await fetch(`/api/projects/${selectedProject._id}/comments`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    user: user.firstName,
                                    text: newComment,
                                  }),
                                })
                                const res = await fetch("/api/projects")
                                const data = await res.json()
                                setProjects(data)
                                setSelectedProject(data.find((p: any) => p._id === selectedProject._id))
                                setNewComment("")
                              }}
                              className="w-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"
                            >
                              Ajouter le commentaire
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-brand-dark">Détails du projet</CardTitle>
                      <CardDescription>Sélectionnez un projet pour voir les détails</CardDescription>
                    </CardHeader>
                    <CardContent className="flex h-[400px] items-center justify-center">
                      <p className="text-center text-gray-500">Aucun projet sélectionné</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 bg-gray-50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2024 ProjectFlow. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Modal pour afficher le mandat SEPA */}
      {selectedProject && selectedProject.stages && selectedProject.stages.map((stage: any) => (
        stage.mandatSepaFile && showRibModal[selectedProject._id + '-mandat'] && (
          <div key={stage.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[80vh] p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-mandat']: false }))}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-brand-dark mb-4">Mandat SEPA</h2>
              <iframe
                src={`/api/projects/${selectedProject._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                className="w-full h-full border-0"
                title="Mandat SEPA"
              />
            </div>
          </div>
        )
      ))}

      {/* Modal pour afficher le mandat SEPA final */}
      {selectedProject && selectedProject.stages && selectedProject.stages.map((stage: any) => (
        stage.mandatSepaFile && showRibModal[selectedProject._id + '-mandat-final'] && (
          <div key={stage.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[80vh] p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-mandat-final']: false }))}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-brand-dark mb-4">Mandat SEPA Final</h2>
              <iframe
                src={`/api/projects/${selectedProject._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                className="w-full h-full border-0"
                title="Mandat SEPA Final"
              />
            </div>
          </div>
        )
      ))}

      {/* Modal pour afficher le diagramme de Gantt */}
      {selectedProject && showRibModal[selectedProject._id + '-gantt'] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[90vh] p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [selectedProject._id + '-gantt']: false }))}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Planning de développement</h2>
            <div className="h-[calc(100%-4rem)]">
              <GanttChart
                projectId={selectedProject._id}
                tasks={selectedProject.developmentTasks || []}
                onTasksChange={async (newTasks) => {
                  try {
                    const response = await fetch(`/api/projects/${selectedProject._id}/development-tasks`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ tasks: newTasks }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to update development tasks');
                    }
                    
                    // Mettre à jour l'état local
                    const updatedProject = await response.json();
                    setProjects(projects.map(p => 
                      p._id === selectedProject._id ? { ...p, developmentTasks: updatedProject.developmentTasks } : p
                    ));
                  } catch (error) {
                    console.error('Error updating development tasks:', error);
                    alert('Erreur lors de la mise à jour des tâches de développement');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}