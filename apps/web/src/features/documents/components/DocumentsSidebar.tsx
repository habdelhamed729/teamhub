import { ChevronRight, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Document } from '@teamhub/shared';

interface DocumentsSidebarProps {
  workspaceId: string;
  documents: Document[];
  onCreateNew: (parentId?: string) => void;
}

export const DocumentsSidebar = ({ workspaceId, documents, onCreateNew }: DocumentsSidebarProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const buildTree = (docs: Document[]) => {
    const rootDocs = docs.filter(d => !d.parent_id);
    const getChildren = (parentId: string) => docs.filter(d => d.parent_id === parentId);

    const renderNode = (doc: Document, depth = 0) => {
      const children = getChildren(doc.id);
      const isExpanded = !!expanded[doc.id];
      const isActive = location.pathname === `/workspaces/${workspaceId}/docs/${doc.id}`;

      return (
        <div key={doc.id}>
          <div className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
            isActive ? 'bg-primary-accent/10 text-primary-accent' : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
          }`} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
            
            <button
              onClick={(e) => toggleExpand(e, doc.id)}
              className={`p-0.5 rounded hover:bg-white/10 ${children.length === 0 ? 'invisible' : ''}`}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            <Link to={`/workspaces/${workspaceId}/docs/${doc.id}`} className="flex-1 flex items-center gap-2 min-w-0">
              <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
              <span className="truncate text-sm font-medium">{doc.title || 'Untitled'}</span>
            </Link>

            <button
              onClick={() => onCreateNew(doc.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all text-text-muted hover:text-text-primary"
              title="Add page inside"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {isExpanded && children.length > 0 && (
            <div className="mt-0.5">
              {children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return rootDocs.map(doc => renderNode(doc, 0));
  };

  return (
    <div className="space-y-1">
      {buildTree(documents)}
      
      <button
        onClick={() => onCreateNew()}
        className="flex items-center gap-2 w-full mt-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors group"
      >
        <Plus className="w-4 h-4 group-hover:text-primary-accent transition-colors" />
        <span className="font-medium">New Document</span>
      </button>
    </div>
  );
};
