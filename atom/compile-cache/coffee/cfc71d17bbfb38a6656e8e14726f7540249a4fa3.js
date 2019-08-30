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
            var f, mapJson, ref2, ref3, ref4;
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
                return fs.writeFileSync(pathTo.mapFile, JSON.stringify(mapJson, null, ' '));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvdHJhbnNwaWxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxlQUFELEVBQU87O0VBQ1AsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEsZ0NBQVI7O0VBR2YsRUFBQSxHQUFLLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYztJQUNqQixHQUFBLEVBQUssU0FBQyxNQUFELEVBQVMsR0FBVDs7UUFDSCxNQUFNLENBQUMsS0FBTSxPQUFBLENBQVEsU0FBUjs7YUFDYixNQUFNLENBQUMsRUFBRyxDQUFBLEdBQUE7SUFGUCxDQURZO0dBQWQ7O0VBT0wsbUJBQUEsR0FBc0I7SUFDcEIsSUFBQSxFQUFNLFFBRGM7SUFFcEIsVUFBQSxFQUFZO01BQ1YsYUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BRHhCO01BRVYsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BRnhCO01BR1YsZUFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxRQUFSO09BSHhCO01BSVYsa0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUp4QjtNQUtWLFNBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQUx4QjtNQU1WLHVCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FOeEI7TUFPVixvQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BUHhCO01BUVYsOEJBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVJ4QjtNQVNWLGlCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FUeEI7TUFVVixXQUFBLEVBQWtDO1FB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QixhQUFBLGtEQUFBOztVQUNFLElBQUcsWUFBQSxDQUFhLGVBQWIsRUFBOEIsZUFBOUIsQ0FBSDtZQUNFLHNCQUFBLEdBQXlCO0FBQ3pCLGtCQUZGOztBQURGO1FBSUEsSUFBRyxDQUFJLHNCQUFQO3VCQUFtQyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsZUFBcEIsR0FBbkM7U0FBQSxNQUFBOytCQUFBOztBQU5GOztJQUZlOzs7Ozs7RUFVbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFuY2pCIiwic291cmNlc0NvbnRlbnQiOlsie1Rhc2ssIENvbXBvc2l0ZURpc3Bvc2FibGUgfSA9IHJlcXVpcmUgJ2F0b20nXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbnBhdGhJc0luc2lkZSA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9wYXRoLWlzLWluc2lkZSdcblxuIyBMYXppbHkgcmVxdWlyZSBmcy1wbHVzIHRvIGF2b2lkIGJsb2NraW5nIHN0YXJ0dXAuXG5mcyA9IG5ldyBQcm94eSh7fSwge1xuICBnZXQ6ICh0YXJnZXQsIGtleSkgLT5cbiAgICB0YXJnZXQuZnMgPz0gcmVxdWlyZSAnZnMtcGx1cydcbiAgICB0YXJnZXQuZnNba2V5XVxufSlcblxuIyBzZXR1cCBKU09OIFNjaGVtYSB0byBwYXJzZSAubGFuZ3VhZ2ViYWJlbCBjb25maWdzXG5sYW5ndWFnZWJhYmVsU2NoZW1hID0ge1xuICB0eXBlOiAnb2JqZWN0JyxcbiAgcHJvcGVydGllczoge1xuICAgIGJhYmVsTWFwc1BhdGg6ICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgYmFiZWxNYXBzQWRkVXJsOiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgYmFiZWxTb3VyY2VQYXRoOiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBiYWJlbFRyYW5zcGlsZVBhdGg6ICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGNyZWF0ZU1hcDogICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGNyZWF0ZVRhcmdldERpcmVjdG9yaWVzOiAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGNyZWF0ZVRyYW5zcGlsZWRDb2RlOiAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGRpc2FibGVXaGVuTm9CYWJlbHJjRmlsZUluUGF0aDogICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGtlZXBGaWxlRXh0ZW5zaW9uOiAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIHByb2plY3RSb290OiAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIHN1cHByZXNzU291cmNlUGF0aE1lc3NhZ2VzOiAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIHN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXM6ICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIHRyYW5zcGlsZU9uU2F2ZTogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9XG4gIH0sXG4gIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZVxufVxuXG5jbGFzcyBUcmFuc3BpbGVyXG5cbiAgZnJvbUdyYW1tYXJOYW1lOiAnQmFiZWwgRVM2IEphdmFTY3JpcHQnXG4gIGZyb21TY29wZU5hbWU6ICdzb3VyY2UuanMuanN4J1xuICB0b1Njb3BlTmFtZTogJ3NvdXJjZS5qcy5qc3gnXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlcUlkID0gMFxuICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrcyA9IHt9XG4gICAgQGJhYmVsVHJhbnNmb3JtZXJQYXRoID0gcmVxdWlyZS5yZXNvbHZlICcuL3RyYW5zcGlsZXItdGFzaydcbiAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zID0ge31cbiAgICBAZGVwcmVjYXRlQ29uZmlnKClcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgaWYgQGdldENvbmZpZygpLnRyYW5zcGlsZU9uU2F2ZSBvciBAZ2V0Q29uZmlnKCkuYWxsb3dMb2NhbE92ZXJyaWRlXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29udGV4dE1lbnUuYWRkIHtcbiAgICAgICAgJy50cmVlLXZpZXcgLmRpcmVjdG9yeSA+IC5oZWFkZXIgPiAubmFtZSc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdMYW5ndWFnZS1CYWJlbCdcbiAgICAgICAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgICAgICAgIHtsYWJlbDogJ1RyYW5zcGlsZSBEaXJlY3RvcnkgJywgY29tbWFuZDogJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcnknfVxuICAgICAgICAgICAgICAgIHtsYWJlbDogJ1RyYW5zcGlsZSBEaXJlY3RvcmllcycsIGNvbW1hbmQ6ICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3JpZXMnfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB7J3R5cGUnOiAnc2VwYXJhdG9yJyB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3IC5kaXJlY3RvcnkgPiAuaGVhZGVyID4gLm5hbWUnLCAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yeScsIEBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3J5XG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3IC5kaXJlY3RvcnkgPiAuaGVhZGVyID4gLm5hbWUnLCAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yaWVzJywgQGNvbW1hbmRUcmFuc3BpbGVEaXJlY3Rvcmllc1xuXG4gICMgbWV0aG9kIHVzZWQgYnkgc291cmNlLXByZXZpZXcgdG8gc2VlIHRyYW5zcGlsZWQgY29kZVxuICB0cmFuc2Zvcm06IChjb2RlLCB7ZmlsZVBhdGgsIHNvdXJjZU1hcH0pIC0+XG4gICAgY29uZmlnID0gQGdldENvbmZpZygpXG4gICAgcGF0aFRvID0gQGdldFBhdGhzIGZpbGVQYXRoLCBjb25maWdcbiAgICAjIGNyZWF0ZSBiYWJlbCB0cmFuc2Zvcm1lciB0YXNrcyAtIG9uZSBwZXIgcHJvamVjdCBhcyBuZWVkZWRcbiAgICBAY3JlYXRlVGFzayBwYXRoVG8ucHJvamVjdFBhdGhcbiAgICBiYWJlbE9wdGlvbnMgPVxuICAgICAgZmlsZW5hbWU6IGZpbGVQYXRoXG4gICAgICBhc3Q6IGZhbHNlXG4gICAgaWYgc291cmNlTWFwIHRoZW4gYmFiZWxPcHRpb25zLnNvdXJjZU1hcHMgPSBzb3VyY2VNYXBcbiAgICAjIG9rIG5vdyB0cmFuc3BpbGUgaW4gdGhlIHRhc2sgYW5kIHdhaXQgb24gdGhlIHJlc3VsdFxuICAgIGlmIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdXG4gICAgICByZXFJZCA9IEByZXFJZCsrXG4gICAgICBtc2dPYmplY3QgPVxuICAgICAgICByZXFJZDogcmVxSWRcbiAgICAgICAgY29tbWFuZDogJ3RyYW5zcGlsZUNvZGUnXG4gICAgICAgIHBhdGhUbzogcGF0aFRvXG4gICAgICAgIGNvZGU6IGNvZGVcbiAgICAgICAgYmFiZWxPcHRpb25zOiBiYWJlbE9wdGlvbnNcblxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QgKSA9PlxuICAgICAgIyB0cmFuc3BpbGUgaW4gdGFza1xuICAgICAgdHJ5XG4gICAgICAgIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLnNlbmQobXNnT2JqZWN0KVxuICAgICAgY2F0Y2ggZXJyXG4gICAgICAgIGRlbGV0ZSBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgICByZWplY3QoXCJFcnJvciAje2Vycn0gc2VuZGluZyB0byB0cmFuc3BpbGUgdGFzayB3aXRoIFBJRCAje0BiYWJlbFRyYW5zcGlsZXJUYXNrc1twYXRoVG8ucHJvamVjdFBhdGhdLmNoaWxkUHJvY2Vzcy5waWR9XCIpXG4gICAgICAjIGdldCByZXN1bHQgZnJvbSB0YXNrIGZvciB0aGlzIHJlcUlkXG4gICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5vbmNlIFwidHJhbnNwaWxlOiN7cmVxSWR9XCIsIChtc2dSZXQpID0+XG4gICAgICAgIGlmIG1zZ1JldC5lcnI/XG4gICAgICAgICAgcmVqZWN0KFwiQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn1cXG4je21zZ1JldC5lcnIubWVzc2FnZX1cXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbXNnUmV0LnNvdXJjZU1hcCA9IG1zZ1JldC5tYXBcbiAgICAgICAgICByZXNvbHZlKG1zZ1JldClcblxuICAjIGNhbGxlZCBieSBjb21tYW5kXG4gIGNvbW1hbmRUcmFuc3BpbGVEaXJlY3Rvcnk6ICh7dGFyZ2V0fSkgPT5cbiAgICBAdHJhbnNwaWxlRGlyZWN0b3J5IHtkaXJlY3Rvcnk6IHRhcmdldC5kYXRhc2V0LnBhdGggfVxuXG4gICMgY2FsbGVkIGJ5IGNvbW1hbmRcbiAgY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yaWVzOiAoe3RhcmdldH0pID0+XG4gICAgQHRyYW5zcGlsZURpcmVjdG9yeSB7ZGlyZWN0b3J5OiB0YXJnZXQuZGF0YXNldC5wYXRoLCByZWN1cnNpdmU6IHRydWV9XG5cbiAgIyB0cmFuc3BpbGUgYWxsIGZpbGVzIGluIGEgZGlyZWN0b3J5IG9yIHJlY3Vyc2l2ZSBkaXJlY3Rvcmllc1xuICAjIG9wdGlvbnMgYXJlIHsgZGlyZWN0b3J5OiBuYW1lLCByZWN1cnNpdmU6IHRydWV8ZmFsc2V9XG4gIHRyYW5zcGlsZURpcmVjdG9yeTogKG9wdGlvbnMpIC0+XG4gICAgZGlyZWN0b3J5ID0gb3B0aW9ucy5kaXJlY3RvcnlcbiAgICByZWN1cnNpdmUgPSBvcHRpb25zLnJlY3Vyc2l2ZSBvciBmYWxzZVxuICAgIGZzLnJlYWRkaXIgZGlyZWN0b3J5LCAoZXJyLGZpbGVzKSA9PlxuICAgICAgaWYgbm90IGVycj9cbiAgICAgICAgZmlsZXMubWFwIChmaWxlKSA9PlxuICAgICAgICAgIGZxRmlsZU5hbWUgPSBwYXRoLmpvaW4oZGlyZWN0b3J5LCBmaWxlKVxuICAgICAgICAgIGZzLnN0YXQgZnFGaWxlTmFtZSwgKGVyciwgc3RhdHMpID0+XG4gICAgICAgICAgICBpZiBub3QgZXJyP1xuICAgICAgICAgICAgICBpZiBzdGF0cy5pc0ZpbGUoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpZiAvXFwubWluXFwuW2Etel0rJC8udGVzdCBmcUZpbGVOYW1lICMgbm8gbWluaW1pemVkIGZpbGVzXG4gICAgICAgICAgICAgICAgaWYgL1xcLihqc3xqc3h8ZXN8ZXM2fGJhYmVsfG1qcykkLy50ZXN0IGZxRmlsZU5hbWUgIyBvbmx5IGpzXG4gICAgICAgICAgICAgICAgICBAdHJhbnNwaWxlIGZpbGUsIG51bGwsIEBnZXRDb25maWdBbmRQYXRoVG8gZnFGaWxlTmFtZVxuICAgICAgICAgICAgICBlbHNlIGlmIHJlY3Vyc2l2ZSBhbmQgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogZnFGaWxlTmFtZSwgcmVjdXJzaXZlOiB0cnVlfVxuXG4gICMgdHJhbnNwaWxlIHNvdXJjZUZpbGUgZWRpdGVkIGJ5IHRoZSBvcHRpb25hbCB0ZXh0RWRpdG9yXG4gIHRyYW5zcGlsZTogKHNvdXJjZUZpbGUsIHRleHRFZGl0b3IsIGNvbmZpZ0FuZFBhdGhUbykgLT5cbiAgICAjIGdldCBjb25maWdcbiAgICBpZiBjb25maWdBbmRQYXRoVG8/XG4gICAgICB7IGNvbmZpZywgcGF0aFRvIH0gPSBjb25maWdBbmRQYXRoVG9cbiAgICBlbHNlXG4gICAgICB7Y29uZmlnLCBwYXRoVG8gfSA9IEBnZXRDb25maWdBbmRQYXRoVG8oc291cmNlRmlsZSlcblxuICAgIHJldHVybiBpZiBjb25maWcudHJhbnNwaWxlT25TYXZlIGlzbnQgdHJ1ZVxuXG4gICAgaWYgY29uZmlnLmRpc2FibGVXaGVuTm9CYWJlbHJjRmlsZUluUGF0aFxuICAgICAgaWYgbm90IEBpc0JhYmVscmNJblBhdGggcGF0aFRvLnNvdXJjZUZpbGVEaXJcbiAgICAgICAgcmV0dXJuXG5cbiAgICBpZiBub3QgcGF0aElzSW5zaWRlKHBhdGhUby5zb3VyY2VGaWxlLCBwYXRoVG8uc291cmNlUm9vdClcbiAgICAgIGlmIG5vdCBjb25maWcuc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXNcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgJ0xCOiBCYWJlbCBmaWxlIGlzIG5vdCBpbnNpZGUgdGhlIFwiQmFiZWwgU291cmNlIFBhdGhcIiBkaXJlY3RvcnkuJyxcbiAgICAgICAgICBkaXNtaXNzYWJsZTogZmFsc2VcbiAgICAgICAgICBkZXRhaWw6IFwiTm8gdHJhbnNwaWxlZCBjb2RlIG91dHB1dCBmb3IgZmlsZSBcXG4je3BhdGhUby5zb3VyY2VGaWxlfVxuICAgICAgICAgICAgXFxuXFxuVG8gc3VwcHJlc3MgdGhlc2UgJ2ludmFsaWQgc291cmNlIHBhdGgnXG4gICAgICAgICAgICBtZXNzYWdlcyB1c2UgbGFuZ3VhZ2UtYmFiZWwgcGFja2FnZSBzZXR0aW5nc1wiXG4gICAgICByZXR1cm5cblxuICAgIGJhYmVsT3B0aW9ucyA9IEBnZXRCYWJlbE9wdGlvbnMgY29uZmlnXG5cbiAgICBAY2xlYW5Ob3RpZmljYXRpb25zKHBhdGhUbylcblxuICAgICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuXG4gICAgIyBvayBub3cgdHJhbnNwaWxlIGluIHRoZSB0YXNrIGFuZCB3YWl0IG9uIHRoZSByZXN1bHRcbiAgICBpZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgcmVxSWQgPSBAcmVxSWQrK1xuICAgICAgbXNnT2JqZWN0ID1cbiAgICAgICAgcmVxSWQ6IHJlcUlkXG4gICAgICAgIGNvbW1hbmQ6ICd0cmFuc3BpbGUnXG4gICAgICAgIHBhdGhUbzogcGF0aFRvXG4gICAgICAgIGJhYmVsT3B0aW9uczogYmFiZWxPcHRpb25zXG5cbiAgICAgICMgdHJhbnNwaWxlIGluIHRhc2tcbiAgICAgIHRyeVxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBjb25zb2xlLmxvZyBcIkVycm9yICN7ZXJyfSBzZW5kaW5nIHRvIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIlxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG4gICAgICAgIGNvbnNvbGUubG9nIFwiUmVzdGFydGVkIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIlxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcblxuICAgICAgIyBnZXQgcmVzdWx0IGZyb20gdGFzayBmb3IgdGhpcyByZXFJZFxuICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0ub25jZSBcInRyYW5zcGlsZToje3JlcUlkfVwiLCAobXNnUmV0KSA9PlxuICAgICAgICAjIC5pZ25vcmVkIGlzIHJldHVybmVkIHdoZW4gLmJhYmVscmMgaWdub3JlL29ubHkgZmxhZ3MgYXJlIHVzZWRcbiAgICAgICAgaWYgbXNnUmV0LnJlc3VsdD8uaWdub3JlZCB0aGVuIHJldHVyblxuICAgICAgICBpZiBtc2dSZXQuZXJyXG4gICAgICAgICAgaWYgbXNnUmV0LmVyci5zdGFja1xuICAgICAgICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0gPVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogQmFiZWwgVHJhbnNwaWxlciBFcnJvclwiLFxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVxcbiBcXG4je21zZ1JldC5lcnIuc3RhY2t9XCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXSA9XG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkxCOiBCYWJlbCB2I3ttc2dSZXQuYmFiZWxWZXJzaW9ufSBUcmFuc3BpbGVyIEVycm9yXCIsXG4gICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuIFxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XFxuIFxcbiN7bXNnUmV0LmVyci5jb2RlRnJhbWV9XCJcbiAgICAgICAgICAgICMgaWYgd2UgaGF2ZSBhIGxpbmUvY29sIHN5bnRheCBlcnJvciBqdW1wIHRvIHRoZSBwb3NpdGlvblxuICAgICAgICAgICAgaWYgbXNnUmV0LmVyci5sb2M/LmxpbmU/IGFuZCB0ZXh0RWRpdG9yPy5hbGl2ZVxuICAgICAgICAgICAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFttc2dSZXQuZXJyLmxvYy5saW5lLTEsIG1zZ1JldC5lcnIubG9jLmNvbHVtbl1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIG5vdCBjb25maWcuc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlc1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJMQjogQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn0gVHJhbnNwaWxlciBTdWNjZXNzXCIsXG4gICAgICAgICAgICAgIGRldGFpbDogXCIje3BhdGhUby5zb3VyY2VGaWxlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVwiXG5cbiAgICAgICAgICBpZiBub3QgY29uZmlnLmNyZWF0ZVRyYW5zcGlsZWRDb2RlXG4gICAgICAgICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXNcbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gJ0xCOiBObyB0cmFuc3BpbGVkIG91dHB1dCBjb25maWd1cmVkJ1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgaWYgcGF0aFRvLnNvdXJjZUZpbGUgaXMgcGF0aFRvLnRyYW5zcGlsZWRGaWxlXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyAnTEI6IFRyYW5zcGlsZWQgZmlsZSB3b3VsZCBvdmVyd3JpdGUgc291cmNlIGZpbGUuIEFib3J0ZWQhJyxcbiAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgZGV0YWlsOiBwYXRoVG8uc291cmNlRmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAjIHdyaXRlIGNvZGUgYW5kIG1hcHNcbiAgICAgICAgICBpZiBjb25maWcuY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXNcbiAgICAgICAgICAgIGZzLm1ha2VUcmVlU3luYyggcGF0aC5wYXJzZSggcGF0aFRvLnRyYW5zcGlsZWRGaWxlKS5kaXIpXG5cbiAgICAgICAgICAjIGFkZCBzb3VyY2UgbWFwIHVybCB0byBjb2RlIGlmIGZpbGUgaXNuJ3QgaWdub3JlZFxuICAgICAgICAgIGlmIGNvbmZpZy5iYWJlbE1hcHNBZGRVcmxcbiAgICAgICAgICAgICMgTWFrZSB1bml4IHR5cGUgcGF0aCAtIG1hcCBmaWxlIGxvY2F0aW9uIHJlbGF0aXZlIHRvIHRyYW5zcGlsZWQgZmlsZVxuICAgICAgICAgICAgZiA9IHBhdGguam9pbihwYXRoLnJlbGF0aXZlKHBhdGhUby50cmFuc3BpbGVkRmlsZURpciwgcGF0aFRvLm1hcEZpbGVEaXIpLCBwYXRoVG8ubWFwRmlsZU5hbWUpLnNwbGl0KHBhdGguc2VwKS5qb2luKCcvJylcbiAgICAgICAgICAgIG1zZ1JldC5yZXN1bHQuY29kZSA9IG1zZ1JldC5yZXN1bHQuY29kZSArICdcXG4nICsgJy8vIyBzb3VyY2VNYXBwaW5nVVJMPScrZlxuXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoVG8udHJhbnNwaWxlZEZpbGUsIG1zZ1JldC5yZXN1bHQuY29kZVxuXG4gICAgICAgICAgIyB3cml0ZSBzb3VyY2UgbWFwIGlmIHJldHVybmVkIGFuZCBpZiBhc2tlZFxuICAgICAgICAgIGlmIGNvbmZpZy5jcmVhdGVNYXAgYW5kIG1zZ1JldC5yZXN1bHQubWFwPy52ZXJzaW9uXG4gICAgICAgICAgICBpZiBjb25maWcuY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXNcbiAgICAgICAgICAgICAgZnMubWFrZVRyZWVTeW5jKHBhdGgucGFyc2UocGF0aFRvLm1hcEZpbGUpLmRpcilcblxuICAgICAgICAgICAgIyBNYWtlIHVuaXggdHlwZSBwYXRoIC0gb3JpZ2luYWwgc291cmNlIGZpbGUgIHJlbGF0aXZlIHRvIG1hcCBmaWxlXG4gICAgICAgICAgICBmID0gcGF0aC5qb2luKHBhdGgucmVsYXRpdmUocGF0aFRvLm1hcEZpbGVEaXIsIHBhdGhUby5zb3VyY2VGaWxlRGlyICksIHBhdGhUby5zb3VyY2VGaWxlTmFtZSkuc3BsaXQocGF0aC5zZXApLmpvaW4oJy8nKVxuXG4gICAgICAgICAgICBtYXBKc29uID1cbiAgICAgICAgICAgICAgdmVyc2lvbjogbXNnUmV0LnJlc3VsdC5tYXAudmVyc2lvblxuICAgICAgICAgICAgICBzb3VyY2VzOiAgW2ZdXG4gICAgICAgICAgICAgIGZpbGU6IGZcbiAgICAgICAgICAgICAgbmFtZXM6IG1zZ1JldC5yZXN1bHQubWFwLm5hbWVzXG4gICAgICAgICAgICAgIG1hcHBpbmdzOiBtc2dSZXQucmVzdWx0Lm1hcC5tYXBwaW5nc1xuICAgICAgICAgICAgI3hzc2lQcm90ZWN0aW9uID0gJyldfVxcbicgICAgIyByZW1vdmVkIHRoaXMgbGluZSBhcyBGaXJlZm94IGRvZXNuJ3Qgc3VwcG9ydCByZW1vdmFsIG9mIHhzc2kgcHJlZml4IVxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoVG8ubWFwRmlsZSwgSlNPTi5zdHJpbmdpZnkgbWFwSnNvbiwgbnVsbCwgJyAnXG5cbiAgIyBjbGVhbiBub3RpZmljYXRpb24gbWVzc2FnZXNcbiAgY2xlYW5Ob3RpZmljYXRpb25zOiAocGF0aFRvKSAtPlxuICAgICMgYXV0byBkaXNtaXNzIHByZXZpb3VzIHRyYW5zcGlsZSBlcnJvciBub3RpZmljYXRpb25zIGZvciB0aGlzIHNvdXJjZSBmaWxlXG4gICAgaWYgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0/XG4gICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXS5kaXNtaXNzKClcbiAgICAgIGRlbGV0ZSBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXVxuICAgICMgcmVtb3ZlIGFueSB1c2VyIGRpc21pc3NlZCBub3RpZmljYXRpb24gb2JqZWN0IHJlZmVyZW5jZXNcbiAgICBmb3Igc2YsIG4gb2YgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1xuICAgICAgaWYgbi5kaXNtaXNzZWRcbiAgICAgICAgZGVsZXRlIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbc2ZdXG4gICAgIyBGSVggZm9yIGF0b20gbm90aWZpY2F0aW9ucy4gZGlzbWlzc2VkIG5vZnRpZmljYXRpb25zIHZpYSB3aGF0ZXZlciBtZWFuc1xuICAgICMgYXJlIG5ldmVyIGFjdHVhbGx5IHJlbW92ZWQgZnJvbSBtZW1vcnkuIEkgY29uc2lkZXIgdGhpcyBhIG1lbW9yeSBsZWFrXG4gICAgIyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvODYxNCBzbyByZW1vdmUgYW55IGRpc21pc3NlZFxuICAgICMgbm90aWZpY2F0aW9uIG9iamVjdHMgcHJlZml4ZWQgd2l0aCBhIG1lc3NhZ2UgcHJlZml4IG9mIExCOiBmcm9tIG1lbW9yeVxuICAgIGkgPSBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5sZW5ndGggLSAxXG4gICAgd2hpbGUgaSA+PSAwXG4gICAgICBpZiBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5kaXNtaXNzZWQgYW5kXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5tZXNzYWdlLnN1YnN0cmluZygwLDMpIGlzIFwiTEI6XCJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMuc3BsaWNlIGksIDFcbiAgICAgIGktLVxuXG4gICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICBjcmVhdGVUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXSA/PVxuICAgICAgVGFzay5vbmNlIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCwgcHJvamVjdFBhdGgsID0+XG4gICAgICAgICMgdGFzayBlbmRlZFxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXVxuXG4gICMgbW9kaWZpZXMgY29uZmlnIG9wdGlvbnMgZm9yIGNoYW5nZWQgb3IgZGVwcmVjYXRlZCBjb25maWdzXG4gIGRlcHJlY2F0ZUNvbmZpZzogLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJyxcbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycsXG4gICAgICAgIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC51c2VJbnRlcm5hbFNjYW5uZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdG9wQXRQcm9qZWN0RGlyZWN0b3J5JylcbiAgICAjIHJlbW92ZSBiYWJlbCBWNSBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmJhYmVsU3RhZ2UnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5leHRlcm5hbEhlbHBlcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5tb2R1bGVMb2FkZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5ibGFja2xpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC53aGl0ZWxpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5sb29zZVRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLm9wdGlvbmFsVHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwucGx1Z2lucycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnByZXNldHMnKVxuICAgICMgcmVtb3ZlIG9sZCBuYW1lIGluZGVudCBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmZvcm1hdEpTWCcpXG5cbiAgIyBjYWxjdWxhdGUgYmFiZWwgb3B0aW9ucyBiYXNlZCB1cG9uIHBhY2thZ2UgY29uZmlnLCBiYWJlbHJjIGZpbGVzIGFuZFxuICAjIHdoZXRoZXIgaW50ZXJuYWxTY2FubmVyIGlzIHVzZWQuXG4gIGdldEJhYmVsT3B0aW9uczogKGNvbmZpZyktPlxuICAgICMgc2V0IHRyYW5zcGlsZXIgb3B0aW9ucyBmcm9tIHBhY2thZ2UgY29uZmlndXJhdGlvbi5cbiAgICBiYWJlbE9wdGlvbnMgPVxuICAgICAgY29kZTogdHJ1ZVxuICAgIGlmIGNvbmZpZy5jcmVhdGVNYXAgIHRoZW4gYmFiZWxPcHRpb25zLnNvdXJjZU1hcHMgPSBjb25maWcuY3JlYXRlTWFwXG4gICAgYmFiZWxPcHRpb25zXG5cbiAgI2dldCBjb25maWd1cmF0aW9uIGFuZCBwYXRoc1xuICBnZXRDb25maWdBbmRQYXRoVG86IChzb3VyY2VGaWxlKSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcblxuICAgIGlmIGNvbmZpZy5hbGxvd0xvY2FsT3ZlcnJpZGVcbiAgICAgIGlmIG5vdCBAanNvblNjaGVtYT9cbiAgICAgICAgQGpzb25TY2hlbWEgPSAocmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL2pqdicpKCkgIyB1c2Ugamp2IGFzIGl0IHJ1bnMgd2l0aG91dCBDU1AgaXNzdWVzXG4gICAgICAgIEBqc29uU2NoZW1hLmFkZFNjaGVtYSAnbG9jYWxDb25maWcnLCBsYW5ndWFnZWJhYmVsU2NoZW1hXG4gICAgICBsb2NhbENvbmZpZyA9IEBnZXRMb2NhbENvbmZpZyBwYXRoVG8uc291cmNlRmlsZURpciwgcGF0aFRvLnByb2plY3RQYXRoLCB7fVxuICAgICAgIyBtZXJnZSBsb2NhbCBjb25maWdzIHdpdGggZ2xvYmFsLiBsb2NhbCB3aW5zXG4gICAgICBAbWVyZ2UgY29uZmlnLCBsb2NhbENvbmZpZ1xuICAgICAgIyByZWNhbGMgcGF0aHNcbiAgICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcbiAgICByZXR1cm4geyBjb25maWcsIHBhdGhUbyB9XG5cbiAgIyBnZXQgZ2xvYmFsIGNvbmZpZ3VyYXRpb24gZm9yIGxhbmd1YWdlLWJhYmVsXG4gIGdldENvbmZpZzogLT4gYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbCcpXG5cbiMgY2hlY2sgZm9yIHByZXNjZW5jZSBvZiBhIC5sYW5ndWFnZWJhYmVsIGZpbGUgcGF0aCBmcm9tRGlyIHRvRGlyXG4jIHJlYWQsIHZhbGlkYXRlIGFuZCBvdmVyd3JpdGUgY29uZmlnIGFzIHJlcXVpcmVkXG4jIHRvRGlyIGlzIG5vcm1hbGx5IHRoZSBpbXBsaWNpdCBBdG9tIHByb2plY3QgZm9sZGVycyByb290IGJ1dCB3ZVxuIyB3aWxsIHN0b3Agb2YgYSBwcm9qZWN0Um9vdCB0cnVlIGlzIGZvdW5kIGFzIHdlbGxcbiAgZ2V0TG9jYWxDb25maWc6IChmcm9tRGlyLCB0b0RpciwgbG9jYWxDb25maWcpIC0+XG4gICAgIyBnZXQgbG9jYWwgcGF0aCBvdmVyaWRlc1xuICAgIGxvY2FsQ29uZmlnRmlsZSA9ICcubGFuZ3VhZ2ViYWJlbCdcbiAgICBsYW5ndWFnZUJhYmVsQ2ZnRmlsZSA9IHBhdGguam9pbiBmcm9tRGlyLCBsb2NhbENvbmZpZ0ZpbGVcbiAgICBpZiBmcy5leGlzdHNTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlXG4gICAgICBmaWxlQ29udGVudD0gZnMucmVhZEZpbGVTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlLCAndXRmOCdcbiAgICAgIHRyeVxuICAgICAgICBqc29uQ29udGVudCA9IEpTT04ucGFyc2UgZmlsZUNvbnRlbnRcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9ICN7ZXJyLm1lc3NhZ2V9XCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiRmlsZSA9ICN7bGFuZ3VhZ2VCYWJlbENmZ0ZpbGV9XFxuXFxuI3tmaWxlQ29udGVudH1cIlxuICAgICAgICByZXR1cm5cblxuICAgICAgc2NoZW1hRXJyb3JzID0gQGpzb25TY2hlbWEudmFsaWRhdGUgJ2xvY2FsQ29uZmlnJywganNvbkNvbnRlbnRcbiAgICAgIGlmIHNjaGVtYUVycm9yc1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9IGNvbmZpZ3VyYXRpb24gZXJyb3JcIixcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIGRldGFpbDogXCJGaWxlID0gI3tsYW5ndWFnZUJhYmVsQ2ZnRmlsZX1cXG5cXG4je2ZpbGVDb250ZW50fVwiXG4gICAgICBlbHNlXG4gICAgICAgICMgbWVyZ2UgbG9jYWwgY29uZmlnLiBjb25maWcgY2xvc2VzdCBzb3VyY2VGaWxlIHdpbnNcbiAgICAgICAgIyBhcGFydCBmcm9tIHByb2plY3RSb290IHdoaWNoIHdpbnMgb24gdHJ1ZVxuICAgICAgICBpc1Byb2plY3RSb290ID0ganNvbkNvbnRlbnQucHJvamVjdFJvb3RcbiAgICAgICAgQG1lcmdlICBqc29uQ29udGVudCwgbG9jYWxDb25maWdcbiAgICAgICAgaWYgaXNQcm9qZWN0Um9vdCB0aGVuIGpzb25Db250ZW50LnByb2plY3RSb290RGlyID0gZnJvbURpclxuICAgICAgICBsb2NhbENvbmZpZyA9IGpzb25Db250ZW50XG4gICAgaWYgZnJvbURpciBpc250IHRvRGlyXG4gICAgICAjIHN0b3AgaW5maW5pdGUgcmVjdXJzaW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9nYW5kbS9sYW5ndWFnZS1iYWJlbC9pc3N1ZXMvNjZcbiAgICAgIGlmIGZyb21EaXIgPT0gcGF0aC5kaXJuYW1lKGZyb21EaXIpIHRoZW4gcmV0dXJuIGxvY2FsQ29uZmlnXG4gICAgICAjIGNoZWNrIHByb2plY3RSb290IHByb3BlcnR5IGFuZCBlbmQgcmVjdXJzaW9uIGlmIHRydWVcbiAgICAgIGlmIGlzUHJvamVjdFJvb3QgdGhlbiByZXR1cm4gbG9jYWxDb25maWdcbiAgICAgIHJldHVybiBAZ2V0TG9jYWxDb25maWcgcGF0aC5kaXJuYW1lKGZyb21EaXIpLCB0b0RpciwgbG9jYWxDb25maWdcbiAgICBlbHNlIHJldHVybiBsb2NhbENvbmZpZ1xuXG4gICMgY2FsY3VsYXRlIGFic291bHRlIHBhdGhzIG9mIGJhYmVsIHNvdXJjZSwgdGFyZ2V0IGpzIGFuZCBtYXBzIGZpbGVzXG4gICMgYmFzZWQgdXBvbiB0aGUgcHJvamVjdCBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgc291cmNlXG4gICMgYW5kIHRoZSByb290cyBvZiBzb3VyY2UsIHRyYW5zcGlsZSBwYXRoIGFuZCBtYXBzIHBhdGhzIGRlZmluZWQgaW4gY29uZmlnXG4gIGdldFBhdGhzOiAgKHNvdXJjZUZpbGUsIGNvbmZpZykgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBzb3VyY2VGaWxlXG4gICAgIyBJcyB0aGUgc291cmNlRmlsZSBsb2NhdGVkIGluc2lkZSBhbiBBdG9tIHByb2plY3QgZm9sZGVyP1xuICAgIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIHNvdXJjZUZpbGVJblByb2plY3QgPSBmYWxzZVxuICAgIGVsc2Ugc291cmNlRmlsZUluUHJvamVjdCA9IHRydWVcbiAgICAjIGRldGVybWluZXMgdGhlIHByb2plY3Qgcm9vdCBkaXIgZnJvbSAubGFuZ3VhZ2ViYWJlbCBvciBmcm9tIEF0b21cbiAgICAjIGlmIGEgcHJvamVjdCBpcyBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgYXRvbSBwYXNzZXMgYmFjayBhIG51bGwgZm9yXG4gICAgIyB0aGUgcHJvamVjdCBwYXRoIGlmIHRoZSBmaWxlIGlzbid0IGluIGEgcHJvamVjdCBmb2xkZXJcbiAgICAjIHNvIG1ha2UgdGhlIHJvb3QgZGlyIHRoYXQgc291cmNlIGZpbGUgdGhlIHByb2plY3RcbiAgICBpZiBjb25maWcucHJvamVjdFJvb3REaXI/XG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5wcm9qZWN0Um9vdERpcilcbiAgICBlbHNlIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5wYXJzZShzb3VyY2VGaWxlKS5yb290XG4gICAgZWxzZVxuICAgICAgIyBBdG9tIDEuOCByZXR1cm5pbmcgZHJpdmUgYXMgcHJvamVjdCByb290IG9uIHdpbmRvd3MgZS5nLiBjOiBub3QgYzpcXFxuICAgICAgIyB1c2luZyBwYXRoLmpvaW4gdG8gJy4nIGZpeGVzIGl0LlxuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4ocHJvamVjdENvbnRhaW5pbmdTb3VyY2VbMF0sJy4nKSlcbiAgICByZWxTb3VyY2VQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsU291cmNlUGF0aClcbiAgICByZWxUcmFuc3BpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aClcbiAgICByZWxNYXBzUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbE1hcHNQYXRoKVxuXG4gICAgYWJzU291cmNlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFNvdXJjZVBhdGgpXG4gICAgYWJzVHJhbnNwaWxlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFRyYW5zcGlsZVBhdGgpXG4gICAgYWJzTWFwc1Jvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxNYXBzUGF0aClcblxuICAgIHBhcnNlZFNvdXJjZUZpbGUgPSBwYXRoLnBhcnNlKHNvdXJjZUZpbGUpXG4gICAgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSA9IHBhdGgucmVsYXRpdmUoYWJzU291cmNlUm9vdCwgcGFyc2VkU291cmNlRmlsZS5kaXIpXG5cbiAgICAjIG9wdGlvbiB0byBrZWVwIGZpbGVuYW1lIGV4dGVuc2lvbiBuYW1lXG4gICAgaWYgY29uZmlnLmtlZXBGaWxlRXh0ZW5zaW9uXG4gICAgICBmbkV4dCA9IHBhcnNlZFNvdXJjZUZpbGUuZXh0XG4gICAgZWxzZVxuICAgICAgZm5FeHQgPSAgJy5qcydcblxuICAgIHNvdXJjZUZpbGVOYW1lID0gcGFyc2VkU291cmNlRmlsZS5uYW1lICArIGZuRXh0XG4gICAgbWFwRmlsZU5hbWUgPSBwYXJzZWRTb3VyY2VGaWxlLm5hbWUgICsgZm5FeHQgKyAnLm1hcCdcblxuICAgIGFic1RyYW5zcGlsZWRGaWxlID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKGFic1RyYW5zcGlsZVJvb3QsIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUgLCBzb3VyY2VGaWxlTmFtZSApKVxuICAgIGFic01hcEZpbGUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oYWJzTWFwc1Jvb3QsIHJlbFNvdXJjZVJvb3RUb1NvdXJjZUZpbGUsIG1hcEZpbGVOYW1lICkpXG5cbiAgICBzb3VyY2VGaWxlSW5Qcm9qZWN0OiBzb3VyY2VGaWxlSW5Qcm9qZWN0XG4gICAgc291cmNlRmlsZTogc291cmNlRmlsZVxuICAgIHNvdXJjZUZpbGVEaXI6IHBhcnNlZFNvdXJjZUZpbGUuZGlyXG4gICAgc291cmNlRmlsZU5hbWU6IHNvdXJjZUZpbGVOYW1lXG4gICAgbWFwRmlsZTogYWJzTWFwRmlsZVxuICAgIG1hcEZpbGVEaXI6IHBhdGgucGFyc2UoYWJzTWFwRmlsZSkuZGlyXG4gICAgbWFwRmlsZU5hbWU6IG1hcEZpbGVOYW1lXG4gICAgdHJhbnNwaWxlZEZpbGU6IGFic1RyYW5zcGlsZWRGaWxlXG4gICAgdHJhbnNwaWxlZEZpbGVEaXI6IHBhdGgucGFyc2UoYWJzVHJhbnNwaWxlZEZpbGUpLmRpclxuICAgIHNvdXJjZVJvb3Q6IGFic1NvdXJjZVJvb3RcbiAgICBwcm9qZWN0UGF0aDogYWJzUHJvamVjdFBhdGhcblxuIyBjaGVjayBmb3IgcHJlc2NlbmNlIG9mIGEgLmJhYmVscmMgZmlsZSBwYXRoIGZyb21EaXIgdG8gcm9vdFxuICBpc0JhYmVscmNJblBhdGg6IChmcm9tRGlyKSAtPlxuICAgICMgZW52aXJvbW5lbnRzIHVzZWQgaW4gYmFiZWxyY1xuICAgIGJhYmVscmMgPSBbXG4gICAgICAnLmJhYmVscmMnXG4gICAgICAnLmJhYmVscmMuanMnICMgQmFiZWwgNy4wIGFuZCBuZXdlclxuICAgIF1cbiAgICBiYWJlbHJjRmlsZXMgPSBiYWJlbHJjLm1hcCAoZmlsZSkgLT4gcGF0aC5qb2luKGZyb21EaXIsIGZpbGUpXG5cbiAgICBpZiBiYWJlbHJjRmlsZXMuc29tZSBmcy5leGlzdHNTeW5jXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGlmIGZyb21EaXIgIT0gcGF0aC5kaXJuYW1lKGZyb21EaXIpXG4gICAgICByZXR1cm4gQGlzQmFiZWxyY0luUGF0aCBwYXRoLmRpcm5hbWUoZnJvbURpcilcbiAgICBlbHNlIHJldHVybiBmYWxzZVxuXG4jIHNpbXBsZSBtZXJnZSBvZiBvYmplY3RzXG4gIG1lcmdlOiAodGFyZ2V0T2JqLCBzb3VyY2VPYmopIC0+XG4gICAgZm9yIHByb3AsIHZhbCBvZiBzb3VyY2VPYmpcbiAgICAgIHRhcmdldE9ialtwcm9wXSA9IHZhbFxuXG4jIHN0b3AgdHJhbnNwaWxlciB0YXNrXG4gIHN0b3BUcmFuc3BpbGVyVGFzazogKHByb2plY3RQYXRoKSAtPlxuICAgIG1zZ09iamVjdCA9XG4gICAgICBjb21tYW5kOiAnc3RvcCdcbiAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcHJvamVjdFBhdGhdLnNlbmQobXNnT2JqZWN0KVxuXG4jIHN0b3AgYWxsIHRyYW5zcGlsZXIgdGFza3NcbiAgc3RvcEFsbFRyYW5zcGlsZXJUYXNrOiAoKSAtPlxuICAgIGZvciBwcm9qZWN0UGF0aCwgdiBvZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NcbiAgICAgIEBzdG9wVHJhbnNwaWxlclRhc2socHJvamVjdFBhdGgpXG5cbiMgc3RvcCB1bnN1ZWQgdHJhbnNwaWxlciB0YXNrcyBpZiBpdHMgcGF0aCBpc24ndCBwcmVzZW50IGluIGEgY3VycmVudFxuIyBBdG9tIHByb2plY3QgZm9sZGVyXG4gIHN0b3BVbnVzZWRUYXNrczogKCkgLT5cbiAgICBhdG9tUHJvamVjdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICBmb3IgcHJvamVjdFRhc2tQYXRoLHYgb2YgQGJhYmVsVHJhbnNwaWxlclRhc2tzXG4gICAgICBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0ID0gZmFsc2VcbiAgICAgIGZvciBhdG9tUHJvamVjdFBhdGggaW4gYXRvbVByb2plY3RQYXRoc1xuICAgICAgICBpZiBwYXRoSXNJbnNpZGUocHJvamVjdFRhc2tQYXRoLCBhdG9tUHJvamVjdFBhdGgpXG4gICAgICAgICAgaXNUYXNrSW5DdXJyZW50UHJvamVjdCA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgaWYgbm90IGlzVGFza0luQ3VycmVudFByb2plY3QgdGhlbiBAc3RvcFRyYW5zcGlsZXJUYXNrKHByb2plY3RUYXNrUGF0aClcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc3BpbGVyXG4iXX0=
