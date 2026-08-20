/**
 * The single owner of `document.title`.
 *
 * The title is always derived, never assigned ad hoc. Two independent inputs
 * feed it:
 *
 * - A "base" title, contributed by the active route's `PageTitle`.
 * - An optional transient "overlay", used by the attention flash to interrupt
 *   the base title while the page is not visible.
 *
 * Both are registered here rather than written to `document.title` directly, so
 * neither can clobber the other, and so restoring after a flash recomputes the
 * current title instead of replaying a stale copy of it.
 */

import { useEffect, useRef } from "react";

////////////////////////////////////////////////////////////////////////////////
// Composition
////////////////////////////////////////////////////////////////////////////////

/**
 * The app title from `index.html`, captured at module load, before anything
 * here has had a chance to overwrite it. Used as the suffix for every page, and
 * as the whole title when no route has contributed one.
 */
const appTitle = document.title;

const separator = " — ";

/** Base titles by registration id. The most recently registered one wins. */
const baseTitles = new Map<symbol, string>();

/** Takes precedence over the base title whenever it is non-null. */
let overlay: string | null = null;

function composeTitle(): string {
  const page = [...baseTitles.values()].at(-1);
  if (!page || page === appTitle) return appTitle;
  return `${page}${separator}${appTitle}`;
}

function render() {
  document.title = overlay ?? composeTitle();
}

////////////////////////////////////////////////////////////////////////////////
// Base title registration
////////////////////////////////////////////////////////////////////////////////

function setBaseTitle(id: symbol, page: string) {
  baseTitles.set(id, page);
  render();
}

function clearBaseTitle(id: symbol) {
  baseTitles.delete(id);
  render();
}

////////////////////////////////////////////////////////////////////////////////
// Flashing overlay
////////////////////////////////////////////////////////////////////////////////
const interval = 1000;
const flashMessages = new Map<symbol, string>();
let flashIntervalId: number | null = null;
let flashToggle = false;

function getActiveFlashMessage(): string | null {
  return [...flashMessages.values()].at(-1) ?? null;
}

function startFlashing() {
  if (flashIntervalId !== null) return;
  flashIntervalId = setInterval(() => {
    const message = getActiveFlashMessage();
    if (message === null) {
      stopFlashing();
      return;
    }
    flashToggle = !flashToggle;
    overlay = flashToggle ? message : null;
    render();
  }, interval);
}

function stopFlashing() {
  if (flashIntervalId === null) return;
  clearInterval(flashIntervalId);
  flashIntervalId = null;
  flashToggle = false;
  overlay = null;
  render();
}

/** Register a message to flash over the base title. Last registered wins. */
export function addFlashMessage(id: symbol, message: string) {
  flashMessages.set(id, message);
  startFlashing();
}

/** Whether a message is currently registered under `id`. */
export function hasFlashMessage(id: symbol): boolean {
  return flashMessages.has(id);
}

/** Clear a flashed message if it matches the given `id` */
export function clearFlashMessage(id: symbol) {
  flashMessages.delete(id);
  if (flashMessages.size === 0) stopFlashing();
}

/** Clear all registered messages */
export function clearAllFlashMessages() {
  flashMessages.clear();
  stopFlashing();
}

////////////////////////////////////////////////////////////////////////////////
// Global event listener for visibility changes.
////////////////////////////////////////////////////////////////////////////////
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") clearAllFlashMessages();
});

/******************************************************************************
 * ### useDocumentTitle
 *
 * Use to contribute the base document title for as long as the calling
 * component is mounted. The title is rendered as `"<page> — <app title>"`.
 *
 * Routes should not call this directly; `PageTitle` calls it for them, so that
 * the page's `<h1>` and the document title cannot drift apart.
 ******************************************************************************/
export function useDocumentTitle(value: string) {
  const id = useRef(Symbol());

  useEffect(() => {
    const key = id.current;
    setBaseTitle(key, value);
    return () => clearBaseTitle(key);
  }, [value]);
}
