Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsPackageConfig = require('./atom-ternjs-package-config');

var _atomTernjsPackageConfig2 = _interopRequireDefault(_atomTernjsPackageConfig);

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _servicesNavigation = require('./services/navigation');

var _servicesNavigation2 = _interopRequireDefault(_servicesNavigation);

var _servicesDebug = require('./services/debug');

'use babel';

var Client = (function () {
  function Client(projectDir) {
    _classCallCheck(this, Client);

    this.projectDir = projectDir;
    // collection files the server currently holds in its set of analyzed files
    this.analyzedFiles = [];
  }

  _createClass(Client, [{
    key: 'completions',
    value: function completions(file, end) {

      return this.post('query', {

        query: {

          type: 'completions',
          file: _path2['default'].normalize(file),
          end: end,
          types: true,
          includeKeywords: true,
          sort: _atomTernjsPackageConfig2['default'].options.sort,
          guess: _atomTernjsPackageConfig2['default'].options.guess,
          docs: _atomTernjsPackageConfig2['default'].options.documentation,
          urls: _atomTernjsPackageConfig2['default'].options.urls,
          origins: _atomTernjsPackageConfig2['default'].options.origins,
          lineCharPositions: true,
          caseInsensitive: _atomTernjsPackageConfig2['default'].options.caseInsensitive
        }
      });
    }
  }, {
    key: 'documentation',
    value: function documentation(file, end) {

      return this.post('query', {

        query: {

          type: 'documentation',
          file: _path2['default'].normalize(file),
          end: end
        }
      });
    }
  }, {
    key: 'refs',
    value: function refs(file, end) {

      return this.post('query', {

        query: {

          type: 'refs',
          file: _path2['default'].normalize(file),
          end: end
        }
      });
    }
  }, {
    key: 'updateFull',
    value: function updateFull(editor) {

      return this.post('query', { files: [{

          type: 'full',
          name: _path2['default'].normalize(atom.project.relativizePath(editor.getURI())[1]),
          text: editor.getText()
        }] });
    }
  }, {
    key: 'updatePart',
    value: function updatePart(editor, start, text) {

      return this.post('query', [{

        type: 'full',
        name: _path2['default'].normalize(atom.project.relativizePath(editor.getURI())[1]),
        offset: {

          line: start,
          ch: 0
        },
        text: editor.getText()
      }]);
    }
  }, {
    key: 'update',
    value: function update(editor) {
      var _this = this;

      var buffer = editor.getBuffer();

      if (!buffer.isModified()) {

        return Promise.resolve({});
      }

      var uRI = editor.getURI();

      if (!uRI) {

        return Promise.reject({ type: 'info', message: _servicesDebug.messages.noURI });
      }

      var file = _path2['default'].normalize(atom.project.relativizePath(uRI)[1]);

      // check if this file is excluded via dontLoad
      if (_atomTernjsManager2['default'].server && _atomTernjsManager2['default'].server.dontLoad(file)) {

        return Promise.resolve({});
      }

      // do not request files if we already know it is registered
      if (this.analyzedFiles.includes(file)) {

        return this.updateFull(editor);
      }

      // check if the file is registered, else return
      return this.files().then(function (data) {

        var files = data.files;

        if (files) {

          files.forEach(function (file) {
            return file = _path2['default'].normalize(file);
          });
          _this.analyzedFiles = files;
        }

        var registered = files && files.includes(file);

        if (registered) {

          // const buffer = editor.getBuffer();
          // if buffer.getMaxCharacterIndex() > 5000
          //   start = 0
          //   end = 0
          //   text = ''
          //   for diff in editorMeta.diffs
          //     start = Math.max(0, diff.oldRange.start.row - 50)
          //     end = Math.min(buffer.getLineCount(), diff.oldRange.end.row + 5)
          //     text = buffer.getTextInRange([[start, 0], [end, buffer.lineLengthForRow(end)]])
          //   promise = this.updatePart(editor, start, text)
          // else
          return _this.updateFull(editor);
        } else {

          return Promise.resolve({});
        }
      })['catch'](function (err) {

        console.error(err);
      });
    }
  }, {
    key: 'rename',
    value: function rename(file, end, newName) {

      return this.post('query', {

        query: {

          type: 'rename',
          file: _path2['default'].normalize(file),
          end: end,
          newName: newName
        }
      });
    }
  }, {
    key: 'type',
    value: function type(editor, position) {

      var file = _path2['default'].normalize(atom.project.relativizePath(editor.getURI())[1]);
      var end = {

        line: position.row,
        ch: position.column
      };

      return this.post('query', {

        query: {

          type: 'type',
          file: file,
          end: end,
          preferFunction: true
        }
      });
    }
  }, {
    key: 'definition',
    value: function definition() {

      var editor = atom.workspace.getActiveTextEditor();
      var cursor = editor.getLastCursor();
      var position = cursor.getBufferPosition();

      var _atom$project$relativizePath = atom.project.relativizePath(editor.getURI());

      var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 2);

      var project = _atom$project$relativizePath2[0];
      var file = _atom$project$relativizePath2[1];

      var end = {

        line: position.row,
        ch: position.column
      };

      return this.post('query', {

        query: {

          type: 'definition',
          file: _path2['default'].normalize(file),
          end: end
        }

      }).then(function (data) {

        if (data && data.start) {

          if (_servicesNavigation2['default'].set(data)) {

            var path_to_go = _path2['default'].isAbsolute(data.file) ? data.file : project + '/' + data.file;
            (0, _atomTernjsHelper.openFileAndGoTo)(data.start, path_to_go);
          }
        }
      })['catch'](function (err) {

        console.error(err);
      });
    }
  }, {
    key: 'getDefinition',
    value: function getDefinition(file, range) {
      return this.post('query', {
        query: {
          type: 'definition',
          file: _path2['default'].normalize(file),
          start: {
            line: range.start.row,
            ch: range.start.column
          },
          end: {
            line: range.end.row,
            ch: range.end.column
          }
        }
      });
    }
  }, {
    key: 'files',
    value: function files() {

      return this.post('query', {

        query: {

          type: 'files'
        }

      }).then(function (data) {

        return data;
      });
    }
  }, {
    key: 'post',
    value: function post(type, data) {

      var promise = _atomTernjsManager2['default'].server.request(type, data);

      return promise;
    }
  }]);

  return Client;
})();

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1jbGllbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O29CQUVpQixNQUFNOzs7O2lDQUNILHVCQUF1Qjs7Ozt1Q0FDakIsOEJBQThCOzs7O2dDQUdqRCxzQkFBc0I7O2tDQUNOLHVCQUF1Qjs7Ozs2QkFDdkIsa0JBQWtCOztBQVR6QyxXQUFXLENBQUM7O0lBV1MsTUFBTTtBQUVkLFdBRlEsTUFBTSxDQUViLFVBQVUsRUFBRTswQkFGTCxNQUFNOztBQUl2QixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQzs7QUFFN0IsUUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7R0FDekI7O2VBUGtCLE1BQU07O1dBU2QscUJBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTs7QUFFckIsYUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTs7QUFFeEIsYUFBSyxFQUFFOztBQUVMLGNBQUksRUFBRSxhQUFhO0FBQ25CLGNBQUksRUFBRSxrQkFBSyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQzFCLGFBQUcsRUFBRSxHQUFHO0FBQ1IsZUFBSyxFQUFFLElBQUk7QUFDWCx5QkFBZSxFQUFFLElBQUk7QUFDckIsY0FBSSxFQUFFLHFDQUFjLE9BQU8sQ0FBQyxJQUFJO0FBQ2hDLGVBQUssRUFBRSxxQ0FBYyxPQUFPLENBQUMsS0FBSztBQUNsQyxjQUFJLEVBQUUscUNBQWMsT0FBTyxDQUFDLGFBQWE7QUFDekMsY0FBSSxFQUFFLHFDQUFjLE9BQU8sQ0FBQyxJQUFJO0FBQ2hDLGlCQUFPLEVBQUUscUNBQWMsT0FBTyxDQUFDLE9BQU87QUFDdEMsMkJBQWlCLEVBQUUsSUFBSTtBQUN2Qix5QkFBZSxFQUFFLHFDQUFjLE9BQU8sQ0FBQyxlQUFlO1NBQ3ZEO09BQ0YsQ0FBQyxDQUFDO0tBQ0o7OztXQUVZLHVCQUFDLElBQUksRUFBRSxHQUFHLEVB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c2gvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLWNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQgcGFja2FnZUNvbmZpZyBmcm9tICcuL2F0b20tdGVybmpzLXBhY2thZ2UtY29uZmlnJztcbmltcG9ydCB7XG4gIG9wZW5GaWxlQW5kR29Ub1xufSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5pbXBvcnQgbmF2aWdhdGlvbiBmcm9tICcuL3NlcnZpY2VzL25hdmlnYXRpb24nO1xuaW1wb3J0IHttZXNzYWdlc30gZnJvbSAnLi9zZXJ2aWNlcy9kZWJ1Zyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCB7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdERpcikge1xuXG4gICAgdGhpcy5wcm9qZWN0RGlyID0gcHJvamVjdERpcjtcbiAgICAvLyBjb2xsZWN0aW9uIGZpbGVzIHRoZSBzZXJ2ZXIgY3VycmVudGx5IGhvbGRzIGluIGl0cyBzZXQgb2YgYW5hbHl6ZWQgZmlsZXNcbiAgICB0aGlzLmFuYWx5emVkRmlsZXMgPSBbXTtcbiAgfVxuXG4gIGNvbXBsZXRpb25zKGZpbGUsIGVuZCkge1xuXG4gICAgcmV0dXJuIHRoaXMucG9zdCgncXVlcnknLCB7XG5cbiAgICAgIHF1ZXJ5OiB7XG5cbiAgICAgICAgdHlwZTogJ2NvbXBsZXRpb25zJyxcbiAgICAgICAgZmlsZTogcGF0aC5ub3JtYWxpemUoZmlsZSksXG4gICAgICAgIGVuZDogZW5kLFxuICAgICAgICB0eXBlczogdHJ1ZSxcbiAgICAgICAgaW5jbHVkZUtleXdvcmRzOiB0cnVlLFxuICAgICAgICBzb3J0OiBwYWNrYWdlQ29uZmlnLm9wdGlvbnMuc29ydCxcbiAgICAgICAgZ3Vlc3M6IHBhY2thZ2VDb25maWcub3B0aW9ucy5ndWVzcyxcbiAgICAgICAgZG9jczogcGFja2FnZUNvbmZpZy5vcHRpb25zLmRvY3VtZW50YXRpb24sXG4gICAgICAgIHVybHM6IHBhY2thZ2VDb25maWcub3B0aW9ucy51cmxzLFxuICAgICAgICBvcmlnaW5zOiBwYWNrYWdlQ29uZmlnLm9wdGlvbnMub3JpZ2lucyxcbiAgICAgICAgbGluZUNoYXJQb3NpdGlvbnM6IHRydWUsXG4gICAgICAgIGNhc2VJbnNlbnNpdGl2ZTogcGFja2FnZUNvbmZpZy5vcHRpb25zLmNhc2VJbnNlbnNpdGl2ZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZG9jdW1lbnRhdGlvbihmaWxlLCBlbmQpIHtcblxuICAgIHJldHVybiB0aGlzLnBvc3QoJ3F1ZXJ5Jywge1xuXG4gICAgICBxdWVyeToge1xuXG4gICAgICAgIHR5cGU6ICdkb2N1bWVudGF0aW9uJyxcbiAgICAgICAgZmlsZTogcGF0aC5ub3JtYWxpemUoZmlsZSksXG4gICAgICAgIGVuZDogZW5kXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWZzKGZpbGUsIGVuZCkge1xuXG4gICAgcmV0dXJuIHRoaXMucG9zdCgncXVlcnknLCB7XG5cbiAgICAgIHF1ZXJ5OiB7XG5cbiAgICAgICAgdHlwZTogJ3JlZnMnLFxuICAgICAgICBmaWxlOiBwYXRoLm5vcm1hbGl6ZShmaWxlKSxcbiAgICAgICAgZW5kOiBlbmRcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZUZ1bGwoZWRpdG9yKSB7XG5cbiAgICByZXR1cm4gdGhpcy5wb3N0KCdxdWVyeScsIHsgZmlsZXM6IFt7XG5cbiAgICAgIHR5cGU6ICdmdWxsJyxcbiAgICAgIG5hbWU6IHBhdGgubm9ybWFsaXplKGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpWzFdKSxcbiAgICAgIHRleHQ6IGVkaXRvci5nZXRUZXh0KClcbiAgICB9XX0pO1xuICB9XG5cbiAgdXBkYXRlUGFydChlZGl0b3IsIHN0YXJ0LCB0ZXh0KSB7XG5cbiAgICByZXR1cm4gdGhpcy5wb3N0KCdxdWVyeScsIFt7XG5cbiAgICAgIHR5cGU6ICdmdWxsJyxcbiAgICAgIG5hbWU6IHBhdGgubm9ybWFsaXplKGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpWzFdKSxcbiAgICAgIG9mZnNldDoge1xuXG4gICAgICAgIGxpbmU6IHN0YXJ0LFxuICAgICAgICBjaDogMFxuICAgICAgfSxcbiAgICAgIHRleHQ6IGVkaXRvci5nZXRUZXh0KClcbiAgICB9XSk7XG4gIH1cblxuICB1cGRhdGUoZWRpdG9yKSB7XG5cbiAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG5cbiAgICBpZiAoIWJ1ZmZlci5pc01vZGlmaWVkKCkpIHtcbiAgICAgIFxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XG4gICAgfVxuXG4gICAgY29uc3QgdVJJID0gZWRpdG9yLmdldFVSSSgpO1xuXG4gICAgaWYgKCF1UkkpIHtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHt0eXBlOiAnaW5mbycsIG1lc3NhZ2U6IG1lc3NhZ2VzLm5vVVJJfSk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IHBhdGgubm9ybWFsaXplKGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCh1UkkpWzFdKTtcblxuICAgIC8vIGNoZWNrIGlmIHRoaXMgZmlsZSBpcyBleGNsdWRlZCB2aWEgZG9udExvYWRcbiAgICBpZiAoXG4gICAgICBtYW5hZ2VyLnNlcnZlciAmJlxuICAgICAgbWFuYWdlci5zZXJ2ZXIuZG9udExvYWQoZmlsZSlcbiAgICApIHtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XG4gICAgfVxuXG4gICAgLy8gZG8gbm90IHJlcXVlc3QgZmlsZXMgaWYgd2UgYWxyZWFkeSBrbm93IGl0IGlzIHJlZ2lzdGVyZWRcbiAgICBpZiAodGhpcy5hbmFseXplZEZpbGVzLmluY2x1ZGVzKGZpbGUpKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUZ1bGwoZWRpdG9yKTtcbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiB0aGUgZmlsZSBpcyByZWdpc3RlcmVkLCBlbHNlIHJldHVyblxuICAgIHJldHVybiB0aGlzLmZpbGVzKCkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICBjb25zdCBmaWxlcyA9IGRhdGEuZmlsZXM7XG5cbiAgICAgIGlmIChmaWxlcykge1xuXG4gICAgICAgIGZpbGVzLmZvckVhY2goZmlsZSA9PiBmaWxlID0gcGF0aC5ub3JtYWxpemUoZmlsZSkpO1xuICAgICAgICB0aGlzLmFuYWx5emVkRmlsZXMgPSBmaWxlcztcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVnaXN0ZXJlZCA9IGZpbGVzICYmIGZpbGVzLmluY2x1ZGVzKGZpbGUpO1xuXG4gICAgICBpZiAocmVnaXN0ZXJlZCkge1xuXG4gICAgICAgIC8vIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgLy8gaWYgYnVmZmVyLmdldE1heENoYXJhY3RlckluZGV4KCkgPiA1MDAwXG4gICAgICAgIC8vICAgc3RhcnQgPSAwXG4gICAgICAgIC8vICAgZW5kID0gMFxuICAgICAgICAvLyAgIHRleHQgPSAnJ1xuICAgICAgICAvLyAgIGZvciBkaWZmIGluIGVkaXRvck1ldGEuZGlmZnNcbiAgICAgICAgLy8gICAgIHN0YXJ0ID0gTWF0aC5tYXgoMCwgZGlmZi5vbGRSYW5nZS5zdGFydC5yb3cgLSA1MClcbiAgICAgICAgLy8gICAgIGVuZCA9IE1hdGgubWluKGJ1ZmZlci5nZXRMaW5lQ291bnQoKSwgZGlmZi5vbGRSYW5nZS5lbmQucm93ICsgNSlcbiAgICAgICAgLy8gICAgIHRleHQgPSBidWZmZXIuZ2V0VGV4dEluUmFuZ2UoW1tzdGFydCwgMF0sIFtlbmQsIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGVuZCldXSlcbiAgICAgICAgLy8gICBwcm9taXNlID0gdGhpcy51cGRhdGVQYXJ0KGVkaXRvciwgc3RhcnQsIHRleHQpXG4gICAgICAgIC8vIGVsc2VcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRnVsbChlZGl0b3IpO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuYW1lKGZpbGUsIGVuZCwgbmV3TmFtZSkge1xuXG4gICAgcmV0dXJuIHRoaXMucG9zdCgncXVlcnknLCB7XG5cbiAgICAgIHF1ZXJ5OiB7XG5cbiAgICAgICAgdHlwZTogJ3JlbmFtZScsXG4gICAgICAgIGZpbGU6IHBhdGgubm9ybWFsaXplKGZpbGUpLFxuICAgICAgICBlbmQ6IGVuZCxcbiAgICAgICAgbmV3TmFtZTogbmV3TmFtZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdHlwZShlZGl0b3IsIHBvc2l0aW9uKSB7XG5cbiAgICBjb25zdCBmaWxlID0gcGF0aC5ub3JtYWxpemUoYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGVkaXRvci5nZXRVUkkoKSlbMV0pO1xuICAgIGNvbnN0IGVuZCA9IHtcblxuICAgICAgbGluZTogcG9zaXRpb24ucm93LFxuICAgICAgY2g6IHBvc2l0aW9uLmNvbHVtblxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5wb3N0KCdxdWVyeScsIHtcblxuICAgICAgcXVlcnk6IHtcblxuICAgICAgICB0eXBlOiAndHlwZScsXG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIGVuZDogZW5kLFxuICAgICAgICBwcmVmZXJGdW5jdGlvbjogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZGVmaW5pdGlvbigpIHtcblxuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpO1xuICAgIGNvbnN0IHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgY29uc3QgW3Byb2plY3QsIGZpbGVdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGVkaXRvci5nZXRVUkkoKSk7XG4gICAgY29uc3QgZW5kID0ge1xuXG4gICAgICBsaW5lOiBwb3NpdGlvbi5yb3csXG4gICAgICBjaDogcG9zaXRpb24uY29sdW1uXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnBvc3QoJ3F1ZXJ5Jywge1xuXG4gICAgICBxdWVyeToge1xuXG4gICAgICAgIHR5cGU6ICdkZWZpbml0aW9uJyxcbiAgICAgICAgZmlsZTogcGF0aC5ub3JtYWxpemUoZmlsZSksXG4gICAgICAgIGVuZDogZW5kXG4gICAgICB9XG5cbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgIGlmIChkYXRhICYmIGRhdGEuc3RhcnQpIHtcblxuICAgICAgICBpZiAobmF2aWdhdGlvbi5zZXQoZGF0YSkpIHtcblxuICAgICAgICAgIGNvbnN0IHBhdGhfdG9fZ28gPSBwYXRoLmlzQWJzb2x1dGUoZGF0YS5maWxlKSA/IGRhdGEuZmlsZSA6IGAke3Byb2plY3R9LyR7ZGF0YS5maWxlfWA7XG4gICAgICAgICAgb3BlbkZpbGVBbmRHb1RvKGRhdGEuc3RhcnQsIHBhdGhfdG9fZ28pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBnZXREZWZpbml0aW9uKGZpbGUsIHJhbmdlKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zdCgncXVlcnknLCB7XG4gICAgICBxdWVyeToge1xuICAgICAgICB0eXBlOiAnZGVmaW5pdGlvbicsXG4gICAgICAgIGZpbGU6IHBhdGgubm9ybWFsaXplKGZpbGUpLFxuICAgICAgICBzdGFydDoge1xuICAgICAgICAgIGxpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICBjaDogcmFuZ2Uuc3RhcnQuY29sdW1uXG4gICAgICAgIH0sXG4gICAgICAgIGVuZDoge1xuICAgICAgICAgIGxpbmU6IHJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgY2g6IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZmlsZXMoKSB7XG5cbiAgICByZXR1cm4gdGhpcy5wb3N0KCdxdWVyeScsIHtcblxuICAgICAgcXVlcnk6IHtcblxuICAgICAgICB0eXBlOiAnZmlsZXMnXG4gICAgICB9XG5cbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcG9zdCh0eXBlLCBkYXRhKSB7XG5cbiAgICBjb25zdCBwcm9taXNlID0gbWFuYWdlci5zZXJ2ZXIucmVxdWVzdCh0eXBlLCBkYXRhKTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG59XG4iXX0=