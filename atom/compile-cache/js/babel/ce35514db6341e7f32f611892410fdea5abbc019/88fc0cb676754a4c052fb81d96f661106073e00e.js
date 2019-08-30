var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _helpers = require('./helpers');

var Editors = (function () {
  function Editors() {
    var _this = this;

    _classCallCheck(this, Editors);

    this.editors = new Set();
    this.messages = [];
    this.firstRender = true;
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(atom.workspace.observeTextEditors(function (textEditor) {
      _this.getEditor(textEditor);
    }));
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(function (paneItem) {
      _this.editors.forEach(function (editor) {
        if (editor.textEditor !== paneItem) {
          editor.removeTooltip();
        }
      });
    }));
  }

  _createClass(Editors, [{
    key: 'isFirstRender',
    value: function isFirstRender() {
      return this.firstRender;
    }
  }, {
    key: 'update',
    value: function update(_ref) {
      var messages = _ref.messages;
      var added = _ref.added;
      var removed = _ref.removed;

      this.messages = messages;
      this.firstRender = false;

      var _getEditorsMap = (0, _helpers.getEditorsMap)(this);

      var editorsMap = _getEditorsMap.editorsMap;
      var filePaths = _getEditorsMap.filePaths;

      added.forEach(function (message) {
        var filePath = (0, _helpers.$file)(message);
        if (filePath && editorsMap[filePath]) {
          editorsMap[filePath].added.push(message);
        }
      });
      removed.forEach(function (message) {
        var filePath = (0, _helpers.$file)(message);
        if (filePath && editorsMap[filePath]) {
          editorsMap[filePath].removed.push(message);
        }
      });

      filePaths.forEach(function (filePath) {
        var value = editorsMap[filePath];
        if (value.added.length || value.removed.length) {
          value.editors.forEach(function (editor) {
            return editor.apply(value.added, value.removed);
          });
        }
      });
    }
  }, {
    key: 'getEditor',
    value: function getEditor(textEditor) {
      var _this2 = this;

      for (var entry of this.editors) {
        if (entry.textEditor === textEditor) {
          return entry;
        }
      }
      var editor = new _editor2['default'](textEditor);
      this.editors.add(editor);
      editor.onDidDestroy(function () {
        _this2.editors['delete'](editor);
      });
      editor.subscriptions.add(textEditor.onDidChangePath(function () {
        editor.dispose();
        _this2.getEditor(textEditor);
      }));
      editor.subscriptions.add(textEditor.onDidChangeGrammar(function () {
        editor.dispose();
        _this2.getEditor(textEditor);
      }));
      editor.apply((0, _helpers.filterMessages)(this.messages, textEditor.getPath()), []);
      return editor;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      for (var entry of this.editors) {
        entry.dispose();
      }
      this.subscriptions.dispose();
    }
  }]);

  return Editors;
})();

module.exports = Editors;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2VkaXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVvQyxNQUFNOztzQkFFdkIsVUFBVTs7Ozt1QkFDd0IsV0FBVzs7SUFHMUQsT0FBTztBQU1BLFdBTlAsT0FBTyxHQU1HOzs7MEJBTlYsT0FBTzs7QUFPVCxRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDeEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7QUFDdkIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsVUFBQSxVQUFVLEVBQUk7QUFDOUMsWUFBSyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7S0FDM0IsQ0FBQyxDQUNILENBQUE7QUFDRCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFBLFFBQVEsRUFBSTtBQUMzRCxZQUFLLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQSxNQUFNLEVBQUk7QUFDN0IsWUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRTtBQUNsQyxnQkFBTSxDQUFDLGFBQWEsRUFBRSxDQUFBO1NBQ3ZCO09BQ0YsQ0FBQyxDQUFBO0tBQ0gsQ0FBQyxDQUNILENBQUE7R0FDRjs7ZUExQkcsT0FBTzs7V0EyQkUseUJBQVk7QUFDdkIsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFBO0tBQ3hCOzs7V0FDSyxnQkFBQyxJQUEyQyxFQUFFO1VBQTNDLFFBQVEsR0FBVixJQUEyQyxDQUF6QyxRQUFRO1VBQUUsS0FBSyxH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YSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0F0RkcsT0FBTzs7O0FBeUZiLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2VkaXRvcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIHsgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgRWRpdG9yIGZyb20gJy4vZWRpdG9yJ1xuaW1wb3J0IHsgJGZpbGUsIGdldEVkaXRvcnNNYXAsIGZpbHRlck1lc3NhZ2VzIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXJNZXNzYWdlLCBNZXNzYWdlc1BhdGNoIH0gZnJvbSAnLi90eXBlcydcblxuY2xhc3MgRWRpdG9ycyB7XG4gIGVkaXRvcnM6IFNldDxFZGl0b3I+XG4gIG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPlxuICBmaXJzdFJlbmRlcjogYm9vbGVhblxuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lZGl0b3JzID0gbmV3IFNldCgpXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5maXJzdFJlbmRlciA9IHRydWVcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKHRleHRFZGl0b3IgPT4ge1xuICAgICAgICB0aGlzLmdldEVkaXRvcih0ZXh0RWRpdG9yKVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0ocGFuZUl0ZW0gPT4ge1xuICAgICAgICB0aGlzLmVkaXRvcnMuZm9yRWFjaChlZGl0b3IgPT4ge1xuICAgICAgICAgIGlmIChlZGl0b3IudGV4dEVkaXRvciAhPT0gcGFuZUl0ZW0pIHtcbiAgICAgICAgICAgIGVkaXRvci5yZW1vdmVUb29sdGlwKClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KSxcbiAgICApXG4gIH1cbiAgaXNGaXJzdFJlbmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5maXJzdFJlbmRlclxuICB9XG4gIHVwZGF0ZSh7IG1lc3NhZ2VzLCBhZGRlZCwgcmVtb3ZlZCB9OiBNZXNzYWdlc1BhdGNoKSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IG1lc3NhZ2VzXG4gICAgdGhpcy5maXJzdFJlbmRlciA9IGZhbHNlXG5cbiAgICBjb25zdCB7IGVkaXRvcnNNYXAsIGZpbGVQYXRocyB9ID0gZ2V0RWRpdG9yc01hcCh0aGlzKVxuICAgIGFkZGVkLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgY29uc3QgZmlsZVBhdGggPSAkZmlsZShtZXNzYWdlKVxuICAgICAgaWYgKGZpbGVQYXRoICYmIGVkaXRvcnNNYXBbZmlsZVBhdGhdKSB7XG4gICAgICAgIGVkaXRvcnNNYXBbZmlsZVBhdGhdLmFkZGVkLnB1c2gobWVzc2FnZSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJlbW92ZWQuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9ICRmaWxlKG1lc3NhZ2UpXG4gICAgICBpZiAoZmlsZVBhdGggJiYgZWRpdG9yc01hcFtmaWxlUGF0aF0pIHtcbiAgICAgICAgZWRpdG9yc01hcFtmaWxlUGF0aF0ucmVtb3ZlZC5wdXNoKG1lc3NhZ2UpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGZpbGVQYXRocy5mb3JFYWNoKGZ1bmN0aW9uKGZpbGVQYXRoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGVkaXRvcnNNYXBbZmlsZVBhdGhdXG4gICAgICBpZiAodmFsdWUuYWRkZWQubGVuZ3RoIHx8IHZhbHVlLnJlbW92ZWQubGVuZ3RoKSB7XG4gICAgICAgIHZhbHVlLmVkaXRvcnMuZm9yRWFjaChlZGl0b3IgPT4gZWRpdG9yLmFwcGx5KHZhbHVlLmFkZGVkLCB2YWx1ZS5yZW1vdmVkKSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIGdldEVkaXRvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogRWRpdG9yIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZWRpdG9ycykge1xuICAgICAgaWYgKGVudHJ5LnRleHRFZGl0b3IgPT09IHRleHRFZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVkaXRvciA9IG5ldyBFZGl0b3IodGV4dEVkaXRvcilcbiAgICB0aGlzLmVkaXRvcnMuYWRkKGVkaXRvcilcbiAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMuZWRpdG9ycy5kZWxldGUoZWRpdG9yKVxuICAgIH0pXG4gICAgZWRpdG9yLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgdGV4dEVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xuICAgICAgICBlZGl0b3IuZGlzcG9zZSgpXG4gICAgICAgIHRoaXMuZ2V0RWRpdG9yKHRleHRFZGl0b3IpXG4gICAgICB9KSxcbiAgICApXG4gICAgZWRpdG9yLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgdGV4dEVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKCkgPT4ge1xuICAgICAgICBlZGl0b3IuZGlzcG9zZSgpXG4gICAgICAgIHRoaXMuZ2V0RWRpdG9yKHRleHRFZGl0b3IpXG4gICAgICB9KSxcbiAgICApXG4gICAgZWRpdG9yLmFwcGx5KGZpbHRlck1lc3NhZ2VzKHRoaXMubWVzc2FnZXMsIHRleHRFZGl0b3IuZ2V0UGF0aCgpKSwgW10pXG4gICAgcmV0dXJuIGVkaXRvclxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLmVkaXRvcnMpIHtcbiAgICAgIGVudHJ5LmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JzXG4iXX0=