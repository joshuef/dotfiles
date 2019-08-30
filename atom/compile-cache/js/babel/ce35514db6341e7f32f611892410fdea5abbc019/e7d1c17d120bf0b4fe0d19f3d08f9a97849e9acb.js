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

var fixableRules = new Set();
var sendRules = false;

/**
 * Modifies the closed-over fixableRules variable when called _if_ there are
 * newly-loaded fixable rules or fixable rules are removed from the set of all
 * loaded rules, according to the eslint `linter` instance that is passed in.
 *
 * @param  {Object} linter eslint 'linter' instance
 * @return {void}
 */
function updateFixableRules(linter) {
  if (linter === undefined) {
    // ESLint < v4 doesn't support this property
    return;
  }

  // Build a set of fixable rules based on the rules loaded in the provided linter
  var currentRules = new Set();
  linter.getRules().forEach(function (props, rule) {
    if (Object.prototype.hasOwnProperty.call(props, 'meta') && Object.prototype.hasOwnProperty.call(props.meta, 'fixable')) {
      currentRules.add(rule);
    }
  });

  // Unless something has changed, we won't need to send updated set of fixableRules
  sendRules = false;

  // Check for new fixable rules added since the last time we sent fixableRules
  var newRules = new Set(currentRules);
  fixableRules.forEach(function (rule) {
    return newRules['delete'](rule);
  });
  if (newRules.size > 0) {
    sendRules = true;
  }

  // Check for fixable rules that were removed since the last time we sent fixableRules
  var removedRules = new Set(fixableRules);
  currentRules.forEach(function (rule) {
    return removedRules['delete'](rule);
  });
  if (removedRules.size > 0) {
    sendRules = true;
  }

  if (sendRules) {
    // Rebuild fixableRules
    fixableRules.clear();
    currentRules.forEach(function (rule) {
      return fixableRules.add(rule);
    });
  }
}

function lintJob(_ref) {
  var cliEngineOptions = _ref.cliEngineOptions;
  var contents = _ref.contents;
  var eslint = _ref.eslint;
  var filePath = _ref.filePath;

  var cliEngine = new eslint.CLIEngine(cliEngineOptions);
  var report = cliEngine.executeOnText(contents, filePath);
  // Use the internal (undocumented) `linter` instance attached to the cliEngine
  // to check the loaded rules (including plugin rules) and update our list of fixable rules.
  updateFixableRules(cliEngine.linter);
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
    var contents = jobConfig.contents;
    var type = jobConfig.type;
    var config = jobConfig.config;
    var filePath = jobConfig.filePath;
    var projectPath = jobConfig.projectPath;
    var rules = jobConfig.rules;
    var emitKey = jobConfig.emitKey;

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
      if (sendRules) {
        response.fixableRules = Array.from(fixableRules.keys());
      }
    } else if (type === 'fix') {
      response = fixJob({ cliEngineOptions: cliEngineOptions, contents: contents, eslint: eslint, filePath: filePath });
    } else if (type === 'debug') {
      var modulesDir = _path2['default'].dirname((0, _atomLinter.findCached)(fileDir, 'node_modules/eslint') || '');
      response = Helpers.findESLintDirectory(modulesDir, config, projectPath);
    }
    emit(emitKey, response);
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUlpQixNQUFNOzs7OzBCQUNlLGFBQWE7OzZCQUMxQixrQkFBa0I7O0lBQS9CLE9BQU87O2tDQUNZLDBCQUEwQjs7OztBQVB6RCxXQUFXLENBQUE7O0FBU1gsT0FBTyxDQUFDLEtBQUssR0FBRyxzQkFBc0IsQ0FBQTs7QUFFdEMsSUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUM5QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUE7Ozs7Ozs7Ozs7QUFVckIsU0FBUyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUU7QUFDbEMsTUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFOztBQUV4QixXQUFNO0dBQ1A7OztBQUdELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDOUIsUUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBRSxJQUFJLEVBQUs7QUFDekMsUUFDRSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUNuRCxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFDM0Q7QUFDQSxrQkFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUN2QjtHQUNGLENBQUMsQ0FBQTs7O0FBR0YsV0FBUyxHQUFHLEtBQUssQ0FBQTs7O0FBR2pCLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3RDLGNBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO1dBQUksUUFBUSxVQUFPLENBQUMsSUFBSSxDQUFDO0dBQUEsQ0FBQyxDQUFBO0FBQ25ELE1B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Q3pCLGNBQVEsR0FBRyxNQUFNLENBQUMsRUFBRSxnQkFBZ0IsRUFBaEIsZ0JBQWdCLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxNQUFNLEVBQU4sTUFBTSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsQ0FBQyxDQUFBO0tBQ3BFLE1BQU0sSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQzNCLFVBQU0sVUFBVSxHQUFHLGtCQUFLLE9BQU8sQ0FBQyw0QkFBVyxPQUFPLEVBQUUscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUNqRixjQUFRLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUE7S0FDeEU7QUFDRCxRQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0dBQ3hCLENBQUMsQ0FBQTtDQUNILENBQUEsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci1lc2xpbnQvc3JjL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbi8qIGdsb2JhbCBlbWl0ICovXG5cbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaW5kQ2FjaGUsIGZpbmRDYWNoZWQgfSBmcm9tICdhdG9tLWxpbnRlcidcbmltcG9ydCAqIGFzIEhlbHBlcnMgZnJvbSAnLi93b3JrZXItaGVscGVycydcbmltcG9ydCBpc0NvbmZpZ0F0SG9tZVJvb3QgZnJvbSAnLi9pcy1jb25maWctYXQtaG9tZS1yb290J1xuXG5wcm9jZXNzLnRpdGxlID0gJ2xpbnRlci1lc2xpbnQgaGVscGVyJ1xuXG5jb25zdCBmaXhhYmxlUnVsZXMgPSBuZXcgU2V0KClcbmxldCBzZW5kUnVsZXMgPSBmYWxzZVxuXG4vKipcbiAqIE1vZGlmaWVzIHRoZSBjbG9zZWQtb3ZlciBmaXhhYmxlUnVsZXMgdmFyaWFibGUgd2hlbiBjYWxsZWQgX2lmXyB0aGVyZSBhcmVcbiAqIG5ld2x5LWxvYWRlZCBmaXhhYmxlIHJ1bGVzIG9yIGZpeGFibGUgcnVsZXMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgc2V0IG9mIGFsbFxuICogbG9hZGVkIHJ1bGVzLCBhY2NvcmRpbmcgdG8gdGhlIGVzbGludCBgbGludGVyYCBpbnN0YW5jZSB0aGF0IGlzIHBhc3NlZCBpbi5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGxpbnRlciBlc2xpbnQgJ2xpbnRlcicgaW5zdGFuY2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUZpeGFibGVSdWxlcyhsaW50ZXIpIHtcbiAgaWYgKGxpbnRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gRVNMaW50IDwgdjQgZG9lc24ndCBzdXBwb3J0IHRoaXMgcHJvcGVydHlcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIEJ1aWxkIGEgc2V0IG9mIGZpeGFibGUgcnVsZXMgYmFzZWQgb24gdGhlIHJ1bGVzIGxvYWRlZCBpbiB0aGUgcHJvdmlkZWQgbGludGVyXG4gIGNvbnN0IGN1cnJlbnRSdWxlcyA9IG5ldyBTZXQoKVxuICBsaW50ZXIuZ2V0UnVsZXMoKS5mb3JFYWNoKChwcm9wcywgcnVsZSkgPT4ge1xuICAgIGlmIChcbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm9wcywgJ21ldGEnKSAmJlxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3BzLm1ldGEsICdmaXhhYmxlJylcbiAgICApIHtcbiAgICAgIGN1cnJlbnRSdWxlcy5hZGQocnVsZSlcbiAgICB9XG4gIH0pXG5cbiAgLy8gVW5sZXNzIHNvbWV0aGluZyBoYXMgY2hhbmdlZCwgd2Ugd29uJ3QgbmVlZCB0byBzZW5kIHVwZGF0ZWQgc2V0IG9mIGZpeGFibGVSdWxlc1xuICBzZW5kUnVsZXMgPSBmYWxzZVxuXG4gIC8vIENoZWNrIGZvciBuZXcgZml4YWJsZSBydWxlcyBhZGRlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHdlIHNlbnQgZml4YWJsZVJ1bGVzXG4gIGNvbnN0IG5ld1J1bGVzID0gbmV3IFNldChjdXJyZW50UnVsZXMpXG4gIGZpeGFibGVSdWxlcy5mb3JFYWNoKHJ1bGUgPT4gbmV3UnVsZXMuZGVsZXRlKHJ1bGUpKVxuICBpZiAobmV3UnVsZXMuc2l6ZSA+IDApIHtcbiAgICBzZW5kUnVsZXMgPSB0cnVlXG4gIH1cblxuICAvLyBDaGVjayBmb3IgZml4YWJsZSBydWxlcyB0aGF0IHdlcmUgcmVtb3ZlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHdlIHNlbnQgZml4YWJsZVJ1bGVzXG4gIGNvbnN0IHJlbW92ZWRSdWxlcyA9IG5ldyBTZXQoZml4YWJsZVJ1bGVzKVxuICBjdXJyZW50UnVsZXMuZm9yRWFjaChydWxlID0+IHJlbW92ZWRSdWxlcy5kZWxldGUocnVsZSkpXG4gIGlmIChyZW1vdmVkUnVsZXMuc2l6ZSA+IDApIHtcbiAgICBzZW5kUnVsZXMgPSB0cnVlXG4gIH1cblxuICBpZiAoc2VuZFJ1bGVzKSB7XG4gICAgLy8gUmVidWlsZCBmaXhhYmxlUnVsZXNcbiAgICBmaXhhYmxlUnVsZXMuY2xlYXIoKVxuICAgIGN1cnJlbnRSdWxlcy5mb3JFYWNoKHJ1bGUgPT4gZml4YWJsZVJ1bGVzLmFkZChydWxlKSlcbiAgfVxufVxuXG5mdW5jdGlvbiBsaW50Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSkge1xuICBjb25zdCBjbGlFbmdpbmUgPSBuZXcgZXNsaW50LkNMSUVuZ2luZShjbGlFbmdpbmVPcHRpb25zKVxuICBjb25zdCByZXBvcnQgPSBjbGlFbmdpbmUuZXhlY3V0ZU9uVGV4dChjb250ZW50cywgZmlsZVBhdGgpXG4gIC8vIFVzZSB0aGUgaW50ZXJuYWwgKHVuZG9jdW1lbnRlZCkgYGxpbnRlcmAgaW5zdGFuY2UgYXR0YWNoZWQgdG8gdGhlIGNsaUVuZ2luZVxuICAvLyB0byBjaGVjayB0aGUgbG9hZGVkIHJ1bGVzIChpbmNsdWRpbmcgcGx1Z2luIHJ1bGVzKSBhbmQgdXBkYXRlIG91ciBsaXN0IG9mIGZpeGFibGUgcnVsZXMuXG4gIHVwZGF0ZUZpeGFibGVSdWxlcyhjbGlFbmdpbmUubGludGVyKVxuICByZXR1cm4gcmVwb3J0XG59XG5cbmZ1bmN0aW9uIGZpeEpvYih7IGNsaUVuZ2luZU9wdGlvbnMsIGNvbnRlbnRzLCBlc2xpbnQsIGZpbGVQYXRoIH0pIHtcbiAgY29uc3QgcmVwb3J0ID0gbGludEpvYih7IGNsaUVuZ2luZU9wdGlvbnMsIGNvbnRlbnRzLCBlc2xpbnQsIGZpbGVQYXRoIH0pXG5cbiAgZXNsaW50LkNMSUVuZ2luZS5vdXRwdXRGaXhlcyhyZXBvcnQpXG5cbiAgaWYgKCFyZXBvcnQucmVzdWx0cy5sZW5ndGggfHwgIXJlcG9ydC5yZXN1bHRzWzBdLm1lc3NhZ2VzLmxlbmd0aCkge1xuICAgIHJldHVybiAnTGludGVyLUVTTGludDogRml4IGNvbXBsZXRlLidcbiAgfVxuICByZXR1cm4gJ0xpbnRlci1FU0xpbnQ6IEZpeCBhdHRlbXB0IGNvbXBsZXRlLCBidXQgbGludGluZyBlcnJvcnMgcmVtYWluLidcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyAoKSA9PiB7XG4gIHByb2Nlc3Mub24oJ21lc3NhZ2UnLCAoam9iQ29uZmlnKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgY29udGVudHMsIHR5cGUsIGNvbmZpZywgZmlsZVBhdGgsIHByb2plY3RQYXRoLCBydWxlcywgZW1pdEtleVxuICAgIH0gPSBqb2JDb25maWdcbiAgICBpZiAoY29uZmlnLmRpc2FibGVGU0NhY2hlKSB7XG4gICAgICBGaW5kQ2FjaGUuY2xlYXIoKVxuICAgIH1cblxuICAgIGNvbnN0IGZpbGVEaXIgPSBQYXRoLmRpcm5hbWUoZmlsZVBhdGgpXG4gICAgY29uc3QgZXNsaW50ID0gSGVscGVycy5nZXRFU0xpbnRJbnN0YW5jZShmaWxlRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBIZWxwZXJzLmdldENvbmZpZ1BhdGgoZmlsZURpcilcbiAgICBjb25zdCBub1Byb2plY3RDb25maWcgPSAoY29uZmlnUGF0aCA9PT0gbnVsbCB8fCBpc0NvbmZpZ0F0SG9tZVJvb3QoY29uZmlnUGF0aCkpXG4gICAgaWYgKG5vUHJvamVjdENvbmZpZyAmJiBjb25maWcuZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZykge1xuICAgICAgZW1pdChlbWl0S2V5LCB7IG1lc3NhZ2VzOiBbXSB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IEhlbHBlcnMuZ2V0UmVsYXRpdmVQYXRoKGZpbGVEaXIsIGZpbGVQYXRoLCBjb25maWcsIHByb2plY3RQYXRoKVxuXG4gICAgY29uc3QgY2xpRW5naW5lT3B0aW9ucyA9IEhlbHBlcnNcbiAgICAgIC5nZXRDTElFbmdpbmVPcHRpb25zKHR5cGUsIGNvbmZpZywgcnVsZXMsIHJlbGF0aXZlRmlsZVBhdGgsIGZpbGVEaXIsIGNvbmZpZ1BhdGgpXG5cbiAgICBsZXQgcmVzcG9uc2VcbiAgICBpZiAodHlwZSA9PT0gJ2xpbnQnKSB7XG4gICAgICBjb25zdCByZXBvcnQgPSBsaW50Sm9iKHsgY2xpRW5naW5lT3B0aW9ucywgY29udGVudHMsIGVzbGludCwgZmlsZVBhdGggfSlcbiAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICBtZXNzYWdlczogcmVwb3J0LnJlc3VsdHMubGVuZ3RoID8gcmVwb3J0LnJlc3VsdHNbMF0ubWVzc2FnZXMgOiBbXVxuICAgICAgfVxuICAgICAgaWYgKHNlbmRSdWxlcykge1xuICAgICAgICByZXNwb25zZS5maXhhYmxlUnVsZXMgPSBBcnJheS5mcm9tKGZpeGFibGVSdWxlcy5rZXlzKCkpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnZml4Jykge1xuICAgICAgcmVzcG9uc2UgPSBmaXhKb2IoeyBjbGlFbmdpbmVPcHRpb25zLCBjb250ZW50cywgZXNsaW50LCBmaWxlUGF0aCB9KVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2RlYnVnJykge1xuICAgICAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gICAgICByZXNwb25zZSA9IEhlbHBlcnMuZmluZEVTTGludERpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxuICAgIH1cbiAgICBlbWl0KGVtaXRLZXksIHJlc3BvbnNlKVxuICB9KVxufVxuIl19