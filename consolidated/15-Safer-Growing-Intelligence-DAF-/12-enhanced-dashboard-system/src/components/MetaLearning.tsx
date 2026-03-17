'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Zap,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Award,
  BookOpen,
  Lightbulb,
  RefreshCw
} from 'lucide-react'

interface LearningStrategy {
  id: string
  strategy: string
  effectiveness: number
  usageCount: number
  lastUsed: string
  createdAt: string
}

const strategyTypes = [
  {
    name: 'Analogical Reasoning',
    description: 'Drawing parallels between similar concepts',
    icon: Brain,
    color: 'bg-blue-500'
  },
  {
    name: 'Cross-Domain Synthesis',
    description: 'Combining knowledge from different domains',
    icon: Zap,
    color: 'bg-purple-500'
  },
  {
    name: 'Pattern Recognition',
    description: 'Identifying recurring patterns and structures',
    icon: Target,
    color: 'bg-green-500'
  },
  {
    name: 'Metaphorical Thinking',
    description: 'Using metaphors to understand abstract concepts',
    icon: Lightbulb,
    color: 'bg-yellow-500'
  },
  {
    name: 'Sequential Learning',
    description: 'Building knowledge step by step',
    icon: BookOpen,
    color: 'bg-red-500'
  },
  {
    name: 'Experimental Approach',
    description: 'Learning through trial and error',
    icon: Activity,
    color: 'bg-indigo-500'
  }
]

export default function MetaLearning() {
  const [strategies, setStrategies] = useState<LearningStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')

  useEffect(() => {
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/learning')
      const data = await response.json()
      setStrategies(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching strategies:', error)
      setLoading(false)
    }
  }

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.8) return 'text-green-600'
    if (effectiveness >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEffectivenessBadge = (effectiveness: number) => {
    if (effectiveness >= 0.8) return 'bg-green-100 text-green-800'
    if (effectiveness >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getOverallStats = () => {
    if (strategies.length === 0) return { avgEffectiveness: 0, totalUsage: 0, topStrategy: 'N/A' }
    
    const totalUsage = strategies.reduce((sum, s) => sum + s.usageCount, 0)
    const avgEffectiveness = strategies.reduce((sum, s) => sum + s.effectiveness, 0) / strategies.length
    const topStrategy = strategies.reduce((max, s) => s.effectiveness > max.effectiveness ? s : max).strategy
    
    return { avgEffectiveness, totalUsage, topStrategy }
  }

  const stats = getOverallStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Meta Learning Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading analytics...</p>
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
            <TrendingUp className="w-6 h-6" />
            Meta Learning Analytics
          </h2>
          <p className="text-muted-foreground">Learning strategy effectiveness and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgEffectiveness * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all strategies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">Strategy applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Strategy</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.topStrategy}</div>
            <p className="text-xs text-muted-foreground">Most effective</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategies.length}</div>
            <p className="text-xs text-muted-foreground">In use</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Strategy Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Strategy Performance
            </CardTitle>
            <CardDescription>Effectiveness and usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{strategy.strategy}</h4>
                      <Badge className={getEffectivenessBadge(strategy.effectiveness)}>
                        {(strategy.effectiveness * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Effectiveness</span>
                        <span className={getEffectivenessColor(strategy.effectiveness)}>
                          {(strategy.effectiveness * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={strategy.effectiveness * 100} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Usage Count:</span>
                        <p className="font-medium">{strategy.usageCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <p className="font-medium">
                          {new Date(strategy.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Strategy Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Strategy Categories
            </CardTitle>
            <CardDescription>Learning approach classifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {strategyTypes.map((type) => {
                  const Icon = type.icon
                  const strategyData = strategies.find(s => s.strategy.includes(type.name))
                  const effectiveness = strategyData?.effectiveness || 0
                  const usage = strategyData?.usageCount || 0
                  
                  return (
                    <div key={type.name} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      
                      {strategyData ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance</span>
                            <span className={getEffectivenessColor(effectiveness)}>
                              {(effectiveness * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={effectiveness * 100} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>Usage</span>
                            <span>{usage} times</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground">Not yet used</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Learning Insights
          </CardTitle>
          <CardDescription>AI-generated recommendations and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Top Performing Strategies</h4>
              <div className="space-y-3">
                {strategies
                  .sort((a, b) => b.effectiveness - a.effectiveness)
                  .slice(0, 3)
                  .map((strategy, index) => (
                    <div key={strategy.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{strategy.strategy}</p>
                        <p className="text-sm text-muted-foreground">
                          {(strategy.effectiveness * 100).toFixed(1)}% effective • {strategy.usageCount} uses
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Recommendations</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Focus on Analogical Reasoning</p>
                  <p className="text-sm text-blue-600">
                    This strategy shows highest effectiveness in complex problem solving
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Increase Cross-Domain Usage</p>
                  <p className="text-sm text-green-600">
                    Combining knowledge domains improves overall learning retention
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Review Sequential Learning</p>
                  <p className="text-sm text-yellow-600">
                    Consider optimizing this strategy for better effectiveness
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest strategy applications and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategies
              .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
              .slice(0, 5)
              .map((strategy) => (
                <div key={strategy.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {strategy.strategy} strategy applied
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(strategy.lastUsed).toLocaleString()} • {(strategy.effectiveness * 100).toFixed(1)}% effective
                    </p>
                  </div>
                  <Badge variant="outline">
                    {strategy.usageCount} uses
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}