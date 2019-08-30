(function() {
  var ColorBuffer, ColorProject, SERIALIZE_MARKERS_VERSION, SERIALIZE_VERSION, TOTAL_COLORS_VARIABLES_IN_PROJECT, TOTAL_VARIABLES_IN_PROJECT, click, fs, jsonFixture, os, path, ref, temp;

  os = require('os');

  fs = require('fs-plus');

  path = require('path');

  temp = require('temp');

  ref = require('../lib/versions'), SERIALIZE_VERSION = ref.SERIALIZE_VERSION, SERIALIZE_MARKERS_VERSION = ref.SERIALIZE_MARKERS_VERSION;

  ColorProject = require('../lib/color-project');

  ColorBuffer = require('../lib/color-buffer');

  jsonFixture = require('./helpers/fixtures').jsonFixture(__dirname, 'fixtures');

  click = require('./helpers/events').click;

  TOTAL_VARIABLES_IN_PROJECT = 12;

  TOTAL_COLORS_VARIABLES_IN_PROJECT = 10;

  describe('ColorProject', function() {
    var eventSpy, paths, project, promise, ref1, rootPath;
    ref1 = [], project = ref1[0], promise = ref1[1], rootPath = ref1[2], paths = ref1[3], eventSpy = ref1[4];
    beforeEach(function() {
      var fixturesPath;
      atom.config.set('pigments.sourceNames', ['*.styl']);
      atom.config.set('pigments.ignoredNames', []);
      atom.config.set('pigments.filetypesForColorWords', ['*']);
      fixturesPath = atom.project.getPaths()[0];
      rootPath = fixturesPath + "/project";
      atom.project.setPaths([rootPath]);
      return project = new ColorProject({
        ignoredNames: ['vendor/*'],
        sourceNames: ['*.less'],
        ignoredScopes: ['\\.comment']
      });
    });
    afterEach(function() {
      return project.destroy();
    });
    describe('.deserialize', function() {
      return it('restores the project in its previous state', function() {
        var data, json;
        data = {
          root: rootPath,
          timestamp: new Date().toJSON(),
          version: SERIALIZE_VERSION,
          markersVersion: SERIALIZE_MARKERS_VERSION
        };
        json = jsonFixture('base-project.json', data);
        project = ColorProject.deserialize(json);
        expect(project).toBeDefined();
        expect(project.getPaths()).toEqual([rootPath + "/styles/buttons.styl", rootPath + "/styles/variables.styl"]);
        expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        return expect(project.getColorVariables().length).toEqual(TOTAL_COLORS_VARIABLES_IN_PROJECT);
      });
    });
    describe('::initialize', function() {
      beforeEach(function() {
        eventSpy = jasmine.createSpy('did-initialize');
        project.onDidInitialize(eventSpy);
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('loads the paths to scan in the project', function() {
        return expect(project.getPaths()).toEqual([rootPath + "/styles/buttons.styl", rootPath + "/styles/variables.styl"]);
      });
      it('scans the loaded paths to retrieve the variables', function() {
        expect(project.getVariables()).toBeDefined();
        return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
      });
      return it('dispatches a did-initialize event', function() {
        return expect(eventSpy).toHaveBeenCalled();
      });
    });
    describe('::findAllColors', function() {
      return it('returns all the colors in the legibles files of the project', function() {
        var search;
        search = project.findAllColors();
        return expect(search).toBeDefined();
      });
    });
    describe('when the variables have not been loaded yet', function() {
      describe('::serialize', function() {
        return it('returns an object without paths nor variables', function() {
          var date, expected;
          date = new Date;
          spyOn(project, 'getTimestamp').andCallFake(function() {
            return date;
          });
          expected = {
            deserializer: 'ColorProject',
            timestamp: date,
            version: SERIALIZE_VERSION,
            markersVersion: SERIALIZE_MARKERS_VERSION,
            globalSourceNames: ['*.styl'],
            globalIgnoredNames: [],
            ignoredNames: ['vendor/*'],
            sourceNames: ['*.less'],
            ignoredScopes: ['\\.comment'],
            buffers: {}
          };
          return expect(project.serialize()).toEqual(expected);
        });
      });
      describe('::getVariablesForPath', function() {
        return it('returns undefined', function() {
          return expect(project.getVariablesForPath(rootPath + "/styles/variables.styl")).toEqual([]);
        });
      });
      describe('::getVariableByName', function() {
        return it('returns undefined', function() {
          return expect(project.getVariableByName("foo")).toBeUndefined();
        });
      });
      describe('::getVariableById', function() {
        return it('returns undefined', function() {
          return expect(project.getVariableById(0)).toBeUndefined();
        });
      });
      describe('::getContext', function() {
        return it('returns an empty context', function() {
          expect(project.getContext()).toBeDefined();
          return expect(project.getContext().getVariablesCount()).toEqual(0);
        });
      });
      describe('::getPalette', function() {
        return it('returns an empty palette', function() {
          expect(project.getPalette()).toBeDefined();
          return expect(project.getPalette().getColorsCount()).toEqual(0);
        });
      });
      describe('::reloadVariablesForPath', function() {
        beforeEach(function() {
          spyOn(project, 'initialize').andCallThrough();
          return waitsForPromise(function() {
            return project.reloadVariablesForPath(rootPath + "/styles/variables.styl");
          });
        });
        return it('returns a promise hooked on the initialize promise', function() {
          return expect(project.initialize).toHaveBeenCalled();
        });
      });
      describe('::setIgnoredNames', function() {
        beforeEach(function() {
          project.setIgnoredNames([]);
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('initializes the project with the new paths', function() {
          return expect(project.getVariables().length).toEqual(32);
        });
      });
      return describe('::setSourceNames', function() {
        beforeEach(function() {
          project.setSourceNames([]);
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('initializes the project with the new paths', function() {
          return expect(project.getVariables().length).toEqual(12);
        });
      });
    });
    describe('when the project has no variables source files', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = fixturesPath + "-no-sources";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('initializes the paths with an empty array', function() {
        return expect(project.getPaths()).toEqual([]);
      });
      return it('initializes the variables with an empty array', function() {
        return expect(project.getVariables()).toEqual([]);
      });
    });
    describe('when the project has custom source names defined', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        project = new ColorProject({
          sourceNames: ['*.styl']
        });
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('initializes the paths with an empty array', function() {
        return expect(project.getPaths().length).toEqual(2);
      });
      return it('initializes the variables with an empty array', function() {
        expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        return expect(project.getColorVariables().length).toEqual(TOTAL_COLORS_VARIABLES_IN_PROJECT);
      });
    });
    describe('when the project has looping variable definition', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = fixturesPath + "-with-recursion";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      return it('ignores the looping definition', function() {
        expect(project.getVariables().length).toEqual(5);
        return expect(project.getColorVariables().length).toEqual(5);
      });
    });
    describe('when the variables have been loaded', function() {
      beforeEach(function() {
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      describe('::serialize', function() {
        return it('returns an object with project properties', function() {
          var date;
          date = new Date;
          spyOn(project, 'getTimestamp').andCallFake(function() {
            return date;
          });
          return expect(project.serialize()).toEqual({
            deserializer: 'ColorProject',
            ignoredNames: ['vendor/*'],
            sourceNames: ['*.less'],
            ignoredScopes: ['\\.comment'],
            timestamp: date,
            version: SERIALIZE_VERSION,
            markersVersion: SERIALIZE_MARKERS_VERSION,
            paths: [rootPath + "/styles/buttons.styl", rootPath + "/styles/variables.styl"],
            globalSourceNames: ['*.styl'],
            globalIgnoredNames: [],
            buffers: {},
            variables: project.variables.serialize()
          });
        });
      });
      describe('::getVariablesForPath', function() {
        it('returns the variables defined in the file', function() {
          return expect(project.getVariablesForPath(rootPath + "/styles/variables.styl").length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
        return describe('for a file that was ignored in the scanning process', function() {
          return it('returns undefined', function() {
            return expect(project.getVariablesForPath(rootPath + "/vendor/css/variables.less")).toEqual([]);
          });
        });
      });
      describe('::deleteVariablesForPath', function() {
        return it('removes all the variables coming from the specified file', function() {
          project.deleteVariablesForPath(rootPath + "/styles/variables.styl");
          return expect(project.getVariablesForPath(rootPath + "/styles/variables.styl")).toEqual([]);
        });
      });
      describe('::getContext', function() {
        return it('returns a context with the project variables', function() {
          expect(project.getContext()).toBeDefined();
          return expect(project.getContext().getVariablesCount()).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('::getPalette', function() {
        return it('returns a palette with the colors from the project', function() {
          expect(project.getPalette()).toBeDefined();
          return expect(project.getPalette().getColorsCount()).toEqual(10);
        });
      });
      describe('::showVariableInFile', function() {
        return it('opens the file where is located the variable', function() {
          var spy;
          spy = jasmine.createSpy('did-add-text-editor');
          atom.workspace.onDidAddTextEditor(spy);
          project.showVariableInFile(project.getVariables()[0]);
          waitsFor(function() {
            return spy.callCount > 0;
          });
          return runs(function() {
            var editor;
            editor = atom.workspace.getActiveTextEditor();
            return expect(editor.getSelectedBufferRange()).toEqual([[1, 2], [1, 14]]);
          });
        });
      });
      describe('::reloadVariablesForPath', function() {
        return describe('for a file that is part of the loaded paths', function() {
          describe('where the reload finds new variables', function() {
            beforeEach(function() {
              project.deleteVariablesForPath(rootPath + "/styles/variables.styl");
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPath(rootPath + "/styles/variables.styl");
              });
            });
            it('scans again the file to find variables', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('dispatches a did-update-variables event', function() {
              return expect(eventSpy).toHaveBeenCalled();
            });
          });
          return describe('where the reload finds nothing new', function() {
            beforeEach(function() {
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPath(rootPath + "/styles/variables.styl");
              });
            });
            it('leaves the file variables intact', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('does not dispatch a did-update-variables event', function() {
              return expect(eventSpy).not.toHaveBeenCalled();
            });
          });
        });
      });
      describe('::reloadVariablesForPaths', function() {
        describe('for a file that is part of the loaded paths', function() {
          describe('where the reload finds new variables', function() {
            beforeEach(function() {
              project.deleteVariablesForPaths([rootPath + "/styles/variables.styl", rootPath + "/styles/buttons.styl"]);
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPaths([rootPath + "/styles/variables.styl", rootPath + "/styles/buttons.styl"]);
              });
            });
            it('scans again the file to find variables', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('dispatches a did-update-variables event', function() {
              return expect(eventSpy).toHaveBeenCalled();
            });
          });
          return describe('where the reload finds nothing new', function() {
            beforeEach(function() {
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPaths([rootPath + "/styles/variables.styl", rootPath + "/styles/buttons.styl"]);
              });
            });
            it('leaves the file variables intact', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('does not dispatch a did-update-variables event', function() {
              return expect(eventSpy).not.toHaveBeenCalled();
            });
          });
        });
        return describe('for a file that is not part of the loaded paths', function() {
          beforeEach(function() {
            spyOn(project, 'loadVariablesForPath').andCallThrough();
            return waitsForPromise(function() {
              return project.reloadVariablesForPath(rootPath + "/vendor/css/variables.less");
            });
          });
          return it('does nothing', function() {
            return expect(project.loadVariablesForPath).not.toHaveBeenCalled();
          });
        });
      });
      describe('when a buffer with variables is open', function() {
        var colorBuffer, editor, ref2;
        ref2 = [], editor = ref2[0], colorBuffer = ref2[1];
        beforeEach(function() {
          eventSpy = jasmine.createSpy('did-update-variables');
          project.onDidUpdateVariables(eventSpy);
          waitsForPromise(function() {
            return atom.workspace.open('styles/variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            colorBuffer = project.colorBufferForEditor(editor);
            return spyOn(colorBuffer, 'scanBufferForVariables').andCallThrough();
          });
          waitsForPromise(function() {
            return project.initialize();
          });
          return waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
        });
        it('updates the project variable with the buffer ranges', function() {
          var i, len, ref3, results, variable;
          ref3 = project.getVariables();
          results = [];
          for (i = 0, len = ref3.length; i < len; i++) {
            variable = ref3[i];
            results.push(expect(variable.bufferRange).toBeDefined());
          }
          return results;
        });
        describe('when a color is modified that does not affect other variables ranges', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            variablesTextRanges = {};
            project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
              return variablesTextRanges[variable.name] = variable.range;
            });
            editor.setSelectedBufferRange([[1, 7], [1, 14]]);
            editor.insertText('#336');
            editor.getBuffer().emitter.emit('did-stop-changing');
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('reloads the variables with the buffer instead of the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
          it('uses the buffer ranges to detect which variables were really changed', function() {
            expect(eventSpy.argsForCall[0][0].destroyed).toBeUndefined();
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated.length).toEqual(1);
          });
          it('updates the text range of the other variables', function() {
            return project.getVariablesForPath(rootPath + "/styles/variables.styl").forEach(function(variable) {
              if (variable.name !== 'colors.red') {
                expect(variable.range[0]).toEqual(variablesTextRanges[variable.name][0] - 3);
                return expect(variable.range[1]).toEqual(variablesTextRanges[variable.name][1] - 3);
              }
            });
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
        describe('when a text is inserted that affects other variables ranges', function() {
          var ref3, variablesBufferRanges, variablesTextRanges;
          ref3 = [], variablesTextRanges = ref3[0], variablesBufferRanges = ref3[1];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              variablesBufferRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                variablesTextRanges[variable.name] = variable.range;
                return variablesBufferRanges[variable.name] = variable.bufferRange;
              });
              spyOn(project.variables, 'addMany').andCallThrough();
              editor.setSelectedBufferRange([[0, 0], [0, 0]]);
              editor.insertText('\n\n');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return project.variables.addMany.callCount > 0;
            });
          });
          it('does not trigger a change event', function() {
            return expect(eventSpy.callCount).toEqual(0);
          });
          return it('updates the range of the updated variables', function() {
            return project.getVariablesForPath(rootPath + "/styles/variables.styl").forEach(function(variable) {
              if (variable.name !== 'colors.red') {
                expect(variable.range[0]).toEqual(variablesTextRanges[variable.name][0] + 2);
                expect(variable.range[1]).toEqual(variablesTextRanges[variable.name][1] + 2);
                return expect(variable.bufferRange.isEqual(variablesBufferRanges[variable.name])).toBeFalsy();
              }
            });
          });
        });
        describe('when a color is removed', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                return variablesTextRanges[variable.name] = variable.range;
              });
              editor.setSelectedBufferRange([[1, 0], [2, 0]]);
              editor.insertText('');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('reloads the variables with the buffer instead of the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT - 1);
          });
          it('uses the buffer ranges to detect which variables were really changed', function() {
            expect(eventSpy.argsForCall[0][0].destroyed.length).toEqual(1);
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated).toBeUndefined();
          });
          it('can no longer be found in the project variables', function() {
            expect(project.getVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
            return expect(project.getColorVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
        return describe('when all the colors are removed', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                return variablesTextRanges[variable.name] = variable.range;
              });
              editor.setSelectedBufferRange([[0, 0], [2e308, 2e308]]);
              editor.insertText('');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('removes every variable from the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            expect(project.getVariables().length).toEqual(0);
            expect(eventSpy.argsForCall[0][0].destroyed.length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated).toBeUndefined();
          });
          it('can no longer be found in the project variables', function() {
            expect(project.getVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
            return expect(project.getColorVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
      });
      describe('::setIgnoredNames', function() {
        describe('with an empty array', function() {
          beforeEach(function() {
            var spy;
            expect(project.getVariables().length).toEqual(12);
            spy = jasmine.createSpy('did-update-variables');
            project.onDidUpdateVariables(spy);
            project.setIgnoredNames([]);
            return waitsFor(function() {
              return spy.callCount > 0;
            });
          });
          return it('reloads the variables from the new paths', function() {
            return expect(project.getVariables().length).toEqual(32);
          });
        });
        return describe('with a more restrictive array', function() {
          beforeEach(function() {
            var spy;
            expect(project.getVariables().length).toEqual(12);
            spy = jasmine.createSpy('did-update-variables');
            project.onDidUpdateVariables(spy);
            return waitsForPromise(function() {
              return project.setIgnoredNames(['vendor/*', '**/*.styl']);
            });
          });
          return it('clears all the paths as there is no legible paths', function() {
            return expect(project.getPaths().length).toEqual(0);
          });
        });
      });
      describe('when the project has multiple root directory', function() {
        beforeEach(function() {
          var fixturesPath;
          atom.config.set('pigments.sourceNames', ['**/*.sass', '**/*.styl']);
          fixturesPath = atom.project.getPaths()[0];
          atom.project.setPaths(["" + fixturesPath, fixturesPath + "-with-recursion"]);
          project = new ColorProject({});
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('finds the variables from the two directories', function() {
          return expect(project.getVariables().length).toEqual(17);
        });
      });
      describe('when the project has VCS ignored files', function() {
        var projectPath;
        projectPath = [][0];
        beforeEach(function() {
          var dotGit, dotGitFixture, fixture;
          atom.config.set('pigments.sourceNames', ['*.sass']);
          fixture = path.join(__dirname, 'fixtures', 'project-with-gitignore');
          projectPath = temp.mkdirSync('pigments-project');
          dotGitFixture = path.join(fixture, 'git.git');
          dotGit = path.join(projectPath, '.git');
          fs.copySync(dotGitFixture, dotGit);
          fs.writeFileSync(path.join(projectPath, '.gitignore'), fs.readFileSync(path.join(fixture, 'git.gitignore')));
          fs.writeFileSync(path.join(projectPath, 'base.sass'), fs.readFileSync(path.join(fixture, 'base.sass')));
          fs.writeFileSync(path.join(projectPath, 'ignored.sass'), fs.readFileSync(path.join(fixture, 'ignored.sass')));
          fs.mkdirSync(path.join(projectPath, 'bower_components'));
          fs.writeFileSync(path.join(projectPath, 'bower_components', 'some-ignored-file.sass'), fs.readFileSync(path.join(fixture, 'bower_components', 'some-ignored-file.sass')));
          return atom.project.setPaths([projectPath]);
        });
        describe('when the ignoreVcsIgnoredPaths setting is enabled', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoreVcsIgnoredPaths', true);
            project = new ColorProject({});
            return waitsForPromise(function() {
              return project.initialize();
            });
          });
          it('finds the variables from the three files', function() {
            expect(project.getVariables().length).toEqual(3);
            return expect(project.getPaths().length).toEqual(1);
          });
          return describe('and then disabled', function() {
            beforeEach(function() {
              var spy;
              spy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(spy);
              atom.config.set('pigments.ignoreVcsIgnoredPaths', false);
              return waitsFor(function() {
                return spy.callCount > 0;
              });
            });
            it('reloads the paths', function() {
              return expect(project.getPaths().length).toEqual(3);
            });
            return it('reloads the variables', function() {
              return expect(project.getVariables().length).toEqual(10);
            });
          });
        });
        return describe('when the ignoreVcsIgnoredPaths setting is disabled', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoreVcsIgnoredPaths', false);
            project = new ColorProject({});
            return waitsForPromise(function() {
              return project.initialize();
            });
          });
          it('finds the variables from the three files', function() {
            expect(project.getVariables().length).toEqual(10);
            return expect(project.getPaths().length).toEqual(3);
          });
          return describe('and then enabled', function() {
            beforeEach(function() {
              var spy;
              spy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(spy);
              atom.config.set('pigments.ignoreVcsIgnoredPaths', true);
              return waitsFor(function() {
                return spy.callCount > 0;
              });
            });
            it('reloads the paths', function() {
              return expect(project.getPaths().length).toEqual(1);
            });
            return it('reloads the variables', function() {
              return expect(project.getVariables().length).toEqual(3);
            });
          });
        });
      });
      describe('when the sourceNames setting is changed', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          var originalPaths;
          originalPaths = project.getPaths();
          atom.config.set('pigments.sourceNames', []);
          return waitsFor(function() {
            return project.getPaths().join(',') !== originalPaths.join(',');
          });
        });
        it('updates the variables using the new pattern', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
        return describe('so that new paths are found', function() {
          beforeEach(function() {
            var originalPaths;
            updateSpy = jasmine.createSpy('did-update-variables');
            originalPaths = project.getPaths();
            project.onDidUpdateVariables(updateSpy);
            atom.config.set('pigments.sourceNames', ['**/*.styl']);
            waitsFor(function() {
              return project.getPaths().join(',') !== originalPaths.join(',');
            });
            return waitsFor(function() {
              return updateSpy.callCount > 0;
            });
          });
          return it('loads the variables from these new paths', function() {
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
        });
      });
      describe('when the ignoredNames setting is changed', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          var originalPaths;
          originalPaths = project.getPaths();
          atom.config.set('pigments.ignoredNames', ['**/*.styl']);
          return waitsFor(function() {
            return project.getPaths().join(',') !== originalPaths.join(',');
          });
        });
        it('updates the found using the new pattern', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
        return describe('so that new paths are found', function() {
          beforeEach(function() {
            var originalPaths;
            updateSpy = jasmine.createSpy('did-update-variables');
            originalPaths = project.getPaths();
            project.onDidUpdateVariables(updateSpy);
            atom.config.set('pigments.ignoredNames', []);
            waitsFor(function() {
              return project.getPaths().join(',') !== originalPaths.join(',');
            });
            return waitsFor(function() {
              return updateSpy.callCount > 0;
            });
          });
          return it('loads the variables from these new paths', function() {
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
        });
      });
      describe('when the extendedSearchNames setting is changed', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          return project.setSearchNames(['*.foo']);
        });
        it('updates the search names', function() {
          return expect(project.getSearchNames().length).toEqual(3);
        });
        return it('serializes the setting', function() {
          return expect(project.serialize().searchNames).toEqual(['*.foo']);
        });
      });
      describe('when the ignore global config settings are enabled', function() {
        describe('for the sourceNames field', function() {
          beforeEach(function() {
            project.sourceNames = ['*.foo'];
            return waitsForPromise(function() {
              return project.setIgnoreGlobalSourceNames(true);
            });
          });
          it('ignores the content of the global config', function() {
            return expect(project.getSourceNames()).toEqual(['.pigments', '*.foo']);
          });
          return it('serializes the project setting', function() {
            return expect(project.serialize().ignoreGlobalSourceNames).toBeTruthy();
          });
        });
        describe('for the ignoredNames field', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoredNames', ['*.foo']);
            project.ignoredNames = ['*.bar'];
            return project.setIgnoreGlobalIgnoredNames(true);
          });
          it('ignores the content of the global config', function() {
            return expect(project.getIgnoredNames()).toEqual(['*.bar']);
          });
          return it('serializes the project setting', function() {
            return expect(project.serialize().ignoreGlobalIgnoredNames).toBeTruthy();
          });
        });
        describe('for the ignoredScopes field', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoredScopes', ['\\.comment']);
            project.ignoredScopes = ['\\.source'];
            return project.setIgnoreGlobalIgnoredScopes(true);
          });
          it('ignores the content of the global config', function() {
            return expect(project.getIgnoredScopes()).toEqual(['\\.source']);
          });
          return it('serializes the project setting', function() {
            return expect(project.serialize().ignoreGlobalIgnoredScopes).toBeTruthy();
          });
        });
        return describe('for the searchNames field', function() {
          beforeEach(function() {
            atom.config.set('pigments.extendedSearchNames', ['*.css']);
            project.searchNames = ['*.foo'];
            return project.setIgnoreGlobalSearchNames(true);
          });
          it('ignores the content of the global config', function() {
            return expect(project.getSearchNames()).toEqual(['*.less', '*.foo']);
          });
          return it('serializes the project setting', function() {
            return expect(project.serialize().ignoreGlobalSearchNames).toBeTruthy();
          });
        });
      });
      describe('::loadThemesVariables', function() {
        beforeEach(function() {
          atom.packages.activatePackage('atom-light-ui');
          atom.packages.activatePackage('atom-light-syntax');
          atom.config.set('core.themes', ['atom-light-ui', 'atom-light-syntax']);
          waitsForPromise(function() {
            return atom.themes.activateThemes();
          });
          return waitsForPromise(function() {
            return atom.packages.activatePackage('pigments');
          });
        });
        afterEach(function() {
          atom.themes.deactivateThemes();
          return atom.themes.unwatchUserStylesheet();
        });
        return it('returns an array of 62 variables', function() {
          var themeVariables;
          themeVariables = project.loadThemesVariables();
          return expect(themeVariables.length).toEqual(62);
        });
      });
      return describe('when the includeThemes setting is enabled', function() {
        var ref2, spy;
        ref2 = [], paths = ref2[0], spy = ref2[1];
        beforeEach(function() {
          paths = project.getPaths();
          expect(project.getColorVariables().length).toEqual(10);
          atom.packages.activatePackage('atom-light-ui');
          atom.packages.activatePackage('atom-light-syntax');
          atom.packages.activatePackage('atom-dark-ui');
          atom.packages.activatePackage('atom-dark-syntax');
          atom.config.set('core.themes', ['atom-light-ui', 'atom-light-syntax']);
          waitsForPromise(function() {
            return atom.themes.activateThemes();
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('pigments');
          });
          waitsForPromise(function() {
            return project.initialize();
          });
          return runs(function() {
            spy = jasmine.createSpy('did-change-active-themes');
            atom.themes.onDidChangeActiveThemes(spy);
            return project.setIncludeThemes(true);
          });
        });
        afterEach(function() {
          atom.themes.deactivateThemes();
          return atom.themes.unwatchUserStylesheet();
        });
        it('includes the variables set for ui and syntax themes in the palette', function() {
          return expect(project.getColorVariables().length).toEqual(72);
        });
        it('still includes the paths from the project', function() {
          var i, len, p, results;
          results = [];
          for (i = 0, len = paths.length; i < len; i++) {
            p = paths[i];
            results.push(expect(project.getPaths().indexOf(p)).not.toEqual(-1));
          }
          return results;
        });
        it('serializes the setting with the project', function() {
          var serialized;
          serialized = project.serialize();
          return expect(serialized.includeThemes).toEqual(true);
        });
        describe('and then disabled', function() {
          beforeEach(function() {
            return project.setIncludeThemes(false);
          });
          it('removes all the paths to the themes stylesheets', function() {
            return expect(project.getColorVariables().length).toEqual(10);
          });
          return describe('when the core.themes setting is modified', function() {
            beforeEach(function() {
              spyOn(project, 'loadThemesVariables').andCallThrough();
              atom.config.set('core.themes', ['atom-dark-ui', 'atom-dark-syntax']);
              return waitsFor(function() {
                return spy.callCount > 0;
              });
            });
            return it('does not trigger a paths update', function() {
              return expect(project.loadThemesVariables).not.toHaveBeenCalled();
            });
          });
        });
        return describe('when the core.themes setting is modified', function() {
          beforeEach(function() {
            spyOn(project, 'loadThemesVariables').andCallThrough();
            atom.config.set('core.themes', ['atom-dark-ui', 'atom-dark-syntax']);
            return waitsFor(function() {
              return spy.callCount > 0;
            });
          });
          return it('triggers a paths update', function() {
            return expect(project.loadThemesVariables).toHaveBeenCalled();
          });
        });
      });
    });
    return describe('when restored', function() {
      var createProject;
      createProject = function(params) {
        var stateFixture;
        if (params == null) {
          params = {};
        }
        stateFixture = params.stateFixture;
        delete params.stateFixture;
        if (params.root == null) {
          params.root = rootPath;
        }
        if (params.timestamp == null) {
          params.timestamp = new Date().toJSON();
        }
        if (params.variableMarkers == null) {
          params.variableMarkers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        if (params.colorMarkers == null) {
          params.colorMarkers = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        }
        if (params.version == null) {
          params.version = SERIALIZE_VERSION;
        }
        if (params.markersVersion == null) {
          params.markersVersion = SERIALIZE_MARKERS_VERSION;
        }
        return ColorProject.deserialize(jsonFixture(stateFixture, params));
      };
      describe('with a timestamp more recent than the files last modification date', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('does not rescans the files', function() {
          return expect(project.getVariables().length).toEqual(1);
        });
      });
      describe('with a version different that the current one', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json",
            version: "0.0.0"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('drops the whole serialized state and rescans all the project', function() {
          return expect(project.getVariables().length).toEqual(12);
        });
      });
      describe('with a serialized path that no longer exist', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "rename-file-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        it('drops drops the non-existing and reload the paths', function() {
          return expect(project.getPaths()).toEqual([rootPath + "/styles/buttons.styl", rootPath + "/styles/variables.styl"]);
        });
        it('drops the variables from the removed paths', function() {
          return expect(project.getVariablesForPath(rootPath + "/styles/foo.styl").length).toEqual(0);
        });
        return it('loads the variables from the new file', function() {
          return expect(project.getVariablesForPath(rootPath + "/styles/variables.styl").length).toEqual(12);
        });
      });
      describe('with a sourceNames setting value different than when serialized', function() {
        beforeEach(function() {
          atom.config.set('pigments.sourceNames', []);
          project = createProject({
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('drops the whole serialized state and rescans all the project', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
      });
      describe('with a markers version different that the current one', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json",
            markersVersion: "0.0.0"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        it('keeps the project related data', function() {
          expect(project.ignoredNames).toEqual(['vendor/*']);
          return expect(project.getPaths()).toEqual([rootPath + "/styles/buttons.styl", rootPath + "/styles/variables.styl"]);
        });
        return it('drops the variables and buffers data', function() {
          return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('with a timestamp older than the files last modification date', function() {
        beforeEach(function() {
          project = createProject({
            timestamp: new Date(0).toJSON(),
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('scans again all the files that have a more recent modification date', function() {
          return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('with some files not saved in the project state', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "partial-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('detects the new files and scans them', function() {
          return expect(project.getVariables().length).toEqual(12);
        });
      });
      describe('with an open editor and the corresponding buffer state', function() {
        var colorBuffer, editor, ref2;
        ref2 = [], editor = ref2[0], colorBuffer = ref2[1];
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            project = createProject({
              stateFixture: "open-buffer-project.json",
              id: editor.id
            });
            return spyOn(ColorBuffer.prototype, 'variablesAvailable').andCallThrough();
          });
          return runs(function() {
            return colorBuffer = project.colorBuffersByEditorId[editor.id];
          });
        });
        it('restores the color buffer in its previous state', function() {
          expect(colorBuffer).toBeDefined();
          return expect(colorBuffer.getColorMarkers().length).toEqual(TOTAL_COLORS_VARIABLES_IN_PROJECT);
        });
        return it('does not wait for the project variables', function() {
          return expect(colorBuffer.variablesAvailable).not.toHaveBeenCalled();
        });
      });
      return describe('with an open editor, the corresponding buffer state and a old timestamp', function() {
        var colorBuffer, editor, ref2;
        ref2 = [], editor = ref2[0], colorBuffer = ref2[1];
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            spyOn(ColorBuffer.prototype, 'updateVariableRanges').andCallThrough();
            return project = createProject({
              timestamp: new Date(0).toJSON(),
              stateFixture: "open-buffer-project.json",
              id: editor.id
            });
          });
          runs(function() {
            return colorBuffer = project.colorBuffersByEditorId[editor.id];
          });
          return waitsFor(function() {
            return colorBuffer.updateVariableRanges.callCount > 0;
          });
        });
        return it('invalidates the color buffer markers as soon as the dirty paths have been determined', function() {
          return expect(colorBuffer.updateVariableRanges).toHaveBeenCalled();
        });
      });
    });
  });

  describe('ColorProject', function() {
    var project, ref1, rootPath;
    ref1 = [], project = ref1[0], rootPath = ref1[1];
    return describe('when the project has a pigments defaults file', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = fixturesPath + "/project-with-defaults";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      return it('loads the defaults file content', function() {
        return expect(project.getColorVariables().length).toEqual(12);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1wcm9qZWN0LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBaUQsT0FBQSxDQUFRLGlCQUFSLENBQWpELEVBQUMseUNBQUQsRUFBb0I7O0VBQ3BCLFlBQUEsR0FBZSxPQUFBLENBQVEsc0JBQVI7O0VBQ2YsV0FBQSxHQUFjLE9BQUEsQ0FBUSxxQkFBUjs7RUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLG9CQUFSLENBQTZCLENBQUMsV0FBOUIsQ0FBMEMsU0FBMUMsRUFBcUQsVUFBckQ7O0VBQ2IsUUFBUyxPQUFBLENBQVEsa0JBQVI7O0VBRVYsMEJBQUEsR0FBNkI7O0VBQzdCLGlDQUFBLEdBQW9DOztFQUVwQyxRQUFBLENBQVMsY0FBVCxFQUF5QixTQUFBO0FBQ3ZCLFFBQUE7SUFBQSxPQUFnRCxFQUFoRCxFQUFDLGlCQUFELEVBQVUsaUJBQVYsRUFBbUIsa0JBQW5CLEVBQTZCLGVBQTdCLEVBQW9DO0lBRXBDLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBaEIsRUFBd0MsQ0FDdEMsUUFEc0MsQ0FBeEM7TUFHQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUJBQWhCLEVBQXlDLEVBQXpDO01BQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGlDQUFoQixFQUFtRCxDQUFDLEdBQUQsQ0FBbkQ7TUFFQyxlQUFnQixJQUFJLENBQUMsT0FBTyxDQUFDLFFB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QUF3QyxDQUFDLGdCQUF6QyxDQUFBO1FBRHlGLENBQTNGO01BakJrRixDQUFwRjtJQWhJd0IsQ0FBMUI7RUEvekJ1QixDQUF6Qjs7RUEyOUJBLFFBQUEsQ0FBUyxjQUFULEVBQXlCLFNBQUE7QUFDdkIsUUFBQTtJQUFBLE9BQXNCLEVBQXRCLEVBQUMsaUJBQUQsRUFBVTtXQUNWLFFBQUEsQ0FBUywrQ0FBVCxFQUEwRCxTQUFBO01BQ3hELFVBQUEsQ0FBVyxTQUFBO0FBQ1QsWUFBQTtRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBaEIsRUFBd0MsQ0FBQyxRQUFELENBQXhDO1FBRUMsZUFBZ0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUE7UUFDakIsUUFBQSxHQUFjLFlBQUQsR0FBYztRQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBc0IsQ0FBQyxRQUFELENBQXRCO1FBRUEsT0FBQSxHQUFjLElBQUEsWUFBQSxDQUFhLEVBQWI7ZUFFZCxlQUFBLENBQWdCLFNBQUE7aUJBQUcsT0FBTyxDQUFDLFVBQVIsQ0FBQTtRQUFILENBQWhCO01BVFMsQ0FBWDthQVdBLEVBQUEsQ0FBRyxpQ0FBSCxFQUFzQyxTQUFBO2VBQ3BDLE1BQUEsQ0FBTyxPQUFPLENBQUMsaUJBQVIsQ0FBQSxDQUEyQixDQUFDLE1BQW5DLENBQTBDLENBQUMsT0FBM0MsQ0FBbUQsRUFBbkQ7TUFEb0MsQ0FBdEM7SUFad0QsQ0FBMUQ7RUFGdUIsQ0FBekI7QUF6K0JBIiwic291cmNlc0NvbnRlbnQiOlsib3MgPSByZXF1aXJlICdvcydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xudGVtcCA9IHJlcXVpcmUgJ3RlbXAnXG5cbntTRVJJQUxJWkVfVkVSU0lPTiwgU0VSSUFMSVpFX01BUktFUlNfVkVSU0lPTn0gPSByZXF1aXJlICcuLi9saWIvdmVyc2lvbnMnXG5Db2xvclByb2plY3QgPSByZXF1aXJlICcuLi9saWIvY29sb3ItcHJvamVjdCdcbkNvbG9yQnVmZmVyID0gcmVxdWlyZSAnLi4vbGliL2NvbG9yLWJ1ZmZlcidcbmpzb25GaXh0dXJlID0gcmVxdWlyZSgnLi9oZWxwZXJzL2ZpeHR1cmVzJykuanNvbkZpeHR1cmUoX19kaXJuYW1lLCAnZml4dHVyZXMnKVxue2NsaWNrfSA9IHJlcXVpcmUgJy4vaGVscGVycy9ldmVudHMnXG5cblRPVEFMX1ZBUklBQkxFU19JTl9QUk9KRUNUID0gMTJcblRPVEFMX0NPTE9SU19WQVJJQUJMRVNfSU5fUFJPSkVDVCA9IDEwXG5cbmRlc2NyaWJlICdDb2xvclByb2plY3QnLCAtPlxuICBbcHJvamVjdCwgcHJvbWlzZSwgcm9vdFBhdGgsIHBhdGhzLCBldmVudFNweV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgW1xuICAgICAgJyouc3R5bCdcbiAgICBdXG4gICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5pZ25vcmVkTmFtZXMnLCBbXVxuICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuZmlsZXR5cGVzRm9yQ29sb3JXb3JkcycsIFsnKiddXG5cbiAgICBbZml4dHVyZXNQYXRoXSA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgcm9vdFBhdGggPSBcIiN7Zml4dHVyZXNQYXRofS9wcm9qZWN0XCJcbiAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3Jvb3RQYXRoXSlcblxuICAgIHByb2plY3QgPSBuZXcgQ29sb3JQcm9qZWN0KHtcbiAgICAgIGlnbm9yZWROYW1lczogWyd2ZW5kb3IvKiddXG4gICAgICBzb3VyY2VOYW1lczogWycqLmxlc3MnXVxuICAgICAgaWdub3JlZFNjb3BlczogWydcXFxcLmNvbW1lbnQnXVxuICAgIH0pXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgcHJvamVjdC5kZXN0cm95KClcblxuICBkZXNjcmliZSAnLmRlc2VyaWFsaXplJywgLT5cbiAgICBpdCAncmVzdG9yZXMgdGhlIHByb2plY3QgaW4gaXRzIHByZXZpb3VzIHN0YXRlJywgLT5cbiAgICAgIGRhdGEgPVxuICAgICAgICByb290OiByb290UGF0aFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9KU09OKClcbiAgICAgICAgdmVyc2lvbjogU0VSSUFMSVpFX1ZFUlNJT05cbiAgICAgICAgbWFya2Vyc1ZlcnNpb246IFNFUklBTElaRV9NQVJLRVJTX1ZFUlNJT05cblxuICAgICAganNvbiA9IGpzb25GaXh0dXJlICdiYXNlLXByb2plY3QuanNvbicsIGRhdGFcbiAgICAgIHByb2plY3QgPSBDb2xvclByb2plY3QuZGVzZXJpYWxpemUoanNvbilcblxuICAgICAgZXhwZWN0KHByb2plY3QpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhdGhzKCkpLnRvRXF1YWwoW1xuICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy9idXR0b25zLnN0eWxcIlxuICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiXG4gICAgICBdKVxuICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKFRPVEFMX1ZBUklBQkxFU19JTl9QUk9KRUNUKVxuICAgICAgZXhwZWN0KHByb2plY3QuZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfQ09MT1JTX1ZBUklBQkxFU19JTl9QUk9KRUNUKVxuXG4gIGRlc2NyaWJlICc6OmluaXRpYWxpemUnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGV2ZW50U3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC1pbml0aWFsaXplJylcbiAgICAgIHByb2plY3Qub25EaWRJbml0aWFsaXplKGV2ZW50U3B5KVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICBpdCAnbG9hZHMgdGhlIHBhdGhzIHRvIHNjYW4gaW4gdGhlIHByb2plY3QnLCAtPlxuICAgICAgZXhwZWN0KHByb2plY3QuZ2V0UGF0aHMoKSkudG9FcXVhbChbXG4gICAgICAgIFwiI3tyb290UGF0aH0vc3R5bGVzL2J1dHRvbnMuc3R5bFwiXG4gICAgICAgIFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCJcbiAgICAgIF0pXG5cbiAgICBpdCAnc2NhbnMgdGhlIGxvYWRlZCBwYXRocyB0byByZXRyaWV2ZSB0aGUgdmFyaWFibGVzJywgLT5cbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICBpdCAnZGlzcGF0Y2hlcyBhIGRpZC1pbml0aWFsaXplIGV2ZW50JywgLT5cbiAgICAgIGV4cGVjdChldmVudFNweSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgZGVzY3JpYmUgJzo6ZmluZEFsbENvbG9ycycsIC0+XG4gICAgaXQgJ3JldHVybnMgYWxsIHRoZSBjb2xvcnMgaW4gdGhlIGxlZ2libGVzIGZpbGVzIG9mIHRoZSBwcm9qZWN0JywgLT5cbiAgICAgIHNlYXJjaCA9IHByb2plY3QuZmluZEFsbENvbG9ycygpXG4gICAgICBleHBlY3Qoc2VhcmNoKS50b0JlRGVmaW5lZCgpXG5cbiAgIyMgICAgIyMgICAgICMjICAgICMjIyAgICAjIyMjIyMjIyAgICMjIyMjIyAgICAgIyMgICAgIyMgICMjIyMjIyMgICMjIyMjIyMjXG4gICMjICAgICMjICAgICAjIyAgICMjICMjICAgIyMgICAgICMjICMjICAgICMjICAgICMjIyAgICMjICMjICAgICAjIyAgICAjI1xuICAjIyAgICAjIyAgICAgIyMgICMjICAgIyMgICMjICAgICAjIyAjIyAgICAgICAgICAjIyMjICAjIyAjIyAgICAgIyMgICAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAjIyMjIyMjIyAgICMjIyMjIyAgICAgIyMgIyMgIyMgIyMgICAgICMjICAgICMjXG4gICMjICAgICAjIyAgICMjICAjIyMjIyMjIyMgIyMgICAjIyAgICAgICAgICMjICAgICMjICAjIyMjICMjICAgICAjIyAgICAjI1xuICAjIyAgICAgICMjICMjICAgIyMgICAgICMjICMjICAgICMjICAjIyAgICAjIyAgICAjIyAgICMjIyAjIyAgICAgIyMgICAgIyNcbiAgIyMgICAgICAgIyMjICAgICMjICAgICAjIyAjIyAgICAgIyMgICMjIyMjIyAgICAgIyMgICAgIyMgICMjIyMjIyMgICAgICMjXG4gICMjXG4gICMjICAgICMjICAgICAgICAjIyMjIyMjICAgICAjIyMgICAgIyMjIyMjIyMgICMjIyMjIyMjICMjIyMjIyMjXG4gICMjICAgICMjICAgICAgICMjICAgICAjIyAgICMjICMjICAgIyMgICAgICMjICMjICAgICAgICMjICAgICAjI1xuICAjIyAgICAjIyAgICAgICAjIyAgICAgIyMgICMjICAgIyMgICMjICAgICAjIyAjIyAgICAgICAjIyAgICAgIyNcbiAgIyMgICAgIyMgICAgICAgIyMgICAgICMjICMjICAgICAjIyAjIyAgICAgIyMgIyMjIyMjICAgIyMgICAgICMjXG4gICMjICAgICMjICAgICAgICMjICAgICAjIyAjIyMjIyMjIyMgIyMgICAgICMjICMjICAgICAgICMjICAgICAjI1xuICAjIyAgICAjIyAgICAgICAjIyAgICAgIyMgIyMgICAgICMjICMjICAgICAjIyAjIyAgICAgICAjIyAgICAgIyNcbiAgIyMgICAgIyMjIyMjIyMgICMjIyMjIyMgICMjICAgICAjIyAjIyMjIyMjIyAgIyMjIyMjIyMgIyMjIyMjIyNcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgdmFyaWFibGVzIGhhdmUgbm90IGJlZW4gbG9hZGVkIHlldCcsIC0+XG4gICAgZGVzY3JpYmUgJzo6c2VyaWFsaXplJywgLT5cbiAgICAgIGl0ICdyZXR1cm5zIGFuIG9iamVjdCB3aXRob3V0IHBhdGhzIG5vciB2YXJpYWJsZXMnLCAtPlxuICAgICAgICBkYXRlID0gbmV3IERhdGVcbiAgICAgICAgc3B5T24ocHJvamVjdCwgJ2dldFRpbWVzdGFtcCcpLmFuZENhbGxGYWtlIC0+IGRhdGVcbiAgICAgICAgZXhwZWN0ZWQgPSB7XG4gICAgICAgICAgZGVzZXJpYWxpemVyOiAnQ29sb3JQcm9qZWN0J1xuICAgICAgICAgIHRpbWVzdGFtcDogZGF0ZVxuICAgICAgICAgIHZlcnNpb246IFNFUklBTElaRV9WRVJTSU9OXG4gICAgICAgICAgbWFya2Vyc1ZlcnNpb246IFNFUklBTElaRV9NQVJLRVJTX1ZFUlNJT05cbiAgICAgICAgICBnbG9iYWxTb3VyY2VOYW1lczogWycqLnN0eWwnXVxuICAgICAgICAgIGdsb2JhbElnbm9yZWROYW1lczogW11cbiAgICAgICAgICBpZ25vcmVkTmFtZXM6IFsndmVuZG9yLyonXVxuICAgICAgICAgIHNvdXJjZU5hbWVzOiBbJyoubGVzcyddXG4gICAgICAgICAgaWdub3JlZFNjb3BlczogWydcXFxcLmNvbW1lbnQnXVxuICAgICAgICAgIGJ1ZmZlcnM6IHt9XG4gICAgICAgIH1cbiAgICAgICAgZXhwZWN0KHByb2plY3Quc2VyaWFsaXplKCkpLnRvRXF1YWwoZXhwZWN0ZWQpXG5cbiAgICBkZXNjcmliZSAnOjpnZXRWYXJpYWJsZXNGb3JQYXRoJywgLT5cbiAgICAgIGl0ICdyZXR1cm5zIHVuZGVmaW5lZCcsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlc0ZvclBhdGgoXCIje3Jvb3RQYXRofS9zdHlsZXMvdmFyaWFibGVzLnN0eWxcIikpLnRvRXF1YWwoW10pXG5cbiAgICBkZXNjcmliZSAnOjpnZXRWYXJpYWJsZUJ5TmFtZScsIC0+XG4gICAgICBpdCAncmV0dXJucyB1bmRlZmluZWQnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZUJ5TmFtZShcImZvb1wiKSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICBkZXNjcmliZSAnOjpnZXRWYXJpYWJsZUJ5SWQnLCAtPlxuICAgICAgaXQgJ3JldHVybnMgdW5kZWZpbmVkJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVCeUlkKDApKS50b0JlVW5kZWZpbmVkKClcblxuICAgIGRlc2NyaWJlICc6OmdldENvbnRleHQnLCAtPlxuICAgICAgaXQgJ3JldHVybnMgYW4gZW1wdHkgY29udGV4dCcsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldENvbnRleHQoKSkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRDb250ZXh0KCkuZ2V0VmFyaWFibGVzQ291bnQoKSkudG9FcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJzo6Z2V0UGFsZXR0ZScsIC0+XG4gICAgICBpdCAncmV0dXJucyBhbiBlbXB0eSBwYWxldHRlJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0UGFsZXR0ZSgpKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhbGV0dGUoKS5nZXRDb2xvcnNDb3VudCgpKS50b0VxdWFsKDApXG5cbiAgICBkZXNjcmliZSAnOjpyZWxvYWRWYXJpYWJsZXNGb3JQYXRoJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc3B5T24ocHJvamVjdCwgJ2luaXRpYWxpemUnKS5hbmRDYWxsVGhyb3VnaCgpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgcHJvamVjdC5yZWxvYWRWYXJpYWJsZXNGb3JQYXRoKFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCIpXG5cbiAgICAgIGl0ICdyZXR1cm5zIGEgcHJvbWlzZSBob29rZWQgb24gdGhlIGluaXRpYWxpemUgcHJvbWlzZScsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmluaXRpYWxpemUpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgZGVzY3JpYmUgJzo6c2V0SWdub3JlZE5hbWVzJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVkTmFtZXMoW10pXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICAgIGl0ICdpbml0aWFsaXplcyB0aGUgcHJvamVjdCB3aXRoIHRoZSBuZXcgcGF0aHMnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMzIpXG5cbiAgICBkZXNjcmliZSAnOjpzZXRTb3VyY2VOYW1lcycsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHByb2plY3Quc2V0U291cmNlTmFtZXMoW10pXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICAgIGl0ICdpbml0aWFsaXplcyB0aGUgcHJvamVjdCB3aXRoIHRoZSBuZXcgcGF0aHMnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTIpXG5cbiAgIyMgICAgIyMgICAgICMjICAgICMjIyAgICAjIyMjIyMjIyAgICMjIyMjI1xuICAjIyAgICAjIyAgICAgIyMgICAjIyAjIyAgICMjICAgICAjIyAjIyAgICAjI1xuICAjIyAgICAjIyAgICAgIyMgICMjICAgIyMgICMjICAgICAjIyAjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICMjIyMjIyMjICAgIyMjIyMjXG4gICMjICAgICAjIyAgICMjICAjIyMjIyMjIyMgIyMgICAjIyAgICAgICAgICMjXG4gICMjICAgICAgIyMgIyMgICAjIyAgICAgIyMgIyMgICAgIyMgICMjICAgICMjXG4gICMjICAgICAgICMjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICAjIyMjIyNcbiAgIyNcbiAgIyMgICAgIyMgICAgICAgICMjIyMjIyMgICAgICMjIyAgICAjIyMjIyMjIyAgIyMjIyMjIyMgIyMjIyMjIyNcbiAgIyMgICAgIyMgICAgICAgIyMgICAgICMjICAgIyMgIyMgICAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgICMjXG4gICMjICAgICMjICAgICAgICMjICAgICAjIyAgIyMgICAjIyAgIyMgICAgICMjICMjICAgICAgICMjICAgICAjI1xuICAjIyAgICAjIyAgICAgICAjIyAgICAgIyMgIyMgICAgICMjICMjICAgICAjIyAjIyMjIyMgICAjIyAgICAgIyNcbiAgIyMgICAgIyMgICAgICAgIyMgICAgICMjICMjIyMjIyMjIyAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgICMjXG4gICMjICAgICMjICAgICAgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjICMjICAgICAgICMjICAgICAjI1xuICAjIyAgICAjIyMjIyMjIyAgIyMjIyMjIyAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyMjIyAjIyMjIyMjI1xuXG4gIGRlc2NyaWJlICd3aGVuIHRoZSBwcm9qZWN0IGhhcyBubyB2YXJpYWJsZXMgc291cmNlIGZpbGVzJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgWycqLnNhc3MnXVxuXG4gICAgICBbZml4dHVyZXNQYXRoXSA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgICByb290UGF0aCA9IFwiI3tmaXh0dXJlc1BhdGh9LW5vLXNvdXJjZXNcIlxuICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtyb290UGF0aF0pXG5cbiAgICAgIHByb2plY3QgPSBuZXcgQ29sb3JQcm9qZWN0KHt9KVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgIGl0ICdpbml0aWFsaXplcyB0aGUgcGF0aHMgd2l0aCBhbiBlbXB0eSBhcnJheScsIC0+XG4gICAgICBleHBlY3QocHJvamVjdC5nZXRQYXRocygpKS50b0VxdWFsKFtdKVxuXG4gICAgaXQgJ2luaXRpYWxpemVzIHRoZSB2YXJpYWJsZXMgd2l0aCBhbiBlbXB0eSBhcnJheScsIC0+XG4gICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKSkudG9FcXVhbChbXSlcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgcHJvamVjdCBoYXMgY3VzdG9tIHNvdXJjZSBuYW1lcyBkZWZpbmVkJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgWycqLnNhc3MnXVxuXG4gICAgICBbZml4dHVyZXNQYXRoXSA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG5cbiAgICAgIHByb2plY3QgPSBuZXcgQ29sb3JQcm9qZWN0KHtzb3VyY2VOYW1lczogWycqLnN0eWwnXX0pXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LmluaXRpYWxpemUoKVxuXG4gICAgaXQgJ2luaXRpYWxpemVzIHRoZSBwYXRocyB3aXRoIGFuIGVtcHR5IGFycmF5JywgLT5cbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhdGhzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICBpdCAnaW5pdGlhbGl6ZXMgdGhlIHZhcmlhYmxlcyB3aXRoIGFuIGVtcHR5IGFycmF5JywgLT5cbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbChUT1RBTF9WQVJJQUJMRVNfSU5fUFJPSkVDVClcbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKFRPVEFMX0NPTE9SU19WQVJJQUJMRVNfSU5fUFJPSkVDVClcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgcHJvamVjdCBoYXMgbG9vcGluZyB2YXJpYWJsZSBkZWZpbml0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgWycqLnNhc3MnXVxuXG4gICAgICBbZml4dHVyZXNQYXRoXSA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgICByb290UGF0aCA9IFwiI3tmaXh0dXJlc1BhdGh9LXdpdGgtcmVjdXJzaW9uXCJcbiAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbcm9vdFBhdGhdKVxuXG4gICAgICBwcm9qZWN0ID0gbmV3IENvbG9yUHJvamVjdCh7fSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICBpdCAnaWdub3JlcyB0aGUgbG9vcGluZyBkZWZpbml0aW9uJywgLT5cbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCg1KVxuICAgICAgZXhwZWN0KHByb2plY3QuZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoNSlcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgdmFyaWFibGVzIGhhdmUgYmVlbiBsb2FkZWQnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LmluaXRpYWxpemUoKVxuXG4gICAgZGVzY3JpYmUgJzo6c2VyaWFsaXplJywgLT5cbiAgICAgIGl0ICdyZXR1cm5zIGFuIG9iamVjdCB3aXRoIHByb2plY3QgcHJvcGVydGllcycsIC0+XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZVxuICAgICAgICBzcHlPbihwcm9qZWN0LCAnZ2V0VGltZXN0YW1wJykuYW5kQ2FsbEZha2UgLT4gZGF0ZVxuICAgICAgICBleHBlY3QocHJvamVjdC5zZXJpYWxpemUoKSkudG9FcXVhbCh7XG4gICAgICAgICAgZGVzZXJpYWxpemVyOiAnQ29sb3JQcm9qZWN0J1xuICAgICAgICAgIGlnbm9yZWROYW1lczogWyd2ZW5kb3IvKiddXG4gICAgICAgICAgc291cmNlTmFtZXM6IFsnKi5sZXNzJ11cbiAgICAgICAgICBpZ25vcmVkU2NvcGVzOiBbJ1xcXFwuY29tbWVudCddXG4gICAgICAgICAgdGltZXN0YW1wOiBkYXRlXG4gICAgICAgICAgdmVyc2lvbjogU0VSSUFMSVpFX1ZFUlNJT05cbiAgICAgICAgICBtYXJrZXJzVmVyc2lvbjogU0VSSUFMSVpFX01BUktFUlNfVkVSU0lPTlxuICAgICAgICAgIHBhdGhzOiBbXG4gICAgICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy9idXR0b25zLnN0eWxcIlxuICAgICAgICAgICAgXCIje3Jvb3RQYXRofS9zdHlsZXMvdmFyaWFibGVzLnN0eWxcIlxuICAgICAgICAgIF1cbiAgICAgICAgICBnbG9iYWxTb3VyY2VOYW1lczogWycqLnN0eWwnXVxuICAgICAgICAgIGdsb2JhbElnbm9yZWROYW1lczogW11cbiAgICAgICAgICBidWZmZXJzOiB7fVxuICAgICAgICAgIHZhcmlhYmxlczogcHJvamVjdC52YXJpYWJsZXMuc2VyaWFsaXplKClcbiAgICAgICAgfSlcblxuICAgIGRlc2NyaWJlICc6OmdldFZhcmlhYmxlc0ZvclBhdGgnLCAtPlxuICAgICAgaXQgJ3JldHVybnMgdGhlIHZhcmlhYmxlcyBkZWZpbmVkIGluIHRoZSBmaWxlJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzRm9yUGF0aChcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICAgIGRlc2NyaWJlICdmb3IgYSBmaWxlIHRoYXQgd2FzIGlnbm9yZWQgaW4gdGhlIHNjYW5uaW5nIHByb2Nlc3MnLCAtPlxuICAgICAgICBpdCAncmV0dXJucyB1bmRlZmluZWQnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlc0ZvclBhdGgoXCIje3Jvb3RQYXRofS92ZW5kb3IvY3NzL3ZhcmlhYmxlcy5sZXNzXCIpKS50b0VxdWFsKFtdKVxuXG4gICAgZGVzY3JpYmUgJzo6ZGVsZXRlVmFyaWFibGVzRm9yUGF0aCcsIC0+XG4gICAgICBpdCAncmVtb3ZlcyBhbGwgdGhlIHZhcmlhYmxlcyBjb21pbmcgZnJvbSB0aGUgc3BlY2lmaWVkIGZpbGUnLCAtPlxuICAgICAgICBwcm9qZWN0LmRlbGV0ZVZhcmlhYmxlc0ZvclBhdGgoXCIje3Jvb3RQYXRofS9zdHlsZXMvdmFyaWFibGVzLnN0eWxcIilcblxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXNGb3JQYXRoKFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCIpKS50b0VxdWFsKFtdKVxuXG4gICAgZGVzY3JpYmUgJzo6Z2V0Q29udGV4dCcsIC0+XG4gICAgICBpdCAncmV0dXJucyBhIGNvbnRleHQgd2l0aCB0aGUgcHJvamVjdCB2YXJpYWJsZXMnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRDb250ZXh0KCkpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0Q29udGV4dCgpLmdldFZhcmlhYmxlc0NvdW50KCkpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICBkZXNjcmliZSAnOjpnZXRQYWxldHRlJywgLT5cbiAgICAgIGl0ICdyZXR1cm5zIGEgcGFsZXR0ZSB3aXRoIHRoZSBjb2xvcnMgZnJvbSB0aGUgcHJvamVjdCcsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhbGV0dGUoKSkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRQYWxldHRlKCkuZ2V0Q29sb3JzQ291bnQoKSkudG9FcXVhbCgxMClcblxuICAgIGRlc2NyaWJlICc6OnNob3dWYXJpYWJsZUluRmlsZScsIC0+XG4gICAgICBpdCAnb3BlbnMgdGhlIGZpbGUgd2hlcmUgaXMgbG9jYXRlZCB0aGUgdmFyaWFibGUnLCAtPlxuICAgICAgICBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLWFkZC10ZXh0LWVkaXRvcicpXG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9uRGlkQWRkVGV4dEVkaXRvcihzcHkpXG5cbiAgICAgICAgcHJvamVjdC5zaG93VmFyaWFibGVJbkZpbGUocHJvamVjdC5nZXRWYXJpYWJsZXMoKVswXSlcblxuICAgICAgICB3YWl0c0ZvciAtPiBzcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICAgICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpKS50b0VxdWFsKFtbMSwyXSxbMSwxNF1dKVxuXG4gICAgZGVzY3JpYmUgJzo6cmVsb2FkVmFyaWFibGVzRm9yUGF0aCcsIC0+XG4gICAgICBkZXNjcmliZSAnZm9yIGEgZmlsZSB0aGF0IGlzIHBhcnQgb2YgdGhlIGxvYWRlZCBwYXRocycsIC0+XG4gICAgICAgIGRlc2NyaWJlICd3aGVyZSB0aGUgcmVsb2FkIGZpbmRzIG5ldyB2YXJpYWJsZXMnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHByb2plY3QuZGVsZXRlVmFyaWFibGVzRm9yUGF0aChcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiKVxuXG4gICAgICAgICAgICBldmVudFNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaWQtdXBkYXRlLXZhcmlhYmxlcycpXG4gICAgICAgICAgICBwcm9qZWN0Lm9uRGlkVXBkYXRlVmFyaWFibGVzKGV2ZW50U3B5KVxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QucmVsb2FkVmFyaWFibGVzRm9yUGF0aChcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiKVxuXG4gICAgICAgICAgaXQgJ3NjYW5zIGFnYWluIHRoZSBmaWxlIHRvIGZpbmQgdmFyaWFibGVzJywgLT5cbiAgICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbChUT1RBTF9WQVJJQUJMRVNfSU5fUFJPSkVDVClcblxuICAgICAgICAgIGl0ICdkaXNwYXRjaGVzIGEgZGlkLXVwZGF0ZS12YXJpYWJsZXMgZXZlbnQnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGV2ZW50U3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgICBkZXNjcmliZSAnd2hlcmUgdGhlIHJlbG9hZCBmaW5kcyBub3RoaW5nIG5ldycsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgZXZlbnRTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXVwZGF0ZS12YXJpYWJsZXMnKVxuICAgICAgICAgICAgcHJvamVjdC5vbkRpZFVwZGF0ZVZhcmlhYmxlcyhldmVudFNweSlcbiAgICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LnJlbG9hZFZhcmlhYmxlc0ZvclBhdGgoXCIje3Jvb3RQYXRofS9zdHlsZXMvdmFyaWFibGVzLnN0eWxcIilcblxuICAgICAgICAgIGl0ICdsZWF2ZXMgdGhlIGZpbGUgdmFyaWFibGVzIGludGFjdCcsIC0+XG4gICAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICAgICAgICBpdCAnZG9lcyBub3QgZGlzcGF0Y2ggYSBkaWQtdXBkYXRlLXZhcmlhYmxlcyBldmVudCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoZXZlbnRTcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlICc6OnJlbG9hZFZhcmlhYmxlc0ZvclBhdGhzJywgLT5cbiAgICAgIGRlc2NyaWJlICdmb3IgYSBmaWxlIHRoYXQgaXMgcGFydCBvZiB0aGUgbG9hZGVkIHBhdGhzJywgLT5cbiAgICAgICAgZGVzY3JpYmUgJ3doZXJlIHRoZSByZWxvYWQgZmluZHMgbmV3IHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgcHJvamVjdC5kZWxldGVWYXJpYWJsZXNGb3JQYXRocyhbXG4gICAgICAgICAgICAgIFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCIsIFwiI3tyb290UGF0aH0vc3R5bGVzL2J1dHRvbnMuc3R5bFwiXG4gICAgICAgICAgICBdKVxuICAgICAgICAgICAgZXZlbnRTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXVwZGF0ZS12YXJpYWJsZXMnKVxuICAgICAgICAgICAgcHJvamVjdC5vbkRpZFVwZGF0ZVZhcmlhYmxlcyhldmVudFNweSlcbiAgICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LnJlbG9hZFZhcmlhYmxlc0ZvclBhdGhzKFtcbiAgICAgICAgICAgICAgXCIje3Jvb3RQYXRofS9zdHlsZXMvdmFyaWFibGVzLnN0eWxcIlxuICAgICAgICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy9idXR0b25zLnN0eWxcIlxuICAgICAgICAgICAgXSlcblxuICAgICAgICAgIGl0ICdzY2FucyBhZ2FpbiB0aGUgZmlsZSB0byBmaW5kIHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICAgICAgICBpdCAnZGlzcGF0Y2hlcyBhIGRpZC11cGRhdGUtdmFyaWFibGVzIGV2ZW50JywgLT5cbiAgICAgICAgICAgIGV4cGVjdChldmVudFNweSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgZGVzY3JpYmUgJ3doZXJlIHRoZSByZWxvYWQgZmluZHMgbm90aGluZyBuZXcnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGV2ZW50U3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUtdmFyaWFibGVzJylcbiAgICAgICAgICAgIHByb2plY3Qub25EaWRVcGRhdGVWYXJpYWJsZXMoZXZlbnRTcHkpXG4gICAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5yZWxvYWRWYXJpYWJsZXNGb3JQYXRocyhbXG4gICAgICAgICAgICAgIFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCJcbiAgICAgICAgICAgICAgXCIje3Jvb3RQYXRofS9zdHlsZXMvYnV0dG9ucy5zdHlsXCJcbiAgICAgICAgICAgIF0pXG5cbiAgICAgICAgICBpdCAnbGVhdmVzIHRoZSBmaWxlIHZhcmlhYmxlcyBpbnRhY3QnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKFRPVEFMX1ZBUklBQkxFU19JTl9QUk9KRUNUKVxuXG4gICAgICAgICAgaXQgJ2RvZXMgbm90IGRpc3BhdGNoIGEgZGlkLXVwZGF0ZS12YXJpYWJsZXMgZXZlbnQnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGV2ZW50U3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgIGRlc2NyaWJlICdmb3IgYSBmaWxlIHRoYXQgaXMgbm90IHBhcnQgb2YgdGhlIGxvYWRlZCBwYXRocycsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzcHlPbihwcm9qZWN0LCAnbG9hZFZhcmlhYmxlc0ZvclBhdGgnKS5hbmRDYWxsVGhyb3VnaCgpXG5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICAgIHByb2plY3QucmVsb2FkVmFyaWFibGVzRm9yUGF0aChcIiN7cm9vdFBhdGh9L3ZlbmRvci9jc3MvdmFyaWFibGVzLmxlc3NcIilcblxuICAgICAgICBpdCAnZG9lcyBub3RoaW5nJywgLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5sb2FkVmFyaWFibGVzRm9yUGF0aCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gYSBidWZmZXIgd2l0aCB2YXJpYWJsZXMgaXMgb3BlbicsIC0+XG4gICAgICBbZWRpdG9yLCBjb2xvckJ1ZmZlcl0gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBldmVudFNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaWQtdXBkYXRlLXZhcmlhYmxlcycpXG4gICAgICAgIHByb2plY3Qub25EaWRVcGRhdGVWYXJpYWJsZXMoZXZlbnRTcHkpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbignc3R5bGVzL3ZhcmlhYmxlcy5zdHlsJykudGhlbiAobykgLT4gZWRpdG9yID0gb1xuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBjb2xvckJ1ZmZlciA9IHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgIHNweU9uKGNvbG9yQnVmZmVyLCAnc2NhbkJ1ZmZlckZvclZhcmlhYmxlcycpLmFuZENhbGxUaHJvdWdoKClcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG5cbiAgICAgIGl0ICd1cGRhdGVzIHRoZSBwcm9qZWN0IHZhcmlhYmxlIHdpdGggdGhlIGJ1ZmZlciByYW5nZXMnLCAtPlxuICAgICAgICBmb3IgdmFyaWFibGUgaW4gcHJvamVjdC5nZXRWYXJpYWJsZXMoKVxuICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5idWZmZXJSYW5nZSkudG9CZURlZmluZWQoKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiBhIGNvbG9yIGlzIG1vZGlmaWVkIHRoYXQgZG9lcyBub3QgYWZmZWN0IG90aGVyIHZhcmlhYmxlcyByYW5nZXMnLCAtPlxuICAgICAgICBbdmFyaWFibGVzVGV4dFJhbmdlc10gPSBbXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgdmFyaWFibGVzVGV4dFJhbmdlcyA9IHt9XG4gICAgICAgICAgcHJvamVjdC5nZXRWYXJpYWJsZXNGb3JQYXRoKGVkaXRvci5nZXRQYXRoKCkpLmZvckVhY2ggKHZhcmlhYmxlKSAtPlxuICAgICAgICAgICAgdmFyaWFibGVzVGV4dFJhbmdlc1t2YXJpYWJsZS5uYW1lXSA9IHZhcmlhYmxlLnJhbmdlXG5cbiAgICAgICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShbWzEsN10sWzEsMTRdXSlcbiAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnIzMzNicpXG4gICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLmVtaXR0ZXIuZW1pdCgnZGlkLXN0b3AtY2hhbmdpbmcnKVxuXG4gICAgICAgICAgd2FpdHNGb3IgLT4gZXZlbnRTcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgIGl0ICdyZWxvYWRzIHRoZSB2YXJpYWJsZXMgd2l0aCB0aGUgYnVmZmVyIGluc3RlYWQgb2YgdGhlIGZpbGUnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlci5zY2FuQnVmZmVyRm9yVmFyaWFibGVzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICAgICAgaXQgJ3VzZXMgdGhlIGJ1ZmZlciByYW5nZXMgdG8gZGV0ZWN0IHdoaWNoIHZhcmlhYmxlcyB3ZXJlIHJlYWxseSBjaGFuZ2VkJywgLT5cbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuYXJnc0ZvckNhbGxbMF1bMF0uZGVzdHJveWVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuYXJnc0ZvckNhbGxbMF1bMF0uY3JlYXRlZCkudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5LmFyZ3NGb3JDYWxsWzBdWzBdLnVwZGF0ZWQubGVuZ3RoKS50b0VxdWFsKDEpXG5cbiAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIHRleHQgcmFuZ2Ugb2YgdGhlIG90aGVyIHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgcHJvamVjdC5nZXRWYXJpYWJsZXNGb3JQYXRoKFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCIpLmZvckVhY2ggKHZhcmlhYmxlKSAtPlxuICAgICAgICAgICAgaWYgdmFyaWFibGUubmFtZSBpc250ICdjb2xvcnMucmVkJ1xuICAgICAgICAgICAgICBleHBlY3QodmFyaWFibGUucmFuZ2VbMF0pLnRvRXF1YWwodmFyaWFibGVzVGV4dFJhbmdlc1t2YXJpYWJsZS5uYW1lXVswXSAtIDMpXG4gICAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5yYW5nZVsxXSkudG9FcXVhbCh2YXJpYWJsZXNUZXh0UmFuZ2VzW3ZhcmlhYmxlLm5hbWVdWzFdIC0gMylcblxuICAgICAgICBpdCAnZGlzcGF0Y2hlcyBhIGRpZC11cGRhdGUtdmFyaWFibGVzIGV2ZW50JywgLT5cbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiBhIHRleHQgaXMgaW5zZXJ0ZWQgdGhhdCBhZmZlY3RzIG90aGVyIHZhcmlhYmxlcyByYW5nZXMnLCAtPlxuICAgICAgICBbdmFyaWFibGVzVGV4dFJhbmdlcywgdmFyaWFibGVzQnVmZmVyUmFuZ2VzXSA9IFtdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICB2YXJpYWJsZXNUZXh0UmFuZ2VzID0ge31cbiAgICAgICAgICAgIHZhcmlhYmxlc0J1ZmZlclJhbmdlcyA9IHt9XG4gICAgICAgICAgICBwcm9qZWN0LmdldFZhcmlhYmxlc0ZvclBhdGgoZWRpdG9yLmdldFBhdGgoKSkuZm9yRWFjaCAodmFyaWFibGUpIC0+XG4gICAgICAgICAgICAgIHZhcmlhYmxlc1RleHRSYW5nZXNbdmFyaWFibGUubmFtZV0gPSB2YXJpYWJsZS5yYW5nZVxuICAgICAgICAgICAgICB2YXJpYWJsZXNCdWZmZXJSYW5nZXNbdmFyaWFibGUubmFtZV0gPSB2YXJpYWJsZS5idWZmZXJSYW5nZVxuXG4gICAgICAgICAgICBzcHlPbihwcm9qZWN0LnZhcmlhYmxlcywgJ2FkZE1hbnknKS5hbmRDYWxsVGhyb3VnaCgpXG5cbiAgICAgICAgICAgIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKFtbMCwwXSxbMCwwXV0pXG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnXFxuXFxuJylcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5lbWl0dGVyLmVtaXQoJ2RpZC1zdG9wLWNoYW5naW5nJylcblxuICAgICAgICAgIHdhaXRzRm9yIC0+IHByb2plY3QudmFyaWFibGVzLmFkZE1hbnkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgIGl0ICdkb2VzIG5vdCB0cmlnZ2VyIGEgY2hhbmdlIGV2ZW50JywgLT5cbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuY2FsbENvdW50KS50b0VxdWFsKDApXG5cbiAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIHJhbmdlIG9mIHRoZSB1cGRhdGVkIHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgcHJvamVjdC5nZXRWYXJpYWJsZXNGb3JQYXRoKFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCIpLmZvckVhY2ggKHZhcmlhYmxlKSAtPlxuICAgICAgICAgICAgaWYgdmFyaWFibGUubmFtZSBpc250ICdjb2xvcnMucmVkJ1xuICAgICAgICAgICAgICBleHBlY3QodmFyaWFibGUucmFuZ2VbMF0pLnRvRXF1YWwodmFyaWFibGVzVGV4dFJhbmdlc1t2YXJpYWJsZS5uYW1lXVswXSArIDIpXG4gICAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5yYW5nZVsxXSkudG9FcXVhbCh2YXJpYWJsZXNUZXh0UmFuZ2VzW3ZhcmlhYmxlLm5hbWVdWzFdICsgMilcbiAgICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLmJ1ZmZlclJhbmdlLmlzRXF1YWwodmFyaWFibGVzQnVmZmVyUmFuZ2VzW3ZhcmlhYmxlLm5hbWVdKSkudG9CZUZhbHN5KClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gYSBjb2xvciBpcyByZW1vdmVkJywgLT5cbiAgICAgICAgW3ZhcmlhYmxlc1RleHRSYW5nZXNdID0gW11cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIHZhcmlhYmxlc1RleHRSYW5nZXMgPSB7fVxuICAgICAgICAgICAgcHJvamVjdC5nZXRWYXJpYWJsZXNGb3JQYXRoKGVkaXRvci5nZXRQYXRoKCkpLmZvckVhY2ggKHZhcmlhYmxlKSAtPlxuICAgICAgICAgICAgICB2YXJpYWJsZXNUZXh0UmFuZ2VzW3ZhcmlhYmxlLm5hbWVdID0gdmFyaWFibGUucmFuZ2VcblxuICAgICAgICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoW1sxLDBdLFsyLDBdXSlcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCcnKVxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLmVtaXR0ZXIuZW1pdCgnZGlkLXN0b3AtY2hhbmdpbmcnKVxuXG4gICAgICAgICAgd2FpdHNGb3IgLT4gZXZlbnRTcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgIGl0ICdyZWxvYWRzIHRoZSB2YXJpYWJsZXMgd2l0aCB0aGUgYnVmZmVyIGluc3RlYWQgb2YgdGhlIGZpbGUnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlci5zY2FuQnVmZmVyRm9yVmFyaWFibGVzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QgLSAxKVxuXG4gICAgICAgIGl0ICd1c2VzIHRoZSBidWZmZXIgcmFuZ2VzIHRvIGRldGVjdCB3aGljaCB2YXJpYWJsZXMgd2VyZSByZWFsbHkgY2hhbmdlZCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5LmFyZ3NGb3JDYWxsWzBdWzBdLmRlc3Ryb3llZC5sZW5ndGgpLnRvRXF1YWwoMSlcbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuYXJnc0ZvckNhbGxbMF1bMF0uY3JlYXRlZCkudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5LmFyZ3NGb3JDYWxsWzBdWzBdLnVwZGF0ZWQpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICAgIGl0ICdjYW4gbm8gbG9uZ2VyIGJlIGZvdW5kIGluIHRoZSBwcm9qZWN0IHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkuc29tZSAodikgLT4gdi5uYW1lIGlzICdjb2xvcnMucmVkJykudG9CZUZhbHN5KClcbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRDb2xvclZhcmlhYmxlcygpLnNvbWUgKHYpIC0+IHYubmFtZSBpcyAnY29sb3JzLnJlZCcpLnRvQmVGYWxzeSgpXG5cbiAgICAgICAgaXQgJ2Rpc3BhdGNoZXMgYSBkaWQtdXBkYXRlLXZhcmlhYmxlcyBldmVudCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gYWxsIHRoZSBjb2xvcnMgYXJlIHJlbW92ZWQnLCAtPlxuICAgICAgICBbdmFyaWFibGVzVGV4dFJhbmdlc10gPSBbXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgdmFyaWFibGVzVGV4dFJhbmdlcyA9IHt9XG4gICAgICAgICAgICBwcm9qZWN0LmdldFZhcmlhYmxlc0ZvclBhdGgoZWRpdG9yLmdldFBhdGgoKSkuZm9yRWFjaCAodmFyaWFibGUpIC0+XG4gICAgICAgICAgICAgIHZhcmlhYmxlc1RleHRSYW5nZXNbdmFyaWFibGUubmFtZV0gPSB2YXJpYWJsZS5yYW5nZVxuXG4gICAgICAgICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShbWzAsMF0sW0luZmluaXR5LEluZmluaXR5XV0pXG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnJylcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5lbWl0dGVyLmVtaXQoJ2RpZC1zdG9wLWNoYW5naW5nJylcblxuICAgICAgICAgIHdhaXRzRm9yIC0+IGV2ZW50U3B5LmNhbGxDb3VudCA+IDBcblxuICAgICAgICBpdCAncmVtb3ZlcyBldmVyeSB2YXJpYWJsZSBmcm9tIHRoZSBmaWxlJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXIuc2NhbkJ1ZmZlckZvclZhcmlhYmxlcykudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuYXJnc0ZvckNhbGxbMF1bMF0uZGVzdHJveWVkLmxlbmd0aCkudG9FcXVhbChUT1RBTF9WQVJJQUJMRVNfSU5fUFJPSkVDVClcbiAgICAgICAgICBleHBlY3QoZXZlbnRTcHkuYXJnc0ZvckNhbGxbMF1bMF0uY3JlYXRlZCkudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5LmFyZ3NGb3JDYWxsWzBdWzBdLnVwZGF0ZWQpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICAgIGl0ICdjYW4gbm8gbG9uZ2VyIGJlIGZvdW5kIGluIHRoZSBwcm9qZWN0IHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkuc29tZSAodikgLT4gdi5uYW1lIGlzICdjb2xvcnMucmVkJykudG9CZUZhbHN5KClcbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRDb2xvclZhcmlhYmxlcygpLnNvbWUgKHYpIC0+IHYubmFtZSBpcyAnY29sb3JzLnJlZCcpLnRvQmVGYWxzeSgpXG5cbiAgICAgICAgaXQgJ2Rpc3BhdGNoZXMgYSBkaWQtdXBkYXRlLXZhcmlhYmxlcyBldmVudCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGV2ZW50U3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlICc6OnNldElnbm9yZWROYW1lcycsIC0+XG4gICAgICBkZXNjcmliZSAnd2l0aCBhbiBlbXB0eSBhcnJheScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTIpXG5cbiAgICAgICAgICBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSAnZGlkLXVwZGF0ZS12YXJpYWJsZXMnXG4gICAgICAgICAgcHJvamVjdC5vbkRpZFVwZGF0ZVZhcmlhYmxlcyhzcHkpXG4gICAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVkTmFtZXMoW10pXG5cbiAgICAgICAgICB3YWl0c0ZvciAtPiBzcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgIGl0ICdyZWxvYWRzIHRoZSB2YXJpYWJsZXMgZnJvbSB0aGUgbmV3IHBhdGhzJywgLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMzIpXG5cbiAgICAgIGRlc2NyaWJlICd3aXRoIGEgbW9yZSByZXN0cmljdGl2ZSBhcnJheScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTIpXG5cbiAgICAgICAgICBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSAnZGlkLXVwZGF0ZS12YXJpYWJsZXMnXG4gICAgICAgICAgcHJvamVjdC5vbkRpZFVwZGF0ZVZhcmlhYmxlcyhzcHkpXG4gICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3Quc2V0SWdub3JlZE5hbWVzKFsndmVuZG9yLyonLCAnKiovKi5zdHlsJ10pXG5cbiAgICAgICAgaXQgJ2NsZWFycyBhbGwgdGhlIHBhdGhzIGFzIHRoZXJlIGlzIG5vIGxlZ2libGUgcGF0aHMnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhdGhzKCkubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICBkZXNjcmliZSAnd2hlbiB0aGUgcHJvamVjdCBoYXMgbXVsdGlwbGUgcm9vdCBkaXJlY3RvcnknLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgWycqKi8qLnNhc3MnLCAnKiovKi5zdHlsJ11cblxuICAgICAgICBbZml4dHVyZXNQYXRoXSA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbXG4gICAgICAgICAgXCIje2ZpeHR1cmVzUGF0aH1cIlxuICAgICAgICAgIFwiI3tmaXh0dXJlc1BhdGh9LXdpdGgtcmVjdXJzaW9uXCJcbiAgICAgICAgXSlcblxuICAgICAgICBwcm9qZWN0ID0gbmV3IENvbG9yUHJvamVjdCh7fSlcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgICAgaXQgJ2ZpbmRzIHRoZSB2YXJpYWJsZXMgZnJvbSB0aGUgdHdvIGRpcmVjdG9yaWVzJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDE3KVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gdGhlIHByb2plY3QgaGFzIFZDUyBpZ25vcmVkIGZpbGVzJywgLT5cbiAgICAgIFtwcm9qZWN0UGF0aF0gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgWycqLnNhc3MnXVxuXG4gICAgICAgIGZpeHR1cmUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAncHJvamVjdC13aXRoLWdpdGlnbm9yZScpXG5cbiAgICAgICAgcHJvamVjdFBhdGggPSB0ZW1wLm1rZGlyU3luYygncGlnbWVudHMtcHJvamVjdCcpXG4gICAgICAgIGRvdEdpdEZpeHR1cmUgPSBwYXRoLmpvaW4oZml4dHVyZSwgJ2dpdC5naXQnKVxuICAgICAgICBkb3RHaXQgPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICcuZ2l0JylcbiAgICAgICAgZnMuY29weVN5bmMoZG90R2l0Rml4dHVyZSwgZG90R2l0KVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihwcm9qZWN0UGF0aCwgJy5naXRpZ25vcmUnKSwgZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihmaXh0dXJlLCAnZ2l0LmdpdGlnbm9yZScpKSlcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocHJvamVjdFBhdGgsICdiYXNlLnNhc3MnKSwgZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihmaXh0dXJlLCAnYmFzZS5zYXNzJykpKVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ2lnbm9yZWQuc2FzcycpLCBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKGZpeHR1cmUsICdpZ25vcmVkLnNhc3MnKSkpXG4gICAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4ocHJvamVjdFBhdGgsICdib3dlcl9jb21wb25lbnRzJykpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHByb2plY3RQYXRoLCAnYm93ZXJfY29tcG9uZW50cycsICdzb21lLWlnbm9yZWQtZmlsZS5zYXNzJyksIGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oZml4dHVyZSwgJ2Jvd2VyX2NvbXBvbmVudHMnLCAnc29tZS1pZ25vcmVkLWZpbGUuc2FzcycpKSlcblxuICAgICAgICAjIEZJWE1FIHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSByZXR1cm5zIHRoZSBwcm9qZWN0IHBhdGggcHJlZml4ZWQgd2l0aFxuICAgICAgICAjIC9wcml2YXRlXG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbcHJvamVjdFBhdGhdKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiB0aGUgaWdub3JlVmNzSWdub3JlZFBhdGhzIHNldHRpbmcgaXMgZW5hYmxlZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLmlnbm9yZVZjc0lnbm9yZWRQYXRocycsIHRydWVcbiAgICAgICAgICBwcm9qZWN0ID0gbmV3IENvbG9yUHJvamVjdCh7fSlcblxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LmluaXRpYWxpemUoKVxuXG4gICAgICAgIGl0ICdmaW5kcyB0aGUgdmFyaWFibGVzIGZyb20gdGhlIHRocmVlIGZpbGVzJywgLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRQYXRocygpLmxlbmd0aCkudG9FcXVhbCgxKVxuXG4gICAgICAgIGRlc2NyaWJlICdhbmQgdGhlbiBkaXNhYmxlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUtdmFyaWFibGVzJylcbiAgICAgICAgICAgIHByb2plY3Qub25EaWRVcGRhdGVWYXJpYWJsZXMoc3B5KVxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5pZ25vcmVWY3NJZ25vcmVkUGF0aHMnLCBmYWxzZVxuXG4gICAgICAgICAgICB3YWl0c0ZvciAtPiBzcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgICAgaXQgJ3JlbG9hZHMgdGhlIHBhdGhzJywgLT5cbiAgICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhdGhzKCkubGVuZ3RoKS50b0VxdWFsKDMpXG5cbiAgICAgICAgICBpdCAncmVsb2FkcyB0aGUgdmFyaWFibGVzJywgLT5cbiAgICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgxMClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gdGhlIGlnbm9yZVZjc0lnbm9yZWRQYXRocyBzZXR0aW5nIGlzIGRpc2FibGVkJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuaWdub3JlVmNzSWdub3JlZFBhdGhzJywgZmFsc2VcbiAgICAgICAgICBwcm9qZWN0ID0gbmV3IENvbG9yUHJvamVjdCh7fSlcblxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcm9qZWN0LmluaXRpYWxpemUoKVxuXG4gICAgICAgIGl0ICdmaW5kcyB0aGUgdmFyaWFibGVzIGZyb20gdGhlIHRocmVlIGZpbGVzJywgLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTApXG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGgpLnRvRXF1YWwoMylcblxuICAgICAgICBkZXNjcmliZSAnYW5kIHRoZW4gZW5hYmxlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUtdmFyaWFibGVzJylcbiAgICAgICAgICAgIHByb2plY3Qub25EaWRVcGRhdGVWYXJpYWJsZXMoc3B5KVxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5pZ25vcmVWY3NJZ25vcmVkUGF0aHMnLCB0cnVlXG5cbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IHNweS5jYWxsQ291bnQgPiAwXG5cbiAgICAgICAgICBpdCAncmVsb2FkcyB0aGUgcGF0aHMnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGgpLnRvRXF1YWwoMSlcblxuICAgICAgICAgIGl0ICdyZWxvYWRzIHRoZSB2YXJpYWJsZXMnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDMpXG5cbiAgICAjIyAgICAgIyMjIyMjICAjIyMjIyMjIyAjIyMjIyMjIyAjIyMjIyMjIyAjIyMjICMjICAgICMjICAjIyMjIyMgICAgIyMjIyMjXG4gICAgIyMgICAgIyMgICAgIyMgIyMgICAgICAgICAgIyMgICAgICAgIyMgICAgICMjICAjIyMgICAjIyAjIyAgICAjIyAgIyMgICAgIyNcbiAgICAjIyAgICAjIyAgICAgICAjIyAgICAgICAgICAjIyAgICAgICAjIyAgICAgIyMgICMjIyMgICMjICMjICAgICAgICAjI1xuICAgICMjICAgICAjIyMjIyMgICMjIyMjIyAgICAgICMjICAgICAgICMjICAgICAjIyAgIyMgIyMgIyMgIyMgICAjIyMjICAjIyMjIyNcbiAgICAjIyAgICAgICAgICAjIyAjIyAgICAgICAgICAjIyAgICAgICAjIyAgICAgIyMgICMjICAjIyMjICMjICAgICMjICAgICAgICAjI1xuICAgICMjICAgICMjICAgICMjICMjICAgICAgICAgICMjICAgICAgICMjICAgICAjIyAgIyMgICAjIyMgIyMgICAgIyMgICMjICAgICMjXG4gICAgIyMgICAgICMjIyMjIyAgIyMjIyMjIyMgICAgIyMgICAgICAgIyMgICAgIyMjIyAjIyAgICAjIyAgIyMjIyMjICAgICMjIyMjI1xuXG4gICAgZGVzY3JpYmUgJ3doZW4gdGhlIHNvdXJjZU5hbWVzIHNldHRpbmcgaXMgY2hhbmdlZCcsIC0+XG4gICAgICBbdXBkYXRlU3B5XSA9IFtdXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgb3JpZ2luYWxQYXRocyA9IHByb2plY3QuZ2V0UGF0aHMoKVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgW11cblxuICAgICAgICB3YWl0c0ZvciAtPiBwcm9qZWN0LmdldFBhdGhzKCkuam9pbignLCcpIGlzbnQgb3JpZ2luYWxQYXRocy5qb2luKCcsJylcblxuICAgICAgaXQgJ3VwZGF0ZXMgdGhlIHZhcmlhYmxlcyB1c2luZyB0aGUgbmV3IHBhdHRlcm4nLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgICAgZGVzY3JpYmUgJ3NvIHRoYXQgbmV3IHBhdGhzIGFyZSBmb3VuZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB1cGRhdGVTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXVwZGF0ZS12YXJpYWJsZXMnKVxuXG4gICAgICAgICAgb3JpZ2luYWxQYXRocyA9IHByb2plY3QuZ2V0UGF0aHMoKVxuICAgICAgICAgIHByb2plY3Qub25EaWRVcGRhdGVWYXJpYWJsZXModXBkYXRlU3B5KVxuXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5zb3VyY2VOYW1lcycsIFsnKiovKi5zdHlsJ11cblxuICAgICAgICAgIHdhaXRzRm9yIC0+IHByb2plY3QuZ2V0UGF0aHMoKS5qb2luKCcsJykgaXNudCBvcmlnaW5hbFBhdGhzLmpvaW4oJywnKVxuICAgICAgICAgIHdhaXRzRm9yIC0+IHVwZGF0ZVNweS5jYWxsQ291bnQgPiAwXG5cbiAgICAgICAgaXQgJ2xvYWRzIHRoZSB2YXJpYWJsZXMgZnJvbSB0aGVzZSBuZXcgcGF0aHMnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbChUT1RBTF9WQVJJQUJMRVNfSU5fUFJPSkVDVClcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBpZ25vcmVkTmFtZXMgc2V0dGluZyBpcyBjaGFuZ2VkJywgLT5cbiAgICAgIFt1cGRhdGVTcHldID0gW11cblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBvcmlnaW5hbFBhdGhzID0gcHJvamVjdC5nZXRQYXRocygpXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuaWdub3JlZE5hbWVzJywgWycqKi8qLnN0eWwnXVxuXG4gICAgICAgIHdhaXRzRm9yIC0+IHByb2plY3QuZ2V0UGF0aHMoKS5qb2luKCcsJykgaXNudCBvcmlnaW5hbFBhdGhzLmpvaW4oJywnKVxuXG4gICAgICBpdCAndXBkYXRlcyB0aGUgZm91bmQgdXNpbmcgdGhlIG5ldyBwYXR0ZXJuJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICdzbyB0aGF0IG5ldyBwYXRocyBhcmUgZm91bmQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgdXBkYXRlU3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUtdmFyaWFibGVzJylcblxuICAgICAgICAgIG9yaWdpbmFsUGF0aHMgPSBwcm9qZWN0LmdldFBhdGhzKClcbiAgICAgICAgICBwcm9qZWN0Lm9uRGlkVXBkYXRlVmFyaWFibGVzKHVwZGF0ZVNweSlcblxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuaWdub3JlZE5hbWVzJywgW11cblxuICAgICAgICAgIHdhaXRzRm9yIC0+IHByb2plY3QuZ2V0UGF0aHMoKS5qb2luKCcsJykgaXNudCBvcmlnaW5hbFBhdGhzLmpvaW4oJywnKVxuICAgICAgICAgIHdhaXRzRm9yIC0+IHVwZGF0ZVNweS5jYWxsQ291bnQgPiAwXG5cbiAgICAgICAgaXQgJ2xvYWRzIHRoZSB2YXJpYWJsZXMgZnJvbSB0aGVzZSBuZXcgcGF0aHMnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbChUT1RBTF9WQVJJQUJMRVNfSU5fUFJPSkVDVClcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBleHRlbmRlZFNlYXJjaE5hbWVzIHNldHRpbmcgaXMgY2hhbmdlZCcsIC0+XG4gICAgICBbdXBkYXRlU3B5XSA9IFtdXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdC5zZXRTZWFyY2hOYW1lcyhbJyouZm9vJ10pXG5cbiAgICAgIGl0ICd1cGRhdGVzIHRoZSBzZWFyY2ggbmFtZXMnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRTZWFyY2hOYW1lcygpLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICBpdCAnc2VyaWFsaXplcyB0aGUgc2V0dGluZycsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LnNlcmlhbGl6ZSgpLnNlYXJjaE5hbWVzKS50b0VxdWFsKFsnKi5mb28nXSlcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBpZ25vcmUgZ2xvYmFsIGNvbmZpZyBzZXR0aW5ncyBhcmUgZW5hYmxlZCcsIC0+XG4gICAgICBkZXNjcmliZSAnZm9yIHRoZSBzb3VyY2VOYW1lcyBmaWVsZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBwcm9qZWN0LnNvdXJjZU5hbWVzID0gWycqLmZvbyddXG4gICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3Quc2V0SWdub3JlR2xvYmFsU291cmNlTmFtZXModHJ1ZSlcblxuICAgICAgICBpdCAnaWdub3JlcyB0aGUgY29udGVudCBvZiB0aGUgZ2xvYmFsIGNvbmZpZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0U291cmNlTmFtZXMoKSkudG9FcXVhbChbJy5waWdtZW50cycsJyouZm9vJ10pXG5cbiAgICAgICAgaXQgJ3NlcmlhbGl6ZXMgdGhlIHByb2plY3Qgc2V0dGluZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3Quc2VyaWFsaXplKCkuaWdub3JlR2xvYmFsU291cmNlTmFtZXMpLnRvQmVUcnV0aHkoKVxuXG4gICAgICBkZXNjcmliZSAnZm9yIHRoZSBpZ25vcmVkTmFtZXMgZmllbGQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5pZ25vcmVkTmFtZXMnLCBbJyouZm9vJ11cbiAgICAgICAgICBwcm9qZWN0Lmlnbm9yZWROYW1lcyA9IFsnKi5iYXInXVxuXG4gICAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVHbG9iYWxJZ25vcmVkTmFtZXModHJ1ZSlcblxuICAgICAgICBpdCAnaWdub3JlcyB0aGUgY29udGVudCBvZiB0aGUgZ2xvYmFsIGNvbmZpZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0SWdub3JlZE5hbWVzKCkpLnRvRXF1YWwoWycqLmJhciddKVxuXG4gICAgICAgIGl0ICdzZXJpYWxpemVzIHRoZSBwcm9qZWN0IHNldHRpbmcnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LnNlcmlhbGl6ZSgpLmlnbm9yZUdsb2JhbElnbm9yZWROYW1lcykudG9CZVRydXRoeSgpXG5cbiAgICAgIGRlc2NyaWJlICdmb3IgdGhlIGlnbm9yZWRTY29wZXMgZmllbGQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5pZ25vcmVkU2NvcGVzJywgWydcXFxcLmNvbW1lbnQnXVxuICAgICAgICAgIHByb2plY3QuaWdub3JlZFNjb3BlcyA9IFsnXFxcXC5zb3VyY2UnXVxuXG4gICAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVHbG9iYWxJZ25vcmVkU2NvcGVzKHRydWUpXG5cbiAgICAgICAgaXQgJ2lnbm9yZXMgdGhlIGNvbnRlbnQgb2YgdGhlIGdsb2JhbCBjb25maWcnLCAtPlxuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldElnbm9yZWRTY29wZXMoKSkudG9FcXVhbChbJ1xcXFwuc291cmNlJ10pXG5cbiAgICAgICAgaXQgJ3NlcmlhbGl6ZXMgdGhlIHByb2plY3Qgc2V0dGluZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3Quc2VyaWFsaXplKCkuaWdub3JlR2xvYmFsSWdub3JlZFNjb3BlcykudG9CZVRydXRoeSgpXG5cbiAgICAgIGRlc2NyaWJlICdmb3IgdGhlIHNlYXJjaE5hbWVzIGZpZWxkJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuZXh0ZW5kZWRTZWFyY2hOYW1lcycsIFsnKi5jc3MnXVxuICAgICAgICAgIHByb2plY3Quc2VhcmNoTmFtZXMgPSBbJyouZm9vJ11cblxuICAgICAgICAgIHByb2plY3Quc2V0SWdub3JlR2xvYmFsU2VhcmNoTmFtZXModHJ1ZSlcblxuICAgICAgICBpdCAnaWdub3JlcyB0aGUgY29udGVudCBvZiB0aGUgZ2xvYmFsIGNvbmZpZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0U2VhcmNoTmFtZXMoKSkudG9FcXVhbChbJyoubGVzcycsJyouZm9vJ10pXG5cbiAgICAgICAgaXQgJ3NlcmlhbGl6ZXMgdGhlIHByb2plY3Qgc2V0dGluZycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3Quc2VyaWFsaXplKCkuaWdub3JlR2xvYmFsU2VhcmNoTmFtZXMpLnRvQmVUcnV0aHkoKVxuXG5cbiAgICBkZXNjcmliZSAnOjpsb2FkVGhlbWVzVmFyaWFibGVzJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2F0b20tbGlnaHQtdWknKVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnYXRvbS1saWdodC1zeW50YXgnKVxuXG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnY29yZS50aGVtZXMnLCBbJ2F0b20tbGlnaHQtdWknLCAnYXRvbS1saWdodC1zeW50YXgnXSlcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLnRoZW1lcy5hY3RpdmF0ZVRoZW1lcygpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ3BpZ21lbnRzJylcblxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGF0b20udGhlbWVzLmRlYWN0aXZhdGVUaGVtZXMoKVxuICAgICAgICBhdG9tLnRoZW1lcy51bndhdGNoVXNlclN0eWxlc2hlZXQoKVxuXG4gICAgICBpdCAncmV0dXJucyBhbiBhcnJheSBvZiA2MiB2YXJpYWJsZXMnLCAtPlxuICAgICAgICB0aGVtZVZhcmlhYmxlcyA9IHByb2plY3QubG9hZFRoZW1lc1ZhcmlhYmxlcygpXG4gICAgICAgIGV4cGVjdCh0aGVtZVZhcmlhYmxlcy5sZW5ndGgpLnRvRXF1YWwoNjIpXG5cbiAgICBkZXNjcmliZSAnd2hlbiB0aGUgaW5jbHVkZVRoZW1lcyBzZXR0aW5nIGlzIGVuYWJsZWQnLCAtPlxuICAgICAgW3BhdGhzLCBzcHldID0gW11cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcGF0aHMgPSBwcm9qZWN0LmdldFBhdGhzKClcbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTApXG5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2F0b20tbGlnaHQtdWknKVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnYXRvbS1saWdodC1zeW50YXgnKVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnYXRvbS1kYXJrLXVpJylcbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2F0b20tZGFyay1zeW50YXgnKVxuXG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnY29yZS50aGVtZXMnLCBbJ2F0b20tbGlnaHQtdWknLCAnYXRvbS1saWdodC1zeW50YXgnXSlcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLnRoZW1lcy5hY3RpdmF0ZVRoZW1lcygpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ3BpZ21lbnRzJylcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBwcm9qZWN0LmluaXRpYWxpemUoKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLWNoYW5nZS1hY3RpdmUtdGhlbWVzJylcbiAgICAgICAgICBhdG9tLnRoZW1lcy5vbkRpZENoYW5nZUFjdGl2ZVRoZW1lcyhzcHkpXG4gICAgICAgICAgcHJvamVjdC5zZXRJbmNsdWRlVGhlbWVzKHRydWUpXG5cbiAgICAgIGFmdGVyRWFjaCAtPlxuICAgICAgICBhdG9tLnRoZW1lcy5kZWFjdGl2YXRlVGhlbWVzKClcbiAgICAgICAgYXRvbS50aGVtZXMudW53YXRjaFVzZXJTdHlsZXNoZWV0KClcblxuICAgICAgaXQgJ2luY2x1ZGVzIHRoZSB2YXJpYWJsZXMgc2V0IGZvciB1aSBhbmQgc3ludGF4IHRoZW1lcyBpbiB0aGUgcGFsZXR0ZScsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDcyKVxuXG4gICAgICBpdCAnc3RpbGwgaW5jbHVkZXMgdGhlIHBhdGhzIGZyb20gdGhlIHByb2plY3QnLCAtPlxuICAgICAgICBmb3IgcCBpbiBwYXRoc1xuICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFBhdGhzKCkuaW5kZXhPZiBwKS5ub3QudG9FcXVhbCgtMSlcblxuICAgICAgaXQgJ3NlcmlhbGl6ZXMgdGhlIHNldHRpbmcgd2l0aCB0aGUgcHJvamVjdCcsIC0+XG4gICAgICAgIHNlcmlhbGl6ZWQgPSBwcm9qZWN0LnNlcmlhbGl6ZSgpXG5cbiAgICAgICAgZXhwZWN0KHNlcmlhbGl6ZWQuaW5jbHVkZVRoZW1lcykudG9FcXVhbCh0cnVlKVxuXG4gICAgICBkZXNjcmliZSAnYW5kIHRoZW4gZGlzYWJsZWQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgcHJvamVjdC5zZXRJbmNsdWRlVGhlbWVzKGZhbHNlKVxuXG4gICAgICAgIGl0ICdyZW1vdmVzIGFsbCB0aGUgcGF0aHMgdG8gdGhlIHRoZW1lcyBzdHlsZXNoZWV0cycsIC0+XG4gICAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTApXG5cbiAgICAgICAgZGVzY3JpYmUgJ3doZW4gdGhlIGNvcmUudGhlbWVzIHNldHRpbmcgaXMgbW9kaWZpZWQnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHNweU9uKHByb2plY3QsICdsb2FkVGhlbWVzVmFyaWFibGVzJykuYW5kQ2FsbFRocm91Z2goKVxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdjb3JlLnRoZW1lcycsIFsnYXRvbS1kYXJrLXVpJywgJ2F0b20tZGFyay1zeW50YXgnXSlcblxuICAgICAgICAgICAgd2FpdHNGb3IgLT4gc3B5LmNhbGxDb3VudCA+IDBcblxuICAgICAgICAgIGl0ICdkb2VzIG5vdCB0cmlnZ2VyIGEgcGF0aHMgdXBkYXRlJywgLT5cbiAgICAgICAgICAgIGV4cGVjdChwcm9qZWN0LmxvYWRUaGVtZXNWYXJpYWJsZXMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gdGhlIGNvcmUudGhlbWVzIHNldHRpbmcgaXMgbW9kaWZpZWQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc3B5T24ocHJvamVjdCwgJ2xvYWRUaGVtZXNWYXJpYWJsZXMnKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdjb3JlLnRoZW1lcycsIFsnYXRvbS1kYXJrLXVpJywgJ2F0b20tZGFyay1zeW50YXgnXSlcblxuICAgICAgICAgIHdhaXRzRm9yIC0+IHNweS5jYWxsQ291bnQgPiAwXG5cbiAgICAgICAgaXQgJ3RyaWdnZXJzIGEgcGF0aHMgdXBkYXRlJywgLT5cbiAgICAgICAgICBleHBlY3QocHJvamVjdC5sb2FkVGhlbWVzVmFyaWFibGVzKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAjIyAgICAjIyMjIyMjIyAgIyMjIyMjIyMgICMjIyMjIyAgIyMjIyMjIyMgICMjIyMjIyMgICMjIyMjIyMjICAjIyMjIyMjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgIyMgICAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgICAgICAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAjI1xuICAjIyAgICAjIyMjIyMjIyAgIyMjIyMjICAgICMjIyMjIyAgICAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyNcbiAgIyMgICAgIyMgICAjIyAgICMjICAgICAgICAgICAgICMjICAgICMjICAgICMjICAgICAjIyAjIyAgICMjICAgIyNcbiAgIyMgICAgIyMgICAgIyMgICMjICAgICAgICMjICAgICMjICAgICMjICAgICMjICAgICAjIyAjIyAgICAjIyAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyMgICAgICMjICAgICAjIyMjIyMjICAjIyAgICAgIyMgIyMjIyMjIyNcblxuICBkZXNjcmliZSAnd2hlbiByZXN0b3JlZCcsIC0+XG4gICAgY3JlYXRlUHJvamVjdCA9IChwYXJhbXM9e30pIC0+XG4gICAgICB7c3RhdGVGaXh0dXJlfSA9IHBhcmFtc1xuICAgICAgZGVsZXRlIHBhcmFtcy5zdGF0ZUZpeHR1cmVcblxuICAgICAgcGFyYW1zLnJvb3QgPz0gcm9vdFBhdGhcbiAgICAgIHBhcmFtcy50aW1lc3RhbXAgPz0gIG5ldyBEYXRlKCkudG9KU09OKClcbiAgICAgIHBhcmFtcy52YXJpYWJsZU1hcmtlcnMgPz0gWzEuLjEyXVxuICAgICAgcGFyYW1zLmNvbG9yTWFya2VycyA/PSBbMTMuLjI0XVxuICAgICAgcGFyYW1zLnZlcnNpb24gPz0gU0VSSUFMSVpFX1ZFUlNJT05cbiAgICAgIHBhcmFtcy5tYXJrZXJzVmVyc2lvbiA/PSBTRVJJQUxJWkVfTUFSS0VSU19WRVJTSU9OXG5cbiAgICAgIENvbG9yUHJvamVjdC5kZXNlcmlhbGl6ZShqc29uRml4dHVyZShzdGF0ZUZpeHR1cmUsIHBhcmFtcykpXG5cbiAgICBkZXNjcmliZSAnd2l0aCBhIHRpbWVzdGFtcCBtb3JlIHJlY2VudCB0aGFuIHRoZSBmaWxlcyBsYXN0IG1vZGlmaWNhdGlvbiBkYXRlJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICBzdGF0ZUZpeHR1cmU6IFwiZW1wdHktcHJvamVjdC5qc29uXCJcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgICAgaXQgJ2RvZXMgbm90IHJlc2NhbnMgdGhlIGZpbGVzJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDEpXG5cbiAgICBkZXNjcmliZSAnd2l0aCBhIHZlcnNpb24gZGlmZmVyZW50IHRoYXQgdGhlIGN1cnJlbnQgb25lJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICBzdGF0ZUZpeHR1cmU6IFwiZW1wdHktcHJvamVjdC5qc29uXCJcbiAgICAgICAgICB2ZXJzaW9uOiBcIjAuMC4wXCJcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgICAgaXQgJ2Ryb3BzIHRoZSB3aG9sZSBzZXJpYWxpemVkIHN0YXRlIGFuZCByZXNjYW5zIGFsbCB0aGUgcHJvamVjdCcsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgxMilcblxuICAgIGRlc2NyaWJlICd3aXRoIGEgc2VyaWFsaXplZCBwYXRoIHRoYXQgbm8gbG9uZ2VyIGV4aXN0JywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICBzdGF0ZUZpeHR1cmU6IFwicmVuYW1lLWZpbGUtcHJvamVjdC5qc29uXCJcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgICAgaXQgJ2Ryb3BzIGRyb3BzIHRoZSBub24tZXhpc3RpbmcgYW5kIHJlbG9hZCB0aGUgcGF0aHMnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRQYXRocygpKS50b0VxdWFsKFtcbiAgICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy9idXR0b25zLnN0eWxcIlxuICAgICAgICAgIFwiI3tyb290UGF0aH0vc3R5bGVzL3ZhcmlhYmxlcy5zdHlsXCJcbiAgICAgICAgXSlcblxuICAgICAgaXQgJ2Ryb3BzIHRoZSB2YXJpYWJsZXMgZnJvbSB0aGUgcmVtb3ZlZCBwYXRocycsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlc0ZvclBhdGgoXCIje3Jvb3RQYXRofS9zdHlsZXMvZm9vLnN0eWxcIikubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGl0ICdsb2FkcyB0aGUgdmFyaWFibGVzIGZyb20gdGhlIG5ldyBmaWxlJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzRm9yUGF0aChcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiKS5sZW5ndGgpLnRvRXF1YWwoMTIpXG5cblxuICAgIGRlc2NyaWJlICd3aXRoIGEgc291cmNlTmFtZXMgc2V0dGluZyB2YWx1ZSBkaWZmZXJlbnQgdGhhbiB3aGVuIHNlcmlhbGl6ZWQnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgW10pXG5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICBzdGF0ZUZpeHR1cmU6IFwiZW1wdHktcHJvamVjdC5qc29uXCJcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgICAgaXQgJ2Ryb3BzIHRoZSB3aG9sZSBzZXJpYWxpemVkIHN0YXRlIGFuZCByZXNjYW5zIGFsbCB0aGUgcHJvamVjdCcsIC0+XG4gICAgICAgIGV4cGVjdChwcm9qZWN0LmdldFZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ3dpdGggYSBtYXJrZXJzIHZlcnNpb24gZGlmZmVyZW50IHRoYXQgdGhlIGN1cnJlbnQgb25lJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICBzdGF0ZUZpeHR1cmU6IFwiZW1wdHktcHJvamVjdC5qc29uXCJcbiAgICAgICAgICBtYXJrZXJzVmVyc2lvbjogXCIwLjAuMFwiXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICAgIGl0ICdrZWVwcyB0aGUgcHJvamVjdCByZWxhdGVkIGRhdGEnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5pZ25vcmVkTmFtZXMpLnRvRXF1YWwoWyd2ZW5kb3IvKiddKVxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRQYXRocygpKS50b0VxdWFsKFtcbiAgICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy9idXR0b25zLnN0eWxcIixcbiAgICAgICAgICBcIiN7cm9vdFBhdGh9L3N0eWxlcy92YXJpYWJsZXMuc3R5bFwiXG4gICAgICAgIF0pXG5cbiAgICAgIGl0ICdkcm9wcyB0aGUgdmFyaWFibGVzIGFuZCBidWZmZXJzIGRhdGEnLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoVE9UQUxfVkFSSUFCTEVTX0lOX1BST0pFQ1QpXG5cbiAgICBkZXNjcmliZSAnd2l0aCBhIHRpbWVzdGFtcCBvbGRlciB0aGFuIHRoZSBmaWxlcyBsYXN0IG1vZGlmaWNhdGlvbiBkYXRlJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKDApLnRvSlNPTigpXG4gICAgICAgICAgc3RhdGVGaXh0dXJlOiBcImVtcHR5LXByb2plY3QuanNvblwiXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICAgIGl0ICdzY2FucyBhZ2FpbiBhbGwgdGhlIGZpbGVzIHRoYXQgaGF2ZSBhIG1vcmUgcmVjZW50IG1vZGlmaWNhdGlvbiBkYXRlJywgLT5cbiAgICAgICAgZXhwZWN0KHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKFRPVEFMX1ZBUklBQkxFU19JTl9QUk9KRUNUKVxuXG4gICAgZGVzY3JpYmUgJ3dpdGggc29tZSBmaWxlcyBub3Qgc2F2ZWQgaW4gdGhlIHByb2plY3Qgc3RhdGUnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBwcm9qZWN0ID0gY3JlYXRlUHJvamVjdFxuICAgICAgICAgIHN0YXRlRml4dHVyZTogXCJwYXJ0aWFsLXByb2plY3QuanNvblwiXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgICAgIGl0ICdkZXRlY3RzIHRoZSBuZXcgZmlsZXMgYW5kIHNjYW5zIHRoZW0nLCAtPlxuICAgICAgICBleHBlY3QocHJvamVjdC5nZXRWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMTIpXG5cbiAgICBkZXNjcmliZSAnd2l0aCBhbiBvcGVuIGVkaXRvciBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgYnVmZmVyIHN0YXRlJywgLT5cbiAgICAgIFtlZGl0b3IsIGNvbG9yQnVmZmVyXSA9IFtdXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ3ZhcmlhYmxlcy5zdHlsJykudGhlbiAobykgLT4gZWRpdG9yID0gb1xuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBwcm9qZWN0ID0gY3JlYXRlUHJvamVjdFxuICAgICAgICAgICAgc3RhdGVGaXh0dXJlOiBcIm9wZW4tYnVmZmVyLXByb2plY3QuanNvblwiXG4gICAgICAgICAgICBpZDogZWRpdG9yLmlkXG5cbiAgICAgICAgICBzcHlPbihDb2xvckJ1ZmZlci5wcm90b3R5cGUsICd2YXJpYWJsZXNBdmFpbGFibGUnKS5hbmRDYWxsVGhyb3VnaCgpXG5cbiAgICAgICAgcnVucyAtPiBjb2xvckJ1ZmZlciA9IHByb2plY3QuY29sb3JCdWZmZXJzQnlFZGl0b3JJZFtlZGl0b3IuaWRdXG5cbiAgICAgIGl0ICdyZXN0b3JlcyB0aGUgY29sb3IgYnVmZmVyIGluIGl0cyBwcmV2aW91cyBzdGF0ZScsIC0+XG4gICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlcikudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3QoY29sb3JCdWZmZXIuZ2V0Q29sb3JNYXJrZXJzKCkubGVuZ3RoKS50b0VxdWFsKFRPVEFMX0NPTE9SU19WQVJJQUJMRVNfSU5fUFJPSkVDVClcblxuICAgICAgaXQgJ2RvZXMgbm90IHdhaXQgZm9yIHRoZSBwcm9qZWN0IHZhcmlhYmxlcycsIC0+XG4gICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlICd3aXRoIGFuIG9wZW4gZWRpdG9yLCB0aGUgY29ycmVzcG9uZGluZyBidWZmZXIgc3RhdGUgYW5kIGEgb2xkIHRpbWVzdGFtcCcsIC0+XG4gICAgICBbZWRpdG9yLCBjb2xvckJ1ZmZlcl0gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCd2YXJpYWJsZXMuc3R5bCcpLnRoZW4gKG8pIC0+IGVkaXRvciA9IG9cblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgc3B5T24oQ29sb3JCdWZmZXIucHJvdG90eXBlLCAndXBkYXRlVmFyaWFibGVSYW5nZXMnKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICAgICAgcHJvamVjdCA9IGNyZWF0ZVByb2plY3RcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoMCkudG9KU09OKClcbiAgICAgICAgICAgIHN0YXRlRml4dHVyZTogXCJvcGVuLWJ1ZmZlci1wcm9qZWN0Lmpzb25cIlxuICAgICAgICAgICAgaWQ6IGVkaXRvci5pZFxuXG4gICAgICAgIHJ1bnMgLT4gY29sb3JCdWZmZXIgPSBwcm9qZWN0LmNvbG9yQnVmZmVyc0J5RWRpdG9ySWRbZWRpdG9yLmlkXVxuXG4gICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyLnVwZGF0ZVZhcmlhYmxlUmFuZ2VzLmNhbGxDb3VudCA+IDBcblxuICAgICAgaXQgJ2ludmFsaWRhdGVzIHRoZSBjb2xvciBidWZmZXIgbWFya2VycyBhcyBzb29uIGFzIHRoZSBkaXJ0eSBwYXRocyBoYXZlIGJlZW4gZGV0ZXJtaW5lZCcsIC0+XG4gICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlci51cGRhdGVWYXJpYWJsZVJhbmdlcykudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiMjICAgICMjIyMjIyMjICAjIyMjIyMjIyAjIyMjIyMjIyAgICAjIyMgICAgIyMgICAgICMjICMjICAgICAgICMjIyMjIyMjXG4jIyAgICAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgICAgICAjIyAjIyAgICMjICAgICAjIyAjIyAgICAgICAgICAjI1xuIyMgICAgIyMgICAgICMjICMjICAgICAgICMjICAgICAgICAjIyAgICMjICAjIyAgICAgIyMgIyMgICAgICAgICAgIyNcbiMjICAgICMjICAgICAjIyAjIyMjIyMgICAjIyMjIyMgICAjIyAgICAgIyMgIyMgICAgICMjICMjICAgICAgICAgICMjXG4jIyAgICAjIyAgICAgIyMgIyMgICAgICAgIyMgICAgICAgIyMjIyMjIyMjICMjICAgICAjIyAjIyAgICAgICAgICAjI1xuIyMgICAgIyMgICAgICMjICMjICAgICAgICMjICAgICAgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICAgICAgIyNcbiMjICAgICMjIyMjIyMjICAjIyMjIyMjIyAjIyAgICAgICAjIyAgICAgIyMgICMjIyMjIyMgICMjIyMjIyMjICAgICMjXG5cbmRlc2NyaWJlICdDb2xvclByb2plY3QnLCAtPlxuICBbcHJvamVjdCwgcm9vdFBhdGhdID0gW11cbiAgZGVzY3JpYmUgJ3doZW4gdGhlIHByb2plY3QgaGFzIGEgcGlnbWVudHMgZGVmYXVsdHMgZmlsZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5zb3VyY2VOYW1lcycsIFsnKi5zYXNzJ11cblxuICAgICAgW2ZpeHR1cmVzUGF0aF0gPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICAgICAgcm9vdFBhdGggPSBcIiN7Zml4dHVyZXNQYXRofS9wcm9qZWN0LXdpdGgtZGVmYXVsdHNcIlxuICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtyb290UGF0aF0pXG5cbiAgICAgIHByb2plY3QgPSBuZXcgQ29sb3JQcm9qZWN0KHt9KVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgIGl0ICdsb2FkcyB0aGUgZGVmYXVsdHMgZmlsZSBjb250ZW50JywgLT5cbiAgICAgIGV4cGVjdChwcm9qZWN0LmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDEyKVxuIl19
