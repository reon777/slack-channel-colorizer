// Slack Channel Colorizer Content Script
let currentlyColorizedId = null;
let lastUrl = location.href;

// デバッグログ関数
function debugLog(...args) {
  console.log('[Slack Channel Colorizer]', ...args);
}

// 安全にチャンネルIDを取得する関数
function getCurrentChannel() {
  try {
    // Slackの新しいURLパターンを優先的に検出
    const slackAppPattern = /app\.slack\.com\/client\/[^\/]+\/(C[A-Z0-9]+)/;
    const appMatch = location.href.match(slackAppPattern);
    if (appMatch && appMatch[1]) {
      debugLog('Channel ID from app URL:', appMatch[1]);
      return appMatch[1];
    }

    // DOM要素からチャンネル名/IDを取得
    const channelSelectors = [
      '[data-qa="channel_name"]',
      '.p-channel_sidebar__channel--selected .p-channel_sidebar__name',
      '.p-ia__nav__user__title',
      '.c-channel_name',
      '.p-view_header__channel_title',
      '.c-breadcrumbs__item span'
    ];

    for (const selector of channelSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const channelName = element.textContent.trim();
        debugLog('Channel name from DOM:', channelName);
        return channelName;
      }
    }

    // URLの最後の部分をフォールバック
    const urlPathMatch = location.href.match(/\/([^\/]+)$/);
    if (urlPathMatch && urlPathMatch[1]) {
      debugLog('Channel from URL path:', urlPathMatch[1]);
      return urlPathMatch[1];
    }

    debugLog('No channel detected');
    return null;
  } catch (error) {
    console.error('Error detecting channel:', error);
    return null;
  }
}

// 他のチャンネルの色付けを削除
function removeOtherColorizations() {
  const currentId = getCurrentChannel();
  
  if (currentlyColorizedId && currentlyColorizedId !== currentId) {
    debugLog("Removing colorization for previous channel:", currentlyColorizedId);
    
    const coloredElements = document.querySelectorAll('[data-colorized="true"]');
    coloredElements.forEach(el => {
      if (el.getAttribute('data-channel-id') !== currentId) {
        el.style.removeProperty('background-color');
        el.removeAttribute('data-colorized');
        el.removeAttribute('data-channel-id');
        el.classList.remove('dark-theme');
      }
    });
  }
  
  currentlyColorizedId = currentId;
}

// 色の明るさを判定
function isColorDark(color) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
}

// 色を適用
function applyColors() {
  try {
    debugLog("Attempting to apply colors...");
    
    removeOtherColorizations();
    
    const currentChannel = getCurrentChannel();
    if (!currentChannel) {
      debugLog("No channel detected");
      return;
    }
    
    // 設定から色を取得
    chrome.storage.sync.get(['channelColors', 'defaultColor'], function(data) {
      const channelColors = data.channelColors || {};
      const defaultColor = data.defaultColor || '#f2f2f2'; // デフォルトの色
      
      // チャンネルが指定リストに含まれているか確認
      let isExcludedChannel = false;
      
      // 完全一致または部分一致の確認
      for (const channel in channelColors) {
        if (currentChannel === channel || currentChannel.includes(channel)) {
          isExcludedChannel = true;
          debugLog(`Channel ${currentChannel} is in the exclusion list`);
          break;
        }
      }
      
      // 指定されたチャンネル以外に色を適用
      if (!isExcludedChannel) {
        // メッセージ入力エリアを着色
        const messageInput = document.querySelector('.p-message_pane_input');
        if (messageInput) {
          messageInput.style.setProperty('background-color', defaultColor, 'important');
          messageInput.setAttribute('data-colorized', 'true');
          messageInput.setAttribute('data-channel-id', currentChannel);
          
          // 色の明るさに応じてテーマ調整
          if (isColorDark(defaultColor)) {
            messageInput.classList.add('dark-theme');
          } else {
            messageInput.classList.remove('dark-theme');
          }
          
          debugLog(`Applied default color ${defaultColor} to non-specified channel ${currentChannel}`);
        }
      } else {
        // 指定されたチャンネルの場合は色を削除
        const messageInput = document.querySelector('.p-message_pane_input');
        if (messageInput && messageInput.getAttribute('data-colorized') === 'true') {
          messageInput.style.removeProperty('background-color');
          messageInput.removeAttribute('data-colorized');
          messageInput.removeAttribute('data-channel-id');
          messageInput.classList.remove('dark-theme');
          debugLog(`Removed color from excluded channel ${currentChannel}`);
        }
      }
    });
  } catch (error) {
    console.error('Slack Channel Colorizer error:', error);
  }
}

// URL変更を監視
function checkURLChange() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    debugLog('URL changed, reapplying colors');
    setTimeout(applyColors, 500);
  }
  setTimeout(checkURLChange, 1000);
}

// ページロード時の処理
window.addEventListener('load', function() {
  debugLog('Page loaded, initializing colorizer');
  applyColors();
  checkURLChange();
});

// チャンネル選択イベントをリッスン
document.addEventListener('click', function(e) {
  if (e.target.closest('.p-channel_sidebar__channel') || 
      e.target.closest('.c-link')) {
    debugLog('Channel item clicked, will reapply colors');
    setTimeout(applyColors, 300);
  }
});

// 設定変更を監視
chrome.storage.onChanged.addListener(function(changes) {
  debugLog('Settings changed, reapplying colors');
  applyColors();
});

debugLog('Slack Channel Colorizer loaded!');
