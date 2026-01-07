Math.TAU = Math.PI * 2;

///// LOAD IMAGES /////

var assetsCallback;
var onLoadAssets = function (callback) {
	assetsCallback = callback;
	if (assetsLeft == 0) assetsCallback();
};
var assetsLeft = 0;
var onAssetLoaded = function () {
	assetsLeft--;
	if (assetsLeft == 0) assetsCallback();
};
var images = {};
function addAsset(name, src) {
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onAssetLoaded;
	images[name].onerror = onAssetLoaded; // 即使加载失败也继续，防止卡死
	images[name].src = src;
}
function addSound(name, src) {
	assetsLeft++;
	createjs.Sound.addEventListener("fileload", onAssetLoaded);
	createjs.Sound.addEventListener("fileerror", onAssetLoaded); // 错误处理
	createjs.Sound.registerSound({ src: src, id: name });
}

//////////////

function Level(config, isIntro) {

	var self = this;
	self.isIntro = isIntro;
	self.config = config;

	self.circles = config.circles;
	self.arcs = config.arcs || []; // 弧形障碍物
	self.lines = config.lines || []; // 直线障碍物
	self.player = new Peep(config.player, self);

	self.keys = [];
	if (config.keys) {
		for (var i = 0; i < config.keys.length; i++) {
			self.keys.push(new DoorKey(config.keys[i], self));
		}
	} else if (config.key) {
		self.keys.push(new DoorKey(config.key, self));
	}

	self.door = new Door(config.door, self);
	self.clock = new Clock(config.countdown, self);

	self.canvas = config.canvas || document.getElementById(config.canvasId);
	self.ctx = self.canvas.getContext('2d');
	self.width = self.canvas.width;

	if (self.isIntro) {
		self.height = self.canvas.height;
	} else {
		self.height = self.canvas.height - 80;
	}

	self.pathCanvas = document.createElement("canvas");
	self.pathCanvas.width = self.width;
	self.pathCanvas.height = self.height;
	self.pathContext = self.pathCanvas.getContext('2d');
	self.DRAW_PATH = false;

	self.keyCollected = false;
	self.update = function () {

		self.player.update();
		for (var i = 0; i < self.keys.length; i++) self.keys[i].update();

		// Sequential Keys Logic - 支持多把钥匙顺序显示
		if (self.config.sequentialKeys && self.keys.length > 1) {
			for (var i = 0; i < self.keys.length - 1; i++) {
				// 如果当前钥匙已收集，且下一把钥匙还未显示，则显示下一把钥匙
				if (self.keys[i].collected && !self.keys[i + 1].visible) {
					self.keys[i + 1].visible = true;
					createjs.Sound.play("ding");
					break; // 一次只显示一把新钥匙
				}
			}
		}

		var output = self.door.update();
		if (self.isIntro) {
			STAGE = 1;
		} else {
			if (output == "END_LEVEL") {
				self.ctx.clearRect(0, self.height, self.canvas.width, 80);
			} else {
				self.clock.update();
			}
			self.recordFrame();
		}

	};

	self.drawPathLastPoint = null;
	self.draw = function () {

		var ctx = self.ctx;

		// BIGGER EVERYTHING
		if (self.isIntro) {
			ctx.save();
			var introScale = 1.5;
			ctx.scale(introScale, introScale);
			ctx.translate(-self.width / 2, -self.height / 2);
			ctx.translate((self.width / 2) / introScale, (self.height / 2) / introScale);
		}

		// Clear
		if (self.isIntro) {
			ctx.clearRect(self.player.x - 100, self.player.y - 100, 200, 200);
			for (var i = 0; i < self.keys.length; i++) ctx.clearRect(self.keys[i].x - 100, self.keys[i].y - 100, 200, 200);
			ctx.clearRect(self.door.x - 100, self.door.y - 100, 200, 200);
		} else {
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, self.width, self.height);
		}

		// Draw shadows
		var objects = [self.player, self.door].concat(self.keys);
		for (var i = 0; i < objects.length; i++) {
			objects[i].drawShadow(ctx);
		}

		// Draw circles
		ctx.fillStyle = '#333';
		for (var i = 0; i < self.circles.length; i++) {
			var c = self.circles[i];
			if (c.invisible) continue;
			ctx.beginPath();
			ctx.arc(c.x, c.y, c.radius, 0, Math.TAU, false);
			ctx.fill();
		}

		// Draw arcs (弧形障碍物 - 已隐藏)
		/*
		ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
		ctx.lineWidth = 10;
		for (var i = 0; i < self.arcs.length; i++) {
			var arc = self.arcs[i];
			ctx.beginPath();
			ctx.arc(arc.cx, arc.cy, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise || false);
			ctx.stroke();
		}

		// Draw lines (直线障碍物 - 已隐藏)
		ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
		ctx.lineWidth = 10;
		for (var i = 0; i < self.lines.length; i++) {
			var line = self.lines[i];
			ctx.beginPath();
			ctx.moveTo(line.x1, line.y1);
			ctx.lineTo(line.x2, line.y2);
			ctx.stroke();
		}
		*/

		// Draw Peep, Key, Door in depth
		objects.sort(function (a, b) { return a.y - b.y; });
		for (var i = 0; i < objects.length; i++) {
			// 在正常游戏模式下，非当前关卡隐藏玩家，保持轮廓纯净
			if (STAGE == 1 && window.level !== self && objects[i] instanceof Peep) continue;
			objects[i].draw(ctx);
		}

		// Draw path?
		if (self.DRAW_PATH) {
			ctx.drawImage(self.pathCanvas, 0, 0);

			if (!self.drawPathLastPoint) {
				self.drawPathLastPoint = {
					x: self.player.x - 0.1,
					y: self.player.y
				};
			}

			var pctx = self.pathContext;
			pctx.beginPath();
			pctx.strokeStyle = "#cc2727";
			pctx.lineWidth = 10;
			pctx.lineCap = "round";
			pctx.lineJoin = "round";
			pctx.moveTo(self.drawPathLastPoint.x, self.drawPathLastPoint.y);
			pctx.lineTo(self.player.x, self.player.y);
			pctx.stroke();

			self.drawPathLastPoint = {
				x: self.player.x,
				y: self.player.y
			};

		}

		// CLOCK
		if (self.isIntro) {
		} else {
			ctx.clearRect(0, self.height, self.canvas.width, 80);
			// 只有当前关卡才绘制始终，避免 5 个始终同时出现引起混乱
			if (!self.NO_CLOCK && window.level === self && STAGE == 1) self.clock.draw(ctx);
		}

		// BIGGER EVERYTHING
		if (self.isIntro) {
			ctx.restore();
		}

	};

	self.frames = [];
	self.recordFrame = function () {

		var frame = {
			player: {
				x: self.player.x,
				y: self.player.y,
				sway: self.player.sway,
				bounce: self.player.bounce,
				frame: self.player.frame,
				direction: self.player.direction
			},
			keys: self.keys.map(function (k) {
				return {
					hover: k.hover,
					collected: k.collected
				};
			}),
			door: {
				frame: self.door.frame
			},
			keyCollected: self.keyCollected
		};

		self.frames.push(frame);

	}

	var lastCollected = false;
	self.playbackFrame = function (frameIndex, noDraw) {

		var frame = self.frames[frameIndex];

		self.player.x = frame.player.x;
		self.player.y = frame.player.y;
		self.player.sway = frame.player.sway;
		self.player.bounce = frame.player.bounce;
		self.player.frame = frame.player.frame;
		self.player.direction = frame.player.direction;

		for (var i = 0; i < self.keys.length; i++) {
			self.keys[i].hover = frame.keys[i].hover;
			self.keys[i].collected = frame.keys[i].collected;
		}
		self.door.frame = frame.door.frame;

		self.keyCollected = frame.keyCollected;
		// 重新放映时播放开门音效，但音量降低
		if (self.keyCollected && !lastCollected && STAGE == 3) {
			createjs.Sound.play("unlock", { volume: 0.3 });
		}
		lastCollected = self.keyCollected;

		self.NO_CLOCK = true;
		if (!noDraw) self.draw();

	}

	self.clear = function () {
		var ctx = self.ctx;
		ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
	}

	self.onlyPath = function () {
		self.clear();
		self.ctx.drawImage(self.pathCanvas, 0, 0);
	}

}

//////////////

function Clock(countdown, level) {

	var self = this;
	self.level = level;
	// countdown是秒数，游戏运行在30 FPS
	// 时钟有30帧动画，需要在countdown秒内走完
	// framePerTick = 30帧 / (countdown秒 * 30帧/秒) = 1 / countdown
	self.framePerTick = 1 / countdown;

	var enterSide = null;
	var exitSide = null;

	self.update = function () {

		// THIS IS TOTALLY A HACK, JUST FOR LEVEL 2
		// SUBTLY CHEAT - IT'S IMPOSSIBLE TO SOLVE IT THE WRONG WAY

		if (CURRENT_LEVEL == 3) {
			if (level.keyCollected) {
				if (!exitSide && Math.abs(level.player.x - 150) > 30) {
					exitSide = (level.player.x < 150) ? "left" : "right";
				}
			} else {
				if (!enterSide && level.player.y < 150) {
					enterSide = (level.player.x < 150) ? "left" : "right";
				}
			}
			if (exitSide && enterSide) {
				if (exitSide == enterSide) {
					self.frame += self.framePerTick * 1.8;
				}
			}
		}

		// Normal update

		self.frame += self.framePerTick;
		if (self.frame >= 30) {
			// 倒计时结束，重置关卡
			createjs.Sound.play("error");
			reset();
		}

	};

	self.frame = 0;
	self.draw = function (ctx) {

		ctx.save();
		ctx.translate(level.width / 2, level.height + 40);

		var f = Math.floor(self.frame);
		var sw = 82;
		var sh = 82;
		var sx = (f * sw) % images.clock.width;
		var sy = sh * Math.floor((f * sw) / images.clock.width);
		ctx.drawImage(images.clock, sx, sy, sw, sh, -30, -30, 60, 60);
		ctx.restore();

	};

}

function DoorKey(config, level) {

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;

	self.visible = (config.visible !== undefined) ? config.visible : true;
	self.hover = 0;
	self.collected = false;

	self.update = function () {

		if (!self.visible || self.collected) return;

		self.hover += 0.07;

		var dx = self.x - level.player.x;
		var dy = self.y - level.player.y;
		var distance = Math.sqrt(dx * dx / 4 + dy * dy);
		if (distance < 20) {
			self.collected = true;
			createjs.Sound.play("unlock");

			// Check if all keys collected
			var allCollected = true;
			for (var i = 0; i < level.keys.length; i++) {
				if (!level.keys[i].collected) {
					allCollected = false;
					break;
				}
			}
			if (allCollected) {
				level.keyCollected = true;
			}

		}

	};

	self.draw = function (ctx) {

		if (!self.visible || self.collected) return;

		ctx.save();
		ctx.translate(self.x, self.y - 20 - Math.sin(self.hover) * 5);
		ctx.scale(0.7, 0.7);
		ctx.drawImage(images.key, -23, -14, 47, 28);
		ctx.restore();

	};
	self.drawShadow = function (ctx) {

		if (!self.visible || self.collected) return;

		ctx.save();
		ctx.translate(self.x, self.y);
		ctx.scale(0.7, 0.7);

		var scale = 1 - Math.sin(self.hover) * 0.5;
		ctx.scale(1 * scale, 0.3 * scale);
		ctx.beginPath();
		ctx.arc(0, 0, 15, 0, Math.TAU, false);
		ctx.fillStyle = 'rgba(100,100,100,0.4)';
		ctx.fill();
		ctx.restore();

	};

}

function Door(config, level) {

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;

	self.update = function () {

		if (level.keyCollected && self.frame < 10) {
			self.frame += 0.5;
		}

		if (level.keyCollected) {
			var dx = self.x - level.player.x;
			var dy = self.y - level.player.y;
			var distance = Math.sqrt(dx * dx / 25 + dy * dy);
			if (distance < 10) {
				if (level.isIntro) {

					document.getElementById("whole_container").style.top = "-100%";

					createjs.Sound.play("ding");

					CURRENT_LEVEL = 0;
					var lvl = new Level(LEVEL_CONFIG[CURRENT_LEVEL]);
					levelObjects[CURRENT_LEVEL] = lvl;
					window.level = null;
					setTimeout(function () {
						window.level = lvl;
					}, 1200);

					return "END_LEVEL";
				} else {
					next();
					return "END_LEVEL";
				}
			}
		}

	};

	self.frame = 0;
	self.draw = function (ctx) {

		ctx.save();
		ctx.translate(self.x, self.y);
		ctx.scale(0.7, 0.7);

		var f = Math.floor(self.frame);
		var sw = 68;
		var sh = 96;
		var sx = (f * sw) % images.door.width;
		var sy = sh * Math.floor((f * sw) / images.door.width);
		var dx = -34;
		var dy = -91;
		ctx.drawImage(images.door, sx, sy, sw, sh, dx, dy, sw, sh);
		ctx.restore();

	};
	self.drawShadow = function (ctx) {

		ctx.save();
		ctx.translate(self.x, self.y);
		ctx.scale(0.7, 0.7);
		ctx.scale(1, 0.2);
		ctx.beginPath();
		ctx.arc(0, 0, 30, 0, Math.TAU, false);
		ctx.fillStyle = 'rgba(100,100,100,0.4)';
		ctx.fill();
		ctx.restore();

	};

}

//////////////

function Peep(config, level) {

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;
	self.vel = { x: 0, y: 0 };
	self.frame = 0;
	self.direction = 1;

	self.update = function () {

		// Keyboard

		var dx = 0;
		var dy = 0;

		if (Key.left) dx -= 1;
		if (Key.right) dx += 1;
		if (Key.up) dy -= 1;
		if (Key.down) dy += 1;

		var dd = Math.sqrt(dx * dx + dy * dy);
		if (dd > 0) {
			self.vel.x += (dx / dd) * 2;
			self.vel.y += (dy / dd) * 2;
		}

		if (Key.left) self.direction = -1;
		if (Key.right) self.direction = 1;

		if (Key.left || Key.right || Key.up || Key.down) {
			//if(self.frame==0) bounce=0.8;
			self.frame++;
			if (self.frame > 9) self.frame = 1;
		} else {
			if (self.frame > 0) self.bounce = 0.8;
			self.frame = 0;
		}

		// Velocity

		self.x += self.vel.x;
		self.y += self.vel.y;
		self.vel.x *= 0.7;
		self.vel.y *= 0.7;

		// Dealing with colliding into border
		if (self.x < 0) self.x = 0;
		if (self.y < 0) self.y = 0;
		if (self.x > level.width) self.x = level.width;
		if (self.y > level.height) self.y = level.height;

		// Dealing with collision of circles
		// Hit a circle? Figure out how deep, then add that vector away from the circle.

		for (var i = 0; i < level.circles.length; i++) {

			var circle = level.circles[i];

			// Hit circle?
			var dx = self.x - circle.x;
			var dy = self.y - circle.y;
			var distance = Math.sqrt(dx * dx + dy * dy);
			var overlap = (circle.radius + 5) - distance;
			if (overlap > 0) {

				// Yes, I've been hit, by "overlap" pixels.
				// Push me back
				var ux = dx / distance;
				var uy = dy / distance;
				var pushX = ux * overlap;
				var pushY = uy * overlap;
				self.x += pushX;
				self.y += pushY;

			}

		}

		// Dealing with collision of arcs (弧形障碍物碰撞检测)
		for (var i = 0; i < level.arcs.length; i++) {
			var arc = level.arcs[i];
			
			// 计算玩家到弧心的距离和角度
			var dx = self.x - arc.cx;
			var dy = self.y - arc.cy;
			var distance = Math.sqrt(dx * dx + dy * dy);
			var angle = Math.atan2(dy, dx);
			
			// 标准化角度到 [0, 2π]
			if (angle < 0) angle += Math.TAU;
			
			// 检查角度是否在弧的范围内
			var startAngle = arc.startAngle;
			var endAngle = arc.endAngle;
			if (startAngle < 0) startAngle += Math.TAU;
			if (endAngle < 0) endAngle += Math.TAU;
			
			var inArcRange = false;
			if (arc.counterclockwise) {
				inArcRange = (angle >= endAngle && angle <= startAngle) || 
							 (endAngle > startAngle && (angle >= endAngle || angle <= startAngle));
			} else {
				inArcRange = (angle >= startAngle && angle <= endAngle) || 
							 (startAngle > endAngle && (angle >= startAngle || angle <= endAngle));
			}
			
			if (inArcRange) {
				// 计算到弧线的距离（弧的厚度为5像素）
				var distToArc = Math.abs(distance - arc.radius);
				var overlap = 10 - distToArc; // 5像素玩家半径 + 5像素弧厚度
				
				if (overlap > 0) {
					// 推开玩家
					var ux = dx / distance;
					var uy = dy / distance;
					// 根据玩家在弧内侧还是外侧决定推的方向
					var pushDir = distance < arc.radius ? -1 : 1;
					self.x += ux * overlap * pushDir;
					self.y += uy * overlap * pushDir;
				}
			}
		}

		// Dealing with collision of lines (直线障碍物碰撞检测)
		for (var i = 0; i < level.lines.length; i++) {
			var line = level.lines[i];
			
			// 计算点到线段的最短距离
			var dx = line.x2 - line.x1;
			var dy = line.y2 - line.y1;
			var lineLength = Math.sqrt(dx * dx + dy * dy);
			
			if (lineLength === 0) continue;
			
			// 线段的单位向量
			var ux = dx / lineLength;
			var uy = dy / lineLength;
			
			// 玩家相对于线段起点的向量
			var px = self.x - line.x1;
			var py = self.y - line.y1;
			
			// 投影到线段上的长度
			var projection = px * ux + py * uy;
			
			// 限制在线段范围内
			projection = Math.max(0, Math.min(lineLength, projection));
			
			// 线段上最近的点
			var closestX = line.x1 + ux * projection;
			var closestY = line.y1 + uy * projection;
			
			// 玩家到最近点的距离
			var distX = self.x - closestX;
			var distY = self.y - closestY;
			var distance = Math.sqrt(distX * distX + distY * distY);
			
			var overlap = 10 - distance; // 5像素玩家半径 + 5像素线厚度
			
			if (overlap > 0 && distance > 0) {
				// 推开玩家
				var pushX = (distX / distance) * overlap;
				var pushY = (distY / distance) * overlap;
				self.x += pushX;
				self.y += pushY;
			}
		}

		// Bouncy & Sway
		self.sway += swayVel;
		swayVel += ((-self.vel.x * 0.08) - self.sway) * 0.2;
		swayVel *= 0.9;
		self.bounce += bounceVel;
		bounceVel += (1 - self.bounce) * 0.2;
		bounceVel *= 0.9;

	};

	self.bounce = 1;
	var bounceVel = 0;
	self.sway = 0;
	var swayVel = 0;
	var bouncy = [0.00, 0.25, 1.00, 0.90, 0.00, 0.00, 0.25, 1.00, 0.90, 0.00];
	self.draw = function (ctx) {

		var x = self.x;
		var y = self.y;

		// DRAW GOOFY BOUNCY DUDE //

		y += -6 * bouncy[self.frame];

		if (self.frame == 4 || self.frame == 9) {
			// 重新放映时降低脚步声音量
			var stepVolume = (STAGE == 3) ? 0.2 : 0.5;
			createjs.Sound.play("step", { volume: stepVolume });
		}

		ctx.save();
		ctx.translate(x, y);
		ctx.scale(0.5, 0.5);

		ctx.rotate(self.sway);
		ctx.scale(self.direction, 1);///anim.stretch, anim.stretch);
		ctx.scale(1 / self.bounce, self.bounce);
		//ctx.rotate(anim.rotate*0.15);
		ctx.drawImage(images.peep, -25, -100, 50, 100);
		ctx.restore();

	};

	self.drawShadow = function (ctx) {

		var x = self.x;
		var y = self.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.scale(0.5, 0.5);

		var scale = (3 - bouncy[self.frame]) / 3;
		ctx.scale(1 * scale, 0.3 * scale);
		ctx.beginPath();
		ctx.arc(0, 0, 20, 0, Math.TAU, false);
		ctx.fillStyle = 'rgba(100,100,100,0.4)';
		ctx.fill();
		ctx.restore();

	};

}

//// UPDATE & RENDER ////

window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

window.onload = function () {

	addAsset("peep", "assets/peep.png");
	addAsset("key", "assets/key.png");
	addAsset("door", "assets/door.png");
	addAsset("clock", "assets/clock.png");

	createjs.Sound.alternateExtensions = ["ogg"];
	addSound("ding", "audio/ding.mp3");
	addSound("rewind", "audio/rewind.mp3");
	addSound("jazz", "audio/jazz.mp3");
	addSound("step", "audio/step.mp3");
	addSound("unlock", "audio/unlock.mp3");
	addSound("error", "audio/error.mp3");

	var forceHideLoading = window.setTimeout(function () {
		document.getElementById("loading").style.display = "none";
	}, 5000); // 兜底：5秒后强行关闭 Loading，防止资源加载死锁

	onLoadAssets(function () {

		window.clearTimeout(forceHideLoading); // 如果正常加载完成，清除兜底
		window.setTimeout(function () {
			document.getElementById("loading").style.display = "none";
		}, 300);

		// Skip Intro 并一次性初始化所有关卡，确保 5 个画面都能被渲染
		document.getElementById("whole_container").style.top = "-100%";
		for (var i = 0; i < LEVEL_CONFIG.length; i++) {
			levelObjects[i] = new Level(LEVEL_CONFIG[i]);
		}

		CURRENT_LEVEL = 0;
		window.level = levelObjects[CURRENT_LEVEL];
		updateCanvasVisibility();

		//////////

		var frameDirty = false;
		function update() {

			if (STAGE == 0 || STAGE == 1) {
				if (level) {
					level.update();
					frameDirty = true;
				}
			} else if (STAGE == 2 || STAGE == 3) {
				frameDirty = true;
			}

			if (STAGE == 3 && !window.HAS_PLAYED_JAZZ) {

				// 计算距离回放结束还有多少帧
				var framesLeft = (rewindLevel.frames.length - rewindFrame);
				for (var i = CURRENT_LEVEL + 1; i < levelObjects.length; i++) {
					framesLeft += levelObjects[i].frames.length;
				}
				
				// 考虑到 3 倍速回放，游戏运行在30 FPS
				// 需要在iHeartYou前4秒播放jazz
				// 4秒 * 30 FPS * 3倍速 = 360帧
				if (framesLeft <= 360) {
					window.HAS_PLAYED_JAZZ = true;
					createjs.Sound.play("jazz");
				}

			}

		}
		function render() {

			if (STAGE == 0 || STAGE == 1) {

				// 遍历绘制所有已初始化的关卡
				for (var i = 0; i < levelObjects.length; i++) {
					var lvl = levelObjects[i];
					if (lvl) lvl.draw();
				}

				frameDirty = false;

			} else if (STAGE == 2) {

				// 更新回溯关卡的状态，但不在此处立即 draw
				rewindLevel.playbackFrame(rewindFrame, true);
				rewindFrame -= 3;
				if (rewindFrame < 0) {
					CURRENT_LEVEL--;
					if (CURRENT_LEVEL >= 0) {
						startRewind();
					} else {
						STAGE = 3;
						CURRENT_LEVEL = 0;
						startPlayback();

						document.getElementById("rewind_text").style.display = 'none';
						document.getElementById("replay_text").style.display = "block";

					}
				}

				// 统一绘制所有关卡，确保画面完整
				for (var i = 0; i < levelObjects.length; i++) {
					if (levelObjects[i]) levelObjects[i].draw();
				}

			} else if (STAGE == 3) {

				// 更新回放关卡的状态
				rewindLevel.playbackFrame(rewindFrame, true);
				rewindFrame += 3;
				if (rewindFrame >= rewindLevel.frames.length) {
					CURRENT_LEVEL++;
					if (CURRENT_LEVEL < LEVEL_CONFIG.length) {
						startPlayback();
					} else {

						document.getElementById("replay_text").style.display = "none";
						iHeartYou();
						STAGE = 4;

					}
				}

				// 统一绘制所有关卡，但如果已经切换到 STAGE 4（即 iHeartYou 已触发），则停止绘制以保留 pathOnly 效果
				if (STAGE == 3) {
					for (var i = 0; i < levelObjects.length; i++) {
						if (levelObjects[i]) levelObjects[i].draw();
					}
				}

				frameDirty = false;

			}

		}

		setInterval(update, 1000 / 30);
		(function animloop() {
			requestAnimFrame(animloop);
			if (frameDirty) render();
		})();

	});

};

var STAGE = 1;
// 0 - Intro
// 1 - Play levels in order
// 2 - Rewind levels
// 3 - Replay levels with path
// 4 - I HEART YOU
// 5 - End screen

function next() {
	CURRENT_LEVEL++;
	if (CURRENT_LEVEL < LEVEL_CONFIG.length) {

		createjs.Sound.play("ding");

		var lvl = levelObjects[CURRENT_LEVEL];
		window.level = null;
		setTimeout(function () {
			window.level = lvl;
			updateCanvasVisibility();
		}, 500);

	} else {
		level = null;

		// 移动端特殊逻辑：通关后拦截自动回溯，等待旋转手机
		var isMobile = (window.innerWidth < 1100);
		if (isMobile && STAGE == 1) {
			if (window.showFinishPrompt) {
				window.showFinishPrompt();
				return; // 暂不进入 STAGE 2
			}
		}

		// 正常 PC 逻辑或移动端已确认后执行
		startActualRewind();
	}
}

// 提取真正的启动回溯逻辑，方便外部调用
function startActualRewind() {
	STAGE = 2;
	CURRENT_LEVEL = LEVEL_CONFIG.length - 1;
	startRewind();
	updateCanvasVisibility();

	var totalFrames = 0;
	for (var i = 0; i < levelObjects.length; i++) {
		totalFrames += levelObjects[i].frames.length;
	}
	var totalRewindTime = totalFrames / 60;
	var extraTime = 6600 - totalRewindTime * 1000;
	if (extraTime < 0) {
		createjs.Sound.play("rewind");
	} else {
		createjs.Sound.play("rewind", "none", 0, extraTime);
	}

	document.getElementById("rewind_text").style.display = 'block';
}

// 暴露接口给 mobile.js
window.triggerRewind = function () {
	startActualRewind();
};

function iHeartYou() {

	for (var i = 0; i < levelObjects.length; i++) {
		levelObjects[i].onlyPath();
	}

	document.getElementById("canvas_container").style.backgroundPosition = "0px -390px";
	document.getElementById("screen_two").style.background = "#000";

	var can_cont_text = document.getElementById("canvas_container_text");

	var vtext = document.getElementById("valentines_text");
	vtext.style.display = "block";
	if (window.location.hash) {
		vtext.textContent = encryptString(decodeURIComponent(window.location.hash).substring(1));
	} else {
		vtext.textContent = "🍁，1.23 Happy Birthday ，❤️ you 	";
	}

	setTimeout(function () {
		vtext.style.letterSpacing = "3px";
	}, 10);

	// After 9 seconds, swipe down to CREDITS.
	// 游戏结束后不跳转到结束页面，直接停留在当前页面
	// 或者可以选择重新开始游戏
	/*
	setTimeout(function () {
		document.getElementById("whole_container").style.top = "-200%";
	}, 7300);
	setTimeout(function () {
		yourMessage.focus();
	}, 8500);
	*/

}

var rewindFrame = 0;
var rewindLevel = null;
function startRewind() {
	rewindLevel = levelObjects[CURRENT_LEVEL];
	rewindFrame = rewindLevel.frames.length - 1;
}
function startPlayback() {
	rewindLevel = levelObjects[CURRENT_LEVEL];
	rewindLevel.DRAW_PATH = true;
	rewindFrame = 0;
}

var levelObjects = [];
var CURRENT_LEVEL = 0;
function reset() {
	var lvl = new Level(LEVEL_CONFIG[CURRENT_LEVEL]);
	levelObjects[CURRENT_LEVEL] = lvl;
	if (window.level) window.level.clear();
	window.level = null;
	setTimeout(function () {
		window.level = lvl;
		updateCanvasVisibility();
	}, 500);
}

///////////////////////////////////////////////////////////////////

// Simple XOR encryption (key = 1)
// The only purpose is to obscure it in the hash

function encryptString(string) {
	var result = "";
	for (var i = 0; i < string.length; i++) {
		result += String.fromCharCode(string.charCodeAt(i) ^ 1);
	}
	return result;
}
function decryptString(string) {
	return encryptString(string); // it's XOR, duh
}

var yourMessage = document.getElementById("your_message");
var yourLink = document.getElementById("your_link");
function linkChangey() {
	if (yourMessage.value == "") {
		yourLink.value = "https://thecoding-time.github.io/door/";
	} else {
		yourLink.value = "https://thecoding-time.github.io/door/#" + encodeURIComponent(encryptString(yourMessage.value));
	}
};
yourMessage.onchange = linkChangey;
yourMessage.oninput = linkChangey;
linkChangey();
yourLink.onclick = function () {
	yourLink.select();
};

function socialShare(event, type) {

	var link = yourLink.value;
	var title = "it's a(door)able";
	var url = "";
	var width = 640;
	var height = 480;

	switch (type) {
		case "facebook":
			url += "https://www.facebook.com/sharer.php?u=" + encodeURIComponent(link);
			url += "&t=" + encodeURIComponent("A lovely message for all my dear friends. This minigame only takes a minute to play, check it out! it's a(door)able --");
			width = 626;
			height = 436;
			break;
		case "twitter":
			url += "https://twitter.com/share?url=" + encodeURIComponent(link);
			url += "&text=" + encodeURIComponent("A lovely message for all my dear followers, in this 1-min minigame. http://pic.twitter.com/DK5vnPzEVn"); // add twitter pic.
			url += "&via=ncasenmare";
			width = 640;
			height = 400;
			break;
		case "plus":
			url += "https://plus.google.com/share?url=" + encodeURIComponent(link);
			width = 600;
			height = 460;
			break;
		case "tumblr":
			url += "https://www.tumblr.com/share/link?url=" + encodeURIComponent(link);
			url += "&name=" + encodeURIComponent("it's a(door)able");
			url += "&description=" + encodeURIComponent("A lovely message for all my dear followers, in this 1-min minigame.");
			width = 446;
			height = 430;
			break;
		case "reddit":
			window.open('http://www.reddit.com/submit?v=5&amp;noui&amp;jump=close&amp;url=' + encodeURIComponent(link) + '&amp;title=' + encodeURIComponent("it's a(door)able: a one-minute minigame"), "reddit", 'toolbar=no,width=700,height=550');
			return false;
			break;
		case "stumbleupon":
			url += "http://www.stumbleupon.com/submit?url=" + encodeURIComponent(link);
			break;
	}

	return sharePopup.call(this, event, {
		href: url,
		width: width,
		height: height
	});

}


///////////////////////////////////////////////////////////////////


var introCanvas = document.getElementById("canvas_intro");
introCanvas.width = window.innerWidth;
introCanvas.height = window.innerHeight;
var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;

window.INTRO_LEVEL = {

	canvas: document.getElementById("canvas_intro"),
	player: { x: cx - 150, y: cy - 30 },
	door: { x: cx + 150, y: cy - 30 },
	key: { x: cx, y: cy + 125 },
	circles: [
		{ x: cx, y: cy, radius: 120, invisible: true }
	]

};

window.LEVEL_CONFIG = [

	// 0. H
	{
		canvasId: "canvas_1",
		sequentialKeys: true,
		player: { x: 50, y: 350 },
		door: { x: 260, y: 270 },
		keys: [
			{ x: 50, y: 50 },
			{ x: 260, y: 50, visible: false }
		],
		circles: [
			{ x: 150, y: 50, radius: 90 },
			{ x: 150, y: 250, radius: 90 }
		],
		
		lines: [
			// 中间横线，强化H的横杠
			{ x1: 100, y1: 150, x2: 200, y2: 150 },
			{ x1: 30, y1: 10, x2: 30, y2: 300 },
			{ x1: 0, y1: 10, x2:300, y2: 10 },
			{ x1: 280, y1: 10, x2: 280, y2: 300 }
		],
		countdown: 10
	},

	// 1. B
	{
		canvasId: "canvas_2",
		sequentialKeys: true,
		player: { x: 100, y: 230 },
		door: { x: 100, y: 280 },
		keys: [
			{ x: 100, y: 45 },
			{ x: 195, y: 160, visible: false } // 位于两圆分离后的中间通道
		],
		circles: [
			// 分离两个大圆 (y 坐标从 100/220 调整为 80/240)，中间形成 30px 的缝隙
			{ x: 175, y: 80, radius: 55 },
			{ x: 175, y: 220, radius: 55 },

			// 不可见的障碍物，强制玩家向右绕行
			// 保持阻塞左侧路径，但允许玩家通过圆圈间的缝隙从右侧返回中间拿 Key 2
			{ x: 165, y: 150, radius: 20, invisible: false }

		],
		// 添加弧形障碍物引导玩家走B形路径
		arcs: [
			// 上半部分的弧形
			{ cx: 190, cy: 80, radius: 90, startAngle: -Math.PI * 0.3, endAngle: Math.PI * 0.3 },
			// 下半部分的弧形
			{ cx: 190, cy: 220, radius: 90, startAngle: -Math.PI * 0.3, endAngle: Math.PI * 0.3 }
		],
		lines: [
			// 左侧竖线，强化B的左边
			{ x1: 80, y1: 0, x2: 80, y2: 300 },
			{ x1: 0, y1: 10, x2:300, y2: 10 },
			{ x1: 0, y1: 295, x2:300, y2: 295 }
		],
		countdown: 10
	},

	// 2. D
	{
		canvasId: "canvas_3",
		sequentialKeys: true,
		player: { x: 90, y: 220 },
		door: { x: 90, y: 270 },
		keys: [
			{ x: 90, y: 50 },
			{ x: 250, y: 120, visible: false },
			{ x: 250, y: 220, visible: false }
		],
		circles: [
			{ x: 200, y: 150, radius: 45 },
			{ x: 160, y: 110, radius: 45 },
			{ x: 160, y: 190, radius: 45 }
		],
		// 添加弧形障碍物引导玩家走D形路径
		arcs: [
			// 右侧大弧形，形成D的弧度
			{ cx: 150, cy: 150, radius: 160, startAngle: -Math.PI * 0.5, endAngle: Math.PI * 0.5 }
		],
		lines: [
			// 左侧竖线，强化D的左边
			{ x1: 70, y1: 0, x2: 70, y2: 300 },
			{ x1: 0, y1: 280, x2:300, y2: 280 }
		],
		countdown: 10
	},

	// 3. HEART
	{
		canvasId: "canvas_4",
		player: { x: 150, y: 250 },
		door: { x: 150, y: 249 },
		key: { x: 150, y: 75 },
		circles: [
			{ x: 100, y: 100, radius: 50 },
			{ x: 200, y: 100, radius: 50 },
			{ x: 150, y: 150, radius: 50 },
			{ x: 150, y: 100, radius: 10, invisible: true },
			{ x: 0, y: 300, radius: 145 },
			{ x: 300, y: 300, radius: 145 }
		],
		// 添加弧形障碍物引导玩家走心形路径
		arcs: [
			// 左上弧形
			{ cx: 100, cy: 60, radius: 75, startAngle: -Math.PI * 0.8, endAngle: -Math.PI * 0.2 },
			// 右上弧形
			{ cx: 200, cy: 60, radius: 75, startAngle: Math.PI * 1.2, endAngle: Math.PI * 1.8 },

			{ cx: 190, cy: 80, radius: 90, startAngle: -Math.PI * 0.3, endAngle: Math.PI * 0.3 },
			// 下半部分的弧形
			{ cx: 110, cy: 80, radius: 90, startAngle: Math.PI * 0.7, endAngle: Math.PI * 1.3 }
		],
		lines: [
			// 左下斜线
			{ x1: 20, y1: 100, x2: 100, y2: 230 },
			// 右下斜线
			{ x1: 280, y1: 100, x2: 190, y2: 230 }
			
		],
		countdown: 10
	},

	// 4. U
	{
		canvasId: "canvas_5",
		player: { x: 30, y: 75 },
		door: { x: 270, y: 75 },
		key: { x: 150, y: 270 },
		circles: [
			{ x: 150, y: 150, radius: 115 }
		],
		// 添加弧形障碍物引导玩家走U形路径
		arcs: [
			// 底部大弧形，形成U的底部
			{ cx: 150, cy: 100, radius: 220, startAngle: Math.PI * 0.3, endAngle: Math.PI * 0.7 }
		],
		lines: [
			// 左侧竖线
			{ x1: 20, y1: 10, x2: 20, y2: 300 },
			// 右侧竖线
			{ x1: 290, y1: 10, x2: 290, y2: 300 }
		],
		countdown: 10
	}

];

function updateCanvasVisibility() {
	for (var i = 0; i < LEVEL_CONFIG.length; i++) {
		var config = LEVEL_CONFIG[i];
		var canvas = config.canvas || document.getElementById(config.canvasId);
		if (!canvas) continue;

		// 在普通游戏阶段 (STAGE 1)，只显示当前及已通过的关卡
		if (STAGE == 1) {
			if (i <= CURRENT_LEVEL) {
				canvas.classList.remove("locked");
			} else {
				canvas.classList.add("locked");
			}
		} else {
			// 在回溯、回放阶段，全部显示
			canvas.classList.remove("locked");
		}
	}
}