import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Shield, Zap } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">P</span>
                        </div>
                        Personal Ninja
                    </div>
                    <Link href="/login">
                        <Button size="sm">Sign in</Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 text-center md:py-32">
                <div className="container flex flex-col items-center space-y-6">
                    <div className="space-y-4 max-w-3xl">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Your Intelligent <br className="hidden sm:inline" />
                            Everyday Assistant
                        </h1>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
                            Stop writing boilerplate emails. <strong className="text-foreground">Personal Ninja</strong> drafts highly contextual replies directly in your inbox, using your own documents and email history.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/login">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container py-12 md:py-24 lg:py-32 border-t">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-muted">
                        <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold">Context-Aware Drafts</h3>
                        <p className="text-muted-foreground">
                            Automatically creates drafts for incoming emails using your internal documentation and email history context.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-muted">
                        <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold">Bring Your Own Key</h3>
                        <p className="text-muted-foreground">
                            Use your own Gemini API key. Your data never trains public models. Enterprise-grade security.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-muted">
                        <CheckCircle2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold">Smart Triage</h3>
                        <p className="text-muted-foreground">
                            Filters out newsletters and spam locally. Only generates drafts for actionable, human-sent emails.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Personal Ninja. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}