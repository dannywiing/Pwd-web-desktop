# Personal Web Desktop (PWD)

A small “desktop in the browser” built as a Single Page Application (SPA).  
The desktop lets you open multiple draggable windows (DOM windows), bring them to focus, and run different mini-apps.

## Included apps
- **Memory Game** , playable with keyboard support
- **Chat** , real-time WebSocket chat with username + channel, emoji bar, and message history (last 20)
- **Notes** , simple notes app that saves content in localStorage

## Features
- Multiple windows can be opened at the same time
- Drag & move windows inside the desktop
- Focus handling (active window goes on top)
- Persistent username + notes + chat history using `localStorage`
- WebSocket chat connected to the course message server

## How to run
```bash
npm install
npm run dev
