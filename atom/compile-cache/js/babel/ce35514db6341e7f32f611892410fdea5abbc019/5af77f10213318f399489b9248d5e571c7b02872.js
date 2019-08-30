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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy10eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7aUNBS29CLHVCQUF1Qjs7Ozt1Q0FDakIsOEJBQThCOzs7O2dDQUNwQyxzQkFBc0I7Ozs7b0JBQ3RCLE1BQU07O2dDQU1uQixzQkFBc0I7OzhCQUVMLGlCQUFpQjs7QUFoQnpDLFdBQVcsQ0FBQzs7QUFFWixJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUNwRCxJQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7O0lBZWYsSUFBSTtBQUVHLFdBRlAsSUFBSSxHQUVNOzBCQUZWLElBQUk7O0FBSU4sUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsUUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQzs7QUFFOUIsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7O0FBRTVCLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUM5RDs7ZUFYRyxJQUFJOztXQWFKLGdCQUFHOztBQUVMLFVBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztBQUMzQixVQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFM0IsVUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTFELG9DQUFRLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztLQUNqRTs7O1dBRVUsdUJBQUc7O0FBRVosVUFBSSxJQUFJLENBQUMs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QUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDakYsZ0JBQVEsQ0FBQyxHQUFHLEdBQUcseUNBQWtCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7T0FFaEQsTUFBTTs7QUFFTCxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDbEM7O0FBRUQsVUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ3BCOzs7V0FFYSwwQkFBRzs7QUFFZixVQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTs7QUFFMUIsWUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO09BQ2xDOztBQUVELFVBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7S0FDL0I7OztXQUVNLG1CQUFHOztBQUVSLG9DQUFRLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFakUsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV0QixVQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7O0FBRWIsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztPQUNsQjtLQUNGOzs7U0FyUUcsSUFBSTs7O3FCQXdRSyxJQUFJLElBQUksRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtdHlwZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5jb25zdCBUeXBlVmlldyA9IHJlcXVpcmUoJy4vYXRvbS10ZXJuanMtdHlwZS12aWV3Jyk7XG5jb25zdCBUT0xFUkFOQ0UgPSAyMDtcblxuaW1wb3J0IG1hbmFnZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1tYW5hZ2VyJztcbmltcG9ydCBwYWNrYWdlQ29uZmlnIGZyb20gJy4vYXRvbS10ZXJuanMtcGFja2FnZS1jb25maWcnO1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1ldmVudHMnO1xuaW1wb3J0IHtSYW5nZX0gZnJvbSAnYXRvbSc7XG5pbXBvcnQge1xuICBwcmVwYXJlVHlwZSxcbiAgcHJlcGFyZUlubGluZURvY3MsXG4gIGV4dHJhY3RQYXJhbXMsXG4gIGZvcm1hdFR5cGVcbn0gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuXG5pbXBvcnQge2RlZXBDbG9uZX0gZnJvbSAndW5kZXJzY29yZS1wbHVzJztcblxuY2xhc3MgVHlwZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgIHRoaXMub3ZlcmxheURlY29yYXRpb24gPSBudWxsO1xuXG4gICAgdGhpcy5jdXJyZW50UmFuZ2UgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFZpZXdEYXRhID0gbnVsbDtcblxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXlMaXN0ZW5lciA9IHRoaXMuZGVzdHJveU92ZXJsYXkuYmluZCh0aGlzKTtcbiAgfVxuXG4gIGluaXQoKSB7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgVHlwZVZpZXcoKTtcbiAgICB0aGlzLnZpZXcuaW5pdGlhbGl6ZSh0aGlzKTtcblxuICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuYXBwZW5kQ2hpbGQodGhpcy52aWV3KTtcblxuICAgIGVtaXR0ZXIub24oJ3R5cGUtZGVzdHJveS1vdmVybGF5JywgdGhpcy5kZXN0cm95T3ZlcmxheUxpc3RlbmVyKTtcbiAgfVxuXG4gIHNldFBvc2l0aW9uKCkge1xuXG4gICAgaWYgKHRoaXMub3ZlcmxheURlY29yYXRpb24pIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcblxuICAgIGlmICghZWRpdG9yKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpO1xuXG4gICAgaWYgKCFtYXJrZXIpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMub3ZlcmxheURlY29yYXRpb24gPSBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7XG5cbiAgICAgIHR5cGU6ICdvdmVybGF5JyxcbiAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgIGNsYXNzOiAnYXRvbS10ZXJuanMtdHlwZScsXG4gICAgICBwb3NpdGlvbjogJ3RhbGUnLFxuICAgICAgaW52YWxpZGF0ZTogJ3RvdWNoJ1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnlUeXBlKGVkaXRvciwgZSkge1xuXG4gICAgbGV0IHJvd1N0YXJ0ID0gMDtcbiAgICBsZXQgcmFuZ2VCZWZvcmUgPSBmYWxzZTtcbiAgICBsZXQgdG1wID0gZmFsc2U7XG4gICAgbGV0IG1heSA9IDA7XG4gICAgbGV0IG1heTIgPSAwO1xuICAgIGxldCBza2lwQ291bnRlciA9IDA7XG4gICAgbGV0IHNraXBDb3VudGVyMiA9IDA7XG4gICAgbGV0IHBhcmFtUG9zaXRpb24gPSAwO1xuICAgIGNvbnN0IHBvc2l0aW9uID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcbiAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG5cbiAgICBpZiAocG9zaXRpb24ucm93IC0gVE9MRVJBTkNFIDwgMCkge1xuXG4gICAgICByb3dTdGFydCA9IDA7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICByb3dTdGFydCA9IHBvc2l0aW9uLnJvdyAtIFRPTEVSQU5DRTtcbiAgICB9XG5cbiAgICBidWZmZXIuYmFja3dhcmRzU2NhbkluUmFuZ2UoL1xcXXxcXFt8XFwofFxcKXxcXCx8XFx7fFxcfS9nLCBuZXcgUmFuZ2UoW3Jvd1N0YXJ0LCAwXSwgW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXSksIChvYmopID0+IHtcblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICd9Jykge1xuXG4gICAgICAgIG1heSsrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvYmoubWF0Y2hUZXh0ID09PSAnXScpIHtcblxuICAgICAgICBpZiAoIXRtcCkge1xuXG4gICAgICAgICAgc2tpcENvdW50ZXIyKys7XG4gICAgICAgIH1cblxuICAgICAgICBtYXkyKys7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICd7Jykge1xuXG4gICAgICAgIGlmICghbWF5KSB7XG5cbiAgICAgICAgICByYW5nZUJlZm9yZSA9IGZhbHNlO1xuICAgICAgICAgIG9iai5zdG9wKCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtYXktLTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAob2JqLm1hdGNoVGV4dCA9PT0gJ1snKSB7XG5cbiAgICAgICAgaWYgKHNraXBDb3VudGVyMikge1xuXG4gICAgICAgICAgc2tpcENvdW50ZXIyLS07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW1heTIpIHtcblxuICAgICAgICAgIHJhbmdlQmVmb3JlID0gZmFsc2U7XG4gICAgICAgICAgb2JqLnN0b3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtYXkyLS07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICcpJyAmJiAhdG1wKSB7XG5cbiAgICAgICAgc2tpcENvdW50ZXIrKztcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAob2JqLm1hdGNoVGV4dCA9PT0gJywnICYmICFza2lwQ291bnRlciAmJiAhc2tpcENvdW50ZXIyICYmICFtYXkgJiYgIW1heTIpIHtcblxuICAgICAgICBwYXJhbVBvc2l0aW9uKys7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICcsJykge1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICcoJyAmJiBza2lwQ291bnRlcikge1xuXG4gICAgICAgIHNraXBDb3VudGVyLS07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHNraXBDb3VudGVyIHx8IHNraXBDb3VudGVyMikge1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9iai5tYXRjaFRleHQgPT09ICcoJyAmJiAhdG1wKSB7XG5cbiAgICAgICAgcmFuZ2VCZWZvcmUgPSBvYmoucmFuZ2U7XG4gICAgICAgIG9iai5zdG9wKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0bXAgPSBvYmoubWF0Y2hUZXh0O1xuICAgIH0pO1xuXG4gICAgaWYgKCFyYW5nZUJlZm9yZSkge1xuXG4gICAgICB0aGlzLmN1cnJlbnRWaWV3RGF0YSA9IG51bGw7XG4gICAgICB0aGlzLmN1cnJlbnRSYW5nZSA9IG51bGw7XG4gICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmFuZ2VCZWZvcmUuaXNFcXVhbCh0aGlzLmN1cnJlbnRSYW5nZSkpIHtcblxuICAgICAgdGhpcy5jdXJyZW50Vmlld0RhdGEgJiYgdGhpcy5zZXRWaWV3RGF0YSh0aGlzLmN1cnJlbnRWaWV3RGF0YSwgcGFyYW1Qb3NpdGlvbik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRSYW5nZSA9IHJhbmdlQmVmb3JlO1xuICAgIHRoaXMuY3VycmVudFZpZXdEYXRhID0gbnVsbDtcbiAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG5cbiAgICBtYW5hZ2VyLmNsaWVudC51cGRhdGUoZWRpdG9yKS50aGVuKCgpID0+IHtcblxuICAgICAgbWFuYWdlci5jbGllbnQudHlwZShlZGl0b3IsIHJhbmdlQmVmb3JlLnN0YXJ0KS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFkYXRhIHx8XG4gICAgICAgICAgIWRhdGEudHlwZS5zdGFydHNXaXRoKCdmbicpIHx8XG4gICAgICAgICAgIWRhdGEuZXhwck5hbWVcbiAgICAgICAgKSB7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRWaWV3RGF0YSA9IGRhdGE7XG5cbiAgICAgICAgdGhpcy5zZXRWaWV3RGF0YShkYXRhLCBwYXJhbVBvc2l0aW9uKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgLy8gbW9zdCBsaWtlbHkgdGhlIHR5cGUgd2Fzbid0IGZvdW5kLiBpZ25vcmUgaXQuXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNldFZpZXdEYXRhKGRhdGEsIHBhcmFtUG9zaXRpb24pIHtcblxuICAgIGNvbnN0IHZpZXdEYXRhID0gZGVlcENsb25lKGRhdGEpO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVwYXJlVHlwZSh2aWV3RGF0YSk7XG4gICAgY29uc3QgcGFyYW1zID0gZXh0cmFjdFBhcmFtcyh0eXBlKTtcbiAgICBmb3JtYXRUeXBlKHZpZXdEYXRhKTtcblxuICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zW3BhcmFtUG9zaXRpb25dKSB7XG5cbiAgICAgIHZpZXdEYXRhLnR5cGUgPSB2aWV3RGF0YS50eXBlLnJlcGxhY2UocGFyYW1zW3BhcmFtUG9zaXRpb25dLCBgPHNwYW4gY2xhc3M9XCJ0ZXh0LWluZm9cIj4ke3BhcmFtc1twYXJhbVBvc2l0aW9uXX08L3NwYW4+YCk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdmlld0RhdGEuZG9jICYmXG4gICAgICBwYWNrYWdlQ29uZmlnLm9wdGlvbnMuaW5saW5lRm5Db21wbGV0aW9uRG9jdW1lbnRhdGlvblxuICAgICkge1xuXG4gICAgICB2aWV3RGF0YS5kb2MgPSB2aWV3RGF0YS5kb2MgJiYgdmlld0RhdGEuZG9jLnJlcGxhY2UoLyg/OlxcclxcbnxcXHJ8XFxuKS9nLCAnPGJyIC8+Jyk7XG4gICAgICB2aWV3RGF0YS5kb2MgPSBwcmVwYXJlSW5saW5lRG9jcyh2aWV3RGF0YS5kb2MpO1xuXG4gICAgICB0aGlzLnZpZXcuc2V0RGF0YSh2aWV3RGF0YS50eXBlLCB2aWV3RGF0YS5kb2MpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgdGhpcy52aWV3LnNldERhdGEodmlld0RhdGEudHlwZSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRQb3NpdGlvbigpO1xuICB9XG5cbiAgZGVzdHJveU92ZXJsYXkoKSB7XG5cbiAgICBpZiAodGhpcy5vdmVybGF5RGVjb3JhdGlvbikge1xuXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gbnVsbDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG5cbiAgICBlbWl0dGVyLm9mZignZGVzdHJveS10eXBlLW92ZXJsYXknLCB0aGlzLmRlc3Ryb3lPdmVybGF5TGlzdGVuZXIpO1xuXG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuXG4gICAgaWYgKHRoaXMudmlldykge1xuXG4gICAgICB0aGlzLnZpZXcuZGVzdHJveSgpO1xuICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFR5cGUoKTtcbiJdfQ==