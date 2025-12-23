import { FormEventHandler, useEffect, useState } from 'react';
import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { updateProfile } from '@/lib/api/auth/update-profile';
import { me } from '@/lib/api/auth/me';
import { User } from '@/types/user/user';

export default function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    useEffect(() => {
        document.title = 'Profile settings';

        me().then(data => {
            setUser(data.user);
            setName(data.user.name);
            setEmail(data.user.email);
        }).catch(err => console.error('Failed to fetch user data:', err));
    }, []);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const updatedUser = await updateProfile({ name, email });
            setUser(updatedUser);
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to update profile:', error);
            }
        } finally {
            setProcessing(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            {recentlySuccessful && (
                                <p className="text-sm text-neutral-600">Saved</p>
                            )}
                    </div>
                </form>
            </div>

            <DeleteUser />
        </SettingsLayout>
    );
}
