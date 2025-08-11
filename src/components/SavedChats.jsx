import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

export default function SavedChats({ onLoad, refreshSignal = 0, sessionId }) {
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState([])
  const [loadedMsg, setLoadedMsg] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const fetchChats = useCallback(() => {
    if (!sessionId) return
    axios
      .get('/saved-chats', { headers: { 'session-id': sessionId } })
      .then((res) => setChats(res.data.chats || []))
      .catch((err) => console.error(err))
  }, [sessionId])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  useEffect(() => {
    fetchChats()
  }, [refreshSignal, fetchChats])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (!open && next) fetchChats()
  }

  const loadChat = async (chat_id, session_id, timestamp) => {
    try {
      const res = await axios.get(`/get-chat/${chat_id}`, {
        headers: { 'session-id': session_id || sessionId },
      })
      onLoad({
        chat_id: res.data.chat_id,
        // if session_id wasn't provided by the list, try to read it from the API response
        session_id: session_id || res.data.session_id || sessionId,
        messages: res.data.messages,
        files: res.data.files,
        chat_name: res.data.chat_name,
      })
      setSelectedId(chat_id)
      setLoadedMsg(`✅ Loaded saved chat from ${new Date(timestamp).toLocaleString()}`)
      setTimeout(() => setLoadedMsg(''), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full text-left font-semibold"
      >
        Saved Chat History {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-sm">
          {chats.map((c) => (
            <button
              key={c.chat_id}
              onClick={() => loadChat(c.chat_id, c.session_id, c.timestamp)}
              className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-800 ${
                selectedId === c.chat_id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xs">{c.chat_name || 'Untitled Chat'}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(c.timestamp).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
          {loadedMsg && <p className="text-green-500 text-xs mt-2">{loadedMsg}</p>}
        </div>
      )}
    </div>
  )
}
