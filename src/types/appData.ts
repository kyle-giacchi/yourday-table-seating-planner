import type { Table, Guest, RoomAsset } from './seating';
import type { RoomRectangle } from './room';

export interface BackgroundImageState {
  backgroundImage: string | null;
  imageOpacity: number;
  imagePosition?: { x: number; y: number };
  imageScale?: number;
}

export interface AppSettings {
  roomOutline: RoomRectangle;
  roomBorder: RoomRectangle;
  backgroundImage: BackgroundImageState;
  isReferenceLocked: boolean;
}

export interface ColorTheme {
  name: string;
  value: string;
  rgb: string;
  description: string;
  secondary: string;
  secondaryRgb: string;
}

export interface AppData {
  version: string;
  lastModified: number;
  tables: Table[];
  guests: Guest[];
  assets: RoomAsset[];
  settings: AppSettings;
  colorTheme?: ColorTheme;
}
