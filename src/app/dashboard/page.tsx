"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, Mail, FileText, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAgentStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
    const { isOOOActive, isIndexing, setOOOActive, setIsIndexing } = useAgentStore()
    const [stats, setStats] = useState({
        emailsProcessed: 0,
        rulesCount: 0,
        coverageCount: 0,
        escalations: 0,
        pendingItems: 0
    })

    const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false)
    const [managerName, setManagerName] = useState("")
    const [managerEmail, setManagerEmail] = useState("")
    const [activities, setActivities] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/activity')
            .then(res => res.json())
            .then(data => setActivities(data || []))
            .catch(err => console.error("Failed to fetch activities", err))
    }, [])

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data)
                if (data.managerName) setManagerName(data.managerName)
                if (data.managerEmail) setManagerEmail(data.managerEmail)
            })
            .catch(err => console.error("Failed to fetch stats", err))
    }, [])

    const handleOOOToggle = async (checked: boolean) => {
        await performToggle(checked)
    }

    const performToggle = async (checked: boolean) => {
        setOOOActive(checked)
        setIsIndexing(checked)

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentEnabled: checked,
                    managerName,
                    managerEmail
                })
            });

            if (checked) {
                // Simulate frontend indexing state for UX
                setTimeout(() => {
                    setIsIndexing(false)
                }, 5000)
            }
        } catch (e) {
            console.error("Toggle failed", e)
            setOOOActive(!checked) // Revert on failure
            setIsIndexing(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage your Personal Ninja assistant.</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex items-center gap-4 sm:border-l sm:pl-6">
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-2">
                            {isIndexing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            <Switch
                                id="ninja-mode"
                                checked={isOOOActive}
                                onCheckedChange={handleOOOToggle}
                                disabled={isIndexing}
                            />
                            <Badge variant={isOOOActive ? "default" : "outline"} className={!isOOOActive ? "text-muted-foreground" : ""}>
                                {isOOOActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.emailsProcessed}</div>
                        <p className="text-xs text-muted-foreground">Total drafts created</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rulesCount}</div>
                        <p className="text-xs text-muted-foreground">Custom responses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coverage Topics</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.coverageCount}</div>
                        <p className="text-xs text-muted-foreground">Mapped responsibilities</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Drafts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.pendingItems}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        {isOOOActive ? "Monitoring inbox for new drafts..." : "No activity yet. Activate Personal Ninja to start."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                            <Mail className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">No recent activity</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                Emails processed by your assistant will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
                            {activities.map((log: any) => {
                                const isEscalation = log.action === 'ESCALATED' || log.action === 'POLICY_BLOCKED';
                                const meta = log.metadata ? JSON.parse(log.metadata) : {};

                                return (
                                    <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">
                                                {log.action === 'EMAIL_RESPONDED' && "Draft Created"}
                                                {log.action === 'DRAFT_CREATED' && "Draft Created"}
                                                {log.action === 'ESCALATED' && "Escalated"}
                                                {log.action === 'POLICY_BLOCKED' && "Blocked"}
                                                : {meta.subject || "No Subject"}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                {meta.target && <span>To: {meta.target}</span>}
                                                {meta.reason && <span className="text-destructive font-medium">• {meta.reason}</span>}
                                                {meta.contextUsed > 0 && (
                                                    <span className="flex items-center text-primary">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        {meta.contextUsed} docs used
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Coverage Fallback</DialogTitle>
                        <DialogDescription>
                            Please set a manager or default contact in case we need to route urgent items that aren't mapped.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="manager-name">Name</Label>
                            <Input
                                id="manager-name"
                                value={managerName}
                                onChange={(e) => setManagerName(e.target.value)}
                                placeholder="e.g. Jane Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manager-email">Email</Label>
                            <Input
                                id="manager-email"
                                type="email"
                                value={managerEmail}
                                onChange={(e) => setManagerEmail(e.target.value)}
                                placeholder="jane@company.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManagerDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            setIsManagerDialogOpen(false)
                            performToggle(true)
                        }}>Save & Activate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}