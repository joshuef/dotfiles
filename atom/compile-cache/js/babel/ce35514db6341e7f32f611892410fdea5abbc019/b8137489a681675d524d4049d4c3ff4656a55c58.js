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

var _atomTernjsHelper = require('./atom-ternjs-helper');

'use babel';

var Hyperclick = (function () {
  function Hyperclick() {
    _classCallCheck(this, Hyperclick);

    this.providerName = 'atom-ternjs-hyperclick';
    this.wordRegExp = new RegExp('(`(\\\\.|[^`\\\\])*`)|(\'(\\\\.|[^\'\\\\])*\')|("(\\\\.|[^"\\\\])*")|([a-zA-Z0-9_$]+)', 'g');
  }

  _createClass(Hyperclick, [{
    key: 'getSuggestionForWord',
    value: function getSuggestionForWord(editor, string, range) {
      return new Promise(function (resolve) {
        if (!string.trim()) {
          return resolve(null);
        }

        if (!_atomTernjsManager2['default'].client) {
          return resolve(null);
        }

        _atomTernjsManager2['default'].client.update(editor).then(function (data) {
          if (!data) {
            return resolve(null);
          }

          var _atom$project$relativizePath = atom.project.relativizePath(editor.getURI());

          var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 2);

          var project = _atom$project$relativizePath2[0];
          var file = _atom$project$relativizePath2[1];

          _atomTernjsManager2['default'].client.getDefinition(file, range).then(function (data) {
            if (!data) {
              return resolve(null);
            }

            if (data && data.file) {
              resolve({
                range: range,
                callback: function callback() {

                  var path_to_go = _path2['default'].isAbsolute(data.file) ? data.file : project + '/' + data.file;
                  (0, _atomTernjsHelper.openFileAndGoTo)(data.start, path_to_go);
                }
              });
            }

            resolve(null);
          })['catch'](function () {
            return resolve(null);
          });
        });
      });
    }
  }]);

  return Hyperclick;
})();

exports['default'] = new Hyperclick();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1oeXBlcmNsaWNrLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztvQkFFaUIsTUFBTTs7OztpQ0FDSCx1QkFBdUI7Ozs7Z0NBQ1gsc0JBQXNCOztBQUp0RCxXQUFXLENBQUM7O0lBTU4sVUFBVTtBQUNILFdBRFAsVUFBVSxHQUNBOzBCQURWLFVBQVU7O0FBRVosUUFBSSxDQUFDLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztBQUM3QyxRQUFJLENBQUMsVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLHVGQUF1RixFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQzVIOztlQUpHLFVBQVU7O1dBTU0sOEJBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7QUFDMUMsYUFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUM5QixZQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFO0FBQ2xCLGlCQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN0Qjs7QUFFRCxZQUFJLENBQUMsK0JBQVEsTUFBTSxFQUFFO0FBQ25CLGlCQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN0Qjs7QUFFRCx1Q0FBUSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUksRUFBSztBQUMzQyxjQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ3RCOzs2Q0FDdUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDOzs7O2NBQTdELE9BQU87Y0FBRSxJQUFJOztBQUNwQix5Q0FBUSxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUs7QUFDdkQsZ0JBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxxQkFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEI7O0FBRUQsZ0JBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDckIscUJBQU8sQ0FBQztBQUNOLHFCQUFLLEVBQUUsS0FBSztBQUNaLHdCQUFRLEVBQUEsb0JBQUc7O0FBRVQsc0JBQU0sVUFBVSxHQUFHLGtCQUFLLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBTSxPQUFPLFNBQUksSUFBSSxDQUFDLElBQUksQUFBRSxDQUFDO0FBQ3RGLHlEQUFnQixJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2lCQUN6QztlQUNGLENBQUMsQ0FBQzthQUNKOztBQUVELG1CQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7V0FDZixDQUFDLFNBQU0sQ0FBQzttQkFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO1dBQUEsQ0FBQyxDQUFDO1NBQy9CLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKOzs7U0F6Q0csVUFBVTs7O3FCQTRDRCxJQUFJLFVBQVUsRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtaHlwZXJjbGljay1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQgeyBvcGVuRmlsZUFuZEdvVG8gfSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5cbmNsYXNzIEh5cGVyY2xpY2sge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnByb3ZpZGVyTmFtZSA9ICdhdG9tLXRlcm5qcy1oeXBlcmNsaWNrJztcbiAgICB0aGlzLndvcmRSZWdFeHAgPSBuZXcgUmVnRXhwKCcoYChcXFxcXFxcXC58W15gXFxcXFxcXFxdKSpgKXwoXFwnKFxcXFxcXFxcLnxbXlxcJ1xcXFxcXFxcXSkqXFwnKXwoXCIoXFxcXFxcXFwufFteXCJcXFxcXFxcXF0pKlwiKXwoW2EtekEtWjAtOV8kXSspJywgJ2cnKTtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKGVkaXRvciwgc3RyaW5nLCByYW5nZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKCFzdHJpbmcudHJpbSgpKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW1hbmFnZXIuY2xpZW50KSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKG51bGwpO1xuICAgICAgfVxuXG4gICAgICBtYW5hZ2VyLmNsaWVudC51cGRhdGUoZWRpdG9yKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IFtwcm9qZWN0LCBmaWxlXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpO1xuICAgICAgICBtYW5hZ2VyLmNsaWVudC5nZXREZWZpbml0aW9uKGZpbGUsIHJhbmdlKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLmZpbGUpIHtcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXG4gICAgICAgICAgICAgIGNhbGxiYWNrKCkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aF90b19nbyA9IHBhdGguaXNBYnNvbHV0ZShkYXRhLmZpbGUpID8gZGF0YS5maWxlIDogYCR7cHJvamVjdH0vJHtkYXRhLmZpbGV9YDtcbiAgICAgICAgICAgICAgICBvcGVuRmlsZUFuZEdvVG8oZGF0YS5zdGFydCwgcGF0aF90b19nbyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHJlc29sdmUobnVsbCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEh5cGVyY2xpY2soKTtcbiJdfQ==