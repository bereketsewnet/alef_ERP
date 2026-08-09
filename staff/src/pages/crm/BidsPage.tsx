import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useBids,
  useCreateBid,
  useUpdateBid,
  useDeleteBid,
} from "@/services/useCrm";
import {
  crmApi,
  type BidStatus,
  type CrmServiceCategory,
} from "@/api/endpoints/crm";
import { clientsApi, type Client } from "@/api/endpoints/clients";
import { Plus, Loader2, Trash2, Download, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const bidSchema = z.object({
  title: z.string().min(2, "Title is required"),
  reference_number: z.string().optional(),
  issuer: z.string().optional(),
  submission_deadline: z.string().optional(),
  estimated_value: z.string().optional(),
  submitted_value: z.string().optional(),
  submitted_at: z.string().optional(),
  result_date: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  client_id: z.string().optional(),
  site_id: z.string().optional(),
});

const statusLabels: Record<BidStatus, string> = {
  POTENTIAL: "Potential (Can Involve)",
  APPLIED: "Applied",
  WON: "Won",
  LOST: "Lost",
  NOT_ELIGIBLE: "Not Eligible",
};

const statusOrder: BidStatus[] = [
  "POTENTIAL",
  "APPLIED",
  "WON",
  "LOST",
  "NOT_ELIGIBLE",
];

export function BidsPage() {
  const [statusFilter, setStatusFilter] = useState<BidStatus | undefined>(
    "POTENTIAL",
  );
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<CrmServiceCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [documents, setDocuments] = useState<
    { name: string; file?: File; previewUrl?: string }[]
  >([]);

  useEffect(() => {
    Promise.all([crmApi.categories(), clientsApi.list({ per_page: 100 })]).then(
      ([c, cl]) => {
        setCategories(c);
        setClients(cl.data);
      },
    );
  }, []);

  const params: any = { page };
  if (statusFilter) params.status = statusFilter;
  if (search) params.search = search;
  if (categoryFilter) params.category_id = categoryFilter;

  const { data: bidsData, isLoading, refetch: refetchBids } = useBids(params);
  const { mutate: createBid, isPending: isCreating } = useCreateBid();
  const { mutate: updateBid, isPending: isUpdating } = useUpdateBid();
  const { mutate: deleteBid } = useDeleteBid();

  const bidForm = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      title: "",
      reference_number: "",
      issuer: "",
      submission_deadline: "",
      estimated_value: "",
      submitted_value: "",
      submitted_at: "",
      result_date: "",
      status: "POTENTIAL",
      notes: "",
      category_id: "",
      client_id: "",
      site_id: "",
    },
  });

  const handleOpenNewBid = () => {
    setUploadError("");
    setSelectedBidId(null);
    bidForm.reset({
      title: "",
      reference_number: "",
      issuer: "",
      submission_deadline: "",
      estimated_value: "",
      submitted_value: "",
      submitted_at: "",
      result_date: "",
      status: statusFilter || "POTENTIAL",
      notes: "",
      category_id: categoryFilter,
      client_id: "",
      site_id: "",
    });
    setDocuments([]);
    setBidModalOpen(true);
  };

  const handleEditBid = (bid: any) => {
    setUploadError("");
    setSelectedBidId(bid.id);
    bidForm.reset({
      title: bid.title || "",
      reference_number: bid.reference_number || "",
      issuer: bid.issuer || "",
      submission_deadline: bid.submission_deadline || "",
      estimated_value:
        bid.estimated_value != null ? String(bid.estimated_value) : "",
      submitted_value:
        bid.submitted_value != null ? String(bid.submitted_value) : "",
      submitted_at: bid.submitted_at || "",
      result_date: bid.result_date || "",
      status: bid.status || "POTENTIAL",
      notes: bid.notes || "",
      category_id: bid.category_id ? String(bid.category_id) : "",
      client_id: bid.client_id ? String(bid.client_id) : "",
      site_id: bid.site_id ? String(bid.site_id) : "",
    });
    setDocuments([]);
    setBidModalOpen(true);
  };

  const handleSubmitBid = (values: z.infer<typeof bidSchema>) => {
    setUploadError("");
    const tooLarge = documents.find((d) => d.file && d.file.size > 50 * 1024 * 1024);
    if (tooLarge?.file) { setUploadError(`${tooLarge.file.name} is larger than 50 MB.`); return; }
    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) payload.append(key, value);
    });
    documents
      .filter((d) => d.file)
      .forEach((d, i) => {
        payload.append(`document_names[${i}]`, d.name);
        payload.append(`documents[${i}]`, d.file!);
      });

    if (selectedBidId) {
      updateBid(
        { id: selectedBidId, data: payload },
        {
          onSuccess: () => {
            setBidModalOpen(false);
          },
          onError: (error:any) => { const errors=error.errors||error.response?.data?.errors; setUploadError(errors?Object.values(errors).flat().join(" "):error.message||error.response?.data?.message||"Could not upload the bid document."); },
        },
      );
    } else {
      createBid(payload, {
        onSuccess: () => {
          setBidModalOpen(false);
          bidForm.reset();
        },
        onError: (error:any) => { const errors=error.errors||error.response?.data?.errors; setUploadError(errors?Object.values(errors).flat().join(" "):error.message||error.response?.data?.message||"Could not upload the bid document."); },
      });
    }
  };

  const selectedClientId = bidForm.watch("client_id");
  const siteOptions = useMemo(
    () => clients.find((c) => String(c.id) === selectedClientId)?.sites || [],
    [clients, selectedClientId],
  );
  const existingBidDocuments = (bidsData?.data || []).find(
    (b: any) => b.id === selectedBidId,
  )?.documents || [];
  const downloadDocument = async (d: any) => {
    const blob = await crmApi.downloadBidDocument(d.id),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = d.original_name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const viewDocument = async (d: any) => {
    const blob = await crmApi.downloadBidDocument(d.id),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const renameBidDocument = async (d:any) => { const name=prompt("Document display name",d.name); if(!name?.trim()) return; await crmApi.renameBidDocument(d.id,name.trim()); toast.success("Document name updated"); await refetchBids(); };
  const removeBidDocument = async (d:any) => { if(!confirm(`Delete ${d.name}? This removes the uploaded file permanently.`)) return; await crmApi.deleteBidDocument(d.id); toast.success("Document deleted"); await refetchBids(); };

  const handleDeleteBid = (bidId: number) => {
    deleteBid(bidId);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category?.name || "—"}</Badge>
      ),
    },
    {
      accessorKey: "client",
      header: "Client / Site",
      cell: ({ row }) => (
        <div>
          {row.original.client?.company_name || "—"}
          <div className="text-xs text-neutral-500">
            {row.original.site?.site_name || ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <div>
          {row.original.documents?.map((d: any) => (
            <button
              key={d.id}
              onClick={() => downloadDocument(d)}
              className="block max-w-[150px] truncate text-primary-600 underline"
            >
              <Download className="mr-1 inline h-3 w-3" />
              {d.name}
            </button>
          )) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "issuer",
      header: "Issuer",
    },
    {
      accessorKey: "reference_number",
      header: "Ref #",
    },
    {
      accessorKey: "submission_deadline",
      header: "Deadline",
      cell: ({ row }) => {
        const d = row.original.submission_deadline;
        return d ? new Date(d).toLocaleDateString() : "-";
      },
    },
    {
      accessorKey: "estimated_value",
      header: "Est. Value (ETB)",
      cell: ({ row }) => {
        const v = row.original.estimated_value;
        return v != null ? Number(v).toLocaleString() : "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status as BidStatus;
        let color = "bg-blue-50 text-blue-700";
        if (s === "WON") color = "bg-green-100 text-green-700";
        else if (s === "LOST" || s === "NOT_ELIGIBLE")
          color = "bg-red-100 text-red-700";
        else if (s === "APPLIED") color = "bg-amber-50 text-amber-700";
        return <Badge className={color}>{statusLabels[s] || s}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const bid = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditBid(bid)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600"
              onClick={() => handleDeleteBid(bid.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Bid Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Track bids from potential opportunities to applied and won.
          </p>
        </div>
        <Button
          className="bg-primary-600 hover:bg-primary-700"
          onClick={handleOpenNewBid}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Bid
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {statusOrder.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === status ? undefined : status,
                    )
                  }
                >
                  {statusLabels[status]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border px-3"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="w-64">
                <Input
                  placeholder="Search bids..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <DataTable columns={columns} data={bidsData?.data || []} />
          )}
        </CardContent>
      </Card>

      {/* Bid modal */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedBidId ? "Edit Bid" : "New Bid"}</DialogTitle>
            <DialogDescription>
              Capture tender details and track its status (potential, applied,
              won, lost).
            </DialogDescription>
          </DialogHeader>
          <Form {...bidForm}>
            <form
              onSubmit={bidForm.handleSubmit(handleSubmitBid)}
              className="space-y-4"
            >
              <FormField
                control={bidForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <FormField
                  control={bidForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bid Category *</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border px-3"
                          {...field}
                        >
                          <option value="">Select CRM category</option>
                          {categories
                            .filter((c) => c.is_active)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Client</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border px-3"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            bidForm.setValue("site_id", "");
                          }}
                        >
                          <option value="">No client / public tender</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.company_name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Site</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border px-3"
                          {...field}
                          disabled={!selectedClientId}
                        >
                          <option value="">All sites</option>
                          {siteOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.site_name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={bidForm.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference #</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="issuer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={bidForm.control}
                  name="submission_deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="submitted_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitted At</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={bidForm.control}
                  name="estimated_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value (ETB)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="submitted_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitted Value (ETB)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={bidForm.control}
                  name="result_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bidForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border px-3"
                          {...field}
                        >
                          {statusOrder.map((s) => (
                            <option key={s} value={s}>
                              {statusLabels[s]}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={bidForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Named Bid Documents</FormLabel>
                <p className="mb-2 text-xs text-neutral-500">
                  Up to 20 files, 50MB each. PDF, Office, text, ZIP and common
                  phone/browser images are supported.
                </p>
                {uploadError && <div role="alert" className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">Upload failed: {uploadError}</div>}
                {selectedBidId && existingBidDocuments.length > 0 && (
                    <div className="mb-3 rounded-md border bg-neutral-50 p-3">
                      <div className="mb-2 text-sm font-medium">
                        Already uploaded
                      </div>
                      {existingBidDocuments.map((d: any) => (
                          <div
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 border-t py-2 first:border-0"
                          >
                            <span className="min-w-0 truncate text-sm">
                              {d.name}{" "}
                              <span className="text-xs text-neutral-500">
                                ({d.original_name})
                              </span>
                            </span>
                            <span className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => viewDocument(d)}
                              >
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDocument(d)}
                              >
                                Download
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => renameBidDocument(d)}>Edit name</Button>
                              <Button type="button" size="sm" variant="destructive" onClick={() => removeBidDocument(d)}>Delete</Button>
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                {documents.map((d, i) => (
                  <div key={i} className="mb-3 rounded-md border p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input
                        placeholder="Document name"
                        value={d.name}
                        onChange={(e) =>
                          setDocuments(
                            documents.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <Input
                        type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.csv,.txt,.jpg,.jpeg,.jfif,.png,.webp,.avif,.gif,.bmp,.heic,.heif,.zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setDocuments(
                            documents.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    file,
                                    previewUrl: file?.type.startsWith("image/")
                                      ? URL.createObjectURL(file)
                                      : undefined,
                                  }
                                : x,
                            ),
                          );
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setDocuments(documents.filter((_, j) => j !== i))
                        }
                      >
                        ×
                      </Button>
                    </div>
                    {d.file && (
                      <div className="mt-2 flex items-center gap-3 rounded bg-neutral-50 p-2 text-xs">
                        {d.previewUrl ? (
                          <img
                            src={d.previewUrl}
                            alt={`Preview of ${d.file.name}`}
                            className="h-16 w-20 rounded border object-cover"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-primary" />
                        )}
                        <div>
                          <div className="font-medium">{d.file.name}</div>
                          <div className="text-neutral-500">
                            {(d.file.size / 1024 / 1024).toFixed(2)} MB · ready
                            to upload
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDocuments([...documents, { name: "" }])}
                >
                  + Add Document
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBidModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedBidId ? "Save Changes" : "Create Bid"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
