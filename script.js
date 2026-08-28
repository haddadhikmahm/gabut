document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const video = document.getElementById('camera-feed');
    const frameOverlay = document.getElementById('frame-overlay');
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

    const processedFrames = {};

    // EXACT Coordinates of the white/checkerboard placeholders for each frame [x, y, w, h] as percentages
    const frameCutouts = {
        'frame1.png': [0.096, 0.236, 0.815, 0.665],
        'frame2.png': [0.290, 0.368, 0.421, 0.447],
        'frame3.png': [0.096, 0.236, 0.815, 0.665],
        'frame4.png': [0.107, 0.183, 0.786, 0.606],
        'frame5.png': [0.128, 0.227, 0.744, 0.599],
        'frame6.png': [0.211, 0.412, 0.579, 0.346], // NEWSPAPER PERFECT BOX
        'frame7.png': [0.272, 0.273, 0.455, 0.453],
        'frame8.png': [0.181, 0.186, 0.639, 0.629],
        'frame9.png': [0.257, 0.222, 0.463, 0.591],
        'frame10.png': [0.240, 0.111, 0.515, 0.637],
        'frame11.png': [0.05, 0.18, 0.90, 0.48],
        'frame12.png': [0.225, 0.176, 0.550, 0.540],
        'frame13.png': [0.170, 0.129, 0.737, 0.676],
        'frame15.png': [ 
            [0.0740, 0.6389, 0.3981, 0.2361], // 1. Bottom Left
            [0.5278, 0.6389, 0.3981, 0.2361], // 2. Bottom Right
            [0.0740, 0.2500, 0.8519, 0.3611]  // 3. Top Large
        ]
    };

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
                
                // Cari key frame yang cocok dari src (misalnya: "images/frame6.png" -> "frame6.png")
                const frameKey = Object.keys(frameCutouts).find(k => src.includes(k));
                
                if (frameKey) {
                    let cutouts = frameCutouts[frameKey];
                    if (cutouts.length > 0 && !Array.isArray(cutouts[0])) cutouts = [cutouts];
                    cutouts.forEach(c => {
                        const [px, py, pw, ph] = c;
                        ctx.clearRect(w * px, h * py, w * pw, h * ph);
                    });
                }
                
                const resultUrl = cvs.toDataURL('image/png');
                processedFrames[src] = resultUrl;
                resolve(resultUrl);
            };
            img.src = src + '?v=' + new Date().getTime(); // Prevent browser caching
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
        const activeOpt = document.querySelector('.frame-option.active');
        const origSrc = activeOpt ? activeOpt.getAttribute('data-frame') : '';
        const frameKey = Object.keys(frameCutouts).find(k => origSrc.includes(k));
        let cutouts = frameKey ? frameCutouts[frameKey] : [[0, 0, 1, 1]];
        if (cutouts.length > 0 && !Array.isArray(cutouts[0])) cutouts = [cutouts];
        
        const needed = cutouts.length;
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
        const targetWidth = 1080;
        const targetHeight = 1440;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth; tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');

        for (let i = 0; i < needed; i++) {
            if (uploadedUrls.length === 0) break;
            const src = uploadedUrls[i % uploadedUrls.length];
            const img = await new Promise(res => {
                const imgObj = new Image(); imgObj.onload = () => res(imgObj); imgObj.src = src;
            });
            
            const [px, py, pw, ph] = cutouts[i];
            const boxX = targetWidth * px, boxY = targetHeight * py;
            const boxW = targetWidth * pw, boxH = targetHeight * ph;
            
            const imgRatio = img.width / img.height;
            const boxRatio = boxW / boxH;
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > boxRatio) {
                drawHeight = boxH;
                drawWidth = img.height * imgRatio * (boxH / img.height);
                offsetX = boxX + (boxW - drawWidth) / 2;
                offsetY = boxY;
            } else {
                drawWidth = boxW;
                drawHeight = img.width / imgRatio * (boxW / img.width);
                offsetX = boxX;
                offsetY = boxY + (boxH - drawHeight) / 2;
            }
            
            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.rect(boxX, boxY, boxW, boxH);
            tempCtx.clip();
            tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            tempCtx.restore();
        }
        
        tempCtx.drawImage(frameOverlay, 0, 0, targetWidth, targetHeight);
        
        uploadInput.value = ''; // Reset input
        processCapturesAndShowResult([tempCanvas]);
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
            
            // Remove 'Menyiapkan kamera...' status text as requested by user

            streamRef = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
                cameraStatus.classList.add('hidden'); // Ensure it stays hidden
                video.play();
            };
        } catch (err) {
            console.error('Error accessing webcam:', err);
            // Hide status even on error since user wants it removed
            cameraStatus.classList.add('hidden'); 
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

    function updateVideoPosition(src, slotIndex = -1) {
        const frameKey = Object.keys(frameCutouts).find(k => src.includes(k));
        let cutouts = frameKey ? frameCutouts[frameKey] : [[0, 0, 1, 1]];
        if (cutouts.length > 0 && !Array.isArray(cutouts[0])) cutouts = [cutouts];
        
        let targetSlot = slotIndex;
        if (targetSlot === -1) {
            let maxArea = 0;
            for (let i = 0; i < cutouts.length; i++) {
                const area = cutouts[i][2] * cutouts[i][3];
                if (area > maxArea) {
                    maxArea = area;
                    targetSlot = i;
                }
            }
        }
        
        const [px, py, pw, ph] = cutouts[targetSlot] || cutouts[0];
        video.style.left = `${px * 100}%`;
        video.style.top = `${py * 100}%`;
        video.style.width = `${pw * 100}%`;
        video.style.height = `${ph * 100}%`;
    }

    // Frame Selection Logic
    frameOptions.forEach(option => {
        option.addEventListener('click', async () => {
            frameOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            if (frameModal) frameModal.classList.remove('show');

            frameOverlay.style.opacity = '0.5';
            const frameSrc = option.getAttribute('data-frame');
            
            updateVideoPosition(frameSrc);

            const transparentUrl = await getTransparentFrame(frameSrc);
            frameOverlay.src = transparentUrl;
            frameOverlay.style.opacity = '1'; 
        });
    });

    // Init first frame
    const firstFrame = document.querySelector('.frame-option.active');
    if (firstFrame) {
        const frameSrc = firstFrame.getAttribute('data-frame');
        updateVideoPosition(frameSrc);
        getTransparentFrame(frameSrc).then(url => {
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

    function captureSlot(cutout, targetWidth, targetHeight, targetCtx) {
        shutterSound.currentTime = 0;
        shutterSound.play().catch(e => console.log('Audio error', e));

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

        const [px, py, pw, ph] = cutout;
        const boxX = targetWidth * px, boxY = targetHeight * py;
        const boxW = targetWidth * pw, boxH = targetHeight * ph;
        
        const videoRatio = video.videoWidth / video.videoHeight;
        const boxRatio = boxW / boxH;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoRatio > boxRatio) {
            drawHeight = boxH;
            drawWidth = video.videoHeight * videoRatio * (boxH / video.videoHeight);
            offsetX = boxX + (boxW - drawWidth) / 2;
            offsetY = boxY;
        } else {
            drawWidth = boxW;
            drawHeight = video.videoWidth / videoRatio * (boxW / video.videoWidth);
            offsetX = boxX;
            offsetY = boxY + (boxH - drawHeight) / 2;
        }

        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(boxX, boxY, boxW, boxH);
        targetCtx.clip();

        if (currentFacingMode === 'user') {
            targetCtx.translate(boxX + boxW/2, boxY + boxH/2);
            targetCtx.scale(-1, 1);
            targetCtx.translate(-(boxX + boxW/2), -(boxY + boxH/2));
        }
        targetCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        targetCtx.restore();
    }

    // Capture Sequence
    btnCapture.addEventListener('click', async () => {
        btnCapture.style.pointerEvents = 'none'; // disable button
        btnCapture.style.opacity = '0.5';
        
        const activeOpt = document.querySelector('.frame-option.active');
        const origSrc = activeOpt ? activeOpt.getAttribute('data-frame') : '';
        const frameKey = Object.keys(frameCutouts).find(k => origSrc.includes(k));
        let cutouts = frameKey ? frameCutouts[frameKey] : [[0, 0, 1, 1]];
        if (cutouts.length > 0 && !Array.isArray(cutouts[0])) cutouts = [cutouts];
        
        const targetWidth = 1080;
        const targetHeight = 1440;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth; tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        const liveCompositor = document.getElementById('live-compositor');
        if(liveCompositor) {
            liveCompositor.width = targetWidth; liveCompositor.height = targetHeight;
            const liveCtx = liveCompositor.getContext('2d');
            liveCtx.clearRect(0, 0, targetWidth, targetHeight);
        }

        for (let i = 0; i < cutouts.length; i++) {
            // Kamera berpindah ke slot yang sedang aktif (agar user berkaca di kotak yang tepat)
            updateVideoPosition(origSrc, i);
            
            // Countdown
            countdownDisplay.classList.remove('hidden');
            for (let c = 3; c > 0; c--) {
                countdownDisplay.textContent = c;
                await delay(1000);
            }
            countdownDisplay.classList.add('hidden');
            
            captureSlot(cutouts[i], targetWidth, targetHeight, tempCtx);
            
            if(liveCompositor) {
                const liveCtx = liveCompositor.getContext('2d');
                liveCtx.drawImage(tempCanvas, 0, 0);
            }

            if (i < cutouts.length - 1) {
                await delay(1000);
            }
        }
        
        // Overlay frame
        tempCtx.drawImage(frameOverlay, 0, 0, targetWidth, targetHeight);
        
        // Restore video pos to largest slot
        updateVideoPosition(origSrc);

        // Restore button state
        btnCapture.style.pointerEvents = 'auto';
        btnCapture.style.opacity = '1';

        // Process captures and show result
        processCapturesAndShowResult([tempCanvas]);
    });

    // Retake Logic
    btnRetake.addEventListener('click', () => {
        switchView(viewCamera);
        setupCamera();
        resultImage.src = '';
        const liveCompositor = document.getElementById('live-compositor');
        if(liveCompositor) {
            const ctx = liveCompositor.getContext('2d');
            ctx.clearRect(0, 0, liveCompositor.width, liveCompositor.height);
        }
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
