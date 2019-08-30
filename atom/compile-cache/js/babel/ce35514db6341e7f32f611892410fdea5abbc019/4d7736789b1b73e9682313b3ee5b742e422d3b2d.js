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
      var webpackAliases = get(webpackConfig, 'resolve.alias', {});

      // Webpack v1
      var webpackRoot = get(webpackConfig, 'resolve.root', '');
      var moduleSearchPaths = get(webpackConfig, 'resolve.modulesDirectories', webpackModules);
      moduleSearchPaths = moduleSearchPaths.filter(function (item) {
        return vendors.indexOf(item) === -1;
      });

      return Promise.all(moduleSearchPaths.concat(webpackRoot).map(function (searchPath) {
        return _this4.lookupLocal(prefix, path.isAbsolute(searchPath) ? searchPath : path.join(projectPath, searchPath));
      }).concat(this.lookupAliases(prefix, projectPath, Object.keys(webpackAliases).map(function (exp) {
        return {
          expose: exp,
          src: webpackAliases[exp]
        };
      })))).then(function (suggestions) {
        var _ref3;

        return (_ref3 = []).concat.apply(_ref3, _toConsumableArray(suggestions));
      });
    }
  }, {
    key: 'lookupAliases',
    value: function lookupAliases(prefix, projectPath) {
      var _this5 = this;

      var aliases = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      // determine the right prefix for the alias config
      // `realPrefix` is the prefix we want to use to find the right file/suggestions
      // when the prefix is a sub module (eg. module/subfile),
      // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
      var prefixSplit = prefix.split('/');
      var modulePrefix = prefixSplit[0];
      var realPrefix = prefixSplit.pop();
      var moduleSearchPath = prefixSplit.join('/');

      return Promise.all(aliases.filter(function (alias) {
        return alias.expose.startsWith(modulePrefix);
      }).map(function (alias) {
        // The search path is the source directory specified in .babelrc
        // then we append the `moduleSearchPath` (without the alias)
        // to get the real search path
        var searchPath = path.join(path.resolve(projectPath, alias.src), moduleSearchPath.replace(alias.expose, ''));

        return _this5.lookupLocal(realPrefix, searchPath);
      })).then(function (suggestions) {
        var _ref4;

        return (_ref4 = []).concat.apply(_ref4, _toConsumableArray(suggestions));
      }).then(function (suggestions) {
        // make sure the suggestions are from the compatible alias
        if (prefix === realPrefix && aliases.length) {
          return suggestions.filter(function (sugg) {
            return aliases.find(function (a) {
              return a.expose === sugg.text;
            });
          });
        }
        return suggestions;
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
      var _this6 = this;

      var projectPath = this.getProjectPath(activePanePath);

      if (!projectPath) return;

      var suggestionsTotal = [];
      var currentPath = path.dirname(activePanePath);

      while (currentPath.startsWith(projectPath)) {
        var currentSuggestions = findBabelConfig(currentPath).then(function (_ref5) {
          var config = _ref5.config;

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
                  return _this6.lookupLocal('./' + prefix, rootDirPath);
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

                  return _this6.lookupLocal(realPrefix, searchPath);
                }))).then(function (suggestions) {
                  var _ref6;

                  return (_ref6 = []).concat.apply(_ref6, _toConsumableArray(suggestions));
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

        suggestionsTotal.push(currentSuggestions);
        currentPath = path.resolve(currentPath, '../');
      }

      return Promise.all(suggestionsTotal).then(function (list) {
        return list.reduce(function (acc, suggestions) {
          return acc.concat(suggestions);
        }, []);
      });
    }
  }]);

  return CompletionProvider;
})();

module.exports = CompletionProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvc3JjL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBRVosSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pELElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekMsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDcEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JELElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztlQUNDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQzs7SUFBaEcsbUJBQW1CLFlBQW5CLG1CQUFtQjtJQUFFLGVBQWUsWUFBZixlQUFlO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBRXhELElBQU0sV0FBVyxHQUFHLHlIQUF5SCxDQUFDOztBQUU5SSxJQUFNLFFBQVEsR0FBRyxDQUNmLFlBQVksRUFDWixZQUFZLEVBQ1osYUFBYSxFQUNiLGdCQUFnQixDQUNqQixDQUFDO0FBQ0YsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixxQkFBcUIsRUFDckIscUJBQXFCLEVBQ3JCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIsc0JBQXNCLEVBQ3RCLHNCQUFzQixDQUN2QixDQUFDOztJQUVJLGtCQUFrQjtBQUNYLFdB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QztPQUNoRDs7QUFFRCxhQUFPLE9BQU8sQ0FDWCxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FDckIsSUFBSSxDQUFDLFVBQUEsSUFBSTtlQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsV0FBVztpQkFBSyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztTQUFBLEVBQUUsRUFBRSxDQUFDO09BQUEsQ0FBQyxDQUFDO0tBQ2pGOzs7U0FqVUcsa0JBQWtCOzs7QUFvVXhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtbW9kdWxlcy9zcmMvY29tcGxldGlvbi1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmNvbnN0IHJlYWRkaXIgPSBQcm9taXNlLnByb21pc2lmeShyZXF1aXJlKCdmcycpLnJlYWRkaXIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZ1enphbGRyaW4gPSByZXF1aXJlKCdmdXp6YWxkcmluJyk7XG5jb25zdCBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCdsb2Rhc2guZXNjYXBlcmVnZXhwJyk7XG5jb25zdCBnZXQgPSByZXF1aXJlKCdsb2Rhc2guZ2V0Jyk7XG5jb25zdCBmaW5kQmFiZWxDb25maWcgPSByZXF1aXJlKCdmaW5kLWJhYmVsLWNvbmZpZycpO1xuY29uc3QgaW50ZXJuYWxNb2R1bGVzID0gcmVxdWlyZSgnLi91dGlscy9pbnRlcm5hbC1tb2R1bGVzJyk7XG5jb25zdCB7IGdldFJlYWxFeHBvcnRQcmVmaXgsIGdldEltcG9ydE1vZHVsZSwgZ2V0RXhwb3J0cyB9ID0gcmVxdWlyZSgnLi91dGlscy9leHBvcnQtbW9kdWxlLWNvbXBsZXRpb24nKTtcblxuY29uc3QgTElORV9SRUdFWFAgPSAvKD86XnxcXHMpcmVxdWlyZVxcKFsnXCJdfF5pbXBvcnRcXHMuK2Zyb21cXHMrW1wiJ118XmltcG9ydFxccytbXCInXXxleHBvcnRcXHMrKD86XFwqfHtbYS16QS1aMC05XyQsXFxzXSt9KStcXHMrZnJvbXx9XFxzKmZyb21cXHMqWydcIl0vO1xuXG5jb25zdCBTRUxFQ1RPUiA9IFtcbiAgJy5zb3VyY2UuanMnLFxuICAnLnNvdXJjZS50cycsXG4gICcuc291cmNlLnRzeCcsXG4gICcuc291cmNlLmNvZmZlZSdcbl07XG5jb25zdCBTRUxFQ1RPUl9ESVNBQkxFID0gW1xuICAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICcuc291cmNlLmpzIC5rZXl3b3JkJyxcbiAgJy5zb3VyY2UudHMgLmNvbW1lbnQnLFxuICAnLnNvdXJjZS50cyAua2V5d29yZCcsXG4gICcuc291cmNlLnRzeCAuY29tbWVudCcsXG4gICcuc291cmNlLnRzeCAua2V5d29yZCdcbl07XG5cbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBTRUxFQ1RPUi5qb2luKCcsICcpO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gU0VMRUNUT1JfRElTQUJMRS5qb2luKCcsICcpO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoe2VkaXRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeH0pIHtcbiAgICBjb25zdCBsaW5lID0gZWRpdG9yLmJ1ZmZlci5saW5lRm9yUm93KGJ1ZmZlclBvc2l0aW9uLnJvdyk7XG4gICAgaWYgKCFMSU5FX1JFR0VYUC50ZXN0KGxpbmUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlUGFuZUZpbGUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpLmJ1ZmZlci5maWxlO1xuICAgIC8vIGluIGNhc2UgdXNlciBlZGl0aW5nIHVuc2F2ZWQgZmlsZVxuICAgIGlmICghYWN0aXZlUGFuZUZpbGUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVmaXhMaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKTtcbiAgICBjb25zdCByZWFsSW1wb3J0UHJlZml4ID0gdGhpcy5nZXRSZWFsSW1wb3J0UHJlZml4KHByZWZpeCwgcHJlZml4TGluZSk7XG4gICAgaWYgKHJlYWxJbXBvcnRQcmVmaXggIT09IGZhbHNlKSB7XG4gICAgICBpZiAocmVhbEltcG9ydFByZWZpeFswXSA9PT0gJy4nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKHJlYWxJbXBvcnRQcmVmaXgsIHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZlbmRvcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLnZlbmRvcnMnKTtcblxuICAgICAgY29uc3QgcHJvbWlzZXMgPSB2ZW5kb3JzLm1hcChcbiAgICAgICAgKHZlbmRvcikgPT4gdGhpcy5sb29rdXBHbG9iYWwocmVhbEltcG9ydFByZWZpeCwgYWN0aXZlUGFuZUZpbGUucGF0aCwgdmVuZG9yKVxuICAgICAgKTtcblxuICAgICAgY29uc3Qgd2VicGFjayA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMud2VicGFjaycpO1xuICAgICAgaWYgKHdlYnBhY2spIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvb2t1cFdlYnBhY2socmVhbEltcG9ydFByZWZpeCwgYWN0aXZlUGFuZUZpbGUucGF0aCkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy5iYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyJyk7XG4gICAgICBpZiAoYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcikge1xuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9va3VwYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcihyZWFsSW1wb3J0UHJlZml4LCBhY3RpdmVQYW5lRmlsZS5wYXRoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihcbiAgICAgICAgKHN1Z2dlc3Rpb25zKSA9PiBbXS5jb25jYXQoLi4uc3VnZ2VzdGlvbnMpXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHJlYWxFeHBvcnRQcmVmaXggPSBnZXRSZWFsRXhwb3J0UHJlZml4KHByZWZpeCwgcHJlZml4TGluZSk7XG4gICAgaWYgKHJlYWxFeHBvcnRQcmVmaXggIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBpbXBvcnRNb2R1bGUgPSBnZXRJbXBvcnRNb2R1bGUobGluZSk7XG4gICAgICBpZiAoaW1wb3J0TW9kdWxlID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBnZXRFeHBvcnRzKGFjdGl2ZVBhbmVGaWxlLnBhdGgsIHJlYWxFeHBvcnRQcmVmaXgsIGltcG9ydE1vZHVsZSlcbiAgICAgIC50aGVuKChzdWdnZXN0aW9ucykgPT4gc3VnZ2VzdGlvbnMubWFwKChleHBvcnRuYW1lKSA9PiAoXG4gICAgICAgICAge1xuICAgICAgICAgICAgICB0ZXh0OiBleHBvcnRuYW1lLFxuICAgICAgICAgICAgICBkaXNwbGF5VGV4dDogZXhwb3J0bmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltcG9ydCdcbiAgICAgICAgICB9KSkpXG4gICAgICAudGhlbigoc3VnZ2VzdGlvbnMpID0+IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJlZml4LCBzdWdnZXN0aW9ucykpO1xuICAgIH1cblxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldFJlYWxJbXBvcnRQcmVmaXgocHJlZml4LCBsaW5lKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNqc1JlYWxQcmVmaXhSZWdFeHAgPSBuZXcgUmVnRXhwKGByZXF1aXJlXFxcXChbJ1wiXSgoPzouKz8pKiR7ZXNjYXBlUmVnRXhwKHByZWZpeCl9KWApO1xuICAgICAgY29uc3QgZXM2UmVhbFByZWZpeFJlZ0V4cCA9IG5ldyBSZWdFeHAoYCg/OmZyb218aW1wb3J0KVxcXFxzK1snXCJdKCg/Oi4rPykqJHtlc2NhcGVSZWdFeHAocHJlZml4KX0pYCk7XG4gICAgICBjb25zdCByZWFsUHJlZml4TWF0aGVzID0gY2pzUmVhbFByZWZpeFJlZ0V4cC5leGVjKGxpbmUpIHx8IGVzNlJlYWxQcmVmaXhSZWdFeHAuZXhlYyhsaW5lKTtcbiAgICAgIGlmICghcmVhbFByZWZpeE1hdGhlcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWFsUHJlZml4TWF0aGVzWzFdO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBmaWx0ZXJTdWdnZXN0aW9ucyhwcmVmaXgsIHN1Z2dlc3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1enphbGRyaW4uZmlsdGVyKHN1Z2dlc3Rpb25zLCBwcmVmaXgsIHtcbiAgICAgIGtleTogJ3RleHQnXG4gICAgfSk7XG4gIH1cblxuICBsb29rdXBMb2NhbChwcmVmaXgsIGRpcm5hbWUpIHtcbiAgICBsZXQgZmlsdGVyUHJlZml4ID0gcHJlZml4LnJlcGxhY2UocGF0aC5kaXJuYW1lKHByZWZpeCksICcnKS5yZXBsYWNlKCcvJywgJycpO1xuICAgIGlmIChwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgIGZpbHRlclByZWZpeCA9ICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGluY2x1ZGVFeHRlbnNpb24gPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLmluY2x1ZGVFeHRlbnNpb24nKTtcbiAgICBsZXQgbG9va3VwRGlybmFtZSA9IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBwcmVmaXgpO1xuICAgIGlmIChmaWx0ZXJQcmVmaXgpIHtcbiAgICAgIGxvb2t1cERpcm5hbWUgPSBsb29rdXBEaXJuYW1lLnJlcGxhY2UobmV3IFJlZ0V4cChgJHtlc2NhcGVSZWdFeHAoZmlsdGVyUHJlZml4KX0kYCksICcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhZGRpcihsb29rdXBEaXJuYW1lKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKGUuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0pLmZpbHRlcihcbiAgICAgIChmaWxlbmFtZSkgPT4gZmlsZW5hbWVbMF0gIT09ICcuJ1xuICAgICkubWFwKChwYXRobmFtZSkgPT4gKHtcbiAgICAgIHRleHQ6IGluY2x1ZGVFeHRlbnNpb24gPyBwYXRobmFtZSA6IHRoaXMubm9ybWFsaXplTG9jYWwocGF0aG5hbWUpLFxuICAgICAgZGlzcGxheVRleHQ6IHBhdGhuYW1lLFxuICAgICAgdHlwZTogJ2ltcG9ydCdcbiAgICB9KSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gdGhpcy5maWx0ZXJTdWdnZXN0aW9ucyhmaWx0ZXJQcmVmaXgsIHN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBub3JtYWxpemVMb2NhbChmaWxlbmFtZSkge1xuICAgIHJldHVybiBmaWxlbmFtZS5yZXBsYWNlKC9cXC4oanN8ZXM2fGpzeHxjb2ZmZWV8dHN8dHN4KSQvLCAnJyk7XG4gIH1cblxuICBnZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCkge1xuICAgIGNvbnN0IFtwcm9qZWN0UGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIHJldHVybiBwcm9qZWN0UGF0aDtcbiAgfVxuXG4gIGxvb2t1cEdsb2JhbChwcmVmaXgsIGFjdGl2ZVBhbmVQYXRoLCB2ZW5kb3IgPSAnbm9kZV9tb2R1bGVzJykge1xuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5nZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCk7XG4gICAgaWYgKCFwcm9qZWN0UGF0aCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVuZG9yUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgdmVuZG9yKTtcbiAgICBpZiAocHJlZml4LmluZGV4T2YoJy8nKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKGAuLyR7cHJlZml4fWAsIHZlbmRvclBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiByZWFkZGlyKHZlbmRvclBhdGgpLmNhdGNoKChlKSA9PiB7XG4gICAgICBpZiAoZS5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW107XG4gICAgfSkudGhlbihcbiAgICAgIChsaWJzKSA9PiBbLi4uaW50ZXJuYWxNb2R1bGVzLCAuLi5saWJzXVxuICAgICkubWFwKChsaWIpID0+ICh7XG4gICAgICB0ZXh0OiBsaWIsXG4gICAgICByZXBsYWNlbWVudFByZWZpeDogcHJlZml4LFxuICAgICAgdHlwZTogJ2ltcG9ydCdcbiAgICB9KSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gdGhpcy5maWx0ZXJTdWdnZXN0aW9ucyhwcmVmaXgsIHN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBsb29rdXBXZWJwYWNrKHByZWZpeCwgYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIGlmICghcHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIGNvbnN0IHZlbmRvcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLnZlbmRvcnMnKTtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnID0gdGhpcy5mZXRjaFdlYnBhY2tDb25maWcocHJvamVjdFBhdGgpO1xuXG4gICAgLy8gV2VicGFjayB2MlxuICAgIGNvbnN0IHdlYnBhY2tNb2R1bGVzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLm1vZHVsZXMnLCBbXSk7XG4gICAgY29uc3Qgd2VicGFja0FsaWFzZXMgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUuYWxpYXMnLCB7fSk7XG5cbiAgICAvLyBXZWJwYWNrIHYxXG4gICAgY29uc3Qgd2VicGFja1Jvb3QgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUucm9vdCcsICcnKTtcbiAgICBsZXQgbW9kdWxlU2VhcmNoUGF0aHMgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUubW9kdWxlc0RpcmVjdG9yaWVzJywgd2VicGFja01vZHVsZXMpO1xuICAgIG1vZHVsZVNlYXJjaFBhdGhzID0gbW9kdWxlU2VhcmNoUGF0aHMuZmlsdGVyKFxuICAgICAgKGl0ZW0pID0+IHZlbmRvcnMuaW5kZXhPZihpdGVtKSA9PT0gLTFcbiAgICApO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKG1vZHVsZVNlYXJjaFBhdGhzLmNvbmNhdCh3ZWJwYWNrUm9vdCkubWFwKFxuICAgICAgKHNlYXJjaFBhdGgpID0+IHRoaXMubG9va3VwTG9jYWwoXG4gICAgICAgIHByZWZpeCxcbiAgICAgICAgcGF0aC5pc0Fic29sdXRlKHNlYXJjaFBhdGgpID8gc2VhcmNoUGF0aCA6IHBhdGguam9pbihwcm9qZWN0UGF0aCwgc2VhcmNoUGF0aClcbiAgICAgIClcbiAgICApLmNvbmNhdChcbiAgICAgIHRoaXMubG9va3VwQWxpYXNlcyhwcmVmaXgsIHByb2plY3RQYXRoLCBPYmplY3Qua2V5cyh3ZWJwYWNrQWxpYXNlcykubWFwKGV4cCA9PiAoe1xuICAgICAgICBleHBvc2U6IGV4cCxcbiAgICAgICAgc3JjOiB3ZWJwYWNrQWxpYXNlc1tleHBdXG4gICAgICB9KSkpXG4gICAgKSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBsb29rdXBBbGlhc2VzKHByZWZpeCwgcHJvamVjdFBhdGgsIGFsaWFzZXMgPSB7fSkge1xuICAgIC8vIGRldGVybWluZSB0aGUgcmlnaHQgcHJlZml4IGZvciB0aGUgYWxpYXMgY29uZmlnXG4gICAgLy8gYHJlYWxQcmVmaXhgIGlzIHRoZSBwcmVmaXggd2Ugd2FudCB0byB1c2UgdG8gZmluZCB0aGUgcmlnaHQgZmlsZS9zdWdnZXN0aW9uc1xuICAgIC8vIHdoZW4gdGhlIHByZWZpeCBpcyBhIHN1YiBtb2R1bGUgKGVnLiBtb2R1bGUvc3ViZmlsZSksXG4gICAgLy8gYG1vZHVsZVByZWZpeGAgd2lsbCBiZSBcIm1vZHVsZVwiLCBhbmQgYHJlYWxQcmVmaXhgIHdpbGwgYmUgXCJzdWJmaWxlXCJcbiAgICBjb25zdCBwcmVmaXhTcGxpdCA9IHByZWZpeC5zcGxpdCgnLycpO1xuICAgIGNvbnN0IG1vZHVsZVByZWZpeCA9IHByZWZpeFNwbGl0WzBdO1xuICAgIGNvbnN0IHJlYWxQcmVmaXggPSBwcmVmaXhTcGxpdC5wb3AoKTtcbiAgICBjb25zdCBtb2R1bGVTZWFyY2hQYXRoID0gcHJlZml4U3BsaXQuam9pbignLycpO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGFsaWFzZXNcbiAgICAgIC5maWx0ZXIoYWxpYXMgPT4gYWxpYXMuZXhwb3NlLnN0YXJ0c1dpdGgobW9kdWxlUHJlZml4KSlcbiAgICAgIC5tYXAoXG4gICAgICAoYWxpYXMpID0+IHtcbiAgICAgICAgLy8gVGhlIHNlYXJjaCBwYXRoIGlzIHRoZSBzb3VyY2UgZGlyZWN0b3J5IHNwZWNpZmllZCBpbiAuYmFiZWxyY1xuICAgICAgICAvLyB0aGVuIHdlIGFwcGVuZCB0aGUgYG1vZHVsZVNlYXJjaFBhdGhgICh3aXRob3V0IHRoZSBhbGlhcylcbiAgICAgICAgLy8gdG8gZ2V0IHRoZSByZWFsIHNlYXJjaCBwYXRoXG4gICAgICAgIGNvbnN0IHNlYXJjaFBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBhbGlhcy5zcmMpLFxuICAgICAgICAgIG1vZHVsZVNlYXJjaFBhdGgucmVwbGFjZShhbGlhcy5leHBvc2UsICcnKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKHJlYWxQcmVmaXgsIHNlYXJjaFBhdGgpO1xuICAgICAgfVxuICAgICkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICApLnRoZW4oc3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgLy8gbWFrZSBzdXJlIHRoZSBzdWdnZXN0aW9ucyBhcmUgZnJvbSB0aGUgY29tcGF0aWJsZSBhbGlhc1xuICAgICAgaWYgKHByZWZpeCA9PT0gcmVhbFByZWZpeCAmJiBhbGlhc2VzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKHN1Z2cgPT5cbiAgICAgICAgICBhbGlhc2VzLmZpbmQoYSA9PiBhLmV4cG9zZSA9PT0gc3VnZy50ZXh0KVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICAgIH0pO1xuICB9XG5cbiAgZmV0Y2hXZWJwYWNrQ29uZmlnKHJvb3RQYXRoKSB7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZ0ZpbGVuYW1lID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy53ZWJwYWNrQ29uZmlnRmlsZW5hbWUnKTtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnUGF0aCA9IHBhdGguam9pbihyb290UGF0aCwgd2VicGFja0NvbmZpZ0ZpbGVuYW1lKTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVxdWlyZSh3ZWJwYWNrQ29uZmlnUGF0aCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfVxuXG4gIGxvb2t1cGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIocHJlZml4LCBhY3RpdmVQYW5lUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5nZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCk7XG5cbiAgICBpZiAoIXByb2plY3RQYXRoKSByZXR1cm47XG5cbiAgICBjb25zdCBzdWdnZXN0aW9uc1RvdGFsID0gW107XG4gICAgbGV0IGN1cnJlbnRQYXRoID0gcGF0aC5kaXJuYW1lKGFjdGl2ZVBhbmVQYXRoKTtcblxuICAgIHdoaWxlIChjdXJyZW50UGF0aC5zdGFydHNXaXRoKHByb2plY3RQYXRoKSkge1xuICAgICAgY29uc3QgY3VycmVudFN1Z2dlc3Rpb25zID0gZmluZEJhYmVsQ29uZmlnKGN1cnJlbnRQYXRoKS50aGVuKCh7Y29uZmlnfSkgPT4ge1xuICAgICAgICBpZiAoY29uZmlnICYmIEFycmF5LmlzQXJyYXkoY29uZmlnLnBsdWdpbnMpKSB7XG4gICAgICAgICAgLy8gR3JhYiB0aGUgdjEgKG1vZHVsZS1hbGlhcykgb3IgdjIgKG1vZHVsZS1yZXNvbHZlcikgcGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICBjb25zdCBwbHVnaW5Db25maWcgPSBjb25maWcucGx1Z2lucy5maW5kKHAgPT4gcFswXSA9PT0gJ21vZHVsZS1hbGlhcycgfHwgcFswXSA9PT0gJ2JhYmVsLXBsdWdpbi1tb2R1bGUtYWxpYXMnKSB8fFxuICAgICAgICAgICAgY29uZmlnLnBsdWdpbnMuZmluZChwID0+IHBbMF0gPT09ICdtb2R1bGUtcmVzb2x2ZXInIHx8IHBbMF0gPT09ICdiYWJlbC1wbHVnaW4tbW9kdWxlLXJlc29sdmVyJyk7XG4gICAgICAgICAgaWYgKCFwbHVnaW5Db25maWcpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBPbmx5IHYyIG9mIHRoZSBwbHVnaW4gc3VwcG9ydHMgY3VzdG9tIHJvb3QgZGlyZWN0b3JpZXNcbiAgICAgICAgICBsZXQgcm9vdFByb21pc2VzID0gW107XG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBsdWdpbkNvbmZpZ1sxXSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3REaXJzID0gcGx1Z2luQ29uZmlnWzFdLnJvb3QgfHwgW107XG4gICAgICAgICAgICByb290UHJvbWlzZXMgPSByb290UHJvbWlzZXMuY29uY2F0KHJvb3REaXJzLm1hcChyID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgcm9vdERpclBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHIpO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChgLi8ke3ByZWZpeH1gLCByb290RGlyUGF0aCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gZGV0ZXJtaW5lIHRoZSByaWdodCBwcmVmaXggZm9yIHRoZSBhbGlhcyBjb25maWdcbiAgICAgICAgICAvLyBgcmVhbFByZWZpeGAgaXMgdGhlIHByZWZpeCB3ZSB3YW50IHRvIHVzZSB0byBmaW5kIHRoZSByaWdodCBmaWxlL3N1Z2dlc3Rpb25zXG4gICAgICAgICAgLy8gd2hlbiB0aGUgcHJlZml4IGlzIGEgc3ViIG1vZHVsZSAoZWcuIG1vZHVsZS9zdWJmaWxlKSxcbiAgICAgICAgICAvLyBgbW9kdWxlUHJlZml4YCB3aWxsIGJlIFwibW9kdWxlXCIsIGFuZCBgcmVhbFByZWZpeGAgd2lsbCBiZSBcInN1YmZpbGVcIlxuICAgICAgICAgIGNvbnN0IHByZWZpeFNwbGl0ID0gcHJlZml4LnNwbGl0KCcvJyk7XG4gICAgICAgICAgY29uc3QgbW9kdWxlUHJlZml4ID0gcHJlZml4U3BsaXRbMF07XG4gICAgICAgICAgY29uc3QgcmVhbFByZWZpeCA9IHByZWZpeFNwbGl0LnBvcCgpO1xuICAgICAgICAgIGNvbnN0IG1vZHVsZVNlYXJjaFBhdGggPSBwcmVmaXhTcGxpdC5qb2luKCcvJyk7XG5cbiAgICAgICAgICAvLyBnZXQgdGhlIGFsaWFzIGNvbmZpZ3MgZm9yIHRoZSBzcGVjaWZpYyBtb2R1bGVcbiAgICAgICAgICBjb25zdCBhbGlhc0NvbmZpZyA9IEFycmF5LmlzQXJyYXkocGx1Z2luQ29uZmlnWzFdKVxuICAgICAgICAgICAgLy8gdjEgb2YgdGhlIHBsdWdpbiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgPyBwbHVnaW5Db25maWdbMV0uZmlsdGVyKGFsaWFzID0+IGFsaWFzLmV4cG9zZS5zdGFydHNXaXRoKG1vZHVsZVByZWZpeCkpXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgaXQncyB2MiAoYW4gb2JqZWN0KVxuICAgICAgICAgICAgOiBPYmplY3Qua2V5cyhwbHVnaW5Db25maWdbMV0uYWxpYXMgfHwge30pXG4gICAgICAgICAgICAgIC5maWx0ZXIoZXhwb3NlID0+IGV4cG9zZS5zdGFydHNXaXRoKG1vZHVsZVByZWZpeCkpXG4gICAgICAgICAgICAgIC5tYXAoZXhwID0+ICh7XG4gICAgICAgICAgICAgICAgZXhwb3NlOiBleHAsXG4gICAgICAgICAgICAgICAgc3JjOiBwbHVnaW5Db25maWdbMV0uYWxpYXNbZXhwXVxuICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocm9vdFByb21pc2VzLmNvbmNhdChhbGlhc0NvbmZpZy5tYXAoXG4gICAgICAgICAgICAoYWxpYXMpID0+IHtcbiAgICAgICAgICAgICAgLy8gVGhlIHNlYXJjaCBwYXRoIGlzIHRoZSBzb3VyY2UgZGlyZWN0b3J5IHNwZWNpZmllZCBpbiAuYmFiZWxyY1xuICAgICAgICAgICAgICAvLyB0aGVuIHdlIGFwcGVuZCB0aGUgYG1vZHVsZVNlYXJjaFBhdGhgICh3aXRob3V0IHRoZSBhbGlhcylcbiAgICAgICAgICAgICAgLy8gdG8gZ2V0IHRoZSByZWFsIHNlYXJjaCBwYXRoXG4gICAgICAgICAgICAgIGNvbnN0IHNlYXJjaFBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBhbGlhcy5zcmMpLFxuICAgICAgICAgICAgICAgIG1vZHVsZVNlYXJjaFBhdGgucmVwbGFjZShhbGlhcy5leHBvc2UsICcnKVxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKHJlYWxQcmVmaXgsIHNlYXJjaFBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICkpKS50aGVuKFxuICAgICAgICAgICAgKHN1Z2dlc3Rpb25zKSA9PiBbXS5jb25jYXQoLi4uc3VnZ2VzdGlvbnMpXG4gICAgICAgICAgKS50aGVuKHN1Z2dlc3Rpb25zID0+IHtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgc3VnZ2VzdGlvbnMgYXJlIGZyb20gdGhlIGNvbXBhdGlibGUgYWxpYXNcbiAgICAgICAgICAgIGlmIChwcmVmaXggPT09IHJlYWxQcmVmaXggJiYgYWxpYXNDb25maWcubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdWdnZXN0aW9ucy5maWx0ZXIoc3VnZyA9PlxuICAgICAgICAgICAgICAgIGFsaWFzQ29uZmlnLmZpbmQoYSA9PiBhLmV4cG9zZSA9PT0gc3VnZy50ZXh0KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfSk7XG5cbiAgICAgIHN1Z2dlc3Rpb25zVG90YWwucHVzaChjdXJyZW50U3VnZ2VzdGlvbnMpO1xuICAgICAgY3VycmVudFBhdGggPSBwYXRoLnJlc29sdmUoY3VycmVudFBhdGgsICcuLi8nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZVxuICAgICAgLmFsbChzdWdnZXN0aW9uc1RvdGFsKVxuICAgICAgLnRoZW4obGlzdCA9PiBsaXN0LnJlZHVjZSgoYWNjLCBzdWdnZXN0aW9ucykgPT4gYWNjLmNvbmNhdChzdWdnZXN0aW9ucyksIFtdKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV0aW9uUHJvdmlkZXI7XG4iXX0=