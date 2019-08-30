var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _commands = require('./commands');

var _commands2 = _interopRequireDefault(_commands);

var Helpers = undefined;
var ToggleView = undefined;
var UIRegistry = undefined;
var arrayUnique = undefined;
var IndieRegistry = undefined;
var LinterRegistry = undefined;
var EditorsRegistry = undefined;
var MessageRegistry = undefined;

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
      if (!Helpers) {
        Helpers = require('./helpers');
      }
      _this.registryUIInit();
      _this.registryIndieInit();
      _this.registryLintersInit();
      _this.commands.showDebug(_this.registryLinters.getProviders(), _this.registryIndie.getProviders(), _this.registryUI.getProviders());
    }));
    this.commands.onShouldToggleLinter(function (action) {
      if (!ToggleView) {
        ToggleView = require('./toggle-view');
      }
      if (!arrayUnique) {
        arrayUnique = require('lodash.uniq');
      }
      _this.registryLintersInit();
      var toggleView = new ToggleView(action, arrayUnique(_this.registryLinters.getProviders().map(function (linter) {
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
      if (!EditorsRegistry) {
        EditorsRegistry = require('./editor-registry');
      }
      this.registryEditors = new EditorsRegistry();
      this.subscriptions.add(this.registryEditors);
      this.registryEditors.observe(function (editorLinter) {
        editorLinter.onShouldLint(function (onChange) {
          _this3.registryLintersInit();
          _this3.registryLinters.lint({ onChange: onChange, editor: editorLinter.getEditor() });
        });
        editorLinter.onDidDestroy(function () {
          _this3.registryMessagesInit();
          _this3.registryMessages.deleteByBuffer(editorLinter.getEditor().getBuffer());
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
      if (!LinterRegistry) {
        LinterRegistry = require('./linter-registry');
      }
      this.registryLinters = new LinterRegistry();
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
      if (!IndieRegistry) {
        IndieRegistry = require('./indie-registry');
      }
      this.registryIndie = new IndieRegistry();
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
      if (!MessageRegistry) {
        MessageRegistry = require('./message-registry');
      }
      this.registryMessages = new MessageRegistry();
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
      if (!UIRegistry) {
        UIRegistry = require('./ui-registry');
      }
      this.registryUI = new UIRegistry();
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
      var legacy = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      this.registryLintersInit();
      this.registryLinters.addLinter(linter, legacy);
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
  }, {
    key: 'addLegacyIndie',
    value: function addLegacyIndie(indie) {
      this.registryIndieInit();
      return this.registryIndie.register(indie, 1);
    }
  }]);

  return Linter;
})();

module.exports = Linter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUVvQyxNQUFNOzt3QkFFckIsWUFBWTs7OztBQUdqQyxJQUFJLE9BQU8sWUFBQSxDQUFBO0FBQ1gsSUFBSSxVQUFVLFlBQUEsQ0FBQTtBQUNkLElBQUksVUFBVSxZQUFBLENBQUE7QUFDZCxJQUFJLFdBQVcsWUFBQSxDQUFBO0FBQ2YsSUFBSSxhQUFhLFlBQUEsQ0FBQTtBQUNqQixJQUFJLGNBQWMsWUFBQSxDQUFBO0FBQ2xCLElBQUksZUFBZSxZQUFBLENBQUE7QUFDbkIsSUFBSSxlQUFlLFlBQUEsQ0FBQTs7SUFFYixNQUFNO0FBVUMsV0FWUCxNQUFNLEdBVUk7OzswQkFWVixNQUFNOztBQVdSLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUM5QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsUUFBUSxHQUFHLDJCQUFjLENBQUE7QUFDOUIsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVyQyxRQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQy9CLFlBQUssbUJBQW1CLEVBQUUsQ0FBQTtBQUMxQixVQUFNLFlBQVksR0FBRyxNQUFLLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUE7QUFDbkYsVUFBSSxZQUFZLEVBQUU7QUFDaEIsb0JBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtPQUNwQjtLQUNGLENBQUMsQ0FBQTtBQUNGLFFBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsWUFBTTtBQUM3QyxVQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENB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QUMsQ0FBQyxDQUFBO0tBQzdDOzs7U0ExTkcsTUFBTTs7O0FBNk5aLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCBDb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IHR5cGUgeyBVSSwgTGludGVyIGFzIExpbnRlclByb3ZpZGVyIH0gZnJvbSAnLi90eXBlcydcblxubGV0IEhlbHBlcnNcbmxldCBUb2dnbGVWaWV3XG5sZXQgVUlSZWdpc3RyeVxubGV0IGFycmF5VW5pcXVlXG5sZXQgSW5kaWVSZWdpc3RyeVxubGV0IExpbnRlclJlZ2lzdHJ5XG5sZXQgRWRpdG9yc1JlZ2lzdHJ5XG5sZXQgTWVzc2FnZVJlZ2lzdHJ5XG5cbmNsYXNzIExpbnRlciB7XG4gIGNvbW1hbmRzOiBDb21tYW5kcztcbiAgcmVnaXN0cnlVSTogVUlSZWdpc3RyeTtcbiAgcmVnaXN0cnlJbmRpZTogSW5kaWVSZWdpc3RyeTtcbiAgcmVnaXN0cnlFZGl0b3JzOiBFZGl0b3JzUmVnaXN0cnk7XG4gIHJlZ2lzdHJ5TGludGVyczogTGludGVyUmVnaXN0cnk7XG4gIHJlZ2lzdHJ5TWVzc2FnZXM6IE1lc3NhZ2VSZWdpc3RyeTtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgaWRsZUNhbGxiYWNrczogU2V0PG51bWJlcj47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzID0gbmV3IFNldCgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5jb21tYW5kcyA9IG5ldyBDb21tYW5kcygpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmNvbW1hbmRzKVxuXG4gICAgdGhpcy5jb21tYW5kcy5vblNob3VsZExpbnQoKCkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeUVkaXRvcnNJbml0KClcbiAgICAgIGNvbnN0IGVkaXRvckxpbnRlciA9IHRoaXMucmVnaXN0cnlFZGl0b3JzLmdldChhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICBpZiAoZWRpdG9yTGludGVyKSB7XG4gICAgICAgIGVkaXRvckxpbnRlci5saW50KClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY29tbWFuZHMub25TaG91bGRUb2dnbGVBY3RpdmVFZGl0b3IoKCkgPT4ge1xuICAgICAgY29uc3QgdGV4dEVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgdGhpcy5yZWdpc3RyeUVkaXRvcnNJbml0KClcbiAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMucmVnaXN0cnlFZGl0b3JzLmdldCh0ZXh0RWRpdG9yKVxuICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICBlZGl0b3IuZGlzcG9zZSgpXG4gICAgICB9IGVsc2UgaWYgKHRleHRFZGl0b3IpIHtcbiAgICAgICAgdGhpcy5yZWdpc3RyeUVkaXRvcnMuY3JlYXRlRnJvbVRleHRFZGl0b3IodGV4dEVkaXRvcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuY29tbWFuZHMub25TaG91bGREZWJ1Zyhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIUhlbHBlcnMpIHtcbiAgICAgICAgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpXG4gICAgICB9XG4gICAgICB0aGlzLnJlZ2lzdHJ5VUlJbml0KClcbiAgICAgIHRoaXMucmVnaXN0cnlJbmRpZUluaXQoKVxuICAgICAgdGhpcy5yZWdpc3RyeUxpbnRlcnNJbml0KClcbiAgICAgIHRoaXMuY29tbWFuZHMuc2hvd0RlYnVnKFxuICAgICAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5nZXRQcm92aWRlcnMoKSxcbiAgICAgICAgdGhpcy5yZWdpc3RyeUluZGllLmdldFByb3ZpZGVycygpLFxuICAgICAgICB0aGlzLnJlZ2lzdHJ5VUkuZ2V0UHJvdmlkZXJzKCksXG4gICAgICApXG4gICAgfSlcbiAgICB0aGlzLmNvbW1hbmRzLm9uU2hvdWxkVG9nZ2xlTGludGVyKChhY3Rpb24pID0+IHtcbiAgICAgIGlmICghVG9nZ2xlVmlldykge1xuICAgICAgICBUb2dnbGVWaWV3ID0gcmVxdWlyZSgnLi90b2dnbGUtdmlldycpXG4gICAgICB9XG4gICAgICBpZiAoIWFycmF5VW5pcXVlKSB7XG4gICAgICAgIGFycmF5VW5pcXVlID0gcmVxdWlyZSgnbG9kYXNoLnVuaXEnKVxuICAgICAgfVxuICAgICAgdGhpcy5yZWdpc3RyeUxpbnRlcnNJbml0KClcbiAgICAgIGNvbnN0IHRvZ2dsZVZpZXcgPSBuZXcgVG9nZ2xlVmlldyhhY3Rpb24sXG4gICAgICAgIGFycmF5VW5pcXVlKHRoaXMucmVnaXN0cnlMaW50ZXJzLmdldFByb3ZpZGVycygpLm1hcChsaW50ZXIgPT4gbGludGVyLm5hbWUpKSlcbiAgICAgIHRvZ2dsZVZpZXcub25EaWREaXNwb3NlKCgpID0+IHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnJlbW92ZSh0b2dnbGVWaWV3KVxuICAgICAgfSlcbiAgICAgIHRvZ2dsZVZpZXcub25EaWREaXNhYmxlKChuYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbnRlciA9IHRoaXMucmVnaXN0cnlMaW50ZXJzLmdldFByb3ZpZGVycygpLmZpbmQoZW50cnkgPT4gZW50cnkubmFtZSA9PT0gbmFtZSlcbiAgICAgICAgaWYgKGxpbnRlcikge1xuICAgICAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlc0luaXQoKVxuICAgICAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcy5kZWxldGVCeUxpbnRlcihsaW50ZXIpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0b2dnbGVWaWV3LnNob3coKVxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0b2dnbGVWaWV3KVxuICAgIH0pXG5cbiAgICBjb25zdCBwcm9qZWN0UGF0aENoYW5nZUNhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhcbiAgICAgIGZ1bmN0aW9uIHByb2plY3RQYXRoQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLmlkbGVDYWxsYmFja3MuZGVsZXRlKHByb2plY3RQYXRoQ2hhbmdlQ2FsbGJhY2tJRClcbiAgICAgICAgLy8gTk9URTogQXRvbSB0cmlnZ2VycyB0aGlzIG9uIGJvb3Qgc28gd2FpdCBhIHdoaWxlXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29tbWFuZHMubGludCgpXG4gICAgICAgIH0pKVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5hZGQocHJvamVjdFBhdGhDaGFuZ2VDYWxsYmFja0lEKVxuXG4gICAgY29uc3QgcmVnaXN0cnlFZGl0b3JzSW5pdENhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhcbiAgICAgIGZ1bmN0aW9uIHJlZ2lzdHJ5RWRpdG9yc0lkbGVJbml0KCkge1xuICAgICAgICB0aGlzLmlkbGVDYWxsYmFja3MuZGVsZXRlKHJlZ2lzdHJ5RWRpdG9yc0luaXRDYWxsYmFja0lEKVxuICAgICAgICAvLyBUaGlzIHdpbGwgYmUgY2FsbGVkIG9uIHRoZSBmbHkgaWYgbmVlZGVkLCBidXQgbmVlZHMgdG8gcnVuIG9uIGl0J3NcbiAgICAgICAgLy8gb3duIGF0IHNvbWUgcG9pbnQgb3IgbGludGluZyBvbiBvcGVuIG9yIG9uIGNoYW5nZSB3aWxsIG5ldmVyIHRyaWdnZXJcbiAgICAgICAgdGhpcy5yZWdpc3RyeUVkaXRvcnNJbml0KClcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB0aGlzLmlkbGVDYWxsYmFja3MuYWRkKHJlZ2lzdHJ5RWRpdG9yc0luaXRDYWxsYmFja0lEKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2tJRCA9PiB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKGNhbGxiYWNrSUQpKVxuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5jbGVhcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG5cbiAgcmVnaXN0cnlFZGl0b3JzSW5pdCgpIHtcbiAgICBpZiAodGhpcy5yZWdpc3RyeUVkaXRvcnMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIUVkaXRvcnNSZWdpc3RyeSkge1xuICAgICAgRWRpdG9yc1JlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9lZGl0b3ItcmVnaXN0cnknKVxuICAgIH1cbiAgICB0aGlzLnJlZ2lzdHJ5RWRpdG9ycyA9IG5ldyBFZGl0b3JzUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeUVkaXRvcnMpXG4gICAgdGhpcy5yZWdpc3RyeUVkaXRvcnMub2JzZXJ2ZSgoZWRpdG9yTGludGVyKSA9PiB7XG4gICAgICBlZGl0b3JMaW50ZXIub25TaG91bGRMaW50KChvbkNoYW5nZSkgPT4ge1xuICAgICAgICB0aGlzLnJlZ2lzdHJ5TGludGVyc0luaXQoKVxuICAgICAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5saW50KHsgb25DaGFuZ2UsIGVkaXRvcjogZWRpdG9yTGludGVyLmdldEVkaXRvcigpIH0pXG4gICAgICB9KVxuICAgICAgZWRpdG9yTGludGVyLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlc0luaXQoKVxuICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuZGVsZXRlQnlCdWZmZXIoZWRpdG9yTGludGVyLmdldEVkaXRvcigpLmdldEJ1ZmZlcigpKVxuICAgICAgfSlcbiAgICB9KVxuICAgIHRoaXMucmVnaXN0cnlFZGl0b3JzLmFjdGl2YXRlKClcbiAgfVxuICByZWdpc3RyeUxpbnRlcnNJbml0KCkge1xuICAgIGlmICh0aGlzLnJlZ2lzdHJ5TGludGVycykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghTGludGVyUmVnaXN0cnkpIHtcbiAgICAgIExpbnRlclJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9saW50ZXItcmVnaXN0cnknKVxuICAgIH1cbiAgICB0aGlzLnJlZ2lzdHJ5TGludGVycyA9IG5ldyBMaW50ZXJSZWdpc3RyeSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnJlZ2lzdHJ5TGludGVycylcbiAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5vbkRpZFVwZGF0ZU1lc3NhZ2VzKCh7IGxpbnRlciwgbWVzc2FnZXMsIGJ1ZmZlciB9KSA9PiB7XG4gICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcy5zZXQoeyBsaW50ZXIsIG1lc3NhZ2VzLCBidWZmZXIgfSlcbiAgICB9KVxuICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzLm9uRGlkQmVnaW5MaW50aW5nKCh7IGxpbnRlciwgZmlsZVBhdGggfSkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5VUkuZGlkQmVnaW5MaW50aW5nKGxpbnRlciwgZmlsZVBhdGgpXG4gICAgfSlcbiAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5vbkRpZEZpbmlzaExpbnRpbmcoKHsgbGludGVyLCBmaWxlUGF0aCB9KSA9PiB7XG4gICAgICB0aGlzLnJlZ2lzdHJ5VUlJbml0KClcbiAgICAgIHRoaXMucmVnaXN0cnlVSS5kaWRGaW5pc2hMaW50aW5nKGxpbnRlciwgZmlsZVBhdGgpXG4gICAgfSlcbiAgfVxuICByZWdpc3RyeUluZGllSW5pdCgpIHtcbiAgICBpZiAodGhpcy5yZWdpc3RyeUluZGllKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFJbmRpZVJlZ2lzdHJ5KSB7XG4gICAgICBJbmRpZVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9pbmRpZS1yZWdpc3RyeScpXG4gICAgfVxuICAgIHRoaXMucmVnaXN0cnlJbmRpZSA9IG5ldyBJbmRpZVJlZ2lzdHJ5KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucmVnaXN0cnlJbmRpZSlcbiAgICB0aGlzLnJlZ2lzdHJ5SW5kaWUub2JzZXJ2ZSgoaW5kaWVMaW50ZXIpID0+IHtcbiAgICAgIGluZGllTGludGVyLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlc0luaXQoKVxuICAgICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuZGVsZXRlQnlMaW50ZXIoaW5kaWVMaW50ZXIpXG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy5yZWdpc3RyeUluZGllLm9uRGlkVXBkYXRlKCh7IGxpbnRlciwgbWVzc2FnZXMgfSkgPT4ge1xuICAgICAgdGhpcy5yZWdpc3RyeU1lc3NhZ2VzSW5pdCgpXG4gICAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXMuc2V0KHsgbGludGVyLCBtZXNzYWdlcywgYnVmZmVyOiBudWxsIH0pXG4gICAgfSlcbiAgfVxuICByZWdpc3RyeU1lc3NhZ2VzSW5pdCgpIHtcbiAgICBpZiAodGhpcy5yZWdpc3RyeU1lc3NhZ2VzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFNZXNzYWdlUmVnaXN0cnkpIHtcbiAgICAgIE1lc3NhZ2VSZWdpc3RyeSA9IHJlcXVpcmUoJy4vbWVzc2FnZS1yZWdpc3RyeScpXG4gICAgfVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcyA9IG5ldyBNZXNzYWdlUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeU1lc3NhZ2VzKVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcy5vbkRpZFVwZGF0ZU1lc3NhZ2VzKChkaWZmZXJlbmNlKSA9PiB7XG4gICAgICB0aGlzLnJlZ2lzdHJ5VUlJbml0KClcbiAgICAgIHRoaXMucmVnaXN0cnlVSS5yZW5kZXIoZGlmZmVyZW5jZSlcbiAgICB9KVxuICB9XG4gIHJlZ2lzdHJ5VUlJbml0KCkge1xuICAgIGlmICh0aGlzLnJlZ2lzdHJ5VUkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIVVJUmVnaXN0cnkpIHtcbiAgICAgIFVJUmVnaXN0cnkgPSByZXF1aXJlKCcuL3VpLXJlZ2lzdHJ5JylcbiAgICB9XG4gICAgdGhpcy5yZWdpc3RyeVVJID0gbmV3IFVJUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeVVJKVxuICB9XG5cbiAgLy8gQVBJIG1ldGhvZHMgZm9yIHByb3ZpZGluZy9jb25zdW1pbmcgc2VydmljZXNcbiAgLy8gVUlcbiAgYWRkVUkodWk6IFVJKSB7XG4gICAgdGhpcy5yZWdpc3RyeVVJSW5pdCgpXG4gICAgdGhpcy5yZWdpc3RyeVVJLmFkZCh1aSlcbiAgICB0aGlzLnJlZ2lzdHJ5TWVzc2FnZXNJbml0KClcbiAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMucmVnaXN0cnlNZXNzYWdlcy5tZXNzYWdlc1xuICAgIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcbiAgICAgIHVpLnJlbmRlcih7IGFkZGVkOiBtZXNzYWdlcywgbWVzc2FnZXMsIHJlbW92ZWQ6IFtdIH0pXG4gICAgfVxuICB9XG4gIGRlbGV0ZVVJKHVpOiBVSSkge1xuICAgIHRoaXMucmVnaXN0cnlVSUluaXQoKVxuICAgIHRoaXMucmVnaXN0cnlVSS5kZWxldGUodWkpXG4gIH1cbiAgLy8gU3RhbmRhcmQgTGludGVyXG4gIGFkZExpbnRlcihsaW50ZXI6IExpbnRlclByb3ZpZGVyLCBsZWdhY3k6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHRoaXMucmVnaXN0cnlMaW50ZXJzSW5pdCgpXG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnMuYWRkTGludGVyKGxpbnRlciwgbGVnYWN5KVxuICB9XG4gIGRlbGV0ZUxpbnRlcihsaW50ZXI6IExpbnRlclByb3ZpZGVyKSB7XG4gICAgdGhpcy5yZWdpc3RyeUxpbnRlcnNJbml0KClcbiAgICB0aGlzLnJlZ2lzdHJ5TGludGVycy5kZWxldGVMaW50ZXIobGludGVyKVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlc0luaXQoKVxuICAgIHRoaXMucmVnaXN0cnlNZXNzYWdlcy5kZWxldGVCeUxpbnRlcihsaW50ZXIpXG4gIH1cbiAgLy8gSW5kaWUgTGludGVyXG4gIGFkZEluZGllKGluZGllOiBPYmplY3QpIHtcbiAgICB0aGlzLnJlZ2lzdHJ5SW5kaWVJbml0KClcbiAgICByZXR1cm4gdGhpcy5yZWdpc3RyeUluZGllLnJlZ2lzdGVyKGluZGllLCAyKVxuICB9XG4gIGFkZExlZ2FjeUluZGllKGluZGllOiBPYmplY3QpIHtcbiAgICB0aGlzLnJlZ2lzdHJ5SW5kaWVJbml0KClcbiAgICByZXR1cm4gdGhpcy5yZWdpc3RyeUluZGllLnJlZ2lzdGVyKGluZGllLCAxKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGludGVyXG4iXX0=