Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsEvents = require('./atom-ternjs-events');

var _atomTernjsEvents2 = _interopRequireDefault(_atomTernjsEvents);

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _atomTernjsHelper2 = require('././atom-ternjs-helper');

var _servicesDebug = require('./services/debug');

var _servicesDebug2 = _interopRequireDefault(_servicesDebug);

'use babel';

var DocumentationView = require('./atom-ternjs-documentation-view');

var Documentation = (function () {
  function Documentation() {
    _classCallCheck(this, Documentation);

    this.disposable = null;
    this.disposables = [];

    this.view = null;
    this.overlayDecoration = null;
    this.destroyDocumenationListener = this.destroyOverlay.bind(this);
  }

  _createClass(Documentation, [{
    key: 'init',
    value: function init() {

      this.view = new DocumentationView();
      this.view.initialize(this);

      atom.views.getView(atom.workspace).appendChild(this.view);

      _atomTernjsEvents2['default'].on('documentation-destroy-overlay', this.destroyDocumenationListener);
      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:documentation', this.request.bind(this)));
    }
  }, {
    key: 'request',
    value: function request() {
      var _this = this;

      this.destroyOverlay();
      var editor = atom.workspace.getActiveTextEditor();

      if (!editor || !_atomTernjsManager2['default'].client) {

        return;
      }

      var cursor = editor.getLastCursor();
      var position = cursor.getBufferPosition();

      _atomTernjsManager2['default'].client.update(editor).then(function (data) {

        _atomTernjsManager2['default'].client.documentation(atom.project.relativizePath(editor.getURI())[1], {

          line: position.row,
          ch: position.column

        }).then(function (data) {

          if (!data) {

            return;
          }

          _this.view.setData({

            doc: (0, _atomTernjsHelper2.replaceTags)(data.doc),
            origin: data.origin,
            type: (0, _atomTernjsHelper2.formatType)(data),
            url: data.url || ''
          });

          _this.show();
        });
      })['catch'](_servicesDebug2['default'].handleCatch);
    }
  }, {
    key: 'show',
    value: function show() {

      var editor = atom.workspace.getActiveTextEditor();

      if (!editor) {

        return;
      }

      var marker = editor.getLastCursor && editor.getLastCursor().getMarker();

      if (!marker) {

        return;
      }

      this.disposable = editor.onDidChangeCursorPosition(this.destroyDocumenationListener);

      this.overlayDecoration = editor.decorateMarker(marker, {

        type: 'overlay',
        item: this.view,
        'class': 'atom-ternjs-documentation',
        position: 'tale',
        invalidate: 'touch'
      });
    }
  }, {
    key: 'destroyOverlay',
    value: function destroyOverlay() {

      this.disposable && this.disposable.dispose();

      if (this.overlayDecoration) {

        this.overlayDecoration.destroy();
      }

      this.overlayDecoration = null;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      _atomTernjsEvents2['default'].off('documentation-destroy-overlay', this.destroyDocumenationListener);

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];

      this.destroyOverlay();

      if (this.view) {

        this.view.destroy();
        this.view = null;
      }
    }
  }]);

  return Documentation;
})();

exports['default'] = new Documentation();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7aUNBSW9CLHVCQUF1Qjs7OztnQ0FDdkIsc0JBQXNCOzs7O2dDQUNqQixzQkFBc0I7O2lDQUl4Qyx3QkFBd0I7OzZCQUNiLGtCQUFrQjs7OztBQVhwQyxXQUFXLENBQUM7O0FBRVosSUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQzs7SUFXaEUsYUFBYTtBQUVOLFdBRlAsYUFBYSxHQUVIOzBCQUZWLGFBQWE7O0FBSWYsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsUUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXRCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDOUIsUUFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQ25FOztlQVZHLGFBQWE7O1dBWWIsZ0JBQUc7O0FBRUwsVUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7QUFDcEMsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTNCLFVBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUUxRCxvQ0FBUSxFQUFFLENBQUMsK0JBQStCLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDOUUsVUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQWtC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QUcsRUFBRSxDQUFDOztBQUV0QixVQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRXRCLFVBQUksSUFBSSxDQUFDLElBQUksRUFBRTs7QUFFYixZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO09BQ2xCO0tBQ0Y7OztTQXpIRyxhQUFhOzs7cUJBNEhKLElBQUksYUFBYSxFQUFFIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IERvY3VtZW50YXRpb25WaWV3ID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uLXZpZXcnKTtcblxuaW1wb3J0IG1hbmFnZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1tYW5hZ2VyJztcbmltcG9ydCBlbWl0dGVyIGZyb20gJy4vYXRvbS10ZXJuanMtZXZlbnRzJztcbmltcG9ydCB7ZGlzcG9zZUFsbH0gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuaW1wb3J0IHtcbiAgcmVwbGFjZVRhZ3MsXG4gIGZvcm1hdFR5cGVcbn0gZnJvbSAnLi8uL2F0b20tdGVybmpzLWhlbHBlcic7XG5pbXBvcnQgZGVidWcgZnJvbSAnLi9zZXJ2aWNlcy9kZWJ1Zyc7XG5cbmNsYXNzIERvY3VtZW50YXRpb24ge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlID0gbnVsbDtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG5cbiAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgIHRoaXMub3ZlcmxheURlY29yYXRpb24gPSBudWxsO1xuICAgIHRoaXMuZGVzdHJveURvY3VtZW5hdGlvbkxpc3RlbmVyID0gdGhpcy5kZXN0cm95T3ZlcmxheS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIHRoaXMudmlldyA9IG5ldyBEb2N1bWVudGF0aW9uVmlldygpO1xuICAgIHRoaXMudmlldy5pbml0aWFsaXplKHRoaXMpO1xuXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5hcHBlbmRDaGlsZCh0aGlzLnZpZXcpO1xuXG4gICAgZW1pdHRlci5vbignZG9jdW1lbnRhdGlvbi1kZXN0cm95LW92ZXJsYXknLCB0aGlzLmRlc3Ryb3lEb2N1bWVuYXRpb25MaXN0ZW5lcik7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOmRvY3VtZW50YXRpb24nLCB0aGlzLnJlcXVlc3QuYmluZCh0aGlzKSkpO1xuICB9XG5cbiAgcmVxdWVzdCgpIHtcblxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcbiAgICBsZXQgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuXG4gICAgaWYgKFxuICAgICAgIWVkaXRvciB8fFxuICAgICAgIW1hbmFnZXIuY2xpZW50XG4gICAgKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgY3Vyc29yID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKTtcbiAgICBsZXQgcG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKTtcblxuICAgIG1hbmFnZXIuY2xpZW50LnVwZGF0ZShlZGl0b3IpLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgbWFuYWdlci5jbGllbnQuZG9jdW1lbnRhdGlvbihhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZWRpdG9yLmdldFVSSSgpKVsxXSwge1xuXG4gICAgICAgIGxpbmU6IHBvc2l0aW9uLnJvdyxcbiAgICAgICAgY2g6IHBvc2l0aW9uLmNvbHVtblxuXG4gICAgICB9KS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZpZXcuc2V0RGF0YSh7XG5cbiAgICAgICAgICBkb2M6IHJlcGxhY2VUYWdzKGRhdGEuZG9jKSxcbiAgICAgICAgICBvcmlnaW46IGRhdGEub3JpZ2luLFxuICAgICAgICAgIHR5cGU6IGZvcm1hdFR5cGUoZGF0YSksXG4gICAgICAgICAgdXJsOiBkYXRhLnVybCB8fCAnJ1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgLmNhdGNoKGRlYnVnLmhhbmRsZUNhdGNoKTtcbiAgfVxuXG4gIHNob3coKSB7XG5cbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICBpZiAoIWVkaXRvcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldExhc3RDdXJzb3IgJiYgZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRNYXJrZXIoKTtcblxuICAgIGlmICghbWFya2VyKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3Bvc2FibGUgPSBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbih0aGlzLmRlc3Ryb3lEb2N1bWVuYXRpb25MaXN0ZW5lcik7XG5cbiAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge1xuXG4gICAgICB0eXBlOiAnb3ZlcmxheScsXG4gICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICBjbGFzczogJ2F0b20tdGVybmpzLWRvY3VtZW50YXRpb24nLFxuICAgICAgcG9zaXRpb246ICd0YWxlJyxcbiAgICAgIGludmFsaWRhdGU6ICd0b3VjaCdcbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3lPdmVybGF5KCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlICYmIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG5cbiAgICBpZiAodGhpcy5vdmVybGF5RGVjb3JhdGlvbikge1xuXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gbnVsbDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG5cbiAgICBlbWl0dGVyLm9mZignZG9jdW1lbnRhdGlvbi1kZXN0cm95LW92ZXJsYXknLCB0aGlzLmRlc3Ryb3lEb2N1bWVuYXRpb25MaXN0ZW5lcik7XG5cbiAgICBkaXNwb3NlQWxsKHRoaXMuZGlzcG9zYWJsZXMpO1xuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXTtcblxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcblxuICAgIGlmICh0aGlzLnZpZXcpIHtcblxuICAgICAgdGhpcy52aWV3LmRlc3Ryb3koKTtcbiAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBEb2N1bWVudGF0aW9uKCk7XG4iXX0=