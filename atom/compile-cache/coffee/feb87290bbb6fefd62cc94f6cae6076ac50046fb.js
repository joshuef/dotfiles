(function() {
  var ColorProjectElement, CompositeDisposable, EventsDelegation, SpacePenDSL, capitalize, ref, registerOrUpdateElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-utils'), SpacePenDSL = ref.SpacePenDSL, EventsDelegation = ref.EventsDelegation, registerOrUpdateElement = ref.registerOrUpdateElement;

  CompositeDisposable = null;

  capitalize = function(s) {
    return s.replace(/^./, function(m) {
      return m.toUpperCase();
    });
  };

  ColorProjectElement = (function(superClass) {
    extend(ColorProjectElement, superClass);

    function ColorProjectElement() {
      return ColorProjectElement.__super__.constructor.apply(this, arguments);
    }

    SpacePenDSL.includeInto(ColorProjectElement);

    EventsDelegation.includeInto(ColorProjectElement);

    ColorProjectElement.content = function() {
      var arrayField, booleanField, selectField;
      arrayField = (function(_this) {
        return function(name, label, setting, description) {
          var settingName;
          settingName = "pigments." + name;
          return _this.div({
            "class": 'control-group array'
          }, function() {
            return _this.div({
              "class": 'controls'
            }, function() {
              _this.label({
                "class": 'control-label'
              }, function() {
                return _this.span({
                  "class": 'setting-title'
                }, label);
              });
              return _this.div({
                "class": 'control-wrapper'
              }, function() {
                _this.tag('atom-text-editor', {
                  mini: true,
                  outlet: name,
                  type: 'array',
                  property: name
                });
                return _this.div({
                  "class": 'setting-description'
                }, function() {
                  _this.div(function() {
                    _this.raw("Global config: <code>" + (atom.config.get(setting != null ? setting : settingName).join(', ')) + "</code>");
                    if (description != null) {
                      return _this.p(function() {
                        return _this.raw(description);
                      });
                    }
                  });
                  return booleanField("ignoreGlobal" + (capitalize(name)), 'Ignore Global', null, true);
                });
              });
            });
          });
        };
      })(this);
      selectField = (function(_this) {
        return function(name, label, arg) {
          var description, options, ref1, setting, settingName, useBoolean;
          ref1 = arg != null ? arg : {}, options = ref1.options, setting = ref1.setting, description = ref1.description, useBoolean = ref1.useBoolean;
          settingName = "pigments." + name;
          return _this.div({
            "class": 'control-group array'
          }, function() {
            return _this.div({
              "class": 'controls'
            }, function() {
              _this.label({
                "class": 'control-label'
              }, function() {
                return _this.span({
                  "class": 'setting-title'
                }, label);
              });
              return _this.div({
                "class": 'control-wrapper'
              }, function() {
                _this.select({
                  outlet: name,
                  "class": 'form-control',
                  required: true
                }, function() {
                  return options.forEach(function(option) {
                    if (option === '') {
                      return _this.option({
                        value: option
                      }, 'Use global config');
                    } else {
                      return _this.option({
                        value: option
                      }, capitalize(option));
                    }
                  });
                });
                return _this.div({
                  "class": 'setting-description'
                }, function() {
                  _this.div(function() {
                    _this.raw("Global config: <code>" + (atom.config.get(setting != null ? setting : settingName)) + "</code>");
                    if (description != null) {
                      return _this.p(function() {
                        return _this.raw(description);
                      });
                    }
                  });
                  if (useBoolean) {
                    return booleanField("ignoreGlobal" + (capitalize(name)), 'Ignore Global', null, true);
                  }
                });
              });
            });
          });
        };
      })(this);
      booleanField = (function(_this) {
        return function(name, label, description, nested) {
          return _this.div({
            "class": 'control-group boolean'
          }, function() {
            return _this.div({
              "class": 'controls'
            }, function() {
              _this.input({
                type: 'checkbox',
                id: "pigments-" + name,
                outlet: name
              });
              _this.label({
                "class": 'control-label',
                "for": "pigments-" + name
              }, function() {
                return _this.span({
                  "class": (nested ? 'setting-description' : 'setting-title')
                }, label);
              });
              if (description != null) {
                return _this.div({
                  "class": 'setting-description'
                }, function() {
                  return _this.raw(description);
                });
              }
            });
          });
        };
      })(this);
      return this.section({
        "class": 'settings-view pane-item'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'settings-wrapper'
          }, function() {
            _this.div({
              "class": 'header'
            }, function() {
              _this.div({
                "class": 'logo'
              }, function() {
                return _this.img({
                  src: 'atom://pigments/resources/logo.svg',
                  width: 140,
                  height: 35
                });
              });
              return _this.p({
                "class": 'setting-description'
              }, "These settings apply on the current project only and are complementary\nto the package settings.");
            });
            return _this.div({
              "class": 'fields'
            }, function() {
              var themes;
              themes = atom.themes.getActiveThemeNames();
              arrayField('sourceNames', 'Source Names');
              arrayField('ignoredNames', 'Ignored Names');
              arrayField('supportedFiletypes', 'Supported Filetypes');
              arrayField('ignoredScopes', 'Ignored Scopes');
              arrayField('searchNames', 'Extended Search Names', 'pigments.extendedSearchNames');
              selectField('sassShadeAndTintImplementation', 'Sass Shade And Tint Implementation', {
                options: ['', 'compass', 'bourbon'],
                setting: 'pigments.sassShadeAndTintImplementation',
                description: "Sass doesn't provide any implementation for shade and tint function, and Compass and Bourbon have different implementation for these two methods. This setting allow you to chose which implementation use."
              });
              return booleanField('includeThemes', 'Include Atom Themes Stylesheets', "The variables from <code>" + themes[0] + "</code> and\n<code>" + themes[1] + "</code> themes will be automatically added to the\nproject palette.");
            });
          });
        };
      })(this));
    };

    ColorProjectElement.prototype.createdCallback = function() {
      if (CompositeDisposable == null) {
        CompositeDisposable = require('atom').CompositeDisposable;
      }
      return this.subscriptions = new CompositeDisposable;
    };

    ColorProjectElement.prototype.setModel = function(project) {
      this.project = project;
      return this.initializeBindings();
    };

    ColorProjectElement.prototype.initializeBindings = function() {
      var grammar;
      grammar = atom.grammars.grammarForScopeName('source.js.regexp');
      this.ignoredScopes.getModel().setGrammar(grammar);
      this.initializeTextEditor('sourceNames');
      this.initializeTextEditor('searchNames');
      this.initializeTextEditor('ignoredNames');
      this.initializeTextEditor('ignoredScopes');
      this.initializeTextEditor('supportedFiletypes');
      this.initializeCheckbox('includeThemes');
      this.initializeCheckbox('ignoreGlobalSourceNames');
      this.initializeCheckbox('ignoreGlobalIgnoredNames');
      this.initializeCheckbox('ignoreGlobalIgnoredScopes');
      this.initializeCheckbox('ignoreGlobalSearchNames');
      this.initializeCheckbox('ignoreGlobalSupportedFiletypes');
      return this.initializeSelect('sassShadeAndTintImplementation');
    };

    ColorProjectElement.prototype.initializeTextEditor = function(name) {
      var capitalizedName, editor, ref1;
      capitalizedName = capitalize(name);
      editor = this[name].getModel();
      editor.setText(((ref1 = this.project[name]) != null ? ref1 : []).join(', '));
      return this.subscriptions.add(editor.onDidStopChanging((function(_this) {
        return function() {
          var array;
          array = editor.getText().split(/\s*,\s*/g).filter(function(s) {
            return s.length > 0;
          });
          return _this.project["set" + capitalizedName](array);
        };
      })(this)));
    };

    ColorProjectElement.prototype.initializeSelect = function(name) {
      var capitalizedName, optionValues, select;
      capitalizedName = capitalize(name);
      select = this[name];
      optionValues = [].slice.call(select.querySelectorAll('option')).map(function(o) {
        return o.value;
      });
      if (this.project[name]) {
        select.selectedIndex = optionValues.indexOf(this.project[name]);
      }
      return this.subscriptions.add(this.subscribeTo(select, {
        change: (function(_this) {
          return function() {
            var ref1, value;
            value = (ref1 = select.selectedOptions[0]) != null ? ref1.value : void 0;
            return _this.project["set" + capitalizedName](value === '' ? null : value);
          };
        })(this)
      }));
    };

    ColorProjectElement.prototype.initializeCheckbox = function(name) {
      var capitalizedName, checkbox;
      capitalizedName = capitalize(name);
      checkbox = this[name];
      checkbox.checked = this.project[name];
      return this.subscriptions.add(this.subscribeTo(checkbox, {
        change: (function(_this) {
          return function() {
            return _this.project["set" + capitalizedName](checkbox.checked);
          };
        })(this)
      }));
    };

    ColorProjectElement.prototype.getTitle = function() {
      return 'Project Settings';
    };

    ColorProjectElement.prototype.getURI = function() {
      return 'pigments://settings';
    };

    ColorProjectElement.prototype.getIconName = function() {
      return "pigments";
    };

    ColorProjectElement.prototype.serialize = function() {
      return {
        deserializer: 'ColorProjectElement'
      };
    };

    return ColorProjectElement;

  })(HTMLElement);

  module.exports = ColorProjectElement = registerOrUpdateElement('pigments-color-project', ColorProjectElement.prototype);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvbGliL2NvbG9yLXByb2plY3QtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlIQUFBO0lBQUE7OztFQUFBLE1BQTJELE9BQUEsQ0FBUSxZQUFSLENBQTNELEVBQUMsNkJBQUQsRUFBYyx1Q0FBZCxFQUFnQzs7RUFDaEMsbUJBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBYSxTQUFDLENBQUQ7V0FBTyxDQUFDLENBQUMsT0FBRixDQUFVLElBQVYsRUFBZ0IsU0FBQyxDQUFEO2FBQU8sQ0FBQyxDQUFDLFdBQUYsQ0FBQTtJQUFQLENBQWhCO0VBQVA7O0VBRVA7Ozs7Ozs7SUFDSixXQUFXLENBQUMsV0FBWixDQUF3QixtQkFBeEI7O0lBQ0EsZ0JBQWdCLENBQUMsV0FBakIsQ0FBNkIsbUJBQTdCOztJQUVBLG1CQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsVUFBQSxHQUFhLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsV0FBdkI7QUFDWCxjQUFBO1VBQUEsV0FBQSxHQUFjLFdBQUEsR0FBWTtpQkFFMUIsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8scUJBQVA7V0FBTCxFQUFtQyxTQUFBO21CQUNqQyxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxVQUFQO2FBQUwsRUFBd0IsU0FBQTtjQUN0QixLQUFDLENBQUEsS0FBRCxDQUFPO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtlQUFQLEVBQStCLFNBQUE7dUJBQzdCLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO2lCQUFOLEVBQThCLEtBQTlCO2NB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LENBQUEsT0FBUSxDQUFBLEtBQUEsR0FBTSxlQUFOLENBQVQsQ0FBa0MsUUFBUSxDQUFDLE9BQTNDO1VBRGdEO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSO09BQXZCLENBQW5CO0lBTGtCOztrQ0FRcEIsUUFBQSxHQUFVLFNBQUE7YUFBRztJQUFIOztrQ0FFVixNQUFBLEdBQVEsU0FBQTthQUFHO0lBQUg7O2tDQUVSLFdBQUEsR0FBYSxTQUFBO2FBQUc7SUFBSDs7a0NBRWIsU0FBQSxHQUFXLFNBQUE7YUFBRztRQUFDLFlBQUEsRUFBYyxxQkFBZjs7SUFBSDs7OztLQXRKcUI7O0VBd0psQyxNQUFNLENBQUMsT0FBUCxHQUNBLG1CQUFBLEdBQ0EsdUJBQUEsQ0FBd0Isd0JBQXhCLEVBQWtELG1CQUFtQixDQUFDLFNBQXRFO0FBL0pBIiwic291cmNlc0NvbnRlbnQiOlsie1NwYWNlUGVuRFNMLCBFdmVudHNEZWxlZ2F0aW9uLCByZWdpc3Rlck9yVXBkYXRlRWxlbWVudH0gPSByZXF1aXJlICdhdG9tLXV0aWxzJ1xuQ29tcG9zaXRlRGlzcG9zYWJsZSA9IG51bGxcblxuY2FwaXRhbGl6ZSA9IChzKSAtPiBzLnJlcGxhY2UgL14uLywgKG0pIC0+IG0udG9VcHBlckNhc2UoKVxuXG5jbGFzcyBDb2xvclByb2plY3RFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgU3BhY2VQZW5EU0wuaW5jbHVkZUludG8odGhpcylcbiAgRXZlbnRzRGVsZWdhdGlvbi5pbmNsdWRlSW50byh0aGlzKVxuXG4gIEBjb250ZW50OiAtPlxuICAgIGFycmF5RmllbGQgPSAobmFtZSwgbGFiZWwsIHNldHRpbmcsIGRlc2NyaXB0aW9uKSA9PlxuICAgICAgc2V0dGluZ05hbWUgPSBcInBpZ21lbnRzLiN7bmFtZX1cIlxuXG4gICAgICBAZGl2IGNsYXNzOiAnY29udHJvbC1ncm91cCBhcnJheScsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdjb250cm9scycsID0+XG4gICAgICAgICAgQGxhYmVsIGNsYXNzOiAnY29udHJvbC1sYWJlbCcsID0+XG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ3NldHRpbmctdGl0bGUnLCBsYWJlbFxuXG4gICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2wtd3JhcHBlcicsID0+XG4gICAgICAgICAgICBAdGFnICdhdG9tLXRleHQtZWRpdG9yJywgbWluaTogdHJ1ZSwgb3V0bGV0OiBuYW1lLCB0eXBlOiAnYXJyYXknLCBwcm9wZXJ0eTogbmFtZVxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3NldHRpbmctZGVzY3JpcHRpb24nLCA9PlxuICAgICAgICAgICAgICBAZGl2ID0+XG4gICAgICAgICAgICAgICAgQHJhdyBcIkdsb2JhbCBjb25maWc6IDxjb2RlPiN7YXRvbS5jb25maWcuZ2V0KHNldHRpbmcgPyBzZXR0aW5nTmFtZSkuam9pbignLCAnKX08L2NvZGU+XCJcblxuICAgICAgICAgICAgICAgIEBwKD0+IEByYXcgZGVzY3JpcHRpb24pIGlmIGRlc2NyaXB0aW9uP1xuXG4gICAgICAgICAgICAgIGJvb2xlYW5GaWVsZChcImlnbm9yZUdsb2JhbCN7Y2FwaXRhbGl6ZSBuYW1lfVwiLCAnSWdub3JlIEdsb2JhbCcsIG51bGwsIHRydWUpXG5cbiAgICBzZWxlY3RGaWVsZCA9IChuYW1lLCBsYWJlbCwge29wdGlvbnMsIHNldHRpbmcsIGRlc2NyaXB0aW9uLCB1c2VCb29sZWFufT17fSkgPT5cbiAgICAgIHNldHRpbmdOYW1lID0gXCJwaWdtZW50cy4je25hbWV9XCJcblxuICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2wtZ3JvdXAgYXJyYXknLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnY29udHJvbHMnLCA9PlxuICAgICAgICAgIEBsYWJlbCBjbGFzczogJ2NvbnRyb2wtbGFiZWwnLCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdzZXR0aW5nLXRpdGxlJywgbGFiZWxcblxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdjb250cm9sLXdyYXBwZXInLCA9PlxuICAgICAgICAgICAgQHNlbGVjdCBvdXRsZXQ6IG5hbWUsIGNsYXNzOiAnZm9ybS1jb250cm9sJywgcmVxdWlyZWQ6IHRydWUsID0+XG4gICAgICAgICAgICAgIG9wdGlvbnMuZm9yRWFjaCAob3B0aW9uKSA9PlxuICAgICAgICAgICAgICAgIGlmIG9wdGlvbiBpcyAnJ1xuICAgICAgICAgICAgICAgICAgQG9wdGlvbiB2YWx1ZTogb3B0aW9uLCAnVXNlIGdsb2JhbCBjb25maWcnXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgQG9wdGlvbiB2YWx1ZTogb3B0aW9uLCBjYXBpdGFsaXplIG9wdGlvblxuXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy1kZXNjcmlwdGlvbicsID0+XG4gICAgICAgICAgICAgIEBkaXYgPT5cbiAgICAgICAgICAgICAgICBAcmF3IFwiR2xvYmFsIGNvbmZpZzogPGNvZGU+I3thdG9tLmNvbmZpZy5nZXQoc2V0dGluZyA/IHNldHRpbmdOYW1lKX08L2NvZGU+XCJcblxuICAgICAgICAgICAgICAgIEBwKD0+IEByYXcgZGVzY3JpcHRpb24pIGlmIGRlc2NyaXB0aW9uP1xuXG4gICAgICAgICAgICAgIGlmIHVzZUJvb2xlYW5cbiAgICAgICAgICAgICAgICBib29sZWFuRmllbGQoXCJpZ25vcmVHbG9iYWwje2NhcGl0YWxpemUgbmFtZX1cIiwgJ0lnbm9yZSBHbG9iYWwnLCBudWxsLCB0cnVlKVxuXG4gICAgYm9vbGVhbkZpZWxkID0gKG5hbWUsIGxhYmVsLCBkZXNjcmlwdGlvbiwgbmVzdGVkKSA9PlxuICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2wtZ3JvdXAgYm9vbGVhbicsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdjb250cm9scycsID0+XG4gICAgICAgICAgQGlucHV0IHR5cGU6ICdjaGVja2JveCcsIGlkOiBcInBpZ21lbnRzLSN7bmFtZX1cIiwgb3V0bGV0OiBuYW1lXG4gICAgICAgICAgQGxhYmVsIGNsYXNzOiAnY29udHJvbC1sYWJlbCcsIGZvcjogXCJwaWdtZW50cy0je25hbWV9XCIsID0+XG4gICAgICAgICAgICBAc3BhbiBjbGFzczogKGlmIG5lc3RlZCB0aGVuICdzZXR0aW5nLWRlc2NyaXB0aW9uJyBlbHNlICdzZXR0aW5nLXRpdGxlJyksIGxhYmVsXG5cbiAgICAgICAgICBpZiBkZXNjcmlwdGlvbj9cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLWRlc2NyaXB0aW9uJywgPT5cbiAgICAgICAgICAgICAgQHJhdyBkZXNjcmlwdGlvblxuXG4gICAgQHNlY3Rpb24gY2xhc3M6ICdzZXR0aW5ncy12aWV3IHBhbmUtaXRlbScsID0+XG4gICAgICBAZGl2IGNsYXNzOiAnc2V0dGluZ3Mtd3JhcHBlcicsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdoZWFkZXInLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdsb2dvJywgPT5cbiAgICAgICAgICAgIEBpbWcgc3JjOiAnYXRvbTovL3BpZ21lbnRzL3Jlc291cmNlcy9sb2dvLnN2ZycsIHdpZHRoOiAxNDAsIGhlaWdodDogMzVcblxuICAgICAgICAgIEBwIGNsYXNzOiAnc2V0dGluZy1kZXNjcmlwdGlvbicsIFwiXCJcIlxuICAgICAgICAgIFRoZXNlIHNldHRpbmdzIGFwcGx5IG9uIHRoZSBjdXJyZW50IHByb2plY3Qgb25seSBhbmQgYXJlIGNvbXBsZW1lbnRhcnlcbiAgICAgICAgICB0byB0aGUgcGFja2FnZSBzZXR0aW5ncy5cbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBAZGl2IGNsYXNzOiAnZmllbGRzJywgPT5cbiAgICAgICAgICB0aGVtZXMgPSBhdG9tLnRoZW1lcy5nZXRBY3RpdmVUaGVtZU5hbWVzKClcbiAgICAgICAgICBhcnJheUZpZWxkKCdzb3VyY2VOYW1lcycsICdTb3VyY2UgTmFtZXMnKVxuICAgICAgICAgIGFycmF5RmllbGQoJ2lnbm9yZWROYW1lcycsICdJZ25vcmVkIE5hbWVzJylcbiAgICAgICAgICBhcnJheUZpZWxkKCdzdXBwb3J0ZWRGaWxldHlwZXMnLCAnU3VwcG9ydGVkIEZpbGV0eXBlcycpXG4gICAgICAgICAgYXJyYXlGaWVsZCgnaWdub3JlZFNjb3BlcycsICdJZ25vcmVkIFNjb3BlcycpXG4gICAgICAgICAgYXJyYXlGaWVsZCgnc2VhcmNoTmFtZXMnLCAnRXh0ZW5kZWQgU2VhcmNoIE5hbWVzJywgJ3BpZ21lbnRzLmV4dGVuZGVkU2VhcmNoTmFtZXMnKVxuICAgICAgICAgIHNlbGVjdEZpZWxkKCdzYXNzU2hhZGVBbmRUaW50SW1wbGVtZW50YXRpb24nLCAnU2FzcyBTaGFkZSBBbmQgVGludCBJbXBsZW1lbnRhdGlvbicsIHtcbiAgICAgICAgICAgIG9wdGlvbnM6IFsnJywgJ2NvbXBhc3MnLCAnYm91cmJvbiddXG4gICAgICAgICAgICBzZXR0aW5nOiAncGlnbWVudHMuc2Fzc1NoYWRlQW5kVGludEltcGxlbWVudGF0aW9uJ1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2FzcyBkb2Vzbid0IHByb3ZpZGUgYW55IGltcGxlbWVudGF0aW9uIGZvciBzaGFkZSBhbmQgdGludCBmdW5jdGlvbiwgYW5kIENvbXBhc3MgYW5kIEJvdXJib24gaGF2ZSBkaWZmZXJlbnQgaW1wbGVtZW50YXRpb24gZm9yIHRoZXNlIHR3byBtZXRob2RzLiBUaGlzIHNldHRpbmcgYWxsb3cgeW91IHRvIGNob3NlIHdoaWNoIGltcGxlbWVudGF0aW9uIHVzZS5cIlxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBib29sZWFuRmllbGQoJ2luY2x1ZGVUaGVtZXMnLCAnSW5jbHVkZSBBdG9tIFRoZW1lcyBTdHlsZXNoZWV0cycsIFwiXCJcIlxuICAgICAgICAgIFRoZSB2YXJpYWJsZXMgZnJvbSA8Y29kZT4je3RoZW1lc1swXX08L2NvZGU+IGFuZFxuICAgICAgICAgIDxjb2RlPiN7dGhlbWVzWzFdfTwvY29kZT4gdGhlbWVzIHdpbGwgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGVcbiAgICAgICAgICBwcm9qZWN0IHBhbGV0dGUuXG4gICAgICAgICAgXCJcIlwiKVxuXG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJyB1bmxlc3MgQ29tcG9zaXRlRGlzcG9zYWJsZT9cblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICBzZXRNb2RlbDogKEBwcm9qZWN0KSAtPlxuICAgIEBpbml0aWFsaXplQmluZGluZ3MoKVxuXG4gIGluaXRpYWxpemVCaW5kaW5nczogLT5cbiAgICBncmFtbWFyID0gYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKCdzb3VyY2UuanMucmVnZXhwJylcbiAgICBAaWdub3JlZFNjb3Blcy5nZXRNb2RlbCgpLnNldEdyYW1tYXIoZ3JhbW1hcilcblxuICAgIEBpbml0aWFsaXplVGV4dEVkaXRvcignc291cmNlTmFtZXMnKVxuICAgIEBpbml0aWFsaXplVGV4dEVkaXRvcignc2VhcmNoTmFtZXMnKVxuICAgIEBpbml0aWFsaXplVGV4dEVkaXRvcignaWdub3JlZE5hbWVzJylcbiAgICBAaW5pdGlhbGl6ZVRleHRFZGl0b3IoJ2lnbm9yZWRTY29wZXMnKVxuICAgIEBpbml0aWFsaXplVGV4dEVkaXRvcignc3VwcG9ydGVkRmlsZXR5cGVzJylcbiAgICBAaW5pdGlhbGl6ZUNoZWNrYm94KCdpbmNsdWRlVGhlbWVzJylcbiAgICBAaW5pdGlhbGl6ZUNoZWNrYm94KCdpZ25vcmVHbG9iYWxTb3VyY2VOYW1lcycpXG4gICAgQGluaXRpYWxpemVDaGVja2JveCgnaWdub3JlR2xvYmFsSWdub3JlZE5hbWVzJylcbiAgICBAaW5pdGlhbGl6ZUNoZWNrYm94KCdpZ25vcmVHbG9iYWxJZ25vcmVkU2NvcGVzJylcbiAgICBAaW5pdGlhbGl6ZUNoZWNrYm94KCdpZ25vcmVHbG9iYWxTZWFyY2hOYW1lcycpXG4gICAgQGluaXRpYWxpemVDaGVja2JveCgnaWdub3JlR2xvYmFsU3VwcG9ydGVkRmlsZXR5cGVzJylcbiAgICBAaW5pdGlhbGl6ZVNlbGVjdCgnc2Fzc1NoYWRlQW5kVGludEltcGxlbWVudGF0aW9uJylcblxuICBpbml0aWFsaXplVGV4dEVkaXRvcjogKG5hbWUpIC0+XG4gICAgY2FwaXRhbGl6ZWROYW1lID0gY2FwaXRhbGl6ZSBuYW1lXG4gICAgZWRpdG9yID0gQFtuYW1lXS5nZXRNb2RlbCgpXG5cbiAgICBlZGl0b3Iuc2V0VGV4dCgoQHByb2plY3RbbmFtZV0gPyBbXSkuam9pbignLCAnKSlcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgIGFycmF5ID0gZWRpdG9yLmdldFRleHQoKS5zcGxpdCgvXFxzKixcXHMqL2cpLmZpbHRlciAocykgLT4gcy5sZW5ndGggPiAwXG4gICAgICBAcHJvamVjdFtcInNldCN7Y2FwaXRhbGl6ZWROYW1lfVwiXShhcnJheSlcblxuICBpbml0aWFsaXplU2VsZWN0OiAobmFtZSkgLT5cbiAgICBjYXBpdGFsaXplZE5hbWUgPSBjYXBpdGFsaXplIG5hbWVcbiAgICBzZWxlY3QgPSBAW25hbWVdXG4gICAgb3B0aW9uVmFsdWVzID0gW10uc2xpY2UuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnb3B0aW9uJykpLm1hcCAobykgLT4gby52YWx1ZVxuXG4gICAgaWYgQHByb2plY3RbbmFtZV1cbiAgICAgIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gb3B0aW9uVmFsdWVzLmluZGV4T2YoQHByb2plY3RbbmFtZV0pXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHN1YnNjcmliZVRvIHNlbGVjdCwgY2hhbmdlOiA9PlxuICAgICAgdmFsdWUgPSBzZWxlY3Quc2VsZWN0ZWRPcHRpb25zWzBdPy52YWx1ZVxuICAgICAgQHByb2plY3RbXCJzZXQje2NhcGl0YWxpemVkTmFtZX1cIl0oaWYgdmFsdWUgaXMgJycgdGhlbiBudWxsIGVsc2UgdmFsdWUpXG5cbiAgaW5pdGlhbGl6ZUNoZWNrYm94OiAobmFtZSkgLT5cbiAgICBjYXBpdGFsaXplZE5hbWUgPSBjYXBpdGFsaXplIG5hbWVcbiAgICBjaGVja2JveCA9IEBbbmFtZV1cbiAgICBjaGVja2JveC5jaGVja2VkID0gQHByb2plY3RbbmFtZV1cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAc3Vic2NyaWJlVG8gY2hlY2tib3gsIGNoYW5nZTogPT5cbiAgICAgIEBwcm9qZWN0W1wic2V0I3tjYXBpdGFsaXplZE5hbWV9XCJdKGNoZWNrYm94LmNoZWNrZWQpXG5cbiAgZ2V0VGl0bGU6IC0+ICdQcm9qZWN0IFNldHRpbmdzJ1xuXG4gIGdldFVSSTogLT4gJ3BpZ21lbnRzOi8vc2V0dGluZ3MnXG5cbiAgZ2V0SWNvbk5hbWU6IC0+IFwicGlnbWVudHNcIlxuXG4gIHNlcmlhbGl6ZTogLT4ge2Rlc2VyaWFsaXplcjogJ0NvbG9yUHJvamVjdEVsZW1lbnQnfVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5Db2xvclByb2plY3RFbGVtZW50ID1cbnJlZ2lzdGVyT3JVcGRhdGVFbGVtZW50ICdwaWdtZW50cy1jb2xvci1wcm9qZWN0JywgQ29sb3JQcm9qZWN0RWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
