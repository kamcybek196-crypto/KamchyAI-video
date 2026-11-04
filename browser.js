// ==============================================================
// ЧАСТЬ 1: ГЛОБАЛЬНОЕ СОСТОЯНИЕ, АВТОПРОПУСК И МУЛЬТИЗАГРУЗКА
// ==============================================================
let selectedQuality = '720p';
let selectedDuration = 12; 
let selectedAspect = '16:9';
let selectedMotion = 'medium';

// Массив для хранения 3-х независимых карточек референсов
let uploadedImages = [null, null, null];

// Моментальное жесткое считывание кэша авторизации и архива медиафайлов
let videoHistory = JSON.parse(localStorage.getItem('kamchy_video_history')) || [];
let isAuthorized = localStorage.getItem('kamchy_is_authorized') === 'true';
let savedUserName = localStorage.getItem('kamchy_user_name') || '';

// ТОЧКА ВХОДА ДЛЯ GOOGLE CHROME: Полностью уничтожает мандраж окон при обновлении
document.addEventListener("DOMContentLoaded", () => {
    const authScreen = document.getElementById('auth-screen');
    const stepName = document.getElementById('auth-step-name');
    const stepCode = document.getElementById('auth-step-code');
    
    // Считываем паспорта сессии из локальной памяти браузера
    const activeToken = localStorage.getItem('kamchy_session_token');
    const activeName = localStorage.getItem('kamchy_user_name');

    // КРИТИЧЕСКИЙ ФИКС: Если пользователь уже заходил — стираем шлюз до его рендеринга
    if (activeToken && activeName && localStorage.getItem('kamchy_is_authorized') === 'true') {
        isAuthorized = true;
        savedUserName = activeName;
        
        if (authScreen) authScreen.style.setProperty('display', 'none', 'important');
        
        const badge = document.querySelector('.premium-badge');
        if (badge) badge.innerHTML = `<i class="fa-solid fa-user-shield"></i> ${activeName} | Account`;
        console.log(`[ChatGPT Мост] Сессия восстановлена для: ${activeName}`);
    } else {
        if (stepName) stepName.style.setProperty('display', 'flex', 'important');
        if (stepCode) stepCode.style.setProperty('display', 'none', 'important');
    }

    // Подменяем старый селектор на кастомный триггер вылета iOS пикера
    const durationContainer = document.getElementById('durationSelect');
    if (durationContainer) {
        durationContainer.innerHTML = `
            <div class="setting-label"><i class="fa-solid fa-stopwatch"></i> Хронометраж таймлайна</div>
            <button id="durationSelectTrigger" class="tab-btn active" style="width:100%; text-align:left; padding:12px 20px; font-weight:600; display:flex; justify-content:space-between; align-items:center;" onclick="openDurationPicker()">
                <span><i class="fa-solid fa-stopwatch"></i> Выбрано: 12 секунд</span>
                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem; opacity:0.6;"></i>
            </button>
        `;
    }
    renderLibrary();
});

// УПРАВЛЕНИЕ ШТОРКОЙ МЕНЮ И ЭКРАНАМИ
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (sidebar) sidebar.classList.toggle('open');
    if (menuBtn) menuBtn.classList.toggle('open-btn');
}

function changeScreen(screen) {
    const screenCreate = document.getElementById('screen-create');
    const screenLib = document.getElementById('screen-library');
    const screenAccount = document.getElementById('screen-account');
    const btnCreate = document.getElementById('btn-create');
    const btnLib = document.getElementById('btn-lib');
    const btnAccount = document.getElementById('btn-account');
    const sidebar = document.getElementById('sidebar');

    document.querySelectorAll('.screen-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));

    if (screen === 'create' && screenCreate && btnCreate) {
        screenCreate.classList.add('active'); btnCreate.classList.add('active');
    } else if (screen === 'library' && screenLib && btnLib) {
        screenLib.classList.add('active'); btnLib.classList.add('active');
    } else if (screen === 'account' && screenAccount && btnAccount) {
        screenAccount.classList.add('active'); btnAccount.classList.add('active');
        const pName = document.getElementById('accountProfileName');
        const pAvatar = document.getElementById('accountAvatar');
        const currentName = localStorage.getItem('kamchy_user_name') || 'Пользователь';
        if (pName) pName.innerText = currentName;
        if (pAvatar) pAvatar.innerText = currentName.charAt(0).toUpperCase();
    }
    if (sidebar) sidebar.classList.remove('open');
    if (screen === 'library') renderLibrary();
}

function selectQuality(quality, element) {
    const row = element.closest('.magic-tabs');
    if (row) row.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active'); selectedQuality = quality;
}
function updateDuration(seconds) { selectedDuration = parseInt(seconds) || 12; }
function selectAspect(aspect, element) {
    const row = element.closest('.magic-tabs');
    if (row) row.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active'); selectedAspect = aspect;
}
function selectMotion(motion, element) {
    const row = element.closest('.magic-tabs');
    if (row) row.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active'); selectedMotion = motion;
}
function clearLocalHistory() {
    if (confirm("Вы действительно хотите полностью очистить историю библиотеки?")) {
        videoHistory = []; localStorage.removeItem('kamchy_video_history'); renderLibrary();
    }
}

// НЕЗАВИСИМАЯ ЗАГРУЗКА 3 КАРТОЧЕК РЕФЕРЕНСОВ
function triggerSlotUpload(index) {
    if (uploadedImages[index]) return; 
    const fileInput = document.getElementById('imageFile');
    if (fileInput) { fileInput.dataset.targetSlot = index; fileInput.click(); }
}

function handleGridFiles(input) {
    if (!input.files || input.files.length === 0) return;
    const targetSlot = parseInt(input.dataset.targetSlot);
    
    Array.from(input.files).forEach((file, i) => {
        const currentSlotIndex = targetSlot + i;
        if (currentSlotIndex < 3) {
            uploadedImages[currentSlotIndex] = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewZone = document.getElementById(`preview-${currentSlotIndex}`);
                const deleteBtn = document.getElementById(`delete-${currentSlotIndex}`);
                if (previewZone) {
                    previewZone.style.backgroundImage = `url('${e.target.result}')`;
                    const plusIcon = previewZone.querySelector('.slot-plus');
                    if (plusIcon) plusIcon.style.display = 'none';
                }
                if (deleteBtn) deleteBtn.style.display = 'flex'; 
            }
            reader.readAsDataURL(file);
        }
    });
    input.value = '';
}

function removeSlotImage(index, event) {
    if (event && event.stopPropagation) event.stopPropagation(); 
    uploadedImages[index] = null;
    const previewZone = document.getElementById(`preview-${index}`);
    const deleteBtn = document.getElementById(`delete-${index}`);
    if (previewZone) {
        previewZone.style.backgroundImage = 'none';
        const plusIcon = previewZone.querySelector('.slot-plus');
        if (plusIcon) plusIcon.style.display = 'block'; 
    }
    if (deleteBtn) deleteBtn.style.display = 'none'; 
}
// ==============================================================
// ЧАСТЬ 2: АВТОРИЗАЦИЯ, ИММЕРСИВНЫЙ РЕНДЕР И iOS ПИКЕР
// ==============================================================

async function submitAuthName() {
    const nameInput = document.getElementById('authUserName');
    if (!nameInput) return;
    const userName = nameInput.value.trim();
    const descText = document.getElementById('auth-desc-text');
    if (!userName) return alert('Пожалуйста, введите ваше имя!');
    if (descText) { descText.style.color = '#ffffff'; descText.innerText = `Связь со шлюзом безопасности...`; }

    const nameBlock = document.getElementById('auth-step-name');
    const submitBtn = nameBlock ? nameBlock.querySelector('.action-btn') : null;
    let originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = `<span class="auth-spinner"></span>`; }

    try {
        const response = await fetch('/api/send-auth-code', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('kamchy_user_name_temp', userName);
            setTimeout(() => {
                const codeBlock = document.getElementById('auth-step-code');
                if (nameBlock) nameBlock.style.setProperty('display', 'none', 'important');
                if (codeBlock) { codeBlock.style.setProperty('display', 'flex', 'important'); }
            }, 3500);
        } else {
            alert('Сервер отклонил запрос.');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        }
    } catch (err) {
        alert('Ошибка сети.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
    }
}

async function verifyAuthCode() {
    const codeInput = document.getElementById('authValidationCode');
    const userCode = codeInput ? codeInput.value.trim() : '';
    if (userCode.length !== 5) return alert('Код должен содержать ровно 5 цифр!');

    const codeBlock = document.getElementById('auth-step-code');
    const verifyBtn = codeBlock ? codeBlock.querySelector('.action-btn') : null;
    if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.innerHTML = `<span class="auth-spinner"></span>`; }

    try {
        const response = await fetch('/api/verify-auth-code', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userCode })
        });
        const data = await response.json();

        if (data.success) {
            const tempName = localStorage.getItem('kamchy_user_name_temp') || 'User';
            localStorage.setItem('kamchy_session_token', data.sessionToken || 'SYSTEM_PASS_OK');
            localStorage.setItem('kamchy_is_authorized', 'true');
            localStorage.setItem('kamchy_user_name', tempName);
            localStorage.removeItem('kamchy_user_name_temp');

            isAuthorized = true; savedUserName = tempName;
            const badge = document.querySelector('.premium-badge');
            if (badge) badge.innerHTML = `<i class="fa-solid fa-user-shield"></i> ${tempName} | Account`;

            const authScreen = document.getElementById('auth-screen');
            if (authScreen) {
                authScreen.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
                authScreen.style.transform = 'translateY(100%)'; authScreen.style.opacity = '0';
                setTimeout(() => { authScreen.style.setProperty('display', 'none', 'important'); }, 500);
            }
            changeScreen('create');
        } else {
            alert('Введен неверный секретный токен!');
            if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.innerHTML = "Подтвердить код"; }
        }
    } catch (err) { alert('Ошибка авторизации.'); }
}

// ТОТ САМЫЙ КОРРЕКТНЫЙ МЕТОД ОТРЕНДЕРЕННОЙ ИИ-БИБЛИОТЕКИ С АНИМАЦИЕЙ ПРОЦЕНТОВ
function renderLibrary(isLoading = false, currentProgress = 0) {
    const emptyBox = document.getElementById('emptyLibraryBox');
    const grid = document.getElementById('videoGrid');
    
    if (isLoading) {
        if (emptyBox) emptyBox.style.setProperty('display', 'none', 'important');
        if (grid) {
            grid.style.display = 'grid'; grid.innerHTML = '';
            let aspectPadding = selectedAspect === '9:16' ? '177.77%' : (selectedAspect === '1:1' ? '100%' : '56.25%');
            grid.innerHTML = `
                <div class="video-card process-card" style="border: none; background: transparent; padding: 0; width: 100%; max-width: 700px; margin: auto; display: flex; flex-direction: column; gap: 16px;">
                    <div class="fluid-ai-shimmer" style="width: 100%; padding-top: ${aspectPadding}; position: relative; border-radius: 20px; overflow: hidden;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #ffffff; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px; white-space: nowrap;">
                            <i class="fa-solid fa-compact-disc fa-spin"></i> РЕНДЕРИНГ ИИ... ${currentProgress}%
                        </div>
                    </div>
                    <div style="width: 100%; height: 5px; background: #111116; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.02);">
                        <div class="progress-bar-fill" style="width: ${currentProgress}%;"></div>
                    </div>
                </div>`;
        }
        return;
    }

    if (videoHistory.length === 0) {
        if (emptyBox) emptyBox.style.setProperty('display', 'flex', 'important');
        if (grid) grid.style.display = 'none';
    } else {
        if (emptyBox) emptyBox.style.setProperty('display', 'none', 'important');
        if (grid) {
            grid.style.display = 'grid'; grid.innerHTML = '';
            videoHistory.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.style.cssText = 'padding: 0; background: #050507; border: 1px solid #111115; max-width: 700px; margin: 0 auto 24px auto; width: 100%; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
                card.innerHTML = `
                    <div style="padding: 16px 20px; background: #0b0b0f; border-bottom: 1px solid #111115; font-size: 0.95rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #ffffff;"><i class="fa-solid fa-video" style="margin-right: 8px; color: #888896;"></i> ${video.title}</span>
                        <span style="color: #66667a; font-size: 0.8rem; font-weight: 600; background: #111116; padding: 4px 10px; border-radius: 8px;">${video.duration}s | ${video.aspect}</span>
                    </div>
                    <div style="width: 100%; background: #000000; display: flex; align-items: center;">
                        <video src="${video.url}" controls loop playsinline style="width: 100%; max-height: 500px; display: block; background: #000000;"></video>
                    </div>`;
                grid.appendChild(card);
            });
        }
    }
}
async function startGeneration() {
    const promptInput = document.getElementById('videoPrompt');
    const genBtn = document.getElementById('generateBtn');

    // Проверяем, есть ли хоть одна картинка в слотах
    const hasAtLeastOneImage = uploadedImages.some(img => img !== null);
    if (!hasAtLeastOneImage) return alert('Пожалуйста, загрузите хотя бы одну фотографию в карточку!');
    
    const promptText = promptInput ? promptInput.value.trim() : `Кинематографичная ИИ-анимация`;
    if (genBtn) genBtn.disabled = true;

    // Переключаем экран на архив медиафайлов
    changeScreen('library');
    
    // Переменные для контроля упругой полоски прогресса
    let progress = 0;
    
    // Инициализируем первый кадр загрузки с твоим плавным шиммером
    renderLibrary(true, progress);

    // УЛЬТРА-ПЛАВНЫЙ ИНТЕРВАЛ: Двигает линию независимо от сервера
    const progressInterval = setInterval(() => {
        if (progress < 95) {
            // Линия мягко ползет вперед случайными шагами
            progress += Math.floor(Math.random() * 3) + 1;
            if (progress > 95) progress = 95;
            
            // Точечно обновляем только проценты и полоску, не сбивая анимацию квадрата
            const fill = document.querySelector('.progress-bar-fill');
            const txt = document.querySelector('.fluid-ai-shimmer div');
            if (fill) fill.style.width = progress + '%';
            if (txt) txt.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin"></i> РЕНДЕРИНГ ИИ... ${progress}%`;
        }
    }, 100);

    // Пакуем файлы пацанов для отправки на локальный сервер
    const formData = new FormData();
    formData.append('prompt', promptText);
    formData.append('duration', selectedDuration);
    formData.append('quality', selectedQuality);
    formData.append('aspect', selectedAspect);
    formData.append('motion', selectedMotion);
    uploadedImages.forEach(file => { if (file) formData.append('image', file); });

    try {
        // Шлем запрос на наш автономный сервер
        const response = await fetch('/api/generate-video', { method: 'POST', body: formData });
        const data = await response.json();

        // Сервер ответил — глушим внутренний счетчик
        clearInterval(progressInterval);

        if (data.success) {
            // Доводим полосу до победных 100%
            const fill = document.querySelector('.progress-bar-fill');
            if (fill) fill.style.width = '100%';

            setTimeout(() => {
                // Добавляем реальный рабочий ролик в массив истории сессии
                videoHistory.unshift({ 
                    url: data.videoUrl, 
                    title: promptText, 
                    duration: selectedDuration, 
                    quality: selectedQuality, 
                    aspect: selectedAspect, 
                    motion: selectedMotion 
                });

                // Намертво сохраняем в память Chrome
                localStorage.setItem('kamchy_video_history', JSON.stringify(videoHistory));
                
                // Выключаем лоудер и рисуем готовый живой плеер
                renderLibrary(false);

                // Зачищаем интерфейс для новых генераций
                if (promptInput) promptInput.value = '';
                for (let i = 0; i < 3; i++) { removeSlotImage(i); }
                if (genBtn) genBtn.disabled = false;
            }, 500);

        } else {
            alert(data.message || 'Ошибка генерации кадра.');
            renderLibrary(false);
            if (genBtn) genBtn.disabled = false;
        }
    } catch (error) { 
        clearInterval(progressInterval); 
        alert('Не удалось соединиться с сервером ИИ.'); 
        renderLibrary(false); 
        if (genBtn) genBtn.disabled = false; 
    }
}

function openDurationPicker() {
    const overlay = document.createElement('div'); overlay.id = 'ios-duration-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:flex-end;justify-content:center;opacity:0;backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);transition:opacity 0.4s cubic-bezier(0.16,1,0.3,1),backdrop-filter 0.4s ease;';
    const menu = document.createElement('div'); menu.id = 'ios-duration-menu';
    menu.style.cssText = 'width:100%;max-width:400px;background:rgba(20,20,25,0.85);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:24px 20px 40px 20px;box-sizing:border-box;transform:translateY(100%);transition:transform 0.45s cubic-bezier(0.16,1,0.3,1);box-shadow:0 -15px 40px rgba(0,0,0,0.6);';
    const header = document.createElement('div'); header.innerText = "Хронометраж видеоролика"; header.style.cssText = 'text-align:center;color:#888896;font-size:0.9rem;font-weight:600;margin-bottom:20px;';
    menu.appendChild(header);
    const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;';

    for (let i = 1; i <= 12; i++) {
        const btn = document.createElement('button'); btn.innerText = `${i}c`; const isActive = selectedDuration == i;
        btn.style.cssText = `height:50px;border-radius:14px;border:none;font-size:1rem;font-weight:600;cursor:pointer;background:${isActive?'#ffffff':'rgba(255,255,255,0.05)'};color:${isActive?'#000000':'#ffffff'};transition:all 0.3s cubic-bezier(0.16,1,0.3,1);`;
        btn.onclick = () => {
            updateDuration(i);
            const trigger = document.getElementById('durationSelectTrigger');
            if (trigger) trigger.innerHTML = `<span><i class="fa-solid fa-stopwatch"></i> Выбрано: ${i} секунд</span><i class="fa-solid fa-chevron-down" style="font-size:0.8rem;opacity:0.6;"></i>`;
            closeDurationPicker();
        };
        grid.appendChild(btn);
    }
    menu.appendChild(grid); overlay.appendChild(menu); document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; overlay.style.backdropFilter = 'blur(15px)'; overlay.style.webkitBackdropFilter = 'blur(15px)'; menu.style.transform = 'translateY(0)'; }, 15);
    overlay.onclick = (e) => { if (e.target === overlay) closeDurationPicker(); };
}

function closeDurationPicker() {
    const overlay = document.getElementById('ios-duration-overlay'); const menu = document.getElementById('ios-duration-menu');
    if (overlay && menu) { menu.style.transform = 'translateY(100%)'; overlay.style.opacity = '0'; overlay.style.backdropFilter = 'blur(0px)'; overlay.style.webkitBackdropFilter = 'blur(0px)'; setTimeout(() => overlay.remove(), 400); }
}

function logoutFromAccount() {
    if (confirm("Вы действительно хотите выйти из аккаунта и заблокировать терминал?")) {
        localStorage.removeItem('kamchy_is_authorized'); localStorage.removeItem('kamchy_user_name'); localStorage.removeItem('kamchy_session_token'); window.location.reload();
    }
}
