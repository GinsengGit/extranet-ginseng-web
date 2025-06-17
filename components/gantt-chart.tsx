import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
}

interface GanttChartProps {
  projectId: string
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
  readOnly?: boolean
}

export function GanttChart({ projectId, tasks: initialTasks, onTasksChange, readOnly = false }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTaskName, setNewTaskName] = useState("")
  const [selectedStartDate, setSelectedStartDate] = useState<Date>()
  const [selectedEndDate, setSelectedEndDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null)

  // Mettre à jour les tâches locales quand les props changent
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const handleAddTask = () => {
    if (!newTaskName || !selectedStartDate || !selectedEndDate) return

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      startDate: selectedStartDate.toISOString().split('T')[0],
      endDate: selectedEndDate.toISOString().split('T')[0],
      progress: 0
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    onTasksChange?.(updatedTasks)
    setNewTaskName("")
    setSelectedStartDate(undefined)
    setSelectedEndDate(undefined)
  }

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    setTasks(updatedTasks)
    onTasksChange?.(updatedTasks)
  }

  const handleProgressChange = (taskId: string, progress: number) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, progress } : task
    )
    setTasks(updatedTasks)
    onTasksChange?.(updatedTasks)
  }

  // Calculer les dates min et max pour l'échelle
  const allDates = tasks.flatMap(task => [
    new Date(task.startDate),
    new Date(task.endDate)
  ])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Planning de développement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Formulaire d'ajout de tâche - uniquement en mode édition */}
          {!readOnly && (
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Nom de la tâche</label>
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Nouvelle tâche"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Date de début</label>
                <div className="relative">
                  <Input
                    value={selectedStartDate ? format(selectedStartDate, "dd/MM/yyyy") : ""}
                    onClick={() => setShowCalendar('start')}
                    readOnly
                    placeholder="Sélectionner"
                  />
                  {showCalendar === 'start' && (
                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                      <Calendar
                        mode="single"
                        selected={selectedStartDate}
                        onSelect={(date) => {
                          setSelectedStartDate(date)
                          setShowCalendar(null)
                        }}
                        locale={fr}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Date de fin</label>
                <div className="relative">
                  <Input
                    value={selectedEndDate ? format(selectedEndDate, "dd/MM/yyyy") : ""}
                    onClick={() => setShowCalendar('end')}
                    readOnly
                    placeholder="Sélectionner"
                  />
                  {showCalendar === 'end' && (
                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                      <Calendar
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={(date) => {
                          setSelectedEndDate(date)
                          setShowCalendar(null)
                        }}
                        locale={fr}
                      />
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleAddTask} className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          )}

          {/* Diagramme de Gantt */}
          <div className="mt-8 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* En-tête avec les dates */}
              <div className="flex mb-2">
                <div className="w-48 flex-shrink-0"></div>
                <div className="flex-1 flex">
                  {Array.from({ length: totalDays + 1 }).map((_, i) => {
                    const date = new Date(minDate)
                    date.setDate(date.getDate() + i)
                    return (
                      <div
                        key={i}
                        className="flex-1 text-center text-xs text-gray-500 border-b"
                        style={{ minWidth: "40px" }}
                      >
                        {format(date, "dd/MM")}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Lignes des tâches */}
              <div className="space-y-2">
                {tasks.map((task) => {
                  const startDate = new Date(task.startDate)
                  const endDate = new Date(task.endDate)
                  const startOffset = Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                  return (
                    <div key={task.id} className="flex items-center group">
                      <div className="w-48 flex-shrink-0 flex items-center justify-between pr-4">
                        <span className="text-sm truncate">{task.name}</span>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <div className="flex-1 flex relative h-8">
                        <div
                          className="absolute h-full bg-brand-yellow/20 rounded"
                          style={{
                            left: `${(startOffset / totalDays) * 100}%`,
                            width: `${(duration / totalDays) * 100}%`,
                          }}
                        >
                          <div
                            className="h-full bg-brand-yellow rounded"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        {!readOnly && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 