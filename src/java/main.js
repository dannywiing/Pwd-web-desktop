import { Window } from './window.js'
import { MemoryApp } from './memory.js'
import { ChatApp } from './chat.js'
import { NotesApp } from './notes.js'
// Z-index and offset for new windows
let offset = 0
let topZ = 0

// Get app container and memory icon
const app = document.getElementById('app')
const memoryIcon = document.getElementById('memory')
const ChatIcon = document.getElementById('chat')
const notesIcon = document.getElementById('notes')

// Taskbar to show open windows
const taskbar = document.createElement('div')
taskbar.className = 'pwd-taskbar'
taskbar.style.position = 'absolute'
taskbar.style.left = '0'
taskbar.style.right = '0'
taskbar.style.bottom = '0'
taskbar.style.height = '100px'
taskbar.style.background = 'lightgray'
taskbar.style.borderTop = '2px solid black'
taskbar.style.display = 'flex'
taskbar.style.alignItems = 'center'
taskbar.style.gap = '20px'
taskbar.style.padding = '0 20px'
taskbar.style.boxSizing = 'border-box'
app.appendChild(taskbar)

// Double-click event to open Memory window
memoryIcon.addEventListener('dblclick', () => {
  const window = new Window('Memory', 600, 720)
  MemoryApp(window.content)

  // Position new window with offset
  window.element.style.top = 50 + offset + 'px'
  window.element.style.left = 50 + offset + 'px'

  app.appendChild(window.element)
  addTaskbarButton(memoryIcon, window)
  offset += 20

  // Bring window to front on creation
  topZ += 1
  window.element.style.zIndex = topZ

  // Bring window to front on focus
  window.titlebar.addEventListener('mousedown', () => {
    topZ += 1
    window.element.style.zIndex = topZ
  })

  app.appendChild(window.element)
})

// Double-click event to open chat window
ChatIcon.addEventListener('dblclick', () => {
  const chatWindow = new Window('Chat', 500, 600)
  ChatApp(chatWindow.content)

  chatWindow.element.style.top = 50 + offset + 'px'
  chatWindow.element.style.left = 50 + offset + 'px'

  app.appendChild(chatWindow.element)
  addTaskbarButton(ChatIcon, chatWindow)
  offset += 20

  topZ += 1
  chatWindow.element.style.zIndex = topZ

  chatWindow.titlebar.addEventListener('mousedown', () => {
    topZ += 1
    chatWindow.element.style.zIndex = topZ
  })
})

// Double-click event to open note window
notesIcon.addEventListener('dblclick', () => {
  const noteswindow = new Window('Notes', 400, 400)
  NotesApp(noteswindow.content)

  noteswindow.element.style.top = 50 + offset + 'px'
  noteswindow.element.style.left = 50 + offset + 'px'

  app.appendChild(noteswindow.element)
  addTaskbarButton(notesIcon, noteswindow)
  offset += 20

  topZ += 1
  noteswindow.element.style.zIndex = topZ

  noteswindow.titlebar.addEventListener('mousedown', () => {
    topZ += 1
    noteswindow.element.style.zIndex = topZ
  })

  app.appendChild(noteswindow.element)
})

/**
 * Shows the app icon to the taskbar
 * @param {HTMLElement} iconEl the desktop icon element to copy
 * @param {object} win the window object
 */
function addTaskbarButton (iconEl, win) {
  const btn = document.createElement('button')
  btn.className = 'pwd-taskbar-btn'

  btn.type = 'button'

  // Make it look like a small icon button
  btn.style.width = '60px'
  btn.style.height = '60px'
  btn.style.display = 'flex'
  btn.style.alignItems = 'center'
  btn.style.justifyContent = 'center'
  btn.style.padding = '0'

  // Clone the icon so we dont move the original
  const iconClone = iconEl.cloneNode(true)
  if (iconClone.classList) iconClone.classList.add('pwd-taskbar-icon')

  // If it's an img make sure it fits
  if (iconClone.tagName === 'IMG') {
    iconClone.style.width = '200px'
    iconClone.style.height = '200px'
    iconClone.style.objectFit = 'contain'
    iconClone.style.pointerEvents = 'none'
  }

  // Put the cloned icon inside the taskbar button
  btn.appendChild(iconClone)
  taskbar.appendChild(btn)

  // Show the window again
  btn.addEventListener('click', () => {
    win.element.style.display = 'block'
    topZ += 1
    win.element.style.zIndex = topZ
  })

  // Remove the taskbar button when window closed
  win.onClose = function () {
    btn.remove()
  }
}
