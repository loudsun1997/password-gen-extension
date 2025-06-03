document.addEventListener('DOMContentLoaded', () => {
  const lengthEl = document.getElementById('length');
  const numbersEl = document.getElementById('numbers');
  const lowercasesEl = document.getElementById('lowercases');
  const uppercasesEl = document.getElementById('uppercases');
  const specialEl = document.getElementById('special');
  const generateBtn = document.getElementById('generate');
  const generatedPasswordEl = document.getElementById('generated-password');
  const copyBtn = document.getElementById('copy-password');
  const toggleOptionsEl = document.getElementById('toggle-options');
  const advancedOptionsContainerEl = document.getElementById('advanced-options-container');

  const excludeEl = document.getElementById('exclude');
  const excludeCharsContainerEl = document.getElementById('exclude-chars-container');
  const excludeCharsInputEl = document.getElementById('exclude-chars-input');
  const cryptographyEl = document.getElementById('cryptography');
  const historyEl = document.getElementById('history');
  const historyContainerEl = document.getElementById('history-container');
  const passwordHistoryListEl = document.getElementById('password-history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';
  const numbersChars = '0123456789';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const MAX_HISTORY_ITEMS = 10;

  // Custom special chars UI
  const specialCharsCustomContainer = document.getElementById('special-chars-custom-container');
  const customSpecialCharsInput = document.getElementById('custom-special-chars');
  const defaultSpecialCharsBtn = document.getElementById('default-special-chars');
  const defaultSpecialChars = specialChars;

  // Load saved preferences
  chrome.storage.local.get([
    'length', 'numbers', 'lowercases', 'uppercases', 'special', 
    'exclude', 'excludeChars', 'cryptography', 'history', 'advancedVisible', 'customSpecialChars'
  ], (result) => {
    if (result.length) lengthEl.value = result.length;
    if (result.numbers !== undefined) numbersEl.checked = result.numbers;
    if (result.lowercases !== undefined) lowercasesEl.checked = result.lowercases;
    if (result.uppercases !== undefined) uppercasesEl.checked = result.uppercases;
    if (result.special !== undefined) specialEl.checked = result.special;
    if (result.exclude !== undefined) {
      excludeEl.checked = result.exclude;
      excludeCharsContainerEl.style.display = result.exclude ? 'flex' : 'none';
    }
    if (result.excludeChars) excludeCharsInputEl.value = result.excludeChars;
    if (result.cryptography !== undefined) cryptographyEl.checked = result.cryptography;
    if (result.history !== undefined) {
      historyEl.checked = result.history;
      historyContainerEl.style.display = result.history ? 'block' : 'none';
      if(result.history) loadHistory();
    }
    if (result.customSpecialChars !== undefined) {
      customSpecialCharsInput.value = result.customSpecialChars;
    } else {
      customSpecialCharsInput.value = defaultSpecialChars;
    }
    // Show/hide custom special chars input on load
    specialCharsCustomContainer.style.display = specialEl.checked ? 'block' : 'none';
    // If Special is checked and input is empty, pre-fill with default
    if (specialEl.checked && !customSpecialCharsInput.value) {
      customSpecialCharsInput.value = defaultSpecialChars;
    }

    if (result.advancedVisible) {
      advancedOptionsContainerEl.style.display = 'block';
      toggleOptionsEl.textContent = 'Hide options';
    } else {
      advancedOptionsContainerEl.style.display = 'none';
      toggleOptionsEl.textContent = 'Show options';
    }
  });

  // Save preferences function
  function savePreferences() {
    chrome.storage.local.set({
      length: lengthEl.value,
      numbers: numbersEl.checked,
      lowercases: lowercasesEl.checked,
      uppercases: uppercasesEl.checked,
      special: specialEl.checked,
      exclude: excludeEl.checked,
      excludeChars: excludeCharsInputEl.value,
      cryptography: cryptographyEl.checked,
      history: historyEl.checked,
      advancedVisible: advancedOptionsContainerEl.style.display === 'block',
      customSpecialChars: customSpecialCharsInput.value
    });
  }

  // Add event listeners to save preferences when changed
  [lengthEl, numbersEl, lowercasesEl, uppercasesEl, specialEl, excludeEl, excludeCharsInputEl, cryptographyEl, historyEl, customSpecialCharsInput].forEach(el => {
    el.addEventListener('change', savePreferences);
  });

  // Show/hide custom special chars input when Special is toggled
  specialEl.addEventListener('change', () => {
    specialCharsCustomContainer.style.display = specialEl.checked ? 'block' : 'none';
    // If enabling Special and input is empty, pre-fill with default
    if (specialEl.checked && !customSpecialCharsInput.value) {
      customSpecialCharsInput.value = defaultSpecialChars;
    }
    savePreferences();
  });

  // Use Default Set button logic
  defaultSpecialCharsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    customSpecialCharsInput.value = defaultSpecialChars;
    savePreferences();
  });

  historyEl.addEventListener('change', () => {
    historyContainerEl.style.display = historyEl.checked ? 'block' : 'none';
    if (historyEl.checked) {
      loadHistory();
    } 
    savePreferences();
  });

  excludeEl.addEventListener('change', () => {
    excludeCharsContainerEl.style.display = excludeEl.checked ? 'flex' : 'none';
    savePreferences();
  });

  toggleOptionsEl.addEventListener('click', (e) => {
    e.preventDefault();
    const isHidden = advancedOptionsContainerEl.style.display === 'none';
    advancedOptionsContainerEl.style.display = isHidden ? 'block' : 'none';
    toggleOptionsEl.textContent = isHidden ? 'Hide options' : 'Show options';
    savePreferences();
  });

  generateBtn.addEventListener('click', () => {
    const length = +lengthEl.value;
    let password = '';

    let charset = '';
    if (numbersEl.checked) charset += numbersChars;
    if (lowercasesEl.checked) charset += lowercaseChars;
    if (uppercasesEl.checked) charset += uppercaseChars;
    if (specialEl.checked) {
      // Use custom special chars if provided, else default
      const custom = customSpecialCharsInput.value;
      if (custom && custom.trim().length > 0) {
        charset += custom;
      } else {
        charset += defaultSpecialChars;
      }
    }

    if (excludeEl.checked && excludeCharsInputEl.value) {
      const excludeCharsList = excludeCharsInputEl.value.split('');
      for (const char of excludeCharsList) {
        charset = charset.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    if (charset === '') {
      generatedPasswordEl.value = 'Select char types!';
      return;
    }
    
    const useCrypto = cryptographyEl.checked;
    for (let i = 0; i < length; i++) {
      let randomIndex;
      if (useCrypto && window.crypto && window.crypto.getRandomValues) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        randomIndex = randomBuffer[0] % charset.length;
      } else {
        randomIndex = Math.floor(Math.random() * charset.length);
      }
      password += charset[randomIndex];
    }

    generatedPasswordEl.value = password; 

    if (historyEl.checked && password) {
      addPasswordToHistory(password);
    }

    // Automatically copy to clipboard if a password was generated
    if (password) {
      navigator.clipboard.writeText(password)
        .then(() => {
          // Visual feedback: briefly change the Copy button text
          const originalCopyBtnText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = originalCopyBtnText;
          }, 1500);
        })
        .catch(err => {
          console.error('Auto-copy failed: ', err);
        });
    }
  });

  copyBtn.addEventListener('click', () => {
    if (generatedPasswordEl.value) {
      navigator.clipboard.writeText(generatedPasswordEl.value)
        .then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 1500);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  });

  // History Functions
  function loadHistory() {
    chrome.storage.local.get('passwordHistory', (result) => {
      const history = result.passwordHistory || [];
      renderHistory(history);
    });
  }

  function addPasswordToHistory(password) {
    chrome.storage.local.get('passwordHistory', (result) => {
      let history = result.passwordHistory || [];
      history = history.filter(item => item !== password);
      history.unshift(password);
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      chrome.storage.local.set({ passwordHistory: history }, () => {
        renderHistory(history);
      });
    });
  }

  function renderHistory(historyArray) {
    passwordHistoryListEl.innerHTML = '';
    if (historyArray.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No history yet.';
        li.style.fontStyle = 'italic';
        li.style.color = '#888';
        passwordHistoryListEl.appendChild(li);
        return;
    }
    historyArray.forEach(password => {
      const li = document.createElement('li');
      li.textContent = password;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        navigator.clipboard.writeText(password).then(() => {
            const originalText = li.textContent;
            li.textContent = `Copied: ${originalText.substring(0,10)}...`;
            setTimeout(() => { li.textContent = originalText; }, 1000);
        });
      });
      passwordHistoryListEl.appendChild(li);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    chrome.storage.local.set({ passwordHistory: [] }, () => {
      renderHistory([]);
    });
  });

  chrome.storage.local.get('length', (result) => {
    if (result.length === undefined) { 
        savePreferences();
    }
  });

}); 