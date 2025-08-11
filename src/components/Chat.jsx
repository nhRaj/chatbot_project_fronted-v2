import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'
import axios from 'axios'

const initialSystemMessage = {
  role: 'system',
  content: 'Please upload your bank statement PDF or CSV to begin.',
}

function Chat(
  {
    sessionId,
    chatId,
    provider = 'azure',
    onFileUploaded,
    initialMessages = [],
    initialHasFiles = false,
    onDirtyChange,
  },
  ref,
) {

  const [messages, setMessages] = useState(
    initialMessages.length ? initialMessages : [initialSystemMessage],
  )
  const [question, setQuestion] = useState('')
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [hasFiles, setHasFiles] = useState(initialMessages.length > 0 || initialHasFiles)

  useEffect(() => {
    if (initialMessages.length) {
      setMessages(initialMessages)
    } else {
      setMessages([initialSystemMessage])
    }
    onDirtyChange?.(false)
  }, [initialMessages, onDirtyChange])

  useEffect(() => {
    if (initialHasFiles) setHasFiles(true)
  }, [initialHasFiles])

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    try {
      setUploading(true)
      const res = await axios.post('/upload-statement', formData, {
        headers: { 'session-id': sessionId, 'chat-id': chatId },
      })
      onFileUploaded(res.data)
      setHasFiles(true)
      setMessages((m) => [
        ...m,
        {
          role: 'system',
          content: `✅ ${files.length} file${files.length > 1 ? 's' : ''} processed successfully. You may now ask questions.`,
        },
      ])
      onDirtyChange?.(true)
    } catch (err) {
      console.error(err)
      setMessages((m) => [
        ...m,
        { role: 'system', content: 'Upload failed, please try again.' },
      ])
      onDirtyChange?.(true)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sendQuestion = async (q) => {
    if (!q || !hasFiles) return
    const userMsg = { role: 'user', content: q }
    setMessages((m) => [...m, userMsg])
    onDirtyChange?.(true)
    setQuestion('')
    try {
      const res = await axios.post(
        '/ask-question',
        { question: q, provider },
        {
          headers: {
            'session-id': sessionId,
            'chat-id': chatId,
          },
        },
      )
      const botMsg = { role: 'assistant', content: res.data.answer }
      setMessages((m) => [...m, botMsg])
    } catch (err) {
      console.error(err)
      setMessages((m) => [...m, { role: 'assistant', content: 'Error getting answer' }])
    }
  }

  const ask = async (e) => {
    e.preventDefault()
    await sendQuestion(question)
  }

  useImperativeHandle(ref, () => ({
    ask: sendQuestion,
    getMessages: () => messages,
    loadMessages: (msgs) => {
      setMessages(msgs.length ? msgs : [initialSystemMessage])
      setHasFiles(msgs.length > 0)
      onDirtyChange?.(false)
    },
    reset: () => {
      setMessages([initialSystemMessage])
      setHasFiles(false)
      setQuestion('')
      onDirtyChange?.(false)
    },
    setInputText: setQuestion,
  }))

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-3 py-2 rounded-md text-sm animate-fade ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={ask} className="p-2 flex space-x-2 bg-[#1E1E1E]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xl px-2"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none"
          placeholder="Ask a question"
          disabled={!hasFiles || uploading}
        />
        <button
          className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
          type="submit"
          disabled={!hasFiles || uploading || !question}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default forwardRef(Chat)
