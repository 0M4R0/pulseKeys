document.addEventListener("DOMContentLoaded", () => {
    const darkColorsArr = [
        "#2C3E50", "#34495E", "#2C2C2C", "#616A6B", "#4A235A",
        "#2F4F4F", "#0E4B5A", "#36454F", "#800020", "#800000",
        "#A52A2A", "#1A1A2E", "#16213E", "#0F3460", "#1B1B2F",
        "#1F1F3D", "#2D2424", "#5C3D2E", "#3D2C2E", "#2C3333",
        "#3A3845", "#4C3A51", "#5B4B8A", "#4B0082", "#483C32",
        "#4B5320", "#5D3FD3", "#301934", "#3B0000", "#4A0404",
        "#3A0CA3", "#3A0F67", "#2D1B3C", "#2E4053", "#1C2833",
        "#154360", "#512E5F", "#4A235A", "#7B241C", "#641E16",
        "#784212", "#145A32", "#0B5345", "#1B4F72", "#4D5656",
        "#2E1B3B", "#1E3D59", "#3C2C3E", "#1A3A3F", "#4A2545",
        "#2D4059", "#3E1E3B", "#1B4B5A", "#3A2D4A", "#2C3E4C"
    ];

    // Default settings (will be modified)
    const defaultSettings = {
        masterVolume: 50,
        particleEffects: true,
        backgroundColor: '#000000',
        soundConfig: [
            { key: 'q', src: './sounds/q.mp3' },
            { key: 'w', src: './sounds/w.mp3' },
            { key: 'e', src: './sounds/e.mp3' },
            { key: 'a', src: './sounds/a.mp3' },
            { key: 's', src: './sounds/s.mp3' },
            { key: 'd', src: './sounds/d.mp3' },
            // { key: 'z', src: './sounds/z.mp3' },
            // { key: 'x', src: './sounds/x.mp3' },
            // { key: 'c', src: './sounds/c.mp3' },
            // { key: 'j', src: './sounds/j.mp3' },
            // { key: 'k', src: './sounds/k.mp3' },
            // { key: 'l', src: './sounds/l.mp3' },
        ]
    };

    // Current settings (will be modified)
    let currentSettings = JSON.parse(JSON.stringify(defaultSettings));

    // DOM elements
    const timerSpan = document.getElementById("timeSpan");
    const body = document.querySelector("body");
    const keysContainer = document.querySelector(".keys-container");
    const mainKeys = document.querySelector(".main-keys");
    const secondaryKeys = document.querySelector(".secondary-keys");
    const customKeysContainer = document.getElementById("customKeys");
    const optionsWindow = document.querySelector(".options-window");
    const colorValue = document.getElementById("colorValue");
    const bgColorPicker = document.getElementById("bgColorPicker");

    // Volume controls
    const masterVolumeSlider = document.getElementById("masterVolume");
    const masterVolumeValue = document.getElementById("masterVolumeValue");

    // Other controls
    const particleEffectsCheckbox = document.getElementById("particleEffects");
    const editModeBtn = document.getElementById("editModeBtn");
    const editModeInfo = document.getElementById("editModeInfo");
    const keyEditor = document.getElementById("keyEditor");
    const editingKeyName = document.getElementById("editingKeyName");
    const audioFileInput = document.getElementById("audioFileInput");
    const newKeyInput = document.getElementById("newKeyInput");
    const newKeySoundInput = document.getElementById("newKeySoundInput");
    const addKeyBtn = document.getElementById("addKeyBtn");
    const resetBtn = document.getElementById("resetBtn");

    // State
    let isEditMode = false;
    let currentEditingKey = null;
    const audioMap = new Map();
    const heldKeys = new Set();
    const currentPlayingAudio = new Map();

    // Initialize audio
    function initializeAudio() {
        audioMap.clear();
        currentSettings.soundConfig.forEach(({ key, src }) => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audioMap.set(key.toLowerCase(), audio);
        });
    }

    // Volume calculation
    function calculateVolume() {
        return (currentSettings.masterVolume / 100);
    }

    // Particle effects (Made by Claude)
    function createParticles(x, y) {
        if (!currentSettings.particleEffects) return;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 6 + 4;
            const color = `hsl(${Math.random() * 360}, 70%, 60%)`;

            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = color;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / 8;
            const velocity = Math.random() * 100 + 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let particleX = x;
            let particleY = y;
            let opacity = 1;

            const animate = () => {
                particleX += vx * 0.016;
                particleY += vy * 0.016;
                opacity -= 0.02;

                particle.style.left = particleX + 'px';
                particle.style.top = particleY + 'px';
                particle.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    document.body.removeChild(particle);
                }
            };

            requestAnimationFrame(animate);
        }
    }

    function getRandomIndex() {
        return Math.floor(Math.random() * darkColorsArr.length);
    }

    function updateBackgroundColor(color) {
        body.style.backgroundColor = color;
        keysContainer.style.backgroundColor = color;
        mainKeys.style.backgroundColor = color;
        secondaryKeys.style.backgroundColor = color;
        customKeysContainer.style.backgroundColor = color;
        optionsWindow.style.backgroundColor = color;

        colorValue.value = color;
        bgColorPicker.value = color;
        currentSettings.backgroundColor = color;
    }

    function changeBackgroundColor() {
        const color = darkColorsArr[getRandomIndex()];
        updateBackgroundColor(color);
    }

    function playKeySound(key, loop = false) {
        const audio = audioMap.get(key.toLowerCase());
        if (!audio) return;

        const currentAudio = currentPlayingAudio.get(key.toLowerCase());
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        const newAudio = new Audio(audio.src);
        newAudio.volume = calculateVolume();
        newAudio.loop = !!loop;
        currentPlayingAudio.set(key.toLowerCase(), newAudio);

        void newAudio.play().catch(e => console.log('Audio play failed:', e));

        return newAudio;
    }

    function createKeyElement(keyChar) {
        const keyElement = document.createElement('button');
        keyElement.type = 'button';
        keyElement.className = 'key';
        keyElement.dataset.key = keyChar.toLowerCase();
        keyElement.tabIndex = 0;
        keyElement.textContent = keyChar.toUpperCase();
        keyElement.setAttribute('role', 'button');
        return keyElement;
    }

    let globalResetTimer;

    function handleKeyPress(key, loop, e) {
        if (e) {
            e.preventDefault();
        }
        if (typeof globalResetTimer === 'function') {
            globalResetTimer();
        }
        createParticles(e.clientX, e.clientY);
        playKeySound(key, loop);
        changeBackgroundColor();
    }

    function addEventListenersToKey(keyElement) {
        keyElement.addEventListener('click', (e) => {
            if (isEditMode) {
                e.stopPropagation();
                startEditingKey(keyElement.dataset.key);
                return;
            }
            handleKeyPress(keyElement.dataset.key, false, e);
        });

        let mouseHoldTimeout;

        keyElement.addEventListener('mousedown', (e) => {
            if (isEditMode) return;
            e.preventDefault();
            const key = keyElement.dataset.key;

            mouseHoldTimeout = setTimeout(() => {
                if (!heldKeys.has(key.toLowerCase())) {
                    heldKeys.add(key.toLowerCase());
                    playKeySound(key, true);
                }
            }, 300);
        });

        keyElement.addEventListener('mouseup', () => {
            if (isEditMode) return;
            clearTimeout(mouseHoldTimeout);
            const key = keyElement.dataset.key;
            if (heldKeys.has(key.toLowerCase())) {
                heldKeys.delete(key.toLowerCase());
                const audio = currentPlayingAudio.get(key.toLowerCase());
                if (audio && audio.loop) {
                    audio.loop = false;
                }
            }
        });

        keyElement.addEventListener('mouseleave', () => {
            if (isEditMode) return;
            clearTimeout(mouseHoldTimeout);
            const key = keyElement.dataset.key;
            if (heldKeys.has(key.toLowerCase())) {
                heldKeys.delete(key.toLowerCase());
                const audio = currentPlayingAudio.get(key.toLowerCase());
                if (audio && audio.loop) {
                    audio.loop = false;
                }
            }
        });

        keyElement.addEventListener('touchstart', (e) => {
            if (isEditMode) {
                e.preventDefault();
                startEditingKey(keyElement.dataset.key);
                return;
            }
            e.preventDefault();
            handleKeyPress(keyElement.dataset.key, false);
        }, { passive: false });

        keyElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isEditMode) {
                    startEditingKey(keyElement.dataset.key);
                    return;
                }
                handleKeyPress(keyElement.dataset.key, false);
            }
        });
    }

    function updateKeyMap() {
        const keyElements = Array.from(document.querySelectorAll('.key'));
        keyElements.forEach(addEventListenersToKey);
        return new Map(keyElements.map(el => [el.dataset.key, el]));
    }

    let keyMap = updateKeyMap();

    function setupInactivityTimer() {
        let inactivityTimer, countdownInterval, colorChangeTimer;
        const timerElement = document.querySelector('.timer');

        function updateTimerDisplay(seconds) {
            timerSpan.textContent = `${seconds}`;
        }

        function startCountdown() {
            let secondsLeft = 10;
            updateTimerDisplay(secondsLeft);
            timerElement.style.display = 'block';

            countdownInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    timerElement.style.display = 'none';
                    return;
                }
                updateTimerDisplay(secondsLeft);
            }, 1000);
        }

        function resetTimer() {
            clearTimeout(inactivityTimer);
            clearTimeout(colorChangeTimer);
            clearInterval(countdownInterval);
            timerElement.style.display = 'none';

            inactivityTimer = setTimeout(() => {
                startCountdown();
                colorChangeTimer = setTimeout(() => {
                    changeBackgroundColor();
                    timerElement.style.display = 'none';
                    resetTimer();
                }, 10000);
            }, 10000);
        }

        globalResetTimer = resetTimer;
        resetTimer();

        function triggerKeyVisual(keyEl) {
            keyEl.classList.add('active');
            setTimeout(() => keyEl.classList.remove('active'), 100);
        }

        function handleKeyPress(key, isHold = false) {
            const keyElement = keyMap.get(key.toLowerCase());
            if (!keyElement || isEditMode) return;

            resetTimer();
            triggerKeyVisual(keyElement);
            changeBackgroundColor();

            // Create particles at key position
            const rect = keyElement.getBoundingClientRect();
            createParticles(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );

            const audioInstance = playKeySound(key, isHold);

            if (isHold && !heldKeys.has(key.toLowerCase())) {
                heldKeys.add(key.toLowerCase());
            }
        }

        function handleKeyUp(key) {
            const keyLower = key.toLowerCase();
            if (heldKeys.has(keyLower)) {
                heldKeys.delete(keyLower);
                const audio = currentPlayingAudio.get(keyLower);
                if (audio && audio.loop) {
                    audio.loop = false;
                }
            }
        }

        document.addEventListener('keydown', (event) => {
            if (document.activeElement === colorValue ||
                document.activeElement === newKeyInput ||
                document.activeElement.type === 'file') return;

            if (event.repeat || heldKeys.has(event.key.toLowerCase())) return;
            handleKeyPress(event.key, true);
        });

        document.addEventListener('keyup', (event) => {
            if (document.activeElement === colorValue ||
                document.activeElement === newKeyInput ||
                document.activeElement.type === 'file') return;
            handleKeyUp(event.key);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(inactivityTimer);
                clearTimeout(colorChangeTimer);
                clearInterval(countdownInterval);
                timerElement.style.display = 'none';

                for (const audio of currentPlayingAudio.values()) {
                    if (audio) {
                        audio.loop = false;
                        audio.pause();
                        audio.currentTime = 0;
                    }
                }
                heldKeys.clear();
            } else {
                resetTimer();
            }
        });

        window.addEventListener('blur', () => {
            for (const audio of audioMap.values()) {
                audio.loop = false;
                audio.pause();
                audio.currentTime = 0;
            }
            heldKeys.clear();
        });
    }

    // Edit mode functions
    function toggleEditMode() {
        isEditMode = !isEditMode;
        editModeBtn.textContent = isEditMode ? 'Disable Edit Mode' : 'Enable Edit Mode';
        editModeInfo.style.display = isEditMode ? 'block' : 'none';

        const keyElements = document.querySelectorAll('.key');
        keyElements.forEach(key => {
            if (isEditMode) {
                key.classList.add('editable');
                if (!key.querySelector('.edit-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'edit-indicator';
                    indicator.textContent = '✎';
                    key.appendChild(indicator);
                }
            } else {
                key.classList.remove('editable');
                const indicator = key.querySelector('.edit-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        });

        if (!isEditMode) {
            keyEditor.style.display = 'none';
            currentEditingKey = null;
        }
    }

    function startEditingKey(key) {
        if (!isEditMode) return;

        currentEditingKey = key;
        editingKeyName.textContent = `Editing Key: ${key.toUpperCase()}`;
        keyEditor.style.display = 'block';
    }

    function replaceKeySound(key, file) {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        audio.preload = 'auto';

        // Update audioMap
        audioMap.set(key.toLowerCase(), audio);

        // Update current settings
        const existingIndex = currentSettings.soundConfig.findIndex(
            config => config.key === key.toLowerCase()
        );

        if (existingIndex >= 0) {
            currentSettings.soundConfig[existingIndex].src = url;
        } else {
            currentSettings.soundConfig.push({ key: key.toLowerCase(), src: url });
        }
    }

    function addCustomKey(keyChar, soundFile) {
        if (!keyChar || keyChar.length !== 1) return;

        keyChar = keyChar.toLowerCase();

        // Check if key already exists
        if (keyMap.has(keyChar)) {
            alert('Key already exists!');
            return;
        }

        // Create key element
        const keyElement = createKeyElement(keyChar);
        customKeysContainer.appendChild(keyElement);

        // Add to keyMap
        keyMap.set(keyChar, keyElement);
        addEventListenersToKey(keyElement);

        // Add sound if provided
        if (soundFile) {
            replaceKeySound(keyChar, soundFile);
        }

        // Clear inputs
        newKeyInput.value = '';
        newKeySoundInput.value = '';

        // Update container background
        customKeysContainer.style.backgroundColor = getComputedStyle(body).backgroundColor;
    }

    function resetToDefaults() {
        if (!confirm('Are you sure you want to reset all settings to default? This will remove custom keys and sounds.')) {
            return;
        }

        // Reset settings
        currentSettings = JSON.parse(JSON.stringify(defaultSettings));

        // Update UI
        masterVolumeSlider.value = currentSettings.masterVolume;
        masterVolumeValue.textContent = currentSettings.masterVolume + '%';
        particleEffectsCheckbox.checked = currentSettings.particleEffects;
        updateBackgroundColor(currentSettings.backgroundColor);

        // Remove custom keys
        customKeysContainer.innerHTML = '';

        // Reset audio
        initializeAudio();
        keyMap = updateKeyMap();

        // Disable edit mode
        if (isEditMode) {
            toggleEditMode();
        }
    }

    // Event listeners setup
    const optionsBtn = document.getElementById("optionsBtn");
    const optionsBtnContainer = document.getElementById("optionsBtnContainer");
    const closeBtn = document.getElementById("closeOptions");

    optionsBtn.addEventListener('click', () => {
        if (optionsWindow.style.display === 'block') {
            optionsWindow.style.display = 'none';
            optionsBtnContainer.style.display = 'block';
        } else {
            optionsWindow.style.display = 'block';
            optionsBtnContainer.style.display = 'none';
            optionsWindow.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
        }
    });

    closeBtn.addEventListener('click', () => {
        optionsWindow.style.display = 'none';
        optionsBtnContainer.style.display = 'block';
        if (isEditMode) {
            toggleEditMode();
        }
    });

    // Color controls
    bgColorPicker.addEventListener('input', (e) => {
        updateBackgroundColor(e.target.value);
    });

    colorValue.addEventListener('input', (e) => {
        const inputValue = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
            updateBackgroundColor(inputValue);
        }
    });

    colorValue.addEventListener('focus', () => {
        for (const audio of currentPlayingAudio.values()) {
            if (audio) {
                audio.loop = false;
                audio.pause();
                audio.currentTime = 0;
            }
        }
        heldKeys.clear();
    });

    colorValue.addEventListener('blur', (e) => {
        const inputValue = e.target.value;
        if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
            e.target.value = currentSettings.backgroundColor;
        }
    });

    colorValue.addEventListener('keydown', (e) => {
        const input = e.target;
        const value = input.value;

        if (e.key === 'Backspace' || e.key === 'Delete' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
            e.key === 'Home' || e.key === 'End' || e.key === 'Tab') {
            return;
        }

        if (value.length === 0 && e.key !== '#') {
            e.preventDefault();
            input.value = '#';
        }

        if (value.length >= 7) {
            e.preventDefault();
            return;
        }

        if (value.length > 0 && !/[0-9A-Fa-f]/.test(e.key)) {
            e.preventDefault();
        }
    });

    colorValue.addEventListener('keyup', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // Volume controls
    masterVolumeSlider.addEventListener('input', (e) => {
        currentSettings.masterVolume = parseInt(e.target.value);
        masterVolumeValue.textContent = currentSettings.masterVolume + '%';
    });

    // Particle effects
    particleEffectsCheckbox.addEventListener('change', (e) => {
        currentSettings.particleEffects = e.target.checked;
    });

    // Edit mode
    editModeBtn.addEventListener('click', toggleEditMode);

    // Audio file input
    audioFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/') && currentEditingKey) {
            replaceKeySound(currentEditingKey, file);
            alert(`Sound updated for key: ${currentEditingKey.toUpperCase()}`);
        } else if (file) {
            alert('Please upload a valid audio file (e.g., MP3).');
        }
    });

    // Add key functionality
    newKeyInput.addEventListener('keyup', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    addKeyBtn.addEventListener('click', () => {
        const keyChar = newKeyInput.value.trim();
        const soundFile = newKeySoundInput.files[0];

        if (!keyChar) {
            alert('Please enter a key character');
            return;
        }

        addCustomKey(keyChar, soundFile);
    });

    // Reset button
    resetBtn.addEventListener('click', resetToDefaults);

    // Initialize
    initializeAudio();
    updateBackgroundColor(currentSettings.backgroundColor);
    masterVolumeValue.textContent = currentSettings.masterVolume + '%';
    setupInactivityTimer();
});