import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Division, Event, Project, TodoList } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash, Users, CalendarDays, Briefcase, ListTodo } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface DivisionShowProps {
    division: Division & {
        members: any[];
        events: Event[];
        projects: Project[];
        todoLists: TodoList[];
    };
    canEdit: boolean;
    canDelete: boolean;
    isLeader: boolean;
}

export default function DivisionShow({ division, canEdit, canDelete, isLeader }: DivisionShowProps) {
    const getInitials = useInitials();
    const [activeTab, setActiveTab] = useState('overview');
    
    const handleDelete = () => {
        router.delete(route('divisions.destroy', division.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Divisions', href: '/divisions' },
            { title: division.name, href: `/divisions/${division.id}` }
        ]}>
            <Head title={division.name} />
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{division.name}</h1>
                        {division.leader && (
                            <p className="text-muted-foreground">Led by {division.leader.name}</p>
                        )}
                    </div>
                    
                    <div className="flex space-x-2">
                        {(canEdit || isLeader) && (
                            <Link href={route('divisions.members', division.id)}>
                                <Button variant="outline">
                                    <Users className="h-4 w-4 mr-2" />
                                    Manage Members
                                </Button>
                            </Link>
                        )}
                        
                        {canEdit && (
                            <Link href={route('divisions.edit', division.id)}>
                                <Button variant="outline">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Division</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this division? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
                
                <Card>
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-6">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="members">Members</TabsTrigger>
                                <TabsTrigger value="events">Events</TabsTrigger>
                                <TabsTrigger value="projects">Projects</TabsTrigger>
                                <TabsTrigger value="todoLists">Todo Lists</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Description</h3>
                                    <p className="mt-2">{division.description || 'No description provided.'}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <Users className="h-6 w-6 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{division.members?.length || 0}</p>
                                        <p className="text-muted-foreground text-sm">Members</p>
                                    </div>
                                    
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <CalendarDays className="h-6 w-6 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{division.events?.length || 0}</p>
                                        <p className="text-muted-foreground text-sm">Events</p>
                                    </div>
                                    
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <Briefcase className="h-6 w-6 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{division.projects?.length || 0}</p>
                                        <p className="text-muted-foreground text-sm">Projects</p>
                                    </div>
                                    
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <ListTodo className="h-6 w-6 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{division.todoLists?.length || 0}</p>
                                        <p className="text-muted-foreground text-sm">Todo Lists</p>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="members">
                                {division.members?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {division.members.map(member => (
                                            <div key={member.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                                                <Avatar>
                                                    <AvatarImage src={member.avatar} alt={member.name} />
                                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    {member.id === division.leader_id && (
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                                                            Leader
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No members in this division.</p>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="events">
                                {division.events?.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {division.events.map(event => (
                                                <TableRow key={event.id}>
                                                    <TableCell className="font-medium">{event.title}</TableCell>
                                                    <TableCell>{new Date(event.start_date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{new Date(event.end_date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="capitalize">{event.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No events for this division.</p>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="projects">
                                {division.projects?.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {division.projects.map(project => (
                                                <TableRow key={project.id}>
                                                    <TableCell className="font-medium">{project.name}</TableCell>
                                                    <TableCell>{new Date(project.start_date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</TableCell>
                                                    <TableCell className="capitalize">{project.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No projects for this division.</p>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="todoLists">
                                {division.todoLists?.length > 0 ? (
                                    <div className="space-y-4">
                                        {division.todoLists.map(list => (
                                            <Card key={list.id}>
                                                <CardHeader>
                                                    <CardTitle>{list.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">
                                                        Created by {list.user?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm mt-2">
                                                        {list.items?.length || 0} tasks
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No todo lists for this division.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}