// 永続化対応 - ページ移動でも残る半透明移動可能ボタン
(function() {
    'use strict';
    
    // グローバルスコープに設置して他のスクリプトから参照可能に
    window.PersistentMovableButton = window.PersistentMovableButton || {};
    
    // 既に動作中の場合は停止
    if (window.PersistentMovableButton.isRunning) {
        window.PersistentMovableButton.stop();
        return;
    }

    const PMB = window.PersistentMovableButton;
    PMB.isRunning = true;
    PMB.checkInterval = null;
    PMB.button = null;
    PMB.buttonInstance = null;

    // 設定
    const CONFIG = {
        buttonId: 'persistent-movable-btn',
        styleId: 'persistent-movable-styles',
        checkIntervalMs: 1000, // 1秒ごとにチェック
        emoji: '🚀',
        position: { x: 50, y: 100 }, // 右上からの距離
        storageKey: 'persistentMovableButton'
    };

    // CSSスタイル
    const CSS_STYLES = `
        .persistent-movable-button {
            position: fixed;
            width: 55px;
            height: 55px;
            background: linear-gradient(135deg, rgba(74, 144, 226, 0.85), rgba(155, 89, 182, 0.85));
            border: 2px solid rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: white;
            user-select: none;
            transition: all 0.2s ease;
            backdrop-filter: blur(15px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            z-index: 999999;
            font-family: 'Segoe UI', Arial, sans-serif;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }

        .persistent-movable-button:hover {
            transform: scale(1.15);
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
            background: linear-gradient(135deg, rgba(74, 144, 226, 0.95), rgba(155, 89, 182, 0.95));
        }

        .persistent-movable-button:active {
            transform: scale(0.9);
        }

        .persistent-movable-button.dragging {
            transition: none;
            cursor: grabbing;
            z-index: 1000000;
            box-shadow: 0 8px 35px rgba(0, 0, 0, 0.4);
        }

        .persistent-movable-button.pulse {
            animation: persistent-pulse 0.4s ease-in-out;
        }

        .persistent-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1000001;
            font-size: 14px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            opacity: 0;
            animation: toast-show 0.3s ease forwards;
        }

        @keyframes persistent-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
        }

        @keyframes toast-show {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;

    // 移動可能ボタンクラス
    class PersistentMovableButton {
        constructor(element) {
            this.element = element;
            this.isDragging = false;
            this.startX = 0;
            this.startY = 0;
            this.initialX = 0;
            this.initialY = 0;
            this.hasMoved = false;

            this.init();
        }

        init() {
            // イベントリスナー設定
            this.element.addEventListener('mousedown', this.onStart.bind(this));
            document.addEventListener('mousemove', this.onMove.bind(this));
            document.addEventListener('mouseup', this.onEnd.bind(this));

            this.element.addEventListener('touchstart', this.onStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.onEnd.bind(this));

            this.element.addEventListener('click', this.onClick.bind(this));
            this.element.addEventListener('contextmenu', this.onContextMenu.bind(this));

            // 保存された位置を復元
            this.restorePosition();
        }

        onStart(e) {
            this.isDragging = true;
            this.hasMoved = false;
            this.element.classList.add('dragging');

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            const rect = this.element.getBoundingClientRect();
            this.startX = clientX - rect.left;
            this.startY = clientY - rect.top;
            this.initialX = rect.left;
            this.initialY = rect.top;

            e.preventDefault();
        }

        onMove(e) {
            if (!this.isDragging) return;
            e.preventDefault();

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            let newX = clientX - this.startX;
            let newY = clientY - this.startY;

            // 境界制限
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            this.element.style.left = newX + 'px';
            this.element.style.top = newY + 'px';

            if (Math.abs(newX - this.initialX) > 5 || Math.abs(newY - this.initialY) > 5) {
                this.hasMoved = true;
            }
        }

        onEnd(e) {
            if (!this.isDragging) return;

            this.isDragging = false;
            this.element.classList.remove('dragging');
            this.savePosition();
        }

        onClick(e) {
            if (this.hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            this.element.classList.add('pulse');
            setTimeout(() => {
                this.element.classList.remove('pulse');
            }, 400);

            this.performAction();
        }

        onContextMenu(e) {
            e.preventDefault();
            if (confirm('永続化ボタンを停止しますか？\n（ページリロードでも再表示されなくなります）')) {
                PMB.stop();
            }
        }

        performAction() {
            // ボタンの動作をここに記述
            console.log("test")
        }

        showToast(message) {
            // 既存のtoastを削除
            const existingToast = document.querySelector('.persistent-toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = 'persistent-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 3000);
        }

        savePosition() {
            try {
                const rect = this.element.getBoundingClientRect();
                const data = PMB.loadData();
                data.position = { x: rect.left, y: rect.top };
                data.lastUrl = window.location.href;
                PMB.saveData(data);
            } catch(e) {}
        }

        restorePosition() {
            try {
                const data = PMB.loadData();
                if (data.position) {
                    this.element.style.left = data.position.x + 'px';
                    this.element.style.top = data.position.y + 'px';
                }
            } catch(e) {}
        }
    }

    // ユーティリティ関数
    PMB.loadData = function() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            return data ? JSON.parse(data) : { enabled: true };
        } catch(e) {
            return { enabled: true };
        }
    };

    PMB.saveData = function(data) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        } catch(e) {}
    };

    PMB.createButton = function() {
        if (document.getElementById(CONFIG.buttonId)) return;

        const button = document.createElement('div');
        button.id = CONFIG.buttonId;
        button.className = 'persistent-movable-button';
        button.innerHTML = CONFIG.emoji;
        button.title = 'ドラッグで移動 | 右クリックで停止';
        
        // 初期位置設定
        button.style.right = CONFIG.position.x + 'px';
        button.style.top = CONFIG.position.y + 'px';

        document.body.appendChild(button);
        
        PMB.button = button;
        PMB.buttonInstance = new PersistentMovableButton(button);
        
        return button;
    };

    PMB.addStyles = function() {
        if (document.getElementById(CONFIG.styleId)) return;
        
        const style = document.createElement('style');
        style.id = CONFIG.styleId;
        style.textContent = CSS_STYLES;
        document.head.appendChild(style);
    };

    PMB.checkAndRestore = function() {
        const data = PMB.loadData();
        if (!data.enabled) {
            PMB.stop();
            return;
        }

        if (!document.getElementById(CONFIG.buttonId)) {
            PMB.addStyles();
            PMB.createButton();
        }
    };

    PMB.start = function() {
        PMB.checkAndRestore();
        PMB.checkInterval = setInterval(PMB.checkAndRestore, CONFIG.checkIntervalMs);
    };

    PMB.stop = function() {
        PMB.isRunning = false;
        
        if (PMB.checkInterval) {
            clearInterval(PMB.checkInterval);
            PMB.checkInterval = null;
        }

        const button = document.getElementById(CONFIG.buttonId);
        if (button) button.remove();

        const style = document.getElementById(CONFIG.styleId);
        if (style) style.remove();

        // 無効化フラグを保存
        const data = PMB.loadData();
        data.enabled = false;
        PMB.saveData(data);

        PMB.button = null;
        PMB.buttonInstance = null;
    };

    // 初期化と開始
    PMB.start();
    
    // 初回メッセージ
    setTimeout(() => {
        if (PMB.buttonInstance) {
            PMB.buttonInstance.showToast('🚀 永続化ボタンを追加！ページ移動後も表示されます');
        }
    }, 500);

})();
