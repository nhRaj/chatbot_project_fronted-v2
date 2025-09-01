import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import CommonQuestions from './components/CommonQuestions'
import SavedChats from './components/SavedChats'
import ModelSelector from './components/ModelSelector'
import Chat from './components/Chat'

function App() {
  const [sessionId, setSessionId] = useState('')
  const [chatId, setChatId] = useState('')
  const [filesInfo, setFilesInfo] = useState([])
  const [selectedFileId, setSelectedFileId] = useState('')
  const [provider, setProvider] = useState('azure')
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [collapsed, setCollapsed] = useState(false)
  const [loadedMessages, setLoadedMessages] = useState([])
  const chatRef = useRef(null)
  const [savedChatsVersion, setSavedChatsVersion] = useState(0)
  const [canAsk, setCanAsk] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const newSession = async () => {
    const res = await axios.post('/new-session')
    const sid = res.data.session_id
    setSessionId(sid)
    setFilesInfo([])
    setSelectedFileId('')
    setLoadedMessages([])
    setCanAsk(false)
    setHasUnsaved(false)
    const chatRes = await axios.post('/start-new-chat', null, {
      headers: { 'session-id': sid },
    })
    setChatId(chatRes.data.chat_id)
  }

  const saveCurrentChat = async () => {
    const messages = chatRef.current?.getMessages() || []
    const chat_name = window.prompt('Enter chat name (optional):') || undefined
    try {
      await axios.post(
        '/save-chat',
        { chat_name, messages },
        { headers: { 'session-id': sessionId, 'chat-id': chatId } },
      )
      alert('Chat saved successfully.')
      setSavedChatsVersion((v) => v + 1)
      setHasUnsaved(false)
    } catch (err) {
      console.error(err)
      alert('Failed to save chat.')
    }
  }

  const newChat = async () => {
    if (!sessionId) return
    // reset local state immediately
    setLoadedMessages([])
    setFilesInfo([])
    setSelectedFileId('')
    setCanAsk(false)
    chatRef.current?.reset()
    setHasUnsaved(false)
    try {
      const res = await axios.post('/start-new-chat', null, {
        headers: { 'session-id': sessionId },
      })
      setChatId(res.data.chat_id)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    newSession()
  }, [])


  const startDrag = (e) => {
    const startX = e.clientX
    const startWidth = sidebarWidth
    const onMove = (ev) => {
      const newW = startWidth + ev.clientX - startX
      setSidebarWidth(Math.min(Math.max(newW, 200), 500))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const sidebarStyle = {
    width: collapsed ? 0 : sidebarWidth,
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans">
      <header className="bg-gray-900 text-center py-3 text-lg font-semibold">
        Welcome to Bank Statement QnA Chatbot
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div
          style={sidebarStyle}
          className="relative flex flex-col overflow-hidden bg-[#121212] border-r border-gray-700 transition-all"
        >
          <div className="p-4 space-y-4 flex-shrink-0">
            <h1 className="font-bold text-xl">🏦 Bank Statement QnA</h1>
            <button onClick={newChat} className="w-full bg-red-600 py-2 rounded">
              New Chat
            </button>
            <button
              onClick={saveCurrentChat}
              disabled={!hasUnsaved}
              className="w-full bg-green-700 py-2 rounded disabled:opacity-50"
            >
              💾 Save Chat
            </button>
            <ModelSelector provider={provider} setProvider={setProvider} />
            <select
              className="w-full bg-gray-800 p-1 rounded"
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
              disabled={filesInfo.length === 0}
            >
              {filesInfo.length === 0 ? (
                <option value="">Upload statements first</option>
              ) : (
                filesInfo.map((f) => (
                  <option key={f.file_id} value={f.file_id}>
                    {f.filename}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 text-sm">
            <CommonQuestions
              enabled={canAsk}
              onAsk={(q) => chatRef.current?.ask(q)}
            />
            <SavedChats
              sessionId={sessionId}
              refreshSignal={savedChatsVersion}
              onLoad={(data) => {
                // Only update the session if the loaded chat supplies one.
                // Some backends do not return a session_id for saved chats,
                // and overwriting our current session would drop the header
                // required by subsequent API calls.
                setSessionId((prev) => data.session_id || prev)
                const files = data.files || []
                setFilesInfo(files)
                setSelectedFileId(files[0]?.file_id || '')
                setLoadedMessages(data.messages)
                setChatId(data.chat_id)
                // only enable questions if there are files
                setCanAsk(files.length > 0)
                setHasUnsaved(false)
              }}
            />
          </div>
          <div onMouseDown={startDrag} className="absolute top-0 right-0 w-1 cursor-col-resize h-full" />
        </div>
        <div className="flex-1 relative">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-700 rounded text-xs"
          >
            {collapsed ? '>' : '<'}
          </button>
          <div className="h-full">
            <Chat
              key={chatId}
              ref={chatRef}
              sessionId={sessionId}
              chatId={chatId}
              provider={provider}
              initialHasFiles={filesInfo.length > 0}
              onFileUploaded={(data) => {
                setSessionId(data.session_id)
                setChatId(data.chat_id)
                const files = data.files || []
                setFilesInfo(files)
                setSelectedFileId(files[0]?.file_id || '')
                setCanAsk(files.length > 0)
                setHasUnsaved(true)
              }}
              initialMessages={loadedMessages}
              onDirtyChange={setHasUnsaved}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
