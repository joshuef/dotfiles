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

var LINE_REGEXP = /require|import|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/;
var SELECTOR = ['.source.js .string.quoted',

// for babel-language plugin
'.source.js .punctuation.definition.string.end', '.source.js .punctuation.definition.string.begin', '.source.ts .string.quoted', '.source.tsx .string.quoted', '.source.coffee .string.quoted'];
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

      var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      if (!LINE_REGEXP.test(line)) {
        return [];
      }

      var realPrefix = this.getRealPrefix(prefix, line);
      if (!realPrefix) {
        return [];
      }

      if (realPrefix[0] === '.') {
        return this.lookupLocal(realPrefix, path.dirname(editor.getPath()));
      }

      var vendors = atom.config.get('autocomplete-modules.vendors');
      var activePaneFile = atom.workspace.getActivePaneItem().buffer.file;
      // in case user editing unsaved file
      if (!activePaneFile) {
        return [];
      }

      var promises = vendors.map(function (vendor) {
        return _this.lookupGlobal(realPrefix, activePaneFile.path, vendor);
      });

      var webpack = atom.config.get('autocomplete-modules.webpack');
      if (webpack) {
        promises.push(this.lookupWebpack(realPrefix, activePaneFile.path));
      }

      var babelPluginModuleResolver = atom.config.get('autocomplete-modules.babelPluginModuleResolver');
      if (babelPluginModuleResolver) {
        promises.push(this.lookupbabelPluginModuleResolver(realPrefix, activePaneFile.path));
      }

      return Promise.all(promises).then(function (suggestions) {
        var _ref2;

        return (_ref2 = []).concat.apply(_ref2, _toConsumableArray(suggestions));
      });
    }
  }, {
    key: 'getRealPrefix',
    value: function getRealPrefix(prefix, line) {
      try {
        var realPrefixRegExp = new RegExp('[\'"]((?:.+?)*' + escapeRegExp(prefix) + ')');
        var realPrefixMathes = realPrefixRegExp.exec(line);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvc3JjL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBRVosSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pELElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekMsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDcEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JELElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztBQUU1RCxJQUFNLFdBQVcsR0FBRyw0RUFBNEUsQ0FBQztBQUNqRyxJQUFNLFFBQVEsR0FBRyxDQUNmLDJCQUEyQjs7O0FBRzNCLCtDQUErQyxFQUMvQyxpREFBaUQsRUFFakQsMkJBQTJCLEVBQzNCLDRCQUE0QixFQUM1QiwrQkFBK0IsQ0FDaEMsQ0FBQztBQUNGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIscUJBQXFCLEVBQ3JCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIscUJBQXFCLEVBQ3JCLHNCQUFzQixFQUN0QixzQkFBc0IsQ0FDdkIsQ0FBQzs7SUFFSSxrQkFBa0I7QUFDWCxXQURQLGtCQUFrQixHQUNSOzBCQURWLGtCQUFrQjs7QUFFcEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFR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V0FBVzs7O3lCQUFLLFNBQUEsRUFBRSxFQUFDLE1BQU0sTUFBQSwyQkFBSSxXQUFXLEVBQUM7aUJBQUEsQ0FDM0MsQ0FBQyxJQUFJLENBQUMsVUFBQSxXQUFXLEVBQUk7O0FBRXBCLHNCQUFJLE1BQU0sS0FBSyxVQUFVLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTtBQUMvQywyQkFBTyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQUEsSUFBSTs2QkFDNUIsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7K0JBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsSUFBSTt1QkFBQSxDQUFDO3FCQUFBLENBQzlDLENBQUM7bUJBQ0g7QUFDRCx5QkFBTyxXQUFXLENBQUM7aUJBQ3BCLENBQUM7Z0JBQUM7Ozs7V0FDSjs7QUFFRCxpQkFBTyxFQUFFLENBQUM7U0FDWCxDQUFDLENBQUM7T0FDSjtLQUNGOzs7U0FyUEcsa0JBQWtCOzs7QUF3UHhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtbW9kdWxlcy9zcmMvY29tcGxldGlvbi1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmNvbnN0IHJlYWRkaXIgPSBQcm9taXNlLnByb21pc2lmeShyZXF1aXJlKCdmcycpLnJlYWRkaXIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZ1enphbGRyaW4gPSByZXF1aXJlKCdmdXp6YWxkcmluJyk7XG5jb25zdCBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCdsb2Rhc2guZXNjYXBlcmVnZXhwJyk7XG5jb25zdCBnZXQgPSByZXF1aXJlKCdsb2Rhc2guZ2V0Jyk7XG5jb25zdCBmaW5kQmFiZWxDb25maWcgPSByZXF1aXJlKCdmaW5kLWJhYmVsLWNvbmZpZycpO1xuY29uc3QgaW50ZXJuYWxNb2R1bGVzID0gcmVxdWlyZSgnLi91dGlscy9pbnRlcm5hbC1tb2R1bGVzJyk7XG5cbmNvbnN0IExJTkVfUkVHRVhQID0gL3JlcXVpcmV8aW1wb3J0fGV4cG9ydFxccysoPzpcXCp8e1thLXpBLVowLTlfJCxcXHNdK30pK1xccytmcm9tfH1cXHMqZnJvbVxccypbJ1wiXS87XG5jb25zdCBTRUxFQ1RPUiA9IFtcbiAgJy5zb3VyY2UuanMgLnN0cmluZy5xdW90ZWQnLFxuXG4gIC8vIGZvciBiYWJlbC1sYW5ndWFnZSBwbHVnaW5cbiAgJy5zb3VyY2UuanMgLnB1bmN0dWF0aW9uLmRlZmluaXRpb24uc3RyaW5nLmVuZCcsXG4gICcuc291cmNlLmpzIC5wdW5jdHVhdGlvbi5kZWZpbml0aW9uLnN0cmluZy5iZWdpbicsXG5cbiAgJy5zb3VyY2UudHMgLnN0cmluZy5xdW90ZWQnLFxuICAnLnNvdXJjZS50c3ggLnN0cmluZy5xdW90ZWQnLFxuICAnLnNvdXJjZS5jb2ZmZWUgLnN0cmluZy5xdW90ZWQnXG5dO1xuY29uc3QgU0VMRUNUT1JfRElTQUJMRSA9IFtcbiAgJy5zb3VyY2UuanMgLmNvbW1lbnQnLFxuICAnLnNvdXJjZS5qcyAua2V5d29yZCcsXG4gICcuc291cmNlLnRzIC5jb21tZW50JyxcbiAgJy5zb3VyY2UudHMgLmtleXdvcmQnLFxuICAnLnNvdXJjZS50c3ggLmNvbW1lbnQnLFxuICAnLnNvdXJjZS50c3ggLmtleXdvcmQnXG5dO1xuXG5jbGFzcyBDb21wbGV0aW9uUHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gU0VMRUNUT1Iuam9pbignLCAnKTtcbiAgICB0aGlzLmRpc2FibGVGb3JTZWxlY3RvciA9IFNFTEVDVE9SX0RJU0FCTEUuam9pbignLCAnKTtcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXh9KSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG4gICAgaWYgKCFMSU5FX1JFR0VYUC50ZXN0KGxpbmUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcmVhbFByZWZpeCA9IHRoaXMuZ2V0UmVhbFByZWZpeChwcmVmaXgsIGxpbmUpO1xuICAgIGlmICghcmVhbFByZWZpeCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGlmIChyZWFsUHJlZml4WzBdID09PSAnLicpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKHJlYWxQcmVmaXgsIHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKSk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVuZG9ycyA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMudmVuZG9ycycpO1xuICAgIGNvbnN0IGFjdGl2ZVBhbmVGaWxlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKS5idWZmZXIuZmlsZTtcbiAgICAvLyBpbiBjYXNlIHVzZXIgZWRpdGluZyB1bnNhdmVkIGZpbGVcbiAgICBpZiAoIWFjdGl2ZVBhbmVGaWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZXMgPSB2ZW5kb3JzLm1hcChcbiAgICAgICh2ZW5kb3IpID0+IHRoaXMubG9va3VwR2xvYmFsKHJlYWxQcmVmaXgsIGFjdGl2ZVBhbmVGaWxlLnBhdGgsIHZlbmRvcilcbiAgICApO1xuXG4gICAgY29uc3Qgd2VicGFjayA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMud2VicGFjaycpO1xuICAgIGlmICh3ZWJwYWNrKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9va3VwV2VicGFjayhyZWFsUHJlZml4LCBhY3RpdmVQYW5lRmlsZS5wYXRoKSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlciA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMuYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcicpO1xuICAgIGlmIChiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9va3VwYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcihyZWFsUHJlZml4LCBhY3RpdmVQYW5lRmlsZS5wYXRoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiBbXS5jb25jYXQoLi4uc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIGdldFJlYWxQcmVmaXgocHJlZml4LCBsaW5lKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlYWxQcmVmaXhSZWdFeHAgPSBuZXcgUmVnRXhwKGBbJ1wiXSgoPzouKz8pKiR7ZXNjYXBlUmVnRXhwKHByZWZpeCl9KWApO1xuICAgICAgY29uc3QgcmVhbFByZWZpeE1hdGhlcyA9IHJlYWxQcmVmaXhSZWdFeHAuZXhlYyhsaW5lKTtcbiAgICAgIGlmICghcmVhbFByZWZpeE1hdGhlcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWFsUHJlZml4TWF0aGVzWzFdO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBmaWx0ZXJTdWdnZXN0aW9ucyhwcmVmaXgsIHN1Z2dlc3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1enphbGRyaW4uZmlsdGVyKHN1Z2dlc3Rpb25zLCBwcmVmaXgsIHtcbiAgICAgIGtleTogJ3RleHQnXG4gICAgfSk7XG4gIH1cblxuICBsb29rdXBMb2NhbChwcmVmaXgsIGRpcm5hbWUpIHtcbiAgICBsZXQgZmlsdGVyUHJlZml4ID0gcHJlZml4LnJlcGxhY2UocGF0aC5kaXJuYW1lKHByZWZpeCksICcnKS5yZXBsYWNlKCcvJywgJycpO1xuICAgIGlmIChwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgIGZpbHRlclByZWZpeCA9ICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGluY2x1ZGVFeHRlbnNpb24gPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLmluY2x1ZGVFeHRlbnNpb24nKTtcbiAgICBsZXQgbG9va3VwRGlybmFtZSA9IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBwcmVmaXgpO1xuICAgIGlmIChmaWx0ZXJQcmVmaXgpIHtcbiAgICAgIGxvb2t1cERpcm5hbWUgPSBsb29rdXBEaXJuYW1lLnJlcGxhY2UobmV3IFJlZ0V4cChgJHtlc2NhcGVSZWdFeHAoZmlsdGVyUHJlZml4KX0kYCksICcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhZGRpcihsb29rdXBEaXJuYW1lKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKGUuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0pLmZpbHRlcihcbiAgICAgIChmaWxlbmFtZSkgPT4gZmlsZW5hbWVbMF0gIT09ICcuJ1xuICAgICkubWFwKChwYXRobmFtZSkgPT4gKHtcbiAgICAgIHRleHQ6IGluY2x1ZGVFeHRlbnNpb24gPyBwYXRobmFtZSA6IHRoaXMubm9ybWFsaXplTG9jYWwocGF0aG5hbWUpLFxuICAgICAgZGlzcGxheVRleHQ6IHBhdGhuYW1lLFxuICAgICAgdHlwZTogJ2ltcG9ydCdcbiAgICB9KSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gdGhpcy5maWx0ZXJTdWdnZXN0aW9ucyhmaWx0ZXJQcmVmaXgsIHN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBub3JtYWxpemVMb2NhbChmaWxlbmFtZSkge1xuICAgIHJldHVybiBmaWxlbmFtZS5yZXBsYWNlKC9cXC4oanN8ZXM2fGpzeHxjb2ZmZWV8dHN8dHN4KSQvLCAnJyk7XG4gIH1cblxuICBnZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCkge1xuICAgIGNvbnN0IFtwcm9qZWN0UGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIHJldHVybiBwcm9qZWN0UGF0aDtcbiAgfVxuXG4gIGxvb2t1cEdsb2JhbChwcmVmaXgsIGFjdGl2ZVBhbmVQYXRoLCB2ZW5kb3IgPSAnbm9kZV9tb2R1bGVzJykge1xuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5nZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCk7XG4gICAgaWYgKCFwcm9qZWN0UGF0aCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVuZG9yUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgdmVuZG9yKTtcbiAgICBpZiAocHJlZml4LmluZGV4T2YoJy8nKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvb2t1cExvY2FsKGAuLyR7cHJlZml4fWAsIHZlbmRvclBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiByZWFkZGlyKHZlbmRvclBhdGgpLmNhdGNoKChlKSA9PiB7XG4gICAgICBpZiAoZS5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW107XG4gICAgfSkudGhlbihcbiAgICAgIChsaWJzKSA9PiBbLi4uaW50ZXJuYWxNb2R1bGVzLCAuLi5saWJzXVxuICAgICkubWFwKChsaWIpID0+ICh7XG4gICAgICB0ZXh0OiBsaWIsXG4gICAgICByZXBsYWNlbWVudFByZWZpeDogcHJlZml4LFxuICAgICAgdHlwZTogJ2ltcG9ydCdcbiAgICB9KSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gdGhpcy5maWx0ZXJTdWdnZXN0aW9ucyhwcmVmaXgsIHN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBsb29rdXBXZWJwYWNrKHByZWZpeCwgYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIGlmICghcHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIGNvbnN0IHZlbmRvcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLnZlbmRvcnMnKTtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnID0gdGhpcy5mZXRjaFdlYnBhY2tDb25maWcocHJvamVjdFBhdGgpO1xuXG4gICAgLy8gV2VicGFjayB2MlxuICAgIGNvbnN0IHdlYnBhY2tNb2R1bGVzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLm1vZHVsZXMnLCBbXSk7XG5cbiAgICAvLyBXZWJwYWNrIHYxXG4gICAgY29uc3Qgd2VicGFja1Jvb3QgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUucm9vdCcsICcnKTtcbiAgICBsZXQgbW9kdWxlU2VhcmNoUGF0aHMgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUubW9kdWxlc0RpcmVjdG9yaWVzJywgd2VicGFja01vZHVsZXMpO1xuICAgIG1vZHVsZVNlYXJjaFBhdGhzID0gbW9kdWxlU2VhcmNoUGF0aHMuZmlsdGVyKFxuICAgICAgKGl0ZW0pID0+IHZlbmRvcnMuaW5kZXhPZihpdGVtKSA9PT0gLTFcbiAgICApO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKG1vZHVsZVNlYXJjaFBhdGhzLmNvbmNhdCh3ZWJwYWNrUm9vdCkubWFwKFxuICAgICAgKHNlYXJjaFBhdGgpID0+IHRoaXMubG9va3VwTG9jYWwoXG4gICAgICAgIHByZWZpeCxcbiAgICAgICAgcGF0aC5pc0Fic29sdXRlKHNlYXJjaFBhdGgpID8gc2VhcmNoUGF0aCA6IHBhdGguam9pbihwcm9qZWN0UGF0aCwgc2VhcmNoUGF0aClcbiAgICAgIClcbiAgICApKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiBbXS5jb25jYXQoLi4uc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIGZldGNoV2VicGFja0NvbmZpZyhyb290UGF0aCkge1xuICAgIGNvbnN0IHdlYnBhY2tDb25maWdGaWxlbmFtZSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMud2VicGFja0NvbmZpZ0ZpbGVuYW1lJyk7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZ1BhdGggPSBwYXRoLmpvaW4ocm9vdFBhdGgsIHdlYnBhY2tDb25maWdGaWxlbmFtZSk7XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHJlcXVpcmUod2VicGFja0NvbmZpZ1BhdGgpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH1cblxuICBsb29rdXBiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyKHByZWZpeCwgYWN0aXZlUGFuZVBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IHRoaXMuZ2V0UHJvamVjdFBhdGgoYWN0aXZlUGFuZVBhdGgpO1xuICAgIGlmIChwcm9qZWN0UGF0aCkge1xuICAgICAgcmV0dXJuIGZpbmRCYWJlbENvbmZpZyhwcm9qZWN0UGF0aCkudGhlbigoe2NvbmZpZ30pID0+IHtcbiAgICAgICAgaWYgKGNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGNvbmZpZy5wbHVnaW5zKSkge1xuICAgICAgICAgIC8vIEdyYWIgdGhlIHYxIChtb2R1bGUtYWxpYXMpIG9yIHYyIChtb2R1bGUtcmVzb2x2ZXIpIHBsdWdpbiBjb25maWd1cmF0aW9uXG4gICAgICAgICAgY29uc3QgcGx1Z2luQ29uZmlnID0gY29uZmlnLnBsdWdpbnMuZmluZChwID0+IHBbMF0gPT09ICdtb2R1bGUtYWxpYXMnIHx8IHBbMF0gPT09ICdiYWJlbC1wbHVnaW4tbW9kdWxlLWFsaWFzJykgfHxcbiAgICAgICAgICAgIGNvbmZpZy5wbHVnaW5zLmZpbmQocCA9PiBwWzBdID09PSAnbW9kdWxlLXJlc29sdmVyJyB8fCBwWzBdID09PSAnYmFiZWwtcGx1Z2luLW1vZHVsZS1yZXNvbHZlcicpO1xuICAgICAgICAgIGlmICghcGx1Z2luQ29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT25seSB2MiBvZiB0aGUgcGx1Z2luIHN1cHBvcnRzIGN1c3RvbSByb290IGRpcmVjdG9yaWVzXG4gICAgICAgICAgbGV0IHJvb3RQcm9taXNlcyA9IFtdO1xuICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwbHVnaW5Db25maWdbMV0pKSB7XG4gICAgICAgICAgICBjb25zdCByb290RGlycyA9IHBsdWdpbkNvbmZpZ1sxXS5yb290IHx8IFtdO1xuICAgICAgICAgICAgcm9vdFByb21pc2VzID0gcm9vdFByb21pc2VzLmNvbmNhdChyb290RGlycy5tYXAociA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJvb3REaXJQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCByKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwoYC4vJHtwcmVmaXh9YCwgcm9vdERpclBhdGgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGRldGVybWluZSB0aGUgcmlnaHQgcHJlZml4IGZvciB0aGUgYWxpYXMgY29uZmlnXG4gICAgICAgICAgLy8gYHJlYWxQcmVmaXhgIGlzIHRoZSBwcmVmaXggd2Ugd2FudCB0byB1c2UgdG8gZmluZCB0aGUgcmlnaHQgZmlsZS9zdWdnZXN0aW9uc1xuICAgICAgICAgIC8vIHdoZW4gdGhlIHByZWZpeCBpcyBhIHN1YiBtb2R1bGUgKGVnLiBtb2R1bGUvc3ViZmlsZSksXG4gICAgICAgICAgLy8gYG1vZHVsZVByZWZpeGAgd2lsbCBiZSBcIm1vZHVsZVwiLCBhbmQgYHJlYWxQcmVmaXhgIHdpbGwgYmUgXCJzdWJmaWxlXCJcbiAgICAgICAgICBjb25zdCBwcmVmaXhTcGxpdCA9IHByZWZpeC5zcGxpdCgnLycpO1xuICAgICAgICAgIGNvbnN0IG1vZHVsZVByZWZpeCA9IHByZWZpeFNwbGl0WzBdO1xuICAgICAgICAgIGNvbnN0IHJlYWxQcmVmaXggPSBwcmVmaXhTcGxpdC5wb3AoKTtcbiAgICAgICAgICBjb25zdCBtb2R1bGVTZWFyY2hQYXRoID0gcHJlZml4U3BsaXQuam9pbignLycpO1xuXG4gICAgICAgICAgLy8gZ2V0IHRoZSBhbGlhcyBjb25maWdzIGZvciB0aGUgc3BlY2lmaWMgbW9kdWxlXG4gICAgICAgICAgY29uc3QgYWxpYXNDb25maWcgPSBBcnJheS5pc0FycmF5KHBsdWdpbkNvbmZpZ1sxXSlcbiAgICAgICAgICAgIC8vIHYxIG9mIHRoZSBwbHVnaW4gaXMgYW4gYXJyYXlcbiAgICAgICAgICAgID8gcGx1Z2luQ29uZmlnWzFdLmZpbHRlcihhbGlhcyA9PiBhbGlhcy5leHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGl0J3MgdjIgKGFuIG9iamVjdClcbiAgICAgICAgICAgIDogT2JqZWN0LmtleXMocGx1Z2luQ29uZmlnWzFdLmFsaWFzIHx8IHt9KVxuICAgICAgICAgICAgICAuZmlsdGVyKGV4cG9zZSA9PiBleHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgICAubWFwKGV4cCA9PiAoe1xuICAgICAgICAgICAgICAgIGV4cG9zZTogZXhwLFxuICAgICAgICAgICAgICAgIHNyYzogcGx1Z2luQ29uZmlnWzFdLmFsaWFzW2V4cF1cbiAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvb3RQcm9taXNlcy5jb25jYXQoYWxpYXNDb25maWcubWFwKFxuICAgICAgICAgICAgKGFsaWFzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFRoZSBzZWFyY2ggcGF0aCBpcyB0aGUgc291cmNlIGRpcmVjdG9yeSBzcGVjaWZpZWQgaW4gLmJhYmVscmNcbiAgICAgICAgICAgICAgLy8gdGhlbiB3ZSBhcHBlbmQgdGhlIGBtb2R1bGVTZWFyY2hQYXRoYCAod2l0aG91dCB0aGUgYWxpYXMpXG4gICAgICAgICAgICAgIC8vIHRvIGdldCB0aGUgcmVhbCBzZWFyY2ggcGF0aFxuICAgICAgICAgICAgICBjb25zdCBzZWFyY2hQYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgYWxpYXMuc3JjKSxcbiAgICAgICAgICAgICAgICBtb2R1bGVTZWFyY2hQYXRoLnJlcGxhY2UoYWxpYXMuZXhwb3NlLCAnJylcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsUHJlZml4LCBzZWFyY2hQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApKSkudGhlbihcbiAgICAgICAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICAgICAgICkudGhlbihzdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHN1Z2dlc3Rpb25zIGFyZSBmcm9tIHRoZSBjb21wYXRpYmxlIGFsaWFzXG4gICAgICAgICAgICBpZiAocHJlZml4ID09PSByZWFsUHJlZml4ICYmIGFsaWFzQ29uZmlnLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKHN1Z2cgPT5cbiAgICAgICAgICAgICAgICBhbGlhc0NvbmZpZy5maW5kKGEgPT4gYS5leHBvc2UgPT09IHN1Z2cudGV4dClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXRpb25Qcm92aWRlcjtcbiJdfQ==