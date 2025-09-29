import { Head, Link } from '@inertiajs/react';
import { type Division } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, CalendarDays, Briefcase, ListTodo } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

interface DivisionIndexProps {
    divisions: Division[];
    canCreate: boolean;
}

//TODO (Ivan Yonathan) : Add pagination
//TODO (Ivan Yonathan) : Add sorting
//TODO (Ivan Yonathan) : Add filtering
//TODO (Ivan Yonathan) : Add searching
//TODO (Ivan Yonathan) : Add actions
//TODO (Ivan Yonathan) : Fix Create Division button


export default function DivisionIndex({ divisions, canCreate }: DivisionIndexProps) {
    const {t} = useTranslation('division');
    return (
        <AppLayout breadcrumbs={[{ title: 'Divisions', href: '/divisions' }]}>
            <Head title="Divisions" />
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    
                    {canCreate && (
                        <Link href={route('divisions.create')}>
                            <Button>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                {t('createDivision.button.create')}
                            </Button>
                        </Link>
                    )}
                </div>
                
                {divisions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No divisions found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {divisions.map(division => (
                            <Card key={division.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <Link href={route('divisions.show', division.id)}>
                                        <CardTitle className="hover:text-primary transition-colors">{division.name}</CardTitle>
                                    </Link>
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
        </AppLayout>
    );
}