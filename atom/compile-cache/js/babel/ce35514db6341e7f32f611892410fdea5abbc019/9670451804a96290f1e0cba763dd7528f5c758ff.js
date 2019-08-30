Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ms = require("ms");

var _ms2 = _interopRequireDefault(_ms);

// eslint-disable-next-line import/no-unresolved

var _atom = require("atom");

var _provider = require("./provider");

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
    key: "create",
    value: function create() {
      var _this = this;

      var provider = new _provider2["default"]();
      provider.onDidAdd(function (_ref) {
        var title = _ref.title;
        var options = _ref.options;

        _this.statusAdd(provider, title, options);
      });
      provider.onDidRemove(function (title) {
        _this.statusRemove(provider, title);
      });
      provider.onDidChangeTitle(function (_ref2) {
        var title = _ref2.title;
        var oldTitle = _ref2.oldTitle;

        _this.statusChangeTitle(provider, title, oldTitle);
      });
      provider.onDidClear(function () {
        _this.statusClear(provider);
      });
      provider.onDidDispose(function () {
        _this.statusClear(provider);
        _this.providers["delete"](provider);
      });
      this.providers.add(provider);
      return provider;
    }
  }, {
    key: "statusAdd",
    value: function statusAdd(provider, title, options) {
      var key = provider.id + "::" + title;
      if (this.statuses.has(key)) {
        // This will help catch bugs in providers
        throw new Error("Status '" + title + "' is already set");
      }

      var entry = {
        key: key,
        title: title,
        provider: provider,
        timeStarted: Date.now(),
        timeStopped: null,
        options: options
      };
      this.statuses.set(entry.key, entry);
      this.emitter.emit("did-update");
    }
  }, {
    key: "statusRemove",
    value: function statusRemove(provider, title) {
      var key = provider.id + "::" + title;
      var value = this.statuses.get(key);
      if (value) {
        this.pushIntoHistory(value);
        this.statuses["delete"](key);
        this.emitter.emit("did-update");
      }
    }
  }, {
    key: "statusChangeTitle",
    value: function statusChangeTitle(provider, title, oldTitle) {
      var oldKey = provider.id + "::" + oldTitle;
      var entry = this.statuses.get(oldKey);
      if (!entry) {
        return;
      }

      this.statuses["delete"](oldKey);

      entry.title = title;
      entry.key = provider.id + "::" + title;

      this.statuses.set(entry.key, entry);
      this.emitter.emit("did-update");
    }
  }, {
    key: "statusClear",
    value: function statusClear(provider) {
      var _this2 = this;

      var triggerUpdate = false;
      this.statuses.forEach(function (value) {
        if (value.provider === provider) {
          triggerUpdate = true;
          _this2.pushIntoHistory(value);
          _this2.statuses["delete"](value.key);
        }
      });
      if (triggerUpdate) {
        this.emitter.emit("did-update");
      }
    }
  }, {
    key: "pushIntoHistory",
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
    key: "getTilesActive",
    value: function getTilesActive() {
      return Array.from(this.statuses.values()).sort(function (a, b) {
        return b.timeStarted - a.timeStarted;
      });
    }
  }, {
    key: "getTilesOld",
    value: function getTilesOld() {
      var _this3 = this;

      var oldTiles = [];

      this.statusHistory.forEach(function (entry) {
        if (_this3.statuses.has(entry.key)) return;
        oldTiles.push({
          title: entry.title,
          duration: (0, _ms2["default"])((entry.timeStopped || 0) - entry.timeStarted)
        });
      });

      return oldTiles;
    }
  }, {
    key: "onDidUpdate",
    value: function onDidUpdate(callback) {
      return this.emitter.on("did-update", callback);
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.subscriptions.dispose();
      for (var provider of this.providers) {
        provider.dispose();
      }
    }
  }]);

  return Registry;
})();

exports["default"] = Registry;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL3JlZ2lzdHJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7a0JBRWUsSUFBSTs7Ozs7O29CQUUwQixNQUFNOzt3QkFFOUIsWUFBWTs7OztJQUdaLFFBQVE7QUFRaEIsV0FSUSxRQUFRLEdBUWI7MEJBUkssUUFBUTs7QUFTekIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFDO0FBQzdCLFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUMzQixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFDO0FBQy9DLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFckMsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzFCLFFBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0dBQ3pCOzs7O2VBaEJrQixRQUFROztXQWtCckIsa0JBQWE7OztBQUNqQixVQUFNLFFBQVEsR0FBRywyQkFBYyxDQUFDO0FBQ2hDLGNBQVEsQ0FBQyxRQUFRLENBQUMsVUFBQyxJQUFrQixFQUFLO1lBQXJCLEtBQUssR0FBUCxJQUFrQixDQUFoQixLQUFLO1lBQUUsT0FBTyxHQUFoQixJQUFrQixDQUFULE9BQU87O0FBQ2pDLGNBQUssU0FBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDMUMsQ0FBQyxDQUFDO0FBQ0gsY0FBUSxDQUFDLFdBQVcsQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUM1QixjQUFLLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7T0FDcEMsQ0FBQyxDQUFDO0FBQ0gsY0FBUSxDQUFDLGdCQUFnQixDQUFDLFVBQUMsS0FBbUIsRUFBSztZQUF0QixLQUFLLEdBQVAsS0FBbUIsQ0FBakIsS0FBSztZQUFFLFFBQVEsR0FBakIsS0FBbUIsQ0FBVixRQUFROztBQUMxQyxjQUFLLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7T0FDbkQsQ0FBQyxDQUFDO0FBQ0gsY0FBUSxDQUFDLFVBQVUsQ0FBQyxZQUFNO0FBQ3hCLGNBQUssV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQzVCLENBQUMsQ0FBQztBQUNILGNBQVEsQ0FBQyxZQUFZLENBQUMsWUFBTTtBQUMxQixjQUFLLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzQixjQUFLLFNBQVMsVUFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQ2pDLENBQUMsQ0FBQztBQUNILFVBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLGFBQU8sUUFBUSxDQUFDO0tBQ2pCOzs7V0FDUSxtQkFBQyxRQUFrQixFQUFFLEtBQWEsRUFBRSxPQUF3QixFQUFRO0FBQzNFLFVBQU0sR0FBRyxHQUFNLFFBQVEsQ0FBQyxFQUFFLFVBQUssS0FBSyxBQUFFLENBQUM7QUFDdkMsVUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTs7QUFFMUIsY0FBTSxJQUFJLEtBQUssY0FBWSxLQUFLLHNCQUFtQixDQUFDO09BQ3JEOztBQUVELFVBQU0sS0FBSyxHQUFHO0FBQ1osV0FBRyxFQUFILEdBQUc7QUFDSCxhQUFLLEVBQUwsS0FBSztBQUNMLGdCQUFRLEVBQVIsUUFBUTtBQUNSLG1CQUFXLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUN2QixtQkFBVyxFQUFFLElBQUk7QUFDakIsZUFBTyxFQUFQLE9BQU87T0FDUixDQUFDO0FBQ0YsVUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwQyxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNqQzs7O1dBQ1csc0JBQUMsUUFBa0IsRUFBRSxLQUFhLEVBQVE7QUFDcEQsVUFBTSxHQUFHLEdBQU0sUUFBUSxDQUFDLEVBQUUsVUFBSyxLQUFLLEFBQUUsQ0FBQztBQUN2QyxVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQyxVQUFJLEtBQUssRUFBRTtBQUNULFlBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUIsWUFBSSxDQUFDLFFBQVEsVUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO09BQ2pDO0tBQ0Y7OztXQUNnQiwyQkFBQyxRQUFrQixFQUFFLEtBQWEsRUFBRSxRQUFnQixFQUFRO0FBQzNFLFVBQU0sTUFBTSxHQUFNLFFBQVEsQ0FBQyxFQUFFLFVBQUssUUFBUSxBQUFFLENBQUM7QUFDN0MsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEMsVUFBSSxDQUFDLEtBQUssRUFBRTtBQUNWLGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsUUFBUSxVQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTdCLFdBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLFdBQUssQ0FBQyxHQUFHLEdBQU0sUUFBUSxDQUFDLEVBQUUsVUFBSyxLQUFLLEFBQUUsQ0FBQzs7QUFFdkMsVUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwQyxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNqQzs7O1dBQ1UscUJBQUMsUUFBa0IsRUFBUTs7O0FBQ3BDLFVBQUksYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMxQixVQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUM3QixZQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFO0FBQy9CLHVCQUFhLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLGlCQUFLLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QixpQkFBSyxRQUFRLFVBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDakM7T0FDRixDQUFDLENBQUM7QUFDSCxVQUFJLGFBQWEsRUFBRTtBQUNqQixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztPQUNqQztLQUNGOzs7V0FDYyx5QkFBQyxNQUFzQixFQUFRO0FBQzVDLFlBQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO0FBQ2xDLGFBQU8sQ0FBQyxFQUFFLEVBQUU7QUFDVixZQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUU7QUFDNUMsY0FBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLGdCQUFNO1NBQ1A7T0FDRjtBQUNELFVBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNwRDs7O1dBQ2EsMEJBQTBCO0FBQ3RDLGFBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUM1QyxVQUFDLENBQUMsRUFBRSxDQUFDO2VBQUssQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVztPQUFBLENBQ3hDLENBQUM7S0FDSDs7O1dBQ1UsdUJBQStDOzs7QUFDeEQsVUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDOztBQUVwQixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUNsQyxZQUFJLE9BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTztBQUN6QyxnQkFBUSxDQUFDLElBQUksQ0FBQztBQUNaLGVBQUssRUFBRSxLQUFLLENBQUMsS0FBSztBQUNsQixrQkFBUSxFQUFFLHFCQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUEsR0FBSSxLQUFLLENBQUMsV0FBVyxDQUFDO1NBQzNELENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7QUFFSCxhQUFPLFFBQVEsQ0FBQztLQUNqQjs7O1dBQ1UscUJBQUMsUUFBa0IsRUFBZTtBQUMzQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNoRDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzdCLFdBQUssSUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNyQyxnQkFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQ3BCO0tBQ0Y7OztTQXBJa0IsUUFBUTs7O3FCQUFSLFFBQVEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9idXN5LXNpZ25hbC9saWIvcmVnaXN0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgbXMgZnJvbSBcIm1zXCI7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLXVucmVzb2x2ZWRcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIgfSBmcm9tIFwiYXRvbVwiO1xuXG5pbXBvcnQgUHJvdmlkZXIgZnJvbSBcIi4vcHJvdmlkZXJcIjtcbmltcG9ydCB0eXBlIHsgU2lnbmFsSW50ZXJuYWwsIFNpZ25hbE9wdGlvbnMgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWdpc3RyeSB7XG4gIGVtaXR0ZXI6IEVtaXR0ZXI7XG4gIHByb3ZpZGVyczogU2V0PFByb3ZpZGVyPjtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBzdGF0dXNlczogTWFwPHN0cmluZywgU2lnbmFsSW50ZXJuYWw+O1xuICBzdGF0dXNIaXN0b3J5OiBBcnJheTxTaWduYWxJbnRlcm5hbD47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcbiAgICB0aGlzLnByb3ZpZGVycyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKTtcblxuICAgIHRoaXMuc3RhdHVzZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5zdGF0dXNIaXN0b3J5ID0gW107XG4gIH1cbiAgLy8gUHVibGljIG1ldGhvZFxuICBjcmVhdGUoKTogUHJvdmlkZXIge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IFByb3ZpZGVyKCk7XG4gICAgcHJvdmlkZXIub25EaWRBZGQoKHsgdGl0bGUsIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgdGhpcy5zdGF0dXNBZGQocHJvdmlkZXIsIHRpdGxlLCBvcHRpb25zKTtcbiAgICB9KTtcbiAgICBwcm92aWRlci5vbkRpZFJlbW92ZSh0aXRsZSA9PiB7XG4gICAgICB0aGlzLnN0YXR1c1JlbW92ZShwcm92aWRlciwgdGl0bGUpO1xuICAgIH0pO1xuICAgIHByb3ZpZGVyLm9uRGlkQ2hhbmdlVGl0bGUoKHsgdGl0bGUsIG9sZFRpdGxlIH0pID0+IHtcbiAgICAgIHRoaXMuc3RhdHVzQ2hhbmdlVGl0bGUocHJvdmlkZXIsIHRpdGxlLCBvbGRUaXRsZSk7XG4gICAgfSk7XG4gICAgcHJvdmlkZXIub25EaWRDbGVhcigoKSA9PiB7XG4gICAgICB0aGlzLnN0YXR1c0NsZWFyKHByb3ZpZGVyKTtcbiAgICB9KTtcbiAgICBwcm92aWRlci5vbkRpZERpc3Bvc2UoKCkgPT4ge1xuICAgICAgdGhpcy5zdGF0dXNDbGVhcihwcm92aWRlcik7XG4gICAgICB0aGlzLnByb3ZpZGVycy5kZWxldGUocHJvdmlkZXIpO1xuICAgIH0pO1xuICAgIHRoaXMucHJvdmlkZXJzLmFkZChwcm92aWRlcik7XG4gICAgcmV0dXJuIHByb3ZpZGVyO1xuICB9XG4gIHN0YXR1c0FkZChwcm92aWRlcjogUHJvdmlkZXIsIHRpdGxlOiBzdHJpbmcsIG9wdGlvbnM/OiA/U2lnbmFsT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGtleSA9IGAke3Byb3ZpZGVyLmlkfTo6JHt0aXRsZX1gO1xuICAgIGlmICh0aGlzLnN0YXR1c2VzLmhhcyhrZXkpKSB7XG4gICAgICAvLyBUaGlzIHdpbGwgaGVscCBjYXRjaCBidWdzIGluIHByb3ZpZGVyc1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdGF0dXMgJyR7dGl0bGV9JyBpcyBhbHJlYWR5IHNldGApO1xuICAgIH1cblxuICAgIGNvbnN0IGVudHJ5ID0ge1xuICAgICAga2V5LFxuICAgICAgdGl0bGUsXG4gICAgICBwcm92aWRlcixcbiAgICAgIHRpbWVTdGFydGVkOiBEYXRlLm5vdygpLFxuICAgICAgdGltZVN0b3BwZWQ6IG51bGwsXG4gICAgICBvcHRpb25zXG4gICAgfTtcbiAgICB0aGlzLnN0YXR1c2VzLnNldChlbnRyeS5rZXksIGVudHJ5KTtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC11cGRhdGVcIik7XG4gIH1cbiAgc3RhdHVzUmVtb3ZlKHByb3ZpZGVyOiBQcm92aWRlciwgdGl0bGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGtleSA9IGAke3Byb3ZpZGVyLmlkfTo6JHt0aXRsZX1gO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5zdGF0dXNlcy5nZXQoa2V5KTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMucHVzaEludG9IaXN0b3J5KHZhbHVlKTtcbiAgICAgIHRoaXMuc3RhdHVzZXMuZGVsZXRlKGtleSk7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC11cGRhdGVcIik7XG4gICAgfVxuICB9XG4gIHN0YXR1c0NoYW5nZVRpdGxlKHByb3ZpZGVyOiBQcm92aWRlciwgdGl0bGU6IHN0cmluZywgb2xkVGl0bGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG9sZEtleSA9IGAke3Byb3ZpZGVyLmlkfTo6JHtvbGRUaXRsZX1gO1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5zdGF0dXNlcy5nZXQob2xkS2V5KTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0dXNlcy5kZWxldGUob2xkS2V5KTtcblxuICAgIGVudHJ5LnRpdGxlID0gdGl0bGU7XG4gICAgZW50cnkua2V5ID0gYCR7cHJvdmlkZXIuaWR9Ojoke3RpdGxlfWA7XG5cbiAgICB0aGlzLnN0YXR1c2VzLnNldChlbnRyeS5rZXksIGVudHJ5KTtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC11cGRhdGVcIik7XG4gIH1cbiAgc3RhdHVzQ2xlYXIocHJvdmlkZXI6IFByb3ZpZGVyKTogdm9pZCB7XG4gICAgbGV0IHRyaWdnZXJVcGRhdGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXR1c2VzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgaWYgKHZhbHVlLnByb3ZpZGVyID09PSBwcm92aWRlcikge1xuICAgICAgICB0cmlnZ2VyVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wdXNoSW50b0hpc3RvcnkodmFsdWUpO1xuICAgICAgICB0aGlzLnN0YXR1c2VzLmRlbGV0ZSh2YWx1ZS5rZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0cmlnZ2VyVXBkYXRlKSB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC11cGRhdGVcIik7XG4gICAgfVxuICB9XG4gIHB1c2hJbnRvSGlzdG9yeShzdGF0dXM6IFNpZ25hbEludGVybmFsKTogdm9pZCB7XG4gICAgc3RhdHVzLnRpbWVTdG9wcGVkID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgaSA9IHRoaXMuc3RhdHVzSGlzdG9yeS5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKHRoaXMuc3RhdHVzSGlzdG9yeVtpXS5rZXkgPT09IHN0YXR1cy5rZXkpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNIaXN0b3J5LnNwbGljZShpLCAxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzSGlzdG9yeS5wdXNoKHN0YXR1cyk7XG4gICAgdGhpcy5zdGF0dXNIaXN0b3J5ID0gdGhpcy5zdGF0dXNIaXN0b3J5LnNsaWNlKC0xMCk7XG4gIH1cbiAgZ2V0VGlsZXNBY3RpdmUoKTogQXJyYXk8U2lnbmFsSW50ZXJuYWw+IHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnN0YXR1c2VzLnZhbHVlcygpKS5zb3J0KFxuICAgICAgKGEsIGIpID0+IGIudGltZVN0YXJ0ZWQgLSBhLnRpbWVTdGFydGVkXG4gICAgKTtcbiAgfVxuICBnZXRUaWxlc09sZCgpOiBBcnJheTx7IHRpdGxlOiBzdHJpbmcsIGR1cmF0aW9uOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IG9sZFRpbGVzID0gW107XG5cbiAgICB0aGlzLnN0YXR1c0hpc3RvcnkuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBpZiAodGhpcy5zdGF0dXNlcy5oYXMoZW50cnkua2V5KSkgcmV0dXJuO1xuICAgICAgb2xkVGlsZXMucHVzaCh7XG4gICAgICAgIHRpdGxlOiBlbnRyeS50aXRsZSxcbiAgICAgICAgZHVyYXRpb246IG1zKChlbnRyeS50aW1lU3RvcHBlZCB8fCAwKSAtIGVudHJ5LnRpbWVTdGFydGVkKVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2xkVGlsZXM7XG4gIH1cbiAgb25EaWRVcGRhdGUoY2FsbGJhY2s6IEZ1bmN0aW9uKTogSURpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oXCJkaWQtdXBkYXRlXCIsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgZm9yIChjb25zdCBwcm92aWRlciBvZiB0aGlzLnByb3ZpZGVycykge1xuICAgICAgcHJvdmlkZXIuZGlzcG9zZSgpO1xuICAgIH1cbiAgfVxufVxuIl19