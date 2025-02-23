"use client"

import { Button } from "@/components/ui/button"
import { GraduationCap, MessageSquareText, Globe, Mic } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error("Error fetching user:", error)
          return
        }
        
        setUser(user)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      
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
      
      setUser(null)
      router.refresh()
      
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full transform rotate-45" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-100 rounded-lg transform rotate-12" />
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-blue-50 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-blue-100 rounded-lg transform -rotate-12" />
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-50 rounded-full" />
        <div className="absolute top-1/2 left-20 w-16 h-16 bg-blue-100 rounded-lg" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">StudyAssist</span>
          </div>
          {loading ? (
            <div className="text-blue-600">Loading...</div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user.email}</span>
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-600 hover:bg-blue-100"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/auth/sign-in">
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-100">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
        <div className="text-center space-y-8 bg-white/50 backdrop-blur-sm p-12 rounded-2xl shadow-lg max-w-3xl">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            StudyAssist
          </h1>
          <div className="space-y-4">
            <p className="text-2xl text-blue-800 font-medium">
              Your AI study assistant
            </p>
            <p className="text-lg text-blue-600/80">
              Transform your learning experience with personalized AI-powered study sessions
            </p>
            <div className="flex justify-center gap-8 py-6">
              <div className="flex flex-col items-center gap-2">
                <MessageSquareText className="h-8 w-8 text-blue-500" />
                <p className="text-sm text-blue-600">Instant Help</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Globe className="h-8 w-8 text-blue-500" />
                <p className="text-sm text-blue-600">Web Access</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Mic className="h-8 w-8 text-blue-500" />
                <p className="text-sm text-blue-600">Voice Mode</p>
              </div>
            </div>
          </div>
          <Link href={user ? "/dashboard" : "/auth/sign-in"}>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {user ? "Go to Dashboard" : "Start a Study Session"}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}