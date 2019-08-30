(function() {
  var AutoIndent, CompositeDisposable, INTERFILESAVETIME, LB, autoCompeteEmmetCSS, autoCompleteJSX, autoCompleteStyledComponents, observeStatusBarGrammarNameTimer, observeStatusBarGrammarNameTimerCalled, ttlGrammar;

  CompositeDisposable = require('atom').CompositeDisposable;

  autoCompleteJSX = require('./auto-complete-jsx');

  autoCompleteStyledComponents = require('./auto-complete-styled-components');

  autoCompeteEmmetCSS = require('./auto-complete-emmet-css');

  AutoIndent = require('./auto-indent');

  ttlGrammar = require('./create-ttl-grammar');

  INTERFILESAVETIME = 1000;

  LB = 'language-babel';

  observeStatusBarGrammarNameTimer = null;

  observeStatusBarGrammarNameTimerCalled = 0;

  module.exports = {
    activate: function(state) {
      observeStatusBarGrammarNameTimer = setInterval(this.observeStatusBarGrammarName.bind(this), 1000);
      autoCompleteStyledComponents.loadProperties();
      if (this.transpiler == null) {
        this.transpiler = new (require('./transpiler'));
      }
      this.ttlGrammar = new ttlGrammar(true);
      this.disposable = new CompositeDisposable;
      this.textEditors = {};
      this.fileSaveTimes = {};
      this.disposable.add(atom.packages.onDidActivatePackage(this.isPackageCompatible));
      this.disposable.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.transpiler.stopUnusedTasks();
        };
      })(this)));
      return this.disposable.add(atom.workspace.observeTextEditors((function(_this) {
        return function(textEditor) {
          _this.textEditors[textEditor.id] = new CompositeDisposable;
          _this.textEditors[textEditor.id].add(textEditor.observeGrammar(function(grammar) {
            var ref, ref1, ref2, ref3;
            if (textEditor.getGrammar().packageName === LB) {
              return (ref = _this.textEditors[textEditor.id]) != null ? ref.autoIndent = new AutoIndent(textEditor) : void 0;
            } else {
              if ((ref1 = _this.textEditors[textEditor.id]) != null) {
                if ((ref2 = ref1.autoIndent) != null) {
                  ref2.destroy();
                }
              }
              return delete (((ref3 = _this.textEditors[textEditor.id]) != null ? ref3.autoIndent : void 0) != null);
            }
          }));
          _this.textEditors[textEditor.id].add(textEditor.onDidSave(function(event) {
            var filePath, lastSaveTime, ref;
            if (textEditor.getGrammar().packageName === LB) {
              filePath = textEditor.getPath();
              lastSaveTime = (ref = _this.fileSaveTimes[filePath]) != null ? ref : 0;
              _this.fileSaveTimes[filePath] = Date.now();
              if (lastSaveTime < (_this.fileSaveTimes[filePath] - INTERFILESAVETIME)) {
                return _this.transpiler.transpile(filePath, textEditor);
              }
            }
          }));
          return _this.textEditors[textEditor.id].add(textEditor.onDidDestroy(function() {
            var filePath, ref, ref1, ref2;
            if ((ref = _this.textEditors[textEditor.id]) != null) {
              if ((ref1 = ref.autoIndent) != null) {
                ref1.destroy();
              }
            }
            delete (((ref2 = _this.textEditors[textEditor.id]) != null ? ref2.autoIndent : void 0) != null);
            filePath = textEditor.getPath();
            if (_this.fileSaveTimes[filePath] != null) {
              delete _this.fileSaveTimes[filePath];
            }
            _this.textEditors[textEditor.id].dispose();
            return delete _this.textEditors[textEditor.id];
          }));
        };
      })(this)));
    },
    deactivate: function() {
      var disposeable, id, ref, ref1;
      this.disposable.dispose();
      ref = this.textEditors;
      for (id in ref) {
        disposeable = ref[id];
        if (this.textEditors[id].autoIndent != null) {
          this.textEditors[id].autoIndent.destroy();
          delete this.textEditors[id].autoIndent;
        }
        disposeable.dispose();
      }
      this.transpiler.stopAllTranspilerTask();
      this.transpiler.disposables.dispose();
      this.ttlGrammar.destroy();
      return (ref1 = this.mutateStatusGrammarNameObserver) != null ? ref1.disconnet() : void 0;
    },
    isPackageCompatible: function(activatedPackage) {
      var incompatiblePackage, incompatiblePackages, reason, results;
      incompatiblePackages = {
        'source-preview-babel': "Both vie to preview the same file.",
        'source-preview-react': "Both vie to preview the same file.",
        'react': "The Atom community package 'react' (not to be confused \nwith Facebook React) monkey patches the atom methods \nthat provide autoindent features for JSX. \nAs it detects JSX scopes without regard to the grammar being used, \nit tries to auto indent JSX that is highlighted by language-babel. \nAs language-babel also attempts to do auto indentation using \nstandard atom API's, this creates a potential conflict."
      };
      results = [];
      for (incompatiblePackage in incompatiblePackages) {
        reason = incompatiblePackages[incompatiblePackage];
        if (activatedPackage.name === incompatiblePackage) {
          results.push(atom.notifications.addInfo('Incompatible Package Detected', {
            dismissable: true,
            detail: "language-babel has detected the presence of an incompatible Atom package named '" + activatedPackage.name + "'. \n \nIt is recommended that you disable either '" + activatedPackage.name + "' or language-babel \n \nReason:\n \n" + reason
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    autoCompleteProvider: function() {
      return [autoCompleteJSX, autoCompleteStyledComponents, autoCompeteEmmetCSS];
    },
    provide: function() {
      return this.transpiler;
    },
    observeStatusBarGrammarName: function() {
      var config, mutateStatusGrammarNameObserver, ref, target;
      target = document.getElementsByTagName('grammar-selector-status');
      if (++observeStatusBarGrammarNameTimerCalled > 60) {
        clearInterval(observeStatusBarGrammarNameTimer);
        observeStatusBarGrammarNameTimerCalled = 0;
      }
      if (target.length === 1) {
        target = (ref = target[0].childNodes) != null ? ref[0] : void 0;
        if (target) {
          clearInterval(observeStatusBarGrammarNameTimer);
          this.mutateStatusBarGrammarName(target);
          mutateStatusGrammarNameObserver = new MutationObserver((function(_this) {
            return function(mutations) {
              return mutations.forEach(function(mutation) {
                return _this.mutateStatusBarGrammarName(mutation.target);
              });
            };
          })(this));
          config = {
            attributes: true,
            childList: false,
            characterData: false
          };
          return mutateStatusGrammarNameObserver.observe(target, config);
        }
      }
    },
    mutateStatusBarGrammarName: function(elem) {
      if ((elem != null ? elem.innerHTML : void 0) === 'Babel ES6 JavaScript') {
        return elem.innerHTML = 'Babel';
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBQ2xCLDRCQUFBLEdBQStCLE9BQUEsQ0FBUSxtQ0FBUjs7RUFDL0IsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLDJCQUFSOztFQUN0QixVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0VBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7RUFFYixpQkFBQSxHQUFvQjs7RUFDcEIsRUFBQSxHQUFLOztFQUNMLGdDQUFBLEdBQW1DOztFQUNuQyxzQ0FBQSxHQUF5Qzs7RUFFekMsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFFUixnQ0FBQSxHQUFtQyxXQUFBLENBQVksSUFBQyxDQUFBLDJCQUEyQixDQUFDLElBQTdCLENBQWtDLElBQWxDLENBQVosRUFBa0QsSUFBbEQ7TUFDbkMsNEJBQTRCLENBQUMsY0FBN0IsQ0FBQTs7UUFDQSxJQUFDLENBQUEsYUFBYyxJQUFJLENBQUMsT0FBQSxDQUFRLGNBQVIsQ0FBRDs7TUFDbkIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLFVBQUosQ0FBZSxJQUFmO01BRWQsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJO01BQ2xCLElBQUMsQ0FBQSxXQUFELEdBQWU7TUFDZixJQUFDLENBQUEsYUFBRCxHQUFpQjtNQUVqQixJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBZCxDQUFtQyxJQUFDLENBQUEsbUJBQXBDLENBQWhCO01BRUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElB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bUJBQUEsU0FBQyxTQUFEO3FCQUNyRCxTQUFTLENBQUMsT0FBVixDQUFtQixTQUFDLFFBQUQ7dUJBQ2YsS0FBQyxDQUFBLDBCQUFELENBQTRCLFFBQVEsQ0FBQyxNQUFyQztjQURlLENBQW5CO1lBRHFEO1VBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtVQUtsQyxNQUFBLEdBQVM7WUFBRSxVQUFBLEVBQVksSUFBZDtZQUFvQixTQUFBLEVBQVcsS0FBL0I7WUFBc0MsYUFBQSxFQUFlLEtBQXJEOztpQkFHVCwrQkFBK0IsQ0FBQyxPQUFoQyxDQUF3QyxNQUF4QyxFQUFnRCxNQUFoRCxFQWZGO1NBSEY7O0lBVjJCLENBN0Y3QjtJQTZIQSwwQkFBQSxFQUE0QixTQUFDLElBQUQ7TUFDMUIsb0JBQUcsSUFBSSxDQUFFLG1CQUFOLEtBQW1CLHNCQUF0QjtlQUNFLElBQUksQ0FBQyxTQUFMLEdBQWlCLFFBRG5COztJQUQwQixDQTdINUI7O0FBYkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuYXV0b0NvbXBsZXRlSlNYID0gcmVxdWlyZSAnLi9hdXRvLWNvbXBsZXRlLWpzeCdcbmF1dG9Db21wbGV0ZVN0eWxlZENvbXBvbmVudHMgPSByZXF1aXJlICcuL2F1dG8tY29tcGxldGUtc3R5bGVkLWNvbXBvbmVudHMnXG5hdXRvQ29tcGV0ZUVtbWV0Q1NTID0gcmVxdWlyZSAnLi9hdXRvLWNvbXBsZXRlLWVtbWV0LWNzcydcbkF1dG9JbmRlbnQgPSByZXF1aXJlICcuL2F1dG8taW5kZW50J1xudHRsR3JhbW1hciA9IHJlcXVpcmUgJy4vY3JlYXRlLXR0bC1ncmFtbWFyJ1xuXG5JTlRFUkZJTEVTQVZFVElNRSA9IDEwMDBcbkxCID0gJ2xhbmd1YWdlLWJhYmVsJ1xub2JzZXJ2ZVN0YXR1c0JhckdyYW1tYXJOYW1lVGltZXIgPSBudWxsXG5vYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWVUaW1lckNhbGxlZCA9IDBcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgICMgcnVuIG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZSB1bnRpbCBBdG9tIGhhcyBjcmVhdGVkIHRoZSBTdGF0dXMgQmFyIEdyYW1tYXIgTmFtZSBET00gbm9kZVxuICAgIG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZVRpbWVyID0gc2V0SW50ZXJ2YWwoQG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZS5iaW5kKEApLCAxMDAwKVxuICAgIGF1dG9Db21wbGV0ZVN0eWxlZENvbXBvbmVudHMubG9hZFByb3BlcnRpZXMoKVxuICAgIEB0cmFuc3BpbGVyID89IG5ldyAocmVxdWlyZSAnLi90cmFuc3BpbGVyJylcbiAgICBAdHRsR3JhbW1hciA9IG5ldyB0dGxHcmFtbWFyKHRydWUpXG4gICAgIyB0cmFjayBhbnkgZmlsZSBzYXZlIGV2ZW50cyBhbmQgdHJhbnNwaWxlIGlmIGJhYmVsXG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEB0ZXh0RWRpdG9ycyA9IHt9XG4gICAgQGZpbGVTYXZlVGltZXMgPSB7fVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZVBhY2thZ2UgQGlzUGFja2FnZUNvbXBhdGlibGVcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQHRyYW5zcGlsZXIuc3RvcFVudXNlZFRhc2tzKClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKHRleHRFZGl0b3IpID0+XG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0gPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0uYWRkIHRleHRFZGl0b3Iub2JzZXJ2ZUdyYW1tYXIgKGdyYW1tYXIpID0+XG4gICAgICAgICMgSW5zdGFudGlhdGUgaW5kZW50b3IgZm9yIGxhbmd1YWdlLWJhYmVsIGZpbGVzXG4gICAgICAgIGlmIHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnBhY2thZ2VOYW1lIGlzIExCXG4gICAgICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdPy5hdXRvSW5kZW50ID0gbmV3IEF1dG9JbmRlbnQodGV4dEVkaXRvcilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0ZXh0RWRpdG9yc1t0ZXh0RWRpdG9yLmlkXT8uYXV0b0luZGVudD8uZGVzdHJveSgpXG4gICAgICAgICAgZGVsZXRlIEB0ZXh0RWRpdG9yc1t0ZXh0RWRpdG9yLmlkXT8uYXV0b0luZGVudD9cblxuICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdLmFkZCB0ZXh0RWRpdG9yLm9uRGlkU2F2ZSAoZXZlbnQpID0+XG4gICAgICAgIGlmIHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnBhY2thZ2VOYW1lIGlzIExCXG4gICAgICAgICAgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKVxuICAgICAgICAgIGxhc3RTYXZlVGltZSA9IEBmaWxlU2F2ZVRpbWVzW2ZpbGVQYXRoXSA/IDBcbiAgICAgICAgICBAZmlsZVNhdmVUaW1lc1tmaWxlUGF0aF0gPSBEYXRlLm5vdygpXG4gICAgICAgICAgaWYgIChsYXN0U2F2ZVRpbWUgPCAoQGZpbGVTYXZlVGltZXNbZmlsZVBhdGhdIC0gSU5URVJGSUxFU0FWRVRJTUUpKVxuICAgICAgICAgICAgQHRyYW5zcGlsZXIudHJhbnNwaWxlKGZpbGVQYXRoLCB0ZXh0RWRpdG9yKVxuXG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0uYWRkIHRleHRFZGl0b3Iub25EaWREZXN0cm95ICgpID0+XG4gICAgICAgIEB0ZXh0RWRpdG9yc1t0ZXh0RWRpdG9yLmlkXT8uYXV0b0luZGVudD8uZGVzdHJveSgpXG4gICAgICAgIGRlbGV0ZSBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0/LmF1dG9JbmRlbnQ/XG4gICAgICAgIGZpbGVQYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKClcbiAgICAgICAgaWYgQGZpbGVTYXZlVGltZXNbZmlsZVBhdGhdPyB0aGVuIGRlbGV0ZSBAZmlsZVNhdmVUaW1lc1tmaWxlUGF0aF1cbiAgICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdLmRpc3Bvc2UoKVxuICAgICAgICBkZWxldGUgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICBmb3IgaWQsIGRpc3Bvc2VhYmxlIG9mIEB0ZXh0RWRpdG9yc1xuICAgICAgaWYgQHRleHRFZGl0b3JzW2lkXS5hdXRvSW5kZW50P1xuICAgICAgICBAdGV4dEVkaXRvcnNbaWRdLmF1dG9JbmRlbnQuZGVzdHJveSgpXG4gICAgICAgIGRlbGV0ZSBAdGV4dEVkaXRvcnNbaWRdLmF1dG9JbmRlbnRcbiAgICAgIGRpc3Bvc2VhYmxlLmRpc3Bvc2UoKVxuICAgIEB0cmFuc3BpbGVyLnN0b3BBbGxUcmFuc3BpbGVyVGFzaygpXG4gICAgQHRyYW5zcGlsZXIuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQHR0bEdyYW1tYXIuZGVzdHJveSgpXG4gICAgQG11dGF0ZVN0YXR1c0dyYW1tYXJOYW1lT2JzZXJ2ZXI/LmRpc2Nvbm5ldCgpXG5cbiAgIyB3YXJucyBpZiBhbiBhY3RpdmF0ZWQgcGFja2FnZSBpcyBvbiB0aGUgaW5jb21wYXRpYmxlIGxpc3RcbiAgaXNQYWNrYWdlQ29tcGF0aWJsZTogKGFjdGl2YXRlZFBhY2thZ2UpIC0+XG4gICAgaW5jb21wYXRpYmxlUGFja2FnZXMgPSB7XG4gICAgICAnc291cmNlLXByZXZpZXctYmFiZWwnOlxuICAgICAgICBcIkJvdGggdmllIHRvIHByZXZpZXcgdGhlIHNhbWUgZmlsZS5cIlxuICAgICAgJ3NvdXJjZS1wcmV2aWV3LXJlYWN0JzpcbiAgICAgICAgXCJCb3RoIHZpZSB0byBwcmV2aWV3IHRoZSBzYW1lIGZpbGUuXCJcbiAgICAgICdyZWFjdCc6XG4gICAgICAgIFwiVGhlIEF0b20gY29tbXVuaXR5IHBhY2thZ2UgJ3JlYWN0JyAobm90IHRvIGJlIGNvbmZ1c2VkXG4gICAgICAgIFxcbndpdGggRmFjZWJvb2sgUmVhY3QpIG1vbmtleSBwYXRjaGVzIHRoZSBhdG9tIG1ldGhvZHNcbiAgICAgICAgXFxudGhhdCBwcm92aWRlIGF1dG9pbmRlbnQgZmVhdHVyZXMgZm9yIEpTWC5cbiAgICAgICAgXFxuQXMgaXQgZGV0ZWN0cyBKU1ggc2NvcGVzIHdpdGhvdXQgcmVnYXJkIHRvIHRoZSBncmFtbWFyIGJlaW5nIHVzZWQsXG4gICAgICAgIFxcbml0IHRyaWVzIHRvIGF1dG8gaW5kZW50IEpTWCB0aGF0IGlzIGhpZ2hsaWdodGVkIGJ5IGxhbmd1YWdlLWJhYmVsLlxuICAgICAgICBcXG5BcyBsYW5ndWFnZS1iYWJlbCBhbHNvIGF0dGVtcHRzIHRvIGRvIGF1dG8gaW5kZW50YXRpb24gdXNpbmdcbiAgICAgICAgXFxuc3RhbmRhcmQgYXRvbSBBUEkncywgdGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGNvbmZsaWN0LlwiXG4gICAgfVxuXG4gICAgZm9yIGluY29tcGF0aWJsZVBhY2thZ2UsIHJlYXNvbiBvZiBpbmNvbXBhdGlibGVQYWNrYWdlc1xuICAgICAgaWYgYWN0aXZhdGVkUGFja2FnZS5uYW1lIGlzIGluY29tcGF0aWJsZVBhY2thZ2VcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gJ0luY29tcGF0aWJsZSBQYWNrYWdlIERldGVjdGVkJyxcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIGRldGFpbDogXCJsYW5ndWFnZS1iYWJlbCBoYXMgZGV0ZWN0ZWQgdGhlIHByZXNlbmNlIG9mIGFuXG4gICAgICAgICAgICAgICAgICBpbmNvbXBhdGlibGUgQXRvbSBwYWNrYWdlIG5hbWVkICcje2FjdGl2YXRlZFBhY2thZ2UubmFtZX0nLlxuICAgICAgICAgICAgICAgICAgXFxuIFxcbkl0IGlzIHJlY29tbWVuZGVkIHRoYXQgeW91IGRpc2FibGUgZWl0aGVyICcje2FjdGl2YXRlZFBhY2thZ2UubmFtZX0nIG9yIGxhbmd1YWdlLWJhYmVsXG4gICAgICAgICAgICAgICAgICBcXG4gXFxuUmVhc29uOlxcbiBcXG4je3JlYXNvbn1cIlxuXG4gICMgYXV0b2NvbXBsZXRlLXBsdXMgcHJvdmlkZXJzXG4gIGF1dG9Db21wbGV0ZVByb3ZpZGVyOiAtPlxuICAgIFthdXRvQ29tcGxldGVKU1gsIGF1dG9Db21wbGV0ZVN0eWxlZENvbXBvbmVudHMsIGF1dG9Db21wZXRlRW1tZXRDU1NdXG5cbiAgIyBwcmV2aWV3IHRyYW5waWxlIHByb3ZpZGVyXG4gIHByb3ZpZGU6LT5cbiAgICBAdHJhbnNwaWxlclxuXG5cbiAgIyBLbHVkZ2UgdG8gY2hhbmdlIHRoZSBncmFtbWFyIG5hbWUgaW4gdGhlIHN0YXR1cyBiYXIgZnJvbSBCYWJlbCBFUzYgSmF2YVNjaXB0IHRvIEJhYmVsXG4gICMgVGhlIGdyYW1tYXIgbmFtZSBzdGlsbCByZW1haW5zIHRoZSBzYW1lIGZvciBjb21wYXRpYmlsdHkgd2l0aCBvdGhlciBwYWNrYWdlcyBzdWNoIGFzIGF0b20tYmVhdXRpZnlcbiAgIyBidXQgaXMgbW9yZSBtZWFuaW5nZnVsIGFuZCBzaG9ydGVyIG9uIHRoZSBzdGF0dXMgYmFyLlxuICBvYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWU6IC0+XG4gICAgIyBzZWxlY3QgdGhlIHRhcmdldCBub2RlXG4gICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2dyYW1tYXItc2VsZWN0b3Itc3RhdHVzJyk7XG5cbiAgICAjIG9ubHkgcnVuIHRoaXMgZm9yIHNvIG1hbnkgY3ljbGVzIHdpdGhvdXQgZ2V0dGluZyBhIHZhbGlkIGRvbSBub2RlXG4gICAgaWYgKytvYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWVUaW1lckNhbGxlZCA+IDYwXG4gICAgICBjbGVhckludGVydmFsKG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZVRpbWVyKVxuICAgICAgb2JzZXJ2ZVN0YXR1c0JhckdyYW1tYXJOYW1lVGltZXJDYWxsZWQgPSAwXG5cbiAgICAjIG9ubHkgZXhwZWN0IGEgc2luZ2xlIGNoaWxkIChncmFtbWFyIG5hbWUpIGZvciB0aGlzIERPTSBOb2RlXG4gICAgaWYgdGFyZ2V0Lmxlbmd0aCBpcyAxXG4gICAgICB0YXJnZXQgPSB0YXJnZXRbMF0uY2hpbGROb2Rlcz9bMF1cblxuICAgICAgaWYgdGFyZ2V0XG4gICAgICAgICMgZG9uJ3QgcnVuIGFnYWluIGFzIHdlIGFyZSBub3cgb2JzZXJ2aW5nXG4gICAgICAgIGNsZWFySW50ZXJ2YWwob2JzZXJ2ZVN0YXR1c0JhckdyYW1tYXJOYW1lVGltZXIpXG5cbiAgICAgICAgQG11dGF0ZVN0YXR1c0JhckdyYW1tYXJOYW1lKHRhcmdldClcblxuICAgICAgICAjIGNyZWF0ZSBhbiBvYnNlcnZlciBpbnN0YW5jZVxuICAgICAgICBtdXRhdGVTdGF0dXNHcmFtbWFyTmFtZU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIgKG11dGF0aW9ucykgPT5cbiAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaCAgKG11dGF0aW9uKSA9PlxuICAgICAgICAgICAgICBAbXV0YXRlU3RhdHVzQmFyR3JhbW1hck5hbWUobXV0YXRpb24udGFyZ2V0KVxuXG4gICAgICAgICMgY29uZmlndXJhdGlvbiBvZiB0aGUgb2JzZXJ2ZXI6XG4gICAgICAgIGNvbmZpZyA9IHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiBmYWxzZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UgfVxuXG4gICAgICAgICMgcGFzcyBpbiB0aGUgdGFyZ2V0IG5vZGUsIGFzIHdlbGwgYXMgdGhlIG9ic2VydmVyIG9wdGlvbnNcbiAgICAgICAgbXV0YXRlU3RhdHVzR3JhbW1hck5hbWVPYnNlcnZlci5vYnNlcnZlKHRhcmdldCwgY29uZmlnKTtcblxuXG4gICMgY2hhbmdlIG5hbWUgaW4gc3RhdHVzIGJhclxuICBtdXRhdGVTdGF0dXNCYXJHcmFtbWFyTmFtZTogKGVsZW0pIC0+XG4gICAgaWYgZWxlbT8uaW5uZXJIVE1MIGlzICdCYWJlbCBFUzYgSmF2YVNjcmlwdCdcbiAgICAgIGVsZW0uaW5uZXJIVE1MID0gJ0JhYmVsJ1xuIl19
