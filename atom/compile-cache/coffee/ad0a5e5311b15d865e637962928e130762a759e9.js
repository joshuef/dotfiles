(function() {
  var CompositeDisposable, Task, Transpiler, fs, languagebabelSchema, path, pathIsInside, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Task = ref.Task, CompositeDisposable = ref.CompositeDisposable;

  path = require('path');

  pathIsInside = require('../node_modules/path-is-inside');

  fs = new Proxy({}, {
    get: function(target, key) {
      if (target.fs == null) {
        target.fs = require('fs-plus');
      }
      return target.fs[key];
    }
  });

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
      keepFileExtension: {
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
                    if (/\.(js|jsx|es|es6|babel|mjs)$/.test(fqFileName)) {
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
      var absMapFile, absMapsRoot, absProjectPath, absSourceRoot, absTranspileRoot, absTranspiledFile, fnExt, parsedSourceFile, projectContainingSource, relMapsPath, relSourcePath, relSourceRootToSourceFile, relTranspilePath, sourceFileInProject;
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
      if (config.keepFileExtension) {
        fnExt = parsedSourceFile.ext;
      } else {
        fnExt = '.js';
      }
      absTranspiledFile = path.join(absTranspileRoot, relSourceRootToSourceFile, parsedSourceFile.name + fnExt);
      absMapFile = path.join(absMapsRoot, relSourceRootToSourceFile, parsedSourceFile.name + fnExt + '.map');
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
      var babelrc, babelrcFiles;
      babelrc = ['.babelrc', '.babelrc.js'];
      babelrcFiles = babelrc.map(function(file) {
        return path.join(fromDir, file);
      });
      if (babelrcFiles.some(fs.existsSync)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvdHJhbnNwaWxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxlQUFELEVBQU87O0VBQ1AsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEsZ0NBQVI7O0VBR2YsRUFBQSxHQUFLLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYztJQUNqQixHQUFBLEVBQUssU0FBQyxNQUFELEVBQVMsR0FBVDs7UUFDSCxNQUFNLENBQUMsS0FBTSxPQUFBLENBQVEsU0FBUjs7YUFDYixNQUFNLENBQUMsRUFBRyxDQUFBLEdBQUE7SUFGUCxDQURZO0dBQWQ7O0VBT0wsbUJBQUEsR0FBc0I7SUFDcEIsSUFBQSxFQUFNLFFBRGM7SUFFcEIsVUFBQSxFQUFZO01BQ1YsYUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BRHhCO01BRVYsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BRnhCO01BR1YsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BSHhCO01BSVYsa0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUp4QjtNQUtWLFNBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQUx4QjtNQU1WLHVCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FOeEI7TUFPVixvQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BUHhCO01BUVYsOEJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVJ4QjtNQVNWLGlCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FUeEI7TUFVVixXQUFBLEVBQWtDO1FB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QyxXQUFEO0FBQ2xCLFVBQUE7TUFBQSxTQUFBLEdBQ0U7UUFBQSxPQUFBLEVBQVMsTUFBVDs7YUFDRixJQUFDLENBQUEsb0JBQXFCLENBQUEsV0FBQSxDQUFZLENBQUMsSUFBbkMsQ0FBd0MsU0FBeEM7SUFIa0I7O3lCQU1wQixxQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFVBQUE7QUFBQTtBQUFBO1dBQUEsbUJBQUE7O3FCQUNFLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixXQUFwQjtBQURGOztJQURxQjs7eUJBTXZCLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxnQkFBQSxHQUFtQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBQTtBQUNuQjtBQUFBO1dBQUEsdUJBQUE7O1FBQ0Usc0JBQUEsR0FBeUI7QUFDekIsYUFBQSxrREFBQTs7VUFDRSxJQUFHLFlBQUEsQ0FBYSxlQUFiLEVBQThCLGVBQTlCLENBQUg7WUFDRSxzQkFBQSxHQUF5QjtBQUN6QixrQkFGRjs7QUFERjtRQUlBLElBQUcsQ0FBSSxzQkFBUDt1QkFBbUMsSUFBQyxDQUFBLGtCQUFELENBQW9CLGVBQXBCLEdBQW5DO1NBQUEsTUFBQTsrQkFBQTs7QUFORjs7SUFGZTs7Ozs7O0VBVW5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBdmJqQiIsInNvdXJjZXNDb250ZW50IjpbIntUYXNrLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gPSByZXF1aXJlICdhdG9tJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5wYXRoSXNJbnNpZGUgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvcGF0aC1pcy1pbnNpZGUnXG5cbiMgTGF6aWx5IHJlcXVpcmUgZnMtcGx1cyB0byBhdm9pZCBibG9ja2luZyBzdGFydHVwLlxuZnMgPSBuZXcgUHJveHkoe30sIHtcbiAgZ2V0OiAodGFyZ2V0LCBrZXkpIC0+XG4gICAgdGFyZ2V0LmZzID89IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gICAgdGFyZ2V0LmZzW2tleV1cbn0pXG5cbiMgc2V0dXAgSlNPTiBTY2hlbWEgdG8gcGFyc2UgLmxhbmd1YWdlYmFiZWwgY29uZmlnc1xubGFuZ3VhZ2ViYWJlbFNjaGVtYSA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHByb3BlcnRpZXM6IHtcbiAgICBiYWJlbE1hcHNQYXRoOiAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGJhYmVsTWFwc0FkZFVybDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGJhYmVsU291cmNlUGF0aDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgYmFiZWxUcmFuc3BpbGVQYXRoOiAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBjcmVhdGVNYXA6ICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUYXJnZXREaXJlY3RvcmllczogICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUcmFuc3BpbGVkQ29kZTogICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBkaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGg6ICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBrZWVwRmlsZUV4dGVuc2lvbjogICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBwcm9qZWN0Um9vdDogICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlczogICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzOiAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICB0cmFuc3BpbGVPblNhdmU6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfVxuICB9LFxuICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2Vcbn1cblxuY2xhc3MgVHJhbnNwaWxlclxuXG4gIGZyb21HcmFtbWFyTmFtZTogJ0JhYmVsIEVTNiBKYXZhU2NyaXB0J1xuICBmcm9tU2NvcGVOYW1lOiAnc291cmNlLmpzLmpzeCdcbiAgdG9TY29wZU5hbWU6ICdzb3VyY2UuanMuanN4J1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZXFJZCA9IDBcbiAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3MgPSB7fVxuICAgIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCA9IHJlcXVpcmUucmVzb2x2ZSAnLi90cmFuc3BpbGVyLXRhc2snXG4gICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9ucyA9IHt9XG4gICAgQGRlcHJlY2F0ZUNvbmZpZygpXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGlmIEBnZXRDb25maWcoKS50cmFuc3BpbGVPblNhdmUgb3IgQGdldENvbmZpZygpLmFsbG93TG9jYWxPdmVycmlkZVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbnRleHRNZW51LmFkZCB7XG4gICAgICAgICcudHJlZS12aWV3IC5kaXJlY3RvcnkgPiAuaGVhZGVyID4gLm5hbWUnOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTGFuZ3VhZ2UtQmFiZWwnXG4gICAgICAgICAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3J5ICcsIGNvbW1hbmQ6ICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3J5J31cbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3JpZXMnLCBjb21tYW5kOiAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yaWVzJ31cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeyd0eXBlJzogJ3NlcGFyYXRvcicgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcnknLCBAY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yeVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcmllcycsIEBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3JpZXNcblxuICAjIG1ldGhvZCB1c2VkIGJ5IHNvdXJjZS1wcmV2aWV3IHRvIHNlZSB0cmFuc3BpbGVkIGNvZGVcbiAgdHJhbnNmb3JtOiAoY29kZSwge2ZpbGVQYXRoLCBzb3VyY2VNYXB9KSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBmaWxlUGF0aCwgY29uZmlnXG4gICAgIyBjcmVhdGUgYmFiZWwgdHJhbnNmb3JtZXIgdGFza3MgLSBvbmUgcGVyIHByb2plY3QgYXMgbmVlZGVkXG4gICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG4gICAgYmFiZWxPcHRpb25zID1cbiAgICAgIGZpbGVuYW1lOiBmaWxlUGF0aFxuICAgICAgYXN0OiBmYWxzZVxuICAgIGlmIHNvdXJjZU1hcCB0aGVuIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzID0gc291cmNlTWFwXG4gICAgIyBvayBub3cgdHJhbnNwaWxlIGluIHRoZSB0YXNrIGFuZCB3YWl0IG9uIHRoZSByZXN1bHRcbiAgICBpZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgcmVxSWQgPSBAcmVxSWQrK1xuICAgICAgbXNnT2JqZWN0ID1cbiAgICAgICAgcmVxSWQ6IHJlcUlkXG4gICAgICAgIGNvbW1hbmQ6ICd0cmFuc3BpbGVDb2RlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBjb2RlOiBjb2RlXG4gICAgICAgIGJhYmVsT3B0aW9uczogYmFiZWxPcHRpb25zXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0ICkgPT5cbiAgICAgICMgdHJhbnNwaWxlIGluIHRhc2tcbiAgICAgIHRyeVxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgICAgcmVqZWN0KFwiRXJyb3IgI3tlcnJ9IHNlbmRpbmcgdG8gdHJhbnNwaWxlIHRhc2sgd2l0aCBQSUQgI3tAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5jaGlsZFByb2Nlc3MucGlkfVwiKVxuICAgICAgIyBnZXQgcmVzdWx0IGZyb20gdGFzayBmb3IgdGhpcyByZXFJZFxuICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0ub25jZSBcInRyYW5zcGlsZToje3JlcUlkfVwiLCAobXNnUmV0KSA9PlxuICAgICAgICBpZiBtc2dSZXQuZXJyP1xuICAgICAgICAgIHJlamVjdChcIkJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259XFxuI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG1zZ1JldC5zb3VyY2VNYXAgPSBtc2dSZXQubWFwXG4gICAgICAgICAgcmVzb2x2ZShtc2dSZXQpXG5cbiAgIyBjYWxsZWQgYnkgY29tbWFuZFxuICBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3J5OiAoe3RhcmdldH0pID0+XG4gICAgQHRyYW5zcGlsZURpcmVjdG9yeSB7ZGlyZWN0b3J5OiB0YXJnZXQuZGF0YXNldC5wYXRoIH1cblxuICAjIGNhbGxlZCBieSBjb21tYW5kXG4gIGNvbW1hbmRUcmFuc3BpbGVEaXJlY3RvcmllczogKHt0YXJnZXR9KSA9PlxuICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogdGFyZ2V0LmRhdGFzZXQucGF0aCwgcmVjdXJzaXZlOiB0cnVlfVxuXG4gICMgdHJhbnNwaWxlIGFsbCBmaWxlcyBpbiBhIGRpcmVjdG9yeSBvciByZWN1cnNpdmUgZGlyZWN0b3JpZXNcbiAgIyBvcHRpb25zIGFyZSB7IGRpcmVjdG9yeTogbmFtZSwgcmVjdXJzaXZlOiB0cnVlfGZhbHNlfVxuICB0cmFuc3BpbGVEaXJlY3Rvcnk6IChvcHRpb25zKSAtPlxuICAgIGRpcmVjdG9yeSA9IG9wdGlvbnMuZGlyZWN0b3J5XG4gICAgcmVjdXJzaXZlID0gb3B0aW9ucy5yZWN1cnNpdmUgb3IgZmFsc2VcbiAgICBmcy5yZWFkZGlyIGRpcmVjdG9yeSwgKGVycixmaWxlcykgPT5cbiAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgIGZpbGVzLm1hcCAoZmlsZSkgPT5cbiAgICAgICAgICBmcUZpbGVOYW1lID0gcGF0aC5qb2luKGRpcmVjdG9yeSwgZmlsZSlcbiAgICAgICAgICBmcy5zdGF0IGZxRmlsZU5hbWUsIChlcnIsIHN0YXRzKSA9PlxuICAgICAgICAgICAgaWYgbm90IGVycj9cbiAgICAgICAgICAgICAgaWYgc3RhdHMuaXNGaWxlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgL1xcLm1pblxcLlthLXpdKyQvLnRlc3QgZnFGaWxlTmFtZSAjIG5vIG1pbmltaXplZCBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIC9cXC4oanN8anN4fGVzfGVzNnxiYWJlbHxtanMpJC8udGVzdCBmcUZpbGVOYW1lICMgb25seSBqc1xuICAgICAgICAgICAgICAgICAgQHRyYW5zcGlsZSBmaWxlLCBudWxsLCBAZ2V0Q29uZmlnQW5kUGF0aFRvIGZxRmlsZU5hbWVcbiAgICAgICAgICAgICAgZWxzZSBpZiByZWN1cnNpdmUgYW5kIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IGZxRmlsZU5hbWUsIHJlY3Vyc2l2ZTogdHJ1ZX1cblxuICAjIHRyYW5zcGlsZSBzb3VyY2VGaWxlIGVkaXRlZCBieSB0aGUgb3B0aW9uYWwgdGV4dEVkaXRvclxuICB0cmFuc3BpbGU6IChzb3VyY2VGaWxlLCB0ZXh0RWRpdG9yLCBjb25maWdBbmRQYXRoVG8pIC0+XG4gICAgIyBnZXQgY29uZmlnXG4gICAgaWYgY29uZmlnQW5kUGF0aFRvP1xuICAgICAgeyBjb25maWcsIHBhdGhUbyB9ID0gY29uZmlnQW5kUGF0aFRvXG4gICAgZWxzZVxuICAgICAge2NvbmZpZywgcGF0aFRvIH0gPSBAZ2V0Q29uZmlnQW5kUGF0aFRvKHNvdXJjZUZpbGUpXG5cbiAgICByZXR1cm4gaWYgY29uZmlnLnRyYW5zcGlsZU9uU2F2ZSBpc250IHRydWVcblxuICAgIGlmIGNvbmZpZy5kaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGhcbiAgICAgIGlmIG5vdCBAaXNCYWJlbHJjSW5QYXRoIHBhdGhUby5zb3VyY2VGaWxlRGlyXG4gICAgICAgIHJldHVyblxuXG4gICAgaWYgbm90IHBhdGhJc0luc2lkZShwYXRoVG8uc291cmNlRmlsZSwgcGF0aFRvLnNvdXJjZVJvb3QpXG4gICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzU291cmNlUGF0aE1lc3NhZ2VzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nICdMQjogQmFiZWwgZmlsZSBpcyBub3QgaW5zaWRlIHRoZSBcIkJhYmVsIFNvdXJjZSBQYXRoXCIgZGlyZWN0b3J5LicsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IGZhbHNlXG4gICAgICAgICAgZGV0YWlsOiBcIk5vIHRyYW5zcGlsZWQgY29kZSBvdXRwdXQgZm9yIGZpbGUgXFxuI3twYXRoVG8uc291cmNlRmlsZX1cbiAgICAgICAgICAgIFxcblxcblRvIHN1cHByZXNzIHRoZXNlICdpbnZhbGlkIHNvdXJjZSBwYXRoJ1xuICAgICAgICAgICAgbWVzc2FnZXMgdXNlIGxhbmd1YWdlLWJhYmVsIHBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgcmV0dXJuXG5cbiAgICBiYWJlbE9wdGlvbnMgPSBAZ2V0QmFiZWxPcHRpb25zIGNvbmZpZ1xuXG4gICAgQGNsZWFuTm90aWZpY2F0aW9ucyhwYXRoVG8pXG5cbiAgICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgICBAY3JlYXRlVGFzayBwYXRoVG8ucHJvamVjdFBhdGhcblxuICAgICMgb2sgbm93IHRyYW5zcGlsZSBpbiB0aGUgdGFzayBhbmQgd2FpdCBvbiB0aGUgcmVzdWx0XG4gICAgaWYgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgIHJlcUlkID0gQHJlcUlkKytcbiAgICAgIG1zZ09iamVjdCA9XG4gICAgICAgIHJlcUlkOiByZXFJZFxuICAgICAgICBjb21tYW5kOiAndHJhbnNwaWxlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBiYWJlbE9wdGlvbnM6IGJhYmVsT3B0aW9uc1xuXG4gICAgICAjIHRyYW5zcGlsZSBpbiB0YXNrXG4gICAgICB0cnlcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgY29uc29sZS5sb2cgXCJFcnJvciAje2Vycn0gc2VuZGluZyB0byB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuICAgICAgICBjb25zb2xlLmxvZyBcIlJlc3RhcnRlZCB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiAgICAgICMgZ2V0IHJlc3VsdCBmcm9tIHRhc2sgZm9yIHRoaXMgcmVxSWRcbiAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLm9uY2UgXCJ0cmFuc3BpbGU6I3tyZXFJZH1cIiwgKG1zZ1JldCkgPT5cbiAgICAgICAgIyAuaWdub3JlZCBpcyByZXR1cm5lZCB3aGVuIC5iYWJlbHJjIGlnbm9yZS9vbmx5IGZsYWdzIGFyZSB1c2VkXG4gICAgICAgIGlmIG1zZ1JldC5yZXN1bHQ/Lmlnbm9yZWQgdGhlbiByZXR1cm5cbiAgICAgICAgaWYgbXNnUmV0LmVyclxuICAgICAgICAgIGlmIG1zZ1JldC5lcnIuc3RhY2tcbiAgICAgICAgICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdID1cbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEJhYmVsIFRyYW5zcGlsZXIgRXJyb3JcIixcbiAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIGRldGFpbDogXCIje21zZ1JldC5lcnIubWVzc2FnZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cXG4gXFxuI3ttc2dSZXQuZXJyLnN0YWNrfVwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0gPVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn0gVHJhbnNwaWxlciBFcnJvclwiLFxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVxcbiBcXG4je21zZ1JldC5lcnIuY29kZUZyYW1lfVwiXG4gICAgICAgICAgICAjIGlmIHdlIGhhdmUgYSBsaW5lL2NvbCBzeW50YXggZXJyb3IganVtcCB0byB0aGUgcG9zaXRpb25cbiAgICAgICAgICAgIGlmIG1zZ1JldC5lcnIubG9jPy5saW5lPyBhbmQgdGV4dEVkaXRvcj8uYWxpdmVcbiAgICAgICAgICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiBbbXNnUmV0LmVyci5sb2MubGluZS0xLCBtc2dSZXQuZXJyLmxvYy5jb2x1bW5dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXNcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvIFwiTEI6IEJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259IFRyYW5zcGlsZXIgU3VjY2Vzc1wiLFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiI3twYXRoVG8uc291cmNlRmlsZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIlxuXG4gICAgICAgICAgaWYgbm90IGNvbmZpZy5jcmVhdGVUcmFuc3BpbGVkQ29kZVxuICAgICAgICAgICAgaWYgbm90IGNvbmZpZy5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzXG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvICdMQjogTm8gdHJhbnNwaWxlZCBvdXRwdXQgY29uZmlndXJlZCdcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGlmIHBhdGhUby5zb3VyY2VGaWxlIGlzIHBhdGhUby50cmFuc3BpbGVkRmlsZVxuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgJ0xCOiBUcmFuc3BpbGVkIGZpbGUgd291bGQgb3ZlcndyaXRlIHNvdXJjZSBmaWxlLiBBYm9ydGVkIScsXG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgIGRldGFpbDogcGF0aFRvLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgIyB3cml0ZSBjb2RlIGFuZCBtYXBzXG4gICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZVRhcmdldERpcmVjdG9yaWVzXG4gICAgICAgICAgICBmcy5tYWtlVHJlZVN5bmMoIHBhdGgucGFyc2UoIHBhdGhUby50cmFuc3BpbGVkRmlsZSkuZGlyKVxuXG4gICAgICAgICAgIyBhZGQgc291cmNlIG1hcCB1cmwgdG8gY29kZSBpZiBmaWxlIGlzbid0IGlnbm9yZWRcbiAgICAgICAgICBpZiBjb25maWcuYmFiZWxNYXBzQWRkVXJsXG4gICAgICAgICAgICBtc2dSZXQucmVzdWx0LmNvZGUgPSBtc2dSZXQucmVzdWx0LmNvZGUgKyAnXFxuJyArICcvLyMgc291cmNlTWFwcGluZ1VSTD0nK3BhdGhUby5tYXBGaWxlXG5cbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIHBhdGhUby50cmFuc3BpbGVkRmlsZSwgbXNnUmV0LnJlc3VsdC5jb2RlXG5cbiAgICAgICAgICAjIHdyaXRlIHNvdXJjZSBtYXAgaWYgcmV0dXJuZWQgYW5kIGlmIGFza2VkXG4gICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZU1hcCBhbmQgbXNnUmV0LnJlc3VsdC5tYXA/LnZlcnNpb25cbiAgICAgICAgICAgIGlmIGNvbmZpZy5jcmVhdGVUYXJnZXREaXJlY3Rvcmllc1xuICAgICAgICAgICAgICBmcy5tYWtlVHJlZVN5bmMocGF0aC5wYXJzZShwYXRoVG8ubWFwRmlsZSkuZGlyKVxuICAgICAgICAgICAgbWFwSnNvbiA9XG4gICAgICAgICAgICAgIHZlcnNpb246IG1zZ1JldC5yZXN1bHQubWFwLnZlcnNpb25cbiAgICAgICAgICAgICAgc291cmNlczogIHBhdGhUby5zb3VyY2VGaWxlXG4gICAgICAgICAgICAgIGZpbGU6IHBhdGhUby50cmFuc3BpbGVkRmlsZVxuICAgICAgICAgICAgICBzb3VyY2VSb290OiAnJ1xuICAgICAgICAgICAgICBuYW1lczogbXNnUmV0LnJlc3VsdC5tYXAubmFtZXNcbiAgICAgICAgICAgICAgbWFwcGluZ3M6IG1zZ1JldC5yZXN1bHQubWFwLm1hcHBpbmdzXG4gICAgICAgICAgICB4c3NpUHJvdGVjdGlvbiA9ICcpXX1cXG4nXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIHBhdGhUby5tYXBGaWxlLFxuICAgICAgICAgICAgICB4c3NpUHJvdGVjdGlvbiArIEpTT04uc3RyaW5naWZ5IG1hcEpzb24sIG51bGwsICcgJ1xuXG4gICMgY2xlYW4gbm90aWZpY2F0aW9uIG1lc3NhZ2VzXG4gIGNsZWFuTm90aWZpY2F0aW9uczogKHBhdGhUbykgLT5cbiAgICAjIGF1dG8gZGlzbWlzcyBwcmV2aW91cyB0cmFuc3BpbGUgZXJyb3Igbm90aWZpY2F0aW9ucyBmb3IgdGhpcyBzb3VyY2UgZmlsZVxuICAgIGlmIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdP1xuICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0uZGlzbWlzcygpXG4gICAgICBkZWxldGUgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV1cbiAgICAjIHJlbW92ZSBhbnkgdXNlciBkaXNtaXNzZWQgbm90aWZpY2F0aW9uIG9iamVjdCByZWZlcmVuY2VzXG4gICAgZm9yIHNmLCBuIG9mIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNcbiAgICAgIGlmIG4uZGlzbWlzc2VkXG4gICAgICAgIGRlbGV0ZSBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3NmXVxuICAgICMgRklYIGZvciBhdG9tIG5vdGlmaWNhdGlvbnMuIGRpc21pc3NlZCBub2Z0aWZpY2F0aW9ucyB2aWEgd2hhdGV2ZXIgbWVhbnNcbiAgICAjIGFyZSBuZXZlciBhY3R1YWxseSByZW1vdmVkIGZyb20gbWVtb3J5LiBJIGNvbnNpZGVyIHRoaXMgYSBtZW1vcnkgbGVha1xuICAgICMgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzg2MTQgc28gcmVtb3ZlIGFueSBkaXNtaXNzZWRcbiAgICAjIG5vdGlmaWNhdGlvbiBvYmplY3RzIHByZWZpeGVkIHdpdGggYSBtZXNzYWdlIHByZWZpeCBvZiBMQjogZnJvbSBtZW1vcnlcbiAgICBpID0gYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMubGVuZ3RoIC0gMVxuICAgIHdoaWxlIGkgPj0gMFxuICAgICAgaWYgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNbaV0uZGlzbWlzc2VkIGFuZFxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNbaV0ubWVzc2FnZS5zdWJzdHJpbmcoMCwzKSBpcyBcIkxCOlwiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnNwbGljZSBpLCAxXG4gICAgICBpLS1cblxuICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgY3JlYXRlVGFzazogKHByb2plY3RQYXRoKSAtPlxuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF0gPz1cbiAgICAgIFRhc2sub25jZSBAYmFiZWxUcmFuc2Zvcm1lclBhdGgsIHByb2plY3RQYXRoLCA9PlxuICAgICAgICAjIHRhc2sgZW5kZWRcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF1cblxuICAjIG1vZGlmaWVzIGNvbmZpZyBvcHRpb25zIGZvciBjaGFuZ2VkIG9yIGRlcHJlY2F0ZWQgY29uZmlnc1xuICBkZXByZWNhdGVDb25maWc6IC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKT9cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbGFuZ3VhZ2UtYmFiZWwuc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycsXG4gICAgICAgIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJylcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKT9cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbGFuZ3VhZ2UtYmFiZWwuc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnLFxuICAgICAgICBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzU291cmNlUGF0aE1lc3NhZ2VzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwudXNlSW50ZXJuYWxTY2FubmVyJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuc3RvcEF0UHJvamVjdERpcmVjdG9yeScpXG4gICAgIyByZW1vdmUgYmFiZWwgVjUgb3B0aW9uc1xuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5iYWJlbFN0YWdlJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuZXh0ZXJuYWxIZWxwZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwubW9kdWxlTG9hZGVyJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuYmxhY2tsaXN0VHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwud2hpdGVsaXN0VHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwubG9vc2VUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5vcHRpb25hbFRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnBsdWdpbnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5wcmVzZXRzJylcbiAgICAjIHJlbW92ZSBvbGQgbmFtZSBpbmRlbnQgb3B0aW9uc1xuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5mb3JtYXRKU1gnKVxuXG4gICMgY2FsY3VsYXRlIGJhYmVsIG9wdGlvbnMgYmFzZWQgdXBvbiBwYWNrYWdlIGNvbmZpZywgYmFiZWxyYyBmaWxlcyBhbmRcbiAgIyB3aGV0aGVyIGludGVybmFsU2Nhbm5lciBpcyB1c2VkLlxuICBnZXRCYWJlbE9wdGlvbnM6IChjb25maWcpLT5cbiAgICAjIHNldCB0cmFuc3BpbGVyIG9wdGlvbnMgZnJvbSBwYWNrYWdlIGNvbmZpZ3VyYXRpb24uXG4gICAgYmFiZWxPcHRpb25zID1cbiAgICAgIGNvZGU6IHRydWVcbiAgICBpZiBjb25maWcuY3JlYXRlTWFwICB0aGVuIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzID0gY29uZmlnLmNyZWF0ZU1hcFxuICAgIGJhYmVsT3B0aW9uc1xuXG4gICNnZXQgY29uZmlndXJhdGlvbiBhbmQgcGF0aHNcbiAgZ2V0Q29uZmlnQW5kUGF0aFRvOiAoc291cmNlRmlsZSkgLT5cbiAgICBjb25maWcgPSBAZ2V0Q29uZmlnKClcbiAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgc291cmNlRmlsZSwgY29uZmlnXG5cbiAgICBpZiBjb25maWcuYWxsb3dMb2NhbE92ZXJyaWRlXG4gICAgICBpZiBub3QgQGpzb25TY2hlbWE/XG4gICAgICAgIEBqc29uU2NoZW1hID0gKHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9qanYnKSgpICMgdXNlIGpqdiBhcyBpdCBydW5zIHdpdGhvdXQgQ1NQIGlzc3Vlc1xuICAgICAgICBAanNvblNjaGVtYS5hZGRTY2hlbWEgJ2xvY2FsQ29uZmlnJywgbGFuZ3VhZ2ViYWJlbFNjaGVtYVxuICAgICAgbG9jYWxDb25maWcgPSBAZ2V0TG9jYWxDb25maWcgcGF0aFRvLnNvdXJjZUZpbGVEaXIsIHBhdGhUby5wcm9qZWN0UGF0aCwge31cbiAgICAgICMgbWVyZ2UgbG9jYWwgY29uZmlncyB3aXRoIGdsb2JhbC4gbG9jYWwgd2luc1xuICAgICAgQG1lcmdlIGNvbmZpZywgbG9jYWxDb25maWdcbiAgICAgICMgcmVjYWxjIHBhdGhzXG4gICAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgc291cmNlRmlsZSwgY29uZmlnXG4gICAgcmV0dXJuIHsgY29uZmlnLCBwYXRoVG8gfVxuXG4gICMgZ2V0IGdsb2JhbCBjb25maWd1cmF0aW9uIGZvciBsYW5ndWFnZS1iYWJlbFxuICBnZXRDb25maWc6IC0+IGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwnKVxuXG4jIGNoZWNrIGZvciBwcmVzY2VuY2Ugb2YgYSAubGFuZ3VhZ2ViYWJlbCBmaWxlIHBhdGggZnJvbURpciB0b0RpclxuIyByZWFkLCB2YWxpZGF0ZSBhbmQgb3ZlcndyaXRlIGNvbmZpZyBhcyByZXF1aXJlZFxuIyB0b0RpciBpcyBub3JtYWxseSB0aGUgaW1wbGljaXQgQXRvbSBwcm9qZWN0IGZvbGRlcnMgcm9vdCBidXQgd2VcbiMgd2lsbCBzdG9wIG9mIGEgcHJvamVjdFJvb3QgdHJ1ZSBpcyBmb3VuZCBhcyB3ZWxsXG4gIGdldExvY2FsQ29uZmlnOiAoZnJvbURpciwgdG9EaXIsIGxvY2FsQ29uZmlnKSAtPlxuICAgICMgZ2V0IGxvY2FsIHBhdGggb3ZlcmlkZXNcbiAgICBsb2NhbENvbmZpZ0ZpbGUgPSAnLmxhbmd1YWdlYmFiZWwnXG4gICAgbGFuZ3VhZ2VCYWJlbENmZ0ZpbGUgPSBwYXRoLmpvaW4gZnJvbURpciwgbG9jYWxDb25maWdGaWxlXG4gICAgaWYgZnMuZXhpc3RzU3luYyBsYW5ndWFnZUJhYmVsQ2ZnRmlsZVxuICAgICAgZmlsZUNvbnRlbnQ9IGZzLnJlYWRGaWxlU3luYyBsYW5ndWFnZUJhYmVsQ2ZnRmlsZSwgJ3V0ZjgnXG4gICAgICB0cnlcbiAgICAgICAganNvbkNvbnRlbnQgPSBKU09OLnBhcnNlIGZpbGVDb250ZW50XG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6ICN7bG9jYWxDb25maWdGaWxlfSAje2Vyci5tZXNzYWdlfVwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcIkZpbGUgPSAje2xhbmd1YWdlQmFiZWxDZmdGaWxlfVxcblxcbiN7ZmlsZUNvbnRlbnR9XCJcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIHNjaGVtYUVycm9ycyA9IEBqc29uU2NoZW1hLnZhbGlkYXRlICdsb2NhbENvbmZpZycsIGpzb25Db250ZW50XG4gICAgICBpZiBzY2hlbWFFcnJvcnNcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6ICN7bG9jYWxDb25maWdGaWxlfSBjb25maWd1cmF0aW9uIGVycm9yXCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiRmlsZSA9ICN7bGFuZ3VhZ2VCYWJlbENmZ0ZpbGV9XFxuXFxuI3tmaWxlQ29udGVudH1cIlxuICAgICAgZWxzZVxuICAgICAgICAjIG1lcmdlIGxvY2FsIGNvbmZpZy4gY29uZmlnIGNsb3Nlc3Qgc291cmNlRmlsZSB3aW5zXG4gICAgICAgICMgYXBhcnQgZnJvbSBwcm9qZWN0Um9vdCB3aGljaCB3aW5zIG9uIHRydWVcbiAgICAgICAgaXNQcm9qZWN0Um9vdCA9IGpzb25Db250ZW50LnByb2plY3RSb290XG4gICAgICAgIEBtZXJnZSAganNvbkNvbnRlbnQsIGxvY2FsQ29uZmlnXG4gICAgICAgIGlmIGlzUHJvamVjdFJvb3QgdGhlbiBqc29uQ29udGVudC5wcm9qZWN0Um9vdERpciA9IGZyb21EaXJcbiAgICAgICAgbG9jYWxDb25maWcgPSBqc29uQ29udGVudFxuICAgIGlmIGZyb21EaXIgaXNudCB0b0RpclxuICAgICAgIyBzdG9wIGluZmluaXRlIHJlY3Vyc2lvbiBodHRwczovL2dpdGh1Yi5jb20vZ2FuZG0vbGFuZ3VhZ2UtYmFiZWwvaXNzdWVzLzY2XG4gICAgICBpZiBmcm9tRGlyID09IHBhdGguZGlybmFtZShmcm9tRGlyKSB0aGVuIHJldHVybiBsb2NhbENvbmZpZ1xuICAgICAgIyBjaGVjayBwcm9qZWN0Um9vdCBwcm9wZXJ0eSBhbmQgZW5kIHJlY3Vyc2lvbiBpZiB0cnVlXG4gICAgICBpZiBpc1Byb2plY3RSb290IHRoZW4gcmV0dXJuIGxvY2FsQ29uZmlnXG4gICAgICByZXR1cm4gQGdldExvY2FsQ29uZmlnIHBhdGguZGlybmFtZShmcm9tRGlyKSwgdG9EaXIsIGxvY2FsQ29uZmlnXG4gICAgZWxzZSByZXR1cm4gbG9jYWxDb25maWdcblxuICAjIGNhbGN1bGF0ZSBhYnNvdWx0ZSBwYXRocyBvZiBiYWJlbCBzb3VyY2UsIHRhcmdldCBqcyBhbmQgbWFwcyBmaWxlc1xuICAjIGJhc2VkIHVwb24gdGhlIHByb2plY3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgdGhlIHNvdXJjZVxuICAjIGFuZCB0aGUgcm9vdHMgb2Ygc291cmNlLCB0cmFuc3BpbGUgcGF0aCBhbmQgbWFwcyBwYXRocyBkZWZpbmVkIGluIGNvbmZpZ1xuICBnZXRQYXRoczogIChzb3VyY2VGaWxlLCBjb25maWcpIC0+XG4gICAgcHJvamVjdENvbnRhaW5pbmdTb3VyY2UgPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGggc291cmNlRmlsZVxuICAgICMgSXMgdGhlIHNvdXJjZUZpbGUgbG9jYXRlZCBpbnNpZGUgYW4gQXRvbSBwcm9qZWN0IGZvbGRlcj9cbiAgICBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSBpcyBudWxsXG4gICAgICBzb3VyY2VGaWxlSW5Qcm9qZWN0ID0gZmFsc2VcbiAgICBlbHNlIHNvdXJjZUZpbGVJblByb2plY3QgPSB0cnVlXG4gICAgIyBkZXRlcm1pbmVzIHRoZSBwcm9qZWN0IHJvb3QgZGlyIGZyb20gLmxhbmd1YWdlYmFiZWwgb3IgZnJvbSBBdG9tXG4gICAgIyBpZiBhIHByb2plY3QgaXMgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIGF0b20gcGFzc2VzIGJhY2sgYSBudWxsIGZvclxuICAgICMgdGhlIHByb2plY3QgcGF0aCBpZiB0aGUgZmlsZSBpc24ndCBpbiBhIHByb2plY3QgZm9sZGVyXG4gICAgIyBzbyBtYWtlIHRoZSByb290IGRpciB0aGF0IHNvdXJjZSBmaWxlIHRoZSBwcm9qZWN0XG4gICAgaWYgY29uZmlnLnByb2plY3RSb290RGlyP1xuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcucHJvamVjdFJvb3REaXIpXG4gICAgZWxzZSBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSBpcyBudWxsXG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgucGFyc2Uoc291cmNlRmlsZSkucm9vdFxuICAgIGVsc2VcbiAgICAgICMgQXRvbSAxLjggcmV0dXJuaW5nIGRyaXZlIGFzIHByb2plY3Qgcm9vdCBvbiB3aW5kb3dzIGUuZy4gYzogbm90IGM6XFxcbiAgICAgICMgdXNpbmcgcGF0aC5qb2luIHRvICcuJyBmaXhlcyBpdC5cbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKHByb2plY3RDb250YWluaW5nU291cmNlWzBdLCcuJykpXG4gICAgcmVsU291cmNlUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbFNvdXJjZVBhdGgpXG4gICAgcmVsVHJhbnNwaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGgpXG4gICAgcmVsTWFwc1BhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcuYmFiZWxNYXBzUGF0aClcblxuICAgIGFic1NvdXJjZVJvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxTb3VyY2VQYXRoKVxuICAgIGFic1RyYW5zcGlsZVJvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxUcmFuc3BpbGVQYXRoKVxuICAgIGFic01hcHNSb290ID0gcGF0aC5qb2luKGFic1Byb2plY3RQYXRoICwgcmVsTWFwc1BhdGgpXG5cbiAgICBwYXJzZWRTb3VyY2VGaWxlID0gcGF0aC5wYXJzZShzb3VyY2VGaWxlKVxuICAgIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgPSBwYXRoLnJlbGF0aXZlKGFic1NvdXJjZVJvb3QsIHBhcnNlZFNvdXJjZUZpbGUuZGlyKVxuXG4gICAgIyBvcHRpb24gdG8ga2VlcCBmaWxlbmFtZSBleHRlbnNpb24gbmFtZVxuICAgIGlmIGNvbmZpZy5rZWVwRmlsZUV4dGVuc2lvblxuICAgICAgZm5FeHQgPSBwYXJzZWRTb3VyY2VGaWxlLmV4dFxuICAgIGVsc2VcbiAgICAgIGZuRXh0ID0gICcuanMnXG4gICAgYWJzVHJhbnNwaWxlZEZpbGUgPSBwYXRoLmpvaW4oYWJzVHJhbnNwaWxlUm9vdCwgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSAsIHBhcnNlZFNvdXJjZUZpbGUubmFtZSAgKyBmbkV4dCApXG4gICAgYWJzTWFwRmlsZSA9IHBhdGguam9pbihhYnNNYXBzUm9vdCwgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSAsIHBhcnNlZFNvdXJjZUZpbGUubmFtZSAgKyBmbkV4dCArICcubWFwJylcblxuICAgIHNvdXJjZUZpbGVJblByb2plY3Q6IHNvdXJjZUZpbGVJblByb2plY3RcbiAgICBzb3VyY2VGaWxlOiBzb3VyY2VGaWxlXG4gICAgc291cmNlRmlsZURpcjogcGFyc2VkU291cmNlRmlsZS5kaXJcbiAgICBtYXBGaWxlOiBhYnNNYXBGaWxlXG4gICAgdHJhbnNwaWxlZEZpbGU6IGFic1RyYW5zcGlsZWRGaWxlXG4gICAgc291cmNlUm9vdDogYWJzU291cmNlUm9vdFxuICAgIHByb2plY3RQYXRoOiBhYnNQcm9qZWN0UGF0aFxuXG4jIGNoZWNrIGZvciBwcmVzY2VuY2Ugb2YgYSAuYmFiZWxyYyBmaWxlIHBhdGggZnJvbURpciB0byByb290XG4gIGlzQmFiZWxyY0luUGF0aDogKGZyb21EaXIpIC0+XG4gICAgIyBlbnZpcm9tbmVudHMgdXNlZCBpbiBiYWJlbHJjXG4gICAgYmFiZWxyYyA9IFtcbiAgICAgICcuYmFiZWxyYydcbiAgICAgICcuYmFiZWxyYy5qcycgIyBCYWJlbCA3LjAgYW5kIG5ld2VyXG4gICAgXVxuICAgIGJhYmVscmNGaWxlcyA9IGJhYmVscmMubWFwIChmaWxlKSAtPiBwYXRoLmpvaW4oZnJvbURpciwgZmlsZSlcblxuICAgIGlmIGJhYmVscmNGaWxlcy5zb21lIGZzLmV4aXN0c1N5bmNcbiAgICAgIHJldHVybiB0cnVlXG4gICAgaWYgZnJvbURpciAhPSBwYXRoLmRpcm5hbWUoZnJvbURpcilcbiAgICAgIHJldHVybiBAaXNCYWJlbHJjSW5QYXRoIHBhdGguZGlybmFtZShmcm9tRGlyKVxuICAgIGVsc2UgcmV0dXJuIGZhbHNlXG5cbiMgc2ltcGxlIG1lcmdlIG9mIG9iamVjdHNcbiAgbWVyZ2U6ICh0YXJnZXRPYmosIHNvdXJjZU9iaikgLT5cbiAgICBmb3IgcHJvcCwgdmFsIG9mIHNvdXJjZU9ialxuICAgICAgdGFyZ2V0T2JqW3Byb3BdID0gdmFsXG5cbiMgc3RvcCB0cmFuc3BpbGVyIHRhc2tcbiAgc3RvcFRyYW5zcGlsZXJUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgbXNnT2JqZWN0ID1cbiAgICAgIGNvbW1hbmQ6ICdzdG9wJ1xuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiMgc3RvcCBhbGwgdHJhbnNwaWxlciB0YXNrc1xuICBzdG9wQWxsVHJhbnNwaWxlclRhc2s6ICgpIC0+XG4gICAgZm9yIHByb2plY3RQYXRoLCB2IG9mIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1xuICAgICAgQHN0b3BUcmFuc3BpbGVyVGFzayhwcm9qZWN0UGF0aClcblxuIyBzdG9wIHVuc3VlZCB0cmFuc3BpbGVyIHRhc2tzIGlmIGl0cyBwYXRoIGlzbid0IHByZXNlbnQgaW4gYSBjdXJyZW50XG4jIEF0b20gcHJvamVjdCBmb2xkZXJcbiAgc3RvcFVudXNlZFRhc2tzOiAoKSAtPlxuICAgIGF0b21Qcm9qZWN0UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICAgIGZvciBwcm9qZWN0VGFza1BhdGgsdiBvZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NcbiAgICAgIGlzVGFza0luQ3VycmVudFByb2plY3QgPSBmYWxzZVxuICAgICAgZm9yIGF0b21Qcm9qZWN0UGF0aCBpbiBhdG9tUHJvamVjdFBhdGhzXG4gICAgICAgIGlmIHBhdGhJc0luc2lkZShwcm9qZWN0VGFza1BhdGgsIGF0b21Qcm9qZWN0UGF0aClcbiAgICAgICAgICBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0ID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG4gICAgICBpZiBub3QgaXNUYXNrSW5DdXJyZW50UHJvamVjdCB0aGVuIEBzdG9wVHJhbnNwaWxlclRhc2socHJvamVjdFRhc2tQYXRoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcGlsZXJcbiJdfQ==
