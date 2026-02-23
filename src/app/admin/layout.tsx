import { AppSidebar } from "@/components/app-sidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground animate-fade-in">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/20">
                <div className="container mx-auto p-8 max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                        <p className="text-muted-foreground mt-2">Manage organization policies and view audit logs.</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
