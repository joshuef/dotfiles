var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var NEWLINE = /\r\n|\n/;
var MESSAGE_NUMBER = 0;

var MessageElement = (function (_React$Component) {
  _inherits(MessageElement, _React$Component);

  function MessageElement() {
    _classCallCheck(this, MessageElement);

    _get(Object.getPrototypeOf(MessageElement.prototype), 'constructor', this).apply(this, arguments);

    this.state = {
      multiLineShow: false
    };
  }

  _createClass(MessageElement, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this = this;

      this.props.delegate.onShouldUpdate(function () {
        _this.setState({});
      });
      this.props.delegate.onShouldExpand(function () {
        _this.setState({ multiLineShow: true });
      });
      this.props.delegate.onShouldCollapse(function () {
        _this.setState({ multiLineShow: false });
      });
    }
  }, {
    key: 'renderSingleLine',
    value: function renderSingleLine() {
      var _props = this.props;
      var message = _props.message;
      var delegate = _props.delegate;

      var number = ++MESSAGE_NUMBER;
      var elementID = 'linter-message-' + number;
      var isElement = message.html && typeof message.html === 'object';
      if (isElement) {
        setImmediate(function () {
          var element = document.getElementById(elementID);
          if (element) {
            // $FlowIgnore: This is an HTML Element :\
            element.appendChild(message.html.cloneNode(true));
          } else {
            console.warn('[Linter] Unable to get element for mounted message', number, message);
          }
        });
      }

      return _react2['default'].createElement(
        'linter-message',
        { 'class': message.severity },
        delegate.showProviderName ? message.linterName + ': ' : '',
        _react2['default'].createElement(
          'span',
          { id: elementID, dangerouslySetInnerHTML: !isElement && message.html ? { __html: message.html } : null },
          message.text
        ),
        ' '
      );
    }
  }, {
    key: 'renderMultiLine',
    value: function renderMultiLine() {
      var _this2 = this;

      var _props2 = this.props;
      var message = _props2.message;
      var delegate = _props2.delegate;

      var text = message.text ? message.text.split(NEWLINE) : [];
      var chunks = text.map(function (entry) {
        return entry.trim();
      }).map(function (entry, index) {
        return entry.length && _react2['default'].createElement(
          'span',
          { className: index !== 0 && 'linter-line' },
          entry
        );
      }).filter(function (e) {
        return e;
      });

      return _react2['default'].createElement(
        'linter-message',
        { 'class': message.severity },
        _react2['default'].createElement(
          'a',
          { href: '#', onClick: function () {
              return _this2.setState({ multiLineShow: !_this2.state.multiLineShow });
            } },
          _react2['default'].createElement('span', { className: 'icon linter-icon icon-' + (this.state.multiLineShow ? 'chevron-down' : 'chevron-right') })
        ),
        delegate.showProviderName ? message.linterName + ': ' : '',
        chunks[0],
        ' ',
        this.state.multiLineShow && chunks.slice(1)
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return NEWLINE.test(this.props.message.text || '') ? this.renderMultiLine() : this.renderSingleLine();
    }
  }]);

  return MessageElement;
})(_react2['default'].Component);

module.exports = MessageElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvbWVzc2FnZS1sZWdhY3kuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztxQkFFa0IsT0FBTzs7OztBQUl6QixJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUE7QUFDekIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFBOztJQVdoQixjQUFjO1lBQWQsY0FBYzs7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OytCQUFkLGNBQWM7O1NBQ2xCLEtBQUssR0FBVTtBQUNiLG1CQUFhLEVBQUUsS0FBSztLQUNyQjs7O2VBSEcsY0FBYzs7V0FJRCw2QkFBRzs7O0FBQ2xCLFVBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFNO0FBQ3ZDLGNBQUssUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBO09BQ2xCLENBQUMsQ0FBQTtBQUNGLFVBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFNO0FBQ3ZDLGNBQUssUUFBUSxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7T0FDdkMsQ0FBQyxDQUFBO0FBQ0YsVUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsWUFBTTtBQUN6QyxjQUFLLFFBQVEsQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO09BQ3hDLENBQUMsQ0FBQTtLQUNIOzs7V0FFZSw0QkFBRzttQkFDYSxJQUFJLENBQUMsS0FBSztVQUFoQyxPQUFPLFVBQVAsT0FBTztVQUFFLFFBQVEsVUFBUixRQUFROztBQUV6QixVQUFNLE1BQU0sR0FBRyxFQUFFLGNBQWMsQ0FBQTtBQUMvQixVQUFNLFNBQVMsdUJBQXFCLE1BQU0sQUFBRSxDQUFBO0FBQzVDLFVBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxPQUFPLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQTtBQUNsRSxVQUFJLFNBQVMsRUFBRTtBQUNiLG9CQUFZLENBQUMsWUFBVztBQUN0QixjQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ2xELGNBQUksT0FBTyxFQUFFOztBQUVYLG1CQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7V0FDbEQsTUFBTTtBQUNMLG1CQUFPLENBQUMsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtXQUNwRjtTQUNGLENBQUMsQ0FBQTtPQUNIOztBQUVELGFBQ0U7O1VBQWdCLFNBQU8sT0FBTyxDQUFDLFFBQVEsQUFBQztRQUNyQyxRQUFRLENBQUMsZ0JBQWdCLEdBQU0sT0FBTyxDQUFDLFVBQVUsVUFBTyxFQUFFO1FBQzNEOztZQUFNLEVBQUUsRUFBRSxTQUFTLEFBQUMsRUFBQyx1QkFBdUIsRUFBRSxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEFBQUM7VUFDeEcsT0FBTyxDQUFDLElBQUk7U0FDUjtRQUFDLEdBQUc7T0FDSSxDQUNsQjtLQUNGOzs7V0FFYywyQkFBRzs7O29CQUNjLElBQUksQ0FBQyxLQUFLO1VBQWhDLE9BQU8sV0FBUCxPQUFPO1VBQUUsUUFBUSxXQUFSLFFBQVE7O0FBRXpCLFVBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQzVELFVBQU0sTUFBTSxHQUFHLElBQUksQ0FDaEIsR0FBRyxDQUFDLFVBQUEsS0FBSztlQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7T0FBQSxDQUFDLENBQzFCLEdBQUcsQ0FBQyxVQUFDLEtBQUssRUFBRSxLQUFLO2VBQUssS0FBSyxDQUFDLE1BQU0sSUFBSTs7WUFBTSxTQUFTLEVBQUUsS0FBSyxLQUFLLENBQUMsSUFBSSxhQUFhLEFBQUM7VUFBRSxLQUFLO1NBQVE7T0FBQSxDQUFDLENBQ3BHLE1BQU0sQ0FBQyxVQUFBLENBQUM7ZUFBSSxDQUFDO09BQUEsQ0FBQyxDQUFBOztBQUVqQixhQUNFOztVQUFnQixTQUFPLE9BQU8sQ0FBQyxRQUFRLEFBQUM7UUFDdEM7O1lBQUcsSUFBSSxFQUFDLEdBQUcsRUFBQyxPQUFPLEVBQUU7cUJBQU0sT0FBSyxRQUFRLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxPQUFLLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUFBLEFBQUM7VUFDckYsMkNBQU0sU0FBUyw4QkFBMkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsY0FBYyxHQUFHLGVBQWUsQ0FBQSxBQUFHLEdBQUc7U0FDekc7UUFDSCxRQUFRLENBQUMsZ0JBQWdCLEdBQU0sT0FBTyxDQUFDLFVBQVUsVUFBTyxFQUFFO1FBQzFELE1BQU0sQ0FBQyxDQUFDLENBQUM7O1FBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7T0FDekMsQ0FDbEI7S0FDRjs7O1dBRUssa0JBQUc7QUFDUCxhQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtLQUN0Rzs7O1NBbEVHLGNBQWM7R0FBUyxtQkFBTSxTQUFTOztBQXFFNUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvdG9vbHRpcC9tZXNzYWdlLWxlZ2FjeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIFRvb2x0aXBEZWxlZ2F0ZSBmcm9tICcuL2RlbGVnYXRlJ1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlTGVnYWN5IH0gZnJvbSAnLi4vdHlwZXMnXG5cbmNvbnN0IE5FV0xJTkUgPSAvXFxyXFxufFxcbi9cbmxldCBNRVNTQUdFX05VTUJFUiA9IDBcblxudHlwZSBQcm9wcyA9IHtcbiAgbWVzc2FnZTogTWVzc2FnZUxlZ2FjeSxcbiAgZGVsZWdhdGU6IFRvb2x0aXBEZWxlZ2F0ZSxcbn1cblxudHlwZSBTdGF0ZSA9IHtcbiAgbXVsdGlMaW5lU2hvdzogYm9vbGVhbixcbn1cblxuY2xhc3MgTWVzc2FnZUVsZW1lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHMsIFN0YXRlPiB7XG4gIHN0YXRlOiBTdGF0ZSA9IHtcbiAgICBtdWx0aUxpbmVTaG93OiBmYWxzZSxcbiAgfVxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLnByb3BzLmRlbGVnYXRlLm9uU2hvdWxkVXBkYXRlKCgpID0+IHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe30pXG4gICAgfSlcbiAgICB0aGlzLnByb3BzLmRlbGVnYXRlLm9uU2hvdWxkRXhwYW5kKCgpID0+IHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBtdWx0aUxpbmVTaG93OiB0cnVlIH0pXG4gICAgfSlcbiAgICB0aGlzLnByb3BzLmRlbGVnYXRlLm9uU2hvdWxkQ29sbGFwc2UoKCkgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IG11bHRpTGluZVNob3c6IGZhbHNlIH0pXG4gICAgfSlcbiAgfVxuICBwcm9wczogUHJvcHNcbiAgcmVuZGVyU2luZ2xlTGluZSgpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGRlbGVnYXRlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBudW1iZXIgPSArK01FU1NBR0VfTlVNQkVSXG4gICAgY29uc3QgZWxlbWVudElEID0gYGxpbnRlci1tZXNzYWdlLSR7bnVtYmVyfWBcbiAgICBjb25zdCBpc0VsZW1lbnQgPSBtZXNzYWdlLmh0bWwgJiYgdHlwZW9mIG1lc3NhZ2UuaHRtbCA9PT0gJ29iamVjdCdcbiAgICBpZiAoaXNFbGVtZW50KSB7XG4gICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50SUQpXG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgLy8gJEZsb3dJZ25vcmU6IFRoaXMgaXMgYW4gSFRNTCBFbGVtZW50IDpcXFxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobWVzc2FnZS5odG1sLmNsb25lTm9kZSh0cnVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1tMaW50ZXJdIFVuYWJsZSB0byBnZXQgZWxlbWVudCBmb3IgbW91bnRlZCBtZXNzYWdlJywgbnVtYmVyLCBtZXNzYWdlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8bGludGVyLW1lc3NhZ2UgY2xhc3M9e21lc3NhZ2Uuc2V2ZXJpdHl9PlxuICAgICAgICB7ZGVsZWdhdGUuc2hvd1Byb3ZpZGVyTmFtZSA/IGAke21lc3NhZ2UubGludGVyTmFtZX06IGAgOiAnJ31cbiAgICAgICAgPHNwYW4gaWQ9e2VsZW1lbnRJRH0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9eyFpc0VsZW1lbnQgJiYgbWVzc2FnZS5odG1sID8geyBfX2h0bWw6IG1lc3NhZ2UuaHRtbCB9IDogbnVsbH0+XG4gICAgICAgICAge21lc3NhZ2UudGV4dH1cbiAgICAgICAgPC9zcGFuPnsnICd9XG4gICAgICA8L2xpbnRlci1tZXNzYWdlPlxuICAgIClcbiAgfVxuXG4gIHJlbmRlck11bHRpTGluZSgpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGRlbGVnYXRlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCB0ZXh0ID0gbWVzc2FnZS50ZXh0ID8gbWVzc2FnZS50ZXh0LnNwbGl0KE5FV0xJTkUpIDogW11cbiAgICBjb25zdCBjaHVua3MgPSB0ZXh0XG4gICAgICAubWFwKGVudHJ5ID0+IGVudHJ5LnRyaW0oKSlcbiAgICAgIC5tYXAoKGVudHJ5LCBpbmRleCkgPT4gZW50cnkubGVuZ3RoICYmIDxzcGFuIGNsYXNzTmFtZT17aW5kZXggIT09IDAgJiYgJ2xpbnRlci1saW5lJ30+e2VudHJ5fTwvc3Bhbj4pXG4gICAgICAuZmlsdGVyKGUgPT4gZSlcblxuICAgIHJldHVybiAoXG4gICAgICA8bGludGVyLW1lc3NhZ2UgY2xhc3M9e21lc3NhZ2Uuc2V2ZXJpdHl9PlxuICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBtdWx0aUxpbmVTaG93OiAhdGhpcy5zdGF0ZS5tdWx0aUxpbmVTaG93IH0pfT5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BpY29uIGxpbnRlci1pY29uIGljb24tJHt0aGlzLnN0YXRlLm11bHRpTGluZVNob3cgPyAnY2hldnJvbi1kb3duJyA6ICdjaGV2cm9uLXJpZ2h0J31gfSAvPlxuICAgICAgICA8L2E+XG4gICAgICAgIHtkZWxlZ2F0ZS5zaG93UHJvdmlkZXJOYW1lID8gYCR7bWVzc2FnZS5saW50ZXJOYW1lfTogYCA6ICcnfVxuICAgICAgICB7Y2h1bmtzWzBdfSB7dGhpcy5zdGF0ZS5tdWx0aUxpbmVTaG93ICYmIGNodW5rcy5zbGljZSgxKX1cbiAgICAgIDwvbGludGVyLW1lc3NhZ2U+XG4gICAgKVxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBORVdMSU5FLnRlc3QodGhpcy5wcm9wcy5tZXNzYWdlLnRleHQgfHwgJycpID8gdGhpcy5yZW5kZXJNdWx0aUxpbmUoKSA6IHRoaXMucmVuZGVyU2luZ2xlTGluZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlRWxlbWVudFxuIl19