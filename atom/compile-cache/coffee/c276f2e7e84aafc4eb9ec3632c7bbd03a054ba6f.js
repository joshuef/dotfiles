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
    suggestionPriority: 90,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1jb21wbGV0ZS1zdHlsZWQtY29tcG9uZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0E7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsdUNBQUEsR0FBMEM7O0VBQzFDLGtDQUFBLEdBQXFDOztFQUNyQyw0QkFBQSxHQUErQjs7RUFDL0IseUJBQUEsR0FBNEI7O0VBQzVCLDJCQUFBLEdBQThCOztFQUM5Qix3QkFBQSxHQUEyQjs7RUFDM0Isc0JBQUEsR0FBeUI7O0VBQ3pCLFVBQUEsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLGtEQUFWO0lBQ0Esa0JBQUEsRUFBb0IsME9BRHBCO0lBR0EsaUJBQUEsRUFBbUIsSUFIbkI7SUFJQSxpQkFBQSxFQUFtQixLQUpuQjtJQUtBLG9CQUFBLEVBQXNCLEtBTHRCO0lBTUEsa0JBQUEsRUFBb0IsRUFOcEI7SUFRQSxjQUFBLEVBQWdCLFNBQUMsT0FBRDtBQUNkLFVBQUE7TUFBQSxXQUFBLEdBQWM7TUFDZCxNQUFBLEdBQVMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxjQUF4QixDQUFBO01BRVQsSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsT0FBbkIsQ0FBSDtRQUNFLFdBQUEsR0FBYyxJQUFDLENBQUEsMkJBQUQsQ0FBNkIsT0FBN0IsRUFEaEI7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLDBCQUFELENBQTRCLE9BQTVCLENBQUg7UUFDSCxXQUFBLEdBQWMsSUFBQyxDQUFBLDRCQUFELENBQThCLE9BQTlCLEVBRFg7T0FBQSxNQUFBO1FBR0gsSUFBRyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsT0FBbEIsQ0FBSDtVQUNF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ZSB3YXMgYmFzZWQgdXBvbiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtY3NzIGJ1dCBoYXMgYmVlbiBtb2RpZmllZCB0byBhbGxvdyBpdCB0byBiZSB1c2VkXG4jIGZvciBzdHlsZWQtY29tcG9uZW5ldHMuIFRoZSBjb21wbGV0aW9ucy5qc29uIGZpbGUgdXNlZCB0byBhdXRvIGNvbXBsZXRlIGlzIGEgY29weSBvZiB0aGUgb25lIHVzZWQgYnkgdGhlIGF0b21cbiMgcGFja2FnZS4gVGhhdCBwYWNrYWdlLCBwcm92aWRlZCBhcyBhbiBBdG9tIGJhc2UgcGFja2FnZSwgaGFzIHRvb2xzIHRvIHVwZGF0ZSB0aGUgY29tcGxldGlvbnMuanNvbiBmaWxlIGZyb20gdGhlIHdlYi5cbiMgU2VlIHRoYXQgcGFja2FnZSBmb3IgbW9yZSBpbmZvIGFuZCBqdXN0IGNvcHkgdGhlIGNvbXBsZXRpb25zLmpzb24gdG8gdGhpcyBmaWxlcyBkaXJlY3Rvcnkgd2hlbiBhIHJlZnJlc2ggaXMgbmVlZGVkLlxuXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmZpcnN0SW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybiA9IC97XFxzKihcXFMrKVxccyo6LyAjIC5leGFtcGxlIHsgZGlzcGxheTogfVxuaW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybiA9IC8oPzo7Lis/KSo7XFxzKihcXFMrKVxccyo6LyAjIC5leGFtcGxlIHsgZGlzcGxheTogYmxvY2s7IGZsb2F0OiBsZWZ0OyBjb2xvcjogfSAobWF0Y2ggdGhlIGxhc3Qgb25lKVxucHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybiA9IC9eXFxzKihcXFMrKVxccyo6LyAjIGRpc3BsYXk6XG5wcm9wZXJ0eU5hbWVQcmVmaXhQYXR0ZXJuID0gL1thLXpBLVpdK1stYS16QS1aXSokL1xucGVzdWRvU2VsZWN0b3JQcmVmaXhQYXR0ZXJuID0gLzooOik/KFthLXpdK1thLXotXSopPyQvXG50YWdTZWxlY3RvclByZWZpeFBhdHRlcm4gPSAvKF58XFxzfCwpKFthLXpdKyk/JC9cbmltcG9ydGFudFByZWZpeFBhdHRlcm4gPSAvKCFbYS16XSspJC9cbmNzc0RvY3NVUkwgPSBcImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTU1wiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc2VsZWN0b3I6ICcuc291cmNlLmluc2lkZS1qcy5jc3Muc3R5bGVkLCAuc291cmNlLmNzcy5zdHlsZWQnXG4gIGRpc2FibGVGb3JTZWxlY3RvcjogXCIuc291cmNlLmluc2lkZS1qcy5jc3Muc3R5bGVkIC5jb21tZW50LCAuc291cmNlLmluc2lkZS1qcy5jc3Muc3R5bGVkIC5zdHJpbmcsIC5zb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQgLmVudGl0eS5xdWFzaS5lbGVtZW50LmpzLCAuc291cmNlLmNzcy5zdHlsZWQgLmNvbW1lbnQsIC5zb3VyY2UuY3NzLnN0eWxlZCAuc3RyaW5nLCAuc291cmNlLmNzcy5zdHlsZWQgLmVudGl0eS5xdWFzaS5lbGVtZW50LmpzXCJcblxuICBmaWx0ZXJTdWdnZXN0aW9uczogdHJ1ZVxuICBpbmNsdXNpb25Qcmlvcml0eTogMTAwMDBcbiAgZXhjbHVkZUxvd2VyUHJpb3JpdHk6IGZhbHNlXG4gIHN1Z2dlc3Rpb25Qcmlvcml0eTogOTBcblxuICBnZXRTdWdnZXN0aW9uczogKHJlcXVlc3QpIC0+XG4gICAgY29tcGxldGlvbnMgPSBudWxsXG4gICAgc2NvcGVzID0gcmVxdWVzdC5zY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgaWYgQGlzQ29tcGxldGluZ1ZhbHVlKHJlcXVlc3QpXG4gICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICBlbHNlIGlmIEBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcihyZXF1ZXN0KVxuICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHNldWRvU2VsZWN0b3JDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgIGVsc2VcbiAgICAgIGlmIEBpc0NvbXBsZXRpbmdOYW1lKHJlcXVlc3QpXG4gICAgICAgIGNvbXBsZXRpb25zID0gQGdldFByb3BlcnR5TmFtZUNvbXBsZXRpb25zKHJlcXVlc3QpXG4gICAgICBlbHNlIGlmIEBpc0NvbXBsZXRpbmdOYW1lT3JUYWcocmVxdWVzdClcbiAgICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHJvcGVydHlOYW1lQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICAgICAgICAuY29uY2F0KEBnZXRUYWdDb21wbGV0aW9ucyhyZXF1ZXN0KSlcblxuICAgIHJldHVybiBjb21wbGV0aW9uc1xuXG4gIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogKHtlZGl0b3IsIHN1Z2dlc3Rpb259KSAtPlxuICAgIHNldFRpbWVvdXQoQHRyaWdnZXJBdXRvY29tcGxldGUuYmluZCh0aGlzLCBlZGl0b3IpLCAxKSBpZiBzdWdnZXN0aW9uLnR5cGUgaXMgJ3Byb3BlcnR5J1xuXG4gIHRyaWdnZXJBdXRvY29tcGxldGU6IChlZGl0b3IpIC0+XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJywge2FjdGl2YXRlZE1hbnVhbGx5OiBmYWxzZX0pXG5cbiAgbG9hZFByb3BlcnRpZXM6IC0+XG4gICAgQHByb3BlcnRpZXMgPSB7fVxuICAgIGZzLnJlYWRGaWxlIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdjb21wbGV0aW9ucy5qc29uJyksIChlcnJvciwgY29udGVudCkgPT5cbiAgICAgIHtAcHNldWRvU2VsZWN0b3JzLCBAcHJvcGVydGllcywgQHRhZ3N9ID0gSlNPTi5wYXJzZShjb250ZW50KSB1bmxlc3MgZXJyb3I/XG5cbiAgICAgIHJldHVyblxuXG4gIGlzQ29tcGxldGluZ1ZhbHVlOiAoe3Njb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeCwgZWRpdG9yfSkgLT5cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgYmVmb3JlUHJlZml4QnVmZmVyUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBNYXRoLm1heCgwLCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmVmaXgubGVuZ3RoIC0gMSldXG4gICAgYmVmb3JlUHJlZml4U2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJlZm9yZVByZWZpeEJ1ZmZlclBvc2l0aW9uKVxuICAgIGJlZm9yZVByZWZpeFNjb3Blc0FycmF5ID0gYmVmb3JlUHJlZml4U2NvcGVzLmdldFNjb3Blc0FycmF5KClcblxuICAgIHJldHVybiAoaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5wcm9wZXJ0eS12YWx1ZXMuY3NzJykpIG9yXG4gICAgICAoaGFzU2NvcGUoYmVmb3JlUHJlZml4U2NvcGVzQXJyYXkgLCAnbWV0YS5wcm9wZXJ0eS12YWx1ZXMuY3NzJykpXG5cbiAgaXNDb21wbGV0aW5nTmFtZTogKHtzY29wZURlc2NyaXB0b3IsIGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHNjb3BlID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpXG4gICAgcHJlZml4ID0gQGdldFByb3BlcnR5TmFtZVByZWZpeChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHJldHVybiBAaXNQcm9wZXJ0eU5hbWVQcmVmaXgocHJlZml4KSBhbmQgKHNjb3BlWzBdIGlzICdtZXRhLnByb3BlcnR5LWxpc3QuY3NzJylcblxuICBpc0NvbXBsZXRpbmdOYW1lT3JUYWc6ICh7c2NvcGVEZXNjcmlwdG9yLCBidWZmZXJQb3NpdGlvbiwgZWRpdG9yfSkgLT5cbiAgICBzY29wZSA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpLnNsaWNlKC0xKVxuICAgIHByZWZpeCA9IEBnZXRQcm9wZXJ0eU5hbWVQcmVmaXgoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICByZXR1cm4gQGlzUHJvcGVydHlOYW1lUHJlZml4KHByZWZpeCkgYW5kXG4gICAgICgoc2NvcGVbMF0gaXMgJ21ldGEucHJvcGVydHktbGlzdC5jc3MnKSBvclxuICAgICAgKHNjb3BlWzBdIGlzICdzb3VyY2UuY3NzLnN0eWxlZCcpIG9yXG4gICAgICAoc2NvcGVbMF0gaXMgJ2VudGl0eS5uYW1lLnRhZy5jc3MnKSBvclxuICAgICAgKHNjb3BlWzBdIGlzICdzb3VyY2UuaW5zaWRlLWpzLmNzcy5zdHlsZWQnKSlcblxuICBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcjogKHtlZGl0b3IsIHNjb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb259KSAtPlxuICAgIHNjb3BlID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KCkuc2xpY2UoLTEpXG4gICAgcmV0dXJuICggKCBzY29wZVswXSBpcyAnY29uc3RhbnQubGFuZ3VhZ2UucHNldWRvLnByZWZpeGVkLmNzcycpIG9yXG4gICAgICAoIHNjb3BlWzBdIGlzICdrZXl3b3JkLm9wZXJhdG9yLnBzZXVkby5jc3MnKSApXG5cbiAgaXNQcm9wZXJ0eVZhbHVlUHJlZml4OiAocHJlZml4KSAtPlxuICAgIHByZWZpeCA9IHByZWZpeC50cmltKClcbiAgICBwcmVmaXgubGVuZ3RoID4gMCBhbmQgcHJlZml4IGlzbnQgJzonXG5cbiAgaXNQcm9wZXJ0eU5hbWVQcmVmaXg6IChwcmVmaXgpIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVmaXg/XG4gICAgcHJlZml4ID0gcHJlZml4LnRyaW0oKVxuICAgIHByZWZpeC5tYXRjaCgvXlthLXpBLVotXSskLylcblxuICBnZXRJbXBvcnRhbnRQcmVmaXg6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgaW1wb3J0YW50UHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1sxXVxuXG4gIGdldFByZXZpb3VzUHJvcGVydHlOYW1lOiAoYnVmZmVyUG9zaXRpb24sIGVkaXRvcikgLT5cbiAgICB7cm93fSA9IGJ1ZmZlclBvc2l0aW9uXG4gICAgd2hpbGUgcm93ID49IDBcbiAgICAgIGxpbmUgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVxuICAgICAgcHJvcGVydHlOYW1lID0gaW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcHJvcGVydHlOYW1lID89IGZpcnN0SW5saW5lUHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcHJvcGVydHlOYW1lID89IHByb3BlcnR5TmFtZVdpdGhDb2xvblBhdHRlcm4uZXhlYyhsaW5lKT9bMV1cbiAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWUgaWYgcHJvcGVydHlOYW1lXG4gICAgICByb3ctLVxuICAgIHJldHVyblxuXG4gIGdldFByb3BlcnR5VmFsdWVDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBwcmVmaXgsIHNjb3BlRGVzY3JpcHRvcn0pIC0+XG4gICAgcHJvcGVydHkgPSBAZ2V0UHJldmlvdXNQcm9wZXJ0eU5hbWUoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICB2YWx1ZXMgPSBAcHJvcGVydGllc1twcm9wZXJ0eV0/LnZhbHVlc1xuICAgIHJldHVybiBudWxsIHVubGVzcyB2YWx1ZXM/XG5cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIGFkZFNlbWljb2xvbiA9IG5vdCBsaW5lRW5kc1dpdGhTZW1pY29sb24oYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcblxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBpZiBAaXNQcm9wZXJ0eVZhbHVlUHJlZml4KHByZWZpeClcbiAgICAgIGZvciB2YWx1ZSBpbiB2YWx1ZXMgd2hlbiBmaXJzdENoYXJzRXF1YWwodmFsdWUsIHByZWZpeClcbiAgICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbih2YWx1ZSwgcHJvcGVydHksIGFkZFNlbWljb2xvbikpXG4gICAgZWxzZVxuICAgICAgZm9yIHZhbHVlIGluIHZhbHVlc1xuICAgICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5VmFsdWVDb21wbGV0aW9uKHZhbHVlLCBwcm9wZXJ0eSwgYWRkU2VtaWNvbG9uKSlcblxuICAgIGlmIGltcG9ydGFudFByZWZpeCA9IEBnZXRJbXBvcnRhbnRQcmVmaXgoZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcbiAgICAgIGNvbXBsZXRpb25zLnB1c2hcbiAgICAgICAgdHlwZTogJ2tleXdvcmQnXG4gICAgICAgIHRleHQ6ICchaW1wb3J0YW50J1xuICAgICAgICBkaXNwbGF5VGV4dDogJyFpbXBvcnRhbnQnXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBpbXBvcnRhbnRQcmVmaXhcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRm9yY2VzIHRoaXMgcHJvcGVydHkgdG8gb3ZlcnJpZGUgYW55IG90aGVyIGRlY2xhcmF0aW9uIG9mIHRoZSBzYW1lIHByb3BlcnR5LiBVc2Ugd2l0aCBjYXV0aW9uLlwiXG4gICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogXCIje2Nzc0RvY3NVUkx9L1NwZWNpZmljaXR5I1RoZV8haW1wb3J0YW50X2V4Y2VwdGlvblwiXG5cbiAgICBjb21wbGV0aW9uc1xuXG4gIGJ1aWxkUHJvcGVydHlWYWx1ZUNvbXBsZXRpb246ICh2YWx1ZSwgcHJvcGVydHlOYW1lLCBhZGRTZW1pY29sb24pIC0+XG4gICAgdGV4dCA9IHZhbHVlXG4gICAgdGV4dCArPSAnOycgaWYgYWRkU2VtaWNvbG9uXG4gICAgdGV4dCA9IG1ha2VTbmlwcGV0KHRleHQpXG5cbiAgICB7XG4gICAgICB0eXBlOiAndmFsdWUnXG4gICAgICBzbmlwcGV0OiB0ZXh0XG4gICAgICBkaXNwbGF5VGV4dDogdmFsdWVcbiAgICAgIGRlc2NyaXB0aW9uOiBcIiN7dmFsdWV9IHZhbHVlIGZvciB0aGUgI3twcm9wZXJ0eU5hbWV9IHByb3BlcnR5XCJcbiAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogXCIje2Nzc0RvY3NVUkx9LyN7cHJvcGVydHlOYW1lfSNWYWx1ZXNcIlxuICAgIH1cblxuICBnZXRQcm9wZXJ0eU5hbWVQcmVmaXg6IChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKSAtPlxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgcHJvcGVydHlOYW1lUHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1swXVxuXG4gIGdldFByb3BlcnR5TmFtZUNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3IsIHNjb3BlRGVzY3JpcHRvciwgYWN0aXZhdGVkTWFudWFsbHl9KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcblxuICAgIHByZWZpeCA9IEBnZXRQcm9wZXJ0eU5hbWVQcmVmaXgoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICByZXR1cm4gW10gdW5sZXNzIGFjdGl2YXRlZE1hbnVhbGx5IG9yIHByZWZpeFxuXG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGZvciBwcm9wZXJ0eSwgb3B0aW9ucyBvZiBAcHJvcGVydGllcyB3aGVuIG5vdCBwcmVmaXggb3IgZmlyc3RDaGFyc0VxdWFsKHByb3BlcnR5LCBwcmVmaXgpXG4gICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb24ocHJvcGVydHksIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb246IChwcm9wZXJ0eU5hbWUsIHByZWZpeCwge2Rlc2NyaXB0aW9ufSkgLT5cbiAgICB0eXBlOiAncHJvcGVydHknXG4gICAgdGV4dDogXCIje3Byb3BlcnR5TmFtZX06IFwiXG4gICAgZGlzcGxheVRleHQ6IHByb3BlcnR5TmFtZVxuICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFwiI3tjc3NEb2NzVVJMfS8je3Byb3BlcnR5TmFtZX1cIlxuXG4gIGdldFBzZXVkb1NlbGVjdG9yUHJlZml4OiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIGxpbmUubWF0Y2gocGVzdWRvU2VsZWN0b3JQcmVmaXhQYXR0ZXJuKT9bMF1cblxuICBnZXRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHByZWZpeCA9IEBnZXRQc2V1ZG9TZWxlY3RvclByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIHJldHVybiBudWxsIHVubGVzcyBwcmVmaXhcblxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBmb3IgcHNldWRvU2VsZWN0b3IsIG9wdGlvbnMgb2YgQHBzZXVkb1NlbGVjdG9ycyB3aGVuIGZpcnN0Q2hhcnNFcXVhbChwc2V1ZG9TZWxlY3RvciwgcHJlZml4KVxuICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb24ocHNldWRvU2VsZWN0b3IsIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFBzZXVkb1NlbGVjdG9yQ29tcGxldGlvbjogKHBzZXVkb1NlbGVjdG9yLCBwcmVmaXgsIHthcmd1bWVudCwgZGVzY3JpcHRpb259KSAtPlxuICAgIGNvbXBsZXRpb24gPVxuICAgICAgdHlwZTogJ3BzZXVkby1zZWxlY3RvcidcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vI3twc2V1ZG9TZWxlY3Rvcn1cIlxuXG4gICAgaWYgYXJndW1lbnQ/XG4gICAgICBjb21wbGV0aW9uLnNuaXBwZXQgPSBcIiN7cHNldWRvU2VsZWN0b3J9KCR7MToje2FyZ3VtZW50fX0pXCJcbiAgICBlbHNlXG4gICAgICBjb21wbGV0aW9uLnRleHQgPSBwc2V1ZG9TZWxlY3RvclxuICAgIGNvbXBsZXRpb25cblxuICBnZXRUYWdTZWxlY3RvclByZWZpeDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICB0YWdTZWxlY3RvclByZWZpeFBhdHRlcm4uZXhlYyhsaW5lKT9bMl1cblxuICBnZXRUYWdDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBwcmVmaXh9KSAtPlxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBpZiBwcmVmaXhcbiAgICAgIGZvciB0YWcgaW4gQHRhZ3Mgd2hlbiBmaXJzdENoYXJzRXF1YWwodGFnLCBwcmVmaXgpXG4gICAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkVGFnQ29tcGxldGlvbih0YWcpKVxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRUYWdDb21wbGV0aW9uOiAodGFnKSAtPlxuICAgIHR5cGU6ICd0YWcnXG4gICAgdGV4dDogdGFnXG4gICAgZGVzY3JpcHRpb246IFwiU2VsZWN0b3IgZm9yIDwje3RhZ30+IGVsZW1lbnRzXCJcblxubGluZUVuZHNXaXRoU2VtaWNvbG9uID0gKGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3IpIC0+XG4gIHtyb3d9ID0gYnVmZmVyUG9zaXRpb25cbiAgbGluZSA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gIC87XFxzKiQvLnRlc3QobGluZSlcblxuaGFzU2NvcGUgPSAoc2NvcGVzQXJyYXksIHNjb3BlKSAtPlxuICBzY29wZXNBcnJheS5pbmRleE9mKHNjb3BlKSBpc250IC0xXG5cbmZpcnN0Q2hhcnNFcXVhbCA9IChzdHIxLCBzdHIyKSAtPlxuICBzdHIxWzBdLnRvTG93ZXJDYXNlKCkgaXMgc3RyMlswXS50b0xvd2VyQ2FzZSgpXG5cbiMgbG9va3MgYXQgYSBzdHJpbmcgYW5kIHJlcGxhY2VzIGNvbnNlY3V0aXZlICgpIHdpdGggaW5jcmVtZW50aW5nIHNuaXBwZXQgcG9zaXRpb25zICgkbilcbiMgSXQgYWxzbyBhZGRzIGEgdHJhaWxpbmcgJG4gYXQgZW5kIG9mIHRleHRcbiMgZS5nIHRyYW5zbGF0ZSgpIGJlY29tZXMgdHJhbnNsYXRlKCQxKSQyXG5tYWtlU25pcHBldCA9ICh0ZXh0KSAgLT5cbiAgc25pcHBldE51bWJlciA9IDBcbiAgd2hpbGUgdGV4dC5pbmNsdWRlcygnKCknKVxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoJygpJywgXCIoJCN7KytzbmlwcGV0TnVtYmVyfSlcIilcbiAgdGV4dCA9IHRleHQgKyBcIiQjeysrc25pcHBldE51bWJlcn1cIlxuICByZXR1cm4gdGV4dFxuIl19
