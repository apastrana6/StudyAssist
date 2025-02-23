"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"

export default function NewSession() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    studyLevel: "",
    learningGoals: "",
    learningStyle: "",
    weaknesses: "",
    additionalInfo: "",
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, studyLevel: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast.error("Please provide a description of what you're studying for")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("Not authenticated")

      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
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

      toast.success("Study session created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create study session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-blue-600">
                Start a New Study Session
              </h1>
              <p className="text-gray-500">
                Fill in the details below to create a personalized study session
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
                  <Select
                    value={formData.studyLevel}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your study level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={loading}
              >
                {loading ? "Creating Session..." : "Start Study Session"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}