/**
 * A simple draggable window component.
 */
export class Window {
  constructor (title, width = 300, height = 300) {
    // Drag variables for dragging
    let isDragging = false
    let startMouseX = 0
    let startMouseY = 0
    let startLeft = 0
    let startTop = 0

    // Variables for resizing
    let isResizing = false
    let startWidth = 0
    let startHeight = 0

    // Variables for maximize
    let isMaximized = false
    let oldLeft = 0
    let oldTop = 0
    let oldWidth = 0
    let oldHeight = 0

    // Create main window element
    this.element = document.createElement('div')
    this.element.style.position = 'absolute'
    this.element.style.border = '2px solid black'
    this.element.style.background = 'white'
    this.element.style.width = width + 'px'
    this.element.style.height = height + 'px'
    this.element.style.boxSizing = 'border-box'
    this.element.style.overflow = 'hidden'
    this.element.style.userSelect = 'none'
    this.element.className = 'pwd-window'

    // Create titlebar
    this.titlebar = document.createElement('div')
    this.titlebar.style.height = '24px'
    this.titlebar.style.background = 'lightgray'
    this.titlebar.style.display = 'flex'
    this.titlebar.style.alignItems = 'center'
    this.titlebar.style.justifyContent = 'space-between'
    this.titlebar.style.padding = '0 8px'
    this.titlebar.style.userSelect = 'none'
    this.titlebar.className = 'pwd-titlebar'
    this.titlebar.style.flexShrink = '0'

    // Title text
    const titleText = document.createElement('span')
    titleText.innerText = title

    // Close button
    const closeButton = document.createElement('button')
    closeButton.className = 'pwd-win-btn pwd-close'
    closeButton.innerText = '✕'
    closeButton.type = 'button'
    // Prevent dragging when clicking the close button
    closeButton.addEventListener('mousedown', (e) => e.stopPropagation())
    // Close window on click
    closeButton.addEventListener('click', () => {
      if (this.onClose !== undefined) {
        this.onClose()
      }

      this.element.remove()
    })

    // Maximize button
    const maxButton = document.createElement('button')
    maxButton.className = 'pwd-win-btn'
    maxButton.innerHTML = '⛶'
    maxButton.type = 'button'

    maxButton.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })

    // Minimize button
    const minButton = document.createElement('button')
    minButton.className = 'pwd-win-btn'
    minButton.innerHTML = '―'
    minButton.type = 'button'

    minButton.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })
    minButton.addEventListener('click', () => {
      this.element.style.display = 'none'
    })

    const buttons = document.createElement('div')
    buttons.style.display = 'flex'
    buttons.style.gap = '6px'

    buttons.appendChild(minButton)
    buttons.appendChild(maxButton)
    buttons.appendChild(closeButton)

    this.titlebar.appendChild(titleText)
    this.titlebar.appendChild(buttons)

    // Create content area
    this.content = document.createElement('div')
    this.content.style.padding = '10px'
    this.content.style.flex = '1'
    this.content.style.minHeight = '0'
    this.content.style.overflow = 'hidden'

    // Window ska vara flex: titlebar + content
    this.element.style.display = 'flex'
    this.element.style.flexDirection = 'column'

    this.element.appendChild(this.titlebar)
    this.element.appendChild(this.content)

    // Resize handle
    const resizeHandle = document.createElement('div')
    resizeHandle.className = 'pwd-resize-handle'
    resizeHandle.style.position = 'absolute'
    resizeHandle.style.width = '14px'
    resizeHandle.style.height = '14px'
    resizeHandle.style.right = '0'
    resizeHandle.style.bottom = '0'
    resizeHandle.style.cursor = 'nwse-resize'

    this.element.appendChild(resizeHandle)

    // Start to resizing when the user clicks and holds the bottom right
    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation() // prevents drag start

      isResizing = true
      startMouseX = e.clientX
      startMouseY = e.clientY

      startWidth = parseInt(this.element.style.width, 10)
      startHeight = parseInt(this.element.style.height, 10)
    })

    // Dragging event listeners
    this.titlebar.addEventListener('mousedown', (event) => {
      isDragging = true
      startMouseX = event.clientX
      startMouseY = event.clientY
      startLeft = parseInt(this.element.style.left)
      startTop = parseInt(this.element.style.top)
    })

    // Handle dragging
    document.addEventListener('mousemove', (event) => {
      // Dragging
      if (isDragging) {
        const deltaX = event.clientX - startMouseX
        const deltaY = event.clientY - startMouseY
        this.element.style.left = startLeft + deltaX + 'px'
        this.element.style.top = startTop + deltaY + 'px'
      }

      // Resizing
      if (isResizing) {
        const deltaX = event.clientX - startMouseX
        const deltaY = event.clientY - startMouseY

        const minW = 200
        const minH = 180

        const newW = Math.max(minW, startWidth + deltaX)
        const newH = Math.max(minH, startHeight + deltaY)

        this.element.style.width = newW + 'px'
        this.element.style.height = newH + 'px'
      }
    })

    // Stop dragging on mouse up
    document.addEventListener('mouseup', () => {
      isDragging = false
      isResizing = false
    })

    // Maximize window
    maxButton.addEventListener('click', () => {
      if (!isMaximized) {
        isMaximized = true

        // Save current poisiton + size before mazimizing
        if (this.element.style.left !== '') oldLeft = parseInt(this.element.style.left, 10)
        else oldLeft = 0

        if (this.element.style.top !== '') oldTop = parseInt(this.element.style.top, 10)
        else oldTop = 0

        oldWidth = this.element.offsetWidth
        oldHeight = this.element.offsetHeight

        // Maximize to fill the screen
        this.element.style.left = '0px'
        this.element.style.top = '0px'
        this.element.style.width = '100vw'
        this.element.style.height = '100vh'

        maxButton.innerText = '🗗'
      } else {
        isMaximized = false

        // Restore old poistion
        this.element.style.left = oldLeft + 'px'
        this.element.style.top = oldTop + 'px'
        this.element.style.width = oldWidth + 'px'
        this.element.style.height = oldHeight + 'px'

        maxButton.innerHTML = '⛶'
      }
    })
  }
}
