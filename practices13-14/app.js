//ЭЛЕМЕНТЫ DOM
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const contentDiv = document.getElementById('app-content');
const statusDiv = document.getElementById('status');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');

//localStorage 
const STORAGE_KEY = 'my_notes';
let currentEditIndex = null;


//WEBSOCKET ПОДКЛЮЧЕНИЕ
const socket = io('http://localhost:3001');

// Получение уведомлений от сервера
socket.on('taskAdded', (task) => {
    console.log('Получена задача от другого клиента:', task);
    
    // Всплывающее уведомление на странице
    const notification = document.createElement('div');
    notification.textContent = ` Новая заметка: ${task.text}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: gray;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});


// Загрузка заметок из localStorage
function loadNotes() {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    notes = notes.map(note => {
        if (typeof note === 'string') {
            return { text: note, color: null };
        }
        return note;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-message">there`s no notes yet</div>';
        return;
    }
    
    notesList.innerHTML = notes.map((note, index) => `
    <div class="note-item">
        <div class="note-header">
            <div class="mac-buttons">
                <div class="mac-circle green ${note.color === 'green' ? '' : 'empty'}" data-index="${index}" data-color="green"></div>
                <div class="mac-circle yellow ${note.color === 'yellow' ? '' : 'empty'}" data-index="${index}" data-color="yellow"></div>
                <div class="mac-circle red ${note.color === 'red' ? '' : 'empty'}" data-index="${index}" data-color="red"></div>
            </div>
        </div>
        <div class="note-content">
            <span class="note-text">${escapeHtml(note.text)}</span>
            <div class="note-buttons">
                <button class="edit-btn" data-index="${index}">edit</button>
                <button class="delete-btn" data-index="${index}">delete</button>
            </div>
        </div>
    </div>
    `).join('');
    
    // Обработчики для кружочков
    document.querySelectorAll('.mac-circle').forEach(circle => {
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(circle.dataset.index);
            const color = circle.dataset.color;
            setNoteColor(index, color);
        });
    });
    
    // Обработчики для кнопок
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            openEditModal(index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            deleteNote(index);
        });
    });
}

// Сохранение заметки
function saveNote(text) {
    if (!text.trim()) return;
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.push({ text: text.trim(), color: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

// Удаление заметки
function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

// Редактирование
function openEditModal(index) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    currentEditIndex = index;
    const noteText = typeof notes[index] === 'string' ? notes[index] : notes[index].text;
    editInput.value = noteText;
    editModal.style.display = 'flex';
}

function closeEditModal() {
    editModal.style.display = 'none';
    currentEditIndex = null;
    editInput.value = '';
}

function saveEdit() {
    const newText = editInput.value.trim();
    if (!newText) {
        alert('Введите текст заметки');
        return;
    }
    
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (typeof notes[currentEditIndex] === 'string') {
        notes[currentEditIndex] = { text: newText, color: null };
    } else {
        notes[currentEditIndex].text = newText;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    closeEditModal();
    loadNotes();
}

// Защита от XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Статус онлайн/офлайн
function updateStatus() {
    if (navigator.onLine) {
        statusDiv.textContent = 'online';
        statusDiv.className = 'status online';
    } else {
        statusDiv.textContent = 'offline';
        statusDiv.className = 'status offline';
    }
}

// Установка цвета заметки
function setNoteColor(index, color) {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (typeof notes[index] === 'string') {
        notes[index] = { text: notes[index], color: null };
    }
    
    if (notes[index].color === color) {
        notes[index].color = null;
    } else {
        notes[index].color = color;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

//ИНИЦИАЛИЗАЦИЯ ЗАМЕТОК
function initNotes() {
    loadNotes();
    
    const form = document.getElementById('note-form');
    if (form) {
        // Удаляем старый обработчик
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputField = document.getElementById('note-input');
            const text = inputField?.value.trim();
            if (text) {
                saveNote(text);
                //ОТПРАВЛЯЕМ СОБЫТИЕ НА СЕРВЕР 
                socket.emit('newTask', { text: text, timestamp: Date.now() });
                const inputField = document.getElementById('note-input');

                if (inputField) inputField.value = '';
            }
        });
    }
}

//PUSH-УВЕДОМЛЕНИЯ
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const VAPID_PUBLIC_KEY = 'BJm73pVOIB3NCZtvjqg4fQbJ-U1BAE-Z3omQnG6aTTDls45cQK3AcEw8ACmiGU1dQTiVyQjcpymxXIvCMioyqwo';  

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push не поддерживается');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка на push отправлена');
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch('http://localhost:3001/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        console.log('Отписка выполнена');
    }
}

//НАВИГАЦИЯ 
function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

async function loadContent(page) {
    if (!contentDiv) return;
    contentDiv.innerHTML = '<div class="empty-message">Loading...</div>';
    
    try {
        const response = await fetch(`content/${page}.html`);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = '<div class="empty-message">Error at loading the page.</div>';
        console.error(err);
    }
}

//ОБРАБОТЧИКИ НАВИГАЦИИ
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        setActiveButton('home-btn');
        loadContent('home');
    });
}

if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
        setActiveButton('about-btn');
        loadContent('about');
    });
}

//ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ ПО УМОЛЧАНИЮ
loadContent('home');

//СОБЫТИЯ СЕТИ
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

//КНОПКИ УВЕДОМЛЕНИЙ
const enableBtn = document.getElementById('enable-push');
const disableBtn = document.getElementById('disable-push');

if (enableBtn && disableBtn) {
    // Проверяем, есть ли уже подписка
    navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
            if (sub) {
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
            } else {
                enableBtn.style.display = 'inline-block';
                disableBtn.style.display = 'none';
            }
        });
    });

    enableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
        }
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Необходимо разрешить уведомления.');
                return;
            }
        }
        await subscribeToPush();
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
    });

    disableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        disableBtn.style.display = 'none';
        enableBtn.style.display = 'inline-block';
    });
}

//SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker зарегистрирован:', registration.scope);
        } catch (err) {
            console.error('Ошибка регистрации Service Worker:', err);
        }
    });
} else {
    console.warn('Service Worker не поддерживается в этом браузере');
}