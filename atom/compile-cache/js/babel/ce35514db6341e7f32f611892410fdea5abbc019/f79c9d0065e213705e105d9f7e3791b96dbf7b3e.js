var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _sbDebounce = require('sb-debounce');

var _sbDebounce2 = _interopRequireDefault(_sbDebounce);

var _disposableEvent = require('disposable-event');

var _disposableEvent2 = _interopRequireDefault(_disposableEvent);

var _helpers = require('./helpers');

var TreeView = (function () {
  function TreeView() {
    var _this = this;

    _classCallCheck(this, TreeView);

    this.emitter = new _atom.Emitter();
    this.messages = [];
    this.decorations = {};
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', function (decorateOnTreeView) {
      if (typeof _this.decorateOnTreeView === 'undefined') {
        _this.decorateOnTreeView = decorateOnTreeView;
      } else if (decorateOnTreeView === 'None') {
        _this.update([]);
        _this.decorateOnTreeView = decorateOnTreeView;
      } else {
        var messages = _this.messages;
        _this.decorateOnTreeView = decorateOnTreeView;
        _this.update(messages);
      }
    }));

    setTimeout(function () {
      var element = TreeView.getElement();
      if (!element) {
        return;
      }
      // Subscription is only added if the CompositeDisposable hasn't been disposed
      _this.subscriptions.add((0, _disposableEvent2['default'])(element, 'click', (0, _sbDebounce2['default'])(function () {
        _this.update();
      })));
    }, 100);
  }

  _createClass(TreeView, [{
    key: 'update',
    value: function update() {
      var givenMessages = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (Array.isArray(givenMessages)) {
        this.messages = givenMessages;
      }
      var messages = this.messages;

      var element = TreeView.getElement();
      var decorateOnTreeView = this.decorateOnTreeView;
      if (!element || decorateOnTreeView === 'None') {
        return;
      }

      this.applyDecorations((0, _helpers.calculateDecorations)(decorateOnTreeView, messages));
    }
  }, {
    key: 'applyDecorations',
    value: function applyDecorations(decorations) {
      var _this2 = this;

      var treeViewElement = TreeView.getElement();
      if (!treeViewElement) {
        return;
      }

      var elementCache = {};
      var appliedDecorations = {};

      Object.keys(this.decorations).forEach(function (filePath) {
        if (!({}).hasOwnProperty.call(_this2.decorations, filePath)) {
          return;
        }
        if (!decorations[filePath]) {
          // Removed
          var element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath));
          if (element) {
            _this2.removeDecoration(element);
          }
        }
      });

      Object.keys(decorations).forEach(function (filePath) {
        if (!({}).hasOwnProperty.call(decorations, filePath)) {
          return;
        }
        var element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath));
        if (element) {
          _this2.handleDecoration(element, !!_this2.decorations[filePath], decorations[filePath]);
          appliedDecorations[filePath] = decorations[filePath];
        }
      });

      this.decorations = appliedDecorations;
    }
  }, {
    key: 'handleDecoration',
    value: function handleDecoration(element, update, highlights) {
      if (update === undefined) update = false;

      var decoration = undefined;
      if (update) {
        decoration = element.querySelector('linter-decoration');
      }
      if (decoration) {
        decoration.className = '';
      } else {
        decoration = document.createElement('linter-decoration');
        element.appendChild(decoration);
      }
      if (highlights.error) {
        decoration.classList.add('linter-error');
      } else if (highlights.warning) {
        decoration.classList.add('linter-warning');
      } else if (highlights.info) {
        decoration.classList.add('linter-info');
      }
    }
  }, {
    key: 'removeDecoration',
    value: function removeDecoration(element) {
      var decoration = element.querySelector('linter-decoration');
      if (decoration) {
        decoration.remove();
      }
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }], [{
    key: 'getElement',
    value: function getElement() {
      return document.querySelector('.tree-view');
    }
  }, {
    key: 'getElementByPath',
    value: function getElementByPath(parent, filePath) {
      return parent.querySelector('[data-path=' + CSS.escape(filePath) + ']');
    }
  }]);

  return TreeView;
})();

module.exports = TreeView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3RyZWUtdmlldy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7b0JBRTZDLE1BQU07OzBCQUM5QixhQUFhOzs7OytCQUNOLGtCQUFrQjs7Ozt1QkFDVCxXQUFXOztJQUcxQyxRQUFRO0FBT0QsV0FQUCxRQUFRLEdBT0U7OzswQkFQVixRQUFROztBQVFWLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQTtBQUNyQixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHNDQUFzQyxFQUFFLFVBQUEsa0JBQWtCLEVBQUk7QUFDaEYsVUFBSSxPQUFPLE1BQUssa0JBQWtCLEtBQUssV0FBVyxFQUFFO0FBQ2xELGNBQUssa0JBQWtCLEdBQUcsa0JBQWtCLENBQUE7T0FDN0MsTUFBTSxJQUFJLGtCQUFrQixLQUFLLE1BQU0sRUFBRTtBQUN4QyxjQUFLLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUNmLGNBQUssa0JBQWtCLEdBQUcsa0JBQWtCLENBQUE7T0FDN0MsTUFBTTtBQUNMLFlBQU0sUUFBUSxHQUFHLE1BQUssUUFBUSxDQUFBO0FBQzlCLGNBQUssa0JBQWtCLEdBQUcsa0JBQWtCLENBQUE7QUFDNUMsY0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDdEI7S0FDRixDQUFDLENBQ0gsQ0FBQTs7QUFFRCxjQUFVLENBQUMsWUFBTTtBQUNmLFVBQU0sT0FB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M0UsYUFBTyxNQUFNLENBQUMsYUFBYSxpQkFBZSxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFJLENBQUE7S0FDbkU7OztTQW5JRyxRQUFROzs7QUFzSWQsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvdHJlZS12aWV3L2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnc2ItZGVib3VuY2UnXG5pbXBvcnQgZGlzcG9zYWJsZUV2ZW50IGZyb20gJ2Rpc3Bvc2FibGUtZXZlbnQnXG5pbXBvcnQgeyBjYWxjdWxhdGVEZWNvcmF0aW9ucyB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSwgVHJlZVZpZXdIaWdobGlnaHQgfSBmcm9tICcuLi90eXBlcydcblxuY2xhc3MgVHJlZVZpZXcge1xuICBlbWl0dGVyOiBFbWl0dGVyXG4gIG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPlxuICBkZWNvcmF0aW9uczogT2JqZWN0XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgZGVjb3JhdGVPblRyZWVWaWV3OiAnRmlsZXMgYW5kIERpcmVjdG9yaWVzJyB8ICdGaWxlcycgfCAnTm9uZSdcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5kZWNvcmF0aW9ucyA9IHt9XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0LmRlY29yYXRlT25UcmVlVmlldycsIGRlY29yYXRlT25UcmVlVmlldyA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5kZWNvcmF0ZU9uVHJlZVZpZXcgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGhpcy5kZWNvcmF0ZU9uVHJlZVZpZXcgPSBkZWNvcmF0ZU9uVHJlZVZpZXdcbiAgICAgICAgfSBlbHNlIGlmIChkZWNvcmF0ZU9uVHJlZVZpZXcgPT09ICdOb25lJykge1xuICAgICAgICAgIHRoaXMudXBkYXRlKFtdKVxuICAgICAgICAgIHRoaXMuZGVjb3JhdGVPblRyZWVWaWV3ID0gZGVjb3JhdGVPblRyZWVWaWV3XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLm1lc3NhZ2VzXG4gICAgICAgICAgdGhpcy5kZWNvcmF0ZU9uVHJlZVZpZXcgPSBkZWNvcmF0ZU9uVHJlZVZpZXdcbiAgICAgICAgICB0aGlzLnVwZGF0ZShtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gVHJlZVZpZXcuZ2V0RWxlbWVudCgpXG4gICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICAvLyBTdWJzY3JpcHRpb24gaXMgb25seSBhZGRlZCBpZiB0aGUgQ29tcG9zaXRlRGlzcG9zYWJsZSBoYXNuJ3QgYmVlbiBkaXNwb3NlZFxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgZGlzcG9zYWJsZUV2ZW50KFxuICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgJ2NsaWNrJyxcbiAgICAgICAgICBkZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpXG4gICAgICAgICAgfSksXG4gICAgICAgICksXG4gICAgICApXG4gICAgfSwgMTAwKVxuICB9XG4gIHVwZGF0ZShnaXZlbk1lc3NhZ2VzOiA/QXJyYXk8TGludGVyTWVzc2FnZT4gPSBudWxsKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZ2l2ZW5NZXNzYWdlcykpIHtcbiAgICAgIHRoaXMubWVzc2FnZXMgPSBnaXZlbk1lc3NhZ2VzXG4gICAgfVxuICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy5tZXNzYWdlc1xuXG4gICAgY29uc3QgZWxlbWVudCA9IFRyZWVWaWV3LmdldEVsZW1lbnQoKVxuICAgIGNvbnN0IGRlY29yYXRlT25UcmVlVmlldyA9IHRoaXMuZGVjb3JhdGVPblRyZWVWaWV3XG4gICAgaWYgKCFlbGVtZW50IHx8IGRlY29yYXRlT25UcmVlVmlldyA9PT0gJ05vbmUnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmFwcGx5RGVjb3JhdGlvbnMoY2FsY3VsYXRlRGVjb3JhdGlvbnMoZGVjb3JhdGVPblRyZWVWaWV3LCBtZXNzYWdlcykpXG4gIH1cbiAgYXBwbHlEZWNvcmF0aW9ucyhkZWNvcmF0aW9uczogT2JqZWN0KSB7XG4gICAgY29uc3QgdHJlZVZpZXdFbGVtZW50ID0gVHJlZVZpZXcuZ2V0RWxlbWVudCgpXG4gICAgaWYgKCF0cmVlVmlld0VsZW1lbnQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRDYWNoZSA9IHt9XG4gICAgY29uc3QgYXBwbGllZERlY29yYXRpb25zID0ge31cblxuICAgIE9iamVjdC5rZXlzKHRoaXMuZGVjb3JhdGlvbnMpLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuZGVjb3JhdGlvbnMsIGZpbGVQYXRoKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICghZGVjb3JhdGlvbnNbZmlsZVBhdGhdKSB7XG4gICAgICAgIC8vIFJlbW92ZWRcbiAgICAgICAgY29uc3QgZWxlbWVudCA9XG4gICAgICAgICAgZWxlbWVudENhY2hlW2ZpbGVQYXRoXSB8fCAoZWxlbWVudENhY2hlW2ZpbGVQYXRoXSA9IFRyZWVWaWV3LmdldEVsZW1lbnRCeVBhdGgodHJlZVZpZXdFbGVtZW50LCBmaWxlUGF0aCkpXG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVEZWNvcmF0aW9uKGVsZW1lbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgT2JqZWN0LmtleXMoZGVjb3JhdGlvbnMpLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlY29yYXRpb25zLCBmaWxlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zdCBlbGVtZW50ID1cbiAgICAgICAgZWxlbWVudENhY2hlW2ZpbGVQYXRoXSB8fCAoZWxlbWVudENhY2hlW2ZpbGVQYXRoXSA9IFRyZWVWaWV3LmdldEVsZW1lbnRCeVBhdGgodHJlZVZpZXdFbGVtZW50LCBmaWxlUGF0aCkpXG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZURlY29yYXRpb24oZWxlbWVudCwgISF0aGlzLmRlY29yYXRpb25zW2ZpbGVQYXRoXSwgZGVjb3JhdGlvbnNbZmlsZVBhdGhdKVxuICAgICAgICBhcHBsaWVkRGVjb3JhdGlvbnNbZmlsZVBhdGhdID0gZGVjb3JhdGlvbnNbZmlsZVBhdGhdXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZGVjb3JhdGlvbnMgPSBhcHBsaWVkRGVjb3JhdGlvbnNcbiAgfVxuXG4gIGhhbmRsZURlY29yYXRpb24oZWxlbWVudDogSFRNTEVsZW1lbnQsIHVwZGF0ZTogYm9vbGVhbiA9IGZhbHNlLCBoaWdobGlnaHRzOiBUcmVlVmlld0hpZ2hsaWdodCkge1xuICAgIGxldCBkZWNvcmF0aW9uXG4gICAgaWYgKHVwZGF0ZSkge1xuICAgICAgZGVjb3JhdGlvbiA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignbGludGVyLWRlY29yYXRpb24nKVxuICAgIH1cbiAgICBpZiAoZGVjb3JhdGlvbikge1xuICAgICAgZGVjb3JhdGlvbi5jbGFzc05hbWUgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWNvcmF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGludGVyLWRlY29yYXRpb24nKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChkZWNvcmF0aW9uKVxuICAgIH1cbiAgICBpZiAoaGlnaGxpZ2h0cy5lcnJvcikge1xuICAgICAgZGVjb3JhdGlvbi5jbGFzc0xpc3QuYWRkKCdsaW50ZXItZXJyb3InKVxuICAgIH0gZWxzZSBpZiAoaGlnaGxpZ2h0cy53YXJuaW5nKSB7XG4gICAgICBkZWNvcmF0aW9uLmNsYXNzTGlzdC5hZGQoJ2xpbnRlci13YXJuaW5nJylcbiAgICB9IGVsc2UgaWYgKGhpZ2hsaWdodHMuaW5mbykge1xuICAgICAgZGVjb3JhdGlvbi5jbGFzc0xpc3QuYWRkKCdsaW50ZXItaW5mbycpXG4gICAgfVxuICB9XG4gIHJlbW92ZURlY29yYXRpb24oZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBkZWNvcmF0aW9uID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdsaW50ZXItZGVjb3JhdGlvbicpXG4gICAgaWYgKGRlY29yYXRpb24pIHtcbiAgICAgIGRlY29yYXRpb24ucmVtb3ZlKClcbiAgICB9XG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH1cbiAgc3RhdGljIGdldEVsZW1lbnQoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50cmVlLXZpZXcnKVxuICB9XG4gIHN0YXRpYyBnZXRFbGVtZW50QnlQYXRoKHBhcmVudDogSFRNTEVsZW1lbnQsIGZpbGVQYXRoOiBzdHJpbmcpOiA/SFRNTEVsZW1lbnQge1xuICAgIHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtcGF0aD0ke0NTUy5lc2NhcGUoZmlsZVBhdGgpfV1gKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJlZVZpZXdcbiJdfQ==