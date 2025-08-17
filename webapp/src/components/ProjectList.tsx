'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types/database'

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects')
      }

      setProjects(data.projects || [])
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
            <span className="ml-3 text-gray-600">Loading projects...</span>
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
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Projects</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchProjects}
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
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="mt-2 text-gray-600">
            View all projects with AI-generated metadata
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Projects Yet</h3>
            <p className="text-gray-600">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{project.brief}</p>
                </div>

                {project.keywords && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Keywords</h4>
                    <p className="text-sm text-gray-600">{project.keywords}</p>
                  </div>
                )}

                {project.emotion && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Emotion</h4>
                    <p className="text-sm text-gray-600">{project.emotion}</p>
                  </div>
                )}

                {project.look_and_feel && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Look & Feel</h4>
                    <p className="text-sm text-gray-600">{project.look_and_feel}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
