(function() {
  var CompositeDisposable;

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    activate: function() {
      this.disposables = new CompositeDisposable;
      atom.grammars.getGrammars().map((function(_this) {
        return function(grammar) {
          return _this.createCommand(grammar);
        };
      })(this));
      return this.disposables.add(atom.grammars.onDidAddGrammar((function(_this) {
        return function(grammar) {
          return _this.createCommand(grammar);
        };
      })(this)));
    },
    deactivate: function() {
      return this.disposables.dispose();
    },
    createCommand: function(grammar) {
      var workspaceElement;
      if ((grammar != null ? grammar.name : void 0) != null) {
        workspaceElement = atom.views.getView(atom.workspace);
        return this.disposables.add(atom.commands.add(workspaceElement, "set-syntax:" + grammar.name, function() {
          var editor;
          editor = atom.workspace.getActiveTextEditor();
          if (editor) {
            return atom.textEditors.setGrammarOverride(editor, grammar.scopeName);
          }
        }));
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9zZXQtc3ludGF4L2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUV4QixNQUFNLENBQUMsT0FBUCxHQUVFO0lBQUEsUUFBQSxFQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFFbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFkLENBQUEsQ0FBMkIsQ0FBQyxHQUE1QixDQUFnQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtpQkFDOUIsS0FBQyxDQUFBLGFBQUQsQ0FBZSxPQUFmO1FBRDhCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQzthQUdBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQ7aUJBQzdDLEtBQUMsQ0FBQSxhQUFELENBQWUsT0FBZjtRQUQ2QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUIsQ0FBakI7SUFOUSxDQUFWO0lBVUEsVUFBQSxFQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtJQURVLENBVlo7SUFnQkEsYUFBQSxFQUFlLFNBQUMsT0FBRDtBQUNiLFVBQUE7TUFBQSxJQUFHLGlEQUFIO1FBQ0UsZ0JBQUEsR0FBbUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUksQ0FBQyxTQUF4QjtlQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxhQUFBLEdBQWMsT0FBTyxDQUFDLElBQTFELEVBQWtFLFNBQUE7QUFDakYsY0FBQTtVQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7VUFDVCxJQUFHLE1BQUg7bUJBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBakIsQ0FBb0MsTUFBcEMsRUFBNEMsT0FBTyxDQUFDLFNBQXBELEVBREY7O1FBRmlGLENBQWxFLENBQWpCLEVBRkY7O0lBRGEsQ0FoQmY7O0FBSkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICMgUHVibGljOiBBY3RpdmF0ZXMgdGhlIHBhY2thZ2UuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCkubWFwIChncmFtbWFyKSA9PlxuICAgICAgQGNyZWF0ZUNvbW1hbmQoZ3JhbW1hcilcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIgKGdyYW1tYXIpID0+XG4gICAgICBAY3JlYXRlQ29tbWFuZChncmFtbWFyKVxuXG4gICMgUHVibGljOiBEZWFjdGl2YXRlcyB0aGUgcGFja2FnZS5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgIyBQcml2YXRlOiBDcmVhdGVzIHRoZSBjb21tYW5kIGZvciBhIGdpdmVuIHtHcmFtbWFyfS5cbiAgI1xuICAjICogYGdyYW1tYXJgIHtHcmFtbWFyfSB0aGUgY29tbWFuZCB3aWxsIGJlIGZvci5cbiAgY3JlYXRlQ29tbWFuZDogKGdyYW1tYXIpIC0+XG4gICAgaWYgZ3JhbW1hcj8ubmFtZT9cbiAgICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkIHdvcmtzcGFjZUVsZW1lbnQsIFwic2V0LXN5bnRheDoje2dyYW1tYXIubmFtZX1cIiwgLT5cbiAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICAgIGlmIGVkaXRvclxuICAgICAgICAgIGF0b20udGV4dEVkaXRvcnMuc2V0R3JhbW1hck92ZXJyaWRlKGVkaXRvciwgZ3JhbW1hci5zY29wZU5hbWUpXG4iXX0=
