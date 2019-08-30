Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _editorLinter = require('./editor-linter');

var _editorLinter2 = _interopRequireDefault(_editorLinter);

var EditorRegistry = (function () {
  function EditorRegistry() {
    var _this = this;

    _classCallCheck(this, EditorRegistry);

    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();
    this.editorLinters = new Map();

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.config.observe('linter.lintOnOpen', function (lintOnOpen) {
      _this.lintOnOpen = lintOnOpen;
    }));
  }

  _createClass(EditorRegistry, [{
    key: 'activate',
    value: function activate() {
      var _this2 = this;

      this.subscriptions.add(atom.workspace.observeTextEditors(function (textEditor) {
        _this2.createFromTextEditor(textEditor);
      }));
    }
  }, {
    key: 'get',
    value: function get(textEditor) {
      return this.editorLinters.get(textEditor);
    }
  }, {
    key: 'createFromTextEditor',
    value: function createFromTextEditor(textEditor) {
      var _this3 = this;

      var editorLinter = this.editorLinters.get(textEditor);
      if (editorLinter) {
        return editorLinter;
      }
      editorLinter = new _editorLinter2['default'](textEditor);
      editorLinter.onDidDestroy(function () {
        _this3.editorLinters['delete'](textEditor);
      });
      this.editorLinters.set(textEditor, editorLinter);
      this.emitter.emit('observe', editorLinter);
      if (this.lintOnOpen) {
        editorLinter.lint();
      }
      return editorLinter;
    }
  }, {
    key: 'hasSibling',
    value: function hasSibling(editorLinter) {
      var buffer = editorLinter.getEditor().getBuffer();

      return Array.from(this.editorLinters.keys()).some(function (item) {
        return item.getBuffer() === buffer;
      });
    }
  }, {
    key: 'observe',
    value: function observe(callback) {
      this.editorLinters.forEach(callback);
      return this.emitter.on('observe', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      for (var entry of this.editorLinters.values()) {
        entry.dispose();
      }
      this.subscriptions.dispose();
    }
  }]);

  return EditorRegistry;
})();

exports['default'] = EditorRegistry;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9lZGl0b3ItcmVnaXN0cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFNkMsTUFBTTs7NEJBRTFCLGlCQUFpQjs7OztJQUVwQyxjQUFjO0FBTVAsV0FOUCxjQUFjLEdBTUo7OzswQkFOVixjQUFjOztBQU9oQixRQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7O0FBRTlCLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNwQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsVUFBQSxVQUFVLEVBQUk7QUFDckQsWUFBSyxVQUFVLEdBQUcsVUFBVSxDQUFBO0tBQzdCLENBQUMsQ0FDSCxDQUFBO0dBQ0Y7O2VBakJHLGNBQWM7O1dBa0JWLG9CQUFHOzs7QUFDVCxVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUM5QyxlQUFLLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFBO09BQ3RDLENBQUMsQ0FDSCxDQUFBO0tBQ0Y7OztXQUNFLGFBQUMsVUFBc0IsRUFBaUI7QUFDekMsYUFBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUMxQzs7O1dBQ21CLDhCQUFDLFVBQXNCLEVBQWdCOzs7QUFDekQsVUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDckQsVUFBSSxZQUFZLEVBQUU7QUFDaEIsZUFBTyxZQUFZLENBQUE7T0FDcEI7QUFDRCxrQkFBWSxHQUFHLDhCQUFpQixVQUFVLENBQUMsQ0FBQTtBQUMzQyxrQkFBWSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQzlCLGVBQUssYUFBYSxVQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7T0FDdEMsQ0FBQyxDQUFBO0FBQ0YsVUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ2hELFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQTtBQUMxQyxVQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDbkIsb0JBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtPQUNwQjtBQUNELGFBQU8sWUFBWSxDQUFBO0tBQ3BCOzs7V0FDUyxvQkFBQyxZQUEwQixFQUFXO0FBQzlDLFVBQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQTs7QUFFbkQsYUFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxJQUFJO2VBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLE1BQU07T0FBQSxDQUFDLENBQUE7S0FDdkY7OztXQUNNLGlCQUFDLFFBQThDLEVBQWM7QUFDbEUsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDcEMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDNUM7OztXQUNNLG1CQUFHO0FBQ1IsV0FBSyxJQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFO0FBQy9DLGFBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNoQjtBQUNELFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDN0I7OztTQTFERyxjQUFjOzs7cUJBNkRMLGNBQWMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2VkaXRvci1yZWdpc3RyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IEVtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlLCBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBFZGl0b3JMaW50ZXIgZnJvbSAnLi9lZGl0b3ItbGludGVyJ1xuXG5jbGFzcyBFZGl0b3JSZWdpc3RyeSB7XG4gIGVtaXR0ZXI6IEVtaXR0ZXJcbiAgbGludE9uT3BlbjogYm9vbGVhblxuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gIGVkaXRvckxpbnRlcnM6IE1hcDxUZXh0RWRpdG9yLCBFZGl0b3JMaW50ZXI+XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmVkaXRvckxpbnRlcnMgPSBuZXcgTWFwKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXIubGludE9uT3BlbicsIGxpbnRPbk9wZW4gPT4ge1xuICAgICAgICB0aGlzLmxpbnRPbk9wZW4gPSBsaW50T25PcGVuXG4gICAgICB9KSxcbiAgICApXG4gIH1cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyh0ZXh0RWRpdG9yID0+IHtcbiAgICAgICAgdGhpcy5jcmVhdGVGcm9tVGV4dEVkaXRvcih0ZXh0RWRpdG9yKVxuICAgICAgfSksXG4gICAgKVxuICB9XG4gIGdldCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogP0VkaXRvckxpbnRlciB7XG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yTGludGVycy5nZXQodGV4dEVkaXRvcilcbiAgfVxuICBjcmVhdGVGcm9tVGV4dEVkaXRvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogRWRpdG9yTGludGVyIHtcbiAgICBsZXQgZWRpdG9yTGludGVyID0gdGhpcy5lZGl0b3JMaW50ZXJzLmdldCh0ZXh0RWRpdG9yKVxuICAgIGlmIChlZGl0b3JMaW50ZXIpIHtcbiAgICAgIHJldHVybiBlZGl0b3JMaW50ZXJcbiAgICB9XG4gICAgZWRpdG9yTGludGVyID0gbmV3IEVkaXRvckxpbnRlcih0ZXh0RWRpdG9yKVxuICAgIGVkaXRvckxpbnRlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5lZGl0b3JMaW50ZXJzLmRlbGV0ZSh0ZXh0RWRpdG9yKVxuICAgIH0pXG4gICAgdGhpcy5lZGl0b3JMaW50ZXJzLnNldCh0ZXh0RWRpdG9yLCBlZGl0b3JMaW50ZXIpXG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ29ic2VydmUnLCBlZGl0b3JMaW50ZXIpXG4gICAgaWYgKHRoaXMubGludE9uT3Blbikge1xuICAgICAgZWRpdG9yTGludGVyLmxpbnQoKVxuICAgIH1cbiAgICByZXR1cm4gZWRpdG9yTGludGVyXG4gIH1cbiAgaGFzU2libGluZyhlZGl0b3JMaW50ZXI6IEVkaXRvckxpbnRlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvckxpbnRlci5nZXRFZGl0b3IoKS5nZXRCdWZmZXIoKVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5lZGl0b3JMaW50ZXJzLmtleXMoKSkuc29tZShpdGVtID0+IGl0ZW0uZ2V0QnVmZmVyKCkgPT09IGJ1ZmZlcilcbiAgfVxuICBvYnNlcnZlKGNhbGxiYWNrOiAoZWRpdG9yTGludGVyOiBFZGl0b3JMaW50ZXIpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICB0aGlzLmVkaXRvckxpbnRlcnMuZm9yRWFjaChjYWxsYmFjaylcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdvYnNlcnZlJywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZWRpdG9yTGludGVycy52YWx1ZXMoKSkge1xuICAgICAgZW50cnkuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFZGl0b3JSZWdpc3RyeVxuIl19