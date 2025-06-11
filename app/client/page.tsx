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
  LogOut
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

// Remplace cette variable par l'email du client connecté (ex: via session)
import { useUser } from "../../context/UserContext"

export default function TableauDeBordClient() {
  const { user, isLoading } = useUser()
  const router = useRouter()
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

  if (isLoading || user === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-500 text-lg">Chargement...</div>
      </div>
    )
  }

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

                // Trouver l’étape "Demander un rendez-vous"
                const demandeRdvStage = project.stages.find((stage: any) => stage.name.toLowerCase().includes("demande un rendez-vous"));
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

                // Construit la liste ordonnée : toutes les étapes, avec "upload" juste après "paiement initiale"
                let mainStages: any[] = [];
                if (paiementInitialeIndex !== -1 && uploadStageIndex !== -1) {
                  mainStages = [
                    ...project.stages.slice(0, paiementInitialeIndex + 1),
                    uploadStage,
                    ...project.stages.slice(paiementInitialeIndex + 1).filter((s: any) => s.id !== uploadStage.id),
                  ];
                } else {
                  mainStages = project.stages;
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
                      {/* Bouton RDV en haut à droite si accessible */}
                      {demandeRdvStage && allPrevStagesDone && (
                        <div className="mt-4 md:mt-0">
                          <Button
                            className="bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark shadow"
                            onClick={() => window.open("https://calendly.com/emmanuel-gsweb/parlons-de-votre-projet-30-minutes", "_blank")}
                          >
                            Prendre rendez-vous
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
                              // Elle est accessible si toutes les étapes précédentes sont terminées (avant upload)
                              const prevStages = project.stages.filter((s: any) => s.id < stage.id);
                              const canUpload = prevStages.every((s: any) => s.status === "terminé");
                              if (!canUpload) {
                                return (
                                  <Card key={stage.id}
                                    className={`border border-brand-blue shadow-md bg-blue-50 opacity-70`}>
                                    <CardHeader className="pb-2">
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg text-brand-dark">{stage.name}</CardTitle>
                                        <LockIcon className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <CardDescription>
                                        Verrouillé
                                      </CardDescription>
                                    </CardHeader>
                                  </Card>
                                );
                              }
                              return (
                                <Card key={stage.id}
                                  className={`border border-brand-blue shadow-md bg-blue-50 ${stage.status === 'verrouillé' ? 'opacity-70' : ''} ${stage.status === 'en cours' ? 'ring-2 ring-brand-yellow/50' : ''}`}>
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
                                        <>Débloqué</>
                                      )}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                      <label htmlFor={`file-upload-${project._id}-${stage.id}`} className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded cursor-pointer hover:bg-brand-yellow hover:text-brand-dark transition-colors">
                                        <Upload className="mr-2 h-5 w-5" />
                                        Choisir un fichier
                                        <input
                                          id={`file-upload-${project._id}-${stage.id}`}
                                          type="file"
                                          accept="application/pdf"
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
                                    <div className="text-xs text-gray-500 mb-2">Formats acceptés : PDF</div>
                                    {/* Liste des fichiers uploadés pour cette étape */}
                                    {stage.cahierDesChargesFiles && stage.cahierDesChargesFiles.length > 0 ? (
                                      <ul className="mt-2 space-y-2">
                                        {stage.cahierDesChargesFiles.map((file: any) => (
                                          <li key={file.fileId} className="flex items-center gap-2">
                                            <a
                                              href={`/api/projects/${project._id}/cahier-des-charges/file?fileId=${file.fileId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="underline text-brand-blue"
                                            >
                                              {file.fileName || "Fichier PDF"}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="text-xs text-gray-400">Aucun fichier uploadé pour cette étape.</div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            }

                            // Affichage normal pour les autres étapes
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
                                  {/* Bouton Voir le devis pour l'étape Devis */}
                                  {stage.name.toLowerCase().includes("devis") && stage.devisUrl && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => window.open(stage.devisUrl, '_blank')}
                                    >
                                      Voir le devis
                                    </Button>
                                  )}

                                  {/* Bouton Uploader un fichier pour l'étape Cahier des charges */}
                                  {stage.name.toLowerCase().includes("cahier des charges") && (
                                    <Button
                                      variant="outline"
                                      className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10 mb-2"
                                      onClick={() => {
                                        const uploadSection = document.getElementById(`upload-section-${project._id}`);
                                        if (uploadSection) {
                                          uploadSection.scrollIntoView({ behavior: "smooth" });
                                        }
                                      }}
                                    >
                                      Uploader un fichier
                                    </Button>
                                  )}

                                  {stage.id === 5 && (
                                    <div className="mt-2">
                                      <Button
                                        className="w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark"
                                        onClick={() => setShowPaymentOptions((prev: any) => ({ ...prev, [project._id + '-' + stage.id]: !prev[project._id + '-' + stage.id] }))}
                                      >
                                        Payer
                                      </Button>
                                      {showPaymentOptions && showPaymentOptions[project._id + '-' + stage.id] && (
                                        <div className="mt-2 flex flex-col gap-2 p-3 rounded border border-brand-blue bg-blue-50">
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
                                          {/* Bouton signature mandat SEPA */}
                                          {stage.signatureUrl && (
                                            <Button
                                              variant="outline"
                                              className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => window.open(stage.signatureUrl, '_blank')}
                                            >
                                              Signer le mandat
                                            </Button>
                                          )}
                                          {/* Bouton paiement en ligne */}
                                          {stage.paiementUrl && (
                                            <Button
                                              variant="outline"
                                              className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                                              onClick={() => window.open(stage.paiementUrl, '_blank')}
                                            >
                                              Payer en ligne
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                      {/* Modal d'aperçu du RIB */}
                                      {showRibModal[project._id + '-' + stage.id] && (
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
                                                  const fallback = document.getElementById('rib-fallback-' + project._id + '-' + stage.id);
                                                  if (fallback) fallback.style.display = 'block';
                                                }}
                                              />
                                              <div id={`rib-fallback-${project._id + '-' + stage.id}`} style={{ display: 'none' }}>
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