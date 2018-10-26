
/**
 * Listens for typical editor events on a document, including:
 * - listening for Ctrl/Cmd-S for saving
 * - handling onbeforeunload to prompt about unsaved changes
 *
 * Note: remember to call `start` to register the listeners and `stop`
 * 		to unregister them. Failing to unregister the event listeners will
 * 		result in memory leaks and unexpected behavior!
 */
export default class EditorEvents {
  /**
   * Takes an object of configration with the following properties:
   * - document: the document to attach to and listen on. Can be `null`, to
   * 		make server-side rendering easier.
   * - isDirty(): a function that should return `true` if the user
   * 		should be warned about unsaved changes
   * - onSave(): a function that will be called when the user requests
   * 		a save (e.g., by hitting Ctrl-S)
   */
  constructor({document, isDirty, onSave}) {
    this.document = document;
    this.window = document && document.defaultView;
    this.checkIsDirty = isDirty;
    this.handleSave = onSave;

    this._documentKeydownListener = this.handleDocumentKeydown.bind(this);
    this._windowBeforeUnloadListener = this.handleWindowBeforeUnload.bind(this);
  }

  start() {
    if (this.document) {
      this.document.addEventListener('keydown',  this._documentKeydownListener);
      this.window.addEventListener('beforeunload', this._windowBeforeUnloadListener);
    }
  }

  stop() {
    if (this.document) {
      this.document.removeEventListener('keydown',  this._documentKeydownListener);
      this.window.removeEventListener('beforeunload', this._windowBeforeUnloadListener);
    }
  }

  handleDocumentKeydown(e) {
    let key;

    // Check just Cmd ("meta") OR Ctrl, no Alt. Shift is OK, I think.
    const hasJustMetaOrCtrl =
      ((e.metaKey ? 1 : 0) + (e.ctrlKey ? 1 : 0)) === 1 && !e.altKey;

    if (hasJustMetaOrCtrl) {
      if (e.key !== undefined) {
        // Standards - FF & IE as of Oct 2015
        key = e.key;
      } else if (e.keyIdentifier !== undefined) {
        // old draft standard - Chrome & Safari as of Oct 2015
        key = e.keyIdentifier;
      } else {
        // This isn't technically accurate for keydown, but it's good enough
        // for now, esp. in the presence of the other checks.
        key = String.fromCharCode(e.keyCode);
      }

      if (key === 's' || key === 'S' || key === 'U+0053' /* for keyIdentifier */) {
        e.preventDefault();
        this.handleSave();
      }
    }
  }

  handleWindowBeforeUnload(e) {
    if (this.checkIsDirty()) {
      const msg = 'It looks like you have unsaved changes. ' +
        'If you leave without saving, those changes will be lost.';
      e.returnValue = msg;
      return msg;
    }
  }
}
