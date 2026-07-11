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
    hint: ''
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
    
    // เพิ่มการแสดงคะแนนและโจทย์
    const gameDisplay = document.createElement('div');
    gameDisplay.innerHTML = `
        <div style="background: #eef2f7; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 5px solid #3498db;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>🎯 คะแนน: <span id="scoreBoard">0</span></span>
                <button id="nextLevelBtn" style="padding:4px 10px; font-size:12px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">ข้าม/สุ่มด่านใหม่</button>
            </div>
            <div id="questBox" style="margin-top: 8px; font-size: 14px; color: #2c3e50;"></div>
        </div>
    `;
    panel.insertBefore(gameDisplay, equationInput.previousElementSibling);
    
    document.getElementById('nextLevelBtn').addEventListener('click', () => startNewLevel());
}

// --- GAME LOGIC: GENERATE LEVEL ---
function startNewLevel() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    equationInput.value = '';
    feedbackMessage.className = 'message';
    feedbackMessage.textContent = 'ระบุสมการของคุณแล้วกดปุ่มด้านบนได้เลย!';
    
    document.getElementById('scoreBoard').textContent = gameState.score;
    const questBox = document.getElementById('questBox');

    if (gameState.currentMode === 'test_slope') {
        // โหมดเส้นตรง: สุ่มความชัน (m) และจุดตัดแกน Y (c) -> y = mx + c
        const m = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1); // 1 ถึง 3
        const c = Math.floor(Math.random() * 5) - 2; // -2 ถึง 2
        gameState.target = { type: 'linear', m: m, c: c };
        gameState.hint = `คำใบ้: ลองปรับสมการให้อยู่ในรูป y = ${m}x + (${c})`;
        questBox.innerHTML = `<strong>โจทย์:</strong> พิมพ์สมการเลียนแบบเส้นสีน้ำเงินเป้าหมายให้ทับกันสนิท!`;
    } 
    else if (gameState.currentMode === 'solve_intersection') {
        // โหมดหาจุดตัด: สุ่มจุดกลมๆ แดงทองขึ้นมาบนจอ ให้คนเขียนกราฟวิ่งไปชน
        const targetX = (Math.random() * 12 - 6).toFixed(1); // ช่วง -6 ถึง 6
        const targetY = (Math.random() * 8 - 4).toFixed(1);  // ช่วง -4 ถึง 4
        gameState.target = { type: 'point', x: parseFloat(targetX), y: parseFloat(targetY) };
        gameState.hint = `คำใบ้: จุดอยู่ที่ (${targetX}, ${targetY}) ลองใช้สมการเส้นตรงง่ายๆ หรือพาราโบลาพุ่งไปหาดูสิ`;
        questBox.innerHTML = `<strong>โจทย์:</strong> วาดกราฟอะไรก็ได้ให้วิ่งไป 💥 <strong>ชนจุดวงกลมสีทอง</strong> บนหน้าจอ!`;
    } 
    else {
        // [อัปเดต] โหมดอิสระ (Pure Visualization)
        gameState.target = null;
        gameState.hint = `💡 สูตรน่าลอง: <br>
                          • กราฟหงาย/คว่ำ: <code>x^2</code> หรือ <code>-x^2 + 4</code><br>
                          • กราฟคลื่น: <code>sin(x) * 2</code><br>
                          • กราฟตัว V: <code>abs(x)</code>`;
        
        questBox.innerHTML = `<strong>วิธีเล่นโหมดอิสระ:</strong> พิมพ์สมการคณิตศาสตร์อะไรก็ได้เพื่อดูรูปทรงของเส้นกราฟได้อย่างอิสระ ไม่มีถูกผิด!`;
        equationInput.placeholder = "เช่น x^2 - 3 หรือ sin(x) * 2";
        
        // แสดงคำแนะนำสูตรน่าลองในกล่องข้อความด้านล่างทันที
        feedbackMessage.innerHTML = gameState.hint;
    }
    
    drawAxes();
}

// --- ENGINE: MATH PARSER ---
function cleanAndParseEquation(inputStr) {
    let str = inputStr.toLowerCase().trim();
    
    // 1. ถอนคำว่า "y =" ออกถ้าผู้ใช้พิมพ์มา
    str = str.replace(/y\s*=\s*/g, '');
    
    // 2. เติมเครื่องหมายคูณอัตโนมัติ เช่น 2x -> 2*x หรือ 3sin -> 3*sin
    str = str.replace(/(\d+)([a-z\(])/g, '$1*$2');
    
    // 3. เปลี่ยนเครื่องหมายยกกำลัง x^2 -> Math.pow(x,2) หรือ x^3 -> Math.pow(x,3)
    str = str.replace(/([x\d\)]+)\s*\^\s*(\d+)/g, 'Math.pow($1,$2)');
    
    // 4. แปลงฟังก์ชันคณิตศาสตร์ยอดฮิตให้เป็น Math.xxx ของ JS
    const mathFunctions = ['sin', 'cos', 'tan', 'abs', 'sqrt', 'pow', 'PI', 'E'];
    mathFunctions.forEach(func => {
        const regex = new RegExp(`\\b${func}\\b`, 'g');
        if (func === 'PI' || func === 'E') {
            str = str.replace(regex, `Math.${func}`);
        } else {
            str = str.replace(regex, `Math.${func}`);
        }
    });
    
    return str;
}

// --- CORE DRAWING ---
function drawGrid() {
    ctx.strokeStyle = '#eef2f5';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < WIDTH; x += SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += SCALE_FACTOR) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }
}

function drawAxes() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // 1. วาดเส้นตารางจางๆ (Grid Lines) เป็นฉากหลังก่อน
    drawGrid();

    // 2. วาดเส้นแกนหลัก X และ Y
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;

    // แกน X
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2);
    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();

    // แกน Y
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    
    // 3. วาดตัวเลขกำกับบนเส้นแกน (Axis Labels)
    ctx.fillStyle = '#555555'; // สีตัวเลข
    ctx.font = '11px Arial';
    ctx.textBaseline = 'top';
    
    // วาดตัวเลขบนแกน X (วิ่งไปทางซ้ายและขวาจากจุดศูนย์กลาง)
    // ฝั่งขวา (บวก)
    let unitCount = 1;
    for (let x = (WIDTH / 2) + SCALE_FACTOR; x < WIDTH; x += SCALE_FACTOR) {
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#333333';
        ctx.beginPath(); ctx.moveTo(x, (HEIGHT / 2) - 3); ctx.lineTo(x, (HEIGHT / 2) + 3); ctx.stroke();
        ctx.fillText(unitCount, x, (HEIGHT / 2) + 6);
        unitCount++;
    }
    // ฝั่งซ้าย (ลบ)
    unitCount = -1;
    for (let x = (WIDTH / 2) - SCALE_FACTOR; x > 0; x -= SCALE_FACTOR) {
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#333333';
        ctx.beginPath(); ctx.moveTo(x, (HEIGHT / 2) - 3); ctx.lineTo(x, (HEIGHT / 2) + 3); ctx.stroke();
        ctx.fillText(unitCount, x, (HEIGHT / 2) + 6);
        unitCount--;
    }

    // วาดตัวเลขบนแกน Y (วิ่งขึ้นบนและลงล่างจากจุดศูนย์กลาง)
    ctx.textAlign = 'right';
    // ฝั่งบน (บวก)
    unitCount = 1;
    for (let y = (HEIGHT / 2) - SCALE_FACTOR; y > 0; y -= SCALE_FACTOR) {
        ctx.strokeStyle = '#333333';
        ctx.beginPath(); ctx.moveTo((WIDTH / 2) - 3, y); ctx.lineTo((WIDTH / 2) + 3, y); ctx.stroke();
        ctx.fillText(unitCount, (WIDTH / 2) - 6, y - 5);
        unitCount++;
    }
    // ฝั่งล่าง (ลบ)
    unitCount = -1;
    for (let y = (HEIGHT / 2) + SCALE_FACTOR; y < HEIGHT; y += SCALE_FACTOR) {
        ctx.strokeStyle = '#333333';
        ctx.beginPath(); ctx.moveTo((WIDTH / 2) - 3, y); ctx.lineTo((WIDTH / 2) + 3, y); ctx.stroke();
        ctx.fillText(unitCount, (WIDTH / 2) - 6, y - 5);
        unitCount--;
    }

    // ถ้านำเป้าหมายโหมดเกมขึ้นมาแสดง
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
        else if (gameState.target.type === 'point') {
            ctx.fillStyle = '#f1c40f';
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(toScreenX(gameState.target.x), toScreenY(gameState.target.y), 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
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
        } catch (e) {
            return null; 
        }
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

    ctx.strokeStyle = '#e74c3c';
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
    else if (gameState.target.type === 'point') {
        isWin = userPoints.some(p => {
            const distance = Math.sqrt(Math.pow(p.x - gameState.target.x, 2) + Math.pow(p.y - gameState.target.y, 2));
            return distance < 0.25; 
        });
    }

    if (isWin) {
        gameState.score += 10;
        document.getElementById('scoreBoard').textContent = gameState.score;
        feedbackMessage.innerHTML = "🎉 <strong>ถูกต้องลุยด่านต่อไปได้!</strong> (+10 คะแนน)";
        feedbackMessage.style.color = "#27ad60";
        
        setTimeout(() => startNewLevel(), 2000);
    } else {
        feedbackMessage.innerHTML = `❌ ยังไม่โดนเป้าหมายนะ! พยายามเข้า <br><small style="color:#7f8c8d">${gameState.hint}</small>`;
        feedbackMessage.style.color = "#c0392b";
    }
}