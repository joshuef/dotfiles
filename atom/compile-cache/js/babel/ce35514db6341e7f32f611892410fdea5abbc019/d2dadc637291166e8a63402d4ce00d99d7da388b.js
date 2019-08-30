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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7cUJBRWtCLE9BQU87Ozs7d0JBQ0osV0FBVzs7OztvQkFDYSxNQUFNOzt3QkFHOUIsWUFBWTs7Ozt1QkFDTixXQUFXOzs7OzZCQUNMLGtCQUFrQjs7Ozt1QkFDNUIsWUFBWTs7SUFHN0IsY0FBYztBQU9QLFdBUFAsY0FBYyxDQU9OLFFBQThCLEVBQUUsUUFBZSxFQUFFLFVBQXNCLEVBQUU7OzswQkFQakYsY0FBYzs7QUFRaEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM1QyxRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtBQUN4QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7QUFDOUQsUUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7YUFBTSxNQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0tBQUEsQ0FBQyxDQUFBOztBQUVoRSxRQUFNLFFBQVEsR0FBRywyQkFBYyxDQUFBO0FBQy9CLFFBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLGdCQUFnQixDQUFBO0FBQ2xDLGNBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxVQUFJLEVBQUUsU0FBUztBQUNmLFVBQUksRUFBRSxJQUFJLENBQUMsT0FBTztLQUNuQixDQUFDLENBQUE7QUFDRixRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsUUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFlBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQSxPQUFPLEVBQUk7QUFDMUIsVUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUN6QixnQkFBUSxDQUFDLElBQUksQ0FBQyx5REFBZ0IsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEFBQUMsRUFBQyxRQUFRLEVBQUUsUUFBUSxBQUFDLEVBQUMsT0FBTyxFQUFFLE9BQU8sQUFBQyxHQUFHLENBQUMsQ0FBQTtBQUN6RixlQUFNO09BQ1A7QUFDRCxjQUFRLENBQUMsSUFBSSxDQUFDLCtEQUFzQixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQUFBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEFBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxBQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQy9GLFVBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUN6QyxnQkFBUSxDQUFDLElBQUksTUFBQSxDQUFiLFFBQVEscUJBQ0gsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxLQUFLO2lCQUN4QiwrREFBc0IsR0FBRyxFQUFLLE9BQU8sQ0FBQyxHQUFHLGVBQVUsS0FBSyxDQUFDLEdBQUcsQUFBRyxFQUFDLFFBQVEsRUFBRSxRQUFRLEFBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxBQUFDLEdBQUc7U0FDdkcsQ0FBQyxFQUNILENBQUE7T0FDRjtLQUNGLENBQUMsQ0FBQTtBQUNGLDBCQUFTLE1BQU0sQ0FBQzs7O01BQWtCLFFBQVE7S0FBbUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDN0U7O2VBekNHLGNBQWM7O1dBMENYLGlCQUFDLFFBQWUsRUFBRSxRQUE0QixFQUFXO0FBQzlELFVBQU0sS0FBSyxHQUFHLHFCQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN0QyxhQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUEsQUFBQyxDQUFBO0tBQ2xIOzs7V0FDVyxzQkFBQyxRQUFtQixFQUFjO0FBQzVDLFVBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUN6Qzs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0FwREcsY0FBYzs7O0FBdURwQixNQUFNLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi90b29sdGlwL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSdcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlLCBQb2ludCwgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCBEZWxlZ2F0ZSBmcm9tICcuL2RlbGVnYXRlJ1xuaW1wb3J0IE1lc3NhZ2VFbGVtZW50IGZyb20gJy4vbWVzc2FnZSdcbmltcG9ydCBNZXNzYWdlRWxlbWVudExlZ2FjeSBmcm9tICcuL21lc3NhZ2UtbGVnYWN5J1xuaW1wb3J0IHsgJHJhbmdlIH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5jbGFzcyBUb29sdGlwRWxlbWVudCB7XG4gIG1hcmtlcjogT2JqZWN0XG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gIGVtaXR0ZXI6IEVtaXR0ZXJcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICBjb25zdHJ1Y3RvcihtZXNzYWdlczogQXJyYXk8TGludGVyTWVzc2FnZT4sIHBvc2l0aW9uOiBQb2ludCwgdGV4dEVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMubWVzc2FnZXMgPSBtZXNzYWdlc1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKVxuICAgIHRoaXMubWFya2VyID0gdGV4dEVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW3Bvc2l0aW9uLCBwb3NpdGlvbl0pXG4gICAgdGhpcy5tYXJrZXIub25EaWREZXN0cm95KCgpID0+IHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpKVxuXG4gICAgY29uc3QgZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoKVxuICAgIHRoaXMuZWxlbWVudC5pZCA9ICdsaW50ZXItdG9vbHRpcCdcbiAgICB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7XG4gICAgICB0eXBlOiAnb3ZlcmxheScsXG4gICAgICBpdGVtOiB0aGlzLmVsZW1lbnQsXG4gICAgfSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGRlbGVnYXRlKVxuXG4gICAgY29uc3QgY2hpbGRyZW4gPSBbXVxuICAgIG1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG4gICAgICBpZiAobWVzc2FnZS52ZXJzaW9uID09PSAyKSB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2goPE1lc3NhZ2VFbGVtZW50IGtleT17bWVzc2FnZS5rZXl9IGRlbGVnYXRlPXtkZWxlZ2F0ZX0gbWVzc2FnZT17bWVzc2FnZX0gLz4pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY2hpbGRyZW4ucHVzaCg8TWVzc2FnZUVsZW1lbnRMZWdhY3kga2V5PXttZXNzYWdlLmtleX0gZGVsZWdhdGU9e2RlbGVnYXRlfSBtZXNzYWdlPXttZXNzYWdlfSAvPilcbiAgICAgIGlmIChtZXNzYWdlLnRyYWNlICYmIG1lc3NhZ2UudHJhY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgLi4ubWVzc2FnZS50cmFjZS5tYXAodHJhY2UgPT4gKFxuICAgICAgICAgICAgPE1lc3NhZ2VFbGVtZW50TGVnYWN5IGtleT17YCR7bWVzc2FnZS5rZXl9OnRyYWNlOiR7dHJhY2Uua2V5fWB9IGRlbGVnYXRlPXtkZWxlZ2F0ZX0gbWVzc2FnZT17dHJhY2V9IC8+XG4gICAgICAgICAgKSksXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9KVxuICAgIFJlYWN0RE9NLnJlbmRlcig8bGludGVyLW1lc3NhZ2VzPntjaGlsZHJlbn08L2xpbnRlci1tZXNzYWdlcz4sIHRoaXMuZWxlbWVudClcbiAgfVxuICBpc1ZhbGlkKHBvc2l0aW9uOiBQb2ludCwgbWVzc2FnZXM6IFNldDxMaW50ZXJNZXNzYWdlPik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJhbmdlID0gJHJhbmdlKHRoaXMubWVzc2FnZXNbMF0pXG4gICAgcmV0dXJuICEhKHRoaXMubWVzc2FnZXMubGVuZ3RoID09PSAxICYmIG1lc3NhZ2VzLmhhcyh0aGlzLm1lc3NhZ2VzWzBdKSAmJiByYW5nZSAmJiByYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSlcbiAgfVxuICBvbkRpZERlc3Ryb3koY2FsbGJhY2s6ICgpID0+IGFueSk6IERpc3Bvc2FibGUge1xuICAgIHRoaXMuZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVG9vbHRpcEVsZW1lbnRcbiJdfQ==