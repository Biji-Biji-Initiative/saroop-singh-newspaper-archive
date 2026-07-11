import React from 'react'
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Archive</h2>
        <p className="text-sm text-gray-600 max-w-sm">
          Please wait while we load the Saroop Singh Archive content...
        </p>
      </div>
    </div>
  )
}