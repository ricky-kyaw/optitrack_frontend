"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { clockIn, clockOut, listSessions, getUserSummary, type WorkSession, type UserSummary } from "@/lib/api"
import { LogIn, LogOut, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AttendancePage() {
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [userSummary, sessionList] = await Promise.all([getUserSummary(), listSessions({ employee: "me" })])
      setSummary(userSummary)
      setSessions(sessionList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClockIn = async () => {
    setActionLoading(true)
    try {
      await clockIn()
      toast({ title: "Clocked in successfully", description: "Your work session has started." })
      await fetchData()
    } catch (err) {
      toast({
        title: "Clock in failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    setActionLoading(true)
    try {
      await clockOut()
      toast({ title: "Clocked out successfully", description: "Your work session has ended." })
      await fetchData()
    } catch (err) {
      toast({
        title: "Clock out failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error}</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Clock in and out to track your work hours</p>
        </div>

        {/* Clock In/Out Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Clock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-20 w-48 text-lg"
                onClick={handleClockIn}
                disabled={actionLoading || summary?.is_clocked_in}
              >
                {actionLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <LogIn className="mr-2 h-6 w-6" />}
                Clock In
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 w-48 text-lg bg-transparent"
                onClick={handleClockOut}
                disabled={actionLoading || !summary?.is_clocked_in}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-6 w-6" />
                )}
                Clock Out
              </Button>
            </div>
            {summary?.is_clocked_in && summary.current_session_start && (
              <p className="text-center text-sm text-muted-foreground">
                You&apos;ve been clocked in since{" "}
                {new Date(summary.current_session_start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{new Date(session.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {new Date(session.clock_in).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {session.clock_out
                          ? new Date(session.clock_out).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>{session.duration_hours.toFixed(1)}h</TableCell>
                      <TableCell>
                        <Badge variant={session.source === "web" ? "default" : "secondary"}>{session.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No work sessions recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  )
}
