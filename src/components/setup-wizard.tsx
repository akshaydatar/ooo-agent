"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Check, ChevronRight, Mail, Calendar, MessageSquare, Loader2, HardDrive } from "lucide-react"
import { checkMCPConnection } from "@/app/actions/mcp"

export function SetupWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const [connections, setConnections] = useState<{
        googleWorkspace: boolean
        slack: boolean
        [key: string]: boolean
    }>({
        googleWorkspace: false,
        slack: false
    })

    const [preferences, setPreferences] = useState({
        autoReply: true,
        indexDrive: true,
        managerName: "",
        managerEmail: "",
        coveragePlanLink: ""
    })

    const handleConnect = async (service: 'google_workspace' | 'slack' | 'gmail' | 'calendar' | 'drive') => {
        setIsLoading(true)

        try {
            const result = await checkMCPConnection(service)
            if (result.success) {
                setConnections(prev => ({ ...prev, [service]: !prev[service] }))
            } else {
                // Handle error (toast, etc.)
                console.error(result.message)
            }
        } catch (e) {
            console.error("Failed to connect", e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleNext = () => {
        if (step < 3) {
            if (step === 2) {
                if (!preferences.managerName || !preferences.managerEmail) {
                    alert("Please provide manager details for fallback safety.");
                    return;
                }
            }
            setStep(step + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = () => {
        setIsLoading(true)
        // Simulate saving settings
        setTimeout(() => {
            // Set local storage flag
            localStorage.setItem("ooo-setup", "true")
            router.push("/dashboard")
        }, 1000)
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Steps Indicator */}
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
              ${step >= i ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-muted"}`}>
                            {step > i ? <Check className="h-4 w-4" /> : i}
                        </div>
                        <span className="text-xs mt-2 text-muted-foreground">
                            {i === 1 ? "Connect" : i === 2 ? "Preferences" : "Finish"}
                        </span>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Connect Your Workspace"}
                        {step === 2 && "Configure Agent"}
                        {step === 3 && "All Set!"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Link your accounts to let the agent learn your context."}
                        {step === 2 && "Set default behaviors for your OOO period."}
                        {step === 3 && "Your agent is ready to be activated."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-md z-30 ring-2 ring-background">
                                            <Mail className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md z-20 ring-2 ring-background">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md z-10 ring-2 ring-background">
                                            <HardDrive className="h-5 w-5 text-yellow-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Google Workspace</div>
                                        <div className="text-sm text-muted-foreground">Mail, Calendar, & Drive</div>
                                    </div>
                                </div>
                                <Button
                                    variant={connections.googleWorkspace ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => handleConnect("google_workspace")}
                                >
                                    {connections.googleWorkspace ? "Connected" : "Connect"}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-md">
                                        <MessageSquare className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Slack</div>
                                        <div className="text-sm text-muted-foreground">Notifications</div>
                                    </div>
                                </div>
                                <Button variant={connections.slack ? "outline" : "default"} size="sm" onClick={() => handleConnect("slack")}>
                                    {connections.slack ? "Connected" : "Connect"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Draft Replies</Label>
                                    <div className="text-sm text-muted-foreground">Draft responses for incoming emails automatically</div>
                                </div>
                                <Switch
                                    checked={preferences.autoReply}
                                    onCheckedChange={(c) => setPreferences(p => ({ ...p, autoReply: c }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Index Google Drive</Label>
                                    <div className="text-sm text-muted-foreground">Allow agent to search docs for RAG context</div>
                                </div>
                                <Switch
                                    checked={preferences.indexDrive}
                                    onCheckedChange={(c) => setPreferences(p => ({ ...p, indexDrive: c }))}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium">Fallback & Safety</h4>
                                <div className="grid gap-2">
                                    <Label htmlFor="managerName">Manager Name *</Label>
                                    <input
                                        id="managerName"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Jane Doe"
                                        value={preferences.managerName}
                                        onChange={(e) => setPreferences(p => ({ ...p, managerName: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="managerEmail">Manager Email *</Label>
                                    <input
                                        id="managerEmail"
                                        type="email"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="jane@company.com"
                                        value={preferences.managerEmail}
                                        onChange={(e) => setPreferences(p => ({ ...p, managerEmail: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="coveragePlan">Coverage Plan Link (Optional)</Label>
                                    <input
                                        id="coveragePlan"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="https://docs.google.com/..."
                                        value={preferences.coveragePlanLink}
                                        onChange={(e) => setPreferences(p => ({ ...p, coveragePlanLink: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Setup Complete</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                You can now access your dashboard to configure OOO dates and detailed rules.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1 || isLoading}>
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 3 ? "Go to Dashboard" : "Next"}
                        {step < 3 && !isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
