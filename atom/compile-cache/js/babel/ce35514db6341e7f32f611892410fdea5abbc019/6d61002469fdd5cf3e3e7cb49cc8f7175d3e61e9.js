Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.getConfigForEditor = getConfigForEditor;
/** @babel */

var _require = require('atom');

var TextBuffer = _require.TextBuffer;

/**
 * Retrieve the {@link EditorConfig} instance attached to an editor.
 *
 * @param {TextEditor|TextBuffer} [subject=null]
 *    A reference to either a {@link TextEditor}, or its underlying {@link TextBuffer}.
 *    If omitted, this parameter defaults to the currently-active editor.
 *
 * @returns {?EditorConfig}
 *    A config instance if one exists, or null if none was found.
 *
 * @internal
 */

function getConfigForEditor() {
	var subject = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

	if (subject === null) {
		subject = atom.workspace.getActiveTextEditor();
	}

	if (!subject) {
		return null;
	}

	if (subject instanceof TextBuffer) {
		return subject.editorconfig || null;
	}

	if (atom.workspace.isTextEditor(subject)) {
		var buffer = subject.getBuffer();
		return buffer && buffer.editorconfig || null;
	}

	// Whatever that was, it shouldn't have been passed.
	throw new TypeError('Invalid argument: Object is not a TextEditor or TextBuffer');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2xpYi9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztlQUVxQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUE3QixVQUFVLFlBQVYsVUFBVTs7Ozs7Ozs7Ozs7Ozs7O0FBY1YsU0FBUyxrQkFBa0IsR0FBaUI7S0FBaEIsT0FBTyx5REFBRyxJQUFJOztBQUNoRCxLQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDckIsU0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztFQUMvQzs7QUFFRCxLQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2IsU0FBTyxJQUFJLENBQUM7RUFDWjs7QUFFRCxLQUFJLE9BQU8sWUFBWSxVQUFVLEVBQUU7QUFDbEMsU0FBTyxPQUFPLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQztFQUNwQzs7QUFFRCxLQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ3pDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNuQyxTQUFPLEFBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxZQUFZLElBQUssSUFBSSxDQUFDO0VBQy9DOzs7QUFHRCxPQUFNLElBQUksU0FBUyxDQUFDLDREQUE0RCxDQUFDLENBQUM7Q0FDbEYiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9lZGl0b3Jjb25maWcvbGliL2hlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmNvbnN0IHtUZXh0QnVmZmVyfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUge0BsaW5rIEVkaXRvckNvbmZpZ30gaW5zdGFuY2UgYXR0YWNoZWQgdG8gYW4gZWRpdG9yLlxuICpcbiAqIEBwYXJhbSB7VGV4dEVkaXRvcnxUZXh0QnVmZmVyfSBbc3ViamVjdD1udWxsXVxuICogICAgQSByZWZlcmVuY2UgdG8gZWl0aGVyIGEge0BsaW5rIFRleHRFZGl0b3J9LCBvciBpdHMgdW5kZXJseWluZyB7QGxpbmsgVGV4dEJ1ZmZlcn0uXG4gKiAgICBJZiBvbWl0dGVkLCB0aGlzIHBhcmFtZXRlciBkZWZhdWx0cyB0byB0aGUgY3VycmVudGx5LWFjdGl2ZSBlZGl0b3IuXG4gKlxuICogQHJldHVybnMgez9FZGl0b3JDb25maWd9XG4gKiAgICBBIGNvbmZpZyBpbnN0YW5jZSBpZiBvbmUgZXhpc3RzLCBvciBudWxsIGlmIG5vbmUgd2FzIGZvdW5kLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnRm9yRWRpdG9yKHN1YmplY3QgPSBudWxsKSB7XG5cdGlmIChzdWJqZWN0ID09PSBudWxsKSB7XG5cdFx0c3ViamVjdCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcblx0fVxuXG5cdGlmICghc3ViamVjdCkge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0aWYgKHN1YmplY3QgaW5zdGFuY2VvZiBUZXh0QnVmZmVyKSB7XG5cdFx0cmV0dXJuIHN1YmplY3QuZWRpdG9yY29uZmlnIHx8IG51bGw7XG5cdH1cblxuXHRpZiAoYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKHN1YmplY3QpKSB7XG5cdFx0Y29uc3QgYnVmZmVyID0gc3ViamVjdC5nZXRCdWZmZXIoKTtcblx0XHRyZXR1cm4gKGJ1ZmZlciAmJiBidWZmZXIuZWRpdG9yY29uZmlnKSB8fCBudWxsO1xuXHR9XG5cblx0Ly8gV2hhdGV2ZXIgdGhhdCB3YXMsIGl0IHNob3VsZG4ndCBoYXZlIGJlZW4gcGFzc2VkLlxuXHR0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGFyZ3VtZW50OiBPYmplY3QgaXMgbm90IGEgVGV4dEVkaXRvciBvciBUZXh0QnVmZmVyJyk7XG59XG4iXX0=