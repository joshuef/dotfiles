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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

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
    isDir = _fs2['default'].statSync(dirPath).isDirectory();
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
    var prefixPath = config.globalNodePath || getNodePrefixPath();
    // NPM on Windows and Yarn on all platforms
    eslintDir = _path2['default'].join(prefixPath, 'node_modules', 'eslint');
    if (!isDirectory(eslintDir)) {
      // NPM on platforms other than Windows
      eslintDir = _path2['default'].join(prefixPath, 'lib', 'node_modules', 'eslint');
    }
  } else if (!config.advancedLocalNodeModules) {
    locationType = 'local project';
    eslintDir = _path2['default'].join(modulesDir || '', 'eslint');
  } else if (_path2['default'].isAbsolute(config.advancedLocalNodeModules)) {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(config.advancedLocalNodeModules || '', 'eslint');
  } else {
    locationType = 'advanced specified';
    eslintDir = _path2['default'].join(projectPath || '', config.advancedLocalNodeModules, 'eslint');
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

  if (config.eslintRulesDir) {
    var rulesDir = (0, _resolveEnv2['default'])(config.eslintRulesDir);
    if (!_path2['default'].isAbsolute(rulesDir)) {
      rulesDir = (0, _atomLinter.findCached)(fileDir, rulesDir);
    }
    if (rulesDir) {
      cliEngineConfig.rulePaths = [rulesDir];
    }
  }

  if (givenConfigPath === null && config.eslintrcPath) {
    // If we didn't find a configuration use the fallback from the settings
    cliEngineConfig.configFile = (0, _resolveEnv2['default'])(config.eslintrcPath);
  }

  return cliEngineConfig;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLWVzbGludC9zcmMvd29ya2VyLWhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWlCLE1BQU07Ozs7a0JBQ1IsSUFBSTs7Ozs2QkFDTSxlQUFlOzs7OzBCQUNqQixhQUFhOzs7OzBCQUNULGFBQWE7OzhCQUNwQixpQkFBaUI7Ozs7QUFQckMsV0FBVyxDQUFBOztBQVNYLElBQU0sS0FBSyxHQUFHO0FBQ1osbUJBQWlCLEVBQUUsa0JBQUssU0FBUyxDQUFDLGtCQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN2RixrQkFBZ0IsRUFBRSxJQUFJO0FBQ3RCLG1CQUFpQixFQUFFLElBQUk7Q0FDeEIsQ0FBQTs7QUFFTSxTQUFTLGlCQUFpQixHQUFHO0FBQ2xDLE1BQUksS0FBSyxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtBQUNuQyxRQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sR0FBRyxTQUFTLEdBQUcsS0FBSyxDQUFBO0FBQ25FLFFBQUk7QUFDRixXQUFLLENBQUMsZ0JBQWdCLEdBQ3BCLDJCQUFhLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQUU7QUFDcEQsV0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGtDQUFTLEVBQUUsQ0FBQztPQUN4RSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBO0tBQ2pDLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixVQUFNLE1BQU0sR0FBRyx1REFBdUQsR0FDcEUsa0NBQWtD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Q0FBQTtHQUN4Qzs7QUFFRCxNQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUU7QUFDekIsUUFBSSxRQUFRLEdBQUcsNkJBQVcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQ2hELFFBQUksQ0FBQyxrQkFBSyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDOUIsY0FBUSxHQUFHLDRCQUFXLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUN6QztBQUNELFFBQUksUUFBUSxFQUFFO0FBQ1oscUJBQWUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtLQUN2QztHQUNGOztBQUVELE1BQUksZUFBZSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFOztBQUVuRCxtQkFBZSxDQUFDLFVBQVUsR0FBRyw2QkFBVyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7R0FDN0Q7O0FBRUQsU0FBTyxlQUFlLENBQUE7Q0FDdkIiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy93b3JrZXItaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgQ2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgcmVzb2x2ZUVudiBmcm9tICdyZXNvbHZlLWVudidcbmltcG9ydCB7IGZpbmRDYWNoZWQgfSBmcm9tICdhdG9tLWxpbnRlcidcbmltcG9ydCBnZXRQYXRoIGZyb20gJ2NvbnNpc3RlbnQtcGF0aCdcblxuY29uc3QgQ2FjaGUgPSB7XG4gIEVTTElOVF9MT0NBTF9QQVRIOiBQYXRoLm5vcm1hbGl6ZShQYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpKSxcbiAgTk9ERV9QUkVGSVhfUEFUSDogbnVsbCxcbiAgTEFTVF9NT0RVTEVTX1BBVEg6IG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVQcmVmaXhQYXRoKCkge1xuICBpZiAoQ2FjaGUuTk9ERV9QUkVGSVhfUEFUSCA9PT0gbnVsbCkge1xuICAgIGNvbnN0IG5wbUNvbW1hbmQgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID8gJ25wbS5jbWQnIDogJ25wbSdcbiAgICB0cnkge1xuICAgICAgQ2FjaGUuTk9ERV9QUkVGSVhfUEFUSCA9XG4gICAgICAgIENoaWxkUHJvY2Vzcy5zcGF3blN5bmMobnBtQ29tbWFuZCwgWydnZXQnLCAncHJlZml4J10sIHtcbiAgICAgICAgICBlbnY6IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgcHJvY2Vzcy5lbnYpLCB7IFBBVEg6IGdldFBhdGgoKSB9KVxuICAgICAgICB9KS5vdXRwdXRbMV0udG9TdHJpbmcoKS50cmltKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCBlcnJNc2cgPSAnVW5hYmxlIHRvIGV4ZWN1dGUgYG5wbSBnZXQgcHJlZml4YC4gUGxlYXNlIG1ha2Ugc3VyZSAnICtcbiAgICAgICAgJ0F0b20gaXMgZ2V0dGluZyAkUEFUSCBjb3JyZWN0bHkuJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZylcbiAgICB9XG4gIH1cbiAgcmV0dXJuIENhY2hlLk5PREVfUFJFRklYX1BBVEhcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RvcnkoZGlyUGF0aCkge1xuICBsZXQgaXNEaXJcbiAgdHJ5IHtcbiAgICBpc0RpciA9IGZzLnN0YXRTeW5jKGRpclBhdGgpLmlzRGlyZWN0b3J5KClcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlzRGlyID0gZmFsc2VcbiAgfVxuICByZXR1cm4gaXNEaXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRFU0xpbnREaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBsZXQgZXNsaW50RGlyID0gbnVsbFxuICBsZXQgbG9jYXRpb25UeXBlID0gbnVsbFxuICBpZiAoY29uZmlnLnVzZUdsb2JhbEVzbGludCkge1xuICAgIGxvY2F0aW9uVHlwZSA9ICdnbG9iYWwnXG4gICAgY29uc3QgcHJlZml4UGF0aCA9IGNvbmZpZy5nbG9iYWxOb2RlUGF0aCB8fCBnZXROb2RlUHJlZml4UGF0aCgpXG4gICAgLy8gTlBNIG9uIFdpbmRvd3MgYW5kIFlhcm4gb24gYWxsIHBsYXRmb3Jtc1xuICAgIGVzbGludERpciA9IFBhdGguam9pbihwcmVmaXhQYXRoLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgaWYgKCFpc0RpcmVjdG9yeShlc2xpbnREaXIpKSB7XG4gICAgICAvLyBOUE0gb24gcGxhdGZvcm1zIG90aGVyIHRoYW4gV2luZG93c1xuICAgICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByZWZpeFBhdGgsICdsaWInLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgfVxuICB9IGVsc2UgaWYgKCFjb25maWcuYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzKSB7XG4gICAgbG9jYXRpb25UeXBlID0gJ2xvY2FsIHByb2plY3QnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKG1vZHVsZXNEaXIgfHwgJycsICdlc2xpbnQnKVxuICB9IGVsc2UgaWYgKFBhdGguaXNBYnNvbHV0ZShjb25maWcuYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzKSkge1xuICAgIGxvY2F0aW9uVHlwZSA9ICdhZHZhbmNlZCBzcGVjaWZpZWQnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKGNvbmZpZy5hZHZhbmNlZExvY2FsTm9kZU1vZHVsZXMgfHwgJycsICdlc2xpbnQnKVxuICB9IGVsc2Uge1xuICAgIGxvY2F0aW9uVHlwZSA9ICdhZHZhbmNlZCBzcGVjaWZpZWQnXG4gICAgZXNsaW50RGlyID0gUGF0aC5qb2luKHByb2plY3RQYXRoIHx8ICcnLCBjb25maWcuYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzLCAnZXNsaW50JylcbiAgfVxuICBpZiAoaXNEaXJlY3RvcnkoZXNsaW50RGlyKSkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBlc2xpbnREaXIsXG4gICAgICB0eXBlOiBsb2NhdGlvblR5cGUsXG4gICAgfVxuICB9IGVsc2UgaWYgKGNvbmZpZy51c2VHbG9iYWxFc2xpbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHBsZWFzZSBlbnN1cmUgdGhlIGdsb2JhbCBOb2RlIHBhdGggaXMgc2V0IGNvcnJlY3RseS4nKVxuICB9XG4gIHJldHVybiB7XG4gICAgcGF0aDogQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgsXG4gICAgdHlwZTogJ2J1bmRsZWQgZmFsbGJhY2snLFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFU0xpbnRGcm9tRGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgeyBwYXRoOiBFU0xpbnREaXJlY3RvcnkgfSA9IGZpbmRFU0xpbnREaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnLCBwcm9qZWN0UGF0aClcbiAgdHJ5IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgIHJldHVybiByZXF1aXJlKEVTTGludERpcmVjdG9yeSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChjb25maWcudXNlR2xvYmFsRXNsaW50ICYmIGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTTGludCBub3QgZm91bmQsIHRyeSByZXN0YXJ0aW5nIEF0b20gdG8gY2xlYXIgY2FjaGVzLicpXG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgcmV0dXJuIHJlcXVpcmUoQ2FjaGUuRVNMSU5UX0xPQ0FMX1BBVEgpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKSB7XG4gIGlmIChDYWNoZS5MQVNUX01PRFVMRVNfUEFUSCAhPT0gbW9kdWxlc0Rpcikge1xuICAgIENhY2hlLkxBU1RfTU9EVUxFU19QQVRIID0gbW9kdWxlc0RpclxuICAgIHByb2Nlc3MuZW52Lk5PREVfUEFUSCA9IG1vZHVsZXNEaXIgfHwgJydcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5Nb2R1bGUuX2luaXRQYXRocygpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIGNvbmZpZywgcHJvamVjdFBhdGgpIHtcbiAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguZGlybmFtZShmaW5kQ2FjaGVkKGZpbGVEaXIsICdub2RlX21vZHVsZXMvZXNsaW50JykgfHwgJycpXG4gIHJlZnJlc2hNb2R1bGVzUGF0aChtb2R1bGVzRGlyKVxuICByZXR1cm4gZ2V0RVNMaW50RnJvbURpcmVjdG9yeShtb2R1bGVzRGlyLCBjb25maWcsIHByb2plY3RQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPVxuICAgIGZpbmRDYWNoZWQoZmlsZURpciwgW1xuICAgICAgJy5lc2xpbnRyYy5qcycsICcuZXNsaW50cmMueWFtbCcsICcuZXNsaW50cmMueW1sJywgJy5lc2xpbnRyYy5qc29uJywgJy5lc2xpbnRyYycsICdwYWNrYWdlLmpzb24nXG4gICAgXSlcbiAgaWYgKGNvbmZpZ0ZpbGUpIHtcbiAgICBpZiAoUGF0aC5iYXNlbmFtZShjb25maWdGaWxlKSA9PT0gJ3BhY2thZ2UuanNvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgICBpZiAocmVxdWlyZShjb25maWdGaWxlKS5lc2xpbnRDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ0ZpbGVcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBmb3VuZCBhIHBhY2thZ2UuanNvbiB3aXRob3V0IGFuIGVzbGludCBjb25maWdcbiAgICAgIC8vIGluIGEgZGlyIHdpdGhvdXQgYW55IG90aGVyIGVzbGludCBjb25maWcgZmlsZXNcbiAgICAgIC8vIChiZWNhdXNlICdwYWNrYWdlLmpzb24nIGlzIGxhc3QgaW4gdGhlIGNhbGwgdG8gZmluZENhY2hlZClcbiAgICAgIC8vIFNvLCBrZWVwIGxvb2tpbmcgZnJvbSB0aGUgcGFyZW50IGRpcmVjdG9yeVxuICAgICAgcmV0dXJuIGdldENvbmZpZ1BhdGgoUGF0aC5yZXNvbHZlKFBhdGguZGlybmFtZShjb25maWdGaWxlKSwgJy4uJykpXG4gICAgfVxuICAgIHJldHVybiBjb25maWdGaWxlXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbGF0aXZlUGF0aChmaWxlRGlyLCBmaWxlUGF0aCwgY29uZmlnLCBwcm9qZWN0UGF0aCkge1xuICBjb25zdCBpZ25vcmVGaWxlID0gY29uZmlnLmRpc2FibGVFc2xpbnRJZ25vcmUgPyBudWxsIDogZmluZENhY2hlZChmaWxlRGlyLCAnLmVzbGludGlnbm9yZScpXG5cbiAgLy8gSWYgd2UgY2FuIGZpbmQgYW4gLmVzbGludGlnbm9yZSBmaWxlLCB3ZSBjYW4gc2V0IGN3ZCB0aGVyZVxuICAvLyAoYmVjYXVzZSB0aGV5IGFyZSBleHBlY3RlZCB0byBiZSBhdCB0aGUgcHJvamVjdCByb290KVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNvbnN0IGlnbm9yZURpciA9IFBhdGguZGlybmFtZShpZ25vcmVGaWxlKVxuICAgIHByb2Nlc3MuY2hkaXIoaWdub3JlRGlyKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKGlnbm9yZURpciwgZmlsZVBhdGgpXG4gIH1cbiAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBzZXQgdGhlIGN3ZCB0byB0aGUgYXRvbSBwcm9qZWN0IHJvb3QgYXMgbG9uZyBhcyB0aGF0IGV4aXN0c1xuICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICBwcm9jZXNzLmNoZGlyKHByb2plY3RQYXRoKVxuICAgIHJldHVybiBQYXRoLnJlbGF0aXZlKHByb2plY3RQYXRoLCBmaWxlUGF0aClcbiAgfVxuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIHRoZSBmaWxlIGxvY2F0aW9uIGl0c2VsZlxuICBwcm9jZXNzLmNoZGlyKGZpbGVEaXIpXG4gIHJldHVybiBQYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q0xJRW5naW5lT3B0aW9ucyh0eXBlLCBjb25maWcsIHJ1bGVzLCBmaWxlUGF0aCwgZmlsZURpciwgZ2l2ZW5Db25maWdQYXRoKSB7XG4gIGNvbnN0IGNsaUVuZ2luZUNvbmZpZyA9IHtcbiAgICBydWxlcyxcbiAgICBpZ25vcmU6ICFjb25maWcuZGlzYWJsZUVzbGludElnbm9yZSxcbiAgICB3YXJuSWdub3JlZDogZmFsc2UsXG4gICAgZml4OiB0eXBlID09PSAnZml4J1xuICB9XG5cbiAgY29uc3QgaWdub3JlRmlsZSA9IGNvbmZpZy5kaXNhYmxlRXNsaW50SWdub3JlID8gbnVsbCA6IGZpbmRDYWNoZWQoZmlsZURpciwgJy5lc2xpbnRpZ25vcmUnKVxuICBpZiAoaWdub3JlRmlsZSkge1xuICAgIGNsaUVuZ2luZUNvbmZpZy5pZ25vcmVQYXRoID0gaWdub3JlRmlsZVxuICB9XG5cbiAgaWYgKGNvbmZpZy5lc2xpbnRSdWxlc0Rpcikge1xuICAgIGxldCBydWxlc0RpciA9IHJlc29sdmVFbnYoY29uZmlnLmVzbGludFJ1bGVzRGlyKVxuICAgIGlmICghUGF0aC5pc0Fic29sdXRlKHJ1bGVzRGlyKSkge1xuICAgICAgcnVsZXNEaXIgPSBmaW5kQ2FjaGVkKGZpbGVEaXIsIHJ1bGVzRGlyKVxuICAgIH1cbiAgICBpZiAocnVsZXNEaXIpIHtcbiAgICAgIGNsaUVuZ2luZUNvbmZpZy5ydWxlUGF0aHMgPSBbcnVsZXNEaXJdXG4gICAgfVxuICB9XG5cbiAgaWYgKGdpdmVuQ29uZmlnUGF0aCA9PT0gbnVsbCAmJiBjb25maWcuZXNsaW50cmNQYXRoKSB7XG4gICAgLy8gSWYgd2UgZGlkbid0IGZpbmQgYSBjb25maWd1cmF0aW9uIHVzZSB0aGUgZmFsbGJhY2sgZnJvbSB0aGUgc2V0dGluZ3NcbiAgICBjbGlFbmdpbmVDb25maWcuY29uZmlnRmlsZSA9IHJlc29sdmVFbnYoY29uZmlnLmVzbGludHJjUGF0aClcbiAgfVxuXG4gIHJldHVybiBjbGlFbmdpbmVDb25maWdcbn1cbiJdfQ==