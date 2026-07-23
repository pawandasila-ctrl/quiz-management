"use client";

import React, { useCallback, useState } from "react";
import {
  useUpdateUserRole,
  useToggleUserBlock,
  useUpdateUser,
  useDeleteUser,
} from "@/modules/admin/hooks";
import { User, UserRole } from "@/modules/auth/types";
import { UpdateUserPayload } from "@/modules/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Trash2,
  ShieldOff,
  Shield,
  CalendarDays,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface UserTableProps {
  users: User[];
}

function roleBadgeVariant(role: UserRole) {
  if (role === "admin") return "default";
  if (role === "instructor") return "secondary";
  return "outline";
}

function roleBadgeClass(role: UserRole) {
  if (role === "admin")
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  if (role === "instructor")
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

// ── Edit User Dialog ─────────────────────────────────────────────────────────
function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const updateUser = useUpdateUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [image, setImage] = useState(user.image ?? "");

  const handleSave = useCallback(() => {
    const payload: UpdateUserPayload = {};
    if (name !== user.name) payload.name = name;
    if (email !== user.email) payload.email = email;
    if (role !== user.role) payload.role = role;
    if (image !== (user.image ?? "")) payload.image = image || null;
    if (!Object.keys(payload).length) {
      onOpenChange(false);
      return;
    }
    updateUser.mutate(
      { userId: user.id, payload },
      {
        onSuccess: () => {
          toast.success("User details updated successfully.");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message || "Failed to update user."),
      },
    );
  }, [name, email, role, image, user, updateUser, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update details for{" "}
            <span className="font-semibold text-foreground">{user.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="edit-role" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-image">Profile Image URL</Label>
            <Input
              id="edit-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateUser.isPending}>
            {updateUser.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Role Change Confirm Dialog ───────────────────────────────────────────────
function RoleConfirmDialog({
  user,
  pendingRole,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  user: User;
  pendingRole: UserRole | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Role?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change{" "}
            <span className="font-semibold text-foreground">{user.name}</span>
            &apos;s role from{" "}
            <span className="font-semibold capitalize">
              {user.role}
            </span> to{" "}
            <span className="font-semibold capitalize text-primary">
              {pendingRole}
            </span>
            ? This will immediately affect their access permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Updating…" : "Yes, Change Role"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  user: User;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{user.name}</span> (
            {user.email}) and all their data including quiz attempts and
            sessions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Yes, Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── User Row ─────────────────────────────────────────────────────────────────
const UserRow = React.memo(function UserRow({ user }: { user: User }) {
  const updateRoleMutation = useUpdateUserRole();
  const toggleBlockMutation = useToggleUserBlock();
  const deleteUserMutation = useDeleteUser();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const handleRoleSelect = useCallback((role: string) => {
    setPendingRole(role as UserRole);
    setRoleConfirmOpen(true);
  }, []);

  const handleRoleConfirm = useCallback(() => {
    if (!pendingRole) return;
    updateRoleMutation.mutate(
      { userId: user.id, role: pendingRole },
      {
        onSuccess: () => {
          toast.success(`Role updated to "${pendingRole}" for ${user.name}.`);
          setRoleConfirmOpen(false);
          setPendingRole(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update role.");
          setRoleConfirmOpen(false);
          setPendingRole(null);
        },
      },
    );
  }, [pendingRole, updateRoleMutation, user.id, user.name]);

  const handleToggleBlock = useCallback(() => {
    toggleBlockMutation.mutate(user.id, {
      onSuccess: (updated) => {
        toast.success(
          updated.is_active
            ? `${user.name} has been unblocked.`
            : `${user.name} has been blocked.`,
        );
      },
      onError: (err) =>
        toast.error(err.message || "Failed to toggle user status."),
    });
  }, [toggleBlockMutation, user.id, user.name]);

  const handleDelete = useCallback(() => {
    deleteUserMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success(`User "${user.name}" has been deleted.`);
        setDeleteOpen(false);
      },
      onError: (err) => toast.error(err.message || "Failed to delete user."),
    });
  }, [deleteUserMutation, user.id, user.name]);

  const isBlocked = !user.is_active;

  return (
    <>
      <TableRow className={isBlocked ? "opacity-60 bg-destructive/5" : ""}>
        {/* User Info */}
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-foreground text-sm truncate flex items-center gap-2">
                {user.name}
                {isBlocked && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Blocked
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
          </div>
        </TableCell>

        {/* Role Badge */}
        <TableCell>
          <Badge
            variant={roleBadgeVariant(user.role)}
            className={`capitalize text-xs ${roleBadgeClass(user.role)}`}
          >
            {user.role}
          </Badge>
        </TableCell>

        {/* Created At */}
        <TableCell className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(user.created_at), "PPpp")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>

        {/* Last Login */}
        <TableCell className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {user.last_login_at ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">
                      {formatDistanceToNow(new Date(user.last_login_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(new Date(user.last_login_at), "PPpp")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-muted-foreground/50 italic">Never</span>
            )}
          </div>
        </TableCell>

        {/* Change Role */}
        <TableCell>
          <Select
            value={user.role}
            onValueChange={handleRoleSelect}
            disabled={updateRoleMutation.isPending}
          >
            <SelectTrigger className="h-8 w-30 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>

        {/* Block Toggle */}
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`block-${user.id}`}
                    checked={isBlocked}
                    onCheckedChange={handleToggleBlock}
                    disabled={toggleBlockMutation.isPending}
                    className="data-[state=checked]:bg-destructive"
                  />
                  <span className="text-xs text-muted-foreground">
                    {isBlocked ? (
                      <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isBlocked ? "Click to unblock user" : "Click to block user"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center gap-1 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit user details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete user</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>

      {/* Dialogs */}
      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      <RoleConfirmDialog
        user={user}
        pendingRole={pendingRole}
        open={roleConfirmOpen}
        onOpenChange={setRoleConfirmOpen}
        onConfirm={handleRoleConfirm}
        isPending={updateRoleMutation.isPending}
      />
      <DeleteConfirmDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isPending={deleteUserMutation.isPending}
      />
    </>
  );
});

// ── User Table ────────────────────────────────────────────────────────────────
export const UserTable = React.memo(function UserTable({
  users,
}: UserTableProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-semibold text-foreground">
              User
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Role
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Joined
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Last Login
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Change Role
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Blocked
            </TableHead>
            <TableHead className="font-semibold text-foreground text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-10"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => <UserRow key={u.id} user={u} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
});

export default UserTable;
