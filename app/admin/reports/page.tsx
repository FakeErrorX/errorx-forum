"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@iconify/react'

interface Report {
  id: string
  reportId: number
  contentType: string
  contentId: string
  reason: string
  description?: string
  status: string
  createdAt: string
  reporter: {
    userId: number
    username: string
    name: string
  }
  resolver?: {
    userId: number
    username: string
    name: string
  }
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadReports = async (status: string = 'pending') => {
    try {
      const response = await fetch(`/api/reports?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      })
      
      if (response.ok) {
        await loadReports('pending')
        setSelectedReport(null)
        setResolution('')
      }
    } catch (error) {
      console.error('Error resolving report:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const reportDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - reportDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadReports()
    }
  }, [session])

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Content Reports</h1>
          <p className="text-muted-foreground">Review and moderate reported content</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" onClick={() => loadReports('pending')}>
              Pending ({reports.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="resolved" onClick={() => loadReports('resolved')}>
              Resolved ({reports.filter(r => r.status === 'resolved').length})
            </TabsTrigger>
            <TabsTrigger value="dismissed" onClick={() => loadReports('dismissed')}>
              Dismissed ({reports.filter(r => r.status === 'dismissed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
              </div>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.contentType}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            #{report.reportId}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold mb-2">Reason: {report.reason}</h3>
                        
                        {report.description && (
                          <p className="text-muted-foreground mb-3">{report.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Reported by: {report.reporter.username}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(report.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Icon icon="lucide:eye" className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Report Details</AlertDialogTitle>
                              <AlertDialogDescription>
                                <div className="space-y-3">
                                  <div>
                                    <strong>Content Type:</strong> {report.contentType}
                                  </div>
                                  <div>
                                    <strong>Content ID:</strong> {report.contentId}
                                  </div>
                                  <div>
                                    <strong>Reason:</strong> {report.reason}
                                  </div>
                                  {report.description && (
                                    <div>
                                      <strong>Description:</strong> {report.description}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Reported by:</strong> {report.reporter.username}
                                  </div>
                                  <div>
                                    <strong>Reported at:</strong> {new Date(report.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        {report.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm">
                                <Icon icon="lucide:check" className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Resolve Report</AlertDialogTitle>
                                <AlertDialogDescription>
                                  How would you like to resolve this report?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Resolution notes (optional)"
                                  value={resolution}
                                  onChange={(e) => setResolution(e.target.value)}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => resolveReport(report.id, 'dismissed')}
                                  disabled={actionLoading}
                                >
                                  Dismiss
                                </AlertDialogAction>
                                <AlertDialogAction
                                  onClick={() => resolveReport(report.id, 'resolved')}
                                  disabled={actionLoading}
                                >
                                  Resolve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:flag" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No pending reports</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {reports.filter(r => r.status === 'resolved').length > 0 ? (
              reports.filter(r => r.status === 'resolved').map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.contentType}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold mb-2">Reason: {report.reason}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Reported by: {report.reporter.username}</span>
                          <span>•</span>
                          <span>Resolved by: {report.resolver?.username}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:check-circle" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No resolved reports</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dismissed" className="space-y-4">
            {reports.filter(r => r.status === 'dismissed').length > 0 ? (
              reports.filter(r => r.status === 'dismissed').map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.contentType}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold mb-2">Reason: {report.reason}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Reported by: {report.reporter.username}</span>
                          <span>•</span>
                          <span>Dismissed by: {report.resolver?.username}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:x-circle" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No dismissed reports</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
