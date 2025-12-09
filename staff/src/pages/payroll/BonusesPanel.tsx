import { useState } from "react"
import { useBonuses, useCreateBonus, useDeleteBonus } from "@/services/usePayroll"
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
// import { format } from "date-fns" // Not used currently but good for future

export function BonusesPanel() {
    const { data: bonuses, isLoading } = useBonuses()
    const { mutate: createBonus, isPending: isCreating } = useCreateBonus()
    const { mutate: deleteBonus } = useDeleteBonus()
    const { data: employees } = useEmployees()

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newBonus, setNewBonus] = useState({
        employee_id: '',
        amount: '',
        reason: '',
        bonus_date: new Date().toISOString().split('T')[0],
        type: 'ONE_TIME'
    })

    const handleCreate = () => {
        if (!newBonus.employee_id || !newBonus.amount || !newBonus.reason) return

        createBonus({
            employee_id: parseInt(newBonus.employee_id),
            amount: parseFloat(newBonus.amount),
            reason: newBonus.reason,
            bonus_date: newBonus.bonus_date,
            type: newBonus.type
        }, {
            onSuccess: () => {
                setIsAddOpen(false)
                setNewBonus({ ...newBonus, amount: '', reason: '' })
            }
        })
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Employee Bonuses</h2>
                    <p className="text-gray-500 text-sm">Manage performance bonuses and one-time payments.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bonus
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bonuses</CardTitle>
                    <CardDescription>List of all pending and processed bonuses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bonuses?.data.map((bonus: any) => (
                                <TableRow key={bonus.id}>
                                    <TableCell className="font-medium">
                                        {bonus.employee?.first_name} {bonus.employee?.last_name}
                                    </TableCell>
                                    <TableCell>{bonus.bonus_date}</TableCell>
                                    <TableCell>{bonus.reason}</TableCell>
                                    <TableCell><span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{bonus.type}</span></TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        {formatCurrency(bonus.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${bonus.status === 'PROCESSED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {bonus.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {bonus.status === 'PENDING' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
                                                onClick={() => deleteBonus(bonus.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bonuses?.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No bonuses found.
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
                        <DialogTitle>Add Employee Bonus</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Employee</Label>
                            <Select
                                value={newBonus.employee_id}
                                onValueChange={(val) => setNewBonus({ ...newBonus, employee_id: val })}
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
                                        value={newBonus.amount}
                                        onChange={(e) => setNewBonus({ ...newBonus, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={newBonus.bonus_date}
                                    onChange={(e) => setNewBonus({ ...newBonus, bonus_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select
                                value={newBonus.type}
                                onValueChange={(val) => setNewBonus({ ...newBonus, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONE_TIME">One-Time Bonus</SelectItem>
                                    <SelectItem value="PERFORMANCE">Performance Bonus</SelectItem>
                                    <SelectItem value="HOLIDAY">Holiday Bonus</SelectItem>
                                    <SelectItem value="COMMISSION">Commission</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason / Note</Label>
                            <Input
                                placeholder="e.g. Excellent performance in Q4"
                                value={newBonus.reason}
                                onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Bonus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
