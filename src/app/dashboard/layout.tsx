import { AppSidebar } from "@/components/app-sidebar"

import { auth } from "@/lib/auth"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    return (
        <div className="flex min-h-screen bg-background text-foreground animate-fade-in">
            <AppSidebar user={session?.user} />
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
                <div className="container mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
