(function() {
  var CompositeDisposable, LinterRust, XRegExp, atom_linter, errorModes, fs, path, semver,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  path = require('path');

  CompositeDisposable = require('atom').CompositeDisposable;

  atom_linter = require('atom-linter');

  semver = require('semver');

  XRegExp = require('xregexp');

  errorModes = require('./mode');

  LinterRust = (function() {
    LinterRust.prototype.patternRustcVersion = XRegExp('rustc (?<version>1.\\d+.\\d+)(?:(?:-(?:(?<nightly>nightly)|(?<beta>beta.*?))|(?:[^\s]+))? \\((?:[^\\s]+) (?<date>\\d{4}-\\d{2}-\\d{2})\\))?');

    LinterRust.prototype.cargoDependencyDir = "target/debug/deps";

    function LinterRust() {
      this.locateCargo = bind(this.locateCargo, this);
      this.decideErrorMode = bind(this.decideErrorMode, this);
      this.compilationFeatures = bind(this.compilationFeatures, this);
      this.initCmd = bind(this.initCmd, this);
      this.lint = bind(this.lint, this);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.config.observe('linter-rust.rustcPath', (function(_this) {
        return function(rustcPath) {
          if (rustcPath) {
            rustcPath = rustcPath.trim();
          }
          return _this.rustcPath = rustcPath;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.cargoPath', (function(_this) {
        return function(cargoPath) {
          return _this.cargoPath = cargoPath;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.useCargo', (function(_this) {
        return function(useCargo) {
          return _this.useCargo = useCargo;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.cargoCommand', (function(_this) {
        return function(cargoCommand) {
          return _this.cargoCommand = cargoCommand;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.rustcBuildTest', (function(_this) {
        return function(rustcBuildTest) {
          return _this.rustcBuildTest = rustcBuildTest;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.cargoManifestFilename', (function(_this) {
        return function(cargoManifestFilename) {
          return _this.cargoManifestFilename = cargoManifestFilename;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.jobsNumber', (function(_this) {
        return function(jobsNumber) {
          return _this.jobsNumber = jobsNumber;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.disabledWarnings', (function(_this) {
        return function(disabledWarnings) {
          return _this.disabledWarnings = disabledWarnings;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.specifiedFeatures', (function(_this) {
        return function(specifiedFeatures) {
          return _this.specifiedFeatures = specifiedFeatures;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.allowedToCacheVersions', (function(_this) {
        return function(allowedToCacheVersions) {
          return _this.allowedToCacheVersions = allowedToCacheVersions;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-rust.disableExecTimeout', (function(_this) {
        return function(value) {
          return _this.disableExecTimeout = value;
        };
      })(this)));
    }

    LinterRust.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    LinterRust.prototype.lint = function(textEditor) {
      return this.initCmd(textEditor.getPath()).then((function(_this) {
        return function(result) {
          var additional, args, cmd, cmdPath, cmd_res, command, curDir, cwd, env, errorMode, execOpts, file;
          cmd_res = result[0], errorMode = result[1];
          file = cmd_res[0], cmd = cmd_res[1];
          env = JSON.parse(JSON.stringify(process.env));
          curDir = file != null ? path.dirname(file) : __dirname;
          cwd = curDir;
          command = cmd[0];
          cmdPath = cmd[0] != null ? path.dirname(cmd[0]) : __dirname;
          args = cmd.slice(1);
          env.PATH = cmdPath + path.delimiter + env.PATH;
          if (errorMode === errorModes.FLAGS_JSON_CARGO) {
            if ((env.RUSTFLAGS == null) || !(env.RUSTFLAGS.indexOf('--error-format=json') >= 0)) {
              additional = env.RUSTFLAGS != null ? ' ' + env.RUSTFLAGS : '';
              env.RUSTFLAGS = '--error-format=json' + additional;
            }
          }
          execOpts = {
            env: env,
            cwd: cwd,
            stream: 'both'
          };
          if (_this.disableExecTimeout) {
            execOpts.timeout = 2e308;
          }
          return atom_linter.exec(command, args, execOpts).then(function(result) {
            var exitCode, messages, output, showDevModeWarning, stderr, stdout;
            stdout = result.stdout, stderr = result.stderr, exitCode = result.exitCode;
            if (stderr.indexOf('does not have these features') >= 0) {
              atom.notifications.addError("Invalid specified features", {
                detail: "" + stderr,
                dismissable: true
              });
              return [];
            } else if (exitCode === 101 || exitCode === 0) {
              showDevModeWarning = function(stream, message) {
                return atom.notifications.addWarning("Output from " + stream + " while linting", {
                  detail: "" + message,
                  description: "This is shown because Atom is running in dev-mode and probably not an actual error",
                  dismissable: true
                });
              };
              if (atom.inDevMode()) {
                if (stderr) {
                  showDevModeWarning('stderr', stderr);
                }
                if (stdout) {
                  showDevModeWarning('stdout', stdout);
                }
              }
              output = errorMode.neededOutput(stdout, stderr);
              messages = errorMode.parse(output, {
                disabledWarnings: _this.disabledWarnings,
                textEditor: textEditor
              });
              messages.forEach(function(message) {
                if (!(path.isAbsolute(message.location.file))) {
                  return message.location.file = path.join(curDir, message.location.file);
                }
              });
              return messages;
            } else {
              atom.notifications.addError("Failed to run " + command + " with exit code " + exitCode, {
                detail: "with args:\n " + (args.join(' ')) + "\nSee console for more information",
                dismissable: true
              });
              console.log("stdout:");
              console.log(stdout);
              console.log("stderr:");
              console.log(stderr);
              return [];
            }
          })["catch"](function(error) {
            console.log(error);
            atom.notifications.addError("Failed to run " + command, {
              detail: "" + error.message,
              dismissable: true
            });
            return [];
          });
        };
      })(this));
    };

    LinterRust.prototype.initCmd = function(editingFile) {
      var cargoManifestPath, curDir;
      curDir = editingFile != null ? path.dirname(editingFile) : __dirname;
      cargoManifestPath = this.locateCargo(curDir);
      if (!this.useCargo || !cargoManifestPath) {
        return this.decideErrorMode(curDir, 'rustc').then((function(_this) {
          return function(mode) {
            return mode.buildArguments(_this, [editingFile, cargoManifestPath]).then(function(cmd) {
              return [cmd, mode];
            });
          };
        })(this));
      } else {
        return this.decideErrorMode(curDir, 'cargo').then((function(_this) {
          return function(mode) {
            return mode.buildArguments(_this, cargoManifestPath).then(function(cmd) {
              return [cmd, mode];
            });
          };
        })(this));
      }
    };

    LinterRust.prototype.compilationFeatures = function(cargo) {
      var cfgs, f, result;
      if (this.specifiedFeatures.length > 0) {
        if (cargo) {
          return ['--features', this.specifiedFeatures.join(' ')];
        } else {
          result = [];
          cfgs = (function() {
            var i, len, ref, results;
            ref = this.specifiedFeatures;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              f = ref[i];
              results.push(result.push(['--cfg', "feature=\"" + f + "\""]));
            }
            return results;
          }).call(this);
          return result;
        }
      }
    };

    LinterRust.prototype.decideErrorMode = function(curDir, commandMode) {
      var execOpts;
      if ((this.cachedErrorMode != null) && this.allowedToCacheVersions) {
        return Promise.resolve().then((function(_this) {
          return function() {
            return _this.cachedErrorMode;
          };
        })(this));
      } else {
        execOpts = {
          cwd: curDir
        };
        if (this.disableExecTimeout) {
          execOpts.timeout = 2e308;
        }
        return atom_linter.exec(this.rustcPath, ['--version'], execOpts).then((function(_this) {
          return function(stdout) {
            var canUseIntermediateJSON, canUseProperCargoJSON, match, nightlyWithJSON, stableWithJSON;
            try {
              match = XRegExp.exec(stdout, _this.patternRustcVersion);
              if (match) {
                nightlyWithJSON = match.nightly && match.date > '2016-08-08';
                stableWithJSON = !match.nightly && semver.gte(match.version, '1.12.0');
                canUseIntermediateJSON = nightlyWithJSON || stableWithJSON;
                switch (commandMode) {
                  case 'cargo':
                    canUseProperCargoJSON = (match.nightly && match.date >= '2016-10-10') || (match.beta || !match.nightly && semver.gte(match.version, '1.13.0'));
                    if (canUseProperCargoJSON) {
                      return errorModes.JSON_CARGO;
                    } else if (canUseIntermediateJSON) {
                      return errorModes.FLAGS_JSON_CARGO;
                    } else {
                      return errorModes.OLD_CARGO;
                    }
                    break;
                  case 'rustc':
                    if (canUseIntermediateJSON) {
                      return errorModes.JSON_RUSTC;
                    } else {
                      return errorModes.OLD_RUSTC;
                    }
                }
              } else {
                throw Error('rustc returned unexpected result: ' + stdout);
              }
            } catch (error1) {}
          };
        })(this)).then((function(_this) {
          return function(result) {
            _this.cachedErrorMode = result;
            return result;
          };
        })(this));
      }
    };

    LinterRust.prototype.locateCargo = function(curDir) {
      var directory, root_dir;
      root_dir = /^win/.test(process.platform) ? /^.:\\$/ : /^\/$/;
      directory = path.resolve(curDir);
      while (true) {
        if (fs.existsSync(path.join(directory, this.cargoManifestFilename))) {
          return path.join(directory, this.cargoManifestFilename);
        }
        if (root_dir.test(directory)) {
          break;
        }
        directory = path.resolve(path.join(directory, '..'));
      }
      return false;
    };

    return LinterRust;

  })();

  module.exports = LinterRust;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItcnVzdC9saWIvbGludGVyLXJ1c3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxtRkFBQTtJQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRU4sc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixXQUFBLEdBQWMsT0FBQSxDQUFRLGFBQVI7O0VBQ2QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNULE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7RUFFVixVQUFBLEdBQWEsT0FBQSxDQUFRLFFBQVI7O0VBRVA7eUJBQ0osbUJBQUEsR0FBcUIsT0FBQSxDQUFRLDZJQUFSOzt5QkFFckIsa0JBQUEsR0FBb0I7O0lBRVAsb0JBQUE7Ozs7OztNQUNYLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFFckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix1QkFBcEIsRUFDbkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFNBQUQ7VUFDRSxJQUFpQyxTQUFqQztZQUFBLFNBQUEsR0FBZSxTQUFTLENBQUMsSUFBYixDQUFBLEVBQVo7O2lCQUNBLEtBQUMsQ0FBQSxTQUFELEdBQWE7UUFGZjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEbUIsQ0FBbkI7TUFLQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLHVCQUFwQixFQUNuQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsU0FBRDtpQkFDRSxLQUFDLENBQUEsU0FBRCxHQUFhO1FBRGY7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENB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QSxHQUFZLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLElBQXJCLENBQWI7TUFIZDtBQUlBLGFBQU87SUFQSTs7Ozs7O0VBU2YsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUEvTWpCIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuYXRvbV9saW50ZXIgPSByZXF1aXJlICdhdG9tLWxpbnRlcidcbnNlbXZlciA9IHJlcXVpcmUgJ3NlbXZlcidcblhSZWdFeHAgPSByZXF1aXJlICd4cmVnZXhwJ1xuXG5lcnJvck1vZGVzID0gcmVxdWlyZSAnLi9tb2RlJ1xuXG5jbGFzcyBMaW50ZXJSdXN0XG4gIHBhdHRlcm5SdXN0Y1ZlcnNpb246IFhSZWdFeHAoJ3J1c3RjICg/PHZlcnNpb24+MS5cXFxcZCsuXFxcXGQrKSg/Oig/Oi0oPzooPzxuaWdodGx5Pm5pZ2h0bHkpfCg/PGJldGE+YmV0YS4qPykpfCg/OlteXFxzXSspKT8gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcXCgoPzpbXlxcXFxzXSspICg/PGRhdGU+XFxcXGR7NH0tXFxcXGR7Mn0tXFxcXGR7Mn0pXFxcXCkpPycpXG4gIGNhcmdvRGVwZW5kZW5jeURpcjogXCJ0YXJnZXQvZGVidWcvZGVwc1wiXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1ydXN0LnJ1c3RjUGF0aCcsXG4gICAgKHJ1c3RjUGF0aCkgPT5cbiAgICAgIHJ1c3RjUGF0aCA9IGRvIHJ1c3RjUGF0aC50cmltIGlmIHJ1c3RjUGF0aFxuICAgICAgQHJ1c3RjUGF0aCA9IHJ1c3RjUGF0aFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1ydXN0LmNhcmdvUGF0aCcsXG4gICAgKGNhcmdvUGF0aCkgPT5cbiAgICAgIEBjYXJnb1BhdGggPSBjYXJnb1BhdGhcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcnVzdC51c2VDYXJnbycsXG4gICAgKHVzZUNhcmdvKSA9PlxuICAgICAgQHVzZUNhcmdvID0gdXNlQ2FyZ29cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcnVzdC5jYXJnb0NvbW1hbmQnLFxuICAgIChjYXJnb0NvbW1hbmQpID0+XG4gICAgICBAY2FyZ29Db21tYW5kID0gY2FyZ29Db21tYW5kXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXJ1c3QucnVzdGNCdWlsZFRlc3QnLFxuICAgIChydXN0Y0J1aWxkVGVzdCkgPT5cbiAgICAgIEBydXN0Y0J1aWxkVGVzdCA9IHJ1c3RjQnVpbGRUZXN0XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXJ1c3QuY2FyZ29NYW5pZmVzdEZpbGVuYW1lJyxcbiAgICAoY2FyZ29NYW5pZmVzdEZpbGVuYW1lKSA9PlxuICAgICAgQGNhcmdvTWFuaWZlc3RGaWxlbmFtZSA9IGNhcmdvTWFuaWZlc3RGaWxlbmFtZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1ydXN0LmpvYnNOdW1iZXInLFxuICAgIChqb2JzTnVtYmVyKSA9PlxuICAgICAgQGpvYnNOdW1iZXIgPSBqb2JzTnVtYmVyXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXJ1c3QuZGlzYWJsZWRXYXJuaW5ncycsXG4gICAgKGRpc2FibGVkV2FybmluZ3MpID0+XG4gICAgICBAZGlzYWJsZWRXYXJuaW5ncyA9IGRpc2FibGVkV2FybmluZ3NcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcnVzdC5zcGVjaWZpZWRGZWF0dXJlcycsXG4gICAgKHNwZWNpZmllZEZlYXR1cmVzKSA9PlxuICAgICAgQHNwZWNpZmllZEZlYXR1cmVzID0gc3BlY2lmaWVkRmVhdHVyZXNcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcnVzdC5hbGxvd2VkVG9DYWNoZVZlcnNpb25zJyxcbiAgICAoYWxsb3dlZFRvQ2FjaGVWZXJzaW9ucykgPT5cbiAgICAgIEBhbGxvd2VkVG9DYWNoZVZlcnNpb25zID0gYWxsb3dlZFRvQ2FjaGVWZXJzaW9uc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1ydXN0LmRpc2FibGVFeGVjVGltZW91dCcsXG4gICAgKHZhbHVlKSA9PlxuICAgICAgQGRpc2FibGVFeGVjVGltZW91dCA9IHZhbHVlXG5cbiAgZGVzdHJveTogLT5cbiAgICBkbyBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlXG5cbiAgbGludDogKHRleHRFZGl0b3IpID0+XG4gICAgQGluaXRDbWQodGV4dEVkaXRvci5nZXRQYXRoKCkpLnRoZW4gKHJlc3VsdCkgPT5cbiAgICAgIFtjbWRfcmVzLCBlcnJvck1vZGVdID0gcmVzdWx0XG4gICAgICBbZmlsZSwgY21kXSA9IGNtZF9yZXNcbiAgICAgIGVudiA9IEpTT04ucGFyc2UgSlNPTi5zdHJpbmdpZnkgcHJvY2Vzcy5lbnZcbiAgICAgIGN1ckRpciA9IGlmIGZpbGU/IHRoZW4gcGF0aC5kaXJuYW1lIGZpbGUgZWxzZSBfX2Rpcm5hbWVcbiAgICAgIGN3ZCA9IGN1ckRpclxuICAgICAgY29tbWFuZCA9IGNtZFswXVxuICAgICAgY21kUGF0aCA9IGlmIGNtZFswXT8gdGhlbiBwYXRoLmRpcm5hbWUgY21kWzBdIGVsc2UgX19kaXJuYW1lXG4gICAgICBhcmdzID0gY21kLnNsaWNlIDFcbiAgICAgIGVudi5QQVRIID0gY21kUGF0aCArIHBhdGguZGVsaW1pdGVyICsgZW52LlBBVEhcblxuICAgICAgIyB3ZSBzZXQgZmxhZ3Mgb25seSBmb3IgaW50ZXJtZWRpYXRlIGpzb24gc3VwcG9ydFxuICAgICAgaWYgZXJyb3JNb2RlID09IGVycm9yTW9kZXMuRkxBR1NfSlNPTl9DQVJHT1xuICAgICAgICBpZiAhZW52LlJVU1RGTEFHUz8gb3IgIShlbnYuUlVTVEZMQUdTLmluZGV4T2YoJy0tZXJyb3ItZm9ybWF0PWpzb24nKSA+PSAwKVxuICAgICAgICAgIGFkZGl0aW9uYWwgPSBpZiBlbnYuUlVTVEZMQUdTPyB0aGVuICcgJyArIGVudi5SVVNURkxBR1MgZWxzZSAnJ1xuICAgICAgICAgIGVudi5SVVNURkxBR1MgPSAnLS1lcnJvci1mb3JtYXQ9anNvbicgKyBhZGRpdGlvbmFsXG5cbiAgICAgIGV4ZWNPcHRzID1cbiAgICAgICAgZW52OiBlbnZcbiAgICAgICAgY3dkOiBjd2RcbiAgICAgICAgc3RyZWFtOiAnYm90aCdcbiAgICAgIGV4ZWNPcHRzLnRpbWVvdXQgPSBJbmZpbml0eSBpZiBAZGlzYWJsZUV4ZWNUaW1lb3V0XG5cbiAgICAgIGF0b21fbGludGVyLmV4ZWMoY29tbWFuZCwgYXJncywgZXhlY09wdHMpXG4gICAgICAgIC50aGVuIChyZXN1bHQpID0+XG4gICAgICAgICAge3N0ZG91dCwgc3RkZXJyLCBleGl0Q29kZX0gPSByZXN1bHRcbiAgICAgICAgICAjIGZpcnN0LCBjaGVjayBpZiBhbiBvdXRwdXQgc2F5cyBzcGVjaWZpZWQgZmVhdHVyZXMgYXJlIGludmFsaWRcbiAgICAgICAgICBpZiBzdGRlcnIuaW5kZXhPZignZG9lcyBub3QgaGF2ZSB0aGVzZSBmZWF0dXJlcycpID49IDBcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkludmFsaWQgc3BlY2lmaWVkIGZlYXR1cmVzXCIsXG4gICAgICAgICAgICAgIGRldGFpbDogXCIje3N0ZGVycn1cIlxuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgW11cbiAgICAgICAgICAjIHRoZW4sIGlmIGV4aXQgY29kZSBsb29rcyBva2F5LCBwcm9jZXNzIGFuIG91dHB1dFxuICAgICAgICAgIGVsc2UgaWYgZXhpdENvZGUgaXMgMTAxIG9yIGV4aXRDb2RlIGlzIDBcbiAgICAgICAgICAgICMgaW4gZGV2IG1vZGUgc2hvdyBtZXNzYWdlIGJveGVzIHdpdGggb3V0cHV0XG4gICAgICAgICAgICBzaG93RGV2TW9kZVdhcm5pbmcgPSAoc3RyZWFtLCBtZXNzYWdlKSAtPlxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIk91dHB1dCBmcm9tICN7c3RyZWFtfSB3aGlsZSBsaW50aW5nXCIsXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIiN7bWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoaXMgaXMgc2hvd24gYmVjYXVzZSBBdG9tIGlzIHJ1bm5pbmcgaW4gZGV2LW1vZGUgYW5kIHByb2JhYmx5IG5vdCBhbiBhY3R1YWwgZXJyb3JcIlxuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICBpZiBkbyBhdG9tLmluRGV2TW9kZVxuICAgICAgICAgICAgICBzaG93RGV2TW9kZVdhcm5pbmcoJ3N0ZGVycicsIHN0ZGVycikgaWYgc3RkZXJyXG4gICAgICAgICAgICAgIHNob3dEZXZNb2RlV2FybmluZygnc3Rkb3V0Jywgc3Rkb3V0KSBpZiBzdGRvdXRcblxuICAgICAgICAgICAgIyBjYWxsIGEgbmVlZGVkIHBhcnNlclxuICAgICAgICAgICAgb3V0cHV0ID0gZXJyb3JNb2RlLm5lZWRlZE91dHB1dChzdGRvdXQsIHN0ZGVycilcbiAgICAgICAgICAgIG1lc3NhZ2VzID0gZXJyb3JNb2RlLnBhcnNlIG91dHB1dCwge0BkaXNhYmxlZFdhcm5pbmdzLCB0ZXh0RWRpdG9yfVxuXG4gICAgICAgICAgICAjIGNvcnJlY3QgZmlsZSBwYXRoc1xuICAgICAgICAgICAgbWVzc2FnZXMuZm9yRWFjaCAobWVzc2FnZSkgLT5cbiAgICAgICAgICAgICAgaWYgIShwYXRoLmlzQWJzb2x1dGUgbWVzc2FnZS5sb2NhdGlvbi5maWxlKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UubG9jYXRpb24uZmlsZSA9IHBhdGguam9pbiBjdXJEaXIsIG1lc3NhZ2UubG9jYXRpb24uZmlsZVxuICAgICAgICAgICAgbWVzc2FnZXNcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIHdob29wcywgd2UncmUgaW4gdHJvdWJsZSAtLSBsZXQncyBvdXRwdXQgYXMgbXVjaCBhcyB3ZSBjYW5cbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIkZhaWxlZCB0byBydW4gI3tjb21tYW5kfSB3aXRoIGV4aXQgY29kZSAje2V4aXRDb2RlfVwiLFxuICAgICAgICAgICAgICBkZXRhaWw6IFwid2l0aCBhcmdzOlxcbiAje2FyZ3Muam9pbignICcpfVxcblNlZSBjb25zb2xlIGZvciBtb3JlIGluZm9ybWF0aW9uXCJcbiAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nIFwic3Rkb3V0OlwiXG4gICAgICAgICAgICBjb25zb2xlLmxvZyBzdGRvdXRcbiAgICAgICAgICAgIGNvbnNvbGUubG9nIFwic3RkZXJyOlwiXG4gICAgICAgICAgICBjb25zb2xlLmxvZyBzdGRlcnJcbiAgICAgICAgICAgIFtdXG4gICAgICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICAgICAgY29uc29sZS5sb2cgZXJyb3JcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJGYWlsZWQgdG8gcnVuICN7Y29tbWFuZH1cIixcbiAgICAgICAgICAgIGRldGFpbDogXCIje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgW11cblxuICBpbml0Q21kOiAoZWRpdGluZ0ZpbGUpID0+XG4gICAgY3VyRGlyID0gaWYgZWRpdGluZ0ZpbGU/IHRoZW4gcGF0aC5kaXJuYW1lIGVkaXRpbmdGaWxlIGVsc2UgX19kaXJuYW1lXG4gICAgY2FyZ29NYW5pZmVzdFBhdGggPSBAbG9jYXRlQ2FyZ28gY3VyRGlyXG4gICAgaWYgbm90IEB1c2VDYXJnbyBvciBub3QgY2FyZ29NYW5pZmVzdFBhdGhcbiAgICAgIEBkZWNpZGVFcnJvck1vZGUoY3VyRGlyLCAncnVzdGMnKS50aGVuIChtb2RlKSA9PlxuICAgICAgICBtb2RlLmJ1aWxkQXJndW1lbnRzKHRoaXMsIFtlZGl0aW5nRmlsZSwgY2FyZ29NYW5pZmVzdFBhdGhdKS50aGVuIChjbWQpIC0+XG4gICAgICAgICAgW2NtZCwgbW9kZV1cbiAgICBlbHNlXG4gICAgICBAZGVjaWRlRXJyb3JNb2RlKGN1ckRpciwgJ2NhcmdvJykudGhlbiAobW9kZSkgPT5cbiAgICAgICAgbW9kZS5idWlsZEFyZ3VtZW50cyh0aGlzLCBjYXJnb01hbmlmZXN0UGF0aCkudGhlbiAoY21kKSAtPlxuICAgICAgICAgIFtjbWQsIG1vZGVdXG5cbiAgY29tcGlsYXRpb25GZWF0dXJlczogKGNhcmdvKSA9PlxuICAgIGlmIEBzcGVjaWZpZWRGZWF0dXJlcy5sZW5ndGggPiAwXG4gICAgICBpZiBjYXJnb1xuICAgICAgICBbJy0tZmVhdHVyZXMnLCBAc3BlY2lmaWVkRmVhdHVyZXMuam9pbignICcpXVxuICAgICAgZWxzZVxuICAgICAgICByZXN1bHQgPSBbXVxuICAgICAgICBjZmdzID0gZm9yIGYgaW4gQHNwZWNpZmllZEZlYXR1cmVzXG4gICAgICAgICAgcmVzdWx0LnB1c2ggWyctLWNmZycsIFwiZmVhdHVyZT1cXFwiI3tmfVxcXCJcIl1cbiAgICAgICAgcmVzdWx0XG5cbiAgZGVjaWRlRXJyb3JNb2RlOiAoY3VyRGlyLCBjb21tYW5kTW9kZSkgPT5cbiAgICAjIGVycm9yIG1vZGUgaXMgY2FjaGVkIHRvIGF2b2lkIGRlbGF5c1xuICAgIGlmIEBjYWNoZWRFcnJvck1vZGU/IGFuZCBAYWxsb3dlZFRvQ2FjaGVWZXJzaW9uc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbiAoKSA9PlxuICAgICAgICBAY2FjaGVkRXJyb3JNb2RlXG4gICAgZWxzZVxuICAgICAgIyBjdXJyZW50IGRpciBpcyBzZXQgdG8gaGFuZGxlIG92ZXJyaWRlc1xuICAgICAgZXhlY09wdHMgPVxuICAgICAgICBjd2Q6IGN1ckRpclxuICAgICAgZXhlY09wdHMudGltZW91dCA9IEluZmluaXR5IGlmIEBkaXNhYmxlRXhlY1RpbWVvdXRcbiAgICAgIGF0b21fbGludGVyLmV4ZWMoQHJ1c3RjUGF0aCwgWyctLXZlcnNpb24nXSwgZXhlY09wdHMpLnRoZW4gKHN0ZG91dCkgPT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWF0Y2ggPSBYUmVnRXhwLmV4ZWMoc3Rkb3V0LCBAcGF0dGVyblJ1c3RjVmVyc2lvbilcbiAgICAgICAgICBpZiBtYXRjaFxuICAgICAgICAgICAgbmlnaHRseVdpdGhKU09OID0gbWF0Y2gubmlnaHRseSBhbmQgbWF0Y2guZGF0ZSA+ICcyMDE2LTA4LTA4J1xuICAgICAgICAgICAgc3RhYmxlV2l0aEpTT04gPSBub3QgbWF0Y2gubmlnaHRseSBhbmQgc2VtdmVyLmd0ZShtYXRjaC52ZXJzaW9uLCAnMS4xMi4wJylcbiAgICAgICAgICAgIGNhblVzZUludGVybWVkaWF0ZUpTT04gPSBuaWdodGx5V2l0aEpTT04gb3Igc3RhYmxlV2l0aEpTT05cbiAgICAgICAgICAgIHN3aXRjaCBjb21tYW5kTW9kZVxuICAgICAgICAgICAgICB3aGVuICdjYXJnbydcbiAgICAgICAgICAgICAgICBjYW5Vc2VQcm9wZXJDYXJnb0pTT04gPSAobWF0Y2gubmlnaHRseSBhbmQgbWF0Y2guZGF0ZSA+PSAnMjAxNi0xMC0xMCcpIG9yXG4gICAgICAgICAgICAgICAgICAobWF0Y2guYmV0YSBvciBub3QgbWF0Y2gubmlnaHRseSBhbmQgc2VtdmVyLmd0ZShtYXRjaC52ZXJzaW9uLCAnMS4xMy4wJykpXG4gICAgICAgICAgICAgICAgaWYgY2FuVXNlUHJvcGVyQ2FyZ29KU09OXG4gICAgICAgICAgICAgICAgICBlcnJvck1vZGVzLkpTT05fQ0FSR09cbiAgICAgICAgICAgICAgICAjIHRoaXMgbW9kZSBpcyB1c2VkIG9ubHkgdGhyb3VnaCBBdWd1c3QgdGlsbCBPY3RvYmVyLCAyMDE2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjYW5Vc2VJbnRlcm1lZGlhdGVKU09OXG4gICAgICAgICAgICAgICAgICBlcnJvck1vZGVzLkZMQUdTX0pTT05fQ0FSR09cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICBlcnJvck1vZGVzLk9MRF9DQVJHT1xuICAgICAgICAgICAgICB3aGVuICdydXN0YydcbiAgICAgICAgICAgICAgICBpZiBjYW5Vc2VJbnRlcm1lZGlhdGVKU09OXG4gICAgICAgICAgICAgICAgICBlcnJvck1vZGVzLkpTT05fUlVTVENcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICBlcnJvck1vZGVzLk9MRF9SVVNUQ1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdydXN0YyByZXR1cm5lZCB1bmV4cGVjdGVkIHJlc3VsdDogJyArIHN0ZG91dClcbiAgICAgIC50aGVuIChyZXN1bHQpID0+XG4gICAgICAgIEBjYWNoZWRFcnJvck1vZGUgPSByZXN1bHRcbiAgICAgICAgcmVzdWx0XG5cbiAgbG9jYXRlQ2FyZ286IChjdXJEaXIpID0+XG4gICAgcm9vdF9kaXIgPSBpZiAvXndpbi8udGVzdCBwcm9jZXNzLnBsYXRmb3JtIHRoZW4gL14uOlxcXFwkLyBlbHNlIC9eXFwvJC9cbiAgICBkaXJlY3RvcnkgPSBwYXRoLnJlc29sdmUgY3VyRGlyXG4gICAgbG9vcFxuICAgICAgcmV0dXJuIHBhdGguam9pbiBkaXJlY3RvcnksIEBjYXJnb01hbmlmZXN0RmlsZW5hbWUgaWYgZnMuZXhpc3RzU3luYyBwYXRoLmpvaW4gZGlyZWN0b3J5LCBAY2FyZ29NYW5pZmVzdEZpbGVuYW1lXG4gICAgICBicmVhayBpZiByb290X2Rpci50ZXN0IGRpcmVjdG9yeVxuICAgICAgZGlyZWN0b3J5ID0gcGF0aC5yZXNvbHZlIHBhdGguam9pbihkaXJlY3RvcnksICcuLicpXG4gICAgcmV0dXJuIGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzID0gTGludGVyUnVzdFxuIl19
