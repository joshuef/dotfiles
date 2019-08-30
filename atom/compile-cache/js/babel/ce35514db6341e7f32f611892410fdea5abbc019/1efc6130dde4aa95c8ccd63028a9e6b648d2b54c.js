'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Promise = require('bluebird');
var readdir = Promise.promisify(require('fs').readdir);
var path = require('path');
var fuzzaldrin = require('fuzzaldrin');
var escapeRegExp = require('lodash.escaperegexp');
var get = require('lodash.get');
var findBabelConfig = require('find-babel-config');
var internalModules = require('./utils/internal-modules');

var _require = require('./utils/export-module-completion');

var getRealExportPrefix = _require.getRealExportPrefix;
var getImportModule = _require.getImportModule;
var getExports = _require.getExports;

var LINE_REGEXP = /(?:^|\s)require\(['"]|^import\s.+from\s+["']|^import\s+["']|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/;

var SELECTOR = ['.source.js', '.source.ts', '.source.tsx', '.source.coffee'];
var SELECTOR_DISABLE = ['.source.js .comment', '.source.js .keyword', '.source.ts .comment', '.source.ts .keyword', '.source.tsx .comment', '.source.tsx .keyword'];

var CompletionProvider = (function () {
  function CompletionProvider() {
    _classCallCheck(this, CompletionProvider);

    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
  }

  _createClass(CompletionProvider, [{
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var _this = this;

      var editor = _ref.editor;
      var bufferPosition = _ref.bufferPosition;
      var prefix = _ref.prefix;

      var line = editor.buffer.lineForRow(bufferPosition.row);
      if (!LINE_REGEXP.test(line)) {
        return [];
      }

      var activePaneFile = atom.workspace.getActivePaneItem().buffer.file;
      // in case user editing unsaved file
      if (!activePaneFile) {
        return [];
      }

      var prefixLine = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      var realImportPrefix = this.getRealImportPrefix(prefix, prefixLine);
      if (realImportPrefix !== false) {
        if (realImportPrefix[0] === '.') {
          return this.lookupLocal(realImportPrefix, path.dirname(editor.getPath()));
        }

        var vendors = atom.config.get('autocomplete-modules.vendors');

        var promises = vendors.map(function (vendor) {
          return _this.lookupGlobal(realImportPrefix, activePaneFile.path, vendor);
        });

        var webpack = atom.config.get('autocomplete-modules.webpack');
        if (webpack) {
          promises.push(this.lookupWebpack(realImportPrefix, activePaneFile.path));
        }

        var babelPluginModuleResolver = atom.config.get('autocomplete-modules.babelPluginModuleResolver');
        if (babelPluginModuleResolver) {
          promises.push(this.lookupbabelPluginModuleResolver(realImportPrefix, activePaneFile.path));
        }

        return Promise.all(promises).then(function (suggestions) {
          var _ref2;

          return (_ref2 = []).concat.apply(_ref2, _toConsumableArray(suggestions));
        });
      }

      var realExportPrefix = getRealExportPrefix(prefix, prefixLine);
      if (realExportPrefix !== false) {
        var importModule = getImportModule(line);
        if (importModule === false) {
          return [];
        }

        return getExports(activePaneFile.path, realExportPrefix, importModule).then(function (suggestions) {
          return suggestions.map(function (exportname) {
            return {
              text: exportname,
              displayText: exportname,
              type: 'import'
            };
          });
        }).then(function (suggestions) {
          return _this.filterSuggestions(prefix, suggestions);
        });
      }

      return [];
    }
  }, {
    key: 'getRealImportPrefix',
    value: function getRealImportPrefix(prefix, line) {
      try {
        var cjsRealPrefixRegExp = new RegExp('require\\([\'"]((?:.+?)*' + escapeRegExp(prefix) + ')');
        var es6RealPrefixRegExp = new RegExp('(?:from|import)\\s+[\'"]((?:.+?)*' + escapeRegExp(prefix) + ')');
        var realPrefixMathes = cjsRealPrefixRegExp.exec(line) || es6RealPrefixRegExp.exec(line);
        if (!realPrefixMathes) {
          return false;
        }

        return realPrefixMathes[1];
      } catch (e) {
        return false;
      }
    }
  }, {
    key: 'filterSuggestions',
    value: function filterSuggestions(prefix, suggestions) {
      return fuzzaldrin.filter(suggestions, prefix, {
        key: 'text'
      });
    }
  }, {
    key: 'lookupLocal',
    value: function lookupLocal(prefix, dirname) {
      var _this2 = this;

      var filterPrefix = prefix.replace(path.dirname(prefix), '').replace('/', '');
      if (prefix[prefix.length - 1] === '/') {
        filterPrefix = '';
      }

      var includeExtension = atom.config.get('autocomplete-modules.includeExtension');
      var lookupDirname = path.resolve(dirname, prefix);
      if (filterPrefix) {
        lookupDirname = lookupDirname.replace(new RegExp(escapeRegExp(filterPrefix) + '$'), '');
      }

      return readdir(lookupDirname)['catch'](function (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }

        return [];
      }).filter(function (filename) {
        return filename[0] !== '.';
      }).map(function (pathname) {
        return {
          text: includeExtension ? pathname : _this2.normalizeLocal(pathname),
          displayText: pathname,
          type: 'import'
        };
      }).then(function (suggestions) {
        return _this2.filterSuggestions(filterPrefix, suggestions);
      });
    }
  }, {
    key: 'normalizeLocal',
    value: function normalizeLocal(filename) {
      return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
    }
  }, {
    key: 'getProjectPath',
    value: function getProjectPath(activePanePath) {
      var _atom$project$relativizePath = atom.project.relativizePath(activePanePath);

      var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 1);

      var projectPath = _atom$project$relativizePath2[0];

      return projectPath;
    }
  }, {
    key: 'lookupGlobal',
    value: function lookupGlobal(prefix, activePanePath) {
      var _this3 = this;

      var vendor = arguments.length <= 2 || arguments[2] === undefined ? 'node_modules' : arguments[2];

      var projectPath = this.getProjectPath(activePanePath);
      if (!projectPath) {
        return Promise.resolve([]);
      }

      var vendorPath = path.join(projectPath, vendor);
      if (prefix.indexOf('/') !== -1) {
        return this.lookupLocal('./' + prefix, vendorPath);
      }

      return readdir(vendorPath)['catch'](function (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }

        return [];
      }).then(function (libs) {
        return [].concat(_toConsumableArray(internalModules), _toConsumableArray(libs));
      }).map(function (lib) {
        return {
          text: lib,
          replacementPrefix: prefix,
          type: 'import'
        };
      }).then(function (suggestions) {
        return _this3.filterSuggestions(prefix, suggestions);
      });
    }
  }, {
    key: 'lookupWebpack',
    value: function lookupWebpack(prefix, activePanePath) {
      var _this4 = this;

      var projectPath = this.getProjectPath(activePanePath);
      if (!projectPath) {
        return Promise.resolve([]);
      }

      var vendors = atom.config.get('autocomplete-modules.vendors');
      var webpackConfig = this.fetchWebpackConfig(projectPath);

      // Webpack v2
      var webpackModules = get(webpackConfig, 'resolve.modules', []);

      // Webpack v1
      var webpackRoot = get(webpackConfig, 'resolve.root', '');
      var moduleSearchPaths = get(webpackConfig, 'resolve.modulesDirectories', webpackModules);
      moduleSearchPaths = moduleSearchPaths.filter(function (item) {
        return vendors.indexOf(item) === -1;
      });

      return Promise.all(moduleSearchPaths.concat(webpackRoot).map(function (searchPath) {
        return _this4.lookupLocal(prefix, path.isAbsolute(searchPath) ? searchPath : path.join(projectPath, searchPath));
      })).then(function (suggestions) {
        var _ref3;

        return (_ref3 = []).concat.apply(_ref3, _toConsumableArray(suggestions));
      });
    }
  }, {
    key: 'fetchWebpackConfig',
    value: function fetchWebpackConfig(rootPath) {
      var webpackConfigFilename = atom.config.get('autocomplete-modules.webpackConfigFilename');
      var webpackConfigPath = path.join(rootPath, webpackConfigFilename);

      try {
        return require(webpackConfigPath); // eslint-disable-line
      } catch (error) {
        return {};
      }
    }
  }, {
    key: 'lookupbabelPluginModuleResolver',
    value: function lookupbabelPluginModuleResolver(prefix, activePanePath) {
      var _this5 = this;

      var projectPath = this.getProjectPath(activePanePath);
      if (projectPath) {
        return findBabelConfig(projectPath).then(function (_ref4) {
          var config = _ref4.config;

          if (config && Array.isArray(config.plugins)) {
            var _ret = (function () {
              // Grab the v1 (module-alias) or v2 (module-resolver) plugin configuration
              var pluginConfig = config.plugins.find(function (p) {
                return p[0] === 'module-alias' || p[0] === 'babel-plugin-module-alias';
              }) || config.plugins.find(function (p) {
                return p[0] === 'module-resolver' || p[0] === 'babel-plugin-module-resolver';
              });
              if (!pluginConfig) {
                return {
                  v: []
                };
              }

              // Only v2 of the plugin supports custom root directories
              var rootPromises = [];
              if (!Array.isArray(pluginConfig[1])) {
                var rootDirs = pluginConfig[1].root || [];
                rootPromises = rootPromises.concat(rootDirs.map(function (r) {
                  var rootDirPath = path.join(projectPath, r);
                  return _this5.lookupLocal('./' + prefix, rootDirPath);
                }));
              }

              // determine the right prefix for the alias config
              // `realPrefix` is the prefix we want to use to find the right file/suggestions
              // when the prefix is a sub module (eg. module/subfile),
              // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
              var prefixSplit = prefix.split('/');
              var modulePrefix = prefixSplit[0];
              var realPrefix = prefixSplit.pop();
              var moduleSearchPath = prefixSplit.join('/');

              // get the alias configs for the specific module
              var aliasConfig = Array.isArray(pluginConfig[1])
              // v1 of the plugin is an array
              ? pluginConfig[1].filter(function (alias) {
                return alias.expose.startsWith(modulePrefix);
              })
              // otherwise it's v2 (an object)
              : Object.keys(pluginConfig[1].alias || {}).filter(function (expose) {
                return expose.startsWith(modulePrefix);
              }).map(function (exp) {
                return {
                  expose: exp,
                  src: pluginConfig[1].alias[exp]
                };
              });

              return {
                v: Promise.all(rootPromises.concat(aliasConfig.map(function (alias) {
                  // The search path is the source directory specified in .babelrc
                  // then we append the `moduleSearchPath` (without the alias)
                  // to get the real search path
                  var searchPath = path.join(path.resolve(projectPath, alias.src), moduleSearchPath.replace(alias.expose, ''));

                  return _this5.lookupLocal(realPrefix, searchPath);
                }))).then(function (suggestions) {
                  var _ref5;

                  return (_ref5 = []).concat.apply(_ref5, _toConsumableArray(suggestions));
                }).then(function (suggestions) {
                  // make sure the suggestions are from the compatible alias
                  if (prefix === realPrefix && aliasConfig.length) {
                    return suggestions.filter(function (sugg) {
                      return aliasConfig.find(function (a) {
                        return a.expose === sugg.text;
                      });
                    });
                  }
                  return suggestions;
                })
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
          }

          return [];
        });
      }
    }
  }]);

  return CompletionProvider;
})();

module.exports = CompletionProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvc3JjL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBRVosSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pELElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekMsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDcEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JELElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztlQUNDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQzs7SUFBaEcsbUJBQW1CLFlBQW5CLG1CQUFtQjtJQUFFLGVBQWUsWUFBZixlQUFlO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBRXhELElBQU0sV0FBVyxHQUFHLHlIQUF5SCxDQUFDOztBQUU5SSxJQUFNLFFBQVEsR0FBRyxDQUNmLFlBQVksRUFDWixZQUFZLEVBQ1osYUFBYSxFQUNiLGdCQUFnQixDQUNqQixDQUFDO0FBQ0YsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixxQkFBcUIsRUFDckIscUJBQXFCLEVBQ3JCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIsc0JBQXNCLEVBQ3RCLHNCQUFzQixDQUN2QixDQUFDOztJQUVJLGtCQUFrQjtBQUNYLFdB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VSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDL0MsMkJBQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUk7NkJBQzVCLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDOytCQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUk7dUJBQUEsQ0FBQztxQkFBQSxDQUM5QyxDQUFDO21CQUNIO0FBQ0QseUJBQU8sV0FBVyxDQUFDO2lCQUNwQixDQUFDO2dCQUFDOzs7O1dBQ0o7O0FBRUQsaUJBQU8sRUFBRSxDQUFDO1NBQ1gsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1NBelFHLGtCQUFrQjs7O0FBNFF4QixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvc3JjL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5jb25zdCByZWFkZGlyID0gUHJvbWlzZS5wcm9taXNpZnkocmVxdWlyZSgnZnMnKS5yZWFkZGlyKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBmdXp6YWxkcmluID0gcmVxdWlyZSgnZnV6emFsZHJpbicpO1xuY29uc3QgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnbG9kYXNoLmVzY2FwZXJlZ2V4cCcpO1xuY29uc3QgZ2V0ID0gcmVxdWlyZSgnbG9kYXNoLmdldCcpO1xuY29uc3QgZmluZEJhYmVsQ29uZmlnID0gcmVxdWlyZSgnZmluZC1iYWJlbC1jb25maWcnKTtcbmNvbnN0IGludGVybmFsTW9kdWxlcyA9IHJlcXVpcmUoJy4vdXRpbHMvaW50ZXJuYWwtbW9kdWxlcycpO1xuY29uc3QgeyBnZXRSZWFsRXhwb3J0UHJlZml4LCBnZXRJbXBvcnRNb2R1bGUsIGdldEV4cG9ydHMgfSA9IHJlcXVpcmUoJy4vdXRpbHMvZXhwb3J0LW1vZHVsZS1jb21wbGV0aW9uJyk7XG5cbmNvbnN0IExJTkVfUkVHRVhQID0gLyg/Ol58XFxzKXJlcXVpcmVcXChbJ1wiXXxeaW1wb3J0XFxzLitmcm9tXFxzK1tcIiddfF5pbXBvcnRcXHMrW1wiJ118ZXhwb3J0XFxzKyg/OlxcKnx7W2EtekEtWjAtOV8kLFxcc10rfSkrXFxzK2Zyb218fVxccypmcm9tXFxzKlsnXCJdLztcblxuY29uc3QgU0VMRUNUT1IgPSBbXG4gICcuc291cmNlLmpzJyxcbiAgJy5zb3VyY2UudHMnLFxuICAnLnNvdXJjZS50c3gnLFxuICAnLnNvdXJjZS5jb2ZmZWUnXG5dO1xuY29uc3QgU0VMRUNUT1JfRElTQUJMRSA9IFtcbiAgJy5zb3VyY2UuanMgLmNvbW1lbnQnLFxuICAnLnNvdXJjZS5qcyAua2V5d29yZCcsXG4gICcuc291cmNlLnRzIC5jb21tZW50JyxcbiAgJy5zb3VyY2UudHMgLmtleXdvcmQnLFxuICAnLnNvdXJjZS50c3ggLmNvbW1lbnQnLFxuICAnLnNvdXJjZS50c3ggLmtleXdvcmQnXG5dO1xuXG5jbGFzcyBDb21wbGV0aW9uUHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gU0VMRUNUT1Iuam9pbignLCAnKTtcbiAgICB0aGlzLmRpc2FibGVGb3JTZWxlY3RvciA9IFNFTEVDVE9SX0RJU0FCTEUuam9pbignLCAnKTtcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXh9KSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5idWZmZXIubGluZUZvclJvdyhidWZmZXJQb3NpdGlvbi5yb3cpO1xuICAgIGlmICghTElORV9SRUdFWFAudGVzdChsaW5lKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZVBhbmVGaWxlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKS5idWZmZXIuZmlsZTtcbiAgICAvLyBpbiBjYXNlIHVzZXIgZWRpdGluZyB1bnNhdmVkIGZpbGVcbiAgICBpZiAoIWFjdGl2ZVBhbmVGaWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcHJlZml4TGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG4gICAgY29uc3QgcmVhbEltcG9ydFByZWZpeCA9IHRoaXMuZ2V0UmVhbEltcG9ydFByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChyZWFsSW1wb3J0UHJlZml4ICE9PSBmYWxzZSkge1xuICAgICAgaWYgKHJlYWxJbXBvcnRQcmVmaXhbMF0gPT09ICcuJykge1xuICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsSW1wb3J0UHJlZml4LCBwYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzID0gdmVuZG9ycy5tYXAoXG4gICAgICAgICh2ZW5kb3IpID0+IHRoaXMubG9va3VwR2xvYmFsKHJlYWxJbXBvcnRQcmVmaXgsIGFjdGl2ZVBhbmVGaWxlLnBhdGgsIHZlbmRvcilcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHdlYnBhY2sgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLndlYnBhY2snKTtcbiAgICAgIGlmICh3ZWJwYWNrKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb29rdXBXZWJwYWNrKHJlYWxJbXBvcnRQcmVmaXgsIGFjdGl2ZVBhbmVGaWxlLnBhdGgpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlciA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMuYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcicpO1xuICAgICAgaWYgKGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvb2t1cGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIocmVhbEltcG9ydFByZWZpeCwgYWN0aXZlUGFuZUZpbGUucGF0aCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oXG4gICAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCByZWFsRXhwb3J0UHJlZml4ID0gZ2V0UmVhbEV4cG9ydFByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChyZWFsRXhwb3J0UHJlZml4ICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgaW1wb3J0TW9kdWxlID0gZ2V0SW1wb3J0TW9kdWxlKGxpbmUpO1xuICAgICAgaWYgKGltcG9ydE1vZHVsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ2V0RXhwb3J0cyhhY3RpdmVQYW5lRmlsZS5wYXRoLCByZWFsRXhwb3J0UHJlZml4LCBpbXBvcnRNb2R1bGUpXG4gICAgICAudGhlbigoc3VnZ2VzdGlvbnMpID0+IHN1Z2dlc3Rpb25zLm1hcCgoZXhwb3J0bmFtZSkgPT4gKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGV4dDogZXhwb3J0bmFtZSxcbiAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IGV4cG9ydG5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBnZXRSZWFsSW1wb3J0UHJlZml4KHByZWZpeCwgbGluZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjanNSZWFsUHJlZml4UmVnRXhwID0gbmV3IFJlZ0V4cChgcmVxdWlyZVxcXFwoWydcIl0oKD86Lis/KSoke2VzY2FwZVJlZ0V4cChwcmVmaXgpfSlgKTtcbiAgICAgIGNvbnN0IGVzNlJlYWxQcmVmaXhSZWdFeHAgPSBuZXcgUmVnRXhwKGAoPzpmcm9tfGltcG9ydClcXFxccytbJ1wiXSgoPzouKz8pKiR7ZXNjYXBlUmVnRXhwKHByZWZpeCl9KWApO1xuICAgICAgY29uc3QgcmVhbFByZWZpeE1hdGhlcyA9IGNqc1JlYWxQcmVmaXhSZWdFeHAuZXhlYyhsaW5lKSB8fCBlczZSZWFsUHJlZml4UmVnRXhwLmV4ZWMobGluZSk7XG4gICAgICBpZiAoIXJlYWxQcmVmaXhNYXRoZXMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVhbFByZWZpeE1hdGhlc1sxXTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZmlsdGVyU3VnZ2VzdGlvbnMocHJlZml4LCBzdWdnZXN0aW9ucykge1xuICAgIHJldHVybiBmdXp6YWxkcmluLmZpbHRlcihzdWdnZXN0aW9ucywgcHJlZml4LCB7XG4gICAgICBrZXk6ICd0ZXh0J1xuICAgIH0pO1xuICB9XG5cbiAgbG9va3VwTG9jYWwocHJlZml4LCBkaXJuYW1lKSB7XG4gICAgbGV0IGZpbHRlclByZWZpeCA9IHByZWZpeC5yZXBsYWNlKHBhdGguZGlybmFtZShwcmVmaXgpLCAnJykucmVwbGFjZSgnLycsICcnKTtcbiAgICBpZiAocHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXSA9PT0gJy8nKSB7XG4gICAgICBmaWx0ZXJQcmVmaXggPSAnJztcbiAgICB9XG5cbiAgICBjb25zdCBpbmNsdWRlRXh0ZW5zaW9uID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy5pbmNsdWRlRXh0ZW5zaW9uJyk7XG4gICAgbGV0IGxvb2t1cERpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlybmFtZSwgcHJlZml4KTtcbiAgICBpZiAoZmlsdGVyUHJlZml4KSB7XG4gICAgICBsb29rdXBEaXJuYW1lID0gbG9va3VwRGlybmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoYCR7ZXNjYXBlUmVnRXhwKGZpbHRlclByZWZpeCl9JGApLCAnJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlYWRkaXIobG9va3VwRGlybmFtZSkuY2F0Y2goKGUpID0+IHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9KS5maWx0ZXIoXG4gICAgICAoZmlsZW5hbWUpID0+IGZpbGVuYW1lWzBdICE9PSAnLidcbiAgICApLm1hcCgocGF0aG5hbWUpID0+ICh7XG4gICAgICB0ZXh0OiBpbmNsdWRlRXh0ZW5zaW9uID8gcGF0aG5hbWUgOiB0aGlzLm5vcm1hbGl6ZUxvY2FsKHBhdGhuYW1lKSxcbiAgICAgIGRpc3BsYXlUZXh0OiBwYXRobmFtZSxcbiAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgfSkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMoZmlsdGVyUHJlZml4LCBzdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbm9ybWFsaXplTG9jYWwoZmlsZW5hbWUpIHtcbiAgICByZXR1cm4gZmlsZW5hbWUucmVwbGFjZSgvXFwuKGpzfGVzNnxqc3h8Y29mZmVlfHRzfHRzeCkkLywgJycpO1xuICB9XG5cbiAgZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBbcHJvamVjdFBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICByZXR1cm4gcHJvamVjdFBhdGg7XG4gIH1cblxuICBsb29rdXBHbG9iYWwocHJlZml4LCBhY3RpdmVQYW5lUGF0aCwgdmVuZG9yID0gJ25vZGVfbW9kdWxlcycpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIGlmICghcHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIGNvbnN0IHZlbmRvclBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHZlbmRvcik7XG4gICAgaWYgKHByZWZpeC5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChgLi8ke3ByZWZpeH1gLCB2ZW5kb3JQYXRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhZGRpcih2ZW5kb3JQYXRoKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKGUuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0pLnRoZW4oXG4gICAgICAobGlicykgPT4gWy4uLmludGVybmFsTW9kdWxlcywgLi4ubGlic11cbiAgICApLm1hcCgobGliKSA9PiAoe1xuICAgICAgdGV4dDogbGliLFxuICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeCxcbiAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgfSkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJlZml4LCBzdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbG9va3VwV2VicGFjayhwcmVmaXgsIGFjdGl2ZVBhbmVQYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSB0aGlzLmdldFByb2plY3RQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICBpZiAoIXByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZyA9IHRoaXMuZmV0Y2hXZWJwYWNrQ29uZmlnKHByb2plY3RQYXRoKTtcblxuICAgIC8vIFdlYnBhY2sgdjJcbiAgICBjb25zdCB3ZWJwYWNrTW9kdWxlcyA9IGdldCh3ZWJwYWNrQ29uZmlnLCAncmVzb2x2ZS5tb2R1bGVzJywgW10pO1xuXG4gICAgLy8gV2VicGFjayB2MVxuICAgIGNvbnN0IHdlYnBhY2tSb290ID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLnJvb3QnLCAnJyk7XG4gICAgbGV0IG1vZHVsZVNlYXJjaFBhdGhzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLm1vZHVsZXNEaXJlY3RvcmllcycsIHdlYnBhY2tNb2R1bGVzKTtcbiAgICBtb2R1bGVTZWFyY2hQYXRocyA9IG1vZHVsZVNlYXJjaFBhdGhzLmZpbHRlcihcbiAgICAgIChpdGVtKSA9PiB2ZW5kb3JzLmluZGV4T2YoaXRlbSkgPT09IC0xXG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChtb2R1bGVTZWFyY2hQYXRocy5jb25jYXQod2VicGFja1Jvb3QpLm1hcChcbiAgICAgIChzZWFyY2hQYXRoKSA9PiB0aGlzLmxvb2t1cExvY2FsKFxuICAgICAgICBwcmVmaXgsXG4gICAgICAgIHBhdGguaXNBYnNvbHV0ZShzZWFyY2hQYXRoKSA/IHNlYXJjaFBhdGggOiBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHNlYXJjaFBhdGgpXG4gICAgICApXG4gICAgKSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBmZXRjaFdlYnBhY2tDb25maWcocm9vdFBhdGgpIHtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnRmlsZW5hbWUgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLndlYnBhY2tDb25maWdGaWxlbmFtZScpO1xuICAgIGNvbnN0IHdlYnBhY2tDb25maWdQYXRoID0gcGF0aC5qb2luKHJvb3RQYXRoLCB3ZWJwYWNrQ29uZmlnRmlsZW5hbWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiByZXF1aXJlKHdlYnBhY2tDb25maWdQYXRoKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9XG5cbiAgbG9va3VwYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcihwcmVmaXgsIGFjdGl2ZVBhbmVQYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSB0aGlzLmdldFByb2plY3RQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBmaW5kQmFiZWxDb25maWcocHJvamVjdFBhdGgpLnRoZW4oKHtjb25maWd9KSA9PiB7XG4gICAgICAgIGlmIChjb25maWcgJiYgQXJyYXkuaXNBcnJheShjb25maWcucGx1Z2lucykpIHtcbiAgICAgICAgICAvLyBHcmFiIHRoZSB2MSAobW9kdWxlLWFsaWFzKSBvciB2MiAobW9kdWxlLXJlc29sdmVyKSBwbHVnaW4gY29uZmlndXJhdGlvblxuICAgICAgICAgIGNvbnN0IHBsdWdpbkNvbmZpZyA9IGNvbmZpZy5wbHVnaW5zLmZpbmQocCA9PiBwWzBdID09PSAnbW9kdWxlLWFsaWFzJyB8fCBwWzBdID09PSAnYmFiZWwtcGx1Z2luLW1vZHVsZS1hbGlhcycpIHx8XG4gICAgICAgICAgICBjb25maWcucGx1Z2lucy5maW5kKHAgPT4gcFswXSA9PT0gJ21vZHVsZS1yZXNvbHZlcicgfHwgcFswXSA9PT0gJ2JhYmVsLXBsdWdpbi1tb2R1bGUtcmVzb2x2ZXInKTtcbiAgICAgICAgICBpZiAoIXBsdWdpbkNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE9ubHkgdjIgb2YgdGhlIHBsdWdpbiBzdXBwb3J0cyBjdXN0b20gcm9vdCBkaXJlY3Rvcmllc1xuICAgICAgICAgIGxldCByb290UHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGx1Z2luQ29uZmlnWzFdKSkge1xuICAgICAgICAgICAgY29uc3Qgcm9vdERpcnMgPSBwbHVnaW5Db25maWdbMV0ucm9vdCB8fCBbXTtcbiAgICAgICAgICAgIHJvb3RQcm9taXNlcyA9IHJvb3RQcm9taXNlcy5jb25jYXQocm9vdERpcnMubWFwKHIgPT4ge1xuICAgICAgICAgICAgICBjb25zdCByb290RGlyUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgcik7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKGAuLyR7cHJlZml4fWAsIHJvb3REaXJQYXRoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBkZXRlcm1pbmUgdGhlIHJpZ2h0IHByZWZpeCBmb3IgdGhlIGFsaWFzIGNvbmZpZ1xuICAgICAgICAgIC8vIGByZWFsUHJlZml4YCBpcyB0aGUgcHJlZml4IHdlIHdhbnQgdG8gdXNlIHRvIGZpbmQgdGhlIHJpZ2h0IGZpbGUvc3VnZ2VzdGlvbnNcbiAgICAgICAgICAvLyB3aGVuIHRoZSBwcmVmaXggaXMgYSBzdWIgbW9kdWxlIChlZy4gbW9kdWxlL3N1YmZpbGUpLFxuICAgICAgICAgIC8vIGBtb2R1bGVQcmVmaXhgIHdpbGwgYmUgXCJtb2R1bGVcIiwgYW5kIGByZWFsUHJlZml4YCB3aWxsIGJlIFwic3ViZmlsZVwiXG4gICAgICAgICAgY29uc3QgcHJlZml4U3BsaXQgPSBwcmVmaXguc3BsaXQoJy8nKTtcbiAgICAgICAgICBjb25zdCBtb2R1bGVQcmVmaXggPSBwcmVmaXhTcGxpdFswXTtcbiAgICAgICAgICBjb25zdCByZWFsUHJlZml4ID0gcHJlZml4U3BsaXQucG9wKCk7XG4gICAgICAgICAgY29uc3QgbW9kdWxlU2VhcmNoUGF0aCA9IHByZWZpeFNwbGl0LmpvaW4oJy8nKTtcblxuICAgICAgICAgIC8vIGdldCB0aGUgYWxpYXMgY29uZmlncyBmb3IgdGhlIHNwZWNpZmljIG1vZHVsZVxuICAgICAgICAgIGNvbnN0IGFsaWFzQ29uZmlnID0gQXJyYXkuaXNBcnJheShwbHVnaW5Db25maWdbMV0pXG4gICAgICAgICAgICAvLyB2MSBvZiB0aGUgcGx1Z2luIGlzIGFuIGFycmF5XG4gICAgICAgICAgICA/IHBsdWdpbkNvbmZpZ1sxXS5maWx0ZXIoYWxpYXMgPT4gYWxpYXMuZXhwb3NlLnN0YXJ0c1dpdGgobW9kdWxlUHJlZml4KSlcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSBpdCdzIHYyIChhbiBvYmplY3QpXG4gICAgICAgICAgICA6IE9iamVjdC5rZXlzKHBsdWdpbkNvbmZpZ1sxXS5hbGlhcyB8fCB7fSlcbiAgICAgICAgICAgICAgLmZpbHRlcihleHBvc2UgPT4gZXhwb3NlLnN0YXJ0c1dpdGgobW9kdWxlUHJlZml4KSlcbiAgICAgICAgICAgICAgLm1hcChleHAgPT4gKHtcbiAgICAgICAgICAgICAgICBleHBvc2U6IGV4cCxcbiAgICAgICAgICAgICAgICBzcmM6IHBsdWdpbkNvbmZpZ1sxXS5hbGlhc1tleHBdXG4gICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyb290UHJvbWlzZXMuY29uY2F0KGFsaWFzQ29uZmlnLm1hcChcbiAgICAgICAgICAgIChhbGlhcykgPT4ge1xuICAgICAgICAgICAgICAvLyBUaGUgc2VhcmNoIHBhdGggaXMgdGhlIHNvdXJjZSBkaXJlY3Rvcnkgc3BlY2lmaWVkIGluIC5iYWJlbHJjXG4gICAgICAgICAgICAgIC8vIHRoZW4gd2UgYXBwZW5kIHRoZSBgbW9kdWxlU2VhcmNoUGF0aGAgKHdpdGhvdXQgdGhlIGFsaWFzKVxuICAgICAgICAgICAgICAvLyB0byBnZXQgdGhlIHJlYWwgc2VhcmNoIHBhdGhcbiAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoUGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGFsaWFzLnNyYyksXG4gICAgICAgICAgICAgICAgbW9kdWxlU2VhcmNoUGF0aC5yZXBsYWNlKGFsaWFzLmV4cG9zZSwgJycpXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwocmVhbFByZWZpeCwgc2VhcmNoUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSkpLnRoZW4oXG4gICAgICAgICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICAgICAgICApLnRoZW4oc3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBzdWdnZXN0aW9ucyBhcmUgZnJvbSB0aGUgY29tcGF0aWJsZSBhbGlhc1xuICAgICAgICAgICAgaWYgKHByZWZpeCA9PT0gcmVhbFByZWZpeCAmJiBhbGlhc0NvbmZpZy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zLmZpbHRlcihzdWdnID0+XG4gICAgICAgICAgICAgICAgYWxpYXNDb25maWcuZmluZChhID0+IGEuZXhwb3NlID09PSBzdWdnLnRleHQpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW107XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV0aW9uUHJvdmlkZXI7XG4iXX0=