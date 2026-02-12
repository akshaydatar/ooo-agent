"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAgentStore } from "@/lib/store"
import { POLICIES, RULES_DESCRIPTION } from "@/lib/policies"

export default function SettingsPage() {
    const {
        metaPolicyAllowContext,
        userAllowContext,
        setMetaPolicyAllowContext,
        setUserAllowContext
    } = useAgentStore()

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your agent's configuration and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="notifications">Enable Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive daily summaries of agent activity.</p>
                        </div>
                        <Switch id="notifications" />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-reply">Auto-Reply active globally</Label>
                            <p className="text-sm text-muted-foreground">Agent will respond to all incoming emails when OOO is active.</p>
                        </div>
                        <Switch id="auto-reply" defaultChecked />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Context & Privacy Policies</CardTitle>
                    <CardDescription>Configure how much context the agent can share.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Rule 1: Indexing Scope */}
                    <div className="flex items-center justify-between space-x-2 border-b pb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Indexing Scope</Label>
                            <p className="text-sm text-muted-foreground">{RULES_DESCRIPTION.INDEXING_SCOPE}</p>
                        </div>
                        <Badge variant="secondary">Fixed Policy: {POLICIES.MAX_INDEXING_MONTHS} Months</Badge>
                    </div>

                    {/* Rule 3: Meta Policy (Admin) */}
                    <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="admin-policy" className="font-bold">Org Admin Policy: Allow Context Summaries</Label>
                                    <Badge variant="outline">Simulation</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    If disabled, no user can enable context summaries in responses.
                                </p>
                            </div>
                            <Switch
                                id="admin-policy"
                                checked={metaPolicyAllowContext}
                                onCheckedChange={setMetaPolicyAllowContext}
                            />
                        </div>
                    </div>

                    {/* Rule 3/4: User Preference */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="user-context">Include Context Summaries</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow the agent to summarize email/doc context in responses to trusted contacts.
                            </p>
                            {!metaPolicyAllowContext && (
                                <p className="text-xs text-red-500 font-medium">
                                    Disabled by Organization Policy
                                </p>
                            )}
                        </div>
                        <Switch
                            id="user-context"
                            checked={userAllowContext}
                            onCheckedChange={setUserAllowContext}
                            disabled={!metaPolicyAllowContext}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
