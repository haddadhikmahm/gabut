document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const video = document.getElementById('camera-feed');
    const frameOverlay = document.getElementById('frame-overlay');
    const cameraStatus = document.getElementById('camera-status');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');
    const resultArea = document.getElementById('result-area');
    const resultImage = document.getElementById('result-image');
    
    // Buttons
    const btnCapture = document.getElementById('btn-capture');
    const resultActions = document.getElementById('result-actions');
    const btnRetake = document.getElementById('btn-retake');
    const btnDownload = document.getElementById('btn-download');
    const btnShowFrames = document.getElementById('btn-show-frames');
    const btnCloseFrames = document.getElementById('btn-close-frames');
    const btnFlipCamera = document.getElementById('btn-flip-camera');
    const uploadInput = document.getElementById('upload-input');
    
    // UI Elements
    const frameModal = document.getElementById('frame-modal');
    const frameOptions = document.querySelectorAll('.frame-option');

    // AI Magic: Cache & Function to remove fake transparency
    const processedFrames = {};

    function getTransparentFrame(src) {
        if (processedFrames[src]) return Promise.resolve(processedFrames[src]);

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const cvs = document.createElement('canvas');
                const w = img.width;
                const h = img.height;
                cvs.width = w; cvs.height = h;
                const ctx = cvs.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;

                // --- SPECIAL FIX UNTUK FRAME BARU (AI GENERATED) ---
                if (src.includes('frame1.png')) {
                    ctx.clearRect(w * 0.096, h * 0.236, w * 0.815, h * 0.665);
                    const resultUrl = cvs.toDataURL('image/png');
                    processedFrames[src] = resultUrl;
                    resolve(resultUrl);
                    return;
                }
                if (src.includes('frame11.png')) {
                    // Sesuai garis merah yang Anda gambar!
                    ctx.clearRect(w * 0.05, h * 0.18, w * 0.90, h * 0.48);
                    const resultUrl = cvs.toDataURL('image/png');
                    processedFrames[src] = resultUrl;
                    resolve(resultUrl);
                    return;
                }
                if (src.includes('frame12.png') || src.includes('frame13.png')) {
                    // Frame Social & K-Pop: Bolongi area besar di tengah
                    ctx.clearRect(w * 0.12, h * 0.15, w * 0.76, h * 0.70);
                    const resultUrl = cvs.toDataURL('image/png');
                    processedFrames[src] = resultUrl;
                    resolve(resultUrl);
                    return;
                }
                // --------------------------------------------------
                
                const isLight = (idx) => {
                    const p = idx * 4;
                    // Kriteria: putih atau abu-abu terang
                    return data[p] > 175 && data[p+1] > 175 && data[p+2] > 175 && data[p+3] > 0;
                };

                const visited = new Uint8Array(w * h);
                let maxArea = 0;
                let bestSeed = -1;

                // Pass 1: Cari area terang paling besar yang bersambung (pasti ini adalah kotak placeholder)
                for (let i = 0; i < w * h; i += 47) { // Cek tiap beberapa pixel biar cepat
                    if (!visited[i] && isLight(i)) {
                        let area = 0;
                        const stack = [i];
                        
                        while(stack.length > 0) {
                            const idx = stack.pop();
                            if (visited[idx]) continue;
                            visited[idx] = 1;
                            area++;
                            
                            const x = idx % w;
                            const y = Math.floor(idx / w);
                            
                            if (x > 0 && !visited[idx - 1] && isLight(idx - 1)) stack.push(idx - 1);
                            if (x < w - 1 && !visited[idx + 1] && isLight(idx + 1)) stack.push(idx + 1);
                            if (y > 0 && !visited[idx - w] && isLight(idx - w)) stack.push(idx - w);
                            if (y < h - 1 && !visited[idx + w] && isLight(idx + w)) stack.push(idx + w);
                        }
                        
                        if (area > maxArea) {
                            maxArea = area;
                            bestSeed = i;
                        }
                    }
                }

                // Pass 2: Kosongkan area terbesar tersebut (Jadikan transparan)
                if (bestSeed !== -1 && maxArea > (w * h * 0.02)) { // minimal 2% dari total gambar
                    visited.fill(0);
                    const stack = [bestSeed];
                    
                    while(stack.length > 0) {
                        const idx = stack.pop();
                        if (visited[idx]) continue;
                        visited[idx] = 1;
                        
                        data[idx * 4 + 3] = 0; // Alpha = 0 (Transparan!)
                        
                        const x = idx % w;
                        const y = Math.floor(idx / w);
                        
                        if (x > 0 && !visited[idx - 1] && isLight(idx - 1)) stack.push(idx - 1);
                        if (x < w - 1 && !visited[idx + 1] && isLight(idx + 1)) stack.push(idx + 1);
                        if (y > 0 && !visited[idx - w] && isLight(idx - w)) stack.push(idx - w);
                        if (y < h - 1 && !visited[idx + w] && isLight(idx + w)) stack.push(idx + w);
                    }
                    ctx.putImageData(imgData, 0, 0);
                }
                
                const resultUrl = cvs.toDataURL('image/png');
                processedFrames[src] = resultUrl;
                resolve(resultUrl);
            };
            img.src = src;
        });
    }

    // ---- FILE UPLOAD LOGIC ----
    if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            await handlePhotoUpload(files);
        });
    }

    async function handlePhotoUpload(files) {
        const needed = currentLayout === '1-cut' ? 1 : 4;
        const uploadedUrls = [];
        
        // Convert files to base64
        const readImage = (file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        for (let i = 0; i < files.length && i < needed; i++) {
            uploadedUrls.push(await readImage(files[i]));
        }

        // Apply frames to uploaded photos
        const captures = [];
        const targetWidth = 1080;
        const targetHeight = 1440;

        for (let i = 0; i < needed; i++) {
            const src = uploadedUrls[i % uploadedUrls.length]; // loop if < needed
            const img = await new Promise(res => {
                const i = new Image(); i.onload = () => res(i); i.src = src;
            });
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetWidth; tempCanvas.height = targetHeight;
            const tempCtx = tempCanvas.getContext('2d');
            
            // object-fit: cover logic
            const imgRatio = img.width / img.height;
            const targetRatio = targetWidth / targetHeight;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (imgRatio > targetRatio) {
                drawHeight = targetHeight;
                drawWidth = img.height * imgRatio * (targetHeight / img.height);
                offsetX = (targetWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = targetWidth;
                drawHeight = img.width / imgRatio * (targetWidth / img.width);
                offsetX = 0;
                offsetY = (targetHeight - drawHeight) / 2;
            }
            
            // Draw photo (front camera flip NOT applied to uploads)
            tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
            // Overlay frame
            tempCtx.drawImage(frameOverlay, 0, 0, targetWidth, targetHeight);
            
            captures.push(tempCanvas);
        }

        uploadInput.value = ''; // Reset input
        processCapturesAndShowResult(captures);
    }

    async function processCapturesAndShowResult(captures) {
        // Build Final Collage
        const finalWidth = currentLayout === '4-cut-grid' ? 1080 * 2 : 1080;
        const finalHeight = currentLayout === '4-cut-grid' ? 1440 * 2 : (currentLayout === '4-cut-strip' ? 1440 * 4 : 1440);
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        if (currentLayout === '1-cut') {
            ctx.drawImage(captures[0], 0, 0);
        } else if (currentLayout === '4-cut-strip') {
            ctx.drawImage(captures[0], 0, 0);
            ctx.drawImage(captures[1], 0, 1440);
            ctx.drawImage(captures[2], 0, 2880);
            ctx.drawImage(captures[3], 0, 4320);
        } else if (currentLayout === '4-cut-grid') {
            ctx.drawImage(captures[0], 0, 0);
            ctx.drawImage(captures[1], 1080, 0);
            ctx.drawImage(captures[2], 0, 1440);
            ctx.drawImage(captures[3], 1080, 1440);
        }

        const dataURL = canvas.toDataURL('image/png');
        resultImage.src = dataURL;

        // Go to Result View
        switchView(viewResult);
        stopCamera();
    }

    // ---- CAPTURE SEQUENCE LOGIC ----
    const viewHome = document.getElementById('view-home');
    const viewCamera = document.getElementById('view-camera');
    const viewResult = document.getElementById('view-result');
    const btnStart = document.getElementById('btn-start');
    const btnBackHome = document.getElementById('btn-back-home');
    const shutterSound = document.getElementById('shutter-sound');
    let streamRef = null;
    let currentFacingMode = 'user'; // Default camera

    function switchView(viewToShow) {
        [viewHome, viewCamera, viewResult].forEach(v => {
            v.classList.remove('active');
        });
        viewToShow.classList.add('active');
    }

    btnStart.addEventListener('click', () => {
        switchView(viewCamera);
        setupCamera(); // Initialize camera ONLY when entering camera view
    });

    btnBackHome.addEventListener('click', () => {
        switchView(viewHome);
        stopCamera();
    });

    // Camera Setup
    async function setupCamera() {
        if (streamRef) return; // already running
        try {
            if (window.location.protocol === 'file:') {
                throw new Error('Kamera diblokir. Harap akses melalui http://localhost/difotoku.');
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser tidak mendukung akses kamera.');
            }
            cameraStatus.classList.remove('hidden');
            cameraStatus.textContent = 'Menyiapkan kamera...';

            streamRef = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            video.srcObject = streamRef;
            
            // Flip video element horizontally ONLY if using front camera
            if (currentFacingMode === 'user') {
                video.style.transform = 'scaleX(-1)';
            } else {
                video.style.transform = 'scaleX(1)';
            }

            video.onloadedmetadata = () => {
                cameraStatus.classList.add('hidden');
                video.play();
            };
        } catch (err) {
            console.error('Error accessing webcam:', err);
            cameraStatus.textContent = err.message || 'Gagal mengakses kamera.';
        }
    }

    function stopCamera() {
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            streamRef = null;
        }
    }

    // Camera Flip Logic
    if (btnFlipCamera) {
        btnFlipCamera.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            stopCamera();
            setupCamera();
        });
    }

    // Modal Frame Logic
    if (btnShowFrames && btnCloseFrames && frameModal) {
        btnShowFrames.addEventListener('click', () => frameModal.classList.add('show'));
        btnCloseFrames.addEventListener('click', () => frameModal.classList.remove('show'));
    }

    // Frame Selection Logic
    frameOptions.forEach(option => {
        option.addEventListener('click', async () => {
            frameOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            if (frameModal) frameModal.classList.remove('show');

            frameOverlay.style.opacity = '0.5';
            const frameSrc = option.getAttribute('data-frame');
            const transparentUrl = await getTransparentFrame(frameSrc);
            frameOverlay.src = transparentUrl;
            frameOverlay.style.opacity = '1'; 
        });
    });

    // Init first frame
    const firstFrame = document.querySelector('.frame-option.active');
    if (firstFrame) {
        getTransparentFrame(firstFrame.getAttribute('data-frame')).then(url => {
            frameOverlay.src = url;
        });
    }

    // Layout Selection Logic
    let currentLayout = '1-cut';
    const layoutBtns = document.querySelectorAll('.layout-btn');
    layoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            layoutBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLayout = btn.getAttribute('data-layout');
        });
    });

    const countdownDisplay = document.getElementById('countdown-display');

    // Helper: Delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Helper: Capture Single Frame
    function captureSingleFrame() {
        // Play shutter sound
        shutterSound.currentTime = 0;
        shutterSound.play().catch(e => console.log('Audio error', e));

        // Flash effect
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100%'; flash.style.height = '100%';
        flash.style.backgroundColor = 'white';
        flash.style.zIndex = '100';
        flash.style.transition = 'opacity 0.4s ease-out';
        document.getElementById('preview-area').appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; }, 50);
        setTimeout(() => { flash.remove(); }, 450);

        // Draw to temp canvas
        const targetWidth = 1080;
        const targetHeight = 1440;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth; tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');

        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoRatio > targetRatio) {
            drawHeight = targetHeight;
            drawWidth = video.videoHeight * videoRatio * (targetHeight / video.videoHeight);
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = targetWidth;
            drawHeight = video.videoWidth / videoRatio * (targetWidth / video.videoWidth);
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
        }

        tempCtx.save();
        // ONLY FLIP if using user facing camera!
        if (currentFacingMode === 'user') {
            tempCtx.translate(targetWidth, 0);
            tempCtx.scale(-1, 1);
        }
        tempCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        tempCtx.restore();
        
        tempCtx.drawImage(frameOverlay, 0, 0, targetWidth, targetHeight);

        return tempCanvas;
    }

    // Capture Sequence
    btnCapture.addEventListener('click', async () => {
        btnCapture.style.pointerEvents = 'none'; // disable button
        btnCapture.style.opacity = '0.5';
        
        let shotsRequired = currentLayout === '1-cut' ? 1 : 4;
        let captures = [];

        for (let i = 0; i < shotsRequired; i++) {
            // Countdown
            countdownDisplay.classList.remove('hidden');
            for (let c = 3; c > 0; c--) {
                countdownDisplay.textContent = c;
                await delay(1000);
            }
            countdownDisplay.classList.add('hidden');
            
            // Capture
            const canvasFrame = captureSingleFrame();
            captures.push(canvasFrame);

            // Wait a bit before next shot, unless it's the last one
            if (i < shotsRequired - 1) {
                await delay(1000);
            }
        }

        // Restore button state
        btnCapture.style.pointerEvents = 'auto';
        btnCapture.style.opacity = '1';

        // Process captures and show result
        processCapturesAndShowResult(captures);
    });

    // Retake Logic
    btnRetake.addEventListener('click', () => {
        switchView(viewCamera);
        setupCamera();
        resultImage.src = '';
    });

    // Download Logic
    btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `Difotoku_MultiLayout_${Date.now()}.png`;
        link.href = resultImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
