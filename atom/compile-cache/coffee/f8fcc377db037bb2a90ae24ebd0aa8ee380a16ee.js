(function() {
  var CompositeDisposable, Task, Transpiler, fs, languagebabelSchema, path, pathIsInside, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Task = ref.Task, CompositeDisposable = ref.CompositeDisposable;

  fs = require('fs-plus');

  path = require('path');

  pathIsInside = require('../node_modules/path-is-inside');

  languagebabelSchema = {
    type: 'object',
    properties: {
      babelMapsPath: {
        type: 'string'
      },
      babelMapsAddUrl: {
        type: 'boolean'
      },
      babelSourcePath: {
        type: 'string'
      },
      babelTranspilePath: {
        type: 'string'
      },
      createMap: {
        type: 'boolean'
      },
      createTargetDirectories: {
        type: 'boolean'
      },
      createTranspiledCode: {
        type: 'boolean'
      },
      disableWhenNoBabelrcFileInPath: {
        type: 'boolean'
      },
      projectRoot: {
        type: 'boolean'
      },
      suppressSourcePathMessages: {
        type: 'boolean'
      },
      suppressTranspileOnSaveMessages: {
        type: 'boolean'
      },
      transpileOnSave: {
        type: 'boolean'
      }
    },
    additionalProperties: false
  };

  Transpiler = (function() {
    Transpiler.prototype.fromGrammarName = 'Babel ES6 JavaScript';

    Transpiler.prototype.fromScopeName = 'source.js.jsx';

    Transpiler.prototype.toScopeName = 'source.js.jsx';

    function Transpiler() {
      this.commandTranspileDirectories = bind(this.commandTranspileDirectories, this);
      this.commandTranspileDirectory = bind(this.commandTranspileDirectory, this);
      this.reqId = 0;
      this.babelTranspilerTasks = {};
      this.babelTransformerPath = require.resolve('./transpiler-task');
      this.transpileErrorNotifications = {};
      this.deprecateConfig();
      this.disposables = new CompositeDisposable();
      if (this.getConfig().transpileOnSave || this.getConfig().allowLocalOverride) {
        this.disposables.add(atom.contextMenu.add({
          '.tree-view .directory > .header > .name': [
            {
              label: 'Language-Babel',
              submenu: [
                {
                  label: 'Transpile Directory ',
                  command: 'language-babel:transpile-directory'
                }, {
                  label: 'Transpile Directories',
                  command: 'language-babel:transpile-directories'
                }
              ]
            }, {
              'type': 'separator'
            }
          ]
        }));
        this.disposables.add(atom.commands.add('.tree-view .directory > .header > .name', 'language-babel:transpile-directory', this.commandTranspileDirectory));
        this.disposables.add(atom.commands.add('.tree-view .directory > .header > .name', 'language-babel:transpile-directories', this.commandTranspileDirectories));
      }
    }

    Transpiler.prototype.transform = function(code, arg) {
      var babelOptions, config, filePath, msgObject, pathTo, reqId, sourceMap;
      filePath = arg.filePath, sourceMap = arg.sourceMap;
      config = this.getConfig();
      pathTo = this.getPaths(filePath, config);
      this.createTask(pathTo.projectPath);
      babelOptions = {
        filename: filePath,
        ast: false
      };
      if (sourceMap) {
        babelOptions.sourceMaps = sourceMap;
      }
      if (this.babelTranspilerTasks[pathTo.projectPath]) {
        reqId = this.reqId++;
        msgObject = {
          reqId: reqId,
          command: 'transpileCode',
          pathTo: pathTo,
          code: code,
          babelOptions: babelOptions
        };
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var err;
          try {
            _this.babelTranspilerTasks[pathTo.projectPath].send(msgObject);
          } catch (error) {
            err = error;
            delete _this.babelTranspilerTasks[pathTo.projectPath];
            reject("Error " + err + " sending to transpile task with PID " + _this.babelTranspilerTasks[pathTo.projectPath].childProcess.pid);
          }
          return _this.babelTranspilerTasks[pathTo.projectPath].once("transpile:" + reqId, function(msgRet) {
            if (msgRet.err != null) {
              return reject("Babel v" + msgRet.babelVersion + "\n" + msgRet.err.message + "\n" + msgRet.babelCoreUsed);
            } else {
              msgRet.sourceMap = msgRet.map;
              return resolve(msgRet);
            }
          });
        };
      })(this));
    };

    Transpiler.prototype.commandTranspileDirectory = function(arg) {
      var target;
      target = arg.target;
      return this.transpileDirectory({
        directory: target.dataset.path
      });
    };

    Transpiler.prototype.commandTranspileDirectories = function(arg) {
      var target;
      target = arg.target;
      return this.transpileDirectory({
        directory: target.dataset.path,
        recursive: true
      });
    };

    Transpiler.prototype.transpileDirectory = function(options) {
      var directory, recursive;
      directory = options.directory;
      recursive = options.recursive || false;
      return fs.readdir(directory, (function(_this) {
        return function(err, files) {
          if (err == null) {
            return files.map(function(file) {
              var fqFileName;
              fqFileName = path.join(directory, file);
              return fs.stat(fqFileName, function(err, stats) {
                if (err == null) {
                  if (stats.isFile()) {
                    if (/\.min\.[a-z]+$/.test(fqFileName)) {
                      return;
                    }
                    if (/\.(js|jsx|es|es6|babel)$/.test(fqFileName)) {
                      return _this.transpile(file, null, _this.getConfigAndPathTo(fqFileName));
                    }
                  } else if (recursive && stats.isDirectory()) {
                    return _this.transpileDirectory({
                      directory: fqFileName,
                      recursive: true
                    });
                  }
                }
              });
            });
          }
        };
      })(this));
    };

    Transpiler.prototype.transpile = function(sourceFile, textEditor, configAndPathTo) {
      var babelOptions, config, err, msgObject, pathTo, ref1, reqId;
      if (configAndPathTo != null) {
        config = configAndPathTo.config, pathTo = configAndPathTo.pathTo;
      } else {
        ref1 = this.getConfigAndPathTo(sourceFile), config = ref1.config, pathTo = ref1.pathTo;
      }
      if (config.transpileOnSave !== true) {
        return;
      }
      if (config.disableWhenNoBabelrcFileInPath) {
        if (!this.isBabelrcInPath(pathTo.sourceFileDir)) {
          return;
        }
      }
      if (!pathIsInside(pathTo.sourceFile, pathTo.sourceRoot)) {
        if (!config.suppressSourcePathMessages) {
          atom.notifications.addWarning('LB: Babel file is not inside the "Babel Source Path" directory.', {
            dismissable: false,
            detail: "No transpiled code output for file \n" + pathTo.sourceFile + " \n\nTo suppress these 'invalid source path' messages use language-babel package settings"
          });
        }
        return;
      }
      babelOptions = this.getBabelOptions(config);
      this.cleanNotifications(pathTo);
      this.createTask(pathTo.projectPath);
      if (this.babelTranspilerTasks[pathTo.projectPath]) {
        reqId = this.reqId++;
        msgObject = {
          reqId: reqId,
          command: 'transpile',
          pathTo: pathTo,
          babelOptions: babelOptions
        };
        try {
          this.babelTranspilerTasks[pathTo.projectPath].send(msgObject);
        } catch (error) {
          err = error;
          console.log("Error " + err + " sending to transpile task with PID " + this.babelTranspilerTasks[pathTo.projectPath].childProcess.pid);
          delete this.babelTranspilerTasks[pathTo.projectPath];
          this.createTask(pathTo.projectPath);
          console.log("Restarted transpile task with PID " + this.babelTranspilerTasks[pathTo.projectPath].childProcess.pid);
          this.babelTranspilerTasks[pathTo.projectPath].send(msgObject);
        }
        return this.babelTranspilerTasks[pathTo.projectPath].once("transpile:" + reqId, (function(_this) {
          return function(msgRet) {
            var mapJson, ref2, ref3, ref4, xssiProtection;
            if ((ref2 = msgRet.result) != null ? ref2.ignored : void 0) {
              return;
            }
            if (msgRet.err) {
              if (msgRet.err.stack) {
                return _this.transpileErrorNotifications[pathTo.sourceFile] = atom.notifications.addError("LB: Babel Transpiler Error", {
                  dismissable: true,
                  detail: msgRet.err.message + "\n \n" + msgRet.babelCoreUsed + "\n \n" + msgRet.err.stack
                });
              } else {
                _this.transpileErrorNotifications[pathTo.sourceFile] = atom.notifications.addError("LB: Babel v" + msgRet.babelVersion + " Transpiler Error", {
                  dismissable: true,
                  detail: msgRet.err.message + "\n \n" + msgRet.babelCoreUsed + "\n \n" + msgRet.err.codeFrame
                });
                if ((((ref3 = msgRet.err.loc) != null ? ref3.line : void 0) != null) && (textEditor != null ? textEditor.alive : void 0)) {
                  return textEditor.setCursorBufferPosition([msgRet.err.loc.line - 1, msgRet.err.loc.column]);
                }
              }
            } else {
              if (!config.suppressTranspileOnSaveMessages) {
                atom.notifications.addInfo("LB: Babel v" + msgRet.babelVersion + " Transpiler Success", {
                  detail: pathTo.sourceFile + "\n \n" + msgRet.babelCoreUsed
                });
              }
              if (!config.createTranspiledCode) {
                if (!config.suppressTranspileOnSaveMessages) {
                  atom.notifications.addInfo('LB: No transpiled output configured');
                }
                return;
              }
              if (pathTo.sourceFile === pathTo.transpiledFile) {
                atom.notifications.addWarning('LB: Transpiled file would overwrite source file. Aborted!', {
                  dismissable: true,
                  detail: pathTo.sourceFile
                });
                return;
              }
              if (config.createTargetDirectories) {
                fs.makeTreeSync(path.parse(pathTo.transpiledFile).dir);
              }
              if (config.babelMapsAddUrl) {
                msgRet.result.code = msgRet.result.code + '\n' + '//# sourceMappingURL=' + pathTo.mapFile;
              }
              fs.writeFileSync(pathTo.transpiledFile, msgRet.result.code);
              if (config.createMap && ((ref4 = msgRet.result.map) != null ? ref4.version : void 0)) {
                if (config.createTargetDirectories) {
                  fs.makeTreeSync(path.parse(pathTo.mapFile).dir);
                }
                mapJson = {
                  version: msgRet.result.map.version,
                  sources: pathTo.sourceFile,
                  file: pathTo.transpiledFile,
                  sourceRoot: '',
                  names: msgRet.result.map.names,
                  mappings: msgRet.result.map.mappings
                };
                xssiProtection = ')]}\n';
                return fs.writeFileSync(pathTo.mapFile, xssiProtection + JSON.stringify(mapJson, null, ' '));
              }
            }
          };
        })(this));
      }
    };

    Transpiler.prototype.cleanNotifications = function(pathTo) {
      var i, n, ref1, results, sf;
      if (this.transpileErrorNotifications[pathTo.sourceFile] != null) {
        this.transpileErrorNotifications[pathTo.sourceFile].dismiss();
        delete this.transpileErrorNotifications[pathTo.sourceFile];
      }
      ref1 = this.transpileErrorNotifications;
      for (sf in ref1) {
        n = ref1[sf];
        if (n.dismissed) {
          delete this.transpileErrorNotifications[sf];
        }
      }
      i = atom.notifications.notifications.length - 1;
      results = [];
      while (i >= 0) {
        if (atom.notifications.notifications[i].dismissed && atom.notifications.notifications[i].message.substring(0, 3) === "LB:") {
          atom.notifications.notifications.splice(i, 1);
        }
        results.push(i--);
      }
      return results;
    };

    Transpiler.prototype.createTask = function(projectPath) {
      var base;
      return (base = this.babelTranspilerTasks)[projectPath] != null ? base[projectPath] : base[projectPath] = Task.once(this.babelTransformerPath, projectPath, (function(_this) {
        return function() {
          return delete _this.babelTranspilerTasks[projectPath];
        };
      })(this));
    };

    Transpiler.prototype.deprecateConfig = function() {
      if (atom.config.get('language-babel.supressTranspileOnSaveMessages') != null) {
        atom.config.set('language-babel.suppressTranspileOnSaveMessages', atom.config.get('language-babel.supressTranspileOnSaveMessages'));
      }
      if (atom.config.get('language-babel.supressSourcePathMessages') != null) {
        atom.config.set('language-babel.suppressSourcePathMessages', atom.config.get('language-babel.supressSourcePathMessages'));
      }
      atom.config.unset('language-babel.supressTranspileOnSaveMessages');
      atom.config.unset('language-babel.supressSourcePathMessages');
      atom.config.unset('language-babel.useInternalScanner');
      atom.config.unset('language-babel.stopAtProjectDirectory');
      atom.config.unset('language-babel.babelStage');
      atom.config.unset('language-babel.externalHelpers');
      atom.config.unset('language-babel.moduleLoader');
      atom.config.unset('language-babel.blacklistTransformers');
      atom.config.unset('language-babel.whitelistTransformers');
      atom.config.unset('language-babel.looseTransformers');
      atom.config.unset('language-babel.optionalTransformers');
      atom.config.unset('language-babel.plugins');
      atom.config.unset('language-babel.presets');
      return atom.config.unset('language-babel.formatJSX');
    };

    Transpiler.prototype.getBabelOptions = function(config) {
      var babelOptions;
      babelOptions = {
        code: true
      };
      if (config.createMap) {
        babelOptions.sourceMaps = config.createMap;
      }
      return babelOptions;
    };

    Transpiler.prototype.getConfigAndPathTo = function(sourceFile) {
      var config, localConfig, pathTo;
      config = this.getConfig();
      pathTo = this.getPaths(sourceFile, config);
      if (config.allowLocalOverride) {
        if (this.jsonSchema == null) {
          this.jsonSchema = (require('../node_modules/jjv'))();
          this.jsonSchema.addSchema('localConfig', languagebabelSchema);
        }
        localConfig = this.getLocalConfig(pathTo.sourceFileDir, pathTo.projectPath, {});
        this.merge(config, localConfig);
        pathTo = this.getPaths(sourceFile, config);
      }
      return {
        config: config,
        pathTo: pathTo
      };
    };

    Transpiler.prototype.getConfig = function() {
      return atom.config.get('language-babel');
    };

    Transpiler.prototype.getLocalConfig = function(fromDir, toDir, localConfig) {
      var err, fileContent, isProjectRoot, jsonContent, languageBabelCfgFile, localConfigFile, schemaErrors;
      localConfigFile = '.languagebabel';
      languageBabelCfgFile = path.join(fromDir, localConfigFile);
      if (fs.existsSync(languageBabelCfgFile)) {
        fileContent = fs.readFileSync(languageBabelCfgFile, 'utf8');
        try {
          jsonContent = JSON.parse(fileContent);
        } catch (error) {
          err = error;
          atom.notifications.addError("LB: " + localConfigFile + " " + err.message, {
            dismissable: true,
            detail: "File = " + languageBabelCfgFile + "\n\n" + fileContent
          });
          return;
        }
        schemaErrors = this.jsonSchema.validate('localConfig', jsonContent);
        if (schemaErrors) {
          atom.notifications.addError("LB: " + localConfigFile + " configuration error", {
            dismissable: true,
            detail: "File = " + languageBabelCfgFile + "\n\n" + fileContent
          });
        } else {
          isProjectRoot = jsonContent.projectRoot;
          this.merge(jsonContent, localConfig);
          if (isProjectRoot) {
            jsonContent.projectRootDir = fromDir;
          }
          localConfig = jsonContent;
        }
      }
      if (fromDir !== toDir) {
        if (fromDir === path.dirname(fromDir)) {
          return localConfig;
        }
        if (isProjectRoot) {
          return localConfig;
        }
        return this.getLocalConfig(path.dirname(fromDir), toDir, localConfig);
      } else {
        return localConfig;
      }
    };

    Transpiler.prototype.getPaths = function(sourceFile, config) {
      var absMapFile, absMapsRoot, absProjectPath, absSourceRoot, absTranspileRoot, absTranspiledFile, parsedSourceFile, projectContainingSource, relMapsPath, relSourcePath, relSourceRootToSourceFile, relTranspilePath, sourceFileInProject;
      projectContainingSource = atom.project.relativizePath(sourceFile);
      if (projectContainingSource[0] === null) {
        sourceFileInProject = false;
      } else {
        sourceFileInProject = true;
      }
      if (config.projectRootDir != null) {
        absProjectPath = path.normalize(config.projectRootDir);
      } else if (projectContainingSource[0] === null) {
        absProjectPath = path.parse(sourceFile).root;
      } else {
        absProjectPath = path.normalize(path.join(projectContainingSource[0], '.'));
      }
      relSourcePath = path.normalize(config.babelSourcePath);
      relTranspilePath = path.normalize(config.babelTranspilePath);
      relMapsPath = path.normalize(config.babelMapsPath);
      absSourceRoot = path.join(absProjectPath, relSourcePath);
      absTranspileRoot = path.join(absProjectPath, relTranspilePath);
      absMapsRoot = path.join(absProjectPath, relMapsPath);
      parsedSourceFile = path.parse(sourceFile);
      relSourceRootToSourceFile = path.relative(absSourceRoot, parsedSourceFile.dir);
      absTranspiledFile = path.join(absTranspileRoot, relSourceRootToSourceFile, parsedSourceFile.name + '.js');
      absMapFile = path.join(absMapsRoot, relSourceRootToSourceFile, parsedSourceFile.name + '.js.map');
      return {
        sourceFileInProject: sourceFileInProject,
        sourceFile: sourceFile,
        sourceFileDir: parsedSourceFile.dir,
        mapFile: absMapFile,
        transpiledFile: absTranspiledFile,
        sourceRoot: absSourceRoot,
        projectPath: absProjectPath
      };
    };

    Transpiler.prototype.isBabelrcInPath = function(fromDir) {
      var babelrc, babelrcFile;
      babelrc = '.babelrc';
      babelrcFile = path.join(fromDir, babelrc);
      if (fs.existsSync(babelrcFile)) {
        return true;
      }
      if (fromDir !== path.dirname(fromDir)) {
        return this.isBabelrcInPath(path.dirname(fromDir));
      } else {
        return false;
      }
    };

    Transpiler.prototype.merge = function(targetObj, sourceObj) {
      var prop, results, val;
      results = [];
      for (prop in sourceObj) {
        val = sourceObj[prop];
        results.push(targetObj[prop] = val);
      }
      return results;
    };

    Transpiler.prototype.stopTranspilerTask = function(projectPath) {
      var msgObject;
      msgObject = {
        command: 'stop'
      };
      return this.babelTranspilerTasks[projectPath].send(msgObject);
    };

    Transpiler.prototype.stopAllTranspilerTask = function() {
      var projectPath, ref1, results, v;
      ref1 = this.babelTranspilerTasks;
      results = [];
      for (projectPath in ref1) {
        v = ref1[projectPath];
        results.push(this.stopTranspilerTask(projectPath));
      }
      return results;
    };

    Transpiler.prototype.stopUnusedTasks = function() {
      var atomProjectPath, atomProjectPaths, isTaskInCurrentProject, j, len, projectTaskPath, ref1, results, v;
      atomProjectPaths = atom.project.getPaths();
      ref1 = this.babelTranspilerTasks;
      results = [];
      for (projectTaskPath in ref1) {
        v = ref1[projectTaskPath];
        isTaskInCurrentProject = false;
        for (j = 0, len = atomProjectPaths.length; j < len; j++) {
          atomProjectPath = atomProjectPaths[j];
          if (pathIsInside(projectTaskPath, atomProjectPath)) {
            isTaskInCurrentProject = true;
            break;
          }
        }
        if (!isTaskInCurrentProject) {
          results.push(this.stopTranspilerTask(projectTaskPath));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return Transpiler;

  })();

  module.exports = Transpiler;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvbGliL3RyYW5zcGlsZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1RkFBQTtJQUFBOztFQUFBLE1BQStCLE9BQUEsQ0FBUSxNQUFSLENBQS9CLEVBQUMsZUFBRCxFQUFPOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQ0FBUjs7RUFHZixtQkFBQSxHQUFzQjtJQUNwQixJQUFBLEVBQU0sUUFEYztJQUVwQixVQUFBLEVBQVk7TUFDVixhQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFFBQVI7T0FEeEI7TUFFVixlQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FGeEI7TUFHVixlQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFFBQVI7T0FIeEI7TUFJVixrQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BSnhCO01BS1YsU0FBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BTHhCO01BTVYsdUJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQU54QjtNQU9WLG9CQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FQeEI7TUFRViw4QkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BUnhCO01BU1YsV0FBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BVHhCO01BVVYsMEJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVZ4QjtNQVdWLCtCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FYeEI7TUFZVixlQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FaeEI7S0FGUTtJQWdCcEIsb0JBQUEsRUFBc0IsS0Fo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a0RBQUE7O1VBQ0UsSUFBRyxZQUFBLENBQWEsZUFBYixFQUE4QixlQUE5QixDQUFIO1lBQ0Usc0JBQUEsR0FBeUI7QUFDekIsa0JBRkY7O0FBREY7UUFJQSxJQUFHLENBQUksc0JBQVA7dUJBQW1DLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixlQUFwQixHQUFuQztTQUFBLE1BQUE7K0JBQUE7O0FBTkY7O0lBRmU7Ozs7OztFQVVuQixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXRhakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGFzaywgQ29tcG9zaXRlRGlzcG9zYWJsZSB9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xucGF0aElzSW5zaWRlID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3BhdGgtaXMtaW5zaWRlJ1xuXG4jIHNldHVwIEpTT04gU2NoZW1hIHRvIHBhcnNlIC5sYW5ndWFnZWJhYmVsIGNvbmZpZ3Ncbmxhbmd1YWdlYmFiZWxTY2hlbWEgPSB7XG4gIHR5cGU6ICdvYmplY3QnLFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgYmFiZWxNYXBzUGF0aDogICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBiYWJlbE1hcHNBZGRVcmw6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBiYWJlbFNvdXJjZVBhdGg6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGJhYmVsVHJhbnNwaWxlUGF0aDogICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgY3JlYXRlTWFwOiAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXM6ICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgY3JlYXRlVHJhbnNwaWxlZENvZGU6ICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgZGlzYWJsZVdoZW5Ob0JhYmVscmNGaWxlSW5QYXRoOiAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgcHJvamVjdFJvb3Q6ICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXM6ICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlczogIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgdHJhbnNwaWxlT25TYXZlOiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH1cbiAgfSxcbiAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlXG59XG5cbmNsYXNzIFRyYW5zcGlsZXJcblxuICBmcm9tR3JhbW1hck5hbWU6ICdCYWJlbCBFUzYgSmF2YVNjcmlwdCdcbiAgZnJvbVNjb3BlTmFtZTogJ3NvdXJjZS5qcy5qc3gnXG4gIHRvU2NvcGVOYW1lOiAnc291cmNlLmpzLmpzeCdcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVxSWQgPSAwXG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzID0ge31cbiAgICBAYmFiZWxUcmFuc2Zvcm1lclBhdGggPSByZXF1aXJlLnJlc29sdmUgJy4vdHJhbnNwaWxlci10YXNrJ1xuICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnMgPSB7fVxuICAgIEBkZXByZWNhdGVDb25maWcoKVxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBpZiBAZ2V0Q29uZmlnKCkudHJhbnNwaWxlT25TYXZlIG9yIEBnZXRDb25maWcoKS5hbGxvd0xvY2FsT3ZlcnJpZGVcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb250ZXh0TWVudS5hZGQge1xuICAgICAgICAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJzogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ0xhbmd1YWdlLUJhYmVsJ1xuICAgICAgICAgICAgICBzdWJtZW51OiBbXG4gICAgICAgICAgICAgICAge2xhYmVsOiAnVHJhbnNwaWxlIERpcmVjdG9yeSAnLCBjb21tYW5kOiAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yeSd9XG4gICAgICAgICAgICAgICAge2xhYmVsOiAnVHJhbnNwaWxlIERpcmVjdG9yaWVzJywgY29tbWFuZDogJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3Rvcmllcyd9XG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHsndHlwZSc6ICdzZXBhcmF0b3InIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmRpcmVjdG9yeSA+IC5oZWFkZXIgPiAubmFtZScsICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3J5JywgQGNvbW1hbmRUcmFuc3BpbGVEaXJlY3RvcnlcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmRpcmVjdG9yeSA+IC5oZWFkZXIgPiAubmFtZScsICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3JpZXMnLCBAY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yaWVzXG5cbiAgIyBtZXRob2QgdXNlZCBieSBzb3VyY2UtcHJldmlldyB0byBzZWUgdHJhbnNwaWxlZCBjb2RlXG4gIHRyYW5zZm9ybTogKGNvZGUsIHtmaWxlUGF0aCwgc291cmNlTWFwfSkgLT5cbiAgICBjb25maWcgPSBAZ2V0Q29uZmlnKClcbiAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgZmlsZVBhdGgsIGNvbmZpZ1xuICAgICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuICAgIGJhYmVsT3B0aW9ucyA9XG4gICAgICBmaWxlbmFtZTogZmlsZVBhdGhcbiAgICAgIGFzdDogZmFsc2VcbiAgICBpZiBzb3VyY2VNYXAgdGhlbiBiYWJlbE9wdGlvbnMuc291cmNlTWFwcyA9IHNvdXJjZU1hcFxuICAgICMgb2sgbm93IHRyYW5zcGlsZSBpbiB0aGUgdGFzayBhbmQgd2FpdCBvbiB0aGUgcmVzdWx0XG4gICAgaWYgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgIHJlcUlkID0gQHJlcUlkKytcbiAgICAgIG1zZ09iamVjdCA9XG4gICAgICAgIHJlcUlkOiByZXFJZFxuICAgICAgICBjb21tYW5kOiAndHJhbnNwaWxlQ29kZSdcbiAgICAgICAgcGF0aFRvOiBwYXRoVG9cbiAgICAgICAgY29kZTogY29kZVxuICAgICAgICBiYWJlbE9wdGlvbnM6IGJhYmVsT3B0aW9uc1xuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCApID0+XG4gICAgICAjIHRyYW5zcGlsZSBpbiB0YXNrXG4gICAgICB0cnlcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICAgIHJlamVjdChcIkVycm9yICN7ZXJyfSBzZW5kaW5nIHRvIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIilcbiAgICAgICMgZ2V0IHJlc3VsdCBmcm9tIHRhc2sgZm9yIHRoaXMgcmVxSWRcbiAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLm9uY2UgXCJ0cmFuc3BpbGU6I3tyZXFJZH1cIiwgKG1zZ1JldCkgPT5cbiAgICAgICAgaWYgbXNnUmV0LmVycj9cbiAgICAgICAgICByZWplY3QoXCJCYWJlbCB2I3ttc2dSZXQuYmFiZWxWZXJzaW9ufVxcbiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBtc2dSZXQuc291cmNlTWFwID0gbXNnUmV0Lm1hcFxuICAgICAgICAgIHJlc29sdmUobXNnUmV0KVxuXG4gICMgY2FsbGVkIGJ5IGNvbW1hbmRcbiAgY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yeTogKHt0YXJnZXR9KSA9PlxuICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogdGFyZ2V0LmRhdGFzZXQucGF0aCB9XG5cbiAgIyBjYWxsZWQgYnkgY29tbWFuZFxuICBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3JpZXM6ICh7dGFyZ2V0fSkgPT5cbiAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IHRhcmdldC5kYXRhc2V0LnBhdGgsIHJlY3Vyc2l2ZTogdHJ1ZX1cblxuICAjIHRyYW5zcGlsZSBhbGwgZmlsZXMgaW4gYSBkaXJlY3Rvcnkgb3IgcmVjdXJzaXZlIGRpcmVjdG9yaWVzXG4gICMgb3B0aW9ucyBhcmUgeyBkaXJlY3Rvcnk6IG5hbWUsIHJlY3Vyc2l2ZTogdHJ1ZXxmYWxzZX1cbiAgdHJhbnNwaWxlRGlyZWN0b3J5OiAob3B0aW9ucykgLT5cbiAgICBkaXJlY3RvcnkgPSBvcHRpb25zLmRpcmVjdG9yeVxuICAgIHJlY3Vyc2l2ZSA9IG9wdGlvbnMucmVjdXJzaXZlIG9yIGZhbHNlXG4gICAgZnMucmVhZGRpciBkaXJlY3RvcnksIChlcnIsZmlsZXMpID0+XG4gICAgICBpZiBub3QgZXJyP1xuICAgICAgICBmaWxlcy5tYXAgKGZpbGUpID0+XG4gICAgICAgICAgZnFGaWxlTmFtZSA9IHBhdGguam9pbihkaXJlY3RvcnksIGZpbGUpXG4gICAgICAgICAgZnMuc3RhdCBmcUZpbGVOYW1lLCAoZXJyLCBzdGF0cykgPT5cbiAgICAgICAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgICAgICAgIGlmIHN0YXRzLmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIC9cXC5taW5cXC5bYS16XSskLy50ZXN0IGZxRmlsZU5hbWUgIyBubyBtaW5pbWl6ZWQgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiAvXFwuKGpzfGpzeHxlc3xlczZ8YmFiZWwpJC8udGVzdCBmcUZpbGVOYW1lICMgb25seSBqc1xuICAgICAgICAgICAgICAgICAgQHRyYW5zcGlsZSBmaWxlLCBudWxsLCBAZ2V0Q29uZmlnQW5kUGF0aFRvIGZxRmlsZU5hbWVcbiAgICAgICAgICAgICAgZWxzZSBpZiByZWN1cnNpdmUgYW5kIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IGZxRmlsZU5hbWUsIHJlY3Vyc2l2ZTogdHJ1ZX1cblxuICAjIHRyYW5zcGlsZSBzb3VyY2VGaWxlIGVkaXRlZCBieSB0aGUgb3B0aW9uYWwgdGV4dEVkaXRvclxuICB0cmFuc3BpbGU6IChzb3VyY2VGaWxlLCB0ZXh0RWRpdG9yLCBjb25maWdBbmRQYXRoVG8pIC0+XG4gICAgIyBnZXQgY29uZmlnXG4gICAgaWYgY29uZmlnQW5kUGF0aFRvP1xuICAgICAgeyBjb25maWcsIHBhdGhUbyB9ID0gY29uZmlnQW5kUGF0aFRvXG4gICAgZWxzZVxuICAgICAge2NvbmZpZywgcGF0aFRvIH0gPSBAZ2V0Q29uZmlnQW5kUGF0aFRvKHNvdXJjZUZpbGUpXG5cbiAgICByZXR1cm4gaWYgY29uZmlnLnRyYW5zcGlsZU9uU2F2ZSBpc250IHRydWVcblxuICAgIGlmIGNvbmZpZy5kaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGhcbiAgICAgIGlmIG5vdCBAaXNCYWJlbHJjSW5QYXRoIHBhdGhUby5zb3VyY2VGaWxlRGlyXG4gICAgICAgIHJldHVyblxuXG4gICAgaWYgbm90IHBhdGhJc0luc2lkZShwYXRoVG8uc291cmNlRmlsZSwgcGF0aFRvLnNvdXJjZVJvb3QpXG4gICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzU291cmNlUGF0aE1lc3NhZ2VzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nICdMQjogQmFiZWwgZmlsZSBpcyBub3QgaW5zaWRlIHRoZSBcIkJhYmVsIFNvdXJjZSBQYXRoXCIgZGlyZWN0b3J5LicsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IGZhbHNlXG4gICAgICAgICAgZGV0YWlsOiBcIk5vIHRyYW5zcGlsZWQgY29kZSBvdXRwdXQgZm9yIGZpbGUgXFxuI3twYXRoVG8uc291cmNlRmlsZX1cbiAgICAgICAgICAgIFxcblxcblRvIHN1cHByZXNzIHRoZXNlICdpbnZhbGlkIHNvdXJjZSBwYXRoJ1xuICAgICAgICAgICAgbWVzc2FnZXMgdXNlIGxhbmd1YWdlLWJhYmVsIHBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgcmV0dXJuXG5cbiAgICBiYWJlbE9wdGlvbnMgPSBAZ2V0QmFiZWxPcHRpb25zIGNvbmZpZ1xuXG4gICAgQGNsZWFuTm90aWZpY2F0aW9ucyhwYXRoVG8pXG5cbiAgICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgICBAY3JlYXRlVGFzayBwYXRoVG8ucHJvamVjdFBhdGhcblxuICAgICMgb2sgbm93IHRyYW5zcGlsZSBpbiB0aGUgdGFzayBhbmQgd2FpdCBvbiB0aGUgcmVzdWx0XG4gICAgaWYgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgIHJlcUlkID0gQHJlcUlkKytcbiAgICAgIG1zZ09iamVjdCA9XG4gICAgICAgIHJlcUlkOiByZXFJZFxuICAgICAgICBjb21tYW5kOiAndHJhbnNwaWxlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBiYWJlbE9wdGlvbnM6IGJhYmVsT3B0aW9uc1xuXG4gICAgICAjIHRyYW5zcGlsZSBpbiB0YXNrXG4gICAgICB0cnlcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgY29uc29sZS5sb2cgXCJFcnJvciAje2Vycn0gc2VuZGluZyB0byB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuICAgICAgICBjb25zb2xlLmxvZyBcIlJlc3RhcnRlZCB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiAgICAgICMgZ2V0IHJlc3VsdCBmcm9tIHRhc2sgZm9yIHRoaXMgcmVxSWRcbiAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLm9uY2UgXCJ0cmFuc3BpbGU6I3tyZXFJZH1cIiwgKG1zZ1JldCkgPT5cbiAgICAgICAgIyAuaWdub3JlZCBpcyByZXR1cm5lZCB3aGVuIC5iYWJlbHJjIGlnbm9yZS9vbmx5IGZsYWdzIGFyZSB1c2VkXG4gICAgICAgIGlmIG1zZ1JldC5yZXN1bHQ/Lmlnbm9yZWQgdGhlbiByZXR1cm5cbiAgICAgICAgaWYgbXNnUmV0LmVyclxuICAgICAgICAgIGlmIG1zZ1JldC5lcnIuc3RhY2tcbiAgICAgICAgICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdID1cbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEJhYmVsIFRyYW5zcGlsZXIgRXJyb3JcIixcbiAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIGRldGFpbDogXCIje21zZ1JldC5lcnIubWVzc2FnZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cXG4gXFxuI3ttc2dSZXQuZXJyLnN0YWNrfVwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0gPVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn0gVHJhbnNwaWxlciBFcnJvclwiLFxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVxcbiBcXG4je21zZ1JldC5lcnIuY29kZUZyYW1lfVwiXG4gICAgICAgICAgICAjIGlmIHdlIGhhdmUgYSBsaW5lL2NvbCBzeW50YXggZXJyb3IganVtcCB0byB0aGUgcG9zaXRpb25cbiAgICAgICAgICAgIGlmIG1zZ1JldC5lcnIubG9jPy5saW5lPyBhbmQgdGV4dEVkaXRvcj8uYWxpdmVcbiAgICAgICAgICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiBbbXNnUmV0LmVyci5sb2MubGluZS0xLCBtc2dSZXQuZXJyLmxvYy5jb2x1bW5dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXNcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvIFwiTEI6IEJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259IFRyYW5zcGlsZXIgU3VjY2Vzc1wiLFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiI3twYXRoVG8uc291cmNlRmlsZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIlxuXG4gICAgICAgICAgaWYgbm90IGNvbmZpZy5jcmVhdGVUcmFuc3BpbGVkQ29kZVxuICAgICAgICAgICAgaWYgbm90IGNvbmZpZy5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzXG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvICdMQjogTm8gdHJhbnNwaWxlZCBvdXRwdXQgY29uZmlndXJlZCdcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGlmIHBhdGhUby5zb3VyY2VGaWxlIGlzIHBhdGhUby50cmFuc3BpbGVkRmlsZVxuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgJ0xCOiBUcmFuc3BpbGVkIGZpbGUgd291bGQgb3ZlcndyaXRlIHNvdXJjZSBmaWxlLiBBYm9ydGVkIScsXG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgIGRldGFpbDogcGF0aFRvLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgIyB3cml0ZSBjb2RlIGFuZCBtYXBzXG4gICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZVRhcmdldERpcmVjdG9yaWVzXG4gICAgICAgICAgICBmcy5tYWtlVHJlZVN5bmMoIHBhdGgucGFyc2UoIHBhdGhUby50cmFuc3BpbGVkRmlsZSkuZGlyKVxuXG4gICAgICAgICAgIyBhZGQgc291cmNlIG1hcCB1cmwgdG8gY29kZSBpZiBmaWxlIGlzbid0IGlnbm9yZWRcbiAgICAgICAgICBpZiBjb25maWcuYmFiZWxNYXBzQWRkVXJsXG4gICAgICAgICAgICBtc2dSZXQucmVzdWx0LmNvZGUgPSBtc2dSZXQucmVzdWx0LmNvZGUgKyAnXFxuJyArICcvLyMgc291cmNlTWFwcGluZ1VSTD0nK3BhdGhUby5tYXBGaWxlXG5cbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIHBhdGhUby50cmFuc3BpbGVkRmlsZSwgbXNnUmV0LnJlc3VsdC5jb2RlXG5cbiAgICAgICAgICAjIHdyaXRlIHNvdXJjZSBtYXAgaWYgcmV0dXJuZWQgYW5kIGlmIGFza2VkXG4gICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZU1hcCBhbmQgbXNnUmV0LnJlc3VsdC5tYXA/LnZlcnNpb25cbiAgICAgICAgICAgIGlmIGNvbmZpZy5jcmVhdGVUYXJnZXREaXJlY3Rvcmllc1xuICAgICAgICAgICAgICBmcy5tYWtlVHJlZVN5bmMocGF0aC5wYXJzZShwYXRoVG8ubWFwRmlsZSkuZGlyKVxuICAgICAgICAgICAgbWFwSnNvbiA9XG4gICAgICAgICAgICAgIHZlcnNpb246IG1zZ1JldC5yZXN1bHQubWFwLnZlcnNpb25cbiAgICAgICAgICAgICAgc291cmNlczogIHBhdGhUby5zb3VyY2VGaWxlXG4gICAgICAgICAgICAgIGZpbGU6IHBhdGhUby50cmFuc3BpbGVkRmlsZVxuICAgICAgICAgICAgICBzb3VyY2VSb290OiAnJ1xuICAgICAgICAgICAgICBuYW1lczogbXNnUmV0LnJlc3VsdC5tYXAubmFtZXNcbiAgICAgICAgICAgICAgbWFwcGluZ3M6IG1zZ1JldC5yZXN1bHQubWFwLm1hcHBpbmdzXG4gICAgICAgICAgICB4c3NpUHJvdGVjdGlvbiA9ICcpXX1cXG4nXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIHBhdGhUby5tYXBGaWxlLFxuICAgICAgICAgICAgICB4c3NpUHJvdGVjdGlvbiArIEpTT04uc3RyaW5naWZ5IG1hcEpzb24sIG51bGwsICcgJ1xuXG4gICMgY2xlYW4gbm90aWZpY2F0aW9uIG1lc3NhZ2VzXG4gIGNsZWFuTm90aWZpY2F0aW9uczogKHBhdGhUbykgLT5cbiAgICAjIGF1dG8gZGlzbWlzcyBwcmV2aW91cyB0cmFuc3BpbGUgZXJyb3Igbm90aWZpY2F0aW9ucyBmb3IgdGhpcyBzb3VyY2UgZmlsZVxuICAgIGlmIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdP1xuICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0uZGlzbWlzcygpXG4gICAgICBkZWxldGUgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV1cbiAgICAjIHJlbW92ZSBhbnkgdXNlciBkaXNtaXNzZWQgbm90aWZpY2F0aW9uIG9iamVjdCByZWZlcmVuY2VzXG4gICAgZm9yIHNmLCBuIG9mIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNcbiAgICAgIGlmIG4uZGlzbWlzc2VkXG4gICAgICAgIGRlbGV0ZSBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3NmXVxuICAgICMgRklYIGZvciBhdG9tIG5vdGlmaWNhdGlvbnMuIGRpc21pc3NlZCBub2Z0aWZpY2F0aW9ucyB2aWEgd2hhdGV2ZXIgbWVhbnNcbiAgICAjIGFyZSBuZXZlciBhY3R1YWxseSByZW1vdmVkIGZyb20gbWVtb3J5LiBJIGNvbnNpZGVyIHRoaXMgYSBtZW1vcnkgbGVha1xuICAgICMgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzg2MTQgc28gcmVtb3ZlIGFueSBkaXNtaXNzZWRcbiAgICAjIG5vdGlmaWNhdGlvbiBvYmplY3RzIHByZWZpeGVkIHdpdGggYSBtZXNzYWdlIHByZWZpeCBvZiBMQjogZnJvbSBtZW1vcnlcbiAgICBpID0gYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMubGVuZ3RoIC0gMVxuICAgIHdoaWxlIGkgPj0gMFxuICAgICAgaWYgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNbaV0uZGlzbWlzc2VkIGFuZFxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNbaV0ubWVzc2FnZS5zdWJzdHJpbmcoMCwzKSBpcyBcIkxCOlwiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnNwbGljZSBpLCAxXG4gICAgICBpLS1cblxuICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgY3JlYXRlVGFzazogKHByb2plY3RQYXRoKSAtPlxuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF0gPz1cbiAgICAgIFRhc2sub25jZSBAYmFiZWxUcmFuc2Zvcm1lclBhdGgsIHByb2plY3RQYXRoLCA9PlxuICAgICAgICAjIHRhc2sgZW5kZWRcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF1cblxuICAjIG1vZGlmaWVzIGNvbmZpZyBvcHRpb25zIGZvciBjaGFuZ2VkIG9yIGRlcHJlY2F0ZWQgY29uZmlnc1xuICBkZXByZWNhdGVDb25maWc6IC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKT9cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbGFuZ3VhZ2UtYmFiZWwuc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycsXG4gICAgICAgIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJylcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKT9cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbGFuZ3VhZ2UtYmFiZWwuc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnLFxuICAgICAgICBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzU291cmNlUGF0aE1lc3NhZ2VzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwudXNlSW50ZXJuYWxTY2FubmVyJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuc3RvcEF0UHJvamVjdERpcmVjdG9yeScpXG4gICAgIyByZW1vdmUgYmFiZWwgVjUgb3B0aW9uc1xuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5iYWJlbFN0YWdlJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuZXh0ZXJuYWxIZWxwZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwubW9kdWxlTG9hZGVyJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuYmxhY2tsaXN0VHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwud2hpdGVsaXN0VHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwubG9vc2VUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5vcHRpb25hbFRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnBsdWdpbnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5wcmVzZXRzJylcbiAgICAjIHJlbW92ZSBvbGQgbmFtZSBpbmRlbnQgb3B0aW9uc1xuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5mb3JtYXRKU1gnKVxuXG4gICMgY2FsY3VsYXRlIGJhYmVsIG9wdGlvbnMgYmFzZWQgdXBvbiBwYWNrYWdlIGNvbmZpZywgYmFiZWxyYyBmaWxlcyBhbmRcbiAgIyB3aGV0aGVyIGludGVybmFsU2Nhbm5lciBpcyB1c2VkLlxuICBnZXRCYWJlbE9wdGlvbnM6IChjb25maWcpLT5cbiAgICAjIHNldCB0cmFuc3BpbGVyIG9wdGlvbnMgZnJvbSBwYWNrYWdlIGNvbmZpZ3VyYXRpb24uXG4gICAgYmFiZWxPcHRpb25zID1cbiAgICAgIGNvZGU6IHRydWVcbiAgICBpZiBjb25maWcuY3JlYXRlTWFwICB0aGVuIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzID0gY29uZmlnLmNyZWF0ZU1hcFxuICAgIGJhYmVsT3B0aW9uc1xuXG4gICNnZXQgY29uZmlndXJhdGlvbiBhbmQgcGF0aHNcbiAgZ2V0Q29uZmlnQW5kUGF0aFRvOiAoc291cmNlRmlsZSkgLT5cbiAgICBjb25maWcgPSBAZ2V0Q29uZmlnKClcbiAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgc291cmNlRmlsZSwgY29uZmlnXG5cbiAgICBpZiBjb25maWcuYWxsb3dMb2NhbE92ZXJyaWRlXG4gICAgICBpZiBub3QgQGpzb25TY2hlbWE/XG4gICAgICAgIEBqc29uU2NoZW1hID0gKHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9qanYnKSgpICMgdXNlIGpqdiBhcyBpdCBydW5zIHdpdGhvdXQgQ1NQIGlzc3Vlc1xuICAgICAgICBAanNvblNjaGVtYS5hZGRTY2hlbWEgJ2xvY2FsQ29uZmlnJywgbGFuZ3VhZ2ViYWJlbFNjaGVtYVxuICAgICAgbG9jYWxDb25maWcgPSBAZ2V0TG9jYWxDb25maWcgcGF0aFRvLnNvdXJjZUZpbGVEaXIsIHBhdGhUby5wcm9qZWN0UGF0aCwge31cbiAgICAgICMgbWVyZ2UgbG9jYWwgY29uZmlncyB3aXRoIGdsb2JhbC4gbG9jYWwgd2luc1xuICAgICAgQG1lcmdlIGNvbmZpZywgbG9jYWxDb25maWdcbiAgICAgICMgcmVjYWxjIHBhdGhzXG4gICAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgc291cmNlRmlsZSwgY29uZmlnXG4gICAgcmV0dXJuIHsgY29uZmlnLCBwYXRoVG8gfVxuXG4gICMgZ2V0IGdsb2JhbCBjb25maWd1cmF0aW9uIGZvciBsYW5ndWFnZS1iYWJlbFxuICBnZXRDb25maWc6IC0+IGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwnKVxuXG4jIGNoZWNrIGZvciBwcmVzY2VuY2Ugb2YgYSAubGFuZ3VhZ2ViYWJlbCBmaWxlIHBhdGggZnJvbURpciB0b0RpclxuIyByZWFkLCB2YWxpZGF0ZSBhbmQgb3ZlcndyaXRlIGNvbmZpZyBhcyByZXF1aXJlZFxuIyB0b0RpciBpcyBub3JtYWxseSB0aGUgaW1wbGljaXQgQXRvbSBwcm9qZWN0IGZvbGRlcnMgcm9vdCBidXQgd2VcbiMgd2lsbCBzdG9wIG9mIGEgcHJvamVjdFJvb3QgdHJ1ZSBpcyBmb3VuZCBhcyB3ZWxsXG4gIGdldExvY2FsQ29uZmlnOiAoZnJvbURpciwgdG9EaXIsIGxvY2FsQ29uZmlnKSAtPlxuICAgICMgZ2V0IGxvY2FsIHBhdGggb3ZlcmlkZXNcbiAgICBsb2NhbENvbmZpZ0ZpbGUgPSAnLmxhbmd1YWdlYmFiZWwnXG4gICAgbGFuZ3VhZ2VCYWJlbENmZ0ZpbGUgPSBwYXRoLmpvaW4gZnJvbURpciwgbG9jYWxDb25maWdGaWxlXG4gICAgaWYgZnMuZXhpc3RzU3luYyBsYW5ndWFnZUJhYmVsQ2ZnRmlsZVxuICAgICAgZmlsZUNvbnRlbnQ9IGZzLnJlYWRGaWxlU3luYyBsYW5ndWFnZUJhYmVsQ2ZnRmlsZSwgJ3V0ZjgnXG4gICAgICB0cnlcbiAgICAgICAganNvbkNvbnRlbnQgPSBKU09OLnBhcnNlIGZpbGVDb250ZW50XG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6ICN7bG9jYWxDb25maWdGaWxlfSAje2Vyci5tZXNzYWdlfVwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcIkZpbGUgPSAje2xhbmd1YWdlQmFiZWxDZmdGaWxlfVxcblxcbiN7ZmlsZUNvbnRlbnR9XCJcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIHNjaGVtYUVycm9ycyA9IEBqc29uU2NoZW1hLnZhbGlkYXRlICdsb2NhbENvbmZpZycsIGpzb25Db250ZW50XG4gICAgICBpZiBzY2hlbWFFcnJvcnNcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6ICN7bG9jYWxDb25maWdGaWxlfSBjb25maWd1cmF0aW9uIGVycm9yXCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiRmlsZSA9ICN7bGFuZ3VhZ2VCYWJlbENmZ0ZpbGV9XFxuXFxuI3tmaWxlQ29udGVudH1cIlxuICAgICAgZWxzZVxuICAgICAgICAjIG1lcmdlIGxvY2FsIGNvbmZpZy4gY29uZmlnIGNsb3Nlc3Qgc291cmNlRmlsZSB3aW5zXG4gICAgICAgICMgYXBhcnQgZnJvbSBwcm9qZWN0Um9vdCB3aGljaCB3aW5zIG9uIHRydWVcbiAgICAgICAgaXNQcm9qZWN0Um9vdCA9IGpzb25Db250ZW50LnByb2plY3RSb290XG4gICAgICAgIEBtZXJnZSAganNvbkNvbnRlbnQsIGxvY2FsQ29uZmlnXG4gICAgICAgIGlmIGlzUHJvamVjdFJvb3QgdGhlbiBqc29uQ29udGVudC5wcm9qZWN0Um9vdERpciA9IGZyb21EaXJcbiAgICAgICAgbG9jYWxDb25maWcgPSBqc29uQ29udGVudFxuICAgIGlmIGZyb21EaXIgaXNudCB0b0RpclxuICAgICAgIyBzdG9wIGluZmluaXRlIHJlY3Vyc2lvbiBodHRwczovL2dpdGh1Yi5jb20vZ2FuZG0vbGFuZ3VhZ2UtYmFiZWwvaXNzdWVzLzY2XG4gICAgICBpZiBmcm9tRGlyID09IHBhdGguZGlybmFtZShmcm9tRGlyKSB0aGVuIHJldHVybiBsb2NhbENvbmZpZ1xuICAgICAgIyBjaGVjayBwcm9qZWN0Um9vdCBwcm9wZXJ0eSBhbmQgZW5kIHJlY3Vyc2lvbiBpZiB0cnVlXG4gICAgICBpZiBpc1Byb2plY3RSb290IHRoZW4gcmV0dXJuIGxvY2FsQ29uZmlnXG4gICAgICByZXR1cm4gQGdldExvY2FsQ29uZmlnIHBhdGguZGlybmFtZShmcm9tRGlyKSwgdG9EaXIsIGxvY2FsQ29uZmlnXG4gICAgZWxzZSByZXR1cm4gbG9jYWxDb25maWdcblxuICAjIGNhbGN1bGF0ZSBhYnNvdWx0ZSBwYXRocyBvZiBiYWJlbCBzb3VyY2UsIHRhcmdldCBqcyBhbmQgbWFwcyBmaWxlc1xuICAjIGJhc2VkIHVwb24gdGhlIHByb2plY3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgdGhlIHNvdXJjZVxuICAjIGFuZCB0aGUgcm9vdHMgb2Ygc291cmNlLCB0cmFuc3BpbGUgcGF0aCBhbmQgbWFwcyBwYXRocyBkZWZpbmVkIGluIGNvbmZpZ1xuICBnZXRQYXRoczogIChzb3VyY2VGaWxlLCBjb25maWcpIC0+XG4gICAgcHJvamVjdENvbnRhaW5pbmdTb3VyY2UgPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGggc291cmNlRmlsZVxuICAgICMgSXMgdGhlIHNvdXJjZUZpbGUgbG9jYXRlZCBpbnNpZGUgYW4gQXRvbSBwcm9qZWN0IGZvbGRlcj9cbiAgICBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSBpcyBudWxsXG4gICAgICBzb3VyY2VGaWxlSW5Qcm9qZWN0ID0gZmFsc2VcbiAgICBlbHNlIHNvdXJjZUZpbGVJblByb2plY3QgPSB0cnVlXG4gICAgIyBkZXRlcm1pbmVzIHRoZSBwcm9qZWN0IHJvb3QgZGlyIGZyb20gLmxhbmd1YWdlYmFiZWwgb3IgZnJvbSBBdG9tXG4gICAgIyBpZiBhIHByb2plY3QgaXMgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIGF0b20gcGFzc2VzIGJhY2sgYSBudWxsIGZvclxuICAgICMgdGhlIHByb2plY3QgcGF0aCBpZiB0aGUgZmlsZSBpc24ndCBpbiBhIHByb2plY3QgZm9sZGVyXG4gICAgIyBzbyBtYWtlIHRoZSByb290IGRpciB0aGF0IHNvdXJjZSBmaWxlIHRoZSBwcm9qZWN0XG4gICAgaWYgY29uZmlnLnByb2plY3RSb290RGlyP1xuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcucHJvamVjdFJvb3REaXIpXG4gICAgZWxzZSBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSBpcyBudWxsXG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgucGFyc2Uoc291cmNlRmlsZSkucm9vdFxuICAgIGVsc2VcbiAgICAgICMgQXRvbSAxLjggcmV0dXJuaW5nIGRyaXZlIGFzIHByb2plY3Qgcm9vdCBvbiB3aW5kb3dzIGUuZy4gYzogbm90IGM6XFxcbiAgICAgICMgdXNpbmcgcGF0aC5qb2luIHRvICcuJyBmaXhlcyBpdC5cbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKHByb2plY3RDb250YWluaW5nU291cmNlWzBdLCcuJykpXG4gICAgcmVsU291cmNlUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbFNvdXJjZVBhdGgpXG4gICAgcmVsVHJhbnNwaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGgpXG4gICAgcmVsTWFwc1BhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcuYmFiZWxNYXBzUGF0aClcblxuICAgIGFic1NvdXJjZVJvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxTb3VyY2VQYXRoKVxuICAgIGFic1RyYW5zcGlsZVJvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxUcmFuc3BpbGVQYXRoKVxuICAgIGFic01hcHNSb290ID0gcGF0aC5qb2luKGFic1Byb2plY3RQYXRoICwgcmVsTWFwc1BhdGgpXG5cbiAgICBwYXJzZWRTb3VyY2VGaWxlID0gcGF0aC5wYXJzZShzb3VyY2VGaWxlKVxuICAgIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgPSBwYXRoLnJlbGF0aXZlKGFic1NvdXJjZVJvb3QsIHBhcnNlZFNvdXJjZUZpbGUuZGlyKVxuICAgIGFic1RyYW5zcGlsZWRGaWxlID0gcGF0aC5qb2luKGFic1RyYW5zcGlsZVJvb3QsIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgLCBwYXJzZWRTb3VyY2VGaWxlLm5hbWUgICsgJy5qcycpXG4gICAgYWJzTWFwRmlsZSA9IHBhdGguam9pbihhYnNNYXBzUm9vdCwgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSAsIHBhcnNlZFNvdXJjZUZpbGUubmFtZSAgKyAnLmpzLm1hcCcpXG5cbiAgICBzb3VyY2VGaWxlSW5Qcm9qZWN0OiBzb3VyY2VGaWxlSW5Qcm9qZWN0XG4gICAgc291cmNlRmlsZTogc291cmNlRmlsZVxuICAgIHNvdXJjZUZpbGVEaXI6IHBhcnNlZFNvdXJjZUZpbGUuZGlyXG4gICAgbWFwRmlsZTogYWJzTWFwRmlsZVxuICAgIHRyYW5zcGlsZWRGaWxlOiBhYnNUcmFuc3BpbGVkRmlsZVxuICAgIHNvdXJjZVJvb3Q6IGFic1NvdXJjZVJvb3RcbiAgICBwcm9qZWN0UGF0aDogYWJzUHJvamVjdFBhdGhcblxuIyBjaGVjayBmb3IgcHJlc2NlbmNlIG9mIGEgLmJhYmVscmMgZmlsZSBwYXRoIGZyb21EaXIgdG8gcm9vdFxuICBpc0JhYmVscmNJblBhdGg6IChmcm9tRGlyKSAtPlxuICAgICMgZW52aXJvbW5lbnRzIHVzZWQgaW4gYmFiZWxyY1xuICAgIGJhYmVscmMgPSAnLmJhYmVscmMnXG4gICAgYmFiZWxyY0ZpbGUgPSBwYXRoLmpvaW4gZnJvbURpciwgYmFiZWxyY1xuICAgIGlmIGZzLmV4aXN0c1N5bmMgYmFiZWxyY0ZpbGVcbiAgICAgIHJldHVybiB0cnVlXG4gICAgaWYgZnJvbURpciAhPSBwYXRoLmRpcm5hbWUoZnJvbURpcilcbiAgICAgIHJldHVybiBAaXNCYWJlbHJjSW5QYXRoIHBhdGguZGlybmFtZShmcm9tRGlyKVxuICAgIGVsc2UgcmV0dXJuIGZhbHNlXG5cbiMgc2ltcGxlIG1lcmdlIG9mIG9iamVjdHNcbiAgbWVyZ2U6ICh0YXJnZXRPYmosIHNvdXJjZU9iaikgLT5cbiAgICBmb3IgcHJvcCwgdmFsIG9mIHNvdXJjZU9ialxuICAgICAgdGFyZ2V0T2JqW3Byb3BdID0gdmFsXG5cbiMgc3RvcCB0cmFuc3BpbGVyIHRhc2tcbiAgc3RvcFRyYW5zcGlsZXJUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgbXNnT2JqZWN0ID1cbiAgICAgIGNvbW1hbmQ6ICdzdG9wJ1xuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiMgc3RvcCBhbGwgdHJhbnNwaWxlciB0YXNrc1xuICBzdG9wQWxsVHJhbnNwaWxlclRhc2s6ICgpIC0+XG4gICAgZm9yIHByb2plY3RQYXRoLCB2IG9mIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1xuICAgICAgQHN0b3BUcmFuc3BpbGVyVGFzayhwcm9qZWN0UGF0aClcblxuIyBzdG9wIHVuc3VlZCB0cmFuc3BpbGVyIHRhc2tzIGlmIGl0cyBwYXRoIGlzbid0IHByZXNlbnQgaW4gYSBjdXJyZW50XG4jIEF0b20gcHJvamVjdCBmb2xkZXJcbiAgc3RvcFVudXNlZFRhc2tzOiAoKSAtPlxuICAgIGF0b21Qcm9qZWN0UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICAgIGZvciBwcm9qZWN0VGFza1BhdGgsdiBvZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NcbiAgICAgIGlzVGFza0luQ3VycmVudFByb2plY3QgPSBmYWxzZVxuICAgICAgZm9yIGF0b21Qcm9qZWN0UGF0aCBpbiBhdG9tUHJvamVjdFBhdGhzXG4gICAgICAgIGlmIHBhdGhJc0luc2lkZShwcm9qZWN0VGFza1BhdGgsIGF0b21Qcm9qZWN0UGF0aClcbiAgICAgICAgICBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0ID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG4gICAgICBpZiBub3QgaXNUYXNrSW5DdXJyZW50UHJvamVjdCB0aGVuIEBzdG9wVHJhbnNwaWxlclRhc2socHJvamVjdFRhc2tQYXRoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcGlsZXJcbiJdfQ==
