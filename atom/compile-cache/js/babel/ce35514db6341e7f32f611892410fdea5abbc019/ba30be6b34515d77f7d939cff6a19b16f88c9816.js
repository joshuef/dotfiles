Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsPackageConfig = require('./atom-ternjs-package-config');

var _atomTernjsPackageConfig2 = _interopRequireDefault(_atomTernjsPackageConfig);

var _atomTernjsEvents = require('./atom-ternjs-events');

var _atomTernjsEvents2 = _interopRequireDefault(_atomTernjsEvents);

var _atom = require('atom');

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _underscorePlus = require('underscore-plus');

'use babel';

var TypeView = require('./atom-ternjs-type-view');
var TOLERANCE = 20;

var Type = (function () {
  function Type() {
    _classCallCheck(this, Type);

    this.view = null;
    this.overlayDecoration = null;

    this.currentRange = null;
    this.currentViewData = null;

    this.destroyOverlayListener = this.destroyOverlay.bind(this);
  }

  _createClass(Type, [{
    key: 'init',
    value: function init() {

      this.view = new TypeView();
      this.view.initialize(this);

      atom.views.getView(atom.workspace).appendChild(this.view);

      _atomTernjsEvents2['default'].on('type-destroy-overlay', this.destroyOverlayListener);
    }
  }, {
    key: 'setPosition',
    value: function setPosition() {

      if (this.overlayDecoration) {

        return;
      }

      var editor = atom.workspace.getActiveTextEditor();

      if (!editor) {

        return;
      }

      var marker = editor.getLastCursor().getMarker();

      if (!marker) {

        return;
      }

      this.overlayDecoration = editor.decorateMarker(marker, {

        type: 'overlay',
        item: this.view,
        'class': 'atom-ternjs-type',
        position: 'tale',
        invalidate: 'touch'
      });
    }
  }, {
    key: 'queryType',
    value: function queryType(editor, e) {
      var _this = this;

      var rowStart = 0;
      var rangeBefore = false;
      var tmp = false;
      var may = 0;
      var may2 = 0;
      var skipCounter = 0;
      var skipCounter2 = 0;
      var paramPosition = 0;
      var position = e.newBufferPosition;
      var buffer = editor.getBuffer();

      if (position.row - TOLERANCE < 0) {

        rowStart = 0;
      } else {

        rowStart = position.row - TOLERANCE;
      }

      buffer.backwardsScanInRange(/\]|\[|\(|\)|\,|\{|\}/g, new _atom.Range([rowStart, 0], [position.row, position.column]), function (obj) {

        var scopeDescriptor = editor.scopeDescriptorForBufferPosition([obj.range.start.row, obj.range.start.column]);

        if (scopeDescriptor.scopes.includes('string.quoted') || scopeDescriptor.scopes.includes('string.regexp')) {

          return;
        }

        if (obj.matchText === '}') {

          may++;
          return;
        }

        if (obj.matchText === ']') {

          if (!tmp) {

            skipCounter2++;
          }

          may2++;
          return;
        }

        if (obj.matchText === '{') {

          if (!may) {

            rangeBefore = false;
            obj.stop();

            return;
          }

          may--;
          return;
        }

        if (obj.matchText === '[') {

          if (skipCounter2) {

            skipCounter2--;
          }

          if (!may2) {

            rangeBefore = false;
            obj.stop();
            return;
          }

          may2--;
          return;
        }

        if (obj.matchText === ')' && !tmp) {

          skipCounter++;
          return;
        }

        if (obj.matchText === ',' && !skipCounter && !skipCounter2 && !may && !may2) {

          paramPosition++;
          return;
        }

        if (obj.matchText === ',') {

          return;
        }

        if (obj.matchText === '(' && skipCounter) {

          skipCounter--;
          return;
        }

        if (skipCounter || skipCounter2) {

          return;
        }

        if (obj.matchText === '(' && !tmp) {

          rangeBefore = obj.range;
          obj.stop();

          return;
        }

        tmp = obj.matchText;
      });

      if (!rangeBefore) {

        this.currentViewData = null;
        this.currentRange = null;
        this.destroyOverlay();

        return;
      }

      if (rangeBefore.isEqual(this.currentRange)) {

        this.currentViewData && this.setViewData(this.currentViewData, paramPosition);

        return;
      }

      this.currentRange = rangeBefore;
      this.currentViewData = null;
      this.destroyOverlay();

      _atomTernjsManager2['default'].client.update(editor).then(function () {

        _atomTernjsManager2['default'].client.type(editor, rangeBefore.start).then(function (data) {

          if (!data || !data.type.startsWith('fn') || !data.exprName) {

            return;
          }

          _this.currentViewData = data;

          _this.setViewData(data, paramPosition);
        })['catch'](function (error) {

          // most likely the type wasn't found. ignore it.
        });
      });
    }
  }, {
    key: 'setViewData',
    value: function setViewData(data, paramPosition) {

      var viewData = (0, _underscorePlus.deepClone)(data);
      var type = (0, _atomTernjsHelper.prepareType)(viewData);
      var params = (0, _atomTernjsHelper.extractParams)(type);
      (0, _atomTernjsHelper.formatType)(viewData);

      if (params && params[paramPosition]) {

        viewData.type = viewData.type.replace(params[paramPosition], '<span class="text-info">' + params[paramPosition] + '</span>');
      }

      if (viewData.doc && _atomTernjsPackageConfig2['default'].options.inlineFnCompletionDocumentation) {

        viewData.doc = viewData.doc && viewData.doc.replace(/(?:\r\n|\r|\n)/g, '<br />');
        viewData.doc = (0, _atomTernjsHelper.prepareInlineDocs)(viewData.doc);

        this.view.setData(viewData.type, viewData.doc);
      } else {

        this.view.setData(viewData.type);
      }

      this.setPosition();
    }
  }, {
    key: 'destroyOverlay',
    value: function destroyOverlay() {

      if (this.overlayDecoration) {

        this.overlayDecoration.destroy();
      }

      this.overlayDecoration = null;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      _atomTernjsEvents2['default'].off('destroy-type-overlay', this.destroyOverlayListener);

      this.destroyOverlay();

      if (this.view) {

        this.view.destroy();
        this.view = null;
      }
    }
  }]);

  return Type;
})();

exports['default'] = new Type();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXR5cGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztpQ0FLb0IsdUJBQXVCOzs7O3VDQUNqQiw4QkFBOEI7Ozs7Z0NBQ3BDLHNCQUFzQjs7OztvQkFDdEIsTUFBTTs7Z0NBTW5CLHNCQUFzQjs7OEJBRUwsaUJBQWlCOztBQWhCekMsV0FBVyxDQUFDOztBQUVaLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3BELElBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQzs7SUFlZixJQUFJO0FBRUcsV0FGUCxJQUFJLEdBRU07MEJBRlYsSUFBSTs7QUFJTixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDOztBQUU5QixRQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQzs7QUFFNUIsUUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQzlEOztlQVhHLElBQUk7O1dBYUosZ0JBQUc7O0FBRUwsVUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO0FBQzNCLFVBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUUzQixVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFMUQsb0NBQVEsRUFBRSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0tBQ2pFOzs7V0FFVSx1QkFBRzs7QUFFWixVQUFJLElB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SSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztPQUNsQjtLQUNGOzs7U0EvUUcsSUFBSTs7O3FCQWtSSyxJQUFJLElBQUksRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy10eXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IFR5cGVWaWV3ID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy10eXBlLXZpZXcnKTtcbmNvbnN0IFRPTEVSQU5DRSA9IDIwO1xuXG5pbXBvcnQgbWFuYWdlciBmcm9tICcuL2F0b20tdGVybmpzLW1hbmFnZXInO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQgZW1pdHRlciBmcm9tICcuL2F0b20tdGVybmpzLWV2ZW50cyc7XG5pbXBvcnQge1JhbmdlfSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIHByZXBhcmVUeXBlLFxuICBwcmVwYXJlSW5saW5lRG9jcyxcbiAgZXh0cmFjdFBhcmFtcyxcbiAgZm9ybWF0VHlwZVxufSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5cbmltcG9ydCB7ZGVlcENsb25lfSBmcm9tICd1bmRlcnNjb3JlLXBsdXMnO1xuXG5jbGFzcyBUeXBlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IG51bGw7XG5cbiAgICB0aGlzLmN1cnJlbnRSYW5nZSA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50Vmlld0RhdGEgPSBudWxsO1xuXG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheUxpc3RlbmVyID0gdGhpcy5kZXN0cm95T3ZlcmxheS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIHRoaXMudmlldyA9IG5ldyBUeXBlVmlldygpO1xuICAgIHRoaXMudmlldy5pbml0aWFsaXplKHRoaXMpO1xuXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5hcHBlbmRDaGlsZCh0aGlzLnZpZXcpO1xuXG4gICAgZW1pdHRlci5vbigndHlwZS1kZXN0cm95LW92ZXJsYXknLCB0aGlzLmRlc3Ryb3lPdmVybGF5TGlzdGVuZXIpO1xuICB9XG5cbiAgc2V0UG9zaXRpb24oKSB7XG5cbiAgICBpZiAodGhpcy5vdmVybGF5RGVjb3JhdGlvbikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuXG4gICAgaWYgKCFlZGl0b3IpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1hcmtlciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCk7XG5cbiAgICBpZiAoIW1hcmtlcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHtcblxuICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgY2xhc3M6ICdhdG9tLXRlcm5qcy10eXBlJyxcbiAgICAgIHBvc2l0aW9uOiAndGFsZScsXG4gICAgICBpbnZhbGlkYXRlOiAndG91Y2gnXG4gICAgfSk7XG4gIH1cblxuICBxdWVyeVR5cGUoZWRpdG9yLCBlKSB7XG5cbiAgICBsZXQgcm93U3RhcnQgPSAwO1xuICAgIGxldCByYW5nZUJlZm9yZSA9IGZhbHNlO1xuICAgIGxldCB0bXAgPSBmYWxzZTtcbiAgICBsZXQgbWF5ID0gMDtcbiAgICBsZXQgbWF5MiA9IDA7XG4gICAgbGV0IHNraXBDb3VudGVyID0gMDtcbiAgICBsZXQgc2tpcENvdW50ZXIyID0gMDtcbiAgICBsZXQgcGFyYW1Qb3NpdGlvbiA9IDA7XG4gICAgY29uc3QgcG9zaXRpb24gPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcblxuICAgIGlmIChwb3NpdGlvbi5yb3cgLSBUT0xFUkFOQ0UgPCAwKSB7XG5cbiAgICAgIHJvd1N0YXJ0ID0gMDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHJvd1N0YXJ0ID0gcG9zaXRpb24ucm93IC0gVE9MRVJBTkNFO1xuICAgIH1cblxuICAgIGJ1ZmZlci5iYWNrd2FyZHNTY2FuSW5SYW5nZSgvXFxdfFxcW3xcXCh8XFwpfFxcLHxcXHt8XFx9L2csIG5ldyBSYW5nZShbcm93U3RhcnQsIDBdLCBbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dKSwgKG9iaikgPT4ge1xuXG4gICAgICBjb25zdCBzY29wZURlc2NyaXB0b3IgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW29iai5yYW5nZS5zdGFydC5yb3csIG9iai5yYW5nZS5zdGFydC5jb2x1bW5dKTtcblxuICAgICAgaWYgKFxuICAgICAgICBzY29wZURlc2NyaXB0b3Iuc2NvcGVzLmluY2x1ZGVzKCdzdHJpbmcucXVvdGVkJykgfHxcbiAgICAgICAgc2NvcGVEZXNjcmlwdG9yLnNjb3Blcy5pbmNsdWRlcygnc3RyaW5nLnJlZ2V4cCcpXG4gICAgICApIHtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnfScpIHtcblxuICAgICAgICBtYXkrKztcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAob2JqLm1hdGNoVGV4dCA9PT0gJ10nKSB7XG5cbiAgICAgICAgaWYgKCF0bXApIHtcblxuICAgICAgICAgIHNraXBDb3VudGVyMisrO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF5MisrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAneycpIHtcblxuICAgICAgICBpZiAoIW1heSkge1xuXG4gICAgICAgICAgcmFuZ2VCZWZvcmUgPSBmYWxzZTtcbiAgICAgICAgICBvYmouc3RvcCgpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF5LS07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICdbJykge1xuXG4gICAgICAgIGlmIChza2lwQ291bnRlcjIpIHtcblxuICAgICAgICAgIHNraXBDb3VudGVyMi0tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYXkyKSB7XG5cbiAgICAgICAgICByYW5nZUJlZm9yZSA9IGZhbHNlO1xuICAgICAgICAgIG9iai5zdG9wKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF5Mi0tO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnKScgJiYgIXRtcCkge1xuXG4gICAgICAgIHNraXBDb3VudGVyKys7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICcsJyAmJiAhc2tpcENvdW50ZXIgJiYgIXNraXBDb3VudGVyMiAmJiAhbWF5ICYmICFtYXkyKSB7XG5cbiAgICAgICAgcGFyYW1Qb3NpdGlvbisrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnLCcpIHtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnKCcgJiYgc2tpcENvdW50ZXIpIHtcblxuICAgICAgICBza2lwQ291bnRlci0tO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChza2lwQ291bnRlciB8fCBza2lwQ291bnRlcjIpIHtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnKCcgJiYgIXRtcCkge1xuXG4gICAgICAgIHJhbmdlQmVmb3JlID0gb2JqLnJhbmdlO1xuICAgICAgICBvYmouc3RvcCgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdG1wID0gb2JqLm1hdGNoVGV4dDtcbiAgICB9KTtcblxuICAgIGlmICghcmFuZ2VCZWZvcmUpIHtcblxuICAgICAgdGhpcy5jdXJyZW50Vmlld0RhdGEgPSBudWxsO1xuICAgICAgdGhpcy5jdXJyZW50UmFuZ2UgPSBudWxsO1xuICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlQmVmb3JlLmlzRXF1YWwodGhpcy5jdXJyZW50UmFuZ2UpKSB7XG5cbiAgICAgIHRoaXMuY3VycmVudFZpZXdEYXRhICYmIHRoaXMuc2V0Vmlld0RhdGEodGhpcy5jdXJyZW50Vmlld0RhdGEsIHBhcmFtUG9zaXRpb24pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50UmFuZ2UgPSByYW5nZUJlZm9yZTtcbiAgICB0aGlzLmN1cnJlbnRWaWV3RGF0YSA9IG51bGw7XG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuXG4gICAgbWFuYWdlci5jbGllbnQudXBkYXRlKGVkaXRvcikudGhlbigoKSA9PiB7XG5cbiAgICAgIG1hbmFnZXIuY2xpZW50LnR5cGUoZWRpdG9yLCByYW5nZUJlZm9yZS5zdGFydCkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhZGF0YSB8fFxuICAgICAgICAgICFkYXRhLnR5cGUuc3RhcnRzV2l0aCgnZm4nKSB8fFxuICAgICAgICAgICFkYXRhLmV4cHJOYW1lXG4gICAgICAgICkge1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Vmlld0RhdGEgPSBkYXRhO1xuXG4gICAgICAgIHRoaXMuc2V0Vmlld0RhdGEoZGF0YSwgcGFyYW1Qb3NpdGlvbik7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgIC8vIG1vc3QgbGlrZWx5IHRoZSB0eXBlIHdhc24ndCBmb3VuZC4gaWdub3JlIGl0LlxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzZXRWaWV3RGF0YShkYXRhLCBwYXJhbVBvc2l0aW9uKSB7XG5cbiAgICBjb25zdCB2aWV3RGF0YSA9IGRlZXBDbG9uZShkYXRhKTtcbiAgICBjb25zdCB0eXBlID0gcHJlcGFyZVR5cGUodmlld0RhdGEpO1xuICAgIGNvbnN0IHBhcmFtcyA9IGV4dHJhY3RQYXJhbXModHlwZSk7XG4gICAgZm9ybWF0VHlwZSh2aWV3RGF0YSk7XG5cbiAgICBpZiAocGFyYW1zICYmIHBhcmFtc1twYXJhbVBvc2l0aW9uXSkge1xuXG4gICAgICB2aWV3RGF0YS50eXBlID0gdmlld0RhdGEudHlwZS5yZXBsYWNlKHBhcmFtc1twYXJhbVBvc2l0aW9uXSwgYDxzcGFuIGNsYXNzPVwidGV4dC1pbmZvXCI+JHtwYXJhbXNbcGFyYW1Qb3NpdGlvbl19PC9zcGFuPmApO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHZpZXdEYXRhLmRvYyAmJlxuICAgICAgcGFja2FnZUNvbmZpZy5vcHRpb25zLmlubGluZUZuQ29tcGxldGlvbkRvY3VtZW50YXRpb25cbiAgICApIHtcblxuICAgICAgdmlld0RhdGEuZG9jID0gdmlld0RhdGEuZG9jICYmIHZpZXdEYXRhLmRvYy5yZXBsYWNlKC8oPzpcXHJcXG58XFxyfFxcbikvZywgJzxiciAvPicpO1xuICAgICAgdmlld0RhdGEuZG9jID0gcHJlcGFyZUlubGluZURvY3Modmlld0RhdGEuZG9jKTtcblxuICAgICAgdGhpcy52aWV3LnNldERhdGEodmlld0RhdGEudHlwZSwgdmlld0RhdGEuZG9jKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHRoaXMudmlldy5zZXREYXRhKHZpZXdEYXRhLnR5cGUpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0UG9zaXRpb24oKTtcbiAgfVxuXG4gIGRlc3Ryb3lPdmVybGF5KCkge1xuXG4gICAgaWYgKHRoaXMub3ZlcmxheURlY29yYXRpb24pIHtcblxuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IG51bGw7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZW1pdHRlci5vZmYoJ2Rlc3Ryb3ktdHlwZS1vdmVybGF5JywgdGhpcy5kZXN0cm95T3ZlcmxheUxpc3RlbmVyKTtcblxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcblxuICAgIGlmICh0aGlzLnZpZXcpIHtcblxuICAgICAgdGhpcy52aWV3LmRlc3Ryb3koKTtcbiAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBUeXBlKCk7XG4iXX0=