import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function PreviewData({ sessionId, chatId, fileId }) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    // close any open preview when switching chats or files
    setOpen(false)
    // always clear the old preview so the dropdown reflects new data
    setPreview(null)
    if (!fileId) return
    axios
      .get(`/preview-data?file_id=${fileId}`, {
        headers: {
          'session-id': sessionId,
          'chat-id': chatId,
        },
      })
      .then((res) => setPreview(res.data))
      .catch((err) => {
        console.error(err)
      })
  }, [sessionId, chatId, fileId])

  if (!fileId) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left font-semibold"
      >
        Preview Uploaded Data {open ? '▲' : '▼'}
      </button>
      {open && preview && (
        <div className="mt-2 max-h-48 overflow-auto border border-gray-700 rounded text-xs">
          <table className="w-full">
            <thead>
              <tr>
                {preview.columns.map((c) => (
                  <th key={c} className="p-1 border-b border-gray-700 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, ri) => (
                <tr key={ri} className="odd:bg-gray-800">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-1 border-b border-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
