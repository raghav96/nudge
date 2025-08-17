'use client'

import { useState } from 'react'
import AddProject from '@/components/AddProject'
import AddAsset from '@/components/AddAsset'
import ProjectList from '@/components/ProjectList'
import AssetList from '@/components/AssetList'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'add-project' | 'add-asset' | 'projects' | 'assets'>('add-project')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🎨 Nudge</h1>
              <p className="ml-3 text-sm text-gray-500">Creative Asset Management</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'add-project', label: 'Add Project', icon: '🚀' },
              { id: 'add-asset', label: 'Add Asset', icon: '📁' },
              { id: 'projects', label: 'View Projects', icon: '📋' },
              { id: 'assets', label: 'View Assets', icon: '🖼️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'add-project' && <AddProject />}
          {activeTab === 'add-asset' && <AddAsset />}
          {activeTab === 'projects' && <ProjectList />}
          {activeTab === 'assets' && <AssetList />}
        </div>
      </div>
    </div>
  )
}
