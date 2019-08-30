(function() {
  var XRegExp, atom_linter, buildCargoArguments, buildMessages, buildRustcArguments, cachedUsingMultitoolForClippy, constructMessage, errorModes, parseJsonMessages, parseJsonOutput, parseOldMessages, path, pattern;

  path = require('path');

  atom_linter = require('atom-linter');

  XRegExp = require('xregexp');

  pattern = XRegExp('(?<file>[^\n\r]+):(?<from_line>\\d+):(?<from_col>\\d+):\\s*(?<to_line>\\d+):(?<to_col>\\d+)\\s+((?<error>error|fatal error)|(?<warning>warning)|(?<info>note|help)):\\s+(?<message>.+?)[\n\r]+($|(?=[^\n\r]+:\\d+))', 's');

  parseOldMessages = function(output, arg) {
    var disabledWarnings, elements, textEditor;
    disabledWarnings = arg.disabledWarnings, textEditor = arg.textEditor;
    elements = [];
    XRegExp.forEach(output, pattern, function(match) {
      var element, level, range;
      range = match.from_col === match.to_col && match.from_line === match.to_line ? atom_linter.generateRange(textEditor, Number.parseInt(match.from_line, 10) - 1, Number.parseInt(match.from_col, 10) - 1) : [[match.from_line - 1, match.from_col - 1], [match.to_line - 1, match.to_col - 1]];
      level = match.error ? 'error' : match.warning ? 'warning' : match.info ? 'info' : match.trace ? 'trace' : match.note ? 'note' : void 0;
      element = {
        type: level,
        message: match.message,
        file: match.file,
        range: range
      };
      return elements.push(element);
    });
    return buildMessages(elements, disabledWarnings);
  };

  parseJsonMessages = function(messages, arg) {
    var disabledWarnings, element, elements, i, input, j, len, len1, primary_span, range, ref, span;
    disabledWarnings = arg.disabledWarnings;
    elements = [];
    for (i = 0, len = messages.length; i < len; i++) {
      input = messages[i];
      if (!(input && input.spans)) {
        continue;
      }
      primary_span = input.spans.find(function(span) {
        return span.is_primary;
      });
      if (!primary_span) {
        continue;
      }
      while (primary_span.expansion && primary_span.expansion.span) {
        primary_span = primary_span.expansion.span;
      }
      range = [[primary_span.line_start - 1, primary_span.column_start - 1], [primary_span.line_end - 1, primary_span.column_end - 1]];
      if (input.level === 'fatal error') {
        input.level = 'error';
      }
      element = {
        type: input.level,
        message: input.message,
        file: primary_span.file_name,
        range: range,
        children: input.children
      };
      ref = input.spans;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        span = ref[j];
        if (!span.is_primary) {
          element.children.push({
            range: [[span.line_start - 1, span.column_start - 1], [span.line_end - 1, span.column_end - 1]]
          });
        }
      }
      elements.push(element);
    }
    return buildMessages(elements, disabledWarnings);
  };

  parseJsonOutput = function(output, arg) {
    var additionalFilter, disabledWarnings, results;
    disabledWarnings = arg.disabledWarnings, additionalFilter = arg.additionalFilter;
    results = output.split('\n').map(function(message) {
      var json;
      message = message.trim();
      if (message.startsWith('{')) {
        json = JSON.parse(message);
        if (additionalFilter != null) {
          return additionalFilter(json);
        } else {
          return json;
        }
      }
    }).filter(function(m) {
      return m != null;
    });
    return parseJsonMessages(results, {
      disabledWarnings: disabledWarnings
    });
  };

  buildMessages = function(elements, disabledWarnings) {
    var disabledWarning, element, i, j, lastMessage, len, len1, messageIsDisabledLint, messages;
    messages = [];
    lastMessage = null;
    for (i = 0, len = elements.length; i < len; i++) {
      element = elements[i];
      switch (element.type) {
        case 'info':
        case 'trace':
        case 'note':
          if (lastMessage) {
            lastMessage.reference = {
              file: element.file,
              position: element.range
            };
          }
          break;
        case 'warning':
          if (disabledWarnings && disabledWarnings.length > 0) {
            messageIsDisabledLint = false;
            for (j = 0, len1 = disabledWarnings.length; j < len1; j++) {
              disabledWarning = disabledWarnings[j];
              if (element.message.indexOf(disabledWarning) >= 0) {
                messageIsDisabledLint = true;
                lastMessage = null;
                break;
              }
            }
            if (!messageIsDisabledLint) {
              lastMessage = constructMessage("Warning", element);
              messages.push(lastMessage);
            }
          } else {
            lastMessage = constructMessage("Warning", element);
            messages.push(lastMessage);
          }
          break;
        case 'error':
        case 'fatal error':
          lastMessage = constructMessage("Error", element);
          messages.push(lastMessage);
      }
    }
    return messages;
  };

  constructMessage = function(type, element) {
    var children, i, len, message, ref;
    message = {
      severity: type.toLowerCase(),
      excerpt: element.message,
      location: {
        file: element.file,
        position: element.range
      }
    };
    if (element.children) {
      ref = element.children;
      for (i = 0, len = ref.length; i < len; i++) {
        children = ref[i];
        if (children.range) {
          message.reference = {
            file: element.file,
            position: children.range
          };
          break;
        }
      }
    }
    return message;
  };

  buildRustcArguments = function(linter, paths) {
    var cargoManifestPath, editingFile;
    editingFile = paths[0], cargoManifestPath = paths[1];
    return Promise.resolve().then((function(_this) {
      return function() {
        var cmd, compilationFeatures, rustcArgs;
        rustcArgs = (function() {
          switch (linter.rustcBuildTest) {
            case true:
              return ['--cfg', 'test'];
            default:
              return [];
          }
        })();
        rustcArgs = rustcArgs.concat(['--color', 'never']);
        cmd = [linter.rustcPath].concat(rustcArgs);
        if (cargoManifestPath) {
          cmd.push('-L');
          cmd.push(path.join(path.dirname(cargoManifestPath), linter.cargoDependencyDir));
        }
        compilationFeatures = linter.compilationFeatures(false);
        if (compilationFeatures) {
          cmd = cmd.concat(compilationFeatures);
        }
        cmd = cmd.concat([editingFile]);
        return [editingFile, cmd];
      };
    })(this));
  };

  cachedUsingMultitoolForClippy = null;

  buildCargoArguments = function(linter, cargoManifestPath) {
    var buildCargoPath, cargoArgs, compilationFeatures;
    buildCargoPath = function(cargoPath, cargoCommand) {
      var usingMultitoolForClippy;
      if ((cachedUsingMultitoolForClippy != null) && linter.allowedToCacheVersions) {
        return Promise.resolve().then((function(_this) {
          return function() {
            return cachedUsingMultitoolForClippy;
          };
        })(this));
      } else {
        usingMultitoolForClippy = atom_linter.exec('rustup', ['--version'], {
          ignoreExitCode: true
        }).then(function() {
          return {
            result: true,
            tool: 'rustup'
          };
        })["catch"](function() {
          return atom_linter.exec('multirust', ['--version'], {
            ignoreExitCode: true
          }).then(function() {
            return {
              result: true,
              tool: 'multirust'
            };
          })["catch"](function() {
            return {
              result: false
            };
          });
        });
        return usingMultitoolForClippy.then(function(canUseMultirust) {
          if (cargoCommand === 'clippy' && canUseMultirust.result) {
            return [canUseMultirust.tool, 'run', 'nightly', 'cargo'];
          } else {
            return [cargoPath];
          }
        }).then((function(_this) {
          return function(cached) {
            cachedUsingMultitoolForClippy = cached;
            return cached;
          };
        })(this));
      }
    };
    cargoArgs = (function() {
      switch (linter.cargoCommand) {
        case 'check':
          return ['check'];
        case 'check all':
          return ['check', '--all'];
        case 'check tests':
          return ['check', '--tests'];
        case 'test':
          return ['test', '--no-run'];
        case 'test all':
          return ['test', '--no-run', '--all'];
        case 'rustc':
          return ['rustc', '--color', 'never'];
        case 'clippy':
          return ['clippy'];
        default:
          return ['build'];
      }
    })();
    compilationFeatures = linter.compilationFeatures(true);
    return buildCargoPath(linter.cargoPath, linter.cargoCommand).then(function(cmd) {
      cmd = cmd.concat(cargoArgs).concat(['-j', linter.jobsNumber]);
      if (compilationFeatures) {
        cmd = cmd.concat(compilationFeatures);
      }
      cmd.push("--manifest-path=" + cargoManifestPath);
      return [cargoManifestPath, cmd];
    });
  };

  errorModes = {
    JSON_RUSTC: {
      neededOutput: function(stdout, stderr) {
        return stderr;
      },
      parse: (function(_this) {
        return function(output, options) {
          return parseJsonOutput(output, options);
        };
      })(this),
      buildArguments: function(linter, file) {
        return buildRustcArguments(linter, file).then(function(cmd_res) {
          var cmd;
          file = cmd_res[0], cmd = cmd_res[1];
          cmd = cmd.concat(['--error-format=json']);
          return [file, cmd];
        });
      }
    },
    JSON_CARGO: {
      neededOutput: function(stdout, stderr) {
        return stdout;
      },
      parse: function(output, options) {
        options.additionalFilter = function(json) {
          if ((json != null) && json.reason === "compiler-message") {
            return json.message;
          }
        };
        return parseJsonOutput(output, options);
      },
      buildArguments: function(linter, file) {
        return buildCargoArguments(linter, file).then(function(cmd_res) {
          var cmd;
          file = cmd_res[0], cmd = cmd_res[1];
          cmd = cmd.concat(['--message-format', 'json']);
          return [file, cmd];
        });
      }
    },
    FLAGS_JSON_CARGO: {
      neededOutput: function(stdout, stderr) {
        return stderr;
      },
      parse: parseJsonOutput,
      buildArguments: buildCargoArguments
    },
    OLD_RUSTC: {
      neededOutput: function(stdout, stderr) {
        return stderr;
      },
      parse: parseOldMessages,
      buildArguments: buildRustcArguments
    },
    OLD_CARGO: {
      neededOutput: function(stdout, stderr) {
        return stderr;
      },
      parse: parseOldMessages,
      buildArguments: buildCargoArguments
    }
  };

  module.exports = errorModes;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItcnVzdC9saWIvbW9kZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxXQUFBLEdBQWMsT0FBQSxDQUFRLGFBQVI7O0VBQ2QsT0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztFQUVWLE9BQUEsR0FBVSxPQUFBLENBQVEscU5BQVIsRUFHc0MsR0FIdEM7O0VBS1YsZ0JBQUEsR0FBbUIsU0FBQyxNQUFELEVBQVMsR0FBVDtBQUNqQixRQUFBO0lBRDJCLHlDQUFrQjtJQUM3QyxRQUFBLEdBQVc7SUFDWCxPQUFPLENBQUMsT0FBUixDQUFnQixNQUFoQixFQUF3QixPQUF4QixFQUFpQyxTQUFDLEtBQUQ7QUFDL0IsVUFBQTtNQUFBLEtBQUEsR0FBVyxLQUFLLENBQUMsUUFBTixLQUFrQixLQUFLLENBQUMsTUFBeEIsSUFBbUMsS0FBSyxDQUFDLFNBQU4sS0FBbUIsS0FBSyxDQUFDLE9BQS9ELEdBQ04sV0FBVyxDQUFDLGFBQVosQ0FBMEIsVUFBMUIsRUFBc0MsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsS0FBSyxDQUFDLFNBQXRCLEVBQWlDLEVBQWpDLENBQUEsR0FBdUMsQ0FBN0UsRUFBZ0YsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsS0FBSyxDQUFDLFFBQXRCLEVBQWdDLEVBQWhDLENBQUEsR0FBc0MsQ0FBdEgsQ0FETSxHQUdOLENBQ0UsQ0FBQyxLQUFLLENBQUMsU0FBTixHQUFrQixDQUFuQixFQUFzQixLQUFLLENBQUMsUUFBTixHQUFpQixDQUF2QyxDQURGLEVBRUUsQ0FBQyxLQUFLLENBQUMsT0FBTixHQUFnQixDQUFqQixFQUFvQixLQUFLLENBQUMsTUFBTixHQUFlLENBQW5DLENBRkY7TUFJRixLQUFBLEdBQVcsS0FBSyxDQUFDLEtBQVQsR0FBb0IsT0FBcEIsR0FDQSxLQUFLLENBQUMsT0FBVCxHQUFzQixTQUF0QixHQUNHLEtBQUssQ0FBQyxJQUFULEdBQW1CLE1BQW5CLEdBQ0csS0FBSyxDQUFDLEtBQVQsR0FBb0IsT0FBcEIsR0FDRyxLQUFLLENBQUMsSUFBVCxHQUFtQixNQUFuQixHQUFBO01BQ0wsT0FBQSxHQUNFO1FBQUEsSUFBQSxFQUFNLEtBQU47UUFDQSxPQUFBLEVBQVMsS0FBSyxDQUFDLE9BRGY7UUFFQSxJQUFBLEVBQU0sS0FBSyxDQUFDLElBRlo7UUFHQSxLQUFBLEVBQU8sS0FIUDs7YUFJRixRQUFRLENBQUMsSUFBVCxDQUFjLE9BQWQ7SUFsQitCLENBQWpDO1dBbUJBLGFBQUEsQ0FBYyxRQUFkLEVBQXdCLGdCQUF4QjtFQXJCaUI7O0VBdUJuQixpQkFBQSxHQUFvQixTQUFDLFFBQUQsRUFBVyxHQUFYO0FBQ2xCLFFBQUE7SUFEOEIsbUJBQUQ7SUFDN0IsUUFBQSxHQUFXO0FBQ1gsU0FBQSwwQ0FBQTs7TUFDRSxJQUFBLENBQUEsQ0FBZ0IsS0FBQSxJQUFVLEtBQUssQ0FBQyxLQUFoQyxDQUFBO0FBQUEsaUJBQUE7O01BQ0EsWUFBQSxHQUFlLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFpQixTQUFDLElBQUQ7ZUFBVSxJQUFJLENBQUM7TUFBZixDQUFqQjtNQUNmLElBQUEsQ0FBZ0IsWUFBaEI7QUFBQSxpQkFBQTs7QUFDQSxhQUFNLFlBQVksQ0FBQyxTQUFiLElBQTJCLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBeEQ7UUFDRSxZQUFBLEdBQWUsWUFBWSxDQUFDLFNBQVMsQ0FBQztNQUR4QztNQUVBLEtBQUEsR0FBUSxDQUNOLENBQUMsWUFBWSxDQUFDLFVBQWIsR0FBMEIsQ0FBM0IsRUFBOEIsWUFBWSxDQUFDLFlBQWIsR0FBNEIsQ0FBMUQsQ0FETSxFQUVOLENBQUMsWUFBWSxDQUFDLFFBQWIsR0FBd0IsQ0FBekIsRUFBNEIsWUFBWSxDQUFDLFVBQWIsR0FBMEIsQ0FBdEQsQ0FGTTtNQUlSLElBQXlCLEtBQUssQ0FBQyxLQUFOLEtBQWUsYUFBeEM7UUFBQSxLQUFLLENBQUMsS0FBTixHQUFjLFFBQWQ7O01BQ0EsT0FBQSxHQUNFO1FBQUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxLQUFaO1FBQ0EsT0FBQSxFQUFTLEtBQUssQ0FBQyxPQURmO1FBRUEsSUFBQSxFQUFNLFlBQVksQ0FBQyxTQUZuQjtRQUdBLEtBQUEsRUFBTyxLQUhQO1FBSUEsUUFBQSxFQUFVLEtBQUssQ0FBQyxRQUpoQjs7QUFLRjtBQUFBLFdBQUEsdUNBQUE7O1FBQ0UsSUFBQSxDQUFPLElBQUksQ0FBQyxVQUFaO1VBQ0UsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFqQixDQUNFO1lBQUEsS0FBQSxFQUFPLENBQ0wsQ0FBQyxJQUFJLENBQUMsVUFBTCxHQUFrQixDQUFuQixFQUFzQixJQUFJLENBQUMsWUFBTCxHQUFvQixDQUExQyxDQURLLEVBRUwsQ0FBQyxJQUFJLENBQUMsUUFBTCxHQUFnQixDQUFqQixFQUFvQixJQUFJLENBQUMsVUFBTCxHQUFrQixDQUF0QyxDQUZLLENBQVA7V0FERixFQURGOztBQURGO01BT0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxPQUFkO0FBeEJGO1dBeUJBLGFBQUEsQ0FBYyxRQUFkLEVBQXdCLGdCQUF4QjtFQTNCa0I7O0VBNkJwQixlQUFBLEdBQWtCLFNBQUMsTUFBRCxFQUFTLEdBQVQ7QUFDaEIsUUFBQTtJQUQwQix5Q0FBa0I7SUFDNUMsT0FBQSxHQUFVLE1BQU0sQ0FBQyxLQUFQLENBQWEsSUFBYixDQUFrQixDQUFDLEdBQW5CLENBQXVCLFNBQUMsT0FBRDtBQUMvQixVQUFBO01BQUEsT0FBQSxHQUFVLE9BQU8sQ0FBQyxJQUFSLENBQUE7TUFDVixJQUFHLE9BQU8sQ0FBQyxVQUFSLENBQW1CLEdBQW5CLENBQUg7UUFDRSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFYO1FBQ1AsSUFBRyx3QkFBSDtpQkFDRSxnQkFBQSxDQUFpQixJQUFqQixFQURGO1NBQUEsTUFBQTtpQkFHRSxLQUhGO1NBRkY7O0lBRitCLENBQXZCLENBUVYsQ0FBQyxNQVJTLENBUUYsU0FBQyxDQUFEO2FBQU87SUFBUCxDQVJFO1dBU1YsaUJBQUEsQ0FBa0IsT0FBbEIsRUFBMkI7TUFBQyxrQkFBQSxnQkFBRDtLQUEzQjtFQVZnQjs7RUFZbEIsYUFBQSxHQUFnQixTQUFDLFFBQUQsRUFBVyxnQkFBWDtBQUNkLFFBQUE7SUFBQSxRQUFBLEdBQVc7SUFDWCxXQUFBLEdBQWM7QUFDZCxTQUFBLDBDQUFBOztBQUNFLGNBQU8sT0FBTyxDQUFDLElBQWY7QUFBQSxhQUNPLE1BRFA7QUFBQSxhQUNlLE9BRGY7QUFBQSxhQUN3QixNQUR4QjtVQUdJLElBQUcsV0FBSDtZQUNFLFdBQVcsQ0FBQyxTQUFaLEdBQXdCO2NBQ3RCLElBQUEsRUFBTSxPQUFPLENBQUMsSUFEUTtjQUV0QixRQUFBLEVBQVUsT0FBTyxDQUFDLEtBRkk7Y0FEMUI7O0FBRm9CO0FBRHhCLGFBUU8sU0FSUDtVQVdJLElBQUcsZ0JBQUEsSUFBcUIsZ0JBQWdCLENBQUMsTUFBakIsR0FBMEIsQ0FBbEQ7WUFDRSxxQkFBQSxHQUF3QjtBQUN4QixpQkFBQSxvREFBQTs7Y0FFRSxJQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBaEIsQ0FBd0IsZUFBeEIsQ0FBQSxJQUE0QyxDQUEvQztnQkFDRSxxQkFBQSxHQUF3QjtnQkFDeEIsV0FBQSxHQUFjO0FBQ2Qsc0JBSEY7O0FBRkY7WUFNQSxJQUFHLENBQUkscUJBQVA7Y0FDRSxXQUFBLEdBQWMsZ0JBQUEsQ0FBaUIsU0FBakIsRUFBNEIsT0FBNUI7Y0FDZCxRQUFRLENBQUMsSUFBVCxDQUFjLFdBQWQsRUFGRjthQVJGO1dBQUEsTUFBQTtZQVlFLFdBQUEsR0FBYyxnQkFBQSxDQUFpQixTQUFqQixFQUE2QixPQUE3QjtZQUNkLFFBQVEsQ0FBQyxJQUFULENBQWMsV0FBZCxFQWJGOztBQUhHO0FBUlAsYUF5Qk8sT0F6QlA7QUFBQSxhQXlCZ0IsYUF6QmhCO1VBMEJJLFdBQUEsR0FBYyxnQkFBQSxDQUFpQixPQUFqQixFQUEwQixPQUExQjtVQUNkLFFBQVEsQ0FBQyxJQUFULENBQWMsV0FBZDtBQTNCSjtBQURGO0FBNkJBLFdBQU87RUFoQ087O0VBa0NoQixnQkFBQSxHQUFtQixTQUFDLElBQUQsRUFBTyxPQUFQO0FBQ2pCLFFBQUE7SUFBQSxPQUFBLEdBQ0U7TUFBQSxRQUFBLEVBQVUsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFWO01BQ0EsT0FBQSxFQUFTLE9BQU8sQ0FBQyxPQURqQjtNQUVBLFFBQUEsRUFBVTtRQUNSLElBQUEsRUFBTSxPQUFPLENBQUMsSUFETjtRQUVSLFFBQUEsRUFBVSxPQUFPLENBQUMsS0FGVjtPQUZWOztJQU9GLElBQUcsT0FBTyxDQUFDLFFBQVg7QUFDRTtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsSUFBRyxRQUFRLENBQUMsS0FBWjtVQUVFLE9BQU8sQ0FBQyxTQUFSLEdBQW9CO1lBQ2xCLElBQUEsRUFBTSxPQUFPLENBQUMsSUFESTtZQUVsQixRQUFBLEVBQVUsUUFBUSxDQUFDLEtBRkQ7O0FBSXBCLGdCQU5GOztBQURGLE9BREY7O1dBU0E7RUFsQmlCOztFQW9CbkIsbUJBQUEsR0FBc0IsU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNwQixRQUFBO0lBQUMsc0JBQUQsRUFBYztXQUNkLE9BQU8sQ0FBQyxPQUFSLENBQUEsQ0FBaUIsQ0FBQyxJQUFsQixDQUF1QixDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7QUFDckIsWUFBQTtRQUFBLFNBQUE7QUFBWSxrQkFBTyxNQUFNLENBQUMsY0FBZDtBQUFBLGlCQUNMLElBREs7cUJBQ0ssQ0FBQyxPQUFELEVBQVUsTUFBVjtBQURMO3FCQUVMO0FBRks7O1FBR1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxNQUFWLENBQWlCLENBQUMsU0FBRCxFQUFZLE9BQVosQ0FBakI7UUFDWixHQUFBLEdBQU0sQ0FBQyxNQUFNLENBQUMsU0FBUixDQUNKLENBQUMsTUFERyxDQUNJLFNBREo7UUFFTixJQUFHLGlCQUFIO1VBQ0UsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFUO1VBQ0EsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsaUJBQWIsQ0FBVixFQUEyQyxNQUFNLENBQUMsa0JBQWxELENBQVQsRUFGRjs7UUFHQSxtQkFBQSxHQUFzQixNQUFNLENBQUMsbUJBQVAsQ0FBMkIsS0FBM0I7UUFDdEIsSUFBd0MsbUJBQXhDO1VBQUEsR0FBQSxHQUFNLEdBQUcsQ0FBQyxNQUFKLENBQVcsbUJBQVgsRUFBTjs7UUFDQSxHQUFBLEdBQU0sR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFDLFdBQUQsQ0FBWDtlQUNOLENBQUMsV0FBRCxFQUFjLEdBQWQ7TUFicUI7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCO0VBRm9COztFQWlCdEIsNkJBQUEsR0FBZ0M7O0VBRWhDLG1CQUFBLEdBQXNCLFNBQUMsTUFBRCxFQUFTLGlCQUFUO0FBQ3BCLFFBQUE7SUFBQSxjQUFBLEdBQWlCLFNBQUMsU0FBRCxFQUFZLFlBQVo7QUFFZixVQUFBO01BQUEsSUFBRyx1Q0FBQSxJQUFtQyxNQUFNLENBQUMsc0JBQTdDO2VBQ0UsT0FBTyxDQUFDLE9BQVIsQ0FBQSxDQUFpQixDQUFDLElBQWxCLENBQXVCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ3JCO1VBRHFCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QixFQURGO09BQUEsTUFBQTtRQUtFLHVCQUFBLEdBQ0UsV0FBVyxDQUFDLElBQVosQ0FBaUIsUUFBakIsRUFBMkIsQ0FBQyxXQUFELENBQTNCLEVBQTBDO1VBQUMsY0FBQSxFQUFnQixJQUFqQjtTQUExQyxDQUNFLENBQUMsSUFESCxDQUNRLFNBQUE7aUJBQ0o7WUFBQSxNQUFBLEVBQVEsSUFBUjtZQUFjLElBQUEsRUFBTSxRQUFwQjs7UUFESSxDQURSLENBR0UsRUFBQyxLQUFELEVBSEYsQ0FHUyxTQUFBO2lCQUVMLFdBQVcsQ0FBQyxJQUFaLENBQWlCLFdBQWpCLEVBQThCLENBQUMsV0FBRCxDQUE5QixFQUE2QztZQUFDLGNBQUEsRUFBZ0IsSUFBakI7V0FBN0MsQ0FDRSxDQUFDLElBREgsQ0FDUSxTQUFBO21CQUNKO2NBQUEsTUFBQSxFQUFRLElBQVI7Y0FBYyxJQUFBLEVBQU0sV0FBcEI7O1VBREksQ0FEUixDQUdFLEVBQUMsS0FBRCxFQUhGLENBR1MsU0FBQTttQkFDTDtjQUFBLE1BQUEsRUFBUSxLQUFSOztVQURLLENBSFQ7UUFGSyxDQUhUO2VBVUYsdUJBQXVCLENBQUMsSUFBeEIsQ0FBNkIsU0FBQyxlQUFEO1VBQzNCLElBQUcsWUFBQSxLQUFnQixRQUFoQixJQUE2QixlQUFlLENBQUMsTUFBaEQ7bUJBQ0UsQ0FBQyxlQUFlLENBQUMsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsU0FBOUIsRUFBeUMsT0FBekMsRUFERjtXQUFBLE1BQUE7bUJBR0UsQ0FBQyxTQUFELEVBSEY7O1FBRDJCLENBQTdCLENBS0EsQ0FBQyxJQUxELENBS00sQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxNQUFEO1lBQ0osNkJBQUEsR0FBZ0M7bUJBQ2hDO1VBRkk7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTE4sRUFoQkY7O0lBRmU7SUEyQmpCLFNBQUE7QUFBWSxjQUFPLE1BQU0sQ0FBQyxZQUFkO0FBQUEsYUFDTCxPQURLO2lCQUNRLENBQUMsT0FBRDtBQURSLGFBRUwsV0FGSztpQkFFWSxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBRlosYUFHTCxhQUhLO2lCQUdjLENBQUMsT0FBRCxFQUFVLFNBQVY7QUFIZCxhQUlMLE1BSks7aUJBSU8sQ0FBQyxNQUFELEVBQVMsVUFBVDtBQUpQLGFBS0wsVUFMSztpQkFLVyxDQUFDLE1BQUQsRUFBUyxVQUFULEVBQXFCLE9BQXJCO0FBTFgsYUFNTCxPQU5LO2lCQU1RLENBQUMsT0FBRCxFQUFVLFNBQVYsRUFBcUIsT0FBckI7QUFOUixhQU9MLFFBUEs7aUJBT1MsQ0FBQyxRQUFEO0FBUFQ7aUJBUUwsQ0FBQyxPQUFEO0FBUks7O0lBVVosbUJBQUEsR0FBc0IsTUFBTSxDQUFDLG1CQUFQLENBQTJCLElBQTNCO1dBQ3RCLGNBQUEsQ0FBZSxNQUFNLENBQUMsU0FBdEIsRUFBaUMsTUFBTSxDQUFDLFlBQXhDLENBQXFELENBQUMsSUFBdEQsQ0FBMkQsU0FBQyxHQUFEO01BQ3pELEdBQUEsR0FBTSxHQUNKLENBQUMsTUFERyxDQUNJLFNBREosQ0FFSixDQUFDLE1BRkcsQ0FFSSxDQUFDLElBQUQsRUFBTyxNQUFNLENBQUMsVUFBZCxDQUZKO01BR04sSUFBd0MsbUJBQXhDO1FBQUEsR0FBQSxHQUFNLEdBQUcsQ0FBQyxNQUFKLENBQVcsbUJBQVgsRUFBTjs7TUFDQSxHQUFHLENBQUMsSUFBSixDQUFTLGtCQUFBLEdBQW1CLGlCQUE1QjthQUNBLENBQUMsaUJBQUQsRUFBb0IsR0FBcEI7SUFOeUQsQ0FBM0Q7RUF2Q29COztFQWdEdEIsVUFBQSxHQUNFO0lBQUEsVUFBQSxFQUNFO01BQUEsWUFBQSxFQUFjLFNBQUMsTUFBRCxFQUFTLE1BQVQ7ZUFDWjtNQURZLENBQWQ7TUFHQSxLQUFBLEVBQU8sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQsRUFBUyxPQUFUO2lCQUNMLGVBQUEsQ0FBZ0IsTUFBaEIsRUFBd0IsT0FBeEI7UUFESztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FIUDtNQU1BLGNBQUEsRUFBZ0IsU0FBQyxNQUFELEVBQVMsSUFBVDtlQUNkLG1CQUFBLENBQW9CLE1BQXBCLEVBQTRCLElBQTVCLENBQWlDLENBQUMsSUFBbEMsQ0FBdUMsU0FBQyxPQUFEO0FBQ3JDLGNBQUE7VUFBQyxpQkFBRCxFQUFPO1VBQ1AsR0FBQSxHQUFNLEdBQUcsQ0FBQyxNQUFKLENBQVcsQ0FBQyxxQkFBRCxDQUFYO2lCQUNOLENBQUMsSUFBRCxFQUFPLEdBQVA7UUFIcUMsQ0FBdkM7TUFEYyxDQU5oQjtLQURGO0lBYUEsVUFBQSxFQUNFO01BQUEsWUFBQSxFQUFjLFNBQUMsTUFBRCxFQUFTLE1BQVQ7ZUFDWjtNQURZLENBQWQ7TUFHQSxLQUFBLEVBQU8sU0FBQyxNQUFELEVBQVMsT0FBVDtRQUNMLE9BQU8sQ0FBQyxnQkFBUixHQUEyQixTQUFDLElBQUQ7VUFDekIsSUFBRyxjQUFBLElBQVUsSUFBSSxDQUFDLE1BQUwsS0FBZSxrQkFBNUI7bUJBQ0UsSUFBSSxDQUFDLFFBRFA7O1FBRHlCO2VBRzNCLGVBQUEsQ0FBZ0IsTUFBaEIsRUFBd0IsT0FBeEI7TUFKSyxDQUhQO01BU0EsY0FBQSxFQUFnQixTQUFDLE1BQUQsRUFBUyxJQUFUO2VBQ2QsbUJBQUEsQ0FBb0IsTUFBcEIsRUFBNEIsSUFBNUIsQ0FBaUMsQ0FBQyxJQUFsQyxDQUF1QyxTQUFDLE9BQUQ7QUFDckMsY0FBQTtVQUFDLGlCQUFELEVBQU87VUFDUCxHQUFBLEdBQU0sR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFDLGtCQUFELEVBQXFCLE1BQXJCLENBQVg7aUJBQ04sQ0FBQyxJQUFELEVBQU8sR0FBUDtRQUhxQyxDQUF2QztNQURjLENBVGhCO0tBZEY7SUE2QkEsZ0JBQUEsRUFDRTtNQUFBLFlBQUEsRUFBYyxTQUFDLE1BQUQsRUFBUyxNQUFUO2VBQ1o7TUFEWSxDQUFkO01BR0EsS0FBQSxFQUFPLGVBSFA7TUFLQSxjQUFBLEVBQWdCLG1CQUxoQjtLQTlCRjtJQXFDQSxTQUFBLEVBQ0U7TUFBQSxZQUFBLEVBQWMsU0FBQyxNQUFELEVBQVMsTUFBVDtlQUNaO01BRFksQ0FBZDtNQUdBLEtBQUEsRUFBTyxnQkFIUDtNQUtBLGNBQUEsRUFBZ0IsbUJBTGhCO0tBdENGO0lBNkNBLFNBQUEsRUFDRTtNQUFBLFlBQUEsRUFBYyxTQUFDLE1BQUQsRUFBUyxNQUFUO2VBQ1o7TUFEWSxDQUFkO01BR0EsS0FBQSxFQUFPLGdCQUhQO01BS0EsY0FBQSxFQUFnQixtQkFMaEI7S0E5Q0Y7OztFQXFERixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXpQakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcblxuYXRvbV9saW50ZXIgPSByZXF1aXJlICdhdG9tLWxpbnRlcidcblhSZWdFeHAgPSByZXF1aXJlICd4cmVnZXhwJ1xuXG5wYXR0ZXJuID0gWFJlZ0V4cCgnKD88ZmlsZT5bXlxcblxccl0rKTooPzxmcm9tX2xpbmU+XFxcXGQrKTooPzxmcm9tX2NvbD5cXFxcZCspOlxcXFxzKlxcXG4gICg/PHRvX2xpbmU+XFxcXGQrKTooPzx0b19jb2w+XFxcXGQrKVxcXFxzK1xcXG4gICgoPzxlcnJvcj5lcnJvcnxmYXRhbCBlcnJvcil8KD88d2FybmluZz53YXJuaW5nKXwoPzxpbmZvPm5vdGV8aGVscCkpOlxcXFxzK1xcXG4gICg/PG1lc3NhZ2U+Lis/KVtcXG5cXHJdKygkfCg/PVteXFxuXFxyXSs6XFxcXGQrKSknLCAncycpXG5cbnBhcnNlT2xkTWVzc2FnZXMgPSAob3V0cHV0LCB7ZGlzYWJsZWRXYXJuaW5ncywgdGV4dEVkaXRvcn0pIC0+XG4gIGVsZW1lbnRzID0gW11cbiAgWFJlZ0V4cC5mb3JFYWNoIG91dHB1dCwgcGF0dGVybiwgKG1hdGNoKSAtPlxuICAgIHJhbmdlID0gaWYgbWF0Y2guZnJvbV9jb2wgPT0gbWF0Y2gudG9fY29sIGFuZCBtYXRjaC5mcm9tX2xpbmUgPT0gbWF0Y2gudG9fbGluZVxuICAgICAgYXRvbV9saW50ZXIuZ2VuZXJhdGVSYW5nZSh0ZXh0RWRpdG9yLCBOdW1iZXIucGFyc2VJbnQobWF0Y2guZnJvbV9saW5lLCAxMCkgLSAxLCBOdW1iZXIucGFyc2VJbnQobWF0Y2guZnJvbV9jb2wsIDEwKSAtIDEpXG4gICAgZWxzZVxuICAgICAgW1xuICAgICAgICBbbWF0Y2guZnJvbV9saW5lIC0gMSwgbWF0Y2guZnJvbV9jb2wgLSAxXSxcbiAgICAgICAgW21hdGNoLnRvX2xpbmUgLSAxLCBtYXRjaC50b19jb2wgLSAxXVxuICAgICAgXVxuICAgIGxldmVsID0gaWYgbWF0Y2guZXJyb3IgdGhlbiAnZXJyb3InXG4gICAgZWxzZSBpZiBtYXRjaC53YXJuaW5nIHRoZW4gJ3dhcm5pbmcnXG4gICAgZWxzZSBpZiBtYXRjaC5pbmZvIHRoZW4gJ2luZm8nXG4gICAgZWxzZSBpZiBtYXRjaC50cmFjZSB0aGVuICd0cmFjZSdcbiAgICBlbHNlIGlmIG1hdGNoLm5vdGUgdGhlbiAnbm90ZSdcbiAgICBlbGVtZW50ID1cbiAgICAgIHR5cGU6IGxldmVsXG4gICAgICBtZXNzYWdlOiBtYXRjaC5tZXNzYWdlXG4gICAgICBmaWxlOiBtYXRjaC5maWxlXG4gICAgICByYW5nZTogcmFuZ2VcbiAgICBlbGVtZW50cy5wdXNoIGVsZW1lbnRcbiAgYnVpbGRNZXNzYWdlcyBlbGVtZW50cywgZGlzYWJsZWRXYXJuaW5nc1xuXG5wYXJzZUpzb25NZXNzYWdlcyA9IChtZXNzYWdlcywge2Rpc2FibGVkV2FybmluZ3N9KSAtPlxuICBlbGVtZW50cyA9IFtdXG4gIGZvciBpbnB1dCBpbiBtZXNzYWdlc1xuICAgIGNvbnRpbnVlIHVubGVzcyBpbnB1dCBhbmQgaW5wdXQuc3BhbnNcbiAgICBwcmltYXJ5X3NwYW4gPSBpbnB1dC5zcGFucy5maW5kIChzcGFuKSAtPiBzcGFuLmlzX3ByaW1hcnlcbiAgICBjb250aW51ZSB1bmxlc3MgcHJpbWFyeV9zcGFuXG4gICAgd2hpbGUgcHJpbWFyeV9zcGFuLmV4cGFuc2lvbiBhbmQgcHJpbWFyeV9zcGFuLmV4cGFuc2lvbi5zcGFuXG4gICAgICBwcmltYXJ5X3NwYW4gPSBwcmltYXJ5X3NwYW4uZXhwYW5zaW9uLnNwYW5cbiAgICByYW5nZSA9IFtcbiAgICAgIFtwcmltYXJ5X3NwYW4ubGluZV9zdGFydCAtIDEsIHByaW1hcnlfc3Bhbi5jb2x1bW5fc3RhcnQgLSAxXSxcbiAgICAgIFtwcmltYXJ5X3NwYW4ubGluZV9lbmQgLSAxLCBwcmltYXJ5X3NwYW4uY29sdW1uX2VuZCAtIDFdXG4gICAgXVxuICAgIGlucHV0LmxldmVsID0gJ2Vycm9yJyBpZiBpbnB1dC5sZXZlbCA9PSAnZmF0YWwgZXJyb3InXG4gICAgZWxlbWVudCA9XG4gICAgICB0eXBlOiBpbnB1dC5sZXZlbFxuICAgICAgbWVzc2FnZTogaW5wdXQubWVzc2FnZVxuICAgICAgZmlsZTogcHJpbWFyeV9zcGFuLmZpbGVfbmFtZVxuICAgICAgcmFuZ2U6IHJhbmdlXG4gICAgICBjaGlsZHJlbjogaW5wdXQuY2hpbGRyZW5cbiAgICBmb3Igc3BhbiBpbiBpbnB1dC5zcGFuc1xuICAgICAgdW5sZXNzIHNwYW4uaXNfcHJpbWFyeVxuICAgICAgICBlbGVtZW50LmNoaWxkcmVuLnB1c2hcbiAgICAgICAgICByYW5nZTogW1xuICAgICAgICAgICAgW3NwYW4ubGluZV9zdGFydCAtIDEsIHNwYW4uY29sdW1uX3N0YXJ0IC0gMV0sXG4gICAgICAgICAgICBbc3Bhbi5saW5lX2VuZCAtIDEsIHNwYW4uY29sdW1uX2VuZCAtIDFdXG4gICAgICAgICAgXVxuICAgIGVsZW1lbnRzLnB1c2ggZWxlbWVudFxuICBidWlsZE1lc3NhZ2VzIGVsZW1lbnRzLCBkaXNhYmxlZFdhcm5pbmdzXG5cbnBhcnNlSnNvbk91dHB1dCA9IChvdXRwdXQsIHtkaXNhYmxlZFdhcm5pbmdzLCBhZGRpdGlvbmFsRmlsdGVyfSApIC0+XG4gIHJlc3VsdHMgPSBvdXRwdXQuc3BsaXQoJ1xcbicpLm1hcCAobWVzc2FnZSkgLT5cbiAgICBtZXNzYWdlID0gbWVzc2FnZS50cmltKClcbiAgICBpZiBtZXNzYWdlLnN0YXJ0c1dpdGggJ3snXG4gICAgICBqc29uID0gSlNPTi5wYXJzZSBtZXNzYWdlXG4gICAgICBpZiBhZGRpdGlvbmFsRmlsdGVyP1xuICAgICAgICBhZGRpdGlvbmFsRmlsdGVyKGpzb24pXG4gICAgICBlbHNlXG4gICAgICAgIGpzb25cbiAgLmZpbHRlciAobSkgLT4gbT9cbiAgcGFyc2VKc29uTWVzc2FnZXMgcmVzdWx0cywge2Rpc2FibGVkV2FybmluZ3N9XG5cbmJ1aWxkTWVzc2FnZXMgPSAoZWxlbWVudHMsIGRpc2FibGVkV2FybmluZ3MpIC0+XG4gIG1lc3NhZ2VzID0gW11cbiAgbGFzdE1lc3NhZ2UgPSBudWxsXG4gIGZvciBlbGVtZW50IGluIGVsZW1lbnRzXG4gICAgc3dpdGNoIGVsZW1lbnQudHlwZVxuICAgICAgd2hlbiAnaW5mbycsICd0cmFjZScsICdub3RlJ1xuICAgICAgICAjIEFkZCBvbmx5IGlmIHRoZXJlIGlzIGEgbGFzdCBtZXNzYWdlXG4gICAgICAgIGlmIGxhc3RNZXNzYWdlXG4gICAgICAgICAgbGFzdE1lc3NhZ2UucmVmZXJlbmNlID0ge1xuICAgICAgICAgICAgZmlsZTogZWxlbWVudC5maWxlXG4gICAgICAgICAgICBwb3NpdGlvbjogZWxlbWVudC5yYW5nZVxuICAgICAgICAgIH1cbiAgICAgIHdoZW4gJ3dhcm5pbmcnXG4gICAgICAgICMgSWYgdGhlIG1lc3NhZ2UgaXMgd2FybmluZyBhbmQgdXNlciBlbmFibGVkIGRpc2FibGluZyB3YXJuaW5nc1xuICAgICAgICAjIENoZWNrIGlmIHRoaXMgd2FybmluZyBpcyBkaXNhYmxlZFxuICAgICAgICBpZiBkaXNhYmxlZFdhcm5pbmdzIGFuZCBkaXNhYmxlZFdhcm5pbmdzLmxlbmd0aCA+IDBcbiAgICAgICAgICBtZXNzYWdlSXNEaXNhYmxlZExpbnQgPSBmYWxzZVxuICAgICAgICAgIGZvciBkaXNhYmxlZFdhcm5pbmcgaW4gZGlzYWJsZWRXYXJuaW5nc1xuICAgICAgICAgICAgIyBGaW5kIGEgZGlzYWJsZWQgbGludCBpbiB3YXJuaW5nIG1lc3NhZ2VcbiAgICAgICAgICAgIGlmIGVsZW1lbnQubWVzc2FnZS5pbmRleE9mKGRpc2FibGVkV2FybmluZykgPj0gMFxuICAgICAgICAgICAgICBtZXNzYWdlSXNEaXNhYmxlZExpbnQgPSB0cnVlXG4gICAgICAgICAgICAgIGxhc3RNZXNzYWdlID0gbnVsbFxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIGlmIG5vdCBtZXNzYWdlSXNEaXNhYmxlZExpbnRcbiAgICAgICAgICAgIGxhc3RNZXNzYWdlID0gY29uc3RydWN0TWVzc2FnZSBcIldhcm5pbmdcIiwgZWxlbWVudFxuICAgICAgICAgICAgbWVzc2FnZXMucHVzaCBsYXN0TWVzc2FnZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbGFzdE1lc3NhZ2UgPSBjb25zdHJ1Y3RNZXNzYWdlIFwiV2FybmluZ1wiICwgZWxlbWVudFxuICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbGFzdE1lc3NhZ2VcbiAgICAgIHdoZW4gJ2Vycm9yJywgJ2ZhdGFsIGVycm9yJ1xuICAgICAgICBsYXN0TWVzc2FnZSA9IGNvbnN0cnVjdE1lc3NhZ2UgXCJFcnJvclwiLCBlbGVtZW50XG4gICAgICAgIG1lc3NhZ2VzLnB1c2ggbGFzdE1lc3NhZ2VcbiAgcmV0dXJuIG1lc3NhZ2VzXG5cbmNvbnN0cnVjdE1lc3NhZ2UgPSAodHlwZSwgZWxlbWVudCkgLT5cbiAgbWVzc2FnZSA9XG4gICAgc2V2ZXJpdHk6IHR5cGUudG9Mb3dlckNhc2UoKVxuICAgIGV4Y2VycHQ6IGVsZW1lbnQubWVzc2FnZVxuICAgIGxvY2F0aW9uOiB7XG4gICAgICBmaWxlOiBlbGVtZW50LmZpbGVcbiAgICAgIHBvc2l0aW9uOiBlbGVtZW50LnJhbmdlXG4gICAgfVxuICAjIGNoaWxkcmVuIGV4aXN0cyBvbmx5IGluIEpTT04gbWVzc2FnZXNcbiAgaWYgZWxlbWVudC5jaGlsZHJlblxuICAgIGZvciBjaGlsZHJlbiBpbiBlbGVtZW50LmNoaWxkcmVuXG4gICAgICBpZiBjaGlsZHJlbi5yYW5nZVxuICAgICAgICAjIE5PVEU6IFdpbGwgb25seSBzYXZlIHRoZSBmaXJzdCB2YWxpZCByZWZlcmVuY2VcbiAgICAgICAgbWVzc2FnZS5yZWZlcmVuY2UgPSB7XG4gICAgICAgICAgZmlsZTogZWxlbWVudC5maWxlXG4gICAgICAgICAgcG9zaXRpb246IGNoaWxkcmVuLnJhbmdlXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgbWVzc2FnZVxuXG5idWlsZFJ1c3RjQXJndW1lbnRzID0gKGxpbnRlciwgcGF0aHMpIC0+XG4gIFtlZGl0aW5nRmlsZSwgY2FyZ29NYW5pZmVzdFBhdGhdID0gcGF0aHNcbiAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbiAoKSA9PlxuICAgIHJ1c3RjQXJncyA9IHN3aXRjaCBsaW50ZXIucnVzdGNCdWlsZFRlc3RcbiAgICAgIHdoZW4gdHJ1ZSB0aGVuIFsnLS1jZmcnLCAndGVzdCddXG4gICAgICBlbHNlIFtdXG4gICAgcnVzdGNBcmdzID0gcnVzdGNBcmdzLmNvbmNhdCBbJy0tY29sb3InLCAnbmV2ZXInXVxuICAgIGNtZCA9IFtsaW50ZXIucnVzdGNQYXRoXVxuICAgICAgLmNvbmNhdCBydXN0Y0FyZ3NcbiAgICBpZiBjYXJnb01hbmlmZXN0UGF0aFxuICAgICAgY21kLnB1c2ggJy1MJ1xuICAgICAgY21kLnB1c2ggcGF0aC5qb2luIHBhdGguZGlybmFtZShjYXJnb01hbmlmZXN0UGF0aCksIGxpbnRlci5jYXJnb0RlcGVuZGVuY3lEaXJcbiAgICBjb21waWxhdGlvbkZlYXR1cmVzID0gbGludGVyLmNvbXBpbGF0aW9uRmVhdHVyZXMoZmFsc2UpXG4gICAgY21kID0gY21kLmNvbmNhdCBjb21waWxhdGlvbkZlYXR1cmVzIGlmIGNvbXBpbGF0aW9uRmVhdHVyZXNcbiAgICBjbWQgPSBjbWQuY29uY2F0IFtlZGl0aW5nRmlsZV1cbiAgICBbZWRpdGluZ0ZpbGUsIGNtZF1cblxuY2FjaGVkVXNpbmdNdWx0aXRvb2xGb3JDbGlwcHkgPSBudWxsXG5cbmJ1aWxkQ2FyZ29Bcmd1bWVudHMgPSAobGludGVyLCBjYXJnb01hbmlmZXN0UGF0aCkgLT5cbiAgYnVpbGRDYXJnb1BhdGggPSAoY2FyZ29QYXRoLCBjYXJnb0NvbW1hbmQpIC0+XG4gICAgIyB0aGUgcmVzdWx0IGlzIGNhY2hlZCB0byBhdm9pZCBkZWxheXNcbiAgICBpZiBjYWNoZWRVc2luZ011bHRpdG9vbEZvckNsaXBweT8gYW5kIGxpbnRlci5hbGxvd2VkVG9DYWNoZVZlcnNpb25zXG4gICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuICgpID0+XG4gICAgICAgIGNhY2hlZFVzaW5nTXVsdGl0b29sRm9yQ2xpcHB5XG4gICAgZWxzZVxuICAgICAgIyBEZWNpZGUgaWYgc2hvdWxkIHVzZSBvbGRlciBtdWx0aXJ1c3Qgb3IgbmV3ZXIgcnVzdHVwXG4gICAgICB1c2luZ011bHRpdG9vbEZvckNsaXBweSA9XG4gICAgICAgIGF0b21fbGludGVyLmV4ZWMgJ3J1c3R1cCcsIFsnLS12ZXJzaW9uJ10sIHtpZ25vcmVFeGl0Q29kZTogdHJ1ZX1cbiAgICAgICAgICAudGhlbiAtPlxuICAgICAgICAgICAgcmVzdWx0OiB0cnVlLCB0b29sOiAncnVzdHVwJ1xuICAgICAgICAgIC5jYXRjaCAtPlxuICAgICAgICAgICAgIyBUcnkgdG8gdXNlIG9sZGVyIG11bHRpcnVzdCBhdCBsZWFzdFxuICAgICAgICAgICAgYXRvbV9saW50ZXIuZXhlYyAnbXVsdGlydXN0JywgWyctLXZlcnNpb24nXSwge2lnbm9yZUV4aXRDb2RlOiB0cnVlfVxuICAgICAgICAgICAgICAudGhlbiAtPlxuICAgICAgICAgICAgICAgIHJlc3VsdDogdHJ1ZSwgdG9vbDogJ211bHRpcnVzdCdcbiAgICAgICAgICAgICAgLmNhdGNoIC0+XG4gICAgICAgICAgICAgICAgcmVzdWx0OiBmYWxzZVxuICAgICAgdXNpbmdNdWx0aXRvb2xGb3JDbGlwcHkudGhlbiAoY2FuVXNlTXVsdGlydXN0KSAtPlxuICAgICAgICBpZiBjYXJnb0NvbW1hbmQgPT0gJ2NsaXBweScgYW5kIGNhblVzZU11bHRpcnVzdC5yZXN1bHRcbiAgICAgICAgICBbY2FuVXNlTXVsdGlydXN0LnRvb2wsICdydW4nLCAnbmlnaHRseScsICdjYXJnbyddXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBbY2FyZ29QYXRoXVxuICAgICAgLnRoZW4gKGNhY2hlZCkgPT5cbiAgICAgICAgY2FjaGVkVXNpbmdNdWx0aXRvb2xGb3JDbGlwcHkgPSBjYWNoZWRcbiAgICAgICAgY2FjaGVkXG5cbiAgY2FyZ29BcmdzID0gc3dpdGNoIGxpbnRlci5jYXJnb0NvbW1hbmRcbiAgICB3aGVuICdjaGVjaycgdGhlbiBbJ2NoZWNrJ11cbiAgICB3aGVuICdjaGVjayBhbGwnIHRoZW4gWydjaGVjaycsICctLWFsbCddXG4gICAgd2hlbiAnY2hlY2sgdGVzdHMnIHRoZW4gWydjaGVjaycsICctLXRlc3RzJ11cbiAgICB3aGVuICd0ZXN0JyB0aGVuIFsndGVzdCcsICctLW5vLXJ1biddXG4gICAgd2hlbiAndGVzdCBhbGwnIHRoZW4gWyd0ZXN0JywgJy0tbm8tcnVuJywgJy0tYWxsJ11cbiAgICB3aGVuICdydXN0YycgdGhlbiBbJ3J1c3RjJywgJy0tY29sb3InLCAnbmV2ZXInXVxuICAgIHdoZW4gJ2NsaXBweScgdGhlbiBbJ2NsaXBweSddXG4gICAgZWxzZSBbJ2J1aWxkJ11cblxuICBjb21waWxhdGlvbkZlYXR1cmVzID0gbGludGVyLmNvbXBpbGF0aW9uRmVhdHVyZXModHJ1ZSlcbiAgYnVpbGRDYXJnb1BhdGgobGludGVyLmNhcmdvUGF0aCwgbGludGVyLmNhcmdvQ29tbWFuZCkudGhlbiAoY21kKSAtPlxuICAgIGNtZCA9IGNtZFxuICAgICAgLmNvbmNhdCBjYXJnb0FyZ3NcbiAgICAgIC5jb25jYXQgWyctaicsIGxpbnRlci5qb2JzTnVtYmVyXVxuICAgIGNtZCA9IGNtZC5jb25jYXQgY29tcGlsYXRpb25GZWF0dXJlcyBpZiBjb21waWxhdGlvbkZlYXR1cmVzXG4gICAgY21kLnB1c2ggXCItLW1hbmlmZXN0LXBhdGg9I3tjYXJnb01hbmlmZXN0UGF0aH1cIlxuICAgIFtjYXJnb01hbmlmZXN0UGF0aCwgY21kXVxuXG4jIFRoZXNlIGRlZmluZSB0aGUgYmVoYWJpb3VyIG9mIGVhY2ggZXJyb3IgbW9kZSBsaW50ZXItcnVzdCBoYXNcbmVycm9yTW9kZXMgPVxuICBKU09OX1JVU1RDOlxuICAgIG5lZWRlZE91dHB1dDogKHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgc3RkZXJyXG5cbiAgICBwYXJzZTogKG91dHB1dCwgb3B0aW9ucykgPT5cbiAgICAgIHBhcnNlSnNvbk91dHB1dCBvdXRwdXQsIG9wdGlvbnNcblxuICAgIGJ1aWxkQXJndW1lbnRzOiAobGludGVyLCBmaWxlKSAtPlxuICAgICAgYnVpbGRSdXN0Y0FyZ3VtZW50cyhsaW50ZXIsIGZpbGUpLnRoZW4gKGNtZF9yZXMpIC0+XG4gICAgICAgIFtmaWxlLCBjbWRdID0gY21kX3Jlc1xuICAgICAgICBjbWQgPSBjbWQuY29uY2F0IFsnLS1lcnJvci1mb3JtYXQ9anNvbiddXG4gICAgICAgIFtmaWxlLCBjbWRdXG5cbiAgSlNPTl9DQVJHTzpcbiAgICBuZWVkZWRPdXRwdXQ6IChzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgIHN0ZG91dFxuXG4gICAgcGFyc2U6IChvdXRwdXQsIG9wdGlvbnMpIC0+XG4gICAgICBvcHRpb25zLmFkZGl0aW9uYWxGaWx0ZXIgPSAoanNvbikgLT5cbiAgICAgICAgaWYganNvbj8gYW5kIGpzb24ucmVhc29uID09IFwiY29tcGlsZXItbWVzc2FnZVwiXG4gICAgICAgICAganNvbi5tZXNzYWdlXG4gICAgICBwYXJzZUpzb25PdXRwdXQgb3V0cHV0LCBvcHRpb25zXG5cbiAgICBidWlsZEFyZ3VtZW50czogKGxpbnRlciwgZmlsZSkgLT5cbiAgICAgIGJ1aWxkQ2FyZ29Bcmd1bWVudHMobGludGVyLCBmaWxlKS50aGVuIChjbWRfcmVzKSAtPlxuICAgICAgICBbZmlsZSwgY21kXSA9IGNtZF9yZXNcbiAgICAgICAgY21kID0gY21kLmNvbmNhdCBbJy0tbWVzc2FnZS1mb3JtYXQnLCAnanNvbiddXG4gICAgICAgIFtmaWxlLCBjbWRdXG5cbiAgRkxBR1NfSlNPTl9DQVJHTzpcbiAgICBuZWVkZWRPdXRwdXQ6IChzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgIHN0ZGVyclxuXG4gICAgcGFyc2U6IHBhcnNlSnNvbk91dHB1dFxuXG4gICAgYnVpbGRBcmd1bWVudHM6IGJ1aWxkQ2FyZ29Bcmd1bWVudHNcblxuICBPTERfUlVTVEM6XG4gICAgbmVlZGVkT3V0cHV0OiAoc3Rkb3V0LCBzdGRlcnIpIC0+XG4gICAgICBzdGRlcnJcblxuICAgIHBhcnNlOiBwYXJzZU9sZE1lc3NhZ2VzXG5cbiAgICBidWlsZEFyZ3VtZW50czogYnVpbGRSdXN0Y0FyZ3VtZW50c1xuXG4gIE9MRF9DQVJHTzpcbiAgICBuZWVkZWRPdXRwdXQ6IChzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgIHN0ZGVyclxuXG4gICAgcGFyc2U6IHBhcnNlT2xkTWVzc2FnZXNcblxuICAgIGJ1aWxkQXJndW1lbnRzOiBidWlsZENhcmdvQXJndW1lbnRzXG5cbm1vZHVsZS5leHBvcnRzID0gZXJyb3JNb2Rlc1xuIl19
