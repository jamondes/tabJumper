
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-jump-input') {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs=>{
      chrome.tabs.sendMessage(tabs[0].id,{id: 'toggle-jump-input'});

    });
  }
});


let myTabs = {};

chrome.tabs.onCreated.addListener((tab) => {
  myTabs[tab.id] = {
      opened: Date.now() 
  };
  UpdateTabs();

});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete myTabs[tabId];
  UpdateTabs();
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  myTabs[tabId] = {
      opened: Date.now() 
  };
  UpdateTabs();
  chrome.tabs.sendMessage(activeInfo.tabId, { id: 'close-app' });

});


chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.action === "getTabs") {
    chrome.tabs.query({}, function (tabs) {
      chrome.tabs.sendMessage(sender.tab.id, { id: 'tabs' ,tabs: tabs.filter(t=>t.id !==sender.tab.id).map(tab=> ({ ...tab, opened: (myTabs[tab.id]?.opened || 0) }))});
    });
  }

  if (message.action === "getBookmarks") {
    let bookmarks = [];
    const bookmarkTree = await chrome.bookmarks.getTree();
    const traverseBookmarks = (node) => {
      if (node.children) {
        node.children.forEach(traverseBookmarks);
      } else {
        bookmarks.push(node);
      }
    };
    bookmarkTree.forEach(traverseBookmarks);
    chrome.tabs.sendMessage(sender.tab.id, { id: 'bookmarks' , bookmarks });
  }

  if (message.action === "getHistory") {
    const historyItems = await chrome.history.search({ text: message.query, startTime: 0 });
      chrome.tabs.sendMessage(sender.tab.id, { id: 'history' , history: historyItems });
    
    };

  if (message.action === "focus-tab") {
    chrome.windows.update(message.windowId, { focused: true }, () => {
      chrome.tabs.update(message.id, { active: true });
    });

  }

  if (message.action === "new-tab") {
    chrome.tabs.create({ url: message.url });  
  }

  if (message.action === "close-tab") {
    chrome.tabs.remove(message.tabId);  
  }
});

function UpdateTabs () {

  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabss=>{

    chrome.tabs.query({}, function (tabs) {
      chrome.tabs.sendMessage(tabss[0].id, { id: 'tabs' ,tabs: tabs.filter(t=>t.id !==tabss[0].id).map(tab=> ({ ...tab, opened: (myTabs[tab.id]?.opened || 0) }))});
    });

    });

}