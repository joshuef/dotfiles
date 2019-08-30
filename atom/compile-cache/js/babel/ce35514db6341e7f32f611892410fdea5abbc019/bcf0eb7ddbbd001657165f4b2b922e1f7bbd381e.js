var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _atom = require('atom');

var _helpers = require('./helpers');

var Commands = (function () {
  function Commands() {
    var _this = this;

    _classCallCheck(this, Commands);

    this.messages = [];
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linter-ui-default:next': function linterUiDefaultNext() {
        return _this.move(true, true);
      },
      'linter-ui-default:previous': function linterUiDefaultPrevious() {
        return _this.move(false, true);
      },
      'linter-ui-default:next-error': function linterUiDefaultNextError() {
        return _this.move(true, true, 'error');
      },
      'linter-ui-default:previous-error': function linterUiDefaultPreviousError() {
        return _this.move(false, true, 'error');
      },
      'linter-ui-default:next-warning': function linterUiDefaultNextWarning() {
        return _this.move(true, true, 'warning');
      },
      'linter-ui-default:previous-warning': function linterUiDefaultPreviousWarning() {
        return _this.move(false, true, 'warning');
      },
      'linter-ui-default:next-info': function linterUiDefaultNextInfo() {
        return _this.move(true, true, 'info');
      },
      'linter-ui-default:previous-info': function linterUiDefaultPreviousInfo() {
        return _this.move(false, true, 'info');
      },

      'linter-ui-default:next-in-current-file': function linterUiDefaultNextInCurrentFile() {
        return _this.move(true, false);
      },
      'linter-ui-default:previous-in-current-file': function linterUiDefaultPreviousInCurrentFile() {
        return _this.move(false, false);
      },
      'linter-ui-default:next-error-in-current-file': function linterUiDefaultNextErrorInCurrentFile() {
        return _this.move(true, false, 'error');
      },
      'linter-ui-default:previous-error-in-current-file': function linterUiDefaultPreviousErrorInCurrentFile() {
        return _this.move(false, false, 'error');
      },
      'linter-ui-default:next-warning-in-current-file': function linterUiDefaultNextWarningInCurrentFile() {
        return _this.move(true, false, 'warning');
      },
      'linter-ui-default:previous-warning-in-current-file': function linterUiDefaultPreviousWarningInCurrentFile() {
        return _this.move(false, false, 'warning');
      },
      'linter-ui-default:next-info-in-current-file': function linterUiDefaultNextInfoInCurrentFile() {
        return _this.move(true, false, 'info');
      },
      'linter-ui-default:previous-info-in-current-file': function linterUiDefaultPreviousInfoInCurrentFile() {
        return _this.move(false, false, 'info');
      },

      'linter-ui-default:toggle-panel': function linterUiDefaultTogglePanel() {
        return _this.togglePanel();
      },

      // NOTE: Add no-ops here so they are recognized by commands registry
      // Real commands are registered when tooltip is shown inside tooltip's delegate
      'linter-ui-default:expand-tooltip': function linterUiDefaultExpandTooltip() {},
      'linter-ui-default:collapse-tooltip': function linterUiDefaultCollapseTooltip() {}
    }));
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:apply-all-solutions': function linterUiDefaultApplyAllSolutions() {
        return _this.applyAllSolutions();
      }
    }));
    this.subscriptions.add(atom.commands.add('#linter-panel', {
      'core:copy': function coreCopy() {
        var selection = document.getSelection();
        if (selection) {
          atom.clipboard.write(selection.toString());
        }
      }
    }));
  }

  _createClass(Commands, [{
    key: 'togglePanel',
    value: function togglePanel() {
      atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'));
    }

    // NOTE: Apply solutions from bottom to top, so they don't invalidate each other
  }, {
    key: 'applyAllSolutions',
    value: function applyAllSolutions() {
      var textEditor = (0, _helpers.getActiveTextEditor)();
      (0, _assert2['default'])(textEditor, 'textEditor was null on a command supposed to run on text-editors only');
      var messages = (0, _helpers.sortMessages)([{ column: 'line', type: 'desc' }], (0, _helpers.filterMessages)(this.messages, textEditor.getPath()));
      messages.forEach(function (message) {
        if (message.version === 1 && message.fix) {
          (0, _helpers.applySolution)(textEditor, 1, message.fix);
        } else if (message.version === 2 && message.solutions && message.solutions.length) {
          (0, _helpers.applySolution)(textEditor, 2, (0, _helpers.sortSolutions)(message.solutions)[0]);
        }
      });
    }
  }, {
    key: 'move',
    value: function move(forward, globally) {
      var severity = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      var currentEditor = (0, _helpers.getActiveTextEditor)();
      var currentFile = currentEditor && currentEditor.getPath() || NaN;
      // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages
      var messages = (0, _helpers.sortMessages)([{ column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }], (0, _helpers.filterMessages)(this.messages, globally ? null : currentFile, severity));
      var expectedValue = forward ? -1 : 1;

      if (!currentEditor) {
        var message = forward ? messages[0] : messages[messages.length - 1];
        if (message) {
          (0, _helpers.visitMessage)(message);
        }
        return;
      }
      var currentPosition = currentEditor.getCursorBufferPosition();

      // NOTE: Iterate bottom to top to find the previous message
      // Because if we search top to bottom when sorted, first item will always
      // be the smallest
      if (!forward) {
        messages.reverse();
      }

      var found = undefined;
      var currentFileEncountered = false;
      for (var i = 0, _length = messages.length; i < _length; i++) {
        var message = messages[i];
        var messageFile = (0, _helpers.$file)(message);
        var messageRange = (0, _helpers.$range)(message);

        if (!currentFileEncountered && messageFile === currentFile) {
          currentFileEncountered = true;
        }
        if (messageFile && messageRange) {
          if (currentFileEncountered && messageFile !== currentFile) {
            found = message;
            break;
          } else if (messageFile === currentFile && currentPosition.compare(messageRange.start) === expectedValue) {
            found = message;
            break;
          }
        }
      }

      if (!found && messages.length) {
        // Reset back to first or last depending on direction
        found = messages[0];
      }

      if (found) {
        (0, _helpers.visitMessage)(found);
      }
    }
  }, {
    key: 'update',
    value: function update(messages) {
      this.messages = messages;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return Commands;
})();

module.exports = Commands;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2NvbW1hbmRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztzQkFFc0IsUUFBUTs7OztvQkFDTSxNQUFNOzt1QkFXbkMsV0FBVzs7SUFHWixRQUFRO0FBSUQsV0FKUCxRQUFRLEdBSUU7OzswQkFKVixRQUFROztBQUtWLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtBQUNsQyw4QkFBd0IsRUFBRTtlQUFNLE1BQUssSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7T0FBQTtBQUNyRCxrQ0FBNEIsRUFBRTtlQUFNLE1BQUssSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUM7T0FBQTtBQUMxRCxvQ0FBOEIsRUFBRTtlQUFNLE1BQUssSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO09BQUE7QUFDcEUsd0NBQWtDLEVBQUU7ZUFBTSxNQUFLLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQztPQUFBO0FBQ3pFLHNDQUFnQyxFQUFFO2VBQU0sTUFBSyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUM7T0FBQTtBQUN4RSwwQ0FBb0MsRUFBRTtlQUFNLE1BQUssSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDO09BQUE7QUFDN0UsbUNBQTZCLEVBQUU7ZUFBTSxNQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQztPQUFBO0FBQ2xFLHVDQUFpQyxFQUFFO2VBQU0sTUFBSyxJQUFJLENBQUMsS0FBSyxFQUFF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Y2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9jb21tYW5kcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0J1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCB7XG4gICRmaWxlLFxuICAkcmFuZ2UsXG4gIGdldEFjdGl2ZVRleHRFZGl0b3IsXG4gIHZpc2l0TWVzc2FnZSxcbiAgc29ydE1lc3NhZ2VzLFxuICBzb3J0U29sdXRpb25zLFxuICBmaWx0ZXJNZXNzYWdlcyxcbiAgYXBwbHlTb2x1dGlvbixcbn0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXJNZXNzYWdlIH0gZnJvbSAnLi90eXBlcydcblxuY2xhc3MgQ29tbWFuZHMge1xuICBtZXNzYWdlczogQXJyYXk8TGludGVyTWVzc2FnZT5cbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubWVzc2FnZXMgPSBbXVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDpuZXh0JzogKCkgPT4gdGhpcy5tb3ZlKHRydWUsIHRydWUpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6cHJldmlvdXMnOiAoKSA9PiB0aGlzLm1vdmUoZmFsc2UsIHRydWUpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6bmV4dC1lcnJvcic6ICgpID0+IHRoaXMubW92ZSh0cnVlLCB0cnVlLCAnZXJyb3InKSxcbiAgICAgICAgJ2xpbnRlci11aS1kZWZhdWx0OnByZXZpb3VzLWVycm9yJzogKCkgPT4gdGhpcy5tb3ZlKGZhbHNlLCB0cnVlLCAnZXJyb3InKSxcbiAgICAgICAgJ2xpbnRlci11aS1kZWZhdWx0Om5leHQtd2FybmluZyc6ICgpID0+IHRoaXMubW92ZSh0cnVlLCB0cnVlLCAnd2FybmluZycpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6cHJldmlvdXMtd2FybmluZyc6ICgpID0+IHRoaXMubW92ZShmYWxzZSwgdHJ1ZSwgJ3dhcm5pbmcnKSxcbiAgICAgICAgJ2xpbnRlci11aS1kZWZhdWx0Om5leHQtaW5mbyc6ICgpID0+IHRoaXMubW92ZSh0cnVlLCB0cnVlLCAnaW5mbycpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6cHJldmlvdXMtaW5mbyc6ICgpID0+IHRoaXMubW92ZShmYWxzZSwgdHJ1ZSwgJ2luZm8nKSxcblxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6bmV4dC1pbi1jdXJyZW50LWZpbGUnOiAoKSA9PiB0aGlzLm1vdmUodHJ1ZSwgZmFsc2UpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6cHJldmlvdXMtaW4tY3VycmVudC1maWxlJzogKCkgPT4gdGhpcy5tb3ZlKGZhbHNlLCBmYWxzZSksXG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDpuZXh0LWVycm9yLWluLWN1cnJlbnQtZmlsZSc6ICgpID0+IHRoaXMubW92ZSh0cnVlLCBmYWxzZSwgJ2Vycm9yJyksXG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDpwcmV2aW91cy1lcnJvci1pbi1jdXJyZW50LWZpbGUnOiAoKSA9PiB0aGlzLm1vdmUoZmFsc2UsIGZhbHNlLCAnZXJyb3InKSxcbiAgICAgICAgJ2xpbnRlci11aS1kZWZhdWx0Om5leHQtd2FybmluZy1pbi1jdXJyZW50LWZpbGUnOiAoKSA9PiB0aGlzLm1vdmUodHJ1ZSwgZmFsc2UsICd3YXJuaW5nJyksXG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDpwcmV2aW91cy13YXJuaW5nLWluLWN1cnJlbnQtZmlsZSc6ICgpID0+IHRoaXMubW92ZShmYWxzZSwgZmFsc2UsICd3YXJuaW5nJyksXG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDpuZXh0LWluZm8taW4tY3VycmVudC1maWxlJzogKCkgPT4gdGhpcy5tb3ZlKHRydWUsIGZhbHNlLCAnaW5mbycpLFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6cHJldmlvdXMtaW5mby1pbi1jdXJyZW50LWZpbGUnOiAoKSA9PiB0aGlzLm1vdmUoZmFsc2UsIGZhbHNlLCAnaW5mbycpLFxuXG4gICAgICAgICdsaW50ZXItdWktZGVmYXVsdDp0b2dnbGUtcGFuZWwnOiAoKSA9PiB0aGlzLnRvZ2dsZVBhbmVsKCksXG5cbiAgICAgICAgLy8gTk9URTogQWRkIG5vLW9wcyBoZXJlIHNvIHRoZXkgYXJlIHJlY29nbml6ZWQgYnkgY29tbWFuZHMgcmVnaXN0cnlcbiAgICAgICAgLy8gUmVhbCBjb21tYW5kcyBhcmUgcmVnaXN0ZXJlZCB3aGVuIHRvb2x0aXAgaXMgc2hvd24gaW5zaWRlIHRvb2x0aXAncyBkZWxlZ2F0ZVxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6ZXhwYW5kLXRvb2x0aXAnOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6Y29sbGFwc2UtdG9vbHRpcCc6IGZ1bmN0aW9uKCkge30sXG4gICAgICB9KSxcbiAgICApXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pJywge1xuICAgICAgICAnbGludGVyLXVpLWRlZmF1bHQ6YXBwbHktYWxsLXNvbHV0aW9ucyc6ICgpID0+IHRoaXMuYXBwbHlBbGxTb2x1dGlvbnMoKSxcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJyNsaW50ZXItcGFuZWwnLCB7XG4gICAgICAgICdjb3JlOmNvcHknOiAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKClcbiAgICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBhdG9tLmNsaXBib2FyZC53cml0ZShzZWxlY3Rpb24udG9TdHJpbmcoKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApXG4gIH1cbiAgdG9nZ2xlUGFuZWwoKTogdm9pZCB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItdWktZGVmYXVsdC5zaG93UGFuZWwnLCAhYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdWktZGVmYXVsdC5zaG93UGFuZWwnKSlcbiAgfVxuICAvLyBOT1RFOiBBcHBseSBzb2x1dGlvbnMgZnJvbSBib3R0b20gdG8gdG9wLCBzbyB0aGV5IGRvbid0IGludmFsaWRhdGUgZWFjaCBvdGhlclxuICBhcHBseUFsbFNvbHV0aW9ucygpOiB2b2lkIHtcbiAgICBjb25zdCB0ZXh0RWRpdG9yID0gZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaW52YXJpYW50KHRleHRFZGl0b3IsICd0ZXh0RWRpdG9yIHdhcyBudWxsIG9uIGEgY29tbWFuZCBzdXBwb3NlZCB0byBydW4gb24gdGV4dC1lZGl0b3JzIG9ubHknKVxuICAgIGNvbnN0IG1lc3NhZ2VzID0gc29ydE1lc3NhZ2VzKFt7IGNvbHVtbjogJ2xpbmUnLCB0eXBlOiAnZGVzYycgfV0sIGZpbHRlck1lc3NhZ2VzKHRoaXMubWVzc2FnZXMsIHRleHRFZGl0b3IuZ2V0UGF0aCgpKSlcbiAgICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIGlmIChtZXNzYWdlLnZlcnNpb24gPT09IDEgJiYgbWVzc2FnZS5maXgpIHtcbiAgICAgICAgYXBwbHlTb2x1dGlvbih0ZXh0RWRpdG9yLCAxLCBtZXNzYWdlLmZpeClcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS52ZXJzaW9uID09PSAyICYmIG1lc3NhZ2Uuc29sdXRpb25zICYmIG1lc3NhZ2Uuc29sdXRpb25zLmxlbmd0aCkge1xuICAgICAgICBhcHBseVNvbHV0aW9uKHRleHRFZGl0b3IsIDIsIHNvcnRTb2x1dGlvbnMobWVzc2FnZS5zb2x1dGlvbnMpWzBdKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgbW92ZShmb3J3YXJkOiBib29sZWFuLCBnbG9iYWxseTogYm9vbGVhbiwgc2V2ZXJpdHk6ID9zdHJpbmcgPSBudWxsKTogdm9pZCB7XG4gICAgY29uc3QgY3VycmVudEVkaXRvciA9IGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGNvbnN0IGN1cnJlbnRGaWxlOiBhbnkgPSAoY3VycmVudEVkaXRvciAmJiBjdXJyZW50RWRpdG9yLmdldFBhdGgoKSkgfHwgTmFOXG4gICAgLy8gTk9URTogXiBTZXR0aW5nIGRlZmF1bHQgdG8gTmFOIHNvIGl0IHdvbid0IG1hdGNoIGVtcHR5IGZpbGUgcGF0aHMgaW4gbWVzc2FnZXNcbiAgICBjb25zdCBtZXNzYWdlcyA9IHNvcnRNZXNzYWdlcyhcbiAgICAgIFt7IGNvbHVtbjogJ2ZpbGUnLCB0eXBlOiAnYXNjJyB9LCB7IGNvbHVtbjogJ2xpbmUnLCB0eXBlOiAnYXNjJyB9XSxcbiAgICAgIGZpbHRlck1lc3NhZ2VzKHRoaXMubWVzc2FnZXMsIGdsb2JhbGx5ID8gbnVsbCA6IGN1cnJlbnRGaWxlLCBzZXZlcml0eSksXG4gICAgKVxuICAgIGNvbnN0IGV4cGVjdGVkVmFsdWUgPSBmb3J3YXJkID8gLTEgOiAxXG5cbiAgICBpZiAoIWN1cnJlbnRFZGl0b3IpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBmb3J3YXJkID8gbWVzc2FnZXNbMF0gOiBtZXNzYWdlc1ttZXNzYWdlcy5sZW5ndGggLSAxXVxuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgdmlzaXRNZXNzYWdlKG1lc3NhZ2UpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gY3VycmVudEVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAvLyBOT1RFOiBJdGVyYXRlIGJvdHRvbSB0byB0b3AgdG8gZmluZCB0aGUgcHJldmlvdXMgbWVzc2FnZVxuICAgIC8vIEJlY2F1c2UgaWYgd2Ugc2VhcmNoIHRvcCB0byBib3R0b20gd2hlbiBzb3J0ZWQsIGZpcnN0IGl0ZW0gd2lsbCBhbHdheXNcbiAgICAvLyBiZSB0aGUgc21hbGxlc3RcbiAgICBpZiAoIWZvcndhcmQpIHtcbiAgICAgIG1lc3NhZ2VzLnJldmVyc2UoKVxuICAgIH1cblxuICAgIGxldCBmb3VuZFxuICAgIGxldCBjdXJyZW50RmlsZUVuY291bnRlcmVkID0gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuZ3RoID0gbWVzc2FnZXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBtZXNzYWdlc1tpXVxuICAgICAgY29uc3QgbWVzc2FnZUZpbGUgPSAkZmlsZShtZXNzYWdlKVxuICAgICAgY29uc3QgbWVzc2FnZVJhbmdlID0gJHJhbmdlKG1lc3NhZ2UpXG5cbiAgICAgIGlmICghY3VycmVudEZpbGVFbmNvdW50ZXJlZCAmJiBtZXNzYWdlRmlsZSA9PT0gY3VycmVudEZpbGUpIHtcbiAgICAgICAgY3VycmVudEZpbGVFbmNvdW50ZXJlZCA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChtZXNzYWdlRmlsZSAmJiBtZXNzYWdlUmFuZ2UpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRGaWxlRW5jb3VudGVyZWQgJiYgbWVzc2FnZUZpbGUgIT09IGN1cnJlbnRGaWxlKSB7XG4gICAgICAgICAgZm91bmQgPSBtZXNzYWdlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlRmlsZSA9PT0gY3VycmVudEZpbGUgJiYgY3VycmVudFBvc2l0aW9uLmNvbXBhcmUobWVzc2FnZVJhbmdlLnN0YXJ0KSA9PT0gZXhwZWN0ZWRWYWx1ZSkge1xuICAgICAgICAgIGZvdW5kID0gbWVzc2FnZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWZvdW5kICYmIG1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgLy8gUmVzZXQgYmFjayB0byBmaXJzdCBvciBsYXN0IGRlcGVuZGluZyBvbiBkaXJlY3Rpb25cbiAgICAgIGZvdW5kID0gbWVzc2FnZXNbMF1cbiAgICB9XG5cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIHZpc2l0TWVzc2FnZShmb3VuZClcbiAgICB9XG4gIH1cbiAgdXBkYXRlKG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPikge1xuICAgIHRoaXMubWVzc2FnZXMgPSBtZXNzYWdlc1xuICB9XG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZHNcbiJdfQ==