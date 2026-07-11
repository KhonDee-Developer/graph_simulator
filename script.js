// --- CONFIGURATION & STATES ---
const canvas = document.getElementById('mathGraphCanvas');
const ctx = canvas.getContext('2d');
const equationInput = document.getElementById('equationInput');
const plotButton = document.getElementById('plotButton');
const gameModeSelect = document.getElementById('gameMode');
const feedbackMessage = document.getElementById('feedbackMessage');

const WIDTH = 800;
const HEIGHT = 500;
const SCALE_FACTOR = 30; // 30 พิกเซล = 1 หน่วยคณิตศาสตร์

let gameState = {
    currentMode: 'test_slope',
    score: 0,
    target: null, // เก็บค่าเป้าหมายของแต่ละโหมด
    hint: '',
    timeLeft: 120, // 120 วินาทีต่อด่าน    
    timerInterval: null 
};

// แปลงพิกัด Math -> Screen
const toScreenX = (mathX) => (WIDTH / 2) + (mathX * SCALE_FACTOR);
const toScreenY = (mathY) => (HEIGHT / 2) - (mathY * SCALE_FACTOR);
// แปลงพิกัด Screen -> Math
const toMathX = (screenX) => (screenX - WIDTH / 2) / SCALE_FACTOR;
const toMathY = (screenY) => (HEIGHT / 2 - screenY) / SCALE_FACTOR;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    // สร้าง UI ส่วนควบคุมเกมเพิ่มเติมใน Panel
    setupGameUI();
    
    // เปลี่ยนโหมดเกม
    gameModeSelect.addEventListener('change', (e) => {
        gameState.currentMode = e.target.value;
        startNewLevel();
    });

    // ปุ่มกดตรวจคำตอบ / วาดกราฟ
    plotButton.addEventListener('click', handleUserSubmit);

    // เริ่มเกมด่านแรก
    startNewLevel();
});

// --- GAME UI SETUP ---
function setupGameUI() {
    const panel = document.querySelector('.controls-panel');
    
    const gameDisplay = document.createElement('div');
    gameDisplay.innerHTML = `
        <div style="background: #eef2f7; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 5px solid #3498db;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom: 5px;">
                <span>🎯 คะแนน: <span id="scoreBoard">0</span></span>
                <span style="color: #e74c3c;">⏱️ เวลา: <span id="timerBoard">120</span> วินาที</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span></span>
                <button id="nextLevelBtn" style="padding:4px 10px; font-size:12px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">ข้าม/สุ่มด่านใหม่</button>
            </div>
            <div id="questBox" style="margin-top: 8px; font-size: 14px; color: #2c3e50;"></div>
        </div>
    `;
    panel.insertBefore(gameDisplay, equationInput.previousElementSibling);
    
    document.getElementById('nextLevelBtn').addEventListener('click', () => startNewLevel());
}

// --- TIMER SYSTEM ---
function startTimer() {
    clearInterval(gameState.timerInterval);
    
    if (!gameState.target) {
        document.getElementById('timerBoard').textContent = "∞";
        return;
    }
    
    gameState.timeLeft = 120; // 120 วินาทีสำหรับแต่ละด่าน
    document.getElementById('timerBoard').textContent = gameState.timeLeft;
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timerBoard').textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    feedbackMessage.className = "message";
    feedbackMessage.style.color = "#d35400";
    feedbackMessage.innerHTML = `⏰ <strong>หมดเวลาแล้ว!</strong> ด่านถัดไปกำลังจะเริ่ม... <br><small style="color:#7f8c8d">${gameState.hint}</small>`;
    
    plotButton.disabled = true;
    setTimeout(() => {
        plotButton.disabled = false;
        startNewLevel();
    }, 3500);
}

// --- GAME LOGIC: GENERATE LEVEL ---
function startNewLevel() {
    clearInterval(gameState.timerInterval);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    equationInput.value = '';
    feedbackMessage.className = 'message';
    feedbackMessage.textContent = 'ระบุสมการของคุณแล้วกดปุ่มด้านบนได้! ท่านหนึ่งในใต้หล้า...';
    
    document.getElementById('scoreBoard').textContent = gameState.score;
    const questBox = document.getElementById('questBox');

    if (gameState.currentMode === 'test_slope') {
        const isParabola = Math.random() > 0.5; // โอกาส 50/50 ระหว่างเส้นตรงกับพาราโบลา
        
        if (!isParabola) {
            // --- โหมดเส้นตรง (จำนวนเต็ม) ---
            // สุ่ม m ระหว่าง -3 ถึง 3 (ที่ไม่ใช่ 0)
            let m = 0;
            while (m === 0) {
                m = Math.floor(Math.random() * 7) - 3; 
            }
            // สุ่ม c ระหว่าง -4 ถึง 4
            const c = Math.floor(Math.random() * 9) - 4; 
            
            gameState.target = { type: 'linear', m: m, c: c };
            gameState.hint = `คำใบ้: สมการเส้นตรงข้อนี้คือ y = ${m}x + (${c})`;
            questBox.innerHTML = `<strong>โจทย์ (Linear):</strong> พิมพ์สมการเส้นตรงให้ทับเส้นเป้าหมายสีน้ำเงินพาดจอ!`;
        } else {
            // --- โหมดพาราโบลา (จำนวนเต็ม) ---
            // สุ่ม a เป็นได้แค่ 1 (หงาย) หรือ -1 (คว่ำ) เพื่อให้พิมพ์ง่าย ไม่ซับซ้อน
            const a = Math.random() > 0.5 ? 1 : -1;
            // สุ่มจุดยอด (h, k) เป็นจำนวนเต็มในช่วง -3 ถึง 3
            const h = Math.floor(Math.random() * 7) - 3; 
            const k = Math.floor(Math.random() * 7) - 3; 
            
            gameState.target = { type: 'parabola', a: a, h: h, k: k };
            
            // แสดงคำใบ้แกะสูตรให้อ่านง่ายขึ้น
            const aSign = a === 1 ? "" : "-";
            gameState.hint = `คำใบ้: รูปแบบจุดยอดคือ y = $({aSign}(x - ${h})**2) + ${k}`;
            questBox.innerHTML = `<strong>โจทย์ (Parabola):</strong> วาดกราฟเส้นโค้งให้ทับเส้นเป้าหมายสีน้ำเงินให้ได้`;
        }
    } 
    else if (gameState.currentMode === 'solve_intersection') {
        // ปรับจุดเป้าหมายให้เป็นจำนวนเต็มด้วย เพื่อการเล็งที่แม่นยำขึ้น
        const targetX = Math.floor(Math.random() * 21) - 10; // -10 ถึง 10
        const targetY = Math.floor(Math.random() * 13) - 6;  // -6 ถึง 6
        gameState.target = { type: 'point', x: targetX, y: targetY };
        gameState.hint = `คำใบ้: จุดเป้าหมายอยู่ที่พิกัด (${targetX}, ${targetY})`;
        questBox.innerHTML = `<strong>โจทย์:</strong> วาดกราฟอะไรก็ได้ให้วิ่งไป 💥 <strong>ชนจุดวงกลมสีทอง</strong> บนหน้าจอ!`;
    } 
    else {
        gameState.target = null;
        gameState.hint = `💡 สูตรน่าลอง: <br>
                          • กราฟโค้ง: <code>x ** 2</code> หรือ <code>-(x ** 2) + 4</code><br>
                          • กราฟคลื่น: <code>Math.sin(x) * 2</code><br>
                          • กำลังสองสมบูรณ์: <code>(x + 3) * (x - 1)</code><br>
                          • กราฟเศษส่วน: <code>1 / x</code> หรือ <code>1 / (x-2)</code><br>
                          • กรารากที่สอง: <code>sqrt(x)</code> หรือ <code>x ** (1/2)</code><br>
                          • กราฟค่าสัมบูรณ์: <code>abs(x)</code>`;
        
        questBox.innerHTML = `<strong>วิธีเล่นโหมดอิสระ:</strong> พิมพ์สมการคณิตศาสตร์อะไรก็ได้เพื่อดูรูปทรงของเส้นกราฟได้อย่างอิสระ ไม่มีถูกผิด!`;
        equationInput.placeholder = "เช่น x - 3 หรือ x ** 2";
        feedbackMessage.innerHTML = gameState.hint;
    }
    
    drawAxes();
    startTimer(); 
}

// --- ENGINE: MATH PARSER ---
function cleanAndParseEquation(inputStr) {
    let str = inputStr.toLowerCase().trim();
    str = str.replace(/y\s*=\s*/g, '');
    str = str.replace(/(\d+)([a-z\(])/g, '$1*$2');
    str = str.replace(/([x\d\)]+)\s*\^\s*(\d+)/g, 'Math.pow($1,$2)');
    
    const mathFunctions = ['sin', 'cos', 'tan', 'abs', 'sqrt', 'pow', 'PI', 'E'];
    mathFunctions.forEach(func => {
        const regex = new RegExp(`\\b${func}\\b`, 'g');
        str = str.replace(regex, `Math.${func}`);
    });
    
    return str;
}

// --- CORE DRAWING ---
function drawGrid() {
    ctx.strokeStyle = '#73c2ff'; 
    ctx.lineWidth = 0.5;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    for (let x = centerX; x < WIDTH; x += SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }
    for (let x = centerX - SCALE_FACTOR; x > 0; x -= SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }
    for (let y = centerY; y < HEIGHT; y += SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }
    for (let y = centerY - SCALE_FACTOR; y > 0; y -= SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }
}

function drawAxes() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawGrid();

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, HEIGHT / 2); ctx.lineTo(WIDTH, HEIGHT / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(WIDTH / 2, 0); ctx.lineTo(WIDTH / 2, HEIGHT); ctx.stroke();
    
    ctx.fillStyle = '#555555'; 
    ctx.font = '11px Arial';
    ctx.textBaseline = 'top';
    
    let unitCount = 1;
    for (let x = (WIDTH / 2) + SCALE_FACTOR; x < WIDTH; x += SCALE_FACTOR) {
        ctx.textAlign = 'center'; ctx.fillText(unitCount, x, (HEIGHT / 2) + 6); unitCount++;
    }
    unitCount = -1;
    for (let x = (WIDTH / 2) - SCALE_FACTOR; x > 0; x -= SCALE_FACTOR) {
        ctx.textAlign = 'center'; ctx.fillText(unitCount, x, (HEIGHT / 2) + 6); unitCount--;
    }

    ctx.textAlign = 'right';
    unitCount = 1;
    for (let y = (HEIGHT / 2) - SCALE_FACTOR; y > 0; y -= SCALE_FACTOR) {
        ctx.fillText(unitCount, (WIDTH / 2) - 6, y - 5); unitCount++;
    }
    unitCount = -1;
    for (let y = (HEIGHT / 2) + SCALE_FACTOR; y < HEIGHT; y += SCALE_FACTOR) {
        ctx.fillText(unitCount, (WIDTH / 2) - 6, y - 5); unitCount--;
    }

    if (gameState.target) {
        if (gameState.target.type === 'linear') {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            const xS = -WIDTH/2/SCALE_FACTOR;
            const xE = WIDTH/2/SCALE_FACTOR;
            ctx.moveTo(toScreenX(xS), toScreenY(gameState.target.m * xS + gameState.target.c));
            ctx.lineTo(toScreenX(xE), toScreenY(gameState.target.m * xE + gameState.target.c));
            ctx.stroke();
        } 
        else if (gameState.target.type === 'parabola') {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            const xStart = -WIDTH/2/SCALE_FACTOR;
            const xEnd = WIDTH/2/SCALE_FACTOR;
            const steps = 200;
            for (let i = 0; i <= steps; i++) {
                const x = xStart + (i / steps) * (xEnd - xStart);
                const y = gameState.target.a * Math.pow(x - gameState.target.h, 2) + gameState.target.k;
                if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
                else ctx.lineTo(toScreenX(x), toScreenY(y));
            }
            ctx.stroke();
        }
        else if (gameState.target.type === 'point') {
            ctx.fillStyle = '#f1c40f'; ctx.strokeStyle = '#d35400'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(toScreenX(gameState.target.x), toScreenY(gameState.target.y), 8, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }
    }
}

function calculatePoints(parsedStr) {
    const points = [];
    const numSteps = 300;
    const xStart = -(WIDTH / 2) / SCALE_FACTOR;
    const xEnd = (WIDTH / 2) / SCALE_FACTOR;

    for (let i = 0; i <= numSteps; i++) {
        const x = xStart + (i / numSteps) * (xEnd - xStart);
        try {
            const y = new Function('x', `return ${parsedStr}`)(x);
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x: x, y: y });
            }
        } catch (e) { return null; }
    }
    return points;
}

// --- SUBMIT & VALIDATION ---
function handleUserSubmit() {
    const rawInput = equationInput.value;
    if (!rawInput) {
        feedbackMessage.textContent = "⚠️ พิมพ์สมการก่อนสิครับ!";
        return;
    }

    const parsedEquation = cleanAndParseEquation(rawInput);
    const userPoints = calculatePoints(parsedEquation);

    if (!userPoints || userPoints.length === 0) {
        feedbackMessage.className = "message";
        feedbackMessage.style.color = "#c0392b";
        feedbackMessage.textContent = "❌ ไวยากรณ์สมการผิดพลาด! ลองพิมพ์แบบง่ายๆ เช่น 2*x + 1 หรือ sin(x)";
        return;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawAxes();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toScreenX(userPoints[0].x), toScreenY(userPoints[0].y));
    for (let i = 1; i < userPoints.length; i++) {
        ctx.lineTo(toScreenX(userPoints[i].x), toScreenY(userPoints[i].y));
    }
    ctx.stroke();

    checkWinCondition(userPoints);
}

function checkWinCondition(userPoints) {
    if (!gameState.target) {
        feedbackMessage.textContent = "✅ วาดกราฟสำเร็จในโหมดอิสระ!";
        return;
    }

    let isWin = false;

    if (gameState.target.type === 'linear') {
        const checkX = [-2, 0, 2];
        isWin = checkX.every(x => {
            try {
                const parsedEquation = cleanAndParseEquation(equationInput.value);
                const userY = new Function('x', `return ${parsedEquation}`)(x);
                const targetY = gameState.target.m * x + gameState.target.c;
                return Math.abs(userY - targetY) < 0.2; 
            } catch (e) { return false; }
        });
    } 
    else if (gameState.target.type === 'parabola') {
        const checkX = [gameState.target.h - 1, gameState.target.h, gameState.target.h + 1];
        isWin = checkX.every(x => {
            try {
                const parsedEquation = cleanAndParseEquation(equationInput.value);
                const userY = new Function('x', `return ${parsedEquation}`)(x);
                const targetY = gameState.target.a * Math.pow(x - gameState.target.h, 2) + gameState.target.k;
                return Math.abs(userY - targetY) < 0.25;
            } catch (e) { return false; }
        });
    }
    else if (gameState.target.type === 'point') {
        isWin = userPoints.some(p => {
            const distance = Math.sqrt(Math.pow(p.x - gameState.target.x, 2) + Math.pow(p.y - gameState.target.y, 2));
            return distance < 0.25; 
        });
    }

    if (isWin) {
        clearInterval(gameState.timerInterval);

        const speedBonus = Math.round(gameState.timeLeft * 0.5);
        const finalTurnScore = 10 + speedBonus;
        
        gameState.score += finalTurnScore;
        document.getElementById('scoreBoard').textContent = gameState.score;
        
        feedbackMessage.innerHTML = `🎉 <strong>ยอดเยี่ยมตอบถูกในเวลา!</strong> (+${finalTurnScore} คะแนน โดยเป็นโบนัสความเร็ว +${speedBonus})`;
        feedbackMessage.style.color = "#27ad60";
        
        setTimeout(() => startNewLevel(), 2500);
    } else {
        feedbackMessage.innerHTML = `❌ ยังไม่โดนเป้าหมายนะ! พยายามเข้า (เหลือเวลา ${gameState.timeLeft} วิ) <br><small style="color:#7f8c8d">${gameState.hint}</small>`;
        feedbackMessage.style.color = "#c0392b";
    }
}
