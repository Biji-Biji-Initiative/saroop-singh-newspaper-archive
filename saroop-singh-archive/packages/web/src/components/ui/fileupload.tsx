'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  file?: File | null
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 10,
  className,
  disabled = false,
  file = null,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback(
    (file: File) => {
      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        return 'Please select a JPG, PNG, or WEBP image'
      }

      // Check file size
      const sizeInMB = file.size / (1024 * 1024)
      if (sizeInMB > maxSize) {
        return `File size must be less than ${maxSize}MB`
      }

      return null
    },
    [maxSize]
  )

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null)

      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }

      onFileSelect(selectedFile)
    },
    [validateFile, onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [disabled, handleFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleRemoveFile = useCallback(() => {
    setError(null)
    onFileRemove()
  }, [onFileRemove])

  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-all',
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-red-300 bg-red-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Upload file"
          />

          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <AlertCircle className="h-12 w-12 text-red-400" />
            ) : (
              <Upload
                className={cn(
                  'h-12 w-12',
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                )}
              />
            )}

            <div className="space-y-2">
              <p
                className={cn(
                  'text-lg font-medium',
                  error ? 'text-red-600' : 'text-gray-900'
                )}
              >
                {error
                  ? 'Upload Error'
                  : isDragOver
                    ? 'Drop your image here'
                    : 'Upload your photo'}
              </p>

              {error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Drag & drop an image here, or click to browse
                  <br />
                  <span className="text-xs">
                    Supports: JPG, PNG, WEBP (max {maxSize}MB)
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border bg-white p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>

            <div className="min-w-0 flex-grow">
              <p className="truncate text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={handleRemoveFile}
              disabled={disabled}
              className={cn(
                'flex-shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-label="Remove file"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {file.type.startsWith('image/') && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="mx-auto h-48 max-w-full rounded-md object-contain"
                onLoad={e => {
                  // Clean up the object URL to prevent memory leaks
                  const img = e.target as HTMLImageElement
                  setTimeout(() => {
                    URL.revokeObjectURL(img.src)
                  }, 100)
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
