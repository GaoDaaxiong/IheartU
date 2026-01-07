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
        if (!canvasContainer) return;

        var isPortrait = window.innerHeight > window.innerWidth;
        var screenW = window.innerWidth;
        var screenH = window.innerHeight;

        if (isPortrait) {
            // PORTRAIT: Show current level
            var targetW = 300;
            var targetH = 380;
            var scale = Math.min(screenW / targetW, (screenH / 2) / targetH) * 0.82;

            var idx = window.CURRENT_LEVEL || 0;
            var currentLevelCenter = idx * 320 + 150;
            var slideX = 790 - currentLevelCenter;

            canvasContainer.style.transformOrigin = "center center";
            canvasContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ") translateY(-22vh) translateX(" + slideX + "px)";

        } else {
            // LANDSCAPE: Show all 5 levels side-by-side
            var targetW = 1580;
            var targetH = 380;
            var scale = Math.min(screenW / targetW, screenH / targetH) * 0.95;
            canvasContainer.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
        }
    }

    // ============================================
    // 4. Finish Prompt Logic
    // ============================================
    window.showFinishPrompt = function () {
        var overlay = document.getElementById("finish_overlay");
        if (overlay) overlay.style.display = "flex";

        var btn = document.getElementById("confirm_finish_btn");
        btn.onclick = function () {
            if (window.innerHeight < window.innerWidth) {
                overlay.style.display = "none";

                // Audio Priming for Mobile/iOS
                // Play and immediately stop or play with 0 volume to unlock context
                try {
                    createjs.Sound.play("rewind", { volume: 0 }).stop();
                    createjs.Sound.play("jazz", { volume: 0 }).stop();
                    createjs.Sound.play("unlock", { volume: 0 }).stop();
                } catch (e) { console.log("Audio priming skipped"); }

                if (window.triggerRewind) window.triggerRewind();
            } else {
                alert("请先将手机旋转至横屏，再点击确定哦！");
            }
        };
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
        setInterval(function () {
            if (window.CURRENT_LEVEL !== lastLvl) {
                lastLvl = window.CURRENT_LEVEL;
                handleResize();
            }
        }, 100);
    });

})();
