"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLiveData, getUserSummary, type LiveData, type UserSummary } from "@/lib/api"
import { Users, Clock, Timer, ArrowRight, CheckCircle2, XCircle } from "lucide-react"

export default function DashboardPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [live, userSummary] = await Promise.all([getLiveData(), getUserSummary()])
        setLiveData(live)
        setSummary(userSummary)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your time tracking metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently Clocked In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{liveData?.currently_clocked_in ?? 0}</div>
            <p className="text-xs text-muted-foreground">employees working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.today_hours?.toFixed(1) ?? "0.0"}h</div>
            <p className="text-xs text-muted-foreground">hours worked today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Week&apos;s Overtime</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.week_overtime_hours?.toFixed(1) ?? "0.0"}h</div>
            <p className="text-xs text-muted-foreground">overtime this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {summary?.is_clocked_in ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium text-foreground">Clocked In</p>
                    <p className="text-sm text-muted-foreground">
                      Since{" "}
                      {summary.current_session_start
                        ? new Date(summary.current_session_start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Not Clocked In</p>
                    <p className="text-sm text-muted-foreground">Clock in to start tracking</p>
                  </div>
                </>
              )}
            </div>
            <Button asChild className="w-full">
              <Link href="/attendance">
                Go to Attendance
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Work Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.recent_sessions?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recent_sessions.slice(0, 5).map((session) => (
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
                      <TableCell className="text-right">{session.duration_hours.toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
