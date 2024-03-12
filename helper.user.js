// ==UserScript==
// @name         ASU Canvas Playposit Helper
// @version      0.1
// @description  Fix video player issues of ASU Canvas with Playposit
// @author       Nendo
// @homepage     https://github.com/nendonerd/ASU-Canvas-Playposit-Helper
// @license MIT
// @match https://canvas.asu.edu/courses/*
// @match https://api.playposit.com/course/*
// @match https://api.playposit.com/player_v2*
// @grant unsafeWindow
// @require https://raw.githubusercontent.com/nendonerd/waitForKeyElements.js/master/waitForKeyElements.js
// @require https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.min.js
// ==/UserScript==

///////////////
// Site Urls //
///////////////
// canvas-playposit page contains 1 main site and 2 nested iframes
const canvasUrl = "https://canvas.asu.edu/courses/"
const playPositUrl = "https://api.playposit.com/course/"
const videoPlayerUrl = "https://api.playposit.com/player_v2"

//////////////////////////////////////
// Fix the size of the video player //
//////////////////////////////////////
if (document.URL.startsWith(canvasUrl)) {
  waitForKeyElements("#wrapper", function (wrapper) {
    Object.assign(wrapper.style, {
      "max-width": "none"
    })
  })
  waitForKeyElements("iframe.lti-embed", function (iframe) {
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
    })

    const iframeContainer = document.querySelector(".lti-embed-container") || iframe.parentNode
    Object.assign(iframeContainer.style, {
      width: "100%",
      "aspect-ratio": "16 / 11",
    })
  })
} else if (playPositUrl) {
  waitForKeyElements("html", function (html) {
    Object.assign(html.style, {
      "overflow-y": "hidden"
    })
  })
  
  // keep the style persist through vue re-render
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div.v-responsive { max-width: none !important; }';
  document.getElementsByTagName('head')[0].appendChild(style);
}

//////////////////////////////////////////
// Stop expanding playlist on page load //
//////////////////////////////////////////
if (document.URL.startsWith(playPositUrl)) {
  waitForKeyElements("div.v-toolbar__content > button", function (button) {
    button.click()
  })
}

////////////////////////////////////
// Scroll video player to the top //
////////////////////////////////////
if (document.URL.startsWith(canvasUrl)) {
  waitForKeyElements("iframe.lti-embed", function (iframe) {
    // wait for page fully loaded. while loading, the page will reset the scroll height
    setTimeout(() => iframe.scrollIntoView(), 5000)
  })
}

//////////////////////////////////////
// Keyboard shortcut implementation //
//////////////////////////////////////
if (document.URL.startsWith(canvasUrl)) {
  unsafeWindow.addEventListener("keypress", (e) => {
    // console.log("canvas", e.key)
    const keyVal = { key: e.key };
    const iframe = document.querySelector("iframe.lti-embed")
    if (!iframe) return
    iframe.contentWindow.postMessage(
      { name: "passKeyEvent", keyVal },
            "*"
    )
  })
  // "n" key and arrow keys do not trigger keypress/keydown events in canvas, 
  // due to framework event listeners stop the propagation of them,
  // thus using keyup event as a workaround
  unsafeWindow.addEventListener("keyup", (e) => {
    switch (e.key) {
      case 'n':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        // console.log("canvas", e.key)
        const keyVal = { key: e.key }
        const iframe = document.querySelector("iframe.lti-embed")
        if (!iframe) return
        iframe.contentWindow.postMessage(
          { name: "passKeyEvent", keyVal },
                "*"
        )
    }
  })
  window.onmessage = (e) => {
    if (e.data && e.data.name === "scroll") {
      window.scrollBy(0, e.data.value)
    }
  }
} else if (document.URL.startsWith(playPositUrl)) {
  unsafeWindow.addEventListener("keypress", (e) => {
    // console.log("playPosit", e.key)
    const keyVal = { key: e.key };
    const iframe = document.querySelector("iframe#playerIframe")
    if (!iframe) return
    iframe.contentWindow.postMessage(
      { name: "passKeyEvent", keyVal },
            "*"
    )
  })
  // arrow keys do not trigger keypress/keydown events in posit, using keyup workaround
  unsafeWindow.addEventListener("keyup", (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        // console.log("playPosit", e.key)
        const keyVal = { key: e.key }
        const iframe = document.querySelector("iframe#playerIframe")
        if (!iframe) return
        iframe.contentWindow.postMessage(
          { name: "passKeyEvent", keyVal },
                "*"
        )
    }
  })
  window.onmessage = (e) => {
    if (e.data && e.data.name === "passKeyEvent") {
      // console.log("playPosit", e.data.keyVal)
      const iframe = document.querySelector("iframe#playerIframe")
      if (!iframe) return
      iframe.contentWindow.postMessage(
        { name: "passKeyEvent", keyVal: e.data.keyVal },
              "*"
      )
    } else if (e.data && e.data.name === "scroll") {
      window.parent.postMessage({ name: "scroll", value: e.data.value}, "*")
    }
  }
} else if (document.URL.startsWith(videoPlayerUrl)) {
  unsafeWindow.addEventListener("keypress", (e) => {
    // console.log("videoPlayer", e.key)
    handleKeyPress(e.key)
  })
  // arrow keys do not trigger keypress/keydown events in video player, using keyup workaround
  unsafeWindow.addEventListener("keyup", (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        // console.log("videoPlayer", e.key)
        handleKeyPress(e.key)
    }
  })
  window.onmessage = (e) => {
    if (e.data && e.data.name === "passKeyEvent") {
      // console.log("videoPlayer", e.data.keyVal)
      handleKeyPress(e.data.keyVal.key)
    }
  }
}

function handleKeyPress(key) {
  const playerElem = document.querySelector('#posit-wrapper > [class^="vi-player"]')
  if (!playerElem) {
    console.error("player not found !")
    return
  }
  const player = playerElem.__vue__
  const video = playerElem.querySelector("video")
  const mask = video.parentNode.parentNode

  const vidList = [...document.querySelectorAll('.v-list-item--link')];
  const currVidIndex = vidList.findIndex(e => e === $('.mdi-play-circle').parentNode.parentNode)

  const currSpeed = video.playbackRate
  const speedStep = 0.1
  let newSpeed

  const cue = document.querySelector(".vjs-text-track-cue")
  let currFont
  let currFontSize
  if (cue) {
    currFont = cue.style.font
    currFontSize = parseFloat(currFont)
  }
  const fontSizeStep = 2
  let newFontSize
  let newFont

  let currVolume = video.volume * 100
  const volumeStep = 10
  let newVolume

  console.log("keyPress:", key)
  switch (key) {
    case 'k':
      if (mask.style.display === "none") {
        mask.style.display = ''
        player.togglePlay()
      }
      player.togglePlay()
      break;
    case 'j':
    case 'ArrowLeft':
      document.querySelector("#rewind-10").click()
      break;
    case 'l':
    case 'ArrowRight':
      document.querySelector("#forward-10").click()
      break;
    case 'p':
      vidList[(currVidIndex + 3) % vidList.length].click()
      break;
    case 'n':
      vidList[(currVidIndex + 1) % vidList.length].click()
      break;
    case '<':
      newSpeed = currSpeed - speedStep
      newSpeed = newSpeed > 0 ? newSpeed : 0
      newSpeed = parseFloat(newSpeed.toFixed(1))
      console.log("speed:", newSpeed)
      player.setSpeed(newSpeed)
      break;
    case '>':
      newSpeed = currSpeed + speedStep
      newSpeed = newSpeed > 0 ? newSpeed : 0
      newSpeed = parseFloat(newSpeed.toFixed(1))
      console.log("speed:", newSpeed)
      player.setSpeed(newSpeed)
      break;
    case 'f':
      // only works when the video player iframe is focused by user click
      // due to browser security non-sense, the requestFullscreen method can only be invoked by direct user interactions (click/keypress)
      // when press f without the iframe focused, the key is passed through postMessage into iframe, thus losing the 'user action verified' part
      player.screenfull.toggle()
      break;
    case 'm':
      player.setMute(!player.mute)
      break;
    case 'c':
      player.toggleCC()
      break;
    case '-':
      newFontSize = currFontSize - fontSizeStep
      newFont = newFontSize.toString() + currFont.split(currFontSize.toString())[1]
      Object.assign(cue.style, {"font": newFont})
      break;
    case '=':
      newFontSize = currFontSize + fontSizeStep
      newFont = newFontSize.toString() + currFont.split(currFontSize.toString())[1]
      Object.assign(cue.style, {"font": newFont})
      break;
    case 'ArrowUp':
      // will move the page 40 downward to counter act unremovable scroll up behavior
      // unsafeWindow.scrollBy(0,40)
      window.parent.postMessage({ name: "scroll", value: 40}, "*")
      newVolume = currVolume + volumeStep
      console.log("volume:", newVolume)
      player.setVolume(newVolume)
      break;
    case 'ArrowDown':
      // unsafeWindow.scrollBy(0,-40)
      window.parent.postMessage({ name: "scroll", value: -40}, "*")
      newVolume = currVolume - volumeStep
      console.log("volume:", newVolume)
      player.setVolume(newVolume)
      break;
    case 'h':
      document.querySelector("#toggle-sidebar").click();
      document.querySelector('[aria-label="Open Transcript"]').click()
      break;
  }
}
