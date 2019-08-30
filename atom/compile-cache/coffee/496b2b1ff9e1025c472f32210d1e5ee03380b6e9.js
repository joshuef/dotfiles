(function() {
  var ColorBufferElement, mousedown, path, sleep;

  path = require('path');

  require('./helpers/spec-helper');

  mousedown = require('./helpers/events').mousedown;

  ColorBufferElement = require('../lib/color-buffer-element');

  sleep = function(duration) {
    var t;
    t = new Date();
    return waitsFor(function() {
      return new Date() - t > duration;
    });
  };

  describe('ColorBufferElement', function() {
    var colorBuffer, colorBufferElement, editBuffer, editor, editorElement, isVisible, jasmineContent, jsonFixture, pigments, project, ref;
    ref = [], editor = ref[0], editorElement = ref[1], colorBuffer = ref[2], pigments = ref[3], project = ref[4], colorBufferElement = ref[5], jasmineContent = ref[6];
    isVisible = function(node) {
      return !node.classList.contains('hidden');
    };
    editBuffer = function(text, options) {
      var range;
      if (options == null) {
        options = {};
      }
      if (options.start != null) {
        if (options.end != null) {
          range = [options.start, options.end];
        } else {
          range = [options.start, options.start];
        }
        editor.setSelectedBufferRange(range);
      }
      editor.insertText(text);
      if (!options.noEvent) {
        return advanceClock(500);
      }
    };
    jsonFixture = function(fixture, data) {
      var json, jsonPath;
      jsonPath = path.resolve(__dirname, 'fixtures', fixture);
      json = fs.readFileSync(jsonPath).toString();
      json = json.replace(/#\{(\w+)\}/g, function(m, w) {
        return data[w];
      });
      return JSON.parse(json);
    };
    beforeEach(function() {
      var workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      jasmineContent = document.body.querySelector('#jasmine-content');
      jasmineContent.appendChild(workspaceElement);
      atom.config.set('editor.softWrap', true);
      atom.config.set('editor.softWrapAtPreferredLineLength', true);
      atom.config.set('editor.preferredLineLength', 40);
      atom.config.set('pigments.delayBeforeScan', 0);
      atom.config.set('pigments.sourceNames', ['*.styl', '*.less']);
      waitsForPromise(function() {
        return atom.workspace.open('four-variables.styl').then(function(o) {
          editor = o;
          return editorElement = atom.views.getView(editor);
        });
      });
      return waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
    });
    afterEach(function() {
      return colorBuffer != null ? colorBuffer.destroy() : void 0;
    });
    return describe('when an editor is opened', function() {
      beforeEach(function() {
        colorBuffer = project.colorBufferForEditor(editor);
        colorBufferElement = atom.views.getView(colorBuffer);
        return colorBufferElement.attach();
      });
      it('is associated to the ColorBuffer model', function() {
        expect(colorBufferElement).toBeDefined();
        return expect(colorBufferElement.getModel()).toBe(colorBuffer);
      });
      it('attaches itself in the target text editor element', function() {
        expect(colorBufferElement.parentNode).toExist();
        return expect(editorElement.querySelector('.lines pigments-markers')).toExist();
      });
      describe('when the color buffer is initialized', function() {
        beforeEach(function() {
          return waitsForPromise(function() {
            return colorBuffer.initialize();
          });
        });
        it('creates markers views for every visible buffer marker', function() {
          var i, len, marker, markersElements, results;
          markersElements = colorBufferElement.querySelectorAll('pigments-color-marker');
          expect(markersElements.length).toEqual(3);
          results = [];
          for (i = 0, len = markersElements.length; i < len; i++) {
            marker = markersElements[i];
            results.push(expect(marker.getModel()).toBeDefined());
          }
          return results;
        });
        describe('when the project variables are initialized', function() {
          return it('creates markers for the new valid colors', function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(4);
            });
          });
        });
        describe('when a selection intersects a marker range', function() {
          beforeEach(function() {
            return spyOn(colorBufferElement, 'updateSelections').andCallThrough();
          });
          describe('after the markers views was created', function() {
            beforeEach(function() {
              waitsForPromise(function() {
                return colorBuffer.variablesAvailable();
              });
              runs(function() {
                return editor.setSelectedBufferRange([[2, 12], [2, 14]]);
              });
              return waitsFor(function() {
                return colorBufferElement.updateSelections.callCount > 0;
              });
            });
            return it('hides the intersected marker', function() {
              var markers;
              markers = colorBufferElement.querySelectorAll('pigments-color-marker');
              expect(isVisible(markers[0])).toBeTruthy();
              expect(isVisible(markers[1])).toBeTruthy();
              expect(isVisible(markers[2])).toBeTruthy();
              return expect(isVisible(markers[3])).toBeFalsy();
            });
          });
          return describe('before all the markers views was created', function() {
            beforeEach(function() {
              runs(function() {
                return editor.setSelectedBufferRange([[0, 0], [2, 14]]);
              });
              return waitsFor(function() {
                return colorBufferElement.updateSelections.callCount > 0;
              });
            });
            it('hides the existing markers', function() {
              var markers;
              markers = colorBufferElement.querySelectorAll('pigments-color-marker');
              expect(isVisible(markers[0])).toBeFalsy();
              expect(isVisible(markers[1])).toBeTruthy();
              return expect(isVisible(markers[2])).toBeTruthy();
            });
            return describe('and the markers are updated', function() {
              beforeEach(function() {
                waitsForPromise('colors available', function() {
                  return colorBuffer.variablesAvailable();
                });
                return waitsFor('last marker visible', function() {
                  var markers;
                  markers = colorBufferElement.querySelectorAll('pigments-color-marker');
                  return isVisible(markers[3]);
                });
              });
              return it('hides the created markers', function() {
                var markers;
                markers = colorBufferElement.querySelectorAll('pigments-color-marker');
                expect(isVisible(markers[0])).toBeFalsy();
                expect(isVisible(markers[1])).toBeTruthy();
                expect(isVisible(markers[2])).toBeTruthy();
                return expect(isVisible(markers[3])).toBeTruthy();
              });
            });
          });
        });
        describe('when a line is edited and gets wrapped', function() {
          var marker;
          marker = null;
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            runs(function() {
              marker = colorBufferElement.usedMarkers[colorBufferElement.usedMarkers.length - 1];
              spyOn(marker, 'render').andCallThrough();
              return editBuffer(new Array(20).join("foo "), {
                start: [1, 0],
                end: [1, 0]
              });
            });
            return waitsFor(function() {
              return marker.render.callCount > 0;
            });
          });
          return it('updates the markers whose screen range have changed', function() {
            return expect(marker.render).toHaveBeenCalled();
          });
        });
        describe('when some markers are destroyed', function() {
          var spy;
          spy = [][0];
          beforeEach(function() {
            var el, i, len, ref1;
            ref1 = colorBufferElement.usedMarkers;
            for (i = 0, len = ref1.length; i < len; i++) {
              el = ref1[i];
              spyOn(el, 'release').andCallThrough();
            }
            spy = jasmine.createSpy('did-update');
            colorBufferElement.onDidUpdate(spy);
            editBuffer('', {
              start: [4, 0],
              end: [8, 0]
            });
            return waitsFor(function() {
              return spy.callCount > 0;
            });
          });
          it('releases the unused markers', function() {
            var i, len, marker, ref1, results;
            expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(3);
            expect(colorBufferElement.usedMarkers.length).toEqual(2);
            expect(colorBufferElement.unusedMarkers.length).toEqual(1);
            ref1 = colorBufferElement.unusedMarkers;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              marker = ref1[i];
              results.push(expect(marker.release).toHaveBeenCalled());
            }
            return results;
          });
          return describe('and then a new marker is created', function() {
            beforeEach(function() {
              editor.moveToBottom();
              editBuffer('\nfoo = #123456\n');
              return waitsFor(function() {
                return colorBufferElement.unusedMarkers.length === 0;
              });
            });
            return it('reuses the previously released marker element', function() {
              expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(3);
              expect(colorBufferElement.usedMarkers.length).toEqual(3);
              return expect(colorBufferElement.unusedMarkers.length).toEqual(0);
            });
          });
        });
        describe('when the current pane is splitted to the right', function() {
          beforeEach(function() {
            var version;
            version = parseFloat(atom.getVersion().split('.').slice(1, 2).join('.'));
            if (version > 5) {
              atom.commands.dispatch(editorElement, 'pane:split-right-and-copy-active-item');
            } else {
              atom.commands.dispatch(editorElement, 'pane:split-right');
            }
            waitsFor('text editor', function() {
              return editor = atom.workspace.getTextEditors()[1];
            });
            waitsFor('color buffer element', function() {
              return colorBufferElement = atom.views.getView(project.colorBufferForEditor(editor));
            });
            return waitsFor('color buffer element markers', function() {
              return colorBufferElement.querySelectorAll('pigments-color-marker').length;
            });
          });
          return it('should keep all the buffer elements attached', function() {
            var editors;
            editors = atom.workspace.getTextEditors();
            return editors.forEach(function(editor) {
              editorElement = atom.views.getView(editor);
              colorBufferElement = editorElement.querySelector('pigments-markers');
              expect(colorBufferElement).toExist();
              expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(3);
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:empty').length).toEqual(0);
            });
          });
        });
        return describe('when the marker type is set to gutter', function() {
          var gutter;
          gutter = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.initialize();
            });
            return runs(function() {
              atom.config.set('pigments.markerType', 'gutter');
              return gutter = editorElement.querySelector('[gutter-name="pigments-gutter"]');
            });
          });
          it('removes the markers', function() {
            return expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(0);
          });
          it('adds a custom gutter to the text editor', function() {
            return expect(gutter).toExist();
          });
          it('sets the size of the gutter based on the number of markers in the same row', function() {
            return expect(gutter.style.minWidth).toEqual('14px');
          });
          it('adds a gutter decoration for each color marker', function() {
            var decorations;
            decorations = editor.getDecorations().filter(function(d) {
              return d.properties.type === 'gutter';
            });
            return expect(decorations.length).toEqual(3);
          });
          describe('when the variables become available', function() {
            beforeEach(function() {
              return waitsForPromise(function() {
                return colorBuffer.variablesAvailable();
              });
            });
            it('creates decorations for the new valid colors', function() {
              var decorations;
              decorations = editor.getDecorations().filter(function(d) {
                return d.properties.type === 'gutter';
              });
              return expect(decorations.length).toEqual(4);
            });
            return describe('when many markers are added on the same line', function() {
              beforeEach(function() {
                var updateSpy;
                updateSpy = jasmine.createSpy('did-update');
                colorBufferElement.onDidUpdate(updateSpy);
                editor.moveToBottom();
                editBuffer('\nlist = #123456, #987654, #abcdef\n');
                return waitsFor(function() {
                  return updateSpy.callCount > 0;
                });
              });
              it('adds the new decorations to the gutter', function() {
                var decorations;
                decorations = editor.getDecorations().filter(function(d) {
                  return d.properties.type === 'gutter';
                });
                return expect(decorations.length).toEqual(7);
              });
              it('sets the size of the gutter based on the number of markers in the same row', function() {
                return expect(gutter.style.minWidth).toEqual('42px');
              });
              return describe('clicking on a gutter decoration', function() {
                beforeEach(function() {
                  var decoration;
                  project.colorPickerAPI = {
                    open: jasmine.createSpy('color-picker.open')
                  };
                  decoration = editorElement.querySelector('.pigments-gutter-marker span');
                  return mousedown(decoration);
                });
                it('selects the text in the editor', function() {
                  return expect(editor.getSelectedScreenRange()).toEqual([[0, 13], [0, 17]]);
                });
                return it('opens the color picker', function() {
                  return expect(project.colorPickerAPI.open).toHaveBeenCalled();
                });
              });
            });
          });
          describe('when the marker is changed again', function() {
            beforeEach(function() {
              return atom.config.set('pigments.markerType', 'background');
            });
            it('removes the gutter', function() {
              return expect(editorElement.querySelector('[gutter-name="pigments-gutter"]')).not.toExist();
            });
            return it('recreates the markers', function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(3);
            });
          });
          return describe('when a new buffer is opened', function() {
            beforeEach(function() {
              waitsForPromise(function() {
                return atom.workspace.open('project/styles/variables.styl').then(function(e) {
                  editor = e;
                  editorElement = atom.views.getView(editor);
                  colorBuffer = project.colorBufferForEditor(editor);
                  return colorBufferElement = atom.views.getView(colorBuffer);
                });
              });
              waitsForPromise(function() {
                return colorBuffer.initialize();
              });
              waitsForPromise(function() {
                return colorBuffer.variablesAvailable();
              });
              return runs(function() {
                return gutter = editorElement.querySelector('[gutter-name="pigments-gutter"]');
              });
            });
            return it('creates the decorations in the new buffer gutter', function() {
              var decorations;
              decorations = editor.getDecorations().filter(function(d) {
                return d.properties.type === 'gutter';
              });
              return expect(decorations.length).toEqual(10);
            });
          });
        });
      });
      describe('when the editor is moved to another pane', function() {
        var newPane, pane, ref1;
        ref1 = [], pane = ref1[0], newPane = ref1[1];
        beforeEach(function() {
          pane = atom.workspace.getActivePane();
          newPane = pane.splitDown({
            copyActiveItem: false
          });
          colorBuffer = project.colorBufferForEditor(editor);
          colorBufferElement = atom.views.getView(colorBuffer);
          expect(atom.workspace.getPanes().length).toEqual(2);
          pane.moveItemToPane(editor, newPane, 0);
          return waitsFor(function() {
            return colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length;
          });
        });
        return it('moves the editor with the buffer to the new pane', function() {
          expect(colorBufferElement.querySelectorAll('pigments-color-marker').length).toEqual(3);
          return expect(colorBufferElement.querySelectorAll('pigments-color-marker:empty').length).toEqual(0);
        });
      });
      describe('when pigments.supportedFiletypes settings is defined', function() {
        var loadBuffer;
        loadBuffer = function(filePath) {
          waitsForPromise(function() {
            return atom.workspace.open(filePath).then(function(o) {
              editor = o;
              editorElement = atom.views.getView(editor);
              colorBuffer = project.colorBufferForEditor(editor);
              colorBufferElement = atom.views.getView(colorBuffer);
              return colorBufferElement.attach();
            });
          });
          waitsForPromise(function() {
            return colorBuffer.initialize();
          });
          return waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
        };
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-coffee-script');
          });
          return waitsForPromise(function() {
            return atom.packages.activatePackage('language-less');
          });
        });
        describe('with the default wildcard', function() {
          beforeEach(function() {
            return atom.config.set('pigments.supportedFiletypes', ['*']);
          });
          return it('supports every filetype', function() {
            loadBuffer('scope-filter.coffee');
            runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(2);
            });
            loadBuffer('project/vendor/css/variables.less');
            return runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(20);
            });
          });
        });
        describe('with a filetype', function() {
          beforeEach(function() {
            return atom.config.set('pigments.supportedFiletypes', ['coffee']);
          });
          return it('supports the specified file type', function() {
            loadBuffer('scope-filter.coffee');
            runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(2);
            });
            loadBuffer('project/vendor/css/variables.less');
            return runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
            });
          });
        });
        return describe('with many filetypes', function() {
          beforeEach(function() {
            atom.config.set('pigments.supportedFiletypes', ['coffee']);
            return project.setSupportedFiletypes(['less']);
          });
          it('supports the specified file types', function() {
            loadBuffer('scope-filter.coffee');
            runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(2);
            });
            loadBuffer('project/vendor/css/variables.less');
            runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(20);
            });
            loadBuffer('four-variables.styl');
            return runs(function() {
              return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
            });
          });
          return describe('with global file types ignored', function() {
            beforeEach(function() {
              atom.config.set('pigments.supportedFiletypes', ['coffee']);
              project.setIgnoreGlobalSupportedFiletypes(true);
              return project.setSupportedFiletypes(['less']);
            });
            return it('supports the specified file types', function() {
              loadBuffer('scope-filter.coffee');
              runs(function() {
                return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
              });
              loadBuffer('project/vendor/css/variables.less');
              runs(function() {
                return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(20);
              });
              loadBuffer('four-variables.styl');
              return runs(function() {
                return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
              });
            });
          });
        });
      });
      return describe('when pigments.ignoredScopes settings is defined', function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-coffee-script');
          });
          waitsForPromise(function() {
            return atom.workspace.open('scope-filter.coffee').then(function(o) {
              editor = o;
              editorElement = atom.views.getView(editor);
              colorBuffer = project.colorBufferForEditor(editor);
              colorBufferElement = atom.views.getView(colorBuffer);
              return colorBufferElement.attach();
            });
          });
          return waitsForPromise(function() {
            return colorBuffer.initialize();
          });
        });
        describe('with one filter', function() {
          beforeEach(function() {
            return atom.config.set('pigments.ignoredScopes', ['\\.comment']);
          });
          return it('ignores the colors that matches the defined scopes', function() {
            return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(1);
          });
        });
        describe('with two filters', function() {
          beforeEach(function() {
            return atom.config.set('pigments.ignoredScopes', ['\\.string', '\\.comment']);
          });
          return it('ignores the colors that matches the defined scopes', function() {
            return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
          });
        });
        describe('with an invalid filter', function() {
          beforeEach(function() {
            return atom.config.set('pigments.ignoredScopes', ['\\']);
          });
          return it('ignores the filter', function() {
            return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(2);
          });
        });
        return describe('when the project ignoredScopes is defined', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoredScopes', ['\\.string']);
            return project.setIgnoredScopes(['\\.comment']);
          });
          return it('ignores the colors that matches the defined scopes', function() {
            return expect(colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)').length).toEqual(0);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1idWZmZXItZWxlbWVudC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE9BQUEsQ0FBUSx1QkFBUjs7RUFDQyxZQUFhLE9BQUEsQ0FBUSxrQkFBUjs7RUFFZCxrQkFBQSxHQUFxQixPQUFBLENBQVEsNkJBQVI7O0VBRXJCLEtBQUEsR0FBUSxTQUFDLFFBQUQ7QUFDTixRQUFBO0lBQUEsQ0FBQSxHQUFRLElBQUEsSUFBQSxDQUFBO1dBQ1IsUUFBQSxDQUFTLFNBQUE7YUFBTyxJQUFBLElBQUEsQ0FBQSxDQUFKLEdBQWEsQ0FBYixHQUFpQjtJQUFwQixDQUFUO0VBRk07O0VBSVIsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7QUFDN0IsUUFBQTtJQUFBLE1BQThGLEVBQTlGLEVBQUMsZUFBRCxFQUFTLHNCQUFULEVBQXdCLG9CQUF4QixFQUFxQyxpQkFBckMsRUFBK0MsZ0JBQS9DLEVBQXdELDJCQUF4RCxFQUE0RTtJQUU1RSxTQUFBLEdBQVksU0FBQyxJQUFEO2FBQVUsQ0FBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBd0IsUUFBeEI7SUFBZDtJQUVaLFVBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxPQUFQO0FBQ1gsVUFBQTs7UUFEa0IsVUFBUTs7TUFDMUIsSUFBRyxxQkFBSDtRQUNFLElBQUcsbUJBQUg7VUFDRSxLQUFBLEdBQVEsQ0FBQyxPQUFPLENBQUMsS0FBVCxFQUFnQixPQUFPLENBQUMsR0FBeEIsRUFEVjtTQUFBLE1BQUE7VUFHRSxLQUFBLEdBQVEsQ0FBQyxPQUFPLENBQUMsS0FBVCxFQUFnQixPQUFPLENBQUMsS0FBeEIsRUFIVjs7UUFLQSxNQUFNLENBQUMsc0JBQVAsQ0FBOEIsS0FBOUIs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cEMsQ0FBd0UsQ0FBQyxNQUFoRixDQUF1RixDQUFDLE9BQXhGLENBQWdHLENBQWhHO1VBRHVELENBQXpEO1FBSjJCLENBQTdCO1FBT0EsUUFBQSxDQUFTLHdCQUFULEVBQW1DLFNBQUE7VUFDakMsVUFBQSxDQUFXLFNBQUE7bUJBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixFQUEwQyxDQUFDLElBQUQsQ0FBMUM7VUFEUyxDQUFYO2lCQUdBLEVBQUEsQ0FBRyxvQkFBSCxFQUF5QixTQUFBO21CQUN2QixNQUFBLENBQU8sa0JBQWtCLENBQUMsZ0JBQW5CLENBQW9DLG1DQUFwQyxDQUF3RSxDQUFDLE1BQWhGLENBQXVGLENBQUMsT0FBeEYsQ0FBZ0csQ0FBaEc7VUFEdUIsQ0FBekI7UUFKaUMsQ0FBbkM7ZUFPQSxRQUFBLENBQVMsMkNBQVQsRUFBc0QsU0FBQTtVQUNwRCxVQUFBLENBQVcsU0FBQTtZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix3QkFBaEIsRUFBMEMsQ0FBQyxXQUFELENBQTFDO21CQUNBLE9BQU8sQ0FBQyxnQkFBUixDQUF5QixDQUFDLFlBQUQsQ0FBekI7VUFGUyxDQUFYO2lCQUlBLEVBQUEsQ0FBRyxvREFBSCxFQUF5RCxTQUFBO21CQUN2RCxNQUFBLENBQU8sa0JBQWtCLENBQUMsZ0JBQW5CLENBQW9DLG1DQUFwQyxDQUF3RSxDQUFDLE1BQWhGLENBQXVGLENBQUMsT0FBeEYsQ0FBZ0csQ0FBaEc7VUFEdUQsQ0FBekQ7UUFMb0QsQ0FBdEQ7TUFwQzBELENBQTVEO0lBM1ZtQyxDQUFyQztFQXBENkIsQ0FBL0I7QUFWQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xucmVxdWlyZSAnLi9oZWxwZXJzL3NwZWMtaGVscGVyJ1xue21vdXNlZG93bn0gPSByZXF1aXJlICcuL2hlbHBlcnMvZXZlbnRzJ1xuXG5Db2xvckJ1ZmZlckVsZW1lbnQgPSByZXF1aXJlICcuLi9saWIvY29sb3ItYnVmZmVyLWVsZW1lbnQnXG5cbnNsZWVwID0gKGR1cmF0aW9uKSAtPlxuICB0ID0gbmV3IERhdGUoKVxuICB3YWl0c0ZvciAtPiBuZXcgRGF0ZSgpIC0gdCA+IGR1cmF0aW9uXG5cbmRlc2NyaWJlICdDb2xvckJ1ZmZlckVsZW1lbnQnLCAtPlxuICBbZWRpdG9yLCBlZGl0b3JFbGVtZW50LCBjb2xvckJ1ZmZlciwgcGlnbWVudHMsIHByb2plY3QsIGNvbG9yQnVmZmVyRWxlbWVudCwgamFzbWluZUNvbnRlbnRdID0gW11cblxuICBpc1Zpc2libGUgPSAobm9kZSkgLT4gbm90IG5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKVxuXG4gIGVkaXRCdWZmZXIgPSAodGV4dCwgb3B0aW9ucz17fSkgLT5cbiAgICBpZiBvcHRpb25zLnN0YXJ0P1xuICAgICAgaWYgb3B0aW9ucy5lbmQ/XG4gICAgICAgIHJhbmdlID0gW29wdGlvbnMuc3RhcnQsIG9wdGlvbnMuZW5kXVxuICAgICAgZWxzZVxuICAgICAgICByYW5nZSA9IFtvcHRpb25zLnN0YXJ0LCBvcHRpb25zLnN0YXJ0XVxuXG4gICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShyYW5nZSlcblxuICAgIGVkaXRvci5pbnNlcnRUZXh0KHRleHQpXG4gICAgYWR2YW5jZUNsb2NrKDUwMCkgdW5sZXNzIG9wdGlvbnMubm9FdmVudFxuXG4gIGpzb25GaXh0dXJlID0gKGZpeHR1cmUsIGRhdGEpIC0+XG4gICAganNvblBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMnLCBmaXh0dXJlKVxuICAgIGpzb24gPSBmcy5yZWFkRmlsZVN5bmMoanNvblBhdGgpLnRvU3RyaW5nKClcbiAgICBqc29uID0ganNvbi5yZXBsYWNlIC8jXFx7KFxcdyspXFx9L2csIChtLHcpIC0+IGRhdGFbd11cblxuICAgIEpTT04ucGFyc2UoanNvbilcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBqYXNtaW5lQ29udGVudCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI2phc21pbmUtY29udGVudCcpXG5cbiAgICBqYXNtaW5lQ29udGVudC5hcHBlbmRDaGlsZCh3b3Jrc3BhY2VFbGVtZW50KVxuXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3Iuc29mdFdyYXAnLCB0cnVlXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3Iuc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGgnLCB0cnVlXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3IucHJlZmVycmVkTGluZUxlbmd0aCcsIDQwXG5cbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLmRlbGF5QmVmb3JlU2NhbicsIDBcbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgW1xuICAgICAgJyouc3R5bCdcbiAgICAgICcqLmxlc3MnXG4gICAgXVxuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdmb3VyLXZhcmlhYmxlcy5zdHlsJykudGhlbiAobykgLT5cbiAgICAgICAgZWRpdG9yID0gb1xuICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcblxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgncGlnbWVudHMnKS50aGVuIChwa2cpIC0+XG4gICAgICBwaWdtZW50cyA9IHBrZy5tYWluTW9kdWxlXG4gICAgICBwcm9qZWN0ID0gcGlnbWVudHMuZ2V0UHJvamVjdCgpXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgY29sb3JCdWZmZXI/LmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlICd3aGVuIGFuIGVkaXRvciBpcyBvcGVuZWQnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGNvbG9yQnVmZmVyID0gcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG4gICAgICBjb2xvckJ1ZmZlckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoY29sb3JCdWZmZXIpXG4gICAgICBjb2xvckJ1ZmZlckVsZW1lbnQuYXR0YWNoKClcblxuICAgIGl0ICdpcyBhc3NvY2lhdGVkIHRvIHRoZSBDb2xvckJ1ZmZlciBtb2RlbCcsIC0+XG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50KS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LmdldE1vZGVsKCkpLnRvQmUoY29sb3JCdWZmZXIpXG5cbiAgICBpdCAnYXR0YWNoZXMgaXRzZWxmIGluIHRoZSB0YXJnZXQgdGV4dCBlZGl0b3IgZWxlbWVudCcsIC0+XG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnBhcmVudE5vZGUpLnRvRXhpc3QoKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxpbmVzIHBpZ21lbnRzLW1hcmtlcnMnKSkudG9FeGlzdCgpXG5cbiAgICBkZXNjcmliZSAnd2hlbiB0aGUgY29sb3IgYnVmZmVyIGlzIGluaXRpYWxpemVkJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLmluaXRpYWxpemUoKVxuXG4gICAgICBpdCAnY3JlYXRlcyBtYXJrZXJzIHZpZXdzIGZvciBldmVyeSB2aXNpYmxlIGJ1ZmZlciBtYXJrZXInLCAtPlxuICAgICAgICBtYXJrZXJzRWxlbWVudHMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcblxuICAgICAgICBleHBlY3QobWFya2Vyc0VsZW1lbnRzLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgIGZvciBtYXJrZXIgaW4gbWFya2Vyc0VsZW1lbnRzXG4gICAgICAgICAgZXhwZWN0KG1hcmtlci5nZXRNb2RlbCgpKS50b0JlRGVmaW5lZCgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBwcm9qZWN0IHZhcmlhYmxlcyBhcmUgaW5pdGlhbGl6ZWQnLCAtPlxuICAgICAgICBpdCAnY3JlYXRlcyBtYXJrZXJzIGZvciB0aGUgbmV3IHZhbGlkIGNvbG9ycycsIC0+XG4gICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoNClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gYSBzZWxlY3Rpb24gaW50ZXJzZWN0cyBhIG1hcmtlciByYW5nZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzcHlPbihjb2xvckJ1ZmZlckVsZW1lbnQsICd1cGRhdGVTZWxlY3Rpb25zJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICAgIGRlc2NyaWJlICdhZnRlciB0aGUgbWFya2VycyB2aWV3cyB3YXMgY3JlYXRlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG4gICAgICAgICAgICBydW5zIC0+IGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlIFtbMiwxMl0sWzIsIDE0XV1cbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51cGRhdGVTZWxlY3Rpb25zLmNhbGxDb3VudCA+IDBcblxuICAgICAgICAgIGl0ICdoaWRlcyB0aGUgaW50ZXJzZWN0ZWQgbWFya2VyJywgLT5cbiAgICAgICAgICAgIG1hcmtlcnMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcblxuICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzBdKSkudG9CZVRydXRoeSgpXG4gICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMV0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1syXSkpLnRvQmVUcnV0aHkoKVxuICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzNdKSkudG9CZUZhbHN5KClcblxuICAgICAgICBkZXNjcmliZSAnYmVmb3JlIGFsbCB0aGUgbWFya2VycyB2aWV3cyB3YXMgY3JlYXRlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgcnVucyAtPiBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSBbWzAsMF0sWzIsIDE0XV1cbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51cGRhdGVTZWxlY3Rpb25zLmNhbGxDb3VudCA+IDBcblxuICAgICAgICAgIGl0ICdoaWRlcyB0aGUgZXhpc3RpbmcgbWFya2VycycsIC0+XG4gICAgICAgICAgICBtYXJrZXJzID0gY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpXG5cbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1swXSkpLnRvQmVGYWxzeSgpXG4gICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMV0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1syXSkpLnRvQmVUcnV0aHkoKVxuXG4gICAgICAgICAgZGVzY3JpYmUgJ2FuZCB0aGUgbWFya2VycyBhcmUgdXBkYXRlZCcsIC0+XG4gICAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAnY29sb3JzIGF2YWlsYWJsZScsIC0+XG4gICAgICAgICAgICAgICAgY29sb3JCdWZmZXIudmFyaWFibGVzQXZhaWxhYmxlKClcbiAgICAgICAgICAgICAgd2FpdHNGb3IgJ2xhc3QgbWFya2VyIHZpc2libGUnLCAtPlxuICAgICAgICAgICAgICAgIG1hcmtlcnMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcbiAgICAgICAgICAgICAgICBpc1Zpc2libGUobWFya2Vyc1szXSlcblxuICAgICAgICAgICAgaXQgJ2hpZGVzIHRoZSBjcmVhdGVkIG1hcmtlcnMnLCAtPlxuICAgICAgICAgICAgICBtYXJrZXJzID0gY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpXG4gICAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1swXSkpLnRvQmVGYWxzeSgpXG4gICAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1sxXSkpLnRvQmVUcnV0aHkoKVxuICAgICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMl0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzNdKSkudG9CZVRydXRoeSgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIGEgbGluZSBpcyBlZGl0ZWQgYW5kIGdldHMgd3JhcHBlZCcsIC0+XG4gICAgICAgIG1hcmtlciA9IG51bGxcbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUoKVxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgbWFya2VyID0gY29sb3JCdWZmZXJFbGVtZW50LnVzZWRNYXJrZXJzW2NvbG9yQnVmZmVyRWxlbWVudC51c2VkTWFya2Vycy5sZW5ndGgtMV1cbiAgICAgICAgICAgIHNweU9uKG1hcmtlciwgJ3JlbmRlcicpLmFuZENhbGxUaHJvdWdoKClcblxuICAgICAgICAgICAgZWRpdEJ1ZmZlciBuZXcgQXJyYXkoMjApLmpvaW4oXCJmb28gXCIpLCBzdGFydDogWzEsMF0sIGVuZDogWzEsMF1cblxuICAgICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgICBtYXJrZXIucmVuZGVyLmNhbGxDb3VudCA+IDBcblxuICAgICAgICBpdCAndXBkYXRlcyB0aGUgbWFya2VycyB3aG9zZSBzY3JlZW4gcmFuZ2UgaGF2ZSBjaGFuZ2VkJywgLT5cbiAgICAgICAgICBleHBlY3QobWFya2VyLnJlbmRlcikudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHNvbWUgbWFya2VycyBhcmUgZGVzdHJveWVkJywgLT5cbiAgICAgICAgW3NweV0gPSBbXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgZm9yIGVsIGluIGNvbG9yQnVmZmVyRWxlbWVudC51c2VkTWFya2Vyc1xuICAgICAgICAgICAgc3B5T24oZWwsICdyZWxlYXNlJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUnKVxuICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5vbkRpZFVwZGF0ZShzcHkpXG4gICAgICAgICAgZWRpdEJ1ZmZlciAnJywgc3RhcnQ6IFs0LDBdLCBlbmQ6IFs4LDBdXG4gICAgICAgICAgd2FpdHNGb3IgLT4gc3B5LmNhbGxDb3VudCA+IDBcblxuICAgICAgICBpdCAncmVsZWFzZXMgdGhlIHVudXNlZCBtYXJrZXJzJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpLmxlbmd0aCkudG9FcXVhbCgzKVxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQudXNlZE1hcmtlcnMubGVuZ3RoKS50b0VxdWFsKDIpXG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgxKVxuXG4gICAgICAgICAgZm9yIG1hcmtlciBpbiBjb2xvckJ1ZmZlckVsZW1lbnQudW51c2VkTWFya2Vyc1xuICAgICAgICAgICAgZXhwZWN0KG1hcmtlci5yZWxlYXNlKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgICBkZXNjcmliZSAnYW5kIHRoZW4gYSBuZXcgbWFya2VyIGlzIGNyZWF0ZWQnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGVkaXRvci5tb3ZlVG9Cb3R0b20oKVxuICAgICAgICAgICAgZWRpdEJ1ZmZlciAnXFxuZm9vID0gIzEyMzQ1NlxcbidcbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCBpcyAwXG5cbiAgICAgICAgICBpdCAncmV1c2VzIHRoZSBwcmV2aW91c2x5IHJlbGVhc2VkIG1hcmtlciBlbGVtZW50JywgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJykubGVuZ3RoKS50b0VxdWFsKDMpXG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgzKVxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiB0aGUgY3VycmVudCBwYW5lIGlzIHNwbGl0dGVkIHRvIHRoZSByaWdodCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB2ZXJzaW9uID0gcGFyc2VGbG9hdChhdG9tLmdldFZlcnNpb24oKS5zcGxpdCgnLicpLnNsaWNlKDEsMikuam9pbignLicpKVxuICAgICAgICAgIGlmIHZlcnNpb24gPiA1XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdwYW5lOnNwbGl0LXJpZ2h0LWFuZC1jb3B5LWFjdGl2ZS1pdGVtJylcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdwYW5lOnNwbGl0LXJpZ2h0JylcblxuICAgICAgICAgIHdhaXRzRm9yICd0ZXh0IGVkaXRvcicsIC0+XG4gICAgICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpWzFdXG5cbiAgICAgICAgICB3YWl0c0ZvciAnY29sb3IgYnVmZmVyIGVsZW1lbnQnLCAtPlxuICAgICAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKSlcbiAgICAgICAgICB3YWl0c0ZvciAnY29sb3IgYnVmZmVyIGVsZW1lbnQgbWFya2VycycsIC0+XG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJykubGVuZ3RoXG5cbiAgICAgICAgaXQgJ3Nob3VsZCBrZWVwIGFsbCB0aGUgYnVmZmVyIGVsZW1lbnRzIGF0dGFjaGVkJywgLT5cbiAgICAgICAgICBlZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuXG4gICAgICAgICAgZWRpdG9ycy5mb3JFYWNoIChlZGl0b3IpIC0+XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcigncGlnbWVudHMtbWFya2VycycpXG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50KS50b0V4aXN0KClcblxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOmVtcHR5JykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBtYXJrZXIgdHlwZSBpcyBzZXQgdG8gZ3V0dGVyJywgLT5cbiAgICAgICAgW2d1dHRlcl0gPSBbXVxuXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gY29sb3JCdWZmZXIuaW5pdGlhbGl6ZSgpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5tYXJrZXJUeXBlJywgJ2d1dHRlcidcbiAgICAgICAgICAgIGd1dHRlciA9IGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignW2d1dHRlci1uYW1lPVwicGlnbWVudHMtZ3V0dGVyXCJdJylcblxuICAgICAgICBpdCAncmVtb3ZlcyB0aGUgbWFya2VycycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgICAgICBpdCAnYWRkcyBhIGN1c3RvbSBndXR0ZXIgdG8gdGhlIHRleHQgZWRpdG9yJywgLT5cbiAgICAgICAgICBleHBlY3QoZ3V0dGVyKS50b0V4aXN0KClcblxuICAgICAgICBpdCAnc2V0cyB0aGUgc2l6ZSBvZiB0aGUgZ3V0dGVyIGJhc2VkIG9uIHRoZSBudW1iZXIgb2YgbWFya2VycyBpbiB0aGUgc2FtZSByb3cnLCAtPlxuICAgICAgICAgIGV4cGVjdChndXR0ZXIuc3R5bGUubWluV2lkdGgpLnRvRXF1YWwoJzE0cHgnKVxuXG4gICAgICAgIGl0ICdhZGRzIGEgZ3V0dGVyIGRlY29yYXRpb24gZm9yIGVhY2ggY29sb3IgbWFya2VyJywgLT5cbiAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgIGQucHJvcGVydGllcy50eXBlIGlzICdndXR0ZXInXG4gICAgICAgICAgZXhwZWN0KGRlY29yYXRpb25zLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSB2YXJpYWJsZXMgYmVjb21lIGF2YWlsYWJsZScsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG5cbiAgICAgICAgICBpdCAnY3JlYXRlcyBkZWNvcmF0aW9ucyBmb3IgdGhlIG5ldyB2YWxpZCBjb2xvcnMnLCAtPlxuICAgICAgICAgICAgZGVjb3JhdGlvbnMgPSBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoKS5maWx0ZXIgKGQpIC0+XG4gICAgICAgICAgICAgIGQucHJvcGVydGllcy50eXBlIGlzICdndXR0ZXInXG4gICAgICAgICAgICBleHBlY3QoZGVjb3JhdGlvbnMubGVuZ3RoKS50b0VxdWFsKDQpXG5cbiAgICAgICAgICBkZXNjcmliZSAnd2hlbiBtYW55IG1hcmtlcnMgYXJlIGFkZGVkIG9uIHRoZSBzYW1lIGxpbmUnLCAtPlxuICAgICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgICB1cGRhdGVTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXVwZGF0ZScpXG4gICAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5vbkRpZFVwZGF0ZSh1cGRhdGVTcHkpXG5cbiAgICAgICAgICAgICAgZWRpdG9yLm1vdmVUb0JvdHRvbSgpXG4gICAgICAgICAgICAgIGVkaXRCdWZmZXIgJ1xcbmxpc3QgPSAjMTIzNDU2LCAjOTg3NjU0LCAjYWJjZGVmXFxuJ1xuICAgICAgICAgICAgICB3YWl0c0ZvciAtPiB1cGRhdGVTcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgICAgICBpdCAnYWRkcyB0aGUgbmV3IGRlY29yYXRpb25zIHRvIHRoZSBndXR0ZXInLCAtPlxuICAgICAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgICAgICBkLnByb3BlcnRpZXMudHlwZSBpcyAnZ3V0dGVyJ1xuXG4gICAgICAgICAgICAgIGV4cGVjdChkZWNvcmF0aW9ucy5sZW5ndGgpLnRvRXF1YWwoNylcblxuICAgICAgICAgICAgaXQgJ3NldHMgdGhlIHNpemUgb2YgdGhlIGd1dHRlciBiYXNlZCBvbiB0aGUgbnVtYmVyIG9mIG1hcmtlcnMgaW4gdGhlIHNhbWUgcm93JywgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGd1dHRlci5zdHlsZS5taW5XaWR0aCkudG9FcXVhbCgnNDJweCcpXG5cbiAgICAgICAgICAgIGRlc2NyaWJlICdjbGlja2luZyBvbiBhIGd1dHRlciBkZWNvcmF0aW9uJywgLT5cbiAgICAgICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgICAgIHByb2plY3QuY29sb3JQaWNrZXJBUEkgPVxuICAgICAgICAgICAgICAgICAgb3BlbjogamFzbWluZS5jcmVhdGVTcHkoJ2NvbG9yLXBpY2tlci5vcGVuJylcblxuICAgICAgICAgICAgICAgIGRlY29yYXRpb24gPSBlZGl0b3JFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waWdtZW50cy1ndXR0ZXItbWFya2VyIHNwYW4nKVxuICAgICAgICAgICAgICAgIG1vdXNlZG93bihkZWNvcmF0aW9uKVxuXG4gICAgICAgICAgICAgIGl0ICdzZWxlY3RzIHRoZSB0ZXh0IGluIHRoZSBlZGl0b3InLCAtPlxuICAgICAgICAgICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0U2VsZWN0ZWRTY3JlZW5SYW5nZSgpKS50b0VxdWFsKFtbMCwxM10sWzAsMTddXSlcblxuICAgICAgICAgICAgICBpdCAnb3BlbnMgdGhlIGNvbG9yIHBpY2tlcicsIC0+XG4gICAgICAgICAgICAgICAgZXhwZWN0KHByb2plY3QuY29sb3JQaWNrZXJBUEkub3BlbikudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgZGVzY3JpYmUgJ3doZW4gdGhlIG1hcmtlciBpcyBjaGFuZ2VkIGFnYWluJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLm1hcmtlclR5cGUnLCAnYmFja2dyb3VuZCdcblxuICAgICAgICAgIGl0ICdyZW1vdmVzIHRoZSBndXR0ZXInLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignW2d1dHRlci1uYW1lPVwicGlnbWVudHMtZ3V0dGVyXCJdJykpLm5vdC50b0V4aXN0KClcblxuICAgICAgICAgIGl0ICdyZWNyZWF0ZXMgdGhlIG1hcmtlcnMnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcblxuICAgICAgICBkZXNjcmliZSAnd2hlbiBhIG5ldyBidWZmZXIgaXMgb3BlbmVkJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigncHJvamVjdC9zdHlsZXMvdmFyaWFibGVzLnN0eWwnKS50aGVuIChlKSAtPlxuICAgICAgICAgICAgICAgIGVkaXRvciA9IGVcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgICAgICBjb2xvckJ1ZmZlciA9IHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyhjb2xvckJ1ZmZlcilcblxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLmluaXRpYWxpemUoKVxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG5cbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZ3V0dGVyID0gZWRpdG9yRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZ3V0dGVyLW5hbWU9XCJwaWdtZW50cy1ndXR0ZXJcIl0nKVxuXG4gICAgICAgICAgaXQgJ2NyZWF0ZXMgdGhlIGRlY29yYXRpb25zIGluIHRoZSBuZXcgYnVmZmVyIGd1dHRlcicsIC0+XG4gICAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgICAgZC5wcm9wZXJ0aWVzLnR5cGUgaXMgJ2d1dHRlcidcblxuICAgICAgICAgICAgZXhwZWN0KGRlY29yYXRpb25zLmxlbmd0aCkudG9FcXVhbCgxMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBlZGl0b3IgaXMgbW92ZWQgdG8gYW5vdGhlciBwYW5lJywgLT5cbiAgICAgIFtwYW5lLCBuZXdQYW5lXSA9IFtdXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgICAgbmV3UGFuZSA9IHBhbmUuc3BsaXREb3duKGNvcHlBY3RpdmVJdGVtOiBmYWxzZSlcbiAgICAgICAgY29sb3JCdWZmZXIgPSBwcm9qZWN0LmNvbG9yQnVmZmVyRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGNvbG9yQnVmZmVyKVxuXG4gICAgICAgIGV4cGVjdChhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgIHBhbmUubW92ZUl0ZW1Ub1BhbmUoZWRpdG9yLCBuZXdQYW5lLCAwKVxuXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aFxuXG4gICAgICBpdCAnbW92ZXMgdGhlIGVkaXRvciB3aXRoIHRoZSBidWZmZXIgdG8gdGhlIG5ldyBwYW5lJywgLT5cbiAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6ZW1wdHknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHBpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcyBzZXR0aW5ncyBpcyBkZWZpbmVkJywgLT5cbiAgICAgIGxvYWRCdWZmZXIgPSAoZmlsZVBhdGgpIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZVBhdGgpLnRoZW4gKG8pIC0+XG4gICAgICAgICAgICBlZGl0b3IgPSBvXG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyID0gcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoY29sb3JCdWZmZXIpXG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQuYXR0YWNoKClcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gY29sb3JCdWZmZXIuaW5pdGlhbGl6ZSgpXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUoKVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWxlc3MnKVxuXG4gICAgICBkZXNjcmliZSAnd2l0aCB0aGUgZGVmYXVsdCB3aWxkY2FyZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnKiddXG5cbiAgICAgICAgaXQgJ3N1cHBvcnRzIGV2ZXJ5IGZpbGV0eXBlJywgLT5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdzY29wZS1maWx0ZXIuY29mZmVlJylcbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgbG9hZEJ1ZmZlcigncHJvamVjdC92ZW5kb3IvY3NzL3ZhcmlhYmxlcy5sZXNzJylcbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgyMClcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggYSBmaWxldHlwZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnY29mZmVlJ11cblxuICAgICAgICBpdCAnc3VwcG9ydHMgdGhlIHNwZWNpZmllZCBmaWxlIHR5cGUnLCAtPlxuICAgICAgICAgIGxvYWRCdWZmZXIoJ3Njb3BlLWZpbHRlci5jb2ZmZWUnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdwcm9qZWN0L3ZlbmRvci9jc3MvdmFyaWFibGVzLmxlc3MnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aXRoIG1hbnkgZmlsZXR5cGVzJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuc3VwcG9ydGVkRmlsZXR5cGVzJywgWydjb2ZmZWUnXVxuICAgICAgICAgIHByb2plY3Quc2V0U3VwcG9ydGVkRmlsZXR5cGVzKFsnbGVzcyddKVxuXG4gICAgICAgIGl0ICdzdXBwb3J0cyB0aGUgc3BlY2lmaWVkIGZpbGUgdHlwZXMnLCAtPlxuICAgICAgICAgIGxvYWRCdWZmZXIoJ3Njb3BlLWZpbHRlci5jb2ZmZWUnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdwcm9qZWN0L3ZlbmRvci9jc3MvdmFyaWFibGVzLmxlc3MnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIwKVxuXG4gICAgICAgICAgbG9hZEJ1ZmZlcignZm91ci12YXJpYWJsZXMuc3R5bCcpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgICAgICBkZXNjcmliZSAnd2l0aCBnbG9iYWwgZmlsZSB0eXBlcyBpZ25vcmVkJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnY29mZmVlJ11cbiAgICAgICAgICAgIHByb2plY3Quc2V0SWdub3JlR2xvYmFsU3VwcG9ydGVkRmlsZXR5cGVzKHRydWUpXG4gICAgICAgICAgICBwcm9qZWN0LnNldFN1cHBvcnRlZEZpbGV0eXBlcyhbJ2xlc3MnXSlcblxuICAgICAgICAgIGl0ICdzdXBwb3J0cyB0aGUgc3BlY2lmaWVkIGZpbGUgdHlwZXMnLCAtPlxuICAgICAgICAgICAgbG9hZEJ1ZmZlcignc2NvcGUtZmlsdGVyLmNvZmZlZScpXG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgICAgICAgIGxvYWRCdWZmZXIoJ3Byb2plY3QvdmVuZG9yL2Nzcy92YXJpYWJsZXMubGVzcycpXG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIwKVxuXG4gICAgICAgICAgICBsb2FkQnVmZmVyKCdmb3VyLXZhcmlhYmxlcy5zdHlsJylcbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHBpZ21lbnRzLmlnbm9yZWRTY29wZXMgc2V0dGluZ3MgaXMgZGVmaW5lZCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdzY29wZS1maWx0ZXIuY29mZmVlJykudGhlbiAobykgLT5cbiAgICAgICAgICAgIGVkaXRvciA9IG9cbiAgICAgICAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgICAgICAgY29sb3JCdWZmZXIgPSBwcm9qZWN0LmNvbG9yQnVmZmVyRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyhjb2xvckJ1ZmZlcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5hdHRhY2goKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci5pbml0aWFsaXplKClcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggb25lIGZpbHRlcicsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLmlnbm9yZWRTY29wZXMnLCBbJ1xcXFwuY29tbWVudCddKVxuXG4gICAgICAgIGl0ICdpZ25vcmVzIHRoZSBjb2xvcnMgdGhhdCBtYXRjaGVzIHRoZSBkZWZpbmVkIHNjb3BlcycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMSlcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggdHdvIGZpbHRlcnMnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdwaWdtZW50cy5pZ25vcmVkU2NvcGVzJywgWydcXFxcLnN0cmluZycsICdcXFxcLmNvbW1lbnQnXSlcblxuICAgICAgICBpdCAnaWdub3JlcyB0aGUgY29sb3JzIHRoYXQgbWF0Y2hlcyB0aGUgZGVmaW5lZCBzY29wZXMnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aXRoIGFuIGludmFsaWQgZmlsdGVyJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgncGlnbWVudHMuaWdub3JlZFNjb3BlcycsIFsnXFxcXCddKVxuXG4gICAgICAgIGl0ICdpZ25vcmVzIHRoZSBmaWx0ZXInLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBwcm9qZWN0IGlnbm9yZWRTY29wZXMgaXMgZGVmaW5lZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLmlnbm9yZWRTY29wZXMnLCBbJ1xcXFwuc3RyaW5nJ10pXG4gICAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVkU2NvcGVzKFsnXFxcXC5jb21tZW50J10pXG5cbiAgICAgICAgaXQgJ2lnbm9yZXMgdGhlIGNvbG9ycyB0aGF0IG1hdGNoZXMgdGhlIGRlZmluZWQgc2NvcGVzJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgwKVxuIl19
