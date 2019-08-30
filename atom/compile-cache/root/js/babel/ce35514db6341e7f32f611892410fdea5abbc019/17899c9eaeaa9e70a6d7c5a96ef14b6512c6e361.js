Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _commands = require('./commands');

var _commands2 = _interopRequireDefault(_commands);

var _viewList = require('./view-list');

var _viewList2 = _interopRequireDefault(_viewList);

var _providersList = require('./providers-list');

var _providersList2 = _interopRequireDefault(_providersList);

var _providersHighlight = require('./providers-highlight');

var _providersHighlight2 = _interopRequireDefault(_providersHighlight);

var Intentions = (function () {
  function Intentions() {
    var _this = this;

    _classCallCheck(this, Intentions);

    this.active = null;
    this.commands = new _commands2['default']();
    this.providersList = new _providersList2['default']();
    this.providersHighlight = new _providersHighlight2['default']();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.commands);
    this.subscriptions.add(this.providersList);
    this.subscriptions.add(this.providersHighlight);

    this.commands.onListShow(_asyncToGenerator(function* (textEditor) {
      var results = yield _this.providersList.trigger(textEditor);
      if (!results.length) {
        return false;
      }

      var listView = new _viewList2['default']();
      var subscriptions = new _atom.CompositeDisposable();

      listView.activate(textEditor, results);
      listView.onDidSelect(function (intention) {
        intention.selected();
        subscriptions.dispose();
      });

      subscriptions.add(listView);
      subscriptions.add(new _atom.Disposable(function () {
        if (_this.active === subscriptions) {
          _this.active = null;
        }
      }));
      subscriptions.add(_this.commands.onListMove(function (movement) {
        listView.move(movement);
      }));
      subscriptions.add(_this.commands.onListConfirm(function () {
        listView.select();
      }));
      subscriptions.add(_this.commands.onListHide(function () {
        subscriptions.dispose();
      }));
      _this.active = subscriptions;
      return true;
    }));
    this.commands.onHighlightsShow(_asyncToGenerator(function* (textEditor) {
      var results = yield _this.providersHighlight.trigger(textEditor);
      if (!results.length) {
        return false;
      }

      var painted = _this.providersHighlight.paint(textEditor, results);
      var subscriptions = new _atom.CompositeDisposable();

      subscriptions.add(new _atom.Disposable(function () {
        if (_this.active === subscriptions) {
          _this.active = null;
        }
      }));
      subscriptions.add(_this.commands.onHighlightsHide(function () {
        subscriptions.dispose();
      }));
      subscriptions.add(painted);
      _this.active = subscriptions;

      return true;
    }));
  }

  _createClass(Intentions, [{
    key: 'activate',
    value: function activate() {
      this.commands.activate();
    }
  }, {
    key: 'consumeListProvider',
    value: function consumeListProvider(provider) {
      this.providersList.addProvider(provider);
    }
  }, {
    key: 'deleteListProvider',
    value: function deleteListProvider(provider) {
      this.providersList.deleteProvider(provider);
    }
  }, {
    key: 'consumeHighlightProvider',
    value: function consumeHighlightProvider(provider) {
      this.providersHighlight.addProvider(provider);
    }
  }, {
    key: 'deleteHighlightProvider',
    value: function deleteHighlightProvider(provider) {
      this.providersHighlight.deleteProvider(provider);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      if (this.active) {
        this.active.dispose();
      }
    }
  }]);

  return Intentions;
})();

exports['default'] = Intentions;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07O3dCQUVqQyxZQUFZOzs7O3dCQUNaLGFBQWE7Ozs7NkJBQ1Isa0JBQWtCOzs7O2tDQUNiLHVCQUF1Qjs7OztJQUdqQyxVQUFVO0FBTWxCLFdBTlEsVUFBVSxHQU1mOzs7MEJBTkssVUFBVTs7QUFPM0IsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7QUFDbEIsUUFBSSxDQUFDLFFBQVEsR0FBRywyQkFBYyxDQUFBO0FBQzlCLFFBQUksQ0FBQyxhQUFhLEdBQUcsZ0NBQW1CLENBQUE7QUFDeEMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLHFDQUF3QixDQUFBO0FBQ2xELFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNyQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDMUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUE7O0FBRS9DLFFBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxtQkFBQyxXQUFNLFVBQVUsRUFBSTtBQUMzQyxVQUFNLE9BQU8sR0FBRyxNQUFNLE1BQUssYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUM1RCxVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNuQixlQUFPLEtBQUssQ0FBQTtPQUNiOztBQUVELFVBQU0sUUFBUSxHQUFHLDJCQUFjLENBQUE7QUFDL0IsVUFBTSxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRS9DLGNBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLE9B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LGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixVQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3RCO0tBQ0Y7OztTQTdGa0IsVUFBVTs7O3FCQUFWLFVBQVUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9pbnRlbnRpb25zL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCBDb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IExpc3RWaWV3IGZyb20gJy4vdmlldy1saXN0J1xuaW1wb3J0IFByb3ZpZGVyc0xpc3QgZnJvbSAnLi9wcm92aWRlcnMtbGlzdCdcbmltcG9ydCBQcm92aWRlcnNIaWdobGlnaHQgZnJvbSAnLi9wcm92aWRlcnMtaGlnaGxpZ2h0J1xuaW1wb3J0IHR5cGUgeyBMaXN0UHJvdmlkZXIsIEhpZ2hsaWdodFByb3ZpZGVyIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW50ZW50aW9ucyB7XG4gIGFjdGl2ZTogP0Rpc3Bvc2FibGU7XG4gIGNvbW1hbmRzOiBDb21tYW5kcztcbiAgcHJvdmlkZXJzTGlzdDogUHJvdmlkZXJzTGlzdDtcbiAgcHJvdmlkZXJzSGlnaGxpZ2h0OiBQcm92aWRlcnNIaWdobGlnaHQ7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuYWN0aXZlID0gbnVsbFxuICAgIHRoaXMuY29tbWFuZHMgPSBuZXcgQ29tbWFuZHMoKVxuICAgIHRoaXMucHJvdmlkZXJzTGlzdCA9IG5ldyBQcm92aWRlcnNMaXN0KClcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodCA9IG5ldyBQcm92aWRlcnNIaWdobGlnaHQoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucHJvdmlkZXJzTGlzdClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0KVxuXG4gICAgdGhpcy5jb21tYW5kcy5vbkxpc3RTaG93KGFzeW5jIHRleHRFZGl0b3IgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMucHJvdmlkZXJzTGlzdC50cmlnZ2VyKHRleHRFZGl0b3IpXG4gICAgICBpZiAoIXJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBMaXN0VmlldygpXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgICBsaXN0Vmlldy5hY3RpdmF0ZSh0ZXh0RWRpdG9yLCByZXN1bHRzKVxuICAgICAgbGlzdFZpZXcub25EaWRTZWxlY3QoZnVuY3Rpb24oaW50ZW50aW9uKSB7XG4gICAgICAgIGludGVudGlvbi5zZWxlY3RlZCgpXG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICB9KVxuXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChsaXN0VmlldylcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBzdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXG4gICAgICAgIH1cbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkxpc3RNb3ZlKGZ1bmN0aW9uKG1vdmVtZW50KSB7XG4gICAgICAgIGxpc3RWaWV3Lm1vdmUobW92ZW1lbnQpXG4gICAgICB9KSlcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuY29tbWFuZHMub25MaXN0Q29uZmlybShmdW5jdGlvbigpIHtcbiAgICAgICAgbGlzdFZpZXcuc2VsZWN0KClcbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkxpc3RIaWRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgfSkpXG4gICAgICB0aGlzLmFjdGl2ZSA9IHN1YnNjcmlwdGlvbnNcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSlcbiAgICB0aGlzLmNvbW1hbmRzLm9uSGlnaGxpZ2h0c1Nob3coYXN5bmMgdGV4dEVkaXRvciA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5wcm92aWRlcnNIaWdobGlnaHQudHJpZ2dlcih0ZXh0RWRpdG9yKVxuICAgICAgaWYgKCFyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFpbnRlZCA9IHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0LnBhaW50KHRleHRFZGl0b3IsIHJlc3VsdHMpXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxuICAgICAgICB9XG4gICAgICB9KSlcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuY29tbWFuZHMub25IaWdobGlnaHRzSGlkZShmdW5jdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQocGFpbnRlZClcbiAgICAgIHRoaXMuYWN0aXZlID0gc3Vic2NyaXB0aW9uc1xuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0pXG4gIH1cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5jb21tYW5kcy5hY3RpdmF0ZSgpXG4gIH1cbiAgY29uc3VtZUxpc3RQcm92aWRlcihwcm92aWRlcjogTGlzdFByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnNMaXN0LmFkZFByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGRlbGV0ZUxpc3RQcm92aWRlcihwcm92aWRlcjogTGlzdFByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnNMaXN0LmRlbGV0ZVByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGNvbnN1bWVIaWdobGlnaHRQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC5hZGRQcm92aWRlcihwcm92aWRlcilcbiAgfVxuICBkZWxldGVIaWdobGlnaHRQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC5kZWxldGVQcm92aWRlcihwcm92aWRlcilcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuYWN0aXZlLmRpc3Bvc2UoKVxuICAgIH1cbiAgfVxufVxuIl19