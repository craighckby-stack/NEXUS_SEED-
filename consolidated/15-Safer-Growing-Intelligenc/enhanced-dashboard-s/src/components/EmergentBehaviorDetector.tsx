'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Brain,
  Zap,
  Activity,
  Clock,
  FileText,
  Settings,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'

interface EmergentAlert {
  id: string
  sessionId: string
  alertType: string
  severity: string
  description: string
  baseline?: string
  observed?: string
  resolved: boolean
  createdAt: string
}

const alertTypes = [
  { name: 'Capability Leap', description: 'Sudden increase in performance', icon: Zap, color: 'bg-purple-500' },
  { name: 'Behavioral Anomaly', description: 'Unusual response patterns', icon: Brain, color: 'bg-blue-500' },
  { name: 'Knowledge Jump', description: 'Unexpected knowledge acquisition', icon: Activity, color: 'bg-green-500' },
  { name: 'Safety Threshold', description: 'Safety parameter violation', icon: Shield, color: 'bg-red-500' }
]

const severityLevels = [
  { name: 'Low', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { name: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  { name: 'High', color: 'bg-red-100 text-red-800', icon: XCircle },
  { name: 'Critical', color: 'bg-red-200 text-red-900', icon: XCircle }
]

export default function EmergentBehaviorDetector() {
  const [alerts, setAlerts] = useState<EmergentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [detectorActive, setDetectorActive] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState('all')

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts')
      const data = await response.json()
      setAlerts(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    // This would typically call an API to resolve the alert
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const getSeverityInfo = (severity: string) => {
    return severityLevels.find(level => level.name === severity) || severityLevels[0]
  }

  const getAlertTypeInfo = (alertType: string) => {
    return alertTypes.find(type => type.name === alertType) || alertTypes[0]
  }

  const getAlertStats = () => {
    const total = alerts.length
    const active = alerts.filter(alert => !alert.resolved).length
    const critical = alerts.filter(alert => !alert.resolved && alert.severity === 'Critical').length
    const high = alerts.filter(alert => !alert.resolved && alert.severity === 'High').length

    return { total, active, critical, high }
  }

  const filteredAlerts = selectedSeverity === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === selectedSeverity)

  const stats = getAlertStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Emergent Behavior Detector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading safety monitor...</p>
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
            <Shield className="w-6 h-6" />
            Emergent Behavior Detector
          </h2>
          <p className="text-muted-foreground">Safety monitoring and anomaly detection</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={detectorActive ? "destructive" : "default"}
            onClick={() => setDetectorActive(!detectorActive)}
          >
            {detectorActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Detector
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Detector
              </>
            )}
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Safety Status Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.critical > 0 ? 'Critical' : stats.high > 0 ? 'Warning' : 'Normal'}
            </div>
            <p className="text-xs text-muted-foreground">
              {detectorActive ? 'Detector Active' : 'Detector Paused'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* System Safety Status */}
      <Alert>
        {stats.critical > 0 ? (
          <XCircle className="h-4 w-4" />
        ) : stats.high > 0 ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {stats.critical > 0 ? 'Critical Safety Issues Detected' : 
           stats.high > 0 ? 'Safety Warnings Active' : 
           'All Systems Operational'}
        </AlertTitle>
        <AlertDescription>
          {stats.critical > 0 
            ? `${stats.critical} critical alerts require immediate attention. Review and resolve immediately.`
            : stats.high > 0
            ? `${stats.high} high-priority alerts need review. Monitor system behavior closely.`
            : 'Safety protocols are active and functioning normally. No anomalies detected.'
          }
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>Unresolved anomalies requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredAlerts
                  .filter(alert => !alert.resolved)
                  .slice(0, 10)
                  .map((alert) => {
                    const severityInfo = getSeverityInfo(alert.severity)
                    const typeInfo = getAlertTypeInfo(alert.alertType)
                    const SeverityIcon = severityInfo.icon
                    const TypeIcon = typeInfo.icon

                    return (
                      <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4" />
                            <div>
                              <h4 className="font-medium">{alert.alertType}</h4>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                            </div>
                          </div>
                          <Badge className={severityInfo.color}>
                            <SeverityIcon className="w-3 h-3 mr-1" />
                            {alert.severity}
                          </Badge>
                        </div>
                        
                        {(alert.baseline || alert.observed) && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {alert.baseline && (
                              <div>
                                <span className="text-muted-foreground">Baseline:</span>
                                <p className="font-medium">{alert.baseline}</p>
                              </div>
                            )}
                            {alert.observed && (
                              <div>
                                <span className="text-muted-foreground">Observed:</span>
                                <p className="font-medium">{alert.observed}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Session: {alert.sessionId} • {new Date(alert.createdAt).toLocaleString()}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                
                {filteredAlerts.filter(alert => !alert.resolved).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Clear</h3>
                    <p className="text-muted-foreground">No active alerts detected</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Alert History
            </CardTitle>
            <CardDescription>Recent detections and resolutions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredAlerts
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((alert) => {
                    const severityInfo = getSeverityInfo(alert.severity)
                    const typeInfo = getAlertTypeInfo(alert.alertType)
                    const SeverityIcon = severityInfo.icon
                    const TypeIcon = typeInfo.icon

                    return (
                      <div key={alert.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4" />
                            <div>
                              <p className="font-medium text-sm">{alert.alertType}</p>
                              <p className="text-xs text-muted-foreground">{alert.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.resolved && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <Badge variant="outline" className={severityInfo.color}>
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Alert Type Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Alert Types
            </CardTitle>
            <CardDescription>Distribution of anomaly types detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertTypes.map((type) => {
                const Icon = type.icon
                const typeAlerts = alerts.filter(alert => alert.alertType === type.name)
                const activeCount = typeAlerts.filter(alert => !alert.resolved).length

                return (
                  <div key={type.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{activeCount} active</p>
                      <p className="text-sm text-muted-foreground">{typeAlerts.length} total</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Safety Configuration
            </CardTitle>
            <CardDescription>Detector settings and thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Anomaly Sensitivity</p>
                  <p className="text-sm text-muted-foreground">Detection threshold level</p>
                </div>
                <Badge variant="outline">High</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Monitoring Frequency</p>
                  <p className="text-sm text-muted-foreground">Check interval</p>
                </div>
                <Badge variant="outline">10 seconds</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Resolve Low Priority</p>
                  <p className="text-sm text-muted-foreground">Automatic resolution</p>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Emergency Protocols</p>
                  <p className="text-sm text-muted-foreground">Critical response</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}