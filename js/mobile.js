(function () {

    var canvasContainer;

    // ============================================
    // 1. Audio Unlock & Fullscreen
    // ============================================
    function initStartOverlay() {
        var overlay = document.getElementById("start_overlay");
        var startBtn = document.getElementById("start_btn");

        if (!overlay || !startBtn) return;

        var start = function () {
            // Fullscreen
            var docElm = document.documentElement;
            if (docElm.requestFullscreen) docElm.requestFullscreen();
            else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();

            // Audio Unlock
            createjs.Sound.play("ding", { volume: 0.01 });

            // 启动游戏
            if (window.GAME_STARTED !== undefined) {
                window.GAME_STARTED = true;
            }

            // 显示方向控制键
            var mobileControls = document.getElementById("mobile_controls");
            if (mobileControls && window.innerWidth < 1100) {
                mobileControls.classList.add("game-started");
            }

            overlay.style.opacity = "0";
            setTimeout(function () { overlay.style.display = "none"; }, 500);

            handleResize();
        };

        startBtn.addEventListener("click", start);
        startBtn.addEventListener("touchend", start);
    }

    // ============================================
    // 2. Fixed D-Pad Controls Logic
    // ============================================
    function initFixedControls() {
        var buttons = {
            up: document.getElementById("btn_up"),
            down: document.getElementById("btn_down"),
            left: document.getElementById("btn_left"),
            right: document.getElementById("btn_right")
        };

        var bind = function (btnId, keyName) {
            var el = buttons[btnId];
            if (!el) return;

            var activate = function (e) {
                e.preventDefault();
                if (window.Key) window.Key[keyName] = true;
                el.classList.add("active");
            };
            var deactivate = function (e) {
                e.preventDefault();
                if (window.Key) window.Key[keyName] = false;
                el.classList.remove("active");
            };

            el.addEventListener("touchstart", activate, { passive: false });
            el.addEventListener("touchend", deactivate, { passive: false });
            el.addEventListener("touchcancel", deactivate, { passive: false });
        };

        bind("up", "up");
        bind("down", "down");
        bind("left", "left");
        bind("right", "right");
    }

    // ============================================
    // 3. Auto Layout & Scaling
    // ============================================
    function handleResize() {
        canvasContainer = document.getElementById("canvas_container");
        var mobileControls = document.getElementById("mobile_controls");
        if (!canvasContainer) return;

        var isPortrait = window.innerHeight > window.innerWidth;
        var screenW = window.innerWidth;
        var screenH = window.innerHeight;
        var stage = window.STAGE || 1;

        // 回放/重映阶段 (STAGE 2 或 3) 隐藏方向控制
        if (mobileControls) {
            if (stage === 2 || stage === 3 || stage === 4) {
                mobileControls.classList.remove("game-started");
            } else if (screenW < 1100 && mobileControls.classList.contains("game-started")) {
                // 只有在游戏已开始的情况下才显示
                mobileControls.style.display = "block";
            }
        }

        if (isPortrait) {
            // 竖屏回放/重映模式：上3下2布局
            if (stage === 2 || stage === 3 || stage === 4) {
                // 立即添加类，避免闪烁
                if (!canvasContainer.classList.contains("portrait-replay")) {
                    canvasContainer.classList.add("portrait-replay");
                }
                
                // 计算缩放：3个canvas一行的宽度 (300*3 + 15*2 gap = 930)
                var canvasW = 300;
                var canvasH = 380;
                var gap = 15;
                var rowWidth = canvasW * 3 + gap * 2;
                var totalHeight = canvasH * 2 + gap;
                
                var scaleX = (screenW * 0.95) / rowWidth;
                var scaleY = (screenH * 0.90) / totalHeight;
                var scale = Math.min(scaleX, scaleY);
                
                canvasContainer.style.transformOrigin = "center center";
                canvasContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
            } else {
                // PORTRAIT 游戏模式: Show current level
                canvasContainer.classList.remove("portrait-replay");
                
                var targetW = 300;
                var targetH = 380;
                var scale = Math.min(screenW / targetW, (screenH / 2) / targetH) * 0.82;

                var idx = window.CURRENT_LEVEL || 0;
                var currentLevelCenter = idx * 320 + 150;
                var slideX = 790 - currentLevelCenter;

                canvasContainer.style.transformOrigin = "center center";
                canvasContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ") translateY(-22vh) translateX(" + slideX + "px)";
            }
        } else {
            // LANDSCAPE: Show all 5 levels side-by-side
            canvasContainer.classList.remove("portrait-replay");
            var targetW = 1580;
            var targetH = 380;
            var scale = Math.min(screenW / targetW, screenH / targetH) * 0.95;
            canvasContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
        }
    }

    // ============================================
    // 4. Finish Prompt Logic (竖屏模式下直接开始回放)
    // ============================================
    window.showFinishPrompt = function () {
        // 提前设置布局类，避免闪烁
        var canvasContainer = document.getElementById("canvas_container");
        var isPortrait = window.innerHeight > window.innerWidth;
        if (canvasContainer && isPortrait) {
            canvasContainer.classList.add("portrait-replay");
        }

        // Audio Priming for Mobile/iOS
        try {
            createjs.Sound.play("rewind", { volume: 0 }).stop();
            createjs.Sound.play("jazz", { volume: 0 }).stop();
            createjs.Sound.play("unlock", { volume: 0 }).stop();
        } catch (e) { console.log("Audio priming skipped"); }

        if (window.triggerRewind) window.triggerRewind();
        
        // 触发布局更新
        setTimeout(handleResize, 50);
    };

    // ============================================
    // 5. Screen Sync
    // ============================================
    function initScreenSync() {
        var container = document.getElementById("whole_container");
        var screens = [
            document.getElementById("screen_one"),
            document.getElementById("screen_two"),
            document.getElementById("screen_three")
        ];
        if (!container || !screens[0]) return;

        var lastTop = "";
        function sync() {
            var currentTop = container.style.top || "0px";
            if (currentTop === lastTop) return;
            lastTop = currentTop;

            screens.forEach(function (s) { if (s) s.style.display = "none"; });

            if (currentTop === "0px" || currentTop === "0%") {
                if (screens[0]) screens[0].style.display = "block";
            } else if (currentTop.indexOf("-100") > -1) {
                if (screens[1]) screens[1].style.display = "block";
            } else if (currentTop.indexOf("-200") > -1) {
                if (screens[2]) screens[2].style.display = "block";
            }
            handleResize();
        }
        setInterval(sync, 100);
        sync();
    }

    // ============================================
    // Init
    // ============================================
    window.addEventListener("load", function () {
        initStartOverlay();
        initFixedControls();
        initScreenSync();
        window.addEventListener("resize", handleResize);

        var lastLvl = -1;
        var lastStage = -1;
        setInterval(function () {
            // 监听关卡变化
            if (window.CURRENT_LEVEL !== lastLvl) {
                lastLvl = window.CURRENT_LEVEL;
                handleResize();
            }
            // 监听阶段变化（进入回放/重映时更新布局）
            if (window.STAGE !== lastStage) {
                lastStage = window.STAGE;
                handleResize();
            }
        }, 100);
    });

})();
