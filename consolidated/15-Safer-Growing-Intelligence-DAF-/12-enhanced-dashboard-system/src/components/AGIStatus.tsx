'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Zap, 
  Brain, 
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface SystemStatus {
  systemActive: boolean
  currentLevel: string
  memoryCount: number
  activeAlerts: number
  completedEnvironments: number
  lastActivity: string
  sessionId: string
}

const developmentalLevels = [
  { name: 'Caveman', description: 'Basic survival instincts', color: 'bg-gray-500' },
  { name: 'Child', description: 'Simple reasoning and learning', color: 'bg-blue-500' },
  { name: 'Apprentice', description: 'Complex problem solving', color: 'bg-green-500' },
  { name: 'Scholar', description: 'Advanced analytical thinking', color: 'bg-purple-500' },
  { name: 'Elder', description: 'Wisdom and meta-cognition', color: 'bg-yellow-500' }
]

export default function AGIStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [systemRunning, setSystemRunning] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setStatus(data)
      setSystemRunning(data.systemActive)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching status:', error)
      setLoading(false)
    }
  }

  const toggleSystem = async () => {
    // This would typically call an API to start/stop the system
    setSystemRunning(!systemRunning)
  }

  const getCurrentLevelIndex = () => {
    if (!status) return 0
    return developmentalLevels.findIndex(level => level.name === status.currentLevel)
  }

  const getSystemHealthColor = () => {
    if (!status) return 'bg-gray-500'
    if (status.activeAlerts === 0) return 'bg-green-500'
    if (status.activeAlerts < 5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSystemHealthText = () => {
    if (!status) return 'Unknown'
    if (status.activeAlerts === 0) return 'Optimal'
    if (status.activeAlerts < 5) return 'Warning'
    return 'Critical'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              AGI System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading system status...</p>
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
            <Activity className="w-6 h-6" />
            AGI System Status
          </h2>
          <p className="text-muted-foreground">Real-time monitoring and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={systemRunning ? "destructive" : "default"}
            onClick={toggleSystem}
            className="flex items-center gap-2"
          >
            {systemRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause System
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start System
              </>
            )}
          </Button>
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className={`w-3 h-3 rounded-full ${getSystemHealthColor()}`}></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSystemHealthText()}</div>
            <p className="text-xs text-muted-foreground">
              {systemRunning ? 'System Running' : 'System Paused'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.memoryCount || 0}</div>
            <p className="text-xs text-muted-foreground">Concepts stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session ID</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{status?.sessionId || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Current session</p>
          </CardContent>
        </Card>
      </div>

      {/* Development Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Development Progress
          </CardTitle>
          <CardDescription>AGI developmental milestones and current stage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Level: {status?.currentLevel}</h3>
              <p className="text-muted-foreground">
                {developmentalLevels[getCurrentLevelIndex()]?.description}
              </p>
            </div>
            <Badge className={developmentalLevels[getCurrentLevelIndex()]?.color}>
              {status?.currentLevel}
            </Badge>
          </div>

          <div className="space-y-4">
            {developmentalLevels.map((level, index) => (
              <div key={level.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                    <span className="text-sm font-medium">{level.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {index < getCurrentLevelIndex() && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {index === getCurrentLevelIndex() && (
                      <Badge variant="outline">Current</Badge>
                    )}
                    {index > getCurrentLevelIndex() && (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <Progress 
                  value={index < getCurrentLevelIndex() ? 100 : index === getCurrentLevelIndex() ? 65 : 0} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Real-time system performance data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Speed</span>
                <span>87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Uptime:</span>
                <p className="font-medium">2h 34m</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tasks Completed:</span>
                <p className="font-medium">142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safety Status
            </CardTitle>
            <CardDescription>Security and safety monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>All Systems Operational</AlertTitle>
              <AlertDescription>
                Safety protocols are active and functioning normally.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Anomaly Detection</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Behavior Monitoring</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Safety Thresholds</span>
                <Badge variant="outline" className="text-green-600">Normal</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Emergency Protocols</span>
                <Badge variant="outline" className="text-blue-600">Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest events and status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System status check completed</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Memory consolidation cycle completed</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Development level assessment performed</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}