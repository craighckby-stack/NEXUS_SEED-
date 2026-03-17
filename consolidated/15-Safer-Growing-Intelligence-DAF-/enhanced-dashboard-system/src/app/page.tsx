'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  Activity, 
  Shield, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  Database,
  Eye,
  Settings
} from 'lucide-react'
import MemorySystem from '@/components/MemorySystem'
import AGIStatus from '@/components/AGIStatus'
import VirtualEnvironment from '@/components/VirtualEnvironment'
import MetaLearning from '@/components/MetaLearning'
import EmergentBehaviorDetector from '@/components/EmergentBehaviorDetector'

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10">
                <img
                  src="/logo.svg"
                  alt="DAF Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Safer Growing Intelligence</h1>
                <p className="text-sm text-muted-foreground">Developmental AGI Framework</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={true ? "default" : "secondary"} className="bg-green-500">
                <Activity className="w-3 h-3 mr-1" />
                System Active
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Concepts</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">+12% from last session</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Apprentice</div>
                  <p className="text-xs text-muted-foreground">Development Stage 3/5</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">Above baseline</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">All systems normal</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest AGI system events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Memory consolidation completed</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New concept learned: Causal Reasoning</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Environment test: Ethics - Advanced</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Development Progress</CardTitle>
                  <CardDescription>AGI developmental milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Caveman</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Child</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Apprentice</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Scholar</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Elder</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-6">
            <MemorySystem />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <AGIStatus />
          </TabsContent>

          <TabsContent value="environment" className="space-y-6">
            <VirtualEnvironment />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <MetaLearning />
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <EmergentBehaviorDetector />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}