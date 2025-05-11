import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Division, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, UserMinus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface DivisionMembersProps {
    division: Division;
    members: User[];
    availableUsers: User[];
    canManageMembers: boolean;
}

export default function DivisionMembers({ division, members, availableUsers, canManageMembers }: DivisionMembersProps) {
    const getInitials = useInitials();
    const [searchTerm, setSearchTerm] = useState('');
    
    const addMemberForm = useForm({
        user_id: '',
    });
    
    const removeMemberForm = useForm({
        user_id: '',
    });
    
    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        addMemberForm.post(route('divisions.members.add', division.id), {
            onSuccess: () => addMemberForm.reset(),
        });
    };
    
    const handleRemoveMember = (userId: number) => {
        removeMemberForm.setData('user_id', userId.toString());
        removeMemberForm.delete(route('divisions.members.remove', division.id));
    };
    
    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={[
            { title: 'Divisions', href: '/divisions' },
            { title: division.name, href: `/divisions/${division.id}` },
            { title: 'Members', href: `/divisions/${division.id}/members` }
        ]}>
            <Head title={`${division.name} - Members`} />
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{division.name} - Members</h1>
                        <p className="text-muted-foreground">
                            Manage division members
                        </p>
                    </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                    {canManageMembers && (
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Add Member</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {availableUsers.length > 0 ? (
                                    <form onSubmit={handleAddMember} className="space-y-4">
                                        <div className="space-y-2">
                                            <Select 
                                                value={addMemberForm.data.user_id} 
                                                onValueChange={value => addMemberForm.setData('user_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableUsers.map(user => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>
                                                            {user.name} ({user.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <Button 
                                            type="submit" 
                                            disabled={addMemberForm.processing || !addMemberForm.data.user_id}
                                            className="w-full"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Add Member
                                        </Button>
                                    </form>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">
                                        No available users to add.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card className={canManageMembers ? "md:col-span-2" : "md:col-span-3"}>
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Input
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            {filteredMembers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMembers.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.avatar} alt={member.name} />
                                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{member.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell>
                                                    {member.id === division.leader_id ? (
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                            Leader
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                                                            Member
                                                        </span>
                                                    )}
                                                </TableCell>
                                                {canManageMembers && (
                                                    <TableCell className="text-right">
                                                        {member.id !== division.leader_id && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="destructive" size="sm">
                                                                        <UserMinus className="h-4 w-4 mr-2" />
                                                                        Remove
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to remove {member.name} from this division?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction 
                                                                            onClick={() => handleRemoveMember(member.id)}
                                                                            className="bg-destructive text-destructive-foreground"
                                                                        >
                                                                            Remove
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">
                                    No members found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}