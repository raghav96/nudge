'use client'

import { useState, useRef } from 'react'
import { CreateAssetRequest, Asset, ApiResponse } from '@/types/database'

export default function AddAsset() {
  const [formData, setFormData] = useState<Omit<CreateAssetRequest, 'imageFile'>>({
    keywords: '',
    emotion: '',
    lookAndFeel: '',
    userEmail: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse<Asset> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile) {
      setError('Please select an image file')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call Supabase Edge Function for assets
      const formDataToSend = new FormData()
      formDataToSend.append('imageFile', imageFile)
      formDataToSend.append('keywords', formData.keywords || '')
      formDataToSend.append('emotion', formData.emotion || '')
      formDataToSend.append('lookAndFeel', formData.lookAndFeel || '')
      formDataToSend.append('userEmail', formData.userEmail)

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload asset')
      }

      setResult(data)
      setFormData({ keywords: '', emotion: '', lookAndFeel: '', userEmail: '' })
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload New Asset</h2>
          <p className="mt-2 text-gray-600">
            Upload an image and provide metadata for AI-powered search
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image *
            </label>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="e.g., modern, minimalist, blue, tech"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-600 font-medium">Comma-separated keywords (max 120 characters)</p>
          </div>

          <div>
            <label htmlFor="emotion" className="block text-sm font-medium text-gray-700 mb-2">
              Emotion
            </label>
            <input
              type="text"
              id="emotion"
              name="emotion"
              value={formData.emotion}
              onChange={handleInputChange}
              placeholder="e.g., calm, professional, inspiring"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-600 font-medium">Emotional qualities (max 120 characters)</p>
          </div>

          <div>
            <label htmlFor="lookAndFeel" className="block text-sm font-medium text-gray-700 mb-2">
              Look & Feel
            </label>
            <input
              type="text"
              id="lookAndFeel"
              name="lookAndFeel"
              value={formData.lookAndFeel}
              onChange={handleInputChange}
              placeholder="e.g., clean, sophisticated, contemporary"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-600 font-medium">Visual style description (max 120 characters)</p>
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Your Email *
            </label>
            <input
              type="email"
              id="userEmail"
              name="userEmail"
              required
              value={formData.userEmail}
              onChange={handleInputChange}
              placeholder="your.email@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !imageFile}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading Asset...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">📁</span>
                Upload Asset
              </div>
            )}
          </button>
        </form>

        {/* Success Message */}
        {result && result.asset && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Asset Uploaded Successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Filename:</strong> {result.asset.filename}</p>
                  <p><strong>Keywords:</strong> {result.asset.keywords}</p>
                  <p><strong>Emotion:</strong> {result.asset.emotion}</p>
                  <p><strong>Look & Feel:</strong> {result.asset.look_and_feel}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
