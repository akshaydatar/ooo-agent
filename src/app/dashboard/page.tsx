"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Mail, FileText, AlertCircle, Loader2 } from "lucide-react"
import { useAgentStore } from "@/lib/store"

export default function DashboardPage() {
    const { isOOOActive, isIndexing, setOOOActive, setIsIndexing } = useAgentStore()
    const [stats, setStats] = useState({
        emailsProcessed: 0,
        rulesCount: 0,
        coverageCount: 0,
        escalations: 0,
        pendingItems: 0
    })

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Failed to fetch stats", err))
    }, [])

    const handleOOOToggle = (checked: boolean) => {
        if (checked) {
            setOOOActive(true)
            setIsIndexing(true)
            // Simulate indexing process
            setTimeout(() => {
                setIsIndexing(false)
            }, 15000)
        } else {
            setOOOActive(false)
            setIsIndexing(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage your OOO status and coverage.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">OOO Status:</span>
                    <div className="flex items-center gap-2">
                        {isIndexing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <Switch
                            id="ooo-mode"
                            checked={isOOOActive}
                            onCheckedChange={handleOOOToggle}
                        />
                        <Badge variant={isOOOActive ? "default" : "outline"} className={!isOOOActive ? "text-muted-foreground" : ""}>
                            {isOOOActive ? "Active" : "Inactive"}
                        </Badge>
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
                        <p className="text-xs text-muted-foreground">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rulesCount}</div>
                        <p className="text-xs text-muted-foreground">Response scenarios</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coverage Topics</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.coverageCount}</div>
                        <p className="text-xs text-muted-foreground">Assigned projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingItems}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your agent's recent interactions and responses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                            {isOOOActive ? "Monitoring inbox..." : "No activity yet. Activate OOO mode to start."}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Coverage Health</CardTitle>
                        <CardDescription>
                            Status of your assigned coverage partners.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium">Project Alpha</span>
                                </div>
                                <span className="text-sm text-muted-foreground">Jane Doe</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                    <span className="text-sm font-medium">Team Ops</span>
                                </div>
                                <span className="text-sm text-muted-foreground">John Smith (OOO)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
