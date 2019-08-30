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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2VkaXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVvQyxNQUFNOztzQkFFdkIsVUFBVTs7Ozt1QkFDd0IsV0FBVzs7SUFHMUQsT0FBTztBQU1BLFdBTlAsT0FBTyxHQU1HOzs7MEJBTlYsT0FBTzs7QUFPVCxRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDeEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7QUFDdkIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFDLFVBQVUsRUFBSztBQUN2RSxZQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUMzQixDQUFDLENBQUMsQ0FBQTtBQUNILFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMscUJBQXFCLENBQUMsVUFBQyxRQUFRLEVBQUs7QUFDcEYsWUFBSyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQy9CLFlBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUU7QUFDbEMsZ0JBQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQTtTQUN2QjtPQUNGLENBQUMsQ0FBQTtLQUNILENBQUMsQ0FBQyxDQUFBO0dBQ0o7O2VBdEJHLE9BQU87O1dBdUJFLHlCQUFZO0FBQ3ZCLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQTtLQUN4Qjs7O1dBQ0ssZ0JBQUMsSUFBMkMsRUFBRTtVQUEzQyxRQUFRLEdBQVYsSUFBMkMsQ0FBekMsUUFBUTtVQUFFLEtBQUssR0FB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QUMsT0FBTyxFQUFFLENBQUE7S0FDN0I7OztTQTlFRyxPQUFPOzs7QUFpRmIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvZWRpdG9ycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBFZGl0b3IgZnJvbSAnLi9lZGl0b3InXG5pbXBvcnQgeyAkZmlsZSwgZ2V0RWRpdG9yc01hcCwgZmlsdGVyTWVzc2FnZXMgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UsIE1lc3NhZ2VzUGF0Y2ggfSBmcm9tICcuL3R5cGVzJ1xuXG5jbGFzcyBFZGl0b3JzIHtcbiAgZWRpdG9yczogU2V0PEVkaXRvcj47XG4gIG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPjtcbiAgZmlyc3RSZW5kZXI6IGJvb2w7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lZGl0b3JzID0gbmV3IFNldCgpXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5maXJzdFJlbmRlciA9IHRydWVcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygodGV4dEVkaXRvcikgPT4ge1xuICAgICAgdGhpcy5nZXRFZGl0b3IodGV4dEVkaXRvcilcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZUl0ZW0pID0+IHtcbiAgICAgIHRoaXMuZWRpdG9ycy5mb3JFYWNoKChlZGl0b3IpID0+IHtcbiAgICAgICAgaWYgKGVkaXRvci50ZXh0RWRpdG9yICE9PSBwYW5lSXRlbSkge1xuICAgICAgICAgIGVkaXRvci5yZW1vdmVUb29sdGlwKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KSlcbiAgfVxuICBpc0ZpcnN0UmVuZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmZpcnN0UmVuZGVyXG4gIH1cbiAgdXBkYXRlKHsgbWVzc2FnZXMsIGFkZGVkLCByZW1vdmVkIH06IE1lc3NhZ2VzUGF0Y2gpIHtcbiAgICB0aGlzLm1lc3NhZ2VzID0gbWVzc2FnZXNcbiAgICB0aGlzLmZpcnN0UmVuZGVyID0gZmFsc2VcblxuICAgIGNvbnN0IHsgZWRpdG9yc01hcCwgZmlsZVBhdGhzIH0gPSBnZXRFZGl0b3JzTWFwKHRoaXMpXG4gICAgYWRkZWQuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9ICRmaWxlKG1lc3NhZ2UpXG4gICAgICBpZiAoZmlsZVBhdGggJiYgZWRpdG9yc01hcFtmaWxlUGF0aF0pIHtcbiAgICAgICAgZWRpdG9yc01hcFtmaWxlUGF0aF0uYWRkZWQucHVzaChtZXNzYWdlKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmVtb3ZlZC5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gJGZpbGUobWVzc2FnZSlcbiAgICAgIGlmIChmaWxlUGF0aCAmJiBlZGl0b3JzTWFwW2ZpbGVQYXRoXSkge1xuICAgICAgICBlZGl0b3JzTWFwW2ZpbGVQYXRoXS5yZW1vdmVkLnB1c2gobWVzc2FnZSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZmlsZVBhdGhzLmZvckVhY2goZnVuY3Rpb24oZmlsZVBhdGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZWRpdG9yc01hcFtmaWxlUGF0aF1cbiAgICAgIGlmICh2YWx1ZS5hZGRlZC5sZW5ndGggfHwgdmFsdWUucmVtb3ZlZC5sZW5ndGgpIHtcbiAgICAgICAgdmFsdWUuZWRpdG9ycy5mb3JFYWNoKGVkaXRvciA9PiBlZGl0b3IuYXBwbHkodmFsdWUuYWRkZWQsIHZhbHVlLnJlbW92ZWQpKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgZ2V0RWRpdG9yKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpOiBFZGl0b3Ige1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lZGl0b3JzKSB7XG4gICAgICBpZiAoZW50cnkudGV4dEVkaXRvciA9PT0gdGV4dEVkaXRvcikge1xuICAgICAgICByZXR1cm4gZW50cnlcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZWRpdG9yID0gbmV3IEVkaXRvcih0ZXh0RWRpdG9yKVxuICAgIHRoaXMuZWRpdG9ycy5hZGQoZWRpdG9yKVxuICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5lZGl0b3JzLmRlbGV0ZShlZGl0b3IpXG4gICAgfSlcbiAgICBlZGl0b3Iuc3Vic2NyaXB0aW9ucy5hZGQodGV4dEVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xuICAgICAgZWRpdG9yLmRpc3Bvc2UoKVxuICAgICAgdGhpcy5nZXRFZGl0b3IodGV4dEVkaXRvcilcbiAgICB9KSlcbiAgICBlZGl0b3Iuc3Vic2NyaXB0aW9ucy5hZGQodGV4dEVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKCkgPT4ge1xuICAgICAgZWRpdG9yLmRpc3Bvc2UoKVxuICAgICAgdGhpcy5nZXRFZGl0b3IodGV4dEVkaXRvcilcbiAgICB9KSlcbiAgICBlZGl0b3IuYXBwbHkoZmlsdGVyTWVzc2FnZXModGhpcy5tZXNzYWdlcywgdGV4dEVkaXRvci5nZXRQYXRoKCkpLCBbXSlcbiAgICByZXR1cm4gZWRpdG9yXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZWRpdG9ycykge1xuICAgICAgZW50cnkuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvcnNcbiJdfQ==