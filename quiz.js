// ============================================
// 全局变量
// ============================================
let chapters = [];          // 所有章节信息
let currentQuestions = [];  // 当前题目
let currentQuestionIndex = 0;
let userAnswers = [];
let currentChapterId = null;
let timerInterval;
let timeRemaining = 20 * 60; // 20分钟

// ============================================
// 1. 加载章节配置
// ============================================
async function loadChaptersConfig() {
    try {
        const response = await fetch('chapters.json');
        const data = await response.json();
        chapters = data.chapters;
        
        // 渲染章节选择界面
        renderChapterCards();
        
        return true;
    } catch (error) {
        console.error('加载章节配置失败:', error);
        alert('无法加载章节列表，请检查 chapters.json 文件是否存在');
        return false;
    }
}

// ============================================
// 2. 渲染章节卡片
// ============================================
function renderChapterCards() {
    const chapterGrid = document.getElementById('chapterGrid');
    chapterGrid.innerHTML = '';
    
    chapters.forEach(chapter => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.onclick = () => startQuiz(chapter.id);
        
        card.innerHTML = `
            <div class="chapter-badge">${chapter.week}</div>
            <h3>${chapter.title}</h3>
            <p class="chapter-meta">
                <span class="instructor">👨‍🏫 ${chapter.instructor}</span>
                <span class="date">📅 ${chapter.date}</span>
            </p>
            <p class="chapter-desc">${chapter.description}</p>
            <span class="question-count">📝 ${chapter.questionCount} 题</span>
        `;
        
        chapterGrid.appendChild(card);
    });
    
    // 添加"全部章节"卡片
    const allCard = document.createElement('div');
    allCard.className = 'chapter-card all-chapters';
    allCard.onclick = () => startQuiz('all');
    
    allCard.innerHTML = `
        <div class="chapter-badge">🎯</div>
        <h3>全部章节</h3>
        <p class="chapter-meta">
            <span class="instructor">综合练习</span>
            <span class="date">All Weeks</span>
        </p>
        <p class="chapter-desc">随机抽取所有章节题目</p>
        <span class="question-count">📝 50 题</span>
    `;
    
    chapterGrid.appendChild(allCard);
}

// ============================================
// 3. 开始测验
// ============================================
async function startQuiz(chapterId) {
    currentChapterId = chapterId;
    
    // 显示加载动画
    document.getElementById('chapterSelect').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    const success = await loadQuestions(chapterId);
    
    if (success) {
        currentQuestionIndex = 0;
        userAnswers = new Array(currentQuestions.length).fill(null);
        
        // 启动计时器
        startTimer();
        
        // 显示测验界面
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('quizContainer').classList.remove('hidden');
        
        // 显示第一题
        showQuestion(0);
    } else {
        // 加载失败，返回章节选择
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('chapterSelect').classList.remove('hidden');
    }
}

// ============================================
// 4. 加载题目
// ============================================
async function loadQuestions(chapterId) {
    try {
        if (chapterId === 'all') {
            // 加载所有章节的题目
            const allQuestions = [];
            
            for (const chapter of chapters) {
                const questions = await loadChapterQuestions(chapter.fileName);
                allQuestions.push(...questions);
            }
            
            // 随机抽取50题
            currentQuestions = getRandomItems(allQuestions, 50);
        } else {
            // 加载单个章节
            const chapter = chapters.find(c => c.id === chapterId);
            
            if (!chapter) {
                throw new Error(`未找到章节: ${chapterId}`);
            }
            
            currentQuestions = await loadChapterQuestions(chapter.fileName);
        }
        
        // 随机化题目顺序
        currentQuestions = shuffleArray(currentQuestions);
        
        return true;
    } catch (error) {
        console.error('加载题目失败:', error);
        alert(`无法加载题目数据：${error.message}`);
        return false;
    }
}

// ============================================
// 5. 加载单个章节的题目
// ============================================
async function loadChapterQuestions(fileName) {
    try {
        const response = await fetch(`data/${fileName}`);
        const data = await response.json();
        return data.questions || data;
    } catch (error) {
        console.error(`加载 ${fileName} 失败:`, error);
        throw new Error(`文件 ${fileName} 不存在或格式错误`);
    }
}

// ============================================
// 工具函数
// ============================================

// 随机化数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 从数组中随机抽取指定数量的元素
function getRandomItems(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
}

// 启动计时器
function startTimer() {
    timeRemaining = 20 * 60; // 重置为20分钟
    updateTimerDisplay();
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `⏱️ 剩余时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ... (其他测验逻辑函数 - showQuestion, nextQuestion, prevQuestion, submitQuiz, showResults 等)
// 这些函数与之前提供的版本相同