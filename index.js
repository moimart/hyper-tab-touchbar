const { nativeImage } = require('electron');
const { TouchBar } = require('electron');
const { exec } = require('child_process');

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

let config = {
  activeColor: '#005566',
  inactiveColor: '#777777',
  specialButton: {
    label: 'clear',
    onClick: () => {
      window.store.dispatch({
        type: 'SESSION_CLEAR_ACTIVE'
      });
    }
  }
};

if (TouchBar) {
  //We are inside the main process

  const { TouchBarButton } = TouchBar;

  exports.onWindow = (window) => {
    if (window) {

      window.rpc.on('touchbar-tabs', (tabs) => {
        let buttons = [];

        for (let data of tabs) {
          if (data.iconData) {
            data.icon = nativeImage.createFromBuffer(Buffer.from(data.iconData.buffer,'base64'));
          } else {
            delete data.icon;
          }

          if (!data.specialButton) {
            data.click = () => {
              window.rpc.emit('activate-tab-uid',data.sessionUid);
            };
          } else {
            data.click = () => {
              window.rpc.emit('activate-tab-special')
            }
          }

          buttons.push(new TouchBarButton(data));
        }

        window.setTouchBar(new TouchBar(buttons));
      });
    }
  }
}

var allTabs = {};
var listener;

let populateTouchBar = () => {

  if (Object.keys(allTabs).length == 1) {
    allTabs = {};

    if (config.specialButton) {
      let buttonsData = [{
        label: config.specialButton.label,
        specialButton: true,
        backgroundColor: config.activeColor
      }];

      window.rpc.emit('touchbar-tabs',buttonsData);
    }

    return;
  }

  let buttonsData = [];

  if (config.specialButton) {
    buttonsData.push({
      label: config.specialButton.label,
      specialButton: true,
      backgroundColor: config.activeColor
    });
  }

  for (let uid of Object.keys(allTabs)) {
    buttonsData.push({
      sessionUid: window.store.getState().termGroups.termGroups[uid].sessionUid,
      label: allTabs[uid].text,
      iconData: (allTabs[uid].iconData) ? allTabs[uid].iconData : undefined,
      backgroundColor: allTabs[uid].isActive ? config.activeColor : config.inactiveColor,
      iconPosition: "left"
    });
  }

  try {
    window.rpc.emit('touchbar-tabs',buttonsData);
  } catch(error) {

  }

  if (listener == undefined) {
    window.rpc.on('activate-tab-uid', (uid) => {
      window.store.dispatch({
        type:'SESSION_SET_ACTIVE',
        uid
      });

      populateTouchBar();
    });

    window.rpc.on('activate-tab-special', () => {
      if (config.specialButton) {
        config.specialButton.onClick();
      }
    });

    listener = window;
  }
};

exports.getTabProps = (uid,parentProps,props) => {
  allTabs[uid.uid] = Object.assign({},allTabs[uid.uid],props);
  return props;
}

exports.getTabsProps = (parentProps,props) => {
  const { tabs } = props;

  let existingTabs = {};
  for (let tab of tabs) {
    existingTabs[tab.uid] = tab;
  }

  let waste = Object.keys(allTabs).slice().diff(Object.keys(existingTabs));

  for (let w of waste) {
    delete allTabs[w];
  }

  populateTouchBar();

  return props;
}

exports.middleware = (store) => (next) => (action) => {
    const uids = store.getState().sessions.sessions;

    switch (action.type) {
        case 'FOLDER_ICON':
          if (allTabs.hasOwnProperty(action.icon.uid)) {
            allTabs[action.icon.uid].iconData = action.icon.iconData;
            populateTouchBar();
          }
          break;

        case 'SESSION_SET_ACTIVE':
          populateTouchBar();
          break;

        case 'CONFIG_LOAD':
        case 'CONFIG_RELOAD':
          if (action.config.hyperTouchBar) {
           config = Object.assign({},config,action.config.hyperTouchBar);
           if (action.config.hyperTouchBar.specialButton
               && action.config.hyperTouchBar.specialButton.onClick) {
             try {
              let fn = require(config.specialButton.onClick).hyperTouchBarOnClick;
              if (fn) {
                config.specialButton.onClick = fn;
              }
             } catch (error) {
              //do nothing...
             }
           }
         }
          break;
    }

    next(action);
};
