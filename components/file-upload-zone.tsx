"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface FileUploadZoneProps {
  onUpload?: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string
}

export function FileUploadZone({
  onUpload,
  maxFiles = 5,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles)
      setFiles(updatedFiles)

      if (onUpload) {
        onUpload(updatedFiles)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles)
      setFiles(updatedFiles)

      if (onUpload) {
        onUpload(updatedFiles)
      }
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    setFiles(updatedFiles)

    if (onUpload) {
      onUpload(updatedFiles)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-md border border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/5" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drop files here or click to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">{acceptedTypes.replace("image/*", "Images")} up to 10MB</p>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-xs">{file.name.split(".").pop()?.toUpperCase()}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
