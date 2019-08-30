(function() {
  var COMPLETIONS, JSXATTRIBUTE, JSXENDTAGSTART, JSXREGEXP, JSXSTARTTAGEND, JSXTAG, Point, REACTURL, Range, TAGREGEXP, filter, ref, ref1, score,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require("atom"), Range = ref.Range, Point = ref.Point;

  ref1 = require("fuzzaldrin"), filter = ref1.filter, score = ref1.score;

  JSXSTARTTAGEND = 0;

  JSXENDTAGSTART = 1;

  JSXTAG = 2;

  JSXATTRIBUTE = 3;

  JSXREGEXP = /(?:(<)|(<\/))([$_A-Za-z](?:[$._:\-a-zA-Z0-9])*)|(?:(\/>)|(>))/g;

  TAGREGEXP = /<([$_a-zA-Z][$._:\-a-zA-Z0-9]*)($|\s|\/>|>)/g;

  COMPLETIONS = require("./completions-jsx");

  REACTURL = "http://facebook.github.io/react/docs/tags-and-attributes.html";

  module.exports = {
    selector: ".meta.tag.jsx",
    inclusionPriority: 10000,
    excludeLowerPriority: false,
    getSuggestions: function(opts) {
      var attribute, bufferPosition, editor, elementObj, filteredAttributes, htmlElement, htmlElements, i, j, jsxRange, jsxTag, k, len, len1, len2, prefix, ref2, scopeDescriptor, startOfJSX, suggestions, tagName, tagNameStack;
      editor = opts.editor, bufferPosition = opts.bufferPosition, scopeDescriptor = opts.scopeDescriptor, prefix = opts.prefix;
      if (editor.getGrammar().packageName !== "language-babel") {
        return;
      }
      jsxTag = this.getTriggerTag(editor, bufferPosition);
      if (jsxTag == null) {
        return;
      }
      suggestions = [];
      if (jsxTag === JSXSTARTTAGEND) {
        startOfJSX = this.getStartOfJSX(editor, bufferPosition);
        jsxRange = new Range(startOfJSX, bufferPosition);
        tagNameStack = this.buildTagStack(editor, jsxRange);
        while ((tagName = tagNameStack.pop()) != null) {
          suggestions.push({
            snippet: "$1</" + tagName + ">",
            type: "tag",
            description: "language-babel tag closer"
          });
        }
      } else if (jsxTag === JSXENDTAGSTART) {
        startOfJSX = this.getStartOfJSX(editor, bufferPosition);
        jsxRange = new Range(startOfJSX, bufferPosition);
        tagNameStack = this.buildTagStack(editor, jsxRange);
        while ((tagName = tagNameStack.pop()) != null) {
          suggestions.push({
            snippet: tagName + ">",
            type: "tag",
            description: "language-babel tag closer"
          });
        }
      } else if (jsxTag === JSXTAG) {
        if (!/^[a-z]/g.exec(prefix)) {
          return;
        }
        htmlElements = filter(COMPLETIONS.htmlElements, prefix, {
          key: "name"
        });
        for (i = 0, len = htmlElements.length; i < len; i++) {
          htmlElement = htmlElements[i];
          if (score(htmlElement.name, prefix) < 0.07) {
            continue;
          }
          suggestions.push({
            snippet: htmlElement.name,
            type: "tag",
            description: "language-babel JSX supported elements",
            descriptionMoreURL: REACTURL
          });
        }
      } else if (jsxTag === JSXATTRIBUTE) {
        tagName = this.getThisTagName(editor, bufferPosition);
        if (tagName == null) {
          return;
        }
        ref2 = COMPLETIONS.htmlElements;
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          elementObj = ref2[j];
          if (elementObj.name === tagName) {
            break;
          }
        }
        elementObj.attributes = elementObj.attributes.concat(COMPLETIONS.globalAttributes);
        elementObj.attributes = elementObj.attributes.concat(COMPLETIONS.events);
        filteredAttributes = filter(elementObj.attributes, prefix, {
          key: "name"
        });
        for (k = 0, len2 = filteredAttributes.length; k < len2; k++) {
          attribute = filteredAttributes[k];
          if (score(attribute.name, prefix) < 0.07) {
            continue;
          }
          suggestions.push({
            snippet: attribute.name,
            type: "attribute",
            rightLabel: "<" + tagName + ">",
            description: "language-babel JSXsupported attributes/events",
            descriptionMoreURL: REACTURL
          });
        }
      } else {
        return;
      }
      return suggestions;
    },
    getThisTagName: function(editor, bufferPosition) {
      var column, match, matches, row, rowText, scopes;
      row = bufferPosition.row;
      column = null;
      while (row >= 0) {
        rowText = editor.lineTextForBufferRow(row);
        if (column == null) {
          rowText = rowText.substr(0, column = bufferPosition.column);
        }
        matches = [];
        while ((match = TAGREGEXP.exec(rowText)) !== null) {
          scopes = editor.scopeDescriptorForBufferPosition([row, match.index + 1]).getScopesArray();
          if (indexOf.call(scopes, "entity.name.tag.open.jsx") >= 0) {
            matches.push(match[1]);
          }
        }
        if (matches.length) {
          return matches.pop();
        } else {
          row--;
        }
      }
    },
    getTriggerTag: function(editor, bufferPosition) {
      var column, scopes;
      column = bufferPosition.column - 1;
      if (column >= 0) {
        scopes = editor.scopeDescriptorForBufferPosition([bufferPosition.row, column]).getScopesArray();
        if (indexOf.call(scopes, "entity.other.attribute-name.jsx") >= 0) {
          return JSXATTRIBUTE;
        }
        if (indexOf.call(scopes, "entity.name.tag.open.jsx") >= 0) {
          return JSXTAG;
        }
        if (indexOf.call(scopes, "JSXStartTagEnd") >= 0) {
          return JSXSTARTTAGEND;
        }
        if (indexOf.call(scopes, "JSXEndTagStart") >= 0) {
          return JSXENDTAGSTART;
        }
      }
    },
    getStartOfJSX: function(editor, bufferPosition) {
      var column, columnLen, row;
      row = bufferPosition.row;
      while (row >= 0) {
        if (indexOf.call(editor.scopeDescriptorForBufferPosition([row, 0]).getScopesArray(), "meta.tag.jsx") < 0) {
          break;
        }
        row--;
      }
      if (row < 0) {
        row = 0;
      }
      columnLen = editor.lineTextForBufferRow(row).length;
      column = 0;
      while (column < columnLen) {
        if (indexOf.call(editor.scopeDescriptorForBufferPosition([row, column]).getScopesArray(), "meta.tag.jsx") >= 0) {
          break;
        }
        column++;
      }
      if (column === columnLen) {
        row++;
        column = 0;
      }
      return new Point(row, column);
    },
    buildTagStack: function(editor, range) {
      var closedtag, line, match, matchColumn, matchPointEnd, matchPointStart, matchRange, row, scopes, tagNameStack;
      tagNameStack = [];
      row = range.start.row;
      while (row <= range.end.row) {
        line = editor.lineTextForBufferRow(row);
        if (row === range.end.row) {
          line = line.substr(0, range.end.column);
        }
        while ((match = JSXREGEXP.exec(line)) !== null) {
          matchColumn = match.index;
          matchPointStart = new Point(row, matchColumn);
          matchPointEnd = new Point(row, matchColumn + match[0].length - 1);
          matchRange = new Range(matchPointStart, matchPointEnd);
          if (range.intersectsWith(matchRange)) {
            scopes = editor.scopeDescriptorForBufferPosition([row, match.index]).getScopesArray();
            if (indexOf.call(scopes, "punctuation.definition.tag.jsx") < 0) {
              continue;
            }
            if (match[1] != null) {
              tagNameStack.push(match[3]);
            } else if (match[2] != null) {
              closedtag = tagNameStack.pop();
              if (closedtag !== match[3]) {
                tagNameStack.push(closedtag);
              }
            } else if (match[4] != null) {
              tagNameStack.pop();
            }
          }
        }
        row++;
      }
      return tagNameStack;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1jb21wbGV0ZS1qc3guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5SUFBQTtJQUFBOztFQUFBLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixPQUFrQixPQUFBLENBQVEsWUFBUixDQUFsQixFQUFDLG9CQUFELEVBQVM7O0VBR1QsY0FBQSxHQUFpQjs7RUFDakIsY0FBQSxHQUFpQjs7RUFDakIsTUFBQSxHQUFTOztFQUNULFlBQUEsR0FBZTs7RUFFZixTQUFBLEdBQVk7O0VBQ1osU0FBQSxHQUFhOztFQUNiLFdBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0VBQ2QsUUFBQSxHQUFXOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsZUFBVjtJQUNBLGlCQUFBLEVBQW1CLEtBRG5CO0lBRUEsb0JBQUEsRUFBc0IsS0FGdEI7SUFLQSxjQUFBLEVBQWdCLFNBQUMsSUFBRDtBQUNkLFVBQUE7TUFBQyxvQkFBRCxFQUFTLG9DQUFULEVBQXlCLHNDQUF6QixFQUEwQztNQUMxQyxJQUFVLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBbUIsQ0FBQyxXQUFwQixLQUFxQyxnQkFBL0M7QUFBQSxlQUFBOztNQUVBLE1BQUEsR0FBUyxJQUFDLENBQUEsYUFBRCxDQUFlLE1BQWYsRUFBdUIsY0FBdkI7TUFDVCxJQUFjLGNBQWQ7QUFBQSxlQUFBOztNQUdBLFdBQUEsR0FBYztNQUVkLElBQUcsTUFBQSxLQUFVLGNBQWI7UUFDRSxVQUFBLEdBQWEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmLEVBQXVCLGNBQXZCO1FBQ2IsUUFBQSxHQUFlLElBQUEsS0FBQSxDQUFNLFVBQU4sRUFBa0IsY0FBbEI7UUFDZixZQUFBLEdBQWUs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QUFaLEVBQWUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUF6QixFQURUOztBQUVBLGVBQU8sQ0FBRSxLQUFBLEdBQVEsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFmLENBQVYsQ0FBQSxLQUFxQyxJQUE1QztVQUNFLFdBQUEsR0FBYyxLQUFLLENBQUM7VUFDcEIsZUFBQSxHQUFzQixJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsV0FBWDtVQUN0QixhQUFBLEdBQW9CLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxXQUFBLEdBQWMsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLE1BQXZCLEdBQWdDLENBQTNDO1VBQ3BCLFVBQUEsR0FBaUIsSUFBQSxLQUFBLENBQU0sZUFBTixFQUF1QixhQUF2QjtVQUNqQixJQUFHLEtBQUssQ0FBQyxjQUFOLENBQXFCLFVBQXJCLENBQUg7WUFDRSxNQUFBLEdBQVMsTUFBTSxDQUFDLGdDQUFQLENBQXdDLENBQUMsR0FBRCxFQUFNLEtBQUssQ0FBQyxLQUFaLENBQXhDLENBQTJELENBQUMsY0FBNUQsQ0FBQTtZQUNULElBQVksYUFBd0MsTUFBeEMsRUFBQSxnQ0FBQSxLQUFaO0FBQUEsdUJBQUE7O1lBRUEsSUFBRyxnQkFBSDtjQUNFLFlBQVksQ0FBQyxJQUFiLENBQWtCLEtBQU0sQ0FBQSxDQUFBLENBQXhCLEVBREY7YUFBQSxNQUVLLElBQUcsZ0JBQUg7Y0FDSCxTQUFBLEdBQVksWUFBWSxDQUFDLEdBQWIsQ0FBQTtjQUNaLElBQUcsU0FBQSxLQUFlLEtBQU0sQ0FBQSxDQUFBLENBQXhCO2dCQUNFLFlBQVksQ0FBQyxJQUFiLENBQWtCLFNBQWxCLEVBREY7ZUFGRzthQUFBLE1BSUEsSUFBRyxnQkFBSDtjQUNILFlBQVksQ0FBQyxHQUFiLENBQUEsRUFERzthQVZQOztRQUxGO1FBaUJBLEdBQUE7TUFyQkY7YUFzQkE7SUF6QmEsQ0F0SGY7O0FBZkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgXCJhdG9tXCJcbntmaWx0ZXIsIHNjb3JlfSA9IHJlcXVpcmUgXCJmdXp6YWxkcmluXCJcblxuIyB0YWdzIHdlIGFyZSBpbnRlcmVzdGVkIGluIGFyZSBtYXJrZWQgYnkgdGhlIGdyYW1tYXJcbkpTWFNUQVJUVEFHRU5EID0gMFxuSlNYRU5EVEFHU1RBUlQgPSAxXG5KU1hUQUcgPSAyXG5KU1hBVFRSSUJVVEUgPSAzXG4jIHJlZ2V4IHRvIHNlYXJjaCBmb3IgdGFnIG9wZW4vY2xvc2UgdGFnIGFuZCBjbG9zZSB0YWdcbkpTWFJFR0VYUCA9IC8oPzooPCl8KDxcXC8pKShbJF9BLVphLXpdKD86WyQuXzpcXC1hLXpBLVowLTldKSopfCg/OihcXC8+KXwoPikpL2dcblRBR1JFR0VYUCA9ICAvPChbJF9hLXpBLVpdWyQuXzpcXC1hLXpBLVowLTldKikoJHxcXHN8XFwvPnw+KS9nXG5DT01QTEVUSU9OUyA9IHJlcXVpcmUgXCIuL2NvbXBsZXRpb25zLWpzeFwiXG5SRUFDVFVSTCA9IFwiaHR0cDovL2ZhY2Vib29rLmdpdGh1Yi5pby9yZWFjdC9kb2NzL3RhZ3MtYW5kLWF0dHJpYnV0ZXMuaHRtbFwiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc2VsZWN0b3I6IFwiLm1ldGEudGFnLmpzeFwiXG4gIGluY2x1c2lvblByaW9yaXR5OiAxMDAwMFxuICBleGNsdWRlTG93ZXJQcmlvcml0eTogZmFsc2VcblxuXG4gIGdldFN1Z2dlc3Rpb25zOiAob3B0cykgLT5cbiAgICB7ZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc2NvcGVEZXNjcmlwdG9yLCBwcmVmaXh9ID0gb3B0c1xuICAgIHJldHVybiBpZiBlZGl0b3IuZ2V0R3JhbW1hcigpLnBhY2thZ2VOYW1lIGlzbnQgXCJsYW5ndWFnZS1iYWJlbFwiXG5cbiAgICBqc3hUYWcgPSBAZ2V0VHJpZ2dlclRhZyBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uXG4gICAgcmV0dXJuIGlmIG5vdCBqc3hUYWc/XG5cbiAgICAjIGJ1aWxkIGF1dG9jb21wbGV0ZSBsaXN0XG4gICAgc3VnZ2VzdGlvbnMgPSBbXVxuXG4gICAgaWYganN4VGFnIGlzIEpTWFNUQVJUVEFHRU5EXG4gICAgICBzdGFydE9mSlNYID0gQGdldFN0YXJ0T2ZKU1ggZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgICAganN4UmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnRPZkpTWCwgYnVmZmVyUG9zaXRpb24pXG4gICAgICB0YWdOYW1lU3RhY2sgPSBAYnVpbGRUYWdTdGFjayhlZGl0b3IsIGpzeFJhbmdlKVxuICAgICAgd2hpbGUgKCB0YWdOYW1lID0gdGFnTmFtZVN0YWNrLnBvcCgpKT9cbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaFxuICAgICAgICAgIHNuaXBwZXQ6IFwiJDE8LyN7dGFnTmFtZX0+XCJcbiAgICAgICAgICB0eXBlOiBcInRhZ1wiXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwibGFuZ3VhZ2UtYmFiZWwgdGFnIGNsb3NlclwiXG5cbiAgICBlbHNlIGlmICBqc3hUYWcgaXMgSlNYRU5EVEFHU1RBUlRcbiAgICAgIHN0YXJ0T2ZKU1ggPSBAZ2V0U3RhcnRPZkpTWCBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uXG4gICAgICBqc3hSYW5nZSA9IG5ldyBSYW5nZShzdGFydE9mSlNYLCBidWZmZXJQb3NpdGlvbilcbiAgICAgIHRhZ05hbWVTdGFjayA9IEBidWlsZFRhZ1N0YWNrKGVkaXRvciwganN4UmFuZ2UpXG4gICAgICB3aGlsZSAoIHRhZ05hbWUgPSB0YWdOYW1lU3RhY2sucG9wKCkpP1xuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoXG4gICAgICAgICAgc25pcHBldDogXCIje3RhZ05hbWV9PlwiXG4gICAgICAgICAgdHlwZTogXCJ0YWdcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImxhbmd1YWdlLWJhYmVsIHRhZyBjbG9zZXJcIlxuXG4gICAgZWxzZSBpZiBqc3hUYWcgaXMgSlNYVEFHXG4gICAgICByZXR1cm4gaWYgbm90IC9eW2Etel0vZy5leGVjKHByZWZpeClcbiAgICAgIGh0bWxFbGVtZW50cyA9IGZpbHRlcihDT01QTEVUSU9OUy5odG1sRWxlbWVudHMsIHByZWZpeCwge2tleTogXCJuYW1lXCJ9KVxuICAgICAgZm9yIGh0bWxFbGVtZW50IGluIGh0bWxFbGVtZW50c1xuICAgICAgICBpZiBzY29yZShodG1sRWxlbWVudC5uYW1lLCBwcmVmaXgpIDwgMC4wNyB0aGVuIGNvbnRpbnVlXG4gICAgICAgIHN1Z2dlc3Rpb25zLnB1c2hcbiAgICAgICAgICBzbmlwcGV0OiBodG1sRWxlbWVudC5uYW1lXG4gICAgICAgICAgdHlwZTogXCJ0YWdcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImxhbmd1YWdlLWJhYmVsIEpTWCBzdXBwb3J0ZWQgZWxlbWVudHNcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogUkVBQ1RVUkxcblxuICAgIGVsc2UgaWYganN4VGFnIGlzIEpTWEFUVFJJQlVURVxuICAgICAgdGFnTmFtZSA9IEBnZXRUaGlzVGFnTmFtZSBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uXG4gICAgICByZXR1cm4gaWYgbm90IHRhZ05hbWU/XG4gICAgICBmb3IgZWxlbWVudE9iaiBpbiBDT01QTEVUSU9OUy5odG1sRWxlbWVudHNcbiAgICAgICAgaWYgZWxlbWVudE9iai5uYW1lIGlzIHRhZ05hbWUgdGhlbiBicmVha1xuICAgICAgZWxlbWVudE9iai5hdHRyaWJ1dGVzID0gZWxlbWVudE9iai5hdHRyaWJ1dGVzLmNvbmNhdCBDT01QTEVUSU9OUy5nbG9iYWxBdHRyaWJ1dGVzXG4gICAgICBlbGVtZW50T2JqLmF0dHJpYnV0ZXMgPSBlbGVtZW50T2JqLmF0dHJpYnV0ZXMuY29uY2F0IENPTVBMRVRJT05TLmV2ZW50c1xuICAgICAgZmlsdGVyZWRBdHRyaWJ1dGVzID0gZmlsdGVyKGVsZW1lbnRPYmouYXR0cmlidXRlcywgcHJlZml4LCB7a2V5OiBcIm5hbWVcIn0pXG4gICAgICBmb3IgYXR0cmlidXRlIGluIGZpbHRlcmVkQXR0cmlidXRlc1xuICAgICAgICBpZiBzY29yZShhdHRyaWJ1dGUubmFtZSwgcHJlZml4KSA8IDAuMDcgdGhlbiBjb250aW51ZVxuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoXG4gICAgICAgICAgc25pcHBldDogYXR0cmlidXRlLm5hbWVcbiAgICAgICAgICB0eXBlOiBcImF0dHJpYnV0ZVwiXG4gICAgICAgICAgcmlnaHRMYWJlbDogXCI8I3t0YWdOYW1lfT5cIlxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImxhbmd1YWdlLWJhYmVsIEpTWHN1cHBvcnRlZCBhdHRyaWJ1dGVzL2V2ZW50c1wiXG4gICAgICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBSRUFDVFVSTFxuXG4gICAgZWxzZSByZXR1cm5cbiAgICBzdWdnZXN0aW9uc1xuXG4gICMgZ2V0IHRhZ25hbWUgZm9yIHRoaXMgYXR0cmlidXRlXG4gIGdldFRoaXNUYWdOYW1lOiAoIGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgcm93ID0gYnVmZmVyUG9zaXRpb24ucm93XG4gICAgY29sdW1uID0gbnVsbFxuICAgIHdoaWxlIHJvdyA+PSAwXG4gICAgICByb3dUZXh0ID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgICAgIGlmIG5vdCBjb2x1bW4/XG4gICAgICAgIHJvd1RleHQgPSByb3dUZXh0LnN1YnN0ciAwLCBjb2x1bW4gPSBidWZmZXJQb3NpdGlvbi5jb2x1bW5cbiAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgd2hpbGUgKCggbWF0Y2ggPSBUQUdSRUdFWFAuZXhlYyhyb3dUZXh0KSkgaXNudCBudWxsIClcbiAgICAgICAgIyBzYXZlIHRoaXMgbWF0Y2ggaWYgaXQgYSB2YWxpZCB0YWdcbiAgICAgICAgc2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtyb3csIG1hdGNoLmluZGV4KzFdKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICAgIGlmIFwiZW50aXR5Lm5hbWUudGFnLm9wZW4uanN4XCIgaW4gc2NvcGVzIHRoZW4gbWF0Y2hlcy5wdXNoIG1hdGNoWzFdXG4gICAgICAjIHJldHVybiB0aGUgdGFnIHRoYXQgaXMgdGhlIGxhc3Qgb25lIGZvdW5kXG4gICAgICBpZiBtYXRjaGVzLmxlbmd0aFxuICAgICAgICByZXR1cm4gbWF0Y2hlcy5wb3AoKVxuICAgICAgZWxzZSByb3ctLVxuXG5cbiAgZ2V0VHJpZ2dlclRhZzogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgIyBKU1ggdGFnIHNjb3BlcyB3ZSBhcmUgaW50ZXJlc3RlZCBpbiBtYXkgYWxyZWFkeSBjbG9zZWQgb25jZSB0eXBlZFxuICAgICMgc28gd2UgaGF2ZSB0byBiYWNrdHJhY2sgYnkgb25lIGNoYXIgdG8gc2VlIGlmIHRoZXkgd2VyZSB0eXBlZFxuICAgIGNvbHVtbiA9IGJ1ZmZlclBvc2l0aW9uLmNvbHVtbi0xXG4gICAgaWYgY29sdW1uID49IDBcbiAgICAgIHNjb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUG9zaXRpb24ucm93LCBjb2x1bW5dKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICBpZiBcImVudGl0eS5vdGhlci5hdHRyaWJ1dGUtbmFtZS5qc3hcIiBpbiBzY29wZXMgdGhlbiByZXR1cm4gSlNYQVRUUklCVVRFXG4gICAgICBpZiBcImVudGl0eS5uYW1lLnRhZy5vcGVuLmpzeFwiIGluIHNjb3BlcyB0aGVuIHJldHVybiBKU1hUQUdcbiAgICAgIGlmIFwiSlNYU3RhcnRUYWdFbmRcIiBpbiBzY29wZXMgdGhlbiByZXR1cm4gSlNYU1RBUlRUQUdFTkRcbiAgICAgIGlmIFwiSlNYRW5kVGFnU3RhcnRcIiBpbiBzY29wZXMgdGhlbiByZXR1cm4gSlNYRU5EVEFHU1RBUlRcblxuXG4gICMgZmluZCBiZWdnaW5pbmcgb2YgSlNYIGluIGJ1ZmZlciBhbmQgcmV0dXJuIFBvaW50XG4gIGdldFN0YXJ0T2ZKU1g6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIHJvdyA9IGJ1ZmZlclBvc2l0aW9uLnJvd1xuICAgICMgZmluZCBwcmV2aW91cyBzdGFydCBvZiByb3cgdGhhdCBoYXMgbm8ganN4IHRhZ1xuICAgIHdoaWxlIHJvdyA+PSAwXG4gICAgICBicmVhayBpZiBcIm1ldGEudGFnLmpzeFwiIG5vdCBpbiBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgMF0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgIHJvdy0tXG4gICAgaWYgcm93IDwgMCB0aGVuIHJvdyA9IDBcbiAgICAjIG1heWJlIGpzeCBhcHBhZWFycyBsYXRlciBpbiByb3dcbiAgICBjb2x1bW5MZW4gPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KS5sZW5ndGhcbiAgICBjb2x1bW4gPSAwXG4gICAgd2hpbGUgY29sdW1uIDwgY29sdW1uTGVuXG4gICAgICBicmVhayBpZiBcIm1ldGEudGFnLmpzeFwiIGluIGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbcm93LCBjb2x1bW5dKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICBjb2x1bW4rK1xuICAgICMgYWRqdXN0IHJvdyBjb2x1bW4gaWYganN4IG5vdCBpbiB0aGlzIHJvdyBhdCBhbGxcbiAgICBpZiBjb2x1bW4gaXMgY29sdW1uTGVuXG4gICAgICByb3crK1xuICAgICAgY29sdW1uID0gMFxuICAgIG5ldyBQb2ludChyb3csIGNvbHVtbilcblxuICAjIGJ1aWxkIHN0YWNrIG9mIHRhZ25hbWVzIG9wZW5lZCBidXQgbm90IGNsb3NlZCBpbiBSYW5nZVxuICBidWlsZFRhZ1N0YWNrOiAoZWRpdG9yLCByYW5nZSkgLT5cbiAgICB0YWdOYW1lU3RhY2sgPSBbXVxuICAgIHJvdyA9IHJhbmdlLnN0YXJ0LnJvd1xuICAgIHdoaWxlIHJvdyA8PSByYW5nZS5lbmQucm93XG4gICAgICBsaW5lID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgaWYgcm93IGlzIHJhbmdlLmVuZC5yb3dcbiAgICAgICAgbGluZSA9IGxpbmUuc3Vic3RyIDAsIHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgIHdoaWxlICgoIG1hdGNoID0gSlNYUkVHRVhQLmV4ZWMobGluZSkpIGlzbnQgbnVsbCApXG4gICAgICAgIG1hdGNoQ29sdW1uID0gbWF0Y2guaW5kZXhcbiAgICAgICAgbWF0Y2hQb2ludFN0YXJ0ID0gbmV3IFBvaW50KHJvdywgbWF0Y2hDb2x1bW4pXG4gICAgICAgIG1hdGNoUG9pbnRFbmQgPSBuZXcgUG9pbnQocm93LCBtYXRjaENvbHVtbiArIG1hdGNoWzBdLmxlbmd0aCAtIDEpXG4gICAgICAgIG1hdGNoUmFuZ2UgPSBuZXcgUmFuZ2UobWF0Y2hQb2ludFN0YXJ0LCBtYXRjaFBvaW50RW5kKVxuICAgICAgICBpZiByYW5nZS5pbnRlcnNlY3RzV2l0aChtYXRjaFJhbmdlKVxuICAgICAgICAgIHNjb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbcm93LCBtYXRjaC5pbmRleF0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgICBjb250aW51ZSBpZiBcInB1bmN0dWF0aW9uLmRlZmluaXRpb24udGFnLmpzeFwiIG5vdCBpbiBzY29wZXNcbiAgICAgICAgICAjY2hlY2sgY2FwdHVyZSBncm91cHNcbiAgICAgICAgICBpZiBtYXRjaFsxXT8gIyB0YWdzIHN0YXJ0aW5nIDx0YWdcbiAgICAgICAgICAgIHRhZ05hbWVTdGFjay5wdXNoIG1hdGNoWzNdXG4gICAgICAgICAgZWxzZSBpZiBtYXRjaFsyXT8gIyB0YWdzIGVuZGluZyA8L3RhZ1xuICAgICAgICAgICAgY2xvc2VkdGFnID0gdGFnTmFtZVN0YWNrLnBvcCgpXG4gICAgICAgICAgICBpZiBjbG9zZWR0YWcgaXNudCBtYXRjaFszXVxuICAgICAgICAgICAgICB0YWdOYW1lU3RhY2sucHVzaCBjbG9zZWR0YWdcbiAgICAgICAgICBlbHNlIGlmIG1hdGNoWzRdPyAjIHRhZ3MgZW5kaW5nIC8+XG4gICAgICAgICAgICB0YWdOYW1lU3RhY2sucG9wKClcbiAgICAgIHJvdysrXG4gICAgdGFnTmFtZVN0YWNrXG4iXX0=
