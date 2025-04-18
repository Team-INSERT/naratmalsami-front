import { Plugin, Editor } from "ckeditor5";

export class ForeignWordPlugin extends Plugin {
  private wordId: string = "originid";
  private className: string = "__origin_word__";
  private observer: MutationObserver | null = null;

  constructor(editor: Editor, wordId: string = "originid", className: string = "__origin_word__") {
    super(editor);
    this.wordId = wordId;
    this.className = className;
  }

  init() {
    this._defineSchema();
    this._defineConverters();

    // 에디터 렌더링 이후 DOM 접근
    this.editor.model.document.on("change:data", () => {
      const editable = this.editor.ui.getEditableElement();
      if (!editable) {
        console.error("Editable element not found.");
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

  private _observeMutations(editable: HTMLElement) {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const span = mutation.target?.parentElement;
          if (span?.tagName === "SPAN" && span.hasAttribute(this.wordId)) {
            // Find the corresponding model range and remove the attribute from the model
            const view = this.editor.editing.view;
            const domConverter = view.domConverter;
            const viewElement = domConverter.mapDomToView(span);

            if (viewElement && viewElement.is("element")) {
              const modelRange = this.editor.editing.mapper.toModelRange(
                view.createRangeOn(viewElement)
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
      }
    });

    this.observer.observe(editable, {
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });
  }

  private _defineSchema() {
    const schema = this.editor.model.schema;
    ["$text", "$block", "$root", "$container"].forEach((element) => {
      schema.extend(element, {
        allowAttributes: [this.wordId],
      });
    });
  }

  private _defineConverters() {
    const conversion = this.editor.conversion;
    // Downcast (model -> view)
    conversion.for("downcast").attributeToElement({
      model: this.wordId,
      view: (modelAttributeValue, { writer }) => {
        return writer.createAttributeElement("span", {
          [this.wordId]: modelAttributeValue,
          class: this.className,
        });
      },
    });

    // Upcast (view -> model)
    conversion.for("upcast").elementToAttribute({
      view: {
        name: "span",
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
    super(editor, "refineid", "__refine_word__");
  }
}
