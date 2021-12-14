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
function disableScroll() {
    window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
    window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
    window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
    window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}
function enableScroll() {
    window.removeEventListener('DOMMouseScroll', preventDefault, false);
    window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
    window.removeEventListener('touchmove', preventDefault, wheelOpt);
    window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}


class Wall{
    constructor(pos = [0,0], len = 0, ty = 0, id = 0, player = undefined){
        this.pos = pos;
        this.len = len;
        this.ty = ty;
        this.id = id;
        this.player = player;
    }
    copy(id = -3){
        return new Wall(this.pos.slice(), this.len, this.ty, id, this.player);
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
    }
}
let cursors = [],
    cursor;
let wallsL = [], wallsR = [], boundaries = [];
let players = [];
let gameWidth = 700, gameHeight = 200;
let maxWallLen = 80, minWallLen = 10;
let deletion = false;
let CD_del = 10;
let CD_add = 2;
let time = 0;
let vBall = 15;
let pBall = [0, 0];
let dBall = [1,1];
let directions = [[1, 1], [1, -1], [-1, -1], [-1, 1]]; 
let TH = 8;
function clamp(x, a, b){
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
function setup() {
    canvas = createCanvas(gameWidth, gameHeight);
    canvas.parent('game-container');
    disableScroll();
    canvas.canvas.addEventListener('mousemove', (e)=>{
        if (inGame){
            if(!cursor.player.delete)
                cursor = cursors[e.offsetX<=gameWidth/2?0:1];
            cursor.pos[0] = e.offsetX;
            cursor.pos[1] = e.offsetY;
        }
    });
    canvas.canvas.addEventListener('wheel', (e)=>{
        if(inGame){
            cursor.len = clamp(cursor.len + Math.sign(e.deltaY), minWallLen, maxWallLen);
        }
    });
    canvas.canvas.addEventListener("click", (e) => {
        if(inGame){
            if(cursor.player.delete){
                if (hitTest(cursor.id+3, cursor.pos, true))
                    ;
            }
            else if(cursor.player.cd_add<=0 && cursor.player.materials >= cursor.len){
                cursor.player.materials -= cursor.len;
                let walls = (cursor.id == -1)?
                    wallsL:wallsR;
                walls.push(cursor.copy(walls.length));
                if(isNaN(players[cursor.id + 2].cd_delete))
                    players[cursor.id + 2].cd_delete = CD_del;
                cursor.player.cd_add = CD_add;
            }
        }
    });
    window.addEventListener("keypress", (e)=>{
        if(inGame){
            if (e.code == 'KeyD')
                if(cursor.player.cd_delete <= 0)
                    cursor.player.delete = !cursor.player.delete;
                else
                    cursor.player.delete = false;
            else if (e.code == 'KeyZ')
                cursor.ty = 1 - cursor.ty;
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
        drawCursor();
        drawAssets();
        if(!gameEnded)
            tick();
    }
}
function getAttrib(str){
    return parseInt(document.getElementById(str).value);
}
function startGame() {
    message = '';
    player1 = document.getElementById("player-1").value;
    player2 = document.getElementById("player-2").value;
    gameWidth = getAttrib("width-of-board");
    gameHeight = getAttrib("height-of-board");
    totalMaterials = getAttrib("total-materials");
    CD_add = getAttrib("cd-add");
    CD_del = getAttrib("cd-del");
    maxWallLen = getAttrib("max-wall-len"); 
    minWallLen = getAttrib("min-wall-len");
    vBall = getAttrib("game-speed"); 
    Tmax = getAttrib("tmax"); 
    wallsL = []; wallsR = [];
    canvas.resize(gameWidth, gameHeight);   
    pBall[0] = gameWidth/2;
    pBall[1] = gameHeight/2;
    dBall = directions[Math.floor(Math.random()*4)].slice();
    players[0] = new Player(0, wallsL, totalMaterials, player1);
    players[1] = new Player(1, wallsR, totalMaterials, player2);
    cursors = [new Wall([0,0], 25, 1, -1, players[0]), new Wall([0,0], 25, 0, -2, players[1])];
    cursor = cursors[0];
    startTime = time = Date.now();
    inGame = true;
    gameEnded = false;
}

function bounce(delta){
    let olddelta = delta;
    let mindist = Infinity;
    let startingPoint = [0, 0];
    let newDirection = undefined;
    let end = plusneq(pBall, dBall, vBall*delta);
    let range = [[end[0], pBall[0]].sort(),[end[1], pBall[1]].sort()];
    wallsL.concat(wallsR).forEach((w, id) => {
        let the_other_axis = 1-w.ty;
        if (w.pos[the_other_axis]>range[the_other_axis][0]+1e-8 && w.pos[the_other_axis] <range[the_other_axis][1]-1e-8){
            let dist = Math.abs(pBall[the_other_axis] - w.pos[the_other_axis])/vBall;
            let p = pBall[w.ty] + dist * dBall[w.ty];
            if(p > w.pos[w.ty]-w.len/2 + 1e-8 && p < w.pos[w.ty] + w.len/2 - 1e-8){
                if (mindist > dist)
                {
                    mindist = dist; 
                    startingPoint[w.ty] = p;
                    startingPoint[the_other_axis] = w.pos[the_other_axis];
                    newDirection = dBall.slice();
                    newDirection[the_other_axis] = -newDirection[the_other_axis];
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
            return true;
        }
        return false;
    };
    if (end[1] <= 0 || end[1] >= gameHeight){
        boundCheck();
    }
    if (end[0]<=0 || end[0] >= gameWidth){
        if(boundCheck(1)){
            ++ players[startingPoint[0] != 0];
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
    time = curr;
    players.forEach((p)=>{
        if(!isNaN(p.cd_add))
            p.cd_add = clamp(p.cd_add - delta, 0, CD_add);
        if(!isNaN(p.cd_delete))
            p.cd_delete = clamp(p.cd_delete - delta, 0, CD_del);
    });
    bounce(delta);
    if((curr - startTime)/1000>= Tmax)
        gameEnded = true;
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
    if(lr & 1){
        wallsL.forEach((w, id) => filter(w, id));
        if(remove && minid >= 0){
            let t = wallsL[wallsL.length-1];
            wallsL[wallsL.length-1] = wallsL[minid];
            wallsL[minid] = t;
            len = wallsL.pop().len;
        }
    }
    if(lr & 2){
        wallsR.forEach((w, id) => filter(w, id));
        if(remove && minid >= 0){
            let t = wallsR[wallsR.length-1];
            wallsR[wallsR.length-1] = wallsR[minid];
            wallsR[minid] = t;
            len = wallsR.pop().len;
        }
    }
    if (len > 0)
        cursor.player.delete = false;
    
    len = len == 0 && minid >= 0 ? 1 : len;
    
    return len;
}
function paintWall(ctx, w){
    let len = w.len/2;
    let x = w.pos[0], y = w.pos[1];
    ctx.beginPath();
    if (w.ty == 0){
        ctx.moveTo(x-len, y);
        ctx.lineTo(x+w.len - len, y);
    }
    else{
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + w.len - len);
    }
    ctx.stroke();
}
function drawCursor(){
    var ctx = canvas.canvas.getContext("2d");
    var pos = cursor.pos;
    if(cursor.player.delete){
        ctx.strokeStyle = hitTest(cursor.id+3, cursor.pos)?'#ffff00':'#999999';
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
    } else {
        ctx.strokeStyle = cursor.id === -1?'#99D6D3':'#FFBBC6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        paintWall(ctx, cursor);
    }
}
function drawAssets(){
    let ctx = canvas.canvas.getContext("2d");
    ctx.strokeStyle = '#99D6D3';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    wallsL.forEach((l)=>paintWall(ctx, l));
    ctx.strokeStyle = '#FFBBC6';
    wallsR.forEach((r)=>paintWall(ctx, r));
    ctx.strokeStyle = '#777777';
    ctx.beginPath();
    ctx.arc(pBall[0], pBall[1], 2, 0, 2*Math.PI, false);
    ctx.fillStyle='#777777'
    ctx.fill();
}
