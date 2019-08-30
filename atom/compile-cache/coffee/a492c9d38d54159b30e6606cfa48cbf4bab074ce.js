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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvbGliL2F1dG8tY29tcGxldGUtanN4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEseUlBQUE7SUFBQTs7RUFBQSxNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsT0FBa0IsT0FBQSxDQUFRLFlBQVIsQ0FBbEIsRUFBQyxvQkFBRCxFQUFTOztFQUdULGNBQUEsR0FBaUI7O0VBQ2pCLGNBQUEsR0FBaUI7O0VBQ2pCLE1BQUEsR0FBUzs7RUFDVCxZQUFBLEdBQWU7O0VBRWYsU0FBQSxHQUFZOztFQUNaLFNBQUEsR0FBYTs7RUFDYixXQUFBLEdBQWMsT0FBQSxDQUFRLG1CQUFSOztFQUNkLFFBQUEsR0FBVzs7RUFFWCxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLGVBQVY7SUFDQSxpQkFBQSxFQUFtQixLQURuQjtJQUVBLG9CQUFBLEVBQXNCLEtBRnRCO0lBS0EsY0FBQSxFQUFnQixTQUFDLElBQUQ7QUFDZCxVQUFBO01BQUMsb0JBQUQsRUFBUyxvQ0FBVCxFQUF5QixzQ0FBekIsRUFBMEM7TUFDMUMsSUFBVSxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsV0FBcEIsS0FBcUMsZ0JBQS9DO0FBQUEsZUFBQTs7TUFFQSxNQUFBLEdBQVMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmLEVBQXVCLGNBQXZCO01BQ1QsSUFBYyxjQUFkO0FBQUEsZUFBQTs7TUFHQSxXQUFBLEdBQWM7TUFFZCxJQUFHLE1BQUEsS0FBVSxjQUFiO1FBQ0UsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQWUsTUFBZixFQUF1QixjQUF2QjtRQUNiLFFBQUEsR0FBZSxJQUFBLEtBQUEsQ0FBTSxVQUFOLEVBQWtCLGNBQWxCO1FBQ2YsWUFBQSxHQUFlLElBQUMsQ0FB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LEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBekIsRUFEVDs7QUFFQSxlQUFPLENBQUUsS0FBQSxHQUFRLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixDQUFWLENBQUEsS0FBcUMsSUFBNUM7VUFDRSxXQUFBLEdBQWMsS0FBSyxDQUFDO1VBQ3BCLGVBQUEsR0FBc0IsSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLFdBQVg7VUFDdEIsYUFBQSxHQUFvQixJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsV0FBQSxHQUFjLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUF2QixHQUFnQyxDQUEzQztVQUNwQixVQUFBLEdBQWlCLElBQUEsS0FBQSxDQUFNLGVBQU4sRUFBdUIsYUFBdkI7VUFDakIsSUFBRyxLQUFLLENBQUMsY0FBTixDQUFxQixVQUFyQixDQUFIO1lBQ0UsTUFBQSxHQUFTLE1BQU0sQ0FBQyxnQ0FBUCxDQUF3QyxDQUFDLEdBQUQsRUFBTSxLQUFLLENBQUMsS0FBWixDQUF4QyxDQUEyRCxDQUFDLGNBQTVELENBQUE7WUFDVCxJQUFZLGFBQXdDLE1BQXhDLEVBQUEsZ0NBQUEsS0FBWjtBQUFBLHVCQUFBOztZQUVBLElBQUcsZ0JBQUg7Y0FDRSxZQUFZLENBQUMsSUFBYixDQUFrQixLQUFNLENBQUEsQ0FBQSxDQUF4QixFQURGO2FBQUEsTUFFSyxJQUFHLGdCQUFIO2NBQ0gsU0FBQSxHQUFZLFlBQVksQ0FBQyxHQUFiLENBQUE7Y0FDWixJQUFHLFNBQUEsS0FBZSxLQUFNLENBQUEsQ0FBQSxDQUF4QjtnQkFDRSxZQUFZLENBQUMsSUFBYixDQUFrQixTQUFsQixFQURGO2VBRkc7YUFBQSxNQUlBLElBQUcsZ0JBQUg7Y0FDSCxZQUFZLENBQUMsR0FBYixDQUFBLEVBREc7YUFWUDs7UUFMRjtRQWlCQSxHQUFBO01BckJGO2FBc0JBO0lBekJhLENBdEhmOztBQWZGIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBQb2ludH0gPSByZXF1aXJlIFwiYXRvbVwiXG57ZmlsdGVyLCBzY29yZX0gPSByZXF1aXJlIFwiZnV6emFsZHJpblwiXG5cbiMgdGFncyB3ZSBhcmUgaW50ZXJlc3RlZCBpbiBhcmUgbWFya2VkIGJ5IHRoZSBncmFtbWFyXG5KU1hTVEFSVFRBR0VORCA9IDBcbkpTWEVORFRBR1NUQVJUID0gMVxuSlNYVEFHID0gMlxuSlNYQVRUUklCVVRFID0gM1xuIyByZWdleCB0byBzZWFyY2ggZm9yIHRhZyBvcGVuL2Nsb3NlIHRhZyBhbmQgY2xvc2UgdGFnXG5KU1hSRUdFWFAgPSAvKD86KDwpfCg8XFwvKSkoWyRfQS1aYS16XSg/OlskLl86XFwtYS16QS1aMC05XSkqKXwoPzooXFwvPil8KD4pKS9nXG5UQUdSRUdFWFAgPSAgLzwoWyRfYS16QS1aXVskLl86XFwtYS16QS1aMC05XSopKCR8XFxzfFxcLz58PikvZ1xuQ09NUExFVElPTlMgPSByZXF1aXJlIFwiLi9jb21wbGV0aW9ucy1qc3hcIlxuUkVBQ1RVUkwgPSBcImh0dHA6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy90YWdzLWFuZC1hdHRyaWJ1dGVzLmh0bWxcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHNlbGVjdG9yOiBcIi5tZXRhLnRhZy5qc3hcIlxuICBpbmNsdXNpb25Qcmlvcml0eTogMTAwMDBcbiAgZXhjbHVkZUxvd2VyUHJpb3JpdHk6IGZhbHNlXG5cblxuICBnZXRTdWdnZXN0aW9uczogKG9wdHMpIC0+XG4gICAge2VkaXRvciwgYnVmZmVyUG9zaXRpb24sIHNjb3BlRGVzY3JpcHRvciwgcHJlZml4fSA9IG9wdHNcbiAgICByZXR1cm4gaWYgZWRpdG9yLmdldEdyYW1tYXIoKS5wYWNrYWdlTmFtZSBpc250IFwibGFuZ3VhZ2UtYmFiZWxcIlxuXG4gICAganN4VGFnID0gQGdldFRyaWdnZXJUYWcgZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgIHJldHVybiBpZiBub3QganN4VGFnP1xuXG4gICAgIyBidWlsZCBhdXRvY29tcGxldGUgbGlzdFxuICAgIHN1Z2dlc3Rpb25zID0gW11cblxuICAgIGlmIGpzeFRhZyBpcyBKU1hTVEFSVFRBR0VORFxuICAgICAgc3RhcnRPZkpTWCA9IEBnZXRTdGFydE9mSlNYIGVkaXRvciwgYnVmZmVyUG9zaXRpb25cbiAgICAgIGpzeFJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0T2ZKU1gsIGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgdGFnTmFtZVN0YWNrID0gQGJ1aWxkVGFnU3RhY2soZWRpdG9yLCBqc3hSYW5nZSlcbiAgICAgIHdoaWxlICggdGFnTmFtZSA9IHRhZ05hbWVTdGFjay5wb3AoKSk/XG4gICAgICAgIHN1Z2dlc3Rpb25zLnB1c2hcbiAgICAgICAgICBzbmlwcGV0OiBcIiQxPC8je3RhZ05hbWV9PlwiXG4gICAgICAgICAgdHlwZTogXCJ0YWdcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImxhbmd1YWdlLWJhYmVsIHRhZyBjbG9zZXJcIlxuXG4gICAgZWxzZSBpZiAganN4VGFnIGlzIEpTWEVORFRBR1NUQVJUXG4gICAgICBzdGFydE9mSlNYID0gQGdldFN0YXJ0T2ZKU1ggZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgICAganN4UmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnRPZkpTWCwgYnVmZmVyUG9zaXRpb24pXG4gICAgICB0YWdOYW1lU3RhY2sgPSBAYnVpbGRUYWdTdGFjayhlZGl0b3IsIGpzeFJhbmdlKVxuICAgICAgd2hpbGUgKCB0YWdOYW1lID0gdGFnTmFtZVN0YWNrLnBvcCgpKT9cbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaFxuICAgICAgICAgIHNuaXBwZXQ6IFwiI3t0YWdOYW1lfT5cIlxuICAgICAgICAgIHR5cGU6IFwidGFnXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJsYW5ndWFnZS1iYWJlbCB0YWcgY2xvc2VyXCJcblxuICAgIGVsc2UgaWYganN4VGFnIGlzIEpTWFRBR1xuICAgICAgcmV0dXJuIGlmIG5vdCAvXlthLXpdL2cuZXhlYyhwcmVmaXgpXG4gICAgICBodG1sRWxlbWVudHMgPSBmaWx0ZXIoQ09NUExFVElPTlMuaHRtbEVsZW1lbnRzLCBwcmVmaXgsIHtrZXk6IFwibmFtZVwifSlcbiAgICAgIGZvciBodG1sRWxlbWVudCBpbiBodG1sRWxlbWVudHNcbiAgICAgICAgaWYgc2NvcmUoaHRtbEVsZW1lbnQubmFtZSwgcHJlZml4KSA8IDAuMDcgdGhlbiBjb250aW51ZVxuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoXG4gICAgICAgICAgc25pcHBldDogaHRtbEVsZW1lbnQubmFtZVxuICAgICAgICAgIHR5cGU6IFwidGFnXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJsYW5ndWFnZS1iYWJlbCBKU1ggc3VwcG9ydGVkIGVsZW1lbnRzXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFJFQUNUVVJMXG5cbiAgICBlbHNlIGlmIGpzeFRhZyBpcyBKU1hBVFRSSUJVVEVcbiAgICAgIHRhZ05hbWUgPSBAZ2V0VGhpc1RhZ05hbWUgZWRpdG9yLCBidWZmZXJQb3NpdGlvblxuICAgICAgcmV0dXJuIGlmIG5vdCB0YWdOYW1lP1xuICAgICAgZm9yIGVsZW1lbnRPYmogaW4gQ09NUExFVElPTlMuaHRtbEVsZW1lbnRzXG4gICAgICAgIGlmIGVsZW1lbnRPYmoubmFtZSBpcyB0YWdOYW1lIHRoZW4gYnJlYWtcbiAgICAgIGVsZW1lbnRPYmouYXR0cmlidXRlcyA9IGVsZW1lbnRPYmouYXR0cmlidXRlcy5jb25jYXQgQ09NUExFVElPTlMuZ2xvYmFsQXR0cmlidXRlc1xuICAgICAgZWxlbWVudE9iai5hdHRyaWJ1dGVzID0gZWxlbWVudE9iai5hdHRyaWJ1dGVzLmNvbmNhdCBDT01QTEVUSU9OUy5ldmVudHNcbiAgICAgIGZpbHRlcmVkQXR0cmlidXRlcyA9IGZpbHRlcihlbGVtZW50T2JqLmF0dHJpYnV0ZXMsIHByZWZpeCwge2tleTogXCJuYW1lXCJ9KVxuICAgICAgZm9yIGF0dHJpYnV0ZSBpbiBmaWx0ZXJlZEF0dHJpYnV0ZXNcbiAgICAgICAgaWYgc2NvcmUoYXR0cmlidXRlLm5hbWUsIHByZWZpeCkgPCAwLjA3IHRoZW4gY29udGludWVcbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaFxuICAgICAgICAgIHNuaXBwZXQ6IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAgICAgdHlwZTogXCJhdHRyaWJ1dGVcIlxuICAgICAgICAgIHJpZ2h0TGFiZWw6IFwiPCN7dGFnTmFtZX0+XCJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJsYW5ndWFnZS1iYWJlbCBKU1hzdXBwb3J0ZWQgYXR0cmlidXRlcy9ldmVudHNcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogUkVBQ1RVUkxcblxuICAgIGVsc2UgcmV0dXJuXG4gICAgc3VnZ2VzdGlvbnNcblxuICAjIGdldCB0YWduYW1lIGZvciB0aGlzIGF0dHJpYnV0ZVxuICBnZXRUaGlzVGFnTmFtZTogKCBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIHJvdyA9IGJ1ZmZlclBvc2l0aW9uLnJvd1xuICAgIGNvbHVtbiA9IG51bGxcbiAgICB3aGlsZSByb3cgPj0gMFxuICAgICAgcm93VGV4dCA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gICAgICBpZiBub3QgY29sdW1uP1xuICAgICAgICByb3dUZXh0ID0gcm93VGV4dC5zdWJzdHIgMCwgY29sdW1uID0gYnVmZmVyUG9zaXRpb24uY29sdW1uXG4gICAgICBtYXRjaGVzID0gW11cbiAgICAgIHdoaWxlICgoIG1hdGNoID0gVEFHUkVHRVhQLmV4ZWMocm93VGV4dCkpIGlzbnQgbnVsbCApXG4gICAgICAgICMgc2F2ZSB0aGlzIG1hdGNoIGlmIGl0IGEgdmFsaWQgdGFnXG4gICAgICAgIHNjb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbcm93LCBtYXRjaC5pbmRleCsxXSkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgICBpZiBcImVudGl0eS5uYW1lLnRhZy5vcGVuLmpzeFwiIGluIHNjb3BlcyB0aGVuIG1hdGNoZXMucHVzaCBtYXRjaFsxXVxuICAgICAgIyByZXR1cm4gdGhlIHRhZyB0aGF0IGlzIHRoZSBsYXN0IG9uZSBmb3VuZFxuICAgICAgaWYgbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgcmV0dXJuIG1hdGNoZXMucG9wKClcbiAgICAgIGVsc2Ugcm93LS1cblxuXG4gIGdldFRyaWdnZXJUYWc6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgICMgSlNYIHRhZyBzY29wZXMgd2UgYXJlIGludGVyZXN0ZWQgaW4gbWF5IGFscmVhZHkgY2xvc2VkIG9uY2UgdHlwZWRcbiAgICAjIHNvIHdlIGhhdmUgdG8gYmFja3RyYWNrIGJ5IG9uZSBjaGFyIHRvIHNlZSBpZiB0aGV5IHdlcmUgdHlwZWRcbiAgICBjb2x1bW4gPSBidWZmZXJQb3NpdGlvbi5jb2x1bW4tMVxuICAgIGlmIGNvbHVtbiA+PSAwXG4gICAgICBzY29wZXMgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclBvc2l0aW9uLnJvdywgY29sdW1uXSkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgaWYgXCJlbnRpdHkub3RoZXIuYXR0cmlidXRlLW5hbWUuanN4XCIgaW4gc2NvcGVzIHRoZW4gcmV0dXJuIEpTWEFUVFJJQlVURVxuICAgICAgaWYgXCJlbnRpdHkubmFtZS50YWcub3Blbi5qc3hcIiBpbiBzY29wZXMgdGhlbiByZXR1cm4gSlNYVEFHXG4gICAgICBpZiBcIkpTWFN0YXJ0VGFnRW5kXCIgaW4gc2NvcGVzIHRoZW4gcmV0dXJuIEpTWFNUQVJUVEFHRU5EXG4gICAgICBpZiBcIkpTWEVuZFRhZ1N0YXJ0XCIgaW4gc2NvcGVzIHRoZW4gcmV0dXJuIEpTWEVORFRBR1NUQVJUXG5cblxuICAjIGZpbmQgYmVnZ2luaW5nIG9mIEpTWCBpbiBidWZmZXIgYW5kIHJldHVybiBQb2ludFxuICBnZXRTdGFydE9mSlNYOiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICByb3cgPSBidWZmZXJQb3NpdGlvbi5yb3dcbiAgICAjIGZpbmQgcHJldmlvdXMgc3RhcnQgb2Ygcm93IHRoYXQgaGFzIG5vIGpzeCB0YWdcbiAgICB3aGlsZSByb3cgPj0gMFxuICAgICAgYnJlYWsgaWYgXCJtZXRhLnRhZy5qc3hcIiBub3QgaW4gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtyb3csIDBdKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICByb3ctLVxuICAgIGlmIHJvdyA8IDAgdGhlbiByb3cgPSAwXG4gICAgIyBtYXliZSBqc3ggYXBwYWVhcnMgbGF0ZXIgaW4gcm93XG4gICAgY29sdW1uTGVuID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdykubGVuZ3RoXG4gICAgY29sdW1uID0gMFxuICAgIHdoaWxlIGNvbHVtbiA8IGNvbHVtbkxlblxuICAgICAgYnJlYWsgaWYgXCJtZXRhLnRhZy5qc3hcIiBpbiBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgY29sdW1uXSkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgY29sdW1uKytcbiAgICAjIGFkanVzdCByb3cgY29sdW1uIGlmIGpzeCBub3QgaW4gdGhpcyByb3cgYXQgYWxsXG4gICAgaWYgY29sdW1uIGlzIGNvbHVtbkxlblxuICAgICAgcm93KytcbiAgICAgIGNvbHVtbiA9IDBcbiAgICBuZXcgUG9pbnQocm93LCBjb2x1bW4pXG5cbiAgIyBidWlsZCBzdGFjayBvZiB0YWduYW1lcyBvcGVuZWQgYnV0IG5vdCBjbG9zZWQgaW4gUmFuZ2VcbiAgYnVpbGRUYWdTdGFjazogKGVkaXRvciwgcmFuZ2UpIC0+XG4gICAgdGFnTmFtZVN0YWNrID0gW11cbiAgICByb3cgPSByYW5nZS5zdGFydC5yb3dcbiAgICB3aGlsZSByb3cgPD0gcmFuZ2UuZW5kLnJvd1xuICAgICAgbGluZSA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgIGlmIHJvdyBpcyByYW5nZS5lbmQucm93XG4gICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0ciAwLCByYW5nZS5lbmQuY29sdW1uXG4gICAgICB3aGlsZSAoKCBtYXRjaCA9IEpTWFJFR0VYUC5leGVjKGxpbmUpKSBpc250IG51bGwgKVxuICAgICAgICBtYXRjaENvbHVtbiA9IG1hdGNoLmluZGV4XG4gICAgICAgIG1hdGNoUG9pbnRTdGFydCA9IG5ldyBQb2ludChyb3csIG1hdGNoQ29sdW1uKVxuICAgICAgICBtYXRjaFBvaW50RW5kID0gbmV3IFBvaW50KHJvdywgbWF0Y2hDb2x1bW4gKyBtYXRjaFswXS5sZW5ndGggLSAxKVxuICAgICAgICBtYXRjaFJhbmdlID0gbmV3IFJhbmdlKG1hdGNoUG9pbnRTdGFydCwgbWF0Y2hQb2ludEVuZClcbiAgICAgICAgaWYgcmFuZ2UuaW50ZXJzZWN0c1dpdGgobWF0Y2hSYW5nZSlcbiAgICAgICAgICBzY29wZXMgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgbWF0Y2guaW5kZXhdKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICAgICAgY29udGludWUgaWYgXCJwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnRhZy5qc3hcIiBub3QgaW4gc2NvcGVzXG4gICAgICAgICAgI2NoZWNrIGNhcHR1cmUgZ3JvdXBzXG4gICAgICAgICAgaWYgbWF0Y2hbMV0/ICMgdGFncyBzdGFydGluZyA8dGFnXG4gICAgICAgICAgICB0YWdOYW1lU3RhY2sucHVzaCBtYXRjaFszXVxuICAgICAgICAgIGVsc2UgaWYgbWF0Y2hbMl0/ICMgdGFncyBlbmRpbmcgPC90YWdcbiAgICAgICAgICAgIGNsb3NlZHRhZyA9IHRhZ05hbWVTdGFjay5wb3AoKVxuICAgICAgICAgICAgaWYgY2xvc2VkdGFnIGlzbnQgbWF0Y2hbM11cbiAgICAgICAgICAgICAgdGFnTmFtZVN0YWNrLnB1c2ggY2xvc2VkdGFnXG4gICAgICAgICAgZWxzZSBpZiBtYXRjaFs0XT8gIyB0YWdzIGVuZGluZyAvPlxuICAgICAgICAgICAgdGFnTmFtZVN0YWNrLnBvcCgpXG4gICAgICByb3crK1xuICAgIHRhZ05hbWVTdGFja1xuIl19
