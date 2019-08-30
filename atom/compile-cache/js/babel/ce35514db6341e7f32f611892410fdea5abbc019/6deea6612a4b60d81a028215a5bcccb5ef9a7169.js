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

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _underscorePlus = require('underscore-plus');

'use babel';

var Function = require('loophole').Function;
var REGEXP_LINE = /(([\$\w]+[\w-]*)|([.:;'"[{( ]+))$/g;

var Provider = (function () {
  function Provider() {
    _classCallCheck(this, Provider);

    this.disposables = [];

    this.force = false;

    // automcomplete-plus
    this.selector = '.source.js';
    this.disableForSelector = '.source.js .comment';
    this.inclusionPriority = 1;
    this.suggestionPriority = _atomTernjsPackageConfig2['default'].options.snippetsFirst ? null : 2;
    this.excludeLowerPriority = _atomTernjsPackageConfig2['default'].options.excludeLowerPriorityProviders;

    this.suggestionsArr = null;
    this.suggestion = null;
    this.suggestionClone = null;
  }

  _createClass(Provider, [{
    key: 'init',
    value: function init() {

      this.registerCommands();
    }
  }, {
    key: 'registerCommands',
    value: function registerCommands() {

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:startCompletion', this.forceCompletion.bind(this)));
    }
  }, {
    key: 'isValidPrefix',
    value: function isValidPrefix(prefix, prefixLast) {

      if (prefixLast === undefined) {

        return false;
      }

      if (prefixLast === '\.') {

        return true;
      }

      if (prefixLast.match(/;|\s/)) {

        return false;
      }

      if (prefix.length > 1) {

        prefix = '_' + prefix;
      }

      try {

        new Function('var ' + prefix)();
      } catch (e) {

        return false;
      }

      return true;
    }
  }, {
    key: 'checkPrefix',
    value: function checkPrefix(prefix) {

      if (/(\(|\s|;|\.|\"|\')$/.test(prefix) || prefix.replace(/\s/g, '').length === 0) {

        return '';
      }

      return prefix;
    }
  }, {
    key: 'getPrefix',
    value: function getPrefix(editor, bufferPosition) {

      var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      var matches = line.match(REGEXP_LINE);

      return matches && matches[0];
    }
  }, {
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var _this = this;

      var editor = _ref.editor;
      var bufferPosition = _ref.bufferPosition;
      var scopeDescriptor = _ref.scopeDescriptor;
      var prefix = _ref.prefix;
      var activatedManually = _ref.activatedManually;

      if (!_atomTernjsManager2['default'].client) {

        return [];
      }

      var tempPrefix = this.getPrefix(editor, bufferPosition) || prefix;

      if (!this.isValidPrefix(tempPrefix, tempPrefix[tempPrefix.length - 1]) && !this.force && !activatedManually) {

        return [];
      }

      return new Promise(function (resolve) {

        prefix = _this.checkPrefix(tempPrefix);

        _atomTernjsManager2['default'].client.update(editor).then(function (data) {

          if (!data) {

            return resolve([]);
          }

          _atomTernjsManager2['default'].client.completions(atom.project.relativizePath(editor.getURI())[1], {

            line: bufferPosition.row,
            ch: bufferPosition.column

          }).then(function (data) {

            if (!data) {

              return resolve([]);
            }

            if (!data.completions.length) {

              return resolve([]);
            }

            _this.suggestionsArr = [];

            var scopesPath = scopeDescriptor.getScopesArray();
            var isInFunDef = scopesPath.indexOf('meta.function.js') > -1;

            for (var obj of data.completions) {

              var completion = (0, _atomTernjsHelper.formatTypeCompletion)(obj, data.isProperty, data.isObjectKey, isInFunDef);

              _this.suggestion = {

                text: completion.name,
                replacementPrefix: prefix,
                className: null,
                type: completion._typeSelf,
                leftLabel: completion.leftLabel,
                snippet: completion._snippet,
                displayText: completion._displayText,
                description: completion.doc || null,
                descriptionMoreURL: completion.url || null
              };

              if (_atomTernjsPackageConfig2['default'].options.useSnippetsAndFunction && completion._hasParams) {

                _this.suggestionClone = (0, _underscorePlus.clone)(_this.suggestion);
                _this.suggestionClone.type = 'snippet';

                if (completion._hasParams) {

                  _this.suggestion.snippet = completion.name + '(${0:})';
                } else {

                  _this.suggestion.snippet = completion.name + '()';
                }

                _this.suggestionsArr.push(_this.suggestion);
                _this.suggestionsArr.push(_this.suggestionClone);
              } else {

                _this.suggestionsArr.push(_this.suggestion);
              }
            }

            resolve(_this.suggestionsArr);
          })['catch'](function (err) {

            console.error(err);
            resolve([]);
          });
        })['catch'](function () {

          resolve([]);
        });
      });
    }
  }, {
    key: 'forceCompletion',
    value: function forceCompletion() {

      this.force = true;
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
      this.force = false;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];
    }
  }]);

  return Provider;
})();

exports['default'] = new Provider();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7aUNBS29CLHVCQUF1Qjs7Ozt1Q0FDakIsOEJBQThCOzs7O2dDQUlqRCxzQkFBc0I7OzhCQUd0QixpQkFBaUI7O0FBYnhCLFdBQVcsQ0FBQzs7QUFFWixJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQzlDLElBQU0sV0FBVyxHQUFHLG9DQUFvQyxDQUFDOztJQVluRCxRQUFRO0FBRUQsV0FGUCxRQUFRLEdBRUU7MEJBRlYsUUFBUTs7QUFJVixRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7OztBQUduQixRQUFJLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQztBQUM3QixRQUFJLENBQUMsa0JBQWtCLEdBQUcscUJBQXFCLENBQUM7QUFDaEQsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMzQixRQUFJLENBQUMsa0JBQWtCLEdBQUcscUNBQWMsT0FBTyxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3pFLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxxQ0FBYyxPQUFPLENBQUMsNkJBQTZCLENBQUM7O0FBRWhGLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0dBQzdCOztlQWxCRyxRQUFROztXQW9CUixnQkFBRzs7QUFFTCxVQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUN6Qjs7O1dBRWUsNEJBQUc7O0FBRWpCLFVBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUks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QUFtQixFQUFFLENBQUMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0FBQy9HLFVBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCOzs7V0FFTSxtQkFBRzs7QUFFUix3Q0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDN0IsVUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7S0FDdkI7OztTQXRNRyxRQUFROzs7cUJBeU1DLElBQUksUUFBUSxFQUFFIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IEZ1bmN0aW9uID0gcmVxdWlyZSgnbG9vcGhvbGUnKS5GdW5jdGlvbjtcbmNvbnN0IFJFR0VYUF9MSU5FID0gLygoW1xcJFxcd10rW1xcdy1dKil8KFsuOjsnXCJbeyggXSspKSQvZztcblxuaW1wb3J0IG1hbmFnZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1tYW5hZ2VyJztcbmltcG9ydCBwYWNrYWdlQ29uZmlnIGZyb20gJy4vYXRvbS10ZXJuanMtcGFja2FnZS1jb25maWcnO1xuaW1wb3J0IHtcbiAgZGlzcG9zZUFsbCxcbiAgZm9ybWF0VHlwZUNvbXBsZXRpb25cbn0gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuaW1wb3J0IHtcbiAgY2xvbmVcbn0gZnJvbSAndW5kZXJzY29yZS1wbHVzJztcblxuY2xhc3MgUHJvdmlkZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IFtdO1xuXG4gICAgdGhpcy5mb3JjZSA9IGZhbHNlO1xuXG4gICAgLy8gYXV0b21jb21wbGV0ZS1wbHVzXG4gICAgdGhpcy5zZWxlY3RvciA9ICcuc291cmNlLmpzJztcbiAgICB0aGlzLmRpc2FibGVGb3JTZWxlY3RvciA9ICcuc291cmNlLmpzIC5jb21tZW50JztcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IHBhY2thZ2VDb25maWcub3B0aW9ucy5zbmlwcGV0c0ZpcnN0ID8gbnVsbCA6IDI7XG4gICAgdGhpcy5leGNsdWRlTG93ZXJQcmlvcml0eSA9IHBhY2thZ2VDb25maWcub3B0aW9ucy5leGNsdWRlTG93ZXJQcmlvcml0eVByb3ZpZGVycztcblxuICAgIHRoaXMuc3VnZ2VzdGlvbnNBcnIgPSBudWxsO1xuICAgIHRoaXMuc3VnZ2VzdGlvbiA9IG51bGw7XG4gICAgdGhpcy5zdWdnZXN0aW9uQ2xvbmUgPSBudWxsO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIHRoaXMucmVnaXN0ZXJDb21tYW5kcygpO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kcygpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdhdG9tLXRlcm5qczpzdGFydENvbXBsZXRpb24nLCB0aGlzLmZvcmNlQ29tcGxldGlvbi5iaW5kKHRoaXMpKSk7XG4gIH1cblxuICBpc1ZhbGlkUHJlZml4KHByZWZpeCwgcHJlZml4TGFzdCkge1xuXG4gICAgaWYgKHByZWZpeExhc3QgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHByZWZpeExhc3QgPT09ICdcXC4nKSB7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwcmVmaXhMYXN0Lm1hdGNoKC87fFxccy8pKSB7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAocHJlZml4Lmxlbmd0aCA+IDEpIHtcblxuICAgICAgcHJlZml4ID0gYF8ke3ByZWZpeH1gO1xuICAgIH1cblxuICAgIHRyeSB7XG5cbiAgICAgIChuZXcgRnVuY3Rpb24oYHZhciAke3ByZWZpeH1gKSkoKTtcblxuICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY2hlY2tQcmVmaXgocHJlZml4KSB7XG5cbiAgICBpZiAoXG4gICAgICAvKFxcKHxcXHN8O3xcXC58XFxcInxcXCcpJC8udGVzdChwcmVmaXgpIHx8XG4gICAgICBwcmVmaXgucmVwbGFjZSgvXFxzL2csICcnKS5sZW5ndGggPT09IDBcbiAgICApIHtcblxuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVmaXg7XG4gIH1cblxuICBnZXRQcmVmaXgoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikge1xuXG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG4gICAgY29uc3QgbWF0Y2hlcyA9IGxpbmUubWF0Y2goUkVHRVhQX0xJTkUpO1xuXG4gICAgcmV0dXJuIG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzY29wZURlc2NyaXB0b3IsIHByZWZpeCwgYWN0aXZhdGVkTWFudWFsbHl9KSB7XG5cbiAgICBpZiAoIW1hbmFnZXIuY2xpZW50KSB7XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZW1wUHJlZml4ID0gdGhpcy5nZXRQcmVmaXgoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgfHwgcHJlZml4O1xuXG4gICAgaWYgKCF0aGlzLmlzVmFsaWRQcmVmaXgodGVtcFByZWZpeCwgdGVtcFByZWZpeFt0ZW1wUHJlZml4Lmxlbmd0aCAtIDFdKSAmJiAhdGhpcy5mb3JjZSAmJiAhYWN0aXZhdGVkTWFudWFsbHkpIHtcblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXG4gICAgICBwcmVmaXggPSB0aGlzLmNoZWNrUHJlZml4KHRlbXBQcmVmaXgpO1xuXG4gICAgICBtYW5hZ2VyLmNsaWVudC51cGRhdGUoZWRpdG9yKS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG5cbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XG4gICAgICAgIH1cblxuICAgICAgICBtYW5hZ2VyLmNsaWVudC5jb21wbGV0aW9ucyhhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZWRpdG9yLmdldFVSSSgpKVsxXSwge1xuXG4gICAgICAgICAgbGluZTogYnVmZmVyUG9zaXRpb24ucm93LFxuICAgICAgICAgIGNoOiBidWZmZXJQb3NpdGlvbi5jb2x1bW5cblxuICAgICAgICB9KS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgICBpZiAoIWRhdGEpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZGF0YS5jb21wbGV0aW9ucy5sZW5ndGgpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNBcnIgPSBbXTtcblxuICAgICAgICAgIGxldCBzY29wZXNQYXRoID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCk7XG4gICAgICAgICAgbGV0IGlzSW5GdW5EZWYgPSBzY29wZXNQYXRoLmluZGV4T2YoJ21ldGEuZnVuY3Rpb24uanMnKSA+IC0xO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBvYmogb2YgZGF0YS5jb21wbGV0aW9ucykge1xuXG4gICAgICAgICAgICBjb25zdCBjb21wbGV0aW9uID0gZm9ybWF0VHlwZUNvbXBsZXRpb24ob2JqLCBkYXRhLmlzUHJvcGVydHksIGRhdGEuaXNPYmplY3RLZXksIGlzSW5GdW5EZWYpO1xuXG4gICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb24gPSB7XG5cbiAgICAgICAgICAgICAgdGV4dDogY29tcGxldGlvbi5uYW1lLFxuICAgICAgICAgICAgICByZXBsYWNlbWVudFByZWZpeDogcHJlZml4LFxuICAgICAgICAgICAgICBjbGFzc05hbWU6IG51bGwsXG4gICAgICAgICAgICAgIHR5cGU6IGNvbXBsZXRpb24uX3R5cGVTZWxmLFxuICAgICAgICAgICAgICBsZWZ0TGFiZWw6IGNvbXBsZXRpb24ubGVmdExhYmVsLFxuICAgICAgICAgICAgICBzbmlwcGV0OiBjb21wbGV0aW9uLl9zbmlwcGV0LFxuICAgICAgICAgICAgICBkaXNwbGF5VGV4dDogY29tcGxldGlvbi5fZGlzcGxheVRleHQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBjb21wbGV0aW9uLmRvYyB8fCBudWxsLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IGNvbXBsZXRpb24udXJsIHx8IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwYWNrYWdlQ29uZmlnLm9wdGlvbnMudXNlU25pcHBldHNBbmRGdW5jdGlvbiAmJiBjb21wbGV0aW9uLl9oYXNQYXJhbXMpIHtcblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25DbG9uZSA9IGNsb25lKHRoaXMuc3VnZ2VzdGlvbik7XG4gICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbkNsb25lLnR5cGUgPSAnc25pcHBldCc7XG5cbiAgICAgICAgICAgICAgaWYgKGNvbXBsZXRpb24uX2hhc1BhcmFtcykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uLnNuaXBwZXQgPSBgJHtjb21wbGV0aW9uLm5hbWV9KCRcXHswOlxcfSlgO1xuXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb24uc25pcHBldCA9IGAke2NvbXBsZXRpb24ubmFtZX0oKWA7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0Fyci5wdXNoKHRoaXMuc3VnZ2VzdGlvbkNsb25lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKHRoaXMuc3VnZ2VzdGlvbnNBcnIpO1xuXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHtcblxuICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZm9yY2VDb21wbGV0aW9uKCkge1xuXG4gICAgdGhpcy5mb3JjZSA9IHRydWU7XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJyk7XG4gICAgdGhpcy5mb3JjZSA9IGZhbHNlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICAgIGRpc3Bvc2VBbGwodGhpcy5kaXNwb3NhYmxlcyk7XG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IFtdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBQcm92aWRlcigpO1xuIl19