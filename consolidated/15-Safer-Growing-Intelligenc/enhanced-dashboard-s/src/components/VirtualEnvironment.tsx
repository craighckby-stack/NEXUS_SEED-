'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Star,
  Target,
  Brain,
  Heart,
  Users,
  Zap,
  Trophy,
  RefreshCw
} from 'lucide-react'

interface Environment {
  id: string
  domain: string
  level: string
  completed: boolean
  score?: number
  sessionId?: string
  createdAt: string
}

const domains = [
  { name: 'Ethics', icon: Heart, color: 'bg-red-500', description: 'Moral reasoning and ethical frameworks' },
  { name: 'Logic', icon: Brain, color: 'bg-blue-500', description: 'Logical reasoning and critical thinking' },
  { name: 'Social', icon: Users, color: 'bg-green-500', description: 'Social interaction and communication' },
  { name: 'Physics', icon: Zap, color: 'bg-purple-500', description: 'Understanding physical laws and causality' }
]

const levels = ['Basic', 'Intermediate', 'Advanced', 'Expert']

export default function VirtualEnvironment() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnvironments()
  }, [])

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/environment')
      const data = await response.json()
      setEnvironments(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching environments:', error)
      setLoading(false)
    }
  }

  const startEnvironment = async (domain: string, level: string) => {
    try {
      const response = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, level })
      })
      const newEnvironment = await response.json()
      setEnvironments([newEnvironment, ...environments])
    } catch (error) {
      console.error('Error starting environment:', error)
    }
  }

  const getDomainStats = (domain: string) => {
    const domainEnvs = environments.filter(env => env.domain === domain)
    const completed = domainEnvs.filter(env => env.completed).length
    const avgScore = domainEnvs
      .filter(env => env.score !== undefined)
      .reduce((sum, env) => sum + (env.score || 0), 0) / 
      domainEnvs.filter(env => env.score !== undefined).length || 0

    return {
      total: domainEnvs.length,
      completed,
      avgScore: avgScore || 0
    }
  }

  const filteredEnvironments = environments.filter(env => {
    const domainMatch = selectedDomain === 'all' || env.domain === selectedDomain
    const levelMatch = selectedLevel === 'all' || env.level === selectedLevel
    return domainMatch && levelMatch
  })

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-500'
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Virtual Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading curriculum...</p>
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
            <BookOpen className="w-6 h-6" />
            Virtual Environment
          </h2>
          <p className="text-muted-foreground">Structured curriculum and testing environment</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Domain Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {domains.map((domain) => {
          const Icon = domain.icon
          const stats = getDomainStats(domain.name)
          const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

          return (
            <Card key={domain.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{domain.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
                <p className="text-xs text-muted-foreground mb-2">Completed</p>
                <Progress value={progress} className="h-2 mb-2" />
                {stats.avgScore > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs">{stats.avgScore.toFixed(1)}% avg</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domains.map(domain => (
              <SelectItem key={domain.name} value={domain.name}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map(level => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Environments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Available Environments
            </CardTitle>
            <CardDescription>Start new training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {domains.map((domain) => {
                  const Icon = domain.icon
                  return (
                    <div key={domain.name} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <h4 className="font-medium">{domain.name}</h4>
                        <Badge variant="outline" className={domain.color}>
                          {getDomainStats(domain.name).completed} completed
                        </Badge>
                      </div>
                      
                      <div className="grid gap-2">
                        {levels.map((level) => {
                          const isCompleted = environments.some(
                            env => env.domain === domain.name && 
                                   env.level === level && 
                                   env.completed
                          )
                          
                          return (
                            <div 
                              key={level} 
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">{level}</span>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant={isCompleted ? "outline" : "default"}
                                disabled={isCompleted}
                                onClick={() => startEnvironment(domain.name, level)}
                              >
                                {isCompleted ? 'Completed' : 'Start'}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                      
                      <Separator />
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Session History
            </CardTitle>
            <CardDescription>Recent training sessions and results</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredEnvironments.slice(0, 10).map((environment) => {
                  const domain = domains.find(d => d.name === environment.domain)
                  const Icon = domain?.icon || BookOpen
                  
                  return (
                    <div key={environment.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div>
                            <h4 className="font-medium">{environment.domain}</h4>
                            <p className="text-sm text-muted-foreground">{environment.level}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {environment.completed ? (
                            <>
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                              {environment.score && (
                                <Badge variant="outline" className={getScoreColor(environment.score)}>
                                  {environment.score}%
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {environment.score && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Score</span>
                            <span>{environment.score}%</span>
                          </div>
                          <Progress value={environment.score} className="h-2" />
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(environment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Complete curriculum overview and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Domain Progress</h4>
              {domains.map((domain) => {
                const stats = getDomainStats(domain.name)
                const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
                
                return (
                  <div key={domain.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{domain.name}</span>
                      <span>{stats.completed}/{stats.total}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Level Distribution</h4>
              {levels.map((level) => {
                const levelEnvs = environments.filter(env => env.level === level)
                const completed = levelEnvs.filter(env => env.completed).length
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{level}</span>
                      <span>{completed}/{levelEnvs.length}</span>
                    </div>
                    <Progress 
                      value={levelEnvs.length > 0 ? (completed / levelEnvs.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}