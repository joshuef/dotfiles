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
    this.listCache = new WeakMap();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzBCQUVnRCxjQUFjOzt3QkFFekMsWUFBWTs7Ozt3QkFDWixhQUFhOzs7OzZCQUNSLGtCQUFrQjs7OztrQ0FDYix1QkFBdUI7Ozs7SUFHakMsVUFBVTtBQVFsQixXQVJRLFVBQVUsR0FRZjs7OzBCQVJLLFVBQVU7O0FBUzNCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUM5QixRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7QUFDOUIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFBO0FBQ25DLFFBQUksQ0FBQyxhQUFhLEdBQUcsZ0NBQW1CLENBQUE7QUFDeEMsUUFBSSxDQUFDLGtCQUFrQixHQUFHLHFDQUF3QixDQUFBO0FBQ2xELFFBQUksQ0FBQyxhQUFhLEdBQUcscUNBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNyQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDMUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUE7OztBQUcvQyxRQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsbUJBQUMsV0FBTyxVQUFVLEVBQUs7QUFDN0MsVUFBSSxPQUFPLFlBQUEsQ0FBQTtBQUNYLFVBQU0sTUFBTSxHQUFHLE1BQUssU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUM3QyxVQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDdkMsVUFBSSxNQUFN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Rjs7O1NBN0hrQixVQUFVOzs7cUJBQVYsVUFBVSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9pbnRlbnRpb25zL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ3NiLWV2ZW50LWtpdCdcblxuaW1wb3J0IENvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgTGlzdFZpZXcgZnJvbSAnLi92aWV3LWxpc3QnXG5pbXBvcnQgUHJvdmlkZXJzTGlzdCBmcm9tICcuL3Byb3ZpZGVycy1saXN0J1xuaW1wb3J0IFByb3ZpZGVyc0hpZ2hsaWdodCBmcm9tICcuL3Byb3ZpZGVycy1oaWdobGlnaHQnXG5pbXBvcnQgdHlwZSB7IExpc3RQcm92aWRlciwgSGlnaGxpZ2h0UHJvdmlkZXIsIEhpZ2hsaWdodEl0ZW0sIExpc3RJdGVtIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW50ZW50aW9ucyB7XG4gIGFjdGl2ZTogP0Rpc3Bvc2FibGU7XG4gIGNvbW1hbmRzOiBDb21tYW5kcztcbiAgbGlzdENhY2hlOiBXZWFrTWFwPE9iamVjdCwgeyB0ZXh0OiBzdHJpbmcsIHJlc3VsdHM6IEFycmF5PExpc3RJdGVtPiB9PlxuICBoaWdobGlnaHRDYWNoZTogV2Vha01hcDxPYmplY3QsIHsgdGV4dDogc3RyaW5nLCByZXN1bHRzOiBBcnJheTxIaWdobGlnaHRJdGVtPiB9PlxuICBwcm92aWRlcnNMaXN0OiBQcm92aWRlcnNMaXN0O1xuICBwcm92aWRlcnNIaWdobGlnaHQ6IFByb3ZpZGVyc0hpZ2hsaWdodDtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5hY3RpdmUgPSBudWxsXG4gICAgdGhpcy5jb21tYW5kcyA9IG5ldyBDb21tYW5kcygpXG4gICAgdGhpcy5saXN0Q2FjaGUgPSBuZXcgV2Vha01hcCgpXG4gICAgdGhpcy5oaWdobGlnaHRDYWNoZSA9IG5ldyBXZWFrTWFwKClcbiAgICB0aGlzLnByb3ZpZGVyc0xpc3QgPSBuZXcgUHJvdmlkZXJzTGlzdCgpXG4gICAgdGhpcy5wcm92aWRlcnNIaWdobGlnaHQgPSBuZXcgUHJvdmlkZXJzSGlnaGxpZ2h0KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuY29tbWFuZHMpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnByb3ZpZGVyc0xpc3QpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodClcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBhcnJvdy1wYXJlbnNcbiAgICB0aGlzLmNvbW1hbmRzLm9uTGlzdFNob3coYXN5bmMgKHRleHRFZGl0b3IpID0+IHtcbiAgICAgIGxldCByZXN1bHRzXG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLmxpc3RDYWNoZS5nZXQodGV4dEVkaXRvcilcbiAgICAgIGNvbnN0IGVkaXRvclRleHQgPSB0ZXh0RWRpdG9yLmdldFRleHQoKVxuICAgICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQudGV4dCA9PT0gZWRpdG9yVGV4dCkge1xuICAgICAgICByZXN1bHRzID0gY2FjaGVkLnJlc3VsdHNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLnByb3ZpZGVyc0xpc3QudHJpZ2dlcih0ZXh0RWRpdG9yKVxuICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmxpc3RDYWNoZS5zZXQodGV4dEVkaXRvciwge1xuICAgICAgICAgICAgdGV4dDogZWRpdG9yVGV4dCxcbiAgICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGlzdFZpZXcgPSBuZXcgTGlzdFZpZXcoKVxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgICAgbGlzdFZpZXcuYWN0aXZhdGUodGV4dEVkaXRvciwgcmVzdWx0cylcbiAgICAgIGxpc3RWaWV3Lm9uRGlkU2VsZWN0KGZ1bmN0aW9uKGludGVudGlvbikge1xuICAgICAgICBpbnRlbnRpb24uc2VsZWN0ZWQoKVxuICAgICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgfSlcblxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQobGlzdFZpZXcpXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkxpc3RNb3ZlKGZ1bmN0aW9uKG1vdmVtZW50KSB7XG4gICAgICAgIGxpc3RWaWV3Lm1vdmUobW92ZW1lbnQpXG4gICAgICB9KSlcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuY29tbWFuZHMub25MaXN0Q29uZmlybShmdW5jdGlvbigpIHtcbiAgICAgICAgbGlzdFZpZXcuc2VsZWN0KClcbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5jb21tYW5kcy5vbkxpc3RIaWRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgfSkpXG4gICAgICB0aGlzLmFjdGl2ZSA9IHN1YnNjcmlwdGlvbnNcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSlcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgYXJyb3ctcGFyZW5zXG4gICAgdGhpcy5jb21tYW5kcy5vbkhpZ2hsaWdodHNTaG93KGFzeW5jICh0ZXh0RWRpdG9yKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0c1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5oaWdobGlnaHRDYWNoZS5nZXQodGV4dEVkaXRvcilcbiAgICAgIGNvbnN0IGVkaXRvclRleHQgPSB0ZXh0RWRpdG9yLmdldFRleHQoKVxuICAgICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQudGV4dCA9PT0gZWRpdG9yVGV4dCkge1xuICAgICAgICByZXN1bHRzID0gY2FjaGVkLnJlc3VsdHNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC50cmlnZ2VyKHRleHRFZGl0b3IpXG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0Q2FjaGUuc2V0KHRleHRFZGl0b3IsIHtcbiAgICAgICAgICAgIHRleHQ6IGVkaXRvclRleHQsXG4gICAgICAgICAgICByZXN1bHRzLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghcmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBhaW50ZWQgPSB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC5wYWludCh0ZXh0RWRpdG9yLCByZXN1bHRzKVxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuY29tbWFuZHMub25IaWdobGlnaHRzSGlkZShmdW5jdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIH0pKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQocGFpbnRlZClcbiAgICAgIHRoaXMuYWN0aXZlID0gc3Vic2NyaXB0aW9uc1xuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0pXG4gIH1cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5jb21tYW5kcy5hY3RpdmF0ZSgpXG4gIH1cbiAgY29uc3VtZUxpc3RQcm92aWRlcihwcm92aWRlcjogTGlzdFByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnNMaXN0LmFkZFByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGRlbGV0ZUxpc3RQcm92aWRlcihwcm92aWRlcjogTGlzdFByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnNMaXN0LmRlbGV0ZVByb3ZpZGVyKHByb3ZpZGVyKVxuICB9XG4gIGNvbnN1bWVIaWdobGlnaHRQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC5hZGRQcm92aWRlcihwcm92aWRlcilcbiAgfVxuICBkZWxldGVIaWdobGlnaHRQcm92aWRlcihwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0hpZ2hsaWdodC5kZWxldGVQcm92aWRlcihwcm92aWRlcilcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuYWN0aXZlLmRpc3Bvc2UoKVxuICAgIH1cbiAgfVxufVxuIl19