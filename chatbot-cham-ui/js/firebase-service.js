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
    if (!db) throw new Error('Chưa kết nối được với cơ sở dữ liệu đám mây');
    const targetUid = currentUser ? currentUser.uid : sessionId;

    const entry = {
      event: eventText,
      commonHumanity: commonHumanityText,
      selfKindness: selfKindnessText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      clientDate: new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };

    if (currentUser) {
      await db.collection('users')
        .doc(currentUser.uid)
        .collection('journals')
        .add(entry);
    } else {
      await db.collection('conversations')
        .doc(sessionId)
        .collection('journals')
        .add(entry);
    }

    logEvent('save_journal_entry');
    return entry;
  }

  // Lấy danh sách các bài Nhật ký Tự trắc ẩn của người dùng
  async function getJournalEntries() {
    if (!db) return [];
    try {
      const colRef = currentUser 
        ? db.collection('users').doc(currentUser.uid).collection('journals')
        : db.collection('conversations').doc(sessionId).collection('journals');

      const snapshot = await colRef.orderBy('createdAt', 'desc').limit(50).get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (err) {
      console.warn('Lỗi lấy bài nhật ký:', err.message);
      return [];
    }
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
    saveJournalEntry,
    getJournalEntries,
    recordUserStat,
    getLocalStats
  };

  // Cập nhật trạng thái hiển thị máy chủ ban đầu
  document.addEventListener('DOMContentLoaded', () => {
    const firebasePill = document.getElementById('firebaseStatusPill');
    const firebaseText = document.getElementById('firebaseStatusText');
    if (firebasePill && firebaseText) {
      if (isFirebaseReady) {
        firebaseText.textContent = 'Firebase: ai-cham';
        firebasePill.title = 'Máy chủ Firebase Cloud (ai-cham) đã kết nối: Xác thực tài khoản & Cloud Firestore sẵn sàng.';
        firebasePill.classList.add('online');
      }
    }

    logEvent('app_opened', { user_agent: navigator.userAgent });
  });

})();
