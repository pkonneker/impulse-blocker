const ImpulseBlocker = {
  extStatus: 'on',

  /**
   * Starts the blocker. Adds a listener so that if new websites is added
   * to the blocked list the listener is refreshed.
   */
  init: () => {
    const handlingStorage = chrome.storage.local.get('sites', (storage) => {
      if (typeof storage.sites === 'undefined') {
        return chrome.storage.local.set({
          sites: [],
        }, ImpulseBlocker.setBlocker);

      }
      else ImpulseBlocker.setBlocker();
    });

  },

  /**
   * Redirects the tab to local "You have been blocked" page.
   */
  redirect: (requestDetails) => {
    const original = encodeURIComponent(requestDetails.url);
    const interceptPage = `/resources/redirect.html?target=${original}`;
    chrome.tabs.update(requestDetails.tabId, { url: interceptPage });
  },

  /**
   * Returns the current status of the extension.
   */
  getStatus: () => ImpulseBlocker.extStatus,

  /**
   * Sets the current status of the extension.
   * @param string status
   */
  setStatus: (status) => {
    ImpulseBlocker.extStatus = status;
    let icon = 'icons/icon96.png';
    if (ImpulseBlocker.extStatus !== 'on') {
      icon = 'icons/icon96-disabled.png';
    }

    chrome.browserAction.setIcon({
      path: icon,
    });
  },

  /**
   * Fetches blocked websites lists, attaches them to the listener provided
   * by the WebExtensions API.
   */
  setBlocker: () => {
    chrome.storage.local.get('sites',(storage) => {
      const pattern = storage.sites.map(item => `*://*.${item}/*`);

      chrome.webRequest.onBeforeRequest.removeListener(ImpulseBlocker.redirect);
      if (pattern.length > 0) {
        chrome.webRequest.onBeforeRequest.addListener(
          ImpulseBlocker.redirect,
          { urls: pattern, types: ['main_frame'] },
          ['blocking'],
        );
      }
    });

    chrome.storage.onChanged.addListener(() => {
      // if the extension off we should not be bothered by restarting with new list
      if (ImpulseBlocker.getStatus() === 'on') {
        ImpulseBlocker.setBlocker();
      }
    });

    ImpulseBlocker.setStatus('on');
  },

  /**
   * Removes the web request listener and turns the extension off.
   */
  disableBlocker: () => {
    chrome.webRequest.onBeforeRequest.removeListener(ImpulseBlocker.redirect);
    ImpulseBlocker.setStatus('off');
  },

  /**
   * Add a website to the blocked list
   * @param  {string} url Url to add to the list
   */
  addSite: (url) => {
    chrome.storage.local.get('sites',(storage) => {
      storage.sites.push(url);
      chrome.storage.local.set({
        sites: storage.sites,
      });
    });
  },

  /**
   * Add a website to the blocked list
   * @param  {string} url Url to remove to the list
   */
  removeSite: (url) => {
    chrome.storage.local.get('sites',(storage) => {
      const i = storage.sites.indexOf(url);
      if (i !== -1) {
        storage.sites.splice(i, 1);
      }
      chrome.storage.local.set({
        sites: storage.sites,
      });
    });
  },
};

ImpulseBlocker.init();

// Helper functions to access object literal from menubar.js file. These funcitons are
// easily accessible from the getBackgroundPage instance.
function getStatus() {
  return ImpulseBlocker.getStatus();
}

function disableBlocker() {
  ImpulseBlocker.disableBlocker();
}

function setBlocker() {
  ImpulseBlocker.setBlocker();
}

function getDomain(callback) {
  return chrome.tabs.query({ active: true, currentWindow: true }, callback);
}

function getSites(callback) {
  return chrome.storage.local.get('sites', callback);
}

function addCurrentlyActiveSite() {
  return chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    ImpulseBlocker.addSite(url.hostname.replace(/^www\./, ''));
  });
}

function removeCurrentlyActiveSite() {
  return chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    ImpulseBlocker.removeSite(url.hostname.replace(/^www\./, ''));
  });
}
