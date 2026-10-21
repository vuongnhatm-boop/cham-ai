/* ==========================================================================
   CHẠM - DỊCH VỤ MÁY CHỦ ĐÁM MÂY GOOGLE FIREBASE
   Xác thực người dùng (Auth) & Lưu trữ dữ liệu cá nhân (Firestore)
   Dự án: ai-cham (PTDTNT THPT Lào Cai)
   ========================================================================== */

(function() {
  // Cấu hình Firebase Web App do người dùng cung cấp
  const firebaseConfig = {
    apiKey: "AIzaSyAt-RQocheeJXmQJvnrpqvQsorWc_e-27Q",
    authDomain: "ai-cham.firebaseapp.com",
    projectId: "ai-cham",
    storageBucket: "ai-cham.firebasestorage.app",
    messagingSenderId: "559585507652",
    appId: "1:559585507652:web:eb100c595227132c1bbf11",
    measurementId: "G-4XVHFCSZTD"
  };

  // Khởi tạo các biến dịch vụ
  let app = null;
  let auth = null;
  let analytics = null;
  let db = null;
  let isFirebaseReady = false;
  let currentUser = null;

  // Lấy hoặc tạo Session ID cho học sinh trên thiết bị này (dành cho chế độ khách/ẩn danh)
  let sessionId = localStorage.getItem('CHAM_STUDENT_SESSION_ID');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('CHAM_STUDENT_SESSION_ID', sessionId);
  }

  // Khởi tạo Firebase SDK
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps || firebase.apps.length === 0) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }

      // 1. Khởi tạo Authentication
      try {
        if (typeof firebase.auth === 'function') {
          auth = firebase.auth();
          console.log('✅ Firebase Auth đã sẵn sàng');
        }
      } catch (e) {
        console.warn('Firebase Auth chưa sẵn sàng:', e.message);
      }

      // 2. Khởi tạo Analytics
      try {
        if (typeof firebase.analytics === 'function') {
          analytics = firebase.analytics();
          console.log('✅ Firebase Analytics đã kích hoạt (G-4XVHFCSZTD)');
        }
      } catch (e) {
        console.warn('Firebase Analytics chưa sẵn sàng:', e.message);
      }

      // 3. Khởi tạo Cloud Firestore
      try {
        if (typeof firebase.firestore === 'function') {
          db = firebase.firestore();
          console.log('✅ Firebase Cloud Firestore đã kết nối: ai-cham');
        }
      } catch (e) {
        console.warn('Firebase Firestore chưa sẵn sàng:', e.message);
      }

      isFirebaseReady = true;
    } else {
      console.warn('Thư viện Firebase SDK chưa được tải.');
    }
  } catch (err) {
    console.error('Lỗi khởi tạo Firebase:', err);
  }

  // Lắng nghe thay đổi trạng thái đăng nhập
  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      updateUIAuthState(user);
      if (user) {
        console.log('👤 Đã đăng nhập:', user.email || user.displayName || 'Khách Ẩn danh', `(UID: ${user.uid})`);
        logEvent('login_success', {
          auth_provider: user.isAnonymous ? 'anonymous' : (user.providerData[0]?.providerId || 'password')
        });

        // Đảm bảo hồ sơ người dùng tồn tại trên Firestore
        await syncUserProfile(user);

        // Kích hoạt nạp lại lịch sử tin nhắn của người dùng nếu cần
        if (typeof window.onUserSignedIn === 'function') {
          window.onUserSignedIn(user);
        }
      } else {
        console.log('🔒 Chưa đăng nhập (Chế độ Khách cục bộ)');
        if (typeof window.onUserSignedOut === 'function') {
          window.onUserSignedOut();
        }
      }
    });
  }

  // Cập nhật hồ sơ người dùng lên Cloud Firestore
  async function syncUserProfile(user, additionalData = {}) {
    if (!db || !user) return;
    try {
      const userRef = db.collection('users').doc(user.uid);
      const snapshot = await userRef.get();

      const profileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || additionalData.displayName || (user.isAnonymous ? 'Học sinh Ẩn danh' : 'Học sinh CHẠM'),
        className: additionalData.className || (snapshot.exists ? snapshot.data().className : 'PTDTNT Lào Cai'),
        school: 'Trường PTDTNT THPT Tỉnh Lào Cai',
        photoURL: user.photoURL || '',
        isAnonymous: user.isAnonymous,
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!snapshot.exists) {
        profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      await userRef.set(profileData, { merge: true });
    } catch (err) {
      console.warn('Lỗi đồng bộ profile lên Firestore:', err.message);
    }
  }

  // Cập nhật giao diện thanh điều hướng theo trạng thái đăng nhập
  function updateUIAuthState(user) {
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const userProfileBox = document.getElementById('userProfileBox');
    const userDisplayName = document.getElementById('userDisplayName');
    const userAvatarText = document.getElementById('userAvatarText');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserSub = document.getElementById('dropdownUserSub');

    if (!openAuthModalBtn || !userProfileBox) return;

    if (user) {
      openAuthModalBtn.classList.add('hidden');
      userProfileBox.classList.remove('hidden');

      const name = user.displayName || (user.isAnonymous ? 'Học sinh Ẩn danh' : (user.email ? user.email.split('@')[0] : 'Học sinh'));
      const firstLetter = name.charAt(0).toUpperCase() || 'H';

      if (userDisplayName) userDisplayName.textContent = name;
      if (userAvatarText) userAvatarText.textContent = firstLetter;
      if (dropdownUserName) dropdownUserName.textContent = name;
      if (dropdownUserSub) dropdownUserSub.textContent = user.isAnonymous ? 'Chế độ Ẩn danh' : (user.email || 'PTDTNT Lào Cai');
    } else {
      openAuthModalBtn.classList.remove('hidden');
      userProfileBox.classList.add('hidden');
    }
  }

  // =========================================================================
  // CÁC HÀM XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)
  // =========================================================================

  // 1. Đăng ký tài khoản Email / Mật khẩu
  async function signUpWithEmail(email, password, displayName, className) {
    if (!auth) throw new Error('Firebase Auth chưa sẵn sàng');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await cred.user.updateProfile({ displayName: displayName });
    }
    await syncUserProfile(cred.user, { displayName, className });
    return cred.user;
  }

  // 2. Đăng nhập Email / Mật khẩu
  async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth chưa sẵn sàng');
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  // 3. Đăng nhập Google
  async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase Auth chưa sẵn sàng');
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    await syncUserProfile(result.user);
    return result.user;
  }

  // 4. Đăng nhập Ẩn danh (Guest)
  async function signInAnonymously() {
    if (!auth) throw new Error('Firebase Auth chưa sẵn sàng');
    const cred = await auth.signInAnonymously();
    await syncUserProfile(cred.user, { displayName: 'Học sinh Ẩn danh' });
    return cred.user;
  }

  // 5. Đăng xuất
  async function signOutUser() {
    if (!auth) return;
    await auth.signOut();
  }

  // =========================================================================
  // LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU CÁ NHÂN (FIRESTORE)
  // =========================================================================

  // Ghi nhận sự kiện vào Firebase Analytics
  function logEvent(eventName, eventParams = {}) {
    if (analytics && typeof analytics.logEvent === 'function') {
      try {
        analytics.logEvent(eventName, {
          user_id: currentUser ? currentUser.uid : sessionId,
          timestamp: new Date().toISOString(),
          ...eventParams
        });
      } catch (err) {
        console.warn('Lỗi ghi event Analytics:', err);
      }
    }
  }

  // Lưu tin nhắn vào Firestore (phân theo User UID nếu đã đăng nhập)
  async function saveChatMessage(sender, content, mode = 'auto', metaTag = '') {
    logEvent('send_message', { sender, mode, has_meta: !!metaTag });

    if (!db) return;

    try {
      const messageDoc = {
        sender: sender, // 'user' hoặc 'bot'
        content: content,
        mode: mode,
        metaTag: metaTag || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientTime: new Date().toISOString()
      };

      if (currentUser) {
        // Lưu vào tài khoản cá nhân: users/{uid}/messages
        await db.collection('users')
          .doc(currentUser.uid)
          .collection('messages')
          .add(messageDoc);

        // Cập nhật lastActive cho tài khoản
        await db.collection('users').doc(currentUser.uid).set({
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        // Lưu theo phiên khách
        await db.collection('conversations')
          .doc(sessionId)
          .collection('messages')
          .add(messageDoc);
      }
    } catch (err) {
      console.warn('Lưu tin nhắn Firestore:', err.message);
    }
  }

  // Tải lại lịch sử tin nhắn của người dùng từ Cloud Firestore
  async function loadUserChatHistory(limitCount = 20) {
    if (!db || !currentUser) return [];
    try {
      const snapshot = await db.collection('users')
        .doc(currentUser.uid)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .limitToLast(limitCount)
        .get();

      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      return messages;
    } catch (err) {
      console.warn('Lỗi tải lịch sử chat từ Cloud:', err.message);
      return [];
    }
  }

  // Lưu một bài Nhật ký Tự trắc ẩn (Self-Compassion Journal)
  async function saveJournalEntry(eventText, commonHumanityText, selfKindnessText) {
    const entryId = 'journal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const entry = {
      id: entryId,
      event: eventText,
      commonHumanity: commonHumanityText,
      selfKindness: selfKindnessText,
      createdAtClient: Date.now(),
      clientDate: new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };

    // 1. Luôn lưu vào LocalStorage trước (0ms, an toàn tuyệt đối không bao giờ mất)
    try {
      let localJournals = JSON.parse(localStorage.getItem('CHAM_JOURNAL_ENTRIES') || '[]');
      localJournals.unshift(entry);
      if (localJournals.length > 50) localJournals = localJournals.slice(0, 50);
      localStorage.setItem('CHAM_JOURNAL_ENTRIES', JSON.stringify(localJournals));
    } catch (e) {
      console.warn('Lỗi lưu LocalStorage nhật ký:', e);
    }

    // 2. Đồng bộ lên Firebase Firestore nếu khả dụng
    if (db) {
      try {
        const firestoreEntry = {
          ...entry,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (currentUser) {
          await db.collection('users')
            .doc(currentUser.uid)
            .collection('journals')
            .doc(entryId)
            .set(firestoreEntry);
        } else {
          await db.collection('conversations')
            .doc(sessionId)
            .collection('journals')
            .doc(entryId)
            .set(firestoreEntry);
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ Firestore nhật ký:', err.message);
      }
    }

    logEvent('save_journal_entry');
    return entry;
  }

  // Lấy danh sách các bài Nhật ký Tự trắc ẩn của người dùng
  async function getJournalEntries() {
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem('CHAM_JOURNAL_ENTRIES') || '[]');
    } catch (e) { localList = []; }

    if (!db) return localList;

    try {
      const colRef = currentUser 
        ? db.collection('users').doc(currentUser.uid).collection('journals')
        : db.collection('conversations').doc(sessionId).collection('journals');

      const snapshot = await colRef.orderBy('createdAt', 'desc').limit(50).get();
      if (!snapshot.empty) {
        const cloudList = [];
        snapshot.forEach(doc => {
          cloudList.push({ id: doc.id, ...doc.data() });
        });
        // Hợp nhất dữ liệu
        const map = new Map();
        cloudList.forEach(item => map.set(item.id, item));
        localList.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        const merged = Array.from(map.values());
        localStorage.setItem('CHAM_JOURNAL_ENTRIES', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Lỗi lấy bài nhật ký Firestore (sử dụng dữ liệu cục bộ):', err.message);
    }
    return localList;
  }

  // Cập nhật thống kê rèn luyện cá nhân
  async function recordUserStat(statKey) {
    logEvent('stat_' + statKey);
    // Lưu cục bộ
    const localKey = 'CHAM_STAT_' + statKey;
    const currentVal = parseInt(localStorage.getItem(localKey) || '0', 10) + 1;
    localStorage.setItem(localKey, currentVal.toString());

    // Nếu đã đăng nhập, đồng bộ lên Firestore
    if (db && currentUser) {
      try {
        await db.collection('users').doc(currentUser.uid).set({
          [`stats.${statKey}`]: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
      } catch (err) {
        console.warn('Lỗi đồng bộ stat lên cloud:', err.message);
      }
    }
    return currentVal;
  }

  function getLocalStats() {
    return {
      breathing: parseInt(localStorage.getItem('CHAM_STAT_breathing') || '0', 10),
      timer: parseInt(localStorage.getItem('CHAM_STAT_timer') || '0', 10)
    };
  }

  // Lưu phiên hội thoại hoàn chỉnh lên Cloud Firestore & LocalStorage
  async function saveConversationSession(sessionData) {
    if (!sessionData || !sessionData.id) return;

    // 1. Lưu LocalStorage trước (tốc độ tức thì)
    try {
      let sessions = JSON.parse(localStorage.getItem('CHAM_CHAT_SESSIONS') || '[]');
      const existingIdx = sessions.findIndex(s => s.id === sessionData.id);
      if (existingIdx >= 0) {
        sessions[existingIdx] = { ...sessions[existingIdx], ...sessionData, updatedAt: Date.now() };
      } else {
        sessions.unshift({ ...sessionData, updatedAt: Date.now(), createdAt: Date.now() });
      }
      if (sessions.length > 50) sessions = sessions.slice(0, 50);
      localStorage.setItem('CHAM_CHAT_SESSIONS', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Lỗi lưu LocalStorage:', e);
    }

    // 2. Lưu đồng bộ lên Firebase Cloud Firestore
    if (!db) return;
    try {
      const docPayload = {
        id: sessionData.id,
        title: sessionData.title || 'Cuộc trò chuyện mới',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientUpdatedAt: new Date().toISOString(),
        messageCount: (sessionData.messages || []).length,
        messages: (sessionData.messages || []).slice(-40),
        lastMessage: sessionData.messages && sessionData.messages.length > 0 
          ? (sessionData.messages[sessionData.messages.length - 1].rawContent || '').substring(0, 100)
          : ''
      };

      if (currentUser) {
        await db.collection('users')
          .doc(currentUser.uid)
          .collection('conversations')
          .doc(sessionData.id)
          .set(docPayload, { merge: true });

        await db.collection('users').doc(currentUser.uid).set({
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        await db.collection('conversations')
          .doc(sessionData.id)
          .set(docPayload, { merge: true });
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ Cloud Firestore conversation:', err.message);
    }
  }

  // Tải danh sách tất cả các phiên trò chuyện
  async function getConversationSessions() {
    let localSessions = [];
    try {
      localSessions = JSON.parse(localStorage.getItem('CHAM_CHAT_SESSIONS') || '[]');
    } catch (e) { localSessions = []; }

    if (!db || !currentUser) {
      return localSessions;
    }

    try {
      const snapshot = await db.collection('users')
        .doc(currentUser.uid)
        .collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(30)
        .get();

      if (!snapshot.empty) {
        const cloudSessions = [];
        snapshot.forEach(doc => {
          cloudSessions.push(doc.data());
        });

        // Hợp nhất dữ liệu Cloud và Local
        const mergedMap = new Map();
        cloudSessions.forEach(s => mergedMap.set(s.id, s));
        localSessions.forEach(s => {
          if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem('CHAM_CHAT_SESSIONS', JSON.stringify(mergedList));
        return mergedList;
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách phiên từ Cloud:', err.message);
    }
    return localSessions;
  }

  // Xóa một phiên trò chuyện
  async function deleteConversationSession(sessionId) {
    try {
      let sessions = JSON.parse(localStorage.getItem('CHAM_CHAT_SESSIONS') || '[]');
      sessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem('CHAM_CHAT_SESSIONS', JSON.stringify(sessions));
    } catch (e) {}

    if (db) {
      try {
        if (currentUser) {
          await db.collection('users')
            .doc(currentUser.uid)
            .collection('conversations')
            .doc(sessionId)
            .delete();
        } else {
          await db.collection('conversations').doc(sessionId).delete();
        }
      } catch (err) {
        console.warn('Lỗi xóa conversation trên Firebase:', err.message);
      }
    }
  }

  // Xóa toàn bộ lịch sử trò chuyện
  async function clearAllConversationSessions() {
    localStorage.removeItem('CHAM_CHAT_SESSIONS');
    if (db && currentUser) {
      try {
        const snap = await db.collection('users').doc(currentUser.uid).collection('conversations').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        console.warn('Lỗi xóa toàn bộ trên Firebase:', e);
      }
    }
  }

  // Đối tượng quản trị toàn cục
  window.chamFirebase = {
    isReady: () => isFirebaseReady,
    getConfig: () => firebaseConfig,
    getCurrentUser: () => currentUser,
    getSessionId: () => sessionId,
    // Auth methods
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInAnonymously,
    signOutUser,
    // Data methods
    logEvent,
    saveChatMessage,
    loadUserChatHistory,
    saveConversationSession,
    getConversationSessions,
    deleteConversationSession,
    clearAllConversationSessions,
    saveJournalEntry,
    getJournalEntries,
    recordUserStat,
    getLocalStats,
    checkFirestoreStatus
  };

  // Kiểm tra tính sẵn sàng của Cloud Firestore
  async function checkFirestoreStatus() {
    if (!db) return { ok: false, error: 'Chưa nạp thư viện Firestore' };
    try {
      await db.collection('_health').doc('ping').get();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code };
    }
  }

  // Cập nhật trạng thái hiển thị máy chủ ban đầu
  document.addEventListener('DOMContentLoaded', async () => {
    const firebasePill = document.getElementById('firebaseStatusPill');
    const firebaseText = document.getElementById('firebaseStatusText');
    const historySyncIndicator = document.getElementById('historySyncIndicator');
    const historySyncText = document.getElementById('historySyncText');

    if (db) {
      try {
        const check = await checkFirestoreStatus();
        if (check.ok) {
          if (firebaseText) firebaseText.textContent = 'Firebase: ai-cham';
          if (firebasePill) {
            firebasePill.classList.add('online');
            firebasePill.title = 'Máy chủ Firebase Cloud (ai-cham) đang lưu trữ hoàn hảo.';
          }
          if (historySyncText) historySyncText.textContent = 'Cloud Firestore (Online)';
          if (historySyncIndicator) historySyncIndicator.style.color = '#059669';
        } else {
          console.warn('⚠️ Cloud Firestore chưa được kích hoạt trên Firebase Console:', check.error);
          if (firebaseText) firebaseText.textContent = 'Firebase: Cần bật Firestore';
          if (firebasePill) {
            firebasePill.classList.remove('online');
            firebasePill.title = 'Nhấp vào đây để mở Firebase Console bật Cloud Firestore Database.';
            firebasePill.style.cursor = 'pointer';
            firebasePill.onclick = () => window.open('https://console.firebase.google.com/project/ai-cham/firestore', '_blank');
          }
          if (historySyncText) historySyncText.textContent = 'Cần bật Firestore';
          if (historySyncIndicator) {
            historySyncIndicator.style.color = '#D97706';
            historySyncIndicator.title = 'Nhấp vào đây để mở Firebase Console bật Cloud Firestore Database';
            historySyncIndicator.style.cursor = 'pointer';
            historySyncIndicator.onclick = () => window.open('https://console.firebase.google.com/project/ai-cham/firestore', '_blank');
          }
        }
      } catch (e) {}
    }

    logEvent('app_opened', { user_agent: navigator.userAgent });
  });

})();
