<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            $invoice->status = 'SENT'; // Default to SENT when created manually
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
}
