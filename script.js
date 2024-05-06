(function() {
  function Runner(containerId, runnerConfig) { 
    if (Runner.instance)
        return Runner.instance; 
    else (Runner.instance = this); 
    this.elementContainer = document.querySelector(containerId);
    this.config = runnerConfig || Runner.config;
    this.dimensions = Runner.defaultSize;
    this.distanceRun = 0;
    this.highestScore = 0; 
    this.msPerFrame = 1000 / FPS;
    this.currentSpeed = this.config.SPEED;
    this.images = {};
    this.loadImages(); 
  }
  
  window['Runner'] = Runner;
  let DEFAULT_WIDTH = 600; 
  let FPS = 60;  
  let IS_HIDPI = window.devicePixelRatio > 1;
  let IS_IOS = window.navigator.userAgent.indexOf('UIWebViewForStaticFileContent') > -1; 
  let IS_MOBILE = window.navigator.userAgent.indexOf('Mobi') > -1 || IS_IOS; 
  
  Runner.config = {
    SPEED: 6,
    ACCELERATION: 0.001, 
    MAX_SPEED: 12,
    GRAVITY: 0.6, 
    INITIAL_JUMP_VELOCITY: 12,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    GAP_COEFFICIENT: 0.6, 
    SPEED_DROP_COEFFICIENT: 3,
    MAX_CLOUDS: 6,
    BG_CLOUD_SPEED: 0.2,
    CLOUD_FREQUENCY: 0.5,
    MAX_OBSTACLE_LENGTH: 3,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    GAMEOVER_CLEAR_TIME: 750,
  };

  Runner.defaultSize = {
    WIDTH: DEFAULT_WIDTH,
    HEIGHT: 150,
  };
  
  Runner.classes = { 
    CONTAINER: 'runner-container', 
    CRASHED: 'crashed', 
    TOUCH_CONTROLLER: 'controller', 
  };

Runner.imageSources = {
  HDPI: [  
    {name: 'CACTUS_LARGE', id: 'largecactus'}, 
    {name: 'CACTUS_SMALL', id: 'smallcactus'},
    {name: 'CLOUD', id: 'cloud'}, 
    {name: 'HORIZON', id: 'horizon'}, 
    {name: 'TEXT_SPRITE', id: 'text'}, 
    {name: 'DINO', id: 'dino'}
  ]
};
  Runner.keycodes = {
    JUMP: {'38': 1, '32': 1}, 
    };

Runner.events = {
  ANIM_END: 'webkitAnimationEnd',
  CLICK: 'click', 
  KEYDOWN: 'keydown', 
  KEYUP: 'keyup',
  TOUCHSTART: 'touchstart', 
};

Runner.prototype = { 
  updateConfigSetting: function(setting, value) {
    if (setting in this.config && value != undefined) { 
      this.config[setting] = value;
      switch (setting) {
        case 'GRAVITY':
        case 'MIN_JUMP_HEIGHT':
        case 'SPEED_DROP_COEFFICIENT':
          this.dino.config[setting] = value;
          break;
        case 'INITIAL_JUMP_VELOCITY': 
          this.dino.setJumpVelocity(value);
          break;
        case 'SPEED':
          this.setSpeed(value);
          break;
      }}
    },

loadImages: function() {

  let imageSources = IS_HIDPI ? Runner.imageSources.HDPI : Runner.imageSources.LDPI;
  let numImages = imageSources.length;
  for (let i = numImages - 1; i >= 0; i--) {
    let imgSource = imageSources[i];
    this.images[imgSource.name] = document.getElementById(imgSource.id);}
  this.init();
},

setSpeed: function(opt_speed) {
},

init: function() { 
  this.adjustDimensions(); 
  this.setSpeed(); 
  this.containerEl = document.createElement('div'); 
  this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH, this.dimensions.HEIGHT, Runner.classes.PLAYER); 
  this.canvasCtx = this.canvas.getContext('2d');
  this.canvasCtx.fillStyle = '#f7f7f7';
  this.canvasCtx.fill();
  Runner.updateCanvasScaling(this.canvas);

  this.horizon = new Horizon(this.canvas, this.images, this.dimensions, this.config.GAP_COEFFICIENT);
  this.distanceMeter = new DistanceMeter(this.canvas, this.images.TEXT_SPRITE, this.dimensions.WIDTH);
  this.dino = new Dino(this.canvas, this.images.DINO);  
  this.elementContainer.appendChild(this.containerEl);

  
  this.startListening();
  this.update();

  window.addEventListener(Runner.events.RESIZE, this.debounceResize.bind(this));},
adjustDimensions: function() { 
this.resizeTimerId_ = null;  
let boxStyles = window.getComputedStyle(this.elementContainer); 
let padding = Number(boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2)); 
this.dimensions.WIDTH = this.elementContainer.offsetWidth - padding * 2; 
},

playIntro: function() { 
  if (!this.started && !this.crashed) {
    this.playingIntro = true; 
    this.dino.playingIntro = true; 

    let keyframes = '@-webkit-keyframes intro { ' + 'from { width:' + Dino.config.WIDTH + 'px }' + 'to { width: ' + this.dimensions.WIDTH + 'px }' +'}';  
    document.styleSheets[0].insertRule(keyframes, 0);
    this.containerEl.addEventListener(Runner.events.ANIM_END, this.startGame.bind(this));
    this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both'; 

    
    if (this.touchController) { 
      this.elementContainer.appendChild(this.touchController); 
    }

   
    this.activated = true; 
    this.started = true; 
  } else if (this.crashed) { 
    this.restart();
  }
},

startGame: function() {
  
  this.runningTime = 0; 
  this.playingIntro = false;
  this.dino.playingIntro = false;
  this.playCount++;
},

clearCanvas: function() { 
  this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
},
update: function() { // update(): Метод, который обновляет состояние игры и отрисовывает новый кадр
this.drawPending = false; 
let now = getTimeStamp(); 
let deltaTime = now - (this.time || now); 
this.time = now;
if (this.activated) { 
  this.clearCanvas(); 
if (this.dino.jumping) { 
  this.dino.updateJump(deltaTime, this.config);}
  this.runningTime += deltaTime; 
let hasObstacles = this.runningTime > this.config.CLEAR_TIME; 
if (this.dino.jumpCount == 1 && !this.playingIntro) { 
  this.playIntro();
}

if (this.playingIntro) {
  this.horizon.update(0, this.currentSpeed, hasObstacles);
} else {
  deltaTime = !this.started ? 0 : deltaTime; 
  this.horizon.update(deltaTime, this.currentSpeed, hasObstacles); 
}

let collision = hasObstacles && checkForCollision(this.horizon.obstacles[0], this.dino);
if (!collision) {
  this.distanceRun += this.currentSpeed * deltaTime / this.msPerFrame;
  if (this.currentSpeed < this.config.MAX_SPEED) {
    this.currentSpeed += this.config.ACCELERATION;
  }
} else {
  this.gameOver();
}

if (this.distanceMeter.getActualDistance(this.distanceRun) > this.distanceMeter.maxScore) {this.distanceRun = 0;}
let playAcheivementSound = this.distanceMeter.update(deltaTime, Math.ceil(this.distanceRun)); 
}

if (!this.crashed) {
 
  this.dino.update(deltaTime); 
  this.raq();
}
},
handleEvent: function(e) { 
  return (function(evtType, events) {
    switch (evtType) {
      case events.KEYDOWN:
      case events.TOUCHSTART:
      case events.MOUSEDOWN:
        this.onKeyDown(e);
        break;
      case events.KEYUP:
      case events.TOUCHEND:
      case events.MOUSEUP:
        this.onKeyUp(e);
        break;
      }
}
.bind(this))(e.type, Runner.events);
},

startListening: function() { 
  document.addEventListener(Runner.events.KEYDOWN, this);
  document.addEventListener(Runner.events.KEYUP, this);
 
  if (!IS_MOBILE) { 
    document.addEventListener(Runner.events.MOUSEDOWN, this);
    document.addEventListener(Runner.events.MOUSEUP, this);
  }
},


onKeyDown: function(e) {
 
  if (e.target != this) { 
    
    if (!this.crashed && (Runner.keycodes.JUMP[String(e.keyCode)] || e.type == Runner.events.TOUCHSTART)) { 
      
      if (!this.activated) { 
        this.activated = true;
      }
      if (!this.dino.jumping) {
        this.dino.startJump();
      }
    }
  if (this.crashed && e.type == Runner.events.TOUCHSTART && e.currentTarget == this.containerEl) {
    this.restart();
  }
}

if (Runner.keycodes[e.keyCode] && this.dino.jumping) {
  e.preventDefault();
  this.dino.setSpeedDrop();
}},

onKeyUp: function(e) { 
  let keyCode = String(e.keyCode);
  
  let isJumpKey = Runner.keycodes.JUMP[keyCode] || e.type == Runner.events.TOUCHEND || e.type == Runner.events.MOUSEDOWN;
  
  if (this.isRunning() && isJumpKey) { 
    this.dino.endJump();
} else if (Runner.keycodes[keyCode]) {
  this.dino.speedDrop = false;
} 

else if (this.crashed) {
  let deltaTime = getTimeStamp() - this.time;
  if (Runner.keycodes[keyCode] ||
      (e.type == Runner.events.MOUSEUP && e.target == this.canvas) ||
      (deltaTime >= this.config.GAMEOVER_CLEAR_TIME && Runner.keycodes.JUMP[keyCode])) {
    this.restart();
  }
} else if (this.paused && isJumpKey) {
  this.play();
}},

raq: function() {
if (!this.drawPending) { 
this.drawPending = true;
this.raqId = requestAnimationFrame(this.update.bind(this));
}},

isRunning: function() {
return !!this.raqId;
},

gameOver: function() {
  vibrate(200);
  this.stop(); 
  this.crashed = true;
  this.distanceMeter.acheivement = false; 
  this.dino.update(100, Dino.status.CRASHED); 

if (!this.gameOverPanel) {
  this.gameOverPanel = new GameOverPanel(
    this.canvas,
    this.images.TEXT_SPRITE, 
    this.images, 
    this.dimensions 
  );
} else {
  this.gameOverPanel.draw();
} if (this.distanceRun > this.highestScore) {
  this.highestScore = Math.ceil(this.distanceRun);
  this.distanceMeter.setHighScore(this.highestScore);
}

this.time = getTimeStamp();}, 
stop: function() { 
  this.activated = false; 
  this.paused = true;
  cancelAnimationFrame(this.raqId); 
  this.raqId = 0; 
},

play: function() {
  if (!this.crashed) {
    this.activated = true; 
    this.paused = false; 
    this.dino.update(0, Dino.status.RUNNING); 
    this.time = getTimeStamp();
    this.update(); 
  }
},

restart: function() {
  if (!this.raqId) { 
    this.playCount++;
    this.runningTime = 0; 
    this.activated = true;
    this.crashed = false; 
    this.distanceRun = 0; 
    this.setSpeed(this.config.SPEED);
    this.time = getTimeStamp(); 
    this.clearCanvas(); 
    this.distanceMeter.reset(this.highestScore); 
    this.horizon.reset(); 
    this.dino.reset(); 
    this.update(); 
  }
},

onVisibilityChange: function(e) {
  if (document.hidden || document.webkitHidden || e.type == 'blur') {
    this.stop();
  } else {
    this.play();
  }
},
};

Runner.updateCanvasScaling = function(canvas, opt_width, opt_height) {
  
  let context = canvas.getContext('2d'); 
  let devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
  let backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
  let ratio = devicePixelRatio / backingStoreRatio;

if (devicePixelRatio !== backingStoreRatio) {
let oldWidth = opt_width || canvas.width;
let oldHeight = opt_height || canvas.height;
canvas.width = oldWidth * ratio;
canvas.height = oldHeight * ratio;
canvas.style.width = oldWidth + 'px';
canvas.style.height = oldHeight + 'px';

context.scale(ratio, ratio);
return true;}
return false;
};
function getRandomNum(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;} 
function vibrate(duration) { 
if (IS_MOBILE && window.navigator.vibrate) {
window.navigator.vibrate(duration);}
}

function createCanvas(container, width, height, opt_classname) {
let canvas = document.createElement('canvas');
canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
opt_classname : Runner.classes.CANVAS;
canvas.width = width;
canvas.height = height;
container.appendChild(canvas);
return canvas;
}

function getTimeStamp() {
return IS_IOS ? new Date().getTime() : performance.now();} 
function GameOverPanel(canvas, textSprite, restartImg, dimensions) { 
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext('2d');
  this.canvasDimensions = dimensions;
  this.textSprite = textSprite;
  this.restartImg = restartImg;
  this.draw();
};

GameOverPanel.dimensions = {
TEXT_X: 0, TEXT_Y: 13, 
TEXT_WIDTH: 191, TEXT_HEIGHT: 11, 
};

GameOverPanel.prototype = {
updateDimensions: function(width, opt_height) { 
this.canvasDimensions.WIDTH = width;
if (opt_height) {
  this.canvasDimensions.HEIGHT = opt_height;}},
draw: function() {
  let dimensions = GameOverPanel.dimensions;
  let centerX = this.canvasDimensions.WIDTH / 2;

let textSourceX = dimensions.TEXT_X;
let textSourceY = dimensions.TEXT_Y;
let textSourceWidth = dimensions.TEXT_WIDTH;
let textSourceHeight = dimensions.TEXT_HEIGHT;
let textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
let textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
let textTargetWidth = dimensions.TEXT_WIDTH;
let textTargetHeight = dimensions.TEXT_HEIGHT;
let restartSourceWidth = dimensions.RESTART_WIDTH;
let restartSourceHeight = dimensions.RESTART_HEIGHT;

if (IS_HIDPI) {
textSourceY *= 2;
textSourceX *= 2;
textSourceWidth *= 2;
textSourceHeight *= 2;
restartSourceWidth *= 2;
restartSourceHeight *= 2;}

this.canvasCtx.drawImage(
  this.textSprite,
  textSourceX, textSourceY,
  textSourceWidth, textSourceHeight,
  textTargetX, textTargetY,
  textTargetWidth, textTargetHeight
);
}};
function checkForCollision(obstacle, dino, opt_canvasCtx) {

let dinoBox = new CollisionBox(
  dino.xPos + 1, 
  dino.yPos + 1,
  dino.config.WIDTH - 2,
  dino.config.HEIGHT - 2 
);


let obstacleBox = new CollisionBox(
  obstacle.xPos + 1,
  obstacle.yPos + 1, 
  obstacle.typeConfig.width * obstacle.size - 2, 
  obstacle.typeConfig.height - 2 
);


if (boxCompare(dinoBox, obstacleBox)) {
  let collisionBoxes = obstacle.collisionBoxes; 
  let dinoCollisionBoxes = Dino.collisionBoxes; 
  
for (let t = 0; t < dinoCollisionBoxes.length; t++) {
for (let i = 0; i < collisionBoxes.length; i++) {

let adjDinoBox = createAdjustedCollisionBox(dinoCollisionBoxes[t], dinoBox);
let adjObstacleBox = createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
let crashed = boxCompare(adjDinoBox, adjObstacleBox);

if (opt_canvasCtx) {
drawCollisionBoxes(opt_canvasCtx, adjDinoBox, adjObstacleBox);}
if (crashed) {
  return [adjDinoBox, adjObstacleBox];}
}}}
  return false;
};
function createAdjustedCollisionBox(box, adjustment) {
return new CollisionBox(
box.x + adjustment.x,
box.y + adjustment.y,
box.width,
box.height
);};

function drawCollisionBoxes(canvasCtx, dinoBox, obstacleBox) {
canvasCtx.save();
canvasCtx.strokeStyle = '#f00';
canvasCtx.strokeRect(dinoBox.x, dinoBox.y,
dinoBox.width, dinoBox.height);
canvasCtx.strokeStyle = '#0f0';
canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
obstacleBox.width, obstacleBox.height);
canvasCtx.restore();};
function boxCompare(dinoBox, obstacleBox) {
let crashed = false;
let obstacleBoxX = obstacleBox.x;

if (dinoBox.x < obstacleBoxX + obstacleBox.width &&
  dinoBox.x + dinoBox.width > obstacleBoxX &&
  dinoBox.y < obstacleBox.y + obstacleBox.height &&
  dinoBox.height + dinoBox.y > obstacleBox.y) {
  crashed = true;
}return crashed;
};
function CollisionBox(x, y, w, h) {
this.x = x;
this.y = y;
this.width = w;
this.height = h;
};
function Obstacle(canvasCtx, type, obstacleImg, dimensions,
gapCoefficient, speed) {
this.canvasCtx = canvasCtx;
this.image = obstacleImg;
this.typeConfig = type;
this.gapCoefficient = gapCoefficient;
this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
this.dimensions = dimensions;
this.remove = false;
this.xPos = 0;
this.yPos = this.typeConfig.yPos;
this.width = 0;
this.collisionBoxes = [];
this.gap = 0;
this.init(speed);
};

Obstacle.MAX_GAP_COEFFICIENT = 1.5;
Obstacle.MAX_OBSTACLE_LENGTH = 3,
Obstacle.prototype = {
init: function(speed) {
this.cloneCollisionBoxes();

if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
  this.size = 1;}
  this.width = this.typeConfig.width * this.size;
  this.xPos = this.dimensions.WIDTH - this.width;
this.draw();
if (this.size > 1) {
  this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
  this.collisionBoxes[2].width;
  this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;}
  this.gap = this.getGap(this.gapCoefficient, speed);},
draw: function() {
let sourceWidth = this.typeConfig.width;
let sourceHeight = this.typeConfig.height;
if (IS_HIDPI) {
  sourceWidth = sourceWidth * 2;
  sourceHeight = sourceHeight * 2;}
let sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1));
this.canvasCtx.drawImage(this.image,
sourceX, 0,
sourceWidth * this.size, sourceHeight,
this.xPos, this.yPos,
this.typeConfig.width * this.size, this.typeConfig.height);},
update: function(deltaTime, speed) {
if (!this.remove) {
this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);
this.draw();
if (!this.isVisible()) {
this.remove = true;
}}},

getGap: function(gapCoefficient, speed) {
let minGap = Math.round(this.width * speed +
this.typeConfig.minGap * gapCoefficient);
let maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
return getRandomNum(minGap, maxGap);},
isVisible: function() {
return this.xPos + this.width > 0;
},
cloneCollisionBoxes: function() {
let collisionBoxes = this.typeConfig.collisionBoxes;
for (let i = collisionBoxes.length - 1; i >= 0; i--) {
this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
collisionBoxes[i].y, collisionBoxes[i].width,
collisionBoxes[i].height);
}}};

Obstacle.types = [{
type: 'CACTUS_SMALL',
className: ' cactus-small ',
width: 17,
height: 35,
yPos: 105,
multipleSpeed: 3,
minGap: 120,
collisionBoxes: [
new CollisionBox(0, 7, 5, 27),
new CollisionBox(4, 0, 6, 34),
new CollisionBox(10, 4, 7, 14)
]},
{
type: 'CACTUS_LARGE',
className: ' cactus cactus-large ',
width: 25,
height: 50,
yPos: 90,
multipleSpeed: 6,
minGap: 120,
collisionBoxes: [
new CollisionBox(0, 12, 7, 38),
new CollisionBox(8, 0, 7, 49),
new CollisionBox(13, 10, 10, 38)
]}];

function Dino(canvas, image) {
this.canvas = canvas;
this.canvasCtx = canvas.getContext('2d');
this.image = image;
this.xPos = 0;
this.yPos = 0;
this.groundYPos = 0; 
this.currentFrame = 0; 
this.currentAnimFrames = [];
this.blinkDelay = 0;
this.animStartTime = 0; 
this.timer = 0;
this.msPerFrame = 1000 / FPS; 
this.config = Dino.config;
this.status = Dino.status.WAITING;
this.jumping = false;
this.jumpVelocity = 0;
this.reachedMinHeight = false;
this.speedDrop = false;
this.jumpCount = 0;
this.jumpspotX = 0;
this.init();
};

Dino.config = {
DROP_VELOCITY: -5,
GRAVITY: 0.6,
HEIGHT: 47,
INIITAL_JUMP_VELOCITY: -10,
INTRO_DURATION: 1500,
MAX_JUMP_HEIGHT: 30,
MIN_JUMP_HEIGHT: 30,
SPEED_DROP_COEFFICIENT: 3,
SPRITE_WIDTH: 262,
START_X_POS: 50,
WIDTH: 44
};

Dino.collisionBoxes = [
new CollisionBox(1, -1, 30, 26),
new CollisionBox(32, 0, 8, 16),
new CollisionBox(10, 35, 14, 8),
new CollisionBox(1, 24, 29, 5),
new CollisionBox(5, 30, 21, 4),
new CollisionBox(9, 34, 15, 4)
];

Dino.status = {
CRASHED: 'CRASHED',
JUMPING: 'JUMPING',
RUNNING: 'RUNNING',
WAITING: 'WAITING'
};

Dino.BLINK_TIMING = 7000;
Dino.animFrames = {
WAITING: {
frames: [44, 0],
msPerFrame: 1000 / 3
},
RUNNING: {
frames: [88, 132],
msPerFrame: 1000 / 12
},
CRASHED: {
frames: [220],
msPerFrame: 1000 / 60
},
JUMPING: {
frames: [0],
msPerFrame: 1000 / 60
}
};
Dino.prototype = {
init: function() {
this.blinkDelay = this.setBlinkDelay();
this.groundYPos = Runner.defaultSize.HEIGHT - this.config.HEIGHT -
Runner.config.BOTTOM_PAD;
this.yPos = this.groundYPos;
this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
this.draw(0, 0);
this.update(0, Dino.status.WAITING);
},
setJumpVelocity: function(setting) {
this.config.INIITAL_JUMP_VELOCITY = -setting;
this.config.DROP_VELOCITY = -setting / 2;
},
update: function(deltaTime, opt_status) {
this.timer += deltaTime;

if (opt_status) {
  this.status = opt_status;
  this.currentFrame = 0;
  this.msPerFrame = Dino.animFrames[opt_status].msPerFrame;
  this.currentAnimFrames = Dino.animFrames[opt_status].frames;
if (opt_status === Dino.status.WAITING) {
  this.animStartTime = getTimeStamp();
  this.setBlinkDelay();
}}

if (this.playingIntro && this.xPos < this.config.START_X_POS) {
  this.xPos += Math.round((this.config.START_X_POS /
  this.config.INTRO_DURATION) * deltaTime);}
if (this.status === Dino.status.WAITING) {
  this.blink(getTimeStamp());
} else {
  this.draw(this.currentAnimFrames[this.currentFrame], 0);}

if (this.timer >= this.msPerFrame) {
  this.currentFrame = this.currentFrame ==
  this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
  this.timer = 0;}},

draw: function(x, y) {
let sourceX = x;
let sourceY = y;
let sourceWidth = this.config.WIDTH;
let sourceHeight = this.config.HEIGHT;

// Размер и расположение динозавра
if (IS_HIDPI) {
sourceX *= 2;
sourceY *= 2;
sourceWidth *= 2;
sourceHeight *= 2;
}

this.canvasCtx.drawImage(this.image, sourceX, sourceY,
sourceWidth, sourceHeight,
this.xPos, this.yPos,
this.config.WIDTH, this.config.HEIGHT);},
setBlinkDelay: function() { 
this.blinkDelay = Math.ceil(Math.random() * Dino.BLINK_TIMING);},
blink: function(time) {
let deltaTime = time - this.animStartTime;
if (deltaTime >= this.blinkDelay) {
  this.draw(this.currentAnimFrames[this.currentFrame], 0);
if (this.currentFrame == 1) {
  
this.setBlinkDelay();
this.animStartTime = time;
}}},

startJump: function() {
if (!this.jumping) {
  this.update(0, Dino.status.JUMPING);
  this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY;
  this.jumping = true;
  this.reachedMinHeight = false;
  this.speedDrop = false;
}},

endJump: function() {
  if (this.reachedMinHeight &&
      this.jumpVelocity < this.config.DROP_VELOCITY) {
    this.jumpVelocity = this.config.DROP_VELOCITY;
  }
},

updateJump: function(deltaTime) {
  let msPerFrame = Dino.animFrames[this.status].msPerFrame;
  let framesElapsed = deltaTime / msPerFrame;

  // Ускорение прыжка
  if (this.speedDrop) {this.yPos += Math.round(this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed);} 
  else {this.yPos += Math.round(this.jumpVelocity * framesElapsed);}
  this.jumpVelocity += this.config.GRAVITY * framesElapsed;
  if (this.yPos < this.minJumpHeight || this.speedDrop) {this.reachedMinHeight = true;}
  if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {this.endJump();}
  if (this.yPos > this.groundYPos) {this.reset();this.jumpCount++;}
  this.update(deltaTime);
},

setSpeedDrop: function() {
  this.speedDrop = true;
  this.jumpVelocity = 1;
},

reset: function() {
  this.yPos = this.groundYPos;
  this.jumpVelocity = 0;
  this.jumping = false;
  this.update(0, Dino.status.RUNNING);
  this.midair = false;
  this.speedDrop = false;
  this.jumpCount = 0;
}};

function DistanceMeter(canvas, spriteSheet, canvasWidth) { // Дистанция в метрах
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext('2d');
  this.image = spriteSheet;
  this.x = 0;
  this.y = 5;
  this.currentDistance = 0;
  this.maxScore = 0;
  this.highScore = 0;
  this.container = null;
  this.digits = [];
  this.acheivement = false;
  this.defaultString = '';
  this.flashTimer = 0;
  this.flashIterations = 0;
  this.config = DistanceMeter.config;
  this.init(canvasWidth);
};

DistanceMeter.dimensions = {
  WIDTH: 10,
  HEIGHT: 13,
  DEST_WIDTH: 11
};
DistanceMeter.config = {
  MAX_DISTANCE_UNITS: 5,
  ACHIEVEMENT_DISTANCE: 100,
  COEFFICIENT: 0.025,
  FLASH_DURATION: 1000 / 4, 
  FLASH_ITERATIONS: 3
};

DistanceMeter.prototype = {
init: function(width) {
  let maxDistanceStr = ''; 
  this.calcXPos(width); 
  this.maxScore = this.config.MAX_DISTANCE_UNITS; 

  for (let i = 0; i < this.config.MAX_DISTANCE_UNITS; i++) {
    this.draw(i, 0);
    this.defaultString += '0'; 
    maxDistanceStr += '9'; 
  }
  this.maxScore = parseInt(maxDistanceStr);
},

calcXPos: function(canvasWidth) {
  this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH * (this.config.MAX_DISTANCE_UNITS + 1));}, 
draw: function(digitPos, value, opt_highScore) {
  let sourceWidth = DistanceMeter.dimensions.WIDTH;
  let sourceHeight = DistanceMeter.dimensions.HEIGHT;
  let sourceX = DistanceMeter.dimensions.WIDTH * value;
  let targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
  let targetY = this.y;
  let targetWidth = DistanceMeter.dimensions.WIDTH;
  let targetHeight = DistanceMeter.dimensions.HEIGHT;

// Увеличивание размеров в 2 раза.
if (IS_HIDPI) {
  sourceWidth *= 2;
  sourceHeight *= 2;
  sourceX *= 2;
}

this.canvasCtx.save();
if (opt_highScore) {
  let highScoreX = this.x - (this.config.MAX_DISTANCE_UNITS * 2) * DistanceMeter.dimensions.WIDTH;
  this.canvasCtx.translate(highScoreX, this.y);
} else {
  this.canvasCtx.translate(this.x, this.y);
}

this.canvasCtx.drawImage( 
  this.image, 
  sourceX, 0, 
  sourceWidth, sourceHeight, 
  targetX, targetY, 
  targetWidth, targetHeight
);

this.canvasCtx.restore();},
getActualDistance: function(distance) {
  return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
},

update: function(deltaTime, distance) {
  let paint = true; 
  if (!this.acheivement) {
    distance = this.getActualDistance(distance); 
    if (distance > 0) {
      if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
        this.acheivement = true;
        this.flashTimer = 0;
      }


let distanceStr = (this.defaultString + distance).substr(-this.config.MAX_DISTANCE_UNITS);
this.digits = distanceStr.split('');
} else {
this.digits = this.defaultString.split('');}
} else {
if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
  this.flashTimer += deltaTime;
  if (this.flashTimer < this.config.FLASH_DURATION) {
    paint = false;
  } else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
    this.flashTimer = 0;
    this.flashIterations++;
  }
} else {
  this.acheivement = false;
  this.flashIterations = 0;
  this.flashTimer = 0;
}}
if (paint) {
  for (let i = this.digits.length - 1; i >= 0; i--) {
    this.draw(i, parseInt(this.digits[i]));
  }
}
this.drawHighScore();
},

drawHighScore: function() {
  this.canvasCtx.save();
  this.canvasCtx.globalAlpha = 0.8;
  for (let i = this.highScore.length - 1; i >= 0; i--) {
    this.draw(i, parseInt(this.highScore[i], 10), true);}
  this.canvasCtx.restore();},
setHighScore: function(distance) {
  distance = this.getActualDistance(distance);
  let highScoreStr = (this.defaultString + distance).substr(this.config.MAX_DISTANCE_UNITS);
  this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
},

reset: function() {
  this.update(0);
  this.acheivement = false;
}};

function Cloud(canvas, cloudImg, containerWidth) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext('2d');
  this.image = cloudImg;
  this.containerWidth = containerWidth;
  this.xPos = containerWidth;
  this.yPos = 0;
  this.remove = false;
  this.cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP, Cloud.config.MAX_CLOUD_GAP);
  this.init();
};

Cloud.config = {
  HEIGHT: 14, 
  MAX_CLOUD_GAP: 400,
  MAX_SKY_LEVEL: 30,
  MIN_CLOUD_GAP: 100,
  MIN_SKY_LEVEL: 71,
  WIDTH: 46 
};
Cloud.prototype = {
init: function() {
  this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL, Cloud.config.MIN_SKY_LEVEL);
  this.draw();
},

draw: function() {
  this.canvasCtx.save();
  let sourceWidth = Cloud.config.WIDTH;
  let sourceHeight = Cloud.config.HEIGHT;
  if (IS_HIDPI) {
    sourceWidth = sourceWidth * 2;
    sourceHeight = sourceHeight * 2;
  }

  this.canvasCtx.drawImage(
    this.image, 
    0, 0,     
    sourceWidth, sourceHeight,
    this.xPos, this.yPos, 
    Cloud.config.WIDTH, Cloud.config.HEIGHT);
  this.canvasCtx.restore();},
update: function(speed) {
  if (!this.remove) {
    this.xPos -= Math.ceil(speed);
    this.draw();
    if (!this.isVisible()) {
      this.remove = true;
    }}},

isVisible: function() {
  return this.xPos + Cloud.config.WIDTH > 0;
}};

function HorizonLine(canvas, bgImg) {
  this.image = bgImg;
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext('2d');
  this.sourceDimensions = {};
  this.dimensions = HorizonLine.dimensions;
  this.sourceXPos = [0, this.dimensions.WIDTH];
  this.xPos = [];
  this.yPos = 0;
  this.bumpThreshold = 0.5;
  this.setSourceDimensions();
  this.draw();
};

HorizonLine.dimensions = {
  WIDTH: 600, 
  HEIGHT: 12, 
  YPOS: 127 
};

HorizonLine.prototype = {
setSourceDimensions: function() {
  for (let dimension in HorizonLine.dimensions) {
    if (IS_HIDPI) {
      if (dimension !== 'YPOS') {
        this.sourceDimensions[dimension] = HorizonLine.dimensions[dimension] * 2;
      }} else {
      this.sourceDimensions[dimension] = HorizonLine.dimensions[dimension];}
    this.dimensions[dimension] = HorizonLine.dimensions[dimension];}
  this.xPos = [0, HorizonLine.dimensions.WIDTH];
  this.yPos = HorizonLine.dimensions.YPOS;},

getRandomType: function() {
  return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;},

draw: function() {
  this.canvasCtx.drawImage(
    this.image, 
    this.sourceXPos[0], 0,
    this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
    this.xPos[0], this.yPos,
    this.dimensions.WIDTH, this.dimensions.HEIGHT);

  this.canvasCtx.drawImage(
    this.image, 
    this.sourceXPos[1], 0,
    this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
    this.xPos[1], this.yPos,
    this.dimensions.WIDTH, this.dimensions.HEIGHT);},

updateXPos: function(pos, increment) {
  let line1 = pos;
  let line2 = pos == 0 ? 1 : 0;
  this.xPos[line1] -= increment;
  this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
  if (this.xPos[line1] <= -this.dimensions.WIDTH) {
    this.xPos[line1] += this.dimensions.WIDTH * 2;
    this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
    this.sourceXPos[line1] = this.getRandomType();}},

update: function(deltaTime, speed) {
  let increment = Math.floor(speed * (FPS / 1000) * deltaTime);
  if (this.xPos[0] <= 0) {
    this.updateXPos(0, increment);
  } else {
    this.updateXPos(1, increment);}
  this.draw();},

reset: function() {
  this.xPos[0] = 0;
  this.xPos[1] = HorizonLine.dimensions.WIDTH;
}};

function Horizon(canvas, images, dimensions, gapCoefficient) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext('2d');
  this.config = Horizon.config;
  this.dimensions = dimensions;
  this.gapCoefficient = gapCoefficient;
  this.obstacles = [];
  this.horizonOffsets = [0, 0];
  this.clouds = [];
  this.cloudImg = images.CLOUD;
  this.cloudSpeed = this.config.BG_CLOUD_SPEED;
  this.horizonImg = images.HORIZON;
  this.horizonLine = null;
  this.obstacleImgs = {
    CACTUS_SMALL: images.CACTUS_SMALL,
    CACTUS_LARGE: images.CACTUS_LARGE
  };

  this.init();};

Horizon.config = {
  BG_CLOUD_SPEED: 0.2,
  BUMPY_THRESHOLD: .3,
  CLOUD_FREQUENCY: .5,
  HORIZON_HEIGHT: 16,
  MAX_CLOUDS: 6,
};

Horizon.prototype = {
  init: function() {
    this.addCloud();
    this.horizonLine = new HorizonLine(this.canvas, this.horizonImg);},

update: function(deltaTime, currentSpeed, updateObstacles) {
  this.runningTime += deltaTime;
  this.horizonLine.update(deltaTime, currentSpeed);
  this.updateClouds(deltaTime, currentSpeed);
  if (updateObstacles) {
    this.updateObstacles(deltaTime, currentSpeed);
  }},

updateClouds: function(deltaTime, speed) {
  let cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
  let numClouds = this.clouds.length;
  if (numClouds) {
    for (let i = numClouds - 1; i >= 0; i--) {
      this.clouds[i].update(cloudSpeed);}
    let lastCloud = this.clouds[numClouds - 1];

    if (numClouds < this.config.MAX_CLOUDS &&
        (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
        this.cloudFrequency > Math.random()) {
      this.addCloud();}

    this.clouds = this.clouds.filter(function(obj) {
      return !obj.remove;
    });}},

updateObstacles: function(deltaTime, currentSpeed) { 
  let updatedObstacles = this.obstacles.slice(0); 
  for (let i = 0; i < this.obstacles.length; i++) {
    let obstacle = this.obstacles[i];
    obstacle.update(deltaTime, currentSpeed);
    if (obstacle.remove) {
      updatedObstacles.shift();
    }
  }
  
  this.obstacles = updatedObstacles;
  if (this.obstacles.length > 0) {
    let lastObstacle = this.obstacles[this.obstacles.length - 1];
    if (lastObstacle && !lastObstacle.followingObstacleCreated &&
        lastObstacle.isVisible() &&
        (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) < this.dimensions.WIDTH) {
      this.addNewObstacle(currentSpeed);
      lastObstacle.followingObstacleCreated = true;
    }} else {
    this.addNewObstacle(currentSpeed);
  }},

addNewObstacle: function(currentSpeed) {
  let obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
  let obstacleType = Obstacle.types[obstacleTypeIndex];
  let obstacleImg = this.obstacleImgs[obstacleType.type];
  this.obstacles.push(new Obstacle(this.canvasCtx, obstacleType, obstacleImg, this.dimensions, this.gapCoefficient, currentSpeed));},
reset: function() {

  this.obstacles = [];
  this.horizonLine.reset();},
addCloud: function() {
  this.clouds.push(new Cloud(this.canvas, this.cloudImg, this.dimensions.WIDTH));
}};
})();

if (navigator.userAgent.toLowerCase().indexOf('') > -1) {
  new Runner('.wrapper');
} else {
  document.getElementById("").style.display="";
  if (navigator.userAgent.toLowerCase().indexOf('') <= -1) {
    hideClass(".dinogame");
  }}  