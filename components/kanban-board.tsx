"use client"
import { MoreHorizontal, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Project {
  id: string
  name: string
  client: string
  currentStage: number
  stages: Array<{
    id: number
    name: string
    status: string
  }>
  isLate?: boolean
}

interface KanbanBoardProps {
  projects: Project[]
  onSelectProject: (project: Project) => void
  selectedProjectId?: string
}

export function KanbanBoard({ projects, onSelectProject, selectedProjectId }: KanbanBoardProps) {
  // Group projects by stage
  const projectsByStage = {}

  projects.forEach((project) => {
    const currentStageObj = project.stages.find((stage) => stage.id === project.currentStage)
    const stageName = currentStageObj ? currentStageObj.name : "Unknown"

    if (!projectsByStage[stageName]) {
      projectsByStage[stageName] = []
    }

    projectsByStage[stageName].push(project)
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Kanban</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(projectsByStage).map((stageName) => (
            <div key={stageName} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{stageName}</h3>
                <Badge variant="outline">{projectsByStage[stageName].length}</Badge>
              </div>
              <div className="space-y-2">
                {projectsByStage[stageName].map((project) => (
                  <div
                    key={project.id}
                    className={`cursor-pointer rounded-md border p-3 ${
                      selectedProjectId === project.id ? "border-primary" : ""
                    } ${project.isLate ? "border-destructive" : ""}`}
                    onClick={() => onSelectProject(project)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{project.name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Project</DropdownMenuItem>
                          <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                    {project.isLate && (
                      <Badge variant="destructive" className="mt-2">
                        Attention Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
