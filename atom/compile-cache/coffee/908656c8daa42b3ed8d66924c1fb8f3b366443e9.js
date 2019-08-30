(function() {
  var CompositeDisposable;

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    config: {
      useCargo: {
        type: 'boolean',
        "default": true,
        description: "Use Cargo if it's possible"
      },
      rustcPath: {
        type: 'string',
        "default": 'rustc',
        description: "Path to Rust's compiler `rustc`"
      },
      cargoPath: {
        type: 'string',
        "default": 'cargo',
        description: "Path to Rust's package manager `cargo`"
      },
      cargoCommand: {
        type: 'string',
        "default": 'test all',
        "enum": ['build', 'check', 'check all', 'check tests', 'test', 'test all', 'rustc', 'clippy'],
        description: "`cargo` command to run.<ul>\n<li>Use **build** to simply compile the code.</li>\n<li>Use **check** for fast linting (does not build the project).</li>\n<li>Use **check all** for fast linting of all packages in the project.</li>\n<li>Use **check tests** to also include \`#[cfg(test)]\` code in linting.</li>\n<li>Use **clippy** to increase amount of available lints (you need to install \`clippy\`).</li>\n<li>Use **test** to run tests (note that once the tests are built, lints stop showing).</li>\n<li>Use **test all** run tests for all packages in the project.</li>\n<li>Use **rustc** for linting with Rust pre-1.23.</li>\n</ul>"
      },
      cargoManifestFilename: {
        type: 'string',
        "default": 'Cargo.toml',
        description: 'Cargo manifest filename'
      },
      jobsNumber: {
        type: 'integer',
        "default": 2,
        "enum": [1, 2, 4, 6, 8, 10],
        description: 'Number of jobs to run Cargo in parallel'
      },
      disabledWarnings: {
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        },
        description: 'Linting warnings to be ignored in editor, separated with commas.'
      },
      specifiedFeatures: {
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        },
        description: 'Additional features to be passed, when linting (for example, `secure, html`)'
      },
      rustcBuildTest: {
        type: 'boolean',
        "default": false,
        description: "Lint test code, when using `rustc`"
      },
      allowedToCacheVersions: {
        type: 'boolean',
        "default": true,
        description: "Uncheck this if you need to change toolchains during one Atom session. Otherwise toolchains' versions are saved for an entire Atom session to increase performance."
      },
      disableExecTimeout: {
        title: "Disable Execution Timeout",
        type: 'boolean',
        "default": false,
        description: "By default processes running longer than 10 seconds will be automatically terminated. Enable this option if you are getting messages about process execution timing out."
      }
    },
    activate: function() {
      return require('atom-package-deps').install('linter-rust');
    },
    provideLinter: function() {
      var LinterRust;
      LinterRust = require('./linter-rust');
      this.provider = new LinterRust();
      return {
        name: 'Rust',
        grammarScopes: ['source.rust'],
        scope: 'project',
        lint: this.provider.lint,
        lintsOnChange: false
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItcnVzdC9saWIvaW5pdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFFeEIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLFFBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsV0FBQSxFQUFhLDRCQUZiO09BREY7TUFJQSxTQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsT0FEVDtRQUVBLFdBQUEsRUFBYSxpQ0FGYjtPQUxGO01BUUEsU0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE9BRFQ7UUFFQSxXQUFBLEVBQWEsd0NBRmI7T0FURjtNQVlBLFlBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxVQURUO1FBRUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUNKLE9BREksRUFFSixPQUZJLEVBR0osV0FISSxFQUlKLGFBSkksRUFLSixNQUxJLEVBTUosVUFOSSxFQU9KLE9BUEksRUFRSixRQVJJLENBRk47UUFZQSxXQUFBLEVBQWEseW5CQVpiO09BYkY7TUFtQ0EscUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxZQURUO1FBRUEsV0FBQSxFQUFhLHlCQUZiO09BcENGO01BdUNBLFVBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxDQURUO1FBRUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLEVBQWhCLENBRk47UUFHQSxXQUFBLEVBQWEseUNBSGI7T0F4Q0Y7TUE0Q0EsZ0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxPQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQURUO1FBRUEsS0FBQSxFQUNFO1VBQUEsSUFBQSxFQUFNLFFBQU47U0FIRjtRQUlBLFdBQUEsRUFBYSxrRUFKYjtPQTdDRjtNQWtEQSxpQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLE9BQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRFQ7UUFFQSxLQUFBLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtTQUhGO1FBSUEsV0FBQSxFQUFhLDhFQUpiO09BbkRGO01Bd0RBLGNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsV0FBQSxFQUFhLG9DQUZiO09BekRGO01BNERBLHNCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLFdBQUEsRUFBYSxxS0FGYjtPQTdERjtNQWdFQSxrQkFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLDJCQUFQO1FBQ0EsSUFBQSxFQUFNLFNBRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRlQ7UUFHQSxXQUFBLEVBQWEsMEtBSGI7T0FqRUY7S0FERjtJQXVFQSxRQUFBLEVBQVUsU0FBQTthQUNSLE9BQUEsQ0FBUSxtQkFBUixDQUE0QixDQUFDLE9BQTdCLENBQXFDLGFBQXJDO0lBRFEsQ0F2RVY7SUEwRUEsYUFBQSxFQUFlLFNBQUE7QUFDYixVQUFBO01BQUEsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSO01BQ2IsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFJLFVBQUosQ0FBQTthQUNaO1FBQ0UsSUFBQSxFQUFNLE1BRFI7UUFFRSxhQUFBLEVBQWUsQ0FBQyxhQUFELENBRmpCO1FBR0UsS0FBQSxFQUFPLFNBSFQ7UUFJRSxJQUFBLEVBQU0sSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUpsQjtRQUtFLGFBQUEsRUFBZSxLQUxqQjs7SUFIYSxDQTFFZjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgY29uZmlnOlxuICAgIHVzZUNhcmdvOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJVc2UgQ2FyZ28gaWYgaXQncyBwb3NzaWJsZVwiXG4gICAgcnVzdGNQYXRoOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdydXN0YydcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlBhdGggdG8gUnVzdCdzIGNvbXBpbGVyIGBydXN0Y2BcIlxuICAgIGNhcmdvUGF0aDpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnY2FyZ28nXG4gICAgICBkZXNjcmlwdGlvbjogXCJQYXRoIHRvIFJ1c3QncyBwYWNrYWdlIG1hbmFnZXIgYGNhcmdvYFwiXG4gICAgY2FyZ29Db21tYW5kOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICd0ZXN0IGFsbCdcbiAgICAgIGVudW06IFtcbiAgICAgICAgJ2J1aWxkJ1xuICAgICAgICAnY2hlY2snXG4gICAgICAgICdjaGVjayBhbGwnXG4gICAgICAgICdjaGVjayB0ZXN0cydcbiAgICAgICAgJ3Rlc3QnXG4gICAgICAgICd0ZXN0IGFsbCdcbiAgICAgICAgJ3J1c3RjJ1xuICAgICAgICAnY2xpcHB5J1xuICAgICAgXVxuICAgICAgZGVzY3JpcHRpb246IFwiXCJcImBjYXJnb2AgY29tbWFuZCB0byBydW4uPHVsPlxuICAgICAgPGxpPlVzZSAqKmJ1aWxkKiogdG8gc2ltcGx5IGNvbXBpbGUgdGhlIGNvZGUuPC9saT5cbiAgICAgIDxsaT5Vc2UgKipjaGVjayoqIGZvciBmYXN0IGxpbnRpbmcgKGRvZXMgbm90IGJ1aWxkIHRoZSBwcm9qZWN0KS48L2xpPlxuICAgICAgPGxpPlVzZSAqKmNoZWNrIGFsbCoqIGZvciBmYXN0IGxpbnRpbmcgb2YgYWxsIHBhY2thZ2VzIGluIHRoZSBwcm9qZWN0LjwvbGk+XG4gICAgICA8bGk+VXNlICoqY2hlY2sgdGVzdHMqKiB0byBhbHNvIGluY2x1ZGUgXFxgI1tjZmcodGVzdCldXFxgIGNvZGUgaW4gbGludGluZy48L2xpPlxuICAgICAgPGxpPlVzZSAqKmNsaXBweSoqIHRvIGluY3JlYXNlIGFtb3VudCBvZiBhdmFpbGFibGUgbGludHMgKHlvdSBuZWVkIHRvIGluc3RhbGwgXFxgY2xpcHB5XFxgKS48L2xpPlxuICAgICAgPGxpPlVzZSAqKnRlc3QqKiB0byBydW4gdGVzdHMgKG5vdGUgdGhhdCBvbmNlIHRoZSB0ZXN0cyBhcmUgYnVpbHQsIGxpbnRzIHN0b3Agc2hvd2luZykuPC9saT5cbiAgICAgIDxsaT5Vc2UgKip0ZXN0IGFsbCoqIHJ1biB0ZXN0cyBmb3IgYWxsIHBhY2thZ2VzIGluIHRoZSBwcm9qZWN0LjwvbGk+XG4gICAgICA8bGk+VXNlICoqcnVzdGMqKiBmb3IgbGludGluZyB3aXRoIFJ1c3QgcHJlLTEuMjMuPC9saT5cbiAgICAgIDwvdWw+XCJcIlwiXG4gICAgY2FyZ29NYW5pZmVzdEZpbGVuYW1lOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdDYXJnby50b21sJ1xuICAgICAgZGVzY3JpcHRpb246ICdDYXJnbyBtYW5pZmVzdCBmaWxlbmFtZSdcbiAgICBqb2JzTnVtYmVyOlxuICAgICAgdHlwZTogJ2ludGVnZXInXG4gICAgICBkZWZhdWx0OiAyXG4gICAgICBlbnVtOiBbMSwgMiwgNCwgNiwgOCwgMTBdXG4gICAgICBkZXNjcmlwdGlvbjogJ051bWJlciBvZiBqb2JzIHRvIHJ1biBDYXJnbyBpbiBwYXJhbGxlbCdcbiAgICBkaXNhYmxlZFdhcm5pbmdzOlxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVzY3JpcHRpb246ICdMaW50aW5nIHdhcm5pbmdzIHRvIGJlIGlnbm9yZWQgaW4gZWRpdG9yLCBzZXBhcmF0ZWQgd2l0aCBjb21tYXMuJ1xuICAgIHNwZWNpZmllZEZlYXR1cmVzOlxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVzY3JpcHRpb246ICdBZGRpdGlvbmFsIGZlYXR1cmVzIHRvIGJlIHBhc3NlZCwgd2hlbiBsaW50aW5nIChmb3IgZXhhbXBsZSwgYHNlY3VyZSwgaHRtbGApJ1xuICAgIHJ1c3RjQnVpbGRUZXN0OlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246IFwiTGludCB0ZXN0IGNvZGUsIHdoZW4gdXNpbmcgYHJ1c3RjYFwiXG4gICAgYWxsb3dlZFRvQ2FjaGVWZXJzaW9uczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246IFwiVW5jaGVjayB0aGlzIGlmIHlvdSBuZWVkIHRvIGNoYW5nZSB0b29sY2hhaW5zIGR1cmluZyBvbmUgQXRvbSBzZXNzaW9uLiBPdGhlcndpc2UgdG9vbGNoYWlucycgdmVyc2lvbnMgYXJlIHNhdmVkIGZvciBhbiBlbnRpcmUgQXRvbSBzZXNzaW9uIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlLlwiXG4gICAgZGlzYWJsZUV4ZWNUaW1lb3V0OlxuICAgICAgdGl0bGU6IFwiRGlzYWJsZSBFeGVjdXRpb24gVGltZW91dFwiXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogXCJCeSBkZWZhdWx0IHByb2Nlc3NlcyBydW5uaW5nIGxvbmdlciB0aGFuIDEwIHNlY29uZHMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHRlcm1pbmF0ZWQuIEVuYWJsZSB0aGlzIG9wdGlvbiBpZiB5b3UgYXJlIGdldHRpbmcgbWVzc2FnZXMgYWJvdXQgcHJvY2VzcyBleGVjdXRpb24gdGltaW5nIG91dC5cIlxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCAnbGludGVyLXJ1c3QnXG5cbiAgcHJvdmlkZUxpbnRlcjogLT5cbiAgICBMaW50ZXJSdXN0ID0gcmVxdWlyZSgnLi9saW50ZXItcnVzdCcpXG4gICAgQHByb3ZpZGVyID0gbmV3IExpbnRlclJ1c3QoKVxuICAgIHtcbiAgICAgIG5hbWU6ICdSdXN0J1xuICAgICAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UucnVzdCddXG4gICAgICBzY29wZTogJ3Byb2plY3QnXG4gICAgICBsaW50OiBAcHJvdmlkZXIubGludFxuICAgICAgbGludHNPbkNoYW5nZTogZmFsc2VcbiAgICB9XG4iXX0=
