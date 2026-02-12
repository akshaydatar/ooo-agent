import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 text-center md:py-32">
                <div className="container flex flex-col items-center space-y-6">
                    <div className="space-y-4 max-w-3xl">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Your Intelligent <br className="hidden sm:inline" />
                            OOO Assistant
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 leading-relaxed">
                            Don't just auto-reply. <strong>Solve</strong> incoming requests while you're away with
                            context-aware AI that reads your docs, drafts replies, and routes to the right people.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/setup">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container py-12 md:py-24 lg:py-32 border-t">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <Zap className="h-10 w-10 text-blue-600" />
                        <h3 className="text-xl font-bold">Smart Responses</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Generates draft replies using your internal documentation and email history context.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <Shield className="h-10 w-10 text-blue-600" />
                        <h3 className="text-xl font-bold">Secure & Private</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Redacts PII automatically. Your data never trains public models. Enterprise-grade security.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <CheckCircle2 className="h-10 w-10 text-blue-600" />
                        <h3 className="text-xl font-bold">Intelligent Routing</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Identifies the right coverage person for every topic, ensuring no heavy lifting falls on one person.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
