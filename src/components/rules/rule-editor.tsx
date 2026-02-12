"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createRule } from "@/app/actions/rules" // We will create this next
import { Loader2 } from "lucide-react"

export function RuleEditor({ onSaved }: { onSaved: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [conditionType, setConditionType] = useState("sender")
    const [conditionValue, setConditionValue] = useState("")
    const [instructions, setInstructions] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await createRule({
                name,
                condition: { type: conditionType as any, value: conditionValue },
                action: { type: 'instructions', value: instructions }
            })
            onSaved()
            // Reset form
            setName("")
            setConditionValue("")
            setInstructions("")
        } catch (error) {
            console.error("Failed to create rule", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground">
            <h3 className="font-semibold">Create New Rule</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                        placeholder="e.g. VIP Auto-Response"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Condition Type</Label>
                    <Select value={conditionType} onValueChange={setConditionType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sender">Sender Email Contains</SelectItem>
                            <SelectItem value="subject">Subject Contains</SelectItem>
                            <SelectItem value="keyword">Body Keyword</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Condition Value</Label>
                <Input
                    placeholder={conditionType === 'sender' ? '@client.com' : 'Urgent'}
                    value={conditionValue}
                    onChange={e => setConditionValue(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                    placeholder="Instructions for the AI, e.g. 'Draft a very formal response and cc the manager'"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    required
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Rule
            </Button>
        </form>
    )
}
