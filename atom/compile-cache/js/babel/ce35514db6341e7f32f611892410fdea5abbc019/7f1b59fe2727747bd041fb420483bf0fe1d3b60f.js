Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* eslint-disable import/no-duplicates */

var _atom = require('atom');

var _helpers = require('./helpers');

var Helpers = _interopRequireWildcard(_helpers);

var _validate = require('./validate');

var Validate = _interopRequireWildcard(_validate);

var LinterRegistry = (function () {
  function LinterRegistry() {
    var _this = this;

    _classCallCheck(this, LinterRegistry);

    this.emitter = new _atom.Emitter();
    this.linters = new Set();
    this.subscriptions = new _atom.CompositeDisposable();
    this.activeNotifications = new Set();

    this.subscriptions.add(atom.config.observe('linter.lintOnChange', function (lintOnChange) {
      _this.lintOnChange = lintOnChange;
    }));
    this.subscriptions.add(atom.config.observe('core.excludeVcsIgnoredPaths', function (ignoreVCS) {
      _this.ignoreVCS = ignoreVCS;
    }));
    this.subscriptions.add(atom.config.observe('linter.ignoreGlob', function (ignoreGlob) {
      _this.ignoreGlob = ignoreGlob;
    }));
    this.subscriptions.add(atom.config.observe('linter.lintPreviewTabs', function (lintPreviewTabs) {
      _this.lintPreviewTabs = lintPreviewTabs;
    }));
    this.subscriptions.add(atom.config.observe('linter.disabledProviders', function (disabledProviders) {
      _this.disabledProviders = disabledProviders;
    }));
    this.subscriptions.add(this.emitter);
  }

  _createClass(LinterRegistry, [{
    key: 'hasLinter',
    value: function hasLinter(linter) {
      return this.linters.has(linter);
    }
  }, {
    key: 'addLinter',
    value: function addLinter(linter) {
      if (!Validate.linter(linter)) {
        return;
      }
      linter[_helpers.$activated] = true;
      if (typeof linter[_helpers.$requestLatest] === 'undefined') {
        linter[_helpers.$requestLatest] = 0;
      }
      if (typeof linter[_helpers.$requestLastReceived] === 'undefined') {
        linter[_helpers.$requestLastReceived] = 0;
      }
      linter[_helpers.$version] = 2;
      this.linters.add(linter);
    }
  }, {
    key: 'getProviders',
    value: function getProviders() {
      return Array.from(this.linters);
    }
  }, {
    key: 'deleteLinter',
    value: function deleteLinter(linter) {
      if (!this.linters.has(linter)) {
        return;
      }
      linter[_helpers.$activated] = false;
      this.linters['delete'](linter);
    }
  }, {
    key: 'lint',
    value: _asyncToGenerator(function* (_ref) {
      var onChange = _ref.onChange;
      var editor = _ref.editor;
      return yield* (function* () {
        var _this2 = this;

        var filePath = editor.getPath();

        if (onChange && !this.lintOnChange || // Lint-on-change mismatch
        !filePath || // Not saved anywhere yet
        Helpers.isPathIgnored(editor.getPath(), this.ignoreGlob, this.ignoreVCS) || // Ignored by VCS or Glob
        !this.lintPreviewTabs && atom.workspace.getActivePane().getPendingItem() === editor // Ignore Preview tabs
        ) {
            return false;
          }

        var scopes = Helpers.getEditorCursorScopes(editor);

        var promises = [];

        var _loop = function (linter) {
          if (!Helpers.shouldTriggerLinter(linter, onChange, scopes)) {
            return 'continue';
          }
          if (_this2.disabledProviders.includes(linter.name)) {
            return 'continue';
          }
          var number = ++linter[_helpers.$requestLatest];
          var statusBuffer = linter.scope === 'file' ? editor.getBuffer() : null;
          var statusFilePath = linter.scope === 'file' ? filePath : null;

          _this2.emitter.emit('did-begin-linting', { number: number, linter: linter, filePath: statusFilePath });
          promises.push(new Promise(function (resolve) {
            // $FlowIgnore: Type too complex, duh
            resolve(linter.lint(editor));
          }).then(function (messages) {
            _this2.emitter.emit('did-finish-linting', { number: number, linter: linter, filePath: statusFilePath });
            if (linter[_helpers.$requestLastReceived] >= number || !linter[_helpers.$activated] || statusBuffer && !statusBuffer.isAlive()) {
              return;
            }
            linter[_helpers.$requestLastReceived] = number;
            if (statusBuffer && !statusBuffer.isAlive()) {
              return;
            }

            if (messages === null) {
              // NOTE: Do NOT update the messages when providers return null
              return;
            }

            var validity = true;
            // NOTE: We are calling it when results are not an array to show a nice notification
            if (atom.inDevMode() || !Array.isArray(messages)) {
              validity = Validate.messages(linter.name, messages);
            }
            if (!validity) {
              return;
            }

            Helpers.normalizeMessages(linter.name, messages);
            _this2.emitter.emit('did-update-messages', { messages: messages, linter: linter, buffer: statusBuffer });
          }, function (error) {
            _this2.emitter.emit('did-finish-linting', { number: number, linter: linter, filePath: statusFilePath });

            console.error('[Linter] Error running ' + linter.name, error);
            var notificationMessage = '[Linter] Error running ' + linter.name;
            if (Array.from(_this2.activeNotifications).some(function (item) {
              return item.getOptions().detail === notificationMessage;
            })) {
              // This message is still showing to the user!
              return;
            }

            var notification = atom.notifications.addError(notificationMessage, {
              detail: 'See Console for more info.',
              dismissable: true,
              buttons: [{
                text: 'Open Console',
                onDidClick: function onDidClick() {
                  atom.openDevTools();
                  notification.dismiss();
                }
              }, {
                text: 'Cancel',
                onDidClick: function onDidClick() {
                  notification.dismiss();
                }
              }]
            });
          }));
        };

        for (var linter of this.linters) {
          var _ret = _loop(linter);

          if (_ret === 'continue') continue;
        }

        yield Promise.all(promises);
        return true;
      }).apply(this, arguments);
    })
  }, {
    key: 'onDidUpdateMessages',
    value: function onDidUpdateMessages(callback) {
      return this.emitter.on('did-update-messages', callback);
    }
  }, {
    key: 'onDidBeginLinting',
    value: function onDidBeginLinting(callback) {
      return this.emitter.on('did-begin-linting', callback);
    }
  }, {
    key: 'onDidFinishLinting',
    value: function onDidFinishLinting(callback) {
      return this.emitter.on('did-finish-linting', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.activeNotifications.forEach(function (notification) {
        return notification.dismiss();
      });
      this.activeNotifications.clear();
      this.linters.clear();
      this.subscriptions.dispose();
    }
  }]);

  return LinterRegistry;
})();

exports['default'] = LinterRegistry;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9saW50ZXItcmVnaXN0cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRzZDLE1BQU07O3VCQUcxQixXQUFXOztJQUF4QixPQUFPOzt3QkFDTyxZQUFZOztJQUExQixRQUFROztJQUlkLGNBQWM7QUFXUCxXQVhQLGNBQWMsR0FXSjs7OzBCQVhWLGNBQWM7O0FBWWhCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDeEIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTs7QUFFcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLFVBQUEsWUFBWSxFQUFJO0FBQ3pELFlBQUssWUFBWSxHQUFHLFlBQVksQ0FBQTtLQUNqQyxDQUFDLENBQ0gsQ0FBQTtBQUNELFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxVQUFBLFNBQVMsRUFBSTtBQUM5RCxZQUFLLFNBQVMsR0FBRyxTQUFTLENBQUE7S0FDM0IsQ0FBQyxDQUNILENBQUE7QUFDRCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsVUFBQSxVQUFVLEVBQUk7QUFDckQsWUFBSyxVQUFVLEdBQUcsVUFBVSxDQUFBO0tBQzdCLENBQUMsQ0FDSCxDQUFBO0FBQ0QsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FB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LGNBQWMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2xpbnRlci1yZWdpc3RyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBpbXBvcnQvbm8tZHVwbGljYXRlcyAqL1xuXG5pbXBvcnQgeyBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIHsgVGV4dEVkaXRvciwgRGlzcG9zYWJsZSwgTm90aWZpY2F0aW9uIH0gZnJvbSAnYXRvbSdcblxuaW1wb3J0ICogYXMgSGVscGVycyBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgKiBhcyBWYWxpZGF0ZSBmcm9tICcuL3ZhbGlkYXRlJ1xuaW1wb3J0IHsgJHZlcnNpb24sICRhY3RpdmF0ZWQsICRyZXF1ZXN0TGF0ZXN0LCAkcmVxdWVzdExhc3RSZWNlaXZlZCB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyIH0gZnJvbSAnLi90eXBlcydcblxuY2xhc3MgTGludGVyUmVnaXN0cnkge1xuICBlbWl0dGVyOiBFbWl0dGVyXG4gIGxpbnRlcnM6IFNldDxMaW50ZXI+XG4gIGxpbnRPbkNoYW5nZTogYm9vbGVhblxuICBpZ25vcmVWQ1M6IGJvb2xlYW5cbiAgaWdub3JlR2xvYjogc3RyaW5nXG4gIGxpbnRQcmV2aWV3VGFiczogYm9vbGVhblxuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gIGRpc2FibGVkUHJvdmlkZXJzOiBBcnJheTxzdHJpbmc+XG4gIGFjdGl2ZU5vdGlmaWNhdGlvbnM6IFNldDxOb3RpZmljYXRpb24+XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMubGludGVycyA9IG5ldyBTZXQoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmFjdGl2ZU5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXIubGludE9uQ2hhbmdlJywgbGludE9uQ2hhbmdlID0+IHtcbiAgICAgICAgdGhpcy5saW50T25DaGFuZ2UgPSBsaW50T25DaGFuZ2VcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnY29yZS5leGNsdWRlVmNzSWdub3JlZFBhdGhzJywgaWdub3JlVkNTID0+IHtcbiAgICAgICAgdGhpcy5pZ25vcmVWQ1MgPSBpZ25vcmVWQ1NcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLmlnbm9yZUdsb2InLCBpZ25vcmVHbG9iID0+IHtcbiAgICAgICAgdGhpcy5pZ25vcmVHbG9iID0gaWdub3JlR2xvYlxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXIubGludFByZXZpZXdUYWJzJywgbGludFByZXZpZXdUYWJzID0+IHtcbiAgICAgICAgdGhpcy5saW50UHJldmlld1RhYnMgPSBsaW50UHJldmlld1RhYnNcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLmRpc2FibGVkUHJvdmlkZXJzJywgZGlzYWJsZWRQcm92aWRlcnMgPT4ge1xuICAgICAgICB0aGlzLmRpc2FibGVkUHJvdmlkZXJzID0gZGlzYWJsZWRQcm92aWRlcnNcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZW1pdHRlcilcbiAgfVxuICBoYXNMaW50ZXIobGludGVyOiBMaW50ZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5saW50ZXJzLmhhcyhsaW50ZXIpXG4gIH1cbiAgYWRkTGludGVyKGxpbnRlcjogTGludGVyKSB7XG4gICAgaWYgKCFWYWxpZGF0ZS5saW50ZXIobGludGVyKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGxpbnRlclskYWN0aXZhdGVkXSA9IHRydWVcbiAgICBpZiAodHlwZW9mIGxpbnRlclskcmVxdWVzdExhdGVzdF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsaW50ZXJbJHJlcXVlc3RMYXRlc3RdID0gMFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGxpbnRlclskcmVxdWVzdExhc3RSZWNlaXZlZF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsaW50ZXJbJHJlcXVlc3RMYXN0UmVjZWl2ZWRdID0gMFxuICAgIH1cbiAgICBsaW50ZXJbJHZlcnNpb25dID0gMlxuICAgIHRoaXMubGludGVycy5hZGQobGludGVyKVxuICB9XG4gIGdldFByb3ZpZGVycygpOiBBcnJheTxMaW50ZXI+IHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmxpbnRlcnMpXG4gIH1cbiAgZGVsZXRlTGludGVyKGxpbnRlcjogTGludGVyKSB7XG4gICAgaWYgKCF0aGlzLmxpbnRlcnMuaGFzKGxpbnRlcikpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBsaW50ZXJbJGFjdGl2YXRlZF0gPSBmYWxzZVxuICAgIHRoaXMubGludGVycy5kZWxldGUobGludGVyKVxuICB9XG4gIGFzeW5jIGxpbnQoeyBvbkNoYW5nZSwgZWRpdG9yIH06IHsgb25DaGFuZ2U6IGJvb2xlYW4sIGVkaXRvcjogVGV4dEVkaXRvciB9KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG5cbiAgICBpZiAoXG4gICAgICAob25DaGFuZ2UgJiYgIXRoaXMubGludE9uQ2hhbmdlKSB8fCAvLyBMaW50LW9uLWNoYW5nZSBtaXNtYXRjaFxuICAgICAgIWZpbGVQYXRoIHx8IC8vIE5vdCBzYXZlZCBhbnl3aGVyZSB5ZXRcbiAgICAgIEhlbHBlcnMuaXNQYXRoSWdub3JlZChlZGl0b3IuZ2V0UGF0aCgpLCB0aGlzLmlnbm9yZUdsb2IsIHRoaXMuaWdub3JlVkNTKSB8fCAvLyBJZ25vcmVkIGJ5IFZDUyBvciBHbG9iXG4gICAgICAoIXRoaXMubGludFByZXZpZXdUYWJzICYmIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5nZXRQZW5kaW5nSXRlbSgpID09PSBlZGl0b3IpIC8vIElnbm9yZSBQcmV2aWV3IHRhYnNcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlcyA9IEhlbHBlcnMuZ2V0RWRpdG9yQ3Vyc29yU2NvcGVzKGVkaXRvcilcblxuICAgIGNvbnN0IHByb21pc2VzID0gW11cbiAgICBmb3IgKGNvbnN0IGxpbnRlciBvZiB0aGlzLmxpbnRlcnMpIHtcbiAgICAgIGlmICghSGVscGVycy5zaG91bGRUcmlnZ2VyTGludGVyKGxpbnRlciwgb25DaGFuZ2UsIHNjb3BlcykpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmRpc2FibGVkUHJvdmlkZXJzLmluY2x1ZGVzKGxpbnRlci5uYW1lKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgY29uc3QgbnVtYmVyID0gKytsaW50ZXJbJHJlcXVlc3RMYXRlc3RdXG4gICAgICBjb25zdCBzdGF0dXNCdWZmZXIgPSBsaW50ZXIuc2NvcGUgPT09ICdmaWxlJyA/IGVkaXRvci5nZXRCdWZmZXIoKSA6IG51bGxcbiAgICAgIGNvbnN0IHN0YXR1c0ZpbGVQYXRoID0gbGludGVyLnNjb3BlID09PSAnZmlsZScgPyBmaWxlUGF0aCA6IG51bGxcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1iZWdpbi1saW50aW5nJywgeyBudW1iZXIsIGxpbnRlciwgZmlsZVBhdGg6IHN0YXR1c0ZpbGVQYXRoIH0pXG4gICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgICAgLy8gJEZsb3dJZ25vcmU6IFR5cGUgdG9vIGNvbXBsZXgsIGR1aFxuICAgICAgICAgIHJlc29sdmUobGludGVyLmxpbnQoZWRpdG9yKSlcbiAgICAgICAgfSkudGhlbihcbiAgICAgICAgICBtZXNzYWdlcyA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWZpbmlzaC1saW50aW5nJywgeyBudW1iZXIsIGxpbnRlciwgZmlsZVBhdGg6IHN0YXR1c0ZpbGVQYXRoIH0pXG4gICAgICAgICAgICBpZiAobGludGVyWyRyZXF1ZXN0TGFzdFJlY2VpdmVkXSA+PSBudW1iZXIgfHwgIWxpbnRlclskYWN0aXZhdGVkXSB8fCAoc3RhdHVzQnVmZmVyICYmICFzdGF0dXNCdWZmZXIuaXNBbGl2ZSgpKSkge1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpbnRlclskcmVxdWVzdExhc3RSZWNlaXZlZF0gPSBudW1iZXJcbiAgICAgICAgICAgIGlmIChzdGF0dXNCdWZmZXIgJiYgIXN0YXR1c0J1ZmZlci5pc0FsaXZlKCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtZXNzYWdlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyBOT1RFOiBEbyBOT1QgdXBkYXRlIHRoZSBtZXNzYWdlcyB3aGVuIHByb3ZpZGVycyByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHZhbGlkaXR5ID0gdHJ1ZVxuICAgICAgICAgICAgLy8gTk9URTogV2UgYXJlIGNhbGxpbmcgaXQgd2hlbiByZXN1bHRzIGFyZSBub3QgYW4gYXJyYXkgdG8gc2hvdyBhIG5pY2Ugbm90aWZpY2F0aW9uXG4gICAgICAgICAgICBpZiAoYXRvbS5pbkRldk1vZGUoKSB8fCAhQXJyYXkuaXNBcnJheShtZXNzYWdlcykpIHtcbiAgICAgICAgICAgICAgdmFsaWRpdHkgPSBWYWxpZGF0ZS5tZXNzYWdlcyhsaW50ZXIubmFtZSwgbWVzc2FnZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXZhbGlkaXR5KSB7XG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBIZWxwZXJzLm5vcm1hbGl6ZU1lc3NhZ2VzKGxpbnRlci5uYW1lLCBtZXNzYWdlcylcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtdXBkYXRlLW1lc3NhZ2VzJywgeyBtZXNzYWdlcywgbGludGVyLCBidWZmZXI6IHN0YXR1c0J1ZmZlciB9KVxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3IgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1maW5pc2gtbGludGluZycsIHsgbnVtYmVyLCBsaW50ZXIsIGZpbGVQYXRoOiBzdGF0dXNGaWxlUGF0aCB9KVxuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTGludGVyXSBFcnJvciBydW5uaW5nICR7bGludGVyLm5hbWV9YCwgZXJyb3IpXG4gICAgICAgICAgICBjb25zdCBub3RpZmljYXRpb25NZXNzYWdlID0gYFtMaW50ZXJdIEVycm9yIHJ1bm5pbmcgJHtsaW50ZXIubmFtZX1gXG4gICAgICAgICAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLmFjdGl2ZU5vdGlmaWNhdGlvbnMpLnNvbWUoaXRlbSA9PiBpdGVtLmdldE9wdGlvbnMoKS5kZXRhaWwgPT09IG5vdGlmaWNhdGlvbk1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgbWVzc2FnZSBpcyBzdGlsbCBzaG93aW5nIHRvIHRoZSB1c2VyIVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG5vdGlmaWNhdGlvbk1lc3NhZ2UsIHtcbiAgICAgICAgICAgICAgZGV0YWlsOiAnU2VlIENvbnNvbGUgZm9yIG1vcmUgaW5mby4nLFxuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHRleHQ6ICdPcGVuIENvbnNvbGUnLFxuICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLm9wZW5EZXZUb29scygpXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICB0ZXh0OiAnQ2FuY2VsJyxcbiAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKVxuICAgIH1cblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgb25EaWRVcGRhdGVNZXNzYWdlcyhjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtdXBkYXRlLW1lc3NhZ2VzJywgY2FsbGJhY2spXG4gIH1cbiAgb25EaWRCZWdpbkxpbnRpbmcoY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWJlZ2luLWxpbnRpbmcnLCBjYWxsYmFjaylcbiAgfVxuICBvbkRpZEZpbmlzaExpbnRpbmcoY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWZpbmlzaC1saW50aW5nJywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmFjdGl2ZU5vdGlmaWNhdGlvbnMuZm9yRWFjaChub3RpZmljYXRpb24gPT4gbm90aWZpY2F0aW9uLmRpc21pc3MoKSlcbiAgICB0aGlzLmFjdGl2ZU5vdGlmaWNhdGlvbnMuY2xlYXIoKVxuICAgIHRoaXMubGludGVycy5jbGVhcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbnRlclJlZ2lzdHJ5XG4iXX0=