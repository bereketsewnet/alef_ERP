import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { User, Mail, Phone, Calendar, Briefcase, DollarSign, AlertTriangle } from 'lucide-react'
import { EmployeeJobsPanel } from './EmployeeJobsPanel'
import { EmployeeSalaryHistory } from './EmployeeSalaryHistory'
import { EmployeeAlertsPanel } from './EmployeeAlertsPanel'
import type { Employee } from '@/api/endpoints/employees'

type EmployeeDetailsTab = 'info' | 'jobs' | 'salary' | 'alerts'

interface EmployeeDetailsModalProps {
    open: boolean
    onClose: () => void
    employee: Employee | null
    defaultTab?: EmployeeDetailsTab
}

export function EmployeeDetailsModal({ open, onClose, employee, defaultTab = 'info' }: EmployeeDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<EmployeeDetailsTab>(defaultTab)

    useEffect(() => {
        if (open && defaultTab) {
            setActiveTab(defaultTab)
        }
    }, [open, defaultTab])

    if (!employee) return null

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'probation':
                return 'warning'
            case 'inactive':
            case 'terminated':
                return 'destructive'
            default:
                return 'default'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {employee.first_name} {employee.last_name}
                        <Badge variant={getStatusVariant(employee.status)} className="ml-2">
                            {employee.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as EmployeeDetailsTab)}
                    className="mt-4 flex-1 flex flex-col overflow-hidden"
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="info" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Information
                        </TabsTrigger>
                        <TabsTrigger value="jobs" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Jobs & Pay
                        </TabsTrigger>
                        <TabsTrigger value="salary" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Salary
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Alerts
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <User className="h-4 w-4" />
                                            Employee ID
                                        </div>
                                        <p className="font-mono font-medium">
                                            {employee.employee_id || '-'}
                                        </p>
                                    </div>



                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </div>
                                        <p className="font-medium">{employee.email || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Phone className="h-4 w-4" />
                                            Phone
                                        </div>
                                        <p className="font-medium">{employee.phone_number}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Calendar className="h-4 w-4" />
                                            Hire Date
                                        </div>
                                        <p className="font-medium">
                                            {new Date(employee.hire_date).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <User className="h-4 w-4" />
                                            Status
                                        </div>
                                        <Badge variant={getStatusVariant(employee.status)}>
                                            {employee.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="jobs" className="mt-4 overflow-y-auto flex-1 min-h-0">
                        <EmployeeJobsPanel
                            employeeId={employee.id}
                            employeeName={`${employee.first_name} ${employee.last_name}`}
                        />
                    </TabsContent>

                    <TabsContent value="salary" className="mt-4 overflow-y-auto flex-1 min-h-0">
                        <EmployeeSalaryHistory employeeId={employee.id} />
                    </TabsContent>

                    <TabsContent value="alerts" className="mt-4 overflow-y-auto flex-1 min-h-0">
                        <EmployeeAlertsPanel employeeId={employee.id} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
