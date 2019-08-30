Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('./helpers');

var Helpers = _interopRequireWildcard(_helpers);

var manifest = undefined;

function formatItem(item) {
  var itemName = undefined;
  if (item && typeof item === 'object' && typeof item.name === 'string') {
    itemName = item.name;
  } else if (typeof item === 'string') {
    itemName = item;
  } else {
    throw new Error('Unknown object passed to formatItem()');
  }
  return '  - ' + itemName;
}
function sortByName(item1, item2) {
  return item1.name.localeCompare(item2.name);
}

var Commands = (function () {
  function Commands() {
    var _this = this;

    _classCallCheck(this, Commands);

    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linter:enable-linter': function linterEnableLinter() {
        return _this.enableLinter();
      },
      'linter:disable-linter': function linterDisableLinter() {
        return _this.disableLinter();
      }
    }));
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter:lint': function linterLint() {
        return _this.lint();
      },
      'linter:debug': function linterDebug() {
        return _this.debug();
      },
      'linter:toggle-active-editor': function linterToggleActiveEditor() {
        return _this.toggleActiveEditor();
      }
    }));
  }

  _createClass(Commands, [{
    key: 'lint',
    value: function lint() {
      this.emitter.emit('should-lint');
    }
  }, {
    key: 'debug',
    value: function debug() {
      this.emitter.emit('should-debug');
    }
  }, {
    key: 'enableLinter',
    value: function enableLinter() {
      this.emitter.emit('should-toggle-linter', 'enable');
    }
  }, {
    key: 'disableLinter',
    value: function disableLinter() {
      this.emitter.emit('should-toggle-linter', 'disable');
    }
  }, {
    key: 'toggleActiveEditor',
    value: function toggleActiveEditor() {
      this.emitter.emit('should-toggle-active-editor');
    }
  }, {
    key: 'showDebug',
    value: function showDebug(standardLinters, indieLinters, uiProviders) {
      if (!manifest) {
        manifest = require('../package.json');
      }

      var textEditor = atom.workspace.getActiveTextEditor();
      var textEditorScopes = Helpers.getEditorCursorScopes(textEditor);
      var sortedLinters = standardLinters.slice().sort(sortByName);
      var sortedIndieLinters = indieLinters.slice().sort(sortByName);
      var sortedUIProviders = uiProviders.slice().sort(sortByName);

      var indieLinterNames = sortedIndieLinters.map(formatItem).join('\n');
      var standardLinterNames = sortedLinters.map(formatItem).join('\n');
      var matchingStandardLinters = sortedLinters.filter(function (linter) {
        return Helpers.shouldTriggerLinter(linter, false, textEditorScopes);
      }).map(formatItem).join('\n');
      var humanizedScopes = textEditorScopes.map(formatItem).join('\n');
      var uiProviderNames = sortedUIProviders.map(formatItem).join('\n');

      var ignoreGlob = atom.config.get('linter.ignoreGlob');
      var ignoreVCSIgnoredPaths = atom.config.get('core.excludeVcsIgnoredPaths');
      var disabledLinters = atom.config.get('linter.disabledProviders').map(formatItem).join('\n');
      var filePathIgnored = Helpers.isPathIgnored(textEditor.getPath(), ignoreGlob, ignoreVCSIgnoredPaths);

      atom.notifications.addInfo('Linter Debug Info', {
        detail: ['Platform: ' + process.platform, 'Atom Version: ' + atom.getVersion(), 'Linter Version: ' + manifest.version, 'Opened file is ignored: ' + (filePathIgnored ? 'Yes' : 'No'), 'Matching Linter Providers: \n' + matchingStandardLinters, 'Disabled Linter Providers: \n' + disabledLinters, 'Standard Linter Providers: \n' + standardLinterNames, 'Indie Linter Providers: \n' + indieLinterNames, 'UI Providers: \n' + uiProviderNames, 'Ignore Glob: ' + ignoreGlob, 'VCS Ignored Paths are excluded: ' + ignoreVCSIgnoredPaths, 'Current File Scopes: \n' + humanizedScopes].join('\n'),
        dismissable: true
      });
    }
  }, {
    key: 'onShouldLint',
    value: function onShouldLint(callback) {
      return this.emitter.on('should-lint', callback);
    }
  }, {
    key: 'onShouldDebug',
    value: function onShouldDebug(callback) {
      return this.emitter.on('should-debug', callback);
    }
  }, {
    key: 'onShouldToggleActiveEditor',
    value: function onShouldToggleActiveEditor(callback) {
      return this.emitter.on('should-toggle-active-editor', callback);
    }
  }, {
    key: 'onShouldToggleLinter',
    value: function onShouldToggleLinter(callback) {
      return this.emitter.on('should-toggle-linter', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return Commands;
})();

exports['default'] = Commands;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9jb21tYW5kcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUU2QyxNQUFNOzt1QkFHMUIsV0FBVzs7SUFBeEIsT0FBTzs7QUFJbkIsSUFBSSxRQUFRLFlBQUEsQ0FBQTs7QUFFWixTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFDeEIsTUFBSSxRQUFRLFlBQUEsQ0FBQTtBQUNaLE1BQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ3JFLFlBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO0dBQ3JCLE1BQU0sSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDbkMsWUFBUSxHQUFHLElBQUksQ0FBQTtHQUNoQixNQUFNO0FBQ0wsVUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO0dBQ3pEO0FBQ0Qsa0JBQWMsUUFBUSxDQUFFO0NBQ3pCO0FBQ0QsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUNoQyxTQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUM1Qzs7SUFFb0IsUUFBUTtBQUloQixXQUpRLFFBQVEsR0FJYjs7OzBCQUpLLFFBQVE7O0FBS3pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFO0FBQ2xDLDRCQUFzQixFQUFF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LElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHNCQUFzQixFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ3pEOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDN0I7OztTQWxHa0IsUUFBUTs7O3FCQUFSLFFBQVEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2NvbW1hbmRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSB7IERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuXG5pbXBvcnQgKiBhcyBIZWxwZXJzIGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyLCBVSSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSBJbmRpZURlbGVnYXRlIGZyb20gJy4vaW5kaWUtZGVsZWdhdGUnXG5cbmxldCBtYW5pZmVzdFxuXG5mdW5jdGlvbiBmb3JtYXRJdGVtKGl0ZW0pIHtcbiAgbGV0IGl0ZW1OYW1lXG4gIGlmIChpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgaXRlbS5uYW1lID09PSAnc3RyaW5nJykge1xuICAgIGl0ZW1OYW1lID0gaXRlbS5uYW1lXG4gIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgaXRlbU5hbWUgPSBpdGVtXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG9iamVjdCBwYXNzZWQgdG8gZm9ybWF0SXRlbSgpJylcbiAgfVxuICByZXR1cm4gYCAgLSAke2l0ZW1OYW1lfWBcbn1cbmZ1bmN0aW9uIHNvcnRCeU5hbWUoaXRlbTEsIGl0ZW0yKSB7XG4gIHJldHVybiBpdGVtMS5uYW1lLmxvY2FsZUNvbXBhcmUoaXRlbTIubmFtZSlcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tbWFuZHMge1xuICBlbWl0dGVyOiBFbWl0dGVyXG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHtcbiAgICAgICAgJ2xpbnRlcjplbmFibGUtbGludGVyJzogKCkgPT4gdGhpcy5lbmFibGVMaW50ZXIoKSxcbiAgICAgICAgJ2xpbnRlcjpkaXNhYmxlLWxpbnRlcic6ICgpID0+IHRoaXMuZGlzYWJsZUxpbnRlcigpLFxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcjpub3QoW21pbmldKScsIHtcbiAgICAgICAgJ2xpbnRlcjpsaW50JzogKCkgPT4gdGhpcy5saW50KCksXG4gICAgICAgICdsaW50ZXI6ZGVidWcnOiAoKSA9PiB0aGlzLmRlYnVnKCksXG4gICAgICAgICdsaW50ZXI6dG9nZ2xlLWFjdGl2ZS1lZGl0b3InOiAoKSA9PiB0aGlzLnRvZ2dsZUFjdGl2ZUVkaXRvcigpLFxuICAgICAgfSksXG4gICAgKVxuICB9XG4gIGxpbnQoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC1saW50JylcbiAgfVxuICBkZWJ1ZygpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLWRlYnVnJylcbiAgfVxuICBlbmFibGVMaW50ZXIoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC10b2dnbGUtbGludGVyJywgJ2VuYWJsZScpXG4gIH1cbiAgZGlzYWJsZUxpbnRlcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLXRvZ2dsZS1saW50ZXInLCAnZGlzYWJsZScpXG4gIH1cbiAgdG9nZ2xlQWN0aXZlRWRpdG9yKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdzaG91bGQtdG9nZ2xlLWFjdGl2ZS1lZGl0b3InKVxuICB9XG4gIHNob3dEZWJ1ZyhzdGFuZGFyZExpbnRlcnM6IEFycmF5PExpbnRlcj4sIGluZGllTGludGVyczogQXJyYXk8SW5kaWVEZWxlZ2F0ZT4sIHVpUHJvdmlkZXJzOiBBcnJheTxVST4pIHtcbiAgICBpZiAoIW1hbmlmZXN0KSB7XG4gICAgICBtYW5pZmVzdCA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpXG4gICAgfVxuXG4gICAgY29uc3QgdGV4dEVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGNvbnN0IHRleHRFZGl0b3JTY29wZXMgPSBIZWxwZXJzLmdldEVkaXRvckN1cnNvclNjb3Blcyh0ZXh0RWRpdG9yKVxuICAgIGNvbnN0IHNvcnRlZExpbnRlcnMgPSBzdGFuZGFyZExpbnRlcnMuc2xpY2UoKS5zb3J0KHNvcnRCeU5hbWUpXG4gICAgY29uc3Qgc29ydGVkSW5kaWVMaW50ZXJzID0gaW5kaWVMaW50ZXJzLnNsaWNlKCkuc29ydChzb3J0QnlOYW1lKVxuICAgIGNvbnN0IHNvcnRlZFVJUHJvdmlkZXJzID0gdWlQcm92aWRlcnMuc2xpY2UoKS5zb3J0KHNvcnRCeU5hbWUpXG5cbiAgICBjb25zdCBpbmRpZUxpbnRlck5hbWVzID0gc29ydGVkSW5kaWVMaW50ZXJzLm1hcChmb3JtYXRJdGVtKS5qb2luKCdcXG4nKVxuICAgIGNvbnN0IHN0YW5kYXJkTGludGVyTmFtZXMgPSBzb3J0ZWRMaW50ZXJzLm1hcChmb3JtYXRJdGVtKS5qb2luKCdcXG4nKVxuICAgIGNvbnN0IG1hdGNoaW5nU3RhbmRhcmRMaW50ZXJzID0gc29ydGVkTGludGVyc1xuICAgICAgLmZpbHRlcihsaW50ZXIgPT4gSGVscGVycy5zaG91bGRUcmlnZ2VyTGludGVyKGxpbnRlciwgZmFsc2UsIHRleHRFZGl0b3JTY29wZXMpKVxuICAgICAgLm1hcChmb3JtYXRJdGVtKVxuICAgICAgLmpvaW4oJ1xcbicpXG4gICAgY29uc3QgaHVtYW5pemVkU2NvcGVzID0gdGV4dEVkaXRvclNjb3Blcy5tYXAoZm9ybWF0SXRlbSkuam9pbignXFxuJylcbiAgICBjb25zdCB1aVByb3ZpZGVyTmFtZXMgPSBzb3J0ZWRVSVByb3ZpZGVycy5tYXAoZm9ybWF0SXRlbSkuam9pbignXFxuJylcblxuICAgIGNvbnN0IGlnbm9yZUdsb2IgPSBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci5pZ25vcmVHbG9iJylcbiAgICBjb25zdCBpZ25vcmVWQ1NJZ25vcmVkUGF0aHMgPSBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuZXhjbHVkZVZjc0lnbm9yZWRQYXRocycpXG4gICAgY29uc3QgZGlzYWJsZWRMaW50ZXJzID0gYXRvbS5jb25maWdcbiAgICAgIC5nZXQoJ2xpbnRlci5kaXNhYmxlZFByb3ZpZGVycycpXG4gICAgICAubWFwKGZvcm1hdEl0ZW0pXG4gICAgICAuam9pbignXFxuJylcbiAgICBjb25zdCBmaWxlUGF0aElnbm9yZWQgPSBIZWxwZXJzLmlzUGF0aElnbm9yZWQodGV4dEVkaXRvci5nZXRQYXRoKCksIGlnbm9yZUdsb2IsIGlnbm9yZVZDU0lnbm9yZWRQYXRocylcblxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdMaW50ZXIgRGVidWcgSW5mbycsIHtcbiAgICAgIGRldGFpbDogW1xuICAgICAgICBgUGxhdGZvcm06ICR7cHJvY2Vzcy5wbGF0Zm9ybX1gLFxuICAgICAgICBgQXRvbSBWZXJzaW9uOiAke2F0b20uZ2V0VmVyc2lvbigpfWAsXG4gICAgICAgIGBMaW50ZXIgVmVyc2lvbjogJHttYW5pZmVzdC52ZXJzaW9ufWAsXG4gICAgICAgIGBPcGVuZWQgZmlsZSBpcyBpZ25vcmVkOiAke2ZpbGVQYXRoSWdub3JlZCA/ICdZZXMnIDogJ05vJ31gLFxuICAgICAgICBgTWF0Y2hpbmcgTGludGVyIFByb3ZpZGVyczogXFxuJHttYXRjaGluZ1N0YW5kYXJkTGludGVyc31gLFxuICAgICAgICBgRGlzYWJsZWQgTGludGVyIFByb3ZpZGVyczogXFxuJHtkaXNhYmxlZExpbnRlcnN9YCxcbiAgICAgICAgYFN0YW5kYXJkIExpbnRlciBQcm92aWRlcnM6IFxcbiR7c3RhbmRhcmRMaW50ZXJOYW1lc31gLFxuICAgICAgICBgSW5kaWUgTGludGVyIFByb3ZpZGVyczogXFxuJHtpbmRpZUxpbnRlck5hbWVzfWAsXG4gICAgICAgIGBVSSBQcm92aWRlcnM6IFxcbiR7dWlQcm92aWRlck5hbWVzfWAsXG4gICAgICAgIGBJZ25vcmUgR2xvYjogJHtpZ25vcmVHbG9ifWAsXG4gICAgICAgIGBWQ1MgSWdub3JlZCBQYXRocyBhcmUgZXhjbHVkZWQ6ICR7aWdub3JlVkNTSWdub3JlZFBhdGhzfWAsXG4gICAgICAgIGBDdXJyZW50IEZpbGUgU2NvcGVzOiBcXG4ke2h1bWFuaXplZFNjb3Blc31gLFxuICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgIH0pXG4gIH1cbiAgb25TaG91bGRMaW50KGNhbGxiYWNrOiBGdW5jdGlvbik6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ3Nob3VsZC1saW50JywgY2FsbGJhY2spXG4gIH1cbiAgb25TaG91bGREZWJ1ZyhjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtZGVidWcnLCBjYWxsYmFjaylcbiAgfVxuICBvblNob3VsZFRvZ2dsZUFjdGl2ZUVkaXRvcihjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtdG9nZ2xlLWFjdGl2ZS1lZGl0b3InLCBjYWxsYmFjaylcbiAgfVxuICBvblNob3VsZFRvZ2dsZUxpbnRlcihjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtdG9nZ2xlLWxpbnRlcicsIGNhbGxiYWNrKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=