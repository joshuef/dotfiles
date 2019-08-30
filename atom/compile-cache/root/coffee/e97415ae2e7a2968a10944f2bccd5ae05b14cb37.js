(function() {
  var AutoIndent, CompositeDisposable, INTERFILESAVETIME, LB, autoCompleteJSX, autoCompleteStyledComponents, observeStatusBarGrammarNameTimer, observeStatusBarGrammarNameTimerCalled, ttlGrammar;

  CompositeDisposable = require('atom').CompositeDisposable;

  autoCompleteJSX = require('./auto-complete-jsx');

  autoCompleteStyledComponents = require('./auto-complete-styled-components');

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
            var ref, ref1, ref2;
            if (textEditor.getGrammar().packageName === LB) {
              return _this.textEditors[textEditor.id].autoIndent = new AutoIndent(textEditor);
            } else {
              if ((ref = _this.textEditors[textEditor.id]) != null) {
                if ((ref1 = ref.autoIndent) != null) {
                  ref1.destroy();
                }
              }
              return delete (((ref2 = _this.textEditors[textEditor.id]) != null ? ref2.autoIndent : void 0) != null);
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
      return [autoCompleteJSX, autoCompleteStyledComponents];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBQ2xCLDRCQUFBLEdBQStCLE9BQUEsQ0FBUSxtQ0FBUjs7RUFDL0IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsc0JBQVI7O0VBRWIsaUJBQUEsR0FBb0I7O0VBQ3BCLEVBQUEsR0FBSzs7RUFDTCxnQ0FBQSxHQUFtQzs7RUFDbkMsc0NBQUEsR0FBeUM7O0VBRXpDLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxLQUFEO01BRVIsZ0NBQUEsR0FBbUMsV0FBQSxDQUFZLElBQUMsQ0FBQSwyQkFBMkIsQ0FBQyxJQUE3QixDQUFrQyxJQUFsQyxDQUFaLEVBQWtELElBQWxEO01BQ25DLDRCQUE0QixDQUFDLGNBQTdCLENBQUE7O1FBQ0EsSUFBQyxDQUFBLGFBQWMsSUFBSSxDQUFDLE9BQUEsQ0FBUSxjQUFSLENBQUQ7O01BQ25CLElBQUMsQ0FBQSxVQUFELEdBQWtCLElBQUEsVUFBQSxDQUFXLElBQVg7TUFFbEIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJO01BQ2xCLElBQUMsQ0FBQSxXQUFELEdBQWU7TUFDZixJQUFDLENBQUEsYUFBRCxHQUFpQjtNQUVqQixJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBZCxDQUFtQyxJQUFDLENBQUEsbUJBQXBDLENBQWhCO01BRUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWIsQ0FBOEIsQ0FB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QUFDLFNBQUQ7cUJBQ3JELFNBQVMsQ0FBQyxPQUFWLENBQW1CLFNBQUMsUUFBRDt1QkFDZixLQUFDLENBQUEsMEJBQUQsQ0FBNEIsUUFBUSxDQUFDLE1BQXJDO2NBRGUsQ0FBbkI7WUFEcUQ7VUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO1VBS3RDLE1BQUEsR0FBUztZQUFFLFVBQUEsRUFBWSxJQUFkO1lBQW9CLFNBQUEsRUFBVyxLQUEvQjtZQUFzQyxhQUFBLEVBQWUsS0FBckQ7O2lCQUdULCtCQUErQixDQUFDLE9BQWhDLENBQXdDLE1BQXhDLEVBQWdELE1BQWhELEVBZkY7U0FIRjs7SUFWMkIsQ0E3RjdCO0lBNkhBLDBCQUFBLEVBQTRCLFNBQUMsSUFBRDtNQUMxQixvQkFBRyxJQUFJLENBQUUsbUJBQU4sS0FBbUIsc0JBQXRCO2VBQ0UsSUFBSSxDQUFDLFNBQUwsR0FBaUIsUUFEbkI7O0lBRDBCLENBN0g1Qjs7QUFaRiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5hdXRvQ29tcGxldGVKU1ggPSByZXF1aXJlICcuL2F1dG8tY29tcGxldGUtanN4J1xuYXV0b0NvbXBsZXRlU3R5bGVkQ29tcG9uZW50cyA9IHJlcXVpcmUgJy4vYXV0by1jb21wbGV0ZS1zdHlsZWQtY29tcG9uZW50cydcbkF1dG9JbmRlbnQgPSByZXF1aXJlICcuL2F1dG8taW5kZW50J1xudHRsR3JhbW1hciA9IHJlcXVpcmUgJy4vY3JlYXRlLXR0bC1ncmFtbWFyJ1xuXG5JTlRFUkZJTEVTQVZFVElNRSA9IDEwMDBcbkxCID0gJ2xhbmd1YWdlLWJhYmVsJ1xub2JzZXJ2ZVN0YXR1c0JhckdyYW1tYXJOYW1lVGltZXIgPSBudWxsXG5vYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWVUaW1lckNhbGxlZCA9IDBcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgICMgcnVuIG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZSB1bnRpbCBBdG9tIGhhcyBjcmVhdGVkIHRoZSBTdGF0dXMgQmFyIEdyYW1tYXIgTmFtZSBET00gbm9kZVxuICAgIG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZVRpbWVyID0gc2V0SW50ZXJ2YWwoQG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZS5iaW5kKEApLCAxMDAwKVxuICAgIGF1dG9Db21wbGV0ZVN0eWxlZENvbXBvbmVudHMubG9hZFByb3BlcnRpZXMoKVxuICAgIEB0cmFuc3BpbGVyID89IG5ldyAocmVxdWlyZSAnLi90cmFuc3BpbGVyJylcbiAgICBAdHRsR3JhbW1hciA9IG5ldyB0dGxHcmFtbWFyKHRydWUpXG4gICAgIyB0cmFjayBhbnkgZmlsZSBzYXZlIGV2ZW50cyBhbmQgdHJhbnNwaWxlIGlmIGJhYmVsXG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEB0ZXh0RWRpdG9ycyA9IHt9XG4gICAgQGZpbGVTYXZlVGltZXMgPSB7fVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZVBhY2thZ2UgQGlzUGFja2FnZUNvbXBhdGlibGVcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQHRyYW5zcGlsZXIuc3RvcFVudXNlZFRhc2tzKClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKHRleHRFZGl0b3IpID0+XG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0gPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0uYWRkIHRleHRFZGl0b3Iub2JzZXJ2ZUdyYW1tYXIgKGdyYW1tYXIpID0+XG4gICAgICAgICMgSW5zdGFudGlhdGUgaW5kZW50b3IgZm9yIGxhbmd1YWdlLWJhYmVsIGZpbGVzXG4gICAgICAgIGlmIHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnBhY2thZ2VOYW1lIGlzIExCXG4gICAgICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdLmF1dG9JbmRlbnQgPSBuZXcgQXV0b0luZGVudCh0ZXh0RWRpdG9yKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdPy5hdXRvSW5kZW50Py5kZXN0cm95KClcbiAgICAgICAgICBkZWxldGUgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdPy5hdXRvSW5kZW50P1xuXG4gICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0uYWRkIHRleHRFZGl0b3Iub25EaWRTYXZlIChldmVudCkgPT5cbiAgICAgICAgaWYgdGV4dEVkaXRvci5nZXRHcmFtbWFyKCkucGFja2FnZU5hbWUgaXMgTEJcbiAgICAgICAgICBmaWxlUGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpXG4gICAgICAgICAgbGFzdFNhdmVUaW1lID0gQGZpbGVTYXZlVGltZXNbZmlsZVBhdGhdID8gMFxuICAgICAgICAgIEBmaWxlU2F2ZVRpbWVzW2ZpbGVQYXRoXSA9IERhdGUubm93KClcbiAgICAgICAgICBpZiAgKGxhc3RTYXZlVGltZSA8IChAZmlsZVNhdmVUaW1lc1tmaWxlUGF0aF0gLSBJTlRFUkZJTEVTQVZFVElNRSkpXG4gICAgICAgICAgICBAdHJhbnNwaWxlci50cmFuc3BpbGUoZmlsZVBhdGgsIHRleHRFZGl0b3IpXG5cbiAgICAgIEB0ZXh0RWRpdG9yc1t0ZXh0RWRpdG9yLmlkXS5hZGQgdGV4dEVkaXRvci5vbkRpZERlc3Ryb3kgKCkgPT5cbiAgICAgICAgQHRleHRFZGl0b3JzW3RleHRFZGl0b3IuaWRdPy5hdXRvSW5kZW50Py5kZXN0cm95KClcbiAgICAgICAgZGVsZXRlIEB0ZXh0RWRpdG9yc1t0ZXh0RWRpdG9yLmlkXT8uYXV0b0luZGVudD9cbiAgICAgICAgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKVxuICAgICAgICBpZiBAZmlsZVNhdmVUaW1lc1tmaWxlUGF0aF0/IHRoZW4gZGVsZXRlIEBmaWxlU2F2ZVRpbWVzW2ZpbGVQYXRoXVxuICAgICAgICBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF0uZGlzcG9zZSgpXG4gICAgICAgIGRlbGV0ZSBAdGV4dEVkaXRvcnNbdGV4dEVkaXRvci5pZF1cblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIGZvciBpZCwgZGlzcG9zZWFibGUgb2YgQHRleHRFZGl0b3JzXG4gICAgICBpZiBAdGV4dEVkaXRvcnNbaWRdLmF1dG9JbmRlbnQ/XG4gICAgICAgIEB0ZXh0RWRpdG9yc1tpZF0uYXV0b0luZGVudC5kZXN0cm95KClcbiAgICAgICAgZGVsZXRlIEB0ZXh0RWRpdG9yc1tpZF0uYXV0b0luZGVudFxuICAgICAgZGlzcG9zZWFibGUuZGlzcG9zZSgpXG4gICAgQHRyYW5zcGlsZXIuc3RvcEFsbFRyYW5zcGlsZXJUYXNrKClcbiAgICBAdHJhbnNwaWxlci5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAdHRsR3JhbW1hci5kZXN0cm95KClcbiAgICBAbXV0YXRlU3RhdHVzR3JhbW1hck5hbWVPYnNlcnZlcj8uZGlzY29ubmV0KClcblxuICAjIHdhcm5zIGlmIGFuIGFjdGl2YXRlZCBwYWNrYWdlIGlzIG9uIHRoZSBpbmNvbXBhdGlibGUgbGlzdFxuICBpc1BhY2thZ2VDb21wYXRpYmxlOiAoYWN0aXZhdGVkUGFja2FnZSkgLT5cbiAgICBpbmNvbXBhdGlibGVQYWNrYWdlcyA9IHtcbiAgICAgICdzb3VyY2UtcHJldmlldy1iYWJlbCc6XG4gICAgICAgIFwiQm90aCB2aWUgdG8gcHJldmlldyB0aGUgc2FtZSBmaWxlLlwiXG4gICAgICAnc291cmNlLXByZXZpZXctcmVhY3QnOlxuICAgICAgICBcIkJvdGggdmllIHRvIHByZXZpZXcgdGhlIHNhbWUgZmlsZS5cIlxuICAgICAgJ3JlYWN0JzpcbiAgICAgICAgXCJUaGUgQXRvbSBjb21tdW5pdHkgcGFja2FnZSAncmVhY3QnIChub3QgdG8gYmUgY29uZnVzZWRcbiAgICAgICAgXFxud2l0aCBGYWNlYm9vayBSZWFjdCkgbW9ua2V5IHBhdGNoZXMgdGhlIGF0b20gbWV0aG9kc1xuICAgICAgICBcXG50aGF0IHByb3ZpZGUgYXV0b2luZGVudCBmZWF0dXJlcyBmb3IgSlNYLlxuICAgICAgICBcXG5BcyBpdCBkZXRlY3RzIEpTWCBzY29wZXMgd2l0aG91dCByZWdhcmQgdG8gdGhlIGdyYW1tYXIgYmVpbmcgdXNlZCxcbiAgICAgICAgXFxuaXQgdHJpZXMgdG8gYXV0byBpbmRlbnQgSlNYIHRoYXQgaXMgaGlnaGxpZ2h0ZWQgYnkgbGFuZ3VhZ2UtYmFiZWwuXG4gICAgICAgIFxcbkFzIGxhbmd1YWdlLWJhYmVsIGFsc28gYXR0ZW1wdHMgdG8gZG8gYXV0byBpbmRlbnRhdGlvbiB1c2luZ1xuICAgICAgICBcXG5zdGFuZGFyZCBhdG9tIEFQSSdzLCB0aGlzIGNyZWF0ZXMgYSBwb3RlbnRpYWwgY29uZmxpY3QuXCJcbiAgICB9XG5cbiAgICBmb3IgaW5jb21wYXRpYmxlUGFja2FnZSwgcmVhc29uIG9mIGluY29tcGF0aWJsZVBhY2thZ2VzXG4gICAgICBpZiBhY3RpdmF0ZWRQYWNrYWdlLm5hbWUgaXMgaW5jb21wYXRpYmxlUGFja2FnZVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyAnSW5jb21wYXRpYmxlIFBhY2thZ2UgRGV0ZWN0ZWQnLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcImxhbmd1YWdlLWJhYmVsIGhhcyBkZXRlY3RlZCB0aGUgcHJlc2VuY2Ugb2YgYW5cbiAgICAgICAgICAgICAgICAgIGluY29tcGF0aWJsZSBBdG9tIHBhY2thZ2UgbmFtZWQgJyN7YWN0aXZhdGVkUGFja2FnZS5uYW1lfScuXG4gICAgICAgICAgICAgICAgICBcXG4gXFxuSXQgaXMgcmVjb21tZW5kZWQgdGhhdCB5b3UgZGlzYWJsZSBlaXRoZXIgJyN7YWN0aXZhdGVkUGFja2FnZS5uYW1lfScgb3IgbGFuZ3VhZ2UtYmFiZWxcbiAgICAgICAgICAgICAgICAgIFxcbiBcXG5SZWFzb246XFxuIFxcbiN7cmVhc29ufVwiXG5cbiAgIyBhdXRvY29tcGxldGUtcGx1cyBwcm92aWRlcnNcbiAgYXV0b0NvbXBsZXRlUHJvdmlkZXI6IC0+XG4gICAgW2F1dG9Db21wbGV0ZUpTWCwgYXV0b0NvbXBsZXRlU3R5bGVkQ29tcG9uZW50c11cblxuICAjIHByZXZpZXcgdHJhbnBpbGUgcHJvdmlkZXJcbiAgcHJvdmlkZTotPlxuICAgIEB0cmFuc3BpbGVyXG5cblxuICAjIEtsdWRnZSB0byBjaGFuZ2UgdGhlIGdyYW1tYXIgbmFtZSBpbiB0aGUgc3RhdHVzIGJhciBmcm9tIEJhYmVsIEVTNiBKYXZhU2NpcHQgdG8gQmFiZWxcbiAgIyBUaGUgZ3JhbW1hciBuYW1lIHN0aWxsIHJlbWFpbnMgdGhlIHNhbWUgZm9yIGNvbXBhdGliaWx0eSB3aXRoIG90aGVyIHBhY2thZ2VzIHN1Y2ggYXMgYXRvbS1iZWF1dGlmeVxuICAjIGJ1dCBpcyBtb3JlIG1lYW5pbmdmdWwgYW5kIHNob3J0ZXIgb24gdGhlIHN0YXR1cyBiYXIuXG4gIG9ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZTogLT5cbiAgICAjIHNlbGVjdCB0aGUgdGFyZ2V0IG5vZGVcbiAgICB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZ3JhbW1hci1zZWxlY3Rvci1zdGF0dXMnKTtcblxuICAgICMgb25seSBydW4gdGhpcyBmb3Igc28gbWFueSBjeWNsZXMgd2l0aG91dCBnZXR0aW5nIGEgdmFsaWQgZG9tIG5vZGVcbiAgICBpZiArK29ic2VydmVTdGF0dXNCYXJHcmFtbWFyTmFtZVRpbWVyQ2FsbGVkID4gNjBcbiAgICAgIGNsZWFySW50ZXJ2YWwob2JzZXJ2ZVN0YXR1c0JhckdyYW1tYXJOYW1lVGltZXIpXG4gICAgICBvYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWVUaW1lckNhbGxlZCA9IDBcblxuICAgICMgb25seSBleHBlY3QgYSBzaW5nbGUgY2hpbGQgKGdyYW1tYXIgbmFtZSkgZm9yIHRoaXMgRE9NIE5vZGVcbiAgICBpZiB0YXJnZXQubGVuZ3RoIGlzIDFcbiAgICAgIHRhcmdldCA9IHRhcmdldFswXS5jaGlsZE5vZGVzP1swXVxuXG4gICAgICBpZiB0YXJnZXRcbiAgICAgICAgIyBkb24ndCBydW4gYWdhaW4gYXMgd2UgYXJlIG5vdyBvYnNlcnZpbmdcbiAgICAgICAgY2xlYXJJbnRlcnZhbChvYnNlcnZlU3RhdHVzQmFyR3JhbW1hck5hbWVUaW1lcilcblxuICAgICAgICBAbXV0YXRlU3RhdHVzQmFyR3JhbW1hck5hbWUodGFyZ2V0KVxuXG4gICAgICAgICMgY3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlXG4gICAgICAgIG11dGF0ZVN0YXR1c0dyYW1tYXJOYW1lT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlciAobXV0YXRpb25zKSA9PlxuICAgICAgICAgIG11dGF0aW9ucy5mb3JFYWNoICAobXV0YXRpb24pID0+XG4gICAgICAgICAgICAgIEBtdXRhdGVTdGF0dXNCYXJHcmFtbWFyTmFtZShtdXRhdGlvbi50YXJnZXQpXG5cbiAgICAgICAgIyBjb25maWd1cmF0aW9uIG9mIHRoZSBvYnNlcnZlcjpcbiAgICAgICAgY29uZmlnID0geyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IGZhbHNlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSB9XG5cbiAgICAgICAgIyBwYXNzIGluIHRoZSB0YXJnZXQgbm9kZSwgYXMgd2VsbCBhcyB0aGUgb2JzZXJ2ZXIgb3B0aW9uc1xuICAgICAgICBtdXRhdGVTdGF0dXNHcmFtbWFyTmFtZU9ic2VydmVyLm9ic2VydmUodGFyZ2V0LCBjb25maWcpO1xuXG5cbiAgIyBjaGFuZ2UgbmFtZSBpbiBzdGF0dXMgYmFyXG4gIG11dGF0ZVN0YXR1c0JhckdyYW1tYXJOYW1lOiAoZWxlbSkgLT5cbiAgICBpZiBlbGVtPy5pbm5lckhUTUwgaXMgJ0JhYmVsIEVTNiBKYXZhU2NyaXB0J1xuICAgICAgZWxlbS5pbm5lckhUTUwgPSAnQmFiZWwnXG4iXX0=
