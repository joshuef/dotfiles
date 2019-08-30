(function() {
  var ColorBuffer, ColorBufferElement, ColorMarker, ColorProject, ColorProjectElement, ColorResultsElement, ColorSearch, Disposable, Palette, PaletteElement, PigmentsAPI, PigmentsProvider, VariablesCollection, ref, uris, url;

  ref = [], Palette = ref[0], PaletteElement = ref[1], ColorSearch = ref[2], ColorResultsElement = ref[3], ColorProject = ref[4], ColorProjectElement = ref[5], ColorBuffer = ref[6], ColorBufferElement = ref[7], ColorMarker = ref[8], VariablesCollection = ref[9], PigmentsProvider = ref[10], PigmentsAPI = ref[11], Disposable = ref[12], url = ref[13], uris = ref[14];

  module.exports = {
    activate: function(state) {
      var convertMethod, copyMethod;
      if (ColorProject == null) {
        ColorProject = require('./color-project');
      }
      this.patchAtom();
      this.project = state.project != null ? ColorProject.deserialize(state.project) : new ColorProject();
      atom.commands.add('atom-workspace', {
        'pigments:find-colors': (function(_this) {
          return function() {
            return _this.findColors();
          };
        })(this),
        'pigments:show-palette': (function(_this) {
          return function() {
            return _this.showPalette();
          };
        })(this),
        'pigments:project-settings': (function(_this) {
          return function() {
            return _this.showSettings();
          };
        })(this),
        'pigments:reload': (function(_this) {
          return function() {
            return _this.reloadProjectVariables();
          };
        })(this),
        'pigments:report': (function(_this) {
          return function() {
            return _this.createPigmentsReport();
          };
        })(this)
      });
      convertMethod = (function(_this) {
        return function(action) {
          return function(event) {
            var colorBuffer, editor;
            if (_this.lastEvent != null) {
              action(_this.colorMarkerForMouseEvent(_this.lastEvent));
            } else {
              editor = atom.workspace.getActiveTextEditor();
              colorBuffer = _this.project.colorBufferForEditor(editor);
              editor.getCursors().forEach(function(cursor) {
                var marker;
                marker = colorBuffer.getColorMarkerAtBufferPosition(cursor.getBufferPosition());
                return action(marker);
              });
            }
            return _this.lastEvent = null;
          };
        };
      })(this);
      copyMethod = (function(_this) {
        return function(action) {
          return function(event) {
            var colorBuffer, cursor, editor, marker;
            if (_this.lastEvent != null) {
              action(_this.colorMarkerForMouseEvent(_this.lastEvent));
            } else {
              editor = atom.workspace.getActiveTextEditor();
              colorBuffer = _this.project.colorBufferForEditor(editor);
              cursor = editor.getLastCursor();
              marker = colorBuffer.getColorMarkerAtBufferPosition(cursor.getBufferPosition());
              action(marker);
            }
            return _this.lastEvent = null;
          };
        };
      })(this);
      atom.commands.add('atom-text-editor', {
        'pigments:convert-to-hex': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToHex();
          }
        }),
        'pigments:convert-to-rgb': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToRGB();
          }
        }),
        'pigments:convert-to-rgba': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToRGBA();
          }
        }),
        'pigments:convert-to-hsl': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToHSL();
          }
        }),
        'pigments:convert-to-hsla': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToHSLA();
          }
        }),
        'pigments:copy-as-hex': copyMethod(function(marker) {
          if (marker != null) {
            return marker.copyContentAsHex();
          }
        }),
        'pigments:copy-as-rgb': copyMethod(function(marker) {
          if (marker != null) {
            return marker.copyContentAsRGB();
          }
        }),
        'pigments:copy-as-rgba': copyMethod(function(marker) {
          if (marker != null) {
            return marker.copyContentAsRGBA();
          }
        }),
        'pigments:copy-as-hsl': copyMethod(function(marker) {
          if (marker != null) {
            return marker.copyContentAsHSL();
          }
        }),
        'pigments:copy-as-hsla': copyMethod(function(marker) {
          if (marker != null) {
            return marker.copyContentAsHSLA();
          }
        })
      });
      atom.workspace.addOpener((function(_this) {
        return function(uriToOpen) {
          var host, protocol, ref1;
          url || (url = require('url'));
          ref1 = url.parse(uriToOpen), protocol = ref1.protocol, host = ref1.host;
          if (protocol !== 'pigments:') {
            return;
          }
          switch (host) {
            case 'search':
              return _this.project.findAllColors();
            case 'palette':
              return _this.project.getPalette();
            case 'settings':
              return atom.views.getView(_this.project);
          }
        };
      })(this));
      return atom.contextMenu.add({
        'atom-text-editor': [
          {
            label: 'Pigments',
            submenu: [
              {
                label: 'Convert to hexadecimal',
                command: 'pigments:convert-to-hex'
              }, {
                label: 'Convert to RGB',
                command: 'pigments:convert-to-rgb'
              }, {
                label: 'Convert to RGBA',
                command: 'pigments:convert-to-rgba'
              }, {
                label: 'Convert to HSL',
                command: 'pigments:convert-to-hsl'
              }, {
                label: 'Convert to HSLA',
                command: 'pigments:convert-to-hsla'
              }, {
                type: 'separator'
              }, {
                label: 'Copy as hexadecimal',
                command: 'pigments:copy-as-hex'
              }, {
                label: 'Copy as RGB',
                command: 'pigments:copy-as-rgb'
              }, {
                label: 'Copy as RGBA',
                command: 'pigments:copy-as-rgba'
              }, {
                label: 'Copy as HSL',
                command: 'pigments:copy-as-hsl'
              }, {
                label: 'Copy as HSLA',
                command: 'pigments:copy-as-hsla'
              }
            ],
            shouldDisplay: (function(_this) {
              return function(event) {
                return _this.shouldDisplayContextMenu(event);
              };
            })(this)
          }
        ]
      });
    },
    deactivate: function() {
      var ref1;
      return (ref1 = this.getProject()) != null ? typeof ref1.destroy === "function" ? ref1.destroy() : void 0 : void 0;
    },
    provideAutocomplete: function() {
      if (PigmentsProvider == null) {
        PigmentsProvider = require('./pigments-provider');
      }
      return new PigmentsProvider(this);
    },
    provideAPI: function() {
      if (PigmentsAPI == null) {
        PigmentsAPI = require('./pigments-api');
      }
      return new PigmentsAPI(this.getProject());
    },
    consumeColorPicker: function(api) {
      if (Disposable == null) {
        Disposable = require('atom').Disposable;
      }
      this.getProject().setColorPickerAPI(api);
      return new Disposable((function(_this) {
        return function() {
          return _this.getProject().setColorPickerAPI(null);
        };
      })(this));
    },
    consumeColorExpressions: function(options) {
      var handle, name, names, priority, regexpString, registry, scopes;
      if (options == null) {
        options = {};
      }
      if (Disposable == null) {
        Disposable = require('atom').Disposable;
      }
      registry = this.getProject().getColorExpressionsRegistry();
      if (options.expressions != null) {
        names = options.expressions.map(function(e) {
          return e.name;
        });
        registry.createExpressions(options.expressions);
        return new Disposable(function() {
          var i, len, name, results;
          results = [];
          for (i = 0, len = names.length; i < len; i++) {
            name = names[i];
            results.push(registry.removeExpression(name));
          }
          return results;
        });
      } else {
        name = options.name, regexpString = options.regexpString, handle = options.handle, scopes = options.scopes, priority = options.priority;
        registry.createExpression(name, regexpString, priority, scopes, handle);
        return new Disposable(function() {
          return registry.removeExpression(name);
        });
      }
    },
    consumeVariableExpressions: function(options) {
      var handle, name, names, priority, regexpString, registry, scopes;
      if (options == null) {
        options = {};
      }
      if (Disposable == null) {
        Disposable = require('atom').Disposable;
      }
      registry = this.getProject().getVariableExpressionsRegistry();
      if (options.expressions != null) {
        names = options.expressions.map(function(e) {
          return e.name;
        });
        registry.createExpressions(options.expressions);
        return new Disposable(function() {
          var i, len, name, results;
          results = [];
          for (i = 0, len = names.length; i < len; i++) {
            name = names[i];
            results.push(registry.removeExpression(name));
          }
          return results;
        });
      } else {
        name = options.name, regexpString = options.regexpString, handle = options.handle, scopes = options.scopes, priority = options.priority;
        registry.createExpression(name, regexpString, priority, scopes, handle);
        return new Disposable(function() {
          return registry.removeExpression(name);
        });
      }
    },
    deserializePalette: function(state) {
      if (Palette == null) {
        Palette = require('./palette');
      }
      return Palette.deserialize(state);
    },
    deserializeColorSearch: function(state) {
      if (ColorSearch == null) {
        ColorSearch = require('./color-search');
      }
      return ColorSearch.deserialize(state);
    },
    deserializeColorProject: function(state) {
      if (ColorProject == null) {
        ColorProject = require('./color-project');
      }
      return ColorProject.deserialize(state);
    },
    deserializeColorProjectElement: function(state) {
      var element, subscription;
      if (ColorProjectElement == null) {
        ColorProjectElement = require('./color-project-element');
      }
      element = new ColorProjectElement;
      if (this.project != null) {
        element.setModel(this.getProject());
      } else {
        subscription = atom.packages.onDidActivatePackage((function(_this) {
          return function(pkg) {
            if (pkg.name === 'pigments') {
              subscription.dispose();
              return element.setModel(_this.getProject());
            }
          };
        })(this));
      }
      return element;
    },
    deserializeVariablesCollection: function(state) {
      if (VariablesCollection == null) {
        VariablesCollection = require('./variables-collection');
      }
      return VariablesCollection.deserialize(state);
    },
    pigmentsViewProvider: function(model) {
      var element;
      element = model instanceof (ColorBuffer != null ? ColorBuffer : ColorBuffer = require('./color-buffer')) ? (ColorBufferElement != null ? ColorBufferElement : ColorBufferElement = require('./color-buffer-element'), element = new ColorBufferElement) : model instanceof (ColorSearch != null ? ColorSearch : ColorSearch = require('./color-search')) ? (ColorResultsElement != null ? ColorResultsElement : ColorResultsElement = require('./color-results-element'), element = new ColorResultsElement) : model instanceof (ColorProject != null ? ColorProject : ColorProject = require('./color-project')) ? (ColorProjectElement != null ? ColorProjectElement : ColorProjectElement = require('./color-project-element'), element = new ColorProjectElement) : model instanceof (Palette != null ? Palette : Palette = require('./palette')) ? (PaletteElement != null ? PaletteElement : PaletteElement = require('./palette-element'), element = new PaletteElement) : void 0;
      if (element != null) {
        element.setModel(model);
      }
      return element;
    },
    shouldDisplayContextMenu: function(event) {
      this.lastEvent = event;
      setTimeout(((function(_this) {
        return function() {
          return _this.lastEvent = null;
        };
      })(this)), 10);
      return this.colorMarkerForMouseEvent(event) != null;
    },
    colorMarkerForMouseEvent: function(event) {
      var colorBuffer, colorBufferElement, editor;
      editor = atom.workspace.getActiveTextEditor();
      colorBuffer = this.project.colorBufferForEditor(editor);
      colorBufferElement = atom.views.getView(colorBuffer);
      return colorBufferElement != null ? colorBufferElement.colorMarkerForMouseEvent(event) : void 0;
    },
    serialize: function() {
      return {
        project: this.project.serialize()
      };
    },
    getProject: function() {
      return this.project;
    },
    findColors: function() {
      var pane;
      if (uris == null) {
        uris = require('./uris');
      }
      pane = atom.workspace.paneForURI(uris.SEARCH);
      pane || (pane = atom.workspace.getActivePane());
      return atom.workspace.openURIInPane(uris.SEARCH, pane, {});
    },
    showPalette: function() {
      if (uris == null) {
        uris = require('./uris');
      }
      return this.project.initialize().then(function() {
        var pane;
        pane = atom.workspace.paneForURI(uris.PALETTE);
        pane || (pane = atom.workspace.getActivePane());
        return atom.workspace.openURIInPane(uris.PALETTE, pane, {});
      })["catch"](function(reason) {
        return console.error(reason);
      });
    },
    showSettings: function() {
      if (uris == null) {
        uris = require('./uris');
      }
      return this.project.initialize().then(function() {
        var pane;
        pane = atom.workspace.paneForURI(uris.SETTINGS);
        pane || (pane = atom.workspace.getActivePane());
        return atom.workspace.openURIInPane(uris.SETTINGS, pane, {});
      })["catch"](function(reason) {
        return console.error(reason);
      });
    },
    reloadProjectVariables: function() {
      return this.project.reload();
    },
    createPigmentsReport: function() {
      return atom.workspace.open('pigments-report.json').then((function(_this) {
        return function(editor) {
          return editor.setText(_this.createReport());
        };
      })(this));
    },
    createReport: function() {
      var o;
      o = {
        atom: atom.getVersion(),
        pigments: atom.packages.getLoadedPackage('pigments').metadata.version,
        platform: require('os').platform(),
        config: atom.config.get('pigments'),
        project: {
          config: {
            sourceNames: this.project.sourceNames,
            searchNames: this.project.searchNames,
            ignoredNames: this.project.ignoredNames,
            ignoredScopes: this.project.ignoredScopes,
            includeThemes: this.project.includeThemes,
            ignoreGlobalSourceNames: this.project.ignoreGlobalSourceNames,
            ignoreGlobalSearchNames: this.project.ignoreGlobalSearchNames,
            ignoreGlobalIgnoredNames: this.project.ignoreGlobalIgnoredNames,
            ignoreGlobalIgnoredScopes: this.project.ignoreGlobalIgnoredScopes
          },
          paths: this.project.getPaths(),
          variables: {
            colors: this.project.getColorVariables().length,
            total: this.project.getVariables().length
          }
        }
      };
      return JSON.stringify(o, null, 2).replace(RegExp("" + (atom.project.getPaths().join('|')), "g"), '<root>');
    },
    patchAtom: function() {
      var getModuleFromNodeCache, getModuleFromSnapshotCache, requireCore;
      getModuleFromNodeCache = function(name) {
        var modulePath;
        modulePath = Object.keys(require.cache).filter(function(s) {
          return s.indexOf(name) > -1;
        })[0];
        return require.cache[modulePath];
      };
      getModuleFromSnapshotCache = function(name) {
        var modulePath;
        if (typeof snapshotResult === 'undefined') {
          return null;
        } else {
          modulePath = Object.keys(snapshotResult.customRequire.cache).filter(function(s) {
            return s.indexOf(name) > -1;
          })[0];
          return snapshotResult.customRequire.cache[modulePath];
        }
      };
      return requireCore = function(name) {
        var module, ref1;
        module = (ref1 = getModuleFromNodeCache(name)) != null ? ref1 : getModuleFromSnapshotCache(name);
        if (module != null) {
          return module.exports;
        } else {
          throw new Error("Cannot find '" + name + "' in the require cache.");
        }
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvbGliL3BpZ21lbnRzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFTSSxFQVRKLEVBQ0UsZ0JBREYsRUFDVyx1QkFEWCxFQUVFLG9CQUZGLEVBRWUsNEJBRmYsRUFHRSxxQkFIRixFQUdnQiw0QkFIaEIsRUFJRSxvQkFKRixFQUllLDJCQUpmLEVBS0Usb0JBTEYsRUFNRSw0QkFORixFQU11QiwwQkFOdkIsRUFNeUMscUJBTnpDLEVBT0Usb0JBUEYsRUFRRSxhQVJGLEVBUU87O0VBR1AsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7QUFDUixVQUFBOztRQUFBLGVBQWdCLE9BQUEsQ0FBUSxpQkFBUjs7TUFFaEIsSUFBQyxDQUFBLFNBQUQsQ0FBQTtNQUVBLElBQUMsQ0FBQSxPQUFELEdBQWMscUJBQUgsR0FDVCxZQUFZLENBQUMsV0FBYixDQUF5QixLQUFLLENBQUMsT0FBL0IsQ0FEUyxHQUdMLElBQUEsWUFBQSxDQUFBO01BRU4sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUNFO1FBQUEsc0JBQUEsRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsVUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhCO1FBQ0EsdUJBQUEsRUFBeUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsV0FBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRHpCO1FBRUEsMkJBQUEsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsWUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRjdCO1FBR0EsaUJBQUEsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsc0JBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUhuQjtRQUlBLGlCQUFBLEVBQW1CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLG9CQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKbkI7T0FERjtNQU9BLGFBQUEsR0FBZ0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7aUJBQVksU0FBQyxLQUFEO0FBQzFCLGdCQUFBO1lBQUEsSUFBRyx1QkFBSDtjQUNFLE1BQUEsQ0FBTyxLQUFDLENBQUEsd0JBQUQsQ0FBMEIsS0FBQyxDQUFBLFNBQTNCLENBQVAsRUFERjthQUFBLE1BQUE7Y0FHRSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO2NBQ1QsV0FBQSxHQUFjLEtBQUMsQ0FBQSxPQUFPLENBQUMsb0JBQVQsQ0FBOEIsTUFBOUI7Y0FFZCxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsT0FBcEIsQ0FBNEIsU0FBQyxNQUFEO0FBQzFCLG9CQUFBO2dCQUFBLE1BQUEsR0FBUyxXQUFXLENBQUMsOEJBQVosQ0FBMkMsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBM0M7dUJBQ1QsTUFBQSxDQUFPLE1BQVA7Y0FGMEIsQ0FBNUIsRUFORjs7bUJBVUEsS0FBQyxDQUFBLFNBQUQsR0FBYTtVQVhhO1FBQVo7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BYWhCLFVBQUEsR0FBYSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFBWSxTQUFDLEtBQUQ7QUFDdkIsZ0JBQUE7WUFBQSxJQUFHLHVCQUFIO2NBQ0UsTUFBQSxDQUFPLEtBQUMsQ0FBQSx3QkFBRCxDQUEwQixLQUFDLENBQUEsU0FBM0IsQ0FBUCxFQURGO2FBQUEsTUFBQTtjQUdFLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7Y0FDVCxXQUFBLEdBQWMsS0FBQyxDQUFBLE9BQU8sQ0FBQyxvQkFBVCxDQUE4QixNQUE5QjtjQUNkLE1BQUEsR0FBUyxNQUFNLENBQUMsYUFBUCxDQUFBO2NBQ1QsTUFBQSxHQUFTLFdBQVcsQ0FBQyw4QkFBWixDQUEyQyxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUEzQztjQUNULE1BQUEsQ0FBTyxNQUFQLEVBUEY7O21CQVNBLEtBQUMsQ0FBQSxTQUFELEdBQWE7VUFWVTtRQUFaO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQVliLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixrQkFBbEIsRUFDRTtRQUFBLHlCQUFBLEVBQTJCLGFBQUEsQ0FBYyxTQUFDLE1BQUQ7VUFDdkMsSUFBZ0MsY0FBaEM7bUJBQUEsTUFBTSxDQUFDLG1CQUFQLENBQUEsRUFBQTs7UUFEdUMsQ0FBZCxDQUEzQjtRQUdBLHlCQUFBLEVBQTJCLGFBQUEsQ0FBYyxTQUFDLE1BQUQ7VUFDdkMsSUFBZ0MsY0FBaEM7bUJBQUEsTUFBTSxDQUFDLG1CQUFQLENBQUEsRUFBQTs7UUFEdUMsQ0FBZCxDQUgzQjtRQU1BLDBCQUFBLEVBQTRCLGFBQUEsQ0FBYyxTQUFDLE1BQUQ7VUFDeEMsSUFBaUMsY0FBakM7bUJBQUEsTUFBTSxDQUFDLG9CQUFQLENBQUEsRUFBQTs7UUFEd0MsQ0FBZCxDQU41QjtRQVNBLHlCQUFBLEVBQTJCLGFBQUEsQ0FBYyxTQUFDLE1BQUQ7VUFDdkMsSUFBZ0MsY0FBaEM7bUJBQUEsTUFBTSxDQUFDLG1CQUFQLENBQUEsRUFBQTs7UUFEdUMsQ0FBZCxDQVQzQjtRQVlBLDBCQUFBLEVBQTRCLGFBQUEsQ0FBYyxTQUFDLE1BQUQ7VUFDeEMsSUFBaUMsY0FBakM7bUJBQUEsTUFBTSxDQUFDLG9CQUFQLENBQUEsRUFBQTs7UUFEd0MsQ0FBZCxDQVo1QjtRQWVBLHNCQUFBLEVBQXdCLFVBQUEsQ0FBVyxTQUFDLE1BQUQ7VUFDakMsSUFBNkIsY0FBN0I7bUJBQUEsTUFBTSxDQUFDLGdCQUFQLENBQUEsRUFBQTs7UUFEaUMsQ0FBWCxDQWZ4QjtRQWtCQSxzQkFBQSxFQUF3QixVQUFBLENBQVcsU0FBQyxNQUFEO1VBQ2pDLElBQTZCLGNBQTdCO21CQUFBLE1BQU0sQ0FBQyxnQkFBUCxDQUFBLEVBQUE7O1FBRGlDLENBQVgsQ0FsQnhCO1FBcUJBLHVCQUFBLEVBQXlCLFVBQUEsQ0FBVyxTQUFDLE1BQUQ7VUFDbEMsSUFBOEIsY0FBOUI7bUJBQUEsTUFBTSxDQUFDLGlCQUFQLENBQUEsRUFBQTs7UUFEa0MsQ0FBWCxDQXJCekI7UUF3QkEsc0JBQUEsRUFBd0IsVUFBQSxDQUFXLFNBQUMsTUFBRDtVQUNqQyxJQUE2QixjQUE3QjttQkFBQSxNQUFNLENBQUMsZ0JBQVAsQ0FBQSxFQUFBOztRQURpQyxDQUFYLENBeEJ4QjtRQTJCQSx1QkFBQSxFQUF5QixVQUFBLENBQVcsU0FBQyxNQUFEO1VBQ2xDLElBQThCLGNBQTlCO21CQUFBLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLEVBQUE7O1FBRGtDLENBQVgsQ0EzQnpCO09BREY7TUErQkEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxTQUFEO0FBQ3ZCLGNBQUE7VUFBQSxRQUFBLE1BQVEsT0FBQSxDQUFRLEtBQVI7VUFFUixPQUFtQixHQUFHLENBQUMsS0FBSixDQUFVLFNBQVYsQ0FBbkIsRUFBQyx3QkFBRCxFQUFXO1VBQ1gsSUFBYyxRQUFBLEtBQVksV0FBMUI7QUFBQSxtQkFBQTs7QUFFQSxrQkFBTyxJQUFQO0FBQUEsaUJBQ08sUUFEUDtxQkFDcUIsS0FBQyxDQUFBLE9BQU8sQ0FBQyxhQUFULENBQUE7QUFEckIsaUJBRU8sU0FGUDtxQkFFc0IsS0FBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULENBQUE7QUFGdEIsaUJBR08sVUFIUDtxQkFHdUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLEtBQUMsQ0FBQSxPQUFwQjtBQUh2QjtRQU51QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7YUFXQSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQWpCLENBQ0U7UUFBQSxrQkFBQSxFQUFvQjtVQUFDO1lBQ25CLEtBQUEsRUFBTyxVQURZO1lBRW5CLE9BQUEsRUFBUztjQUNQO2dCQUFDLEtBQUEsRUFBTyx3QkFBUjtnQkFBa0MsT0FBQSxFQUFTLHlCQUEzQztlQURPLEVBRVA7Z0JBQUMsS0FBQSxFQUFPLGdCQUFSO2dCQUEwQixPQUFBLEVBQVMseUJBQW5DO2VBRk8sRUFHUDtnQkFBQyxLQUFBLEVBQU8saUJBQVI7Z0JBQTJCLE9BQUEsRUFBUywwQkFBcEM7ZUFITyxFQUlQO2dCQUFDLEtBQUEsRUFBTyxnQkFBUjtnQkFBMEIsT0FBQSxFQUFTLHlCQUFuQztlQUpPLEVBS1A7Z0JBQUMsS0FBQSxFQUFPLGlCQUFSO2dCQUEyQixPQUFBLEVBQVMsMEJBQXBDO2VBTE8sRUFNUDtnQkFBQyxJQUFBLEVBQU0sV0FBUDtlQU5PLEVBT1A7Z0JBQUMsS0FBQSxFQUFPLHFCQUFSO2dCQUErQixPQUFBLEVBQVMsc0JBQXhDO2VBUE8sRUFRUDtnQkFBQyxLQUFBLEVBQU8sYUFBUjtnQkFBdUIsT0FBQSxFQUFTLHNCQUFoQztlQVJPLEVBU1A7Z0JBQUMsS0FBQSxFQUFPLGNBQVI7Z0JBQXdCLE9BQUEsRUFBUyx1QkFBakM7ZUFUTyxFQVVQO2dCQUFDLEtBQUEsRUFBTyxhQUFSO2dCQUF1QixPQUFBLEVBQVMsc0JBQWhDO2VBVk8sRUFXUDtnQkFBQyxLQUFBLEVBQU8sY0FBUjtnQkFBd0IsT0FBQSxFQUFTLHVCQUFqQztlQVhPO2FBRlU7WUFlbkIsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO3FCQUFBLFNBQUMsS0FBRDt1QkFBVyxLQUFDLENBQUEsd0JBQUQsQ0FBMEIsS0FBMUI7Y0FBWDtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FmSTtXQUFEO1NBQXBCO09BREY7SUFwRlEsQ0FBVjtJQXVHQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7MkZBQWEsQ0FBRTtJQURMLENBdkdaO0lBMEdBLG1CQUFBLEVBQXFCLFNBQUE7O1FBQ25CLG1CQUFvQixPQUFBLENBQVEscUJBQVI7O2FBQ2hCLElBQUEsZ0JBQUEsQ0FBaUIsSUFBakI7SUFGZSxDQTFHckI7SUE4R0EsVUFBQSxFQUFZLFNBQUE7O1FBQ1YsY0FBZSxPQUFBLENBQVEsZ0JBQVI7O2FBQ1gsSUFBQSxXQUFBLENBQVksSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFaO0lBRk0sQ0E5R1o7SUFrSEEsa0JBQUEsRUFBb0IsU0FBQyxHQUFEOztRQUNsQixhQUFjLE9BQUEsQ0FBUSxNQUFSLENBQWUsQ0FBQzs7TUFFOUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsaUJBQWQsQ0FBZ0MsR0FBaEM7YUFFSSxJQUFBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ2IsS0FBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsaUJBQWQsQ0FBZ0MsSUFBaEM7UUFEYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWDtJQUxjLENBbEhwQjtJQTBIQSx1QkFBQSxFQUF5QixTQUFDLE9BQUQ7QUFDdkIsVUFBQTs7UUFEd0IsVUFBUTs7O1FBQ2hDLGFBQWMsT0FBQSxDQUFRLE1BQVIsQ0FBZSxDQUFDOztNQUU5QixRQUFBLEdBQVcsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsMkJBQWQsQ0FBQTtNQUVYLElBQUcsMkJBQUg7UUFDRSxLQUFBLEdBQVEsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFwQixDQUF3QixTQUFDLENBQUQ7aUJBQU8sQ0FBQyxDQUFDO1FBQVQsQ0FBeEI7UUFDUixRQUFRLENBQUMsaUJBQVQsQ0FBMkIsT0FBTyxDQUFDLFdBQW5DO2VBRUksSUFBQSxVQUFBLENBQVcsU0FBQTtBQUFHLGNBQUE7QUFBQTtlQUFBLHVDQUFBOzt5QkFBQSxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsSUFBMUI7QUFBQTs7UUFBSCxDQUFYLEVBSk47T0FBQSxNQUFBO1FBTUcsbUJBQUQsRUFBTyxtQ0FBUCxFQUFxQix1QkFBckIsRUFBNkIsdUJBQTdCLEVBQXFDO1FBQ3JDLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixJQUExQixFQUFnQyxZQUFoQyxFQUE4QyxRQUE5QyxFQUF3RCxNQUF4RCxFQUFnRSxNQUFoRTtlQUVJLElBQUEsVUFBQSxDQUFXLFNBQUE7aUJBQUcsUUFBUSxDQUFDLGdCQUFULENBQTBCLElBQTFCO1FBQUgsQ0FBWCxFQVROOztJQUx1QixDQTFIekI7SUEwSUEsMEJBQUEsRUFBNEIsU0FBQyxPQUFEO0FBQzFCLFVBQUE7O1FBRDJCLFVBQVE7OztRQUNuQyxhQUFjLE9BQUEsQ0FBUSxNQUFSLENBQWUsQ0FBQzs7TUFFOUIsUUFBQSxHQUFXLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYSxDQUFDLDhCQUFkLENBQUE7TUFFWCxJQUFHLDJCQUFIO1FBQ0UsS0FBQSxHQUFRLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxDQUFEO2lCQUFPLENBQUMsQ0FBQztRQUFULENBQXhCO1FBQ1IsUUFBUSxDQUFDLGlCQUFULENBQTJCLE9BQU8sQ0FBQyxXQUFuQztlQUVJLElBQUEsVUFBQSxDQUFXLFNBQUE7QUFBRyxjQUFBO0FBQUE7ZUFBQSx1Q0FBQTs7eUJBQUEsUUFBUSxDQUFDLGdCQUFULENBQTBCLElBQTFCO0FBQUE7O1FBQUgsQ0FBWCxFQUpOO09BQUEsTUFBQTtRQU1HLG1CQUFELEVBQU8sbUNBQVAsRUFBcUIsdUJBQXJCLEVBQTZCLHVCQUE3QixFQUFxQztRQUNyQyxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsSUFBMUIsRUFBZ0MsWUFBaEMsRUFBOEMsUUFBOUMsRUFBd0QsTUFBeEQsRUFBZ0UsTUFBaEU7ZUFFSSxJQUFBLFVBQUEsQ0FBVyxTQUFBO2lCQUFHLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixJQUExQjtRQUFILENBQVgsRUFUTjs7SUFMMEIsQ0ExSTVCO0lBMEpBLGtCQUFBLEVBQW9CLFNBQUMsS0FBRDs7UUFDbEIsVUFBVyxPQUFBLENBQVEsV0FBUjs7YUFDWCxPQUFPLENBQUMsV0FBUixDQUFvQixLQUFwQjtJQUZrQixDQTFKcEI7SUE4SkEsc0JBQUEsRUFBd0IsU0FBQyxLQUFEOztRQUN0QixjQUFlLE9BQUEsQ0FBUSxnQkFBUjs7YUFDZixXQUFXLENBQUMsV0FBWixDQUF3QixLQUF4QjtJQUZzQixDQTlKeEI7SUFrS0EsdUJBQUEsRUFBeUIsU0FBQyxLQUFEOztRQUN2QixlQUFnQixPQUFBLENBQVEsaUJBQVI7O2FBQ2hCLFlBQVksQ0FBQyxXQUFiLENBQXlCLEtBQXpCO0lBRnVCLENBbEt6QjtJQXNLQSw4QkFBQSxFQUFnQyxTQUFDLEtBQUQ7QUFDOUIsVUFBQTs7UUFBQSxzQkFBdUIsT0FBQSxDQUFRLHlCQUFSOztNQUN2QixPQUFBLEdBQVUsSUFBSTtNQUVkLElBQUcsb0JBQUg7UUFDRSxPQUFPLENBQUMsUUFBUixDQUFpQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWpCLEVBREY7T0FBQSxNQUFBO1FBR0UsWUFBQSxHQUFlLElBQUksQ0FBQyxRQUFRLENBQUMsb0JBQWQsQ0FBbUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxHQUFEO1lBQ2hELElBQUcsR0FBRyxDQUFDLElBQUosS0FBWSxVQUFmO2NBQ0UsWUFBWSxDQUFDLE9BQWIsQ0FBQTtxQkFDQSxPQUFPLENBQUMsUUFBUixDQUFpQixLQUFDLENBQUEsVUFBRCxDQUFBLENBQWpCLEVBRkY7O1VBRGdEO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQyxFQUhqQjs7YUFRQTtJQVo4QixDQXRLaEM7SUFvTEEsOEJBQUEsRUFBZ0MsU0FBQyxLQUFEOztRQUM5QixzQkFBdUIsT0FBQSxDQUFRLHdCQUFSOzthQUN2QixtQkFBbUIsQ0FBQyxXQUFwQixDQUFnQyxLQUFoQztJQUY4QixDQXBMaEM7SUF3TEEsb0JBQUEsRUFBc0IsU0FBQyxLQUFEO0FBQ3BCLFVBQUE7TUFBQSxPQUFBLEdBQWEsS0FBQSxZQUFpQix1QkFBQyxjQUFBLGNBQWUsT0FBQSxDQUFRLGdCQUFSLENBQWhCLENBQXBCLEdBQ1IsOEJBQUEscUJBQUEscUJBQXNCLE9BQUEsQ0FBUSx3QkFBUixDQUF0QixFQUNBLE9BQUEsR0FBVSxJQUFJLGtCQURkLENBRFEsR0FHRixLQUFBLFlBQWlCLHVCQUFDLGNBQUEsY0FBZSxPQUFBLENBQVEsZ0JBQVIsQ0FBaEIsQ0FBcEIsR0FDSCwrQkFBQSxzQkFBQSxzQkFBdUIsT0FBQSxDQUFRLHlCQUFSLENBQXZCLEVBQ0EsT0FBQSxHQUFVLElBQUksbUJBRGQsQ0FERyxHQUdHLEtBQUEsWUFBaUIsd0JBQUMsZUFBQSxlQUFnQixPQUFBLENBQVEsaUJBQVIsQ0FBakIsQ0FBcEIsR0FDSCwrQkFBQSxzQkFBQSxzQkFBdUIsT0FBQSxDQUFRLHlCQUFSLENBQXZCLEVBQ0EsT0FBQSxHQUFVLElBQUksbUJBRGQsQ0FERyxHQUdHLEtBQUEsWUFBaUIsbUJBQUMsVUFBQSxVQUFXLE9BQUEsQ0FBUSxXQUFSLENBQVosQ0FBcEIsR0FDSCwwQkFBQSxpQkFBQSxpQkFBa0IsT0FBQSxDQUFRLG1CQUFSLENBQWxCLEVBQ0EsT0FBQSxHQUFVLElBQUksY0FEZCxDQURHLEdBQUE7TUFJTCxJQUEyQixlQUEzQjtRQUFBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLEVBQUE7O2FBQ0E7SUFmb0IsQ0F4THRCO0lBeU1BLHdCQUFBLEVBQTBCLFNBQUMsS0FBRDtNQUN4QixJQUFDLENBQUEsU0FBRCxHQUFhO01BQ2IsVUFBQSxDQUFXLENBQUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxTQUFELEdBQWE7UUFBaEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUQsQ0FBWCxFQUFtQyxFQUFuQzthQUNBO0lBSHdCLENBek0xQjtJQThNQSx3QkFBQSxFQUEwQixTQUFDLEtBQUQ7QUFDeEIsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7TUFDVCxXQUFBLEdBQWMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxvQkFBVCxDQUE4QixNQUE5QjtNQUNkLGtCQUFBLEdBQXFCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixXQUFuQjswQ0FDckIsa0JBQWtCLENBQUUsd0JBQXBCLENBQTZDLEtBQTdDO0lBSndCLENBOU0xQjtJQW9OQSxTQUFBLEVBQVcsU0FBQTthQUFHO1FBQUMsT0FBQSxFQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBVCxDQUFBLENBQVY7O0lBQUgsQ0FwTlg7SUFzTkEsVUFBQSxFQUFZLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSixDQXROWjtJQXdOQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7O1FBQUEsT0FBUSxPQUFBLENBQVEsUUFBUjs7TUFFUixJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFmLENBQTBCLElBQUksQ0FBQyxNQUEvQjtNQUNQLFNBQUEsT0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQTthQUVULElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUE2QixJQUFJLENBQUMsTUFBbEMsRUFBMEMsSUFBMUMsRUFBZ0QsRUFBaEQ7SUFOVSxDQXhOWjtJQWdPQSxXQUFBLEVBQWEsU0FBQTs7UUFDWCxPQUFRLE9BQUEsQ0FBUSxRQUFSOzthQUVSLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVCxDQUFBLENBQXFCLENBQUMsSUFBdEIsQ0FBMkIsU0FBQTtBQUN6QixZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBZixDQUEwQixJQUFJLENBQUMsT0FBL0I7UUFDUCxTQUFBLE9BQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUE7ZUFFVCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkIsSUFBSSxDQUFDLE9BQWxDLEVBQTJDLElBQTNDLEVBQWlELEVBQWpEO01BSnlCLENBQTNCLENBS0EsRUFBQyxLQUFELEVBTEEsQ0FLTyxTQUFDLE1BQUQ7ZUFDTCxPQUFPLENBQUMsS0FBUixDQUFjLE1BQWQ7TUFESyxDQUxQO0lBSFcsQ0FoT2I7SUEyT0EsWUFBQSxFQUFjLFNBQUE7O1FBQ1osT0FBUSxPQUFBLENBQVEsUUFBUjs7YUFFUixJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBQSxDQUFxQixDQUFDLElBQXRCLENBQTJCLFNBQUE7QUFDekIsWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQWYsQ0FBMEIsSUFBSSxDQUFDLFFBQS9CO1FBQ1AsU0FBQSxPQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUFBO2VBRVQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCLElBQUksQ0FBQyxRQUFsQyxFQUE0QyxJQUE1QyxFQUFrRCxFQUFsRDtNQUp5QixDQUEzQixDQUtBLEVBQUMsS0FBRCxFQUxBLENBS08sU0FBQyxNQUFEO2VBQ0wsT0FBTyxDQUFDLEtBQVIsQ0FBYyxNQUFkO01BREssQ0FMUDtJQUhZLENBM09kO0lBc1BBLHNCQUFBLEVBQXdCLFNBQUE7YUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBQTtJQUFILENBdFB4QjtJQXdQQSxvQkFBQSxFQUFzQixTQUFBO2FBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixzQkFBcEIsQ0FBMkMsQ0FBQyxJQUE1QyxDQUFpRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFDL0MsTUFBTSxDQUFDLE9BQVAsQ0FBZSxLQUFDLENBQUEsWUFBRCxDQUFBLENBQWY7UUFEK0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpEO0lBRG9CLENBeFB0QjtJQTRQQSxZQUFBLEVBQWMsU0FBQTtBQUNaLFVBQUE7TUFBQSxDQUFBLEdBQ0U7UUFBQSxJQUFBLEVBQU0sSUFBSSxDQUFDLFVBQUwsQ0FBQSxDQUFOO1FBQ0EsUUFBQSxFQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsVUFBL0IsQ0FBMEMsQ0FBQyxRQUFRLENBQUMsT0FEOUQ7UUFFQSxRQUFBLEVBQVUsT0FBQSxDQUFRLElBQVIsQ0FBYSxDQUFDLFFBQWQsQ0FBQSxDQUZWO1FBR0EsTUFBQSxFQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixVQUFoQixDQUhSO1FBSUEsT0FBQSxFQUNFO1VBQUEsTUFBQSxFQUNFO1lBQUEsV0FBQSxFQUFhLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBdEI7WUFDQSxXQUFBLEVBQWEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUR0QjtZQUVBLFlBQUEsRUFBYyxJQUFDLENBQUEsT0FBTyxDQUFDLFlBRnZCO1lBR0EsYUFBQSxFQUFlLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFIeEI7WUFJQSxhQUFBLEVBQWUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUp4QjtZQUtBLHVCQUFBLEVBQXlCLElBQUMsQ0FBQSxPQUFPLENBQUMsdUJBTGxDO1lBTUEsdUJBQUEsRUFBeUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyx1QkFObEM7WUFPQSx3QkFBQSxFQUEwQixJQUFDLENBQUEsT0FBTyxDQUFDLHdCQVBuQztZQVFBLHlCQUFBLEVBQTJCLElBQUMsQ0FBQSxPQUFPLENBQUMseUJBUnBDO1dBREY7VUFVQSxLQUFBLEVBQU8sSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULENBQUEsQ0FWUDtVQVdBLFNBQUEsRUFDRTtZQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLGlCQUFULENBQUEsQ0FBNEIsQ0FBQyxNQUFyQztZQUNBLEtBQUEsRUFBTyxJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVQsQ0FBQSxDQUF1QixDQUFDLE1BRC9CO1dBWkY7U0FMRjs7YUFvQkYsSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLElBQWxCLEVBQXdCLENBQXhCLENBQ0EsQ0FBQyxPQURELENBQ1MsTUFBQSxDQUFBLEVBQUEsR0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBYixDQUFBLENBQXVCLENBQUMsSUFBeEIsQ0FBNkIsR0FBN0IsQ0FBRCxDQUFKLEVBQTBDLEdBQTFDLENBRFQsRUFDc0QsUUFEdEQ7SUF0QlksQ0E1UGQ7SUFxUkEsU0FBQSxFQUFXLFNBQUE7QUFDVCxVQUFBO01BQUEsc0JBQUEsR0FBeUIsU0FBQyxJQUFEO0FBQ3ZCLFlBQUE7UUFBQSxVQUFBLEdBQWEsTUFBTSxDQUFDLElBQVAsQ0FBWSxPQUFPLENBQUMsS0FBcEIsQ0FBMEIsQ0FBQyxNQUEzQixDQUFrQyxTQUFDLENBQUQ7aUJBQU8sQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFWLENBQUEsR0FBa0IsQ0FBQztRQUExQixDQUFsQyxDQUErRCxDQUFBLENBQUE7ZUFDNUUsT0FBTyxDQUFDLEtBQU0sQ0FBQSxVQUFBO01BRlM7TUFJekIsMEJBQUEsR0FBNkIsU0FBQyxJQUFEO0FBQzNCLFlBQUE7UUFBQSxJQUFHLE9BQU8sY0FBUCxLQUF5QixXQUE1QjtpQkFDRSxLQURGO1NBQUEsTUFBQTtVQUdFLFVBQUEsR0FBYSxNQUFNLENBQUMsSUFBUCxDQUFZLGNBQWMsQ0FBQyxhQUFhLENBQUMsS0FBekMsQ0FBK0MsQ0FBQyxNQUFoRCxDQUF1RCxTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFWLENBQUEsR0FBa0IsQ0FBQztVQUExQixDQUF2RCxDQUFvRixDQUFBLENBQUE7aUJBQ2pHLGNBQWMsQ0FBQyxhQUFhLENBQUMsS0FBTSxDQUFBLFVBQUEsRUFKckM7O01BRDJCO2FBTzdCLFdBQUEsR0FBYyxTQUFDLElBQUQ7QUFDWixZQUFBO1FBQUEsTUFBQSwwREFBd0MsMEJBQUEsQ0FBMkIsSUFBM0I7UUFDeEMsSUFBRyxjQUFIO2lCQUNFLE1BQU0sQ0FBQyxRQURUO1NBQUEsTUFBQTtBQUdFLGdCQUFVLElBQUEsS0FBQSxDQUFNLGVBQUEsR0FBZ0IsSUFBaEIsR0FBcUIseUJBQTNCLEVBSFo7O01BRlk7SUFaTCxDQXJSWDs7QUFaRiIsInNvdXJjZXNDb250ZW50IjpbIltcbiAgUGFsZXR0ZSwgUGFsZXR0ZUVsZW1lbnQsXG4gIENvbG9yU2VhcmNoLCBDb2xvclJlc3VsdHNFbGVtZW50LFxuICBDb2xvclByb2plY3QsIENvbG9yUHJvamVjdEVsZW1lbnQsXG4gIENvbG9yQnVmZmVyLCBDb2xvckJ1ZmZlckVsZW1lbnQsXG4gIENvbG9yTWFya2VyLFxuICBWYXJpYWJsZXNDb2xsZWN0aW9uLCBQaWdtZW50c1Byb3ZpZGVyLCBQaWdtZW50c0FQSSxcbiAgRGlzcG9zYWJsZSxcbiAgdXJsLCB1cmlzXG5dID0gW11cblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIENvbG9yUHJvamVjdCA/PSByZXF1aXJlICcuL2NvbG9yLXByb2plY3QnXG5cbiAgICBAcGF0Y2hBdG9tKClcblxuICAgIEBwcm9qZWN0ID0gaWYgc3RhdGUucHJvamVjdD9cbiAgICAgIENvbG9yUHJvamVjdC5kZXNlcmlhbGl6ZShzdGF0ZS5wcm9qZWN0KVxuICAgIGVsc2VcbiAgICAgIG5ldyBDb2xvclByb2plY3QoKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICdwaWdtZW50czpmaW5kLWNvbG9ycyc6ID0+IEBmaW5kQ29sb3JzKClcbiAgICAgICdwaWdtZW50czpzaG93LXBhbGV0dGUnOiA9PiBAc2hvd1BhbGV0dGUoKVxuICAgICAgJ3BpZ21lbnRzOnByb2plY3Qtc2V0dGluZ3MnOiA9PiBAc2hvd1NldHRpbmdzKClcbiAgICAgICdwaWdtZW50czpyZWxvYWQnOiA9PiBAcmVsb2FkUHJvamVjdFZhcmlhYmxlcygpXG4gICAgICAncGlnbWVudHM6cmVwb3J0JzogPT4gQGNyZWF0ZVBpZ21lbnRzUmVwb3J0KClcblxuICAgIGNvbnZlcnRNZXRob2QgPSAoYWN0aW9uKSA9PiAoZXZlbnQpID0+XG4gICAgICBpZiBAbGFzdEV2ZW50P1xuICAgICAgICBhY3Rpb24gQGNvbG9yTWFya2VyRm9yTW91c2VFdmVudChAbGFzdEV2ZW50KVxuICAgICAgZWxzZVxuICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgY29sb3JCdWZmZXIgPSBAcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG5cbiAgICAgICAgZWRpdG9yLmdldEN1cnNvcnMoKS5mb3JFYWNoIChjdXJzb3IpID0+XG4gICAgICAgICAgbWFya2VyID0gY29sb3JCdWZmZXIuZ2V0Q29sb3JNYXJrZXJBdEJ1ZmZlclBvc2l0aW9uKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICAgIGFjdGlvbihtYXJrZXIpXG5cbiAgICAgIEBsYXN0RXZlbnQgPSBudWxsXG5cbiAgICBjb3B5TWV0aG9kID0gKGFjdGlvbikgPT4gKGV2ZW50KSA9PlxuICAgICAgaWYgQGxhc3RFdmVudD9cbiAgICAgICAgYWN0aW9uIEBjb2xvck1hcmtlckZvck1vdXNlRXZlbnQoQGxhc3RFdmVudClcbiAgICAgIGVsc2VcbiAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICAgIGNvbG9yQnVmZmVyID0gQHByb2plY3QuY29sb3JCdWZmZXJGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgICAgIG1hcmtlciA9IGNvbG9yQnVmZmVyLmdldENvbG9yTWFya2VyQXRCdWZmZXJQb3NpdGlvbihjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgYWN0aW9uKG1hcmtlcilcblxuICAgICAgQGxhc3RFdmVudCA9IG51bGxcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdwaWdtZW50czpjb252ZXJ0LXRvLWhleCc6IGNvbnZlcnRNZXRob2QgKG1hcmtlcikgLT5cbiAgICAgICAgbWFya2VyLmNvbnZlcnRDb250ZW50VG9IZXgoKSBpZiBtYXJrZXI/XG5cbiAgICAgICdwaWdtZW50czpjb252ZXJ0LXRvLXJnYic6IGNvbnZlcnRNZXRob2QgKG1hcmtlcikgLT5cbiAgICAgICAgbWFya2VyLmNvbnZlcnRDb250ZW50VG9SR0IoKSBpZiBtYXJrZXI/XG5cbiAgICAgICdwaWdtZW50czpjb252ZXJ0LXRvLXJnYmEnOiBjb252ZXJ0TWV0aG9kIChtYXJrZXIpIC0+XG4gICAgICAgIG1hcmtlci5jb252ZXJ0Q29udGVudFRvUkdCQSgpIGlmIG1hcmtlcj9cblxuICAgICAgJ3BpZ21lbnRzOmNvbnZlcnQtdG8taHNsJzogY29udmVydE1ldGhvZCAobWFya2VyKSAtPlxuICAgICAgICBtYXJrZXIuY29udmVydENvbnRlbnRUb0hTTCgpIGlmIG1hcmtlcj9cblxuICAgICAgJ3BpZ21lbnRzOmNvbnZlcnQtdG8taHNsYSc6IGNvbnZlcnRNZXRob2QgKG1hcmtlcikgLT5cbiAgICAgICAgbWFya2VyLmNvbnZlcnRDb250ZW50VG9IU0xBKCkgaWYgbWFya2VyP1xuXG4gICAgICAncGlnbWVudHM6Y29weS1hcy1oZXgnOiBjb3B5TWV0aG9kIChtYXJrZXIpIC0+XG4gICAgICAgIG1hcmtlci5jb3B5Q29udGVudEFzSGV4KCkgaWYgbWFya2VyP1xuXG4gICAgICAncGlnbWVudHM6Y29weS1hcy1yZ2InOiBjb3B5TWV0aG9kIChtYXJrZXIpIC0+XG4gICAgICAgIG1hcmtlci5jb3B5Q29udGVudEFzUkdCKCkgaWYgbWFya2VyP1xuXG4gICAgICAncGlnbWVudHM6Y29weS1hcy1yZ2JhJzogY29weU1ldGhvZCAobWFya2VyKSAtPlxuICAgICAgICBtYXJrZXIuY29weUNvbnRlbnRBc1JHQkEoKSBpZiBtYXJrZXI/XG5cbiAgICAgICdwaWdtZW50czpjb3B5LWFzLWhzbCc6IGNvcHlNZXRob2QgKG1hcmtlcikgLT5cbiAgICAgICAgbWFya2VyLmNvcHlDb250ZW50QXNIU0woKSBpZiBtYXJrZXI/XG5cbiAgICAgICdwaWdtZW50czpjb3B5LWFzLWhzbGEnOiBjb3B5TWV0aG9kIChtYXJrZXIpIC0+XG4gICAgICAgIG1hcmtlci5jb3B5Q29udGVudEFzSFNMQSgpIGlmIG1hcmtlcj9cblxuICAgIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lciAodXJpVG9PcGVuKSA9PlxuICAgICAgdXJsIHx8PSByZXF1aXJlICd1cmwnXG5cbiAgICAgIHtwcm90b2NvbCwgaG9zdH0gPSB1cmwucGFyc2UgdXJpVG9PcGVuXG4gICAgICByZXR1cm4gdW5sZXNzIHByb3RvY29sIGlzICdwaWdtZW50czonXG5cbiAgICAgIHN3aXRjaCBob3N0XG4gICAgICAgIHdoZW4gJ3NlYXJjaCcgdGhlbiBAcHJvamVjdC5maW5kQWxsQ29sb3JzKClcbiAgICAgICAgd2hlbiAncGFsZXR0ZScgdGhlbiBAcHJvamVjdC5nZXRQYWxldHRlKClcbiAgICAgICAgd2hlbiAnc2V0dGluZ3MnIHRoZW4gYXRvbS52aWV3cy5nZXRWaWV3KEBwcm9qZWN0KVxuXG4gICAgYXRvbS5jb250ZXh0TWVudS5hZGRcbiAgICAgICdhdG9tLXRleHQtZWRpdG9yJzogW3tcbiAgICAgICAgbGFiZWw6ICdQaWdtZW50cydcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgIHtsYWJlbDogJ0NvbnZlcnQgdG8gaGV4YWRlY2ltYWwnLCBjb21tYW5kOiAncGlnbWVudHM6Y29udmVydC10by1oZXgnfVxuICAgICAgICAgIHtsYWJlbDogJ0NvbnZlcnQgdG8gUkdCJywgY29tbWFuZDogJ3BpZ21lbnRzOmNvbnZlcnQtdG8tcmdiJ31cbiAgICAgICAgICB7bGFiZWw6ICdDb252ZXJ0IHRvIFJHQkEnLCBjb21tYW5kOiAncGlnbWVudHM6Y29udmVydC10by1yZ2JhJ31cbiAgICAgICAgICB7bGFiZWw6ICdDb252ZXJ0IHRvIEhTTCcsIGNvbW1hbmQ6ICdwaWdtZW50czpjb252ZXJ0LXRvLWhzbCd9XG4gICAgICAgICAge2xhYmVsOiAnQ29udmVydCB0byBIU0xBJywgY29tbWFuZDogJ3BpZ21lbnRzOmNvbnZlcnQtdG8taHNsYSd9XG4gICAgICAgICAge3R5cGU6ICdzZXBhcmF0b3InfVxuICAgICAgICAgIHtsYWJlbDogJ0NvcHkgYXMgaGV4YWRlY2ltYWwnLCBjb21tYW5kOiAncGlnbWVudHM6Y29weS1hcy1oZXgnfVxuICAgICAgICAgIHtsYWJlbDogJ0NvcHkgYXMgUkdCJywgY29tbWFuZDogJ3BpZ21lbnRzOmNvcHktYXMtcmdiJ31cbiAgICAgICAgICB7bGFiZWw6ICdDb3B5IGFzIFJHQkEnLCBjb21tYW5kOiAncGlnbWVudHM6Y29weS1hcy1yZ2JhJ31cbiAgICAgICAgICB7bGFiZWw6ICdDb3B5IGFzIEhTTCcsIGNvbW1hbmQ6ICdwaWdtZW50czpjb3B5LWFzLWhzbCd9XG4gICAgICAgICAge2xhYmVsOiAnQ29weSBhcyBIU0xBJywgY29tbWFuZDogJ3BpZ21lbnRzOmNvcHktYXMtaHNsYSd9XG4gICAgICAgIF1cbiAgICAgICAgc2hvdWxkRGlzcGxheTogKGV2ZW50KSA9PiBAc2hvdWxkRGlzcGxheUNvbnRleHRNZW51KGV2ZW50KVxuICAgICAgfV1cblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBnZXRQcm9qZWN0KCk/LmRlc3Ryb3k/KClcblxuICBwcm92aWRlQXV0b2NvbXBsZXRlOiAtPlxuICAgIFBpZ21lbnRzUHJvdmlkZXIgPz0gcmVxdWlyZSAnLi9waWdtZW50cy1wcm92aWRlcidcbiAgICBuZXcgUGlnbWVudHNQcm92aWRlcih0aGlzKVxuXG4gIHByb3ZpZGVBUEk6IC0+XG4gICAgUGlnbWVudHNBUEkgPz0gcmVxdWlyZSAnLi9waWdtZW50cy1hcGknXG4gICAgbmV3IFBpZ21lbnRzQVBJKEBnZXRQcm9qZWN0KCkpXG5cbiAgY29uc3VtZUNvbG9yUGlja2VyOiAoYXBpKSAtPlxuICAgIERpc3Bvc2FibGUgPz0gcmVxdWlyZSgnYXRvbScpLkRpc3Bvc2FibGVcblxuICAgIEBnZXRQcm9qZWN0KCkuc2V0Q29sb3JQaWNrZXJBUEkoYXBpKVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBnZXRQcm9qZWN0KCkuc2V0Q29sb3JQaWNrZXJBUEkobnVsbClcblxuICBjb25zdW1lQ29sb3JFeHByZXNzaW9uczogKG9wdGlvbnM9e30pIC0+XG4gICAgRGlzcG9zYWJsZSA/PSByZXF1aXJlKCdhdG9tJykuRGlzcG9zYWJsZVxuXG4gICAgcmVnaXN0cnkgPSBAZ2V0UHJvamVjdCgpLmdldENvbG9yRXhwcmVzc2lvbnNSZWdpc3RyeSgpXG5cbiAgICBpZiBvcHRpb25zLmV4cHJlc3Npb25zP1xuICAgICAgbmFtZXMgPSBvcHRpb25zLmV4cHJlc3Npb25zLm1hcCAoZSkgLT4gZS5uYW1lXG4gICAgICByZWdpc3RyeS5jcmVhdGVFeHByZXNzaW9ucyhvcHRpb25zLmV4cHJlc3Npb25zKVxuXG4gICAgICBuZXcgRGlzcG9zYWJsZSAtPiByZWdpc3RyeS5yZW1vdmVFeHByZXNzaW9uKG5hbWUpIGZvciBuYW1lIGluIG5hbWVzXG4gICAgZWxzZVxuICAgICAge25hbWUsIHJlZ2V4cFN0cmluZywgaGFuZGxlLCBzY29wZXMsIHByaW9yaXR5fSA9IG9wdGlvbnNcbiAgICAgIHJlZ2lzdHJ5LmNyZWF0ZUV4cHJlc3Npb24obmFtZSwgcmVnZXhwU3RyaW5nLCBwcmlvcml0eSwgc2NvcGVzLCBoYW5kbGUpXG5cbiAgICAgIG5ldyBEaXNwb3NhYmxlIC0+IHJlZ2lzdHJ5LnJlbW92ZUV4cHJlc3Npb24obmFtZSlcblxuICBjb25zdW1lVmFyaWFibGVFeHByZXNzaW9uczogKG9wdGlvbnM9e30pIC0+XG4gICAgRGlzcG9zYWJsZSA/PSByZXF1aXJlKCdhdG9tJykuRGlzcG9zYWJsZVxuXG4gICAgcmVnaXN0cnkgPSBAZ2V0UHJvamVjdCgpLmdldFZhcmlhYmxlRXhwcmVzc2lvbnNSZWdpc3RyeSgpXG5cbiAgICBpZiBvcHRpb25zLmV4cHJlc3Npb25zP1xuICAgICAgbmFtZXMgPSBvcHRpb25zLmV4cHJlc3Npb25zLm1hcCAoZSkgLT4gZS5uYW1lXG4gICAgICByZWdpc3RyeS5jcmVhdGVFeHByZXNzaW9ucyhvcHRpb25zLmV4cHJlc3Npb25zKVxuXG4gICAgICBuZXcgRGlzcG9zYWJsZSAtPiByZWdpc3RyeS5yZW1vdmVFeHByZXNzaW9uKG5hbWUpIGZvciBuYW1lIGluIG5hbWVzXG4gICAgZWxzZVxuICAgICAge25hbWUsIHJlZ2V4cFN0cmluZywgaGFuZGxlLCBzY29wZXMsIHByaW9yaXR5fSA9IG9wdGlvbnNcbiAgICAgIHJlZ2lzdHJ5LmNyZWF0ZUV4cHJlc3Npb24obmFtZSwgcmVnZXhwU3RyaW5nLCBwcmlvcml0eSwgc2NvcGVzLCBoYW5kbGUpXG5cbiAgICAgIG5ldyBEaXNwb3NhYmxlIC0+IHJlZ2lzdHJ5LnJlbW92ZUV4cHJlc3Npb24obmFtZSlcblxuICBkZXNlcmlhbGl6ZVBhbGV0dGU6IChzdGF0ZSkgLT5cbiAgICBQYWxldHRlID89IHJlcXVpcmUgJy4vcGFsZXR0ZSdcbiAgICBQYWxldHRlLmRlc2VyaWFsaXplKHN0YXRlKVxuXG4gIGRlc2VyaWFsaXplQ29sb3JTZWFyY2g6IChzdGF0ZSkgLT5cbiAgICBDb2xvclNlYXJjaCA/PSByZXF1aXJlICcuL2NvbG9yLXNlYXJjaCdcbiAgICBDb2xvclNlYXJjaC5kZXNlcmlhbGl6ZShzdGF0ZSlcblxuICBkZXNlcmlhbGl6ZUNvbG9yUHJvamVjdDogKHN0YXRlKSAtPlxuICAgIENvbG9yUHJvamVjdCA/PSByZXF1aXJlICcuL2NvbG9yLXByb2plY3QnXG4gICAgQ29sb3JQcm9qZWN0LmRlc2VyaWFsaXplKHN0YXRlKVxuXG4gIGRlc2VyaWFsaXplQ29sb3JQcm9qZWN0RWxlbWVudDogKHN0YXRlKSAtPlxuICAgIENvbG9yUHJvamVjdEVsZW1lbnQgPz0gcmVxdWlyZSAnLi9jb2xvci1wcm9qZWN0LWVsZW1lbnQnXG4gICAgZWxlbWVudCA9IG5ldyBDb2xvclByb2plY3RFbGVtZW50XG5cbiAgICBpZiBAcHJvamVjdD9cbiAgICAgIGVsZW1lbnQuc2V0TW9kZWwoQGdldFByb2plY3QoKSlcbiAgICBlbHNlXG4gICAgICBzdWJzY3JpcHRpb24gPSBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVQYWNrYWdlIChwa2cpID0+XG4gICAgICAgIGlmIHBrZy5uYW1lIGlzICdwaWdtZW50cydcbiAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgICAgICAgZWxlbWVudC5zZXRNb2RlbChAZ2V0UHJvamVjdCgpKVxuXG4gICAgZWxlbWVudFxuXG4gIGRlc2VyaWFsaXplVmFyaWFibGVzQ29sbGVjdGlvbjogKHN0YXRlKSAtPlxuICAgIFZhcmlhYmxlc0NvbGxlY3Rpb24gPz0gcmVxdWlyZSAnLi92YXJpYWJsZXMtY29sbGVjdGlvbidcbiAgICBWYXJpYWJsZXNDb2xsZWN0aW9uLmRlc2VyaWFsaXplKHN0YXRlKVxuXG4gIHBpZ21lbnRzVmlld1Byb3ZpZGVyOiAobW9kZWwpIC0+XG4gICAgZWxlbWVudCA9IGlmIG1vZGVsIGluc3RhbmNlb2YgKENvbG9yQnVmZmVyID89IHJlcXVpcmUgJy4vY29sb3ItYnVmZmVyJylcbiAgICAgIENvbG9yQnVmZmVyRWxlbWVudCA/PSByZXF1aXJlICcuL2NvbG9yLWJ1ZmZlci1lbGVtZW50J1xuICAgICAgZWxlbWVudCA9IG5ldyBDb2xvckJ1ZmZlckVsZW1lbnRcbiAgICBlbHNlIGlmIG1vZGVsIGluc3RhbmNlb2YgKENvbG9yU2VhcmNoID89IHJlcXVpcmUgJy4vY29sb3Itc2VhcmNoJylcbiAgICAgIENvbG9yUmVzdWx0c0VsZW1lbnQgPz0gcmVxdWlyZSAnLi9jb2xvci1yZXN1bHRzLWVsZW1lbnQnXG4gICAgICBlbGVtZW50ID0gbmV3IENvbG9yUmVzdWx0c0VsZW1lbnRcbiAgICBlbHNlIGlmIG1vZGVsIGluc3RhbmNlb2YgKENvbG9yUHJvamVjdCA/PSByZXF1aXJlICcuL2NvbG9yLXByb2plY3QnKVxuICAgICAgQ29sb3JQcm9qZWN0RWxlbWVudCA/PSByZXF1aXJlICcuL2NvbG9yLXByb2plY3QtZWxlbWVudCdcbiAgICAgIGVsZW1lbnQgPSBuZXcgQ29sb3JQcm9qZWN0RWxlbWVudFxuICAgIGVsc2UgaWYgbW9kZWwgaW5zdGFuY2VvZiAoUGFsZXR0ZSA/PSByZXF1aXJlICcuL3BhbGV0dGUnKVxuICAgICAgUGFsZXR0ZUVsZW1lbnQgPz0gcmVxdWlyZSAnLi9wYWxldHRlLWVsZW1lbnQnXG4gICAgICBlbGVtZW50ID0gbmV3IFBhbGV0dGVFbGVtZW50XG5cbiAgICBlbGVtZW50LnNldE1vZGVsKG1vZGVsKSBpZiBlbGVtZW50P1xuICAgIGVsZW1lbnRcblxuICBzaG91bGREaXNwbGF5Q29udGV4dE1lbnU6IChldmVudCkgLT5cbiAgICBAbGFzdEV2ZW50ID0gZXZlbnRcbiAgICBzZXRUaW1lb3V0ICg9PiBAbGFzdEV2ZW50ID0gbnVsbCksIDEwXG4gICAgQGNvbG9yTWFya2VyRm9yTW91c2VFdmVudChldmVudCk/XG5cbiAgY29sb3JNYXJrZXJGb3JNb3VzZUV2ZW50OiAoZXZlbnQpIC0+XG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgY29sb3JCdWZmZXIgPSBAcHJvamVjdC5jb2xvckJ1ZmZlckZvckVkaXRvcihlZGl0b3IpXG4gICAgY29sb3JCdWZmZXJFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGNvbG9yQnVmZmVyKVxuICAgIGNvbG9yQnVmZmVyRWxlbWVudD8uY29sb3JNYXJrZXJGb3JNb3VzZUV2ZW50KGV2ZW50KVxuXG4gIHNlcmlhbGl6ZTogLT4ge3Byb2plY3Q6IEBwcm9qZWN0LnNlcmlhbGl6ZSgpfVxuXG4gIGdldFByb2plY3Q6IC0+IEBwcm9qZWN0XG5cbiAgZmluZENvbG9yczogLT5cbiAgICB1cmlzID89IHJlcXVpcmUgJy4vdXJpcydcblxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKHVyaXMuU0VBUkNIKVxuICAgIHBhbmUgfHw9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSh1cmlzLlNFQVJDSCwgcGFuZSwge30pXG5cbiAgc2hvd1BhbGV0dGU6IC0+XG4gICAgdXJpcyA/PSByZXF1aXJlICcuL3VyaXMnXG5cbiAgICBAcHJvamVjdC5pbml0aWFsaXplKCkudGhlbiAtPlxuICAgICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkodXJpcy5QQUxFVFRFKVxuICAgICAgcGFuZSB8fD0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG5cbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW5VUklJblBhbmUodXJpcy5QQUxFVFRFLCBwYW5lLCB7fSlcbiAgICAuY2F0Y2ggKHJlYXNvbikgLT5cbiAgICAgIGNvbnNvbGUuZXJyb3IgcmVhc29uXG5cbiAgc2hvd1NldHRpbmdzOiAtPlxuICAgIHVyaXMgPz0gcmVxdWlyZSAnLi91cmlzJ1xuXG4gICAgQHByb2plY3QuaW5pdGlhbGl6ZSgpLnRoZW4gLT5cbiAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKHVyaXMuU0VUVElOR1MpXG4gICAgICBwYW5lIHx8PSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcblxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSh1cmlzLlNFVFRJTkdTLCBwYW5lLCB7fSlcbiAgICAuY2F0Y2ggKHJlYXNvbikgLT5cbiAgICAgIGNvbnNvbGUuZXJyb3IgcmVhc29uXG5cbiAgcmVsb2FkUHJvamVjdFZhcmlhYmxlczogLT4gQHByb2plY3QucmVsb2FkKClcblxuICBjcmVhdGVQaWdtZW50c1JlcG9ydDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdwaWdtZW50cy1yZXBvcnQuanNvbicpLnRoZW4gKGVkaXRvcikgPT5cbiAgICAgIGVkaXRvci5zZXRUZXh0KEBjcmVhdGVSZXBvcnQoKSlcblxuICBjcmVhdGVSZXBvcnQ6IC0+XG4gICAgbyA9XG4gICAgICBhdG9tOiBhdG9tLmdldFZlcnNpb24oKVxuICAgICAgcGlnbWVudHM6IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZSgncGlnbWVudHMnKS5tZXRhZGF0YS52ZXJzaW9uXG4gICAgICBwbGF0Zm9ybTogcmVxdWlyZSgnb3MnKS5wbGF0Zm9ybSgpXG4gICAgICBjb25maWc6IGF0b20uY29uZmlnLmdldCgncGlnbWVudHMnKVxuICAgICAgcHJvamVjdDpcbiAgICAgICAgY29uZmlnOlxuICAgICAgICAgIHNvdXJjZU5hbWVzOiBAcHJvamVjdC5zb3VyY2VOYW1lc1xuICAgICAgICAgIHNlYXJjaE5hbWVzOiBAcHJvamVjdC5zZWFyY2hOYW1lc1xuICAgICAgICAgIGlnbm9yZWROYW1lczogQHByb2plY3QuaWdub3JlZE5hbWVzXG4gICAgICAgICAgaWdub3JlZFNjb3BlczogQHByb2plY3QuaWdub3JlZFNjb3Blc1xuICAgICAgICAgIGluY2x1ZGVUaGVtZXM6IEBwcm9qZWN0LmluY2x1ZGVUaGVtZXNcbiAgICAgICAgICBpZ25vcmVHbG9iYWxTb3VyY2VOYW1lczogQHByb2plY3QuaWdub3JlR2xvYmFsU291cmNlTmFtZXNcbiAgICAgICAgICBpZ25vcmVHbG9iYWxTZWFyY2hOYW1lczogQHByb2plY3QuaWdub3JlR2xvYmFsU2VhcmNoTmFtZXNcbiAgICAgICAgICBpZ25vcmVHbG9iYWxJZ25vcmVkTmFtZXM6IEBwcm9qZWN0Lmlnbm9yZUdsb2JhbElnbm9yZWROYW1lc1xuICAgICAgICAgIGlnbm9yZUdsb2JhbElnbm9yZWRTY29wZXM6IEBwcm9qZWN0Lmlnbm9yZUdsb2JhbElnbm9yZWRTY29wZXNcbiAgICAgICAgcGF0aHM6IEBwcm9qZWN0LmdldFBhdGhzKClcbiAgICAgICAgdmFyaWFibGVzOlxuICAgICAgICAgIGNvbG9yczogQHByb2plY3QuZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGhcbiAgICAgICAgICB0b3RhbDogQHByb2plY3QuZ2V0VmFyaWFibGVzKCkubGVuZ3RoXG5cbiAgICBKU09OLnN0cmluZ2lmeShvLCBudWxsLCAyKVxuICAgIC5yZXBsYWNlKC8vLyN7YXRvbS5wcm9qZWN0LmdldFBhdGhzKCkuam9pbignfCcpfS8vL2csICc8cm9vdD4nKVxuXG4gIHBhdGNoQXRvbTogLT5cbiAgICBnZXRNb2R1bGVGcm9tTm9kZUNhY2hlID0gKG5hbWUpIC0+XG4gICAgICBtb2R1bGVQYXRoID0gT2JqZWN0LmtleXMocmVxdWlyZS5jYWNoZSkuZmlsdGVyKChzKSAtPiBzLmluZGV4T2YobmFtZSkgPiAtMSlbMF1cbiAgICAgIHJlcXVpcmUuY2FjaGVbbW9kdWxlUGF0aF1cblxuICAgIGdldE1vZHVsZUZyb21TbmFwc2hvdENhY2hlID0gKG5hbWUpIC0+XG4gICAgICBpZiB0eXBlb2Ygc25hcHNob3RSZXN1bHQgaXMgJ3VuZGVmaW5lZCdcbiAgICAgICAgbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBtb2R1bGVQYXRoID0gT2JqZWN0LmtleXMoc25hcHNob3RSZXN1bHQuY3VzdG9tUmVxdWlyZS5jYWNoZSkuZmlsdGVyKChzKSAtPiBzLmluZGV4T2YobmFtZSkgPiAtMSlbMF1cbiAgICAgICAgc25hcHNob3RSZXN1bHQuY3VzdG9tUmVxdWlyZS5jYWNoZVttb2R1bGVQYXRoXVxuXG4gICAgcmVxdWlyZUNvcmUgPSAobmFtZSkgLT5cbiAgICAgIG1vZHVsZSA9IGdldE1vZHVsZUZyb21Ob2RlQ2FjaGUobmFtZSkgPyBnZXRNb2R1bGVGcm9tU25hcHNob3RDYWNoZShuYW1lKVxuICAgICAgaWYgbW9kdWxlP1xuICAgICAgICBtb2R1bGUuZXhwb3J0c1xuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCAnI3tuYW1lfScgaW4gdGhlIHJlcXVpcmUgY2FjaGUuXCIpXG4iXX0=
