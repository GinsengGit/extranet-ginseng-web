"use client"

import { CheckCircle, LockIcon, UnlockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProjectStage {
  id: number
  name: string
  status: "completed" | "in-progress" | "locked"
  date: string | null
  feedbackRounds?: number
  maxFeedbackRounds?: number
  feedbackDeadline?: string
}

interface ProjectStageCardProps {
  stage: ProjectStage
  onComplete?: () => void
}

export function ProjectStageCard({ stage, onComplete }: ProjectStageCardProps) {
  return (
    <Card className={stage.status === "locked" ? "opacity-70" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{stage.name}</CardTitle>
          {stage.status === "locked" ? (
            <LockIcon className="h-4 w-4 text-muted-foreground" />
          ) : stage.status === "completed" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <UnlockIcon className="h-4 w-4 text-blue-500" />
          )}
        </div>
        <CardDescription>
          {stage.status === "completed" ? (
            <>Completed on {new Date(stage.date!).toLocaleDateString()}</>
          ) : stage.status === "in-progress" ? (
            <>In progress since {new Date(stage.date!).toLocaleDateString()}</>
          ) : (
            <>Locked</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stage.feedbackRounds !== undefined && stage.maxFeedbackRounds !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Feedback Rounds</span>
              <span className="text-sm font-medium">
                {stage.feedbackRounds} / {stage.maxFeedbackRounds}
              </span>
            </div>
            <Progress value={(stage.feedbackRounds / stage.maxFeedbackRounds) * 100} className="h-2" />
            {stage.feedbackDeadline && (
              <p className="text-xs text-muted-foreground">
                Deadline: {new Date(stage.feedbackDeadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {stage.status === "in-progress" && (
          <Button className="w-full" onClick={onComplete}>
            Complete Stage
          </Button>
        )}
        {stage.status === "completed" && (
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        )}
        {stage.status === "locked" && (
          <Button disabled className="w-full">
            Locked
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
