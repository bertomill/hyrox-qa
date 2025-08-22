'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCompletion } from 'ai/react'
import { Search, X, Loader, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function SearchDialog() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState<string>('')

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/vector-search',
  })

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.metaKey) {
        setOpen(true)
      }

      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      complete(query)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setOpen(true)}
        className="text-base flex gap-2 items-center px-4 py-2 z-50 relative
        text-slate-500 dark:text-slate-400  hover:text-slate-700 dark:hover:text-slate-300
        transition-colors
        rounded-full
        border border-slate-200 dark:border-slate-500 hover:border-slate-300 dark:hover:border-slate-500
        min-w-[300px] "
      >
        <Search width={15} />
        <span className="border border-l h-5"></span>
        <span className="inline-block ml-4">Ask about Hyrox...</span>
        <kbd
          className="absolute right-3 top-2.5
          pointer-events-none inline-flex h-5 select-none items-center gap-1
          rounded border border-slate-100 bg-slate-100 px-1.5
          font-mono text-[10px] font-medium
          text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400
          opacity-100 "
        >
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Simple Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto overflow-x-hidden border border-gray-700 shadow-lg" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #000000)' }}>
          <DialogHeader className="text-center p-6">
            <DialogTitle className="text-2xl font-bold text-white">Hyrox Q&A Bot</DialogTitle>
            <DialogDescription className="text-gray-300">
              Ask anything about Hyrox competitions, events, training, or general information!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6">
              <Input
                placeholder="Type your question about Hyrox here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
              
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="w-full rounded-full"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin mr-2" width={20} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Send className="mr-2" width={20} />
                    Ask Question
                  </>
                )}
              </Button>
            </form>


            {/* AI Response Display */}
            {completion && (
              <div className="px-6">
                <div className="bg-gray-800/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700 overflow-x-auto">
                  <p className="text-sm text-gray-400 mb-2">Answer:</p>
                  <div className="text-white leading-relaxed prose prose-invert max-w-none prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-blue-400 prose-a:no-underline prose-a:hover:underline prose-code:text-gray-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {completion}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="px-6">
                <div className="bg-red-900/30 backdrop-blur-sm p-4 rounded-lg border border-red-700">
                  <p className="text-sm text-red-400 mb-2">Error:</p>
                  <p className="text-red-200">{error.message}</p>
                </div>
              </div>
            )}

            {/* Sample Questions */}
            {!query && !completion && (
              <div className="px-6">
                <p className="text-sm text-gray-400 mb-3">Or try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What is Hyrox?",
                    "How do I train for Hyrox?",
                    "What are the competition rules?",
                    "How long is a Hyrox event?"
                  ].map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => setQuery(sample)}
                      size="sm"
                      className="rounded-full"
                    >
                      {sample}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4">
            <Button variant="outline" onClick={handleClose} className="rounded-full">
              Close
            </Button>
            {completion && (
              <Button 
                onClick={() => {
                  setQuery('')
                  // Reset completion would need to be handled by the useCompletion hook
                }}
                className="rounded-full"
              >
                Ask Another Question
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
