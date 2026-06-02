import React, { useState } from 'react';
import ComponentSidebar from './ComponentSidebar';
import CanvasGrid from './CanvasGrid';
import PropertiesPanel from './PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Save, Download, Upload, Loader2 } from 'lucide-react';
import { useBuilderStore } from '../../store/useBuilderStore';

import { toast } from 'sonner';

export default function BuilderLayout({ onSave }: { onSave: (templateData: any) => void | Promise<void> }) {
  const { sections, layout, widgets, setTemplate } = useBuilderStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        version: '2.0',
        sections,
        layout,
        widgets
      });
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const template = {
      version: '2.0',
      sections,
      layout,
      widgets
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-template-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        
        // Extract layout, widgets, and sections supporting both direct and nested formats
        const targetLayout = template.layout || template.schema?.layout;
        const targetWidgets = template.widgets || template.schema?.widgets;
        const targetSections = template.sections || template.schema?.sections || [];

        if (targetLayout && targetWidgets) {
          setTemplate(targetSections, targetLayout, targetWidgets);
          toast.success('Template layout imported successfully!');
        } else {
          toast.error('Invalid template format: layout or widgets missing.');
        }
      } catch (error) {
        toast.error('Error parsing template file. Make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so that the same file can be re-uploaded if needed
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full border rounded-xl overflow-hidden shadow-sm bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
         <h2 className="text-sm font-semibold text-foreground">Dashboard Layout Builder</h2>
         <div className="flex items-center gap-2">
            <input
              type="file"
              id="import-template"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => document.getElementById('import-template')?.click()}
            >
               <Upload size={16} /> Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExport}
            >
               <Download size={16} /> Export
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm" 
              className="gap-2" 
              disabled={isSaving}
            >
               {isSaving ? (
                 <>
                   <Loader2 size={16} className="animate-spin" /> Saving...
                 </>
               ) : (
                 <>
                   <Save size={16} /> Save Template
                 </>
               )}
            </Button>
         </div>
      </div>
      
      {/* 3-Column main area */}
      <div className="flex flex-1 overflow-hidden">
        <ComponentSidebar />
        <CanvasGrid onSave={handleSave} />
        <PropertiesPanel />
      </div>
    </div>
  );
}
