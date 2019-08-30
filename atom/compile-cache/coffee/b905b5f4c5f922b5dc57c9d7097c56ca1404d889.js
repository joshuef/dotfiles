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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvbGliL2F1dG8tY29tcGxldGUtc3R5bGVkLWNvbXBvbmVudHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBO0FBQUEsTUFBQTs7RUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLHVDQUFBLEdBQTBDOztFQUMxQyxrQ0FBQSxHQUFxQzs7RUFDckMsNEJBQUEsR0FBK0I7O0VBQy9CLHlCQUFBLEdBQTRCOztFQUM1QiwyQkFBQSxHQUE4Qjs7RUFDOUIsd0JBQUEsR0FBMkI7O0VBQzNCLHNCQUFBLEdBQXlCOztFQUN6QixVQUFBLEdBQWE7O0VBRWIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxrREFBVjtJQUNBLGtCQUFBLEVBQW9CLDBPQURwQjtJQUdBLGlCQUFBLEVBQW1CLElBSG5CO0lBSUEsaUJBQUEsRUFBbUIsS0FKbkI7SUFLQSxvQkFBQSxFQUFzQixLQUx0QjtJQU9BLGNBQUEsRUFBZ0IsU0FBQyxPQUFEO0FBQ2QsVUFBQTtNQUFBLFdBQUEsR0FBYztNQUNkLE1BQUEsR0FBUyxPQUFPLENBQUMsZUFBZSxDQUFDLGNBQXhCLENBQUE7TUFFVCxJQUFHLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixPQUFuQixDQUFIO1FBQ0UsV0FBQSxHQUFjLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixPQUE3QixFQURoQjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsT0FBNUIsQ0FBSDtRQUNILFdBQUEsR0FBYyxJQUFDLENBQUEsNEJBQUQsQ0FBOEIsT0FBOUIsRUFEWDtPQUFBLE1BQUE7UUFHSCxJQUFHLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixPQUFsQixDQUFIO1VBQ0UsV0FBQSxHQUFjLElBQUMsQ0FBQSwwQkFBRCxDQUE0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LmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1jc3MgYnV0IGhhcyBiZWVuIG1vZGlmaWVkIHRvIGFsbG93IGl0IHRvIGJlIHVzZWRcbiMgZm9yIHN0eWxlZC1jb21wb25lbmV0cy4gVGhlIGNvbXBsZXRpb25zLmpzb24gZmlsZSB1c2VkIHRvIGF1dG8gY29tcGxldGUgaXMgYSBjb3B5IG9mIHRoZSBvbmUgdXNlZCBieSB0aGUgYXRvbVxuIyBwYWNrYWdlLiBUaGF0IHBhY2thZ2UsIHByb3ZpZGVkIGFzIGFuIEF0b20gYmFzZSBwYWNrYWdlLCBoYXMgdG9vbHMgdG8gdXBkYXRlIHRoZSBjb21wbGV0aW9ucy5qc29uIGZpbGUgZnJvbSB0aGUgd2ViLlxuIyBTZWUgdGhhdCBwYWNrYWdlIGZvciBtb3JlIGluZm8gYW5kIGp1c3QgY29weSB0aGUgY29tcGxldGlvbnMuanNvbiB0byB0aGlzIGZpbGVzIGRpcmVjdG9yeSB3aGVuIGEgcmVmcmVzaCBpcyBuZWVkZWQuXG5cbmZzID0gcmVxdWlyZSAnZnMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuZmlyc3RJbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gL3tcXHMqKFxcUyspXFxzKjovICMgLmV4YW1wbGUgeyBkaXNwbGF5OiB9XG5pbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gLyg/OjsuKz8pKjtcXHMqKFxcUyspXFxzKjovICMgLmV4YW1wbGUgeyBkaXNwbGF5OiBibG9jazsgZmxvYXQ6IGxlZnQ7IGNvbG9yOiB9IChtYXRjaCB0aGUgbGFzdCBvbmUpXG5wcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gL15cXHMqKFxcUyspXFxzKjovICMgZGlzcGxheTpcbnByb3BlcnR5TmFtZVByZWZpeFBhdHRlcm4gPSAvW2EtekEtWl0rWy1hLXpBLVpdKiQvXG5wZXN1ZG9TZWxlY3RvclByZWZpeFBhdHRlcm4gPSAvOig6KT8oW2Etel0rW2Etei1dKik/JC9cbnRhZ1NlbGVjdG9yUHJlZml4UGF0dGVybiA9IC8oXnxcXHN8LCkoW2Etel0rKT8kL1xuaW1wb3J0YW50UHJlZml4UGF0dGVybiA9IC8oIVthLXpdKykkL1xuY3NzRG9jc1VSTCA9IFwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuICBzZWxlY3RvcjogJy5zb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQsIC5zb3VyY2UuY3NzLnN0eWxlZCdcbiAgZGlzYWJsZUZvclNlbGVjdG9yOiBcIi5zb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQgLmNvbW1lbnQsIC5zb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQgLnN0cmluZywgLnNvdXJjZS5pbnNpZGUtanMuY3NzLnN0eWxlZCAuZW50aXR5LnF1YXNpLmVsZW1lbnQuanMsIC5zb3VyY2UuY3NzLnN0eWxlZCAuY29tbWVudCwgLnNvdXJjZS5jc3Muc3R5bGVkIC5zdHJpbmcsIC5zb3VyY2UuY3NzLnN0eWxlZCAuZW50aXR5LnF1YXNpLmVsZW1lbnQuanNcIlxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zOiB0cnVlXG4gIGluY2x1c2lvblByaW9yaXR5OiAxMDAwMFxuICBleGNsdWRlTG93ZXJQcmlvcml0eTogZmFsc2VcblxuICBnZXRTdWdnZXN0aW9uczogKHJlcXVlc3QpIC0+XG4gICAgY29tcGxldGlvbnMgPSBudWxsXG4gICAgc2NvcGVzID0gcmVxdWVzdC5zY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgaWYgQGlzQ29tcGxldGluZ1ZhbHVlKHJlcXVlc3QpXG4gICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICBlbHNlIGlmIEBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcihyZXF1ZXN0KVxuICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHNldWRvU2VsZWN0b3JDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgIGVsc2VcbiAgICAgIGlmIEBpc0NvbXBsZXRpbmdOYW1lKHJlcXVlc3QpXG4gICAgICAgIGNvbXBsZXRpb25zID0gQGdldFByb3BlcnR5TmFtZUNvbXBsZXRpb25zKHJlcXVlc3QpXG4gICAgICBlbHNlIGlmIEBpc0NvbXBsZXRpbmdOYW1lT3JUYWcocmVxdWVzdClcbiAgICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHJvcGVydHlOYW1lQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICAgICAgICAuY29uY2F0KEBnZXRUYWdDb21wbGV0aW9ucyhyZXF1ZXN0KSlcblxuICAgIHJldHVybiBjb21wbGV0aW9uc1xuXG4gIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogKHtlZGl0b3IsIHN1Z2dlc3Rpb259KSAtPlxuICAgIHNldFRpbWVvdXQoQHRyaWdnZXJBdXRvY29tcGxldGUuYmluZCh0aGlzLCBlZGl0b3IpLCAxKSBpZiBzdWdnZXN0aW9uLnR5cGUgaXMgJ3Byb3BlcnR5J1xuXG4gIHRyaWdnZXJBdXRvY29tcGxldGU6IChlZGl0b3IpIC0+XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJywge2FjdGl2YXRlZE1hbnVhbGx5OiBmYWxzZX0pXG5cbiAgbG9hZFByb3BlcnRpZXM6IC0+XG4gICAgQHByb3BlcnRpZXMgPSB7fVxuICAgIGZzLnJlYWRGaWxlIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdjb21wbGV0aW9ucy5qc29uJyksIChlcnJvciwgY29udGVudCkgPT5cbiAgICAgIHtAcHNldWRvU2VsZWN0b3JzLCBAcHJvcGVydGllcywgQHRhZ3N9ID0gSlNPTi5wYXJzZShjb250ZW50KSB1bmxlc3MgZXJyb3I/XG5cbiAgICAgIHJldHVyblxuXG4gIGlzQ29tcGxldGluZ1ZhbHVlOiAoe3Njb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeCwgZWRpdG9yfSkgLT5cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgYmVmb3JlUHJlZml4QnVmZmVyUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBNYXRoLm1heCgwLCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmVmaXgubGVuZ3RoIC0gMSldXG4gICAgYmVmb3JlUHJlZml4U2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJlZm9yZVByZWZpeEJ1ZmZlclBvc2l0aW9uKVxuICAgIGJlZm9yZVByZWZpeFNjb3Blc0FycmF5ID0gYmVmb3JlUHJlZml4U2NvcGVzLmdldFNjb3Blc0FycmF5KClcblxuICAgIHJldHVybiAoaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5wcm9wZXJ0eS12YWx1ZXMuY3NzJykpIG9yXG4gICAgICAoaGFzU2NvcGUoYmVmb3JlUHJlZml4U2NvcGVzQXJyYXkgLCAnbWV0YS5wcm9wZXJ0eS12YWx1ZXMuY3NzJykpXG5cbiAgaXNDb21wbGV0aW5nTmFtZTogKHtzY29wZURlc2NyaXB0b3IsIGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHNjb3BlID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpXG4gICAgcHJlZml4ID0gQGdldFByb3BlcnR5TmFtZVByZWZpeChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHJldHVybiBAaXNQcm9wZXJ0eU5hbWVQcmVmaXgocHJlZml4KSBhbmQgKHNjb3BlWzBdIGlzICdtZXRhLnByb3BlcnR5LWxpc3QuY3NzJylcblxuICBpc0NvbXBsZXRpbmdOYW1lT3JUYWc6ICh7c2NvcGVEZXNjcmlwdG9yLCBidWZmZXJQb3NpdGlvbiwgZWRpdG9yfSkgLT5cbiAgICBzY29wZSA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpLnNsaWNlKC0xKVxuICAgIHByZWZpeCA9IEBnZXRQcm9wZXJ0eU5hbWVQcmVmaXgoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICByZXR1cm4gQGlzUHJvcGVydHlOYW1lUHJlZml4KHByZWZpeCkgYW5kXG4gICAgICgoc2NvcGVbMF0gaXMgJ21ldGEucHJvcGVydHktbGlzdC5jc3MnKSBvclxuICAgICAgKHNjb3BlWzBdIGlzICdzb3VyY2UuY3NzLnN0eWxlZCcpIG9yXG4gICAgICAoc2NvcGVbMF0gaXMgJ2VudGl0eS5uYW1lLnRhZy5jc3MnKSBvclxuICAgICAgKHNjb3BlWzBdIGlzICdzb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQnKSlcblxuICBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcjogKHtlZGl0b3IsIHNjb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb259KSAtPlxuICAgIHNjb3BlID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpXG4gICAgcmV0dXJuICggKCBzY29wZVswXSBpcyAnY29uc3RhbnQubGFuZ3VhZ2UucHNldWRvLnByZWZpeGVkLmNzcycpIG9yXG4gICAgICAoIHNjb3BlWzBdIGlzICdrZXl3b3JkLm9wZXJhdG9yLnBzZXVkby5jc3MnKSApXG5cbiAgaXNQcm9wZXJ0eVZhbHVlUHJlZml4OiAocHJlZml4KSAtPlxuICAgIHByZWZpeCA9IHByZWZpeC50cmltKClcbiAgICBwcmVmaXgubGVuZ3RoID4gMCBhbmQgcHJlZml4IGlzbnQgJzonXG5cbiAgaXNQcm9wZXJ0eU5hbWVQcmVmaXg6IChwcmVmaXgpIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVmaXg/XG4gICAgcHJlZml4ID0gcHJlZml4LnRyaW0oKVxuICAgIHByZWZpeC5tYXRjaCgvXlthLXpBLVotXSskLylcblxuICBnZXRJbXBvcnRhbnRQcmVmaXg6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgaW1wb3J0YW50UHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1sxXVxuXG4gIGdldFByZXZpb3VzUHJvcGVydHlOYW1lOiAoYnVmZmVyUG9zaXRpb24sIGVkaXRvcikgLT5cbiAgICB7cm93fSA9IGJ1ZmZlclBvc2l0aW9uXG4gICAgd2hpbGUgcm93ID49IDBcbiAgICAgIGxpbmUgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVxuICAgICAgcHJvcGVydHlOYW1lID0gaW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcHJvcGVydHlOYW1lID89IGZpcnN0SW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcHJvcGVydHlOYW1lID89IHByb3BlcnR5TmFtZVdpdGhDb2xvblBhdHRlcm4uZXhlYyhsaW5lKT9bMV1cbiAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWUgaWYgcHJvcGVydHlOYW1lXG4gICAgICByb3ctLVxuICAgIHJldHVyblxuXG4gIGdldFByb3BlcnR5VmFsdWVDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBwcmVmaXgsIHNjb3BlRGVzY3JpcHRvcn0pIC0+XG4gICAgcHJvcGVydHkgPSBAZ2V0UHJldmlvdXNQcm9wZXJ0eU5hbWUoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICB2YWx1ZXMgPSBAcHJvcGVydGllc1twcm9wZXJ0eV0/LnZhbHVlc1xuICAgIHJldHVybiBudWxsIHVubGVzcyB2YWx1ZXM/XG5cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIGFkZFNlbWljb2xvbiA9IG5vdCBsaW5lRW5kc1dpdGhTZW1pY29sb24oYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcblxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBpZiBAaXNQcm9wZXJ0eVZhbHVlUHJlZml4KHByZWZpeClcbiAgICAgIGZvciB2YWx1ZSBpbiB2YWx1ZXMgd2hlbiBmaXJzdENoYXJzRXF1YWwodmFsdWUsIHByZWZpeClcbiAgICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbih2YWx1ZSwgcHJvcGVydHksIGFkZFNlbWljb2xvbikpXG4gICAgZWxzZVxuICAgICAgZm9yIHZhbHVlIGluIHZhbHVlc1xuICAgICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5VmFsdWVDb21wbGV0aW9uKHZhbHVlLCBwcm9wZXJ0eSwgYWRkU2VtaWNvbG9uKSlcblxuICAgIGlmIGltcG9ydGFudFByZWZpeCA9IEBnZXRJbXBvcnRhbnRQcmVmaXgoZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcbiAgICAgIGNvbXBsZXRpb25zLnB1c2hcbiAgICAgICAgdHlwZTogJ2tleXdvcmQnXG4gICAgICAgIHRleHQ6ICchaW1wb3J0YW50J1xuICAgICAgICBkaXNwbGF5VGV4dDogJyFpbXBvcnRhbnQnXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBpbXBvcnRhbnRQcmVmaXhcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRm9yY2VzIHRoaXMgcHJvcGVydHkgdG8gb3ZlcnJpZGUgYW55IG90aGVyIGRlY2xhcmF0aW9uIG9mIHRoZSBzYW1lIHByb3BlcnR5LiBVc2Ugd2l0aCBjYXV0aW9uLlwiXG4gICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogXCIje2Nzc0RvY3NVUkx9L1NwZWNpZmljaXR5I1RoZV8haW1wb3J0YW50X2V4Y2VwdGlvblwiXG5cbiAgICBjb21wbGV0aW9uc1xuXG4gIGJ1aWxkUHJvcGVydHlWYWx1ZUNvbXBsZXRpb246ICh2YWx1ZSwgcHJvcGVydHlOYW1lLCBhZGRTZW1pY29sb24pIC0+XG4gICAgdGV4dCA9IHZhbHVlXG4gICAgdGV4dCArPSAnOycgaWYgYWRkU2VtaWNvbG9uXG4gICAgdGV4dCA9IG1ha2VTbmlwcGV0KHRleHQpXG5cbiAgICB7XG4gICAgICB0eXBlOiAndmFsdWUnXG4gICAgICBzbmlwcGV0OiB0ZXh0XG4gICAgICBkaXNwbGF5VGV4dDogdmFsdWVcbiAgICAgIGRlc2NyaXB0aW9uOiBcIiN7dmFsdWV9IHZhbHVlIGZvciB0aGUgI3twcm9wZXJ0eU5hbWV9IHByb3BlcnR5XCJcbiAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogXCIje2Nzc0RvY3NVUkx9LyN7cHJvcGVydHlOYW1lfSNWYWx1ZXNcIlxuICAgIH1cblxuICBnZXRQcm9wZXJ0eU5hbWVQcmVmaXg6IChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKSAtPlxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgcHJvcGVydHlOYW1lUHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1swXVxuXG4gIGdldFByb3BlcnR5TmFtZUNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3IsIHNjb3BlRGVzY3JpcHRvciwgYWN0aXZhdGVkTWFudWFsbHl9KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcblxuICAgIHByZWZpeCA9IEBnZXRQcm9wZXJ0eU5hbWVQcmVmaXgoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICByZXR1cm4gW10gdW5sZXNzIGFjdGl2YXRlZE1hbnVhbGx5IG9yIHByZWZpeFxuXG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGZvciBwcm9wZXJ0eSwgb3B0aW9ucyBvZiBAcHJvcGVydGllcyB3aGVuIG5vdCBwcmVmaXggb3IgZmlyc3RDaGFyc0VxdWFsKHByb3BlcnR5LCBwcmVmaXgpXG4gICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb24ocHJvcGVydHksIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb246IChwcm9wZXJ0eU5hbWUsIHByZWZpeCwge2Rlc2NyaXB0aW9ufSkgLT5cbiAgICB0eXBlOiAncHJvcGVydHknXG4gICAgdGV4dDogXCIje3Byb3BlcnR5TmFtZX06IFwiXG4gICAgZGlzcGxheVRleHQ6IHByb3BlcnR5TmFtZVxuICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFwiI3tjc3NEb2NzVVJMfS8je3Byb3BlcnR5TmFtZX1cIlxuXG4gIGdldFBzZXVkb1NlbGVjdG9yUHJlZml4OiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIGxpbmUubWF0Y2gocGVzdWRvU2VsZWN0b3JQcmVmaXhQYXR0ZXJuKT9bMF1cblxuICBnZXRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHByZWZpeCA9IEBnZXRQc2V1ZG9TZWxlY3RvclByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIHJldHVybiBudWxsIHVubGVzcyBwcmVmaXhcblxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBmb3IgcHNldWRvU2VsZWN0b3IsIG9wdGlvbnMgb2YgQHBzZXVkb1NlbGVjdG9ycyB3aGVuIGZpcnN0Q2hhcnNFcXVhbChwc2V1ZG9TZWxlY3RvciwgcHJlZml4KVxuICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb24ocHNldWRvU2VsZWN0b3IsIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFBzZXVkb1NlbGVjdG9yQ29tcGxldGlvbjogKHBzZXVkb1NlbGVjdG9yLCBwcmVmaXgsIHthcmd1bWVudCwgZGVzY3JpcHRpb259KSAtPlxuICAgIGNvbXBsZXRpb24gPVxuICAgICAgdHlwZTogJ3BzZXVkby1zZWxlY3RvcidcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vI3twc2V1ZG9TZWxlY3Rvcn1cIlxuXG4gICAgaWYgYXJndW1lbnQ/XG4gICAgICBjb21wbGV0aW9uLnNuaXBwZXQgPSBcIiN7cHNldWRvU2VsZWN0b3J9KCR7MToje2FyZ3VtZW50fX0pXCJcbiAgICBlbHNlXG4gICAgICBjb21wbGV0aW9uLnRleHQgPSBwc2V1ZG9TZWxlY3RvclxuICAgIGNvbXBsZXRpb25cblxuICBnZXRUYWdTZWxlY3RvclByZWZpeDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICB0YWdTZWxlY3RvclByZWZpeFBhdHRlcm4uZXhlYyhsaW5lKT9bMl1cblxuICBnZXRUYWdDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBwcmVmaXh9KSAtPlxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBpZiBwcmVmaXhcbiAgICAgIGZvciB0YWcgaW4gQHRhZ3Mgd2hlbiBmaXJzdENoYXJzRXF1YWwodGFnLCBwcmVmaXgpXG4gICAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkVGFnQ29tcGxldGlvbih0YWcpKVxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRUYWdDb21wbGV0aW9uOiAodGFnKSAtPlxuICAgIHR5cGU6ICd0YWcnXG4gICAgdGV4dDogdGFnXG4gICAgZGVzY3JpcHRpb246IFwiU2VsZWN0b3IgZm9yIDwje3RhZ30+IGVsZW1lbnRzXCJcblxubGluZUVuZHNXaXRoU2VtaWNvbG9uID0gKGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3IpIC0+XG4gIHtyb3d9ID0gYnVmZmVyUG9zaXRpb25cbiAgbGluZSA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gIC87XFxzKiQvLnRlc3QobGluZSlcblxuaGFzU2NvcGUgPSAoc2NvcGVzQXJyYXksIHNjb3BlKSAtPlxuICBzY29wZXNBcnJheS5pbmRleE9mKHNjb3BlKSBpc250IC0xXG5cbmZpcnN0Q2hhcnNFcXVhbCA9IChzdHIxLCBzdHIyKSAtPlxuICBzdHIxWzBdLnRvTG93ZXJDYXNlKCkgaXMgc3RyMlswXS50b0xvd2VyQ2FzZSgpXG5cbiMgbG9va3MgYXQgYSBzdHJpbmcgYW5kIHJlcGxhY2VzIGNvbnNlY3V0aXZlICgpIHdpdGggaW5jcmVtZW50aW5nIHNuaXBwZXQgcG9zaXRpb25zICgkbilcbiMgSXQgYWxzbyBhZGRzIGEgdHJhaWxpbmcgJG4gYXQgZW5kIG9mIHRleHRcbiMgZS5nIHRyYW5zbGF0ZSgpIGJlY29tZXMgdHJhbnNsYXRlKCQxKSQyXG5tYWtlU25pcHBldCA9ICh0ZXh0KSAgLT5cbiAgc25pcHBldE51bWJlciA9IDBcbiAgd2hpbGUgdGV4dC5pbmNsdWRlcygnKCknKVxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoJygpJywgXCIoJCN7KytzbmlwcGV0TnVtYmVyfSlcIilcbiAgdGV4dCA9IHRleHQgKyBcIiQjeysrc25pcHBldE51bWJlcn1cIlxuICByZXR1cm4gdGV4dFxuIl19
