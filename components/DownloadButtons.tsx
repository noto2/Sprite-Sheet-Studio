
import React, { useCallback } from 'react';
import { SpriteSheetSettings, ProcessResult, ProcessStatus } from '../types';
import { DownloadIcon, GIFIcon, VideoIcon } from './icons';

// Make GIF type available from gif.js CDN
declare var GIF: any;

interface DownloadButtonsProps {
    result: ProcessResult;
    settings: SpriteSheetSettings;
    onStatusUpdate: (status: ProcessStatus) => void;
}

export const DownloadButtons: React.FC<DownloadButtonsProps> = ({ result, settings, onStatusUpdate }) => {

    const downloadFile = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPNG = () => {
        downloadFile(result.spriteSheetUrl, 'sprite-sheet.png');
    };

    const handleDownloadGIF = useCallback(() => {
        onStatusUpdate({ state: 'processing', message: 'GIF 생성 중...' });
        
        const gif = new GIF({
            workers: 4,
            quality: 10,
            width: settings.frameWidth,
            height: settings.frameHeight,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = settings.frameWidth;
        tempCanvas.height = settings.frameHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
            onStatusUpdate({ state: 'error', message: 'GIF 내보내기를 위한 캔버스를 생성할 수 없습니다.' });
            return;
        }

        result.frames.forEach(frameBitmap => {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(frameBitmap, 0, 0);
            gif.addFrame(tempCanvas, { copy: true, delay: 1000 / settings.fps });
        });

        gif.on('finished', (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            downloadFile(url, 'animation.gif');
            onStatusUpdate({ state: 'done' });
        });

        gif.on('progress', (p: number) => {
            onStatusUpdate({ state: 'processing', message: `GIF 생성 중... ${(p * 100).toFixed(0)}%` });
        });

        gif.render();
    }, [result.frames, settings, onStatusUpdate]);

    const handleDownloadVideo = useCallback(async () => {
        if (!('MediaRecorder' in window)) {
            alert('사용 중인 브라우저에서는 비디오 내보내기를 지원하지 않습니다.');
            return;
        }

        onStatusUpdate({ state: 'processing', message: '실시간으로 비디오를 녹화하고 있습니다... 잠시만 기다려주세요.' });

        let mimeType = 'video/mp4; codecs=avc1.42E01E';
        let fileExtension = 'mp4';

        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm; codecs=vp9';
            fileExtension = 'webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                 onStatusUpdate({ state: 'error', message: '브라우저에서 지원하는 적절한 비디오 형식이 없습니다.' });
                 return;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = settings.frameWidth;
        canvas.height = settings.frameHeight;
        const ctx = canvas.getContext('2d');
        if(!ctx) {
            onStatusUpdate({ state: 'error', message: '비디오 내보내기를 위한 캔버스를 생성할 수 없습니다.' });
            return;
        }

        const stream = canvas.captureStream(settings.fps);
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            downloadFile(url, `animation.${fileExtension}`);
            onStatusUpdate({ state: 'done' });
        };
        
        recorder.start();

        for (const frame of result.frames) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(frame, 0, 0);
            // This timeout is necessary to ensure each frame is captured at the correct rate.
            await new Promise(resolve => setTimeout(resolve, 1000 / settings.fps));
        }

        recorder.stop();
    }, [result.frames, settings, onStatusUpdate]);


    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={handleDownloadPNG} className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <DownloadIcon className="w-5 h-5" />
                <span>PNG 시트</span>
            </button>
            <button onClick={handleDownloadGIF} className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <GIFIcon className="w-5 h-5" />
                <span>GIF로 내보내기</span>
            </button>
            <button onClick={handleDownloadVideo} className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <VideoIcon className="w-5 h-5" />
                <span>비디오로 내보내기</span>
            </button>
        </div>
    );
};
