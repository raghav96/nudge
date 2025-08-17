// Configuration - Load from config.js
const SUPABASE_CONFIG = (() => {
    // Check if config.js has loaded the values
    if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_ANON_KEY !== 'undefined') {
        return {
            url: window.SUPABASE_URL,
            anonKey: window.SUPABASE_ANON_KEY
        };
    }
    
    // Fallback to placeholder values (will show error)
    console.warn('⚠️ Configuration not loaded from config.js, using placeholder values');
    return {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    };
})();

class CreativeAssistant {
  constructor() {
    // Validate configuration
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
      this.showConfigurationError();
      return;
    }
    
    this.baseUrl = `${SUPABASE_CONFIG.url}/functions/v1`
    this.apiKey = SUPABASE_CONFIG.anonKey
    this.currentKeywords = ''
    this.projects = []
    this.init()
  }
  
  showConfigurationError() {
    const content = document.querySelector('.content');
    content.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #dc2626;">
        <h3>⚠️ Configuration Error</h3>
        <p>Please configure your Supabase credentials in <code>config.js</code></p>
        <p>Copy <code>env.template</code> to <code>config.js</code> and update with your actual values.</p>
        <br>
        <p><strong>Required:</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>SUPABASE_URL</li>
          <li>SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    `;
  }
  
  async init() {
    await this.loadProjects()
    this.bindEvents()
    this.initTabs()
    this.initBriefTab()
  }
  
  initTabs() {
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab
        this.switchTab(tabName)
      })
    })
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    
    // Update content
    document.querySelectorAll('[id$="-tab"]').forEach(content => {
      content.classList.add('hidden')
    })
    document.getElementById(`${tabName}-tab`).classList.remove('hidden')
  }
  
  async loadProjects() {
    try {
      this.setLoadingState(true, 'Loading projects...')
      
      const response = await fetch(`${this.baseUrl}/projects`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to load projects: ${errorData.error || response.status}`)
      }
      
      const data = await response.json()
      this.projects = data.projects || []
      this.populateProjectDropdown(this.projects)
      
      // Update explore button state after loading projects
      this.updateExploreButtonState()
      
    } catch (error) {
      console.error('Failed to load projects:', error)
      this.showError(`Failed to load projects: ${error.message}`)
      
      // Add retry button to error message
      const errorContainer = document.getElementById('error-container')
      const retryButton = document.createElement('button')
      retryButton.textContent = 'Retry'
      retryButton.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;'
      retryButton.onclick = () => {
        this.hideError()
        this.loadProjects()
      }
      errorContainer.appendChild(retryButton)
      
    } finally {
      this.setLoadingState(false)
    }
  }
  
  populateProjectDropdown(projects) {
    const select = document.getElementById('project-select')
    const briefSelect = document.getElementById('brief-project-select')
    
    // Clear existing options except the first placeholder
    select.innerHTML = '<option value="">Choose a project brief...</option>'
    briefSelect.innerHTML = '<option value="">Choose a project...</option>'
    
    if (projects.length === 0) {
      const option = document.createElement('option')
      option.value = ""
      option.textContent = "No projects available"
      option.disabled = true
      select.appendChild(option)
      briefSelect.appendChild(option.cloneNode(true))
      return
    }
    
    projects.forEach(project => {
      const option = document.createElement('option')
      option.value = project.id
      option.textContent = project.name
      select.appendChild(option)
      
      // Clone for brief tab
      const briefOption = option.cloneNode(true)
      briefSelect.appendChild(briefOption)
    })
  }
  
  bindEvents() {
    const exploreBtn = document.getElementById('explore-btn')
    const keywordsInput = document.getElementById('keywords-input')
    const projectSelect = document.getElementById('project-select')
    
    exploreBtn.addEventListener('click', () => this.handleExplore())
    
    keywordsInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleExplore()
    })
    
    // Update explore button state when project selection changes
    projectSelect.addEventListener('change', () => {
      this.updateExploreButtonState()
    })
    
    // Update explore button state when keywords are typed
    keywordsInput.addEventListener('input', () => {
      this.updateExploreButtonState()
    })
  }
  
  initBriefTab() {
    const briefProjectSelect = document.getElementById('brief-project-select')
    briefProjectSelect.addEventListener('change', () => {
      this.handleBriefProjectChange()
    })
  }
  
  updateExploreButtonState() {
    const projectSelect = document.getElementById('project-select')
    const exploreBtn = document.getElementById('explore-btn')
    const projectInfo = document.getElementById('project-info')
    const projectDetails = document.getElementById('project-details')
    const projectId = projectSelect.value
    
    // Enable explore button if any input is provided (project, keywords, or just screenshot)
    const keywordsInput = document.getElementById('keywords-input')
    const hasKeywords = keywordsInput.value.trim().length > 0
    
    // Always enable explore button - screenshot-only exploration is allowed
    exploreBtn.disabled = false
    exploreBtn.style.opacity = '1'
    
    // Show project details if project is selected
    if (projectId) {
      const selectedProject = this.projects.find(p => p.id === projectId)
      if (selectedProject) {
        projectDetails.innerHTML = `
          <strong>${selectedProject.name}</strong><br>
          ${selectedProject.brief ? `Brief: ${selectedProject.brief.substring(0, 100)}${selectedProject.brief.length > 100 ? '...' : ''}` : 'No brief available'}
        `
        projectInfo.classList.remove('hidden')
      }
    } else {
      projectInfo.classList.add('hidden')
    }
  }
  
  async handleExplore() {
    const projectSelect = document.getElementById('project-select')
    const keywordsInput = document.getElementById('keywords-input')
    
    const projectId = projectSelect.value || null
    const keywords = keywordsInput.value.trim() || null
    
    // No validation required - screenshot-only exploration is allowed
    this.setLoadingState(true, 'Analyzing and generating inspiration...')
    this.hideError()
    
    try {
      let screenshot = null
      
      // Try to capture screenshot, but don't fail if it doesn't work
      try {
        screenshot = await this.captureScreenshot()
        console.log('Screenshot captured successfully')
      } catch (screenshotError) {
        console.warn('Screenshot capture failed, continuing without it:', screenshotError.message)
        
        // Show warning but continue
        this.showError(`Screenshot capture failed: ${screenshotError.message}. Continuing with available inputs.`)
        setTimeout(() => this.hideError(), 3000) // Hide warning after 3 seconds
      }
      
      const results = await this.exploreInspiration({
        screenshot,
        projectId,
        keywords
      })
      
      this.displayResults(results)
      
    } catch (error) {
      console.error('Explore failed:', error)
      this.showError(error.message)
    } finally {
      this.setLoadingState(false)
    }
  }
  
  async captureScreenshot() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'captureScreenshot'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else if (response?.error) {
          reject(new Error(response.error))
        } else {
          resolve(response.screenshot)
        }
      })
    })
  }
  
  async exploreInspiration(params) {
    const response = await fetch(`${this.baseUrl}/explore`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API Error: ${errorData.error || response.status}`)
    }
    
    return await response.json()
  }
  
  async handleBriefProjectChange() {
    const projectSelect = document.getElementById('brief-project-select')
    const projectId = projectSelect.value
    
    if (!projectId) {
      this.hideProjectBrief()
      return
    }
    
    try {
      this.setBriefLoadingState(true)
      await this.loadProjectDetails(projectId)
      await this.loadProjectAssets(projectId)
      this.showProjectBrief()
    } catch (error) {
      console.error('Failed to load project details:', error)
      this.showBriefError(`Failed to load project: ${error.message}`)
    } finally {
      this.setBriefLoadingState(false)
    }
  }
  
  async loadProjectDetails(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to load project: ${errorData.error || response.status}`)
    }
    
    const data = await response.json()
    this.displayProjectBrief(data.project)
  }
  
  async loadProjectAssets(projectId) {
    const response = await fetch(`${this.baseUrl}/assets?project_id=${projectId}`, {
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to load assets: ${errorData.error || response.status}`)
    }
    
    const data = await response.json()
    this.displayProjectAssets(data.assets || [])
  }
  
  displayProjectBrief(project) {
    const briefContent = document.getElementById('project-brief')
    const keywordsContent = document.getElementById('project-keywords')
    const emotionContent = document.getElementById('project-emotion')
    const lookFeelContent = document.getElementById('project-look-feel')
    
    // Display brief
    if (project.brief && project.brief.trim()) {
      briefContent.textContent = project.brief
      briefContent.classList.remove('empty')
    } else {
      briefContent.textContent = 'No brief provided'
      briefContent.classList.add('empty')
    }
    
    // Display keywords
    if (project.keywords && project.keywords.trim()) {
      keywordsContent.textContent = project.keywords
      keywordsContent.classList.remove('empty')
    } else {
      keywordsContent.textContent = 'No keywords specified'
      keywordsContent.classList.add('empty')
    }
    
    // Display emotion
    if (project.emotion && project.emotion.trim()) {
      emotionContent.textContent = project.emotion
      emotionContent.classList.remove('empty')
    } else {
      emotionContent.textContent = 'No emotion specified'
      emotionContent.classList.add('empty')
    }
    
    // Display look and feel
    if (project.look_and_feel && project.look_and_feel.trim()) {
      lookFeelContent.textContent = project.look_and_feel
      lookFeelContent.classList.remove('empty')
    } else {
      lookFeelContent.textContent = 'No look and feel specified'
      lookFeelContent.classList.add('empty')
    }
  }
  
  displayProjectAssets(assets) {
    const assetsGrid = document.getElementById('project-assets')
    
    if (!assets || assets.length === 0) {
      assetsGrid.innerHTML = '<div class="no-assets">No assets found for this project</div>'
      return
    }
    
    assetsGrid.innerHTML = ''
    
    assets.forEach(asset => {
      const assetItem = document.createElement('div')
      assetItem.className = 'asset-item'
      
      assetItem.innerHTML = `
        <img src="${asset.file_url}" alt="${asset.filename}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo='">
        <div class="asset-info">${asset.filename}</div>
      `
      
      // Add click handler to open image in new tab
      assetItem.addEventListener('click', () => {
        window.open(asset.file_url, '_blank')
      })
      
      assetsGrid.appendChild(assetItem)
    })
  }
  
  showProjectBrief() {
    document.getElementById('project-brief-container').classList.remove('hidden')
    document.getElementById('no-project-selected').classList.add('hidden')
  }
  
  hideProjectBrief() {
    document.getElementById('project-brief-container').classList.add('hidden')
    document.getElementById('no-project-selected').classList.remove('hidden')
  }
  
  setBriefLoadingState(loading) {
    const projectSelect = document.getElementById('brief-project-select')
    projectSelect.disabled = loading
    
    if (loading) {
      projectSelect.style.opacity = '0.7'
    } else {
      projectSelect.style.opacity = '1'
    }
  }
  
  showBriefError(message) {
    const container = document.getElementById('project-brief-container')
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error'
    errorDiv.textContent = message
    
    // Remove any existing error
    const existingError = container.querySelector('.error')
    if (existingError) {
      existingError.remove()
    }
    
    container.appendChild(errorDiv)
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove()
      }
    }, 5000)
  }
  
  showError(message) {
    const errorContainer = document.getElementById('error-container')
    if (errorContainer) {
      errorContainer.innerHTML = `<div class="error">${message}</div>`
      errorContainer.classList.remove('hidden')
    }
  }
  
  hideError() {
    const errorContainer = document.getElementById('error-container')
    if (errorContainer) {
      errorContainer.classList.add('hidden')
      errorContainer.innerHTML = ''
    }
  }
  
  displayResults(data) {
    const container = document.getElementById('results-container')
    const grid = document.getElementById('results-grid')
    const keywordsDisplay = document.getElementById('keywords-display')
    
    grid.innerHTML = ''
    
    if (!data.results || data.results.length === 0) {
      keywordsDisplay.textContent = '• No results found'
      this.currentKeywords = ''
      return
    }
    
    // Display results in grid
    data.results.forEach((result, index) => {
      const item = document.createElement('div')
      item.className = 'result-item'
      
      // Add metadata variation info for generated images
      let variationInfo = ''
      if (result.type === 'generated' && result.metadata_variation) {
        variationInfo = `<div class="variation-info">Variation: ${result.metadata_variation.substring(0, 80)}${result.metadata_variation.length > 80 ? '...' : ''}</div>`
      }
      
      item.innerHTML = `
        <img src="${result.image_url}" alt="Inspiration ${index + 1}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo='">
        <div class="result-type">${result.type === 'asset' ? 'Asset' : 'AI'}</div>
        ${variationInfo}
      `
      
      grid.appendChild(item)
    })
    
    // Update keywords display - prioritize screenshot analysis, then project metadata, then fallback
    let keywords = ''
    let keywordsSource = ''
    
    if (data.source_metadata?.screenshot_analysis?.keywords) {
      keywords = data.source_metadata.screenshot_analysis.keywords
      keywordsSource = 'Screenshot Analysis'
    } else if (data.source_metadata?.project_metadata?.keywords) {
      keywords = data.source_metadata.project_metadata.keywords
      keywordsSource = 'Project Metadata'
    } else if (data.source_metadata?.combined_search_query) {
      keywords = data.source_metadata.combined_search_query
      keywordsSource = 'Combined Query'
    }
    
    if (keywords) {
      const keywordsList = keywords
        .split(',')
        .map(k => `• ${k.trim()}`)
        .slice(0, 3)
        .join(' ')
      keywordsDisplay.textContent = keywordsList
      this.currentKeywords = keywords
    } else {
      keywordsDisplay.textContent = '• Keywords not available'
      this.currentKeywords = ''
    }
    
    container.classList.remove('hidden')
    
    // Scroll results into view
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  
  setLoadingState(loading, message = '') {
    const button = document.getElementById('explore-btn')
    const text = document.getElementById('explore-text')
    const loadingState = document.getElementById('loading-state')
    const loadingText = loadingState.querySelector('.loading-text')
    
    if (loading) {
      button.disabled = true
      button.style.opacity = '0.7'
      if (message) {
        text.textContent = message
      }
      loadingState.classList.remove('hidden')
    } else {
      button.disabled = false
      button.style.opacity = '1'
      text.textContent = "Analyze & Explore"
      loadingState.classList.add('hidden')
    }
  }
}

// Action card functions
function copyKeywords() {
  const app = window.creativeAssistant
  if (app && app.currentKeywords) {
    navigator.clipboard.writeText(app.currentKeywords).then(() => {
      const button = document.getElementById('copy-keywords-btn')
      const originalText = button.textContent
      button.textContent = 'Copied!'
      button.style.background = '#059669'
      
      setTimeout(() => {
        button.textContent = originalText
        button.style.background = '#3b82f6'
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy keywords:', err)
      alert('Failed to copy keywords to clipboard')
    })
  } else {
    alert('No keywords available to copy')
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.creativeAssistant = new CreativeAssistant()
})