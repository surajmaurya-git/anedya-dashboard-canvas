import React, { useState } from 'react';
import ComponentSidebar from './ComponentSidebar';
import CanvasGrid from './CanvasGrid';
import PropertiesPanel from './PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Save, Download, Upload, Loader2 } from 'lucide-react';
import { useBuilderStore } from '../../store/useBuilderStore';

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
        if (template.sections && template.layout && template.widgets) {
          setTemplate(template.sections, template.layout, template.widgets);
        } else {
          alert('Invalid template format');
        }
      } catch (error) {
        alert('Error parsing template file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full border rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
         <h2 className="text-sm font-semibold text-gray-700">Dashboard Layout Builder</h2>
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
