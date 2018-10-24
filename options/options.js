const blockedSites = document.querySelector('.blocked-sites ul');
const form = document.querySelector('form');
const getSites = (callback) => {chrome.storage.local.get('sites', callback);};

function addToBlockedList(text) {
  const label = document.createElement('p');
  label.textContent = text;
  const button = document.createElement('button');
  button.textContent = 'Delete';

  const listItem = document.createElement('li');
  listItem.appendChild(label);
  listItem.appendChild(button);

  blockedSites.appendChild(listItem);
}

function hasNoProtocol(url) {
  const regex = /^[a-zA-Z]{3,}:\/\//;
  return !regex.test(url);
}

function hasNoExtension(url) {
  const regex = /(\w+\.\w+)$/;
  return !regex.test(url);
}

function restoreOptions() {
  getSites((storage) => {
    storage.sites.forEach((site) => {
      addToBlockedList(site);
    });
  });
}

function saveSite(event) {
  event.preventDefault();
  const url = form.site.value;
  if (url.length == 0) { return; }
  addToBlockedList(url);
  form.site.value = '';

  getSites((storage) => {
    storage.sites.push(url);
    chrome.storage.local.set({
      sites: storage.sites,
    });
  });
}

function deleteSite(event) {
  if (event.target.nodeName === 'BUTTON') {
    const toDelete = event.target.parentElement;
    const toDeleteParent = toDelete.parentElement;
    const toDeleteText = event.target.previousSibling.textContent;
    toDeleteParent.removeChild(toDelete);

    getSites((storage) => {
      const i = storage.sites.indexOf(toDeleteText);
      if (i !== -1) {
        storage.sites.splice(i, 1);
      }
      chrome.storage.local.set({
        sites: storage.sites,
      });
    });
  }
}

form.addEventListener('submit', saveSite);
blockedSites.addEventListener('click', deleteSite);
document.addEventListener('DOMContentLoaded', restoreOptions);
