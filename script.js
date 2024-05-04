
(function() {// Создание фукнкции для работы игры
  function Runner(containerId, runnerConfig) { // Функция Runner принимает два параметра: containerId: id контейнера в котором будет отображаться игра, runnerConfig - настройки игры переданные в конструктор
    if (Runner.instance) // Проверка, существования образца Runner
        return Runner.instance; // Если существует возвращается
    else (Runner.instance = this); // Если не существует создаётся новый образец и сохраняется в Runner.instance

    this.elementContainer = document.querySelector(containerId);// Находит элемент по его id и присваивает ему значение
    this.config = runnerConfig || Runner.config; // Устанавливает конфигурацию игры и использует либо 
    this.dimensions = Runner.defaultSize;  // Задаем размеры игры по умолчанию
    // Инициализация переменных для хранения объектов игры и статистики
    this.distanceRun = 0; // Пройденное расстояние.
    this.highestScore = 0; // Самый высокий результат.
    // Рассчитываем время отрисовки каждого кадра
    this.msPerFrame = 1000 / FPS;
    // Устанавливаем начальную скорость игры
    this.currentSpeed = this.config.SPEED;
    // Изображения
    this.images = {};
    // Загрузка изображений для игры 
    this.loadImages();
  }

  // Запуск игры при загрузке страницы
  window['Runner'] = Runner;
  let DEFAULT_WIDTH = 600;  // Ширина игрового окна по умолчанию
  let FPS = 60;  // Количество кадров в секунду
  let IS_HIDPI = window.devicePixelRatio > 1;  // Флаг для проверки поддержки HiDPI (Retina)
  let IS_IOS = window.navigator.userAgent.indexOf('UIWebViewForStaticFileContent') > -1;  // Флаг для проверки, запущена ли игра на iOS
  let IS_MOBILE = window.navigator.userAgent.indexOf('Mobi') > -1 || IS_IOS;  // Флаг для проверки, запущена ли игра на мобильном устройстве
  
  Runner.config = {
    SPEED: 6,// Начальная скорость бега динозавра
    // Ускорение бега (величина, на которую увеличивается скорость бега)
    ACCELERATION: 0.001,
    // Максимальная скорость бега игрока
    MAX_SPEED: 12,
    // Гравитация, влияющая на скорость падения игрока
    GRAVITY: 0.6,
    // Начальная скорость прыжка игрока
    INITIAL_JUMP_VELOCITY: 12,
    // Минимальная высота прыжка игрока
    MIN_JUMP_HEIGHT: 35,
    // Коэффициент скорости для мобильных устройств
    MOBILE_SPEED_COEFFICIENT: 1.2,
    // Коэффициент, используемый для определения расстояния между препятствиями
    GAP_COEFFICIENT: 0.6,
    // Коэффициент снижения скорости после столкновения с препятствием
    SPEED_DROP_COEFFICIENT: 3,
    // Максимальное количество облаков на экране одновременно
    MAX_CLOUDS: 6,
    // Скорость облачного фона
    BG_CLOUD_SPEED: 0.2,
    // Частота появления облаков
    CLOUD_FREQUENCY: 0.5,
    // Максимальное количество блоков в препятствии
    MAX_OBSTACLE_LENGTH: 3,
    // Дополнительное расстояние между нижним краем игрового окна и нижним краем холста
    BOTTOM_PAD: 10,
    // Время задержки перед очисткой игровых объектов после окончания игры
    CLEAR_TIME: 3000,
    // Время задержки перед очисткой игровых объектов после отображения "GAME OVER"
    GAMEOVER_CLEAR_TIME: 750
  };
// Здесь задаются размеры игры
  Runner.defaultSize = {
    WIDTH: DEFAULT_WIDTH,  // Ширина игрового окна по умолчанию
    HEIGHT: 150            // Высота игрового окна по умолчанию
  };
  Runner.classes = {      // CSS класс для холста игры
    CONTAINER: 'runner-container',  // CSS класс для контейнера игры
    CRASHED: 'crashed',             // CSS класс для состояния "Игрок разбился"
    TOUCH_CONTROLLER: 'controller'  // CSS класс для сенсорного контроллера (на мобильных устройствах)
  };
// Набор изображений для препятствий в игре
Runner.imageSources = {
  HDPI: [  // Набор изображений
    {name: 'CACTUS_LARGE', id: 'largecactus'},  // Кактус большого размера
    {name: 'CACTUS_SMALL', id: 'smallcactus'},  // Кактус маленького размера
    {name: 'CLOUD', id: 'cloud'},              // Облако
    {name: 'HORIZON', id: 'horizon'},          // Горизонт
    {name: 'RESTART', id: 'restart'},          // Кнопка "Перезапустить"
    {name: 'TEXT_SPRITE', id: 'text'},         // Спрайт текста
    {name: 'DINO', id: 'dino'}                // Изображение игрока (динозавра)
  ]
};
// Звуки 

  Runner.keycodes = {
    JUMP: {'38': 1, '32': 1}, // Up, spacebar
    DUCK: {'40': 1}, // Down
    RESTART: {'13': 1} // Enter
    };
Runner.events = {
  ANIM_END: 'webkitAnimationEnd', // Событие окончания анимации
  CLICK: 'click', // Событие клика
  KEYDOWN: 'keydown', // Событие нажатия клавиши
  KEYUP: 'keyup', // Событие отпускания клавиши
  TOUCHSTART: 'touchstart', // Событие начала касания
};
Runner.prototype = {
  // Метод для обновления настроек конфигурации игры
  updateConfigSetting: function(setting, value) {
    // Проверка наличия настройки в конфигурации и наличия значения
    if (setting in this.config && value != undefined) {
      // Обновление значения настройки
      this.config[setting] = value;
      // Обновление настройки у персонажа T-Rex, если настройка связана с ним
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
      }}},
loadImages: function() {
  // Определение источников изображений в зависимости от типа экрана (HIDPI или LDPI)
  let imageSources = IS_HIDPI ? Runner.imageSources.HDPI : Runner.imageSources.LDPI;
  let numImages = imageSources.length;
  // Загрузка изображений и добавление их в объект this.images
  for (let i = numImages - 1; i >= 0; i--) {
    let imgSource = imageSources[i];
    this.images[imgSource.name] = document.getElementById(imgSource.id);}
  // Инициализация игры после загрузки изображений
  this.init();},

setSpeed: function(opt_speed) {},
init: function() {
  // Определение размеров игрового поля и скорости
  this.adjustDimensions();
  this.setSpeed();
  // Создание контейнера игры
  this.containerEl = document.createElement('div');
  // Создание холста игрока
  this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH, this.dimensions.HEIGHT, Runner.classes.PLAYER);
  this.canvasCtx = this.canvas.getContext('2d');
  this.canvasCtx.fillStyle = '#f7f7f7';
  this.canvasCtx.fill();
  Runner.updateCanvasScaling(this.canvas);
  // Создание горизонта (облака, препятствия, земля)
  this.horizon = new Horizon(this.canvas, this.images, this.dimensions, this.config.GAP_COEFFICIENT);
  // Создание дистанционного метра
  this.distanceMeter = new DistanceMeter(this.canvas, this.images.TEXT_SPRITE, this.dimensions.WIDTH);
  // Создание Ти-Рекса
  this.dino = new Dino(this.canvas, this.images.DINO);
  // Добавление контейнера игры на страницу
  this.elementContainer.appendChild(this.containerEl);
  // Создание контроллера для мобильных устройств
  if (IS_MOBILE) {
    this.createTouchController();}
  // Начало прослушивания событий
  this.startListening();
  // Обновление игры
  this.update();
  // Обработка изменения размера окна
  window.addEventListener(Runner.events.RESIZE, this.debounceResize.bind(this));},
adjustDimensions: function() {
this.resizeTimerId_ = null;
let boxStyles = window.getComputedStyle(this.elementContainer);
let padding = Number(boxStyles.paddingLeft.substr(0,
boxStyles.paddingLeft.length - 2));
this.dimensions.WIDTH = this.elementContainer.offsetWidth - padding * 2;
// Redraw the elements back onto the canvas.
},
// Метод для воспроизведения вступительной анимации.
playIntro: function() {
  if (!this.started && !this.crashed) {
    this.playingIntro = true;
    this.dino.playingIntro = true;

    // Определение CSS анимации.
    let keyframes = '@-webkit-keyframes intro { ' +
      'from { width:' + Dino.config.WIDTH + 'px }' +
      'to { width: ' + this.dimensions.WIDTH + 'px }' +
      '}';
    document.styleSheets[0].insertRule(keyframes, 0);

    // Начало игры после завершения анимации.
    this.containerEl.addEventListener(Runner.events.ANIM_END, this.startGame.bind(this));
    this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';

    // Добавление контроллера касаний, если он доступен.
    if (this.touchController) {
      this.elementContainer.appendChild(this.touchController);
    }

    // Установка флагов активации и начала игры.
    this.activated = true;
    this.started = true;
  } else if (this.crashed) {
    // Если игра закончилась, перезапускаем её.
    this.restart();
}},

// Метод для начала игры.
startGame: function() {
  // Сброс времени игры и флагов воспроизведения анимации.
  this.runningTime = 0;
  this.playingIntro = false;
  this.dino.playingIntro = false;
  this.playCount++;

  // Обработка случаев, когда игра теряет фокус.
  window.addEventListener(Runner.events.VISIBILITY, this.onVisibilityChange.bind(this));
  window.addEventListener(Runner.events.BLUR, this.onVisibilityChange.bind(this));
  window.addEventListener(Runner.events.FOCUS, this.onVisibilityChange.bind(this));
},

// Метод для очистки холста.
clearCanvas: function() {
  this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
},
update: function() {
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
// Первый прыжок запускает вступительную анимацию.
if (this.dino.jumpCount == 1 && !this.playingIntro) {
  this.playIntro();
}

// Если вступительная анимация воспроизводится, горизонт не движется.
if (this.playingIntro) {
  this.horizon.update(0, this.currentSpeed, hasObstacles);
} else {
  // Если игра не начата, deltaTime устанавливается в 0.
  deltaTime = !this.started ? 0 : deltaTime;
  // Обновление горизонта с учетом прошедшего времени, скорости игры и наличия препятствий.
  this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);
}

// Check for collisions.
let collision = hasObstacles &&
checkForCollision(this.horizon.obstacles[0], this.dino);
if (!collision) {
  this.distanceRun += this.currentSpeed * deltaTime / this.msPerFrame;
if (this.currentSpeed < this.config.MAX_SPEED) {
  this.currentSpeed += this.config.ACCELERATION;}
} else {
this.gameOver();}

if (this.distanceMeter.getActualDistance(this.distanceRun) >
  this.distanceMeter.maxScore) {
  this.distanceRun = 0;}
let playAcheivementSound = this.distanceMeter.update(deltaTime,
Math.ceil(this.distanceRun));
if (playAcheivementSound) {}}
if (!this.crashed) {
  this.dino.update(deltaTime);
  this.raq();}},
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
break;}
}.bind(this))(e.type, Runner.events);},
startListening: function() {

// Назначение обработчиков событий нажатия и отпускания клавиш на клавиатуре.
document.addEventListener(Runner.events.KEYDOWN, this);
document.addEventListener(Runner.events.KEYUP, this);
// Удаление обработчиков событий нажатия и отпускания кнопок мыши, если игра не для мобильных устройств.
if (!IS_MOBILE) {
  document.removeEventListener(Runner.events.MOUSEDOWN, this);
  document.removeEventListener(Runner.events.MOUSEUP, this);
}},
// Метод для обработки события нажатия клавиши.
onKeyDown: function(e) {
  // Проверка, что событие произошло не внутри элемента игры.
  if (e.target != this) {
    // Проверка, не завершилась ли игра и была ли нажата клавиша прыжка или произошло касание экрана.
    if (!this.crashed && (Runner.keycodes.JUMP[String(e.keyCode)] || e.type == Runner.events.TOUCHSTART)) {
      // Если игра еще не активирована, загружаем звуки и активируем игру.
      if (!this.activated) {
        this.activated = true;
      }
      // Если игрок не находится в процессе прыжка, начинаем прыжок.
      if (!this.dino.jumping) {
        this.dino.startJump();
      }
    }
  // Если игра завершена и произошло касание экрана внутри области игры, перезапускаем игру.
  if (this.crashed && e.type == Runner.events.TOUCHSTART && e.currentTarget == this.containerEl) {
    this.restart();
  }
}
// Если нажата клавиша ускоренного падения (Duck) и игрок находится в процессе прыжка, активируем ускоренное падение.
if (Runner.keycodes.DUCK[e.keyCode] && this.dino.jumping) {
  e.preventDefault();
  this.dino.setSpeedDrop();
}},
// Метод для обработки события отпускания клавиши.
onKeyUp: function(e) {
  let keyCode = String(e.keyCode);
  // Проверяем, была ли отпущена клавиша прыжка (Jump).
  let isJumpKey = Runner.keycodes.JUMP[keyCode] || e.type == Runner.events.TOUCHEND || e.type == Runner.events.MOUSEDOWN;

  // Если игра запущена и отпущена клавиша прыжка, завершаем прыжок игрока.
  if (this.isRunning() && isJumpKey) {
    this.dino.endJump();
} // Если отпущена клавиша ускоренного падения (Duck), сбрасываем флаг ускоренного падения.
else if (Runner.keycodes.DUCK[keyCode]) {
  this.dino.speedDrop = false;
} 
// Если игра завершена, проверяем, достаточно ли времени прошло перед повторным нажатием клавиши прыжка для перезапуска игры.
else if (this.crashed) {
  let deltaTime = getTimeStamp() - this.time;
  if (Runner.keycodes.RESTART[keyCode] ||
      (e.type == Runner.events.MOUSEUP && e.target == this.canvas) ||
      (deltaTime >= this.config.GAMEOVER_CLEAR_TIME && Runner.keycodes.JUMP[keyCode])) {
    this.restart();
  }
} 
// Если игра на паузе и отпущена клавиша прыжка, возобновляем игру.
else if (this.paused && isJumpKey) {
  this.play();
}
},
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
// Если панель окончания игры еще не создана, создаем новую.
if (!this.gameOverPanel) {
  this.gameOverPanel = new GameOverPanel(
    this.canvas,
    this.images.TEXT_SPRITE,
    this.images.RESTART,
    this.dimensions
  );
} 
// Если панель уже существует, обновляем ее.
else {
  this.gameOverPanel.draw();
}

// обновляется лучший счёт.
if (this.distanceRun > this.highestScore) {
  this.highestScore = Math.ceil(this.distanceRun);
  this.distanceMeter.setHighScore(this.highestScore);
}
// Сбрасывается время.
this.time = getTimeStamp();},
stop: function() {
this.activated = false;
this.paused = true;
cancelAnimationFrame(this.raqId);
this.raqId = 0;},
play: function() {
if (!this.crashed) {
  this.activated = true;
  this.paused = false;
  this.dino.update(0, Dino.status.RUNNING);
  this.time = getTimeStamp();
  this.update();
}},
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
  this.update();}},

onVisibilityChange: function(e) {
if (document.hidden || document.webkitHidden || e.type == 'blur') {
this.stop();
} else {
this.play();}},
};
Runner.updateCanvasScaling = function(canvas, opt_width, opt_height) {
let context = canvas.getContext('2d');

// Создаются соотношения пикселей соотношения пикселей
let devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
let backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
let ratio = devicePixelRatio / backingStoreRatio;

// Увеличение масштаба игры, если соотношения не совпадают
if (devicePixelRatio !== backingStoreRatio) {
let oldWidth = opt_width || canvas.width;
let oldHeight = opt_height || canvas.height;
canvas.width = oldWidth * ratio;
canvas.height = oldHeight * ratio;
canvas.style.width = oldWidth + 'px';
canvas.style.height = oldHeight + 'px';

// Масштабирование
context.scale(ratio, ratio);
return true;}
return false;};
function getRandomNum(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;}
function vibrate(duration) {
if (IS_MOBILE && window.navigator.vibrate) {
window.navigator.vibrate(duration);}}
function createCanvas(container, width, height, opt_classname) {
let canvas = document.createElement('canvas');
canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
opt_classname : Runner.classes.CANVAS;
canvas.width = width;
canvas.height = height;
container.appendChild(canvas);
return canvas;}
function decodeBase64ToArrayBuffer(base64String) {
let len = (base64String.length / 4) * 3;
let str = atob(base64String);
let arrayBuffer = new ArrayBuffer(len);
let bytes = new Uint8Array(arrayBuffer);
for (let i = 0; i < len; i++) {
bytes[i] = str.charCodeAt(i);}
return bytes.buffer;}
function getTimeStamp() {
return IS_IOS ? new Date().getTime() : performance.now();}
function GameOverPanel(canvas, textSprite, restartImg, dimensions) {
this.canvas = canvas;
this.canvasCtx = canvas.getContext('2d');
this.canvasDimensions = dimensions;
this.textSprite = textSprite;
this.restartImg = restartImg;
this.draw();};
GameOverPanel.dimensions = {
TEXT_X: 0,
TEXT_Y: 13,
TEXT_WIDTH: 191,
TEXT_HEIGHT: 11,
RESTART_WIDTH: 36,
RESTART_HEIGHT: 32};
GameOverPanel.prototype = {
updateDimensions: function(width, opt_height) {
this.canvasDimensions.WIDTH = width;
if (opt_height) {
  this.canvasDimensions.HEIGHT = opt_height;}},
draw: function() {
let dimensions = GameOverPanel.dimensions;
let centerX = this.canvasDimensions.WIDTH / 2;

//Текст Game over.
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
let restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
let restartTargetY = this.canvasDimensions.HEIGHT / 2;
if (IS_HIDPI) {
textSourceY *= 2;
textSourceX *= 2;
textSourceWidth *= 2;
textSourceHeight *= 2;
restartSourceWidth *= 2;
restartSourceHeight *= 2;}

this.canvasCtx.drawImage(
  this.textSprite,                  // Изображение спрайта, содержащего текст "Game Over"
  textSourceX, textSourceY,        // Исходные координаты и размеры текста на спрайте
  textSourceWidth, textSourceHeight,
  textTargetX, textTargetY,        // Координаты и размеры, куда будет отрисован текст на холсте
  textTargetWidth, textTargetHeight
);
}};
function checkForCollision(obstacle, dino, opt_canvasCtx) {

// Создание объекта dinoBox для ограничивающей рамки T-Rex
let dinoBox = new CollisionBox(
  dino.xPos + 1,                  // x-координата верхнего левого угла рамки T-Rex
  dino.yPos + 1,                  // y-координата верхнего левого угла рамки T-Rex
  dino.config.WIDTH - 2,          // Ширина рамки T-Rex
  dino.config.HEIGHT - 2           // Высота рамки T-Rex
);

// Создание объекта obstacleBox для ограничивающей рамки препятствия
let obstacleBox = new CollisionBox(
  obstacle.xPos + 1, // x-координата верхнего левого угла рамки препятствия
  obstacle.yPos + 1, // y-координата верхнего левого угла рамки препятствия
  obstacle.typeConfig.width * obstacle.size - 2, // Ширина рамки препятствия
  obstacle.typeConfig.height - 2 // Высота рамки препятствия
);

/// Отладочное отображение внешних рамок
if (opt_canvasCtx) {
  drawCollisionBoxes(opt_canvasCtx, dinoBox, obstacleBox);
}

// Простая проверка внешних границ.
if (boxCompare(dinoBox, obstacleBox)) {
  // В случае столкновения, получаем внутренние рамки препятствия и T-Rex
  let collisionBoxes = obstacle.collisionBoxes;         // Внутренние рамки препятствия
  let dinoCollisionBoxes = Dino.collisionBoxes; 
  
// Изменение положения
for (let t = 0; t < dinoCollisionBoxes.length; t++) {
for (let i = 0; i < collisionBoxes.length; i++) {

let adjDinoBox =
createAdjustedCollisionBox(dinoCollisionBoxes[t], dinoBox);
let adjObstacleBox =
createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
let crashed = boxCompare(adjDinoBox, adjObstacleBox);

// Рисование полей
if (opt_canvasCtx) {
drawCollisionBoxes(opt_canvasCtx, adjDinoBox, adjObstacleBox);}
if (crashed) {
return [adjDinoBox, adjObstacleBox];}}}}
return false;};
function createAdjustedCollisionBox(box, adjustment) {
return new CollisionBox(
box.x + adjustment.x,
box.y + adjustment.y,
box.width,
box.height);};
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

// Ограничивает и выравнивает рамки по оси
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

// Разрешить изменение размера только если игра находится на правильной скорости.
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

this.groundYPos = 0; // Положение персонажа на земле. Переменная groundYPos используется для хранения вертикальной позиции персонажа на экране.
this.currentFrame = 0; //Переменная currentFrame используется для хранения текущего кадра анимации персонажа.
this.currentAnimFrames = []; // currentAnimFrames - это массив, который будет содержать кадры анимации для текущего действия персонажа
this.blinkDelay = 0; // blinkDelay это задержка между морганиями персонажа. Вероятно, это используется для анимации глаз или чего-то подобного.
this.animStartTime = 0; // animStartTime используется для хранения времени начала текущей анимации.
this.timer = 0; // timer это таймер, который будет использоваться для отслеживания времени анимации.
this.msPerFrame = 1000 / FPS; // msPerFrame содержит количество миллисекунд, которое должно пройти между кадрами анимации. FPS вероятно, обозначает количество кадров в секунду (Frames Per Second), поэтому msPerFrame задает количество миллисекунд на каждый кадр, основываясь на FPS.
this.config = Dino.config; // config - это объект конфигурации, вероятно, содержащий различные настройки для персонажа, такие как скорость, размеры и т. д. Похоже, что эти настройки загружаются из объекта Dino.config.


// Текущий статус status.
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

// Обновление статуса.
if (opt_status) {
  this.status = opt_status;
  this.currentFrame = 0;
  this.msPerFrame = Dino.animFrames[opt_status].msPerFrame;
  this.currentAnimFrames = Dino.animFrames[opt_status].frames;
if (opt_status === Dino.status.WAITING) {
  this.animStartTime = getTimeStamp();
  this.setBlinkDelay();
}}

// Анимация вступления в игру, динозавр приближается слева.
if (this.playingIntro && this.xPos < this.config.START_X_POS) {
  this.xPos += Math.round((this.config.START_X_POS /
  this.config.INTRO_DURATION) * deltaTime);}
if (this.status === Dino.status.WAITING) {
  this.blink(getTimeStamp());
} else {
  this.draw(this.currentAnimFrames[this.currentFrame], 0);}

// Обновление положение кадра.
if (this.timer >= this.msPerFrame) {
  this.currentFrame = this.currentFrame ==
  this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
  this.timer = 0;}},
draw: function(x, y) {
let sourceX = x;
let sourceY = y;
let sourceWidth = this.config.WIDTH;
let sourceHeight = this.config.HEIGHT;

// Динозавр
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
  
// Устанавливаем задержки для мигания.
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

  // Ускорение прыжка заставляет динозавра прыгать быстрее.
  if (this.speedDrop) {this.yPos += Math.round(this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed);} 
  else {this.yPos += Math.round(this.jumpVelocity * framesElapsed);}
  this.jumpVelocity += this.config.GRAVITY * framesElapsed;
  // Достигнута минимальная высота.
  if (this.yPos < this.minJumpHeight || this.speedDrop) {this.reachedMinHeight = true;}
  // Достигнута максимальная высота.
  if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {this.endJump();}
  // Ти-рекс вернулся на уровень земли. Прыжок завершен.
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
function DistanceMeter(canvas, spriteSheet, canvasWidth) {
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
  // Количество цифр.
  MAX_DISTANCE_UNITS: 5,
  // Дистанция, при достижении которой запускается анимация.
  ACHIEVEMENT_DISTANCE: 100,
  // Коэффициент конвертации пикселей в единицы измерения.
  COEFFICIENT: 0.025,
  // Длительность вспышки в миллисекундах.
  FLASH_DURATION: 1000 / 4,
  // Количество вспышек для анимации достижения.
  FLASH_ITERATIONS: 3
};
DistanceMeter.prototype = {
init: function(width) {
  let maxDistanceStr = ''; // Строка для максимальной дистанции
  this.calcXPos(width); // Вычисляем позицию X на холсте
  this.maxScore = this.config.MAX_DISTANCE_UNITS; // Максимальное количество цифр
  // Отрисовывание '00000' на холсте
  for (let i = 0; i < this.config.MAX_DISTANCE_UNITS; i++) {
    this.draw(i, 0);
    this.defaultString += '0'; // Строка по умолчанию
    maxDistanceStr += '9'; // Максимальная дистанция
  }
  // Вычисление максимального счет
  this.maxScore = parseInt(maxDistanceStr);
},
calcXPos: function(canvasWidth) {
  // Устанавливаем позицию X
  this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH * (this.config.MAX_DISTANCE_UNITS + 1));},
draw: function(digitPos, value, opt_highScore) {
  let sourceWidth = DistanceMeter.dimensions.WIDTH;
  let sourceHeight = DistanceMeter.dimensions.HEIGHT;
  let sourceX = DistanceMeter.dimensions.WIDTH * value;
  let targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
  let targetY = this.y;
  let targetWidth = DistanceMeter.dimensions.WIDTH;
  let targetHeight = DistanceMeter.dimensions.HEIGHT;
// Для высокого DPI увеличивание размеров в 2 раза.
if (IS_HIDPI) {
  sourceWidth *= 2;
  sourceHeight *= 2;
  sourceX *= 2;
}

this.canvasCtx.save();
if (opt_highScore) {
  // Вывод слева от текущего счета.
  let highScoreX = this.x - (this.config.MAX_DISTANCE_UNITS * 2) * DistanceMeter.dimensions.WIDTH;
  this.canvasCtx.translate(highScoreX, this.y);
} else {
  this.canvasCtx.translate(this.x, this.y);
}
// Отрисовка изображения
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
  let paint = true; // Флаг для отрисовки
  if (!this.acheivement) {
    distance = this.getActualDistance(distance); // Преобразуем расстояние в актуальную дистанцию
    if (distance > 0) {
      // Если достигнуто достижение
      if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
        // Мигаем результатом и воспроизводим звук
        this.acheivement = true;
        this.flashTimer = 0;
      }

// Создаем строковое представление дистанции с ведущими нулями.
let distanceStr = (this.defaultString + distance).substr(-this.config.MAX_DISTANCE_UNITS);
// Разбиваем строку на массив цифр
this.digits = distanceStr.split('');
} else {
// Используем строку по умолчанию
this.digits = this.defaultString.split('');}
} else {
// Контроль мигания счета при достижении достижения.
if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
  this.flashTimer += deltaTime;
  // Переключение мигания
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
// Отрисовка цифр, если не мигает.
if (paint) {
  // Отрисовка каждой цифры
  for (let i = this.digits.length - 1; i >= 0; i--) {
    this.draw(i, parseInt(this.digits[i]));
  }
}
// Отрисовка рекордного значения
this.drawHighScore();
// Возвращаем флаг проигрывания звука достижения
},
drawHighScore: function() {
  this.canvasCtx.save();
  this.canvasCtx.globalAlpha = 0.8;
  // Отрисовка каждой цифры рекорда
  for (let i = this.highScore.length - 1; i >= 0; i--) {
    this.draw(i, parseInt(this.highScore[i], 10), true);}
  this.canvasCtx.restore();},
setHighScore: function(distance) {
  // Преобразуем расстояние в строку и дополняем нулями слева
  distance = this.getActualDistance(distance);
  let highScoreStr = (this.defaultString + distance).substr(this.config.MAX_DISTANCE_UNITS);
  // Устанавливаем рекордное значение в виде массива
  this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
},
// Сбрасывает показания дистанции на '00000'.
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
  HEIGHT: 14, // Высота облака
  MAX_CLOUD_GAP: 400, // Максимальный промежуток между облаками
  MAX_SKY_LEVEL: 30,  // Максимальный уровень облаков
  MIN_CLOUD_GAP: 100, // Минимальный промежуток между облаками
  MIN_SKY_LEVEL: 71,  // Минимальный уровень облаков
  WIDTH: 46 // Ширина облака
};
Cloud.prototype = {
init: function() {
  // Устанавливание высоты облака случайным образом
  this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL, Cloud.config.MIN_SKY_LEVEL);
  // Отрисовывание облако
  this.draw();
},
draw: function() {
  this.canvasCtx.save();
  let sourceWidth = Cloud.config.WIDTH;
  let sourceHeight = Cloud.config.HEIGHT;
  // Увеличивание размеры изображения для HiDPI
  if (IS_HIDPI) {
    sourceWidth = sourceWidth * 2;
    sourceHeight = sourceHeight * 2;
  }

  // Отрисовка облака на холсте
  this.canvasCtx.drawImage(
    this.image, // Изображение облака
    0, 0,       // Координаты и размеры области источника
    sourceWidth, sourceHeight,
    this.xPos, this.yPos,  // Координаты и размеры области приемника
    Cloud.config.WIDTH, Cloud.config.HEIGHT);
  this.canvasCtx.restore();},
update: function(speed) {
  // Проверка, нужно ли обновлять позицию облака
  if (!this.remove) {
    // Обновление позиции по оси X
    this.xPos -= Math.ceil(speed);
    // Отрисовка облака
    this.draw();
    // Помечание облака удалённым, если оно больше не видно на экране
    if (!this.isVisible()) {
      this.remove = true;
    }}},

//Проверяет, видимо ли облако на экране.
isVisible: function() {
  return this.xPos + Cloud.config.WIDTH > 0;
}};
// Линия горизонта.
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
//Размеры линии горизонта.
HorizonLine.dimensions = {
  WIDTH: 600,   // Ширина
  HEIGHT: 12,   // Высота
  YPOS: 127     // Позиция по оси Y
};

HorizonLine.prototype = {
// Устанавливание размеры исходного изображения линии горизонта.
setSourceDimensions: function() {
  // Установка размеров исходного изображения в зависимости от DPI
  for (let dimension in HorizonLine.dimensions) {
    if (IS_HIDPI) {
      if (dimension !== 'YPOS') {
        this.sourceDimensions[dimension] = HorizonLine.dimensions[dimension] * 2;
      }} else {
      this.sourceDimensions[dimension] = HorizonLine.dimensions[dimension];}
    this.dimensions[dimension] = HorizonLine.dimensions[dimension];}
  this.xPos = [0, HorizonLine.dimensions.WIDTH];
  this.yPos = HorizonLine.dimensions.YPOS;},

// Возвращает позицию обрезки по оси X для определенного типа линии.
getRandomType: function() {
  return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;},
// Отрисовка линии горизонта.
draw: function() {
  // Отрисовка первой части линии
  this.canvasCtx.drawImage(
    this.image, 
    this.sourceXPos[0], 0,
    this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
    this.xPos[0], this.yPos,
    this.dimensions.WIDTH, this.dimensions.HEIGHT);
  // Отрисовка второй части линии
  this.canvasCtx.drawImage(
    this.image, 
    this.sourceXPos[1], 0,
    this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
    this.xPos[1], this.yPos,
    this.dimensions.WIDTH, this.dimensions.HEIGHT);},

//Обновление позиции по оси X для отдельной части линии.
updateXPos: function(pos, increment) {
  let line1 = pos;
  let line2 = pos == 0 ? 1 : 0;
  // Обновляем позицию линии
  this.xPos[line1] -= increment;
  this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
  // Проверяем, вышла ли линия за пределы холста
  if (this.xPos[line1] <= -this.dimensions.WIDTH) {
    // Перемещаем линию за пределы холста
    this.xPos[line1] += this.dimensions.WIDTH * 2;
    this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
    // Обновляем тип линии
    this.sourceXPos[line1] = this.getRandomType();}},
//Обновление линии горизонта.
update: function(deltaTime, speed) {
  // Вычисляем приращение для перемещения линии горизонта
  let increment = Math.floor(speed * (FPS / 1000) * deltaTime);
  // Обновляем позицию линии горизонта
  if (this.xPos[0] <= 0) {
    this.updateXPos(0, increment);
  } else {
    this.updateXPos(1, increment);}
  // Отрисовываем линию горизонта
  this.draw();},
// Сброс позиции линии горизонта в начальную позицию.
reset: function() {
  this.xPos[0] = 0;
  this.xPos[1] = HorizonLine.dimensions.WIDTH;
}};

// Класс для заднего фона горизонта.
function Horizon(canvas, images, dimensions, gapCoefficient) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext('2d');
  this.config = Horizon.config;
  this.dimensions = dimensions;
  this.gapCoefficient = gapCoefficient;
  this.obstacles = [];
  this.horizonOffsets = [0, 0];
  // Облака
  this.clouds = [];
  this.cloudImg = images.CLOUD;
  this.cloudSpeed = this.config.BG_CLOUD_SPEED;
  // Горизонт
  this.horizonImg = images.HORIZON;
  this.horizonLine = null;
  // Препятствия
  this.obstacleImgs = {
    CACTUS_SMALL: images.CACTUS_SMALL,
    CACTUS_LARGE: images.CACTUS_LARGE
  };
  this.init();};

Horizon.config = {
  BG_CLOUD_SPEED: 0.2, // Скорость движения облачного фона
  BUMPY_THRESHOLD: .3, // Порог "неровности" для горизонта
  CLOUD_FREQUENCY: .5, // Частота появления облаков
  HORIZON_HEIGHT: 16, // Высота горизонта
  MAX_CLOUDS: 6, // Максимальное количество облаков
};

Horizon.prototype = {
  // Инициализация горизонта. Добавляется линия и облако, без препятствий.
  init: function() {
    // Добавление облака
    this.addCloud();
    // Создание линии горизонта
    this.horizonLine = new HorizonLine(this.canvas, this.horizonImg);},
//Обновление состояния игры
update: function(deltaTime, currentSpeed, updateObstacles) {
  // Увеличение времени игры
  this.runningTime += deltaTime;
  // Обновление горизонта
  this.horizonLine.update(deltaTime, currentSpeed);
  // Обновление состояния облаков
  this.updateClouds(deltaTime, currentSpeed);
  // Если флаг updateObstacles установлен в true, обновляем препятствия
  if (updateObstacles) {
    this.updateObstacles(deltaTime, currentSpeed);
  }},
// Обновление состояния облаков
updateClouds: function(deltaTime, speed) {
  // Вычисляем скорость перемещения облаков
  let cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
  let numClouds = this.clouds.length;
  // Если есть облака на экране
  if (numClouds) {
    // Обновляем каждое облако
    for (let i = numClouds - 1; i >= 0; i--) {
      this.clouds[i].update(cloudSpeed);}
    let lastCloud = this.clouds[numClouds - 1];
    // Проверяем, нужно ли добавить новое облако
    if (numClouds < this.config.MAX_CLOUDS &&
        (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
        this.cloudFrequency > Math.random()) {
      this.addCloud();}
    // Удаляем удаленные облака из массива
    this.clouds = this.clouds.filter(function(obj) {
      return !obj.remove;
    });}},

updateObstacles: function(deltaTime, currentSpeed) {  // Метод принимает deltaTime (время, прошедшее с последнего обновления) и currentSpeed (текущая скорость игры) в качестве аргументов
  let updatedObstacles = this.obstacles.slice(0); //Создается копия массива obstacles, чтобы обновлять его без изменения оригинального массива.
  // Обновляем каждое препятствие в массиве
  for (let i = 0; i < this.obstacles.length; i++) {
    let obstacle = this.obstacles[i];
    obstacle.update(deltaTime, currentSpeed);
    // Удаляем препятствия, которые уже прошли игрока
    if (obstacle.remove) {
      updatedObstacles.shift();
    }
  }
  
  this.obstacles = updatedObstacles;
  // Проверяем, нужно ли добавить новое препятствие
  if (this.obstacles.length > 0) {
    let lastObstacle = this.obstacles[this.obstacles.length - 1];
    if (lastObstacle && !lastObstacle.followingObstacleCreated &&
        lastObstacle.isVisible() &&
        (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) < this.dimensions.WIDTH) {
      this.addNewObstacle(currentSpeed);
      lastObstacle.followingObstacleCreated = true;
    }} else {
    // Если нет препятствий, создаем новое
    this.addNewObstacle(currentSpeed);
  }},

addNewObstacle: function(currentSpeed) {
  // Получение случайного типа препятствия
  let obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
  let obstacleType = Obstacle.types[obstacleTypeIndex];
  // Получение изображения для препятствия
  let obstacleImg = this.obstacleImgs[obstacleType.type];
  // Создание и добавление нового препятствия в массив
  this.obstacles.push(new Obstacle(this.canvasCtx, obstacleType, obstacleImg, this.dimensions, this.gapCoefficient, currentSpeed));},
// Метод для сброса игры в начальное состояние
reset: function() {
  // Очистка массива препятствий
  this.obstacles = [];
  // Сброс горизонтальной линии
  this.horizonLine.reset();},
// Метод для добавления облака в игру
addCloud: function() {
  // Создание нового экземпляра облака и добавление его в массив облаков
  this.clouds.push(new Cloud(this.canvas, this.cloudImg, this.dimensions.WIDTH));
}};
})();

// Проверка наличия строки в userAgent
if (navigator.userAgent.toLowerCase().indexOf('') > -1) {
  // Если строка присутствует, создаем экземпляр игры 
  new Runner('.wrapper');
} else {
  // Если строка отсутствует, отображается элемент и скрывается игру
  document.getElementById("").style.display="";
  // Проверяка, отсутствует ли строка в userAgent
  if (navigator.userAgent.toLowerCase().indexOf('') <= -1) {
    // Если строка отсутствует, скрываются элементы с классом "dinogame"
    hideClass(".dinogame");
  }}