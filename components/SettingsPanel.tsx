
import React from 'react';
import { SpriteSheetSettings, OutputInfo } from '../types';

interface SettingsPanelProps {
    settings: SpriteSheetSettings;
    onSettingsChange: (settings: SpriteSheetSettings) => void;
    outputInfo: OutputInfo | null;
}

const SettingInput: React.FC<{ label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; description?: string }> = ({ label, value, onChange, min = 1, max = 2048, description }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                min={min}
                max={max}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
            />
            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
    );
};


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, outputInfo }) => {
    const handleChange = <K extends keyof SpriteSheetSettings,>(key: K, value: SpriteSheetSettings[K]) => {
        if(typeof value === 'number' && (isNaN(value as number) || value < 1)) return;
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">2. 설정 구성</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <SettingInput 
                        label="프레임 너비 (px)" 
                        value={settings.frameWidth} 
                        onChange={(v) => handleChange('frameWidth', v)}
                        description="각 개별 프레임의 너비입니다."
                    />
                    <SettingInput 
                        label="프레임 높이 (px)" 
                        value={settings.frameHeight} 
                        onChange={(v) => handleChange('frameHeight', v)}
                        description="각 개별 프레임의 높이입니다."
                    />
                </div>
                <SettingInput 
                    label="컬럼" 
                    value={settings.maxColumns} 
                    onChange={(v) => handleChange('maxColumns', v)} 
                    max={128}
                    description="한 줄에 들어갈 프레임 수입니다. 마지막 줄을 채우지 못하는 프레임은 자동으로 제거됩니다."
                />
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">애니메이션 FPS ({settings.fps})</label>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        value={settings.fps}
                        onChange={(e) => handleChange('fps', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">미리보기 및 결과물의 재생 속도를 조절합니다.</p>
                </div>
            </div>

            {outputInfo && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-2 text-white">예상 결과물</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <span className="text-gray-400">시트 크기:</span>
                        <span className="text-white font-mono text-right">{outputInfo.sheetWidth} x {outputInfo.sheetHeight} px</span>
                        
                        <span className="text-gray-400">레이아웃 (열x행):</span>
                        <span className="text-white font-mono text-right">{outputInfo.columns} x {outputInfo.rows}</span>

                        <span className="text-gray-400">사용 프레임:</span>
                        <span className="text-white font-mono text-right">{outputInfo.effectiveFrames} / {outputInfo.totalFrames}</span>
                    </div>
                    {outputInfo.warning && (
                        <p className="mt-3 text-sm text-amber-400 bg-amber-900/50 p-3 rounded-md border border-amber-400/30">
                            <strong>경고:</strong> {outputInfo.warning}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
