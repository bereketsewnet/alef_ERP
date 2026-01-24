<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Client;
use App\Models\ClientSite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Invoice::with('client');

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q2) use ($search) {
                      $q2->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $invoices = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json($invoices);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $client = Client::find($request->client_id);
            
            // Generate Invoice Number (e.g., INV-2024-001)
            $lastInvoice = Invoice::latest()->first();
            $nextId = $lastInvoice ? $lastInvoice->id + 1 : 1;
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

            $totalAmount = 0;
            $invoice = new Invoice();
            $invoice->client_id = $request->client_id;
            $invoice->invoice_number = $invoiceNumber;
            $invoice->invoice_date = $request->invoice_date;
            $invoice->due_date = $request->due_date;
            $invoice->status = 'DRAFT'; // Default to DRAFT when created manually
            $invoice->total_amount = 0; // Will update after items
            $invoice->save();

            foreach ($request->items as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $lineTotal
                ]);
            }

            $invoice->total_amount = $totalAmount;
            $invoice->save();

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'data' => $invoice->load('items', 'client')
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to create invoice', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $invoice = Invoice::with(['items', 'client'])->find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        return response()->json(['data' => $invoice]);
    }

    /**
     * Get dashboard stats for invoices.
     */
    public function dashboard_stats()
    {
        $stats = [
            'total_invoiced' => Invoice::sum('total_amount'),
            'paid' => Invoice::where('status', 'PAID')->sum('total_amount'),
            'pending' => Invoice::where('status', 'SENT')->orWhere('status', 'DRAFT')->sum('total_amount'),
            'overdue' => Invoice::where('status', 'OVERDUE')->sum('total_amount'),
            'count_total' => Invoice::count(),
            'count_paid' => Invoice::where('status', 'PAID')->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    /**
     * Generate PDF (Stub for now)
     */
    public function download($id)
    {
         $invoice = Invoice::with(['items', 'client'])->find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        // TODO: Integrate a real PDF library like DomPDF or Snappy
        // For now, return a basic JSON response simulating a download or a simple text representation
        
        $content = "INVOICE #{$invoice->invoice_number}\n";
        $content .= "Date: {$invoice->invoice_date}\n";
        $content .= "Client: {$invoice->client->name}\n";
        $content .= "--------------------------------\n";
        foreach($invoice->items as $item) {
            $content .= "{$item->description} x {$item->quantity} @ {$item->unit_price} = {$item->total}\n";
        }
        $content .= "--------------------------------\n";
        $content .= "TOTAL: {$invoice->total_amount}\n";

        return response($content, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="invoice-' . $invoice->invoice_number . '.txt"'
        ]);
    }

    /**
     * Send invoice via email
     */
    public function send($id)
    {
        try {
            $invoice = Invoice::with(['items', 'client.sites'])->find($id);

            if (!$invoice) {
                return response()->json(['message' => 'Invoice not found'], 404);
            }

            // Get client email
            $client = Client::find($invoice->client_id);
            if (!$client) {
                return response()->json(['message' => 'Client not found'], 404);
            }

            if (!$client->email || trim($client->email) === '') {
                return response()->json([
                    'message' => 'Email not configured',
                    'error' => 'Please set an email address for this client before sending the invoice.'
                ], 400);
            }

            // Generate invoice content
            $invoiceContent = $this->generateInvoiceContent($invoice);

            // Send email
            try {
                Mail::raw($invoiceContent, function ($message) use ($invoice, $client) {
                    $message->to($client->email)
                        ->subject('Invoice #' . $invoice->invoice_number . ' - ' . $invoice->client->company_name)
                        ->from(config('mail.from.address'), config('mail.from.name'));
                });

                // Update invoice status to SENT
                $invoice->status = 'SENT';
                $invoice->save();

                return response()->json([
                    'message' => 'Invoice sent successfully to ' . $client->email,
                    'data' => $invoice
                ]);
            } catch (\Exception $e) {
                // Email sending failed, but don't change status
                // Extract a user-friendly error message
                $errorMessage = $e->getMessage();
                
                // If it's a permission error, provide a clearer message
                if (strpos($errorMessage, 'Permission denied') !== false) {
                    $errorMessage = 'Email sending failed due to server configuration. Please contact administrator.';
                } elseif (strpos($errorMessage, 'Connection') !== false || strpos($errorMessage, 'SMTP') !== false) {
                    $errorMessage = 'Failed to connect to email server. Please check mail configuration.';
                }
                
                \Log::error('Invoice email send failed: ' . $e->getMessage());
                
                return response()->json([
                    'message' => 'Failed to send email',
                    'error' => $errorMessage
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate invoice content for email
     */
    private function generateInvoiceContent(Invoice $invoice): string
    {
        $content = "INVOICE #{$invoice->invoice_number}\n";
        $content .= "================================\n\n";
        $content .= "Client: {$invoice->client->company_name}\n";
        $content .= "Invoice Date: {$invoice->invoice_date}\n";
        $content .= "Due Date: {$invoice->due_date}\n";
        $content .= "Status: {$invoice->status}\n\n";
        $content .= "--------------------------------\n";
        $content .= "ITEMS:\n";
        $content .= "--------------------------------\n";
        
        foreach ($invoice->items as $item) {
            $content .= sprintf(
                "%-30s %5d x %10.2f = %10.2f ETB\n",
                substr($item->description, 0, 30),
                $item->quantity,
                $item->unit_price,
                $item->total
            );
        }
        
        $content .= "--------------------------------\n";
        $content .= sprintf("TOTAL AMOUNT: %10.2f ETB\n", $invoice->total_amount);
        $content .= "================================\n\n";
        $content .= "Thank you for your business!\n";

        return $content;
    }
}
