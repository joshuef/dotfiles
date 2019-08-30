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

              obj = (0, _atomTernjsHelper.formatTypeCompletion)(obj, data.isProperty, data.isObjectKey, isInFunDef);

              _this.suggestion = {

                text: obj.name,
                replacementPrefix: prefix,
                className: null,
                type: obj._typeSelf,
                leftLabel: obj.leftLabel,
                snippet: obj._snippet,
                displayText: obj._displayText,
                description: obj.doc || null,
                descriptionMoreURL: obj.url || null
              };

              if (_atomTernjsPackageConfig2['default'].options.useSnippetsAndFunction && obj._hasParams) {

                _this.suggestionClone = (0, _underscorePlus.clone)(_this.suggestion);
                _this.suggestionClone.type = 'snippet';

                if (obj._hasParams) {

                  _this.suggestion.snippet = obj.name + '(${0:})';
                } else {

                  _this.suggestion.snippet = obj.name + '()';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1wcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O2lDQUtvQix1QkFBdUI7Ozs7dUNBQ2pCLDhCQUE4Qjs7OztnQ0FJakQsc0JBQXNCOzs4QkFHdEIsaUJBQWlCOztBQWJ4QixXQUFXLENBQUM7O0FBRVosSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUM5QyxJQUFNLFdBQVcsR0FBRyxvQ0FBb0MsQ0FBQzs7SUFZbkQsUUFBUTtBQUVELFdBRlAsUUFBUSxHQUVFOzBCQUZWLFFBQVE7O0FBSVYsUUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXRCLFFBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDOzs7QUFHbkIsUUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7QUFDN0IsUUFBSSxDQUFDLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDO0FBQ2hELFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDM0IsUUFBSSxDQUFDLGtCQUFrQixHQUFHLHFDQUFjLE9BQU8sQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN6RSxRQUFJLENBQUMsb0JBQW9CLEdBQUcscUNBQWMsT0FBTyxDQUFDLDZCQUE2QixDQUFDOztBQUVoRixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixRQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztHQUM3Qjs7ZUFsQkcsUUFBUTs7V0FvQlIsZ0JBQUc7O0FBRUwsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7S0FDekI7OztXQUVlLDRCQUFHOztBQUVqQixVQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFB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LEVBQUUsNEJBQTRCLENBQUMsQ0FBQztBQUMvRyxVQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztLQUNwQjs7O1dBRU0sbUJBQUc7O0FBRVIsd0NBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzdCLFVBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0tBQ3ZCOzs7U0F0TUcsUUFBUTs7O3FCQXlNQyxJQUFJLFFBQVEsRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuY29uc3QgRnVuY3Rpb24gPSByZXF1aXJlKCdsb29waG9sZScpLkZ1bmN0aW9uO1xuY29uc3QgUkVHRVhQX0xJTkUgPSAvKChbXFwkXFx3XStbXFx3LV0qKXwoWy46OydcIlt7KCBdKykpJC9nO1xuXG5pbXBvcnQgbWFuYWdlciBmcm9tICcuL2F0b20tdGVybmpzLW1hbmFnZXInO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQge1xuICBkaXNwb3NlQWxsLFxuICBmb3JtYXRUeXBlQ29tcGxldGlvblxufSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5pbXBvcnQge1xuICBjbG9uZVxufSBmcm9tICd1bmRlcnNjb3JlLXBsdXMnO1xuXG5jbGFzcyBQcm92aWRlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG5cbiAgICB0aGlzLmZvcmNlID0gZmFsc2U7XG5cbiAgICAvLyBhdXRvbWNvbXBsZXRlLXBsdXNcbiAgICB0aGlzLnNlbGVjdG9yID0gJy5zb3VyY2UuanMnO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gJy5zb3VyY2UuanMgLmNvbW1lbnQnO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgIHRoaXMuc3VnZ2VzdGlvblByaW9yaXR5ID0gcGFja2FnZUNvbmZpZy5vcHRpb25zLnNuaXBwZXRzRmlyc3QgPyBudWxsIDogMjtcbiAgICB0aGlzLmV4Y2x1ZGVMb3dlclByaW9yaXR5ID0gcGFja2FnZUNvbmZpZy5vcHRpb25zLmV4Y2x1ZGVMb3dlclByaW9yaXR5UHJvdmlkZXJzO1xuXG4gICAgdGhpcy5zdWdnZXN0aW9uc0FyciA9IG51bGw7XG4gICAgdGhpcy5zdWdnZXN0aW9uID0gbnVsbDtcbiAgICB0aGlzLnN1Z2dlc3Rpb25DbG9uZSA9IG51bGw7XG4gIH1cblxuICBpbml0KCkge1xuXG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmRzKCk7XG4gIH1cblxuICByZWdpc3RlckNvbW1hbmRzKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOnN0YXJ0Q29tcGxldGlvbicsIHRoaXMuZm9yY2VDb21wbGV0aW9uLmJpbmQodGhpcykpKTtcbiAgfVxuXG4gIGlzVmFsaWRQcmVmaXgocHJlZml4LCBwcmVmaXhMYXN0KSB7XG5cbiAgICBpZiAocHJlZml4TGFzdCA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAocHJlZml4TGFzdCA9PT0gJ1xcLicpIHtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByZWZpeExhc3QubWF0Y2goLzt8XFxzLykpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChwcmVmaXgubGVuZ3RoID4gMSkge1xuXG4gICAgICBwcmVmaXggPSBgXyR7cHJlZml4fWA7XG4gICAgfVxuXG4gICAgdHJ5IHtcblxuICAgICAgKG5ldyBGdW5jdGlvbihgdmFyICR7cHJlZml4fWApKSgpO1xuXG4gICAgfSBjYXRjaCAoZSkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjaGVja1ByZWZpeChwcmVmaXgpIHtcblxuICAgIGlmIChcbiAgICAgIC8oXFwofFxcc3w7fFxcLnxcXFwifFxcJykkLy50ZXN0KHByZWZpeCkgfHxcbiAgICAgIHByZWZpeC5yZXBsYWNlKC9cXHMvZywgJycpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuXG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZWZpeDtcbiAgfVxuXG4gIGdldFByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB7XG5cbiAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKTtcbiAgICBjb25zdCBtYXRjaGVzID0gbGluZS5tYXRjaChSRUdFWFBfTElORSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlcyAmJiBtYXRjaGVzWzBdO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoe2VkaXRvciwgYnVmZmVyUG9zaXRpb24sIHNjb3BlRGVzY3JpcHRvciwgcHJlZml4LCBhY3RpdmF0ZWRNYW51YWxseX0pIHtcblxuICAgIGlmICghbWFuYWdlci5jbGllbnQpIHtcblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbXBQcmVmaXggPSB0aGlzLmdldFByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB8fCBwcmVmaXg7XG5cbiAgICBpZiAoIXRoaXMuaXNWYWxpZFByZWZpeCh0ZW1wUHJlZml4LCB0ZW1wUHJlZml4W3RlbXBQcmVmaXgubGVuZ3RoIC0gMV0pICYmICF0aGlzLmZvcmNlICYmICFhY3RpdmF0ZWRNYW51YWxseSkge1xuXG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cbiAgICAgIHByZWZpeCA9IHRoaXMuY2hlY2tQcmVmaXgodGVtcFByZWZpeCk7XG5cbiAgICAgIG1hbmFnZXIuY2xpZW50LnVwZGF0ZShlZGl0b3IpLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICBpZiAoIWRhdGEpIHtcblxuICAgICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1hbmFnZXIuY2xpZW50LmNvbXBsZXRpb25zKGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpWzFdLCB7XG5cbiAgICAgICAgICBsaW5lOiBidWZmZXJQb3NpdGlvbi5yb3csXG4gICAgICAgICAgY2g6IGJ1ZmZlclBvc2l0aW9uLmNvbHVtblxuXG4gICAgICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICAgIGlmICghZGF0YSkge1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFkYXRhLmNvbXBsZXRpb25zLmxlbmd0aCkge1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0FyciA9IFtdO1xuXG4gICAgICAgICAgbGV0IHNjb3Blc1BhdGggPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKTtcbiAgICAgICAgICBsZXQgaXNJbkZ1bkRlZiA9IHNjb3Blc1BhdGguaW5kZXhPZignbWV0YS5mdW5jdGlvbi5qcycpID4gLTE7XG5cbiAgICAgICAgICBmb3IgKGxldCBvYmogb2YgZGF0YS5jb21wbGV0aW9ucykge1xuXG4gICAgICAgICAgICBvYmogPSBmb3JtYXRUeXBlQ29tcGxldGlvbihvYmosIGRhdGEuaXNQcm9wZXJ0eSwgZGF0YS5pc09iamVjdEtleSwgaXNJbkZ1bkRlZik7XG5cbiAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbiA9IHtcblxuICAgICAgICAgICAgICB0ZXh0OiBvYmoubmFtZSxcbiAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeCxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiBudWxsLFxuICAgICAgICAgICAgICB0eXBlOiBvYmouX3R5cGVTZWxmLFxuICAgICAgICAgICAgICBsZWZ0TGFiZWw6IG9iai5sZWZ0TGFiZWwsXG4gICAgICAgICAgICAgIHNuaXBwZXQ6IG9iai5fc25pcHBldCxcbiAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IG9iai5fZGlzcGxheVRleHQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBvYmouZG9jIHx8IG51bGwsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogb2JqLnVybCB8fCBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAocGFja2FnZUNvbmZpZy5vcHRpb25zLnVzZVNuaXBwZXRzQW5kRnVuY3Rpb24gJiYgb2JqLl9oYXNQYXJhbXMpIHtcblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25DbG9uZSA9IGNsb25lKHRoaXMuc3VnZ2VzdGlvbik7XG4gICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbkNsb25lLnR5cGUgPSAnc25pcHBldCc7XG5cbiAgICAgICAgICAgICAgaWYgKG9iai5faGFzUGFyYW1zKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb24uc25pcHBldCA9IGAke29iai5uYW1lfSgkXFx7MDpcXH0pYDtcblxuICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uLnNuaXBwZXQgPSBgJHtvYmoubmFtZX0oKWA7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0Fyci5wdXNoKHRoaXMuc3VnZ2VzdGlvbkNsb25lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKHRoaXMuc3VnZ2VzdGlvbnNBcnIpO1xuXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHtcblxuICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZm9yY2VDb21wbGV0aW9uKCkge1xuXG4gICAgdGhpcy5mb3JjZSA9IHRydWU7XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJyk7XG4gICAgdGhpcy5mb3JjZSA9IGZhbHNlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICAgIGRpc3Bvc2VBbGwodGhpcy5kaXNwb3NhYmxlcyk7XG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IFtdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBQcm92aWRlcigpO1xuIl19