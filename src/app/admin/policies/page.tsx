"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ShieldAlert, Plus, ShieldCheck } from "lucide-react"

export default function PoliciesPage() {
    // Mock state for MVP
    const [policies, setPolicies] = useState([
        { id: '1', name: 'PII Auto-Redaction', active: true, description: 'Automatically redacts Phone Numbers and SSNs from context before sending to LLM.' },
        { id: '2', name: 'Block External Domains', active: false, description: 'Prevents the OOO Agent from sending automated replies to non-whitelisted external domains.' }
    ])

    const togglePolicy = (id: string) => {
        setPolicies(policies.map(p => p.id === id ? { ...p, active: !p.active } : p))
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Data Policies</h2>
                    <p className="text-muted-foreground mt-1">Configure compliance rules and AI guardrails.</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Policy
                </Button>
            </div>

            <div className="grid gap-4">
                {policies.map(policy => (
                    <Card key={policy.id} className={policy.active ? "border-blue-200 bg-blue-50/10" : "opacity-80"}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${policy.active ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                    {policy.active ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {policy.name}
                                        {policy.active && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Enforced</Badge>}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-sm">{policy.description}</p>
                                </div>
                            </div>
                            <Switch
                                checked={policy.active}
                                onCheckedChange={() => togglePolicy(policy.id)}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
