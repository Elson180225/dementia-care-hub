// Other components call this to show the welcome guide again,
// for example the "Help me find where to start" button on the home page.
export const OPEN_WELCOME_GUIDE = "dch:open-welcome-guide";

export function openWelcomeGuide() {
  window.dispatchEvent(new Event(OPEN_WELCOME_GUIDE));
}