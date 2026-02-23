"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Activity, Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Using mock logs for UI MVP
    useEffect(() => {
        setTimeout(() => {
            setLogs([
                { id: 'log1', action: 'EMAIL_RESPONDED', user: 'akshay@example.com', target: 'client@external.com', time: '10 mins ago', status: 'success' },
                { id: 'log2', action: 'PII_REDACTED', user: 'SYSTEM', target: 'Context Engine', time: '15 mins ago', status: 'info' },
                { id: 'log3', action: 'AGENT_ENABLED', user: 'akshay@example.com', target: 'Self', time: '1 hour ago', status: 'success' },
                { id: 'log4', action: 'ESCALATION_Triggered', user: 'SYSTEM', target: 'manager@example.com', time: '2 hours ago', status: 'warning' },
            ])
            setLoading(false)
        }, 500)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-orange-600 flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Audit Logs
                    </h2>
                    <p className="text-muted-foreground mt-1">Immutable, read-only record of all agent activity.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search logs..." className="pl-9 w-64" />
                    </div>
                    <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                </div>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Loading logs...</TableCell></TableRow>
                        ) : (
                            logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'warning' ? 'destructive' : 'secondary'}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{log.user}</TableCell>
                                    <TableCell>{log.target}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{log.time}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
