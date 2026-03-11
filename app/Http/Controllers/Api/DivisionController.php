<?php

namespace App\Http\Controllers\Api;

use App\Models\Division;
use App\Models\User;
use App\Notifications\Division\DivisionMemberAddedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DivisionController extends ApiController
{
    public function list(Request $request): JsonResponse
    {
        $canViewAll = $this->hasPermission('view all divisions');
        $canViewOwn = $this->hasPermission('view own divisions');

        if (!$canViewAll && !$canViewOwn) {
            return $this->forbidden('You do not have permission to view divisions');
        }

        $query = Division::with('leader:id,name')
            ->withCount(['members', 'events', 'projects', 'todoLists']);

        if (!$canViewAll) {
            $query->whereIn('id', Auth::user()->ownDivisionIds());
        }

        $divisions = $query->get()->makeHidden(['created_at', 'updated_at', 'leader_id']);

        return $this->success($divisions, 'Divisions retrieved successfully', $divisions->count());
    }

    public function get(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $canViewAll = $this->hasPermission('view all divisions');
        $canViewOwn = $this->hasPermission('view own divisions');

        if (!$canViewAll && !$canViewOwn) {
            return $this->forbidden('You do not have permission to view divisions');
        }

        if (!$canViewAll && !in_array((int) $request->id, Auth::user()->ownDivisionIds())) {
            return $this->forbidden('You do not have permission to view this division');
        }

        $division = Division::with(['leader', 'members', 'events', 'projects', 'todoLists'])
            ->withCount(['members', 'events', 'projects', 'todoLists'])
            ->findOrFail($request->id);

        return $this->success([
            'division' => $division,
        ], 'Division retrieved successfully');
    }

    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create divisions', 'You do not have permission to create divisions')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:divisions',
            'description' => 'nullable|string',
            'leader_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::create($validator->validated());

        return $this->success([
            'division' => $division->load('leader'),
        ], 'Division created successfully');
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:divisions,id',
            'name' => ['required', 'string', 'max:255'],
            'description' => 'nullable|string',
            'leader_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->id)
        ->makeHidden(['created_at', 'leader_id']);

        if ($response = $this->ensurePermission('edit divisions', 'You do not have permission to edit divisions')) {
            return $response;
        }

        // Add unique validation for name excluding current division
        $nameValidator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', Rule::unique('divisions')->ignore($division)],
        ]);

        if ($nameValidator->fails()) {
            return $this->validationError($nameValidator->errors());
        }

        $division->update($validator->validated());

        return $this->success([
            'division' => $division->load('leader'),
        ], 'Division updated successfully');
    }

    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->id);

        if ($response = $this->ensurePermission('delete divisions', 'You do not have permission to delete divisions')) {
            return $response;
        }

        $division->delete();

        return $this->success(null, 'Division deleted successfully');
    }

    public function membersList(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|integer|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->division_id);

        $canViewAll = $this->hasPermission('view all divisions');
        $canViewOwn = $this->hasPermission('view own divisions');
        $canViewMembers = $this->hasPermission('view division members');

        if (!$canViewAll && !$canViewOwn && !$canViewMembers) {
            return $this->forbidden('You do not have permission to view division members');
        }

        if (!$canViewAll && !in_array((int) $request->division_id, Auth::user()->ownDivisionIds())) {
            return $this->forbidden('You do not have permission to view this division');
        }

        $canManageMembers = $this->hasPermission('edit divisions') || Auth::user()->id === $division->leader_id;

        $members = $division->members()->with('roles')->get();

        $data = [
            'members' => $members,
            'can_manage_members' => $canManageMembers,
        ];

        // Only include available users if the user can manage members
        if ($canManageMembers) {
            $existingMemberIds = $division->members()->pluck('users.id')->toArray();
            $data['available_users'] = User::whereNotIn('id', $existingMemberIds)
                ->get(['id', 'name', 'email']);
        } else {
            $data['available_users'] = [];
        }

        return $this->success($data, 'Division members retrieved successfully');
    }

    public function addMember(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|integer|exists:divisions,id',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->division_id);
        $canManageMembers = $this->hasPermission('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        $user = User::findOrFail($request->user_id);

        // Check if user is already a member
        if ($division->members()->where('user_id', $user->id)->exists()) {
            return $this->error('User is already a member of this division');
        }

        // Add user to division via pivot table
        $division->members()->attach($user->id);

        $user->notify(new DivisionMemberAddedNotification($division, Auth::user()));

        return $this->success(null, 'Member added successfully');
    }

    public function addMembers(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|integer|exists:divisions,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->division_id);
        $canManageMembers = $this->hasPermission('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        // Get existing member IDs to avoid duplicates
        $existingMemberIds = $division->members()->pluck('users.id')->toArray();
        $newMemberIds = array_diff($request->user_ids, $existingMemberIds);

        if (empty($newMemberIds)) {
            return $this->error('All selected users are already members of this division');
        }

        // Add users to division via pivot table
        $division->members()->attach($newMemberIds);

        $newMembers = User::whereIn('id', $newMemberIds)->get();
        foreach ($newMembers as $member) {
            $member->notify(new DivisionMemberAddedNotification($division, Auth::user()));
        }

        $addedCount = count($newMemberIds);

        return $this->success(null, "Successfully added {$addedCount} member(s) to the division");
    }

    public function removeMember(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|integer|exists:divisions,id',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $division = Division::findOrFail($request->division_id);
        $canManageMembers = $this->hasPermission('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        $user = User::findOrFail($request->user_id);

        // Don't remove the leader from the division
        if ($user->id === $division->leader_id) {
            return $this->error('Cannot remove the division leader');
        }

        // Check if user is a member of this division
        if (!$division->members()->where('user_id', $user->id)->exists()) {
            return $this->error('User is not a member of this division');
        }

        // Remove user from division via pivot table
        $division->members()->detach($user->id);

        return $this->success(null, 'Member removed successfully');
    }
}