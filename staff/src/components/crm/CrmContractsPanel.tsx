import { useEffect, useMemo, useState } from "react";
import {
  crmApi,
  type CrmContract,
  type CrmIssue,
  type CrmServiceCategory,
} from "@/api/endpoints/crm";
import { clientsApi, type Client } from "@/api/endpoints/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Archive,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Users,
  Building2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const emptyContract = {
  client_id: "",
  site_id: "",
  title: "",
  reference_number: "",
  start_date: "",
  end_date: "",
  contract_amount: "",
  payment_frequency: "MONTHLY",
  payment_due_day: "",
  expiry_reminder_days: "30",
  reminder_email: "",
  agreement_summary: "",
  payment_terms: "",
  category_ids: [] as number[],
};

export function CrmContractsPanel() {
  const [clients, setClients] = useState<Client[]>([]),
    [categories, setCategories] = useState<CrmServiceCategory[]>([]),
    [contracts, setContracts] = useState<CrmContract[]>([]),
    [issues, setIssues] = useState<CrmIssue[]>([]);
  const [stats, setStats] = useState<any>({}),
    [archived, setArchived] = useState(false),
    [categoryFilter, setCategoryFilter] = useState(""),
    [loading, setLoading] = useState(true);
  const [contractOpen, setContractOpen] = useState(false),
    [issueOpen, setIssueOpen] = useState(false),
    [categoryOpen, setCategoryOpen] = useState(false),
    [editing, setEditing] = useState<CrmContract | null>(null);
  const [form, setForm] = useState(emptyContract),
    [files, setFiles] = useState<
      { name: string; file?: File; previewUrl?: string }[]
    >([]),
    [uploadError, setUploadError] = useState(""),
    [issue, setIssue] = useState({
      client_id: "",
      site_id: "",
      contract_id: "",
      subject: "",
      description: "",
      priority: "MEDIUM",
    }),
    [categoryName, setCategoryName] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const [cl, ca, co, st, is] = await Promise.all([
        clientsApi.list({ per_page: 100 }),
        crmApi.categories(),
        crmApi.listContracts({
          archived: archived ? 1 : 0,
          category_id: categoryFilter || undefined,
          per_page: 100,
        }),
        crmApi.dashboard(),
        crmApi.listIssues(),
      ]);
      setClients(cl.data);
      setCategories(ca);
      setContracts(co.data);
      setStats(st);
      setIssues(is.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [archived, categoryFilter]);
  const sites = useMemo(
    () => clients.find((c) => String(c.id) === form.client_id)?.sites || [],
    [clients, form.client_id],
  );
  const issueSites = useMemo(
    () => clients.find((c) => String(c.id) === issue.client_id)?.sites || [],
    [clients, issue.client_id],
  );
  const openNew = () => {
    setUploadError("");
    setEditing(null);
    setForm(emptyContract);
    setFiles([]);
    setContractOpen(true);
  };
  const openEdit = (c: CrmContract) => {
    setUploadError("");
    setEditing(c);
    setForm({
      client_id: String(c.client_id),
      site_id: c.site_id ? String(c.site_id) : "",
      title: c.title,
      reference_number: c.reference_number || "",
      start_date: c.start_date?.slice(0, 10),
      end_date: c.end_date?.slice(0, 10),
      contract_amount: c.contract_amount ? String(c.contract_amount) : "",
      payment_frequency: c.payment_frequency || "MONTHLY",
      payment_due_day: c.payment_due_day ? String(c.payment_due_day) : "",
      expiry_reminder_days: String(c.expiry_reminder_days || 30),
      reminder_email: c.reminder_email || "",
      agreement_summary: c.agreement_summary || "",
      payment_terms: c.payment_terms || "",
      category_ids: c.categories.map((x) => x.id),
    });
    setFiles([]);
    setContractOpen(true);
  };
  const save = async () => {
    setUploadError("");
    const tooLarge = files.find((x) => x.file && x.file.size > 50 * 1024 * 1024);
    if (tooLarge?.file) { setUploadError(`${tooLarge.file.name} is larger than 50 MB.`); return; }
    if (
      !form.client_id ||
      !form.title ||
      !form.start_date ||
      !form.end_date ||
      !form.category_ids.length
    ) {
      toast.error(
        "Client, title, dates and at least one service category are required.",
      );
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "category_ids")
        (v as number[]).forEach((x) => fd.append("category_ids[]", String(x)));
      else if (v !== "") fd.append(k, String(v));
    });
    files
      .filter((x) => x.file)
      .forEach((x, i) => {
        fd.append(`document_names[${i}]`, x.name);
        fd.append(`documents[${i}]`, x.file!);
      });
    try {
      await crmApi.saveContract(fd, editing?.id);
      toast.success(editing ? "Contract updated" : "Contract created");
      setContractOpen(false);
      load();
    } catch (e: any) {
      const errors = e.errors || e.response?.data?.errors;
      setUploadError(errors ? Object.values(errors).flat().join(" ") : e.message || e.response?.data?.message || "Could not upload the contract document.");
      toast.error(
        errors
          ? Object.values(errors).flat().join(" ")
          : e.response?.data?.message || "Could not save contract",
      );
    }
  };
  const submitIssue = async () => {
    try {
      await crmApi.createIssue({
        ...issue,
        client_id: Number(issue.client_id),
        site_id: issue.site_id ? Number(issue.site_id) : undefined,
        contract_id: issue.contract_id ? Number(issue.contract_id) : undefined,
      });
      toast.success("Customer issue submitted");
      setIssueOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Could not submit issue");
    }
  };
  const terminate = async (c: CrmContract) => {
    const reason = prompt("Termination reason (required):");
    if (!reason) return;
    await crmApi.terminateContract(c.id, reason);
    toast.success("Terminated and archived");
    load();
  };
  const downloadDoc = async (d: any) => {
    const b = await crmApi.downloadContractDocument(d.id),
      u = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = u;
    a.download = d.original_name;
    a.click();
    URL.revokeObjectURL(u);
  };
  const viewDoc = async (d: any) => {
    const b = await crmApi.downloadContractDocument(d.id),
      u = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = u;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  };
  const renameContractDoc=async(d:any)=>{const name=prompt('Document display name',d.name);if(!name?.trim())return;const updated=await crmApi.renameContractDocument(d.id,name.trim());setEditing(c=>c?{...c,documents:c.documents.map(x=>x.id===d.id?{...x,...updated}:x)}:c);toast.success('Document name updated');load()}
  const removeContractDoc=async(d:any)=>{if(!confirm(`Delete ${d.name}? This removes the uploaded file permanently.`))return;await crmApi.deleteContractDocument(d.id);setEditing(c=>c?{...c,documents:c.documents.filter(x=>x.id!==d.id)}:c);toast.success('Document deleted');load()}
  const exportCsv = async () => {
    const b = await crmApi.exportContracts(),
      u = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = u;
    a.download = "crm-contract-report.csv";
    a.click();
    URL.revokeObjectURL(u);
  };
  return (
    <div className="space-y-5">
      {stats.urgent?.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5" />
            Urgent contract reminders
          </div>
          {stats.urgent.slice(0, 5).map((c: CrmContract) => (
            <div key={c.id} className="mt-1 text-sm">
              {c.client?.company_name} — {c.title}:{" "}
              {c.days_remaining < 0
                ? "expired"
                : `${c.days_remaining} days remaining`}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          [Users, "Clients", stats.clients],
          [Building2, "Sites", stats.sites],
          [FileText, "Active Contracts", stats.active_contracts],
          [AlertTriangle, "Expiring ≤30 days", stats.expiring_30_days],
          [XCircle, "Open Issues", stats.open_issues],
        ].map(([Icon, label, val]: any) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-6 w-6 text-primary-600" />
              <div>
                <div className="text-xs text-neutral-500">{label}</div>
                <div className="text-2xl font-bold">{val ?? 0}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Client Contracts & CRM</CardTitle>
            <p className="text-sm text-neutral-500">
              Contracts are linked to existing Clients & Sites. Manage terms,
              documents, issues, expiry and archive.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCategoryOpen(true)}>
              Categories
            </Button>
            <Button variant="outline" onClick={() => setIssueOpen(true)}>
              + Customer Issue
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" />
              CSV Report
            </Button>
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              New Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border px-3"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All service categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              variant={archived ? "default" : "outline"}
              onClick={() => setArchived(!archived)}
            >
              <Archive className="mr-1 h-4 w-4" />
              {archived ? "Viewing Archive" : "View Archive"}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Client / Site</th>
                  <th>Contract</th>
                  <th>Services</th>
                  <th>Duration</th>
                  <th>Amount / Payment</th>
                  <th>Expiry</th>
                  <th>Documents</th>
                  <th>Issues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <tr key={c.id} className="border-b align-top">
                      <td className="p-3 font-medium">
                        {c.client?.company_name}
                        <div className="text-xs text-neutral-500">
                          {c.site?.site_name || "All sites"}
                        </div>
                      </td>
                      <td className="p-3">
                        {c.title}
                        <div className="text-xs text-neutral-500">
                          {c.reference_number || "No reference"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {c.categories.map((x) => (
                            <Badge key={x.id} variant="secondary">
                              {x.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {c.start_date?.slice(0, 10)}
                        <br />
                        {c.end_date?.slice(0, 10)}
                      </td>
                      <td className="p-3">
                        {c.contract_amount
                          ? `${Number(c.contract_amount).toLocaleString()} ETB`
                          : "—"}
                        <div className="text-xs">
                          {c.payment_frequency || ""}
                          {c.payment_due_day
                            ? ` · day ${c.payment_due_day}`
                            : ""}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            c.expiry_state === "URGENT" ||
                            c.expiry_state === "EXPIRED"
                              ? "bg-red-100 text-red-700"
                              : c.expiry_state === "WARNING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-700"
                          }
                        >
                          {c.days_remaining < 0
                            ? `${Math.abs(c.days_remaining)}d expired`
                            : `${c.days_remaining}d left`}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {c.documents.map((d) => (
                          <div key={d.id} className="mb-1 flex items-center gap-2">
                            <span className="max-w-[120px] truncate" title={d.original_name}>{d.name}</span>
                            <button className="text-primary underline" onClick={() => viewDoc(d)}>View</button>
                            <button className="text-primary underline" onClick={() => downloadDoc(d)}>Download</button>
                          </div>
                        ))}
                      </td>
                      <td className="p-3">{c.issues_count}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(c)}
                          >
                            Edit
                          </Button>
                          {archived ? (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await crmApi.restoreContract(c.id);
                                load();
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await crmApi.archiveContract(c.id);
                                  load();
                                }}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => terminate(c)}
                              >
                                Terminate
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer Issues & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {issues.slice(0, 10).map((i) => (
              <div key={i.id} className="rounded-lg border p-3">
                <div className="flex justify-between">
                  <b>{i.subject}</b>
                  <Badge
                    className={
                      i.priority === "URGENT" ? "bg-red-100 text-red-700" : ""
                    }
                  >
                    {i.priority}
                  </Badge>
                </div>
                <div className="text-xs text-neutral-500">
                  {i.client?.company_name} · {i.site?.site_name || "All sites"}{" "}
                  · {i.status}
                </div>
                <p className="mt-2 text-sm">{i.description}</p>
                {i.status !== "RESOLVED" && (
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const action = prompt("Action taken / resolution:");
                      if (action) {
                        await crmApi.updateIssue(i.id, {
                          status: "RESOLVED",
                          action_taken: action,
                        });
                        load();
                      }
                    }}
                  >
                    Resolve / Record Action
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "New"} Client Contract
            </DialogTitle>
            <DialogDescription>Manage contract details and securely attach supporting documents.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Client *
              <select
                className="mt-1 h-10 w-full rounded border px-3"
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value, site_id: "" })
                }
              >
                <option value="">Select existing client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.sites?.length || 0} sites)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Site
              <select
                className="mt-1 h-10 w-full rounded border px-3"
                value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}
              >
                <option value="">All client sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Contract title *
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Reference number
              <Input
                value={form.reference_number}
                onChange={(e) =>
                  setForm({ ...form, reference_number: e.target.value })
                }
              />
            </label>
            <label>
              Start date *
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </label>
            <label>
              End / expiry date *
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </label>
            <label>
              Contract amount ETB
              <Input
                type="number"
                value={form.contract_amount}
                onChange={(e) =>
                  setForm({ ...form, contract_amount: e.target.value })
                }
              />
            </label>
            <label>
              Payment frequency
              <select
                className="mt-1 h-10 w-full rounded border px-3"
                value={form.payment_frequency}
                onChange={(e) =>
                  setForm({ ...form, payment_frequency: e.target.value })
                }
              >
                {["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME", "OTHER"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Payment due day
              <Input
                type="number"
                min="1"
                max="31"
                value={form.payment_due_day}
                onChange={(e) =>
                  setForm({ ...form, payment_due_day: e.target.value })
                }
              />
            </label>
            <label>
              Expiry warning days
              <Input
                type="number"
                min="1"
                value={form.expiry_reminder_days}
                onChange={(e) =>
                  setForm({ ...form, expiry_reminder_days: e.target.value })
                }
              />
            </label>
            <label>
              Reminder email
              <Input
                type="email"
                value={form.reminder_email}
                onChange={(e) =>
                  setForm({ ...form, reminder_email: e.target.value })
                }
              />
            </label>
            <div>
              <div>Service categories *</div>
              <div className="mt-2 flex flex-wrap gap-3">
                {categories
                  .filter((x) => x.is_active)
                  .map((x) => (
                    <label key={x.id} className="flex gap-1">
                      <input
                        type="checkbox"
                        checked={form.category_ids.includes(x.id)}
                        onChange={() =>
                          setForm({
                            ...form,
                            category_ids: form.category_ids.includes(x.id)
                              ? form.category_ids.filter((i) => i !== x.id)
                              : [...form.category_ids, x.id],
                          })
                        }
                      />
                      {x.name}
                    </label>
                  ))}
              </div>
            </div>
            <label className="md:col-span-2">
              Agreement / operational details
              <Textarea
                rows={3}
                value={form.agreement_summary}
                onChange={(e) =>
                  setForm({ ...form, agreement_summary: e.target.value })
                }
              />
            </label>
            <label className="md:col-span-2">
              Payment terms and reminders
              <Textarea
                rows={2}
                value={form.payment_terms}
                onChange={(e) =>
                  setForm({ ...form, payment_terms: e.target.value })
                }
              />
            </label>
            <div className="md:col-span-2">
              <div className="mb-2 font-medium">
                Named contract documents (up to 20 files, 50MB each)
              </div>
              {uploadError && <div role="alert" className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">Upload failed: {uploadError}</div>}
              {editing && editing.documents.length > 0 && (
                <div className="mb-3 rounded-md border bg-neutral-50 p-3">
                  <div className="mb-2 text-sm font-medium">Already uploaded</div>
                  {editing.documents.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 first:border-0">
                      <span className="min-w-0 truncate text-sm">{d.name} <span className="text-xs text-neutral-500">({d.original_name})</span></span>
                      <span className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => viewDoc(d)}>View</Button><Button type="button" size="sm" variant="outline" onClick={() => downloadDoc(d)}>Download</Button><Button type="button" size="sm" variant="outline" onClick={()=>renameContractDoc(d)}>Edit name</Button><Button type="button" size="sm" variant="destructive" onClick={()=>removeContractDoc(d)}>Delete</Button></span>
                    </div>
                  ))}
                </div>
              )}
              {files.map((x, i) => (
                <div
                  key={i}
                  className="mb-3 rounded-md border p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Document name e.g. Signed agreement"
                    value={x.name}
                    onChange={(e) =>
                      setFiles(
                        files.map((v, j) =>
                          j === i ? { ...v, name: e.target.value } : v,
                        ),
                      )
                    }
                  />
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.csv,.txt,.jpg,.jpeg,.jfif,.png,.webp,.avif,.gif,.bmp,.heic,.heif,.zip"
                    onChange={(e) => { const file=e.target.files?.[0];
                      setFiles(
                        files.map((v, j) =>
                          j === i ? { ...v, file, previewUrl:file?.type.startsWith('image/')?URL.createObjectURL(file):undefined } : v,
                        ),
                      )
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  >
                    ×
                  </Button>
                  </div>
                  {x.file && <div className="mt-2 flex items-center gap-3 rounded bg-neutral-50 p-2 text-xs">{x.previewUrl?<img src={x.previewUrl} alt={`Preview of ${x.file.name}`} className="h-16 w-20 rounded border object-cover"/>:<FileText className="h-8 w-8 text-primary"/>}<div><div className="font-medium">{x.file.name}</div><div className="text-neutral-500">{(x.file.size/1024/1024).toFixed(2)} MB · ready to upload</div></div></div>}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setFiles([...files, { name: "" }])}
              >
                + Add document
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Customer Issue</DialogTitle>
            <DialogDescription>Record a client concern, priority and required follow-up.</DialogDescription>
          </DialogHeader>
          <select
            className="h-10 rounded border px-3"
            value={issue.client_id}
            onChange={(e) =>
              setIssue({ ...issue, client_id: e.target.value, site_id: "" })
            }
          >
            <option value="">Client *</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded border px-3"
            value={issue.site_id}
            onChange={(e) => setIssue({ ...issue, site_id: e.target.value })}
          >
            <option value="">All sites</option>
            {issueSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Issue subject"
            value={issue.subject}
            onChange={(e) => setIssue({ ...issue, subject: e.target.value })}
          />
          <select
            className="h-10 rounded border px-3"
            value={issue.priority}
            onChange={(e) => setIssue({ ...issue, priority: e.target.value })}
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <Textarea
            placeholder="Discussion, complaint or requested action"
            value={issue.description}
            onChange={(e) =>
              setIssue({ ...issue, description: e.target.value })
            }
          />
          <DialogFooter>
            <Button onClick={submitIssue}>Submit Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Service Categories</DialogTitle>
            <DialogDescription>Create categories used by contracts and bids, or change their active state.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="New category e.g. Security Guard"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <Button
              onClick={async () => {
                if (categoryName) {
                  await crmApi.createCategory(categoryName);
                  setCategoryName("");
                  load();
                }
              }}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            Select a category below to activate or deactivate it. Existing
            contracts keep their category history.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={async () => {
                  await crmApi.updateCategory(c.id, {
                    is_active: !c.is_active,
                  });
                  load();
                }}
              >
                <Badge
                  variant={c.is_active ? "secondary" : "outline"}
                  className={!c.is_active ? "line-through opacity-60" : ""}
                >
                  {c.name} · {c.is_active ? "Active" : "Inactive"}
                </Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
