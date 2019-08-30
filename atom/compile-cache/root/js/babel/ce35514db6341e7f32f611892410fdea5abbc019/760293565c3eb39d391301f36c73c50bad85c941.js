var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

// Greets

var _greetV2Welcome = require('./greet-v2-welcome');

var _greetV2Welcome2 = _interopRequireDefault(_greetV2Welcome);

// Note: This package should not be used from "Main" class,
// Instead it should be used from the main package entry point directly

var Greeter = (function () {
  function Greeter() {
    _classCallCheck(this, Greeter);

    this.notifications = new Set();
  }

  _createClass(Greeter, [{
    key: 'showWelcome',
    value: function showWelcome() {
      var _this = this;

      var notification = (0, _greetV2Welcome2['default'])();
      notification.onDidDismiss(function () {
        return _this.notifications['delete'](notification);
      });
      this.notifications.add(notification);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.notifications.forEach(function (n) {
        return n.dismiss();
      });
      this.notifications.clear();
    }
  }]);

  return Greeter;
})();

module.exports = Greeter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9ncmVldGVyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OzhCQUcyQixvQkFBb0I7Ozs7Ozs7SUFJekMsT0FBTztBQUVBLFdBRlAsT0FBTyxHQUVHOzBCQUZWLE9BQU87O0FBR1QsUUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0dBQy9COztlQUpHLE9BQU87O1dBS0EsdUJBQVM7OztBQUNsQixVQUFNLFlBQVksR0FBRyxrQ0FBZ0IsQ0FBQTtBQUNyQyxrQkFBWSxDQUFDLFlBQVksQ0FBQztlQUFNLE1BQUssYUFBYSxVQUFPLENBQUMsWUFBWSxDQUFDO09BQUEsQ0FBQyxDQUFBO0FBQ3hFLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO0tBQ3JDOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztlQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7T0FBQSxDQUFDLENBQUE7QUFDNUMsVUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtLQUMzQjs7O1NBYkcsT0FBTzs7O0FBZ0JiLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9ncmVldGVyL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuLy8gR3JlZXRzXG5pbXBvcnQgZ3JlZXRWMldlbGNvbWUgZnJvbSAnLi9ncmVldC12Mi13ZWxjb21lJ1xuXG4vLyBOb3RlOiBUaGlzIHBhY2thZ2Ugc2hvdWxkIG5vdCBiZSB1c2VkIGZyb20gXCJNYWluXCIgY2xhc3MsXG4vLyBJbnN0ZWFkIGl0IHNob3VsZCBiZSB1c2VkIGZyb20gdGhlIG1haW4gcGFja2FnZSBlbnRyeSBwb2ludCBkaXJlY3RseVxuY2xhc3MgR3JlZXRlciB7XG4gIG5vdGlmaWNhdGlvbnM6IFNldDxPYmplY3Q+O1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KClcbiAgfVxuICBzaG93V2VsY29tZSgpOiB2b2lkIHtcbiAgICBjb25zdCBub3RpZmljYXRpb24gPSBncmVldFYyV2VsY29tZSgpXG4gICAgbm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcygoKSA9PiB0aGlzLm5vdGlmaWNhdGlvbnMuZGVsZXRlKG5vdGlmaWNhdGlvbikpXG4gICAgdGhpcy5ub3RpZmljYXRpb25zLmFkZChub3RpZmljYXRpb24pXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLm5vdGlmaWNhdGlvbnMuZm9yRWFjaChuID0+IG4uZGlzbWlzcygpKVxuICAgIHRoaXMubm90aWZpY2F0aW9ucy5jbGVhcigpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcmVldGVyXG4iXX0=