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
    
    // Gallery Options
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
                // Karena AI kadang menggambar kotak putihnya terlalu kecil,
                // kita bolongi secara manual menggunakan koordinat pasti!
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
                    // Kriteria: putih atau abu-abu terang (checkerboard)
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

    // Camera Setup
    async function setupCamera() {
        try {
            // Cek apakah dibuka menggunakan file:///
            if (window.location.protocol === 'file:') {
                throw new Error('Kamera diblokir. Harap akses melalui http://localhost/difotoku atau http://difotoku.test di browser, jangan di-double click.');
            }

            // Cek dukungan browser
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser tidak mendukung akses kamera atau web tidak diakses menggunakan HTTPS/localhost.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                cameraStatus.classList.add('hidden');
                video.play();
            };
        } catch (err) {
            console.error('Error accessing webcam:', err);
            cameraStatus.textContent = err.message || 'Gagal mengakses kamera. Pastikan izin diberikan.';
            cameraStatus.style.color = '#ff4a4a';
            cameraStatus.style.padding = '20px';
            cameraStatus.style.textAlign = 'center';
            cameraStatus.style.lineHeight = '1.5';
        }
    }

    // Initialize Camera
    setupCamera();

    // Frame Selection Logic
    frameOptions.forEach(option => {
        option.addEventListener('click', async () => {
            // Remove active class from all
            frameOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked
            option.classList.add('active');
            
            // Efek loading
            frameOverlay.style.opacity = '0.5';
            
            // Terapkan magic transparency otomatis
            const frameSrc = option.getAttribute('data-frame');
            const transparentUrl = await getTransparentFrame(frameSrc);
            frameOverlay.src = transparentUrl;
            frameOverlay.style.opacity = '1'; // Kembalikan solid 100%
        });
    });

    // Inisialisasi frame pertama saat halaman dimuat
    const firstFrame = document.querySelector('.frame-option.active');
    if (firstFrame) {
        getTransparentFrame(firstFrame.getAttribute('data-frame')).then(url => {
            frameOverlay.src = url;
        });
    }

    // Capture Logic
    btnCapture.addEventListener('click', () => {
        // Set target output resolution (e.g. 1080x1440 for 3:4 aspect ratio portrait)
        const targetWidth = 1080;
        const targetHeight = 1440;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 1. Draw Video (with object-fit: cover logic and mirror effect)
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoRatio > targetRatio) {
            // Video is wider than target
            drawHeight = targetHeight;
            drawWidth = video.videoHeight * videoRatio * (targetHeight / video.videoHeight);
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Video is taller than target
            drawWidth = targetWidth;
            drawHeight = video.videoWidth / videoRatio * (targetWidth / video.videoWidth);
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
        }

        // Apply mirror effect for drawing video
        ctx.save();
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        // 2. Draw Frame Overlay (sudah bolong otomatis)
        ctx.drawImage(frameOverlay, 0, 0, targetWidth, targetHeight);

        // 3. Show Result
        const dataURL = canvas.toDataURL('image/png');
        resultImage.src = dataURL;
        
        // UI State changes
        resultArea.classList.remove('hidden');
        btnCapture.classList.add('hidden');
        resultActions.classList.remove('hidden');
    });

    // Retake Logic
    btnRetake.addEventListener('click', () => {
        resultArea.classList.add('hidden');
        btnCapture.classList.remove('hidden');
        resultActions.classList.add('hidden');
        resultImage.src = '';
    });

    // Download Logic
    btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `Difotoku_${Date.now()}.png`;
        link.href = resultImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
