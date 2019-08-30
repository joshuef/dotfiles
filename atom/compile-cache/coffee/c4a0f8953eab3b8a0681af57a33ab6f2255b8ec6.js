(function() {
  var AncestorsMethods, ColorResultsElement, CompositeDisposable, EventsDelegation, Range, SpacePenDSL, _, path, ref, ref1, removeLeadingWhitespace,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = [], Range = ref[0], CompositeDisposable = ref[1], _ = ref[2], path = ref[3];

  ref1 = require('atom-utils'), SpacePenDSL = ref1.SpacePenDSL, EventsDelegation = ref1.EventsDelegation, AncestorsMethods = ref1.AncestorsMethods;

  removeLeadingWhitespace = function(string) {
    return string.replace(/^\s+/, '');
  };

  ColorResultsElement = (function(superClass) {
    extend(ColorResultsElement, superClass);

    function ColorResultsElement() {
      return ColorResultsElement.__super__.constructor.apply(this, arguments);
    }

    SpacePenDSL.includeInto(ColorResultsElement);

    EventsDelegation.includeInto(ColorResultsElement);

    ColorResultsElement.content = function() {
      return this.tag('atom-panel', {
        outlet: 'pane',
        "class": 'preview-pane pane-item'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'panel-heading'
          }, function() {
            _this.span({
              outlet: 'previewCount',
              "class": 'preview-count inline-block'
            });
            return _this.div({
              outlet: 'loadingMessage',
              "class": 'inline-block'
            }, function() {
              _this.div({
                "class": 'loading loading-spinner-tiny inline-block'
              });
              return _this.div({
                outlet: 'searchedCountBlock',
                "class": 'inline-block'
              }, function() {
                _this.span({
                  outlet: 'searchedCount',
                  "class": 'searched-count'
                });
                return _this.span(' paths searched');
              });
            });
          });
          return _this.ol({
            outlet: 'resultsList',
            "class": 'search-colors-results results-view list-tree focusable-panel has-collapsable-children native-key-bindings',
            tabindex: -1
          });
        };
      })(this));
    };

    ColorResultsElement.prototype.createdCallback = function() {
      var ref2;
      if (CompositeDisposable == null) {
        ref2 = require('atom'), Range = ref2.Range, CompositeDisposable = ref2.CompositeDisposable;
      }
      this.subscriptions = new CompositeDisposable;
      this.pathMapping = {};
      this.files = 0;
      this.colors = 0;
      this.loadingMessage.style.display = 'none';
      this.subscriptions.add(this.subscribeTo(this, '.list-nested-item > .list-item', {
        click: function(e) {
          var fileItem;
          e.stopPropagation();
          fileItem = AncestorsMethods.parents(e.target, '.list-nested-item')[0];
          return fileItem.classList.toggle('collapsed');
        }
      }));
      return this.subscriptions.add(this.subscribeTo(this, '.search-result', {
        click: (function(_this) {
          return function(e) {
            var fileItem, matchItem, pathAttribute, range;
            e.stopPropagation();
            matchItem = e.target.matches('.search-result') ? e.target : AncestorsMethods.parents(e.target, '.search-result')[0];
            fileItem = AncestorsMethods.parents(matchItem, '.list-nested-item')[0];
            range = Range.fromObject([matchItem.dataset.start.split(',').map(Number), matchItem.dataset.end.split(',').map(Number)]);
            pathAttribute = fileItem.dataset.path;
            return atom.workspace.open(_this.pathMapping[pathAttribute]).then(function(editor) {
              return editor.setSelectedBufferRange(range, {
                autoscroll: true
              });
            });
          };
        })(this)
      }));
    };

    ColorResultsElement.prototype.setModel = function(colorSearch) {
      this.colorSearch = colorSearch;
      this.subscriptions.add(this.colorSearch.onDidFindMatches((function(_this) {
        return function(result) {
          return _this.addFileResult(result);
        };
      })(this)));
      this.subscriptions.add(this.colorSearch.onDidCompleteSearch((function(_this) {
        return function() {
          return _this.searchComplete();
        };
      })(this)));
      return this.colorSearch.search();
    };

    ColorResultsElement.prototype.addFileResult = function(result) {
      this.files += 1;
      this.colors += result.matches.length;
      this.resultsList.innerHTML += this.createFileResult(result);
      return this.updateMessage();
    };

    ColorResultsElement.prototype.searchComplete = function() {
      this.updateMessage();
      if (this.colors === 0) {
        this.pane.classList.add('no-results');
        return this.pane.appendChild("<ul class='centered background-message no-results-overlay'>\n  <li>No Results</li>\n</ul>");
      }
    };

    ColorResultsElement.prototype.updateMessage = function() {
      var filesString;
      filesString = this.files === 1 ? 'file' : 'files';
      return this.previewCount.innerHTML = this.colors > 0 ? "<span class='text-info'>\n  " + this.colors + " colors\n</span>\nfound in\n<span class='text-info'>\n  " + this.files + " " + filesString + "\n</span>" : "No colors found in " + this.files + " " + filesString;
    };

    ColorResultsElement.prototype.createFileResult = function(fileResult) {
      var fileBasename, filePath, matches, pathAttribute, pathName;
      if (_ == null) {
        _ = require('underscore-plus');
      }
      if (path == null) {
        path = require('path');
      }
      filePath = fileResult.filePath, matches = fileResult.matches;
      fileBasename = path.basename(filePath);
      pathAttribute = _.escapeAttribute(filePath);
      this.pathMapping[pathAttribute] = filePath;
      pathName = atom.project.relativize(filePath);
      return "<li class=\"path list-nested-item\" data-path=\"" + pathAttribute + "\">\n  <div class=\"path-details list-item\">\n    <span class=\"disclosure-arrow\"></span>\n    <span class=\"icon icon-file-text\" data-name=\"" + fileBasename + "\"></span>\n    <span class=\"path-name bright\">" + pathName + "</span>\n    <span class=\"path-match-number\">(" + matches.length + ")</span></div>\n  </div>\n  <ul class=\"matches list-tree\">\n    " + (matches.map((function(_this) {
        return function(match) {
          return _this.createMatchResult(match);
        };
      })(this)).join('')) + "\n  </ul>\n</li>";
    };

    ColorResultsElement.prototype.createMatchResult = function(match) {
      var filePath, lineNumber, matchEnd, matchStart, prefix, range, ref2, style, suffix, textColor;
      if (CompositeDisposable == null) {
        ref2 = require('atom'), Range = ref2.Range, CompositeDisposable = ref2.CompositeDisposable;
      }
      textColor = match.color.luma > 0.43 ? 'black' : 'white';
      filePath = match.filePath, range = match.range;
      range = Range.fromObject(range);
      matchStart = range.start.column - match.lineTextOffset;
      matchEnd = range.end.column - match.lineTextOffset;
      prefix = removeLeadingWhitespace(match.lineText.slice(0, matchStart));
      suffix = match.lineText.slice(matchEnd);
      lineNumber = range.start.row + 1;
      style = '';
      style += "background: " + (match.color.toCSS()) + ";";
      style += "color: " + textColor + ";";
      return "<li class=\"search-result list-item\" data-start=\"" + range.start.row + "," + range.start.column + "\" data-end=\"" + range.end.row + "," + range.end.column + "\">\n  <span class=\"line-number text-subtle\">" + lineNumber + "</span>\n  <span class=\"preview\">\n    " + prefix + "\n    <span class='match color-match' style='" + style + "'>" + match.matchText + "</span>\n    " + suffix + "\n  </span>\n</li>";
    };

    return ColorResultsElement;

  })(HTMLElement);

  module.exports = ColorResultsElement = document.registerElement('pigments-color-results', {
    prototype: ColorResultsElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvbGliL2NvbG9yLXJlc3VsdHMtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZJQUFBO0lBQUE7OztFQUFBLE1BR0ksRUFISixFQUNFLGNBREYsRUFDUyw0QkFEVCxFQUVFLFVBRkYsRUFFSzs7RUFHTCxPQUFvRCxPQUFBLENBQVEsWUFBUixDQUFwRCxFQUFDLDhCQUFELEVBQWMsd0NBQWQsRUFBZ0M7O0VBRWhDLHVCQUFBLEdBQTBCLFNBQUMsTUFBRDtXQUFZLE1BQU0sQ0FBQyxPQUFQLENBQWUsTUFBZixFQUF1QixFQUF2QjtFQUFaOztFQUVwQjs7Ozs7OztJQUNKLFdBQVcsQ0FBQyxXQUFaLENBQXdCLG1CQUF4Qjs7SUFDQSxnQkFBZ0IsQ0FBQyxXQUFqQixDQUE2QixtQkFBN0I7O0lBRUEsbUJBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUssWUFBTCxFQUFtQjtRQUFBLE1BQUEsRUFBUSxNQUFSO1FBQWdCLENBQUEsS0FBQSxDQUFBLEVBQU8sd0JBQXZCO09BQW5CLEVBQW9FLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNsRSxLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1dBQUwsRUFBNkIsU0FBQTtZQUMzQixLQUFDLENBQUEsSUFBRCxDQUFNO2NBQUEsTUFBQSxFQUFRLGNBQVI7Y0FBd0IsQ0FBQSxLQUFBLENBQUEsRUFBTyw0QkFBL0I7YUFBTjttQkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsTUFBQSxFQUFRLGdCQUFSO2NBQTBCLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBakM7YUFBTCxFQUFzRCxTQUFBO2NBQ3BELEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEs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QyxNQUFNLENBQUMsT0FBUCxHQUFpQixtQkFBQSxHQUNqQixRQUFRLENBQUMsZUFBVCxDQUF5Qix3QkFBekIsRUFBbUQ7SUFDakQsU0FBQSxFQUFXLG1CQUFtQixDQUFDLFNBRGtCO0dBQW5EO0FBL0pBIiwic291cmNlc0NvbnRlbnQiOlsiW1xuICBSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSxcbiAgXywgcGF0aFxuXSA9IFtdXG5cbntTcGFjZVBlbkRTTCwgRXZlbnRzRGVsZWdhdGlvbiwgQW5jZXN0b3JzTWV0aG9kc30gPSByZXF1aXJlICdhdG9tLXV0aWxzJ1xuXG5yZW1vdmVMZWFkaW5nV2hpdGVzcGFjZSA9IChzdHJpbmcpIC0+IHN0cmluZy5yZXBsYWNlKC9eXFxzKy8sICcnKVxuXG5jbGFzcyBDb2xvclJlc3VsdHNFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgU3BhY2VQZW5EU0wuaW5jbHVkZUludG8odGhpcylcbiAgRXZlbnRzRGVsZWdhdGlvbi5pbmNsdWRlSW50byh0aGlzKVxuXG4gIEBjb250ZW50OiAtPlxuICAgIEB0YWcgJ2F0b20tcGFuZWwnLCBvdXRsZXQ6ICdwYW5lJywgY2xhc3M6ICdwcmV2aWV3LXBhbmUgcGFuZS1pdGVtJywgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbC1oZWFkaW5nJywgPT5cbiAgICAgICAgQHNwYW4gb3V0bGV0OiAncHJldmlld0NvdW50JywgY2xhc3M6ICdwcmV2aWV3LWNvdW50IGlubGluZS1ibG9jaydcbiAgICAgICAgQGRpdiBvdXRsZXQ6ICdsb2FkaW5nTWVzc2FnZScsIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnbG9hZGluZyBsb2FkaW5nLXNwaW5uZXItdGlueSBpbmxpbmUtYmxvY2snXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdzZWFyY2hlZENvdW50QmxvY2snLCBjbGFzczogJ2lubGluZS1ibG9jaycsID0+XG4gICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdzZWFyY2hlZENvdW50JywgY2xhc3M6ICdzZWFyY2hlZC1jb3VudCdcbiAgICAgICAgICAgIEBzcGFuICcgcGF0aHMgc2VhcmNoZWQnXG5cbiAgICAgIEBvbCBvdXRsZXQ6ICdyZXN1bHRzTGlzdCcsIGNsYXNzOiAnc2VhcmNoLWNvbG9ycy1yZXN1bHRzIHJlc3VsdHMtdmlldyBsaXN0LXRyZWUgZm9jdXNhYmxlLXBhbmVsIGhhcy1jb2xsYXBzYWJsZS1jaGlsZHJlbiBuYXRpdmUta2V5LWJpbmRpbmdzJywgdGFiaW5kZXg6IC0xXG5cbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIHtSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJyB1bmxlc3MgQ29tcG9zaXRlRGlzcG9zYWJsZT9cblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAcGF0aE1hcHBpbmcgPSB7fVxuXG4gICAgQGZpbGVzID0gMFxuICAgIEBjb2xvcnMgPSAwXG5cbiAgICBAbG9hZGluZ01lc3NhZ2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBzdWJzY3JpYmVUbyB0aGlzLCAnLmxpc3QtbmVzdGVkLWl0ZW0gPiAubGlzdC1pdGVtJyxcbiAgICAgIGNsaWNrOiAoZSkgLT5cbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBmaWxlSXRlbSA9IEFuY2VzdG9yc01ldGhvZHMucGFyZW50cyhlLnRhcmdldCwnLmxpc3QtbmVzdGVkLWl0ZW0nKVswXVxuICAgICAgICBmaWxlSXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdjb2xsYXBzZWQnKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBzdWJzY3JpYmVUbyB0aGlzLCAnLnNlYXJjaC1yZXN1bHQnLFxuICAgICAgY2xpY2s6IChlKSA9PlxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIG1hdGNoSXRlbSA9IGlmIGUudGFyZ2V0Lm1hdGNoZXMoJy5zZWFyY2gtcmVzdWx0JylcbiAgICAgICAgICBlLnRhcmdldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgQW5jZXN0b3JzTWV0aG9kcy5wYXJlbnRzKGUudGFyZ2V0LCcuc2VhcmNoLXJlc3VsdCcpWzBdXG5cbiAgICAgICAgZmlsZUl0ZW0gPSBBbmNlc3RvcnNNZXRob2RzLnBhcmVudHMobWF0Y2hJdGVtLCcubGlzdC1uZXN0ZWQtaXRlbScpWzBdXG4gICAgICAgIHJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChbXG4gICAgICAgICAgbWF0Y2hJdGVtLmRhdGFzZXQuc3RhcnQuc3BsaXQoJywnKS5tYXAoTnVtYmVyKVxuICAgICAgICAgIG1hdGNoSXRlbS5kYXRhc2V0LmVuZC5zcGxpdCgnLCcpLm1hcChOdW1iZXIpXG4gICAgICAgIF0pXG4gICAgICAgIHBhdGhBdHRyaWJ1dGUgPSBmaWxlSXRlbS5kYXRhc2V0LnBhdGhcbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihAcGF0aE1hcHBpbmdbcGF0aEF0dHJpYnV0ZV0pLnRoZW4gKGVkaXRvcikgLT5cbiAgICAgICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShyYW5nZSwgYXV0b3Njcm9sbDogdHJ1ZSlcblxuICBzZXRNb2RlbDogKEBjb2xvclNlYXJjaCkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGNvbG9yU2VhcmNoLm9uRGlkRmluZE1hdGNoZXMgKHJlc3VsdCkgPT5cbiAgICAgIEBhZGRGaWxlUmVzdWx0KHJlc3VsdClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY29sb3JTZWFyY2gub25EaWRDb21wbGV0ZVNlYXJjaCA9PlxuICAgICAgQHNlYXJjaENvbXBsZXRlKClcblxuICAgIEBjb2xvclNlYXJjaC5zZWFyY2goKVxuXG4gIGFkZEZpbGVSZXN1bHQ6IChyZXN1bHQpIC0+XG4gICAgQGZpbGVzICs9IDFcbiAgICBAY29sb3JzICs9IHJlc3VsdC5tYXRjaGVzLmxlbmd0aFxuXG4gICAgQHJlc3VsdHNMaXN0LmlubmVySFRNTCArPSBAY3JlYXRlRmlsZVJlc3VsdChyZXN1bHQpXG4gICAgQHVwZGF0ZU1lc3NhZ2UoKVxuXG4gIHNlYXJjaENvbXBsZXRlOiAtPlxuICAgIEB1cGRhdGVNZXNzYWdlKClcblxuICAgIGlmIEBjb2xvcnMgaXMgMFxuICAgICAgQHBhbmUuY2xhc3NMaXN0LmFkZCAnbm8tcmVzdWx0cydcbiAgICAgIEBwYW5lLmFwcGVuZENoaWxkIFwiXCJcIlxuICAgICAgPHVsIGNsYXNzPSdjZW50ZXJlZCBiYWNrZ3JvdW5kLW1lc3NhZ2Ugbm8tcmVzdWx0cy1vdmVybGF5Jz5cbiAgICAgICAgPGxpPk5vIFJlc3VsdHM8L2xpPlxuICAgICAgPC91bD5cbiAgICAgIFwiXCJcIlxuXG4gIHVwZGF0ZU1lc3NhZ2U6IC0+XG4gICAgZmlsZXNTdHJpbmcgPSBpZiBAZmlsZXMgaXMgMSB0aGVuICdmaWxlJyBlbHNlICdmaWxlcydcblxuICAgIEBwcmV2aWV3Q291bnQuaW5uZXJIVE1MID0gaWYgQGNvbG9ycyA+IDBcbiAgICAgIFwiXCJcIlxuICAgICAgPHNwYW4gY2xhc3M9J3RleHQtaW5mbyc+XG4gICAgICAgICN7QGNvbG9yc30gY29sb3JzXG4gICAgICA8L3NwYW4+XG4gICAgICBmb3VuZCBpblxuICAgICAgPHNwYW4gY2xhc3M9J3RleHQtaW5mbyc+XG4gICAgICAgICN7QGZpbGVzfSAje2ZpbGVzU3RyaW5nfVxuICAgICAgPC9zcGFuPlxuICAgICAgXCJcIlwiXG4gICAgZWxzZVxuICAgICAgXCJObyBjb2xvcnMgZm91bmQgaW4gI3tAZmlsZXN9ICN7ZmlsZXNTdHJpbmd9XCJcblxuICBjcmVhdGVGaWxlUmVzdWx0OiAoZmlsZVJlc3VsdCkgLT5cbiAgICBfID89IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbiAgICBwYXRoID89IHJlcXVpcmUgJ3BhdGgnXG5cbiAgICB7ZmlsZVBhdGgsbWF0Y2hlc30gPSBmaWxlUmVzdWx0XG4gICAgZmlsZUJhc2VuYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aClcblxuICAgIHBhdGhBdHRyaWJ1dGUgPSBfLmVzY2FwZUF0dHJpYnV0ZShmaWxlUGF0aClcbiAgICBAcGF0aE1hcHBpbmdbcGF0aEF0dHJpYnV0ZV0gPSBmaWxlUGF0aFxuICAgIHBhdGhOYW1lID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemUoZmlsZVBhdGgpXG5cbiAgICBcIlwiXCJcbiAgICA8bGkgY2xhc3M9XCJwYXRoIGxpc3QtbmVzdGVkLWl0ZW1cIiBkYXRhLXBhdGg9XCIje3BhdGhBdHRyaWJ1dGV9XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicGF0aC1kZXRhaWxzIGxpc3QtaXRlbVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImRpc2Nsb3N1cmUtYXJyb3dcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLWZpbGUtdGV4dFwiIGRhdGEtbmFtZT1cIiN7ZmlsZUJhc2VuYW1lfVwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJwYXRoLW5hbWUgYnJpZ2h0XCI+I3twYXRoTmFtZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicGF0aC1tYXRjaC1udW1iZXJcIj4oI3ttYXRjaGVzLmxlbmd0aH0pPC9zcGFuPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8dWwgY2xhc3M9XCJtYXRjaGVzIGxpc3QtdHJlZVwiPlxuICAgICAgICAje21hdGNoZXMubWFwKChtYXRjaCkgPT4gQGNyZWF0ZU1hdGNoUmVzdWx0IG1hdGNoKS5qb2luKCcnKX1cbiAgICAgIDwvdWw+XG4gICAgPC9saT5cIlwiXCJcblxuICBjcmVhdGVNYXRjaFJlc3VsdDogKG1hdGNoKSAtPlxuICAgIHtSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJyB1bmxlc3MgQ29tcG9zaXRlRGlzcG9zYWJsZT9cblxuICAgIHRleHRDb2xvciA9IGlmIG1hdGNoLmNvbG9yLmx1bWEgPiAwLjQzXG4gICAgICAnYmxhY2snXG4gICAgZWxzZVxuICAgICAgJ3doaXRlJ1xuXG4gICAge2ZpbGVQYXRoLCByYW5nZX0gPSBtYXRjaFxuXG4gICAgcmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KHJhbmdlKVxuICAgIG1hdGNoU3RhcnQgPSByYW5nZS5zdGFydC5jb2x1bW4gLSBtYXRjaC5saW5lVGV4dE9mZnNldFxuICAgIG1hdGNoRW5kID0gcmFuZ2UuZW5kLmNvbHVtbiAtIG1hdGNoLmxpbmVUZXh0T2Zmc2V0XG4gICAgcHJlZml4ID0gcmVtb3ZlTGVhZGluZ1doaXRlc3BhY2UobWF0Y2gubGluZVRleHRbMC4uLm1hdGNoU3RhcnRdKVxuICAgIHN1ZmZpeCA9IG1hdGNoLmxpbmVUZXh0W21hdGNoRW5kLi5dXG4gICAgbGluZU51bWJlciA9IHJhbmdlLnN0YXJ0LnJvdyArIDFcbiAgICBzdHlsZSA9ICcnXG4gICAgc3R5bGUgKz0gXCJiYWNrZ3JvdW5kOiAje21hdGNoLmNvbG9yLnRvQ1NTKCl9O1wiXG4gICAgc3R5bGUgKz0gXCJjb2xvcjogI3t0ZXh0Q29sb3J9O1wiXG5cbiAgICBcIlwiXCJcbiAgICA8bGkgY2xhc3M9XCJzZWFyY2gtcmVzdWx0IGxpc3QtaXRlbVwiIGRhdGEtc3RhcnQ9XCIje3JhbmdlLnN0YXJ0LnJvd30sI3tyYW5nZS5zdGFydC5jb2x1bW59XCIgZGF0YS1lbmQ9XCIje3JhbmdlLmVuZC5yb3d9LCN7cmFuZ2UuZW5kLmNvbHVtbn1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwibGluZS1udW1iZXIgdGV4dC1zdWJ0bGVcIj4je2xpbmVOdW1iZXJ9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2aWV3XCI+XG4gICAgICAgICN7cHJlZml4fVxuICAgICAgICA8c3BhbiBjbGFzcz0nbWF0Y2ggY29sb3ItbWF0Y2gnIHN0eWxlPScje3N0eWxlfSc+I3ttYXRjaC5tYXRjaFRleHR9PC9zcGFuPlxuICAgICAgICAje3N1ZmZpeH1cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2xpPlxuICAgIFwiXCJcIlxuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JSZXN1bHRzRWxlbWVudCA9XG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ3BpZ21lbnRzLWNvbG9yLXJlc3VsdHMnLCB7XG4gIHByb3RvdHlwZTogQ29sb3JSZXN1bHRzRWxlbWVudC5wcm90b3R5cGVcbn1cbiJdfQ==
