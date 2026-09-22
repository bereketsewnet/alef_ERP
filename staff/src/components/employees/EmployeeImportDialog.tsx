import { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJobCategories } from '@/services/useJobs'
import { downloadEmployeeImportBundle, useImportEmployees } from '@/services/useEmployees'
import type { EmployeeImportResult } from '@/api/endpoints/employees'
import { toast } from '@/components/ui/use-toast'

export function EmployeeImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [categoryId, setCategoryId] = useState('none')
    const [calendar, setCalendar] = useState<'EC' | 'GC'>('EC')
    const [result, setResult] = useState<EmployeeImportResult | null>(null)
    const [importError, setImportError] = useState<string | null>(null)
    const [downloading, setDownloading] = useState(false)
    const { data: categories = [] } = useJobCategories(true)
    const { mutate: importEmployees, isPending } = useImportEmployees()

    useEffect(() => {
        if (!open || categoryId !== 'none') return
        const driver = categories.find((category) => category.name.trim().toLowerCase() === 'driver')
        if (driver) setCategoryId(String(driver.id))
    }, [open, categories, categoryId])

    const close = (value: boolean) => {
        onOpenChange(value)
        if (!value) {
            setFile(null)
            setResult(null)
            setImportError(null)
            setCalendar('EC')
            setCategoryId('none')
        }
    }

    const downloadPackage = async () => {
        setDownloading(true)
        try {
            await downloadEmployeeImportBundle()
            toast({ title: 'Download ready', description: 'Excel template and English/Amharic PDF guides downloaded.' })
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Download failed', description: error?.message || 'Could not download the employee import package.' })
        } finally {
            setDownloading(false)
        }
    }

    const upload = () => {
        if (!file) return
        setResult(null)
        setImportError(null)
        importEmployees({
            file,
            defaultCategoryId: categoryId === 'none' ? null : Number(categoryId),
            defaultCalendar: calendar,
        }, {
            onSuccess: setResult,
            onError: (error: any) => {
                const validation = error?.errors ? Object.values(error.errors).flat().join(' ') : ''
                setImportError(validation || error?.message || error?.error || 'The file could not be imported. Use the standard package and try again.')
            },
        })
    }

    const badgeVariant = (value: string) => value === 'CREATED' ? 'success' : value === 'ERROR' ? 'destructive' : value === 'UPDATED' ? 'default' : 'outline'

    const displayValue = (value: unknown) => value === null || value === undefined || value === '' ? 'None' : String(value)

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="w-[96vw] max-w-6xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Employees from Excel or CSV</DialogTitle>
                    <DialogDescription>Create or safely update employees in bulk with Ethiopian/Gregorian dates, exact row validation, and a result for every row.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-accent/40 bg-accent/10 p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary p-2 text-primary-foreground"><FileSpreadsheet className="h-6 w-6" /></div>
                            <div><div className="font-semibold text-primary">1. Download the reusable package</div><p className="mt-1 text-sm text-muted-foreground">Includes the branded Excel template plus complete English and Amharic PDF instructions.</p></div>
                        </div>
                        <Button type="button" variant="outline" className="mt-4 w-full border-primary text-primary" onClick={downloadPackage} disabled={downloading}>
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download Template + PDF Guides (.zip)
                        </Button>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                        <div className="font-semibold text-primary">2. Choose defaults and upload</div>
                        <p className="mt-1 text-sm text-muted-foreground">Blank category/calendar cells use these selections. A value inside the file overrides the default.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div><label className="mb-1 block text-sm font-medium">Default employee category</label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None / Unassigned</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><label className="mb-1 block text-sm font-medium">Dates in this file</label><Select value={calendar} onValueChange={(value) => setCalendar(value as 'EC' | 'GC')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EC">Ethiopian Calendar (EC)</SelectItem><SelectItem value="GC">Gregorian Calendar (GC)</SelectItem></SelectContent></Select></div>
                        </div>
                        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setImportError(null) }} />
                        <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => inputRef.current?.click()}><FileSpreadsheet className="mr-2 h-4 w-4" />{file ? 'Change File' : 'Choose Excel or CSV File'}</Button>
                        {file && <div className="mt-2 break-all rounded-lg border bg-background p-2 text-sm"><b>{file.name}</b><span className="ml-2 text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span></div>}
                        <Button type="button" className="mt-3 w-full" disabled={!file || isPending} onClick={upload}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{isPending ? 'Processing every employee…' : 'Import Employees'}</Button>
                    </div>
                </div>

                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"><b className="text-foreground">Required:</b> first name (or combined Name) and phone. For updates, include Employee ID for the safest match; otherwise normalized phone is used. Identical rows remain unchanged, changed supplied fields are updated, and invalid rows never block valid rows.</div>
                {importError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive"><div className="font-semibold">Import failed</div><div className="mt-1 whitespace-pre-wrap text-sm">{importError}</div></div>}

                {result && <div className="space-y-4">
                    <div className={`rounded-lg border p-4 ${result.summary.errors ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'}`}>
                        <div className="font-semibold">{result.message}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {[['Created', result.summary.created, 'text-emerald-700'], ['Updated', result.summary.updated, 'text-primary'], ['Unchanged', result.summary.unchanged, 'text-slate-600'], ['Errors', result.summary.errors, 'text-red-700'], ['Empty skipped', result.summary.empty, 'text-muted-foreground']].map(([label, count, color]) => <div key={String(label)} className="rounded bg-white p-2 text-center"><div className={`text-xl font-bold ${color}`}>{count}</div><div className="text-xs">{label}</div></div>)}
                        </div>
                    </div>
                    <div><h3 className="mb-2 font-semibold">Row-by-row import report</h3><div className="max-h-[420px] overflow-auto rounded-lg border"><Table><TableHeader className="sticky top-0 z-10 bg-background"><TableRow><TableHead>Excel Row</TableHead><TableHead>Employee</TableHead><TableHead>Phone</TableHead><TableHead>Employee ID</TableHead><TableHead>Result</TableHead><TableHead>Error Column</TableHead><TableHead className="min-w-[320px]">Details / Changes</TableHead></TableRow></TableHeader><TableBody>{result.rows.map((row) => <TableRow key={`${row.row}-${row.phone_number}`} className={row.result === 'ERROR' ? 'bg-red-50' : row.result === 'UPDATED' ? 'bg-primary/5' : ''}><TableCell>{row.row}</TableCell><TableCell className="font-medium">{row.name || '—'}</TableCell><TableCell>{row.phone_number || '—'}</TableCell><TableCell>{row.employee_code || '—'}</TableCell><TableCell><Badge variant={badgeVariant(row.result) as any}>{row.result}</Badge></TableCell><TableCell className={row.result === 'ERROR' ? 'font-medium text-red-700' : ''}>{row.column || '—'}</TableCell><TableCell className={row.result === 'ERROR' ? 'text-red-700' : ''}><div>{row.message}</div>{row.result === 'ERROR' && row.value !== undefined && row.value !== null && <div className="mt-1 text-xs">Invalid value: <code className="rounded bg-red-100 px-1">{displayValue(row.value)}</code></div>}{row.changes && row.changes.length > 0 && <div className="mt-2 space-y-1">{row.changes.map((change) => <div key={change.column} className="rounded border bg-background px-2 py-1 text-xs"><b>{change.column}</b>: <span className="text-muted-foreground">{displayValue(change.old)}</span> → <span className="font-medium text-primary">{displayValue(change.new)}</span></div>)}</div>}</TableCell></TableRow>)}</TableBody></Table></div></div>
                </div>}
            </DialogContent>
        </Dialog>
    )
}
