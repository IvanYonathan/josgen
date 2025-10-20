import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { User } from "@/types/user/user";
import { listUsers } from "@/lib/api/user/list-users";
import { UserDataTable } from "./components/user-data-table";
import { CreateUserSheet } from "./components/create-user-sheet";
import { EditUserSheet } from "./components/edit-user-sheet";
import { getUser } from "@/lib/api/user/get-user";
import { UserDetailView } from "./components/user-detail-view";
import { deleteUser } from "@/lib/api/user/delete-user";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw, PlusCircle } from "lucide-react";

export default function UserPage() {
    const { t } = useTranslation("user");
    const { toast } = useToast();

    // State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [detailUser, setDetailUser] = useState<User | null>(null);

    // Fetch users
    const fetchUsers = async () => {
    try {
        setLoading(true);
        const response = await listUsers();
        const sortedUsers = response.users.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setUsers(sortedUsers);
    } catch (error: any) {
        setError(error.message || "Failed to load users");
    } finally {
        setLoading(false);
    }
    };


    useEffect(() => {
        fetchUsers();
    }, []);

    // Handlers
    const handleUserCreated = async (user: User) => {
        try {
            await fetchUsers(); 
            toast({
                title: "Success",
                description: "User created successfully and list refreshed.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to refresh user list after creation",
            });
        }
    };

    const handleUserUpdated = async (updatedUser: User) => {
        try {
            await fetchUsers();
            if (detailUser && detailUser.id === updatedUser.id) {
                setDetailUser(updatedUser);
            }
            toast({
                title: "Success",
                description: "User updated successfully and list refreshed.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to refresh user list after update",
            });
        }
    };


    const handleUserDeleted = async (userId: number): Promise<void> => {
        try {
            await deleteUser({ id: userId });
            await fetchUsers();
            toast({
                title: "Success",
                description: "User deleted successfully and list refreshed.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete user",
            });
        }
    };


    const handleViewUser = async (user: User) => {
        try {
            const fetched = await getUser({ id: user.id });
            setDetailUser(fetched);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description:
                    error.message || "Failed to fetch user detail",
            });
        }
    };

    return (
        <div className="p-6">
            {detailUser ? (
                <UserDetailView
                    user={detailUser}
                    onUserUpdated={handleUserUpdated}
                    onBack={async () => {
                        setDetailUser(null);
                        await fetchUsers();
                    }}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">{t("Users")}</h1>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchUsers}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${
                                        loading ? "animate-spin" : ""
                                    }`}
                                />
                                Refresh
                            </Button>
                        </div>

                        <Button onClick={() => setCreateSheetOpen(true)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {t("Create User")}
                        </Button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                No users found
                            </p>
                    
                        </div>
                    ) : (
                        <UserDataTable
                            users={users}
                            loading={loading}
                            onEdit={(user) => {
                                setSelectedUser(user);
                                setEditSheetOpen(true);
                            }}
                            onDelete={handleUserDeleted}
                            onView={handleViewUser}
                        />
                    )}
                </>
            )}

            <CreateUserSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
                onUserCreated={handleUserCreated}
            />

            {selectedUser && (
                <EditUserSheet
                    open={editSheetOpen}
                    onOpenChange={setEditSheetOpen}
                    user={selectedUser}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
}
