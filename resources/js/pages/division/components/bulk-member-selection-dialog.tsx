import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Users } from 'lucide-react';
import { User } from '@/types/user/user';
import { addDivisionMembersBulk } from '@/lib/api/division/members/add-division-members-bulk';

interface BulkMemberSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionId: number;
  availableUsers: User[];
  currentMembers: User[];
  onMembersAdded: () => void;
}

export function BulkMemberSelectionDialog({
  open,
  onOpenChange,
  divisionId,
  availableUsers,
  currentMembers,
  onMembersAdded,
}: Readonly<BulkMemberSelectionDialogProps>) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out users who are already members
  const currentMemberIds = new Set(currentMembers.map(member => member.id));
  const eligibleUsers = availableUsers.filter(user => !currentMemberIds.has(user.id));

  // Filter users based on search term
  const filteredUsers = eligibleUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all filtered users
      setSelectedUserIds(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) {
      setErrors({ general: 'Please select at least one member to add' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Add all members in a single bulk API call
      await addDivisionMembersBulk({
        division_id: divisionId,
        user_ids: Array.from(selectedUserIds),
      });

      // Reset state
      setSelectedUserIds(new Set());
      setSearchTerm('');

      // Notify parent and close
      onMembersAdded();
      onOpenChange(false);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to add members'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserIds(new Set());
    setSearchTerm('');
    setErrors({});
    onOpenChange(false);
  };

  const allFilteredSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;
  const someFilteredSelected = selectedUserIds.size > 0 && selectedUserIds.size < filteredUsers.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Members to Division
          </DialogTitle>
          <DialogDescription>
            Select users to add as members of this division. You can select multiple users at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Error Display */}
          {errors.general && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {errors.general}
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Selection Summary */}
          <div className="mb-4 text-sm text-gray-600">
            {selectedUserIds.size} of {filteredUsers.length} users selected
            {searchTerm && (
              <span className="ml-2">
                (filtered from {eligibleUsers.length} available users)
              </span>
            )}
          </div>

          {/* Users Table */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <div className="overflow-auto max-h-96">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? (
                    <>No users found matching "{searchTerm}"</>
                  ) : (
                    <>All available users are already members of this division</>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all users"
                          {...(someFilteredSelected && { 'data-state': 'indeterminate' })}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                            aria-label={`Select ${user.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={loading || selectedUserIds.size === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedUserIds.size} Member{selectedUserIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}