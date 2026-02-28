const IN_APP_BROWSERS = [
    { name: 'Facebook', pattern: /FBAN|FBAV|FB_IAB/i },
    { name: 'Instagram', pattern: /Instagram/i },
    { name: 'Twitter', pattern: /Twitter|TwitterAndroid/i },
    { name: 'TikTok', pattern: /TikTok/i },
    { name: 'LinkedIn', pattern: /LinkedIn/i },
    { name: 'Snapchat', pattern: /Snapchat/i },
    { name: 'Threads', pattern: /Threads/i },
    { name: 'WhatsApp', pattern: /WhatsApp/i },
    { name: 'Messenger', pattern: /Messenger|FB_IAB.*Messages/i },
    { name: 'Telegram', pattern: /Telegram/i },
    { name: 'LINE', pattern: /Line/i },
    { name: 'WeChat', pattern: /MicroMessenger|WeChat/i },
    { name: 'Reddit', pattern: /Reddit/i },
    { name: 'Pinterest', pattern: /Pinterest/i },
    { name: 'Google Search', pattern: /GSA|GoogleSearch/i },
    { name: 'Gmail', pattern: /Gmail/i },
    { name: 'Apple Mail', pattern: /AppleMail/i },
    { name: 'Outlook', pattern: /Outlook/i },
    { name: 'Yahoo Mail', pattern: /YahooMail|iOS.*Yahoo/i },
    { name: 'Yandex', pattern: /Yandex/i },
    { name: 'Baidu', pattern: /Baidu/i },
    { name: 'AliExpress', pattern: /AliExpress/i },
    { name: 'Amazon', pattern: /Amazon.*App/i },
    { name: 'eBay', pattern: /eBay/i },
    { name: 'Spotify', pattern: /Spotify/i },
    { name: 'Discord', pattern: /Discord/i },
    { name: 'Slack', pattern: /Slack/i },
    { name: 'Teams', pattern: /Teams/i },
    { name: 'Zoom', pattern: /Zoom/i },
    { name: 'Viber', pattern: /Viber/i },
    { name: 'Skype', pattern: /Skype/i },
    { name: 'iOS Safari View', pattern: /CriOS|FxiOS|薇|XiaoMi|MiuiBrowser|OppoBrowser|AU-Input|UCBrowser|UCWEB/i }
];

const STORAGE_KEY = 'in_app_redirect_dismissed';

function detectInAppBrowser() {
    const ua = navigator.userAgent;
    
    for (const browser of IN_APP_BROWSERS) {
        if (browser.pattern.test(ua)) {
            return browser.name;
        }
    }
    return null;
}

function createFallbackButton() {
    const btn = document.createElement('a');
    btn.id = 'in-app-fallback-btn';
    btn.href = window.location.href;
    btn.className = 'in-app-fallback-btn';
    btn.textContent = 'Ouvrir dans mon navigateur';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'in-app-close-btn';
    closeBtn.className = 'in-app-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Fermer');
    
    const container = document.createElement('div');
    container.id = 'in-app-redirect-container';
    container.className = 'in-app-redirect-container';
    container.appendChild(btn);
    container.appendChild(closeBtn);
    
    document.body.appendChild(container);
    
    closeBtn.addEventListener('click', function() {
        container.remove();
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch(e) {}
    });
    
    btn.addEventListener('click', function(e) {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch(e) {}
    });
}

function redirectViaIframe(url) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(function() {
        document.body.removeChild(iframe);
    }, 5000);
}

function attemptRedirect() {
    const browserName = detectInAppBrowser();
    
    if (!browserName) {
        return false;
    }
    
    if (typeof localStorage !== 'undefined') {
        try {
            if (localStorage.getItem(STORAGE_KEY) === 'true') {
                return false;
            }
        } catch(e) {}
    }
    
    return { browserName };
}

function initInAppRedirect() {
    const result = attemptRedirect();
    
    if (!result) {
        return;
    }
    
    const { browserName } = result;
    const currentUrl = window.location.href;
    
    const redirectTimeout = setTimeout(function() {
        createFallbackButton();
    }, 800);
    
    try {
        window.location.href = currentUrl;
    } catch(e) {
        clearTimeout(redirectTimeout);
        redirectViaIframe(currentUrl);
        createFallbackButton();
    }
    
    setTimeout(function() {
        redirectViaIframe(currentUrl);
    }, 100);
}

export { initInAppRedirect };
