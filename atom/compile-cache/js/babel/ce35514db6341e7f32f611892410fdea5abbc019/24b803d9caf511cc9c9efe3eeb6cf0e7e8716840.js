Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _lodashDebounce = require('lodash/debounce');

var _lodashDebounce2 = _interopRequireDefault(_lodashDebounce);

var _helpers = require('./helpers');

var MessageRegistry = (function () {
  function MessageRegistry() {
    _classCallCheck(this, MessageRegistry);

    this.emitter = new _atom.Emitter();
    this.messages = [];
    this.messagesMap = new Set();
    this.subscriptions = new _atom.CompositeDisposable();
    this.debouncedUpdate = (0, _lodashDebounce2['default'])(this.update, 100, { leading: true });

    this.subscriptions.add(this.emitter);
  }

  _createClass(MessageRegistry, [{
    key: 'set',
    value: function set(_ref) {
      var messages = _ref.messages;
      var linter = _ref.linter;
      var buffer = _ref.buffer;
      return (function () {
        var found = null;
        for (var entry of this.messagesMap) {
          if (entry.buffer === buffer && entry.linter === linter) {
            found = entry;
            break;
          }
        }

        if (found) {
          found.messages = messages;
          found.changed = true;
        } else {
          this.messagesMap.add({ messages: messages, linter: linter, buffer: buffer, oldMessages: [], changed: true, deleted: false });
        }
        this.debouncedUpdate();
      }).apply(this, arguments);
    }
  }, {
    key: 'update',
    value: function update() {
      var result = { added: [], removed: [], messages: [] };

      for (var entry of this.messagesMap) {
        if (entry.deleted) {
          result.removed = result.removed.concat(entry.oldMessages);
          this.messagesMap['delete'](entry);
          continue;
        }
        if (!entry.changed) {
          result.messages = result.messages.concat(entry.oldMessages);
          continue;
        }
        entry.changed = false;
        if (!entry.oldMessages.length) {
          // All messages are new, no need to diff
          // NOTE: No need to add .key here because normalizeMessages already does that
          result.added = result.added.concat(entry.messages);
          result.messages = result.messages.concat(entry.messages);
          entry.oldMessages = entry.messages;
          continue;
        }
        if (!entry.messages.length) {
          // All messages are old, no need to diff
          result.removed = result.removed.concat(entry.oldMessages);
          entry.oldMessages = [];
          continue;
        }

        var newKeys = new Set();
        var oldKeys = new Set();
        var _oldMessages = entry.oldMessages;

        var foundNew = false;
        entry.oldMessages = [];

        for (var i = 0, _length = _oldMessages.length; i < _length; ++i) {
          var message = _oldMessages[i];
          message.key = (0, _helpers.messageKey)(message);
          oldKeys.add(message.key);
        }

        for (var i = 0, _length2 = entry.messages.length; i < _length2; ++i) {
          var message = entry.messages[i];
          if (newKeys.has(message.key)) {
            continue;
          }
          newKeys.add(message.key);
          if (!oldKeys.has(message.key)) {
            foundNew = true;
            result.added.push(message);
            result.messages.push(message);
            entry.oldMessages.push(message);
          }
        }

        if (!foundNew && entry.messages.length === _oldMessages.length) {
          // Messages are unchanged
          result.messages = result.messages.concat(_oldMessages);
          entry.oldMessages = _oldMessages;
          continue;
        }

        for (var i = 0, _length3 = _oldMessages.length; i < _length3; ++i) {
          var message = _oldMessages[i];
          if (newKeys.has(message.key)) {
            entry.oldMessages.push(message);
            result.messages.push(message);
          } else {
            result.removed.push(message);
          }
        }
      }

      if (result.added.length || result.removed.length) {
        this.messages = result.messages;
        this.emitter.emit('did-update-messages', result);
      }
    }
  }, {
    key: 'onDidUpdateMessages',
    value: function onDidUpdateMessages(callback) {
      return this.emitter.on('did-update-messages', callback);
    }
  }, {
    key: 'deleteByBuffer',
    value: function deleteByBuffer(buffer) {
      for (var entry of this.messagesMap) {
        if (entry.buffer === buffer) {
          entry.deleted = true;
        }
      }
      this.debouncedUpdate();
    }
  }, {
    key: 'deleteByLinter',
    value: function deleteByLinter(linter) {
      for (var entry of this.messagesMap) {
        if (entry.linter === linter) {
          entry.deleted = true;
        }
      }
      this.debouncedUpdate();
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return MessageRegistry;
})();

exports['default'] = MessageRegistry;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9tZXNzYWdlLXJlZ2lzdHJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRTZDLE1BQU07OzhCQUM5QixpQkFBaUI7Ozs7dUJBRVgsV0FBVzs7SUFZaEMsZUFBZTtBQU9SLFdBUFAsZUFBZSxHQU9MOzBCQVBWLGVBQWU7O0FBUWpCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDNUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsZUFBZSxHQUFHLGlDQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7O0FBRXBFLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtHQUNyQzs7ZUFmRyxlQUFlOztXQWdCaEIsYUFBQyxJQUE4RjtVQUE1RixRQUFRLEdBQVYsSUFBOEYsQ0FBNUYsUUFBUTtVQUFFLE1BQU0sR0FBbEIsSUFBOEYsQ0FBbEYsTUFBTTtVQUFFLE1BQU0sR0FBMUIsSUFBOEYsQ0FBMUUsTUFBTTswQkFBc0U7QUFDbEcsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLGFBQUssSUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNwQyxjQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFO0FBQ3RELGlCQUFLLEdBQUcsS0FBSyxDQUFBO0FBQ2Isa0JBQUs7V0FDTjtTQUNGOztBQUVELFlBQUksS0FBSyxFQUFFO0FBQ1QsZUFBSyxDQUFD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YWdlcy9saW50ZXIvbGliL21lc3NhZ2UtcmVnaXN0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBkZWJvdW5jZSBmcm9tICdsb2Rhc2gvZGVib3VuY2UnXG5pbXBvcnQgdHlwZSB7IERpc3Bvc2FibGUsIFRleHRCdWZmZXIgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgbWVzc2FnZUtleSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTWVzc2FnZXNQYXRjaCwgTWVzc2FnZSwgTGludGVyIH0gZnJvbSAnLi90eXBlcydcblxudHlwZSBMaW50ZXIkTWVzc2FnZSRNYXAgPSB7XG4gIGJ1ZmZlcjogP1RleHRCdWZmZXIsXG4gIGxpbnRlcjogTGludGVyLFxuICBjaGFuZ2VkOiBib29sZWFuLFxuICBkZWxldGVkOiBib29sZWFuLFxuICBtZXNzYWdlczogQXJyYXk8TWVzc2FnZT4sXG4gIG9sZE1lc3NhZ2VzOiBBcnJheTxNZXNzYWdlPixcbn1cblxuY2xhc3MgTWVzc2FnZVJlZ2lzdHJ5IHtcbiAgZW1pdHRlcjogRW1pdHRlclxuICBtZXNzYWdlczogQXJyYXk8TWVzc2FnZT5cbiAgbWVzc2FnZXNNYXA6IFNldDxMaW50ZXIkTWVzc2FnZSRNYXA+XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgZGVib3VuY2VkVXBkYXRlOiAoKSA9PiB2b2lkXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMubWVzc2FnZXMgPSBbXVxuICAgIHRoaXMubWVzc2FnZXNNYXAgPSBuZXcgU2V0KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5kZWJvdW5jZWRVcGRhdGUgPSBkZWJvdW5jZSh0aGlzLnVwZGF0ZSwgMTAwLCB7IGxlYWRpbmc6IHRydWUgfSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKVxuICB9XG4gIHNldCh7IG1lc3NhZ2VzLCBsaW50ZXIsIGJ1ZmZlciB9OiB7IG1lc3NhZ2VzOiBBcnJheTxNZXNzYWdlPiwgbGludGVyOiBMaW50ZXIsIGJ1ZmZlcjogVGV4dEJ1ZmZlciB9KSB7XG4gICAgbGV0IGZvdW5kID0gbnVsbFxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5tZXNzYWdlc01hcCkge1xuICAgICAgaWYgKGVudHJ5LmJ1ZmZlciA9PT0gYnVmZmVyICYmIGVudHJ5LmxpbnRlciA9PT0gbGludGVyKSB7XG4gICAgICAgIGZvdW5kID0gZW50cnlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIGZvdW5kLm1lc3NhZ2VzID0gbWVzc2FnZXNcbiAgICAgIGZvdW5kLmNoYW5nZWQgPSB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZXNNYXAuYWRkKHsgbWVzc2FnZXMsIGxpbnRlciwgYnVmZmVyLCBvbGRNZXNzYWdlczogW10sIGNoYW5nZWQ6IHRydWUsIGRlbGV0ZWQ6IGZhbHNlIH0pXG4gICAgfVxuICAgIHRoaXMuZGVib3VuY2VkVXBkYXRlKClcbiAgfVxuICB1cGRhdGUoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0geyBhZGRlZDogW10sIHJlbW92ZWQ6IFtdLCBtZXNzYWdlczogW10gfVxuXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLm1lc3NhZ2VzTWFwKSB7XG4gICAgICBpZiAoZW50cnkuZGVsZXRlZCkge1xuICAgICAgICByZXN1bHQucmVtb3ZlZCA9IHJlc3VsdC5yZW1vdmVkLmNvbmNhdChlbnRyeS5vbGRNZXNzYWdlcylcbiAgICAgICAgdGhpcy5tZXNzYWdlc01hcC5kZWxldGUoZW50cnkpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBpZiAoIWVudHJ5LmNoYW5nZWQpIHtcbiAgICAgICAgcmVzdWx0Lm1lc3NhZ2VzID0gcmVzdWx0Lm1lc3NhZ2VzLmNvbmNhdChlbnRyeS5vbGRNZXNzYWdlcylcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGVudHJ5LmNoYW5nZWQgPSBmYWxzZVxuICAgICAgaWYgKCFlbnRyeS5vbGRNZXNzYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgLy8gQWxsIG1lc3NhZ2VzIGFyZSBuZXcsIG5vIG5lZWQgdG8gZGlmZlxuICAgICAgICAvLyBOT1RFOiBObyBuZWVkIHRvIGFkZCAua2V5IGhlcmUgYmVjYXVzZSBub3JtYWxpemVNZXNzYWdlcyBhbHJlYWR5IGRvZXMgdGhhdFxuICAgICAgICByZXN1bHQuYWRkZWQgPSByZXN1bHQuYWRkZWQuY29uY2F0KGVudHJ5Lm1lc3NhZ2VzKVxuICAgICAgICByZXN1bHQubWVzc2FnZXMgPSByZXN1bHQubWVzc2FnZXMuY29uY2F0KGVudHJ5Lm1lc3NhZ2VzKVxuICAgICAgICBlbnRyeS5vbGRNZXNzYWdlcyA9IGVudHJ5Lm1lc3NhZ2VzXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBpZiAoIWVudHJ5Lm1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgICAvLyBBbGwgbWVzc2FnZXMgYXJlIG9sZCwgbm8gbmVlZCB0byBkaWZmXG4gICAgICAgIHJlc3VsdC5yZW1vdmVkID0gcmVzdWx0LnJlbW92ZWQuY29uY2F0KGVudHJ5Lm9sZE1lc3NhZ2VzKVxuICAgICAgICBlbnRyeS5vbGRNZXNzYWdlcyA9IFtdXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0tleXMgPSBuZXcgU2V0KClcbiAgICAgIGNvbnN0IG9sZEtleXMgPSBuZXcgU2V0KClcbiAgICAgIGNvbnN0IHsgb2xkTWVzc2FnZXMgfSA9IGVudHJ5XG4gICAgICBsZXQgZm91bmROZXcgPSBmYWxzZVxuICAgICAgZW50cnkub2xkTWVzc2FnZXMgPSBbXVxuXG4gICAgICBmb3IgKGxldCBpID0gMCwgeyBsZW5ndGggfSA9IG9sZE1lc3NhZ2VzOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9sZE1lc3NhZ2VzW2ldXG4gICAgICAgIG1lc3NhZ2Uua2V5ID0gbWVzc2FnZUtleShtZXNzYWdlKVxuICAgICAgICBvbGRLZXlzLmFkZChtZXNzYWdlLmtleSlcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDAsIHsgbGVuZ3RoIH0gPSBlbnRyeS5tZXNzYWdlczsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlbnRyeS5tZXNzYWdlc1tpXVxuICAgICAgICBpZiAobmV3S2V5cy5oYXMobWVzc2FnZS5rZXkpKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICBuZXdLZXlzLmFkZChtZXNzYWdlLmtleSlcbiAgICAgICAgaWYgKCFvbGRLZXlzLmhhcyhtZXNzYWdlLmtleSkpIHtcbiAgICAgICAgICBmb3VuZE5ldyA9IHRydWVcbiAgICAgICAgICByZXN1bHQuYWRkZWQucHVzaChtZXNzYWdlKVxuICAgICAgICAgIHJlc3VsdC5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpXG4gICAgICAgICAgZW50cnkub2xkTWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmROZXcgJiYgZW50cnkubWVzc2FnZXMubGVuZ3RoID09PSBvbGRNZXNzYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgLy8gTWVzc2FnZXMgYXJlIHVuY2hhbmdlZFxuICAgICAgICByZXN1bHQubWVzc2FnZXMgPSByZXN1bHQubWVzc2FnZXMuY29uY2F0KG9sZE1lc3NhZ2VzKVxuICAgICAgICBlbnRyeS5vbGRNZXNzYWdlcyA9IG9sZE1lc3NhZ2VzXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gb2xkTWVzc2FnZXM7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gb2xkTWVzc2FnZXNbaV1cbiAgICAgICAgaWYgKG5ld0tleXMuaGFzKG1lc3NhZ2Uua2V5KSkge1xuICAgICAgICAgIGVudHJ5Lm9sZE1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICByZXN1bHQubWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdC5yZW1vdmVkLnB1c2gobWVzc2FnZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXN1bHQuYWRkZWQubGVuZ3RoIHx8IHJlc3VsdC5yZW1vdmVkLmxlbmd0aCkge1xuICAgICAgdGhpcy5tZXNzYWdlcyA9IHJlc3VsdC5tZXNzYWdlc1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC11cGRhdGUtbWVzc2FnZXMnLCByZXN1bHQpXG4gICAgfVxuICB9XG4gIG9uRGlkVXBkYXRlTWVzc2FnZXMoY2FsbGJhY2s6IChkaWZmZXJlbmNlOiBNZXNzYWdlc1BhdGNoKSA9PiB2b2lkKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXVwZGF0ZS1tZXNzYWdlcycsIGNhbGxiYWNrKVxuICB9XG4gIGRlbGV0ZUJ5QnVmZmVyKGJ1ZmZlcjogVGV4dEJ1ZmZlcikge1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5tZXNzYWdlc01hcCkge1xuICAgICAgaWYgKGVudHJ5LmJ1ZmZlciA9PT0gYnVmZmVyKSB7XG4gICAgICAgIGVudHJ5LmRlbGV0ZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZGVib3VuY2VkVXBkYXRlKClcbiAgfVxuICBkZWxldGVCeUxpbnRlcihsaW50ZXI6IExpbnRlcikge1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5tZXNzYWdlc01hcCkge1xuICAgICAgaWYgKGVudHJ5LmxpbnRlciA9PT0gbGludGVyKSB7XG4gICAgICAgIGVudHJ5LmRlbGV0ZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZGVib3VuY2VkVXBkYXRlKClcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZXNzYWdlUmVnaXN0cnlcbiJdfQ==