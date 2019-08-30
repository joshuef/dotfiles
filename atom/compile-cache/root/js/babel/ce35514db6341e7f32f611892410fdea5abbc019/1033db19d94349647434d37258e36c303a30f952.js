Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ms = require('ms');

var _ms2 = _interopRequireDefault(_ms);

var _atom = require('atom');

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

var Registry = (function () {
  function Registry() {
    _classCallCheck(this, Registry);

    this.emitter = new _atom.Emitter();
    this.providers = new Set();
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(this.emitter);

    this.statuses = new Map();
    this.statusHistory = [];
  }

  // Public method

  _createClass(Registry, [{
    key: 'create',
    value: function create() {
      var _this = this;

      var provider = new _provider2['default']();
      provider.onDidAdd(function (status) {
        _this.statusAdd(provider, status);
      });
      provider.onDidRemove(function (title) {
        _this.statusRemove(provider, title);
      });
      provider.onDidClear(function () {
        _this.statusClear(provider);
      });
      provider.onDidDispose(function () {
        _this.statusClear(provider);
        _this.providers['delete'](provider);
      });
      this.providers.add(provider);
      return provider;
    }
  }, {
    key: 'statusAdd',
    value: function statusAdd(provider, title) {
      var key = provider.id + '::' + title;
      if (this.statuses.has(key)) {
        // This will help catch bugs in providers
        throw new Error('Status \'' + title + '\' is already set');
      }

      var entry = {
        key: key,
        title: title,
        provider: provider,
        timeStarted: Date.now(),
        timeStopped: null
      };
      this.statuses.set(entry.key, entry);
      this.emitter.emit('did-update');
    }
  }, {
    key: 'statusRemove',
    value: function statusRemove(provider, title) {
      var key = provider.id + '::' + title;
      var value = this.statuses.get(key);
      if (value) {
        this.pushIntoHistory(value);
        this.statuses['delete'](key);
        this.emitter.emit('did-update');
      }
    }
  }, {
    key: 'statusClear',
    value: function statusClear(provider) {
      var _this2 = this;

      var triggerUpdate = false;
      this.statuses.forEach(function (value) {
        if (value.provider === provider) {
          triggerUpdate = true;
          _this2.pushIntoHistory(value);
          _this2.statuses['delete'](value.key);
        }
      });
      if (triggerUpdate) {
        this.emitter.emit('did-update');
      }
    }
  }, {
    key: 'pushIntoHistory',
    value: function pushIntoHistory(status) {
      status.timeStopped = Date.now();
      var i = this.statusHistory.length;
      while (i--) {
        if (this.statusHistory[i].key === status.key) {
          this.statusHistory.splice(i, 1);
          break;
        }
      }
      this.statusHistory.push(status);
      this.statusHistory = this.statusHistory.slice(-10);
    }
  }, {
    key: 'getTilesActive',
    value: function getTilesActive() {
      return Array.from(this.statuses.values()).sort(function (a, b) {
        return b.timeStarted - a.timeStarted;
      }).map(function (a) {
        return a.title;
      });
    }
  }, {
    key: 'getTilesOld',
    value: function getTilesOld() {
      var _this3 = this;

      var oldTiles = [];

      this.statusHistory.forEach(function (entry) {
        if (_this3.statuses.has(entry.key)) return;
        oldTiles.push({
          title: entry.title,
          duration: (0, _ms2['default'])((entry.timeStopped || 0) - entry.timeStarted)
        });
      });

      return oldTiles;
    }
  }, {
    key: 'onDidUpdate',
    value: function onDidUpdate(callback) {
      return this.emitter.on('did-update', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      for (var provider of this.providers) {
        provider.dispose();
      }
    }
  }]);

  return Registry;
})();

exports['default'] = Registry;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL3JlZ2lzdHJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7a0JBRWUsSUFBSTs7OztvQkFDMEIsTUFBTTs7d0JBRzlCLFlBQVk7Ozs7SUFHWixRQUFRO0FBUWhCLFdBUlEsUUFBUSxHQVFiOzBCQVJLLFFBQVE7O0FBU3pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDMUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7O0FBRXBDLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUN6QixRQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQTtHQUN4Qjs7OztlQWhCa0IsUUFBUTs7V0FrQnJCLGtCQUFhOzs7QUFDakIsVUFBTSxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUMvQixjQUFRLENBQUMsUUFBUSxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQzVCLGNBQUssU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtPQUNqQyxDQUFDLENBQUE7QUFDRixjQUFRLENBQUMsV0FBVyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQzlCLGNBQUssWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTtPQUNuQyxDQUFDLENBQUE7QUFDRixjQUFRLENBQUMsVUFBVSxDQUFDLFlBQU07QUFDeEIsY0FBSyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDM0IsQ0FBQyxDQUFBO0FBQ0YsY0FBUSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQzFCLGNBQUssV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzFC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QUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztlQUFLLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVc7T0FBQSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQztlQUFJLENBQUMsQ0FBQyxLQUFLO09BQUEsQ0FBQyxDQUFBO0tBQzFHOzs7V0FDVSx1QkFBK0M7OztBQUN4RCxVQUFNLFFBQVEsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQ3BDLFlBQUksT0FBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFNO0FBQ3hDLGdCQUFRLENBQUMsSUFBSSxDQUFDO0FBQ1osZUFBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO0FBQ2xCLGtCQUFRLEVBQUUscUJBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQSxHQUFJLEtBQUssQ0FBQyxXQUFXLENBQUM7U0FDM0QsQ0FBQyxDQUFBO09BQ0gsQ0FBQyxDQUFBOztBQUVGLGFBQU8sUUFBUSxDQUFBO0tBQ2hCOzs7V0FDVSxxQkFBQyxRQUFrQixFQUFjO0FBQzFDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQy9DOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDNUIsV0FBSyxJQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ3JDLGdCQUFRLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDbkI7S0FDRjs7O1NBL0drQixRQUFROzs7cUJBQVIsUUFBUSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2J1c3ktc2lnbmFsL2xpYi9yZWdpc3RyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCBtcyBmcm9tICdtcydcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcblxuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4vcHJvdmlkZXInXG5pbXBvcnQgdHlwZSB7IFNpZ25hbEludGVybmFsIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVnaXN0cnkge1xuICBlbWl0dGVyOiBFbWl0dGVyXG4gIHByb3ZpZGVyczogU2V0PFByb3ZpZGVyPlxuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgc3RhdHVzZXM6IE1hcDxzdHJpbmcsIFNpZ25hbEludGVybmFsPlxuICBzdGF0dXNIaXN0b3J5OiBBcnJheTxTaWduYWxJbnRlcm5hbD5cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5wcm92aWRlcnMgPSBuZXcgU2V0KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG5cbiAgICB0aGlzLnN0YXR1c2VzID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zdGF0dXNIaXN0b3J5ID0gW11cbiAgfVxuICAvLyBQdWJsaWMgbWV0aG9kXG4gIGNyZWF0ZSgpOiBQcm92aWRlciB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgUHJvdmlkZXIoKVxuICAgIHByb3ZpZGVyLm9uRGlkQWRkKChzdGF0dXMpID0+IHtcbiAgICAgIHRoaXMuc3RhdHVzQWRkKHByb3ZpZGVyLCBzdGF0dXMpXG4gICAgfSlcbiAgICBwcm92aWRlci5vbkRpZFJlbW92ZSgodGl0bGUpID0+IHtcbiAgICAgIHRoaXMuc3RhdHVzUmVtb3ZlKHByb3ZpZGVyLCB0aXRsZSlcbiAgICB9KVxuICAgIHByb3ZpZGVyLm9uRGlkQ2xlYXIoKCkgPT4ge1xuICAgICAgdGhpcy5zdGF0dXNDbGVhcihwcm92aWRlcilcbiAgICB9KVxuICAgIHByb3ZpZGVyLm9uRGlkRGlzcG9zZSgoKSA9PiB7XG4gICAgICB0aGlzLnN0YXR1c0NsZWFyKHByb3ZpZGVyKVxuICAgICAgdGhpcy5wcm92aWRlcnMuZGVsZXRlKHByb3ZpZGVyKVxuICAgIH0pXG4gICAgdGhpcy5wcm92aWRlcnMuYWRkKHByb3ZpZGVyKVxuICAgIHJldHVybiBwcm92aWRlclxuICB9XG4gIHN0YXR1c0FkZChwcm92aWRlcjogUHJvdmlkZXIsIHRpdGxlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBrZXkgPSBgJHtwcm92aWRlci5pZH06OiR7dGl0bGV9YFxuICAgIGlmICh0aGlzLnN0YXR1c2VzLmhhcyhrZXkpKSB7XG4gICAgICAvLyBUaGlzIHdpbGwgaGVscCBjYXRjaCBidWdzIGluIHByb3ZpZGVyc1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdGF0dXMgJyR7dGl0bGV9JyBpcyBhbHJlYWR5IHNldGApXG4gICAgfVxuXG4gICAgY29uc3QgZW50cnkgPSB7XG4gICAgICBrZXksXG4gICAgICB0aXRsZSxcbiAgICAgIHByb3ZpZGVyLFxuICAgICAgdGltZVN0YXJ0ZWQ6IERhdGUubm93KCksXG4gICAgICB0aW1lU3RvcHBlZDogbnVsbCxcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNlcy5zZXQoZW50cnkua2V5LCBlbnRyeSlcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXVwZGF0ZScpXG4gIH1cbiAgc3RhdHVzUmVtb3ZlKHByb3ZpZGVyOiBQcm92aWRlciwgdGl0bGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGtleSA9IGAke3Byb3ZpZGVyLmlkfTo6JHt0aXRsZX1gXG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLnN0YXR1c2VzLmdldChrZXkpXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLnB1c2hJbnRvSGlzdG9yeSh2YWx1ZSlcbiAgICAgIHRoaXMuc3RhdHVzZXMuZGVsZXRlKGtleSlcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtdXBkYXRlJylcbiAgICB9XG4gIH1cbiAgc3RhdHVzQ2xlYXIocHJvdmlkZXI6IFByb3ZpZGVyKTogdm9pZCB7XG4gICAgbGV0IHRyaWdnZXJVcGRhdGUgPSBmYWxzZVxuICAgIHRoaXMuc3RhdHVzZXMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWx1ZS5wcm92aWRlciA9PT0gcHJvdmlkZXIpIHtcbiAgICAgICAgdHJpZ2dlclVwZGF0ZSA9IHRydWVcbiAgICAgICAgdGhpcy5wdXNoSW50b0hpc3RvcnkodmFsdWUpXG4gICAgICAgIHRoaXMuc3RhdHVzZXMuZGVsZXRlKHZhbHVlLmtleSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGlmICh0cmlnZ2VyVXBkYXRlKSB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXVwZGF0ZScpXG4gICAgfVxuICB9XG4gIHB1c2hJbnRvSGlzdG9yeShzdGF0dXM6IFNpZ25hbEludGVybmFsKTogdm9pZCB7XG4gICAgc3RhdHVzLnRpbWVTdG9wcGVkID0gRGF0ZS5ub3coKVxuICAgIGxldCBpID0gdGhpcy5zdGF0dXNIaXN0b3J5Lmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGlmICh0aGlzLnN0YXR1c0hpc3RvcnlbaV0ua2V5ID09PSBzdGF0dXMua2V5KSB7XG4gICAgICAgIHRoaXMuc3RhdHVzSGlzdG9yeS5zcGxpY2UoaSwgMSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zdGF0dXNIaXN0b3J5LnB1c2goc3RhdHVzKVxuICAgIHRoaXMuc3RhdHVzSGlzdG9yeSA9IHRoaXMuc3RhdHVzSGlzdG9yeS5zbGljZSgtMTApXG4gIH1cbiAgZ2V0VGlsZXNBY3RpdmUoKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5zdGF0dXNlcy52YWx1ZXMoKSkuc29ydCgoYSwgYikgPT4gYi50aW1lU3RhcnRlZCAtIGEudGltZVN0YXJ0ZWQpLm1hcChhID0+IGEudGl0bGUpXG4gIH1cbiAgZ2V0VGlsZXNPbGQoKTogQXJyYXk8eyB0aXRsZTogc3RyaW5nLCBkdXJhdGlvbjogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBvbGRUaWxlcyA9IFtdXG5cbiAgICB0aGlzLnN0YXR1c0hpc3RvcnkuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgIGlmICh0aGlzLnN0YXR1c2VzLmhhcyhlbnRyeS5rZXkpKSByZXR1cm5cbiAgICAgIG9sZFRpbGVzLnB1c2goe1xuICAgICAgICB0aXRsZTogZW50cnkudGl0bGUsXG4gICAgICAgIGR1cmF0aW9uOiBtcygoZW50cnkudGltZVN0b3BwZWQgfHwgMCkgLSBlbnRyeS50aW1lU3RhcnRlZCksXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByZXR1cm4gb2xkVGlsZXNcbiAgfVxuICBvbkRpZFVwZGF0ZShjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtdXBkYXRlJywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgZm9yIChjb25zdCBwcm92aWRlciBvZiB0aGlzLnByb3ZpZGVycykge1xuICAgICAgcHJvdmlkZXIuZGlzcG9zZSgpXG4gICAgfVxuICB9XG59XG4iXX0=