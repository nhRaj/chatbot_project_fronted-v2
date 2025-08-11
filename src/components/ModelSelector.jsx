import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function ModelSelector({ provider, setProvider }) {
  const [options, setOptions] = useState([])

  useEffect(() => {
    axios
      .get('/providers')
      .then((res) => setOptions(res.data.providers || []))
      .catch((err) => console.error(err))
  }, [])

  if (!options.length) return null

  return (
    <select
      className="w-full bg-gray-700 text-white p-2 rounded"
      value={provider}
      onChange={(e) => setProvider(e.target.value)}
    >
      {options.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  )
}
