Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _sbEventKit = require('sb-event-kit');

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
    this.highlightCache = new WeakMap();
    this.providersList = new _providersList2['default']();
    this.providersHighlight = new _providersHighlight2['default']();
    this.subscriptions = new _sbEventKit.CompositeDisposable();

    this.subscriptions.add(this.commands);
    this.subscriptions.add(this.providersList);
    this.subscriptions.add(this.providersHighlight);

    // eslint-disable-next-line arrow-parens
    this.commands.onListShow(_asyncToGenerator(function* (textEditor) {
      var results = undefined;
      var cached = _this.listCache.get(textEditor);
      var editorText = textEditor.getText();
      if (cached && cached.text === editorText) {
        results = cached.results;
      } else {
        results = yield _this.providersList.trigger(textEditor);
        if (results.length) {
          _this.listCache.set(textEditor, {
            text: editorText,
            results: results
          });
        }
      }
      if (!results.length) {
        return false;
      }

      var listView = new _viewList2['default']();
      var subscriptions = new _sbEventKit.CompositeDisposable();

      listView.activate(textEditor, results);
      listView.onDidSelect(function (intention) {
        intention.selected();
        subscriptions.dispose();
      });

      subscriptions.add(listView);
      subscriptions.add(function () {
        if (_this.active === subscriptions) {
          _this.active = null;
        }
      });
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
    // eslint-disable-next-line arrow-parens
    this.commands.onHighlightsShow(_asyncToGenerator(function* (textEditor) {
      var results = undefined;
      var cached = _this.highlightCache.get(textEditor);
      var editorText = textEditor.getText();
      if (cached && cached.text === editorText) {
        results = cached.results;
      } else {
        results = yield _this.providersHighlight.trigger(textEditor);
        if (results.length) {
          _this.highlightCache.set(textEditor, {
            text: editorText,
            results: results
          });
        }
      }
      if (!results.length) {
        return false;
      }

      var painted = _this.providersHighlight.paint(textEditor, results);
      var subscriptions = new _sbEventKit.CompositeDisposable();

      subscriptions.add(function () {
        if (_this.active === subscriptions) {
          _this.active = null;
        }
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzBCQUVnRCxjQUFjOzt3QkFFekMsWUFBWTs7Ozt3QkFDWixhQUFhOzs7OzZCQUNSLGtCQUFrQjs7OztrQ0FDYix1QkFBdUI7Ozs7SUFHakMsVUFBVTtBQVFsQixXQVJRLFVBQVUsR0FRZjs7OzBCQVJLLFVBQVU7O0FBUzNCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUM5QixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7QUFDbkMsUUFBSSxDQUFDLGFBQWEsR0FBRyxnQ0FBbUIsQ0FBQTtBQUN4QyxRQUFJLENBQUMsa0JBQWtCLEdBQUcscUNBQXdCLENBQUE7QUFDbEQsUUFBSSxDQUFDLGFBQWEsR0FBRyxxQ0FBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ3JDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUMxQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQTs7O0FBRy9DLFFBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxtQkFBQyxXQUFPLFVBQVUsRUFBSztBQUM3QyxVQUFJLE9BQU8sWUFBQSxDQUFBO0FBQ1gsVUFBTSxNQUFNLEdBQUcsTUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQzdDLFVBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUN2QyxVQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtBQUN4QyxlQUFP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b3NoLy5hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnc2ItZXZlbnQta2l0J1xuXG5pbXBvcnQgQ29tbWFuZHMgZnJvbSAnLi9jb21tYW5kcydcbmltcG9ydCBMaXN0VmlldyBmcm9tICcuL3ZpZXctbGlzdCdcbmltcG9ydCBQcm92aWRlcnNMaXN0IGZyb20gJy4vcHJvdmlkZXJzLWxpc3QnXG5pbXBvcnQgUHJvdmlkZXJzSGlnaGxpZ2h0IGZyb20gJy4vcHJvdmlkZXJzLWhpZ2hsaWdodCdcbmltcG9ydCB0eXBlIHsgTGlzdFByb3ZpZGVyLCBIaWdobGlnaHRQcm92aWRlciwgSGlnaGxpZ2h0SXRlbSwgTGlzdEl0ZW0gfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnRlbnRpb25zIHtcbiAgYWN0aXZlOiA/RGlzcG9zYWJsZTtcbiAgY29tbWFuZHM6IENvbW1hbmRzO1xuICBsaXN0Q2FjaGU6IFdlYWtNYXA8T2JqZWN0LCB7IHRleHQ6IHN0cmluZywgcmVzdWx0czogQXJyYXk8TGlzdEl0ZW0+IH0+XG4gIGhpZ2hsaWdodENhY2hlOiBXZWFrTWFwPE9iamVjdCwgeyB0ZXh0OiBzdHJpbmcsIHJlc3VsdHM6IEFycmF5PEhpZ2hsaWdodEl0ZW0+IH0+XG4gIHByb3ZpZGVyc0xpc3Q6IFByb3ZpZGVyc0xpc3Q7XG4gIHByb3ZpZGVyc0hpZ2hsaWdodDogUHJvdmlkZXJzSGlnaGxpZ2h0O1xuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmFjdGl2ZSA9IG51bGxcbiAgICB0aGlzLmNvbW1hbmRzID0gbmV3IENvbW1hbmRzKClcbiAgICB0aGlzLmhpZ2hsaWdodENhY2hlID0gbmV3IFdlYWtNYXAoKVxuICAgIHRoaXMucHJvdmlkZXJzTGlzdCA9IG5ldyBQcm92aWRlcnNMaXN0KClcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodCA9IG5ldyBQcm92aWRlcnNIaWdobGlnaHQoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucHJvdmlkZXJzTGlzdClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0KVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGFycm93LXBhcmVuc1xuICAgIHRoaXMuY29tbWFuZHMub25MaXN0U2hvdyhhc3luYyAodGV4dEVkaXRvcikgPT4ge1xuICAgICAgbGV0IHJlc3VsdHNcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMubGlzdENhY2hlLmdldCh0ZXh0RWRpdG9yKVxuICAgICAgY29uc3QgZWRpdG9yVGV4dCA9IHRleHRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgICBpZiAoY2FjaGVkICYmIGNhY2hlZC50ZXh0ID09PSBlZGl0b3JUZXh0KSB7XG4gICAgICAgIHJlc3VsdHMgPSBjYWNoZWQucmVzdWx0c1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMucHJvdmlkZXJzTGlzdC50cmlnZ2VyKHRleHRFZGl0b3IpXG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMubGlzdENhY2hlLnNldCh0ZXh0RWRpdG9yLCB7XG4gICAgICAgICAgICB0ZXh0OiBlZGl0b3JUZXh0LFxuICAgICAgICAgICAgcmVzdWx0cyxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBMaXN0VmlldygpXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgICBsaXN0Vmlldy5hY3RpdmF0ZSh0ZXh0RWRpdG9yLCByZXN1bHRzKVxuICAgICAgbGlzdFZpZXcub25EaWRTZWxlY3QoZnVuY3Rpb24oaW50ZW50aW9uKSB7XG4gICAgICAgIGludGVudGlvbi5zZWxlY3RlZCgpXG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICB9KVxuXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChsaXN0VmlldylcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBzdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZCh0aGlzLmNvbW1hbmRzLm9uTGlzdE1vdmUoZnVuY3Rpb24obW92ZW1lbnQpIHtcbiAgICAgICAgbGlzdFZpZXcubW92ZShtb3ZlbWVudClcbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkxpc3RDb25maXJtKGZ1bmN0aW9uKCkge1xuICAgICAgICBsaXN0Vmlldy5zZWxlY3QoKVxuICAgICAgfSkpXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZCh0aGlzLmNvbW1hbmRzLm9uTGlzdEhpZGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICB9KSlcbiAgICAgIHRoaXMuYWN0aXZlID0gc3Vic2NyaXB0aW9uc1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9KVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBhcnJvdy1wYXJlbnNcbiAgICB0aGlzLmNvbW1hbmRzLm9uSGlnaGxpZ2h0c1Nob3coYXN5bmMgKHRleHRFZGl0b3IpID0+IHtcbiAgICAgIGxldCByZXN1bHRzXG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLmhpZ2hsaWdodENhY2hlLmdldCh0ZXh0RWRpdG9yKVxuICAgICAgY29uc3QgZWRpdG9yVGV4dCA9IHRleHRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgICBpZiAoY2FjaGVkICYmIGNhY2hlZC50ZXh0ID09PSBlZGl0b3JUZXh0KSB7XG4gICAgICAgIHJlc3VsdHMgPSBjYWNoZWQucmVzdWx0c1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0LnRyaWdnZXIodGV4dEVkaXRvcilcbiAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRDYWNoZS5zZXQodGV4dEVkaXRvciwge1xuICAgICAgICAgICAgdGV4dDogZWRpdG9yVGV4dCxcbiAgICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFpbnRlZCA9IHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0LnBhaW50KHRleHRFZGl0b3IsIHJlc3VsdHMpXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkhpZ2hsaWdodHNIaWRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgfSkpXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChwYWludGVkKVxuICAgICAgdGhpcy5hY3RpdmUgPSBzdWJzY3JpcHRpb25zXG5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSlcbiAgfVxuICBhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLmNvbW1hbmRzLmFjdGl2YXRlKClcbiAgfVxuICBjb25zdW1lTGlzdFByb3ZpZGVyKHByb3ZpZGVyOiBMaXN0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0xpc3QuYWRkUHJvdmlkZXIocHJvdmlkZXIpXG4gIH1cbiAgZGVsZXRlTGlzdFByb3ZpZGVyKHByb3ZpZGVyOiBMaXN0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0xpc3QuZGVsZXRlUHJvdmlkZXIocHJvdmlkZXIpXG4gIH1cbiAgY29uc3VtZUhpZ2hsaWdodFByb3ZpZGVyKHByb3ZpZGVyOiBIaWdobGlnaHRQcm92aWRlcikge1xuICAgIHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0LmFkZFByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGRlbGV0ZUhpZ2hsaWdodFByb3ZpZGVyKHByb3ZpZGVyOiBIaWdobGlnaHRQcm92aWRlcikge1xuICAgIHRoaXMucHJvdmlkZXJzSGlnaGxpZ2h0LmRlbGV0ZVByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgICAgdGhpcy5hY3RpdmUuZGlzcG9zZSgpXG4gICAgfVxuICB9XG59XG4iXX0=