'use client'

import { useCompletion } from 'ai/react'
import { Input } from "@/components/ui/input"

export default function App() {
  const { completion, input, handleInputChange, handleSubmit, isLoading, complete } = useCompletion({
    api: '/api/search',
  })

  return (
    <div>
      <pre>
        <code>
          {/* isLoading: {JSON.stringify(isLoading)} */}
          {/* complete: {JSON.stringify(complete)} */}
          {completion}
        </code>
      </pre>


      <form onSubmit={handleSubmit}>
        <label>
          Say something...
          <Input
            value={input}
            onChange={handleInputChange}
          />
        </label>
      </form>
    </div>
  )
}
