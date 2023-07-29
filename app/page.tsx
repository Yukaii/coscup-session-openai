'use client'

import { useCompletion } from 'ai/react'
import { Input } from "@/components/ui/input"
import { ModeToggle } from '@/components/theme-toggle'

export default function App() {
  const { completion, input, handleInputChange, handleSubmit, isLoading, complete } = useCompletion({
    api: '/api/search',
  })

  return (
    <div className='flex justify-center items-center h-full'>
      <span className='fixed right-1 top-1'>
        <ModeToggle />
      </span>
      <form onSubmit={handleSubmit}>
        <label>
          <Input
            className='py-6 px-4 text-2xl w-[300px] max-w-full'
            placeholder='請輸入關鍵字'
            value={input}
            onChange={handleInputChange}
          />
          <small className='text-muted-foreground'>來問問關於今年 COSCUP 議程的一些事吧！</small>
        </label>
      </form>

      {/* <pre> */}
      {/*   <code> */}
      {/*     {completion} */}
      {/*   </code> */}
      {/* </pre> */}
    </div>
  )
}
