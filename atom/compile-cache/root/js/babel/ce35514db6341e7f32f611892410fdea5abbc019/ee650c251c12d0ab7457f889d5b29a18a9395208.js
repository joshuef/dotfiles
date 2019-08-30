var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _url = require('url');

var url = _interopRequireWildcard(_url);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _helpers = require('../helpers');

function findHref(el) {
  while (el && !el.classList.contains('linter-line')) {
    if (el instanceof HTMLAnchorElement) {
      return el.href;
    }
    el = el.parentElement;
  }
  return null;
}

var MessageElement = (function (_React$Component) {
  _inherits(MessageElement, _React$Component);

  function MessageElement() {
    _classCallCheck(this, MessageElement);

    _get(Object.getPrototypeOf(MessageElement.prototype), 'constructor', this).apply(this, arguments);

    this.state = {
      description: '',
      descriptionShow: false
    };
    this.descriptionLoading = false;

    this.openFile = function (ev) {
      if (!(ev.target instanceof HTMLElement)) {
        return;
      }
      var href = findHref(ev.target);
      if (!href) {
        return;
      }
      // parse the link. e.g. atom://linter?file=<path>&row=<number>&column=<number>

      var _url$parse = url.parse(href, true);

      var protocol = _url$parse.protocol;
      var hostname = _url$parse.hostname;
      var query = _url$parse.query;

      var file = query && query.file;
      if (protocol !== 'atom:' || hostname !== 'linter' || !file) {
        return;
      }
      var row = query && query.row ? parseInt(query.row, 10) : 0;
      var column = query && query.column ? parseInt(query.column, 10) : 0;
      (0, _helpers.openFile)(file, { row: row, column: column });
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
        if (!_this.state.descriptionShow) {
          _this.toggleDescription();
        }
      });
      this.props.delegate.onShouldCollapse(function () {
        if (_this.state.descriptionShow) {
          _this.toggleDescription();
        }
      });
    }
  }, {
    key: 'toggleDescription',
    value: function toggleDescription() {
      var _this2 = this;

      var result = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      var newStatus = !this.state.descriptionShow;
      var description = this.state.description || this.props.message.description;

      if (!newStatus && !result) {
        this.setState({ descriptionShow: false });
        return;
      }
      if (typeof description === 'string' || result) {
        var descriptionToUse = (0, _marked2['default'])(result || description);
        this.setState({ descriptionShow: true, description: descriptionToUse });
      } else if (typeof description === 'function') {
        this.setState({ descriptionShow: true });
        if (this.descriptionLoading) {
          return;
        }
        this.descriptionLoading = true;
        new Promise(function (resolve) {
          resolve(description());
        }).then(function (response) {
          if (typeof response !== 'string') {
            throw new Error('Expected result to be string, got: ' + typeof response);
          }
          _this2.toggleDescription(response);
        })['catch'](function (error) {
          console.log('[Linter] Error getting descriptions', error);
          _this2.descriptionLoading = false;
          if (_this2.state.descriptionShow) {
            _this2.toggleDescription();
          }
        });
      } else {
        console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var _props = this.props;
      var message = _props.message;
      var delegate = _props.delegate;

      return _react2['default'].createElement(
        'linter-message',
        { 'class': message.severity, onClick: this.openFile },
        message.description && _react2['default'].createElement(
          'a',
          { href: '#', onClick: function () {
              return _this3.toggleDescription();
            } },
          _react2['default'].createElement('span', { className: 'icon linter-icon icon-' + (this.state.descriptionShow ? 'chevron-down' : 'chevron-right') })
        ),
        _react2['default'].createElement(
          'linter-excerpt',
          null,
          delegate.showProviderName ? message.linterName + ': ' : '',
          message.excerpt
        ),
        ' ',
        message.reference && message.reference.file && _react2['default'].createElement(
          'a',
          { href: '#', onClick: function () {
              return (0, _helpers.visitMessage)(message, true);
            } },
          _react2['default'].createElement('span', { className: 'icon linter-icon icon-alignment-aligned-to' })
        ),
        message.url && _react2['default'].createElement(
          'a',
          { href: '#', onClick: function () {
              return (0, _helpers.openExternally)(message);
            } },
          _react2['default'].createElement('span', { className: 'icon linter-icon icon-link' })
        ),
        this.state.descriptionShow && _react2['default'].createElement('div', { dangerouslySetInnerHTML: { __html: this.state.description || 'Loading...' }, className: 'linter-line' })
      );
    }
  }]);

  return MessageElement;
})(_react2['default'].Component);

module.exports = MessageElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvbWVzc2FnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7bUJBRXFCLEtBQUs7O0lBQWQsR0FBRzs7cUJBQ0csT0FBTzs7OztzQkFDTixRQUFROzs7O3VCQUU0QixZQUFZOztBQUluRSxTQUFTLFFBQVEsQ0FBQyxFQUFZLEVBQVc7QUFDdkMsU0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtBQUNsRCxRQUFJLEVBQUUsWUFBWSxpQkFBaUIsRUFBRTtBQUNuQyxhQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUE7S0FDZjtBQUNELE1BQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFBO0dBQ3RCO0FBQ0QsU0FBTyxJQUFJLENBQUE7Q0FDWjs7SUFFSyxjQUFjO1lBQWQsY0FBYzs7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OytCQUFkLGNBQWM7O1NBS2xCLEtBQUssR0FHRDtBQUNGLGlCQUFXLEVBQUUsRUFBRTtBQUNmLHFCQUFlLEVBQUUsS0FBSztLQUN2QjtTQUNELGtCQUFrQixHQUFZLEtBQUs7O1NBb0RuQyxRQUFRLEdBQUcsVUFBQyxFQUFFLEVBQVk7QUFDeEIsVUFBSSxFQUFFLEVBQUUsQ0FBQyxNQUFNLFlBQVksV0FBVyxDQUFBLEFBQUMsRUFBRTtBQUN2QyxlQUFNO09BQ1A7QUFDRCxVQUFNLElBQUksR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ2hDLFVBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxlQUFNO09BQ1A7Ozt1QkFFcUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDOztVQUFuRCxRQUFRLGNBQVIsUUFBUTtVQUFFLFFBQVEsY0FBUixRQUFRO1VBQUUsS0FBSyxjQUFMLEtBQUs7O0FBQ2pD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QUksRUFBQyxHQUFHLEVBQUMsT0FBTyxFQUFFO3FCQUFNLDZCQUFlLE9BQU8sQ0FBQzthQUFBLEFBQUM7VUFDbEUsMkNBQU0sU0FBUyxFQUFDLDRCQUE0QixHQUFHO1NBQzdDO1FBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQzFCLDBDQUFLLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLFlBQVksRUFBRSxBQUFDLEVBQUMsU0FBUyxFQUFDLGFBQWEsR0FBRyxBQUM3RztPQUNjLENBQUM7S0FDbkI7OztTQTNHRyxjQUFjO0dBQVMsbUJBQU0sU0FBUzs7QUE4RzVDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvbWVzc2FnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgbWFya2VkIGZyb20gJ21hcmtlZCdcblxuaW1wb3J0IHsgdmlzaXRNZXNzYWdlLCBvcGVuRXh0ZXJuYWxseSwgb3BlbkZpbGUgfSBmcm9tICcuLi9oZWxwZXJzJ1xuaW1wb3J0IHR5cGUgVG9vbHRpcERlbGVnYXRlIGZyb20gJy4vZGVsZWdhdGUnXG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcydcblxuZnVuY3Rpb24gZmluZEhyZWYoZWw6ID9FbGVtZW50KTogP3N0cmluZyB7XG4gIHdoaWxlIChlbCAmJiAhZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdsaW50ZXItbGluZScpKSB7XG4gICAgaWYgKGVsIGluc3RhbmNlb2YgSFRNTEFuY2hvckVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBlbC5ocmVmXG4gICAgfVxuICAgIGVsID0gZWwucGFyZW50RWxlbWVudFxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmNsYXNzIE1lc3NhZ2VFbGVtZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcHJvcHM6IHtcbiAgICBtZXNzYWdlOiBNZXNzYWdlLFxuICAgIGRlbGVnYXRlOiBUb29sdGlwRGVsZWdhdGUsXG4gIH07XG4gIHN0YXRlOiB7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvblNob3c6IGJvb2xlYW4sXG4gIH0gPSB7XG4gICAgZGVzY3JpcHRpb246ICcnLFxuICAgIGRlc2NyaXB0aW9uU2hvdzogZmFsc2UsXG4gIH07XG4gIGRlc2NyaXB0aW9uTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRVcGRhdGUoKCkgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7fSlcbiAgICB9KVxuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRFeHBhbmQoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvdykge1xuICAgICAgICB0aGlzLnRvZ2dsZURlc2NyaXB0aW9uKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRDb2xsYXBzZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5kZXNjcmlwdGlvblNob3cpIHtcbiAgICAgICAgdGhpcy50b2dnbGVEZXNjcmlwdGlvbigpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICB0b2dnbGVEZXNjcmlwdGlvbihyZXN1bHQ6ID9zdHJpbmcgPSBudWxsKSB7XG4gICAgY29uc3QgbmV3U3RhdHVzID0gIXRoaXMuc3RhdGUuZGVzY3JpcHRpb25TaG93XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnN0YXRlLmRlc2NyaXB0aW9uIHx8IHRoaXMucHJvcHMubWVzc2FnZS5kZXNjcmlwdGlvblxuXG4gICAgaWYgKCFuZXdTdGF0dXMgJiYgIXJlc3VsdCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRlc2NyaXB0aW9uU2hvdzogZmFsc2UgfSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0aW9uID09PSAnc3RyaW5nJyB8fCByZXN1bHQpIHtcbiAgICAgIGNvbnN0IGRlc2NyaXB0aW9uVG9Vc2UgPSBtYXJrZWQocmVzdWx0IHx8IGRlc2NyaXB0aW9uKVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRlc2NyaXB0aW9uU2hvdzogdHJ1ZSwgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uVG9Vc2UgfSlcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRlc2NyaXB0aW9uU2hvdzogdHJ1ZSB9KVxuICAgICAgaWYgKHRoaXMuZGVzY3JpcHRpb25Mb2FkaW5nKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5kZXNjcmlwdGlvbkxvYWRpbmcgPSB0cnVlXG4gICAgICBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7IHJlc29sdmUoZGVzY3JpcHRpb24oKSkgfSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgcmVzdWx0IHRvIGJlIHN0cmluZywgZ290OiAke3R5cGVvZiByZXNwb25zZX1gKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnRvZ2dsZURlc2NyaXB0aW9uKHJlc3BvbnNlKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tMaW50ZXJdIEVycm9yIGdldHRpbmcgZGVzY3JpcHRpb25zJywgZXJyb3IpXG4gICAgICAgICAgdGhpcy5kZXNjcmlwdGlvbkxvYWRpbmcgPSBmYWxzZVxuICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvdykge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVEZXNjcmlwdGlvbigpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbTGludGVyXSBJbnZhbGlkIGRlc2NyaXB0aW9uIGRldGVjdGVkLCBleHBlY3RlZCBzdHJpbmcgb3IgZnVuY3Rpb24gYnV0IGdvdDonLCB0eXBlb2YgZGVzY3JpcHRpb24pXG4gICAgfVxuICB9XG4gIG9wZW5GaWxlID0gKGV2OiBFdmVudCkgPT4ge1xuICAgIGlmICghKGV2LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGhyZWYgPSBmaW5kSHJlZihldi50YXJnZXQpXG4gICAgaWYgKCFocmVmKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gcGFyc2UgdGhlIGxpbmsuIGUuZy4gYXRvbTovL2xpbnRlcj9maWxlPTxwYXRoPiZyb3c9PG51bWJlcj4mY29sdW1uPTxudW1iZXI+XG4gICAgY29uc3QgeyBwcm90b2NvbCwgaG9zdG5hbWUsIHF1ZXJ5IH0gPSB1cmwucGFyc2UoaHJlZiwgdHJ1ZSlcbiAgICBjb25zdCBmaWxlID0gcXVlcnkgJiYgcXVlcnkuZmlsZVxuICAgIGlmIChwcm90b2NvbCAhPT0gJ2F0b206JyB8fCBob3N0bmFtZSAhPT0gJ2xpbnRlcicgfHwgIWZpbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCByb3cgPSBxdWVyeSAmJiBxdWVyeS5yb3cgPyBwYXJzZUludChxdWVyeS5yb3csIDEwKSA6IDBcbiAgICBjb25zdCBjb2x1bW4gPSBxdWVyeSAmJiBxdWVyeS5jb2x1bW4gPyBwYXJzZUludChxdWVyeS5jb2x1bW4sIDEwKSA6IDBcbiAgICBvcGVuRmlsZShmaWxlLCB7IHJvdywgY29sdW1uIH0pXG4gIH1cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgbWVzc2FnZSwgZGVsZWdhdGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoPGxpbnRlci1tZXNzYWdlIGNsYXNzPXttZXNzYWdlLnNldmVyaXR5fSBvbkNsaWNrPXt0aGlzLm9wZW5GaWxlfT5cbiAgICAgIHsgbWVzc2FnZS5kZXNjcmlwdGlvbiAmJiAoXG4gICAgICAgIDxhIGhyZWY9XCIjXCIgb25DbGljaz17KCkgPT4gdGhpcy50b2dnbGVEZXNjcmlwdGlvbigpfT5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BpY29uIGxpbnRlci1pY29uIGljb24tJHt0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvdyA/ICdjaGV2cm9uLWRvd24nIDogJ2NoZXZyb24tcmlnaHQnfWB9IC8+XG4gICAgICAgIDwvYT5cbiAgICAgICl9XG4gICAgICA8bGludGVyLWV4Y2VycHQ+XG4gICAgICAgIHsgZGVsZWdhdGUuc2hvd1Byb3ZpZGVyTmFtZSA/IGAke21lc3NhZ2UubGludGVyTmFtZX06IGAgOiAnJyB9XG4gICAgICAgIHsgbWVzc2FnZS5leGNlcnB0IH1cbiAgICAgIDwvbGludGVyLWV4Y2VycHQ+eycgJ31cbiAgICAgIHsgbWVzc2FnZS5yZWZlcmVuY2UgJiYgbWVzc2FnZS5yZWZlcmVuY2UuZmlsZSAmJiAoXG4gICAgICAgIDxhIGhyZWY9XCIjXCIgb25DbGljaz17KCkgPT4gdmlzaXRNZXNzYWdlKG1lc3NhZ2UsIHRydWUpfT5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGxpbnRlci1pY29uIGljb24tYWxpZ25tZW50LWFsaWduZWQtdG9cIiAvPlxuICAgICAgICA8L2E+XG4gICAgICApfVxuICAgICAgeyBtZXNzYWdlLnVybCAmJiA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9eygpID0+IG9wZW5FeHRlcm5hbGx5KG1lc3NhZ2UpfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBsaW50ZXItaWNvbiBpY29uLWxpbmtcIiAvPlxuICAgICAgPC9hPn1cbiAgICAgIHsgdGhpcy5zdGF0ZS5kZXNjcmlwdGlvblNob3cgJiYgKFxuICAgICAgICA8ZGl2IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogdGhpcy5zdGF0ZS5kZXNjcmlwdGlvbiB8fCAnTG9hZGluZy4uLicgfX0gY2xhc3NOYW1lPVwibGludGVyLWxpbmVcIiAvPlxuICAgICAgKSB9XG4gICAgPC9saW50ZXItbWVzc2FnZT4pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlRWxlbWVudFxuIl19