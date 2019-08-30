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
  if (config.global.useGlobalEslint) {
    locationType = 'global';
    var configGlobal = cleanPath(config.global.globalNodePath);
    var prefixPath = configGlobal || getNodePrefixPath();
    // NPM on Windows and Yarn on all platforms
    eslintDir = _path2['default'].join(prefixPath, 'node_modules', 'eslint');
    if (!isDirectory(eslintDir)) {
      // NPM on platforms other than Windows
      eslintDir = _path2['default'].join(prefixPath, 'lib', 'node_modules', 'eslint');
    }
  } else if (!config.advanced.localNodeModules) {
    locationType = 'local project';
    eslintDir = _path2['default'].join(modulesDir || '', 'eslint');
  } else if (_path2['default'].isAbsolute(cleanPath(config.advanced.localNodeModules))) {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(cleanPath(config.advanced.localNodeModules), 'eslint');
  } else {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(projectPath || '', cleanPath(config.advanced.localNodeModules), 'eslint');
  }

  if (isDirectory(eslintDir)) {
    return {
      path: eslintDir,
      type: locationType
    };
  }

  if (config.global.useGlobalEslint) {
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
    if (config.global.useGlobalEslint && e.code === 'MODULE_NOT_FOUND') {
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
  var ignoreFile = config.advanced.disableEslintIgnore ? null : (0, _atomLinter.findCached)(fileDir, '.eslintignore');

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
    ignore: !config.advanced.disableEslintIgnore,
    fix: type === 'fix'
  };

  var ignoreFile = config.advanced.disableEslintIgnore ? null : (0, _atomLinter.findCached)(fileDir, '.eslintignore');
  if (ignoreFile) {
    cliEngineConfig.ignorePath = ignoreFile;
  }

  cliEngineConfig.rulePaths = config.advanced.eslintRulesDirs.map(function (path) {
    var rulesDir = cleanPath(path);
    if (!_path2['default'].isAbsolute(rulesDir)) {
      return (0, _atomLinter.findCached)(fileDir, rulesDir);
    }
    return rulesDir;
  }).filter(function (path) {
    return path;
  });

  if (givenConfigPath === null && config.global.eslintrcPath) {
    // If we didn't find a configuration use the fallback from the settings
    cliEngineConfig.configFile = cleanPath(config.global.eslintrcPath);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLWhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztvQkFFaUIsTUFBTTs7OztzQkFDUixTQUFTOzs7OzZCQUNDLGVBQWU7Ozs7MEJBQ2pCLGFBQWE7Ozs7MEJBQ1QsYUFBYTs7OEJBQ3BCLGlCQUFpQjs7OztBQVByQyxXQUFXLENBQUE7O0FBU1gsSUFBTSxLQUFLLEdBQUc7QUFDWixtQkFBaUIsRUFBRSxrQkFBSyxTQUFTLENBQUMsa0JBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZGLGtCQUFnQixFQUFFLElBQUk7QUFDdEIsbUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFBOzs7Ozs7OztBQVFELElBQU0sU0FBUyxHQUFHLFNBQVosU0FBUyxDQUFHLElBQUk7U0FBSyxJQUFJLEdBQUcsNkJBQVcsb0JBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRTtDQUFDLENBQUE7O0FBRS9ELFNBQVMsaUJBQWlCLEdBQUc7QUFDbEMsTUFBSSxLQUFLLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxFQUFFO0FBQ25DLFFBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUE7QUFDbkUsUUFBSTtBQUNGLFdBQUssQ0FBQyxnQkFBZ0IsR0FBRywyQkFBYSxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFO0FBQzdFLFdBQUcsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxrQ0FBUyxFQUFFLENBQUM7T0FDeEUsQ0FBQyxDQUFD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QUFPLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtHQUM1Qjs7Ozs7QUFLRCxNQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUU7QUFDN0QsV0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO0dBQ25DOzs7QUFHRCxTQUFPLElBQUksR0FBRyxFQUFFLENBQUE7Q0FDakI7Ozs7Ozs7Ozs7OztBQVdNLFNBQVMsY0FBYyxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUU7QUFDckQsU0FBTyxFQUFFLFlBQVksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksSUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxNQUFNO1dBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7R0FBQSxDQUFDLENBQUEsQUFBQyxDQUFBO0NBQzVFIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLWhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzLXBsdXMnXG5pbXBvcnQgQ2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgcmVzb2x2ZUVudiBmcm9tICdyZXNvbHZlLWVudidcbmltcG9ydCB7IGZpbmRDYWNoZWQgfSBmcm9tICdhdG9tLWxpbnRlcidcbmltcG9ydCBnZXRQYXRoIGZyb20gJ2NvbnNpc3RlbnQtcGF0aCdcblxuY29uc3QgQ2FjaGUgPSB7XG4gIEVTTElOVF9MT0NBTF9QQVRIOiBQYXRoLm5vcm1hbGl6ZShQYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpKSxcbiAgTk9ERV9QUkVGSVhfUEFUSDogbnVsbCxcbiAgTEFTVF9NT0RVTEVTX1BBVEg6IG51bGxcbn1cblxuLyoqXG4gKiBUYWtlcyBhIHBhdGggYW5kIHRyYW5zbGF0ZXMgYH5gIHRvIHRoZSB1c2VyJ3MgaG9tZSBkaXJlY3RvcnksIGFuZCByZXBsYWNlc1xuICogYWxsIGVudmlyb25tZW50IHZhcmlhYmxlcyB3aXRoIHRoZWlyIHZhbHVlLlxuICogQHBhcmFtICB7c3RyaW5nfSBwYXRoIFRoZSBwYXRoIHRvIHJlbW92ZSBcInN0cmFuZ2VuZXNzXCIgZnJvbVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgIFRoZSBjbGVhbmVkIHBhdGhcbiAqL1xuY29uc3QgY2xlYW5QYXRoID0gcGF0aCA9PiAocGF0aCA/IHJlc29sdmVFbnYoZnMubm9ybWFsaXplKHBhdGgpKSA6ICcnKVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZVByZWZpeFBhdGgoKSB7XG4gIGlmIChDYWNoZS5OT0RFX1BSRUZJWF9QQVRIID09PSBudWxsKSB7XG4gICAgY29uc3QgbnBtQ29tbWFuZCA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyAnbnBtLmNtZCcgOiAnbnBtJ1xuICAgIHRyeSB7XG4gICAgICBDYWNoZS5OT0RFX1BSRUZJWF9QQVRIID0gQ2hpbGRQcm9jZXNzLnNwYXduU3luYyhucG1Db21tYW5kLCBbJ2dldCcsICdwcmVmaXgnXSwge1xuICAgICAgICBlbnY6IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgcHJvY2Vzcy5lbnYpLCB7IFBBVEg6IGdldFBhdGgoKSB9KVxuICAgICAgfSkub3V0cHV0WzFdLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyTXNnID0gJ1VuYWJsZSB0byBleGVjdXRlIGBucG0gZ2V0IHByZWZpeGAuIFBsZWFzZSBtYWtlIHN1cmUgJ1xuICAgICAgICArICdBdG9tIGlzIGdldHRpbmcgJFBBVEggY29ycmVjdGx5LidcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpXG4gICAgfVxuICB9XG4gIHJldHVybiBDYWNoZS5OT0RFX1BSRUZJWF9QQVRIXG59XG5cbmZ1bmN0aW9uIGlzRGlyZWN0b3J5KGRpclBhdGgpIHtcbiAgbGV0IGlzRGlyXG4gIHRyeSB7XG4gICAgaXNEaXIgPSBmcy5zdGF0U3luYyhkaXJQYXRoKS5pc0RpcmVjdG9yeSgpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpc0RpciA9IGZhbHNlXG4gIH1cbiAgcmV0dXJuIGlzRGlyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgbGV0IGVzbGludERpciA9IG51bGxcbiAgbGV0IGxvY2F0aW9uVHlwZSA9IG51bGxcbiAgaWYgKGNvbmZpZy5nbG9iYWwudXNlR2xvYmFsRXNsaW50KSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2dsb2JhbCdcbiAgICBjb25zdCBjb25maWdHbG9iYWwgPSBjbGVhblBhdGgoY29uZmlnLmdsb2JhbC5nbG9iYWxOb2RlUGF0aClcbiAgICBjb25zdCBwcmVmaXhQYXRoID0gY29uZmlnR2xvYmFsIHx8IGdldE5vZGVQcmVmaXhQYXRoKClcbiAgICAvLyBOUE0gb24gV2luZG93cyBhbmQgWWFybiBvbiBhbGwgcGxhdGZvcm1zXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByZWZpeFBhdGgsICdub2RlX21vZHVsZXMnLCAnZXNsaW50JylcbiAgICBpZiAoIWlzRGlyZWN0b3J5KGVzbGludERpcikpIHtcbiAgICAgIC8vIE5QTSBvbiBwbGF0Zm9ybXMgb3RoZXIgdGhhbiBXaW5kb3dzXG4gICAgICBlc2xpbnREaXIgPSBQYXRoLmpvaW4ocHJlZml4UGF0aCwgJ2xpYicsICdub2RlX21vZHVsZXMnLCAnZXNsaW50JylcbiAgICB9XG4gIH0gZWxzZSBpZiAoIWNvbmZpZy5hZHZhbmNlZC5sb2NhbE5vZGVNb2R1bGVzKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2xvY2FsIHByb2plY3QnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKG1vZHVsZXNEaXIgfHwgJycsICdlc2xpbnQnKVxuICB9IGVsc2UgaWYgKFBhdGguaXNBYnNvbHV0ZShjbGVhblBhdGgoY29uZmlnLmFkdmFuY2VkLmxvY2FsTm9kZU1vZHVsZXMpKSkge1xuICAgIGxvY2F0aW9uVHlwZSA9ICdhZHZhbmNlZCBzcGVjaWZpZWQnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKGNsZWFuUGF0aChjb25maWcuYWR2YW5jZWQubG9jYWxOb2RlTW9kdWxlcyksICdlc2xpbnQnKVxuICB9IGVsc2Uge1xuICAgIGxvY2F0aW9uVHlwZSA9ICdhZHZhbmNlZCBzcGVjaWZpZWQnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByb2plY3RQYXRoIHx8ICcnLCBjbGVhblBhdGgoY29uZmlnLmFkdmFuY2VkLmxvY2FsTm9kZU1vZHVsZXMpLCAnZXNsaW50JylcbiAgfVxuXG4gIGlmIChpc0RpcmVjdG9yeShlc2xpbnREaXIpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IGVzbGludERpcixcbiAgICAgIHR5cGU6IGxvY2F0aW9uVHlwZSxcbiAgICB9XG4gIH1cblxuICBpZiAoY29uZmlnLmdsb2JhbC51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHBsZWFzZSBlbnN1cmUgdGhlIGdsb2JhbCBOb2RlIHBhdGggaXMgc2V0IGNvcnJlY3RseS4nKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBDYWNoZS5FU0xJTlRfTE9DQUxfUEFUSCxcbiAgICB0eXBlOiAnYnVuZGxlZCBmYWxsYmFjaycsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVTTGludEZyb21EaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBjb25zdCB7IHBhdGg6IEVTTGludERpcmVjdG9yeSB9ID0gZmluZEVTTGludERpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxuICB0cnkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgcmV0dXJuIHJlcXVpcmUoRVNMaW50RGlyZWN0b3J5KVxuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGNvbmZpZy5nbG9iYWwudXNlR2xvYmFsRXNsaW50ICYmIGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHRyeSByZXN0YXJ0aW5nIEF0b20gdG8gY2xlYXIgY2FjaGVzLicpXG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgcmV0dXJuIHJlcXVpcmUoQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKSB7XG4gIGlmIChDYWNoZS5MQVNUX01PRFVMRVNfUEFUSCAhPT0gbW9kdWxlc0Rpcikge1xuICAgIENhY2hlLkxBU1RfTU9EVUxFU19QQVRIID0gbW9kdWxlc0RpclxuICAgIHByb2Nlc3MuZW52Lk5PREVfUEFUSCA9IG1vZHVsZXNEaXIgfHwgJydcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5Nb2R1bGUuX2luaXRQYXRocygpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKVxuICByZXR1cm4gZ2V0RVNMaW50RnJvbURpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPSBmaW5kQ2FjaGVkKGZpbGVEaXIsIFtcbiAgICAnLmVzbGludHJjLmpzJywgJy5lc2xpbnRyYy55YW1sJywgJy5lc2xpbnRyYy55bWwnLCAnLmVzbGludHJjLmpzb24nLCAnLmVzbGludHJjJywgJ3BhY2thZ2UuanNvbidcbiAgXSlcbiAgaWYgKGNvbmZpZ0ZpbGUpIHtcbiAgICBpZiAoUGF0aC5iYXNlbmFtZShjb25maWdGaWxlKSA9PT0gJ3BhY2thZ2UuanNvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgICBpZiAocmVxdWlyZShjb25maWdGaWxlKS5lc2xpbnRDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ0ZpbGVcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBmb3VuZCBhIHBhY2thZ2UuanNvbiB3aXRob3V0IGFuIGVzbGludCBjb25maWdcbiAgICAgIC8vIGluIGEgZGlyIHdpdGhvdXQgYW55IG90aGVyIGVzbGludCBjb25maWcgZmlsZXNcbiAgICAgIC8vIChiZWNhdXNlICdwYWNrYWdlLmpzb24nIGlzIGxhc3QgaW4gdGhlIGNhbGwgdG8gZmluZENhY2hlZClcbiAgICAgIC8vIFNvLCBrZWVwIGxvb2tpbmcgZnJvbSB0aGUgcGFyZW50IGRpcmVjdG9yeVxuICAgICAgcmV0dXJuIGdldENvbmZpZ1BhdGgoUGF0aC5yZXNvbHZlKFBhdGguZGlybmFtZShjb25maWdGaWxlKSwgJy4uJykpXG4gICAgfVxuICAgIHJldHVybiBjb25maWdGaWxlXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbGF0aXZlUGF0aChmaWxlRGlyLCBmaWxlUGF0aCwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmFkdmFuY2VkLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG5cbiAgLy8gSWYgd2UgY2FuIGZpbmQgYW4gLmVzbGludGlnbm9yZSBmaWxlLCB3ZSBjYW4gc2V0IGN3ZCB0aGVyZVxuICAvLyAoYmVjYXVzZSB0aGV5IGFyZSBleHBlY3RlZCB0byBiZSBhdCB0aGUgcHJvamVjdCByb290KVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNvbnN0IGlnbm9yZURpciA9IFBhdGguZGlybmFtZShpZ25vcmVGaWxlKVxuICAgIHByb2Nlc3MuY2hkaXIoaWdub3JlRGlyKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKGlnbm9yZURpciwgZmlsZVBhdGgpXG4gIH1cbiAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBzZXQgdGhlIGN3ZCB0byB0aGUgYXRvbSBwcm9qZWN0IHJvb3QgYXMgbG9uZyBhcyB0aGF0IGV4aXN0c1xuICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICBwcm9jZXNzLmNoZGlyKHByb2plY3RQYXRoKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKHByb2plY3RQYXRoLCBmaWxlUGF0aClcbiAgfVxuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIHRoZSBmaWxlIGxvY2F0aW9uIGl0c2VsZlxuICBwcm9jZXNzLmNoZGlyKGZpbGVEaXIpXG4gIHJldHVybiBQYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q0xJRW5naW5lT3B0aW9ucyh0eXBlLCBjb25maWcsIHJ1bGVzLCBmaWxlUGF0aCwgZmlsZURpciwgZ2l2ZW5Db25maWdQYXRoKSB7XG4gIGNvbnN0IGNsaUVuZ2luZUNvbmZpZyA9IHtcbiAgICBydWxlcyxcbiAgICBpZ25vcmU6ICFjb25maWcuYWR2YW5jZWQuZGlzYWJsZUVzbGludElnbm9yZSxcbiAgICBmaXg6IHR5cGUgPT09ICdmaXgnXG4gIH1cblxuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmFkdmFuY2VkLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG4gIGlmIChpZ25vcmVGaWxlKSB7XG4gICAgY2xpRW5naW5lQ29uZmlnLmlnbm9yZVBhdGggPSBpZ25vcmVGaWxlXG4gIH1cblxuICBjbGlFbmdpbmVDb25maWcucnVsZVBhdGhzID0gY29uZmlnLmFkdmFuY2VkLmVzbGludFJ1bGVzRGlycy5tYXAoKHBhdGgpID0+IHtcbiAgICBjb25zdCBydWxlc0RpciA9IGNsZWFuUGF0aChwYXRoKVxuICAgIGlmICghUGF0aC5pc0Fic29sdXRlKHJ1bGVzRGlyKSkge1xuICAgICAgcmV0dXJuIGZpbmRDYWNoZWQoZmlsZURpciwgcnVsZXNEaXIpXG4gICAgfVxuICAgIHJldHVybiBydWxlc0RpclxuICB9KS5maWx0ZXIocGF0aCA9PiBwYXRoKVxuXG4gIGlmIChnaXZlbkNvbmZpZ1BhdGggPT09IG51bGwgJiYgY29uZmlnLmdsb2JhbC5lc2xpbnRyY1BhdGgpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCBhIGNvbmZpZ3VyYXRpb24gdXNlIHRoZSBmYWxsYmFjayBmcm9tIHRoZSBzZXR0aW5nc1xuICAgIGNsaUVuZ2luZUNvbmZpZy5jb25maWdGaWxlID0gY2xlYW5QYXRoKGNvbmZpZy5nbG9iYWwuZXNsaW50cmNQYXRoKVxuICB9XG5cbiAgcmV0dXJuIGNsaUVuZ2luZUNvbmZpZ1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGxpc3Qgb2YgcnVsZXMgdXNlZCBmb3IgYSBsaW50IGpvYlxuICogQHBhcmFtICB7T2JqZWN0fSBjbGlFbmdpbmUgVGhlIENMSUVuZ2luZSBpbnN0YW5jZSB1c2VkIGZvciB0aGUgbGludCBqb2JcbiAqIEByZXR1cm4ge01hcH0gICAgICAgICAgICAgIEEgTWFwIG9mIHRoZSBydWxlcyB1c2VkLCBydWxlIG5hbWVzIGFzIGtleXMsIHJ1bGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgYXMgdGhlIGNvbnRlbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnVsZXMoY2xpRW5naW5lKSB7XG4gIC8vIFB1bGwgdGhlIGxpc3Qgb2YgcnVsZXMgdXNlZCBkaXJlY3RseSBmcm9tIHRoZSBDTElFbmdpbmVcbiAgLy8gQWRkZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL2VzbGludC9lc2xpbnQvcHVsbC85NzgyXG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY2xpRW5naW5lLCAnZ2V0UnVsZXMnKSkge1xuICAgIHJldHVybiBjbGlFbmdpbmUuZ2V0UnVsZXMoKVxuICB9XG5cbiAgLy8gQXR0ZW1wdCB0byB1c2UgdGhlIGludGVybmFsICh1bmRvY3VtZW50ZWQpIGBsaW50ZXJgIGluc3RhbmNlIGF0dGFjaGVkIHRvXG4gIC8vIHRoZSBDTElFbmdpbmUgdG8gZ2V0IHRoZSBsb2FkZWQgcnVsZXMgKGluY2x1ZGluZyBwbHVnaW4gcnVsZXMpLlxuICAvLyBBZGRlZCBpbiBFU0xpbnQgdjRcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChjbGlFbmdpbmUsICdsaW50ZXInKSkge1xuICAgIHJldHVybiBjbGlFbmdpbmUubGludGVyLmdldFJ1bGVzKClcbiAgfVxuXG4gIC8vIE9sZGVyIHZlcnNpb25zIG9mIEVTTGludCBkb24ndCAoZWFzaWx5KSBzdXBwb3J0IGdldHRpbmcgYSBsaXN0IG9mIHJ1bGVzXG4gIHJldHVybiBuZXcgTWFwKClcbn1cblxuLyoqXG4gKiBHaXZlbiBhbiBleGl0aW5nIHJ1bGUgbGlzdCBhbmQgYSBuZXcgcnVsZSBsaXN0LCBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlcmVcbiAqIGhhdmUgYmVlbiBjaGFuZ2VzLlxuICogTk9URTogVGhpcyBvbmx5IGFjY291bnRzIGZvciBwcmVzZW5jZSBvZiB0aGUgcnVsZXMsIGNoYW5nZXMgdG8gdGhlaXIgbWV0YWRhdGFcbiAqIGFyZSBub3QgdGFrZW4gaW50byBhY2NvdW50LlxuICogQHBhcmFtICB7TWFwfSBuZXdSdWxlcyAgICAgQSBNYXAgb2YgdGhlIG5ldyBydWxlc1xuICogQHBhcmFtICB7TWFwfSBjdXJyZW50UnVsZXMgQSBNYXAgb2YgdGhlIGN1cnJlbnQgcnVsZXNcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZXJlIHdlcmUgY2hhbmdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlkUnVsZXNDaGFuZ2UoY3VycmVudFJ1bGVzLCBuZXdSdWxlcykge1xuICByZXR1cm4gIShjdXJyZW50UnVsZXMuc2l6ZSA9PT0gbmV3UnVsZXMuc2l6ZVxuICAgICYmIEFycmF5LmZyb20oY3VycmVudFJ1bGVzLmtleXMoKSkuZXZlcnkocnVsZUlkID0+IG5ld1J1bGVzLmhhcyhydWxlSWQpKSlcbn1cbiJdfQ==