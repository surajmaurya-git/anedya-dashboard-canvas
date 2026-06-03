import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Copy, Trash2, LayoutTemplate, Star, MonitorSmartphone, Loader2, ArrowRight, Edit, Cpu } from "lucide-react";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useAssignTemplate, Template } from "@/hooks/useTemplates";
import { useDevices } from "@/hooks/useDevices";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TemplateManagement = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const assignTemplate = useAssignTemplate();

  const [activeTab, setActiveTab] = useState<'device' | 'home'>('device');
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment Dialog State
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<Template | null>(null);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isConfirmAssignOpen, setIsConfirmAssignOpen] = useState(false);

  // Edit/Create Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editTemplateData, setEditTemplateData] = useState<{ id?: string, name: string, description: string, type: 'device' | 'home' }>({ name: "", description: "", type: "device" });

  const filteredTemplates = templates.filter(t =>
    (t.type === activeTab || (activeTab === 'device' && !t.type)) && (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const filteredDevices = useMemo(() => {
    return devices.filter(d =>
      d.title.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
      d.node_id.toLowerCase().includes(deviceSearchQuery.toLowerCase())
    );
  }, [devices, deviceSearchQuery]);

  const handleDuplicate = async (template: Template) => {
    try {
      await createTemplate.mutateAsync({
        name: `${template.name} (Copy)`,
        description: template.description,
        schema: template.schema,
        type: template.type || "device",
      });
      toast.success("Template duplicated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate template");
    }
  };

  const handleDelete = async (template: Template) => {
    const isDefault = template.is_default ?? (template.name === 'Default');
    if (isDefault) {
      toast.error("Cannot delete the default template.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate.mutateAsync(template.id);
        toast.success("Template deleted successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete template");
      }
    }
  };

  const handleSetDefault = async (template: Template) => {
    const isDefault = template.is_default ?? (template.name === 'Default');
    if (isDefault) return;
    try {
      await updateTemplate.mutateAsync({ id: template.id, is_default: true, type: template.type });
      toast.success(`${template.name} is now the default template.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to set default template");
    }
  };

  const handleSaveTemplate = async () => {
    if (!editTemplateData.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    try {
      if (editTemplateData.id) {
        await updateTemplate.mutateAsync({
          id: editTemplateData.id,
          name: editTemplateData.name,
          description: editTemplateData.description,
          type: editTemplateData.type
        });
        toast.success("Template updated successfully!");
      } else {
        await createTemplate.mutateAsync({
          name: editTemplateData.name,
          description: editTemplateData.description,
          type: editTemplateData.type
        });
        toast.success("Template created successfully!");
      }
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    }
  };

  const openAssignDialog = (template: Template) => {
    if (template.is_default ?? (template.name === 'Default')) {
      toast.error("Default template is automatically applied to all unassigned devices.");
      return;
    }
    setSelectedTemplateForAssign(template);
    // Auto-select devices already assigned to this template
    setSelectedDeviceIds(devices.filter(d => d.template_id === template.id).map(d => d.id));
    setDeviceSearchQuery("");
    setIsAssignDialogOpen(true);
  };

  const handleToggleDevice = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleBulkAssignConfirm = () => {
    // Check if any selected device has a DIFFERENT template currently assigned (overriding)
    const overridingDevices = devices.filter(d =>
      selectedDeviceIds.includes(d.id) &&
      d.template_id &&
      d.template_id !== selectedTemplateForAssign?.id
    );

    if (overridingDevices.length > 0) {
      setIsConfirmAssignOpen(true);
    } else {
      executeAssignment();
    }
  };

  const executeAssignment = async () => {
    if (!selectedTemplateForAssign) return;
    try {
      // Find devices to unassign (previously selected but now unchecked)
      const prevAssigned = devices.filter(d => d.template_id === selectedTemplateForAssign.id).map(d => d.id);
      const toUnassign = prevAssigned.filter(id => !selectedDeviceIds.includes(id));

      // Unassign
      if (toUnassign.length > 0) {
        // assignTemplate with template_id: null (wait, the schema says REFERENCES ON DELETE SET NULL, 
        // to manually unassign, we set it to the default template or null). 
        // Requirements say "Unassigned devices fall back to the default template automatically", 
        // so setting it to null is perfect.
        await assignTemplate.mutateAsync({ deviceIds: toUnassign, templateId: null as any });
      }

      // Assign new
      if (selectedDeviceIds.length > 0) {
        await assignTemplate.mutateAsync({ deviceIds: selectedDeviceIds, templateId: selectedTemplateForAssign.id });
      }

      toast.success("Template assignments updated successfully!");
      setIsAssignDialogOpen(false);
      setIsConfirmAssignOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign template");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Canvas</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage dashboard templates to customize device and home views.
            </p>
          </div>
          <Button onClick={() => {
            setEditTemplateData({ name: "", description: "", type: "device" });
            setIsCreateDialogOpen(true);
          }} className="gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="grid w-80 grid-cols-2 mb-6">
            <TabsTrigger value="device" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Device Templates
            </TabsTrigger>
            <TabsTrigger value="home" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" /> Home Templates
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" />
                    {activeTab === 'home' ? 'Home Dashboards' : 'Templates'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'home'
                      ? 'Create and manage global home dashboard layouts.'
                      : 'View and manage all available device dashboard templates.'}
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No templates found.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>{activeTab === 'home' ? 'Status' : 'Assigned Devices'}</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{template.name}</span>
                              {(template.is_default ?? (template.name === 'Default')) && (
                                <Badge variant="default" className="text-xs">Default</Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {template.type === 'home' ? (
                              template.is_default ? (
                                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Active Home</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Draft</Badge>
                              )
                            ) : (
                              (template.is_default ?? (template.name === 'Default')) ? (
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                                  <Cpu className="h-3 w-3" />
                                  All Unassigned ({devices.filter(d => !d.template_id).length})
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <Cpu className="h-3 w-3" />
                                  {template.devices?.[0]?.count || 0}
                                </Badge>
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(template.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(template.updated_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!(template.is_default ?? (template.name === 'Default')) && (
                                <Button variant="ghost" size="sm" onClick={() => handleSetDefault(template)} title="Set as Default">
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              {template.type !== 'home' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAssignDialog(template)}
                                  disabled={template.is_default ?? (template.name === 'Default')}
                                  title={template.is_default ?? (template.name === 'Default') ? "Default template is automatically assigned to all unassigned devices" : "Assign to Devices"}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/builder?id=${template.id}`)} title="Preview / Edit Layout">
                                <LayoutTemplate className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditTemplateData({ id: template.id, name: template.name, description: template.description || "", type: template.type || "device" });
                                setIsCreateDialogOpen(true);
                              }} title="Edit Properties">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)} title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(template)} disabled={template.is_default ?? (template.name === 'Default')} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>

        {/* Create/Edit Template Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTemplateData.id ? "Edit Template" : "Create New Template"}</DialogTitle>
              <DialogDescription>
                {editTemplateData.id ? "Update template details." : "Enter a name, description and type for your new template."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={editTemplateData.name} onChange={(e) => setEditTemplateData({ ...editTemplateData, name: e.target.value })} placeholder="e.g. Retail View" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input id="description" value={editTemplateData.description} onChange={(e) => setEditTemplateData({ ...editTemplateData, description: e.target.value })} placeholder="e.g. Used for retail stores" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type</Label>
                <Select
                  value={editTemplateData.type}
                  onValueChange={(val: 'device' | 'home') => setEditTemplateData({ ...editTemplateData, type: val })}
                  disabled={!!editTemplateData.id}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="device">Device Dashboard</SelectItem>
                    <SelectItem value="home">Home Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
                {(createTemplate.isPending || updateTemplate.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Template Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Template: {selectedTemplateForAssign?.name}</DialogTitle>
              <DialogDescription>
                Select devices to apply this template to.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  className="pl-9"
                  value={deviceSearchQuery}
                  onChange={(e) => setDeviceSearchQuery(e.target.value)}
                />
              </div>

              <div className="border rounded-md max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredDevices.length > 0 && selectedDeviceIds.length === devices.length}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDeviceIds(devices.map(d => d.id));
                            else setSelectedDeviceIds([]);
                          }}
                        />
                      </TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Current Template</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.map(device => {
                      const currentTemplate = templates.find(t => t.id === device.template_id) || templates.find(t => (t.type === 'device' || !t.type) && (t.is_default ?? (t.name === 'Default')));
                      return (
                        <TableRow key={device.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDeviceIds.includes(device.id)}
                              onCheckedChange={() => handleToggleDevice(device.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{device.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">{device.node_id}</div>
                          </TableCell>
                          <TableCell>
                            {currentTemplate && (
                              <Badge variant="outline" className={currentTemplate.id === selectedTemplateForAssign?.id ? "bg-primary/10 text-primary border-primary/20" : ""}>
                                {currentTemplate.name} {(currentTemplate.is_default ?? (currentTemplate.name === 'Default')) && "(Default)"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkAssignConfirm} disabled={assignTemplate.isPending}>
                {assignTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Override Dialog */}
        <Dialog open={isConfirmAssignOpen} onOpenChange={setIsConfirmAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Existing Assignments?</DialogTitle>
              <DialogDescription>
                Some of the selected devices are currently assigned to different templates. Reassigning will override their current configuration.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsConfirmAssignOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={executeAssignment} disabled={assignTemplate.isPending}>
                {assignTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Override & Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default TemplateManagement;
