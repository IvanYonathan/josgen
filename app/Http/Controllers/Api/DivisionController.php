<?php

namespace App\Http\Controllers\Api;

use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DivisionController extends ApiController
{
    public function list(Request $request): JsonResponse
    {
        if (!Auth::user()->can('view divisions')) {
            return $this->forbidden('You do not have permission to view divisions');
        }

        $divisions = Division::with('leader:id,name')
            ->withCount(['members', 'events', 'projects', 'todoLists'])
            ->get()
            ->makeHidden(['created_at', 'updated_at', 'leader_id']);

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

        if (!Auth::user()->can('view divisions')) {
            return $this->forbidden('You do not have permission to view divisions');
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
        if (!Auth::user()->can('create divisions')) {
            return $this->forbidden('You do not have permission to create divisions');
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

        if (!Auth::user()->can('edit divisions')) {
            return $this->forbidden('You do not have permission to edit divisions');
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

        if (!Auth::user()->can('delete divisions')) {
            return $this->forbidden('You do not have permission to delete divisions');
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

        if (!Auth::user()->can('view divisions')) {
            return $this->forbidden('You do not have permission to view division members');
        }

        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        $members = $division->members()->with('roles')->get();
        $availableUsers = User::whereNull('division_id')
            ->orWhere('division_id', '!=', $division->id)
            ->get(['id', 'name', 'email']);

        return $this->success([
            'members' => $members,
            'available_users' => $availableUsers,
        ], 'Division members retrieved successfully');
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
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        $user = User::findOrFail($request->user_id);
        $user->division_id = $division->id;
        $user->save();

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
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        // Update all users in bulk
        User::whereIn('id', $request->user_ids)
            ->update(['division_id' => $division->id]);

        $addedCount = count($request->user_ids);

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
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;

        if (!$canManageMembers) {
            return $this->forbidden('You do not have permission to manage division members');
        }

        $user = User::findOrFail($request->user_id);

        // Don't remove the leader from the division
        if ($user->id === $division->leader_id) {
            return $this->error('Cannot remove the division leader');
        }

        $user->division_id = null;
        $user->save();

        return $this->success(null, 'Member removed successfully');
    }
}