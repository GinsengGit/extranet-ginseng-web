"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GanttChart } from "@/components/gantt-chart"
import { useUser } from "../../../../context/UserContext"

export default function GanttPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.projectId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch project')
        }
        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error('Error fetching project:', error)
        alert('Erreur lors du chargement du projet')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.projectId])

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-gray-500 text-lg">Chargement...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-gray-500 text-lg">Chargement du projet...</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-gray-500 text-lg">Projet non trouvé</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full bg-brand-dark text-white">
        <div className="container flex h-16 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Planning de développement</h1>
            <p className="text-sm text-gray-300">{project.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <GanttChart
            projectId={project._id}
            tasks={project.developmentTasks || []}
            onTasksChange={async (newTasks) => {
              try {
                const response = await fetch(`/api/projects/${project._id}/development-tasks`, {
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
                setProject(updatedProject);
              } catch (error) {
                console.error('Error updating development tasks:', error);
                alert('Erreur lors de la mise à jour des tâches de développement');
              }
            }}
          />
        </div>
      </main>
    </div>
  )
} 