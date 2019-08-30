Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var Helpers = undefined;
var manifest = undefined;

function formatItem(item) {
  var name = undefined;
  if (item && typeof item === 'object' && typeof item.name === 'string') {
    name = item.name;
  } else if (typeof item === 'string') {
    name = item;
  } else {
    throw new Error('Unknown object passed to formatItem()');
  }
  return '  - ' + name;
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
      if (!Helpers) {
        Helpers = require('./helpers');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9jb21tYW5kcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztvQkFFNkMsTUFBTTs7QUFLbkQsSUFBSSxPQUFPLFlBQUEsQ0FBQTtBQUNYLElBQUksUUFBUSxZQUFBLENBQUE7O0FBRVosU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFO0FBQ3hCLE1BQUksSUFBSSxZQUFBLENBQUE7QUFDUixNQUFJLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUNyRSxRQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtHQUNqQixNQUFNLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ25DLFFBQUksR0FBRyxJQUFJLENBQUE7R0FDWixNQUFNO0FBQ0wsVUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO0dBQ3pEO0FBQ0Qsa0JBQWMsSUFBSSxDQUFFO0NBQ3JCO0FBQ0QsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUNoQyxTQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUM1Qzs7SUFFb0IsUUFBUTtBQUloQixXQUpRLFFBQVEsR0FJYjs7OzBCQUpLLFFBQVE7O0FBS3pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7QUFDekQsNEJBQXNCLEVBQUU7ZUFB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QUMsNkJBQTZCLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDaEU7OztXQUNtQiw4QkFBQyxRQUFrQixFQUFjO0FBQ25ELGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDekQ7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM3Qjs7O1NBbEdrQixRQUFROzs7cUJBQVIsUUFBUSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci9saWIvY29tbWFuZHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIHsgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSB7IExpbnRlciwgVUkgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHR5cGUgSW5kaWVEZWxlZ2F0ZSBmcm9tICcuL2luZGllLWRlbGVnYXRlJ1xuXG5sZXQgSGVscGVyc1xubGV0IG1hbmlmZXN0XG5cbmZ1bmN0aW9uIGZvcm1hdEl0ZW0oaXRlbSkge1xuICBsZXQgbmFtZVxuICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGl0ZW0ubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICBuYW1lID0gaXRlbS5uYW1lXG4gIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgbmFtZSA9IGl0ZW1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gb2JqZWN0IHBhc3NlZCB0byBmb3JtYXRJdGVtKCknKVxuICB9XG4gIHJldHVybiBgICAtICR7bmFtZX1gXG59XG5mdW5jdGlvbiBzb3J0QnlOYW1lKGl0ZW0xLCBpdGVtMikge1xuICByZXR1cm4gaXRlbTEubmFtZS5sb2NhbGVDb21wYXJlKGl0ZW0yLm5hbWUpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbW1hbmRzIHtcbiAgZW1pdHRlcjogRW1pdHRlcjtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAnbGludGVyOmVuYWJsZS1saW50ZXInOiAoKSA9PiB0aGlzLmVuYWJsZUxpbnRlcigpLFxuICAgICAgJ2xpbnRlcjpkaXNhYmxlLWxpbnRlcic6ICgpID0+IHRoaXMuZGlzYWJsZUxpbnRlcigpLFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSknLCB7XG4gICAgICAnbGludGVyOmxpbnQnOiAoKSA9PiB0aGlzLmxpbnQoKSxcbiAgICAgICdsaW50ZXI6ZGVidWcnOiAoKSA9PiB0aGlzLmRlYnVnKCksXG4gICAgICAnbGludGVyOnRvZ2dsZS1hY3RpdmUtZWRpdG9yJzogKCkgPT4gdGhpcy50b2dnbGVBY3RpdmVFZGl0b3IoKSxcbiAgICB9KSlcbiAgfVxuICBsaW50KCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdzaG91bGQtbGludCcpXG4gIH1cbiAgZGVidWcoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC1kZWJ1ZycpXG4gIH1cbiAgZW5hYmxlTGludGVyKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdzaG91bGQtdG9nZ2xlLWxpbnRlcicsICdlbmFibGUnKVxuICB9XG4gIGRpc2FibGVMaW50ZXIoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC10b2dnbGUtbGludGVyJywgJ2Rpc2FibGUnKVxuICB9XG4gIHRvZ2dsZUFjdGl2ZUVkaXRvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLXRvZ2dsZS1hY3RpdmUtZWRpdG9yJylcbiAgfVxuICBzaG93RGVidWcoc3RhbmRhcmRMaW50ZXJzOiBBcnJheTxMaW50ZXI+LCBpbmRpZUxpbnRlcnM6IEFycmF5PEluZGllRGVsZWdhdGU+LCB1aVByb3ZpZGVyczogQXJyYXk8VUk+KSB7XG4gICAgaWYgKCFtYW5pZmVzdCkge1xuICAgICAgbWFuaWZlc3QgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuICAgIH1cbiAgICBpZiAoIUhlbHBlcnMpIHtcbiAgICAgIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAgIH1cblxuICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBjb25zdCB0ZXh0RWRpdG9yU2NvcGVzID0gSGVscGVycy5nZXRFZGl0b3JDdXJzb3JTY29wZXModGV4dEVkaXRvcilcbiAgICBjb25zdCBzb3J0ZWRMaW50ZXJzID0gc3RhbmRhcmRMaW50ZXJzLnNsaWNlKCkuc29ydChzb3J0QnlOYW1lKVxuICAgIGNvbnN0IHNvcnRlZEluZGllTGludGVycyA9IGluZGllTGludGVycy5zbGljZSgpLnNvcnQoc29ydEJ5TmFtZSlcbiAgICBjb25zdCBzb3J0ZWRVSVByb3ZpZGVycyA9IHVpUHJvdmlkZXJzLnNsaWNlKCkuc29ydChzb3J0QnlOYW1lKVxuXG4gICAgY29uc3QgaW5kaWVMaW50ZXJOYW1lcyA9IHNvcnRlZEluZGllTGludGVyc1xuICAgICAgLm1hcChmb3JtYXRJdGVtKS5qb2luKCdcXG4nKVxuICAgIGNvbnN0IHN0YW5kYXJkTGludGVyTmFtZXMgPSBzb3J0ZWRMaW50ZXJzXG4gICAgICAubWFwKGZvcm1hdEl0ZW0pLmpvaW4oJ1xcbicpXG4gICAgY29uc3QgbWF0Y2hpbmdTdGFuZGFyZExpbnRlcnMgPSBzb3J0ZWRMaW50ZXJzXG4gICAgICAuZmlsdGVyKGxpbnRlciA9PiBIZWxwZXJzLnNob3VsZFRyaWdnZXJMaW50ZXIobGludGVyLCBmYWxzZSwgdGV4dEVkaXRvclNjb3BlcykpXG4gICAgICAubWFwKGZvcm1hdEl0ZW0pLmpvaW4oJ1xcbicpXG4gICAgY29uc3QgaHVtYW5pemVkU2NvcGVzID0gdGV4dEVkaXRvclNjb3Blc1xuICAgICAgLm1hcChmb3JtYXRJdGVtKS5qb2luKCdcXG4nKVxuICAgIGNvbnN0IHVpUHJvdmlkZXJOYW1lcyA9IHNvcnRlZFVJUHJvdmlkZXJzXG4gICAgICAubWFwKGZvcm1hdEl0ZW0pLmpvaW4oJ1xcbicpXG5cbiAgICBjb25zdCBpZ25vcmVHbG9iID0gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXIuaWdub3JlR2xvYicpXG4gICAgY29uc3QgaWdub3JlVkNTSWdub3JlZFBhdGhzID0gYXRvbS5jb25maWcuZ2V0KCdjb3JlLmV4Y2x1ZGVWY3NJZ25vcmVkUGF0aHMnKVxuICAgIGNvbnN0IGRpc2FibGVkTGludGVycyA9IGF0b20uY29uZmlnLmdldCgnbGludGVyLmRpc2FibGVkUHJvdmlkZXJzJylcbiAgICAgIC5tYXAoZm9ybWF0SXRlbSkuam9pbignXFxuJylcbiAgICBjb25zdCBmaWxlUGF0aElnbm9yZWQgPSBIZWxwZXJzLmlzUGF0aElnbm9yZWQodGV4dEVkaXRvci5nZXRQYXRoKCksIGlnbm9yZUdsb2IsIGlnbm9yZVZDU0lnbm9yZWRQYXRocylcblxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdMaW50ZXIgRGVidWcgSW5mbycsIHtcbiAgICAgIGRldGFpbDogW1xuICAgICAgICBgUGxhdGZvcm06ICR7cHJvY2Vzcy5wbGF0Zm9ybX1gLFxuICAgICAgICBgQXRvbSBWZXJzaW9uOiAke2F0b20uZ2V0VmVyc2lvbigpfWAsXG4gICAgICAgIGBMaW50ZXIgVmVyc2lvbjogJHttYW5pZmVzdC52ZXJzaW9ufWAsXG4gICAgICAgIGBPcGVuZWQgZmlsZSBpcyBpZ25vcmVkOiAke2ZpbGVQYXRoSWdub3JlZCA/ICdZZXMnIDogJ05vJ31gLFxuICAgICAgICBgTWF0Y2hpbmcgTGludGVyIFByb3ZpZGVyczogXFxuJHttYXRjaGluZ1N0YW5kYXJkTGludGVyc31gLFxuICAgICAgICBgRGlzYWJsZWQgTGludGVyIFByb3ZpZGVyczogXFxuJHtkaXNhYmxlZExpbnRlcnN9YCxcbiAgICAgICAgYFN0YW5kYXJkIExpbnRlciBQcm92aWRlcnM6IFxcbiR7c3RhbmRhcmRMaW50ZXJOYW1lc31gLFxuICAgICAgICBgSW5kaWUgTGludGVyIFByb3ZpZGVyczogXFxuJHtpbmRpZUxpbnRlck5hbWVzfWAsXG4gICAgICAgIGBVSSBQcm92aWRlcnM6IFxcbiR7dWlQcm92aWRlck5hbWVzfWAsXG4gICAgICAgIGBJZ25vcmUgR2xvYjogJHtpZ25vcmVHbG9ifWAsXG4gICAgICAgIGBWQ1MgSWdub3JlZCBQYXRocyBhcmUgZXhjbHVkZWQ6ICR7aWdub3JlVkNTSWdub3JlZFBhdGhzfWAsXG4gICAgICAgIGBDdXJyZW50IEZpbGUgU2NvcGVzOiBcXG4ke2h1bWFuaXplZFNjb3Blc31gLFxuICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgIH0pXG4gIH1cbiAgb25TaG91bGRMaW50KGNhbGxiYWNrOiBGdW5jdGlvbik6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ3Nob3VsZC1saW50JywgY2FsbGJhY2spXG4gIH1cbiAgb25TaG91bGREZWJ1ZyhjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtZGVidWcnLCBjYWxsYmFjaylcbiAgfVxuICBvblNob3VsZFRvZ2dsZUFjdGl2ZUVkaXRvcihjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtdG9nZ2xlLWFjdGl2ZS1lZGl0b3InLCBjYWxsYmFjaylcbiAgfVxuICBvblNob3VsZFRvZ2dsZUxpbnRlcihjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtdG9nZ2xlLWxpbnRlcicsIGNhbGxiYWNrKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=