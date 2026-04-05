//ЭЛЕМЕНТЫ DOM
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const contentDiv = document.getElementById('app-content');
const statusDiv = document.getElementById('status');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');

const reminderForm = document.getElementById('reminder-form');
const reminderText = document.getElementById('reminder-text');
const reminderTime = document.getElementById('reminder-time');

//ТЕГИ
const TAGS = {
    work: { name: 'Work', color: '#4a6fa5' },
    university: { name: 'University', color: '#9b59b6' },
    home: { name: 'Home', color: '#e67e22' },
    shopping: { name: 'Shopping', color: '#2ecc71' }
};

const TAG_KEYS = ['work', 'university', 'home', 'shopping'];
let activeFilters = []; // массив выбранных тегов для фильтрации

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
            return { id: Date.now() + Math.random(), text: note, color: null, reminder: null };
        }
        if (!note.id) note.id = Date.now() + Math.random();
        return note;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-message">there`s no notes yet</div>';
        return;
    }

    notesList.innerHTML = notes.map((note, index) => {
        let reminderInfo = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderInfo = `<div class="reminder-badge">Reminder: ${date.toLocaleString()}</div>`;
        }
        
        // Проверяем фильтрацию
        if (activeFilters.length > 0 && (!note.tag || !activeFilters.includes(note.tag))) {
            return ''; // пропускаем заметку, если не подходит под фильтр
        }
        
        // Внутри notesList.innerHTML, перед return, добавь проверку:
        if (activeFilters.length > 0 && (!note.tag || !activeFilters.includes(note.tag))) {
            return ''; // пропускаем заметку
        }

        return `
        <div class="note-item" data-id="${note.id}" data-tag="${note.tag || ''}" style="${activeFilters.length > 0 && (!note.tag || !activeFilters.includes(note.tag)) ? 'display: none;' : ''}">
            <div class="note-header">
                <div class="mac-buttons">
                    <div class="mac-circle green ${note.color === 'green' ? '' : 'empty'}" data-index="${index}" data-color="green"></div>
                    <div class="mac-circle yellow ${note.color === 'yellow' ? '' : 'empty'}" data-index="${index}" data-color="yellow"></div>
                    <div class="mac-circle red ${note.color === 'red' ? '' : 'empty'}" data-index="${index}" data-color="red"></div>
                </div>
                <div class="tag-container">
                    <div class="tag-badge" data-index="${index}" data-tag="${note.tag || ''}" style="background: ${note.tag ? TAGS[note.tag]?.color : '#aaa'};">
                        ${note.tag ? TAGS[note.tag]?.name : 'Tag'}
                    </div>
                </div>
            </div>
            <div class="note-content">
                <div class="note-text-wrapper">
                    <span class="note-text">${escapeHtml(note.text)}</span>
                    ${reminderInfo}
                </div>
                <div class="note-buttons">
                    <button class="edit-btn" data-index="${index}">edit</button>
                    <button class="delete-btn" data-index="${index}">delete</button>
                </div>
            </div>
        </div>
        `;
    }).join('');;

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

    // Обработчики для тегов
    document.querySelectorAll('.tag-badge').forEach(tagEl => {
        tagEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(tagEl.dataset.index);
            openTagMenu(index, tagEl);
        });
    });
    initFilter();
}

function saveNote(text, tag) {
    if (!text.trim()) return;
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.push({ 
        text: text.trim(), 
        color: null, 
        reminder: null, 
        tag: tag || null 
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}


// Добавление заметки с напоминанием
async function addNoteWithReminder(text, reminderTimestamp, tag) {
    if (!text.trim()) return;
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newNote = { 
        id: Date.now(), 
        text: text.trim(), 
        color: null,
        reminder: reminderTimestamp,
        tag: tag || null
    };
    notes.push(newNote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
    
    socket.emit('newReminder', {
        id: newNote.id,
        text: text.trim(),
        reminderTime: reminderTimestamp
    });
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
    const note = notes[index];
    const noteText = typeof note === 'string' ? note : note.text;
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
        alert('Enter the text');
        return;
    }
    
    const tagSelect = document.getElementById('edit-tag');
    const newTag = tagSelect?.value || null;
    
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (typeof notes[currentEditIndex] === 'string') {
        notes[currentEditIndex] = { text: newText, color: null, reminder: null, tag: newTag };
    } else {
        notes[currentEditIndex].text = newText;
        notes[currentEditIndex].tag = newTag;
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
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputField = document.getElementById('note-input');
            const tagSelect = document.getElementById('note-tag');
            const text = inputField?.value.trim();
            if (text) {
                saveNote(text, tagSelect?.value || null);
                socket.emit('newTask', { text: text, timestamp: Date.now() });
                if (inputField) inputField.value = '';
                if (tagSelect) tagSelect.value = '';
            }
        });
    }

    // Форма с напоминанием
    if (reminderForm) {
        const newReminderForm = reminderForm.cloneNode(true);
        reminderForm.parentNode.replaceChild(newReminderForm, reminderForm);
        
        newReminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.getElementById('reminder-text')?.value.trim();
            const datetime = document.getElementById('reminder-time')?.value;
            const tagSelect = document.getElementById('reminder-tag');
            
            if (text && datetime) {
                const timestamp = new Date(datetime).getTime();
                if (timestamp > Date.now()) {
                    addNoteWithReminder(text, timestamp, tagSelect?.value || null);
                    const textField = document.getElementById('reminder-text');
                    const timeField = document.getElementById('reminder-time');
                    if (textField) textField.value = '';
                    if (timeField) timeField.value = '';
                    if (tagSelect) tagSelect.value = '';
                } else {
                    alert('Date should be in the future');
                }
            } else {
                alert('fill all the gaps');
            }
        });
    }
    initFilter(); 
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

socket.on('reminderSnoozed', (data) => {
    console.log('Напоминание отложено:', data);
    // Показываем уведомление на странице
    const notification = document.createElement('div');
    notification.className = 'floating-notification';
    notification.innerHTML = `the reminder has been postponed for 5 minutes`;
    notification.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

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


// Глобальная функция для обработки напоминаний
window.handleReminderSubmit = function(e) {
    e.preventDefault();
    
    const text = document.getElementById('reminder-text')?.value.trim();
    const datetime = document.getElementById('reminder-time')?.value;
    
    console.log('handleReminderSubmit вызвана!', { text, datetime });
    
    if (text && datetime) {
        const timestamp = new Date(datetime).getTime();
        if (timestamp > Date.now()) {
            addNoteWithReminder(text, timestamp);
            const textField = document.getElementById('reminder-text');
            const timeField = document.getElementById('reminder-time');
            if (textField) textField.value = '';
            if (timeField) timeField.value = '';
        } else {
            alert('Date should be in the future');
        }
    } else {
        alert('fill all the gaps');
    }
};


// ========== ТЕГИ ==========
function setNoteTag(index, newTag) {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (typeof notes[index] === 'string') {
        notes[index] = { text: notes[index], color: null, reminder: null, tag: newTag || null };
    } else {
        notes[index].tag = newTag || null;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

function openTagMenu(index, tagElement) {
    const currentTag = tagElement.dataset.tag;
    const rect = tagElement.getBoundingClientRect();
    
    // Удаляем существующее меню
    const existingMenu = document.querySelector('.tag-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'tag-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        left: ${rect.left}px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 150px;
        overflow: hidden;
    `;
    
    // Опция "Без тега"
    const noTagOption = document.createElement('div');
    noTagOption.className = 'tag-menu-item';
    noTagOption.innerHTML = 'No tag';
    noTagOption.style.cssText = 'padding: 10px 16px; cursor: pointer; transition: background 0.2s;';
    noTagOption.onmouseover = () => noTagOption.style.background = '#f0f0f0';
    noTagOption.onmouseout = () => noTagOption.style.background = 'white';
    noTagOption.onclick = () => {
        setNoteTag(index, null);
        menu.remove();
    };
    menu.appendChild(noTagOption);
    
    // Опции для каждого тега
    TAG_KEYS.forEach(tagKey => {
        const tag = TAGS[tagKey];
        const option = document.createElement('div');
        option.className = 'tag-menu-item';
        option.innerHTML = `${tag.name}`;
        option.style.cssText = `padding: 10px 16px; cursor: pointer; transition: background 0.2s; border-left: 4px solid ${tag.color};`;
        option.onmouseover = () => option.style.background = '#f0f0f0';
        option.onmouseout = () => option.style.background = 'white';
        option.onclick = () => {
            setNoteTag(index, tagKey);
            menu.remove();
        };
        menu.appendChild(option);
    });
    
    document.body.appendChild(menu);
    
    // Закрыть при клике вне меню
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== tagElement) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// ========== ФИЛЬТРАЦИЯ ==========
// ========== ФИЛЬТРАЦИЯ ==========
function initFilter() {
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyBtn = document.getElementById('apply-filter');
    const clearBtn = document.getElementById('clear-filter');
    
    if (!filterBtn) return;
    
    // Удаляем старые обработчики, чтобы не было дублирования
    const newFilterBtn = filterBtn.cloneNode(true);
    filterBtn.parentNode.replaceChild(newFilterBtn, filterBtn);
    
    newFilterBtn.addEventListener('click', () => {
        const dropdown = document.getElementById('filter-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    if (applyBtn) {
        const newApplyBtn = applyBtn.cloneNode(true);
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
        
        newApplyBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('filter-dropdown');
            const checkboxes = dropdown?.querySelectorAll('input[type="checkbox"]');
            activeFilters = [];
            checkboxes?.forEach(cb => {
                if (cb.checked) activeFilters.push(cb.value);
            });
            if (dropdown) dropdown.style.display = 'none';
            loadNotes(); // перерисовываем с фильтром
        });
    }
    
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        
        newClearBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('filter-dropdown');
            const checkboxes = dropdown?.querySelectorAll('input[type="checkbox"]');
            checkboxes?.forEach(cb => cb.checked = false);
            activeFilters = [];
            if (dropdown) dropdown.style.display = 'none';
            loadNotes();
        });
    }
}