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

var SELECTOR = ['.source.js', 'javascript', '.source.coffee'];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvbGliL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7OztBQUVaLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFcEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3ZELElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFdkMsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUN0RSxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFbEQsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUN2RSxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7ZUFFRixPQUFPLENBQUMsd0JBQXdCLENBQUM7O0lBQWpELFdBQVcsWUFBbkMsc0JBQXNCOztBQUM5QixJQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDOztBQUV0RSxJQUFNLFFBQVEsR0FBRyxDQUNmLFlBQVksRUFDWixZQUFZLEVBQ1osZ0JBQWdCLENBQ2pCLENBQUM7QUFDRixJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLHFCQUFxQixFQUNyQixvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLG9CQUFvQixDQUNyQixDQUFDOztJQUVJLGtCQUFrQjtBQUNYLFdBRFAsa0JBQWtCLEdBQ1I7MEJBRFYsa0JBQWtCOztBQUVwQixRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0RCxRQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7R0FDN0I7O2VBTkcsa0JBQWtCOztXQVFSLHdCQUFDLElBQWdDLEVBQUU7VUFBakMsTUFBTSxHQUFQLElBQWdDLENBQS9CLE1BQU07VUFBRSxjQUFjLEdBQXZCLElBQWdDLENBQXZCLGNBQWM7VUFBRSxNQUFNLEdBQS9CLElBQWdDLENBQVAsTUFBTTs7QUFDNUMsVUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFELFVBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNCLGVBQU8sRUFBRSxDQUFDO09BQ1g7O0FBRUQsVUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7O0FBRTlELFVBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQzs7QUFFcEYsVUFBSSxTQUFTLFlBQUEsQ0FBQzs7QUFFZCxVQUFNLFlBQVksR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0QsVUFBSSxZQUFZLEtBQUssS0FBSyxFQUFFO0FBQzFCLGlCQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDOztBQUVuRyxZQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7O0FBRWhGLGVBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FDM0IsTUFBTSxDQUFDLFVBQUMsR0FBRyxFQUFFLFdBQVc7OENBQVMsR0FBRyxzQkFBSyxXQUFXO1NBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztPQUM3RDs7QUFFRCxVQUFNLFlBQVksR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0QsVUFBSSxZQUFZLEtBQUssS0FBSyxFQUFFO0FBQzFCLGlCQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDOztBQUVuRyxZQUFNLFlBQVksR0FBRyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkQsWUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDOztBQUVoRixlQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQzNCLE1BQU0sQ0FBQyxVQUFDLEdBQUcsRUFBRSxXQUFXOzhDQUFTLEdBQUcsc0JBQUssV0FBVztTQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7T0FDN0Q7O0FBRUQsYUFBTyxFQUFFLENBQUM7S0FDWDs7O1NBMUNHLGtCQUFrQjs7O0FBNkN4QixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvbGliL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmNvbnN0IENvbmZpZ3MgPSByZXF1aXJlKCcuL3BhY2thZ2UtY29uZmlncycpLnJldHJpZXZhbDtcbmNvbnN0IExvb2t1cEFwaSA9IHJlcXVpcmUoJy4vbG9va3VwcycpO1xuXG5jb25zdCBHZXRNb2R1bGVGcm9tUHJlZml4ID0gcmVxdWlyZSgnLi91dGlscy9nZXQtbW9kdWxlLWZyb20tcHJlZml4Jyk7XG5jb25zdCBNb2R1bGVMb29rdXBzID0gcmVxdWlyZSgnLi9sb29rdXBzL21vZHVsZScpO1xuXG5jb25zdCBHZXRFeHBvcnRGcm9tUHJlZml4ID0gcmVxdWlyZSgnLi91dGlscy9nZXQtZXhwb3J0cy1mcm9tLXByZWZpeCcpO1xuY29uc3QgRXhwb3J0TG9va3VwcyA9IHJlcXVpcmUoJy4vbG9va3Vwcy9leHBvcnQnKTtcblxuY29uc3QgeyByZWdleE1vZHVsZUV4aXN0T25MaW5lOiBMSU5FX1JFR0VYUCB9ID0gcmVxdWlyZSgnLi91dGlscy9yZWdleC1wYXR0ZXJucycpO1xuY29uc3QgRmlsdGVyTG9va3Vwc0J5VGV4dCA9IHJlcXVpcmUoJy4vdXRpbHMvZmlsdGVyLWxvb2t1cHMtYnktdGV4dCcpO1xuXG5jb25zdCBTRUxFQ1RPUiA9IFtcbiAgJy5zb3VyY2UuanMnLFxuICAnamF2YXNjcmlwdCcsXG4gICcuc291cmNlLmNvZmZlZSdcbl07XG5jb25zdCBTRUxFQ1RPUl9ESVNBQkxFID0gW1xuICAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICdqYXZhc2NyaXB0IGNvbW1lbnQnLFxuICAnLnNvdXJjZS5qcyAua2V5d29yZCcsXG4gICdqYXZhc2NyaXB0IGtleXdvcmQnXG5dO1xuXG5jbGFzcyBDb21wbGV0aW9uUHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gU0VMRUNUT1Iuam9pbignLCAnKTtcbiAgICB0aGlzLmRpc2FibGVGb3JTZWxlY3RvciA9IFNFTEVDVE9SX0RJU0FCTEUuam9pbignLCAnKTtcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IDM7XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyh7ZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgcHJlZml4fSkge1xuICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuYnVmZmVyLmxpbmVGb3JSb3coYnVmZmVyUG9zaXRpb24ucm93KTtcbiAgICBpZiAoIUxJTkVfUkVHRVhQLnRlc3QobGluZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVUZXh0RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuXG4gICAgY29uc3QgcHJlZml4TGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG5cbiAgICBsZXQgbG9va3VwQXBpO1xuXG4gICAgY29uc3QgcHJlZml4TW9kdWxlID0gR2V0TW9kdWxlRnJvbVByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChwcmVmaXhNb2R1bGUgIT09IGZhbHNlKSB7XG4gICAgICBsb29rdXBBcGkgPSBuZXcgTG9va3VwQXBpKGFjdGl2ZVRleHRFZGl0b3IuZ2V0UGF0aCgpLCBNb2R1bGVMb29rdXBzLCBDb25maWdzLCBGaWx0ZXJMb29rdXBzQnlUZXh0KTtcblxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBsb29rdXBBcGkuZmlsdGVyTGlzdChwcmVmaXhNb2R1bGUsIHByZWZpeE1vZHVsZSwgcHJlZml4TW9kdWxlKTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgICAgLnJlZHVjZSgoYWNjLCBzdWdnZXN0aW9ucykgPT4gWy4uLmFjYywgLi4uc3VnZ2VzdGlvbnNdLCBbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJlZml4RXhwb3J0ID0gR2V0RXhwb3J0RnJvbVByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChwcmVmaXhFeHBvcnQgIT09IGZhbHNlKSB7XG4gICAgICBsb29rdXBBcGkgPSBuZXcgTG9va3VwQXBpKGFjdGl2ZVRleHRFZGl0b3IuZ2V0UGF0aCgpLCBFeHBvcnRMb29rdXBzLCBDb25maWdzLCBGaWx0ZXJMb29rdXBzQnlUZXh0KTtcblxuICAgICAgY29uc3QgaW1wb3J0TW9kdWxlID0gR2V0TW9kdWxlRnJvbVByZWZpeCgnJywgbGluZSk7XG4gICAgICBjb25zdCBwcm9taXNlcyA9IGxvb2t1cEFwaS5maWx0ZXJMaXN0KGltcG9ydE1vZHVsZSwgaW1wb3J0TW9kdWxlLCBwcmVmaXhFeHBvcnQpO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgICAucmVkdWNlKChhY2MsIHN1Z2dlc3Rpb25zKSA9PiBbLi4uYWNjLCAuLi5zdWdnZXN0aW9uc10sIFtdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV0aW9uUHJvdmlkZXI7XG4iXX0=