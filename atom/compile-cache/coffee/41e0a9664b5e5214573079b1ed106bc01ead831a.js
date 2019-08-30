(function() {
  var ColorBufferElement, ColorMarkerElement, mousedown, path, sleep;

  path = require('path');

  require('./helpers/spec-helper');

  mousedown = require('./helpers/events').mousedown;

  ColorBufferElement = require('../lib/color-buffer-element');

  ColorMarkerElement = require('../lib/color-marker-element');

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
      describe('when pigments.ignoredScopes settings is defined', function() {
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
      return describe('when a text editor settings is modified', function() {
        var originalMarkers;
        originalMarkers = [][0];
        beforeEach(function() {
          waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
          return runs(function() {
            originalMarkers = colorBufferElement.querySelectorAll('pigments-color-marker:not(:empty)');
            spyOn(colorBufferElement, 'updateMarkers').andCallThrough();
            return spyOn(ColorMarkerElement.prototype, 'render').andCallThrough();
          });
        });
        describe('editor.fontSize', function() {
          beforeEach(function() {
            return atom.config.set('editor.fontSize', 20);
          });
          return it('forces an update and a re-render of existing markers', function() {
            var i, len, marker, results;
            expect(colorBufferElement.updateMarkers).toHaveBeenCalled();
            results = [];
            for (i = 0, len = originalMarkers.length; i < len; i++) {
              marker = originalMarkers[i];
              results.push(expect(marker.render).toHaveBeenCalled());
            }
            return results;
          });
        });
        return describe('editor.lineHeight', function() {
          beforeEach(function() {
            return atom.config.set('editor.lineHeight', 20);
          });
          return it('forces an update and a re-render of existing markers', function() {
            var i, len, marker, results;
            expect(colorBufferElement.updateMarkers).toHaveBeenCalled();
            results = [];
            for (i = 0, len = originalMarkers.length; i < len; i++) {
              marker = originalMarkers[i];
              results.push(expect(marker.render).toHaveBeenCalled());
            }
            return results;
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1idWZmZXItZWxlbWVudC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE9BQUEsQ0FBUSx1QkFBUjs7RUFDQyxZQUFhLE9BQUEsQ0FBUSxrQkFBUjs7RUFFZCxrQkFBQSxHQUFxQixPQUFBLENBQVEsNkJBQVI7O0VBQ3JCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSw2QkFBUjs7RUFFckIsS0FBQSxHQUFRLFNBQUMsUUFBRDtBQUNOLFFBQUE7SUFBQSxDQUFBLEdBQVEsSUFBQSxJQUFBLENBQUE7V0FDUixRQUFBLENBQVMsU0FBQTthQUFPLElBQUEsSUFBQSxDQUFBLENBQUosR0FBYSxDQUFiLEdBQWlCO0lBQXBCLENBQVQ7RUFGTTs7RUFJUixRQUFBLENBQVMsb0JBQVQsRUFBK0IsU0FBQTtBQUM3QixRQUFBO0lBQUEsTUFBOEYsRUFBOUYsRUFBQyxlQUFELEVBQVMsc0JBQVQsRUFBd0Isb0JBQXhCLEVBQXFDLGlCQUFyQyxFQUErQyxnQkFBL0MsRUFBd0QsMkJBQXhELEVBQTRFO0lBRTVFLFNBQUEsR0FBWSxTQUFDLElBQUQ7YUFBVSxDQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBZixDQUF3QixRQUF4QjtJQUFkO0lBRVosVUFBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLE9BQVA7QUFDWCxVQUFBOztRQURrQixVQUFROztNQUMxQixJQUFHLHFCQUFIO1FBQ0UsSUFBRyxtQkFBSDtVQUNFLEtBQUEsR0FBUSxDQUFDLE9BQU8sQ0FBQyxLQUFULEVBQWdCLE9BQU8sQ0FBQyxHQUF4QixFQURWO1NBQUEsTUFBQTtVQUdFLEtBQUEsR0FBUSxDQUFDLE9BQU8sQ0FBQyxLQUFULEVBQWdCLE9BQU8sQ0FBQyxLQUF4QixFQUhW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YXRoJ1xucmVxdWlyZSAnLi9oZWxwZXJzL3NwZWMtaGVscGVyJ1xue21vdXNlZG93bn0gPSByZXF1aXJlICcuL2hlbHBlcnMvZXZlbnRzJ1xuXG5Db2xvckJ1ZmZlckVsZW1lbnQgPSByZXF1aXJlICcuLi9saWIvY29sb3ItYnVmZmVyLWVsZW1lbnQnXG5Db2xvck1hcmtlckVsZW1lbnQgPSByZXF1aXJlICcuLi9saWIvY29sb3ItbWFya2VyLWVsZW1lbnQnXG5cbnNsZWVwID0gKGR1cmF0aW9uKSAtPlxuICB0ID0gbmV3IERhdGUoKVxuICB3YWl0c0ZvciAtPiBuZXcgRGF0ZSgpIC0gdCA+IGR1cmF0aW9uXG5cbmRlc2NyaWJlICdDb2xvckJ1ZmZlckVsZW1lbnQnLCAtPlxuICBbZWRpdG9yLCBlZGl0b3JFbGVtZW50LCBjb2xvckJ1ZmZlciwgcGlnbWVudHMsIHByb2plY3QsIGNvbG9yQnVmZmVyRWxlbWVudCwgamFzbWluZUNvbnRlbnRdID0gW11cblxuICBpc1Zpc2libGUgPSAobm9kZSkgLT4gbm90IG5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKVxuXG4gIGVkaXRCdWZmZXIgPSAodGV4dCwgb3B0aW9ucz17fSkgLT5cbiAgICBpZiBvcHRpb25zLnN0YXJ0P1xuICAgICAgaWYgb3B0aW9ucy5lbmQ/XG4gICAgICAgIHJhbmdlID0gW29wdGlvbnMuc3RhcnQsIG9wdGlvbnMuZW5kXVxuICAgICAgZWxzZVxuICAgICAgICByYW5nZSA9IFtvcHRpb25zLnN0YXJ0LCBvcHRpb25zLnN0YXJ0XVxuXG4gICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShyYW5nZSlcblxuICAgIGVkaXRvci5pbnNlcnRUZXh0KHRleHQpXG4gICAgYWR2YW5jZUNsb2NrKDUwMCkgdW5sZXNzIG9wdGlvbnMubm9FdmVudFxuXG4gIGpzb25GaXh0dXJlID0gKGZpeHR1cmUsIGRhdGEpIC0+XG4gICAganNvblBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMnLCBmaXh0dXJlKVxuICAgIGpzb24gPSBmcy5yZWFkRmlsZVN5bmMoanNvblBhdGgpLnRvU3RyaW5nKClcbiAgICBqc29uID0ganNvbi5yZXBsYWNlIC8jXFx7KFxcdyspXFx9L2csIChtLHcpIC0+IGRhdGFbd11cblxuICAgIEpTT04ucGFyc2UoanNvbilcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBqYXNtaW5lQ29udGVudCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI2phc21pbmUtY29udGVudCcpXG5cbiAgICBqYXNtaW5lQ29udGVudC5hcHBlbmRDaGlsZCh3b3Jrc3BhY2VFbGVtZW50KVxuXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3Iuc29mdFdyYXAnLCB0cnVlXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3Iuc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGgnLCB0cnVlXG4gICAgYXRvbS5jb25maWcuc2V0ICdlZGl0b3IucHJlZmVycmVkTGluZUxlbmd0aCcsIDQwXG5cbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLmRlbGF5QmVmb3JlU2NhbicsIDBcbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnNvdXJjZU5hbWVzJywgW1xuICAgICAgJyouc3R5bCdcbiAgICAgICcqLmxlc3MnXG4gICAgXVxuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdmb3VyLXZhcmlhYmxlcy5zdHlsJykudGhlbiAobykgLT5cbiAgICAgICAgZWRpdG9yID0gb1xuICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcblxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgncGlnbWVudHMnKS50aGVuIChwa2cpIC0+XG4gICAgICBwaWdtZW50cyA9IHBrZy5tYWluTW9kdWxlXG4gICAgICBwcm9qZWN0ID0gcGlnbWVudHMuZ2V0UHJvamVjdCgpXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgY29sb3JCdWZmZXI/LmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlICd3aGVuIGFuIGVkaXRvciBpcyBvcGVuZWQnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGNvbG9yQnVmZmVyID0gcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG4gICAgICBjb2xvckJ1ZmZlckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoY29sb3JCdWZmZXIpXG4gICAgICBjb2xvckJ1ZmZlckVsZW1lbnQuYXR0YWNoKClcblxuICAgIGl0ICdpcyBhc3NvY2lhdGVkIHRvIHRoZSBDb2xvckJ1ZmZlciBtb2RlbCcsIC0+XG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50KS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LmdldE1vZGVsKCkpLnRvQmUoY29sb3JCdWZmZXIpXG5cbiAgICBpdCAnYXR0YWNoZXMgaXRzZWxmIGluIHRoZSB0YXJnZXQgdGV4dCBlZGl0b3IgZWxlbWVudCcsIC0+XG4gICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnBhcmVudE5vZGUpLnRvRXhpc3QoKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxpbmVzIHBpZ21lbnRzLW1hcmtlcnMnKSkudG9FeGlzdCgpXG5cbiAgICBkZXNjcmliZSAnd2hlbiB0aGUgY29sb3IgYnVmZmVyIGlzIGluaXRpYWxpemVkJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLmluaXRpYWxpemUoKVxuXG4gICAgICBpdCAnY3JlYXRlcyBtYXJrZXJzIHZpZXdzIGZvciBldmVyeSB2aXNpYmxlIGJ1ZmZlciBtYXJrZXInLCAtPlxuICAgICAgICBtYXJrZXJzRWxlbWVudHMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcblxuICAgICAgICBleHBlY3QobWFya2Vyc0VsZW1lbnRzLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgIGZvciBtYXJrZXIgaW4gbWFya2Vyc0VsZW1lbnRzXG4gICAgICAgICAgZXhwZWN0KG1hcmtlci5nZXRNb2RlbCgpKS50b0JlRGVmaW5lZCgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBwcm9qZWN0IHZhcmlhYmxlcyBhcmUgaW5pdGlhbGl6ZWQnLCAtPlxuICAgICAgICBpdCAnY3JlYXRlcyBtYXJrZXJzIGZvciB0aGUgbmV3IHZhbGlkIGNvbG9ycycsIC0+XG4gICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoNClcblxuICAgICAgZGVzY3JpYmUgJ3doZW4gYSBzZWxlY3Rpb24gaW50ZXJzZWN0cyBhIG1hcmtlciByYW5nZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzcHlPbihjb2xvckJ1ZmZlckVsZW1lbnQsICd1cGRhdGVTZWxlY3Rpb25zJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICAgIGRlc2NyaWJlICdhZnRlciB0aGUgbWFya2VycyB2aWV3cyB3YXMgY3JlYXRlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG4gICAgICAgICAgICBydW5zIC0+IGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlIFtbMiwxMl0sWzIsIDE0XV1cbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51cGRhdGVTZWxlY3Rpb25zLmNhbGxDb3VudCA+IDBcblxuICAgICAgICAgIGl0ICdoaWRlcyB0aGUgaW50ZXJzZWN0ZWQgbWFya2VyJywgLT5cbiAgICAgICAgICAgIG1hcmtlcnMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcblxuICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzBdKSkudG9CZVRydXRoeSgpXG4gICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMV0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1syXSkpLnRvQmVUcnV0aHkoKVxuICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzNdKSkudG9CZUZhbHN5KClcblxuICAgICAgICBkZXNjcmliZSAnYmVmb3JlIGFsbCB0aGUgbWFya2VycyB2aWV3cyB3YXMgY3JlYXRlZCcsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgcnVucyAtPiBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSBbWzAsMF0sWzIsIDE0XV1cbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51cGRhdGVTZWxlY3Rpb25zLmNhbGxDb3VudCA+IDBcblxuICAgICAgICAgIGl0ICdoaWRlcyB0aGUgZXhpc3RpbmcgbWFya2VycycsIC0+XG4gICAgICAgICAgICBtYXJrZXJzID0gY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpXG5cbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1swXSkpLnRvQmVGYWxzeSgpXG4gICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMV0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1syXSkpLnRvQmVUcnV0aHkoKVxuXG4gICAgICAgICAgZGVzY3JpYmUgJ2FuZCB0aGUgbWFya2VycyBhcmUgdXBkYXRlZCcsIC0+XG4gICAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAnY29sb3JzIGF2YWlsYWJsZScsIC0+XG4gICAgICAgICAgICAgICAgY29sb3JCdWZmZXIudmFyaWFibGVzQXZhaWxhYmxlKClcbiAgICAgICAgICAgICAgd2FpdHNGb3IgJ2xhc3QgbWFya2VyIHZpc2libGUnLCAtPlxuICAgICAgICAgICAgICAgIG1hcmtlcnMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJylcbiAgICAgICAgICAgICAgICBpc1Zpc2libGUobWFya2Vyc1szXSlcblxuICAgICAgICAgICAgaXQgJ2hpZGVzIHRoZSBjcmVhdGVkIG1hcmtlcnMnLCAtPlxuICAgICAgICAgICAgICBtYXJrZXJzID0gY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpXG4gICAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1swXSkpLnRvQmVGYWxzeSgpXG4gICAgICAgICAgICAgIGV4cGVjdChpc1Zpc2libGUobWFya2Vyc1sxXSkpLnRvQmVUcnV0aHkoKVxuICAgICAgICAgICAgICBleHBlY3QoaXNWaXNpYmxlKG1hcmtlcnNbMl0pKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgICAgZXhwZWN0KGlzVmlzaWJsZShtYXJrZXJzWzNdKSkudG9CZVRydXRoeSgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIGEgbGluZSBpcyBlZGl0ZWQgYW5kIGdldHMgd3JhcHBlZCcsIC0+XG4gICAgICAgIG1hcmtlciA9IG51bGxcbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUoKVxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgbWFya2VyID0gY29sb3JCdWZmZXJFbGVtZW50LnVzZWRNYXJrZXJzW2NvbG9yQnVmZmVyRWxlbWVudC51c2VkTWFya2Vycy5sZW5ndGgtMV1cbiAgICAgICAgICAgIHNweU9uKG1hcmtlciwgJ3JlbmRlcicpLmFuZENhbGxUaHJvdWdoKClcblxuICAgICAgICAgICAgZWRpdEJ1ZmZlciBuZXcgQXJyYXkoMjApLmpvaW4oXCJmb28gXCIpLCBzdGFydDogWzEsMF0sIGVuZDogWzEsMF1cblxuICAgICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgICBtYXJrZXIucmVuZGVyLmNhbGxDb3VudCA+IDBcblxuICAgICAgICBpdCAndXBkYXRlcyB0aGUgbWFya2VycyB3aG9zZSBzY3JlZW4gcmFuZ2UgaGF2ZSBjaGFuZ2VkJywgLT5cbiAgICAgICAgICBleHBlY3QobWFya2VyLnJlbmRlcikudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHNvbWUgbWFya2VycyBhcmUgZGVzdHJveWVkJywgLT5cbiAgICAgICAgW3NweV0gPSBbXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgZm9yIGVsIGluIGNvbG9yQnVmZmVyRWxlbWVudC51c2VkTWFya2Vyc1xuICAgICAgICAgICAgc3B5T24oZWwsICdyZWxlYXNlJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC11cGRhdGUnKVxuICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5vbkRpZFVwZGF0ZShzcHkpXG4gICAgICAgICAgZWRpdEJ1ZmZlciAnJywgc3RhcnQ6IFs0LDBdLCBlbmQ6IFs4LDBdXG4gICAgICAgICAgd2FpdHNGb3IgLT4gc3B5LmNhbGxDb3VudCA+IDBcblxuICAgICAgICBpdCAncmVsZWFzZXMgdGhlIHVudXNlZCBtYXJrZXJzJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcicpLmxlbmd0aCkudG9FcXVhbCgzKVxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQudXNlZE1hcmtlcnMubGVuZ3RoKS50b0VxdWFsKDIpXG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgxKVxuXG4gICAgICAgICAgZm9yIG1hcmtlciBpbiBjb2xvckJ1ZmZlckVsZW1lbnQudW51c2VkTWFya2Vyc1xuICAgICAgICAgICAgZXhwZWN0KG1hcmtlci5yZWxlYXNlKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgICBkZXNjcmliZSAnYW5kIHRoZW4gYSBuZXcgbWFya2VyIGlzIGNyZWF0ZWQnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGVkaXRvci5tb3ZlVG9Cb3R0b20oKVxuICAgICAgICAgICAgZWRpdEJ1ZmZlciAnXFxuZm9vID0gIzEyMzQ1NlxcbidcbiAgICAgICAgICAgIHdhaXRzRm9yIC0+IGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCBpcyAwXG5cbiAgICAgICAgICBpdCAncmV1c2VzIHRoZSBwcmV2aW91c2x5IHJlbGVhc2VkIG1hcmtlciBlbGVtZW50JywgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJykubGVuZ3RoKS50b0VxdWFsKDMpXG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgzKVxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC51bnVzZWRNYXJrZXJzLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiB0aGUgY3VycmVudCBwYW5lIGlzIHNwbGl0dGVkIHRvIHRoZSByaWdodCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB2ZXJzaW9uID0gcGFyc2VGbG9hdChhdG9tLmdldFZlcnNpb24oKS5zcGxpdCgnLicpLnNsaWNlKDEsMikuam9pbignLicpKVxuICAgICAgICAgIGlmIHZlcnNpb24gPiA1XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdwYW5lOnNwbGl0LXJpZ2h0LWFuZC1jb3B5LWFjdGl2ZS1pdGVtJylcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdwYW5lOnNwbGl0LXJpZ2h0JylcblxuICAgICAgICAgIHdhaXRzRm9yICd0ZXh0IGVkaXRvcicsIC0+XG4gICAgICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpWzFdXG5cbiAgICAgICAgICB3YWl0c0ZvciAnY29sb3IgYnVmZmVyIGVsZW1lbnQnLCAtPlxuICAgICAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKSlcbiAgICAgICAgICB3YWl0c0ZvciAnY29sb3IgYnVmZmVyIGVsZW1lbnQgbWFya2VycycsIC0+XG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyJykubGVuZ3RoXG5cbiAgICAgICAgaXQgJ3Nob3VsZCBrZWVwIGFsbCB0aGUgYnVmZmVyIGVsZW1lbnRzIGF0dGFjaGVkJywgLT5cbiAgICAgICAgICBlZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuXG4gICAgICAgICAgZWRpdG9ycy5mb3JFYWNoIChlZGl0b3IpIC0+XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcigncGlnbWVudHMtbWFya2VycycpXG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50KS50b0V4aXN0KClcblxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOmVtcHR5JykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBtYXJrZXIgdHlwZSBpcyBzZXQgdG8gZ3V0dGVyJywgLT5cbiAgICAgICAgW2d1dHRlcl0gPSBbXVxuXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gY29sb3JCdWZmZXIuaW5pdGlhbGl6ZSgpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5tYXJrZXJUeXBlJywgJ2d1dHRlcidcbiAgICAgICAgICAgIGd1dHRlciA9IGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignW2d1dHRlci1uYW1lPVwicGlnbWVudHMtZ3V0dGVyXCJdJylcblxuICAgICAgICBpdCAncmVtb3ZlcyB0aGUgbWFya2VycycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgICAgICBpdCAnYWRkcyBhIGN1c3RvbSBndXR0ZXIgdG8gdGhlIHRleHQgZWRpdG9yJywgLT5cbiAgICAgICAgICBleHBlY3QoZ3V0dGVyKS50b0V4aXN0KClcblxuICAgICAgICBpdCAnc2V0cyB0aGUgc2l6ZSBvZiB0aGUgZ3V0dGVyIGJhc2VkIG9uIHRoZSBudW1iZXIgb2YgbWFya2VycyBpbiB0aGUgc2FtZSByb3cnLCAtPlxuICAgICAgICAgIGV4cGVjdChndXR0ZXIuc3R5bGUubWluV2lkdGgpLnRvRXF1YWwoJzE0cHgnKVxuXG4gICAgICAgIGl0ICdhZGRzIGEgZ3V0dGVyIGRlY29yYXRpb24gZm9yIGVhY2ggY29sb3IgbWFya2VyJywgLT5cbiAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgIGQucHJvcGVydGllcy50eXBlIGlzICdndXR0ZXInXG4gICAgICAgICAgZXhwZWN0KGRlY29yYXRpb25zLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSB2YXJpYWJsZXMgYmVjb21lIGF2YWlsYWJsZScsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG5cbiAgICAgICAgICBpdCAnY3JlYXRlcyBkZWNvcmF0aW9ucyBmb3IgdGhlIG5ldyB2YWxpZCBjb2xvcnMnLCAtPlxuICAgICAgICAgICAgZGVjb3JhdGlvbnMgPSBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoKS5maWx0ZXIgKGQpIC0+XG4gICAgICAgICAgICAgIGQucHJvcGVydGllcy50eXBlIGlzICdndXR0ZXInXG4gICAgICAgICAgICBleHBlY3QoZGVjb3JhdGlvbnMubGVuZ3RoKS50b0VxdWFsKDQpXG5cbiAgICAgICAgICBkZXNjcmliZSAnd2hlbiBtYW55IG1hcmtlcnMgYXJlIGFkZGVkIG9uIHRoZSBzYW1lIGxpbmUnLCAtPlxuICAgICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgICB1cGRhdGVTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXVwZGF0ZScpXG4gICAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5vbkRpZFVwZGF0ZSh1cGRhdGVTcHkpXG5cbiAgICAgICAgICAgICAgZWRpdG9yLm1vdmVUb0JvdHRvbSgpXG4gICAgICAgICAgICAgIGVkaXRCdWZmZXIgJ1xcbmxpc3QgPSAjMTIzNDU2LCAjOTg3NjU0LCAjYWJjZGVmXFxuJ1xuICAgICAgICAgICAgICB3YWl0c0ZvciAtPiB1cGRhdGVTcHkuY2FsbENvdW50ID4gMFxuXG4gICAgICAgICAgICBpdCAnYWRkcyB0aGUgbmV3IGRlY29yYXRpb25zIHRvIHRoZSBndXR0ZXInLCAtPlxuICAgICAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgICAgICBkLnByb3BlcnRpZXMudHlwZSBpcyAnZ3V0dGVyJ1xuXG4gICAgICAgICAgICAgIGV4cGVjdChkZWNvcmF0aW9ucy5sZW5ndGgpLnRvRXF1YWwoNylcblxuICAgICAgICAgICAgaXQgJ3NldHMgdGhlIHNpemUgb2YgdGhlIGd1dHRlciBiYXNlZCBvbiB0aGUgbnVtYmVyIG9mIG1hcmtlcnMgaW4gdGhlIHNhbWUgcm93JywgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGd1dHRlci5zdHlsZS5taW5XaWR0aCkudG9FcXVhbCgnNDJweCcpXG5cbiAgICAgICAgICAgIGRlc2NyaWJlICdjbGlja2luZyBvbiBhIGd1dHRlciBkZWNvcmF0aW9uJywgLT5cbiAgICAgICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgICAgIHByb2plY3QuY29sb3JQaWNrZXJBUEkgPVxuICAgICAgICAgICAgICAgICAgb3BlbjogamFzbWluZS5jcmVhdGVTcHkoJ2NvbG9yLXBpY2tlci5vcGVuJylcblxuICAgICAgICAgICAgICAgIGRlY29yYXRpb24gPSBlZGl0b3JFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waWdtZW50cy1ndXR0ZXItbWFya2VyIHNwYW4nKVxuICAgICAgICAgICAgICAgIG1vdXNlZG93bihkZWNvcmF0aW9uKVxuXG4gICAgICAgICAgICAgIGl0ICdzZWxlY3RzIHRoZSB0ZXh0IGluIHRoZSBlZGl0b3InLCAtPlxuICAgICAgICAgICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0U2VsZWN0ZWRTY3JlZW5SYW5nZSgpKS50b0VxdWFsKFtbMCwxM10sWzAsMTddXSlcblxuICAgICAgICAgICAgICBpdCAnb3BlbnMgdGhlIGNvbG9yIHBpY2tlcicsIC0+XG4gICAgICAgICAgICAgICAgZXhwZWN0KHByb2plY3QuY29sb3JQaWNrZXJBUEkub3BlbikudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgZGVzY3JpYmUgJ3doZW4gdGhlIG1hcmtlciBpcyBjaGFuZ2VkIGFnYWluJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLm1hcmtlclR5cGUnLCAnYmFja2dyb3VuZCdcblxuICAgICAgICAgIGl0ICdyZW1vdmVzIHRoZSBndXR0ZXInLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvcignW2d1dHRlci1uYW1lPVwicGlnbWVudHMtZ3V0dGVyXCJdJykpLm5vdC50b0V4aXN0KClcblxuICAgICAgICAgIGl0ICdyZWNyZWF0ZXMgdGhlIG1hcmtlcnMnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcblxuICAgICAgICBkZXNjcmliZSAnd2hlbiBhIG5ldyBidWZmZXIgaXMgb3BlbmVkJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigncHJvamVjdC9zdHlsZXMvdmFyaWFibGVzLnN0eWwnKS50aGVuIChlKSAtPlxuICAgICAgICAgICAgICAgIGVkaXRvciA9IGVcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgICAgICBjb2xvckJ1ZmZlciA9IHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyhjb2xvckJ1ZmZlcilcblxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLmluaXRpYWxpemUoKVxuICAgICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGNvbG9yQnVmZmVyLnZhcmlhYmxlc0F2YWlsYWJsZSgpXG5cbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZ3V0dGVyID0gZWRpdG9yRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZ3V0dGVyLW5hbWU9XCJwaWdtZW50cy1ndXR0ZXJcIl0nKVxuXG4gICAgICAgICAgaXQgJ2NyZWF0ZXMgdGhlIGRlY29yYXRpb25zIGluIHRoZSBuZXcgYnVmZmVyIGd1dHRlcicsIC0+XG4gICAgICAgICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvci5nZXREZWNvcmF0aW9ucygpLmZpbHRlciAoZCkgLT5cbiAgICAgICAgICAgICAgZC5wcm9wZXJ0aWVzLnR5cGUgaXMgJ2d1dHRlcidcblxuICAgICAgICAgICAgZXhwZWN0KGRlY29yYXRpb25zLmxlbmd0aCkudG9FcXVhbCgxMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBlZGl0b3IgaXMgbW92ZWQgdG8gYW5vdGhlciBwYW5lJywgLT5cbiAgICAgIFtwYW5lLCBuZXdQYW5lXSA9IFtdXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgICAgbmV3UGFuZSA9IHBhbmUuc3BsaXREb3duKGNvcHlBY3RpdmVJdGVtOiBmYWxzZSlcbiAgICAgICAgY29sb3JCdWZmZXIgPSBwcm9qZWN0LmNvbG9yQnVmZmVyRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGNvbG9yQnVmZmVyKVxuXG4gICAgICAgIGV4cGVjdChhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgIHBhbmUubW92ZUl0ZW1Ub1BhbmUoZWRpdG9yLCBuZXdQYW5lLCAwKVxuXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aFxuXG4gICAgICBpdCAnbW92ZXMgdGhlIGVkaXRvciB3aXRoIHRoZSBidWZmZXIgdG8gdGhlIG5ldyBwYW5lJywgLT5cbiAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXInKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6ZW1wdHknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHBpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcyBzZXR0aW5ncyBpcyBkZWZpbmVkJywgLT5cbiAgICAgIGxvYWRCdWZmZXIgPSAoZmlsZVBhdGgpIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZVBhdGgpLnRoZW4gKG8pIC0+XG4gICAgICAgICAgICBlZGl0b3IgPSBvXG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyID0gcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoY29sb3JCdWZmZXIpXG4gICAgICAgICAgICBjb2xvckJ1ZmZlckVsZW1lbnQuYXR0YWNoKClcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gY29sb3JCdWZmZXIuaW5pdGlhbGl6ZSgpXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUoKVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWxlc3MnKVxuXG4gICAgICBkZXNjcmliZSAnd2l0aCB0aGUgZGVmYXVsdCB3aWxkY2FyZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnKiddXG5cbiAgICAgICAgaXQgJ3N1cHBvcnRzIGV2ZXJ5IGZpbGV0eXBlJywgLT5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdzY29wZS1maWx0ZXIuY29mZmVlJylcbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgbG9hZEJ1ZmZlcigncHJvamVjdC92ZW5kb3IvY3NzL3ZhcmlhYmxlcy5sZXNzJylcbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgyMClcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggYSBmaWxldHlwZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnY29mZmVlJ11cblxuICAgICAgICBpdCAnc3VwcG9ydHMgdGhlIHNwZWNpZmllZCBmaWxlIHR5cGUnLCAtPlxuICAgICAgICAgIGxvYWRCdWZmZXIoJ3Njb3BlLWZpbHRlci5jb2ZmZWUnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdwcm9qZWN0L3ZlbmRvci9jc3MvdmFyaWFibGVzLmxlc3MnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aXRoIG1hbnkgZmlsZXR5cGVzJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuc3VwcG9ydGVkRmlsZXR5cGVzJywgWydjb2ZmZWUnXVxuICAgICAgICAgIHByb2plY3Quc2V0U3VwcG9ydGVkRmlsZXR5cGVzKFsnbGVzcyddKVxuXG4gICAgICAgIGl0ICdzdXBwb3J0cyB0aGUgc3BlY2lmaWVkIGZpbGUgdHlwZXMnLCAtPlxuICAgICAgICAgIGxvYWRCdWZmZXIoJ3Njb3BlLWZpbHRlci5jb2ZmZWUnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBsb2FkQnVmZmVyKCdwcm9qZWN0L3ZlbmRvci9jc3MvdmFyaWFibGVzLmxlc3MnKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIwKVxuXG4gICAgICAgICAgbG9hZEJ1ZmZlcignZm91ci12YXJpYWJsZXMuc3R5bCcpXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgICAgICBkZXNjcmliZSAnd2l0aCBnbG9iYWwgZmlsZSB0eXBlcyBpZ25vcmVkJywgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLnN1cHBvcnRlZEZpbGV0eXBlcycsIFsnY29mZmVlJ11cbiAgICAgICAgICAgIHByb2plY3Quc2V0SWdub3JlR2xvYmFsU3VwcG9ydGVkRmlsZXR5cGVzKHRydWUpXG4gICAgICAgICAgICBwcm9qZWN0LnNldFN1cHBvcnRlZEZpbGV0eXBlcyhbJ2xlc3MnXSlcblxuICAgICAgICAgIGl0ICdzdXBwb3J0cyB0aGUgc3BlY2lmaWVkIGZpbGUgdHlwZXMnLCAtPlxuICAgICAgICAgICAgbG9hZEJ1ZmZlcignc2NvcGUtZmlsdGVyLmNvZmZlZScpXG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgICAgICAgIGxvYWRCdWZmZXIoJ3Byb2plY3QvdmVuZG9yL2Nzcy92YXJpYWJsZXMubGVzcycpXG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIwKVxuXG4gICAgICAgICAgICBsb2FkQnVmZmVyKCdmb3VyLXZhcmlhYmxlcy5zdHlsJylcbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMClcblxuICAgIGRlc2NyaWJlICd3aGVuIHBpZ21lbnRzLmlnbm9yZWRTY29wZXMgc2V0dGluZ3MgaXMgZGVmaW5lZCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdzY29wZS1maWx0ZXIuY29mZmVlJykudGhlbiAobykgLT5cbiAgICAgICAgICAgIGVkaXRvciA9IG9cbiAgICAgICAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgICAgICAgY29sb3JCdWZmZXIgPSBwcm9qZWN0LmNvbG9yQnVmZmVyRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyhjb2xvckJ1ZmZlcilcbiAgICAgICAgICAgIGNvbG9yQnVmZmVyRWxlbWVudC5hdHRhY2goKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci5pbml0aWFsaXplKClcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggb25lIGZpbHRlcicsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLmlnbm9yZWRTY29wZXMnLCBbJ1xcXFwuY29tbWVudCddKVxuXG4gICAgICAgIGl0ICdpZ25vcmVzIHRoZSBjb2xvcnMgdGhhdCBtYXRjaGVzIHRoZSBkZWZpbmVkIHNjb3BlcycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwaWdtZW50cy1jb2xvci1tYXJrZXI6bm90KDplbXB0eSknKS5sZW5ndGgpLnRvRXF1YWwoMSlcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggdHdvIGZpbHRlcnMnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdwaWdtZW50cy5pZ25vcmVkU2NvcGVzJywgWydcXFxcLnN0cmluZycsICdcXFxcLmNvbW1lbnQnXSlcblxuICAgICAgICBpdCAnaWdub3JlcyB0aGUgY29sb3JzIHRoYXQgbWF0Y2hlcyB0aGUgZGVmaW5lZCBzY29wZXMnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd3aXRoIGFuIGludmFsaWQgZmlsdGVyJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgncGlnbWVudHMuaWdub3JlZFNjb3BlcycsIFsnXFxcXCddKVxuXG4gICAgICAgIGl0ICdpZ25vcmVzIHRoZSBmaWx0ZXInLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJykubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIHRoZSBwcm9qZWN0IGlnbm9yZWRTY29wZXMgaXMgZGVmaW5lZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLmlnbm9yZWRTY29wZXMnLCBbJ1xcXFwuc3RyaW5nJ10pXG4gICAgICAgICAgcHJvamVjdC5zZXRJZ25vcmVkU2NvcGVzKFsnXFxcXC5jb21tZW50J10pXG5cbiAgICAgICAgaXQgJ2lnbm9yZXMgdGhlIGNvbG9ycyB0aGF0IG1hdGNoZXMgdGhlIGRlZmluZWQgc2NvcGVzJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sb3JCdWZmZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BpZ21lbnRzLWNvbG9yLW1hcmtlcjpub3QoOmVtcHR5KScpLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gYSB0ZXh0IGVkaXRvciBzZXR0aW5ncyBpcyBtb2RpZmllZCcsIC0+XG4gICAgICBbb3JpZ2luYWxNYXJrZXJzXSA9IFtdXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBjb2xvckJ1ZmZlci52YXJpYWJsZXNBdmFpbGFibGUoKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBvcmlnaW5hbE1hcmtlcnMgPSBjb2xvckJ1ZmZlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgncGlnbWVudHMtY29sb3ItbWFya2VyOm5vdCg6ZW1wdHkpJylcbiAgICAgICAgICBzcHlPbihjb2xvckJ1ZmZlckVsZW1lbnQsICd1cGRhdGVNYXJrZXJzJykuYW5kQ2FsbFRocm91Z2goKVxuICAgICAgICAgIHNweU9uKENvbG9yTWFya2VyRWxlbWVudDo6LCAncmVuZGVyJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICBkZXNjcmliZSAnZWRpdG9yLmZvbnRTaXplJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnZWRpdG9yLmZvbnRTaXplJywgMjApXG5cbiAgICAgICAgaXQgJ2ZvcmNlcyBhbiB1cGRhdGUgYW5kIGEgcmUtcmVuZGVyIG9mIGV4aXN0aW5nIG1hcmtlcnMnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xvckJ1ZmZlckVsZW1lbnQudXBkYXRlTWFya2VycykudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgICAgZm9yIG1hcmtlciBpbiBvcmlnaW5hbE1hcmtlcnNcbiAgICAgICAgICAgIGV4cGVjdChtYXJrZXIucmVuZGVyKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgZGVzY3JpYmUgJ2VkaXRvci5saW5lSGVpZ2h0JywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnZWRpdG9yLmxpbmVIZWlnaHQnLCAyMClcblxuICAgICAgICBpdCAnZm9yY2VzIGFuIHVwZGF0ZSBhbmQgYSByZS1yZW5kZXIgb2YgZXhpc3RpbmcgbWFya2VycycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbG9yQnVmZmVyRWxlbWVudC51cGRhdGVNYXJrZXJzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBmb3IgbWFya2VyIGluIG9yaWdpbmFsTWFya2Vyc1xuICAgICAgICAgICAgZXhwZWN0KG1hcmtlci5yZW5kZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuIl19
