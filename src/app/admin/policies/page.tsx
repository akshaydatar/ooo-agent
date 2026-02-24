"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ShieldAlert, Plus, ShieldCheck } from "lucide-react"
import { getPolicies, togglePolicy } from "@/app/actions/policies"

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPolicies()
    }, [])

    const loadPolicies = async () => {
        try {
            const data = await getPolicies()
            setPolicies(data)
        } catch (e) {
            console.error("Failed to load policies", e)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (id: string, currentActive: boolean) => {
        // Optimistic update
        setPolicies(policies.map(p => {
            if (p.id === id) {
                const rules = JSON.parse(p.rules);
                rules.active = !currentActive;
                return { ...p, rules: JSON.stringify(rules) };
            }
            return p;
        }))

        try {
            await togglePolicy(id, !currentActive)
        } catch (e) {
            console.error("Failed to toggle policy", e)
            loadPolicies() // Revert on failure
        }
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
                {loading ? <p className="text-muted-foreground p-4">Loading policies...</p> : policies.map(policy => {
                    const parsedRules = JSON.parse(policy.rules);
                    const isActive = parsedRules.active;

                    return (
                        <Card key={policy.id} className={isActive ? "border-blue-200 bg-blue-50/10" : "opacity-80"}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                        {isActive ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            {policy.name}
                                            {isActive && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Enforced</Badge>}
                                        </h3>
                                        <p className="text-muted-foreground mt-1 text-sm">{parsedRules.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={() => handleToggle(policy.id, isActive)}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    )
}
