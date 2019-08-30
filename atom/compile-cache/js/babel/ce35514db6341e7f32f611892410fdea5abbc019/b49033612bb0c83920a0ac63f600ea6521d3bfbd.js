var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _sbReactTable = require('sb-react-table');

var _sbReactTable2 = _interopRequireDefault(_sbReactTable);

var _helpers = require('../helpers');

var PanelComponent = (function (_React$Component) {
  _inherits(PanelComponent, _React$Component);

  _createClass(PanelComponent, null, [{
    key: 'renderRowColumn',
    value: function renderRowColumn(row, column) {
      var range = (0, _helpers.$range)(row);

      switch (column) {
        case 'file':
          return (0, _helpers.getPathOfMessage)(row);
        case 'line':
          return range ? range.start.row + 1 + ':' + (range.start.column + 1) : '';
        case 'excerpt':
          if (row.version === 1) {
            if (row.html) {
              return _react2['default'].createElement('span', { dangerouslySetInnerHTML: { __html: row.html } });
            }
            return row.text || '';
          }
          return row.excerpt;
        case 'severity':
          return _helpers.severityNames[row.severity];
        default:
          return row[column];
      }
    }
  }]);

  function PanelComponent(props, context) {
    _classCallCheck(this, PanelComponent);

    _get(Object.getPrototypeOf(PanelComponent.prototype), 'constructor', this).call(this, props, context);

    this.onClick = function (e, row) {
      if (e.target.tagName === 'A') {
        return;
      }
      if (process.platform === 'darwin' ? e.metaKey : e.ctrlKey) {
        if (e.shiftKey) {
          (0, _helpers.openExternally)(row);
        } else {
          (0, _helpers.visitMessage)(row, true);
        }
      } else {
        (0, _helpers.visitMessage)(row);
      }
    };

    this.state = {
      messages: this.props.delegate.filteredMessages
    };
  }

  _createClass(PanelComponent, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this = this;

      this.props.delegate.onDidChangeMessages(function (messages) {
        _this.setState({ messages: messages });
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var delegate = this.props.delegate;

      var columns = [{ key: 'severity', label: 'Severity', sortable: true }, { key: 'linterName', label: 'Provider', sortable: true }, { key: 'excerpt', label: 'Description', onClick: this.onClick }, { key: 'line', label: 'Line', sortable: true, onClick: this.onClick }];
      if (delegate.panelRepresents === 'Entire Project') {
        columns.push({
          key: 'file',
          label: 'File',
          sortable: true,
          onClick: this.onClick
        });
      }

      var customStyle = { overflowY: 'scroll', height: '100%' };

      return _react2['default'].createElement(
        'div',
        { id: 'linter-panel', tabIndex: '-1', style: customStyle },
        _react2['default'].createElement(_sbReactTable2['default'], {
          rows: this.state.messages,
          columns: columns,
          initialSort: [{ column: 'severity', type: 'desc' }, { column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }],
          sort: _helpers.sortMessages,
          rowKey: function (i) {
            return i.key;
          },
          renderHeaderColumn: function (i) {
            return i.label;
          },
          renderBodyColumn: PanelComponent.renderRowColumn,
          style: { width: '100%' },
          className: 'linter'
        })
      );
    }
  }]);

  return PanelComponent;
})(_react2['default'].Component);

module.exports = PanelComponent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2NvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3FCQUVrQixPQUFPOzs7OzRCQUNGLGdCQUFnQjs7Ozt1QkFDNkQsWUFBWTs7SUFZMUcsY0FBYztZQUFkLGNBQWM7O2VBQWQsY0FBYzs7V0FDSSx5QkFBQyxHQUFrQixFQUFFLE1BQWMsRUFBbUI7QUFDMUUsVUFBTSxLQUFLLEdBQUcscUJBQU8sR0FBRyxDQUFDLENBQUE7O0FBRXpCLGNBQVEsTUFBTTtBQUNaLGFBQUssTUFBTTtBQUNULGlCQUFPLCtCQUFpQixHQUFHLENBQUMsQ0FBQTtBQUFBLEFBQzlCLGFBQUssTUFBTTtBQUNULGlCQUFPLEtBQUssR0FBTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBLEdBQUssRUFBRSxDQUFBO0FBQUEsQUFDeEUsYUFBSyxTQUFTO0FBQ1osY0FBSSxHQUFHLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUNyQixnQkFBSSxHQUFHLENBQUMsSUFBSSxFQUFFO0FBQ1oscUJBQU8sMkNBQU0sdUJBQXVCLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxBQUFDLEdBQUcsQ0FBQTthQUMvRDtBQUNELG1CQUFPLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFBO1dBQ3RCO0FBQ0QsaUJBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQTtBQUFBLEFBQ3BCLGFBQUssVUFBVTtBQUNiLGlCQUFPLHVCQUFjLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUFBLEFBQ3BDO0FBQ0UsaUJBQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQUEsT0FDckI7S0FDRjs7O0FBRVUsV0F4QlAsY0FBYyxDQXdCTixLQUFh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QUFDLEtBQUs7V0FBQSxBQUFDO0FBQ2pDLDBCQUFnQixFQUFFLGNBQWMsQ0FBQyxlQUFlLEFBQUM7QUFDakQsZUFBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxBQUFDO0FBQ3pCLG1CQUFTLEVBQUMsUUFBUTtVQUNsQjtPQUNFLENBQ1A7S0FDRjs7O1NBN0ZHLGNBQWM7R0FBUyxtQkFBTSxTQUFTOztBQWdHNUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvcGFuZWwvY29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0VGFibGUgZnJvbSAnc2ItcmVhY3QtdGFibGUnXG5pbXBvcnQgeyAkcmFuZ2UsIHNldmVyaXR5TmFtZXMsIHNvcnRNZXNzYWdlcywgdmlzaXRNZXNzYWdlLCBvcGVuRXh0ZXJuYWxseSwgZ2V0UGF0aE9mTWVzc2FnZSB9IGZyb20gJy4uL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSBEZWxlZ2F0ZSBmcm9tICcuL2RlbGVnYXRlJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXJNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGRlbGVnYXRlOiBEZWxlZ2F0ZSxcbn1cblxudHlwZSBTdGF0ZSA9IHtcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+LFxufVxuXG5jbGFzcyBQYW5lbENvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcbiAgc3RhdGljIHJlbmRlclJvd0NvbHVtbihyb3c6IExpbnRlck1lc3NhZ2UsIGNvbHVtbjogc3RyaW5nKTogc3RyaW5nIHwgT2JqZWN0IHtcbiAgICBjb25zdCByYW5nZSA9ICRyYW5nZShyb3cpXG5cbiAgICBzd2l0Y2ggKGNvbHVtbikge1xuICAgICAgY2FzZSAnZmlsZSc6XG4gICAgICAgIHJldHVybiBnZXRQYXRoT2ZNZXNzYWdlKHJvdylcbiAgICAgIGNhc2UgJ2xpbmUnOlxuICAgICAgICByZXR1cm4gcmFuZ2UgPyBgJHtyYW5nZS5zdGFydC5yb3cgKyAxfToke3JhbmdlLnN0YXJ0LmNvbHVtbiArIDF9YCA6ICcnXG4gICAgICBjYXNlICdleGNlcnB0JzpcbiAgICAgICAgaWYgKHJvdy52ZXJzaW9uID09PSAxKSB7XG4gICAgICAgICAgaWYgKHJvdy5odG1sKSB7XG4gICAgICAgICAgICByZXR1cm4gPHNwYW4gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiByb3cuaHRtbCB9fSAvPlxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcm93LnRleHQgfHwgJydcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcm93LmV4Y2VycHRcbiAgICAgIGNhc2UgJ3NldmVyaXR5JzpcbiAgICAgICAgcmV0dXJuIHNldmVyaXR5TmFtZXNbcm93LnNldmVyaXR5XVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHJvd1tjb2x1bW5dXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IE9iamVjdCwgY29udGV4dDogP09iamVjdCkge1xuICAgIHN1cGVyKHByb3BzLCBjb250ZXh0KVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBtZXNzYWdlczogdGhpcy5wcm9wcy5kZWxlZ2F0ZS5maWx0ZXJlZE1lc3NhZ2VzLFxuICAgIH1cbiAgfVxuICBzdGF0ZTogU3RhdGVcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLnByb3BzLmRlbGVnYXRlLm9uRGlkQ2hhbmdlTWVzc2FnZXMobWVzc2FnZXMgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1lc3NhZ2VzIH0pXG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2sgPSAoZTogTW91c2VFdmVudCwgcm93OiBMaW50ZXJNZXNzYWdlKSA9PiB7XG4gICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgPT09ICdBJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/IGUubWV0YUtleSA6IGUuY3RybEtleSkge1xuICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgb3BlbkV4dGVybmFsbHkocm93KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlzaXRNZXNzYWdlKHJvdywgdHJ1ZSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmlzaXRNZXNzYWdlKHJvdylcbiAgICB9XG4gIH1cblxuICBwcm9wczogUHJvcHNcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBkZWxlZ2F0ZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvbHVtbnMgPSBbXG4gICAgICB7IGtleTogJ3NldmVyaXR5JywgbGFiZWw6ICdTZXZlcml0eScsIHNvcnRhYmxlOiB0cnVlIH0sXG4gICAgICB7IGtleTogJ2xpbnRlck5hbWUnLCBsYWJlbDogJ1Byb3ZpZGVyJywgc29ydGFibGU6IHRydWUgfSxcbiAgICAgIHsga2V5OiAnZXhjZXJwdCcsIGxhYmVsOiAnRGVzY3JpcHRpb24nLCBvbkNsaWNrOiB0aGlzLm9uQ2xpY2sgfSxcbiAgICAgIHsga2V5OiAnbGluZScsIGxhYmVsOiAnTGluZScsIHNvcnRhYmxlOiB0cnVlLCBvbkNsaWNrOiB0aGlzLm9uQ2xpY2sgfSxcbiAgICBdXG4gICAgaWYgKGRlbGVnYXRlLnBhbmVsUmVwcmVzZW50cyA9PT0gJ0VudGlyZSBQcm9qZWN0Jykge1xuICAgICAgY29sdW1ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnZmlsZScsXG4gICAgICAgIGxhYmVsOiAnRmlsZScsXG4gICAgICAgIHNvcnRhYmxlOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiB0aGlzLm9uQ2xpY2ssXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGN1c3RvbVN0eWxlOiBPYmplY3QgPSB7IG92ZXJmbG93WTogJ3Njcm9sbCcsIGhlaWdodDogJzEwMCUnIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwibGludGVyLXBhbmVsXCIgdGFiSW5kZXg9XCItMVwiIHN0eWxlPXtjdXN0b21TdHlsZX0+XG4gICAgICAgIDxSZWFjdFRhYmxlXG4gICAgICAgICAgcm93cz17dGhpcy5zdGF0ZS5tZXNzYWdlc31cbiAgICAgICAgICBjb2x1bW5zPXtjb2x1bW5zfVxuICAgICAgICAgIGluaXRpYWxTb3J0PXtbXG4gICAgICAgICAgICB7IGNvbHVtbjogJ3NldmVyaXR5JywgdHlwZTogJ2Rlc2MnIH0sXG4gICAgICAgICAgICB7IGNvbHVtbjogJ2ZpbGUnLCB0eXBlOiAnYXNjJyB9LFxuICAgICAgICAgICAgeyBjb2x1bW46ICdsaW5lJywgdHlwZTogJ2FzYycgfSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIHNvcnQ9e3NvcnRNZXNzYWdlc31cbiAgICAgICAgICByb3dLZXk9e2kgPT4gaS5rZXl9XG4gICAgICAgICAgcmVuZGVySGVhZGVyQ29sdW1uPXtpID0+IGkubGFiZWx9XG4gICAgICAgICAgcmVuZGVyQm9keUNvbHVtbj17UGFuZWxDb21wb25lbnQucmVuZGVyUm93Q29sdW1ufVxuICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiAnMTAwJScgfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJsaW50ZXJcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxDb21wb25lbnRcbiJdfQ==