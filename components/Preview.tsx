
import React, { useState, useEffect, useRef } from 'react';
import { SpriteSheetSettings, ProcessResult } from '../types';

interface PreviewProps {
    result: ProcessResult;
    settings: SpriteSheetSettings;
}

type ViewMode = 'animation' | 'sheet';

export const Preview: React.FC<PreviewProps> = ({ result, settings }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('animation');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        if (viewMode !== 'animation' || !result.frames.length) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameIndex = 0;
        let lastTime = 0;
        const frameInterval = 1000 / settings.fps;

        const animate = (timestamp: number) => {
            if (lastTime === 0) {
                lastTime = timestamp;
            }

            const deltaTime = timestamp - lastTime;
            if (deltaTime > frameInterval) {
                lastTime = timestamp - (deltaTime % frameInterval);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(result.frames[frameIndex], 0, 0);

                frameIndex = (frameIndex + 1) % result.frames.length;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [viewMode, result.frames, settings.fps]);
    
    const TabButton: React.FC<{ mode: ViewMode, children: React.ReactNode }> = ({ mode, children }) => (
        <button
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === mode
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                   <TabButton mode="animation">애니메이션 미리보기</TabButton>
                   <TabButton mode="sheet">스프라이트 시트</TabButton>
                </div>
                <div className="text-sm text-gray-400">
                    {result.totalFrames} 프레임 ({result.columns}x{result.rows})
                </div>
            </div>

            <div className="flex-grow bg-gray-900/50 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                {viewMode === 'animation' ? (
                    <canvas
                        ref={canvasRef}
                        width={settings.frameWidth}
                        height={settings.frameHeight}
                        className="max-w-full max-h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                    />
                ) : (
                    <img
                        src={result.spriteSheetUrl}
                        alt="Generated Sprite Sheet"
                        className="max-w-full max-h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                    />
                )}
            </div>
        </div>
    );
};
