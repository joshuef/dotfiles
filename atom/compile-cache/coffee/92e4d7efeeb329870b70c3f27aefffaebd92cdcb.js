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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvdHJhbnNwaWxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxlQUFELEVBQU87O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxZQUFBLEdBQWUsT0FBQSxDQUFRLGdDQUFSOztFQUdmLG1CQUFBLEdBQXNCO0lBQ3BCLElBQUEsRUFBTSxRQURjO0lBRXBCLFVBQUEsRUFBWTtNQUNWLGFBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUR4QjtNQUVWLGVBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQUZ4QjtNQUdWLGVBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUh4QjtNQUlWLGtCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFFBQVI7T0FKeEI7TUFLVixTQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FMeEI7TUFNVix1QkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BTnhCO01BT1Ysb0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVB4QjtNQVFWLDhCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FSeEI7TUFTVixpQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BVHhCO01BVVYsV0FBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BVnhCO01BV1YsMEJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVh4QjtNQVlWLCtCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FaeEI7TUFhVixlQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FieEI7S0FGUTtJQWlCcEIsb0JBQUEsRUFBc0IsS0FqQkY7OztFQW9CaEI7eUJBRUosZUFBQSxHQUFpQjs7eUJBQ2pCLGFBQUEsR0FBZTs7eUJBQ2YsV0FBQSxHQUFhOztJQUVBLG9CQUFBOzs7TUFDWCxJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLG9CQUFELEdBQXdCO01BQ3hCLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixPQUFPLENBQUMsT0FBUixDQUFnQixtQkFBaEI7TUFDeEIsSUFBQyxDQUFBLDJCQUFELEdBQStCO01BQy9CLElBQUMsQ0FBQSxlQUFELENBQUE7TUFDQSxJQUFDLENBQUEsV0FBRCxHQUFtQixJQUFBLG1CQUFBLENBQUE7TUFDbkIsSUFBRyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQVksQ0FBQyxlQUFiLElBQWdDLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBWSxDQUFDLGtCQUFoRDtRQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQWpCLENBQXFCO1VBQ3BDLHlDQUFBLEVBQTJDO1lBQ3ZDO2NBQ0UsS0FBQSxFQUFPLGdCQURUO2NBRUUsT0FBQSxFQUFTO2dCQUNQO2tCQUFDLEtBQUEsRUFBTyxzQkFBUjtrQkFBZ0MsT0FBQSxFQUFTLG9DQUF6QztpQkFETyxFQUVQO2tCQUFDLEtBQUEsRUFBTyx1QkFBUjtrQkFBaUMsT0FBQSxFQUFTLHNDQUExQztpQkFGTztlQUZYO2FBRHVDLEVBUXZDO2NBQUMsTUFBQSxFQUFRLFdBQVQ7YUFSdUM7V0FEUDtTQUFyQixDQUFqQjtRQVlBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IseUNBQWxCLEVBQTZELG9DQUE3RCxFQUFtRyxJQUFDLENBQUEseUJBQXBHLENBQWpCO1FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQix5Q0FBbEIsRUFBNkQsc0NBQTdELEVBQXFHLElBQUMsQ0FBQSwyQkFBdEcsQ0FBakIsRUFkRjs7SUFQVzs7eUJBd0JiLFNBQUEsR0FBVyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBQ1QsVUFBQTtNQURpQix5QkFBVTtNQUMzQixNQUFBLEdBQVMsSUFBQyxDQUFBLFNBQUQsQ0FBQTtNQUNULE1BQUEsR0FBUyxJQUFDLENBQUEsUUFBRCxDQUFVLFFBQVYsRUFBb0IsTUFBcEI7TUFFVCxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQU0sQ0FBQyxXQUFuQjtNQUNBLFlBQUEsR0FDRTtRQUFBLFFBQUEsRUFBVSxRQUFWO1FBQ0EsR0FBQSxFQUFLLEtBREw7O01BRUYsSUFBRyxTQUFIO1FBQWtCLFlBQVksQ0FBQyxVQUFiLEdBQTBCLFVBQTVDOztNQUVBLElBQUcsSUFBQyxDQUFBLG9CQUFxQixDQUFBLE1BQU0sQ0FBQyxXQUFQLENBQXpCO1FBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxLQUFEO1FBQ1IsU0FBQSxHQUNFO1VBQUEsS0FBQSxFQUFPLEtBQVA7VUFDQSxPQUFBLEVBQVMsZUFEVDtVQUVBLE1BQUEsRUFBUSxNQUZSO1VBR0EsSUFBQSxFQUFNLElBSE47VUFJQSxZQUFBLEVBQWMsWUFKZDtVQUhKOzthQVNJLElBQUEsT0FBQSxDQUFRLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxPQUFELEVBQVUsTUFBVjtBQUVWLGNBQUE7QUFBQTtZQUNFLEtBQUMsQ0FBQSxvQkFBcUIsQ0FBQSxNQUFNLENBQUMsV0FBUCxDQUFtQixDQUFDLElBQTFDLENBQStDLFNBQS9DLEVBREY7V0FBQSxhQUFBO1lBRU07WUFDSixPQUFPLEtBQUMsQ0FBQSxvQkFBcUIsQ0FBQSxNQUFNLENBQUMsV0FBUDtZQUM3QixNQUFBLENBQU8sUUFBQSxHQUFTLEdBQVQsR0FBYSxzQ0FBYixHQUFtRCxLQUFDLENBQUEsb0JBQXFCLENBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsQ0FBQyxZQUFZLENBQUMsR0FBakgsRUFKRjs7aUJBTUEsS0FBQyxDQUFBLG9CQUFxQixDQUFBLE1BQU0sQ0FBQyxXQUFQLENBQW1CLENBQUMsSUFBMUMsQ0FBK0MsWUFBQSxHQUFhLEtBQTVELEVBQXFFLFNBQUMsTUFBRDtZQUNuRSxJQUFHLGtCQUFIO3FCQUNFLE1BQUEsQ0FBTyxTQUFBLEdBQVUsTUFBTSxDQUFDLFlBQWpCLEdBQThCLElBQTlCLEdBQWtDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBN0MsR0FBcUQsSUFBckQsR0FBeUQsTUFBTSxDQUFDLGFBQXZFLEVBREY7YUFBQSxNQUFBO2NBR0UsTUFBTSxDQUFDLFNBQVAsR0FBbUIsTUFBTSxDQUFDO3FCQUMxQixPQUFBLENBQVEsTUFBUixFQUpGOztVQURtRSxDQUFyRTtRQVJVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSO0lBbkJLOzt5QkFtQ1gseUJBQUEsR0FBMkIsU0FBQyxHQUFEO0FBQ3pCLFVBQUE7TUFEMkIsU0FBRDthQUMxQixJQUFDLENBQUEsa0JBQUQsQ0FBb0I7UUFBQyxTQUFBLEVBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUEzQjtPQUFwQjtJQUR5Qjs7eUJBSTNCLDJCQUFBLEdBQTZCLFNBQUMsR0FBRDtBQUMzQixVQUFBO01BRDZCLFNBQUQ7YUFDNUIsSUFBQyxDQUFBLGtCQUFELENBQW9CO1FBQUMsU0FBQSxFQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBM0I7UUFBaUMsU0FBQSxFQUFXLElBQTVDO09BQXBCO0lBRDJCOzt5QkFLN0Isa0JBQUEsR0FBb0IsU0FBQyxPQUFEO0FBQ2xCLFVBQUE7TUFBQSxTQUFBLEdBQVksT0FBTyxDQUFDO01BQ3BCLFNBQUEsR0FBWSxPQUFPLENBQUMsU0FBUixJQUFxQjthQUNqQyxFQUFFLENBQUMsT0FBSCxDQUFXLFNBQVgsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQsRUFBSyxLQUFMO1VBQ3BCLElBQU8sV0FBUDttQkFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFNBQUMsSUFBRDtBQUNSLGtCQUFBO2NBQUEsVUFBQSxHQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixJQUFyQjtxQkFDYixFQUFFLENBQUMsSUFBSCxDQUFRLFVBQVIsRUFBb0IsU0FBQyxHQUFELEVBQU0sS0FBTjtnQkFDbEIsSUFBTyxXQUFQO2tCQUNFLElBQUcsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUFIO29CQUNFLElBQVUsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsVUFBdEIsQ0FBVjtBQUFBLDZCQUFBOztvQkFDQSxJQUFHLDhCQUE4QixDQUFDLElBQS9CLENBQW9DLFVBQXBDLENBQUg7NkJBQ0UsS0FBQyxDQUFBLFNBQUQsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQUMsQ0FBQSxrQkFBRCxDQUFvQixVQUFwQixDQUF2QixFQURGO3FCQUZGO21CQUFBLE1BSUssSUFBRyxTQUFBLElBQWMsS0FBSyxDQUFDLFdBQU4sQ0FBQSxDQUFqQjsyQkFDSCxLQUFDLENBQUEsa0JBQUQsQ0FBb0I7c0JBQUMsU0FBQSxFQUFXLFVBQVo7c0JBQXdCLFNBQUEsRUFBVyxJQUFuQztxQkFBcEIsRUFERzttQkFMUDs7Y0FEa0IsQ0FBcEI7WUFGUSxDQUFWLEVBREY7O1FBRG9CO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtJQUhrQjs7eUJBaUJwQixTQUFBLEdBQVcsU0FBQyxVQUFELEVBQWEsVUFBYixFQUF5QixlQUF6QjtBQUVULFVBQUE7TUFBQSxJQUFHLHVCQUFIO1FBQ0ksK0JBQUYsRUFBVSxnQ0FEWjtPQUFBLE1BQUE7UUFHRSxPQUFvQixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsVUFBcEIsQ0FBcEIsRUFBQyxvQkFBRCxFQUFTLHFCQUhYOztNQUtBLElBQVUsTUFBTSxDQUFDLGVBQVAsS0FBNEIsSUFBdEM7QUFBQSxlQUFBOztNQUVBLElBQUcsTUFBTSxDQUFDLDhCQUFWO1FBQ0UsSUFBRyxDQUFJLElBQUMsQ0FBQSxlQUFELENBQWlCLE1BQU0sQ0FBQyxhQUF4QixDQUFQO0FBQ0UsaUJBREY7U0FERjs7TUFJQSxJQUFHLENBQUksWUFBQSxDQUFhLE1BQU0sQ0FBQyxVQUFwQixFQUFnQyxNQUFNLENBQUMsVUFBdkMsQ0FBUDtRQUNFLElBQUcsQ0FBSSxNQUFNLENBQUMsMEJBQWQ7VUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLGlFQUE5QixFQUNFO1lBQUEsV0FBQSxFQUFhLEtBQWI7WUFDQSxNQUFBLEVBQVEsdUNBQUEsR0FBd0MsTUFBTSxDQUFDLFVBQS9DLEdBQTBELDJGQURsRTtXQURGLEVBREY7O0FBTUEsZUFQRjs7TUFTQSxZQUFBLEdBQWUsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsTUFBakI7TUFFZixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsTUFBcEI7TUFHQSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQU0sQ0FBQyxXQUFuQjtNQUdBLElBQUcsSUFBQyxDQUFBLG9CQUFxQixDQUFBLE1BQU0sQ0FBQyxXQUFQLENBQXpCO1FBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxLQUFEO1FBQ1IsU0FBQSxHQUNFO1VBQUEsS0FBQSxFQUFPLEtBQVA7VUFDQSxPQUFBLEVBQVMsV0FEVDtVQUVBLE1BQUEsRUFBUSxNQUZSO1VBR0EsWUFBQSxFQUFjLFlBSGQ7O0FBTUY7VUFDRSxJQUFDLENBQUEsb0JBQXFCLENBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsQ0FBQyxJQUExQyxDQUErQyxTQUEvQyxFQURGO1NBQUEsYUFBQTtVQUVNO1VBQ0osT0FBTyxDQUFDLEdBQVIsQ0FBWSxRQUFBLEdBQVMsR0FBVCxHQUFhLHNDQUFiLEdBQW1ELElBQUMsQ0FBQSxvQkFBcUIsQ0FBQSxNQUFNLENBQUMsV0FBUCxDQUFtQixDQUFDLFlBQVksQ0FBQyxHQUF0SDtVQUNBLE9BQU8sSUFBQyxDQUFBLG9CQUFxQixDQUFBLE1BQU0sQ0FBQyxXQUFQO1VBQzdCLElBQUMsQ0FBQSxVQUFELENBQVksTUFBTSxDQUFDLFdBQW5CO1VBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxvQ0FBQSxHQUFxQyxJQUFDLENBQUEsb0JBQXFCLENBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsQ0FBQyxZQUFZLENBQUMsR0FBeEc7VUFDQSxJQUFDLENBQUEsb0JBQXFCLENBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsQ0FBQyxJQUExQyxDQUErQyxTQUEvQyxFQVBGOztlQVVBLElBQUMsQ0FBQSxvQkFBcUIsQ0FBQSxNQUFNLENBQUMsV0FBUCxDQUFtQixDQUFDLElBQTFDLENBQStDLFlBQUEsR0FBYSxLQUE1RCxFQUFxRSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLE1BQUQ7QUFFbkUsZ0JBQUE7WUFBQSx5Q0FBZ0IsQ0FBRSxnQkFBbEI7QUFBK0IscUJBQS9COztZQUNBLElBQUcsTUFBTSxDQUFDLEdBQVY7Y0FDRSxJQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBZDt1QkFDRSxLQUFDLENBQUEsMkJBQTRCLENBQUEsTUFBTSxDQUFDLFVBQVAsQ0FBN0IsR0FDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQW5CLENBQTRCLDRCQUE1QixFQUNFO2tCQUFBLFdBQUEsRUFBYSxJQUFiO2tCQUNBLE1BQUEsRUFBVyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQVosR0FBb0IsT0FBcEIsR0FBMkIsTUFBTSxDQUFDLGFBQWxDLEdBQWdELE9BQWhELEdBQXVELE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FENUU7aUJBREYsRUFGSjtlQUFBLE1BQUE7Z0JBTUUsS0FBQyxDQUFBLDJCQUE0QixDQUFBLE1BQU0sQ0FBQyxVQUFQLENBQTdCLEdBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixhQUFBLEdBQWMsTUFBTSxDQUFDLFlBQXJCLEdBQWtDLG1CQUE5RCxFQUNFO2tCQUFBLFdBQUEsRUFBYSxJQUFiO2tCQUNBLE1BQUEsRUFBVyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQVosR0FBb0IsT0FBcEIsR0FBMkIsTUFBTSxDQUFDLGFBQWxDLEdBQWdELE9BQWhELEdBQXVELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FENUU7aUJBREY7Z0JBSUYsSUFBRyxnRUFBQSwwQkFBMEIsVUFBVSxDQUFFLGVBQXpDO3lCQUNFLFVBQVUsQ0FBQyx1QkFBWCxDQUFtQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQWYsR0FBb0IsQ0FBckIsRUFBd0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBdkMsQ0FBbkMsRUFERjtpQkFYRjtlQURGO2FBQUEsTUFBQTtjQWVFLElBQUcsQ0FBSSxNQUFNLENBQUMsK0JBQWQ7Z0JBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFuQixDQUEyQixhQUFBLEdBQWMsTUFBTSxDQUFDLFlBQXJCLEdBQWtDLHFCQUE3RCxFQUNFO2tCQUFBLE1BQUEsRUFBVyxNQUFNLENBQUMsVUFBUixHQUFtQixPQUFuQixHQUEwQixNQUFNLENBQUMsYUFBM0M7aUJBREYsRUFERjs7Y0FJQSxJQUFHLENBQUksTUFBTSxDQUFDLG9CQUFkO2dCQUNFLElBQUcsQ0FBSSxNQUFNLENBQUMsK0JBQWQ7a0JBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFuQixDQUEyQixxQ0FBM0IsRUFERjs7QUFFQSx1QkFIRjs7Y0FJQSxJQUFHLE1BQU0sQ0FBQyxVQUFQLEtBQXFCLE1BQU0sQ0FBQyxjQUEvQjtnQkFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLDJEQUE5QixFQUNFO2tCQUFBLFdBQUEsRUFBYSxJQUFiO2tCQUNBLE1BQUEsRUFBUSxNQUFNLENBQUMsVUFEZjtpQkFERjtBQUdBLHVCQUpGOztjQU9BLElBQUcsTUFBTSxDQUFDLHVCQUFWO2dCQUNFLEVBQUUsQ0FBQyxZQUFILENBQWlCLElBQUksQ0FBQyxLQUFMLENBQVksTUFBTSxDQUFDLGNBQW5CLENBQWtDLENBQUMsR0FBcEQsRUFERjs7Y0FJQSxJQUFHLE1BQU0sQ0FBQyxlQUFWO2dCQUNFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBZCxHQUFxQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQWQsR0FBcUIsSUFBckIsR0FBNEIsdUJBQTVCLEdBQW9ELE1BQU0sQ0FBQyxRQURsRjs7Y0FHQSxFQUFFLENBQUMsYUFBSCxDQUFpQixNQUFNLENBQUMsY0FBeEIsRUFBd0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUF0RDtjQUdBLElBQUcsTUFBTSxDQUFDLFNBQVAsOENBQXNDLENBQUUsaUJBQTNDO2dCQUNFLElBQUcsTUFBTSxDQUFDLHVCQUFWO2tCQUNFLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQUksQ0FBQyxLQUFMLENBQVcsTUFBTSxDQUFDLE9BQWxCLENBQTBCLENBQUMsR0FBM0MsRUFERjs7Z0JBRUEsT0FBQSxHQUNFO2tCQUFBLE9BQUEsRUFBUyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUEzQjtrQkFDQSxPQUFBLEVBQVUsTUFBTSxDQUFDLFVBRGpCO2tCQUVBLElBQUEsRUFBTSxNQUFNLENBQUMsY0FGYjtrQkFHQSxVQUFBLEVBQVksRUFIWjtrQkFJQSxLQUFBLEVBQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FKekI7a0JBS0EsUUFBQSxFQUFVLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBTDVCOztnQkFNRixjQUFBLEdBQWlCO3VCQUNqQixFQUFFLENBQUMsYUFBSCxDQUFpQixNQUFNLENBQUMsT0FBeEIsRUFDRSxjQUFBLEdBQWlCLElBQUksQ0FBQyxTQUFMLENBQWUsT0FBZixFQUF3QixJQUF4QixFQUE4QixHQUE5QixDQURuQixFQVhGO2VBeENGOztVQUhtRTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckUsRUFuQkY7O0lBOUJTOzt5QkEyR1gsa0JBQUEsR0FBb0IsU0FBQyxNQUFEO0FBRWxCLFVBQUE7TUFBQSxJQUFHLDJEQUFIO1FBQ0UsSUFBQyxDQUFBLDJCQUE0QixDQUFBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLENBQUMsT0FBaEQsQ0FBQTtRQUNBLE9BQU8sSUFBQyxDQUFBLDJCQUE0QixDQUFBLE1BQU0sQ0FBQyxVQUFQLEVBRnRDOztBQUlBO0FBQUEsV0FBQSxVQUFBOztRQUNFLElBQUcsQ0FBQyxDQUFDLFNBQUw7VUFDRSxPQUFPLElBQUMsQ0FBQSwyQkFBNEIsQ0FBQSxFQUFBLEVBRHRDOztBQURGO01BT0EsQ0FBQSxHQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLE1BQWpDLEdBQTBDO0FBQzlDO2FBQU0sQ0FBQSxJQUFLLENBQVg7UUFDRSxJQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYyxDQUFBLENBQUEsQ0FBRSxDQUFDLFNBQXBDLElBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFjLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBTyxDQUFDLFNBQTVDLENBQXNELENBQXRELEVBQXdELENBQXhELENBQUEsS0FBOEQsS0FEOUQ7VUFFRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxNQUFqQyxDQUF3QyxDQUF4QyxFQUEyQyxDQUEzQyxFQUZGOztxQkFHQSxDQUFBO01BSkYsQ0FBQTs7SUFka0I7O3lCQXFCcEIsVUFBQSxHQUFZLFNBQUMsV0FBRDtBQUNWLFVBQUE7MkVBQXNCLENBQUEsV0FBQSxRQUFBLENBQUEsV0FBQSxJQUNwQixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxvQkFBWCxFQUFpQyxXQUFqQyxFQUE4QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBRTVDLE9BQU8sS0FBQyxDQUFBLG9CQUFxQixDQUFBLFdBQUE7UUFGZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUM7SUFGUTs7eUJBT1osZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBRyx3RUFBSDtRQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixnREFBaEIsRUFDRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0NBQWhCLENBREYsRUFERjs7TUFHQSxJQUFHLG1FQUFIO1FBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDJDQUFoQixFQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQ0FBaEIsQ0FERixFQURGOztNQUdBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQiwrQ0FBbEI7TUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0IsMENBQWxCO01BQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFaLENBQWtCLG1DQUFsQjtNQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQix1Q0FBbEI7TUFFQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0IsMkJBQWxCO01BQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFaLENBQWtCLGdDQUFsQjtNQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQiw2QkFBbEI7TUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0Isc0NBQWxCO01BQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFaLENBQWtCLHNDQUFsQjtNQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQixrQ0FBbEI7TUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0IscUNBQWxCO01BQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFaLENBQWtCLHdCQUFsQjtNQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQix3QkFBbEI7YUFFQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0IsMEJBQWxCO0lBdEJlOzt5QkEwQmpCLGVBQUEsR0FBaUIsU0FBQyxNQUFEO0FBRWYsVUFBQTtNQUFBLFlBQUEsR0FDRTtRQUFBLElBQUEsRUFBTSxJQUFOOztNQUNGLElBQUcsTUFBTSxDQUFDLFNBQVY7UUFBMEIsWUFBWSxDQUFDLFVBQWIsR0FBMEIsTUFBTSxDQUFDLFVBQTNEOzthQUNBO0lBTGU7O3lCQVFqQixrQkFBQSxHQUFvQixTQUFDLFVBQUQ7QUFDbEIsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsU0FBRCxDQUFBO01BQ1QsTUFBQSxHQUFTLElBQUMsQ0FBQSxRQUFELENBQVUsVUFBVixFQUFzQixNQUF0QjtNQUVULElBQUcsTUFBTSxDQUFDLGtCQUFWO1FBQ0UsSUFBTyx1QkFBUDtVQUNFLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxPQUFBLENBQVEscUJBQVIsQ0FBRCxDQUFBLENBQUE7VUFDZCxJQUFDLENBQUEsVUFBVSxDQUFDLFNBQVosQ0FBc0IsYUFBdEIsRUFBcUMsbUJBQXJDLEVBRkY7O1FBR0EsV0FBQSxHQUFjLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQU0sQ0FBQyxhQUF2QixFQUFzQyxNQUFNLENBQUMsV0FBN0MsRUFBMEQsRUFBMUQ7UUFFZCxJQUFDLENBQUEsS0FBRCxDQUFPLE1BQVAsRUFBZSxXQUFmO1FBRUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxRQUFELENBQVUsVUFBVixFQUFzQixNQUF0QixFQVJYOztBQVNBLGFBQU87UUFBRSxRQUFBLE1BQUY7UUFBVSxRQUFBLE1BQVY7O0lBYlc7O3lCQWdCcEIsU0FBQSxHQUFXLFNBQUE7YUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsZ0JBQWhCO0lBQUg7O3lCQU1YLGNBQUEsR0FBZ0IsU0FBQyxPQUFELEVBQVUsS0FBVixFQUFpQixXQUFqQjtBQUVkLFVBQUE7TUFBQSxlQUFBLEdBQWtCO01BQ2xCLG9CQUFBLEdBQXVCLElBQUksQ0FBQyxJQUFMLENBQVUsT0FBVixFQUFtQixlQUFuQjtNQUN2QixJQUFHLEVBQUUsQ0FBQyxVQUFILENBQWMsb0JBQWQsQ0FBSDtRQUNFLFdBQUEsR0FBYSxFQUFFLENBQUMsWUFBSCxDQUFnQixvQkFBaEIsRUFBc0MsTUFBdEM7QUFDYjtVQUNFLFdBQUEsR0FBYyxJQUFJLENBQUMsS0FBTCxDQUFXLFdBQVgsRUFEaEI7U0FBQSxhQUFBO1VBRU07VUFDSixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQW5CLENBQTRCLE1BQUEsR0FBTyxlQUFQLEdBQXVCLEdBQXZCLEdBQTBCLEdBQUcsQ0FBQyxPQUExRCxFQUNFO1lBQUEsV0FBQSxFQUFhLElBQWI7WUFDQSxNQUFBLEVBQVEsU0FBQSxHQUFVLG9CQUFWLEdBQStCLE1BQS9CLEdBQXFDLFdBRDdDO1dBREY7QUFHQSxpQkFORjs7UUFRQSxZQUFBLEdBQWUsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLGFBQXJCLEVBQW9DLFdBQXBDO1FBQ2YsSUFBRyxZQUFIO1VBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixNQUFBLEdBQU8sZUFBUCxHQUF1QixzQkFBbkQsRUFDRTtZQUFBLFdBQUEsRUFBYSxJQUFiO1lBQ0EsTUFBQSxFQUFRLFNBQUEsR0FBVSxvQkFBVixHQUErQixNQUEvQixHQUFxQyxXQUQ3QztXQURGLEVBREY7U0FBQSxNQUFBO1VBT0UsYUFBQSxHQUFnQixXQUFXLENBQUM7VUFDNUIsSUFBQyxDQUFBLEtBQUQsQ0FBUSxXQUFSLEVBQXFCLFdBQXJCO1VBQ0EsSUFBRyxhQUFIO1lBQXNCLFdBQVcsQ0FBQyxjQUFaLEdBQTZCLFFBQW5EOztVQUNBLFdBQUEsR0FBYyxZQVZoQjtTQVhGOztNQXNCQSxJQUFHLE9BQUEsS0FBYSxLQUFoQjtRQUVFLElBQUcsT0FBQSxLQUFXLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixDQUFkO0FBQXlDLGlCQUFPLFlBQWhEOztRQUVBLElBQUcsYUFBSDtBQUFzQixpQkFBTyxZQUE3Qjs7QUFDQSxlQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixDQUFoQixFQUF1QyxLQUF2QyxFQUE4QyxXQUE5QyxFQUxUO09BQUEsTUFBQTtBQU1LLGVBQU8sWUFOWjs7SUExQmM7O3lCQXFDaEIsUUFBQSxHQUFXLFNBQUMsVUFBRCxFQUFhLE1BQWI7QUFDVCxVQUFBO01BQUEsdUJBQUEsR0FBMEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLFVBQTVCO01BRTFCLElBQUcsdUJBQXdCLENBQUEsQ0FBQSxDQUF4QixLQUE4QixJQUFqQztRQUNFLG1CQUFBLEdBQXNCLE1BRHhCO09BQUEsTUFBQTtRQUVLLG1CQUFBLEdBQXNCLEtBRjNCOztNQU9BLElBQUcsNkJBQUg7UUFDRSxjQUFBLEdBQWlCLElBQUksQ0FBQyxTQUFMLENBQWUsTUFBTSxDQUFDLGNBQXRCLEVBRG5CO09BQUEsTUFFSyxJQUFHLHVCQUF3QixDQUFBLENBQUEsQ0FBeEIsS0FBOEIsSUFBakM7UUFDSCxjQUFBLEdBQWlCLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBWCxDQUFzQixDQUFDLEtBRHJDO09BQUEsTUFBQTtRQUtILGNBQUEsR0FBaUIsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFJLENBQUMsSUFBTCxDQUFVLHVCQUF3QixDQUFBLENBQUEsQ0FBbEMsRUFBcUMsR0FBckMsQ0FBZixFQUxkOztNQU1MLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLFNBQUwsQ0FBZSxNQUFNLENBQUMsZUFBdEI7TUFDaEIsZ0JBQUEsR0FBbUIsSUFBSSxDQUFDLFNBQUwsQ0FBZSxNQUFNLENBQUMsa0JBQXRCO01BQ25CLFdBQUEsR0FBYyxJQUFJLENBQUMsU0FBTCxDQUFlLE1BQU0sQ0FBQyxhQUF0QjtNQUVkLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxjQUFWLEVBQTJCLGFBQTNCO01BQ2hCLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxJQUFMLENBQVUsY0FBVixFQUEyQixnQkFBM0I7TUFDbkIsV0FBQSxHQUFjLElBQUksQ0FBQyxJQUFMLENBQVUsY0FBVixFQUEyQixXQUEzQjtNQUVkLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBWDtNQUNuQix5QkFBQSxHQUE0QixJQUFJLENBQUMsUUFBTCxDQUFjLGFBQWQsRUFBNkIsZ0JBQWdCLENBQUMsR0FBOUM7TUFHNUIsSUFBRyxNQUFNLENBQUMsaUJBQVY7UUFDRSxLQUFBLEdBQVEsZ0JBQWdCLENBQUMsSUFEM0I7T0FBQSxNQUFBO1FBR0UsS0FBQSxHQUFTLE1BSFg7O01BSUEsaUJBQUEsR0FBb0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBVixFQUE0Qix5QkFBNUIsRUFBd0QsZ0JBQWdCLENBQUMsSUFBakIsR0FBeUIsS0FBakY7TUFDcEIsVUFBQSxHQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1Qix5QkFBdkIsRUFBbUQsZ0JBQWdCLENBQUMsSUFBakIsR0FBeUIsS0FBekIsR0FBaUMsTUFBcEY7YUFFYjtRQUFBLG1CQUFBLEVBQXFCLG1CQUFyQjtRQUNBLFVBQUEsRUFBWSxVQURaO1FBRUEsYUFBQSxFQUFlLGdCQUFnQixDQUFDLEdBRmhDO1FBR0EsT0FBQSxFQUFTLFVBSFQ7UUFJQSxjQUFBLEVBQWdCLGlCQUpoQjtRQUtBLFVBQUEsRUFBWSxhQUxaO1FBTUEsV0FBQSxFQUFhLGNBTmI7O0lBckNTOzt5QkE4Q1gsZUFBQSxHQUFpQixTQUFDLE9BQUQ7QUFFZixVQUFBO01BQUEsT0FBQSxHQUFVO01BQ1YsV0FBQSxHQUFjLElBQUksQ0FBQyxJQUFMLENBQVUsT0FBVixFQUFtQixPQUFuQjtNQUNkLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxXQUFkLENBQUg7QUFDRSxlQUFPLEtBRFQ7O01BRUEsSUFBRyxPQUFBLEtBQVcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFiLENBQWQ7QUFDRSxlQUFPLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixDQUFqQixFQURUO09BQUEsTUFBQTtBQUVLLGVBQU8sTUFGWjs7SUFOZTs7eUJBV2pCLEtBQUEsR0FBTyxTQUFDLFNBQUQsRUFBWSxTQUFaO0FBQ0wsVUFBQTtBQUFBO1dBQUEsaUJBQUE7O3FCQUNFLFNBQVUsQ0FBQSxJQUFBLENBQVYsR0FBa0I7QUFEcEI7O0lBREs7O3lCQUtQLGtCQUFBLEdBQW9CLFNBQUMsV0FBRDtBQUNsQixVQUFBO01BQUEsU0FBQSxHQUNFO1FBQUEsT0FBQSxFQUFTLE1BQVQ7O2FBQ0YsSUFBQyxDQUFBLG9CQUFxQixDQUFBLFdBQUEsQ0FBWSxDQUFDLElBQW5DLENBQXdDLFNBQXhDO0lBSGtCOzt5QkFNcEIscUJBQUEsR0FBdUIsU0FBQTtBQUNyQixVQUFBO0FBQUE7QUFBQTtXQUFBLG1CQUFBOztxQkFDRSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsV0FBcEI7QUFERjs7SUFEcUI7O3lCQU12QixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsZ0JBQUEsR0FBbUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUE7QUFDbkI7QUFBQTtXQUFBLHVCQUFBOztRQUNFLHNCQUFBLEdBQXlCO0FBQ3pCLGFBQUEsa0RBQUE7O1VBQ0UsSUFBRyxZQUFBLENBQWEsZUFBYixFQUE4QixlQUE5QixDQUFIO1lBQ0Usc0JBQUEsR0FBeUI7QUFDekIsa0JBRkY7O0FBREY7UUFJQSxJQUFHLENBQUksc0JBQVA7dUJBQW1DLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixlQUFwQixHQUFuQztTQUFBLE1BQUE7K0JBQUE7O0FBTkY7O0lBRmU7Ozs7OztFQVVuQixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTdhakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGFzaywgQ29tcG9zaXRlRGlzcG9zYWJsZSB9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xucGF0aElzSW5zaWRlID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3BhdGgtaXMtaW5zaWRlJ1xuXG4jIHNldHVwIEpTT04gU2NoZW1hIHRvIHBhcnNlIC5sYW5ndWFnZWJhYmVsIGNvbmZpZ3Ncbmxhbmd1YWdlYmFiZWxTY2hlbWEgPSB7XG4gIHR5cGU6ICdvYmplY3QnLFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgYmFiZWxNYXBzUGF0aDogICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBiYWJlbE1hcHNBZGRVcmw6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBiYWJlbFNvdXJjZVBhdGg6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGJhYmVsVHJhbnNwaWxlUGF0aDogICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgY3JlYXRlTWFwOiAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXM6ICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgY3JlYXRlVHJhbnNwaWxlZENvZGU6ICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgZGlzYWJsZVdoZW5Ob0JhYmVscmNGaWxlSW5QYXRoOiAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAga2VlcEZpbGVFeHRlbnNpb246ICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgcHJvamVjdFJvb3Q6ICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXM6ICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlczogIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgdHJhbnNwaWxlT25TYXZlOiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH1cbiAgfSxcbiAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlXG59XG5cbmNsYXNzIFRyYW5zcGlsZXJcblxuICBmcm9tR3JhbW1hck5hbWU6ICdCYWJlbCBFUzYgSmF2YVNjcmlwdCdcbiAgZnJvbVNjb3BlTmFtZTogJ3NvdXJjZS5qcy5qc3gnXG4gIHRvU2NvcGVOYW1lOiAnc291cmNlLmpzLmpzeCdcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVxSWQgPSAwXG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzID0ge31cbiAgICBAYmFiZWxUcmFuc2Zvcm1lclBhdGggPSByZXF1aXJlLnJlc29sdmUgJy4vdHJhbnNwaWxlci10YXNrJ1xuICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnMgPSB7fVxuICAgIEBkZXByZWNhdGVDb25maWcoKVxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBpZiBAZ2V0Q29uZmlnKCkudHJhbnNwaWxlT25TYXZlIG9yIEBnZXRDb25maWcoKS5hbGxvd0xvY2FsT3ZlcnJpZGVcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb250ZXh0TWVudS5hZGQge1xuICAgICAgICAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJzogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ0xhbmd1YWdlLUJhYmVsJ1xuICAgICAgICAgICAgICBzdWJtZW51OiBbXG4gICAgICAgICAgICAgICAge2xhYmVsOiAnVHJhbnNwaWxlIERpcmVjdG9yeSAnLCBjb21tYW5kOiAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yeSd9XG4gICAgICAgICAgICAgICAge2xhYmVsOiAnVHJhbnNwaWxlIERpcmVjdG9yaWVzJywgY29tbWFuZDogJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3Rvcmllcyd9XG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHsndHlwZSc6ICdzZXBhcmF0b3InIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmRpcmVjdG9yeSA+IC5oZWFkZXIgPiAubmFtZScsICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3J5JywgQGNvbW1hbmRUcmFuc3BpbGVEaXJlY3RvcnlcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmRpcmVjdG9yeSA+IC5oZWFkZXIgPiAubmFtZScsICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3JpZXMnLCBAY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yaWVzXG5cbiAgIyBtZXRob2QgdXNlZCBieSBzb3VyY2UtcHJldmlldyB0byBzZWUgdHJhbnNwaWxlZCBjb2RlXG4gIHRyYW5zZm9ybTogKGNvZGUsIHtmaWxlUGF0aCwgc291cmNlTWFwfSkgLT5cbiAgICBjb25maWcgPSBAZ2V0Q29uZmlnKClcbiAgICBwYXRoVG8gPSBAZ2V0UGF0aHMgZmlsZVBhdGgsIGNvbmZpZ1xuICAgICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuICAgIGJhYmVsT3B0aW9ucyA9XG4gICAgICBmaWxlbmFtZTogZmlsZVBhdGhcbiAgICAgIGFzdDogZmFsc2VcbiAgICBpZiBzb3VyY2VNYXAgdGhlbiBiYWJlbE9wdGlvbnMuc291cmNlTWFwcyA9IHNvdXJjZU1hcFxuICAgICMgb2sgbm93IHRyYW5zcGlsZSBpbiB0aGUgdGFzayBhbmQgd2FpdCBvbiB0aGUgcmVzdWx0XG4gICAgaWYgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgIHJlcUlkID0gQHJlcUlkKytcbiAgICAgIG1zZ09iamVjdCA9XG4gICAgICAgIHJlcUlkOiByZXFJZFxuICAgICAgICBjb21tYW5kOiAndHJhbnNwaWxlQ29kZSdcbiAgICAgICAgcGF0aFRvOiBwYXRoVG9cbiAgICAgICAgY29kZTogY29kZVxuICAgICAgICBiYWJlbE9wdGlvbnM6IGJhYmVsT3B0aW9uc1xuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCApID0+XG4gICAgICAjIHRyYW5zcGlsZSBpbiB0YXNrXG4gICAgICB0cnlcbiAgICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgZGVsZXRlIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICAgIHJlamVjdChcIkVycm9yICN7ZXJyfSBzZW5kaW5nIHRvIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIilcbiAgICAgICMgZ2V0IHJlc3VsdCBmcm9tIHRhc2sgZm9yIHRoaXMgcmVxSWRcbiAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLm9uY2UgXCJ0cmFuc3BpbGU6I3tyZXFJZH1cIiwgKG1zZ1JldCkgPT5cbiAgICAgICAgaWYgbXNnUmV0LmVycj9cbiAgICAgICAgICByZWplY3QoXCJCYWJlbCB2I3ttc2dSZXQuYmFiZWxWZXJzaW9ufVxcbiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBtc2dSZXQuc291cmNlTWFwID0gbXNnUmV0Lm1hcFxuICAgICAgICAgIHJlc29sdmUobXNnUmV0KVxuXG4gICMgY2FsbGVkIGJ5IGNvbW1hbmRcbiAgY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yeTogKHt0YXJnZXR9KSA9PlxuICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogdGFyZ2V0LmRhdGFzZXQucGF0aCB9XG5cbiAgIyBjYWxsZWQgYnkgY29tbWFuZFxuICBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3JpZXM6ICh7dGFyZ2V0fSkgPT5cbiAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IHRhcmdldC5kYXRhc2V0LnBhdGgsIHJlY3Vyc2l2ZTogdHJ1ZX1cblxuICAjIHRyYW5zcGlsZSBhbGwgZmlsZXMgaW4gYSBkaXJlY3Rvcnkgb3IgcmVjdXJzaXZlIGRpcmVjdG9yaWVzXG4gICMgb3B0aW9ucyBhcmUgeyBkaXJlY3Rvcnk6IG5hbWUsIHJlY3Vyc2l2ZTogdHJ1ZXxmYWxzZX1cbiAgdHJhbnNwaWxlRGlyZWN0b3J5OiAob3B0aW9ucykgLT5cbiAgICBkaXJlY3RvcnkgPSBvcHRpb25zLmRpcmVjdG9yeVxuICAgIHJlY3Vyc2l2ZSA9IG9wdGlvbnMucmVjdXJzaXZlIG9yIGZhbHNlXG4gICAgZnMucmVhZGRpciBkaXJlY3RvcnksIChlcnIsZmlsZXMpID0+XG4gICAgICBpZiBub3QgZXJyP1xuICAgICAgICBmaWxlcy5tYXAgKGZpbGUpID0+XG4gICAgICAgICAgZnFGaWxlTmFtZSA9IHBhdGguam9pbihkaXJlY3RvcnksIGZpbGUpXG4gICAgICAgICAgZnMuc3RhdCBmcUZpbGVOYW1lLCAoZXJyLCBzdGF0cykgPT5cbiAgICAgICAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgICAgICAgIGlmIHN0YXRzLmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIC9cXC5taW5cXC5bYS16XSskLy50ZXN0IGZxRmlsZU5hbWUgIyBubyBtaW5pbWl6ZWQgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiAvXFwuKGpzfGpzeHxlc3xlczZ8YmFiZWx8bWpzKSQvLnRlc3QgZnFGaWxlTmFtZSAjIG9ubHkganNcbiAgICAgICAgICAgICAgICAgIEB0cmFuc3BpbGUgZmlsZSwgbnVsbCwgQGdldENvbmZpZ0FuZFBhdGhUbyBmcUZpbGVOYW1lXG4gICAgICAgICAgICAgIGVsc2UgaWYgcmVjdXJzaXZlIGFuZCBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICAgICAgQHRyYW5zcGlsZURpcmVjdG9yeSB7ZGlyZWN0b3J5OiBmcUZpbGVOYW1lLCByZWN1cnNpdmU6IHRydWV9XG5cbiAgIyB0cmFuc3BpbGUgc291cmNlRmlsZSBlZGl0ZWQgYnkgdGhlIG9wdGlvbmFsIHRleHRFZGl0b3JcbiAgdHJhbnNwaWxlOiAoc291cmNlRmlsZSwgdGV4dEVkaXRvciwgY29uZmlnQW5kUGF0aFRvKSAtPlxuICAgICMgZ2V0IGNvbmZpZ1xuICAgIGlmIGNvbmZpZ0FuZFBhdGhUbz9cbiAgICAgIHsgY29uZmlnLCBwYXRoVG8gfSA9IGNvbmZpZ0FuZFBhdGhUb1xuICAgIGVsc2VcbiAgICAgIHtjb25maWcsIHBhdGhUbyB9ID0gQGdldENvbmZpZ0FuZFBhdGhUbyhzb3VyY2VGaWxlKVxuXG4gICAgcmV0dXJuIGlmIGNvbmZpZy50cmFuc3BpbGVPblNhdmUgaXNudCB0cnVlXG5cbiAgICBpZiBjb25maWcuZGlzYWJsZVdoZW5Ob0JhYmVscmNGaWxlSW5QYXRoXG4gICAgICBpZiBub3QgQGlzQmFiZWxyY0luUGF0aCBwYXRoVG8uc291cmNlRmlsZURpclxuICAgICAgICByZXR1cm5cblxuICAgIGlmIG5vdCBwYXRoSXNJbnNpZGUocGF0aFRvLnNvdXJjZUZpbGUsIHBhdGhUby5zb3VyY2VSb290KVxuICAgICAgaWYgbm90IGNvbmZpZy5zdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlc1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyAnTEI6IEJhYmVsIGZpbGUgaXMgbm90IGluc2lkZSB0aGUgXCJCYWJlbCBTb3VyY2UgUGF0aFwiIGRpcmVjdG9yeS4nLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiBmYWxzZVxuICAgICAgICAgIGRldGFpbDogXCJObyB0cmFuc3BpbGVkIGNvZGUgb3V0cHV0IGZvciBmaWxlIFxcbiN7cGF0aFRvLnNvdXJjZUZpbGV9XG4gICAgICAgICAgICBcXG5cXG5UbyBzdXBwcmVzcyB0aGVzZSAnaW52YWxpZCBzb3VyY2UgcGF0aCdcbiAgICAgICAgICAgIG1lc3NhZ2VzIHVzZSBsYW5ndWFnZS1iYWJlbCBwYWNrYWdlIHNldHRpbmdzXCJcbiAgICAgIHJldHVyblxuXG4gICAgYmFiZWxPcHRpb25zID0gQGdldEJhYmVsT3B0aW9ucyBjb25maWdcblxuICAgIEBjbGVhbk5vdGlmaWNhdGlvbnMocGF0aFRvKVxuXG4gICAgIyBjcmVhdGUgYmFiZWwgdHJhbnNmb3JtZXIgdGFza3MgLSBvbmUgcGVyIHByb2plY3QgYXMgbmVlZGVkXG4gICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG5cbiAgICAjIG9rIG5vdyB0cmFuc3BpbGUgaW4gdGhlIHRhc2sgYW5kIHdhaXQgb24gdGhlIHJlc3VsdFxuICAgIGlmIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICByZXFJZCA9IEByZXFJZCsrXG4gICAgICBtc2dPYmplY3QgPVxuICAgICAgICByZXFJZDogcmVxSWRcbiAgICAgICAgY29tbWFuZDogJ3RyYW5zcGlsZSdcbiAgICAgICAgcGF0aFRvOiBwYXRoVG9cbiAgICAgICAgYmFiZWxPcHRpb25zOiBiYWJlbE9wdGlvbnNcblxuICAgICAgIyB0cmFuc3BpbGUgaW4gdGFza1xuICAgICAgdHJ5XG4gICAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLnNlbmQobXNnT2JqZWN0KVxuICAgICAgY2F0Y2ggZXJyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiRXJyb3IgI3tlcnJ9IHNlbmRpbmcgdG8gdHJhbnNwaWxlIHRhc2sgd2l0aCBQSUQgI3tAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5jaGlsZFByb2Nlc3MucGlkfVwiXG4gICAgICAgIGRlbGV0ZSBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgICBAY3JlYXRlVGFzayBwYXRoVG8ucHJvamVjdFBhdGhcbiAgICAgICAgY29uc29sZS5sb2cgXCJSZXN0YXJ0ZWQgdHJhbnNwaWxlIHRhc2sgd2l0aCBQSUQgI3tAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5jaGlsZFByb2Nlc3MucGlkfVwiXG4gICAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLnNlbmQobXNnT2JqZWN0KVxuXG4gICAgICAjIGdldCByZXN1bHQgZnJvbSB0YXNrIGZvciB0aGlzIHJlcUlkXG4gICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5vbmNlIFwidHJhbnNwaWxlOiN7cmVxSWR9XCIsIChtc2dSZXQpID0+XG4gICAgICAgICMgLmlnbm9yZWQgaXMgcmV0dXJuZWQgd2hlbiAuYmFiZWxyYyBpZ25vcmUvb25seSBmbGFncyBhcmUgdXNlZFxuICAgICAgICBpZiBtc2dSZXQucmVzdWx0Py5pZ25vcmVkIHRoZW4gcmV0dXJuXG4gICAgICAgIGlmIG1zZ1JldC5lcnJcbiAgICAgICAgICBpZiBtc2dSZXQuZXJyLnN0YWNrXG4gICAgICAgICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXSA9XG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkxCOiBCYWJlbCBUcmFuc3BpbGVyIEVycm9yXCIsXG4gICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuIFxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XFxuIFxcbiN7bXNnUmV0LmVyci5zdGFja31cIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdID1cbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259IFRyYW5zcGlsZXIgRXJyb3JcIixcbiAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIGRldGFpbDogXCIje21zZ1JldC5lcnIubWVzc2FnZX1cXG4gXFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cXG4gXFxuI3ttc2dSZXQuZXJyLmNvZGVGcmFtZX1cIlxuICAgICAgICAgICAgIyBpZiB3ZSBoYXZlIGEgbGluZS9jb2wgc3ludGF4IGVycm9yIGp1bXAgdG8gdGhlIHBvc2l0aW9uXG4gICAgICAgICAgICBpZiBtc2dSZXQuZXJyLmxvYz8ubGluZT8gYW5kIHRleHRFZGl0b3I/LmFsaXZlXG4gICAgICAgICAgICAgIHRleHRFZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24gW21zZ1JldC5lcnIubG9jLmxpbmUtMSwgbXNnUmV0LmVyci5sb2MuY29sdW1uXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgbm90IGNvbmZpZy5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIkxCOiBCYWJlbCB2I3ttc2dSZXQuYmFiZWxWZXJzaW9ufSBUcmFuc3BpbGVyIFN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7cGF0aFRvLnNvdXJjZUZpbGV9XFxuIFxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XCJcblxuICAgICAgICAgIGlmIG5vdCBjb25maWcuY3JlYXRlVHJhbnNwaWxlZENvZGVcbiAgICAgICAgICAgIGlmIG5vdCBjb25maWcuc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlc1xuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyAnTEI6IE5vIHRyYW5zcGlsZWQgb3V0cHV0IGNvbmZpZ3VyZWQnXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBpZiBwYXRoVG8uc291cmNlRmlsZSBpcyBwYXRoVG8udHJhbnNwaWxlZEZpbGVcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nICdMQjogVHJhbnNwaWxlZCBmaWxlIHdvdWxkIG92ZXJ3cml0ZSBzb3VyY2UgZmlsZS4gQWJvcnRlZCEnLFxuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICBkZXRhaWw6IHBhdGhUby5zb3VyY2VGaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICMgd3JpdGUgY29kZSBhbmQgbWFwc1xuICAgICAgICAgIGlmIGNvbmZpZy5jcmVhdGVUYXJnZXREaXJlY3Rvcmllc1xuICAgICAgICAgICAgZnMubWFrZVRyZWVTeW5jKCBwYXRoLnBhcnNlKCBwYXRoVG8udHJhbnNwaWxlZEZpbGUpLmRpcilcblxuICAgICAgICAgICMgYWRkIHNvdXJjZSBtYXAgdXJsIHRvIGNvZGUgaWYgZmlsZSBpc24ndCBpZ25vcmVkXG4gICAgICAgICAgaWYgY29uZmlnLmJhYmVsTWFwc0FkZFVybFxuICAgICAgICAgICAgbXNnUmV0LnJlc3VsdC5jb2RlID0gbXNnUmV0LnJlc3VsdC5jb2RlICsgJ1xcbicgKyAnLy8jIHNvdXJjZU1hcHBpbmdVUkw9JytwYXRoVG8ubWFwRmlsZVxuXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoVG8udHJhbnNwaWxlZEZpbGUsIG1zZ1JldC5yZXN1bHQuY29kZVxuXG4gICAgICAgICAgIyB3cml0ZSBzb3VyY2UgbWFwIGlmIHJldHVybmVkIGFuZCBpZiBhc2tlZFxuICAgICAgICAgIGlmIGNvbmZpZy5jcmVhdGVNYXAgYW5kIG1zZ1JldC5yZXN1bHQubWFwPy52ZXJzaW9uXG4gICAgICAgICAgICBpZiBjb25maWcuY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXNcbiAgICAgICAgICAgICAgZnMubWFrZVRyZWVTeW5jKHBhdGgucGFyc2UocGF0aFRvLm1hcEZpbGUpLmRpcilcbiAgICAgICAgICAgIG1hcEpzb24gPVxuICAgICAgICAgICAgICB2ZXJzaW9uOiBtc2dSZXQucmVzdWx0Lm1hcC52ZXJzaW9uXG4gICAgICAgICAgICAgIHNvdXJjZXM6ICBwYXRoVG8uc291cmNlRmlsZVxuICAgICAgICAgICAgICBmaWxlOiBwYXRoVG8udHJhbnNwaWxlZEZpbGVcbiAgICAgICAgICAgICAgc291cmNlUm9vdDogJydcbiAgICAgICAgICAgICAgbmFtZXM6IG1zZ1JldC5yZXN1bHQubWFwLm5hbWVzXG4gICAgICAgICAgICAgIG1hcHBpbmdzOiBtc2dSZXQucmVzdWx0Lm1hcC5tYXBwaW5nc1xuICAgICAgICAgICAgeHNzaVByb3RlY3Rpb24gPSAnKV19XFxuJ1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoVG8ubWFwRmlsZSxcbiAgICAgICAgICAgICAgeHNzaVByb3RlY3Rpb24gKyBKU09OLnN0cmluZ2lmeSBtYXBKc29uLCBudWxsLCAnICdcblxuICAjIGNsZWFuIG5vdGlmaWNhdGlvbiBtZXNzYWdlc1xuICBjbGVhbk5vdGlmaWNhdGlvbnM6IChwYXRoVG8pIC0+XG4gICAgIyBhdXRvIGRpc21pc3MgcHJldmlvdXMgdHJhbnNwaWxlIGVycm9yIG5vdGlmaWNhdGlvbnMgZm9yIHRoaXMgc291cmNlIGZpbGVcbiAgICBpZiBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXT9cbiAgICAgIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdLmRpc21pc3MoKVxuICAgICAgZGVsZXRlIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbcGF0aFRvLnNvdXJjZUZpbGVdXG4gICAgIyByZW1vdmUgYW55IHVzZXIgZGlzbWlzc2VkIG5vdGlmaWNhdGlvbiBvYmplY3QgcmVmZXJlbmNlc1xuICAgIGZvciBzZiwgbiBvZiBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zXG4gICAgICBpZiBuLmRpc21pc3NlZFxuICAgICAgICBkZWxldGUgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1tzZl1cbiAgICAjIEZJWCBmb3IgYXRvbSBub3RpZmljYXRpb25zLiBkaXNtaXNzZWQgbm9mdGlmaWNhdGlvbnMgdmlhIHdoYXRldmVyIG1lYW5zXG4gICAgIyBhcmUgbmV2ZXIgYWN0dWFsbHkgcmVtb3ZlZCBmcm9tIG1lbW9yeS4gSSBjb25zaWRlciB0aGlzIGEgbWVtb3J5IGxlYWtcbiAgICAjIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2lzc3Vlcy84NjE0IHNvIHJlbW92ZSBhbnkgZGlzbWlzc2VkXG4gICAgIyBub3RpZmljYXRpb24gb2JqZWN0cyBwcmVmaXhlZCB3aXRoIGEgbWVzc2FnZSBwcmVmaXggb2YgTEI6IGZyb20gbWVtb3J5XG4gICAgaSA9IGF0b20ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLmxlbmd0aCAtIDFcbiAgICB3aGlsZSBpID49IDBcbiAgICAgIGlmIGF0b20ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zW2ldLmRpc21pc3NlZCBhbmRcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zW2ldLm1lc3NhZ2Uuc3Vic3RyaW5nKDAsMykgaXMgXCJMQjpcIlxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5zcGxpY2UgaSwgMVxuICAgICAgaS0tXG5cbiAgIyBjcmVhdGUgYmFiZWwgdHJhbnNmb3JtZXIgdGFza3MgLSBvbmUgcGVyIHByb2plY3QgYXMgbmVlZGVkXG4gIGNyZWF0ZVRhc2s6IChwcm9qZWN0UGF0aCkgLT5cbiAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcHJvamVjdFBhdGhdID89XG4gICAgICBUYXNrLm9uY2UgQGJhYmVsVHJhbnNmb3JtZXJQYXRoLCBwcm9qZWN0UGF0aCwgPT5cbiAgICAgICAgIyB0YXNrIGVuZGVkXG4gICAgICAgIGRlbGV0ZSBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcHJvamVjdFBhdGhdXG5cbiAgIyBtb2RpZmllcyBjb25maWcgb3B0aW9ucyBmb3IgY2hhbmdlZCBvciBkZXByZWNhdGVkIGNvbmZpZ3NcbiAgZGVwcmVjYXRlQ29uZmlnOiAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJyk/XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xhbmd1YWdlLWJhYmVsLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnLFxuICAgICAgICBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzU291cmNlUGF0aE1lc3NhZ2VzJyk/XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xhbmd1YWdlLWJhYmVsLnN1cHByZXNzU291cmNlUGF0aE1lc3NhZ2VzJyxcbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzU291cmNlUGF0aE1lc3NhZ2VzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnVzZUludGVybmFsU2Nhbm5lcicpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN0b3BBdFByb2plY3REaXJlY3RvcnknKVxuICAgICMgcmVtb3ZlIGJhYmVsIFY1IG9wdGlvbnNcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuYmFiZWxTdGFnZScpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmV4dGVybmFsSGVscGVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLm1vZHVsZUxvYWRlcicpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmJsYWNrbGlzdFRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLndoaXRlbGlzdFRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmxvb3NlVHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwub3B0aW9uYWxUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5wbHVnaW5zJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwucHJlc2V0cycpXG4gICAgIyByZW1vdmUgb2xkIG5hbWUgaW5kZW50IG9wdGlvbnNcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwuZm9ybWF0SlNYJylcblxuICAjIGNhbGN1bGF0ZSBiYWJlbCBvcHRpb25zIGJhc2VkIHVwb24gcGFja2FnZSBjb25maWcsIGJhYmVscmMgZmlsZXMgYW5kXG4gICMgd2hldGhlciBpbnRlcm5hbFNjYW5uZXIgaXMgdXNlZC5cbiAgZ2V0QmFiZWxPcHRpb25zOiAoY29uZmlnKS0+XG4gICAgIyBzZXQgdHJhbnNwaWxlciBvcHRpb25zIGZyb20gcGFja2FnZSBjb25maWd1cmF0aW9uLlxuICAgIGJhYmVsT3B0aW9ucyA9XG4gICAgICBjb2RlOiB0cnVlXG4gICAgaWYgY29uZmlnLmNyZWF0ZU1hcCAgdGhlbiBiYWJlbE9wdGlvbnMuc291cmNlTWFwcyA9IGNvbmZpZy5jcmVhdGVNYXBcbiAgICBiYWJlbE9wdGlvbnNcblxuICAjZ2V0IGNvbmZpZ3VyYXRpb24gYW5kIHBhdGhzXG4gIGdldENvbmZpZ0FuZFBhdGhUbzogKHNvdXJjZUZpbGUpIC0+XG4gICAgY29uZmlnID0gQGdldENvbmZpZygpXG4gICAgcGF0aFRvID0gQGdldFBhdGhzIHNvdXJjZUZpbGUsIGNvbmZpZ1xuXG4gICAgaWYgY29uZmlnLmFsbG93TG9jYWxPdmVycmlkZVxuICAgICAgaWYgbm90IEBqc29uU2NoZW1hP1xuICAgICAgICBAanNvblNjaGVtYSA9IChyZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvamp2JykoKSAjIHVzZSBqanYgYXMgaXQgcnVucyB3aXRob3V0IENTUCBpc3N1ZXNcbiAgICAgICAgQGpzb25TY2hlbWEuYWRkU2NoZW1hICdsb2NhbENvbmZpZycsIGxhbmd1YWdlYmFiZWxTY2hlbWFcbiAgICAgIGxvY2FsQ29uZmlnID0gQGdldExvY2FsQ29uZmlnIHBhdGhUby5zb3VyY2VGaWxlRGlyLCBwYXRoVG8ucHJvamVjdFBhdGgsIHt9XG4gICAgICAjIG1lcmdlIGxvY2FsIGNvbmZpZ3Mgd2l0aCBnbG9iYWwuIGxvY2FsIHdpbnNcbiAgICAgIEBtZXJnZSBjb25maWcsIGxvY2FsQ29uZmlnXG4gICAgICAjIHJlY2FsYyBwYXRoc1xuICAgICAgcGF0aFRvID0gQGdldFBhdGhzIHNvdXJjZUZpbGUsIGNvbmZpZ1xuICAgIHJldHVybiB7IGNvbmZpZywgcGF0aFRvIH1cblxuICAjIGdldCBnbG9iYWwgY29uZmlndXJhdGlvbiBmb3IgbGFuZ3VhZ2UtYmFiZWxcbiAgZ2V0Q29uZmlnOiAtPiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsJylcblxuIyBjaGVjayBmb3IgcHJlc2NlbmNlIG9mIGEgLmxhbmd1YWdlYmFiZWwgZmlsZSBwYXRoIGZyb21EaXIgdG9EaXJcbiMgcmVhZCwgdmFsaWRhdGUgYW5kIG92ZXJ3cml0ZSBjb25maWcgYXMgcmVxdWlyZWRcbiMgdG9EaXIgaXMgbm9ybWFsbHkgdGhlIGltcGxpY2l0IEF0b20gcHJvamVjdCBmb2xkZXJzIHJvb3QgYnV0IHdlXG4jIHdpbGwgc3RvcCBvZiBhIHByb2plY3RSb290IHRydWUgaXMgZm91bmQgYXMgd2VsbFxuICBnZXRMb2NhbENvbmZpZzogKGZyb21EaXIsIHRvRGlyLCBsb2NhbENvbmZpZykgLT5cbiAgICAjIGdldCBsb2NhbCBwYXRoIG92ZXJpZGVzXG4gICAgbG9jYWxDb25maWdGaWxlID0gJy5sYW5ndWFnZWJhYmVsJ1xuICAgIGxhbmd1YWdlQmFiZWxDZmdGaWxlID0gcGF0aC5qb2luIGZyb21EaXIsIGxvY2FsQ29uZmlnRmlsZVxuICAgIGlmIGZzLmV4aXN0c1N5bmMgbGFuZ3VhZ2VCYWJlbENmZ0ZpbGVcbiAgICAgIGZpbGVDb250ZW50PSBmcy5yZWFkRmlsZVN5bmMgbGFuZ3VhZ2VCYWJlbENmZ0ZpbGUsICd1dGY4J1xuICAgICAgdHJ5XG4gICAgICAgIGpzb25Db250ZW50ID0gSlNPTi5wYXJzZSBmaWxlQ29udGVudFxuICAgICAgY2F0Y2ggZXJyXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkxCOiAje2xvY2FsQ29uZmlnRmlsZX0gI3tlcnIubWVzc2FnZX1cIixcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIGRldGFpbDogXCJGaWxlID0gI3tsYW5ndWFnZUJhYmVsQ2ZnRmlsZX1cXG5cXG4je2ZpbGVDb250ZW50fVwiXG4gICAgICAgIHJldHVyblxuXG4gICAgICBzY2hlbWFFcnJvcnMgPSBAanNvblNjaGVtYS52YWxpZGF0ZSAnbG9jYWxDb25maWcnLCBqc29uQ29udGVudFxuICAgICAgaWYgc2NoZW1hRXJyb3JzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkxCOiAje2xvY2FsQ29uZmlnRmlsZX0gY29uZmlndXJhdGlvbiBlcnJvclwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcIkZpbGUgPSAje2xhbmd1YWdlQmFiZWxDZmdGaWxlfVxcblxcbiN7ZmlsZUNvbnRlbnR9XCJcbiAgICAgIGVsc2VcbiAgICAgICAgIyBtZXJnZSBsb2NhbCBjb25maWcuIGNvbmZpZyBjbG9zZXN0IHNvdXJjZUZpbGUgd2luc1xuICAgICAgICAjIGFwYXJ0IGZyb20gcHJvamVjdFJvb3Qgd2hpY2ggd2lucyBvbiB0cnVlXG4gICAgICAgIGlzUHJvamVjdFJvb3QgPSBqc29uQ29udGVudC5wcm9qZWN0Um9vdFxuICAgICAgICBAbWVyZ2UgIGpzb25Db250ZW50LCBsb2NhbENvbmZpZ1xuICAgICAgICBpZiBpc1Byb2plY3RSb290IHRoZW4ganNvbkNvbnRlbnQucHJvamVjdFJvb3REaXIgPSBmcm9tRGlyXG4gICAgICAgIGxvY2FsQ29uZmlnID0ganNvbkNvbnRlbnRcbiAgICBpZiBmcm9tRGlyIGlzbnQgdG9EaXJcbiAgICAgICMgc3RvcCBpbmZpbml0ZSByZWN1cnNpb24gaHR0cHM6Ly9naXRodWIuY29tL2dhbmRtL2xhbmd1YWdlLWJhYmVsL2lzc3Vlcy82NlxuICAgICAgaWYgZnJvbURpciA9PSBwYXRoLmRpcm5hbWUoZnJvbURpcikgdGhlbiByZXR1cm4gbG9jYWxDb25maWdcbiAgICAgICMgY2hlY2sgcHJvamVjdFJvb3QgcHJvcGVydHkgYW5kIGVuZCByZWN1cnNpb24gaWYgdHJ1ZVxuICAgICAgaWYgaXNQcm9qZWN0Um9vdCB0aGVuIHJldHVybiBsb2NhbENvbmZpZ1xuICAgICAgcmV0dXJuIEBnZXRMb2NhbENvbmZpZyBwYXRoLmRpcm5hbWUoZnJvbURpciksIHRvRGlyLCBsb2NhbENvbmZpZ1xuICAgIGVsc2UgcmV0dXJuIGxvY2FsQ29uZmlnXG5cbiAgIyBjYWxjdWxhdGUgYWJzb3VsdGUgcGF0aHMgb2YgYmFiZWwgc291cmNlLCB0YXJnZXQganMgYW5kIG1hcHMgZmlsZXNcbiAgIyBiYXNlZCB1cG9uIHRoZSBwcm9qZWN0IGRpcmVjdG9yeSBjb250YWluaW5nIHRoZSBzb3VyY2VcbiAgIyBhbmQgdGhlIHJvb3RzIG9mIHNvdXJjZSwgdHJhbnNwaWxlIHBhdGggYW5kIG1hcHMgcGF0aHMgZGVmaW5lZCBpbiBjb25maWdcbiAgZ2V0UGF0aHM6ICAoc291cmNlRmlsZSwgY29uZmlnKSAtPlxuICAgIHByb2plY3RDb250YWluaW5nU291cmNlID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoIHNvdXJjZUZpbGVcbiAgICAjIElzIHRoZSBzb3VyY2VGaWxlIGxvY2F0ZWQgaW5zaWRlIGFuIEF0b20gcHJvamVjdCBmb2xkZXI/XG4gICAgaWYgcHJvamVjdENvbnRhaW5pbmdTb3VyY2VbMF0gaXMgbnVsbFxuICAgICAgc291cmNlRmlsZUluUHJvamVjdCA9IGZhbHNlXG4gICAgZWxzZSBzb3VyY2VGaWxlSW5Qcm9qZWN0ID0gdHJ1ZVxuICAgICMgZGV0ZXJtaW5lcyB0aGUgcHJvamVjdCByb290IGRpciBmcm9tIC5sYW5ndWFnZWJhYmVsIG9yIGZyb20gQXRvbVxuICAgICMgaWYgYSBwcm9qZWN0IGlzIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiBhdG9tIHBhc3NlcyBiYWNrIGEgbnVsbCBmb3JcbiAgICAjIHRoZSBwcm9qZWN0IHBhdGggaWYgdGhlIGZpbGUgaXNuJ3QgaW4gYSBwcm9qZWN0IGZvbGRlclxuICAgICMgc28gbWFrZSB0aGUgcm9vdCBkaXIgdGhhdCBzb3VyY2UgZmlsZSB0aGUgcHJvamVjdFxuICAgIGlmIGNvbmZpZy5wcm9qZWN0Um9vdERpcj9cbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLnByb2plY3RSb290RGlyKVxuICAgIGVsc2UgaWYgcHJvamVjdENvbnRhaW5pbmdTb3VyY2VbMF0gaXMgbnVsbFxuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLnBhcnNlKHNvdXJjZUZpbGUpLnJvb3RcbiAgICBlbHNlXG4gICAgICAjIEF0b20gMS44IHJldHVybmluZyBkcml2ZSBhcyBwcm9qZWN0IHJvb3Qgb24gd2luZG93cyBlLmcuIGM6IG5vdCBjOlxcXG4gICAgICAjIHVzaW5nIHBhdGguam9pbiB0byAnLicgZml4ZXMgaXQuXG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSwnLicpKVxuICAgIHJlbFNvdXJjZVBhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcuYmFiZWxTb3VyY2VQYXRoKVxuICAgIHJlbFRyYW5zcGlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZShjb25maWcuYmFiZWxUcmFuc3BpbGVQYXRoKVxuICAgIHJlbE1hcHNQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsTWFwc1BhdGgpXG5cbiAgICBhYnNTb3VyY2VSb290ID0gcGF0aC5qb2luKGFic1Byb2plY3RQYXRoICwgcmVsU291cmNlUGF0aClcbiAgICBhYnNUcmFuc3BpbGVSb290ID0gcGF0aC5qb2luKGFic1Byb2plY3RQYXRoICwgcmVsVHJhbnNwaWxlUGF0aClcbiAgICBhYnNNYXBzUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbE1hcHNQYXRoKVxuXG4gICAgcGFyc2VkU291cmNlRmlsZSA9IHBhdGgucGFyc2Uoc291cmNlRmlsZSlcbiAgICByZWxTb3VyY2VSb290VG9Tb3VyY2VGaWxlID0gcGF0aC5yZWxhdGl2ZShhYnNTb3VyY2VSb290LCBwYXJzZWRTb3VyY2VGaWxlLmRpcilcblxuICAgICMgb3B0aW9uIHRvIGtlZXAgZmlsZW5hbWUgZXh0ZW5zaW9uIG5hbWVcbiAgICBpZiBjb25maWcua2VlcEZpbGVFeHRlbnNpb25cbiAgICAgIGZuRXh0ID0gcGFyc2VkU291cmNlRmlsZS5leHRcbiAgICBlbHNlXG4gICAgICBmbkV4dCA9ICAnLmpzJ1xuICAgIGFic1RyYW5zcGlsZWRGaWxlID0gcGF0aC5qb2luKGFic1RyYW5zcGlsZVJvb3QsIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgLCBwYXJzZWRTb3VyY2VGaWxlLm5hbWUgICsgZm5FeHQgKVxuICAgIGFic01hcEZpbGUgPSBwYXRoLmpvaW4oYWJzTWFwc1Jvb3QsIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgLCBwYXJzZWRTb3VyY2VGaWxlLm5hbWUgICsgZm5FeHQgKyAnLm1hcCcpXG5cbiAgICBzb3VyY2VGaWxlSW5Qcm9qZWN0OiBzb3VyY2VGaWxlSW5Qcm9qZWN0XG4gICAgc291cmNlRmlsZTogc291cmNlRmlsZVxuICAgIHNvdXJjZUZpbGVEaXI6IHBhcnNlZFNvdXJjZUZpbGUuZGlyXG4gICAgbWFwRmlsZTogYWJzTWFwRmlsZVxuICAgIHRyYW5zcGlsZWRGaWxlOiBhYnNUcmFuc3BpbGVkRmlsZVxuICAgIHNvdXJjZVJvb3Q6IGFic1NvdXJjZVJvb3RcbiAgICBwcm9qZWN0UGF0aDogYWJzUHJvamVjdFBhdGhcblxuIyBjaGVjayBmb3IgcHJlc2NlbmNlIG9mIGEgLmJhYmVscmMgZmlsZSBwYXRoIGZyb21EaXIgdG8gcm9vdFxuICBpc0JhYmVscmNJblBhdGg6IChmcm9tRGlyKSAtPlxuICAgICMgZW52aXJvbW5lbnRzIHVzZWQgaW4gYmFiZWxyY1xuICAgIGJhYmVscmMgPSAnLmJhYmVscmMnXG4gICAgYmFiZWxyY0ZpbGUgPSBwYXRoLmpvaW4gZnJvbURpciwgYmFiZWxyY1xuICAgIGlmIGZzLmV4aXN0c1N5bmMgYmFiZWxyY0ZpbGVcbiAgICAgIHJldHVybiB0cnVlXG4gICAgaWYgZnJvbURpciAhPSBwYXRoLmRpcm5hbWUoZnJvbURpcilcbiAgICAgIHJldHVybiBAaXNCYWJlbHJjSW5QYXRoIHBhdGguZGlybmFtZShmcm9tRGlyKVxuICAgIGVsc2UgcmV0dXJuIGZhbHNlXG5cbiMgc2ltcGxlIG1lcmdlIG9mIG9iamVjdHNcbiAgbWVyZ2U6ICh0YXJnZXRPYmosIHNvdXJjZU9iaikgLT5cbiAgICBmb3IgcHJvcCwgdmFsIG9mIHNvdXJjZU9ialxuICAgICAgdGFyZ2V0T2JqW3Byb3BdID0gdmFsXG5cbiMgc3RvcCB0cmFuc3BpbGVyIHRhc2tcbiAgc3RvcFRyYW5zcGlsZXJUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgbXNnT2JqZWN0ID1cbiAgICAgIGNvbW1hbmQ6ICdzdG9wJ1xuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twcm9qZWN0UGF0aF0uc2VuZChtc2dPYmplY3QpXG5cbiMgc3RvcCBhbGwgdHJhbnNwaWxlciB0YXNrc1xuICBzdG9wQWxsVHJhbnNwaWxlclRhc2s6ICgpIC0+XG4gICAgZm9yIHByb2plY3RQYXRoLCB2IG9mIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1xuICAgICAgQHN0b3BUcmFuc3BpbGVyVGFzayhwcm9qZWN0UGF0aClcblxuIyBzdG9wIHVuc3VlZCB0cmFuc3BpbGVyIHRhc2tzIGlmIGl0cyBwYXRoIGlzbid0IHByZXNlbnQgaW4gYSBjdXJyZW50XG4jIEF0b20gcHJvamVjdCBmb2xkZXJcbiAgc3RvcFVudXNlZFRhc2tzOiAoKSAtPlxuICAgIGF0b21Qcm9qZWN0UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICAgIGZvciBwcm9qZWN0VGFza1BhdGgsdiBvZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NcbiAgICAgIGlzVGFza0luQ3VycmVudFByb2plY3QgPSBmYWxzZVxuICAgICAgZm9yIGF0b21Qcm9qZWN0UGF0aCBpbiBhdG9tUHJvamVjdFBhdGhzXG4gICAgICAgIGlmIHBhdGhJc0luc2lkZShwcm9qZWN0VGFza1BhdGgsIGF0b21Qcm9qZWN0UGF0aClcbiAgICAgICAgICBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0ID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG4gICAgICBpZiBub3QgaXNUYXNrSW5DdXJyZW50UHJvamVjdCB0aGVuIEBzdG9wVHJhbnNwaWxlclRhc2socHJvamVjdFRhc2tQYXRoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcGlsZXJcbiJdfQ==
