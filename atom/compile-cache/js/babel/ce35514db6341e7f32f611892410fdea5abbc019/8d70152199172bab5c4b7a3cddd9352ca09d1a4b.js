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
    warnIgnored: false,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLWhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWlCLE1BQU07Ozs7c0JBQ1IsU0FBUzs7Ozs2QkFDQyxlQUFlOzs7OzBCQUNqQixhQUFhOzs7OzBCQUNULGFBQWE7OzhCQUNwQixpQkFBaUI7Ozs7QUFQckMsV0FBVyxDQUFBOztBQVNYLElBQU0sS0FBSyxHQUFHO0FBQ1osbUJBQWlCLEVBQUUsa0JBQUssU0FBUyxDQUFDLGtCQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN2RixrQkFBZ0IsRUFBRSxJQUFJO0FBQ3RCLG1CQUFpQixFQUFFLElBQUk7Q0FDeEIsQ0FBQTs7Ozs7Ozs7QUFRRCxJQUFNLFNBQVMsR0FBRyxTQUFaLFNBQVMsQ0FBRyxJQUFJO1NBQUssSUFBSSxHQUFHLDZCQUFXLG9CQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7Q0FBQyxDQUFBOztBQUUvRCxTQUFTLGlCQUFpQixHQUFHO0FBQ2xDLE1BQUksS0FBSyxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtBQUNuQyxRQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sR0FBRyxTQUFTLEdBQUcsS0FBSyxDQUFBO0FBQ25FLFFBQUk7QUFDRixXQUFLLENBQUMsZ0JBQWdCLEdBQ3BCLDJCQUFhLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQUU7QUFDcEQsV0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGtDQUFTLEVBQUUsQ0FBQztPQUN4RSxDQUFDLENBQUMs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QjtBQUNuQyxlQUFXLEVBQUUsS0FBSztBQUNsQixPQUFHLEVBQUUsSUFBSSxLQUFLLEtBQUs7R0FDcEIsQ0FBQTs7QUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLDRCQUFXLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQTtBQUMzRixNQUFJLFVBQVUsRUFBRTtBQUNkLG1CQUFlLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtHQUN4Qzs7QUFFRCxpQkFBZSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBSztBQUMvRCxRQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEMsUUFBSSxDQUFDLGtCQUFLLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QixhQUFPLDRCQUFXLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNyQztBQUNELFdBQU8sUUFBUSxDQUFBO0dBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxJQUFJO1dBQUksSUFBSTtHQUFBLENBQUMsQ0FBQTs7QUFFdkIsTUFBSSxlQUFlLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7O0FBRW5ELG1CQUFlLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7R0FDNUQ7O0FBRUQsU0FBTyxlQUFlLENBQUE7Q0FDdkIiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy93b3JrZXItaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMtcGx1cydcbmltcG9ydCBDaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2VzcydcbmltcG9ydCByZXNvbHZlRW52IGZyb20gJ3Jlc29sdmUtZW52J1xuaW1wb3J0IHsgZmluZENhY2hlZCB9IGZyb20gJ2F0b20tbGludGVyJ1xuaW1wb3J0IGdldFBhdGggZnJvbSAnY29uc2lzdGVudC1wYXRoJ1xuXG5jb25zdCBDYWNoZSA9IHtcbiAgRVNMSU5UX0xPQ0FMX1BBVEg6IFBhdGgubm9ybWFsaXplKFBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdub2RlX21vZHVsZXMnLCAnZXNsaW50JykpLFxuICBOT0RFX1BSRUZJWF9QQVRIOiBudWxsLFxuICBMQVNUX01PRFVMRVNfUEFUSDogbnVsbFxufVxuXG4vKipcbiAqIFRha2VzIGEgcGF0aCBhbmQgdHJhbnNsYXRlcyBgfmAgdG8gdGhlIHVzZXIncyBob21lIGRpcmVjdG9yeSwgYW5kIHJlcGxhY2VzXG4gKiBhbGwgZW52aXJvbm1lbnQgdmFyaWFibGVzIHdpdGggdGhlaXIgdmFsdWUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gcmVtb3ZlIFwic3RyYW5nZW5lc3NcIiBmcm9tXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgVGhlIGNsZWFuZWQgcGF0aFxuICovXG5jb25zdCBjbGVhblBhdGggPSBwYXRoID0+IChwYXRoID8gcmVzb2x2ZUVudihmcy5ub3JtYWxpemUocGF0aCkpIDogJycpXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlUHJlZml4UGF0aCgpIHtcbiAgaWYgKENhY2hlLk5PREVfUFJFRklYX1BBVEggPT09IG51bGwpIHtcbiAgICBjb25zdCBucG1Db21tYW5kID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/ICducG0uY21kJyA6ICducG0nXG4gICAgdHJ5IHtcbiAgICAgIENhY2hlLk5PREVfUFJFRklYX1BBVEggPVxuICAgICAgICBDaGlsZFByb2Nlc3Muc3Bhd25TeW5jKG5wbUNvbW1hbmQsIFsnZ2V0JywgJ3ByZWZpeCddLCB7XG4gICAgICAgICAgZW52OiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHByb2Nlc3MuZW52KSwgeyBQQVRIOiBnZXRQYXRoKCkgfSlcbiAgICAgICAgfSkub3V0cHV0WzFdLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyTXNnID0gJ1VuYWJsZSB0byBleGVjdXRlIGBucG0gZ2V0IHByZWZpeGAuIFBsZWFzZSBtYWtlIHN1cmUgJyArXG4gICAgICAgICdBdG9tIGlzIGdldHRpbmcgJFBBVEggY29ycmVjdGx5LidcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpXG4gICAgfVxuICB9XG4gIHJldHVybiBDYWNoZS5OT0RFX1BSRUZJWF9QQVRIXG59XG5cbmZ1bmN0aW9uIGlzRGlyZWN0b3J5KGRpclBhdGgpIHtcbiAgbGV0IGlzRGlyXG4gIHRyeSB7XG4gICAgaXNEaXIgPSBmcy5zdGF0U3luYyhkaXJQYXRoKS5pc0RpcmVjdG9yeSgpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpc0RpciA9IGZhbHNlXG4gIH1cbiAgcmV0dXJuIGlzRGlyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgbGV0IGVzbGludERpciA9IG51bGxcbiAgbGV0IGxvY2F0aW9uVHlwZSA9IG51bGxcbiAgaWYgKGNvbmZpZy51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICBsb2NhdGlvblR5cGUgPSAnZ2xvYmFsJ1xuICAgIGNvbnN0IGNvbmZpZ0dsb2JhbCA9IGNsZWFuUGF0aChjb25maWcuZ2xvYmFsTm9kZVBhdGgpXG4gICAgY29uc3QgcHJlZml4UGF0aCA9IGNvbmZpZ0dsb2JhbCB8fCBnZXROb2RlUHJlZml4UGF0aCgpXG4gICAgLy8gTlBNIG9uIFdpbmRvd3MgYW5kIFlhcm4gb24gYWxsIHBsYXRmb3Jtc1xuICAgIGVzbGludERpciA9IFBhdGguam9pbihwcmVmaXhQYXRoLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgaWYgKCFpc0RpcmVjdG9yeShlc2xpbnREaXIpKSB7XG4gICAgICAvLyBOUE0gb24gcGxhdGZvcm1zIG90aGVyIHRoYW4gV2luZG93c1xuICAgICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByZWZpeFBhdGgsICdsaWInLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgfVxuICB9IGVsc2UgaWYgKCFjb25maWcuYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2xvY2FsIHByb2plY3QnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKG1vZHVsZXNEaXIgfHwgJycsICdlc2xpbnQnKVxuICB9IGVsc2UgaWYgKFBhdGguaXNBYnNvbHV0ZShjbGVhblBhdGgoY29uZmlnLmFkdmFuY2VkTG9jYWxOb2RlTW9kdWxlcykpKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2FkdmFuY2VkIHNwZWNpZmllZCdcbiAgICBlc2xpbnREaXIgPSBQYXRoLmpvaW4oY2xlYW5QYXRoKGNvbmZpZy5hZHZhbmNlZExvY2FsTm9kZU1vZHVsZXMpLCAnZXNsaW50JylcbiAgfSBlbHNlIHtcbiAgICBsb2NhdGlvblR5cGUgPSAnYWR2YW5jZWQgc3BlY2lmaWVkJ1xuICAgIGVzbGludERpciA9IFBhdGguam9pbihwcm9qZWN0UGF0aCB8fCAnJywgY2xlYW5QYXRoKGNvbmZpZy5hZHZhbmNlZExvY2FsTm9kZU1vZHVsZXMpLCAnZXNsaW50JylcbiAgfVxuICBpZiAoaXNEaXJlY3RvcnkoZXNsaW50RGlyKSkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBlc2xpbnREaXIsXG4gICAgICB0eXBlOiBsb2NhdGlvblR5cGUsXG4gICAgfVxuICB9IGVsc2UgaWYgKGNvbmZpZy51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHBsZWFzZSBlbnN1cmUgdGhlIGdsb2JhbCBOb2RlIHBhdGggaXMgc2V0IGNvcnJlY3RseS4nKVxuICB9XG4gIHJldHVybiB7XG4gICAgcGF0aDogQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgsXG4gICAgdHlwZTogJ2J1bmRsZWQgZmFsbGJhY2snLFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFU0xpbnRGcm9tRGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgeyBwYXRoOiBFU0xpbnREaXJlY3RvcnkgfSA9IGZpbmRFU0xpbnREaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnLCBwcm9qZWN0UGF0aClcbiAgdHJ5IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgIHJldHVybiByZXF1aXJlKEVTTGludERpcmVjdG9yeSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChjb25maWcudXNlR2xvYmFsRXNsaW50ICYmIGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHRyeSByZXN0YXJ0aW5nIEF0b20gdG8gY2xlYXIgY2FjaGVzLicpXG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgcmV0dXJuIHJlcXVpcmUoQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKSB7XG4gIGlmIChDYWNoZS5MQVNUX01PRFVMRVNfUEFUSCAhPT0gbW9kdWxlc0Rpcikge1xuICAgIENhY2hlLkxBU1RfTU9EVUxFU19QQVRIID0gbW9kdWxlc0RpclxuICAgIHByb2Nlc3MuZW52Lk5PREVfUEFUSCA9IG1vZHVsZXNEaXIgfHwgJydcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5Nb2R1bGUuX2luaXRQYXRocygpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKVxuICByZXR1cm4gZ2V0RVNMaW50RnJvbURpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPVxuICAgIGZpbmRDYWNoZWQoZmlsZURpciwgW1xuICAgICAgJy5lc2xpbnRyYy5qcycsICcuZXNsaW50cmMueWFtbCcsICcuZXNsaW50cmMueW1sJywgJy5lc2xpbnRyYy5qc29uJywgJy5lc2xpbnRyYycsICdwYWNrYWdlLmpzb24nXG4gICAgXSlcbiAgaWYgKGNvbmZpZ0ZpbGUpIHtcbiAgICBpZiAoUGF0aC5iYXNlbmFtZShjb25maWdGaWxlKSA9PT0gJ3BhY2thZ2UuanNvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgICBpZiAocmVxdWlyZShjb25maWdGaWxlKS5lc2xpbnRDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ0ZpbGVcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBmb3VuZCBhIHBhY2thZ2UuanNvbiB3aXRob3V0IGFuIGVzbGludCBjb25maWdcbiAgICAgIC8vIGluIGEgZGlyIHdpdGhvdXQgYW55IG90aGVyIGVzbGludCBjb25maWcgZmlsZXNcbiAgICAgIC8vIChiZWNhdXNlICdwYWNrYWdlLmpzb24nIGlzIGxhc3QgaW4gdGhlIGNhbGwgdG8gZmluZENhY2hlZClcbiAgICAgIC8vIFNvLCBrZWVwIGxvb2tpbmcgZnJvbSB0aGUgcGFyZW50IGRpcmVjdG9yeVxuICAgICAgcmV0dXJuIGdldENvbmZpZ1BhdGgoUGF0aC5yZXNvbHZlKFBhdGguZGlybmFtZShjb25maWdGaWxlKSwgJy4uJykpXG4gICAgfVxuICAgIHJldHVybiBjb25maWdGaWxlXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbGF0aXZlUGF0aChmaWxlRGlyLCBmaWxlUGF0aCwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG5cbiAgLy8gSWYgd2UgY2FuIGZpbmQgYW4gLmVzbGludGlnbm9yZSBmaWxlLCB3ZSBjYW4gc2V0IGN3ZCB0aGVyZVxuICAvLyAoYmVjYXVzZSB0aGV5IGFyZSBleHBlY3RlZCB0byBiZSBhdCB0aGUgcHJvamVjdCByb290KVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNvbnN0IGlnbm9yZURpciA9IFBhdGguZGlybmFtZShpZ25vcmVGaWxlKVxuICAgIHByb2Nlc3MuY2hkaXIoaWdub3JlRGlyKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKGlnbm9yZURpciwgZmlsZVBhdGgpXG4gIH1cbiAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBzZXQgdGhlIGN3ZCB0byB0aGUgYXRvbSBwcm9qZWN0IHJvb3QgYXMgbG9uZyBhcyB0aGF0IGV4aXN0c1xuICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICBwcm9jZXNzLmNoZGlyKHByb2plY3RQYXRoKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKHByb2plY3RQYXRoLCBmaWxlUGF0aClcbiAgfVxuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIHRoZSBmaWxlIGxvY2F0aW9uIGl0c2VsZlxuICBwcm9jZXNzLmNoZGlyKGZpbGVEaXIpXG4gIHJldHVybiBQYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q0xJRW5naW5lT3B0aW9ucyh0eXBlLCBjb25maWcsIHJ1bGVzLCBmaWxlUGF0aCwgZmlsZURpciwgZ2l2ZW5Db25maWdQYXRoKSB7XG4gIGNvbnN0IGNsaUVuZ2luZUNvbmZpZyA9IHtcbiAgICBydWxlcyxcbiAgICBpZ25vcmU6ICFjb25maWcuZGlzYWJsZUVzbGludElnbm9yZSxcbiAgICB3YXJuSWdub3JlZDogZmFsc2UsXG4gICAgZml4OiB0eXBlID09PSAnZml4J1xuICB9XG5cbiAgY29uc3QgaWdub3JlRmlsZSA9IGNvbmZpZy5kaXNhYmxlRXNsaW50SWdub3JlID8gbnVsbCA6IGZpbmRDYWNoZWQoZmlsZURpciwgJy5lc2xpbnRpZ25vcmUnKVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNsaUVuZ2luZUNvbmZpZy5pZ25vcmVQYXRoID0gaWdub3JlRmlsZVxuICB9XG5cbiAgY2xpRW5naW5lQ29uZmlnLnJ1bGVQYXRocyA9IGNvbmZpZy5lc2xpbnRSdWxlc0RpcnMubWFwKChwYXRoKSA9PiB7XG4gICAgY29uc3QgcnVsZXNEaXIgPSBjbGVhblBhdGgocGF0aClcbiAgICBpZiAoIVBhdGguaXNBYnNvbHV0ZShydWxlc0RpcikpIHtcbiAgICAgIHJldHVybiBmaW5kQ2FjaGVkKGZpbGVEaXIsIHJ1bGVzRGlyKVxuICAgIH1cbiAgICByZXR1cm4gcnVsZXNEaXJcbiAgfSkuZmlsdGVyKHBhdGggPT4gcGF0aClcblxuICBpZiAoZ2l2ZW5Db25maWdQYXRoID09PSBudWxsICYmIGNvbmZpZy5lc2xpbnRyY1BhdGgpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCBhIGNvbmZpZ3VyYXRpb24gdXNlIHRoZSBmYWxsYmFjayBmcm9tIHRoZSBzZXR0aW5nc1xuICAgIGNsaUVuZ2luZUNvbmZpZy5jb25maWdGaWxlID0gY2xlYW5QYXRoKGNvbmZpZy5lc2xpbnRyY1BhdGgpXG4gIH1cblxuICByZXR1cm4gY2xpRW5naW5lQ29uZmlnXG59XG4iXX0=