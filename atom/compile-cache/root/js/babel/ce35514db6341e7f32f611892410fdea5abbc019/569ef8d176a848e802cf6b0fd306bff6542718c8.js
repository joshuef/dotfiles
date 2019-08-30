Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _disposify = require('disposify');

var _disposify2 = _interopRequireDefault(_disposify);

var _element = require('./element');

var _element2 = _interopRequireDefault(_element);

var _registry = require('./registry');

var _registry2 = _interopRequireDefault(_registry);

var BusySignal = (function () {
  function BusySignal() {
    var _this = this;

    _classCallCheck(this, BusySignal);

    this.element = new _element2['default']();
    this.registry = new _registry2['default']();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.element);
    this.subscriptions.add(this.registry);

    this.registry.onDidUpdate(function () {
      _this.element.update(_this.registry.getTilesActive(), _this.registry.getTilesOld());
    });
  }

  _createClass(BusySignal, [{
    key: 'attach',
    value: function attach(statusBar) {
      this.subscriptions.add((0, _disposify2['default'])(statusBar.addRightTile({
        item: this.element,
        priority: 500
      })));
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return BusySignal;
})();

exports['default'] = BusySignal;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFb0MsTUFBTTs7eUJBQ3BCLFdBQVc7Ozs7dUJBQ2IsV0FBVzs7Ozt3QkFDVixZQUFZOzs7O0lBRVosVUFBVTtBQUtsQixXQUxRLFVBQVUsR0FLZjs7OzBCQUxLLFVBQVU7O0FBTTNCLFFBQUksQ0FBQyxPQUFPLEdBQUcsMEJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsUUFBUSxHQUFHLDJCQUFjLENBQUE7QUFDOUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3BDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFckMsUUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBTTtBQUM5QixZQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBSyxRQUFRLENBQUMsY0FBYyxFQUFFLEVBQUUsTUFBSyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQTtLQUNqRixDQUFDLENBQUE7R0FDSDs7ZUFoQmtCLFVBQVU7O1dBaUJ2QixnQkFBQyxTQUFpQixFQUFFO0FBQ3hCLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLDRCQUFVLFNBQVMsQ0FBQyxZQUFZLENBQUM7QUFDdEQsWUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPO0FBQ2xCLGdCQUFRLEVBQUUsR0FBRztPQUNkLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDTDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0F6QmtCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBkaXNwb3NpZnkgZnJvbSAnZGlzcG9zaWZ5J1xuaW1wb3J0IEVsZW1lbnQgZnJvbSAnLi9lbGVtZW50J1xuaW1wb3J0IFJlZ2lzdHJ5IGZyb20gJy4vcmVnaXN0cnknXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1c3lTaWduYWwge1xuICBlbGVtZW50OiBFbGVtZW50O1xuICByZWdpc3RyeTogUmVnaXN0cnk7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gbmV3IEVsZW1lbnQoKVxuICAgIHRoaXMucmVnaXN0cnkgPSBuZXcgUmVnaXN0cnkoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbGVtZW50KVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5yZWdpc3RyeSlcblxuICAgIHRoaXMucmVnaXN0cnkub25EaWRVcGRhdGUoKCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50LnVwZGF0ZSh0aGlzLnJlZ2lzdHJ5LmdldFRpbGVzQWN0aXZlKCksIHRoaXMucmVnaXN0cnkuZ2V0VGlsZXNPbGQoKSlcbiAgICB9KVxuICB9XG4gIGF0dGFjaChzdGF0dXNCYXI6IE9iamVjdCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZGlzcG9zaWZ5KHN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgaXRlbTogdGhpcy5lbGVtZW50LFxuICAgICAgcHJpb3JpdHk6IDUwMCxcbiAgICB9KSkpXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==