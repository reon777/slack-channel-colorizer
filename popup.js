document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup loaded");
  
  // 設定を読み込む
  chrome.storage.sync.get(['channelColors'], function(data) {
    console.log("Loaded settings:", data);
    
    const channelColors = data.channelColors || {};
    for (const channel in channelColors) {
      addChannelColorInput(channel, channelColors[channel]);
    }
  });
  
  // チャンネル追加ボタン
  document.getElementById('addChannel').addEventListener('click', function() {
    // 現在のタブからチャンネルIDを取得してみる
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        const url = tabs[0].url;
        const match = url.match(/app\.slack\.com\/client\/[^\/]+\/(C[A-Z0-9]+)/);
        if (match && match[1]) {
          // チャンネルIDが見つかった場合
          addChannelColorInput(match[1], '#ffffff');
          
          // 検出メッセージを表示
          const detectedMsg = document.createElement('div');
          detectedMsg.textContent = `現在のチャンネルID ${match[1]} を追加しました！`;
          detectedMsg.style.color = 'green';
          detectedMsg.style.fontSize = '12px';
          detectedMsg.style.margin = '5px 0';
          
          const existingMsg = document.querySelector('.detected-message');
          if (existingMsg) {
            existingMsg.remove();
          }
          
          detectedMsg.className = 'detected-message';
          document.querySelector('#addChannel').insertAdjacentElement('afterend', detectedMsg);
          
          // 3秒後にメッセージを消す
          setTimeout(() => {
            detectedMsg.remove();
          }, 3000);
        } else {
          // チャンネルIDが見つからない場合は空の入力フィールドを追加
          addChannelColorInput('', '#ffffff');
        }
      } else {
        // タブが見つからない場合は空の入力フィールドを追加
        addChannelColorInput('', '#ffffff');
      }
    });
  });
  
  // 保存ボタン
  document.getElementById('saveSettings').addEventListener('click', function() {
    const channelColors = {};
    const channelInputs = document.querySelectorAll('.channel-input');
    
    channelInputs.forEach(function(input) {
      const channel = input.value.trim();
      if (channel) {
        const colorInput = input.parentElement.querySelector('.channel-color');
        channelColors[channel] = colorInput.value;
      }
    });
    
    chrome.storage.sync.set({
      channelColors: channelColors
    }, function() {
      // 保存成功メッセージ
      const saveMsg = document.createElement('div');
      saveMsg.textContent = '設定を保存しました！';
      saveMsg.style.color = 'green';
      saveMsg.style.marginTop = '10px';
      saveMsg.style.textAlign = 'center';
      
      const existingMsg = document.querySelector('.save-message');
      if (existingMsg) {
        existingMsg.remove();
      }
      
      saveMsg.className = 'save-message';
      document.body.appendChild(saveMsg);
      
      // 3秒後にメッセージを消す
      setTimeout(() => {
        saveMsg.remove();
      }, 3000);
    });
  });
  
  function addChannelColorInput(channel, color) {
    const channelColors = document.getElementById('channelColors');
    const div = document.createElement('div');
    div.className = 'color-input';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'channel-input';
    input.placeholder = 'チャンネル名 (例: general)';
    input.value = channel;
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'channel-color';
    colorInput.value = color;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-btn';
    
    removeBtn.addEventListener('click', function() {
      div.remove();
    });
    
    div.appendChild(input);
    div.appendChild(colorInput);
    div.appendChild(removeBtn);
    
    channelColors.appendChild(div);
  }
});
