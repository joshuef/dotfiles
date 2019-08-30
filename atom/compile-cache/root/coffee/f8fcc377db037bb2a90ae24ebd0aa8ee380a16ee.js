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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvdHJhbnNwaWxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxlQUFELEVBQU87O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxZQUFBLEdBQWUsT0FBQSxDQUFRLGdDQUFSOztFQUdmLG1CQUFBLEdBQXNCO0lBQ3BCLElBQUEsRUFBTSxRQURjO0lBRXBCLFVBQUEsRUFBWTtNQUNWLGFBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUR4QjtNQUVWLGVBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQUZ4QjtNQUdWLGVBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sUUFBUjtPQUh4QjtNQUlWLGtCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFFBQVI7T0FKeEI7TUFLVixTQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FMeEI7TUFNVix1QkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BTnhCO01BT1Ysb0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVB4QjtNQVFWLDhCQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FSeEI7TUFTVixXQUFBLEVBQWtDO1FBQUUsSUFBQSxFQUFNLFNBQVI7T0FUeEI7TUFVViwwQkFBQSxFQUFrQztRQUFFLElBQUEsRUFBTSxTQUFSO09BVnhCO01BV1YsK0JBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVh4QjtNQVlWLGVBQUEsRUFBa0M7UUFBRSxJQUFBLEVBQU0sU0FBUjtPQVp4QjtLQUZRO0lBZ0JwQixvQkFBQSxF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ekIsYUFBQSxrREFBQTs7VUFDRSxJQUFHLFlBQUEsQ0FBYSxlQUFiLEVBQThCLGVBQTlCLENBQUg7WUFDRSxzQkFBQSxHQUF5QjtBQUN6QixrQkFGRjs7QUFERjtRQUlBLElBQUcsQ0FBSSxzQkFBUDt1QkFBbUMsSUFBQyxDQUFBLGtCQUFELENBQW9CLGVBQXBCLEdBQW5DO1NBQUEsTUFBQTsrQkFBQTs7QUFORjs7SUFGZTs7Ozs7O0VBVW5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBdGFqQiIsInNvdXJjZXNDb250ZW50IjpbIntUYXNrLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gPSByZXF1aXJlICdhdG9tJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5wYXRoSXNJbnNpZGUgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvcGF0aC1pcy1pbnNpZGUnXG5cbiMgc2V0dXAgSlNPTiBTY2hlbWEgdG8gcGFyc2UgLmxhbmd1YWdlYmFiZWwgY29uZmlnc1xubGFuZ3VhZ2ViYWJlbFNjaGVtYSA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHByb3BlcnRpZXM6IHtcbiAgICBiYWJlbE1hcHNQYXRoOiAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGJhYmVsTWFwc0FkZFVybDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgIGJhYmVsU291cmNlUGF0aDogICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgYmFiZWxUcmFuc3BpbGVQYXRoOiAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBjcmVhdGVNYXA6ICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUYXJnZXREaXJlY3RvcmllczogICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBjcmVhdGVUcmFuc3BpbGVkQ29kZTogICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBkaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGg6ICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBwcm9qZWN0Um9vdDogICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlczogICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICBzdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzOiAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICB0cmFuc3BpbGVPblNhdmU6ICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfVxuICB9LFxuICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2Vcbn1cblxuY2xhc3MgVHJhbnNwaWxlclxuXG4gIGZyb21HcmFtbWFyTmFtZTogJ0JhYmVsIEVTNiBKYXZhU2NyaXB0J1xuICBmcm9tU2NvcGVOYW1lOiAnc291cmNlLmpzLmpzeCdcbiAgdG9TY29wZU5hbWU6ICdzb3VyY2UuanMuanN4J1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZXFJZCA9IDBcbiAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3MgPSB7fVxuICAgIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCA9IHJlcXVpcmUucmVzb2x2ZSAnLi90cmFuc3BpbGVyLXRhc2snXG4gICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9ucyA9IHt9XG4gICAgQGRlcHJlY2F0ZUNvbmZpZygpXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGlmIEBnZXRDb25maWcoKS50cmFuc3BpbGVPblNhdmUgb3IgQGdldENvbmZpZygpLmFsbG93TG9jYWxPdmVycmlkZVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbnRleHRNZW51LmFkZCB7XG4gICAgICAgICcudHJlZS12aWV3IC5kaXJlY3RvcnkgPiAuaGVhZGVyID4gLm5hbWUnOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTGFuZ3VhZ2UtQmFiZWwnXG4gICAgICAgICAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3J5ICcsIGNvbW1hbmQ6ICdsYW5ndWFnZS1iYWJlbDp0cmFuc3BpbGUtZGlyZWN0b3J5J31cbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdUcmFuc3BpbGUgRGlyZWN0b3JpZXMnLCBjb21tYW5kOiAnbGFuZ3VhZ2UtYmFiZWw6dHJhbnNwaWxlLWRpcmVjdG9yaWVzJ31cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeyd0eXBlJzogJ3NlcGFyYXRvcicgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcnknLCBAY29tbWFuZFRyYW5zcGlsZURpcmVjdG9yeVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZGlyZWN0b3J5ID4gLmhlYWRlciA+IC5uYW1lJywgJ2xhbmd1YWdlLWJhYmVsOnRyYW5zcGlsZS1kaXJlY3RvcmllcycsIEBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3JpZXNcblxuICAjIG1ldGhvZCB1c2VkIGJ5IHNvdXJjZS1wcmV2aWV3IHRvIHNlZSB0cmFuc3BpbGVkIGNvZGVcbiAgdHJhbnNmb3JtOiAoY29kZSwge2ZpbGVQYXRoLCBzb3VyY2VNYXB9KSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBmaWxlUGF0aCwgY29uZmlnXG4gICAgIyBjcmVhdGUgYmFiZWwgdHJhbnNmb3JtZXIgdGFza3MgLSBvbmUgcGVyIHByb2plY3QgYXMgbmVlZGVkXG4gICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG4gICAgYmFiZWxPcHRpb25zID1cbiAgICAgIGZpbGVuYW1lOiBmaWxlUGF0aFxuICAgICAgYXN0OiBmYWxzZVxuICAgIGlmIHNvdXJjZU1hcCB0aGVuIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzID0gc291cmNlTWFwXG4gICAgIyBvayBub3cgdHJhbnNwaWxlIGluIHRoZSB0YXNrIGFuZCB3YWl0IG9uIHRoZSByZXN1bHRcbiAgICBpZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgcmVxSWQgPSBAcmVxSWQrK1xuICAgICAgbXNnT2JqZWN0ID1cbiAgICAgICAgcmVxSWQ6IHJlcUlkXG4gICAgICAgIGNvbW1hbmQ6ICd0cmFuc3BpbGVDb2RlJ1xuICAgICAgICBwYXRoVG86IHBhdGhUb1xuICAgICAgICBjb2RlOiBjb2RlXG4gICAgICAgIGJhYmVsT3B0aW9uczogYmFiZWxPcHRpb25zXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0ICkgPT5cbiAgICAgICMgdHJhbnNwaWxlIGluIHRhc2tcbiAgICAgIHRyeVxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgICAgcmVqZWN0KFwiRXJyb3IgI3tlcnJ9IHNlbmRpbmcgdG8gdHJhbnNwaWxlIHRhc2sgd2l0aCBQSUQgI3tAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5jaGlsZFByb2Nlc3MucGlkfVwiKVxuICAgICAgIyBnZXQgcmVzdWx0IGZyb20gdGFzayBmb3IgdGhpcyByZXFJZFxuICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0ub25jZSBcInRyYW5zcGlsZToje3JlcUlkfVwiLCAobXNnUmV0KSA9PlxuICAgICAgICBpZiBtc2dSZXQuZXJyP1xuICAgICAgICAgIHJlamVjdChcIkJhYmVsIHYje21zZ1JldC5iYWJlbFZlcnNpb259XFxuI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuI3ttc2dSZXQuYmFiZWxDb3JlVXNlZH1cIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG1zZ1JldC5zb3VyY2VNYXAgPSBtc2dSZXQubWFwXG4gICAgICAgICAgcmVzb2x2ZShtc2dSZXQpXG5cbiAgIyBjYWxsZWQgYnkgY29tbWFuZFxuICBjb21tYW5kVHJhbnNwaWxlRGlyZWN0b3J5OiAoe3RhcmdldH0pID0+XG4gICAgQHRyYW5zcGlsZURpcmVjdG9yeSB7ZGlyZWN0b3J5OiB0YXJnZXQuZGF0YXNldC5wYXRoIH1cblxuICAjIGNhbGxlZCBieSBjb21tYW5kXG4gIGNvbW1hbmRUcmFuc3BpbGVEaXJlY3RvcmllczogKHt0YXJnZXR9KSA9PlxuICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogdGFyZ2V0LmRhdGFzZXQucGF0aCwgcmVjdXJzaXZlOiB0cnVlfVxuXG4gICMgdHJhbnNwaWxlIGFsbCBmaWxlcyBpbiBhIGRpcmVjdG9yeSBvciByZWN1cnNpdmUgZGlyZWN0b3JpZXNcbiAgIyBvcHRpb25zIGFyZSB7IGRpcmVjdG9yeTogbmFtZSwgcmVjdXJzaXZlOiB0cnVlfGZhbHNlfVxuICB0cmFuc3BpbGVEaXJlY3Rvcnk6IChvcHRpb25zKSAtPlxuICAgIGRpcmVjdG9yeSA9IG9wdGlvbnMuZGlyZWN0b3J5XG4gICAgcmVjdXJzaXZlID0gb3B0aW9ucy5yZWN1cnNpdmUgb3IgZmFsc2VcbiAgICBmcy5yZWFkZGlyIGRpcmVjdG9yeSwgKGVycixmaWxlcykgPT5cbiAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgIGZpbGVzLm1hcCAoZmlsZSkgPT5cbiAgICAgICAgICBmcUZpbGVOYW1lID0gcGF0aC5qb2luKGRpcmVjdG9yeSwgZmlsZSlcbiAgICAgICAgICBmcy5zdGF0IGZxRmlsZU5hbWUsIChlcnIsIHN0YXRzKSA9PlxuICAgICAgICAgICAgaWYgbm90IGVycj9cbiAgICAgICAgICAgICAgaWYgc3RhdHMuaXNGaWxlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgL1xcLm1pblxcLlthLXpdKyQvLnRlc3QgZnFGaWxlTmFtZSAjIG5vIG1pbmltaXplZCBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIC9cXC4oanN8anN4fGVzfGVzNnxiYWJlbCkkLy50ZXN0IGZxRmlsZU5hbWUgIyBvbmx5IGpzXG4gICAgICAgICAgICAgICAgICBAdHJhbnNwaWxlIGZpbGUsIG51bGwsIEBnZXRDb25maWdBbmRQYXRoVG8gZnFGaWxlTmFtZVxuICAgICAgICAgICAgICBlbHNlIGlmIHJlY3Vyc2l2ZSBhbmQgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgICAgIEB0cmFuc3BpbGVEaXJlY3Rvcnkge2RpcmVjdG9yeTogZnFGaWxlTmFtZSwgcmVjdXJzaXZlOiB0cnVlfVxuXG4gICMgdHJhbnNwaWxlIHNvdXJjZUZpbGUgZWRpdGVkIGJ5IHRoZSBvcHRpb25hbCB0ZXh0RWRpdG9yXG4gIHRyYW5zcGlsZTogKHNvdXJjZUZpbGUsIHRleHRFZGl0b3IsIGNvbmZpZ0FuZFBhdGhUbykgLT5cbiAgICAjIGdldCBjb25maWdcbiAgICBpZiBjb25maWdBbmRQYXRoVG8/XG4gICAgICB7IGNvbmZpZywgcGF0aFRvIH0gPSBjb25maWdBbmRQYXRoVG9cbiAgICBlbHNlXG4gICAgICB7Y29uZmlnLCBwYXRoVG8gfSA9IEBnZXRDb25maWdBbmRQYXRoVG8oc291cmNlRmlsZSlcblxuICAgIHJldHVybiBpZiBjb25maWcudHJhbnNwaWxlT25TYXZlIGlzbnQgdHJ1ZVxuXG4gICAgaWYgY29uZmlnLmRpc2FibGVXaGVuTm9CYWJlbHJjRmlsZUluUGF0aFxuICAgICAgaWYgbm90IEBpc0JhYmVscmNJblBhdGggcGF0aFRvLnNvdXJjZUZpbGVEaXJcbiAgICAgICAgcmV0dXJuXG5cbiAgICBpZiBub3QgcGF0aElzSW5zaWRlKHBhdGhUby5zb3VyY2VGaWxlLCBwYXRoVG8uc291cmNlUm9vdClcbiAgICAgIGlmIG5vdCBjb25maWcuc3VwcHJlc3NTb3VyY2VQYXRoTWVzc2FnZXNcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgJ0xCOiBCYWJlbCBmaWxlIGlzIG5vdCBpbnNpZGUgdGhlIFwiQmFiZWwgU291cmNlIFBhdGhcIiBkaXJlY3RvcnkuJyxcbiAgICAgICAgICBkaXNtaXNzYWJsZTogZmFsc2VcbiAgICAgICAgICBkZXRhaWw6IFwiTm8gdHJhbnNwaWxlZCBjb2RlIG91dHB1dCBmb3IgZmlsZSBcXG4je3BhdGhUby5zb3VyY2VGaWxlfVxuICAgICAgICAgICAgXFxuXFxuVG8gc3VwcHJlc3MgdGhlc2UgJ2ludmFsaWQgc291cmNlIHBhdGgnXG4gICAgICAgICAgICBtZXNzYWdlcyB1c2UgbGFuZ3VhZ2UtYmFiZWwgcGFja2FnZSBzZXR0aW5nc1wiXG4gICAgICByZXR1cm5cblxuICAgIGJhYmVsT3B0aW9ucyA9IEBnZXRCYWJlbE9wdGlvbnMgY29uZmlnXG5cbiAgICBAY2xlYW5Ob3RpZmljYXRpb25zKHBhdGhUbylcblxuICAgICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICAgIEBjcmVhdGVUYXNrIHBhdGhUby5wcm9qZWN0UGF0aFxuXG4gICAgIyBvayBub3cgdHJhbnNwaWxlIGluIHRoZSB0YXNrIGFuZCB3YWl0IG9uIHRoZSByZXN1bHRcbiAgICBpZiBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXVxuICAgICAgcmVxSWQgPSBAcmVxSWQrK1xuICAgICAgbXNnT2JqZWN0ID1cbiAgICAgICAgcmVxSWQ6IHJlcUlkXG4gICAgICAgIGNvbW1hbmQ6ICd0cmFuc3BpbGUnXG4gICAgICAgIHBhdGhUbzogcGF0aFRvXG4gICAgICAgIGJhYmVsT3B0aW9uczogYmFiZWxPcHRpb25zXG5cbiAgICAgICMgdHJhbnNwaWxlIGluIHRhc2tcbiAgICAgIHRyeVxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBjb25zb2xlLmxvZyBcIkVycm9yICN7ZXJyfSBzZW5kaW5nIHRvIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIlxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF1cbiAgICAgICAgQGNyZWF0ZVRhc2sgcGF0aFRvLnByb2plY3RQYXRoXG4gICAgICAgIGNvbnNvbGUubG9nIFwiUmVzdGFydGVkIHRyYW5zcGlsZSB0YXNrIHdpdGggUElEICN7QGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0uY2hpbGRQcm9jZXNzLnBpZH1cIlxuICAgICAgICBAYmFiZWxUcmFuc3BpbGVyVGFza3NbcGF0aFRvLnByb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcblxuICAgICAgIyBnZXQgcmVzdWx0IGZyb20gdGFzayBmb3IgdGhpcyByZXFJZFxuICAgICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3BhdGhUby5wcm9qZWN0UGF0aF0ub25jZSBcInRyYW5zcGlsZToje3JlcUlkfVwiLCAobXNnUmV0KSA9PlxuICAgICAgICAjIC5pZ25vcmVkIGlzIHJldHVybmVkIHdoZW4gLmJhYmVscmMgaWdub3JlL29ubHkgZmxhZ3MgYXJlIHVzZWRcbiAgICAgICAgaWYgbXNnUmV0LnJlc3VsdD8uaWdub3JlZCB0aGVuIHJldHVyblxuICAgICAgICBpZiBtc2dSZXQuZXJyXG4gICAgICAgICAgaWYgbXNnUmV0LmVyci5zdGFja1xuICAgICAgICAgICAgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0gPVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogQmFiZWwgVHJhbnNwaWxlciBFcnJvclwiLFxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bXNnUmV0LmVyci5tZXNzYWdlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVxcbiBcXG4je21zZ1JldC5lcnIuc3RhY2t9XCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXSA9XG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkxCOiBCYWJlbCB2I3ttc2dSZXQuYmFiZWxWZXJzaW9ufSBUcmFuc3BpbGVyIEVycm9yXCIsXG4gICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiI3ttc2dSZXQuZXJyLm1lc3NhZ2V9XFxuIFxcbiN7bXNnUmV0LmJhYmVsQ29yZVVzZWR9XFxuIFxcbiN7bXNnUmV0LmVyci5jb2RlRnJhbWV9XCJcbiAgICAgICAgICAgICMgaWYgd2UgaGF2ZSBhIGxpbmUvY29sIHN5bnRheCBlcnJvciBqdW1wIHRvIHRoZSBwb3NpdGlvblxuICAgICAgICAgICAgaWYgbXNnUmV0LmVyci5sb2M/LmxpbmU/IGFuZCB0ZXh0RWRpdG9yPy5hbGl2ZVxuICAgICAgICAgICAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFttc2dSZXQuZXJyLmxvYy5saW5lLTEsIG1zZ1JldC5lcnIubG9jLmNvbHVtbl1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIG5vdCBjb25maWcuc3VwcHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlc1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJMQjogQmFiZWwgdiN7bXNnUmV0LmJhYmVsVmVyc2lvbn0gVHJhbnNwaWxlciBTdWNjZXNzXCIsXG4gICAgICAgICAgICAgIGRldGFpbDogXCIje3BhdGhUby5zb3VyY2VGaWxlfVxcbiBcXG4je21zZ1JldC5iYWJlbENvcmVVc2VkfVwiXG5cbiAgICAgICAgICBpZiBub3QgY29uZmlnLmNyZWF0ZVRyYW5zcGlsZWRDb2RlXG4gICAgICAgICAgICBpZiBub3QgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXNcbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gJ0xCOiBObyB0cmFuc3BpbGVkIG91dHB1dCBjb25maWd1cmVkJ1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgaWYgcGF0aFRvLnNvdXJjZUZpbGUgaXMgcGF0aFRvLnRyYW5zcGlsZWRGaWxlXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyAnTEI6IFRyYW5zcGlsZWQgZmlsZSB3b3VsZCBvdmVyd3JpdGUgc291cmNlIGZpbGUuIEFib3J0ZWQhJyxcbiAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgZGV0YWlsOiBwYXRoVG8uc291cmNlRmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAjIHdyaXRlIGNvZGUgYW5kIG1hcHNcbiAgICAgICAgICBpZiBjb25maWcuY3JlYXRlVGFyZ2V0RGlyZWN0b3JpZXNcbiAgICAgICAgICAgIGZzLm1ha2VUcmVlU3luYyggcGF0aC5wYXJzZSggcGF0aFRvLnRyYW5zcGlsZWRGaWxlKS5kaXIpXG5cbiAgICAgICAgICAjIGFkZCBzb3VyY2UgbWFwIHVybCB0byBjb2RlIGlmIGZpbGUgaXNuJ3QgaWdub3JlZFxuICAgICAgICAgIGlmIGNvbmZpZy5iYWJlbE1hcHNBZGRVcmxcbiAgICAgICAgICAgIG1zZ1JldC5yZXN1bHQuY29kZSA9IG1zZ1JldC5yZXN1bHQuY29kZSArICdcXG4nICsgJy8vIyBzb3VyY2VNYXBwaW5nVVJMPScrcGF0aFRvLm1hcEZpbGVcblxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgcGF0aFRvLnRyYW5zcGlsZWRGaWxlLCBtc2dSZXQucmVzdWx0LmNvZGVcblxuICAgICAgICAgICMgd3JpdGUgc291cmNlIG1hcCBpZiByZXR1cm5lZCBhbmQgaWYgYXNrZWRcbiAgICAgICAgICBpZiBjb25maWcuY3JlYXRlTWFwIGFuZCBtc2dSZXQucmVzdWx0Lm1hcD8udmVyc2lvblxuICAgICAgICAgICAgaWYgY29uZmlnLmNyZWF0ZVRhcmdldERpcmVjdG9yaWVzXG4gICAgICAgICAgICAgIGZzLm1ha2VUcmVlU3luYyhwYXRoLnBhcnNlKHBhdGhUby5tYXBGaWxlKS5kaXIpXG4gICAgICAgICAgICBtYXBKc29uID1cbiAgICAgICAgICAgICAgdmVyc2lvbjogbXNnUmV0LnJlc3VsdC5tYXAudmVyc2lvblxuICAgICAgICAgICAgICBzb3VyY2VzOiAgcGF0aFRvLnNvdXJjZUZpbGVcbiAgICAgICAgICAgICAgZmlsZTogcGF0aFRvLnRyYW5zcGlsZWRGaWxlXG4gICAgICAgICAgICAgIHNvdXJjZVJvb3Q6ICcnXG4gICAgICAgICAgICAgIG5hbWVzOiBtc2dSZXQucmVzdWx0Lm1hcC5uYW1lc1xuICAgICAgICAgICAgICBtYXBwaW5nczogbXNnUmV0LnJlc3VsdC5tYXAubWFwcGluZ3NcbiAgICAgICAgICAgIHhzc2lQcm90ZWN0aW9uID0gJyldfVxcbidcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgcGF0aFRvLm1hcEZpbGUsXG4gICAgICAgICAgICAgIHhzc2lQcm90ZWN0aW9uICsgSlNPTi5zdHJpbmdpZnkgbWFwSnNvbiwgbnVsbCwgJyAnXG5cbiAgIyBjbGVhbiBub3RpZmljYXRpb24gbWVzc2FnZXNcbiAgY2xlYW5Ob3RpZmljYXRpb25zOiAocGF0aFRvKSAtPlxuICAgICMgYXV0byBkaXNtaXNzIHByZXZpb3VzIHRyYW5zcGlsZSBlcnJvciBub3RpZmljYXRpb25zIGZvciB0aGlzIHNvdXJjZSBmaWxlXG4gICAgaWYgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1twYXRoVG8uc291cmNlRmlsZV0/XG4gICAgICBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXS5kaXNtaXNzKClcbiAgICAgIGRlbGV0ZSBAdHJhbnNwaWxlRXJyb3JOb3RpZmljYXRpb25zW3BhdGhUby5zb3VyY2VGaWxlXVxuICAgICMgcmVtb3ZlIGFueSB1c2VyIGRpc21pc3NlZCBub3RpZmljYXRpb24gb2JqZWN0IHJlZmVyZW5jZXNcbiAgICBmb3Igc2YsIG4gb2YgQHRyYW5zcGlsZUVycm9yTm90aWZpY2F0aW9uc1xuICAgICAgaWYgbi5kaXNtaXNzZWRcbiAgICAgICAgZGVsZXRlIEB0cmFuc3BpbGVFcnJvck5vdGlmaWNhdGlvbnNbc2ZdXG4gICAgIyBGSVggZm9yIGF0b20gbm90aWZpY2F0aW9ucy4gZGlzbWlzc2VkIG5vZnRpZmljYXRpb25zIHZpYSB3aGF0ZXZlciBtZWFuc1xuICAgICMgYXJlIG5ldmVyIGFjdHVhbGx5IHJlbW92ZWQgZnJvbSBtZW1vcnkuIEkgY29uc2lkZXIgdGhpcyBhIG1lbW9yeSBsZWFrXG4gICAgIyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvODYxNCBzbyByZW1vdmUgYW55IGRpc21pc3NlZFxuICAgICMgbm90aWZpY2F0aW9uIG9iamVjdHMgcHJlZml4ZWQgd2l0aCBhIG1lc3NhZ2UgcHJlZml4IG9mIExCOiBmcm9tIG1lbW9yeVxuICAgIGkgPSBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5sZW5ndGggLSAxXG4gICAgd2hpbGUgaSA+PSAwXG4gICAgICBpZiBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5kaXNtaXNzZWQgYW5kXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1tpXS5tZXNzYWdlLnN1YnN0cmluZygwLDMpIGlzIFwiTEI6XCJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMuc3BsaWNlIGksIDFcbiAgICAgIGktLVxuXG4gICMgY3JlYXRlIGJhYmVsIHRyYW5zZm9ybWVyIHRhc2tzIC0gb25lIHBlciBwcm9qZWN0IGFzIG5lZWRlZFxuICBjcmVhdGVUYXNrOiAocHJvamVjdFBhdGgpIC0+XG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXSA/PVxuICAgICAgVGFzay5vbmNlIEBiYWJlbFRyYW5zZm9ybWVyUGF0aCwgcHJvamVjdFBhdGgsID0+XG4gICAgICAgICMgdGFzayBlbmRlZFxuICAgICAgICBkZWxldGUgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXVxuXG4gICMgbW9kaWZpZXMgY29uZmlnIG9wdGlvbnMgZm9yIGNoYW5nZWQgb3IgZGVwcmVjYXRlZCBjb25maWdzXG4gIGRlcHJlY2F0ZUNvbmZpZzogLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1RyYW5zcGlsZU9uU2F2ZU1lc3NhZ2VzJyxcbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbC5zdXByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMnKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpP1xuICAgICAgYXRvbS5jb25maWcuc2V0ICdsYW5ndWFnZS1iYWJlbC5zdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycsXG4gICAgICAgIGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwuc3VwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NUcmFuc3BpbGVPblNhdmVNZXNzYWdlcycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnN1cHJlc3NTb3VyY2VQYXRoTWVzc2FnZXMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC51c2VJbnRlcm5hbFNjYW5uZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5zdG9wQXRQcm9qZWN0RGlyZWN0b3J5JylcbiAgICAjIHJlbW92ZSBiYWJlbCBWNSBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmJhYmVsU3RhZ2UnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5leHRlcm5hbEhlbHBlcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5tb2R1bGVMb2FkZXInKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5ibGFja2xpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC53aGl0ZWxpc3RUcmFuc2Zvcm1lcnMnKVxuICAgIGF0b20uY29uZmlnLnVuc2V0KCdsYW5ndWFnZS1iYWJlbC5sb29zZVRyYW5zZm9ybWVycycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLm9wdGlvbmFsVHJhbnNmb3JtZXJzJylcbiAgICBhdG9tLmNvbmZpZy51bnNldCgnbGFuZ3VhZ2UtYmFiZWwucGx1Z2lucycpXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLnByZXNldHMnKVxuICAgICMgcmVtb3ZlIG9sZCBuYW1lIGluZGVudCBvcHRpb25zXG4gICAgYXRvbS5jb25maWcudW5zZXQoJ2xhbmd1YWdlLWJhYmVsLmZvcm1hdEpTWCcpXG5cbiAgIyBjYWxjdWxhdGUgYmFiZWwgb3B0aW9ucyBiYXNlZCB1cG9uIHBhY2thZ2UgY29uZmlnLCBiYWJlbHJjIGZpbGVzIGFuZFxuICAjIHdoZXRoZXIgaW50ZXJuYWxTY2FubmVyIGlzIHVzZWQuXG4gIGdldEJhYmVsT3B0aW9uczogKGNvbmZpZyktPlxuICAgICMgc2V0IHRyYW5zcGlsZXIgb3B0aW9ucyBmcm9tIHBhY2thZ2UgY29uZmlndXJhdGlvbi5cbiAgICBiYWJlbE9wdGlvbnMgPVxuICAgICAgY29kZTogdHJ1ZVxuICAgIGlmIGNvbmZpZy5jcmVhdGVNYXAgIHRoZW4gYmFiZWxPcHRpb25zLnNvdXJjZU1hcHMgPSBjb25maWcuY3JlYXRlTWFwXG4gICAgYmFiZWxPcHRpb25zXG5cbiAgI2dldCBjb25maWd1cmF0aW9uIGFuZCBwYXRoc1xuICBnZXRDb25maWdBbmRQYXRoVG86IChzb3VyY2VGaWxlKSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcblxuICAgIGlmIGNvbmZpZy5hbGxvd0xvY2FsT3ZlcnJpZGVcbiAgICAgIGlmIG5vdCBAanNvblNjaGVtYT9cbiAgICAgICAgQGpzb25TY2hlbWEgPSAocmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL2pqdicpKCkgIyB1c2Ugamp2IGFzIGl0IHJ1bnMgd2l0aG91dCBDU1AgaXNzdWVzXG4gICAgICAgIEBqc29uU2NoZW1hLmFkZFNjaGVtYSAnbG9jYWxDb25maWcnLCBsYW5ndWFnZWJhYmVsU2NoZW1hXG4gICAgICBsb2NhbENvbmZpZyA9IEBnZXRMb2NhbENvbmZpZyBwYXRoVG8uc291cmNlRmlsZURpciwgcGF0aFRvLnByb2plY3RQYXRoLCB7fVxuICAgICAgIyBtZXJnZSBsb2NhbCBjb25maWdzIHdpdGggZ2xvYmFsLiBsb2NhbCB3aW5zXG4gICAgICBAbWVyZ2UgY29uZmlnLCBsb2NhbENvbmZpZ1xuICAgICAgIyByZWNhbGMgcGF0aHNcbiAgICAgIHBhdGhUbyA9IEBnZXRQYXRocyBzb3VyY2VGaWxlLCBjb25maWdcbiAgICByZXR1cm4geyBjb25maWcsIHBhdGhUbyB9XG5cbiAgIyBnZXQgZ2xvYmFsIGNvbmZpZ3VyYXRpb24gZm9yIGxhbmd1YWdlLWJhYmVsXG4gIGdldENvbmZpZzogLT4gYXRvbS5jb25maWcuZ2V0KCdsYW5ndWFnZS1iYWJlbCcpXG5cbiMgY2hlY2sgZm9yIHByZXNjZW5jZSBvZiBhIC5sYW5ndWFnZWJhYmVsIGZpbGUgcGF0aCBmcm9tRGlyIHRvRGlyXG4jIHJlYWQsIHZhbGlkYXRlIGFuZCBvdmVyd3JpdGUgY29uZmlnIGFzIHJlcXVpcmVkXG4jIHRvRGlyIGlzIG5vcm1hbGx5IHRoZSBpbXBsaWNpdCBBdG9tIHByb2plY3QgZm9sZGVycyByb290IGJ1dCB3ZVxuIyB3aWxsIHN0b3Agb2YgYSBwcm9qZWN0Um9vdCB0cnVlIGlzIGZvdW5kIGFzIHdlbGxcbiAgZ2V0TG9jYWxDb25maWc6IChmcm9tRGlyLCB0b0RpciwgbG9jYWxDb25maWcpIC0+XG4gICAgIyBnZXQgbG9jYWwgcGF0aCBvdmVyaWRlc1xuICAgIGxvY2FsQ29uZmlnRmlsZSA9ICcubGFuZ3VhZ2ViYWJlbCdcbiAgICBsYW5ndWFnZUJhYmVsQ2ZnRmlsZSA9IHBhdGguam9pbiBmcm9tRGlyLCBsb2NhbENvbmZpZ0ZpbGVcbiAgICBpZiBmcy5leGlzdHNTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlXG4gICAgICBmaWxlQ29udGVudD0gZnMucmVhZEZpbGVTeW5jIGxhbmd1YWdlQmFiZWxDZmdGaWxlLCAndXRmOCdcbiAgICAgIHRyeVxuICAgICAgICBqc29uQ29udGVudCA9IEpTT04ucGFyc2UgZmlsZUNvbnRlbnRcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9ICN7ZXJyLm1lc3NhZ2V9XCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiRmlsZSA9ICN7bGFuZ3VhZ2VCYWJlbENmZ0ZpbGV9XFxuXFxuI3tmaWxlQ29udGVudH1cIlxuICAgICAgICByZXR1cm5cblxuICAgICAgc2NoZW1hRXJyb3JzID0gQGpzb25TY2hlbWEudmFsaWRhdGUgJ2xvY2FsQ29uZmlnJywganNvbkNvbnRlbnRcbiAgICAgIGlmIHNjaGVtYUVycm9yc1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogI3tsb2NhbENvbmZpZ0ZpbGV9IGNvbmZpZ3VyYXRpb24gZXJyb3JcIixcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIGRldGFpbDogXCJGaWxlID0gI3tsYW5ndWFnZUJhYmVsQ2ZnRmlsZX1cXG5cXG4je2ZpbGVDb250ZW50fVwiXG4gICAgICBlbHNlXG4gICAgICAgICMgbWVyZ2UgbG9jYWwgY29uZmlnLiBjb25maWcgY2xvc2VzdCBzb3VyY2VGaWxlIHdpbnNcbiAgICAgICAgIyBhcGFydCBmcm9tIHByb2plY3RSb290IHdoaWNoIHdpbnMgb24gdHJ1ZVxuICAgICAgICBpc1Byb2plY3RSb290ID0ganNvbkNvbnRlbnQucHJvamVjdFJvb3RcbiAgICAgICAgQG1lcmdlICBqc29uQ29udGVudCwgbG9jYWxDb25maWdcbiAgICAgICAgaWYgaXNQcm9qZWN0Um9vdCB0aGVuIGpzb25Db250ZW50LnByb2plY3RSb290RGlyID0gZnJvbURpclxuICAgICAgICBsb2NhbENvbmZpZyA9IGpzb25Db250ZW50XG4gICAgaWYgZnJvbURpciBpc250IHRvRGlyXG4gICAgICAjIHN0b3AgaW5maW5pdGUgcmVjdXJzaW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9nYW5kbS9sYW5ndWFnZS1iYWJlbC9pc3N1ZXMvNjZcbiAgICAgIGlmIGZyb21EaXIgPT0gcGF0aC5kaXJuYW1lKGZyb21EaXIpIHRoZW4gcmV0dXJuIGxvY2FsQ29uZmlnXG4gICAgICAjIGNoZWNrIHByb2plY3RSb290IHByb3BlcnR5IGFuZCBlbmQgcmVjdXJzaW9uIGlmIHRydWVcbiAgICAgIGlmIGlzUHJvamVjdFJvb3QgdGhlbiByZXR1cm4gbG9jYWxDb25maWdcbiAgICAgIHJldHVybiBAZ2V0TG9jYWxDb25maWcgcGF0aC5kaXJuYW1lKGZyb21EaXIpLCB0b0RpciwgbG9jYWxDb25maWdcbiAgICBlbHNlIHJldHVybiBsb2NhbENvbmZpZ1xuXG4gICMgY2FsY3VsYXRlIGFic291bHRlIHBhdGhzIG9mIGJhYmVsIHNvdXJjZSwgdGFyZ2V0IGpzIGFuZCBtYXBzIGZpbGVzXG4gICMgYmFzZWQgdXBvbiB0aGUgcHJvamVjdCBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgc291cmNlXG4gICMgYW5kIHRoZSByb290cyBvZiBzb3VyY2UsIHRyYW5zcGlsZSBwYXRoIGFuZCBtYXBzIHBhdGhzIGRlZmluZWQgaW4gY29uZmlnXG4gIGdldFBhdGhzOiAgKHNvdXJjZUZpbGUsIGNvbmZpZykgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBzb3VyY2VGaWxlXG4gICAgIyBJcyB0aGUgc291cmNlRmlsZSBsb2NhdGVkIGluc2lkZSBhbiBBdG9tIHByb2plY3QgZm9sZGVyP1xuICAgIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIHNvdXJjZUZpbGVJblByb2plY3QgPSBmYWxzZVxuICAgIGVsc2Ugc291cmNlRmlsZUluUHJvamVjdCA9IHRydWVcbiAgICAjIGRldGVybWluZXMgdGhlIHByb2plY3Qgcm9vdCBkaXIgZnJvbSAubGFuZ3VhZ2ViYWJlbCBvciBmcm9tIEF0b21cbiAgICAjIGlmIGEgcHJvamVjdCBpcyBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgYXRvbSBwYXNzZXMgYmFjayBhIG51bGwgZm9yXG4gICAgIyB0aGUgcHJvamVjdCBwYXRoIGlmIHRoZSBmaWxlIGlzbid0IGluIGEgcHJvamVjdCBmb2xkZXJcbiAgICAjIHNvIG1ha2UgdGhlIHJvb3QgZGlyIHRoYXQgc291cmNlIGZpbGUgdGhlIHByb2plY3RcbiAgICBpZiBjb25maWcucHJvamVjdFJvb3REaXI/XG4gICAgICBhYnNQcm9qZWN0UGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5wcm9qZWN0Um9vdERpcilcbiAgICBlbHNlIGlmIHByb2plY3RDb250YWluaW5nU291cmNlWzBdIGlzIG51bGxcbiAgICAgIGFic1Byb2plY3RQYXRoID0gcGF0aC5wYXJzZShzb3VyY2VGaWxlKS5yb290XG4gICAgZWxzZVxuICAgICAgIyBBdG9tIDEuOCByZXR1cm5pbmcgZHJpdmUgYXMgcHJvamVjdCByb290IG9uIHdpbmRvd3MgZS5nLiBjOiBub3QgYzpcXFxuICAgICAgIyB1c2luZyBwYXRoLmpvaW4gdG8gJy4nIGZpeGVzIGl0LlxuICAgICAgYWJzUHJvamVjdFBhdGggPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4ocHJvamVjdENvbnRhaW5pbmdTb3VyY2VbMF0sJy4nKSlcbiAgICByZWxTb3VyY2VQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsU291cmNlUGF0aClcbiAgICByZWxUcmFuc3BpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aClcbiAgICByZWxNYXBzUGF0aCA9IHBhdGgubm9ybWFsaXplKGNvbmZpZy5iYWJlbE1hcHNQYXRoKVxuXG4gICAgYWJzU291cmNlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFNvdXJjZVBhdGgpXG4gICAgYWJzVHJhbnNwaWxlUm9vdCA9IHBhdGguam9pbihhYnNQcm9qZWN0UGF0aCAsIHJlbFRyYW5zcGlsZVBhdGgpXG4gICAgYWJzTWFwc1Jvb3QgPSBwYXRoLmpvaW4oYWJzUHJvamVjdFBhdGggLCByZWxNYXBzUGF0aClcblxuICAgIHBhcnNlZFNvdXJjZUZpbGUgPSBwYXRoLnBhcnNlKHNvdXJjZUZpbGUpXG4gICAgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSA9IHBhdGgucmVsYXRpdmUoYWJzU291cmNlUm9vdCwgcGFyc2VkU291cmNlRmlsZS5kaXIpXG4gICAgYWJzVHJhbnNwaWxlZEZpbGUgPSBwYXRoLmpvaW4oYWJzVHJhbnNwaWxlUm9vdCwgcmVsU291cmNlUm9vdFRvU291cmNlRmlsZSAsIHBhcnNlZFNvdXJjZUZpbGUubmFtZSAgKyAnLmpzJylcbiAgICBhYnNNYXBGaWxlID0gcGF0aC5qb2luKGFic01hcHNSb290LCByZWxTb3VyY2VSb290VG9Tb3VyY2VGaWxlICwgcGFyc2VkU291cmNlRmlsZS5uYW1lICArICcuanMubWFwJylcblxuICAgIHNvdXJjZUZpbGVJblByb2plY3Q6IHNvdXJjZUZpbGVJblByb2plY3RcbiAgICBzb3VyY2VGaWxlOiBzb3VyY2VGaWxlXG4gICAgc291cmNlRmlsZURpcjogcGFyc2VkU291cmNlRmlsZS5kaXJcbiAgICBtYXBGaWxlOiBhYnNNYXBGaWxlXG4gICAgdHJhbnNwaWxlZEZpbGU6IGFic1RyYW5zcGlsZWRGaWxlXG4gICAgc291cmNlUm9vdDogYWJzU291cmNlUm9vdFxuICAgIHByb2plY3RQYXRoOiBhYnNQcm9qZWN0UGF0aFxuXG4jIGNoZWNrIGZvciBwcmVzY2VuY2Ugb2YgYSAuYmFiZWxyYyBmaWxlIHBhdGggZnJvbURpciB0byByb290XG4gIGlzQmFiZWxyY0luUGF0aDogKGZyb21EaXIpIC0+XG4gICAgIyBlbnZpcm9tbmVudHMgdXNlZCBpbiBiYWJlbHJjXG4gICAgYmFiZWxyYyA9ICcuYmFiZWxyYydcbiAgICBiYWJlbHJjRmlsZSA9IHBhdGguam9pbiBmcm9tRGlyLCBiYWJlbHJjXG4gICAgaWYgZnMuZXhpc3RzU3luYyBiYWJlbHJjRmlsZVxuICAgICAgcmV0dXJuIHRydWVcbiAgICBpZiBmcm9tRGlyICE9IHBhdGguZGlybmFtZShmcm9tRGlyKVxuICAgICAgcmV0dXJuIEBpc0JhYmVscmNJblBhdGggcGF0aC5kaXJuYW1lKGZyb21EaXIpXG4gICAgZWxzZSByZXR1cm4gZmFsc2VcblxuIyBzaW1wbGUgbWVyZ2Ugb2Ygb2JqZWN0c1xuICBtZXJnZTogKHRhcmdldE9iaiwgc291cmNlT2JqKSAtPlxuICAgIGZvciBwcm9wLCB2YWwgb2Ygc291cmNlT2JqXG4gICAgICB0YXJnZXRPYmpbcHJvcF0gPSB2YWxcblxuIyBzdG9wIHRyYW5zcGlsZXIgdGFza1xuICBzdG9wVHJhbnNwaWxlclRhc2s6IChwcm9qZWN0UGF0aCkgLT5cbiAgICBtc2dPYmplY3QgPVxuICAgICAgY29tbWFuZDogJ3N0b3AnXG4gICAgQGJhYmVsVHJhbnNwaWxlclRhc2tzW3Byb2plY3RQYXRoXS5zZW5kKG1zZ09iamVjdClcblxuIyBzdG9wIGFsbCB0cmFuc3BpbGVyIHRhc2tzXG4gIHN0b3BBbGxUcmFuc3BpbGVyVGFzazogKCkgLT5cbiAgICBmb3IgcHJvamVjdFBhdGgsIHYgb2YgQGJhYmVsVHJhbnNwaWxlclRhc2tzXG4gICAgICBAc3RvcFRyYW5zcGlsZXJUYXNrKHByb2plY3RQYXRoKVxuXG4jIHN0b3AgdW5zdWVkIHRyYW5zcGlsZXIgdGFza3MgaWYgaXRzIHBhdGggaXNuJ3QgcHJlc2VudCBpbiBhIGN1cnJlbnRcbiMgQXRvbSBwcm9qZWN0IGZvbGRlclxuICBzdG9wVW51c2VkVGFza3M6ICgpIC0+XG4gICAgYXRvbVByb2plY3RQYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgZm9yIHByb2plY3RUYXNrUGF0aCx2IG9mIEBiYWJlbFRyYW5zcGlsZXJUYXNrc1xuICAgICAgaXNUYXNrSW5DdXJyZW50UHJvamVjdCA9IGZhbHNlXG4gICAgICBmb3IgYXRvbVByb2plY3RQYXRoIGluIGF0b21Qcm9qZWN0UGF0aHNcbiAgICAgICAgaWYgcGF0aElzSW5zaWRlKHByb2plY3RUYXNrUGF0aCwgYXRvbVByb2plY3RQYXRoKVxuICAgICAgICAgIGlzVGFza0luQ3VycmVudFByb2plY3QgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGlmIG5vdCBpc1Rhc2tJbkN1cnJlbnRQcm9qZWN0IHRoZW4gQHN0b3BUcmFuc3BpbGVyVGFzayhwcm9qZWN0VGFza1BhdGgpXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNwaWxlclxuIl19
