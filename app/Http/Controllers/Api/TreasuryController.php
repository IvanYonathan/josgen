<?php

namespace App\Http\Controllers\Api;

use App\Models\FinancialRecord;
use App\Models\TreasuryRequest;
use App\Models\TreasuryRequestApproval;
use App\Models\TreasuryRequestItem;
use App\Models\User;
use App\Notifications\Treasury\TreasuryApprovalRequestedNotification;
use App\Notifications\Treasury\TreasuryDecisionNotification;
use App\Notifications\Treasury\TreasuryPaymentProcessedNotification;
use App\Notifications\Treasury\TreasuryRequestEditedNotification;
use App\Notifications\Treasury\TreasuryRequestSubmittedNotification;
use App\Notifications\Treasury\TreasuryRequestWithdrawnNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TreasuryController extends ApiController
{
    /**
     * Query users by Spatie role using the web guard.
     */
    private function usersByRole(string|array $roles): \Illuminate\Database\Eloquent\Collection
    {
        $originalGuard = config('auth.defaults.guard');
        config(['auth.defaults.guard' => 'web']);
        $users = User::role($roles)->get();
        config(['auth.defaults.guard' => $originalGuard]);
        return $users;
    }

    private function treasuryHandlers(TreasuryRequest $treasuryRequest, ?int $excludeUserId = null)
    {
        $treasuryRequest->loadMissing(['division.leader:id,name']);

        $recipients = collect();

        $leader = $treasuryRequest->division?->leader;
        if ($leader) {
            $recipients->push($leader);
        }

        $recipients = $recipients
            ->merge($this->usersByRole('sysadmin'))
            ->merge($this->usersByRole('treasurer'))
            ->unique('id')
            ->filter(fn ($u) => $u && ($excludeUserId === null || $u->id !== $excludeUserId))
            ->values();

        return $recipients;
    }

    // List treasury requests with optional type/status filters
    public function list(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:fund_request,reimbursement',
            'status' => 'nullable|in:draft,submitted,under_review,approved,rejected,paid',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $canViewAll = $this->hasPermission('view all treasury requests');

        $query = TreasuryRequest::with(['requester:id,name,email', 'division:id,name', 'approvals.approver:id,name'])
            ->withCount(['items']);

        if (!$canViewAll) {
            $query->where('requested_by', $user->id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 15);
        $requests = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $requests->getCollection()->transform(function ($treasuryRequest) {
            $treasuryRequest->approval_stage = $treasuryRequest->getApprovalStage();
            return $treasuryRequest;
        });

        return $this->success([
            'requests' => $requests->items(),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ], 'Treasury requests retrieved successfully', $requests->total());
    }

    // Get a single treasury request with full details
    public function get(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::with([
            'requester:id,name,email',
            'division:id,name',
            'project:id,name',
            'event:id,title',
            'items',
            'approvals.approver:id,name,email',
        ])->findOrFail($request->id);

        $canViewAll = $this->hasPermission('view all treasury requests');
        if ($treasuryRequest->requested_by !== $user->id && !$canViewAll) {
            return $this->forbidden('You do not have permission to view this request');
        }

        $treasuryRequest->approval_stage = $treasuryRequest->getApprovalStage();

        return $this->success([
            'request' => $treasuryRequest,
            'categories' => TreasuryRequest::expense_categories,
        ], 'Treasury request retrieved successfully');
    }

    // Create a new treasury request with items
    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create treasury requests', 'You do not have permission to create treasury requests')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:fund_request,reimbursement',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'request_date' => 'required|date',
            'needed_by_date' => 'nullable|date|after_or_equal:request_date',
            'division_id' => 'nullable|exists:divisions,id',
            'project_id' => 'nullable|exists:projects,id',
            'event_id' => 'nullable|exists:events,id',
            'items' => 'nullable|array',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.amount' => 'required_with:items|numeric|min:0',
            'items.*.category' => ['required_with:items', Rule::in(array_keys(TreasuryRequest::expense_categories))],
            'items.*.item_date' => 'nullable|date',
            'submit' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        DB::beginTransaction();

        try {
            $treasuryRequest = TreasuryRequest::create([
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'amount' => $request->amount,
                'currency' => $request->input('currency', 'IDR'),
                'request_date' => $request->request_date,
                'needed_by_date' => $request->needed_by_date,
                'status' => $request->input('submit', false) ? 'submitted' : 'draft',
                'requested_by' => $user->id,
                'division_id' => $request->division_id,
                'project_id' => $request->project_id,
                'event_id' => $request->event_id,
            ]);

            if ($request->has('items')) {
                foreach ($request->items as $item) {
                    TreasuryRequestItem::create([
                        'treasury_request_id' => $treasuryRequest->id,
                        'description' => $item['description'],
                        'amount' => $item['amount'],
                        'category' => $item['category'],
                        'item_date' => $item['item_date'] ?? null,
                    ]);
                }
            }

            DB::commit();

            $treasuryRequest->load(['requester:id,name', 'items', 'division:id,name']);

            return $this->success([
                'request' => $treasuryRequest,
            ], 'Treasury request created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create treasury request: ' . $e->getMessage());
        }
    }

    // Update a treasury request (only draft, submitted, or rejected)
    public function update(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
            'type' => 'nullable|in:fund_request,reimbursement',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'request_date' => 'nullable|date',
            'needed_by_date' => 'nullable|date',
            'division_id' => 'nullable|exists:divisions,id',
            'project_id' => 'nullable|exists:projects,id',
            'event_id' => 'nullable|exists:events,id',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|integer|exists:treasury_request_items,id',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.amount' => 'required_with:items|numeric|min:0',
            'items.*.category' => ['required_with:items', Rule::in(array_keys(TreasuryRequest::expense_categories))],
            'items.*.item_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::findOrFail($request->id);

        if ($treasuryRequest->requested_by !== $user->id) {
            return $this->forbidden('You can only edit your own requests');
        }

        if (!in_array($treasuryRequest->status, ['draft', 'submitted', 'rejected'])) {
            return $this->error('Cannot edit a request that is already under review or processed');
        }

        $shouldNotifyEdited = $treasuryRequest->status === 'submitted';
        $itemsChanged = false;

        DB::beginTransaction();

        try {
            $treasuryRequest->update($request->only([
                'type', 'title', 'description', 'amount', 'currency',
                'request_date', 'needed_by_date',
                'division_id', 'project_id', 'event_id',
            ]));

            if ($request->has('items')) {
                $existingItemIds = $treasuryRequest->items->pluck('id')->toArray();
                $submittedItemIds = collect($request->items)->pluck('id')->filter()->toArray();

                TreasuryRequestItem::where('treasury_request_id', $treasuryRequest->id)
                    ->whereNotIn('id', $submittedItemIds)
                    ->delete();

                if (count($existingItemIds) !== count($submittedItemIds)) {
                    $itemsChanged = true;
                }

                foreach ($request->items as $item) {
                    if (isset($item['id']) && in_array($item['id'], $existingItemIds)) {
                        TreasuryRequestItem::where('id', $item['id'])->update([
                            'description' => $item['description'],
                            'amount' => $item['amount'],
                            'category' => $item['category'],
                            'item_date' => $item['item_date'] ?? null,
                        ]);
                        $itemsChanged = true;
                    } else {
                        TreasuryRequestItem::create([
                            'treasury_request_id' => $treasuryRequest->id,
                            'description' => $item['description'],
                            'amount' => $item['amount'],
                            'category' => $item['category'],
                            'item_date' => $item['item_date'] ?? null,
                        ]);
                        $itemsChanged = true;
                    }
                }
            }

            DB::commit();

            $treasuryRequest->load(['requester:id,name', 'items', 'division:id,name']);

            if ($shouldNotifyEdited && ($treasuryRequest->wasChanged() || $itemsChanged)) {
                foreach ($this->treasuryHandlers($treasuryRequest, $user->id) as $recipient) {
                    $recipient->notify(new TreasuryRequestEditedNotification($treasuryRequest, $user));
                }
            }

            return $this->success([
                'request' => $treasuryRequest,
            ], 'Treasury request updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update treasury request: ' . $e->getMessage());
        }
    }

    // Delete a treasury request (only draft status)
    public function delete(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::findOrFail($request->id);

        if ($treasuryRequest->requested_by !== $user->id) {
            return $this->forbidden('You can only delete your own requests');
        }

        if (!in_array($treasuryRequest->status, ['draft', 'submitted', 'approved'])) {
            return $this->error('Cannot delete a request that is under review, rejected, or already paid');
        }

        if ($treasuryRequest->attachment_path) {
            Storage::disk('public')->delete($treasuryRequest->attachment_path);
        }

        if (in_array($treasuryRequest->status, ['submitted', 'approved'])) {
            foreach ($this->treasuryHandlers($treasuryRequest, $user->id) as $recipient) {
                $recipient->notify(new TreasuryRequestWithdrawnNotification($treasuryRequest, $user));
            }
        }

        $treasuryRequest->delete();

        return $this->success(null, 'Treasury request deleted successfully');
    }

    public function markPaid(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('approve treasury requests', 'You do not have permission to mark requests as paid')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
            'payment_method' => 'nullable|string|max:255',
            'payment_reference' => 'nullable|string|max:255',
            'payment_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $treasuryRequest = TreasuryRequest::with(['requester:id,name', 'division.leader:id,name'])->findOrFail($request->id);

        if ($treasuryRequest->status !== 'approved') {
            return $this->error('Only approved requests can be marked as paid');
        }

        $treasuryRequest->status = 'paid';
        $treasuryRequest->payment_method = $request->payment_method;
        $treasuryRequest->payment_reference = $request->payment_reference;
        $treasuryRequest->payment_date = $request->payment_date ?? now()->toDateString();
        $treasuryRequest->processed_by = $user->id;
        $treasuryRequest->save();

        if ($treasuryRequest->requester && $treasuryRequest->requester->id !== $user->id) {
            $treasuryRequest->requester->notify(new TreasuryPaymentProcessedNotification($treasuryRequest, $user));
        }

        foreach ($this->treasuryHandlers($treasuryRequest, $user->id) as $recipient) {
            $recipient->notify(new TreasuryPaymentProcessedNotification($treasuryRequest, $user));
        }

        return $this->success([
            'request' => $treasuryRequest->refresh()->load(['requester:id,name', 'division:id,name', 'approvals.approver:id,name']),
            'approval_stage' => $treasuryRequest->getApprovalStage(),
        ], 'Treasury request marked as paid');
    }

    // Submit a draft request for review or resubmit a rejected request
    public function submit(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::findOrFail($request->id);

        if ($treasuryRequest->requested_by !== $user->id) {
            return $this->forbidden('You can only submit your own requests');
        }

        if (!in_array($treasuryRequest->status, ['draft', 'rejected'])) {
            return $this->error('This request cannot be submitted. Only draft or rejected requests can be submitted.');
        }

        if ($treasuryRequest->status === 'rejected') {
            $treasuryRequest->approvals()->delete();
        }

        $treasuryRequest->status = 'submitted';
        $treasuryRequest->save();

        // Notify the treasury handlers that a new request was submitted:
        // - Division leader
        // - Sysadmins
        // - Treasurers
        $treasuryRequest->load(['division.leader:id,name', 'requester:id,name']);
        $recipients = collect();

        $leader = $treasuryRequest->division?->leader;
        if ($leader) {
            $recipients->push($leader);
        }

        $recipients = $recipients
            ->merge($this->usersByRole('sysadmin'))
            ->merge($this->usersByRole('treasurer'))
            ->unique('id')
            ->filter(fn ($u) => $u && $u->id !== $user->id)
            ->values();

        foreach ($recipients as $recipient) {
            $recipient->notify(new TreasuryRequestSubmittedNotification($treasuryRequest, $user));
        }

        $message = $treasuryRequest->wasChanged('status') && $treasuryRequest->getOriginal('status') === 'rejected'
            ? 'Treasury request resubmitted successfully'
            : 'Treasury request submitted successfully';

        return $this->success([
            'request' => $treasuryRequest->load(['requester:id,name', 'items']),
        ], $message);
    }

    // Approve a treasury request (Leader first, then Treasurer)
    public function approve(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('approve treasury requests', 'You do not have permission to approve treasury requests')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $treasuryRequest = TreasuryRequest::with('approvals')->findOrFail($request->id);

        if (!in_array($treasuryRequest->status, ['submitted', 'under_review'])) {
            return $this->error('This request cannot be approved in its current state');
        }

        if ($treasuryRequest->approvals()->where('user_id', $user->id)->exists()) {
            return $this->error('You have already reviewed this request');
        }

        if ($treasuryRequest->isRejected()) {
            return $this->error('This request has already been rejected');
        }

        $approvalLevel = $this->determineApprovalLevel($user, $treasuryRequest);

        if ($approvalLevel === null) {
            return $this->error('You are not authorized to approve at this stage');
        }

        if ($approvalLevel === 'treasurer' && !$treasuryRequest->hasLeaderApproval()) {
            return $this->error('A leader must approve this request first');
        }

        TreasuryRequestApproval::create([
            'treasury_request_id' => $treasuryRequest->id,
            'user_id' => $user->id,
            'decision' => 'approved',
            'approval_level' => $approvalLevel,
            'notes' => $request->notes,
        ]);

        $treasuryRequest->recalculateStatus();
        $treasuryRequest->refresh();
        $treasuryRequest->load(['approvals.approver:id,name']);

        // Notify requester about the decision
        $treasuryRequest->loadMissing('requester:id,name');
        if ($treasuryRequest->requester && $treasuryRequest->requester->id !== $user->id) {
            $treasuryRequest->requester->notify(new TreasuryDecisionNotification($treasuryRequest, $user, 'approved', $approvalLevel));
        }

        // If leader approved and treasurer approval is next, notify treasurers
        if ($treasuryRequest->getApprovalStage() === 'pending_treasurer') {
            $treasurers = $this->usersByRole('treasurer');
            foreach ($treasurers as $treasurer) {
                if ($treasurer->id === $user->id) {
                    continue;
                }
                $treasurer->notify(new TreasuryApprovalRequestedNotification($treasuryRequest, $treasuryRequest->requester ?? $user, 'treasurer'));
            }
        }

        $message = $treasuryRequest->isFullyApproved()
            ? 'Treasury request fully approved'
            : 'Treasury request approved at ' . $approvalLevel . ' level. Awaiting ' .
              ($approvalLevel === 'leader' ? 'treasurer' : 'leader') . ' approval.';

        return $this->success([
            'request' => $treasuryRequest,
            'approval_stage' => $treasuryRequest->getApprovalStage(),
        ], $message);
    }

    // Reject a treasury request
    public function reject(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('approve treasury requests', 'You do not have permission to reject treasury requests')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:treasury_requests,id',
            'notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $treasuryRequest = TreasuryRequest::with('approvals')->findOrFail($request->id);

        if (!in_array($treasuryRequest->status, ['submitted', 'under_review'])) {
            return $this->error('This request cannot be rejected in its current state');
        }

        if ($treasuryRequest->approvals()->where('user_id', $user->id)->exists()) {
            return $this->error('You have already reviewed this request');
        }

        $approvalLevel = $this->determineApprovalLevel($user, $treasuryRequest);

        if ($approvalLevel === null) {
            return $this->error('You are not authorized to reject this request');
        }

        TreasuryRequestApproval::create([
            'treasury_request_id' => $treasuryRequest->id,
            'user_id' => $user->id,
            'decision' => 'rejected',
            'approval_level' => $approvalLevel,
            'notes' => $request->notes,
        ]);

        $treasuryRequest->status = 'rejected';
        $treasuryRequest->approval_notes = $request->notes;
        $treasuryRequest->save();

        $treasuryRequest->load(['approvals.approver:id,name']);
        $treasuryRequest->loadMissing('requester:id,name');

        if ($treasuryRequest->requester && $treasuryRequest->requester->id !== $user->id) {
            $treasuryRequest->requester->notify(new TreasuryDecisionNotification($treasuryRequest, $user, 'rejected', $approvalLevel));
        }

        return $this->success([
            'request' => $treasuryRequest,
            'approval_stage' => 'rejected',
        ], 'Treasury request rejected');
    }

    // Get treasury statistics and reports
    public function stats(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view treasury reports', 'You do not have permission to view treasury reports')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'year' => 'nullable|integer|min:2020|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $year = $request->input('year', now()->year);

        $financialIncome = FinancialRecord::where('type', 'income')->sum('amount');
        $financialExpenses = FinancialRecord::where('type', 'expense')->sum('amount');

        $approvedReimbursements = TreasuryRequest::whereIn('status', ['approved', 'paid'])
            ->sum('amount');

        $totalExpenses = $financialExpenses + $approvedReimbursements;
        $totalIncome = $financialIncome;

        $summary = [
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'current_balance' => $totalIncome - $totalExpenses,
            'total_requests' => TreasuryRequest::count(),
            'pending_requests' => TreasuryRequest::whereIn('status', ['submitted', 'under_review'])->count(),
            'approved_requests' => TreasuryRequest::where('status', 'approved')->count(),
            'rejected_requests' => TreasuryRequest::where('status', 'rejected')->count(),
            'total_approved_amount' => TreasuryRequest::where('status', 'approved')->sum('amount'),
            'total_pending_amount' => TreasuryRequest::whereIn('status', ['submitted', 'under_review'])->sum('amount'),
        ];

        $monthlyFinancialData = FinancialRecord::selectRaw('
                EXTRACT(MONTH FROM record_date)::integer as month,
                type,
                SUM(amount) as total_amount
            ')
            ->whereYear('record_date', $year)
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get();

        $monthlyRequestData = TreasuryRequest::selectRaw('
                EXTRACT(MONTH FROM request_date)::integer as month,
                SUM(amount) as total_amount
            ')
            ->whereIn('status', ['approved', 'paid'])
            ->whereYear('request_date', $year)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $financialMonthData = $monthlyFinancialData->where('month', $m);
            $requestMonthData = $monthlyRequestData->where('month', $m);
            
            $financialExpenseAmount = (float) $financialMonthData->where('type', 'expense')->sum('total_amount');
            $requestExpenseAmount = (float) $requestMonthData->sum('total_amount');
            
            $chartData[] = [
                'month' => date('M', mktime(0, 0, 0, $m, 1)),
                'month_number' => $m,
                'income' => (float) $financialMonthData->where('type', 'income')->sum('total_amount'),
                'expense' => $financialExpenseAmount + $requestExpenseAmount,
            ];
        }

        $financialCategories = FinancialRecord::selectRaw('category, SUM(amount) as total_amount, COUNT(*) as count')
            ->where('type', 'expense')
            ->whereNotNull('category')
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $requestCategories = TreasuryRequestItem::selectRaw('category, SUM(amount) as total_amount, COUNT(*) as count')
            ->whereHas('treasuryRequest', function ($query) {
                $query->whereIn('status', ['approved', 'paid']);
            })
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $allCategories = collect();
        $allCategoryKeys = $financialCategories->keys()->merge($requestCategories->keys())->unique();
        
        foreach ($allCategoryKeys as $category) {
            $financial = $financialCategories->get($category);
            $request = $requestCategories->get($category);
            
            $totalAmount = ($financial->total_amount ?? 0) + ($request->total_amount ?? 0);
            $totalCount = ($financial->count ?? 0) + ($request->count ?? 0);
            
            if ($totalAmount > 0) {
                $allCategories->push([
                    'category' => $category,
                    'label' => FinancialRecord::expenseCategories()[$category] 
                        ?? TreasuryRequest::expense_categories[$category] 
                        ?? $category,
                    'total_amount' => $totalAmount,
                    'count' => $totalCount,
                ]);
            }
        }

        $categoryBreakdown = $allCategories->sortByDesc('total_amount')->values();

        $incomeCategoryBreakdown = FinancialRecord::selectRaw('category, SUM(amount) as total_amount, COUNT(*) as count')
            ->where('type', 'income')
            ->whereNotNull('category')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'label' => FinancialRecord::incomeCategories()[$item->category] ?? $item->category,
                    'total_amount' => $item->total_amount,
                    'count' => $item->count,
                ];
            })
            ->sortByDesc('total_amount')
            ->values();

        $pendingApproval = TreasuryRequest::with(['requester:id,name', 'division:id,name', 'approvals.approver:id,name'])
            ->whereIn('status', ['submitted', 'under_review'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($req) {
                $req->approval_stage = $req->getApprovalStage();
                return $req;
            });

        return $this->success([
            'summary' => $summary,
            'chart_data' => $chartData,
            'category_breakdown' => $categoryBreakdown,
            'income_category_breakdown' => $incomeCategoryBreakdown,
            'pending_approval' => $pendingApproval,
            'categories' => TreasuryRequest::expense_categories,
            'year' => $year,
        ], 'Treasury statistics retrieved successfully');
    }

    // Upload an attachment for a treasury request
    public function uploadAttachment(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'treasury_request_id' => 'required|integer|exists:treasury_requests,id',
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::findOrFail($request->treasury_request_id);

        if ($treasuryRequest->requested_by !== $user->id) {
            return $this->forbidden('You can only add attachments to your own requests');
        }

        if (!in_array($treasuryRequest->status, ['draft', 'submitted', 'rejected'])) {
            return $this->error('Cannot add attachments to a request that is under review or processed');
        }

        if ($treasuryRequest->attachment_path) {
            Storage::disk('public')->delete($treasuryRequest->attachment_path);
        }

        $file = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('treasury_attachments', $filename, 'public');

        $treasuryRequest->update([
            'attachment_filename' => $filename,
            'attachment_original_name' => $file->getClientOriginalName(),
            'attachment_path' => $path,
            'attachment_type' => $file->getClientMimeType(),
            'attachment_size' => $file->getSize(),
        ]);

        return $this->success([
            'attachment' => [
                'filename' => $treasuryRequest->attachment_filename,
                'original_name' => $treasuryRequest->attachment_original_name,
                'path' => $treasuryRequest->attachment_path,
                'type' => $treasuryRequest->attachment_type,
                'size' => $treasuryRequest->attachment_size,
                'url' => Storage::disk('public')->url($path),
            ],
        ], 'Attachment uploaded successfully');
    }

    // Delete the attachment from a treasury request
    public function deleteAttachment(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized('Not authenticated');
        }

        $validator = Validator::make($request->all(), [
            'treasury_request_id' => 'required|integer|exists:treasury_requests,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $treasuryRequest = TreasuryRequest::findOrFail($request->treasury_request_id);

        if ($treasuryRequest->requested_by !== $user->id) {
            return $this->forbidden('You can only delete attachments from your own requests');
        }

        if (!in_array($treasuryRequest->status, ['draft', 'submitted', 'rejected'])) {
            return $this->error('Cannot delete attachments from a request that is under review or processed');
        }

        if (!$treasuryRequest->attachment_path) {
            return $this->error('No attachment to delete');
        }

        Storage::disk('public')->delete($treasuryRequest->attachment_path);

        $treasuryRequest->update([
            'attachment_filename' => null,
            'attachment_original_name' => null,
            'attachment_path' => null,
            'attachment_type' => null,
            'attachment_size' => null,
        ]);

        return $this->success(null, 'Attachment deleted successfully');
    }

    // Get list of expense categories
    public function categories(): JsonResponse
    {
        return $this->success([
            'categories' => TreasuryRequest::expense_categories,
        ], 'Categories retrieved successfully');
    }

    // Determine the approval level for the current user
    private function determineApprovalLevel($user, TreasuryRequest $treasuryRequest): ?string
    {
        $isTreasurer = $user->hasRole('treasurer');
        $isLeader = $user->hasRole('division_leader') ||
                    $user->hasRole('admin') ||
                    $user->hasRole('sysadmin') ||
                    $user->leadsDivisions()->exists();

        if ($isTreasurer && $treasuryRequest->hasLeaderApproval()) {
            return 'treasurer';
        }

        if ($isLeader && !$treasuryRequest->hasLeaderApproval()) {
            return 'leader';
        }

        if ($user->hasRole('sysadmin')) {
            if (!$treasuryRequest->hasLeaderApproval()) {
                return 'leader';
            }
            if (!$treasuryRequest->hasTreasurerApproval()) {
                return 'treasurer';
            }
        }

        return null;
    }

    // List financial records
    public function listRecords(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view treasury reports', 'You do not have permission to view financial records')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:income,expense',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'category' => 'nullable|string',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $perPage = $request->per_page ?? 20;

        $query = FinancialRecord::with(['creator:id,name', 'division:id,name', 'project:id,name', 'event:id,title']);

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->start_date && $request->end_date) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $records = $query->orderBy('record_date', 'desc')->paginate($perPage);

        return $this->success([
            'records' => $records->items(),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
            'income_categories' => FinancialRecord::INCOME_CATEGORIES,
            'expense_categories' => FinancialRecord::expense_categories,
        ], 'Financial records retrieved successfully');
    }

    // Create a new financial record
    public function createRecord(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view treasury reports', 'You do not have permission to create financial records')) {
            return $response;
        }

        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:income,expense',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'record_date' => 'required|date',
            'category' => 'required|string|max:100',
            'reference_number' => 'nullable|string|max:100',
            'division_id' => 'nullable|integer|exists:divisions,id',
            'project_id' => 'nullable|integer|exists:projects,id',
            'event_id' => 'nullable|integer|exists:events,id',
            'treasury_request_id' => 'nullable|integer|exists:treasury_requests,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $categories = $request->type === 'income' 
            ? array_keys(FinancialRecord::incomeCategories())
            : array_keys(FinancialRecord::expenseCategories());

        if (!in_array($request->category, $categories)) {
            return $this->error('Invalid category for this record type');
        }

        $record = FinancialRecord::create([
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'currency' => $request->currency ?? 'IDR',
            'record_date' => $request->record_date,
            'category' => $request->category,
            'reference_number' => $request->reference_number,
            'division_id' => $request->division_id,
            'project_id' => $request->project_id,
            'event_id' => $request->event_id,
            'treasury_request_id' => $request->treasury_request_id,
            'created_by' => $user->id,
        ]);

        return $this->success([
            'record' => $record->load(['creator:id,name', 'division:id,name']),
        ], 'Financial record created successfully');
    }

    // Update a financial record
    public function updateRecord(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view treasury reports', 'You do not have permission to update financial records')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:financial_records,id',
            'type' => 'nullable|in:income,expense',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'record_date' => 'nullable|date',
            'category' => 'nullable|string|max:100',
            'reference_number' => 'nullable|string|max:100',
            'division_id' => 'nullable|integer|exists:divisions,id',
            'project_id' => 'nullable|integer|exists:projects,id',
            'event_id' => 'nullable|integer|exists:events,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $record = FinancialRecord::findOrFail($request->id);
        
        $updateData = array_filter([
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'currency' => $request->currency,
            'record_date' => $request->record_date,
            'category' => $request->category,
            'reference_number' => $request->reference_number,
            'division_id' => $request->division_id,
            'project_id' => $request->project_id,
            'event_id' => $request->event_id,
        ], fn($v) => $v !== null);

        $record->update($updateData);
        $record->refresh();

        return $this->success([
            'record' => $record->load(['creator:id,name', 'division:id,name']),
        ], 'Financial record updated successfully');
    }

    // Delete a financial record
    public function deleteRecord(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view treasury reports', 'You do not have permission to delete financial records')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:financial_records,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $record = FinancialRecord::findOrFail($request->id);
        $record->delete();

        return $this->success(null, 'Financial record deleted successfully');
    }

    // Get financial record categories
    public function recordCategories(): JsonResponse
    {
        return $this->success([
            'income_categories' => FinancialRecord::incomeCategories(),
            'expense_categories' => FinancialRecord::expenseCategories(),
        ], 'Categories retrieved successfully');
    }
}
