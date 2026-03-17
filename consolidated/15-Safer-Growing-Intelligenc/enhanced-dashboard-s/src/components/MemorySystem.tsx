'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  Plus, 
  Search, 
  Filter,
  Zap,
  Network,
  Lightbulb,
  BookOpen,
  Users,
  Heart
} from 'lucide-react'

interface Memory {
  id: string
  concept: string
  confidence: number
  relationships?: string
  category: string
  createdAt: string
}

const categoryIcons: Record<string, any> = {
  'Ethics': Heart,
  'Logic': Brain,
  'Social': Users,
  'Physics': Zap,
  'General': Lightbulb
}

const categoryColors: Record<string, string> = {
  'Ethics': 'bg-red-100 text-red-800',
  'Logic': 'bg-blue-100 text-blue-800',
  'Social': 'bg-green-100 text-green-800',
  'Physics': 'bg-purple-100 text-purple-800',
  'General': 'bg-gray-100 text-gray-800'
}

export default function MemorySystem() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemories()
  }, [])

  useEffect(() => {
    filterMemories()
  }, [memories, searchTerm, selectedCategory])

  const fetchMemories = async () => {
    try {
      const response = await fetch('/api/memory')
      const data = await response.json()
      setMemories(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching memories:', error)
      setLoading(false)
    }
  }

  const filterMemories = () => {
    let filtered = memories

    if (searchTerm) {
      filtered = filtered.filter(memory =>
        memory.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.relationships?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memory => memory.category === selectedCategory)
    }

    setFilteredMemories(filtered)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const categories = ['all', ...Array.from(new Set(memories.map(m => m.category)))]

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Memory System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading memory system...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Memory System
          </h2>
          <p className="text-muted-foreground">Knowledge graph and memory consolidation</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Concepts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{memories.length}</div>
            <p className="text-sm text-muted-foreground">Stored in memory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {memories.length > 0 
                ? (memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-sm text-muted-foreground">Overall confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories.length - 1}</div>
            <p className="text-sm text-muted-foreground">Knowledge domains</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Memory Graph
            </CardTitle>
            <CardDescription>Visual representation of knowledge connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Network className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Interactive Graph</h3>
                <p className="text-muted-foreground">Knowledge graph visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Memory Details
            </CardTitle>
            <CardDescription>Individual memory concepts and relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredMemories.slice(0, 10).map((memory) => {
                  const Icon = categoryIcons[memory.category] || Lightbulb
                  return (
                    <div key={memory.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <h4 className="font-medium">{memory.concept}</h4>
                        </div>
                        <Badge className={categoryColors[memory.category]}>
                          {memory.category}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getConfidenceColor(memory.confidence)}`}
                              style={{ width: `${memory.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{(memory.confidence * 100).toFixed(0)}%</span>
                        </div>
                        
                        {memory.relationships && (
                          <div>
                            <span className="text-sm text-muted-foreground">Relationships:</span>
                            <p className="text-sm mt-1">{memory.relationships}</p>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(memory.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}