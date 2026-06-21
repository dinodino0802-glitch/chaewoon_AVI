// === 요소 선택 ===
const videoPlayer = document.getElementById('videoPlayer');
const textOverlay = document.getElementById('textOverlay');
const timeOverlay = document.getElementById('timeOverlay');
const timeDisplay = document.getElementById('timeDisplay');
const timeLabel = document.getElementById('timeLabel');
const statusText = document.getElementById('statusText');  // null일 수 있음 (제거됨)
const timerInputSection = document.getElementById('timerInputSection');
const timerHours = document.getElementById('timerHours');
const timerMinutes = document.getElementById('timerMinutes');
const timerSeconds = document.getElementById('timerSeconds');
const timerAudio = document.getElementById('timerAudio');
const bgmAudio = document.getElementById('bgmAudio');  // 배경음악

// === 상태 변수 ===
let currentMode = null;
let isIntroPlayed = false;
let stopwatchRunning = false;
let stopwatchTime = 0;
let timerRunning = false;
let timerTime = 0;

// === 설정 (수정 가능한 부분) ===
const CONFIG = {
  textOverlayPath: 'KakaoTalk_Photo_2026-06-22-04-23-07.png',  // PNG 파일 경로
  timerSoundPath: 'timer-sound.m4a',    // 오디오 파일 경로
  fadeInDuration: 500,                   // 페이드인 시간 (ms)
  
  // === 레터박스 색상 설정 ===
  letterboxColor: '#1a1a1a',             // 비디오 배경색 (검정: #000, 회색: #333, #666 등)
  
  // === 텍스트 오버레이 크기 설정 ===
  textOverlayMaxWidth: '100%',           // 텍스트 PNG 최대 너비 (90% = 축소, 100% = 원본, 110% = 확대)
  textOverlayMaxHeight: '100%',          // 텍스트 PNG 최대 높이
  
  // === VHS 필터 전역 설정 ===
  vhsEnabled: false,                     // VHS 필터 전체 활성화/비활성화
  
  // === 모드1 (현재 시각) 시계 설정 ===
  mode1: {
    displaySize: 35,
    labelSize: 0,
    positionTop: '37%',
    positionLeft: '66%',
    rotation: 90,                         // 회전 각도 (0, 90, -90, 180 등)
    textAlign: 'center',
    color: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    vhs: true,                           // 이 모드에 VHS 필터 적용 여부
  },
  
  // === 모드2 (스톱워치) 시계 설정 ===
  mode2: {
    displaySize: 15,
    labelSize: 0,
    positionTop: '33%',
    positionLeft: '50%',
    rotation: 0,                         // 회전 각도 (0, 90, -90, 180 등)
    textAlign: 'center',
    color: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    vhs: true,                           // 이 모드에 VHS 필터 적용 여부
  },
  
  // === 모드3 (타이머) 시계 설정 ===
  mode3: {
    displaySize: 50,
    labelSize: 0,
    positionTop: '50%',
    positionLeft: '61%',
    rotation: 0,                         // 회전 각도 (0, 90, -90, 180 등)
    textAlign: 'center',
    color: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    vhs: true,                           // 이 모드에 VHS 필터 적용 여부
  },
};

// === 텍스트 오버레이 표시/숨김 ===
function showTextOverlay(show = true) {
  if (show) {
    if (!textOverlay.querySelector('img')) {
      const img = document.createElement('img');
      img.src = CONFIG.textOverlayPath;
      img.style.maxWidth = CONFIG.textOverlayMaxWidth;
      img.style.maxHeight = CONFIG.textOverlayMaxHeight;
      textOverlay.appendChild(img);
    }
    textOverlay.classList.add('show');
  } else {
    textOverlay.classList.remove('show');
  }
}

// === 시간 오버레이 표시/숨김 ===
function showTimeOverlay(show = true) {
  if (show) {
    timeOverlay.classList.add('show');
  } else {
    timeOverlay.classList.remove('show');
  }
}

// === 시간 포맷 (HH:MM:SS) ===
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// === 비디오 페이드인 애니메이션 ===
function fadeInVideo() {
  videoPlayer.style.opacity = '0';
  videoPlayer.style.transition = `opacity ${CONFIG.fadeInDuration}ms ease-in-out`;
  setTimeout(() => {
    videoPlayer.style.opacity = '1';
  }, 10);
}

// === VHS 필터 적용/제거 ===
function applyVHSFilter(enabled) {
  if (enabled) {
    // VHS 필터 활성화
    videoPlayer.style.filter = `sepia(0.2) saturate(1.3) contrast(1.1) brightness(0.95)`;
    videoPlayer.classList.add('vhs-effect');
  } else {
    // VHS 필터 해제
    videoPlayer.style.filter = 'none';
    videoPlayer.classList.remove('vhs-effect');
  }
}

// === 모드 전환 ===
function switchMode(mode) {
  currentMode = mode;
  videoPlayer.pause();
  
  // 타이머 음성 중지 (다른 화면으로 전환 시)
  if (mode !== 3) {
    timerAudio.pause();
    timerAudio.currentTime = 0;
  }
  
  if (statusText) statusText.classList.remove('timer-end');
  timerRunning = false;
  timerInputSection.style.display = 'none';
  
  if (mode === 'int') {
    // === INT 모드: 오프닝 영상 ===
    videoPlayer.src = videoData.int;
    videoPlayer.loop = false;
    if (statusText) statusText.textContent = '▶ Int 영상 재생 중...';
    if (statusText) statusText.classList.add('active');
    showTextOverlay(false);
    showTimeOverlay(false);
    bgmAudio.pause();  // ← 배경음악 중지
    bgmAudio.currentTime = 0;
    videoPlayer.play();
    
    videoPlayer.onended = () => {
      isIntroPlayed = true;
      
      // 1초 페이드 아웃
      videoPlayer.style.opacity = '0';
      videoPlayer.style.transition = 'opacity 1s ease-in-out';
      
      // 1초 후 모드 전환 (switchMode 내에서 1초 fade in)
      setTimeout(() => {
        switchMode(1);
      }, 1000);
    };
    
  } else if (mode === 1) {
    // === 모드 1: 현재 시각 ===
    videoPlayer.src = videoData.video1;
    videoPlayer.loop = true;
    if (statusText) statusText.textContent = '▶ Video 1 (현재 시각) 반복재생 중...';
    if (statusText) statusText.classList.add('active');
    showTextOverlay(true);
    showTimeOverlay(true);
    applyTimeOverlayConfig(CONFIG.mode1);  // 모드1 설정 적용
    applyVHSFilter(CONFIG.vhsEnabled && CONFIG.mode1.vhs);  // VHS 필터 적용
    timeLabel.textContent = '현재 시각';
    bgmAudio.play();  // ← 배경음악 재생
    fadeInVideo();
    videoPlayer.play();
    stopwatchRunning = false;
    
  } else if (mode === 2) {
    // === 모드 2: 스톱워치 ===
    videoPlayer.src = videoData.video2;
    videoPlayer.loop = true;
    if (statusText) statusText.textContent = '▶ Video 2 (스톱워치) 반복재생 중... [Space: 시작/정지]';
    if (statusText) statusText.classList.add('active');
    showTextOverlay(true);
    showTimeOverlay(true);
    applyTimeOverlayConfig(CONFIG.mode2);  // 모드2 설정 적용
    applyVHSFilter(CONFIG.vhsEnabled && CONFIG.mode2.vhs);  // VHS 필터 적용
    timeLabel.textContent = '스톱워치';
    bgmAudio.play();  // ← 배경음악 재생
    fadeInVideo();
    videoPlayer.play();
    stopwatchRunning = false;
    stopwatchTime = 0;
    
  } else if (mode === 3) {
    // === 모드 3: 타이머 ===
    videoPlayer.src = videoData.video4;
    videoPlayer.loop = true;
    if (statusText) statusText.textContent = '▶ Video 3 (타이머) 반복재생 중...';
    if (statusText) statusText.classList.add('active');
    showTextOverlay(true);
    showTimeOverlay(true);
    applyTimeOverlayConfig(CONFIG.mode3);  // 모드3 설정 적용
    applyVHSFilter(CONFIG.vhsEnabled && CONFIG.mode3.vhs);  // VHS 필터 적용
    timeLabel.textContent = '타이머';
    bgmAudio.play();  // ← 배경음악 재생
    timerInputSection.style.display = 'block';
    fadeInVideo();
    videoPlayer.play();
    timerRunning = false;
    timerTime = 0;
    timerHours.value = '0';
    timerMinutes.value = '0';
    timerSeconds.value = '0';
  }
}

// === 시간 업데이트 (매 프레임) ===
function updateTime() {
  if (currentMode === 1) {
    // 현재 시각
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    
  } else if (currentMode === 2) {
    // 스톱워치
    timeDisplay.textContent = formatTime(stopwatchTime);
    
  } else if (currentMode === 3) {
    // 타이머
    timeDisplay.textContent = formatTime(timerTime);
  }
  
  requestAnimationFrame(updateTime);
}

// === 키보드 입력 처리 ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'i' || e.key === 'I') {
    switchMode('int');
  } else if (e.key === 'q' || e.key === 'Q') {  // ← 1에서 q로 변경
    switchMode(1);
  } else if (e.key === 'w' || e.key === 'W') {  // ← 2에서 w로 변경
    switchMode(2);
  } else if (e.key === 'e' || e.key === 'E') {  // ← 3에서 e로 변경
    switchMode(3);
  } else if (e.code === 'Space' && currentMode === 2) {
    // 스톱워치 모드에서 스페이스바로 시작/정지
    e.preventDefault();
    stopwatchRunning = !stopwatchRunning;
    const action = stopwatchRunning ? '시작' : '정지';
    if (statusText) statusText.textContent = `⏱ 스톱워치 ${action}됨`;
  }
});

// === 스톱워치 카운트 (1초마다) ===
setInterval(() => {
  if (stopwatchRunning && currentMode === 2) {
    stopwatchTime++;
  }
}, 1000);

// === 타이머 입력 처리 ===
[timerHours, timerMinutes, timerSeconds].forEach(input => {
  input.addEventListener('change', () => {
    const h = parseInt(timerHours.value) || 0;
    const m = parseInt(timerMinutes.value) || 0;
    const s = parseInt(timerSeconds.value) || 0;
    timerTime = h * 3600 + m * 60 + s;
    timerRunning = timerTime > 0;
    
    if (timerRunning) {
      if (statusText) statusText.textContent = `⏰ 타이머 설정됨: ${formatTime(timerTime)}`;
      if (statusText) statusText.classList.add('active');
    }
  });
  
  input.addEventListener('input', () => {
    // 입력값을 2자리로 제한
    if (input.value.length > 2) {
      input.value = input.value.slice(0, 2);
    }
  });
});

// === 타이머 카운트다운 (1초마다) ===
setInterval(() => {
  if (timerRunning && currentMode === 3 && timerTime > 0) {
    timerTime--;
    
    if (timerTime === 0) {
      // 타이머 종료!
      timerRunning = false;
      if (statusText) statusText.textContent = '⏰ 타이머 종료!';
      if (statusText) statusText.classList.add('timer-end');
      
      // 음성 재생
      try {
        timerAudio.currentTime = 0;
        timerAudio.play().catch(() => {
          console.log('음성 재생 실패 (사용자 상호작용 필요)');
        });
      } catch (err) {
        console.log('음성 재생 오류:', err);
      }
    }
  }
}, 1000);

// === 시계 스타일 적용 (모드별) ===
function applyTimeOverlayConfig(modeConfig) {
  // 시계 위치 설정
  timeOverlay.style.top = modeConfig.positionTop;
  timeOverlay.style.left = modeConfig.positionLeft;
  
  // 회전 적용
  timeDisplay.style.transform = `rotate(${modeConfig.rotation}deg)`;
  timeLabel.style.transform = `rotate(${modeConfig.rotation}deg)`;
  
  // 시간 디스플레이 스타일
  timeDisplay.style.fontSize = modeConfig.displaySize + 'px';
  timeDisplay.style.color = modeConfig.color;
  timeDisplay.style.textShadow = `3px 3px 10px ${modeConfig.shadowColor},
                                  0 0 20px ${modeConfig.glowColor}`;
  timeDisplay.style.textAlign = modeConfig.textAlign;
  
  // 라벨 스타일
  timeLabel.style.fontSize = modeConfig.labelSize + 'px';
  timeLabel.style.color = modeConfig.color;
  timeLabel.style.textShadow = `2px 2px 8px ${modeConfig.shadowColor}`;
  timeLabel.style.textAlign = modeConfig.textAlign;
}

// === 초기화: 시간 업데이트 시작 ===
updateTime();

// === 레터박스 색상 적용 ===
document.querySelector('.video-section').style.backgroundColor = CONFIG.letterboxColor;

// === 프로그램 시작 ===
setTimeout(() => {
  switchMode('int');
}, 500);
