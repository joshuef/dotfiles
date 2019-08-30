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
      var attribute, attributes, bufferPosition, editor, elementObj, filteredAttributes, htmlElement, htmlElements, i, j, jsxRange, jsxTag, k, len, len1, len2, prefix, ref2, scopeDescriptor, startOfJSX, suggestions, tagName, tagNameStack;
      editor = opts.editor, bufferPosition = opts.bufferPosition, scopeDescriptor = opts.scopeDescriptor, prefix = opts.prefix;
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
        attributes = elementObj.attributes.concat(COMPLETIONS.globalAttributes);
        attributes = attributes.concat(COMPLETIONS.events);
        filteredAttributes = filter(attributes, prefix, {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1jb21wbGV0ZS1qc3guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5SUFBQTtJQUFBOztFQUFBLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixPQUFrQixPQUFBLENBQVEsWUFBUixDQUFsQixFQUFDLG9CQUFELEVBQVM7O0VBR1QsY0FBQSxHQUFpQjs7RUFDakIsY0FBQSxHQUFpQjs7RUFDakIsTUFBQSxHQUFTOztFQUNULFlBQUEsR0FBZTs7RUFFZixTQUFBLEdBQVk7O0VBQ1osU0FBQSxHQUFhOztFQUNiLFdBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0VBQ2QsUUFBQSxHQUFXOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsZUFBVjtJQUNBLGlCQUFBLEVBQW1CLEtBRG5CO0lBRUEsb0JBQUEsRUFBc0IsS0FGdEI7SUFLQSxjQUFBLEVBQWdCLFNBQUMsSUFBRDtBQUNkLFVBQUE7TUFBQyxvQkFBRCxFQUFTLG9DQUFULEVBQXlCLHNDQUF6QixFQUEwQztNQUUxQyxNQUFBLEdBQVMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmLEVBQXVCLGNBQXZCO01BQ1QsSUFBYyxjQUFkO0FBQUEsZUFBQTs7TUFHQSxXQUFBLEdBQWM7TUFFZCxJQUFHLE1BQUEsS0FBVSxjQUFiO1FBQ0UsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQWUsTUFBZixFQUF1QixjQUF2QjtRQUNiLFFBQUEsR0FBZSxJQUFBLEtBQUEsQ0FBTSxVQUFOLEVBQWtCLGNBQWxCO1FBQ2YsWUFBQSxHQUFlLElBQUMsQ0FBQSxhQUFELENBQWUsTUFBZixFQUF1QixRQUF2QjtBQUNmLGVBQU0sc0NBQU47VUFDRSxXQUFXLENBQUMsSUFBWixDQUNFO1lBQUEsT0FBQSxFQUFTLE1BQUEsR0FBTyxPQUFQLEdBQWUsR0FBeEI7WUFDQSxJQUFBLEVBQU0sS0FETjtZQUVBLFdBQUEsRUFBYSwyQkFGYjtXQURGO1FBREYsQ0FKRjtPQUFBLE1BVUssSUFBSSxNQUFBLEtBQVUsY0FBZDtRQUNILFVBQUEsR0FBYSxJQUFDLENBQUEsYUFBRCxDQUFlLE1BQWYsRUFBdUIsY0FBdkI7UUFDYixRQUFBLEdBQWUsSUFBQSxLQUFBLENBQU0sVUFBTixFQUFrQixjQUFsQjtRQUNmLFlBQUEsR0FBZSxJQUFDLENBQUEsYUFBRCxDQUFlLE1BQWYsRUFBdUIsUUFBdkI7QUFDZixlQUFNLHNDQUFOO1VBQ0UsV0FBVyxDQUFDLElBQVosQ0FDRTtZQUFBLE9BQUEsRUFBWSxPQUFELEdBQVMsR0FBcEI7WUFDQSxJQUFBLEVBQU0sS0FETjtZQUVBLFdBQUEsRUFBYSwyQkFGYjtXQURGO1FBREYsQ0FKRztPQUFBLE1BVUEsSUFBRyxNQUFBLEtBQVUsTUFBYjtRQUNILElBQVUsQ0FBSSxTQUFTLENBQUMsSUFBVixDQUFlLE1BQWYsQ0FBZDtBQUFBLGlCQUFBOztRQUNBLFlBQUEsR0FBZSxNQUFBLENBQU8sV0FBVyxDQUFDLFlBQW5CLEVBQWlDLE1BQWpDLEVBQXlDO1VBQUMsR0FBQSxFQUFLLE1BQU47U0FBekM7QUFDZixhQUFBLDhDQUFBOztVQUNFLElBQUcsS0FBQSxDQUFNLFdBQVcsQ0FBQyxJQUFsQixFQUF3QixNQUF4QixDQUFBLEdBQWtDLElBQXJDO0FBQStDLHFCQUEvQzs7VUFDQSxXQUFXLENBQUMsSUFBWixDQUNFO1lBQUEsT0FBQSxFQUFTLFdBQVcsQ0FBQyxJQUFyQjtZQUNBLElBQUEsRUFBTSxLQUROO1lBRUEsV0FBQSxFQUFhLHVDQUZiO1lBR0Esa0JBQUEsRUFBb0IsUUFIcEI7V0FERjtBQUZGLFNBSEc7T0FBQSxNQVdBLElBQUcsTUFBQSxLQUFVLFlBQWI7UUFDSCxPQUFBLEdBQVUsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsRUFBd0IsY0FBeEI7UUFDVixJQUFjLGVBQWQ7QUFBQSxpQkFBQTs7QUFDQTtBQUFBLGFBQUEsd0NBQUE7O1VBQ0UsSUFBRyxVQUFVLENBQUMsSUFBWCxLQUFtQixPQUF0QjtBQUFtQyxrQkFBbkM7O0FBREY7UUFFQSxVQUFBLEdBQWEsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUF0QixDQUE2QixXQUFXLENBQUMsZ0JBQXpDO1FBQ2IsVUFBQSxHQUFhLFVBQVUsQ0FBQyxNQUFYLENBQWtCLFdBQVcsQ0FBQyxNQUE5QjtRQUNiLGtCQUFBLEdBQXFCLE1BQUEsQ0FBTyxVQUFQLEVBQW1CLE1BQW5CLEVBQTJCO1VBQUMsR0FBQSxFQUFLLE1BQU47U0FBM0I7QUFDckIsYUFBQSxzREFBQTs7VUFDRSxJQUFHLEtBQUEsQ0FBTSxTQUFTLENBQUMsSUFBaEIsRUFBc0IsTUFBdEIsQ0FBQSxHQUFnQyxJQUFuQztBQUE2QyxxQkFBN0M7O1VBQ0EsV0FBVyxDQUFDLElBQVosQ0FDRTtZQUFBLE9BQUEsRUFBUyxTQUFTLENBQUMsSUFBbkI7WUFDQSxJQUFBLEVBQU0sV0FETjtZQUVBLFVBQUEsRUFBWSxHQUFBLEdBQUksT0FBSixHQUFZLEdBRnhCO1lBR0EsV0FBQSxFQUFhLCtDQUhiO1lBSUEsa0JBQUEsRUFBb0IsUUFKcEI7V0FERjtBQUZGLFNBUkc7T0FBQSxNQUFBO0FBaUJBLGVBakJBOzthQWtCTDtJQTFEYyxDQUxoQjtJQWtFQSxjQUFBLEVBQWdCLFNBQUUsTUFBRixFQUFVLGNBQVY7QUFDZCxVQUFBO01BQUEsR0FBQSxHQUFNLGNBQWMsQ0FBQztNQUNyQixNQUFBLEdBQVM7QUFDVCxhQUFNLEdBQUEsSUFBTyxDQUFiO1FBQ0UsT0FBQSxHQUFVLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixHQUE1QjtRQUNWLElBQU8sY0FBUDtVQUNFLE9BQUEsR0FBVSxPQUFPLENBQUMsTUFBUixDQUFlLENBQWYsRUFBa0IsTUFBQSxHQUFTLGNBQWMsQ0FBQyxNQUExQyxFQURaOztRQUVBLE9BQUEsR0FBVTtBQUNWLGVBQU8sQ0FBRSxLQUFBLEdBQVEsU0FBUyxDQUFDLElBQVYsQ0FBZSxPQUFmLENBQVYsQ0FBQSxLQUF3QyxJQUEvQztVQUVFLE1BQUEsR0FBUyxNQUFNLENBQUMsZ0NBQVAsQ0FBd0MsQ0FBQyxHQUFELEVBQU0sS0FBSyxDQUFDLEtBQU4sR0FBWSxDQUFsQixDQUF4QyxDQUE2RCxDQUFDLGNBQTlELENBQUE7VUFDVCxJQUFHLGFBQThCLE1BQTlCLEVBQUEsMEJBQUEsTUFBSDtZQUE2QyxPQUFPLENBQUMsSUFBUixDQUFhLEtBQU0sQ0FBQSxDQUFBLENBQW5CLEVBQTdDOztRQUhGO1FBS0EsSUFBRyxPQUFPLENBQUMsTUFBWDtBQUNFLGlCQUFPLE9BQU8sQ0FBQyxHQUFSLENBQUEsRUFEVDtTQUFBLE1BQUE7VUFFSyxHQUFBLEdBRkw7O01BVkY7SUFIYyxDQWxFaEI7SUFvRkEsYUFBQSxFQUFlLFNBQUMsTUFBRCxFQUFTLGNBQVQ7QUFHYixVQUFBO01BQUEsTUFBQSxHQUFTLGNBQWMsQ0FBQyxNQUFmLEdBQXNCO01BQy9CLElBQUcsTUFBQSxJQUFVLENBQWI7UUFDRSxNQUFBLEdBQVMsTUFBTSxDQUFDLGdDQUFQLENBQXdDLENBQUMsY0FBYyxDQUFDLEdBQWhCLEVBQXFCLE1BQXJCLENBQXhDLENBQXFFLENBQUMsY0FBdEUsQ0FBQTtRQUNULElBQUcsYUFBcUMsTUFBckMsRUFBQSxpQ0FBQSxNQUFIO0FBQW9ELGlCQUFPLGFBQTNEOztRQUNBLElBQUcsYUFBOEIsTUFBOUIsRUFBQSwwQkFBQSxNQUFIO0FBQTZDLGlCQUFPLE9BQXBEOztRQUNBLElBQUcsYUFBb0IsTUFBcEIsRUFBQSxnQkFBQSxNQUFIO0FBQW1DLGlCQUFPLGVBQTFDOztRQUNBLElBQUcsYUFBb0IsTUFBcEIsRUFBQSxnQkFBQSxNQUFIO0FBQW1DLGlCQUFPLGVBQTFDO1NBTEY7O0lBSmEsQ0FwRmY7SUFpR0EsYUFBQSxFQUFlLFNBQUMsTUFBRCxFQUFTLGNBQVQ7QUFDYixVQUFBO01BQUEsR0FBQSxHQUFNLGNBQWMsQ0FBQztBQUVyQixhQUFNLEdBQUEsSUFBTyxDQUFiO1FBQ0UsSUFBUyxhQUFzQixNQUFNLENBQUMsZ0NBQVAsQ0FBd0MsQ0FBQyxHQUFELEVBQU0sQ0FBTixDQUF4QyxDQUFpRCxDQUFDLGNBQWxELENBQUEsQ0FBdEIsRUFBQSxjQUFBLEtBQVQ7QUFBQSxnQkFBQTs7UUFDQSxHQUFBO01BRkY7TUFHQSxJQUFHLEdBQUEsR0FBTSxDQUFUO1FBQWdCLEdBQUEsR0FBTSxFQUF0Qjs7TUFFQSxTQUFBLEdBQVksTUFBTSxDQUFDLG9CQUFQLENBQTRCLEdBQTVCLENBQWdDLENBQUM7TUFDN0MsTUFBQSxHQUFTO0FBQ1QsYUFBTSxNQUFBLEdBQVMsU0FBZjtRQUNFLElBQVMsYUFBa0IsTUFBTSxDQUFDLGdDQUFQLENBQXdDLENBQUMsR0FBRCxFQUFNLE1BQU4sQ0FBeEMsQ0FBc0QsQ0FBQyxjQUF2RCxDQUFBLENBQWxCLEVBQUEsY0FBQSxNQUFUO0FBQUEsZ0JBQUE7O1FBQ0EsTUFBQTtNQUZGO01BSUEsSUFBRyxNQUFBLEtBQVUsU0FBYjtRQUNFLEdBQUE7UUFDQSxNQUFBLEdBQVMsRUFGWDs7YUFHSSxJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsTUFBWDtJQWpCUyxDQWpHZjtJQXFIQSxhQUFBLEVBQWUsU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNiLFVBQUE7TUFBQSxZQUFBLEdBQWU7TUFDZixHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNsQixhQUFNLEdBQUEsSUFBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQXZCO1FBQ0UsSUFBQSxHQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixHQUE1QjtRQUNQLElBQUcsR0FBQSxLQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBcEI7VUFDRSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFaLEVBQWUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUF6QixFQURUOztBQUVBLGVBQU8sQ0FBRSxLQUFBLEdBQVEsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFmLENBQVYsQ0FBQSxLQUFxQyxJQUE1QztVQUNFLFdBQUEsR0FBYyxLQUFLLENBQUM7VUFDcEIsZUFBQSxHQUFzQixJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsV0FBWDtVQUN0QixhQUFBLEdBQW9CLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxXQUFBLEdBQWMsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLE1BQXZCLEdBQWdDLENBQTNDO1VBQ3BCLFVBQUEsR0FBaUIsSUFBQSxLQUFBLENBQU0sZUFBTixFQUF1QixhQUF2QjtVQUNqQixJQUFHLEtBQUssQ0FBQyxjQUFOLENBQXFCLFVBQXJCLENBQUg7WUFDRSxNQUFBLEdBQVMsTUFBTSxDQUFDLGdDQUFQLENBQXdDLENBQUMsR0FBRCxFQUFNLEtBQUssQ0FBQyxLQUFaLENBQXhDLENBQTJELENBQUMsY0FBNUQsQ0FBQTtZQUNULElBQVksYUFBd0MsTUFBeEMsRUFBQSxnQ0FBQSxLQUFaO0FBQUEsdUJBQUE7O1lBRUEsSUFBRyxnQkFBSDtjQUNFLFlBQVksQ0FBQyxJQUFiLENBQWtCLEtBQU0sQ0FBQSxDQUFBLENBQXhCLEVBREY7YUFBQSxNQUVLLElBQUcsZ0JBQUg7Y0FDSCxTQUFBLEdBQVksWUFBWSxDQUFDLEdBQWIsQ0FBQTtjQUNaLElBQUcsU0FBQSxLQUFlLEtBQU0sQ0FBQSxDQUFBLENBQXhCO2dCQUNFLFlBQVksQ0FBQyxJQUFiLENBQWtCLFNBQWxCLEVBREY7ZUFGRzthQUFBLE1BSUEsSUFBRyxnQkFBSDtjQUNILFlBQVksQ0FBQyxHQUFiLENBQUEsRUFERzthQVZQOztRQUxGO1FBaUJBLEdBQUE7TUFyQkY7YUFzQkE7SUF6QmEsQ0FySGY7O0FBZkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgXCJhdG9tXCJcbntmaWx0ZXIsIHNjb3JlfSA9IHJlcXVpcmUgXCJmdXp6YWxkcmluXCJcblxuIyB0YWdzIHdlIGFyZSBpbnRlcmVzdGVkIGluIGFyZSBtYXJrZWQgYnkgdGhlIGdyYW1tYXJcbkpTWFNUQVJUVEFHRU5EID0gMFxuSlNYRU5EVEFHU1RBUlQgPSAxXG5KU1hUQUcgPSAyXG5KU1hBVFRSSUJVVEUgPSAzXG4jIHJlZ2V4IHRvIHNlYXJjaCBmb3IgdGFnIG9wZW4vY2xvc2UgdGFnIGFuZCBjbG9zZSB0YWdcbkpTWFJFR0VYUCA9IC8oPzooPCl8KDxcXC8pKShbJF9BLVphLXpdKD86WyQuXzpcXC1hLXpBLVowLTldKSopfCg/OihcXC8+KXwoPikpL2dcblRBR1JFR0VYUCA9ICAvPChbJF9hLXpBLVpdWyQuXzpcXC1hLXpBLVowLTldKikoJHxcXHN8XFwvPnw+KS9nXG5DT01QTEVUSU9OUyA9IHJlcXVpcmUgXCIuL2NvbXBsZXRpb25zLWpzeFwiXG5SRUFDVFVSTCA9IFwiaHR0cDovL2ZhY2Vib29rLmdpdGh1Yi5pby9yZWFjdC9kb2NzL3RhZ3MtYW5kLWF0dHJpYnV0ZXMuaHRtbFwiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc2VsZWN0b3I6IFwiLm1ldGEudGFnLmpzeFwiXG4gIGluY2x1c2lvblByaW9yaXR5OiAxMDAwMFxuICBleGNsdWRlTG93ZXJQcmlvcml0eTogZmFsc2VcblxuXG4gIGdldFN1Z2dlc3Rpb25zOiAob3B0cykgLT5cbiAgICB7ZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc2NvcGVEZXNjcmlwdG9yLCBwcmVmaXh9ID0gb3B0c1xuXG4gICAganN4VGFnID0gQGdldFRyaWdnZXJUYWcgZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgIHJldHVybiBpZiBub3QganN4VGFnP1xuXG4gICAgIyBidWlsZCBhdXRvY29tcGxldGUgbGlzdFxuICAgIHN1Z2dlc3Rpb25zID0gW11cblxuICAgIGlmIGpzeFRhZyBpcyBKU1hTVEFSVFRBR0VORFxuICAgICAgc3RhcnRPZkpTWCA9IEBnZXRTdGFydE9mSlNYIGVkaXRvciwgYnVmZmVyUG9zaXRpb25cbiAgICAgIGpzeFJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0T2ZKU1gsIGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgdGFnTmFtZVN0YWNrID0gQGJ1aWxkVGFnU3RhY2soZWRpdG9yLCBqc3hSYW5nZSlcbiAgICAgIHdoaWxlICggdGFnTmFtZSA9IHRhZ05hbWVTdGFjay5wb3AoKSk/XG4gICAgICAgIHN1Z2dlc3Rpb25zLnB1c2hcbiAgICAgICAgICBzbmlwcGV0OiBcIiQxPC8je3RhZ05hbWV9PlwiXG4gICAgICAgICAgdHlwZTogXCJ0YWdcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImxhbmd1YWdlLWJhYmVsIHRhZyBjbG9zZXJcIlxuXG4gICAgZWxzZSBpZiAganN4VGFnIGlzIEpTWEVORFRBR1NUQVJUXG4gICAgICBzdGFydE9mSlNYID0gQGdldFN0YXJ0T2ZKU1ggZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgICAganN4UmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnRPZkpTWCwgYnVmZmVyUG9zaXRpb24pXG4gICAgICB0YWdOYW1lU3RhY2sgPSBAYnVpbGRUYWdTdGFjayhlZGl0b3IsIGpzeFJhbmdlKVxuICAgICAgd2hpbGUgKCB0YWdOYW1lID0gdGFnTmFtZVN0YWNrLnBvcCgpKT9cbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaFxuICAgICAgICAgIHNuaXBwZXQ6IFwiI3t0YWdOYW1lfT5cIlxuICAgICAgICAgIHR5cGU6IFwidGFnXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJsYW5ndWFnZS1iYWJlbCB0YWcgY2xvc2VyXCJcblxuICAgIGVsc2UgaWYganN4VGFnIGlzIEpTWFRBR1xuICAgICAgcmV0dXJuIGlmIG5vdCAvXlthLXpdL2cuZXhlYyhwcmVmaXgpXG4gICAgICBodG1sRWxlbWVudHMgPSBmaWx0ZXIoQ09NUExFVElPTlMuaHRtbEVsZW1lbnRzLCBwcmVmaXgsIHtrZXk6IFwibmFtZVwifSlcbiAgICAgIGZvciBodG1sRWxlbWVudCBpbiBodG1sRWxlbWVudHNcbiAgICAgICAgaWYgc2NvcmUoaHRtbEVsZW1lbnQubmFtZSwgcHJlZml4KSA8IDAuMDcgdGhlbiBjb250aW51ZVxuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoXG4gICAgICAgICAgc25pcHBldDogaHRtbEVsZW1lbnQubmFtZVxuICAgICAgICAgIHR5cGU6IFwidGFnXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJsYW5ndWFnZS1iYWJlbCBKU1ggc3VwcG9ydGVkIGVsZW1lbnRzXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFJFQUNUVVJMXG5cbiAgICBlbHNlIGlmIGpzeFRhZyBpcyBKU1hBVFRSSUJVVEVcbiAgICAgIHRhZ05hbWUgPSBAZ2V0VGhpc1RhZ05hbWUgZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgICAgcmV0dXJuIGlmIG5vdCB0YWdOYW1lP1xuICAgICAgZm9yIGVsZW1lbnRPYmogaW4gQ09NUExFVElPTlMuaHRtbEVsZW1lbnRzXG4gICAgICAgIGlmIGVsZW1lbnRPYmoubmFtZSBpcyB0YWdOYW1lIHRoZW4gYnJlYWtcbiAgICAgIGF0dHJpYnV0ZXMgPSBlbGVtZW50T2JqLmF0dHJpYnV0ZXMuY29uY2F0IENPTVBMRVRJT05TLmdsb2JhbEF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzLmNvbmNhdCBDT01QTEVUSU9OUy5ldmVudHNcbiAgICAgIGZpbHRlcmVkQXR0cmlidXRlcyA9IGZpbHRlcihhdHRyaWJ1dGVzLCBwcmVmaXgsIHtrZXk6IFwibmFtZVwifSlcbiAgICAgIGZvciBhdHRyaWJ1dGUgaW4gZmlsdGVyZWRBdHRyaWJ1dGVzXG4gICAgICAgIGlmIHNjb3JlKGF0dHJpYnV0ZS5uYW1lLCBwcmVmaXgpIDwgMC4wNyB0aGVuIGNvbnRpbnVlXG4gICAgICAgIHN1Z2dlc3Rpb25zLnB1c2hcbiAgICAgICAgICBzbmlwcGV0OiBhdHRyaWJ1dGUubmFtZVxuICAgICAgICAgIHR5cGU6IFwiYXR0cmlidXRlXCJcbiAgICAgICAgICByaWdodExhYmVsOiBcIjwje3RhZ05hbWV9PlwiXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwibGFuZ3VhZ2UtYmFiZWwgSlNYc3VwcG9ydGVkIGF0dHJpYnV0ZXMvZXZlbnRzXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFJFQUNUVVJMXG5cbiAgICBlbHNlIHJldHVyblxuICAgIHN1Z2dlc3Rpb25zXG5cbiAgIyBnZXQgdGFnbmFtZSBmb3IgdGhpcyBhdHRyaWJ1dGVcbiAgZ2V0VGhpc1RhZ05hbWU6ICggZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICByb3cgPSBidWZmZXJQb3NpdGlvbi5yb3dcbiAgICBjb2x1bW4gPSBudWxsXG4gICAgd2hpbGUgcm93ID49IDBcbiAgICAgIHJvd1RleHQgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVxuICAgICAgaWYgbm90IGNvbHVtbj9cbiAgICAgICAgcm93VGV4dCA9IHJvd1RleHQuc3Vic3RyIDAsIGNvbHVtbiA9IGJ1ZmZlclBvc2l0aW9uLmNvbHVtblxuICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICB3aGlsZSAoKCBtYXRjaCA9IFRBR1JFR0VYUC5leGVjKHJvd1RleHQpKSBpc250IG51bGwgKVxuICAgICAgICAjIHNhdmUgdGhpcyBtYXRjaCBpZiBpdCBhIHZhbGlkIHRhZ1xuICAgICAgICBzY29wZXMgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgbWF0Y2guaW5kZXgrMV0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgaWYgXCJlbnRpdHkubmFtZS50YWcub3Blbi5qc3hcIiBpbiBzY29wZXMgdGhlbiBtYXRjaGVzLnB1c2ggbWF0Y2hbMV1cbiAgICAgICMgcmV0dXJuIHRoZSB0YWcgdGhhdCBpcyB0aGUgbGFzdCBvbmUgZm91bmRcbiAgICAgIGlmIG1hdGNoZXMubGVuZ3RoXG4gICAgICAgIHJldHVybiBtYXRjaGVzLnBvcCgpXG4gICAgICBlbHNlIHJvdy0tXG5cblxuICBnZXRUcmlnZ2VyVGFnOiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICAjIEpTWCB0YWcgc2NvcGVzIHdlIGFyZSBpbnRlcmVzdGVkIGluIG1heSBhbHJlYWR5IGNsb3NlZCBvbmNlIHR5cGVkXG4gICAgIyBzbyB3ZSBoYXZlIHRvIGJhY2t0cmFjayBieSBvbmUgY2hhciB0byBzZWUgaWYgdGhleSB3ZXJlIHR5cGVkXG4gICAgY29sdW1uID0gYnVmZmVyUG9zaXRpb24uY29sdW1uLTFcbiAgICBpZiBjb2x1bW4gPj0gMFxuICAgICAgc2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQb3NpdGlvbi5yb3csIGNvbHVtbl0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgIGlmIFwiZW50aXR5Lm90aGVyLmF0dHJpYnV0ZS1uYW1lLmpzeFwiIGluIHNjb3BlcyB0aGVuIHJldHVybiBKU1hBVFRSSUJVVEVcbiAgICAgIGlmIFwiZW50aXR5Lm5hbWUudGFnLm9wZW4uanN4XCIgaW4gc2NvcGVzIHRoZW4gcmV0dXJuIEpTWFRBR1xuICAgICAgaWYgXCJKU1hTdGFydFRhZ0VuZFwiIGluIHNjb3BlcyB0aGVuIHJldHVybiBKU1hTVEFSVFRBR0VORFxuICAgICAgaWYgXCJKU1hFbmRUYWdTdGFydFwiIGluIHNjb3BlcyB0aGVuIHJldHVybiBKU1hFTkRUQUdTVEFSVFxuXG5cbiAgIyBmaW5kIGJlZ2dpbmluZyBvZiBKU1ggaW4gYnVmZmVyIGFuZCByZXR1cm4gUG9pbnRcbiAgZ2V0U3RhcnRPZkpTWDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgcm93ID0gYnVmZmVyUG9zaXRpb24ucm93XG4gICAgIyBmaW5kIHByZXZpb3VzIHN0YXJ0IG9mIHJvdyB0aGF0IGhhcyBubyBqc3ggdGFnXG4gICAgd2hpbGUgcm93ID49IDBcbiAgICAgIGJyZWFrIGlmIFwibWV0YS50YWcuanN4XCIgbm90IGluIGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbcm93LCAwXSkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgcm93LS1cbiAgICBpZiByb3cgPCAwIHRoZW4gcm93ID0gMFxuICAgICMgbWF5YmUganN4IGFwcGFlYXJzIGxhdGVyIGluIHJvd1xuICAgIGNvbHVtbkxlbiA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpLmxlbmd0aFxuICAgIGNvbHVtbiA9IDBcbiAgICB3aGlsZSBjb2x1bW4gPCBjb2x1bW5MZW5cbiAgICAgIGJyZWFrIGlmIFwibWV0YS50YWcuanN4XCIgaW4gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtyb3csIGNvbHVtbl0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgIGNvbHVtbisrXG4gICAgIyBhZGp1c3Qgcm93IGNvbHVtbiBpZiBqc3ggbm90IGluIHRoaXMgcm93IGF0IGFsbFxuICAgIGlmIGNvbHVtbiBpcyBjb2x1bW5MZW5cbiAgICAgIHJvdysrXG4gICAgICBjb2x1bW4gPSAwXG4gICAgbmV3IFBvaW50KHJvdywgY29sdW1uKVxuXG4gICMgYnVpbGQgc3RhY2sgb2YgdGFnbmFtZXMgb3BlbmVkIGJ1dCBub3QgY2xvc2VkIGluIFJhbmdlXG4gIGJ1aWxkVGFnU3RhY2s6IChlZGl0b3IsIHJhbmdlKSAtPlxuICAgIHRhZ05hbWVTdGFjayA9IFtdXG4gICAgcm93ID0gcmFuZ2Uuc3RhcnQucm93XG4gICAgd2hpbGUgcm93IDw9IHJhbmdlLmVuZC5yb3dcbiAgICAgIGxpbmUgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICBpZiByb3cgaXMgcmFuZ2UuZW5kLnJvd1xuICAgICAgICBsaW5lID0gbGluZS5zdWJzdHIgMCwgcmFuZ2UuZW5kLmNvbHVtblxuICAgICAgd2hpbGUgKCggbWF0Y2ggPSBKU1hSRUdFWFAuZXhlYyhsaW5lKSkgaXNudCBudWxsIClcbiAgICAgICAgbWF0Y2hDb2x1bW4gPSBtYXRjaC5pbmRleFxuICAgICAgICBtYXRjaFBvaW50U3RhcnQgPSBuZXcgUG9pbnQocm93LCBtYXRjaENvbHVtbilcbiAgICAgICAgbWF0Y2hQb2ludEVuZCA9IG5ldyBQb2ludChyb3csIG1hdGNoQ29sdW1uICsgbWF0Y2hbMF0ubGVuZ3RoIC0gMSlcbiAgICAgICAgbWF0Y2hSYW5nZSA9IG5ldyBSYW5nZShtYXRjaFBvaW50U3RhcnQsIG1hdGNoUG9pbnRFbmQpXG4gICAgICAgIGlmIHJhbmdlLmludGVyc2VjdHNXaXRoKG1hdGNoUmFuZ2UpXG4gICAgICAgICAgc2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtyb3csIG1hdGNoLmluZGV4XSkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgICAgIGNvbnRpbnVlIGlmIFwicHVuY3R1YXRpb24uZGVmaW5pdGlvbi50YWcuanN4XCIgbm90IGluIHNjb3Blc1xuICAgICAgICAgICNjaGVjayBjYXB0dXJlIGdyb3Vwc1xuICAgICAgICAgIGlmIG1hdGNoWzFdPyAjIHRhZ3Mgc3RhcnRpbmcgPHRhZ1xuICAgICAgICAgICAgdGFnTmFtZVN0YWNrLnB1c2ggbWF0Y2hbM11cbiAgICAgICAgICBlbHNlIGlmIG1hdGNoWzJdPyAjIHRhZ3MgZW5kaW5nIDwvdGFnXG4gICAgICAgICAgICBjbG9zZWR0YWcgPSB0YWdOYW1lU3RhY2sucG9wKClcbiAgICAgICAgICAgIGlmIGNsb3NlZHRhZyBpc250IG1hdGNoWzNdXG4gICAgICAgICAgICAgIHRhZ05hbWVTdGFjay5wdXNoIGNsb3NlZHRhZ1xuICAgICAgICAgIGVsc2UgaWYgbWF0Y2hbNF0/ICMgdGFncyBlbmRpbmcgLz5cbiAgICAgICAgICAgIHRhZ05hbWVTdGFjay5wb3AoKVxuICAgICAgcm93KytcbiAgICB0YWdOYW1lU3RhY2tcbiJdfQ==
