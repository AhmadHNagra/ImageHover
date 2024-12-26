// Default settings
const defaultSettings = {
  autoplayVideos: true,
  muteVideos: true,
  cursorOffset: 10,
  previewDelay: 0,
};

// Show save indicator
function showSaveIndicator() {
  const indicator = document.querySelector('.save-indicator');
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}

// Save settings function
async function saveSettings() {
  const settings = {
    autoplayVideos: document.getElementById("autoplay-videos").checked,
    muteVideos: document.getElementById("mute-videos").checked,
    cursorOffset: Math.min(100, Math.max(0, parseInt(document.getElementById("cursor-offset").value) || 0)),
    previewDelay: Math.min(2000, Math.max(0, parseInt(document.getElementById("preview-delay").value) || 0)),
  };

  await chrome.storage.sync.set(settings);
  showSaveIndicator();
}

// Load settings when page opens
document.addEventListener("DOMContentLoaded", async () => {
  const settings = await chrome.storage.sync.get(defaultSettings);

  document.getElementById("autoplay-videos").checked = settings.autoplayVideos;
  document.getElementById("mute-videos").checked = settings.muteVideos;
  document.getElementById("cursor-offset").value = settings.cursorOffset;
  document.getElementById("preview-delay").value = settings.previewDelay;

  // Add real-time saving
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('change', saveSettings);
  });
});

// Reset to defaults
document.getElementById("reset-defaults").addEventListener("click", async () => {
  await chrome.storage.sync.set(defaultSettings);
  
  document.getElementById("autoplay-videos").checked = defaultSettings.autoplayVideos;
  document.getElementById("mute-videos").checked = defaultSettings.muteVideos;
  document.getElementById("cursor-offset").value = defaultSettings.cursorOffset;
  document.getElementById("preview-delay").value = defaultSettings.previewDelay;
  
  showSaveIndicator();
});

// Keep save button for compatibility
document.getElementById("save-settings").addEventListener("click", saveSettings);
