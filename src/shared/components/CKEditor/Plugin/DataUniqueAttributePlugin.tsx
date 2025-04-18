import { Plugin } from "ckeditor5";

export class DataUniqueAttributePlugin extends Plugin {
  private DataAttribute: string = "data-unique";
  init() {
    this._defineSchema();
    this._defineConverters();
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
}
