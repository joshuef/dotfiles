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

var _fixButton = require('./fix-button');

var _fixButton2 = _interopRequireDefault(_fixButton);

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

    this.descriptionLoading = false;
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

    // NOTE: Only handling messages v2 because v1 would be handled by message-legacy component
  }, {
    key: 'onFixClick',
    value: function onFixClick() {
      var message = this.props.message;
      var textEditor = (0, _helpers.getActiveTextEditor)();
      if (message.version === 2 && message.solutions && message.solutions.length) {
        (0, _helpers.applySolution)(textEditor, message.version, (0, _helpers.sortSolutions)(message.solutions)[0]);
      }
    }
  }, {
    key: 'canBeFixed',
    value: function canBeFixed(message) {
      if (message.version === 1 && message.fix) {
        return true;
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        return true;
      }
      return false;
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
          this.canBeFixed(message) && _react2['default'].createElement(_fixButton2['default'], { onClick: function () {
              return _this3.onFixClick();
            } }),
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
        this.state.descriptionShow && _react2['default'].createElement('div', {
          dangerouslySetInnerHTML: {
            __html: this.state.description || 'Loading...'
          },
          className: 'linter-line'
        })
      );
    }
  }]);

  return MessageElement;
})(_react2['default'].Component);

module.exports = MessageElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3Rvb2x0aXAvbWVzc2FnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7bUJBRXFCLEtBQUs7O0lBQWQsR0FBRzs7cUJBQ0csT0FBTzs7OztzQkFDTixRQUFROzs7O3VCQUUrRSxZQUFZOzt5QkFHaEcsY0FBYzs7OztBQUVwQyxTQUFTLFFBQVEsQ0FBQyxFQUFZLEVBQVc7QUFDdkMsU0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtBQUNsRCxRQUFJLEVBQUUsWUFBWSxpQkFBaUIsRUFBRTtBQUNuQyxhQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUE7S0FDZjtBQUNELE1BQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFBO0dBQ3RCO0FBQ0QsU0FBTyxJQUFJLENBQUE7Q0FDWjs7SUFZSyxjQUFjO1lBQWQsY0FBYzs7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OytCQUFkLGNBQWM7O1NBQ2xCLEtBQUssR0FBVTtBQUNiLGlCQUFXLEVBQUUsRUFBRTtBQUNmLHFCQUFlLEVBQUUsS0FBSztLQUN2Qjs7U0EyQkQsUUFBUSxHQUFHLFVBQUMsRUFBRSxFQUFZO0FBQ3hCLFVBQUksRUFBRSxFQUFFLENBQUMsTUFBTSxZQUFZLFdBQVcsQ0FBQSxBQUFDLEVBQUU7QUFDdkMsZUFBTTtPQUNQO0FBQ0QsVUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsZUFBTTtPQUNQOzs7dUJBRXFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQzs7VUFBbkQsUUFBUSxjQUFSLFFBQVE7VUFBRSxRQUFRLGNBQVIsUUFBUTtVQUFFLEtBQUssY0FBTCxLQUFLOztBQUNqQyxVQUFNLElB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QUN2QixBQUNIO09BQ2MsQ0FDbEI7S0FDRjs7O1NBeElHLGNBQWM7R0FBUyxtQkFBTSxTQUFTOztBQTJJNUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvdG9vbHRpcC9tZXNzYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCdcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCBtYXJrZWQgZnJvbSAnbWFya2VkJ1xuXG5pbXBvcnQgeyB2aXNpdE1lc3NhZ2UsIG9wZW5FeHRlcm5hbGx5LCBvcGVuRmlsZSwgYXBwbHlTb2x1dGlvbiwgZ2V0QWN0aXZlVGV4dEVkaXRvciwgc29ydFNvbHV0aW9ucyB9IGZyb20gJy4uL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSBUb29sdGlwRGVsZWdhdGUgZnJvbSAnLi9kZWxlZ2F0ZSdcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSwgTGludGVyTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IEZpeEJ1dHRvbiBmcm9tICcuL2ZpeC1idXR0b24nXG5cbmZ1bmN0aW9uIGZpbmRIcmVmKGVsOiA/RWxlbWVudCk6ID9zdHJpbmcge1xuICB3aGlsZSAoZWwgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnbGludGVyLWxpbmUnKSkge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50KSB7XG4gICAgICByZXR1cm4gZWwuaHJlZlxuICAgIH1cbiAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnRcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG50eXBlIFByb3BzID0ge1xuICBtZXNzYWdlOiBNZXNzYWdlLFxuICBkZWxlZ2F0ZTogVG9vbHRpcERlbGVnYXRlLFxufVxuXG50eXBlIFN0YXRlID0ge1xuICBkZXNjcmlwdGlvbj86IHN0cmluZyxcbiAgZGVzY3JpcHRpb25TaG93PzogYm9vbGVhbixcbn1cblxuY2xhc3MgTWVzc2FnZUVsZW1lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHMsIFN0YXRlPiB7XG4gIHN0YXRlOiBTdGF0ZSA9IHtcbiAgICBkZXNjcmlwdGlvbjogJycsXG4gICAgZGVzY3JpcHRpb25TaG93OiBmYWxzZSxcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRVcGRhdGUoKCkgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7fSlcbiAgICB9KVxuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRFeHBhbmQoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvdykge1xuICAgICAgICB0aGlzLnRvZ2dsZURlc2NyaXB0aW9uKClcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMucHJvcHMuZGVsZWdhdGUub25TaG91bGRDb2xsYXBzZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5kZXNjcmlwdGlvblNob3cpIHtcbiAgICAgICAgdGhpcy50b2dnbGVEZXNjcmlwdGlvbigpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8vIE5PVEU6IE9ubHkgaGFuZGxpbmcgbWVzc2FnZXMgdjIgYmVjYXVzZSB2MSB3b3VsZCBiZSBoYW5kbGVkIGJ5IG1lc3NhZ2UtbGVnYWN5IGNvbXBvbmVudFxuICBvbkZpeENsaWNrKCk6IHZvaWQge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLnByb3BzLm1lc3NhZ2VcbiAgICBjb25zdCB0ZXh0RWRpdG9yID0gZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKG1lc3NhZ2UudmVyc2lvbiA9PT0gMiAmJiBtZXNzYWdlLnNvbHV0aW9ucyAmJiBtZXNzYWdlLnNvbHV0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGFwcGx5U29sdXRpb24odGV4dEVkaXRvciwgbWVzc2FnZS52ZXJzaW9uLCBzb3J0U29sdXRpb25zKG1lc3NhZ2Uuc29sdXRpb25zKVswXSlcbiAgICB9XG4gIH1cblxuICBvcGVuRmlsZSA9IChldjogRXZlbnQpID0+IHtcbiAgICBpZiAoIShldi50YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBocmVmID0gZmluZEhyZWYoZXYudGFyZ2V0KVxuICAgIGlmICghaHJlZikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIHBhcnNlIHRoZSBsaW5rLiBlLmcuIGF0b206Ly9saW50ZXI/ZmlsZT08cGF0aD4mcm93PTxudW1iZXI+JmNvbHVtbj08bnVtYmVyPlxuICAgIGNvbnN0IHsgcHJvdG9jb2wsIGhvc3RuYW1lLCBxdWVyeSB9ID0gdXJsLnBhcnNlKGhyZWYsIHRydWUpXG4gICAgY29uc3QgZmlsZSA9IHF1ZXJ5ICYmIHF1ZXJ5LmZpbGVcbiAgICBpZiAocHJvdG9jb2wgIT09ICdhdG9tOicgfHwgaG9zdG5hbWUgIT09ICdsaW50ZXInIHx8ICFmaWxlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3Qgcm93ID0gcXVlcnkgJiYgcXVlcnkucm93ID8gcGFyc2VJbnQocXVlcnkucm93LCAxMCkgOiAwXG4gICAgY29uc3QgY29sdW1uID0gcXVlcnkgJiYgcXVlcnkuY29sdW1uID8gcGFyc2VJbnQocXVlcnkuY29sdW1uLCAxMCkgOiAwXG4gICAgb3BlbkZpbGUoZmlsZSwgeyByb3csIGNvbHVtbiB9KVxuICB9XG5cbiAgY2FuQmVGaXhlZChtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogYm9vbGVhbiB7XG4gICAgaWYgKG1lc3NhZ2UudmVyc2lvbiA9PT0gMSAmJiBtZXNzYWdlLmZpeCkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudmVyc2lvbiA9PT0gMiAmJiBtZXNzYWdlLnNvbHV0aW9ucyAmJiBtZXNzYWdlLnNvbHV0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgdG9nZ2xlRGVzY3JpcHRpb24ocmVzdWx0OiA/c3RyaW5nID0gbnVsbCkge1xuICAgIGNvbnN0IG5ld1N0YXR1cyA9ICF0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvd1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5zdGF0ZS5kZXNjcmlwdGlvbiB8fCB0aGlzLnByb3BzLm1lc3NhZ2UuZGVzY3JpcHRpb25cblxuICAgIGlmICghbmV3U3RhdHVzICYmICFyZXN1bHQpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkZXNjcmlwdGlvblNob3c6IGZhbHNlIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbiA9PT0gJ3N0cmluZycgfHwgcmVzdWx0KSB7XG4gICAgICBjb25zdCBkZXNjcmlwdGlvblRvVXNlID0gbWFya2VkKHJlc3VsdCB8fCBkZXNjcmlwdGlvbilcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkZXNjcmlwdGlvblNob3c6IHRydWUsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblRvVXNlIH0pXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzY3JpcHRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkZXNjcmlwdGlvblNob3c6IHRydWUgfSlcbiAgICAgIGlmICh0aGlzLmRlc2NyaXB0aW9uTG9hZGluZykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Mb2FkaW5nID0gdHJ1ZVxuICAgICAgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICByZXNvbHZlKGRlc2NyaXB0aW9uKCkpXG4gICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgcmVzdWx0IHRvIGJlIHN0cmluZywgZ290OiAke3R5cGVvZiByZXNwb25zZX1gKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnRvZ2dsZURlc2NyaXB0aW9uKHJlc3BvbnNlKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbTGludGVyXSBFcnJvciBnZXR0aW5nIGRlc2NyaXB0aW9ucycsIGVycm9yKVxuICAgICAgICAgIHRoaXMuZGVzY3JpcHRpb25Mb2FkaW5nID0gZmFsc2VcbiAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZXNjcmlwdGlvblNob3cpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRGVzY3JpcHRpb24oKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignW0xpbnRlcl0gSW52YWxpZCBkZXNjcmlwdGlvbiBkZXRlY3RlZCwgZXhwZWN0ZWQgc3RyaW5nIG9yIGZ1bmN0aW9uIGJ1dCBnb3Q6JywgdHlwZW9mIGRlc2NyaXB0aW9uKVxuICAgIH1cbiAgfVxuXG4gIHByb3BzOiBQcm9wc1xuICBkZXNjcmlwdGlvbkxvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGRlbGVnYXRlIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGxpbnRlci1tZXNzYWdlIGNsYXNzPXttZXNzYWdlLnNldmVyaXR5fSBvbkNsaWNrPXt0aGlzLm9wZW5GaWxlfT5cbiAgICAgICAge21lc3NhZ2UuZGVzY3JpcHRpb24gJiYgKFxuICAgICAgICAgIDxhIGhyZWY9XCIjXCIgb25DbGljaz17KCkgPT4gdGhpcy50b2dnbGVEZXNjcmlwdGlvbigpfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGljb24gbGludGVyLWljb24gaWNvbi0ke3RoaXMuc3RhdGUuZGVzY3JpcHRpb25TaG93ID8gJ2NoZXZyb24tZG93bicgOiAnY2hldnJvbi1yaWdodCd9YH0gLz5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICl9XG4gICAgICAgIDxsaW50ZXItZXhjZXJwdD5cbiAgICAgICAgICB7dGhpcy5jYW5CZUZpeGVkKG1lc3NhZ2UpICYmIDxGaXhCdXR0b24gb25DbGljaz17KCkgPT4gdGhpcy5vbkZpeENsaWNrKCl9IC8+fVxuICAgICAgICAgIHtkZWxlZ2F0ZS5zaG93UHJvdmlkZXJOYW1lID8gYCR7bWVzc2FnZS5saW50ZXJOYW1lfTogYCA6ICcnfVxuICAgICAgICAgIHttZXNzYWdlLmV4Y2VycHR9XG4gICAgICAgIDwvbGludGVyLWV4Y2VycHQ+eycgJ31cbiAgICAgICAge21lc3NhZ2UucmVmZXJlbmNlICYmXG4gICAgICAgICAgbWVzc2FnZS5yZWZlcmVuY2UuZmlsZSAmJiAoXG4gICAgICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9eygpID0+IHZpc2l0TWVzc2FnZShtZXNzYWdlLCB0cnVlKX0+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gbGludGVyLWljb24gaWNvbi1hbGlnbm1lbnQtYWxpZ25lZC10b1wiIC8+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKX1cbiAgICAgICAge21lc3NhZ2UudXJsICYmIChcbiAgICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9eygpID0+IG9wZW5FeHRlcm5hbGx5KG1lc3NhZ2UpfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gbGludGVyLWljb24gaWNvbi1saW5rXCIgLz5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICl9XG4gICAgICAgIHt0aGlzLnN0YXRlLmRlc2NyaXB0aW9uU2hvdyAmJiAoXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tcbiAgICAgICAgICAgICAgX19odG1sOiB0aGlzLnN0YXRlLmRlc2NyaXB0aW9uIHx8ICdMb2FkaW5nLi4uJyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJsaW50ZXItbGluZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKX1cbiAgICAgIDwvbGludGVyLW1lc3NhZ2U+XG4gICAgKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUVsZW1lbnRcbiJdfQ==