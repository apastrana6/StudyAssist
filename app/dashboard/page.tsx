"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { GraduationCap, Plus, Calendar, Book, Clock, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"

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

// Add type for upload progress event
type UploadProgressEvent = {
  loaded: number;
  total: number;
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showNewSession, setShowNewSession] = useState(false)
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    studyLevel: "",
    learningGoals: "",
    learningStyle: "",
    weaknesses: "",
    additionalInfo: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        const supabase = createClient()
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          router.push('/auth/sign-in')
          return
        }

        if (!user) {
          router.push('/auth/sign-in')
          return
        }
        
        setUser(user)

        // Get study sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select('*')
          .order('created_at', { ascending: false })

        if (sessionsError) throw sessionsError
        setStudySessions(sessions || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        router.push('/auth/sign-in')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndSessions()
  }, [router])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      
      // Sign out with scope: 'global' to ensure all sessions are terminated
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      })
      
      if (error) throw error

      // Clear any remaining Supabase data from localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key)
        }
      }
      
      // Navigate to home page first
      await router.push('/')
      
      // Then refresh to ensure all state is cleared
      router.refresh()
      
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out. Please try again.")
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Please provide a title for your study session")
      return
    }

    if (formData.title.length > 30) {
      toast.error("Title must be 30 characters or less")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Please provide a description of what you're studying for")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("Not authenticated")

      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          study_level: formData.studyLevel,
          learning_goals: formData.learningGoals,
          learning_style: formData.learningStyle,
          weaknesses: formData.weaknesses,
          additional_info: formData.additionalInfo,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Refresh the sessions list
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      setStudySessions(sessions || [])
      setShowNewSession(false)
      setFormData({
        title: "",
        description: "",
        studyLevel: "",
        learningGoals: "",
        learningStyle: "",
        weaknesses: "",
        additionalInfo: "",
      })
      toast.success("Study session created successfully!")
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create study session")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      const supabase = createClient()

      // Delete the session (cascade delete will handle related records)
      const { error: sessionError } = await supabase
        .from("study_sessions")
        .delete()
        .eq("id", sessionToDelete)

      if (sessionError) {
        console.error("Error deleting session:", sessionError)
        throw sessionError
      }

      // Refresh the sessions list
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      setStudySessions(sessions || [])
      toast.success("Study session deleted successfully!")
      setSessionToDelete(null)
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete study session")
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
      <nav className="p-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">StudyAssist</span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user?.email}</span>
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600 hover:bg-blue-100"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Study Sessions</h1>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewSession(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Study Session
          </Button>
        </div>

        {studySessions.length === 0 ? (
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
            <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No study sessions yet</h2>
            <p className="text-gray-500 mb-4">
              Create your first study session to get started with personalized learning assistance.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowNewSession(true)}
            >
              Create Your First Session
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studySessions.map((session) => (
              <Card key={session.id} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">{session.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{session.study_level}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setSessionToDelete(session.id)}
                  >
                    <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{session.description}</p>
                
                {session.learning_goals && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Learning Goals:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{session.learning_goals}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{format(new Date(session.created_at), 'h:mm a')}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-600">
              Start a New Study Session
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to create a personalized study session
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-base">
                  Session Title{" "}
                  <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500 ml-1">
                    (max 30 characters)
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  maxLength={30}
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="E.g., Calculus Final Prep"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  What are you studying for?{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="E.g., Final exam in Advanced Mathematics, focusing on calculus and linear algebra"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="studyLevel" className="text-base">
                  Level of Study
                </Label>
                <Textarea
                  id="studyLevel"
                  name="studyLevel"
                  value={formData.studyLevel}
                  onChange={handleInputChange}
                  placeholder="Describe your current level of study (e.g., 3rd year undergraduate, AP High School, Masters level)"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="learningGoals" className="text-base">
                  Learning Goals
                </Label>
                <Textarea
                  id="learningGoals"
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleInputChange}
                  placeholder="What specific goals do you want to achieve in this session?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="learningStyle" className="text-base">
                  Preferred Learning Style
                </Label>
                <Textarea
                  id="learningStyle"
                  name="learningStyle"
                  value={formData.learningStyle}
                  onChange={handleInputChange}
                  placeholder="How do you learn best? (e.g., visual learning, practice problems, discussions)"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="weaknesses" className="text-base">
                  Areas of Weakness
                </Label>
                <Textarea
                  id="weaknesses"
                  name="weaknesses"
                  value={formData.weaknesses}
                  onChange={handleInputChange}
                  placeholder="What topics or concepts do you find challenging?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="additionalInfo" className="text-base">
                  Additional Information
                </Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Any other information that might help personalize your study session"
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? "Creating Session..." : "Start Study Session"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Delete Study Session
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this study session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setSessionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSession}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-red-500 hover:text-red-600"
            >
              Delete Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}