import { signInWithGoogle } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-sm space-y-8 rounded-lg border bg-white p-8 shadow-sm dark:bg-gray-900 dark:border-gray-800 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sign in to activate your Coverage Ninja.
                    </p>
                </div>

                <form action={signInWithGoogle} className="mt-8">
                    <Button type="submit" className="w-full" size="lg" variant="default">
                        <Chrome className="mr-2 h-5 w-5" />
                        Sign in with Google
                    </Button>
                </form>
            </div>
        </div>
    );
}
