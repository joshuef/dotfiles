Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getNodePrefixPath = getNodePrefixPath;
exports.findESLintDirectory = findESLintDirectory;
exports.getESLintFromDirectory = getESLintFromDirectory;
exports.refreshModulesPath = refreshModulesPath;
exports.getESLintInstance = getESLintInstance;
exports.getConfigPath = getConfigPath;
exports.getRelativePath = getRelativePath;
exports.getCLIEngineOptions = getCLIEngineOptions;
exports.getRules = getRules;
exports.didRulesChange = didRulesChange;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _resolveEnv = require('resolve-env');

var _resolveEnv2 = _interopRequireDefault(_resolveEnv);

var _atomLinter = require('atom-linter');

var _consistentPath = require('consistent-path');

var _consistentPath2 = _interopRequireDefault(_consistentPath);

'use babel';

var Cache = {
  ESLINT_LOCAL_PATH: _path2['default'].normalize(_path2['default'].join(__dirname, '..', 'node_modules', 'eslint')),
  NODE_PREFIX_PATH: null,
  LAST_MODULES_PATH: null
};

/**
 * Takes a path and translates `~` to the user's home directory, and replaces
 * all environment variables with their value.
 * @param  {string} path The path to remove "strangeness" from
 * @return {string}      The cleaned path
 */
var cleanPath = function cleanPath(path) {
  return path ? (0, _resolveEnv2['default'])(_fsPlus2['default'].normalize(path)) : '';
};

function getNodePrefixPath() {
  if (Cache.NODE_PREFIX_PATH === null) {
    var npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    try {
      Cache.NODE_PREFIX_PATH = _child_process2['default'].spawnSync(npmCommand, ['get', 'prefix'], {
        env: Object.assign(Object.assign({}, process.env), { PATH: (0, _consistentPath2['default'])() })
      }).output[1].toString().trim();
    } catch (e) {
      var errMsg = 'Unable to execute `npm get prefix`. Please make sure ' + 'Atom is getting $PATH correctly.';
      throw new Error(errMsg);
    }
  }
  return Cache.NODE_PREFIX_PATH;
}

function isDirectory(dirPath) {
  var isDir = undefined;
  try {
    isDir = _fsPlus2['default'].statSync(dirPath).isDirectory();
  } catch (e) {
    isDir = false;
  }
  return isDir;
}

function findESLintDirectory(modulesDir, config, projectPath) {
  var eslintDir = null;
  var locationType = null;
  if (config.useGlobalEslint) {
    locationType = 'global';
    var configGlobal = cleanPath(config.globalNodePath);
    var prefixPath = configGlobal || getNodePrefixPath();
    // NPM on Windows and Yarn on all platforms
    eslintDir = _path2['default'].join(prefixPath, 'node_modules', 'eslint');
    if (!isDirectory(eslintDir)) {
      // NPM on platforms other than Windows
      eslintDir = _path2['default'].join(prefixPath, 'lib', 'node_modules', 'eslint');
    }
  } else if (!config.advancedLocalNodeModules) {
    locationType = 'local project';
    eslintDir = _path2['default'].join(modulesDir || '', 'eslint');
  } else if (_path2['default'].isAbsolute(cleanPath(config.advancedLocalNodeModules))) {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(cleanPath(config.advancedLocalNodeModules), 'eslint');
  } else {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(projectPath || '', cleanPath(config.advancedLocalNodeModules), 'eslint');
  }
  if (isDirectory(eslintDir)) {
    return {
      path: eslintDir,
      type: locationType
    };
  } else if (config.useGlobalEslint) {
    throw new Error('ESLint not found, please ensure the global Node path is set correctly.');
  }
  return {
    path: Cache.ESLINT_LOCAL_PATH,
    type: 'bundled fallback'
  };
}

function getESLintFromDirectory(modulesDir, config, projectPath) {
  var _findESLintDirectory = findESLintDirectory(modulesDir, config, projectPath);

  var ESLintDirectory = _findESLintDirectory.path;

  try {
    // eslint-disable-next-line import/no-dynamic-require
    return require(ESLintDirectory);
  } catch (e) {
    if (config.useGlobalEslint && e.code === 'MODULE_NOT_FOUND') {
      throw new Error('ESLint not found, try restarting Atom to clear caches.');
    }
    // eslint-disable-next-line import/no-dynamic-require
    return require(Cache.ESLINT_LOCAL_PATH);
  }
}

function refreshModulesPath(modulesDir) {
  if (Cache.LAST_MODULES_PATH !== modulesDir) {
    Cache.LAST_MODULES_PATH = modulesDir;
    process.env.NODE_PATH = modulesDir || '';
    // eslint-disable-next-line no-underscore-dangle
    require('module').Module._initPaths();
  }
}

function getESLintInstance(fileDir, config, projectPath) {
  var modulesDir = _path2['default'].dirname((0, _atomLinter.findCached)(fileDir, 'node_modules/eslint') || '');
  refreshModulesPath(modulesDir);
  return getESLintFromDirectory(modulesDir, config, projectPath);
}

function getConfigPath(_x) {
  var _again = true;

  _function: while (_again) {
    var fileDir = _x;
    _again = false;

    var configFile = (0, _atomLinter.findCached)(fileDir, ['.eslintrc.js', '.eslintrc.yaml', '.eslintrc.yml', '.eslintrc.json', '.eslintrc', 'package.json']);
    if (configFile) {
      if (_path2['default'].basename(configFile) === 'package.json') {
        // eslint-disable-next-line import/no-dynamic-require
        if (require(configFile).eslintConfig) {
          return configFile;
        }
        // If we are here, we found a package.json without an eslint config
        // in a dir without any other eslint config files
        // (because 'package.json' is last in the call to findCached)
        // So, keep looking from the parent directory
        _x = _path2['default'].resolve(_path2['default'].dirname(configFile), '..');
        _again = true;
        configFile = undefined;
        continue _function;
      }
      return configFile;
    }
    return null;
  }
}

function getRelativePath(fileDir, filePath, config, projectPath) {
  var ignoreFile = config.disableEslintIgnore ? null : (0, _atomLinter.findCached)(fileDir, '.eslintignore');

  // If we can find an .eslintignore file, we can set cwd there
  // (because they are expected to be at the project root)
  if (ignoreFile) {
    var ignoreDir = _path2['default'].dirname(ignoreFile);
    process.chdir(ignoreDir);
    return _path2['default'].relative(ignoreDir, filePath);
  }
  // Otherwise, we'll set the cwd to the atom project root as long as that exists
  if (projectPath) {
    process.chdir(projectPath);
    return _path2['default'].relative(projectPath, filePath);
  }
  // If all else fails, use the file location itself
  process.chdir(fileDir);
  return _path2['default'].basename(filePath);
}

function getCLIEngineOptions(type, config, rules, filePath, fileDir, givenConfigPath) {
  var cliEngineConfig = {
    rules: rules,
    ignore: !config.disableEslintIgnore,
    fix: type === 'fix'
  };

  var ignoreFile = config.disableEslintIgnore ? null : (0, _atomLinter.findCached)(fileDir, '.eslintignore');
  if (ignoreFile) {
    cliEngineConfig.ignorePath = ignoreFile;
  }

  cliEngineConfig.rulePaths = config.eslintRulesDirs.map(function (path) {
    var rulesDir = cleanPath(path);
    if (!_path2['default'].isAbsolute(rulesDir)) {
      return (0, _atomLinter.findCached)(fileDir, rulesDir);
    }
    return rulesDir;
  }).filter(function (path) {
    return path;
  });

  if (givenConfigPath === null && config.eslintrcPath) {
    // If we didn't find a configuration use the fallback from the settings
    cliEngineConfig.configFile = cleanPath(config.eslintrcPath);
  }

  return cliEngineConfig;
}

/**
 * Gets the list of rules used for a lint job
 * @param  {Object} cliEngine The CLIEngine instance used for the lint job
 * @return {Map}              A Map of the rules used, rule names as keys, rule
 *                            properties as the contents.
 */

function getRules(cliEngine) {
  // Pull the list of rules used directly from the CLIEngine
  // Added in https://github.com/eslint/eslint/pull/9782
  if (Object.prototype.hasOwnProperty.call(cliEngine, 'getRules')) {
    return cliEngine.getRules();
  }

  // Attempt to use the internal (undocumented) `linter` instance attached to
  // the CLIEngine to get the loaded rules (including plugin rules).
  // Added in ESLint v4
  if (Object.prototype.hasOwnProperty.call(cliEngine, 'linter')) {
    return cliEngine.linter.getRules();
  }

  // Older versions of ESLint don't (easily) support getting a list of rules
  return new Map();
}

/**
 * Given an exiting rule list and a new rule list, determines whether there
 * have been changes.
 * NOTE: This only accounts for presence of the rules, changes to their metadata
 * are not taken into account.
 * @param  {Map} newRules     A Map of the new rules
 * @param  {Map} currentRules A Map of the current rules
 * @return {boolean}             Whether or not there were changes
 */

function didRulesChange(currentRules, newRules) {
  return !(currentRules.size === newRules.size && Array.from(currentRules.keys()).every(function (ruleId) {
    return newRules.has(ruleId);
  }));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLWhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztvQkFFaUIsTUFBTTs7OztzQkFDUixTQUFTOzs7OzZCQUNDLGVBQWU7Ozs7MEJBQ2pCLGFBQWE7Ozs7MEJBQ1QsYUFBYTs7OEJBQ3BCLGlCQUFpQjs7OztBQVByQyxXQUFXLENBQUE7O0FBU1gsSUFBTSxLQUFLLEdBQUc7QUFDWixtQkFBaUIsRUFBRSxrQkFBSyxTQUFTLENBQUMsa0JBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZGLGtCQUFnQixFQUFFLElBQUk7QUFDdEIsbUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFBOzs7Ozs7OztBQVFELElBQU0sU0FBUyxHQUFHLFNBQVosU0FBUyxDQUFHLElBQUk7U0FBSyxJQUFJLEdBQUcsNkJBQVcsb0JBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRTtDQUFDLENBQUE7O0FBRS9ELFNBQVMsaUJBQWlCLEdBQUc7QUFDbEMsTUFBSSxLQUFLLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxFQUFFO0FBQ25DLFFBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUE7QUFDbkUsUUFBSTtBQUNGLFdBQUssQ0FBQyxnQkFBZ0IsR0FDcEIsMkJBQWEsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRTtBQUNwRCxXQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0NBQVMsRUFBRSxDQUFDO09BQ3hFLENBQUMsQ0FB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QUMsUUFBUSxFQUFFLENBQUE7R0FDbkM7OztBQUdELFNBQU8sSUFBSSxHQUFHLEVBQUUsQ0FBQTtDQUNqQjs7Ozs7Ozs7Ozs7O0FBV00sU0FBUyxjQUFjLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRTtBQUNyRCxTQUFPLEVBQUUsWUFBWSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxJQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLE1BQU07V0FBSSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztHQUFBLENBQUMsQ0FBQSxBQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy93b3JrZXItaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMtcGx1cydcbmltcG9ydCBDaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2VzcydcbmltcG9ydCByZXNvbHZlRW52IGZyb20gJ3Jlc29sdmUtZW52J1xuaW1wb3J0IHsgZmluZENhY2hlZCB9IGZyb20gJ2F0b20tbGludGVyJ1xuaW1wb3J0IGdldFBhdGggZnJvbSAnY29uc2lzdGVudC1wYXRoJ1xuXG5jb25zdCBDYWNoZSA9IHtcbiAgRVNMSU5UX0xPQ0FMX1BBVEg6IFBhdGgubm9ybWFsaXplKFBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdub2RlX21vZHVsZXMnLCAnZXNsaW50JykpLFxuICBOT0RFX1BSRUZJWF9QQVRIOiBudWxsLFxuICBMQVNUX01PRFVMRVNfUEFUSDogbnVsbFxufVxuXG4vKipcbiAqIFRha2VzIGEgcGF0aCBhbmQgdHJhbnNsYXRlcyBgfmAgdG8gdGhlIHVzZXIncyBob21lIGRpcmVjdG9yeSwgYW5kIHJlcGxhY2VzXG4gKiBhbGwgZW52aXJvbm1lbnQgdmFyaWFibGVzIHdpdGggdGhlaXIgdmFsdWUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gcmVtb3ZlIFwic3RyYW5nZW5lc3NcIiBmcm9tXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgVGhlIGNsZWFuZWQgcGF0aFxuICovXG5jb25zdCBjbGVhblBhdGggPSBwYXRoID0+IChwYXRoID8gcmVzb2x2ZUVudihmcy5ub3JtYWxpemUocGF0aCkpIDogJycpXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlUHJlZml4UGF0aCgpIHtcbiAgaWYgKENhY2hlLk5PREVfUFJFRklYX1BBVEggPT09IG51bGwpIHtcbiAgICBjb25zdCBucG1Db21tYW5kID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/ICducG0uY21kJyA6ICducG0nXG4gICAgdHJ5IHtcbiAgICAgIENhY2hlLk5PREVfUFJFRklYX1BBVEggPVxuICAgICAgICBDaGlsZFByb2Nlc3Muc3Bhd25TeW5jKG5wbUNvbW1hbmQsIFsnZ2V0JywgJ3ByZWZpeCddLCB7XG4gICAgICAgICAgZW52OiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHByb2Nlc3MuZW52KSwgeyBQQVRIOiBnZXRQYXRoKCkgfSlcbiAgICAgICAgfSkub3V0cHV0WzFdLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyTXNnID0gJ1VuYWJsZSB0byBleGVjdXRlIGBucG0gZ2V0IHByZWZpeGAuIFBsZWFzZSBtYWtlIHN1cmUgJyArXG4gICAgICAgICdBdG9tIGlzIGdldHRpbmcgJFBBVEggY29ycmVjdGx5LidcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpXG4gICAgfVxuICB9XG4gIHJldHVybiBDYWNoZS5OT0RFX1BSRUZJWF9QQVRIXG59XG5cbmZ1bmN0aW9uIGlzRGlyZWN0b3J5KGRpclBhdGgpIHtcbiAgbGV0IGlzRGlyXG4gIHRyeSB7XG4gICAgaXNEaXIgPSBmcy5zdGF0U3luYyhkaXJQYXRoKS5pc0RpcmVjdG9yeSgpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpc0RpciA9IGZhbHNlXG4gIH1cbiAgcmV0dXJuIGlzRGlyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgbGV0IGVzbGludERpciA9IG51bGxcbiAgbGV0IGxvY2F0aW9uVHlwZSA9IG51bGxcbiAgaWYgKGNvbmZpZy51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICBsb2NhdGlvblR5cGUgPSAnZ2xvYmFsJ1xuICAgIGNvbnN0IGNvbmZpZ0dsb2JhbCA9IGNsZWFuUGF0aChjb25maWcuZ2xvYmFsTm9kZVBhdGgpXG4gICAgY29uc3QgcHJlZml4UGF0aCA9IGNvbmZpZ0dsb2JhbCB8fCBnZXROb2RlUHJlZml4UGF0aCgpXG4gICAgLy8gTlBNIG9uIFdpbmRvd3MgYW5kIFlhcm4gb24gYWxsIHBsYXRmb3Jtc1xuICAgIGVzbGludERpciA9IFBhdGguam9pbihwcmVmaXhQYXRoLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgaWYgKCFpc0RpcmVjdG9yeShlc2xpbnREaXIpKSB7XG4gICAgICAvLyBOUE0gb24gcGxhdGZvcm1zIG90aGVyIHRoYW4gV2luZG93c1xuICAgICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByZWZpeFBhdGgsICdsaWInLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgfVxuICB9IGVsc2UgaWYgKCFjb25maWcuYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2xvY2FsIHByb2plY3QnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKG1vZHVsZXNEaXIgfHwgJycsICdlc2xpbnQnKVxuICB9IGVsc2UgaWYgKFBhdGguaXNBYnNvbHV0ZShjbGVhblBhdGgoY29uZmlnLmFkdmFuY2VkTG9jYWxOb2RlTW9kdWxlcykpKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2FkdmFuY2VkIHNwZWNpZmllZCdcbiAgICBlc2xpbnREaXIgPSBQYXRoLmpvaW4oY2xlYW5QYXRoKGNvbmZpZy5hZHZhbmNlZExvY2FsTm9kZU1vZHVsZXMpLCAnZXNsaW50JylcbiAgfSBlbHNlIHtcbiAgICBsb2NhdGlvblR5cGUgPSAnYWR2YW5jZWQgc3BlY2lmaWVkJ1xuICAgIGVzbGludERpciA9IFBhdGguam9pbihwcm9qZWN0UGF0aCB8fCAnJywgY2xlYW5QYXRoKGNvbmZpZy5hZHZhbmNlZExvY2FsTm9kZU1vZHVsZXMpLCAnZXNsaW50JylcbiAgfVxuICBpZiAoaXNEaXJlY3RvcnkoZXNsaW50RGlyKSkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBlc2xpbnREaXIsXG4gICAgICB0eXBlOiBsb2NhdGlvblR5cGUsXG4gICAgfVxuICB9IGVsc2UgaWYgKGNvbmZpZy51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHBsZWFzZSBlbnN1cmUgdGhlIGdsb2JhbCBOb2RlIHBhdGggaXMgc2V0IGNvcnJlY3RseS4nKVxuICB9XG4gIHJldHVybiB7XG4gICAgcGF0aDogQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgsXG4gICAgdHlwZTogJ2J1bmRsZWQgZmFsbGJhY2snLFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFU0xpbnRGcm9tRGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgeyBwYXRoOiBFU0xpbnREaXJlY3RvcnkgfSA9IGZpbmRFU0xpbnREaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnLCBwcm9qZWN0UGF0aClcbiAgdHJ5IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgIHJldHVybiByZXF1aXJlKEVTTGludERpcmVjdG9yeSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChjb25maWcudXNlR2xvYmFsRXNsaW50ICYmIGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHRyeSByZXN0YXJ0aW5nIEF0b20gdG8gY2xlYXIgY2FjaGVzLicpXG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgcmV0dXJuIHJlcXVpcmUoQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKSB7XG4gIGlmIChDYWNoZS5MQVNUX01PRFVMRVNfUEFUSCAhPT0gbW9kdWxlc0Rpcikge1xuICAgIENhY2hlLkxBU1RfTU9EVUxFU19QQVRIID0gbW9kdWxlc0RpclxuICAgIHByb2Nlc3MuZW52Lk5PREVfUEFUSCA9IG1vZHVsZXNEaXIgfHwgJydcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5Nb2R1bGUuX2luaXRQYXRocygpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKVxuICByZXR1cm4gZ2V0RVNMaW50RnJvbURpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPVxuICAgIGZpbmRDYWNoZWQoZmlsZURpciwgW1xuICAgICAgJy5lc2xpbnRyYy5qcycsICcuZXNsaW50cmMueWFtbCcsICcuZXNsaW50cmMueW1sJywgJy5lc2xpbnRyYy5qc29uJywgJy5lc2xpbnRyYycsICdwYWNrYWdlLmpzb24nXG4gICAgXSlcbiAgaWYgKGNvbmZpZ0ZpbGUpIHtcbiAgICBpZiAoUGF0aC5iYXNlbmFtZShjb25maWdGaWxlKSA9PT0gJ3BhY2thZ2UuanNvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgICBpZiAocmVxdWlyZShjb25maWdGaWxlKS5lc2xpbnRDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ0ZpbGVcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBmb3VuZCBhIHBhY2thZ2UuanNvbiB3aXRob3V0IGFuIGVzbGludCBjb25maWdcbiAgICAgIC8vIGluIGEgZGlyIHdpdGhvdXQgYW55IG90aGVyIGVzbGludCBjb25maWcgZmlsZXNcbiAgICAgIC8vIChiZWNhdXNlICdwYWNrYWdlLmpzb24nIGlzIGxhc3QgaW4gdGhlIGNhbGwgdG8gZmluZENhY2hlZClcbiAgICAgIC8vIFNvLCBrZWVwIGxvb2tpbmcgZnJvbSB0aGUgcGFyZW50IGRpcmVjdG9yeVxuICAgICAgcmV0dXJuIGdldENvbmZpZ1BhdGgoUGF0aC5yZXNvbHZlKFBhdGguZGlybmFtZShjb25maWdGaWxlKSwgJy4uJykpXG4gICAgfVxuICAgIHJldHVybiBjb25maWdGaWxlXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbGF0aXZlUGF0aChmaWxlRGlyLCBmaWxlUGF0aCwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG5cbiAgLy8gSWYgd2UgY2FuIGZpbmQgYW4gLmVzbGludGlnbm9yZSBmaWxlLCB3ZSBjYW4gc2V0IGN3ZCB0aGVyZVxuICAvLyAoYmVjYXVzZSB0aGV5IGFyZSBleHBlY3RlZCB0byBiZSBhdCB0aGUgcHJvamVjdCByb290KVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNvbnN0IGlnbm9yZURpciA9IFBhdGguZGlybmFtZShpZ25vcmVGaWxlKVxuICAgIHByb2Nlc3MuY2hkaXIoaWdub3JlRGlyKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKGlnbm9yZURpciwgZmlsZVBhdGgpXG4gIH1cbiAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBzZXQgdGhlIGN3ZCB0byB0aGUgYXRvbSBwcm9qZWN0IHJvb3QgYXMgbG9uZyBhcyB0aGF0IGV4aXN0c1xuICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICBwcm9jZXNzLmNoZGlyKHByb2plY3RQYXRoKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKHByb2plY3RQYXRoLCBmaWxlUGF0aClcbiAgfVxuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIHRoZSBmaWxlIGxvY2F0aW9uIGl0c2VsZlxuICBwcm9jZXNzLmNoZGlyKGZpbGVEaXIpXG4gIHJldHVybiBQYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q0xJRW5naW5lT3B0aW9ucyh0eXBlLCBjb25maWcsIHJ1bGVzLCBmaWxlUGF0aCwgZmlsZURpciwgZ2l2ZW5Db25maWdQYXRoKSB7XG4gIGNvbnN0IGNsaUVuZ2luZUNvbmZpZyA9IHtcbiAgICBydWxlcyxcbiAgICBpZ25vcmU6ICFjb25maWcuZGlzYWJsZUVzbGludElnbm9yZSxcbiAgICBmaXg6IHR5cGUgPT09ICdmaXgnXG4gIH1cblxuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG4gIGlmIChpZ25vcmVGaWxlKSB7XG4gICAgY2xpRW5naW5lQ29uZmlnLmlnbm9yZVBhdGggPSBpZ25vcmVGaWxlXG4gIH1cblxuICBjbGlFbmdpbmVDb25maWcucnVsZVBhdGhzID0gY29uZmlnLmVzbGludFJ1bGVzRGlycy5tYXAoKHBhdGgpID0+IHtcbiAgICBjb25zdCBydWxlc0RpciA9IGNsZWFuUGF0aChwYXRoKVxuICAgIGlmICghUGF0aC5pc0Fic29sdXRlKHJ1bGVzRGlyKSkge1xuICAgICAgcmV0dXJuIGZpbmRDYWNoZWQoZmlsZURpciwgcnVsZXNEaXIpXG4gICAgfVxuICAgIHJldHVybiBydWxlc0RpclxuICB9KS5maWx0ZXIocGF0aCA9PiBwYXRoKVxuXG4gIGlmIChnaXZlbkNvbmZpZ1BhdGggPT09IG51bGwgJiYgY29uZmlnLmVzbGludHJjUGF0aCkge1xuICAgIC8vIElmIHdlIGRpZG4ndCBmaW5kIGEgY29uZmlndXJhdGlvbiB1c2UgdGhlIGZhbGxiYWNrIGZyb20gdGhlIHNldHRpbmdzXG4gICAgY2xpRW5naW5lQ29uZmlnLmNvbmZpZ0ZpbGUgPSBjbGVhblBhdGgoY29uZmlnLmVzbGludHJjUGF0aClcbiAgfVxuXG4gIHJldHVybiBjbGlFbmdpbmVDb25maWdcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsaXN0IG9mIHJ1bGVzIHVzZWQgZm9yIGEgbGludCBqb2JcbiAqIEBwYXJhbSAge09iamVjdH0gY2xpRW5naW5lIFRoZSBDTElFbmdpbmUgaW5zdGFuY2UgdXNlZCBmb3IgdGhlIGxpbnQgam9iXG4gKiBAcmV0dXJuIHtNYXB9ICAgICAgICAgICAgICBBIE1hcCBvZiB0aGUgcnVsZXMgdXNlZCwgcnVsZSBuYW1lcyBhcyBrZXlzLCBydWxlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIGFzIHRoZSBjb250ZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJ1bGVzKGNsaUVuZ2luZSkge1xuICAvLyBQdWxsIHRoZSBsaXN0IG9mIHJ1bGVzIHVzZWQgZGlyZWN0bHkgZnJvbSB0aGUgQ0xJRW5naW5lXG4gIC8vIEFkZGVkIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9lc2xpbnQvZXNsaW50L3B1bGwvOTc4MlxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNsaUVuZ2luZSwgJ2dldFJ1bGVzJykpIHtcbiAgICByZXR1cm4gY2xpRW5naW5lLmdldFJ1bGVzKClcbiAgfVxuXG4gIC8vIEF0dGVtcHQgdG8gdXNlIHRoZSBpbnRlcm5hbCAodW5kb2N1bWVudGVkKSBgbGludGVyYCBpbnN0YW5jZSBhdHRhY2hlZCB0b1xuICAvLyB0aGUgQ0xJRW5naW5lIHRvIGdldCB0aGUgbG9hZGVkIHJ1bGVzIChpbmNsdWRpbmcgcGx1Z2luIHJ1bGVzKS5cbiAgLy8gQWRkZWQgaW4gRVNMaW50IHY0XG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY2xpRW5naW5lLCAnbGludGVyJykpIHtcbiAgICByZXR1cm4gY2xpRW5naW5lLmxpbnRlci5nZXRSdWxlcygpXG4gIH1cblxuICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBFU0xpbnQgZG9uJ3QgKGVhc2lseSkgc3VwcG9ydCBnZXR0aW5nIGEgbGlzdCBvZiBydWxlc1xuICByZXR1cm4gbmV3IE1hcCgpXG59XG5cbi8qKlxuICogR2l2ZW4gYW4gZXhpdGluZyBydWxlIGxpc3QgYW5kIGEgbmV3IHJ1bGUgbGlzdCwgZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZXJlXG4gKiBoYXZlIGJlZW4gY2hhbmdlcy5cbiAqIE5PVEU6IFRoaXMgb25seSBhY2NvdW50cyBmb3IgcHJlc2VuY2Ugb2YgdGhlIHJ1bGVzLCBjaGFuZ2VzIHRvIHRoZWlyIG1ldGFkYXRhXG4gKiBhcmUgbm90IHRha2VuIGludG8gYWNjb3VudC5cbiAqIEBwYXJhbSAge01hcH0gbmV3UnVsZXMgICAgIEEgTWFwIG9mIHRoZSBuZXcgcnVsZXNcbiAqIEBwYXJhbSAge01hcH0gY3VycmVudFJ1bGVzIEEgTWFwIG9mIHRoZSBjdXJyZW50IHJ1bGVzXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICBXaGV0aGVyIG9yIG5vdCB0aGVyZSB3ZXJlIGNoYW5nZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZFJ1bGVzQ2hhbmdlKGN1cnJlbnRSdWxlcywgbmV3UnVsZXMpIHtcbiAgcmV0dXJuICEoY3VycmVudFJ1bGVzLnNpemUgPT09IG5ld1J1bGVzLnNpemUgJiZcbiAgICBBcnJheS5mcm9tKGN1cnJlbnRSdWxlcy5rZXlzKCkpLmV2ZXJ5KHJ1bGVJZCA9PiBuZXdSdWxlcy5oYXMocnVsZUlkKSkpXG59XG4iXX0=