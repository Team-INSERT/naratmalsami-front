import { Plugin } from "ckeditor5";
import generateUniqueId, { Prefix } from "@/utils/generateUniqueId";
export class DataUniqueAttributePlugin extends Plugin {
  private DataAttribute: string = "data-unique";
  init() {
    const editor = this.editor;
    this._defineSchema();
    this._defineConverters();
    // After executing the Enter command
    editor.model.document.on("change:data", (evt, batch) => {
      // Only handle user-initiated changes (like typing or Enter)
      if (!batch.isLocal) return;

      const selection = editor.model.document.selection;
      const position = selection.getFirstPosition();
      const block = position?.parent;

      if (block?.is("element", "paragraph")) {
        // 만약 새로 생긴 p가 기존과 같은 data-unique 값을 가지고 있으면 새로 설정
        const currentValue = block.getAttribute(this.DataAttribute);

        if (!currentValue || this._isDuplicateInRoot(block, currentValue)) {
          editor.model.change((writer) => {
            const newValue = generateUniqueId(Prefix.UNIQUE);
            writer.setAttribute(this.DataAttribute, newValue, block);
          });
        }
      }
    });
  }
  _defineSchema() {
    const schema = this.editor.model.schema;
    // 1. 모델 스키마에 customAttribute 허용
    ["$text", "$block", "$root", "$container"].forEach((element) => {
      schema.extend(element, {
        allowAttributes: ["data-unique"],
      });
    });
  }
  _defineConverters() {
    const conversion = this.editor.conversion;
    // to View
    conversion.for("downcast").attributeToAttribute({
      model: this.DataAttribute,
      view: "data-unique",
    });
    // to Model
    conversion.for("upcast").attributeToAttribute({
      view: "data-unique",
      model: this.DataAttribute,
    });
  }
  _isDuplicateInRoot(block, value) {
    const root = block.root;
    for (const child of root.getChildren()) {
      if (child !== block && child.getAttribute?.(this.DataAttribute) === value) {
        return true;
      }
    }
    return false;
  }
}
