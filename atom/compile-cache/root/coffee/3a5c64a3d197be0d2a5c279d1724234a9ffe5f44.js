(function() {
  var DidInsertText,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  module.exports = DidInsertText = (function() {
    function DidInsertText(editor) {
      this.editor = editor;
      this.insertText = bind(this.insertText, this);
      this.adviseBefore(this.editor, 'insertText', this.insertText);
    }

    DidInsertText.prototype.insertText = function(text, options) {
      if (this.editor.hasMultipleCursors()) {
        return true;
      }
      if (text === "\n") {
        if (!this.insertNewlineBetweenJSXTags()) {
          return false;
        }
        if (!this.insertNewlineAfterBacktick()) {
          return false;
        }
      } else if (text === "`") {
        if (!this.insertBackTick()) {
          return false;
        }
      }
      return true;
    };

    DidInsertText.prototype.bracketMatcherBackticks = function() {
      return atom.packages.isPackageActive("bracket-matcher") && atom.config.get("bracket-matcher.autocompleteBrackets") && indexOf.call(atom.config.get("bracket-matcher.autocompleteCharacters"), "``") >= 0;
    };

    DidInsertText.prototype.insertNewlineBetweenJSXTags = function() {
      var cursorBufferPosition, indentLength;
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      if (!(cursorBufferPosition.column > 0)) {
        return true;
      }
      if ('JSXEndTagStart' !== this.editor.scopeDescriptorForBufferPosition(cursorBufferPosition).getScopesArray().slice(-1).toString()) {
        return true;
      }
      cursorBufferPosition.column--;
      if ('JSXStartTagEnd' !== this.editor.scopeDescriptorForBufferPosition(cursorBufferPosition).getScopesArray().slice(-1).toString()) {
        return true;
      }
      indentLength = this.editor.indentationForBufferRow(cursorBufferPosition.row);
      this.editor.insertText("\n\n");
      this.editor.setIndentationForBufferRow(cursorBufferPosition.row + 1, indentLength + 1, {
        preserveLeadingWhitespace: false
      });
      this.editor.setIndentationForBufferRow(cursorBufferPosition.row + 2, indentLength, {
        preserveLeadingWhitespace: false
      });
      this.editor.moveUp();
      this.editor.moveToEndOfLine();
      return false;
    };

    DidInsertText.prototype.insertNewlineAfterBacktick = function() {
      var betweenBackTicks, cursorBufferPosition, indentLength;
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      if (!(cursorBufferPosition.column > 0)) {
        return true;
      }
      betweenBackTicks = 'punctuation.definition.quasi.end.js' === this.editor.scopeDescriptorForBufferPosition(cursorBufferPosition).getScopesArray().slice(-1).toString();
      cursorBufferPosition.column--;
      if ('punctuation.definition.quasi.begin.js' !== this.editor.scopeDescriptorForBufferPosition(cursorBufferPosition).getScopesArray().slice(-1).toString()) {
        return true;
      }
      indentLength = this.editor.indentationForBufferRow(cursorBufferPosition.row);
      if (!this.bracketMatcherBackticks()) {
        return true;
      }
      if (betweenBackTicks) {
        this.editor.insertText("\n\n");
        this.editor.setIndentationForBufferRow(cursorBufferPosition.row + 1, indentLength + 1, {
          preserveLeadingWhitespace: false
        });
        this.editor.setIndentationForBufferRow(cursorBufferPosition.row + 2, indentLength, {
          preserveLeadingWhitespace: false
        });
        this.editor.moveUp();
        this.editor.moveToEndOfLine();
      } else {
        this.editor.insertText("\n\t");
        this.editor.setIndentationForBufferRow(cursorBufferPosition.row + 1, indentLength + 1, {
          preserveLeadingWhitespace: false
        });
      }
      return false;
    };

    DidInsertText.prototype.insertBackTick = function() {
      var cursorBufferPosition, cursorPosition, selectedText;
      if (!this.bracketMatcherBackticks()) {
        return true;
      }
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      if ('punctuation.definition.quasi.begin.js' === this.editor.scopeDescriptorForBufferPosition(cursorBufferPosition).getScopesArray().slice(-1).toString()) {
        return true;
      }
      selectedText = this.editor.getSelectedText();
      cursorPosition = this.editor.getCursorBufferPosition();
      this.editor.insertText("`" + selectedText + "`");
      this.editor.setCursorBufferPosition(cursorPosition);
      this.editor.moveRight();
      return false;
    };

    DidInsertText.prototype.adviseBefore = function(object, methodName, advice) {
      var original;
      original = object[methodName];
      return object[methodName] = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (advice.apply(this, args) !== false) {
          return original.apply(this, args);
        }
      };
    };

    return DidInsertText;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvZGlkLWluc2VydC10ZXh0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsYUFBQTtJQUFBOzs7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHVCQUFDLE1BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDs7TUFDWixJQUFDLENBQUEsWUFBRCxDQUFjLElBQUMsQ0FBQSxNQUFmLEVBQXVCLFlBQXZCLEVBQXFDLElBQUMsQ0FBQSxVQUF0QztJQURXOzs0QkFJYixVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sT0FBUDtNQUNWLElBQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUFBLENBQWY7QUFBQSxlQUFPLEtBQVA7O01BRUEsSUFBSyxJQUFBLEtBQVEsSUFBYjtRQUNFLElBQUcsQ0FBQyxJQUFDLENBQUEsMkJBQUQsQ0FBQSxDQUFKO0FBQXdDLGlCQUFPLE1BQS9DOztRQUNBLElBQUcsQ0FBQyxJQUFDLENBQUEsMEJBQUQsQ0FBQSxDQUFKO0FBQXVDLGlCQUFPLE1BQTlDO1NBRkY7T0FBQSxNQUdLLElBQUssSUFBQSxLQUFRLEdBQWI7UUFDSCxJQUFHLENBQUMsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFKO0FBQTJCLGlCQUFPLE1BQWxDO1NBREc7O2FBRUw7SUFSVTs7NEJBV1osdUJBQUEsR0FBeUIsU0FBQTtBQUN2QixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixpQkFBOUIsQ0FBQSxJQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQ0FBaEIsQ0FESyxJQUVMLGFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdDQUFoQixDQUFSLEVBQUEsSUFBQTtJQUhxQjs7NEJBT3pCLDJCQUFBLEdBQTZCLFNBQUE7QUFDM0Is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LE1BQU8sQ0FBQSxVQUFBO2FBQ2xCLE1BQU8sQ0FBQSxVQUFBLENBQVAsR0FBcUIsU0FBQTtBQUNuQixZQUFBO1FBRG9CO1FBQ3BCLElBQU8sTUFBTSxDQUFDLEtBQVAsQ0FBYSxJQUFiLEVBQW1CLElBQW5CLENBQUEsS0FBNEIsS0FBbkM7aUJBQ0UsUUFBUSxDQUFDLEtBQVQsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBREY7O01BRG1CO0lBRlQ7Ozs7O0FBM0VoQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERpZEluc2VydFRleHRcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuICAgIEBhZHZpc2VCZWZvcmUoQGVkaXRvciwgJ2luc2VydFRleHQnLCBAaW5zZXJ0VGV4dClcblxuICAjIHBhdGNoZWQgVGV4dEVkaXRvcjo6aW5zZXJ0VGV4dFxuICBpbnNlcnRUZXh0OiAodGV4dCwgb3B0aW9ucykgPT5cbiAgICByZXR1cm4gdHJ1ZSBpZiBAZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpICMgZm9yIHRpbWUgYmVpbmdcblxuICAgIGlmICggdGV4dCBpcyBcIlxcblwiKVxuICAgICAgaWYgIUBpbnNlcnROZXdsaW5lQmV0d2VlbkpTWFRhZ3MoKSB0aGVuIHJldHVybiBmYWxzZVxuICAgICAgaWYgIUBpbnNlcnROZXdsaW5lQWZ0ZXJCYWNrdGljaygpIHRoZW4gcmV0dXJuIGZhbHNlXG4gICAgZWxzZSBpZiAoIHRleHQgaXMgXCJgXCIpXG4gICAgICBpZiAhQGluc2VydEJhY2tUaWNrKCkgdGhlbiByZXR1cm4gZmFsc2VcbiAgICB0cnVlXG5cbiAgIyBjaGVjayBicmFja2V0LW1hdGNoZXIgcGFja2FnZSBjb25maWcgdG8gZGV0ZXJtaW5lIGJhY2t0aWNrIGluc2VydGlvblxuICBicmFja2V0TWF0Y2hlckJhY2t0aWNrczogKCkgLT5cbiAgICByZXR1cm4gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUoXCJicmFja2V0LW1hdGNoZXJcIikgYW5kXG4gICAgICBhdG9tLmNvbmZpZy5nZXQoXCJicmFja2V0LW1hdGNoZXIuYXV0b2NvbXBsZXRlQnJhY2tldHNcIikgYW5kXG4gICAgICBcImBgXCIgaW4gYXRvbS5jb25maWcuZ2V0KFwiYnJhY2tldC1tYXRjaGVyLmF1dG9jb21wbGV0ZUNoYXJhY3RlcnNcIilcblxuICAjIGlmIGEgbmV3TGluZSBpcyBlbnRlcmVkIGJldHdlZW4gYSBKU1ggdGFnIG9wZW4gYW5kIGNsb3NlIG1hcmtlZF8gPGRpdj5fPC9kaXY+XG4gICMgdGhlbiBhZGQgYW5vdGhlciBuZXdMaW5lIGFuZCByZXBvc2l0aW9uIGN1cnNvclxuICBpbnNlcnROZXdsaW5lQmV0d2VlbkpTWFRhZ3M6ICgpIC0+XG4gICAgY3Vyc29yQnVmZmVyUG9zaXRpb24gPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgY3Vyc29yQnVmZmVyUG9zaXRpb24uY29sdW1uID4gMFxuICAgIHJldHVybiB0cnVlIHVubGVzcyAnSlNYRW5kVGFnU3RhcnQnIGlzIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oY3Vyc29yQnVmZmVyUG9zaXRpb24pLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpLnRvU3RyaW5nKClcbiAgICBjdXJzb3JCdWZmZXJQb3NpdGlvbi5jb2x1bW4tLVxuICAgIHJldHVybiB0cnVlIHVubGVzcyAnSlNYU3RhcnRUYWdFbmQnIGlzIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oY3Vyc29yQnVmZmVyUG9zaXRpb24pLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpLnRvU3RyaW5nKClcbiAgICBpbmRlbnRMZW5ndGggPSBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KGN1cnNvckJ1ZmZlclBvc2l0aW9uLnJvdylcbiAgICBAZWRpdG9yLmluc2VydFRleHQoXCJcXG5cXG5cIilcbiAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93IGN1cnNvckJ1ZmZlclBvc2l0aW9uLnJvdysxLCBpbmRlbnRMZW5ndGgrMSwgeyBwcmVzZXJ2ZUxlYWRpbmdXaGl0ZXNwYWNlOiBmYWxzZSB9XG4gICAgQGVkaXRvci5zZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyBjdXJzb3JCdWZmZXJQb3NpdGlvbi5yb3crMiwgaW5kZW50TGVuZ3RoLCB7IHByZXNlcnZlTGVhZGluZ1doaXRlc3BhY2U6IGZhbHNlIH1cbiAgICBAZWRpdG9yLm1vdmVVcCgpXG4gICAgQGVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuICAgIGZhbHNlXG5cbiAgIyBpZiBhIG5ld2xpbmUgaXMgZW50ZXJlZCBhZnRlciB0aGUgb3BlbmluZyBiYWNrdGlja1xuICAjIGluZGVudCBjdXJzb3IgYW5kIGFkZCBhIGNsb3NpbmcgYmFja3RpY2tcbiAgaW5zZXJ0TmV3bGluZUFmdGVyQmFja3RpY2s6ICgpIC0+XG4gICAgY3Vyc29yQnVmZmVyUG9zaXRpb24gPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgY3Vyc29yQnVmZmVyUG9zaXRpb24uY29sdW1uID4gMFxuICAgIGJldHdlZW5CYWNrVGlja3MgPSAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5lbmQuanMnIGlzIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oY3Vyc29yQnVmZmVyUG9zaXRpb24pLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpLnRvU3RyaW5nKClcbiAgICBjdXJzb3JCdWZmZXJQb3NpdGlvbi5jb2x1bW4tLVxuICAgIHJldHVybiB0cnVlIHVubGVzcyAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5iZWdpbi5qcycgaXMgQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihjdXJzb3JCdWZmZXJQb3NpdGlvbikuZ2V0U2NvcGVzQXJyYXkoKS5zbGljZSgtMSkudG9TdHJpbmcoKVxuICAgIGluZGVudExlbmd0aCA9IEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3coY3Vyc29yQnVmZmVyUG9zaXRpb24ucm93KVxuICAgIHJldHVybiB0cnVlIHVubGVzcyBAYnJhY2tldE1hdGNoZXJCYWNrdGlja3MoKVxuICAgIGlmIChiZXR3ZWVuQmFja1RpY2tzKVxuICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KFwiXFxuXFxuXCIpXG4gICAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93IGN1cnNvckJ1ZmZlclBvc2l0aW9uLnJvdysxLCBpbmRlbnRMZW5ndGgrMSwgeyBwcmVzZXJ2ZUxlYWRpbmdXaGl0ZXNwYWNlOiBmYWxzZSB9XG4gICAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93IGN1cnNvckJ1ZmZlclBvc2l0aW9uLnJvdysyLCBpbmRlbnRMZW5ndGgsIHsgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZTogZmFsc2UgfVxuICAgICAgQGVkaXRvci5tb3ZlVXAoKVxuICAgICAgQGVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuaW5zZXJ0VGV4dChcIlxcblxcdFwiKVxuICAgICAgQGVkaXRvci5zZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyBjdXJzb3JCdWZmZXJQb3NpdGlvbi5yb3crMSwgaW5kZW50TGVuZ3RoKzEsIHsgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZTogZmFsc2UgfVxuICAgIGZhbHNlXG5cbiAgIyB0aGUgYXRvbSBicmFja2V0IG1hdGNoZXIgZG9lc24ndCBjdXJyZW50bHkgKCB2MS4xNSkgYWRkIGEgY2xvc2luZyBiYWNrdGljayB3aGVuIHRoZSBvcGVuaW5nXG4gICMgYmFja3RpY2sgYXBwZWFycyBhZnRlciBhIHdvcmQgY2hhcmFjdGVyIGFzIGlzIHRoZSBjYXNlIGluIGEgdGFnbmFtZWBgIHNlcXVlbmNlXG4gICMgdGhpcyByZW1lZGllcyB0aGF0XG4gIGluc2VydEJhY2tUaWNrOiAoKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBAYnJhY2tldE1hdGNoZXJCYWNrdGlja3MoKVxuICAgIGN1cnNvckJ1ZmZlclBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgcmV0dXJuIHRydWUgaWYgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24ucXVhc2kuYmVnaW4uanMnIGlzIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oY3Vyc29yQnVmZmVyUG9zaXRpb24pLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpLnRvU3RyaW5nKClcbiAgICBzZWxlY3RlZFRleHQgPSBAZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG4gICAgY3Vyc29yUG9zaXRpb24gPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICBAZWRpdG9yLmluc2VydFRleHQoXCJgXCIgKyBzZWxlY3RlZFRleHQgKyBcImBcIilcbiAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKVxuICAgIEBlZGl0b3IubW92ZVJpZ2h0KClcbiAgICBmYWxzZVxuXG5cbiAgIyBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL3VuZGVyc2NvcmUtcGx1cy9ibG9iL21hc3Rlci9zcmMvdW5kZXJzY29yZS1wbHVzLmNvZmZlZVxuICBhZHZpc2VCZWZvcmU6IChvYmplY3QsIG1ldGhvZE5hbWUsIGFkdmljZSkgLT5cbiAgICBvcmlnaW5hbCA9IG9iamVjdFttZXRob2ROYW1lXVxuICAgIG9iamVjdFttZXRob2ROYW1lXSA9IChhcmdzLi4uKSAtPlxuICAgICAgdW5sZXNzIGFkdmljZS5hcHBseSh0aGlzLCBhcmdzKSA9PSBmYWxzZVxuICAgICAgICBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKVxuIl19
