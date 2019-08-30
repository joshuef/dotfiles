var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _atom = require('atom');

var _delegate = require('./delegate');

var _delegate2 = _interopRequireDefault(_delegate);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _messageLegacy = require('./message-legacy');

var _messageLegacy2 = _interopRequireDefault(_messageLegacy);

var _helpers = require('../helpers');

var TooltipElement = (function () {
  function TooltipElement(messages, position, textEditor) {
    var _this = this;

    _classCallCheck(this, TooltipElement);

    this.emitter = new _atom.Emitter();
    this.element = document.createElement('div');
    this.messages = messages;
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
    this.marker = textEditor.markBufferRange([position, position]);
    this.marker.onDidDestroy(function () {
      return _this.emitter.emit('did-destroy');
    });

    var delegate = new _delegate2['default']();
    this.element.id = 'linter-tooltip';
    textEditor.decorateMarker(this.marker, {
      type: 'overlay',
      item: this.element
    });
    this.subscriptions.add(delegate);

    var children = [];
    messages.forEach(function (message) {
      if (message.version === 2) {
        children.push(_react2['default'].createElement(_message2['default'], { key: message.key, delegate: delegate, message: message }));
        return;
      }
      children.push(_react2['default'].createElement(_messageLegacy2['default'], { key: message.key, delegate: delegate, message: message }));
      if (message.trace && message.trace.length) {
        children.push.apply(children, _toConsumableArray(message.trace.map(function (trace) {
          return _react2['default'].createElement(_messageLegacy2['default'], { key: message.key + ':trace:' + trace.key, delegate: delegate, message: trace });
        })));
      }
    });
    _reactDom2['default'].render(_react2['default'].createElement(
      'linter-messages',
      null,
      children
    ), this.element);
  }

  _createClass(TooltipElement, [{
    key: 'isValid',
    value: function isValid(position, messages) {
      var range = (0, _helpers.$range)(this.messages[0]);
      return !!(this.messages.length === 1 && messages.has(this.messages[0]) && range && range.containsPoint(position));
    }
  }, {
    key: 'onDidDestroy',
    value: function onDidDestroy(callback) {
      this.emitter.on('did-destroy', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-destroy');
      this.subscriptions.dispose();
    }
  }]);

  return TooltipElement;
})();

module.exports = TooltipElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7cUJBRWtCLE9BQU87Ozs7d0JBQ0osV0FBVzs7OztvQkFDYSxNQUFNOzt3QkFHOUIsWUFBWTs7Ozt1QkFDTixXQUFXOzs7OzZCQUNMLGtCQUFrQjs7Ozt1QkFDNUIsWUFBWTs7SUFHN0IsY0FBYztBQU9QLFdBUFAsY0FBYyxDQU9OLFFBQThCLEVBQUUsUUFBZSxFQUFFLFVBQXNCLEVBQUU7OzswQkFQakYsY0FBYzs7QUFRaEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM1QyxRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtBQUN4QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7QUFDOUQsUUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7YUFBTSxNQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0tBQUEsQ0FBQyxDQUFBOztBQUVoRSxRQUFNLFFBQVEsR0FBRywyQkFBYyxDQUFBO0FBQy9CLFFBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLGdCQUFnQixDQUFBO0FBQ2xDLGNBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxVQUFJLEVBQUUsU0FBUztBQUNmLFVBQUksRUFBRSxJQUFJLENBQUMsT0FBTztLQUNuQixDQUFDLENBQUE7QUFDRixRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsUUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFlBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUs7QUFDNUIsVUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUN6QixnQkFBUSxDQUFDLElBQUksQ0FBQyx5REFBZ0IsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEFBQUMsRUFBQyxRQUFRLEVBQUUsUUFBUSxBQUFDLEVBQUMsT0FBTyxFQUFFLE9BQU8sQUFBQyxHQUFHLENBQUMsQ0FBQTtBQUN6RixlQUFNO09BQ1A7QUFDRCxjQUFRLENBQUMsSUFBSSxDQUFDLCtEQUFzQixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQUFBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEFBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxBQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQy9GLFVBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUN6QyxnQkFBUSxDQUFDLElBQUksTUFBQSxDQUFiLFFBQVEscUJBQVMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxLQUFLO2lCQUN0QywrREFBc0IsR0FBRyxFQUFLLE9BQU8sQ0FBQyxHQUFHLGVBQVUsS0FBSyxDQUFDLEdBQUcsQUFBRyxFQUFDLFFBQVEsRUFBRSxRQUFRLEFBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxBQUFDLEdBQUc7U0FBQSxDQUN2RyxFQUFDLENBQUE7T0FDSDtLQUNGLENBQUMsQ0FBQTtBQUNGLDBCQUFTLE1BQU0sQ0FBQzs7O01BQWtCLFFBQVE7S0FBbUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDN0U7O2VBdkNHLGNBQWM7O1dBd0NYLGlCQUFDLFFBQWUsRUFBRSxRQUE0QixFQUFXO0FBQzlELFVBQU0sS0FBSyxHQUFHLHFCQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN0QyxhQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUEsQUFBQyxDQUFBO0tBQ2xIOzs7V0FDVyxzQkFBQyxRQUFxQixFQUFjO0FBQzlDLFVBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUN6Qzs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0FsREcsY0FBYzs7O0FBcURwQixNQUFNLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi90b29sdGlwL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSdcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlLCBQb2ludCwgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCBEZWxlZ2F0ZSBmcm9tICcuL2RlbGVnYXRlJ1xuaW1wb3J0IE1lc3NhZ2VFbGVtZW50IGZyb20gJy4vbWVzc2FnZSdcbmltcG9ydCBNZXNzYWdlRWxlbWVudExlZ2FjeSBmcm9tICcuL21lc3NhZ2UtbGVnYWN5J1xuaW1wb3J0IHsgJHJhbmdlIH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5jbGFzcyBUb29sdGlwRWxlbWVudCB7XG4gIG1hcmtlcjogT2JqZWN0O1xuICBlbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgZW1pdHRlcjogRW1pdHRlcjtcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+O1xuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPiwgcG9zaXRpb246IFBvaW50LCB0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5tZXNzYWdlcyA9IG1lc3NhZ2VzXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5tYXJrZXIgPSB0ZXh0RWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbcG9zaXRpb24sIHBvc2l0aW9uXSlcbiAgICB0aGlzLm1hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1kZXN0cm95JykpXG5cbiAgICBjb25zdCBkZWxlZ2F0ZSA9IG5ldyBEZWxlZ2F0ZSgpXG4gICAgdGhpcy5lbGVtZW50LmlkID0gJ2xpbnRlci10b29sdGlwJ1xuICAgIHRleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5tYXJrZXIsIHtcbiAgICAgIHR5cGU6ICdvdmVybGF5JyxcbiAgICAgIGl0ZW06IHRoaXMuZWxlbWVudCxcbiAgICB9KVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZGVsZWdhdGUpXG5cbiAgICBjb25zdCBjaGlsZHJlbiA9IFtdXG4gICAgbWVzc2FnZXMuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2UudmVyc2lvbiA9PT0gMikge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKDxNZXNzYWdlRWxlbWVudCBrZXk9e21lc3NhZ2Uua2V5fSBkZWxlZ2F0ZT17ZGVsZWdhdGV9IG1lc3NhZ2U9e21lc3NhZ2V9IC8+KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGNoaWxkcmVuLnB1c2goPE1lc3NhZ2VFbGVtZW50TGVnYWN5IGtleT17bWVzc2FnZS5rZXl9IGRlbGVnYXRlPXtkZWxlZ2F0ZX0gbWVzc2FnZT17bWVzc2FnZX0gLz4pXG4gICAgICBpZiAobWVzc2FnZS50cmFjZSAmJiBtZXNzYWdlLnRyYWNlLmxlbmd0aCkge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKC4uLm1lc3NhZ2UudHJhY2UubWFwKHRyYWNlID0+XG4gICAgICAgICAgPE1lc3NhZ2VFbGVtZW50TGVnYWN5IGtleT17YCR7bWVzc2FnZS5rZXl9OnRyYWNlOiR7dHJhY2Uua2V5fWB9IGRlbGVnYXRlPXtkZWxlZ2F0ZX0gbWVzc2FnZT17dHJhY2V9IC8+LFxuICAgICAgICApKVxuICAgICAgfVxuICAgIH0pXG4gICAgUmVhY3RET00ucmVuZGVyKDxsaW50ZXItbWVzc2FnZXM+e2NoaWxkcmVufTwvbGludGVyLW1lc3NhZ2VzPiwgdGhpcy5lbGVtZW50KVxuICB9XG4gIGlzVmFsaWQocG9zaXRpb246IFBvaW50LCBtZXNzYWdlczogU2V0PExpbnRlck1lc3NhZ2U+KTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmFuZ2UgPSAkcmFuZ2UodGhpcy5tZXNzYWdlc1swXSlcbiAgICByZXR1cm4gISEodGhpcy5tZXNzYWdlcy5sZW5ndGggPT09IDEgJiYgbWVzc2FnZXMuaGFzKHRoaXMubWVzc2FnZXNbMF0pICYmIHJhbmdlICYmIHJhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pKVxuICB9XG4gIG9uRGlkRGVzdHJveShjYWxsYmFjazogKCgpID0+IGFueSkpOiBEaXNwb3NhYmxlIHtcbiAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kZXN0cm95JywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWRlc3Ryb3knKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvb2x0aXBFbGVtZW50XG4iXX0=