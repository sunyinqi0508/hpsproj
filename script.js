var keys = {37: 1, 38: 1, 39: 1, 40: 1};
function preventDefault(e) {
    e.preventDefault();
}
function preventDefaultForScrollKeys(e) {
    if (keys[e.keyCode]) {
        preventDefault(e);
        return false;
    }
}
var supportsPassive = false;
try {
    window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
        get: function () { supportsPassive = true; } 
    }));
} catch(e) {}
var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
var scroll_disabled;
function disableScroll() {
    window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
    window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
    window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
    window.addEventListener('keydown', preventDefaultForScrollKeys, false);
    scroll_disabled = true;
    document.getElementById("scr").style.backgroundColor='#E10150';
}
function enableScroll() {
    window.removeEventListener('DOMMouseScroll', preventDefault, false);
    window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
    window.removeEventListener('touchmove', preventDefault, wheelOpt);
    window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
    scroll_disabled = false;
    document.getElementById("scr").style.backgroundColor='#7DC97B';

}
function scrCtrl(){
    scroll_disabled?enableScroll():disableScroll();
}
function ctrlModeChanged(){
    if(inGame)
        if(gameMode == GameMode.MULTI)
            if(document.getElementById("single").checked) {
                players[1].kb_del1 = 'KeyD';
                players[1].kb_del2 = 'KeyX';
                players[1].kb_switch='KeyZ';
                players[1].kb_zoomout = 'Digit1';
                players[1].kb_zoomin = 'Digit2';
            }
            else{
                players[1].kb_del1 = 'KeyK';
                players[1].kb_del2 = 'Comma';
                players[1].kb_switch='Period';
                players[1].kb_zoomout = 'Minus';
                players[1].kb_zoomoin = 'Equal';
            }
        else {
            if(gameMode == GameMode.SINGLE){
                players[1].kb_del1 = 'KeyD';
                players[1].kb_del2 = 'KeyX';
            }
            else{
                players[1].kb_del1 = '';
                players[1].kb_del2 = '';
            }
            players[1].kb_switch='';
            players[1].kb_zoomout = '';
            players[1].kb_zoomoin = '';
        }
}
let hasLastState = false;
let lastState = [];
function resume(){
    let thisState = cursor.pos.slice();
    if (hasLastState){
        cursor.get(lastState);
    }
    else{
        cursor.get([cursor.id == -1?gameWidth:0 + gameWidth/2, gameHeight/2])
    }
    lastState = thisState;
    hasLastState = true;
    
}
class Wall{
    constructor(pos = [0,0], len = 0, ty = 0, id = 0, player = undefined){
        this.pos = pos;
        this.len = len;
        this.ty = ty;
        this.id = id;
        this.player = player;
        this.in = false;
        this.disabled = false;
    }
    copy(id = -3){
        return new Wall(this.pos.slice(), this.len, this.ty, id, this.player);
    }
    get(pos){
        this.pos = pos.slice();
    }
}
class Player {
    constructor(lr, walls, materials, name = ''){
        this.name = name;
        this.lr = lr;
        this.score = 0;
        this.cd_delete = NaN;
        this.delete = false;
        this.cd_add = 0;
        this.walls = walls;
        this.materials = materials;
        this.kb_del1 = 'KeyD';
        this.kb_del2 = 'KeyX';
        this.kb_switch='KeyZ';
        this.kb_zoomin = 'Minus';
        this.kb_zoomout = 'Equal';
        this.kb_resume = 'KeyF';
        this.zoomin_hold = false;
        this.zoomout_hold = false;
        this.pause_avail = false;
    }
}
const GameMode = {
    SINGLE: 'SINGLE',
    VSAI: 'VSAI',
    MULTI: 'MULTI',
    MULTIONLINE: 'MULTIONLINE' // reserved.
};
let cursors = [],
    cursor;
let wallsL = [], wallsR = [], boundaries = [];
let players = [];
let gameWidth = 700, gameHeight = 200;
let maxWallLen = 80, minWallLen = 10;
let deletion = false;
let CD_del = 10;
let CD_add = 2;
let pause_left = 0;
let time = 0;
let vBall = 15;
let pBall = [0, 0];
let dBall = [1,1];
let Tmax = 0;
let sDecay = 0, decay = [0,0], decayStart;
let directions = [[1, 1], [1, -1], [-1, -1], [-1, 1]]; 
let gameMode = GameMode.SINGLE;
let TH = 8;
let msgctrl, timectrl, statectrl, button;
let sc, total_score = 0;
let pause = false;
function clamp(x, a, b=Infinity){
    return x < a? a: (x > b? b:x);
}
function plus(a, b, c = 1){
    let length = Math.min(a.length, b.length);
    for (let i = 0; i < length; ++i){
        a[i] += b[i] * c;
    }
}
function plusneq(a, b, c = 1){
    let length = Math.min(a.length, b.length);
    let ret = Array(length);
    for (let i = 0; i < length; ++i){
        ret[i] = a[i] + b[i] * c;
    }
    return ret;
}
function minus(a, b){
    return [a[0] - b[0], a[1] - b[1]];
}
function getLen(a){
    return Math.sqrt(a[0]*a[0] + a[1]*a[1]);
}
function trim(a){
    for (let i = 0; i < a.length; ++i)
    {
        a[i] = parseFloat(a[i].toFixed(7));
    }
}
function sortDSC(l, r) {
    return l - r;
}
function colorDiff(c1, c2){
    var num = parseInt(c1.slice(1), 16), num2 = parseInt(c2.slice(1), 16);
    var res = [];
    for (let i = 0; i < 3; ++i){
        res[i] = (num2&0xff) - (num&0xff);
        num >>= 8;
        num2>>= 8;
    }
    return res;
}
function adjustColor(c, per,fx = (v)=>v) {
    var usePound = false;
    if (c[0] == "#") {
        c = c.slice(1);
        usePound = true;
    }
    var num = parseInt(c, 16);
    var res = 0;
    for (let i = 0; i < 3; ++i){
        res += clamp(parseInt(fx(((num & 0xFF) + per)/255.)*255.),0,255)<<(i<<3);
        num >>= 8;
    }
    let str = res.toString(16);
    return (usePound ? "#" : "") + '0'.repeat(6-str.length)+str;
}
 
function setup() {
    canvas = createCanvas(gameWidth, gameHeight);
    statectrl = document.getElementById('state');
    msgctrl = document.getElementById('msg');
    timectrl = document.getElementById('time');
    canvas.parent('game-container');
    let checkCursorChanged = (e) =>{
        if(gameMode == GameMode.VSAI){
            cursor.disabled = !players[0].delete && e.offsetX>=gameWidth/2; 
        }
        else{
            const oldid = cursor.id;
            cursor = cursors[e.offsetX<=gameWidth/2?0:1];
            if (oldid != cursor.id){
                hasLastState = false;
                cursor.player.zoomin_hold = false;
                cursor.player.zoomout_hold = false;
                cursor.player.other.pause_avail = true; 
            }
        }
    }
    canvas.canvas.addEventListener('mousemove', (e)=>{
        if (inGame && !gameEnded){
            cursors[0].in = cursors[1].in = true;
            if(!cursor.player.delete){
                checkCursorChanged(e);
                statectrl.innerHTML = cursor.player.name + " Adding Wall.";
            }
            else
                statectrl.innerHTML = cursor.player.name + " Removing Wall";
            statectrl.style.color = cursor.player.color;
            cursor.pos[0] = e.offsetX;
            cursor.pos[1] = e.offsetY;
        }
    });
    canvas.canvas.addEventListener('mouseout', (e)=>{
        if (inGame && !gameEnded){
            cursors[0].in = cursors[1].in = false;
        }
    });
    canvas.canvas.addEventListener('wheel', (e)=>{
        if(inGame && !gameEnded){
            cursor.len = clamp(cursor.len + Math.sign(e.deltaY), minWallLen, maxWallLen);
        }
    });
    canvas.canvas.addEventListener("click", (e) => {
        if(inGame && !gameEnded){
            if (pause){
                pBall[0] = e.offsetX;
                pBall[1] = e.offsetY;
                return;
            }
            if(cursor.player.delete){
                if (hitTest(gameMode == GameMode.SINGLE? 3:cursor.id+3, cursor.pos, true))
                {
                    let have_walls_left = cursor.player.other.walls.length;
                    cursor.player.cd_delete = have_walls_left ? CD_del:NaN;
                    cursor.player.cdrmlabel.style.color = "#ff0000";
                    cursor.player.cdrmlabel.innerHTML = have_walls_left ? '' + CD_del+'s Left.':'Wait for Walls';
                    checkCursorChanged(e);
                }
            }
            else if(!cursor.disabled && cursor.player.cd_add<=0 && cursor.player.materials >= cursor.len){
                cursor.player.materials -= cursor.len;
                cursor.player.materiallabel.style.width = '' + (100*cursor.player.materials/totalMaterials) + '%';
                let walls = (cursor.id == -1)?
                    wallsL:wallsR;
                walls.push(cursor.copy(walls.length));
                if(isNaN(players[cursor.id + 2].cd_delete))
                {
                    players[cursor.id + 2].cd_delete = CD_del;
                }
                cursor.player.cd_add = CD_add;
                cursor.player.cdaddlabel.style.color='#ff0000'
                cursor.player.cdaddlabel.innerHTML=''+CD_add+'s Left.';
            }

        }
    });
    window.addEventListener("keydown", (e) =>{
        if(inGame){
            const p = cursor.player;
            if(e.code ==p.kb_zoomin)
                p.zoomin_hold = true;
            else if (e.code == p.kb_zoomout)
                p.zoomout_hold = true;
        }
    });
    window.addEventListener("keyup", (e) =>{
        if(inGame){
            const p = cursor.player;
            if(e.code ==p.kb_zoomin)
                p.zoomin_hold = false;
            else if (e.code == p.kb_zoomout)
                p.zoomout_hold = false;
        }
    });
    setInterval(() => {
        if(inGame){
            const p = cursor.player;

            if(p.zoomin_hold)
                cursor.len = clamp(cursor.len + 1, minWallLen, maxWallLen);
            if(p.zoomout_hold)
                cursor.len = clamp(cursor.len - 1, minWallLen, maxWallLen);
        }
    }, 20);
    window.addEventListener("keypress", (e)=>{
        if(inGame && !gameEnded){
            const p = cursor.player;
            if (e.code == p.kb_del1||e.code == p.kb_del2)
                if(p.cd_delete <= 0)
                    p.delete = !p.delete;
                else
                    p.delete = false;
            else if (e.code == p.kb_switch)
                cursor.ty = 1 - cursor.ty;
            else if (p.other.pause_avail && e.code == 'KeyT')
            {
                pause_left = 2;
                p.other.pause_avail = false;
            }
            // else if (e.p.other.kb_resume)
            //     resume();
        }
        if (e.code == 'KeyO')
            scrCtrl();
        else if (false && e.code == 'KeyP') // For debugging.
        {
            pause = !pause;
            if(pause){
                vBall = getAttribf('game-speed');
            }
            else{
                document.getElementById('game-speed').readOnly = false;
            }
        }
        if(pause){
            if(e.code == 'Digit1')
                dBall = directions[0];
            else if(e.code == 'Digit2')
                dBall = directions[1];
            else if(e.code == 'Digit3')
                dBall = directions[2];
            else if(e.code == 'Digit4')
                dBall = directions[3];
            else 
                return;
            pause = false;
        }
    }, true);

}

var canvas;
var inGame = false;
var gameEnded = true;
var message = '';
var player1 = '1';
var player2 = '2';
var totalMaterials = 900;
let startTime = 0;
function draw() {
    background(255);
    fill(255);
    if(inGame) {
        drawAssets();
        drawCursor();
        if(!gameEnded)
            tick();
    }
}
function getAttrib(str){
    let ele = document.getElementById(str);
    ele.readOnly = true;
    return parseInt(document.getElementById(str).value);
}
function getAttribf(str){
    let ele = document.getElementById(str);
    ele.readOnly = true;
    return parseFloat(document.getElementById(str).value);
}
function endGame(){
    gameEnded = true;
    if(scroll_disabled) enableScroll();
    let button = document.getElementById("start");
    button.innerHTML = "Start Multi";
    button.onclick = startGame;
    document.getElementById("width-of-board").readOnly = false;    
    document.getElementById("height-of-board").readOnly = false;
    document.getElementById("total-materials").readOnly = false;
    document.getElementById("cd-add").readOnly = false;
    document.getElementById("cd-del").readOnly = false;
    document.getElementById("max-wall-len").readOnly = false; 
    document.getElementById("min-wall-len").readOnly = false;
    document.getElementById("game-speed").readOnly = false; 
    document.getElementById("tmax").readOnly = false; 
    cursors[0].in = cursors[1].in = false;
    document.getElementById("single").disabled = false;
    document.getElementById("multi").disabled = false;

    enableScroll();
}
function initGame(){
    statectrl.innerHTML = 'Game Started.';
    gameWidth = getAttrib("width-of-board");    
    gameHeight = getAttrib("height-of-board");
    totalMaterials = getAttrib("total-materials");
    CD_add = getAttribf("cd-add");
    CD_del = getAttribf("cd-del");
    maxWallLen = getAttrib("max-wall-len"); 
    minWallLen = getAttrib("min-wall-len");
    //sDecay = getAttribf("sdecay");
    vBall = getAttribf("game-speed"); 
    Tmax = getAttrib("tmax"); 
    button = document.getElementById("start");
    button.innerHTML = "End Game";
    button.onclick = endGame;
    
    wallsL = []; wallsR = [];
    canvas.resize(gameWidth, gameHeight);   
    pBall[0] = gameWidth/2;
    pBall[1] = gameHeight/2;
    dBall = directions[Math.floor(Math.random()*4)].slice();
    players[0] = new Player(0, wallsL, totalMaterials, player1);
    players[0].scorelabel = document.getElementById("p1-score");
    players[0].cdaddlabel = document.getElementById("p1-cdadd");
    players[0].cdrmlabel = document.getElementById("p1-cdrm");
    players[0].materiallabel = document.getElementById("p1ml");
    players[0].materiallabel.style.width = '100%';
    players[0].scorelabel.innerHTML = ""+0;
    players[0].color = document.getElementById('p1-color').value;//'#99D6D3';
    players[0].materiallabel.style.backgroundColor = players[0].color;

    document.getElementById("p1-name").innerHTML = player1;
    
    players[1] = new Player(1, wallsR, totalMaterials, player2);
    players[1].scorelabel = document.getElementById("p2-score");
    players[1].cdaddlabel = document.getElementById("p2-cdadd");
    players[1].cdrmlabel = document.getElementById("p2-cdrm");
    players[1].materiallabel = document.getElementById("p2ml");
    players[1].materiallabel.style.width = '100%';
    players[1].kb_resume = 'KeyJ';
    players[1].scorelabel.innerHTML = ""+0;
    players[1].color = document.getElementById('p2-color').value;
    players[1].materiallabel.style.backgroundColor = players[1].color;
    players[1].lighten_color = adjustColor(players[0].color, 40, (x)=>Math.pow(x,0.2));
    players[0].lighten_color = adjustColor(players[1].color, 40, (x)=>Math.pow(x, 0.2));
    players[1].other = players[0];
    players[0].other = players[1];

    document.getElementById("p2-name").innerHTML = player2;
    decay = [0, 0];
    cursors = [new Wall([0,0], 25, 1, -1, players[0]), new Wall([0,0], 25, 1, -2, players[1])];
    cursor = cursors[0];
    startTime = time = Date.now();
    inGame = true;
    gameEnded = false;
    disableScroll();
    ctrlModeChanged();
    document.getElementById("sc1").hidden = false;
    document.getElementById("sc2").hidden = false;
    document.getElementById("sc").hidden = true;
}
function startSingle() {
    player1 = 'Left'; 
    player2 = 'Right'; 
    gameMode = GameMode.SINGLE;
    document.getElementById("single").checked = true;
    let multi = document.getElementById("multi");
    multi.disabled = true;
    multi.checked = false;
    initGame();
    document.getElementById("sc1").hidden = true;
    document.getElementById("sc2").hidden = true;
    document.getElementById("sc").hidden = false;
    sc = document.getElementById("total-score");
    sc.innerHTML = "0.0";
    total_score = 0;
}
function startGame() {
    player1 = document.getElementById("player-1").value;
    player2 = document.getElementById("player-2").value;
    player1 = (player1 == ''? "Player 1": player1); 
    player2 = (player2 == ''? "Player 2": player2); 
    gameMode = GameMode.MULTI;
    initGame();
}
function startAI(){
    player1 = document.getElementById("player-1").value;
    player1 = (player1 == ''? "Player 1": player1); 
    player2 = 'A.I.'
    gameMode = GameMode.VSAI;
    document.getElementById("single").checked = true;
    let multi = document.getElementById("multi");
    multi.disabled = true;
    multi.checked = false;
    initGame();
    cursor.disabled = true;
}
function startMulti(){
    //Online Multiplayer Game;
    //TODO: construct server info.
    player1 = document.getElementById("player-1").value;
    player2 = 'TODO: get P2 game online';
    player1 = (player1 == ''? "Player 1": player1); 
    player2 = (player2 == ''? "Player 2": player2); 
    gameMode = GameMode.MULTIONLINE;
    initGame();
}
function bounce(delta){
    let olddelta = delta;
    let mindist = Infinity;
    let startingPoint = [0, 0];
    let newDirection = undefined;
    let end = plusneq(pBall, dBall, vBall*delta);
    let range = [[end[0], pBall[0]].sort(sortDSC),[end[1], pBall[1]].sort(sortDSC)];
    wallsL.concat(wallsR).forEach((w) => {
        let the_other_axis = 1-w.ty;
        if (w.pos[the_other_axis]>=range[the_other_axis][0] -1e-9&& w.pos[the_other_axis] <=range[the_other_axis][1]+1e-9){
            let dist = Math.abs(pBall[the_other_axis] - w.pos[the_other_axis])/vBall;
            let p = pBall[w.ty] + dist * dBall[w.ty];
            if(p >= w.pos[w.ty]-w.len/2 - 1e-9 && p <= w.pos[w.ty] + w.len/2 + 1e-9){
                if (mindist > dist)
                {
                    mindist = dist; 
                    startingPoint[w.ty] = p;
                    startingPoint[the_other_axis] = w.pos[the_other_axis];
                    newDirection = dBall.slice();
                    newDirection[the_other_axis] = -newDirection[the_other_axis];
                    plus(startingPoint,newDirection,1e-6);
                }
            }
        }
    });
    let gameBound = [gameWidth, gameHeight];
    let boundCheck = (dir = 0) => {
        let p1 = clamp(end[1-dir], 0, gameBound[1-dir]);
        let dist  = Math.abs(pBall[1-dir] - p1);
        if (mindist > dist){
            mindist = dist;
            startingPoint[1-dir] = p1;
            startingPoint[dir] = pBall[dir] + Math.sign(dBall[dir]) * dist;
            newDirection = dBall.slice();
            newDirection[1-dir] = -newDirection[1-dir];
            plus(startingPoint,newDirection,1e-6);
            return true;
        }
        return false;
    };
    if (end[1] <= 0 || end[1] >= gameHeight){
        boundCheck();
    }
    if (end[0]<=0 || end[0] >= gameWidth){
        if(boundCheck(1)){
            if(gameMode==GameMode.SINGLE){
                total_score -= 1;
                sc.innerHTML = ''+total_score.toFixed(2);
            }
            else{
                players[0+(end[0] <= 1e-8)].score += 1;
                players[0+(end[0] <= 1e-8)].scorelabel.innerHTML = ''+players[0+(end[0] <= 1e-8)].score.toFixed(2);
            }
        }
    }
    if (isFinite(mindist)){
        dBall = newDirection;
        pBall = startingPoint;
        delta -= mindist/vBall;
        if (Math.abs(olddelta - delta) > 1e-8)
            bounce(delta);
        else 
            pBall = end;
    }
    else
        pBall = end;
}
function tick(){
    let curr = Date.now();
    let delta = (curr - time)/1000;
    if (pause) return;
    if (pause_left != 0){
        if (delta >= pause_left)
        {
            time = curr;
            pause_left = 0
        }
        return;
    }
    time = curr;
    let lastx = pBall[0];
    players.forEach((p)=>{
        if(!isNaN(p.cd_add))
        {
            p.cd_add = clamp(p.cd_add - delta, 0, CD_add);
            if(p.cd_add == 0){
                p.cdaddlabel.style.color = '#7DC97B';
                p.cdaddlabel.innerHTML = 'Ready.';
            }
            else {
                p.cdaddlabel.innerHTML = '' + p.cd_add.toFixed(3) + 's Left.';
            }
        }
        if(!isNaN(p.cd_delete)){
            p.cd_delete = clamp(p.cd_delete - delta, 0, CD_del);
            if(p.cd_delete == 0){
                p.cdrmlabel.style.color = '#7DC97B';
                p.cdrmlabel.innerHTML = 'Ready.';
            }
            else
                p.cdrmlabel.innerHTML = '' + p.cd_delete.toFixed(3) + 's Left.';
        }
    });
    bounce(delta);
    let moved = lastx < gameWidth/2 ^ pBall[0] < gameWidth/2;
    if(moved){
        decay[pBall<gameWidth/2] = 0;
        decayStart = curr;
    }
    else{
        let pid= 0 + (lastx<gameWidth/2);
        if (parseInt((curr - decayStart)/1000) > decay[pid]){
            decay[pid] = parseInt((curr - decayStart)/1000);
            players[pid].score += sDecay;
            players[pid].scorelabel.innerHTML = ''+players[pid].score.toFixed(2);
        }
    }
    timectrl.innerHTML = "Time Left: " + clamp((Tmax - (curr - startTime)/1000).toFixed(3),0) + 's. ';
    if((curr - startTime)/1000>= Tmax)
    {
        statectrl.innerHTML = 'Game Ended. '; 
        if(gameMode == GameMode.SINGLE);
        else if(players[0].score == players[1].score)
            statectrl.innerHTML += 'Tied.'
        else {
            player = players[0].score > players[1].score ? players[0] : players[1];
            statectrl.style.color = '#ff0000';
            statectrl.innerHTML += '<strong>'+player.name + '</strong> wins.';
        }
        endGame();
    }
    if(gameMode == GameMode.VSAI){
        AI_Tick();
    }
}
function hitTest(lr, loc, remove = false){
    let mindist = gameHeight*gameHeight + gameWidth*gameWidth;
    let minid = -1;
    let len = 0;
    let filter = (w, id) => {
        const d = minus(loc, w.pos);
        let dist = -1;
        if(Math.abs(d[w.ty]) < w.len/2){
            dist = Math.abs(d[1-w.ty]);
        }
        else{
            let pt = [0,0];
            pt[w.ty] = w.pos[w.ty]+Math.sign(d[w.ty])*w.len/2;
            pt[1-w.ty] = w.pos[1-w.ty]
            dist = getLen(minus(pt, loc));
        }
        if (dist < TH && dist < mindist){
            mindist = dist;
            minid = id;
        }            
    };
    let popped = false;
    if(lr & 1){
        wallsL.forEach((w, id) => filter(w, id));
        if(remove && minid >= 0){
            let t = wallsL[wallsL.length-1];
            wallsL[wallsL.length-1] = wallsL[minid];
            wallsL[minid] = t;
            len = wallsL.pop().len;
            popped = true;
        }
    }
    if(!popped && lr & 2){
        wallsR.forEach((w, id) => filter(w, id));
        if(remove && minid >= 0){
            let t = wallsR[wallsR.length-1];
            wallsR[wallsR.length-1] = wallsR[minid];
            wallsR[minid] = t;
            len = wallsR.pop().len;
        }
    }
    if (len > 0){
        cursor.player.delete = false;
        cursor.player.materials += len;
        cursor.player.materiallabel.style.width=''+(100*cursor.player.materials/totalMaterials)+'%';
    }
    
    len = len == 0 && minid >= 0 ? 1 : len;
    
    return len;
}

function paintWall(ctx, w){
    let len = w.len/2;
    let x = w.pos[0], y = w.pos[1];
    ctx.beginPath();
    if (w.ty == 0){
        ctx.moveTo(x-len, y);
        ctx.lineTo(x + len, y);
    }
    else{
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + len);
    }
    ctx.stroke();
}
function drawCursor(){
    if (pause) return;
    var ctx = canvas.canvas.getContext("2d");
    var pos = cursor.pos;
    if(cursor.player.delete){
        ctx.strokeStyle = hitTest(gameMode == GameMode.SINGLE?3:cursor.id+3, cursor.pos)?'#ff3300':'#999999';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        let x = pos[0], y = pos[1];
        const len = 10;
        ctx.beginPath();

        ctx.moveTo(x - len, y - len);
        ctx.lineTo(x + len, y + len);
    
        ctx.moveTo(x + len, y - len);
        ctx.lineTo(x - len, y + len);
        ctx.stroke();
    } else if(cursor.in && !cursor.disabled){
        ctx.strokeStyle = players[-cursor.id-1].color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        paintWall(ctx, cursor);
    }
}
function drawAssets(){
    let ctx = canvas.canvas.getContext("2d");

    players.forEach((p, i) => {
        ctx.lineCap = 'butt';
        ctx.fillStyle = p.lighten_color;
        ctx.fillRect(i?gameWidth/2:0, 0,gameWidth/2, gameHeight);
        ctx.lineCap = 'round';
        ctx.strokeStyle = (p.other.delete || p.delete && (gameMode == GameMode.SINGLE))?'#ffdd00':adjustColor(p.color, -25, (x)=>x*Math.sqrt(x));
        ctx.lineWidth = p.other.delete||p.delete && (gameMode == GameMode.SINGLE)?3:2;
        p.walls.forEach((l)=>paintWall(ctx, l))
    });
    
    ctx.strokeStyle = '#777777';
    ctx.beginPath();
    ctx.arc(pBall[0], pBall[1], 2, 0, 2*Math.PI, false);
    ctx.fillStyle='#777777'
    ctx.fill();
}
function AI_Tick(freq = .008, freqdel = .001){
    const p = players[1];
    let del = ()=>{
            if(p.cd_delete == 0){
            let lmax = 0, wmax = -1;
            let ws = players[0].walls;
            ws.forEach((w, i)=>{
                if(w.len > lmax){
                    lmax = w.len;
                    wmax = i;
                }
            });

            if (wmax >= 0){
                let t = ws[ws.length-1];
                ws[ws.length-1] = ws[wmax];
                ws[wmax] = t;
                p.materials += ws.pop().len;
                p.materiallabel.style.width=''+(100*p.materials/totalMaterials)+'%';
                const have_walls_left = players[0].walls.length;
                p.cd_delete = have_walls_left ? CD_del:NaN;
                p.cdrmlabel.style.color = "#ff0000";
                p.cdrmlabel.innerHTML = have_walls_left ? '' + CD_del+'s Left.':'Wait for Walls';
            }
        }
    }
    if(Math.random() > freq)
    {
        if(Math.random() < freqdel)
            del();
        return;
    }
    
    if(p.cd_add == 0 && p.materials > 0 && pBall[0] > gameWidth/2){
        if(dBall[0] < 0 && Math.random() < .9)
            return;
        let hit = false;

        p.walls.forEach((w)=>{
            const pw = w.pos[0] - pBall[0];
            if(Math.abs(pw) < maxWallLen && dBall[0]*pw > 0) {
                const d = pw/dBall[0];
                const p1 = d * dBall[1] + pBall[1];
                const w1max = w.pos[1] + w.len/2;
                const w1min = w.pos[1] - w.len/2;

                if(w1min <= p1 && p1 <= w1max){
                    hit = true;
                    return;
                }

            }
        });

        if(!hit){
            const lmin = Math.max(4, minWallLen);
            const len = Math.floor(lmin + Math.pow(Math.random(),2) * (Math.min(maxWallLen, p.materials)-lmin));
            if (len < lmin){
                del();
                return;
            }
            let newPos = plusneq(pBall, dBall, 1.5);

            p.materials -= cursor.len;
            p.materiallabel.style.width = '' + (100*p.materials/totalMaterials) + '%';

            p.walls.push(new Wall(newPos, len, 0+(Math.random() > 0.01), p.walls.length, p));
            if(isNaN(players[0].cd_delete))
            {
                players[0].cd_delete = CD_del;
            }
            p.cd_add = CD_add;
            p.cdaddlabel.style.color='#ff0000'
            p.cdaddlabel.innerHTML=''+CD_add+'s Left.';
        }
    }
    else if (p.materials <= 0){
        del();
    }
}