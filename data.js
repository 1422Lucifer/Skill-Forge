// --- QUIZ CONTENT DATABASE ---
const quizQuestions = {
    python: {
        1: [ { pre: "", post: '("Hello World!")', correct: 'print', options: ['print', 'echo', 'show'] }, { pre: 'print(', post: ')', correct: '"Score: 100"', options: ['"Score: 100"', 'Score: 100', '#Score: 100'] } ],
        2: [ { pre: 'lives ', post: ' 3', correct: '=', options: ['=', '==', '->'] }, { pre: 'player_name = ', post: '', correct: '"Hero"', options: ['"Hero"', 'Hero', 'Hero()'] } ],
        3: [ { pre: 'score = 10 ', post: ' 5', correct: '+', options: ['+', 'add', 'plus'] }, { pre: 'total = 50 ', post: ' 2', correct: '*', options: ['*', 'x', 'times'] } ],
        4: [ { pre: 'health = 100\nhealth = health ', post: ' 10', correct: '-', options: ['-', 'minus', '~'] }, { pre: 'print("HP: "', post: ' health)', correct: ',', options: [',', '+', 'and'] } ],
        5: [ { pre: 'if lives > 0', post: '', correct: ':', options: [':', ';', '{'] }, { pre: '    print(', post: ')', correct: '"Keep playing!"', options: ['"Keep playing!"', 'Keep playing!', 'True'] } ]
    },
    aptitude: {
        1: [ { pre: 'If 2x = 10, then x ', post: '', correct: '= 5', options: ['= 5', '= 20', '= 8'] }, { pre: '15 ', post: ' 3 = 5', correct: '/', options: ['/', '-', '*'] } ],
        2: [ { pre: 'Series: 2, 4, 6, 8, ', post: '', correct: '10', options: ['10', '12', '9'] }, { pre: 'A, C, E, G, ', post: '', correct: 'I', options: ['I', 'H', 'J'] } ],
        3: [ { pre: 'Train at 60km/h for 2h travels ', post: ' km', correct: '120', options: ['120', '60', '30'] }, { pre: '3 apples cost $6. 1 apple costs $', post: '', correct: '2', options: ['2', '3', '18'] } ],
        4: [ { pre: '10% of 200 is ', post: '', correct: '20', options: ['20', '10', '2000'] }, { pre: 'Half of a half is ', post: '', correct: '1/4', options: ['1/4', '1', '1/8'] } ],
        5: [ { pre: 'Square root of 81 is ', post: '', correct: '9', options: ['9', '8', '7'] }, { pre: '5 + 5 * 5 = ', post: '', correct: '30', options: ['30', '50', '25'] } ]
    },
    communication: {
        1: [ { pre: 'When meeting a client: "', post: ' to meet you."', correct: 'Pleased', options: ['Pleased', 'Whatever', 'Yo'] }, { pre: 'Ending an email: "Best ', post: ',"', correct: 'regards', options: ['regards', 'wishes', 'friends'] } ],
        2: [ { pre: 'To show you understand: "I ', post: ' what you mean."', correct: 'see', options: ['see', 'guess', 'ignore'] }, { pre: 'Asking for clarity: "Could you ', post: ' on that?"', correct: 'elaborate', options: ['elaborate', 'stop', 'yell'] } ],
        3: [ { pre: 'Giving feedback: "Have you ', post: ' doing it this way?"', correct: 'considered', options: ['considered', 'thought', 'tried'] }, { pre: 'Apologizing: "I apologize for the ', post: '."', correct: 'inconvenience', options: ['inconvenience', 'bad', 'mistake'] } ],
        4: [ { pre: 'Declining nicely: "I\'m ', post: ' I can\'t make it."', correct: 'afraid', options: ['afraid', 'sorry', 'sad'] }, { pre: 'Agreeing: "I completely ', post: ' with you."', correct: 'agree', options: ['agree', 'align', 'yes'] } ],
        5: [ { pre: 'Closing a meeting: "Let\'s ', post: ' base next week."', correct: 'touch', options: ['touch', 'hit', 'talk'] }, { pre: 'Following up: "Just checking ', post: ' on this task."', correct: 'in', options: ['in', 'up', 'out'] } ]
    }
};

// --- LOCAL BACKEND / USER PROGRESS DATABASE ---
const DB_KEY = "pyLingoUserData4"; 

const defaultUser = {
    username: "Hacker_01",
    streak: 0,
    xp: 0,
    hearts: 5,
    joinedDate: new Date().toLocaleDateString(),
    completedNodes: { python: [], aptitude: [], communication: [] },
    aiFeedback: [],
    totalAnswers: 0,
    correctAnswers: 0
};

const mockLeaderboard = [
    { name: "CodeNinja", xp: 1250 },
    { name: "LogicPro", xp: 890 },
    { name: "SyntaxError", xp: 600 },
    { name: "AlgoRhythm", xp: 320 }
];

const DB = {
    getUser: () => {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : defaultUser;
    },
    saveUser: (userData) => {
        localStorage.setItem(DB_KEY, JSON.stringify(userData));
    },
    addXPAndStreak: (xpAmount) => {
        let user = DB.getUser();
        user.xp += xpAmount;
        user.streak += 1; 
        DB.saveUser(user);
    },
    recordAnswer: (isCorrect) => {
        let user = DB.getUser();
        user.totalAnswers++;
        if (isCorrect) {
            user.correctAnswers++;
        } else {
            user.hearts = Math.max(0, user.hearts - 1);
        }
        DB.saveUser(user);
        return user.hearts;
    },
    refillHearts: () => {
        let user = DB.getUser();
        user.hearts = 5;
        DB.saveUser(user);
        window.location.reload();
    },
    markNodeComplete: (track, lessonId) => {
        let user = DB.getUser();
        if (!user.completedNodes[track].includes(lessonId)) {
            user.completedNodes[track].push(lessonId);
            
            // Advanced contextual AI strings
            const concepts = {
                python: ["memory allocation", "loop optimization", "syntax parsing", "variable binding"],
                aptitude: ["pattern recognition", "logical deduction", "spatial reasoning", "quantitative analysis"],
                communication: ["tone moderation", "empathetic framing", "clarity vectors", "professional de-escalation"]
            };
            let randomConcept = concepts[track][Math.floor(Math.random() * concepts[track].length)];
            let accuracy = user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 100;
            
            user.aiFeedback.unshift({
                track: track,
                level: lessonId,
                message: `Analyzed completion of Level ${lessonId}. Demonstrated a ${accuracy}% base retention rate. Neural model suggests improved ${randomConcept} algorithms. Ready for next module.`,
                date: new Date().toLocaleTimeString()
            });

            DB.saveUser(user);
        }
    },
    getLeaderboard: () => {
        let user = DB.getUser();
        if (user.xp === 0) return null;
        let board = [...mockLeaderboard, { name: user.username + " (You)", xp: user.xp }];
        return board.sort((a, b) => b.xp - a.xp);
    },
    resetData: () => {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultUser));
        window.location.reload();
    }
};

if (!localStorage.getItem(DB_KEY)) DB.saveUser(defaultUser);
