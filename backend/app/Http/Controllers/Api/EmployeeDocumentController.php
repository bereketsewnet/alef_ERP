<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployeeDocumentController extends Controller
{
    /**
     * List all documents for a given employee.
     */
    public function index(int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $documents = EmployeeDocument::where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (EmployeeDocument $doc) {
                return array_merge($doc->toArray(), [
                    'url' => $doc->url,
                ]);
            });

        return response()->json($documents);
    }

    /**
     * Upload a new document for an employee.
     *
     * Expected multipart/form-data:
     * - file: uploaded file (required)
     * - type: MEDICAL_PAPER | POLICE_REPORT | GUARANTOR_ID | EMPLOYEE_PHOTO | GUARANTOR_PHOTO | OTHER (required)
     * - name: human readable label (required)
     * - valid_until: date (optional)
     */
    public function store(Request $request, int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx,txt|max:10240', // 10MB
            'type' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'valid_until' => 'nullable|date',
        ]);

        $path = $request->file('file')->store("employees/{$employee->id}", 'public');

        $document = EmployeeDocument::create([
            'employee_id' => $employee->id,
            'type' => $validated['type'],
            'name' => $validated['name'],
            'file_path' => $path,
            'valid_until' => $validated['valid_until'] ?? null,
        ]);

        $documentArray = array_merge($document->toArray(), [
            'url' => $document->url,
        ]);

        return response()->json($documentArray, 201);
    }

    /**
     * Delete a document for an employee.
     */
    public function destroy(int $employeeId, int $documentId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $document = EmployeeDocument::where('employee_id', $employee->id)->findOrFail($documentId);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
