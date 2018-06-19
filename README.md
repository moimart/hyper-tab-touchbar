hyper-tab-touchbar
======

# Use your MacBook Pro's TouchBar to jump to your tabs

# Install

From hyper terminal: `hyper i hyper-tab-touchbar`

# Features:

- Show your open tabs in your MacBook Pro's TouchBar
- Click on the tabs to jump to the specific tab
- If you have [hyper-folder-icon](https://github.com/moimart/hyper-folder-icon) installed, you can have your Volumes and custom folder's icons shown in the TouchBar

![alt text](https://i.imgur.com/2pnvB1w.jpg)

## Optional Configuration keys

- All inside hyperTouchBar object
- activeColor -> hex rgb value string like '#005566' (that's the default value)
- inactiveColor -> hex rgb value string like '#777777' (that's the default value)
- specialButton -> Object containing a script path exporting an arrow function (window) => {} ; By default it 'clears' the active terminal

```
{
  activeColor: '#005566',
  inactiveColor: '#777777',
  specialButton: {
    label: 'clear',
    onClick: 'path_to_file.js'
  }
}
```

The script simply exports a function:

```
module.exports = {
  hyperTouchBarOnClick: () => {
    console.log('Hello World');
  }
};
```

set specialButton to undefined if you don't want the special button to be shown
