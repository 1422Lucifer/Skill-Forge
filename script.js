let currentQuestionIndex = 0;
let currentAnswer = null;
let activeSubject = 'python';
let activeLessonId = null;
let currentQuizData = [];

// DOM Elements
const popup = document.getElementById('lesson-popup');
const popupTitle = document.getElementById('popup-title');
const dropzone = document.getElementById('dropzone');
const checkBtn = document.getElementById('check-btn');

// --- INITIALIZE UI FROM DATABASE ---
function syncUIWithDB() {
    const user = DB.getUser();
    
    document.querySelectorAll('.ui-streak').forEach(el => el.innerText = user.streak);
    document.querySelectorAll('.ui-xp').forEach(el => el.innerText = user.xp);
    document.querySelectorAll('.ui-hearts').forEach(el => el.innerText = user.hearts);

    document.getElementById('dash-username').innerText = user.username;
    document.getElementById('dash-joined').innerText = user.joinedDate;
    document.getElementById('dash-xp').innerText = user.xp;
    document.getElementById('dash-streak').innerText = `${user.streak} 🔥`;
    document.getElementById('dash-python-nodes').innerText = user.completedNodes.python.length;
    document.getElementById('dash-aptitude-nodes').innerText = user.completedNodes.aptitude.length;
    document.getElementById('dash-comm-nodes').innerText = user.completedNodes.communication.length;

    const trackIcons = { python: '&gt;_', aptitude: '∑', communication: '💬' };

    ['python', 'aptitude', 'communication'].forEach(track => {
        let maxCompleted = 0;

        user.completedNodes[track].forEach(nodeId => {
            if (nodeId > maxCompleted) maxCompleted = nodeId;
            const node = document.getElementById(`node-${track}-${nodeId}`);
            if (node) {
                node.classList.remove('active', 'locked');
                node.classList.add('completed');
                node.innerHTML = "✔"; 
            }
        });

        if (maxCompleted >= 0 && maxCompleted < 5) {
            const nextNodeId = maxCompleted + 1;
            const nextNode = document.getElementById(`node-${track}-${nextNodeId}`);
            
            if (nextNode && nextNode.classList.contains('locked')) {
                nextNode.classList.remove('locked');
                nextNode.classList.add('active');
                
                nextNode.innerHTML = trackIcons[track]; 
                
                if(track === 'aptitude') nextNode.classList.add('aptitude-node');
                if(track === 'communication') nextNode.classList.add('comm-node');
                
                nextNode.onclick = function() { 
                    showPopup(this, `Level ${nextNodeId}`, track, nextNodeId); 
                };
            }
        }
    });
}

// --- POPULATE LEADERBOARD ---
function renderLeaderboard() {
    const boardData = DB.getLeaderboard();
    const container = document.getElementById('league-content');
    
    if (!boardData) {
        container.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">Complete 1 level to join the Global League!</p>`;
        return;
    }

    container.innerHTML = boardData.map((player, index) => {
        let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹";
        let isYou = player.name.includes("(You)") ? "color: var(--accent-blue);" : "";
        return `
            <div class="leaderboard-row" style="${isYou}">
                <span>${medal} ${player.name}</span>
                <span>${player.xp} XP</span>
            </div>
        `;
    }).join("");
}

// --- POPULATE AI COACH (WITH PIE CHART) ---
function renderAIFeedback() {
    const user = DB.getUser();
    
    let accuracy = user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0;
    
    const chart = document.getElementById('ai-accuracy-chart');
    const val = document.getElementById('ai-accuracy-val');
    val.innerText = `${accuracy}%`;
    chart.style.background = `conic-gradient(var(--accent-purple) ${accuracy}%, var(--bg-dark) 0)`;

    let retention = accuracy > 85 ? "Optimal" : accuracy > 60 ? "Stable" : "Requires Review";
    let velocity = user.streak > 3 ? "Accelerated" : "Baseline";
    let mastery = `Module ${Math.max(1, Math.floor((user.xp / 50)))}`;
    
    if (user.totalAnswers === 0) { retention = "N/A"; velocity = "N/A"; mastery = "N/A"; }

    document.getElementById('ai-pred-mastery').innerText = mastery;
    document.getElementById('ai-pred-retention').innerText = retention;
    document.getElementById('ai-pred-velocity').innerText = velocity;

    const container = document.getElementById('ai-feedback-list');
    if (user.aiFeedback.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">No feedback yet. Complete a level to engage the AI model.</p>`;
        return;
    }

    container.innerHTML = user.aiFeedback.map(fb => `
        <div class="ai-msg">
            <div class="ai-msg-header">
                <span><span style="color: var(--accent-blue)">[SYSTEM]</span> ${fb.track.toUpperCase()} / Lvl ${fb.level}</span>
                <span>${fb.date}</span>
            </div>
            <p>${fb.message}</p>
        </div>
    `).join("");
}

window.onload = syncUIWithDB;

// --- NAVIGATION LOGIC ---
function switchNav(view) {
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.main-content').forEach(main => main.classList.add('hidden'));
    
    document.getElementById(`nav-${view}`).classList.add('active');
    document.getElementById(`view-${view}`).classList.remove('hidden');

    if (view === 'dashboard' || view === 'learn') syncUIWithDB();
    if (view === 'leagues') renderLeaderboard();
    if (view === 'ai') renderAIFeedback();
}

// --- TRACK SWITCHING ---
function switchTrack(track) {
    activeSubject = track;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.track-content').forEach(content => content.classList.remove('active-track'));
    document.getElementById(`path-${track}`).classList.add('active-track');
    popup.classList.add('hidden');

    const colors = { python: 'var(--accent-green)', aptitude: 'var(--accent-purple)', communication: 'var(--accent-orange)' };
    const activeColor = colors[track];
    
    document.querySelector('.glow-text').style.color = activeColor;
    document.querySelector('.progress-fill').style.background = activeColor;
    
    // Dynamically change the XP icon text color based on track
    document.querySelectorAll('.dynamic-xp').forEach(el => {
        el.style.color = activeColor;
    });
}

function showPopup(element, title, subject, lessonId) {
    if(element.classList.contains('locked')) return;

    activeSubject = subject;
    activeLessonId = lessonId;
    
    const rect = element.getBoundingClientRect();
    const colors = { python: 'var(--accent-blue)', aptitude: 'var(--accent-purple)', communication: 'var(--accent-orange)' };
    
    popupTitle.innerText = title;
    popupTitle.style.color = colors[subject];
    document.getElementById('popup-desc').innerText = `Level ${lessonId}`;
    
    popup.style.top = `${rect.top + window.scrollY - 130}px`;
    popup.style.left = `${rect.left + window.scrollX - 110 + (rect.width / 2)}px`;
    popup.classList.remove('hidden');
}

// Start Lesson
document.getElementById('start-lesson-btn').addEventListener('click', () => {
    let user = DB.getUser();
    if (user.hearts <= 0) return alert("You are out of hearts! Refill them in the Dashboard.");

    currentQuizData = quizQuestions[activeSubject][activeLessonId] || [];
    if (!currentQuizData.length) return alert("Level data missing!");

    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('lesson-view').classList.remove('hidden');
    popup.classList.add('hidden');
    
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    
    currentQuestionIndex = 0;
    loadQuestion();
});

document.getElementById('close-lesson-btn').addEventListener('click', () => {
    document.getElementById('lesson-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
    syncUIWithDB();
});

// --- LESSON/QUIZ LOGIC ---
function loadQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / currentQuizData.length) * 100}%`;

    const footer = document.getElementById('lesson-footer');
    footer.classList.remove('correct', 'wrong');
    checkBtn.innerText = "Check Syntax";
    checkBtn.classList.remove('active-btn');
    checkBtn.disabled = true;
    checkBtn.onclick = checkAnswer; 
    
    document.getElementById('code-pre').innerText = q.pre;
    document.getElementById('code-post').innerText = q.post;
    
    dropzone.innerText = "";
    dropzone.classList.remove('filled');
    currentAnswer = null;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    [...q.options].sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement('div');
        btn.classList.add('drag-option');
        btn.innerText = opt;
        btn.addEventListener('click', () => fillDropzone(btn.innerText, btn)); 
        optionsContainer.appendChild(btn);
    });
}

dropzone.addEventListener('click', () => {
    if (currentAnswer) {
        document.querySelector('.hidden-option').classList.remove('hidden-option');
        dropzone.innerText = "";
        dropzone.classList.remove('filled');
        currentAnswer = null;
        checkBtn.disabled = true;
        checkBtn.classList.remove('active-btn');
    }
});

function fillDropzone(text, sourceElement) {
    const existing = document.querySelector('.hidden-option');
    if (existing) existing.classList.remove('hidden-option');
    sourceElement.classList.add('hidden-option');

    dropzone.innerText = text;
    dropzone.classList.add('filled');
    currentAnswer = text;
    checkBtn.disabled = false;
    checkBtn.classList.add('active-btn');
}

// --- VALIDATION & HEARTS MECHANIC ---
function checkAnswer() {
    const q = currentQuizData[currentQuestionIndex];
    const footer = document.getElementById('lesson-footer');
    const colors = { python: 'var(--accent-green)', aptitude: 'var(--accent-purple)', communication: 'var(--accent-orange)' };

    if (currentAnswer === q.correct) {
        DB.recordAnswer(true);
        footer.classList.add('correct');
        footer.style.borderTopColor = colors[activeSubject];
        checkBtn.innerText = "Continue / >";
        checkBtn.style.background = colors[activeSubject];
        checkBtn.onclick = nextQuestion;
    } else {
        let remainingHearts = DB.recordAnswer(false);
        document.querySelectorAll('.ui-hearts').forEach(el => el.innerText = remainingHearts);

        if (remainingHearts <= 0) {
            alert("Out of Hearts! Session Terminated.");
            document.getElementById('lesson-view').classList.add('hidden');
            document.getElementById('main-view').classList.remove('hidden');
            syncUIWithDB();
            return;
        }

        footer.classList.add('wrong');
        checkBtn.innerText = "Retry";
        checkBtn.onclick = () => {
            footer.classList.remove('wrong');
            footer.style.borderTopColor = ''; 
            checkBtn.innerText = "Check Syntax";
            checkBtn.style.background = '';
            document.querySelector('.hidden-option').classList.remove('hidden-option');
            dropzone.innerText = "";
            dropzone.classList.remove('filled');
            currentAnswer = null;
            checkBtn.disabled = true;
            checkBtn.classList.remove('active-btn');
            checkBtn.onclick = checkAnswer;
        };
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.length) {
        document.getElementById('lesson-footer').style.borderTopColor = '';
        checkBtn.style.background = '';
        loadQuestion();
    } else {
        // FINISH LEVEL
        document.getElementById('progress-bar').style.width = "100%";
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('completion-screen').classList.remove('hidden');
        
        DB.addXPAndStreak(15);
        DB.markNodeComplete(activeSubject, activeLessonId);

        checkBtn.innerText = "Return to Map";
        checkBtn.onclick = () => {
            document.getElementById('lesson-view').classList.add('hidden');
            document.getElementById('main-view').classList.remove('hidden');
            syncUIWithDB(); 
        };
    }
}
