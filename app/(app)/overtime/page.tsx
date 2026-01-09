"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { listOvertimeEntries, recalculateOvertime, type OvertimeEntry } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Calculator, Lock, Unlock, Loader2, Timer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function OvertimePage() {
  const { isAdmin } = useAuth()
  const [entries, setEntries] = useState<OvertimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAllEmployees, setShowAllEmployees] = useState(false)
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true)
      try {
        const data = await listOvertimeEntries({
          all_employees: isAdmin && showAllEmployees,
        })
        setEntries(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load overtime entries")
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, [isAdmin, showAllEmployees])

  const handleRecalculate = async () => {
    if (!periodStart || !periodEnd) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return
    }
    setRecalcLoading(true)
    try {
      await recalculateOvertime({ period_start: periodStart, period_end: periodEnd })
      toast({ title: "Recalculation complete", description: "Overtime entries have been recalculated." })
      const data = await listOvertimeEntries({ all_employees: showAllEmployees })
      setEntries(data)
    } catch (err) {
      toast({
        title: "Recalculation failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setRecalcLoading(false)
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
          <h1 className="text-2xl font-bold text-foreground">Overtime</h1>
          <p className="text-muted-foreground">View and manage overtime entries</p>
        </div>

        {/* Admin Recalculation Section */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Recalculate Overtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Period Start</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Period End</Label>
                  <Input id="period_end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRecalculate} disabled={recalcLoading} className="w-full sm:w-auto">
                    {recalcLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Recalculate
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="show-all" checked={showAllEmployees} onCheckedChange={setShowAllEmployees} />
                <Label htmlFor="show-all">Show all employees</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overtime Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Overtime Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdmin && showAllEmployees && <TableHead>Employee</TableHead>}
                      <TableHead>Period Start</TableHead>
                      <TableHead>Period End</TableHead>
                      <TableHead className="text-right">Regular Hours</TableHead>
                      <TableHead className="text-right">Overtime Hours</TableHead>
                      <TableHead className="text-right">Overtime Amount</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        {isAdmin && showAllEmployees && <TableCell>{entry.employee_name}</TableCell>}
                        <TableCell>{new Date(entry.period_start).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(entry.period_end).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{entry.hours_regular.toFixed(1)}h</TableCell>
                        <TableCell className="text-right font-medium">{entry.hours_overtime.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">${entry.overtime_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.rule_name}</Badge>
                        </TableCell>
                        <TableCell>
                          {entry.is_locked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Unlock className="h-4 w-4 text-success" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No overtime entries found</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  )
}
