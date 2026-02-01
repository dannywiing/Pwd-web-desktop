// Key name used to store the username in localStorage
const STORAGE_KEY_USERNAME = 'pwd.chat.username'

// Key prefix used to store message history in localStorage
const STORAGE_KEY_HISTORY_PREFIX = 'pwd.chat.history.'

const WS_URL = 'wss://courselab.lnu.se/message-app/socket'
const API_KEY = 'eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd'
const DEFAULT_CHANNEL = 'my, not so secret, channel'

/**
 * Chat Application
 * @param {HTMLElement} root The root element to render the chat app into
 */
export function ChatApp (root) {
  root.innerHTML = ''
  renderUsernameScreen()

  /**
   * Build a localStorage key for the message history
   * @param {string} channel the channel name
   * @returns {string} the storage key used in localStorage
   */
  function getHistoryKey (channel) {
    return `${STORAGE_KEY_HISTORY_PREFIX}${channel}`
  }

  /**
   * Loads cached message history from localStorage for a given channel
   * @param {string} channel the channel to load history for
   * @returns {Array} an array of message objects like
   */
  function loadHistory (channel) {
    const key = getHistoryKey(channel)
    const raw = localStorage.getItem(key)
    if (raw === null) return []
    return JSON.parse(raw)
  }

  /**
   * Saves message history to localStorage for a given channel
   * @param {string} channel the channel to save history for
   * @param {Array} messages an array of message objects
   */
  function saveHistory (channel, messages) {
    const key = getHistoryKey(channel)
    const raw = JSON.stringify(messages)
    localStorage.setItem(key, raw)
  }

  /**
   * Start the chat UI and connects to the WebSocket Server
   * @param {string} username The chosen username for this chat
   * @param {string} channel The chosen channel to be in
   */
  function startChatUI (username, channel) {
    root.innerHTML = ''

    const title = document.createElement('h1')
    title.textContent = 'Chat Application'

    const status = document.createElement('div')
    status.textContent = 'Status: Connecting...'
    status.className = 'chat-status'

    const log = document.createElement('div')
    log.className = 'chat-log'
    log.style.border = '1px solid black'
    log.style.overflowY = 'auto'
    log.style.padding = '8px'
    log.textContent = ''

    const textarea = document.createElement('textarea')
    textarea.className = 'chat-input'
    textarea.rows = 4
    textarea.placeholder = 'Type your message...'

    const button = document.createElement('button')
    button.className = 'chat-send'
    button.type = 'button'
    button.textContent = 'Send'

    const channelText = document.createElement('div')
    channelText.textContent = `Channel: ${channel}`

    const changerUserBtn = document.createElement('button')
    changerUserBtn.className = 'chat-change'
    changerUserBtn.type = 'button'
    changerUserBtn.textContent = 'Change username'

    // Emoji bar
    const emojiBar = document.createElement('div')
    emojiBar.className = 'chat-emoji'
    emojiBar.style.display = 'flex'
    emojiBar.style.gap = '6px'
    emojiBar.style.margin = '6px 0'
    emojiBar.style.fontFamily = 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif'
    emojiBar.style.flexWrap = 'wrap'
    emojiBar.style.maxWidth = '100%'

    // Unicode code points for emojis
    const emojiCodes = [0x1F600, 0x1F602, 0x1F525, 0x2764, 0x1F44D, 0x1F60E, 0x1F973, 0x2705]

    // Loop through each emoji in the array
    for (const code of emojiCodes) {
      const emoji = String.fromCodePoint(code)

      const emojiBtn = document.createElement('button')
      emojiBtn.type = 'button'
      emojiBtn.textContent = emoji

      emojiBtn.addEventListener('click', () => {
        textarea.value += emoji
        textarea.focus()
      })

      emojiBar.appendChild(emojiBtn)
    }

    // Button to clear cached history (per channel)
    const clearHistoryBtn = document.createElement('button')
    clearHistoryBtn.className = 'chat-clear'
    clearHistoryBtn.type = 'button'
    clearHistoryBtn.textContent = 'Clear history'

    root.appendChild(title)
    root.appendChild(status)
    root.appendChild(channelText)
    root.appendChild(changerUserBtn)
    root.appendChild(clearHistoryBtn)
    root.appendChild(log)
    root.appendChild(emojiBar)
    root.appendChild(textarea)
    root.appendChild(button)

    const MAX_MESSAGES = 20

    // Load cached messages for this channel when starting the chat UI
    const messages = loadHistory(channel)

    // Keep only the last MAX_MESSAGES (remove the oldest ones)
    if (messages.length > MAX_MESSAGES) {
      messages.splice(0, messages.length - MAX_MESSAGES)
    }

    /**
     * Render whole chat log from messages array
     */
    function render () {
      log.innerHTML = ''
      for (const n of messages) {
        const row = document.createElement('div')
        row.textContent = `${n.username}: ${n.text}`
        log.appendChild(row)
      }
      log.scrollTop = log.scrollHeight
    }

    // Render any cached messages right away
    render()

    // Clear cached history
    clearHistoryBtn.addEventListener('click', () => {
      localStorage.removeItem(getHistoryKey(channel))
      messages.length = 0
      render()
    })

    // Create a WebSocket connection
    const ws = new WebSocket(WS_URL)

    ws.addEventListener('open', () => {
      status.textContent = 'Status: Connected'
    })

    ws.addEventListener('close', () => {
      status.textContent = 'Status: Disconnected'
    })

    ws.addEventListener('error', () => {
      status.textContent = 'Status: Error'
    })

    // Receive a message from the server
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)

      // Server sometimes sends heartbeats, ignore them
      if (msg.type === 'heartbeat') return

      // If msg.channel is missing, use the default channel
      let incomingChannel = msg.channel
      if (incomingChannel === null || incomingChannel === undefined) {
        incomingChannel = DEFAULT_CHANNEL
      }

      // Only show messages that match this window's channel
      if (incomingChannel !== channel) return

      // Save the incoming chat message
      messages.push({ username: msg.username, text: msg.data })
      if (messages.length > MAX_MESSAGES) messages.shift()

      // Cache the latest messages for this channel in localStorage
      saveHistory(channel, messages)

      render()
    })

    // Put the chat message into the server
    button.addEventListener('click', () => {
      const text = textarea.value.trim()
      if (!text) return

      const payload = {
        type: 'message',
        data: text,
        username,
        channel,
        key: API_KEY
      }

      ws.send(JSON.stringify(payload))

      textarea.value = ''
    })

    // Extended feature press 'Enter' keyboard to send
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        button.click()
      }
    })

    // Allow user to change username
    changerUserBtn.addEventListener('click', () => {
      // Close the WebSocket connection
      ws.close()

      // Go back to the username screen
      renderUsernameScreen()
    })
  }

  /**
   * Renders the username screen
   * Reads previously saved username from localStorage
   */
  function renderUsernameScreen () {
    root.innerHTML = ''

    const title = document.createElement('h1')
    title.textContent = 'Choose username and channel'
    title.className = 'chat-title'

    const userNameLabel = document.createElement('div')
    userNameLabel.textContent = 'Username'
    userNameLabel.className = 'chat-label'

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Enter your username'
    input.className = 'chat-field'

    const saved = localStorage.getItem(STORAGE_KEY_USERNAME)
    if (saved != null) {
      input.value = saved
    }

    const startBtn = document.createElement('button')
    startBtn.type = 'button'
    startBtn.textContent = 'Start chat'
    startBtn.className = 'chat-btn'

    const channelLabel = document.createElement('div')
    channelLabel.textContent = 'Channel'
    channelLabel.className = 'chat-label'

    const channelInput = document.createElement('input')
    channelInput.type = 'text'
    channelInput.placeholder = 'Enter a channel'

    channelInput.value = 'my, not so secret, channel'
    channelInput.className = 'chat-field'

    root.appendChild(title)
    root.appendChild(userNameLabel)
    root.appendChild(input)
    root.appendChild(channelLabel)
    root.appendChild(channelInput)
    root.appendChild(startBtn)

    // Save username and start startChatUI
    startBtn.addEventListener('click', () => {
      const name = input.value.trim()
      if (name.length < 2) return

      const channel = channelInput.value.trim()
      if (channel.length < 2) return

      localStorage.setItem(STORAGE_KEY_USERNAME, name)
      startChatUI(name, channel)
    })
  }
}
