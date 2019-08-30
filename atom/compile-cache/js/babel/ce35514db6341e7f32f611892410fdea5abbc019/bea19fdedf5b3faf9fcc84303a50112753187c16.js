Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies

var _atom = require('atom');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomLinter = require('atom-linter');

var helper = _interopRequireWildcard(_atomLinter);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

'use babel';exports['default'] = {
  config: {
    customTags: {
      type: 'array',
      'default': [],
      items: {
        type: 'string'
      },
      description: 'List of YAML custom tags, each optionally followed by a space and the node kind (scalar, mapping, or sequence).'
    }
  },

  activate: function activate() {
    var _this = this;

    require('atom-package-deps').install('linter-js-yaml');

    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-js-yaml.customTags', function (customTags) {
      _this.Schema = _jsYaml2['default'].Schema.create(customTags.map(function (tag) {
        var typeInfo = tag.split(' ');
        return new _jsYaml2['default'].Type(typeInfo[0], { kind: typeInfo[1] || 'scalar' });
      }));
    }));
  },

  deactivate: function deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter: function provideLinter() {
    var _this2 = this;

    return {
      grammarScopes: ['source.yaml', 'source.yml'],
      scope: 'file',
      name: 'Js-YAML',
      lintsOnChange: true,
      lint: function lint(TextEditor) {
        if (!atom.workspace.isTextEditor(TextEditor)) {
          return null;
        }
        var filePath = TextEditor.getPath();
        if (!filePath) {
          // Invalid path
          return null;
        }
        var fileText = TextEditor.getText();

        var messages = [];
        var processMessage = function processMessage(severity, message) {
          var line = message.mark.line;

          // Workaround for https://github.com/nodeca/js-yaml/issues/218
          var maxLine = TextEditor.getLineCount() - 1;
          if (line > maxLine) {
            line = maxLine;
          }
          var column = message.mark.column;

          return {
            severity: severity,
            excerpt: message.reason,
            location: {
              file: filePath,
              position: helper.generateRange(TextEditor, line, column)
            }
          };
        };

        try {
          _jsYaml2['default'].safeLoadAll(fileText, function () {
            return {};
          }, {
            filename: _path2['default'].basename(filePath),
            schema: _this2.Schema,
            onWarning: function onWarning(warning) {
              messages.push(processMessage('warning', warning));
            }
          });
        } catch (error) {
          messages.push(processMessage('error', error));
        }

        return messages;
      }
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWpzLXlhbWwvbGliL2xpbnRlci1qcy15YW1sLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBR29DLE1BQU07O29CQUN6QixNQUFNOzs7OzBCQUNDLGFBQWE7O0lBQXpCLE1BQU07O3NCQUNELFNBQVM7Ozs7QUFOMUIsV0FBVyxDQUFDLHFCQVFHO0FBQ2IsUUFBTSxFQUFFO0FBQ04sY0FBVSxFQUFFO0FBQ1YsVUFBSSxFQUFFLE9BQU87QUFDYixpQkFBUyxFQUFFO0FBQ1gsV0FBSyxFQUFFO0FBQ0wsWUFBSSxFQUFFLFFBQVE7T0FDZjtBQUNELGlCQUFXLEVBQUUsaUhBQWlIO0tBQy9IO0dBQ0Y7O0FBRUQsVUFBUSxFQUFBLG9CQUFHOzs7QUFDVCxXQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFdkQsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQztBQUMvQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxVQUFDLFVBQVUsRUFBSztBQUN0RixZQUFLLE1BQU0sR0FBRyxvQkFBSyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHLEVBQUs7QUFDdkQsWUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoQyxlQUFPLElBQUksb0JBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztPQUN0RSxDQUFDLENBQUMsQ0FBQztLQUNMLENBQUMsQ0FBQyxDQUFDO0dBQ0w7O0FBRUQsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsUUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUM5Qjs7QUFFRCxlQUFhLEVBQUEseUJBQUc7OztBQUNkLFdBQU87QUFDTCxtQkFBYSxFQUFFLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztBQUM1QyxXQUFLLEVBQUUsTUFBTTtBQUNiLFVBQUksRUFBRSxTQUFTO0FBQ2YsbUJBQWEsRUFBRSxJQUFJO0FBQ25CLFVBQUksRUFBRSxjQUFDLFVBQVUsRUFBSztBQUNwQixZQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUU7QUFDNUMsaUJBQU8sSUFBSSxDQUFDO1NBQ2I7QUFDRCxZQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEMsWUFBSSxDQUFDLFFBQVEsRUFBRTs7QUFFYixpQkFBTyxJQUFJLENBQUM7U0FDYjtBQUNELFlBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFdEMsWUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFlBQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWMsQ0FBSSxRQUFRLEVBQUUsT0FBTyxFQUFLO2NBQ3RDLElBQUksR0FBSyxPQUFPLENBQUMsSUFBSSxDQUFyQixJQUFJOzs7QUFFVixjQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLGNBQUksSUFBSSxHQUFHLE9BQU8sRUFBRTtBQUNsQixnQkFBSSxHQUFHLE9BQU8sQ0FBQztXQUNoQjtjQUNPLE1BQU0sR0FBSyxPQUFPLENBQUMsSUFBSSxDQUF2QixNQUFNOztBQUNkLGlCQUFPO0FBQ0wsb0JBQVEsRUFBUixRQUFRO0FBQ1IsbUJBQU8sRUFBRSxPQUFPLENBQUMsTUFBTTtBQUN2QixvQkFBUSxFQUFFO0FBQ1Isa0JBQUksRUFBRSxRQUFRO0FBQ2Qsc0JBQVEsRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDO2FBQ3pEO1dBQ0YsQ0FBQztTQUNILENBQUM7O0FBRUYsWUFBSTtBQUNGLDhCQUFLLFdBQVcsQ0FBQyxRQUFRLEVBQUU7bUJBQU8sRUFBRTtXQUFDLEVBQUU7QUFDckMsb0JBQVEsRUFBRSxrQkFBSyxRQUFRLENBQUMsUUFBUSxDQUFDO0FBQ2pDLGtCQUFNLEVBQUUsT0FBSyxNQUFNO0FBQ25CLHFCQUFTLEVBQUUsbUJBQUMsT0FBTyxFQUFLO0FBQ3RCLHNCQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUNuRDtXQUNGLENBQUMsQ0FBQztTQUNKLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDZCxrQkFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDL0M7O0FBRUQsZUFBTyxRQUFRLENBQUM7T0FDakI7S0FDRixDQUFDO0dBQ0g7Q0FDRiIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci1qcy15YW1sL2xpYi9saW50ZXItanMteWFtbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L2V4dGVuc2lvbnMsIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBoZWxwZXIgZnJvbSAnYXRvbS1saW50ZXInO1xuaW1wb3J0IHlhbWwgZnJvbSAnanMteWFtbCc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY29uZmlnOiB7XG4gICAgY3VzdG9tVGFnczoge1xuICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgaXRlbXM6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICB9LFxuICAgICAgZGVzY3JpcHRpb246ICdMaXN0IG9mIFlBTUwgY3VzdG9tIHRhZ3MsIGVhY2ggb3B0aW9uYWxseSBmb2xsb3dlZCBieSBhIHNwYWNlIGFuZCB0aGUgbm9kZSBraW5kIChzY2FsYXIsIG1hcHBpbmcsIG9yIHNlcXVlbmNlKS4nLFxuICAgIH0sXG4gIH0sXG5cbiAgYWN0aXZhdGUoKSB7XG4gICAgcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcHMnKS5pbnN0YWxsKCdsaW50ZXItanMteWFtbCcpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1qcy15YW1sLmN1c3RvbVRhZ3MnLCAoY3VzdG9tVGFncykgPT4ge1xuICAgICAgdGhpcy5TY2hlbWEgPSB5YW1sLlNjaGVtYS5jcmVhdGUoY3VzdG9tVGFncy5tYXAoKHRhZykgPT4ge1xuICAgICAgICBjb25zdCB0eXBlSW5mbyA9IHRhZy5zcGxpdCgnICcpO1xuICAgICAgICByZXR1cm4gbmV3IHlhbWwuVHlwZSh0eXBlSW5mb1swXSwgeyBraW5kOiB0eXBlSW5mb1sxXSB8fCAnc2NhbGFyJyB9KTtcbiAgICAgIH0pKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgZGVhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9LFxuXG4gIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFsnc291cmNlLnlhbWwnLCAnc291cmNlLnltbCddLFxuICAgICAgc2NvcGU6ICdmaWxlJyxcbiAgICAgIG5hbWU6ICdKcy1ZQU1MJyxcbiAgICAgIGxpbnRzT25DaGFuZ2U6IHRydWUsXG4gICAgICBsaW50OiAoVGV4dEVkaXRvcikgPT4ge1xuICAgICAgICBpZiAoIWF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihUZXh0RWRpdG9yKSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gVGV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgICAgICAvLyBJbnZhbGlkIHBhdGhcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxlVGV4dCA9IFRleHRFZGl0b3IuZ2V0VGV4dCgpO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gW107XG4gICAgICAgIGNvbnN0IHByb2Nlc3NNZXNzYWdlID0gKHNldmVyaXR5LCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgbGV0IHsgbGluZSB9ID0gbWVzc2FnZS5tYXJrO1xuICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9pc3N1ZXMvMjE4XG4gICAgICAgICAgY29uc3QgbWF4TGluZSA9IFRleHRFZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxO1xuICAgICAgICAgIGlmIChsaW5lID4gbWF4TGluZSkge1xuICAgICAgICAgICAgbGluZSA9IG1heExpbmU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHsgY29sdW1uIH0gPSBtZXNzYWdlLm1hcms7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNldmVyaXR5LFxuICAgICAgICAgICAgZXhjZXJwdDogbWVzc2FnZS5yZWFzb24sXG4gICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICBmaWxlOiBmaWxlUGF0aCxcbiAgICAgICAgICAgICAgcG9zaXRpb246IGhlbHBlci5nZW5lcmF0ZVJhbmdlKFRleHRFZGl0b3IsIGxpbmUsIGNvbHVtbiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB5YW1sLnNhZmVMb2FkQWxsKGZpbGVUZXh0LCAoKSA9PiAoe30pLCB7XG4gICAgICAgICAgICBmaWxlbmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXG4gICAgICAgICAgICBzY2hlbWE6IHRoaXMuU2NoZW1hLFxuICAgICAgICAgICAgb25XYXJuaW5nOiAod2FybmluZykgPT4ge1xuICAgICAgICAgICAgICBtZXNzYWdlcy5wdXNoKHByb2Nlc3NNZXNzYWdlKCd3YXJuaW5nJywgd2FybmluZykpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKHByb2Nlc3NNZXNzYWdlKCdlcnJvcicsIGVycm9yKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWVzc2FnZXM7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19