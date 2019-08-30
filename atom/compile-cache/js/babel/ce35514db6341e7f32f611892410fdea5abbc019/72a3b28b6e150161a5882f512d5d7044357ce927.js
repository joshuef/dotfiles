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
      title: 'Terraform >= 0.12 Support',
      type: 'boolean',
      description: 'Your installed version of Terraform is >= 0.12.',
      'default': false
    }
  },

  // activate linter
  activate: function activate() {
    var helpers = require("atom-linter");

    // auto-detect terraform >= 0.12
    helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), ['validate', '--help']).then(function (output) {
      if (/-json/.exec(output))
        // terraform >= 0.12
        atom.config.set('linter-terraform-syntax.newVersion', true);else {
        // terraform < 0.12
        atom.config.set('linter-terraform-syntax.newVersion', false);

        // check for terraform >= minimum version since it is < 0.12
        helpers.exec(atom.config.get('linter-terraform-syntax.terraformExecutablePath'), ['destroy', '--help']).then(function (output) {
          if (!/-auto-approve/.exec(output)) {
            atom.notifications.addError('The terraform installed in your path is unsupported.', {
              detail: "Please upgrade your version of Terraform to >= 0.11 or downgrade this package to 1.2.6.\n"
            });
          }
        });
      }
    });
  },

  provideLinter: function provideLinter() {
    return {
      name: 'Terraform',
      grammarScopes: ['source.terraform'],
      scope: 'project',
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
            if (atom.config.get('linter-terraform-syntax.globalVarFiles')[0] != '') for (i = 0; i < atom.config.get('linter-terraform-syntax.globalVarFiles').length; i++) args.push.apply(args, ['-var-file', atom.config.get('linter-terraform-syntax.globalVarFiles')[i]]);

            // add local var files
            if (atom.config.get('linter-terraform-syntax.localVarFiles')[0] != '') for (i = 0; i < atom.config.get('linter-terraform-syntax.localVarFiles').length; i++) args.push.apply(args, ['-var-file', atom.config.get('linter-terraform-syntax.localVarFiles')[i]]);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXRlcnJhZm9ybS1zeW50YXgvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7OztxQkFFRztBQUNiLFFBQU0sRUFBRTtBQUNOLDJCQUF1QixFQUFFO0FBQ3ZCLFdBQUssRUFBRSwyQkFBMkI7QUFDbEMsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLGtHQUFrRztBQUMvRyxpQkFBUyxXQUFXO0FBQ3BCLFdBQUssRUFBRSxDQUFDO0tBQ1Q7QUFDRCxvQkFBZ0IsRUFBRTtBQUNoQixXQUFLLEVBQUUsb0JBQW9CO0FBQzNCLGlCQUFXLEVBQUUsMEhBQTBIO0FBQ3ZJLFVBQUksRUFBRSxTQUFTO0FBQ2YsaUJBQVMsS0FBSztLQUNmO0FBQ0Qsc0JBQWtCLEVBQUU7QUFDbEIsV0FBSyxFQUFFLG1CQUFtQjtBQUMxQixpQkFBVyxFQUFFLDBJQUEwSTtBQUN2SixVQUFJLEVBQUUsU0FBUztBQUNmLGlCQUFTLEtBQUs7S0FDZjtBQUNELGFBQVMsRUFBRTtBQUNULFdBQUssRUFBRSx3QkFBd0I7QUFDL0IsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLHNHQUFzRztBQUNuSCxpQkFBUyxFQUFFO0tBQ1o7QUFDRCxrQkFBYyxFQUFFO0FBQ2QsV0FBSyxFQUFFLGtCQUFrQjtBQUN6QixVQUFJLEVBQUUsT0FBTztBQUNiLGlCQUFXLEVBQUUsK0VBQStFO0FBQzVGLGlCQUFTLENBQUMsRUFBRSxDQUFDO0FBQ2IsV0FBSyxFQUFFO0FBQ0wsWUFBSSxFQUFFLFFBQVE7T0FDZjtLQUNGO0FBQ0QsaUJBQWEsRUFBRTtBQUNiLFdBQUssRUFBRSxpQkFBaUI7QUFDeEIsVUFBSSxFQUFFLE9BQU87QUFDYixpQkFBVyxFQUFFLG9LQUFvSztBQUNqTCxpQkFBUyxDQUFDLEVBQUUsQ0FBQztBQUNiLFdBQUssRUFBRTtBQUNMLFlBQUksRUFBRSxRQUFR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LXRlcnJhZm9ybS1zeW50YXgvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICBjb25maWc6IHtcbiAgICB0ZXJyYWZvcm1FeGVjdXRhYmxlUGF0aDoge1xuICAgICAgdGl0bGU6ICdUZXJyYWZvcm0gRXhlY3V0YWJsZSBQYXRoJyxcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIFRlcnJhZm9ybSBleGVjdXRhYmxlIChlLmcuIC91c3IvbG9jYWwvdGVycmFmb3JtL2Jpbi90ZXJyYWZvcm0pIGlmIG5vdCBpbiBzaGVsbCBlbnYgcGF0aC4nLFxuICAgICAgZGVmYXVsdDogJ3RlcnJhZm9ybScsXG4gICAgICBvcmRlcjogMSxcbiAgICB9LFxuICAgIHVzZVRlcnJhZm9ybVBsYW46IHtcbiAgICAgIHRpdGxlOiAnVXNlIFRlcnJhZm9ybSBQbGFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFxcJ3RlcnJhZm9ybSBwbGFuXFwnIGluc3RlYWQgb2YgXFwndmFsaWRhdGVcXCcgZm9yIGxpbnRpbmcgKHdpbGwgYWxzbyBkaXNwbGF5IHBsYW4gZXJyb3JzIGZvciBkaXJlY3Rvcnkgb2YgY3VycmVudCBmaWxlKScsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIHVzZVRlcnJhZm9ybUZvcm1hdDoge1xuICAgICAgdGl0bGU6ICdVc2UgVGVycmFmb3JtIEZtdCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBcXCd0ZXJyYWZvcm0gZm10XFwnIHRvIHJld3JpdGUgYWxsIFRlcnJhZm9ybSBmaWxlcyBpbiB0aGUgZGlyZWN0b3J5IG9mIHRoZSBjdXJyZW50IGZpbGUgdG8gYSBjYW5vbmljYWwgZm9ybWF0IChvY2N1cnMgYmVmb3JlIGxpbnRpbmcpLicsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIGJsYWNrbGlzdDoge1xuICAgICAgdGl0bGU6ICdFeGNsdWRlIFJlZ2V4cCBmb3IgLnRmJyxcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWd1bGFyIGV4cHJlc3Npb24gZm9yIC50ZiBmaWxlbmFtZXMgdG8gaWdub3JlIChlLmcuIGZvb3xbYkJdYXIgd291bGQgaWdub3JlIGFmb28udGYgYW5kIHRoZUJhci50ZikuJyxcbiAgICAgIGRlZmF1bHQ6ICcnLFxuICAgIH0sXG4gICAgZ2xvYmFsVmFyRmlsZXM6IHtcbiAgICAgIHRpdGxlOiAnR2xvYmFsIFZhciBGaWxlcycsXG4gICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgZGVzY3JpcHRpb246ICdWYXIgZmlsZXMgc3BlY2lmaWVkIGJ5IGFic29sdXRlIHBhdGhzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gYWxsIHByb2plY3RzLicsXG4gICAgICBkZWZhdWx0OiBbJyddLFxuICAgICAgaXRlbXM6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIH1cbiAgICB9LFxuICAgIGxvY2FsVmFyRmlsZXM6IHtcbiAgICAgIHRpdGxlOiAnTG9jYWwgVmFyIEZpbGVzJyxcbiAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZhciBmaWxlcyBzcGVjaWZpZWQgYnkgcmVsYXRpdmUgcGF0aHMgdG8gZWFjaCBwcm9qZWN0IHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQuIElmIHRoZXNlIGZpbGVzIGFyZSBub3QgaW4gdGhlIHNhbWUgcmVsYXRpdmUgcGF0aCB3aXRoaW4gZWFjaCBwcm9qZWN0IHRoaXMgd2lsbCBmYWlsLicsXG4gICAgICBkZWZhdWx0OiBbJyddLFxuICAgICAgaXRlbXM6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIH1cbiAgICB9LFxuICAgIGNoZWNrUmVxdWlyZWRWYXI6IHtcbiAgICAgIHRpdGxlOiAnQ2hlY2sgUmVxdWlyZWQgVmFyaWFibGVzJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgd2hldGhlciBhbGwgcmVxdWlyZWQgdmFyaWFibGVzIGhhdmUgYmVlbiBzcGVjaWZpZWQgKHVuY2hlY2tpbmcgaXMgdXNlZnVsIGlmIHByaW1hcmlseSBkZXZlbG9waW5nL2RlY2xhcmluZyBtb2R1bGVzOyBvbmx5IHdvcmtzIHdpdGggdmFsaWRhdGUpLicsXG4gICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgbmV3VmVyc2lvbjoge1xuICAgICAgdGl0bGU6ICdUZXJyYWZvcm0gPj0gMC4xMiBTdXBwb3J0JyxcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnWW91ciBpbnN0YWxsZWQgdmVyc2lvbiBvZiBUZXJyYWZvcm0gaXMgPj0gMC4xMi4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfVxuICB9LFxuXG4gIC8vIGFjdGl2YXRlIGxpbnRlclxuICBhY3RpdmF0ZSgpIHtcbiAgICBjb25zdCBoZWxwZXJzID0gcmVxdWlyZShcImF0b20tbGludGVyXCIpO1xuXG4gICAgLy8gYXV0by1kZXRlY3QgdGVycmFmb3JtID49IDAuMTJcbiAgICBoZWxwZXJzLmV4ZWMoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC50ZXJyYWZvcm1FeGVjdXRhYmxlUGF0aCcpLCBbJ3ZhbGlkYXRlJywgJy0taGVscCddKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICBpZiAoLy1qc29uLy5leGVjKG91dHB1dCkpXG4gICAgICAgIC8vIHRlcnJhZm9ybSA+PSAwLjEyXG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubmV3VmVyc2lvbicsIHRydWUpXG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gdGVycmFmb3JtIDwgMC4xMlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lm5ld1ZlcnNpb24nLCBmYWxzZSlcblxuICAgICAgICAvLyBjaGVjayBmb3IgdGVycmFmb3JtID49IG1pbmltdW0gdmVyc2lvbiBzaW5jZSBpdCBpcyA8IDAuMTJcbiAgICAgICAgaGVscGVycy5leGVjKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudGVycmFmb3JtRXhlY3V0YWJsZVBhdGgnKSwgWydkZXN0cm95JywgJy0taGVscCddKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICAgICAgaWYgKCEoLy1hdXRvLWFwcHJvdmUvLmV4ZWMob3V0cHV0KSkpIHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgJ1RoZSB0ZXJyYWZvcm0gaW5zdGFsbGVkIGluIHlvdXIgcGF0aCBpcyB1bnN1cHBvcnRlZC4nLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcIlBsZWFzZSB1cGdyYWRlIHlvdXIgdmVyc2lvbiBvZiBUZXJyYWZvcm0gdG8gPj0gMC4xMSBvciBkb3duZ3JhZGUgdGhpcyBwYWNrYWdlIHRvIDEuMi42LlxcblwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBwcm92aWRlTGludGVyKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnVGVycmFmb3JtJyxcbiAgICAgIGdyYW1tYXJTY29wZXM6IFsnc291cmNlLnRlcnJhZm9ybSddLFxuICAgICAgc2NvcGU6ICdwcm9qZWN0JyxcbiAgICAgIGxpbnRzT25DaGFuZ2U6IGZhbHNlLFxuICAgICAgbGludDogKGFjdGl2ZUVkaXRvcikgPT4ge1xuICAgICAgICAvLyBlc3RhYmxpc2ggY29uc3QgdmFyc1xuICAgICAgICBjb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnYXRvbS1saW50ZXInKTtcbiAgICAgICAgY29uc3QgZmlsZSA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyBhY3RpdmVFZGl0b3IuZ2V0UGF0aCgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKSA6IGFjdGl2ZUVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIC8vIHRyeSB0byBnZXQgZmlsZSBwYXRoIGFuZCBoYW5kbGUgZXJyb3JzIGFwcHJvcHJpYXRlbHlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB2YXIgZGlyID0gcmVxdWlyZSgncGF0aCcpLmRpcm5hbWUoZmlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAvLyBub3RpZnkgb24gc3RkaW4gZXJyb3JcbiAgICAgICAgICBpZiAoL1xcLmRpcm5hbWUvLmV4ZWMoZXJyb3IubWVzc2FnZSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgICAgICAgICAnVGVycmFmb3JtIGNhbm5vdCBsaW50IG9uIHN0ZGluIGR1ZSB0byBub25leGlzdGVudCBwYXRoaW5nIG9uIGRpcmVjdG9yaWVzLiBQbGVhc2Ugc2F2ZSB0aGlzIGNvbmZpZyB0byB5b3VyIGZpbGVzeXN0ZW0uJyxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRldGFpbDogJ1NhdmUgdGhpcyBjb25maWcuJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBub3RpZnkgb24gb3RoZXIgZXJyb3JzXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICdBbiBlcnJvciBvY2N1cnJlZCB3aXRoIHRoaXMgcGFja2FnZS4nLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJhaWwgb3V0IGlmIHRoaXMgaXMgb24gdGhlIGJsYWNrbGlzdFxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5ibGFja2xpc3QnKSAhPT0gJycpIHtcbiAgICAgICAgICBibGFja2xpc3QgPSBuZXcgUmVnRXhwKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXguYmxhY2tsaXN0JykpXG4gICAgICAgICAgaWYgKGJsYWNrbGlzdC5leGVjKGZpbGUpKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVnZXhwcyBmb3IgbWF0Y2hpbmcgc3ludGF4IGVycm9ycyBvbiBvdXRwdXRcbiAgICAgICAgY29uc3QgcmVnZXhfc3ludGF4ID0gL0Vycm9yLipcXC8oLipcXC50Zik6XFxzQXRcXHMoXFxkKyk6KFxcZCspOlxccyguKikvO1xuICAgICAgICBjb25zdCBuZXdfcmVnZXhfc3ludGF4ID0gL0Vycm9yOi4qXFwvKC4qXFwudGYpOiAoLio6KS4qIGF0IChcXGQrKTooXFxkKyk6KC4qKS87XG4gICAgICAgIGNvbnN0IGFsdF9yZWdleF9zeW50YXggPSAvRXJyb3I6LipcXC8oLipcXC50Zik6ICguKikgYXQgKFxcZCspOihcXGQrKTouKiBhdCBcXGQrOlxcZCsoOiAuKikvO1xuICAgICAgICAvLyByZWdleHBzIGZvciBtYXRjaGluZyBub24tc3ludGF4IGVycm9ycyBvbiBvdXRwdXRcbiAgICAgICAgY29uc3QgZGlyX2Vycm9yID0gL1xcKiAoLiopLztcbiAgICAgICAgY29uc3QgbmV3X2Rpcl9lcnJvciA9IC9FcnJvcjogKC4qKS87XG5cbiAgICAgICAgLy8gZXN0YWJsaXNoIGFyZ3NcbiAgICAgICAgdmFyIGFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4LnVzZVRlcnJhZm9ybVBsYW4nKSA/IFsncGxhbiddIDogWyd2YWxpZGF0ZSddO1xuICAgICAgICBhcmdzLnB1c2goJy1uby1jb2xvcicpO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgb3B0aW9ucyB3aXRoIG5vcm1hbCBkZWZhdWx0c1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHsgY3dkOiBkaXIsIHN0cmVhbTogJ3N0ZGVycicsIGFsbG93RW1wdHlTdGRlcnI6IHRydWUgfVxuXG4gICAgICAgIC8vIGpzb24gb3V0cHV0IGZvciB2YWxpZGF0ZSBpZiA+PSAwLjEyXG4gICAgICAgIGlmICghKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtUGxhbicpKSAmJiBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lm5ld1ZlcnNpb24nKSkge1xuICAgICAgICAgIGFyZ3MucHVzaCgnLWpzb24nKVxuICAgICAgICAgIC8vIHN0ZG91dCBmb3IganNvbiBvdXRwdXQgc28gYWxzbyBoYXZlIHRvIGlnbm9yZSBleGl0IGNvZGVcbiAgICAgICAgICBvcHRpb25zID0geyBjd2Q6IGRpciwgaWdub3JlRXhpdENvZGU6IHRydWUgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHZhciBpbnB1dHMgYXJlIG9ubHkgdmFsaWQgZm9yIG90aGVyIHRoYW4gPj0gMC4xMiB2YWxpZGF0ZVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAvLyBhZGQgZ2xvYmFsIHZhciBmaWxlc1xuICAgICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lmdsb2JhbFZhckZpbGVzJylbMF0gIT0gJycpXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5nbG9iYWxWYXJGaWxlcycpLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICBhcmdzLnB1c2goLi4uWyctdmFyLWZpbGUnLCBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci10ZXJyYWZvcm0tc3ludGF4Lmdsb2JhbFZhckZpbGVzJylbaV1dKTtcblxuICAgICAgICAgIC8vIGFkZCBsb2NhbCB2YXIgZmlsZXNcbiAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5sb2NhbFZhckZpbGVzJylbMF0gIT0gJycpXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC5sb2NhbFZhckZpbGVzJykubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgIGFyZ3MucHVzaCguLi5bJy12YXItZmlsZScsIGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubG9jYWxWYXJGaWxlcycpW2ldXSk7XG5cbiAgICAgICAgICAvLyBkbyBub3QgY2hlY2sgaWYgcmVxdWlyZWQgdmFyaWFibGVzIGFyZSBzcGVjaWZpZWQgaWYgZGVzaXJlZFxuICAgICAgICAgIGlmICghKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXguY2hlY2tSZXF1aXJlZFZhcicpKSAmJiAhKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtUGxhbicpKSlcbiAgICAgICAgICAgIGFyZ3MucHVzaCgnLWNoZWNrLXZhcmlhYmxlcz1mYWxzZScpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBleGVjdXRlIHRlcnJhZm9ybSBmbXQgaWYgc2VsZWN0ZWRcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudXNlVGVycmFmb3JtRm9ybWF0JykpXG4gICAgICAgICAgaGVscGVycy5leGVjKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgudGVycmFmb3JtRXhlY3V0YWJsZVBhdGgnKSwgWydmbXQnLCAnLWxpc3Q9ZmFsc2UnLCBkaXJdKVxuXG4gICAgICAgIHJldHVybiBoZWxwZXJzLmV4ZWMoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC50ZXJyYWZvcm1FeGVjdXRhYmxlUGF0aCcpLCBhcmdzLCBvcHRpb25zKS50aGVuKG91dHB1dCA9PiB7XG4gICAgICAgICAgdmFyIHRvUmV0dXJuID0gW107XG5cbiAgICAgICAgICAvLyBuZXcgdGVycmFmb3JtIHZhbGlkYXRlIHdpbGwgYmUgZG9pbmcgSlNPTiBwYXJzaW5nXG4gICAgICAgICAgaWYgKCEoYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdGVycmFmb3JtLXN5bnRheC51c2VUZXJyYWZvcm1QbGFuJykpICYmIGF0b20uY29uZmlnLmdldCgnbGludGVyLXRlcnJhZm9ybS1zeW50YXgubmV3VmVyc2lvbicpKSB7XG4gICAgICAgICAgICBpbmZvID0gSlNPTi5wYXJzZShvdXRwdXQpXG5cbiAgICAgICAgICAgIC8vIGNvbW1hbmQgaXMgcmVwb3J0aW5nIGFuIGlzc3VlXG4gICAgICAgICAgICBpZiAoaW5mby52YWxpZCA9PSBmYWxzZSkge1xuICAgICAgICAgICAgICBpbmZvLmRpYWdub3N0aWNzLmZvckVhY2goZnVuY3Rpb24gKGlzc3VlKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm8gcmFuZ2UgaW5mb3JtYXRpb24gZ2l2ZW4gd2UgaGF2ZSB0byBpbXByb3Zpc2VcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IGRpcjtcbiAgICAgICAgICAgICAgICB2YXIgbGluZV9zdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVfZW5kID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY29sX3N0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY29sX2VuZCA9IDE7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIHJhbmdlIGluZm9ybWF0aW9uIHNvIHVzZSBpdFxuICAgICAgICAgICAgICAgIGlmIChpc3N1ZS5yYW5nZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBmaWxlID0gaXNzdWUucmFuZ2UuZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgICBsaW5lX3N0YXJ0ID0gaXNzdWUucmFuZ2Uuc3RhcnQubGluZSAtIDE7XG4gICAgICAgICAgICAgICAgICBsaW5lX2VuZCA9IGlzc3VlLnJhbmdlLnN0YXJ0LmNvbHVtbiAtIDE7XG4gICAgICAgICAgICAgICAgICBjb2xfc3RhcnQgPSBpc3N1ZS5yYW5nZS5lbmQubGluZSAtIDE7XG4gICAgICAgICAgICAgICAgICBjb2xfZW5kID0gaXNzdWUucmFuZ2UuZW5kLmNvbHVtbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIHdlIG5lZWQgdG8gZml4IGRpciBkaXNwbGF5XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGZpbGUpWzBdID09IGRpcilcbiAgICAgICAgICAgICAgICAgIGZpbGUgPSBkaXIgKyAnICdcblxuICAgICAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6IGlzc3VlLnNldmVyaXR5LFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogaXNzdWUuc3VtbWFyeSxcbiAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpc3N1ZS5kZXRhaWwsXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1tsaW5lX3N0YXJ0LCBsaW5lX2VuZF0sIFtjb2xfc3RhcnQsIGNvbF9lbmRdXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2UgcHJvY2VlZHMgYXMgbm9ybWFsXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKVxuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL1xcXFwvZywgJy8nKVxuXG4gICAgICAgICAgICAgIC8vIG1hdGNoZXJzIGZvciBvdXRwdXQgcGFyc2luZyBhbmQgY2FwdHVyaW5nXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfc3ludGF4ID0gcmVnZXhfc3ludGF4LmV4ZWMobGluZSk7XG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfbmV3X3N5bnRheCA9IG5ld19yZWdleF9zeW50YXguZXhlYyhsaW5lKTtcbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc19hbHRfc3ludGF4ID0gYWx0X3JlZ2V4X3N5bnRheC5leGVjKGxpbmUpO1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzX2RpciA9IGRpcl9lcnJvci5leGVjKGxpbmUpO1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzX25ld19kaXIgPSBuZXdfZGlyX2Vycm9yLmV4ZWMobGluZSk7XG4gICAgICAgICAgICAgIC8vIGVuc3VyZSB1c2VsZXNzIGJsb2NrIGluZm8gaXMgbm90IGNhcHR1cmVkIGFuZCBkaXNwbGF5ZWRcbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc19ibG9jayA9IC9vY2N1cnJlZC8uZXhlYyhsaW5lKTtcbiAgICAgICAgICAgICAgLy8gcmVjb2duaXplIGFuZCBkaXNwbGF5IHdoZW4gdGVycmFmb3JtIGluaXQgd291bGQgYmUgbW9yZSBoZWxwZnVsXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXNfaW5pdCA9IC9lcnJvciBzYXRpc2Z5aW5nIHBsdWdpbiByZXF1aXJlbWVudHN8dGVycmFmb3JtIGluaXQvLmV4ZWMobGluZSlcblxuICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3ludGF4IGVycm9ycyBpbiBkaXJlY3RvcnlcbiAgICAgICAgICAgICAgaWYgKG1hdGNoZXNfc3ludGF4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0b1JldHVybi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogbWF0Y2hlc19zeW50YXhbNF0sXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXIgKyAnLycgKyBtYXRjaGVzX3N5bnRheFsxXSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFtbTnVtYmVyLnBhcnNlSW50KG1hdGNoZXNfc3ludGF4WzJdKSAtIDEsIE51bWJlci5wYXJzZUludChtYXRjaGVzX3N5bnRheFszXSkgLSAxXSwgW051bWJlci5wYXJzZUludChtYXRjaGVzX3N5bnRheFsyXSkgLSAxLCBOdW1iZXIucGFyc2VJbnQobWF0Y2hlc19zeW50YXhbM10pXV0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBuZXcgb3IgYWx0ZXJuYXRlIGZvcm1hdCBzeW50YXggZXJyb3JzIGluIGRpcmVjdG9yeSAoYWx0IGZpcnN0IHNpbmNlIG5ldyBhbHNvIGNhcHR1cmVzIGFsdCBidXQgYm90Y2hlcyBmb3JtYXR0aW5nKVxuICAgICAgICAgICAgICBlbHNlIGlmICgobWF0Y2hlc19hbHRfc3ludGF4ICE9IG51bGwpIHx8IChtYXRjaGVzX25ld19zeW50YXggIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gbWF0Y2hlc19hbHRfc3ludGF4ID09IG51bGwgPyBtYXRjaGVzX25ld19zeW50YXggOiBtYXRjaGVzX2FsdF9zeW50YXg7XG5cbiAgICAgICAgICAgICAgICB0b1JldHVybi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgZXhjZXJwdDogbWF0Y2hlc1syXSArIG1hdGNoZXNbNV0sXG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXIgKyAnLycgKyBtYXRjaGVzWzFdLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1tOdW1iZXIucGFyc2VJbnQobWF0Y2hlc1szXSkgLSAxLCBOdW1iZXIucGFyc2VJbnQobWF0Y2hlc1s0XSkgLSAxXSwgW051bWJlci5wYXJzZUludChtYXRjaGVzWzNdKSAtIDEsIE51bWJlci5wYXJzZUludChtYXRjaGVzWzRdKV1dLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igbm9uLXN5bnRheCBlcnJvcnMgaW4gZGlyZWN0b3J5IGFuZCBhY2NvdW50IGZvciBjaGFuZ2VzIGluIG5ld2VyIGZvcm1hdFxuICAgICAgICAgICAgICBlbHNlIGlmICgobWF0Y2hlc19kaXIgIT0gbnVsbCB8fCBtYXRjaGVzX25ld19kaXIgIT0gbnVsbCkgJiYgbWF0Y2hlc19ibG9jayA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXNfZGlyID09IG51bGwgPyBtYXRjaGVzX25ld19kaXJbMV0gOiBtYXRjaGVzX2RpclsxXVxuXG4gICAgICAgICAgICAgICAgLy8gZGlyIHdpbGwgYmUgcmVsYXRpdmUgYWZ0ZXIgbGludGVyIHByb2Nlc3NlcyBpdCwgc28gaWYgZGlyIGJlaW5nIGxpbnRlZCBpcyB0aGUgcm9vdCBvZiB0aGUgcHJvamVjdCBwYXRoLCB0aGVuIGl0IHdpbGwgYmUgZW1wdHkgb24gZGlzcGxheVxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS92MS45LjQvUHJvamVjdCNpbnN0YW5jZS1yZWxhdGl2aXplUGF0aFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBwYXRoIHRvIHRoZSBwcm9qZWN0IGRpciBjb250YWluaW5nIHRoZSBmaWxlIGlzIHRoZSBzYW1lIGFzIHRoZSBkaXIgY29udGFpbmluZyB0aGUgZmlsZSwgbWVhbmluZyB0aGUgZmlsZSBpcyBpbiB0aGUgcm9vdCBkaXIgb2YgdGhlIHByb2plY3QgaWYgdHJ1ZVxuICAgICAgICAgICAgICAgIGlmIChhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZSlbMF0gPT0gZGlyKVxuICAgICAgICAgICAgICAgICAgLy8gaSB3b3VsZCBsb3ZlIHRvIGltcHJvdmUgdGhpcyBsYXRlciwgZXNwZWNpYWxseSBzbyBpdCBjb3VsZCBiZSBhYm92ZSB0aGUgY29uZGl0aW9uYWxzXG4gICAgICAgICAgICAgICAgICBkaXIgPSBkaXIgKyAnICdcblxuICAgICAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICBleGNlcnB0OiAnTm9uLXN5bnRheCBlcnJvciBpbiBkaXJlY3Rvcnk6ICcgKyBtYXRjaGVzICsgJy4nLFxuICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogZGlyLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogW1swLCAwXSwgWzAsIDFdXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdG9SZXR1cm47XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG4iXX0=