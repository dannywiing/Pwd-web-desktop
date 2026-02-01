/**
 * Renders the Memory game app into the given root element.
 * @param {HTMLElement} root dom element to render the app into
 */
export function MemoryApp (root) {
  root.innerHTML = ''
  let rows = 4
  let cols = 4
  let card = []
  let shuffledCards = []
  let flippedCards = []
  let lockedCards = false
  let attemps = 0

  // Timer + highscore state
  let timerId = null
  let startTimeMs = 0
  let elapsedMs = 0
  let currentMode = '4x4'

  // make reset safe even during animations/timeouts
  let gameId = 0
  let timeouts = []

  /**
   * Clears all scheduled timeouts.
   */
  function clearAllTimeouts () {
    for (const id of timeouts) clearTimeout(id)
    timeouts = []
  }

  /**
   * Runs a function after a delay only if the gameId matches.
   * @param {void} fn function to run after delay
   * @param {number} ms delay time in milliseconds
   * @param {number} idAtSchedule The gameId at the time of scheduling
   */
  function safeTimeout (fn, ms, idAtSchedule) {
    const t = setTimeout(() => {
      if (idAtSchedule !== gameId) return
      fn()
    }, ms)
    timeouts.push(t)
  }

  /**
   * Gets a card button by index.
   * @param {number} index card index
   * @returns {HTMLButtonElement|null} the card button or null
   */
  function getCardBtn (index) {
    return board.querySelector(`button.memory-card[data-index='${index}']`)
  }

  /**
   * Checks if a card button is visible and usable for keyboard navigation.
   * @param {HTMLButtonElement|null} btn card button
   * @returns {boolean} true if the card is visible and not disabled
   */
  function isVisibleCard (btn) {
    if (!btn) return false
    if (btn.style.visibility === 'hidden') return false
    if (btn.disabled) return false
    return true
  }

  /**
   * Finds the first visible card button.
   * @returns {HTMLButtonElement|null} first visible card button or null
   */
  function getFirstVisibleCard () {
    const buttons = Array.from(board.querySelectorAll('button.memory-card'))
    return buttons.find(isVisibleCard) ?? null
  }

  /**
   * Sets roving focus (tabIndex=0) on the provided card button.
   * @param {HTMLButtonElement} nextBtn card button to focus
   */
  function setRovingFocus (nextBtn) {
    const current = board.querySelector("button.memory-card[tabindex='0']")
    if (current) current.tabIndex = -1
    nextBtn.tabIndex = 0
    nextBtn.focus()
  }

  /**
   * Ensures keyboard focus is on a visible card.
   */
  function ensureFocusOnVisibleCard () {
    const active = root.ownerDocument.activeElement
    const activeBtn = active && active.closest ? active.closest('button.memory-card') : null
    if (isVisibleCard(activeBtn)) return

    const roving = board.querySelector("button.memory-card[tabindex='0']")
    if (isVisibleCard(roving)) {
      roving.focus()
      return
    }

    const first = getFirstVisibleCard()
    if (first) setRovingFocus(first)
  }

  /**
   * Finds next visible card index in a straight line (same row/col).
   * @param {number} index current card index
   * @param {"left"|"right"|"up"|"down"} dir direction
   * @returns {number} next index or -1 if none found
   */
  function findNextVisibleIndexLine (index, dir) {
    let r = Math.floor(index / cols)
    let c = index % cols

    while (true) {
      if (dir === 'left') c -= 1
      else if (dir === 'right') c += 1
      else if (dir === 'up') r -= 1
      else if (dir === 'down') r += 1

      if (r < 0 || r >= rows || c < 0 || c >= cols) return -1

      const nextIndex = r * cols + c
      const nextBtn = getCardBtn(nextIndex)
      if (isVisibleCard(nextBtn)) return nextIndex
    }
  }

  /**
   * Fallback navigation when straight-line search fails (reading order).
   * @param {number} index current card index
   * @param {"left"|"right"|"up"|"down"} dir direction
   * @returns {number} next visible index or -1 if none found
   */
  function findNextVisibleIndexFallback (index, dir) {
    const total = rows * cols

    if (dir === 'right' || dir === 'down') {
      for (let i = index + 1; i < total; i++) {
        const btn = getCardBtn(i)
        if (isVisibleCard(btn)) return i
      }
      return -1
    }

    for (let i = index - 1; i >= 0; i--) {
      const btn = getCardBtn(i)
      if (isVisibleCard(btn)) return i
    }
    return -1
  }

  /**
   * Creates an array of card values for the memory game.
   * @returns {number[]} array of card values.
   */
  function createCard () {
    const totalCards = rows * cols
    const pairs = totalCards / 2
    const cardValues = []
    for (let i = 1; i <= pairs; i++) {
      cardValues.push(i, i)
    }
    return cardValues
  }

  /**
   * Shuffles an array in place using the Fisher-Yates algorithm.
   * @param {number[]} cardValues array to shuffle
   * @returns {number[]} shuffled array
   */
  function shuffle (cardValues) {
    for (let i = cardValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = cardValues[i]
      cardValues[i] = cardValues[j]
      cardValues[j] = temp
    }
    return cardValues
  }

  /**
   * Sets up the game board with the given card values.
   * @param {number[]} cardValues array of card values
   */
  function setupBoard (cardValues) {
    board.innerHTML = ''

    board.style.display = 'grid'
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
    board.style.gap = '10px'

    // Create card elements with image
    for (let index = 0; index < cardValues.length; index++) {
      const cardBtn = document.createElement('button')
      const img = document.createElement('img')
      img.src = '/img/0.png'
      img.alt = 'Card back'
      img.draggable = false

      cardBtn.type = 'button'
      cardBtn.tabIndex = -1

      cardBtn.className = 'memory-card'

      cardBtn.dataset.index = String(index)
      cardBtn.appendChild(img)
      board.appendChild(cardBtn)
    }

    const first = getFirstVisibleCard()
    if (first) first.tabIndex = 0
  }

  /**
   * Flips a card button back to the card back image.
   * @param {number} index cared index to flip back
   * @returns {void} no return value
   */
  function flipBack (index) {
    const btn = board.querySelector(`button[data-index='${index}']`)
    if (!btn) return
    const img = btn.querySelector('img')
    if (!img) return
    img.src = '/img/0.png'
  }

  /**
   * Hides a card button when a match is found.
   * @param {number} index card index to hide
   */
  function hideCard (index) {
    const btn = board.querySelector(`button[data-index='${index}']`)
    if (!btn) return
    btn.style.visibility = 'hidden'
    btn.disabled = true
    btn.tabIndex = -1
  }

  /**
   * Formats milliseconds as mm:ss.
   * @param {number} ms time in milliseconds
   * @returns {string} formatted time
   */
  function formatTime (ms) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  /**
   * Returns localStorage key for the current mode.
   * @returns {string} storage key
   */
  function bestKey () {
    return `memory_best_${currentMode}`
  }

  /**
   * Loads best score from localStorage and updates UI.
   * @returns {void}
   */
  function renderBest () {
    const raw = localStorage.getItem(bestKey())
    if (!raw) {
      bestText.textContent = 'Best: -'
      return
    }
    const best = JSON.parse(raw)
    bestText.textContent = `Best: ${best.attemps} attempts, ${formatTime(best.timeMs)}`
  }

  /**
   * Starts the timer and updates the UI every second.
   * @returns {void}
   */
  function startTimer () {
    stopTimer()
    startTimeMs = Date.now()
    elapsedMs = 0
    timerText.textContent = `Time: ${formatTime(0)}`

    timerId = window.setInterval(() => {
      elapsedMs = Date.now() - startTimeMs
      timerText.textContent = `Time: ${formatTime(elapsedMs)}`
    }, 1000)
  }

  /**
   * Stops the timer if running.
   * @returns {void}
   */
  function stopTimer () {
    if (timerId === null) return
    clearInterval(timerId)
    timerId = null
  }

  /**
   * Saves score if it's better than stored best.
   * @param {number} attempts number of attempts
   * @param {number} timeMs time in milliseconds
   * @returns {void}
   */
  function saveBestIfBetter (attempts, timeMs) {
    const raw = localStorage.getItem(bestKey())
    if (!raw) {
      localStorage.setItem(bestKey(), JSON.stringify({ attemps: attempts, timeMs }))
      renderBest()
      return
    }

    const best = JSON.parse(raw)
    const better =
      attempts < best.attemps ||
      (attempts === best.attemps && timeMs < best.timeMs)

    if (better) {
      localStorage.setItem(bestKey(), JSON.stringify({ attemps: attempts, timeMs }))
      renderBest()
    }
  }

  const newBtn = document.createElement('button')
  newBtn.className = 'memory-new'
  newBtn.type = 'button'
  newBtn.textContent = 'New game'

  const attempsText = document.createElement('div')
  attempsText.className = 'memory-attempts'
  const board = document.createElement('div')
  board.className = 'memory-board'

  // Game mode selection
  const gameMode = document.createElement('select')
  gameMode.className = 'memory-select'
  gameMode.innerHTML = `
    <option value="2x2">2x2</option>
    <option value="2x4">2x4</option>
    <option value="4x4">4x4</option>
  `

  const timerText = document.createElement('div')
  timerText.className = 'memory-timer'
  timerText.textContent = 'Time: 00:00'

  const bestText = document.createElement('div')
  bestText.className = 'memory-best'
  bestText.textContent = 'Best: N/A'

  root.appendChild(newBtn)
  root.appendChild(attempsText)
  root.appendChild(board)
  root.appendChild(gameMode)
  root.appendChild(timerText)
  root.appendChild(bestText)

  newBtn.focus()

  // global shortcuts, R = new game, 1/2/3 = change size
  root.ownerDocument.addEventListener('keydown', (event) => {
    const active = root.ownerDocument.activeElement
    if (!root.contains(active)) return

    const key = event.key

    // R starts new game
    if (key === 'r' || key === 'R') {
      event.preventDefault()
      newBtn.click()
      return
    }

    // 1/2/3 changes size + starts new game
    if (key === '1') {
      event.preventDefault()
      gameMode.value = '2x2'
      newBtn.click()
      return
    }

    if (key === '2') {
      event.preventDefault()
      gameMode.value = '2x4'
      newBtn.click()
      return
    }

    if (key === '3') {
      event.preventDefault()
      gameMode.value = '4x4'
      newBtn.click()
    }
  }, true)

  /**
   * Handles keyboard navigation and flip on the game board.
   * Arrow keys move focus between visible cards.
   * Space or enter flips the focused card.
   * @param {KeyboardEvent} event keydown event
   */
  board.addEventListener('keydown', (event) => {
    const btn = event.target.closest('button.memory-card')
    if (!btn) return
    if (!isVisibleCard(btn)) return

    const index = Number(btn.dataset.index)
    if (Number.isNaN(index)) return

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      btn.click()
      return
    }

    let dir = null
    if (event.key === 'ArrowLeft') dir = 'left'
    else if (event.key === 'ArrowRight') dir = 'right'
    else if (event.key === 'ArrowUp') dir = 'up'
    else if (event.key === 'ArrowDown') dir = 'down'
    else return

    event.preventDefault()

    let nextIndex = findNextVisibleIndexLine(index, dir)
    if (nextIndex === -1) nextIndex = findNextVisibleIndexFallback(index, dir)
    if (nextIndex === -1) return

    const nextBtn = getCardBtn(nextIndex)
    if (!isVisibleCard(nextBtn)) return
    setRovingFocus(nextBtn)
  })

  // Event delegation for card clicks
  board.addEventListener('click', (event) => {
    const btn = event.target.closest('button.memory-card')
    if (!btn) return
    if (isVisibleCard(btn)) setRovingFocus(btn)
    if (lockedCards) return
    if (flippedCards.length === 2) return

    // Get card index and reveal image
    const index = Number(btn.dataset.index)
    if (Number.isNaN(index)) return

    // Prevent clicking already flipped card
    if (flippedCards.includes(index)) return

    // Reveal card image
    const img = btn.querySelector('img')
    if (!img) return
    img.src = `/img/${shuffledCards[index]}.png`

    flippedCards.push(index)

    if (flippedCards.length < 2) return

    lockedCards = true
    attemps += 1

    // Check for match
    const a = flippedCards[0]
    const b = flippedCards[1]
    const isMatch = shuffledCards[a] === shuffledCards[b]

    const idAtSchedule = gameId

    // Handle match or mismatch
    if (isMatch) {
      safeTimeout(() => {
        hideCard(a)
        hideCard(b)

        // If game finished: stop timer + save best
        if (isGameFinished()) {
          stopTimer()
          attempsText.textContent = `Game finished in ${attemps} attemps! Time: ${formatTime(elapsedMs)}`
          saveBestIfBetter(attemps, elapsedMs)
        }

        flippedCards = []
        lockedCards = false
        ensureFocusOnVisibleCard()
      }, 200, idAtSchedule)
      return
    }

    // Not a match flip back after delay
    safeTimeout(() => {
      flipBack(a)
      flipBack(b)
      flippedCards = []
      lockedCards = false
      ensureFocusOnVisibleCard()
    }, 1000, idAtSchedule)
  })

  // New game button click handler
  newBtn.addEventListener('click', () => {
    gameId += 1
    clearAllTimeouts()

    flippedCards = []
    lockedCards = false
    attemps = 0
    attempsText.textContent = ''

    // Determine rows and columns based on game mode
    const size = gameMode.value
    currentMode = size
    renderBest()
    startTimer()

    if (size === '2x2') {
      rows = 2
      cols = 2
    } else if (size === '2x4') {
      rows = 2
      cols = 4
    } else if (size === '4x4') {
      rows = 4
      cols = 4
    }

    // Create and shuffle new cards
    card = createCard()
    shuffledCards = shuffle(card)
    setupBoard(shuffledCards)
    ensureFocusOnVisibleCard()
  })

  /**
   * check if all cards are hidden.
   * @returns {boolean} True of game is finished.
   */
  function isGameFinished () {
    const buttons = board.querySelectorAll('button.memory-card')
    return Array.from(buttons).every(btn => btn.style.visibility === 'hidden')
  }
}
