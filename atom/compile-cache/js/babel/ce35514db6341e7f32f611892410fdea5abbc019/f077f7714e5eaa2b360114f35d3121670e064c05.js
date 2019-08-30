Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// eslint-disable-next-line import/no-unresolved

var _atom = require("atom");

var _disposify = require("disposify");

var _disposify2 = _interopRequireDefault(_disposify);

var _element = require("./element");

var _element2 = _interopRequireDefault(_element);

var _registry = require("./registry");

var _registry2 = _interopRequireDefault(_registry);

var _atomIdeProvider = require("./atom-ide-provider");

var BusySignal = (function () {
  function BusySignal() {
    var _this = this;

    _classCallCheck(this, BusySignal);

    this.element = new _element2["default"]();
    this.registry = new _registry2["default"]();
    this.atomIdeProvider = new _atomIdeProvider.AtomIdeProvider(function () {
      return _this.registry.create();
    });
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.element);
    this.subscriptions.add(this.registry);

    this.registry.onDidUpdate(function () {
      _this.element.update(_this.registry.getTilesActive(), _this.registry.getTilesOld());
    });
  }

  _createClass(BusySignal, [{
    key: "attach",
    value: function attach(statusBar) {
      this.subscriptions.add((0, _disposify2["default"])(statusBar.addRightTile({
        item: this.element,
        priority: 500
      })));
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return BusySignal;
})();

exports["default"] = BusySignal;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O29CQUdvQyxNQUFNOzt5QkFDcEIsV0FBVzs7Ozt1QkFDYixXQUFXOzs7O3dCQUNWLFlBQVk7Ozs7K0JBQ0QscUJBQXFCOztJQUVoQyxVQUFVO0FBTWxCLFdBTlEsVUFBVSxHQU1mOzs7MEJBTkssVUFBVTs7QUFPM0IsUUFBSSxDQUFDLE9BQU8sR0FBRywwQkFBYSxDQUFDO0FBQzdCLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQztBQUMvQixRQUFJLENBQUMsZUFBZSxHQUFHLHFDQUFvQjthQUFNLE1BQUssUUFBUSxDQUFDLE1BQU0sRUFBRTtLQUFBLENBQUMsQ0FBQztBQUN6RSxRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFDOztBQUUvQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV0QyxRQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFNO0FBQzlCLFlBQUssT0FBTyxDQUFDLE1BQU0sQ0FDakIsTUFBSyxRQUFRLENBQUMsY0FBYyxFQUFFLEVBQzlCLE1BQUssUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUM1QixDQUFDO0tBQ0gsQ0FBQyxDQUFDO0dBQ0o7O2VBckJrQixVQUFVOztXQXNCdkIsZ0JBQUMsU0FBaUIsRUFBRTtBQUN4QixVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsNEJBQ0UsU0FBUyxDQUFDLFlBQVksQ0FBQztBQUNyQixZQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU87QUFDbEIsZ0JBQVEsRUFBRSxHQUFHO09BQ2QsQ0FBQyxDQUNILENBQ0YsQ0FBQztLQUNIOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDOUI7OztTQWxDa0IsVUFBVTs7O3FCQUFWLFVBQVUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9idXN5LXNpZ25hbC9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tdW5yZXNvbHZlZFxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgZGlzcG9zaWZ5IGZyb20gXCJkaXNwb3NpZnlcIjtcbmltcG9ydCBFbGVtZW50IGZyb20gXCIuL2VsZW1lbnRcIjtcbmltcG9ydCBSZWdpc3RyeSBmcm9tIFwiLi9yZWdpc3RyeVwiO1xuaW1wb3J0IHsgQXRvbUlkZVByb3ZpZGVyIH0gZnJvbSBcIi4vYXRvbS1pZGUtcHJvdmlkZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnVzeVNpZ25hbCB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIHJlZ2lzdHJ5OiBSZWdpc3RyeTtcbiAgYXRvbUlkZVByb3ZpZGVyOiBBdG9tSWRlUHJvdmlkZXI7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gbmV3IEVsZW1lbnQoKTtcbiAgICB0aGlzLnJlZ2lzdHJ5ID0gbmV3IFJlZ2lzdHJ5KCk7XG4gICAgdGhpcy5hdG9tSWRlUHJvdmlkZXIgPSBuZXcgQXRvbUlkZVByb3ZpZGVyKCgpID0+IHRoaXMucmVnaXN0cnkuY3JlYXRlKCkpO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnJlZ2lzdHJ5KTtcblxuICAgIHRoaXMucmVnaXN0cnkub25EaWRVcGRhdGUoKCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50LnVwZGF0ZShcbiAgICAgICAgdGhpcy5yZWdpc3RyeS5nZXRUaWxlc0FjdGl2ZSgpLFxuICAgICAgICB0aGlzLnJlZ2lzdHJ5LmdldFRpbGVzT2xkKClcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgYXR0YWNoKHN0YXR1c0JhcjogT2JqZWN0KSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGRpc3Bvc2lmeShcbiAgICAgICAgc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XG4gICAgICAgICAgaXRlbTogdGhpcy5lbGVtZW50LFxuICAgICAgICAgIHByaW9yaXR5OiA1MDBcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICApO1xuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxufVxuIl19