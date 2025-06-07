
import React from 'react';
import { Layer } from '../types';
import { Button } from './Button';
import { PlusIcon, TrashIcon, EyeOpenIcon, EyeClosedIcon, SelectAllIcon } from './Icon'; // Assuming SelectAllIcon

// Placeholder for SelectAllIcon, if not already defined in Icon.tsx
const DefaultSelectAllIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.045 3.045C5.308 2.462 4.27 2.636 3.688 3.373A5.932 5.932 0 002.438 6c0 .46.06.91.179 1.349A5.97 5.97 0 005.35 10.5h.159a.6.6 0 01.537.36L7.5 15l1.455-4.14a.6.6 0 01.537-.36h.158c1.463 0 2.807-.537 3.748-1.479A5.932 5.932 0 0015.562 6c0-.46-.06-.91-.179-1.349A5.97 5.97 0 0012.65 2.5h-.159a.6.6 0 01-.537-.36L10.5 0 9.045 1.14a.6.6 0 01-.537.36H8.35C6.887 1.5 5.543 2.037 4.602 2.979L6.045 3.045zm11.91 0C18.692 2.462 19.73 2.636 20.312 3.373A5.932 5.932 0 0121.562 6c0 .46-.06.91-.179 1.349A5.97 5.97 0 0118.65 10.5h.159a.6.6 0 00.537-.36L21 6l-1.455 4.14a.6.6 0 00-.537.36h-.158c-1.463 0-2.807.537-3.748 1.479A5.932 5.932 0 0012.438 6c0-.46.06-.91.179-1.349A5.97 5.97 0 0115.35 2.5h.159a.6.6 0 00.537-.36L17.5 0l1.455 1.14a.6.6 0 00.537.36h.158c1.463 0 2.807.537 3.748 1.479L17.955 3.045zM6.045 20.955C5.308 21.538 4.27 21.364 3.688 20.627A5.932 5.932 0 012.438 18c0-.46.06-.91.179-1.349A5.97 5.97 0 015.35 13.5h.159a.6.6 0 00.537.36L7.5 9l1.455 4.14a.6.6 0 00.537.36h.158c1.463 0 2.807.537 3.748 1.479A5.932 5.932 0 0115.562 18c0 .46-.06.91-.179 1.349A5.97 5.97 0 0112.65 21.5h-.159a.6.6 0 00-.537.36L10.5 24l-1.455-1.14a.6.6 0 00-.537-.36H8.35c-1.463 0-2.807-.537-3.748-1.479L6.045 20.955zm11.91 0c.737.583 1.775.409 2.357-.328A5.932 5.932 0 0021.562 18c0-.46-.06-.91-.179-1.349A5.97 5.97 0 0018.65 13.5h.159a.6.6 0 01.537.36L21 18l-1.455-4.14a.6.6 0 01-.537-.36h-.158c-1.463 0-2.807-.537-3.748-1.479A5.932 5.932 0 0012.438 18c0 .46.06.91.179 1.349A5.97 5.97 0 0015.35 21.5h.159a.6.6 0 01.537.36L17.5 24l1.455-1.14a.6.6 0 01.537-.36h.158c1.463 0 2.807-.537 3.748-1.479L17.955 20.955z" />
</svg>;


interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayerSelect: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onSelectAllActiveLayer: () => void; // New prop
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerVisibility,
  onSelectAllActiveLayer,
}) => {
  return (
    <div className="p-2 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Layers</h3>
        <Button size="sm" variant="ghost" onClick={onAddLayer} title="Add new layer">
            <PlusIcon />
        </Button>
      </div>
      {layers.length === 0 && <p className="text-xs text-neutral-500 dark:text-neutral-400">No layers yet. Add one!</p>}
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {layers.map((layer, index) => (
          <li
            key={layer.id}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
                        ${activeLayerId === layer.id ? 'bg-primary/20 dark:bg-primary-dark/30' : ''}`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <span className="text-sm truncate flex-grow" title={layer.name}>{layer.name || `Layer ${index + 1}`}</span>
            <div className="flex items-center space-x-1 ml-2">
              {activeLayerId === layer.id && (
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); onSelectAllActiveLayer(); }} 
                    title="Select all in this layer (Ctrl+A behavior for layer)"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100" // Show on hover/focus
                >
                    {SelectAllIcon ? <SelectAllIcon /> : <DefaultSelectAllIcon />}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }} title={layer.isVisible ? "Hide layer" : "Show layer"}>
                {layer.isVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }} title="Delete layer" className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={layers.length <= 1}>
                <TrashIcon />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {/* Removed the "Layer functionality is simplified" paragraph */}
    </div>
  );
};
