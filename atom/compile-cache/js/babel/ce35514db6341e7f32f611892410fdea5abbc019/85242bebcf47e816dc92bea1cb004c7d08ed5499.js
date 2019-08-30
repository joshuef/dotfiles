'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  config: {
    yamlLintExecutablePath: {
      title: 'yamllint Executable Path',
      type: 'string',
      description: 'Path to yamllint executable (e.g. /usr/bin/yamllint) if not in shell env path.',
      'default': 'yamllint'
    },
    useProjectConfig: {
      title: 'Use project yamllint config file.',
      type: 'boolean',
      description: 'Use an yamllint configuration file named `.yamllint` in the root level of the project directory. Overrides other settings besides executable path and blacklist.',
      'default': false
    },
    timeout: {
      title: 'Linting Timeout',
      type: 'number',
      description: 'Number of seconds to wait on lint attempt before timing out.',
      'default': 30
    }
  },

  // activate linter
  activate: function activate() {
    var helpers = require("atom-linter");
  },

  provideLinter: function provideLinter() {
    return {
      name: 'yamllint',
      grammarScopes: ['source.yaml', 'source.yaml-advanced'],
      scope: 'file',
      lintsOnChange: true,
      lint: function lint(activeEditor) {
        // setup variables
        var helpers = require('atom-linter');
        var lint_regex = /(.*):(\d+):(\d+): \[(.*)\] (.*)/;
        var file = activeEditor.getPath();
        var correct_file = new RegExp(file);
        var fs = require('fs');

        // parseable output and no color
        var args = ['-f', 'parsable'];

        // use config file if specified
        if (atom.config.get('linter-yaml.useProjectConfig')) {
          // cannot cwd in project path and then add file relative path to args because ansible relies on pathing relative to directory execution for includes
          var project_path = atom.project.relativizePath(file)[0];
          var configPath = project_path + '/.yamllint';
          configExists = fs.existsSync(configPath);

          if (configExists) {
            // use yamllint config file in root project level
            args = args.concat(['-c', configPath]);
          }
        }

        // add file to check
        args.push(file);

        // initialize variable for linter return here for either linter output or errors
        var toReturn = [];

        return helpers.exec(atom.config.get('linter-yaml.yamlLintExecutablePath'), args, { cwd: require('path').dirname(file), ignoreExitCode: true, timeout: atom.config.get('linter-yaml.timeout') * 1000 }).then(function (output) {

          output.split(/\r?\n/).forEach(function (line) {
            var lint_matches = lint_regex.exec(line);
            var correct_file_matches = correct_file.exec(line);

            // check for normal linter checks output
            if (lint_matches != null && correct_file_matches != null) {

              var position = helpers.generateRange(activeEditor, Number.parseInt(lint_matches[2]) - 1, Number.parseInt(lint_matches[3]) - 1);

              toReturn.push({
                severity: lint_matches[4],
                excerpt: lint_matches[5],
                location: {
                  file: file,
                  position: position
                }
              });
            }
            // check for linting issues in other files
            else if (lint_matches != null) {
                var position = helpers.generateRange(activeEditor, Number.parseInt(lint_matches[2]) - 1, Number.parseInt(lint_matches[3]) - 1);

                toReturn.push({
                  severity: lint_matches[4],
                  excerpt: lint_matches[5],
                  location: {
                    file: lint_matches[1],
                    position: position
                  }
                });
              }
          });
          return toReturn;
        })['catch'](function (error) {
          atom.notifications.addError('An unexpected error with yamllint, linter-yaml, atom, linter, and/or your YAML file, has occurred.', {
            detail: error.message
          });
          return toReturn;
        });
      }
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXlhbWwvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7OztxQkFFRztBQUNiLFFBQU0sRUFBRTtBQUNOLDBCQUFzQixFQUFFO0FBQ3RCLFdBQUssRUFBRSwwQkFBMEI7QUFDakMsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLGdGQUFnRjtBQUM3RixpQkFBUyxVQUFVO0tBQ3BCO0FBQ0Qsb0JBQWdCLEVBQUU7QUFDaEIsV0FBSyxFQUFFLG1DQUFtQztBQUMxQyxVQUFJLEVBQUUsU0FBUztBQUNmLGlCQUFXLEVBQUUsa0tBQWtLO0FBQy9LLGlCQUFTLEtBQUs7S0FDZjtBQUNELFdBQU8sRUFBRTtBQUNQLFdBQUssRUFBRSxpQkFBaUI7QUFDeEIsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBVyxFQUFFLDhEQUE4RDtBQUMzRSxpQkFBUyxFQUFFO0tBQ1o7R0FDRjs7O0FBR0QsVUFBUSxFQUFBLG9CQUFHO0FBQ1QsUUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0dBQ3hDOztBQUVELGVBQWEsRUFBQSx5QkFBRztBQUNkLFdBQU87QUFDTCxVQUFJLEVBQUUsVUFBVTtBQUNoQixtQkFBYSxFQUFFLENBQUMsYUFBYSxFQUFFLHNCQUFzQixDQUFDO0FBQ3RELFdBQUssRUFBRSxNQUFNO0FBQ2IsbUJBQWEsRUFBRSxJQUFJO0FBQ25CLFVBQUksRUFBRSxjQUFDLFlBQVksRUFBSzs7QUFFdEIsWUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3ZDLFlBQU0sVUFBVSxHQUFHLGlDQUFpQyxDQUFDO0FBQ3JELFlBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQyxZQUFNLFlBQVksR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QyxZQUFN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QUNGLENBQUMsQ0FBQztBQUNILGlCQUFPLFFBQVEsQ0FBQztTQUNqQixDQUFDLFNBQ0ksQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUNaLGNBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUN6QixvR0FBb0csRUFDcEc7QUFDRSxrQkFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPO1dBQ3RCLENBQ0YsQ0FBQztBQUNKLGlCQUFPLFFBQVEsQ0FBQztTQUNqQixDQUFDLENBQUM7T0FDSjtLQUNGLENBQUM7R0FDSDtDQUNGIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXlhbWwvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICBjb25maWc6IHtcbiAgICB5YW1sTGludEV4ZWN1dGFibGVQYXRoOiB7XG4gICAgICB0aXRsZTogJ3lhbWxsaW50IEV4ZWN1dGFibGUgUGF0aCcsXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUGF0aCB0byB5YW1sbGludCBleGVjdXRhYmxlIChlLmcuIC91c3IvYmluL3lhbWxsaW50KSBpZiBub3QgaW4gc2hlbGwgZW52IHBhdGguJyxcbiAgICAgIGRlZmF1bHQ6ICd5YW1sbGludCcsXG4gICAgfSxcbiAgICB1c2VQcm9qZWN0Q29uZmlnOiB7XG4gICAgICB0aXRsZTogJ1VzZSBwcm9qZWN0IHlhbWxsaW50IGNvbmZpZyBmaWxlLicsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBhbiB5YW1sbGludCBjb25maWd1cmF0aW9uIGZpbGUgbmFtZWQgYC55YW1sbGludGAgaW4gdGhlIHJvb3QgbGV2ZWwgb2YgdGhlIHByb2plY3QgZGlyZWN0b3J5LiBPdmVycmlkZXMgb3RoZXIgc2V0dGluZ3MgYmVzaWRlcyBleGVjdXRhYmxlIHBhdGggYW5kIGJsYWNrbGlzdC4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICB0aW1lb3V0OiB7XG4gICAgICB0aXRsZTogJ0xpbnRpbmcgVGltZW91dCcsXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIHNlY29uZHMgdG8gd2FpdCBvbiBsaW50IGF0dGVtcHQgYmVmb3JlIHRpbWluZyBvdXQuJyxcbiAgICAgIGRlZmF1bHQ6IDMwLFxuICAgIH1cbiAgfSxcblxuICAvLyBhY3RpdmF0ZSBsaW50ZXJcbiAgYWN0aXZhdGUoKSB7XG4gICAgY29uc3QgaGVscGVycyA9IHJlcXVpcmUoXCJhdG9tLWxpbnRlclwiKTtcbiAgfSxcblxuICBwcm92aWRlTGludGVyKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAneWFtbGxpbnQnLFxuICAgICAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UueWFtbCcsICdzb3VyY2UueWFtbC1hZHZhbmNlZCddLFxuICAgICAgc2NvcGU6ICdmaWxlJyxcbiAgICAgIGxpbnRzT25DaGFuZ2U6IHRydWUsXG4gICAgICBsaW50OiAoYWN0aXZlRWRpdG9yKSA9PiB7XG4gICAgICAgIC8vIHNldHVwIHZhcmlhYmxlc1xuICAgICAgICBjb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnYXRvbS1saW50ZXInKTtcbiAgICAgICAgY29uc3QgbGludF9yZWdleCA9IC8oLiopOihcXGQrKTooXFxkKyk6IFxcWyguKilcXF0gKC4qKS87XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhY3RpdmVFZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICBjb25zdCBjb3JyZWN0X2ZpbGUgPSBuZXcgUmVnRXhwKGZpbGUpO1xuICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcblxuICAgICAgICAvLyBwYXJzZWFibGUgb3V0cHV0IGFuZCBubyBjb2xvclxuICAgICAgICB2YXIgYXJncyA9IFsnLWYnLCAncGFyc2FibGUnXVxuXG4gICAgICAgIC8vIHVzZSBjb25maWcgZmlsZSBpZiBzcGVjaWZpZWRcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnbGludGVyLXlhbWwudXNlUHJvamVjdENvbmZpZycpKSB7XG4gICAgICAgICAgLy8gY2Fubm90IGN3ZCBpbiBwcm9qZWN0IHBhdGggYW5kIHRoZW4gYWRkIGZpbGUgcmVsYXRpdmUgcGF0aCB0byBhcmdzIGJlY2F1c2UgYW5zaWJsZSByZWxpZXMgb24gcGF0aGluZyByZWxhdGl2ZSB0byBkaXJlY3RvcnkgZXhlY3V0aW9uIGZvciBpbmNsdWRlc1xuICAgICAgICAgIGNvbnN0IHByb2plY3RfcGF0aCA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlKVswXTtcbiAgICAgICAgICBjb25zdCBjb25maWdQYXRoID0gcHJvamVjdF9wYXRoICsgJy8ueWFtbGxpbnQnXG4gICAgICAgICAgY29uZmlnRXhpc3RzID0gZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKVxuXG4gICAgICAgICAgaWYgKGNvbmZpZ0V4aXN0cykge1xuICAgICAgICAgICAgLy8gdXNlIHlhbWxsaW50IGNvbmZpZyBmaWxlIGluIHJvb3QgcHJvamVjdCBsZXZlbFxuICAgICAgICAgICAgYXJncyA9IGFyZ3MuY29uY2F0KFsnLWMnLCBjb25maWdQYXRoXSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgZmlsZSB0byBjaGVja1xuICAgICAgICBhcmdzLnB1c2goZmlsZSk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB2YXJpYWJsZSBmb3IgbGludGVyIHJldHVybiBoZXJlIGZvciBlaXRoZXIgbGludGVyIG91dHB1dCBvciBlcnJvcnNcbiAgICAgICAgdmFyIHRvUmV0dXJuID0gW107XG5cbiAgICAgICAgcmV0dXJuIGhlbHBlcnMuZXhlYyhhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci15YW1sLnlhbWxMaW50RXhlY3V0YWJsZVBhdGgnKSwgYXJncywge2N3ZDogcmVxdWlyZSgncGF0aCcpLmRpcm5hbWUoZmlsZSksIGlnbm9yZUV4aXRDb2RlOiB0cnVlLCB0aW1lb3V0OiBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci15YW1sLnRpbWVvdXQnKSAqIDEwMDB9KS50aGVuKG91dHB1dCA9PiB7XG5cbiAgICAgICAgICBvdXRwdXQuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICBjb25zdCBsaW50X21hdGNoZXMgPSBsaW50X3JlZ2V4LmV4ZWMobGluZSk7XG4gICAgICAgICAgICBjb25zdCBjb3JyZWN0X2ZpbGVfbWF0Y2hlcyA9IGNvcnJlY3RfZmlsZS5leGVjKGxpbmUpO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBmb3Igbm9ybWFsIGxpbnRlciBjaGVja3Mgb3V0cHV0XG4gICAgICAgICAgICBpZiAobGludF9tYXRjaGVzICE9IG51bGwgJiYgY29ycmVjdF9maWxlX21hdGNoZXMgIT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gaGVscGVycy5nZW5lcmF0ZVJhbmdlKGFjdGl2ZUVkaXRvciwgTnVtYmVyLnBhcnNlSW50KGxpbnRfbWF0Y2hlc1syXSkgLSAxLCBOdW1iZXIucGFyc2VJbnQobGludF9tYXRjaGVzWzNdKSAtIDEpO1xuXG4gICAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICAgIHNldmVyaXR5OiBsaW50X21hdGNoZXNbNF0sXG4gICAgICAgICAgICAgICAgZXhjZXJwdDogbGludF9tYXRjaGVzWzVdLFxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGxpbnRpbmcgaXNzdWVzIGluIG90aGVyIGZpbGVzXG4gICAgICAgICAgICBlbHNlIGlmIChsaW50X21hdGNoZXMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGhlbHBlcnMuZ2VuZXJhdGVSYW5nZShhY3RpdmVFZGl0b3IsIE51bWJlci5wYXJzZUludChsaW50X21hdGNoZXNbMl0pIC0gMSwgTnVtYmVyLnBhcnNlSW50KGxpbnRfbWF0Y2hlc1szXSkgLSAxKTtcblxuICAgICAgICAgICAgICB0b1JldHVybi5wdXNoKHtcbiAgICAgICAgICAgICAgICBzZXZlcml0eTogbGludF9tYXRjaGVzWzRdLFxuICAgICAgICAgICAgICAgIGV4Y2VycHQ6IGxpbnRfbWF0Y2hlc1s1XSxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgZmlsZTogbGludF9tYXRjaGVzWzFdLFxuICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0b1JldHVybjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgJ0FuIHVuZXhwZWN0ZWQgZXJyb3Igd2l0aCB5YW1sbGludCwgbGludGVyLXlhbWwsIGF0b20sIGxpbnRlciwgYW5kL29yIHlvdXIgWUFNTCBmaWxlLCBoYXMgb2NjdXJyZWQuJyxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRldGFpbDogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiB0b1JldHVybjtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcbiJdfQ==