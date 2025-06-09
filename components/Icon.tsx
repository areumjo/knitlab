import React from 'react';

interface IconProps {
  path: string; // SVG path data for 'd' attribute
  className?: string;
  viewBox?: string;
  size?: number | string;
  strokeWidth?: number;
  fill?: string;
  transform?: string;
  fillRule?: 'inherit' | 'nonzero' | 'evenodd';
}

export const Icon: React.FC<IconProps> = ({
  path,
  className = 'w-5 h-5',
  viewBox = '0 0 24 24',
  size,
  strokeWidth = 2,
  fill = 'none',
  transform,
  fillRule,
}) => {
  const style: React.CSSProperties = {};
  if (size) {
    style.width = size;
    style.height = size;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={fill}
      viewBox={viewBox}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      style={style}
      transform={transform}
      fillRule={fillRule}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
};

type SpecificIconComponentProps = Partial<Omit<IconProps, 'path'>>;

export const PenIcon = (props: SpecificIconComponentProps) => <Icon path="M16 3l5 5L8 21H3v-5L16 3z" {...props} />;
export const EraserIcon = (props: SpecificIconComponentProps) => <Icon path="M6.162 6.162a2.5 2.5 0 013.536 0L15.536 12l-5.838 5.838a2.5 2.5 0 01-3.536-3.536L12 12.464 6.162 6.626V6.162zm9.9-2.475L10.225 9.525M19.5 8.5l-3.536 3.536" {...props} />;
export const SelectIcon = (props: SpecificIconComponentProps) => <Icon path="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" {...props} />;
export const PaletteIcon = (props: SpecificIconComponentProps) => <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.35 0 2.65-.26 3.84-.73l-.04.03c.16-.09.31-.18.46-.29.99-.68 1.81-1.59 2.42-2.62.01 0 .01-.01.02-.01.06-.1.11-.2.17-.3.05-.1.1-.19.15-.29.45-.92.75-1.93.86-2.98.01-.02.01-.04.02-.06.02-.16.04-.32.05-.48C22 10 22 8.85 21.74 7.75c-.06-.25-.12-.5-.2-.74-.09-.3-.19-.59-.3-.87-.29-.81-.68-1.56-1.15-2.23-.09-.13-.19-.26-.29-.38-.01-.02-.03-.03-.04-.05-.6-.78-1.32-1.46-2.13-2.02A9.992 9.992 0 0012 2zm-1 14H9v-2h2v2zm0-4H9V9.99h2V12zm0-4.01H9V6h2v1.99zm4 4H13v-2h2v2zm0-4H13V9.99h2V12zm0-4.01H13V6h2v1.99z" fill="currentColor" {...props}/>;
export const LayersIcon = (props: SpecificIconComponentProps) => <Icon path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...props} />;
export const UndoIcon = (props: SpecificIconComponentProps) => <Icon path="M2.5 2v6h6M2.66 15.57a10 10 0 10 .57-8.38" {...props} />;
export const RedoIcon = (props: SpecificIconComponentProps) => <Icon path="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38" {...props} />;
export const SettingsIcon = (props: SpecificIconComponentProps) => <Icon path="M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" {...props} />;
export const ZoomInIcon = (props: SpecificIconComponentProps) => <Icon path="M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35M11 8v6M8 11h6" {...props} />;
export const ZoomOutIcon = (props: SpecificIconComponentProps) => <Icon path="M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35M8 11h6" {...props} />;
export const SunIcon = (props: SpecificIconComponentProps) => <Icon path="M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" {...props} />;
export const MoonIcon = (props: SpecificIconComponentProps) => <Icon path="M21 12.79A9 9 0 11 11.21 3 7 7 0 00 21 12.79z" {...props} />;

export const UploadIcon = (props: SpecificIconComponentProps) => <Icon path="M3 16.5v-2.25A2.25 2.25 0 015.25 12h13.5A2.25 2.25 0 0121 14.25V16.5m-16.5-4.5L12 7.5m0 0l4.5 4.5M12 7.5v9" {...props} />;

export const TextToInstructionIcon = (props: SpecificIconComponentProps) => <Icon path="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 3v5h5M16 13H8M16 17H8M10 9H8" {...props} />;
export const ExportJpgIcon = (props: SpecificIconComponentProps) => <Icon path="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" {...props} />;
export const ImportImageIcon  = (props: SpecificIconComponentProps) => <Icon path="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM20.4 14.5L16 10 4 20" {...props} />;

export const GripVerticalIcon = (props: SpecificIconComponentProps) => <Icon path="M9 4v16M15 4v16" {...props} />;
export const TrashIcon = (props: SpecificIconComponentProps) => <Icon path="M3 6h2m16 0H5M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" {...props} />;

export const PlusIcon = (props: SpecificIconComponentProps) => <Icon path="M12 4v16m8-8H4" {...props} />;
export const EyeOpenIcon = (props: SpecificIconComponentProps) => <Icon path="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z" {...props} />;
export const EyeClosedIcon = (props: SpecificIconComponentProps) => <Icon path="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" {...props} />;
export const MoveIcon = (props: SpecificIconComponentProps) => <Icon path="M5.2 9l-3 3 3 3M9 5.2l3-3 3 3M15 18.9l-3 3-3-3M18.9 9l3 3-3 3M3.3 12h17.4M12 3.2v17.6" {...props} />;
export const SelectAllIcon = (props: SpecificIconComponentProps) => <Icon path="M21 3H3v18h18V3zM5 5h14v14H5V5z M7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" fillRule="evenodd" fill="currentColor" {...props} />;
export const CheckSquareIcon = (props: SpecificIconComponentProps) => <Icon path="M9 11l3 3 10-10M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...props} />;

export const XIcon = (props: SpecificIconComponentProps) => <Icon path="M6 18L18 6M6 6l12 12" {...props} />;

export const BrushIcon = (props: SpecificIconComponentProps) => <Icon path="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5.34M18 2l4 4L12 16H8v-4L18 2z" {...props} />;
export const ColorEraserIcon = (props: SpecificIconComponentProps) => <Icon path="M18.576 2.424a1.5 1.5 0 00-2.121 0L3 15.879V21h5.121L21.576 7.545a1.5 1.5 0 000-2.121l-3-3zM6 18H5v-1h1v1zm2 0h-1v-1h1v1zm-2-2H5v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H7v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H9v-1h1v1zm2 0h-1v-1h1v1zm4.5-4.5L13 13 M3 22.5h18" fill="currentColor" {...props} />;

export const ResetIcon = (props: SpecificIconComponentProps) => <Icon path="M19.88 5.35a1 1 0 00-1.1-.4L14.5 6.58V5a1 1 0 00-2 0v3.33a1 1 0 001 1h3.33a1 1 0 000-2h-1.25L18.8 5.72a1 1 0 00.08-.37zM4.12 18.65a1 1 0 001.1.4l4.28-1.63V19a1 1 0 002 0v-3.33a1 1 0 00-1-1H7.17a1 1 0 000 2h1.25L5.2 18.28a1 1 0 00-.08.37zM4.646 4.646a.5.5 0 01.708 0L8.5 7.793V5.5a.5.5 0 011 0v3.207a.5.5 0 01-.146.354l-3.647 3.646a.5.5 0 01-.708-.708L7.793 8.5 4.646 5.354a.5.5 0 010-.708zm14.708 14.708a.5.5 0 01-.708 0L15.5 16.207v2.293a.5.5 0 01-1 0v-3.207a.5.5 0 01.146-.354l3.647-3.646a.5.5 0 01.708.708L16.207 15.5l3.147 3.146a.5.5 0 010 .708z" fill="currentColor" {...props} />;

export const TabLayersIcon = (props: SpecificIconComponentProps) => <LayersIcon {...props} />;
export const TabColorsIcon = (props: SpecificIconComponentProps) => <PaletteIcon {...props} />;
export const TabSymbolsIcon = (props: SpecificIconComponentProps) => <Icon path="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.72-1.2-3.72-1.14 0-1.6.99-2.1 1.66-.43.57-1.02 1.26-2.03 1.26-1.14 0-1.82-.99-2.32-1.66-.49-.67-1.18-1.66-2.32-1.66-1.61 0-2.12 2.43-1.21 3.72.86 1.23 2.35 2.05 3.12 3.44M4.02 18c.87 0 1.66-.38 2.24-.99a2.97 2.97 0 00.74-2.06H2.97c0 .77.33 1.47.73 2.06.23.34.51.62.82.82v.17zM17.98 18c-.87 0-1.66-.38-2.24-.99a2.97 2.97 0 01-.74-2.06h4.03c0 .77-.33 1.47-.73 2.06-.23.34-.51.62-.82.82v-.17zM12 14.56c-1.06 0-1.8.96-1.8 2.15S10.94 19 12 19s1.8-.96 1.8-2.15S13.06 14.56 12 14.56z" fill="currentColor" {...props} />;
export const SearchIcon = (props: SpecificIconComponentProps) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...props} />;
export const SheetsIcon = (props: SpecificIconComponentProps) => <Icon path="M4 6h16M4 10h16M4 14h16M4 18h16" {...props} />;

export const RenameSheetIcon = (props: SpecificIconComponentProps) => <Icon path="M14 2l4 4L7 17H3v-4L14 2zM3 22h18" {...props} />;

export const CopyIcon = (props: SpecificIconComponentProps) => <Icon path="M9 7h10a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...props} />;
export const CutIcon = (props: SpecificIconComponentProps) => <Icon path="M6 3a3 3 0 100 6 3 3 0 000-6zM6 15a3 3 0 100 6 3 3 0 000-6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" {...props} />;
export const PasteIcon = (props: SpecificIconComponentProps) => <Icon path="M16 4h2a2 2 0 011 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" {...props} />;

export const TextWithUnderlineIcon = (props: SpecificIconComponentProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M80 0v-160h800V0H80Zm140-280 210-560h100l210 560h-96l-50-144H368l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z"/></svg>
);
export const BrushWithUnderlineIcon = (props: SpecificIconComponentProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m247-904 57-56 343 343q23 23 23 57t-23 57L457-313q-23 23-57 23t-57-23L153-503q-23-23-23-57t23-57l190-191-96-96Zm153 153L209-560h382L400-751Zm360 471q-33 0-56.5-23.5T680-360q0-21 12.5-45t27.5-45q9-12 19-25t21-25q11 12 21 25t19 25q15 21 27.5 45t12.5 45q0 33-23.5 56.5T760-280ZM80 0v-160h800V0H80Z"/></svg>
);
export const EmptySquareWithBorderIcon = (props: SpecificIconComponentProps) => (
  <Icon path="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" fill="none" {...props}/>
);

export const ToggleOnIcon = (props: SpecificIconComponentProps) => <CheckSquareIcon {...props} />;
export const ToggleOffIcon = (props: SpecificIconComponentProps) => <EmptySquareWithBorderIcon strokeWidth={2} {...props} />;

export const InformationCircleIcon = (props: SpecificIconComponentProps) => (
  <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor" {...props} />
);
