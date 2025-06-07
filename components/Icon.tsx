
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

export const PenIcon = (props: SpecificIconComponentProps) => <Icon path="M17.086 2.914a2.828 2.828 0 00-4 0L3 13.086V17h3.914L17.086 6.828a2.828 2.828 0 000-4zM13 7L7 13" {...props} />;
export const EraserIcon = (props: SpecificIconComponentProps) => <Icon path="M6.162 6.162a2.5 2.5 0 013.536 0L15.536 12l-5.838 5.838a2.5 2.5 0 01-3.536-3.536L12 12.464 6.162 6.626V6.162zm9.9-2.475L10.225 9.525M19.5 8.5l-3.536 3.536" {...props} />;
export const SelectIcon = (props: SpecificIconComponentProps) => <Icon path="M3 3h4M3 3v4m14-4h4m0 0v4M3 21h4m0 0v-4m14 4h4m0 0v-4M9 3h6M9 21h6M3 9v6M21 9v6" strokeWidth={1.5} {...props} />;
export const PaletteIcon = (props: SpecificIconComponentProps) => <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.35 0 2.65-.26 3.84-.73l-.04.03c.16-.09.31-.18.46-.29.99-.68 1.81-1.59 2.42-2.62.01 0 .01-.01.02-.01.06-.1.11-.2.17-.3.05-.1.1-.19.15-.29.45-.92.75-1.93.86-2.98.01-.02.01-.04.02-.06.02-.16.04-.32.05-.48C22 10 22 8.85 21.74 7.75c-.06-.25-.12-.5-.2-.74-.09-.3-.19-.59-.3-.87-.29-.81-.68-1.56-1.15-2.23-.09-.13-.19-.26-.29-.38-.01-.02-.03-.03-.04-.05-.6-.78-1.32-1.46-2.13-2.02A9.992 9.992 0 0012 2zm-1 14H9v-2h2v2zm0-4H9V9.99h2V12zm0-4.01H9V6h2v1.99zm4 4H13v-2h2v2zm0-4H13V9.99h2V12zm0-4.01H13V6h2v1.99z" fill="currentColor" {...props}/>;
export const LayersIcon = (props: SpecificIconComponentProps) => <Icon path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...props} />;
export const UndoIcon = (props: SpecificIconComponentProps) => <Icon path="M10 19H6.229a2 2 0 01-1.95-2.408l.19-1.046M3 10l4-4 4 4" {...props} />;
export const RedoIcon = (props: SpecificIconComponentProps) => <Icon path="M14 19h3.771a2 2 0 001.95-2.408l-.19-1.046M21 10l-4-4-4 4" {...props} />;
export const SettingsIcon = (props: SpecificIconComponentProps) => <Icon path="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.23,5.08C8.64,5.32,8.11,5.64,7.61,6.02L5.22,5.06C5,4.99,4.75,5.07,4.63,5.29L2.71,8.6 c-0.11,0.21-0.06,0.47,0.12,0.61l2.03,1.58C4.82,11.36,4.8,11.68,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39,0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.27 c0.04,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43,0.17,0.47,0.41l0.36-2.27c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.07,0.47-0.01,0.59-0.22l1.92-3.32C21.39,13.76,21.34,13.5,21.16,13.36L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor" {...props} />;
export const ZoomInIcon = (props: SpecificIconComponentProps) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3h-6" {...props} />;
export const ZoomOutIcon = (props: SpecificIconComponentProps) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" {...props} />;
export const SunIcon = (props: SpecificIconComponentProps) => <Icon path="M12 3V1m0 22v-2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m22 0h-2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 18a6 6 0 100-12 6 6 0 000 12z" {...props} />;
export const MoonIcon = (props: SpecificIconComponentProps) => <Icon path="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" {...props} />;
export const RowsIcon = (props: SpecificIconComponentProps) => <Icon path="M3 12h18M3 6h18M3 18h18" {...props} />;
export const ColumnsIcon = (props: SpecificIconComponentProps) => <Icon path="M12 3v18M6 3v18M18 3v18" {...props} />;

export const DownloadIcon = (props: SpecificIconComponentProps) => <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" {...props}/>; 
export const UploadIcon = (props: SpecificIconComponentProps) => <Icon path="M3 16.5v-2.25A2.25 2.25 0 015.25 12h13.5A2.25 2.25 0 0121 14.25V16.5m-16.5-4.5L12 7.5m0 0l4.5 4.5M12 7.5v9" {...props} />; 

export const TextIcon = (props: SpecificIconComponentProps) => <Icon path="M17 4H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2zM9 8h6M9 12h4m-4 4h2" {...props} />;
export const GripVerticalIcon = (props: SpecificIconComponentProps) => <Icon path="M9 4v16M15 4v16" {...props} />;
export const TrashIcon = (props: SpecificIconComponentProps) => <Icon path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" {...props} />;
export const PlusIcon = (props: SpecificIconComponentProps) => <Icon path="M12 4v16m8-8H4" {...props} />;
export const EyeOpenIcon = (props: SpecificIconComponentProps) => <Icon path="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z" {...props} />;
export const EyeClosedIcon = (props: SpecificIconComponentProps) => <Icon path="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" {...props} />;
export const MoveIcon = (props: SpecificIconComponentProps) => <Icon path="M9.998 5.002a.999.999 0 011.414 0l2.475 2.475a.5.5 0 010 .707L12.475 9.6a.5.5 0 01-.707 0l-1.414-1.414V11.5a.5.5 0 01-1 0V8.186L7.94 9.6a.5.5 0 01-.707 0L5.82 8.186a.5.5 0 010-.707l2.475-2.475a.999.999 0 011.414 0L9.998 5.002zm4.004 14a.999.999 0 01-1.414 0l-2.475-2.475a.5.5 0 010-.707l1.414-1.414a.5.5 0 01.707 0l1.414 1.414V12.5a.5.5 0 011 0v3.314l1.414-1.414a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707l-2.475 2.475a.999.999 0 01-1.414 0zM5 10.002a.999.999 0 010-1.414l2.475-2.475a.5.5 0 01.707 0L9.6 7.525a.5.5 0 010 .707L8.186 9.64v1.414a.5.5 0 010 .707l1.414 1.414a.5.5 0 01-.707.707L7.525 12.5H5.5a.5.5 0 010-1h2.025l-1.414-1.414a.999.999 0 010-1.414L5 10.002zm14 4.001a.999.999 0 010 1.414l-2.475 2.475a.5.5 0 01-.707 0L14.4 16.478a.5.5 0 010-.707l1.414-1.414V12.94a.5.5 0 010-.707l-1.414-1.414a.5.5 0 01.707-.707l1.414 1.414H20.5a.5.5 0 010 1h-2.025l1.414 1.414a.999.999 0 010 1.414l.002.001z" fill="currentColor" viewBox="0 0 24 24" {...props} />;
export const SelectAllIcon = (props: SpecificIconComponentProps) => <Icon path="M21 3H3v18h18V3zM5 5h14v14H5V5z M7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" fillRule="evenodd" fill="currentColor" {...props} />;
export const CheckSquareIcon = (props: SpecificIconComponentProps) => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" {...props} />;

export const CheckIcon = (props: SpecificIconComponentProps) => <Icon path="M5 13l4 4L19 7" {...props} />;
export const XIcon = (props: SpecificIconComponentProps) => <Icon path="M6 18L18 6M6 6l12 12" {...props} />;

export const BrushIcon = (props: SpecificIconComponentProps) => <Icon path="M18.576 2.424a1.5 1.5 0 00-2.121 0L3 15.879V21h5.121L21.576 7.545a1.5 1.5 0 000-2.121l-3-3zM6 18H5v-1h1v1zm2 0h-1v-1h1v1zm-2-2H5v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H7v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H9v-1h1v1zm2 0h-1v-1h1v1zm4.5-4.5L13 13" {...props} fill="currentColor" /> 
export const ColorEraserIcon = (props: SpecificIconComponentProps) => <Icon path="M18.576 2.424a1.5 1.5 0 00-2.121 0L3 15.879V21h5.121L21.576 7.545a1.5 1.5 0 000-2.121l-3-3zM6 18H5v-1h1v1zm2 0h-1v-1h1v1zm-2-2H5v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H7v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H9v-1h1v1zm2 0h-1v-1h1v1zm-1.5-5.5l-4-4M19 10l-4-4" {...props} /> 
export const ResetIcon = (props: SpecificIconComponentProps) => <Icon path="M19.88 5.35a1 1 0 00-1.1-.4L14.5 6.58V5a1 1 0 00-2 0v3.33a1 1 0 001 1h3.33a1 1 0 000-2h-1.25L18.8 5.72a1 1 0 00.08-.37zM4.12 18.65a1 1 0 001.1.4l4.28-1.63V19a1 1 0 002 0v-3.33a1 1 0 00-1-1H7.17a1 1 0 000 2h1.25L5.2 18.28a1 1 0 00-.08.37zM4.646 4.646a.5.5 0 01.708 0L8.5 7.793V5.5a.5.5 0 011 0v3.207a.5.5 0 01-.146.354l-3.647 3.646a.5.5 0 01-.708-.708L7.793 8.5 4.646 5.354a.5.5 0 010-.708zm14.708 14.708a.5.5 0 01-.708 0L15.5 16.207v2.293a.5.5 0 01-1 0v-3.207a.5.5 0 01.146-.354l3.647-3.646a.5.5 0 01.708.708L16.207 15.5l3.147 3.146a.5.5 0 010 .708z" fill="currentColor" {...props} />;

export const TabLayersIcon = (props: SpecificIconComponentProps) => <LayersIcon {...props} />;
export const TabColorsIcon = (props: SpecificIconComponentProps) => <PaletteIcon {...props} />;
export const TabSymbolsIcon = (props: SpecificIconComponentProps) => <Icon path="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.72-1.2-3.72-1.14 0-1.6.99-2.1 1.66-.43.57-1.02 1.26-2.03 1.26-1.14 0-1.82-.99-2.32-1.66-.49-.67-1.18-1.66-2.32-1.66-1.61 0-2.12 2.43-1.21 3.72.86 1.23 2.35 2.05 3.12 3.44M4.02 18c.87 0 1.66-.38 2.24-.99a2.97 2.97 0 00.74-2.06H2.97c0 .77.33 1.47.73 2.06.23.34.51.62.82.82v.17zM17.98 18c-.87 0-1.66-.38-2.24-.99a2.97 2.97 0 01-.74-2.06h4.03c0 .77-.33 1.47-.73 2.06-.23.34-.51.62-.82.82v-.17zM12 14.56c-1.06 0-1.8.96-1.8 2.15S10.94 19 12 19s1.8-.96 1.8-2.15S13.06 14.56 12 14.56z" fill="currentColor" {...props} /> 
export const SearchIcon = (props: SpecificIconComponentProps) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...props} />;
export const SheetsIcon = (props: SpecificIconComponentProps) => <Icon path="M4 6h16M4 10h16M4 14h16M4 18h16" {...props} />; 

export const CopyIcon = (props: SpecificIconComponentProps) => <Icon path="M8 16H4a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v2M12 8h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" viewBox="0 0 24 24" {...props} />;
export const CutIcon = (props: SpecificIconComponentProps) => <Icon path="M6 2L18 14M6 14L18 2M7 4a3 3 0 100 6 3 3 0 000-6zm10 10a3 3 0 100 6 3 3 0 000-6z" viewBox="0 0 24 24" {...props} />;
export const PasteIcon = (props: SpecificIconComponentProps) => <Icon path="M9 2H5a1 1 0 00-1 1v12a1 1 0 001 1h4m0-14v-1a1 1 0 011-1h4a1 1 0 011 1v1m0 0h2.586a1 1 0 01.707.293l2.707 2.707a1 1 0 01.293.707V14a1 1 0 01-1 1h-10a1 1 0 01-1-1V3a1 1 0 011-1H9m4 3h2m-1 8v4m-2-2h4" viewBox="0 0 20 20" {...props} />

export const TextWithUnderlineIcon = (props: SpecificIconComponentProps) => <Icon path="M17 4H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2zM9 8h6M9 12h4m-4 4h2 M5 21h14" fill="currentColor" {...props} />; 
export const BrushWithUnderlineIcon = (props: SpecificIconComponentProps) => <Icon path="M18.576 2.424a1.5 1.5 0 00-2.121 0L3 15.879V21h5.121L21.576 7.545a1.5 1.5 0 000-2.121l-3-3zM6 18H5v-1h1v1zm2 0h-1v-1h1v1zm-2-2H5v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H7v-1h1v1zm2 0h-1v-1h1v1zm2 0h-1v-1h1v1zm-2-2H9v-1h1v1zm2 0h-1v-1h1v1zm4.5-4.5L13 13 M3 22.5h18" fill="currentColor" {...props} />; 

export const MinusIcon = (props: SpecificIconComponentProps) => <Icon path="M19 13H5" {...props} />; 
export { LayersIcon as SymbolIcon } ;

export const EmptySquareWithBorderIcon = (props: SpecificIconComponentProps) => (
  <Icon path="M3 3h18v18H3z" fill="none" strokeWidth={props.strokeWidth !== undefined ? props.strokeWidth : 2} {...props}/>
);

export const TransparentBackgroundIconOld = (props: SpecificIconComponentProps) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5" y1="19" x2="19" y2="5" stroke="red" strokeWidth="2.5" />
  </svg>
);
export const TransparentBackgroundIcon = (props: SpecificIconComponentProps) => (
  <Icon path="M3 3h18v18H3V3z M4 4v16h16V4H4z M19 5L5 19" fill="none" strokeWidth={1.5} {...props}/>
);

export const ImageIcon = (props: SpecificIconComponentProps) => <Icon path="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM5 19V5h14l.002 14H5z M8.707 15.293l-1.414-1.414L4 17.172V18h16v-2.828l-4.707-4.707L12 13.464l-1.879-1.879L8.707 15.293zM15 10c0 1.103-.897 2-2 2s-2-.897-2-2 .897-2 2-2 2 .897 2 2z" fill="currentColor" {...props} />;

export const ToggleOnIcon = (props: SpecificIconComponentProps) => <CheckSquareIcon fill="currentColor" {...props} />;
export const ToggleOffIcon = (props: SpecificIconComponentProps) => <EmptySquareWithBorderIcon strokeWidth={2} {...props} />;

export const InformationCircleIcon = (props: SpecificIconComponentProps) => (
  <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor" {...props} />
);
