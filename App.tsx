
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { SettingsPanel } from './components/SettingsPanel';
import { Preview } from './components/Preview';
import { DownloadButtons } from './components/DownloadButtons';
import { Loader } from './components/Loader';
import { SpriteSheetSettings, ProcessResult, ProcessStatus, OutputInfo } from './types';
import { generateSpriteSheet } from './services/spriteSheetService';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [settings, setSettings] = useState<SpriteSheetSettings>({
        frameWidth: 260,
        frameHeight: 145,
        fps: 24,
        maxColumns: 8,
    });
    const [status, setStatus] = useState<ProcessStatus>({ state: 'idle' });
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [outputInfo, setOutputInfo] = useState<OutputInfo | null>(null);

    useEffect(() => {
        if (files.length === 0 || !settings.frameWidth || !settings.frameHeight || !settings.maxColumns) {
            setOutputInfo(null);
            return;
        }

        const totalFrames = files.length;
        const columns = Math.min(totalFrames, settings.maxColumns);
        
        let rows = 0;
        let effectiveFrames = 0;

        if (columns > 0) {
            rows = Math.floor(totalFrames / columns);
            effectiveFrames = rows > 0 ? rows * columns : 0;
        }

        const sheetWidth = columns * settings.frameWidth;
        const sheetHeight = rows * settings.frameHeight;
        
        let warning;
        if (sheetWidth > 8192 || sheetHeight > 8192) {
            warning = "텍스처 크기가 매우 큽니다. 대부분의 게임 엔진에서 권장하지 않습니다.";
        } else if (sheetWidth > 4096 || sheetHeight > 4096) {
            warning = "텍스처 크기가 크면 성능이나 호환성에 영향을 줄 수 있습니다.";
        }

        setOutputInfo({
            sheetWidth,
            sheetHeight,
            columns: columns > 0 && rows > 0 ? columns : 0,
            rows,
            warning,
            effectiveFrames,
            totalFrames,
        });

    }, [files, settings]);


    const handleGenerate = useCallback(async () => {
        if (files.length === 0) {
            alert('먼저 이미지를 업로드해주세요.');
            return;
        }
        setStatus({ state: 'processing', message: '이미지 로딩 중...' });
        setResult(null);

        try {
            const processResult = await generateSpriteSheet(files, settings, (message) => {
                setStatus({ state: 'processing', message });
            });
            setResult(processResult);
            setStatus({ state: 'done' });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            setStatus({ state: 'error', message: errorMessage });
        }
    }, [files, settings]);

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles);
        setResult(null);
        setStatus({ state: 'idle' });

        if (newFiles.length > 0) {
            // Calculate a squarish layout for the initial setting
            const optimalCols = Math.ceil(Math.sqrt(newFiles.length));
            setSettings(prev => ({ ...prev, maxColumns: optimalCols }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="w-8 h-8 text-cyan-400" />
                        <h1 className="text-2xl font-bold tracking-tight text-white">스프라이트 시트 스튜디오</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-8">
                        <ImageUploader onFilesChange={handleFilesChange} />
                        <SettingsPanel settings={settings} onSettingsChange={setSettings} outputInfo={outputInfo} />
                        <button
                            onClick={handleGenerate}
                            disabled={files.length === 0 || status.state === 'processing'}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                        >
                            {status.state === 'processing' ? <Loader /> : '스프라이트 시트 생성'}
                        </button>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 h-full min-h-[60vh] flex flex-col">
                            {status.state === 'processing' && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader />
                                    <p className="mt-4 text-lg text-gray-400">{status.message}</p>
                                </div>
                            )}
                            {status.state === 'error' && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-2xl text-red-400">생성 실패</p>
                                    <p className="mt-2 text-gray-400">{status.message}</p>
                                </div>
                            )}
                            {status.state !== 'processing' && !result && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-2xl text-gray-400">미리보기 영역</p>
                                    <p className="mt-2 text-gray-500">이미지를 업로드하고 "생성" 버튼을 눌러 결과를 확인하세요.</p>
                                </div>
                            )}
                            {result && (
                                <div className="space-y-6 flex-grow flex flex-col">
                                    <Preview result={result} settings={settings} />
                                    <DownloadButtons result={result} settings={settings} onStatusUpdate={setStatus} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
