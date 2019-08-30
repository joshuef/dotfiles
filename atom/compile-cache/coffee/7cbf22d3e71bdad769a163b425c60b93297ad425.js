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
            var f, mapJson, ref2, ref3, ref4, xssiProtection;
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
                f = path.join(path.relative(pathTo.transpiledFileDir, pathTo.mapFileDir), pathTo.mapFileName).split(path.sep).join('/');
                msgRet.result.code = msgRet.result.code + '\n' + '//# sourceMappingURL=' + f;
              }
              fs.writeFileSync(pathTo.transpiledFile, msgRet.result.code);
              if (config.createMap && ((ref4 = msgRet.result.map) != null ? ref4.version : void 0)) {
                if (config.createTargetDirectories) {
                  fs.makeTreeSync(path.parse(pathTo.mapFile).dir);
                }
                f = path.join(path.relative(pathTo.mapFileDir, pathTo.sourceFileDir), pathTo.sourceFileName).split(path.sep).join('/');
                mapJson = {
                  version: msgRet.result.map.version,
                  sources: [f],
                  file: f,
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
      var absMapFile, absMapsRoot, absProjectPath, absSourceRoot, absTranspileRoot, absTranspiledFile, fnExt, mapFileName, parsedSourceFile, projectContainingSource, relMapsPath, relSourcePath, relSourceRootToSourceFile, relTranspilePath, sourceFileInProject, sourceFileName;
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
      sourceFileName = parsedSourceFile.name + fnExt;
      mapFileName = parsedSourceFile.name + fnExt + '.map';
      absTranspiledFile = path.normalize(path.join(absTranspileRoot, relSourceRootToSourceFile, sourceFileName));
      absMapFile = path.normalize(path.join(absMapsRoot, relSourceRootToSourceFile, mapFileName));
      return {
        sourceFileInProject: sourceFileInProject,
        sourceFile: sourceFile,
        sourceFileDir: parsedSourceFile.dir,
        sourceFileName: sourceFileName,
        mapFile: absMapFile,
        mapFileDir: path.parse(absMapFile).dir,
        mapFileName: mapFileName,
        transpiledFile: absTranspiledFile,
        transpiledFileDir: path.parse(absTranspiledFile).dir,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvdHJhbnNwaWxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxlQUFELEVBQU87O0VBQ1AsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEsZ0NBQVI7O0VBR2YsRUFBQSxHQUFLLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYztJQUNqQixHQUFBLEVBQUssU0FBQyxNQUFELEVBQVMsR0FBVDs7UUFDSCxNQUFNLENBQUMsS0FBTSxPQUFBLENBQVEsU0FBUjs7YUFDYixNQUFNLENBQUMsRUFBRyxDQUFBLEdBQUE7SUFGUCxDQURZO0dBQWQ7O0VBT0wsbUJBQUEsR0FBc0I7SUFDcEIsSUFBQSxFQUFNLFFBRGM7SUFFcEIsVUFBQSxFQUFZO01BQ1YsYUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BRHhCO01BRVYsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BRnhCO01BR1YsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BSHhCO01BSVYsa0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUp4QjtNQUtWLFNBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQUx4QjtNQU1WLHVCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FOeEI7TUFPVixvQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BUHhCO01BUVYsOEJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVJ4QjtNQVNWLGlCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FUeEI7TUFVVixXQUFBLEVBQWtDO1FB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dUJBQUE7O1FBQ0Usc0JBQUEsR0FBeUI7QUFDekIsYUFBQSxrREFBQTs7VUFDRSxJQUFHLFlBQUEsQ0FBYSxlQUFiLEVBQThCLGVBQTlCLENBQUg7WUFDRSxzQkFBQSxHQUF5QjtBQUN6QixrQkFGRjs7QUFERjtRQUlBLElBQUcsQ0FBSSxzQkFBUDt1QkFBbUMsSUFBQyxDQUFBLGtCQUFELENBQW9CLGVBQXBCLEdBQW5DO1NBQUEsTUFBQTsrQkFBQTs7QUFORjs7SUFGZTs7Ozs7O0VBVW5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBcGNqQiIsInNvdXJjZXNDb250ZW50IjpbIntUYXNrLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gPSByZXF1aXJlICdhdG9tJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5wYXRoSXNJbnNpZGUgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvcGF0aC1pcy1pbnNpZGUnXG5cbiMgTGF6aWx5IHJlcXVpcmUgZnMtcGx1cyB0byBhdm9pZCBibG9ja2luZyBzdGFydHVwLlxuZnMgPSBuZXcgUHJveHkoe30sIHtcbiAgZ2V0OiAodGFyZ2V0LCBrZXkpIC0+XG4gICAgdGFyZ2V0LmZzID89IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gICAgdGFyZ2V0LmZzW2tleV1cbn0pXG5cbiMgc2V0dXAgSlNPTiBTY2hlbWEgdG8gcGFyc2UgLmxhbmd1YWdlYmFiZWwgY29uZmlnc1xubGFuZ3VhZ2ViYWJlbFNjaGVtYSA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHByb3BlcnRpZXM6IHtcbiAgICBiYWJlbE1hcHNQYXRoOiAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGJhYmVsTWFwc0FkZFVybDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGJhYmVsU291cmNlUGF0aDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgYmFiZWxUcmFuc3BpbGVQYXRoOiAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBjcmVhdGVNYXA6ICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUYXJnZXREaXJlY3RvcmllczogICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUcmFuc3BpbGVkQ29kZTogICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBkaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGg6ICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBrZWVwRmlsZUV4dGVuc2lvbjogICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBwcm9qZWN0Um9vdDogICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlczogICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzOiAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICB0cmFuc3BpbGVPblNhdmU6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfVxuICB9LFxuICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2Vcbn1cblxuY2xhc3MgVHJhbnNwaWxlclxuXG4gIGZyb21HcmFtbWFyTmFtZTogJ0JhYmVsIEVTNiBKYXZhU2NyaXB0J1xuICBmcm9tU2NvcGVOYW1lOiAnc291cmNlLmpzLmpzeCdcbiAgdG9TY29wZU5hbWU6ICdzb3VyY2UuanMuanN4J1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZXFJZCA9IDBcbiAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3MgPSB7fVxuICAgIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCA9IHJlcXVpcmUucmVzb2x2ZSAnLi90cmFuc3BpbGVyLXRhc2snXG4gICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9ucyA9IHt9XG4gICAgQGRlcHJlY2F0ZUNvbmZpZygpXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGlmIEBnZXRDb25maWcoKS50cmFuc3BpbGVPblNhdmUgb3IgQGdldENvbmZpZygpLmFsbG93TG9jYWxPdmVycmlkZVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbnRleHRNZW51LmFkZCB7XG4gICAgICAgICcudHJlZS12aWV3IC5kaXJlY3RvcnkgPiAuaGVhZGVyID4gLm5hbWUnOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTGFuZ3VhZ2UtQmFiZWwnXG4gICAgICAgICAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3J5ICcsIGNvbW1hbmQ6ICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3J5J31cbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3JpZXMnLCBjb21tYW5kOiAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yaWVzJ31cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeyd0eXBlJzogJ3NlcGFyYXRvcicgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcnknLCBAY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yeVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcmllcycsIEBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3JpZXNcblxuICAjIG1ldGhvZCB1c2VkIGJ5IHNvdXJjZS1wcmV2aWV3IHRvIHNlZSB0cmFuc3BpbGVkIGNvZGVcbiAgdHJhbnNmb3JtOiAoY29kZSwge2ZpbGVQYXRoLCBzb3VyY2VNYXB9KSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBmaWxlUGF0aCwgY29uZmlnXG4gICAgIyBjcmVhdGUgYmFiZWwgdHJhbnNmb3JtZXIgdGFza3MgLSBvbmUgcGVyIHByb2plY3QgYXMgbmVlZGVkXG4gICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG4gICAgYmFiZWxPcHRpb25zID1cbiAgICAgIGZpbGVuYW1lOiBmaWxlUGF0aFxuICAgICAgYXN0OiBmYWxzZVxuICAgIGlmIHNvdXJjZU1hcCB0aGVuIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzID0gc291cmNlTWFwXG4gICAgIyBvayBub3cgdHJhbnNwaWxlIGluIHRoZSB0YXNrIGFuZCB3YWl0IG9uIHRoZSByZXN1bHRcbiAgICBpZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgcmVxSWQgPSBAcmVxSWQrK1xuICAgICAgbXNnT2JqZWN0ID1cbiAgICAgICAgcmVxSWQ6IHJlcUlkXG4gICAgICAgIGNvbW1hbmQ6ICd0cmFuc3BpbGVDb2RlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBjb2RlOiBjb2RlXG4gICAgICAgIGJhYmVsT3B0aW9uczogYmFiZWxPcHRpb25zXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0ICkgPT5cbiAgICAgICMgdHJhbnNwaWxlIGluIHRhc2tcbiAgICAgIHRyeVxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgICAgcmVqZWN0KFwiRXJyb3IgI3tlcnJ9IHNlbmRpbmcgdG8gdHJhbnNwaWxlIHRhc2sgd2l0aCBQSUQgI3tAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5jaGlsZFByb2Nlc3MucGlkfVwiKVxuICAgICAgIyBnZXQgcmVzdWx0IGZyb20gdGFzayBmb3IgdGhpcyByZXFJZFxuICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0ub25jZSBcInRyYW5zcGlsZToje3JlcUlkfVwiLCAobXNnUmV0KSA9PlxuICAgICAgICBpZiBtc2dSZXQuZXJyP1xuICAgICAgICAgIHJlamVjdChcIkJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259XFxuI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG1zZ1JldC5zb3VyY2VNYXAgPSBtc2dSZXQubWFwXG4gICAgICAgICAgcmVzb2x2ZShtc2dSZXQpXG5cbiAgIyBjYWxsZWQgYnkgY29tbWFuZFxuICBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3J5OiAoe3RhcmdldH0pID0+XG4gICAgQHRyYW5zcGlsZURpcmVjdG9yeSB7ZGlyZWN0b3J5OiB0YXJnZXQuZGF0YXNldC5wYXRoIH1cblxuICAjIGNhbGxlZCBieSBjb21tYW5kXG4gIGNvbW1hbmRUcmFuc3BpbGVEaXJlY3RvcmllczogKHt0YXJnZXR9KSA9PlxuICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogdGFyZ2V0LmRhdGFzZXQucGF0aCwgcmVjdXJzaXZlOiB0cnVlfVxuXG4gICMgdHJhbnNwaWxlIGFsbCBmaWxlcyBpbiBhIGRpcmVjdG9yeSBvciByZWN1cnNpdmUgZGlyZWN0b3JpZXNcbiAgIyBvcHRpb25zIGFyZSB7IGRpcmVjdG9yeTogbmFtZSwgcmVjdXJzaXZlOiB0cnVlfGZhbHNlfVxuICB0cmFuc3BpbGVEaXJlY3Rvcnk6IChvcHRpb25zKSAtPlxuICAgIGRpcmVjdG9yeSA9IG9wdGlvbnMuZGlyZWN0b3J5XG4gICAgcmVjdXJzaXZlID0gb3B0aW9ucy5yZWN1cnNpdmUgb3IgZmFsc2VcbiAgICBmcy5yZWFkZGlyIGRpcmVjdG9yeSwgKGVycixmaWxlcykgPT5cbiAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgIGZpbGVzLm1hcCAoZmlsZSkgPT5cbiAgICAgICAgICBmcUZpbGVOYW1lID0gcGF0aC5qb2luKGRpcmVjdG9yeSwgZmlsZSlcbiAgICAgICAgICBmcy5zdGF0IGZxRmlsZU5hbWUsIChlcnIsIHN0YXRzKSA9PlxuICAgICAgICAgICAgaWYgbm90IGVycj9cbiAgICAgICAgICAgICAgaWYgc3RhdHMuaXNGaWxlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgL1xcLm1pblxcLlthLXpdKyQvLnRlc3QgZnFGaWxlTmFtZSAjIG5vIG1pbmltaXplZCBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIC9cXC4oanN8anN4fGVzfGVzNnxiYWJlbHxtanMpJC8udGVzdCBmcUZpbGVOYW1lICMgb25seSBqc1xuICAgICAgICAgICAgICAgICAgQHRyYW5zcGlsZSBmaWxlLCBudWxsLCBAZ2V0Q29uZmlnQW5kUGF0aFRvIGZxRmlsZU5hbWVcbiAgICAgICAgICAgICAgZWxzZSBpZiByZWN1cnNpdmUgYW5kIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IGZxRmlsZU5hbWUsIHJlY3Vyc2l2ZTogdHJ1ZX1cblxuICAjIHRyYW5zcGlsZSBzb3VyY2VGaWxlIGVkaXRlZCBieSB0aGUgb3B0aW9uYWwgdGV4dEVkaXRvclxuICB0cmFuc3BpbGU6IChzb3VyY2VGaWxlLCB0ZXh0RWRpdG9yLCBjb25maWdBbmRQYXRoVG8pIC0+XG4gICAgIyBnZXQgY29uZmlnXG4gICAgaWYgY29uZmlnQW5kUGF0aFRvP1xuICAgICAgeyBjb25maWcsIHBhdGhUbyB9ID0gY29uZmlnQW5kUGF0aFRvXG4gICAgZWxzZVxuICAgICAge2NvbmZpZywgcGF0aFRvIH0gPSBAZ2V0Q29uZmlnQW5kUGF0aFRvKHNvdXJjZUZpbGUpXG5cbiAgICByZXR1cm4gaWYgY29uZmlnLnRyYW5zcGlsZU9uU2F2ZSBpc250IHRydWVcblxuICAgIGlmIGNvbmZpZy5kaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGhcbiAgICAgIGlmIG5vdCBAaXNCYWJlbHJjSW5QYXRoIHBhdGhUby5zb3VyY2VGaWxlRGlyXG4gICAgICAgIHJldHVyblxuXG4gICAgaWYgbm90IHBhdGhJc0luc2lkZShwYXRoVG8uc291cmNlRmlsZSwgcGF0aFRvLnNvdXJjZVJvb3QpXG4gICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzU291cmNlUGF0aE1lc3NhZ2VzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nICdMQjogQmFiZWwgZmlsZSBpcyBub3QgaW5zaWRlIHRoZSBcIkJhYmVsIFNvdXJjZSBQYXRoXCIgZGlyZWN0b3J5LicsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IGZhbHNlXG4gICAgICAgICAgZGV0YWlsOiBcIk5vIHRyYW5zcGlsZWQgY29kZSBvdXRwdXQgZm9yIGZpbGUgXFxuI3twYXRoVG8uc291cmNlRmlsZX1cbiAgICAgICAgICAgIFxcblxcblRvIHN1cHByZXNzIHRoZXNlICdpbnZhbGlkIHNvdXJjZSBwYXRoJ1xuICAgICAgICAgICAgbWVzc2FnZXMgdXNlIGxhbmd1YWdlLWJhYmVsIHBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgcmV0dXJuXG5cbiAgICBiYWJlbE9wdGlvbnMgPSBAZ2V0QmFiZWxPcHRpb25zIGNvbmZpZ1xuXG4gICAgQGNsZWFuTm90aWZpY2F0aW9ucyhwYXRoVG8pXG5cbiAgICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgICBAY3JlYXRlVGFzayBwYXRoVG8ucHJvamVjdFBhdGhcblxuICAgICMgb2sgbm93IHRyYW5zcGlsZSBpbiB0aGUgdGFzayBhbmQgd2FpdCBvbiB0aGUgcmVzdWx0XG4gICAgaWYgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgIHJlcUlkID0gQHJlcUlkKytcbiAgICAgIG1zZ09iamVjdCA9XG4gICAgICAgIHJlcUlkOiByZXFJZFxuICAgICAgICBjb21tYW5kOiAndHJhbnNwaWxlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBiYWJlbE9wdGlvbnM6IGJhYmVsT3B0aW9uc1xuXG4gICAgICAjIHRyYW5zcGlsZSBpbiB0YXNrXG4gICAgICB0cnlcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgY29uc29sZS5sb2cgXCJFcnJvciAje2Vycn0gc2VuZGluZyB0byB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuICAgICAgICBjb25zb2xlLmxvZyBcIlJlc3RhcnRlZCB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCJcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiAgICAgICMgZ2V0IHJlc3VsdCBmcm9tIHRhc2sgZm9yIHRoaXMgcmVxSWRcbiAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLm9uY2UgXCJ0cmFuc3BpbGU6I3tyZXFJZH1cIiwgKG1zZ1JldCkgPT5cbiAgICAgICAgIyAuaWdub3JlZCBpcyByZXR1cm5lZCB3aGVuIC5iYWJlbHJjIGlnbm9yZS9vbmx5IGZsYWdzIGFyZSB1c2VkXG4gICAgICAgIGlmIG1zZ1JldC5yZXN1bHQ/Lmlnbm9yZWQgdGhlbiByZXR1cm5cbiAgICAgICAgaWYgbXNnUmV0LmVyclxuICAgICAgICAgIGlmIG1zZ1JldC5lcnIuc3RhY2tcbiAgICAgICAgICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdID1cbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEJhYmVsIFRyYW5zcGlsZXIgRXJyb3JcIixcbiAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIGRldGFpbDogXCIje21zZ1JldC5lcnIubWVzc2FnZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cXG4gXFxuI3ttc2dSZXQuZXJyLnN0YWNrfVwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0gPVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn0gVHJhbnNwaWxlciBFcnJvclwiLFxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVxcbiBcXG4je21zZ1JldC5lcnIuY29kZUZyYW1lfVwiXG4gICAgICAgICAgICAjIGlmIHdlIGhhdmUgYSBsaW5lL2NvbCBzeW50YXggZXJyb3IganVtcCB0byB0aGUgcG9zaXRpb25cbiAgICAgICAgICAgIGlmIG1zZ1JldC5lcnIubG9jPy5saW5lPyBhbmQgdGV4dEVkaXRvcj8uYWxpdmVcbiAgICAgICAgICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiBbbXNnUmV0LmVyci5sb2MubGluZS0xLCBtc2dSZXQuZXJyLmxvYy5jb2x1bW5dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXNcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvIFwiTEI6IEJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259IFRyYW5zcGlsZXIgU3VjY2Vzc1wiLFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiI3twYXRoVG8uc291cmNlRmlsZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIlxuXG4gICAgICAgICAgaWYgbm90IGNvbmZpZy5jcmVhdGVUcmFuc3BpbGVkQ29kZVxuICAgICAgICAgICAgaWYgbm90IGNvbmZpZy5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzXG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvICdMQjogTm8gdHJhbnNwaWxlZCBvdXRwdXQgY29uZmlndXJlZCdcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGlmIHBhdGhUby5zb3VyY2VGaWxlIGlzIHBhdGhUby50cmFuc3BpbGVkRmlsZVxuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgJ0xCOiBUcmFuc3BpbGVkIGZpbGUgd291bGQgb3ZlcndyaXRlIHNvdXJjZSBmaWxlLiBBYm9ydGVkIScsXG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgIGRldGFpbDogcGF0aFRvLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgIyB3cml0ZSBjb2RlIGFuZCBtYXBzXG4gICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZVRhcmdldERpcmVjdG9yaWVzXG4gICAgICAgICAgICBmcy5tYWtlVHJlZVN5bmMoIHBhdGgucGFyc2UoIHBhdGhUby50cmFuc3BpbGVkRmlsZSkuZGlyKVxuXG4gICAgICAgICAgIyBhZGQgc291cmNlIG1hcCB1cmwgdG8gY29kZSBpZiBmaWxlIGlzbid0IGlnbm9yZWRcbiAgICAgICAgICBpZiBjb25maWcuYmFiZWxNYXBzQWRkVXJsXG4gICAgICAgICAgICAjIE1ha2UgdW5peCB0eXBlIHBhdGggLSBtYXAgZmlsZSBsb2NhdGlvbiByZWxhdGl2ZSB0byB0cmFuc3BpbGVkIGZpbGVcbiAgICAgICAgICAgIGYgPSBwYXRoLmpvaW4ocGF0aC5yZWxhdGl2ZShwYXRoVG8udHJhbnNwaWxlZEZpbGVEaXIsIHBhdGhUby5tYXBGaWxlRGlyKSwgcGF0aFRvLm1hcEZpbGVOYW1lKS5zcGxpdChwYXRoLnNlcCkuam9pbignLycpXG4gICAgICAgICAgICBtc2dSZXQucmVzdWx0LmNvZGUgPSBtc2dSZXQucmVzdWx0LmNvZGUgKyAnXFxuJyArICcvLyMgc291cmNlTWFwcGluZ1VSTD0nK2ZcblxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgcGF0aFRvLnRyYW5zcGlsZWRGaWxlLCBtc2dSZXQucmVzdWx0LmNvZGVcblxuICAgICAgICAgICMgd3JpdGUgc291cmNlIG1hcCBpZiByZXR1cm5lZCBhbmQgaWYgYXNrZWRcbiAgICAgICAgICBpZiBjb25maWcuY3JlYXRlTWFwIGFuZCBtc2dSZXQucmVzdWx0Lm1hcD8udmVyc2lvblxuICAgICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZVRhcmdldERpcmVjdG9yaWVzXG4gICAgICAgICAgICAgIGZzLm1ha2VUcmVlU3luYyhwYXRoLnBhcnNlKHBhdGhUby5tYXBGaWxlKS5kaXIpXG5cbiAgICAgICAgICAgICMgTWFrZSB1bml4IHR5cGUgcGF0aCAtIG9yaWdpbmFsIHNvdXJjZSBmaWxlICByZWxhdGl2ZSB0byBtYXAgZmlsZVxuICAgICAgICAgICAgZiA9IHBhdGguam9pbihwYXRoLnJlbGF0aXZlKHBhdGhUby5tYXBGaWxlRGlyLCBwYXRoVG8uc291cmNlRmlsZURpciApLCBwYXRoVG8uc291cmNlRmlsZU5hbWUpLnNwbGl0KHBhdGguc2VwKS5qb2luKCcvJylcblxuICAgICAgICAgICAgbWFwSnNvbiA9XG4gICAgICAgICAgICAgIHZlcnNpb246IG1zZ1JldC5yZXN1bHQubWFwLnZlcnNpb25cbiAgICAgICAgICAgICAgc291cmNlczogIFtmXVxuICAgICAgICAgICAgICBmaWxlOiBmXG4gICAgICAgICAgICAgIG5hbWVzOiBtc2dSZXQucmVzdWx0Lm1hcC5uYW1lc1xuICAgICAgICAgICAgICBtYXBwaW5nczogbXNnUmV0LnJlc3VsdC5tYXAubWFwcGluZ3NcbiAgICAgICAgICAgIHhzc2lQcm90ZWN0aW9uID0gJyldfVxcbidcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgcGF0aFRvLm1hcEZpbGUsXG4gICAgICAgICAgICAgIHhzc2lQcm90ZWN0aW9uICsgSlNPTi5zdHJpbmdpZnkgbWFwSnNvbiwgbnVsbCwgJyAnXG5cbiAgIyBjbGVhbiBub3RpZmljYXRpb24gbWVzc2FnZXNcbiAgY2xlYW5Ob3RpZmljYXRpb25zOiAocGF0aFRvKSAtPlxuICAgICMgYXV0byBkaXNtaXNzIHByZXZpb3VzIHRyYW5zcGlsZSBlcnJvciBub3RpZmljYXRpb25zIGZvciB0aGlzIHNvdXJjZSBmaWxlXG4gICAgaWYgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0/XG4gICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXS5kaXNtaXNzKClcbiAgICAgIGRlbGV0ZSBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXVxuICAgICMgcmVtb3ZlIGFueSB1c2VyIGRpc21pc3NlZCBub3RpZmljYXRpb24gb2JqZWN0IHJlZmVyZW5jZXNcbiAgICBmb3Igc2YsIG4gb2YgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1xuICAgICAgaWYgbi5kaXNtaXNzZWRcbiAgICAgICAgZGVsZXRlIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbc2ZdXG4gICAgIyBGSVggZm9yIGF0b20gbm90aWZpY2F0aW9ucy4gZGlzbWlzc2VkIG5vZnRpZmljYXRpb25zIHZpYSB3aGF0ZXZlciBtZWFuc1xuICAgICMgYXJlIG5ldmVyIGFjdHVhbGx5IHJlbW92ZWQgZnJvbSBtZW1vcnkuIEkgY29uc2lkZXIgdGhpcyBhIG1lbW9yeSBsZWFrXG4gICAgIyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvODYxNCBzbyByZW1vdmUgYW55IGRpc21pc3NlZFxuICAgICMgbm90aWZpY2F0aW9uIG9iamVjdHMgcHJlZml4ZWQgd2l0aCBhIG1lc3NhZ2UgcHJlZml4IG9mIExCOiBmcm9tIG1lbW9yeVxuICAgIGkgPSBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5sZW5ndGggLSAxXG4gICAgd2hpbGUgaSA+PSAwXG4gICAgICBpZiBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5kaXNtaXNzZWQgYW5kXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5tZXNzYWdlLnN1YnN0cmluZygwLDMpIGlzIFwiTEI6XCJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMuc3BsaWNlIGksIDFcbiAgICAgIGktLVxuXG4gICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICBjcmVhdGVUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXSA/PVxuICAgICAgVGFzay5vbmNlIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCwgcHJvamVjdFBhdGgsID0+XG4gICAgICAgICMgdGFzayBlbmRlZFxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXVxuXG4gICMgbW9kaWZpZXMgY29uZmlnIG9wdGlvbnMgZm9yIGNoYW5nZWQgb3IgZGVwcmVjYXRlZCBjb25maWdzXG4gIGRlcHJlY2F0ZUNvbmZpZzogLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJyxcbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycsXG4gICAgICAgIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC51c2VJbnRlcm5hbFNjYW5uZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdG9wQXRQcm9qZWN0RGlyZWN0b3J5JylcbiAgICAjIHJlbW92ZSBiYWJlbCBWNSBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmJhYmVsU3RhZ2UnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5leHRlcm5hbEhlbHBlcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5tb2R1bGVMb2FkZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5ibGFja2xpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC53aGl0ZWxpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5sb29zZVRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLm9wdGlvbmFsVHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwucGx1Z2lucycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnByZXNldHMnKVxuICAgICMgcmVtb3ZlIG9sZCBuYW1lIGluZGVudCBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmZvcm1hdEpTWCcpXG5cbiAgIyBjYWxjdWxhdGUgYmFiZWwgb3B0aW9ucyBiYXNlZCB1cG9uIHBhY2thZ2UgY29uZmlnLCBiYWJlbHJjIGZpbGVzIGFuZFxuICAjIHdoZXRoZXIgaW50ZXJuYWxTY2FubmVyIGlzIHVzZWQuXG4gIGdldEJhYmVsT3B0aW9uczogKGNvbmZpZyktPlxuICAgICMgc2V0IHRyYW5zcGlsZXIgb3B0aW9ucyBmcm9tIHBhY2thZ2UgY29uZmlndXJhdGlvbi5cbiAgICBiYWJlbE9wdGlvbnMgPVxuICAgICAgY29kZTogdHJ1ZVxuICAgIGlmIGNvbmZpZy5jcmVhdGVNYXAgIHRoZW4gYmFiZWxPcHRpb25zLnNvdXJjZU1hcHMgPSBjb25maWcuY3JlYXRlTWFwXG4gICAgYmFiZWxPcHRpb25zXG5cbiAgI2dldCBjb25maWd1cmF0aW9uIGFuZCBwYXRoc1xuICBnZXRDb25maWdBbmRQYXRoVG86IChzb3VyY2VGaWxlKSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcblxuICAgIGlmIGNvbmZpZy5hbGxvd0xvY2FsT3ZlcnJpZGVcbiAgICAgIGlmIG5vdCBAanNvblNjaGVtYT9cbiAgICAgICAgQGpzb25TY2hlbWEgPSAocmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL2pqdicpKCkgIyB1c2Ugamp2IGFzIGl0IHJ1bnMgd2l0aG91dCBDU1AgaXNzdWVzXG4gICAgICAgIEBqc29uU2NoZW1hLmFkZFNjaGVtYSAnbG9jYWxDb25maWcnLCBsYW5ndWFnZWJhYmVsU2NoZW1hXG4gICAgICBsb2NhbENvbmZpZyA9IEBnZXRMb2NhbENvbmZpZyBwYXRoVG8uc291cmNlRmlsZURpciwgcGF0aFRvLnByb2plY3RQYXRoLCB7fVxuICAgICAgIyBtZXJnZSBsb2NhbCBjb25maWdzIHdpdGggZ2xvYmFsLiBsb2NhbCB3aW5zXG4gICAgICBAbWVyZ2UgY29uZmlnLCBsb2NhbENvbmZpZ1xuICAgICAgIyByZWNhbGMgcGF0aHNcbiAgICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcbiAgICByZXR1cm4geyBjb25maWcsIHBhdGhUbyB9XG5cbiAgIyBnZXQgZ2xvYmFsIGNvbmZpZ3VyYXRpb24gZm9yIGxhbmd1YWdlLWJhYmVsXG4gIGdldENvbmZpZzogLT4gYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbCcpXG5cbiMgY2hlY2sgZm9yIHByZXNjZW5jZSBvZiBhIC5sYW5ndWFnZWJhYmVsIGZpbGUgcGF0aCBmcm9tRGlyIHRvRGlyXG4jIHJlYWQsIHZhbGlkYXRlIGFuZCBvdmVyd3JpdGUgY29uZmlnIGFzIHJlcXVpcmVkXG4jIHRvRGlyIGlzIG5vcm1hbGx5IHRoZSBpbXBsaWNpdCBBdG9tIHByb2plY3QgZm9sZGVycyByb290IGJ1dCB3ZVxuIyB3aWxsIHN0b3Agb2YgYSBwcm9qZWN0Um9vdCB0cnVlIGlzIGZvdW5kIGFzIHdlbGxcbiAgZ2V0TG9jYWxDb25maWc6IChmcm9tRGlyLCB0b0RpciwgbG9jYWxDb25maWcpIC0+XG4gICAgIyBnZXQgbG9jYWwgcGF0aCBvdmVyaWRlc1xuICAgIGxvY2FsQ29uZmlnRmlsZSA9ICcubGFuZ3VhZ2ViYWJlbCdcbiAgICBsYW5ndWFnZUJhYmVsQ2ZnRmlsZSA9IHBhdGguam9pbiBmcm9tRGlyLCBsb2NhbENvbmZpZ0ZpbGVcbiAgICBpZiBmcy5leGlzdHNTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlXG4gICAgICBmaWxlQ29udGVudD0gZnMucmVhZEZpbGVTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlLCAndXRmOCdcbiAgICAgIHRyeVxuICAgICAgICBqc29uQ29udGVudCA9IEpTT04ucGFyc2UgZmlsZUNvbnRlbnRcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9ICN7ZXJyLm1lc3NhZ2V9XCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiRmlsZSA9ICN7bGFuZ3VhZ2VCYWJlbENmZ0ZpbGV9XFxuXFxuI3tmaWxlQ29udGVudH1cIlxuICAgICAgICByZXR1cm5cblxuICAgICAgc2NoZW1hRXJyb3JzID0gQGpzb25TY2hlbWEudmFsaWRhdGUgJ2xvY2FsQ29uZmlnJywganNvbkNvbnRlbnRcbiAgICAgIGlmIHNjaGVtYUVycm9yc1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9IGNvbmZpZ3VyYXRpb24gZXJyb3JcIixcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIGRldGFpbDogXCJGaWxlID0gI3tsYW5ndWFnZUJhYmVsQ2ZnRmlsZX1cXG5cXG4je2ZpbGVDb250ZW50fVwiXG4gICAgICBlbHNlXG4gICAgICAgICMgbWVyZ2UgbG9jYWwgY29uZmlnLiBjb25maWcgY2xvc2VzdCBzb3VyY2VGaWxlIHdpbnNcbiAgICAgICAgIyBhcGFydCBmcm9tIHByb2plY3RSb290IHdoaWNoIHdpbnMgb24gdHJ1ZVxuICAgICAgICBpc1Byb2plY3RSb290ID0ganNvbkNvbnRlbnQucHJvamVjdFJvb3RcbiAgICAgICAgQG1lcmdlICBqc29uQ29udGVudCwgbG9jYWxDb25maWdcbiAgICAgICAgaWYgaXNQcm9qZWN0Um9vdCB0aGVuIGpzb25Db250ZW50LnByb2plY3RSb290RGlyID0gZnJvbURpclxuICAgICAgICBsb2NhbENvbmZpZyA9IGpzb25Db250ZW50XG4gICAgaWYgZnJvbURpciBpc250IHRvRGlyXG4gICAgICAjIHN0b3AgaW5maW5pdGUgcmVjdXJzaW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9nYW5kbS9sYW5ndWFnZS1iYWJlbC9pc3N1ZXMvNjZcbiAgICAgIGlmIGZyb21EaXIgPT0gcGF0aC5kaXJuYW1lKGZyb21EaXIpIHRoZW4gcmV0dXJuIGxvY2FsQ29uZmlnXG4gICAgICAjIGNoZWNrIHByb2plY3RSb290IHByb3BlcnR5IGFuZCBlbmQgcmVjdXJzaW9uIGlmIHRydWVcbiAgICAgIGlmIGlzUHJvamVjdFJvb3QgdGhlbiByZXR1cm4gbG9jYWxDb25maWdcbiAgICAgIHJldHVybiBAZ2V0TG9jYWxDb25maWcgcGF0aC5kaXJuYW1lKGZyb21EaXIpLCB0b0RpciwgbG9jYWxDb25maWdcbiAgICBlbHNlIHJldHVybiBsb2NhbENvbmZpZ1xuXG4gICMgY2FsY3VsYXRlIGFic291bHRlIHBhdGhzIG9mIGJhYmVsIHNvdXJjZSwgdGFyZ2V0IGpzIGFuZCBtYXBzIGZpbGVzXG4gICMgYmFzZWQgdXBvbiB0aGUgcHJvamVjdCBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgc291cmNlXG4gICMgYW5kIHRoZSByb290cyBvZiBzb3VyY2UsIHRyYW5zcGlsZSBwYXRoIGFuZCBtYXBzIHBhdGhzIGRlZmluZWQgaW4gY29uZmlnXG4gIGdldFBhdGhzOiAgKHNvdXJjZUZpbGUsIGNvbmZpZykgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBzb3VyY2VGaWxlXG4gICAgIyBJcyB0aGUgc291cmNlRmlsZSBsb2NhdGVkIGluc2lkZSBhbiBBdG9tIHByb2plY3QgZm9sZGVyP1xuICAgIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIHNvdXJjZUZpbGVJblByb2plY3QgPSBmYWxzZVxuICAgIGVsc2Ugc291cmNlRmlsZUluUHJvamVjdCA9IHRydWVcbiAgICAjIGRldGVybWluZXMgdGhlIHByb2plY3Qgcm9vdCBkaXIgZnJvbSAubGFuZ3VhZ2ViYWJlbCBvciBmcm9tIEF0b21cbiAgICAjIGlmIGEgcHJvamVjdCBpcyBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgYXRvbSBwYXNzZXMgYmFjayBhIG51bGwgZm9yXG4gICAgIyB0aGUgcHJvamVjdCBwYXRoIGlmIHRoZSBmaWxlIGlzbid0IGluIGEgcHJvamVjdCBmb2xkZXJcbiAgICAjIHNvIG1ha2UgdGhlIHJvb3QgZGlyIHRoYXQgc291cmNlIGZpbGUgdGhlIHByb2plY3RcbiAgICBpZiBjb25maWcucHJvamVjdFJvb3REaXI/XG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5wcm9qZWN0Um9vdERpcilcbiAgICBlbHNlIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5wYXJzZShzb3VyY2VGaWxlKS5yb290XG4gICAgZWxzZVxuICAgICAgIyBBdG9tIDEuOCByZXR1cm5pbmcgZHJpdmUgYXMgcHJvamVjdCByb290IG9uIHdpbmRvd3MgZS5nLiBjOiBub3QgYzpcXFxuICAgICAgIyB1c2luZyBwYXRoLmpvaW4gdG8gJy4nIGZpeGVzIGl0LlxuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4ocHJvamVjdENvbnRhaW5pbmdTb3VyY2VbMF0sJy4nKSlcbiAgICByZWxTb3VyY2VQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsU291cmNlUGF0aClcbiAgICByZWxUcmFuc3BpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aClcbiAgICByZWxNYXBzUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbE1hcHNQYXRoKVxuXG4gICAgYWJzU291cmNlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFNvdXJjZVBhdGgpXG4gICAgYWJzVHJhbnNwaWxlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFRyYW5zcGlsZVBhdGgpXG4gICAgYWJzTWFwc1Jvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxNYXBzUGF0aClcblxuICAgIHBhcnNlZFNvdXJjZUZpbGUgPSBwYXRoLnBhcnNlKHNvdXJjZUZpbGUpXG4gICAgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSA9IHBhdGgucmVsYXRpdmUoYWJzU291cmNlUm9vdCwgcGFyc2VkU291cmNlRmlsZS5kaXIpXG5cbiAgICAjIG9wdGlvbiB0byBrZWVwIGZpbGVuYW1lIGV4dGVuc2lvbiBuYW1lXG4gICAgaWYgY29uZmlnLmtlZXBGaWxlRXh0ZW5zaW9uXG4gICAgICBmbkV4dCA9IHBhcnNlZFNvdXJjZUZpbGUuZXh0XG4gICAgZWxzZVxuICAgICAgZm5FeHQgPSAgJy5qcydcblxuICAgIHNvdXJjZUZpbGVOYW1lID0gcGFyc2VkU291cmNlRmlsZS5uYW1lICArIGZuRXh0XG4gICAgbWFwRmlsZU5hbWUgPSBwYXJzZWRTb3VyY2VGaWxlLm5hbWUgICsgZm5FeHQgKyAnLm1hcCdcbiAgICBcbiAgICBhYnNUcmFuc3BpbGVkRmlsZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihhYnNUcmFuc3BpbGVSb290LCByZWxTb3VyY2VSb290VG9Tb3VyY2VGaWxlICwgc291cmNlRmlsZU5hbWUgKSlcbiAgICBhYnNNYXBGaWxlID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKGFic01hcHNSb290LCByZWxTb3VyY2VSb290VG9Tb3VyY2VGaWxlLCBtYXBGaWxlTmFtZSApKVxuXG4gICAgc291cmNlRmlsZUluUHJvamVjdDogc291cmNlRmlsZUluUHJvamVjdFxuICAgIHNvdXJjZUZpbGU6IHNvdXJjZUZpbGVcbiAgICBzb3VyY2VGaWxlRGlyOiBwYXJzZWRTb3VyY2VGaWxlLmRpclxuICAgIHNvdXJjZUZpbGVOYW1lOiBzb3VyY2VGaWxlTmFtZVxuICAgIG1hcEZpbGU6IGFic01hcEZpbGVcbiAgICBtYXBGaWxlRGlyOiBwYXRoLnBhcnNlKGFic01hcEZpbGUpLmRpclxuICAgIG1hcEZpbGVOYW1lOiBtYXBGaWxlTmFtZVxuICAgIHRyYW5zcGlsZWRGaWxlOiBhYnNUcmFuc3BpbGVkRmlsZVxuICAgIHRyYW5zcGlsZWRGaWxlRGlyOiBwYXRoLnBhcnNlKGFic1RyYW5zcGlsZWRGaWxlKS5kaXJcbiAgICBzb3VyY2VSb290OiBhYnNTb3VyY2VSb290XG4gICAgcHJvamVjdFBhdGg6IGFic1Byb2plY3RQYXRoXG5cbiMgY2hlY2sgZm9yIHByZXNjZW5jZSBvZiBhIC5iYWJlbHJjIGZpbGUgcGF0aCBmcm9tRGlyIHRvIHJvb3RcbiAgaXNCYWJlbHJjSW5QYXRoOiAoZnJvbURpcikgLT5cbiAgICAjIGVudmlyb21uZW50cyB1c2VkIGluIGJhYmVscmNcbiAgICBiYWJlbHJjID0gW1xuICAgICAgJy5iYWJlbHJjJ1xuICAgICAgJy5iYWJlbHJjLmpzJyAjIEJhYmVsIDcuMCBhbmQgbmV3ZXJcbiAgICBdXG4gICAgYmFiZWxyY0ZpbGVzID0gYmFiZWxyYy5tYXAgKGZpbGUpIC0+IHBhdGguam9pbihmcm9tRGlyLCBmaWxlKVxuXG4gICAgaWYgYmFiZWxyY0ZpbGVzLnNvbWUgZnMuZXhpc3RzU3luY1xuICAgICAgcmV0dXJuIHRydWVcbiAgICBpZiBmcm9tRGlyICE9IHBhdGguZGlybmFtZShmcm9tRGlyKVxuICAgICAgcmV0dXJuIEBpc0JhYmVscmNJblBhdGggcGF0aC5kaXJuYW1lKGZyb21EaXIpXG4gICAgZWxzZSByZXR1cm4gZmFsc2VcblxuIyBzaW1wbGUgbWVyZ2Ugb2Ygb2JqZWN0c1xuICBtZXJnZTogKHRhcmdldE9iaiwgc291cmNlT2JqKSAtPlxuICAgIGZvciBwcm9wLCB2YWwgb2Ygc291cmNlT2JqXG4gICAgICB0YXJnZXRPYmpbcHJvcF0gPSB2YWxcblxuIyBzdG9wIHRyYW5zcGlsZXIgdGFza1xuICBzdG9wVHJhbnNwaWxlclRhc2s6IChwcm9qZWN0UGF0aCkgLT5cbiAgICBtc2dPYmplY3QgPVxuICAgICAgY29tbWFuZDogJ3N0b3AnXG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcblxuIyBzdG9wIGFsbCB0cmFuc3BpbGVyIHRhc2tzXG4gIHN0b3BBbGxUcmFuc3BpbGVyVGFzazogKCkgLT5cbiAgICBmb3IgcHJvamVjdFBhdGgsIHYgb2YgQGJhYmVsVHJhbnNwaWxlclRhc2tzXG4gICAgICBAc3RvcFRyYW5zcGlsZXJUYXNrKHByb2plY3RQYXRoKVxuXG4jIHN0b3AgdW5zdWVkIHRyYW5zcGlsZXIgdGFza3MgaWYgaXRzIHBhdGggaXNuJ3QgcHJlc2VudCBpbiBhIGN1cnJlbnRcbiMgQXRvbSBwcm9qZWN0IGZvbGRlclxuICBzdG9wVW51c2VkVGFza3M6ICgpIC0+XG4gICAgYXRvbVByb2plY3RQYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgZm9yIHByb2plY3RUYXNrUGF0aCx2IG9mIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1xuICAgICAgaXNUYXNrSW5DdXJyZW50UHJvamVjdCA9IGZhbHNlXG4gICAgICBmb3IgYXRvbVByb2plY3RQYXRoIGluIGF0b21Qcm9qZWN0UGF0aHNcbiAgICAgICAgaWYgcGF0aElzSW5zaWRlKHByb2plY3RUYXNrUGF0aCwgYXRvbVByb2plY3RQYXRoKVxuICAgICAgICAgIGlzVGFza0luQ3VycmVudFByb2plY3QgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGlmIG5vdCBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0IHRoZW4gQHN0b3BUcmFuc3BpbGVyVGFzayhwcm9qZWN0VGFza1BhdGgpXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNwaWxlclxuIl19
