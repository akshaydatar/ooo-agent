"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Plus, Info } from "lucide-react"
import { toast } from "sonner"
import { useAgentStore } from "@/lib/store"

interface CoverageItem {
    id: string;
    topic: string;
    contactId: string;
    contactEmail?: string;
    // userId is not needed for display mostly
}

export default function CoveragePage() {
    const { isIndexing } = useAgentStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [coverageItems, setCoverageItems] = useState<CoverageItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state
    const [newTopic, setNewTopic] = useState("")
    const [newContact, setNewContact] = useState("")
    const [newContactEmail, setNewContactEmail] = useState("")

    useEffect(() => {
        fetchCoverage()
    }, [])

    const fetchCoverage = async () => {
        try {
            const res = await fetch('/api/coverage')
            if (res.ok) {
                const data = await res.json()
                setCoverageItems(data)
            }
        } catch (error) {
            console.error("Failed to fetch coverage", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/coverage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: newTopic, contactId: newContact, contactEmail: newContactEmail })
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setNewTopic("")
                setNewContact("")
                setNewContactEmail("")
                fetchCoverage()
            } else {
                const err = await res.json();
                console.error("API failed:", err);
                toast.error("Failed to save coverage topic. Please try again.");
            }
        } catch (error) {
            console.error("Failed to create coverage", error)
            toast.error("Network error. Please check your connection and try again.");
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/coverage/${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchCoverage()
            }
        } catch (error) {
            console.error("Failed to delete coverage", error)
        }
    }

    const filteredItems = coverageItems.filter(item =>
        item.topic.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {isIndexing && (
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Indexing in progress...</AlertTitle>
                    <AlertDescription className="text-primary/80">
                        Analyzing your emails and documents. The coverage map will be auto-populated shortly.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coverage Map</h1>
                    <p className="text-muted-foreground mt-2">
                        Assign coverage for your projects and responsibilities.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Topic
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Coverage Topic</DialogTitle>
                            <DialogDescription>Define a topic and assign a coverage person.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="topic" className="text-right">Topic</Label>
                                <Input id="topic" value={newTopic} onChange={e => setNewTopic(e.target.value)} className="col-span-3" placeholder="Project X" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="contact" className="text-right">Contact Name</Label>
                                <Input id="contact" value={newContact} onChange={e => setNewContact(e.target.value)} className="col-span-3" placeholder="Jane Doe" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="contactEmail" className="text-right">Contact Email</Label>
                                <Input id="contactEmail" type="email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} className="col-span-3" placeholder="jane@example.com" />
                            </div>
                            {(!newTopic || !newContact) && (
                                <p className="text-sm text-red-500 text-right mt-2">Topic and Contact Name are required.</p>
                            )}
                            {(newContactEmail.length > 0 && !newContactEmail.includes('@')) && (
                                <p className="text-sm text-red-500 text-right mt-2">Please enter a valid email address.</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleCreate}
                                disabled={!newTopic || !newContact || (newContactEmail.length > 0 && !newContactEmail.includes('@'))}
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search topics..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Suggested Topics based on recent emails</h3>
                <div className="flex flex-wrap gap-2">
                    {["Project Alpha Delivery", "Q3 Marketing Campaign", "Server Migration"].map(suggestion => (
                        <Badge
                            key={suggestion}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => {
                                setNewTopic(suggestion);
                                setIsDialogOpen(true);
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Topic / Project</TableHead>
                            <TableHead>Coverage Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No topics found. Add one to get started.</TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.topic}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback>{item.contactId[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{item.contactId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.contactEmail || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Active</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
