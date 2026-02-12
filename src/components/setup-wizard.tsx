"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Check, ChevronRight, Mail, Calendar, MessageSquare, Loader2 } from "lucide-react"
import { checkMCPConnection } from "@/app/actions/mcp"

export function SetupWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const [connections, setConnections] = useState({
        gmail: false,
        calendar: false,
        slack: false
    })

    const [preferences, setPreferences] = useState({
        autoReply: true,
        indexDrive: true
    })

    const handleConnect = async (service: keyof typeof connections) => {
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
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
                                        <Mail className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Gmail</div>
                                        <div className="text-sm text-muted-foreground">Read & Draft Emails</div>
                                    </div>
                                </div>
                                <Button variant={connections.gmail ? "outline" : "default"} size="sm" onClick={() => handleConnect("gmail")}>
                                    {connections.gmail ? "Connected" : "Connect"}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Calendar</div>
                                        <div className="text-sm text-muted-foreground">Sync OOO Dates</div>
                                    </div>
                                </div>
                                <Button variant={connections.calendar ? "outline" : "default"} size="sm" onClick={() => handleConnect("calendar")}>
                                    {connections.calendar ? "Connected" : "Connect"}
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
