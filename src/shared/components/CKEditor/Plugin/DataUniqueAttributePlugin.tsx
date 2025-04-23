import { Plugin } from 'ckeditor5';
import generateUniqueId, { Prefix } from '@/utils/generateUniqueId';
export class DataUniqueAttributePlugin extends Plugin {
  private DataAttribute: string = 'data-unique';
  init() {
    const editor = this.editor;
    this._defineSchema();
    this._defineConverters();
    // After executing the Enter command
    editor.model.document.on('change:data', (_, batch) => {
      // Only handle user-initiated changes (like typing, Enter, or paste)
      if (!batch.isLocal) return;

      const changes = Array.from(editor.model.document.differ.getChanges());
      const handledBlocks = new Set();

      // Iterate over all insertions in the differ
      changes.forEach((change) => {
        if (
          change.type === 'insert' &&
          (change.name === 'paragraph' ||
            change.name === 'heading1' ||
            change.name === 'heading2' ||
            change.name === 'heading3' ||
            change.name === 'blockQuote' ||
            change.name === 'listItem')
        ) {
          const block = change.position.nodeAfter;
          if (block && !handledBlocks.has(block)) {
            const currentValue = block.getAttribute(this.DataAttribute);
            if (!currentValue || this._isDuplicateInRoot(block, currentValue)) {
              editor.model.change((writer) => {
                const newValue = generateUniqueId(Prefix.UNIQUE);
                writer.setAttribute(this.DataAttribute, newValue, block);
              });
            }
            handledBlocks.add(block);
          }
        }
      });
    });
  }
  _defineSchema() {
    const schema = this.editor.model.schema;
    // 1. 모델 스키마에 customAttribute 허용
    ['$text', '$block', '$root', '$container'].forEach((element) => {
      schema.extend(element, {
        allowAttributes: ['data-unique'],
      });
    });
  }
  _defineConverters() {
    const conversion = this.editor.conversion;
    // to View
    conversion.for('downcast').attributeToAttribute({
      model: this.DataAttribute,
      view: 'data-unique',
    });
    // to Model
    conversion.for('upcast').attributeToAttribute({
      view: 'data-unique',
      model: this.DataAttribute,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _isDuplicateInRoot(block: any, value: any) {
    const root = block.root;
    for (const child of root.getChildren()) {
      if (
        child !== block &&
        child.getAttribute?.(this.DataAttribute) === value
      ) {
        return true;
      }
    }
    return false;
  }
}
