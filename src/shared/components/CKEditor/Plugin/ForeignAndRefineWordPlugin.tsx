import { DocumentManager } from '@/shared/stores/DocumentManager';
import { Plugin, Editor } from 'ckeditor5';

export class ForeignWordPlugin extends Plugin {
  private wordId: string = 'originid';
  private className: string = '__origin_word__';
  private observer: MutationObserver | null = null;
  protected documentManager = new DocumentManager();

  constructor(
    editor: Editor,
    wordId: string = 'originid',
    className: string = '__origin_word__',
  ) {
    super(editor);
    this.wordId = wordId;
    this.className = className;
  }

  init() {
    this._defineSchema();
    this._defineConverters();

    // 에디터 렌더링 이후 DOM 접근
    this.editor.model.document.on('change:data', () => {
      const editable = this.editor.ui.getEditableElement();
      if (!editable) {
        console.error('Editable element not found.');
        return;
      }
      if (editable && !this.observer) {
        this._observeMutations(editable);
      }
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  protected _observeMutations(editable: HTMLElement) {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const span = mutation.target?.parentElement;
          if (span?.tagName === 'SPAN' && span.hasAttribute(this.wordId)) {
            // Find the corresponding model range and remove the attribute from the model
            this._deleteWordById(span.getAttribute(this.wordId) as string);
            const view = this.editor.editing.view;
            const domConverter = view.domConverter;
            const viewElement = domConverter.mapDomToView(span);

            if (viewElement && viewElement.is('element')) {
              const modelRange = this.editor.editing.mapper.toModelRange(
                view.createRangeOn(viewElement),
              );
              this.editor.model.change((writer) => {
                writer.removeSelectionAttribute(this.wordId);
                for (const item of modelRange.getItems()) {
                  writer.removeAttribute(this.wordId, item);
                }
              });
            }
          }
        }
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          mutation.removedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as HTMLElement).tagName === 'SPAN' &&
              (node as HTMLElement).hasAttribute(this.wordId)
            ) {
              this._deleteWordById(
                (node as HTMLElement).getAttribute(this.wordId) as string,
              );
            }
          });
        }
      }
    });

    this.observer.observe(editable, {
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });
  }
  protected _deleteWordById(error_id: string) {
    this.documentManager.deleteOriginWordById(error_id);
    console.log(`Deleted word with ID: ${error_id}`);
  }

  private _defineSchema() {
    const schema = this.editor.model.schema;
    ['$text', '$block', '$root', '$container'].forEach((element) => {
      schema.extend(element, {
        allowAttributes: [this.wordId],
      });
    });
  }

  private _defineConverters() {
    const conversion = this.editor.conversion;
    // Downcast (model -> view)
    conversion.for('downcast').attributeToElement({
      model: this.wordId,
      view: (modelAttributeValue, { writer }) => {
        return writer.createAttributeElement('span', {
          [this.wordId]: modelAttributeValue,
          class: this.className,
        });
      },
    });

    // Upcast (view -> model)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        attributes: {
          [this.wordId]: true,
        },
      },
      model: {
        key: this.wordId,
        value: (viewElement: HTMLElement) => {
          return viewElement.getAttribute(this.wordId);
        },
      },
    });
  }
}
export class RefinedWordPlugin extends ForeignWordPlugin {
  constructor(editor: Editor) {
    super(editor, 'refineid', '__refine_word__');
  }
  protected _deleteWordById(error_id: string) {
    // this.documentManager.deleteRefinedWordById(error_id);
    // console.log(`Deleted refined word with ID: ${error_id}`);
    return error_id;
  }
  protected _observeMutations(editable: HTMLElement) {
    // console.log(editable);
    return editable;
  }
}
