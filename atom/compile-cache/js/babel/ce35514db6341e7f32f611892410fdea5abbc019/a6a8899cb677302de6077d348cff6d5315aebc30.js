'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Promise = require('bluebird');

var Configs = require('./package-configs').retrieval;
var LookupApi = require('./lookups');

var GetModuleFromPrefix = require('./utils/get-module-from-prefix');
var ModuleLookups = require('./lookups/module');

var GetExportFromPrefix = require('./utils/get-exports-from-prefix');
var ExportLookups = require('./lookups/export');

var _require = require('./utils/regex-patterns');

var LINE_REGEXP = _require.regexModuleExistOnLine;

var FilterLookupsByText = require('./utils/filter-lookups-by-text');

var SELECTOR = ['.source.js', 'javascript', '.source.coffee', '.source.flow'];
var SELECTOR_DISABLE = ['.source.js .comment', 'javascript comment', '.source.js .keyword', 'javascript keyword'];

var CompletionProvider = (function () {
  function CompletionProvider() {
    _classCallCheck(this, CompletionProvider);

    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
    this.suggestionPriority = 3;
  }

  _createClass(CompletionProvider, [{
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var editor = _ref.editor;
      var bufferPosition = _ref.bufferPosition;
      var prefix = _ref.prefix;

      var line = editor.buffer.lineForRow(bufferPosition.row);
      if (!LINE_REGEXP.test(line)) {
        return [];
      }

      var activeTextEditor = atom.workspace.getActiveTextEditor();

      var prefixLine = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

      var lookupApi = undefined;

      var prefixModule = GetModuleFromPrefix(prefix, prefixLine);
      if (prefixModule !== false) {
        lookupApi = new LookupApi(activeTextEditor.getPath(), ModuleLookups, Configs, FilterLookupsByText);

        var promises = lookupApi.filterList(prefixModule, prefixModule, prefixModule);

        return Promise.all(promises).reduce(function (acc, suggestions) {
          return [].concat(_toConsumableArray(acc), _toConsumableArray(suggestions));
        }, []);
      }

      var prefixExport = GetExportFromPrefix(prefix, prefixLine);
      if (prefixExport !== false) {
        lookupApi = new LookupApi(activeTextEditor.getPath(), ExportLookups, Configs, FilterLookupsByText);

        var importModule = GetModuleFromPrefix('', line);
        var promises = lookupApi.filterList(importModule, importModule, prefixExport);

        return Promise.all(promises).reduce(function (acc, suggestions) {
          return [].concat(_toConsumableArray(acc), _toConsumableArray(suggestions));
        }, []);
      }

      return [];
    }
  }]);

  return CompletionProvider;
})();

module.exports = CompletionProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvbGliL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7OztBQUVaLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFcEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3ZELElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFdkMsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUN0RSxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFbEQsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUN2RSxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7ZUFFRixPQUFPLENBQUMsd0JBQXdCLENBQUM7O0lBQWpELFdBQVcsWUFBbkMsc0JBQXNCOztBQUM5QixJQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDOztBQUV0RSxJQUFNLFFBQVEsR0FBRyxDQUNmLFlBQVksRUFDWixZQUFZLEVBQ1osZ0JBQWdCLEVBQ2hCLGNBQWMsQ0FDZixDQUFDO0FBQ0YsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLHFCQUFxQixFQUNyQixvQkFBb0IsQ0FDckIsQ0FBQzs7SUFFSSxrQkFBa0I7QUFDWCxXQURQLGtCQUFrQixHQUNSOzBCQURWLGtCQUFrQjs7QUFFcEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEQsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMzQixRQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0dBQzdCOztlQU5HLGtCQUFrQjs7V0FRUix3QkFBQyxJQUFnQyxFQUFFO1VBQWpDLE1BQU0sR0FBUCxJQUFnQyxDQUEvQixNQUFNO1VBQUUsY0FBYyxHQUF2QixJQUFnQyxDQUF2QixjQUFjO1VBQUUsTUFBTSxHQUEvQixJQUFnQyxDQUFQLE1BQU07O0FBQzVDLFVBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMxRCxVQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMzQixlQUFPLEVBQUUsQ0FBQztPQUNYOztBQUVELFVBQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOztBQUU5RCxVQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7O0FBRXBGLFVBQUksU0FBUyxZQUFBLENBQUM7O0FBRWQsVUFBTSxZQUFZLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzdELFVBQUksWUFBWSxLQUFLLEtBQUssRUFBRTtBQUMxQixpQkFBUyxHQUFHLElBQUksU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzs7QUFFbkcsWUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDOztBQUVoRixlQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQzNCLE1BQU0sQ0FBQyxVQUFDLEdBQUcsRUFBRSxXQUFXOzhDQUFTLEdBQUcsc0JBQUssV0FBVztTQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7T0FDN0Q7O0FBRUQsVUFBTSxZQUFZLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzdELFVBQUksWUFBWSxLQUFLLEtBQUssRUFBRTtBQUMxQixpQkFBUyxHQUFHLElBQUksU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzs7QUFFbkcsWUFBTSxZQUFZLEdBQUcsbUJBQW1CLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25ELFlBQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQzs7QUFFaEYsZUFBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUMzQixNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsV0FBVzs4Q0FBUyxHQUFHLHNCQUFLLFdBQVc7U0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO09BQzdEOztBQUVELGFBQU8sRUFBRSxDQUFDO0tBQ1g7OztTQTFDRyxrQkFBa0I7OztBQTZDeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1tb2R1bGVzL2xpYi9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuXG5jb25zdCBDb25maWdzID0gcmVxdWlyZSgnLi9wYWNrYWdlLWNvbmZpZ3MnKS5yZXRyaWV2YWw7XG5jb25zdCBMb29rdXBBcGkgPSByZXF1aXJlKCcuL2xvb2t1cHMnKTtcblxuY29uc3QgR2V0TW9kdWxlRnJvbVByZWZpeCA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LW1vZHVsZS1mcm9tLXByZWZpeCcpO1xuY29uc3QgTW9kdWxlTG9va3VwcyA9IHJlcXVpcmUoJy4vbG9va3Vwcy9tb2R1bGUnKTtcblxuY29uc3QgR2V0RXhwb3J0RnJvbVByZWZpeCA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWV4cG9ydHMtZnJvbS1wcmVmaXgnKTtcbmNvbnN0IEV4cG9ydExvb2t1cHMgPSByZXF1aXJlKCcuL2xvb2t1cHMvZXhwb3J0Jyk7XG5cbmNvbnN0IHsgcmVnZXhNb2R1bGVFeGlzdE9uTGluZTogTElORV9SRUdFWFAgfSA9IHJlcXVpcmUoJy4vdXRpbHMvcmVnZXgtcGF0dGVybnMnKTtcbmNvbnN0IEZpbHRlckxvb2t1cHNCeVRleHQgPSByZXF1aXJlKCcuL3V0aWxzL2ZpbHRlci1sb29rdXBzLWJ5LXRleHQnKTtcblxuY29uc3QgU0VMRUNUT1IgPSBbXG4gICcuc291cmNlLmpzJyxcbiAgJ2phdmFzY3JpcHQnLFxuICAnLnNvdXJjZS5jb2ZmZWUnLFxuICAnLnNvdXJjZS5mbG93J1xuXTtcbmNvbnN0IFNFTEVDVE9SX0RJU0FCTEUgPSBbXG4gICcuc291cmNlLmpzIC5jb21tZW50JyxcbiAgJ2phdmFzY3JpcHQgY29tbWVudCcsXG4gICcuc291cmNlLmpzIC5rZXl3b3JkJyxcbiAgJ2phdmFzY3JpcHQga2V5d29yZCdcbl07XG5cbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBTRUxFQ1RPUi5qb2luKCcsICcpO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gU0VMRUNUT1JfRElTQUJMRS5qb2luKCcsICcpO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgIHRoaXMuc3VnZ2VzdGlvblByaW9yaXR5ID0gMztcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXh9KSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5idWZmZXIubGluZUZvclJvdyhidWZmZXJQb3NpdGlvbi5yb3cpO1xuICAgIGlmICghTElORV9SRUdFWFAudGVzdChsaW5lKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZVRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICBjb25zdCBwcmVmaXhMaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKTtcblxuICAgIGxldCBsb29rdXBBcGk7XG5cbiAgICBjb25zdCBwcmVmaXhNb2R1bGUgPSBHZXRNb2R1bGVGcm9tUHJlZml4KHByZWZpeCwgcHJlZml4TGluZSk7XG4gICAgaWYgKHByZWZpeE1vZHVsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGxvb2t1cEFwaSA9IG5ldyBMb29rdXBBcGkoYWN0aXZlVGV4dEVkaXRvci5nZXRQYXRoKCksIE1vZHVsZUxvb2t1cHMsIENvbmZpZ3MsIEZpbHRlckxvb2t1cHNCeVRleHQpO1xuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IGxvb2t1cEFwaS5maWx0ZXJMaXN0KHByZWZpeE1vZHVsZSwgcHJlZml4TW9kdWxlLCBwcmVmaXhNb2R1bGUpO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgICAucmVkdWNlKChhY2MsIHN1Z2dlc3Rpb25zKSA9PiBbLi4uYWNjLCAuLi5zdWdnZXN0aW9uc10sIFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVmaXhFeHBvcnQgPSBHZXRFeHBvcnRGcm9tUHJlZml4KHByZWZpeCwgcHJlZml4TGluZSk7XG4gICAgaWYgKHByZWZpeEV4cG9ydCAhPT0gZmFsc2UpIHtcbiAgICAgIGxvb2t1cEFwaSA9IG5ldyBMb29rdXBBcGkoYWN0aXZlVGV4dEVkaXRvci5nZXRQYXRoKCksIEV4cG9ydExvb2t1cHMsIENvbmZpZ3MsIEZpbHRlckxvb2t1cHNCeVRleHQpO1xuXG4gICAgICBjb25zdCBpbXBvcnRNb2R1bGUgPSBHZXRNb2R1bGVGcm9tUHJlZml4KCcnLCBsaW5lKTtcbiAgICAgIGNvbnN0IHByb21pc2VzID0gbG9va3VwQXBpLmZpbHRlckxpc3QoaW1wb3J0TW9kdWxlLCBpbXBvcnRNb2R1bGUsIHByZWZpeEV4cG9ydCk7XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICAgIC5yZWR1Y2UoKGFjYywgc3VnZ2VzdGlvbnMpID0+IFsuLi5hY2MsIC4uLnN1Z2dlc3Rpb25zXSwgW10pO1xuICAgIH1cblxuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXRpb25Qcm92aWRlcjtcbiJdfQ==