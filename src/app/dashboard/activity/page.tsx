import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ActivityLogPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground mt-2">View a log of all automated responses and actions taken by your agent.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A detailed history of agent interactions and responses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p>No activity recorded yet.</p>
                        <p className="text-sm mt-1">Activity will appear here once you activate Personal Ninja.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
