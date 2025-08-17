chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    captureScreenshot()
      .then(screenshot => sendResponse({ screenshot }))
      .catch(error => sendResponse({ error: error.message }))
    
    return true // Keep channel open for async response
  }
})

async function captureScreenshot() {
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const tab = tabs[0]
    
    if (!tab) {
      throw new Error('No active tab found')
    }
    
    // Check if we have permission to capture this tab
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot capture screenshots of Chrome system pages or extension pages')
    }
    
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 90
    })
    
    if (!dataUrl) {
      throw new Error('Screenshot capture returned no data')
    }
    
    console.log('Screenshot captured successfully')
    return dataUrl
    
  } catch (error) {
    console.error('Screenshot capture error:', error)
    
    // Provide more specific error messages
    if (error.message.includes('permission')) {
      throw new Error('Screenshot permission denied. Please ensure the extension has access to capture tabs.')
    } else if (error.message.includes('chrome://')) {
      throw new Error('Cannot capture screenshots of Chrome system pages. Please navigate to a regular website.')
    } else {
      throw new Error(`Screenshot failed: ${error.message}`)
    }
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId })
  } catch (error) {
    console.error('Failed to open side panel:', error)
  }
})

// Set default side panel behavior
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  })
})