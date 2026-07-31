import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { downloadAttendanceImportTemplate, useImportAttendance } from '@/services/useAttendance'
import type { AttendanceImportResult } from '@/api/endpoints/attendance'
import { toast } from 'sonner'

export function AttendanceImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [result, setResult] = useState<AttendanceImportResult | null>(null)
    const [importError, setImportError] = useState<string | null>(null)
    const [downloading, setDownloading] = useState(false)
    const { mutate: importFile, isPending } = useImportAttendance()

    const downloadTemplate = async () => {
        setDownloading(true)
        try { await downloadAttendanceImportTemplate(); toast.success('Excel template and bilingual PDF guides downloaded') }
        catch { toast.error('Could not download the template') }
        finally { setDownloading(false) }
    }

    const upload = () => {
        if (!file) return
        setResult(null)
        setImportError(null)
        importFile(file, {
            onSuccess: setResult,
            onError: (error: any) => {
                const data = error.response?.data
                const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : ''
                setImportError(validation || data?.message || data?.error || 'The selected file could not be imported. Please use the standard template from the ZIP package.')
            },
        })
    }

    const badge = (value: string) => value === 'CREATED' ? 'success' : value === 'ERROR' ? 'destructive' : 'outline'

    return (
        <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) { setFile(null); setResult(null); setImportError(null) } }}>
            <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Attendance from Excel</DialogTitle>
                    <DialogDescription>Upload scheduled employee attendance in bulk. Every row is processed independently, so errors never stop valid rows.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-blue-50 p-4">
                        <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 h-6 w-6 text-blue-700" /><div><div className="font-semibold">1. Download the complete ZIP package</div><p className="mt-1 text-sm text-neutral-600">Contains the reusable Excel template, a full English PDF guide, and a full Amharic PDF guide.</p></div></div>
                        <Button type="button" variant="outline" className="mt-4 w-full" onClick={downloadTemplate} disabled={downloading}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download Template + PDF Guides (.zip)</Button>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="font-semibold">2. Select completed file</div>
                        <p className="mt-1 text-sm text-neutral-600">Accepted: XLSX, XLS, or CSV. Maximum 10 MB.</p>
                        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setImportError(null) }} />
                        <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => inputRef.current?.click()}><FileSpreadsheet className="mr-2 h-4 w-4" />{file ? 'Change File' : 'Choose File'}</Button>
                        {file && <div className="mt-2 break-all rounded bg-neutral-50 p-2 text-sm"><b>{file.name}</b><span className="ml-2 text-neutral-500">({(file.size / 1024).toFixed(1)} KB)</span></div>}
                        <Button type="button" className="mt-3 w-full" disabled={!file || isPending} onClick={upload}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{isPending ? 'Processing all rows…' : 'Import Attendance'}</Button>
                    </div>
                </div>

                {importError && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"><div className="font-semibold">Import failed</div><div className="mt-1 text-sm whitespace-pre-wrap">{importError}</div><div className="mt-2 text-xs">Download and use the standard ZIP package if this file has different columns or formatting.</div></div>}

                {result && <div className="space-y-4">
                    <div className={`rounded-lg border p-4 ${result.summary.errors ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
                        <div className="font-semibold">{result.message}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {[['Created', result.summary.created, 'text-green-700'], ['Updated', result.summary.updated, 'text-blue-700'], ['Unchanged', result.summary.unchanged, 'text-neutral-700'], ['Errors', result.summary.errors, 'text-red-700'], ['Empty skipped', result.summary.empty, 'text-neutral-500']].map(([label, count, color]) => <div key={String(label)} className="rounded bg-white p-2 text-center"><div className={`text-xl font-bold ${color}`}>{count}</div><div className="text-xs">{label}</div></div>)}
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-2 font-semibold">Row-by-row processing report</h3>
                        <div className="max-h-[360px] overflow-auto rounded-lg border">
                            <Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Excel Row</TableHead><TableHead>Employee ID</TableHead><TableHead>Result</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                                <TableBody>{result.rows.map((row) => <TableRow key={`${row.row}-${row.employee_code}`} className={row.result === 'ERROR' ? 'bg-red-50' : ''}><TableCell>{row.row}</TableCell><TableCell className="font-medium">{row.employee_code || '—'}</TableCell><TableCell><Badge variant={badge(row.result) as any}>{row.result}</Badge></TableCell><TableCell className={row.result === 'ERROR' ? 'text-red-700' : ''}>{row.message}</TableCell></TableRow>)}</TableBody>
                            </Table>
                        </div>
                    </div>
                </div>}
            </DialogContent>
        </Dialog>
    )
}
