"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { deleteRule } from "@/app/actions/rules"

export function RulesList({ rules }: { rules: any[] }) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Active Rules</h3>
            {rules.length === 0 && (
                <p className="text-sm text-muted-foreground">No rules defined yet.</p>
            )}
            {rules.map((rule) => {
                const condition = JSON.parse(rule.condition)
                const action = JSON.parse(rule.action)

                return (
                    <Card key={rule.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{rule.name}</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteRule(rule.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                {condition.type} contains "{condition.value}"
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Instructs: {action.value}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
