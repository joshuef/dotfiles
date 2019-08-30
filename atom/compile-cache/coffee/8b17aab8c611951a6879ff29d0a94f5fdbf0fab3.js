(function() {
  var continuationLine, emptyLine, objectLiteralLine;

  emptyLine = /^\s*$/;

  objectLiteralLine = /^\s*[\w'"]+\s*\:\s*/m;

  continuationLine = /[\{\(;,]\s*$/;

  module.exports = {
    activate: function(state) {
      atom.commands.add('atom-text-editor', {
        'es6-javascript:end-line': (function(_this) {
          return function() {
            return _this.endLine(';', false);
          };
        })(this)
      });
      atom.commands.add('atom-text-editor', {
        'es6-javascript:end-line-comma': (function(_this) {
          return function() {
            return _this.endLine(',', false);
          };
        })(this)
      });
      atom.commands.add('atom-text-editor', {
        'es6-javascript:end-new-line': (function(_this) {
          return function() {
            return _this.endLine('', true);
          };
        })(this)
      });
      return atom.commands.add('atom-text-editor', {
        'es6-javascript:wrap-block': (function(_this) {
          return function() {
            return _this.wrapBlock();
          };
        })(this)
      });
    },
    endLine: function(terminator, insertNewLine) {
      var editor;
      editor = atom.workspace.getActiveTextEditor();
      return editor.getCursors().forEach(function(cursor) {
        var line;
        line = cursor.getCurrentBufferLine();
        editor.moveToEndOfLine();
        if (!terminator) {
          terminator = objectLiteralLine.test(line) ? ',' : ';';
        }
        if (!continuationLine.test(line) && !emptyLine.test(line)) {
          editor.insertText(terminator);
        }
        if (insertNewLine) {
          return editor.insertNewlineBelow();
        }
      });
    },
    wrapBlock: function() {
      var editor, rangesToWrap;
      editor = atom.workspace.getActiveTextEditor();
      rangesToWrap = editor.getSelectedBufferRanges().filter(function(r) {
        return !r.isEmpty();
      });
      if (rangesToWrap.length) {
        rangesToWrap.sort(function(a, b) {
          if (a.start.row > b.start.row) {
            return -1;
          } else {
            return 1;
          }
        }).forEach(function(range) {
          var text;
          text = editor.getTextInBufferRange(range);
          if (/^\s*\{\s*/.test(text) && /\s*\}\s*/.test(text)) {
            return editor.setTextInBufferRange(range, text.replace(/\{\s*/, '').replace(/\s*\}/, ''));
          } else {
            return editor.setTextInBufferRange(range, '{\n' + text + '\n}');
          }
        });
        return editor.autoIndentSelectedRows();
      } else {
        editor.insertText('{\n\n}');
        editor.selectUp(2);
        editor.autoIndentSelectedRows();
        editor.moveRight();
        editor.moveUp();
        return editor.moveToEndOfLine();
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvZXM2LWphdmFzY3JpcHQvbGliL2VzNi1qYXZhc2NyaXB0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsU0FBQSxHQUFZOztFQUNaLGlCQUFBLEdBQW9COztFQUNwQixnQkFBQSxHQUFtQjs7RUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FFRTtJQUFBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQ0U7UUFBQSx5QkFBQSxFQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxPQUFELENBQVMsR0FBVCxFQUFjLEtBQWQ7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0I7T0FERjtNQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixrQkFBbEIsRUFDRTtRQUFBLCtCQUFBLEVBQWlDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE9BQUQsQ0FBUyxHQUFULEVBQWMsS0FBZDtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQztPQURGO01BRUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUNFO1FBQUEsNkJBQUEsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQsRUFBYSxJQUFiO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9CO09BREY7YUFFQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQ0U7UUFBQSwyQkFBQSxFQUE2QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxTQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7T0FERjtJQVBRLENBQVY7SUFVQSxPQUFBLEVBQVMsU0FBQyxVQUFELEVBQWEsYUFBYjtBQUNQLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO2FBQ1QsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLE9BQXBCLENBQTRCLFNBQUMsTUFBRDtBQUMxQixZQUFBO1FBQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUFBO1FBQ1AsTUFBTSxDQUFDLGVBQVAsQ0FBQTtRQUVBLElBQUcsQ0FBQyxVQUFKO1VBRUUsVUFBQSxHQUFnQixpQkFBaUIsQ0FBQyxJQUFsQixDQUF1QixJQUF2QixDQUFILEdBQXFDLEdBQXJDLEdBQThDLElBRjdEOztRQUlBLElBQWlDLENBQUMsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBRCxJQUFpQyxDQUFDLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixDQUFuRTtVQUFBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFVBQWxCLEVBQUE7O1FBQ0EsSUFBK0IsYUFBL0I7aUJBQUEsTUFBTSxDQUFDLGtCQUFQLENBQUEsRUFBQTs7TUFUMEIsQ0FBNUI7SUFGTyxDQVZUO0lBd0JBLFNBQUEsRUFBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7TUFDVCxZQUFBLEdBQWUsTUFBTSxDQUFDLHVCQUFQLENBQUEsQ0FBZ0MsQ0FBQyxNQUFqQyxDQUF3QyxTQUFDLENBQUQ7ZUFBTyxDQUFDLENBQUMsQ0FBQyxPQUFGLENBQUE7TUFBUixDQUF4QztNQUNmLElBQUcsWUFBWSxDQUFDLE1BQWhCO1FBQ0UsWUFBWSxDQUFDLElBQWIsQ0FBa0IsU0FBQyxDQUFELEVBQUksQ0FBSjtVQUNULElBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFSLEdBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUF6QjttQkFBa0MsQ0FBQyxFQUFuQztXQUFBLE1BQUE7bUJBQTBDLEVBQTFDOztRQURTLENBQWxCLENBRUMsQ0FBQyxPQUZGLENBRVUsU0FBQyxLQUFEO0FBQ1IsY0FBQTtVQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsS0FBNUI7VUFDUCxJQUFJLFdBQVcsQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBQUEsSUFBMEIsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBOUI7bUJBRUUsTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQTVCLEVBQW1DLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixFQUFzQixFQUF0QixDQUF5QixDQUFDLE9BQTFCLENBQWtDLE9BQWxDLEVBQTJDLEVBQTNDLENBQW5DLEVBRkY7V0FBQSxNQUFBO21CQUtFLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixLQUE1QixFQUFtQyxLQUFBLEdBQVEsSUFBUixHQUFlLEtBQWxELEVBTEY7O1FBRlEsQ0FGVjtlQVdBLE1BQU0sQ0FBQyxzQkFBUCxDQUFBLEVBWkY7T0FBQSxNQUFBO1FBZUUsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsUUFBbEI7UUFDQSxNQUFNLENBQUMsUUFBUCxDQUFnQixDQUFoQjtRQUNBLE1BQU0sQ0FBQyxzQkFBUCxDQUFBO1FBQ0EsTUFBTSxDQUFDLFNBQVAsQ0FBQTtRQUNBLE1BQU0sQ0FBQyxNQUFQLENBQUE7ZUFDQSxNQUFNLENBQUMsZUFBUCxDQUFBLEVBcEJGOztJQUhTLENBeEJYOztBQU5GIiwic291cmNlc0NvbnRlbnQiOlsiZW1wdHlMaW5lID0gL15cXHMqJC9cbm9iamVjdExpdGVyYWxMaW5lID0gL15cXHMqW1xcdydcIl0rXFxzKlxcOlxccyovbVxuY29udGludWF0aW9uTGluZSA9IC9bXFx7XFwoOyxdXFxzKiQvXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdlczYtamF2YXNjcmlwdDplbmQtbGluZSc6ID0+IEBlbmRMaW5lKCc7JywgZmFsc2UpXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ2VzNi1qYXZhc2NyaXB0OmVuZC1saW5lLWNvbW1hJzogPT4gQGVuZExpbmUoJywnLCBmYWxzZSlcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnZXM2LWphdmFzY3JpcHQ6ZW5kLW5ldy1saW5lJzogPT4gQGVuZExpbmUoJycsIHRydWUpXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ2VzNi1qYXZhc2NyaXB0OndyYXAtYmxvY2snOiA9PiBAd3JhcEJsb2NrKClcblxuICBlbmRMaW5lOiAodGVybWluYXRvciwgaW5zZXJ0TmV3TGluZSkgLT5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBlZGl0b3IuZ2V0Q3Vyc29ycygpLmZvckVhY2goKGN1cnNvcikgLT5cbiAgICAgIGxpbmUgPSBjdXJzb3IuZ2V0Q3VycmVudEJ1ZmZlckxpbmUoKVxuICAgICAgZWRpdG9yLm1vdmVUb0VuZE9mTGluZSgpXG5cbiAgICAgIGlmICF0ZXJtaW5hdG9yXG4gICAgICAgICMgZ3Vlc3MgdGhlIGJlc3QgdGVybWluYXRvclxuICAgICAgICB0ZXJtaW5hdG9yID0gaWYgb2JqZWN0TGl0ZXJhbExpbmUudGVzdChsaW5lKSB0aGVuICcsJyBlbHNlICc7J1xuXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCh0ZXJtaW5hdG9yKSBpZiAhY29udGludWF0aW9uTGluZS50ZXN0KGxpbmUpIGFuZCAhZW1wdHlMaW5lLnRlc3QobGluZSlcbiAgICAgIGVkaXRvci5pbnNlcnROZXdsaW5lQmVsb3coKSBpZiBpbnNlcnROZXdMaW5lXG4gICAgKVxuXG4gIHdyYXBCbG9jazogKCkgLT5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByYW5nZXNUb1dyYXAgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKS5maWx0ZXIoKHIpIC0+ICFyLmlzRW1wdHkoKSlcbiAgICBpZiByYW5nZXNUb1dyYXAubGVuZ3RoXG4gICAgICByYW5nZXNUb1dyYXAuc29ydCgoYSwgYikgLT5cbiAgICAgICAgcmV0dXJuIGlmIGEuc3RhcnQucm93ID4gYi5zdGFydC5yb3cgdGhlbiAtMSBlbHNlIDFcbiAgICAgICkuZm9yRWFjaCgocmFuZ2UpIC0+XG4gICAgICAgIHRleHQgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgIGlmICgvXlxccypcXHtcXHMqLy50ZXN0KHRleHQpICYmIC9cXHMqXFx9XFxzKi8udGVzdCh0ZXh0KSlcbiAgICAgICAgICAjIHVud3JhcCBlYWNoIHNlbGVjdGlvbiBmcm9tIGl0cyBibG9ja1xuICAgICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgdGV4dC5yZXBsYWNlKC9cXHtcXHMqLywgJycpLnJlcGxhY2UoL1xccypcXH0vLCAnJykpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAjIHdyYXAgZWFjaCBzZWxlY3Rpb24gaW4gYSBibG9ja1xuICAgICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgJ3tcXG4nICsgdGV4dCArICdcXG59JylcbiAgICAgIClcbiAgICAgIGVkaXRvci5hdXRvSW5kZW50U2VsZWN0ZWRSb3dzKClcbiAgICBlbHNlXG4gICAgICAjIGNyZWF0ZSBhbiBlbXB0eSBibG9jayBhdCBlYWNoIGN1cnNvclxuICAgICAgZWRpdG9yLmluc2VydFRleHQoJ3tcXG5cXG59JylcbiAgICAgIGVkaXRvci5zZWxlY3RVcCgyKVxuICAgICAgZWRpdG9yLmF1dG9JbmRlbnRTZWxlY3RlZFJvd3MoKVxuICAgICAgZWRpdG9yLm1vdmVSaWdodCgpXG4gICAgICBlZGl0b3IubW92ZVVwKClcbiAgICAgIGVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuIl19
