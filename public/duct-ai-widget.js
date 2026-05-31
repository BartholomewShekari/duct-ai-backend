(function () {
  const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
  const BACKEND_URL = (currentScript && currentScript.dataset.backendUrl) || window.DUCT_AI_BACKEND_URL || window.location.origin;
  const API_PATH = `${BACKEND_URL.replace(/\/$/, '')}/api/chat`;
  const scriptBase = (currentScript && currentScript.src)
    ? currentScript.src.replace(/\/[^\/]*$/, '/')
    : '';

  const widgetStyles = document.createElement('link');
  widgetStyles.rel = 'stylesheet';
  widgetStyles.href = scriptBase + '../css/duct-ai-widget.css';
  document.head.appendChild(widgetStyles);

  const container = document.createElement('div');
  container.className = 'duct-ai-widget-container';
  container.innerHTML = `
    <button class="duct-ai-widget-toggle">Ask Duct AI</button>
    <div class="duct-ai-widget-panel">
      <div class="duct-ai-widget-header">Duct AI Assistant</div>
      <div class="duct-ai-widget-notification" id="ductAiNotification" hidden>
        <span class="duct-ai-widget-notification-icon" id="ductAiNotificationIcon"></span>
        <div class="duct-ai-widget-notification-text" id="ductAiNotificationText"></div>
        <button type="button" class="duct-ai-widget-notification-action" id="ductAiNotificationAction" hidden>Open</button>
        <button type="button" class="duct-ai-widget-notification-close" id="ductAiNotificationClose" aria-label="Dismiss notification">&times;</button>
      </div>
      <div class="duct-ai-widget-messages" id="ductAiMessages"></div>
      <div class="duct-ai-widget-footer">
        <input id="ductAiInput" type="text" placeholder="Ask about furniture, materials or design" autocomplete="off" />
        <button id="ductAiSend">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const panel = container.querySelector('.duct-ai-widget-panel');
  const toggle = container.querySelector('.duct-ai-widget-toggle');
  const messages = container.querySelector('#ductAiMessages');
  const input = container.querySelector('#ductAiInput');
  const send = container.querySelector('#ductAiSend');
  const notification = container.querySelector('#ductAiNotification');
  const notificationIcon = container.querySelector('#ductAiNotificationIcon');
  const notificationText = container.querySelector('#ductAiNotificationText');
  const notificationAction = container.querySelector('#ductAiNotificationAction');
  const notificationClose = container.querySelector('#ductAiNotificationClose');

  const PROMO_SOURCE_ICONS = {
    marketplace: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 4h18v4H3V4zm0 6h18v10H3V10zm2 2v6h14v-6H5z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.44c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.88h2.74l-.44 2.89h-2.3v6.99C18.34 21.12 22 16.99 22 12z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17 2H7C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5zm3 15c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10c1.65 0 3 1.35 3 3v10zm-5-9a4 4 0 100 8 4 4 0 000-8zm0 6.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm3.9-6.75a1 1 0 11-2 0 1 1 0 012 0z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M10 15l5.19-3L10 9v6zm12-3c0-1.4-.12-2.6-.35-3.6-.23-1-.96-1.8-1.94-2.04C18.58 6.98 15.4 6 12 6s-6.58.98-7.71.36c-.98.24-1.71 1.04-1.94 2.04C2.12 9.4 2 10.6 2 12s.12 2.6.35 3.6c.23 1 1 1.8 1.94 2.04C5.42 17.02 8.6 18 12 18s6.58-.98 7.71-.36c.98-.24 1.71-1.04 1.94-2.04.23-1 .35-2.2.35-3.6z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 8.88h3.96V21H3V8.88zM9.92 8.88h3.8v1.65h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.62 4.74 6.02V21h-3.96v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-3.96V8.88z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.59-2.47.69a4.3 4.3 0 001.88-2.38 8.6 8.6 0 01-2.72 1.04 4.28 4.28 0 00-7.3 3.9A12.13 12.13 0 013 4.79a4.28 4.28 0 001.33 5.71 4.22 4.22 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.2 4.27 4.27 0 01-1.93.07 4.28 4.28 0 003.99 2.97A8.58 8.58 0 012 19.54a12.08 12.08 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.19 0-.19 0-.37-.01-.56A8.72 8.72 0 0022.46 6z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.78 2h2.7v.25a5.34 5.34 0 01-2.82-.25c-.2.6-.55 1.18-1.05 1.59-.9.75-2.07 1.14-3.35 1.14a6 6 0 01-6-6v14h3.75v-7.4A3.75 3.75 0 019.96 5.5c.3 0 .6 0 .9.05v3.4c-.25-.05-.5-.1-.75-.1a1.88 1.88 0 00-1.88 1.88 1.92 1.92 0 001.9 1.9 1.92 1.92 0 001.88-1.9V2h2.7v8.37a5.32 5.32 0 01-2.58-.71v2.55a8 8 0 004.2 1.12V2z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.83 7.17a5.76 5.76 0 01-1.64-1.09 1.38 1.38 0 00-1.15-.34 5.06 5.06 0 00-1.78.28 1.66 1.66 0 00-.9.56 5.6 5.6 0 00-1.18 1.72 1.46 1.46 0 00-.09 1.12 15.4 15.4 0 003.03 4.8 15.77 15.77 0 004.8 3.04 1.48 1.48 0 001.12-.09 5.6 5.6 0 001.72-1.18 1.67 1.67 0 00.56-.9 5.05 5.05 0 00.28-1.78 1.39 1.39 0 00-.34-1.15 5.83 5.83 0 01-1.09-1.64c-.3-.65-.75-1.13-1.68-1.97-.93-.85-1.6-1.06-2.24-1.36z"/></svg>'
  };

  let currentNotificationUrl = '';
  const DEFAULT_MARKETPLACE_LINK = `${BACKEND_URL.replace(/\/$/, '')}/marketplace.html`;

  function renderPromoNotification({ source = 'marketplace', text = 'New promotion update available.', url = '' } = {}) {
    const iconHtml = PROMO_SOURCE_ICONS[source] || PROMO_SOURCE_ICONS.marketplace;
    notificationIcon.innerHTML = iconHtml;
    notificationText.textContent = text;
    currentNotificationUrl = url || (source === 'marketplace' ? DEFAULT_MARKETPLACE_LINK : '');
    notification.dataset.source = source;
    notification.className = `duct-ai-widget-notification ${source}`;

    const buttonLabel = source === 'marketplace' ? 'Open' : 'View';
    notificationAction.textContent = buttonLabel;
    notificationAction.hidden = !currentNotificationUrl;
    notificationAction.setAttribute('aria-label', `${buttonLabel} promotion`);

    if (currentNotificationUrl) {
      notification.style.cursor = 'pointer';
      notification.title = 'Click to view';
    } else {
      notification.style.cursor = 'default';
      notification.title = '';
    }

    notification.hidden = false;
  }

  function hidePromoNotification() {
    notification.hidden = true;
    currentNotificationUrl = '';
    notification.dataset.source = '';
    notification.className = 'duct-ai-widget-notification';
  }

  notification.addEventListener('click', (e) => {
    if (currentNotificationUrl && e.target !== notificationClose && e.target !== notificationAction) {
      window.open(currentNotificationUrl, '_blank');
    }
  });

  notificationAction.addEventListener('click', (event) => {
    event.stopPropagation();
    if (currentNotificationUrl) {
      window.open(currentNotificationUrl, '_blank');
    }
  });

  notificationClose.addEventListener('click', (event) => {
    event.stopPropagation();
    hidePromoNotification();
  });

  window.DuctAIWidget = window.DuctAIWidget || {};
  window.DuctAIWidget.showPromoNotification = renderPromoNotification;
  window.DuctAIWidget.hidePromoNotification = hidePromoNotification;

  toggle.addEventListener('click', () => {
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) {
      input.focus();
    }
  });

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  function addMessage(text, role, provider) {
    const item = document.createElement('div');
    item.className = `duct-ai-widget-message ${role}`;
    item.textContent = text;
    if (role === 'assistant' && provider) {
      const providerEl = document.createElement('div');
      providerEl.className = 'duct-ai-widget-provider';
      providerEl.textContent = `via ${provider.replace(/_/g, ' ')}`;
      item.appendChild(providerEl);
    }
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function getSessionId() {
    const key = 'ductAiWidgetSessionId';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';

    try {
      const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          session_id: getSessionId(),
          context: {
            page: window.location.pathname,
            user_agent: navigator.userAgent
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      addMessage(data.reply || 'I’m sorry, I’m having trouble answering right now. Please try again in a moment or contact WhatsApp at +234 803 685 0229.', 'assistant', data.provider);
    } catch (error) {
      addMessage('Error: ' + error.message, 'assistant');
    }
  }
})();
