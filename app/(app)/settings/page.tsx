"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  listOvertimeRules,
  createOvertimeRule,
  updateOvertimeRule,
  type OvertimeRule,
  type CreateOvertimeRuleData,
} from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Settings, Pencil, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const initialFormData: CreateOvertimeRuleData = {
  name: "",
  scope: "daily",
  threshold_hours: 8,
  multiplier: 1.5,
  department: "",
  role: "",
  is_active: true,
}

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const [rules, setRules] = useState<OvertimeRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingRule, setEditingRule] = useState<OvertimeRule | null>(null)
  const [formData, setFormData] = useState<CreateOvertimeRuleData>(initialFormData)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await listOvertimeRules()
        setRules(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rules")
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [])

  const openAddDialog = () => {
    setEditingRule(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const openEditDialog = (rule: OvertimeRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      scope: rule.scope,
      threshold_hours: rule.threshold_hours,
      multiplier: rule.multiplier,
      department: rule.department || "",
      role: rule.role || "",
      is_active: rule.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingRule) {
        const updated = await updateOvertimeRule(editingRule.id, formData)
        setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast({ title: "Rule updated", description: `${updated.name} has been updated.` })
      } else {
        const created = await createOvertimeRule(formData)
        setRules((prev) => [...prev, created])
        toast({ title: "Rule created", description: `${created.name} has been created.` })
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast({
        title: editingRule ? "Update failed" : "Creation failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Settings className="h-12 w-12" />
        <p>You don&apos;t have permission to view this page.</p>
      </div>
    )
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage overtime rules and configurations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Edit Overtime Rule" : "Add Overtime Rule"}</DialogTitle>
                <DialogDescription>Configure the overtime calculation rule.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard Daily OT"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope</Label>
                    <Select
                      value={formData.scope}
                      onValueChange={(value: "daily" | "weekly") => setFormData({ ...formData, scope: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold_hours">Threshold Hours</Label>
                    <Input
                      id="threshold_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.threshold_hours}
                      onChange={(e) => setFormData({ ...formData, threshold_hours: Number.parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: Number.parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department (optional)</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="All departments"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="role">Role (optional)</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="All roles"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingRule ? "Update Rule" : "Add Rule"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overtime Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.scope}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{rule.threshold_hours}h</TableCell>
                        <TableCell className="text-right">{rule.multiplier}x</TableCell>
                        <TableCell>{rule.department || "All"}</TableCell>
                        <TableCell>{rule.role || "All"}</TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No overtime rules configured</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  )
}
