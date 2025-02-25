"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, RefreshCw, User, Bot } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type StudySession = {
  id: string
  title: string
  description: string
  study_level: string
  learning_goals: string
  learning_style: string
  weaknesses: string
  additional_info: string
  created_at: string
}

export default function StudySessionChat() {
  const router = useRouter()
  const params = useParams()
  const [session, setSession] = useState<StudySession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const supabase = createClient()
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/sign-in')
          return
        }

        // Get study session
        const { data: session, error: sessionError } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('id', params.id)
          .single()

        if (sessionError) throw sessionError
        if (!session) {
          router.push('/dashboard')
          return
        }

        setSession(session)
        
        // Add initial assistant message
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I'm here to help you with your study session on "${session.title}". What would you like to focus on today?`,
            timestamp: new Date()
          }
        ])
      } catch (error) {
        console.error("Error fetching session:", error)
        toast.error("Failed to load study session")
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [router, params.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Focus input after message is sent
    if (!sending) {
      inputRef.current?.focus()
    }
  }, [messages, sending])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput("")
    setSending(true)

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    try {
      // TODO: Implement actual AI chat functionality
      // For now, just echo a response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I understand you're asking about "${userMessage}". Let me help you with that...`,
          timestamp: new Date()
        }])
        setSending(false)
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
      setSending(false)
    }
  }

  // Format message with markdown-style formatting
  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className={i > 0 ? 'mt-4' : ''}>{line}</p>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span>Loading your study session...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard"
              className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                {session?.title}
              </h1>
              <p className="text-sm text-gray-500 line-clamp-1">
                {session?.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto px-4">
        <ScrollArea className="flex-1 pt-4 pb-32">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div key={index} className="group">
                <div className="flex items-start space-x-3 px-4 py-2">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    <Avatar className={message.role === 'assistant' 
                      ? 'bg-blue-600 text-white flex items-center justify-center' 
                      : 'bg-blue-600 text-white flex items-center justify-center'}>
                      {message.role === 'assistant' 
                        ? <Bot className="h-5 w-5" /> 
                        : <User className="h-5 w-5" />}
                    </Avatar>
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1 space-y-1.5">
                    <div className="text-sm font-medium text-gray-900">
                      {message.role === 'assistant' ? 'Study Assistant' : 'You'}
                    </div>
                    <div className="text-gray-800 prose prose-sm">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                </div>
                
                {/* Add subtle separation between messages */}
                {index < messages.length - 1 && (
                  <div className="pt-4">
                    <Separator className="max-w-3xl mx-auto opacity-30" />
                  </div>
                )}
              </div>
            ))}
            
            {sending && (
              <div className="text-gray-500 flex items-center px-4 py-2 ml-14">
                <div className="flex space-x-1.5">
                  <span className="animate-pulse h-2 w-2 bg-gray-400 rounded-full"></span>
                  <span className="animate-pulse delay-150 h-2 w-2 bg-gray-400 rounded-full"></span>
                  <span className="animate-pulse delay-300 h-2 w-2 bg-gray-400 rounded-full"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t bg-white sticky bottom-0 z-10 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="border border-gray-300 rounded-md flex items-stretch overflow-hidden">
            <div className="flex-1 flex items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                className="border-0 shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-4 w-full"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !sending) {
                      handleSendMessage(e as any);
                    }
                  }
                }}
              />
            </div>
            <div className="border-l border-gray-300 flex items-center justify-center">
              <Button
                onClick={handleSendMessage}
                type="button"
                disabled={!input.trim() || sending}
                className="h-12 w-12 rounded-none bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-center text-gray-500">
            Study Assistant may generate inaccurate information. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  )
} 