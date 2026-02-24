import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    return (
        <div className="flex min-h-screen bg-background text-foreground animate-fade-in">
            <AppSidebar user={session?.user} />
            <main className="flex-1 overflow-y-auto bg-muted/20">
                <div className="container mx-auto p-8 max-w-6xl">
                    <div className="mb-8 relative">
                        <Link href="/dashboard" className="absolute -top-12 left-0">
                            <Button variant="outline" size="sm">
                                ← Back to Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                        <p className="text-muted-foreground mt-2">Manage organization policies and view audit logs.</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
