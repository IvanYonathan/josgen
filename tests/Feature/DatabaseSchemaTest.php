<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Event;
use App\Models\Note;
use App\Models\Project;
use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_division_relationship(): void
    {
        // Run the seeders to populate the database
        $this->seed();

        // Get a user who belongs to a division
        $leader = User::where('email', 'leader@josgen.org')->first();
        $this->assertNotNull($leader);
        
        $division = Division::where('name', 'Worship Team')->first();
        $this->assertNotNull($division);
        
        // Manually update the division_id to make sure it's correct
        $leader->division_id = $division->id;
        $leader->save();
        
        // Now test the relationship
        $this->assertEquals($division->id, $leader->division->id);
        $this->assertEquals($division->name, $leader->division->name);
        
        // Refresh the division model
        $division->refresh();
        
        // Now this should work
        $userIds = $division->members->pluck('id')->toArray();
        $this->assertContains($leader->id, $userIds);
    }

    public function test_division_leader_relationship(): void
    {
        $this->seed();

        $division = Division::where('name', 'Worship Team')->first();
        $this->assertNotNull($division);
        
        $leader = User::where('email', 'leader@josgen.org')->first();
        $this->assertNotNull($leader);
        
        // Update the leader_id to ensure it's correct
        $division->leader_id = $leader->id;
        $division->save();
        
        // Refresh models to ensure we have the latest data
        $division->refresh();
        $leader->refresh();
        
        // Now test the relationship
        $this->assertEquals($leader->id, $division->leader->id);
        
        // Check the reverse relationship
        $leaderDivisions = $leader->leadsDivisions->pluck('id')->toArray();
        $this->assertContains($division->id, $leaderDivisions);
    }

    public function test_event_relationships(): void
    {
        $this->seed();

        $event = Event::where('title', 'Sunday Service')->first();
        $this->assertNotNull($event);
        
        $division = Division::where('name', 'Worship Team')->first();
        $this->assertNotNull($division);
        
        $organizer = User::where('email', 'leader@josgen.org')->first();
        $this->assertNotNull($organizer);
        
        // Update relationships to ensure they're correct
        $event->division_id = $division->id;
        $event->organizer_id = $organizer->id;
        $event->save();
        
        // Refresh models
        $event->refresh();
        
        // Test event belongs to division and organizer
        $this->assertEquals($division->id, $event->division->id);
        $this->assertEquals($organizer->id, $event->organizer->id);

        // Test event has participants
        $member = User::where('email', 'member@josgen.org')->first();
        $this->assertNotNull($member);
        
        // Ensure the participant relationship exists
        if (!$event->participants->contains($member)) {
            $event->participants()->attach($member, [
                'attendance_status' => 'confirmed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        $event->refresh();
        $this->assertTrue($event->participants->isNotEmpty());
        $this->assertTrue($event->participants->contains($member));

        // Test user can see events they're participating in
        $member->refresh();
        $this->assertTrue($member->participatingEvents->contains($event));
    }

    public function test_project_relationships(): void
    {
        $this->seed();

        $project = Project::where('name', 'Website Redesign')->first();
        $manager = User::where('email', 'admin@josgen.org')->first();

        // Ensure relationships are correct
        $project->manager_id = $manager->id;
        $project->save();
        $project->refresh();

        // Test project belongs to manager
        $this->assertEquals($manager->id, $project->manager->id);

        // Test project has members
        $leader = User::where('email', 'leader@josgen.org')->first();
        if (!$project->members->contains($leader)) {
            $project->members()->attach($leader, [
                'role' => 'contributor',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        $project->refresh();
        $this->assertTrue($project->members->isNotEmpty());
        $this->assertTrue($project->members->contains($leader));

        // Test user can see projects they're members of
        $leader->refresh();
        $this->assertTrue($leader->memberProjects->contains($project));
    }

    public function test_todo_list_and_items_relationships(): void
    {
        $this->seed();

        // Test personal todo list
        $member = User::where('email', 'member@josgen.org')->first();
        $personalList = TodoList::where([
            'type' => 'personal',
            'user_id' => $member->id
        ])->first();
        
        if (!$personalList) {
            $personalList = TodoList::create([
                'title' => 'My Tasks',
                'type' => 'personal',
                'user_id' => $member->id,
            ]);
        }
        
        $this->assertEquals($member->id, $personalList->user->id);
        $this->assertEquals('personal', $personalList->type);
        $this->assertNull($personalList->division_id);
        
        // Test division todo list
        $leader = User::where('email', 'leader@josgen.org')->first();
        $division = Division::where('name', 'Worship Team')->first();
        
        $divisionList = TodoList::where([
            'type' => 'division',
            'division_id' => $division->id
        ])->first();
        
        if (!$divisionList) {
            $divisionList = TodoList::create([
                'title' => 'Worship Team Tasks',
                'type' => 'division',
                'user_id' => $leader->id,
                'division_id' => $division->id,
            ]);
        }
        
        $this->assertEquals('division', $divisionList->type);
        $this->assertNotNull($divisionList->division);
        
        // Test todo items
        $todoItem = TodoItem::where('title', 'Prepare Sunday slides')->first();
        if (!$todoItem) {
            $todoItem = TodoItem::create([
                'title' => 'Prepare Sunday slides',
                'description' => 'Create presentation for Sunday service',
                'completed' => false,
                'due_date' => now()->addDays(2),
                'priority' => 'high',
                'todo_list_id' => $divisionList->id,
                'assigned_to' => $member->id,
            ]);
        } else {
            $todoItem->todo_list_id = $divisionList->id;
            $todoItem->assigned_to = $member->id;
            $todoItem->save();
        }
        
        $todoItem->refresh();
        $divisionList->refresh();
        
        $this->assertNotEmpty($divisionList->items);
        $this->assertEquals($divisionList->id, $todoItem->todoList->id);
        $this->assertEquals($member->id, $todoItem->assignedTo->id);
        
        // Test user can see assigned tasks
        $member->refresh();
        $this->assertTrue($member->assignedTodoItems->contains($todoItem));
    }

    public function test_notes_relationships(): void
    {
        $this->seed();

        // Get division and users
        $leader = User::where('email', 'leader@josgen.org')->first();
        $division = Division::where('name', 'Worship Team')->first();
        
        // Test division note
        $divisionNote = Note::where('title', 'Service Notes')->first();
        if (!$divisionNote) {
            $divisionNote = Note::create([
                'title' => 'Service Notes',
                'content' => 'Remember to include the new song in next Sunday\'s worship set.',
                'user_id' => $leader->id,
                'division_id' => $division->id,
                'is_private' => false,
            ]);
        } else {
            $divisionNote->user_id = $leader->id;
            $divisionNote->division_id = $division->id;
            $divisionNote->save();
        }
        
        $divisionNote->refresh();
        
        $this->assertEquals($leader->id, $divisionNote->user->id);
        $this->assertEquals($division->id, $divisionNote->division->id);
        $this->assertFalse($divisionNote->is_private);
        
        // Test personal note
        $member = User::where('email', 'member@josgen.org')->first();
        $personalNote = Note::where('title', 'Personal Reminder')->first();
        if (!$personalNote) {
            $personalNote = Note::create([
                'title' => 'Personal Reminder',
                'content' => 'Call the sound guy about microphone issues.',
                'user_id' => $member->id,
                'is_private' => true,
            ]);
        }
        
        $this->assertTrue($personalNote->is_private);
        $this->assertNull($personalNote->division_id);
    }

    public function test_treasury_request_relationships(): void
    {
        $this->seed();

        // Get users and division
        $leader = User::where('email', 'leader@josgen.org')->first();
        $treasurer = User::where('email', 'treasurer@josgen.org')->first();
        $division = Division::where('name', 'Worship Team')->first();
        
        // Test fund request
        $fundRequest = TreasuryRequest::where('title', 'Youth Camp Supplies')->first();
        if (!$fundRequest) {
            $fundRequest = TreasuryRequest::create([
                'type' => 'fund_request',
                'title' => 'Youth Camp Supplies',
                'description' => 'Funds needed for youth camp activities',
                'amount' => 5000000, // 5 million (assuming IDR)
                'request_date' => now(),
                'needed_by_date' => now()->addWeeks(2),
                'status' => 'submitted',
                'requested_by' => $leader->id,
                'division_id' => $division->id,
            ]);
        } else {
            $fundRequest->requested_by = $leader->id;
            $fundRequest->division_id = $division->id;
            $fundRequest->save();
        }
        
        $fundRequest->refresh();
        
        $this->assertEquals($leader->id, $fundRequest->requester->id);
        $this->assertEquals($division->id, $fundRequest->division->id);
        $this->assertEquals('fund_request', $fundRequest->type);
        $this->assertEquals('submitted', $fundRequest->status);
        
        // Test approved request
        $approvedRequest = TreasuryRequest::where('title', 'Sound Equipment')->first();
        if (!$approvedRequest) {
            $approvedRequest = TreasuryRequest::create([
                'type' => 'reimbursement',
                'title' => 'Sound Equipment',
                'description' => 'Reimbursement for microphone purchase',
                'amount' => 1500000, // 1.5 million (assuming IDR)
                'request_date' => now()->subDays(3),
                'status' => 'approved',
                'requested_by' => $leader->id,
                'division_id' => $division->id,
                'approved_by' => $treasurer->id,
                'approved_at' => now()->subDay(),
                'approval_notes' => 'Approved with receipt verification',
            ]);
        } else {
            $approvedRequest->approved_by = $treasurer->id;
            $approvedRequest->save();
        }
        
        $approvedRequest->refresh();
        
        $this->assertEquals('approved', $approvedRequest->status);
        $this->assertEquals($treasurer->id, $approvedRequest->approver->id);
        $this->assertNotNull($approvedRequest->approved_at);
    }

    public function test_user_roles_and_permissions(): void
    {
        $this->seed();

        $admin = User::where('email', 'admin@josgen.org')->first();
        $leader = User::where('email', 'leader@josgen.org')->first();
        $treasurer = User::where('email', 'treasurer@josgen.org')->first();
        $member = User::where('email', 'member@josgen.org')->first();
        
        // Test roles
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertTrue($leader->hasRole('division_leader'));
        $this->assertTrue($treasurer->hasRole('treasurer'));
        $this->assertTrue($member->hasRole('member'));
        
        // Test permissions
        $this->assertTrue($admin->can('approve treasury requests'));
        $this->assertTrue($treasurer->can('approve treasury requests'));
        $this->assertFalse($leader->can('approve treasury requests'));
        $this->assertFalse($member->can('approve treasury requests'));
        
        $this->assertTrue($leader->can('create events'));
        $this->assertFalse($member->can('create events'));
        
        $this->assertTrue($member->can('create todo lists'));
        $this->assertTrue($member->can('create treasury requests'));
    }
}