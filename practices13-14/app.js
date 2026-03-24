// ========== ЭЛЕМЕНТЫ DOM ==========
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const notesList = document.getElementById('notes-list');
const statusDiv = document.getElementById('status');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');

// ========== РАБОТА С localStorage ==========
const STORAGE_KEY = 'my_notes';
let currentEditIndex = null; //for editing

// Загрузка заметок из localStorage
function loadNotes() {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Для старых заметок добавляем поле color, если его нет
    notes = notes.map(note => {
        if (typeof note === 'string') {
            return { text: note, color: null };
        }
        return note;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
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

// ========== РЕДАКТИРОВАНИЕ ==========
function openEditModal(index) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    currentEditIndex = index;
    // Получаем текст из заметки (может быть строка или объект)
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
    
    // Сохраняем текст, сохраняя цвет
    if (typeof notes[currentEditIndex] === 'string') {
        notes[currentEditIndex] = { text: newText, color: null };
    } else {
        notes[currentEditIndex].text = newText;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
    closeEditModal();
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

// Установка цвета заметки
function setNoteColor(index, color) {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Если заметка в старом формате (строка), преобразуем
    if (typeof notes[index] === 'string') {
        notes[index] = { text: notes[index], color: null };
    }
    
    // Если нажали на уже выбранный цвет — сбрасываем (null)
    if (notes[index].color === color) {
        notes[index].color = null;
    } else {
        notes[index].color = color;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes(); // обновляем отображение
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