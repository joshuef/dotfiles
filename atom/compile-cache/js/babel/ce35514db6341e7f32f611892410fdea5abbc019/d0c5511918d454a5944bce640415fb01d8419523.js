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
'.source.js .punctuation.definition.string.end', '.source.js .punctuation.definition.string.begin', '.source.ts .string.quoted', '.source.coffee .string.quoted'];
var SELECTOR_DISABLE = ['.source.js .comment', '.source.js .keyword', '.source.ts .comment', '.source.ts .keyword'];

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
      var activePanePath = atom.workspace.getActivePaneItem().buffer.file.path;

      var promises = vendors.map(function (vendor) {
        return _this.lookupGlobal(realPrefix, activePanePath, vendor);
      });

      var webpack = atom.config.get('autocomplete-modules.webpack');
      if (webpack) {
        promises.push(this.lookupWebpack(realPrefix, activePanePath));
      }

      var babelPluginModuleResolver = atom.config.get('autocomplete-modules.babelPluginModuleResolver');
      if (babelPluginModuleResolver) {
        promises.push(this.lookupbabelPluginModuleResolver(realPrefix, activePanePath));
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
                  // The search path is the parent directory of the source directory specified in .babelrc
                  // then we append the `moduleSearchPath` to get the real search path
                  var searchPath = path.join(path.dirname(path.resolve(projectPath, alias.src)), moduleSearchPath);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1tb2R1bGVzL3NyYy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQUVaLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6RCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3pDLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ3BELElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxJQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyRCxJQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFFNUQsSUFBTSxXQUFXLEdBQUcsNEVBQTRFLENBQUM7QUFDakcsSUFBTSxRQUFRLEdBQUcsQ0FDZiwyQkFBMkI7OztBQUczQiwrQ0FBK0MsRUFDL0MsaURBQWlELEVBRWpELDJCQUEyQixFQUMzQiwrQkFBK0IsQ0FDaEMsQ0FBQztBQUNGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIscUJBQXFCLEVBQ3JCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIscUJBQXFCLENBQ3RCLENBQUM7O0lBRUksa0JBQWtCO0FBQ1gsV0FEUCxrQkFBa0IsR0FDUjswQkFEVixrQkFBa0I7O0FBRXBCLFFBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxRQUFJLENBQUMs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QUFNLEVBQUU7QUFDL0MsMkJBQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUk7NkJBQzVCLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDOytCQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUk7dUJBQUEsQ0FBQztxQkFBQSxDQUM5QyxDQUFDO21CQUNIO0FBQ0QseUJBQU8sV0FBVyxDQUFDO2lCQUNwQixDQUFDO2dCQUFDOzs7O1dBQ0o7O0FBRUQsaUJBQU8sRUFBRSxDQUFDO1NBQ1gsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1NBaFBHLGtCQUFrQjs7O0FBbVB4QixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1tb2R1bGVzL3NyYy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgcmVhZGRpciA9IFByb21pc2UucHJvbWlzaWZ5KHJlcXVpcmUoJ2ZzJykucmVhZGRpcik7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgZnV6emFsZHJpbiA9IHJlcXVpcmUoJ2Z1enphbGRyaW4nKTtcbmNvbnN0IGVzY2FwZVJlZ0V4cCA9IHJlcXVpcmUoJ2xvZGFzaC5lc2NhcGVyZWdleHAnKTtcbmNvbnN0IGdldCA9IHJlcXVpcmUoJ2xvZGFzaC5nZXQnKTtcbmNvbnN0IGZpbmRCYWJlbENvbmZpZyA9IHJlcXVpcmUoJ2ZpbmQtYmFiZWwtY29uZmlnJyk7XG5jb25zdCBpbnRlcm5hbE1vZHVsZXMgPSByZXF1aXJlKCcuL3V0aWxzL2ludGVybmFsLW1vZHVsZXMnKTtcblxuY29uc3QgTElORV9SRUdFWFAgPSAvcmVxdWlyZXxpbXBvcnR8ZXhwb3J0XFxzKyg/OlxcKnx7W2EtekEtWjAtOV8kLFxcc10rfSkrXFxzK2Zyb218fVxccypmcm9tXFxzKlsnXCJdLztcbmNvbnN0IFNFTEVDVE9SID0gW1xuICAnLnNvdXJjZS5qcyAuc3RyaW5nLnF1b3RlZCcsXG5cbiAgLy8gZm9yIGJhYmVsLWxhbmd1YWdlIHBsdWdpblxuICAnLnNvdXJjZS5qcyAucHVuY3R1YXRpb24uZGVmaW5pdGlvbi5zdHJpbmcuZW5kJyxcbiAgJy5zb3VyY2UuanMgLnB1bmN0dWF0aW9uLmRlZmluaXRpb24uc3RyaW5nLmJlZ2luJyxcblxuICAnLnNvdXJjZS50cyAuc3RyaW5nLnF1b3RlZCcsXG4gICcuc291cmNlLmNvZmZlZSAuc3RyaW5nLnF1b3RlZCdcbl07XG5jb25zdCBTRUxFQ1RPUl9ESVNBQkxFID0gW1xuICAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICcuc291cmNlLmpzIC5rZXl3b3JkJyxcbiAgJy5zb3VyY2UudHMgLmNvbW1lbnQnLFxuICAnLnNvdXJjZS50cyAua2V5d29yZCdcbl07XG5cbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBTRUxFQ1RPUi5qb2luKCcsICcpO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gU0VMRUNUT1JfRElTQUJMRS5qb2luKCcsICcpO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoe2VkaXRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeH0pIHtcbiAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKTtcbiAgICBpZiAoIUxJTkVfUkVHRVhQLnRlc3QobGluZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCByZWFsUHJlZml4ID0gdGhpcy5nZXRSZWFsUHJlZml4KHByZWZpeCwgbGluZSk7XG4gICAgaWYgKCFyZWFsUHJlZml4KSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgaWYgKHJlYWxQcmVmaXhbMF0gPT09ICcuJykge1xuICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwocmVhbFByZWZpeCwgcGF0aC5kaXJuYW1lKGVkaXRvci5nZXRQYXRoKCkpKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG4gICAgY29uc3QgYWN0aXZlUGFuZVBhdGggPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpLmJ1ZmZlci5maWxlLnBhdGg7XG5cbiAgICBjb25zdCBwcm9taXNlcyA9IHZlbmRvcnMubWFwKFxuICAgICAgKHZlbmRvcikgPT4gdGhpcy5sb29rdXBHbG9iYWwocmVhbFByZWZpeCwgYWN0aXZlUGFuZVBhdGgsIHZlbmRvcilcbiAgICApO1xuXG4gICAgY29uc3Qgd2VicGFjayA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMud2VicGFjaycpO1xuICAgIGlmICh3ZWJwYWNrKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9va3VwV2VicGFjayhyZWFsUHJlZml4LCBhY3RpdmVQYW5lUGF0aCkpO1xuICAgIH1cblxuICAgIGNvbnN0IGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLmJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXInKTtcbiAgICBpZiAoYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcikge1xuICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvb2t1cGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIocmVhbFByZWZpeCwgYWN0aXZlUGFuZVBhdGgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgZ2V0UmVhbFByZWZpeChwcmVmaXgsIGxpbmUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVhbFByZWZpeFJlZ0V4cCA9IG5ldyBSZWdFeHAoYFsnXCJdKCg/Oi4rPykqJHtlc2NhcGVSZWdFeHAocHJlZml4KX0pYCk7XG4gICAgICBjb25zdCByZWFsUHJlZml4TWF0aGVzID0gcmVhbFByZWZpeFJlZ0V4cC5leGVjKGxpbmUpO1xuICAgICAgaWYgKCFyZWFsUHJlZml4TWF0aGVzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlYWxQcmVmaXhNYXRoZXNbMV07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpIHtcbiAgICByZXR1cm4gZnV6emFsZHJpbi5maWx0ZXIoc3VnZ2VzdGlvbnMsIHByZWZpeCwge1xuICAgICAga2V5OiAndGV4dCdcbiAgICB9KTtcbiAgfVxuXG4gIGxvb2t1cExvY2FsKHByZWZpeCwgZGlybmFtZSkge1xuICAgIGxldCBmaWx0ZXJQcmVmaXggPSBwcmVmaXgucmVwbGFjZShwYXRoLmRpcm5hbWUocHJlZml4KSwgJycpLnJlcGxhY2UoJy8nLCAnJyk7XG4gICAgaWYgKHByZWZpeFtwcmVmaXgubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgZmlsdGVyUHJlZml4ID0gJyc7XG4gICAgfVxuXG4gICAgY29uc3QgaW5jbHVkZUV4dGVuc2lvbiA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMuaW5jbHVkZUV4dGVuc2lvbicpO1xuICAgIGxldCBsb29rdXBEaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpcm5hbWUsIHByZWZpeCk7XG4gICAgaWYgKGZpbHRlclByZWZpeCkge1xuICAgICAgbG9va3VwRGlybmFtZSA9IGxvb2t1cERpcm5hbWUucmVwbGFjZShuZXcgUmVnRXhwKGAke2VzY2FwZVJlZ0V4cChmaWx0ZXJQcmVmaXgpfSRgKSwgJycpO1xuICAgIH1cblxuICAgIHJldHVybiByZWFkZGlyKGxvb2t1cERpcm5hbWUpLmNhdGNoKChlKSA9PiB7XG4gICAgICBpZiAoZS5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW107XG4gICAgfSkuZmlsdGVyKFxuICAgICAgKGZpbGVuYW1lKSA9PiBmaWxlbmFtZVswXSAhPT0gJy4nXG4gICAgKS5tYXAoKHBhdGhuYW1lKSA9PiAoe1xuICAgICAgdGV4dDogaW5jbHVkZUV4dGVuc2lvbiA/IHBhdGhuYW1lIDogdGhpcy5ub3JtYWxpemVMb2NhbChwYXRobmFtZSksXG4gICAgICBkaXNwbGF5VGV4dDogcGF0aG5hbWUsXG4gICAgICB0eXBlOiAnaW1wb3J0J1xuICAgIH0pKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKGZpbHRlclByZWZpeCwgc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZUxvY2FsKGZpbGVuYW1lKSB7XG4gICAgcmV0dXJuIGZpbGVuYW1lLnJlcGxhY2UoL1xcLihqc3xlczZ8anN4fGNvZmZlZXx0c3x0c3gpJC8sICcnKTtcbiAgfVxuXG4gIGdldFByb2plY3RQYXRoKGFjdGl2ZVBhbmVQYXRoKSB7XG4gICAgY29uc3QgW3Byb2plY3RQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChhY3RpdmVQYW5lUGF0aCk7XG4gICAgcmV0dXJuIHByb2plY3RQYXRoO1xuICB9XG5cbiAgbG9va3VwR2xvYmFsKHByZWZpeCwgYWN0aXZlUGFuZVBhdGgsIHZlbmRvciA9ICdub2RlX21vZHVsZXMnKSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSB0aGlzLmdldFByb2plY3RQYXRoKGFjdGl2ZVBhbmVQYXRoKTtcbiAgICBpZiAoIXByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCB2ZW5kb3IpO1xuICAgIGlmIChwcmVmaXguaW5kZXhPZignLycpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwoYC4vJHtwcmVmaXh9YCwgdmVuZG9yUGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlYWRkaXIodmVuZG9yUGF0aCkuY2F0Y2goKGUpID0+IHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9KS50aGVuKFxuICAgICAgKGxpYnMpID0+IFsuLi5pbnRlcm5hbE1vZHVsZXMsIC4uLmxpYnNdXG4gICAgKS5tYXAoKGxpYikgPT4gKHtcbiAgICAgIHRleHQ6IGxpYixcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXgsXG4gICAgICB0eXBlOiAnaW1wb3J0J1xuICAgIH0pKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIGxvb2t1cFdlYnBhY2socHJlZml4LCBhY3RpdmVQYW5lUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5nZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCk7XG4gICAgaWYgKCFwcm9qZWN0UGF0aCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVuZG9ycyA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMudmVuZG9ycycpO1xuICAgIGNvbnN0IHdlYnBhY2tDb25maWcgPSB0aGlzLmZldGNoV2VicGFja0NvbmZpZyhwcm9qZWN0UGF0aCk7XG5cbiAgICAvLyBXZWJwYWNrIHYyXG4gICAgY29uc3Qgd2VicGFja01vZHVsZXMgPSBnZXQod2VicGFja0NvbmZpZywgJ3Jlc29sdmUubW9kdWxlcycsIFtdKTtcblxuICAgIC8vIFdlYnBhY2sgdjFcbiAgICBjb25zdCB3ZWJwYWNrUm9vdCA9IGdldCh3ZWJwYWNrQ29uZmlnLCAncmVzb2x2ZS5yb290JywgJycpO1xuICAgIGxldCBtb2R1bGVTZWFyY2hQYXRocyA9IGdldCh3ZWJwYWNrQ29uZmlnLCAncmVzb2x2ZS5tb2R1bGVzRGlyZWN0b3JpZXMnLCB3ZWJwYWNrTW9kdWxlcyk7XG4gICAgbW9kdWxlU2VhcmNoUGF0aHMgPSBtb2R1bGVTZWFyY2hQYXRocy5maWx0ZXIoXG4gICAgICAoaXRlbSkgPT4gdmVuZG9ycy5pbmRleE9mKGl0ZW0pID09PSAtMVxuICAgICk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kdWxlU2VhcmNoUGF0aHMuY29uY2F0KHdlYnBhY2tSb290KS5tYXAoXG4gICAgICAoc2VhcmNoUGF0aCkgPT4gdGhpcy5sb29rdXBMb2NhbChcbiAgICAgICAgcHJlZml4LFxuICAgICAgICBwYXRoLmlzQWJzb2x1dGUoc2VhcmNoUGF0aCkgPyBzZWFyY2hQYXRoIDogcGF0aC5qb2luKHByb2plY3RQYXRoLCBzZWFyY2hQYXRoKVxuICAgICAgKVxuICAgICkpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgZmV0Y2hXZWJwYWNrQ29uZmlnKHJvb3RQYXRoKSB7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZ0ZpbGVuYW1lID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy53ZWJwYWNrQ29uZmlnRmlsZW5hbWUnKTtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnUGF0aCA9IHBhdGguam9pbihyb290UGF0aCwgd2VicGFja0NvbmZpZ0ZpbGVuYW1lKTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVxdWlyZSh3ZWJwYWNrQ29uZmlnUGF0aCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfVxuXG4gIGxvb2t1cGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIocHJlZml4LCBhY3RpdmVQYW5lUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5nZXRQcm9qZWN0UGF0aChhY3RpdmVQYW5lUGF0aCk7XG4gICAgaWYgKHByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gZmluZEJhYmVsQ29uZmlnKHByb2plY3RQYXRoKS50aGVuKCh7Y29uZmlnfSkgPT4ge1xuICAgICAgICBpZiAoY29uZmlnICYmIEFycmF5LmlzQXJyYXkoY29uZmlnLnBsdWdpbnMpKSB7XG4gICAgICAgICAgLy8gR3JhYiB0aGUgdjEgKG1vZHVsZS1hbGlhcykgb3IgdjIgKG1vZHVsZS1yZXNvbHZlcikgcGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICBjb25zdCBwbHVnaW5Db25maWcgPSBjb25maWcucGx1Z2lucy5maW5kKHAgPT4gcFswXSA9PT0gJ21vZHVsZS1hbGlhcycgfHwgcFswXSA9PT0gJ2JhYmVsLXBsdWdpbi1tb2R1bGUtYWxpYXMnKSB8fFxuICAgICAgICAgICAgY29uZmlnLnBsdWdpbnMuZmluZChwID0+IHBbMF0gPT09ICdtb2R1bGUtcmVzb2x2ZXInIHx8IHBbMF0gPT09ICdiYWJlbC1wbHVnaW4tbW9kdWxlLXJlc29sdmVyJyk7XG4gICAgICAgICAgaWYgKCFwbHVnaW5Db25maWcpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBPbmx5IHYyIG9mIHRoZSBwbHVnaW4gc3VwcG9ydHMgY3VzdG9tIHJvb3QgZGlyZWN0b3JpZXNcbiAgICAgICAgICBsZXQgcm9vdFByb21pc2VzID0gW107XG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBsdWdpbkNvbmZpZ1sxXSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3REaXJzID0gcGx1Z2luQ29uZmlnWzFdLnJvb3QgfHwgW107XG4gICAgICAgICAgICByb290UHJvbWlzZXMgPSByb290UHJvbWlzZXMuY29uY2F0KHJvb3REaXJzLm1hcChyID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgcm9vdERpclBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHIpO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChgLi8ke3ByZWZpeH1gLCByb290RGlyUGF0aCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gZGV0ZXJtaW5lIHRoZSByaWdodCBwcmVmaXggZm9yIHRoZSBhbGlhcyBjb25maWdcbiAgICAgICAgICAvLyBgcmVhbFByZWZpeGAgaXMgdGhlIHByZWZpeCB3ZSB3YW50IHRvIHVzZSB0byBmaW5kIHRoZSByaWdodCBmaWxlL3N1Z2dlc3Rpb25zXG4gICAgICAgICAgLy8gd2hlbiB0aGUgcHJlZml4IGlzIGEgc3ViIG1vZHVsZSAoZWcuIG1vZHVsZS9zdWJmaWxlKSxcbiAgICAgICAgICAvLyBgbW9kdWxlUHJlZml4YCB3aWxsIGJlIFwibW9kdWxlXCIsIGFuZCBgcmVhbFByZWZpeGAgd2lsbCBiZSBcInN1YmZpbGVcIlxuICAgICAgICAgIGNvbnN0IHByZWZpeFNwbGl0ID0gcHJlZml4LnNwbGl0KCcvJyk7XG4gICAgICAgICAgY29uc3QgbW9kdWxlUHJlZml4ID0gcHJlZml4U3BsaXRbMF07XG4gICAgICAgICAgY29uc3QgcmVhbFByZWZpeCA9IHByZWZpeFNwbGl0LnBvcCgpO1xuICAgICAgICAgIGNvbnN0IG1vZHVsZVNlYXJjaFBhdGggPSBwcmVmaXhTcGxpdC5qb2luKCcvJyk7XG5cbiAgICAgICAgICAvLyBnZXQgdGhlIGFsaWFzIGNvbmZpZ3MgZm9yIHRoZSBzcGVjaWZpYyBtb2R1bGVcbiAgICAgICAgICBjb25zdCBhbGlhc0NvbmZpZyA9IEFycmF5LmlzQXJyYXkocGx1Z2luQ29uZmlnWzFdKVxuICAgICAgICAgICAgLy8gdjEgb2YgdGhlIHBsdWdpbiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgPyBwbHVnaW5Db25maWdbMV0uZmlsdGVyKGFsaWFzID0+IGFsaWFzLmV4cG9zZS5zdGFydHNXaXRoKG1vZHVsZVByZWZpeCkpXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgaXQncyB2MiAoYW4gb2JqZWN0KVxuICAgICAgICAgICAgOiBPYmplY3Qua2V5cyhwbHVnaW5Db25maWdbMV0uYWxpYXMgfHwge30pXG4gICAgICAgICAgICAgIC5maWx0ZXIoZXhwb3NlID0+IGV4cG9zZS5zdGFydHNXaXRoKG1vZHVsZVByZWZpeCkpXG4gICAgICAgICAgICAgIC5tYXAoZXhwID0+ICh7XG4gICAgICAgICAgICAgICAgZXhwb3NlOiBleHAsXG4gICAgICAgICAgICAgICAgc3JjOiBwbHVnaW5Db25maWdbMV0uYWxpYXNbZXhwXVxuICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocm9vdFByb21pc2VzLmNvbmNhdChhbGlhc0NvbmZpZy5tYXAoXG4gICAgICAgICAgICAoYWxpYXMpID0+IHtcbiAgICAgICAgICAgICAgLy8gVGhlIHNlYXJjaCBwYXRoIGlzIHRoZSBwYXJlbnQgZGlyZWN0b3J5IG9mIHRoZSBzb3VyY2UgZGlyZWN0b3J5IHNwZWNpZmllZCBpbiAuYmFiZWxyY1xuICAgICAgICAgICAgICAvLyB0aGVuIHdlIGFwcGVuZCB0aGUgYG1vZHVsZVNlYXJjaFBhdGhgIHRvIGdldCB0aGUgcmVhbCBzZWFyY2ggcGF0aFxuICAgICAgICAgICAgICBjb25zdCBzZWFyY2hQYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGFsaWFzLnNyYykpLFxuICAgICAgICAgICAgICAgIG1vZHVsZVNlYXJjaFBhdGhcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb29rdXBMb2NhbChyZWFsUHJlZml4LCBzZWFyY2hQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApKSkudGhlbihcbiAgICAgICAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICAgICAgICkudGhlbihzdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHN1Z2dlc3Rpb25zIGFyZSBmcm9tIHRoZSBjb21wYXRpYmxlIGFsaWFzXG4gICAgICAgICAgICBpZiAocHJlZml4ID09PSByZWFsUHJlZml4ICYmIGFsaWFzQ29uZmlnLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKHN1Z2cgPT5cbiAgICAgICAgICAgICAgICBhbGlhc0NvbmZpZy5maW5kKGEgPT4gYS5leHBvc2UgPT09IHN1Z2cudGV4dClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXRpb25Qcm92aWRlcjtcbiJdfQ==