Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _disposableEvent = require('disposable-event');

var _disposableEvent2 = _interopRequireDefault(_disposableEvent);

var _sbEventKit = require('sb-event-kit');

var _helpers = require('./helpers');

// NOTE:
// We don't *need* to add the intentions:hide command
// But we're doing it anyway because it helps us keep the code clean
// And can also be used by any other package to fully control this package

// List of core commands we allow during the list, everything else closes it
var CORE_COMMANDS = new Set(['core:move-up', 'core:move-down', 'core:page-up', 'core:page-down', 'core:move-to-top', 'core:move-to-bottom']);

var Commands = (function () {
  function Commands() {
    _classCallCheck(this, Commands);

    this.active = null;
    this.emitter = new _sbEventKit.Emitter();
    this.subscriptions = new _sbEventKit.CompositeDisposable();

    this.subscriptions.add(this.emitter);
  }

  _createClass(Commands, [{
    key: 'activate',
    value: function activate() {
      var _this = this;

      this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
        'intentions:show': function intentionsShow(e) {
          if (_this.active && _this.active.type === 'list') {
            return;
          }
          _this.processListShow();

          if (!e.originalEvent || e.originalEvent.type !== 'keydown') {
            return;
          }

          setImmediate(function () {
            var matched = true;
            var subscriptions = new _sbEventKit.CompositeDisposable();

            subscriptions.add(atom.keymaps.onDidMatchBinding(function (_ref) {
              var binding = _ref.binding;

              matched = matched && CORE_COMMANDS.has(binding.command);
            }));
            subscriptions.add((0, _disposableEvent2['default'])(document.body, 'keyup', function () {
              if (matched) {
                return;
              }
              subscriptions.dispose();
              _this.subscriptions.remove(subscriptions);
              _this.processListHide();
            }));
            _this.subscriptions.add(subscriptions);
          });
        },
        'intentions:hide': function intentionsHide() {
          _this.processListHide();
        },
        'intentions:highlight': function intentionsHighlight(e) {
          if (_this.active && _this.active.type === 'highlight') {
            return;
          }
          _this.processHighlightsShow();

          if (!e.originalEvent || e.originalEvent.type !== 'keydown') {
            return;
          }
          var keyCode = e.originalEvent.keyCode;
          var subscriptions = (0, _disposableEvent2['default'])(document.body, 'keyup', function (upE) {
            if (upE.keyCode !== keyCode) {
              return;
            }
            subscriptions.dispose();
            _this.subscriptions.remove(subscriptions);
            _this.processHighlightsHide();
          });
          _this.subscriptions.add(subscriptions);
        }
      }));
      this.subscriptions.add(atom.commands.add('atom-text-editor.intentions-list:not([mini])', {
        'intentions:confirm': (0, _helpers.stoppingEvent)(function () {
          _this.processListConfirm();
        }),
        'core:move-up': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('up');
        }),
        'core:move-down': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('down');
        }),
        'core:page-up': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('page-up');
        }),
        'core:page-down': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('page-down');
        }),
        'core:move-to-top': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('move-to-top');
        }),
        'core:move-to-bottom': (0, _helpers.stoppingEvent)(function () {
          _this.processListMove('move-to-bottom');
        })
      }));
    }
  }, {
    key: 'processListShow',
    value: _asyncToGenerator(function* () {
      var _this2 = this;

      if (this.active) {
        switch (this.active.type) {
          case 'list':
            throw new Error('Already active');
          case 'highlight':
            this.processHighlightsHide();
            break;
          default:
        }
      }
      var editor = atom.workspace.getActiveTextEditor();
      var editorElement = atom.views.getView(editor);
      var subscriptions = new _sbEventKit.CompositeDisposable();

      if (!(yield this.shouldListShow(editor))) {
        return;
      }
      this.active = { type: 'list', subscriptions: subscriptions };
      subscriptions.add(new _sbEventKit.Disposable(function () {
        if (_this2.active && _this2.active.type === 'list' && _this2.active.subscriptions === subscriptions) {
          _this2.processListHide();
          _this2.active = null;
        }
        editorElement.classList.remove('intentions-list');
      }));
      subscriptions.add((0, _disposableEvent2['default'])(document.body, 'mouseup', function () {
        subscriptions.dispose();
      }));
      editorElement.classList.add('intentions-list');
    })
  }, {
    key: 'processListHide',
    value: function processListHide() {
      if (!this.active || this.active.type !== 'list') {
        return;
      }
      var subscriptions = this.active.subscriptions;
      this.active = null;
      subscriptions.dispose();
      this.emitter.emit('list-hide');
    }
  }, {
    key: 'processListMove',
    value: function processListMove(movement) {
      if (!this.active || this.active.type !== 'list') {
        return;
      }
      this.emitter.emit('list-move', movement);
    }
  }, {
    key: 'processListConfirm',
    value: function processListConfirm() {
      if (!this.active || this.active.type !== 'list') {
        return;
      }
      this.emitter.emit('list-confirm');
    }
  }, {
    key: 'processHighlightsShow',
    value: _asyncToGenerator(function* () {
      var _this3 = this;

      if (this.active) {
        switch (this.active.type) {
          case 'highlight':
            throw new Error('Already active');
          case 'list':
            this.processListHide();
            break;
          default:
        }
      }
      var editor = atom.workspace.getActiveTextEditor();
      var editorElement = atom.views.getView(editor);
      var subscriptions = new _sbEventKit.CompositeDisposable();
      var shouldProcess = yield this.shouldHighlightsShow(editor);

      if (!shouldProcess) {
        return;
      }
      this.active = { type: 'highlight', subscriptions: subscriptions };
      subscriptions.add(new _sbEventKit.Disposable(function () {
        if (_this3.active && _this3.active.type === 'highlight' && _this3.active.subscriptions === subscriptions) {
          _this3.processHighlightsHide();
        }
        editorElement.classList.remove('intentions-highlights');
      }));
      editorElement.classList.add('intentions-highlights');
    })
  }, {
    key: 'processHighlightsHide',
    value: function processHighlightsHide() {
      if (!this.active || this.active.type !== 'highlight') {
        return;
      }
      var subscriptions = this.active.subscriptions;
      this.active = null;
      subscriptions.dispose();
      this.emitter.emit('highlights-hide');
    }
  }, {
    key: 'shouldListShow',
    value: _asyncToGenerator(function* (editor) {
      var event = { show: false, editor: editor };
      yield this.emitter.emit('list-show', event);
      return event.show;
    })
  }, {
    key: 'shouldHighlightsShow',
    value: _asyncToGenerator(function* (editor) {
      var event = { show: false, editor: editor };
      yield this.emitter.emit('highlights-show', event);
      return event.show;
    })
  }, {
    key: 'onListShow',
    value: function onListShow(callback) {
      return this.emitter.on('list-show', function (event) {
        return callback(event.editor).then(function (result) {
          event.show = !!result;
        });
      });
    }
  }, {
    key: 'onListHide',
    value: function onListHide(callback) {
      return this.emitter.on('list-hide', callback);
    }
  }, {
    key: 'onListMove',
    value: function onListMove(callback) {
      return this.emitter.on('list-move', callback);
    }
  }, {
    key: 'onListConfirm',
    value: function onListConfirm(callback) {
      return this.emitter.on('list-confirm', callback);
    }
  }, {
    key: 'onHighlightsShow',
    value: function onHighlightsShow(callback) {
      return this.emitter.on('highlights-show', function (event) {
        return callback(event.editor).then(function (result) {
          event.show = !!result;
        });
      });
    }
  }, {
    key: 'onHighlightsHide',
    value: function onHighlightsHide(callback) {
      return this.emitter.on('highlights-hide', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      if (this.active) {
        this.active.subscriptions.dispose();
      }
    }
  }]);

  return Commands;
})();

exports['default'] = Commands;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvY29tbWFuZHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OytCQUU0QixrQkFBa0I7Ozs7MEJBQ1csY0FBYzs7dUJBR3pDLFdBQVc7Ozs7Ozs7O0FBU3pDLElBQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUE7O0lBRXpILFFBQVE7QUFRaEIsV0FSUSxRQUFRLEdBUWI7MEJBUkssUUFBUTs7QUFTekIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7QUFDbEIsUUFBSSxDQUFDLE9BQU8sR0FBRyx5QkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxhQUFhLEdBQUcscUNBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtHQUNyQzs7ZUFka0IsUUFBUTs7V0FlbkIsb0JBQUc7OztBQUNULFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFO0FBQ3ZFLHlCQUFpQixFQUFFLHdCQUFDLENBQUMsRUFBSztBQUN4QixjQUFJLE1BQUssTUFBTSxJQUFJLE1BQUssTUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7QUFDOUMsbUJBQU07V0FDUDtBQUNELGdCQUFLLGVBQWUsRUFBRSxDQUFBOztBQUV0QixjQUFJLENBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7QUFDMUQsbUJBQU07V0FDUDs7QUFFRCxzQkFBWSxDQUFDLFlBQU07QUFDakIsZ0JBQUksT0FBTyxHQUFHLElBQUks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LEVBQUUsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDOUM7OztXQUNZLHVCQUFDLFFBQXFCLEVBQUU7QUFDbkMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDakQ7OztXQUNlLDBCQUFDLFFBQW9ELEVBQUU7QUFDckUsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxVQUFTLEtBQUssRUFBRTtBQUN4RCxlQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ2xELGVBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtTQUN0QixDQUFDLENBQUE7T0FDSCxDQUFDLENBQUE7S0FDSDs7O1dBQ2UsMEJBQUMsUUFBcUIsRUFBRTtBQUN0QyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ3BEOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDNUIsVUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2YsWUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDcEM7S0FDRjs7O1NBL05rQixRQUFROzs7cUJBQVIsUUFBUSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL2NvbW1hbmRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IGRpc3Bvc2FibGVFdmVudCBmcm9tICdkaXNwb3NhYmxlLWV2ZW50J1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgRW1pdHRlciB9IGZyb20gJ3NiLWV2ZW50LWtpdCdcbmltcG9ydCB0eXBlIHsgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCB7IHN0b3BwaW5nRXZlbnQgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSB7IExpc3RNb3ZlbWVudCB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIE5PVEU6XG4vLyBXZSBkb24ndCAqbmVlZCogdG8gYWRkIHRoZSBpbnRlbnRpb25zOmhpZGUgY29tbWFuZFxuLy8gQnV0IHdlJ3JlIGRvaW5nIGl0IGFueXdheSBiZWNhdXNlIGl0IGhlbHBzIHVzIGtlZXAgdGhlIGNvZGUgY2xlYW5cbi8vIEFuZCBjYW4gYWxzbyBiZSB1c2VkIGJ5IGFueSBvdGhlciBwYWNrYWdlIHRvIGZ1bGx5IGNvbnRyb2wgdGhpcyBwYWNrYWdlXG5cbi8vIExpc3Qgb2YgY29yZSBjb21tYW5kcyB3ZSBhbGxvdyBkdXJpbmcgdGhlIGxpc3QsIGV2ZXJ5dGhpbmcgZWxzZSBjbG9zZXMgaXRcbmNvbnN0IENPUkVfQ09NTUFORFMgPSBuZXcgU2V0KFsnY29yZTptb3ZlLXVwJywgJ2NvcmU6bW92ZS1kb3duJywgJ2NvcmU6cGFnZS11cCcsICdjb3JlOnBhZ2UtZG93bicsICdjb3JlOm1vdmUtdG8tdG9wJywgJ2NvcmU6bW92ZS10by1ib3R0b20nXSlcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tbWFuZHMge1xuICBhY3RpdmU6ID97XG4gICAgdHlwZTogJ2xpc3QnIHwgJ2hpZ2hsaWdodCcsXG4gICAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZSxcbiAgfTtcbiAgZW1pdHRlcjogRW1pdHRlcjtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmFjdGl2ZSA9IG51bGxcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gIH1cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcjpub3QoW21pbmldKScsIHtcbiAgICAgICdpbnRlbnRpb25zOnNob3cnOiAoZSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUudHlwZSA9PT0gJ2xpc3QnKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcm9jZXNzTGlzdFNob3coKVxuXG4gICAgICAgIGlmICghZS5vcmlnaW5hbEV2ZW50IHx8IGUub3JpZ2luYWxFdmVudC50eXBlICE9PSAna2V5ZG93bicpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgbGV0IG1hdGNoZWQgPSB0cnVlXG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgICAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20ua2V5bWFwcy5vbkRpZE1hdGNoQmluZGluZyhmdW5jdGlvbih7IGJpbmRpbmcgfSkge1xuICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoZWQgJiYgQ09SRV9DT01NQU5EUy5oYXMoYmluZGluZy5jb21tYW5kKVxuICAgICAgICAgIH0pKVxuICAgICAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKGRpc3Bvc2FibGVFdmVudChkb2N1bWVudC5ib2R5LCAna2V5dXAnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbnMpXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NMaXN0SGlkZSgpXG4gICAgICAgICAgfSkpXG4gICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChzdWJzY3JpcHRpb25zKVxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgICdpbnRlbnRpb25zOmhpZGUnOiAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvY2Vzc0xpc3RIaWRlKClcbiAgICAgIH0sXG4gICAgICAnaW50ZW50aW9uczpoaWdobGlnaHQnOiAoZSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUudHlwZSA9PT0gJ2hpZ2hsaWdodCcpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb2Nlc3NIaWdobGlnaHRzU2hvdygpXG5cbiAgICAgICAgaWYgKCFlLm9yaWdpbmFsRXZlbnQgfHwgZS5vcmlnaW5hbEV2ZW50LnR5cGUgIT09ICdrZXlkb3duJykge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleUNvZGUgPSBlLm9yaWdpbmFsRXZlbnQua2V5Q29kZVxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gZGlzcG9zYWJsZUV2ZW50KGRvY3VtZW50LmJvZHksICdrZXl1cCcsIHVwRSA9PiB7XG4gICAgICAgICAgaWYgKHVwRS5rZXlDb2RlICE9PSBrZXlDb2RlKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbnMpXG4gICAgICAgICAgdGhpcy5wcm9jZXNzSGlnaGxpZ2h0c0hpZGUoKVxuICAgICAgICB9KVxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHN1YnNjcmlwdGlvbnMpXG4gICAgICB9LFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3IuaW50ZW50aW9ucy1saXN0Om5vdChbbWluaV0pJywge1xuICAgICAgJ2ludGVudGlvbnM6Y29uZmlybSc6IHN0b3BwaW5nRXZlbnQoKCkgPT4ge1xuICAgICAgICB0aGlzLnByb2Nlc3NMaXN0Q29uZmlybSgpXG4gICAgICB9KSxcbiAgICAgICdjb3JlOm1vdmUtdXAnOiBzdG9wcGluZ0V2ZW50KCgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9jZXNzTGlzdE1vdmUoJ3VwJylcbiAgICAgIH0pLFxuICAgICAgJ2NvcmU6bW92ZS1kb3duJzogc3RvcHBpbmdFdmVudCgoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvY2Vzc0xpc3RNb3ZlKCdkb3duJylcbiAgICAgIH0pLFxuICAgICAgJ2NvcmU6cGFnZS11cCc6IHN0b3BwaW5nRXZlbnQoKCkgPT4ge1xuICAgICAgICB0aGlzLnByb2Nlc3NMaXN0TW92ZSgncGFnZS11cCcpXG4gICAgICB9KSxcbiAgICAgICdjb3JlOnBhZ2UtZG93bic6IHN0b3BwaW5nRXZlbnQoKCkgPT4ge1xuICAgICAgICB0aGlzLnByb2Nlc3NMaXN0TW92ZSgncGFnZS1kb3duJylcbiAgICAgIH0pLFxuICAgICAgJ2NvcmU6bW92ZS10by10b3AnOiBzdG9wcGluZ0V2ZW50KCgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9jZXNzTGlzdE1vdmUoJ21vdmUtdG8tdG9wJylcbiAgICAgIH0pLFxuICAgICAgJ2NvcmU6bW92ZS10by1ib3R0b20nOiBzdG9wcGluZ0V2ZW50KCgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9jZXNzTGlzdE1vdmUoJ21vdmUtdG8tYm90dG9tJylcbiAgICAgIH0pLFxuICAgIH0pKVxuICB9XG4gIGFzeW5jIHByb2Nlc3NMaXN0U2hvdygpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5hY3RpdmUudHlwZSkge1xuICAgICAgICBjYXNlICdsaXN0JzpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FscmVhZHkgYWN0aXZlJylcbiAgICAgICAgY2FzZSAnaGlnaGxpZ2h0JzpcbiAgICAgICAgICB0aGlzLnByb2Nlc3NIaWdobGlnaHRzSGlkZSgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpXG4gICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIGlmICghYXdhaXQgdGhpcy5zaG91bGRMaXN0U2hvdyhlZGl0b3IpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5hY3RpdmUgPSB7IHR5cGU6ICdsaXN0Jywgc3Vic2NyaXB0aW9ucyB9XG4gICAgc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLnR5cGUgPT09ICdsaXN0JyAmJiB0aGlzLmFjdGl2ZS5zdWJzY3JpcHRpb25zID09PSBzdWJzY3JpcHRpb25zKSB7XG4gICAgICAgIHRoaXMucHJvY2Vzc0xpc3RIaWRlKClcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXG4gICAgICB9XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2ludGVudGlvbnMtbGlzdCcpXG4gICAgfSkpXG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoZGlzcG9zYWJsZUV2ZW50KGRvY3VtZW50LmJvZHksICdtb3VzZXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH0pKVxuICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaW50ZW50aW9ucy1saXN0JylcbiAgfVxuICBwcm9jZXNzTGlzdEhpZGUoKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSB8fCB0aGlzLmFjdGl2ZS50eXBlICE9PSAnbGlzdCcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gdGhpcy5hY3RpdmUuc3Vic2NyaXB0aW9uc1xuICAgIHRoaXMuYWN0aXZlID0gbnVsbFxuICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpc3QtaGlkZScpXG4gIH1cbiAgcHJvY2Vzc0xpc3RNb3ZlKG1vdmVtZW50OiBMaXN0TW92ZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlIHx8IHRoaXMuYWN0aXZlLnR5cGUgIT09ICdsaXN0Jykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdsaXN0LW1vdmUnLCBtb3ZlbWVudClcbiAgfVxuICBwcm9jZXNzTGlzdENvbmZpcm0oKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSB8fCB0aGlzLmFjdGl2ZS50eXBlICE9PSAnbGlzdCcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbGlzdC1jb25maXJtJylcbiAgfVxuICBhc3luYyBwcm9jZXNzSGlnaGxpZ2h0c1Nob3coKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuYWN0aXZlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnaGlnaGxpZ2h0JzpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FscmVhZHkgYWN0aXZlJylcbiAgICAgICAgY2FzZSAnbGlzdCc6XG4gICAgICAgICAgdGhpcy5wcm9jZXNzTGlzdEhpZGUoKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgIGNvbnN0IHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgY29uc3Qgc2hvdWxkUHJvY2VzcyA9IGF3YWl0IHRoaXMuc2hvdWxkSGlnaGxpZ2h0c1Nob3coZWRpdG9yKVxuXG4gICAgaWYgKCFzaG91bGRQcm9jZXNzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5hY3RpdmUgPSB7IHR5cGU6ICdoaWdobGlnaHQnLCBzdWJzY3JpcHRpb25zIH1cbiAgICBzdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUudHlwZSA9PT0gJ2hpZ2hsaWdodCcgJiYgdGhpcy5hY3RpdmUuc3Vic2NyaXB0aW9ucyA9PT0gc3Vic2NyaXB0aW9ucykge1xuICAgICAgICB0aGlzLnByb2Nlc3NIaWdobGlnaHRzSGlkZSgpXG4gICAgICB9XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2ludGVudGlvbnMtaGlnaGxpZ2h0cycpXG4gICAgfSkpXG4gICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpbnRlbnRpb25zLWhpZ2hsaWdodHMnKVxuICB9XG4gIHByb2Nlc3NIaWdobGlnaHRzSGlkZSgpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlIHx8IHRoaXMuYWN0aXZlLnR5cGUgIT09ICdoaWdobGlnaHQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IHRoaXMuYWN0aXZlLnN1YnNjcmlwdGlvbnNcbiAgICB0aGlzLmFjdGl2ZSA9IG51bGxcbiAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdoaWdobGlnaHRzLWhpZGUnKVxuICB9XG4gIGFzeW5jIHNob3VsZExpc3RTaG93KGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGV2ZW50ID0geyBzaG93OiBmYWxzZSwgZWRpdG9yIH1cbiAgICBhd2FpdCB0aGlzLmVtaXR0ZXIuZW1pdCgnbGlzdC1zaG93JywgZXZlbnQpXG4gICAgcmV0dXJuIGV2ZW50LnNob3dcbiAgfVxuICBhc3luYyBzaG91bGRIaWdobGlnaHRzU2hvdyhlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBldmVudCA9IHsgc2hvdzogZmFsc2UsIGVkaXRvciB9XG4gICAgYXdhaXQgdGhpcy5lbWl0dGVyLmVtaXQoJ2hpZ2hsaWdodHMtc2hvdycsIGV2ZW50KVxuICAgIHJldHVybiBldmVudC5zaG93XG4gIH1cbiAgb25MaXN0U2hvdyhjYWxsYmFjazogKChlZGl0b3I6IFRleHRFZGl0b3IpID0+IFByb21pc2U8Ym9vbGVhbj4pKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignbGlzdC1zaG93JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhldmVudC5lZGl0b3IpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGV2ZW50LnNob3cgPSAhIXJlc3VsdFxuICAgICAgfSlcbiAgICB9KVxuICB9XG4gIG9uTGlzdEhpZGUoY2FsbGJhY2s6ICgoKSA9PiBhbnkpKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignbGlzdC1oaWRlJywgY2FsbGJhY2spXG4gIH1cbiAgb25MaXN0TW92ZShjYWxsYmFjazogKChtb3ZlbWVudDogTGlzdE1vdmVtZW50KSA9PiBhbnkpKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignbGlzdC1tb3ZlJywgY2FsbGJhY2spXG4gIH1cbiAgb25MaXN0Q29uZmlybShjYWxsYmFjazogKCgpID0+IGFueSkpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdsaXN0LWNvbmZpcm0nLCBjYWxsYmFjaylcbiAgfVxuICBvbkhpZ2hsaWdodHNTaG93KGNhbGxiYWNrOiAoKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gUHJvbWlzZTxib29sZWFuPikpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdoaWdobGlnaHRzLXNob3cnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGV2ZW50LmVkaXRvcikudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgZXZlbnQuc2hvdyA9ICEhcmVzdWx0XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbiAgb25IaWdobGlnaHRzSGlkZShjYWxsYmFjazogKCgpID0+IGFueSkpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdoaWdobGlnaHRzLWhpZGUnLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuYWN0aXZlLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICB9XG59XG4iXX0=