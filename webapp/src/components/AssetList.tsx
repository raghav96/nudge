'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@/types/database'

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/assets`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assets')
      }

      setAssets(data.assets || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading assets...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="text-red-400 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Assets</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchAssets}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <p className="mt-2 text-gray-600">
            View all uploaded assets with AI-generated metadata
          </p>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Assets Yet</h3>
            <p className="text-gray-600">Upload your first asset to get started</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={asset.file_url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                    {asset.filename}
                  </h3>

                  {asset.keywords && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Keywords</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{asset.keywords}</p>
                    </div>
                  )}

                  {asset.emotion && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Emotion</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{asset.emotion}</p>
                    </div>
                  )}

                  {asset.look_and_feel && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Look & Feel</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{asset.look_and_feel}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
