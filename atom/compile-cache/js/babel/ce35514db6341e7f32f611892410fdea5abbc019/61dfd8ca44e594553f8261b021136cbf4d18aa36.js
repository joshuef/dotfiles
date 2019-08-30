'use babel';

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

      var promises = vendors.map(function (vendor) {
        return _this.lookupGlobal(realPrefix, vendor);
      });

      var webpack = atom.config.get('autocomplete-modules.webpack');
      if (webpack) {
        promises.push(this.lookupWebpack(realPrefix));
      }

      var babelPluginModuleResolver = atom.config.get('autocomplete-modules.babelPluginModuleResolver');
      if (babelPluginModuleResolver) {
        promises.push(this.lookupbabelPluginModuleResolver(realPrefix));
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
    key: 'lookupGlobal',
    value: function lookupGlobal(prefix) {
      var _this3 = this;

      var vendor = arguments.length <= 1 || arguments[1] === undefined ? 'node_modules' : arguments[1];

      var projectPath = atom.project.getPaths()[0];
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
    value: function lookupWebpack(prefix) {
      var _this4 = this;

      var projectPath = atom.project.getPaths()[0];
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
    value: function lookupbabelPluginModuleResolver(prefix) {
      var _this5 = this;

      var projectPath = atom.project.getPaths()[0];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1tb2R1bGVzL3NyYy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7QUFFWixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDcEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6QyxJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUNwRCxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbEMsSUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDckQsSUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O0FBRTVELElBQU0sV0FBVyxHQUFHLDRFQUE0RSxDQUFDO0FBQ2pHLElBQU0sUUFBUSxHQUFHLENBQ2YsMkJBQTJCOzs7QUFHM0IsK0NBQStDLEVBQy9DLGlEQUFpRCxFQUVqRCwyQkFBMkIsRUFDM0IsK0JBQStCLENBQ2hDLENBQUM7QUFDRixJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIscUJBQXFCLEVBQ3JCLHFCQUFxQixDQUN0QixDQUFDOztJQUVJLGtCQUFrQjtBQUNYLFdBRFAsa0JBQWtCLEdBQ1I7MEJBRFYsa0JBQWtCOztBQUVwQixRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLGtC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aUJBQU8sRUFBRSxDQUFDO1NBQ1gsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1NBMU9HLGtCQUFrQjs7O0FBNk94QixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1tb2R1bGVzL3NyYy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgcmVhZGRpciA9IFByb21pc2UucHJvbWlzaWZ5KHJlcXVpcmUoJ2ZzJykucmVhZGRpcik7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgZnV6emFsZHJpbiA9IHJlcXVpcmUoJ2Z1enphbGRyaW4nKTtcbmNvbnN0IGVzY2FwZVJlZ0V4cCA9IHJlcXVpcmUoJ2xvZGFzaC5lc2NhcGVyZWdleHAnKTtcbmNvbnN0IGdldCA9IHJlcXVpcmUoJ2xvZGFzaC5nZXQnKTtcbmNvbnN0IGZpbmRCYWJlbENvbmZpZyA9IHJlcXVpcmUoJ2ZpbmQtYmFiZWwtY29uZmlnJyk7XG5jb25zdCBpbnRlcm5hbE1vZHVsZXMgPSByZXF1aXJlKCcuL3V0aWxzL2ludGVybmFsLW1vZHVsZXMnKTtcblxuY29uc3QgTElORV9SRUdFWFAgPSAvcmVxdWlyZXxpbXBvcnR8ZXhwb3J0XFxzKyg/OlxcKnx7W2EtekEtWjAtOV8kLFxcc10rfSkrXFxzK2Zyb218fVxccypmcm9tXFxzKlsnXCJdLztcbmNvbnN0IFNFTEVDVE9SID0gW1xuICAnLnNvdXJjZS5qcyAuc3RyaW5nLnF1b3RlZCcsXG5cbiAgLy8gZm9yIGJhYmVsLWxhbmd1YWdlIHBsdWdpblxuICAnLnNvdXJjZS5qcyAucHVuY3R1YXRpb24uZGVmaW5pdGlvbi5zdHJpbmcuZW5kJyxcbiAgJy5zb3VyY2UuanMgLnB1bmN0dWF0aW9uLmRlZmluaXRpb24uc3RyaW5nLmJlZ2luJyxcblxuICAnLnNvdXJjZS50cyAuc3RyaW5nLnF1b3RlZCcsXG4gICcuc291cmNlLmNvZmZlZSAuc3RyaW5nLnF1b3RlZCdcbl07XG5jb25zdCBTRUxFQ1RPUl9ESVNBQkxFID0gW1xuICAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICcuc291cmNlLmpzIC5rZXl3b3JkJyxcbiAgJy5zb3VyY2UudHMgLmNvbW1lbnQnLFxuICAnLnNvdXJjZS50cyAua2V5d29yZCdcbl07XG5cbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBTRUxFQ1RPUi5qb2luKCcsICcpO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gU0VMRUNUT1JfRElTQUJMRS5qb2luKCcsICcpO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoe2VkaXRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeH0pIHtcbiAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKTtcbiAgICBpZiAoIUxJTkVfUkVHRVhQLnRlc3QobGluZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCByZWFsUHJlZml4ID0gdGhpcy5nZXRSZWFsUHJlZml4KHByZWZpeCwgbGluZSk7XG4gICAgaWYgKCFyZWFsUHJlZml4KSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgaWYgKHJlYWxQcmVmaXhbMF0gPT09ICcuJykge1xuICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwocmVhbFByZWZpeCwgcGF0aC5kaXJuYW1lKGVkaXRvci5nZXRQYXRoKCkpKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG5cbiAgICBjb25zdCBwcm9taXNlcyA9IHZlbmRvcnMubWFwKFxuICAgICAgKHZlbmRvcikgPT4gdGhpcy5sb29rdXBHbG9iYWwocmVhbFByZWZpeCwgdmVuZG9yKVxuICAgICk7XG5cbiAgICBjb25zdCB3ZWJwYWNrID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy53ZWJwYWNrJyk7XG4gICAgaWYgKHdlYnBhY2spIHtcbiAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb29rdXBXZWJwYWNrKHJlYWxQcmVmaXgpKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy5iYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyJyk7XG4gICAgaWYgKGJhYmVsUGx1Z2luTW9kdWxlUmVzb2x2ZXIpIHtcbiAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb29rdXBiYWJlbFBsdWdpbk1vZHVsZVJlc29sdmVyKHJlYWxQcmVmaXgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oXG4gICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICApO1xuICB9XG5cbiAgZ2V0UmVhbFByZWZpeChwcmVmaXgsIGxpbmUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVhbFByZWZpeFJlZ0V4cCA9IG5ldyBSZWdFeHAoYFsnXCJdKCg/Oi4rPykqJHtlc2NhcGVSZWdFeHAocHJlZml4KX0pYCk7XG4gICAgICBjb25zdCByZWFsUHJlZml4TWF0aGVzID0gcmVhbFByZWZpeFJlZ0V4cC5leGVjKGxpbmUpO1xuICAgICAgaWYgKCFyZWFsUHJlZml4TWF0aGVzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlYWxQcmVmaXhNYXRoZXNbMV07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpIHtcbiAgICByZXR1cm4gZnV6emFsZHJpbi5maWx0ZXIoc3VnZ2VzdGlvbnMsIHByZWZpeCwge1xuICAgICAga2V5OiAndGV4dCdcbiAgICB9KTtcbiAgfVxuXG4gIGxvb2t1cExvY2FsKHByZWZpeCwgZGlybmFtZSkge1xuICAgIGxldCBmaWx0ZXJQcmVmaXggPSBwcmVmaXgucmVwbGFjZShwYXRoLmRpcm5hbWUocHJlZml4KSwgJycpLnJlcGxhY2UoJy8nLCAnJyk7XG4gICAgaWYgKHByZWZpeFtwcmVmaXgubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgZmlsdGVyUHJlZml4ID0gJyc7XG4gICAgfVxuXG4gICAgY29uc3QgaW5jbHVkZUV4dGVuc2lvbiA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLW1vZHVsZXMuaW5jbHVkZUV4dGVuc2lvbicpO1xuICAgIGxldCBsb29rdXBEaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpcm5hbWUsIHByZWZpeCk7XG4gICAgaWYgKGZpbHRlclByZWZpeCkge1xuICAgICAgbG9va3VwRGlybmFtZSA9IGxvb2t1cERpcm5hbWUucmVwbGFjZShuZXcgUmVnRXhwKGAke2VzY2FwZVJlZ0V4cChmaWx0ZXJQcmVmaXgpfSRgKSwgJycpO1xuICAgIH1cblxuICAgIHJldHVybiByZWFkZGlyKGxvb2t1cERpcm5hbWUpLmNhdGNoKChlKSA9PiB7XG4gICAgICBpZiAoZS5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW107XG4gICAgfSkuZmlsdGVyKFxuICAgICAgKGZpbGVuYW1lKSA9PiBmaWxlbmFtZVswXSAhPT0gJy4nXG4gICAgKS5tYXAoKHBhdGhuYW1lKSA9PiAoe1xuICAgICAgdGV4dDogaW5jbHVkZUV4dGVuc2lvbiA/IHBhdGhuYW1lIDogdGhpcy5ub3JtYWxpemVMb2NhbChwYXRobmFtZSksXG4gICAgICBkaXNwbGF5VGV4dDogcGF0aG5hbWUsXG4gICAgICB0eXBlOiAnaW1wb3J0J1xuICAgIH0pKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKGZpbHRlclByZWZpeCwgc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZUxvY2FsKGZpbGVuYW1lKSB7XG4gICAgcmV0dXJuIGZpbGVuYW1lLnJlcGxhY2UoL1xcLihqc3xlczZ8anN4fGNvZmZlZXx0c3x0c3gpJC8sICcnKTtcbiAgfVxuXG4gIGxvb2t1cEdsb2JhbChwcmVmaXgsIHZlbmRvciA9ICdub2RlX21vZHVsZXMnKSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXTtcbiAgICBpZiAoIXByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCB2ZW5kb3IpO1xuICAgIGlmIChwcmVmaXguaW5kZXhPZignLycpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwoYC4vJHtwcmVmaXh9YCwgdmVuZG9yUGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlYWRkaXIodmVuZG9yUGF0aCkuY2F0Y2goKGUpID0+IHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9KS50aGVuKFxuICAgICAgKGxpYnMpID0+IFsuLi5pbnRlcm5hbE1vZHVsZXMsIC4uLmxpYnNdXG4gICAgKS5tYXAoKGxpYikgPT4gKHtcbiAgICAgIHRleHQ6IGxpYixcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXgsXG4gICAgICB0eXBlOiAnaW1wb3J0J1xuICAgIH0pKS50aGVuKFxuICAgICAgKHN1Z2dlc3Rpb25zKSA9PiB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKHByZWZpeCwgc3VnZ2VzdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIGxvb2t1cFdlYnBhY2socHJlZml4KSB7XG4gICAgY29uc3QgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXTtcbiAgICBpZiAoIXByb2plY3RQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZW5kb3JzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtbW9kdWxlcy52ZW5kb3JzJyk7XG4gICAgY29uc3Qgd2VicGFja0NvbmZpZyA9IHRoaXMuZmV0Y2hXZWJwYWNrQ29uZmlnKHByb2plY3RQYXRoKTtcblxuICAgIC8vIFdlYnBhY2sgdjJcbiAgICBjb25zdCB3ZWJwYWNrTW9kdWxlcyA9IGdldCh3ZWJwYWNrQ29uZmlnLCAncmVzb2x2ZS5tb2R1bGVzJywgW10pO1xuXG4gICAgLy8gV2VicGFjayB2MVxuICAgIGNvbnN0IHdlYnBhY2tSb290ID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLnJvb3QnLCAnJyk7XG4gICAgbGV0IG1vZHVsZVNlYXJjaFBhdGhzID0gZ2V0KHdlYnBhY2tDb25maWcsICdyZXNvbHZlLm1vZHVsZXNEaXJlY3RvcmllcycsIHdlYnBhY2tNb2R1bGVzKTtcbiAgICBtb2R1bGVTZWFyY2hQYXRocyA9IG1vZHVsZVNlYXJjaFBhdGhzLmZpbHRlcihcbiAgICAgIChpdGVtKSA9PiB2ZW5kb3JzLmluZGV4T2YoaXRlbSkgPT09IC0xXG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChtb2R1bGVTZWFyY2hQYXRocy5jb25jYXQod2VicGFja1Jvb3QpLm1hcChcbiAgICAgIChzZWFyY2hQYXRoKSA9PiB0aGlzLmxvb2t1cExvY2FsKFxuICAgICAgICBwcmVmaXgsXG4gICAgICAgIHBhdGguaXNBYnNvbHV0ZShzZWFyY2hQYXRoKSA/IHNlYXJjaFBhdGggOiBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHNlYXJjaFBhdGgpXG4gICAgICApXG4gICAgKSkudGhlbihcbiAgICAgIChzdWdnZXN0aW9ucykgPT4gW10uY29uY2F0KC4uLnN1Z2dlc3Rpb25zKVxuICAgICk7XG4gIH1cblxuICBmZXRjaFdlYnBhY2tDb25maWcocm9vdFBhdGgpIHtcbiAgICBjb25zdCB3ZWJwYWNrQ29uZmlnRmlsZW5hbWUgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1tb2R1bGVzLndlYnBhY2tDb25maWdGaWxlbmFtZScpO1xuICAgIGNvbnN0IHdlYnBhY2tDb25maWdQYXRoID0gcGF0aC5qb2luKHJvb3RQYXRoLCB3ZWJwYWNrQ29uZmlnRmlsZW5hbWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiByZXF1aXJlKHdlYnBhY2tDb25maWdQYXRoKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9XG5cbiAgbG9va3VwYmFiZWxQbHVnaW5Nb2R1bGVSZXNvbHZlcihwcmVmaXgpIHtcbiAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdO1xuICAgIGlmIChwcm9qZWN0UGF0aCkge1xuICAgICAgcmV0dXJuIGZpbmRCYWJlbENvbmZpZyhwcm9qZWN0UGF0aCkudGhlbigoe2NvbmZpZ30pID0+IHtcbiAgICAgICAgaWYgKGNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGNvbmZpZy5wbHVnaW5zKSkge1xuICAgICAgICAgIC8vIEdyYWIgdGhlIHYxIChtb2R1bGUtYWxpYXMpIG9yIHYyIChtb2R1bGUtcmVzb2x2ZXIpIHBsdWdpbiBjb25maWd1cmF0aW9uXG4gICAgICAgICAgY29uc3QgcGx1Z2luQ29uZmlnID0gY29uZmlnLnBsdWdpbnMuZmluZChwID0+IHBbMF0gPT09ICdtb2R1bGUtYWxpYXMnIHx8IHBbMF0gPT09ICdiYWJlbC1wbHVnaW4tbW9kdWxlLWFsaWFzJykgfHxcbiAgICAgICAgICAgIGNvbmZpZy5wbHVnaW5zLmZpbmQocCA9PiBwWzBdID09PSAnbW9kdWxlLXJlc29sdmVyJyB8fCBwWzBdID09PSAnYmFiZWwtcGx1Z2luLW1vZHVsZS1yZXNvbHZlcicpO1xuICAgICAgICAgIGlmICghcGx1Z2luQ29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT25seSB2MiBvZiB0aGUgcGx1Z2luIHN1cHBvcnRzIGN1c3RvbSByb290IGRpcmVjdG9yaWVzXG4gICAgICAgICAgbGV0IHJvb3RQcm9taXNlcyA9IFtdO1xuICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwbHVnaW5Db25maWdbMV0pKSB7XG4gICAgICAgICAgICBjb25zdCByb290RGlycyA9IHBsdWdpbkNvbmZpZ1sxXS5yb290IHx8IFtdO1xuICAgICAgICAgICAgcm9vdFByb21pc2VzID0gcm9vdFByb21pc2VzLmNvbmNhdChyb290RGlycy5tYXAociA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJvb3REaXJQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCByKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwoYC4vJHtwcmVmaXh9YCwgcm9vdERpclBhdGgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGRldGVybWluZSB0aGUgcmlnaHQgcHJlZml4IGZvciB0aGUgYWxpYXMgY29uZmlnXG4gICAgICAgICAgLy8gYHJlYWxQcmVmaXhgIGlzIHRoZSBwcmVmaXggd2Ugd2FudCB0byB1c2UgdG8gZmluZCB0aGUgcmlnaHQgZmlsZS9zdWdnZXN0aW9uc1xuICAgICAgICAgIC8vIHdoZW4gdGhlIHByZWZpeCBpcyBhIHN1YiBtb2R1bGUgKGVnLiBtb2R1bGUvc3ViZmlsZSksXG4gICAgICAgICAgLy8gYG1vZHVsZVByZWZpeGAgd2lsbCBiZSBcIm1vZHVsZVwiLCBhbmQgYHJlYWxQcmVmaXhgIHdpbGwgYmUgXCJzdWJmaWxlXCJcbiAgICAgICAgICBjb25zdCBwcmVmaXhTcGxpdCA9IHByZWZpeC5zcGxpdCgnLycpO1xuICAgICAgICAgIGNvbnN0IG1vZHVsZVByZWZpeCA9IHByZWZpeFNwbGl0WzBdO1xuICAgICAgICAgIGNvbnN0IHJlYWxQcmVmaXggPSBwcmVmaXhTcGxpdC5wb3AoKTtcbiAgICAgICAgICBjb25zdCBtb2R1bGVTZWFyY2hQYXRoID0gcHJlZml4U3BsaXQuam9pbignLycpO1xuXG4gICAgICAgICAgLy8gZ2V0IHRoZSBhbGlhcyBjb25maWdzIGZvciB0aGUgc3BlY2lmaWMgbW9kdWxlXG4gICAgICAgICAgY29uc3QgYWxpYXNDb25maWcgPSBBcnJheS5pc0FycmF5KHBsdWdpbkNvbmZpZ1sxXSlcbiAgICAgICAgICAgIC8vIHYxIG9mIHRoZSBwbHVnaW4gaXMgYW4gYXJyYXlcbiAgICAgICAgICAgID8gcGx1Z2luQ29uZmlnWzFdLmZpbHRlcihhbGlhcyA9PiBhbGlhcy5leHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGl0J3MgdjIgKGFuIG9iamVjdClcbiAgICAgICAgICAgIDogT2JqZWN0LmtleXMocGx1Z2luQ29uZmlnWzFdLmFsaWFzIHx8IHt9KVxuICAgICAgICAgICAgICAuZmlsdGVyKGV4cG9zZSA9PiBleHBvc2Uuc3RhcnRzV2l0aChtb2R1bGVQcmVmaXgpKVxuICAgICAgICAgICAgICAubWFwKGV4cCA9PiAoe1xuICAgICAgICAgICAgICAgIGV4cG9zZTogZXhwLFxuICAgICAgICAgICAgICAgIHNyYzogcGx1Z2luQ29uZmlnWzFdLmFsaWFzW2V4cF1cbiAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvb3RQcm9taXNlcy5jb25jYXQoYWxpYXNDb25maWcubWFwKFxuICAgICAgICAgICAgKGFsaWFzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFRoZSBzZWFyY2ggcGF0aCBpcyB0aGUgcGFyZW50IGRpcmVjdG9yeSBvZiB0aGUgc291cmNlIGRpcmVjdG9yeSBzcGVjaWZpZWQgaW4gLmJhYmVscmNcbiAgICAgICAgICAgICAgLy8gdGhlbiB3ZSBhcHBlbmQgdGhlIGBtb2R1bGVTZWFyY2hQYXRoYCB0byBnZXQgdGhlIHJlYWwgc2VhcmNoIHBhdGhcbiAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoUGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUocGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBhbGlhcy5zcmMpKSxcbiAgICAgICAgICAgICAgICBtb2R1bGVTZWFyY2hQYXRoXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9va3VwTG9jYWwocmVhbFByZWZpeCwgc2VhcmNoUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSkpLnRoZW4oXG4gICAgICAgICAgICAoc3VnZ2VzdGlvbnMpID0+IFtdLmNvbmNhdCguLi5zdWdnZXN0aW9ucylcbiAgICAgICAgICApLnRoZW4oc3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBzdWdnZXN0aW9ucyBhcmUgZnJvbSB0aGUgY29tcGF0aWJsZSBhbGlhc1xuICAgICAgICAgICAgaWYgKHByZWZpeCA9PT0gcmVhbFByZWZpeCAmJiBhbGlhc0NvbmZpZy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zLmZpbHRlcihzdWdnID0+XG4gICAgICAgICAgICAgICAgYWxpYXNDb25maWcuZmluZChhID0+IGEuZXhwb3NlID09PSBzdWdnLnRleHQpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW107XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV0aW9uUHJvdmlkZXI7XG4iXX0=