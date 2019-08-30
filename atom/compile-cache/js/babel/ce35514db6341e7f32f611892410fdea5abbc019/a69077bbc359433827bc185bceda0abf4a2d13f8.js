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
      if (config.disableFSCache) {
        _atomLinter.FindCache.clear();
      }

      var fileDir = _path2['default'].dirname(filePath);
      var eslint = Helpers.getESLintInstance(fileDir, config, projectPath);
      var configPath = Helpers.getConfigPath(fileDir);
      var noProjectConfig = configPath === null || (0, _isConfigAtHomeRoot2['default'])(configPath);
      if (noProjectConfig && config.disableWhenNoEslintConfig) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUlpQixNQUFNOzs7OzBCQUNlLGFBQWE7OzZCQUMxQixrQkFBa0I7O0lBQS9CLE9BQU87O2tDQUNZLDBCQUEwQjs7OztBQVB6RCxXQUFXLENBQUE7O0FBU1gsT0FBTyxDQUFDLEtBQUssR0FBRyxzQkFBc0IsQ0FBQTs7QUFFdEMsSUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUMvQixJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7O0FBRTNCLFNBQVMsT0FBTyxDQUFDLElBQWdELEVBQUU7TUFBaEQsZ0JBQWdCLEdBQWxCLElBQWdELENBQTlDLGdCQUFnQjtNQUFFLFFBQVEsR0FBNUIsSUFBZ0QsQ0FBNUIsUUFBUTtNQUFFLE1BQU0sR0FBcEMsSUFBZ0QsQ0FBbEIsTUFBTTtNQUFFLFFBQVEsR0FBOUMsSUFBZ0QsQ0FBVixRQUFROztBQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUN4RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUMxRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3pDLGlCQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDOUQsTUFBSSxlQUFlLEVBQUU7O0FBRW5CLGlCQUFhLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDckIsU0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFVBQVUsRUFBRSxJQUFJO2FBQUssYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO0tBQUEsQ0FBQyxDQUFBO0dBQ3pF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Q2xFLENBQUE7QUFDRCxZQUFJLGVBQWUsRUFBRTs7QUFFbkIsa0JBQVEsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtTQUNsRDtPQUNGLE1BQU0sSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFO0FBQ3pCLGdCQUFRLEdBQUcsTUFBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQWhCLGdCQUFnQixFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFFLENBQUMsQ0FBQTtPQUNwRSxNQUFNLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtBQUMzQixZQUFNLFVBQVUsR0FBRyxrQkFBSyxPQUFPLENBQUMsNEJBQVcsT0FBTyxFQUFFLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7QUFDakYsZ0JBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQTtPQUN4RTtBQUNELFVBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDeEIsQ0FBQyxPQUFPLFNBQVMsRUFBRTtBQUNsQixVQUFJLGtCQUFnQixPQUFPLEVBQUksRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUE7S0FDbkY7R0FDRixDQUFDLENBQUE7Q0FDSCxDQUFBLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy93b3JrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG4vKiBnbG9iYWwgZW1pdCAqL1xuXG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgRmluZENhY2hlLCBmaW5kQ2FjaGVkIH0gZnJvbSAnYXRvbS1saW50ZXInXG5pbXBvcnQgKiBhcyBIZWxwZXJzIGZyb20gJy4vd29ya2VyLWhlbHBlcnMnXG5pbXBvcnQgaXNDb25maWdBdEhvbWVSb290IGZyb20gJy4vaXMtY29uZmlnLWF0LWhvbWUtcm9vdCdcblxucHJvY2Vzcy50aXRsZSA9ICdsaW50ZXItZXNsaW50IGhlbHBlcidcblxuY29uc3QgcnVsZXNNZXRhZGF0YSA9IG5ldyBNYXAoKVxubGV0IHNob3VsZFNlbmRSdWxlcyA9IGZhbHNlXG5cbmZ1bmN0aW9uIGxpbnRKb2IoeyBjbGlFbmdpbmVPcHRpb25zLCBjb250ZW50cywgZXNsaW50LCBmaWxlUGF0aCB9KSB7XG4gIGNvbnN0IGNsaUVuZ2luZSA9IG5ldyBlc2xpbnQuQ0xJRW5naW5lKGNsaUVuZ2luZU9wdGlvbnMpXG4gIGNvbnN0IHJlcG9ydCA9IGNsaUVuZ2luZS5leGVjdXRlT25UZXh0KGNvbnRlbnRzLCBmaWxlUGF0aClcbiAgY29uc3QgcnVsZXMgPSBIZWxwZXJzLmdldFJ1bGVzKGNsaUVuZ2luZSlcbiAgc2hvdWxkU2VuZFJ1bGVzID0gSGVscGVycy5kaWRSdWxlc0NoYW5nZShydWxlc01ldGFkYXRhLCBydWxlcylcbiAgaWYgKHNob3VsZFNlbmRSdWxlcykge1xuICAgIC8vIFJlYnVpbGQgcnVsZXNNZXRhZGF0YVxuICAgIHJ1bGVzTWV0YWRhdGEuY2xlYXIoKVxuICAgIHJ1bGVzLmZvckVhY2goKHByb3BlcnRpZXMsIHJ1bGUpID0+IHJ1bGVzTWV0YWRhdGEuc2V0KHJ1bGUsIHByb3BlcnRpZXMpKVxuICB9XG4gIHJldHVybiByZXBvcnRcbn1cblxuZnVuY3Rpb24gZml4Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSkge1xuICBjb25zdCByZXBvcnQgPSBsaW50Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSlcblxuICBlc2xpbnQuQ0xJRW5naW5lLm91dHB1dEZpeGVzKHJlcG9ydClcblxuICBpZiAoIXJlcG9ydC5yZXN1bHRzLmxlbmd0aCB8fCAhcmVwb3J0LnJlc3VsdHNbMF0ubWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICdMaW50ZXItRVNMaW50OiBGaXggY29tcGxldGUuJ1xuICB9XG4gIHJldHVybiAnTGludGVyLUVTTGludDogRml4IGF0dGVtcHQgY29tcGxldGUsIGJ1dCBsaW50aW5nIGVycm9ycyByZW1haW4uJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jICgpID0+IHtcbiAgcHJvY2Vzcy5vbignbWVzc2FnZScsIChqb2JDb25maWcpID0+IHtcbiAgICAvLyBXZSBjYXRjaCBhbGwgd29ya2VyIGVycm9ycyBzbyB0aGF0IHdlIGNhbiBjcmVhdGUgYSBzZXBhcmF0ZSBlcnJvciBlbWl0dGVyXG4gICAgLy8gZm9yIGVhY2ggZW1pdEtleSwgcmF0aGVyIHRoYW4gYWRkaW5nIG11bHRpcGxlIGxpc3RlbmVycyBmb3IgYHRhc2s6ZXJyb3JgXG4gICAgY29uc3Qge1xuICAgICAgY29udGVudHMsIHR5cGUsIGNvbmZpZywgZmlsZVBhdGgsIHByb2plY3RQYXRoLCBydWxlcywgZW1pdEtleVxuICAgIH0gPSBqb2JDb25maWdcbiAgICB0cnkge1xuICAgICAgaWYgKGNvbmZpZy5kaXNhYmxlRlNDYWNoZSkge1xuICAgICAgICBGaW5kQ2FjaGUuY2xlYXIoKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlRGlyID0gUGF0aC5kaXJuYW1lKGZpbGVQYXRoKVxuICAgICAgY29uc3QgZXNsaW50ID0gSGVscGVycy5nZXRFU0xpbnRJbnN0YW5jZShmaWxlRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxuICAgICAgY29uc3QgY29uZmlnUGF0aCA9IEhlbHBlcnMuZ2V0Q29uZmlnUGF0aChmaWxlRGlyKVxuICAgICAgY29uc3Qgbm9Qcm9qZWN0Q29uZmlnID0gKGNvbmZpZ1BhdGggPT09IG51bGwgfHwgaXNDb25maWdBdEhvbWVSb290KGNvbmZpZ1BhdGgpKVxuICAgICAgaWYgKG5vUHJvamVjdENvbmZpZyAmJiBjb25maWcuZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZykge1xuICAgICAgICBlbWl0KGVtaXRLZXksIHsgbWVzc2FnZXM6IFtdIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gSGVscGVycy5nZXRSZWxhdGl2ZVBhdGgoZmlsZURpciwgZmlsZVBhdGgsIGNvbmZpZywgcHJvamVjdFBhdGgpXG5cbiAgICAgIGNvbnN0IGNsaUVuZ2luZU9wdGlvbnMgPSBIZWxwZXJzXG4gICAgICAgIC5nZXRDTElFbmdpbmVPcHRpb25zKHR5cGUsIGNvbmZpZywgcnVsZXMsIHJlbGF0aXZlRmlsZVBhdGgsIGZpbGVEaXIsIGNvbmZpZ1BhdGgpXG5cbiAgICAgIGxldCByZXNwb25zZVxuICAgICAgaWYgKHR5cGUgPT09ICdsaW50Jykge1xuICAgICAgICBjb25zdCByZXBvcnQgPSBsaW50Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSlcbiAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgbWVzc2FnZXM6IHJlcG9ydC5yZXN1bHRzLmxlbmd0aCA/IHJlcG9ydC5yZXN1bHRzWzBdLm1lc3NhZ2VzIDogW11cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvdWxkU2VuZFJ1bGVzKSB7XG4gICAgICAgICAgLy8gWW91IGNhbid0IGVtaXQgTWFwcywgY29udmVydCB0byBBcnJheSBvZiBBcnJheXMgdG8gc2VuZCBiYWNrLlxuICAgICAgICAgIHJlc3BvbnNlLnVwZGF0ZWRSdWxlcyA9IEFycmF5LmZyb20ocnVsZXNNZXRhZGF0YSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZml4Jykge1xuICAgICAgICByZXNwb25zZSA9IGZpeEpvYih7IGNsaUVuZ2luZU9wdGlvbnMsIGNvbnRlbnRzLCBlc2xpbnQsIGZpbGVQYXRoIH0pXG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdkZWJ1ZycpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gICAgICAgIHJlc3BvbnNlID0gSGVscGVycy5maW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpXG4gICAgICB9XG4gICAgICBlbWl0KGVtaXRLZXksIHJlc3BvbnNlKVxuICAgIH0gY2F0Y2ggKHdvcmtlckVycikge1xuICAgICAgZW1pdChgd29ya2VyRXJyb3I6JHtlbWl0S2V5fWAsIHsgbXNnOiB3b3JrZXJFcnIubWVzc2FnZSwgc3RhY2s6IHdvcmtlckVyci5zdGFjayB9KVxuICAgIH1cbiAgfSlcbn1cbiJdfQ==