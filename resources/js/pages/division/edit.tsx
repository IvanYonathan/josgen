import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Division, User } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';

interface DivisionEditProps {
    division: Division;
    users: User[];
}

export default function DivisionEdit({ division, users }: DivisionEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: division.name,
        description: division.description || '',
        leader_id: division.leader_id ? division.leader_id.toString() : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('divisions.update', division.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Divisions', href: '/divisions' },
            { title: division.name, href: `/divisions/${division.id}` },
            { title: 'Edit', href: `/divisions/${division.id}/edit` }
        ]}>
            <Head title={`Edit ${division.name}`} />
            
            <div className="p-6">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Division</CardTitle>
                        </CardHeader>
                        
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input 
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Division name"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea 
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        placeholder="Division description"
                                        rows={4}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="leader_id">Division Leader</Label>
                                    <Select value={data.leader_id} onValueChange={value => setData('leader_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a leader (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No leader</SelectItem>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.leader_id} />
                                </div>
                            </CardContent>
                            
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" type="button" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Update Division
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}