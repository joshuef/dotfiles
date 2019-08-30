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

var SELECTOR = ['.source.js', 'javascript', '.source.coffee'];
var SELECTOR_DISABLE = ['.source.js .comment', 'javascript comment', '.source.js .keyword', 'javascript keyword'];

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvc3JjL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBRVosSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pELElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekMsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDcEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JELElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztlQUNDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQzs7SUFBaEcsbUJBQW1CLFlBQW5CLG1CQUFtQjtJQUFFLGVBQWUsWUFBZixlQUFlO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBRXhELElBQU0sV0FBVyxHQUFHLHlIQUF5SCxDQUFDOztBQUU5SSxJQUFNLFFBQVEsR0FBRyxDQUNmLFlBQVksRUFDWixZQUFZLEVBQ1osZ0JBQWdCLENBQ2pCLENBQUM7QUFDRixJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLHFCQUFxQixFQUNyQixvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLG9CQUFvQixDQUNyQixDQUFDOztJQUVJLGtCQUFrQjtBQUNYLFdBRFAsa0JBQWtCLEdBQ1I7MEJBRFYsa0JBQWtCOztBQUVwQixR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QUMsZ0JBQWdCLENBQUMsQ0FDckIsSUFBSSxDQUFDLFVBQUEsSUFBSTtlQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsV0FBVztpQkFBSyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztTQUFBLEVBQUUsRUFBRSxDQUFDO09BQUEsQ0FBQyxDQUFDO0tBQ2pGOzs7U0FqVUcsa0JBQWtCOzs7QUFvVXhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtbW9kdWxlcy9zcmMvY29tcGxldGlvbi1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmNvbnN0IHJlYWRkaXIgPSBQcm9taXNlLnByb21pc2lmeShyZXF1aXJlKCdmcycpLnJlYWRkaXIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZ1enphbGRyaW4gPSByZXF1aXJlKCdmdXp6YWxkcmluJyk7XG5jb25zdCBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCdsb2Rhc2guZXNjYXBlcmVnZXhwJyk7XG5jb25zdCBnZXQgPSByZXF1aXJlKCdsb2Rhc2guZ2V0Jyk7XG5jb25zdCBmaW5kQmFiZWxDb25maWcgPSByZXF1aXJlKCdmaW5kLWJhYmVsLWNvbmZpZycpO1xuY29uc3QgaW50ZXJuYWxNb2R1bGVzID0gcmVxdWlyZSgnLi91dGlscy9pbnRlcm5hbC1tb2R1bGVzJyk7XG5jb25zdCB7IGdldFJlYWxFeHBvcnRQcmVmaXgsIGdldEltcG9ydE1vZHVsZSwgZ2V0RXhwb3J0cyB9ID0gcmVxdWlyZSgnLi91dGlscy9leHBvcnQtbW9kdWxlLWNvbXBsZXRpb24nKTtcblxuY29uc3QgTElORV9SRUdFWFAgPSAvKD86XnxcXHMpcmVxdWlyZVxcKFsnXCJdfF5pbXBvcnRcXHMuK2Zyb21cXHMrW1wiJ118XmltcG9ydFxccytbXCInXXxleHBvcnRcXHMrKD86XFwqfHtbYS16QS1aMC05XyQsXFxzXSt9KStcXHMrZnJvbXx9XFxzKmZyb21cXHMqWydcIl0vO1xuXG5jb25zdCBTRUxFQ1RPUiA9IFtcbiAgJy5zb3VyY2UuanMnLFxuICAnamF2YXNjcmlwdCcsXG4gICcuc291cmNlLmNvZmZlZSdcbl07XG5jb25zdCBTRUxFQ1RPUl9ESVNBQkxFID0gW1xuICAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICdqYXZhc2NyaXB0IGNvbW1lbnQnLFxuICAnLnNvdXJjZS5qcyAua2V5d29yZCcsXG4gICdqYXZhc2NyaXB0IGtleXdvcmQnXG5dO1xuXG5jbGFzcyBDb21wbGV0aW9uUHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gU0VMRUNUT1Iuam9pbignLCAnKTtcbiAgICB0aGlzLmRpc2FibGVGb3JTZWxlY3RvciA9IFNFTEVDVE9SX0RJU0FCTEUuam9pbignLCAnKTtcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXh9KSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5idWZmZXIubGluZUZvclJvdyhidWZmZXJQb3NpdGlvbi5yb3cpO1xuICAgIGlmICghTElORV9SRUdFWFAudGVzdChsaW5lKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZVBhbmVGaWxlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKS5idWZmZXIuZmlsZTtcbiAgICAvLyBpbiBjYXNlIHVzZXIgZWRpdGluZyB1bnNhdmVkIGZpbGVcbiAgICBpZiAoIWFjdGl2ZVBhbmVGaWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcHJlZml4TGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG4gICAgY29uc3QgcmVhbEltcG9ydFByZWZpeCA9IHRoaXMuZ2V0UmVhbEltcG9ydFByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChyZWFsSW1wb3J0UHJlZml4ICE9PSBmYWxzZSkge1xuICAgICAgaWYgKHJlYWxJbXBvcnRQcmVmaXhbMF0gPT09ICcuJykge1xuICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsSW1wb3J0UHJlZml4LCBwYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzID0gdmVuZG9ycy5tYXAoXG4gICAgICAgICh2ZW5kb3IpID0+IHRoaXMubG9va3VwR2xvYmFsKHJlYWxJbXBvcnRQcmVmaXgsIGFjdGl2ZVBhbmVGaWxlLnBhdGgsIHZlbmRvcilcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHdlYnBhY2sgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLndlYnBhY2snKTtcbiAgICAgIGlmICh3ZWJwYWNrKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb29rdXBXZWJwYWNrKHJlYWxJbXBvcnRQcmVmaXgsIGFjdGl2ZVBhbmVGaWxlLnBhdGgpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlciA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMuYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcicpO1xuICAgICAgaWYgKGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvb2t1cGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIocmVhbEltcG9ydFByZWZpeCwgYWN0aXZlUGFuZUZpbGUucGF0aCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oXG4gICAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCByZWFsRXhwb3J0UHJlZml4ID0gZ2V0UmVhbEV4cG9ydFByZWZpeChwcmVmaXgsIHByZWZpeExpbmUpO1xuICAgIGlmIChyZWFsRXhwb3J0UHJlZml4ICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgaW1wb3J0TW9kdWxlID0gZ2V0SW1wb3J0TW9kdWxlKGxpbmUpO1xuICAgICAgaWYgKGltcG9ydE1vZHVsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ2V0RXhwb3J0cyhhY3RpdmVQYW5lRmlsZS5wYXRoLCByZWFsRXhwb3J0UHJlZml4LCBpbXBvcnRNb2R1bGUpXG4gICAgICAudGhlbigoc3VnZ2VzdGlvbnMpID0+IHN1Z2dlc3Rpb25zLm1hcCgoZXhwb3J0bmFtZSkgPT4gKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGV4dDogZXhwb3J0bmFtZSxcbiAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IGV4cG9ydG5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBnZXRSZWFsSW1wb3J0UHJlZml4KHByZWZpeCwgbGluZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjanNSZWFsUHJlZml4UmVnRXhwID0gbmV3IFJlZ0V4cChgcmVxdWlyZVxcXFwoWydcIl0oKD86Lis/KSoke2VzY2FwZVJlZ0V4cChwcmVmaXgpfSlgKTtcbiAgICAgIGNvbnN0IGVzNlJlYWxQcmVmaXhSZWdFeHAgPSBuZXcgUmVnRXhwKGAoPzpmcm9tfGltcG9ydClcXFxccytbJ1wiXSgoPzouKz8pKiR7ZXNjYXBlUmVnRXhwKHByZWZpeCl9KWApO1xuICAgICAgY29uc3QgcmVhbFByZWZpeE1hdGhlcyA9IGNqc1JlYWxQcmVmaXhSZWdFeHAuZXhlYyhsaW5lKSB8fCBlczZSZWFsUHJlZml4UmVnRXhwLmV4ZWMobGluZSk7XG4gICAgICBpZiAoIXJlYWxQcmVmaXhNYXRoZXMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVhbFByZWZpeE1hdGhlc1sxXTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZmlsdGVyU3VnZ2VzdGlvbnMocHJlZml4LCBzdWdnZXN0aW9ucykge1xuICAgIHJldHVybiBmdXp6YWxkcmluLmZpbHRlcihzdWdnZXN0aW9ucywgcHJlZml4LCB7XG4gICAgICBrZXk6ICd0ZXh0J1xuICAgIH0pO1xuICB9XG5cbiAgbG9va3VwTG9jYWwocHJlZml4LCBkaXJuYW1lKSB7XG4gICAgbGV0IGZpbHRlclByZWZpeCA9IHByZWZpeC5yZXBsYWNlKHBhdGguZGlybmFtZShwcmVmaXgpLCAnJykucmVwbGFjZSgnLycsICcnKTtcbiAgICBpZiAocHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXSA9PT0gJy8nKSB7XG4gICAgICBmaWx0ZXJQcmVmaXggPSAnJztcbiAgICB9XG5cbiAgICBjb25zdCBpbmNsdWRlRXh0ZW5zaW9uID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy5pbmNsdWRlRXh0ZW5zaW9uJyk7XG4gICAgbGV0IGxvb2t1cERpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlybmFtZSwgcHJlZml4KTtcbiAgICBpZiAoZmlsdGVyUHJlZml4KSB7XG4gICAgICBsb29rdXBEaXJuYW1lID0gbG9va3VwRGlybmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoYCR7ZXNjYXBlUmVnRXhwKGZpbHRlclByZWZpeCl9JGApLCAnJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlYWRkaXIobG9va3VwRGlybmFtZSkuY2F0Y2goKGUpID0+IHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9KS5maWx0ZXIoXG4gICAgICAoZmlsZW5hbWUpID0+IGZpbGVuYW1lWzBdICE9PSAnLidcbiAgICApLm1hcCgocGF0aG5hbWUpID0+ICh7XG4gICAgICB0ZXh0OiBpbmNsdWRlRXh0ZW5zaW9uID8gcGF0aG5hbWUgOiB0aGlzLm5vcm1hbGl6ZUxvY2FsKHBhdGhuYW1lKSxcbiAgICAgIGRpc3BsYXlUZXh0OiBwYXRobmFtZSxcbiAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgfSkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMoZmlsdGVyUHJlZml4LCBzdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbm9ybWFsaXplTG9jYWwoZmlsZW5hbWUpIHtcbiAgICByZXR1cm4gZmlsZW5hbWUucmVwbGFjZSgvXFwuKGpzfGVzNnxqc3h8Y29mZmVlfHRzfHRzeCkkLywgJycpO1xuICB9XG5cbiAgZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBbcHJvamVjdFBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICByZXR1cm4gcHJvamVjdFBhdGg7XG4gIH1cblxuICBsb29rdXBHbG9iYWwocHJlZml4LCBhY3RpdmVQYW5lUGF0aCwgdmVuZG9yID0gJ25vZGVfbW9kdWxlcycpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIGlmICghcHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIGNvbnN0IHZlbmRvclBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHZlbmRvcik7XG4gICAgaWYgKHByZWZpeC5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChgLi8ke3ByZWZpeH1gLCB2ZW5kb3JQYXRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhZGRpcih2ZW5kb3JQYXRoKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKGUuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0pLnRoZW4oXG4gICAgICAobGlicykgPT4gWy4uLmludGVybmFsTW9kdWxlcywgLi4ubGlic11cbiAgICApLm1hcCgobGliKSA9PiAoe1xuICAgICAgdGV4dDogbGliLFxuICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeCxcbiAgICAgIHR5cGU6ICdpbXBvcnQnXG4gICAgfSkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJlZml4LCBzdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbG9va3VwV2VicGFjayhwcmVmaXgsIGFjdGl2ZVBhbmVQYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSB0aGlzLmdldFByb2plY3RQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICBpZiAoIXByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZyA9IHRoaXMuZmV0Y2hXZWJwYWNrQ29uZmlnKHByb2plY3RQYXRoKTtcblxuICAgIC8vIFdlYnBhY2sgdjJcbiAgICBjb25zdCB3ZWJwYWNrTW9kdWxlcyA9IGdldCh3ZWJwYWNrQ29uZmlnLCAncmVzb2x2ZS5tb2R1bGVzJywgW10pO1xuICAgIGNvbnN0IHdlYnBhY2tBbGlhc2VzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLmFsaWFzJywge30pO1xuXG4gICAgLy8gV2VicGFjayB2MVxuICAgIGNvbnN0IHdlYnBhY2tSb290ID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLnJvb3QnLCAnJyk7XG4gICAgbGV0IG1vZHVsZVNlYXJjaFBhdGhzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLm1vZHVsZXNEaXJlY3RvcmllcycsIHdlYnBhY2tNb2R1bGVzKTtcbiAgICBtb2R1bGVTZWFyY2hQYXRocyA9IG1vZHVsZVNlYXJjaFBhdGhzLmZpbHRlcihcbiAgICAgIChpdGVtKSA9PiB2ZW5kb3JzLmluZGV4T2YoaXRlbSkgPT09IC0xXG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChtb2R1bGVTZWFyY2hQYXRocy5jb25jYXQod2VicGFja1Jvb3QpLm1hcChcbiAgICAgIChzZWFyY2hQYXRoKSA9PiB0aGlzLmxvb2t1cExvY2FsKFxuICAgICAgICBwcmVmaXgsXG4gICAgICAgIHBhdGguaXNBYnNvbHV0ZShzZWFyY2hQYXRoKSA/IHNlYXJjaFBhdGggOiBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHNlYXJjaFBhdGgpXG4gICAgICApXG4gICAgKS5jb25jYXQoXG4gICAgICB0aGlzLmxvb2t1cEFsaWFzZXMocHJlZml4LCBwcm9qZWN0UGF0aCwgT2JqZWN0LmtleXMod2VicGFja0FsaWFzZXMpLm1hcChleHAgPT4gKHtcbiAgICAgICAgZXhwb3NlOiBleHAsXG4gICAgICAgIHNyYzogd2VicGFja0FsaWFzZXNbZXhwXVxuICAgICAgfSkpKVxuICAgICkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbG9va3VwQWxpYXNlcyhwcmVmaXgsIHByb2plY3RQYXRoLCBhbGlhc2VzID0ge30pIHtcbiAgICAvLyBkZXRlcm1pbmUgdGhlIHJpZ2h0IHByZWZpeCBmb3IgdGhlIGFsaWFzIGNvbmZpZ1xuICAgIC8vIGByZWFsUHJlZml4YCBpcyB0aGUgcHJlZml4IHdlIHdhbnQgdG8gdXNlIHRvIGZpbmQgdGhlIHJpZ2h0IGZpbGUvc3VnZ2VzdGlvbnNcbiAgICAvLyB3aGVuIHRoZSBwcmVmaXggaXMgYSBzdWIgbW9kdWxlIChlZy4gbW9kdWxlL3N1YmZpbGUpLFxuICAgIC8vIGBtb2R1bGVQcmVmaXhgIHdpbGwgYmUgXCJtb2R1bGVcIiwgYW5kIGByZWFsUHJlZml4YCB3aWxsIGJlIFwic3ViZmlsZVwiXG4gICAgY29uc3QgcHJlZml4U3BsaXQgPSBwcmVmaXguc3BsaXQoJy8nKTtcbiAgICBjb25zdCBtb2R1bGVQcmVmaXggPSBwcmVmaXhTcGxpdFswXTtcbiAgICBjb25zdCByZWFsUHJlZml4ID0gcHJlZml4U3BsaXQucG9wKCk7XG4gICAgY29uc3QgbW9kdWxlU2VhcmNoUGF0aCA9IHByZWZpeFNwbGl0LmpvaW4oJy8nKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChhbGlhc2VzXG4gICAgICAuZmlsdGVyKGFsaWFzID0+IGFsaWFzLmV4cG9zZS5zdGFydHNXaXRoKG1vZHVsZVByZWZpeCkpXG4gICAgICAubWFwKFxuICAgICAgKGFsaWFzKSA9PiB7XG4gICAgICAgIC8vIFRoZSBzZWFyY2ggcGF0aCBpcyB0aGUgc291cmNlIGRpcmVjdG9yeSBzcGVjaWZpZWQgaW4gLmJhYmVscmNcbiAgICAgICAgLy8gdGhlbiB3ZSBhcHBlbmQgdGhlIGBtb2R1bGVTZWFyY2hQYXRoYCAod2l0aG91dCB0aGUgYWxpYXMpXG4gICAgICAgIC8vIHRvIGdldCB0aGUgcmVhbCBzZWFyY2ggcGF0aFxuICAgICAgICBjb25zdCBzZWFyY2hQYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgIHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgYWxpYXMuc3JjKSxcbiAgICAgICAgICBtb2R1bGVTZWFyY2hQYXRoLnJlcGxhY2UoYWxpYXMuZXhwb3NlLCAnJylcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsUHJlZml4LCBzZWFyY2hQYXRoKTtcbiAgICAgIH1cbiAgICApKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiBbXS5jb25jYXQoLi4uc3VnZ2VzdGlvbnMpXG4gICAgKS50aGVuKHN1Z2dlc3Rpb25zID0+IHtcbiAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgc3VnZ2VzdGlvbnMgYXJlIGZyb20gdGhlIGNvbXBhdGlibGUgYWxpYXNcbiAgICAgIGlmIChwcmVmaXggPT09IHJlYWxQcmVmaXggJiYgYWxpYXNlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zLmZpbHRlcihzdWdnID0+XG4gICAgICAgICAgYWxpYXNlcy5maW5kKGEgPT4gYS5leHBvc2UgPT09IHN1Z2cudGV4dClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICB9KTtcbiAgfVxuXG4gIGZldGNoV2VicGFja0NvbmZpZyhyb290UGF0aCkge1xuICAgIGNvbnN0IHdlYnBhY2tDb25maWdGaWxlbmFtZSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMud2VicGFja0NvbmZpZ0ZpbGVuYW1lJyk7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZ1BhdGggPSBwYXRoLmpvaW4ocm9vdFBhdGgsIHdlYnBhY2tDb25maWdGaWxlbmFtZSk7XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHJlcXVpcmUod2VicGFja0NvbmZpZ1BhdGgpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH1cblxuICBsb29rdXBiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyKHByZWZpeCwgYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuXG4gICAgaWYgKCFwcm9qZWN0UGF0aCkgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3VnZ2VzdGlvbnNUb3RhbCA9IFtdO1xuICAgIGxldCBjdXJyZW50UGF0aCA9IHBhdGguZGlybmFtZShhY3RpdmVQYW5lUGF0aCk7XG5cbiAgICB3aGlsZSAoY3VycmVudFBhdGguc3RhcnRzV2l0aChwcm9qZWN0UGF0aCkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTdWdnZXN0aW9ucyA9IGZpbmRCYWJlbENvbmZpZyhjdXJyZW50UGF0aCkudGhlbigoe2NvbmZpZ30pID0+IHtcbiAgICAgICAgaWYgKGNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGNvbmZpZy5wbHVnaW5zKSkge1xuICAgICAgICAgIC8vIEdyYWIgdGhlIHYxIChtb2R1bGUtYWxpYXMpIG9yIHYyIChtb2R1bGUtcmVzb2x2ZXIpIHBsdWdpbiBjb25maWd1cmF0aW9uXG4gICAgICAgICAgY29uc3QgcGx1Z2luQ29uZmlnID0gY29uZmlnLnBsdWdpbnMuZmluZChwID0+IHBbMF0gPT09ICdtb2R1bGUtYWxpYXMnIHx8IHBbMF0gPT09ICdiYWJlbC1wbHVnaW4tbW9kdWxlLWFsaWFzJykgfHxcbiAgICAgICAgICAgIGNvbmZpZy5wbHVnaW5zLmZpbmQocCA9PiBwWzBdID09PSAnbW9kdWxlLXJlc29sdmVyJyB8fCBwWzBdID09PSAnYmFiZWwtcGx1Z2luLW1vZHVsZS1yZXNvbHZlcicpO1xuICAgICAgICAgIGlmICghcGx1Z2luQ29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT25seSB2MiBvZiB0aGUgcGx1Z2luIHN1cHBvcnRzIGN1c3RvbSByb290IGRpcmVjdG9yaWVzXG4gICAgICAgICAgbGV0IHJvb3RQcm9taXNlcyA9IFtdO1xuICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwbHVnaW5Db25maWdbMV0pKSB7XG4gICAgICAgICAgICBjb25zdCByb290RGlycyA9IHBsdWdpbkNvbmZpZ1sxXS5yb290IHx8IFtdO1xuICAgICAgICAgICAgcm9vdFByb21pc2VzID0gcm9vdFByb21pc2VzLmNvbmNhdChyb290RGlycy5tYXAociA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJvb3REaXJQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCByKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwoYC4vJHtwcmVmaXh9YCwgcm9vdERpclBhdGgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGRldGVybWluZSB0aGUgcmlnaHQgcHJlZml4IGZvciB0aGUgYWxpYXMgY29uZmlnXG4gICAgICAgICAgLy8gYHJlYWxQcmVmaXhgIGlzIHRoZSBwcmVmaXggd2Ugd2FudCB0byB1c2UgdG8gZmluZCB0aGUgcmlnaHQgZmlsZS9zdWdnZXN0aW9uc1xuICAgICAgICAgIC8vIHdoZW4gdGhlIHByZWZpeCBpcyBhIHN1YiBtb2R1bGUgKGVnLiBtb2R1bGUvc3ViZmlsZSksXG4gICAgICAgICAgLy8gYG1vZHVsZVByZWZpeGAgd2lsbCBiZSBcIm1vZHVsZVwiLCBhbmQgYHJlYWxQcmVmaXhgIHdpbGwgYmUgXCJzdWJmaWxlXCJcbiAgICAgICAgICBjb25zdCBwcmVmaXhTcGxpdCA9IHByZWZpeC5zcGxpdCgnLycpO1xuICAgICAgICAgIGNvbnN0IG1vZHVsZVByZWZpeCA9IHByZWZpeFNwbGl0WzBdO1xuICAgICAgICAgIGNvbnN0IHJlYWxQcmVmaXggPSBwcmVmaXhTcGxpdC5wb3AoKTtcbiAgICAgICAgICBjb25zdCBtb2R1bGVTZWFyY2hQYXRoID0gcHJlZml4U3BsaXQuam9pbignLycpO1xuXG4gICAgICAgICAgLy8gZ2V0IHRoZSBhbGlhcyBjb25maWdzIGZvciB0aGUgc3BlY2lmaWMgbW9kdWxlXG4gICAgICAgICAgY29uc3QgYWxpYXNDb25maWcgPSBBcnJheS5pc0FycmF5KHBsdWdpbkNvbmZpZ1sxXSlcbiAgICAgICAgICAgIC8vIHYxIG9mIHRoZSBwbHVnaW4gaXMgYW4gYXJyYXlcbiAgICAgICAgICAgID8gcGx1Z2luQ29uZmlnWzFdLmZpbHRlcihhbGlhcyA9PiBhbGlhcy5leHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGl0J3MgdjIgKGFuIG9iamVjdClcbiAgICAgICAgICAgIDogT2JqZWN0LmtleXMocGx1Z2luQ29uZmlnWzFdLmFsaWFzIHx8IHt9KVxuICAgICAgICAgICAgICAuZmlsdGVyKGV4cG9zZSA9PiBleHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgICAubWFwKGV4cCA9PiAoe1xuICAgICAgICAgICAgICAgIGV4cG9zZTogZXhwLFxuICAgICAgICAgICAgICAgIHNyYzogcGx1Z2luQ29uZmlnWzFdLmFsaWFzW2V4cF1cbiAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvb3RQcm9taXNlcy5jb25jYXQoYWxpYXNDb25maWcubWFwKFxuICAgICAgICAgICAgKGFsaWFzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFRoZSBzZWFyY2ggcGF0aCBpcyB0aGUgc291cmNlIGRpcmVjdG9yeSBzcGVjaWZpZWQgaW4gLmJhYmVscmNcbiAgICAgICAgICAgICAgLy8gdGhlbiB3ZSBhcHBlbmQgdGhlIGBtb2R1bGVTZWFyY2hQYXRoYCAod2l0aG91dCB0aGUgYWxpYXMpXG4gICAgICAgICAgICAgIC8vIHRvIGdldCB0aGUgcmVhbCBzZWFyY2ggcGF0aFxuICAgICAgICAgICAgICBjb25zdCBzZWFyY2hQYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgYWxpYXMuc3JjKSxcbiAgICAgICAgICAgICAgICBtb2R1bGVTZWFyY2hQYXRoLnJlcGxhY2UoYWxpYXMuZXhwb3NlLCAnJylcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsUHJlZml4LCBzZWFyY2hQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApKSkudGhlbihcbiAgICAgICAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICAgICAgICkudGhlbihzdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHN1Z2dlc3Rpb25zIGFyZSBmcm9tIHRoZSBjb21wYXRpYmxlIGFsaWFzXG4gICAgICAgICAgICBpZiAocHJlZml4ID09PSByZWFsUHJlZml4ICYmIGFsaWFzQ29uZmlnLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKHN1Z2cgPT5cbiAgICAgICAgICAgICAgICBhbGlhc0NvbmZpZy5maW5kKGEgPT4gYS5leHBvc2UgPT09IHN1Z2cudGV4dClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0pO1xuXG4gICAgICBzdWdnZXN0aW9uc1RvdGFsLnB1c2goY3VycmVudFN1Z2dlc3Rpb25zKTtcbiAgICAgIGN1cnJlbnRQYXRoID0gcGF0aC5yZXNvbHZlKGN1cnJlbnRQYXRoLCAnLi4vJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2VcbiAgICAgIC5hbGwoc3VnZ2VzdGlvbnNUb3RhbClcbiAgICAgIC50aGVuKGxpc3QgPT4gbGlzdC5yZWR1Y2UoKGFjYywgc3VnZ2VzdGlvbnMpID0+IGFjYy5jb25jYXQoc3VnZ2VzdGlvbnMpLCBbXSkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxldGlvblByb3ZpZGVyO1xuIl19