import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function CommonQuestions({ enabled = false, onAsk }) {
  const [open, setOpen] = useState(false)
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    axios
      .get('/common-questions')
      .then((res) => setQuestions(res.data.questions || []))
      .catch((err) => console.error(err))
  }, [])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left font-semibold"
      >
        Common Questions {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-sm">
          {questions.map((q) => (
            <button
              key={q}
              disabled={!enabled}
              onClick={() => enabled && onAsk && onAsk(q)}
              className="block w-full text-left px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
