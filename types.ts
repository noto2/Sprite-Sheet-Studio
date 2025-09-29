
export interface SpriteSheetSettings {
    frameWidth: number;
    frameHeight: number;
    fps: number;
    maxColumns: number;
}

export interface ProcessResult {
    spriteSheetUrl: string;
    frames: ImageBitmap[];
    columns: number;
    rows: number;
    totalFrames: number;
}

export type ProcessState = 'idle' | 'processing' | 'done' | 'error';

export interface ProcessStatus {
    state: ProcessState;
    message?: string;
}

export interface OutputInfo {
    sheetWidth: number;
    sheetHeight: number;
    columns: number;
    rows: number;
    warning?: string;
    effectiveFrames: number;
    totalFrames: number;
}
