import { useState } from "react"
import { usePenalties, useCreatePenalty, useDeletePenalty } from "@/services/usePayroll"
import { useEmployees } from "@/services/useEmployees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Loader2, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function PenaltiesPanel() {
    const { data: penalties, isLoading } = usePenalties()
    const { mutate: createPenalty, isPending: isCreating } = useCreatePenalty()
    const { mutate: deletePenalty } = useDeletePenalty()
    const { data: employees } = useEmployees()

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newPenalty, setNewPenalty] = useState({
        employee_id: '',
        amount: '',
        reason: '',
        penalty_date: new Date().toISOString().split('T')[0],
        penalty_type: 'LATE'
    })

    const handleCreate = () => {
        if (!newPenalty.employee_id || !newPenalty.amount || !newPenalty.reason) return

        createPenalty({
            employee_id: parseInt(newPenalty.employee_id),
            amount: parseFloat(newPenalty.amount),
            reason: newPenalty.reason,
            penalty_date: newPenalty.penalty_date,
            penalty_type: newPenalty.penalty_type
        }, {
            onSuccess: () => {
                setIsAddOpen(false)
                setNewPenalty({ ...newPenalty, amount: '', reason: '' })
            }
        })
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Employee Penalties</h2>
                    <p className="text-gray-500 text-sm">Manage disciplinary penalties and deductions.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} variant="destructive">
                    <Plus className="mr-2 h-4 w-4" /> Add Penalty
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Penalties</CardTitle>
                    <CardDescription>List of all pending and applied penalties.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {penalties?.data.map((penalty: any) => (
                                <TableRow key={penalty.id}>
                                    <TableCell className="font-medium">
                                        {penalty.employee?.first_name} {penalty.employee?.last_name}
                                    </TableCell>
                                    <TableCell>{penalty.penalty_date}</TableCell>
                                    <TableCell><span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{penalty.penalty_type}</span></TableCell>
                                    <TableCell>{penalty.reason}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        -{formatCurrency(penalty.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${penalty.status === 'APPLIED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {penalty.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {penalty.status === 'PENDING' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
                                                onClick={() => deletePenalty(penalty.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {penalties?.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No penalties found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Penalty</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Employee</Label>
                            <Select
                                value={newPenalty.employee_id}
                                onValueChange={(val) => setNewPenalty({ ...newPenalty, employee_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees?.data?.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.first_name} {emp.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Amount</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        className="pl-8"
                                        placeholder="0.00"
                                        value={newPenalty.amount}
                                        onChange={(e) => setNewPenalty({ ...newPenalty, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={newPenalty.penalty_date}
                                    onChange={(e) => setNewPenalty({ ...newPenalty, penalty_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select
                                value={newPenalty.penalty_type}
                                onValueChange={(val) => setNewPenalty({ ...newPenalty, penalty_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LATE">Late Arrival</SelectItem>
                                    <SelectItem value="ABSENCE">Unauthorized Absence</SelectItem>
                                    <SelectItem value="MISCONDUCT">Misconduct</SelectItem>
                                    <SelectItem value="DAMAGE">Asset Damage</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason / Note</Label>
                            <Input
                                placeholder="Details..."
                                value={newPenalty.reason}
                                onChange={(e) => setNewPenalty({ ...newPenalty, reason: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating} variant="destructive">
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Penalty
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
