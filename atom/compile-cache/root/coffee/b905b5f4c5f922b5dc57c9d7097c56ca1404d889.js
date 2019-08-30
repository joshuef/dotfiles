(function() {
  var cssDocsURL, firstCharsEqual, firstInlinePropertyNameWithColonPattern, fs, hasScope, importantPrefixPattern, inlinePropertyNameWithColonPattern, lineEndsWithSemicolon, makeSnippet, path, pesudoSelectorPrefixPattern, propertyNamePrefixPattern, propertyNameWithColonPattern, tagSelectorPrefixPattern;

  fs = require('fs');

  path = require('path');

  firstInlinePropertyNameWithColonPattern = /{\s*(\S+)\s*:/;

  inlinePropertyNameWithColonPattern = /(?:;.+?)*;\s*(\S+)\s*:/;

  propertyNameWithColonPattern = /^\s*(\S+)\s*:/;

  propertyNamePrefixPattern = /[a-zA-Z]+[-a-zA-Z]*$/;

  pesudoSelectorPrefixPattern = /:(:)?([a-z]+[a-z-]*)?$/;

  tagSelectorPrefixPattern = /(^|\s|,)([a-z]+)?$/;

  importantPrefixPattern = /(![a-z]+)$/;

  cssDocsURL = "https://developer.mozilla.org/en-US/docs/Web/CSS";

  module.exports = {
    selector: '.source.inside-js.css.styled, .source.css.styled',
    disableForSelector: ".source.inside-js.css.styled .comment, .source.inside-js.css.styled .string, .source.inside-js.css.styled .entity.quasi.element.js, .source.css.styled .comment, .source.css.styled .string, .source.css.styled .entity.quasi.element.js",
    filterSuggestions: true,
    inclusionPriority: 10000,
    excludeLowerPriority: false,
    getSuggestions: function(request) {
      var completions, scopes;
      completions = null;
      scopes = request.scopeDescriptor.getScopesArray();
      if (this.isCompletingValue(request)) {
        completions = this.getPropertyValueCompletions(request);
      } else if (this.isCompletingPseudoSelector(request)) {
        completions = this.getPseudoSelectorCompletions(request);
      } else {
        if (this.isCompletingName(request)) {
          completions = this.getPropertyNameCompletions(request);
        } else if (this.isCompletingNameOrTag(request)) {
          completions = this.getPropertyNameCompletions(request).concat(this.getTagCompletions(request));
        }
      }
      return completions;
    },
    onDidInsertSuggestion: function(arg) {
      var editor, suggestion;
      editor = arg.editor, suggestion = arg.suggestion;
      if (suggestion.type === 'property') {
        return setTimeout(this.triggerAutocomplete.bind(this, editor), 1);
      }
    },
    triggerAutocomplete: function(editor) {
      return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {
        activatedManually: false
      });
    },
    loadProperties: function() {
      this.properties = {};
      return fs.readFile(path.resolve(__dirname, 'completions.json'), (function(_this) {
        return function(error, content) {
          var ref;
          if (error == null) {
            ref = JSON.parse(content), _this.pseudoSelectors = ref.pseudoSelectors, _this.properties = ref.properties, _this.tags = ref.tags;
          }
        };
      })(this));
    },
    isCompletingValue: function(arg) {
      var beforePrefixBufferPosition, beforePrefixScopes, beforePrefixScopesArray, bufferPosition, editor, prefix, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, prefix = arg.prefix, editor = arg.editor;
      scopes = scopeDescriptor.getScopesArray();
      beforePrefixBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
      beforePrefixScopes = editor.scopeDescriptorForBufferPosition(beforePrefixBufferPosition);
      beforePrefixScopesArray = beforePrefixScopes.getScopesArray();
      return (hasScope(scopes, 'meta.property-values.css')) || (hasScope(beforePrefixScopesArray, 'meta.property-values.css'));
    },
    isCompletingName: function(arg) {
      var bufferPosition, editor, prefix, scope, scopeDescriptor;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, editor = arg.editor;
      scope = scopeDescriptor.getScopesArray().slice(-1);
      prefix = this.getPropertyNamePrefix(bufferPosition, editor);
      return this.isPropertyNamePrefix(prefix) && (scope[0] === 'meta.property-list.css');
    },
    isCompletingNameOrTag: function(arg) {
      var bufferPosition, editor, prefix, scope, scopeDescriptor;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, editor = arg.editor;
      scope = scopeDescriptor.getScopesArray().slice(-1);
      prefix = this.getPropertyNamePrefix(bufferPosition, editor);
      return this.isPropertyNamePrefix(prefix) && ((scope[0] === 'meta.property-list.css') || (scope[0] === 'source.css.styled') || (scope[0] === 'entity.name.tag.css') || (scope[0] === 'source.inside-js.css.styled'));
    },
    isCompletingPseudoSelector: function(arg) {
      var bufferPosition, editor, scope, scopeDescriptor;
      editor = arg.editor, scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition;
      scope = scopeDescriptor.getScopesArray().slice(-1);
      return (scope[0] === 'constant.language.pseudo.prefixed.css') || (scope[0] === 'keyword.operator.pseudo.css');
    },
    isPropertyValuePrefix: function(prefix) {
      prefix = prefix.trim();
      return prefix.length > 0 && prefix !== ':';
    },
    isPropertyNamePrefix: function(prefix) {
      if (prefix == null) {
        return false;
      }
      prefix = prefix.trim();
      return prefix.match(/^[a-zA-Z-]+$/);
    },
    getImportantPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = importantPrefixPattern.exec(line)) != null ? ref[1] : void 0;
    },
    getPreviousPropertyName: function(bufferPosition, editor) {
      var line, propertyName, ref, ref1, ref2, row;
      row = bufferPosition.row;
      while (row >= 0) {
        line = editor.lineTextForBufferRow(row);
        propertyName = (ref = inlinePropertyNameWithColonPattern.exec(line)) != null ? ref[1] : void 0;
        if (propertyName == null) {
          propertyName = (ref1 = firstInlinePropertyNameWithColonPattern.exec(line)) != null ? ref1[1] : void 0;
        }
        if (propertyName == null) {
          propertyName = (ref2 = propertyNameWithColonPattern.exec(line)) != null ? ref2[1] : void 0;
        }
        if (propertyName) {
          return propertyName;
        }
        row--;
      }
    },
    getPropertyValueCompletions: function(arg) {
      var addSemicolon, bufferPosition, completions, editor, i, importantPrefix, j, len, len1, prefix, property, ref, scopeDescriptor, scopes, value, values;
      bufferPosition = arg.bufferPosition, editor = arg.editor, prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      property = this.getPreviousPropertyName(bufferPosition, editor);
      values = (ref = this.properties[property]) != null ? ref.values : void 0;
      if (values == null) {
        return null;
      }
      scopes = scopeDescriptor.getScopesArray();
      addSemicolon = !lineEndsWithSemicolon(bufferPosition, editor);
      completions = [];
      if (this.isPropertyValuePrefix(prefix)) {
        for (i = 0, len = values.length; i < len; i++) {
          value = values[i];
          if (firstCharsEqual(value, prefix)) {
            completions.push(this.buildPropertyValueCompletion(value, property, addSemicolon));
          }
        }
      } else {
        for (j = 0, len1 = values.length; j < len1; j++) {
          value = values[j];
          completions.push(this.buildPropertyValueCompletion(value, property, addSemicolon));
        }
      }
      if (importantPrefix = this.getImportantPrefix(editor, bufferPosition)) {
        completions.push({
          type: 'keyword',
          text: '!important',
          displayText: '!important',
          replacementPrefix: importantPrefix,
          description: "Forces this property to override any other declaration of the same property. Use with caution.",
          descriptionMoreURL: cssDocsURL + "/Specificity#The_!important_exception"
        });
      }
      return completions;
    },
    buildPropertyValueCompletion: function(value, propertyName, addSemicolon) {
      var text;
      text = value;
      if (addSemicolon) {
        text += ';';
      }
      text = makeSnippet(text);
      return {
        type: 'value',
        snippet: text,
        displayText: value,
        description: value + " value for the " + propertyName + " property",
        descriptionMoreURL: cssDocsURL + "/" + propertyName + "#Values"
      };
    },
    getPropertyNamePrefix: function(bufferPosition, editor) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = propertyNamePrefixPattern.exec(line)) != null ? ref[0] : void 0;
    },
    getPropertyNameCompletions: function(arg) {
      var activatedManually, bufferPosition, completions, editor, line, options, prefix, property, ref, scopeDescriptor, scopes;
      bufferPosition = arg.bufferPosition, editor = arg.editor, scopeDescriptor = arg.scopeDescriptor, activatedManually = arg.activatedManually;
      scopes = scopeDescriptor.getScopesArray();
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      prefix = this.getPropertyNamePrefix(bufferPosition, editor);
      if (!(activatedManually || prefix)) {
        return [];
      }
      completions = [];
      ref = this.properties;
      for (property in ref) {
        options = ref[property];
        if (!prefix || firstCharsEqual(property, prefix)) {
          completions.push(this.buildPropertyNameCompletion(property, prefix, options));
        }
      }
      return completions;
    },
    buildPropertyNameCompletion: function(propertyName, prefix, arg) {
      var description;
      description = arg.description;
      return {
        type: 'property',
        text: propertyName + ": ",
        displayText: propertyName,
        replacementPrefix: prefix,
        description: description,
        descriptionMoreURL: cssDocsURL + "/" + propertyName
      };
    },
    getPseudoSelectorPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = line.match(pesudoSelectorPrefixPattern)) != null ? ref[0] : void 0;
    },
    getPseudoSelectorCompletions: function(arg) {
      var bufferPosition, completions, editor, options, prefix, pseudoSelector, ref;
      bufferPosition = arg.bufferPosition, editor = arg.editor;
      prefix = this.getPseudoSelectorPrefix(editor, bufferPosition);
      if (!prefix) {
        return null;
      }
      completions = [];
      ref = this.pseudoSelectors;
      for (pseudoSelector in ref) {
        options = ref[pseudoSelector];
        if (firstCharsEqual(pseudoSelector, prefix)) {
          completions.push(this.buildPseudoSelectorCompletion(pseudoSelector, prefix, options));
        }
      }
      return completions;
    },
    buildPseudoSelectorCompletion: function(pseudoSelector, prefix, arg) {
      var argument, completion, description;
      argument = arg.argument, description = arg.description;
      completion = {
        type: 'pseudo-selector',
        replacementPrefix: prefix,
        description: description,
        descriptionMoreURL: cssDocsURL + "/" + pseudoSelector
      };
      if (argument != null) {
        completion.snippet = pseudoSelector + "(${1:" + argument + "})";
      } else {
        completion.text = pseudoSelector;
      }
      return completion;
    },
    getTagSelectorPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = tagSelectorPrefixPattern.exec(line)) != null ? ref[2] : void 0;
    },
    getTagCompletions: function(arg) {
      var bufferPosition, completions, editor, i, len, prefix, ref, tag;
      bufferPosition = arg.bufferPosition, editor = arg.editor, prefix = arg.prefix;
      completions = [];
      if (prefix) {
        ref = this.tags;
        for (i = 0, len = ref.length; i < len; i++) {
          tag = ref[i];
          if (firstCharsEqual(tag, prefix)) {
            completions.push(this.buildTagCompletion(tag));
          }
        }
      }
      return completions;
    },
    buildTagCompletion: function(tag) {
      return {
        type: 'tag',
        text: tag,
        description: "Selector for <" + tag + "> elements"
      };
    }
  };

  lineEndsWithSemicolon = function(bufferPosition, editor) {
    var line, row;
    row = bufferPosition.row;
    line = editor.lineTextForBufferRow(row);
    return /;\s*$/.test(line);
  };

  hasScope = function(scopesArray, scope) {
    return scopesArray.indexOf(scope) !== -1;
  };

  firstCharsEqual = function(str1, str2) {
    return str1[0].toLowerCase() === str2[0].toLowerCase();
  };

  makeSnippet = function(text) {
    var snippetNumber;
    snippetNumber = 0;
    while (text.includes('()')) {
      text = text.replace('()', "($" + (++snippetNumber) + ")");
    }
    text = text + ("$" + (++snippetNumber));
    return text;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1jb21wbGV0ZS1zdHlsZWQtY29tcG9uZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0E7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsdUNBQUEsR0FBMEM7O0VBQzFDLGtDQUFBLEdBQXFDOztFQUNyQyw0QkFBQSxHQUErQjs7RUFDL0IseUJBQUEsR0FBNEI7O0VBQzVCLDJCQUFBLEdBQThCOztFQUM5Qix3QkFBQSxHQUEyQjs7RUFDM0Isc0JBQUEsR0FBeUI7O0VBQ3pCLFVBQUEsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLGtEQUFWO0lBQ0Esa0JBQUEsRUFBb0IsME9BRHBCO0lBR0EsaUJBQUEsRUFBbUIsSUFIbkI7SUFJQSxpQkFBQSxFQUFtQixLQUpuQjtJQUtBLG9CQUFBLEVBQXNCLEtBTHRCO0lBT0EsY0FBQSxFQUFnQixTQUFDLE9BQUQ7QUFDZCxVQUFBO01BQUEsV0FBQSxHQUFjO01BQ2QsTUFBQSxHQUFTLE9BQU8sQ0FBQyxlQUFlLENBQUMsY0FBeEIsQ0FBQTtNQUVULElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLE9BQW5CLENBQUg7UUFDRSxXQUFBLEdBQWMsSUFBQyxDQUFBLDJCQUFELENBQTZCLE9BQTdCLEVBRGhCO09BQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixPQUE1QixDQUFIO1FBQ0gsV0FBQSxHQUFjLElBQUMsQ0FBQSw0QkFBRCxDQUE4QixPQUE5QixFQURYO09BQUEsTUFBQTtRQUdILElBQUcsSUFBQyxDQUFBLGdCQUFELENBQWtCLE9BQWxCLENBQUg7VUFDRSxXQUFBLEdBQWMsSUFBQyxDQUFBLDBC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Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLWNzcyBidXQgaGFzIGJlZW4gbW9kaWZpZWQgdG8gYWxsb3cgaXQgdG8gYmUgdXNlZFxuIyBmb3Igc3R5bGVkLWNvbXBvbmVuZXRzLiBUaGUgY29tcGxldGlvbnMuanNvbiBmaWxlIHVzZWQgdG8gYXV0byBjb21wbGV0ZSBpcyBhIGNvcHkgb2YgdGhlIG9uZSB1c2VkIGJ5IHRoZSBhdG9tXG4jIHBhY2thZ2UuIFRoYXQgcGFja2FnZSwgcHJvdmlkZWQgYXMgYW4gQXRvbSBiYXNlIHBhY2thZ2UsIGhhcyB0b29scyB0byB1cGRhdGUgdGhlIGNvbXBsZXRpb25zLmpzb24gZmlsZSBmcm9tIHRoZSB3ZWIuXG4jIFNlZSB0aGF0IHBhY2thZ2UgZm9yIG1vcmUgaW5mbyBhbmQganVzdCBjb3B5IHRoZSBjb21wbGV0aW9ucy5qc29uIHRvIHRoaXMgZmlsZXMgZGlyZWN0b3J5IHdoZW4gYSByZWZyZXNoIGlzIG5lZWRlZC5cblxuZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5maXJzdElubGluZVByb3BlcnR5TmFtZVdpdGhDb2xvblBhdHRlcm4gPSAve1xccyooXFxTKylcXHMqOi8gIyAuZXhhbXBsZSB7IGRpc3BsYXk6IH1cbmlubGluZVByb3BlcnR5TmFtZVdpdGhDb2xvblBhdHRlcm4gPSAvKD86Oy4rPykqO1xccyooXFxTKylcXHMqOi8gIyAuZXhhbXBsZSB7IGRpc3BsYXk6IGJsb2NrOyBmbG9hdDogbGVmdDsgY29sb3I6IH0gKG1hdGNoIHRoZSBsYXN0IG9uZSlcbnByb3BlcnR5TmFtZVdpdGhDb2xvblBhdHRlcm4gPSAvXlxccyooXFxTKylcXHMqOi8gIyBkaXNwbGF5OlxucHJvcGVydHlOYW1lUHJlZml4UGF0dGVybiA9IC9bYS16QS1aXStbLWEtekEtWl0qJC9cbnBlc3Vkb1NlbGVjdG9yUHJlZml4UGF0dGVybiA9IC86KDopPyhbYS16XStbYS16LV0qKT8kL1xudGFnU2VsZWN0b3JQcmVmaXhQYXR0ZXJuID0gLyhefFxcc3wsKShbYS16XSspPyQvXG5pbXBvcnRhbnRQcmVmaXhQYXR0ZXJuID0gLyghW2Etel0rKSQvXG5jc3NEb2NzVVJMID0gXCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1NcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHNlbGVjdG9yOiAnLnNvdXJjZS5pbnNpZGUtanMuY3NzLnN0eWxlZCwgLnNvdXJjZS5jc3Muc3R5bGVkJ1xuICBkaXNhYmxlRm9yU2VsZWN0b3I6IFwiLnNvdXJjZS5pbnNpZGUtanMuY3NzLnN0eWxlZCAuY29tbWVudCwgLnNvdXJjZS5pbnNpZGUtanMuY3NzLnN0eWxlZCAuc3RyaW5nLCAuc291cmNlLmluc2lkZS1qcy5jc3Muc3R5bGVkIC5lbnRpdHkucXVhc2kuZWxlbWVudC5qcywgLnNvdXJjZS5jc3Muc3R5bGVkIC5jb21tZW50LCAuc291cmNlLmNzcy5zdHlsZWQgLnN0cmluZywgLnNvdXJjZS5jc3Muc3R5bGVkIC5lbnRpdHkucXVhc2kuZWxlbWVudC5qc1wiXG5cbiAgZmlsdGVyU3VnZ2VzdGlvbnM6IHRydWVcbiAgaW5jbHVzaW9uUHJpb3JpdHk6IDEwMDAwXG4gIGV4Y2x1ZGVMb3dlclByaW9yaXR5OiBmYWxzZVxuXG4gIGdldFN1Z2dlc3Rpb25zOiAocmVxdWVzdCkgLT5cbiAgICBjb21wbGV0aW9ucyA9IG51bGxcbiAgICBzY29wZXMgPSByZXF1ZXN0LnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG5cbiAgICBpZiBAaXNDb21wbGV0aW5nVmFsdWUocmVxdWVzdClcbiAgICAgIGNvbXBsZXRpb25zID0gQGdldFByb3BlcnR5VmFsdWVDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgIGVsc2UgaWYgQGlzQ29tcGxldGluZ1BzZXVkb1NlbGVjdG9yKHJlcXVlc3QpXG4gICAgICBjb21wbGV0aW9ucyA9IEBnZXRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb25zKHJlcXVlc3QpXG4gICAgZWxzZVxuICAgICAgaWYgQGlzQ29tcGxldGluZ05hbWUocmVxdWVzdClcbiAgICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHJvcGVydHlOYW1lQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICAgIGVsc2UgaWYgQGlzQ29tcGxldGluZ05hbWVPclRhZyhyZXF1ZXN0KVxuICAgICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eU5hbWVDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgICAgICAgIC5jb25jYXQoQGdldFRhZ0NvbXBsZXRpb25zKHJlcXVlc3QpKVxuXG4gICAgcmV0dXJuIGNvbXBsZXRpb25zXG5cbiAgb25EaWRJbnNlcnRTdWdnZXN0aW9uOiAoe2VkaXRvciwgc3VnZ2VzdGlvbn0pIC0+XG4gICAgc2V0VGltZW91dChAdHJpZ2dlckF1dG9jb21wbGV0ZS5iaW5kKHRoaXMsIGVkaXRvciksIDEpIGlmIHN1Z2dlc3Rpb24udHlwZSBpcyAncHJvcGVydHknXG5cbiAgdHJpZ2dlckF1dG9jb21wbGV0ZTogKGVkaXRvcikgLT5cbiAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCAnYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGUnLCB7YWN0aXZhdGVkTWFudWFsbHk6IGZhbHNlfSlcblxuICBsb2FkUHJvcGVydGllczogLT5cbiAgICBAcHJvcGVydGllcyA9IHt9XG4gICAgZnMucmVhZEZpbGUgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2NvbXBsZXRpb25zLmpzb24nKSwgKGVycm9yLCBjb250ZW50KSA9PlxuICAgICAge0Bwc2V1ZG9TZWxlY3RvcnMsIEBwcm9wZXJ0aWVzLCBAdGFnc30gPSBKU09OLnBhcnNlKGNvbnRlbnQpIHVubGVzcyBlcnJvcj9cblxuICAgICAgcmV0dXJuXG5cbiAgaXNDb21wbGV0aW5nVmFsdWU6ICh7c2NvcGVEZXNjcmlwdG9yLCBidWZmZXJQb3NpdGlvbiwgcHJlZml4LCBlZGl0b3J9KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG5cbiAgICBiZWZvcmVQcmVmaXhCdWZmZXJQb3NpdGlvbiA9IFtidWZmZXJQb3NpdGlvbi5yb3csIE1hdGgubWF4KDAsIGJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIHByZWZpeC5sZW5ndGggLSAxKV1cbiAgICBiZWZvcmVQcmVmaXhTY29wZXMgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oYmVmb3JlUHJlZml4QnVmZmVyUG9zaXRpb24pXG4gICAgYmVmb3JlUHJlZml4U2NvcGVzQXJyYXkgPSBiZWZvcmVQcmVmaXhTY29wZXMuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgcmV0dXJuIChoYXNTY29wZShzY29wZXMsICdtZXRhLnByb3BlcnR5LXZhbHVlcy5jc3MnKSkgb3JcbiAgICAgIChoYXNTY29wZShiZWZvcmVQcmVmaXhTY29wZXNBcnJheSAsICdtZXRhLnByb3BlcnR5LXZhbHVlcy5jc3MnKSlcblxuICBpc0NvbXBsZXRpbmdOYW1lOiAoe3Njb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb24sIGVkaXRvcn0pIC0+XG4gICAgc2NvcGUgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKS5zbGljZSgtMSlcbiAgICBwcmVmaXggPSBAZ2V0UHJvcGVydHlOYW1lUHJlZml4KGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3IpXG4gICAgcmV0dXJuIEBpc1Byb3BlcnR5TmFtZVByZWZpeChwcmVmaXgpIGFuZCAoc2NvcGVbMF0gaXMgJ21ldGEucHJvcGVydHktbGlzdC5jc3MnKVxuXG4gIGlzQ29tcGxldGluZ05hbWVPclRhZzogKHtzY29wZURlc2NyaXB0b3IsIGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHNjb3BlID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpXG4gICAgcHJlZml4ID0gQGdldFByb3BlcnR5TmFtZVByZWZpeChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHJldHVybiBAaXNQcm9wZXJ0eU5hbWVQcmVmaXgocHJlZml4KSBhbmRcbiAgICAgKChzY29wZVswXSBpcyAnbWV0YS5wcm9wZXJ0eS1saXN0LmNzcycpIG9yXG4gICAgICAoc2NvcGVbMF0gaXMgJ3NvdXJjZS5jc3Muc3R5bGVkJykgb3JcbiAgICAgIChzY29wZVswXSBpcyAnZW50aXR5Lm5hbWUudGFnLmNzcycpIG9yXG4gICAgICAoc2NvcGVbMF0gaXMgJ3NvdXJjZS5pbnNpZGUtanMuY3NzLnN0eWxlZCcpKVxuXG4gIGlzQ29tcGxldGluZ1BzZXVkb1NlbGVjdG9yOiAoe2VkaXRvciwgc2NvcGVEZXNjcmlwdG9yLCBidWZmZXJQb3NpdGlvbn0pIC0+XG4gICAgc2NvcGUgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKS5zbGljZSgtMSlcbiAgICByZXR1cm4gKCAoIHNjb3BlWzBdIGlzICdjb25zdGFudC5sYW5ndWFnZS5wc2V1ZG8ucHJlZml4ZWQuY3NzJykgb3JcbiAgICAgICggc2NvcGVbMF0gaXMgJ2tleXdvcmQub3BlcmF0b3IucHNldWRvLmNzcycpIClcblxuICBpc1Byb3BlcnR5VmFsdWVQcmVmaXg6IChwcmVmaXgpIC0+XG4gICAgcHJlZml4ID0gcHJlZml4LnRyaW0oKVxuICAgIHByZWZpeC5sZW5ndGggPiAwIGFuZCBwcmVmaXggaXNudCAnOidcblxuICBpc1Byb3BlcnR5TmFtZVByZWZpeDogKHByZWZpeCkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZWZpeD9cbiAgICBwcmVmaXggPSBwcmVmaXgudHJpbSgpXG4gICAgcHJlZml4Lm1hdGNoKC9eW2EtekEtWi1dKyQvKVxuXG4gIGdldEltcG9ydGFudFByZWZpeDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBpbXBvcnRhbnRQcmVmaXhQYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG5cbiAgZ2V0UHJldmlvdXNQcm9wZXJ0eU5hbWU6IChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKSAtPlxuICAgIHtyb3d9ID0gYnVmZmVyUG9zaXRpb25cbiAgICB3aGlsZSByb3cgPj0gMFxuICAgICAgbGluZSA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gICAgICBwcm9wZXJ0eU5hbWUgPSBpbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG4gICAgICBwcm9wZXJ0eU5hbWUgPz0gZmlyc3RJbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG4gICAgICBwcm9wZXJ0eU5hbWUgPz0gcHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZSBpZiBwcm9wZXJ0eU5hbWVcbiAgICAgIHJvdy0tXG4gICAgcmV0dXJuXG5cbiAgZ2V0UHJvcGVydHlWYWx1ZUNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3IsIHByZWZpeCwgc2NvcGVEZXNjcmlwdG9yfSkgLT5cbiAgICBwcm9wZXJ0eSA9IEBnZXRQcmV2aW91c1Byb3BlcnR5TmFtZShidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHZhbHVlcyA9IEBwcm9wZXJ0aWVzW3Byb3BlcnR5XT8udmFsdWVzXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHZhbHVlcz9cblxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgYWRkU2VtaWNvbG9uID0gbm90IGxpbmVFbmRzV2l0aFNlbWljb2xvbihidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuXG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGlmIEBpc1Byb3BlcnR5VmFsdWVQcmVmaXgocHJlZml4KVxuICAgICAgZm9yIHZhbHVlIGluIHZhbHVlcyB3aGVuIGZpcnN0Q2hhcnNFcXVhbCh2YWx1ZSwgcHJlZml4KVxuICAgICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5VmFsdWVDb21wbGV0aW9uKHZhbHVlLCBwcm9wZXJ0eSwgYWRkU2VtaWNvbG9uKSlcbiAgICBlbHNlXG4gICAgICBmb3IgdmFsdWUgaW4gdmFsdWVzXG4gICAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkUHJvcGVydHlWYWx1ZUNvbXBsZXRpb24odmFsdWUsIHByb3BlcnR5LCBhZGRTZW1pY29sb24pKVxuXG4gICAgaWYgaW1wb3J0YW50UHJlZml4ID0gQGdldEltcG9ydGFudFByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgY29tcGxldGlvbnMucHVzaFxuICAgICAgICB0eXBlOiAna2V5d29yZCdcbiAgICAgICAgdGV4dDogJyFpbXBvcnRhbnQnXG4gICAgICAgIGRpc3BsYXlUZXh0OiAnIWltcG9ydGFudCdcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IGltcG9ydGFudFByZWZpeFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJGb3JjZXMgdGhpcyBwcm9wZXJ0eSB0byBvdmVycmlkZSBhbnkgb3RoZXIgZGVjbGFyYXRpb24gb2YgdGhlIHNhbWUgcHJvcGVydHkuIFVzZSB3aXRoIGNhdXRpb24uXCJcbiAgICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vU3BlY2lmaWNpdHkjVGhlXyFpbXBvcnRhbnRfZXhjZXB0aW9uXCJcblxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbjogKHZhbHVlLCBwcm9wZXJ0eU5hbWUsIGFkZFNlbWljb2xvbikgLT5cbiAgICB0ZXh0ID0gdmFsdWVcbiAgICB0ZXh0ICs9ICc7JyBpZiBhZGRTZW1pY29sb25cbiAgICB0ZXh0ID0gbWFrZVNuaXBwZXQodGV4dClcblxuICAgIHtcbiAgICAgIHR5cGU6ICd2YWx1ZSdcbiAgICAgIHNuaXBwZXQ6IHRleHRcbiAgICAgIGRpc3BsYXlUZXh0OiB2YWx1ZVxuICAgICAgZGVzY3JpcHRpb246IFwiI3t2YWx1ZX0gdmFsdWUgZm9yIHRoZSAje3Byb3BlcnR5TmFtZX0gcHJvcGVydHlcIlxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vI3twcm9wZXJ0eU5hbWV9I1ZhbHVlc1wiXG4gICAgfVxuXG4gIGdldFByb3BlcnR5TmFtZVByZWZpeDogKGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3IpIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBwcm9wZXJ0eU5hbWVQcmVmaXhQYXR0ZXJuLmV4ZWMobGluZSk/WzBdXG5cbiAgZ2V0UHJvcGVydHlOYW1lQ29tcGxldGlvbnM6ICh7YnVmZmVyUG9zaXRpb24sIGVkaXRvciwgc2NvcGVEZXNjcmlwdG9yLCBhY3RpdmF0ZWRNYW51YWxseX0pIC0+XG4gICAgc2NvcGVzID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClcbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuXG4gICAgcHJlZml4ID0gQGdldFByb3BlcnR5TmFtZVByZWZpeChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHJldHVybiBbXSB1bmxlc3MgYWN0aXZhdGVkTWFudWFsbHkgb3IgcHJlZml4XG5cbiAgICBjb21wbGV0aW9ucyA9IFtdXG4gICAgZm9yIHByb3BlcnR5LCBvcHRpb25zIG9mIEBwcm9wZXJ0aWVzIHdoZW4gbm90IHByZWZpeCBvciBmaXJzdENoYXJzRXF1YWwocHJvcGVydHksIHByZWZpeClcbiAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkUHJvcGVydHlOYW1lQ29tcGxldGlvbihwcm9wZXJ0eSwgcHJlZml4LCBvcHRpb25zKSlcbiAgICBjb21wbGV0aW9uc1xuXG4gIGJ1aWxkUHJvcGVydHlOYW1lQ29tcGxldGlvbjogKHByb3BlcnR5TmFtZSwgcHJlZml4LCB7ZGVzY3JpcHRpb259KSAtPlxuICAgIHR5cGU6ICdwcm9wZXJ0eSdcbiAgICB0ZXh0OiBcIiN7cHJvcGVydHlOYW1lfTogXCJcbiAgICBkaXNwbGF5VGV4dDogcHJvcGVydHlOYW1lXG4gICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeFxuICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogXCIje2Nzc0RvY3NVUkx9LyN7cHJvcGVydHlOYW1lfVwiXG5cbiAgZ2V0UHNldWRvU2VsZWN0b3JQcmVmaXg6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgbGluZS5tYXRjaChwZXN1ZG9TZWxlY3RvclByZWZpeFBhdHRlcm4pP1swXVxuXG4gIGdldFBzZXVkb1NlbGVjdG9yQ29tcGxldGlvbnM6ICh7YnVmZmVyUG9zaXRpb24sIGVkaXRvcn0pIC0+XG4gICAgcHJlZml4ID0gQGdldFBzZXVkb1NlbGVjdG9yUHJlZml4KGVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHByZWZpeFxuXG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGZvciBwc2V1ZG9TZWxlY3Rvciwgb3B0aW9ucyBvZiBAcHNldWRvU2VsZWN0b3JzIHdoZW4gZmlyc3RDaGFyc0VxdWFsKHBzZXVkb1NlbGVjdG9yLCBwcmVmaXgpXG4gICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFBzZXVkb1NlbGVjdG9yQ29tcGxldGlvbihwc2V1ZG9TZWxlY3RvciwgcHJlZml4LCBvcHRpb25zKSlcbiAgICBjb21wbGV0aW9uc1xuXG4gIGJ1aWxkUHNldWRvU2VsZWN0b3JDb21wbGV0aW9uOiAocHNldWRvU2VsZWN0b3IsIHByZWZpeCwge2FyZ3VtZW50LCBkZXNjcmlwdGlvbn0pIC0+XG4gICAgY29tcGxldGlvbiA9XG4gICAgICB0eXBlOiAncHNldWRvLXNlbGVjdG9yJ1xuICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFwiI3tjc3NEb2NzVVJMfS8je3BzZXVkb1NlbGVjdG9yfVwiXG5cbiAgICBpZiBhcmd1bWVudD9cbiAgICAgIGNvbXBsZXRpb24uc25pcHBldCA9IFwiI3twc2V1ZG9TZWxlY3Rvcn0oJHsxOiN7YXJndW1lbnR9fSlcIlxuICAgIGVsc2VcbiAgICAgIGNvbXBsZXRpb24udGV4dCA9IHBzZXVkb1NlbGVjdG9yXG4gICAgY29tcGxldGlvblxuXG4gIGdldFRhZ1NlbGVjdG9yUHJlZml4OiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIHRhZ1NlbGVjdG9yUHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1syXVxuXG4gIGdldFRhZ0NvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3IsIHByZWZpeH0pIC0+XG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGlmIHByZWZpeFxuICAgICAgZm9yIHRhZyBpbiBAdGFncyB3aGVuIGZpcnN0Q2hhcnNFcXVhbCh0YWcsIHByZWZpeClcbiAgICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRUYWdDb21wbGV0aW9uKHRhZykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFRhZ0NvbXBsZXRpb246ICh0YWcpIC0+XG4gICAgdHlwZTogJ3RhZydcbiAgICB0ZXh0OiB0YWdcbiAgICBkZXNjcmlwdGlvbjogXCJTZWxlY3RvciBmb3IgPCN7dGFnfT4gZWxlbWVudHNcIlxuXG5saW5lRW5kc1dpdGhTZW1pY29sb24gPSAoYnVmZmVyUG9zaXRpb24sIGVkaXRvcikgLT5cbiAge3Jvd30gPSBidWZmZXJQb3NpdGlvblxuICBsaW5lID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgLztcXHMqJC8udGVzdChsaW5lKVxuXG5oYXNTY29wZSA9IChzY29wZXNBcnJheSwgc2NvcGUpIC0+XG4gIHNjb3Blc0FycmF5LmluZGV4T2Yoc2NvcGUpIGlzbnQgLTFcblxuZmlyc3RDaGFyc0VxdWFsID0gKHN0cjEsIHN0cjIpIC0+XG4gIHN0cjFbMF0udG9Mb3dlckNhc2UoKSBpcyBzdHIyWzBdLnRvTG93ZXJDYXNlKClcblxuIyBsb29rcyBhdCBhIHN0cmluZyBhbmQgcmVwbGFjZXMgY29uc2VjdXRpdmUgKCkgd2l0aCBpbmNyZW1lbnRpbmcgc25pcHBldCBwb3NpdGlvbnMgKCRuKVxuIyBJdCBhbHNvIGFkZHMgYSB0cmFpbGluZyAkbiBhdCBlbmQgb2YgdGV4dFxuIyBlLmcgdHJhbnNsYXRlKCkgYmVjb21lcyB0cmFuc2xhdGUoJDEpJDJcbm1ha2VTbmlwcGV0ID0gKHRleHQpICAtPlxuICBzbmlwcGV0TnVtYmVyID0gMFxuICB3aGlsZSB0ZXh0LmluY2x1ZGVzKCcoKScpXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgnKCknLCBcIigkI3srK3NuaXBwZXROdW1iZXJ9KVwiKVxuICB0ZXh0ID0gdGV4dCArIFwiJCN7KytzbmlwcGV0TnVtYmVyfVwiXG4gIHJldHVybiB0ZXh0XG4iXX0=
