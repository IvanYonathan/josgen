<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Event;
use App\Models\Note;
use App\Models\Project;
use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\TreasuryRequest;
use App\Models\TreasuryRequestItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Get some users to work with
        $admin = User::where('email', 'admin@josgen.org')->first();
        $leader = User::where('email', 'leader@josgen.org')->first();
        $treasurer = User::where('email', 'treasurer@josgen.org')->first();
        $member = User::where('email', 'member@josgen.org')->first();
        
        // Create divisions
        $worship = Division::create([
            'name' => 'Worship Team',
            'description' => 'Music and worship coordination team',
            'leader_id' => $leader->id,
        ]);
        
        $outreach = Division::create([
            'name' => 'Outreach',
            'description' => 'Community outreach and evangelism',
            'leader_id' => $admin->id,
        ]);
        
        // Connect users to divisions
        $leader->division_id = $worship->id;
        $leader->save();
        
        $member->division_id = $worship->id;
        $member->save();
        
        // Create events
        $event1 = Event::create([
            'title' => 'Sunday Service',
            'description' => 'Weekly worship service',
            'start_date' => now()->addDays(3)->setHour(10)->setMinute(0),
            'end_date' => now()->addDays(3)->setHour(12)->setMinute(0),
            'location' => 'Main Sanctuary',
            'status' => 'upcoming',
            'organizer_id' => $leader->id,
            'division_id' => $worship->id,
        ]);
        
        $event2 = Event::create([
            'title' => 'Youth Camp',
            'description' => 'Annual youth retreat',
            'start_date' => now()->addMonth()->startOfMonth(),
            'end_date' => now()->addMonth()->startOfMonth()->addDays(3),
            'location' => 'Mountain Retreat Center',
            'status' => 'upcoming',
            'organizer_id' => $admin->id,
        ]);
        
        // Add event participants
        $event1->participants()->attach([$admin->id, $leader->id, $member->id], [
            'attendance_status' => 'confirmed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create projects
        $project = Project::create([
            'name' => 'Website Redesign',
            'description' => 'Redesigning church website',
            'start_date' => now()->subDays(30),
            'end_date' => now()->addDays(60),
            'status' => 'active',
            'manager_id' => $admin->id,
        ]);
        
        // Add project members
        $project->members()->attach([$leader->id, $member->id], [
            'role' => 'contributor',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create todo lists and items
        $personalTodo = TodoList::create([
            'title' => 'My Tasks',
            'type' => 'personal',
            'user_id' => $member->id,
        ]);
        
        $divisionTodo = TodoList::create([
            'title' => 'Worship Team Tasks',
            'type' => 'division',
            'user_id' => $leader->id,
            'division_id' => $worship->id,
        ]);
        
        // Add todo items
        TodoItem::create([
            'title' => 'Prepare Sunday slides',
            'description' => 'Create presentation for Sunday service',
            'completed' => false,
            'due_date' => now()->addDays(2),
            'priority' => 'high',
            'todo_list_id' => $divisionTodo->id,
            'assigned_to' => $member->id,
        ]);
        
        TodoItem::create([
            'title' => 'Buy groceries',
            'description' => 'Personal shopping list',
            'completed' => false,
            'due_date' => now()->addDay(),
            'priority' => 'medium',
            'todo_list_id' => $personalTodo->id,
        ]);
        
        // Create notes
        Note::create([
            'title' => 'Service Notes',
            'content' => 'Remember to include the new song in next Sunday\'s worship set.',
            'user_id' => $leader->id,
            'division_id' => $worship->id,
            'is_private' => false,
        ]);
        
        Note::create([
            'title' => 'Personal Reminder',
            'content' => 'Call the sound guy about microphone issues.',
            'user_id' => $member->id,
            'is_private' => true,
        ]);
        
        // Create treasury requests
        $treasuryRequest = TreasuryRequest::create([
            'type' => 'fund_request',
            'title' => 'Youth Camp Supplies',
            'description' => 'Funds needed for youth camp activities',
            'amount' => 5000000, // 5 million (assuming IDR)
            'request_date' => now(),
            'needed_by_date' => now()->addWeeks(2),
            'status' => 'submitted',
            'requested_by' => $leader->id,
            'division_id' => $worship->id,
        ]);
        
        // Add treasury request items
        TreasuryRequestItem::create([
            'treasury_request_id' => $treasuryRequest->id,
            'description' => 'Food and beverages',
            'amount' => 2000000,
            'category' => 'Food',
        ]);
        
        TreasuryRequestItem::create([
            'treasury_request_id' => $treasuryRequest->id,
            'description' => 'Transportation',
            'amount' => 1500000,
            'category' => 'Transportation',
        ]);
        
        TreasuryRequestItem::create([
            'treasury_request_id' => $treasuryRequest->id,
            'description' => 'Activity materials',
            'amount' => 1500000,
            'category' => 'Supplies',
        ]);
        
        // Create an approved request
        $approvedRequest = TreasuryRequest::create([
            'type' => 'reimbursement',
            'title' => 'Sound Equipment',
            'description' => 'Reimbursement for microphone purchase',
            'amount' => 1500000, // 1.5 million (assuming IDR)
            'request_date' => now()->subDays(3),
            'status' => 'approved',
            'requested_by' => $leader->id,
            'division_id' => $worship->id,
            'approved_by' => $treasurer->id,
            'approved_at' => now()->subDay(),
            'approval_notes' => 'Approved with receipt verification',
        ]);
        
        TreasuryRequestItem::create([
            'treasury_request_id' => $approvedRequest->id,
            'description' => 'Wireless Microphone',
            'amount' => 1500000,
            'category' => 'Equipment',
            'item_date' => now()->subDays(5),
        ]);
    }
}