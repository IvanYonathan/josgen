import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  PlusCircle,
  Users,
  CalendarDays,
  Briefcase,
  ListTodo,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  UserMinus
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Division, DivisionListResponse, UpdateDivisionRequest } from '@/types/division/division';
import { DivisionMembersResponse } from '@/types/division/members/division-members';
import { User } from '@/types/user/user';
import { CreateDivisionSheet } from './components/create-division-sheet';
import { BulkMemberSelectionDialog } from './components/bulk-member-selection-dialog';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { me } from '@/lib/api/auth/me';
import { getDivision } from '@/lib/api/division/get-division';
import { updateDivision } from '@/lib/api/division/update-division';
import { deleteDivision } from '@/lib/api/division/delete-division';
import { listDivisionMembers } from '@/lib/api/division/members/list-division-members';
import { removeDivisionMember } from '@/lib/api/division/members/remove-division-members';
import { listUsers } from '@/lib/api/user/list-users';

//TODO (Ivan Yonathan) : Add pagination
//TODO (Ivan Yonathan) : Add sorting
//TODO (Ivan Yonathan) : Add filtering
//TODO (Ivan Yonathan) : Add searching

type ViewMode = 'list' | 'detail';

export default function DivisionPage() {
    const { t } = useTranslation('division');

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);

    // Division list state
    const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [canCreate, setCanCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Division detail state
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [divisionMembers, setDivisionMembers] = useState<DivisionMembersResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});

    // Sheet and dialog states
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [memberSelectionOpen, setMemberSelectionOpen] = useState(false);

    // Form state for editing division
    const [formData, setFormData] = useState<UpdateDivisionRequest>({
        id: 0,
        name: '',
        description: '',
        leader_id: undefined,
    });

    // Load initial data on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load initial data (divisions and permissions)
    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load divisions and user permissions in parallel
            const [divisionsResponse, userResponse] = await Promise.all([
                listDivisions(),
                me()
            ]);

            setDivisions(divisionsResponse.divisions);
            setCanCreate(userResponse.permissions.can_create_divisions);

            // TODO: Load users list via API when needed for CreateDivisionSheet
            setUsers([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            setCanCreate(false);
        } finally {
            setLoading(false);
        }
    };

    // Load divisions from API (for refresh button)
    const loadDivisions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await listDivisions();
            setDivisions(response.divisions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load divisions');
        } finally {
            setLoading(false);
        }
    };

    // Handle division card click - switch to detail view
    const handleDivisionClick = (divisionId: number) => {
        setSelectedDivisionId(divisionId);
        setViewMode('detail');
        loadDivisionDetail(divisionId);
    };

    // Load division detail data
    const loadDivisionDetail = async (divisionId: number) => {
        try {
            setDetailLoading(true);
            setDetailError(null);

            // Load division details, members, and users in parallel
            const [divisionResponse, membersResponse, usersResponse] = await Promise.all([
                getDivision({ id: divisionId }),
                listDivisionMembers({ division_id: divisionId }),
                listUsers()
            ]);

            setSelectedDivision(divisionResponse.division);
            setDivisionMembers(membersResponse);
            setAvailableUsers(usersResponse.users);

            // Set form data for editing
            setFormData({
                id: divisionResponse.division.id,
                name: divisionResponse.division.name,
                description: divisionResponse.division.description || '',
                leader_id: divisionResponse.division.leader_id || undefined,
            });
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : 'Failed to load division details');
        } finally {
            setDetailLoading(false);
        }
    };

    // Handle back to list
    const handleBackToList = async () => {
        setViewMode('list');
        setSelectedDivisionId(null);
        setSelectedDivision(null);
        setDivisionMembers(null);
        setIsEditing(false);
        setDetailErrors({});

        // Refresh the division list to get updated data
        await loadDivisions();
    };

    // Handle division creation
    const handleDivisionCreated = async (newDivision: Division) => {
        // Reload the entire division list to ensure proper data synchronization
        await loadDivisions();
    };

    // Handle division editing
    const handleEdit = () => {
        setIsEditing(true);
        setDetailErrors({});
    };

    const handleCancelEdit = () => {
        if (!selectedDivision) return;

        // Reset form data
        setFormData({
            id: selectedDivision.id,
            name: selectedDivision.name,
            description: selectedDivision.description || '',
            leader_id: selectedDivision.leader_id || undefined,
        });
        setIsEditing(false);
        setDetailErrors({});
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setDetailErrors({ name: 'Division name is required' });
            return;
        }

        try {
            setSaveLoading(true);
            setDetailErrors({});

            const response = await updateDivision(formData);
            setSelectedDivision(response.division);
            setIsEditing(false);

            // Update the division in the list as well
            setDivisions(prev =>
                prev.map(div => div.id === response.division.id ? response.division : div)
            );
        } catch (error) {
            setDetailErrors({
                general: error instanceof Error ? error.message : 'Failed to update division'
            });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDivision) return;

        try {
            setDeleteLoading(true);
            await deleteDivision({ id: selectedDivision.id });

            // Remove from divisions list and go back to list view
            setDivisions(prev => prev.filter(div => div.id !== selectedDivision.id));
            handleBackToList();
        } catch (error) {
            setDetailErrors({
                general: error instanceof Error ? error.message : 'Failed to delete division'
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle member management
    const handleRemoveMember = async (userId: number) => {
        if (!selectedDivision) return;

        try {
            await removeDivisionMember({
                division_id: selectedDivision.id,
                user_id: userId,
            });

            // Reload both members and division data to update counts
            const [membersResponse, divisionResponse] = await Promise.all([
                listDivisionMembers({ division_id: selectedDivision.id }),
                getDivision({ id: selectedDivision.id })
            ]);

            setDivisionMembers(membersResponse);
            setSelectedDivision(divisionResponse.division);
        } catch (error) {
            setDetailErrors({
                general: error instanceof Error ? error.message : 'Failed to remove member'
            });
        }
    };

    const handleMembersAdded = async () => {
        // Reload both members and division data after bulk addition
        if (!selectedDivision) return;

        try {
            const [membersResponse, divisionResponse] = await Promise.all([
                listDivisionMembers({ division_id: selectedDivision.id }),
                getDivision({ id: selectedDivision.id })
            ]);

            setDivisionMembers(membersResponse);
            setSelectedDivision(divisionResponse.division);
        } catch (error) {
            setDetailErrors({
                general: error instanceof Error ? error.message : 'Failed to reload members'
            });
        }
    };

    // Handle tab changes and trigger appropriate data refetch
    const handleTabChange = async (tabValue: string) => {
        if (!selectedDivision) return;

        try {
            switch (tabValue) {
                case 'members':
                    // Refetch division members data
                    const membersResponse = await listDivisionMembers({ division_id: selectedDivision.id });
                    setDivisionMembers(membersResponse);
                    break;
                case 'overview':
                    // Refetch complete division data to get updated counts
                    const divisionResponse = await getDivision({ id: selectedDivision.id });
                    setSelectedDivision(divisionResponse.division);
                    break;
                case 'projects':
                    // TODO: Implement project refetch when project API is ready
                    console.log('Projects tab selected - will implement refetch when project API is ready');
                    break;
                case 'todo-lists':
                    // TODO: Implement todo lists refetch when todo lists API is ready
                    console.log('Todo Lists tab selected - will implement refetch when todo lists API is ready');
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Failed to refetch tab data:', error);
            setDetailErrors({
                general: error instanceof Error ? error.message : 'Failed to refresh data'
            });
        }
    };


    // Breadcrumbs now handled by DashboardLayout

    return (
        <>
            {/* Layout and breadcrumbs now handled by DashboardLayout */}

                {viewMode === 'list' ? (
                    // DIVISION LIST VIEW
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold">{t('title')}</h1>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadDivisions}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {canCreate && (
                                <Button onClick={() => setCreateSheetOpen(true)}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    {t('createDivision.button.create')}
                                </Button>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {error}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : divisions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No divisions found</p>
                                {canCreate && (
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setCreateSheetOpen(true)}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create your first division
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {divisions.map(division => (
                                    <Card
                                        key={division.id}
                                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleDivisionClick(division.id)}
                                    >
                                        <CardHeader className="pb-3">
                                            <CardTitle className="hover:text-primary transition-colors">
                                                {division.name}
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                            <p className="text-muted-foreground line-clamp-3">
                                                {division.description || 'No description provided'}
                                            </p>

                                            <div className="mt-4">
                                                <p className="text-sm flex items-center gap-1">
                                                    <span className="font-medium">Leader:</span>
                                                    {division.leader ? division.leader.name : 'None assigned'}
                                                </p>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="flex justify-between border-t pt-4">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {division.members_count || 0}
                                            </Badge>

                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" />
                                                {division.events_count || 0}
                                            </Badge>

                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {division.projects_count || 0}
                                            </Badge>

                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <ListTodo className="h-3 w-3" />
                                                {division.todo_lists_count || 0}
                                            </Badge>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // DIVISION DETAIL VIEW
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBackToList}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold">{selectedDivision?.name || 'Loading...'}</h1>
                                    {selectedDivision?.description && (
                                        <p className="text-muted-foreground">{selectedDivision.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            disabled={saveLoading}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={saveLoading}
                                        >
                                            {saveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            <Save className="h-4 w-4 mr-2" />
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={handleEdit}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Error Display */}
                        {detailError && (
                            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {detailError}
                            </div>
                        )}

                        {detailErrors.general && (
                            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {detailErrors.general}
                            </div>
                        )}

                        {detailLoading ? (
                            <div className="flex items-center justify-center min-h-[400px]">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : selectedDivision ? (
                            <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="members">Members</TabsTrigger>
                                    <TabsTrigger value="projects">Projects</TabsTrigger>
                                    <TabsTrigger value="todo-lists">Todo Lists</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Division Information</CardTitle>
                                            <CardDescription>
                                                {isEditing ? 'Edit division details' : 'View division details'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {isEditing ? (
                                                <>
                                                    {/* Edit Form */}
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">Division Name *</Label>
                                                        <Input
                                                            id="name"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                            placeholder="Enter division name"
                                                            className={detailErrors.name ? 'border-red-500' : ''}
                                                        />
                                                        {detailErrors.name && (
                                                            <p className="text-sm text-red-600">{detailErrors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="description">Description</Label>
                                                        <Textarea
                                                            id="description"
                                                            value={formData.description}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                            placeholder="Enter division description"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="leader">Leader</Label>
                                                        <Select
                                                            value={formData.leader_id?.toString() || 'none'}
                                                            onValueChange={(value) => setFormData(prev => ({
                                                                ...prev,
                                                                leader_id: value === 'none' ? undefined : parseInt(value)
                                                            }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select leader" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No leader</SelectItem> {/*TODO: May need refactor */}
                                                                {availableUsers.map(user => (
                                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                                        {user.name} ({user.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* View Mode */}
                                                    <div>
                                                        <h4 className="font-medium text-sm text-gray-500">Division Name</h4>
                                                        <p className="mt-1">{selectedDivision.name}</p>
                                                    </div>
                                                    {selectedDivision.description && (
                                                        <div>
                                                            <h4 className="font-medium text-sm text-gray-500">Description</h4>
                                                            <p className="mt-1">{selectedDivision.description}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium text-sm text-gray-500">Leader</h4>
                                                        <p className="mt-1">
                                                            {selectedDivision.leader ? selectedDivision.leader.name : 'No leader assigned'}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Statistics */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Statistics</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm">
                                                        Members: {selectedDivision.members_count ??
                                                            (selectedDivision?.members_count)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm">
                                                        Events: {selectedDivision.events_count ??
                                                            (selectedDivision?.events_count)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm">
                                                        Projects: {selectedDivision.projects_count ??
                                                            (selectedDivision?.projects_count)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ListTodo className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm">
                                                        Todo Lists: {selectedDivision.todo_lists_count ??
                                                            (selectedDivision?.todo_lists_count)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Danger Zone */}
                                    {!isEditing && (
                                        <Card className="border-red-200">
                                            <CardHeader>
                                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                                <CardDescription>
                                                    Irreversible actions for this division
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            disabled={deleteLoading}
                                                        >
                                                            {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Division
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Division</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete "{selectedDivision.name}"? This action cannot be undone.
                                                                All associated data will be permanently removed.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={handleDelete}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete Division
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="members" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Division Members ({divisionMembers?.members.length || 0})</CardTitle>
                                                    <CardDescription>
                                                        Manage who has access to this division
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => setMemberSelectionOpen(true)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Users className="h-4 w-4" />
                                                    Add Members
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {divisionMembers ? (
                                                <>
                                                    {/* Current Members */}
                                                    {divisionMembers.members.length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No members in this division</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {divisionMembers.members.map(member => (
                                                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <div>
                                                                            <p className="font-medium">{member.name}</p>
                                                                            <p className="text-sm text-gray-500">{member.email}</p>
                                                                        </div>
                                                                        {member.id === selectedDivision.leader_id && (
                                                                            <Badge variant="secondary">Leader</Badge>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveMember(member.id)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <UserMinus className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="projects" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Projects</CardTitle>
                                            <CardDescription>
                                                Projects associated with this division
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-500 text-sm">Project management will be implemented soon</p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="todo-lists" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Todo Lists</CardTitle>
                                            <CardDescription>
                                                Todo lists associated with this division
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-500 text-sm">Todo list management will be implemented soon</p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-red-600 mb-4">{detailError || 'Division not found'}</p>
                                <Button onClick={handleBackToList} variant="outline">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Divisions
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            {/* Create Division Sheet */}
            <CreateDivisionSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
                onDivisionCreated={handleDivisionCreated}
                availableUsers={users}
            />

            {/* Bulk Member Selection Dialog */}
            {selectedDivision && (
                <BulkMemberSelectionDialog
                    open={memberSelectionOpen}
                    onOpenChange={setMemberSelectionOpen}
                    divisionId={selectedDivision.id}
                    availableUsers={availableUsers}
                    currentMembers={divisionMembers?.members || []}
                    onMembersAdded={handleMembersAdded}
                />
            )}
        </>
    );
}