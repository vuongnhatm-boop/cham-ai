/* ==========================================================================
   CHẠM - JAVASCRIPT CONTROLLER & GOOGLE GEMINI AI ENGINE
   Hệ sinh thái Hỗ trợ Tâm lý & Tự điều chỉnh Học tập - PTDTNT THPT Lào Cai
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatContainer = document.getElementById('chatContainer');
  const messageFeed = document.getElementById('messageFeed');
  const typingIndicator = document.getElementById('typingIndicator');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const welcomeCard = document.getElementById('welcomeCard');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const currentModeTag = document.getElementById('currentModeTag');
  const aiStatusPill = document.getElementById('aiStatusPill');
  const aiStatusText = document.getElementById('aiStatusText');

  // Mode buttons
  const modeAutoBtn = document.getElementById('modeAutoBtn');
  const modeSageBtn = document.getElementById('modeSageBtn');
  const modeOrangeBtn = document.getElementById('modeOrangeBtn');

  // Modals
  const breathingModal = document.getElementById('breathingModal');
  const timerModal = document.getElementById('timerModal');
  const fanDetailModal = document.getElementById('fanDetailModal');
  const sosModal = document.getElementById('sosModal');
  const apiKeyModal = document.getElementById('apiKeyModal');
  const openApiKeyModalBtn = document.getElementById('openApiKeyModalBtn');
  const closeApiKeyModal = document.getElementById('closeApiKeyModal');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleShowKeyBtn = document.getElementById('toggleShowKeyBtn');

  // API Key & Model Configuration
  const DEFAULT_API_KEY = 'AQ.Ab8RN6L8Z51P_Dre-ujROkl_LZfSQ-XjKlAIOM1w_usADN0CLQ';
  let activeApiKey = localStorage.getItem('CHAM_GEMINI_API_KEY') || DEFAULT_API_KEY;
  if (apiKeyInput) apiKeyInput.value = activeApiKey;

  // Fallback models order
  const GEMINI_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];

  // Conversation memory for multi-turn chat
  let conversationHistory = [];

  // State
  let currentOperatingMode = 'auto'; // 'auto' | 'sage' | 'orange'
  let currentFanCardIndex = 1;

  /* ==========================================================================
     1. GỌI GOOGLE GEMINI API TRỰC TIẾP
     ========================================================================== */
  async function callGeminiApi(userPrompt) {
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    if (conversationHistory.length > 12) {
      conversationHistory = conversationHistory.slice(conversationHistory.length - 12);
    }

    let dynamicSystemPrompt = window.GEMINI_CHAM_SYSTEM_INSTRUCTION || '';
    if (currentOperatingMode === 'sage') {
      dynamicSystemPrompt += '\n\n[CHỈ ĐỊNH ĐẶC BIỆT]: Học sinh đang yêu cầu Chế độ 1 (Xoa dịu). Hãy tập trung tối đa vào thấu cảm, xoa dịu, kỹ thuật tự trắc ẩn và hạ nhiệt cảm xúc.';
    } else if (currentOperatingMode === 'orange') {
      dynamicSystemPrompt += '\n\n[CHỈ ĐỊNH ĐẶC BIỆT]: Học sinh đang yêu cầu Chế độ 2 (Bứt phá). Hãy tập trung sâu vào chiến lược nhận thức thực chứng, tư duy phát triển và các bước tự điều chỉnh học tập cụ thể.';
    }

    // YÊU CẦU BẮT BUỘC VỀ ĐỘ DÀI
    dynamicSystemPrompt += '\n\n[YÊU CẦU ĐẶC BIỆT - BẮT BUỘC]: Hãy trả lời THẬT NGẮN GỌN, SÚC TÍCH (chỉ từ 2 đến 3 đoạn văn ngắn, dưới 100 từ). Tuyệt đối không viết dài dòng, không giảng đạo lê thê. Đi thẳng vào giải pháp và kết thúc bằng 1 lời mời hành động nhỏ!';

    const payload = {
      system_instruction: {
        parts: [{ text: dynamicSystemPrompt }]
      },
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 350
      }
    };

    let lastError = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeApiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const botReply = data.candidates[0].content.parts[0].text;
          conversationHistory.push({
            role: 'model',
            parts: [{ text: botReply }]
          });

          updateAiBadge(true, `Gemini (${modelName.replace('gemini-', '')})`);
          return { success: true, text: botReply };
        } else if (data.error) {
          lastError = data.error.message || JSON.stringify(data.error);
          console.warn(`Model ${modelName} returned error:`, lastError);
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`Fetch to ${modelName} failed:`, err);
      }
    }

    console.error('All Gemini models failed, falling back to local engine. Last error:', lastError);
    updateAiBadge(false, 'Ngoại tuyến (Quy tắc nội bộ)');
    return { success: false, error: lastError };
  }

  function updateAiBadge(isConnected, label) {
    if (aiStatusText) aiStatusText.textContent = label;
    if (aiStatusPill) {
      if (isConnected) {
        aiStatusPill.style.color = '#059669';
        aiStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        aiStatusPill.style.background = 'rgba(16, 185, 129, 0.1)';
      } else {
        aiStatusPill.style.color = '#D97706';
        aiStatusPill.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        aiStatusPill.style.background = 'rgba(245, 158, 11, 0.1)';
      }
    }
  }

  /* ==========================================================================
     2. GỬI VÀ HIỂN THỊ TIN NHẮN
     ========================================================================== */
  function addMessage(sender, rawContent, metaTag = '') {
    const row = document.createElement('div');
    row.className = `message-row ${sender}-row`;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (sender === 'user') {
      row.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="msg-bubble-wrap">
          <div class="msg-author"><span class="msg-time">${timeStr}</span> Bạn</div>
          <div class="msg-bubble">
            <p>${escapeHtml(rawContent)}</p>
          </div>
        </div>
      `;
    } else {
      let formattedHtml = '';
      if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
        formattedHtml = window.marked.parse(rawContent);
      } else {
        formattedHtml = rawContent;
      }

      let dynamicActionButtons = '';
      const lower = rawContent.toLowerCase();
      if (lower.includes('4-7-8') || lower.includes('thở')) {
        dynamicActionButtons += `<button class="msg-action-btn" onclick="openBreathingModal()"><i class="fa-solid fa-wind"></i> Mở bài tập Thở 4-7-8</button> `;
      }
      if (lower.includes('5 phút') || lower.includes('trì hoãn') || lower.includes('sức ỳ')) {
        dynamicActionButtons += `<button class="msg-action-btn orange-act" onclick="openTimerModal()"><i class="fa-solid fa-stopwatch"></i> Bật hẹn giờ 5 phút</button> `;
      }
      if (lower.includes('nan 02') || lower.includes('nan 2')) {
        dynamicActionButtons += `<button class="msg-action-btn" onclick="openFanDetail(2)"><i class="fa-solid fa-leaf"></i> Mở Nan 02: Tự tha thứ</button> `;
      }
      if (lower.includes('nan 09') || lower.includes('nan 9')) {
        dynamicActionButtons += `<button class="msg-action-btn orange-act" onclick="openFanDetail(9)"><i class="fa-solid fa-lightbulb"></i> Mở Nan 09: Đọc đảo ngược</button> `;
      }
      if (lower.includes('nan 10') || lower.includes('feynman')) {
        dynamicActionButtons += `<button class="msg-action-btn orange-act" onclick="openFanDetail(10)"><i class="fa-solid fa-chalkboard-user"></i> Mở Nan 10: Feynman</button> `;
      }
      if (lower.includes('nan 11') || lower.includes('pomodoro')) {
        dynamicActionButtons += `<button class="msg-action-btn orange-act" onclick="openFanDetail(11)"><i class="fa-solid fa-clock"></i> Mở Nan 11: Top 3 & Pomodoro</button> `;
      }

      if (dynamicActionButtons) {
        formattedHtml += `<div class="msg-actions-row">${dynamicActionButtons}</div>`;
      }

      row.innerHTML = `
        <div class="msg-avatar"><img src="assets/avatar.jpg" alt="CHẠM" class="bot-avatar-img" width="38" height="38" style="width: 38px; height: 38px; max-width: 38px; max-height: 38px; object-fit: cover; border-radius: 50%; display: block;"></div>
        <div class="msg-bubble-wrap">
          <div class="msg-author">
            CHẠM ${metaTag ? `<span class="mode-tag">${metaTag}</span>` : ''} 
            <span class="msg-time">${timeStr}</span>
          </div>
          <div class="msg-bubble">
            ${formattedHtml}
          </div>
        </div>
      `;
    }

    messageFeed.appendChild(row);
    scrollToBottom();

    // Đồng bộ dữ liệu trò chuyện lên Máy chủ Google Firebase (ai-cham)
    if (window.chamFirebase && typeof window.chamFirebase.saveChatMessage === 'function') {
      window.chamFirebase.saveChatMessage(sender, rawContent, currentOperatingMode, metaTag);
    }
  }

  async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';

    if (welcomeCard) welcomeCard.style.display = 'none';

    showTyping(true);

    try {
      const aiResult = await callGeminiApi(text);
      showTyping(false);

      if (aiResult.success) {
        const tag = currentOperatingMode === 'orange' ? 'Gemini AI • Bứt Phá' : 'Gemini AI • Xoa Dịu';
        addMessage('bot', aiResult.text, tag);
      } else {
        const local = window.getLocalFallbackResponse(text, currentOperatingMode);
        if (local.isEmergency) setTimeout(() => openSosModal(), 800);
        updateAppTheme(local.mode);
        addMessage('bot', local.response, local.tag);
      }
    } catch (err) {
      showTyping(false);
      console.error(err);
      const local = window.getLocalFallbackResponse(text, currentOperatingMode);
      if (local.isEmergency) setTimeout(() => openSosModal(), 800);
      updateAppTheme(local.mode);
      addMessage('bot', local.response, local.tag);
    }
  }

  function showTyping(show) {
    if (show) {
      typingIndicator.classList.remove('hidden');
    } else {
      typingIndicator.classList.add('hidden');
    }
    scrollToBottom();
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function escapeHtml(string) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(string).replace(/[&<>"']/g, s => entityMap[s]);
  }

  window.sendQuickMessage = function(text) {
    userInput.value = text;
    handleSend();
  };

  /* ==========================================================================
     3. CHUYỂN ĐỔI CHẾ ĐỘ (THEME & OPERATING MODE)
     ========================================================================== */
  function updateAppTheme(mode) {
    if (currentOperatingMode !== 'auto') {
      mode = currentOperatingMode;
    }

    if (mode === 'orange') {
      currentModeTag.textContent = 'Chế độ 2: Trợ lý Tự điều chỉnh học tập';
      currentModeTag.style.background = 'var(--orange-100)';
      currentModeTag.style.color = 'var(--orange-800)';
    } else {
      currentModeTag.textContent = 'Chế độ 1: Xoa dịu & Tự trắc ẩn';
      currentModeTag.style.background = 'var(--sage-100)';
      currentModeTag.style.color = 'var(--sage-800)';
    }
  }

  function setMode(mode) {
    currentOperatingMode = mode;
    modeAutoBtn.classList.toggle('active', mode === 'auto');
    modeSageBtn.classList.toggle('active', mode === 'sage');
    modeOrangeBtn.classList.toggle('active', mode === 'orange');

    if (mode === 'sage') {
      updateAppTheme('sage');
    } else if (mode === 'orange') {
      updateAppTheme('orange');
    } else {
      currentModeTag.textContent = 'Chế độ Tự động (Lắng nghe & Thấu cảm)';
      currentModeTag.style.background = 'var(--sage-100)';
      currentModeTag.style.color = 'var(--sage-800)';
    }
  }

  modeAutoBtn.addEventListener('click', () => setMode('auto'));
  modeSageBtn.addEventListener('click', () => setMode('sage'));
  modeOrangeBtn.addEventListener('click', () => setMode('orange'));

  // Scenario Chips click
  document.querySelectorAll('.scenario-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const scenarioText = chip.querySelector('span')?.textContent || '';
      if (scenarioText) {
        sendQuickMessage(scenarioText);
      }
    });
  });

  // Textarea auto resize & enter submit
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  /* ==========================================================================
     4. QUẢN LÝ CÀI ĐẶT API KEY
     ========================================================================== */
  if (openApiKeyModalBtn) {
    openApiKeyModalBtn.addEventListener('click', () => {
      if (apiKeyInput) apiKeyInput.value = activeApiKey;
      apiKeyModal.classList.remove('hidden');
    });
  }

  if (closeApiKeyModal) {
    closeApiKeyModal.addEventListener('click', () => {
      apiKeyModal.classList.add('hidden');
    });
  }

  if (toggleShowKeyBtn && apiKeyInput) {
    toggleShowKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleShowKeyBtn.textContent = 'Ẩn Key';
      } else {
        apiKeyInput.type = 'password';
        toggleShowKeyBtn.textContent = 'Hiện Key';
      }
    });
  }

  if (saveApiKeyBtn && apiKeyInput) {
    saveApiKeyBtn.addEventListener('click', () => {
      const newKey = apiKeyInput.value.trim();
      if (newKey) {
        activeApiKey = newKey;
        localStorage.setItem('CHAM_GEMINI_API_KEY', newKey);
        apiKeyModal.classList.add('hidden');
        updateAiBadge(true, 'Gemini AI (Đã lưu Key)');
        alert('Đã cập nhật Gemini API Key thành công!');
      } else {
        alert('Vui lòng không để trống API Key.');
      }
    });
  }

  /* ==========================================================================
     5. SIDEBAR & NAN THẺ QUẠT
     ========================================================================== */
  toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
  document.getElementById('openToolsFromInput').addEventListener('click', () => sidebar.classList.toggle('open'));

  const fanTabs = document.querySelectorAll('.fan-tab');
  const sageCards = document.getElementById('sage-cards');
  const orangeCards = document.getElementById('orange-cards');

  fanTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      fanTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-target');
      if (target === 'sage-cards') {
        sageCards.classList.remove('hidden');
        orangeCards.classList.add('hidden');
      } else {
        sageCards.classList.add('hidden');
        orangeCards.classList.remove('hidden');
      }
    });
  });

  const modalFanNum = document.getElementById('modalFanNum');
  const modalFanTitle = document.getElementById('modalFanTitle');
  const modalFanBody = document.getElementById('modalFanBody');
  const closeFanModal = document.getElementById('closeFanModal');
  const fanModalPrevBtn = document.getElementById('fanModalPrevBtn');
  const fanModalNextBtn = document.getElementById('fanModalNextBtn');

  window.openFanDetail = function(fanId) {
    currentFanCardIndex = parseInt(fanId);
    const data = window.fanCardsData ? window.fanCardsData[currentFanCardIndex] : null;
    if (!data) return;

    modalFanNum.textContent = data.num;
    modalFanNum.style.background = data.type === 'orange' ? 'var(--orange-100)' : 'var(--sage-100)';
    modalFanNum.style.color = data.type === 'orange' ? 'var(--orange-800)' : 'var(--sage-800)';
    
    modalFanTitle.textContent = data.title;
    modalFanBody.innerHTML = `
      <div style="font-style: italic; color: ${data.type === 'orange' ? 'var(--orange-800)' : 'var(--sage-800)'}; margin-bottom: 14px; font-weight: 600;">
        ${data.quote}
      </div>
      ${data.content}
    `;

    fanDetailModal.classList.remove('hidden');

    // Ghi nhận sự kiện học sinh xem nan thẻ quạt lên Firebase
    if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
      window.chamFirebase.logEvent('view_fan_card', { card_id: currentFanCardIndex, card_title: data.title, type: data.type });
    }
  };

  document.querySelectorAll('.fan-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-fan');
      openFanDetail(id);
    });
  });

  closeFanModal.addEventListener('click', () => fanDetailModal.classList.add('hidden'));

  fanModalPrevBtn.addEventListener('click', () => {
    openFanDetail(currentFanCardIndex > 1 ? currentFanCardIndex - 1 : 14);
  });

  fanModalNextBtn.addEventListener('click', () => {
    openFanDetail(currentFanCardIndex < 14 ? currentFanCardIndex + 1 : 1);
  });

  /* ==========================================================================
     6. BÀI TẬP THỞ 4-7-8 TƯƠNG TÁC
     ========================================================================== */
  const openBreathingBtn = document.getElementById('openBreathingBtn');
  const closeBreathingModal = document.getElementById('closeBreathingModal');
  const startBreathingBtn = document.getElementById('startBreathingBtn');
  const stopBreathingBtn = document.getElementById('stopBreathingBtn');
  const breathCircle = document.getElementById('breathCircle');
  const breathStateText = document.getElementById('breathStateText');
  const breathCounter = document.getElementById('breathCounter');
  const breathInstructions = document.getElementById('breathInstructions');
  const currentCycleCount = document.getElementById('currentCycleCount');

  let breathInterval = null;
  let isBreathingActive = false;

  window.openBreathingModal = function() {
    breathingModal.classList.remove('hidden');
    resetBreathingUI();
  };

  openBreathingBtn.addEventListener('click', openBreathingModal);
  closeBreathingModal.addEventListener('click', () => {
    stopBreathingExercise();
    breathingModal.classList.add('hidden');
  });

  function resetBreathingUI() {
    breathCircle.className = 'breath-circle';
    breathStateText.textContent = 'SẴN SÀNG';
    breathCounter.textContent = '--';
    breathInstructions.textContent = 'Nhấn nút "Bắt đầu" bên dưới, ngồi thẳng lưng và thả lỏng hai vai bạn nhé.';
    currentCycleCount.textContent = '0';
    startBreathingBtn.disabled = false;
    stopBreathingBtn.disabled = true;
  }

  function startBreathingExercise() {
    if (isBreathingActive) return;
    isBreathingActive = true;
    startBreathingBtn.disabled = true;
    stopBreathingBtn.disabled = false;

    if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
      window.chamFirebase.logEvent('start_breathing_478');
    }

    let cycle = 1;
    const maxCycles = 3;

    function runPhase(name, duration, nextCallback) {
      if (!isBreathingActive) return;

      breathCircle.className = `breath-circle ${name}`;
      let timeLeft = duration;

      if (name === 'inhale') {
        breathStateText.textContent = 'HÍT VÀO';
        breathInstructions.textContent = '🌿 Hít sâu bằng mũi, đưa không khí xuống sâu lồng ngực...';
      } else if (name === 'hold') {
        breathStateText.textContent = 'GIỮ HƠI';
        breathInstructions.textContent = '✨ Giữ yên hơi thở, cảm nhận nhịp tim đang chậm lại...';
      } else if (name === 'exhale') {
        breathStateText.textContent = 'THỞ RA';
        breathInstructions.textContent = '🍃 Thở ra từ từ bằng miệng, buông bỏ mọi căng thẳng...';
      }

      breathCounter.textContent = timeLeft;

      breathInterval = setInterval(() => {
        if (!isBreathingActive) {
          clearInterval(breathInterval);
          return;
        }
        timeLeft--;
        breathCounter.textContent = timeLeft;

        if (timeLeft <= 0) {
          clearInterval(breathInterval);
          nextCallback();
        }
      }, 1000);
    }

    function executeFullCycle() {
      if (!isBreathingActive || cycle > maxCycles) {
        if (cycle > maxCycles) finishBreathingExercise();
        return;
      }

      currentCycleCount.textContent = cycle;

      runPhase('inhale', 4, () => {
        runPhase('hold', 7, () => {
          runPhase('exhale', 8, () => {
            cycle++;
            executeFullCycle();
          });
        });
      });
    }

    executeFullCycle();
  }

  function finishBreathingExercise() {
    isBreathingActive = false;
    breathCircle.className = 'breath-circle';
    breathStateText.textContent = 'HOÀN THÀNH';
    breathCounter.textContent = '✓';
    breathInstructions.textContent = '🎉 Tuyệt vời! Não bộ của bạn đã được hạ nhiệt và nạp đầy oxy trong lành.';
    startBreathingBtn.disabled = false;
    stopBreathingBtn.disabled = true;

    if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
      window.chamFirebase.logEvent('complete_breathing_478', { total_cycles: 3 });
      window.chamFirebase.recordUserStat('breathing');
    }
  }

  function stopBreathingExercise() {
    isBreathingActive = false;
    if (breathInterval) clearInterval(breathInterval);
    resetBreathingUI();
  }

  startBreathingBtn.addEventListener('click', startBreathingExercise);
  stopBreathingBtn.addEventListener('click', stopBreathingExercise);

  /* ==========================================================================
     7. HẸN GIỜ 5 PHÚT KHỞI ĐỘNG (ZEIGARNIK RULE)
     ========================================================================== */
  const openTimerBtn = document.getElementById('openTimerBtn');
  const closeTimerModal = document.getElementById('closeTimerModal');
  const startTimerBtn = document.getElementById('startTimerBtn');
  const resetTimerBtn = document.getElementById('resetTimerBtn');
  const timerDisplay = document.getElementById('timerDisplay');

  let timerDuration = 5 * 60;
  let timerInterval = null;
  let isTimerRunning = false;

  window.openTimerModal = function() {
    timerModal.classList.remove('hidden');
    if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
      window.chamFirebase.logEvent('open_timer_modal');
    }
  };

  openTimerBtn.addEventListener('click', openTimerModal);
  closeTimerModal.addEventListener('click', () => timerModal.classList.add('hidden'));

  function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  }

  startTimerBtn.addEventListener('click', () => {
    if (!isTimerRunning) {
      isTimerRunning = true;
      startTimerBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng';
      startTimerBtn.classList.remove('orange-bg');
      startTimerBtn.style.background = '#64748b';

      if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
        window.chamFirebase.logEvent('start_5min_timer');
      }

      timerInterval = setInterval(() => {
        if (timerDuration > 0) {
          timerDuration--;
          updateTimerDisplay(timerDuration);
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
          startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Bắt đầu lại';
          startTimerBtn.classList.add('orange-bg');
          alert('⏰ Đã hết 5 phút khởi động! Não bộ của bạn đã sẵn sàng bứt phá tiếp tục bài học!');
        }
      }, 1000);
    } else {
      isTimerRunning = false;
      clearInterval(timerInterval);
      startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục 5 phút';
      startTimerBtn.classList.add('orange-bg');
    }
  });

  resetTimerBtn.addEventListener('click', () => {
    isTimerRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    timerDuration = 5 * 60;
    updateTimerDisplay(timerDuration);
    startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Bắt đầu 5 phút ngay';
    startTimerBtn.classList.add('orange-bg');
  });

  /* ==========================================================================
     8. SƠ CỨU TÂM LÝ KHẨN CẤP (WHO PFA MODAL)
     ========================================================================== */
  const openSosBtn = document.getElementById('openSosBtn');
  const openSosBtnTop = document.getElementById('openSosBtnTop');
  const closeSosModal = document.getElementById('closeSosModal');
  const closeSosActionBtn = document.getElementById('closeSosActionBtn');

  window.openSosModal = function() {
    sosModal.classList.remove('hidden');
    if (window.chamFirebase && typeof window.chamFirebase.logEvent === 'function') {
      window.chamFirebase.logEvent('open_sos_emergency');
    }
  };

  openSosBtn.addEventListener('click', openSosModal);
  openSosBtnTop.addEventListener('click', openSosModal);
  closeSosModal.addEventListener('click', () => sosModal.classList.add('hidden'));
  closeSosActionBtn.addEventListener('click', () => sosModal.classList.add('hidden'));

  /* ==========================================================================
     9. XỬ LÝ ĐĂNG NHẬP (FIREBASE AUTH) & HỒ SƠ HỌC SINH
     ========================================================================== */
  const authModal = document.getElementById('authModal');
  const openAuthModalBtn = document.getElementById('openAuthModalBtn');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const tabSignInBtn = document.getElementById('tabSignInBtn');
  const tabSignUpBtn = document.getElementById('tabSignUpBtn');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const authAlert = document.getElementById('authAlert');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const guestSignInBtn = document.getElementById('guestSignInBtn');
  const userProfileBtn = document.getElementById('userProfileBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const loadCloudHistoryBtn = document.getElementById('loadCloudHistoryBtn');

  function showAuthAlert(message, isError = true) {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.className = `auth-alert ${isError ? 'error' : 'success'}`;
    authAlert.classList.remove('hidden');
  }

  function hideAuthAlert() {
    if (authAlert) authAlert.classList.add('hidden');
  }

  if (openAuthModalBtn) {
    openAuthModalBtn.addEventListener('click', () => {
      hideAuthAlert();
      authModal.classList.remove('hidden');
    });
  }

  if (closeAuthModal) {
    closeAuthModal.addEventListener('click', () => {
      authModal.classList.add('hidden');
    });
  }

  // Chuyển tab Đăng nhập / Đăng ký
  if (tabSignInBtn && tabSignUpBtn) {
    tabSignInBtn.addEventListener('click', () => {
      tabSignInBtn.classList.add('active');
      tabSignUpBtn.classList.remove('active');
      signinForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      hideAuthAlert();
    });

    tabSignUpBtn.addEventListener('click', () => {
      tabSignUpBtn.classList.add('active');
      tabSignInBtn.classList.remove('active');
      signupForm.classList.remove('hidden');
      signinForm.classList.add('hidden');
      hideAuthAlert();
    });
  }

  // Xử lý Đăng nhập Email
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const password = document.getElementById('signinPassword').value;

      try {
        showAuthAlert('Đang xác thực thông tin...', false);
        await window.chamFirebase.signInWithEmail(email, password);
        showAuthAlert('Đăng nhập thành công! Chào mừng bạn quay trở lại.', false);
        setTimeout(() => {
          authModal.classList.add('hidden');
          signinForm.reset();
        }, 800);
      } catch (err) {
        let msg = 'Đăng nhập không thành công: ' + err.message;
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          msg = 'Email hoặc mật khẩu không chính xác. Bạn vui lòng kiểm tra lại.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Định dạng email không hợp lệ.';
        }
        showAuthAlert(msg, true);
      }
    });
  }

  // Xử lý Đăng ký Email
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const className = document.getElementById('signupClass').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      try {
        showAuthAlert('Đang khởi tạo tài khoản học sinh trên đám mây...', false);
        await window.chamFirebase.signUpWithEmail(email, password, name, className);
        showAuthAlert('Tạo tài khoản thành công! Dữ liệu của bạn đã được bảo mật.', false);
        setTimeout(() => {
          authModal.classList.add('hidden');
          signupForm.reset();
        }, 900);
      } catch (err) {
        let msg = 'Đăng ký thất bại: ' + err.message;
        if (err.code === 'auth/email-already-in-use') {
          msg = 'Email này đã được đăng ký. Bạn hãy chuyển sang tab Đăng nhập nhé.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Mật khẩu cần có ít nhất 6 ký tự để bảo vệ tài khoản.';
        }
        showAuthAlert(msg, true);
      }
    });
  }

  // Đăng nhập nhanh với Google
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      try {
        await window.chamFirebase.signInWithGoogle();
        authModal.classList.add('hidden');
      } catch (err) {
        showAuthAlert('Đăng nhập Google thất bại hoặc bạn đã hủy cửa sổ đăng nhập.', true);
      }
    });
  }

  // Tâm sự Ẩn danh (Guest)
  if (guestSignInBtn) {
    guestSignInBtn.addEventListener('click', async () => {
      try {
        showAuthAlert('Đang tạo phiên ẩn danh bảo mật cho bạn...', false);
        await window.chamFirebase.signInAnonymously();
        setTimeout(() => {
          authModal.classList.add('hidden');
        }, 600);
      } catch (err) {
        showAuthAlert('Không thể kích hoạt phiên ẩn danh: ' + err.message, true);
      }
    });
  }

  // Dropdown hồ sơ học sinh
  if (userProfileBtn && userDropdownMenu) {
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
        userDropdownMenu.classList.add('hidden');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.chamFirebase.signOutUser();
      userDropdownMenu.classList.add('hidden');
      alert('Bạn đã đăng xuất tài khoản an toàn.');
    });
  }

  // Tải lại lịch sử tin nhắn cá nhân từ Cloud Firestore
  async function loadUserCloudHistory() {
    const messages = await window.chamFirebase.loadUserChatHistory(25);
    if (!messages || messages.length === 0) {
      alert('Tài khoản của bạn chưa có lịch sử cuộc trò chuyện nào được lưu trên đám mây.');
      return;
    }

    if (confirm(`Tìm thấy ${messages.length} tin nhắn trong hồ sơ của bạn. Bạn có muốn tải lại vào khung trò chuyện không?`)) {
      messageFeed.innerHTML = '';
      messages.forEach(msg => {
        addMessage(msg.sender, msg.content, msg.metaTag || '');
      });
      if (welcomeCard) welcomeCard.style.display = 'none';
      if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
    }
  }

  if (loadCloudHistoryBtn) {
    loadCloudHistoryBtn.addEventListener('click', loadUserCloudHistory);
  }

  window.onUserSignedIn = function(user) {
    console.log('Chào mừng bạn quay lại CHẠM:', user.displayName || user.email);
  };

  /* ==========================================================================
     10. SỔ TAY TỰ TRẮC ẨN CÁ NHÂN (SELF-COMPASSION JOURNAL)
     ========================================================================== */
  const journalModal = document.getElementById('journalModal');
  const openJournalBtn = document.getElementById('openJournalBtn');
  const closeJournalModal = document.getElementById('closeJournalModal');
  const newJournalForm = document.getElementById('newJournalForm');
  const journalEntriesList = document.getElementById('journalEntriesList');
  const statJournalCount = document.getElementById('statJournalCount');
  const statBreathCount = document.getElementById('statBreathCount');
  const statTimerCount = document.getElementById('statTimerCount');

  async function refreshJournalUI() {
    const stats = window.chamFirebase.getLocalStats();
    if (statBreathCount) statBreathCount.textContent = stats.breathing;
    if (statTimerCount) statTimerCount.textContent = stats.timer;

    const entries = await window.chamFirebase.getJournalEntries();
    if (statJournalCount) statJournalCount.textContent = entries.length;

    if (!journalEntriesList) return;

    if (entries.length === 0) {
      journalEntriesList.innerHTML = '<div class="empty-journal-hint">Chưa có bài nhật ký nào. Hãy viết bài chia sẻ đầu tiên hôm nay nhé!</div>';
      return;
    }

    journalEntriesList.innerHTML = entries.map(item => `
      <div class="journal-entry-card">
        <div class="journal-entry-date"><i class="fa-regular fa-clock"></i> ${escapeHtml(item.clientDate || 'Gần đây')}</div>
        <p><strong>1. Khó khăn hôm nay:</strong> ${escapeHtml(item.event || '')}</p>
        <p><strong>2. Tính đồng loại:</strong> ${escapeHtml(item.commonHumanity || '')}</p>
        <p><strong>3. Lời nói bao dung với bản thân:</strong> <em>${escapeHtml(item.selfKindness || '')}</em></p>
      </div>
    `).join('');
  }

  if (openJournalBtn) {
    openJournalBtn.addEventListener('click', () => {
      if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
      journalModal.classList.remove('hidden');
      refreshJournalUI();
    });
  }

  if (closeJournalModal) {
    closeJournalModal.addEventListener('click', () => {
      journalModal.classList.add('hidden');
    });
  }

  if (newJournalForm) {
    newJournalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const eventVal = document.getElementById('journalEvent').value.trim();
      const commonVal = document.getElementById('journalCommonHumanity').value.trim();
      const kindnessVal = document.getElementById('journalSelfKindness').value.trim();

      if (!eventVal || !commonVal || !kindnessVal) return;

      try {
        await window.chamFirebase.saveJournalEntry(eventVal, commonVal, kindnessVal);
        newJournalForm.reset();
        await refreshJournalUI();
        alert('🎉 Đã lưu bài nhật ký tự trắc ẩn của bạn vào cơ sở dữ liệu đám mây an toàn!');
      } catch (err) {
        alert('Lỗi lưu bài nhật ký: ' + err.message);
      }
    });
  }

  // Đóng modal khi bấm ra ngoài nền tối
  [breathingModal, timerModal, fanDetailModal, sosModal, apiKeyModal, authModal, journalModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        if (modal === breathingModal) stopBreathingExercise();
      }
    });
  });
});
