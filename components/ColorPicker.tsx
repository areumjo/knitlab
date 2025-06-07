
import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  initialColor?: string;
  onChange: (color: string) => void;
  // label?: string; // Label removed
  // recentColors?: string[]; // Recent colors removed
}

// Adjusted to 16 presets for a 2x8 grid
const PRESET_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#000000', '#FFFFFF', '#808080', '#C0C0C0', '#A52A2A', '#FFC0CB', '#ADD8E6', '#90EE90',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ initialColor = '#000000', onChange }) => {
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase();
    setColor(newColor);
    onChange(newColor);
  };

  const handlePresetClick = (preset: string) => {
    const upperPreset = preset.toUpperCase();
    setColor(upperPreset);
    onChange(upperPreset);
  }

  return (
    <div className="flex items-center space-x-2"> {/* Main container for color picker part */}
      <input
        type="color"
        value={color}
        onChange={handleColorChange}
        className="w-8 h-8 p-0 border border-neutral-300 dark:border-neutral-600 rounded-md cursor-pointer flex-shrink-0"
        aria-label="Select active color"
      />
      {/* Hex input removed */}
      {/* Recent colors removed */}
      
      {/* Presets Section */}
      <div className="grid grid-cols-8 gap-1">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            title={preset}
            onClick={() => handlePresetClick(preset)}
            className={`w-5 h-5 rounded border border-neutral-300 dark:border-neutral-600 ${color.toUpperCase() === preset ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-neutral-800' : ''}`}
            style={{ backgroundColor: preset }}
            aria-label={`Select color ${preset}`}
          />
        ))}
      </div>
    </div>
  );
};
