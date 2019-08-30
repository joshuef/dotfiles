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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _underscorePlus = require('underscore-plus');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atom = require('atom');

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _servicesNavigation = require('./services/navigation');

var _servicesNavigation2 = _interopRequireDefault(_servicesNavigation);

var _servicesDebug = require('./services/debug');

var _servicesDebug2 = _interopRequireDefault(_servicesDebug);

'use babel';

var ReferenceView = require('./atom-ternjs-reference-view');

var Reference = (function () {
  function Reference() {
    _classCallCheck(this, Reference);

    this.disposables = [];
    this.references = [];

    this.referenceView = null;
    this.referencePanel = null;

    this.hideHandler = this.hide.bind(this);
    this.findReferenceListener = this.findReference.bind(this);
  }

  _createClass(Reference, [{
    key: 'init',
    value: function init() {

      this.referenceView = new ReferenceView();
      this.referenceView.initialize(this);

      this.referencePanel = atom.workspace.addBottomPanel({

        item: this.referenceView,
        priority: 0,
        visible: false
      });

      atom.views.getView(this.referencePanel).classList.add('atom-ternjs-reference-panel', 'panel-bottom');

      _atomTernjsEvents2['default'].on('reference-hide', this.hideHandler);

      this.registerCommands();
    }
  }, {
    key: 'registerCommands',
    value: function registerCommands() {

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:references', this.findReferenceListener));
    }
  }, {
    key: 'goToReference',
    value: function goToReference(idx) {

      var ref = this.references.refs[idx];

      if (_servicesNavigation2['default'].set(ref)) {

        (0, _atomTernjsHelper.openFileAndGoTo)(ref.start, ref.file);
      }
    }
  }, {
    key: 'findReference',
    value: function findReference() {
      var _this = this;

      var editor = atom.workspace.getActiveTextEditor();
      var cursor = editor.getLastCursor();

      if (!_atomTernjsManager2['default'].client || !editor || !cursor) {

        return;
      }

      var position = cursor.getBufferPosition();

      _atomTernjsManager2['default'].client.update(editor).then(function (data) {
        _atomTernjsManager2['default'].client.refs(atom.project.relativizePath(editor.getURI())[1], { line: position.row, ch: position.column }).then(function (data) {

          if (!data) {

            atom.notifications.addInfo('No references found.', { dismissable: false });

            return;
          }

          _this.references = data;

          for (var reference of data.refs) {

            reference.file = reference.file.replace(/^.\//, '');
            reference.file = _path2['default'].resolve(atom.project.relativizePath(_atomTernjsManager2['default'].server.projectDir)[0], reference.file);
          }

          data.refs = (0, _underscorePlus.uniq)(data.refs, function (item) {

            return JSON.stringify(item);
          });

          data = _this.gatherMeta(data);
          _this.referenceView.buildItems(data);
          _this.referencePanel.show();
        })['catch'](_servicesDebug2['default'].handleCatchWithNotification);
      })['catch'](_servicesDebug2['default'].handleCatch);
    }
  }, {
    key: 'gatherMeta',
    value: function gatherMeta(data) {

      for (var item of data.refs) {

        var content = _fs2['default'].readFileSync(item.file, 'utf8');
        var buffer = new _atom.TextBuffer({ text: content });

        item.position = buffer.positionForCharacterIndex(item.start);
        item.lineText = buffer.lineForRow(item.position.row);

        buffer.destroy();
      }

      return data;
    }
  }, {
    key: 'hide',
    value: function hide() {

      this.referencePanel && this.referencePanel.hide();

      (0, _atomTernjsHelper.focusEditor)();
    }
  }, {
    key: 'show',
    value: function show() {

      this.referencePanel.show();
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      _atomTernjsEvents2['default'].off('reference-hide', this.hideHandler);

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];
      this.references = [];

      this.referenceView && this.referenceView.destroy();
      this.referenceView = null;

      this.referencePanel && this.referencePanel.destroy();
      this.referencePanel = null;
    }
  }]);

  return Reference;
})();

exports['default'] = new Reference();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1yZWZlcmVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztpQ0FJb0IsdUJBQXVCOzs7O2dDQUN2QixzQkFBc0I7Ozs7a0JBQzNCLElBQUk7Ozs7OEJBQ0EsaUJBQWlCOztvQkFDbkIsTUFBTTs7OztvQkFDRSxNQUFNOztnQ0FLeEIsc0JBQXNCOztrQ0FDTix1QkFBdUI7Ozs7NkJBQzVCLGtCQUFrQjs7OztBQWhCcEMsV0FBVyxDQUFDOztBQUVaLElBQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDOztJQWdCeEQsU0FBUztBQUVGLFdBRlAsU0FBUyxHQUVDOzBCQUZWLFNBQVM7O0FBSVgsUUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7O0FBRXJCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQzFCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDOztBQUUzQixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hDLFFBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUM1RDs7ZUFaRyxTQUFTOztXQWNULGdCQUFHOztBQUVMLFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUN6QyxVQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFcEMsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQzs7QUFFbEQsWUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhO0FBQ3hCLGdCQUFRLEVBQUUsQ0FB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QUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkQsVUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7O0FBRTFCLFVBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyRCxVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztLQUM1Qjs7O1NBeklHLFNBQVM7OztxQkE0SUEsSUFBSSxTQUFTLEVBQUUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXJlZmVyZW5jZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5jb25zdCBSZWZlcmVuY2VWaWV3ID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1yZWZlcmVuY2UtdmlldycpO1xuXG5pbXBvcnQgbWFuYWdlciBmcm9tICcuL2F0b20tdGVybmpzLW1hbmFnZXInO1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1ldmVudHMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7dW5pcX0gZnJvbSAndW5kZXJzY29yZS1wbHVzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtUZXh0QnVmZmVyfSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIGRpc3Bvc2VBbGwsXG4gIG9wZW5GaWxlQW5kR29UbyxcbiAgZm9jdXNFZGl0b3Jcbn0gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuaW1wb3J0IG5hdmlnYXRpb24gZnJvbSAnLi9zZXJ2aWNlcy9uYXZpZ2F0aW9uJztcbmltcG9ydCBkZWJ1ZyBmcm9tICcuL3NlcnZpY2VzL2RlYnVnJztcblxuY2xhc3MgUmVmZXJlbmNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXTtcbiAgICB0aGlzLnJlZmVyZW5jZXMgPSBbXTtcblxuICAgIHRoaXMucmVmZXJlbmNlVmlldyA9IG51bGw7XG4gICAgdGhpcy5yZWZlcmVuY2VQYW5lbCA9IG51bGw7XG5cbiAgICB0aGlzLmhpZGVIYW5kbGVyID0gdGhpcy5oaWRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5maW5kUmVmZXJlbmNlTGlzdGVuZXIgPSB0aGlzLmZpbmRSZWZlcmVuY2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIGluaXQoKSB7XG5cbiAgICB0aGlzLnJlZmVyZW5jZVZpZXcgPSBuZXcgUmVmZXJlbmNlVmlldygpO1xuICAgIHRoaXMucmVmZXJlbmNlVmlldy5pbml0aWFsaXplKHRoaXMpO1xuXG4gICAgdGhpcy5yZWZlcmVuY2VQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHtcblxuICAgICAgaXRlbTogdGhpcy5yZWZlcmVuY2VWaWV3LFxuICAgICAgcHJpb3JpdHk6IDAsXG4gICAgICB2aXNpYmxlOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMucmVmZXJlbmNlUGFuZWwpLmNsYXNzTGlzdC5hZGQoJ2F0b20tdGVybmpzLXJlZmVyZW5jZS1wYW5lbCcsICdwYW5lbC1ib3R0b20nKTtcblxuICAgIGVtaXR0ZXIub24oJ3JlZmVyZW5jZS1oaWRlJywgdGhpcy5oaWRlSGFuZGxlcik7XG5cbiAgICB0aGlzLnJlZ2lzdGVyQ29tbWFuZHMoKTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZHMoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnYXRvbS10ZXJuanM6cmVmZXJlbmNlcycsIHRoaXMuZmluZFJlZmVyZW5jZUxpc3RlbmVyKSk7XG4gIH1cblxuICBnb1RvUmVmZXJlbmNlKGlkeCkge1xuXG4gICAgY29uc3QgcmVmID0gdGhpcy5yZWZlcmVuY2VzLnJlZnNbaWR4XTtcblxuICAgIGlmIChuYXZpZ2F0aW9uLnNldChyZWYpKSB7XG5cbiAgICAgIG9wZW5GaWxlQW5kR29UbyhyZWYuc3RhcnQsIHJlZi5maWxlKTtcbiAgICB9XG4gIH1cblxuICBmaW5kUmVmZXJlbmNlKCkge1xuXG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG5cbiAgICBpZiAoXG4gICAgICAhbWFuYWdlci5jbGllbnQgfHxcbiAgICAgICFlZGl0b3IgfHxcbiAgICAgICFjdXJzb3JcbiAgICApIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICBtYW5hZ2VyLmNsaWVudC51cGRhdGUoZWRpdG9yKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtYW5hZ2VyLmNsaWVudC5yZWZzKGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpWzFdLCB7bGluZTogcG9zaXRpb24ucm93LCBjaDogcG9zaXRpb24uY29sdW1ufSkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgIGlmICghZGF0YSkge1xuXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ05vIHJlZmVyZW5jZXMgZm91bmQuJywgeyBkaXNtaXNzYWJsZTogZmFsc2UgfSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZmVyZW5jZXMgPSBkYXRhO1xuXG4gICAgICAgIGZvciAobGV0IHJlZmVyZW5jZSBvZiBkYXRhLnJlZnMpIHtcblxuICAgICAgICAgIHJlZmVyZW5jZS5maWxlID0gcmVmZXJlbmNlLmZpbGUucmVwbGFjZSgvXi5cXC8vLCAnJyk7XG4gICAgICAgICAgcmVmZXJlbmNlLmZpbGUgPSBwYXRoLnJlc29sdmUoYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKG1hbmFnZXIuc2VydmVyLnByb2plY3REaXIpWzBdLCByZWZlcmVuY2UuZmlsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnJlZnMgPSB1bmlxKGRhdGEucmVmcywgKGl0ZW0pID0+IHtcblxuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShpdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGF0YSA9IHRoaXMuZ2F0aGVyTWV0YShkYXRhKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VWaWV3LmJ1aWxkSXRlbXMoZGF0YSk7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlUGFuZWwuc2hvdygpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChkZWJ1Zy5oYW5kbGVDYXRjaFdpdGhOb3RpZmljYXRpb24pO1xuICAgIH0pXG4gICAgLmNhdGNoKGRlYnVnLmhhbmRsZUNhdGNoKTtcbiAgfVxuXG4gIGdhdGhlck1ldGEoZGF0YSkge1xuXG4gICAgZm9yIChsZXQgaXRlbSBvZiBkYXRhLnJlZnMpIHtcblxuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhpdGVtLmZpbGUsICd1dGY4Jyk7XG4gICAgICBjb25zdCBidWZmZXIgPSBuZXcgVGV4dEJ1ZmZlcih7IHRleHQ6IGNvbnRlbnQgfSk7XG5cbiAgICAgIGl0ZW0ucG9zaXRpb24gPSBidWZmZXIucG9zaXRpb25Gb3JDaGFyYWN0ZXJJbmRleChpdGVtLnN0YXJ0KTtcbiAgICAgIGl0ZW0ubGluZVRleHQgPSBidWZmZXIubGluZUZvclJvdyhpdGVtLnBvc2l0aW9uLnJvdyk7XG5cbiAgICAgIGJ1ZmZlci5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBoaWRlKCkge1xuXG4gICAgdGhpcy5yZWZlcmVuY2VQYW5lbCAmJiB0aGlzLnJlZmVyZW5jZVBhbmVsLmhpZGUoKTtcblxuICAgIGZvY3VzRWRpdG9yKCk7XG4gIH1cblxuICBzaG93KCkge1xuXG4gICAgdGhpcy5yZWZlcmVuY2VQYW5lbC5zaG93KCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZW1pdHRlci5vZmYoJ3JlZmVyZW5jZS1oaWRlJywgdGhpcy5oaWRlSGFuZGxlcik7XG5cbiAgICBkaXNwb3NlQWxsKHRoaXMuZGlzcG9zYWJsZXMpO1xuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXTtcbiAgICB0aGlzLnJlZmVyZW5jZXMgPSBbXTtcblxuICAgIHRoaXMucmVmZXJlbmNlVmlldyAmJiB0aGlzLnJlZmVyZW5jZVZpZXcuZGVzdHJveSgpO1xuICAgIHRoaXMucmVmZXJlbmNlVmlldyA9IG51bGw7XG5cbiAgICB0aGlzLnJlZmVyZW5jZVBhbmVsICYmIHRoaXMucmVmZXJlbmNlUGFuZWwuZGVzdHJveSgpO1xuICAgIHRoaXMucmVmZXJlbmNlUGFuZWwgPSBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBSZWZlcmVuY2UoKTtcbiJdfQ==