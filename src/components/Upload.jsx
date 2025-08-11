import React, { useState } from 'react'
import axios from 'axios'

export default function Upload({ sessionId, chatId, onUploaded }) {
  const [files, setFiles] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length) return
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    try {
      const res = await axios.post('/upload-statement', formData, {
        headers: { 'session-id': sessionId, 'chat-id': chatId },
      })
      onUploaded(res.data)
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="flex items-center justify-center p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-800">
        <span className="text-2xl">+</span>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
      </label>
      {files.length > 0 && (
        <p className="text-xs break-all">
          {files.map((f) => f.name).join(', ')}
        </p>
      )}
      <button type="submit" className="hidden">Upload</button>
    </form>
  )
}
