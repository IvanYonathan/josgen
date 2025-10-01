import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactAuthLayout from '@/layouts/auth/react-auth-layout';
import { AuthService } from '@/lib/auth/auth-service';

export default function ReactLoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setProcessing(true);
        setErrors({});

        try {
            await AuthService.login({
                email: formData.email,
                password: formData.password,
                remember: formData.remember,
            });

            // Redirect to dashboard on success
            navigate('/dashboard');
        } catch (error) {
            setErrors({
                general: error instanceof Error ? error.message : 'Failed to login'
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ReactAuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {/* General Error */}
                {errors.general && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {errors.general}
                    </div>
                )}

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            disabled={processing}
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Link to="/forgot-password" className="ml-auto text-sm text-primary hover:underline" tabIndex={5}>
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Password"
                            disabled={processing}
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={formData.remember}
                            onCheckedChange={(checked) => setFormData({ ...formData, remember: checked === true })}
                            tabIndex={3}
                            disabled={processing}
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Log in
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:underline" tabIndex={5}>
                        Sign up
                    </Link>
                </div>
            </form>
        </ReactAuthLayout>
    );
}