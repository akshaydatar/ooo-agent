"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, Mail, FileText, AlertCircle, Loader2, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { useAgentStore } from "@/lib/store"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

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
    const [date, setDate] = useState<DateRange | undefined>(undefined)
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
                if (data.oooStartDate && data.oooEndDate) {
                    setDate({ from: new Date(data.oooStartDate), to: new Date(data.oooEndDate) })
                }
            })
            .catch(err => console.error("Failed to fetch stats", err))
    }, [])

    const handleOOOToggle = async (checked: boolean) => {
        if (checked && (!date?.from || !date?.to)) {
            toast.warning("Please select your OOO start and end dates first.");
            return;
        }
        if (checked && (!managerName || !managerEmail)) {
            setIsManagerDialogOpen(true)
            return // Require manager config before activating
        }
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
                    managerEmail,
                    oooStartDate: date?.from,
                    oooEndDate: date?.to
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
                    <p className="text-muted-foreground mt-2">Manage your OOO status and coverage.</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="grid gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[260px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick your OOO dates</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-4 sm:border-l sm:pl-6">
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
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
            </div>

            <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Action Required: Fallback Manager</DialogTitle>
                        <DialogDescription>Please provide a manager's name and email. The Agent will route urgent emails to them if it cannot determine the correct coverage person.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="managerName">Manager Name</Label>
                            <Input id="managerName" value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="managerEmail">Manager Email</Label>
                            <Input id="managerEmail" type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} placeholder="john@company.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={async () => {
                                setIsManagerDialogOpen(false)
                                await performToggle(true)
                            }}
                            disabled={!managerName || !managerEmail}
                        >
                            Save & Activate OOO
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.emailsProcessed}</div>
                        <p className="text-xs text-muted-foreground">Total processed</p>
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
                        {activities.length === 0 ? (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                {isOOOActive ? "Monitoring inbox..." : "No activity yet. Activate OOO mode to start."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((act) => (
                                    <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none text-sm">{act.subject}</p>
                                            <p className="text-muted-foreground text-xs">{act.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                                {new Date(act.createdAt).toLocaleDateString()}
                                            </span>
                                            <Badge variant={act.status === 'resolved' ? 'default' : act.status === 'escalated' ? 'destructive' : 'secondary'}>
                                                {act.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        {stats.coverageCount > 0 ? (
                            <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
                                View your full coverage map in the Coverage Map page.
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
                                No coverage topics configured yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
