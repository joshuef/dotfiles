Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _lodashDebounce = require('lodash/debounce');

var _lodashDebounce2 = _interopRequireDefault(_lodashDebounce);

var _helpers = require('./helpers');

var EditorLinter = (function () {
  function EditorLinter(editor) {
    var _this = this;

    _classCallCheck(this, EditorLinter);

    if (!atom.workspace.isTextEditor(editor)) {
      throw new Error('EditorLinter expects a valid TextEditor');
    }
    var editorBuffer = editor.getBuffer();
    var debouncedLint = (0, _lodashDebounce2['default'])(function () {
      _this.emitter.emit('should-lint', false);
    }, 50, { leading: true });

    this.editor = editor;
    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.editor.onDidDestroy(function () {
      return _this.dispose();
    }));
    // This debouncing is for beautifiers, if they change contents of the editor and save
    // Linter should count that group of events as one.
    this.subscriptions.add(this.editor.onDidSave(debouncedLint));
    // This is to relint in case of external changes to the opened file
    this.subscriptions.add(editorBuffer.onDidReload(debouncedLint));
    // NOTE: TextEditor::onDidChange immediately invokes the callback if the text editor was *just* created
    // Using TextBuffer::onDidChange doesn't have the same behavior so using it instead.
    this.subscriptions.add((0, _helpers.subscriptiveObserve)(atom.config, 'linter.lintOnChangeInterval', function (interval) {
      return editorBuffer.onDidChange((0, _lodashDebounce2['default'])(function () {
        _this.emitter.emit('should-lint', true);
      }, interval));
    }));
  }

  _createClass(EditorLinter, [{
    key: 'getEditor',
    value: function getEditor() {
      return this.editor;
    }
  }, {
    key: 'lint',
    value: function lint() {
      var onChange = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      this.emitter.emit('should-lint', onChange);
    }
  }, {
    key: 'onShouldLint',
    value: function onShouldLint(callback) {
      return this.emitter.on('should-lint', callback);
    }
  }, {
    key: 'onDidDestroy',
    value: function onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-destroy');
      this.subscriptions.dispose();
      this.emitter.dispose();
    }
  }]);

  return EditorLinter;
})();

exports['default'] = EditorLinter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9lZGl0b3ItbGludGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRXlELE1BQU07OzhCQUMxQyxpQkFBaUI7Ozs7dUJBRUYsV0FBVzs7SUFFMUIsWUFBWTtBQUtwQixXQUxRLFlBQVksQ0FLbkIsTUFBa0IsRUFBRTs7OzBCQUxiLFlBQVk7O0FBTTdCLFFBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN4QyxZQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUE7S0FDM0Q7QUFDRCxRQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUE7QUFDdkMsUUFBTSxhQUFhLEdBQUcsaUNBQ3BCLFlBQU07QUFDSixZQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3hDLEVBQ0QsRUFBRSxFQUNGLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUNsQixDQUFBOztBQUVELFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0FBQ3BCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQzthQUFNLE1BQUssT0FBTyxFQUFFO0tBQUEsQ0FBQyxDQUFDLENBQUE7OztBQUd0RSxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFBOztBQUU1RCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7OztBQUcvRCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsa0NBQW9CLElBQUksQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUUsVUFBQSxRQUFRO2FBQ3RFLFlBQVksQ0FBQyxXQUFXLENBQ3RCLGlDQUFTLFlBQU07QUFDYixjQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO09BQ3ZDLEVBQUUsUUFBUSxDQUFDLENBQ2I7S0FBQSxDQUNGLENBQ0YsQ0FBQTtHQUNGOztlQXZDa0IsWUFBWTs7V0F3Q3RCLHFCQUFlO0FBQ3RCLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQTtLQUNuQjs7O1dBQ0csZ0JBQTRCO1VBQTNCLFFBQWlCLHlEQUFHLEtBQUs7O0FBQzVCLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUMzQzs7O1dBQ1csc0JBQUMsUUFBa0IsRUFBYztBQUMzQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNoRDs7O1dBQ1csc0JBQUMsUUFBa0IsRUFBYztBQUMzQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNoRDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzVCLFVBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDdkI7OztTQXhEa0IsWUFBWTs7O3FCQUFaLFlBQVkiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2VkaXRvci1saW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBkZWJvdW5jZSBmcm9tICdsb2Rhc2gvZGVib3VuY2UnXG5pbXBvcnQgdHlwZSB7IFRleHRFZGl0b3IgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgc3Vic2NyaXB0aXZlT2JzZXJ2ZSB9IGZyb20gJy4vaGVscGVycydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yTGludGVyIHtcbiAgZWRpdG9yOiBUZXh0RWRpdG9yXG4gIGVtaXR0ZXI6IEVtaXR0ZXJcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGNvbnN0cnVjdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGlmICghYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRWRpdG9yTGludGVyIGV4cGVjdHMgYSB2YWxpZCBUZXh0RWRpdG9yJylcbiAgICB9XG4gICAgY29uc3QgZWRpdG9yQnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgY29uc3QgZGVib3VuY2VkTGludCA9IGRlYm91bmNlKFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLWxpbnQnLCBmYWxzZSlcbiAgICAgIH0sXG4gICAgICA1MCxcbiAgICAgIHsgbGVhZGluZzogdHJ1ZSB9LFxuICAgIClcblxuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yXG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHRoaXMuZGlzcG9zZSgpKSlcbiAgICAvLyBUaGlzIGRlYm91bmNpbmcgaXMgZm9yIGJlYXV0aWZpZXJzLCBpZiB0aGV5IGNoYW5nZSBjb250ZW50cyBvZiB0aGUgZWRpdG9yIGFuZCBzYXZlXG4gICAgLy8gTGludGVyIHNob3VsZCBjb3VudCB0aGF0IGdyb3VwIG9mIGV2ZW50cyBhcyBvbmUuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVkaXRvci5vbkRpZFNhdmUoZGVib3VuY2VkTGludCkpXG4gICAgLy8gVGhpcyBpcyB0byByZWxpbnQgaW4gY2FzZSBvZiBleHRlcm5hbCBjaGFuZ2VzIHRvIHRoZSBvcGVuZWQgZmlsZVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yQnVmZmVyLm9uRGlkUmVsb2FkKGRlYm91bmNlZExpbnQpKVxuICAgIC8vIE5PVEU6IFRleHRFZGl0b3I6Om9uRGlkQ2hhbmdlIGltbWVkaWF0ZWx5IGludm9rZXMgdGhlIGNhbGxiYWNrIGlmIHRoZSB0ZXh0IGVkaXRvciB3YXMgKmp1c3QqIGNyZWF0ZWRcbiAgICAvLyBVc2luZyBUZXh0QnVmZmVyOjpvbkRpZENoYW5nZSBkb2Vzbid0IGhhdmUgdGhlIHNhbWUgYmVoYXZpb3Igc28gdXNpbmcgaXQgaW5zdGVhZC5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgc3Vic2NyaXB0aXZlT2JzZXJ2ZShhdG9tLmNvbmZpZywgJ2xpbnRlci5saW50T25DaGFuZ2VJbnRlcnZhbCcsIGludGVydmFsID0+XG4gICAgICAgIGVkaXRvckJ1ZmZlci5vbkRpZENoYW5nZShcbiAgICAgICAgICBkZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLWxpbnQnLCB0cnVlKVxuICAgICAgICAgIH0sIGludGVydmFsKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKVxuICB9XG4gIGdldEVkaXRvcigpOiBUZXh0RWRpdG9yIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0b3JcbiAgfVxuICBsaW50KG9uQ2hhbmdlOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLWxpbnQnLCBvbkNoYW5nZSlcbiAgfVxuICBvblNob3VsZExpbnQoY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignc2hvdWxkLWxpbnQnLCBjYWxsYmFjaylcbiAgfVxuICBvbkRpZERlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIHRoaXMuZW1pdHRlci5kaXNwb3NlKClcbiAgfVxufVxuIl19