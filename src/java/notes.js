// Key used to store and load the notes text from localStorage
const STORAGE_KEY_NOTES = 'pwd.notes.content'

/**
 * Notes application
 * @param {HTMLElement} root The root element to render the notes app into
 */
export function NotesApp (root) {
  root.innerHTML = ''

  const status = document.createElement('div')
  status.className = 'notes-status'
  status.textContent = 'Status: Not saved yet'

  const textarea = document.createElement('textarea')
  textarea.className = 'notes-area'
  textarea.rows = 12
  textarea.placeholder = 'Write your notes here...'
  textarea.style.width = '100%'
  textarea.style.boxSizing = 'border-box'

  const buttons = document.createElement('div')
  buttons.className = 'notes-buttons'
  buttons.style.display = 'flex'
  buttons.style.gap = '8px'
  buttons.style.marginTop = '8px'

  const saveBtn = document.createElement('button')
  saveBtn.className = 'notes-btn'
  saveBtn.type = 'button'
  saveBtn.textContent = 'Save'

  const clearBtn = document.createElement('button')
  clearBtn.className = 'notes-btn notes-danger'
  clearBtn.type = 'button'
  clearBtn.textContent = 'Clear'

  buttons.appendChild(saveBtn)
  buttons.appendChild(clearBtn)

  // Add everything to root
  root.appendChild(status)
  root.appendChild(textarea)
  root.appendChild(buttons)

  // Load save notes
  const saved = localStorage.getItem(STORAGE_KEY_NOTES)
  if (saved !== null) {
    textarea.value = saved
    status.textContent = 'Status: Loaded saved notes'
  }

  /**
   * Saves current textarea text into localStorage
   */
  function saveNotes () {
    const text = textarea.value
    localStorage.setItem(STORAGE_KEY_NOTES, text)

    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')

    status.textContent = `Status: Saved ✓ (${hh}:${mm}:${ss})`
  }

  // Save button
  saveBtn.addEventListener('click', () => {
    saveNotes()
  })

  // Clear button
  clearBtn.addEventListener('click', () => {
    textarea.value = ''
    localStorage.removeItem(STORAGE_KEY_NOTES)
    status.textContent = 'Status: Cleared'
    textarea.focus()
  })
}
