(function() {
  // 既存のコントローラーがあれば削除
  var existing = document.getElementById('video-speed-controller');
  if (existing) {
    existing.remove();
    return;
  }
  
  // フローティングボタンとUIを作成
  var controller = document.createElement('div');
  controller.id = 'video-speed-controller';
  controller.innerHTML = `
        <div id="floating-btn" style="
            position: fixed;
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: rgba(128, 128, 128, 0.8);
            border-radius: 50%;
            cursor: pointer;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
            user-select: none;
            touch-action: manipulation;
            border: 2px solid rgba(255, 255, 255, 0.3);
        ">⚡</div>
        
        <div id="speed-ui" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border-radius: 15px;
            padding: 25px;
            z-index: 100000;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            display: none;
            width: 320px;
            max-width: 90vw;
        ">
            <h3 style="margin: 0 0 20px 0; text-align: center; font-size: 18px;">動画再生速度調整</h3>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-size: 14px;">スライダー:</label>
                <input type="range" id="speed-slider" min="0.1" max="3.0" step="0.1" value="1.0" style="
                    width: 100%;
                    height: 8px;
                    background: #333;
                    outline: none;
                    border-radius: 5px;
                ">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #ccc; margin-top: 5px;">
                    <span>0.1x</span>
                    <span>3.0x</span>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 8px; font-size: 14px;">数値入力:</label>
                <input type="number" id="speed-input" min="0.1" max="10" step="0.1" value="1.0" style="
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    background: #333;
                    color: white;
                    font-size: 16px;
                    box-sizing: border-box;
                ">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="apply-speed" style="
                    flex: 1;
                    padding: 12px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                ">決定</button>
                
                <button id="close-ui" style="
                    flex: 1;
                    padding: 12px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                ">閉じる</button>
            </div>
            
            <div id="current-speed" style="
                text-align: center;
                margin-top: 15px;
                font-size: 14px;
                color: #ccc;
            ">現在の速度: 1.0x</div>
        </div>
    `;
  
  document.body.appendChild(controller);
  
  // 要素の取得
  var floatingBtn = document.getElementById('floating-btn');
  var speedUI = document.getElementById('speed-ui');
  var speedSlider = document.getElementById('speed-slider');
  var speedInput = document.getElementById('speed-input');
  var applyBtn = document.getElementById('apply-speed');
  var closeBtn = document.getElementById('close-ui');
  var currentSpeedDisplay = document.getElementById('current-speed');
  
  // ドラッグ機能の実装
  var isDragging = false;
  var hasMoved = false;
  var startX, startY, startTop, startLeft;
  
  function startDrag(e) {
    isDragging = true;
    hasMoved = false;
    var touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    
    var rect = floatingBtn.getBoundingClientRect();
    startTop = rect.top;
    startLeft = rect.left;
    
    floatingBtn.style.transition = 'none';
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    var touch = e.touches ? e.touches[0] : e;
    var deltaX = touch.clientX - startX;
    var deltaY = touch.clientY - startY;
    
    // 5px以上動いたらドラッグとみなす
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved = true;
    }
    
    var newTop = Math.max(0, Math.min(window.innerHeight - 60, startTop + deltaY));
    var newLeft = Math.max(0, Math.min(window.innerWidth - 60, startLeft + deltaX));
    
    floatingBtn.style.top = newTop + 'px';
    floatingBtn.style.right = 'auto';
    floatingBtn.style.left = newLeft + 'px';
    e.preventDefault();
  }
  
  function endDrag(e) {
    if (isDragging) {
      isDragging = false;
      floatingBtn.style.transition = 'all 0.3s ease';
      
      // ドラッグしていない場合はUIを表示/非表示
      if (!hasMoved) {
        setTimeout(function() {
          speedUI.style.display = speedUI.style.display === 'none' || speedUI.style.display === '' ? 'block' : 'none';
        }, 10);
      }
    }
  }
  
  // マウスイベント
  floatingBtn.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  
  // タッチイベント
  floatingBtn.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', drag, { passive: false });
  document.addEventListener('touchend', endDrag);
  
  // スライダーと入力欄の同期
  speedSlider.addEventListener('input', function() {
    speedInput.value = this.value;
  });
  
  speedInput.addEventListener('input', function() {
    var value = parseFloat(this.value);
    if (value >= 0.1 && value <= 3.0) {
      speedSlider.value = value;
    }
  });
  
  // 動画速度変更関数
  function changeVideoSpeed(speed) {
    var videos = document.querySelectorAll('video');
    var changed = 0;
    
    videos.forEach(function(video) {
      video.playbackRate = speed;
      changed++;
    });
    
    currentSpeedDisplay.textContent = '現在の速度: ' + speed + 'x (' + changed + '個の動画)';
    
    if (changed === 0) {
      currentSpeedDisplay.textContent = '動画が見つかりませんでした';
      currentSpeedDisplay.style.color = '#ff9800';
    } else {
      currentSpeedDisplay.style.color = '#4CAF50';
    }
  }
  
  // 決定ボタン
  applyBtn.addEventListener('click', function() {
    var speed = parseFloat(speedInput.value);
    if (speed > 0) {
      changeVideoSpeed(speed);
    } else {
      alert('0より大きい数値を入力してください');
    }
  });
  
  // 閉じるボタン
  closeBtn.addEventListener('click', function() {
    speedUI.style.display = 'none';
  });
  
  // UIの外をクリックしたら閉じる
  document.addEventListener('click', function(e) {
    if (speedUI.style.display === 'block' &&
      !speedUI.contains(e.target) &&
      !floatingBtn.contains(e.target)) {
      speedUI.style.display = 'none';
    }
  });
  
  // 初期状態の動画速度を表示
  setTimeout(function() {
    var videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      currentSpeedDisplay.textContent = '現在の速度: ' + videos[0].playbackRate + 'x (' + videos.length + '個の動画)';
    }
  }, 500);
  
  // デバッグ用：ボタンを強制的に表示
  console.log('動画速度コントローラーが読み込まれました');
  
})();