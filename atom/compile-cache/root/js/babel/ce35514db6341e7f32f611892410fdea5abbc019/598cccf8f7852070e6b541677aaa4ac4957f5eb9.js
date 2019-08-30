Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _elementsList = require('./elements/list');

var _elementsList2 = _interopRequireDefault(_elementsList);

var ListView = (function () {
  function ListView() {
    _classCallCheck(this, ListView);

    this.emitter = new _atom.Emitter();
    this.element = new _elementsList2['default']();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(this.element);
  }

  _createClass(ListView, [{
    key: 'activate',
    value: function activate(editor, suggestions) {
      var _this = this;

      this.element.render(suggestions, function (selected) {
        _this.emitter.emit('did-select', selected);
        _this.dispose();
      });
      this.element.move('move-to-top');

      var bufferPosition = editor.getCursorBufferPosition();
      var marker = editor.markBufferRange([bufferPosition, bufferPosition], { invalidate: 'never' });
      editor.decorateMarker(marker, {
        type: 'overlay',
        item: this.element
      });
      this.subscriptions.add(new _atom.Disposable(function () {
        marker.destroy();
      }));
    }
  }, {
    key: 'move',
    value: function move(movement) {
      this.element.move(movement);
    }
  }, {
    key: 'select',
    value: function select() {
      this.element.select();
    }
  }, {
    key: 'onDidSelect',
    value: function onDidSelect(callback) {
      return this.emitter.on('did-select', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return ListView;
})();

exports['default'] = ListView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvdmlldy1saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRXlELE1BQU07OzRCQUd2QyxpQkFBaUI7Ozs7SUFHcEIsUUFBUTtBQUtoQixXQUxRLFFBQVEsR0FLYjswQkFMSyxRQUFROztBQU16QixRQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLE9BQU8sR0FBRywrQkFBaUIsQ0FBQTtBQUNoQyxRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQ3JDOztlQVprQixRQUFROztXQWFuQixrQkFBQyxNQUFrQixFQUFFLFdBQTRCLEVBQUU7OztBQUN6RCxVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsVUFBQSxRQUFRLEVBQUk7QUFDM0MsY0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUN6QyxjQUFLLE9BQU8sRUFBRSxDQUFBO09BQ2YsQ0FBQyxDQUFBO0FBQ0YsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7O0FBRWhDLFVBQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO0FBQ3ZELFVBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtBQUNoRyxZQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtBQUM1QixZQUFJLEVBQUUsU0FBUztBQUNmLFlBQUksRUFBRSxJQUFJLENBQUMsT0FBTztPQUNuQixDQUFDLENBQUE7QUFDRixVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxxQkFBZSxZQUFXO0FBQy9DLGNBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNqQixDQUFDLENBQUMsQ0FBQTtLQUNKOzs7V0FDRyxjQUFDLFFBQXNCLEVBQUU7QUFDM0IsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDNUI7OztXQUNLLGtCQUFHO0FBQ1AsVUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtLQUN0Qjs7O1dBQ1UscUJBQUMsUUFBa0IsRUFBYztBQUMxQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUMvQzs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0F6Q2tCLFFBQVE7OztxQkFBUixRQUFRIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvdmlldy1saXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlciwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSB7IFRleHRFZGl0b3IgfSBmcm9tICdhdG9tJ1xuXG5pbXBvcnQgTGlzdEVsZW1lbnQgZnJvbSAnLi9lbGVtZW50cy9saXN0J1xuaW1wb3J0IHR5cGUgeyBMaXN0SXRlbSwgTGlzdE1vdmVtZW50IH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlzdFZpZXcge1xuICBlbWl0dGVyOiBFbWl0dGVyO1xuICBlbGVtZW50OiBMaXN0RWxlbWVudDtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5lbGVtZW50ID0gbmV3IExpc3RFbGVtZW50KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZW1pdHRlcilcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZWxlbWVudClcbiAgfVxuICBhY3RpdmF0ZShlZGl0b3I6IFRleHRFZGl0b3IsIHN1Z2dlc3Rpb25zOiBBcnJheTxMaXN0SXRlbT4pIHtcbiAgICB0aGlzLmVsZW1lbnQucmVuZGVyKHN1Z2dlc3Rpb25zLCBzZWxlY3RlZCA9PiB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdCcsIHNlbGVjdGVkKVxuICAgICAgdGhpcy5kaXNwb3NlKClcbiAgICB9KVxuICAgIHRoaXMuZWxlbWVudC5tb3ZlKCdtb3ZlLXRvLXRvcCcpXG5cbiAgICBjb25zdCBidWZmZXJQb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3QgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbYnVmZmVyUG9zaXRpb24sIGJ1ZmZlclBvc2l0aW9uXSwgeyBpbnZhbGlkYXRlOiAnbmV2ZXInIH0pXG4gICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge1xuICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgaXRlbTogdGhpcy5lbGVtZW50LFxuICAgIH0pXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZShmdW5jdGlvbigpIHtcbiAgICAgIG1hcmtlci5kZXN0cm95KClcbiAgICB9KSlcbiAgfVxuICBtb3ZlKG1vdmVtZW50OiBMaXN0TW92ZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQubW92ZShtb3ZlbWVudClcbiAgfVxuICBzZWxlY3QoKSB7XG4gICAgdGhpcy5lbGVtZW50LnNlbGVjdCgpXG4gIH1cbiAgb25EaWRTZWxlY3QoY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXNlbGVjdCcsIGNhbGxiYWNrKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=