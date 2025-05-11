import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { User } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';

interface DivisionCreateProps {
    users: User[];
}

export default function DivisionCreate({ users }: DivisionCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        leader_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('divisions.store'));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Divisions', href: '/divisions' },
            { title: 'Create Division', href: '/divisions/create' }
        ]}>
            <Head title="Create Division" />
            
            <div className="p-6">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Division</CardTitle>
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
                                    Create Division
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}