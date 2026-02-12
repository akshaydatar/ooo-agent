import { getRules, deleteRule } from "@/app/actions/rules"
import { RuleEditor } from "@/components/rules/rule-editor"
import { RulesList } from "@/components/rules/rules-list"

export default async function RulesPage() {
    const rules = await getRules()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Response Rules</h1>
                <p className="text-muted-foreground">
                    Define custom behavior for specific senders or topics.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <RuleEditor onSaved={async () => {
                        "use server"
                        // Client refetch handled by router refresh or server action return
                    }} />
                </div>
                <div>
                    <RulesList rules={rules} />
                </div>
            </div>
        </div>
    )
}
