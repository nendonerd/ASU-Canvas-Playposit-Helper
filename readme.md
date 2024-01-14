# ASU-Canvas=Playposit-Helper

A userscript to fix video player issues of [ASU Canvas](https://canvas.asu.edu) (the website to take ASU online courses)

## Usage
1. [Install Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. [Install the Script](https://github.com/nendonerd/ASU-Canvas-Playposit-Helper/raw/main/helper.user.js)

## Keyboard Shortcuts
| Action                  | Key         |
| ----------------------- | ----------- |
| Play/Pause              | k           |
| Rewind 10s              | j or ←      |
| Forward 10s             | l or →      |
| Decrease Speed          | < (SHIFT+,) |
| Increase Speed          | > (SHIFT+.) |
| Prev Video              | p           |
| Next Video              | n           |
| Fullscreen              | f           |
| Toggle Mute             | m           |
| Decrease Volumn         | ↓           |
| Increase Volumn         | ↑           |
| Toggle Caption          | c           |
| Decrease Caption Size   | -           |
| Increase Caption Size   | =           |
| Toggle Transcript Panel | h           |

## Notice
The fullscreen shortcut can only be triggered when you have manually click and focus the video player, due to browser security limitations

## Development Setup
The following setup will auto reload target page when userscript is modified, so that it could be applied to the target page

1. In Chrome, Go to Settings -> Extensions -> Tampermonkey -> Details -> Allow access to file URLs, and turn it on
2. In Tampermonkey, create a new script and delete the template content
3. Clone the repo, copy only the userscript headers from helper.user.js into Tampermonkey's editor, then copy below line into the headers in Tampermonkey editor. 
> `// @require file://<absolute path to the cloned repo folder>/helper.user.js`
4. Install *entr* and *chrome-cli* by `brew install entr; brew install chrome-cli`
4. Open an ASU online course link, make sure Chrome only have a single window and the course tab is active
5. Find the tab's ID by running `chrome-cli info`
6. Cd to the repo folder, run `ls *.js | entr zsh -c 'chrome-cli reload -t <tabId>'`
7. Do your edit to helper.user.js with any IDE, the course tab will refresh on every save of the script, and test your work in the course tab.
8. To debug player state, *opt+cmd+i* to open devtools, *shift+cmd+c* and click on the video player (to make iframe context available in devtools console), then paste below code to get the player instance
```js
player = document.querySelector('#posit-wrapper > [class^="vi-player"]').__vue__
```

## Task List
  - [x] fix player width
  - [x] add keyboard control
  - [x] stop expanding playlist on page load
  - [x] scroll video player to the top
  - [ ] add download button
