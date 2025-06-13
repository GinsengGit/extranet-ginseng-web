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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter, useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Remplace cette variable par l'email du client connecté (ex: via session)
import { useUser } from "../../context/UserContext"

export default function TableauDeBordClient() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
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
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

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
    if (!projectId) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération du projet");
      const data = await res.json();
      
      // Récupérer les fichiers pour chaque étape
      const stagesWithFiles = await Promise.all(
        data.stages.map(async (stage: any) => {
          // Récupérer le cahier des charges (RIB)
          if (stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0) {
            const ribRes = await fetch(`/api/projects/${projectId}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`);
            if (ribRes.ok) {
              stage.ribUrl = await ribRes.text();
            }
          }

          // Récupérer le mandat SEPA
          if (stage.mandatSepaFile && stage.mandatSepaFile.fileId) {
            const mandatRes = await fetch(`/api/projects/${projectId}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`);
            if (mandatRes.ok) {
              stage.mandatSepaUrl = await mandatRes.text();
            }
          }

          // Récupérer le devis
          if (stage.devisFiles && stage.devisFiles.length > 0) {
            const devisRes = await fetch(`/api/projects/${projectId}/devis/file?fileId=${stage.devisFiles[0].fileId}`);
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
                                    {canUpload && (
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
                                          await fetch(`/api/projects/${project._id}/cahier-des-charges/upload`, {
                                            method: "POST",
                                            body: formData,
                                          });
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
                                  </CardContent>
                                </Card>
                              );
                            }
                            // Affichage spécial pour le paiement final
                            else if (stage && stage.name && stage.name.toLowerCase().includes("paiement final")) {
                              return (
                                <Card key={stage.id} className={`border ${stage.status === "en_cours" ? "border-brand-blue shadow-md bg-blue-50" : "border-gray-200"} ${stage.status === "terminé" ? "bg-green-50" : ""}`}>
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
                                    {stage.status === "en_cours" && (
                                      <div className="flex flex-col gap-4">
                                        {/* Boutons d'action */}
                                        <div className="flex flex-wrap gap-2">
                                          {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                              <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id]: true }))}
                                              >
                                              Voir le RIB
                                              </Button>
                                            )}
                                          {stage.mandatSepaFile && (
                                            <Button
                                              variant="outline"
                                              className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat']: true }))}
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
                                  stage.status === "verrouillé" ? "opacity-70" : ""
                                } ${stage.status === "en cours" ? "ring-2 ring-brand-yellow/50" : ""}`}
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
                                </CardHeader>
                                <CardContent>
                                  {/* Etape Signature : bouton Signer */}
                                  {stage.name.toLowerCase().includes("signature") && stage.signatureUrl && stage.status !== "terminé" && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10 mb-2"
                                      onClick={() => window.open(stage.signatureUrl, '_blank')}
                                    >
                                      Signer
                                    </Button>
                                  )}

                                  {/* Etape Devis : bouton Voir le devis */}
                                    {stage.name.toLowerCase().includes("devis") && stage.status !== "terminé" && (
                                      <div className="mt-2">
                                        {/* Bouton pour voir le devis */}
                                        {stage.devisUrl && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => window.open(stage.devisUrl, '_blank')}
                                    >
                                      Voir le devis
                                    </Button>
                                        )}
                                        
                                        {/* Liste des fichiers de devis */}
                                        {project.devisFiles && project.devisFiles.length > 0 ? (
                                          <ul className="mt-2 space-y-2">
                                            {project.devisFiles.map((file: any) => (
                                              <li key={file.fileId} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                  <a
                                                    href={file.filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline text-brand-blue"
                                                  >
                                                    {file.fileName || "Fichier"}
                                                  </a>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : !stage.devisUrl && (
                                          <div className="text-xs text-gray-400">Aucun devis disponible.</div>
                                        )}
                                      </div>
                                  )}

                                  {/* Etape Logo/Branding : bouton Voir le logo/branding */}
                                  {stage.name.toLowerCase().includes("logo") && stage.logoBrandingUrl && stage.status !== "terminé" && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => window.open(stage.logoBrandingUrl, '_blank')}
                                    >
                                      Voir le logo/branding
                                    </Button>
                                  )}

                                  {/* Etape Figma : bouton Voir l'aperçu Figma */}
                                  {stage.name.toLowerCase().includes("figma") && stage.figmaUrl && stage.status !== "terminé" && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => window.open(stage.figmaUrl, '_blank')}
                                    >
                                      Voir l'aperçu Figma
                                    </Button>
                                  )}

                                  {/* Etape Copyrighting : bouton pour accéder au formulaire dédié */}
                                  {stage.name.toLowerCase().includes("copyrighting") && stage.status !== "terminé" && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => window.location.href = `/client/projects/${project._id}/stages/${stage.id}/copyrighting-form`}
                                    >
                                      Remplir le formulaire
                                    </Button>
                                  )}

                                  {/* Bouton Uploader un fichier pour l'étape Cahier des charges */}
                                  {stage.name.toLowerCase().includes("cahier des charges") && stage.status !== "terminé" && (
                                    <div className="mt-2">
                                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                        <label htmlFor={`file-upload-cdc-${project._id}-${stage.id}`} className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded cursor-pointer hover:bg-brand-yellow hover:text-brand-dark transition-colors">
                                          <Upload className="mr-2 h-5 w-5" />
                                          Choisir un fichier
                                          <input
                                            id={`file-upload-cdc-${project._id}-${stage.id}`}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={e => {
                                              if (!e.target.files || e.target.files.length === 0) return;
                                              setSelectedFile(e.target.files[0]);
                                            }}
                                            disabled={isUploading || stage.status === "terminé"}
                                          />
                                        </label>
                                        {selectedFile && (
                                          <span className="text-sm text-brand-dark truncate max-w-xs">{selectedFile.name}</span>
                                        )}
                                        <Button
                                          className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                          disabled={!selectedFile || isUploading || stage.status === "terminé"}
                                          onClick={async () => {
                                            if (!selectedFile) return;
                                            setIsUploading(true);
                                            const formData = new FormData();
                                            formData.append("file", selectedFile);
                                            formData.append("stageId", stage.id);
                                            formData.append("stageName", stage.name);
                                            await fetch(`/api/projects/${project._id}/cahier-des-charges/upload`, {
                                              method: "POST",
                                              body: formData,
                                            });
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
                                      <div className="text-xs text-gray-500 mb-2">Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG</div>
                                      {/* Liste des fichiers uploadés pour cette étape */}
                                      {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                          {stage.cahierDesChargesFiles.map((file: any) => (
                                            <li key={file.fileId} className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <a
                                                  href={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${file.fileId}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="underline text-brand-blue"
                                                >
                                                  {file.fileName || "Fichier"}
                                                </a>
                                              </div>
                                              {stage.status !== "terminé" && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                  onClick={async () => {
                                                    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
                                                      try {
                                                        await fetch(`/api/projects/${project._id}/cahier-des-charges/file?fileId=${file.fileId}`, {
                                                          method: "DELETE",
                                                        });
                                                        // Recharge les projets pour mettre à jour la liste des fichiers
                                                        const res = await fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`);
                                                        const data = await res.json();
                                                        setProjects(data);
                                                      } catch (error) {
                                                        console.error("Erreur lors de la suppression du fichier:", error);
                                                        alert("Une erreur est survenue lors de la suppression du fichier.");
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-xs text-gray-400">Aucun fichier uploadé pour cette étape.</div>
                                      )}
                                    </div>
                                  )}

                                    {/* Etape Paiement */}
                                    {stage.name.toLowerCase() === "paiement" && stage.status !== "terminé" && (
                                    <div className="mt-2 flex flex-col gap-2">
                                      {/* Bouton voir RIB si fichier présent */}
                                      {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                        <Button
                                          variant="outline"
                                          className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          type="button"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-' + stage.id]: true }))}
                                        >
                                          Voir le RIB
                                        </Button>
                                      )}
                                      {/* Bouton voir mandat SEPA si présent */}
                                      {stage.mandatSepaFile && stage.mandatSepaFile.fileId && (
                                        <Button
                                          variant="outline"
                                          className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                          type="button"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat']: true }))}
                                        >
                                          Voir le mandat
                                        </Button>
                                      )}
                                      {/* Bouton payer en ligne */}
                                        {stage.paiementUrl && (
                                      <Button
                                        className="w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                            onClick={() => window.open(stage.paiementUrl, '_blank')}
                                      >
                                        Payer en ligne
                                      </Button>
                                        )}
                                    </div>
                                  )}

                                  {/* Modal d'aperçu du RIB */}
                                    {showRibModal[project._id + '-' + stage.id] && stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative flex flex-col">
                                        <button
                                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-' + stage.id]: false }))}
                                        >
                                          <span className="sr-only">Fermer</span>
                                          <X className="h-5 w-5" />
                                        </button>
                                        <h3 className="text-xl font-bold text-brand-dark mb-4">Aperçu du RIB</h3>
                                        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center gap-4">
                                          <iframe
                                            src={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                                            title="Aperçu RIB"
                                            className="w-full h-[60vh] border rounded"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                                const fallback = document.getElementById('rib-fallback-' + project._id);
                                              if (fallback) fallback.style.display = 'block';
                                            }}
                                          />
                                            <a
                                              href={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-2 flex items-center justify-center text-brand-blue hover:text-brand-yellow"
                                              title="Télécharger le RIB"
                                              download
                                            >
                                              <Download className="w-7 h-7" />
                                            </a>
                                            <div id={`rib-fallback-${project._id}`} style={{ display: 'none' }}>
                                            <p className="text-sm text-gray-500 mb-2">Impossible d'afficher le PDF dans le navigateur. Vous pouvez le télécharger&nbsp;:</p>
                                            <a
                                              href={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${stage.cahierDesChargesFiles[0].fileId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="underline text-brand-blue"
                                            >
                                              Télécharger le RIB
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Modal d'aperçu du mandat SEPA */}
                                  {showRibModal[project._id + '-mandat'] && stage.mandatSepaFile && stage.mandatSepaFile.fileId && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative flex flex-col">
                                        <button
                                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                          onClick={() => setShowRibModal((prev: any) => ({ ...prev, [project._id + '-mandat']: false }))}
                                        >
                                          <span className="sr-only">Fermer</span>
                                          <X className="h-5 w-5" />
                                        </button>
                                        <h3 className="text-xl font-bold text-brand-dark mb-4">Aperçu du mandat SEPA</h3>
                                        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center gap-4">
                                          <iframe
                                            src={`/api/projects/${project._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                                            title="Aperçu mandat SEPA"
                                            className="w-full h-[60vh] border rounded"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const fallback = document.getElementById('mandat-fallback-' + project._id);
                                              if (fallback) fallback.style.display = 'block';
                                            }}
                                          />
                                          <a
                                            href={`/api/projects/${project._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 flex items-center justify-center text-brand-blue hover:text-brand-yellow"
                                            title="Télécharger le mandat SEPA"
                                            download
                                          >
                                            <Download className="w-7 h-7" />
                                          </a>
                                          <div id={`mandat-fallback-${project._id}`} style={{ display: 'none' }}>
                                            <p className="text-sm text-gray-500 mb-2">Impossible d'afficher le PDF dans le navigateur. Vous pouvez le télécharger&nbsp;:</p>
                                            <a
                                              href={`/api/projects/${project._id}/mandat-sepa/file?fileId=${stage.mandatSepaFile.fileId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="underline text-brand-blue"
                                            >
                                              Télécharger le mandat SEPA
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                    {/* Etape Facture : bouton Voir la facture */}
                                    {stage.name.toLowerCase().includes("facture") && stage.factureUrl && stage.status !== "terminé" && (
                                      <div className="mt-2">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                          <label htmlFor={`file-upload-facture-${project._id}-${stage.id}`} className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded cursor-pointer hover:bg-brand-yellow hover:text-brand-dark transition-colors">
                                            <Upload className="mr-2 h-5 w-5" />
                                            Choisir un fichier
                                            <input
                                              id={`file-upload-facture-${project._id}-${stage.id}`}
                                              type="file"
                                              accept=".pdf"
                                              className="hidden"
                                              onChange={e => {
                                                if (!e.target.files || e.target.files.length === 0) return;
                                                setSelectedFile(e.target.files[0]);
                                              }}
                                              disabled={isUploading || stage.status === "terminé"}
                                            />
                                          </label>
                                          {selectedFile && (
                                            <span className="text-sm text-brand-dark truncate max-w-xs">{selectedFile.name}</span>
                                          )}
                                          <Button
                                            className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                            disabled={!selectedFile || isUploading || stage.status === "terminé"}
                                            onClick={async () => {
                                              if (!selectedFile) return;
                                              setIsUploading(true);
                                              const formData = new FormData();
                                              formData.append("file", selectedFile);
                                              await fetch(`/api/projects/${project._id}/factures/upload`, {
                                                method: "POST",
                                                body: formData,
                                              });
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
                                        <div className="text-xs text-gray-500 mb-2">Format accepté : PDF</div>
                                        {/* Liste des fichiers de factures */}
                                        {project.facturesFiles && project.facturesFiles.length > 0 ? (
                                          <ul className="mt-2 space-y-2">
                                            {project.facturesFiles.map((file: any) => (
                                              <li key={file.fileId} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                  <a
                                                    href={file.filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline text-brand-blue"
                                                  >
                                                    {file.fileName || "Fichier"}
                                                  </a>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div className="text-xs text-gray-400">Aucun fichier de facture uploadé.</div>
                                        )}
                                      </div>
                                    )}

                                    {/* Section d'upload de fichiers - uniquement pour l'étape 7 */}
                                    {stage.id === 7 && (
                                      <div className="mt-4">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">Fichiers uploadés</label>
                                        <div className="space-y-2">
                                          {projects[0].generalFiles && projects[0].generalFiles.length > 0 ? (
                                            projects[0].generalFiles.map((file: any, index: number) => (
                                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                  <FileText className="h-4 w-4 text-brand-blue" />
                                                  <span className="text-sm">{file.fileName}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <a
                                                    href={`/api/projects/${projects[0]._id}/general?fileId=${file.fileId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand-blue hover:underline"
                                                  >
                                                    Voir
                                                  </a>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-sm text-gray-500">Aucun fichier uploadé</p>
                                          )}
                                        </div>
                                        <div className="mt-4">
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
                                        </div>
                                      </div>
                                    )}

                                    {/* Suppression des autres boutons d'upload */}
                                    {stage.id !== 7 && stage.name.toLowerCase().includes("upload") && (
                                      <div className="mt-4">
                                        <label className="block text-xs font-medium text-brand-dark mb-1">Fichiers uploadés</label>
                                        <div className="space-y-2">
                                          {stage.files && stage.files.length > 0 ? (
                                            stage.files.map((file: any, index: number) => (
                                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                  <FileText className="h-4 w-4 text-brand-blue" />
                                                  <span className="text-sm">{file.fileName}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <a
                                                    href={`/api/projects/${projects[0]._id}/files/${file.fileId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand-blue hover:underline"
                                                  >
                                                    Voir
                                                  </a>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-sm text-gray-500">Aucun fichier uploadé</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Validation finale */}
                                    {stage.name.toLowerCase().includes("validation finale") && (
                                      <div className="mt-4">
                                        <Button
                                          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                                          disabled={stage.status === "terminé" || !projects[0].stages.every((s: { status: string }, index: number) => 
                                            index < projects[0].stages.findIndex((st: { name: string }) => st.name.toLowerCase().includes("validation finale")) 
                                              ? s.status === "terminé" 
                                              : true
                                          )}
                                          onClick={async () => {
                                            try {
                                              // Mise à jour du statut de l'étape
                                              const response = await fetch(`/api/projects/${projects[0]._id}/stages/${stage.id}`, {
                                                method: "PUT",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({
                                                  status: "terminé",
                                                  date: new Date().toISOString(),
                                                }),
                                              });

                                              const data = await response.json();

                                              if (!response.ok) {
                                                throw new Error(data.message || "Erreur lors de la validation de l'étape");
                                              }

                                              // Recharge le projet
                                              const res = await fetch(`/api/projects?clientEmail=${encodeURIComponent(user.email)}`);
                                              if (!res.ok) {
                                                throw new Error("Erreur lors du rechargement des données");
                                              }
                                              const updatedData = await res.json();
                                              setProjects(updatedData);

                                              alert("Étape validée avec succès !");
                                            } catch (error) {
                                              console.error("Erreur détaillée:", error);
                                              alert(error instanceof Error ? error.message : "Une erreur est survenue lors de la validation de l'étape");
                                            }
                                          }}
                                        >
                                          {stage.status === "terminé" ? "Étape validée" : "Valider l'étape"}
                                        </Button>
                                      </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                  {stage.status === "terminé" && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                      onClick={() => setSelectedStage(stage)}
                                    >
                                      Détails
                                    </Button>
                                  )}
                                  {stage.status === "verrouillé" && (
                                    <Button disabled className="w-full opacity-50">
                                      Verrouillé
                                    </Button>
                                  )}
                                </CardFooter>
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
    </div>
  )
}

function CopyrightingForm({ projectId, stageId, initialData, onSubmitted }: { projectId: string, stageId: number, initialData?: any, onSubmitted: () => void }) {
  const [form, setForm] = useState<any>(initialData || {});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/projects/${projectId}/stages/${stageId}/copyrighting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setSuccess(true);
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-blue-50 border border-brand-blue rounded p-4 mt-4">
      <h4 className="font-semibold text-brand-dark mb-2">Formulaire – Rédaction des pages légales de votre site internet</h4>
      <div className="text-xs text-gray-600 mb-2">Merci de remplir ce formulaire avec précision afin que nous puissions rédiger vos pages légales conformément aux obligations légales en vigueur.</div>
      {/* 1. Informations générales */}
      <div className="font-medium text-brand-dark">1. Informations générales sur l'éditeur du site</div>
      <input className="input" name="nomSociete" placeholder="Nom complet de la société / entité" value={form.nomSociete || ''} onChange={handleChange} />
      <input className="input" name="formeJuridique" placeholder="Forme juridique" value={form.formeJuridique || ''} onChange={handleChange} />
      <input className="input" name="capitalSocial" placeholder="Capital social" value={form.capitalSocial || ''} onChange={handleChange} />
      <input className="input" name="adresseSiege" placeholder="Adresse complète du siège social" value={form.adresseSiege || ''} onChange={handleChange} />
      <input className="input" name="telephone" placeholder="Numéro de téléphone à afficher" value={form.telephone || ''} onChange={handleChange} />
      <input className="input" name="emailContact" placeholder="Email de contact à afficher" value={form.emailContact || ''} onChange={handleChange} />
      <input className="input" name="siret" placeholder="Numéro SIRET / SIREN" value={form.siret || ''} onChange={handleChange} />
      <input className="input" name="rcs" placeholder="Numéro RCS + ville d'immatriculation" value={form.rcs || ''} onChange={handleChange} />
      <input className="input" name="ape" placeholder="Code APE / NAF" value={form.ape || ''} onChange={handleChange} />
      <input className="input" name="tva" placeholder="Numéro de TVA intracommunautaire" value={form.tva || ''} onChange={handleChange} />
      <input className="input" name="directeurPublication" placeholder="Nom du directeur / responsable de la publication" value={form.directeurPublication || ''} onChange={handleChange} />
      <input className="input" name="responsableRedaction" placeholder="Nom du responsable de la rédaction (si différent)" value={form.responsableRedaction || ''} onChange={handleChange} />
      {/* 2. Professions réglementées */}
      <div className="font-medium text-brand-dark mt-4">2. Informations spécifiques à certaines professions réglementées</div>
      <input className="input" name="numLicence" placeholder="Numéro de licence / d'agrément / d'enregistrement professionnel" value={form.numLicence || ''} onChange={handleChange} />
      <input className="input" name="autoritePro" placeholder="Nom et coordonnées de l'autorité ou de l'ordre professionnel" value={form.autoritePro || ''} onChange={handleChange} />
      <input className="input" name="assurance" placeholder="Conditions d'assurance (RC pro, garantie financière, etc.)" value={form.assurance || ''} onChange={handleChange} />
      {/* 3. Hébergement */}
      <div className="font-medium text-brand-dark mt-4">3. Informations sur l'hébergement du site</div>
      <div className="flex items-center gap-2">
        <label><input type="checkbox" name="hebergementOui" checked={!!form.hebergementOui} onChange={handleChange} /> Oui</label>
        <label><input type="checkbox" name="hebergementNon" checked={!!form.hebergementNon} onChange={handleChange} /> Non</label>
        <label><input type="checkbox" name="hebergementAdefinir" checked={!!form.hebergementAdefinir} onChange={handleChange} /> À définir</label>
      </div>
      {form.hebergementNon && (
        <>
          <input className="input" name="nomHebergeur" placeholder="Nom de l'hébergeur" value={form.nomHebergeur || ''} onChange={handleChange} />
          <input className="input" name="adresseHebergeur" placeholder="Adresse complète de l'hébergeur" value={form.adresseHebergeur || ''} onChange={handleChange} />
          <input className="input" name="telHebergeur" placeholder="Téléphone de l'hébergeur" value={form.telHebergeur || ''} onChange={handleChange} />
          <input className="input" name="siteHebergeur" placeholder="Site web de l'hébergeur" value={form.siteHebergeur || ''} onChange={handleChange} />
        </>
      )}
      {/* 4. RGPD */}
      <div className="font-medium text-brand-dark mt-4">4. Politique de confidentialité & RGPD</div>
      <input className="input" name="emailFormulaire" placeholder="Adresse email de réception des formulaires" value={form.emailFormulaire || ''} onChange={handleChange} />
      <div className="flex items-center gap-2">
        <label><input type="checkbox" name="collecteOui" checked={!!form.collecteOui} onChange={handleChange} /> Oui</label>
        <label><input type="checkbox" name="collecteNon" checked={!!form.collecteNon} onChange={handleChange} /> Non</label>
      </div>
      {form.collecteOui && (
        <>
          <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Pour quelles finalités ?</label>
          <div className="flex flex-wrap gap-2">
            <label><input type="checkbox" name="finaliteContact" checked={!!form.finaliteContact} onChange={handleChange} /> Gestion de contact</label>
            <label><input type="checkbox" name="finaliteNewsletter" checked={!!form.finaliteNewsletter} onChange={handleChange} /> Newsletters</label>
            <label><input type="checkbox" name="finaliteCompte" checked={!!form.finaliteCompte} onChange={handleChange} /> Création de compte</label>
            <label><input type="checkbox" name="finaliteCommande" checked={!!form.finaliteCommande} onChange={handleChange} /> Commandes/paiements</label>
            <label><input type="checkbox" name="finaliteRecrutement" checked={!!form.finaliteRecrutement} onChange={handleChange} /> Recrutement</label>
            <label><input type="checkbox" name="finaliteAutre" checked={!!form.finaliteAutre} onChange={handleChange} /> Autre</label>
          </div>
          {form.finaliteAutre && (
            <input className="input" name="finaliteAutrePreciser" placeholder="Précisez la finalité autre" value={form.finaliteAutrePreciser || ''} onChange={handleChange} />
          )}
        </>
      )}
      <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Outils de suivi ou cookies utilisés :</label>
      <div className="flex flex-wrap gap-2">
        <label><input type="checkbox" name="cookieAnalytics" checked={!!form.cookieAnalytics} onChange={handleChange} /> Google Analytics</label>
        <label><input type="checkbox" name="cookieMeta" checked={!!form.cookieMeta} onChange={handleChange} /> Pixel Meta/Facebook</label>
        <label><input type="checkbox" name="cookiePub" checked={!!form.cookiePub} onChange={handleChange} /> Publicité ciblée</label>
        <label><input type="checkbox" name="cookieAutre" checked={!!form.cookieAutre} onChange={handleChange} /> Autres</label>
      </div>
      {form.cookieAutre && (
        <input className="input" name="cookieAutrePreciser" placeholder="Précisez l'outil autre" value={form.cookieAutrePreciser || ''} onChange={handleChange} />
      )}
      <div className="flex items-center gap-2 mt-2">
        <label><input type="checkbox" name="bandeauOui" checked={!!form.bandeauOui} onChange={handleChange} /> Bandeau cookies en place</label>
        <label><input type="checkbox" name="bandeauNon" checked={!!form.bandeauNon} onChange={handleChange} /> Non</label>
        <label><input type="checkbox" name="bandeauAfaire" checked={!!form.bandeauAfaire} onChange={handleChange} /> À mettre en place</label>
      </div>
      {/* 5. Conditions Générales */}
      <div className="font-medium text-brand-dark mt-4">5. Conditions Générales (si e-commerce ou services)</div>
      <div className="flex items-center gap-2">
        <label><input type="checkbox" name="venteOui" checked={!!form.venteOui} onChange={handleChange} /> Oui</label>
        <label><input type="checkbox" name="venteNon" checked={!!form.venteNon} onChange={handleChange} /> Non</label>
      </div>
      <div className="flex items-center gap-2">
        <label><input type="checkbox" name="cgvOui" checked={!!form.cgvOui} onChange={handleChange} /> Rédaction CGV/CGU</label>
        <label><input type="checkbox" name="cgvNon" checked={!!form.cgvNon} onChange={handleChange} /> Non</label>
      </div>
      <input className="input" name="typeProduits" placeholder="Types de produits/services concernés" value={form.typeProduits || ''} onChange={handleChange} />
      <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Modes de paiement acceptés :</label>
      <div className="flex flex-wrap gap-2">
        <label><input type="checkbox" name="paiementCB" checked={!!form.paiementCB} onChange={handleChange} /> CB</label>
        <label><input type="checkbox" name="paiementVirement" checked={!!form.paiementVirement} onChange={handleChange} /> Virement</label>
        <label><input type="checkbox" name="paiementPaypal" checked={!!form.paiementPaypal} onChange={handleChange} /> Paypal</label>
        <label><input type="checkbox" name="paiementLivraison" checked={!!form.paiementLivraison} onChange={handleChange} /> À la livraison</label>
        <label><input type="checkbox" name="paiementAutre" checked={!!form.paiementAutre} onChange={handleChange} /> Autre</label>
      </div>
      {form.paiementAutre && (
        <input className="input" name="paiementAutrePreciser" placeholder="Précisez le mode de paiement autre" value={form.paiementAutrePreciser || ''} onChange={handleChange} />
      )}
      <input className="input" name="zones" placeholder="Zones géographiques desservies / livrées" value={form.zones || ''} onChange={handleChange} />
      <input className="input" name="remboursement" placeholder="Conditions de remboursement / droit de rétractation" value={form.remboursement || ''} onChange={handleChange} />
      <Button type="submit" className="w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark" disabled={submitting}>
        {submitting ? "Envoi en cours..." : "Envoyer le formulaire"}
      </Button>
      {success && <div className="text-green-600 text-sm mt-2">Formulaire envoyé avec succès !</div>}
    </form>
  );
}