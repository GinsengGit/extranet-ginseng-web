"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: number
  user: string
  text: string
  date: string
  avatar?: string
}

interface CommentThreadProps {
  comments: Comment[]
  onAddComment?: (text: string) => void
}

export function CommentThread({ comments, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newComment.trim() && onAddComment) {
      onAddComment(newComment)
      setNewComment("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.user} />
              <AvatarFallback>{comment.user.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{comment.user}</p>
                <p className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button type="submit" size="sm" className="ml-auto">
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
