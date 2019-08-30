function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* global emit */

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomLinter = require('atom-linter');

var _workerHelpers = require('./worker-helpers');

var Helpers = _interopRequireWildcard(_workerHelpers);

var _isConfigAtHomeRoot = require('./is-config-at-home-root');

var _isConfigAtHomeRoot2 = _interopRequireDefault(_isConfigAtHomeRoot);

'use babel';

process.title = 'linter-eslint helper';

var rulesMetadata = new Map();
var shouldSendRules = false;

function lintJob(_ref) {
  var cliEngineOptions = _ref.cliEngineOptions;
  var contents = _ref.contents;
  var eslint = _ref.eslint;
  var filePath = _ref.filePath;

  var cliEngine = new eslint.CLIEngine(cliEngineOptions);
  var report = cliEngine.executeOnText(contents, filePath);
  var rules = Helpers.getRules(cliEngine);
  shouldSendRules = Helpers.didRulesChange(rulesMetadata, rules);
  if (shouldSendRules) {
    // Rebuild rulesMetadata
    rulesMetadata.clear();
    rules.forEach(function (properties, rule) {
      return rulesMetadata.set(rule, properties);
    });
  }
  return report;
}

function fixJob(_ref2) {
  var cliEngineOptions = _ref2.cliEngineOptions;
  var contents = _ref2.contents;
  var eslint = _ref2.eslint;
  var filePath = _ref2.filePath;

  var report = lintJob({ cliEngineOptions: cliEngineOptions, contents: contents, eslint: eslint, filePath: filePath });

  eslint.CLIEngine.outputFixes(report);

  if (!report.results.length || !report.results[0].messages.length) {
    return 'Linter-ESLint: Fix complete.';
  }
  return 'Linter-ESLint: Fix attempt complete, but linting errors remain.';
}

module.exports = _asyncToGenerator(function* () {
  process.on('message', function (jobConfig) {
    // We catch all worker errors so that we can create a separate error emitter
    // for each emitKey, rather than adding multiple listeners for `task:error`
    var contents = jobConfig.contents;
    var type = jobConfig.type;
    var config = jobConfig.config;
    var filePath = jobConfig.filePath;
    var projectPath = jobConfig.projectPath;
    var rules = jobConfig.rules;
    var emitKey = jobConfig.emitKey;

    try {
      if (config.advanced.disableFSCache) {
        _atomLinter.FindCache.clear();
      }

      var fileDir = _path2['default'].dirname(filePath);
      var eslint = Helpers.getESLintInstance(fileDir, config, projectPath);
      var configPath = Helpers.getConfigPath(fileDir);
      var noProjectConfig = configPath === null || (0, _isConfigAtHomeRoot2['default'])(configPath);
      if (noProjectConfig && config.disabling.disableWhenNoEslintConfig) {
        emit(emitKey, { messages: [] });
        return;
      }

      var relativeFilePath = Helpers.getRelativePath(fileDir, filePath, config, projectPath);

      var cliEngineOptions = Helpers.getCLIEngineOptions(type, config, rules, relativeFilePath, fileDir, configPath);

      var response = undefined;
      if (type === 'lint') {
        var report = lintJob({ cliEngineOptions: cliEngineOptions, contents: contents, eslint: eslint, filePath: filePath });
        response = {
          messages: report.results.length ? report.results[0].messages : []
        };
        if (shouldSendRules) {
          // You can't emit Maps, convert to Array of Arrays to send back.
          response.updatedRules = Array.from(rulesMetadata);
        }
      } else if (type === 'fix') {
        response = fixJob({ cliEngineOptions: cliEngineOptions, contents: contents, eslint: eslint, filePath: filePath });
      } else if (type === 'debug') {
        var modulesDir = _path2['default'].dirname((0, _atomLinter.findCached)(fileDir, 'node_modules/eslint') || '');
        response = Helpers.findESLintDirectory(modulesDir, config, projectPath);
      }
      emit(emitKey, response);
    } catch (workerErr) {
      emit('workerError:' + emitKey, { msg: workerErr.message, stack: workerErr.stack });
    }
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUlpQixNQUFNOzs7OzBCQUNlLGFBQWE7OzZCQUMxQixrQkFBa0I7O0lBQS9CLE9BQU87O2tDQUNZLDBCQUEwQjs7OztBQVB6RCxXQUFXLENBQUE7O0FBU1gsT0FBTyxDQUFDLEtBQUssR0FBRyxzQkFBc0IsQ0FBQTs7QUFFdEMsSUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUMvQixJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7O0FBRTNCLFNBQVMsT0FBTyxDQUFDLElBQWdELEVBQUU7TUFBaEQsZ0JBQWdCLEdBQWxCLElBQWdELENBQTlDLGdCQUFnQjtNQUFFLFFBQVEsR0FBNUIsSUFBZ0QsQ0FBNUIsUUFBUTtNQUFFLE1BQU0sR0FBcEMsSUFBZ0QsQ0FBbEIsTUFBTTtNQUFFLFFBQVEsR0FBOUMsSUFBZ0QsQ0FBVixRQUFROztBQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUN4RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUMxRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3pDLGlCQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDOUQsTUFBSSxlQUFlLEVBQUU7O0FBRW5CLGlCQUFhLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDckIsU0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFVBQVUsRUFBRSxJQUFJO2FBQUssYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO0tBQUEsQ0FBQyxDQUFBO0dBQ3pF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QUMsUUFBUSxHQUFHLEVBQUU7U0FDbEUsQ0FBQTtBQUNELFlBQUksZUFBZSxFQUFFOztBQUVuQixrQkFBUSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1NBQ2xEO09BQ0YsTUFBTSxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7QUFDekIsZ0JBQVEsR0FBRyxNQUFNLENBQUMsRUFBRSxnQkFBZ0IsRUFBaEIsZ0JBQWdCLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxNQUFNLEVBQU4sTUFBTSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsQ0FBQyxDQUFBO09BQ3BFLE1BQU0sSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQzNCLFlBQU0sVUFBVSxHQUFHLGtCQUFLLE9BQU8sQ0FBQyw0QkFBVyxPQUFPLEVBQUUscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUNqRixnQkFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFBO09BQ3hFO0FBQ0QsVUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUN4QixDQUFDLE9BQU8sU0FBUyxFQUFFO0FBQ2xCLFVBQUksa0JBQWdCLE9BQU8sRUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQTtLQUNuRjtHQUNGLENBQUMsQ0FBQTtDQUNILENBQUEsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci1lc2xpbnQvc3JjL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbi8qIGdsb2JhbCBlbWl0ICovXG5cbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaW5kQ2FjaGUsIGZpbmRDYWNoZWQgfSBmcm9tICdhdG9tLWxpbnRlcidcbmltcG9ydCAqIGFzIEhlbHBlcnMgZnJvbSAnLi93b3JrZXItaGVscGVycydcbmltcG9ydCBpc0NvbmZpZ0F0SG9tZVJvb3QgZnJvbSAnLi9pcy1jb25maWctYXQtaG9tZS1yb290J1xuXG5wcm9jZXNzLnRpdGxlID0gJ2xpbnRlci1lc2xpbnQgaGVscGVyJ1xuXG5jb25zdCBydWxlc01ldGFkYXRhID0gbmV3IE1hcCgpXG5sZXQgc2hvdWxkU2VuZFJ1bGVzID0gZmFsc2VcblxuZnVuY3Rpb24gbGludEpvYih7IGNsaUVuZ2luZU9wdGlvbnMsIGNvbnRlbnRzLCBlc2xpbnQsIGZpbGVQYXRoIH0pIHtcbiAgY29uc3QgY2xpRW5naW5lID0gbmV3IGVzbGludC5DTElFbmdpbmUoY2xpRW5naW5lT3B0aW9ucylcbiAgY29uc3QgcmVwb3J0ID0gY2xpRW5naW5lLmV4ZWN1dGVPblRleHQoY29udGVudHMsIGZpbGVQYXRoKVxuICBjb25zdCBydWxlcyA9IEhlbHBlcnMuZ2V0UnVsZXMoY2xpRW5naW5lKVxuICBzaG91bGRTZW5kUnVsZXMgPSBIZWxwZXJzLmRpZFJ1bGVzQ2hhbmdlKHJ1bGVzTWV0YWRhdGEsIHJ1bGVzKVxuICBpZiAoc2hvdWxkU2VuZFJ1bGVzKSB7XG4gICAgLy8gUmVidWlsZCBydWxlc01ldGFkYXRhXG4gICAgcnVsZXNNZXRhZGF0YS5jbGVhcigpXG4gICAgcnVsZXMuZm9yRWFjaCgocHJvcGVydGllcywgcnVsZSkgPT4gcnVsZXNNZXRhZGF0YS5zZXQocnVsZSwgcHJvcGVydGllcykpXG4gIH1cbiAgcmV0dXJuIHJlcG9ydFxufVxuXG5mdW5jdGlvbiBmaXhKb2IoeyBjbGlFbmdpbmVPcHRpb25zLCBjb250ZW50cywgZXNsaW50LCBmaWxlUGF0aCB9KSB7XG4gIGNvbnN0IHJlcG9ydCA9IGxpbnRKb2IoeyBjbGlFbmdpbmVPcHRpb25zLCBjb250ZW50cywgZXNsaW50LCBmaWxlUGF0aCB9KVxuXG4gIGVzbGludC5DTElFbmdpbmUub3V0cHV0Rml4ZXMocmVwb3J0KVxuXG4gIGlmICghcmVwb3J0LnJlc3VsdHMubGVuZ3RoIHx8ICFyZXBvcnQucmVzdWx0c1swXS5tZXNzYWdlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJ0xpbnRlci1FU0xpbnQ6IEZpeCBjb21wbGV0ZS4nXG4gIH1cbiAgcmV0dXJuICdMaW50ZXItRVNMaW50OiBGaXggYXR0ZW1wdCBjb21wbGV0ZSwgYnV0IGxpbnRpbmcgZXJyb3JzIHJlbWFpbi4nXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgKCkgPT4ge1xuICBwcm9jZXNzLm9uKCdtZXNzYWdlJywgKGpvYkNvbmZpZykgPT4ge1xuICAgIC8vIFdlIGNhdGNoIGFsbCB3b3JrZXIgZXJyb3JzIHNvIHRoYXQgd2UgY2FuIGNyZWF0ZSBhIHNlcGFyYXRlIGVycm9yIGVtaXR0ZXJcbiAgICAvLyBmb3IgZWFjaCBlbWl0S2V5LCByYXRoZXIgdGhhbiBhZGRpbmcgbXVsdGlwbGUgbGlzdGVuZXJzIGZvciBgdGFzazplcnJvcmBcbiAgICBjb25zdCB7XG4gICAgICBjb250ZW50cywgdHlwZSwgY29uZmlnLCBmaWxlUGF0aCwgcHJvamVjdFBhdGgsIHJ1bGVzLCBlbWl0S2V5XG4gICAgfSA9IGpvYkNvbmZpZ1xuICAgIHRyeSB7XG4gICAgICBpZiAoY29uZmlnLmFkdmFuY2VkLmRpc2FibGVGU0NhY2hlKSB7XG4gICAgICAgIEZpbmRDYWNoZS5jbGVhcigpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVEaXIgPSBQYXRoLmRpcm5hbWUoZmlsZVBhdGgpXG4gICAgICBjb25zdCBlc2xpbnQgPSBIZWxwZXJzLmdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpXG4gICAgICBjb25zdCBjb25maWdQYXRoID0gSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpXG4gICAgICBjb25zdCBub1Byb2plY3RDb25maWcgPSAoY29uZmlnUGF0aCA9PT0gbnVsbCB8fCBpc0NvbmZpZ0F0SG9tZVJvb3QoY29uZmlnUGF0aCkpXG4gICAgICBpZiAobm9Qcm9qZWN0Q29uZmlnICYmIGNvbmZpZy5kaXNhYmxpbmcuZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZykge1xuICAgICAgICBlbWl0KGVtaXRLZXksIHsgbWVzc2FnZXM6IFtdIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gSGVscGVycy5nZXRSZWxhdGl2ZVBhdGgoZmlsZURpciwgZmlsZVBhdGgsIGNvbmZpZywgcHJvamVjdFBhdGgpXG5cbiAgICAgIGNvbnN0IGNsaUVuZ2luZU9wdGlvbnMgPSBIZWxwZXJzXG4gICAgICAgIC5nZXRDTElFbmdpbmVPcHRpb25zKHR5cGUsIGNvbmZpZywgcnVsZXMsIHJlbGF0aXZlRmlsZVBhdGgsIGZpbGVEaXIsIGNvbmZpZ1BhdGgpXG5cbiAgICAgIGxldCByZXNwb25zZVxuICAgICAgaWYgKHR5cGUgPT09ICdsaW50Jykge1xuICAgICAgICBjb25zdCByZXBvcnQgPSBsaW50Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSlcbiAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgbWVzc2FnZXM6IHJlcG9ydC5yZXN1bHRzLmxlbmd0aCA/IHJlcG9ydC5yZXN1bHRzWzBdLm1lc3NhZ2VzIDogW11cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvdWxkU2VuZFJ1bGVzKSB7XG4gICAgICAgICAgLy8gWW91IGNhbid0IGVtaXQgTWFwcywgY29udmVydCB0byBBcnJheSBvZiBBcnJheXMgdG8gc2VuZCBiYWNrLlxuICAgICAgICAgIHJlc3BvbnNlLnVwZGF0ZWRSdWxlcyA9IEFycmF5LmZyb20ocnVsZXNNZXRhZGF0YSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZml4Jykge1xuICAgICAgICByZXNwb25zZSA9IGZpeEpvYih7IGNsaUVuZ2luZU9wdGlvbnMsIGNvbnRlbnRzLCBlc2xpbnQsIGZpbGVQYXRoIH0pXG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdkZWJ1ZycpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gICAgICAgIHJlc3BvbnNlID0gSGVscGVycy5maW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpXG4gICAgICB9XG4gICAgICBlbWl0KGVtaXRLZXksIHJlc3BvbnNlKVxuICAgIH0gY2F0Y2ggKHdvcmtlckVycikge1xuICAgICAgZW1pdChgd29ya2VyRXJyb3I6JHtlbWl0S2V5fWAsIHsgbXNnOiB3b3JrZXJFcnIubWVzc2FnZSwgc3RhY2s6IHdvcmtlckVyci5zdGFjayB9KVxuICAgIH1cbiAgfSlcbn1cbiJdfQ==