var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _panel = require('./panel');

var _panel2 = _interopRequireDefault(_panel);

var _commands = require('./commands');

var _commands2 = _interopRequireDefault(_commands);

var _statusBar = require('./status-bar');

var _statusBar2 = _interopRequireDefault(_statusBar);

var _busySignal = require('./busy-signal');

var _busySignal2 = _interopRequireDefault(_busySignal);

var _intentions = require('./intentions');

var _intentions2 = _interopRequireDefault(_intentions);

var Editors = undefined;
var TreeView = undefined;

var LinterUI = (function () {
  function LinterUI() {
    _classCallCheck(this, LinterUI);

    this.name = 'Linter';
    this.idleCallbacks = new Set();
    this.signal = new _busySignal2['default']();
    this.commands = new _commands2['default']();
    this.messages = [];
    this.statusBar = new _statusBar2['default']();
    this.intentions = new _intentions2['default']();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.signal);
    this.subscriptions.add(this.commands);
    this.subscriptions.add(this.statusBar);

    var obsShowPanelCB = window.requestIdleCallback((function observeShowPanel() {
      this.idleCallbacks['delete'](obsShowPanelCB);
      this.panel = new _panel2['default']();
      this.panel.update(this.messages);
    }).bind(this));
    this.idleCallbacks.add(obsShowPanelCB);

    var obsShowDecorationsCB = window.requestIdleCallback((function observeShowDecorations() {
      var _this = this;

      this.idleCallbacks['delete'](obsShowDecorationsCB);
      if (!Editors) {
        Editors = require('./editors');
      }
      this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', function (showDecorations) {
        if (showDecorations && !_this.editors) {
          _this.editors = new Editors();
          _this.editors.update({
            added: _this.messages,
            removed: [],
            messages: _this.messages
          });
        } else if (!showDecorations && _this.editors) {
          _this.editors.dispose();
          _this.editors = null;
        }
      }));
    }).bind(this));
    this.idleCallbacks.add(obsShowDecorationsCB);
  }

  _createClass(LinterUI, [{
    key: 'render',
    value: function render(difference) {
      var editors = this.editors;

      this.messages = difference.messages;
      if (editors) {
        if (editors.isFirstRender()) {
          editors.update({
            added: difference.messages,
            removed: [],
            messages: difference.messages
          });
        } else {
          editors.update(difference);
        }
      }
      // Initialize the TreeView subscription if necessary
      if (!this.treeview) {
        if (!TreeView) {
          TreeView = require('./tree-view');
        }
        this.treeview = new TreeView();
        this.subscriptions.add(this.treeview);
      }
      this.treeview.update(difference.messages);

      if (this.panel) {
        this.panel.update(difference.messages);
      }
      this.commands.update(difference.messages);
      this.intentions.update(difference.messages);
      this.statusBar.update(difference.messages);
    }
  }, {
    key: 'didBeginLinting',
    value: function didBeginLinting(linter, filePath) {
      this.signal.didBeginLinting(linter, filePath);
    }
  }, {
    key: 'didFinishLinting',
    value: function didFinishLinting(linter, filePath) {
      this.signal.didFinishLinting(linter, filePath);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.idleCallbacks.forEach(function (callbackID) {
        return window.cancelIdleCallback(callbackID);
      });
      this.idleCallbacks.clear();
      this.subscriptions.dispose();
      if (this.panel) {
        this.panel.dispose();
      }
      if (this.editors) {
        this.editors.dispose();
      }
    }
  }]);

  return LinterUI;
})();

module.exports = LinterUI;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVvQyxNQUFNOztxQkFDeEIsU0FBUzs7Ozt3QkFDTixZQUFZOzs7O3lCQUNYLGNBQWM7Ozs7MEJBQ2IsZUFBZTs7OzswQkFDZixjQUFjOzs7O0FBR3JDLElBQUksT0FBTyxZQUFBLENBQUE7QUFDWCxJQUFJLFFBQVEsWUFBQSxDQUFBOztJQUVOLFFBQVE7QUFhRCxXQWJQLFFBQVEsR0FhRTswQkFiVixRQUFROztBQWNWLFFBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFBO0FBQ3BCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUM5QixRQUFJLENBQUMsTUFBTSxHQUFHLDZCQUFnQixDQUFBO0FBQzlCLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUM5QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsU0FBUyxHQUFHLDRCQUFlLENBQUE7QUFDaEMsUUFBSSxDQUFDLFVBQVUsR0FBRyw2QkFBZ0IsQ0FBQTtBQUNsQyxRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDbkMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ3JDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFFdEMsUUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUMvQyxDQUFBLFNBQVMsZ0JBQWdCLEdBQUc7QUFDMUIsVUFBSSxDQUFDLGFBQWEsVUFBTyxDQUFDLGNBQWMsQ0FBQyxDQUFB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M0MsVUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0tBQzNDOzs7V0FDYyx5QkFBQyxNQUFjLEVBQUUsUUFBZ0IsRUFBRTtBQUNoRCxVQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDOUM7OztXQUNlLDBCQUFDLE1BQWMsRUFBRSxRQUFnQixFQUFFO0FBQ2pELFVBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQy9DOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQUEsVUFBVTtlQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7T0FBQSxDQUFDLENBQUE7QUFDL0UsVUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUMxQixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzVCLFVBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNkLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDckI7QUFDRCxVQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDaEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUN2QjtLQUNGOzs7U0E3R0csUUFBUTs7O0FBZ0hkLE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBQYW5lbCBmcm9tICcuL3BhbmVsJ1xuaW1wb3J0IENvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgU3RhdHVzQmFyIGZyb20gJy4vc3RhdHVzLWJhcidcbmltcG9ydCBCdXN5U2lnbmFsIGZyb20gJy4vYnVzeS1zaWduYWwnXG5pbXBvcnQgSW50ZW50aW9ucyBmcm9tICcuL2ludGVudGlvbnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlciwgTGludGVyTWVzc2FnZSwgTWVzc2FnZXNQYXRjaCB9IGZyb20gJy4vdHlwZXMnXG5cbmxldCBFZGl0b3JzXG5sZXQgVHJlZVZpZXdcblxuY2xhc3MgTGludGVyVUkge1xuICBuYW1lOiBzdHJpbmdcbiAgcGFuZWw6IFBhbmVsXG4gIHNpZ25hbDogQnVzeVNpZ25hbFxuICBlZGl0b3JzOiA/RWRpdG9yc1xuICB0cmVldmlldzogVHJlZVZpZXdcbiAgY29tbWFuZHM6IENvbW1hbmRzXG4gIG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPlxuICBzdGF0dXNCYXI6IFN0YXR1c0JhclxuICBpbnRlbnRpb25zOiBJbnRlbnRpb25zXG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgaWRsZUNhbGxiYWNrczogU2V0PG51bWJlcj5cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm5hbWUgPSAnTGludGVyJ1xuICAgIHRoaXMuaWRsZUNhbGxiYWNrcyA9IG5ldyBTZXQoKVxuICAgIHRoaXMuc2lnbmFsID0gbmV3IEJ1c3lTaWduYWwoKVxuICAgIHRoaXMuY29tbWFuZHMgPSBuZXcgQ29tbWFuZHMoKVxuICAgIHRoaXMubWVzc2FnZXMgPSBbXVxuICAgIHRoaXMuc3RhdHVzQmFyID0gbmV3IFN0YXR1c0JhcigpXG4gICAgdGhpcy5pbnRlbnRpb25zID0gbmV3IEludGVudGlvbnMoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zaWduYWwpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmNvbW1hbmRzKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zdGF0dXNCYXIpXG5cbiAgICBjb25zdCBvYnNTaG93UGFuZWxDQiA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKFxuICAgICAgZnVuY3Rpb24gb2JzZXJ2ZVNob3dQYW5lbCgpIHtcbiAgICAgICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmRlbGV0ZShvYnNTaG93UGFuZWxDQilcbiAgICAgICAgdGhpcy5wYW5lbCA9IG5ldyBQYW5lbCgpXG4gICAgICAgIHRoaXMucGFuZWwudXBkYXRlKHRoaXMubWVzc2FnZXMpXG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgKVxuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5hZGQob2JzU2hvd1BhbmVsQ0IpXG5cbiAgICBjb25zdCBvYnNTaG93RGVjb3JhdGlvbnNDQiA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKFxuICAgICAgZnVuY3Rpb24gb2JzZXJ2ZVNob3dEZWNvcmF0aW9ucygpIHtcbiAgICAgICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmRlbGV0ZShvYnNTaG93RGVjb3JhdGlvbnNDQilcbiAgICAgICAgaWYgKCFFZGl0b3JzKSB7XG4gICAgICAgICAgRWRpdG9ycyA9IHJlcXVpcmUoJy4vZWRpdG9ycycpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5zaG93RGVjb3JhdGlvbnMnLCBzaG93RGVjb3JhdGlvbnMgPT4ge1xuICAgICAgICAgICAgaWYgKHNob3dEZWNvcmF0aW9ucyAmJiAhdGhpcy5lZGl0b3JzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZWRpdG9ycyA9IG5ldyBFZGl0b3JzKClcbiAgICAgICAgICAgICAgdGhpcy5lZGl0b3JzLnVwZGF0ZSh7XG4gICAgICAgICAgICAgICAgYWRkZWQ6IHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICAgICAgcmVtb3ZlZDogW10sXG4gICAgICAgICAgICAgICAgbWVzc2FnZXM6IHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFzaG93RGVjb3JhdGlvbnMgJiYgdGhpcy5lZGl0b3JzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZWRpdG9ycy5kaXNwb3NlKClcbiAgICAgICAgICAgICAgdGhpcy5lZGl0b3JzID0gbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICApXG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgKVxuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5hZGQob2JzU2hvd0RlY29yYXRpb25zQ0IpXG4gIH1cbiAgcmVuZGVyKGRpZmZlcmVuY2U6IE1lc3NhZ2VzUGF0Y2gpIHtcbiAgICBjb25zdCBlZGl0b3JzID0gdGhpcy5lZGl0b3JzXG5cbiAgICB0aGlzLm1lc3NhZ2VzID0gZGlmZmVyZW5jZS5tZXNzYWdlc1xuICAgIGlmIChlZGl0b3JzKSB7XG4gICAgICBpZiAoZWRpdG9ycy5pc0ZpcnN0UmVuZGVyKCkpIHtcbiAgICAgICAgZWRpdG9ycy51cGRhdGUoe1xuICAgICAgICAgIGFkZGVkOiBkaWZmZXJlbmNlLm1lc3NhZ2VzLFxuICAgICAgICAgIHJlbW92ZWQ6IFtdLFxuICAgICAgICAgIG1lc3NhZ2VzOiBkaWZmZXJlbmNlLm1lc3NhZ2VzLFxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWRpdG9ycy51cGRhdGUoZGlmZmVyZW5jZSlcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgVHJlZVZpZXcgc3Vic2NyaXB0aW9uIGlmIG5lY2Vzc2FyeVxuICAgIGlmICghdGhpcy50cmVldmlldykge1xuICAgICAgaWYgKCFUcmVlVmlldykge1xuICAgICAgICBUcmVlVmlldyA9IHJlcXVpcmUoJy4vdHJlZS12aWV3JylcbiAgICAgIH1cbiAgICAgIHRoaXMudHJlZXZpZXcgPSBuZXcgVHJlZVZpZXcoKVxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnRyZWV2aWV3KVxuICAgIH1cbiAgICB0aGlzLnRyZWV2aWV3LnVwZGF0ZShkaWZmZXJlbmNlLm1lc3NhZ2VzKVxuXG4gICAgaWYgKHRoaXMucGFuZWwpIHtcbiAgICAgIHRoaXMucGFuZWwudXBkYXRlKGRpZmZlcmVuY2UubWVzc2FnZXMpXG4gICAgfVxuICAgIHRoaXMuY29tbWFuZHMudXBkYXRlKGRpZmZlcmVuY2UubWVzc2FnZXMpXG4gICAgdGhpcy5pbnRlbnRpb25zLnVwZGF0ZShkaWZmZXJlbmNlLm1lc3NhZ2VzKVxuICAgIHRoaXMuc3RhdHVzQmFyLnVwZGF0ZShkaWZmZXJlbmNlLm1lc3NhZ2VzKVxuICB9XG4gIGRpZEJlZ2luTGludGluZyhsaW50ZXI6IExpbnRlciwgZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuc2lnbmFsLmRpZEJlZ2luTGludGluZyhsaW50ZXIsIGZpbGVQYXRoKVxuICB9XG4gIGRpZEZpbmlzaExpbnRpbmcobGludGVyOiBMaW50ZXIsIGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNpZ25hbC5kaWRGaW5pc2hMaW50aW5nKGxpbnRlciwgZmlsZVBhdGgpXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmlkbGVDYWxsYmFja3MuZm9yRWFjaChjYWxsYmFja0lEID0+IHdpbmRvdy5jYW5jZWxJZGxlQ2FsbGJhY2soY2FsbGJhY2tJRCkpXG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmNsZWFyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgaWYgKHRoaXMucGFuZWwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGlzcG9zZSgpXG4gICAgfVxuICAgIGlmICh0aGlzLmVkaXRvcnMpIHtcbiAgICAgIHRoaXMuZWRpdG9ycy5kaXNwb3NlKClcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaW50ZXJVSVxuIl19