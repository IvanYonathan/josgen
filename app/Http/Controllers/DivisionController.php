<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DivisionController extends Controller
{

    public function index()
    {
        // Check permission
        if (!Auth::user()->can('view divisions')) {
            abort(403);
        }
        
        $divisions = Division::with('leader')
            ->withCount(['members', 'events', 'projects', 'todoLists'])
            ->get();

        return Inertia::render('division/index', [
            'divisions' => $divisions,
            'canCreate' => Auth::user()->can('create divisions'),
        ]);
    }

    public function create()
    {
        if (!Auth::user()->can('create divisions')) {
            abort(403);
        }
        
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        
        return Inertia::render('division.create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('create divisions')) {
        abort(403);
        }

        $validated = $request->validate([
        'name' => 'required|string|max:255|unique:divisions',
        'description' => 'nullable|string',
        'leader_id' => 'nullable|exists:users,id',
        ]);

        $division = Division::create($validated);

        return redirect()->route('divisions.show', $division)
        ->with('success', 'Division created successfully.');
    }

    public function show(Division $division)
    {
        if (!Auth::user()->can('view divisions')) {
        abort(403);
    }

        $division->load(['leader', 'members', 'events', 'projects', 'todoLists']);
    
        return Inertia::render('division/show', [
        'division' => $division,
        'canEdit' => Auth::user()->can('edit divisions'),
        'canDelete' => Auth::user()->can('delete divisions'),
        'isLeader' => Auth::user()->id === $division->leader_id,
      ]);
    }

    public function edit(Division $division)
    {
        if (!Auth::user()->can('edit divisions')) {
            abort(403);
        }
    
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        
        return Inertia::render('division/edit', [
            'division' => $division,
            'users' => $users,
        ]);
    }

    public function update(Request $request, Division $division)
    {
        if (!Auth::user()->can('edit divisions')) {
            abort(403);
        }
    
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('divisions')->ignore($division)],
            'description' => 'nullable|string',
            'leader_id' => 'nullable|exists:users,id',
        ]);
    
        $division->update($validated);
    
        return redirect()->route('divisions.show', $division)
            ->with('success', 'Division updated successfully.');
    }

    public function destroy(Division $division)
    {
        if (!Auth::user()->can('delete divisions')) {
            abort(403);
        }
    
        $division->delete();
    
        return redirect()->route('divisions.index')
            ->with('success', 'Division deleted successfully.');
    }

    public function members(Division $division)
    {
        if (!Auth::user()->can('view divisions')) {
            abort(403);
        }
    
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;
        
        if (!$canManageMembers) {
            abort(403, 'You do not have permission to manage division members');
        }
    
        return Inertia::render('division/members', [
            'division' => $division->load('leader'),
            'members' => $division->members()->with('roles')->get(),
            'availableUsers' => User::whereNull('division_id')
                ->orWhere('division_id', '!=', $division->id)
                ->get(['id', 'name', 'email']),
            'canManageMembers' => $canManageMembers,
        ]);
    }

    public function addMember(Request $request, Division $division)
    {
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;
        
        if (!$canManageMembers) {
            abort(403, 'You do not have permission to manage division members');
        }
    
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
    
        $user = User::find($validated['user_id']);
        $user->division_id = $division->id;
        $user->save();
    
        return back()->with('success', 'Member added successfully.');
    }

    public function removeMember(Request $request, Division $division)
    {
        $canManageMembers = Auth::user()->can('edit divisions') || Auth::user()->id === $division->leader_id;
        
        if (!$canManageMembers) {
            abort(403, 'You do not have permission to manage division members');
        }
    
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
    
        $user = User::find($validated['user_id']);
        
        // Don't remove the leader from the division
        if ($user->id === $division->leader_id) {
            return back()->with('error', 'Cannot remove the division leader.');
        }
        
        $user->division_id = null;
        $user->save();
    
        return back()->with('success', 'Member removed successfully.');
    }
}