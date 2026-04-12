import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Shield, Smartphone, Trash2, Loader2, Eye, EyeOff, Search, CheckSquare, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers, useUpdateUserRole, useAssignDevice, useUnassignDevice, useBulkAssignDevices, useBulkUnassignDevices, useDeleteUser } from "@/hooks/useUsers";
import { useDevices } from "@/hooks/useDevices";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const UserManagement = () => {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: allDevices = [], isLoading: devicesLoading } = useDevices();
  const deleteUser = useDeleteUser();
  
  const assignDevice = useAssignDevice();
  const unassignDevice = useUnassignDevice();
  const updateUserRole = useUpdateUserRole();
  const bulkAssign = useBulkAssignDevices();
  const bulkUnassign = useBulkUnassignDevices();

  // New User Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");

  const isBulkOperating = bulkAssign.isPending || bulkUnassign.isPending;

  const filteredDevices = allDevices.filter(d => 
    d.title.toLowerCase().includes(deviceSearch.toLowerCase()) || 
    d.id.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  // Use the Edge Function to create users (bypasses default signup limits)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("User created successfully!");
      setEmail("");
      setPassword("");
      setRole("viewer");

      // Properly reflect the new user in UI without reloading the whole browser
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userEmail}?`)) return;
    try {
      await deleteUser.mutateAsync(userId);
      toast.success("User deleted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Create users, setup admins, and manage device access control.
          </p>
        </div>
        
        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Create User Form ── */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New User
              </CardTitle>
              <CardDescription>
                Create a new account manually. Users cannot sign up themselves.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="user@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Min. 6 characters" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t mt-4">
                  <Label htmlFor="role" className="font-medium">User Role</Label>
                  <Select value={role} onValueChange={(val: 'viewer' | 'editor') => setRole(val)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                      <SelectItem value="editor">Editor (Can edit devices)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Admins cannot create new Admin users.
                </p>

                <Button type="submit" className="w-full mt-4" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Users List & Access Control ── */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Directory & Access
              </CardTitle>
              <CardDescription>
                Assign specific devices to allow non-admin users to view them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading || devicesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 bg-card shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{user.email}</h3>
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                Admin
                              </span>
                            ) : (
                              <Select 
                                value={user.role || 'viewer'} 
                                onValueChange={(val: 'viewer' | 'editor') => updateUserRole.mutate({ userId: user.id, role: val })}
                                disabled={updateUserRole.isPending}
                              >
                                <SelectTrigger className="w-28 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Device Assignments */}
                      {user.role !== 'admin' && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <Smartphone className="h-4 w-4" /> Assigned Devices
                              <span className="text-xs font-normal text-muted-foreground ml-2">
                                ({user.devices.length} assigned)
                              </span>
                            </Label>
                            
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Search devices..."
                                  className="h-8 w-[150px] lg:w-[200px] pl-8 text-xs"
                                  value={deviceSearch}
                                  onChange={(e) => setDeviceSearch(e.target.value)}
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs gap-1.5"
                                disabled={isBulkOperating}
                                onClick={() => {
                                  const alreadyAssigned = new Set(user.devices);
                                  
                                  if (user.devices.length === allDevices.length) {
                                    // Deselect All
                                    bulkUnassign.mutate({ 
                                      userId: user.id, 
                                      deviceIds: user.devices 
                                    });
                                    toast.info("Unassigning all devices...");
                                  } else {
                                    // Select All (only assign those not already assigned)
                                    const toAssign = allDevices
                                      .map(d => d.id)
                                      .filter(id => !alreadyAssigned.has(id));
                                    
                                    bulkAssign.mutate({ 
                                      userId: user.id, 
                                      deviceIds: toAssign 
                                    });
                                    toast.success(`Assigning ${toAssign.length} devices...`);
                                  }
                                }}
                              >
                                {isBulkOperating ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : user.devices.length === allDevices.length ? (
                                  <><Square className="h-3.5 w-3.5" /> Deselect All</>
                                ) : (
                                  <><CheckSquare className="h-3.5 w-3.5" /> Select All</>
                                )}
                              </Button>
                            </div>
                          </div>

                          {allDevices.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No devices exist in the system yet.</p>
                          ) : (
                            <ScrollArea className="h-[180px] rounded-md border p-4 bg-muted/10">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredDevices.length === 0 ? (
                                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                                    No devices matching "{deviceSearch}"
                                  </div>
                                ) : (
                                  filteredDevices.map((device) => {
                                    const isAssigned = user.devices.includes(device.id);
                                    const isPending = (assignDevice.isPending && assignDevice.variables?.deviceId === device.id) || 
                                                     (unassignDevice.isPending && unassignDevice.variables?.deviceId === device.id);

                                    return (
                                      <div 
                                        key={device.id} 
                                        className={`flex items-center space-x-2 border rounded p-2 transition-colors ${
                                          isAssigned ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent'
                                        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        <Checkbox 
                                          id={`device-${user.id}-${device.id}`}
                                          checked={isAssigned}
                                          disabled={isPending || isBulkOperating}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              assignDevice.mutate({ userId: user.id, deviceId: device.id });
                                            } else {
                                              unassignDevice.mutate({ userId: user.id, deviceId: device.id });
                                            }
                                          }}
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                          <label
                                            htmlFor={`device-${user.id}-${device.id}`}
                                            className="text-xs font-medium leading-none cursor-pointer"
                                          >
                                            {device.title}
                                          </label>
                                          <p className="text-[10px] text-muted-foreground truncate w-full max-w-[120px]">
                                            {device.id}
                                          </p>
                                        </div>
                                        {isPending && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      )}
                      {user.role === 'admin' && (
                         <div className="mt-2 text-sm text-primary/80 bg-primary/5 p-2 rounded">
                           Admins automatically have access to all devices.
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
