'use client'

import React, { useState } from 'react'
import { Upload, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { ResponsiveContainer } from '@/components/layout/responsivecontainer'
import { VStack } from '@/components/layout/flexlayout'
import { FileUpload } from '@/components/ui/fileupload'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
// cn utility not used in this component
import {
  RestorationGrid,
  type GalleryContributionDetails,
} from '@/components/restoration/restorationgrid'
// Metadata is handled by layout.tsx

interface RestorationResult {
  id: string
  name: string
  style: string
  description: string
  imageUrl: string
  downloadUrl: string
}

interface RestorationResponse {
  sessionId: string
  sessionAccessToken: string
  originalImageUrl: string
  restorations: RestorationResult[]
}

interface GallerySubmissionResponse {
  galleryId?: string
  message?: string
}

type ProcessingStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error'

const restorationStyles = [
  {
    name: 'Archival Restoration',
    description:
      'Conservatively repairs visible fading, damage, and contrast while preserving historical details.',
    icon: '📚',
  },
]

export default function RestorePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [restorations, setRestorations] = useState<RestorationResult[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(
    null
  )
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  )

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
    setRestorations([])
    setSessionId(null)
    setSessionAccessToken(null)
    setOriginalImageUrl(null)
    setProgress(0)
    setSubmissionMessage(null)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setRestorations([])
    setSessionId(null)
    setSessionAccessToken(null)
    setOriginalImageUrl(null)
    setProgress(0)
    setProcessingStatus('idle')
    setError(null)
    setSubmissionMessage(null)
  }

  const handleGenerateRestorations = async () => {
    if (!selectedFile) return

    setProcessingStatus('uploading')
    setProgress(0)
    setError(null)

    let progressInterval: ReturnType<typeof setInterval> | undefined

    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('image', selectedFile)

      // Upload and process
      setProcessingStatus('processing')

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 10
        })
      }, 500)

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      })

      const results = (await response.json()) as RestorationResponse & {
        error?: string
      }
      if (!response.ok) {
        throw new Error(results.error || 'Restoration failed')
      }

      if (
        !results.sessionId ||
        !results.sessionAccessToken ||
        !results.originalImageUrl ||
        !Array.isArray(results.restorations)
      ) {
        throw new Error('The restoration service returned an incomplete result')
      }

      setRestorations(results.restorations)
      setSessionId(results.sessionId)
      setSessionAccessToken(results.sessionAccessToken)
      setOriginalImageUrl(results.originalImageUrl)
      setProgress(100)
      setProcessingStatus('completed')
    } catch (err) {
      setProcessingStatus('error')
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during restoration'
      )
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }

  const handleDownloadAll = async () => {
    try {
      if (!sessionId || !sessionAccessToken) {
        throw new Error('Restoration session is unavailable')
      }

      const response = await fetch('/api/restore/download-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          sessionAccessToken,
          restorationIds: restorations.map(r => r.id),
        }),
      })

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `restored-photos-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Failed to download all restorations')
    }
  }

  const handleDownloadSingle = async (restoration: RestorationResult) => {
    try {
      const response = await fetch(restoration.downloadUrl)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${restoration.name.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError(`Failed to download ${restoration.name}`)
    }
  }

  const handleSubmitToGallery = async (
    selectedRestorations: RestorationResult[],
    details: GalleryContributionDetails
  ) => {
    try {
      if (!sessionId || !sessionAccessToken) {
        throw new Error('Restoration session is unavailable')
      }

      const response = await fetch('/api/gallery/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          sessionAccessToken,
          selectedRestorations: selectedRestorations.map(r => ({
            id: r.id,
            name: r.name,
            imageUrl: r.imageUrl,
            selected: true,
          })),
          metadata: {
            title: details.title,
            description: details.description,
            ...(details.date ? { date: details.date } : {}),
            ...(details.familyMember
              ? { familyMember: details.familyMember }
              : {}),
            tags: Array.from(
              new Set([
                ...details.tags,
                ...selectedRestorations.map(restoration => restoration.style),
              ])
            ).slice(0, 12),
            contributorConsent: details.contributorConsent,
          },
        }),
      })

      const submission =
        (await response.json()) as GallerySubmissionResponse & {
          error?: string
        }
      if (!response.ok) {
        throw new Error(submission.error || 'Failed to submit to gallery')
      }

      setError(null)
      setSubmissionMessage(
        `Thank you. ${selectedRestorations.length} restoration${selectedRestorations.length === 1 ? '' : 's'} ${selectedRestorations.length === 1 ? 'is' : 'are'} now private and waiting for archive review${submission.galleryId ? ` (reference ${submission.galleryId})` : ''}.`
      )
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Failed to submit to gallery'
      setError(message)
      throw new Error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ResponsiveContainer className="py-8 sm:py-12">
        <VStack gap="xl" align="center">
          {/* Header */}
          <div className="max-w-4xl space-y-4 text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
                Photo Restoration
              </h1>
            </div>
            <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">
              Bring your historical photographs back to life using advanced AI
              restoration technology. Upload your photo to create one
              conservative, AI-assisted restoration for review.
            </p>
          </div>

          {submissionMessage && (
            <div
              className="w-full max-w-4xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-900"
              role="status"
            >
              {submissionMessage}
            </div>
          )}

          {/* Main Content */}
          <div className="w-full max-w-6xl space-y-8">
            {/* Upload Section */}
            <Card className="border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Your Photo</span>
                </CardTitle>
                <CardDescription>
                  Select a historical photograph to restore. We support JPG,
                  PNG, and WEBP formats up to 10MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  file={selectedFile}
                  disabled={processingStatus === 'processing'}
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full"
                />

                {selectedFile && processingStatus === 'idle' && (
                  <div className="space-y-4 text-center">
                    <Button
                      onClick={handleGenerateRestorations}
                      size="lg"
                      className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Restoration
                    </Button>
                    <p className="text-sm text-gray-500">
                      This creates one conservative restoration for careful
                      comparison with the original. Private uploads are retained
                      for up to seven days unless approved for the public
                      gallery.
                    </p>
                  </div>
                )}

                {/* Processing Status */}
                {processingStatus !== 'idle' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      {processingStatus === 'uploading' && (
                        <>
                          <Clock className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="font-medium text-blue-600">
                            Uploading photo...
                          </span>
                        </>
                      )}
                      {processingStatus === 'processing' && (
                        <>
                          <Sparkles className="h-5 w-5 animate-pulse text-purple-600" />
                          <span className="font-medium text-purple-600">
                            Processing restoration...
                          </span>
                        </>
                      )}
                      {processingStatus === 'completed' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-600">
                            Restoration complete!
                          </span>
                        </>
                      )}
                      {processingStatus === 'error' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-600">
                            Restoration failed
                          </span>
                        </>
                      )}
                    </div>

                    {(processingStatus === 'uploading' ||
                      processingStatus === 'processing') && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full" />
                        <p className="text-center text-sm text-gray-500">
                          {Math.round(progress)}% complete
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-center text-red-700">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Restoration Styles Preview */}
            {selectedFile && processingStatus === 'idle' && (
              <Card className="border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle>Available Restoration Styles</CardTitle>
                  <CardDescription>
                    We&apos;ll preserve the original image and generate this
                    reviewable restoration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {restorationStyles.map(style => (
                      <div
                        key={style.name}
                        className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4"
                      >
                        <div className="space-y-2 text-center">
                          <div className="text-2xl">{style.icon}</div>
                          <h3 className="font-semibold text-gray-900">
                            {style.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {restorations.length > 0 && (
              <RestorationGrid
                restorations={restorations}
                originalImage={originalImageUrl || ''}
                onDownloadSingle={handleDownloadSingle}
                onDownloadAll={handleDownloadAll}
                onSubmitToGallery={handleSubmitToGallery}
              />
            )}
          </div>
        </VStack>
      </ResponsiveContainer>
    </div>
  )
}
