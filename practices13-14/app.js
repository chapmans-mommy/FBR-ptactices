// ========== ЭЛЕМЕНТЫ DOM ==========
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const notesList = document.getElementById('notes-list');
const statusDiv = document.getElementById('status');

// ========== РАБОТА С localStorage ==========
const STORAGE_KEY = 'my_notes';

// Загрузка заметок из localStorage
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-message">there`s no notes yet</div>';
        return;
    }
    
    notesList.innerHTML = notes.map((note, index) => `
        <div class="note-item">
            <span class="note-text">${escapeHtml(note)}</span>
            <button class="delete-btn" data-index="${index}">delete</button>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            deleteNote(index);
        });
    });
}

// Сохранение заметки
function saveNote(text) {
    if (!text.trim()) return;
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.push(text.trim());
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

// Защита от XSS (экранирование HTML)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== ОТОБРАЖЕНИЕ СТАТУСА ОНЛАЙН/ОФЛАЙН ==========
function updateStatus() {
    if (navigator.onLine) {
        statusDiv.textContent = 'online';
        statusDiv.className = 'status online';
    } else {
        statusDiv.textContent = 'offline';
        statusDiv.className = 'status offline';
    }
}

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// ========== ОБРАБОТКА ФОРМЫ ==========
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        saveNote(text);
        input.value = '';
        input.focus();
    }
});

// ========== ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА ==========
loadNotes();

// ========== РЕГИСТРАЦИЯ SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker зарегистрирован:', registration.scope);
            
            // Проверка обновлений
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Найдено обновление Service Worker');
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('Обновление установлено. Обновите страницу');
                    }
                });
            });
        } catch (err) {
            console.error('Ошибка регистрации Service Worker:', err);
        }
    });
} else {
    console.warn('⚠️ Service Worker не поддерживается в этом браузере');
    statusDiv.textContent = 'Service Worker не поддерживается';
}