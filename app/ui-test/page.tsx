/**
 * Temporary UI verification page — safe to delete after validation
 */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UITestPage() {
    return (
        <div className="p-10 space-y-8">
            <h1 className="text-2xl font-bold">UI Verification</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Button</h2>
                <div className="flex gap-4">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Input</h2>
                <Input placeholder="Type something..." className="max-w-xs" />
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Card</h2>
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Card content goes here.</p>
                    </CardContent>
                </Card>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Dialog</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <h3 className="font-bold">Dialog Header</h3>
                        <p>This is a dialog content.</p>
                    </DialogContent>
                </Dialog>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Table</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Head 1</TableHead>
                            <TableHead>Head 2</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell 1</TableCell>
                            <TableCell>Cell 2</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </section>
        </div>
    )
}
