import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wifi, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useDevices, useAddDevice, useUpdateDevice, useDeleteDevice, Device } from "@/hooks/useDevices";
import { toast } from "sonner";

const DeviceManagement = () => {
  const [newTitle, setNewTitle] = useState("");
  const [newNodeId, setNewNodeId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const addDevice = useAddDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const handleAddDevice = async () => {
    const trimmedTitle = newTitle.trim();
    const trimmedNodeId = newNodeId.trim();

    if (!trimmedTitle || !trimmedNodeId) {
      toast.error("Please enter both a Title and Node ID.");
      return;
    }

    try {
      await addDevice.mutateAsync({ title: trimmedTitle, nodeId: trimmedNodeId });
      setNewTitle("");
      setNewNodeId("");
      toast.success(`Device "${trimmedTitle}" added successfully!`);
    } catch (err: any) {
      if (err?.message?.includes("duplicate key")) {
        toast.error("A device with a similar title already exists. Choose a different name.");
      } else {
        toast.error(`Failed to add device: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleStartEdit = (device: Device) => {
    setEditingId(device.id);
    setEditTitle(device.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty.");
      return;
    }

    try {
      await updateDevice.mutateAsync({ id, title: trimmed });
      setEditingId(null);
      setEditTitle("");
      toast.success("Device updated successfully!");
    } catch (err: any) {
      if (err?.message?.includes("duplicate key")) {
        toast.error("A device with a similar title already exists.");
      } else {
        toast.error(`Failed to update: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleDelete = async (device: Device) => {
    if (!window.confirm(`Are you sure you want to delete "${device.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDevice.mutateAsync(device.id);
      toast.success(`Device "${device.title}" deleted.`);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground mt-2">
            Add, rename, or remove device pages from the dashboard.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Manage Devices
            </CardTitle>
            <CardDescription>
              Create new devices or manage existing ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Device Form */}
            <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Add New Device</p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="new-title" className="text-xs">Title</Label>
                  <Input
                    id="new-title"
                    placeholder="e.g. Device 1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDevice()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-node-id" className="text-xs">Node ID</Label>
                  <Input
                    id="new-node-id"
                    placeholder="e.g. 019bffaf-eae4-728f-ae08-..."
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDevice()}
                  />
                </div>
                <Button
                  onClick={handleAddDevice}
                  disabled={addDevice.isPending}
                  className="gap-2"
                >
                  {addDevice.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>

            {/* Devices List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Existing Devices ({devices.length})
              </p>

              {devicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : devices.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center">
                  <Wifi className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No devices added yet. Use the form above to add your first device.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      <Wifi className="h-4 w-4 text-muted-foreground shrink-0" />

                      {editingId === device.id ? (
                        <>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(device.id);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="h-8 flex-1"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleSaveEdit(device.id)}
                            disabled={updateDevice.isPending}
                          >
                            {updateDevice.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{device.title}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {device.node_id}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleStartEdit(device)}
                            title="Edit title"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(device)}
                            disabled={deleteDevice.isPending}
                            title="Delete device"
                          >
                            {deleteDevice.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeviceManagement;
