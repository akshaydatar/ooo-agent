import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ActivityLogPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>View a log of all automated responses and actions taken by your agent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <p>No activity recorded yet.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
