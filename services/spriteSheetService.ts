import { SpriteSheetSettings, ProcessResult } from '../types';

const workerCode = `
self.onmessage = async (event) => {
    const { files, settings } = event.data;
    const { frameWidth, frameHeight, maxColumns } = settings;

    const loadImageBitmap = async (file) => {
        return createImageBitmap(file);
    };

    try {
        const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        
        let totalFrames = sortedFiles.length;
        const columns = Math.min(totalFrames, maxColumns);

        if (columns === 0) {
            self.postMessage({ type: 'result', payload: { spriteSheetBlob: null, frames: [], columns: 0, rows: 0, totalFrames: 0 } });
            return;
        }
        
        const rows = Math.floor(totalFrames / columns);

        if (rows === 0) {
             self.postMessage({ type: 'error', message: '프레임 수가 컬럼 수보다 적어 시트를 생성할 수 없습니다. 컬럼 수를 줄여주세요.' });
             return;
        }
        const effectiveTotalFrames = rows * columns;
        const filesToProcess = sortedFiles.slice(0, effectiveTotalFrames);
        totalFrames = filesToProcess.length;

        if (totalFrames === 0) {
            self.postMessage({ type: 'result', payload: { spriteSheetBlob: null, frames: [], columns: 0, rows: 0, totalFrames: 0 } });
            return;
        }

        self.postMessage({ type: 'progress', message: \`이미지 \${totalFrames}개 로딩 중...\` });
        const images = await Promise.all(filesToProcess.map(loadImageBitmap));

        self.postMessage({ type: 'progress', message: '프레임 처리 중...' });
        
        const sheetWidth = columns * frameWidth;
        const sheetHeight = rows * frameHeight;

        const sheetCanvas = new OffscreenCanvas(sheetWidth, sheetHeight);
        const sheetCtx = sheetCanvas.getContext('2d');
        if (!sheetCtx) throw new Error('스프라이트 시트의 2D 컨텍스트를 가져올 수 없습니다.');

        sheetCtx.fillStyle = 'rgba(0,0,0,0)';
        sheetCtx.fillRect(0, 0, sheetWidth, sheetHeight);

        const processedFrames = [];

        for (let i = 0; i < totalFrames; i++) {
            if (i % 10 === 0) {
                self.postMessage({ type: 'progress', message: \`\${totalFrames}개 중 \${i + 1}번째 프레임 처리 중...\` });
            }
            const img = images[i];
            
            const frameCanvas = new OffscreenCanvas(frameWidth, frameHeight);
            const frameCtx = frameCanvas.getContext('2d');
            if (!frameCtx) throw new Error(\`\${i}번 프레임의 2D 컨텍스트를 가져올 수 없습니다.\`);

            // 'Crop to fill' 로직으로 이미지 왜곡 문제 해결
            const imgAspectRatio = img.width / img.height;
            const frameAspectRatio = frameWidth / frameHeight;

            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            if (imgAspectRatio > frameAspectRatio) {
                // 이미지가 프레임보다 넓으면, 너비를 자름
                sWidth = img.height * frameAspectRatio;
                sx = (img.width - sWidth) / 2;
            } else if (imgAspectRatio < frameAspectRatio) {
                // 이미지가 프레임보다 높으면, 높이를 자름
                sHeight = img.width / frameAspectRatio;
                sy = (img.height - sHeight) / 2;
            }

            frameCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, frameWidth, frameHeight);
            
            const col = i % columns;
            const row = Math.floor(i / columns);
            const sheetX = col * frameWidth;
            const sheetY = row * frameHeight;

            // 중요: 렌더링 순서 수정
            // 1. 스프라이트 시트에 먼저 그립니다.
            sheetCtx.drawImage(frameCanvas, sheetX, sheetY);
            
            // 2. 그 다음, 애니메이션 미리보기를 위해 ImageBitmap으로 변환합니다.
            const frameBitmap = frameCanvas.transferToImageBitmap();
            processedFrames.push(frameBitmap);
        }
        
        self.postMessage({ type: 'progress', message: '스프라이트 시트 마무리 중...' });

        const blob = await sheetCanvas.convertToBlob({ type: 'image/png' });
        
        self.postMessage({
            type: 'result',
            payload: {
                spriteSheetBlob: blob,
                frames: processedFrames,
                columns,
                rows,
                totalFrames,
            }
        }, processedFrames);

    } catch (error) {
        self.postMessage({ type: 'error', message: error.message });
    }
};
`;

let worker: Worker | null = null;

function getWorker(): Worker {
    if (!worker) {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
    }
    return worker;
}

export const generateSpriteSheet = async (
    files: File[],
    settings: SpriteSheetSettings,
    onProgress: (message: string) => void
): Promise<ProcessResult> => {
    const workerInstance = getWorker();
    
    return new Promise((resolve, reject) => {
        workerInstance.onmessage = (event) => {
            const { type, message, payload } = event.data;
            if (type === 'progress') {
                onProgress(message);
            } else if (type === 'result') {
                const { spriteSheetBlob, ...rest } = payload;
                if (!spriteSheetBlob) {
                     reject(new Error("생성된 프레임이 없어 시트를 만들 수 없습니다."));
                     return;
                }
                resolve({
                    ...rest,
                    spriteSheetUrl: URL.createObjectURL(spriteSheetBlob),
                });
            } else if (type === 'error') {
                reject(new Error(message));
            }
        };

        workerInstance.onerror = (error) => {
            reject(error);
        };

        // Transfer files to the worker
        workerInstance.postMessage({ files, settings });
    });
};