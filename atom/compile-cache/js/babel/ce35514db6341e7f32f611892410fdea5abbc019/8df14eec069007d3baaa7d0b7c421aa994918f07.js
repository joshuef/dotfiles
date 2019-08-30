Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodashUniq = require('lodash/uniq');

var _lodashUniq2 = _interopRequireDefault(_lodashUniq);

var _atom = require('atom');

var _uiRegistry = require('./ui-registry');

var _uiRegistry2 = _interopRequireDefault(_uiRegistry);

var _indieRegistry = require('./indie-registry');

var _indieRegistry2 = _interopRequireDefault(_indieRegistry);

var _messageRegistry = require('./message-registry');

var _messageRegistry2 = _interopRequireDefault(_messageRegistry);

var _linterRegistry = require('./linter-registry');

var _linterRegistry2 = _interopRequireDefault(_linterRegistry);

var _editorRegistry = require('./editor-registry');

var _editorRegistry2 = _interopRequireDefault(_editorRegistry);

var _commands = require('./commands');

var _commands2 = _interopRequireDefault(_commands);

var _toggleView = require('./toggle-view');

var _toggleView2 = _interopRequireDefault(_toggleView);

var Linter = (function () {
  function Linter() {
    var _this = this;

    _classCallCheck(this, Linter);

    this.idleCallbacks = new Set();
    this.subscriptions = new _atom.CompositeDisposable();

    this.commands = new _commands2['default']();
    this.subscriptions.add(this.commands);

    this.commands.onShouldLint(function () {
      _this.registryEditorsInit();
      var editorLinter = _this.registryEditors.get(atom.workspace.getActiveTextEditor());
      if (editorLinter) {
        editorLinter.lint();
      }
    });
    this.commands.onShouldToggleActiveEditor(function () {
      var textEditor = atom.workspace.getActiveTextEditor();
      _this.registryEditorsInit();
      var editor = _this.registryEditors.get(textEditor);
      if (editor) {
        editor.dispose();
      } else if (textEditor) {
        _this.registryEditors.createFromTextEditor(textEditor);
      }
    });
    this.commands.onShouldDebug(_asyncToGenerator(function* () {
      _this.registryUIInit();
      _this.registryIndieInit();
      _this.registryLintersInit();
      _this.commands.showDebug(_this.registryLinters.getProviders(), _this.registryIndie.getProviders(), _this.registryUI.getProviders());
    }));
    this.commands.onShouldToggleLinter(function (action) {
      _this.registryLintersInit();
      var toggleView = new _toggleView2['default'](action, (0, _lodashUniq2['default'])(_this.registryLinters.getProviders().map(function (linter) {
        return linter.name;
      })));
      toggleView.onDidDispose(function () {
        _this.subscriptions.remove(toggleView);
      });
      toggleView.onDidDisable(function (name) {
        var linter = _this.registryLinters.getProviders().find(function (entry) {
          return entry.name === name;
        });
        if (linter) {
          _this.registryMessagesInit();
          _this.registryMessages.deleteByLinter(linter);
        }
      });
      toggleView.show();
      _this.subscriptions.add(toggleView);
    });

    var projectPathChangeCallbackID = window.requestIdleCallback((function projectPathChange() {
      var _this2 = this;

      this.idleCallbacks['delete'](projectPathChangeCallbackID);
      // NOTE: Atom triggers this on boot so wait a while
      this.subscriptions.add(atom.project.onDidChangePaths(function () {
        _this2.commands.lint();
      }));
    }).bind(this));
    this.idleCallbacks.add(projectPathChangeCallbackID);

    var registryEditorsInitCallbackID = window.requestIdleCallback((function registryEditorsIdleInit() {
      this.idleCallbacks['delete'](registryEditorsInitCallbackID);
      // This will be called on the fly if needed, but needs to run on it's
      // own at some point or linting on open or on change will never trigger
      this.registryEditorsInit();
    }).bind(this));
    this.idleCallbacks.add(registryEditorsInitCallbackID);
  }

  _createClass(Linter, [{
    key: 'dispose',
    value: function dispose() {
      this.idleCallbacks.forEach(function (callbackID) {
        return window.cancelIdleCallback(callbackID);
      });
      this.idleCallbacks.clear();
      this.subscriptions.dispose();
    }
  }, {
    key: 'registryEditorsInit',
    value: function registryEditorsInit() {
      var _this3 = this;

      if (this.registryEditors) {
        return;
      }
      this.registryEditors = new _editorRegistry2['default']();
      this.subscriptions.add(this.registryEditors);
      this.registryEditors.observe(function (editorLinter) {
        editorLinter.onShouldLint(function (onChange) {
          _this3.registryLintersInit();
          _this3.registryLinters.lint({ onChange: onChange, editor: editorLinter.getEditor() });
        });
        editorLinter.onDidDestroy(function () {
          _this3.registryMessagesInit();

          if (!_this3.registryEditors.hasSibling(editorLinter)) {
            _this3.registryMessages.deleteByBuffer(editorLinter.getEditor().getBuffer());
          }
        });
      });
      this.registryEditors.activate();
    }
  }, {
    key: 'registryLintersInit',
    value: function registryLintersInit() {
      var _this4 = this;

      if (this.registryLinters) {
        return;
      }
      this.registryLinters = new _linterRegistry2['default']();
      this.subscriptions.add(this.registryLinters);
      this.registryLinters.onDidUpdateMessages(function (_ref) {
        var linter = _ref.linter;
        var messages = _ref.messages;
        var buffer = _ref.buffer;

        _this4.registryMessagesInit();
        _this4.registryMessages.set({ linter: linter, messages: messages, buffer: buffer });
      });
      this.registryLinters.onDidBeginLinting(function (_ref2) {
        var linter = _ref2.linter;
        var filePath = _ref2.filePath;

        _this4.registryUIInit();
        _this4.registryUI.didBeginLinting(linter, filePath);
      });
      this.registryLinters.onDidFinishLinting(function (_ref3) {
        var linter = _ref3.linter;
        var filePath = _ref3.filePath;

        _this4.registryUIInit();
        _this4.registryUI.didFinishLinting(linter, filePath);
      });
    }
  }, {
    key: 'registryIndieInit',
    value: function registryIndieInit() {
      var _this5 = this;

      if (this.registryIndie) {
        return;
      }
      this.registryIndie = new _indieRegistry2['default']();
      this.subscriptions.add(this.registryIndie);
      this.registryIndie.observe(function (indieLinter) {
        indieLinter.onDidDestroy(function () {
          _this5.registryMessagesInit();
          _this5.registryMessages.deleteByLinter(indieLinter);
        });
      });
      this.registryIndie.onDidUpdate(function (_ref4) {
        var linter = _ref4.linter;
        var messages = _ref4.messages;

        _this5.registryMessagesInit();
        _this5.registryMessages.set({ linter: linter, messages: messages, buffer: null });
      });
    }
  }, {
    key: 'registryMessagesInit',
    value: function registryMessagesInit() {
      var _this6 = this;

      if (this.registryMessages) {
        return;
      }
      this.registryMessages = new _messageRegistry2['default']();
      this.subscriptions.add(this.registryMessages);
      this.registryMessages.onDidUpdateMessages(function (difference) {
        _this6.registryUIInit();
        _this6.registryUI.render(difference);
      });
    }
  }, {
    key: 'registryUIInit',
    value: function registryUIInit() {
      if (this.registryUI) {
        return;
      }
      this.registryUI = new _uiRegistry2['default']();
      this.subscriptions.add(this.registryUI);
    }

    // API methods for providing/consuming services
    // UI
  }, {
    key: 'addUI',
    value: function addUI(ui) {
      this.registryUIInit();
      this.registryUI.add(ui);
      this.registryMessagesInit();
      var messages = this.registryMessages.messages;

      if (messages.length) {
        ui.render({ added: messages, messages: messages, removed: [] });
      }
    }
  }, {
    key: 'deleteUI',
    value: function deleteUI(ui) {
      this.registryUIInit();
      this.registryUI['delete'](ui);
    }

    // Standard Linter
  }, {
    key: 'addLinter',
    value: function addLinter(linter) {
      this.registryLintersInit();
      this.registryLinters.addLinter(linter);
    }
  }, {
    key: 'deleteLinter',
    value: function deleteLinter(linter) {
      this.registryLintersInit();
      this.registryLinters.deleteLinter(linter);
      this.registryMessagesInit();
      this.registryMessages.deleteByLinter(linter);
    }

    // Indie Linter
  }, {
    key: 'addIndie',
    value: function addIndie(indie) {
      this.registryIndieInit();
      return this.registryIndie.register(indie, 2);
    }
  }]);

  return Linter;
})();

exports['default'] = Linter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzswQkFFd0IsYUFBYTs7OztvQkFDRCxNQUFNOzswQkFFbkIsZUFBZTs7Ozs2QkFDWixrQkFBa0I7Ozs7K0JBQ2hCLG9CQUFvQjs7Ozs4QkFDckIsbUJBQW1COzs7OzhCQUNsQixtQkFBbUI7Ozs7d0JBQzFCLFlBQVk7Ozs7MEJBQ1YsZUFBZTs7OztJQUdoQyxNQUFNO0FBVUMsV0FWUCxNQUFNLEdBVUk7OzswQkFWVixNQUFNOztBQVdSLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUM5QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsUUFBUSxHQUFHLDJCQUFjLENBQUE7QUFDOUIsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVyQyxRQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQy9CLFlBQUssbUJBQW1CLEVBQUUsQ0FBQTtBQUMxQixVQUFNLFlBQVksR0FBRyxNQUFLLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUE7QUFDbkYsVUFBSSxZQUFZLEVBQUU7QUFDaEIsb0JBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtPQUNwQjtLQUNGLENBQUMsQ0FBQTtBQUNGLFFBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsWUFBTTtBQUM3QyxVQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUE7QUFDdkQsWUFBSyxtQkFBbUIsRUFBRSxDQUFBO0FBQzFCLFVBQU0sTUFBTSxHQUFHLE1BQUssZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FB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QUUsQ0FBQTtBQUN4QixhQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTtLQUM3Qzs7O1NBcE1HLE1BQU07OztxQkF1TUcsTUFBTSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCBhcnJheVVuaXF1ZSBmcm9tICdsb2Rhc2gvdW5pcSdcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuXG5pbXBvcnQgVUlSZWdpc3RyeSBmcm9tICcuL3VpLXJlZ2lzdHJ5J1xuaW1wb3J0IEluZGllUmVnaXN0cnkgZnJvbSAnLi9pbmRpZS1yZWdpc3RyeSdcbmltcG9ydCBNZXNzYWdlUmVnaXN0cnkgZnJvbSAnLi9tZXNzYWdlLXJlZ2lzdHJ5J1xuaW1wb3J0IExpbnRlclJlZ2lzdHJ5IGZyb20gJy4vbGludGVyLXJlZ2lzdHJ5J1xuaW1wb3J0IEVkaXRvcnNSZWdpc3RyeSBmcm9tICcuL2VkaXRvci1yZWdpc3RyeSdcbmltcG9ydCBDb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IFRvZ2dsZVZpZXcgZnJvbSAnLi90b2dnbGUtdmlldydcbmltcG9ydCB0eXBlIHsgVUksIExpbnRlciBhcyBMaW50ZXJQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnXG5cbmNsYXNzIExpbnRlciB7XG4gIGNvbW1hbmRzOiBDb21tYW5kc1xuICByZWdpc3RyeVVJOiBVSVJlZ2lzdHJ5XG4gIHJlZ2lzdHJ5SW5kaWU6IEluZGllUmVnaXN0cnlcbiAgcmVnaXN0cnlFZGl0b3JzOiBFZGl0b3JzUmVnaXN0cnlcbiAgcmVnaXN0cnlMaW50ZXJzOiBMaW50ZXJSZWdpc3RyeVxuICByZWdpc3RyeU1lc3NhZ2VzOiBNZXNzYWdlUmVnaXN0cnlcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBpZGxlQ2FsbGJhY2tzOiBTZXQ8bnVtYmVyPlxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaWRsZUNhbGxiYWNrcyA9IG5ldyBTZXQoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuY29tbWFuZHMgPSBuZXcgQ29tbWFuZHMoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcylcblxuICAgIHRoaXMuY29tbWFuZHMub25TaG91bGRMaW50KCgpID0+IHtcbiAgICAgIHRoaXMucmVnaXN0cnlFZGl0b3JzSW5pdCgpXG4gICAgICBjb25zdCBlZGl0b3JMaW50ZXIgPSB0aGlzLnJlZ2lzdHJ5RWRpdG9ycy5nZXQoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgaWYgKGVkaXRvckxpbnRlcikge1xuICAgICAgICBlZGl0b3JMaW50ZXIubGludCgpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNvbW1hbmRzLm9uU2hvdWxkVG9nZ2xlQWN0aXZlRWRpdG9yKCgpID0+IHtcbiAgICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIHRoaXMucmVnaXN0cnlFZGl0b3JzSW5pdCgpXG4gICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLnJlZ2lzdHJ5RWRpdG9ycy5nZXQodGV4dEVkaXRvcilcbiAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgZWRpdG9yLmRpc3Bvc2UoKVxuICAgICAgfSBlbHNlIGlmICh0ZXh0RWRpdG9yKSB7XG4gICAgICAgIHRoaXMucmVnaXN0cnlFZGl0b3JzLmNyZWF0ZUZyb21UZXh0RWRpdG9yKHRleHRFZGl0b3IpXG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNvbW1hbmRzLm9uU2hvdWxkRGVidWcoYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5SW5kaWVJbml0KClcbiAgICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzSW5pdCgpXG4gICAgICB0aGlzLmNvbW1hbmRzLnNob3dEZWJ1ZyhcbiAgICAgICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMuZ2V0UHJvdmlkZXJzKCksXG4gICAgICAgIHRoaXMucmVnaXN0cnlJbmRpZS5nZXRQcm92aWRlcnMoKSxcbiAgICAgICAgdGhpcy5yZWdpc3RyeVVJLmdldFByb3ZpZGVycygpLFxuICAgICAgKVxuICAgIH0pXG4gICAgdGhpcy5jb21tYW5kcy5vblNob3VsZFRvZ2dsZUxpbnRlcihhY3Rpb24gPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeUxpbnRlcnNJbml0KClcbiAgICAgIGNvbnN0IHRvZ2dsZVZpZXcgPSBuZXcgVG9nZ2xlVmlldyhhY3Rpb24sIGFycmF5VW5pcXVlKHRoaXMucmVnaXN0cnlMaW50ZXJzLmdldFByb3ZpZGVycygpLm1hcChsaW50ZXIgPT4gbGludGVyLm5hbWUpKSlcbiAgICAgIHRvZ2dsZVZpZXcub25EaWREaXNwb3NlKCgpID0+IHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnJlbW92ZSh0b2dnbGVWaWV3KVxuICAgICAgfSlcbiAgICAgIHRvZ2dsZVZpZXcub25EaWREaXNhYmxlKG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBsaW50ZXIgPSB0aGlzLnJlZ2lzdHJ5TGludGVycy5nZXRQcm92aWRlcnMoKS5maW5kKGVudHJ5ID0+IGVudHJ5Lm5hbWUgPT09IG5hbWUpXG4gICAgICAgIGlmIChsaW50ZXIpIHtcbiAgICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuZGVsZXRlQnlMaW50ZXIobGludGVyKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdG9nZ2xlVmlldy5zaG93KClcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodG9nZ2xlVmlldylcbiAgICB9KVxuXG4gICAgY29uc3QgcHJvamVjdFBhdGhDaGFuZ2VDYWxsYmFja0lEID0gd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2soXG4gICAgICBmdW5jdGlvbiBwcm9qZWN0UGF0aENoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmRlbGV0ZShwcm9qZWN0UGF0aENoYW5nZUNhbGxiYWNrSUQpXG4gICAgICAgIC8vIE5PVEU6IEF0b20gdHJpZ2dlcnMgdGhpcyBvbiBib290IHNvIHdhaXQgYSB3aGlsZVxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29tbWFuZHMubGludCgpXG4gICAgICAgICAgfSksXG4gICAgICAgIClcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICApXG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmFkZChwcm9qZWN0UGF0aENoYW5nZUNhbGxiYWNrSUQpXG5cbiAgICBjb25zdCByZWdpc3RyeUVkaXRvcnNJbml0Q2FsbGJhY2tJRCA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKFxuICAgICAgZnVuY3Rpb24gcmVnaXN0cnlFZGl0b3JzSWRsZUluaXQoKSB7XG4gICAgICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5kZWxldGUocmVnaXN0cnlFZGl0b3JzSW5pdENhbGxiYWNrSUQpXG4gICAgICAgIC8vIFRoaXMgd2lsbCBiZSBjYWxsZWQgb24gdGhlIGZseSBpZiBuZWVkZWQsIGJ1dCBuZWVkcyB0byBydW4gb24gaXQnc1xuICAgICAgICAvLyBvd24gYXQgc29tZSBwb2ludCBvciBsaW50aW5nIG9uIG9wZW4gb3Igb24gY2hhbmdlIHdpbGwgbmV2ZXIgdHJpZ2dlclxuICAgICAgICB0aGlzLnJlZ2lzdHJ5RWRpdG9yc0luaXQoKVxuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgIClcbiAgICB0aGlzLmlkbGVDYWxsYmFja3MuYWRkKHJlZ2lzdHJ5RWRpdG9yc0luaXRDYWxsYmFja0lEKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2tJRCA9PiB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKGNhbGxiYWNrSUQpKVxuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5jbGVhcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG5cbiAgcmVnaXN0cnlFZGl0b3JzSW5pdCgpIHtcbiAgICBpZiAodGhpcy5yZWdpc3RyeUVkaXRvcnMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnJlZ2lzdHJ5RWRpdG9ycyA9IG5ldyBFZGl0b3JzUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeUVkaXRvcnMpXG4gICAgdGhpcy5yZWdpc3RyeUVkaXRvcnMub2JzZXJ2ZShlZGl0b3JMaW50ZXIgPT4ge1xuICAgICAgZWRpdG9yTGludGVyLm9uU2hvdWxkTGludChvbkNoYW5nZSA9PiB7XG4gICAgICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzSW5pdCgpXG4gICAgICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzLmxpbnQoeyBvbkNoYW5nZSwgZWRpdG9yOiBlZGl0b3JMaW50ZXIuZ2V0RWRpdG9yKCkgfSlcbiAgICAgIH0pXG4gICAgICBlZGl0b3JMaW50ZXIub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgdGhpcy5yZWdpc3RyeU1lc3NhZ2VzSW5pdCgpXG5cbiAgICAgICAgaWYgKCF0aGlzLnJlZ2lzdHJ5RWRpdG9ycy5oYXNTaWJsaW5nKGVkaXRvckxpbnRlcikpIHtcbiAgICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuZGVsZXRlQnlCdWZmZXIoZWRpdG9yTGludGVyLmdldEVkaXRvcigpLmdldEJ1ZmZlcigpKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy5yZWdpc3RyeUVkaXRvcnMuYWN0aXZhdGUoKVxuICB9XG4gIHJlZ2lzdHJ5TGludGVyc0luaXQoKSB7XG4gICAgaWYgKHRoaXMucmVnaXN0cnlMaW50ZXJzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMgPSBuZXcgTGludGVyUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeUxpbnRlcnMpXG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMub25EaWRVcGRhdGVNZXNzYWdlcygoeyBsaW50ZXIsIG1lc3NhZ2VzLCBidWZmZXIgfSkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeU1lc3NhZ2VzSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuc2V0KHsgbGludGVyLCBtZXNzYWdlcywgYnVmZmVyIH0pXG4gICAgfSlcbiAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5vbkRpZEJlZ2luTGludGluZygoeyBsaW50ZXIsIGZpbGVQYXRoIH0pID0+IHtcbiAgICAgIHRoaXMucmVnaXN0cnlVSUluaXQoKVxuICAgICAgdGhpcy5yZWdpc3RyeVVJLmRpZEJlZ2luTGludGluZyhsaW50ZXIsIGZpbGVQYXRoKVxuICAgIH0pXG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMub25EaWRGaW5pc2hMaW50aW5nKCh7IGxpbnRlciwgZmlsZVBhdGggfSkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5VUkuZGlkRmluaXNoTGludGluZyhsaW50ZXIsIGZpbGVQYXRoKVxuICAgIH0pXG4gIH1cbiAgcmVnaXN0cnlJbmRpZUluaXQoKSB7XG4gICAgaWYgKHRoaXMucmVnaXN0cnlJbmRpZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMucmVnaXN0cnlJbmRpZSA9IG5ldyBJbmRpZVJlZ2lzdHJ5KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucmVnaXN0cnlJbmRpZSlcbiAgICB0aGlzLnJlZ2lzdHJ5SW5kaWUub2JzZXJ2ZShpbmRpZUxpbnRlciA9PiB7XG4gICAgICBpbmRpZUxpbnRlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICAgICAgdGhpcy5yZWdpc3RyeU1lc3NhZ2VzLmRlbGV0ZUJ5TGludGVyKGluZGllTGludGVyKVxuICAgICAgfSlcbiAgICB9KVxuICAgIHRoaXMucmVnaXN0cnlJbmRpZS5vbkRpZFVwZGF0ZSgoeyBsaW50ZXIsIG1lc3NhZ2VzIH0pID0+IHtcbiAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlc0luaXQoKVxuICAgICAgdGhpcy5yZWdpc3RyeU1lc3NhZ2VzLnNldCh7IGxpbnRlciwgbWVzc2FnZXMsIGJ1ZmZlcjogbnVsbCB9KVxuICAgIH0pXG4gIH1cbiAgcmVnaXN0cnlNZXNzYWdlc0luaXQoKSB7XG4gICAgaWYgKHRoaXMucmVnaXN0cnlNZXNzYWdlcykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcyA9IG5ldyBNZXNzYWdlUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeU1lc3NhZ2VzKVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcy5vbkRpZFVwZGF0ZU1lc3NhZ2VzKGRpZmZlcmVuY2UgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5VUkucmVuZGVyKGRpZmZlcmVuY2UpXG4gICAgfSlcbiAgfVxuICByZWdpc3RyeVVJSW5pdCgpIHtcbiAgICBpZiAodGhpcy5yZWdpc3RyeVVJKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5yZWdpc3RyeVVJID0gbmV3IFVJUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeVVJKVxuICB9XG5cbiAgLy8gQVBJIG1ldGhvZHMgZm9yIHByb3ZpZGluZy9jb25zdW1pbmcgc2VydmljZXNcbiAgLy8gVUlcbiAgYWRkVUkodWk6IFVJKSB7XG4gICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgdGhpcy5yZWdpc3RyeVVJLmFkZCh1aSlcbiAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICBjb25zdCB7IG1lc3NhZ2VzIH0gPSB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNcbiAgICBpZiAobWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgICB1aS5yZW5kZXIoeyBhZGRlZDogbWVzc2FnZXMsIG1lc3NhZ2VzLCByZW1vdmVkOiBbXSB9KVxuICAgIH1cbiAgfVxuICBkZWxldGVVSSh1aTogVUkpIHtcbiAgICB0aGlzLnJlZ2lzdHJ5VUlJbml0KClcbiAgICB0aGlzLnJlZ2lzdHJ5VUkuZGVsZXRlKHVpKVxuICB9XG4gIC8vIFN0YW5kYXJkIExpbnRlclxuICBhZGRMaW50ZXIobGludGVyOiBMaW50ZXJQcm92aWRlcikge1xuICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzSW5pdCgpXG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMuYWRkTGludGVyKGxpbnRlcilcbiAgfVxuICBkZWxldGVMaW50ZXIobGludGVyOiBMaW50ZXJQcm92aWRlcikge1xuICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzSW5pdCgpXG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMuZGVsZXRlTGludGVyKGxpbnRlcilcbiAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuZGVsZXRlQnlMaW50ZXIobGludGVyKVxuICB9XG4gIC8vIEluZGllIExpbnRlclxuICBhZGRJbmRpZShpbmRpZTogT2JqZWN0KSB7XG4gICAgdGhpcy5yZWdpc3RyeUluZGllSW5pdCgpXG4gICAgcmV0dXJuIHRoaXMucmVnaXN0cnlJbmRpZS5yZWdpc3RlcihpbmRpZSwgMilcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaW50ZXJcbiJdfQ==