const radioOff = document.querySelector('input#off');
const radioOn = document.querySelector('input#on');
const addButton = document.querySelector('button.button-add');
const optionsButton = document.querySelector('img.options');
const removeButton = document.querySelector('button.button-remove');
const domainToAllow = document.querySelector('span.domainToAllow');
const domainToBlock = document.querySelector('span.domainToBlock');
const getBackgroundPage = chrome.runtime.getBackgroundPage;

function handleClick() {
  if (this.value === 'off') {
    getBackgroundPage(bg => bg.disableBlocker());
  } else {
    getBackgroundPage(bg => bg.setBlocker());
  }
}

function markExtensionStatus() {
  getBackgroundPage((bg) => {
    const status = bg.getStatus();
    if (status === 'off') {
      radioOff.checked = true;
    } else if (status === 'on') {
      radioOn.checked = true;
    }
  });
}

function displayCurrentDomain() {
  getBackgroundPage((bg) => {
    let url;
    bg.getDomain((tabs) => {
      url = new URL(tabs[0].url);
      // dont show the button for non-http pages
      if (['http:', 'https:'].indexOf(url.protocol) === -1) return false;
      const urlToMatch = url.hostname.replace(/^www\./, '');

      domainToAllow.textContent = urlToMatch;
      domainToBlock.textContent = urlToMatch;

      bg.getSites((storage) => {
        if (storage.sites.includes(urlToMatch)) {
          removeButton.style.display = 'block';
          addButton.style.display = 'none';
        } else {
          addButton.style.display = 'block';
          removeButton.style.display = 'none';
        }
      });
    });
  });
}

function refreshToolbar() {
  markExtensionStatus();
  displayCurrentDomain();
}

function addWebsite() {
  getBackgroundPage((bg) => {
    bg.addCurrentlyActiveSite(() => {
      refreshToolbar();
    });
  });
}

function removeWebsite() {
  getBackgroundPage((bg) => {
    bg.removeCurrentlyActiveSite(() => {
      refreshToolbar();
    });
  });
}

function openOptions() {
  chrome.tabs.create({
    url: '/options/options.html',
  });
  window.close();
}

radioOff.addEventListener('click', handleClick);
radioOn.addEventListener('click', handleClick);
addButton.addEventListener('click', addWebsite);
removeButton.addEventListener('click', removeWebsite);
optionsButton.addEventListener('click', openOptions);

refreshToolbar();
