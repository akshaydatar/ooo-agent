import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Activity, Users } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Link href="/admin/policies" className="transition-transform hover:scale-[1.02]">
                    <Card className="h-full border-l-4 border-l-blue-500 hover:border-blue-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Data Policies
                            </CardTitle>
                            <CardDescription>
                                Configure PII redaction rules and external sharing blockers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium text-muted-foreground">2 Active Policies</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/audit" className="transition-transform hover:scale-[1.02]">
                    <Card className="h-full border-l-4 border-l-orange-500 hover:border-orange-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5 text-orange-500" />
                                Audit Logs
                            </CardTitle>
                            <CardDescription>
                                View read-only logs of agent actions, responses, and escalations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium text-muted-foreground">142 Events Today</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="h-full border-l-4 border-l-green-500 opacity-60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-green-500" />
                            Directory
                            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        </CardTitle>
                        <CardDescription>
                            Manage users and coverage map overrides org-wide.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-muted-foreground">42 Provisioned Seats</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
