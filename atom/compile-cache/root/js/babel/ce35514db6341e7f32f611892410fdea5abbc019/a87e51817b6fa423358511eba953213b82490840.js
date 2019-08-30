Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _validate = require('./validate');

var _elementsHighlight = require('./elements/highlight');

var ProvidersHighlight = (function () {
  function ProvidersHighlight() {
    _classCallCheck(this, ProvidersHighlight);

    this.number = 0;
    this.providers = new Set();
  }

  _createClass(ProvidersHighlight, [{
    key: 'addProvider',
    value: function addProvider(provider) {
      if (!this.hasProvider(provider)) {
        (0, _validate.provider)(provider);
        this.providers.add(provider);
      }
    }
  }, {
    key: 'hasProvider',
    value: function hasProvider(provider) {
      return this.providers.has(provider);
    }
  }, {
    key: 'deleteProvider',
    value: function deleteProvider(provider) {
      if (this.hasProvider(provider)) {
        this.providers['delete'](provider);
      }
    }
  }, {
    key: 'trigger',
    value: _asyncToGenerator(function* (textEditor) {
      var editorPath = textEditor.getPath();
      var bufferPosition = textEditor.getCursorBufferPosition();

      if (!editorPath) {
        return [];
      }

      var scopes = textEditor.scopeDescriptorForBufferPosition(bufferPosition).getScopesArray();
      scopes.push('*');

      var visibleRange = _atom.Range.fromObject([textEditor.bufferPositionForScreenPosition([textEditor.getFirstVisibleScreenRow(), 0]), textEditor.bufferPositionForScreenPosition([textEditor.getLastVisibleScreenRow(), 0])]);
      // Setting this to infinity on purpose, cause the buffer position just marks visible column
      // according to element width
      visibleRange.end.column = Infinity;

      var promises = [];
      this.providers.forEach(function (provider) {
        if (scopes.some(function (scope) {
          return provider.grammarScopes.indexOf(scope) !== -1;
        })) {
          promises.push(new Promise(function (resolve) {
            resolve(provider.getIntentions({ textEditor: textEditor, visibleRange: visibleRange }));
          }).then(function (results) {
            if (atom.inDevMode()) {
              (0, _validate.suggestionsShow)(results);
            }
            return results;
          }));
        }
      });

      var number = ++this.number;
      var results = (yield Promise.all(promises)).reduce(function (items, item) {
        if (Array.isArray(item)) {
          return items.concat(item);
        }
        return items;
      }, []);

      if (number !== this.number || !results.length) {
        // If has been executed one more time, ignore these results
        // Or we just don't have any results
        return [];
      }

      return results;
    })
  }, {
    key: 'paint',
    value: function paint(textEditor, intentions) {
      var markers = [];

      var _loop = function (intention) {
        var matchedText = textEditor.getTextInBufferRange(intention.range);
        var marker = textEditor.markBufferRange(intention.range);
        var element = (0, _elementsHighlight.create)(intention, matchedText.length);
        intention.created({ textEditor: textEditor, element: element, marker: marker, matchedText: matchedText });
        textEditor.decorateMarker(marker, {
          type: 'overlay',
          position: 'tail',
          item: element
        });
        marker.onDidChange(function (_ref) {
          var start = _ref.newHeadBufferPosition;
          var end = _ref.oldTailBufferPosition;

          element.textContent = _elementsHighlight.PADDING_CHARACTER.repeat(textEditor.getTextInBufferRange([start, end]).length);
        });
        markers.push(marker);
      };

      for (var intention of intentions) {
        _loop(intention);
      }
      return new _atom.Disposable(function () {
        markers.forEach(function (marker) {
          try {
            marker.destroy();
          } catch (_) {/* No Op */}
        });
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.providers.clear();
    }
  }]);

  return ProvidersHighlight;
})();

exports['default'] = ProvidersHighlight;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvcHJvdmlkZXJzLWhpZ2hsaWdodC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUVrQyxNQUFNOzt3QkFFNkMsWUFBWTs7aUNBQ3RDLHNCQUFzQjs7SUFHNUQsa0JBQWtCO0FBSTFCLFdBSlEsa0JBQWtCLEdBSXZCOzBCQUpLLGtCQUFrQjs7QUFLbkMsUUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7QUFDZixRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7R0FDM0I7O2VBUGtCLGtCQUFrQjs7V0FRMUIscUJBQUMsUUFBMkIsRUFBRTtBQUN2QyxVQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUMvQixnQ0FBaUIsUUFBUSxDQUFDLENBQUE7QUFDMUIsWUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDN0I7S0FDRjs7O1dBQ1UscUJBQUMsUUFBMkIsRUFBVztBQUNoRCxhQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0tBQ3BDOzs7V0FDYSx3QkFBQyxRQUEyQixFQUFFO0FBQzFDLFVBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QixZQUFJLENBQUMsU0FBUyxVQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDaEM7S0FDRjs7OzZCQUNZLFdBQUMsVUFBc0IsRUFBaUM7QUFDbkUsVUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ3ZDLFVBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFBOztBQUUzRCxVQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2YsZUFBTyxFQUFFLENBQUE7T0FDVjs7QUFFRCxVQUFNLE1BQU0sR0FBRyxVQUFV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QU0sQ0FBQyxXQUFXLENBQUMsVUFBUyxJQUE0RCxFQUFFO2NBQXJDLEtBQUssR0FBOUIsSUFBNEQsQ0FBMUQscUJBQXFCO2NBQWdDLEdBQUcsR0FBMUQsSUFBNEQsQ0FBNUIscUJBQXFCOztBQUMvRSxpQkFBTyxDQUFDLFdBQVcsR0FBRyxxQ0FBa0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQ3JHLENBQUMsQ0FBQTtBQUNGLGVBQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7OztBQWJ0QixXQUFLLElBQU0sU0FBUyxJQUFLLFVBQVUsRUFBeUI7Y0FBakQsU0FBUztPQWNuQjtBQUNELGFBQU8scUJBQWUsWUFBVztBQUMvQixlQUFPLENBQUMsT0FBTyxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQy9CLGNBQUk7QUFDRixrQkFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO1dBQ2pCLENBQUMsT0FBTyxDQUFDLEVBQUUsYUFBZTtTQUM1QixDQUFDLENBQUE7T0FDSCxDQUFDLENBQUE7S0FDSDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFBO0tBQ3ZCOzs7U0FsR2tCLGtCQUFrQjs7O3FCQUFsQixrQkFBa0IiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9pbnRlbnRpb25zL2xpYi9wcm92aWRlcnMtaGlnaGxpZ2h0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgUmFuZ2UsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IHByb3ZpZGVyIGFzIHZhbGlkYXRlUHJvdmlkZXIsIHN1Z2dlc3Rpb25zU2hvdyBhcyB2YWxpZGF0ZVN1Z2dlc3Rpb25zIH0gZnJvbSAnLi92YWxpZGF0ZSdcbmltcG9ydCB7IGNyZWF0ZSBhcyBjcmVhdGVFbGVtZW50LCBQQURESU5HX0NIQVJBQ1RFUiB9IGZyb20gJy4vZWxlbWVudHMvaGlnaGxpZ2h0J1xuaW1wb3J0IHR5cGUgeyBIaWdobGlnaHRQcm92aWRlciwgSGlnaGxpZ2h0SXRlbSB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb3ZpZGVyc0hpZ2hsaWdodCB7XG4gIG51bWJlcjogbnVtYmVyO1xuICBwcm92aWRlcnM6IFNldDxIaWdobGlnaHRQcm92aWRlcj47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5udW1iZXIgPSAwXG4gICAgdGhpcy5wcm92aWRlcnMgPSBuZXcgU2V0KClcbiAgfVxuICBhZGRQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICBpZiAoIXRoaXMuaGFzUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICB2YWxpZGF0ZVByb3ZpZGVyKHByb3ZpZGVyKVxuICAgICAgdGhpcy5wcm92aWRlcnMuYWRkKHByb3ZpZGVyKVxuICAgIH1cbiAgfVxuICBoYXNQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5wcm92aWRlcnMuaGFzKHByb3ZpZGVyKVxuICB9XG4gIGRlbGV0ZVByb3ZpZGVyKHByb3ZpZGVyOiBIaWdobGlnaHRQcm92aWRlcikge1xuICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgdGhpcy5wcm92aWRlcnMuZGVsZXRlKHByb3ZpZGVyKVxuICAgIH1cbiAgfVxuICBhc3luYyB0cmlnZ2VyKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPEFycmF5PEhpZ2hsaWdodEl0ZW0+PiB7XG4gICAgY29uc3QgZWRpdG9yUGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpXG4gICAgY29uc3QgYnVmZmVyUG9zaXRpb24gPSB0ZXh0RWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmICghZWRpdG9yUGF0aCkge1xuICAgICAgcmV0dXJuIFtdXG4gICAgfVxuXG4gICAgY29uc3Qgc2NvcGVzID0gdGV4dEVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihidWZmZXJQb3NpdGlvbikuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIHNjb3Blcy5wdXNoKCcqJylcblxuICAgIGNvbnN0IHZpc2libGVSYW5nZSA9IFJhbmdlLmZyb21PYmplY3QoW1xuICAgICAgdGV4dEVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKFt0ZXh0RWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpLCAwXSksXG4gICAgICB0ZXh0RWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oW3RleHRFZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwgMF0pLFxuICAgIF0pXG4gICAgLy8gU2V0dGluZyB0aGlzIHRvIGluZmluaXR5IG9uIHB1cnBvc2UsIGNhdXNlIHRoZSBidWZmZXIgcG9zaXRpb24ganVzdCBtYXJrcyB2aXNpYmxlIGNvbHVtblxuICAgIC8vIGFjY29yZGluZyB0byBlbGVtZW50IHdpZHRoXG4gICAgdmlzaWJsZVJhbmdlLmVuZC5jb2x1bW4gPSBJbmZpbml0eVxuXG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXVxuICAgIHRoaXMucHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24ocHJvdmlkZXIpIHtcbiAgICAgIGlmIChzY29wZXMuc29tZShzY29wZSA9PiBwcm92aWRlci5ncmFtbWFyU2NvcGVzLmluZGV4T2Yoc2NvcGUpICE9PSAtMSkpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgICAgcmVzb2x2ZShwcm92aWRlci5nZXRJbnRlbnRpb25zKHsgdGV4dEVkaXRvciwgdmlzaWJsZVJhbmdlIH0pKVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICAgICAgICBpZiAoYXRvbS5pbkRldk1vZGUoKSkge1xuICAgICAgICAgICAgdmFsaWRhdGVTdWdnZXN0aW9ucyhyZXN1bHRzKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0c1xuICAgICAgICB9KSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgbnVtYmVyID0gKyt0aGlzLm51bWJlclxuICAgIGNvbnN0IHJlc3VsdHMgPSAoYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpKS5yZWR1Y2UoZnVuY3Rpb24oaXRlbXMsIGl0ZW0pIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICAgIHJldHVybiBpdGVtcy5jb25jYXQoaXRlbSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVtc1xuICAgIH0sIFtdKVxuXG4gICAgaWYgKG51bWJlciAhPT0gdGhpcy5udW1iZXIgfHwgIXJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAvLyBJZiBoYXMgYmVlbiBleGVjdXRlZCBvbmUgbW9yZSB0aW1lLCBpZ25vcmUgdGhlc2UgcmVzdWx0c1xuICAgICAgLy8gT3Igd2UganVzdCBkb24ndCBoYXZlIGFueSByZXN1bHRzXG4gICAgICByZXR1cm4gW11cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG4gIHBhaW50KHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIGludGVudGlvbnM6IEFycmF5PEhpZ2hsaWdodEl0ZW0+KTogRGlzcG9zYWJsZSB7XG4gICAgY29uc3QgbWFya2VycyA9IFtdXG4gICAgZm9yIChjb25zdCBpbnRlbnRpb24gb2YgKGludGVudGlvbnM6IEFycmF5PEhpZ2hsaWdodEl0ZW0+KSkge1xuICAgICAgY29uc3QgbWF0Y2hlZFRleHQgPSB0ZXh0RWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKGludGVudGlvbi5yYW5nZSlcbiAgICAgIGNvbnN0IG1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlKGludGVudGlvbi5yYW5nZSlcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjcmVhdGVFbGVtZW50KGludGVudGlvbiwgbWF0Y2hlZFRleHQubGVuZ3RoKVxuICAgICAgaW50ZW50aW9uLmNyZWF0ZWQoeyB0ZXh0RWRpdG9yLCBlbGVtZW50LCBtYXJrZXIsIG1hdGNoZWRUZXh0IH0pXG4gICAgICB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge1xuICAgICAgICB0eXBlOiAnb3ZlcmxheScsXG4gICAgICAgIHBvc2l0aW9uOiAndGFpbCcsXG4gICAgICAgIGl0ZW06IGVsZW1lbnQsXG4gICAgICB9KVxuICAgICAgbWFya2VyLm9uRGlkQ2hhbmdlKGZ1bmN0aW9uKHsgbmV3SGVhZEJ1ZmZlclBvc2l0aW9uOiBzdGFydCwgb2xkVGFpbEJ1ZmZlclBvc2l0aW9uOiBlbmQgfSkge1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gUEFERElOR19DSEFSQUNURVIucmVwZWF0KHRleHRFZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW3N0YXJ0LCBlbmRdKS5sZW5ndGgpXG4gICAgICB9KVxuICAgICAgbWFya2Vycy5wdXNoKG1hcmtlcilcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKGZ1bmN0aW9uKCkge1xuICAgICAgbWFya2Vycy5mb3JFYWNoKGZ1bmN0aW9uKG1hcmtlcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1hcmtlci5kZXN0cm95KClcbiAgICAgICAgfSBjYXRjaCAoXykgeyAvKiBObyBPcCAqLyB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnByb3ZpZGVycy5jbGVhcigpXG4gIH1cbn1cbiJdfQ==