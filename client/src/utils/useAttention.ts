/**
 * "Attention" alerts result in a flashed message in the page title, and
 * optionally, a sound, when the app changes state while not visible.
 */

import { useEffect, useRef } from "react";

////////////////////////////////////////////////////////////////////////////////
// Utils for reading and updating document state.
////////////////////////////////////////////////////////////////////////////////
let originalTitle = document.title;
const setTitle = (title: string) => {
  document.title = title;
};
const resetTitle = () => {
  document.title = originalTitle;
};
const pageVisible = () => document.visibilityState === "visible";

////////////////////////////////////////////////////////////////////////////////
// Message registration
////////////////////////////////////////////////////////////////////////////////
const messages = new Map<symbol, string>();

function getActiveMessage(): string | null {
  return [...messages.values()].at(-1) ?? null;
}

////////////////////////////////////////////////////////////////////////////////
// Flashing interval
////////////////////////////////////////////////////////////////////////////////
const interval = 1000;
let flashIntervalId: number | null = null;
let flashToggle = false;

function startFlashing() {
  if (flashIntervalId !== null) return;
  originalTitle = document.title;
  flashIntervalId = setInterval(() => {
    const msg = getActiveMessage();
    if (msg === null) {
      stopFlashing();
      return;
    }
    flashToggle = !flashToggle;
    if (flashToggle) setTitle(msg);
    else resetTitle();
  }, interval);
}

function stopFlashing() {
  if (flashIntervalId !== null) {
    clearInterval(flashIntervalId);
    flashIntervalId = null;
    flashToggle = false;
    resetTitle();
  }
}

////////////////////////////////////////////////////////////////////////////////
// Handlers for registering and unregistering messages.
////////////////////////////////////////////////////////////////////////////////
function addMessage(id: symbol, msg: string) {
  messages.set(id, msg);
  startFlashing();
}

function clearMessage(id: symbol) {
  messages.delete(id);
  if (messages.size === 0) {
    stopFlashing();
  }
}

function clearAllMessages() {
  messages.clear();
  stopFlashing();
}

////////////////////////////////////////////////////////////////////////////////
// Global event listener for visibility changes.
////////////////////////////////////////////////////////////////////////////////
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") clearAllMessages();
});

////////////////////////////////////////////////////////////////////////////////
// Audio cues
////////////////////////////////////////////////////////////////////////////////
type AudioCue = "short" | "long";
type AudioCueProps = { frequency: number; duration: number; gain: number };

const CUES = {
  short: { frequency: 660, duration: 0.15, gain: 0.3 },
  long: { frequency: 880, duration: 0.3, gain: 0.3 },
} as const satisfies Record<AudioCue, AudioCueProps>;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playAudioCue(cue: AudioCue) {
  try {
    const { frequency, duration, gain } = CUES[cue];
    const ctx = getAudioContext();
    ctx.resume(); // Resume if suspended, no op if active.
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("attention audio cue failed", e);
  }
}

/******************************************************************************
 * ### useAttention
 *
 * Use to draw the user's attention to the page when it is not visible.
 *
 * Hooks into a singleton registry of alert messages to flash in the document
 * title. Only the last message added to the registry while rendering will be
 * flashed.
 *
 * Optionally, will play a sound.
 ******************************************************************************/
export function useAttention(opts: {
  /** Non-null activates the alert; null deactivates. */
  message: string | null;
  /** Audio cue to play on activation. */
  audio?: AudioCue;
}) {
  const id = useRef(Symbol());
  const wasActive = useRef(false);

  useEffect(() => {
    const message = opts.message || null;
    const active = message !== null;

    if (active && !wasActive.current) {
      if (!pageVisible()) addMessage(id.current, message);
      if (opts.audio) playAudioCue(opts.audio);
    } else if (active && wasActive.current) {
      // Message changed while still active. Update the message.
      if (messages.has(id.current)) {
        addMessage(id.current, message);
      }
    } else if (!active) {
      clearMessage(id.current);
    }

    wasActive.current = active;

    return () => {
      clearMessage(id.current);
    };
  }, [opts.message, opts.audio]);
}
