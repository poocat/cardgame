import { useEffect, useRef } from "react";

////////////////////////////////////////////////////////////////////////////////
// Module-level title flash coordinator
////////////////////////////////////////////////////////////////////////////////
const activeTitleMessages = new Set<string>();
let originalTitle = "";
let flashInterval: ReturnType<typeof setInterval> | null = null;
let flashToggle = false;

function startFlashing() {
  if (flashInterval) return;
  originalTitle = document.title;
  flashInterval = setInterval(() => {
    flashToggle = !flashToggle;
    if (flashToggle && activeTitleMessages.size > 0) {
      // Show the most recently added message
      const msgs = [...activeTitleMessages];
      document.title = `(!) ${msgs[msgs.length - 1]}`;
    } else {
      document.title = originalTitle;
    }
  }, 1000);
}

function stopFlashing() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
    flashToggle = false;
    document.title = originalTitle;
  }
}

function addTitleMessage(msg: string) {
  activeTitleMessages.add(msg);
  startFlashing();
}

function removeTitleMessage(msg: string) {
  activeTitleMessages.delete(msg);
  if (activeTitleMessages.size === 0) {
    stopFlashing();
  }
}

// Stop flashing when the user returns to the tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    activeTitleMessages.clear();
    stopFlashing();
  }
});

////////////////////////////////////////////////////////////////////////////////
// Audio cues
////////////////////////////////////////////////////////////////////////////////
const AUDIO_CUES = {
  click: { frequency: 660, duration: 0.15, gain: 0.3 },
  tada: { frequency: 880, duration: 0.3, gain: 0.3 },
} as const;

type AudioCue = keyof typeof AUDIO_CUES;

/******************************************************************************
 * A function that emits one of a few pre-programmed audio cues.
 ******************************************************************************/
function playAudioCue(cue: AudioCue) {
  try {
    const { frequency, duration, gain } = AUDIO_CUES[cue];
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => ctx.close();
  } catch {}
}

////////////////////////////////////////////////////////////////////////////////
// Hook
////////////////////////////////////////////////////////////////////////////////

type UseAlertOptions = {
  /** When transitioning from false to true while the tab is hidden, triggers notification and title flash. */
  active: boolean;
  /** Message to display in a browser notification (only when tab is hidden). */
  notificationMessage?: string;
  /** Message to flash in the document title (only when tab is hidden). */
  titleMessage?: string;
  /** Named audio cue to play (fires even when the tab is visible). */
  audio?: AudioCue;
};

export function useAlert(opts: UseAlertOptions) {
  // const { active, notificationMessage, titleMessage, audio } = opts;
  const previouslyActive = useRef(false);

  // Fire alert on false-true transition
  useEffect(() => {
    if (opts.active && !previouslyActive.current) {
      const hidden = document.visibilityState === "hidden";

      if (hidden && opts.notificationMessage) {
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(opts.notificationMessage);
        }
      }

      if (hidden && opts.titleMessage) {
        addTitleMessage(opts.titleMessage);
      }

      if (opts.audio) {
        playAudioCue(opts.audio);
      }
    }

    previouslyActive.current = opts.active;
  }, [opts.active, opts.notificationMessage, opts.titleMessage, opts.audio]);

  // Clean up title message when active becomes false or on unmount.
  useEffect(() => {
    if (!opts.active && opts.titleMessage) {
      removeTitleMessage(opts.titleMessage);
    }
    return () => {
      if (opts.titleMessage) {
        removeTitleMessage(opts.titleMessage);
      }
    };
  }, [opts.active, opts.titleMessage]);
}
