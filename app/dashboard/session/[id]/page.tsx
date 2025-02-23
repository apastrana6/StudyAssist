"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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
  }, [messages])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {session?.title}
              </h1>
              <p className="text-sm text-gray-500">
                {session?.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-12rem)] flex flex-col bg-white/80 backdrop-blur-sm">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t bg-white flex items-center space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
} 