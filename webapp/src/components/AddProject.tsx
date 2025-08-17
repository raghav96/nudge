'use client'

import { useState } from 'react'
import { CreateProjectRequest, Project, ApiResponse } from '@/types/database'

export default function AddProject() {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    brief: '',
    userEmail: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse<Project> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call Supabase Edge Function for projects
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      setResult(data)
      setFormData({ name: '', brief: '', userEmail: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          <p className="mt-2 text-gray-600">
            Create a new project brief with AI-powered metadata extraction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Brand Redesign for Tech Startup"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="brief" className="block text-sm font-medium text-gray-700 mb-2">
              Project Brief *
            </label>
            <textarea
              id="brief"
              name="brief"
              required
              rows={6}
              value={formData.brief}
              onChange={handleInputChange}
              placeholder="Describe your project vision, requirements, target audience, and design goals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Project...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">🚀</span>
                Create Project
              </div>
            )}
          </button>
        </form>

        {/* Success Message */}
        {result && result.project && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Project Created Successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Name:</strong> {result.project.name}</p>
                  <p><strong>Keywords:</strong> {result.project.keywords}</p>
                  <p><strong>Emotion:</strong> {result.project.emotion}</p>
                  <p><strong>Look & Feel:</strong> {result.project.look_and_feel}</p>
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
