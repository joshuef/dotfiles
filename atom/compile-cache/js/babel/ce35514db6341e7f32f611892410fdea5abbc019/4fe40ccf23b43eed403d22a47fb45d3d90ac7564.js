'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  config: {
    terraformExecutablePath: {
      title: 'Terraform Executable Path',
      type: 'string',
      description: 'Path to Terraform executable (e.g. /usr/local/terraform/bin/terraform) if not in shell env path.',
      'default': 'terraform',
      order: 1
    },
    useTerraformPlan: {
      title: 'Use Terraform Plan',
      description: 'Use \'terraform plan\' instead of \'validate\' for linting (will also display plan errors for directory of current file)',
      type: 'boolean',
      'default': false
    },
    useTerraformFormat: {
      title: 'Use Terraform Fmt',
      description: 'Use \'terraform fmt\' to rewrite all Terraform files in the directory of the current file to a canonical format (occurs before linting).',
      type: 'boolean',
      'default': false
    },
    blacklist: {
      title: 'Exclude Regexp for .tf',
      type: 'string',
      description: 'Regular expression for .tf filenames to ignore (e.g. foo|[bB]ar would ignore afoo.tf and theBar.tf).',
      'default': ''
    },
    globalVarFiles: {
      title: 'Global Var Files',
      type: 'array',
      description: 'Var files specified by absolute paths that should be applied to all projects.',
      'default': [''],
      items: {
        type: 'string'
      }
    },
    localVarFiles: {
      title: 'Local Var Files',
      type: 'array',
      description: 'Var files specified by relative paths to each project that should be applied. If these files are not in the same relative path within each project this will fail.',
      'default': [''],
      items: {
        type: 'string'
      }
    },
    checkRequiredVar: {
      title: 'Check Required Variables',
      type: 'boolean',
      description: 'Check whether all required variables have been specified (unchecking is useful if primarily developing/declaring modules; only works with validate).',
      'default': true
    },
    newVersion: {
      title: 'Terraform >= 0.12 Support Beta',
      type: 'boolean',
      description: 'Your installed version of Terraform is >= 0.12 (feature in beta).',
      'default': false
    }
  },

  // activate linter
  activate: function activate() {
    var helpers = require("atom-linter");

    // check for terraform >= minimum version
    helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), ['destroy', '--help']).then(function (output) {
      if (!/-auto-approve/.exec(output)) {
        atom.notifications.addError('The terraform installed in your path is unsupported.', {
          detail: "Please upgrade your version of Terraform to >= 0.11 or downgrade this package to 1.2.6.\n"
        });
      }
    });

    // if terraform >= 0.12 was selected, validate this is true
    if (atom.config.get('linter-terraform-syntax.newVersion')) {
      helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), ['validate', '--help']).then(function (output) {
        if (!/-json/.exec(output)) {
          atom.notifications.addError('Terraform >= 0.12 selected but not installed.', {
            detail: "Please upgrade your version of Terraform to >= 0.12 or unselect the Terraform >= 0.12 support config setting.\n"
          });
        }
      });
    }
  },

  provideLinter: function provideLinter() {
    return {
      name: 'Terraform',
      grammarScopes: ['source.terraform'],
      scope: 'file',
      lintsOnChange: false,
      lint: function lint(activeEditor) {
        // establish const vars
        var helpers = require('atom-linter');
        var file = process.platform === 'win32' ? activeEditor.getPath().replace(/\\/g, '/') : activeEditor.getPath();
        // try to get file path and handle errors appropriately
        try {
          var dir = require('path').dirname(file);
        } catch (error) {
          // notify on stdin error
          if (/\.dirname/.exec(error.message) != null) {
            atom.notifications.addError('Terraform cannot lint on stdin due to nonexistent pathing on directories. Please save this config to your filesystem.', {
              detail: 'Save this config.'
            });
          }
          // notify on other errors
          else {
              atom.notifications.addError('An error occurred with this package.', {
                detail: error.message
              });
            };
        }

        // bail out if this is on the blacklist
        if (atom.config.get('linter-terraform-syntax.blacklist') !== '') {
          blacklist = new RegExp(atom.config.get('linter-terraform-syntax.blacklist'));
          if (blacklist.exec(file)) return [];
        }

        //atom.workspace.getTextEditors().forEach(function(textEditor) is not iterating over an array for some reason (either empty array from getTextEditors or forEach lambda is wrong probably)
        // bail out if another file is already open from the current directory
        // this prevents displaying the same issues for the same directory multiple times
        /*atom.workspace.getTextEditors().forEach(function(textEditor) {
          const other_file = process.platform === 'win32' ? textEditor.getPath().replace(/\\/g, '/') : textEditor.getPath();
          const other_dir = require('path').dirname(other_file);
          return [{
            severity: 'info',
            excerpt: other_dir,
            location: {
              file: dir,
              position: [[0, 0], [0, 1]],
            },
          }]
          if (dir == other_dir)
            return [];
          // of course, this also prevents displaying new errors if another file from the same directory is open, so block off for now
        });*/

        // regexps for matching syntax errors on output
        var regex_syntax = /Error.*\/(.*\.tf):\sAt\s(\d+):(\d+):\s(.*)/;
        var new_regex_syntax = /Error:.*\/(.*\.tf): (.*:).* at (\d+):(\d+):(.*)/;
        var alt_regex_syntax = /Error:.*\/(.*\.tf): (.*) at (\d+):(\d+):.* at \d+:\d+(: .*)/;
        // regexps for matching non-syntax errors on output
        var dir_error = /\* (.*)/;
        var new_dir_error = /Error: (.*)/;

        // establish args
        var args = atom.config.get('linter-terraform-syntax.useTerraformPlan') ? ['plan'] : ['validate'];
        args.push('-no-color');

        // initialize options with normal defaults
        var options = { cwd: dir, stream: 'stderr', allowEmptyStderr: true };

        // json output for validate if >= 0.12
        if (!atom.config.get('linter-terraform-syntax.useTerraformPlan') && atom.config.get('linter-terraform-syntax.newVersion')) {
          args.push('-json');
          // stdout for json output so also have to ignore exit code
          options = { cwd: dir, ignoreExitCode: true };
        }
        // var inputs are only valid for other than >= 0.12 validate
        else {
            // add global var files
            if (atom.config.get('linter-terraform-syntax.globalVarFiles')[0] != '') for (i = 0; i < atom.config.get('linter-terraform-syntax.globalVarFiles').length; i++) args = args.concat(['-var-file', atom.config.get('linter-terraform-syntax.globalVarFiles')[i]]);

            // add local var files
            if (atom.config.get('linter-terraform-syntax.localVarFiles')[0] != '') for (i = 0; i < atom.config.get('linter-terraform-syntax.localVarFiles').length; i++) args = args.concat(['-var-file', atom.config.get('linter-terraform-syntax.localVarFiles')[i]]);

            // do not check if required variables are specified if desired
            if (!atom.config.get('linter-terraform-syntax.checkRequiredVar') && !atom.config.get('linter-terraform-syntax.useTerraformPlan')) args.push('-check-variables=false');
          }

        // execute terraform fmt if selected
        if (atom.config.get('linter-terraform-syntax.useTerraformFormat')) helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), ['fmt', '-list=false', dir]);

        return helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), args, options).then(function (output) {
          var toReturn = [];

          // new terraform validate will be doing JSON parsing
          if (!atom.config.get('linter-terraform-syntax.useTerraformPlan') && atom.config.get('linter-terraform-syntax.newVersion')) {
            info = JSON.parse(output);

            // command is reporting an issue
            if (info.valid == false) {
              info.diagnostics.forEach(function (issue) {
                // if no range information given we have to improvise
                var file = dir;
                var line_start = 0;
                var line_end = 0;
                var col_start = 0;
                var col_end = 1;

                // we have range information so use it
                if (issue.range != null) {
                  file = issue.range.filename;
                  line_start = issue.range.start.line - 1;
                  line_end = issue.range.start.column - 1;
                  col_start = issue.range.end.line - 1;
                  col_end = issue.range.end.column;
                }
                // otherwise check if we need to fix dir display
                else if (atom.project.relativizePath(file)[0] == dir) file = dir + ' ';

                toReturn.push({
                  severity: issue.severity,
                  excerpt: issue.summary,
                  description: issue.detail,
                  location: {
                    file: file,
                    position: [[line_start, line_end], [col_start, col_end]]
                  }
                });
              });
            }
          }
          // everything else proceeds as normal
          else {
              output.split(/\r?\n/).forEach(function (line) {
                if (process.platform === 'win32') line = line.replace(/\\/g, '/');

                // matchers for output parsing and capturing
                var matches_syntax = regex_syntax.exec(line);
                var matches_new_syntax = new_regex_syntax.exec(line);
                var matches_alt_syntax = alt_regex_syntax.exec(line);
                var matches_dir = dir_error.exec(line);
                var matches_new_dir = new_dir_error.exec(line);
                // ensure useless block info is not captured and displayed
                var matches_block = /occurred/.exec(line);
                // recognize and display when terraform init would be more helpful
                var matches_init = /error satisfying plugin requirements|terraform init/.exec(line);

                // check for syntax errors in directory
                if (matches_syntax != null) {
                  toReturn.push({
                    severity: 'error',
                    excerpt: matches_syntax[4],
                    location: {
                      file: dir + '/' + matches_syntax[1],
                      position: [[Number.parseInt(matches_syntax[2]) - 1, Number.parseInt(matches_syntax[3]) - 1], [Number.parseInt(matches_syntax[2]) - 1, Number.parseInt(matches_syntax[3])]]
                    }
                  });
                }
                // check for new or alternate format syntax errors in directory (alt first since new also captures alt but botches formatting)
                else if (matches_alt_syntax != null || matches_new_syntax != null) {
                    matches = matches_alt_syntax == null ? matches_new_syntax : matches_alt_syntax;

                    toReturn.push({
                      severity: 'error',
                      excerpt: matches[2] + matches[5],
                      location: {
                        file: dir + '/' + matches[1],
                        position: [[Number.parseInt(matches[3]) - 1, Number.parseInt(matches[4]) - 1], [Number.parseInt(matches[3]) - 1, Number.parseInt(matches[4])]]
                      }
                    });
                  }
                  // check for non-syntax errors in directory and account for changes in newer format
                  else if ((matches_dir != null || matches_new_dir != null) && matches_block == null) {
                      matches = matches_dir == null ? matches_new_dir[1] : matches_dir[1];

                      // dir will be relative after linter processes it, so if dir being linted is the root of the project path, then it will be empty on display
                      // https://atom.io/docs/api/v1.9.4/Project#instance-relativizePath
                      // check if the path to the project dir containing the file is the same as the dir containing the file, meaning the file is in the root dir of the project if true
                      if (atom.project.relativizePath(file)[0] == dir)
                        // i would love to improve this later, especially so it could be above the conditionals
                        dir = dir + ' ';

                      toReturn.push({
                        severity: 'error',
                        excerpt: 'Non-syntax error in directory: ' + matches + '.',
                        location: {
                          file: dir,
                          position: [[0, 0], [0, 1]]
                        }
                      });
                    }
              });
            }
          return toReturn;
        });
      }
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXRlcnJhZm9ybS1zeW50YXgvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7OztxQkFFRztBQUNiLFFBQU0sRUFBRTtBQUNOLDJCQUF1QixFQUFFO0FBQ3ZCLFdBQUssRUFBRSwyQkFBMkI7QUFDbEMsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLGtHQUFrRztBQUMvRyxpQkFBUyxXQUFXO0FBQ3BCLFdBQUssRUFBRSxDQUFDO0tBQ1Q7QUFDRCxvQkFBZ0IsRUFBRTtBQUNoQixXQUFLLEVBQUUsb0JBQW9CO0FBQzNCLGlCQUFXLEVBQUUsMEhBQTBIO0FBQ3ZJLFVBQUksRUFBRSxTQUFTO0FBQ2YsaUJBQVMsS0FBSztLQUNmO0FBQ0Qsc0JBQWtCLEVBQUU7QUFDbEIsV0FBSyxFQUFFLG1CQUFtQjtBQUMxQixpQkFBVyxFQUFFLDBJQUEwSTtBQUN2SixVQUFJLEVBQUUsU0FBUztBQUNmLGlCQUFTLEtBQUs7S0FDZjtBQUNELGFBQVMsRUFBRTtBQUNULFdBQUssRUFBRSx3QkFBd0I7QUFDL0IsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLHNHQUFzRztBQUNuSCxpQkFBUyxFQUFFO0tBQ1o7QUFDRCxrQkFBYyxFQUFFO0FBQ2QsV0FBSyxFQUFFLGtCQUFrQjtBQUN6QixVQUFJLEVBQUUsT0FBTztBQUNiLGlCQUFXLEVBQUUsK0VBQStFO0FBQzVGLGlCQUFTLENBQUMsRUFBRSxDQUFDO0FBQ2IsV0FBSyxFQUFFO0FBQ0wsWUFBSSxFQUFFLFFBQVE7T0FDZjtLQUNGO0FBQ0QsaUJBQWEsRUFBRTtBQUNiLFdBQUssRUFBRSxpQkFBaUI7QUFDeEIsVUFBSSxFQUFFLE9BQU87QUFDYixpQkFBVyxFQUFFLG9LQUFvSztBQUNqTCxpQkFBUyxDQUFDLEVBQUUsQ0FBQztBQUNiLFdBQUssRUFBRTtBQUNMLFlBQUksRUFBRSxRQUFR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L1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdGVycmFmb3JtLXN5bnRheC9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNvbmZpZzoge1xuICAgIHRlcnJhZm9ybUV4ZWN1dGFibGVQYXRoOiB7XG4gICAgICB0aXRsZTogJ1RlcnJhZm9ybSBFeGVjdXRhYmxlIFBhdGgnLFxuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gVGVycmFmb3JtIGV4ZWN1dGFibGUgKGUuZy4gL3Vzci9sb2NhbC90ZXJyYWZvcm0vYmluL3RlcnJhZm9ybSkgaWYgbm90IGluIHNoZWxsIGVudiBwYXRoLicsXG4gICAgICBkZWZhdWx0OiAndGVycmFmb3JtJyxcbiAgICAgIG9yZGVyOiAxLFxuICAgIH0sXG4gICAgdXNlVGVycmFmb3JtUGxhbjoge1xuICAgICAgdGl0bGU6ICdVc2UgVGVycmFmb3JtIFBsYW4nLFxuICAgICAgZGVzY3JpcHRpb246ICdVc2UgXFwndGVycmFmb3JtIHBsYW5cXCcgaW5zdGVhZCBvZiBcXCd2YWxpZGF0ZVxcJyBmb3IgbGludGluZyAod2lsbCBhbHNvIGRpc3BsYXkgcGxhbiBlcnJvcnMgZm9yIGRpcmVjdG9yeSBvZiBjdXJyZW50IGZpbGUpJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgdXNlVGVycmFmb3JtRm9ybWF0OiB7XG4gICAgICB0aXRsZTogJ1VzZSBUZXJyYWZvcm0gRm10JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFxcJ3RlcnJhZm9ybSBmbXRcXCcgdG8gcmV3cml0ZSBhbGwgVGVycmFmb3JtIGZpbGVzIGluIHRoZSBkaXJlY3Rvcnkgb2YgdGhlIGN1cnJlbnQgZmlsZSB0byBhIGNhbm9uaWNhbCBmb3JtYXQgKG9jY3VycyBiZWZvcmUgbGludGluZykuJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgYmxhY2tsaXN0OiB7XG4gICAgICB0aXRsZTogJ0V4Y2x1ZGUgUmVnZXhwIGZvciAudGYnLFxuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgLnRmIGZpbGVuYW1lcyB0byBpZ25vcmUgKGUuZy4gZm9vfFtiQl1hciB3b3VsZCBpZ25vcmUgYWZvby50ZiBhbmQgdGhlQmFyLnRmKS4nLFxuICAgICAgZGVmYXVsdDogJycsXG4gICAgfSxcbiAgICBnbG9iYWxWYXJGaWxlczoge1xuICAgICAgdGl0bGU6ICdHbG9iYWwgVmFyIEZpbGVzJyxcbiAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZhciBmaWxlcyBzcGVjaWZpZWQgYnkgYWJzb2x1dGUgcGF0aHMgdGhhdCBzaG91bGQgYmUgYXBwbGllZCB0byBhbGwgcHJvamVjdHMuJyxcbiAgICAgIGRlZmF1bHQ6IFsnJ10sXG4gICAgICBpdGVtczoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgfVxuICAgIH0sXG4gICAgbG9jYWxWYXJGaWxlczoge1xuICAgICAgdGl0bGU6ICdMb2NhbCBWYXIgRmlsZXMnLFxuICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVmFyIGZpbGVzIHNwZWNpZmllZCBieSByZWxhdGl2ZSBwYXRocyB0byBlYWNoIHByb2plY3QgdGhhdCBzaG91bGQgYmUgYXBwbGllZC4gSWYgdGhlc2UgZmlsZXMgYXJlIG5vdCBpbiB0aGUgc2FtZSByZWxhdGl2ZSBwYXRoIHdpdGhpbiBlYWNoIHByb2plY3QgdGhpcyB3aWxsIGZhaWwuJyxcbiAgICAgIGRlZmF1bHQ6IFsnJ10sXG4gICAgICBpdGVtczoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgfVxuICAgIH0sXG4gICAgY2hlY2tSZXF1aXJlZFZhcjoge1xuICAgICAgdGl0bGU6ICdDaGVjayBSZXF1aXJlZCBWYXJpYWJsZXMnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVzY3JpcHRpb246ICdDaGVjayB3aGV0aGVyIGFsbCByZXF1aXJlZCB2YXJpYWJsZXMgaGF2ZSBiZWVuIHNwZWNpZmllZCAodW5jaGVja2luZyBpcyB1c2VmdWwgaWYgcHJpbWFyaWx5IGRldmVsb3BpbmcvZGVjbGFyaW5nIG1vZHVsZXM7IG9ubHkgd29ya3Mgd2l0aCB2YWxpZGF0ZSkuJyxcbiAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgfSxcbiAgICBuZXdWZXJzaW9uOiB7XG4gICAgICB0aXRsZTogJ1RlcnJhZm9ybSA+PSAwLjEyIFN1cHBvcnQgQmV0YScsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgaW5zdGFsbGVkIHZlcnNpb24gb2YgVGVycmFmb3JtIGlzID49IDAuMTIgKGZlYXR1cmUgaW4gYmV0YSkuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH1cbiAgfSxcblxuICAvLyBhY3RpdmF0ZSBsaW50ZXJcbiAgYWN0aXZhdGUoKSB7XG4gICAgY29uc3QgaGVscGVycyA9IHJlcXVpcmUoXCJhdG9tLWxpbnRlclwiKTtcblxuICAgIC8vIGNoZWNrIGZvciB0ZXJyYWZvcm0gPj0gbWluaW11bSB2ZXJzaW9uXG4gICAgaGVscGVycy5leGVjKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudGVycmFmb3JtRXhlY3V0YWJsZVBhdGgnKSwgWydkZXN0cm95JywgJy0taGVscCddKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICBpZiAoISgvLWF1dG8tYXBwcm92ZS8uZXhlYyhvdXRwdXQpKSkge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgJ1RoZSB0ZXJyYWZvcm0gaW5zdGFsbGVkIGluIHlvdXIgcGF0aCBpcyB1bnN1cHBvcnRlZC4nLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRldGFpbDogXCJQbGVhc2UgdXBncmFkZSB5b3VyIHZlcnNpb24gb2YgVGVycmFmb3JtIHRvID49IDAuMTEgb3IgZG93bmdyYWRlIHRoaXMgcGFja2FnZSB0byAxLjIuNi5cXG5cIlxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGlmIHRlcnJhZm9ybSA+PSAwLjEyIHdhcyBzZWxlY3RlZCwgdmFsaWRhdGUgdGhpcyBpcyB0cnVlXG4gICAgaWYgKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubmV3VmVyc2lvbicpKSB7XG4gICAgICBoZWxwZXJzLmV4ZWMoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC50ZXJyYWZvcm1FeGVjdXRhYmxlUGF0aCcpLCBbJ3ZhbGlkYXRlJywgJy0taGVscCddKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICAgIGlmICghKC8tanNvbi8uZXhlYyhvdXRwdXQpKSkge1xuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICdUZXJyYWZvcm0gPj0gMC4xMiBzZWxlY3RlZCBidXQgbm90IGluc3RhbGxlZC4nLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkZXRhaWw6IFwiUGxlYXNlIHVwZ3JhZGUgeW91ciB2ZXJzaW9uIG9mIFRlcnJhZm9ybSB0byA+PSAwLjEyIG9yIHVuc2VsZWN0IHRoZSBUZXJyYWZvcm0gPj0gMC4xMiBzdXBwb3J0IGNvbmZpZyBzZXR0aW5nLlxcblwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6ICdUZXJyYWZvcm0nLFxuICAgICAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UudGVycmFmb3JtJ10sXG4gICAgICBzY29wZTogJ2ZpbGUnLFxuICAgICAgbGludHNPbkNoYW5nZTogZmFsc2UsXG4gICAgICBsaW50OiAoYWN0aXZlRWRpdG9yKSA9PiB7XG4gICAgICAgIC8vIGVzdGFibGlzaCBjb25zdCB2YXJzXG4gICAgICAgIGNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdhdG9tLWxpbnRlcicpO1xuICAgICAgICBjb25zdCBmaWxlID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/IGFjdGl2ZUVkaXRvci5nZXRQYXRoKCkucmVwbGFjZSgvXFxcXC9nLCAnLycpIDogYWN0aXZlRWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgLy8gdHJ5IHRvIGdldCBmaWxlIHBhdGggYW5kIGhhbmRsZSBlcnJvcnMgYXBwcm9wcmlhdGVseVxuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBkaXIgPSByZXF1aXJlKCdwYXRoJykuZGlybmFtZShmaWxlKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlcnJvcikge1xuICAgICAgICAgIC8vIG5vdGlmeSBvbiBzdGRpbiBlcnJvclxuICAgICAgICAgIGlmICgvXFwuZGlybmFtZS8uZXhlYyhlcnJvci5tZXNzYWdlKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICdUZXJyYWZvcm0gY2Fubm90IGxpbnQgb24gc3RkaW4gZHVlIHRvIG5vbmV4aXN0ZW50IHBhdGhpbmcgb24gZGlyZWN0b3JpZXMuIFBsZWFzZSBzYXZlIHRoaXMgY29uZmlnIHRvIHlvdXIgZmlsZXN5c3RlbS4nLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiAnU2F2ZSB0aGlzIGNvbmZpZy4nXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIG5vdGlmeSBvbiBvdGhlciBlcnJvcnNcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgJ0FuIGVycm9yIG9jY3VycmVkIHdpdGggdGhpcyBwYWNrYWdlLicsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IGVycm9yLm1lc3NhZ2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmFpbCBvdXQgaWYgdGhpcyBpcyBvbiB0aGUgYmxhY2tsaXN0XG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4LmJsYWNrbGlzdCcpICE9PSAnJykge1xuICAgICAgICAgIGJsYWNrbGlzdCA9IG5ldyBSZWdFeHAoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5ibGFja2xpc3QnKSlcbiAgICAgICAgICBpZiAoYmxhY2tsaXN0LmV4ZWMoZmlsZSkpXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICAvL2F0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZm9yRWFjaChmdW5jdGlvbih0ZXh0RWRpdG9yKSBpcyBub3QgaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgZm9yIHNvbWUgcmVhc29uIChlaXRoZXIgZW1wdHkgYXJyYXkgZnJvbSBnZXRUZXh0RWRpdG9ycyBvciBmb3JFYWNoIGxhbWJkYSBpcyB3cm9uZyBwcm9iYWJseSlcbiAgICAgICAgLy8gYmFpbCBvdXQgaWYgYW5vdGhlciBmaWxlIGlzIGFscmVhZHkgb3BlbiBmcm9tIHRoZSBjdXJyZW50IGRpcmVjdG9yeVxuICAgICAgICAvLyB0aGlzIHByZXZlbnRzIGRpc3BsYXlpbmcgdGhlIHNhbWUgaXNzdWVzIGZvciB0aGUgc2FtZSBkaXJlY3RvcnkgbXVsdGlwbGUgdGltZXNcbiAgICAgICAgLyphdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLmZvckVhY2goZnVuY3Rpb24odGV4dEVkaXRvcikge1xuICAgICAgICAgIGNvbnN0IG90aGVyX2ZpbGUgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID8gdGV4dEVkaXRvci5nZXRQYXRoKCkucmVwbGFjZSgvXFxcXC9nLCAnLycpIDogdGV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgICAgY29uc3Qgb3RoZXJfZGlyID0gcmVxdWlyZSgncGF0aCcpLmRpcm5hbWUob3RoZXJfZmlsZSk7XG4gICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgICAgICAgICAgZXhjZXJwdDogb3RoZXJfZGlyLFxuICAgICAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgICAgZmlsZTogZGlyLFxuICAgICAgICAgICAgICBwb3NpdGlvbjogW1swLCAwXSwgWzAsIDFdXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfV1cbiAgICAgICAgICBpZiAoZGlyID09IG90aGVyX2RpcilcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAvLyBvZiBjb3Vyc2UsIHRoaXMgYWxzbyBwcmV2ZW50cyBkaXNwbGF5aW5nIG5ldyBlcnJvcnMgaWYgYW5vdGhlciBmaWxlIGZyb20gdGhlIHNhbWUgZGlyZWN0b3J5IGlzIG9wZW4sIHNvIGJsb2NrIG9mZiBmb3Igbm93XG4gICAgICAgIH0pOyovXG5cbiAgICAgICAgLy8gcmVnZXhwcyBmb3IgbWF0Y2hpbmcgc3ludGF4IGVycm9ycyBvbiBvdXRwdXRcbiAgICAgICAgY29uc3QgcmVnZXhfc3ludGF4ID0gL0Vycm9yLipcXC8oLipcXC50Zik6XFxzQXRcXHMoXFxkKyk6KFxcZCspOlxccyguKikvO1xuICAgICAgICBjb25zdCBuZXdfcmVnZXhfc3ludGF4ID0gL0Vycm9yOi4qXFwvKC4qXFwudGYpOiAoLio6KS4qIGF0IChcXGQrKTooXFxkKyk6KC4qKS87XG4gICAgICAgIGNvbnN0IGFsdF9yZWdleF9zeW50YXggPSAvRXJyb3I6LipcXC8oLipcXC50Zik6ICguKikgYXQgKFxcZCspOihcXGQrKTouKiBhdCBcXGQrOlxcZCsoOiAuKikvO1xuICAgICAgICAvLyByZWdleHBzIGZvciBtYXRjaGluZyBub24tc3ludGF4IGVycm9ycyBvbiBvdXRwdXRcbiAgICAgICAgY29uc3QgZGlyX2Vycm9yID0gL1xcKiAoLiopLztcbiAgICAgICAgY29uc3QgbmV3X2Rpcl9lcnJvciA9IC9FcnJvcjogKC4qKS87XG5cbiAgICAgICAgLy8gZXN0YWJsaXNoIGFyZ3NcbiAgICAgICAgdmFyIGFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4LnVzZVRlcnJhZm9ybVBsYW4nKSA/IFsncGxhbiddIDogWyd2YWxpZGF0ZSddO1xuICAgICAgICBhcmdzLnB1c2goJy1uby1jb2xvcicpO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgb3B0aW9ucyB3aXRoIG5vcm1hbCBkZWZhdWx0c1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHsgY3dkOiBkaXIsIHN0cmVhbTogJ3N0ZGVycicsIGFsbG93RW1wdHlTdGRlcnI6IHRydWUgfVxuXG4gICAgICAgIC8vIGpzb24gb3V0cHV0IGZvciB2YWxpZGF0ZSBpZiA+PSAwLjEyXG4gICAgICAgIGlmICghKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtUGxhbicpKSAmJiBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lm5ld1ZlcnNpb24nKSkge1xuICAgICAgICAgIGFyZ3MucHVzaCgnLWpzb24nKVxuICAgICAgICAgIC8vIHN0ZG91dCBmb3IganNvbiBvdXRwdXQgc28gYWxzbyBoYXZlIHRvIGlnbm9yZSBleGl0IGNvZGVcbiAgICAgICAgICBvcHRpb25zID0geyBjd2Q6IGRpciwgaWdub3JlRXhpdENvZGU6IHRydWUgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHZhciBpbnB1dHMgYXJlIG9ubHkgdmFsaWQgZm9yIG90aGVyIHRoYW4gPj0gMC4xMiB2YWxpZGF0ZVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAvLyBhZGQgZ2xvYmFsIHZhciBmaWxlc1xuICAgICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lmdsb2JhbFZhckZpbGVzJylbMF0gIT0gJycpXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5nbG9iYWxWYXJGaWxlcycpLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICBhcmdzID0gYXJncy5jb25jYXQoWyctdmFyLWZpbGUnLCBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lmdsb2JhbFZhckZpbGVzJylbaV1dKTtcblxuICAgICAgICAgIC8vIGFkZCBsb2NhbCB2YXIgZmlsZXNcbiAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5sb2NhbFZhckZpbGVzJylbMF0gIT0gJycpXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5sb2NhbFZhckZpbGVzJykubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgIGFyZ3MgPSBhcmdzLmNvbmNhdChbJy12YXItZmlsZScsIGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubG9jYWxWYXJGaWxlcycpW2ldXSk7XG5cbiAgICAgICAgICAvLyBkbyBub3QgY2hlY2sgaWYgcmVxdWlyZWQgdmFyaWFibGVzIGFyZSBzcGVjaWZpZWQgaWYgZGVzaXJlZFxuICAgICAgICAgIGlmICghKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXguY2hlY2tSZXF1aXJlZFZhcicpKSAmJiAhKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtUGxhbicpKSlcbiAgICAgICAgICAgIGFyZ3MucHVzaCgnLWNoZWNrLXZhcmlhYmxlcz1mYWxzZScpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBleGVjdXRlIHRlcnJhZm9ybSBmbXQgaWYgc2VsZWN0ZWRcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtRm9ybWF0JykpXG4gICAgICAgICAgaGVscGVycy5leGVjKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudGVycmFmb3JtRXhlY3V0YWJsZVBhdGgnKSwgWydmbXQnLCAnLWxpc3Q9ZmFsc2UnLCBkaXJdKVxuXG4gICAgICAgIHJldHVybiBoZWxwZXJzLmV4ZWMoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC50ZXJyYWZvcm1FeGVjdXRhYmxlUGF0aCcpLCBhcmdzLCBvcHRpb25zKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICAgICAgdmFyIHRvUmV0dXJuID0gW107XG5cbiAgICAgICAgICAvLyBuZXcgdGVycmFmb3JtIHZhbGlkYXRlIHdpbGwgYmUgZG9pbmcgSlNPTiBwYXJzaW5nXG4gICAgICAgICAgaWYgKCEoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC51c2VUZXJyYWZvcm1QbGFuJykpICYmIGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubmV3VmVyc2lvbicpKSB7XG4gICAgICAgICAgICBpbmZvID0gSlNPTi5wYXJzZShvdXRwdXQpXG5cbiAgICAgICAgICAgIC8vIGNvbW1hbmQgaXMgcmVwb3J0aW5nIGFuIGlzc3VlXG4gICAgICAgICAgICBpZiAoaW5mby52YWxpZCA9PSBmYWxzZSkge1xuICAgICAgICAgICAgICBpbmZvLmRpYWdub3N0aWNzLmZvckVhY2goZnVuY3Rpb24gKGlzc3VlKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm8gcmFuZ2UgaW5mb3JtYXRpb24gZ2l2ZW4gd2UgaGF2ZSB0byBpbXByb3Zpc2VcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IGRpcjtcbiAgICAgICAgICAgICAgICB2YXIgbGluZV9zdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVfZW5kID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY29sX3N0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY29sX2VuZCA9IDE7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIHJhbmdlIGluZm9ybWF0aW9uIHNvIHVzZSBpdFxuICAgICAgICAgICAgICAgIGlmIChpc3N1ZS5yYW5nZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBmaWxlID0gaXNzdWUucmFuZ2UuZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgICBsaW5lX3N0YXJ0ID0gaXNzdWUucmFuZ2Uuc3RhcnQubGluZSAtIDE7XG4gICAgICAgICAgICAgICAgICBsaW5lX2VuZCA9IGlzc3VlLnJhbmdlLnN0YXJ0LmNvbHVtbiAtIDE7XG4gICAgICAgICAgICAgICAgICBjb2xfc3RhcnQgPSBpc3N1ZS5yYW5nZS5lbmQubGluZSAtIDE7XG4gICAgICAgICAgICAgICAgICBjb2xfZW5kID0gaXNzdWUucmFuZ2UuZW5kLmNvbHVtbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIHdlIG5lZWQgdG8gZml4IGRpciBkaXNwbGF5XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGZpbGUpWzBdID09IGRpcilcbiAgICAgICAgICAgICAgICAgIGZpbGUgPSBkaXIgKyAnICdcblxuICAgICAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6IGlzc3VlLnNldmVyaXR5LFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogaXNzdWUuc3VtbWFyeSxcbiAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpc3N1ZS5kZXRhaWwsXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1tsaW5lX3N0YXJ0LCBsaW5lX2VuZF0sIFtjb2xfc3RhcnQsIGNvbF9lbmRdXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2UgcHJvY2VlZHMgYXMgbm9ybWFsXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKVxuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL1xcXFwvZywgJy8nKVxuXG4gICAgICAgICAgICAgIC8vIG1hdGNoZXJzIGZvciBvdXRwdXQgcGFyc2luZyBhbmQgY2FwdHVyaW5nXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfc3ludGF4ID0gcmVnZXhfc3ludGF4LmV4ZWMobGluZSk7XG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfbmV3X3N5bnRheCA9IG5ld19yZWdleF9zeW50YXguZXhlYyhsaW5lKTtcbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc19hbHRfc3ludGF4ID0gYWx0X3JlZ2V4X3N5bnRheC5leGVjKGxpbmUpO1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzX2RpciA9IGRpcl9lcnJvci5leGVjKGxpbmUpO1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzX25ld19kaXIgPSBuZXdfZGlyX2Vycm9yLmV4ZWMobGluZSk7XG4gICAgICAgICAgICAgIC8vIGVuc3VyZSB1c2VsZXNzIGJsb2NrIGluZm8gaXMgbm90IGNhcHR1cmVkIGFuZCBkaXNwbGF5ZWRcbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc19ibG9jayA9IC9vY2N1cnJlZC8uZXhlYyhsaW5lKTtcbiAgICAgICAgICAgICAgLy8gcmVjb2duaXplIGFuZCBkaXNwbGF5IHdoZW4gdGVycmFmb3JtIGluaXQgd291bGQgYmUgbW9yZSBoZWxwZnVsXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfaW5pdCA9IC9lcnJvciBzYXRpc2Z5aW5nIHBsdWdpbiByZXF1aXJlbWVudHN8dGVycmFmb3JtIGluaXQvLmV4ZWMobGluZSlcblxuICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3ludGF4IGVycm9ycyBpbiBkaXJlY3RvcnlcbiAgICAgICAgICAgICAgaWYgKG1hdGNoZXNfc3ludGF4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0b1JldHVybi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogbWF0Y2hlc19zeW50YXhbNF0sXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXIgKyAnLycgKyBtYXRjaGVzX3N5bnRheFsxXSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFtbTnVtYmVyLnBhcnNlSW50KG1hdGNoZXNfc3ludGF4WzJdKSAtIDEsIE51bWJlci5wYXJzZUludChtYXRjaGVzX3N5bnRheFszXSkgLSAxXSwgW051bWJlci5wYXJzZUludChtYXRjaGVzX3N5bnRheFsyXSkgLSAxLCBOdW1iZXIucGFyc2VJbnQobWF0Y2hlc19zeW50YXhbM10pXV0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBuZXcgb3IgYWx0ZXJuYXRlIGZvcm1hdCBzeW50YXggZXJyb3JzIGluIGRpcmVjdG9yeSAoYWx0IGZpcnN0IHNpbmNlIG5ldyBhbHNvIGNhcHR1cmVzIGFsdCBidXQgYm90Y2hlcyBmb3JtYXR0aW5nKVxuICAgICAgICAgICAgICBlbHNlIGlmICgobWF0Y2hlc19hbHRfc3ludGF4ICE9IG51bGwpIHx8IChtYXRjaGVzX25ld19zeW50YXggIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gbWF0Y2hlc19hbHRfc3ludGF4ID09IG51bGwgPyBtYXRjaGVzX25ld19zeW50YXggOiBtYXRjaGVzX2FsdF9zeW50YXg7XG5cbiAgICAgICAgICAgICAgICB0b1JldHVybi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogbWF0Y2hlc1syXSArIG1hdGNoZXNbNV0sXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXIgKyAnLycgKyBtYXRjaGVzWzFdLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1tOdW1iZXIucGFyc2VJbnQobWF0Y2hlc1szXSkgLSAxLCBOdW1iZXIucGFyc2VJbnQobWF0Y2hlc1s0XSkgLSAxXSwgW051bWJlci5wYXJzZUludChtYXRjaGVzWzNdKSAtIDEsIE51bWJlci5wYXJzZUludChtYXRjaGVzWzRdKV1dLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igbm9uLXN5bnRheCBlcnJvcnMgaW4gZGlyZWN0b3J5IGFuZCBhY2NvdW50IGZvciBjaGFuZ2VzIGluIG5ld2VyIGZvcm1hdFxuICAgICAgICAgICAgICBlbHNlIGlmICgobWF0Y2hlc19kaXIgIT0gbnVsbCB8fCBtYXRjaGVzX25ld19kaXIgIT0gbnVsbCkgJiYgbWF0Y2hlc19ibG9jayA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXNfZGlyID09IG51bGwgPyBtYXRjaGVzX25ld19kaXJbMV0gOiBtYXRjaGVzX2RpclsxXVxuXG4gICAgICAgICAgICAgICAgLy8gZGlyIHdpbGwgYmUgcmVsYXRpdmUgYWZ0ZXIgbGludGVyIHByb2Nlc3NlcyBpdCwgc28gaWYgZGlyIGJlaW5nIGxpbnRlZCBpcyB0aGUgcm9vdCBvZiB0aGUgcHJvamVjdCBwYXRoLCB0aGVuIGl0IHdpbGwgYmUgZW1wdHkgb24gZGlzcGxheVxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS92MS45LjQvUHJvamVjdCNpbnN0YW5jZS1yZWxhdGl2aXplUGF0aFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBwYXRoIHRvIHRoZSBwcm9qZWN0IGRpciBjb250YWluaW5nIHRoZSBmaWxlIGlzIHRoZSBzYW1lIGFzIHRoZSBkaXIgY29udGFpbmluZyB0aGUgZmlsZSwgbWVhbmluZyB0aGUgZmlsZSBpcyBpbiB0aGUgcm9vdCBkaXIgb2YgdGhlIHByb2plY3QgaWYgdHJ1ZVxuICAgICAgICAgICAgICAgIGlmIChhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZSlbMF0gPT0gZGlyKVxuICAgICAgICAgICAgICAgICAgLy8gaSB3b3VsZCBsb3ZlIHRvIGltcHJvdmUgdGhpcyBsYXRlciwgZXNwZWNpYWxseSBzbyBpdCBjb3VsZCBiZSBhYm92ZSB0aGUgY29uZGl0aW9uYWxzXG4gICAgICAgICAgICAgICAgICBkaXIgPSBkaXIgKyAnICdcblxuICAgICAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICBleGNlcnB0OiAnTm9uLXN5bnRheCBlcnJvciBpbiBkaXJlY3Rvcnk6ICcgKyBtYXRjaGVzICsgJy4nLFxuICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogZGlyLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1swLCAwXSwgWzAsIDFdXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdG9SZXR1cm47XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG4iXX0=